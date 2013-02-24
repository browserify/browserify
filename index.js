var crypto = require('crypto');

var through = require('through');
var duplexer = require('duplexer');
var checkSyntax = require('syntax-error');

var mdeps = require('module-deps');
var browserPack = require('browser-pack');
var browserResolve = require('browser-resolve');
var insertGlobals = require('insert-module-globals');

var path = require('path');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;

module.exports = function (files) {
    return new Browserify(files);
};

function hash(what) {
    return crypto.createHash('md5').update(what).digest('base64').slice(0, 6);
};

inherits(Browserify, EventEmitter);

function Browserify (files) {
    this.files = [];
    this.exports = {};
    this._pending = 0;
    this._entries = [];
    this._ignore = {};
    this._external = {};
    this._expose = {};
    this._mapped = {};

    [].concat(files).filter(Boolean).forEach(this.add.bind(this));
}

Browserify.prototype.add = function (file) {
    this.require(file, { entry: true });
    return this;
};

Browserify.prototype.require = function (id, opts) {
    var self = this;
    if (opts === undefined) opts = { expose: id };
    self._pending ++;
    
    var fromfile = process.cwd() + '/_fake.js';
    
    var params = { filename: fromfile, packageFilter: packageFilter };
    browserResolve(id, params, function (err, file) {
        if (err) return self.emit('error', err);
        
        if (opts.expose) {
            self.exports[file] = hash(file);
            
            if (typeof opts.expose === 'string') {
                self._expose[file] = opts.expose;
                self._mapped[opts.expose] = file;
            }
        }
        
        self.files.push(file);
        if (opts.entry) self._entries.push(file);
        
        if (--self._pending === 0) self.emit('_ready');
    });

    return self;
};

// DEPRECATED
Browserify.prototype.expose = function (name, file) {
    this.exports[file] = name;
    this.files.push(file);
};

Browserify.prototype.external = function (file) {
    this._external[file] = true;
    return this;
};

Browserify.prototype.ignore = function (file) {
    this._ignore[file] = true;
    return this;
};

Browserify.prototype.bundle = function (opts, cb) {
    var self = this;
    if (typeof opts === 'function') {
        cb = opts;
        opts = {};
    }
    if (!opts) opts = {};
    if (opts.insertGlobals === undefined) opts.insertGlobals = false;
    if (opts.detectGlobals === undefined) opts.detectGlobals = true;
    if (opts.ignoreMissing === undefined) opts.ignoreMissing = false;
    
    if (self._pending) {
        var tr = through();
        
        self.on('_ready', function () {
            self.bundle(cb).pipe(tr);
        });
        return tr;
    }
    
    var d = self.deps(opts);
    var g = opts.detectGlobals || opts.insertGlobals
        ? insertGlobals(self.files, {
            resolve: self._resolve.bind(self),
            always: opts.insertGlobals
        })
        : through()
    ;
    var p = self.pack();
    d.pipe(g).pipe(p);
    
    if (cb) {
        var data = '';
        p.on('data', function (buf) { data += buf });
        p.on('end', function () { cb(null, data) });
        d.on('error', cb);
        p.on('error', cb);
    }
    else {
        d.on('error', self.emit.bind(self, 'error'));
        p.on('error', self.emit.bind(self, 'error'));
    }
    p.pause = function () {};
    
    return p;
};

Browserify.prototype.deps = function (params) {
    var self = this;
    var opts = {
        resolve: self._resolve.bind(self)
    };
    if (params && params.ignoreMissing) {
        opts.ignoreMissing = true;
    }
    var d = mdeps(self.files, opts);
    return d.pipe(through(write));
    
    function write (row) {
        if (row.id === emptyModulePath) {
            row.source = '';
        }
        
        if (self._expose[row.id]) {
            this.queue({
                exposed: self._expose[row.id],
                deps: {},
                source: 'module.exports = require(\'' + hash(row.id) + '\');'
            });
        }
        
        if (self.exports[row.id]) row.exposed = self.exports[row.id];
        
        if (self._external[row.id]) {
            row.source = 'module.exports = require(\'' + hash(row.id) + '\');';
        }
        
        if (/\.json$/.test(row.id)) {
            row.source = 'module.exports=' + row.source;
        }
        
        var ix = self._entries.indexOf(row.id);
        row.entry = ix >= 0;
        if (ix >= 0) row.order = ix;
        this.queue(row);
    }
};

Browserify.prototype.pack = function () {
    var self = this;
    var packer = browserPack({ raw: true });
    var ids = {};
    var idIndex = 1;
    
    var input = through(function (row) {
        var ix;

        if (row.exposed) {
            ix = row.exposed
        }
        else {
            ix = ids[row.id] !== undefined ? ids[row.id] : idIndex++;
        }
        if (ids[row.id] === undefined) ids[row.id] = ix;
        
        var err = checkSyntax(row.source, row.id);
        if (err) self.emit('error', err);
        
        row.id = ix;
        row.deps = Object.keys(row.deps).reduce(function (acc, key) {
            var file = row.deps[key];
            if (ids[file] === undefined) ids[file] = idIndex++;
            acc[key] = ids[file];
            return acc;
        }, {});
        this.queue(row);
    });
    
    var first = true;
    var hasExports = Object.keys(self.exports).length;
    var output = through(write, end);
    
    function writePrelude () {
        if (!first) return;
        if (!hasExports) return output.queue(';');
        
        output.queue('require=');
    }
    
    input.pipe(packer);
    packer.pipe(output);
    return duplexer(input, output);
    
    function write (buf) {
        if (first) writePrelude();
        first = false;
        this.queue(buf);
    }
    
    function end () {
        if (first) writePrelude();
        this.queue(';');
        this.queue(null);
    }
};

var packageFilter = function (info) {
    if (info.browserify && !info.browser) {
        info.browser = info.browserify;
    }
    return info;
};

var emptyModulePath = require.resolve('./_empty');
Browserify.prototype._resolve = function (id, parent, cb) {
    var self = this;
    parent.packageFilter = packageFilter;
    return browserResolve(id, parent, function(err, file) {
        if (err) return cb(err);
        
        if (self._mapped[id]) return cb(null, self._mapped[id]);
        if (self._ignore[file]) return cb(null, emptyModulePath);
        if (self._external[file]) return cb(null, file, true);
        
        cb(err, file);
    })
};

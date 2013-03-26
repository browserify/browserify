var crypto = require('crypto');
var through = require('through');
var duplexer = require('duplexer');
var concatStream = require('concat-stream');
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
    this._transforms = [];
    
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
    
    var basedir = opts.basedir || process.cwd();
    var fromfile = basedir + '/_fake.js';
    
    var params = { filename: fromfile, packageFilter: packageFilter };
    browserResolve(id, params, function (err, file) {
        if (err) return self.emit('error', err);
        if (!file) return self.emit('error', new Error(
            'module ' + JSON.stringify(id) + ' not found in require()'
        ));
        
        if (opts.expose) {
            self.exports[file] = hash(file);
            
            if (typeof opts.expose === 'string') {
                self._expose[file] = opts.expose;
                self._mapped[opts.expose] = file;
            }
        }

        if (opts.external) {
            self._external[file] = true;
        }
        else {
            self.files.push(file);
        }
        
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

Browserify.prototype.external = function (id, opts) {
    opts = opts || {};
    opts.external = true;
    return this.require(id, opts);
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
    
    opts.resolve = self._resolve.bind(self);
    opts.transform = self._transforms;
    opts.transformKey = [ 'browserify', 'transform' ];
    
    var parentFilter = opts.packageFilter;
    opts.packageFilter = function (pkg) {
        if (parentFilter) pkg = parentFilter(pkg);
        return packageFilter(pkg);
    };
    
    if (self._pending) {
        var tr = through();
        self.on('_ready', function () {
            var b = self.bundle(opts, cb);
            if (!cb) b.on('error', tr.emit.bind(tr, 'error'));
            b.pipe(tr);
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
    var p = self.pack(opts.debug);
    if (cb) {
        p.on('error', cb);
        p.pipe(concatStream(cb));
    }
    
    d.on('error', p.emit.bind(p, 'error'));
    g.on('error', p.emit.bind(p, 'error'));
    d.pipe(g).pipe(p);
    
    return p;
};

Browserify.prototype.transform = function (t) {
    if (typeof t === 'string' && /^\./.test(t)) {
        t = path.resolve(t);
    }
    this._transforms.push(t);
    return this;
};

Browserify.prototype.deps = function (opts) {
    var self = this;
    var d = mdeps(self.files, opts);
    var tr = d.pipe(through(write));
    d.on('error', tr.emit.bind(tr, 'error'));
    return tr;
    
    function write (row) {
        if (row.id === emptyModulePath) {
            row.source = '';
        }
        
        if (self._expose[row.id]) {
            this.queue({
                exposed: self._expose[row.id],
                deps: {},
                source: 'module.exports=require(\'' + hash(row.id) + '\');'
            });
        }
        
        if (self.exports[row.id]) row.exposed = self.exports[row.id];

        // skip adding this file if it is external
        if (self._external[row.id]) {
            return;
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

Browserify.prototype.pack = function (debug) {
    var self = this;
    var packer = browserPack({ raw: true });
    var ids = {};
    var idIndex = 1;
    
    var input = through(function (row) {
        var ix;

        if (debug) { 
            row.sourceRoot = 'file://localhost'; 
            row.sourceFile = row.id;
        }

        if (row.exposed) {
            ix = row.exposed;
        }
        else {
            ix = ids[row.id] !== undefined ? ids[row.id] : idIndex++;
        }
        if (ids[row.id] === undefined) ids[row.id] = ix;
        
        if (/^#!/.test(row.source)) row.source = '//' + row.source;
        var err = checkSyntax(row.source, row.id);
        if (err) self.emit('error', err);
        
        row.id = ix;
        row.deps = Object.keys(row.deps).reduce(function (acc, key) {
            var file = row.deps[key];

            // reference external and exposed files directly by hash
            if (self._external[file] || self._expose[file]) {
                acc[key] = hash(file);
                return acc;
            }

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
        this.queue('\n;');
        this.queue(null);
    }
};

var packageFilter = function (info) {
    if (typeof info.browserify === 'string' && !info.browser) {
        info.browser = info.browserify;
    }
    return info;
};

var emptyModulePath = require.resolve('./_empty');
Browserify.prototype._resolve = function (id, parent, cb) {
    var self = this;
    if (self._mapped[id]) return cb(null, self._mapped[id]);
    
    return browserResolve(id, parent, function(err, file) {
        if (err) return cb(err);
        if (!file) return cb(new Error('module '
            + JSON.stringify(id) + ' not found from '
            + JSON.stringify(parent.filename)
        ));
        
        if (self._ignore[file]) return cb(null, emptyModulePath);
        if (self._external[file]) return cb(null, file, true);
        
        cb(err, file);
    });
};

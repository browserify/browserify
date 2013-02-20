var through = require('through');
var duplexer = require('duplexer');
var checkSyntax = require('syntax-error');

var mdeps = require('module-deps');
var browserPack = require('browser-pack');
var browserResolve = require('browser-resolve');
var insertGlobals = require('insert-globals');

var path = require('path');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;

module.exports = function (files) {
    return new Browserify(files);
};

inherits(Browserify, EventEmitter);

function Browserify (files) {
    this.files = [];
    this.exports = {};
    this._pending = 0;
    this._entries = [];
    this._ignore = {};
    
    [].concat(files).filter(Boolean).forEach(this.add.bind(this));
}

Browserify.prototype.add = function (file) {
    var r = path.resolve(file);
    this.files.push(r);
    this._entries.push(r);
};

Browserify.prototype.require = function (name, fromFile) {
    var self = this;
    if (!fromFile) {
        fromFile = path.join(process.cwd(), '_fake');
    }
    self._pending ++;
    
    var opts = { filename: fromFile, packageFilter: packageFilter };
    browserResolve(name, opts, function (err, file) {
        if (err) return self.emit('error', err);
        self.expose(name, file);
        if (--self._pending === 0) self.emit('_ready');
    });
    
    return self;
};

Browserify.prototype.expose = function (name, file) {
    this.exports[file] = name;
    this.files.push(file);
};

Browserify.prototype.ignore = function (file) {
    this._ignore[file] = true;
};

Browserify.prototype.bundle = function (cb) {
    var self = this;
    
    if (self._pending) {
        var tr = through();
        
        self.on('_ready', function () {
            self.bundle(cb).pipe(tr);
        });
        return tr;
    }
    
    var d = self.deps();
    var g = insertGlobals(self.files, { resolve: self._resolve.bind(self) });
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
    
    return p;
};

Browserify.prototype.deps = function () {
    var self = this;
    var d = mdeps(self.files, { resolve: self._resolve.bind(self) });
    return d.pipe(through(function (row) {
        if (row.id === emptyModulePath) return;
        
        var ix = self._entries.indexOf(row.id);
        row.entry = ix >= 0;
        if (ix >= 0) row.order = ix;
        this.queue(row);
    }));
};

Browserify.prototype.pack = function () {
    var self = this;
    var packer = browserPack({ raw: true });
    var ids = {};
    var idIndex = 0;
    
    var input = through(function (row) {
        var ix;
        if (self.exports[row.id] !== undefined) {
            ix = self.exports[row.id];
        }
        else {
            ix = ids[row.id] !== undefined ? ids[row.id] : idIndex++;
        }
        if (ids[row.id] === undefined) ids[row.id] = ix;
        
        if (/\.json$/.test(row.id)) {
            row.source = 'module.exports=' + row.source;
        }
        
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
        output.queue([
            'require=(function(o,r){',
                'return function(n){',
                    'var x=r(n);',
                    'if(x!==undefined)return x;',
                    'if(o)return o(n);',
                    'throw new Error("Cannot find module \'"+n+"\'")',
                '}',
            '})(typeof require!=="undefined"&&require,',
        ].join(''));
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
        this.queue(hasExports ? ');' : ';');
        this.emit('end');
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
    if (this._ignore[id]) return cb(null, emptyModulePath);
    var r = path.resolve(path.dirname(parent.filename), id);
    if (this._ignore[r]) return cb(null, emptyModulePath);
    
    parent.packageFilter = packageFilter;
    return browserResolve(id, parent, cb);
};

var crypto = require('crypto');
var through2 = require('through2');
var pipeline = require('stream-combiner');
var concatStream = require('concat-stream');
var checkSyntax = require('syntax-error');
var parents = require('parents');
var deepEqual = require('deep-equal');
var defined = require('defined');
var builtins = require('./lib/builtins.js');
var builtinsList = require('builtins');

var mdeps = require('module-deps');
var browserPack = require('browser-pack');
var depSorter = require('deps-sort');
var browserResolve = require('browser-resolve');
var nodeResolve = require('resolve');
var insertGlobals = require('insert-module-globals');
var umd = require('umd');
var derequire = require('derequire');
var commondir = require('commondir');

var path = require('path');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var copy = require('shallow-copy');

var emptyModulePath = path.join(__dirname, 'lib/_empty.js');
var excludeModulePath = path.join(__dirname, 'lib/_exclude.js');

module.exports = function (opts, xopts) {
    if (opts === undefined) opts = {};
    if (typeof opts === 'string') opts = { entries: [ opts ] };
    if (isStream(opts)) opts = { entries: [ opts ] };
    if (Array.isArray(opts)) opts = { entries: opts };
    
    if (xopts) Object.keys(xopts).forEach(function (key) {
        opts[key] = xopts[key];
    });
    
    var b = new Browserify(opts);
    [].concat(opts.entries).filter(Boolean).forEach(b.add.bind(b));
    return b;
};

function hash(what) {
    return crypto.createHash('md5').update(what).digest('base64').slice(0, 6);
}

inherits(Browserify, EventEmitter);

function Browserify (opts) {
    var self = this;
    
    self.files = [];
    self.exports = {};
    self._pending = 0;
    self._entries = [];
    self._ignore = {};
    self._exclude = {};
    self._external = {};
    self._expose = {};
    self._mapped = {};
    self._plugins = [];
    
    self._transforms = [];
    self._globalTransforms = [];
    self._extensions = [ '.js', '.json' ]
        .concat(opts.extensions).filter(Boolean)
    ;
    self._noParse = [];
    self._pkgcache = {};
    self._exposeAll = opts.exposeAll;
    self._ignoreMissing = opts.ignoreMissing;
    self._basedir = opts.basedir;
    self._delegateResolve = opts.resolve || browserResolve;
    
    var sep = /^win/i.test(process.platform) ? ';' : ':';
    self._paths = opts.paths || (process.env.NODE_PATH || '').split(sep);
    self._fullPaths = !!opts.fullPaths;

    self._browserPack = opts.pack || function (params) {
        params.raw = true;
        params.sourceMapPrefix = '//#';
        return browserPack(params);
    };
    
    if (typeof opts.builtins === 'boolean') {
        self._builtins = opts.builtins ? builtins : {};
    }
    else if (Array.isArray(opts.builtins)) {
        self._builtins = {};
        opts.builtins.forEach(function (name) {
            if (builtins.hasOwnProperty(name)) {
                self._builtins[name] = builtins[name];
            }      
        });
    }
    else if (typeof opts.builtins === 'object') {
        self._builtins = opts.builtins;
    }
    else {
        self._builtins = builtins;
    }
    
    builtinsList.forEach(function (key) {
        if (!self._builtins.hasOwnProperty(key)) {
            self._exclude[key] = true;
        }
    });
    
    self._commondir = opts.commondir;
    
    var noParse = [].concat(opts.noParse).filter(Boolean);
    noParse.forEach(this.noParse.bind(this));
}

Browserify.prototype._hash = function (id) {
    var basedir = this._basedir;
    if (!basedir) basedir = process.cwd();
    return hash(path.relative(basedir, id));
}

Browserify.prototype.noParse = function(file) {
    var self = this;
    var cwd = process.cwd();
    var top = { id: cwd, filename: cwd + '/_fake.js', paths: [] };
    self._noParse.push(file, path.resolve(file));
    self._pending ++;
    self._resolve(file, top, function (err, r) {
        if (r) self._noParse.push(r);
        if (--self._pending === 0) self.emit('_ready');
    });
    return this;
};

Browserify.prototype.add = function (file) {
    this.require(file, { entry: true });
    return this;
};

Browserify.prototype.require = function (id, opts) {
    var self = this;
    if (isStream(id)) {
        self.files.push(id);
        if (opts.entry) self._entries.push(id.path);
        return self;
    }
    
    if (opts === undefined) opts = { expose: id };
    
    self._pending ++;
    
    var basedir = opts.basedir || self._basedir || process.cwd();
    var fromfile = basedir + '/_fake.js';
    
    var params = {
        filename: fromfile,
        modules: self._builtins,
        packageFilter: packageFilter,
        extensions: self._extensions,
        paths: opts.paths || self._paths
    };
    
    var order;
    if (opts.entry) {
        order = self._entries.length;
        self._entries.push(null);
    }
    
    self._delegateResolve(id, params, function (err, file) {
        if ((err || !file) && !opts.external) {
            if (err) return self.emit('error', err);
            if (!file) return self.emit('error', notFound(id, fromfile));
        }
        
        if (opts.expose) {
            self.exports[file] = self._hash(file);
            
            if (typeof opts.expose === 'string') {
                self._expose[file] = opts.expose;
                self._mapped[opts.expose] = file;
            }
        }
        
        if (opts.external) {
            if (file) self._external[file] = true;
            else {
                self._external[id] = true;
                if (self._basedir) {
                    self._external[path.resolve(self._basedir, id)] = true;
                }
                else self._external[path.resolve(id)] = true;
            }
        }
        else {
            self.files.push(file);
        }
        
        if (opts.entry) self._entries[order] = file;
        
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
    var self = this;
    if (!opts) opts = {};
    if (!opts.basedir) opts.basedir = self._basedir;
    if (!opts.globalTransform) opts.globalTransform = self._globalTransforms;
    
    if (isBrowserify(id)) {
        self._pending++;
        
        function captureDeps() {
            var d = mdeps(id.files, opts);
            d.on('error', self.emit.bind(self, 'error'));
            d.pipe(through2.obj(write, end));
            
            function write (row, encoding, callback) {
                self.external(row.id);
                callback();
            }
            function end (callback) {
                if (--self._pending === 0) self.emit('_ready');
                callback();
            }
        }
        if (id._pending === 0) return captureDeps();
        return id.once('_ready', captureDeps);
    }
    
    opts.external = true;
    if (!opts.parse) {
        this.noParse(id);
        if (opts.expose) this.noParse(opts.expose);
    }
    return this.require(id, opts);
};

Browserify.prototype.ignore = function (file) {
    this._ignore[file] = true;
    if (this._basedir) {
        this._ignore[path.resolve(this._basedir, file)] = true;
    }
    else this._ignore[path.resolve(file)] = true;
    return this;
};

Browserify.prototype.exclude = function (file) {
    this.ignore(file);
    this._exclude[file] = true;
    if (this._basedir) {
        this._exclude[path.resolve(this._basedir, file)] = true;
    }
    else this._exclude[path.resolve(file)] = true;
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
    if (opts.standalone === undefined) opts.standalone = false;
    
    self._ignoreMissing = opts.ignoreMissing;
    
    opts.resolve = self._resolve.bind(self);
    opts.transform = self._transforms;
    
    var basedir = opts.basedir || self._basedir;
    if (!basedir && self._commondir === false) {
        basedir = '/';
    }
    else if (!basedir && self.files.length === 1) {
        basedir = path.dirname(self.files[0]);
    }
    else if (!basedir && self.files.length === 0) {
        basedir = process.cwd();
    }
    else if (!basedir) basedir = commondir(self.files);
    
    if (opts.detectGlobals || opts.insertGlobals) {
        opts.globalTransform = [ function (file) {
            if (self._noParse.indexOf(file) >= 0) {
                return through2();
            }
            return insertGlobals(file, {
                always: opts.insertGlobals,
                vars: opts.insertGlobalVars,
                basedir: basedir
            });
        } ].concat(self._globalTransforms);
    }
    else opts.globalTransform = self._globalTransforms;
    
    opts.noParse = self._noParse;
    opts.transformKey = [ 'browserify', 'transform' ];
    
    var parentFilter = opts.packageFilter;
    opts.packageFilter = function (pkg) {
        if (parentFilter) pkg = parentFilter(pkg || {});
        return packageFilter(pkg || {});
    };

    if (cb) cb = (function (f) {
        return function () {
            if (f) f.apply(this, arguments);
            f = null;
        };
    })(cb);

    if (self._pending) {
        var tr = through2();
        self.on('_ready', function () {
            var b = self.bundle(opts, cb);
            b.on('transform', tr.emit.bind(tr, 'transform'));
            if (!cb) b.on('error', tr.emit.bind(tr, 'error'));
            b.pipe(tr);
        });
        if (cb) tr.resume();
        return tr;
    }

    if (opts.standalone && self._entries.length !== 1) {
        process.nextTick(function () {
            p.emit('error', 'standalone only works with a single entry point');
        });
    }
    
    var prevCache = opts.cache && copy(opts.cache);
    var d = (opts.deps || self.deps.bind(self))(opts);
    var p = self.pack(opts);
    if (cb) {
        p.on('error', cb);
        p.pipe(concatStream({ encoding: 'string' }, function (src) {
            cb(null, opts.standalone ? derequire(src) : src);
        }));
        p.resume();
    }
    d.on('error', p.emit.bind(p, 'error'));
    d.on('transform', p.emit.bind(p, 'transform'));
    d.pipe(p);
    
    if (opts.standalone) {
        var output = through2();
        p.pipe(concatStream({ encoding: 'string' }, function (body) {
            output.end(derequire(body));
        }));
        return output;
    }
    
    self.emit('bundle', p);
    p.on('end', function () {
        process.nextTick(function () {
            p.emit('close');
        });
    });
    return p;
};

Browserify.prototype.transform = function (opts, t) {
    if (t === undefined) {
        t = opts;
        opts = {};
    }
    if (!opts) opts = {};
    if (typeof t === 'string') {
        try {
            t = /^\./.test(t)
                ? require(path.resolve(t))
                : require(t)
            ;
        }
        catch (err) {
            t = require(nodeResolve.sync(
                t, { basedir: this._basedir || process.cwd() }
            ));
        }
    }
    t = (function (t) {
        return function (file) { return t.call(this, file, opts) };
    })(t);
    
    if (opts.global) {
        this._globalTransforms.push(t);
    }
    else this._transforms.push(t);
    return this;
};

Browserify.prototype.plugin = function (plugin, opts) {
    if (typeof plugin === 'function') {
        this._plugins.push({ plugin: plugin, opts: opts });
        plugin(this, opts);
        return this;
    }
    
    try {
        var r = nodeResolve.sync(plugin, {
            basedir: path.resolve(this._basedir || process.cwd())
        });
    }
    catch (e) {
        try {
            r = nodeResolve.sync(plugin, {
                basedir: commondir(this._entries)
            });
        }
        catch (e) {
            this.emit('error', new Error('failed to load plugin ' + plugin));
        }
    }
    var m = require(r);
    if (typeof m !== 'function') {
        this.emit('error', new Error('plugin ' + plugin + ' exported a '
            + (typeof m) + ', expected a function'
        ));
        return this;
    }
    this._plugins.push({ plugin: m, opts: opts });
    m(this, opts);
    return this;
};

Browserify.prototype.deps = function (opts) {
    var self = this;
    if (!opts) opts = {};
    
    if (self._pending) {
        var tr = through2.obj();
        self.on('_ready', function () {
            self.deps(opts).pipe(tr);
        });
        return tr;
    }
    
    opts.modules = self._builtins;
    opts.extensions = self._extensions;
    opts.transforms = self._transforms;
    
    if (!opts.basedir) opts.basedir = self._basedir;
    var d = mdeps(self.files, opts);
    
    var index = 0;
    var tr = d.pipe(through2.obj(write));
    d.on('error', tr.emit.bind(tr, 'error'));
    d.on('transform', tr.emit.bind(tr, 'transform'));
    return tr;
    
    function write (row, encoding, callback) {
        if (row.id === excludeModulePath) return callback();
        if (self._exclude[row.id]) return callback();
        
        self.emit('dep', row);
        
        if (row.id === emptyModulePath) {
            row.source = '';
        }
        if (/^\ufeff/.test(row.source)) {
            row.source = row.source.replace(/^\ufeff/, '');
        }
        
        row.deps = Object.keys(row.deps).reduce(function (acc, key) {
            if (!self._exclude[key] && !self._external[key]
            && !self._external[row.id] && row.deps[key] !== excludeModulePath) {
                acc[key] = row.deps[key];
            }
            return acc;
        }, {});
        
        if (self._expose[row.id]) {
            this.push({
                id: row.id,
                exposed: self._expose[row.id],
                deps: {},
                source: 'module.exports=require(\''
                    + self._hash(row.id) + '\');',
                nomap: true
            });
        }
        
        if (self.exports[row.id]) row.exposed = self.exports[row.id];

        if (self._exposeAll) {
            row.exposed = self._hash(row.id);
        }

        // skip adding this file if it is external
        if (self._external[row.id]) {
            return callback();
        }
       
        if (/\.json$/.test(row.id)) {
            row = copy(row);
            row.source = 'module.exports=' + row.source;
        }
        
        var ix = self._entries.indexOf(row.id);
        if (row.entry === undefined || self.exports[row.id]) {
            row.entry = ix >= 0;
        }
        if (ix >= 0) row.order = ix;
        this.push(row);
        callback();
    }
};

Browserify.prototype.pack = function (opts) {
    if (!opts) opts = {};
    
    var self = this;
    var packer = self._browserPack(opts);
    
    var mainModule;
    var hashes = {}, depList = {}, depHash = {};
    
    var input = through2.obj(function (row_, encoding, callback) {
        var row = copy(row_);
        
        if (opts.debug) { 
            row.sourceRoot = 'file://localhost'; 
            row.sourceFile = row.id.replace(/\\/g, '/');
        }
        
        var dup = hashes[row.hash];
        if (dup && sameDeps(depList[dup._id], row.deps)) {
            row.source = 'module.exports=require('
                + JSON.stringify(dup.id)
                + ')'
            ;
            row.nomap = true;
        }
        else if (dup) {
            row.source = 'arguments[4]['
                + JSON.stringify(dup.id)
                + '][0].apply(exports,arguments)'
            ;
        }
        else hashes[row.hash] = { _id: row.id, id: getId(row) };
        
        if (/^#!/.test(row.source)) row.source = '//' + row.source;
        var err = checkSyntax(row.source, row.id);
        if (err) return callback(err);
        
        var newId = getId(row);
        this.emit('id', newId, row.id);
        row.id = getId(row);
        
        if (row.entry) mainModule = mainModule || row.id;
        
        var deps = {};
        Object.keys(row.deps || {}).forEach(function (key) {
            var file = row.deps[key];
            var index = row.indexDeps && row.indexDeps[key];
            if (self._exposeAll) {
                index = self._hash(file);
            }
            deps[key] = getId({ id: file, index: index });
        });
        row.deps = deps;

        this.push(row);
        callback();
    });
    
    function getId (row) {
        if (row.exposed) {
            return row.exposed;
        }
        else if (self._external[row.id] || self.exports[row.id]) {
            return self._hash(row.id);
        }
        else if (self._expose[row.id]) {
            return row.id;
        }
        else if (self._fullPaths) {
            return row.id;
        }
        else if (row.index === undefined) {
            return row.id;
        }
        else return row.index;
    }
    
    var first = true;
    var hasExports = Object.keys(self.exports).length;
    var output = through2(write, end);
    
    var sort = depSorter({ index: true });

    input.on('data', function (row) { self.emit('row', row) });
    return pipeline(through2.obj(hasher), sort, input, packer, output);
    
    function write (buf, encoding, callback) {
        if (first) writePrelude.call(this);
        first = false;
        this.push(buf);
        callback();
    }
    
    function end (callback) {
        if (first) writePrelude.call(this);
        if (opts.standalone) {
            this.push(
                '\n(' + JSON.stringify(mainModule) + ')'
                + umd.postlude(opts.standalone)
            );
        }
        if (opts.debug) this.push('\n');
        callback();
    }
    
    function writePrelude () {
        if (!first) return;
        if (opts.standalone) {
            return this.push(umd.prelude(opts.standalone).trim() + 'return ');
        }
        if (hasExports) this.push(
            (opts.externalRequireName || 'require') + '='
        );
    }
    
    function hasher (row, encoding, callback) {
        row.hash = hash(row.source);
        depList[row.id] = row.deps;
        depHash[row.id] = row.hash;
        this.push(row);
        callback();
    }
    
    function sameDeps (a, b) {
        var keys = Object.keys(a);
        if (keys.length !== Object.keys(b).length) return false;
        
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i], ka = a[k], kb = b[k];
            var ha = depHash[ka];
            var hb = depHash[kb];
            var da = depList[ka];
            var db = depList[kb];
            
            if (ka === kb) continue;
            if (ha !== hb || !sameDeps(da, db)) return false;
        }
        return true;
    }
};

var packageFilter = function (info) {
    if (info && typeof info.browserify === 'string' && !info.browser) {
        info.browser = info.browserify;
        delete info.browserify;
    }
    return info;
};

Browserify.prototype._resolve = function (id, parent, cb) {
    var self = this;
    if (self._exclude[id]) return cb(null, excludeModulePath);
    if (self._ignore[id]) return cb(null, emptyModulePath);
    
    var result = function (file, pkg, x) {
        if (self._pending === 0) {
            self.emit('file', file, id, parent);
        }
        if (pkg) {
            cb(null, file, pkg, x);
            self.emit('package', file, pkg);
        }
        else findPackage(path.dirname(file), function (err, pkgfile, pkg) {
            if (err) return cb(err)
            
            if (pkg && typeof pkg === 'object') {
                var pkg_ = copy(pkg);
                if (typeof pkg_.browserify === 'string' && !pkg_.browser) {
                    pkg.browser = pkg_.browserify;
                }
                if (typeof pkg_.browserify === 'object') {
                    pkg.browserify = pkg_.browserify;
                }
            }
            cb(null, file, pkg, x);
            self.emit('package', file, pkg);
        })
    };
    if (self._mapped[id]) return result(self._mapped[id]);
    
    parent.modules = self._builtins;
    parent.extensions = self._extensions;
    parent.paths = self._paths;
    
    if (self._external[id]) return cb(null, emptyModulePath);
    
    return self._delegateResolve(id, parent, function(err, file, pkg) {
        var cannotFind = /Cannot find module/.test(err && err.message);
        if (err && !cannotFind) return cb(err);
        
        if (!file && (self._external[id] || self._external[file])) {
            return cb(null, emptyModulePath);
        }
        else if (!file && self._ignoreMissing) {
            self.emit('missing', id, parent);
            return cb(null, emptyModulePath);
        }
        else if (!file) {
            return cb(notFound(id, parent.filename))
        }
        
        if (self._exclude[file]) return cb(null, excludeModulePath);
        if (self._ignore[file]) return cb(null, emptyModulePath);
        if (self._external[file]) return result(file, pkg, true);
        
        result(file, pkg);
    });
     
    function findPackage (basedir, cb) {
        var dirs = parents(basedir);
        (function next () {
            var dir = dirs.shift();
            if (dir === 'node_modules' || dir === undefined) {
                return cb(null, null, null);
            }
            
            var pkgfile = path.join(dir, 'package.json');
            if (self._pkgcache[pkgfile]) {
                cb(null, pkgfile, self._pkgcache[pkgfile]);
            }
            else readPackage(pkgfile, function (err, pkg) {
                self._pkgcache[pkgfile] = pkg;
                if (err) return next()
                else cb(null, pkgfile, pkg)
            });
        })();
    }
    
    function readPackage (pkgfile, cb) {
        fs.readFile(pkgfile, function (err, src) {
            if (err) return cb(err);
            try { var pkg = JSON.parse(src) }
            catch (e) {}
            cb(null, pkg);
        });
    }
};

function isBrowserify (x) {
    return x && typeof x === 'object' && typeof x.bundle === 'function';
}

function isStream (x) {
    return x && typeof x === 'object' && typeof x.pipe === 'function';
}

function notFound (id, parent) {
    var err = new Error('module '
        + JSON.stringify(id) + ' not found from '
        + JSON.stringify(parent)
    );
    err.type = 'not found';
    err.filename = id;
    err.parent = parent;
    return err;
}

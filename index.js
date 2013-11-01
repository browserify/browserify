var crypto = require('crypto');
var through = require('through');
var pipeline = require('stream-combiner');
var concatStream = require('concat-stream');
var checkSyntax = require('syntax-error');
var parents = require('parents');
var deepEqual = require('deep-equal');

var mdeps = require('module-deps');
var browserPack = require('browser-pack');
var depSorter = require('deps-sort');
var browserResolve = require('browser-resolve');
var browserBuiltins = require('browser-builtins');
var insertGlobals = require('insert-module-globals');
var umd = require('umd');

var path = require('path');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');

var emptyModulePath = path.join(__dirname, '_empty.js');

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
    self._external = {};
    self._expose = {};
    self._mapped = {};
    self._transforms = [];
    self._extensions = ['.js'].concat(opts.extensions).filter(Boolean);
    self._noParse =[];
    self._pkgcache = {};
    self._exposeAll = opts.exposeAll;
    self._ignoreMissing = opts.ignoreMissing;
    self._basedir = opts.basedir;
    
    var noParse = [].concat(opts.noParse).filter(Boolean);
    noParse.forEach(this.noParse.bind(this));
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
};

Browserify.prototype.add = function (file) {
    this.require(file, { entry: true });
    return this;
};

Browserify.prototype.require = function (id, opts) {
    var self = this;
    if (isStream(id)) {
        self.files.push(id);
        return self;
    }
    
    if (opts === undefined) opts = { expose: id };
    
    self._pending ++;
    
    var basedir = opts.basedir || self._basedir || process.cwd();
    var fromfile = basedir + '/_fake.js';
    
    var params = {
        filename: fromfile,
        modules: browserBuiltins,
        packageFilter: packageFilter,
        extensions: self._extensions
    };
    browserResolve(id, params, function (err, file) {
        if ((err || !file) && !opts.external) {
            if (err) return self.emit('error', err);
            if (!file) return self.emit('error', new Error(
                'module ' + JSON.stringify(id) + ' not found in require()'
            ));
        }
        
        if (opts.expose) {
            self.exports[file] = hash(file);
            
            if (typeof opts.expose === 'string') {
                self._expose[file] = opts.expose;
                self._mapped[opts.expose] = file;
            }
        }
        
        if (opts.external) {
            if (file) self._external[file] = true;
            else self._external[id] = true;
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
    var self = this;
    if (!opts) opts = {};
    if (isBrowserify(id)) {
        self._pending++;
        
        function captureDeps() {
            var d = mdeps(id.files, {
                basedir: opts.basedir || self._basedir
            });
            d.pipe(through(write, end));
            
            function write (row) { self.external(row.id) }
            function end () {
                if (--self._pending === 0) self.emit('_ready');
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
    
    opts.resolve = self._resolve.bind(self);
    opts.transform = self._transforms;
    opts.noParse = self._noParse;
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
    
    if (opts.standalone && self._entries.length !== 1) {
        process.nextTick(function () {
            p.emit('error', 'standalone only works with a single entry point');
        });
    }
    
    var prevCache = opts.cache && copy(opts.cache);
    var d = (opts.deps || self.deps.bind(self))(opts);
    var g = opts.detectGlobals || opts.insertGlobals
        ? insertGlobals(self.files, {
            resolve: self._resolve.bind(self),
            always: opts.insertGlobals,
            vars: opts.insertGlobalVars
        })
        : through()
    ;
    var p = self.pack(opts.debug, opts.standalone);
    if (cb) {
        p.on('error', cb);
        p.pipe(concatStream(function (src) { cb(null, src) }));
    }
    g.on('dep', function (dep) { self.emit('dep', dep) });
    
    d.on('error', p.emit.bind(p, 'error'));
    g.on('error', p.emit.bind(p, 'error'));
    d.pipe(through(function (dep) {
        if (self._noParse.indexOf(dep.id) >= 0
        || (prevCache && prevCache[dep.id])) {
            p.write(dep);
        }
        else this.queue(dep)
    })).pipe(g).pipe(p);
    
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
    if (self._pending) {
        var tr = through();
        self.on('_ready', function () {
            self.deps(opts).pipe(tr);
        });
        return tr;
    }
    
    opts.modules = browserBuiltins;
    opts.extensions = self._extensions;
    if (!opts.basedir) opts.basedir = self._basedir;
    var d = mdeps(self.files, opts);
    
    var index = 0;
    var tr = d.pipe(through(write));
    d.on('error', tr.emit.bind(tr, 'error'));
    return tr;
    
    function write (row) {
        self.emit('dep', row);
        
        if (row.id === emptyModulePath) {
            row.source = '';
        }
        row.deps = Object.keys(row.deps).reduce(function (acc, key) {
            if (!self._external[key] && !self._external[row.id]) {
                acc[key] = row.deps[key];
            }
            return acc;
        }, {});
        
        if (self._expose[row.id]) {
            this.queue({
                id: row.id,
                exposed: self._expose[row.id],
                deps: {},
                source: 'module.exports=require(\'' + hash(row.id) + '\');',
                nomap: true
            });
        }
        
        if (self.exports[row.id]) row.exposed = self.exports[row.id];

        if (self._exposeAll) {
            row.exposed = hash(row.id);
        }

        // skip adding this file if it is external
        if (self._external[row.id]) {
            return;
        }
       
        if (/\.json$/.test(row.id)) {
            row.source = 'module.exports=' + row.source;
        }
        
        var ix = self._entries.indexOf(row.id);
        if (row.entry === undefined || self.exports[row.id]) {
            row.entry = ix >= 0;
        }
        if (ix >= 0) row.order = ix;
        this.queue(row);
    }
};

Browserify.prototype.pack = function (debug, standalone) {
    var self = this;
    var packer = browserPack({ raw: true });
    
    var mainModule;
    var hashes = {}, depList = {}, depHash = {};
    var visited = {};
    
    var input = through(function (row_) {
        var row = copy(row_);
        
        if (debug) { 
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
        if (err) return this.emit('error', err);
        
        row.id = getId(row);
        
        if (row.entry) mainModule = mainModule || row.id;
        
        var deps = {};
        Object.keys(row.deps || {}).forEach(function (key) {
            var file = row.deps[key];
            var index = row.indexDeps && row.indexDeps[key];
            if (self._exposeAll) {
                index = hash(file);
            }
            deps[key] = getId({ id: file, index: index });
        });
        row.deps = deps;

        this.queue(row);
    });
    
    function getId (row) {
        if (row.exposed) {
            return row.exposed;
        }
        else if (self._external[row.id] || self.exports[row.id]) {
            return hash(row.id);
        }
        else if (self._expose[row.id]) {
            return row.id;
        }
        else if (row.index === undefined) {
            return row.id;
        }
        else return row.index;
    }
    
    var first = true;
    var hasExports = Object.keys(self.exports).length;
    var output = through(write, end);
    
    var sort = depSorter({ index: true });

    input.on('data', function (row) { self.emit('row', row) });
    return pipeline(through(hasher), sort, input, packer, output);
    
    function write (buf) {
        if (first) writePrelude.call(this);
        first = false;
        this.queue(buf);
    }
    
    function end () {
        if (first) writePrelude.call(this);
        if (standalone) {
            this.queue('\n(' + mainModule + ')' + umd.postlude(standalone));
        }
        this.queue('\n;');
        this.queue(null);
    }
    
    function writePrelude () {
        if (!first) return;
        if (standalone) {
            return this.queue(umd.prelude(standalone) + 'return ');
        }
        if (!hasExports) return this.queue(';');
        this.queue('require=');
    }
    
    function hasher (row) {
        row.hash = hash(row.source);
        depList[row.id] = row.deps;
        depHash[row.id] = row.hash;
        this.queue(row);
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
            if (ha !== hb) return false;
            if (visited[da] && visited[db]) {
                if (!deepEqual(da, db)) return false;
            }
            else {
                visited[da] = true;
                visited[db] = true;
                if (!sameDeps(da, db)) return false;
            }
        }
        return true;
    }
};

var packageFilter = function (info) {
    if (typeof info.browserify === 'string' && !info.browser) {
        info.browser = info.browserify;
        delete info.browserify;
    }
    return info;
};

Browserify.prototype._resolve = function (id, parent, cb) {
    if (this._ignore[id]) return cb(null, emptyModulePath);
    var self = this;
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
                var pkg_ = pkg;
                pkg = {};
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
    
    parent.modules = browserBuiltins;
    parent.extensions = self._extensions;
    
    if (self._external[id]) return cb(null, emptyModulePath);
    
    return browserResolve(id, parent, function(err, file, pkg) {
        if (err) return cb(err);
        if (!file && (self._external[id] || self._external[file])) {
            return cb(null, emptyModulePath);
        }
        else if (!file && self._ignoreMissing) {
            self.emit('missing', id, parent);
            return cb(null, emptyModulePath);
        }
        else if (!file) {
            return cb(new Error('module '
                + JSON.stringify(id) + ' not found from '
                + JSON.stringify(parent.filename)
            ));
        }
        
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

function copy (obj) {
    return Object.keys(obj).reduce(function (acc, key) {
        acc[key] = obj[key];
        return acc;
    }, {});
}

function isBrowserify (x) {
    return x && typeof x === 'object' && typeof x.bundle === 'function';
}

function isStream (x) {
    return x && typeof x === 'object' && typeof x.pipe === 'function';
}

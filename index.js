var mdeps = require('module-deps');
var depsSort = require('deps-sort');
var bpack = require('browser-pack');
var insertGlobals = require('insert-module-globals');
var syntaxError = require('syntax-error');

var builtins = require('./lib/builtins.js');

var splicer = require('labeled-stream-splicer');
var through = require('through2');
var concat = require('concat-stream');
var duplexer = require('duplexer2');

var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var xtend = require('xtend');
var copy = require('shallow-copy');
var isarray = require('isarray');
var defined = require('defined');

var bresolve = require('browser-resolve');
var resolve = require('resolve');

module.exports = Browserify;
inherits(Browserify, EventEmitter);

var path = require('path');
var paths = {
    empty: path.join(__dirname, 'lib/_empty.js')
};

function Browserify (files, opts) {
    var self = this;
    if (!(this instanceof Browserify)) return new Browserify(files, opts);
    if (!opts) opts = {};
    
    if (typeof files === 'string' || isarray(files) || isStream(files)) {
        opts = xtend(opts, { entries: [].concat(opts.entries || [], files) });
    }
    else opts = xtend(files, opts);
    
    self._options = opts;
    if (opts.noparse) opts.noParse = opts.noparse;
    
    if (opts.basedir !== undefined && typeof opts.basedir !== 'string') {
        throw new Error('opts.basedir must be either undefined or a string.');
    }
    
    self._external = [];
    self._exclude = [];
    self._ignore = [];
    self._expose = {};
    self._hashes = {};
    self._pending = 0;
    self._entryOrder = 0;
    self._ticked = false;

    var ignoreTransform = [].concat(opts.ignoreTransform).filter(Boolean);
    self._filterTransform = function(tr) {
        if (Array.isArray(tr)) {
            return ignoreTransform.indexOf(tr[0]) === -1;
        }
        return ignoreTransform.indexOf(tr) === -1;
    }
    
    self.pipeline = self._createPipeline(opts);
    
    [].concat(opts.transform).filter(Boolean).forEach(function (tr) {
        self.transform(tr);
    });
    
    [].concat(opts.entries).filter(Boolean).forEach(function (file) {
        self.add(file, { basedir: opts.basedir });
    });
    
    [].concat(opts.require).filter(Boolean).forEach(function (file) {
        self.require(file, { basedir: opts.basedir });
    });
    
    [].concat(opts.plugin).filter(Boolean).forEach(function (p) {
        self.plugin(p, { basedir: opts.basedir });
    });
}

Browserify.prototype.require = function (file, opts) {
    var self = this;
    if (isarray(file)) {
        file.forEach(function (x) {
            if (typeof x === 'object') {
                self.require(x.file, xtend(opts, x));
            }
            else self.require(x, opts);
        });
        return this;
    }
    
    if (!opts) opts = {};
    var basedir = defined(opts.basedir, process.cwd());
    var expose = opts.expose;
    if (file === expose && /^[\.]/.test(expose)) {
        expose = '/' + path.relative(basedir, expose);
    }
    if (expose === undefined && this._options.exposeAll) {
        expose = true;
    }
    if (expose === true) {
        expose = '/' + path.relative(basedir, file);
    }
    
    if (isStream(file)) {
        self._pending ++;
        var order = self._entryOrder ++;
        file.pipe(concat(function (buf) {
            var filename = opts.file || file.file || path.join(
                basedir,
                '_stream_' + self._entryOrder + '.js'
            );
            var id = file.id || expose || filename;
            if (expose || opts.entry === false) {
                self._expose[id] = filename;
            }
            if (!opts.entry && self._options.exports === undefined) {
                self._bpack.hasExports = true;
            }
            var rec = {
                source: buf.toString('utf8'),
                entry: defined(opts.entry, false),
                file: filename,
                id: id
            };
            if (rec.entry) rec.order = order;
            if (rec.transform === false) rec.transform = false;
            self.pipeline.write(rec);
            
            self._pending --;
            if (self._pending === 0) self.emit('_ready');
        }));
        return this;
    }
    
    var row = typeof file === 'object'
        ? xtend(file, opts)
        : (isExternalModule(file)
            ? xtend(opts, { id: expose || file })
            : xtend(opts, { file: file })
        )
    ;
    if (!row.id) {
        row.id = expose || file;
    }
    if (expose || !row.entry) {
        this._expose[row.id] = file;
    }
    if (opts.external) return this.external(file, opts);
    if (row.entry === undefined) row.entry = false;
    
    if (!row.entry && this._options.exports === undefined) {
        this._bpack.hasExports = true;
    }
    
    if (row.entry) row.order = self._entryOrder ++;
    if (opts.transform === false) row.transform = false;
    
    this.pipeline.write(row);
    return this;
};

Browserify.prototype.add = function (file, opts) {
    var self = this;
    if (!opts) opts = {};
    if (isarray(file)) {
        file.forEach(function (x) { self.add(x, opts) });
        return this;
    }
    return this.require(file, xtend({ entry: true, expose: false }, opts));
};

Browserify.prototype.external = function (file, opts) {
    var self = this;
    if (isarray(file)) {
        file.forEach(function (f) {
            if (typeof f === 'object') {
                self.external(f, xtend(opts, f));
            }
            else self.external(f, opts)
        });
        return this;
    }
    if (file && typeof file === 'object' && typeof file.bundle === 'function') {
        var b = file;
        self._pending ++;
        b.on('label', function (prev, id) {
            self._external.push(id);
        });
        b.pipeline.get('label').once('end', function () {
            if (-- self._pending === 0) self.emit('_ready');
        });
        return this;
    }
    
    if (!opts) opts = {};
    var basedir = defined(opts.basedir, process.cwd());
    this._external.push(file);
    this._external.push('/' + path.relative(basedir, file));
    return this;
};

Browserify.prototype.exclude = function (file, opts) {
    if (!opts) opts = {};
    var basedir = defined(opts.basedir, process.cwd());
    this._exclude.push(file);
    this._exclude.push('/' + path.relative(basedir, file));
    return this;
};

Browserify.prototype.ignore = function (file, opts) {
    if (!opts) opts = {};
    var basedir = defined(opts.basedir, process.cwd());

    // Handle relative paths
    if (file[0] === '.') {
        this._ignore.push(path.resolve(basedir, file));
    }
    else {
        this._ignore.push(file);
    }
    return this;
};

Browserify.prototype.transform = function (tr, opts) {
    var self = this;
    if (typeof opts === 'function' || typeof opts === 'string') {
        tr = [ opts, tr ];
    }
    if (isarray(tr)) {
        opts = tr[1];
        tr = tr[0];
    }


    //if the bundler is ignoring this transform
    if (typeof tr === 'string' && !self._filterTransform(tr)) 
        return this;

    if (!opts) opts = {};
    
    opts._flags = '_flags' in opts ? opts._flags : self._options;
    
    apply();
    self.on('reset', apply);
    
    function apply () {
        if (opts.global) {
            self._mdeps.globalTransforms.push([ tr, opts ]);
        }
        else self._mdeps.transforms.push([ tr, opts ]);
    }
    return this;
};

Browserify.prototype.plugin = function (p, opts) {
    if (isarray(p)) {
        opts = p[1];
        p = p[0];
    }
    if (!opts) opts = {};
    var basedir = defined(opts.basedir, this._options.basedir, process.cwd());
    if (typeof p === 'function') {
        p(this, opts);
    }
    else {
        var pfile = resolve.sync(String(p), { basedir: basedir })
        var f = require(pfile);
        if (typeof f !== 'function') {
            throw new Error('plugin ' + p + ' should export a function');
        }
        f(this, opts);
    }
    return this;
};

Browserify.prototype._createPipeline = function (opts) {
    var self = this;
    if (!opts) opts = {};
    this._mdeps = this._createDeps(opts);
    this._mdeps.on('file', function (file, id) {
        pipeline.emit('file', file, id);
        self.emit('file', file, id);
    });
    this._mdeps.on('package', function (pkg) {
        pipeline.emit('package', pkg);
        self.emit('package', pkg);
    });
    this._mdeps.on('transform', function (tr, file) {
        pipeline.emit('transform', tr, file);
        self.emit('transform', tr, file);
    });
    
    var dopts = {
        index: !opts.fullPaths && !opts.exposeAll,
        dedupe: true,
        expose: this._expose
    };
    this._bpack = bpack(xtend(opts, { raw: true }));
    
    var pipeline = splicer.obj([
        'record', [ this._recorder() ],
        'deps', [ this._mdeps ],
        'json', [ this._json() ],
        'unbom', [ this._unbom() ],
        'unshebang', [ this._unshebang() ],
        'syntax', [ this._syntax() ],
        'sort', [ depsSort(dopts) ],
        'dedupe', [ this._dedupe() ],
        'label', [ this._label(opts) ],
        'emit-deps', [ this._emitDeps() ],
        'debug', [ this._debug(opts) ],
        'pack', [ this._bpack ],
        'wrap', []
    ]);
    if (opts.exposeAll) {
        var basedir = defined(opts.basedir, process.cwd());
        pipeline.get('deps').push(through.obj(function (row, enc, next) {
            if (self._external.indexOf(row.id) >= 0) return next();
            if (self._external.indexOf(row.file) >= 0) return next();
            
            if (isAbsolutePath(row.id)) {
                row.id = '/' + path.relative(basedir, row.file);
            }
            Object.keys(row.deps || {}).forEach(function (key) {
                row.deps[key] = '/' + path.relative(basedir, row.deps[key]);
            });
            this.push(row);
            next();
        }));
    }
    return pipeline;
};

Browserify.prototype._createDeps = function (opts) {
    var self = this;
    var mopts = copy(opts);
    var basedir = defined(opts.basedir, process.cwd());
    
    mopts.extensions = [ '.js', '.json' ].concat(mopts.extensions || []);
    self._extensions = mopts.extensions;
    
    //filter transforms on top-level
    mopts.transform = [].concat(opts.transform)
                .filter(Boolean)
                .filter(self._filterTransform);

    mopts.transformKey = [ 'browserify', 'transform' ];
    mopts.postFilter = function (id, file, pkg) {
        if (opts.postFilter && !opts.postFilter(id, file, pkg)) return false;
        if (self._external.indexOf(file) >= 0) return false;
        if (self._exclude.indexOf(file) >= 0) return false;

        //filter transforms on module dependencies
        if (pkg && pkg.browserify && pkg.browserify.transform) {
            //In edge cases it may be a string
            pkg.browserify.transform = [].concat(pkg.browserify.transform)
                    .filter(Boolean)
                    .filter(self._filterTransform);
        }
        return true;
    };
    mopts.filter = function (id) {
        if (opts.filter && !opts.filter(id)) return false;
        if (self._external.indexOf(id) >= 0) return false;
        if (self._exclude.indexOf(id) >= 0) return false;
        if (opts.bundleExternal === false && isExternalModule(id)) {
            return false;
        }
        return true;
    };
    mopts.resolve = function (id, parent, cb) {
        if (self._ignore.indexOf(id) >= 0) return cb(null, paths.empty, {});
        
        bresolve(id, parent, function (err, file, pkg) {
            if (file && self._ignore.indexOf(file) >= 0) {
                return cb(null, paths.empty, {});
            }
            if (file && self._ignore.length) {
                var nm = file.split('/node_modules/')[1];
                if (nm) {
                    nm = nm.split('/')[0];
                    if (self._ignore.indexOf(nm) >= 0) {
                        return cb(null, paths.empty, {});
                    }
                }
            }
            
            if (file) {
                var ex = '/' + path.relative(basedir, file);
                if (self._external.indexOf(ex) >= 0) {
                    return cb(null, ex);
                }
                if (self._exclude.indexOf(ex) >= 0) {
                    return cb(null, ex);
                }
                if (self._ignore.indexOf(ex) >= 0) {
                    return cb(null, paths.empty, {});
                }
            }
            cb(err, file, pkg);
        });
    };
    
    if (opts.builtins === false) {
        mopts.modules = {};
        self._exclude.push.apply(self._exclude, Object.keys(builtins));
    }
    else if (opts.builtins && isarray(opts.builtins)) {
        mopts.modules = {};
        opts.builtins.forEach(function (key) {
            mopts.modules[key] = builtins[key];
        });
    }
    else if (opts.builtins && typeof opts.builtins === 'object') {
        mopts.modules = opts.builtins;
    }
    else mopts.modules = builtins;
    
    Object.keys(builtins).forEach(function (key) {
        if (!has(mopts.modules, key)) self._exclude.push(key);
    });
    
    mopts.globalTransform = [];
    this.once('bundle', function () {
        self._mdeps.globalTransforms.push([ globalTr, {} ]);
    });
    
    function globalTr (file) {
        if (opts.detectGlobals === false) return through();
        
        if (opts.noParse === true) return through();
        var no = [].concat(opts.noParse).filter(Boolean);
        if (no.indexOf(file) >= 0) return through();
        if (no.map(function (x){return path.resolve(x)}).indexOf(file)>=0){
            return through();
        }
        
        var parts = file.split('/node_modules/');
        for (var i = 0; i < no.length; i++) {
            if (typeof no[i] === 'function' && no[i](file)) {
                return through();
            }
            else if (no[i] === parts[parts.length-1].split('/')[0]) {
                return through();
            }
            else if (no[i] === parts[parts.length-1]) {
                return through();
            }
        }
        
        var vars = xtend({
            process: function () { return "require('_process')" },
        }, opts.insertGlobalVars);
        
        if (opts.bundleExternal === false) {
            delete vars.process;
            delete vars.buffer;
        }
        
        return insertGlobals(file, xtend(opts, {
            always: opts.insertGlobals,
            basedir: opts.commondir === false
                ? '/'
                : opts.basedir || process.cwd()
            ,
            vars: vars
        }));
    }
    return mdeps(mopts);
};

Browserify.prototype._recorder = function (opts) {
    var self = this;
    var ended = false;
    this._recorded = [];
    
    if (!this._ticked) {
        process.nextTick(function () {
            self._ticked = true;
            self._recorded.forEach(function (row) {
                stream.push(row);
            });
            if (ended) stream.push(null);
        });
    }
    
    var stream = through.obj(write, end);
    return stream;
    
    function write (row, enc, next) {
        self._recorded.push(row);
        if (self._ticked) this.push(row);
        next();
    }
    function end () {
        ended = true;
        if (self._ticked) this.push(null);
    }
};

Browserify.prototype._json = function () {
    return through.obj(function (row, enc, next) {
        if (/\.json$/.test(row.file)) {
            row.source = 'module.exports=' + row.source;
        }
        this.push(row);
        next();
    });
};

Browserify.prototype._unbom = function () {
    return through.obj(function (row, enc, next) {
        if (/^\ufeff/.test(row.source)) {
            row.source = row.source.replace(/^\ufeff/, '');
        }
        this.push(row);
        next();
    });
};

Browserify.prototype._unshebang = function () {
    return through.obj(function (row, enc, next) {
        if (/^#!/.test(row.source)) {
            row.source = row.source.replace(/^#![^\n]*\n/, '');
        }
        this.push(row);
        next();
    });
};

Browserify.prototype._syntax = function () {
    return through.obj(function (row, enc, next) {
        var err = syntaxError(row.source, row.file || row.id);
        if (err) return this.emit('error', err);
        this.push(row);
        next();
    });
};

Browserify.prototype._dedupe = function () {
    return through.obj(function (row, enc, next) {
        if (!row.dedupeIndex && row.dedupe) {
            row.source = 'module.exports=require('
                + JSON.stringify(row.dedupe)
                + ')'
            ;
            row.deps = {};
            row.deps[row.dedupe] = row.dedupe;
            row.nomap = true;
        }
        if (row.dedupeIndex && row.sameDeps) {
            row.source = 'module.exports=require('
                + JSON.stringify(row.dedupeIndex)
                + ')'
            ;
            row.deps = {};
            row.nomap = true;
        }
        else if (row.dedupeIndex) {
            row.source = 'arguments[4]['
                + JSON.stringify(row.dedupeIndex)
                + '][0].apply(exports,arguments)'
            ;
            row.nomap = true;
        }
        if (row.dedupeIndex && row.dedupe && row.indexDeps) {
            row.indexDeps[row.dedupe] = row.dedupeIndex;
        }
        this.push(row);
        next();
    });
};

Browserify.prototype._label = function (opts) {
    var self = this;
    var basedir = defined(opts.basedir, process.cwd());
    
    return through.obj(function (row, enc, next) {
        var prev = row.id;
        
        var relf = '/' + path.relative(basedir, row.id);
        var reli = '/' + path.relative(basedir, row.id);
        if (self._external.indexOf(row.id) >= 0) return next();
        if (self._external.indexOf(reli) >= 0) return next();
        if (self._external.indexOf(row.file) >= 0) return next();
        if (self._external.indexOf(relf) >= 0) return next();
        
        if (row.index) row.id = row.index;
        
        self.emit('label', prev, row.id);
        if (row.indexDeps) row.deps = row.indexDeps || {};
        
        Object.keys(row.deps).forEach(function (key) {
            if (self._expose[key]) {
                row.deps[key] = key;
                return;
            }

            var afile = path.resolve(path.dirname(row.file), key);
            var rfile = '/' + path.relative(basedir, afile);
            if (self._external.indexOf(rfile) >= 0) {
                row.deps[key] = rfile;
            }
            if (self._external.indexOf(afile) >= 0) {
                row.deps[key] = rfile;
            }
            if (self._external.indexOf(key) >= 0) {
                row.deps[key] = key;
                return;
            }
            
            for (var i = 0; i < self._extensions.length; i++) {
                var ex = self._extensions[i];
                if (self._external.indexOf(rfile + ex) >= 0) {
                    row.deps[key] = rfile + ex;
                    break;
                }
            }
        });
        
        if (row.entry || row.expose) {
            self._bpack.standaloneModule = row.id;
        }
        this.push(row);
        next();
    });
};

Browserify.prototype._emitDeps = function () {
    var self = this;
    return through.obj(function (row, enc, next) {
        self.emit('dep', row);
        this.push(row);
        next();
    })
};

Browserify.prototype._debug = function (opts) {
    var basedir = defined(opts.basedir, process.cwd());
    return through.obj(function (row, enc, next) {
        if (opts.debug) {
            row.sourceRoot = 'file://localhost';
            row.sourceFile = path.relative(basedir, row.file);
        }
        this.push(row);
        next();
    });
};

Browserify.prototype.reset = function (opts) {
    if (!opts) opts = {};
    var hadExports = this._bpack.hasExports;
    this.pipeline = this._createPipeline(xtend(opts, this._options));
    this._bpack.hasExports = hadExports;
    this._entryOrder = 0;
    this._bundled = false;
    this.emit('reset');
};

Browserify.prototype.bundle = function (cb) {
    var self = this;
    if (cb && typeof cb === 'object') {
        throw new Error(
            'bundle() no longer accepts option arguments.\n'
            + 'Move all option arguments to the browserify() constructor.'
        );
    }
    if (this._bundled) {
        var recorded = this._recorded;
        this.reset();
        recorded.forEach(function (x) {
            self.pipeline.write(x);
        });
    }
    this.emit('bundle', this.pipeline);
    
    if (cb) {
        this.pipeline.on('error', cb);
        this.pipeline.pipe(concat(function (body) {
            cb(null, body);
        }));
    }
    
    if (this._pending === 0) {
        this.pipeline.end();
    }
    else this.once('_ready', function () {
        self.pipeline.end();
    });
    
    this._bundled = true;
    return this.pipeline;
};

function has (obj, key) { return Object.hasOwnProperty.call(obj, key) }
function isStream (s) { return s && typeof s.pipe === 'function' }
function isAbsolutePath (file) {
    var regexp = process.platform === 'win32' ?
        /^\w:/ :
        /^\//;
    return regexp.test(file);
}
function isExternalModule (file) {
    var regexp = process.platform === 'win32' ?
        /^(\.|\w:)/ :
        /^[\/.]/;
    return !regexp.test(file);
}

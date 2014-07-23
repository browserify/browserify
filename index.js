var mdeps = require('module-deps');
var depsSort = require('deps-sort');
var bpack = require('browser-pack');
var insertGlobals = require('insert-module-globals');
var syntaxError = require('syntax-error');

var umd = require('umd');
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
    if (opts.noParse) opts.noparse = opts.noParse;
    
    self._external = [];
    self._exclude = [];
    self._expose = {};
    self._hashes = {};
    self._pending = 0;
    self._entryOrder = 0;
    
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
}

Browserify.prototype.require = function (file, opts) {
    var self = this;
    
    if (!opts) opts = {};
    var basedir = defined(opts.basedir, process.cwd());
    var expose = opts.expose;
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
            var filename = opts.file || path.join(
                basedir,
                '_stream_' + Math.floor(Math.pow(16,8) * Math.random()) + '.js'
            );
            var id = file.id || expose || filename;
            if (expose || opts.entry === false) {
                self._expose[id] = filename;
            }
            if (!opts.entry && self._options.exports === undefined) {
                self._hasExports = true;
            }
            var rec = {
                source: buf.toString('utf8'),
                entry: defined(opts.entry, true),
                file: filename,
                id: id
            };
            if (rec.entry) rec.order = order;
            self.pipeline.write(rec);
            
            self._pending --;
            if (self._pending === 0) self.emit('_ready');
        }));
        return this;
    }
    
    var row = typeof file === 'object'
        ? xtend(file, opts)
        : (/^[\/.]/.test(file)
            ? xtend(opts, { file: file })
            : xtend(opts, { id: file })
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
        this._hasExports = true;
    }
    
    if (row.entry) row.order = self._entryOrder ++;
    this.pipeline.write(row);
    
    return this;
};

Browserify.prototype.add = function (file, opts) {
    if (!opts) opts = {};
    return this.require(file, xtend({ entry: true, expose: false }, opts));
};

Browserify.prototype.external = function (file, opts) {
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
    this.require(paths.empty, xtend({ expose: file }, opts));
    return this;
};

Browserify.prototype.transform = function (tr, opts) {
    if (typeof opts === 'function' || typeof opts === 'string') {
        tr = [ opts, tr ];
    }
    if (isarray(tr)) {
        opts = tr[1];
        tr = tr[0];
    }
    if (!opts) opts = {};
    
    if (opts.global) {
        this._mdeps.globalTransforms.push([ tr, opts ]);
    }
    else this._mdeps.transforms.push([ tr, opts ]);
    return this;
};

Browserify.prototype._createPipeline = function (opts) {
    var self = this;
    if (!opts) opts = {};
    this._mdeps = this._createDeps(opts);
    this._mdeps.on('file', function (file, id) {
        self.emit('file', file, id);
    });
    var dopts = {
        index: !opts.fullPaths,
        dedupe: true,
        expose: this._expose
    };
    
    return splicer.obj([
        'record', [ this._recorder() ],
        'deps', [ this._mdeps ],
        'unbom', [ this._unbom() ],
        'syntax', [ this._syntax() ],
        'sort', [ depsSort(dopts) ],
        'dedupe', [ this._dedupe() ],
        'label', [ this._label(opts) ],
        'emit-deps', [ this._emitDeps() ],
        'debug', [ this._debug(opts) ],
        'pack', [ bpack(xtend(opts, { raw: true })) ],
        'wrap', [ this._wrap(opts) ]
    ]);
};

Browserify.prototype._createDeps = function (opts) {
    var self = this;
    var mopts = copy(opts);
    var basedir = defined(opts.basedir, process.cwd());
    
    mopts.extensions = [ '.js', '.json' ].concat(mopts.extensions || []);
    self._extensions = mopts.extensions;
    
    mopts.transformKey = [ 'browserify', 'transform' ];
    mopts.postFilter = function (id, file, pkg) {
        if (opts.postFilter && !opts.postFilter(id, file, pkg)) return false;
        if (self._external.indexOf(file) >= 0) return false;
        if (self._exclude.indexOf(file) >= 0) return false;
        return true;
    };
    mopts.filter = function (id) {
        if (opts.filter && !opts.filter(id)) return false;
        if (self._external.indexOf(id) >= 0) return false;
        if (self._exclude.indexOf(id) >= 0) return false;
        if (opts.bundleExternal === false && !/^([\/\.]|\w:)/.test(id)) {
            return false;
        }
        return true;
    };
    mopts.resolve = function (id, parent, cb) {
        bresolve(id, parent, function (err, file, pkg) {
            if (file) {
                var ex = '/' + path.relative(basedir, file);
                if (self._external.indexOf(ex) >= 0) {
                    return cb(null, ex);
                }
                if (self._exclude.indexOf(ex) >= 0) {
                    return cb(null, ex);
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
    
    mopts.globalTransform = [
        function (file) {
            var stream = through();
            if (/\.json$/.test(file)) {
                stream.push('module.exports=');
            }
            return stream;
        },
        function (file) {
            if (opts.noparse === true) return through();
            var no = [].concat(opts.noparse).filter(Boolean);
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
            return insertGlobals(file, xtend(opts, {
                always: opts.insertGlobals,
                basedir: opts.commondir === false
                    ? '/'
                    : opts.basedir || process.cwd()
                ,
                vars: vars
            }));
        }
    ];
    return mdeps(mopts);
};

Browserify.prototype._recorder = function (opts) {
    var recs = this._recorded = [];
    return through.obj(function (row, enc, next) {
        recs.push(row);
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
        this.push(row);
        next();
    });
};

Browserify.prototype._label = function (opts) {
    var self = this;
    var basedir = defined(opts.basedir, process.cwd());
    
    return through.obj(function (row, enc, next) {
        var prev = row.id;
        if (row.index) row.id = row.index;
        self.emit('label', prev, row.id);
        if (row.indexDeps) row.deps = row.indexDeps || {};
        
        Object.keys(row.deps).forEach(function (key) {
            if (row.deps[key] !== undefined) return;
            if (self._external.indexOf(key) >= 0) return;
            if (!/^[\/.]/.test(key)) return;
            
            var rfile = '/' + path.relative(
                basedir,
                path.resolve(path.dirname(row.file), key)
            );
            if (self._external.indexOf(rfile) >= 0) {
                row.deps[key] = rfile;
            }
            for (var i = 0; i < self._extensions.length; i++) {
                var ex = self._extensions[i];
                if (self._external.indexOf(rfile + ex) >= 0) {
                    row.deps[key] = rfile + ex;
                    break;
                }
            }
        });
        
        this.push(row);
        next();
    });
};

Browserify.prototype._emitDeps = function () {
    var self = this;
    return through.obj(function (row, enc, next) {
        if (row.entry) self._mainModule = row.id;
        self.emit('dep', row);
        this.push(row);
        next();
    })
};

Browserify.prototype._debug = function (opts) {
    return through.obj(function (row, enc, next) {
        if (opts.debug) {
            row.sourceRoot = 'file://localhost';
            row.sourceFile = row.file.replace(/\\/g, '/');
        }
        this.push(row);
        next();
    });
};

Browserify.prototype._wrap = function (opts) {
    var self = this;
    var first = true;
    return through(write, end);
    
    function write (buf, enc, next) {
        if (first) writePrelude.call(this);
        this.push(buf);
        next();
    }
    function end () {
        if (first) writePrelude.call(this);
        if (opts.standalone) {
            this.push(
                '\n(' + JSON.stringify(self._mainModule) + ')'
                + umd.postlude(opts.standalone)
            );
        }
        this.push(';\n');
        this.push(null);
    }
    
    function writePrelude () {
        if (first && opts.standalone) {
            var pre = umd.prelude(opts.standalone).trim();
            this.push(pre + 'return ');
        }
        else if (first && self._hasExports) {
            var pre = opts.externalRequireName || 'require';
            this.push(pre + '=');
        }
        first = false;
    }
};

Browserify.prototype.reset = function (opts) {
    if (!opts) opts = {};
    this.pipeline = this._createPipeline(xtend(opts, this.options));
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

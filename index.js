var mdeps = require('module-deps');
var depsSort = require('deps-sort');
var bpack = require('browser-pack');
var insertGlobals = require('insert-module-globals');

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
var shasum = require('shasum');
var defined = require('defined');

var nextTick = typeof setImmediate !== 'undefined'
    ? setImmediate : process.nextTick
;

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
    
    if (isStream(file)) {
        self._pending ++;
        file.pipe(concat(function (buf) {
            var filename = opts.file || path.join(
                defined(opts.basedir, process.cwd()),
                '_stream_' + Math.floor(Math.pow(16,8) * Math.random()) + '.js'
            );
            var id = file.id || opts.expose || filename;
            if (opts.expose || opts.entry === false) {
                self._expose[id] = filename;
            }
            if (!opts.entry && self._options.exports === undefined) {
                self._hasExports = true;
            }
            self.pipeline.write({
                source: buf.toString('utf8'),
                entry: defined(opts.entry, true),
                file: filename,
                id: id
            });
            if (-- self._pending === 0) self.emit('ready');
        }));
        return this;
    }
    
    var row = typeof file === 'object'
        ? xtend(file, opts)
        : xtend(opts, { file: file })
    ;
    if (!row.id) {
        row.id = opts.expose || file;
        if (opts.expose || !row.entry) {
            this._expose[row.id] = file;
        }
        if (opts.expose) {
            this._mdeps.options.modules[opts.expose] = file;
        }
    }
    if (opts.external) return this.external(file, opts);
    if (row.entry === undefined) row.entry = false;
    
    if (!row.entry && this._options.exports === undefined) {
        this._hasExports = true;
    }
    this.pipeline.write(row);
    
    return this;
};

Browserify.prototype.add = function (file, opts) {
    if (!opts) opts = {};
    return this.require(file, xtend({ entry: true, expose: false }, opts));
};

Browserify.prototype.external = function (file) {
    this._external.push(file);
    return this;
};

Browserify.prototype.exclude = function (file) {
    this._exclude.push(file);
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
    if (!opts) opts = {};
    this._mdeps = this._createDeps(opts);
    var dopts = { index: true, dedupe: true, expose: this._expose };
    
    return splicer.obj([
        'deps', [ this._mdeps ],
        'unbom', [ this._unbom() ],
        'sort', [ depsSort(dopts) ],
        'dedupe', [ this._dedupe() ],
        'label', [ this._label() ],
        'emit-deps', [ this._emitDeps() ],
        'debug', [ this._debug(opts) ],
        'pack', [ bpack(xtend(opts, { raw: true })) ],
        'wrap', [ this._wrap(opts) ]
    ]);
};

Browserify.prototype._createDeps = function (opts) {
    var self = this;
    var mopts = copy(opts);
    mopts.extensions = [ '.js', '.json' ].concat(mopts.extensions || []);
    self._extensions = mopts.extensions;
    
    mopts.transformKey = [ 'browserify', 'transform' ];
    mopts.filter = function (id) {
        if (self._external.indexOf(id) >= 0) return false;
        if (self._exclude.indexOf(id) >= 0) return false;
        if (opts.bundleExternal === false && !/^([\/\.]|\w:)/.test(id)) {
            return false;
        }
        return true;
    };
    mopts.modules = opts.builtins !== undefined ? opts.builtins : builtins;
    mopts.globalTransform = [
        function (file) {
            var stream = through();
            if (/\.json$/.test(file)) {
                stream.push('module.exports=');
            }
            return stream;
        },
        function (file) {
            if (self._options.noparse === true) return through();
            var no = [].slice.call(self._options.noparse).filter(Boolean);
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
                process: function () { return "require('_process')" }
            }, opts.insertGlobalVars);
            return insertGlobals(file, xtend(opts, { vars: vars }));
        }
    ];
    return mdeps(mopts);
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

Browserify.prototype._label = function () {
    var self = this;
    return through.obj(function (row, enc, next) {
        var prev = row.id;
        row.id = row.index;
        self.emit('label', prev, row.id);
        
        row.deps = row.indexDeps || {};
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
        if (opts.debug) this.push('\n');
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
    this.pipeline = this._createPipeline(xtend(opts, this.options));
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
    if (cb) {
        this.pipeline.on('error', cb);
        this.pipeline.pipe(concat(function (body) {
            cb(null, body);
        }));
    }
    
    if (this._pending === 0) {
        this.pipeline.end();
    }
    else this.once('ready', function () {
        self.pipeline.end();
    });
    
    return this.pipeline;
};

function has (obj, key) { return Object.hasOwnProperty.call(obj, key) }
function isStream (s) { return s && typeof s.pipe === 'function' }

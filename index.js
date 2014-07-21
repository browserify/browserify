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

var nextTick = typeof setImmediate !== 'undefined'
    ? setImmediate : process.nextTick
;

module.exports = Browserify;
inherits(Browserify, EventEmitter);

function Browserify (files, opts) {
    var self = this;
    if (!(this instanceof Browserify)) return new Browserify(files, opts);
    if (!opts) opts = {};
    
    if (typeof files === 'string' || isarray(files)) {
        opts = xtend(opts, { entries: [].concat(opts.entries || [], files) });
    }
    else opts = xtend(files, opts);
    
    self._options = opts;
    self._external = [];
    self._exclude = [];
    self._expose = {};
    self.pipeline = self._createPipeline(opts);
    
    [].concat(opts.transform).filter(Boolean).forEach(function (tr) {
        self.transform(tr);
    });
    
    [].concat(opts.entries).filter(Boolean).forEach(function (file) {
        self.add(file);
    });
    
    [].concat(opts.require).filter(Boolean).forEach(function (file) {
        self.require(file);
    });
}

Browserify.prototype.require = function (file, opts) {
    if (!opts) opts = {};
    var row = typeof file === 'object'
        ? xtend(file, opts)
        : xtend(opts, { file: file })
    ;
    if (!row.id) {
        row.id = opts.expose || file;
        if (opts.expose !== false) {
            this._expose[row.id] = true;
        }
    }
    if (opts.external) return this.external(file, opts);
    
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
    return splicer.obj([
        'deps', [ this._mdeps ],
        'unbom', [ this._unbom() ],
        'sort', [ depsSort({ index: true }) ],
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
    mopts.modules = opts.builtins !== undefined
        ? opts.builtins
        : builtins
    ;
    mopts.globalTransform = [
        function (file) { return insertGlobals(file, opts) }
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

Browserify.prototype._label = function () {
    var self = this;
    return through.obj(function (row, enc, next) {
        if (!self._expose[row.id] && row.index !== undefined) {
            var prev = row.id;
            row.id = row.index;
            self.emit('label', prev, row.id);
        }
        row.deps = relabel(row.indexDeps || {});
        this.push(row);
        next();
    });
    
    function relabel (deps) {
        Object.keys(deps).forEach(function (key) {
            if (self._expose[key]) {
                deps[key] = key;
                return;
            }
            for (var i = 0; i < self._extensions.length; i++) {
                var ex = self._extensions[i];
                if (self._expose[key + ex]) {
                    deps[key] = key + ex;
                    return;
                }
            }
        });
        return deps;
    }
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
    this.pipeline.end();
    return this.pipeline;
};

function has (obj, key) { return Object.hasOwnProperty.call(obj, key) }

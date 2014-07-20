var mdeps = require('module-deps');
var bpack = require('browser-pack');
var umd = require('umd');
var shasum = require('shasum');

var splicer = require('labeled-stream-splicer');
var through = require('through2');
var concat = require('concat-stream');
var duplexer = require('duplexer2');

var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var xtend = require('xtend');
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
    self._options = opts;
    self.pipeline = self._createPipeline(opts);
    
    if (typeof files === 'string' || isarray(files)) {
        opts = xtend(opts, { entries: [].concat(opts.entries || [], files) });
    }
    else opts = xtend(files, opts);
    
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
    if (!row.id) row.id = opts.expose || file;
    if (!row.entry && this._options.exports === undefined) {
        this._hasExports = true;
    }
    
    this.pipeline.write(row);
    return this;
};

Browserify.prototype.add = function (file, opts) {
    if (!opts) opts = {};
    return this.require(file, xtend(opts, { entry: true }));
};

Browserify.prototype._createPipeline = function (opts) {
    var mopts = {};
    var bopts = { raw: true };
    return splicer.obj([
        'deps', [ mdeps(mopts) ],
        'label', [ this._label() ], this._emitDeps(),
        'pack', [ bpack(bopts), 'wrap', [ this._wrap(opts) ] ]
    ]);
};

Browserify.prototype._label = function () {
    var self = this;
    var index = 0;
    var map = {};
    return through.obj(function (row, enc, next) {
        if (/^\//.test(row.id) && row.id === row.file) {
            var prev = row.id;
            row.id = map[prev] = shasum(row.source).slice(0,8);
            self.emit('label', prev, row.id);
        }
        Object.keys(row.deps || {}).forEach(function (key) {
            var id = row.deps[key];
            if (has(map,id)) row.deps[key] = map[id];
        });
        this.push(row);
        next();
    })
};

Browserify.prototype._emitDeps = function () {
    var self = this;
    return through.obj(function (row, enc, next) {
        self.emit('dep', row);
        this.push(row);
        next();
    })
};

Browserify.prototype._wrap = function (opts) {
    var self = this;
    var first = true;
    return through(function write (buf, enc, next) {
        if (first && opts.standalone) {
            var pre = umd.prelude(opts.standalone).trim();
            this.push(pre + 'return ');
        }
        else if (first && self._hasExports) {
            var pre = opts.externalRequireName || 'require';
            this.push(pre + '=');
        }
        first = false;
        this.push(buf);
        next();
    });
};

Browserify.prototype.reset = function (opts) {
    this.pipeline = this._createPipeline(xtend(opts, this.options));
    this.emit('reset');
};

Browserify.prototype.bundle = function (cb) {
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

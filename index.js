var mdeps = require('module-deps');
var bpack = require('browser-pack');
var umd = require('umd');

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
    self.pipeline = this._createPipeline(opts);
    
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
    var row = typeof file === 'object'
        ? xtend(file, opts)
        : xtend(opts, { file: file })
    ;
    if (!row.id) row.id = file;
    if (!row.entry && this._options.exports === undefined) {
        this._hasExports = true;
    }
    
    this.pipeline.write(row);
    return this;
};

Browserify.prototype.add = function (file) {
    var row = typeof file === 'object'
        ? xtend(file, { entry: true })
        : { file: file, entry: true }
    ;
    this.pipeline.write(row);
    return this;
};

Browserify.prototype._createPipeline = function (opts) {
    var self = this;
    
    var mopts = {};
    var bopts = { raw: true };
    return splicer.obj([
        'deps', [ mdeps(mopts) ],
        'pack', [ bpack(bopts) ],
        'wrap', [ wrap() ]
    ]);
    
    function wrap () {
        var first = true;
        return through.obj(function write (buf, enc, next) {
            if (first && self._options.standalone) {
                var pre = umd.prelude(self._options.standalone).trim();
                this.push(pre + 'return ');
            }
            else if (first && self._hasExports) {
                var pre = self._options.externalRequireName || 'require';
                this.push(pre + '=');
            }
            first = false;
            this.push(buf);
            next();
        });
    }
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

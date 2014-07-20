var mdeps = require('module-deps');
var bpack = require('browser-pack');

var splicer = require('labeled-stream-splicer');
var through = require('through2');
var concat = require('concat-stream');
var duplexer = require('duplexer2');

var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;

var nextTick = typeof setImmediate !== 'undefined'
    ? setImmediate : process.nextTick
;

module.exports = Browserify;
inherits(Browserify, EventEmitter);

function Browserify (files, opts) {
    var self = this;
    if (!(this instanceof Browserify)) return new Browserify(files, opts);
    
    var mopts = {};
    var bopts = { raw: true };
    
    var md = mdeps([], mopts);
    var mdout = through.obj();
    
    var mdin = through.obj(fwrite, fend);
    function fwrite (file, enc, next) {
        md.add(file);
        next();
    }
    function fend () { md.pipe(mdout) }
    
    this.pipeline = splicer.obj([
        'deps', [ duplexer(mdin, mdout) ],
        'pack', [ bpack(bopts) ]
    ]);
    
    this._next = [ function () {
        [].concat(files).filter(Boolean).forEach(function (file) {
            self.pipeline.write(file);
        });
    } ];
    
    nextTick(function () { while (self._next.length) self._next.shift()() });
}

Browserify.prototype.reset = function () {
    while (this._next.length) this._next.shift()();
    
    // todo: parity with constructor version
    this.pipeline = splicer([ 'deps', mdeps(), 'pack', bpack() ]);
    this._bundled = false;
    this.emit('reset');
};

Browserify.prototype.bundle = function (cb) {
    while (this._next.length) this._next.shift()();
    
    if (cb) {
        this.pipeline.on('error', cb);
        this.pipeline.pipe(concat(function (body) {
            cb(null, body)
        }));
    }
    this.pipeline.end();
    return this.pipeline;
};

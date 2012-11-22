var path = require('path');
var EventEmitter = require('events').EventEmitter;
var Stream = require('stream');

var inherits = require('inherits');
var required = require('required');
var JSONStream = require('JSONStream');

var bundle = require('./lib/bundle');

exports = module.exports = Browserify;
exports.bundle = bundle;
inherits(Browserify, Stream);

function Browserify (files) {
    var self = this;
    if (!(self instanceof Browserify)) return new Browserify(files);
    
    self.readable = true;
    self.cache = {};
    self.deps = {};
    self.stringify = JSONStream.stringify();
    
    [ 'data', 'end', 'close', 'error' ].forEach(function (name) {
        self.stringify.on(name, self.emit.bind(self, name));
    });
    
    files = [].concat(files).filter(Boolean);
    files.forEach(function (file) { self.addEntry(file) });
}

Browserify.prototype.addEntry = function (file) {
    var self = this;
    
    required(file, { cache : self.cache }, function (err, deps) {
        if (err) return self.emit('error', err);
        
        var ds = flatten(deps);
        Object.keys(ds).forEach(function (file) {
            if (self.deps[file]) return;
            
            self.deps[file] = ds[file];
            self.stringify.write(ds[file]);
        });
    });
};

Browserify.prototype.require = function () {
};

Browserify.prototype.bundle = function () {
    this.pipe(bundle());
};

function flatten (deps, out) {
    return deps.reduce(function (acc, d_) {
        var d = shallowCopy(d_);
        if (!acc[d.filename]) acc[d.filename] = d;
        
        var res = flatten(d.deps, acc);
        d.deps = d.deps.map(function (x) { return x.filename });
        
        return res;
    }, out || {});
}

function shallowCopy (obj) {
    return Object.keys(obj).reduce(function (acc, key) {
        acc[key] = obj[key];
        return acc;
    }, {});
}

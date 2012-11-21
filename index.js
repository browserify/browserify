var path = require('path');
var EventEmitter = require('events').EventEmitter;
var through = require('through');

var required = require('required');

module.exports = function (files, cb) {
    files = [].concat(files).filter(Boolean);
    var outStream = through();
    
    required(files[0], function (err, deps) {
        console.dir(flatten(deps));
    });
    
    return outStream;
};

function flatten (deps, out) {
    return deps.reduce(function (acc, d) {
        if (!acc[d.id]) acc[d.id] = d;
        return flatten(d.deps, acc);
    }, out || {});
}

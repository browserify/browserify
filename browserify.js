var path = require('path');
var fs = require('fs');
var Step = require('step');

module.exports = function Browserify (name, nodeSource) {
    if (!(this instanceof Browserify)) return new Browserify(name, nodeSource);
    
    if (nodeSource === undefined) nodeSource = process.env.NODE_SOURCE;
    
    var requirePaths = nodeSource
        ? [ nodeSource + '/lib' ].concat(require.paths)
        : require.paths
    ;
    
    this.path = function (cb) {
        Step();
    };
    
    this.pathSync = function () {
        return firstMap(requirePaths, function (dir) {
            if (!path.existsSync(dir)) return undefined;
            return firstMap(
                [ '.js', '.node', '/index.js', '/index.node' ]
                    .map(function (suf) { return dir + '/' + name + suf }),
                function (file) { if (path.existsSync(file)) return file }
            );
        });
    };
};

function firstMap (xs, f) {
    for (var i = 0; i < xs.length; i++) {
        var x = f(xs[i], i);
        if (x !== undefined) return x;
    }
    return undefined;
}

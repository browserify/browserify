var path = require('path');
var fs = require('fs');
var Step = require('step');

module.exports = function Browserify (nodeSource) {
    if (!(this instanceof Browserify)) return new Browserify(nodeSource);
    
    if (nodeSource === undefined) nodeSource = process.env.NODE_SOURCE;
    
    var requirePaths = nodeSource
        ? [ nodeSource + '/lib' ].concat(require.paths)
        : require.paths
    ;
    
    var sources = [];
    
    this.pathSync = function (name, searchDirs) {
        if (arguments.length == 1) searchDirs = requirePaths;
        
        return firstMap(searchDirs, function (dir) {
            if (!path.existsSync(dir)) return undefined;
            return firstMap(
                [ '.js', '.node', '/index.js', '/index.node' ]
                    .map(function (suf) { return dir + '/' + name + suf }),
                function (file) { if (path.existsSync(file)) return file }
            );
        });
    };
    
    this.require = function (name) {
        var p = name.match(/^[\/.]/)
            ? this.pathSync(name, [ name.charAt(0) ])
            : this.pathSync(name);
        sources.push(fs.readFileSync(p));
        return this;
    };
    
    this.bundle = function () {
        return sources.join('\m');
    };
};

function firstMap (xs, f) {
    for (var i = 0; i < xs.length; i++) {
        var x = f(xs[i], i);
        if (x !== undefined) return x;
    }
    return undefined;
}

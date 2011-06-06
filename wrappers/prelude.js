var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '');
    var mod = require.modules[resolved];
    var res = mod._cached ? mod._cached : mod();
    return res;
}
var __require = require;

require.paths = [];
require.modules = {};

require.resolve = function (rfile, cwd) {
    var path = require.modules['path.js']();
    
    var file = cwd === ''
        ? rfile
        : path.resolve(cwd, rfile)
    ;
    if (cwd === '.') file = './' + file;
    
    var routes = [
        file,
        file + '.js',
        [ file + '/package.json', function (p) {
            var pkg = require.modules[p]();
            var main = path.resolve(file, pkg.main);
            return main;
        } ],
        [ file + '/index.js', function (p) {
            return p;
        } ],
    ];
    
    if (!rfile.match(/\//)) {
        // core modules
        routes.unshift(rfile + '.js');
    }
    
    for (var i = 0; i < routes.length; i++) {
        var route = routes[i];
        var fn = String;
        
        if (Array.isArray(routes[i])) {
            fn = route[1];
            route = route[0];
        }
        
        if (require.modules[route]) {
            var res = fn(route);
            if (res) return res;
        }
    }
    
    throw new Error('Cannot find module ' + JSON.stringify(rfile));
};

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
    
    var mfile = cwd === ''
        ? rfile
        : path.resolve(cwd, 'node_modules/' + rfile)
    ;
    if (cwd === '.') file = './' + file;
    
    var routes = [
        [ file + '/package.json', function (p) {
            var pkg = require.modules[p]();
            var main = path.resolve(file, pkg.main);
            return main;
        } ],
        file,
        file + '.js',
        file + '/index.js',
        [ mfile + '/package.json', function (p) {
            var pkg = require.modules[p]();
            var main = path.resolve(mfile, pkg.main);
            return main;
        } ],
        mfile,
        mfile + '.js',
        mfile + '/index.js'
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
        
        var r = path.normalize(route);
        if (route.match(/^\./)) r = './' + r;
        
        if (require.modules[r]) {
            var res = fn(r);
            if (res) return res;
        }
    }
    
    throw new Error('Cannot find module ' + JSON.stringify(rfile));
};

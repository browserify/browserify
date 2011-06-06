var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '');
    var mod = require.modules[resolved];
    var res = mod._cached ? mod._cached : mod();
    return res;
}
var __require = require;

require.paths = [];
require.modules = {};

require.resolve = function (file, cwd) {
    var path = require.modules['path.js']();
    var resolve = function (p) {
        var res = path.resolve(cwd, p);
        if (p.match(/^\.\.?\//)) res = './' + res;
        return res;
    };
    
    var routes = [];
    
    if (!file.match(/\//)) {
        // core modules
        routes.push(file);
    }
    
    if (file.match(/^\.\.?\//)) {
        // relative paths
        routes.push(resolve(file));
    }
    else {
        var ps = cwd.split('/');
        for (var i = ps.length; i > 0; i--) {
            routes.push(
                ps.slice(0, i).join('/') + '/node_modules/' + file
            );
        }
    }
    
    for (var i = 0; i < routes.length; i++) {
        var route = routes[i];
        
        var paths = [
            [ route + '/package.json', function (p) {
                var pkg = require.modules[p]();
                return pkg.main && path.resolve(route, pkg.main);
            } ],
            route,
            route + '.js',
            route + '/index.js'
        ];
        
        for (var j = 0; j < paths.length; j++) {
            var fn = String;
            var p = paths[j];
            
            if (Array.isArray(p)) {
                fn = p[1];
                p = p[0];
            }
            
            if (require.modules[p]) {
                var res = fn(p);
                if (res) {
                    var post = [ '', '.js', '/index.js' ].filter(function (x) {
                        return require.modules[res + x]
                    })[0];
                    if (post !== undefined) return res + post;
                }
            }
        }
    }
    
    throw new Error('Cannot find module ' + JSON.stringify(file));
};

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
    var path = require.modules['path']();
    var resolve = function (p) {
        if (p === '.' || p === './') return '.';
        
        var res = path.resolve(cwd, p);
        if (p.match(/^\.\.?\//) && (cwd === '' || cwd.match(/^\./))) {
            res = './' + res;
        }
        return res;
    };
    
    var routes = [];
    
    if (!file.match(/\/|\./) && require.modules[file]) {
        // core modules
        if (require.modules[file].builtin) routes.push(file);
    }
    
    if (file.match(/^\.\.?\//)) {
        // relative paths
        routes.push(resolve(file));
    }
    else {
        var ps = cwd.split('/');
        for (var i = ps.length; i > 0; i--) {
            var p = ps.slice(0, i).join('/');
            if (p.length) routes.push(p + '/node_modules/' + file);
        }
        
        routes.push('./node_modules/' + file);
        routes.push(file);
    }
    
    for (var i = 0; i < routes.length; i++) {
        var route = routes[i];
        
        var paths = [
            [ route + '/package.json', function (p) {
                var pkg = require.modules[p]();
                if (pkg.main) {
                    var res = path.resolve(route, pkg.main);
                    if (route.match(/^\./)) res = './' + res;
                    return res;
                }
            } ],
            route,
            route + '.js',
            route + '.coffee',
            route + '/index.js',
            route + '/index.coffee'
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
                    var post = [
                        '', '.js', '.coffee', '/index.js', '/index.coffee'
                    ].filter(function (x) {
                        return require.modules[res + x]
                    })[0];
                    if (post !== undefined) return res + post;
                }
            }
        }
    }
    
    throw new Error('Cannot find module ' + JSON.stringify(file));
};

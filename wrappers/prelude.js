var require = function (file, relativeTo) {
    var resolved = require.resolve(file, relativeTo);
    var mod = require.modules[resolved];
    var res = mod._cached ? mod._cached : mod();
    return res;
}
var __require = require;

require.paths = [];
require.modules = {};

require.resolve = function (file, relativeTo) {
    var path = require.modules['path.js']();
    
    var ps = (relativeTo || './').split('/').slice(0,-1);
    for (var i = ps.length; i >= 0; i--) {
        var p = ps.slice(0,i).join('/');
        var pmod = p === '' ? '' : p + '/node_modules/';
        
        var pkgFile = pmod + file + '/package.json';
        var pkg = require.modules[pkgFile];
        if (pkg) pkg = pkg();
        if (pkg && pkg.main) {
            var res = path.resolve(path.dirname(pkgFile), pkg.name);
            if (require.modules[res]) return res;
            if (require.modules[res + '.js']) return res + '.js';
        }
        
        var paths = [
            pmod + file,
            pmod + file + '.js',
            pmod + file + '/index.js',
        ];
        for (var j = 0; j < paths.length; j++) {
            var pj = paths[j].replace(/\/\.\//g, '/');
            if (require.modules[pj]) return pj;
        }
    }
    
    if (require.modules[file]) return file;
    if (require.modules[file + '.js']) return file + '.js';
    
    throw new Error('Cannot find module ' + JSON.stringify(file));
};

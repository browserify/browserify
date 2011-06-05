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
    var normalize = function (s) {
        return s
            .replace(/\/\.\//g, '/')
            .replace(/\/+/g, '/')
        ;
    };
    
    if (relativeTo) {
        try {
            var res = path.resolve(path.dirname(relativeTo), file);
            if (file.charAt(0) === '.') res = './' + res;
            return require.resolve(res);
        }
        catch (err) {}
    }
    
    var ps = path.dirname(relativeTo || '').split('/');
    for (var i = ps.length; i >= 0; i--) {
        var p = ps.slice(0,i).join('/');
        var pmod = p === '' ? '' : p + '/node_modules/';
        
        var pkgFile = normalize(pmod + file + '/package.json');
        
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
            var pj = normalize(paths[j]);
            if (require.modules[pj]) return pj;
        }
    }
    
    var pkgFile = normalize(file + '/package.json');
    var pkg = require.modules[pkgFile];
    if (pkg) pkg = pkg();
    if (pkg && pkg.main) {
        var res = path.resolve(path.dirname(pkgFile), pkg.main);
        if (pkgFile.charAt(0) === '.') res = './' + res;
        if (require.modules[res]) return res;
        if (require.modules[res + '.js']) return res + '.js';
    }
    
    if (require.modules[file]) return file;
    if (require.modules[file + '.js']) return file + '.js';
    
    throw new Error('Cannot find module ' + JSON.stringify(file));
};

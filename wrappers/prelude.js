function require (file, relativeTo) {
    var resolved = require.resolve(file, relativeTo);
    var mod = require.modules[resolved];
    return mod._cached ? mod._cached : mod();
}

require.paths = [];
require.modules = {};

require.resolve = function (file, relativeTo) {
    var path = require.modules[path + '.js'];
    
    var ps = (relativeTo || '').split('/').slice(0,-1);
    for (var i = ps.length; i > 0; i--) {
        var p = ps.slice(0,i).join('/');
        var paths = [
            p + '/node_modules/' + file,
            p + '/node_modules/' + file + '.js',
            p + '/node_modules/' + file + '/index.js',
        ];
        for (var j = 0; j < paths.length; j++) {
            var pj = paths[j];
            if (require.modules[pj]) return pj;
        }
        
        var pkgFile = p + '/node_modules/' + file + '/package.json';
        var pkg = require.modules[pkgFile];
        if (pkg && pkg.main) {
            var res = path.resolve(path.dirname(pkgFile), pkg.name);
            if (require.modules[res]) return res;
            if (require.modules[res + '.js']) return res + '.js';
        }
    }
    
    if (require.modules[file]) return file;
    if (require.modules[file + '.js']) return file + '.js';
    
    throw new Error('Cannot find module ' + JSON.stringify(file));
};

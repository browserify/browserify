function require (path) {
    // not EXACTLY like how node does it but more appropriate for the browser
    var mod
        = require.modules[path]
        || require.modules[path.replace(/\.(js|coffee)$/, '')]
        || require.modules[path + '/index']
    ;
    
    if (!mod) throw new Error("Cannot find module '" + path + "'");
    return mod._cached ? mod._cached : mod();
}

var _browserifyRequire = require; // scoping >_<

require.paths = [];
require.modules = {};

require.fromFile = function (filename, path) {
    // require a file with respect to a path
    var resolved = _browserifyRequire.resolve(filename, path);
    return _browserifyRequire(resolved)
};

require.resolve = function (basefile, file) {
    if (_browserifyRequire.modules[basefile + '/node_modules/' + file]) {
        return basefile + '/node_modules/' + file;
    }
    if (!file.match(/^[\.\/]/)) return file;
    if (file.match(/^\//)) return file;
    
    var basedir = basefile.match(/^[\.\/]/)
        ? basefile.replace(/[^\/]+$/, '')
        : basefile
    ;
    if (basedir === '') {
        basedir = '.';
    }
    
    // normalize file path.
    var r1 = /[^\/.]+\/\.\./g;
    var r2 = /\/{2,}/g;
    for(
        var norm = file;
        norm.match(r1) != null || norm.match(r2) != null;
        norm = norm.replace(r1, '').replace(r2, '/')
    );
    
    while (norm.match(/^\.\.\//)) {
        if (basedir === '/' || basedir === '') {
            throw new Error("Couldn't resolve path"
                + "'" + file + "' with respect to filename '" + basefile + "': "
                + "file can't resolve past base"
            );
        }
        norm = norm.replace(/^\.\.\//, '');
        basedir = basedir.replace(/[^\/]+\/$/, '');
    }
    
    var n = basedir.match(/\//)
        ? basedir.replace(/[^\/]+$/,'') + norm
        : norm.replace(/^\.\//, basedir + '/');
    return n.replace(/\/.\//, '/');
};

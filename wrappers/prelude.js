function require (path) {
    if (!require.modules[path]) {
        throw new Error("Cannot find module '" + path + "'");
    }
}

var _browserifyRequire = require; // scoping >_<

require.modules = {};

require.fromFile = function (filename, path) {
    // require a file with respect to a path
    var resolved = _browserifyRequire.resolve(filename, path);
    _browserifyRequire(resolved)
};

require.resolve = function (basefile, file) {
    var basedir = basefile.replace(/[^\/]+$/, '');
    if (basedir === '') basedir = '.';
    
    var norm = file.replace(/[^\/]+\/\.\./g).replace(/\/+/g,'/');
    while (norm.match(/^\.\.\//)) {
        norm = norm.replace(/^\.\.\//, '');
        basedir = basedir.replace(/^[^\/]+$/, '');
        if (basedir === '') throw new Error("Couldn't resolve path"
            + "'" + file + "' with respect to filename '" + basefile + "': "
            + "file can't resolve past base"
        );
    }
    return norm;
};

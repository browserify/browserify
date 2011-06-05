_browserifyRequire.modules[$__filename] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = $__dirname;
    var __filename = $__filename;
    
    var require = function (path) {
        return _browserifyRequire.fromFile($__filename, path);
    };
    require.modules = _browserifyRequire.modules;
    require.resolve = function (name) {
        return _browserifyRequire.resolve(name, $__dirname);
    };
    _browserifyRequire.modules[$__filename]._cached = module.exports;
    
    (function () {
        $body;
    }).call(module.exports);
    
    _browserifyRequire.modules[$__filename]._cached = module.exports;
    return module.exports;
};

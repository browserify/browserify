require.modules[$__filename] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = $__dirname;
    var __filename = $__filename;
    
    var require = function (file) {
        return __require(file, $__dirname);
    };
    
    require.resolve = function (file) {
        return __require.resolve(name, $__dirname);
    };
    
    require.modules = __require.modules;
    __require.modules[$__filename]._cached = module.exports;
    
    (function () {
        $body;
    }).call(module.exports);
    
    __require.modules[$__filename]._cached = module.exports;
    return module.exports;
};

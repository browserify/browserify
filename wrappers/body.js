_browserifyRequire.modules[$filename] = function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = $__dirname;
    var __filename = $__filename;
    
    var require = function (path) {
        return _browserifyRequire.fromFile($filename, path);
    };
    
    (function () {
        $body;
    }).call(module.exports);
    
    _browserifyRequire.modules[$filename]._cached = module.exports;
    return module.exports;
};

$aliases.forEach(function (a) {
    _browserifyRequire.modules[a] = _browserifyRequire.modules[$filename];
});

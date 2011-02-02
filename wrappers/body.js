(function () {
    var module = _browserifyRequire.modules[$filename] = { exports : {} };
    var exports = module.exports;
    var require = function (path) {
        return _browserifyRequire.fromFile($filename, path);
    };
    
    (function () {
        $body;
    })();
    
    module.exports = exports; // take THAT, node :p
})();

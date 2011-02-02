(function () {
    var module = require.modules[$filename] = { exports : {} };
    var exports = module.exports;
    var _browserifyRequire = require;
    var require = function (path) {
        return _browserifyRequire.fromFile(filename, path);
    };
    
    (function () {
        $body;
    })();
    
    module.exports = exports; // take THAT, node :p
})();

process.nextTick(function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = $__dirname;
    var __filename = $__filename;
    
    var __require = require;
    
    var require = function (file) {
        return require(file, $__filename);
    };
    require.modules = __require.modules;
    
    $body;
});

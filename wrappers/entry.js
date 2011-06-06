process.nextTick(function () {
    var module = { exports : {} };
    var exports = module.exports;
    var __dirname = $__dirname;
    var __filename = $__filename;
    
    var require = function (file) {
        return __require(file, $__dirname);
    };
    require.modules = __require.modules;
    
    $body;
});

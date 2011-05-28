var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');

exports.middleware = function () {
    var bundle = browserify(__dirname + '/middleware');
    bundle.use(function (src, next) {
        setTimeout(function () {
            next(src + '\nvar yyy = 444;');
        }, 50);
    });
    bundle.use(function (src, next) {
        setTimeout(function () {
            next(src + '\nvar zzz = yyy + 111;');
        }, 50);
    });
    
    var to = setTimeout(function () {
        assert.fail('middleware never ready');
    }, 5000);
    
    bundle.on('ready', function (src) {
        var c = { console : console };
        vm.runInNewContext(src, c);
        assert.equal(c.require('./'), 555);
    });
};

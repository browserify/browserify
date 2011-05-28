var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');

exports.middleware = function () {
    var bundle = browserify(__dirname + '/middleware')
        .use(function (src, next) {
            assert.equal(bundle, this);
            setTimeout(function () {
                next(src + '\nvar yyy = 444;');
            }, 50);
        })
        .use(function (src, next) {
            setTimeout(function () {
                next(src + '\nvar zzz = yyy + 111;');
            }, 50);
        })
    ;
    
    var to = setTimeout(function () {
        assert.fail('middleware never ready');
    }, 5000);
    
    bundle.on('ready', function (src) {
        clearTimeout(to);
        var c = { console : console };
        vm.runInNewContext(src, c);
        assert.equal(c.require('./')(), 555);
    });
};

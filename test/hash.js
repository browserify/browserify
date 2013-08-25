var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

test('hash', function (t) {
    t.plan(2);
    
    var b = browserify(__dirname + '/hash/main.js');
    b.bundle(function (err, src) {
        var c = { t: t };
        vm.runInNewContext(src, c);
    });
});

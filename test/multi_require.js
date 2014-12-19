var browserify = require('../');
var test = require('tap').test;
var vm = require('vm');

test('require same file locally and globally', function (t) {
    t.plan(1);

    var b = browserify(__dirname + '/multi_require/main.js');
    b.require('./multi_require/a.js', {expose: 'a'});

    b.bundle(function (err, src) {
        var c = {t: t};
        vm.runInNewContext(src, c);
        t.end()
    });
});

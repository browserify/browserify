var browserify = require('../');
var test = require('tap').test;

test('bundle in debug mode', function (t) {
    var b = browserify();
    b.require('seq');
    b.bundle({ debug: true }, function (err, src) {
        t.plan(4);

        var secondtolastLine = src.split('\n').slice(-2);

        t.ok(typeof src === 'string');
        t.ok(src.length > 0);
        t.ok(/^\/\/@ sourceMappingURL=/.test(secondtolastLine), 'includes sourcemap');
        t.ok(src.split('\n').slice(-1)[0].length == 0, 'source map is the last non-empty line');
    });
});

test('bundle in non debug mode', function (t) {
    var b = browserify();
    b.require('seq');
    b.bundle(function (err, src) {
        t.plan(3);
        
        var secondtolastLine = src.split('\n').slice(-2);

        t.ok(typeof src === 'string');
        t.ok(src.length > 0);
        t.notOk(/^\/\/@ sourceMappingURL=/.test(secondtolastLine), 'includes no sourcemap');
    });
});

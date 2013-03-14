var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

test('global', function (t) {
    t.plan(2);
    
    var b = browserify();
    b.add(__dirname + '/global/main.js');
    b.bundle(function (err, src) {
        var c = {
            t : t,
            a : 555,
        };
        c.window = c;
        vm.runInNewContext(src, c);
    });
});

test('__filename and __dirname', function (t) {
    t.plan(2);
    
    var b = browserify();
    b.expose('x', __dirname + '/global/filename.js');
    b.bundle(function (err, src) {
        var c = {};
        vm.runInNewContext(src, c);
        var x = c.require('x');
        t.equal(x.filename, '/filename.js');
        t.equal(x.dirname, '/');
    });
});

test('process.nextTick', function (t) {
    t.plan(1);
    
    var b = browserify();
    b.add(__dirname + '/global/tick.js');
    b.bundle(function (err, src) {
        var c = { t: t, setTimeout: setTimeout };
        vm.runInNewContext(src, c);
    });
});

test('Buffer', function (t) {
    t.plan(2);
    
    var b = browserify();
    b.add(__dirname + '/global/buffer.js');
    b.bundle(function (err, src) {
        var c = { t: t };
        vm.runInNewContext(src, c);
    });
});

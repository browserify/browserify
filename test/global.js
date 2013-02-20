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
    b.add(__dirname + '/global/filename.js');
    b.bundle(function (err, src) {
        var c = {};
        vm.runInNewContext(src, c);
        t.equal(c.filename, '/filename.js');
        t.equal(c.dirname, '/');
    });
});

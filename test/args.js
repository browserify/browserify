var test = require('tap').test;
var fromArgs = require('../bin/args.js');
var path = require('path');
var vm = require('vm');

test('bundle from an arguments array', function (t) {
    t.plan(1);
    
    var b = fromArgs([ __dirname + '/entry/two.js', '-s', 'XYZ' ]);
    b.bundle(function (err, src) {
        var c = { window: {} };
        vm.runInNewContext(src, c);
        t.equal(c.window.XYZ, 2);
    });
});

test('external flag for node modules', function(t) {
    t.plan(1);
    
    var b = fromArgs([ __dirname + '/external_args/main.js', '-x', 'backbone' ]);
    b.bundle(function (err, src) {
        vm.runInNewContext(src, {t: t});
    });
});

test('bundle from an arguments with --insert-global-vars', function (t) {
    t.plan(2)

    var b = fromArgs([ __dirname + '/global/filename.js', '--insert-global-vars=__filename,__dirname' ]);
    b.require(__dirname + '/global/filename.js', { expose: 'x' });
    b.bundle({ basedir: __dirname }, function (err, src) {
        var c = {};
        vm.runInNewContext(src, c);
        var x = c.require('x');
        t.equal(x.filename, '/global/filename.js');
        t.equal(x.dirname, '/global');
    })
});

/*
Test that b.require() can not add a transform by passing a `transform` property
on an arg.
*/

var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;
var through = require('through2');
var path = require('path');

var requirePath = path.join(__dirname, 'tr', 'package.json');

// Require file path with file.transform prop.
test('b.require transform prop file path', function (t) {
    requireTest(t, {
        requirePath: requirePath,
        transformVia: 'file',
    });
});

// Require file path with opts.transform prop.
test('b.require transform prop file path', function (t) {
    requireTest(t, {
        requirePath: requirePath,
        transformVia: 'opts',
    });
});

function requireTest (t, opts) {
    opts = opts || {};
    t.plan(1);

    var expected = { key: 'test', val: 'abc' };

    // The canary.
    var entry = through();
    entry.end(Buffer(expected.key + ' = "' + expected.val + '";'));

    var requireArgs = { opts: {} };

    if (opts.requirePath) requireArgs.file = { file: opts.requirePath };
    else {
        requireArgs.file = through();
        requireArgs.file.end('"xyz";');
        requireArgs.file.file = 'nonexistent';
    }

    // This prop should end up being disregarded, whichever arg it's on.
    requireArgs[opts.transformVia].transform = transform;

    // b.require() currently treats b.require(obj) and b.require([obj])
    // differently. Hence the array wrapper here. See:
    // https://github.com/substack/node-browserify/issues/1220
    if (opts.requirePath) requireArgs.file = [requireArgs.file];

    // This should not be applied.
    function transform (file) {
        return through(function (buf, enc, next) {
            next(null, Buffer(buf.toString().toUpperCase()));
        });
    }

    var b = browserify({ entries: entry });
    // This call should not result in a transform being registered.
    b.require(requireArgs.file, requireArgs.opts);
    b.bundle(function (err, src) {
        if (err) throw err;
        var context = { t: t };
        vm.runInNewContext(src, context);
        t.equal(
            context[expected.key],
            expected.val,
            "Entry file should be untransformed."
        );
    });
}
// requireTest

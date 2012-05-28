var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

test('globals', function (t) {
    t.plan(1);

    var src = browserify.bundle({
        require: __dirname + '/globals/main.js'
    });
    var c = {};

    vm.runInNewContext(src, c);

    t.deepEqual(
        Object.keys(c.require.modules).sort(),
        [
            'assert',
            'buffer',
            'buffer_ieee754',
            'events',
            'path',
            'util',
            '/main.js',
        ].sort()
    );

    t.end();
});

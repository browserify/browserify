var browserify = require('../');
var path = require('path');
var test = require('tap').test;

function filter(x) {
    var s = __dirname + '/core_resolve/';
    return x.slice(0, s.length) === s;
}

test('core_resolve', function (t) {
    t.plan(1);

    var files = browserify({
        require: __dirname + '/core_resolve/main.js',
        dirname: path.resolve(__dirname, 'core_resolve')
    }).files;

    t.deepEqual(
        Object.keys(files).filter(filter).sort(),
        [
            __dirname + '/core_resolve/main.js',
            __dirname + '/core_resolve/node_modules/http-browserify/package.json',
            __dirname + '/core_resolve/node_modules/http-browserify/main.js'
        ].sort()
    );

    t.end();
});

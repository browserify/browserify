var assert = require('assert');
var browserify = require('../');
var vm = require('vm');

exports.subdep = function () {
    var src = browserify.bundle(__dirname + '/subdep/index.js');
    var c = {};
    vm.runInNewContext(src, c);
    assert.deepEqual(
        Object.keys(c.require.modules).sort(),
        [
            '/package.json',
            '/index.js',
            '/node_modules/qq/package.json',
            '/node_modules/qq/b.js',
            '/node_modules/qq/node_modules/a/package.json',
            '/node_modules/qq/node_modules/a/index.js',
            '/node_modules/qq/node_modules/z/index.js',
            'path'
        ].sort()
    );
};

var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');

exports.subdep = function () {
    var src = browserify.bundle(__dirname + '/subdep');
    var c = {};
    vm.runInNewContext(src, c);
    console.dir(Object.keys(c.require.modules));
};

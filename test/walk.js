var assert = require('assert');
var vm = require('vm');
var browserify = require('browserify');

exports.walk = function () {
    var src = browserify.bundle(__dirname + '/walk');
    var c = {};
    
    vm.runInNewContext(src, c);
    var a = require('a');
    var b = require('b');
    var c = require('c');
console.dir(c.require.modules);
};

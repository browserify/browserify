var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');

exports.stringBase = function () {
console.log('1');
    var src = browserify.bundle(__dirname + '/base/string');
console.log('2');
    
    var c = {};
    vm.runInNewContext(src, c);
    console.dir(c.require.modules);
console.log('3');
    
    assert.eql(
        vm.runInNewContext('require("quux")(3)', c),
        13000
    );
};

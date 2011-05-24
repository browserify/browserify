var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');

exports.stringBase = function () {
    var src = browserify.bundle(__dirname + '/base/string');
    
    var c = {};
    vm.runInNewContext(src, c);
    console.dir(c.require.modules);
    
    assert.eql(
        vm.runInNewContext('require("quux")(3)', c),
        13000
    );
};

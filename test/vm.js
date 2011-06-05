var assert = require('assert');
var vm = require('vm');
var browserify = require('browserify');

exports.vm = function () {
    var src = browserify.bundle();
    
    var c = {};
    vm.runInNewContext(src, c);
    
    assert.ok(c.require.modules.vm);
    var vm_ = c.require('vm');
};

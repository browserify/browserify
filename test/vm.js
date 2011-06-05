var assert = require('assert');
var vm = require('vm');
var browserify = require('browserify');

exports.vm = function () {
    var src = browserify.bundle();
    
    var c0 = {};
    vm.runInNewContext(src, c0);
    
    assert.ok(c0.require.modules.vm);
    var vm0 = c0.require('vm');
    
    // so meta...
    var c1 = {};
    var vm1 = vm0.runInNewContext(src, c1);
    assert.ok(c1.require.modules.vm);
};

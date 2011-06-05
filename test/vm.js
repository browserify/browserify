var assert = require('assert');
var vm = require('vm');
var browserify = require('browserify');

exports.vmRunInNewContext = function () {
    var src = browserify.bundle();
    
    var c0 = { console : console };
    vm.runInNewContext(src, c0);
    
    assert.ok(c0.require.modules.vm);
    var vm0 = c0.require('vm');
    
    assert.equal(
        vm0.runInNewContext('a + 5', { a : 100 }),
        105
    );
    
    // use the wrapped vm to wrap itself
    var c1 = {};
    var vm1 = vm0.runInNewContext(src, c1);
    assert.ok(c1.require.modules.vm);
};

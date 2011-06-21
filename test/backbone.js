var assert = require('assert');
var browserify = require('../');
var vm = require('vm');
var backbone = require('backbone');

exports.backbone = function () {
    var src = browserify.bundle({
        require : 'backbone'
    });
    assert.ok(typeof src === 'string');
    assert.ok(src.length > 0);
    
    var c = { console : console };
    vm.runInNewContext(src, c);
    assert.eql(
        Object.keys(backbone).sort(),
        Object.keys(c.require('backbone')).sort()
    );
};

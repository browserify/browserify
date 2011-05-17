var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');
var Hash = require('hashish');

exports.modules = function () {
    var src = browserify.bundle({
        base : {
            'foomoduletest' : __dirname + '/modules/foomoduletest'
        },
    });
    
    assert.ok(typeof src === 'string');
    assert.ok(src.length > 0);
    
    var c = {};
    vm.runInNewContext(src, c);
    assert.eql(c.require('foomoduletest').bar, 55)
};

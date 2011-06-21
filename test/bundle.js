var assert = require('assert');
var browserify = require('../');
var vm = require('vm');

exports.bundle = function () {
    var src = browserify('seq').bundle();
    
    assert.ok(typeof src === 'string');
    assert.ok(src.length > 0);
    
    var to = setTimeout(function () {
        assert.fail('never ran');
    }, 15000);
    
    var c = {
        setTimeout : setTimeout,
        console : console
    };
    vm.runInNewContext(src, c);
    
    c.require('seq')([1,2,3])
        .parMap_(function (next, x) {
            setTimeout(function () {
                next.ok(x * 100)
            }, 10)
        })
        .seq(function (x,y,z) {
            clearTimeout(to);
            assert.eql([x,y,z], [100,200,300]);
        })
    ;
};

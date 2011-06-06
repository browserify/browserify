var assert = require('assert');
var browserify = require('browserify');
var vm = require('vm');

exports.bundle = function () {
    var src = browserify.bundle({
        require : 'seq'
    });
    assert.ok(typeof src === 'string');
    assert.ok(src.length > 0);
    
    var to = setTimeout(function () {
        assert.fail('never ran');
    }, 5000);
    
    var c = {
        finished : function (x,y,z) {
            clearTimeout(to);
            assert.eql([x,y,z], [100,200,300]);
        },
        setTimeout : setTimeout,
        console : console,
    };
    vm.runInNewContext(src, c);
    vm.runInNewContext(
        'var Seq = require("seq");'
        + 'Seq(1,2,3)'
        + '.parMap(function (x) {'
            //+ 'setTimeout((function () {'
            + 'this(null, x * 100)'
            //+ '}).bind(this))'
        + '})'
        + '.seq(finished)'
        , c
    );
};

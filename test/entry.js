var assert = require('assert');
var browserify = require('../');
var vm = require('vm');

var setTimeout_ = function (cb, t) {
    if (!t) {
        process.nextTick(cb);
    }
    else {
        setTimeout(cb, t);
    }
};

exports.entry = function () {
    var src = browserify.bundle({
        entry : __dirname + '/entry/main.js',
    });
    
    var to = setTimeout(function () {
        assert.fail('never called done()');
    }, 5000);
    
    var c = {
        setTimeout : process.nextTick,
        done : function (one, two) {
            clearTimeout(to);
            assert.equal(one, 1);
            assert.equal(two, 2);
        }
    };
    vm.runInNewContext(src, c);
};

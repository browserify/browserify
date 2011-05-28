var assert = require('assert');
var browserify = require('browserify');
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
        base : __dirname + '/pkg/a',
        entry : __dirname + '/entry/main.js',
    });
    
    var c = {
        assert : assert,
        setTimeout : setTimeout_,
        clearTimeout : clearTimeout,
        to : setTimeout(function () {
            assert.fail('entry never fired')
        }, 5000),
    };
    vm.runInNewContext(src, c);
};

exports.entryCoffee = function () {
    var src = browserify.bundle({
        base : __dirname + '/pkg/a',
        entry : __dirname + '/entry/main.coffee',
    });
    
    var c = {
        assert : assert,
        setTimeout : setTimeout_,
        clearTimeout : clearTimeout,
        to : setTimeout(function () {
            assert.fail('entry never fired')
        }, 5000),
    };
    vm.runInNewContext(src, c);
};

exports.entries = function () {
    var src = browserify.bundle({
        base : __dirname + '/pkg/a',
        entry : [
            __dirname + '/entry/one.js',
            __dirname + '/entry/two.js',
        ],
    });
    
    var c = {
        setTimeout : setTimeout_,
        clearTimeout : clearTimeout,
        t1 : setTimeout(function () {
            assert.fail('first entry never fired')
        }, 5000),
        t2 : setTimeout(function () {
            assert.fail('second entry never fired')
        }, 5000),
    };
    vm.runInNewContext(src, c);
};

var browserify = require('../');
var test = require('tap').test;
var vm = require('vm');

if (!ArrayBuffer.isView) ArrayBuffer.isView = function () { return false; };

function context (t) {
    return {
        t: t,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        Uint8Array: Uint8Array,
        ArrayBuffer: ArrayBuffer,
        Object: {
            defineProperty: Object.defineProperty,
            setPrototypeOf: Object.setPrototypeOf || require('setprototypeof')
        }
    };
}

test('double buffer', function (t) {
    t.plan(1);
    
    var b = browserify(__dirname + '/double_buffer/main.js');
    b.require('buffer');
    b.bundle(function (err, src) {
        if (err) return t.fail(err);
        vm.runInNewContext(src, context(t));
    });
});

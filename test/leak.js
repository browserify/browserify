var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;
var path = require('path');
var through = require('through2');

test('leaking information about system paths (process)', function (t) {
    t.plan(3);
    
    var b = browserify();
    var stream = through();
    stream.push('process.nextTick(function () {'
        + 't.ok(true)'
        + '})'
    );
    stream.push(null);
    b.add(stream);
    
    b.bundle(function (err, buf) {
        var src = buf.toString('utf8');
        t.equal(src.indexOf(process.cwd()), -1, 'cwd directory visible');
        t.equal(src.indexOf('/home'), -1, 'home directory visible');
        vm.runInNewContext(src, {
            t: t,
            setTimeout: setTimeout,
            clearTimeout: clearTimeout
        });
    });
});

test('leaking information about system paths (Buffer)', function (t) {
    t.plan(3);
    
    var b = browserify();
    var stream = through();
    stream.push('t.equal(Buffer("eHl6", "base64").toString(), "xyz")');
    stream.push(null);
    b.add(stream);
    
    b.bundle(function (err, buf) {
        var src = buf.toString('utf8');
        t.equal(src.indexOf(process.cwd()), -1, 'cwd directory visible');
        t.equal(src.indexOf('/home'), -1, 'home directory visible');
        vm.runInNewContext(src, { t: t, setTimeout: setTimeout, Uint8Array: Uint8Array, ArrayBuffer: ArrayBuffer });
    });
});

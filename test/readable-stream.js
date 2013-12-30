var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;
var concat = require('concat-stream');

function verifyDoesNotContainReadableStream (t, deps) {
    t.equal(deps.filter(function (dep) {
        return (/node_modules[\/\\]readable-stream/).test(dep);
    }).length, 0, 'readable-stream not actually included');
}

function verifyDoesContainsStreamBrowserify (t, deps) {
    t.equal(deps.filter(function (dep) {
        return (/node_modules[\/\\]stream-browserify/).test(dep);
    }).length, 7, 'stream-browserify included');
}

function testStreamImplementationExists (accessType, streamType) {
    return function (t) {
        t.plan(3);

        var b = browserify(
            __dirname + '/readable-stream/' + accessType + '-' + streamType.toLowerCase());
        var deps = [];

        b.on('dep', function (row) {
            deps.push(row.id);
        });
        
        b.bundle(function (err, src) {
            if (err) t.fail(err);

            verifyDoesNotContainReadableStream(t, deps);

            verifyDoesContainsStreamBrowserify(t, deps);

            var c = {
                ex : function (streamName) {
                    t.equal(streamName, streamType, 'got expected stream type');
                }
            };

            vm.runInNewContext(src, c);
        });
    }
}

'Duplex PassThrough Readable Transform Writable'.split(' ').forEach(function (streamType) {

    test('readable-stream accessible (require("readable-stream/' + streamType.toLowerCase() + '"))',
        testStreamImplementationExists('slash', streamType));

    test('readable-stream accessible (require("readable-stream").' + streamType + ')',
        testStreamImplementationExists('property', streamType));

})

function testReadableStream (type) {
    return function (t) {
        t.plan(3);

        var b = browserify(__dirname + '/readable-stream/test-' + type);
        var deps = [];

        b.on('dep', function (row) {
            deps.push(row.id);
        });
        
        b.bundle(function (err, src) {
            if (err) t.fail(err);

            verifyDoesNotContainReadableStream(t, deps);

            verifyDoesContainsStreamBrowserify(t, deps);

            var c = {
                ex : function (stream) {
                    stream.pipe(concat(function (out) {
                        t.equal(out.toString(), '0123456789',
                            'got expected stream output');
                    }))
                },
                setTimeout : setTimeout
            };

            vm.runInNewContext(src, c);
        });
    }
}

test('readable-stream works (require("readable-stream").Readable)',
    testReadableStream('readable-property'));

test('readable-stream works (require("readable-stream/readable"))',
    testReadableStream('slash-readable'));

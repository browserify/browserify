var browserify = require('../');
var test = require('tap').test;

test('standalone bundle close event', {timeout: 1000}, function (t) {
    t.plan(1);

    var ended = false;

    var b = browserify(__dirname + '/standalone/main.js');
    b.on('_ready', function() {
        var r = b.bundle({standalone: 'stand-test'});
        r.resume();
        r.on('end', function() {
            t.ok(!ended);
            ended = true;
            t.end();
        });
    });
});

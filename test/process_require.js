var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

test('explicit process require', function (t) {
    t.plan(3);
    
    var b = browserify(__dirname + '/process_require/main.js');
    b.bundle(function (err, src) {
        t.ifError(err);
        var c = {
            done : function (one, two) {
                t.equal(one, 1);
                t.equal(two, 2);
                t.end();
            },
            setTimeout: setTimeout,
            clearTimeout: clearTimeout
        };
        vm.runInNewContext(src, c);
    });
});

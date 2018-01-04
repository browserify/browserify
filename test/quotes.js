var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

test('quotes', function (t) {
    t.plan(3);

    var b = browserify(__dirname + '/quotes/main.js');
    b.bundle(function (err, src) {
        var c = {
            done : function (single, double, backtick) {
                t.equal(single, 'success', 'single quotes');
                t.equal(double, 'success', 'double quotes');
                t.equal(backtick, 'success', 'backtick quotes');
                t.end();
            }
        };
        vm.runInNewContext(src, c);
    });
});

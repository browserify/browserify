var browserify = require('../');
var jsdom = require('jsdom');
var vm = require('vm');
var test = require('tap').test;

test('process.nextTick', function (t) {
    t.plan(3);

    var src = browserify().bundle();
    var html = '<html><head></head><body></body></html>';

    jsdom.env(html, function (err, window) {
        vm.runInNewContext(src, window);

        var i = 0;
        window.process.nextTick(function () {
            t.ok(++i, 1);      
        });
        window.process.nextTick(function () {
            t.ok(++i, 2); 
            window.process.nextTick(function () {
                t.ok(++i, 3);
                t.end();
            });
        });
    });
});

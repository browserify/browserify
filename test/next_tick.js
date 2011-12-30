var vm = require('vm');
var browserify = require('../');
var jsdom = require('jsdom');
var test = require('tap').test;

test('vmRunInNewContext', function (t) {
    t.plan(1);
    
    var src = browserify().bundle()
        + '(' + function () {
            process.nextTick(function () {
                t.end();
            });
        }.toString() + ')()'
    ;
    var html = '<html><head></head><body></body></html>';
    
    jsdom.env(html, function (err, window) {
        var c = {
            window : window,
            navigator : {},
            document : window.document,
            setTimeout : function () {
                t.ok(true);
                setTimeout.apply(null, arguments);
            },
            t : t,
        };
        vm.runInNewContext(src, c);
    });
});

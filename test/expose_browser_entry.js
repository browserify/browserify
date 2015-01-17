var browserify = require('../');
var test = require('tap').test;

test('expose a browser entry', function (t) {
    t.plan(1);

    var b = browserify({
        basedir: __dirname + '/expose_browser_entry'
    });
    b.require('browser-field-entry');
    b.bundle(function (err) {
        t.ifError(err);
    });
});

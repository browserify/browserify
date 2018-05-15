var test = require('tap').test;
var vm = require('vm');
var browserify = require('../');

test('browser field in basedir', function (t) {
    t.plan(2);
    var b = browserify(__dirname + '/browser_field_basedir/main', {
        basedir: __dirname + '/browser_field_basedir'
    });
    b.bundle(function (err, src) {
        if (err) { console.error(err); return t.fail() }
        t.ifError(err);
        vm.runInNewContext(src, { console: { log: log } });
        function log (msg) { t.equal(msg, 'ok') }
    });
});

var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

test('package event', function (t) {
    t.plan(2);
    
    var b = browserify(__dirname + '/pkg_event/main.js');
    b.on('package', function (pkg) {
        console.log(pkg);
    });
    
    b.bundle(function (err, src) {
        t.ifError(err);
        vm.runInNewContext(src, { console: { log: log } });
        function log (msg) { t.equal(msg, 555) }
    });
});

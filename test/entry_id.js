var test = require('tap').test;
var browserify = require('../');
var path = require('path');
var vm = require('vm');

test('entry id', function (t) {
    t.plan(3)
    
    var b = browserify();
    b.require({ file: __dirname + '/entry_id/main.js', expose: 'x' });
    b.bundle(function (err, src) {
        t.ifError(err);
        var c = { console: { log: log } };
        function log (msg) { t.equal(msg, 'wow') }
        vm.runInNewContext(src, c);
        t.equal(c.require('x'), 555);
    })
});


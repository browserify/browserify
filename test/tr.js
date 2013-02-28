var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;
var through = require('through');

test('function transform', function (t) {
    t.plan(3);
    
    var b = browserify(__dirname + '/tr/main.js');
    b.transform(function (file) {
        return through(function (buf) {
            this.queue(String(buf)
                .replace(/AAA/g, '5')
                .replace(/BBB/g, '50')
            );
        })
    });
    b.bundle(function (err, src) {
        vm.runInNewContext(src, { t: t });
    });
});

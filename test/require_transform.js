var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;
var through = require('through2');

test('require transform', function(t) {
    t.plan(1);

    var b = browserify();
    b.transform(function(file) {
        return through(function(buf, enc, next) {
            this.push(String(buf).replace(/NORMAL/g, 'TRANSFORMED'));
            next();
        });
    });
    b.require(__dirname + '/require_transform/main.js', { expose: 'MAIN' });
    b.bundle(function(err, src) {
        src += "require('MAIN')();";
        vm.runInNewContext(src, { t: t });
    });
});

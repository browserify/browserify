var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;
var fs = require('fs');
var through = require('through2');

test('stream file', function (t) {
    var expected = [
        __dirname + '/stream/fake.js',
        __dirname + '/stream/foo.js',
        __dirname + '/stream/bar.js'
    ];
    t.plan(2 + expected.length);
    
    var stream = fs.createReadStream(__dirname + '/stream/main.js');
    stream.file = __dirname + '/stream/fake.js';
    
    var b = browserify(stream, { basedir: __dirname + '/stream' });
    b.transform(function (file) {
        t.equal(file, expected.shift());
        return through();
    });
    
    b.bundle(function (err, src) {
        vm.runInNewContext(src, { t: t });
    });
});

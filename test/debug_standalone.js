var test = require('tap').test;
var browserify = require('../');
var through = require('through2');
var vm = require('vm');

test('ordinary debug', function (t) {
    t.plan(1);
    
    var stream = through();
    stream.push('console.log(1+2)');
    stream.push(null);
    
    var b = browserify({ debug: true });
    b.add(stream);
    b.bundle(function (err, buf) {
        var src = buf.toString('utf8');
        var last = src.split('\n').slice(-1)[0];
        t.ok(
            /\/\/# sourceMappingURL=data:application\/json;base64,[\w+\/=]+$/
            .test(last)
        );
    });
});

test('debug standalone', function (t) {
    t.plan(1);
    
    var stream = through();
    stream.push('console.log(1+2)');
    stream.push(null);
    
    var b = browserify({ debug: true, standalone: 'xyz' });
    b.add(stream);
    b.bundle(function (err, buf) {
        var src = buf.toString('utf8');
        var last = src.split('\n').slice(-1)[0];
        t.ok(
            /\/\/# sourceMappingURL=data:application\/json;base64,[\w+\/=]+$/
            .test(last)
        );
    });
});

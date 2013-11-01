var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

function decode(base64) {
    return new Buffer(base64, 'base64').toString();
}

function grabSourceMap(src) {
    var comment = src.match(/\/\/@ sourceMappingURL.*/g, src)[0];
    var base64 = comment.split(',').pop();
    return JSON.parse(decode(base64));
}

test('standalone in debug mode', function (t) {
    t.plan(4);

    var b = browserify(__dirname + '/standalone/main.js');
    b.bundle({standalone: 'stand-test', debug: true}, function (err, src) {
        t.test('window global', function (t) {
            t.plan(2);
            var c = {
                window: {},
                done : done(t)
            };
            vm.runInNewContext(src + 'window.standTest(done)', c);
        });
        t.test('CommonJS', function (t) {
            t.plan(2);
            var exp = {};
            var c = {
                module: { exports: exp },
                exports: exp,
                done : done(t)
            };
            vm.runInNewContext(src + 'module.exports(done)', c);
        });
        t.test('RequireJS', function (t) {
            t.plan(2);
            var c = {
                define: function (fn) {
                    fn()(done(t));
                }
            };
            c.define.amd = true;
            vm.runInNewContext(src, c);
        });

        t.test('Correct mappings', function (t) {
            t.plan(1);
            t.equal(grabSourceMap(src).mappings,
                ';;AAAA;AACA;AACA;;ACFA;AACA;;ACDA;AACA'
            );
        });
    });
});

function done(t) {
    return function (one, two) {
        t.equal(one, 1);
        t.equal(two, 2);
        t.end();
    };
}


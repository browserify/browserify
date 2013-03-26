var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

test('standalone', function (t) {
    t.plan(5);
    
    var b = browserify(__dirname + '/standalone/main.js');
    b.bundle({standalone: 'stand-test'}, function (err, src) {
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
        t.test('MontageRequire', function (t) {
            t.plan(3);
            var c = {
                bootstrap: function (name, fn) {
                    t.equal(name, 'stand-test');
                    fn()(done(t));
                }
            };
            vm.runInNewContext(src, c);
        });
        t.test('SES (Secure Ecma Script)', function (t) {
            t.plan(3);
            var cOK = {
                ses: {
                    ok: function () { return true; }
                },
                done: done(t)
            };
            var cNotOK = {
                ses: {
                    ok: function () { return false; }
                }
            };
            t.equal(typeof vm.runInNewContext(src + 'ses.makeStandTest', cNotOK), 'undefined');
            vm.runInNewContext(src + 'ses.makeStandTest()(done)', cOK);
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

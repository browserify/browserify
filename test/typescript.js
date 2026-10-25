var browserify = require('../');
var vm = require('vm');
var through = require('through2');
var test = require('tap').test;

// require() and not require.resolve(): on very old node the module resolves
// but does not parse, and then it is not usable either
var hasTypeScript = true;
try { require('typescript') }
catch (err) { hasTypeScript = false }

var opts = hasTypeScript ? {} : { skip: 'typescript is not installed' };

test('bundle a typescript entry point', opts, function (t) {
    t.plan(2);
    var b = browserify(__dirname + '/typescript/main.ts');
    b.bundle(function (err, src) {
        t.error(err);
        vm.runInNewContext(src, { ex: function (obj) {
            t.same(obj, { x: 555, y: 'boop' });
        } });
    });
});

test('require a typescript file without its extension', opts, function (t) {
    t.plan(2);
    var b = browserify(__dirname + '/typescript/from_js.js');
    b.bundle(function (err, src) {
        t.error(err);
        vm.runInNewContext(src, { ex: function (obj) {
            t.same(obj, { x: 333, y: 'boop' });
        } });
    });
});

test('bundle a tsx entry point', opts, function (t) {
    t.plan(2);
    var b = browserify(__dirname + '/typescript/jsx.tsx');
    b.bundle(function (err, src) {
        t.error(err);
        var React = {
            createElement: function (type, props) {
                return { type: type, props: props };
            }
        };
        vm.runInNewContext(src, { React: React, ex: function (el) {
            t.same(el.props, { name: 'boop' });
        } });
    });
});

test('typescript inside node_modules', opts, function (t) {
    t.plan(2);
    var b = browserify(__dirname + '/typescript/dep_main.js');
    b.bundle(function (err, src) {
        t.error(err);
        vm.runInNewContext(src, { ex: function (s) {
            t.equal(s, 'boop5');
        } });
    });
});

test('tsconfig.json next to the sources is used', opts, function (t) {
    t.plan(3);
    var b = browserify(__dirname + '/typescript/config/main.ts');
    b.bundle(function (err, src) {
        t.error(err);
        // the tsconfig asks for es2015, so the arrow function survives
        t.ok(/=>/.test(src), 'compiled for the configured target');
        vm.runInNewContext(src, { ex: function (n) {
            t.equal(n, 555);
        } });
    });
});

test('compilerOptions override tsconfig.json', opts, function (t) {
    t.plan(3);
    var b = browserify(__dirname + '/typescript/config/main.ts', {
        typescript: { tsconfig: false, compilerOptions: { target: 'es5' } }
    });
    b.bundle(function (err, src) {
        t.error(err);
        t.notOk(/=>/.test(src), 'compiled down to es5');
        vm.runInNewContext(src, { ex: function (n) {
            t.equal(n, 555);
        } });
    });
});

test('transforms run on the compiled javascript', opts, function (t) {
    t.plan(3);
    var b = browserify(__dirname + '/typescript/beep.ts');
    b.transform(function (file) {
        var chunks = [];
        return through(function (chunk, enc, next) {
            chunks.push(chunk);
            next();
        }, function (next) {
            var src = Buffer.concat(chunks).toString('utf8');
            t.notOk(/: *number/.test(src), 'types are already gone');
            t.ok(/exports/.test(src), 'and it is commonjs');
            this.push(src);
            next();
        });
    });
    b.bundle(function (err) {
        t.error(err);
    });
});

test('compile errors point at the file', opts, function (t) {
    t.plan(2);
    var b = browserify(__dirname + '/typescript/broken.ts');
    b.bundle(function (err) {
        t.ok(err, 'errored');
        t.ok(
            String(err && err.message).indexOf('broken.ts') >= 0,
            'names the offending file'
        );
    });
});

test('source maps with --debug', opts, function (t) {
    t.plan(2);
    var b = browserify(__dirname + '/typescript/main.ts', { debug: true });
    b.bundle(function (err, src) {
        t.error(err);
        t.ok(/sourceMappingURL/.test(String(src)), 'has a source map');
    });
});

test('typescript: false leaves .ts files alone', opts, function (t) {
    t.plan(1);
    var b = browserify(__dirname + '/typescript/main.ts', {
        typescript: false
    });
    b.bundle(function (err) {
        t.ok(err, 'uncompiled typescript is not valid javascript');
    });
});

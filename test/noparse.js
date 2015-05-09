var browserify = require('../');
var test = require('tap').test;
var path = require('path');

test('noParse module name', function (t) {
    t.plan(2);

    var actual = [];
    var expected = [
        'noparse/a.js',
        'noparse/b.js',
        'noparse/dir1/1.js',
        'noparse/dir1/dir2/2.js',
        'noparse/node_modules/robot/main.js'
    ].map(function (x) {return path.resolve(x);}).sort();

    var b = browserify({
        entries: [ __dirname + '/noparse/a.js' ],
        noParse: 'robot'
    });
    b.on('dep', function(dep) { actual.push(dep.file); });
    b.bundle(function (err, src) {
        actual.sort();
        t.ifError(err);
        t.deepEqual(actual, expected);
    });
});

test('noParse module full path', function (t) {
    t.plan(2);

    var actual = [];
    var expected = [
        'noparse/a.js',
        'noparse/b.js',
        'noparse/dir1/1.js',
        'noparse/dir1/dir2/2.js',
        'noparse/node_modules/robot/main.js'
    ].map(function (x) {return path.resolve(x);}).sort();

    var b = browserify({
        entries: [ __dirname + '/noparse/a.js' ],
        noParse: __dirname + '/noparse/node_modules/robot/main.js'
    });
    b.on('dep', function(dep) { actual.push(dep.file); });
    b.bundle(function (err, src) {
        actual.sort();
        t.ifError(err);
        t.deepEqual(actual, expected);
    });
});

test('noParse module file', function (t) {
    t.plan(2);

    var actual = [];
    var expected = [
        'noparse/a.js',
        'noparse/b.js',
        'noparse/dir1/1.js',
        'noparse/dir1/dir2/2.js',
        'noparse/node_modules/robot/main.js',
        'noparse/node_modules/robot/lib/beep.js'
    ].map(function (x) {return path.resolve(x);}).sort();

    var b = browserify({
        require: __dirname + '/noparse/a.js',
        noParse: 'robot/lib/beep.js'
    });
    b.on('dep', function(dep) { actual.push(dep.file); });
    b.bundle(function (err, src) {
        actual.sort();
        t.ifError(err);
        t.deepEqual(actual, expected);
    });
});

test('noParse module file full path', function (t) {
    t.plan(2);

    var actual = [];
    var expected = [
        'noparse/a.js',
        'noparse/b.js',
        'noparse/dir1/1.js',
        'noparse/dir1/dir2/2.js',
        'noparse/node_modules/robot/main.js',
        'noparse/node_modules/robot/lib/beep.js'
    ].map(function (x) {return path.resolve(x);}).sort();

    var b = browserify({
        require: __dirname + '/noparse/a.js',
        noParse: __dirname + '/noparse/node_modules/robot/lib/beep.js'
    });
    b.on('dep', function(dep) { actual.push(dep.file); });
    b.bundle(function (err, src) {
        actual.sort();
        t.ifError(err);
        t.deepEqual(actual, expected);
    });
});

test('noParse own file', function (t) {
    t.plan(2);

    var actual = [];
    var expected = [
        'noparse/a.js',
        'noparse/b.js',
        'noparse/dir1/1.js',
        'noparse/node_modules/robot/main.js',
        'noparse/node_modules/robot/lib/beep.js',
        'noparse/node_modules/robot/lib/boop.js'
    ].map(function (x) {return path.resolve(x);}).sort();

    var b = browserify({
        entries: [ __dirname + '/noparse/a.js' ],
        basedir: __dirname,
        noParse: 'noparse/dir1/1.js'
    });
    b.on('dep', function(dep) { actual.push(dep.file); });
    b.bundle(function (err, src) {
        actual.sort();
        t.ifError(err);
        t.deepEqual(actual, expected);
    });
});

test('noParse own file full path', function (t) {
    t.plan(2);

    var actual = [];
    var expected = [
        'noparse/a.js',
        'noparse/b.js',
        'noparse/dir1/1.js',
        'noparse/node_modules/robot/main.js',
        'noparse/node_modules/robot/lib/beep.js',
        'noparse/node_modules/robot/lib/boop.js'
    ].map(function (x) {return path.resolve(x);}).sort();

    var b = browserify({
        entries: [ __dirname + '/noparse/a.js' ],
        basedir: __dirname,
        noParse: __dirname + '/noparse/dir1/1.js'
    });
    b.on('dep', function(dep) { actual.push(dep.file); });
    b.bundle(function (err, src) {
        actual.sort();
        t.ifError(err);
        t.deepEqual(actual, expected);
    });
});

test('noParse own file full path no basedir', function (t) {
    t.plan(2);

    var actual = [];
    var expected = [
        'noparse/a.js',
        'noparse/b.js',
        'noparse/dir1/1.js',
        'noparse/node_modules/robot/main.js',
        'noparse/node_modules/robot/lib/beep.js',
        'noparse/node_modules/robot/lib/boop.js'
    ].map(function (x) {return path.resolve(x);}).sort();

    var b = browserify({
        entries: [ __dirname + '/noparse/a.js' ],
        noParse: __dirname + '/noparse/dir1/1.js'
    });
    b.on('dep', function(dep) { actual.push(dep.file); });
    b.bundle(function (err, src) {
        actual.sort();
        t.ifError(err);
        t.deepEqual(actual, expected);
    });
});

test('noParse array', function (t) {
    t.plan(2);

    var actual = [];
    var expected = [
        'noparse/a.js',
        'noparse/b.js',
        'noparse/dir1/1.js',
        'noparse/node_modules/robot/main.js'
    ].map(function (x) {return path.resolve(x);}).sort();

    var b = browserify({
        entries: [ __dirname + '/noparse/a.js' ],
        noParse: [ __dirname + '/noparse/dir1/1.js', 'robot' ]
    });
    b.on('dep', function(dep) { actual.push(dep.file); });
    b.bundle(function (err, src) {
        actual.sort();
        t.ifError(err);
        t.deepEqual(actual, expected);
    });
});

test('noParse array', function (t) {
    t.plan(2);

    var actual = [];
    var expected = [
        'noparse/a.js',
        'noparse/b.js',
        'noparse/dir1/1.js',
        'noparse/node_modules/robot/main.js'
    ].map(function (x) {return path.resolve(x);}).sort();

    var b = browserify({
        entries: [ __dirname + '/noparse/a.js' ],
        noParse: [ __dirname + '/noparse/dir1/1.js', 'robot' ]
    });
    b.on('dep', function(dep) { actual.push(dep.file); });
    b.bundle(function (err, src) {
        actual.sort();
        t.ifError(err);
        t.deepEqual(actual, expected);
    });
});

test('noParse entry', function (t) {
    t.plan(2);

    var actual = [];
    var expected = [
        'noparse/a.js'
    ].map(function (x) {return path.resolve(x);}).sort();

    var b = browserify({
        entries: [ __dirname + '/noparse/a.js' ],
        noParse: __dirname + '/noparse/a.js'
    });
    b.on('dep', function(dep) { actual.push(dep.file); });
    b.bundle(function (err, src) {
        actual.sort();
        t.ifError(err);
        t.deepEqual(actual, expected);
    });
});

test('noParse entry', function (t) {
    t.plan(2);

    var actual = [];
    var expected = [
        'noparse/a.js'
    ].map(function (x) {return path.resolve(x);}).sort();

    var b = browserify({
        entries: [ __dirname + '/noparse/a.js' ],
        noParse: __dirname + '/noparse/a.js'
    });
    b.on('dep', function(dep) { actual.push(dep.file); });
    b.bundle(function (err, src) {
        actual.sort();
        t.ifError(err);
        t.deepEqual(actual, expected);
    });
});

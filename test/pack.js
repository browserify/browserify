var browserify = require('../');
var vm = require('vm');
var through = require('through2');
var test = require('tap').test;

var fs = require('fs');
var sources = {
    3: fs.readFileSync(__dirname + '/entry/main.js', 'utf8'),
    1: fs.readFileSync(__dirname + '/entry/one.js', 'utf8'),
    2: fs.readFileSync(__dirname + '/entry/two.js', 'utf8')
};

var deps = {
    3: { './two': 2, './one': 1 },
    2: {},
    1: {}
};

test('custom packer', function (t) {
    t.plan(7);
    
    var b = browserify(__dirname + '/entry/main.js');
    b.pipeline.get('pack').splice(0, 1, through.obj(function (row, enc, next) {
        t.equal(row.source, sources[row.id]);
        t.deepEqual(row.deps, deps[row.id]);
        this.push(row.id + '\n');
        next();
    }));
    b.bundle(function (err, src) {
        t.equal(src.toString('utf8'), '1\n2\n3\n');
    });
});

var browserify = require('../');
var vm = require('vm');
var path = require('path');
var test = require('tap').test;

test('$NODE_PATH', function (t) {
    t.plan(3);
    var paths = [ __dirname + '/paths/x', __dirname + '/paths/y' ];
    var delimiter = path.delimiter || (process.platform === 'win32' ? ';' : ':');
    
    process.env.NODE_PATH = (process.env.NODE_PATH || '')
        .split(delimiter).concat(paths).join(delimiter)
    ;
    
    var b = browserify(__dirname + '/paths/main.js');
    b.bundle(function (err, src) {
        if (err) t.fail(err);
        vm.runInNewContext(src, { t: t });
    });
});

test('opts.paths', function (t) {
    t.plan(3);
    
    var b = browserify({
        paths: [ __dirname + '/paths/x', __dirname + '/paths/y' ],
        entries: __dirname + '/paths/main.js'
    });
    b.bundle(function (err, src) {
        if (err) t.fail(err);
        vm.runInNewContext(src, { t: t });
    });
});

var browserify = require('../');
var test = require('tap').test;

test('realpath for files (shallow)', function (t) {
    t.plan(1);
    var b = browserify(__dirname + '/realpath/b/index.js');
	var files = {};
	b.on('file', function (file) {
		files[file] = 1;
	});
    b.bundle(function (err, src) {
		if (err) t.ok(false);
		var relFiles = Object.keys(files).map(function(file){
			return file.substr(__dirname.length + 1);
		});
		t.deepEqual(relFiles, ['realpath/b/index.js', 'realpath/a/index.js']);
	});
});

test('realpath for files (deep)', function (t) {
    t.plan(1);
    var b = browserify(__dirname + '/realpath/c/index.js');
	var files = {};
	b.on('file', function (file) {
		files[file] = 1;
	});
    b.bundle(function (err, src) {
		if (err) t.ok(false);
		var relFiles = Object.keys(files).map(function(file){
			return file.substr(__dirname.length + 1);
		});
		t.deepEqual(relFiles, ['realpath/c/index.js', 'realpath/a/index.js', 'realpath/b/index.js']);
	});
});


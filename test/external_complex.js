var browserify = require('../');
var vm = require('vm');
var test = require('tap').test;

test('external with expose option in first bundle', function (t) {
	var b1 = browserify();
	var b2 = browserify();
	
	b1.require(__dirname + '/external_complex/baz1.js', { expose: 'woot!'});
	b2.require(__dirname + '/external_complex/foo1.js', { expose: 'result' });
	b2.external(b1);

	b1.bundle(function (err, src1) {
		if (err) {
			return t.fail(err);
		}

		b2.bundle(function (err, src2) {
			if (err) {
				return t.fail(err);
			}

			var c = {};

			vm.runInNewContext(src1 + src2, c);

			// console.log(src1 + '');
			// console.log('------------');
			// console.log(src2 + '');

			t.is(c.require('result'), 'baz');
			t.end();
		});
	});
});


test('external with no expose option in first bundle', function (t) {
	var b1 = browserify();
	var b2 = browserify();

	b1.require(__dirname + '/external_complex/baz1.js');
	b2.require(__dirname + '/external_complex/foo1.js', { expose: 'result' });
	b2.external(b1);

	b1.bundle(function (err, src1) {
		if (err) {
			return t.fail(err);
		}

		b2.bundle(function (err, src2) {
			if (err) {
				return t.fail(err);
			}

			var c = {};

			vm.runInNewContext(src1 + src2, c);

			// console.log(src1 + '');
			// console.log('------------');
			// console.log(src2 + '');

			t.is(c.require('result'), 'baz');
			t.end();
		});
	});
});
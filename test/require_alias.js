var browserify = require('../');
var tr = require('tr');
var test = require('tap').test;

test('require a node module with an expose property', function (t) {
  var b = browserify();
  b.require('tr', {expose: 'something'});
  b.bundle(function (err, src) {
    t.ok(src, "bundle should not break because the module is exposed as something else"); 
    t.end();
  });
});

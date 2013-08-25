var A = require('./one/f.js');
var B = require('./one/dir/f.js');
t.notEqual(A, B);
t.equal(A(), 555);
t.equal(B(), 333);

var C = require('./two/f.js');
var D = require('./two/dir/f.js');
t.notEqual(C, D);
t.equal(C(), 555);
t.equal(D(), 333);

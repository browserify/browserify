var test = require('tap').test;
var qs = require('../builtins/querystring');

test('querystring', function (t) {
    t.plan(1);
    t.equal(qs.stringify({ num: 42 }), 'num=42');
});

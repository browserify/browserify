var assert = require('assert');
var EventEmitter = require('browserify/builtins/events').EventEmitter;
var test = require('tap').test;

test('setMaxListener', function (t) {
    var ee = new EventEmitter;
    ee.setMaxListeners(5);
    t.end();
});

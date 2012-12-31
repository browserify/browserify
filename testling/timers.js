var test = require('testling');
var timers = require('./builtins/timers');

test('setTimeout / clearTimeout', function (t) {
    t.plan(3);
    var arg1 = {}
    var arg2 = {}
    var async = false

    timers.setTimeout(function(param1, param2) {
      t.deepEqual(param1, arg1, '1st argument was curried');
      t.deepEqual(param2, arg2, '2nd argument was curried');
      t.ok(async, 'setTimeout is async');
      timers.clearTimeout(id);
    }, 10, arg1, arg2);

    var id = timers.setTimeout(function() {
      t.fail('timer had to be cleared');
    }, 50);

    timers.setTimeout(function() {
      t.end();
    }, 100);

    async = true;
});

test('setInterval / clearInterval', function (t) {
    t.plan(6);
    var arg1 = {};
    var arg2 = {};
    var called = 0;
    var async = false;

    var id = timers.setInterval(function(param1, param2) {
      called = called + 1;
      t.deepEqual(param1, arg1, '1st argument was curried');
      t.deepEqual(param2, arg2, '2nd argument was curried');
      t.ok(async, 'setInterval invokes internal async');

      if (called > 2) t.fail('internal had to be cleared')

      if (called === 2) {
        timers.clearInterval(id);
        t.end();
      }
    }, 5, arg1, arg2);

    async = true;
});

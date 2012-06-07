var browserify = require('../');
var vm = require('vm');
var events = require('events');
var test = require('tap').test;

test('global', function (t) {
    
    var src = browserify().global('events').bundle();

    var c = {};
    vm.runInNewContext(src, c);
    t.deepEqual(
        Object.keys(events).sort(),
        Object.keys(c.events).sort()
    );
    t.end();
});

test('global-as', function (t) {
    
    var src = browserify().global('events', 'Events').bundle();
    //var src = browserify().global('events', {as :'Events'}).bundle();

    var c = {};
    vm.runInNewContext(src, c);
    t.deepEqual(
        Object.keys(events).sort(),
        Object.keys(c.Events).sort()
    );
    t.end();
});

test('global-sub', function (t) {
    
    var src = browserify().global('events', {sub : 'EventEmitter'}).bundle();

    var c = {};
    vm.runInNewContext(src, c);
    t.deepEqual(
        Object.keys(events.EventEmitter).sort(),
        Object.keys(c.EventEmitter).sort()
    );
    t.end();
});

test('global-Buffer', function (t) {
    
    var src = browserify().global('Buffer').bundle();

    var c = {};
    vm.runInNewContext(src, c);
    t.ok(typeof c.Buffer === 'function')
    t.end();
});

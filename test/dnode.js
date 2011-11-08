var vm = require('vm');
var browserify = require('../');
var test = require('tap').test;

test('dnode', function (t) {
    t.plan(3);
    
    var src = browserify.bundle({ require : 'dnode' });
    var c = {
        console : console,
        navigator : {
            userAgent : 'foo',
            platform : 'bar',
        },
        window : {
            addEventListener : function () {},
        },
        document : {},
    };
    vm.runInNewContext(src, c);
    var dnode = c.require('dnode');
    
    t.ok(dnode, 'dnode object exists');
    t.ok(dnode.connect, 'dnode.connect exists');
    
    t.deepEqual(
        [
            'path', 'events', 'stream',
            
            '/node_modules/dnode/package.json',
            '/node_modules/dnode/browser/index.js',
            '/node_modules/dnode/browser/socket.io.js',
            // ^ move this one later when socket.io supports browserify
            
            '/node_modules/dnode/node_modules/dnode-protocol/index.js',
            '/node_modules/dnode/node_modules/dnode-protocol/package.json',
            '/node_modules/traverse/index.js',
            '/node_modules/traverse/package.json',
        ].sort(),
        Object.keys(c.require.modules).sort()
    );
    t.end();
});

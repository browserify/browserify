var assert = require('assert');
var vm = require('vm');
var browserify = require('browserify');

exports.dnode = function () {
    var src = browserify.bundle({ require : 'dnode' });
    var c = {
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
    
    assert.ok(dnode, 'dnode object exists');
    assert.ok(dnode.connect, 'dnode.connect exists');
    
    // ok to have these:
    var ok = (function () {
        var context = {};
        vm.runInNewContext(browserify.bundle(), context)
        return Object.keys(context.require.modules);
    })();
    
    assert.deepEqual(
        ok.concat([
            'dnode/browser/index.js',
            // move this one later when socket.io supports browserify
            'dnode/browser/socket.io.js',
            'dnode/package.json',
            'dnode/node_modules/dnode-protocol/index.js',
            'dnode/node_modules/dnode-protocol/package.json',
            'traverse/index.js',
            'traverse/package.json',
        ]).sort(),
        Object.keys(c.require.modules).sort()
    );
};

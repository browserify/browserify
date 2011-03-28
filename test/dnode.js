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
    var dnode = vm.runInNewContext('require("dnode")', c);
    assert.ok(dnode);
    assert.ok(dnode.connect);
};

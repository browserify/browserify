var test = require('tap').test;
var spawn = require('child_process').spawn;
var vm = require('vm');

test('bin', function (t) {
    t.plan(3);
    
    var cwd = process.cwd();
    process.chdir(__dirname);
    
    var ps = spawn(__dirname + '/../bin/cli.js', [ 'entry/main.js' ]);
    var src = '';
    ps.stdout.on('data', function (buf) {
        src += buf.toString();
    });
    
    ps.on('exit', function (code) {
        t.equal(code, 0);
        
        var allDone = false;
        var c = {
            done : function () { allDone = true }
        };
        
        vm.runInNewContext(src, c);
        t.deepEqual(
            [ 'path', '/one.js', '/two.js', '/main.js' ].sort(),
            Object.keys(c.require.modules).sort()
        );
        t.ok(allDone);
        
        t.end();
    });
});

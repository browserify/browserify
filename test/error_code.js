var test = require('tap').test;
var spawn = require('child_process').spawn;

if (false) require('__32jlkbeep');

test('error code', function (t) {
    t.plan(1);
    
    var cwd = process.cwd();
    process.chdir(__dirname);
    
    var ps = spawn(__dirname + '/../bin/cli.js', [
        __dirname + '/error_code/src.js'
    ]);
    ps.stderr.pipe(process.stdout, { end : false });
    
    ps.on('exit', function (code) {
        t.notEqual(code, 0);
    });
});

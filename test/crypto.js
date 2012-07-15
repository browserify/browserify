var test = require('tap').test;
var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var vm = require('vm');

var mkdirp = require('mkdirp');
var tmpdir = '/tmp/' + Math.random().toString(16).slice(2);
mkdirp.sync(tmpdir);

fs.writeFileSync(tmpdir + '/main.js', [
    'var c = require("crypto")',
    'beep(c)'
].join('\n'));

test('*-browserify libs from node_modules/', function (t) {
    t.plan(2);
    
    var bin = __dirname + '/../bin/cmd.js';
    var ps = spawn(bin, [ 'main.js' ], { cwd : tmpdir });
    
    var src = '';
    ps.stdout.on('data', function (buf) { src += buf });
    ps.stderr.pipe(process.stderr, { end : false });
    
    ps.on('exit', function (code) {
        t.equal(code, 0);
        
        var c = {
            beep : function (c) {
                t.equal(typeof c.createHash, 'function');
            },
        };
        vm.runInNewContext(src, c);
        t.end();
    });
});

var fs = require('fs');
var spawn = require('child_process').spawn;
var lazy = require('lazy');

var browserify = require('../');
var test = require('tap').test;

var main = __dirname + '/syntax_error/main.js';
var bin = __dirname + '/syntax_error/bin.js';

test('syntaxError', function (t) {
    t.plan(3);
    
    fs.writeFile(main, 'console.log("bloop")', function (err) {
        if (err) t.fail(err);
        
        var ps = spawn('node', [ bin ]);
        ps.stderr.on('data', function (buf) {
            t.fail(buf.toString());
        });
        
        var i = 0;
        lazy(ps.stdout).lines.map(String).forEach(function (line) {
            i ++;
            if (line.match(/^error/)) {
                t.fail(line);
            }
            
            if (i === 1) {
                t.equal(line, 'log bloop', 'logs properly');
                
                setTimeout(function () {
                    fs.writeFile(main, '[', function (err) {
                        if (err) t.fail(err);
                    });
                }, 200);
            }
            else if (i === 2) {
                t.equal(line, 'caught', 'invalid syntax caught');
            }
            else if (i === 3) {
                t.equal(line, 'ok', 'old source matches the new source');
                ps.kill();
                t.end();
            }
            else {
                t.fail('i = ' + i);
            }
        });
    });
});

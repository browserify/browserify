var test = require('tap').test;
var spawn = require('child_process').spawn;
var path = require('path');
var vm = require('vm');

test('bin --list', function (t) {
    t.plan(3);

    var cwd = process.cwd();
    process.chdir(path.resolve(__dirname, 'list'));

    var ps = spawn(process.execPath, [
        path.resolve(__dirname, '../bin/cmd.js'),
        '--list', 'main.js'
    ]);
    var out = '';
    var err = '';
    ps.stdout.on('data', function (buf) { out += buf });
    ps.stderr.on('data', function (buf) { err += buf });

    var expected = [
      path.resolve(__dirname, 'list/node_modules/qq/node_modules/z/index.js'),
      path.resolve(__dirname, 'list/node_modules/qq/node_modules/a/index.js'),
      path.resolve(__dirname, 'list/node_modules/qq/b.js'),
      path.resolve(__dirname, 'list/main.js')
    ].join('\n') + '\n';

    ps.on('exit', function (code) {
        t.equal(code, 0, 'command exited cleanly');
        t.equal(err, '', 'nothing reported to stderr');
        t.equal(out, expected, 'expected file list');
    });
});

test('bin --require --list', function (t) {
    t.plan(4);

    var cwd = process.cwd();
    process.chdir(path.resolve(__dirname, 'list'));

    var ps = spawn(process.execPath, [
        path.resolve(__dirname, '../bin/cmd.js'),
        '--list', '--require', 'qq'
    ]);
    var src = '';
    var err = '';
    ps.stdout.on('data', function (buf) { src += buf });
    ps.stderr.on('data', function (buf) { err += buf });

    var expected = [
      path.resolve(__dirname, 'list/node_modules/qq/node_modules/z/index.js'),
      path.resolve(__dirname, 'list/node_modules/qq/node_modules/a/index.js'),
      path.resolve(__dirname, 'list/node_modules/qq/b.js')
    ].join('\n') + '\n';

    ps.on('exit', function (code) {
        t.equal(code, 0);
        t.equal(err, '');
        t.equal(src, expected);

        var allDone = false;
        var c = { done : function () { allDone = true } };

        vm.runInNewContext(src, c);
        t.ok(allDone);
    });
});

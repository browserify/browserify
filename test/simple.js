var assert = require('assert');
var connect = require('connect');
var http = require('http');
var vm = require('vm');
var fs = require('fs');

var foo = require('./simple/foo');

exports.simple = function () {
    var port = 10000 + Math.floor(Math.random() * (Math.pow(2,16) - 10000));
    var server = connect.createServer();
    
    var tf = setTimeout(function () {
        assert.fail('never filtered');
    }, 5000);
    
    server.use(require('browserify')({
        base : __dirname + '/simple',
        mount : '/bundle.js',
        filter : function (src) {
            clearTimeout(tf);
            return src + ';\n filterHook();\n'
        },
    }));
    server.use(connect.static(__dirname + '/simple'));
    server.listen(port, function () {
        checkStatic(makeRequest);
    });
    
    var to = setTimeout(function () {
        assert.fail('request test never started');
    }, 5000);
    
    var th = setTimeout(function () {
        assert.fail('effects of filter not used');
    }, 5000);
    
    var ts = setTimeout(function () {
        assert.fail('static test never started');
    }, 5000);
    
    function checkStatic (cb) {
        clearTimeout(ts);
        
        var req = { host : 'localhost', port : port, path : '/' };
        http.get(req, function (res) {
            assert.eql(res.statusCode, 200);
            
            var src = '';
            res.on('data', function (buf) {
                src += buf.toString();
            });
            
            res.on('end', function () {
                assert.eql(
                    src,
                    fs.readFileSync(__dirname + '/simple/index.html', 'utf8')
                );
                cb();
            });
        });
    }
    
    function makeRequest () {
        clearTimeout(to);
        
        var req = { host : 'localhost', port : port, path : '/bundle.js' };
        http.get(req, function (res) {
            assert.eql(res.statusCode, 200);
            server.close();
            
            var context = {
                filterHook : function () {
                    clearTimeout(th);
                }
            };
            var src = '';
            res.on('data', function (buf) {
                src += buf.toString();
            });
            
            res.on('end', function () {
                vm.runInNewContext(src, context);
                vm.runInNewContext('var foo = require("./foo")', context);
                
                for (var i = -10; i <= 100; i++) {
                    var foos = vm.runInNewContext(
                        'foo(' + i + ')', context
                    ).toString();
                    assert.eql(foo(i).toString(), foos);
                }
                
                // extensions are ok too
                assert.equal(
                    context.foo,
                    vm.runInNewContext('require("./foo.js")', context)
                );
            });
        });
    }
};

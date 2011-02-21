var assert = require('assert');
var connect = require('connect');
var http = require('http');
var Script = process.binding('evals').Script;
var Seq = require('seq');

var foo = require('./simple/foo');

exports.simple = function () {
    var port = 10000 + Math.floor(Math.random() * (Math.pow(2,16) - 10000));
    var server = connect.createServer();
    
    Seq()
        .par(function () {
            server.use(require('browserify')({
                base : __dirname + '/simple',
                mount : '/bundle.js',
                ready : this,
            }));
        })
        .par(function () {
            server.listen(port, this);
        })
        .seq(makeRequest)
    ;
    
    var to = setTimeout(function () {
        assert.fail('server never started');
    }, 5000);
    
    function makeRequest () {
        clearTimeout(to);
        
        var req = { host : 'localhost', port : port, path : '/bundle.js' };
        http.get(req, function (res) {
            assert.eql(res.statusCode, 200);
            server.close();
            
            var context = {};
            var src = '';
            res.on('data', function (buf) {
                src += buf.toString();
            });
            
            res.on('end', function () {
                Script.runInNewContext(src, context);
                Script.runInNewContext('var foo = require("./foo")', context);
                
                for (var i = -10; i <= 100; i++) {
                    var foos = Script.runInNewContext(
                        'foo(' + i + ')', context
                    ).toString();
                    assert.eql(foo(i).toString(), foos);
                }
            });
        });
    }
};

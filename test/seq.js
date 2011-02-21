var assert = require('assert');
var connect = require('connect');
var http = require('http');
var Script = process.binding('evals').Script;
var Seq = require('seq');

exports.seq = function () {
    var port = 10000 + Math.floor(Math.random() * (Math.pow(2,16) - 10000));
    var server = connect.createServer();
    
    Seq()
        .par(function () {
            server.use(require('browserify')({
                mount : '/bundle.js',
                require : [ 'seq' ],
                ready : this,
            }));
        })
        .par(function () {
            server.listen(port, this)
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
            
            var tf = setTimeout(function () {
                assert.fail('seq chain never finished');
            }, 5000);
            
            var context = {
                finished : function () {
                    clearTimeout(tf);
                    assert.eql([].slice.call(arguments), [100,200,300]);
                },
                setTimeout : setTimeout,
            };
            
            var src = '';
            res.on('data', function (buf) {
                src += buf.toString();
            });
            
            res.on('end', function () {
                Script.runInNewContext(src, context);
                
                Script.runInNewContext(
                    'var Seq = require("seq");'
                    + 'Seq(1,2,3)'
                    + '.parMap(function (x) {'
                        + 'this(null, x * 100)'
                    + '})'
                    + '.seq(finished)',
                    context
                );
            });
        });
    }
};

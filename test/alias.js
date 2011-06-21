var assert = require('assert');
var connect = require('connect');
var http = require('http');
var vm = require('vm');
var browserify = require('../');

exports.alias = function () {
    var port = 10000 + Math.floor(Math.random() * (Math.pow(2,16) - 10000));
    var server = connect.createServer();
    
    server.use(browserify({
        mount : '/bundle.js',
        require : { moo : 'seq' }
    }));
    
    server.listen(port, makeRequest);
    
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
                setTimeout : setTimeout,
                console : console
            };
            
            var src = '';
            res.on('data', function (buf) {
                src += buf.toString();
            });
            
            res.on('end', function () {
                vm.runInNewContext(src, context);
                assert.ok(context.require('moo'));
                assert.ok(context.require('seq'));
                assert.equal(context.require('seq'), context.require('moo'));
                
                context.require('moo')([1,2,3])
                    .parMap(function (x) {
                        this(null, x * 100)
                    })
                    .seq(function () {
                        clearTimeout(tf);
                        assert.eql([].slice.call(arguments), [100,200,300]);
                    })
                ;
            });
        });
    }
};

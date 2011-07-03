var assert = require('assert');
var connect = require('connect');
var http = require('http');
var vm = require('vm');
var fs = require('fs');

exports.watch = function () {
    var port = 10000 + Math.floor(Math.random() * (Math.pow(2,16) - 10000));
    var server = connect.createServer();
    
    var to = setTimeout(function () {
        assert.fail('filter never updated');
    }, 10000);
    var filters = 0;
    
    var bundle = require('../')({
        require : __dirname + '/watch/a.js',
        mount : '/bundle.js',
        filter : function (src) {
            filters ++;
            if (filters == 2) clearTimeout(to);
            return src;
        },
        watch : { interval : 100 },
    });
    server.use(bundle);
    
    server.use(connect.static(__dirname + '/watch'));
    
    server.listen(port, function () {
        setTimeout(compareSources, 1000);
    });
    
    function getBundle (cb) {
        var req = { host : 'localhost', port : port, path : '/bundle.js' };
        http.get(req, function (res) {
            assert.eql(res.statusCode, 200);
            
            var src = '';
            res.on('data', function (buf) {
                src += buf.toString();
            });
            
            res.on('end', function () {
                cb(src)
            });
        });
    }
    
    function compareSources () {
        getBundle(function (s1) {
            var m0 = bundle.modified;
            assert.ok(m0);
             
            var c1 = {};
            vm.runInNewContext(s1, c1);
            var a1 = c1.require('./a');
            
            var a2 = Math.floor(Math.random() * 10000);
            var s2_ = bundle.bundle();
            
            getBundle(function (s2) {
                assert.notEqual(s1, s2, 'sources are equal');
                
                var c2 = {};
                vm.runInNewContext(s2, c2);
                var a2_ = c2.require('./a');
                
                var m1 = bundle.modified;
                assert.ok(m1);
                assert.ok(m1 > m0);
                
                fs.writeFileSync(
                    __dirname + '/watch/a.js',
                    'module.exports = ' + a1
                );
                
                server.close();
                assert.eql(a2, a2_);
            });
            
            fs.writeFileSync(
                __dirname + '/watch/a.js',
                'module.exports = ' + a2
            );
        });
    }
};

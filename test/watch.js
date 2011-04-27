var assert = require('assert');
var connect = require('connect');
var http = require('http');
var vm = require('vm');
var fs = require('fs');

var foo = require('./simple/foo');

exports.simple = function () {
    var port = 10000 + Math.floor(Math.random() * (Math.pow(2,16) - 10000));
    var server = connect.createServer();
    
    var to = setTimeout(function () {
        assert.fail('filter never updated');
    }, 5000);
    var filters = 0;
    
    server.use(require('browserify')({
        base : __dirname + '/watch',
        mount : '/bundle.js',
        filter : function (src) {
            filters ++;
            if (filters == 2) clearTimeout(to);
            return src;
        },
        watch : { interval : 100 },
    }));
    
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
            var c1 = {};
            vm.runInNewContext(s1, c1);
            var a1 = c1.require('./a');
            
            var a2 = Math.floor(Math.random() * 10000);
            fs.writeFileSync(
                __dirname + '/watch/a.js',
                'module.exports = ' + a2
            );
            setTimeout(function () {
                getBundle(function (s2) {
                    var c2 = {};
                    vm.runInNewContext(s2, c2);
                    var a2_ = c2.require('./a');
                    
                    fs.writeFileSync(
                        __dirname + '/watch/a.js',
                        'module.exports = ' + a1
                    );
                    
                    server.close();
                    assert.eql(a2, a2_);
                });
            }, 500);
        });
    }
};

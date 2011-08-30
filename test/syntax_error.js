var assert = require('assert');
var fs = require('fs');
var vm = require('vm');
var browserify = require('../');

exports.syntaxError = function () {
    var main = __dirname + '/syntax_error/main.js';
    
    fs.writeFile(main, 'console.log("bloop")', function (err) {
        if (err) assert.fail(err);
        
        var bundle = browserify({
            entry : __dirname + '/syntax_error/main.js',
            watch : true
        });
        
        var to = setTimeout(function () {
            assert.fail('never finished');
        }, 5000);
        
        check(bundle, function (err) {
            if (err) assert.fail(err);
            
            var error = console.error ;
            console.error = function (s) {
                clearTimeout(to);
                console.error = error;
            };
            
            fs.writeFile(main, '[', function (err) {
                if (err) assert.fail(err);
                
                check(bundle, function (err) {
                    if (err) assert.fail(err);
                    assert.ok(err === undefined);
                    fs.unwatchFile(main);
                });
            });
        });
    });
};

function check (bundle, cb) {
    try {
        var src = bundle.bundle();
        var logged = false;
        vm.runInNewContext(src, {
            setTimeout : function (fn) { fn() },
            console : {
                log : function (s) {
                    cb(s !== 'bloop');
                    logged = true;
                }
            },
        });
        if (!logged) cb();
    }
    catch (err) {
        assert.fail(err);
    }
}

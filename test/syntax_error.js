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
            
            fs.writeFile(main, '[', function (err) {
                if (err) assert.fail(err);
                check(bundle, function (err) {
                    if (err) assert.fail(err);
                    clearTimeout(to);
                });
            });
        });
    });
};

function check (bundle, cb) {
    try {
        vm.runInNewContext(bundle.bundle(), {
            setTimeout : setTimeout,
            console : {
                log : function (s) {
                    cb(s !== 'bloop');
                }
            }
        });
    }
    catch (err) {
        assert.fail(err);
    }
}

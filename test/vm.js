var vm = require('vm');
var browserify = require('../');
var jsdom = require('jsdom');
var test = require('tap').test;

test('vmRunInNewContext', function (t) {
    t.plan(9);
    var src = browserify().require('vm').bundle();
    var html = '<html><head></head><body></body></html>';
    
    jsdom.env(html, function (err, window) {
        window.eval = function (code) {
            return vm.runInNewContext(code, window);
        };
        
        jsdom.env(html, function (err, iframe) {
            if (err) t.fail(err);
            
            iframe.eval = function (code) {
                var res = vm.runInNewContext(code, iframe);
                return res;
            };
            
            window[0] = window.frames[0] = iframe;
            runTests(window, iframe);
        });
    });
    
    function runTests(window, iframe) {
        var c0 = {
            window : window,
            navigator : {},
            document : window.document,
        };
        vm.runInNewContext(src, c0);
        
        t.ok(c0.require.modules['vm']);
        var vm0 = c0.require('vm');
        t.equal(c0.process.binding('evals'), vm0);
         
        t.equal(
            vm0.runInNewContext('a + 5', { a : 100 }),
            105
        );
        
        var vars = { x : 10 };
        t.equal(vm0.runInNewContext('x++', vars), 10);
        t.equal(vars.x, 11);
        
        // use the wrapped vm to wrap itself O_O
        var c1 = {
            window : window,
            document : window.document,
        };
        vm0.runInNewContext(src, c1);
        t.ok(c1.require.modules['vm']);
        
        var vm1 = c1.require('vm');
        t.equal(vm0.toString(), vm1.toString());
        
        // AND AGAIN BWAHAHAHAHA
        var c2 = {
            window : window,
            document : window.document,
        };
        vm1.runInNewContext(src, c2);
        t.ok(c2.require.modules['vm']);
        var vm2 = c2.require('vm');
        
        t.equal(vm1.toString(), vm2.toString());
        t.end();
    }
});

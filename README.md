Browserify
==========

Browser-side require() for your node modules and npm packages

Browserify bundles everything ahead-of-time at the mount point you specify.
None of this ajaxy module loading business.

More features:

* recursively bundle dependencies of npm modules

* uses es5-shim for browsers that suck

* filters for {min,ugl}ification

* coffee script works too!

examples
========

simple example
--------------

server.js

    var connect = require('connect');
    var server = connect.createServer();
    
    server.use(connect.staticProvider(__dirname));
    server.use(require('browserify')({
        base : __dirname + '/js',
        mount : '/browserify.js',
        filter : require('jsmin').jsmin,
    }));
    
    server.listen(9797);
    console.log('Listening on 9797...');

js/foo.js

    var bar = require('./bar');
    var baz = require('./baz');

    module.exports = function (x) {
        return x * bar.coeff(x) + baz.wowsy(x);
    };

js/bar.js

    exports.coeff = function (x) {
        return Math.log(x) / Math.log(2) + 1;
    };

js/baz.coffee

    exports.wowsy = (beans) ->
        beans * 3 - 2

index.html

    <html>
    <head>
        <script type="text/javascript" src="/browserify.js"></script>
        <script type="text/javascript">
            var foo = require('./foo');
            
            window.onload = function () {
                document.getElementById('result').innerHTML = foo(100);
            };
        </script>
    </head>
    <body>
        foo =
        <span style='font-family: monospace' id="result"></span>
    </body>
    </html>

npm example
-----------

server.js

    var connect = require('connect');
    var server = connect.createServer();
    
    server.use(connect.staticProvider(__dirname));
    server.use(require('browserify')({
        mount : '/browserify.js',
        require : [ 'traverse' ],
    }));
    
    server.listen(4040);
    console.log('Listening on 4040...');

index.html
----------

    <html>
    <head>
        <script type="text/javascript" src="/browserify.js?traverse"></script>
        <script type="text/javascript">
            var Traverse = require('traverse');
            var obj = [ 5, 6, -3, [ 7, 8, -2, 1 ], { f : 10, g : -13 } ];
            Traverse(obj).forEach(function (x) {
                if (x < 0) this.update(x + 128);
            });
            
            window.onload = function () {
                document.getElementById('result').innerHTML
                    = JSON.stringify(obj);
            };
        </script>
    </head>
    <body>
        foo =
        <span style='font-family: monospace' id="result"></span>
    </body>
    </html>

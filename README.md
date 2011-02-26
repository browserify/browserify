Browserify
==========

Browser-side require() for your node modules and npm packages

Browserify bundles all of your javascript when your server fires up at the mount
point you specify.

More features:

* recursively bundle dependencies of npm modules

* uses es5-shim for browsers that suck

* filters for {min,ugl}ification

* coffee script works too!

* bundle browser source components of modules specially with the "browserify"
    package.json field

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

methods
=======

var browserify = require('browserify');

browserify(opts)
----------------

Return a middleware that will host up a browserified script at `opts.mount` or
`"/browserify.js"` if unspecified. All other options are passed to
`browserify.bundle(opts)` to generate the source.

browserify.bundle(base)
-----------------------
browserify.bundle(opts)
-----------------------

Return a string with the bundled source code given the options in `opts`:

* base : recursively bundle all `.js` and `.coffee` files in this directory or
    Array of directories. If there is a package.json at `base`, it will be read
    according to the procedure below.

* name : preface the files in `base` with this name

* main : map `require(name)` for the `name` field to this file

* shim : whether to include [es5-shim](https://github.com/kriskowal/es5-shim)
    for legacy javascript engines; true if unspecified

* require : bundle all of these module names and their dependencies.
    If the name has a slash in it, only that file will be included, otherwise
    all .js and .coffee files which are not in the test directory and are not
    binaries will be bundled into the final output.

package.json
============

During bundling the package.json of a module or base directory will be read for
its `name` and `main` fields, which will be used unless those fields are defined
in `opts`.

If the package.json has a "browserify" field, its contents will take precedence
over the standard package.json contents. This special field is meant for
packages that have a special browser-side component like dnode and socket.io.
If a main is specified in a "browserify" hash and no "base" is given, only that
"main" file will be bundled.

compatability
=============

Browserify exports a faux `process` object with these attributes:

* nextTick(fn) - does setTimeout(fn, 0)
* title - set to 'browser' for browser code, 'node' in regular node code

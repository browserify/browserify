Browserify
==========

Browser-side require() for your node modules and npm packages

Browserify bundles all of your javascript when your server fires up at the mount
point you specify.

![browserify!](http://substack.net/images/browserify/browserify.png)

More features:

* recursively bundle dependencies of npm modules

* uses es5-shim and crockford's json2.js for browsers that suck

* filters for {min,ugl}ification

* coffee script works too!

* bundle browser source components of modules specially with the "browserify"
    package.json field

* watch files for changes and automatically re-bundle in middleware mode

examples
========

simple example
--------------

server.js

````javascript
var connect = require('connect');
var server = connect.createServer();

server.use(connect.static(__dirname));
server.use(require('browserify')({
    base : __dirname + '/js',
    mount : '/browserify.js',
    filter : require('jsmin').jsmin,
}));

server.listen(9797);
console.log('Listening on 9797...');
````

js/foo.js

````javascript
var bar = require('./bar');
var baz = require('./baz');

module.exports = function (x) {
    return x * bar.coeff(x) + baz.wowsy(x);
};
````

js/bar.js

````javascript
exports.coeff = function (x) {
    return Math.log(x) / Math.log(2) + 1;
};
````

js/baz.coffee

````coffeescript
exports.wowsy = (beans) ->
    beans * 3 - 2
````

index.html

````html
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
````

npm example
-----------

server.js

````javascript
var connect = require('connect');
var server = connect.createServer();

server.use(connect.static(__dirname));
server.use(require('browserify')({
    mount : '/browserify.js',
    require : [ 'traverse' ],
}));

server.listen(4040);
console.log('Listening on 4040...');
````

index.html

````html
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
````

methods
=======

````javascript
var browserify = require('browserify');
````

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

### base

Recursively bundle all `.js` and `.coffee` files.

Base can be a directory, an Array of directories, or an object that
maps names to directories such that `require('name/submodule')` works.

If there is a package.json at the `base` directory it will be read
according to the `package.json` procedure below.

### name

Preface the files in `base` with this name.

### main

Map `require(name)` for the `name` field to this file.

### shim

Whether to include [es5-shim](https://github.com/kriskowal/es5-shim) for legacy
javascript engines.

True if unspecified.

### require

Bundle all of these module names and their dependencies.

If the name has a slash in it, only that file will be included, otherwise all
.js and .coffee files which are not in the test directory and are not binaries
will be bundled into the final output.

### entry

Append this file to the end of the bundle in order to execute code without
having to `require()` it.

Specifying an entry point will let you `require()` other modules without having
to load the entry point in a `<script>` tag yourself.

If entry is an Array, concatenate these files together and append to the end of
the bundle.

### watch

Set watches on files and propagates "change" events to `opts.listen`.

Defaults to true and sets up listeners in middleware mode, otherwise false.

You can also pass in an object that is passed along to `fs.watchFile` with these
default parameters:

````javascript
{ persistent : true, interval : 500 }
````

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

process
-------

Browserify exports a faux `process` object with these attributes:

* nextTick(fn) - does setTimeout(fn, 0)
* title - set to 'browser' for browser code, 'node' in regular node code

events
------

You can `require('events').EventEmitters` just like in node.js code.

path
----

The posix functions from the `path` module have been included except for
`exists()` and `existsSync()`. Just `require('path')`!

__dirname
---------

The faux directory name, scrubbed of true directory information so as not to
expose your filesystem organization.

__filename
----------

The faux file path, scrubbed of true path information so as not to expose your
filesystem organization.

protips
=======

* `npm install jquery-browserify` to have npm and browserify handle your jquery
deployment!

read more
=========

[browserify: browser-side require() for your node.js](http://substack.net/posts/24ab8c)

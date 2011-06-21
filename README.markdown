Browserify
==========

Browser-side require() for your node modules and npm packages

Just point a javascript file or two at browserify and it will walk the AST to
read all your `require()`s recursively. The resulting bundle has everything you
need, including pulling in libraries you might have installed using npm!

![browserify!](http://substack.net/images/browserify/browserify.png)

* Relative `require()`s work browser-side just as they do in node.

* Coffee script gets automatically compiled and you can register custom
  compilers of your own!

* Browser-versions of certain core node modules such as `path`, `events`, and
  `vm` are included as necessary automatically.

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
    require : __dirname + '/js/foo.js',
    mount : '/browserify.js'
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
    require : 'traverse',
}));

server.listen(4040);
console.log('Listening on 4040...');
````

index.html

````html
<html>
<head>
    <script type="text/javascript" src="/browserify.js"></script>
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

var b = browserify(opts={})
---------------------------

Return a middleware with attached methods that will host up a browserified
script at `opts.mount` or `"/browserify.js"` if unspecified.

`opts` may also contain these fields:

* require - calls `b.require()`
* ignore - calls `b.ignore()`
* entry - calls `b.addEntry()`
* filter - registers a "post" extension using `b.use()`
* watch - set watches on files, see below

If `opts` is a string, it is interpreted as a `require` value.

### watch :: Boolean or Object

Set watches on files and automatically rebundle when a file changes.

This option defaults to false. If `opts.watch` is set to true, default watch
arguments are assumed or you can pass in an object to pass along as the second
parameter to `fs.watchFile()`.

b.bundle()
----------

Return the bundled source as a string.

b.require(file)
---------------

Require a file or files for inclusion in the bundle.

If `file` is an array, require each element in it.

If `file` is a non-array object, map an alias to a package name.
For instance to be able to map `require('jquery')` to the jquery-browserify
package, you can do:

````javascript
b.require({ jquery : 'jquery-browserify' })
````

and the same thing in middleware-form:

````javascript
browserify({ require : { jquery : 'jquery-browserify' } })
````

To mix alias objects with regular requires you could do:

````javascript
browserify({ require : [ 'seq', { jquery : 'jquery-browserify' }, 'traverse' ])
````

In practice you won't need to `b.require()` very many files since all the
`require()`s are read from each file that you require and automatically
included.

b.ignore(file)
--------------

Omit a file or files from being included by the AST walk to hunt down
`require()` statements.

b.addEntry(file)
----------------

Append a file to the end of the bundle and execute it without having to
`require()` it.

Specifying an entry point will let you `require()` other modules without having
to load the entry point in a `<script>` tag yourself.

If entry is an Array, concatenate these files together and append to the end of
the bundle.

b.filter

b.use(ext, fn)
--------------

Register a handler to wrap extensions.

Wrap every file matching the extension `ext` with the function `fn`.

For every `file` included into the bundle `fn` gets called for matching file
types as `fn.call(b, body, file)` for the bundle instance `b` and the file
content string `body`. `fn` should return the new wrapped contents.

If `ext` is unspecified, execute the wrapper for every file.

If `ext` is 'post', execute the wrapper on the entire bundle.

Coffee script support is just implemented internally as a `.use()` extension:

````javascript
b.use('.coffee', function (body) {
    return coffee.compile(body);
});
````

b.prepend(content)
------------------

Prepend unwrapped content to the beginning of the bundle.

b.append(content)
-----------------

Append unwrapped content to the end of the bundle.

b.alias(to, from)
-----------------

Alias a package name from another package name.

package.json
============

In order to resolve main files for projects, the package.json "main" field is
read.

If a package.json has a "browserify" field, you can override the standard "main"
behavior with something special just for browsers.

The "browserify" field can be a string that points to the browser-specific
"main" file or it can be an object with a "main" field in it.

compatability
=============

process
-------

Browserify exports a faux `process` object with these attributes:

* nextTick(fn) - does setTimeout(fn, 0)
* title - set to 'browser' for browser code, 'node' in regular node code

require('events')
-----------------

You can `require('events').EventEmitter` just like in node.js code.

require('vm')
-------------

All the goodness of node's `require('vm')` has been emulated with iframe
trickery and `eval()` hacks.

require('path')
---------------

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

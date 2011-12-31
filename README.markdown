Browserify
==========

Make node-style require() work in the browser, as if by magic!

![browserify!](http://substack.net/images/browserify/browserify.png)

Just write an `entry.js` to start with some `require()`s in it:

````javascript
var foo = require('./foo');

window.onload = function () {
    document.getElementById('result').innerHTML = foo(100);
};
````

and then a `foo.js`:

````javascript
var bar = require('./bar');

module.exports = function (x) {
    return x * bar.coeff(x) + (x * 3 - 2)
};
````

and then a `bar.js`:

````javascript
exports.coeff = function (x) {
    return Math.log(x) / Math.log(2) + 1;
};
````

Now you need to build this. You can either:

1. use the browserify CLI tool
2. use the middleware
3. use the API

using the CLI tool
------------------

````
browserify entry.js -o browserify.js
````

Then just throw a `<script src="/browserify.js"></script>` into your HTML!

using the middleware
--------------------

````javascript
var express = require('express');
var app = express.createServer();
app.listen(8080);

var bundle = require('browserify')(__dirname + '/entry.js');
app.use(bundle);
````

Then just throw a `<script src="/browserify.js"></script>` into your HTML!

using the API
-------------

See below.

features at a glance
====================

* use [npm](http://npmjs.org) modules in the browser

* `require()`s work browser-side just as they do in node

* coffee script just works™ — just require('./beans.coffee') or whichever

* lots of node builtins just work™:

    > * require('events')
    > * require('path')
    > * require('vm')
    > * require('querystring')

* lots of ways to compile

* watch mode automatically recompiles your bundle when files change

command-line usage
==================

````
Usage: browserify [entry files] {OPTIONS}

Options:
  --outfile, -o  Write the browserify bundle to this file.
                 If unspecified, browserify prints to stdout.                   
  --require, -r  A module name or file to bundle.require()
                 Optionally use a colon separator to set the target.            
  --entry, -e    An entry point of your app                                     
  --ignore, -i   Ignore a file                                                  
  --alias, -a    Register an alias with a colon separator: "to:from"
                 Example: --alias 'jquery:jquery-browserify'                    
  --cache, -c    Turn on caching at $HOME/.config/browserling/cache.json or use
                 a file for caching.
                                                                 [default: true]
  --plugin, -p   Use a plugin. Use a colon separator to specify additional
                 plugin arguments as a JSON string.
                 Example: --plugin 'fileify:["files","."]'                      
  --prelude      Include the code that defines require() in this bundle.
                                                      [boolean]  [default: true]
  --watch, -w    Watch for changes. The script will stay open and write updates
                 to the output every time any of the bundled files change.
                 This option only works in tandem with -o.                      
  --verbose, -v  Write out how many bytes were written in -o mode. This is
                 especially useful with --watch.                                
  --help, -h     Show this message                                              

Specify a parameter.
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
* filter - registers a "post" extension using `b.register()`
* watch - set watches on files, see below
* cache - turn on caching for AST traversals, see below

If `opts` is a string, it is interpreted as a `require` value.

Any query string after `opts.mount` will be ignored.

### watch :: Boolean or Object

Set watches on files and automatically rebundle when a file changes.

This option defaults to false. If `opts.watch` is set to true, default watch
arguments are assumed or you can pass in an object to pass along as the second
parameter to `fs.watchFile()`.

### cache :: Boolean or String

If `cache` is a boolean, turn on caching at
`$HOME/.config/browserify/cache.json`.

If `cache` is a string, turn on caching at the filename specified by `cache`.

### bundle events

`b` bundles will also emit events.

#### 'syntaxError', err

This event gets emitted when there is a syntax error somewhere in the build
process. If you don't listen for this event, the error will be printed to
stderr.

#### 'bundle'

In watch mode, this event is emitted when a new bundle has been generated.

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

b.filter(fn)
------------

Transform the source using the filter function `fn(src)`. The return value of
`fn` should be the new source.

b.register(ext, fn)
-------------------

Register a handler to wrap extensions.

Wrap every file matching the extension `ext` with the function `fn`.

For every `file` included into the bundle `fn` gets called for matching file
types as `fn.call(b, body, file)` for the bundle instance `b` and the file
content string `body`. `fn` should return the new wrapped contents.

If `ext` is unspecified, execute the wrapper for every file.

If `ext` is 'post', execute the wrapper on the entire bundle.

If `ext` is 'pre', call the wrapper function with the bundle object before the
source is generated.

If `ext` is an object, pull the extension from `ext.extension` and the wrapper
function `fn` from `ext.wrapper`. This makes it easy to write plugins like
[fileify](https://github.com/substack/node-fileify).

Coffee script support is just implemented internally as a `.register()`
extension:

````javascript
b.register('.coffee', function (body) {
    return coffee.compile(body);
});
````

b.use(fn)
---------

Use a middleware plugin, `fn`. `fn` is called with the instance object `b`.

b.prepend(content)
------------------

Prepend unwrapped content to the beginning of the bundle.

b.append(content)
-----------------

Append unwrapped content to the end of the bundle.

b.alias(to, from)
-----------------

Alias a package name from another package name.

b.modified
----------

Contains a Date object with the time the bundle was last modified. This field is
useful in conjunction with the `watch` field described in the `browserify()` to
generate unique `<script>` `src` values to force script reloading.

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

* nextTick(fn) - uses [the postMessage trick](http://dbaron.org/log/20100309-faster-timeouts)
    for a faster `setTimeout(fn, 0)` if it can
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

recipes
=======

use an npm module in the browser
--------------------------------

First install a module:

    npm install traverse

Then write an `entry.js`:

````javascript
var traverse = require('traverse');
var obj = traverse({ a : 3, b : [ 4, 5 ] }).map(function (x) {
    if (typeof x === 'number') this.update(x * 100)
});
console.dir(obj);
````

then build it!

    browserify entry.js -o bundle.js

then put it in your html

    <script src="bundle.js"></script>

and the entry.js will just run and `require('traverse')` will just work™.

convert a node module into a browser require-able standalone file
-----------------------------------------------------------------

Using `npm` >= 1.0 from the commandz line:
Install the `traverse` package locally (into the `node_modules` folder)
    
    npm install traverse

Utilize `browserify` to... browserify the package

    npm install -g browserify
    browserify --require traverse -o bundle.js

Look at the files! There is a new one: `bundle.js`. Now go into HTML land:

    <script src="bundle.js"></script>
    <script> 
       var traverse = require('traverse');
    </script>


read more
=========

[browserify: browser-side require() for your node.js](http://substack.net/posts/24ab8c)

[ad-hoc browserify CDN!](http://browserify.nodejitsu.com/)

[jquery-browserify](https://github.com/jmars/jquery-browserify)

install
=======

Using [npm](http://npmjs.org) just do:

    npm install browserify

to install into your project's node_modules directory, or if you want to use the
command-line tool, install globally with:

    npm install -g browserify

test
====

To run the node tests with tap, do:

    npm test

To run the [testling](http://testling.com) tests,
create a [browserling](http://browserling.com) account then:

    cd testling
    ./test.sh

# browserify

`require('modules')` in the browser

Use a [node](http://nodejs.org)-style `require()` to organize your browser code
and load modules installed by [npm](https://npmjs.org).

browserify will recursively analyze all the `require()` calls in your app in
order to build a bundle you can serve up to the browser in a single `<script>`
tag.

[![build status](https://secure.travis-ci.org/substack/node-browserify.png)](http://travis-ci.org/substack/node-browserify)

![browserify!](http://substack.net/images/browserify/browserify.png)

# example

Whip up a file, `main.js` with some `require()s` in it. You can use relative
paths like `'./foo'` and `'../lib/bar'` or module paths like `'gamma'` that will
search `node_modules/` using
[node's module lookup algorithm](https://github.com/substack/node-resolve).

``` js
var foo = require('./foo');
var bar = require('../lib/bar');
var gamma = require('gamma');

var elem = document.getElementById('result');
var x = foo(100) + bar('baz');
elem.textContent = gamma(x);
````

Now just use the `browserify` command to build a bundle starting at `main.js`:

```
$ browserify main.js > bundle.js
```

All of the modules that `entry.js` needs are included in the `bundle.js` from a
recursive walk of the `require()` graph using
[required](https://github.com/shtylman/node-required).

To use this bundle, just toss a `<script src="bundle.js"></script>` into your
html!

## external requires

You can just as easily create bundle that will export a `require()` function so
you can `require()` modules from another script tag. Here we'll create a
`bundle.js` with the [through](https://npmjs.org/package/through)
and [duplexer](https://npmjs.org/package/duplexer) modules.

```
$ browserify -r through -r duplexer > bundle.js
```

Then in your page you can do:

``` js
<script src="bundle.js"></script>
<script>
  var through = require('through');
  var duplexer = require('duplexer');
  /* ... */
</script>
```

## multiple bundles

If browserify finds a `require` function already defined in the page scope, it
will fall back to that function if it didn't find any matches in its own set of
bundled modules.

In this way you can use browserify to split up bundles among multiple pages to
get the benefit of caching for shared, infrequently-changing modules, while
still being able to use `require()`. Just use a combination of `--ignore` and
`--require` to factor out common dependencies.

For example, if a website with 2 pages, `beep.js`:

``` js
var robot = require('./robot.js');
console.log(robot('beep'));
```

and `boop.js`:

``` js
var robot = require('./robot.js');
console.log(robot('boop'));
```

both depend on `robot.js`:

``` js
module.exports = function (s) { return s.toUpperCase() + '!' };
```

```
$ browserify -r ./robot.js > static/common.js
$ browserify -i ./robot.js beep.js > static/beep.js
$ browserify -i ./robot.js boop.js > static/boop.js
```

Then on the beep page you can have:

``` html
<script src="common.js"></script>
<script src="beep.js"></script>
```

while the boop page can have:

``` html
<script src="common.js"></script>
<script src="boop.js"></script>
```

Note that because browserify compiles static lookups at build-time, you'll need
to use the exact same string in the `-r` as in the `require()` statements inside
the sub-bundles.

# usage

```
Usage: browserify [entry files] {OPTIONS}

Standard Options:

  --outfile, -o  Write the browserify bundle to this file.
                 If unspecified, browserify prints to stdout.

  --require, -r  A module name or file to bundle.require()
                 Optionally use a colon separator to set the target.

  --entry, -e    An entry point of your app
  
  --ignore, -i   Omit a file from the output bundle.

  --help, -h     Show this message

Advanced Options:

  --insert-globals, --ig, --fast    [default: false]

    Skip detection and always insert definitions for process, global,
    __filename, and __dirname.
                  
    benefit: faster builds
    cost: extra bytes
 
  --detect-globals, --dg            [default: true]

    Detect the presence of process, global, __filename, and __dirname and define
    these values when present.

    benefit: npm modules more likely to work
    cost: slower builds

  --ignore-missing, --im            [default: false]

    Ignore `require()` statements that don't resolve to anything.
 
Specify a parameter.
```

# compatibility

Many [npm](http://npmjs.org) modules that don't do IO will just work after being
browserified. Others take more work.

Many node built-in modules have been wrapped to work in the browser, but only
when you explicitly `require()` or use their functionality.

When you `require()` any of these modules, you will get a browser-specific shim:

* events
* stream
* path
* assert
* url
* util
* querystring
* buffer
* buffer_ieee754
* console
* [vm](https://github.com/substack/vm-browserify)
* [http](https://github.com/substack/http-browserify)
* [crypto](https://github.com/dominictarr/crypto-browserify)
* [zlib](https://github.com/brianloveswords/zlib-browserify)

Additionally if you use any of these variables, they
[will be defined](https://github.com/substack/insert-module-globals)
in the bundled output in a browser-appropriate way:

* [process](https://github.com/shtylman/node-process)
* global - top-level scope object (window)
* __filename - file path of the currently executing file
* __dirname - directory path of the currently executing file

# methods

``` js
var browserify = require('browserify')
```

## var b = browserify(files=[])

Create a browserify instance `b` from the entry main `files`.
`files` can be an array of files or a single file.

## b.add(file)

Add an entry file from `file` that will be executed when the bundle loads.

## b.require(name)

Make `name` available from outside the bundle with `require(name)`.

The package `name` is anything that can be resolved by `require.resolve()`.

## b.expose(name, file)

Expose the filename at `file` to outside the bundle at `require(name)`.

## b.bundle(opts, cb)

Bundle the files and their dependencies into a single javascript file.

Return a readable stream with the javascript file contents or
optionally specify a `cb(err, src)` to get the buffered results.

When `opts.insertGlobals` is true, always insert `process`, `global`,
`__filename`, and `__dirname` without analyzing the AST for faster builds but
larger output bundles. Default false.

When `opts.detectGlobals` is true, scan all files for `process`, `global`,
`__filename`, and `__dirname`, defining as necessary. With this option npm
modules are more likely to work but bundling takes longer. Default true.

## b.ignore(name)

Prevent the module or file at `name` from showing up in the output bundle.

# package.json

browserify uses the `package.json` in its module resolution algorithm just like
node, but there is a special
"[browsers](https://gist.github.com/4339901)" field you can set to override file
resolution for browser-specific versions.

# install

With [npm](http://npmjs.org) do:

```
npm install -g browserify
```

# license

MIT

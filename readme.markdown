# browserify

`require('modules')` in the browser

Use a [node](http://nodejs.org)-style `require()` to organize your browser code
and load modules installed by [npm](https://npmjs.org).

browserify will recursively analyze all the `require()` calls in your app in
order to build a bundle you can serve up to the browser in a single `<script>`
tag.

[![build status](https://secure.travis-ci.org/substack/node-browserify.png)](http://travis-ci.org/substack/node-browserify)

![browserify!](http://substack.net/images/browserify_logo.png)

# example

Whip up a file, `main.js` with some `require()s` in it. You can use relative
paths like `'./foo.js'` and `'../lib/bar.js'` or module paths like `'gamma'`
that will search `node_modules/` using
[node's module lookup algorithm](https://github.com/substack/node-resolve).

``` js
var foo = require('./foo.js');
var bar = require('../lib/bar.js');
var gamma = require('gamma');

var elem = document.getElementById('result');
var x = foo(100) + bar('baz');
elem.textContent = gamma(x);
```

Export functionality by assigning onto `module.exports` or `exports`:

``` js
module.exports = function (n) { return n * 111 }
```

Now just use the `browserify` command to build a bundle starting at `main.js`:

```
$ browserify main.js > bundle.js
```

All of the modules that `main.js` needs are included in the `bundle.js` from a
recursive walk of the `require()` graph using
[required](https://github.com/defunctzombie/node-required).

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
still being able to use `require()`. Just use a combination of `--external` and
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
$ browserify -r ./robot > static/common.js
$ browserify -x ./robot.js beep.js > static/beep.js
$ browserify -x ./robot.js boop.js > static/boop.js
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

## api example

You can use the API directly too:

``` js
var browserify = require('browserify');
var b = browserify();
b.add('./browser/main.js');
b.bundle().pipe(process.stdout);
```

# usage

```
Usage: browserify [entry files] {OPTIONS}

Standard Options:

    --outfile, -o  Write the browserify bundle to this file.
                   If unspecified, browserify prints to stdout.

    --require, -r  A module name or file to bundle.require()
                   Optionally use a colon separator to set the target.

      --entry, -e  An entry point of your app
  
     --ignore, -i  Omit a file from the output bundle.

   --external, -x  Reference a file from another bundle.
  
  --transform, -t  Use a transform module on top-level files.

  --extension      Consider files with specified extension as modules.
 
    --command, -c  Use a transform command on top-level files.
   
  --standalone -s  Generate a UMD bundle for the supplied export name.
                   This bundle works with other module systems and sets the name
                   given as a window global if no module system is found.
  
       --debug -d  Enable source maps that allow you to debug your files
                   separately.

       --help, -h  Show this message

For advanced options, type `browserify help advanced`.

Specify a parameter.
```

```
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

  --noparse=FILE

    Don't parse FILE at all. This will make bundling much, much faster for giant
    libs like jquery or threejs.

  --deps
  
    Instead of standard bundle output, print the dependency array generated by
    module-deps.

  --list
 
    Print each file in the dependency graph. Useful for makefiles.

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

* [process](https://github.com/defunctzombie/node-process)
* [Buffer](https://github.com/toots/buffer-browserify)
* global - top-level scope object (window)
* __filename - file path of the currently executing file
* __dirname - directory path of the currently executing file

# methods

``` js
var browserify = require('browserify')
```

## var b = browserify(files=[] or opts={})

Create a browserify instance `b` from the entry main `files` or `opts.entries`.
`files` can be an array of files or a single file.

For each `file` in `files`, if `file` is a stream, its contents will be used.
You should use `opts.basedir` when using streaming files so that relative
requires will know where to resolve from.

You can also specify an `opts.noParse` array which will skip all require() and
global parsing for each file in the array. Use this for giant libs like jquery
or threejs that don't have any requires or node-style globals but take forever
to parse.

`opts.extensions` is an array of optional extra extensions for the module lookup
machinery to use when the extension has not been specified.
By default browserify considers only `.js` and `.json` files in such cases.

Note that if files do not contain javascript source code then you also need to
specify a corresponding transform for them.

## b.add(file)

Add an entry file from `file` that will be executed when the bundle loads.

## b.require(file[, opts])

Make `file` available from outside the bundle with `require(file)`.

The `file` param is anything that can be resolved by `require.resolve()`.

`file` can also be a stream, but you should also use `opts.basedir` so that
relative requires will be resolvable.

Use the `expose` property of opts to specify a custom dependency name. 
`require('./vendor/angular/angular.js', {expose: 'angular'})` enables `require('angular')`

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

When `opts.debug` is true, add a source map inline to the end of the bundle.
This makes debugging easier because you can see all the original files if
you are in a modern enough browser.

When `opts.standalone` is a non-empty string, a standalone module is created
with that name and a [umd](https://github.com/forbeslindesay/umd) wrapper.

`opts.insertGlobalVars` will be passed to
[insert-module-globals](http://npmjs.org/package/insert-module-globals)
as the `opts.vars` parameter.

## b.external(file)

Prevent `file` from being loaded into the current bundle, instead referencing
from another bundle.

## b.ignore(file)

Prevent the module name or file at `file` from showing up in the output bundle.

## b.transform(tr)

Transform source code before parsing it for `require()` calls with the transform
function or module name `tr`.

If `tr` is a function, it will be called with `tr(file)` and it should return a
[through-stream](https://github.com/substack/stream-handbook#through)
that takes the raw file contents and produces the transformed source.

If `tr` is a string, it should be a module name or file path of a
[transform module](https://github.com/substack/module-deps#transforms)
with a signature of:

``` js
var through = require('through');
module.exports = function (file) { return through() };
```

You don't need to necessarily use the
[through](https://npmjs.org/package/through) module, this is just a simple
example.

Here's how you might compile coffee script on the fly using `.transform()`:

```
var coffee = require('coffee-script');
var through = require('through');

b.transform(function (file) {
    var data = '';
    return through(write, end);
    
    function write (buf) { data += buf }
    function end () {
        this.queue(coffee.compile(data));
        this.queue(null);
    }
});
```

Note that on the command-line with the `-c` flag you can just do:

```
$ browserify -c 'coffee -sc' main.coffee > bundle.js
```

Or better still, use the [coffeeify](https://github.com/substack/coffeeify)
module:

```
$ npm install coffeeify
$ browserify -t coffeeify main.coffee > bundle.js
```

# package.json

browserify uses the `package.json` in its module resolution algorithm just like
node, but there is a special
"[browser](https://gist.github.com/4339901)" field you can set to override file
resolution for browser-specific versions.

You can specify source transforms in the package.json in the
`browserify.transform` field. There is more information about how source
transforms work in package.json on the
[module-deps readme](https://github.com/substack/module-deps#transforms).

# events

## b.on('file', function (file, id, parent) {})

When a file is resolved for the bundle, the bundle emits a `'file'` event with
the full `file` path, the `id` string passed to `require()`, and the `parent`
object used by
[browser-resolve](https://github.com/defunctzombie/node-browser-resolve).

You could use the `file` event to implement a file watcher to regenerate bundles
when files change.

# list of source transforms

Here is a list of known source transforms:

* [blissify](https://github.com/agilemd/blissify) - compile `.html` 
files written using [bliss](https://github.com/cstivers78/bliss)

* [brfs](https://github.com/substack/brfs) - inline
`fs.readFileSync()` calls with file contents

* [caching-coffeeify](https://github.com/thlorenz/caching-coffeeify) - coffeeify
version that caches previously compiled files to optimize the compilation step

* [coffeeify](https://github.com/jnordberg/coffeeify) - compile
`.coffee` files to javascript automatically

* [deAMDify](https://github.com/jaredhanson/deamdify) - translate AMD modules
to Node-style modules automatically

* [debowerify](https://github.com/eugeneware/debowerify) - use
[bower](http://bower.io) client packages more easily with browserify.

* [decomponentify](https://github.com/eugeneware/decomponentify) - use
[component](https://github.com/component/component) client packages seamlessly
with browserify.

* [es6ify](https://github.com/thlorenz/es6ify) - compile ES6 files to
ES5 javascript automatically

* [hbsfy](https://github.com/epeli/node-hbsfy) - precompile handlebars
templates to javascript functions automatically

* [icsify](https://github.com/maxtaco/icsify) - compile
`.iced` IcedCoffeeScript files to javascript automatically

* [liveify](https://github.com/quarterto/liveify) - compile livescript files to
javascript automatically

* [rfileify](https://github.com/ForbesLindesay/rfileify) - inline `rfile(path)`
calls with file contents
(also supports `ruglify` and any other `rfile` derivatives)

* [rfolderify](https://github.com/quarterto/rfolderify) - turn calls to rfolder
into a map of requires of the files in the thing

* [turn](https://github.com/juliangruber/turn) - minimal modules for a
hypothetical es6 with lua's return


* [reactify](https://github.com/andreypopp/reactify) - compile JSX (superset of
  javascript used in [react](http://facebook.github.io/react/) UI library) files
  to javascript

# third-party tools

If you want to efficiently re-compile the bundle automatically when you edit
files, you can use [watchify](https://github.com/substack/watchify).

If you are using express or connect, you can use
[enchilada](https://github.com/defunctzombie/node-enchilada) or
[browserify-middleware](https://github.com/ForbesLindesay/browserify-middleware)
to host your bundles as middleware.

If you want a standalone web server for development that will create bundles on
demand, check out [beefy](https://github.com/chrisdickinson/beefy).

# install

With [npm](http://npmjs.org) do:

```
npm install -g browserify
```

# license

MIT

![browserify!](http://substack.net/images/browserify/browserify.png)

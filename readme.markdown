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

````javascript
var foo = require('./foo');
var bar = require('../lib/bar');
var gamma = require('gamma');

var elem = document.getElementById('result');
var x = foo(100) + bar('baz');
elem.textContent = gamma(x);
````

Now just use the `browserify` command to build a bundle starting at `main.js`:

```
$ browserify main.js -o bundle.js
```

All of the modules that `entry.js` needs are included in the `bundle.js` from a
recursive walk of the `require()` graph using
[required](https://github.com/shtylman/node-required).

To use this bundle, just toss a `<script src="bundle.js"></script>` into your
html!

# usage

```
Usage: browserify [entry files] {OPTIONS}

Options:

  --outfile, -o  Write the browserify bundle to this file.
                 If unspecified, browserify prints to stdout.

  --require, -r  A module name or file to bundle.require()
                 Optionally use a colon separator to set the target.

  --entry, -e    An entry point of your app
  
  --ignore, -i   Omit a file from the output bundle.

  --help, -h     Show this message

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

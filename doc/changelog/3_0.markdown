A new [browserify](http://browserify.org) version is upon us, just in time for
the FESTIVE SEASON during which we in the northern hemisphere at mid to high
latitudes huddle for warmth around oxidizing hydrocarbons!

There are 2 big changes in v3 but most code should be relatively unaffected.

# shiny new Buffer

[feross](https://github.com/feross) forked
the [buffer-browserify](https://npmjs.org/package/buffer-browserify) package
to create 
[native-buffer-browserify](https://npmjs.org/package/native-buffer-browserify),
a `Buffer` implementation that uses `Uint8Array` to get `buf[i]` notation and
parity with the node core `Buffer` api without the performance hit of the
previous implementation and a much smaller file size. The downside is that
`Buffer` now only works in browsers with `Uint8Array` and `DataView` support.
All the other modules should maintain existing browser support.

*Update*: a [shim was added](https://npmjs.org/package/typedarray)
to in 3.1 for Uint8Array and DataView support. Now you can use `Buffer` in every
browser.

# direct builtin dependencies

In v3, browserify no longer depends on
[browser-builtins](https://npmjs.org/package/browser-builtins), in favor of
depending on packages directly. Instead of having some separate packages and
some files in a `builtin/` directory like browser-builtins, browserify now uses
*only* external packages for the shims it uses. By only using external packages
we can keep browserify core focused purely on the static analysis and bundling
machinery while letting the individual packages worry about things like browser
compatibility and parity with the node core API as it evolves.

Individual, tiny packages should also be much easier for newcomers to contribute
packages toward because they won't need to get up to speed with all the other
pieces going on and the packages can have their own tests and documentation.
Additionally, each package may find uses in other projects beside browserify
more easily and if people want variations on the versions of shims that ship
with browserify core this is easier to do when everything is separate.

Back when we were using browser-builtins there was a large latency between
pushing out fixes to the individual packages and getting them into browserify
core because we had to wait on browser-builtins to upgrade the semvers in its
package.json. With direct dependencies we get much lower latency for package
upgrades and much more granular control over upgrading packages.

Here is the list of packages we now directly depend on in v3:

* [assert](https://npmjs.org/package/assert)
* [buffer](https://npmjs.org/package/native-buffer-browserify)
* [console](https://npmjs.org/package/console-browserify)
* [constants](https://npmjs.org/package/constants-browserify)
* [crypto](https://npmjs.org/package/crypto-browserify)
* [events](https://npmjs.org/package/events-browserify)
* [http](https://npmjs.org/package/http-browserify)
* [https](https://npmjs.org/package/https-browserify)
* [os](https://npmjs.org/package/os-browserify)
* [path](https://npmjs.org/package/path-browserify)
* [punycode](https://npmjs.org/package/punycode)
* [querystring](https://npmjs.org/package/querystring)
* [stream](https://npmjs.org/package/stream-browserify)
* [string_decoder](https://npmjs.org/package/string_decoder)
* [timers](https://npmjs.org/package/timers-browserify)
* [tty](https://npmjs.org/package/tty-browserify)
* [url](https://npmjs.org/package/url)
* [util](https://npmjs.org/package/util)
* [vm](https://npmjs.org/package/vm-browserify)
* [zlib](https://npmjs.org/package/zlib-browserify)

That's it! If you're bold enough to give v3 a spin, just do:

```
npm install -g browserify
```

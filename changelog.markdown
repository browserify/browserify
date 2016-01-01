# Change Log

This file contains the major notes for each release.

This document (loosely) follows the formatting guidelines of [KEEP A CHANGELOG](http://keepachangelog.com).

-----

## [12.0.1] - 2015-10-28

### Added
- adds the previously failing tests, and 
- a small change necessary for transforms to be applied properly for symlinked packages<br>
  https://github.com/substack/node-browserify/pull/1392



## [12.0.0] - 2015-10-26

### Removed
- Removed `builtins` and `commondir` – both unused dependencies.

### Changed
- Node support changes: now testing against the latest node (currently 4.2.1).
  node 0.8 is no longer supported, and iojs isn't actively tested.
- Stream3 everywhere! Everything has been updated to use streams3.
- Sourcemaps charset now uses an `=` instead of a `:`. 
  This fixes certain issues with Chinese characters in sourcemaps. See #753.
- module-deps has been updated to fix root transforms on symlinked modules. 
  See https://github.com/substack/module-deps/pull/99.
- stream-http, the module that provides `http` support, dropped IE8 support. 
  If you depend on this, see https://github.com/jhiesey/stream-http#ie8-note.




## [11.2.0] - 2015-09-24

### Fixed
- When `bundleExternal` is set to `false`, `process` and `buffer` are now correctly excluded. 
- Also, using `--igv` via the CLI now works. 
  That also means that `--bare` and `--node` actually insert `__filename` and `__dirname`.<br>
  https://github.com/substack/node-browserify/pull/1361



## [11.1.0] - 2015-09-11

### Fixed
- adds a `'.'` to extensions if it wasn't added<br>
  https://github.com/substack/node-browserify/pull/1380



## [11.0.1] - 2015-07-29

### Changed
- The callback form of bundle() uses the returned output stream instead of the
  pipeline so that the `'end'` event will fire on the bundle instance.<br>
  https://github.com/substack/watchify/pull/249#issuecomment-126061169



## [11.0.0] - 2015-07-17

### Changed
- **streams3**<br>
  The [`readable-stream`](https://npmjs.com/package/readable-stream) dependency was updated to `^2.0.0`. 
  This package is inserted into bundles as `require('stream')`. 
  Bundles will now get the latest streams implementation from io.js/node.js core, instead of an old version from node.js 0.11.x. 
  Go forth and stream ALL THE DATA without fear!

- **shiny new HTTP package**<br>
  [John Hiesey](https://github.com/jhiesey) rewrote the [http-browserify](https://npmjs.org/package/http-browserify) package to create [stream-http](https://npmjs.org/package/stream-http), an implemention of `http` that supports streaming in modern browsers. 
  Before v11.0.0, in most situations when you used `http.get` or `http.request`, the entire request would buffer in memory until the download was complete, and a single `'data'` event was emitted with the entire response as a string.

- `stream-http` uses the [Fetch API](https://fetch.spec.whatwg.org/) and various browser-specific XHR extensions to make binary streaming http requests work in as many browsers as possible.

- The following browsers support true streaming, where only a small amount of the request has to be held in memory at once:
  * Chrome >= 43 (using the `fetch` api)
  * Firefox >= 9 (using `moz-chunked-arraybuffer` responseType with XHR)

- The following browsers support pseudo-streaming, where the data is available before the request finishes, but the entire response must be held in memory:
  * Safari >= 5
  * IE >= 10
  * Most other Webkit-based browsers, including the default Android browser

- Older browsers will work, without streaming support.<br>
  There is no support for IE6 or IE7.

- Compared to `http-browserify`, it is not necessary to set `options.responseType`. 
  The `responseType` property of the XHR object will be set automatically depending on what features are detected in the browser (although see `options.mode` in the [readme](https://github.com/jhiesey/stream-http) to see how you can optimize this choice manually).

- The `response` is a streams3 stream, so all data is passed as `Buffer`s, unlike the variable types provided by the `'data'` event in `http-browserify`. 
  This behavior tries to mimic the node core `http` module as closely as possible.
  [#1327](https://github.com/substack/node-browserify/pull/1327)

If you're brave, go ahead and give v11.0.0 a try today!



## [10.2.6] - 2015-07-09

### Changed
- uses the non-sync version of fs.realpath



## [10.2.5] - 2015-07-09

### Fixed
- fixes an issue with symlinked files executing multiple times<br>
  https://github.com/substack/node-browserify/issues/1063<br>
  https://github.com/substack/node-browserify/pull/1318



## [10.2.4] - 2015-06-06

### Removed
- remove unused dep "deep-equal" and unused file "lib/_exclude.js"

### Fixed
- fixes requiring an entry from another entry<br>
  https://github.com/substack/node-browserify/pull/1268




## [10.2.3] - 2015-05-29

### Fixed
- fixes an errant space in the `--no-browser-field` flag alias that kept it from working<br>
  https://github.com/substack/node-browserify/issues/1286



## [10.2.2] - 

### Fixed
- fix tests for tap@^1.1.0 (and update tap)<br>
  https://github.com/substack/node-browserify/pull/1276



## [10.2.1] - 2015-05-20

### Removed
- housekeeping - removed unused code<br>
  https://github.com/substack/node-browserify/pull/1273



## [10.2.0] - 2015-05-14

### Removed
- remove unnecessary "isDedupe" json check. this was a hack-fix for watchify <=2.4.<br>
  https://github.com/substack/node-browserify/pull/1244

### Fixed
- fixes for the "noParse" path matcher.<br>
  https://github.com/substack/node-browserify/pull/1259

### Added
- add syntax check cache. this speeds up rebuilds (like when using watchify).<br>
  https://github.com/substack/node-browserify/pull/1253

### Changed
- update to browser-pack@^5.0.0 - includes several fixes related to source maps.<br>
  https://github.com/substack/node-browserify/pull/1257



## [10.1.3] - 2015-05-07

### Changed
- Replace jsonstream with JSONStream<br>
  https://github.com/substack/node-browserify/pull/1252



## [10.1.2] - 2015-05-07

### Changed
- Replace JSONStream with jsonstream
- Update deps to avoid jsonstream npm case problems<br>
  https://github.com/substack/node-browserify/pull/1247<br>
  https://github.com/substack/node-browserify/commit/1ca71e23



## [10.1.1] - 2015-05-06

### Changed
- ensures that entry paths are always full paths<br>
  https://github.com/substack/node-browserify/pull/1248



## [10.1.0] - 2015-05-04

### Added
- adds `--no-browser-field` and `opts.browserField = false` behavior to turn off the package.json browser field. 
  This is useful if you want to make a bundle with a target of node or some environment with shimmed node primitives.
- A new alias `--node` sets `--no-browser-field` and `--bare`.<br>
  https://github.com/substack/node-browserify/pull/1240



## [10.0.0] - 2015-04-30

### Changed
- **Possibly Breaking Change**<br>
  The ‘process’ dependency was updated to ~0.11.0, this module is inserted into bundles as the ‘process’ global/dependency.
  Previously, an unhandled error thrown in a ‘process.nextTick’ task would prevent any subsequent tasks from running, forever.
  The task queue now recovers from this condition, but may do so on a future browser tick.
  As part of this update, ‘process.nextTick’ now accepts variadic arguments, passed to the task, added to io.js in 1.8.1.
  
  * [#1231](https://github.com/substack/node-browserify/pull/1231)
  * [defunctzombie/node-process#38](https://github.com/defunctzombie/node-process/pull/38)
  * [iojs/io.js#1077](https://github.com/iojs/io.js/pull/1077)

- Updated ‘defined’, ‘punycode’, ‘module-deps’, and ‘xtend’ dependencies to reduce install size 
  [#1230](https://github.com/substack/node-browserify/pull/1230)

### Removed
- Removes ‘-v’ shortcut for ‘--version’ (conflicted with watchify) 
  [#1222](https://github.com/substack/node-browserify/pull/1222)

### Security
- Escapes JavaScript-unsafe characters from JSON. 
  [#1211](https://github.com/substack/node-browserify/pull/1211)




## [9.0.8] - 2015-04-09

### Changed
- makes `.require({ expose: 'name' })` and `require('name')` work at the same time<br>
  https://github.com/substack/node-browserify/issues/850<br>
  https://github.com/substack/node-browserify/pull/1202



## [9.0.7] - 2015-04-03

### Fixed
- fixes an issue with catching error events on the b.bundle() stream<br>
  https://github.com/substack/node-browserify/issues/1194<br>
  https://github.com/substack/node-browserify/pull/1195



## [9.0.6] - 2015-04-03

### Fixed
- republishing 9.0.5 in an attempt to satisfy npm.



## [9.0.5] - 2015-04-02

### Changed
- sets the stream returned by bundle() to be readable-only<br>
  https://github.com/substack/node-browserify/pull/1187#issuecomment-89044008



## [9.0.4] - 2015-04-01

### Changed
- handles the colon better for drive paths and improves the test suite for windows users<br>
  https://github.com/substack/node-browserify/pull/1182<br>
  https://github.com/substack/node-browserify/pull/1183



## [9.0.3] - 2015-02-21

### Fixed
- fixes a problem with deduping for json files.
  
  This caused problems for running bundle() multiple times on the same instance
  with caching turned on, which people reported encountering using watchify.
  <br>
  https://github.com/substack/node-browserify/issues/1101<br>
  https://github.com/substack/watchify/issues/143



## [9.0.2] - 2015-02-21

### Fixed
- fixes a bug where transforms in `opts.transform` were getting run twice<br>
  https://github.com/substack/node-browserify/issues/1124<br>
  https://github.com/substack/node-browserify/pull/1128



## [9.0.1] - 2015-02-21

### Fixed
- fixes exposed files persisting across bundles<br>
  https://github.com/substack/node-browserify/pull/1030



## [9.0.0] - 2015-02-21

### Changed

- updates browser-pack which uses umd 3.0.0.
  This sligtly changes how `--standalone $name` works.
  <br>
  https://github.com/substack/browser-pack/pull/49<br>
  https://github.com/substack/node-browserify/pull/1105

- Also some tidying up around handling expose that module-deps can do now:<br>
  https://github.com/substack/node-browserify/pull/1077
  
- Upstream changes in resolve/browser-resolve mean that `require('foo/bar')` works better with the package.json browser field. 
  You can do something like:
  ``` json
  {
    "browser": { "./bar": "whatever.js" }
  }
  ```

### Fixed
- some fixes to regressions involving the `'package'` event:<br>
  https://github.com/substack/node-resolve/issues/69



## [8.1.3] - 2015-02-01

### Changed
- uses / instead of \ for source map url separators on windows<br>
  https://github.com/substack/node-browserify/pull/1096



## [8.1.2] - 2015-01-31

### Changed
- resolves mappings from the browser field for externals<br>
  https://github.com/substack/node-browserify/pull/1100



## [8.1.1] - 2015-01-15

### Fixed
- fixes an issue with resolving exposed packages relative to the basedir<br>
  https://github.com/substack/node-browserify/pull/1059<br>
  https://github.com/substack/node-browserify/issues/1039<br>
  https://github.com/daiweilu/browserify-broken-require



## [8.1.0] - 2015-01-09

### Added
- use process@0.10, which adds process.umask() and a faster process.nextTick() implementation.<br>
  https://github.com/substack/node-browserify/pull/1018

### Fixed
- use assert@1.3, which fixes a bug in assert.deepEqual related to argument ordering, and ensures assert.deepEqual continues working in Chrome 40 and Firefox 35.<br>
  https://github.com/substack/node-browserify/pull/1041



## [8.0.3] - 2015-01-01

### Changed
- passes opts.debug through to insert-module-globals so that is can insert inline source maps for its modifications



## [8.0.2] - 2014-12-27

### Fixed
- ensures that transforms always execute in the order they were added<br>
  https://github.com/substack/node-browserify/pull/1043



## [8.0.1] - 2014-12-24

### Fixed
- fixes some file path leaks in deduped deps<br>
  https://github.com/substack/node-browserify/pull/994<br>
  https://github.com/substack/node-browserify/issues/951



## [8.0.0] - 2014-12-24

### Fixed
In previous releases, the deduping logic was over-zealous about how it handled
module references for duplicates. The prior behavior would detect when the
dependency tree of a module matched an existing module in addition to having the
exact same source code to share an instance. This was originally designed to
support libraries like threejs that internally use `instanceof` checks that
don't usually work very well across multiple packages. This feature didn't pan
out and didn't work very well in practice.

Later, a better way of deduping emerged after some unrelated tweaks to
browser-pack to support source introspection for webworkers. The reflection form
of deduping using implicit arguments is now the only kind.

The deduping instance feature resulted in this bug:
https://github.com/substack/node-browserify/issues/1027
which created very surprising results when duplicate files were in use.



## [7.1.0] - 2014-12-24

### Changed
- uses the new buffer@3.0.0, which passes node's own buffer test suite<br>
  https://github.com/substack/node-browserify/pull/1040



## [7.0.3] - 2014-12-19

### Changed
- allows modules to be bundled with local paths and exposed at the same time<br>
  https://github.com/substack/node-browserify/pull/1033



## [7.0.2] - 2014-12-16

### Fixed
- fixes the global transform getting added each re-bundle<br>
  https://github.com/substack/node-browserify/issues/1026



## [7.0.1] - 2014-12-14

### Fixed
- fixes rebundling (used by watchify) when transforming<br>
  https://github.com/substack/node-browserify/issues/1012
- also fixes https://github.com/substack/node-browserify/issues/1015



## [7.0.0] - 2014-12-04

### Changed
Global transforms are now resolved to an absolute path before walking files.
This fixes some bugs with local module versions taking precedence over global
transforms and unresolvable global transforms spanning system directories.

This is a small breaking change since now transform objects live in the pipeline
between the record and deps phases. This should only affect programs that expect
records in the pipeline to only contain file objects.



## [6.3.4] - 2014-12-04

### Fixed
- fixes a bug setting placeholder filenames on stream inputs to be properly unique



## [6.3.3] - 2014-11-24

### Fixed
- fixes an issue with the expose property when opts.fullPaths is enabled
  
  This issue commonly crops up in watchify.
  <br>
  https://github.com/substack/node-browserify/pull/991<br>
  https://github.com/substack/node-browserify/issues/850



## [6.3.2] - 2014-11-11

### Changed
- updates regexps that test for absolute and relative paths to work better on windows<br>
  https://github.com/substack/node-browserify/pull/948



## [6.3.1] - 2014-11-11

### Fixed
- fixes ignoreTransform for the case where transforms were given in package.json as an array<br>
  https://github.com/substack/node-browserify/pull/966



## [6.3.0] - 2014-11-11

### Changed
- uses noParse for better parity with module-deps<br>
  https://github.com/substack/node-browserify/pull/954



## [6.2.0] - 2014-10-25

### Fixed
- fixes #!shebang syntax when --bare is in effect by adding an unshebang phase to the pipeline<br>
  https://github.com/substack/node-browserify/issues/943



## [6.1.2] - 2014-10-25

### Fixed
- fixes the behavior for multiple external bundles<br>
  https://github.com/substack/node-browserify/issues/933



## [6.1.1] - 2014-10-25

### Fixed
- fixes a circular dependency issue with readable-stream<br>
  https://github.com/substack/node-browserify/pull/964<br>
  https://github.com/substack/node-browserify/issues/963



## [6.1.0] - 2014-10-13

### Changed
- allows transforms to be ignored throughout the entire bundle<br>
  https://github.com/substack/node-browserify/pull/945



## [6.0.3] - 2014-10-08

### Fixed
- fixes a bug where module insert-module-globals would trigger too soon and conflict with other transforms<br>
  https://github.com/substack/node-browserify/issues/867<br>
  https://github.com/substack/node-browserify/issues/895<br>
  https://github.com/substack/node-browserify/issues/855



## [6.0.2] - 2014-10-03

### Changed
- upgrades process to 0.8.0<br>
  https://github.com/substack/node-browserify/pull/906



## [6.0.1] - 2014-10-03

### Fixed
- respects opts.expose in require()<br>
  https://github.com/substack/node-browserify/pull/907



## [6.0.0] - 2014-10-03

### Changed
- resolves source map maths relative to the base url. This should help with more
  reproducible builds.
  <br>
  https://github.com/substack/node-browserify/pull/923
  
  Version 6 is a tiny but breaking change to how source map paths work.
  
  Now all source map paths are relative by default. This makes it easier to have
  deterministic debug builds across different systems and directories. If
  browserify is installed in a project-local directory, all the source map paths
  will be self-contained and relative against that location in node_modules.



## [5.13.1] - 2014-10-03

### Changed
- bails early if opts.basedir is not the correct type<br>
  https://github.com/substack/node-browserify/pull/927



## [5.13.0] - 2014-10-03

### Changed
- exposes global browserify options to transforms under opts._flags<br>
  https://github.com/substack/node-browserify/pull/910



## [5.12.2] - 2014-10-03

### Fixed
- fixes the array form of b.external()<br>
  https://github.com/substack/node-browserify/issues/930



## [5.12.1] - 2014-09-26

### Fixed
- dedupe deps when fullPaths is on<br>
  https://github.com/substack/node-browserify/pull/917
- fixes the crypto tests



## [5.12.0] - 2014-09-19

### Added
- adds back the array form for add() and require(), with extra places to add options



## [5.11.2] - 2014-09-12

### Fixed
- fixes ignore for relative paths<br>
  https://github.com/substack/node-browserify/issues/896



## [5.11.1] - 2014-09-05

### Fixed
- fixes exports across resets, which caused issues for watchify with exports<br>
  https://github.com/substack/node-browserify/pull/892



## [5.11.0] - 2014-08-28

### Added
- adds an implicit dependency on the original module during dedupe<br>
  https://github.com/substack/node-browserify/pull/880



## [5.10.1] - 2014-08-20

### Fixed
- fixes the command-line client to properly ignore paths that don't match a glob<br>
  https://github.com/substack/node-browserify/pull/866



## [5.10.0] - 2014-08-13

### Added
- adds back support for `.external(b)` on a browserify instance `b` that was dropped on the v5 refactor



## [5.9.3] - 2014-08-11

### Changed
- buffers the record pipeline phase to start outputting after the first tick
  so that user plugins can capture and modify recorder output



## [5.9.2] - 2014-08-11

### Fixed
- fixes a bug with using --ignore to exclude node_modules packages on the command-line<br>
  https://github.com/substack/node-browserify/pull/845



## [5.9.1] - 2014-07-25

### Changed
- improves the detection for --ignore



## [5.9.0] - 2014-07-25

### Fixed
- fixes bug with builtins that load json files (the 'constants' module), new 'json' pipeline label<br>
  https://github.com/substack/module-deps/issues/46



## [5.8.0] - 2014-07-25

### Changed
- allow optional extensions in bin/args



## [5.7.0] - 2014-07-25

### Fixed
- re-instates transforms after a reset and fixes exposing the transform events properly



## [5.6.1] - 2014-07-25

### Changed
- makes stream entry files deterministic



## [5.6.0] - 2014-07-25

### Added
- adds 'package' events from module-deps when a package.json file is read



## [5.5.0] - 2014-07-25

### Added
- adds back the `'bundle'` event and copies over options correctly to reset()



## [5.4.2] - 2014-07-25

### Added
- adds a note about derequire in standalone mode to the readme



## [5.4.1] - 2014-07-24

### Fixed
- fixes an error with basedir resolving plugins from names



## [5.4.0] - 2014-07-24

### Changed
- also allows opts.plugin from the constructor like transform



## [5.3.0] - 2014-07-24

### Changed
- passes `.file` on stream inputs through to transforms<br>
  https://github.com/substack/node-browserify/issues/744



## [5.2.1] - 2014-07-24

### Changed
- sets require() for streams to not just be entry files



## [5.2.0] - 2014-07-24

### Changed
- upgrades crypto-browserify to v3



## [5.1.1] - 2014-07-24

### Changed
- updates --list to always print file paths



## [5.1.0] - 2014-07-24

### Fixed
- adds back `.plugin()` which was mistakenly omitted



## [5.0.8] - 2014-07-24

### Fixed
- fixes using debug and standalone at the same time<br>
  https://github.com/substack/node-browserify/issues/750



## [5.0.7] - 2014-07-24

### Fixed
- fixes command-line versions of -u and -x<br>
  https://github.com/substack/node-browserify/issues/821



## [5.0.6] - 2014-07-24

### Added
- test for --bare



## [5.0.5] - 2014-07-24

### Fixed
- fix for detectGlobals, --bare<br>
  https://github.com/substack/node-browserify/issues/803



## [5.0.4] - 2014-07-24

### Fixed
- fixes --no-bundle-external with globals<br>
  https://github.com/substack/node-browserify/issues/828



## [5.0.3] - 2014-07-24

### Fixed
- upgrades insert-module-globals to fix<br>
  https://github.com/substack/node-browserify/issues/834



## [5.0.2] - 2014-07-24

### Fixed
- fixes the changelog link:<br>
  https://github.com/substack/node-browserify/pull/835



## [5.0.1] - 2014-07-24

### Added
- adds an untracked test



## [5.0.0] - 2014-07-24

At a glance:

* extensible internal labeled-stream-splicer pipeline
* bundle() - no longer accepts `opts`, callback gets a buffer 
* b.deps(), b.pack(), opts.pack, opts.deps are gone
* can call bundle() multiple times on the same instance
* a better --noparse matcher
* id labeling integer index based instead of hash based
* derequire removed for performance reasons
* .external(bundle) has been removed (for now)
* semicolon at end of output
* hashing is gone so `expose: true` or explicit expose id is required for doing
multi-export bundles

Version 5 is a big rearranging of browserify internals with more places for
external code to hook into the build pipeline.

These changes are mostly aligned around the theme of making it easier for
external code to interface with browserify internals in a less hacky way.

### pipeline

Now the core of browserify is organized into a
[labeled-stream-splicer](https://npmjs.org/package/labeled-stream-splicer)
pipeline. This means that user code and plugins can hook into browserify by
pushing themselves onto the pipeline at a label:

``` js
var browserify = require('browserify');
var through = require('through2');
var bundle = browserify();

bundle.pipeline.get('deps').push(through.obj(function (row, enc, next) {
    console.log('DEP:', row.id);
    this.push(row);
    next();
}));
```

User code can remove existing transforms or add its own hooks. These are the
labeled sections you can get a handle on with `bundle.pipeline.get()`

* `'record'` - save inputs to play back later on subsequent `bundle()` calls
* `'deps'` - [module-deps](https://npmjs.org/package/module-deps)
* `'unbom'` - remove byte-order markers
* `'syntax'` - check for syntax errors
* `'sort'` - sort the dependencies for deterministic bundles
* `'dedupe'` - remove duplicate source contents
* `'label'` - apply integer labels to files
* `'emit-deps'` - emit `'dep'` event
* `'debug'` - apply source maps
* `'pack'` - [browser-pack](https://npmjs.org/package/browser-pack)
* `'wrap'` - apply final wrapping, `require=` and a newline and semicolon

Because there is now a proper pipeline, `opts.pack`, `opts.deps`, `b.deps()`,
and `b.pack()` are removed.

### bundle()

Big changes have been made to the `bundle()` function. All options have been
moved out of the `bundle(opts)` form and into the browserify constructor. Before
there was an unclear split between which arguments went into which function.

You can now call `bundle()` multiple times on the same instance, even in
parallel. This will greatly simplify the caching system under watchify and will
fix many long-standing bugs.

The callback to `bundle(cb)` is now called with `cb(err, buf)` instead of
`cb(err, string)` as before.

### labeling

The former hashing system is removed, in favor of file paths rooted at the
`opts.basedir`, or the cwd.

This removal means that browserify can be much more consistent about applying
integer ids, which avoids exposing system paths in bundle output.

Hashes are used internally for deduping purposes, but they operate on the
source content only.

### others

The matching logic in the `--noparse` feature is greatly improved.

derequire has been taken out of core, which should speed up `--standalone`.



## [4.2.3] - 2014-07-20

### Fixed
- reverts 4.2.2 due to breaking some existing use-cases



## [4.2.2] - 2014-07-20

### Fixed
- fixes a bug applying transforms to symlinked files by resolving the realpath first <br>
  https://github.com/substack/node-browserify/pull/831



## [4.2.1] - 2014-07-15

### Security
**SECURITY NOTICE**

Make sure your installation of browserify is using syntax-error@1.1.1 or
later. there was a security vulnerability where a malicious file could
execute code when browserified.

The vulnerability involves breaking out of `Function()`, which was used to
check syntax for more informative errors. In node 0.10, `Function()` seems
to be implemented in terms of `eval()`, so malicious code can execute even
if the function returned by `Function()` was never called. node 0.11 does
not appear to be vulnerable.

Thanks to Cal Leeming [cal@iops.io]
for discovering and disclosing this bug!



## [4.2.0] - 2014-06-27

### Changed
- upgrades http-browserify, crypto-browserify, and 
- sets more versions to float with ^ semvers



## [4.1.11] - 2014-06-18

### Fixed
- fixes a bug with transform argument handling <br>
  https://github.com/substack/node-browserify/pull/795



## [4.1.10] - 2014-06-12

### Fixed
- upgrades browser-resolve to get opts.path fixes <br>
  https://github.com/defunctzombie/node-browser-resolve/pull/43



## [4.1.9] - 2014-06-09

### Fixed
- upgrades resolve to fix relative NODE_PATH paths <br>
  https://github.com/substack/node-resolve/pull/46



## [4.1.8] - 2014-06-03

### Fixed
- bumps the module-deps version to get an ordering bugfix <br>
  https://github.com/substack/module-deps/pull/39 https://github.com/substack/node-browserify/pull/774



## [4.1.7] - 2014-06-02

### Fixed
- fixes ignoreMissing when set in the constructor <br>
  https://github.com/substack/node-browserify/pull/785



## [4.1.6] - 2014-05-28

### Fixed
- emits the 'id' event on the correct instance <br>
  https://github.com/substack/node-browserify/pull/780



## [4.1.5] - 2014-05-17

### Added
- added this document



## [4.1.4] - 2014-05-16

### Fixed
- fixes a bug in `ie<=8` support for querystring <br>
  https://github.com/substack/node-browserify/issues/764



## [4.1.2] - 2014-05-10

### Fixed
- upgrades umd to fix some issues with --standalone <br>
  https://github.com/substack/node-browserify/pull/714



## [4.1.1] - 2014-05-10

### Changed
- makes deps() behave more like bundle() <br>
  https://github.com/substack/node-browserify/issues/757 
- fixes global transform precedence <br>
  https://github.com/substack/node-browserify/issues/759



## [4.1.0] - 2014-05-10

### Changed
- upgrades the version of buffer to ^2.3.0



## [4.0] - 

Here are the new breaking changes in browserify v4. Most users should be unaffected.

### readable-stream

`require('stream')` is now using [readable-stream](https://npmjs.org/package/readable-stream) (but the classic-mode shim persists in stream-browserify just like in node core). This should result in much smaller files for all modules using a similar-enough version of readable-stream as browserify itself. Other modules should be relatively unaffected.

### removed .expose()

Removal of the previously-deprecated and obscure `bundle.expose()`.

### took out implicit reading from stdin

Previously if you invoked the browserify command without any entry files as arguments and stdin was a tty, stdin would be implicitly added as an entry file. This feature was causing problems so it has been removed. https://github.com/substack/node-browserify/issues/724#issuecomment-42731877

### more!

In the run-up to the 4.0, [module-deps](https://npmjs.org/package/module-deps) got an extensive rewrite with minimal test changes. Mostly it was just getting really messy because it was a giant ball-of-mud closure instead of a more straightforward prototype-based implementation with more clearly-defined methods.

The module-deps rewrite was triggered by [system paths showing up in build output](https://github.com/substack/node-browserify/issues/675) but was fixed in 3.46.1. The solution actually didn't end up needing changes in module-deps as originally anticipated but module-deps was in dire need of a cleanup.



## [3.46.1] - 2014-05-10

### Fixed
- fixes a bug exposing the host path of the process module in the bundle output <br>
  https://github.com/substack/insert-module-globals/pull/32



## [3.46.0] - 2014-05-03

### Changed
- allows array arguments in b.require(), b.add(), and b.external() <br>
  https://github.com/substack/node-browserify/pull/742 
  from @spacepluk



## [3.45.0] - 2014-05-03

### Fixed
- renders complete stack traces where before they were getting truncated <br>
  https://github.com/substack/node-browserify/pull/741  
  patch from @secoif



## [3.44.2] - 2014-04-22

### Changed
- slims down the dependency payload by 20M <br>
  https://github.com/substack/node-browserify/pull/736 



## [3.44.1] - 2014-04-20

### Fixed
- fixes the recursion error many people were getting <br>
  https://github.com/substack/node-browserify/pull/713  
  
  Thanks to @MattMcKegg  for isolating the bug!



## [3.44.0] - 2014-04-18

### Changed
- upgrades module-deps to 1.10.0 to make all the packageFilter dir argument pathways are consistent



## [3.43.0] - 2014-04-16

### Changed
- lets b.transform(opts, t) args to be swapped around since opts is more common as a last argument



## [3.42.0] - 2014-04-16

### Changed
- passes through the dir parameter in opts.packageFilter from module-deps 1.10.0 <br>
  https://github.com/substack/node-browserify/pull/731 



## [3.41.0] - 2014-04-11

### Added
- has an option to disable external files, making it easier to run bundles in node for code coverage <br>
  https://github.com/substack/node-browserify/pull/672 



## [3.40.4] - 2014-04-11

### Fixed
- makes --list work again <br>
  https://github.com/substack/node-browserify/pull/727 



## [3.40.3] - 2014-04-11

### Changed
- merges a patch for piping via stdin and --require at the same time <br>
  https://github.com/substack/node-browserify/pull/728 



## [3.40.2] - 2014-04-11

### Fixed
- upgrades module-deps to fix --list for $NODE_PATH <br>
  https://github.com/substack/node-browserify/issues/726 



## [3.40.1] - 2014-04-11

### Fixed
- upgrades module-deps to get this packageTransform bugfix <br>
  https://github.com/substack/module-deps/pull/32 



## [3.40.0] - 2014-04-10

### Changed
- modifies the behavior of opts.builtins to be more useful and intuitive <br>
  https://github.com/substack/node-browserify/pull/717 



## [3.39.0] - 2014-04-08

### Added
- adds a zlib that has parity with node <br>
  https://github.com/substack/node-browserify/pull/721 



## [3.38.0] - 2014-03-29

### Changed
- upgrades derequire which uses esprima-fb <br>
  https://github.com/substack/node-browserify/pull/710 



## [3.37.2] - 2014-03-29

### Fixed
- adds 'close' events back to the bundle stream. 
  This should fix some issues with watchify.



## [3.37.1] - 2014-03-28

### Fixed
- fixes a bug with through being required in the bin/cmd.js instead of through2



## [3.37.0] - 2014-03-28

### Added
- gives streams2 semantics for bundle() <br>
  https://github.com/substack/node-browserify/pull/646 



## [3.36.1] - 2014-03-28

### Fixed
- fixes a dumb bug with ^ for versions that don't work in old npm clients



## [3.36.0] - 2014-03-28

### Changed
- adds require('process') and removes the path resolution for process out of insert-module-globals



## [3.35.0] - 2014-03-28

### Added
- adds an empty tls stub to the builtins list <br>
  https://github.com/substack/node-browserify/issues/703 



## [3.34.0] - 2014-03-28

### Fixed
- fixes a bug with transforms not being applied in deps() <br>
  https://github.com/substack/node-browserify/pull/708 



## [3.33.1] - 2014-03-27

### Fixed
- fixes a bug with options in --global-transform on the command-line <br>
  https://github.com/substack/node-browserify/pull/705 



## [3.33.0] - 2014-03-18

### Fixed
- fixes parsing errors while maintaining es6 support by switching to esprima-fb <br>
  https://github.com/substack/node-browserify/issues/698 



## [3.32.1] - 2014-03-10

### Changed
- should be easier to shinkwrap and install on windows <br>
  https://github.com/substack/node-browserify/pull/684 



## [3.32.0] - 2014-03-04

### Added
- adds --full-path and opts.fullPath to always expand ids to full paths <br>
  https://github.com/substack/node-browserify/pull/668#issuecomment-36586786 



## [3.31.2] - 2014-02-26

### Fixed
- fixes a bug in the subarg argument parsing for multiple transforms <br>
  https://github.com/substack/node-browserify/issues/678 



## [3.31.1] - 2014-02-26

### Changed
- uses process.cwd() as the default rebase target instead of commondir <br>
  https://github.com/substack/node-browserify/pull/669#issuecomment-36078282 



## [3.31.0] - 2014-02-26

### Changed
- merges https://github.com/substack/node-browserify/pull/669 ,
  which should help with more deterministic builds across systems



## [3.30.4] - 2014-02-25

### Fixed
- fixes parsing the --insert-global-vars argument properly <br>
  https://github.com/substack/node-browserify/pull/674 



## [3.30.3] - 2014-02-25

### Fixed
- fixes exclude globbing in the arg parser <br>
  https://github.com/substack/node-browserify/pull/676 



## [3.30.2] - 2014-02-21

### Fixed
- included a fix for --no-builtins for non-wrapped modules <br>
  https://github.com/substack/node-browserify/pull/666 



## [3.30.1] - 2014-02-16

### Fixed
- upgrades buffer for a utf8 fix <br>
  https://github.com/substack/node-browserify/pull/656 



## [3.30.0] - 2014-02-15

### Added
- adds globs for -u, -i, and -x <br>
  https://github.com/substack/node-browserify/issues/654 



## [3.29.1] - 2014-02-15

### Added
- adds relatively-resolved paths to ignored and excluded files



## [3.29.0] - 2014-02-13

### Changed
- upgrades http-browserify to 1.3.1



## [3.28.2] - 2014-02-11

### Changed
- now always includes the full package.json content in the 'package' event



## [3.28.1] - 2014-02-10

### Fixed
- fixes a bug with stream entry order <br>
  https://github.com/substack/node-browserify/pull/643 



## [3.28.0] - 2014-02-10

### Added
- adds plugins for doing super fancy things like factored bundle output <br>
  https://github.com/substack/node-browserify#plugins 



## [3.27.1] - 2014-02-10

### Fixed
- fixes a bug resolving transform modules when browserify is under a symlink



## [3.27.0] - 2014-02-09

### Added
- adds transform configuration in the package.json browserify.transform field <br>
  https://github.com/substack/module-deps#packagejson-transformkey 



## [3.26.0] - 2014-02-09

### Changed
- you can pass arguments to transforms <br>
  https://github.com/substack/node-browserify/blob/master/bin/advanced.txt#L67-L77 



## [3.25.2] - 2014-02-09

### Fixed
- fixes a bug where the transform event didn't fire while IO was pending



## [3.25.1] - 2014-02-09

### Fixed
- fixes the transform docs




## [3.25.0] - 2014-02-09

### Added
- adds 'bundle' and 'transform' events <br>
  https://github.com/substack/node-browserify#bonbundle-function-bundle- 



## [3.24.11] - 2014-02-03

### Changed
- upgrades derequire to 0.6.0. 
  That should be the last piece needed for full es6 syntax support.



## [3.24.10] - 2014-02-01

### Changed
- expands the documentation for the package.json browser and browserify.transform fields <br>
  https://github.com/substack/node-browserify#packagejson 



## [3.24.9] - 2014-02-01

### Fixed
- fixes generator syntax and other es6-isms in browserify <br>
  https://github.com/substack/node-browserify/issues/614 



## [3.24.7] - 2014-01-30

### Fixed
- fixes noParse, which had accidentally been disabled in the insert-module-global changes and also closes <br>
  https://github.com/substack/node-browserify/issues/504 



## [3.24.6] - 2014-01-29

### Fixed
- similar to 3.24.5, 3.24.6 fixes some error reporting propagation from the browserify command



## [3.24.3] - 2014-01-29

### Fixed
- fixes how require('buffer').Buffer wasn't the same as implicit Buffer <br>
  https://github.com/substack/node-browserify/issues/612 



## [3.24.2] - 2014-01-28

### Fixed
- fixes where the output stream didn't emit "close" in standalone mode <br>
  https://github.com/substack/node-browserify/pull/608 



## [3.24.1] - 2014-01-23

### Fixed
- fixes an issue where --standalone combined with expose caused a syntax error <br>
  https://github.com/substack/node-browserify/issues/489 



## [3.24.0] - 2014-01-23

### Removed
- removes require() calls from --standalone so you can require() a standalone bundle again



## [3.23.0] - 2014-01-21

### Fixed
- merges this tiny fix returning `this` in noParse() <br>
  https://github.com/substack/node-browserify/pull/592 



## [3.22.0] - 2014-01-21

### Changed
- merges https://github.com/substack/node-browserify/pull/587  
  which changes the source map prefix from //@ to //#



## [3.21.0] - 2014-01-21

### Changed
- standardizes the module missing error formats to have filename, parent, and type === 'not found' fields



## [3.20.1] - 2014-01-21

### Fixed
- has a fix for the case where stdin is implicitly treated as the input stream instead of a file



## [3.20.0] - 2014-01-13

### Changed
- 3.20.0 is out: parity with how $NODE_PATH works in node <br>
  https://github.com/substack/node-browserify/issues/593 



## [3.19.1] - 2014-01-06

### Fixed
- restores support for node 0.8 by upgrading concat-stream



## [3.0] - 

A new [browserify](http://browserify.org) version is upon us, just in time for
the FESTIVE SEASON during which we in the northern hemisphere at mid to high
latitudes huddle for warmth around oxidizing hydrocarbons!

There are 2 big changes in v3 but most code should be relatively unaffected.

### shiny new Buffer

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

### direct builtin dependencies

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



[12.0.1]:  https://github.com/substack/node-browserify/compare/12.0.0...12.0.1
[12.0.0]:  https://github.com/substack/node-browserify/compare/11.2.0...12.0.0
[11.2.0]:  https://github.com/substack/node-browserify/compare/11.1.0...11.2.0
[11.1.0]:  https://github.com/substack/node-browserify/compare/11.0.1...11.1.0
[11.0.1]:  https://github.com/substack/node-browserify/compare/11.0.0...11.0.1
[11.0.0]:  https://github.com/substack/node-browserify/compare/10.2.6...11.0.0
[10.2.6]:  https://github.com/substack/node-browserify/compare/10.2.5...10.2.6
[10.2.5]:  https://github.com/substack/node-browserify/compare/10.2.4...10.2.5
[10.2.4]:  https://github.com/substack/node-browserify/compare/10.2.3...10.2.4
[10.2.3]:  https://github.com/substack/node-browserify/compare/10.2.2...10.2.3
[10.2.2]:  https://github.com/substack/node-browserify/compare/10.2.1...10.2.2
[10.2.1]:  https://github.com/substack/node-browserify/compare/10.2.0...10.2.1
[10.2.0]:  https://github.com/substack/node-browserify/compare/10.1.3...10.2.0
[10.1.3]:  https://github.com/substack/node-browserify/compare/10.1.2...10.1.3
[10.1.2]:  https://github.com/substack/node-browserify/compare/10.1.1...10.1.2
[10.1.1]:  https://github.com/substack/node-browserify/compare/10.1.0...10.1.1
[10.1.0]:  https://github.com/substack/node-browserify/compare/10.0.0...10.1.0
[10.0.0]:  https://github.com/substack/node-browserify/compare/9.0.8...10.0.0
[9.0.8]:   https://github.com/substack/node-browserify/compare/9.0.7...9.0.8
[9.0.7]:   https://github.com/substack/node-browserify/compare/9.0.6...9.0.7
[9.0.6]:   https://github.com/substack/node-browserify/compare/9.0.5...9.0.6
[9.0.5]:   https://github.com/substack/node-browserify/compare/9.0.4...9.0.5
[9.0.4]:   https://github.com/substack/node-browserify/compare/9.0.3...9.0.4
[9.0.3]:   https://github.com/substack/node-browserify/compare/9.0.2...9.0.3
[9.0.2]:   https://github.com/substack/node-browserify/compare/9.0.1...9.0.2
[9.0.1]:   https://github.com/substack/node-browserify/compare/9.0.0...9.0.1
[9.0.0]:   https://github.com/substack/node-browserify/compare/8.1.3...9.0.0
[8.1.3]:   https://github.com/substack/node-browserify/compare/8.1.2...8.1.3
[8.1.2]:   https://github.com/substack/node-browserify/compare/8.1.1...8.1.2
[8.1.1]:   https://github.com/substack/node-browserify/compare/8.1.0...8.1.1
[8.1.0]:   https://github.com/substack/node-browserify/compare/8.0.3...8.1.0
[8.0.3]:   https://github.com/substack/node-browserify/compare/8.0.2...8.0.3
[8.0.2]:   https://github.com/substack/node-browserify/compare/8.0.1...8.0.2
[8.0.1]:   https://github.com/substack/node-browserify/compare/8.0.0...8.0.1
[8.0.0]:   https://github.com/substack/node-browserify/compare/7.1.0...8.0.0
[7.1.0]:   https://github.com/substack/node-browserify/compare/7.0.3...7.1.0
[7.0.3]:   https://github.com/substack/node-browserify/compare/7.0.2...7.0.3
[7.0.2]:   https://github.com/substack/node-browserify/compare/7.0.1...7.0.2
[7.0.1]:   https://github.com/substack/node-browserify/compare/7.0.0...7.0.1
[7.0.0]:   https://github.com/substack/node-browserify/compare/6.3.4...7.0.0
[6.3.4]:   https://github.com/substack/node-browserify/compare/6.3.3...6.3.4
[6.3.3]:   https://github.com/substack/node-browserify/compare/6.3.2...6.3.3
[6.3.2]:   https://github.com/substack/node-browserify/compare/6.3.1...6.3.2
[6.3.1]:   https://github.com/substack/node-browserify/compare/6.3.0...6.3.1
[6.3.0]:   https://github.com/substack/node-browserify/compare/6.2.0...6.3.0
[6.2.0]:   https://github.com/substack/node-browserify/compare/6.1.2...6.2.0
[6.1.2]:   https://github.com/substack/node-browserify/compare/6.1.1...6.1.2
[6.1.1]:   https://github.com/substack/node-browserify/compare/6.1.0...6.1.1
[6.1.0]:   https://github.com/substack/node-browserify/compare/6.0.3...6.1.0
[6.0.3]:   https://github.com/substack/node-browserify/compare/6.0.2...6.0.3
[6.0.2]:   https://github.com/substack/node-browserify/compare/6.0.1...6.0.2
[6.0.1]:   https://github.com/substack/node-browserify/compare/6.0.0...6.0.1
[6.0.0]:   https://github.com/substack/node-browserify/compare/5.13.1...6.0.0
[5.13.1]:  https://github.com/substack/node-browserify/compare/5.13.0...5.13.1
[5.13.0]:  https://github.com/substack/node-browserify/compare/5.12.2...5.13.0
[5.12.2]:  https://github.com/substack/node-browserify/compare/5.12.1...5.12.2
[5.12.1]:  https://github.com/substack/node-browserify/compare/5.12.0...5.12.1
[5.12.0]:  https://github.com/substack/node-browserify/compare/5.11.2...5.12.0
[5.11.2]:  https://github.com/substack/node-browserify/compare/5.11.1...5.11.2
[5.11.1]:  https://github.com/substack/node-browserify/compare/5.11.0...5.11.1
[5.11.0]:  https://github.com/substack/node-browserify/compare/5.10.1...5.11.0
[5.10.1]:  https://github.com/substack/node-browserify/compare/5.10.0...5.10.1
[5.10.0]:  https://github.com/substack/node-browserify/compare/5.9.3...5.10.0
[5.9.3]:   https://github.com/substack/node-browserify/compare/5.9.2...5.9.3
[5.9.2]:   https://github.com/substack/node-browserify/compare/5.9.1...5.9.2
[5.9.1]:   https://github.com/substack/node-browserify/compare/5.9.0...5.9.1
[5.9.0]:   https://github.com/substack/node-browserify/compare/5.8.0...5.9.0
[5.8.0]:   https://github.com/substack/node-browserify/compare/5.7.0...5.8.0
[5.7.0]:   https://github.com/substack/node-browserify/compare/5.6.1...5.7.0
[5.6.1]:   https://github.com/substack/node-browserify/compare/5.6.0...5.6.1
[5.6.0]:   https://github.com/substack/node-browserify/compare/5.5.0...5.6.0
[5.5.0]:   https://github.com/substack/node-browserify/compare/5.4.2...5.5.0
[5.4.2]:   https://github.com/substack/node-browserify/compare/5.4.1...5.4.2
[5.4.1]:   https://github.com/substack/node-browserify/compare/5.4.0...5.4.1
[5.4.0]:   https://github.com/substack/node-browserify/compare/5.3.0...5.4.0
[5.3.0]:   https://github.com/substack/node-browserify/compare/5.2.1...5.3.0
[5.2.1]:   https://github.com/substack/node-browserify/compare/5.2.0...5.2.1
[5.2.0]:   https://github.com/substack/node-browserify/compare/5.1.1...5.2.0
[5.1.1]:   https://github.com/substack/node-browserify/compare/5.1.0...5.1.1
[5.1.0]:   https://github.com/substack/node-browserify/compare/5.0.8...5.1.0
[5.0.8]:   https://github.com/substack/node-browserify/compare/5.0.7...5.0.8
[5.0.7]:   https://github.com/substack/node-browserify/compare/5.0.6...5.0.7
[5.0.6]:   https://github.com/substack/node-browserify/compare/5.0.5...5.0.6
[5.0.5]:   https://github.com/substack/node-browserify/compare/5.0.4...5.0.5
[5.0.4]:   https://github.com/substack/node-browserify/compare/5.0.3...5.0.4
[5.0.3]:   https://github.com/substack/node-browserify/compare/5.0.2...5.0.3
[5.0.2]:   https://github.com/substack/node-browserify/compare/5.0.1...5.0.2
[5.0.1]:   https://github.com/substack/node-browserify/compare/5.0.0...5.0.1
[5.0.0]:   https://github.com/substack/node-browserify/compare/4.2.3...5.0.0
[4.2.3]:   https://github.com/substack/node-browserify/compare/4.2.2...4.2.3
[4.2.2]:   https://github.com/substack/node-browserify/compare/4.2.1...4.2.2
[4.2.1]:   https://github.com/substack/node-browserify/compare/4.2.0...4.2.1
[4.2.0]:   https://github.com/substack/node-browserify/compare/4.1.11...4.2.0
[4.1.11]:  https://github.com/substack/node-browserify/compare/4.1.10...4.1.11
[4.1.10]:  https://github.com/substack/node-browserify/compare/4.1.9...4.1.10
[4.1.9]:   https://github.com/substack/node-browserify/compare/4.1.8...4.1.9
[4.1.8]:   https://github.com/substack/node-browserify/compare/4.1.7...4.1.8
[4.1.7]:   https://github.com/substack/node-browserify/compare/4.1.6...4.1.7
[4.1.6]:   https://github.com/substack/node-browserify/compare/4.1.5...4.1.6
[4.1.5]:   https://github.com/substack/node-browserify/compare/4.1.4...4.1.5
[4.1.4]:   https://github.com/substack/node-browserify/compare/4.1.2...4.1.4
[4.1.2]:   https://github.com/substack/node-browserify/compare/4.1.1...4.1.2
[4.1.1]:   https://github.com/substack/node-browserify/compare/4.1.0...4.1.1
[4.1.0]:   https://github.com/substack/node-browserify/compare/4.0...4.1.0
[4.0]:     https://github.com/substack/node-browserify/compare/3.46.1...4.0
[3.46.1]:  https://github.com/substack/node-browserify/compare/3.46.0...3.46.1
[3.46.0]:  https://github.com/substack/node-browserify/compare/3.45.0...3.46.0
[3.45.0]:  https://github.com/substack/node-browserify/compare/3.44.2...3.45.0
[3.44.2]:  https://github.com/substack/node-browserify/compare/3.44.1...3.44.2
[3.44.1]:  https://github.com/substack/node-browserify/compare/3.44.0...3.44.1
[3.44.0]:  https://github.com/substack/node-browserify/compare/3.43.0...3.44.0
[3.43.0]:  https://github.com/substack/node-browserify/compare/3.42.0...3.43.0
[3.42.0]:  https://github.com/substack/node-browserify/compare/3.41.0...3.42.0
[3.41.0]:  https://github.com/substack/node-browserify/compare/3.40.4...3.41.0
[3.40.4]:  https://github.com/substack/node-browserify/compare/3.40.3...3.40.4
[3.40.3]:  https://github.com/substack/node-browserify/compare/3.40.2...3.40.3
[3.40.2]:  https://github.com/substack/node-browserify/compare/3.40.1...3.40.2
[3.40.1]:  https://github.com/substack/node-browserify/compare/3.40.0...3.40.1
[3.40.0]:  https://github.com/substack/node-browserify/compare/3.39.0...3.40.0
[3.39.0]:  https://github.com/substack/node-browserify/compare/3.38.0...3.39.0
[3.38.0]:  https://github.com/substack/node-browserify/compare/3.37.2...3.38.0
[3.37.2]:  https://github.com/substack/node-browserify/compare/3.37.1...3.37.2
[3.37.1]:  https://github.com/substack/node-browserify/compare/3.37.0...3.37.1
[3.37.0]:  https://github.com/substack/node-browserify/compare/3.36.1...3.37.0
[3.36.1]:  https://github.com/substack/node-browserify/compare/3.36.0...3.36.1
[3.36.0]:  https://github.com/substack/node-browserify/compare/3.35.0...3.36.0
[3.35.0]:  https://github.com/substack/node-browserify/compare/3.34.0...3.35.0
[3.34.0]:  https://github.com/substack/node-browserify/compare/3.33.1...3.34.0
[3.33.1]:  https://github.com/substack/node-browserify/compare/3.33.0...3.33.1
[3.33.0]:  https://github.com/substack/node-browserify/compare/3.32.1...3.33.0
[3.32.1]:  https://github.com/substack/node-browserify/compare/3.32.0...3.32.1
[3.32.0]:  https://github.com/substack/node-browserify/compare/3.31.2...3.32.0
[3.31.2]:  https://github.com/substack/node-browserify/compare/3.31.1...3.31.2
[3.31.1]:  https://github.com/substack/node-browserify/compare/3.31.0...3.31.1
[3.31.0]:  https://github.com/substack/node-browserify/compare/3.30.4...3.31.0
[3.30.4]:  https://github.com/substack/node-browserify/compare/3.30.3...3.30.4
[3.30.3]:  https://github.com/substack/node-browserify/compare/3.30.2...3.30.3
[3.30.2]:  https://github.com/substack/node-browserify/compare/3.30.1...3.30.2
[3.30.1]:  https://github.com/substack/node-browserify/compare/3.30.0...3.30.1
[3.30.0]:  https://github.com/substack/node-browserify/compare/3.29.1...3.30.0
[3.29.1]:  https://github.com/substack/node-browserify/compare/3.29.0...3.29.1
[3.29.0]:  https://github.com/substack/node-browserify/compare/3.28.2...3.29.0
[3.28.2]:  https://github.com/substack/node-browserify/compare/3.28.1...3.28.2
[3.28.1]:  https://github.com/substack/node-browserify/compare/3.28.0...3.28.1
[3.28.0]:  https://github.com/substack/node-browserify/compare/3.27.1...3.28.0
[3.27.1]:  https://github.com/substack/node-browserify/compare/3.27.0...3.27.1
[3.27.0]:  https://github.com/substack/node-browserify/compare/3.26.0...3.27.0
[3.26.0]:  https://github.com/substack/node-browserify/compare/3.25.2...3.26.0
[3.25.2]:  https://github.com/substack/node-browserify/compare/3.25.1...3.25.2
[3.25.1]:  https://github.com/substack/node-browserify/compare/3.25.0...3.25.1
[3.25.0]:  https://github.com/substack/node-browserify/compare/3.24.11...3.25.0
[3.24.11]: https://github.com/substack/node-browserify/compare/3.24.10...3.24.11
[3.24.10]: https://github.com/substack/node-browserify/compare/3.24.9...3.24.10
[3.24.9]:  https://github.com/substack/node-browserify/compare/3.24.7...3.24.9
[3.24.7]:  https://github.com/substack/node-browserify/compare/3.24.6...3.24.7
[3.24.6]:  https://github.com/substack/node-browserify/compare/3.24.3...3.24.6
[3.24.3]:  https://github.com/substack/node-browserify/compare/3.24.2...3.24.3
[3.24.2]:  https://github.com/substack/node-browserify/compare/3.24.1...3.24.2
[3.24.1]:  https://github.com/substack/node-browserify/compare/3.24.0...3.24.1
[3.24.0]:  https://github.com/substack/node-browserify/compare/3.23.0...3.24.0
[3.23.0]:  https://github.com/substack/node-browserify/compare/3.22.0...3.23.0
[3.22.0]:  https://github.com/substack/node-browserify/compare/3.21.0...3.22.0
[3.21.0]:  https://github.com/substack/node-browserify/compare/3.20.1...3.21.0
[3.20.1]:  https://github.com/substack/node-browserify/compare/3.20.0...3.20.1
[3.20.0]:  https://github.com/substack/node-browserify/compare/3.19.1...3.20.0
[3.19.1]:  https://github.com/substack/node-browserify/compare/3.0...3.19.1

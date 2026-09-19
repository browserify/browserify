# browserify examples

Small, runnable versions of the examples in the
[main readme](../readme.markdown).

The shell scripts here call `browserify` as a command, so they need it on your
`PATH`. From a clone of this repository, the quickest way to get that is:

```
npm install
export PATH="$PWD/node_modules/.bin:$PATH"
```

Or install it globally with `npm install -g browserify`.

## [api](api)

Bundling from the [Node API](../readme.markdown#methods) instead of the command
line. `build.js` creates a browserify instance, adds `browser/main.js` as the
entry point, and pipes the bundle to stdout:

```
node build.js > bundle.js
```

`browser/main.js` requires `foo.js`, which in turn requires `bar.js`, so all
three end up in the bundle.

## [multiple_bundles](multiple_bundles)

Splitting shared code out of two page bundles so the browser can cache it once,
using `--require` and `--external`. See the
[multiple bundles section](../readme.markdown#multiple-bundles) of the readme
for what each command does.

```
./build.sh
```

This writes `static/common.js`, `static/beep.js`, and `static/boop.js`. Open
`static/beep.html` or `static/boop.html`; each loads `common.js` first and then
its own bundle, and both share the single copy of `robot.js` in `common.js`.

## [source_maps](source_maps)

Bundling with `--debug` so the browser's debugger shows your original files
rather than the concatenated bundle.

```
./build.sh
```

This one calls `../../bin/cmd.js` directly, so it needs no `PATH` setup. It
writes `js/build/bundle.js` with an inline source map. Open `index.html` and
look in your debugger's sources panel: `js/main.js`, `js/foo.js`, and
`js/wunder/bar.js` appear as separate files, and breakpoints in them work.

To write the map to a separate `.js.map` file instead of inlining it, see
[external source maps](../readme.markdown#external-source-maps) in the readme.

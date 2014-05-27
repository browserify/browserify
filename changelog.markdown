# 4.1.6

emits the 'id' event on the correct instance https://github.com/substack/node-browserify/pull/780

# 4.1.5

added this document

# 4.1.4

fixes a bug in `ie<=8` support for querystring https://github.com/substack/node-browserify/issues/764

# 4.1.2

upgrades umd to fix some issues with --standalone https://github.com/substack/node-browserify/pull/714

# 4.1.1

makes deps() behave more like bundle() https://github.com/substack/node-browserify/issues/757 and fixes global transform prescedence https://github.com/substack/node-browserify/issues/759

# 4.1.0

upgrades the version of buffer to ^2.3.0

# 4.0

4.0 is hot off the presses. See [doc/changelog/4_0.markdown].

# 3.46.1

fixes a bug exposing the host path of the process module in the bundle output https://github.com/substack/insert-module-globals/pull/32

# 3.46.0

allows array arguments in b.require(), b.add(), and b.external() https://github.com/substack/node-browserify/pull/742 from @spacepluk

# 3.45.0

renders complete stack traces where before they were getting truncated https://github.com/substack/node-browserify/pull/741  patch from @secoif

# 3.44.2

slims down the dependency payload by 20M https://github.com/substack/node-browserify/pull/736 

# 3.44.1

fixes the recursion error many people were getting https://github.com/substack/node-browserify/pull/713  Thanks to @MattMcKegg  for isolating the bug!

# 3.44.0

upgrades module-deps to 1.10.0 to make all the packageFilter dir argument pathways are consistent

# 3.43.0

lets b.transform(opts, t) args to be swapped around since opts is more common as a last argument

# 3.42.0

passes through the dir parameter in opts.packageFilter from module-deps 1.10.0 https://github.com/substack/node-browserify/pull/731 

# 3.41.0

has an option to disable external files, making it easier to run bundles in node for code coverage https://github.com/substack/node-browserify/pull/672 

# 3.40.4

makes --list work again https://github.com/substack/node-browserify/pull/727 

# 3.40.3

merges a patch for piping via stdin and --require at the same time https://github.com/substack/node-browserify/pull/728 

# 3.40.2

upgrades module-deps to fix --list for $NODE_PATH https://github.com/substack/node-browserify/issues/726 

# 3.40.1

upgrades module-deps to get this packageTransform bugfix https://github.com/substack/module-deps/pull/32 

# 3.40.0

modifies the behavior of opts.builtins to be more useful and intuitive https://github.com/substack/node-browserify/pull/717 

# 3.39.0

adds a zlib that has parity with node https://github.com/substack/node-browserify/pull/721 

# 3.38.0

upgrades derequire which uses esprima-fb https://github.com/substack/node-browserify/pull/710 

# 3.37.2

adds 'close' events back to the bundle stream. This should fix some issues with watchify.

# 3.37.1

fixes a bug with through being required in the bin/cmd.js instead of through2

# 3.37.0

also reverts that require('process') thing which was mistakenly briefly put in the builtins list

# 3.37.0

gives streams2 semantics for bundle() https://github.com/substack/node-browserify/pull/646 

# 3.36.1

fixes a dumb bug with ^ for versions that don't work in old npm clients

# 3.36.0

adds require('process') and removes the path resolution for process out of insert-module-globals

# 3.35.0

adds an empty tls stub to the builtins list https://github.com/substack/node-browserify/issues/703 

# 3.34.0

fixes a bug with transforms not being applied in deps() https://github.com/substack/node-browserify/pull/708 

# 3.33.1

fixes a bug with options in --global-transform on the command-line https://github.com/substack/node-browserify/pull/705 

# 3.33.0

fixes parsing errors while maintaining es6 support by switching to esprima-fb https://github.com/substack/node-browserify/issues/698 

# 3.32.1

should be easier to shinkwrap and install on windows https://github.com/substack/node-browserify/pull/684 

# 3.32.0

adds --full-path and opts.fullPath to always expand ids to full paths https://github.com/substack/node-browserify/pull/668#issuecomment-36586786 

# 3.31.2

fixes a bug in the subarg argument parsing for multiple transforms https://github.com/substack/node-browserify/issues/678 

# 3.31.1

uses process.cwd() as the default rebase target instead of commondir https://github.com/substack/node-browserify/pull/669#issuecomment-36078282 

# 3.31.0

merges https://github.com/substack/node-browserify/pull/669  which should help with more deterministic builds across systems

# 3.30.4

fixes parsing the --insert-global-vars argument properly https://github.com/substack/node-browserify/pull/674 

# 3.30.3

fixes exclude globbing in the arg parser https://github.com/substack/node-browserify/pull/676 

# 3.30.2

included a fix for --no-builtins for non-wrapped modules https://github.com/substack/node-browserify/pull/666 

# 3.30.1

upgrades buffer for a utf8 fix https://github.com/substack/node-browserify/pull/656 

# 3.30.0

adds globs for -u, -i, and -x https://github.com/substack/node-browserify/issues/654 

# 3.29.1

adds relatively-resolved paths to ignored and excluded files

# 3.29.0

upgrades http-browserify to 1.3.1

# 3.28.2

now always includes the full package.json content in the 'package' event

# 3.28.1

fixes a bug with stream entry order https://github.com/substack/node-browserify/pull/643 

# 3.28.0

adds plugins for doing super fancy things like factored bundle output https://github.com/substack/node-browserify#plugins 

# 3.27.1

fixes a bug resolving transform modules when browserify is under a symlink

# 3.27.0

adds transform configuration in the package.json browserify.transform field https://github.com/substack/module-deps#packagejson-transformkey 

# 3.26.0

you can pass arguments to transforms https://github.com/substack/node-browserify/blob/master/bin/advanced.txt#L67-L77 

# 3.25.2

fixes a bug where the transform event didn't fire while IO was pending

# 3.25.1

fixes the transform docs

# 3.25.0

adds 'bundle' and 'transform' events https://github.com/substack/node-browserify#bonbundle-function-bundle- 

# 3.24.11

upgrades derequire to 0.6.0. That should be the last piece needed for full es6 syntax support.

# 3.24.10

expands the documentation for the package.json browser and browserify.transform fields https://github.com/substack/node-browserify#packagejson 

# 3.24.9

fixes generator syntax and other es6-isms in browserify https://github.com/substack/node-browserify/issues/614 

# 3.24.7

fixes noParse, which had accidentally been disabled in the insert-module-global changes and also closes https://github.com/substack/node-browserify/issues/504 

# 3.24.6

similar to 3.24.5, 3.24.6 fixes some error reporting propagation from the browserify command

# 3.24.3

fixes how require('buffer').Buffer wasn't the same as implicit Buffer https://github.com/substack/node-browserify/issues/612 

# 3.24.2

fixes where the output stream didn't emit "close" in standalone mode https://github.com/substack/node-browserify/pull/608 

# 3.24.1

fixes an issue where --standalone combined with expose caused a syntax error https://github.com/substack/node-browserify/issues/489 

# 3.24.0

removes require() calls from --standalone so you can require() a standalone bundle again

# 3.23.0

merges this tiny fix returning `this` in noParse() https://github.com/substack/node-browserify/pull/592 

# 3.22.0

merges https://github.com/substack/node-browserify/pull/587  which changes the source map prefix from //@ to //#

# 3.21.0

standardizes the module missing error formats to have filename, parent, and type === 'not found' fields

# 3.20.1

has a fix for the case where stdin is implicitly treated as the input stream instead of a file

# 3.20.0

3.20.0 is out: parity with how $NODE_PATH works in node https://github.com/substack/node-browserify/issues/593 

# 3.19.1

restores support for node 0.8 by upgrading concat-stream

# 3.0

See [doc/changelog/3_0.markdown](doc/changelog/3_0.markdown).


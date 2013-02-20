module.exports = require('optimist')
    .usage('Usage: browserify [entry files] {OPTIONS}')
    .wrap(80)
    .option('outfile', {
        alias : 'o',
        desc : 'Write the browserify bundle to this file.\n'
            + 'If unspecified, browserify prints to stdout.'
        ,
    })
    .option('require', {
        alias : 'r',
        desc : 'A module name or file to bundle.require()\n'
            + 'Optionally use a colon separator to set the target.'
        ,
    })
    .option('entry', {
        alias : 'e',
        desc : 'An entry point of your app'
    })
    .option('exports', {
        desc : 'Export these core objects, comma-separated list\n'
            + 'with any of: require, process. If unspecified, the\n'
            + 'export behavior will be inferred.\n'
    })
    .option('ignore', {
        alias : 'i',
        desc : 'Ignore a file'
    })
    .option('alias', {
        alias : 'a',
        desc : 'Register an alias with a colon separator: "to:from"\n'
            + "Example: --alias 'jquery:jquery-browserify'"
        ,
    })
    .option('cache', {
        alias : 'c',
        desc : 'Turn on caching at $HOME/.config/browserling/cache.json '
            + 'or use a file for caching.\n',
        default : true,
    })
    .option('debug', {
        alias : 'd',
        desc : 'Switch on debugging mode with //@ sourceURL=...s.',
        type : 'boolean'
    })
    .option('plugin', {
        alias : 'p',
        desc : 'Use a plugin.\n'
            + 'Example: --plugin aliasify'
        ,
    })
    .option('prelude', {
        default : true,
        type : 'boolean',
        desc : 'Include the code that defines require() in this bundle.'
    })
    .option('watch', {
        alias : 'w',
        desc : 'Watch for changes. The script will stay open and write updates '
            + 'to the output every time any of the bundled files change.\n'
            + 'This option only works in tandem with -o.'
        ,
    })
    .option('verbose', {
        alias : 'v',
        desc : 'Write out how many bytes were written in -o mode. '
            + 'This is especially useful with --watch.'
        ,
    })
    .option('help', {
        alias : 'h',
        desc : 'Show this message'
    })
    .check(function (argv) {
        if (argv.help) throw ''
        if (process.argv.length <= 2) throw 'Specify a parameter.'
    })
    .argv
;


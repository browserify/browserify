#!/usr/bin/env node

var browserify = require('../');
var fs = require('fs');
var path = require('path');

var argv = require('optimist')
    .usage('Usage: $0 [entry files] {OPTIONS}')
    .wrap(80)
    .option('outfile', {
        alias : 'o',
        desc : 'Write the browserify bundle to this file',
        default : 'bundle.js',
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
    .option('alias', {
        alias : 'a',
        desc : 'Register an alias with a colon separator: "to:from"\n'
            + "Example: --alias 'jquery:jquery-browserify'"
        ,
    })
    .option('plugin', {
        alias : 'p',
        desc : 'Use a plugin. Use a colon separator to specify additional '
            + 'plugin arguments as a JSON string.\n'
            + 'Example: --plugin \'fileify:["files","."]\''
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

if (path.existsSync(argv.outfile)) {
    console.error('outfile exists.');
    process.exit();
}

var bundle = browserify();
([].concat(argv.plugin || [])).forEach(function (plugin) {
    if (plugin.match(/:/)) {
        var ps = plugin.split(':');
        var args = ps[1];
        try {
            args = JSON.parse(args);
        }
        catch (err) {}
        
        if (!Array.isArray(args)) args = [ args ];
        
        var fn = require(ps[0]);
        bundle.use(fn.apply(null, args));
    }
    else {
        bundle.use(require(plugin));
    }
});

([].concat(argv.alias || [])).forEach(function (alias) {
    if (!alias.match(/:/)) {
        console.error('aliases require a colon separator');
        process.exit();
    }
    bundle.alias.apply(bundle, alias.split(':'));
});

([].concat(argv.require || [])).forEach(function (req) {
    if (req.match(/:/)) {
        var s = req.split(':');
        bundle.require(s[0], { target : s[1] });
    }
    else {
        bundle.require(req);
    }
});

(argv._.concat(argv.entry || [])).forEach(function (entry) {
    bundle.addEntry(entry);
});

fs.writeFileSync(argv.outfile, bundle.bundle());

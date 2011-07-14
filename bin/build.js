#!/usr/bin/env node

var browserify = require('../');

var argv = require('optimist')
    .usage('Usage: $0 [entry files] {OPTIONS}')
    .wrap(80)
    .option('base', {
        alias : 'b',
        default : process.cwd(),
        desc : 'Base path of the app you want to browserify',
    })
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

process.exit();

var fs = require('fs');
var path = require('path');

var bundle = browserify(),
    basePath = argv.b,
    templatePath = argv.t,
    entryPoint = argv.s,
    outPath = argv.outpath,
    outFile = argv.o;

console.log(basePath);
console.log('Generating bundle... ', basePath, templatePath);

bundle.use(formify(path.normalize(basePath + templatePath), { watch : false }));
bundle.require(path.normalize(basePath + entryPoint), {target: outFile});

fs.writeFileSync(path.normalize(basePath + outPath + '/' + outFile), bundle.bundle());

function formify() {
  var fileify = require('fileify');
  return function (bundle) {
    bundle.use(fileify(path.normalize(templatePath + 'index.js'), path.normalize(basePath + templatePath), '.html'));
  };
}

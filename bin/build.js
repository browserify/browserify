#!/usr/bin/env node

var browserify = require('../');

var argv = require('optimist')
    .default('b', __dirname)
    .alias('b', 'basepath')
    .describe('b', 'The base path of the app you want to Browserify.')
    .default('outpath', '/../')
    .describe('outpath', 'The relative path to save your Browserified code to.')
    .default('o', 'browserified.js')
    .alias('o', 'outfile')
    .describe('o', 'The filename to save your Browserified code as.')
    .demand(['s', 't'])
    .alias('t', 'templates')
    .alias('s', 'main')
    .describe('t', 'The relative path where your HTML templates reside.')
    .describe('s', 'The relative path of the main script / entry point of your app.')
    .argv
;

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

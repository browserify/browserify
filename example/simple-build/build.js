#!/usr/bin/env node

var browserify = require('browserify');
var fs = require('fs');

var src = browserify(__dirname + '/js/entry.js').bundle();
fs.writeFileSync(__dirname + '/browserify.js', src);

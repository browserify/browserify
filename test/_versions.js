var assert = require('assert');
var fs = require('fs');
var path = require('path');

var stackUtils = require('stack-utils/package.json');
var trivialDeferred = JSON.parse(fs.readFileSync(path.join(__dirname, '../node_modules/trivial-deferred/package.json')));

assert(stackUtils.version === '1.0.2', 'stack-utils must be pinned to es5 compatible version');
assert(trivialDeferred.version === '1.0.1', 'trivial-deferred must be pinned to es5 compatible version');

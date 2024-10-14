var assert = require('assert');
var stackUtils = require('stack-utils/package.json');
var trivialDeferred = require('trivial-deferred/package.json');

assert(stackUtils.version === '1.0.2', 'stack-utils must be pinned to es5 compatible version');
assert(trivialDeferred.version === '1.0.1', 'trivial-deferred must be pinned to es5 compatible version');

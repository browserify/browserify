var assert = require('assert');
var EventEmitter = require('../builtins/events').EventEmitter;

exports.setMaxListener = function () {
    var ee = new EventEmitter;
    ee.setMaxListeners(5);
};

var mdeps = require('module-deps');
var browserPack = require('browser-pack');
var through = require('through');
var duplexer = require('duplexer');

module.exports = function (files) {
    return new Browserify(files);
};

function Browserify (files) {
    this.files = [].concat(files).filter(Boolean);
}

Browserify.prototype.bundle = function () {
    return this.deps().pipe(this.pack());
};

Browserify.prototype.deps = function () {
    return mdeps(this.files);
};

Browserify.prototype.pack = function () {
    var packer = browserPack({ raw: true });
    var stream = through();
    packer.pipe(stream);
    return duplexer(packer, stream);
};

var mdeps = require('module-deps');
var browserPack = require('browser-pack');
var through = require('through');
var duplexer = require('duplexer');

module.exports = function (files) {
    return new Browserify(files);
};

function Browserify (files) {
    this.files = [].concat(files).filter(Boolean);
    this.exports = [];
}

Browserify.prototype.require = function (name) {
    this.exports.push(name);
    this.files.push(require.resolve(name)); // TODO: make async
};

Browserify.prototype.bundle = function () {
    return this.deps().pipe(this.pack());
};

Browserify.prototype.deps = function () {
    return mdeps(this.files);
};

Browserify.prototype.pack = function () {
    var packer = browserPack({ raw: true });
    var first = true;
    var output = through(write, end);
    packer.pipe(output);
    return duplexer(packer, output);
    
    function write (buf) {
        if (first && exports.length) {
            this.emit('data', '');
        }
        else if (first) this.emit('data', ';')
        first = false;
        this.emit('data', buf);
    }
    
    function end () {
        this.emit('data', ';\n');
        this.emit('end');
    }
};

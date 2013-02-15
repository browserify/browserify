var mdeps = require('module-deps');
var browserPack = require('browser-pack');
var through = require('through');
var duplexer = require('duplexer');

module.exports = function (files) {
    return new Browserify(files);
};

function Browserify (files) {
    this.files = [].concat(files).filter(Boolean);
    this.exports = {};
}

Browserify.prototype.addEntry = function (file) {
    this.files.push(file);
};

Browserify.prototype.require = function (name) {
    var file = require.resolve(name); // TODO: make async
    this.exports[name] = file;
    this.files.push(file);
};

Browserify.prototype.bundle = function (cb) {
    var d = this.deps()
    var p = this.pack();
    d.pipe(p);
    
    if (cb) {
        var data = '';
        p.on('data', function (buf) { data += buf });
        p.on('end', function () { cb(null, data) });
        d.on('error', cb);
        p.on('error', cb);
    }
    return p;
};

Browserify.prototype.deps = function () {
    return mdeps(this.files);
};

Browserify.prototype.pack = function () {
    var packer = browserPack({ raw: true });
    var ids = {};
    var idIndex = 0;
    
    var input = through(function (row) {
        var ix = ids[row.id] || idIndex++;
        if (!ids[ix]) ids[ix] = row.id;
        row.id = ix;
        row.deps = Object.keys(row.deps).reduce(function (acc, key) {
            var file = row.deps[key];
            if (!ids[file]) ids[file] = idIndex++;
            acc[key] = ids[file];
            return acc;
        }, {});
        this.emit('data', row);
    });
    
    var first = true;
    var hasExports = Object.keys(exports).length;
    var output = through(write, end);
    
    function writePrelude () {
        if (!first) return;
        if (!hasExports) return output.emit('data', ';');
        output.emit('data', [
            'require=(function(o,r){',
            '})(typeof require!=="undefined"&&require,'
        ].join(''));
    }
    
    input.pipe(packer);
    packer.pipe(output);
    return duplexer(input, output);
    
    function write (buf) {
        if (first) writePrelude();
        first = false;
        this.emit('data', buf);
    }
    
    function end () {
        if (first) writePrelude();
        this.emit('data', hasExports ? ');' : ';');
        this.emit('end');
    }
};

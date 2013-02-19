var mdeps = require('module-deps');
var browserPack = require('browser-pack');
var through = require('through');
var duplexer = require('duplexer');
var parseScope = require('lexical-scope');

module.exports = function (files) {
    return new Browserify(files);
};

function Browserify (files) {
    this.files = [].concat(files).filter(Boolean);
    this.exports = {};
    this._globals = {};
}

Browserify.prototype.addEntry = function (file) {
    this.files.push(file);
};

Browserify.prototype.require = function (name) {
    var file = require.resolve(name); // TODO: make async
    this.exports[file] = name;
    this.files.push(file);
};

Browserify.prototype.bundle = function (cb) {
    var d = this.deps()
    var g = this.insertGlobals();
    var p = this.pack();
    d.pipe(g).pipe(p);
    
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
    var self = this;
    return mdeps(self.files);
};

var processModulePath = require.resolve('process/browser.js');
Browserify.prototype.insertGlobals = function () {
    var self = this;
    return through(function (row) {
        var tr = this;
        var scope = parseScope(row.source);
        
        if (scope.globals.implicit.indexOf('process') >= 0) {
            if (!self._globals.process) {
                tr.pause();
                
                var d = mdeps(processModulePath);
                d.on('data', function (r) { tr.emit('data', r) });
                d.on('end', function () { tr.resume() });
            }
            
            self._globals.process = true;
            row.deps.__browserify_process = processModulePath;
            row.source = 'var process=require("__browserify_process");'
                + row.source
            ;
        }
        tr.queue(row);
    });
};

Browserify.prototype.pack = function () {
    var self = this;
    var packer = browserPack({ raw: true });
    var ids = {};
    var idIndex = 0;
    
    var input = through(function (row) {
        var ix;
        if (self.exports[row.id]) {
            ix = self.exports[row.id];
        }
        else {
            ix = ids[row.id] || idIndex++;
        }
        if (ids[row.id] === undefined) ids[row.id] = ix;
        
        row.id = ix;
        row.deps = Object.keys(row.deps).reduce(function (acc, key) {
            var file = row.deps[key];
            if (ids[file] === undefined) ids[file] = idIndex++;
            acc[key] = ids[file];
            return acc;
        }, {});
        this.queue(row);
    });
    
    var first = true;
    var hasExports = Object.keys(self.exports).length;
    var output = through(write, end);
    
    function writePrelude () {
        if (!first) return;
        if (!hasExports) return output.queue(';');
        output.queue([
            'require=(function(o,r){',
                'return function(n){',
                    'var x=r(n);',
                    'if(x!==undefined)return x;',
                    'if(o)return o(n);',
                    'throw new Error("Cannot find module \'"+n+"\'")',
                '}',
            '})(typeof require!=="undefined"&&require,',
        ].join(''));
    }
    
    input.pipe(packer);
    packer.pipe(output);
    return duplexer(input, output);
    
    function write (buf) {
        if (first) writePrelude();
        first = false;
        this.queue(buf);
    }
    
    function end () {
        if (first) writePrelude();
        this.queue(hasExports ? ');' : ';');
        this.emit('end');
    }
};

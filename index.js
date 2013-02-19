var through = require('through');
var duplexer = require('duplexer');

var mdeps = require('module-deps');
var browserPack = require('browser-pack');
var parseScope = require('lexical-scope');
var browserResolve = require('browser-resolve');

var path = require('path');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;

module.exports = function (files) {
    return new Browserify(files);
};

inherits(Browserify, EventEmitter);

function Browserify (files) {
    this.files = [].concat(files).filter(Boolean);
    this.exports = {};
    this._globals = {};
    this._pending = 0;
}

Browserify.prototype.add = function (file) {
    this.files.push(file);
};

Browserify.prototype.require = function (name, fromFile) {
    var self = this;
    if (!fromFile) {
        fromFile = require.main
            && require.main.filename
            || path.join(process.cwd(), '_fake')
        ;
    }
    self._pending ++;
    
    browserResolve(name, { filename: fromFile }, function (err, file) {
        if (err) return self.emit('error', err);
        self.expose(name, file);
        if (--self._pending === 0) self.emit('_ready');
    });
    
    return self;
};

Browserify.prototype.expose = function (name, file) {
    this.exports[file] = name;
    this.files.push(file);
};

Browserify.prototype.bundle = function (cb) {
    var self = this;
    
    if (self._pending) {
        var tr = through();
        
        self.on('_ready', function () {
            self.bundle(cb).pipe(tr);
        });
        return tr;
    }
    
    var d = self.deps()
    var g = self.insertGlobals();
    var p = self.pack();
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
    return mdeps(self.files, { resolve: browserResolve });
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
                
                var d = mdeps(processModulePath, { resolve: browserResolve });
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
        if (self.exports[row.id] !== undefined) {
            ix = self.exports[row.id];
        }
        else {
            ix = ids[row.id] !== undefined ? ids[row.id] : idIndex++;
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

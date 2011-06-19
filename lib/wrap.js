var detective = require('detective');
var findit = require('findit');
var resolve = require('resolve');
var Seq = require('seq');

var fs = require('fs');
var path = require('path');

var exports = module.exports = function () {
    var self = {};
    
    return self;
};

exports.walk = function (startFiles, fn) {
    if (!Array.isArray(startFiles)) startFiles = [ startFiles ];
    
    var bodies = {};
    
    Seq(startFiles)
        .parEach(10, function (file) {
            walker(path.resolve(__dirname, file), __dirname, this);
        })
        .seq(function () { fn(null, bodies) })
        .catch(fn)
    ;
    
    function walker (mfile, basedir, cb) {
        if (bodies[mfile]) { cb(); return }
        
        if (resolve.isCore(mfile)) {
            var file = path.resolve(__dirname, '../builtins/' + mfile + '.js');
            if (!path.existsSync(file)) {
                cb('No wrapper for core module ' + mfile);
            }
        }
        else {
            try {
                var file = resolve.sync(mfile, { basedir : basedir });
                basedir = path.dirname(file);
            }
            catch (err) {
                throw new Error('Cannot find module ' + JSON.stringify(mfile)
                    + ' from directory ' + JSON.stringify(basedir)
                );
            }
        }
        
        if (bodies[file]) { cb(); return }
        
        fs.readFile(file, function (err, body) {
            if (err) { cb(err); return }
            bodies[file] = body;
            
            var required = detective.find(body);
            
            if (required.expressions.length) {
                console.error('Expressions in require() statements:');
                required.expressions.forEach(function (ex) {
                    console.error('    require(' + ex + ')');
                });
            }
            
            var files = Object.keys(
                required.strings.reduce(function (acc, r) {
                    acc[r] = true;
                    return acc;
                }, {})
            );
            
            Seq(files)
                .parEach(20, function (f) {
                    walker(f, basedir, this)
                })
                .seq(function () { cb() })
                .catch(function (err) { cb(err) })
            ;
        });
    }
};

var detective = require('detective');
var findit = require('findit');
var resolve = require('resolve');
var Seq = require('seq');

var fs = require('fs');
var path = require('path');

module.exports = function (file_, cb_) {
    var bodies = {};
    var fn = function (err) {
        if (err) cb_(err)
        else cb_(null, bodies)
    };
    
    (function wrapper (mfile, basedir, cb) {
        if (bodies[mfile]) { cb(null); return }
        
        if (resolve.isCore(mfile)) {
            var file = __dirname + '/../builtins/' + mfile + '.js';
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
                    wrapper(f, basedir, this)
                })
                .seq(function () { cb() })
                .catch(function (err) { cb(err) })
            ;
        });
    })(path.resolve(__dirname, file_), __dirname, fn);
};

var fs = require('fs');
var path = require('path');
var find = require('findit');

var npm = require('npm');
var finder = require('finder');

exports = module.exports = function (opts) {
    if (typeof opts === 'string') {
        opts = { base : opts };
        var opts_ = arguments[1];
        if (typeof opts_ === 'object') {
            Object.keys(opts_).forEach(function (key) {
                opts[key] = opts_[key];
            });
        }
    }
    
    if (!opts.mount) opts.mount = '/browserify.js';
    
    var src = wrappers.prelude
        + (opts.base ? find.sync(opts.base) : [])
            .filter(function (file) {
                return file.match(/\.js$/)
            })
            .map(function (file) {
                return wrapScript(
                    opts.base, file,
                    fs.readFileSync(file, 'utf8')
                )
            })
            .join('\n')
    ;
    
    npm.load(function () {
        // async middleware is hard >_<
        (opts.require || []).forEach(function (name) {
            if (builtins[name]) {
                src += builtins[name];
                return;
            }
            
            // this part mostly lifted from npm/lib/explore.js
            var nv = name.split('@');
            var n = nv[0], v = nv[1] || 'active';
            var dir = path.join(npm.dir, n, v, 'package')
            
            fs.stat(dir, function (err, stat) {
                if (err || !stat.isDirectory()) {
                    console.error("It doesn't look like "
                        + name + ' is installed.'
                    );
                }
                else wrapPackage(name, dir, function (err, wrapped) {
                    if (err) console.error(
                        'Error wrapping package ' + name + ': '
                        + (err.stack ? err.stack : err)
                    )
                    else src += wrapped
                });
            });
        });
    });
    
    return function (req, res, next) {
        if (req.url === opts.mount) {
            res.writeHead(200, { 'Content-Type' : 'text/javascript' });
            res.end(src);
        }
        else next();
    };
}

var wrappers = {
    prelude : fs.readFileSync(__dirname + '/wrappers/prelude.js', 'utf8'),
    body : fs.readFileSync(__dirname + '/wrappers/body.js', 'utf8'),
};

var builtins = fs.readdirSync(__dirname + '/builtins/')
    .reduce(function (acc, file) {
        if (file.match(/\.js/)) {
            acc[file.replace(/\.js$/,'')] =
                fs.readFileSync(__dirname + '/builtins/' + file, 'utf8');
        }
        return acc;
    }, {})
;

exports.wrapScript = wrapScript;
function wrapScript (base, filename, src) {
    var rel = filename;
    if (base) {
        var bs = base.split('/');
        var rs = filename.split('/');
        for (var i = 0; i < bs.length && i < rs.length && bs[i] === rs[i]; i++);
        rel = './' + rs.slice(i).join('/').replace(/^\.(?:\/|$)/,'');
    }
    else if (builtins[filename]) {
        return builtins[filename];
    }
    
    return wrappers.body
        .replace('$body', src)
        .replace(/\$filename/g, JSON.stringify(rel))
    ;
}

exports.wrapPackage = wrapPackage;
function wrapPackage (name, dir, cb) {
    fs.readFile(dir + '/package.json', 'utf8', function (err, body) {
        if (err) { cb(err); return }
        
        function wrap (p, n) {
            var file = require.resolve(dir + '/' + p);
            cb(null, wrapScript(null, n, fs.readFileSync(file, 'utf8')));
        }
        
        var pkg = JSON.parse(body);
        if (pkg.main) wrap(pkg.main, name)
        
        if (pkg.modules) {
            Object.keys(pkg.modules).forEach(function (n) {
                wrap(
                    pkg.modules[n],
                    n === 'index' ? name : name + '/' + n
                )
            })
        }
        
        if (pkg.directory && pkg.directory.lib) {
            fs.readdir(pkg.directory.lib, function (err, files) {
                if (err) cb(err)
                else files.forEach(function (file) {
                    wrap(file, name + '/' + file)
                })
            })
        }
    });
}

var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;

var find = require('findit');
var npm = require('npm');

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
        + wrappers.browser_compat
        + wrappers.node_compat
        + Object.keys(builtins).map(function (key) {
            return wrapScript(null, key, builtins[key])
        }).join('\n')
        + (opts.base ? find.sync(opts.base) : [])
            .filter(function (file) {
                return file.match(/\.js$/)
            })
            .map(function (file) {
                return wrapScript(opts.base, file,
                    fs.readFileSync(file, 'utf8')
                )
            })
            .join('\n')
    ;
    npm.load(function () {
        // async middleware is hard >_<
        
        var included = {};
        
        (opts.require || []).forEach(function npmWrap (name) {
            included[name] = true;
            
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
                else {
                    var pkg = wrapPackage(name, dir);
                    pkg.on('package.json', function (json) {
                        if (typeof json.dependencies === 'object') {
                            Object.keys(json.dependencies)
                                .forEach(function (n) {
                                    if (!included[n]) npmWrap(n);
                                })
                            ;
                        }
                    });
                    
                    pkg.on('module', function (modSrc) {
                        src += modSrc;
                    });
                }
            });
        });
    });
    
    return function (req, res, next) {
        if (req.url.split('?')[0] === opts.mount) {
            res.writeHead(200, {
                'Last-Modified' : startDate.toString(),
                'Content-Type' : 'text/javascript',
            });
            res.end(src);
        }
        else next();
    };
}

var wrappers = [ 'prelude', 'body', 'browser_compat', 'node_compat' ]
    .reduce(function (acc, name) {
        acc[name] = fs.readFileSync(
            __dirname + '/wrappers/' + name + '.js', 'utf8'
        );
        return acc;
    }, {})
;

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
    
    return wrappers.body
        .replace('$body', src)
        .replace(/\$filename/g, JSON.stringify(rel))
    ;
}

exports.wrapPackage = wrapPackage;
function wrapPackage (name, dir) {
    var em = new EventEmitter;
    
    fs.readFile(dir + '/package.json', 'utf8', function (err, body) {
        if (err) { em.emit('error', err); return }
        
        function wrap (p, n) {
            var file = require.resolve(dir + '/' + p);
            em.emit('module', wrapScript(
                null, n, fs.readFileSync(file, 'utf8'))
            );
        }
        
        try {
            var pkg = JSON.parse(body);
        }
        catch (err) {
            if (err instanceof SyntaxError) {
                console.error(
                    'Syntax error in the package.json for '
                    + JSON.stringify(name)
                );
            }
            throw err;
        }
        
        em.emit('package.json', pkg);
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
                if (err) em.emit('error', err)
                else files.forEach(function (file) {
                    wrap(file, name + '/' + file)
                })
            })
        }
    });
    
    return em;
}

var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var Hash = require('hashish');

var coffee = require('coffee-script');
var source = require('source');

var exports = module.exports = function (opts) {
    var modified = new Date();
    
    if (!opts.hasOwnProperty('watch')) opts.watch = true;
    var ee = opts.listen = opts.listen || new EventEmitter;
    ee.setMaxListeners(opts.maxListeners || 50);
    var listening = false;
    
    var srcCache = exports.bundle(opts);
    
    return function (req, res, next) {
        if (!listening) {
            req.connection.server.on('close', ee.emit.bind(ee, 'close'));
            ee.on('change', function (file) {
                srcCache = exports.bundle(opts);
            });
            listening = true;
        }
        
        if (req.url.split('?')[0] === (opts.mount || '/browserify.js')) {
            res.writeHead(200, {
                'Last-Modified' : modified.toString(),
                'Content-Type' : 'text/javascript',
            });
            res.end(srcCache);
        }
        else next();
    };
};

exports.bundle = function (opts) {
    if (typeof opts === 'string') {
        opts = { base : opts };
        var opts_ = arguments[1];
        if (typeof opts_ === 'object') {
            Object.keys(opts_).forEach(function (key) {
                opts[key] = opts_[key];
            });
        }
    }
    if (opts.main && opts.main.match(/^\//) && !opts.filename) {
        opts.filename = opts.main;
    }
    
    var shim = 'shim' in opts ? opts.shim : true;
    var req = opts.require || [];
    if (!Array.isArray(req)) req = [req];
    
    var src = fs.readFileSync(__dirname + '/wrappers/prelude.js', 'utf8')
        + fs.readFileSync(__dirname + '/wrappers/node_compat.js', 'utf8')
        + (shim ? source.modules('es5-shim')['es5-shim'] : '')
        + builtins
        + (req.length
            ? exports.wrap(
                req, Hash.merge(opts, { base : undefined })
            ).source
            : ''
        )
    ;
    
    if (Array.isArray(opts.base)) {
        opts.base.forEach(function (base) {
            src += exports.wrapDir(base, Hash.merge(opts, { base : base }));
        });
    }
    else if (typeof opts.base === 'object') {
        Hash(opts.base).forEach(function (base, name) {
            src += exports.wrapDir(base, Hash.merge(opts, {
                base : base,
                name : name,
            }));
        });
    }
    else if (typeof opts.base === 'string') {
        src += exports.wrapDir(opts.base, opts);
    }
    else if (!opts.base && opts.main) {
        var opts_ = Hash.copy(opts);
        opts_.base = path.dirname(opts.main);
        src += exports.wrap('./' + path.basename(opts.main), opts).source;
    }
    
    if (opts.entry) {
        if (!Array.isArray(opts.entry)) {
            opts.entry = [ opts.entry ];
        }
        var entryBody = fs.readFileSync(
            __dirname + '/wrappers/entry.js', 'utf8'
        );
        
        opts.entry.forEach(function (entry) {
            fileWatch(entry, opts);
            src += entryBody
                .replace(/\$aliases/g, function () {
                    return JSON.stringify([]);
                })
                .replace(/\$__filename/g, function () {
                    return JSON.stringify('./' + path.basename(entry))
                })
                .replace(/\$__dirname/g, function () {
                    return JSON.stringify('.')
                })
                .replace('$body', function () {
                    return fs.readFileSync(entry, 'utf8')
                })
            ;
        });
    }
    
    return opts.filter ? opts.filter(src) : src;
};

var wrapperBody = fs.readFileSync(__dirname + '/wrappers/body.js', 'utf8');

var builtins = fs.readdirSync(__dirname + '/builtins')
    .filter(function (file) {
        return file.match(/\.js$/)
            && !path.basename(file).match(/^\./)
    })
    .map(function (file) {
        var f = __dirname + '/builtins/' + file;
        var src = fs.readFileSync(f, 'utf8').replace(/^#![^\n]*\n/, '');
        
        return wrapperBody
            .replace(/\$aliases/g, function () {
                return JSON.stringify([]);
            })
            .replace(/\$filename/g, function () {
                return JSON.stringify(file.replace(/\.js$/,''));
            })
            .replace(/\$__dirname/g, function () {
                return JSON.stringify(path.dirname(file));
            })
            .replace(/\$__filename/g, function () {
                return JSON.stringify(file);
            })
            .replace('$body', function () {
                return src;
            })
        ;
    })
    .join('\n')
;

exports.wrap = function (libname, opts) {
    if (!opts) opts = {};
    if (!opts.filename) opts.filename = libname;
    
    if (opts.base && !opts.base.match(/^\//)) {
        // relative path
        if (opts.name) {
            opts.base = path.dirname(require.resolve(opts.name))
                + '/' + opts.base;
        }
        else {
            opts.base = process.cwd() + '/' + opts.base;
        }
    }
    
    if (opts.main && !opts.main.match(/^\//)) {
        opts.main = opts.base + '/' + opts.main;
    }
    
    var aliases = [];
    if (opts.name && (
        opts.main === opts.filename
        || libname === opts.name
        || libname === '.'
    )) {
        aliases = opts.base
            ? [
                (opts.name + unext(opts.filename.slice(opts.base.length)))
                    .replace(/\/\.\//g, '/'),
                opts.name,
            ]
            : [ opts.name ]
        ;
    }
    
    if (Array.isArray(libname)) {
        var reqs = opts.required || [];
        
        var src = libname.map(function (name) {
            var lib = exports.wrap(name, { required : reqs });
            reqs.push(name);
            
            if (lib.dependencies.length) {
                var _deps = lib.dependencies.map(function (dep) {
                  try {
                    require.resolve(dep);
                    return dep;
                  } catch(e) {
                    return require.resolve(path.dirname(require.resolve(name)) + '/node_modules/' + dep)
                  }
                });
                var deps = exports.wrap(_deps, { required : reqs });
                reqs.push.apply(reqs, lib.dependencies);
                return lib.source + '\n' + deps.source;
            }
            else {
                return lib.source;
            }
        }).join('\n');
        
        return { source : src, dependencies : [] };
    }
    else if (opts.required && opts.required.indexOf(libname) >= 0) {
        return { source : '', dependencies : [] };
    }
    else if (libname.match(/^[.\/]/)) {
        var src = fs.readFileSync(opts.filename, 'utf8');
        var body = opts.filename.match(/\.coffee$/)
            ? coffee.compile(src) : src;
        
        var pkgname = ((opts.name ? opts.name + '/' : '') + libname)
            .replace(/\/\.\//g, '/')
            .replace(/\/\.$/, '')
        ;
        
        if (opts.pkgname) pkgname = opts.pkgname;
        var dirname = opts.name || '.';
        var filename = dirname + '/' + path.basename(opts.filename);
        
        return {
            source : wrapperBody
                .replace(/\$aliases/g, function () {
                    return JSON.stringify(aliases);
                })
                .replace(/\$__dirname/g, function () {
                    return JSON.stringify(dirname);
                })
                .replace(/\$__filename/g, function () {
                    return JSON.stringify(filename);
                })
                .replace(/\$filename/g, function () {
                    return JSON.stringify(pkgname);
                })
                .replace('$body', function () {
                    return body.replace(/^#![^\n]*\n/, '');
                })
            ,
            dependencies : [],
        };
    }
    else if (libname.match(/\//)) {
        var resolved = require.resolve(libname);
        var body = fs.readFileSync(resolved, 'utf8');
        
        var pkgname = ((opts.name ? opts.name + '/' : '') + libname)
            .replace(/\/\.\//g, '/')
            .replace(/\/\.$/, '')
        ;
        
        if (opts.pkgname) pkgname = opts.pkgname;
        
        var src = wrapperBody
            .replace(/\$aliases/g, function () {
                return JSON.stringify(aliases);
            })
            .replace(/\$__dirname/g, function () {
                return JSON.stringify(pkgname);
            })
            .replace(/\$__filename/g, function () {
                return JSON.stringify(
                    pkgname + '/' + path.basename(resolved)
                );
            })
            .replace(/\$filename/g, function () {
                return JSON.stringify(pkgname)
            })
            .replace('$body', function () {
                return body.replace(/^#![^\n]*\n/, '');
            })
        ;
        return { source : src, dependencies : [] };
    }
    else {
        var mods = source.modules(libname);
        var pkg = mods[libname + '/package.json'];
        
        if (pkg.browserify && pkg.browserify.main) {
            var main = (libname + '/' + pkg.browserify.main)
                .replace(/\/\.\//g, '/');
            var p = pkg.browserify;
            p.filename = require.resolve(main);
            p.name = p.name || libname;
            p.pkgname = p.pkgname || libname;
            
            if (p.base && !p.base.match(/^\//)) {
                p.base = (
                    path.dirname(require.resolve(libname + '/package.json'))
                    + '/' + p.base
                ).replace(/\/\.\//g, '/');
            }
            
            return {
                'package.json' : pkg,
                dependencies : pkg.browserify.require || [],
                source : p.base
                    ? exports.wrapDir(p.base, p)
                    : exports.wrap(main, p).source
                ,
            };
        }
        
        return {
            'package.json' : pkg,
            dependencies :
                typeof pkg.browserify === 'object'
                && (pkg.browserify.main || pkg.browserify.require)
                    ? pkg.browserify.require || []
                    : Object.keys(pkg.dependencies || {})
            ,
            source : Object.keys(mods)
                .filter(function (name) {
                    return !name.match(/\/package\.json$/)
                })
                .map(function (name) {
                    var src = mods[name].toString().replace(/^#![^\n]*\n/, '');
                    return wrapperBody
                        .replace(/\$aliases/g, function () {
                            return JSON.stringify(aliases);
                        })
                        .replace(/\$filename/g, function () {
                            return JSON.stringify(name)
                        })
                        .replace(/\$__filename/g, function () {
                            return JSON.stringify(libname + '/' + name)
                        })
                        .replace(/\$__dirname/g, function () {
                            return JSON.stringify(libname)
                        })
                        .replace('$body', function () {
                            return src;
                        })
                    ;
                })
                .join('\n')
            ,
        };
    }
};

var find = require('findit');
exports.wrapDir = function (base, opts) {
    if (!opts) opts = {};
    
    var pkg = path.existsSync(base + '/package.json')
        ? JSON.parse(fs.readFileSync(base + '/package.json', 'utf8'))
        : {}
    ;
    
    var main = opts.main || (pkg.browserify && pkg.browserify.main) || pkg.main;
    
    if (main && typeof pkg.browserify === 'object'
    && !pkg.browserify.base) {
        var files = [ base + '/' + main ];
    }
    else {
        var files = find.sync(base);
    }
    
    var packages = files
        .filter(function (f) {
            return path.basename(f) === 'package.json'
        })
        .reduce(function (acc, f) {
            acc[path.dirname(f)] = JSON.parse(fs.readFileSync(f, 'utf8'));
            return acc;
        }, {})
    ;
    
    function packageFor (file) {
        var parts = path.dirname(file).split('/');
        
        while (parts.length) {
            var ps = parts.join('/');
            parts.shift();
            
            if (packages[ps]) {
                var p = packages[ps].browserify || packages[ps] || {};
                if (!p.base) {
                    p.base = ps;
                }
                else if (p.base.match(/^\./)) {
                    p.base = (ps + p.base.slice(1)).replace(/\/\.\//g, '/');
                }
                
                if (p.main && p.main.match(/^\./)) {
                    p.main = (ps + p.main.slice(1)).replace(/\/\.\//g, '/');
                }
                return p;
            }
        }
        return pkg.browserify || pkg || {};
    }
    
    function paramFor (file, name) {
        return opts[name] || packageFor(file)[name] || pkg[name];
    }
    
    var depSrc = pkg.browserify && pkg.browserify.require
        ? exports.wrap(pkg.browserify.require).source : '';
    
    return depSrc + files
        .filter(function (file) {
            return file.match(/\.(?:js|coffee)$/)
                && !path.basename(file).match(/^\./)
        })
        .map(function (file) {
            fileWatch(file, opts);
            var libname = unext(file.slice(base.length + 1));
            if (!libname.match(/^\.\//)) libname = './' + libname;
            
            var pkgname = main && (
                unext(main) === unext(file) || unext(main) === libname
            ) ? '.' : libname;
            
            var p4 = packageFor(file);
            var p = Hash.merge({
                filename : file,
                main : paramFor(file, 'main') || main,
                base : paramFor(file, 'base') || base,
                name : opts.name || paramFor(file, 'name'),
            }, p4);
            
            if (opts.name && (p4 === pkg || p4 === packages[base])) {
                p.name = opts.name;
            }
            return exports.wrap(pkgname, p).source;
        })
        .join('\n')
    ;
};

function unext (s) {
    return s.replace(/\.(?:js|coffee)$/,'');
}

var watchedFiles = [];
function fileWatch (file, opts) {
    if (!opts.watch) return;
    
    var unwatch = function () { fs.unwatchFile(file) };
    
    if (opts.listen) opts.listen.on('close', unwatch);
    
    watchedFiles.push(file);
    var wopts = {
        persistent : opts.watch.hasOwnProperty('persistent')
            ? opts.watch.persistent
            : true
        ,
        interval : opts.watch.interval || 500,
    };
    
    fs.watchFile(file, wopts, function (curr, prev) {
        if (curr.mtime - prev.mtime == 0) return;
        watchedFiles.forEach(function(file, i) {
            fs.unwatchFile(file);
            delete watchedFiles[i];
        });
        
        if (opts.verbose) {
            console.log('File change detected, regenerating bundle');
        }
        
        if (opts.listen) {
            opts.listen.removeListener('close', unwatch);
            opts.listen.emit('change', file);
        }
    });
}

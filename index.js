var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;

var coffee = require('coffee-script');
var source = require('source');

exports = module.exports = function (opts) {
    var modified = new Date();
    var src = exports.bundle(opts);
    if (!opts.mount) opts.mount = '/browserify.js';
    
    return function (req, res, next) {
        if (req.url.split('?')[0] === opts.mount) {
            res.writeHead(200, {
                'Last-Modified' : modified.toString(),
                'Content-Type' : 'text/javascript',
            });
            res.end(src);
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
    
    var shim = 'shim' in opts ? opts.shim : true;
    var req = opts.require || [];
    if (!Array.isArray(req)) req = [req];
    
    return fs.readFileSync(__dirname + '/wrappers/prelude.js', 'utf8')
        + fs.readFileSync(__dirname + '/wrappers/node_compat.js', 'utf8')
        + (shim ? source.modules('es5-shim')['es5-shim'] : '')
        + builtins
        + (req.length ? exports.wrap(req, opts).source : '')
        + (opts.base ? exports.wrapDir(opts.base, opts) : '')
    ;
};

var wrapperBody = fs.readFileSync(__dirname + '/wrappers/body.js', 'utf8');

var builtins = fs.readdirSync(__dirname + '/builtins')
    .filter(function (file) {
        return file.match(/\.js$/)
            && !path.basename(file).match(/^\./)
    })
    .map(function (file) {
        var f = __dirname + '/builtins/' + file;
        return wrapperBody
            .replace('$body', function () {
                return fs.readFileSync(f, 'utf8');
            })
            .replace(/\$filename/g, function () {
                return JSON.stringify(file.replace(/\.js$/,''));
            })
        ;
    })
    .join('\n')
;

exports.wrap = function (libname, opts) {
    if (!opts) opts = {};
    if (!opts.filename) opts.filename = libname;
    
    if (Array.isArray(libname)) {
        var reqs = opts.required || [];
        
        var src = libname.map(function (name) {
            var lib = exports.wrap(name, { required : reqs });
            reqs.push(name);
            
            if (lib.dependencies.length) {
                var deps = exports.wrap(lib.dependencies, { required : reqs });
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
        
        return {
            source : wrapperBody
                .replace('$body', function () { return body })
                .replace(/\$filename/g, function () {
                    return JSON.stringify(pkgname);
                })
            ,
            dependencies : [],
        };
    }
    else if (libname.match(/\//)) {
        var body = fs.readFileSync(require.resolve(libname), 'utf8');
        var pkgname = ((opts.name ? opts.name + '/' : '') + libname)
            .replace(/\/\.\//g, '/')
            .replace(/\/\.$/, '')
        ;
        
        var src = wrapperBody
            .replace('$body', function () {
                return body
            })
            .replace(/\$filename/g, function () {
                return JSON.stringify(pkgname)
            })
        ;
        return { source : src, dependencies : [] };
    }
    else {
        var mods = source.modules(libname);
        var pkg = mods[libname + '/package.json'];
        
        return {
            'package.json' : pkg,
            dependencies : Object.keys(pkg.dependencies || {}),
            source : Object.keys(mods)
                .filter(function (name) {
                    return !name.match(/\/package\.json$/)
                })
                .map(function (name) {
                    return wrapperBody
                        .replace('$body', function () {
                            return mods[name].toString()
                        })
                        .replace(/\$filename/g, function () {
                            return JSON.stringify(name)
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
    
    if (Array.isArray(base)) {
        return base.map(function (file) {
            exports.wrapDir(file, opts)
        }).join('\n');
    }
    else {
        var pkg = path.existsSync(base + '/package.json')
            ? JSON.parse(fs.readFileSync(base + '/package.json', 'utf8'))
            : {}
        ;
        function params (key) {
            return opts[key]
                || (pkg.browserify && pkg.browserify[key])
                || pkg[key]
        }
        
        var main = params('main');
        
        if (main && typeof pkg.browserify === 'object'
        && !pkg.browserify.base) {
            var files = [ base + '/' + main ];
        }
        else {
            var files = find.sync(base);
        }
        
        return files
            .filter(function (file) {
                return file.match(/\.(?:js|coffee)$/)
                    && !path.basename(file).match(/^\./)
            })
            .map(function (file) {
                var libname = unext(file.slice(base.length + 1));
                if (!libname.match(/^\.\//)) libname = './' + libname;
                
                var pkgname = main && (
                    unext(main) === file || unext(main) === libname
                ) ? '.' : libname;
                
                return exports.wrap(pkgname, {
                    filename : file,
                    name : params('name'),
                }).source;
            })
            .join('\n')
        ;
    }
};

function unext (s) {
    return s.replace(/\.(?:js|coffee)$/,'');
}

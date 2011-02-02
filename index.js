var fs = require('fs');

exports = module.exports = function (opts) {
    if (typeof opts === 'string') {
        opts = { base : opts };
    }
    
    if (!opts.mount) opts.mount = '/browserify.js';
    if (!opts.base) throw new Error('"base" option not specified');
    
    var src = wrappers.prelude
        + getScriptsSync(opts.base)
            .map(wrapScript.bind({}, opts.base))
            .join('\n')
    ;
    
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

exports.wrapScript = wrapScript;
function wrapScript (base, filename) {
    var src = fs.readFileSync(filename, 'utf8');
    
    var bs = base.split('/');
    var rs = filename.split('/');
    for (var i = 0; i < bs.length && i < rs.length && bs[i] === rs[i]; i++);
    var rel = './' + rs.slice(i).join('/').replace(/^\.(?:\/|$)/,'');
    
    return wrappers.body
        .replace('$body', src)
        .replace(/\$filename/g, JSON.stringify(rel))
    ;
}

exports.getScriptsSync = getScriptsSync;
function getScriptsSync (dir) {
    return fs.readdirSync(dir)
        .reduce(function (files, file) {
            var p = dir + '/' + file;
            var stat = fs.statSync(p);
            
            if (stat.isDirectory()) {
                files.push.apply(files, getScriptsSync(p));
            }
            else if (file.match(/\.js/)) {
                files.push(p);
            }
            
            return files;
        }, [])
    ;
}

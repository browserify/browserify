var fs = require('fs');

var watchedFiles = [];
module.exports = function (file, opts) {
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
        
        opts.listen.removeListener('close', unwatch);
        opts.listen.emit('change', file);
    });
}

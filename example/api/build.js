// When browserify is installed from npm, this is just require('browserify').
// The relative path is so that this example runs from a clone of the repo.
var browserify = require('../../');
var b = browserify();
b.add(__dirname + '/browser/main.js');
b.bundle().pipe(process.stdout);

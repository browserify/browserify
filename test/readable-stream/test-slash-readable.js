var Readable = require('readable-stream/readable');
var TestStream = require('./stream')(Readable);
ex(new TestStream());

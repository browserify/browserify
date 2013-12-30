var Readable = require('readable-stream').Readable;
var TestStream = require('./stream')(Readable);
ex(new TestStream());

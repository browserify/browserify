var util = require('util');

module.exports = function (Readable) {

  function TestStream () {
    Readable.call(this);
    this.idx = 0;
    this.setEncoding('utf8');
  }

  util.inherits(TestStream, Readable);

  TestStream.prototype._read = function () {
    this.push(this.idx < 10 ? String(this.idx++) : null, 'utf8');
  }

  return TestStream;
}
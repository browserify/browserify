// Buffer is a Node.js global, so expose it here outside of the modules
if (!this.Buffer) {
  Buffer = require('buffer').Buffer;
}

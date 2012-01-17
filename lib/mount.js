// Helper functions to update the mount name based on the digest,
// and to parse it back out.
var create = exports.create = function (name, digest) {
  return name.replace(/\.js$/, '-' + digest + '.js');
};

// Return true if match, false if not match
var equals = exports.equals = function (mount, created) {
  return mount === created;
};

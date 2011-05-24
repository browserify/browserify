module.exports = function () {
    assert.ok(require.modules['./x.js'] || require.modules['./x']);
    assert.ok(require.modules['./inner.js'] || require.modules['./inner']);
};

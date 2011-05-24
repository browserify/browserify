module.exports = function (assert) {
    assert.ok(require.modules['./x.js'] || require.modules['./x']);
    assert.ok(require.modules['./inner.js'] || require.modules['./inner']);
    
    return 555;
};

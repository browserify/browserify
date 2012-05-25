module.exports = {
    isatty: isatty,
    getWindowSize: getWindowSize
}

function isatty() {
    return true
}

function getWindowSize() {
    return [window.innerHeight, window.innerWidth];
}
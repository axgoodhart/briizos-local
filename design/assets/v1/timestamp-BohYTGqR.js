function e(e) {
    return new Date(t(e))
}

function t(e) {
    return Number(e.seconds) * 1e3 + Math.round(e.nanos / 1e6)
}
export {
    e as t
};
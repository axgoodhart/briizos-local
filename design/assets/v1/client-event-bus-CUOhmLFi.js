var e = new Set;

function t(t) {
    return e.add(t), () => e.delete(t)
}

function n(t) {
    e.size !== 0 && queueMicrotask(() => {
        for (let n of e) try {
            n(t)
        } catch {}
    })
}
export {
    t as n, n as t
};
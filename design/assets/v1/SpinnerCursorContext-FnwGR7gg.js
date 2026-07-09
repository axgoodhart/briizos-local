import {
    o as e
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    t
} from "./react-BthIFXYf.js";
var n = e(t(), 1),
    r = {
        progress: 0,
        crosshair: 0
    },
    i = {},
    a = {
        progress: `* { cursor: progress !important; }`,
        crosshair: `* { cursor: crosshair !important; }`
    },
    o = [`crosshair`, `progress`];

function s(e) {
    let t = i[e];
    return t || (t = document.createElement(`style`), t.setAttribute(`data-alt-cursor`, e), t.textContent = a[e], i[e] = t), t
}

function c() {
    for (let e of o) i[e] ? .remove();
    for (let e of o) r[e] > 0 && document.head.appendChild(s(e))
}

function l(e, t) {
    (0, n.useEffect)(() => {
        if (t) return r[e]++, c(), () => {
            r[e]--, c()
        }
    }, [e, t])
}

function u(e) {
    l(`progress`, e)
}
async function d(e) {
    r.progress++, c(), await new Promise(e => requestAnimationFrame(() => requestAnimationFrame(() => e())));
    try {
        return await e()
    } finally {
        r.progress--, c()
    }
}
export {
    u as n, d as r, l as t
};
import {
    o as e,
    r as t
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    a as n,
    i as r
} from "./client-lite-BraEm36W.js";
import {
    t as i
} from "./react-BthIFXYf.js";
import {
    r as a,
    t as o
} from "./connect-lite-vzd2EiZc.js";
import {
    r as s,
    x as c
} from "./client-BkAIwXnN.js";
import {
    t as l
} from "./timestamp-BohYTGqR.js";
var u = t({
        invalidateUserSettings: () => F,
        readUserSettings: () => N,
        rehydrateUserSettings: () => I,
        useSubmitOnEnter: () => z,
        useUserSettings: () => R,
        writeUserSettings: () => P
    }),
    d = e(i(), 1),
    f = `omelette-user-settings-cache`,
    p = `omelette-user-settings`,
    m = {
        enterForNewline: !1,
        autoFallbackOnRefusal: !0,
        agentDesignProjectsAt: null,
        agentOrgDirectoryAt: null
    };

function h(e) {
    return { ...m,
        ...e
    }
}
var g = m,
    _ = !1,
    v = null,
    y = 0,
    b = new Set,
    x = {};

function S() {
    for (let e of b) e()
}

function C(e) {
    let t = {};
    typeof e.enterForNewline == `boolean` && (t.enterForNewline = e.enterForNewline), typeof e.autoFallbackOnRefusal == `boolean` && (t.autoFallbackOnRefusal = e.autoFallbackOnRefusal);
    let n = e => e === null ? null : e instanceof Date ? e : typeof e == `string` && e ? new Date(e) : null;
    return `agentDesignProjectsAt` in e && (t.agentDesignProjectsAt = n(e.agentDesignProjectsAt)), `agentOrgDirectoryAt` in e && (t.agentOrgDirectoryAt = n(e.agentOrgDirectoryAt)), t
}

function w() {
    try {
        let e = n(),
            t = r();
        if (!e || !t) return !0;
        let i = E(),
            a = i === null ? { ...g
            } : { ...h(i),
                ...x
            };
        return localStorage.setItem(f, JSON.stringify({
            v: 1,
            orgUuid: e,
            accountUuid: t,
            settings: a
        })), x = {}, localStorage.removeItem(p), !0
    } catch {
        return !1
    }
}

function T() {
    try {
        let e = r();
        if (!e) return null;
        let t = localStorage.getItem(f);
        if (!t) return null;
        let n = JSON.parse(t);
        return n.v === 1 && n.accountUuid === e && n.settings ? C(n.settings) : null
    } catch {
        return null
    }
}

function E() {
    let e = T();
    if (e !== null) return e;
    try {
        if (!r() || localStorage.getItem(f)) return null;
        let e = localStorage.getItem(p);
        return e ? C(JSON.parse(e)) : null
    } catch {
        return null
    }
}

function D() {
    let e = E();
    e !== null && (g = { ...h(e),
        ...x
    })
}
async function O() {
    try {
        return await s().getUserSettings ? .({}) ? ? null
    } catch (e) {
        if (a(e) && e.code === o.Unimplemented) return null;
        throw e
    }
}
async function k(e) {
    let t = {};
    if (`agentDesignProjectsAt` in e && (t.agentDesignProjects = e.agentDesignProjectsAt !== null), `agentOrgDirectoryAt` in e && (t.agentOrgDirectory = e.agentOrgDirectoryAt !== null), Object.keys(t).length === 0) return !1;
    try {
        return await s().updateUserSettings ? .(t), !0
    } catch (e) {
        if (a(e) && e.code === o.Unimplemented) return !1;
        throw e
    }
}

function A() {
    if (_) return Promise.resolve();
    if (v) return v;
    let e = y;
    return v = O().then(t => {
        if (e === y) {
            if (D(), t !== null) {
                let e = {
                    agentDesignProjectsAt: t.agentDesignProjectsAt ? l(t.agentDesignProjectsAt) : null,
                    agentOrgDirectoryAt: t.agentOrgDirectoryAt ? l(t.agentOrgDirectoryAt) : null
                };
                Object.assign(x, e), g = { ...g,
                    ...e
                }, w()
            }
            _ = !0, S()
        }
    }).catch(() => {}).finally(() => {
        e === y && (v = null)
    }), v
}

function j(e) {
    return b.add(e), A(), () => {
        b.delete(e)
    }
}

function M() {
    return g
}

function N() {
    return g
}

function P(e) {
    D();
    let t = g;
    Object.assign(x, e), g = { ...t,
        ...e
    };
    let n = w();
    if (S(), !(`agentDesignProjectsAt` in e || `agentOrgDirectoryAt` in e)) return n;
    y++;
    let r = y;
    return k(e).then(t => {
        if (r === y) {
            if (!t) {
                v = null, _ || A();
                return
            }
            y++, Object.assign(x, e), g = { ...g,
                ...e
            }, _ = !0, w(), S()
        }
    }, () => {
        if (r !== y) return;
        let n = Object.fromEntries(Object.keys(e).map(e => [e, t[e]]));
        g = { ...g,
            ...n
        }, Object.assign(x, n), v = null, w(), S(), _ || A()
    }), n
}

function F() {
    y++, g = m, x = {}, _ = !1, v = null, S(), A()
}

function I() {
    D(), w(), S()
}
var L = e => {
    let t = typeof e == `function` ? e(g) : e,
        n = {};
    for (let e of Object.keys(m)) {
        let r = t[e];
        r !== void 0 && r !== g[e] && (n[e] = r)
    }
    Object.keys(n).length > 0 && P(n)
};

function R() {
    return [(0, d.useSyncExternalStore)(j, M), L]
}

function z() {
    let [e] = R();
    return !c && !e.enterForNewline
}
try {
    let e = r(),
        t = T();
    if (t !== null) g = h(t);
    else if (e && localStorage.getItem(f)) localStorage.removeItem(f);
    else if (e && n()) {
        let e = localStorage.getItem(p);
        if (e) try {
            g = h(C(JSON.parse(e))), w() && localStorage.removeItem(p)
        } catch {
            localStorage.removeItem(p)
        }
    }
} catch {}
typeof window < `u` && window.addEventListener(`storage`, e => {
    e.key === f && (D(), S())
});
export {
    P as a, u as i, z as n, R as r, N as t
};
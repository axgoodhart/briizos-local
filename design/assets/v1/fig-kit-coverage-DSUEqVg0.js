const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/v1/babel-standalone-cyL-SWky.js", "assets/v1/preload-helper-7XptfjGJ.js"]))) => i.map(i => d[i]);
import {
    o as e,
    r as t
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    t as n
} from "./preload-helper-7XptfjGJ.js";
import {
    d as r
} from "./client-lite-BraEm36W.js";
import {
    t as i
} from "./react-BthIFXYf.js";
import {
    Qt as a,
    Xt as o,
    Yt as s,
    cn as c,
    ht as l,
    in as u,
    ln as d,
    pn as f,
    tn as p
} from "./index-DxZs6uan.js";
import {
    r as m
} from "./client-BkAIwXnN.js";
var h = class extends f {#
        e;#
        t = void 0;#
        n;#
        r;
        constructor(e, t) {
            super(), this.#e = e, this.setOptions(t), this.bindMethods(), this.#i()
        }
        bindMethods() {
            this.mutate = this.mutate.bind(this), this.reset = this.reset.bind(this)
        }
        setOptions(e) {
            let t = this.options;
            this.options = this.#e.defaultMutationOptions(e), c(this.options, t) || this.#e.getMutationCache().notify({
                type: `observerOptionsUpdated`,
                mutation: this.#n,
                observer: this
            }), t ? .mutationKey && this.options.mutationKey && p(t.mutationKey) !== p(this.options.mutationKey) ? this.reset() : this.#n ? .state.status === `pending` && this.#n.setOptions(this.options)
        }
        onUnsubscribe() {
            this.hasListeners() || this.#n ? .removeObserver(this)
        }
        onMutationUpdate(e) {
            this.#i(), this.#a(e)
        }
        getCurrentResult() {
            return this.#t
        }
        reset() {
            this.#n ? .removeObserver(this), this.#n = void 0, this.#i(), this.#a()
        }
        mutate(e, t) {
            return this.#r = t, this.#n ? .removeObserver(this), this.#n = this.#e.getMutationCache().build(this.#e, this.options), this.#n.addObserver(this), this.#n.execute(e)
        }#
        i() {
            let e = this.#n ? .state ? ? o();
            this.#t = { ...e,
                isPending: e.status === `pending`,
                isSuccess: e.status === `success`,
                isError: e.status === `error`,
                isIdle: e.status === `idle`,
                mutate: this.mutate,
                reset: this.reset
            }
        }#
        a(e) {
            a.batch(() => {
                if (this.#r && this.hasListeners()) {
                    let t = this.#t.variables,
                        n = this.#t.context,
                        r = {
                            client: this.#e,
                            meta: this.options.meta,
                            mutationKey: this.options.mutationKey
                        };
                    if (e ? .type === `success`) {
                        try {
                            this.#r.onSuccess ? .(e.data, t, n, r)
                        } catch (e) {
                            Promise.reject(e)
                        }
                        try {
                            this.#r.onSettled ? .(e.data, null, t, n, r)
                        } catch (e) {
                            Promise.reject(e)
                        }
                    } else if (e ? .type === `error`) {
                        try {
                            this.#r.onError ? .(e.error, t, n, r)
                        } catch (e) {
                            Promise.reject(e)
                        }
                        try {
                            this.#r.onSettled ? .(void 0, e.error, t, n, r)
                        } catch (e) {
                            Promise.reject(e)
                        }
                    }
                }
                this.listeners.forEach(e => {
                    e(this.#t)
                })
            })
        }
    },
    g = e(i(), 1);

function _(e, t) {
    let n = s(t),
        [r] = g.useState(() => new h(n, e));
    g.useEffect(() => {
        r.setOptions(e)
    }, [r, e]);
    let i = g.useSyncExternalStore(g.useCallback(e => r.subscribe(a.batchCalls(e)), [r]), () => r.getCurrentResult(), () => r.getCurrentResult()),
        o = g.useCallback((e, t) => {
            r.mutate(e, t).catch(u)
        }, [r]);
    if (i.error && d(r.options.throwOnError, [i.error])) throw i.error;
    return { ...i,
        mutate: o,
        mutateAsync: i.mutate
    }
}

function v() {
    let e = `https://claude.ai`;
    if (typeof window > `u`) return e;
    let t = window.location.hostname;
    return t === `claude.ai` ? e : t.endsWith(`.claude.ai`) ? window.location.origin : e
}

function y(e) {
    let t = new URLSearchParams;
    e ? .connector && t.set(`connector`, e.connector), e ? .directory && t.set(`directory`, `true`);
    let n = t.toString();
    return `${v()}/customize/connectors${n?`?${n}`:``}`
}

function b(e) {
    return `${v()}/directory/connectors/${encodeURIComponent(e)}`
}

function ee(e) {
    return `${v()}${e?`/settings/usage`:`/admin-settings/usage`}`
}
var te = `https://support.claude.com/en/articles/14604416-get-started-with-claude-design`;

function x(e) {
    return e instanceof Error ? e.message : String(e)
}

function S(e) {
    return !(typeof e != `string` || e.length === 0 || e.length > 512 || e.startsWith(`/`) || e.startsWith(`_ds/`) || /(?:^|\/)\.\.(?:\/|$)/.test(e) || /[`<>\r\n:\\\x00-\x1f\u2028\u2029\u0085]/.test(e))
}

function C(e, t) {
    return typeof e == `string` ? e.replace(/[`<>\u0000-\u001f\u007f\u0085\u2028\u2029]/g, ``).slice(0, t) : ``
}

function w(e) {
    return String(e ? ? ``).replace(/&/g, `&amp;`).replace(/</g, `&lt;`).replace(/>/g, `&gt;`)
}

function ne(e) {
    return typeof e == `string` && /^--[\w-]+$/.test(e) && e.length <= 128
}

function re(e) {
    return typeof e != `string` || e.length === 0 || e.length > 128 || /[;{}\\<>\r\n\x00-\x1f]/.test(e) || /url\s*\(|image-set\s*\(/i.test(e) ? !1 : /^#[0-9a-f]{3,8}$/i.test(e) || /^(?:rgb|rgba|hsl|hsla|oklch|lch|lab|color)\([\w\s.,%/+-]*\)$/i.test(e) || /^var\(\s*--[\w-]+\s*\)$/.test(e) || /^[a-z]+$/i.test(e)
}

function ie(e) {
    return typeof e == `string` && /^[A-Za-z0-9 _-]{1,64}$/.test(e)
}

function ae(e) {
    if (typeof e != `string`) return;
    let t = e.trim().toLowerCase();
    return t === `normal` ? `400` : t === `bold` ? `700` : /^\d{1,4}( \d{1,4})?$/.test(t) ? t : void 0
}

function oe(e) {
    return e === `normal` || e === `italic` || e === `oblique`
}

function se(e) {
    return typeof e == `string` && e.length <= 2048 && /^U\+[0-9A-F?]{1,6}(-[0-9A-F]{1,6})?(,\s*U\+[0-9A-F?]{1,6}(-[0-9A-F]{1,6})?)*$/i.test(e)
}

function ce(e) {
    let t = [],
        n = new Set;
    for (let r of Array.isArray(e) ? e : []) {
        let e = r;
        if (!e || typeof e != `object` || typeof e.name != `string` || !S(e.folder) || !/^templates\/(?!\.\.?$)[^/]+$/.test(e.folder) || !S(e.entryPath) || !e.entryPath.startsWith(`${e.folder}/`) || e.entryPath.length <= e.folder.length + 1 || /\/\/|\/\.?$/.test(e.entryPath)) continue;
        let i = C(e.name, 100);
        if (!(!i || n.has(i)) && (n.add(i), t.push({
                name: i,
                folder: e.folder,
                entryPath: e.entryPath,
                description: C(e.description, 200)
            }), t.length >= 512)) break
    }
    return t
}

function le(e) {
    let t = [],
        n = new Set;
    for (let r of Array.isArray(e) ? e : []) {
        let e = r;
        if (!e || typeof e != `object` || !S(e.sourcePath)) continue;
        let i = C(e.name, 100);
        if (!(!i || n.has(i)) && (n.add(i), t.push({
                name: i,
                sourcePath: e.sourcePath
            }), t.length >= 512)) break
    }
    return t
}
var ue = RegExp(`[<>\r
\u2028\u2029]`, `g`);

function de(e) {
    return String(e ? ? ``).replace(ue, `?`)
}

function fe(e) {
    return de(e).replace(/"/g, `?`)
}
var T = {
        all: e => [`project`, e],
        files: e => [`project`, e, `files`],
        fileTree: e => [`project`, e, `files`, `tree`],
        dir: (e, t) => [`project`, e, `files`, `dir`, t],
        comments: e => [`project`, e, `comments`],
        members: e => [`project`, e, `members`],
        meta: e => [`project`, e, `meta`],
        presence: e => [`project`, e, `presence`],
        fileBaselines: e => [`project`, e, `fileBaselines`]
    },
    pe = 6e4,
    me = 6e4,
    he = class {
        seen = new Map;
        gcTimer = null;
        remember(e) {
            let t = Date.now();
            for (let n of e) this.seen.set(`${n.path}:${n.version}`, t);
            this.ensureGC()
        }
        isMine(e) {
            let t = `${e.rowId}:${e.version}`;
            return this.seen.has(t) ? (this.seen.delete(t), !0) : !1
        }
        ensureGC() {
            this.gcTimer || = setInterval(() => {
                let e = Date.now() - me;
                for (let [t, n] of this.seen) n < e && this.seen.delete(t);
                this.seen.size === 0 && this.gcTimer && (clearInterval(this.gcTimer), this.gcTimer = null)
            }, pe)
        }
        dispose() {
            this.gcTimer && = (clearInterval(this.gcTimer), null), this.seen.clear()
        }
    },
    E = new Map;

function ge(e) {
    let t = E.get(e);
    return t || (t = new he, E.set(e, t)), t
}

function _e(e) {
    let t = E.get(e);
    t && (E.delete(e), t.dispose())
}

function ve(e, t, n) {
    if (t === n) return {
        merged: t,
        conflicted: !1
    };
    if (t === e) return {
        merged: n,
        conflicted: !1
    };
    if (n === e) return {
        merged: t,
        conflicted: !1
    };
    if (e !== `` && (t === `` || n === ``)) return {
        merged: null,
        conflicted: !0
    };
    let r = e.split(`
`),
        i = t.split(`
`),
        a = n.split(`
`),
        o = xe(r, i),
        s = xe(r, a);
    if (o === null || s === null) return {
        merged: null,
        conflicted: !0
    };
    let c = [...o.map(e => ({ ...e,
            side: `a`
        })), ...s.map(e => ({ ...e,
            side: `b`
        }))].sort((e, t) => e.oStart - t.oStart || e.oLen - t.oLen),
        l = [],
        u = 0,
        d = 0;
    for (; d < c.length;) {
        let e = c[d],
            t = e.oStart,
            n = e.oStart + e.oLen,
            o = [e];
        for (d++; d < c.length && ye(c[d], t, n);) {
            let e = c[d];
            n = Math.max(n, e.oStart + e.oLen), o.push(e), d++
        }
        l.push(...r.slice(u, t));
        let s = r.slice(t, n),
            f = be(o.filter(e => e.side === `a`), i, r, t, n),
            p = be(o.filter(e => e.side === `b`), a, r, t, n);
        if (D(f, p)) l.push(...f);
        else if (D(s, f)) l.push(...p);
        else if (D(s, p)) l.push(...f);
        else return {
            merged: null,
            conflicted: !0
        };
        u = n
    }
    return l.push(...r.slice(u)), {
        merged: l.join(`
`),
        conflicted: !1
    }
}

function ye(e, t, n) {
    let r = e.oStart + e.oLen;
    return t === n ? e.oLen === 0 && e.oStart === t : e.oLen === 0 ? t < e.oStart && e.oStart < n : Math.max(t, e.oStart) < Math.min(n, r)
}

function be(e, t, n, r, i) {
    if (e.length === 0) return n.slice(r, i);
    let a = [],
        o = r;
    for (let r of e) a.push(...n.slice(o, r.oStart)), a.push(...t.slice(r.sideStart, r.sideStart + r.sideLen)), o = r.oStart + r.oLen;
    return a.push(...n.slice(o, i)), a
}

function xe(e, t) {
    let n = Se(e, t);
    if (n === null) return null;
    let r = [],
        i = 0,
        a = 0;
    for (let [e, t] of n)(e > i || t > a) && r.push({
        oStart: i,
        oLen: e - i,
        sideStart: a,
        sideLen: t - a
    }), i = e + 1, a = t + 1;
    return (i < e.length || a < t.length) && r.push({
        oStart: i,
        oLen: e.length - i,
        sideStart: a,
        sideLen: t.length - a
    }), r
}

function Se(e, t) {
    let n = 0;
    for (; n < e.length && n < t.length && e[n] === t[n];) n++;
    let r = e.length,
        i = t.length;
    for (; r > n && i > n && e[r - 1] === t[i - 1];) r--, i--;
    let a = r - n,
        o = i - n;
    if (a * o > 4e6) return null;
    let s = [];
    for (let e = 0; e < n; e++) s.push([e, e]);
    if (a > 0 && o > 0) {
        let r = o + 1,
            i = new Int32Array((a + 1) * r);
        for (let s = a - 1; s >= 0; s--) {
            let a = e[n + s];
            for (let e = o - 1; e >= 0; e--) a === t[n + e] ? i[s * r + e] = i[(s + 1) * r + e + 1] + 1 : i[s * r + e] = Math.max(i[(s + 1) * r + e], i[s * r + e + 1])
        }
        let c = 0,
            l = 0;
        for (; c < a && l < o;) e[n + c] === t[n + l] ? (s.push([n + c, n + l]), c++, l++) : i[(c + 1) * r + l] >= i[c * r + l + 1] ? c++ : l++
    }
    for (let t = 0; t < e.length - r; t++) s.push([r + t, i + t]);
    return s
}

function D(e, t) {
    if (e.length !== t.length) return !1;
    for (let n = 0; n < e.length; n++)
        if (e[n] !== t[n]) return !1;
    return !0
}

function O(e, t) {
    e && typeof e == `object` && (e.occMergeBail = t)
}

function Ce(e, t, n) {
    return e.getQueryData(T.fileBaselines(t)) ? .[n]
}

function we(e, t, n, r, i) {
    e.setQueryData(T.fileBaselines(t), e => ({ ...e ? ? {},
        [n] : {
            occToken: r,
            content: i
        }
    }))
}

function Te(e, t, n) {
    let r = {};
    for (let e of n) e.path && e.version !== void 0 && (r[e.path] = {
        occToken: e.version,
        content: e.content
    });
    Object.keys(r).length !== 0 && e.setQueryData(T.fileBaselines(t), e => {
        let t = e ? ? {},
            n = !1,
            i = { ...t
            };
        for (let [e, a] of Object.entries(r)) {
            let r = t[e];
            if (r === void 0) {
                i[e] = a, n = !0;
                continue
            }
            a.content !== void 0 && r.content === void 0 && r.occToken === a.occToken && (i[e] = {
                occToken: r.occToken,
                content: a.content
            }, n = !0)
        }
        return n ? i : t
    })
}

function Ee(e, t, n, r, i) {
    e.setQueryData(T.fileBaselines(t), e => {
        let t = e ? ? {},
            a = t[n];
        return a === void 0 || r > a.occToken ? { ...t,
            [n]: {
                occToken: r,
                content: i
            }
        } : r === a.occToken && a.content === void 0 ? { ...t,
            [n]: {
                occToken: a.occToken,
                content: i
            }
        } : t
    })
}

function De(e, t, n) {
    let r = n.endsWith(`/`) ? n : n + `/`;
    e.setQueryData(T.fileBaselines(t), e => {
        if (!e) return e;
        let t = !1,
            i = {};
        for (let a of Object.keys(e)) {
            if (a === n || a.startsWith(r)) {
                t = !0;
                continue
            }
            i[a] = e[a]
        }
        return t ? i : e
    })
}
var k = new Map;

function Oe(e, t) {
    let n = (k.get(e) ? ? Promise.resolve()).then(t, t),
        r = n.then(() => void 0, () => void 0);
    return k.set(e, r), r.finally(() => {
        k.get(e) === r && k.delete(e)
    }), n
}

function ke(e, t) {
    let n = s(),
        r = ge(e);
    return _({
        mutationFn: r => Oe(`${e}:${r.path}`, () => Ne(n, e, r, t)),
        onMutate: async () => {
            await n.cancelQueries({
                queryKey: T.files(e)
            })
        },
        onSuccess: i => {
            r.remember(i.files), n.invalidateQueries({
                queryKey: T.files(e)
            }, {
                cancelRefetch: !1
            });
            for (let e of i.files) t.onWritten ? .(e.path)
        },
        onError: r => {
            let i = Fe(r);
            if (i) {
                n.invalidateQueries({
                    queryKey: T.files(e)
                }, {
                    cancelRefetch: !1
                }), t.onConflict ? .(Math.max(i.length, 1));
                let a = r ? .occMergeBail ? ? `no-detail`;
                t.onConflictDetail ? .({
                    paths: i.map(e => e.path).filter(Boolean),
                    reason: a
                });
                return
            }
        }
    })
}
var Ae = new TextDecoder;

function je(e, t) {
    return {
        path: e.path,
        ...t === void 0 ? {} : {
            expectedVersion: t
        },
        op: {
            case: `write`,
            value: {
                data: e.data,
                encoding: e.encoding === `base64` ? `base64` : ``
            }
        }
    }
}

function Me(e) {
    return e.results && e.results.length > 0 ? e.results.map(e => ({
        path: e.path,
        version: e.version
    })) : e.files
}
async function Ne(e, t, n, r) {
    let i = n.baseline ? ? Ce(e, t, n.path),
        a, o = n.encoding === `base64` ? void 0 : n.data;
    try {
        a = await r.client.writeFiles({
            projectId: t,
            mutations: [je(n, i ? .occToken)]
        })
    } catch (e) {
        let s = await Pe(t, n, r, i, e);
        a = s.resp, o = s.content
    }
    let s = Me(a);
    for (let n of s) we(e, t, n.path, n.version, o);
    return { ...a,
        files: s
    }
}
async function Pe(e, t, n, r, i) {
    let a = Fe(i);
    if (!a) throw i;
    if (a.length === 0) throw O(i, `no-detail`), i;
    if (t.encoding === `base64`) throw O(i, `binary-patch`), i;
    if (r ? .content === void 0) throw O(i, `no-ancestor`), i;
    let o = await n.client.getFile({
        projectId: e,
        path: t.path,
        raw: !0
    });
    if (o.isBase64) throw O(i, `binary-server`), i;
    let s = Ae.decode(o.content),
        c = ve(r.content, t.data, s);
    if (c.conflicted || c.merged === null) throw O(i, `diff3-conflict`), i;
    let l = a.find(e => e.path === t.path) ? ? a[0],
        u;
    try {
        u = await n.client.writeFiles({
            projectId: e,
            mutations: [je({
                path: t.path,
                data: c.merged
            }, o.version ? ? l.currentVersion)]
        })
    } catch (e) {
        throw O(e, `retry-409`), e
    }
    return n.onMerged ? .(1), {
        resp: u,
        content: c.merged
    }
}

function Fe(e) {
    if (!e || typeof e != `object` || e.code !== 10) return null;
    let t = e.details;
    if (!Array.isArray(t)) return null;
    for (let e of t) {
        let t = (e ? .debug ? ? e) ? .conflicts;
        if (Array.isArray(t) && t.length > 0) return t.map(e => {
            let t = e.path;
            return {
                path: typeof t == `string` ? t : ``,
                currentVersion: Ie(e.currentVersion)
            }
        })
    }
    return []
}

function Ie(e) {
    if (typeof e == `bigint`) return e;
    if (typeof e == `number`) return BigInt(Math.trunc(e));
    if (typeof e == `string`) try {
        return BigInt(e)
    } catch {
        return 0 n
    }
    return 0 n
}
var Le = 3e3,
    Re = 3e4,
    ze = 1e3;

function Be(e) {
    return Math.round(e * (.5 + Math.random()))
}

function Ve(e) {
    return e instanceof Error && e.name === `AbortError`
}
var He = class {
        timer = null;
        pending = null;
        sleep(e) {
            return new Promise(t => {
                this.pending = t, this.timer = setTimeout(() => {
                    this.timer = null, this.pending = null, t()
                }, e)
            })
        }
        cancel() {
            this.timer !== null && (clearTimeout(this.timer), this.timer = null);
            let e = this.pending;
            this.pending = null, e ? .()
        }
    },
    Ue = 35 * 6e4,
    We = class {
        entries = new Map;
        snapshot = {
            streamIds: []
        };
        listeners = new Set;
        ttlMs;
        constructor(e = Ue) {
            this.ttlMs = e
        }
        add(e) {
            e && (this.entries.set(e, {
                streamId: e,
                observedAt: Date.now()
            }), this.rebuild())
        }
        remove(e) {
            this.entries.delete(e) && this.rebuild()
        }
        clear() {
            this.entries.size !== 0 && (this.entries.clear(), this.rebuild())
        }
        subscribe(e) {
            return this.listeners.add(e), () => {
                this.listeners.delete(e)
            }
        }
        getSnapshot() {
            let e = Date.now() - this.ttlMs,
                t = !1;
            for (let [n, r] of this.entries) r.observedAt < e && (this.entries.delete(n), t = !0);
            return t && this.rebuild(), this.snapshot
        }
        rebuild() {
            this.snapshot = {
                streamIds: [...this.entries.keys()]
            };
            for (let e of this.listeners) e()
        }
    },
    Ge = new Map;

function Ke(e) {
    let t = Ge.get(e);
    return t || (t = new We, Ge.set(e, t)), t
}

function qe(e) {
    Ge.delete(e)
}
var Je = {
    cancelRefetch: !1
};

function Ye(e, t, n) {
    let r = new Map;
    for (let i of n) Xe(e, t, i, r);
    for (let t of r.values()) e.invalidateQueries({
        queryKey: t
    }, Je)
}

function Xe(e, t, n, r) {
    let i = e => r.set(JSON.stringify(e), e);
    switch (n.table) {
        case `files`:
            if (n.rowId) {
                n.op === `delete` && (De(e, t, n.rowId), i(T.dir(t, n.rowId)));
                let r = A(n.rowId);
                for (; i(T.dir(t, r)), r !== ``;) r = A(r);
                i(T.fileTree(t))
            } else i(T.files(t));
            break;
        case `comments`:
            i(T.comments(t));
            break;
        case `project`:
            i(T.all(t));
            break;
        case `file_stream`:
            n.op === `create` ? Ke(t).add(n.rowId) : Ke(t).remove(n.rowId);
            break;
        case `presence`:
            i(T.presence(t));
            break;
        default:
            i(T.all(t))
    }
}

function A(e) {
    let t = e.lastIndexOf(`/`);
    return t <= 0 ? `` : e.slice(0, t)
}
var Ze = e => e.endsWith(`.prompt.md`);

function j(e) {
    return e.filter(Ze).sort()
}
var Qe = e => e.slice(e.lastIndexOf(`/`) + 1);

function $e(e) {
    let t = Qe(e);
    if (t.toLowerCase().endsWith(`.card.html`)) return t.slice(0, -10);
    let n = t.lastIndexOf(`.`);
    return n === -1 ? t : t.slice(0, n)
}
var et = e => Qe(e).slice(0, -10);

function tt(e, t) {
    let n = j(e),
        r = new Set,
        i = new Map,
        a = new Map;
    for (let e of n) {
        let t = A(e),
            n = a.get(t);
        n || a.set(t, n = []), n.push(e)
    }
    let o = new Map;
    for (let e of t) {
        let t = A(e.path);
        o.set(t, (o.get(t) ? ? 0) + 1)
    }
    let s = (e, t) => {
        if (r.has(t)) return;
        r.add(t);
        let n = i.get(e);
        n || i.set(e, n = []), n.push(t)
    };
    for (let e of t) {
        let t = a.get(A(e.path)) ? ? [],
            n = $e(e.path).toLowerCase(),
            r = e.name.toLowerCase();
        for (let i of t) {
            let t = et(i).toLowerCase();
            (t === n || t === r) && s(e.path, i)
        }
    }
    for (let e of t) {
        let t = A(e.path);
        if ((o.get(t) ? ? 0) === 1)
            for (let n of a.get(t) ? ? []) s(e.path, n)
    }
    return {
        byCardPath: i,
        unassigned: n.filter(e => !r.has(e))
    }
}
var nt = e => e === `react-dom` ? `ReactDOM` : `React`,
    rt = /^[A-Za-z_$][\w$]*$/,
    it = new Set(`__proto__.prototype.constructor.await.break.case.catch.class.const.continue.debugger.default.delete.do.else.enum.export.extends.false.finally.for.function.if.import.in.instanceof.new.null.return.super.switch.this.throw.true.try.typeof.var.void.while.with.yield.let.static.implements.interface.package.private.protected.public.arguments.eval`.split(`.`)),
    M = e => rt.test(e) && !it.has(e);

function N(e, t = []) {
    if (!e || typeof e != `object`) return t;
    let n = e;
    switch (n.type) {
        case `Identifier`:
            typeof n.name == `string` && t.push(n.name);
            break;
        case `ObjectPattern`:
            for (let e of n.properties ? ? []) {
                let n = e;
                N(n.type === `RestElement` ? n.argument : n.value, t)
            }
            break;
        case `ArrayPattern`:
            for (let e of n.elements ? ? []) N(e, t);
            break;
        case `RestElement`:
            N(n.argument, t);
            break;
        case `AssignmentPattern`:
            N(n.left, t);
            break
    }
    return t
}
var at = e => e ? e.type === `Identifier` ? e.name ? ? `` : e.value ? ? `` : ``,
    ot = new Set([`TSInterfaceDeclaration`, `TSTypeAliasDeclaration`, `TSModuleDeclaration`]),
    st = new Set([`TSTypeReference`, `TSTypeQuery`, `TSQualifiedName`, `TSExpressionWithTypeArguments`, `TSTypePredicate`, `TSTypeParameter`, `TSInterfaceDeclaration`, `TSTypeAliasDeclaration`]);
async function ct(e, t) {
    let r = await (await n(async () => {
            let {
                load: e
            } = await
            import (`./babel-standalone-cyL-SWky.js`);
            return {
                load: e
            }
        }, __vite__mapDeps([0, 1]))).load(),
        i = !/\.[mc]?ts$/.test(t ? ? ``),
        a = new Map,
        o = new Map,
        s = new Set,
        c = [],
        l = new Set,
        u = (e, t) => {
            M(e) && M(t) && a.set(e, t)
        },
        d = (e, t) => {
            M(e) && M(t) && (o.set(t, e), s.add(t))
        },
        f = /\.(d\.[mc]?ts|css|scss|sass|less|styl|json|svg|png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|mp[34]|webm|md|mdx|html|txt|ya?ml)$/i,
        p = e => (e.startsWith(`./`) || e.startsWith(`../`)) && !f.test(e),
        m = (e, t, n, r) => {
            if (!M(n)) return;
            let i = e.scope.getBinding(t);
            for (let e of i ? .referencePaths ? ? [])
                if (!(e.parentPath ? .isExportSpecifier ? .() && e.key === `local`) && !e.parentPath ? .isExportDefaultDeclaration ? .() && !st.has(e.parentPath ? .type))
                    if (e.isJSXIdentifier()) {
                        let i = () => r.jsxMemberExpression(r.jsxIdentifier(`__ds_scope`), r.jsxIdentifier(n)),
                            a = e.findParent(e => e.isJSXElement());
                        e.replaceWith(i());
                        let o = a ? .node ? .closingElement;
                        if (o) {
                            let e = o.name;
                            for (; e.type === `JSXMemberExpression`;) e = e.object;
                            if (e.type === `JSXIdentifier` && e.name === t) {
                                if (o.name.type === `JSXIdentifier`) o.name = i();
                                else if (o.name.type === `JSXMemberExpression`) {
                                    let e = o.name;
                                    for (; e.object.type === `JSXMemberExpression`;) e = e.object;
                                    e.object = i()
                                }
                            }
                        }
                    } else e.replaceWith(r.memberExpression(r.identifier(`__ds_scope`), r.identifier(n)))
        },
        h = ({
            types: e
        }) => ({
            visitor: {
                Program(e) {
                    for (let t of e.node.body) {
                        let e = t.type === `ExportNamedDeclaration` ? t.declaration : t;
                        if (!(!e || e.declare)) {
                            if ((e.type === `FunctionDeclaration` || e.type === `ClassDeclaration` || e.type === `TSEnumDeclaration`) && e.id ? .type === `Identifier`) s.add(e.id.name);
                            else if (e.type === `VariableDeclaration`)
                                for (let t of e.declarations)
                                    for (let e of N(t.id)) s.add(e)
                        }
                    }
                },
                ImportDeclaration(t) {
                    let n = t.node;
                    if (n.importKind === `type`) return t.remove();
                    let r = n.source.value,
                        i = r === `react` || r === `react-dom`,
                        a = p(r);
                    a && c.push(r), !i && !r.startsWith(`.`) && !r.startsWith(`/`) && l.add(r);
                    let o = [];
                    for (let r of n.specifiers) {
                        if (r.importKind === `type`) continue;
                        let n = r.local.name;
                        if (r.type === `ImportSpecifier`) {
                            let c = at(r.imported) || n;
                            i ? M(n) && (c === n || M(c)) && (s.add(n), o.push(e.objectProperty(e.identifier(c), e.identifier(n), !1, c === n))) : a && (d(c, n), m(t, n, c, e))
                        } else r.type === `ImportDefaultSpecifier` && !i && a && (d(n, n), m(t, n, n, e))
                    }
                    o.length > 0 ? t.replaceWith(e.variableDeclaration(`const`, [e.variableDeclarator(e.objectPattern(o), e.identifier(nt(r)))])) : t.remove()
                },
                ExportNamedDeclaration(e) {
                    let t = e.node;
                    if (t.exportKind === `type`) return e.remove();
                    let n = t.declaration;
                    if (n) {
                        if (ot.has(n.type) || n.declare) return e.remove();
                        n.id && u(n.id.name, n.id.name);
                        for (let e of n.declarations ? ? [])
                            for (let t of N(e.id)) u(t, t);
                        e.replaceWith(n);
                        return
                    }
                    for (let e of t.specifiers ? ? []) {
                        if (e.exportKind === `type` || e.type !== `ExportSpecifier`) continue;
                        let n = at(e.exported),
                            r = e.local.name;
                        if (t.source) {
                            let e = t.source.value;
                            p(e) && M(r) && M(n) ? (c.push(e), o.set(r, r), a.set(n, `__ds_scope.${r}`)) : e !== `react` && e !== `react-dom` && !e.startsWith(`.`) && !e.startsWith(`/`) && l.add(e)
                        } else if (o.has(r)) {
                            let e = o.get(r) ? ? r;
                            M(n) && a.set(n, `__ds_scope.${e}`)
                        } else s.has(r) && u(n, r)
                    }
                    e.remove()
                },
                ExportDefaultDeclaration(t) {
                    let n = t.node.declaration;
                    if ((n.type === `FunctionDeclaration` || n.type === `ClassDeclaration`) && n.id) s.add(n.id.name), u(n.id.name, n.id.name), t.replaceWith(n);
                    else if (n.type === `Identifier`) {
                        let e = n.name;
                        if (o.has(e)) {
                            let t = o.get(e) ? ? e;
                            M(e) && a.set(e, `__ds_scope.${t}`)
                        } else s.has(e) && u(e, e);
                        t.remove()
                    } else {
                        let r = n.type === `FunctionDeclaration` || n.type === `ClassDeclaration` ? e.toExpression(n) : n;
                        t.replaceWith(e.tryStatement(e.blockStatement([e.expressionStatement(e.unaryExpression(`void`, r, !0))]), e.catchClause(null, e.blockStatement([]))))
                    }
                },
                ExportAllDeclaration(e) {
                    let t = e.node.source ? .value;
                    typeof t == `string` && (p(t) ? c.push(t) : t !== `react` && t !== `react-dom` && !t.startsWith(`.`) && !t.startsWith(`/`) && l.add(t)), e.remove()
                },
                TSExportAssignment(e) {
                    e.remove()
                },
                TSImportEqualsDeclaration(e) {
                    e.remove()
                }
            }
        }),
        g;
    try {
        g = r.transform(e, {
            plugins: [h],
            presets: [
                [`typescript`, {
                    allExtensions: !0,
                    isTSX: i,
                    onlyRemoveTypeImports: !0
                }],
                [`react`, {
                    runtime: `classic`
                }]
            ],
            filename: i ? `ds.tsx` : `ds.ts`,
            sourceType: `module`,
            parserOpts: {
                errorRecovery: !0
            },
            ast: !1,
            cloneInputAst: !1,
            babelrc: !1,
            configFile: !1
        }) ? .code ? ? ``
    } catch {
        return {
            code: ``,
            exports: a,
            imports: o,
            siblingPaths: c,
            packageImports: l,
            parseFailed: !0
        }
    }
    return {
        code: g,
        exports: a,
        imports: o,
        siblingPaths: c,
        packageImports: l
    }
}
var lt = e => [...e].map(([e, t]) => e === t ? e : `${e}: ${t}`).join(`, `);

function ut(e, t) {
    let n = e.split(/[^A-Za-z0-9]+/).filter(Boolean).map(e => e[0].toUpperCase() + e.slice(1)).join(``),
        r = n ? /^[0-9]/.test(n) ? `Ds` + n : n : `Ds`;
    if (t) {
        let e = t.replace(/[^A-Za-z0-9]/g, ``).slice(0, 6);
        if (e) return `${r}_${e}`
    }
    return r
}
async function dt(e) {
    let t = await crypto.subtle.digest(`SHA-256`, new TextEncoder().encode(e));
    return [...new Uint8Array(t)].slice(0, 6).map(e => e.toString(16).padStart(2, `0`)).join(``)
}

function ft(e, t, n) {
    let r = e.slice(0, e.lastIndexOf(`/`) + 1),
        i;
    try {
        i = decodeURIComponent(new URL(t, `file:///` + r).pathname.slice(1))
    } catch {
        return
    }
    if (n.has(i)) return i;
    for (let e of [`.tsx`, `.ts`, `.jsx`, `.js`, `.mjs`, `.cjs`])
        if (n.has(i + e)) return i + e;
    for (let e of [`.tsx`, `.ts`, `.jsx`, `.js`])
        if (n.has(i + `/index` + e)) return i + `/index` + e
}

function pt(e) {
    let t = new Set(e.map(e => e.path)),
        n = new Map(e.map((e, t) => [e.path, t])),
        r = e.map(e => [...new Set(e.siblingPaths.map(n => ft(e.path, n, t)).filter(e => e !== void 0).map(e => n.get(e)))].filter(t => t !== n.get(e.path))),
        i = e.map((e, t) => r[t].length),
        a = e.map(() => []);
    r.forEach((e, t) => e.forEach(e => a[e].push(t)));
    let o = [],
        s = new Set;
    for (;;) {
        let t = -1;
        for (let n = 0; n < e.length; n++)
            if (!s.has(n) && i[n] === 0) {
                t = n;
                break
            }
        if (t === -1) break;
        s.add(t), o.push(e[t]);
        for (let e of a[t]) i[e]--
    }
    for (let t = 0; t < e.length; t++) s.has(t) || o.push(e[t]);
    return o
}
async function mt(e, t) {
    let n = performance.now(),
        i = [],
        a = M(t.namespace) ? t.namespace : `Ds`,
        o = [],
        s = {},
        c = new Set;
    for (let t of e) {
        if (/\.d\.[mc]?ts$/.test(t.path) || !/\.[mc]?[jt]sx?$/.test(t.path)) continue;
        let e = await ct(t.content, t.path);
        e.parseFailed && i.push(t.path);
        for (let t of e.packageImports) c.add(t);
        o.push({ ...e,
            path: t.path
        }), s[t.path] = await dt(t.content)
    }
    let l = new Set(o.map(e => e.path)),
        u = [];
    for (let e of o)
        for (let t of [...new Set(e.siblingPaths)]) ft(e.path, t, l) === void 0 && u.push({
            from: e.path,
            spec: t
        });
    let d = new Map,
        f = new Map;
    for (let e of o)
        for (let [t, n] of e.exports) {
            let r = !n.startsWith(`__ds_scope.`);
            if ((!d.has(t) || r) && d.set(t, e.path), r) {
                let n = f.get(t);
                n ? n.push(e.path) : f.set(t, [e.path])
            }
        }
    let p = [...f].filter(([, e]) => e.length > 1).map(([e, t]) => ({
            name: e,
            paths: t
        })),
        m = (t.entries === void 0 ? [...d.keys()].filter(e => /^[A-Z]/.test(e)) : [...t.entries]).filter(e => M(e) && d.has(e)).map(e => ({
            name: e,
            sourcePath: d.get(e)
        })),
        h = new Set(m.map(e => e.name)),
        g = [...d].filter(([e]) => !h.has(e)).map(([e, t]) => ({
            name: e,
            sourcePath: t
        })).sort((e, t) => e.name < t.name ? -1 : +(e.name > t.name)),
        _ = {
            format: 3,
            namespace: a,
            components: m,
            sourceHashes: s,
            inlinedExternals: [],
            ...p.length > 0 ? {
                duplicateExports: p
            } : {},
            unexposedExports: g
        },
        v = [`/* @ds-bundle: ${JSON.stringify(_).replace(/\*\//g,`*\\/`)} */`, `(() => {`, `const __ds_ns = (window.${a} = window.${a} || {});`, `const __ds_scope = {};`, `(__ds_ns.__errors = __ds_ns.__errors || []);`];
    for (let e of pt(o)) {
        let t = e.code.trim();
        if (!t && e.exports.size === 0) continue;
        let n = JSON.stringify(e.path),
            r = n.slice(1, -1),
            i = e.exports.size > 0 ? `\nObject.assign(__ds_scope, { ${lt(e.exports)} });` : ``;
        v.push(`// ${r}\ntry { (() => {\n${t}${i}\n})(); } catch (e) { __ds_ns.__errors.push({ path: ${n}, error: String((e && e.message) || e) }); }`)
    }
    for (let e of m) v.push(`__ds_ns.${e.name} = __ds_scope.${e.name};`);
    v.push(`})();`);
    let y = v.join(`

`) + `
`;
    return r(`design.ds_bundle_build`, {
        duration: performance.now() - n,
        attrs: {
            source_files: o.length,
            components: m.length,
            unexposed_exports: g.length,
            parse_failed: i.length,
            unresolved: u.length,
            duplicate_exports: p.length,
            dropped_packages: c.size,
            bundle_bytes: y.length
        }
    }), {
        bundle: y,
        meta: _,
        components: m,
        unexposedExports: g,
        droppedPackages: [...c].sort(),
        unresolvedSiblings: u,
        duplicateExports: p,
        parseFailedPaths: i
    }
}

function P(e) {
    let t = /^\/\* @ds-bundle: (.*) \*\//.exec(e.split(`
`, 1)[0]);
    if (t) try {
        return JSON.parse(t[1].replace(/\*\\\//g, `*/`))
    } catch {
        return
    }
}
async function ht(e, t, n = new Set) {
    if (!e) return {
        decision: `build`,
        drifted: []
    };
    let r = P(e);
    if (!r ? .sourceHashes) return {
        decision: `rebuild`,
        meta: r,
        drifted: []
    };
    let i = r.builtBy !== void 0 || (r.inlinedExternals ? ? []).length > 0;
    if (!i && (r.format ? ? 1) < 3) return {
        decision: `rebuild`,
        meta: r,
        drifted: []
    };
    let a = {};
    for (let e of t) /\.d\.[mc]?ts$/.test(e.path) || !/\.[mc]?[jt]sx?$/.test(e.path) || (a[e.path] = await dt(e.content));
    let o = r.sourceHashes,
        s = e => !/\.d\.[mc]?ts$/.test(e) && /\.[mc]?[jt]sx?$/.test(e),
        c = i ? [...Object.keys(o).filter(e => s(e) && o[e] !== a[e]), ...Object.keys(a).filter(e => !(e in o) && n.has(e))] : [...Object.keys(a).filter(e => o[e] !== a[e]), ...Object.keys(o).filter(e => !(e in a))];
    return c.length === 0 ? {
        decision: `skip-current`,
        meta: r,
        drifted: c
    } : i ? {
        decision: `skip-has-externals`,
        meta: r,
        drifted: c
    } : {
        decision: `rebuild`,
        meta: r,
        drifted: c
    }
}
async function gt(e) {
    let t = await (await n(async () => {
        let {
            load: e
        } = await
        import (`./babel-standalone-cyL-SWky.js`);
        return {
            load: e
        }
    }, __vite__mapDeps([0, 1]))).load();
    try {
        return t.transform(e, {
            presets: [`react`],
            filename: `bundle.jsx`,
            sourceType: `script`
        }), {}
    } catch (e) {
        return {
            transformError: String(e)
        }
    }
}
var F = `_ds_bundle.js`,
    _t = `_ds_needs_recompile`,
    vt = 40;

function yt(e) {
    let t = ``,
        n = !1;
    for (let r of e) {
        let e = [...r.toLowerCase()][0] ? ? ``;
        if (e >= `a` && e <= `z` || e >= `0` && e <= `9` ? (t += e, n = !1) : !n && t.length > 0 && (t += `-`, n = !0), t.length >= vt) break
    }
    return t = t.replace(/^-+|-+$/g, ``), t === `` ? `ds` : t
}
var bt = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function xt(e, t) {
    return bt.test(t) ? `${yt(e)}-${t}` : null
}

function St(e, t) {
    return e === t || e.length > t.length + 1 && e.endsWith(t) && e[e.length - t.length - 1] === `-`
}
var I = `[Design System]`,
    Ct = "bound at `_ds/",
    wt = "`list_files` on the project root",
    Tt = t({
        DS_FETCH_TIMEOUT_MS: () => B,
        DS_SKILL_SUFFIX: () => L,
        SP_SKILL_SUFFIX: () => Et,
        cachedDsProjectToSkill: () => Vt,
        dsProjectToSkill: () => Bt,
        dsProjectToSkillPlaceholder: () => Ht,
        fetchDsComposition: () => Pt,
        isDsOrSpSkill: () => Dt,
        isDsSkill: () => R,
        isPlaceholderDsSkill: () => Ot,
        listAllFilePaths: () => U,
        listConsumerDsFolders: () => At,
        resolveDsPin: () => jt,
        resolveV2: () => H
    }),
    L = ` (design system)`,
    Et = ` (starting point)`;

function R(e) {
    return e.type === `skill` && e.name.endsWith(` (design system)`)
}

function Dt(e) {
    return e.type === `skill` && (e.name.endsWith(` (design system)`) || e.name.endsWith(` (starting point)`))
}

function Ot(e) {
    if (!R(e)) return !1;
    let t = e.content ? ? ``;
    return !t.includes(`_ds/`) && !t.includes(`CSS tokens:`)
}
var z = 32e3,
    B = 2e3;
async function V(e) {
    let t = async t => {
        try {
            let n = await m().getFile({
                projectId: e,
                path: t,
                raw: !0
            });
            return new TextDecoder().decode(n.content)
        } catch {
            return null
        }
    };
    return await t(`README.md`) ? ? await t(`readme.md`) ? ? await t(`base.md`) ? ? ``
}

function kt(e) {
    return typeof e == `string` && /^[A-Za-z_$][\w$]*$/.test(e) ? e : null
}
async function H(e) {
    let t = m();
    try {
        let n = await t.getFile({
                projectId: e,
                path: `_ds_manifest.json`,
                raw: !0
            }),
            r = JSON.parse(new TextDecoder().decode(n.content)),
            i = kt(r.namespace);
        if (i) return {
            namespace: i,
            globalCssPaths: Array.isArray(r.globalCssPaths) ? r.globalCssPaths.filter(S).slice(0, 512) : [],
            templates: ce(r.templates),
            components: le(r.components)
        }
    } catch {}
    try {
        let n = await t.getFile({
                projectId: e,
                path: F,
                raw: !0
            }),
            r = kt(P(new TextDecoder().decode(n.content)) ? .namespace);
        if (r) return {
            namespace: r,
            globalCssPaths: [],
            templates: [],
            components: []
        }
    } catch {}
    return null
}
async function U(e) {
    let t = m(),
        n = [],
        r = 0;
    for (;;) {
        let i = await t.listFiles({
            projectId: e,
            path: ``,
            depth: -1,
            offset: r
        });
        for (let e of i.entries) e.type === `file` && n.push(e.path);
        if (!i.truncated || i.entries.length === 0) break;
        r += i.entries.length
    }
    return n
}
async function At(e) {
    try {
        return (await m().listFiles({
            projectId: e,
            path: `_ds`,
            depth: 1,
            offset: 0
        })).entries.filter(e => e.type === `directory`).map(e => e.name)
    } catch {
        return null
    }
}

function jt(e, t, n) {
    let r = xt(t, e);
    if (r === null) return null;
    let i = (n ? ? []).filter(t => St(t, e) && /^[a-z0-9-]+$/.test(t));
    return i.length > 0 ? i.includes(r) ? r : [...i].sort()[0] : r
}
async function Mt(e) {
    performance.now();
    let t = e => new Promise(t => setTimeout(() => t(e), B)),
        [n, r] = await Promise.all([Promise.race([H(e), t(null)]), Promise.race([V(e), t(``)])]);
    return {
        v2: n,
        guide: r
    }
}
var Nt = new Map;

function Pt(e) {
    let t = Nt.get(e);
    return t || (t = (async () => {
        let t = !1,
            [n, r, i] = await Promise.all([H(e).catch(() => null), V(e).catch(() => ``), U(e).catch(() => (t = !0, []))]);
        return t && Nt.delete(e), {
            promptMdCount: j(i).length,
            componentCount: n ? .components.length ? ? 0,
            templateCount: n ? .templates.length ? ? 0,
            readmeBytes: new TextEncoder().encode(r).length,
            fileCount: i.length
        }
    })(), Nt.set(e, t)), t
}
var Ft = 12e3;
async function It(e) {
    let t = m(),
        n;
    try {
        n = (await U(e)).filter(e => e.endsWith(`.css`) && !/(^|\/)fonts?[./]/i.test(e) && S(e))
    } catch {
        return {
            cssFiles: [],
            tokens: []
        }
    }
    let r = new Set;
    return await Promise.all(n.map(async n => {
        try {
            let i = await t.getFile({
                    projectId: e,
                    path: n,
                    raw: !0
                }),
                a = new TextDecoder().decode(i.content).replace(/\/\*[\s\S]*?\*\//g, ``);
            for (let e of a.matchAll(/(?<![\w-])(--[A-Za-z0-9][\w-]*)\s*:/g)) e[1].startsWith(`--tw-`) || r.add(e[1])
        } catch {}
    })), {
        cssFiles: n,
        tokens: [...r].sort()
    }
}
async function Lt(e, t) {
    performance.now();
    let n = new Promise(e => setTimeout(() => e(null), B)),
        [r, i] = await Promise.all([Promise.race([V(e), n]), Promise.race([It(e), n])]),
        {
            cssFiles: a,
            tokens: o
        } = i ? ? {
            cssFiles: [],
            tokens: []
        },
        s = w(r ? ? ``);
    s.length > z && (s = s.slice(0, z) + `
…[truncated — read the full file]`);
    let c = s ? `Its guide is reproduced below so you don't need to fetch it:\n\n<design-system-guide>\n${s}\n</design-system-guide>` : `Before producing any visuals, explore it: call \`list_files("/projects/${e}/")\` to see the structure, then \`read_file\` the README/base.md or whatever index file it has. Don't guess at the design system's contents.`,
        l = o.join(`, `);
    l.length > Ft && (l = l.slice(0, Ft) + `, …[truncated — read the full stylesheet]`);
    let u = a.slice(0, 8).map(t => `\`/projects/${e}/${t}\``);
    a.length > 8 && u.push(`and ${a.length-8} more`);
    let d = u.join(`, `),
        f = o.length > 0 ? `The ${o.length} custom properties it defines are:\n\n${l}\n\nOnly use \`var(--*)\` names from that list.` : a.length > 0 ? `Before writing any \`var(--*)\`, \`read_file\` ${d} to find the exact custom-property name.` : `Before writing any \`var(--*)\`, look up the real name in the design system's \`.css\` files (\`list_files\` + \`read_file\` under \`/projects/${e}/\`).`;
    return {
        name: `${t}${L}`,
        prompt: `${I} This project uses the **${w(t)}** design system. This is a binding choice for visual style — every visual must follow it. Don't invent colors, type, spacing, or components not grounded here.

Scope: the design system is a visual style reference only. Its guide may describe example products, brands, or people that are unrelated to the user and unrelated to the subject of this conversation. Never treat anything in the design system as a fact about the user, their work, or the topic they asked about.

    Explore it to find what you need:
    - Always copy out the fonts and colors you need
    - For prototypes and designs, always copy out any relevant components
    - If the design system contains existing mocks of products, and you were asked to design or prototype something similar, copy and fork those mocks to start your design. This helps you make high-quality designs.

    Explore it quickly to find relevant UI kits (e.g. mocks of existing products you can copy and fork)

Full system at \`/projects/${e}/\`. ${c}

CSS tokens: the guide may describe tokens in prose, but the exact \`--*\` names are defined in the design system's stylesheet(s)${a.length?` (${d})`:``}. ${f} Never guess a token name — an unresolved \`var()\` silently falls back to the browser default.

For assets and UI kits beyond the guide: \`read_file("/projects/${e}/<path>")\` and \`copy_files\` to bring them into the current project.`
    }
}
var Rt = 24;

function zt(e, t, n, r = {}) {
    let {
        namespace: i,
        globalCssPaths: a,
        templates: o
    } = n.v2, s = r.pinnedFolder ? ? `<folder>`, c = w(n.guide);
    c.length > z && (c = c.slice(0, z) + `
…[truncated — read the full file]`);
    let l = `The full design-system source tree lives at \`/projects/${e}/\` — use \`list_files\` / \`read_file\` from there for anything not under \`_ds/\` (layout varies by brand; don't assume folder names).`,
        u = c ? `\n\n${l} Its guide is reproduced below so you don't need to fetch it:\n\n<design-system-guide>\n${c}\n</design-system-guide>` : `\n\n${l} Before producing any visuals, \`list_files("/projects/${e}/")\` and \`read_file\` the readme and any relevant guidelines.`,
        d = ``;
    if (o.length > 0) {
        let t = o.slice(0, Rt),
            n = t.map(t => `- \`${t.name}\` (\`/projects/${e}/${t.folder}/\`)` + (t.description ? ` — ${t.description}` : ``));
        o.length > t.length && n.push(`- …and ${o.length-t.length} more`), d = "\n\n**Start from a template if one matches.** Before building from scratch, check whether a template below matches the user's request. Read the template (list its folder, `read_file` the entry) and decide: if it's close to what's asked, `copy_files` the folder as your starting point" + (r.dcMode ? "; if you'd rather re-author in DC, `dc_write` a new page using the template as your structural reference" : ``) + ". If you copy, edit the copied `ds-base.js` — change `'../..'` to your `_ds/" + s + `\` path. (Older templates have no \`ds-base.js\` and carry \`../../…\` bundle/stylesheet refs in their pages instead — repoint those the same way.)\n\n${n.join(`
`)}`
    }
    let f = (a.length > 0 ? a : [`styles.css`]).map(e => `<link rel="stylesheet" href="_ds/${s}/${e}">`).join(`
`),
        p = r.dcMode ? `**Loading the bundle is how you use this design system.** Every Design Component you build must load \`_ds/${s}/${F}\` in \`<helmet>\` (include it in child DCs too — de-duped by URL) and compose with its components — do not recreate those components from scratch or restyle raw HTML to look like them. At the top of the template:

\`\`\`html
<helmet>
  ${f.replace(/\n/g,`
  `)}
  <script src="_ds/${s}/${F}"><\/script>
</helmet>
\`\`\`

Then mount any component directly in the template — no logic class needed:

\`\`\`html
<x-import component-from-global-scope="${i}.Button" hint-size="auto,40px">Label</x-import>
\`\`\`

Props are template attributes (kebab → camelCase); template children pass through as \`props.children\`. The linked stylesheet(s) carry the design tokens (colors, type, spacing) — style against those via \`var(--*)\` and the design system's classes rather than guessing values.` : `**Loading the bundle is how you use this design system.** Every page you build must load \`_ds/${s}/${F}\` and compose with the components it exports on \`window.${i}\` — do not recreate those components from scratch or restyle raw HTML to look like them. The bundle calls \`React.createElement\`, so \`window.React\` and \`window.ReactDOM\` must be loaded first. Then add these once:

\`\`\`html
${f}
<script src="_ds/${s}/${F}"><\/script>
\`\`\`

The bundle is plain compiled JS — load it with a regular \`<script>\` (no \`type="text/babel"\` or \`type="module"\`). Every component is then available on \`window.${i}\` — e.g. \`const { Button, Card } = window.${i};\`. The linked stylesheet(s) carry the design tokens (colors, type, spacing) — style against those via \`var(--*)\` and the design system's classes rather than guessing values.`,
        m = r.pinnedFolder ? `This project has the **${i}** design system ${Ct}${s}/\`. If anything under that path is missing or fails to load, the folder name may differ — \`list_files\` \`_ds/\` and use the folder whose name ends with ${e} instead, including in the <link>/<script> paths below.` : `This project has the **${i}** design system bound under \`_ds/\`. Run \`list_files\` on \`_ds/\` to find the bound folder (one folder per design system), e.g. \`_ds/<folder>/\`.`;
    return {
        name: `${t}${L}`,
        prompt: `${I} This project uses the **${w(t)}** design system. This is a binding choice for visual style — every visual must follow it. Don't invent colors, type, spacing, or components not grounded here.

Scope: the design system is a visual style reference only. Its guide may describe example products, brands, or people that are unrelated to the user and unrelated to the subject of this conversation. Never treat anything in the design system as a fact about the user, their work, or the topic they asked about.

${m}

${p}${d}${u}`
    }
}
async function Bt(e, t, n = {}) {
    let r = l(),
        i = r ? jt(e, t, n.consumerDsFolders) : null;
    r && i && n.consumerDsFolders ? .includes(i);
    let a = await Mt(e);
    return a.v2 ? zt(e, t, { ...a,
        v2: a.v2
    }, { ...n,
        pinnedFolder: i
    }) : Lt(e, t)
}
var W = new Map;

function Vt(e, t, n = {}) {
    let r = JSON.stringify([e, t, l(), !!n.dcMode, n.consumerProjectId ? ? ``, n.consumerSyncedAtVersion ? ? ``, n.consumerDsFolders ? [...n.consumerDsFolders].sort() : null]),
        i = W.get(r);
    if (!i) {
        let a = JSON.stringify([e]).slice(0, -1) + `,`;
        for (let e of W.keys()) e !== r && e.startsWith(a) && W.delete(e);
        i = Bt(e, t, {
            dcMode: n.dcMode,
            consumerDsFolders: n.consumerDsFolders
        }), W.set(r, i), i.catch(() => W.delete(r))
    }
    return i
}

function Ht(e, t) {
    return {
        name: `${t}${L}`,
        prompt: `${I} This project uses the **${w(t)}** design system. This is a binding choice for visual style — every visual must follow it. Don't invent colors, type, spacing, or components not grounded here.

Scope: the design system is a visual style reference only. Its guide may describe example products, brands, or people that are unrelated to the user and unrelated to the subject of this conversation. Never treat anything in the design system as a fact about the user, their work, or the topic they asked about.

Full system at \`/projects/${e}/\`. Before producing any visuals, explore it: call \`list_files("/projects/${e}/")\` to see the structure, then \`read_file\` the README/base.md or whatever index file it has. Don't guess at the design system's contents.`
    }
}

function Ut(e, t) {
    return t != null && t.trim() === `` && e != null && e.trim() !== ``
}
var Wt = `Edit skipped—it would have erased this text. If you meant to remove it, use delete.`,
    Gt = `/*EDITMODE-BEGIN*/`,
    Kt = `/*EDITMODE-END*/`;

function qt(e) {
    let t = e.indexOf(Gt);
    if (t === -1) return null;
    let n = e.indexOf(Kt, t);
    if (n === -1) return null;
    let r = t + 18;
    return r >= n ? null : {
        start: r,
        end: n
    }
}

function Jt(e, t) {
    let n = qt(e);
    if (!n) throw Error(`No EDITMODE-BEGIN/END markers found`);
    let r = e.slice(n.start, n.end),
        i;
    try {
        i = JSON.parse(r)
    } catch (e) {
        throw Error(`EDITMODE block is not valid JSON: ${e instanceof Error?e.message:e}`)
    }
    if (typeof i != `object` || !i || Array.isArray(i)) throw Error(`EDITMODE block must be a JSON object`);
    let a = { ...i,
            ...t
        },
        o = e.lastIndexOf(`
`, n.start - 18) + 1,
        s = e.slice(o, n.start - 18).match(/^[ \t]*/),
        c = s ? s[0] : ``,
        l = JSON.stringify(a, null, 2).replace(/</g, `\\u003c`).replace(/\//g, `\\/`).split(`
`).map((e, t) => t === 0 ? e : c + e).join(`
`);
    return e.slice(0, n.start) + l + e.slice(n.end)
}
var Yt = `The Tweaks host protocol — use this only when the \`tweaks_panel.jsx\` starter component can't be used (it wires all of this for you).

The user can toggle **Tweaks** on/off from the toolbar. When on, show additional in-page controls that let the user tweak aspects of the design — colors, fonts, spacing, copy, layout variants, feature flags, whatever makes sense. **You design the tweaks UI**; it lives inside the prototype. Title your panel/window **"Tweaks"** so the naming matches the toolbar toggle.

### Protocol

- **Order matters: register the listener before you announce availability.** If you post \`__edit_mode_available\` first, the host's activate message can land before your handler exists and the toggle silently does nothing.

- **First**, register a \`message\` listener on \`window\` that handles:
  \`{type: '__activate_edit_mode'}\` → show your Tweaks panel
  \`{type: '__deactivate_edit_mode'}\` → hide it
- **Then** — only once that listener is live — call:
  \`window.parent.postMessage({type: '__edit_mode_available'}, '*')\`
  This makes the toolbar toggle appear.
- If your panel has its own close button, post:
  \`window.parent.postMessage({type: '__edit_mode_dismissed'}, '*')\`
  so the toolbar toggle flips off in lockstep.
- When the user changes a value, apply it live in the page **and** persist it by calling:
  \`window.parent.postMessage({type: '__edit_mode_set_keys', edits: {fontSize: 18}}, '*')\`
  You can send partial updates — only the keys you include are merged.

### Persisting state

Wrap your tweakable defaults in comment markers so the host can rewrite them on disk, like this:

\`\`\`
const TWEAK_DEFAULS = /*EDITMODE-BEGIN*/{
  "primaryColor": "#D97757",
  "fontSize": 16,
  "dark": false
}/*EDITMODE-END*/;
\`\`\`

The block between the markers **must be valid JSON** (double-quoted keys and strings). There must be exactly one such block in the root HTML file, inside inline \`<script>\`. When you post \`__edit_mode_set_keys\`, the host parses the JSON, merges your edits, and writes the file back — so the change survives reload.
`,
    Xt = !1;

function Zt(e) {
    Xt = e
}

function Qt() {
    return Xt
}
var $t = `How to send free-text from inside the Tweaks panel back to the chat (the \`tweaks_panel.jsx\` starter's \`<TweakSuggestionBar>\` wraps this for you).

To send free-text from inside the panel to the main agent loop (e.g. "add a shadow depth slider"), post \`window.parent.postMessage({type: '__edit_mode_chat', text: '…'}, '*')\`. The host drops this into the chat composer; the user reviews and hits Send. You'll receive it as a new turn and can edit the page accordingly.

Add \`<TweakSuggestionBar suggestions={["…", "…", "…"]}>\` as the **first child** of \`<TweaksPanel>\` to render a suggestion input that typewriter-cycles through the three; when the user picks one, types their own, or clicks "Ideas", the text drops into the chat composer for them to send — you'll receive it as a new turn. **Always include the bar with three suggestions.** When you receive the Ideas request, respond by editing the \`suggestions\` array in place.

**Keep each suggestion under ~35 characters** so it fits the input without truncating — "Add a minimalism slider", not "Add a minimalism slider that strips ornament and opens up whitespace". Suggestions must be tweaks to the **user's design content** — never the canvas, artboard, frame, bezel, Tweaks panel, or any starter-component scaffolding. **Aim for expressive, multi-variable knobs that feel more powerful than a design tool**, not pixel-pushing: "Add a minimalism slider" (strips ornament, collapses the palette, opens up whitespace), "Add a time-of-day slider" (morphs the palette dawn → dusk → night), "Add a brutalism toggle", "Add a chaos dial", "Add an era slider — 1998 → flat → glass". A border-radius slider is fine as a third idea, but lead with at least one that a static design tool couldn't give you. Each must still be implementable as a key in \`TWEAK_DEFAULTS\` plus a control — skip anything that needs new assets or network calls.
`,
    en = `
/* BEGIN USAGE */
// DesignCanvas.jsx — Figma-ish design canvas wrapper
// Warm gray grid bg + Sections + Artboards + PostIt notes.
// Exports (to window): DesignCanvas, DCSection, DCArtboard, DCPostIt.
// Artboards are reorderable (grip-drag), deletable, labels/titles are
// inline-editable, and any artboard can be opened in a fullscreen focus
// overlay (←/→/Esc). State persists to a .design-canvas.state.json sidecar
// via the host bridge. No assets, no deps.
//
// Usage:
//   <DesignCanvas>
//     <DCSection id="onboarding" title="Onboarding" subtitle="First-run variants">
//       <DCArtboard id="a" label="A · Dusk" width={260} height={480}>…</DCArtboard>
//       <DCArtboard id="b" label="B · Minimal" width={260} height={480}>…</DCArtboard>
//     </DCSection>
//   </DesignCanvas>
//
// Artboards are static design frames, not scroll regions — never use
// height: 100% + overflow: auto/scroll on inner elements; size each artboard
// to fit its content (explicit pixel height, or let it grow).
/* END USAGE */

const DC = {
  bg: '#f0eee9',
  grid: 'rgba(0,0,0,0.06)',
  label: 'rgba(60,50,40,0.7)',
  title: 'rgba(40,30,20,0.85)',
  subtitle: 'rgba(60,50,40,0.6)',
  postitBg: '#fef4a8',
  postitText: '#5a4a2a',
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
};

// One-time CSS injection (classes are dc-prefixed so they don't collide with
// the hosted design's own styles).
if (typeof document !== 'undefined' && !document.getElementById('dc-styles')) {
  const s = document.createElement('style');
  s.id = 'dc-styles';
  s.textContent = [
    '.dc-editable{cursor:text;outline:none;white-space:nowrap;border-radius:3px;padding:0 2px;margin:0 -2px}',
    '.dc-editable:focus{background:#fff;box-shadow:0 0 0 1.5px #c96442}',
    '[data-dc-slot]{transition:transform .18s cubic-bezier(.2,.7,.3,1)}',
    '[data-dc-slot].dc-dragging{transition:none;z-index:10;pointer-events:none}',
    '[data-dc-slot].dc-dragging .dc-card{box-shadow:0 12px 40px rgba(0,0,0,.25),0 0 0 2px #c96442;transform:scale(1.02)}',
    // isolation:isolate contains artboard content's z-indexes so a
    // z-indexed child (sticky navbar etc.) can't paint over .dc-header or
    // the .dc-menu popover that drops into the top of the card.
    '.dc-card{isolation:isolate;transition:box-shadow .15s,transform .15s}',
    '.dc-card *{scrollbar-width:none}',
    '.dc-card *::-webkit-scrollbar{display:none}',
    // Per-artboard header: grip + label on the left, delete/expand on the
    // right. Single flex row; when the artboard's on-screen width is too
    // narrow for both the label yields (ellipsis, then hidden entirely below
    // ~4ch via the container query) and the buttons stay on the row.
    '.dc-header{position:absolute;bottom:100%;left:-4px;margin-bottom:calc(4px * var(--dc-inv-zoom,1));z-index:2;',
    '  display:flex;align-items:center;container-type:inline-size}',
    '.dc-labelrow{display:flex;align-items:center;gap:4px;height:24px;flex:1 1 auto;min-width:0}',
    '.dc-grip{flex:0 0 auto;cursor:grab;display:flex;align-items:center;padding:5px 4px;border-radius:4px;transition:background .12s,opacity .12s}',
    '.dc-grip:hover{background:rgba(0,0,0,.08)}',
    '.dc-grip:active{cursor:grabbing}',
    '.dc-labeltext{flex:1 1 auto;min-width:0;cursor:pointer;border-radius:4px;padding:3px 6px;',
    '  display:flex;align-items:center;transition:background .12s;overflow:hidden}',
    // Below ~4ch of label room: hide the label entirely, and drop the grip to
    // hover-only (same reveal rule as .dc-btns) so a narrow header is clean
    // until the card is moused.
    '@container (max-width: 110px){',
    '  .dc-labeltext{display:none}',
    '  .dc-grip{opacity:0}',
    '  [data-dc-slot]:hover .dc-grip{opacity:1}',
    '}',
    '.dc-labeltext:hover{background:rgba(0,0,0,.05)}',
    '.dc-labeltext .dc-editable{overflow:hidden;text-overflow:ellipsis;max-width:100%}',
    '.dc-labeltext .dc-editable:focus{overflow:visible;text-overflow:clip}',
    '.dc-btns{flex:0 0 auto;margin-left:auto;display:flex;gap:2px;opacity:0;transition:opacity .12s}',
    '[data-dc-slot]:hover .dc-btns,.dc-btns:has(.dc-menu){opacity:1}',
    '.dc-expand,.dc-kebab{width:22px;height:22px;border-radius:5px;border:none;cursor:pointer;padding:0;',
    '  background:transparent;color:rgba(60,50,40,.7);display:flex;align-items:center;justify-content:center;',
    '  font:inherit;transition:background .12s,color .12s}',
    '.dc-expand:hover,.dc-kebab:hover{background:rgba(0,0,0,.06);color:#2a251f}',
    // Slot hosting an open menu floats above later siblings (which otherwise
    // paint on top — same z-index:auto, later DOM order) so the popup isn't
    // clipped by the next card.
    '[data-dc-slot]:has(.dc-menu){z-index:10}',
    '.dc-menu{position:absolute;top:100%;right:0;margin-top:4px;background:#fff;border-radius:8px;',
    '  box-shadow:0 8px 28px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.05);padding:4px;min-width:160px;z-index:10}',
    '.dc-menu button{display:block;width:100%;padding:7px 10px;border:0;background:transparent;',
    '  border-radius:5px;font-family:inherit;font-size:13px;font-weight:500;line-height:1.2;',
    '  color:#29261b;cursor:pointer;text-align:left;transition:background .12s;white-space:nowrap}',
    '.dc-menu button:hover{background:rgba(0,0,0,.05)}',
    '.dc-menu hr{border:0;border-top:1px solid rgba(0,0,0,.08);margin:4px 2px}',
    '.dc-menu .dc-danger{color:#c96442}',
    '.dc-menu .dc-danger:hover{background:rgba(201,100,66,.1)}',
    // Chrome (titles / labels / buttons) counter-scales against the viewport
    // zoom so it stays a constant on-screen size. --dc-inv-zoom is set by
    // DCViewport on every transform update and inherits to all descendants —
    // any overlay inside the world (e.g. a TweaksPanel on an artboard) can use
    // it the same way.
    //
    // The header uses transform:scale (out-of-flow, so layout impact doesn't
    // matter) with its world-space width set to card-width / inv-zoom so that
    // after counter-scaling its on-screen width exactly matches the card's —
    // that's what lets the container query + text-overflow behave against the
    // card's visible edge at every zoom level.
    //
    // The section head uses CSS zoom instead of transform so its layout box
    // grows with the counter-scale, pushing the card row down — otherwise the
    // constant-screen-size title would overflow into the (shrinking) world-
    // space gap and overlap the artboard headers at low zoom.
    '.dc-header{width:calc((100% + 4px) / var(--dc-inv-zoom,1));',
    '  transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom left}',
    '.dc-sectionhead{zoom:var(--dc-inv-zoom,1)}',
  ].join('\\n');
  document.head.appendChild(s);
}

const DCCtx = React.createContext(null);

// Recursively unwrap React.Fragment so <>…</> grouping doesn't hide
// DCSection/DCArtboard children from the type-based walks below.
function dcFlatten(children) {
  const out = [];
  React.Children.forEach(children, (c) => {
    if (c && c.type === React.Fragment) out.push(...dcFlatten(c.props.children));
    else out.push(c);
  });
  return out;
}

// ─────────────────────────────────────────────────────────────
// DesignCanvas — stateful wrapper around the pan/zoom viewport.
// Owns runtime state (per-section order, renamed titles/labels, hidden
// artboards, focused artboard). Order/titles/labels/hidden persist to a
// .design-canvas.state.json
// sidecar next to the HTML. Reads go via plain fetch() so the saved
// arrangement is visible anywhere the HTML + sidecar are served together
// (omelette preview, direct link, downloaded zip). Writes go through the
// host's window.omelette bridge — editing requires the omelette runtime.
// Focus is ephemeral.
// ─────────────────────────────────────────────────────────────
const DC_STATE_FILE = '.design-canvas.state.json';

function DesignCanvas({ children, minScale, maxScale, style }) {
  const [state, setState] = React.useState({ sections: {}, focus: null });
  // Hold rendering until the sidecar read settles so the saved order/titles
  // appear on first paint (no source-order flash). didRead gates writes until
  // the read settles so the empty initial state can't clobber a slow read;
  // skipNextWrite suppresses the one echo-write that would otherwise follow
  // hydration.
  const [ready, setReady] = React.useState(false);
  const didRead = React.useRef(false);
  const skipNextWrite = React.useRef(false);

  React.useEffect(() => {
    let off = false;
    fetch('./' + DC_STATE_FILE)
      .then((r) => (r.ok ? r.json() : null))
      .then((saved) => {
        if (off || !saved || !saved.sections) return;
        skipNextWrite.current = true;
        setState((s) => ({ ...s, sections: saved.sections }));
      })
      .catch(() => {})
      .finally(() => { didRead.current = true; if (!off) setReady(true); });
    const t = setTimeout(() => { if (!off) setReady(true); }, 150);
    return () => { off = true; clearTimeout(t); };
  }, []);

  React.useEffect(() => {
    if (!didRead.current) return;
    if (skipNextWrite.current) { skipNextWrite.current = false; return; }
    const t = setTimeout(() => {
      window.omelette?.writeFile(DC_STATE_FILE, JSON.stringify({ sections: state.sections })).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [state.sections]);

  // Build registries synchronously from children so FocusOverlay can read
  // them in the same render. Fragments are flattened; wrapping in other
  // elements still opts out of focus/reorder.
  const registry = {};     // slotId -> { sectionId, artboard }
  const sectionMeta = {};  // sectionId -> { title, subtitle, slotIds[] }
  const sectionOrder = [];
  dcFlatten(children).forEach((sec) => {
    if (!sec || sec.type !== DCSection) return;
    const sid = sec.props.id ?? sec.props.title;
    if (!sid) return;
    sectionOrder.push(sid);
    const persisted = state.sections[sid] || {};
    const abs = [];
    dcFlatten(sec.props.children).forEach((ab) => {
      if (!ab || ab.type !== DCArtboard) return;
      const aid = ab.props.id ?? ab.props.label;
      if (aid) abs.push([aid, ab]);
    });
    // hidden is scoped to one source revision — when the agent regenerates
    // (artboard-ID set changes), prior deletes don't apply to new content.
    const srcKey = abs.map(([k]) => k).join('\\x1f');
    const hidden = persisted.srcKey === srcKey ? (persisted.hidden || []) : [];
    const srcIds = [];
    abs.forEach(([aid, ab]) => {
      if (hidden.includes(aid)) return;
      registry[\`\${sid}/\${aid}\`] = { sectionId: sid, artboard: ab };
      srcIds.push(aid);
    });
    const kept = (persisted.order || []).filter((k) => srcIds.includes(k));
    sectionMeta[sid] = {
      title: persisted.title ?? sec.props.title,
      subtitle: sec.props.subtitle,
      slotIds: [...kept, ...srcIds.filter((k) => !kept.includes(k))],
    };
  });

  const api = React.useMemo(() => ({
    state,
    section: (id) => state.sections[id] || {},
    patchSection: (id, p) => setState((s) => ({
      ...s,
      sections: { ...s.sections, [id]: { ...s.sections[id], ...(typeof p === 'function' ? p(s.sections[id] || {}) : p) } },
    })),
    setFocus: (slotId) => setState((s) => ({ ...s, focus: slotId })),
  }), [state]);

  // Esc exits focus; any outside pointerdown commits an in-progress rename.
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') api.setFocus(null); };
    const onPd = (e) => {
      const ae = document.activeElement;
      if (ae && ae.isContentEditable && !ae.contains(e.target)) ae.blur();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPd, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPd, true);
    };
  }, [api]);

  return (
    <DCCtx.Provider value={api}>
      <DCViewport minScale={minScale} maxScale={maxScale} style={style}>{ready && children}</DCViewport>
      {state.focus && registry[state.focus] && (
        <DCFocusOverlay entry={registry[state.focus]} sectionMeta={sectionMeta} sectionOrder={sectionOrder} />
      )}
    </DCCtx.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
// DCViewport — transform-based pan/zoom (internal)
//
// Input mapping (Figma-style):
//   • trackpad pinch  → zoom   (ctrlKey wheel; Safari gesture* events)
//   • trackpad scroll → pan    (two-finger)
//   • mouse wheel     → zoom   (notched; distinguished from trackpad scroll)
//   • middle-drag / primary-drag-on-bg → pan
//
// Transform state lives in a ref and is written straight to the DOM
// (translate3d + will-change) so wheel ticks don't go through React —
// keeps pans at 60fps on dense canvases.
// ─────────────────────────────────────────────────────────────
function DCViewport({ children, minScale = 0.1, maxScale = 8, style = {} }) {
  const vpRef = React.useRef(null);
  const worldRef = React.useRef(null);
  const tf = React.useRef({ x: 0, y: 0, scale: 1 });
  // Persist viewport across reloads so the user lands back where they were
  // after an agent edit or browser refresh. The sandbox origin is already
  // per-project; pathname keeps multiple canvas files in one project apart.
  const tfKey = 'dc-viewport:' + location.pathname;
  const saveT = React.useRef(0);

  const lastPostedScale = React.useRef();
  const apply = React.useCallback(() => {
    const { x, y, scale } = tf.current;
    const el = worldRef.current;
    if (!el) return;
    el.style.transform = \`translate3d(\${x}px, \${y}px, 0) scale(\${scale})\`;
    // Exposed for zoom-invariant chrome (labels, buttons, TweaksPanel).
    el.style.setProperty('--dc-inv-zoom', String(1 / scale));
    // Keep the host toolbar's % readout in sync with the canvas scale. Pan
    // ticks leave scale unchanged — skip the cross-frame post for those.
    if (lastPostedScale.current !== scale) {
      lastPostedScale.current = scale;
      window.parent.postMessage({ type: '__dc_zoom', scale }, '*');
    }
    clearTimeout(saveT.current);
    saveT.current = setTimeout(() => {
      try { localStorage.setItem(tfKey, JSON.stringify(tf.current)); } catch {}
    }, 200);
  }, [tfKey]);

  React.useLayoutEffect(() => {
    const flush = () => {
      clearTimeout(saveT.current);
      try { localStorage.setItem(tfKey, JSON.stringify(tf.current)); } catch {}
    };
    let restored = false;
    try {
      const s = JSON.parse(localStorage.getItem(tfKey) || 'null');
      if (s && Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.scale)) {
        tf.current = { x: s.x, y: s.y, scale: Math.min(maxScale, Math.max(minScale, s.scale)) };
        apply();
        restored = true;
      }
    } catch {}
    // Visibility backstop (one-shot): a persisted pan is only meaningful
    // relative to content that may have changed since it was saved. If the
    // restored transform leaves every section/artboard off-screen, restoring
    // it faithfully just strands the user — reset to origin instead.
    // Content renders after the sidecar read settles, so poll briefly until
    // real boxes exist; any user input cancels (they may be mid-pan).
    let checks = 0;
    let checkT = 0;
    let sawInput = false;
    let hiddenStreak = 0;
    const onInput = () => { sawInput = true; };
    const cleanupCheck = () => {
      window.removeEventListener('wheel', onInput, true);
      window.removeEventListener('pointerdown', onInput, true);
    };
    const checkVisible = () => {
      const vp = vpRef.current, world = worldRef.current;
      checks += 1;
      if (!vp || !world || sawInput || checks > 10) { cleanupCheck(); return; }
      const vr = vp.getBoundingClientRect();
      let sized = 0, visible = false;
      // Slots plus section-head titles: the [data-dc-section] wrapper (and
      // .dc-sectionhead) are full-width blocks whose boxes can stay
      // on-screen while everything real is stranded; the inline-block title
      // is text-sized and covers sections whose artboards were all deleted.
      world.querySelectorAll('[data-dc-slot], .dc-sectionhead .dc-editable').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return;
        sized += 1;
        if (r.right > vr.left && r.left < vr.right && r.bottom > vr.top && r.top < vr.bottom) visible = true;
      });
      if (visible) { cleanupCheck(); return; }
      if (sized === 0) { hiddenStreak = 0; checkT = setTimeout(checkVisible, 400); return; } // not rendered yet
      // Two consecutive hidden reads before resetting — the sidecar read can
      // reorder/hide sections after first paint, transiently moving every
      // box; a single sample must not discard a healthy deliberate pan.
      hiddenStreak += 1;
      if (hiddenStreak < 2) { checkT = setTimeout(checkVisible, 400); return; }
      tf.current = { x: 0, y: 0, scale: 1 };
      apply();
      cleanupCheck();
    };
    if (restored) {
      window.addEventListener('wheel', onInput, true);
      window.addEventListener('pointerdown', onInput, true);
      checkT = setTimeout(checkVisible, 250);
    }
    // Flush on pagehide and unmount so a reload within the 200ms debounce
    // window doesn't drop the last pan/zoom.
    window.addEventListener('pagehide', flush);
    return () => {
      clearTimeout(checkT);
      cleanupCheck();
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);

  React.useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;

    const zoomAt = (cx, cy, factor) => {
      const r = vp.getBoundingClientRect();
      const px = cx - r.left, py = cy - r.top;
      const t = tf.current;
      const next = Math.min(maxScale, Math.max(minScale, t.scale * factor));
      const k = next / t.scale;
      // --dc-inv-zoom consumers (.dc-sectionhead's CSS zoom, each section's
      // marginBottom) reflow on every scale change, vertically shifting the
      // world layout — so a world point mathematically pinned under the cursor
      // drifts as you zoom (content creeps up on zoom-in, down on zoom-out).
      // Anchor the DOM element under the cursor instead: record its screen Y,
      // apply the transform + --dc-inv-zoom, then cancel whatever vertical
      // drift the reflow introduced so it stays put on screen.
      let marker = null, markerY0 = 0;
      if (k !== 1) {
        const hit = document.elementFromPoint(cx, cy);
        marker = hit && hit.closest ? hit.closest('[data-dc-slot],[data-dc-section]') : null;
        if (marker) markerY0 = marker.getBoundingClientRect().top;
      }
      // keep the world point under the cursor fixed
      t.x = px - (px - t.x) * k;
      t.y = py - (py - t.y) * k;
      t.scale = next;
      apply();
      if (marker) {
        // A pure zoom around (cx, cy) maps screen Y → cy + (Y - cy) * k. Any
        // departure after the --dc-inv-zoom reflow is the layout drift.
        const drift = marker.getBoundingClientRect().top - (cy + (markerY0 - cy) * k);
        if (Math.abs(drift) > 0.1) { t.y -= drift; apply(); }
      }
    };

    // Mouse-wheel vs trackpad-scroll heuristic. A physical wheel sends
    // line-mode deltas (Firefox) or large integer pixel deltas with no X
    // component (Chrome/Safari, typically multiples of 100/120). Trackpad
    // two-finger scroll sends small/fractional pixel deltas, often with
    // non-zero deltaX. ctrlKey is set by the browser for trackpad pinch.
    const isMouseWheel = (e) =>
      e.deltaMode !== 0 ||
      (e.deltaX === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 40);

    const onWheel = (e) => {
      // A deck-stage nested on the canvas owns plain scrolling — its
      // thumbnail rail must stay natively scrollable, and panning a
      // full-viewport fixed deck only strands it. The shadow DOM retargets
      // rail events to the deck-stage host, so closest() sees it. ctrl/meta
      // pinch stays ours: unprevented it would browser-zoom the page.
      if (!(e.ctrlKey || e.metaKey) && e.target && e.target.closest && e.target.closest('deck-stage')) return;
      e.preventDefault();
      if (isGesturing) return; // Safari: gesture* owns the pinch — discard concurrent wheels
      if ((e.ctrlKey || e.metaKey) && !isMouseWheel(e)) {
        // trackpad pinch, or ctrl/cmd + smooth-scroll mouse. Notched
        // wheels fall through to the fixed-step branch below.
        zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01));
      } else if (isMouseWheel(e)) {
        // notched mouse wheel — fixed-ratio step per click
        zoomAt(e.clientX, e.clientY, Math.exp(-Math.sign(e.deltaY) * 0.18));
      } else {
        // trackpad two-finger scroll — pan
        tf.current.x -= e.deltaX;
        tf.current.y -= e.deltaY;
        apply();
      }
    };

    // Safari sends native gesture* events for trackpad pinch with a smooth
    // e.scale; preferring these over the ctrl+wheel fallback gives a much
    // better feel there. No-ops on other browsers. Safari also fires
    // ctrlKey wheel events during the same pinch — isGesturing makes
    // onWheel drop those entirely so they neither zoom nor pan.
    let gsBase = 1;
    let isGesturing = false;
    const onGestureStart = (e) => { e.preventDefault(); isGesturing = true; gsBase = tf.current.scale; };
    const onGestureChange = (e) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, (gsBase * e.scale) / tf.current.scale);
    };
    const onGestureEnd = (e) => { e.preventDefault(); isGesturing = false; };

    // Drag-pan: middle button anywhere, or primary button on canvas
    // background (anything that isn't an artboard or an inline editor).
    let drag = null;
    const onPointerDown = (e) => {
      const onBg = !e.target.closest('[data-dc-slot], .dc-editable');
      if (!(e.button === 1 || (e.button === 0 && onBg))) return;
      e.preventDefault();
      vp.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, lx: e.clientX, ly: e.clientY };
      vp.style.cursor = 'grabbing';
    };
    const onPointerMove = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      tf.current.x += e.clientX - drag.lx;
      tf.current.y += e.clientY - drag.ly;
      drag.lx = e.clientX; drag.ly = e.clientY;
      apply();
    };
    const onPointerUp = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      vp.releasePointerCapture(e.pointerId);
      drag = null;
      vp.style.cursor = '';
    };

    // Host-driven zoom (toolbar % menu). Zooms around viewport centre so the
    // visible midpoint stays fixed — matching the host's iframe-zoom feel.
    const onHostMsg = (e) => {
      const d = e.data;
      if (d && d.type === '__dc_set_zoom' && typeof d.scale === 'number') {
        const r = vp.getBoundingClientRect();
        zoomAt(r.left + r.width / 2, r.top + r.height / 2, d.scale / tf.current.scale);
      } else if (d && d.type === '__dc_probe') {
        // Host's [readyGen] reset asks whether a canvas is present; it
        // fires on the iframe's native 'load', which for canvases with
        // images/fonts is after our mount-time announce, so re-announce.
        // Clear the pan-tick guard so apply() re-posts the current scale
        // even if it's unchanged — the host just reset dcScale to 1.
        window.parent.postMessage({ type: '__dc_present' }, '*');
        lastPostedScale.current = undefined;
        apply();
      }
    };
    window.addEventListener('message', onHostMsg);
    // Announce canvas mode so the host toolbar proxies its % control here
    // instead of scaling the iframe element (which would just shrink the
    // viewport window of an infinite canvas). The apply() that follows emits
    // the initial __dc_zoom so the toolbar % is correct before first pinch.
    // lastPostedScale reset mirrors the __dc_probe handler: the layout
    // effect's restore-path apply() may already have posted the restored
    // scale (before __dc_present), so clear the guard to re-post it in order.
    window.parent.postMessage({ type: '__dc_present' }, '*');
    lastPostedScale.current = undefined;
    apply();

    vp.addEventListener('wheel', onWheel, { passive: false });
    vp.addEventListener('gesturestart', onGestureStart, { passive: false });
    vp.addEventListener('gesturechange', onGestureChange, { passive: false });
    vp.addEventListener('gestureend', onGestureEnd, { passive: false });
    vp.addEventListener('pointerdown', onPointerDown);
    vp.addEventListener('pointermove', onPointerMove);
    vp.addEventListener('pointerup', onPointerUp);
    vp.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('message', onHostMsg);
      vp.removeEventListener('wheel', onWheel);
      vp.removeEventListener('gesturestart', onGestureStart);
      vp.removeEventListener('gesturechange', onGestureChange);
      vp.removeEventListener('gestureend', onGestureEnd);
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('pointermove', onPointerMove);
      vp.removeEventListener('pointerup', onPointerUp);
      vp.removeEventListener('pointercancel', onPointerUp);
    };
  }, [apply, minScale, maxScale]);

  const gridSvg = \`url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M120 0H0v120' fill='none' stroke='\${encodeURIComponent(DC.grid)}' stroke-width='1'/%3E%3C/svg%3E")\`;
  return (
    <div
      ref={vpRef}
      className="design-canvas"
      style={{
        height: '100vh', width: '100vw',
        background: DC.bg,
        overflow: 'hidden',
        overscrollBehavior: 'none',
        touchAction: 'none',
        position: 'relative',
        fontFamily: DC.font,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <div
        ref={worldRef}
        style={{
          position: 'absolute', top: 0, left: 0,
          transformOrigin: '0 0',
          willChange: 'transform',
          width: 'max-content', minWidth: '100%',
          minHeight: '100%',
          padding: '60px 0 80px',
        }}
      >
        <div style={{ position: 'absolute', inset: -6000, backgroundImage: gridSvg, backgroundSize: '120px 120px', pointerEvents: 'none', zIndex: -1 }} />
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DCSection — editable title + h-row of artboards in persisted order
// ─────────────────────────────────────────────────────────────
function DCSection({ id, title, subtitle, children, gap = 48 }) {
  const ctx = React.useContext(DCCtx);
  const sid = id ?? title;
  const all = React.Children.toArray(dcFlatten(children));
  const artboards = all.filter((c) => c && c.type === DCArtboard);
  const rest = all.filter((c) => !(c && c.type === DCArtboard));
  const sec = (ctx && sid && ctx.section(sid)) || {};
  // Must match DesignCanvas's srcKey computation exactly (it filters falsy
  // IDs), or onDelete persists a srcKey that DesignCanvas never recognizes.
  const allIds = artboards.map((a) => a.props.id ?? a.props.label).filter(Boolean);
  const srcKey = allIds.join('\\x1f');
  const hidden = sec.srcKey === srcKey ? (sec.hidden || []) : [];
  const srcOrder = allIds.filter((k) => !hidden.includes(k));

  const order = React.useMemo(() => {
    const kept = (sec.order || []).filter((k) => srcOrder.includes(k));
    return [...kept, ...srcOrder.filter((k) => !kept.includes(k))];
  }, [sec.order, srcOrder.join('|')]);

  const byId = Object.fromEntries(artboards.map((a) => [a.props.id ?? a.props.label, a]));

  // marginBottom counter-scales so the on-screen gap between sections stays
  // constant — otherwise at low zoom the (world-space) gap collapses while
  // the screen-constant sectionhead below it doesn't, and the title reads as
  // belonging to the section above. paddingBottom below is just enough for
  // the 24px artboard-header (abs-positioned above each card) plus ~8px, so
  // the title sits tight against its own row at every zoom.
  return (
    <div data-dc-section={sid}
      style={{ marginBottom: 'calc(80px * var(--dc-inv-zoom, 1))', position: 'relative' }}>
      <div style={{ padding: '0 60px' }}>
        <div className="dc-sectionhead" style={{ paddingBottom: 36 }}>
          <DCEditable tag="div" value={sec.title ?? title}
            onChange={(v) => ctx && sid && ctx.patchSection(sid, { title: v })}
            style={{ fontSize: 28, fontWeight: 600, color: DC.title, letterSpacing: -0.4, marginBottom: 6, display: 'inline-block' }} />
          {subtitle && <div style={{ fontSize: 16, color: DC.subtitle }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', gap, padding: '0 60px', alignItems: 'flex-start', width: 'max-content' }}>
        {order.map((k) => (
          <DCArtboardFrame key={k} sectionId={sid} artboard={byId[k]} order={order}
            label={(sec.labels || {})[k] ?? byId[k].props.label}
            onRename={(v) => ctx && ctx.patchSection(sid, (x) => ({ labels: { ...x.labels, [k]: v } }))}
            onReorder={(next) => ctx && ctx.patchSection(sid, { order: next })}
            onDelete={() => ctx && ctx.patchSection(sid, (x) => ({
              hidden: [...(x.srcKey === srcKey ? (x.hidden || []) : []), k],
              srcKey,
            }))}
            onFocus={() => ctx && ctx.setFocus(\`\${sid}/\${k}\`)} />
        ))}
      </div>
      {rest}
    </div>
  );
}

// DCArtboard — marker; rendered by DCArtboardFrame via DCSection.
function DCArtboard() { return null; }

// Per-artboard export (kind: 'png' | 'html'). Both paths share the same
// self-contained clone: computed styles baked in, @font-face / <img> /
// inline-style background-image urls inlined as data URIs. PNG wraps the
// clone in foreignObject→canvas at 3× the artboard's natural width×height
// (same pipeline the host uses for page captures); HTML wraps it in a
// minimal standalone document. Both are independent of viewport zoom.
async function dcExport(node, w, h, name, kind) {
  try { await document.fonts.ready; } catch {}
  const toDataURL = (url) => fetch(url).then((r) => r.blob()).then((b) => new Promise((res) => {
    const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(url); fr.readAsDataURL(b);
  })).catch(() => url);

  // Collect @font-face rules. ss.cssRules throws SecurityError on
  // cross-origin sheets (e.g. fonts.googleapis.com) — in that case fetch
  // the CSS text directly (those endpoints send ACAO:*) and regex-extract
  // the blocks. @import and @media/@supports are walked so nested
  // @font-face rules aren't missed.
  const fontRules = [], pending = [], seen = new Set();
  const scrapeCss = (href) => {
    if (seen.has(href)) return; seen.add(href);
    pending.push(fetch(href).then((r) => r.text()).then((css) => {
      for (const m of css.match(/@font-face\\s*{[^}]*}/g) || []) fontRules.push({ css: m, base: href });
      for (const m of css.matchAll(/@import\\s+(?:url\\()?['"]?([^'")\\s;]+)/g))
        scrapeCss(new URL(m[1], href).href);
    }).catch(() => {}));
  };
  const walk = (rules, base) => {
    for (const r of rules) {
      if (r.type === CSSRule.FONT_FACE_RULE) fontRules.push({ css: r.cssText, base });
      else if (r.type === CSSRule.IMPORT_RULE && r.styleSheet) {
        const ibase = r.styleSheet.href || base;
        try { walk(r.styleSheet.cssRules, ibase); } catch { scrapeCss(ibase); }
      } else if (r.cssRules) walk(r.cssRules, base);
    }
  };
  for (const ss of document.styleSheets) {
    const base = ss.href || location.href;
    try { walk(ss.cssRules, base); } catch { if (ss.href) scrapeCss(ss.href); }
  }
  while (pending.length) await pending.shift();
  const fontCss = (await Promise.all(fontRules.map(async (rule) => {
    let out = rule.css, m; const re = /url\\((['"]?)([^'")]+)\\1\\)/g;
    while ((m = re.exec(rule.css))) {
      if (m[2].indexOf('data:') === 0) continue;
      let abs; try { abs = new URL(m[2], rule.base).href; } catch { continue; }
      out = out.split(m[0]).join('url("' + await toDataURL(abs) + '")');
    }
    return out;
  }))).join('\\n');

  const cloneStyled = (src) => {
    if (src.nodeType === 8 || (src.nodeType === 1 && src.tagName === 'SCRIPT')) return document.createTextNode('');
    const dst = src.cloneNode(false);
    if (src.nodeType === 1) {
      const cs = getComputedStyle(src); let txt = '';
      for (let i = 0; i < cs.length; i++) txt += cs[i] + ':' + cs.getPropertyValue(cs[i]) + ';';
      dst.setAttribute('style', txt + 'animation:none;transition:none;');
      if (src.tagName === 'CANVAS') try { const im = document.createElement('img'); im.src = src.toDataURL(); im.setAttribute('style', txt); return im; } catch {}
    }
    for (let c = src.firstChild; c; c = c.nextSibling) dst.appendChild(cloneStyled(c));
    return dst;
  };
  const clone = cloneStyled(node);
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  // Drop the card's own shadow/radius so the export is a flush w×h rect;
  // the artboard's own background (if any) is already in the computed style.
  clone.style.boxShadow = 'none'; clone.style.borderRadius = '0';

  const jobs = [];
  clone.querySelectorAll('img').forEach((el) => {
    const s = el.getAttribute('src');
    if (s && s.indexOf('data:') !== 0) jobs.push(toDataURL(el.src).then((d) => el.setAttribute('src', d)));
  });
  [clone, ...clone.querySelectorAll('*')].forEach((el) => {
    const bg = el.style.backgroundImage; if (!bg) return;
    let m; const re = /url\\(["']?([^"')]+)["']?\\)/g;
    while ((m = re.exec(bg))) {
      const tok = m[0], url = m[1];
      if (url.indexOf('data:') === 0) continue;
      jobs.push(toDataURL(url).then((d) => { el.style.backgroundImage = el.style.backgroundImage.split(tok).join('url("' + d + '")'); }));
    }
  });
  await Promise.all(jobs);

  const xml = new XMLSerializer().serializeToString(clone);
  const save = (blob, ext) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name + '.' + ext; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  if (kind === 'html') {
    const html = '<!doctype html><html><head><meta charset="utf-8"><title>' + name + '</title>' +
      (fontCss ? '<style>' + fontCss + '</style>' : '') +
      '</head><body style="margin:0">' + xml + '</body></html>';
    return save(new Blob([html], { type: 'text/html' }), 'html');
  }

  // PNG: the SVG's own width/height must be the output resolution — an
  // <img>-loaded SVG rasterizes at its intrinsic size, so sizing it at 1×
  // and ctx.scale()-ing up would just upscale a 1× bitmap. viewBox maps the
  // w×h foreignObject onto the px·w × px·h SVG canvas so the browser renders
  // the HTML at full resolution.
  const px = 3;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w * px + '" height="' + h * px +
    '" viewBox="0 0 ' + w + ' ' + h + '"><foreignObject width="' + w + '" height="' + h + '">' +
    (fontCss ? '<style><![CDATA[' + fontCss + ']]></style>' : '') + xml + '</foreignObject></svg>';
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res; img.onerror = () => rej(new Error('svg load failed'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  const cv = document.createElement('canvas');
  cv.width = w * px; cv.height = h * px;
  cv.getContext('2d').drawImage(img, 0, 0);
  cv.toBlob((blob) => save(blob, 'png'), 'image/png');
}

function DCArtboardFrame({ sectionId, artboard, label, order, onRename, onReorder, onFocus, onDelete }) {
  const { id: rawId, label: rawLabel, width = 260, height = 480, children, style = {} } = artboard.props;
  const id = rawId ?? rawLabel;
  const ref = React.useRef(null);
  const cardRef = React.useRef(null);
  const menuRef = React.useRef(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  // ⋯ menu: close on any outside pointerdown. Two-click delete lives inside
  // the menu — first click arms the row, second commits; closing disarms.
  React.useEffect(() => {
    if (!menuOpen) { setConfirming(false); return; }
    const off = (e) => { if (!menuRef.current || !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('pointerdown', off, true);
    return () => document.removeEventListener('pointerdown', off, true);
  }, [menuOpen]);

  const doExport = (kind) => {
    setMenuOpen(false);
    if (!cardRef.current) return;
    const name = String(label || id || 'artboard').replace(/[^\\w\\s.-]+/g, '_');
    dcExport(cardRef.current, width, height, name, kind)
      .catch((e) => console.error('[design-canvas] export failed:', e));
  };

  // Live drag-reorder: dragged card sticks to cursor; siblings slide into
  // their would-be slots in real time via transforms. DOM order only
  // changes on drop.
  const onGripDown = (e) => {
    e.preventDefault(); e.stopPropagation();
    const me = ref.current;
    // translateX is applied in local (pre-scale) space but pointer deltas and
    // getBoundingClientRect().left are screen-space — divide by the viewport's
    // current scale so the dragged card tracks the cursor at any zoom level.
    const scale = me.getBoundingClientRect().width / me.offsetWidth || 1;
    const peers = Array.from(document.querySelectorAll(\`[data-dc-section="\${sectionId}"] [data-dc-slot]\`));
    const homes = peers.map((el) => ({ el, id: el.dataset.dcSlot, x: el.getBoundingClientRect().left }));
    const slotXs = homes.map((h) => h.x);
    const startIdx = order.indexOf(id);
    const startX = e.clientX;
    let liveOrder = order.slice();
    me.classList.add('dc-dragging');

    const layout = () => {
      for (const h of homes) {
        if (h.id === id) continue;
        const slot = liveOrder.indexOf(h.id);
        h.el.style.transform = \`translateX(\${(slotXs[slot] - h.x) / scale}px)\`;
      }
    };

    const move = (ev) => {
      const dx = ev.clientX - startX;
      me.style.transform = \`translateX(\${dx / scale}px)\`;
      const cur = homes[startIdx].x + dx;
      let nearest = 0, best = Infinity;
      for (let i = 0; i < slotXs.length; i++) {
        const d = Math.abs(slotXs[i] - cur);
        if (d < best) { best = d; nearest = i; }
      }
      if (liveOrder.indexOf(id) !== nearest) {
        liveOrder = order.filter((k) => k !== id);
        liveOrder.splice(nearest, 0, id);
        layout();
      }
    };

    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      const finalSlot = liveOrder.indexOf(id);
      me.classList.remove('dc-dragging');
      me.style.transform = \`translateX(\${(slotXs[finalSlot] - homes[startIdx].x) / scale}px)\`;
      // After the settle transition, kill transitions + clear transforms +
      // commit the reorder in the same frame so there's no visual snap-back.
      setTimeout(() => {
        for (const h of homes) { h.el.style.transition = 'none'; h.el.style.transform = ''; }
        if (liveOrder.join('|') !== order.join('|')) onReorder(liveOrder);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          for (const h of homes) h.el.style.transition = '';
        }));
      }, 180);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };

  return (
    <div ref={ref} data-dc-slot={id} style={{ position: 'relative', flexShrink: 0 }}>
      <div className="dc-header" data-omelette-chrome="" style={{ color: DC.label }} onPointerDown={(e) => e.stopPropagation()}>
        <div className="dc-labelrow">
          <div className="dc-grip" onPointerDown={onGripDown} title="Drag to reorder">
            <svg width="9" height="13" viewBox="0 0 9 13" fill="currentColor"><circle cx="2" cy="2" r="1.1"/><circle cx="7" cy="2" r="1.1"/><circle cx="2" cy="6.5" r="1.1"/><circle cx="7" cy="6.5" r="1.1"/><circle cx="2" cy="11" r="1.1"/><circle cx="7" cy="11" r="1.1"/></svg>
          </div>
          <div className="dc-labeltext" onClick={onFocus} title="Click to focus">
            <DCEditable value={label} onChange={onRename} onClick={(e) => e.stopPropagation()}
              style={{ fontSize: 15, fontWeight: 500, color: DC.label, lineHeight: 1 }} />
          </div>
        </div>
        <div className="dc-btns">
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button className="dc-kebab" title="More" onClick={() => setMenuOpen((o) => !o)}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><circle cx="2.5" cy="6" r="1.1"/><circle cx="6" cy="6" r="1.1"/><circle cx="9.5" cy="6" r="1.1"/></svg>
            </button>
            {menuOpen && (
              <div className="dc-menu" onPointerDown={(e) => e.stopPropagation()}>
                <button onClick={() => doExport('png')}>Download PNG</button>
                <button onClick={() => doExport('html')}>Download HTML</button>
                <hr />
                <button className="dc-danger"
                  onClick={() => { if (confirming) { setMenuOpen(false); onDelete(); } else setConfirming(true); }}>
                  {confirming ? 'Click again to delete' : 'Delete'}
                </button>
              </div>
            )}
          </div>
          <button className="dc-expand" onClick={onFocus} title="Focus">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M7 1h4v4M5 11H1V7M11 1L7.5 4.5M1 11l3.5-3.5"/></svg>
          </button>
        </div>
      </div>
      <div ref={cardRef} className="dc-card"
        style={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.06)', overflow: 'hidden', width, height, background: '#fff', ...style }}>
        {children || <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 13, fontFamily: DC.font }}>{id}</div>}
      </div>
    </div>
  );
}

// Inline rename — commits on blur or Enter.
function DCEditable({ value, onChange, style, tag = 'span', onClick }) {
  const T = tag;
  return (
    <T className="dc-editable" contentEditable suppressContentEditableWarning
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      onBlur={(e) => onChange && onChange(e.currentTarget.textContent)}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
      style={style}>{value}</T>
  );
}

// ─────────────────────────────────────────────────────────────
// Focus mode — overlay one artboard; ←/→ within section, ↑/↓ across
// sections, Esc or backdrop click to exit.
// ─────────────────────────────────────────────────────────────
function DCFocusOverlay({ entry, sectionMeta, sectionOrder }) {
  const ctx = React.useContext(DCCtx);
  const { sectionId, artboard } = entry;
  const sec = ctx.section(sectionId);
  const meta = sectionMeta[sectionId];
  const peers = meta.slotIds;
  const aid = artboard.props.id ?? artboard.props.label;
  const idx = peers.indexOf(aid);
  const secIdx = sectionOrder.indexOf(sectionId);

  const go = (d) => { const n = peers[(idx + d + peers.length) % peers.length]; if (n) ctx.setFocus(\`\${sectionId}/\${n}\`); };
  const goSection = (d) => {
    // Sections whose artboards are all deleted have slotIds:[] — step past
    // them to the next non-empty section so ↑/↓ doesn't dead-end.
    const n = sectionOrder.length;
    for (let i = 1; i < n; i++) {
      const ns = sectionOrder[(((secIdx + d * i) % n) + n) % n];
      const first = sectionMeta[ns] && sectionMeta[ns].slotIds[0];
      if (first) { ctx.setFocus(\`\${ns}/\${first}\`); return; }
    }
  };

  React.useEffect(() => {
    const k = (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); goSection(-1); }
      if (e.key === 'ArrowDown') { e.preventDefault(); goSection(1); }
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  });

  const { width = 260, height = 480, children } = artboard.props;
  const [vp, setVp] = React.useState({ w: window.innerWidth, h: window.innerHeight });
  React.useEffect(() => { const r = () => setVp({ w: window.innerWidth, h: window.innerHeight }); window.addEventListener('resize', r); return () => window.removeEventListener('resize', r); }, []);
  const scale = Math.max(0.1, Math.min((vp.w - 200) / width, (vp.h - 260) / height, 2));

  const [ddOpen, setDd] = React.useState(false);
  const Arrow = ({ dir, onClick }) => (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{ position: 'absolute', top: '50%', [dir]: 28, transform: 'translateY(-50%)',
        border: 'none', background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.9)',
        width: 44, height: 44, borderRadius: 22, fontSize: 18, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.18)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.08)')}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d={dir === 'left' ? 'M11 3L5 9l6 6' : 'M7 3l6 6-6 6'} /></svg>
    </button>
  );

  // Portal to body so position:fixed is the real viewport regardless of any
  // transform on DesignCanvas's ancestors (including the canvas zoom itself).
  return ReactDOM.createPortal(
    <div onClick={() => ctx.setFocus(null)}
      onWheel={(e) => e.preventDefault()}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(24,20,16,.6)', backdropFilter: 'blur(14px)',
        fontFamily: DC.font, color: '#fff' }}>

      {/* top bar: section dropdown (left) · close (right) */}
      <div onClick={(e) => e.stopPropagation()}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 72, display: 'flex', alignItems: 'flex-start', padding: '16px 20px 0', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setDd((o) => !o)}
            style={{ border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', padding: '6px 8px',
              borderRadius: 6, textAlign: 'left', fontFamily: 'inherit' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.3 }}>{meta.title}</span>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ opacity: .7 }}><path d="M2 4l3.5 3.5L9 4"/></svg>
            </span>
            {meta.subtitle && <span style={{ display: 'block', fontSize: 13, opacity: .6, fontWeight: 400, marginTop: 2 }}>{meta.subtitle}</span>}
          </button>
          {ddOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#2a251f', borderRadius: 8,
              boxShadow: '0 8px 32px rgba(0,0,0,.4)', padding: 4, minWidth: 200, zIndex: 10 }}>
              {sectionOrder.filter((sid) => sectionMeta[sid].slotIds.length).map((sid) => (
                <button key={sid} onClick={() => { setDd(false); const f = sectionMeta[sid].slotIds[0]; if (f) ctx.setFocus(\`\${sid}/\${f}\`); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                    background: sid === sectionId ? 'rgba(255,255,255,.1)' : 'transparent', color: '#fff',
                    padding: '8px 12px', borderRadius: 5, fontSize: 14, fontWeight: sid === sectionId ? 600 : 400, fontFamily: 'inherit' }}>
                  {sectionMeta[sid].title}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => ctx.setFocus(null)}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.7)', width: 32, height: 32,
            borderRadius: 16, fontSize: 20, cursor: 'pointer', lineHeight: 1, transition: 'background .12s' }}>×</button>
      </div>

      {/* card centered, label + index below — only the card itself stops
          propagation so any backdrop click (including the margins around
          the card) exits focus */}
      <div
        style={{ position: 'absolute', top: 64, bottom: 56, left: 100, right: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: width * scale, height: height * scale, position: 'relative' }}>
          <div style={{ width, height, transform: \`scale(\${scale})\`, transformOrigin: 'top left', background: '#fff', borderRadius: 2, overflow: 'hidden',
            boxShadow: '0 20px 80px rgba(0,0,0,.4)' }}>
            {children || <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb' }}>{aid}</div>}
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()} style={{ fontSize: 14, fontWeight: 500, opacity: .85, textAlign: 'center' }}>
          {(sec.labels || {})[aid] ?? artboard.props.label}
          <span style={{ opacity: .5, marginLeft: 10, fontVariantNumeric: 'tabular-nums' }}>{idx + 1} / {peers.length}</span>
        </div>
      </div>

      <Arrow dir="left" onClick={() => go(-1)} />
      <Arrow dir="right" onClick={() => go(1)} />

      {/* dots */}
      <div onClick={(e) => e.stopPropagation()}
        style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
        {peers.map((p, i) => (
          <button key={p} onClick={() => ctx.setFocus(\`\${sectionId}/\${p}\`)}
            style={{ border: 'none', padding: 0, cursor: 'pointer', width: 6, height: 6, borderRadius: 3,
              background: i === idx ? '#fff' : 'rgba(255,255,255,.3)' }} />
        ))}
      </div>
    </div>,
    document.body,
  );
}

// ─────────────────────────────────────────────────────────────
// Post-it — absolute-positioned sticky note
// ─────────────────────────────────────────────────────────────
function DCPostIt({ children, top, left, right, bottom, rotate = -2, width = 180 }) {
  return (
    <div style={{
      position: 'absolute', top, left, right, bottom, width,
      background: DC.postitBg, padding: '14px 16px',
      fontFamily: '"Comic Sans MS", "Marker Felt", "Segoe Print", cursive',
      fontSize: 14, lineHeight: 1.4, color: DC.postitText,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
      transform: \`rotate(\${rotate}deg)\`,
      zIndex: 5,
    }}>{children}</div>
  );
}

Object.assign(window, { DesignCanvas, DCSection, DCArtboard, DCPostIt });

`,
    tn = `
/* BEGIN USAGE */
// iOS.jsx — Simplified iOS 26 (Liquid Glass) device frame
// Based on the iOS 26 UI Kit + Figma status bar spec. No assets, no deps.
// Exports (to window): IOSDevice, IOSStatusBar, IOSNavBar, IOSGlassPill, IOSList, IOSListRow, IOSKeyboard
//
// Usage — wrap your screen content in <IOSDevice> to get the bezel, status bar
// and home indicator (props: title, dark, keyboard):
//
//   <IOSDevice title="Settings">
//     ...your screen content...
//   </IOSDevice>
//   <IOSDevice dark title="Search" keyboard>…</IOSDevice>
/* END USAGE */

// ─────────────────────────────────────────────────────────────
// Status bar
// ─────────────────────────────────────────────────────────────
function IOSStatusBar({ dark = false, time = '9:41' }) {
  const c = dark ? '#fff' : '#000';
  return (
    <div style={{
      display: 'flex', gap: 154, alignItems: 'center', justifyContent: 'center',
      padding: '21px 24px 19px', boxSizing: 'border-box',
      position: 'relative', zIndex: 20, width: '100%',
    }}>
      <div style={{ flex: 1, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 1.5 }}>
        <span style={{
          fontFamily: '-apple-system, "SF Pro", system-ui', fontWeight: 590,
          fontSize: 17, lineHeight: '22px', color: c,
        }}>{time}</span>
      </div>
      <div style={{ flex: 1, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, paddingTop: 1, paddingRight: 1 }}>
        <svg width="19" height="12" viewBox="0 0 19 12">
          <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill={c}/>
          <rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill={c}/>
          <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill={c}/>
          <rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill={c}/>
        </svg>
        <svg width="17" height="12" viewBox="0 0 17 12">
          <path d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z" fill={c}/>
          <path d="M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z" fill={c}/>
          <circle cx="8.5" cy="10.5" r="1.5" fill={c}/>
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={c} strokeOpacity="0.35" fill="none"/>
          <rect x="2" y="2" width="20" height="9" rx="2" fill={c}/>
          <path d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z" fill={c} fillOpacity="0.4"/>
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Liquid glass pill — blur + tint + shine
// ─────────────────────────────────────────────────────────────
function IOSGlassPill({ children, dark = false, style = {} }) {
  return (
    <div style={{
      height: 44, minWidth: 44, borderRadius: 9999,
      position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: dark
        ? '0 2px 6px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.2)'
        : '0 1px 3px rgba(0,0,0,0.07), 0 3px 10px rgba(0,0,0,0.06)',
      ...style,
    }}>
      {/* blur + tint */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 9999,
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        background: dark ? 'rgba(120,120,128,0.28)' : 'rgba(255,255,255,0.5)',
      }} />
      {/* shine */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 9999,
        boxShadow: dark
          ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15), inset -1px -1px 1px rgba(255,255,255,0.08)'
          : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
        border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)',
      }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', padding: '0 4px' }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Navigation bar — glass pills + large title
// ─────────────────────────────────────────────────────────────
function IOSNavBar({ title = 'Title', dark = false, trailingIcon = true }) {
  const muted = dark ? 'rgba(255,255,255,0.6)' : '#404040';
  const text = dark ? '#fff' : '#000';
  const pillIcon = (content) => (
    <IOSGlassPill dark={dark}>
      <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {content}
      </div>
    </IOSGlassPill>
  );
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 10,
      paddingTop: 62, paddingBottom: 10, position: 'relative', zIndex: 5,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
      }}>
        {/* back chevron */}
        {pillIcon(
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none" style={{ marginLeft: -1 }}>
            <path d="M10 2L2 10l8 8" stroke={muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {/* trailing ellipsis */}
        {trailingIcon && pillIcon(
          <svg width="22" height="6" viewBox="0 0 22 6">
            <circle cx="3" cy="3" r="2.5" fill={muted}/>
            <circle cx="11" cy="3" r="2.5" fill={muted}/>
            <circle cx="19" cy="3" r="2.5" fill={muted}/>
          </svg>
        )}
      </div>
      {/* large title */}
      <div style={{
        padding: '0 16px',
        fontFamily: '-apple-system, system-ui',
        fontSize: 34, fontWeight: 700, lineHeight: '41px',
        color: text, letterSpacing: 0.4,
      }}>{title}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Grouped list (inset card, r:26) + row (52px)
// ─────────────────────────────────────────────────────────────
function IOSListRow({ title, detail, icon, chevron = true, isLast = false, dark = false }) {
  const text = dark ? '#fff' : '#000';
  const sec = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const ter = dark ? 'rgba(235,235,245,0.3)' : 'rgba(60,60,67,0.3)';
  const sep = dark ? 'rgba(84,84,88,0.65)' : 'rgba(60,60,67,0.12)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', minHeight: 52,
      padding: '0 16px', position: 'relative',
      fontFamily: '-apple-system, system-ui', fontSize: 17,
      letterSpacing: -0.43,
    }}>
      {icon && (
        <div style={{
          width: 30, height: 30, borderRadius: 7, background: icon,
          marginRight: 12, flexShrink: 0,
        }} />
      )}
      <div style={{ flex: 1, color: text }}>{title}</div>
      {detail && <span style={{ color: sec, marginRight: 6 }}>{detail}</span>}
      {chevron && (
        <svg width="8" height="14" viewBox="0 0 8 14" style={{ flexShrink: 0 }}>
          <path d="M1 1l6 6-6 6" stroke={ter} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {!isLast && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          left: icon ? 58 : 16, height: 0.5, background: sep,
        }} />
      )}
    </div>
  );
}

function IOSList({ header, children, dark = false }) {
  const hc = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const bg = dark ? '#1C1C1E' : '#fff';
  return (
    <div>
      {header && (
        <div style={{
          fontFamily: '-apple-system, system-ui', fontSize: 13,
          color: hc, textTransform: 'uppercase',
          padding: '8px 36px 6px', letterSpacing: -0.08,
        }}>{header}</div>
      )}
      <div style={{
        background: bg, borderRadius: 26,
        margin: '0 16px', overflow: 'hidden',
      }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Device frame
// ─────────────────────────────────────────────────────────────
function IOSDevice({
  children, width = 402, height = 874, dark = false,
  title, keyboard = false,
}) {
  return (
    <div style={{
      width, height, borderRadius: 48, overflow: 'hidden',
      position: 'relative', background: dark ? '#000' : '#F2F2F7',
      boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
      fontFamily: '-apple-system, system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* dynamic island */}
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 126, height: 37, borderRadius: 24, background: '#000', zIndex: 50,
      }} />
      {/* status bar (absolute) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <IOSStatusBar dark={dark} />
      </div>
      {/* nav + content */}
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {title !== undefined && <IOSNavBar title={title} dark={dark} />}
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
        {keyboard && <IOSKeyboard dark={dark} />}
      </div>
      {/* home indicator — always on top */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 60,
        height: 34, display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
        paddingBottom: 8, pointerEvents: 'none',
      }}>
        <div style={{
          width: 139, height: 5, borderRadius: 100,
          background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)',
        }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Keyboard — iOS 26 liquid glass
// ─────────────────────────────────────────────────────────────
function IOSKeyboard({ dark = false }) {
  const glyph = dark ? 'rgba(255,255,255,0.7)' : '#595959';
  const sugg = dark ? 'rgba(255,255,255,0.6)' : '#333';
  const keyBg = dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.85)';

  // special-key icons
  const icons = {
    shift: <svg width="19" height="17" viewBox="0 0 19 17"><path d="M9.5 1L1 9.5h4.5V16h8V9.5H18L9.5 1z" fill={glyph}/></svg>,
    del: <svg width="23" height="17" viewBox="0 0 23 17"><path d="M7 1h13a2 2 0 012 2v11a2 2 0 01-2 2H7l-6-7.5L7 1z" fill="none" stroke={glyph} strokeWidth="1.6" strokeLinejoin="round"/><path d="M10 5l7 7M17 5l-7 7" stroke={glyph} strokeWidth="1.6" strokeLinecap="round"/></svg>,
    ret: <svg width="20" height="14" viewBox="0 0 20 14"><path d="M18 1v6H4m0 0l4-4M4 7l4 4" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  };

  const key = (content, { w, flex, ret, fs = 25, k } = {}) => (
    <div key={k} style={{
      height: 42, borderRadius: 8.5,
      flex: flex ? 1 : undefined, width: w, minWidth: 0,
      background: ret ? '#08f' : keyBg,
      boxShadow: '0 1px 0 rgba(0,0,0,0.075)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, "SF Compact", system-ui',
      fontSize: fs, fontWeight: 458, color: ret ? '#fff' : glyph,
    }}>{content}</div>
  );

  const row = (keys, pad = 0) => (
    <div style={{ display: 'flex', gap: 6.5, justifyContent: 'center', padding: \`0 \${pad}px\` }}>
      {keys.map(l => key(l, { flex: true, k: l }))}
    </div>
  );

  return (
    <div style={{
      position: 'relative', zIndex: 15, borderRadius: 27, overflow: 'hidden',
      padding: '11px 0 2px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      boxShadow: dark
        ? '0 -2px 20px rgba(0,0,0,0.09)'
        : '0 -1px 6px rgba(0,0,0,0.018), 0 -3px 20px rgba(0,0,0,0.012)',
    }}>
      {/* liquid glass bg — same recipe as nav pills */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 27,
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        background: dark ? 'rgba(120,120,128,0.14)' : 'rgba(255,255,255,0.25)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 27,
        boxShadow: dark
          ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15)'
          : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
        border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)',
        pointerEvents: 'none',
      }} />

      {/* autocorrect bar */}
      <div style={{
        display: 'flex', gap: 20, alignItems: 'center',
        padding: '8px 22px 13px', width: '100%', boxSizing: 'border-box',
        position: 'relative',
      }}>
        {['"The"', 'the', 'to'].map((w, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div style={{ width: 1, height: 25, background: '#ccc', opacity: 0.3 }} />}
            <div style={{
              flex: 1, textAlign: 'center',
              fontFamily: '-apple-system, system-ui', fontSize: 17,
              color: sugg, letterSpacing: -0.43, lineHeight: '22px',
            }}>{w}</div>
          </React.Fragment>
        ))}
      </div>

      {/* key layout */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 13,
        padding: '0 6.5px', width: '100%', boxSizing: 'border-box',
        position: 'relative',
      }}>
        {row(['q','w','e','r','t','y','u','i','o','p'])}
        {row(['a','s','d','f','g','h','j','k','l'], 20)}
        <div style={{ display: 'flex', gap: 14.25, alignItems: 'center' }}>
          {key(icons.shift, { w: 45, k: 'shift' })}
          <div style={{ display: 'flex', gap: 6.5, flex: 1 }}>
            {['z','x','c','v','b','n','m'].map(l => key(l, { flex: true, k: l }))}
          </div>
          {key(icons.del, { w: 45, k: 'del' })}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {key('ABC', { w: 92.25, fs: 18, k: 'abc' })}
          {key('', { flex: true, k: 'space' })}
          {key(icons.ret, { w: 92.25, ret: true, k: 'ret' })}
        </div>
      </div>

      {/* bottom spacer (emoji+mic area, icons omitted) */}
      <div style={{ height: 56, width: '100%', position: 'relative' }} />
    </div>
  );
}

Object.assign(window, {
  IOSDevice, IOSStatusBar, IOSNavBar, IOSGlassPill, IOSList, IOSListRow, IOSKeyboard,
});
`,
    nn = `
/* BEGIN USAGE */
// Android.jsx — Simplified Android (Material 3) device frame
// Status bar + top app bar + content + gesture nav + keyboard.
// Based on Figma M3 spec. No dependencies, no image assets.
// Exports (to window): AndroidDevice, AndroidStatusBar, AndroidAppBar, AndroidListItem, AndroidNavBar, AndroidKeyboard
//
// Usage — wrap your screen content in <AndroidDevice> to get the bezel, status
// bar and gesture nav (props: title, large, keyboard, dark):
//
//   <AndroidDevice title="Inbox" large>
//     ...your screen content...
//   </AndroidDevice>
//   <AndroidDevice title="Compose" keyboard>…</AndroidDevice>
/* END USAGE */

const MD_C = {
  surface: '#f4fbf8',
  surfaceVariant: '#dae5e1',
  inverseOnSurface: '#ecf2ef',
  secondaryContainer: '#cde8e1',
  primaryFixedDim: '#83d5c6',
  onSurface: '#171d1b',
  onSurfaceVar: '#49454f',
  onPrimaryContainer: '#00201c',
  primary: '#006a60',
  frameBorder: 'rgba(116,119,117,0.5)',
};

// ─────────────────────────────────────────────────────────────
// Status bar (time left, wifi/cell/battery right)
// ─────────────────────────────────────────────────────────────
function AndroidStatusBar({ dark = false }) {
  const c = dark ? '#fff' : MD_C.onSurface;
  return (
    <div style={{
      height: 40, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 16px',
      position: 'relative',
      fontFamily: 'Roboto, system-ui, sans-serif',
    }}>
      {/* time left */}
      <div style={{ width: 128, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 400, letterSpacing: 0.25, lineHeight: '20px', color: c }}>9:30</span>
      </div>
      {/* camera punch-hole (center) */}
      <div style={{
        position: 'absolute', left: '50%', top: 8, transform: 'translateX(-50%)',
        width: 24, height: 24, borderRadius: 100, background: '#2e2e2e',
      }} />
      {/* status icons right */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', paddingRight: 2 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: -2 }}>
            <path d="M8 13.3L.67 5.97a10.37 10.37 0 0114.66 0L8 13.3z" fill={c}/>
          </svg>
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: -2 }}>
            <path d="M14.67 14.67V1.33L1.33 14.67h13.34z" fill={c}/>
          </svg>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16">
          <rect x="3.75" y="2" width="8.5" height="13" rx="1.5" fill={c}/>
          <rect x="5.5" y="0.9" width="5" height="2" rx="0.5" fill={c}/>
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Top app bar (Material 3 small/medium)
// ─────────────────────────────────────────────────────────────
function AndroidAppBar({ title = 'Title', large = false }) {
  const iconDot = (
    <div style={{
      width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: MD_C.onSurfaceVar, opacity: 0.3 }} />
    </div>
  );
  return (
    <div style={{ background: MD_C.surface, padding: '4px 4px 0' }}>
      <div style={{ height: 56, display: 'flex', alignItems: 'center', gap: 4 }}>
        {iconDot}
        {!large && (
          <span style={{
            flex: 1, fontSize: 22, fontWeight: 400, color: MD_C.onSurface,
            fontFamily: 'Roboto, system-ui, sans-serif',
          }}>{title}</span>
        )}
        {large && <div style={{ flex: 1 }} />}
        {iconDot}
      </div>
      {large && (
        <div style={{
          padding: '16px 16px 20px',
          fontSize: 28, fontWeight: 400, color: MD_C.onSurface,
          fontFamily: 'Roboto, system-ui, sans-serif',
        }}>{title}</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// List item (Material 3)
// ─────────────────────────────────────────────────────────────
function AndroidListItem({ headline, supporting, leading }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '12px 16px', minHeight: 56, boxSizing: 'border-box',
      fontFamily: 'Roboto, system-ui, sans-serif',
    }}>
      {leading && (
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: MD_C.primary, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 500, flexShrink: 0,
        }}>{leading}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, color: MD_C.onSurface, lineHeight: '24px' }}>{headline}</div>
        {supporting && (
          <div style={{ fontSize: 14, color: MD_C.onSurfaceVar, lineHeight: '20px' }}>{supporting}</div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Gesture nav bar (pill)
// ─────────────────────────────────────────────────────────────
function AndroidNavBar({ dark = false }) {
  return (
    <div style={{
      height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 108, height: 4, borderRadius: 2,
        background: dark ? '#fff' : MD_C.onSurface, opacity: 0.4,
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Device frame — wraps everything
// ─────────────────────────────────────────────────────────────
function AndroidDevice({
  children, width = 412, height = 892, dark = false,
  title, large = false, keyboard = false,
}) {
  return (
    <div style={{
      width, height, borderRadius: 18, overflow: 'hidden',
      background: dark ? '#1d1b20' : MD_C.surface,
      border: \`8px solid \${MD_C.frameBorder}\`,
      boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
      display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
    }}>
      <AndroidStatusBar dark={dark} />
      {title !== undefined && <AndroidAppBar title={title} large={large} />}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </div>
      {keyboard && <AndroidKeyboard />}
      <AndroidNavBar dark={dark} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Keyboard — Gboard (Material 3)
// ─────────────────────────────────────────────────────────────
function AndroidKeyboard() {
  let _k = 0;
  const key = (l, { flex = 1, bg = MD_C.surface, r = 6, minW, fs = 21 } = {}) => (
    <div key={_k++} style={{
      height: 46, borderRadius: r, flex, minWidth: minW,
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Roboto, system-ui', fontSize: fs,
      color: MD_C.onPrimaryContainer,
    }}>{l}</div>
  );
  const row = (keys, style = {}) => (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', ...style }}>
      {keys.map(l => key(l))}
    </div>
  );
  return (
    <div style={{
      background: MD_C.inverseOnSurface, padding: '0 8px 8px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      {/* navbar spacer (icons omitted) */}
      <div style={{ height: 44 }} />
      {/* key rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {row(['q','w','e','r','t','y','u','i','o','p'])}
        {row(['a','s','d','f','g','h','j','k','l'], { padding: '0 20px' })}
        <div style={{ display: 'flex', gap: 6 }}>
          {key('', { bg: MD_C.surfaceVariant })}
          <div style={{ display: 'flex', gap: 6, flex: 7, minWidth: 274 }}>
            {['z','x','c','v','b','n','m'].map(l => key(l))}
          </div>
          {key('', { bg: MD_C.surfaceVariant })}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {key('?123', { bg: MD_C.secondaryContainer, r: 100, minW: 58, fs: 14 })}
          {key(',', { bg: MD_C.surfaceVariant })}
          {key('', { flex: 3, minW: 154 })}
          {key('.', { bg: MD_C.surfaceVariant })}
          {key('', { bg: MD_C.primaryFixedDim, r: 100, minW: 58 })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  AndroidDevice, AndroidStatusBar, AndroidAppBar, AndroidListItem, AndroidNavBar, AndroidKeyboard,
});
`,
    rn = `
/* BEGIN USAGE */
// MacOS.jsx — Simplified macOS Tahoe (Liquid Glass) window
// Based on the macOS Tahoe UI Kit. No image assets, no dependencies.
// Exports (to window): MacWindow, MacSidebar, MacSidebarItem, MacSidebarHeader, MacToolbar, MacGlass, MacTrafficLights
//
// Usage — wrap your app content in <MacWindow> to get the window chrome
// (traffic lights + titlebar). Props: width, height, title, sidebar (pass a
// <MacSidebar> element); compose MacToolbar/MacGlass inside as needed:
//
//   <MacWindow width={980} height={620} title="Documents"
//              sidebar={<MacSidebar>…</MacSidebar>}>
//     ...your app content...
//   </MacWindow>
/* END USAGE */

const MAC_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro", "Helvetica Neue", sans-serif';

// ─────────────────────────────────────────────────────────────
// Liquid glass primitive — blur + white tint + inset highlight
// ─────────────────────────────────────────────────────────────
function MacGlass({ children, radius = 296, dark = false, style = {} }) {
  return (
    <div style={{ position: 'relative', borderRadius: radius, ...style }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: radius,
        background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: dark ? '0.5px solid rgba(255,255,255,0.12)' : '0.5px solid rgba(255,255,255,0.6)',
        boxShadow: dark
          ? '0 8px 40px rgba(0,0,0,0.2)'
          : '0 8px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.4)',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Traffic lights (14px, Tahoe colors)
// ─────────────────────────────────────────────────────────────
function MacTrafficLights({ style = {} }) {
  const dot = (bg) => (
    <div style={{
      width: 14, height: 14, borderRadius: '50%', background: bg,
      border: '0.5px solid rgba(0,0,0,0.1)',
    }} />
  );
  return (
    <div style={{ display: 'flex', gap: 9, alignItems: 'center', padding: 1, ...style }}>
      {dot('#ff736a')}{dot('#febc2e')}{dot('#19c332')}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Toolbar — title + single glass pill icon
// ─────────────────────────────────────────────────────────────
function MacToolbar({ title = 'Folder' }) {
  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'center', padding: 8, flexShrink: 0,
    }}>
      {/* title */}
      <div style={{
        fontFamily: MAC_FONT, fontSize: 15, fontWeight: 700,
        color: 'rgba(0,0,0,0.85)', whiteSpace: 'nowrap', paddingLeft: 8,
      }}>{title}</div>
      <div style={{ flex: 1 }} />
      {/* single action */}
      <MacGlass>
        <div style={{
          width: 36, height: 36, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#4c4c4c', opacity: 0.4 }} />
        </div>
      </MacGlass>
      {/* search */}
      <MacGlass>
        <div style={{
          width: 140, height: 36, display: 'flex', alignItems: 'center',
          gap: 6, padding: '0 12px',
        }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4" stroke="#727272" strokeWidth="1.5"/>
            <path d="M8.5 8.5l3 3" stroke="#727272" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{
            fontFamily: MAC_FONT, fontSize: 13, fontWeight: 500, color: '#727272',
          }}>Search</span>
        </div>
      </MacGlass>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar — frosted glass panel floating inside the window
// ─────────────────────────────────────────────────────────────
function MacSidebarItem({ label, selected = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      height: 24, padding: '4px 10px 4px 6px', margin: '0 10px',
      borderRadius: 8, position: 'relative',
      fontFamily: MAC_FONT, fontSize: 11, fontWeight: 500,
    }}>
      {selected && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 8,
          background: 'rgba(0,0,0,0.11)', mixBlendMode: 'multiply',
        }} />
      )}
      <div style={{
        width: 14, height: 14, borderRadius: '50%',
        background: selected ? '#007aff' : 'rgba(0,0,0,0.4)',
        opacity: selected ? 1 : 0.5, flexShrink: 0, position: 'relative',
      }} />
      <span style={{ color: 'rgba(0,0,0,0.85)', position: 'relative' }}>{label}</span>
    </div>
  );
}

function MacSidebar({ children }) {
  return (
    <div style={{
      width: 220, height: '100%', padding: 8, flexShrink: 0,
      position: 'relative', display: 'flex', flexDirection: 'column',
    }}>
      {/* glass panel */}
      <div style={{
        position: 'absolute', inset: 8, borderRadius: 18,
        background: 'rgba(210,225,245,0.45)',
        backdropFilter: 'blur(50px) saturate(200%)',
        WebkitBackdropFilter: 'blur(50px) saturate(200%)',
        border: '0.5px solid rgba(255,255,255,0.5)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.35)',
      }} />
      {/* content */}
      <div style={{
        position: 'relative', zIndex: 1, padding: '10px 0',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {/* window controls + sidebar toggle */}
        <div style={{
          height: 32, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 10px', marginBottom: 4,
        }}>
          <MacTrafficLights />
        </div>
        {children}
      </div>
    </div>
  );
}

function MacSidebarHeader({ title }) {
  return (
    <div style={{
      padding: '14px 18px 5px',
      fontFamily: MAC_FONT, fontSize: 11, fontWeight: 700,
      color: 'rgba(0,0,0,0.5)',
    }}>{title}</div>
  );
}

// ─────────────────────────────────────────────────────────────
// Window — r:26, big shadow, sidebar + toolbar + content
// ─────────────────────────────────────────────────────────────
function MacWindow({
  width = 900, height = 600, title = 'Folder',
  sidebar, children,
}) {
  return (
    <div style={{
      width, height, borderRadius: 26, overflow: 'hidden',
      background: '#fff',
      boxShadow: '0 0 0 1px rgba(0,0,0,0.23), 0 16px 48px rgba(0,0,0,0.35)',
      display: 'flex', position: 'relative',
      fontFamily: MAC_FONT,
    }}>
      <MacSidebar>{sidebar}</MacSidebar>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <MacToolbar title={title} />
        <div style={{ flex: 1, overflow: 'auto', padding: '4px 8px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  MacWindow, MacSidebar, MacSidebarItem, MacSidebarHeader,
  MacToolbar, MacGlass, MacTrafficLights,
});
`,
    an = `
/* BEGIN USAGE */
// Chrome.jsx — Simplified Chrome browser window (dark theme, macOS)
// No dependencies, no image assets. All inline styles + inline SVG.
// Exports (to window): ChromeWindow, ChromeTabBar, ChromeToolbar, ChromeTab, ChromeTrafficLights
//
// Usage — wrap your page content in <ChromeWindow> to get the tab bar + URL bar:
//
//   <ChromeWindow width={1100} height={680} url="acme.design/pricing">
//     ...your page content...
//   </ChromeWindow>
/* END USAGE */

const CHROME_C = {
  barBg: '#202124',
  tabBg: '#35363a',
  text: '#e8eaed',
  dim: '#9aa0a6',
  urlBg: '#282a2d',
};

function ChromeTrafficLights() {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '0 14px' }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
    </div>
  );
}

// Single tab (active has curved scoops)
function ChromeTab({ title = 'New Tab', active = false }) {
  const curve = (flip) => (
    <svg width="8" height="10" viewBox="0 0 8 10"
      style={{ position: 'absolute', bottom: 0, [flip ? 'right' : 'left']: -8, transform: flip ? 'scaleX(-1)' : 'none' }}>
      <path d="M0 10C2 9 6 8 8 0V10H0Z" fill={CHROME_C.tabBg}/>
    </svg>
  );
  return (
    <div style={{
      position: 'relative', height: 34, alignSelf: 'flex-end',
      padding: '0 12px', display: 'flex', alignItems: 'center', gap: 8,
      background: active ? CHROME_C.tabBg : 'transparent',
      borderRadius: '8px 8px 0 0', minWidth: 120, maxWidth: 220,
      fontFamily: 'system-ui, sans-serif', fontSize: 12,
      color: active ? CHROME_C.text : CHROME_C.dim,
    }}>
      {active && curve(false)}
      {active && curve(true)}
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#5f6368', flexShrink: 0 }} />
      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
    </div>
  );
}

function ChromeTabBar({ tabs = [{ title: 'New Tab' }], activeIndex = 0 }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: 44,
      background: CHROME_C.barBg, paddingRight: 8,
    }}>
      <ChromeTrafficLights />
      <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingLeft: 4, flex: 1 }}>
        {tabs.map((t, i) => <ChromeTab key={i} title={t.title} active={i === activeIndex} />)}
      </div>
    </div>
  );
}

function ChromeToolbar({ url = 'example.com' }) {
  const iconDot = (
    <div style={{
      width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: CHROME_C.dim, opacity: 0.4 }} />
    </div>
  );
  return (
    <div style={{
      height: 40, background: CHROME_C.tabBg,
      display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px',
    }}>
      {iconDot}
      {/* url bar */}
      <div style={{
        flex: 1, height: 30, borderRadius: 15, background: CHROME_C.urlBg,
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px',
        margin: '0 6px',
      }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: CHROME_C.dim, opacity: 0.4 }} />
        <span style={{
          flex: 1, color: CHROME_C.text, fontSize: 13,
          fontFamily: 'system-ui, sans-serif',
        }}>{url}</span>
      </div>
      {iconDot}
    </div>
  );
}

function ChromeWindow({
  tabs = [{ title: 'New Tab' }], activeIndex = 0, url = 'example.com',
  width = 900, height = 600, children,
}) {
  return (
    <div style={{
      width, height, borderRadius: 10, overflow: 'hidden',
      boxShadow: '0 24px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.1)',
      display: 'flex', flexDirection: 'column', background: CHROME_C.tabBg,
    }}>
      <ChromeTabBar tabs={tabs} activeIndex={activeIndex} />
      <ChromeToolbar url={url} />
      <div style={{ flex: 1, background: '#fff', overflow: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

Object.assign(window, {
  ChromeWindow, ChromeTabBar, ChromeToolbar, ChromeTab, ChromeTrafficLights,
});
`,
    on = `
/* BEGIN USAGE */
// animations.jsx — timeline engine. Exports (on window): Stage, Sprite,
//   TextSprite, ImageSprite, RectSprite, VideoSprite, PlaybackBar,
//   useTime, useTimeline, useSprite, Easing, interpolate, animate, clamp.
//
//   <Stage width={1280} height={720} duration={10} background="#f6f4ef">
//     <Sprite start={0} end={3}>
//       <TextSprite text="Hello" x={100} y={300} size={72} color="#111" />
//     </Sprite>
//     <Sprite start={2} end={8}>
//       <ImageSprite src="hero.png" x={200} y={120} width={640} height={360} kenBurns />
//     </Sprite>
//   </Stage>
//
// Stage({width,height,duration,background,fps,loop,autoplay}) — auto-scales to
//   viewport; scrubber + play/pause + ←/→ seek + space + 0-reset; persists
//   playhead. The canvas is an <svg><foreignObject>, export-ready: Share →
//   Export → Video (or the PlaybackBar's download button) renders it to .mp4.
//   Screenshot tools DOM-rerender (not pixel-capture) and unwrap this wrapper
//   so captures should work — but if one comes back black, that's a capture
//   artifact, not a render bug; trust the live preview.
// Sprite({start,end,keepMounted}) — mounts children only while playhead is in
//   [start,end]. Children read {localTime, progress, duration} via useSprite().
// useTime() → seconds; useTimeline() → {time,duration,playing,setTime,setPlaying}.
// TextSprite({text,x,y,size,color,font,weight,align,entryDur,exitDur}) — fades/scales in+out.
// ImageSprite({src,x,y,width,height,fit,radius,kenBurns,placeholder}) — same, with optional ken-burns.
// RectSprite({x,y,width,height,color,radius}) — solid box with entry/exit.
// VideoSprite({src,start,end,speed,style}) — looped <video> clip synced to the
//   timeline; its audio is mixed into the exported video.
// Easing.{linear,easeIn/Out/InOut Quad/Cubic/Quart/Quint/Expo/Back, …}
// interpolate([t0,t1,…],[v0,v1,…],ease?) → (t)=>v  — piecewise tween.
// animate({from,to,start,end,ease}) → (t)=>v  — single tween.
//
// Build scenes by composing Sprites inside Stage. Absolutely-position elements.
//
// In a .dc.html project, put your scene in a sibling my-scene.jsx (reading
// {Stage, Sprite, useTime, Easing, …} from window is safe) and mount BOTH:
//   <x-import component-from-global-scope="MyScene"
//             from="./animations.jsx ./my-scene.jsx"></x-import>
// The two files in from= load in order, so my-scene.jsx can use the globals
// animations.jsx set.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

// ── Easing functions (hand-rolled, Popmotion-style) ─────────────────────────
// All easings take t ∈ [0,1] and return eased t ∈ [0,1] (may overshoot for back/elastic).
const Easing = {
  linear: (t) => t,

  // Quad
  easeInQuad:    (t) => t * t,
  easeOutQuad:   (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  // Cubic
  easeInCubic:    (t) => t * t * t,
  easeOutCubic:   (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),

  // Quart
  easeInQuart:    (t) => t * t * t * t,
  easeOutQuart:   (t) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t),

  // Expo
  easeInExpo:  (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return 0.5 * Math.pow(2, 20 * t - 10);
    return 1 - 0.5 * Math.pow(2, -20 * t + 10);
  },

  // Sine
  easeInSine:    (t) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine:   (t) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,

  // Back (overshoot)
  easeOutBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeInOutBack: (t) => {
    const c1 = 1.70158, c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  // Elastic
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

// ── Core interpolation helpers ──────────────────────────────────────────────

// Clamp a value to [min, max]
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// interpolate([0, 0.5, 1], [0, 100, 50], ease?) -> fn(t)
// Popmotion-style: linearly maps t across input keyframes to output values,
// with optional easing per segment (single fn or array of fns).
function interpolate(input, output, ease = Easing.linear) {
  return (t) => {
    if (t <= input[0]) return output[0];
    if (t >= input[input.length - 1]) return output[output.length - 1];
    for (let i = 0; i < input.length - 1; i++) {
      if (t >= input[i] && t <= input[i + 1]) {
        const span = input[i + 1] - input[i];
        const local = span === 0 ? 0 : (t - input[i]) / span;
        const easeFn = Array.isArray(ease) ? (ease[i] || Easing.linear) : ease;
        const eased = easeFn(local);
        return output[i] + (output[i + 1] - output[i]) * eased;
      }
    }
    return output[output.length - 1];
  };
}

// animate({from, to, start, end, ease})(t) — simpler single-segment tween.
// Returns \`from\` before \`start\`, \`to\` after \`end\`.
function animate({ from = 0, to = 1, start = 0, end = 1, ease = Easing.easeInOutCubic }) {
  return (t) => {
    if (t <= start) return from;
    if (t >= end) return to;
    const local = (t - start) / (end - start);
    return from + (to - from) * ease(local);
  };
}

// ── Timeline context ────────────────────────────────────────────────────────

const TimelineContext = React.createContext({ time: 0, duration: 10, playing: false });

const useTime = () => React.useContext(TimelineContext).time;
const useTimeline = () => React.useContext(TimelineContext);

// ── Sprite ──────────────────────────────────────────────────────────────────
// Renders children only when the playhead is inside [start, end]. Provides
// a sub-context with \`localTime\` (seconds since start) and \`progress\` (0..1).
//
//   <Sprite start={2} end={5}>
//     {({ localTime, progress }) => <Thing x={progress * 100} />}
//   </Sprite>
//
// Or as a plain wrapper — children can call useSprite() themselves.

const SpriteContext = React.createContext({ localTime: 0, progress: 0, duration: 0 });
const useSprite = () => React.useContext(SpriteContext);

function Sprite({ start = 0, end = Infinity, children, keepMounted = false }) {
  const { time } = useTimeline();
  const visible = time >= start && time <= end;
  if (!visible && !keepMounted) return null;

  const duration = end - start;
  const localTime = Math.max(0, time - start);
  const progress = duration > 0 && isFinite(duration)
    ? clamp(localTime / duration, 0, 1)
    : 0;

  const value = { localTime, progress, duration, visible };

  return (
    <SpriteContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </SpriteContext.Provider>
  );
}

// ── Sample sprite components ────────────────────────────────────────────────

// TextSprite: fades/slides text in on entry, holds, then fades out on exit.
// Props: text, x, y, size, color, font, entryDur, exitDur, align
function TextSprite({
  text,
  x = 0, y = 0,
  size = 48,
  color = '#111',
  font = 'Inter, system-ui, sans-serif',
  weight = 600,
  entryDur = 0.45,
  exitDur = 0.35,
  entryEase = Easing.easeOutBack,
  exitEase = Easing.easeInCubic,
  align = 'left',
  letterSpacing = '-0.01em',
}) {
  const { localTime, duration } = useSprite();
  const exitStart = Math.max(0, duration - exitDur);

  let opacity = 1;
  let ty = 0;

  if (localTime < entryDur) {
    const t = entryEase(clamp(localTime / entryDur, 0, 1));
    opacity = t;
    ty = (1 - t) * 16;
  } else if (localTime > exitStart) {
    const t = exitEase(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    ty = -t * 8;
  }

  const translateX = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      transform: \`translate(\${translateX}, \${ty}px)\`,
      opacity,
      fontFamily: font,
      fontSize: size,
      fontWeight: weight,
      color,
      letterSpacing,
      whiteSpace: 'pre',
      lineHeight: 1.1,
      willChange: 'transform, opacity',
    }}>
      {text}
    </div>
  );
}

// ImageSprite: scales + fades in; optional Ken Burns drift during hold.
function ImageSprite({
  src,
  x = 0, y = 0,
  width = 400, height = 300,
  entryDur = 0.6,
  exitDur = 0.4,
  kenBurns = false,
  kenBurnsScale = 1.08,
  radius = 12,
  fit = 'cover',
  placeholder = null, // {label: string} for striped placeholder
}) {
  const { localTime, duration } = useSprite();
  const exitStart = Math.max(0, duration - exitDur);

  let opacity = 1;
  let scale = 1;

  if (localTime < entryDur) {
    const t = Easing.easeOutCubic(clamp(localTime / entryDur, 0, 1));
    opacity = t;
    scale = 0.96 + 0.04 * t;
  } else if (localTime > exitStart) {
    const t = Easing.easeInCubic(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    scale = (kenBurns ? kenBurnsScale : 1) + 0.02 * t;
  } else if (kenBurns) {
    const holdSpan = exitStart - entryDur;
    const holdT = holdSpan > 0 ? (localTime - entryDur) / holdSpan : 0;
    scale = 1 + (kenBurnsScale - 1) * holdT;
  }

  const content = placeholder ? (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'repeating-linear-gradient(135deg, #e9e6df 0 10px, #dcd8cf 10px 20px)',
      color: '#6b6458',
      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      fontSize: 13,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      {placeholder.label || 'image'}
    </div>
  ) : (
    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: fit, display: 'block' }} />
  );

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      width, height,
      opacity,
      transform: \`scale(\${scale})\`,
      transformOrigin: 'center',
      borderRadius: radius,
      overflow: 'hidden',
      willChange: 'transform, opacity',
    }}>
      {content}
    </div>
  );
}

// RectSprite: simple rectangle that animates position/size/color via props.
// Useful demo primitive — takes a \`render\` fn for per-frame customization.
function RectSprite({
  x = 0, y = 0,
  width = 100, height = 100,
  color = '#111',
  radius = 8,
  entryDur = 0.4,
  exitDur = 0.3,
  render, // optional: (ctx) => style overrides
}) {
  const spriteCtx = useSprite();
  const { localTime, duration } = spriteCtx;
  const exitStart = Math.max(0, duration - exitDur);

  let opacity = 1;
  let scale = 1;

  if (localTime < entryDur) {
    const t = Easing.easeOutBack(clamp(localTime / entryDur, 0, 1));
    opacity = clamp(localTime / entryDur, 0, 1);
    scale = 0.4 + 0.6 * t;
  } else if (localTime > exitStart) {
    const t = Easing.easeInQuad(clamp((localTime - exitStart) / exitDur, 0, 1));
    opacity = 1 - t;
    scale = 1 - 0.15 * t;
  }

  const overrides = render ? render(spriteCtx) : {};

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      width, height,
      background: color,
      borderRadius: radius,
      opacity,
      transform: \`scale(\${scale})\`,
      transformOrigin: 'center',
      willChange: 'transform, opacity',
      ...overrides,
    }} />
  );
}


// ── Font inlining ───────────────────────────────────────────────────────────
// Copy every @font-face rule from the page into a <style> inside the svg's
// foreignObject, with font URLs rewritten to data: URLs. Makes the svg
// self-describing so serializing it alone (video export fast path) still
// renders with the right fonts. Sets data-om-fonts-inlined on the svg when
// done so the exporter can wait for it.

function useInlineFontsInto(svgRef) {
  React.useEffect(() => {
    const svg = svgRef.current;
    const host = svg && svg.querySelector('foreignObject > div');
    if (!svg || !host) return;
    let cancelled = false;
    (async () => {
      const rules = [];
      for (const ss of document.styleSheets) {
        let cssRules;
        try { cssRules = ss.cssRules; } catch {
          // Cross-origin sheet without crossorigin attr (e.g. the standard
          // fonts.googleapis.com <link>) — fetch the CSS text directly and
          // regex-extract the @font-face blocks.
          if (ss.href) {
            try {
              const txt = await fetch(ss.href).then(r => { if (!r.ok) throw 0; return r.text(); });
              for (const ff of (txt.match(/@font-face\\s*{[^}]*}/g) || []))
                rules.push({ css: ff, base: ss.href });
            } catch {}
          }
          continue;
        }
        if (!cssRules) continue;
        for (const r of cssRules) {
          if (r.type === CSSRule.FONT_FACE_RULE) {
            rules.push({ css: r.cssText, base: ss.href || location.href });
          }
        }
      }
      const toDataURL = (url) => fetch(url)
        .then(r => { if (!r.ok) throw 0; return r.blob(); })
        .then(b => new Promise(res => {
          const fr = new FileReader();
          fr.onload = () => res(fr.result);
          fr.onerror = () => res(url);
          fr.readAsDataURL(b);
        }))
        .catch(() => url);
      const parts = await Promise.all(rules.map(async ({ css, base }) => {
        const re = /url\\((['"]?)([^'")]+)\\1\\)/g;
        let out = css, m;
        while ((m = re.exec(css))) {
          const u = m[2];
          if (u.startsWith('data:')) continue;
          let abs; try { abs = new URL(u, base).href; } catch { continue; }
          out = out.split(m[0]).join(\`url("\${await toDataURL(abs)}")\`);
        }
        return out;
      }));
      if (cancelled || !parts.length) {
        svg.setAttribute('data-om-fonts-inlined', 'true');
        return;
      }
      const style = document.createElement('style');
      style.textContent = parts.join('\\n');
      host.insertBefore(style, host.firstChild);
      svg.setAttribute('data-om-fonts-inlined', 'true');
    })();
    return () => { cancelled = true; };
  }, []);
}


function Stage({
  width = 1280,
  height = 720,
  duration = 10,
  background = '#f6f4ef',
  fps = 60,
  loop = true,
  autoplay = true,
  persistKey = 'animstage',
  children,
}) {
  // Props arrive as strings when Stage is mounted via <x-import> (DC
  // projects) — coerce so style={{width}} gets a number React can px-ify.
  width = +width || 1280; height = +height || 720;
  duration = +duration || 10; fps = +fps || 60;
  if (typeof loop === 'string') loop = loop !== 'false';
  if (typeof autoplay === 'string') autoplay = autoplay !== 'false';

  const [time, setTime] = React.useState(() => {
    try {
      const v = parseFloat(localStorage.getItem(persistKey + ':t') || '0');
      return isFinite(v) ? clamp(v, 0, duration) : 0;
    } catch { return 0; }
  });
  const [playing, setPlaying] = React.useState(autoplay);
  const [hoverTime, setHoverTime] = React.useState(null);
  const [scale, setScale] = React.useState(1);

  const stageRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const lastTsRef = React.useRef(null);

  // Persist playhead
  React.useEffect(() => {
    try { localStorage.setItem(persistKey + ':t', String(time)); } catch {}
  }, [time, persistKey]);

  // Auto-scale to fit viewport
  React.useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const measure = () => {
      const barH = 44; // playback bar height
      const s = Math.min(
        el.clientWidth / width,
        (el.clientHeight - barH) / height
      );
      setScale(Math.max(0.05, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [width, height]);

  // Animation loop
  React.useEffect(() => {
    if (!playing) {
      lastTsRef.current = null;
      return;
    }
    const step = (ts) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime((t) => {
        let next = t + dt;
        if (next >= duration) {
          if (loop) next = next % duration;
          else { next = duration; setPlaying(false); }
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [playing, duration, loop]);

  // Keyboard: space = play/pause, ← → = seek
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying(p => !p);
      } else if (e.code === 'ArrowLeft') {
        setTime(t => clamp(t - (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.code === 'ArrowRight') {
        setTime(t => clamp(t + (e.shiftKey ? 1 : 0.1), 0, duration));
      } else if (e.key === '0' || e.code === 'Home') {
        setTime(0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [duration]);

  // Video-export protocol: the exporter dispatches this event per frame;
  // pause + sync the playhead so the capture sees exactly that timestamp.
  React.useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onSeek = (e) => {
      setPlaying(false);
      setTime(clamp(e.detail.time, 0, duration));
    };
    el.addEventListener('data-om-seek-to-time-frame', onSeek);
    return () => el.removeEventListener('data-om-seek-to-time-frame', onSeek);
  }, [duration]);

  // Inline @font-face rules into the svg's foreignObject so the svg is
  // self-describing — serializing it alone (for video export) then renders
  // with the right fonts. Sets data-om-fonts-inlined once done.
  useInlineFontsInto(canvasRef);

  const displayTime = hoverTime != null ? hoverTime : time;

  const ctxValue = React.useMemo(
    () => ({ time: displayTime, duration, playing, setTime, setPlaying }),
    [displayTime, duration, playing]
  );

  return (
    <div
      ref={stageRef}
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        background: '#0a0a0a',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Canvas area — vertically centered in remaining space */}
      <div style={{
        flex: 1,
        width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        <svg
          ref={canvasRef}
          width={width} height={height}
          data-om-exportable-video-with-duration-secs={duration}
          style={{
            transform: \`scale(\${scale})\`,
            transformOrigin: 'center',
            flexShrink: 0,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            display: 'block',
          }}
        >
          <foreignObject x="0" y="0" width="100%" height="100%">
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              style={{
                width, height,
                background,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <TimelineContext.Provider value={ctxValue}>
                {children}
              </TimelineContext.Provider>
            </div>
          </foreignObject>
        </svg>
      </div>

      {/* Playback bar — stacked below canvas, never overlapping */}
      <PlaybackBar
        time={displayTime}
        actualTime={time}
        duration={duration}
        playing={playing}
        onPlayPause={() => setPlaying(p => !p)}
        onReset={() => { setTime(0); }}
        onSeek={(t) => setTime(t)}
        onHover={(t) => setHoverTime(t)}
      />
    </div>
  );
}

// ── Playback bar ────────────────────────────────────────────────────────────
// Play/pause, return-to-begin, scrub track, time display.
// Uses fixed-width time fields so layout doesn't thrash.

function PlaybackBar({ time, duration, playing, onPlayPause, onReset, onSeek, onHover }) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);

  const timeFromEvent = React.useCallback((e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    return x * duration;
  }, [duration]);

  const onTrackMove = (e) => {
    if (!trackRef.current) return;
    const t = timeFromEvent(e);
    if (dragging) {
      onSeek(t);
    } else {
      onHover(t);
    }
  };

  const onTrackLeave = () => {
    if (!dragging) onHover(null);
  };

  const onTrackDown = (e) => {
    setDragging(true);
    const t = timeFromEvent(e);
    onSeek(t);
    onHover(null);
  };

  React.useEffect(() => {
    if (!dragging) return;
    const onUp = () => setDragging(false);
    const onMove = (e) => {
      if (!trackRef.current) return;
      const t = timeFromEvent(e);
      onSeek(t);
    };
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, [dragging, timeFromEvent, onSeek]);

  const pct = duration > 0 ? (time / duration) * 100 : 0;
  const fmt = (t) => {
    const total = Math.max(0, t);
    const m = Math.floor(total / 60);
    const s = Math.floor(total % 60);
    const cs = Math.floor((total * 100) % 100);
    return \`\${String(m).padStart(1, '0')}:\${String(s).padStart(2, '0')}.\${String(cs).padStart(2, '0')}\`;
  };

  const mono = 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace';

  return (
    <div data-omelette-chrome style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 16px',
      background: 'rgba(20,20,20,0.92)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      width: '100%',
      maxWidth: 680,
      alignSelf: 'center',

      borderRadius: 8,
      color: '#f6f4ef',
      fontFamily: 'Inter, system-ui, sans-serif',
      userSelect: 'none',
      flexShrink: 0,
    }}>
      <IconButton onClick={onReset} title="Return to start (0)">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 2v10M12 2L5 7l7 5V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
        </svg>
      </IconButton>
      <IconButton onClick={onPlayPause} title="Play/pause (space)">
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="3" y="2" width="3" height="10" fill="currentColor"/>
            <rect x="8" y="2" width="3" height="10" fill="currentColor"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 2l9 5-9 5V2z" fill="currentColor"/>
          </svg>
        )}
      </IconButton>

      {/* Current time: fixed width so it doesn't thrash */}
      <div style={{
        fontFamily: mono,
        fontSize: 12,
        fontVariantNumeric: 'tabular-nums',
        width: 64, textAlign: 'right',
        color: '#f6f4ef',
      }}>
        {fmt(time)}
      </div>

      {/* Scrub track */}
      <div
        ref={trackRef}
        onMouseMove={onTrackMove}
        onMouseLeave={onTrackLeave}
        onMouseDown={onTrackDown}
        style={{
          flex: 1,
          height: 22,
          position: 'relative',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center',
        }}
      >
        <div style={{
          position: 'absolute',
          left: 0, right: 0, height: 4,
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 2,
        }}/>
        <div style={{
          position: 'absolute',
          left: 0, width: \`\${pct}%\`, height: 4,
          background: 'oklch(72% 0.12 250)',
          borderRadius: 2,
        }}/>
        <div style={{
          position: 'absolute',
          left: \`\${pct}%\`, top: '50%',
          width: 12, height: 12,
          marginLeft: -6, marginTop: -6,
          background: '#fff',
          borderRadius: 6,
          boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
        }}/>
      </div>

      {/* Duration: fixed width */}
      <div style={{
        fontFamily: mono,
        fontSize: 12,
        fontVariantNumeric: 'tabular-nums',
        width: 64, textAlign: 'left',
        color: 'rgba(246,244,239,0.55)',
      }}>
        {fmt(duration)}
      </div>

      {typeof VideoEncoder !== 'undefined' && (
        <IconButton
          title="Export video"
          onClick={() => window.parent.postMessage({ type: 'omelette:request-video-export' }, '*')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v7m0 0L4 6m3 3l3-3M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </IconButton>
      )}
    </div>
  );
}

function IconButton({ children, onClick, title }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 6,
        color: '#f6f4ef',
        cursor: 'pointer',
        padding: 0,
        transition: 'background 120ms',
      }}
    >
      {children}
    </button>
  );
}


// ── VideoSprite ─────────────────────────────────────────────────────────────
// Renders a <video> that loops within [start,end] of its source at \`speed\`,
// kept in sync with the Stage's playhead. Carries the
// data-om-exportable-video-play-* attrs so video export can mix its audio.
//
//   <VideoSprite src="clip.mp4" start={2} end={5} speed={1}
//     style={{ width: 640, height: 360 }} />

function VideoSprite({ src, start = 0, end, speed = 1, style, ...rest }) {
  start = +start || 0; speed = +speed || 1;
  if (end != null) end = +end || undefined;
  const t = useTime();
  const ref = React.useRef(null);
  const span = Math.max(0.001, ((end ?? start + 1) - start));
  React.useEffect(() => {
    const v = ref.current;
    if (!v || v.readyState < 1) return;
    const target = start + ((t * speed) % span);
    if (Math.abs(v.currentTime - target) > 0.05) v.currentTime = target;
  }, [t, start, span, speed]);
  return (
    <video
      ref={ref}
      src={src}
      muted playsInline preload="auto"
      data-om-exportable-video-play-start={start}
      data-om-exportable-video-play-end={end ?? start + span}
      data-om-exportable-video-play-speed={speed}
      style={{ display: 'block', objectFit: 'cover', ...style }}
      {...rest}
    />
  );
}


Object.assign(window, {
  Easing, interpolate, animate, clamp,
  TimelineContext, useTime, useTimeline,
  Sprite, SpriteContext, useSprite,
  TextSprite, ImageSprite, RectSprite, VideoSprite,
  Stage, PlaybackBar,
});

`,
    sn = `
/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = \`
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
\`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => ({ ...prev, ...edits }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', { detail: edits }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({ title = 'Tweaks', children }) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({ x: 16, y: 16 });
  const PAD = 16;

  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);

  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);

  React.useEffect(() => {
    const onMsg = (e) => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);
      else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  };

  const onDragStart = (e) => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev) => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!open) return null;
  return (
    <>
      <style>{__TWEAKS_STYLE}</style>
      <div ref={dragRef} className="twk-panel" data-omelette-chrome=""
           style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}>
        <div className="twk-hd" onMouseDown={onDragStart}>
          <b>{title}</b>
          <button className="twk-x" aria-label="Close tweaks"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={dismiss}>✕</button>
        </div>
        <div className="twk-body">
          {children}
        </div>
      </div>
    </>
  );
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({ label, children }) {
  return (
    <>
      <div className="twk-sect">{label}</div>
      {children}
    </>
  );
}

function TweakRow({ label, value, children, inline = false }) {
  return (
    <div className={inline ? 'twk-row twk-row-h' : 'twk-row'}>
      <div className="twk-lbl">
        <span>{label}</span>
        {value != null && <span className="twk-val">{value}</span>}
      </div>
      {children}
    </div>
  );
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({ label, value, min = 0, max = 100, step = 1, unit = '', onChange }) {
  return (
    <TweakRow label={label} value={\`\${value}\${unit}\`}>
      <input type="range" className="twk-slider" min={min} max={max} step={step}
             value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </TweakRow>
  );
}

function TweakToggle({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <button type="button" className="twk-toggle" data-on={value ? '1' : '0'}
              role="switch" aria-checked={!!value}
              onClick={() => onChange(!value)}><i /></button>
    </div>
  );
}

function TweakRadio({ label, value, options, onChange }) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = (o) => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({ 2: 16, 3: 10 }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = (s) => {
      const m = options.find((o) => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return <TweakSelect label={label} value={value} options={options}
                        onChange={(s) => onChange(resolve(s))} />;
  }
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
  const idx = Math.max(0, opts.findIndex((o) => o.value === value));
  const n = opts.length;

  const segAt = (clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor(((clientX - r.left - 2) / inner) * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };

  const onPointerDown = (e) => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = (ev) => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <TweakRow label={label}>
      <div ref={trackRef} role="radiogroup" onPointerDown={onPointerDown}
           className={dragging ? 'twk-seg dragging' : 'twk-seg'}>
        <div className="twk-seg-thumb"
             style={{ left: \`calc(2px + \${idx} * (100% - 4px) / \${n})\`,
                      width: \`calc((100% - 4px) / \${n})\` }} />
        {opts.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={o.value === value}>
            {o.label}
          </button>
        ))}
      </div>
    </TweakRow>
  );
}

function TweakSelect({ label, value, options, onChange }) {
  return (
    <TweakRow label={label}>
      <select className="twk-field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const v = typeof o === 'object' ? o.value : o;
          const l = typeof o === 'object' ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </TweakRow>
  );
}

function TweakText({ label, value, placeholder, onChange }) {
  return (
    <TweakRow label={label}>
      <input className="twk-field" type="text" value={value} placeholder={placeholder}
             onChange={(e) => onChange(e.target.value)} />
    </TweakRow>
  );
}

function TweakNumber({ label, value, min, max, step = 1, unit = '', onChange }) {
  const clamp = (n) => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({ x: 0, val: 0 });
  const onScrubStart = (e) => {
    e.preventDefault();
    startRef.current = { x: e.clientX, val: value };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = (ev) => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return (
    <div className="twk-num">
      <span className="twk-num-lbl" onPointerDown={onScrubStart}>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
             onChange={(e) => onChange(clamp(Number(e.target.value)))} />
      {unit && <span className="twk-num-unit">{unit}</span>}
    </div>
  );
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}

const __TwkCheck = ({ light }) => (
  <svg viewBox="0 0 14 14" aria-hidden="true">
    <path d="M3 7.2 5.8 10 11 4.2" fill="none" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"
          stroke={light ? 'rgba(0,0,0,.78)' : '#fff'} />
  </svg>
);

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({ label, value, options, onChange }) {
  if (!options || !options.length) {
    return (
      <div className="twk-row twk-row-h">
        <div className="twk-lbl"><span>{label}</span></div>
        <input type="color" className="twk-swatch" value={value}
               onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = (o) => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return (
    <TweakRow label={label}>
      <div className="twk-chips" role="radiogroup">
        {options.map((o, i) => {
          const colors = Array.isArray(o) ? o : [o];
          const [hero, ...rest] = colors;
          const sup = rest.slice(0, 4);
          const on = key(o) === cur;
          return (
            <button key={i} type="button" className="twk-chip" role="radio"
                    aria-checked={on} data-on={on ? '1' : '0'}
                    aria-label={colors.join(', ')} title={colors.join(' · ')}
                    style={{ background: hero }}
                    onClick={() => onChange(o)}>
              {sup.length > 0 && (
                <span>
                  {sup.map((c, j) => <i key={j} style={{ background: c }} />)}
                </span>
              )}
              {on && <__TwkCheck light={__twkIsLight(hero)} />}
            </button>
          );
        })}
      </div>
    </TweakRow>
  );
}

function TweakButton({ label, onClick, secondary = false }) {
  return (
    <button type="button" className={secondary ? 'twk-btn secondary' : 'twk-btn'}
            onClick={onClick}>{label}</button>
  );
}

Object.assign(window, {
  useTweaks, TweaksPanel, TweakSection, TweakRow,
  TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakText, TweakNumber, TweakColor, TweakButton,
});
`,
    cn = `
// ── TweakSuggestionBar (flag-gated addon) ───────────────────────────────────
(function () {
  const s = document.createElement('style');
  s.textContent = \`
    @keyframes twk-blink{50%{opacity:0}}
    @keyframes twk-fadein{from{opacity:0;transform:translateX(4px)}to{opacity:1;transform:none}}
    .twk-sugg{display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:8px;
      background:rgba(0,0,0,.04);border:.5px solid rgba(0,0,0,.06);transition:all .15s}
    .twk-sugg:focus-within{background:rgba(0,0,0,.06);border-color:rgba(0,0,0,.12)}
    .twk-sugg-field{position:relative;flex:1;min-width:0}
    .twk-sugg-field input{width:100%;height:20px;border:0;background:transparent;
      font:inherit;outline:none;color:inherit}
    .twk-sugg-ghost{position:absolute;inset:0;display:flex;align-items:center;
      color:rgba(41,38,27,.42);pointer-events:none;white-space:nowrap;overflow:hidden}
    .twk-sugg-ghost.hint{color:rgba(41,38,27,.28)}
    .twk-sugg-caret{display:inline-block;width:1px;height:13px;margin-left:1px;
      border-right:1.5px solid currentColor;opacity:.5;animation:twk-blink 1s step-end infinite}
    .twk-sugg-ideas{appearance:none;border:0;background:transparent;font:inherit;
      font-size:10.5px;font-weight:600;color:rgba(41,38,27,.6);cursor:default;padding:0 2px;
      white-space:nowrap;animation:twk-fadein .25s ease}
    .twk-sugg-ideas:hover{color:rgba(41,38,27,.85)}
    .twk-sugg-ideas svg{color:#D97757}
    .twk-sugg-send{appearance:none;border:0;height:20px;padding:0 8px;border-radius:5px;
      background:#29261b;color:#fff;font:inherit;font-size:10px;font-weight:600;cursor:default}
  \`;
  document.head.appendChild(s);
})();

const __twkSendChat = (text, kind) =>
  window.parent.postMessage({ type: '__edit_mode_chat', text, kind }, '*');

const __TWK_SPARK_PATH = 'M18.3658 62.2435L36.7823 51.9165L37.0858 51.012L36.7823 50.5083H35.8716L32.7853 50.3206L22.2616 50.0389L13.1546 49.6634L4.30054 49.194L2.07438 48.7246L0 45.9551L0.202378 44.5938L2.07438 43.3264L4.75589 43.5611L10.6755 43.9836L19.5801 44.5938L26.0056 44.9693L35.568 45.9551H37.0858L37.2882 45.3448L36.7823 44.9693L36.3775 44.5938L27.1693 38.3507L17.2022 31.7789L11.9909 27.9767L9.20822 26.0522L7.79157 24.2684L7.18443 20.3254L9.71416 17.5089L13.1546 17.7436L14.0147 17.9783L17.5057 20.654L24.9431 26.4277L34.6573 33.5627L36.0739 34.7362L36.6444 34.3512L36.7317 34.079L36.0739 32.9994L30.8121 23.4704L25.1961 13.7537L22.6664 9.71675L22.0086 7.32277C21.7539 6.31812 21.6039 5.48695 21.6039 4.45938L24.4878 0.516349L26.1068 0L30.0026 0.516349L31.6216 1.92457L34.0502 7.46359L37.9459 16.1476L44.0173 27.9767L45.7881 31.4973L46.7494 34.7362L47.1036 35.722H47.7107V35.1587L48.2166 28.4931L49.1274 20.3254L50.0381 9.81063L50.3416 6.85336L51.8089 3.28586L54.7434 1.36128L57.0201 2.44092L58.8921 5.11655L58.6391 6.85336L57.5261 14.0822L55.3505 25.395L53.9338 32.9994H54.7434L55.7047 32.0136L59.5498 26.944L65.9753 18.8702L68.8086 15.6782L72.1479 12.1577L74.2729 10.4678H78.3204L81.2549 14.8802L79.9395 19.4335L75.7907 24.6909L72.3503 29.1503L67.4173 35.7593L64.3563 41.0732L64.6308 41.5116L65.3682 41.4487L76.499 39.0548L82.5198 37.9751L89.7042 36.7547L92.9423 38.2568L93.2964 39.8058L92.0316 42.9509L84.3412 44.8285L75.3354 46.6592L61.9245 49.8162L61.776 49.9356L61.9513 50.1956L67.9991 50.743L70.5795 50.8839H76.9038L88.6923 51.7757L91.7786 53.7942L93.6 56.282L93.2964 58.2066L88.5405 60.6006L82.1656 59.0985L67.2402 55.531L62.1302 54.2636H61.4218V54.6861L65.6718 58.8638L73.514 65.9049L83.2787 75.0114L83.7846 77.2646L82.5198 79.0483L81.2043 78.8606L72.6032 72.3827L69.264 69.4724L61.776 63.1354H61.2701V63.7926L62.9903 66.3274L72.1479 80.081L72.6032 84.3057L71.9455 85.667L69.5676 86.5119L66.9872 86.0425L61.5736 78.4851L56.0588 70.0357L51.6065 62.4313L51.0687 62.7708L48.419 91.0652L47.2048 92.5204L44.3715 93.6L41.9935 91.8162L40.7286 88.9059L41.9935 83.1322L43.5114 75.6217L44.7256 69.6602L45.8387 62.2435L46.5185 59.7659L46.4584 59.6001L45.9153 59.6914L40.3239 67.3601L31.824 78.8606L25.0949 86.0425L23.4759 86.6997L20.6932 85.2445L20.9462 82.6628L22.5146 80.3627L31.824 68.5336L37.44 61.1639L41.0595 56.9335L41.0243 56.3216L40.8245 56.3046L16.0891 72.4297L11.6874 72.993L9.76476 71.2092L10.0177 68.2989L10.9284 67.3601L18.3658 62.2435Z';

function ClaudeSpark({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 94 94" fill="currentColor"
         style={{ display: 'inline-block', verticalAlign: '-1px' }}>
      <path d={__TWK_SPARK_PATH} />
    </svg>
  );
}

// Typewriter-cycles through \`suggestions\`. Clicking the field while a
// suggestion is animating freezes it as ghost text; Tab accepts it into the
// input. Enter posts __edit_mode_chat (host drops the text into the chat
// composer for the user to send). After the cycle the static placeholder
// types in and "Ideas" appears — clicking asks for three more suggestions.
function TweakSuggestionBar({
  suggestions = [],
  placeholder = 'Describe a tweak…',
  ideasPrompt = 'Suggest three more tweak ideas for this design and update the suggestions on TweakSuggestionBar.',
}) {
  const [val, setVal] = React.useState('');
  const [ghost, setGhost] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef(null);
  const tw = useTwkTypewriter(suggestions, { placeholder, enabled: !val && !ghost && !focused });

  // Impression (telemetry only): once per session. Tweak-value writes
  // reload the guest frame, so an undeduped effect would fire per slider
  // drag; the typewriter's __twk_played key is per-suggestion-set and
  // doesn't cover the regenerated-ideas case.
  React.useEffect(() => {
    try {
      if (sessionStorage.getItem('__twk_bar_seen') === '1') return;
      sessionStorage.setItem('__twk_bar_seen', '1');
    } catch {}
    window.parent.postMessage({ type: '__edit_mode_bar_shown' }, '*');
  }, []);

  const freeze = () => {
    tw.markPlayed();
    if (val || ghost) return;
    const target = !tw.done ? suggestions[tw.idx] : '';
    if (target) setGhost(target);
    inputRef.current?.focus();
  };

  const submit = () => {
    const v = (val || ghost).trim();
    if (!v) return;
    // 'suggestion' = one of the model-authored items (verbatim ghost, or
    // Tab-accepted then sent unedited). Anything else is the user's words.
    const kind = suggestions.includes(v) ? 'suggestion' : 'freetext';
    __twkSendChat(v, kind);
    setVal('');
    setGhost('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Tab' && ghost && !val) {
      e.preventDefault();
      setVal(ghost);
      setGhost('');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape') {
      setGhost('');
    }
  };

  const requestIdeas = () => __twkSendChat(ideasPrompt, 'ideas');

  const showAnim = !val && !ghost && !focused && !tw.done;
  const showStatic = !val && !ghost && !focused && tw.done;

  return (
    <div className="twk-sugg" onMouseDown={freeze}>
      <div className="twk-sugg-field">
        <input
          ref={inputRef}
          value={val}
          placeholder={focused && !ghost ? placeholder : ''}
          onChange={(e) => { setVal(e.target.value); setGhost(''); }}
          onFocus={() => { setFocused(true); tw.markPlayed(); }}
          onBlur={() => { setFocused(false); if (!val) setGhost(''); }}
          onKeyDown={onKeyDown}
        />
        {showAnim && (
          <div className="twk-sugg-ghost">
            {tw.text}<span className="twk-sugg-caret" />
          </div>
        )}
        {showStatic && (
          <div className="twk-sugg-ghost">
            {tw.tail}{tw.tail.length < placeholder.length && <span className="twk-sugg-caret" />}
          </div>
        )}
        {ghost && !val && (
          <div className="twk-sugg-ghost hint">{ghost}</div>
        )}
      </div>
      {val || ghost ? (
        <button className="twk-sugg-send"
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                onClick={submit}>
          Add
        </button>
      ) : tw.done && !focused ? (
        <button className="twk-sugg-ideas"
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                onClick={requestIdeas}>
          Ideas <ClaudeSpark />
        </button>
      ) : null}
    </div>
  );
}

// Minimal type→pause→erase cycler. Plays once per unique \`items\` content per
// session — a reload from a tweak-value write skips straight to done; a new
// suggestion set (after "Ideas") gets a fresh animation.
function useTwkTypewriter(items, { placeholder, typeMs = 35, eraseMs = 22, pauseMs = 1800, enabled = true } = {}) {
  const key = React.useMemo(() => '__twk_played:' + JSON.stringify(items), [items.join('\\n')]);
  const played = () => { try { return sessionStorage.getItem(key) === '1'; } catch { return false; } };

  const [text, setText] = React.useState('');
  const [tail, setTail] = React.useState(() => (items.length === 0 || played() ? placeholder : ''));
  const [idx, setIdx] = React.useState(0);
  const [done, setDone] = React.useState(() => items.length === 0 || played());
  const phase = React.useRef('type');
  const n = React.useRef(0);

  const markPlayed = React.useCallback(() => {
    try { sessionStorage.setItem(key, '1'); } catch {}
    setDone(true);
  }, [key]);

  React.useEffect(() => {
    const skip = items.length === 0 || played();
    setText(''); setIdx(0);
    setDone(skip);
    setTail(skip ? placeholder : '');
    phase.current = 'type'; n.current = 0;
  }, [key]);

  React.useEffect(() => {
    if (done || !enabled) return;
    const item = items[idx] ?? '';
    let t;
    const tick = () => {
      if (phase.current === 'type') {
        n.current++;
        setText(item.slice(0, n.current));
        if (n.current >= item.length) { phase.current = 'pause'; t = setTimeout(tick, pauseMs); }
        else t = setTimeout(tick, typeMs + Math.random() * 20);
      } else if (phase.current === 'pause') {
        phase.current = 'erase'; t = setTimeout(tick, eraseMs);
      } else {
        n.current--;
        setText(item.slice(0, n.current));
        if (n.current <= 0) {
          if (idx === items.length - 1) { markPlayed(); return; }
          phase.current = 'type'; setIdx((i) => i + 1);
        } else t = setTimeout(tick, eraseMs);
      }
    };
    phase.current = 'type'; n.current = 0; setText('');
    t = setTimeout(tick, 400);
    return () => clearTimeout(t);
  }, [idx, done, key, enabled, typeMs, eraseMs, pauseMs]);

  React.useEffect(() => {
    if (!done || tail === placeholder) return;
    let i = 0;
    const t = setInterval(() => {
      i++; setTail(placeholder.slice(0, i));
      if (i >= placeholder.length) clearInterval(t);
    }, 28);
    return () => clearInterval(t);
  }, [done, placeholder]);

  return { text, tail, idx, done, markPlayed };
}

Object.assign(window, { TweakSuggestionBar });
`,
    ln = `/* BEGIN USAGE */
/**
 * <deck-stage> — reusable web component for HTML decks.
 *
 * Handles:
 *  (a) speaker notes — reads <script type="application/json" id="speaker-notes">
 *      and posts {slideIndexChanged: N} to the parent window on nav.
 *  (b) keyboard navigation — ←/→, PgUp/PgDn, Space, Home/End, number keys.
 *      On touch devices, tapping the left/right half of the stage goes
 *      prev/next — taps on links, buttons and other interactive slide
 *      content are left alone.
 *  (c) press R to reset to slide 0 (with a tasteful keyboard hint).
 *  (d) bottom-center overlay showing slide count + hints, fades out on idle.
 *  (e) auto-scaling — inner canvas is a fixed design size (default 1920×1080)
 *      scaled with \`transform: scale()\` to fit the viewport, letterboxed.
 *      Set the \`noscale\` attribute to render at authored size (1:1) — the
 *      PPTX exporter sets this so its DOM capture sees unscaled geometry.
 *  (f) print — \`@media print\` lays every slide out as its own page at the
 *      design size, so the browser's Print → Save as PDF produces a clean
 *      one-page-per-slide PDF with no extra setup.
 *  (g) thumbnail rail — resizable left-hand column of per-slide thumbnails
 *      (static clones). Click to navigate; ↑/↓ with a thumbnail focused to
 *      step between slides; drag to reorder; right-click for
 *      Skip / Move up / Move down / Duplicate / Delete (Delete opens a
 *      Cancel/Delete confirm dialog). Drag the rail's right edge to resize;
 *      width persists to
 *      localStorage. Skipped slides carry \`data-deck-skip\`, are dimmed in
 *      the rail, omitted from prev/next navigation, and hidden at print.
 *      The rail is suppressed in presenting mode, in the host's Preview
 *      mode (ViewerMode='none'), on \`noscale\`, on narrow viewports
 *      (≤640px), and via the \`no-rail\` attribute. Rail mutations dispatch
 *      a \`dc-op\` CustomEvent on the element (see docs/dc-ops.md) and do
 *      NOT touch the DOM: the host applies the op and re-renders;
 *      structural rail input is locked until the host posts
 *      {__dc_op_ack: true, applied}.
 *
 * Slides are HIDDEN, not unmounted. Non-active slides stay in the DOM with
 * \`visibility: hidden\` + \`opacity: 0\`, so their state (videos, iframes,
 * form inputs, React trees) is preserved across navigation.
 *
 * Lifecycle event — the component dispatches a \`slidechange\` CustomEvent on
 * itself whenever the active slide changes (including the initial mount).
 * The event bubbles and composes out of shadow DOM, so you can listen on
 * the <deck-stage> element or on document:
 *
 *   document.querySelector('deck-stage').addEventListener('slidechange', (e) => {
 *     e.detail.index         // new 0-based index
 *     e.detail.previousIndex // previous index, or -1 on init
 *     e.detail.total         // total slide count
 *     e.detail.slide         // the new active slide element
 *     e.detail.previousSlide // the prior slide element, or null on init
 *     e.detail.reason        // 'init' | 'keyboard' | 'click' | 'tap' | 'api'
 *   });
 *
 * Persistence: none at the deck level. The host app keeps the current slide
 * in its own URL (?slide=) and re-delivers it via location.hash on load, so a
 * bare load with no hash always starts at slide 1.
 *
 * Usage:
 *   <style>deck-stage:not(:defined){visibility:hidden}</style>
 *   <deck-stage width="1920" height="1080">
 *     <section data-label="Title">...</section>
 *     <section data-label="Agenda">...</section>
 *   </deck-stage>
 *   <script src="deck-stage.js"><\/script>
 *
 * The :not(:defined) rule prevents a flash of the first slide at its
 * authored styles before this script runs and attaches the shadow root.
 *
 * Slides are the direct element children of <deck-stage>. Each slide is
 * automatically tagged with:
 *   - data-screen-label="NN Label"   (1-indexed, for comment flow)
 *   - data-om-validate="no_overflowing_text,no_overlapping_text,slide_sized_text"
 *
 * Speaker notes stay in sync because the component posts {slideIndexChanged: N}
 * to the parent — just include the #speaker-notes script tag if asked for notes.
 *
 * Authoring guidance:
 *   - Write slide bodies as static HTML inside <deck-stage>, with sizing via
 *     CSS custom properties in a <style> block rather than JS constants.
 *     Static slide markup is what lets the user click a heading in edit mode
 *     and retype it directly; a slide rendered through <script type="text/babel">,
 *     React, or a loop over a JS array has to round-trip every tweak through a
 *     chat message instead. Reach for script-generated slides only when the
 *     content genuinely needs interactive behaviour static HTML can't express.
 *   - Do NOT set position/inset/width/height on the slide <section> elements —
 *     the component absolutely positions every slotted child for you.
 *   - Entrance animations: make the visible end-state the base style and
 *     animate *from* hidden, so print and reduced-motion show content.
 *     Gate the animation on [data-deck-active] and the motion query, e.g.
 *     \`@media (prefers-reduced-motion:no-preference){ [data-deck-active] .x{animation:fade-in .5s both} }\`.
 *     Avoid infinite decorative loops on slide content.
 */
/* END USAGE */

(() => {
  const DESIGN_W_DEFAULT = 1920;
  const DESIGN_H_DEFAULT = 1080;
  const OVERLAY_HIDE_MS = 1800;
  const VALIDATE_ATTR = 'no_overflowing_text,no_overlapping_text,slide_sized_text';
  const FINE_POINTER_MQ = matchMedia('(hover: hover) and (pointer: fine)');
  const NARROW_MQ = matchMedia('(max-width: 640px)');
  // Slide-authored controls that should keep a tap instead of it navigating.
  const INTERACTIVE_SEL = 'a[href], button, input, select, textarea, summary, label, video[controls], audio[controls], [role="button"], [onclick], [tabindex]:not([tabindex^="-"]), [contenteditable]:not([contenteditable="false" i])';

  const pad2 = (n) => String(n).padStart(2, '0');

  // Label precedence: data-label → data-screen-label (number stripped) → first heading → "Slide".
  const getSlideLabel = (el) => {
    const explicit = el.getAttribute('data-label');
    if (explicit) return explicit;

    const existing = el.getAttribute('data-screen-label');
    if (existing) return existing.replace(/^\\s*\\d+\\s*/, '').trim() || existing;

    const h = el.querySelector('h1, h2, h3, [data-title]');
    const t = h && (h.textContent || '').trim().slice(0, 40);
    if (t) return t;

    return 'Slide';
  };

  const stylesheet = \`
    :host {
      position: fixed;
      inset: 0;
      display: block;
      background: #000;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;
      overflow: hidden;
      -webkit-tap-highlight-color: transparent;
    }
    /* connectedCallback holds this until document.fonts.ready (capped 2s) so
     * the first visible paint has the deck's real typography + final rail
     * layout. opacity (not visibility) so the active slide can't un-hide
     * itself via the ::slotted([data-deck-active]) visibility:visible rule.
     * Only the stage/rail hide — the black :host background stays, so the
     * iframe doesn't flash the page's default white. */
    :host([data-fonts-pending]) .stage,
    :host([data-fonts-pending]) .rail { opacity: 0; pointer-events: none; }

    .stage {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .canvas {
      position: relative;
      transform-origin: center center;
      flex-shrink: 0;
      background: #fff;
      will-change: transform;
    }

    /* Slides live in light DOM (via <slot>) so authored CSS still applies.
       We absolutely position each slotted child to stack them. */
    ::slotted(*) {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      box-sizing: border-box !important;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
    }
    ::slotted([data-deck-active]) {
      opacity: 1;
      pointer-events: auto;
      visibility: visible;
    }

    .overlay {
      position: fixed;
      left: 50%;
      bottom: 22px;
      transform: translate(-50%, 6px) scale(0.92);
      filter: blur(6px);
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      background: #000;
      color: #fff;
      border-radius: 999px;
      font-size: 12px;
      font-feature-settings: "tnum" 1;
      letter-spacing: 0.01em;
      opacity: 0;
      pointer-events: none;
      transition: opacity 260ms ease, transform 260ms cubic-bezier(.2,.8,.2,1), filter 260ms ease;
      transform-origin: center bottom;
      z-index: 2147483000;
      user-select: none;
    }
    .overlay[data-visible] {
      opacity: 1;
      pointer-events: auto;
      transform: translate(-50%, 0) scale(1);
      filter: blur(0);
    }

    .btn {
      appearance: none;
      -webkit-appearance: none;
      background: transparent;
      border: 0;
      margin: 0;
      padding: 0;
      color: inherit;
      font: inherit;
      cursor: default;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      min-width: 28px;
      border-radius: 999px;
      color: rgba(255,255,255,0.72);
      transition: background 140ms ease, color 140ms ease;
      -webkit-tap-highlight-color: transparent;
    }
    .btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
    .btn:active { background: rgba(255,255,255,0.18); }
    .btn:focus { outline: none; }
    .btn:focus-visible { outline: none; }
    .btn::-moz-focus-inner { border: 0; }
    .btn svg { width: 14px; height: 14px; display: block; }
    .btn.reset {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.02em;
      padding: 0 10px 0 12px;
      gap: 6px;
      color: rgba(255,255,255,0.72);
    }
    .btn.reset .kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 10px;
      line-height: 1;
      color: rgba(255,255,255,0.88);
      background: rgba(255,255,255,0.12);
      border-radius: 4px;
    }

    .count {
      font-variant-numeric: tabular-nums;
      color: #fff;
      font-weight: 500;
      padding: 0 8px;
      min-width: 42px;
      text-align: center;
      font-size: 12px;
    }
    .count .sep { color: rgba(255,255,255,0.45); margin: 0 3px; font-weight: 400; }
    .count .total { color: rgba(255,255,255,0.55); }

    .divider {
      width: 1px;
      height: 14px;
      background: rgba(255,255,255,0.18);
      margin: 0 2px;
    }

    /* ── Thumbnail rail ──────────────────────────────────────────────────
       Fixed column on the left; each thumbnail is a static deep-clone of
       the light-DOM slide scaled into a 16:9 (or design-aspect) frame. The
       stage re-fits around it (see _fit); hidden during present / noscale
       / print so capture geometry and fullscreen output are unchanged. */
    .rail {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: var(--deck-rail-w, 188px);
      background: #141414;
      border-right: 1px solid rgba(255,255,255,0.08);
      overflow-y: auto;
      overflow-x: hidden;
      padding: 12px 10px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 2147482500;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.18) transparent;
    }
    .rail::-webkit-scrollbar { width: 8px; }
    .rail::-webkit-scrollbar-track { background: transparent; margin: 2px; }
    .rail::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.18);
      border-radius: 4px;
      border: 2px solid transparent;
      background-clip: content-box;
    }
    .rail::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.28);
      border: 2px solid transparent;
      background-clip: content-box;
    }
    :host([no-rail]) .rail,
    :host([noscale]) .rail { display: none; }
    .rail[data-presenting] { display: none; }
    @media (max-width: 640px) {
      .rail, .rail-resize { display: none; }
    }
    /* User-driven show/hide (the TweaksPanel toggle) slides instead of
       popping. Transitions are gated on :host([data-rail-anim]) — set only
       for the 200ms around the toggle — so window-resize and rail-width
       drag (which also call _fit) don't lag behind the cursor. */
    .rail[data-user-hidden] { transform: translateX(-100%); }
    :host([data-rail-anim]) .rail { transition: transform 200ms cubic-bezier(.3,.7,.4,1); }
    :host([data-rail-anim]) .stage { transition: left 200ms cubic-bezier(.3,.7,.4,1); }
    :host([data-rail-anim]) .canvas { transition: transform 200ms cubic-bezier(.3,.7,.4,1); }
    /* transition shorthand replaces rather than merges — repeat the base
       .overlay opacity/transform/filter transitions so visibility changes
       during the 200ms toggle window still fade instead of popping. */
    :host([data-rail-anim]) .overlay {
      transition: margin-left 200ms cubic-bezier(.3,.7,.4,1),
                  opacity 260ms ease,
                  transform 260ms cubic-bezier(.2,.8,.2,1),
                  filter 260ms ease;
    }

    .thumb {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      cursor: pointer;
      user-select: none;
    }
    .thumb .num {
      width: 16px;
      flex-shrink: 0;
      font-size: 11px;
      font-weight: 500;
      text-align: right;
      color: rgba(255,255,255,0.55);
      padding-top: 2px;
      font-variant-numeric: tabular-nums;
    }
    .thumb .frame {
      position: relative;
      flex: 1;
      min-width: 0;
      aspect-ratio: var(--deck-aspect);
      background: #fff;
      border-radius: 4px;
      outline: 2px solid transparent;
      outline-offset: 0;
      overflow: hidden;
      transition: outline-color 120ms ease;
    }
    .thumb:hover .frame { outline-color: rgba(255,255,255,0.25); }
    .thumb { outline: none; }
    .thumb:focus-visible .frame { outline-color: rgba(255,255,255,0.5); }
    .thumb[data-current] .num { color: #fff; }
    .thumb[data-current] .frame { outline-color: #D97757; }
    .thumb[data-dragging] { opacity: 0.35; }
    .thumb::before {
      content: '';
      position: absolute;
      left: 24px;
      right: 0;
      height: 3px;
      border-radius: 2px;
      background: #D97757;
      opacity: 0;
      pointer-events: none;
    }
    .thumb[data-drop="before"]::before { top: -8px; opacity: 1; }
    .thumb[data-drop="after"]::before { bottom: -8px; opacity: 1; }
    .thumb[data-skip] .frame { opacity: 0.35; }
    .thumb[data-skip] .frame::after {
      content: 'Skipped';
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.45);
      color: #fff;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.04em;
    }

    .ctxmenu {
      position: fixed;
      min-width: 150px;
      padding: 4px;
      background: #242424;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 7px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.45);
      z-index: 2147483100;
      display: none;
      font-size: 12px;
    }
    .ctxmenu[data-open] { display: block; }
    .ctxmenu button {
      display: block;
      width: 100%;
      appearance: none;
      border: 0;
      background: transparent;
      color: #e8e8e8;
      font: inherit;
      text-align: left;
      padding: 6px 10px;
      border-radius: 4px;
      cursor: pointer;
    }
    .ctxmenu button:hover:not(:disabled) { background: rgba(255,255,255,0.08); }
    .ctxmenu button:disabled { opacity: 0.35; cursor: default; }
    .ctxmenu hr {
      border: 0;
      border-top: 1px solid rgba(255,255,255,0.1);
      margin: 4px 2px;
    }

    .rail-resize {
      position: fixed;
      left: calc(var(--deck-rail-w, 188px) - 3px);
      top: 0;
      bottom: 0;
      width: 6px;
      cursor: col-resize;
      z-index: 2147482600;
      touch-action: none;
    }
    .rail-resize:hover,
    .rail-resize[data-dragging] { background: rgba(255,255,255,0.12); }
    :host([no-rail]) .rail-resize,
    :host([noscale]) .rail-resize,
    .rail[data-presenting] + .rail-resize,
    .rail[data-user-hidden] + .rail-resize { display: none; }

    /* Delete-confirm popup — matches the SPA's ConfirmDialog layout
       (title + message body, depressed footer with Cancel / Delete). */
    .confirm-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      z-index: 2147483200;
      display: none;
      align-items: center;
      justify-content: center;
    }
    .confirm-backdrop[data-open] { display: flex; }
    .confirm {
      width: 320px;
      max-width: calc(100vw - 32px);
      background: #2a2a2a;
      color: #e8e8e8;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.5);
      overflow: hidden;
      font-family: inherit;
      animation: deck-confirm-in 0.18s ease;
    }
    @keyframes deck-confirm-in {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
    .confirm .body { padding: 20px 20px 16px; }
    .confirm .title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
    .confirm .msg { font-size: 13px; line-height: 1.5; color: rgba(255,255,255,0.65); }
    .confirm .footer {
      padding: 14px 20px;
      background: #1f1f1f;
      border-top: 1px solid rgba(255,255,255,0.08);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .confirm button {
      appearance: none;
      font: inherit;
      font-size: 13px;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
    }
    .confirm .cancel {
      background: transparent;
      border: 0;
      color: rgba(255,255,255,0.8);
    }
    .confirm .cancel:hover { background: rgba(255,255,255,0.08); }
    .confirm .danger {
      background: #c96442;
      border: 1px solid rgba(0,0,0,0.15);
      color: #fff;
      box-shadow: 0 1px 3px rgba(166,50,68,0.3), 0 2px 6px rgba(166,50,68,0.18);
    }
    .confirm .danger:hover { background: #b5563a; }

    /* ── Print: one page per slide, no chrome ────────────────────────────
       The screen layout stacks every slide at inset:0 inside a scaled
       canvas; for print we want them in document flow at the authored
       design size so the browser paginates one slide per sheet. The
       @page size is set from the width/height attributes via the inline
       <style id="deck-stage-print-page"> that _syncPrintPageRule appends
       to the document (the @page at-rule has no effect inside shadow DOM). */
    @media print {
      :host {
        position: static;
        inset: auto;
        background: none;
        overflow: visible;
        color: inherit;
      }
      .stage { position: static; display: block; }
      .canvas {
        transform: none !important;
        width: auto !important;
        height: auto !important;
        background: none;
        will-change: auto;
      }
      ::slotted(*) {
        position: relative !important;
        inset: auto !important;
        width: var(--deck-design-w) !important;
        height: var(--deck-design-h) !important;
        box-sizing: border-box !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto;
        break-after: page;
        page-break-after: always;
        break-inside: avoid;
        overflow: hidden;
      }
      /* :last-child alone isn't enough once data-deck-skip hides the
         trailing slide(s) — the last *visible* slide still carries
         break-after:page and prints a blank sheet. _markLastVisible()
         maintains data-deck-last-visible on the last non-skipped slide. */
      ::slotted(*:last-child),
      ::slotted([data-deck-last-visible]) {
        break-after: auto;
        page-break-after: auto;
      }
      ::slotted([data-deck-skip]) { display: none !important; }
      .overlay, .rail, .rail-resize, .ctxmenu, .confirm-backdrop { display: none !important; }
    }
  \`;

  class DeckStage extends HTMLElement {
    static get observedAttributes() { return ['width', 'height', 'noscale', 'no-rail']; }

    constructor() {
      super();
      this._root = this.attachShadow({ mode: 'open' });
      this._index = 0;
      this._slides = [];
      this._notes = [];
      this._hideTimer = null;
      this._mouseIdleTimer = null;
      this._menuIndex = -1;

      this._onKey = this._onKey.bind(this);
      this._onResize = this._onResize.bind(this);
      this._onSlotChange = this._onSlotChange.bind(this);
      this._onMouseMove = this._onMouseMove.bind(this);
      this._onTap = this._onTap.bind(this);
      this._onMessage = this._onMessage.bind(this);
      // Capture-phase close so a click anywhere dismisses the menu, but
      // ignore clicks that land inside the menu itself — otherwise the
      // capture handler runs before the menu's own (bubble) handler and
      // clears _menuIndex out from under it.
      this._onDocClick = (e) => {
        if (this._menu && e.composedPath && e.composedPath().includes(this._menu)) return;
        this._closeMenu();
      };
    }

    get designWidth() {
      return parseInt(this.getAttribute('width'), 10) || DESIGN_W_DEFAULT;
    }
    get designHeight() {
      return parseInt(this.getAttribute('height'), 10) || DESIGN_H_DEFAULT;
    }

    connectedCallback() {
      // Presenter-view popup loads deckUrl?_snthumb=...#N for its prev/cur/
      // next thumbnails — the rail has no business rendering inside those
      // (wrong scale, and it offsets the stage so the thumb shows a gutter).
      if (/[?&]_snthumb=/.test(location.search)) this.setAttribute('no-rail', '');
      this._render();
      this._loadNotes();
      this._syncPrintPageRule();
      window.addEventListener('keydown', this._onKey);
      window.addEventListener('resize', this._onResize);
      window.addEventListener('mousemove', this._onMouseMove, { passive: true });
      window.addEventListener('message', this._onMessage);
      window.addEventListener('click', this._onDocClick, true);
      this.addEventListener('click', this._onTap);
      // Print lays every slide out as its own page, so [data-deck-active]-
      // gated entrance styles need the attribute on every slide (not just
      // the current one) or their content prints at the hidden base style.
      // The transient freeze style lands BEFORE the attributes so any
      // attribute-keyed transition fires at 0s (changing transition-
      // duration after a transition has started doesn't affect it).
      this._onBeforePrint = () => {
        this._syncPrintPageRule();
        if (this._freezeStyle) this._freezeStyle.remove();
        this._freezeStyle = document.createElement('style');
        this._freezeStyle.textContent = '*,*::before,*::after{transition-duration:0s !important}';
        document.head.appendChild(this._freezeStyle);
        this._slides.forEach((s) => s.setAttribute('data-deck-active', ''));
      };
      this._onAfterPrint = () => {
        this._applyIndex({ showOverlay: false, broadcast: false });
        if (this._freezeStyle) { this._freezeStyle.remove(); this._freezeStyle = null; }
      };
      window.addEventListener('beforeprint', this._onBeforePrint);
      window.addEventListener('afterprint', this._onAfterPrint);
      // Initial collection + layout happens via slotchange, which fires on mount.
      this._enableRail();
      // Hold the stage hidden until webfonts are ready so the first visible
      // paint has the deck's real typography — the :not(:defined) guard in
      // the page HTML only covers custom-element upgrade, not font load.
      // Capped so a 404'd font URL can't blank the deck indefinitely.
      this.setAttribute('data-fonts-pending', '');
      const reveal = () => this.removeAttribute('data-fonts-pending');
      // Unconditional cap — rAF can be suspended in a hidden iframe, which
      // would strand the one inside the rAF callback.
      setTimeout(reveal, 2000);
      // rAF first: fonts.ready is a pre-resolved promise until layout has
      // resolved the slotted text's font-family and pushed a FontFace into
      // 'loading'. Reading it here in connectedCallback (parse-time) would
      // settle the race in a microtask before any font fetch starts.
      requestAnimationFrame(() => {
        Promise.race([
          document.fonts ? document.fonts.ready : Promise.resolve(),
          new Promise((r) => setTimeout(r, 2000)),
        ]).then(reveal, reveal);
      });
    }

    _enableRail() {
      // Idempotent — older host builds still post __omelette_rail_enabled.
      // no-rail guard keeps the observers/stylesheet walk off the cheap path
      // for presenter-popup thumbnail iframes (up to 9 per view).
      if (this._railEnabled || this.hasAttribute('no-rail')) return;
      this._railEnabled = true;
      // Per-viewer preference — restored alongside rail width. Default on;
      // only a stored '0' (from the TweaksPanel toggle) hides it.
      this._railVisible = true;
      try {
        if (localStorage.getItem('deck-stage.railVisible') === '0') this._railVisible = false;
      } catch (e) {}
      // Live thumbnail updates: watch the light-DOM slides for content
      // edits and re-clone just the affected thumb(s), debounced. Ignore
      // the data-deck-* / data-screen-label / data-om-validate attributes
      // this component itself writes so nav doesn't trigger spurious
      // refreshes — except data-deck-skip, which now arrives from the host
      // re-render and is what updates the rail badge, print bookkeeping,
      // and deckSkipped re-broadcast.
      const OWN_ATTRS = /^data-(deck-(?!skip$)|screen-label$|om-validate$)/;
      this._liveDirty = new Set();
      this._liveObserver = new MutationObserver((records) => {
        for (const r of records) {
          if (r.type === 'attributes' && OWN_ATTRS.test(r.attributeName || '')) continue;
          let n = r.target;
          while (n && n.parentElement !== this) n = n.parentElement;
          // Skip/unskip is handled below without re-cloning (the badge sits
          // on the thumb wrapper, not the clone) — don't mark the slide
          // dirty for an attr change whose only visible effect is the badge.
          if (n && this._slideSet && this._slideSet.has(n)
              && !(r.type === 'attributes' && r.attributeName === 'data-deck-skip')) {
            this._liveDirty.add(n);
          }
          // Host-driven skip toggle: sync the rail badge + print + presenter
          // skipped-list the way _toggleSkip used to do locally.
          if (r.type === 'attributes' && r.attributeName === 'data-deck-skip'
              && n && this._slideSet && this._slideSet.has(n)) {
            const i = this._slides.indexOf(n);
            if (this._thumbs && this._thumbs[i]) {
              if (n.hasAttribute('data-deck-skip')) this._thumbs[i].thumb.setAttribute('data-skip', '');
              else this._thumbs[i].thumb.removeAttribute('data-skip');
            }
            this._markLastVisible();
            try { window.postMessage({ slideIndexChanged: this._index, deckTotal: this._slides.length, deckSkipped: this._skippedIndices() }, '*'); } catch (e) {}
          }
        }
        if (this._liveDirty.size && !this._liveTimer) {
          this._liveTimer = setTimeout(() => {
            this._liveTimer = null;
            this._liveDirty.forEach((s) => this._refreshThumb(s));
            this._liveDirty.clear();
          }, 200);
        }
      });
      this._liveObserver.observe(this, {
        subtree: true, childList: true, characterData: true, attributes: true,
      });
      // Lazy thumbnail materialization — clone the slide only when its
      // frame scrolls into (or near) the rail viewport. rootMargin gives
      // ~4 thumbs of pre-load so fast scrolling doesn't flash blanks.
      this._railObserver = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.target.__deckThumb) {
            this._materialize(e.target.__deckThumb);
          }
        });
      }, { root: this._rail, rootMargin: '400px 0px' });
      // Tweaks typically change CSS vars / attrs OUTSIDE <deck-stage>
      // (on <html>, <body>, a wrapper div, or a <style> tag), which
      // _liveObserver can't see. Re-snapshot author CSS (constructable
      // sheet is shared by reference, so one replaceSync updates every
      // thumb shadow root) and re-sync each thumb host's attrs + custom
      // properties. In-slide DOM mutations are _liveObserver's job.
      // Debounced so slider drags don't thrash.
      this._onTweakChange = () => {
        clearTimeout(this._tweakTimer);
        this._tweakTimer = setTimeout(() => {
          this._snapshotAuthorCss();
          // One getComputedStyle for the whole batch — each
          // getPropertyValue read below reuses the same computed style
          // as long as nothing invalidates layout between thumbs.
          const cs = getComputedStyle(this);
          (this._thumbs || []).forEach((t) => {
            if (t.host) this._syncThumbHostAttrs(t.host, cs);
          });
        }, 120);
      };
      window.addEventListener('tweakchange', this._onTweakChange);
      this._snapshotAuthorCss();
      // Build the rail now that it's enabled — slotchange already fired,
      // so _renderRail's early-return skipped the initial build.
      this._syncRailHidden();
      this._renderRail();
      this._fit();
    }

    /** Snapshot document stylesheets into a constructable sheet that each
     *  thumbnail's nested shadow root adopts — so author CSS styles the
     *  cloned slide content without touching this component's chrome.
     *  Cross-origin sheets throw on .cssRules — skip them. Re-callable:
     *  the existing constructable sheet is reused via replaceSync so every
     *  already-adopted shadow root picks up the fresh CSS without re-adopt. */
    _snapshotAuthorCss() {
      // :root in an adopted sheet inside a shadow root matches nothing
      // (only the document root qualifies), so author rules like
      // \`:root[data-voice="modern"] .serif\` never reach the clones.
      // Rewrite :root → :host and mirror <html>'s data-*/class/lang onto
      // each thumb host (see _syncThumbHostAttrs) so the same selectors
      // match inside the thumbnail's shadow tree.
      const authorCss = Array.from(document.styleSheets).map((sh) => {
        try {
          return Array.from(sh.cssRules).map((r) => r.cssText).join('\\n');
        } catch (e) { return ''; }
      }).join('\\n')
        // The shadow host is featureless outside the functional :host(...)
        // form, so any compound on :root — [attr], .class, #id, :pseudo —
        // must become :host(<compound>) not :host<compound>. Same for the
        // html type selector (Tailwind class-strategy dark mode emits
        // html.dark; Pico uses html[data-theme]), which has nothing to
        // match inside the thumb's shadow tree.
        .replace(/:root((?:\\[[^\\]]*\\]|[.#][-\\w]+|:[-\\w]+(?:\\([^)]*\\))?)+)/g, ':host($1)')
        .replace(/:root\\b/g, ':host')
        .replace(/(^|[\\s,>~+(}])html((?:\\[[^\\]]*\\]|[.#][-\\w]+|:[-\\w]+(?:\\([^)]*\\))?)+)(?![-\\w])/g, '$1:host($2)')
        .replace(/(^|[\\s,>~+(}])html(?![-\\w])/g, '$1:host');
      // Every custom property the author references. _syncThumbHostAttrs
      // mirrors each one's *computed* value at <deck-stage> onto the
      // thumb host so the live value wins over the :host default above
      // regardless of which ancestor the tweak wrote to (<html>, <body>,
      // a wrapper div, or the deck-stage element itself all inherit
      // down to getComputedStyle(this)).
      this._authorVars = new Set(authorCss.match(/--[\\w-]+/g) || []);
      try {
        if (!this._adoptedSheet) this._adoptedSheet = new CSSStyleSheet();
        this._adoptedSheet.replaceSync(authorCss);
      } catch (e) {
        this._adoptedSheet = null;
        this._authorCss = authorCss;
      }
    }

    _syncThumbHostAttrs(host, cs) {
      const de = document.documentElement;
      // setAttribute overwrites but can't delete — an attr removed from
      // <html> (toggleAttribute off, classList emptied) would linger on
      // the host and :host([data-*]) / :host(.foo) rules would keep
      // matching. Remove stale mirrored attrs first; iterate backward
      // because removeAttribute mutates the live NamedNodeMap.
      for (let i = host.attributes.length - 1; i >= 0; i--) {
        const n = host.attributes[i].name;
        if ((n.startsWith('data-') || n === 'class' || n === 'lang')
            && !de.hasAttribute(n)) {
          host.removeAttribute(n);
        }
      }
      for (const a of de.attributes) {
        if (a.name.startsWith('data-') || a.name === 'class' || a.name === 'lang') {
          host.setAttribute(a.name, a.value);
        }
      }
      // The :root→:host rewrite in _snapshotAuthorCss pins each custom
      // property to its stylesheet default on the thumb host, shadowing
      // the live value that would otherwise inherit. Tweaks can write the
      // live value on any ancestor — <html>, <body>, a wrapper div, the
      // deck-stage element — so read it as the *computed* value at
      // <deck-stage> (which sees the whole inheritance chain) rather than
      // trying to guess which element the author wrote to. Inline on the
      // host beats the :host{} rule. remove-stale covers vars dropped
      // from the stylesheet between snapshots.
      const vars = this._authorVars || new Set();
      for (let i = host.style.length - 1; i >= 0; i--) {
        const p = host.style[i];
        if (p.startsWith('--') && !vars.has(p)) host.style.removeProperty(p);
      }
      const live = cs || getComputedStyle(this);
      vars.forEach((p) => {
        const v = live.getPropertyValue(p);
        if (v) host.style.setProperty(p, v.trim());
        else host.style.removeProperty(p);
      });
    }

    disconnectedCallback() {
      window.removeEventListener('keydown', this._onKey);
      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('mousemove', this._onMouseMove);
      window.removeEventListener('message', this._onMessage);
      window.removeEventListener('click', this._onDocClick, true);
      window.removeEventListener('beforeprint', this._onBeforePrint);
      window.removeEventListener('afterprint', this._onAfterPrint);
      if (this._freezeStyle) { this._freezeStyle.remove(); this._freezeStyle = null; }
      this.removeEventListener('click', this._onTap);
      if (this._hideTimer) clearTimeout(this._hideTimer);
      if (this._mouseIdleTimer) clearTimeout(this._mouseIdleTimer);
      if (this._liveTimer) clearTimeout(this._liveTimer);
      if (this._tweakTimer) clearTimeout(this._tweakTimer);
      if (this._railAnimTimer) clearTimeout(this._railAnimTimer);
      if (this._scaleRaf) cancelAnimationFrame(this._scaleRaf);
      if (this._liveObserver) this._liveObserver.disconnect();
      if (this._railObserver) this._railObserver.disconnect();
      if (this._onTweakChange) window.removeEventListener('tweakchange', this._onTweakChange);
    }

    attributeChangedCallback() {
      if (this._canvas) {
        this._canvas.style.width = this.designWidth + 'px';
        this._canvas.style.height = this.designHeight + 'px';
        this._canvas.style.setProperty('--deck-design-w', this.designWidth + 'px');
        this._canvas.style.setProperty('--deck-design-h', this.designHeight + 'px');
        if (this._rail) {
          this._rail.style.setProperty('--deck-aspect', this.designWidth + '/' + this.designHeight);
        }
        this._fit();
        this._scaleThumbs();
        this._syncPrintPageRule();
      }
    }

    _render() {
      const style = document.createElement('style');
      style.textContent = stylesheet;

      const stage = document.createElement('div');
      stage.className = 'stage';

      const canvas = document.createElement('div');
      canvas.className = 'canvas';
      canvas.style.width = this.designWidth + 'px';
      canvas.style.height = this.designHeight + 'px';
      canvas.style.setProperty('--deck-design-w', this.designWidth + 'px');
      canvas.style.setProperty('--deck-design-h', this.designHeight + 'px');

      const slot = document.createElement('slot');
      slot.addEventListener('slotchange', this._onSlotChange);
      canvas.appendChild(slot);
      stage.appendChild(canvas);

      // Overlay: compact, solid black, with clickable controls.
      const overlay = document.createElement('div');
      overlay.className = 'overlay export-hidden';
      overlay.setAttribute('role', 'toolbar');
      overlay.setAttribute('aria-label', 'Deck controls');
      overlay.setAttribute('data-omelette-chrome', '');
      overlay.innerHTML = \`
        <button class="btn prev" type="button" aria-label="Previous slide" title="Previous (←)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3L5 8l5 5"/></svg>
        </button>
        <span class="count" aria-live="polite"><span class="current">1</span><span class="sep">/</span><span class="total">1</span></span>
        <button class="btn next" type="button" aria-label="Next slide" title="Next (→)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg>
        </button>
        <span class="divider"></span>
        <button class="btn reset" type="button" aria-label="Reset to first slide" title="Reset (R)">Reset<span class="kbd">R</span></button>
      \`;

      overlay.querySelector('.prev').addEventListener('click', () => this._advance(-1, 'click'));
      overlay.querySelector('.next').addEventListener('click', () => this._advance(1, 'click'));
      overlay.querySelector('.reset').addEventListener('click', () => this._go(0, 'click'));

      // Thumbnail rail + context menu. Thumbnails are populated in
      // _renderRail() after _collectSlides().
      const rail = document.createElement('div');
      rail.className = 'rail export-hidden';
      rail.setAttribute('data-omelette-chrome', '');
      // Edit mode hooks wheel to pan the canvas; this opts the rail's own
      // scrollview out so thumbnails stay scrollable while editing.
      rail.setAttribute('data-dc-wheel-passthru', '');
      rail.style.setProperty('--deck-aspect', this.designWidth + '/' + this.designHeight);
      // Edge auto-scroll while dragging a thumb near the rail's top/bottom
      // so off-screen drop targets are reachable. Native dragover fires
      // continuously while the pointer is stationary, so a per-event nudge
      // (ramped by edge proximity) is enough — no rAF loop needed.
      rail.addEventListener('dragover', (e) => {
        if (this._dragFrom == null) return;
        const r = rail.getBoundingClientRect();
        const EDGE = 40;
        const dt = e.clientY - r.top;
        const db = r.bottom - e.clientY;
        if (dt < EDGE) rail.scrollTop -= Math.ceil((EDGE - dt) / 3);
        else if (db < EDGE) rail.scrollTop += Math.ceil((EDGE - db) / 3);
      });

      const menu = document.createElement('div');
      menu.className = 'ctxmenu export-hidden';
      menu.setAttribute('data-omelette-chrome', '');
      menu.innerHTML = \`
        <button type="button" data-act="skip">Skip slide</button>
        <button type="button" data-act="up">Move up</button>
        <button type="button" data-act="down">Move down</button>
        <button type="button" data-act="duplicate">Duplicate slide</button>
        <hr>
        <button type="button" data-act="delete">Delete slide</button>
      \`;
      menu.addEventListener('click', (e) => {
        const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
        if (!act) return;
        const i = this._menuIndex;
        this._closeMenu();
        if (act === 'skip') this._toggleSkip(i);
        else if (act === 'up') this._moveSlide(i, i - 1);
        else if (act === 'down') this._moveSlide(i, i + 1);
        else if (act === 'duplicate') this._duplicateSlide(i);
        else if (act === 'delete') this._openConfirm(i);
      });
      menu.addEventListener('contextmenu', (e) => e.preventDefault());

      // Rail resize handle — drag to set --deck-rail-w, persisted to
      // localStorage so the width survives reloads.
      const resize = document.createElement('div');
      resize.className = 'rail-resize export-hidden';
      resize.setAttribute('data-omelette-chrome', '');
      resize.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        resize.setPointerCapture(e.pointerId);
        resize.setAttribute('data-dragging', '');
        const move = (ev) => this._setRailWidth(ev.clientX);
        const up = () => {
          resize.removeEventListener('pointermove', move);
          resize.removeEventListener('pointerup', up);
          resize.removeEventListener('pointercancel', up);
          resize.removeAttribute('data-dragging');
          try { localStorage.setItem('deck-stage.railWidth', String(this._railPx)); } catch (err) {}
        };
        resize.addEventListener('pointermove', move);
        resize.addEventListener('pointerup', up);
        resize.addEventListener('pointercancel', up);
      });

      // Delete-confirm dialog — mirrors the SPA's ConfirmDialog layout.
      const confirm = document.createElement('div');
      confirm.className = 'confirm-backdrop export-hidden';
      confirm.setAttribute('data-omelette-chrome', '');
      confirm.innerHTML = \`
        <div class="confirm" role="dialog" aria-modal="true">
          <div class="body">
            <div class="title">Delete slide?</div>
            <div class="msg">This slide will be removed from the deck.</div>
          </div>
          <div class="footer">
            <button type="button" class="cancel">Cancel</button>
            <button type="button" class="danger">Delete</button>
          </div>
        </div>
      \`;
      confirm.addEventListener('click', (e) => {
        if (e.target === confirm) this._closeConfirm();
      });
      confirm.querySelector('.cancel').addEventListener('click', () => this._closeConfirm());
      confirm.querySelector('.danger').addEventListener('click', () => {
        const i = this._confirmIndex;
        this._closeConfirm();
        this._deleteSlide(i);
      });

      this._root.append(style, rail, resize, stage, overlay, menu, confirm);
      this._canvas = canvas;
      this._stage = stage;
      this._slot = slot;
      this._overlay = overlay;
      this._rail = rail;
      this._resize = resize;
      this._menu = menu;
      this._confirm = confirm;
      this._countEl = overlay.querySelector('.current');
      this._totalEl = overlay.querySelector('.total');

      // Restore persisted rail width.
      let rw = 188;
      try {
        const s = localStorage.getItem('deck-stage.railWidth');
        if (s) rw = parseInt(s, 10) || rw;
      } catch (err) {}
      this._setRailWidth(rw);
      this._syncRailHidden();
    }

    _setRailWidth(px) {
      const w = Math.max(120, Math.min(360, Math.round(px)));
      this._railPx = w;
      this.style.setProperty('--deck-rail-w', w + 'px');
      this._fit();
      // _scaleThumbs forces a sync layout (frame.offsetWidth) then writes
      // N transforms. During a resize drag this runs per-pointermove;
      // coalesce to one per frame.
      if (!this._scaleRaf) {
        this._scaleRaf = requestAnimationFrame(() => {
          this._scaleRaf = null;
          this._scaleThumbs();
        });
      }
    }

    /** @page must live in the document stylesheet — it's a no-op inside
     *  shadow DOM. (Re-)append so any author @page landing later in
     *  source order can't reintroduce a margin and push each slide onto
     *  two sheets; called again from beforeprint. */
    _syncPrintPageRule() {
      const id = 'deck-stage-print-page';
      let tag = document.getElementById(id);
      if (!tag) {
        tag = document.createElement('style');
        tag.id = id;
      }
      (document.body || document.head).appendChild(tag);
      tag.textContent =
        '@page { size: ' + this.designWidth + 'px ' + this.designHeight + 'px; margin: 0; } ' +
        '@media print { html, body { margin: 0 !important; padding: 0 !important; background: none !important; overflow: visible !important; height: auto !important; } ' +
        '* { -webkit-print-color-adjust: exact; print-color-adjust: exact; } ' +
        // Jump authored animations/transitions to their end state so print
        // never captures mid-entrance — pairs with the beforeprint handler
        // in connectedCallback that sets data-deck-active on every slide.
        '*, *::before, *::after { animation-delay: -99s !important; animation-duration: .001s !important; ' +
        'animation-iteration-count: 1 !important; animation-fill-mode: both !important; ' +
        'animation-play-state: running !important; transition-duration: 0s !important; } }';
    }

    _onSlotChange() {
      // Self-mutate path already reconciled synchronously and emitted
      // slidechange; skip the async slotchange it caused.
      if (this._squelchSlotChange) { this._squelchSlotChange = false; return; }
      // Primary lock-clear is the host's __deck_rail_ack; this clears on a
      // dropped ack so the rail can't stay dead.
      this._railLock = false;
      this._collectSlides();
      this._restoreIndex();
      this._applyIndex({ showOverlay: false, broadcast: true, reason: 'init' });
      this._fit();
    }

    _collectSlides() {
      const assigned = this._slot.assignedElements({ flatten: true });
      this._slides = assigned.filter((el) => {
        // Skip template/style/script nodes even if someone slots them.
        const tag = el.tagName;
        return tag !== 'TEMPLATE' && tag !== 'SCRIPT' && tag !== 'STYLE';
      });
      this._slideSet = new Set(this._slides);

      this._slides.forEach((slide, i) => {
        const n = i + 1;
        slide.setAttribute('data-screen-label', \`\${pad2(n)} \${getSlideLabel(slide)}\`);

        // Validation attribute for comment flow / auto-checks.
        if (!slide.hasAttribute('data-om-validate')) {
          slide.setAttribute('data-om-validate', VALIDATE_ATTR);
        }

        slide.setAttribute('data-deck-slide', String(i));
      });

      if (this._totalEl) this._totalEl.textContent = String(this._slides.length || 1);
      if (this._index >= this._slides.length) this._index = Math.max(0, this._slides.length - 1);
      this._markLastVisible();
      this._renderRail();
    }

    /** Tag the last non-skipped slide so print CSS can drop its
     *  break-after (see the @media print comment above — :last-child
     *  alone matches a hidden skipped slide). */
    _markLastVisible() {
      let last = null;
      this._slides.forEach((s) => {
        s.removeAttribute('data-deck-last-visible');
        if (!s.hasAttribute('data-deck-skip')) last = s;
      });
      if (last) last.setAttribute('data-deck-last-visible', '');
    }

    _loadNotes() {
      // Per-slide data-speaker-notes is authoritative when present (attrs
      // travel with the element on reorder/dup/delete); a slide without
      // the attr falls through to the legacy #speaker-notes JSON array
      // PER SLIDE so a single attr on a JSON-authored deck doesn't blank
      // the rest.
      const tag = document.getElementById('speaker-notes');
      let json = null;
      if (tag) try {
        const p = JSON.parse(tag.textContent || '[]');
        if (Array.isArray(p)) json = p;
      } catch (e) {
        console.warn('[deck-stage] Failed to parse #speaker-notes JSON:', e);
      }
      this._notes = this._slides.map((s, i) => {
        const a = s.getAttribute('data-speaker-notes');
        return a !== null ? a : (json && typeof json[i] === 'string' ? json[i] : '');
      });
    }

    _restoreIndex() {
      // The host's ?slide= param is delivered as a #<int> hash (1-indexed) on
      // the iframe src. No hash → slide 1; the deck itself keeps no position
      // state across loads.
      const h = (location.hash || '').match(/^#(\\d+)$/);
      if (h) {
        const n = parseInt(h[1], 10) - 1;
        if (n >= 0 && n < this._slides.length) this._index = n;
      }
    }

    _applyIndex({ showOverlay = true, broadcast = true, reason = 'init' } = {}) {
      if (!this._slides.length) return;
      const prev = this._prevIndex == null ? -1 : this._prevIndex;
      const curr = this._index;
      // Keep the iframe's own hash in sync so an in-iframe location.reload()
      // (reload banner path in viewer-handle.ts) lands on the current slide,
      // not the stale deep-link hash from initial load.
      try { history.replaceState(null, '', '#' + (curr + 1)); } catch (e) {}
      this._slides.forEach((s, i) => {
        if (i === curr) s.setAttribute('data-deck-active', '');
        else s.removeAttribute('data-deck-active');
      });
      if (this._countEl) this._countEl.textContent = String(curr + 1);
      // Follow-scroll on every navigation (init deep-link, keyboard, click,
      // tap, external goTo) — the only time we *don't* want the rail to
      // track current is after a rail-internal mutation, where _renderRail
      // has already restored the user's scroll position and yanking back to
      // current would undo it.
      this._syncRail(reason !== 'mutation');

      if (broadcast) {
        // (1) Legacy: host-window postMessage for speaker-notes renderers.
        try { window.postMessage({ slideIndexChanged: curr, deckTotal: this._slides.length, deckSkipped: this._skippedIndices() }, '*'); } catch (e) {}

        // (2) In-page CustomEvent on the <deck-stage> element itself.
        //     Bubbles and composes out of shadow DOM so slide code can listen:
        //       document.querySelector('deck-stage').addEventListener('slidechange', e => {
        //         e.detail.index, e.detail.previousIndex, e.detail.total, e.detail.slide, e.detail.reason
        //       });
        const detail = {
          index: curr,
          previousIndex: prev,
          total: this._slides.length,
          slide: this._slides[curr] || null,
          previousSlide: prev >= 0 ? (this._slides[prev] || null) : null,
          reason: reason, // 'init' | 'keyboard' | 'click' | 'tap' | 'api'
        };
        this.dispatchEvent(new CustomEvent('slidechange', {
          detail,
          bubbles: true,
          composed: true,
        }));
      }

      this._prevIndex = curr;
      if (showOverlay) this._flashOverlay();
    }

    _flashOverlay() {
      // Host posts __omelette_presenting while in fullscreen/tab presentation
      // mode — suppress the nav footer entirely (both hover and slide-change
      // flash) so the audience sees clean slides.
      if (!this._overlay || this._presenting) return;
      this._overlay.setAttribute('data-visible', '');
      if (this._hideTimer) clearTimeout(this._hideTimer);
      this._hideTimer = setTimeout(() => {
        this._overlay.removeAttribute('data-visible');
      }, OVERLAY_HIDE_MS);
    }

    _railWidth() {
      // State-based, no offsetWidth: the first _fit() can run before the
      // rail has had layout on some load paths, and a 0 there paints the
      // slide full-width for one frame before the post-slotchange _fit()
      // corrects it.
      if (!this._railEnabled || !this._railVisible || this.hasAttribute('no-rail')
          || this.hasAttribute('noscale') || this._presenting || this._previewMode
          || NARROW_MQ.matches) return 0;
      return this._railPx || 0;
    }

    _fit() {
      if (!this._canvas) return;
      const stage = this._canvas.parentElement;
      // PPTX export sets noscale so the DOM capture sees authored-size
      // geometry — the scaled canvas is in shadow DOM, so the exporter's
      // resetTransformSelector can't reach .canvas.style.transform directly.
      if (this.hasAttribute('noscale')) {
        this._canvas.style.transform = 'none';
        if (stage) stage.style.left = '0';
        if (this._overlay) this._overlay.style.marginLeft = '0';
        return;
      }
      const rw = this._railWidth();
      if (stage) stage.style.left = rw + 'px';
      // Overlay is centred on the viewport via left:50% + translate(-50%);
      // marginLeft shifts the centre by rw/2 so it lands in the middle of
      // the [rw, innerWidth] stage region.
      if (this._overlay) this._overlay.style.marginLeft = (rw / 2) + 'px';
      const vw = window.innerWidth - rw;
      const vh = window.innerHeight;
      const s = Math.min(vw / this.designWidth, vh / this.designHeight);
      this._canvas.style.transform = \`scale(\${s})\`;
    }

    _onResize() {
      this._fit();
      // Crossing the narrow-viewport breakpoint reveals the rail — rerun the
      // thumbnail scale the same way _setRailWidth does.
      if (!this._scaleRaf) {
        this._scaleRaf = requestAnimationFrame(() => {
          this._scaleRaf = null;
          this._scaleThumbs();
        });
      }
    }

    _onMouseMove() {
      // Keep overlay visible while mouse moves; hide after idle.
      this._flashOverlay();
    }

    _onMessage(e) {
      const d = e.data;
      if (d && typeof d.__omelette_presenting === 'boolean') {
        this._presenting = d.__omelette_presenting;
        if (this._presenting && this._overlay) {
          this._overlay.removeAttribute('data-visible');
          if (this._hideTimer) clearTimeout(this._hideTimer);
        }
        this._syncRailHidden();
        this._closeMenu();
        this._closeConfirm();
        this._fit();
        this._scaleThumbs();
      }
      // Host's Preview segment (ViewerMode='none'): the rail's drag-reorder /
      // right-click skip-delete affordances are editing chrome, so hide it
      // while the user is just looking at the deck. Same hard-hide path as
      // presenting; independent of the user's _railVisible preference so
      // returning to Edit restores whatever they had.
      if (d && typeof d.__omelette_preview_mode === 'boolean') {
        if (d.__omelette_preview_mode === this._previewMode) return;
        this._previewMode = d.__omelette_preview_mode;
        this._syncRailHidden();
        this._closeMenu();
        this._closeConfirm();
        this._fit();
        this._scaleThumbs();
      }
      // Host has processed a dc-op; rail input is safe again. Not tied to
      // slotchange — setAttr and refusal don't fire one. On refusal,
      // revert the optimistic _index/hash adjustment so the next nav
      // starts from what's actually on screen.
      if (d && d.__dc_op_ack) {
        this._railLock = false;
        if (d.applied === false && this._indexBeforeEmit != null) {
          this._index = this._indexBeforeEmit;
          try { history.replaceState(null, '', '#' + (this._index + 1)); } catch (e) {}
        }
        this._indexBeforeEmit = null;
      }
      // Per-viewer show/hide, driven by the TweaksPanel's auto-injected
      // "Thumbnail rail" toggle (or any author script). Independent of
      // whether the Tweaks panel itself is open — closing the panel
      // doesn't change rail visibility. Persists alongside rail width.
      if (d && d.type === '__deck_rail_visible' && typeof d.on === 'boolean') {
        if (d.on === this._railVisible) return;
        this._railVisible = d.on;
        try { localStorage.setItem('deck-stage.railVisible', d.on ? '1' : '0'); } catch (e) {}
        // Arm the transition, commit it, then flip state — otherwise the
        // browser coalesces both writes and nothing animates on show.
        this.setAttribute('data-rail-anim', '');
        void (this._rail && this._rail.offsetHeight);
        this._syncRailHidden();
        this._fit();
        this._scaleThumbs();
        clearTimeout(this._railAnimTimer);
        this._railAnimTimer = setTimeout(() => this.removeAttribute('data-rail-anim'), 220);
      }
      if (d && d.type === '__omelette_rail_enabled') this._enableRail();
    }

    _syncRailHidden() {
      if (!this._rail) return;
      // data-presenting is the hard hide (display:none) for flag-off,
      // presentation mode, and the host's Preview segment — instant, no
      // transition. data-user-hidden is the soft hide (translateX(-100%))
      // for the viewer's rail toggle, so show/hide slides under
      // :host([data-rail-anim]).
      const hard = !this._railEnabled || this._presenting || this._previewMode;
      if (hard) this._rail.setAttribute('data-presenting', '');
      else this._rail.removeAttribute('data-presenting');
      if (!this._railVisible) this._rail.setAttribute('data-user-hidden', '');
      else this._rail.removeAttribute('data-user-hidden');
      // translateX hide leaves thumbs (tabIndex=0) in the tab order —
      // inert keeps them unfocusable while the rail is off-screen.
      this._rail.inert = hard || !this._railVisible;
    }

    _onTap(e) {
      // Touch-only — keyboard + the overlay toolbar cover nav on desktop.
      if (FINE_POINTER_MQ.matches) return;
      // Only taps that land on the stage (slide content or letterbox); the
      // overlay / rail / menus are siblings with their own click handlers.
      const path = e.composedPath();
      if (!this._stage || !path.includes(this._stage)) return;
      // Let interactive slide content keep the tap. composedPath (not
      // e.target.closest) so we see through open shadow roots — a <button>
      // inside a slide-authored custom element retargets e.target to the
      // host but still appears in the composed path.
      if (e.defaultPrevented) return;
      for (const n of path) {
        if (n === this._stage) break;
        if (n.matches && n.matches(INTERACTIVE_SEL)) return;
      }
      e.preventDefault();
      const rw = this._railWidth();
      const mid = rw + (window.innerWidth - rw) / 2;
      this._advance(e.clientX < mid ? -1 : 1, 'tap');
    }

    _onKey(e) {
      // Ignore when the user is typing.
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      // Confirm dialog swallows nav keys while open; Escape cancels. Enter
      // is left to the focused button's native activation so Tab→Cancel
      // →Enter activates Cancel, not the window-level confirm path.
      if (this._confirm && this._confirm.hasAttribute('data-open')) {
        if (e.key === 'Escape') { this._closeConfirm(); e.preventDefault(); }
        return;
      }
      if (e.key === 'Escape' && this._menu && this._menu.hasAttribute('data-open')) {
        this._closeMenu();
        e.preventDefault();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;
      let handled = true;

      if (key === 'ArrowRight' || key === 'PageDown' || key === ' ' || key === 'Spacebar') {
        this._advance(1, 'keyboard');
      } else if (key === 'ArrowLeft' || key === 'PageUp') {
        this._advance(-1, 'keyboard');
      } else if (key === 'Home') {
        this._go(0, 'keyboard');
      } else if (key === 'End') {
        this._go(this._slides.length - 1, 'keyboard');
      } else if (key === 'r' || key === 'R') {
        this._go(0, 'keyboard');
      } else if (/^[0-9]$/.test(key)) {
        // 1..9 jump to that slide; 0 jumps to 10.
        const n = key === '0' ? 9 : parseInt(key, 10) - 1;
        if (n < this._slides.length) this._go(n, 'keyboard');
      } else {
        handled = false;
      }

      if (handled) {
        e.preventDefault();
        this._flashOverlay();
      }
    }

    _go(i, reason = 'api') {
      if (!this._slides.length) return;
      const clamped = Math.max(0, Math.min(this._slides.length - 1, i));
      if (clamped === this._index) {
        this._flashOverlay();
        return;
      }
      this._index = clamped;
      this._applyIndex({ showOverlay: true, broadcast: true, reason });
    }

    /** Step forward/back skipping any slide marked data-deck-skip. Falls
     *  back to _go's clamp-at-ends behaviour (flash overlay) when there's
     *  nothing further in that direction. */
    _advance(dir, reason) {
      if (!this._slides.length) return;
      let i = this._index + dir;
      while (i >= 0 && i < this._slides.length && this._slides[i].hasAttribute('data-deck-skip')) {
        i += dir;
      }
      if (i < 0 || i >= this._slides.length) { this._flashOverlay(); return; }
      this._go(i, reason);
    }

    // ── Thumbnail rail ────────────────────────────────────────────────────
    //
    // Thumbs are keyed by slide element and reused across _renderRail()
    // calls, so a reorder/delete is an O(changed) DOM shuffle instead of an
    // O(N) teardown-and-re-clone. Each thumb starts as a lightweight shell
    // (num + empty frame); the clone is materialized lazily by an
    // IntersectionObserver when the frame scrolls into (or near) view, so
    // only visible-ish slides pay the clone + image-decode cost.

    _renderRail() {
      if (!this._rail || !this._railEnabled) { this._thumbs = []; return; }
      // FLIP: record each *materialized* thumb's top before the reconcile.
      // Off-screen (non-materialized) thumbs don't need the animation and
      // skipping their getBoundingClientRect saves a forced layout per
      // off-screen thumb on large decks.
      const prevTops = new Map();
      (this._thumbs || []).forEach(({ thumb, slide, host }) => {
        if (host) prevTops.set(slide, thumb.getBoundingClientRect().top);
      });
      const st = this._rail.scrollTop;

      // Reconcile: reuse thumbs that already exist for a slide, create
      // shells for new slides, drop thumbs for removed slides.
      const bySlide = new Map();
      (this._thumbs || []).forEach((t) => bySlide.set(t.slide, t));
      const next = [];
      this._slides.forEach((slide) => {
        let t = bySlide.get(slide);
        if (t) bySlide.delete(slide);
        else t = this._makeThumb(slide);
        next.push(t);
      });
      // Orphans — slides removed since last render.
      bySlide.forEach((t) => {
        if (this._railObserver) this._railObserver.unobserve(t.frame);
        t.thumb.remove();
      });
      // Put thumbs into document order to match _slides. insertBefore on
      // an already-correctly-placed node is a no-op, so this is cheap
      // when nothing moved.
      next.forEach((t, i) => {
        const want = t.thumb;
        const at = this._rail.children[i];
        if (at !== want) this._rail.insertBefore(want, at || null);
        t.i = i;
        t.num.textContent = String(i + 1);
        if (t.slide.hasAttribute('data-deck-skip')) t.thumb.setAttribute('data-skip', '');
        else t.thumb.removeAttribute('data-skip');
      });
      this._thumbs = next;

      this._rail.scrollTop = st;
      if (prevTops.size) {
        const moved = [];
        this._thumbs.forEach(({ thumb, slide }) => {
          const old = prevTops.get(slide);
          if (old == null) return;
          const dy = old - thumb.getBoundingClientRect().top;
          if (Math.abs(dy) < 1) return;
          thumb.style.transition = 'none';
          thumb.style.transform = \`translateY(\${dy}px)\`;
          moved.push(thumb);
        });
        if (moved.length) {
          // Commit the inverted positions before flipping the transition
          // on — otherwise the browser coalesces both style writes and
          // nothing animates.
          void this._rail.offsetHeight;
          moved.forEach((t) => {
            t.style.transition = 'transform 180ms cubic-bezier(.2,.7,.3,1)';
            t.style.transform = '';
          });
          setTimeout(() => moved.forEach((t) => { t.style.transition = ''; }), 220);
        }
      }
      requestAnimationFrame(() => this._scaleThumbs());
      this._syncRail(false);
    }

    /** Create a lightweight thumb shell for one slide. The clone is
     *  materialized later by the IntersectionObserver. Event handlers
     *  look up the thumb's *current* index (via _thumbs.indexOf) so the
     *  same element can be reused across reorders. */
    _makeThumb(slide) {
      const thumb = document.createElement('div');
      thumb.className = 'thumb';
      thumb.tabIndex = 0;
      const num = document.createElement('div');
      num.className = 'num';
      const frame = document.createElement('div');
      frame.className = 'frame';
      thumb.append(num, frame);

      const entry = { thumb, num, frame, slide, clone: null, host: null, i: -1 };
      // entry.i is refreshed on every _renderRail reconcile pass, so
      // handlers read the thumb's current position without an O(N) scan.
      const idx = () => entry.i;

      thumb.addEventListener('click', () => this._go(idx(), 'click'));
      // ↑/↓ step through the rail when a thumb has focus. _go clamps at the
      // ends and _applyIndex→_syncRail scrolls the new current thumb into
      // view; we move focus to it (preventScroll — _syncRail already
      // scrolled) so a held key walks the whole list. stopPropagation keeps
      // this out of the window-level _onKey nav handler.
      thumb.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        e.preventDefault();
        e.stopPropagation();
        this._go(idx() + (e.key === 'ArrowDown' ? 1 : -1), 'keyboard');
        const cur = this._thumbs && this._thumbs[this._index];
        if (cur) cur.thumb.focus({ preventScroll: true });
      });
      thumb.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this._openMenu(idx(), e.clientX, e.clientY);
      });
      thumb.draggable = true;
      thumb.addEventListener('dragstart', (e) => {
        this._dragFrom = idx();
        thumb.setAttribute('data-dragging', '');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', String(this._dragFrom)); } catch (err) {}
      });
      thumb.addEventListener('dragend', () => {
        thumb.removeAttribute('data-dragging');
        this._clearDrop();
        this._dragFrom = null;
      });
      thumb.addEventListener('dragover', (e) => {
        if (this._dragFrom == null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const r = thumb.getBoundingClientRect();
        this._setDrop(idx(), e.clientY < r.top + r.height / 2 ? 'before' : 'after');
      });
      thumb.addEventListener('drop', (e) => {
        if (this._dragFrom == null) return;
        e.preventDefault();
        const i = idx();
        const r = thumb.getBoundingClientRect();
        let to = e.clientY >= r.top + r.height / 2 ? i + 1 : i;
        if (this._dragFrom < to) to--;
        const from = this._dragFrom;
        this._clearDrop();
        this._dragFrom = null;
        if (to !== from) this._moveSlide(from, to);
      });

      if (this._railObserver) this._railObserver.observe(frame);
      frame.__deckThumb = entry;
      return entry;
    }

    /** Lazily build the clone for a thumb that has scrolled into view. */
    _materialize(entry) {
      if (entry.host) return;
      const dw = this.designWidth, dh = this.designHeight;
      let clone = entry.slide.cloneNode(true);
      clone.removeAttribute('id');
      clone.removeAttribute('data-deck-active');
      clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
      // Neuter heavy media; replace <video> with its poster so the box
      // keeps a visual. <iframe>/<audio> become empty placeholders.
      clone.querySelectorAll('iframe, audio, object, embed').forEach((el) => {
        el.removeAttribute('src');
        el.removeAttribute('srcdoc');
        el.removeAttribute('data');
        el.innerHTML = '';
      });
      clone.querySelectorAll('video').forEach((el) => {
        if (!el.poster) { el.removeAttribute('src'); el.innerHTML = ''; return; }
        const img = document.createElement('img');
        img.src = el.poster;
        img.alt = '';
        img.style.cssText = el.style.cssText + ';object-fit:cover;width:100%;height:100%;';
        img.className = el.className;
        el.replaceWith(img);
      });
      // Images: defer decode and let the browser pick the smallest
      // srcset candidate for the ~140px thumb. Same-URL clones reuse the
      // slide's decoded bitmap (URL-keyed cache), so the remaining cost
      // is paint/composite — lazy+async keeps that off the main thread.
      clone.querySelectorAll('img').forEach((el) => {
        el.loading = 'lazy';
        el.decoding = 'async';
        if (el.srcset) el.sizes = (this._railPx || 188) + 'px';
      });
      // Custom elements inside the slide would have their
      // connectedCallback fire when the clone is appended. Replace them
      // with inert boxes so a component-heavy deck doesn't run N copies
      // of each component's mount logic in the rail. Children are
      // preserved so layout-wrapper elements (<my-column><h2>…</h2>)
      // still show their authored content; the querySelectorAll NodeList
      // is static, so nested custom elements in the moved subtree are
      // still visited on later iterations.
      const neuter = (el) => {
        const box = document.createElement('div');
        box.style.cssText = (el.getAttribute('style') || '') +
          ';background:rgba(0,0,0,0.06);border:1px dashed rgba(0,0,0,0.15);';
        box.className = el.className;
        // Preserve theming/i18n hooks so [data-*] / :lang() / [dir]
        // descendant selectors still match the neutered root.
        for (const a of el.attributes) {
          const n = a.name;
          if (n.startsWith('data-') || n.startsWith('aria-') ||
              n === 'lang' || n === 'dir' || n === 'role' || n === 'title') {
            box.setAttribute(n, a.value);
          }
        }
        while (el.firstChild) box.appendChild(el.firstChild);
        return box;
      };
      // querySelectorAll('*') returns descendants only — a custom-element
      // slide root (<my-slide>…</my-slide>) would slip through and upgrade
      // on append. Swap the root first.
      if (clone.tagName.includes('-')) clone = neuter(clone);
      clone.querySelectorAll('*').forEach((el) => {
        if (el.tagName.includes('-')) el.replaceWith(neuter(el));
      });
      clone.style.cssText += ';position:absolute;top:0;left:0;transform-origin:0 0;' +
        'pointer-events:none;width:' + dw + 'px;height:' + dh + 'px;' +
        'box-sizing:border-box;overflow:hidden;visibility:visible;opacity:1;';
      const host = document.createElement('div');
      host.style.cssText = 'position:absolute;inset:0;';
      this._syncThumbHostAttrs(host);
      const sr = host.attachShadow({ mode: 'open' });
      if (this._adoptedSheet) sr.adoptedStyleSheets = [this._adoptedSheet];
      else {
        const st = document.createElement('style');
        st.textContent = this._authorCss || '';
        sr.appendChild(st);
      }
      sr.appendChild(clone);
      entry.frame.appendChild(host);
      entry.host = host;
      entry.clone = clone;
      if (this._thumbScale) clone.style.transform = 'scale(' + this._thumbScale + ')';
      // Once materialized the IO callback is a no-op early-return —
      // unobserve so scroll doesn't keep firing it.
      if (this._railObserver) this._railObserver.unobserve(entry.frame);
    }

    /** Re-clone a single thumb (live-update path). No-op if the thumb
     *  hasn't been materialized yet — it'll pick up current content when
     *  it scrolls into view. */
    _refreshThumb(slide) {
      const entry = (this._thumbs || []).find((t) => t.slide === slide);
      if (!entry || !entry.host) return;
      entry.host.remove();
      entry.host = entry.clone = null;
      this._materialize(entry);
    }

    _scaleThumbs() {
      if (!this._thumbs || !this._thumbs.length) return;
      // Every frame is the same width; if it reads 0 the rail is
      // display:none (noscale / no-rail / presenting / print) — leave the
      // clones as-is and re-run when the rail is revealed.
      const fw = this._thumbs[0].frame.offsetWidth;
      if (!fw) return;
      this._thumbScale = fw / this.designWidth;
      this._thumbs.forEach(({ clone }) => {
        if (clone) clone.style.transform = 'scale(' + this._thumbScale + ')';
      });
    }

    _setDrop(i, where) {
      // dragover fires at pointer-event rate; touch only the previous
      // and new target rather than sweeping all N thumbs.
      const t = this._thumbs && this._thumbs[i];
      if (this._dropOn && this._dropOn !== t) {
        this._dropOn.thumb.removeAttribute('data-drop');
      }
      if (t) t.thumb.setAttribute('data-drop', where);
      this._dropOn = t || null;
    }

    _clearDrop() {
      if (this._dropOn) this._dropOn.thumb.removeAttribute('data-drop');
      this._dropOn = null;
    }

    _syncRail(follow) {
      if (!this._thumbs) return;
      this._thumbs.forEach(({ thumb }, i) => {
        if (i === this._index) {
          thumb.setAttribute('data-current', '');
          if (follow && typeof thumb.scrollIntoView === 'function') {
            thumb.scrollIntoView({ block: 'nearest' });
          }
        } else {
          thumb.removeAttribute('data-current');
        }
      });
    }

    _openMenu(i, x, y) {
      if (!this._menu) return;
      this._menuIndex = i;
      const slide = this._slides[i];
      const skip = slide && slide.hasAttribute('data-deck-skip');
      this._menu.querySelector('[data-act="skip"]').textContent = skip ? 'Unskip slide' : 'Skip slide';
      this._menu.querySelector('[data-act="up"]').disabled = i <= 0;
      this._menu.querySelector('[data-act="down"]').disabled = i >= this._slides.length - 1;
      this._menu.querySelector('[data-act="delete"]').disabled = this._slides.length <= 1;
      // Place, then clamp to viewport after it's measurable.
      this._menu.style.left = x + 'px';
      this._menu.style.top = y + 'px';
      this._menu.setAttribute('data-open', '');
      const r = this._menu.getBoundingClientRect();
      const nx = Math.min(x, window.innerWidth - r.width - 4);
      const ny = Math.min(y, window.innerHeight - r.height - 4);
      this._menu.style.left = Math.max(4, nx) + 'px';
      this._menu.style.top = Math.max(4, ny) + 'px';
    }

    _closeMenu() {
      if (this._menu) this._menu.removeAttribute('data-open');
      this._menuIndex = -1;
    }

    _openConfirm(i) {
      if (!this._confirm) return;
      this._confirmIndex = i;
      this._confirm.querySelector('.title').textContent = 'Delete slide ' + (i + 1) + '?';
      this._confirm.setAttribute('data-open', '');
      const btn = this._confirm.querySelector('.danger');
      if (btn && btn.focus) btn.focus();
    }

    _closeConfirm() {
      if (this._confirm) this._confirm.removeAttribute('data-open');
      this._confirmIndex = -1;
    }

    /** Rail mutations. When a dc-runtime is present (\`window.__dcUpdate\`)
     *  the host owns the light DOM — handlers emit a dc-op only and the
     *  host applies it (to the editor's model or to the source file) and
     *  re-renders via dc-runtime; slotchange catches the rail up.
     *  Structural ops lock rail input until the host acks so a rapid second
     *  click can't address a stale index; setAttr/removeAttr respect the
     *  lock but don't set it (indices unchanged; the host serializes).
     *  \`newIndex\` is written to location.hash so slotchange's
     *  _restoreIndex lands on the right slide.
     *
     *  With NO dc-runtime (a raw .html deck), there's no re-render path,
     *  so handlers self-mutate locally for an instant update and emit
     *  \`emitOnly: false\`; the host persists to disk without
     *  re-rendering over the already-mutated DOM.
     *
     *  See docs/dc-ops.md for the contract. */
    _emitDcOp(op, slide, lock, newIndex) {
      // Slide index (template/script/style filtered — same as
      // _collectSlides). deck-stage is a filtered-index dc-op emitter;
      // the host resolves against findDeckStage().slideTids. Callers
      // already pass \`to\` as a slide index.
      op.at = this._slides.indexOf(slide);
      op.witness = { childCount: this._slides.length };
      // dc-runtime wraps an <x-import>-mounted component in a
      // <div class="sc-host-x" data-dc-tpl="N"> host — the stamp is on the
      // WRAPPER, not this element. closest() finds it (or this element's
      // own stamp when directly templated).
      const host = this.closest('[data-dc-tpl]');
      const tid = host && host.getAttribute('data-dc-tpl');
      op.mount = { tid: tid !== null ? parseInt(tid, 10) : null, tag: 'deck-stage' };
      op.emitOnly = !!window.__dcUpdate;
      if (op.emitOnly) {
        if (lock) this._railLock = true;
        if (newIndex != null && newIndex !== this._index) {
          this._indexBeforeEmit = this._index;
          this._index = newIndex;
          try { history.replaceState(null, '', '#' + (newIndex + 1)); } catch (e) {}
        }
      }
      this.dispatchEvent(new CustomEvent('dc-op', {
        detail: op, bubbles: true, composed: true,
      }));
      return op.emitOnly;
    }

    _deleteSlide(i) {
      if (this._railLock) return;
      const slide = this._slides[i];
      if (!slide || this._slides.length <= 1) return;
      const cur = this._index;
      const ni = (i < cur || (i === cur && i === this._slides.length - 1)) ? cur - 1 : cur;
      if (this._emitDcOp({ op: 'remove' }, slide, true, ni)) return;
      this._index = ni;
      this._squelchSlotChange = true;
      slide.remove();
      this._collectSlides();
      this._applyIndex({ showOverlay: true, broadcast: true, reason: 'mutation' });
    }

    _duplicateSlide(i) {
      if (this._railLock) return;
      const slide = this._slides[i];
      if (!slide) return;
      if (this._emitDcOp({ op: 'duplicate' }, slide, true, i + 1)) return;
      const copy = slide.cloneNode(true);
      copy.removeAttribute('id');
      copy.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
      this._index = i + 1;
      this._squelchSlotChange = true;
      this.insertBefore(copy, slide.nextSibling);
      this._collectSlides();
      this._applyIndex({ showOverlay: true, broadcast: true, reason: 'mutation' });
    }

    _toggleSkip(i) {
      if (this._railLock) return;
      const slide = this._slides[i];
      if (!slide) return;
      const on = !slide.hasAttribute('data-deck-skip');
      if (this._emitDcOp(
        on ? { op: 'setAttr', attr: 'data-deck-skip', value: '' }
           : { op: 'removeAttr', attr: 'data-deck-skip' },
        slide, false
      )) return;
      if (on) slide.setAttribute('data-deck-skip', '');
      else slide.removeAttribute('data-deck-skip');
    }

    _skippedIndices() {
      const out = [];
      for (let i = 0; i < this._slides.length; i++) {
        if (this._slides[i].hasAttribute('data-deck-skip')) out.push(i);
      }
      return out;
    }

    _moveSlide(i, j) {
      if (this._railLock || j < 0 || j >= this._slides.length || j === i) return;
      const cur = this._index;
      const ni = cur === i ? j
        : (i < cur && j >= cur) ? cur - 1
        : (i > cur && j <= cur) ? cur + 1
        : cur;
      const slide = this._slides[i];
      if (this._emitDcOp({ op: 'move', to: j }, slide, true, ni)) return;
      const ref = j < i ? this._slides[j] : this._slides[j].nextSibling;
      this._index = ni;
      this._squelchSlotChange = true;
      this.insertBefore(slide, ref);
      this._collectSlides();
      this._applyIndex({ showOverlay: false, broadcast: true, reason: 'mutation' });
    }

    // Public API ------------------------------------------------------------

    /** Current slide index (0-based). */
    get index() { return this._index; }
    /** Total slide count. */
    get length() { return this._slides.length; }
    /** Programmatically navigate. */
    goTo(i) { this._go(i, 'api'); }
    next() { this._advance(1, 'api'); }
    prev() { this._advance(-1, 'api'); }
    reset() { this._go(0, 'api'); }
  }

  if (!customElements.get('deck-stage')) {
    customElements.define('deck-stage', DeckStage);
  }
})();
`,
    un = `/* BEGIN USAGE */
/**
 * <doc-page> — paged-document shell for printable HTML.
 *
 * On screen the document renders as a single continuous sheet on a desk
 * background (Google Docs' pageless view): you scroll one tall page card.
 * There is no manual page-splitting — write the whole document as normal
 * flow inside <doc-page> and the browser's print engine paginates it at
 * export.
 *
 * At print the component injects \`@page { size: …; margin: 0 }\` (which
 * leaves Chrome no margin box to draw its date/URL/page-count header in)
 * and moves the visual margin onto the sheet's own padding, so the printed
 * page has the same inset you see on screen. Standard break-hygiene rules
 * (\`break-inside: avoid\` on figures, code blocks, images and table rows;
 * \`orphans/widows: 3\`) are applied so paragraphs and groups split cleanly.
 *
 * Usage:
 *   <style>doc-page:not(:defined){visibility:hidden}</style>
 *   <doc-page size="letter" margin="0.75in">
 *     <h1>Title</h1>
 *     <p>…body…</p>
 *   </doc-page>
 *   <script src="doc-page.js"><\/script>
 *
 * Attributes:
 *   size    — letter | a4 | legal (default letter)
 *   width / height — explicit CSS lengths, override \`size\`
 *   margin  — printable inset on every page (default 0.75in)
 *
 * Running header/footer (optional): give an element \`slot="header"\` or
 * \`slot="footer"\` and it repeats on every printed page via
 * \`position: fixed\`. To keep body text from sliding under it, the
 * component prints inside a single-cell table whose <thead>/<tfoot> are
 * spacers sized to the header/footer height — browsers repeat thead/tfoot
 * on every page, so each sheet's content starts below the header and ends
 * above the footer. On screen the header/footer render once at the
 * top/bottom of the sheet.
 *
 * Author content as static HTML so the user can click-to-edit any text
 * directly. Do not set width/padding/background on the document body —
 * the component owns the sheet box.
 */
/* END USAGE */

(() => {
  const PAPER = {
    letter: ['8.5in', '11in'],
    a4: ['210mm', '297mm'],
    legal: ['8.5in', '14in'],
  };
  const CSS_LENGTH = /^\\d+(\\.\\d+)?(px|in|mm|cm|pt|pc)$/;
  const safeLen = (v, fb) => (CSS_LENGTH.test((v || '').trim()) ? v.trim() : fb);

  const stylesheet = \`
    :host {
      position: relative;
      display: block;
      min-height: 100vh;
      background: #ece8dd;
      padding: 48px 24px;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
      --doc-page-w: 8.5in;
      --doc-page-h: 11in;
      --doc-page-margin: 0.75in;
      --doc-hdr-h: 0px;
      --doc-ftr-h: 0px;
    }
    .sheet {
      width: var(--doc-page-w);
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 2px 14px rgba(20, 20, 19, 0.12);
      border-radius: 2px;
      box-sizing: border-box;
      padding: var(--doc-page-margin);
    }
    .frame { width: 100%; border-collapse: collapse; }
    .frame td, .frame th { padding: 0; text-align: left; font-weight: inherit; }
    .hdr-space { height: var(--doc-hdr-h); }
    .ftr-space { height: var(--doc-ftr-h); }
    ::slotted([slot="header"]),
    ::slotted([slot="footer"]) { display: block; box-sizing: border-box; }
    @media print {
      :host { background: none; padding: 0; min-height: 0; }
      .sheet {
        width: auto; margin: 0; box-shadow: none; border-radius: 0;
        padding: 0 var(--doc-page-margin);
      }
      /* The thead/tfoot spacers repeat on every page, so they carry the
       * vertical page margin (which the sheet's own padding cannot, since
       * that padding is consumed once on the first/last page). The running
       * header/footer are fixed inside that band. */
      .hdr-space { height: max(var(--doc-page-margin), calc(var(--doc-hdr-h) + 0.35in)); }
      .ftr-space { height: max(var(--doc-page-margin), calc(var(--doc-ftr-h) + 0.35in)); }
      ::slotted([slot="header"]) {
        position: fixed; top: 0; left: 0; right: 0; margin: 0;
        padding: calc(var(--doc-page-margin) * 0.45) var(--doc-page-margin) 0;
      }
      ::slotted([slot="footer"]) {
        position: fixed; bottom: 0; left: 0; right: 0; margin: 0;
        padding: 0 var(--doc-page-margin) calc(var(--doc-page-margin) * 0.45);
      }
    }
  \`;

  class DocPage extends HTMLElement {
    static get observedAttributes() { return ['size', 'width', 'height', 'margin']; }

    constructor() {
      super();
      this._root = this.attachShadow({ mode: 'open' });
      this._mo = typeof MutationObserver === 'function'
        ? new MutationObserver(() => this._scheduleMeasure())
        : null;
    }

    get pageWidth() {
      const named = PAPER[(this.getAttribute('size') || '').toLowerCase()];
      return safeLen(this.getAttribute('width'), named ? named[0] : PAPER.letter[0]);
    }
    get pageHeight() {
      const named = PAPER[(this.getAttribute('size') || '').toLowerCase()];
      return safeLen(this.getAttribute('height'), named ? named[1] : PAPER.letter[1]);
    }
    get pageMargin() { return safeLen(this.getAttribute('margin'), '0.75in'); }

    connectedCallback() {
      if (!this._sheet) this._render();
      this._syncSize();
      this._syncPrintPageRule();
      if (this._mo) this._mo.observe(this, {
        subtree: true, childList: true, characterData: true, attributes: true,
      });
      this._onResize = () => this._scheduleMeasure();
      window.addEventListener('resize', this._onResize);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => this._scheduleMeasure());
      }
      this._scheduleMeasure();
    }

    disconnectedCallback() {
      window.removeEventListener('resize', this._onResize);
      if (this._mo) this._mo.disconnect();
      if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
      // Drop the head rule when the last doc-page leaves, so a deleted
      // document's @page geometry can't apply to whatever replaces it.
      if (!document.querySelector('doc-page')) {
        const tag = document.getElementById('doc-page-print');
        if (tag) tag.remove();
      }
    }

    attributeChangedCallback() {
      if (!this._sheet) return;
      this._syncSize();
      this._syncPrintPageRule();
      this._scheduleMeasure();
    }

    _render() {
      this._root.innerHTML = \`
        <style>\${stylesheet}</style>
        <style id="vars"></style>
        <div class="sheet" data-screen-label="Document">
          <table class="frame" role="presentation">
            <thead><tr><th><div class="hdr-space"><slot name="header"></slot></div></th></tr></thead>
            <tbody><tr><td class="body"><slot></slot></td></tr></tbody>
            <tfoot><tr><td><div class="ftr-space"><slot name="footer"></slot></div></td></tr></tfoot>
          </table>
        </div>\`;
      this._sheet = this._root.querySelector('.sheet');
      this._vars = this._root.getElementById('vars');
    }

    /** Runtime sizing lives in a shadow <style> :host rule, never on the
     *  light-DOM host element, so serialize-persist can't write it back. */
    _syncSize(hdrH, ftrH) {
      this._vars.textContent = ':host{' +
        '--doc-page-w:' + this.pageWidth + ';' +
        '--doc-page-h:' + this.pageHeight + ';' +
        '--doc-page-margin:' + this.pageMargin + ';' +
        '--doc-hdr-h:' + (hdrH || 0) + 'px;' +
        '--doc-ftr-h:' + (ftrH || 0) + 'px}';
    }

    /** @page is a no-op inside shadow DOM, so the rule lives in <head>.
     *  Re-appended on every sync so it stays last in source order — the
     *  @page cascade is source-order per descriptor, so this rule wins
     *  over any other @page rule in the document. */
    _syncPrintPageRule() {
      const id = 'doc-page-print';
      let tag = document.getElementById(id);
      if (!tag) {
        tag = document.createElement('style');
        tag.id = id;
      }
      document.head.appendChild(tag);
      tag.textContent =
        '@page { size: ' + this.pageWidth + ' ' + this.pageHeight + '; margin: 0; } ' +
        '@media print { html, body { margin: 0 !important; padding: 0 !important; background: none !important; height: auto !important; overflow: visible !important; } ' +
        'h1,h2,h3,h4,h5,h6 { break-after: avoid; } ' +
        'figure,pre,blockquote,img,svg,tr { break-inside: avoid; } ' +
        'p,li { orphans: 3; widows: 3; } ' +
        '* { -webkit-print-color-adjust: exact; print-color-adjust: exact; } ' +
        '*, *::before, *::after { animation-delay: -99s !important; animation-duration: .001s !important; ' +
        'animation-iteration-count: 1 !important; animation-fill-mode: both !important; ' +
        'animation-play-state: running !important; transition-duration: 0s !important; } }';
    }

    _scheduleMeasure() {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => { this._raf = null; this._measure(); });
    }

    /** Slot heights feed the print spacers (--doc-hdr-h / --doc-ftr-h), so
     *  they re-measure on content mutation, resize, and font load. */
    _measure() {
      const hdr = this.querySelector(':scope > [slot="header"]');
      const ftr = this.querySelector(':scope > [slot="footer"]');
      this._syncSize(hdr ? hdr.offsetHeight : 0, ftr ? ftr.offsetHeight : 0);
    }
  }

  if (!customElements.get('doc-page')) {
    customElements.define('doc-page', DocPage);
  }
})();
`,
    dn = `/* BEGIN USAGE */
/**
 * <image-slot> — user-fillable image placeholder.
 *
 * Drop this into a deck, mockup, or page wherever you want the user to
 * supply an image. You control the slot's shape and size; the user fills it
 * by dragging an image file onto it (or clicking to browse). The dropped
 * image persists across reloads via a .image-slots.state.json sidecar —
 * same read-via-fetch / write-via-window.omelette pattern as
 * design_canvas.jsx, so the filled slot shows on share links, downloaded
 * zips, and PPTX export. Outside the omelette runtime the slot is read-only.
 *
 * The host bridge only allows sidecar writes at the project root, so the
 * HTML that uses this component is assumed to live at the project root too
 * (same constraint as design_canvas.jsx).
 *
 * Attributes:
 *   id           Persistence key. REQUIRED for the drop to survive reload —
 *                every slot on the page needs a distinct id.
 *   shape        'rect' | 'rounded' | 'circle' | 'pill'   (default 'rounded')
 *                'circle' applies 50% border-radius; on a non-square slot
 *                that's an ellipse — set equal width and height for a true
 *                circle.
 *   radius       Corner radius in px for 'rounded'.       (default 12)
 *   mask         Any CSS clip-path value. Overrides \`shape\` — use this for
 *                hexagons, blobs, arbitrary polygons.
 *   fit          object-fit: cover | contain | fill.       (default 'cover')
 *                With cover (the default) double-clicking the filled slot
 *                enters a reframe mode: the whole image spills past the mask
 *                (translucent outside, opaque inside), drag to reposition,
 *                corner-drag to scale. The crop persists alongside the image
 *                in the sidecar. contain/fill stay static.
 *   position     object-position for fit=contain|fill.     (default '50% 50%')
 *   placeholder  Empty-state caption.                      (default 'Drop an image')
 *   src          Optional initial/fallback image URL. A user drop overrides
 *                it; clearing the drop reveals src again.
 *
 * Size and layout come from ordinary CSS on the element — width/height
 * inline or from a parent grid — so it composes with any layout.
 *
 * Usage:
 *   <image-slot id="hero"   style="width:800px;height:450px" shape="rounded" radius="20"
 *               placeholder="Drop a hero image"></image-slot>
 *   <image-slot id="avatar" style="width:120px;height:120px" shape="circle"></image-slot>
 *   <image-slot id="kite"   style="width:300px;height:300px"
 *               mask="polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"></image-slot>
 */
/* END USAGE */

(() => {
  const STATE_FILE = '.image-slots.state.json';
  // 2× a ~600px slot in a 1920-wide deck — retina-sharp without making the
  // sidecar enormous. A 1200px WebP at q=0.85 is ~150-300KB.
  const MAX_DIM = 1200;
  // Raster formats only. SVG is excluded (can carry script; createImageBitmap
  // on SVG blobs is inconsistent). GIF is excluded because the canvas
  // re-encode keeps only the first frame, so an animated GIF would silently
  // go still — better to reject than surprise.
  const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

  // ── Shared sidecar store ────────────────────────────────────────────────
  // One fetch + immediate write-on-change for every <image-slot> on the
  // page. Reads via fetch() so viewing works anywhere the HTML and sidecar
  // are served together; writes go through window.omelette.writeFile, which
  // the host allowlists to *.state.json basenames only.
  const subs = new Set();
  let slots = {};
  // ids explicitly cleared before the sidecar fetch resolved — otherwise
  // the merge below can't tell "never set" from "just deleted" and would
  // resurrect the sidecar's stale value.
  const tombstones = new Set();
  let loaded = false;
  let loadP = null;

  function load() {
    if (loadP) return loadP;
    loadP = fetch(STATE_FILE)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        // Merge: sidecar loses to any in-memory change that raced ahead of
        // the fetch (drop or clear) so neither is clobbered by hydration.
        if (j && typeof j === 'object') {
          const merged = Object.assign({}, j, slots);
          // A framing-only write that raced ahead of hydration must not
          // drop a user image that's only on disk — inherit u from the
          // sidecar for any in-memory entry that lacks one.
          for (const k in slots) {
            if (merged[k] && !merged[k].u && j[k]) {
              merged[k].u = typeof j[k] === 'string' ? j[k] : j[k].u;
            }
          }
          for (const id of tombstones) delete merged[id];
          slots = merged;
        }
        tombstones.clear();
      })
      .catch(() => {})
      .then(() => { loaded = true; subs.forEach((fn) => fn()); });
    return loadP;
  }

  // Serialize writes so two near-simultaneous drops on different slots
  // can't reorder at the backend and leave the sidecar with only the
  // first. A save requested mid-flight just marks dirty and re-fires on
  // completion with the then-current slots.
  let saving = false;
  let saveDirty = false;
  function save() {
    if (saving) { saveDirty = true; return; }
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    saving = true;
    Promise.resolve(w(STATE_FILE, JSON.stringify(slots)))
      .catch(() => {})
      .then(() => { saving = false; if (saveDirty) { saveDirty = false; save(); } });
  }

  const S_MAX = 5;
  const clampS = (s) => Math.max(1, Math.min(S_MAX, s));

  // Normalize a stored slot value. Pre-reframe sidecars stored a bare
  // data-URL string; newer ones store {u, s, x, y}. Either shape is valid.
  function getSlot(id) {
    const v = slots[id];
    if (!v) return null;
    return typeof v === 'string' ? { u: v, s: 1, x: 0, y: 0 } : v;
  }

  function setSlot(id, val) {
    if (!id) return;
    if (val) { slots[id] = val; tombstones.delete(id); }
    else { delete slots[id]; if (!loaded) tombstones.add(id); }
    subs.forEach((fn) => fn());
    // A drop is rare + high-value — write immediately so nav-away can't lose
    // it. Gate on the initial read so we don't overwrite a sidecar we haven't
    // merged yet; the merge in load() keeps this change once the read lands.
    if (loaded) save(); else load().then(save);
  }

  // ── Image downscale ─────────────────────────────────────────────────────
  // Encode through a canvas so the sidecar carries resized bytes, not the
  // raw upload. Longest side is capped at 2× the slot's rendered width
  // (retina) and at MAX_DIM. WebP keeps alpha and is ~10× smaller than PNG
  // for photos, so there's no need for per-image format picking.
  async function toDataUrl(file, targetW) {
    const bitmap = await createImageBitmap(file);
    try {
      const cap = Math.min(MAX_DIM, Math.max(1, Math.round(targetW * 2)) || MAX_DIM);
      const scale = Math.min(1, cap / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL('image/webp', 0.85);
    } finally {
      bitmap.close && bitmap.close();
    }
  }

  // ── Custom element ──────────────────────────────────────────────────────
  const stylesheet =
    ':host{display:inline-block;position:relative;vertical-align:top;' +
    '  font:13px/1.3 system-ui,-apple-system,sans-serif;color:rgba(0,0,0,.55);width:240px;height:160px}' +
    '.frame{position:absolute;inset:0;overflow:hidden;background:rgba(0,0,0,.04)}' +
    // .frame img (clipped) and .spill (unclipped ghost + handles) share the
    // same left/top/width/height in frame-%, computed by _applyView(), so the
    // inside-mask crop and the outside-mask spill stay pixel-aligned.
    '.frame img{position:absolute;max-width:none;transform:translate(-50%,-50%);' +
    '  -webkit-user-drag:none;user-select:none;touch-action:none}' +
    // Reframe mode (double-click): the full image spills past the mask. The
    // spill layer is sized to the IMAGE bounds so its corners are where the
    // resize handles belong. The ghost <img> inside is translucent; the real
    // clipped <img> underneath shows the opaque in-mask crop.
    '.spill{position:absolute;transform:translate(-50%,-50%);display:none;z-index:1;' +
    '  cursor:grab;touch-action:none}' +
    ':host([data-panning]) .spill{cursor:grabbing}' +
    '.spill .ghost{position:absolute;inset:0;width:100%;height:100%;opacity:.35;' +
    '  pointer-events:none;-webkit-user-drag:none;user-select:none;' +
    '  box-shadow:0 0 0 1px rgba(0,0,0,.2),0 12px 32px rgba(0,0,0,.2)}' +
    '.spill .handle{position:absolute;width:12px;height:12px;border-radius:50%;' +
    '  background:#fff;box-shadow:0 0 0 1.5px #c96442,0 1px 3px rgba(0,0,0,.3);' +
    '  transform:translate(-50%,-50%)}' +
    '.spill .handle[data-c=nw]{left:0;top:0;cursor:nwse-resize}' +
    '.spill .handle[data-c=ne]{left:100%;top:0;cursor:nesw-resize}' +
    '.spill .handle[data-c=sw]{left:0;top:100%;cursor:nesw-resize}' +
    '.spill .handle[data-c=se]{left:100%;top:100%;cursor:nwse-resize}' +
    ':host([data-reframe]){z-index:10}' +
    ':host([data-reframe]) .spill{display:block}' +
    ':host([data-reframe]) .frame{box-shadow:0 0 0 2px #c96442}' +
    '.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' +
    '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' +
    '  cursor:pointer;user-select:none}' +
    '.empty svg{opacity:.45}' +
    '.empty .cap{max-width:90%;font-weight:500;letter-spacing:.01em}' +
    '.empty .sub{font-size:11px}' +
    '.empty .sub u{text-underline-offset:2px;text-decoration-color:rgba(0,0,0,.25)}' +
    '.empty:hover .sub u{color:rgba(0,0,0,.75);text-decoration-color:currentColor}' +
    ':host([data-over]) .frame{outline:2px solid #c96442;outline-offset:-2px;' +
    '  background:rgba(201,100,66,.10)}' +
    '.ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed rgba(0,0,0,.25);' +
    '  transition:border-color .12s}' +
    ':host([data-over]) .ring{border-color:#c96442}' +
    ':host([data-filled]) .ring{display:none}' +
    // Controls sit BELOW the mask (top:100%), absolutely positioned so the
    // author-declared slot height is unaffected. The gap is padding, not a
    // top offset, so the hover target stays contiguous with the frame.
    '.ctl{position:absolute;top:100%;left:50%;transform:translateX(-50%);padding-top:8px;' +
    '  display:flex;gap:6px;opacity:0;pointer-events:none;transition:opacity .12s;z-index:2;' +
    '  white-space:nowrap}' +
    ':host([data-filled][data-editable]:hover) .ctl,:host([data-reframe]) .ctl' +
    '  {opacity:1;pointer-events:auto}' +
    '.ctl button{appearance:none;border:0;border-radius:6px;padding:5px 10px;cursor:pointer;' +
    '  background:rgba(0,0,0,.65);color:#fff;font:11px/1 system-ui,-apple-system,sans-serif;' +
    '  backdrop-filter:blur(6px)}' +
    '.ctl button:hover{background:rgba(0,0,0,.8)}' +
    '.err{position:absolute;left:8px;bottom:8px;right:8px;color:#b3261e;font-size:11px;' +
    '  background:rgba(255,255,255,.85);padding:4px 6px;border-radius:5px;pointer-events:none}';

  const icon =
    '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' +
    '<path d="m21 15-5-5L5 21"/></svg>';

  class ImageSlot extends HTMLElement {
    static get observedAttributes() {
      return ['shape', 'radius', 'mask', 'fit', 'position', 'placeholder', 'src', 'id'];
    }

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      // .spill and .ctl sit OUTSIDE .frame so overflow:hidden + border-radius
      // on the frame (circle, pill, rounded) can't clip them.
      root.innerHTML =
        '<style>' + stylesheet + '</style>' +
        '<div class="frame" part="frame">' +
        '  <img part="image" alt="" draggable="false" style="display:none">' +
        '  <div class="empty" part="empty">' + icon +
        '    <div class="cap"></div>' +
        '    <div class="sub">or <u>browse files</u></div></div>' +
        '  <div class="ring" part="ring"></div>' +
        '</div>' +
        '<div class="spill">' +
        '  <img class="ghost" alt="" draggable="false">' +
        '  <div class="handle" data-c="nw"></div><div class="handle" data-c="ne"></div>' +
        '  <div class="handle" data-c="sw"></div><div class="handle" data-c="se"></div>' +
        '</div>' +
        '<div class="ctl"><button data-act="replace" title="Replace image">Replace</button>' +
        '  <button data-act="clear" title="Remove image">Remove</button></div>' +
        '<input type="file" accept="' + ACCEPT.join(',') + '" hidden>';
      this._frame = root.querySelector('.frame');
      this._ring = root.querySelector('.ring');
      this._img = root.querySelector('.frame img');
      this._empty = root.querySelector('.empty');
      this._cap = root.querySelector('.cap');
      this._sub = root.querySelector('.sub');
      this._spill = root.querySelector('.spill');
      this._ghost = root.querySelector('.ghost');
      this._err = null;
      this._input = root.querySelector('input');
      this._depth = 0;
      this._gen = 0;
      this._view = { s: 1, x: 0, y: 0 };
      this._subFn = () => this._render();
      // Shadow-DOM listeners live with the shadow DOM — bound once here so
      // disconnect/reconnect (e.g. React remount) doesn't stack handlers.
      this._empty.addEventListener('click', () => this._input.click());
      root.addEventListener('click', (e) => {
        const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
        if (act === 'replace') { this._exitReframe(true); this._input.click(); }
        if (act === 'clear') {
          this._exitReframe(false);
          this._gen++;
          this._local = null;
          if (this.id) setSlot(this.id, null); else this._render();
        }
      });
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
      // naturalWidth/Height aren't known until load — re-apply so the cover
      // baseline is computed from real dimensions, not the 100%×100% fallback.
      this._img.addEventListener('load', () => this._applyView());
      // Gated on editable + fit=cover so share links and contain/fill slots
      // stay static.
      this.addEventListener('dblclick', (e) => {
        if (!this.hasAttribute('data-editable') || !this._reframes()) return;
        e.preventDefault();
        if (this.hasAttribute('data-reframe')) this._exitReframe(true);
        else this._enterReframe();
      });
      // Pan + resize both originate on the spill layer. A handle pointerdown
      // drives an aspect-locked resize anchored at the opposite corner; any
      // other pointerdown on the spill pans. Offsets are frame-% so a
      // reframed slot survives responsive resize / PPTX export.
      this._spill.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || !this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        e.stopPropagation();
        this._spill.setPointerCapture(e.pointerId);
        const rect = this.getBoundingClientRect();
        const fw = rect.width || 1, fh = rect.height || 1;
        const corner = e.target.getAttribute && e.target.getAttribute('data-c');
        let move;
        if (corner) {
          // Resize about the OPPOSITE corner. Viewport-px throughout (rect
          // fw/fh, not clientWidth) so the math survives a transform:scale()
          // ancestor — deck_stage renders slides scaled-to-fit.
          const iw = this._img.naturalWidth || 1, ih = this._img.naturalHeight || 1;
          const base = Math.max(fw / iw, fh / ih);
          const sx = corner.includes('e') ? 1 : -1;
          const sy = corner.includes('s') ? 1 : -1;
          const s0 = this._view.s;
          const w0 = iw * base * s0, h0 = ih * base * s0;
          const cx0 = (50 + this._view.x) / 100 * fw;
          const cy0 = (50 + this._view.y) / 100 * fh;
          const ox = cx0 - sx * w0 / 2, oy = cy0 - sy * h0 / 2;
          const diag0 = Math.hypot(w0, h0);
          const ux = sx * w0 / diag0, uy = sy * h0 / diag0;
          move = (ev) => {
            const proj = (ev.clientX - rect.left - ox) * ux +
                         (ev.clientY - rect.top - oy) * uy;
            const s = clampS(s0 * proj / diag0);
            const d = diag0 * s / s0;
            this._view.s = s;
            this._view.x = (ox + ux * d / 2) / fw * 100 - 50;
            this._view.y = (oy + uy * d / 2) / fh * 100 - 50;
            this._clampView();
            this._applyView();
          };
        } else {
          this.setAttribute('data-panning', '');
          const start = { px: e.clientX, py: e.clientY, x: this._view.x, y: this._view.y };
          move = (ev) => {
            this._view.x = start.x + (ev.clientX - start.px) / fw * 100;
            this._view.y = start.y + (ev.clientY - start.py) / fh * 100;
            this._clampView();
            this._applyView();
          };
        }
        const up = () => {
          try { this._spill.releasePointerCapture(e.pointerId); } catch {}
          this._spill.removeEventListener('pointermove', move);
          this._spill.removeEventListener('pointerup', up);
          this._spill.removeEventListener('pointercancel', up);
          this.removeAttribute('data-panning');
          this._dragUp = null;
        };
        // Stashed so _exitReframe (Escape / outside-click mid-drag) can
        // tear the capture + listeners down synchronously.
        this._dragUp = up;
        this._spill.addEventListener('pointermove', move);
        this._spill.addEventListener('pointerup', up);
        this._spill.addEventListener('pointercancel', up);
      });
      // Wheel zoom stays available inside reframe mode as a trackpad nicety —
      // zooms toward the cursor (offset' = cursor·(1-k) + offset·k).
      this.addEventListener('wheel', (e) => {
        if (!this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        const r = this.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width * 100 - 50;
        const cy = (e.clientY - r.top) / r.height * 100 - 50;
        const prev = this._view.s;
        const next = clampS(prev * Math.pow(1.0015, -e.deltaY));
        if (next === prev) return;
        const k = next / prev;
        this._view.s = next;
        this._view.x = cx * (1 - k) + this._view.x * k;
        this._view.y = cy * (1 - k) + this._view.y * k;
        this._clampView();
        this._applyView();
      }, { passive: false });
    }

    connectedCallback() {
      // Warn once per page — an id-less slot works for the session but
      // cannot persist, and two id-less slots would share nothing.
      if (!this.id && !ImageSlot._warned) {
        ImageSlot._warned = true;
        console.warn('<image-slot> without an id will not persist its dropped image.');
      }
      this.addEventListener('dragenter', this);
      this.addEventListener('dragover', this);
      this.addEventListener('dragleave', this);
      this.addEventListener('drop', this);
      subs.add(this._subFn);
      // width%/height% in _applyView encode the frame aspect at call time —
      // a host resize (responsive grid, pane divider) would stretch the
      // image until the next _render. Re-render on size change: _render()
      // re-seeds _view from stored before clamp/apply, so a shrink→grow
      // cycle round-trips instead of ratcheting x/y toward the narrower
      // frame's clamp range.
      this._ro = new ResizeObserver(() => this._render());
      this._ro.observe(this);
      load();
      this._render();
    }

    disconnectedCallback() {
      subs.delete(this._subFn);
      this.removeEventListener('dragenter', this);
      this.removeEventListener('dragover', this);
      this.removeEventListener('dragleave', this);
      this.removeEventListener('drop', this);
      if (this._ro) { this._ro.disconnect(); this._ro = null; }
      this._exitReframe(false);
    }

    _enterReframe() {
      if (this.hasAttribute('data-reframe')) return;
      this.setAttribute('data-reframe', '');
      this._applyView();
      // Close on click outside (the spill handler stopPropagation()s so
      // in-image drags don't reach this) and on Escape. Listeners are held
      // on the instance so _exitReframe / disconnectedCallback can detach
      // exactly what was attached.
      this._outside = (e) => {
        if (e.composedPath && e.composedPath().includes(this)) return;
        this._exitReframe(true);
      };
      this._esc = (e) => { if (e.key === 'Escape') this._exitReframe(true); };
      document.addEventListener('pointerdown', this._outside, true);
      document.addEventListener('keydown', this._esc, true);
    }

    _exitReframe(commit) {
      if (!this.hasAttribute('data-reframe')) return;
      if (this._dragUp) this._dragUp();
      this.removeAttribute('data-reframe');
      this.removeAttribute('data-panning');
      if (this._outside) document.removeEventListener('pointerdown', this._outside, true);
      if (this._esc) document.removeEventListener('keydown', this._esc, true);
      this._outside = this._esc = null;
      if (commit) this._commitView();
    }

    attributeChangedCallback() { if (this.shadowRoot) this._render(); }

    // handleEvent — one listener object for all four drag events keeps the
    // add/remove symmetric and the depth counter correct.
    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        // Without preventDefault the browser never fires 'drop'.
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        // dragenter/leave fire for every descendant crossing — count depth
        // so hovering the icon inside the empty state doesn't flicker.
        if (--this._depth <= 0) { this._depth = 0; this.removeAttribute('data-over'); }
      } else if (e.type === 'drop') {
        e.preventDefault();
        e.stopPropagation();
        this._depth = 0;
        this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }

    async _ingest(file) {
      this._setError(null);
      if (!file || ACCEPT.indexOf(file.type) < 0) {
        this._setError('Drop a PNG, JPEG, WebP, or AVIF image.');
        return;
      }
      // toDataUrl can take hundreds of ms on a large photo. A Clear or a
      // newer drop during that window would be clobbered when this await
      // resumes — bump + capture a generation so stale encodes bail.
      const gen = ++this._gen;
      try {
        const w = this.clientWidth || this.offsetWidth || MAX_DIM;
        const url = await toDataUrl(file, w);
        if (gen !== this._gen) return;
        // Only exit reframe once the new image is in hand — a rejected type
        // or decode failure leaves the in-progress crop untouched.
        this._exitReframe(false);
        const val = { u: url, s: 1, x: 0, y: 0 };
        setSlot(this.id || '', val);
        // Keep a session-local copy for id-less slots so the drop still
        // shows, even though it cannot persist.
        if (!this.id) { this._local = val; this._render(); }
      } catch (err) {
        if (gen !== this._gen) return;
        this._setError('Could not read that image.');
        console.warn('<image-slot> ingest failed:', err);
      }
    }

    _setError(msg) {
      if (this._err) { this._err.remove(); this._err = null; }
      if (!msg) return;
      const d = document.createElement('div');
      d.className = 'err'; d.textContent = msg;
      this.shadowRoot.appendChild(d);
      this._err = d;
      setTimeout(() => { if (this._err === d) { d.remove(); this._err = null; } }, 3000);
    }

    // Reframing (pan/resize) is only meaningful for fit=cover — contain/fill
    // keep the old object-fit path and double-click is a no-op.
    _reframes() {
      return this.hasAttribute('data-filled') &&
        (this.getAttribute('fit') || 'cover') === 'cover';
    }

    // Cover-baseline geometry, shared by clamp/apply/resize. Null until the
    // img has loaded (naturalWidth is 0 before that) or when the slot has no
    // layout box — ResizeObserver fires with a 0×0 rect under display:none,
    // and clamping against a degenerate 1×1 frame would silently pull the
    // stored pan toward zero.
    _geom() {
      const iw = this._img.naturalWidth, ih = this._img.naturalHeight;
      const fw = this.clientWidth, fh = this.clientHeight;
      if (!iw || !ih || !fw || !fh) return null;
      return { iw, ih, fw, fh, base: Math.max(fw / iw, fh / ih) };
    }

    _clampView() {
      // Pan range on each axis is half the overflow past the frame edge.
      const g = this._geom();
      if (!g) return;
      const mx = Math.max(0, (g.iw * g.base * this._view.s / g.fw - 1) * 50);
      const my = Math.max(0, (g.ih * g.base * this._view.s / g.fh - 1) * 50);
      this._view.x = Math.max(-mx, Math.min(mx, this._view.x));
      this._view.y = Math.max(-my, Math.min(my, this._view.y));
    }

    _applyView() {
      const g = this._geom();
      const fit = this.getAttribute('fit') || 'cover';
      if (fit !== 'cover' || !g) {
        // Non-cover, or dimensions not known yet (before img load).
        this._img.style.width = '100%';
        this._img.style.height = '100%';
        this._img.style.left = '50%';
        this._img.style.top = '50%';
        this._img.style.objectFit = fit;
        this._img.style.objectPosition = this.getAttribute('position') || '50% 50%';
        return;
      }
      // Cover baseline: img fills the frame on its tighter axis at s=1, so
      // pan works immediately on the overflowing axis without zooming first.
      // Width/height and left/top are all frame-% — depends only on the
      // frame aspect ratio, so a responsive resize keeps the same crop. The
      // spill layer mirrors the same box so its corners = image corners.
      const k = g.base * this._view.s;
      const w = (g.iw * k / g.fw * 100) + '%';
      const h = (g.ih * k / g.fh * 100) + '%';
      const l = (50 + this._view.x) + '%';
      const t = (50 + this._view.y) + '%';
      this._img.style.width = w; this._img.style.height = h;
      this._img.style.left = l; this._img.style.top = t;
      this._img.style.objectFit = '';
      this._spill.style.width = w; this._spill.style.height = h;
      this._spill.style.left = l; this._spill.style.top = t;
    }

    _commitView() {
      const v = { s: this._view.s, x: this._view.x, y: this._view.y };
      if (this._userUrl) v.u = this._userUrl;
      // Framing-only (no u) persists too so an author-src slot remembers its
      // crop; clearing the sidecar still falls through to src=.
      if (this.id) setSlot(this.id, v);
      else { this._local = v; }
    }

    _render() {
      // Shape / mask. Presets use border-radius so the dashed ring can
      // follow the rounded outline; clip-path is only applied for an
      // explicit \`mask\` (the ring is hidden there since a rectangle
      // dashed border chopped by an arbitrary polygon looks broken).
      const mask = this.getAttribute('mask');
      const shape = (this.getAttribute('shape') || 'rounded').toLowerCase();
      let radius = '';
      if (shape === 'circle') radius = '50%';
      else if (shape === 'pill') radius = '9999px';
      else if (shape === 'rounded') {
        const n = parseFloat(this.getAttribute('radius'));
        radius = (Number.isFinite(n) ? n : 12) + 'px';
      }
      this._frame.style.borderRadius = mask ? '' : radius;
      this._frame.style.clipPath = mask || '';
      this._ring.style.borderRadius = mask ? '' : radius;
      this._ring.style.display = mask ? 'none' : '';

      // Controls and reframe entry gate on this so share links stay read-only.
      const editable = !!(window.omelette && window.omelette.writeFile);
      this.toggleAttribute('data-editable', editable);
      this._sub.style.display = editable ? '' : 'none';

      // Content. The sidecar is also writable by the agent's write_file
      // tool, so its value isn't guaranteed canvas-originated — only accept
      // data:image/ URLs from it. The \`src\` attribute is author-controlled
      // (Claude wrote it into the HTML) so it passes through unchanged.
      let stored = this.id ? getSlot(this.id) : this._local;
      if (stored && stored.u && !/^data:image\\//i.test(stored.u)) stored = null;
      const srcAttr = this.getAttribute('src') || '';
      this._userUrl = (stored && stored.u) || null;
      const url = this._userUrl || srcAttr;
      // Don't clobber an in-flight reframe with a store-triggered re-render.
      if (!this.hasAttribute('data-reframe')) {
        this._view = {
          s: stored && Number.isFinite(stored.s) ? clampS(stored.s) : 1,
          x: stored && Number.isFinite(stored.x) ? stored.x : 0,
          y: stored && Number.isFinite(stored.y) ? stored.y : 0,
        };
      }
      this._cap.textContent = this.getAttribute('placeholder') || 'Drop an image';
      // Toggle via style.display — the [hidden] attribute alone loses to
      // the display:flex / display:block rules in the stylesheet above.
      if (url) {
        if (this._img.getAttribute('src') !== url) {
          this._img.src = url;
          this._ghost.src = url;
        }
        this._img.style.display = 'block';
        this._empty.style.display = 'none';
        this.setAttribute('data-filled', '');
        this._clampView();
        this._applyView();
      } else {
        this._img.style.display = 'none';
        this._img.removeAttribute('src');
        this._ghost.removeAttribute('src');
        this._empty.style.display = 'flex';
        this.removeAttribute('data-filled');
      }
    }
  }

  if (!customElements.get('image-slot')) {
    customElements.define('image-slot', ImageSlot);
  }
})();
`,
    fn = `/* BEGIN USAGE */
/**
 * <metrics-overlay> — product-metrics overlay.
 *
 * Wraps any rendered UI and paints a metric glyph onto every descendant
 * that carries data-metric-id="…". The component owns no data: it loads a
 * static snapshot file the agent wrote (via the BigQuery / analytics
 * connector) and, when the user asks for filters the snapshot can't answer,
 * posts ONE message back to the host asking the agent to re-query and
 * append a fresh entry to that file's entries[] cache.
 *
 * Attributes:
 *   src           URL of the snapshot file — REQUIRED. Re-fetched when this
 *                 attribute changes and on a 'metrics:reload' event.
 *                 .js  → loaded via <script src>; the file must assign
 *                        window.__metricsSnapshot = {…}. Lets the snapshot
 *                        ship helpers (sliceSum, fmtN) the adapter uses.
 *                 .json → fetch()ed; no helpers.
 *   mode          'heat' | 'badges' | 'space'
 *                 (extensible via MetricsOverlay.registerMode). Default 'heat'.
 *                 The attribute also accepts 'off' (passthrough — see the
 *                 tweak recipe below); 'off' is not a selectable mode.
 *   window        1 | 3 | 7 | 'range' — day count. Default '7'. Presets
 *                 re-slice the loaded snapshot's daily arrays client-side;
 *                 'range' (with from/to) is answered only by an entry
 *                 fetched for exactly that range, otherwise it's a refetch.
 *   from, to      ISO datetimes (yyyy-mm-ddTHH:mm, local); read only when
 *                 window='range'. A custom range puts the overlay into
 *                 'stale' state unless an entry fetched for that exact
 *                 range is already cached.
 *   lens          Cohort key from snapshot.cohorts[].tier, or ''. Default ''.
 *   controls      'sentence' | 'none'. Default 'sentence' — renders the
 *                 serif sentence control ("Showing heat-map for all users
 *                 over the last week.") above the stage. 'none' for headless
 *                 use where the host owns the controls.
 *   adapter-opts  JSON string, merged into the createAdapter opts. Only for
 *                 the non-function bits (primaryScope etc.) — for function-
 *                 valued opts use el.configure() instead.
 *   funnel-src    URL of a funnels.json file (array of {name,def,result}).
 *                 Defaults to './funnels.json'. The pill shelf always
 *                 renders (unless controls='none' / mode='off'); when the
 *                 file is missing the shelf shows just "＋ Add user flow"
 *                 and the first add has the host create it. Re-fetched on
 *                 attribute change and on 'metrics:reload'. Also accepted
 *                 as 'funnelsrc' (DC <x-import> strips hyphens).
 *   funnel        'off' | '<name>'. Default 'off'. Reflects the active
 *                 shelf pill; setting it toggles the right panel. The
 *                 slotted template stays visible either way. Turn on
 *                 Record in the panel and template clicks append steps;
 *                 ▶ plays the flow through (real clicks).
 *   mock-funnel   When present (or when parent===window), "Get latest
 *                 numbers" resolves locally after ~1.2s with a synthetic
 *                 monotonic result — keeps the demo interactive without a
 *                 host handler. Set mock-funnel="off" to force-disable.
 *                 Also accepted as 'mockfunnel' (DC <x-import> strips hyphens).
 *
 * DOM contract on wrapped children:
 *   data-metric-id="copy-link"   REQUIRED — joins DOM element ↔ snapshot row
 *   data-metric-scope="share"    optional — nearest-ancestor scope; used as
 *                                the element's scope (real-estate grouping,
 *                                secondary-scope ring) when the snapshot row
 *                                doesn't set one
 *   data-funnel-screen="home"    optional — on a screen-level ancestor. The
 *                                Record mode tags each step with the nearest
 *                                ancestor's value so ▶ play can emit the
 *                                right metrics:navigate {screen} for steps
 *                                on another screen.
 *
 * Slots:
 *   (default)     the wrapped UI
 *
 * Snapshot file shape — ONE daily grain; every view is derived from it:
 *   { asOf: '2026-06-24',                        // last complete UTC day included
 *     query: { lens: '', from: '…', to: '…' },   // optional — which server-
 *                                                // side filter this entry answers
 *     days: ['2026-06-11', …, '2026-06-24'],     // N most-recent COMPLETE UTC
 *                                                // days (14 typical); partial today excluded
 *     viewersDaily: [...],                       // funnel-top event, one int per day,
 *                                                // aligned to days[]. For a multi-scope
 *                                                // screen, a {scope: [...]} map instead —
 *                                                // each element divides by its own scope's array.
 *     cohorts:  [{ tier, label, viewersDaily: [...] }],  // lens menu + subline only;
 *                                                // per-element lens data needs its own entry
 *     elements: [{ id, label, scope, ev, mode, inst, suggest, note,
 *                  daily: [...] }],              // one int per day, null = not yet
 *                                                // emitting (vs 0 = existed and fired
 *                                                // zero times); aligned to days[]
 *     adapterOpts: { primaryScope, ... } }       // optional — configure() overrides
 *
 * There are no authored per-window or per-element-state fields. Everything —
 * reach %, trend, totals, the ● Nd "new" badge — is a fold over daily[] and
 * viewersDaily[] at the same indices, so numerator and denominator can't
 * desync and the trend arrow is same-window (rate vs prior-period rate, not
 * raw WoW).
 *
 * The file may also be a multi-entry cache keyed by the server-side filter,
 * so flipping the sentence control back to a previously-fetched filter
 * doesn't need another round-trip:
 *   { adapterOpts: {...},
 *     entries: [ { query:{},                 asOf, days, viewersDaily, elements, cohorts },
 *                { query:{lens:'pro'},       asOf, days, viewersDaily, elements, cohorts },
 *                { query:{from:'…',to:'…'},  asOf, days, viewersDaily, … } ] }
 * A single-object snapshot is normalised to {entries:[it]} on load. When
 * the user changes the lens or picks a custom range, the overlay picks the
 * newest entry whose \`query\` matches and re-renders from it; if none does,
 * it goes stale and shows Refetch. A refetch should APPEND an entry with \`query\` set to the
 * requested filter — never overwrite existing entries (they're the cache).
 *
 * The range control in the sentence is the user's direct filter. Picking a
 * preset (yesterday / last 3 days / last week) re-slices the loaded
 * snapshot immediately — the numbers change, no refetch. Picking a custom
 * from–to range or a cohort lens the active entry isn't scoped to marks
 * the overlay stale and shows a "Get latest numbers" button so the agent
 * re-queries and appends a matching entry.
 *
 * Host protocol — the component posts exactly one message type to
 * window.parent when the user clicks "Get latest numbers" in the sentence row:
 *
 *   { type: 'metrics:refetch',
 *     src: './metrics-data.js',          // the cache file to append an entry to
 *     filter: { window, from, to, lens, mode },
 *     reason: 'filter-unsatisfiable' | 'manual',
 *     fallbackPrompt: 'Refetch metrics-data.js from …' }
 *
 * The host sends the chat turn directly (the click is the user gesture;
 * the host builds the prompt from the structured filter fields rather than
 * trusting fallbackPrompt verbatim). The component shows "Getting…" and
 * shimmers the stage for up to 90s; once the agent has appended
 * a fresh entry to the snapshot file, the preview reload (or a
 * 'metrics:reload' event) clears the asked state.
 *
 * Clicking "File gaps report" in the gap row posts:
 *
 *   { type: 'metrics:gaps',
 *     src: './metrics-data.js',        // same snapshot file
 *     snapshotSrc: './metrics-data.js',
 *     gaps: [{ id, label, suggest }],
 *     fallbackPrompt: '…' }
 *
 * for every snapshot element with inst:false. The host direct-sends a chat
 * turn built from the typed gaps[] (not fallbackPrompt verbatim): re-check the
 * analytics source for each id (events often exist under a different name),
 * fix any misclassified rows in the snapshot, and write a TELEMETRY-GAPS.md
 * for the rest. The link shows "Filing…" for up to 90s; a
 * 'metrics:reload' clears it.
 *
 * Editing a user flow in the right panel (add/remove a step, rename,
 * relabel, delete) and clicking "Get latest numbers" both post:
 *
 *   { type: 'metrics:funnel',
 *     action: 'save' | 'delete' | 'compute',
 *     src: './funnels.json',        // the file to write
 *     name: 'Prompt → create',
 *     oldName: '…',                 // present on a rename ('save' action)
 *     def: { steps:[{screen,id,ev,label,inst}], window,
 *            splitBy, asOf, hash },  // component computes hash (djb2)
 *     funnels: [...],               // the full in-memory array
 *     snapshotSrc: './metrics-data.js',
 *     fallbackPrompt: '…' }         // only set for compute
 *
 * The host handles save/delete by writing the sanitised \`funnels\` array
 * straight to \`src\` — no agent turn, throttled at ~4/s trailing-edge. \`compute\` is the
 * only path that talks to the agent: the host builds the prompt from the
 * typed fields, the agent runs a per-user strict-sequential funnel over
 * def.steps[].ev (each step matched at or after the prior matched step's
 * timestamp), writes result:{defHash:def.hash, asOf, ranAt, seq:true,
 * rows:[{step,users,total}], gaps, commentary} back into the same entry
 * (echoing def.hash verbatim), then fires 'metrics:reload'. commentary
 * is a 2–3 sentence design read on the flow, rendered under the step
 * bars; it's regenerated on every compute so it never outlives the
 * numbers it describes. The component re-fetches both
 * the snapshot and funnel-src and clears busy state.
 *
 * ▶ play emits 'metrics:navigate' {screen,id} (bubbling, composed) when
 * a step's element isn't visible.
 * A multi-screen template should listen for this and route to screen:
 *
 *   el.addEventListener('metrics:navigate', e => router.go(e.detail.screen));
 *
 * The component itself just scrolls and rings the element once it's
 * visible; ▶ play steps through def.steps at ~900ms/step, dispatching a
 * real click on each (so the product actually navigates), falling back to
 * navigate for off-screen steps.
 *
 * <metrics-funnel src name> — defined in the same file — is a tiny
 * read-only element that renders one user flow's result.rows as title +
 * bars + a window·asOf caption. Use it to drop a computed flow into a deck
 * or doc without the overlay stage.
 *
 * Imperative API:
 *   el.configure({ scopeOf(el, domScope), primaryScope, subline(q) })
 *     — function-valued adapter opts a JSON attr can't carry. Merges over
 *       snapshot.adapterOpts and adapter-opts attr; re-renders.
 *   el.funnels    — the loaded funnels.json array (getter).
 *   el.postFunnel(action, name, def) — same as clicking Get latest numbers in the panel.
 *   el.measure()  — re-measure [data-metric-id] rects now. Call after
 *     opening a popover/menu whose contents carry metric ids (mutations
 *     are observed, but this guarantees a prompt pass).
 *   el.refetch()  — same as clicking "Get latest numbers" in the sentence row.
 *   el.fileGaps() — same as clicking "File gaps report" in the gap row.
 *   MetricsOverlay.registerMode(key, spec)
 *   MetricsOverlay.createAdapter(raw, opts)  — exported for hosts that
 *     want to drive the overlay without a src file.
 *
 * Usage — ALWAYS add this component as a tweak, never as an always-on
 * wrapper. In the template's data-props, expose a boolean \`metrics\`
 * (default false) and an enum \`metricsMode\` (heat / badges / space); in
 * renderVals map them to the element's attrs —
 *   mode:     props.metrics ? props.metricsMode : 'off'
 *   controls: props.metrics ? 'sentence'       : 'none'
 * — so with the tweak off the overlay is a true passthrough (no chrome,
 * no sentence, no legend) and the template looks unchanged.
 *
 *   <script src="metrics-overlay.js"><\/script>
 *   <metrics-overlay src="./metrics-data.js"
 *                    mode="{{mode}}" controls="{{controls}}">
 *     …product UI with data-metric-id attrs…
 *   </metrics-overlay>
 */
/* END USAGE */

(function () {
  // ─── shared format helpers ───────────────────────────────────────────
  function fmtN(n) {
    if (n == null) return '—';
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'k';
    return String(n);
  }
  function pctStr(n, d) { return d ? (100 * n / d).toFixed(1) + '%' : '—'; }
  // Sum of arr[from..to) skipping nulls. All-null (or empty) → null, so a
  // not-yet-emitting element renders as '–', not 0.
  function sliceSum(arr, from, to) {
    if (!arr) return null;
    var s = 0, got = 0;
    for (var i = Math.max(0, from); i < to && i < arr.length; i++) if (arr[i] != null) { s += arr[i]; got++; }
    return got ? s : null;
  }
  // Drop a datetime-local / ISO string to its yyyy-mm-dd date part so it
  // can be compared against days[] (which is date-only, UTC).
  function isoDay(s) { return s ? String(s).slice(0, 10) : ''; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;';
    });
  }
  // djb2 of a step list + window + splitBy → def.hash. The agent echoes
  // this verbatim into result.defHash so a hash-algo change here never
  // strands old results as permanently stale (hash is an identity, not a
  // check).
  function djb2(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return 'h-' + (h >>> 0).toString(36);
  }
  function defHash(def) {
    var s = (def.steps || []).map(function (st) { return (st.screen || '') + '|' + st.id + '|' + (st.ev || ''); }).join(';');
    return djb2(s + '|' + (def.window || '') + '|' + (def.splitBy || ''));
  }
  // Fresh when result matches def; stale when it exists but the steps/
  // window changed since it was computed; null when nothing's been run yet.
  function funnelState(f) {
    if (!f || !f.result) return null;
    return f.result.defHash === f.def.hash && f.result.asOf === f.def.asOf ? 'fresh' : 'stale';
  }
  // 3-bar SVG mini-spark for the pill — reads shape at a glance.
  function miniSpark(rows) {
    if (!rows || !rows.length) return '<span class="mxo-spk">' + barIcon + '</span>';
    var max = 0; for (var i = 0; i < rows.length; i++) if (rows[i].users > max) max = rows[i].users;
    var n = Math.min(rows.length, 4), bw = 3, g = 1, h = 10;
    var b = '';
    for (var j = 0; j < n; j++) {
      var bh = max ? Math.max(1, Math.round(h * rows[j].users / max)) : 1;
      b += '<rect x="' + j * (bw + g) + '" y="' + (h - bh) + '" width="' + bw + '" height="' + bh + '" rx="0.5"/>';
    }
    return '<svg class="mxo-spk" viewBox="0 0 ' + (n * (bw + g) - g) + ' ' + h + '" width="' + (n * (bw + g) - g) + '" height="' + h + '">' + b + '</svg>';
  }
  var barIcon = '<svg viewBox="0 0 11 10" width="11" height="10"><rect x="0" y="0" width="3" height="10" rx="0.5"/><rect x="4" y="3" width="3" height="7" rx="0.5"/><rect x="8" y="6" width="3" height="4" rx="0.5"/></svg>';
  var trashIcon = '<svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M2.5 3.5h9M5.5 3.5V2.3a.8.8 0 0 1 .8-.8h1.4a.8.8 0 0 1 .8.8v1.2M4 3.5l.5 8a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1l.5-8"/></svg>';
  var playIcon = '<svg viewBox="0 0 14 14" width="12" height="12" fill="currentColor"><path d="M4 2.5v9l7-4.5z"/></svg>';
  var pauseIcon = '<svg viewBox="0 0 14 14" width="12" height="12" fill="currentColor"><rect x="3.5" y="3" width="2.5" height="8" rx=".8"/><rect x="8" y="3" width="2.5" height="8" rx=".8"/></svg>';
  var restartIcon = '<svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 7a5 5 0 1 0 1.7-3.7L2 5"/><path d="M2 2v3h3"/></svg>';
  // The one "talk to the agent" button — sentence-row refetch and the
  // panel's compute both render this. kind → the click-handler hook;
  // busy → muted "Getting…"; disabled → dimmed no-op.
  function askBtn(kind, busy, disabled) {
    return '<button type="button" class="mxo-ask" data-ask="' + kind + '"' +
      (busy ? ' data-busy' : '') + (disabled ? ' disabled' : '') + '>' +
      (busy ? 'Getting…' : 'Get latest numbers') + '</button>';
  }

  // ─── adapter ─────────────────────────────────────────────────────────
  // The snapshot has ONE grain — per-day counts aligned to days[] — and
  // every number the overlay shows is a slice-sum over the same [from,to)
  // index range applied to both the element's daily[] and the entry's
  // (per-scope) viewersDaily[]. That structural pairing is what keeps
  // numerator and denominator coherent across every sentence-window
  // setting, and makes the trend arrow (rate / prior-period rate − 1)
  // immune to allocation swings: a traffic ramp scales both periods'
  // numerator and denominator, so the rate ratio is unchanged.
  function createAdapter(raw, opts) {
    raw = raw || { elements: [], days: [], asOf: '—', cohorts: [] };
    opts = opts || {};
    var rq = raw.query || {}, rqLens = rq.lens || '';
    var days = raw.days || [], nDays = days.length;
    var byId = raw.byId || (raw.elements || []).reduce(function (m, e) { m[e.id] = e; return m; }, {});
    // viewersDaily may be a single array (one funnel-top) or a {scope: array}
    // map (multi-scope screen). Normalise so denom() can always key by scope.
    var vd = raw.viewersDaily, vdMap = vd && !Array.isArray(vd);
    var vdFirst = vdMap ? vd[Object.keys(vd)[0]] : vd;
    function vdFor(scope) { return vdMap ? vd[scope] || vd[opts.primaryScope] || vdFirst : vd; }
    var scopeOf = opts.scopeOf || function (e, domScope) { return e.scope || e.arm || domScope || 'default'; };
    // q → [from,to) indices into days[]. Presets are "last N days"; a custom
    // range is answered only by an entry fetched FOR that range (whose whole
    // days[] IS the range), so its span is all of days[].
    function span(q) {
      q = q || {};
      if (q.win === 'range') {
        var f = isoDay(q.from), t = isoDay(q.to);
        return f && t && isoDay(rq.from) === f && isoDay(rq.to) === t ? { from: 0, to: nDays } : null;
      }
      var n = typeof q.win === 'number' && q.win > 0 ? q.win : 7;
      return { from: Math.max(0, nDays - n), to: nDays };
    }
    // Same-width window immediately preceding sp, or null when days[]
    // doesn't reach back that far — trend is undefined then, not zero.
    function prior(sp) {
      var w = sp.to - sp.from, pf = sp.from - w;
      return pf >= 0 ? { from: pf, to: sp.from } : null;
    }
    function denom(sp, scope) { return sliceSum(vdFor(scope), sp.from, sp.to); }
    // Aggregate viewers + interactions for the selected window/lens — drives
    // the subline under the sentence control so the filter change is visible
    // as a number before the per-element glyphs finish re-laying out.
    function totals(q) {
      q = q || {}; var sp = span(q);
      if (!sp) return { users: null, interactions: null, elements: 0 };
      // cohorts[].viewersDaily is menu/subline only — when the user picks a
      // lens this entry isn't scoped to, the overlay goes stale, but the
      // subline can still show that cohort's viewer count under the hatch.
      var projLens = q.lens && q.lens !== rqLens ? q.lens : '';
      var users;
      if (projLens) {
        var c = (raw.cohorts || []).filter(function (x) { return x.tier === projLens; })[0];
        users = c ? sliceSum(c.viewersDaily, sp.from, sp.to) : null;
      } else {
        users = denom(sp, opts.primaryScope || 'default');
      }
      var inter = 0, got = 0;
      for (var k in byId) {
        var n = sliceSum(byId[k].daily, sp.from, sp.to);
        if (n != null) { inter += n; got++; }
      }
      return { users: users, interactions: got ? inter : null, elements: got };
    }
    return {
      asOf: raw.asOf, days: days, raw: raw,
      meta: function (id, domScope) {
        var e = byId[id]; if (!e) return null;
        return { id: id, label: e.label || id, scope: scopeOf(e, domScope), ev: e.ev, mode: e.mode, suggest: e.suggest, inst: e.inst !== false, note: e.note };
      },
      point: function (id, q, domScope) {
        var e = byId[id]; if (!e) return null;
        var sc = scopeOf(e, domScope);
        // histDays = how many days this element has been emitting — derived,
        // so "new" self-expires and can't go stale like an authored newEv flag.
        var hd = 0; if (e.daily) for (var i = 0; i < e.daily.length; i++) if (e.daily[i] != null) hd++;
        var sp = span(q || {});
        if (!sp) return { value: null, denom: null, trend: null, prior: false, histDays: hd, daily: e.daily, days: days, scope: sc };
        var v = sliceSum(e.daily, sp.from, sp.to), d = denom(sp, sc);
        var t = null, pp = prior(sp);
        if (pp && v != null && d) {
          var pv = sliceSum(e.daily, pp.from, pp.to), pd = denom(pp, sc);
          if (pv && pd) t = (v / d) / (pv / pd) - 1;
        }
        return { value: v, denom: d, trend: t, prior: !!pp, histDays: hd, daily: e.daily, days: days, scope: sc };
      },
      span: span,
      lenses: function () {
        var c = raw.cohorts || [];
        return [{ key: '', label: 'All users' }].concat(c.map(function (x) { return { key: x.tier, label: x.label }; }));
      },
      satisfiable: function (q) {
        // An entry is a cache line keyed by its server-side filter. Lenses
        // aren't projected client-side — a different lens needs its own entry.
        if ((q.lens || '') !== rqLens) return false;
        if (q.win === 'range') return span(q) != null;
        // Preset windows mean "last N days ending at asOf". A range-scoped
        // entry's days[] aren't the most recent N, so it can't answer them.
        if (rq.from || rq.to) return false;
        return nDays > 0;
      },
      primaryScope: opts.primaryScope || 'default',
      totals: totals,
      subline: opts.subline || function (q) {
        var t = totals(q);
        if (t.users == null) return '';
        // Under a lens this entry isn't scoped to, the element counts are
        // still this entry's — don't show them next to the cohort's viewers.
        var projLens = q && q.lens && q.lens !== rqLens;
        return fmtN(t.users) + ' viewers' +
          (projLens || t.interactions == null ? '' : ' · ' + fmtN(t.interactions) + ' interactions');
      },
      fmtN: fmtN, pctStr: pctStr, sliceSum: sliceSum,
    };
  }

  // ─── mode registry ───────────────────────────────────────────────────
  // glyph(ctx) → {washHTML?: string, tag?: {cls, html, style?}} | null
  // legendHTML() → string
  var MODES = {};
  function registerMode(key, spec) { MODES[key] = Object.assign({ key: key }, spec); }

  function _nilNewDashLegend() {
    return '<span class="mxo-li"><span class="mxo-tag gap mxo-lkey">⚪</span><span><b>No event</b> — not instrumented</span></span>' +
      '<span class="mxo-li"><span class="mxo-tag newev mxo-lkey">●</span><span><b>Nd</b> — only N days of data</span></span>' +
      '<span class="mxo-li"><span class="mxo-tag nil mxo-lkey">–</span>No data in window</span>';
  }

  registerMode('heat', {
    label: 'Heat-map',
    explain: "Per-element reach — % of users who touched it in the selected window. Darker = higher reach.",
    glyph: function (ctx) {
      var m = ctx.meta, pt = ctx.point;
      var p = pt && pt.value != null && pt.denom ? pt.value / pt.denom : null;
      if (p == null) {
        if (m && !m.inst) return { washHTML: '<span class="mxo-wash nil"></span>', tag: { cls: 'mxo-tag gap', html: '⚪' } };
        if (pt && pt.histDays) return { tag: { cls: 'mxo-tag newev', html: '●\\u2009' + pt.histDays + 'd' } };
        return { tag: { cls: 'mxo-tag nil', html: '–' } };
      }
      // The wash sits in the glyph layer (.mxo-layer) over the slotted UI —
      // the tracked element itself stays fully opaque underneath. Occlusion
      // detection in _measure() keeps washes from painting through popovers.
      // Linear reach→alpha with a wide range so the top end stays readable
      // (79% vs 100% were near-identical under the old pow(p,0.55) curve).
      var c = Math.min(1, p);
      var scoped = pt && pt.scope !== ctx.adapter.primaryScope ? ' scoped' : '';
      return {
        washHTML: '<span class="mxo-wash" style="background:oklch(0.68 ' + (0.04 + c * 0.18).toFixed(3) + ' 35 / ' + (0.08 + c * 0.74).toFixed(2) + ')"></span>',
        tag: { cls: 'mxo-tag' + scoped, html: (Math.min(1, p) * 100).toFixed(p < 0.1 ? 1 : 0) + '%' },
      };
    },
    legendHTML: function () {
      return '<span class="mxo-li"><span class="mxo-lsw" style="background:oklch(0.68 0.040 35 / 0.08)"></span>' +
        '<span class="mxo-lsw" style="background:oklch(0.68 0.130 35 / 0.45)"></span>' +
        '<span class="mxo-lsw" style="background:oklch(0.68 0.220 35 / 0.82)"></span>' +
        '% reach</span>' +
        '<span class="mxo-li"><span class="mxo-tag scoped mxo-lkey">%</span>Blue ring = secondary scope</span>' +
        _nilNewDashLegend();
    },
  });

  registerMode('badges', {
    label: 'Trend',
    explain: 'Count in the window, plus same-window trend on reach rate (▲ >+4%, ▼ <−4%).',
    glyph: function (ctx) {
      var m = ctx.meta, pt = ctx.point;
      if (!pt || pt.value == null) {
        if (m && !m.inst) return { tag: { cls: 'mxo-badge nil', html: '⚪' } };
        if (pt && pt.histDays) return { tag: { cls: 'mxo-badge', html: '●\\u2009' + pt.histDays + 'd', style: 'border-color:var(--accent-blue,#2A78D6);color:var(--accent-blue,#2A78D6)' } };
        return { tag: { cls: 'mxo-badge nil', html: '–' } };
      }
      var nTxt = fmtN(pt.value);
      var t = pt.trend, arrow = '▬', cls = 'flat', tt = '';
      // trend null + prior-window-exists → element-level gap (● Nd data);
      // trend null + no prior window (custom range, or win==days.length) →
      // structural, not "new" — leave the neutral ▬.
      if (t == null) { if (pt.prior) { arrow = '●'; cls = 'new'; tt = pt.histDays + 'd data'; } }
      else if (t > 0.04) { arrow = '▲'; cls = 'up'; tt = '+' + (t * 100).toFixed(0) + '%'; }
      else if (t < -0.04) { arrow = '▼'; cls = 'dn'; tt = (t * 100).toFixed(0) + '%'; }
      else tt = '±0';
      return { tag: { cls: 'mxo-badge', html: esc(nTxt) + '<span class="mxo-tr ' + cls + '">' + arrow + (tt ? '\\u2009' + tt : '') + '</span>' } };
    },
    legendHTML: function () {
      return '<span><b>Count in window</b> + trend</span>' +
        '<span class="mxo-tr up">▲</span><span class="mxo-tr dn">▼</span><span class="mxo-tr flat">▬</span>' +
        _nilNewDashLegend();
    },
  });

  registerMode('space', {
    label: 'Real estate',
    explain: 'Click-share ÷ area-share within scope. ≥1.2× earns its footprint; ≤0.7× over-allocated.',
    glyph: function (ctx) {
      var pt = ctx.point, r = ctx.rect;
      if (!pt || pt.value == null) return null;
      var totA = 0, totC = 0;
      for (var i = 0; i < ctx.allRects.length; i++) {
        var p = ctx.allPoints[i]; if (!p || p.scope !== pt.scope) continue;
        totA += ctx.allRects[i].w * ctx.allRects[i].h; totC += p.value || 0;
      }
      var ap = (r.w * r.h) / Math.max(1, totA), cp = pt.value / Math.max(1, totC);
      var ratio = cp / Math.max(0.001, ap);
      var rc = ratio >= 1.2 ? 'over' : ratio <= 0.7 ? 'under' : 'mid';
      return { washHTML: '<span class="mxo-ring ' + rc + '"></span>', tag: { cls: 'mxo-ratio ' + rc, html: ratio.toFixed(1) + '×' } };
    },
    legendHTML: function () {
      return '<span class="mxo-li"><span class="mxo-lsw" style="background:var(--accent-success,#558A42)"></span>≥1.2× earns its footprint</span>' +
        '<span class="mxo-li"><span class="mxo-lsw" style="background:var(--accent-primary,#D97757)"></span>≤0.7× over-allocated</span>';
    },
  });

  // ─── tag layout — stack colliding tags into vertical lanes ───────────
  function layoutTags(rects) {
    var TAG_W = 44, TAG_H = 14, GAP = 4, LANE = TAG_H + GAP;
    var sorted = rects.slice().sort(function (a, b) { return (a.y - b.y) || (a.x - b.x); });
    var placed = [];
    sorted.forEach(function (r) {
      var cx = r.x + r.w / 2, below = r.y < 60, lane = 0;
      while (lane < 8) {
        var ty = below ? r.y + r.h + GAP + lane * LANE : r.y - TAG_H - GAP - lane * LANE;
        var hit = placed.some(function (p) { return Math.abs(p.cx - cx) < TAG_W && Math.abs(p.ty - ty) < TAG_H; });
        if (!hit || lane === 7) { r.tag = { cx: cx, ty: ty, below: below }; placed.push({ cx: cx, ty: ty }); break; }
        lane++;
      }
    });
  }

  var WINDOWS = [
    { key: 1, label: 'Yesterday', sent: 'for yesterday' },
    { key: 3, label: 'Last 3 days', sent: 'over the last 3 days' },
    { key: 7, label: 'Last week', sent: 'over the last week' },
  ];
  function fmtDay(iso) {
    if (!iso) return '—';
    var d = new Date(iso.indexOf('T') < 0 ? iso + 'T00:00:00' : iso);
    if (isNaN(d)) return iso;
    var day = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return (d.getHours() || d.getMinutes())
      ? day + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : day;
  }
  // Normalise a yyyy-mm-dd or yyyy-mm-ddTHH:mm string to datetime-local's
  // value/max format. A bare date gets hm appended (default '23:59' — the
  // end-of-day upper-bound sense for to/max/asOf; pass '00:00' for from).
  function asDT(s, hm) { return !s ? '' : s.indexOf('T') < 0 ? s + 'T' + (hm || '23:59') : s.slice(0, 16); }
  // 'May 27 – Jun 24' from an end date and a window like '28d'.
  function windowRange(asOf, win) {
    if (!asOf) return '';
    var end = new Date(asOf.indexOf('T') < 0 ? asOf + 'T00:00:00' : asOf);
    if (isNaN(end)) return asOf;
    var m = /^(d+)s*([dw])$/i.exec(win || '28d');
    var days = m ? (parseInt(m[1], 10) * (m[2].toLowerCase() === 'w' ? 7 : 1)) : 28;
    var start = new Date(end.getTime() - days * 864e5);
    var f = function (d) { return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); };
    return f(start) + ' – ' + f(end);
  }

  // ─── stylesheet (scoped to shadow) ───────────────────────────────────
  var CSS =
    ':host{display:block;padding:18px 20px;font-family:var(--font-ui,-apple-system,BlinkMacSystemFont,sans-serif);color:var(--text-primary,rgba(15,12,8,.92))}' +
    '.mxo-sent{font:420 19px/1.55 var(--font-display,ui-serif,Georgia,serif);letter-spacing:-0.2px;color:var(--text-secondary,rgba(15,12,8,.64));margin:0 0 4px}' +
    '.mxo-tok{position:relative;display:inline-block;color:var(--text-primary,rgba(15,12,8,.92));border-bottom:1.5px dotted var(--border-strong,rgba(15,12,8,.32));padding:0 2px 1px;cursor:default}' +
    '.mxo-tok:hover{border-bottom-color:currentColor}' +
    '.mxo-tcar{font-size:10px;margin-left:3px;color:var(--text-tertiary,rgba(15,12,8,.48))}' +
    '.mxo-isel{position:absolute;inset:0;opacity:0;cursor:default;width:100%;font:500 12px/1 var(--font-ui,-apple-system,sans-serif);border:0}' +
    '.mxo-sentsub{font:400 11.5px/1.5 var(--font-ui,-apple-system,sans-serif);color:var(--text-tertiary,rgba(15,12,8,.48));margin:0 0 14px}' +
    '.mxo-rpop{position:absolute;z-index:200;top:calc(100% + 8px);left:0;min-width:280px;padding:12px;background:var(--bg-surface,#fff);border:1px solid var(--border-default,rgba(15,12,8,.14));border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.16);font:400 12px/1.5 var(--font-ui,-apple-system,sans-serif);color:var(--text-primary,rgba(15,12,8,.92))}' +
    '.mxo-rpop:not([data-open]){display:none}' +
    '.mxo-presets{display:flex;gap:6px;margin-bottom:10px}' +
    '.mxo-preset{flex:1;height:28px;padding:0 8px;border:1px solid var(--border-default,rgba(15,12,8,.14));border-radius:7px;background:var(--bg-surface,#fff);font:500 11.5px/1 var(--font-ui,-apple-system,sans-serif);color:inherit;cursor:default}' +
    '.mxo-preset:hover{background:rgba(15,12,8,.04)}' +
    '.mxo-preset[data-on]{background:var(--accent-black,#191915);border-color:var(--accent-black,#191915);color:var(--text-inverse,#FAF9F5)}' +
    '.mxo-custom{display:flex;align-items:center;gap:8px;padding-top:10px;border-top:1px solid var(--border-subtle,rgba(15,12,8,.08))}' +
    '.mxo-custom label{font-size:11px;color:var(--text-tertiary,rgba(15,12,8,.48))}' +
    '.mxo-idate{font:500 12px/1 var(--font-ui,-apple-system,sans-serif);color:inherit;background:var(--bg-surface,#fff);border:1px solid var(--border-default,rgba(15,12,8,.14));border-radius:6px;padding:5px 6px;width:168px}' +
    '.mxo-apply{height:28px;padding:0 10px;border:0;border-radius:7px;background:var(--accent-black,#191915);color:var(--text-inverse,#FAF9F5);font:550 11.5px/1 var(--font-ui,-apple-system,sans-serif);cursor:default}' +
    '.mxo-apply:disabled{opacity:.4}' +
    '.mxo-ask{display:inline-flex;align-items:center;justify-content:center;height:26px;padding:0 11px;margin-left:8px;border:0;border-radius:8px;background:var(--accent-primary,#D97757);color:#fff;font:400 12.5px/1 var(--font-ui,-apple-system,sans-serif);cursor:default;vertical-align:2px}' +
    '.mxo-ask:not([data-busy]):not(:disabled):hover{filter:brightness(0.94)}' +
    '.mxo-ask[data-busy]{background:rgba(15,12,8,.08);color:var(--text-secondary,rgba(15,12,8,.64))}' +
    '.mxo-ask:disabled{opacity:.4}' +
    '.mxo-facts .mxo-ask{height:34px;margin-left:0;border-radius:9px;font-weight:550}' +
    '@keyframes mxo-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}' +
    ':host([data-state=loading]) .mxo-layer{background:linear-gradient(90deg,rgba(15,12,8,.02) 0%,rgba(15,12,8,.07) 50%,rgba(15,12,8,.02) 100%);background-size:200% 100%;animation:mxo-shimmer 1.4s linear infinite}' +
    '@media (prefers-reduced-motion:reduce){:host([data-state=loading]) .mxo-layer{animation:none}}' +
    '.mxo-split{display:grid;grid-template-columns:minmax(0,1fr);gap:24px;align-items:start}' +
    '.mxo-stage{position:relative;background:var(--bg-surface,#fff);border:1px solid var(--border-subtle,rgba(15,12,8,.08));border-radius:14px;box-shadow:var(--shadow-sm,0 1px 3px rgba(20,20,19,.06));overflow:hidden}' +
    '.mxo-layer{position:absolute;inset:0;pointer-events:none;z-index:100}' +
    ':host([data-state=stale]) .mxo-layer{opacity:.6;background:repeating-linear-gradient(45deg,rgba(15,12,8,.04) 0 6px,transparent 6px 12px)}' +
    // mode=off + controls=none → true passthrough (the tweak-off state).
    ':host([mode=off][controls=none]){font:inherit;color:inherit;padding:0}' +
    ':host([mode=off][controls=none]) .mxo-split{gap:0}' +
    ':host([mode=off][controls=none]) .mxo-stage{border:0;border-radius:0;box-shadow:none;background:transparent;overflow:visible}' +
    ':host([mode=off][controls=none]) .mxo-legend{display:none}' +
    ':host([mode=off][controls=none]) .mxo-layer{display:none}' +
    '.mxo-box{position:absolute;border-radius:6px}' +
    // Hover-to-isolate: a mousemove hit-test on the stage marks one .mxo-g as
    // [data-hot]; when any is hot, the layer gets [data-iso] and every other
    // glyph's tag/lead fades out (and its wash dims) so the crowded pills
    // clear and you can read the one you're pointing at.
    '.mxo-g .mxo-box,.mxo-g .mxo-lead,.mxo-g .mxo-tag,.mxo-g .mxo-badge,.mxo-g .mxo-ratio{transition:opacity .12s ease-out}' +
    '.mxo-layer[data-iso] .mxo-g:not([data-hot]) .mxo-tag,.mxo-layer[data-iso] .mxo-g:not([data-hot]) .mxo-badge,.mxo-layer[data-iso] .mxo-g:not([data-hot]) .mxo-ratio,.mxo-layer[data-iso] .mxo-g:not([data-hot]) .mxo-lead{opacity:0;pointer-events:none}' +
    '.mxo-layer[data-iso] .mxo-g:not([data-hot]) .mxo-box{opacity:.4}' +
    '.mxo-wash{position:absolute;inset:-1px;border-radius:inherit;mix-blend-mode:multiply}' +
    '.mxo-wash.nil{background:repeating-linear-gradient(45deg,rgba(15,12,8,.10) 0 4px,transparent 4px 8px);outline:1px dashed rgba(15,12,8,.25)}' +
    '.mxo-tag{position:absolute;min-width:30px;padding:2px 5px;border-radius:5px;background:var(--accent-black,#191915);color:var(--text-inverse,#FAF9F5);font:700 9.5px/1 var(--font-ui,-apple-system,sans-serif);font-variant-numeric:tabular-nums;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.2);pointer-events:auto}' +
    '.mxo-tag.nil{background:rgba(15,12,8,.5)}' +
    '.mxo-tag.gap{background:rgba(15,12,8,.28)}' +
    '.mxo-tag.newev{background:var(--accent-blue,#2A78D6)}' +
    '.mxo-tag.scoped{box-shadow:0 0 0 1.5px var(--accent-blue,#2A78D6),0 1px 3px rgba(0,0,0,.2)}' +
    '.mxo-lead{position:absolute;width:1px;background:rgba(15,12,8,.35)}' +
    '.mxo-badge{position:absolute;display:inline-flex;align-items:center;gap:4px;padding:2px 6px;border-radius:5px;background:var(--bg-surface,#fff);border:1px solid var(--border-default,rgba(15,12,8,.14));font:600 10px/1 var(--font-ui,-apple-system,sans-serif);box-shadow:0 1px 3px rgba(0,0,0,.12);pointer-events:auto;font-variant-numeric:tabular-nums}' +
    '.mxo-badge.nil{opacity:.6;border-style:dashed}' +
    '.mxo-tr{font-size:9px;font-weight:700}.mxo-tr.up{color:var(--accent-success,#558A42)}.mxo-tr.dn{color:var(--accent-error,#A63244)}.mxo-tr.flat{color:var(--text-tertiary,rgba(15,12,8,.48))}.mxo-tr.new{color:var(--accent-blue,#2A78D6)}' +
    '.mxo-ring{position:absolute;inset:-2px;border-radius:7px;border:2px solid}.mxo-ring.over{border-color:var(--accent-success,#558A42)}.mxo-ring.under{border-color:var(--accent-primary,#D97757)}.mxo-ring.mid{border-color:var(--border-default,rgba(15,12,8,.14))}' +
    '.mxo-ratio{position:absolute;padding:2px 5px;border-radius:5px;font:700 9.5px/1 var(--font-ui,-apple-system,sans-serif);color:#fff;pointer-events:auto}.mxo-ratio.over{background:var(--accent-success,#558A42)}.mxo-ratio.under{background:var(--accent-primary,#D97757)}.mxo-ratio.mid{background:rgba(15,12,8,.5)}' +
    '.mxo-empty{position:absolute;border:1.5px dashed rgba(15,12,8,.3);border-radius:6px;box-sizing:border-box}' +
    '.mxo-cta{position:absolute;inset:0;display:grid;place-items:center;font:500 13px/1.4 var(--font-ui,-apple-system,sans-serif);color:var(--text-tertiary,rgba(15,12,8,.48));pointer-events:auto;text-align:center;padding:20px}' +
    '.mxo-legend{display:flex;align-items:center;flex-wrap:wrap;gap:10px 18px;padding:12px 2px;font:400 11.5px/1.4 var(--font-ui,-apple-system,sans-serif);color:var(--text-secondary,rgba(15,12,8,.64))}' +
    '.mxo-legend code{font:500 10.5px/1 var(--font-mono,ui-monospace,monospace);background:rgba(15,12,8,.06);padding:1px 4px;border-radius:4px}' +
    '.mxo-li{display:inline-flex;align-items:center;gap:7px}' +
    '.mxo-gaps{display:flex;align-items:center;gap:10px;padding:0 2px 12px;font:400 11.5px/1.4 var(--font-ui,-apple-system,sans-serif);color:var(--text-secondary,rgba(15,12,8,.64))}' +
    '.mxo-gaps:empty{display:none}' +
    ':host([mode=off][controls=none]) .mxo-gaps{display:none}' +
    '.mxo-gapbtn{display:inline-flex;align-items:center;flex:none;height:24px;padding:0 11px;border-radius:12px;border:1px solid var(--border-default,rgba(15,12,8,.14));background:transparent;font:500 11.5px/1 var(--font-ui,-apple-system,sans-serif);color:var(--text-secondary,rgba(15,12,8,.64));cursor:default}' +
    '.mxo-gapbtn:hover:not([data-busy]){background:rgba(15,12,8,.04);color:var(--text-primary,rgba(15,12,8,.92))}' +
    '.mxo-gapbtn[data-busy]{opacity:.6}' +
    '.mxo-lsw{width:13px;height:13px;border-radius:3px;display:inline-block}' +
    '.mxo-lkey{position:static;display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:13px;transform:none;box-shadow:none}' +
    // ─── user-flow shelf ─────────────────────────────────────────────
    '.mxo-shelf{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 14px}' +
    ':host([mode=off]) .mxo-shelf,:host([controls=none]) .mxo-shelf{display:none}' +
    '.mxo-pill{display:inline-flex;align-items:center;gap:7px;flex:none;height:28px;padding:0 12px;border-radius:14px;border:1px solid var(--border-default,rgba(15,12,8,.14));background:var(--bg-surface,#fff);font:500 12px/1 var(--font-ui,-apple-system,sans-serif);color:var(--text-primary,rgba(15,12,8,.92));cursor:default;white-space:nowrap}' +
    '.mxo-pill:hover{background:rgba(15,12,8,.04)}' +
    '.mxo-pill[data-on]{background:var(--accent-black,#191915);border-color:var(--accent-black,#191915);color:var(--text-inverse,#FAF9F5)}' +
    '.mxo-spk{fill:currentColor;opacity:.6}.mxo-pill[data-on] .mxo-spk{opacity:.9}' +
    '.mxo-chip{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:5px;font:650 9.5px/1 var(--font-ui,-apple-system,sans-serif);letter-spacing:.06em;text-transform:uppercase;flex:none}' +
    '.mxo-chip.stale{background:rgba(200,130,30,.16);color:#B0761A}' +
    '.mxo-fwarn{font:550 10.5px/1.3 var(--font-ui,-apple-system,sans-serif);color:#B0761A;margin-top:5px;cursor:help}' +

    // ─── right panel ─────────────────────────────────────────────────
    ':host([data-funnel-view=panel]) .mxo-split{grid-template-columns:minmax(0,1fr) 340px}' +
    '@keyframes mxo-pulse{0%{box-shadow:0 0 0 0 rgba(217,119,87,.5)}100%{box-shadow:0 0 0 10px rgba(217,119,87,0)}}' +
    '.mxo-ping{position:absolute;border:2px solid var(--accent-primary,#D97757);border-radius:8px;pointer-events:none;z-index:120;animation:mxo-pulse .5s ease-out}' +
    // ─── ▶ Play cursor (glide → dip → click) ────────────────────────────
    '.mxo-cursor{position:absolute;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:999px;background:var(--accent-primary,#D97757);box-shadow:0 0 0 4px rgba(217,119,87,.22),0 2px 6px rgba(0,0,0,.25);pointer-events:none;z-index:122;transition:left .38s cubic-bezier(.4,.1,.2,1),top .38s cubic-bezier(.4,.1,.2,1),transform .12s ease-out}' +
    '.mxo-frow[data-active]{border-radius:8px;box-shadow:inset 0 0 0 2px var(--accent-primary,#D97757);animation:mxo-pulse .5s ease-out;margin-left:-10px;padding-left:36px;margin-right:-10px;padding-right:10px}' +
    '.mxo-frow[data-active] .mxo-fn,.mxo-smark[data-active]{background:var(--accent-primary,#D97757);border-color:var(--accent-primary,#D97757);color:#fff}' +
    // ─── right panel ─────────────────────────────────────────────────
    '.mxo-rail{display:none}' +
    // Sticky so the panel stays in view when the wrapped template is taller
    // than the viewport — the template scrolls, the panel doesn't.
    ':host([data-funnel-view=panel]) .mxo-rail{display:flex;flex-direction:column;position:sticky;top:16px;max-height:var(--mxo-panel-max-h,calc(100vh - 32px));overflow-y:auto;background:var(--bg-surface,#fff);border:1px solid var(--border-subtle,rgba(15,12,8,.08));border-radius:14px;box-shadow:var(--shadow-sm,0 1px 3px rgba(20,20,19,.06));padding:18px 16px;min-height:200px;box-sizing:border-box}' +
    '.mxo-fhdr{display:flex;align-items:start;gap:8px;margin:0 0 10px}' +
    '.mxo-pctl{display:flex;align-items:center;gap:4px;flex:none}' +
    '.mxo-play{flex:none;display:grid;place-items:center;width:26px;height:26px;margin-top:1px;border:0;border-radius:6px;background:var(--accent-black,#191915);color:var(--text-inverse,#FAF9F5);cursor:default}' +
    '.mxo-play:hover{filter:brightness(1.2)}.mxo-play:disabled{opacity:.3}' +
    '.mxo-play[data-on]{background:var(--accent-primary,#D97757)}' +
    '.mxo-restart{flex:none;display:grid;place-items:center;width:26px;height:26px;margin-top:1px;border:1px solid var(--border-default,rgba(15,12,8,.14));border-radius:6px;background:var(--bg-surface,#fff);color:var(--text-secondary,rgba(15,12,8,.64));cursor:default}' +
    '.mxo-restart:hover{background:rgba(15,12,8,.04);color:var(--text-primary,rgba(15,12,8,.92))}' +
    '.mxo-pn{font:550 11px/26px var(--font-ui,-apple-system,sans-serif);color:var(--text-tertiary,rgba(15,12,8,.48));padding:0 2px}' +
    '.mxo-rec{display:flex;align-items:center;justify-content:center;width:100%;height:34px;margin:0 0 14px;border:1px solid var(--border-default,rgba(15,12,8,.14));border-radius:9px;font:550 12.5px/1 var(--font-ui,-apple-system,sans-serif);cursor:default;background:var(--bg-surface,#fff);color:var(--text-primary,rgba(15,12,8,.92))}' +
    '.mxo-rec:hover{background:rgba(15,12,8,.04)}' +
    '.mxo-rec[data-on]{background:var(--accent-error,#A63244);border-color:var(--accent-error,#A63244);color:#fff}' +
    ':host([data-recording]) .mxo-stage{box-shadow:inset 0 0 0 2px var(--accent-error,#A63244),var(--shadow-sm,0 1px 3px rgba(20,20,19,.06))}' +
    '.mxo-ftitle{flex:1;min-width:0;font:500 17px/1.3 var(--font-display,ui-serif,Georgia,serif);outline:none;border-radius:4px;padding:2px 4px;margin-left:-4px;overflow-wrap:anywhere}' +
    '.mxo-ftitle:hover{background:rgba(15,12,8,.04)}.mxo-ftitle:focus{background:rgba(15,12,8,.06);box-shadow:0 0 0 2px rgba(15,12,8,.12)}' +
    '.mxo-fdel{flex:none;display:grid;place-items:center;width:26px;height:26px;margin-top:1px;border:0;border-radius:6px;background:none;color:var(--text-tertiary,rgba(15,12,8,.48));cursor:default}' +
    '.mxo-fdel:hover{background:rgba(15,12,8,.06);color:var(--accent-error,#A63244)}' +

    '.mxo-smark{position:absolute;min-width:18px;height:18px;padding:0 4px;box-sizing:border-box;border-radius:9px;background:var(--bg-surface,#fff);border:1px solid rgba(15,12,8,.15);color:var(--text-secondary,rgba(15,12,8,.64));font:600 10px/16px var(--font-ui,-apple-system,sans-serif);text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.12);z-index:110}' +
    '.mxo-frow{position:relative;padding:0 0 6px 26px;margin-bottom:10px}' +
    '.mxo-fn{position:absolute;left:0;top:0;min-width:18px;height:18px;padding:0 4px;box-sizing:border-box;border-radius:9px;background:var(--bg-surface,#fff);border:1px solid rgba(15,12,8,.15);color:var(--text-secondary,rgba(15,12,8,.64));font:600 10px/16px var(--font-ui,-apple-system,sans-serif);text-align:center}' +
    '.mxo-fhd{display:flex;align-items:center;gap:7px;font:550 12.5px/1.3 var(--font-ui,-apple-system,sans-serif)}' +
    '.mxo-flbl{outline:none;border-radius:3px;padding:1px 3px;margin:-1px -3px;min-width:1ch}' +
    '.mxo-flbl:hover{background:rgba(15,12,8,.04)}.mxo-flbl:focus{background:rgba(15,12,8,.06);box-shadow:0 0 0 2px rgba(15,12,8,.12)}' +
    '.mxo-fx{margin-left:auto;border:0;background:none;padding:2px 4px;font:400 13px/1 var(--font-ui,-apple-system,sans-serif);color:var(--text-tertiary,rgba(15,12,8,.48));cursor:default}' +
    '.mxo-fx:hover{color:var(--accent-error,#A63244)}' +
    '.mxo-fev{font:500 10.5px/1.4 var(--font-mono,ui-monospace,monospace);color:var(--text-tertiary,rgba(15,12,8,.48));margin:2px 0 5px}' +
    '.mxo-fev.gap{color:rgba(15,12,8,.4)}' +
    '.mxo-fdata{display:flex;align-items:center;gap:10px;margin-top:4px}' +
    '.mxo-fbar{flex:1;position:relative;height:7px;border-radius:4px;background:rgba(15,12,8,.06);overflow:hidden}' +
    '.mxo-fbar>span{position:absolute;inset:0 auto 0 0;border-radius:4px;background:var(--accent-primary,#D97757)}' +
    '.mxo-fbar.gap{background:repeating-linear-gradient(45deg,rgba(15,12,8,.10) 0 4px,transparent 4px 8px)}' +
    '.mxo-fbar.gap>span{display:none}' +
    '.mxo-fdrop{font:650 12px/1 var(--font-ui,-apple-system,sans-serif);font-variant-numeric:tabular-nums;min-width:40px;text-align:right}' +
    '.mxo-fnum{font:500 10.5px/1 var(--font-ui,-apple-system,sans-serif);color:var(--text-tertiary,rgba(15,12,8,.48));font-variant-numeric:tabular-nums;min-width:36px;text-align:right}' +
    '.mxo-fnote{font:400 11px/1.45 var(--font-ui,-apple-system,sans-serif);color:var(--text-tertiary,rgba(15,12,8,.48));margin:8px 0 0}' +
    '.mxo-fnote b{color:var(--text-secondary,rgba(15,12,8,.64));font-weight:600}' +
    '.mxo-fcom{font:400 12px/1.5 var(--font-ui,-apple-system,sans-serif);color:var(--text-secondary,rgba(15,12,8,.64));margin:6px 0 0}' +
    '.mxo-fcom b{display:block;font:600 10px/1 var(--font-ui,-apple-system,sans-serif);letter-spacing:.04em;text-transform:uppercase;color:var(--text-tertiary,rgba(15,12,8,.48));margin:0 0 6px}' +
    '.mxo-fempty{font:400 12.5px/1.5 var(--font-ui,-apple-system,sans-serif);color:var(--text-tertiary,rgba(15,12,8,.48));padding:32px 12px;text-align:center}' +
    '.mxo-fempty b{color:var(--text-secondary,rgba(15,12,8,.64));font-weight:600}' +
    '.mxo-facts{display:flex;flex-direction:column;gap:8px;margin-top:auto;padding-top:14px}' +
    '.mxo-ffoot{display:flex;align-items:center;gap:8px;font:400 11px/1.4 var(--font-ui,-apple-system,sans-serif);color:var(--text-tertiary,rgba(15,12,8,.48))}';

  // ─── <metrics-overlay> ───────────────────────────────────────────────
  class MetricsOverlay extends HTMLElement {
    static get observedAttributes() {
      return ['src', 'mode', 'window', 'lens', 'from', 'to', 'controls', 'adapter-opts',
        'funnel-src', 'funnelsrc', 'funnel', 'mock-funnel', 'mockfunnel'];
    }

    constructor() {
      super();
      var root = this.attachShadow({ mode: 'open' });
      root.innerHTML =
        '<style>' + CSS + '</style>' +
        '<div class="mxo-sent" part="sentence"></div>' +
        '<div class="mxo-sentsub" part="subline"></div>' +
        '<div class="mxo-shelf" part="shelf"></div>' +
        '<div class="mxo-split">' +
        '  <div>' +
        '    <div class="mxo-stage" part="stage"><slot></slot><div class="mxo-layer"></div></div>' +
        '    <div class="mxo-legend" part="legend"></div>' +
        '    <div class="mxo-gaps" part="gaps"></div>' +
        '  </div>' +
        '  <div class="mxo-rail" part="funnel"></div>' +
        '</div>';
      this._sent = root.querySelector('.mxo-sent');
      this._sub = root.querySelector('.mxo-sentsub');
      this._shelf = root.querySelector('.mxo-shelf');
      this._stage = root.querySelector('.mxo-stage');
      this._layer = root.querySelector('.mxo-layer');
      this._rail = root.querySelector('.mxo-rail');
      this._legend = root.querySelector('.mxo-legend');
      this._gaps = root.querySelector('.mxo-gaps');
      this._opts = {};    // configure()
      this._rpopOpen = false;
      this._rects = [];
      this._snapshot = null;  // {entries:[…], adapters:[…], adapterOpts} — normalised multi-entry cache
      this._raw = null;       // the currently-active entry of _snapshot.entries
      this._adapter = null;
      this._loadGen = 0;
      var self = this;
      // sentence-builder delegated handlers (survive _renderSentence rebuilds)
      this._sent.addEventListener('change', function (e) {
        var k = e.target && e.target.getAttribute('data-k');
        if (k === 'mode' || k === 'lens') self.setAttribute(k, e.target.value);
      });
      this._sent.addEventListener('input', function (e) {
        // Filling the from-date enables Apply without re-rendering (which
        // would close the popover); to defaults to the snapshot's asOf.
        if (e.target.getAttribute('data-k') !== 'from') return;
        var ap = self._sent.querySelector('.mxo-apply');
        if (ap) ap.disabled = !e.target.value;
      });
      var closeRpop = function () {
        self._rpopOpen = false;
        var p = self._sent.querySelector('.mxo-rpop');
        if (p) p.removeAttribute('data-open');
      };
      this._sent.addEventListener('click', function (e) {
        var pre = e.target.closest('.mxo-preset');
        if (pre) {
          closeRpop();
          self.removeAttribute('from'); self.removeAttribute('to');
          self.setAttribute('window', pre.getAttribute('data-win'));
          return;
        }
        if (e.target.closest('.mxo-apply')) {
          var f = self._sent.querySelector('.mxo-idate[data-k=from]');
          var t = self._sent.querySelector('.mxo-idate[data-k=to]');
          if (!f || !f.value) return;
          var fv = f.value, tv = (t && t.value) || asDT(self._adapter ? self._adapter.asOf : '');
          if (tv && fv > tv) { var x = fv; fv = tv; tv = x; }
          closeRpop();
          self.setAttribute('from', fv);
          self.setAttribute('to', tv);
          self.setAttribute('window', 'range');
          return;
        }
        // Clicks inside the popover (on a date input, on whitespace) mustn't
        // re-toggle it — only the token label itself does that.
        if (e.target.closest('.mxo-rpop')) return;
        var rt = e.target.closest('.mxo-tok[data-k=range]');
        if (rt) {
          var p = rt.querySelector('.mxo-rpop');
          self._rpopOpen = !self._rpopOpen;
          if (p) { if (self._rpopOpen) p.setAttribute('data-open', ''); else p.removeAttribute('data-open'); }
          return;
        }
        if (!e.target.closest('[data-ask=refetch]')) return;
        // Clicking the muted "Getting…" chip reverts immediately (the chat turn
        // is already in flight — nothing to abort; this is the "I changed my
        // mind" / "it's been a while" reset).
        if (self.getAttribute('data-state') === 'loading') {
          clearTimeout(self._askTimeout);
          self._setState(self._stale ? 'stale' : self._hasData() ? null : 'empty');
          return;
        }
        self.refetch(self._staleReason || 'manual');
      });
      // Close the popover on outside click / Escape.
      this._onDoc = function (e) {
        if (!self._rpopOpen) return;
        if (e.type === 'keydown' && e.key !== 'Escape') return;
        if (e.type === 'click' && e.composedPath().indexOf(self._sent) >= 0) return;
        self._rpopOpen = false;
        var p = self._sent.querySelector('.mxo-rpop');
        if (p) p.removeAttribute('data-open');
      };
      // Gap row — the "File gaps report" action.
      this._gaps.addEventListener('click', function (e) {
        var ask = e.target.closest('[data-ask=gaps]');
        if (!ask || ask.hasAttribute('data-busy')) return;
        self.fileGaps();
      });
      this.addEventListener('metrics:reload', function () { self._gapsBusy = false; self._load(); self._loadFunnels(); });
      // Host → preview reload nudge (so <metrics-funnel> widgets also sync).
      this._onMsg = function (e) {
        if (!e.data || e.data.type !== 'metrics:reload') return;
        // scope:'funnels' is the echo of our OWN save — this element is the
        // source of truth for _funnels, so re-reading the file here would
        // clobber optimistic edits / mid-type contenteditables / the Getting…
        // state. <metrics-funnel> widgets DO re-read on it.
        if (e.data.scope === 'funnels') return;
        self._gapsBusy = false;
        // scope:'gaps' is just the host's ack that the chat turn was sent —
        // clear busy + re-render, skip the snapshot re-fetch.
        if (e.data.scope === 'gaps') { self._render(); return; }
        self._load(); self._loadFunnels();
      };

      // ─── funnels ─────────────────────────────────────────────────
      this._funnels = null;  // loaded array (or null while funnel-src loads)
      this._fBusy = null;    // name of the flow currently being (re)computed
      // Shelf: pill clicks toggle the right panel via the 'funnel' attr.
      this._shelf.addEventListener('click', function (e) {
        var p = e.target.closest('.mxo-pill');
        if (!p) return;
        if (p.classList.contains('mxo-add')) { self._flushSave(); self._addFlow(); return; }
        var to = p.getAttribute('data-funnel');
        var cur = self.getAttribute('funnel') || 'off';
        self.setAttribute('funnel', to === cur ? 'off' : to);
      });
      // Hover-to-isolate: hit-test the mouse against this._rects (the layer
      // is pointer-events:none so clicks still reach the slotted product).
      // Hovering a tag (pointer-events:auto) uses its wrapper's data-ix so
      // moving onto the pill doesn't drop the isolation.
      this._isoIx = -1;
      this._stage.addEventListener('mousemove', function (e) { self._isolate(e); });
      this._stage.addEventListener('mouseleave', function () { self._isolate(null); });
      // Record mode: capture-phase click on the stage watches the slotted
      // light DOM. Clicks on data-metric-id append a step AND fire through
      // (so multi-screen flows record themselves as you use the product).
      this._stage.addEventListener('click', function (e) {
        if (self.getAttribute('mode') === 'off') return;  // tweak-off passthrough
        var cur = self._curFunnel();
        if (!cur || !self._recording) return;
        var t = e.target.closest && e.target.closest('[data-metric-id]');
        if (!t || !self.contains(t)) return;
        var id = t.getAttribute('data-metric-id');
        // Already recorded → plain click just fires (navigation), no-op here.
        if (cur.def.steps.some(function (s) { return s.id === id; })) return;
        var m = self._adapter ? self._adapter.meta(id) : null;
        var scr = t.closest('[data-funnel-screen]');
        cur.def.steps.push({
          id: id,
          screen: scr ? scr.getAttribute('data-funnel-screen') : '',
          label: (m && m.label) || t.textContent.trim().slice(0, 40) || id,
          ev: m ? m.ev : null,
          inst: !m || m.inst !== false,
        });
        self._flash(id);
        self._commitDef(cur);
      }, true);
      // Right panel: title / label edit · ▶⏸⟲ · Record · × · delete · Get latest numbers.
      this._rail.addEventListener('keydown', function (e) {
        if ((e.target.classList.contains('mxo-ftitle') || e.target.classList.contains('mxo-flbl')) && e.key === 'Enter') {
          e.preventDefault(); e.target.blur();
        }
      });
      // Title + step-label edits commit on blur: optimistic in-memory edit
      // then a debounced metrics:funnel {action:'save'} so the host rewrites
      // funnels.json. Labels aren't part of def.hash so a label-only edit
      // keeps result fresh.
      this._rail.addEventListener('focusout', function (e) {
        var cur = self._curFunnel();
        if (!cur) return;
        if (e.target.classList.contains('mxo-ftitle')) {
          var nm = e.target.textContent.trim().slice(0, 80) || 'Untitled flow';
          // 'off' is the funnel attr's routing token — unreachable as a name.
          if (nm === 'off') nm = 'off (flow)';
          nm = self._dedupeName(nm, cur);
          if (nm === cur.name) { self._renderFunnel(); return; }
          clearTimeout(self._saveT); self._saveF = null;
          var old = cur.name, wasRec = self._recording;
          cur.name = nm;
          self.setAttribute('funnel', nm);  // keeps pill + panel in sync; resets recording →
          if (wasRec) self._setRecording(true);  // …restore
          self.postFunnel('save', nm, cur.def, { oldName: old });
        } else if (e.target.classList.contains('mxo-flbl')) {
          var li = parseInt(e.target.getAttribute('data-ix'), 10);
          var s = cur.def.steps[li];
          if (!s) return;
          var lbl = e.target.textContent.trim().slice(0, 60) || s.id;
          if (lbl === (s.label || s.id)) return;
          s.label = lbl;
          self._commitDef(cur, false);  // label-only: don't re-hash
        }
      });
      this._rail.addEventListener('click', function (e) {
        var cur = self._curFunnel();
        var x = e.target.closest('.mxo-fx');
        if (x && cur) {
          var ix = parseInt(x.getAttribute('data-ix'), 10);
          if (ix >= 0) { cur.def.steps.splice(ix, 1); self._commitDef(cur); }
          return;
        }
        if (e.target.closest('.mxo-play') && cur) {
          if (self._playing === 'playing') self._pause();
          else if (self._playing === 'paused' && self._playFlow === cur) self._play(cur, self._playIx);
          else self._play(cur, 0);
          return;
        }
        if (e.target.closest('.mxo-restart') && cur) {
          self._play(cur, 0);
          return;
        }
        if (e.target.closest('.mxo-rec')) {
          self._setRecording(!self._recording);
          return;
        }
        if (e.target.closest('.mxo-fdel') && cur) {
          clearTimeout(self._saveT); self._saveF = null;
          // Optimistic remove + post delete so the host drops it from
          // funnels.json. No confirm — the file's recoverable.
          var ix2 = self._funnels.indexOf(cur);
          if (ix2 >= 0) self._funnels.splice(ix2, 1);
          self.setAttribute('funnel', 'off');
          self.postFunnel('delete', cur.name, cur.def);
          return;
        }
        var ask = e.target.closest('.mxo-ask');
        if (!ask || ask.disabled || ask.hasAttribute('data-busy') || !cur) return;
        self._setRecording(false);
        self._flushSave();
        self.postFunnel('compute', cur.name, cur.def);
      });
    }

    connectedCallback() {
      var self = this;
      // Geometry probe — slotted content is light DOM, so query on the host.
      // A single rAF isn't enough for late-mounting content (popovers,
      // transitions): the MutationObserver fires, but on that first frame the
      // new nodes are still width/height < 2 and get skipped. So each schedule
      // also runs a short trailing chain (~80ms apart, up to 3 retries while
      // any [data-metric-id] node is still under-size).
      var schedule = this._schedule = function () {
        cancelAnimationFrame(self._raf); clearTimeout(self._trail);
        self._retries = 0;
        self._raf = requestAnimationFrame(function () { self._measure(); });
        self._trail = setTimeout(function trail() {
          if (self._measure() && self._retries < 3) { self._retries++; self._trail = setTimeout(trail, 80); }
        }, 80);
      };
      this._mo = new MutationObserver(schedule);
      this._mo.observe(this, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class', 'data-metric-id', 'data-metric-scope'] });
      this._ro = new ResizeObserver(schedule);
      this._ro.observe(this._stage);
      window.addEventListener('resize', this._onWin = schedule);
      document.addEventListener('click', this._onDoc, true);
      document.addEventListener('keydown', this._onDoc, true);
      window.addEventListener('message', this._onMsg);
      // initial burst — child DC/x-import content may stream in
      var n = 0; this._burst = setInterval(function () { self._measure(); if (++n > 12) clearInterval(self._burst); }, 120);
      this._load();
      this._loadFunnels();
      this._render();
    }

    disconnectedCallback() {
      if (this._mo) this._mo.disconnect();
      if (this._ro) this._ro.disconnect();
      window.removeEventListener('resize', this._onWin);
      document.removeEventListener('click', this._onDoc, true);
      document.removeEventListener('keydown', this._onDoc, true);
      window.removeEventListener('message', this._onMsg);
      clearInterval(this._burst);
      cancelAnimationFrame(this._raf);
      clearTimeout(this._trail);
      clearTimeout(this._askTimeout);
      clearTimeout(this._gapsT);
      clearTimeout(this._fBusyT);
      clearTimeout(this._saveT);
      clearTimeout(this._playT);
      clearTimeout(this._locateT);
      clearTimeout(this._clickT);
      this._playing = null; this._playFlow = null;
      clearTimeout(this._mockT);
      if (this._scriptEl) this._scriptEl.remove();
      this._loadGen++; this._fLoadGen = (this._fLoadGen || 0) + 1;  // discard any in-flight _load/_loadFunnels so a late resolution can't revive a detached element
    }

    attributeChangedCallback(name, prev, next) {
      if (!this.shadowRoot || prev === next) return;
      if (name === 'src') this._load();
      else if (name === 'funnel-src' || name === 'funnelsrc') this._loadFunnels();
      else if (name === 'funnel') { this._flushSave(); this._stopPlay(); this._setRecording(false); this._fBusyHash = null; this._fBusyIx = null; this._render(); }
      else if (name === 'adapter-opts') this._rebuildAdapter();
      else this._render();
    }

    configure(opts) {
      this._opts = Object.assign({}, this._opts, opts || {});
      this._rebuildAdapter();
      return this;
    }

    measure() {
      if (this._schedule) this._schedule(); else this._measure();
      return this;
    }

    get funnels() { return this._funnels; }

    postFunnel(action, name, def, opts) {
      opts = opts || {};
      var src = this._funnelSrc();
      // Preserve an existing hash so a djb2 change here can't strand a
      // previously-computed result as permanently stale (the agent echoes
      // defHash verbatim, so old-hash result + new-hash recompute = mismatch).
      def = Object.assign({}, def, { hash: def.hash || defHash(def) });
      var steps = (def.steps || []).filter(function (s) { return s.inst !== false && s.ev; });
      // Only compute reaches the agent; save/delete are host file writes.
      var fallbackPrompt = '';
      if (action !== 'save' && action !== 'delete') {
        var untitled = /^Untitled flow( [0-9]+)?$/.test(name);
        fallbackPrompt = 'In ' + (src || 'funnels.json') + ', ' +
          (action === 'compute' ? 'recompute' : 'upsert {name:"' + name + '",def} and compute') +
          ' the "' + name + '" user flow: a per-user strict-sequential funnel through ' +
          steps.map(function (s) { return s.ev; }).join(' → ') +
          ' over ' + (def.window || '28d') + ' ending ' + def.asOf +
          ' (per user, match step 0’s first in-window occurrence, then each later step’s first occurrence at or after the prior matched step’s timestamp).' +
          ' Write result {defHash:"' + def.hash + '",asOf,ranAt,seq:true,rows:[{step,users,total}],gaps,commentary} back into that entry (total = distinct users who fired that step’s event at all in the window; echo defHash verbatim)' +
          (untitled ? ', and also set a short descriptive name on that entry based on its steps' : '') +
          '. For commentary, write 2–3 sentences of design insight — don’t restate the numbers; say what the drop-off pattern suggests about the UX and what design change might help. Then reload the overlay.';
      }
      var msg = { type: 'metrics:funnel', action: action, src: src, name: name, def: def,
        oldName: opts.oldName || undefined,
        // Full current array so a host with project-file access can write
        // funnels.json directly without a read (save/delete are just file
        // writes — no agent turn).
        funnels: (this._funnels || []).map(function (f) { return { name: f.name, def: f.def, result: f.result || null }; }),
        snapshotSrc: this.getAttribute('src'), fallbackPrompt: fallbackPrompt };
      try { window.parent.postMessage(msg, '*'); } catch (e) {}
      this.dispatchEvent(new CustomEvent('metrics:funnel', { detail: msg, bubbles: true, composed: true }));
      // save/delete don't wait on a query — the optimistic in-memory edit
      // already rendered; the host just rewrites the file. No re-render
      // here (would wipe an active contenteditable caret).
      if (action === 'delete' || action === 'save') return;
      this._fBusy = name;
      this._fBusyHash = def.hash;
      // Hash alone isn't unique (defHash excludes name); remember the
      // array slot so the post-rename rematch in _loadFunnels prefers
      // this entry over a same-steps sibling.
      this._fBusyIx = null;
      var fs = this._funnels || [];
      for (var bi = 0; bi < fs.length; bi++) if (fs[bi] && fs[bi].name === name) { this._fBusyIx = bi; break; }
      this._renderShelf(); this._renderFunnel();
      // Mock round-trip keeps the demo page interactive when no host is
      // listening. Auto-on when parent===window (standalone preview); the
      // mock-funnel attr forces it either way when embedded.
      var mockAttr = this.getAttribute('mock-funnel');
      if (mockAttr == null) mockAttr = this.getAttribute('mockfunnel');
      var mock = mockAttr != null ? mockAttr !== 'off' && mockAttr !== 'false' : window.parent === window;
      var self = this;
      if (mock) {
        clearTimeout(this._mockT);
        this._mockT = setTimeout(function () { self._mockResult(name, def); }, 1200);
      }
      // Same 90s cap as refetch — if nothing ever rewrites funnel-src.
      clearTimeout(this._fBusyT);
      // 90s cap stops the "Getting…" spinner only — _fBusyHash/_fBusyIx
      // are kept so a slow compute+rename still rematches on reload.
      this._fBusyT = setTimeout(function () {
        if (self._fBusy === name) { self._fBusy = null; self._renderShelf(); self._renderFunnel(); }
      }, 90000);
    }

    refetch(reason) {
      var src = this.getAttribute('src');
      var win = this._win();
      var filter = { window: win, lens: this.getAttribute('lens') || '', mode: this.getAttribute('mode') || 'heat',
        from: this.getAttribute('from') || '', to: this.getAttribute('to') || '' };
      var had = this._raw && this._raw.asOf ? ' (current entry is as of ' + this._raw.asOf + ')' : '';
      var when = win === 'range' ? 'the range ' + filter.from + ' to ' + filter.to
        : (WINDOWS.filter(function (w) { return String(w.key) === String(win); })[0] || WINDOWS[2]).sent.replace(/^(over|for) /, '');
      var qKeys = [];
      if (filter.lens) qKeys.push('lens:"' + filter.lens + '"');
      if (win === 'range') qKeys.push('from:"' + filter.from + '",to:"' + filter.to + '"');
      var fallbackPrompt = 'Refetch ' + (src || 'the metrics snapshot') + ' from the analytics source for ' + when + had +
        (filter.lens ? ', cohort lens ' + filter.lens : '') +
        '. Append a new entry to the snapshot file\\'s entries[] array (same ids; fresh days[]/viewersDaily and per-element daily[]; set asOf; set query:{' +
        qKeys.join(',') + '}) so the overlay knows which filter it answers. The file is a cache keyed by query — append, don\\'t overwrite the existing entries — then reload the overlay.';
      var msg = { type: 'metrics:refetch', src: src, filter: filter, reason: reason || 'manual', fallbackPrompt: fallbackPrompt };
      try { window.parent.postMessage(msg, '*'); } catch (e) {}
      this.dispatchEvent(new CustomEvent('metrics:refetch', { detail: msg, bubbles: true, composed: true }));
      this._setState('loading');
      // Cap the "Getting…" state — if the chat turn errors or never rewrites
      // the snapshot, the shimmer would run forever. 90s matches the
      // DS-thumbnail Ask-Claude cap (DesignSystemPane).
      clearTimeout(this._askTimeout);
      var self = this;
      this._askTimeout = setTimeout(function () {
        if (self.getAttribute('data-state') === 'loading') self._setState(self._stale ? 'stale' : self._hasData() ? null : 'empty');
      }, 90000);
    }

    fileGaps() {
      var raw = this._raw || {};
      var A = this._adapter;
      var gaps = ((raw.elements) || [])
        .filter(function (e) { return e.inst === false; })
        .map(function (e) {
          var m = A ? A.meta(e.id) : null;
          return { id: e.id, label: (m && m.label) || e.label || e.id,
            suggest: e.suggest || '' };
        });
      if (!gaps.length) return;
      var src = this.getAttribute('src') || '';
      var list = gaps.slice(0, 30).map(function (g) {
        return g.id + (g.suggest ? ' (suggest: ' + g.suggest + ')' : '');
      }).join(', ') + (gaps.length > 30 ? ', …and ' + (gaps.length - 30) + ' more' : '');
      var fallbackPrompt = 'The metrics overlay lists ' + gaps.length +
        ' elements with no telemetry event: ' + list +
        '. First re-check the analytics source — events sometimes exist under a different name. ' +
        'For any you find, update ' + (src || 'the metrics snapshot') + ' with the real ev: and ' +
        'set inst:true, then refresh. For confirmed gaps, write ./TELEMETRY-GAPS.md next to the ' +
        'snapshot: a table of metric-id | label | suggested event + props that the user can hand to ' +
        'their app codebase to add the track() calls.';
      var msg = { type: 'metrics:gaps', src: src, snapshotSrc: src,
        gaps: gaps, fallbackPrompt: fallbackPrompt };
      try { window.parent.postMessage(msg, '*'); } catch (e) {}
      this.dispatchEvent(new CustomEvent('metrics:gaps', { detail: msg, bubbles: true, composed: true }));
      this._gapsBusy = true;
      this._render();
      // Same 90s cap as refetch / postFunnel compute.
      clearTimeout(this._gapsT);
      var self = this;
      this._gapsT = setTimeout(function () {
        if (self._gapsBusy) { self._gapsBusy = false; self._render(); }
      }, 90000);
    }

    _win() {
      var w = this.getAttribute('window') || '7';
      return w === 'range' ? 'range' : (parseInt(w, 10) || 7);
    }

    _setState(s) {
      if (s) this.setAttribute('data-state', s); else this.removeAttribute('data-state');
      this._renderSentence();
    }

    _hasData() {
      return !!(this._snapshot && this._snapshot.entries.some(function (e) { return e && e.elements && e.elements.length; }));
    }

    _load() {
      // attributeChangedCallback fires per-attr during parse, before
      // connectedCallback — skip until mounted so the initial warn/empty
      // flash and redundant script injections don't happen.
      if (!this.isConnected) return;
      var src = this.getAttribute('src');
      var gen = ++this._loadGen;
      var self = this;
      var done = function (raw) {
        if (gen !== self._loadGen) return;
        // Normalise to the multi-entry cache shape. A single-object snapshot
        // becomes a one-entry cache; adapterOpts is lifted to the top level.
        self._snapshot = !raw ? null
          : (Array.isArray(raw.entries) && raw.entries.length)
            ? { entries: raw.entries, adapterOpts: raw.adapterOpts }
            : { entries: [raw], adapterOpts: raw.adapterOpts };
        self._raw = null; self._adapter = null;
        self._rebuildAdapter();
        self._setState(self._hasData() ? null : 'empty');
        self._render();
      };
      var fail = function () { if (gen === self._loadGen) done(null); };
      // src is REQUIRED — it's the host's only handle on the snapshot file
      // (postFunnel/refetch send it as snapshotSrc/src), so a no-src mount
      // renders but silently drops every "Get latest numbers" click.
      if (!src) {
        console.warn('<metrics-overlay> requires a src= attribute.');
        return done(null);
      }
      // Resolve relative src against the document's base so it works inside
      // preview iframes (srcdoc / blob-URL documents), where a bare './x.js'
      // resolves against the wrong origin.
      var abs; try { abs = new URL(src, document.baseURI).href; } catch (e) { abs = src; }
      if (/\\.json(\\?|$)/i.test(src)) {
        fetch(abs, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(done).catch(fail);
      } else {
        // .js snapshot assigns one fixed well-known global. If a sibling
        // overlay's _load already stamped __src for this same src, skip the
        // inject on the INITIAL load only; metrics:reload (_snapshot already
        // set) always re-injects so the agent's appended entry is picked up.
        var cur = window.__metricsSnapshot;
        if (!this._snapshot && cur && cur.__src === src) return done(cur);
        // Preserve any pre-loaded snapshot so a src error can fall back to
        // it instead of dropping to 'empty'.
        var pre = cur;
        window.__metricsSnapshot = undefined;
        // re-inject with cache-buster so metrics:reload sees the fresh file
        if (this._scriptEl) this._scriptEl.remove();
        var s = document.createElement('script');
        s.src = abs + (abs.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now();
        s.onload = function () {
          var got = window.__metricsSnapshot || null;
          if (got) got.__src = src;
          done(got);
        };
        s.onerror = function () {
          if (gen !== self._loadGen) return;
          // Only restore if no sibling has since populated the shared global.
          if (pre != null && window.__metricsSnapshot === undefined) window.__metricsSnapshot = pre;
          // Keep what this element was already showing — don't drop to empty
          // because a refresh failed. Covers the sibling-clobber case (pre
          // is undefined because a sibling _load nilled the global first)
          // and the standalone-export case (helmet-preloaded pre has no
          // __src stamp). _snapshot is already normalised; done() is
          // idempotent on it and clears any 'loading' state.
          done(self._snapshot || pre || null);
        };
        this._scriptEl = s;
        document.head.appendChild(s);
      }
    }

    _rebuildAdapter() {
      var snap = this._snapshot;
      var attrOpts = {};
      var a = this.getAttribute('adapter-opts');
      if (a) { try { attrOpts = JSON.parse(a); } catch (e) { console.warn('<metrics-overlay> adapter-opts is not valid JSON:', e); } }
      var rawOpts = (snap && snap.adapterOpts) || {};
      var opts = Object.assign({}, rawOpts, attrOpts, this._opts);
      // One adapter per cache entry — _selectEntry() picks the active one.
      snap && (snap.adapters = snap.entries.map(function (e) { return createAdapter(e, opts); }));
      this._adapter = null; this._raw = null;
      this._render();
    }

    _selectEntry() {
      var snap = this._snapshot;
      if (!snap || !snap.adapters) return false;
      var q = { win: this._win(), lens: this.getAttribute('lens') || '',
        from: this.getAttribute('from') || '', to: this.getAttribute('to') || '' };
      // Newest satisfiable entry wins — satisfiable() already requires an
      // exact lens/range key match, so this is a single backward scan.
      for (var i = snap.entries.length - 1; i >= 0; i--) {
        if (snap.adapters[i].satisfiable(q)) {
          this._adapter = snap.adapters[i]; this._raw = snap.entries[i];
          return true;
        }
      }
      // No entry satisfies — keep the last active adapter so the stale hatch
      // overlays the numbers the user was just looking at (or fall back to
      // entries[0] on first render).
      if (!this._adapter) { this._adapter = snap.adapters[0]; this._raw = snap.entries[0]; }
      return false;
    }

    _lenses() {
      // Union cohorts across all entries so the lens <select> doesn't lose
      // options when the active entry is itself lens-scoped.
      var out = [{ key: '', label: 'All users' }], seen = { '': 1 };
      var snap = this._snapshot;
      if (snap) for (var i = 0; i < snap.entries.length; i++) {
        var cs = snap.entries[i] && snap.entries[i].cohorts || [];
        for (var j = 0; j < cs.length; j++) {
          if (seen[cs[j].tier]) continue; seen[cs[j].tier] = 1;
          out.push({ key: cs[j].tier, label: cs[j].label });
        }
      }
      return out;
    }

    _measure() {
      var sb = this._stage.getBoundingClientRect();
      var seen = {}, out = [], skipped = 0;
      // Slotted light-DOM — query on the host, not the shadow root.
      var els = this.querySelectorAll('[data-metric-id]');
      for (var i = 0; i < els.length; i++) {
        var el = els[i], id = el.getAttribute('data-metric-id');
        if (!id) continue;
        var r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) { skipped++; continue; }
        // Occlusion — centre covered by a sibling modal/popover inside the
        // overlay? The glyph layer sits at one z-index above all slotted
        // content, so painting a glyph for an occluded element would render
        // it on top of the occluder. Keep the rect in the set (space-mode's
        // per-scope denominators sum over it) and have _renderLayer skip
        // only the paint. (elementFromPoint ignores the layer — it's
        // pointer-events:none — and retargets shadow-DOM hits to the host.)
        var top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        var occ = !!(top && top !== this && top !== el && !el.contains(top) && !top.contains(el) && this.contains(top));
        var scopeEl = el.closest('[data-metric-scope]');
        var rect = { id: id, x: r.left - sb.left, y: r.top - sb.top, w: r.width, h: r.height, domScope: scopeEl ? scopeEl.getAttribute('data-metric-scope') : null, occluded: occ };
        // Dedup by id. A later visible instance replaces an earlier occluded
        // one (same action mirrored inside the popover that's occluding the
        // first); otherwise first-sized wins as before.
        var at = seen[id];
        if (at != null) { if (!occ && out[at].occluded) out[at] = rect; continue; }
        seen[id] = out.length;
        out.push(rect);
      }
      var prev = this._rects;
      var same = prev.length === out.length && out.every(function (r, j) {
        var p = prev[j];
        return p && p.id === r.id && p.domScope === r.domScope && p.occluded === r.occluded && Math.abs(p.x - r.x) < 0.5 && Math.abs(p.y - r.y) < 0.5 && Math.abs(p.w - r.w) < 0.5 && Math.abs(p.h - r.h) < 0.5;
      });
      if (!same) {
        this._rects = out; this._renderLayer();
        if (this._playing) this._setActiveStep(this._playIx - 1);
      }
      return skipped;
    }

    _render() {
      this._stale = false;
      this._staleReason = null;
      if (this._snapshot) {
        if (!this._selectEntry()) { this._stale = true; this._staleReason = 'filter-unsatisfiable'; }
        var s = this.getAttribute('data-state');
        if (s !== 'loading' && s !== 'empty') {
          if (this._stale) this.setAttribute('data-state', 'stale');
          else if (s === 'stale') this.removeAttribute('data-state');
        }
      }
      // The template is always visible; 'funnel' just toggles a right panel.
      // mode='off' is the tweak-off passthrough — no shelf, no panel,
      // regardless of the funnel attr.
      var mode = this.getAttribute('mode') || 'heat';
      var fv = mode === 'off' ? 'off' : this.getAttribute('funnel') || 'off';
      if (fv !== 'off') this.setAttribute('data-funnel-view', 'panel'); else this.removeAttribute('data-funnel-view');
      this._renderSentence();
      if (mode === 'off') {
        this._shelf.innerHTML = ''; this._rail.innerHTML = '';
        this._renderLayer();  // blanks for mode=off
      } else {
        this._renderShelf();
        this._renderFunnel();  // fills the rail (and calls _renderLayer)
      }
      var spec = MODES[mode] || MODES.heat;
      var lh = mode !== 'off' && spec.legendHTML ? spec.legendHTML() : '';
      this._legend.innerHTML = lh;
      // Gap row (below the legend): count + "File gaps report" action.
      // Only for modes whose legend explains the ⚪ glyph, and only when the
      // active entry actually carries uninstrumented elements.
      var nGaps = ((this._raw && this._raw.elements) || [])
        .filter(function (e) { return e.inst === false; }).length;
      this._gaps.innerHTML = nGaps && lh.indexOf('mxo-tag gap') >= 0
        ? '<span class="mxo-tag gap mxo-lkey">⚪</span><span><b>' + nGaps +
          ' element' + (nGaps === 1 ? '' : 's') + '</b> missing telemetry</span>' +
          '<button type="button" class="mxo-gapbtn" data-ask="gaps"' +
          (this._gapsBusy ? ' data-busy>Filing…' : '>File gaps report') +
          '</button>'
        : '';
    }

    _renderSentence() {
      var controls = this.getAttribute('controls') || 'sentence';
      var mode = this.getAttribute('mode') || 'heat';
      // mode='off' is the tweak-off passthrough — hide the sentence too,
      // regardless of controls, so a template that maps \`mode\` but forgets
      // \`controls\` doesn't show "Showing heat-map…" over an empty stage.
      if (controls === 'none' || mode === 'off') { this._sent.style.display = 'none'; this._sub.style.display = 'none'; return; }
      this._sent.style.display = ''; this._sub.style.display = '';
      var A = this._adapter;
      var win = this._win();
      var lens = this.getAttribute('lens') || '';
      var state = this.getAttribute('data-state');

      var modeSpec = MODES[mode] || MODES.heat;
      var lenses = this._lenses();
      var curLens = lenses.filter(function (l) { return l.key === lens; })[0] || lenses[0];

      var tok = function (label, k, opts, val) {
        var o = '';
        for (var i = 0; i < opts.length; i++) {
          o += '<option value="' + esc(opts[i].key) + '"' + (String(opts[i].key) === String(val) ? ' selected' : '') + '>' + esc(opts[i].label) + '</option>';
        }
        return '<span class="mxo-tok">' + esc(label) + '<span class="mxo-tcar">▾</span>' +
          '<select class="mxo-isel" data-k="' + k + '">' + o + '</select></span>';
      };
      var modeOpts = Object.keys(MODES).map(function (k) { return { key: k, label: MODES[k].label }; });

      // Range token: collapses window + as-of into one control. Presets
      // re-slice the loaded snapshot client-side; a custom from/to needs
      // an exact-match entry, otherwise it's a refetch. The popover's
      // datetime inputs are visible so they open natively cross-origin
      // (showPicker() is same-origin-only).
      var from = this.getAttribute('from') || '', to = this.getAttribute('to') || '';
      var curWin = WINDOWS.filter(function (w) { return String(w.key) === String(win); })[0];
      var rangeLabel = win === 'range'
        ? 'from ' + fmtDay(from) + ' to ' + fmtDay(to)
        : (curWin || WINDOWS[2]).sent;
      var asOf = A ? A.asOf : '';
      var presets = WINDOWS.map(function (w) {
        return '<button type="button" class="mxo-preset" data-win="' + esc(w.key) + '"' +
          (String(w.key) === String(win) ? ' data-on' : '') + '>' + esc(w.label) + '</button>';
      }).join('');
      var rangeTok = '<span class="mxo-tok" data-k="range">' + esc(rangeLabel) + '<span class="mxo-tcar">▾</span>' +
        '<div class="mxo-rpop">' +
        '<div class="mxo-presets">' + presets + '</div>' +
        '<div class="mxo-custom"><label>From</label>' +
        '<input type="datetime-local" class="mxo-idate" data-k="from" value="' + esc(asDT(from, '00:00')) + '" max="' + esc(asDT(to || asOf)) + '">' +
        '<label>to</label>' +
        '<input type="datetime-local" class="mxo-idate" data-k="to" value="' + esc(asDT(to || asOf)) + '" max="' + esc(asDT(asOf)) + '">' +
        '<button type="button" class="mxo-apply"' + (from ? '' : ' disabled') + '>Apply</button>' +
        '</div></div></span>';

      var ask = (this._stale || state === 'loading' || state === 'empty')
        ? askBtn('refetch', state === 'loading', false)
        : '';

      this._sent.innerHTML = 'Showing ' + tok(modeSpec.label.toLowerCase(), 'mode', modeOpts, mode) +
        ' for ' + tok(curLens.label.toLowerCase(), 'lens', lenses, lens) +
        ' ' + rangeTok + '.' + ask;
      if (this._rpopOpen) { var p = this._sent.querySelector('.mxo-rpop'); if (p) p.setAttribute('data-open', ''); }
      var s = A ? A.subline({ win: win, lens: lens, from: from, to: to }) : '';
      this._sub.textContent = (s ? s + ' — ' : '') + (modeSpec.explain || '');
    }

    _renderLayer() {
      var mode = this.getAttribute('mode') || 'heat';
      var A = this._adapter;
      var state = this.getAttribute('data-state');
      var rects = this._rects;

      // mode="off" is not a registered mode — it's the tweak-off passthrough
      // attr value (see the [mode=off][controls=none] CSS above).
      if (mode === 'off') { this._layer.innerHTML = ''; return; }
      var spec = MODES[mode] || MODES.heat;
      if (state === 'empty') {
        var h = '';
        for (var i = 0; i < rects.length; i++) {
          var r = rects[i];
          h += '<span class="mxo-empty" style="left:' + r.x + 'px;top:' + r.y + 'px;width:' + r.w + 'px;height:' + r.h + 'px"></span>';
        }
        h += '<div class="mxo-cta">No snapshot at <code>' + esc(this.getAttribute('src') || '') + '</code><br>Click <b>Get latest numbers</b> to have the agent query the analytics source.</div>';
        this._layer.innerHTML = h;
        return;
      }
      if (!A) { this._layer.innerHTML = ''; return; }

      // Unsatisfied custom range → paint last-week glyphs under the stale
      // hatch as "last-known numbers". Satisfied → span() slices days[] by
      // the requested dates and point() reads from that slice.
      var win = this._win();
      var q = { win: win === 'range' && this._stale ? 7 : win, lens: this.getAttribute('lens') || '',
        from: this.getAttribute('from') || '', to: this.getAttribute('to') || '' };
      var allPoints = rects.map(function (r) { return A.point(r.id, q, r.domScope); });
      var laid = rects.map(function (r) { return Object.assign({}, r); });
      layoutTags(laid);

      var html = '';
      for (var j = 0; j < laid.length; j++) {
        var r = laid[j];
        // Occluded rects stay in allRects/allPoints (space-mode denominators)
        // but don't paint — their glyph would sit on top of the occluder.
        if (r.occluded) continue;
        var meta = A.meta(r.id, r.domScope); if (!meta) continue;
        var pt = allPoints[j];
        var g = spec.glyph({ id: r.id, rect: r, meta: meta, point: pt, adapter: A, q: q, allRects: rects, allPoints: allPoints });
        if (!g) continue;
        var tip = r.id + ' — ' + meta.label + ' [' + meta.scope + ']' +
          (meta.ev ? '\\nevent: ' + meta.ev : meta.suggest ? '\\nsuggest: ' + meta.suggest : '\\nuninstrumented') +
          (meta.note ? '\\n' + meta.note : '');
        var t = r.tag;
        var leadH = t.below ? t.ty - (r.y + r.h) : r.y - (t.ty + 14);
        html += '<span class="mxo-g" data-ix="' + j + '">';
        if (g.washHTML) html += '<div class="mxo-box" style="left:' + r.x + 'px;top:' + r.y + 'px;width:' + r.w + 'px;height:' + r.h + 'px">' + g.washHTML + '</div>';
        if (leadH > 2) html += '<span class="mxo-lead" style="left:' + t.cx + 'px;top:' + (t.below ? r.y + r.h : t.ty + 14) + 'px;height:' + leadH + 'px"></span>';
        if (g.tag) html += '<span class="' + g.tag.cls + '" style="left:' + t.cx + 'px;top:' + t.ty + 'px;transform:translateX(-50%);' + (g.tag.style || '') + '" title="' + esc(tip) + '">' + g.tag.html + '</span>';
        html += '</span>';
      }
      // Step markers for the open flow — small white pills tucked top-left
      // of each element. Display-only; Play is how you walk the flow.
      var cf2 = this._curFunnel();
      var fsteps = cf2 ? cf2.def.steps : [];
      if (fsteps.length) {
        var byId = {};
        for (var s = 0; s < rects.length; s++) byId[rects[s].id] = rects[s];
        for (var d = 0; d < fsteps.length; d++) {
          var rr = byId[fsteps[d].id]; if (!rr || rr.occluded) continue;
          html += '<span class="mxo-smark" data-ix="' + d + '" style="left:' + (rr.x - 6) + 'px;top:' + (rr.y - 6) + 'px">' + (d + 1) + '</span>';
        }
      }
      this._layer.innerHTML = html;
      // innerHTML rebuild dropped any [data-hot]; next mousemove re-applies.
      this._isoIx = -1; this._layer.removeAttribute('data-iso');
    }

    _isolate(e) {
      if ((this.getAttribute('mode') || 'heat') === 'off') return;
      var rects = this._rects, hit = -1;
      if (e) {
        // Hovering a tag/badge (pointer-events:auto inside the shadow root)
        // — read the wrapper's index so the pill itself stays isolated.
        var g = e.target.closest && e.target.closest('.mxo-g');
        if (g && this._layer.contains(g)) hit = parseInt(g.getAttribute('data-ix'), 10);
        else {
          var sb = this._stage.getBoundingClientRect();
          var mx = e.clientX - sb.left, my = e.clientY - sb.top, hitA = Infinity;
          for (var i = 0; i < rects.length; i++) {
            var r = rects[i]; if (r.occluded) continue;
            if (mx >= r.x && mx < r.x + r.w && my >= r.y && my < r.y + r.h) {
              var a = r.w * r.h; if (a < hitA) { hit = i; hitA = a; }
            }
          }
        }
      }
      if (hit === this._isoIx) return;
      this._isoIx = hit;
      var gs = this._layer.querySelectorAll('.mxo-g'), hot = null;
      for (var j = 0; j < gs.length; j++) {
        if (parseInt(gs[j].getAttribute('data-ix'), 10) === hit) { gs[j].setAttribute('data-hot', ''); hot = gs[j]; }
        else gs[j].removeAttribute('data-hot');
      }
      // Some rects have no glyph (e.g. space-mode nulls) — don't enter iso
      // mode for those or every tag would fade with nothing highlighted.
      if (hot) this._layer.setAttribute('data-iso', '');
      else this._layer.removeAttribute('data-iso');
    }

    // ─── funnels ───────────────────────────────────────────────────────

    _funnelSrc() {
      // Defaults so a template with no attr still gets the shelf + can save
      // its first flow (the host creates the file on first ＋Add).
      return this.getAttribute('funnel-src') || this.getAttribute('funnelsrc') || './funnels.json';
    }

    _loadFunnels() {
      if (!this.isConnected) return;
      var gen = this._fLoadGen = (this._fLoadGen || 0) + 1;
      var src = this._funnelSrc();
      var abs; try { abs = new URL(src, document.baseURI).href; } catch (e) { abs = src; }
      var self = this;
      fetch(abs, { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (raw) {
          if (gen !== self._fLoadGen) return;
          var arr = raw == null ? [] : Array.isArray(raw) ? raw : [raw];
          // Fill def.hash for any entry the author didn't pre-hash.
          for (var i = 0; i < arr.length; i++) if (arr[i] && arr[i].def) arr[i].def.hash = arr[i].def.hash || defHash(arr[i].def);
          self._funnels = arr;
          // If compute renamed the open flow (auto-title on an untitled
          // flow), snap the panel to the renamed entry by def.hash so it
          // doesn't fall back to "No user flow named '<old>'".
          var fv = self.getAttribute('funnel');
          if (fv && fv !== 'off' && self._fBusyHash && !self._curFunnel()) {
            var ix = self._fBusyIx, at = arr[ix], hit = null;
            if (at && at.def && at.def.hash === self._fBusyHash) hit = at;
            else for (var k = 0; k < arr.length; k++) {
              if (arr[k] && arr[k].def && arr[k].def.hash === self._fBusyHash) { hit = arr[k]; break; }
            }
            // setAttribute's callback clears _fBusyHash/_fBusyIx; clear here
            // too so a miss doesn't leave them stale past the reload that
            // should have consumed them.
            if (hit) self.setAttribute('funnel', hit.name);
            self._fBusyHash = null; self._fBusyIx = null;
          }
          // Only the busy spinner is cleared unconditionally — an unrelated
          // reload (refetch, gaps) that lands while a compute is still
          // running leaves the hash/ix for the compute's own reload.
          self._fBusy = null; clearTimeout(self._fBusyT);
          self._render();
        })
        .catch(function () { if (gen !== self._fLoadGen) return; self._funnels = []; self._render(); });
    }

    _dedupeName(nm, skip) {
      var fs = this._funnels || [], out = nm, n = 2;
      while (fs.some(function (f) { return f !== skip && f.name === out; })) out = nm + ' ' + n++;
      return out;
    }

    // ＋Add → append a fresh empty entry, open it in record mode, and post
    // 'save' so the host stubs it into funnels.json.
    _addFlow() {
      if (!this._funnels) this._funnels = [];
      // Reuse an existing empty flow instead of stacking "Untitled flow N"s —
      // open it in record mode, same as a fresh add would.
      for (var i = 0; i < this._funnels.length; i++) {
        var ex = this._funnels[i];
        if (ex && ex.def && (!ex.def.steps || !ex.def.steps.length)) {
          this.setAttribute('funnel', ex.name);
          this._setRecording(true);
          return;
        }
      }
      var A = this._adapter;
      var def = { steps: [], window: '28d', splitBy: '',
        asOf: (A && A.asOf) || new Date().toISOString().slice(0, 10), hash: '' };
      def.hash = defHash(def);
      var f = { name: this._dedupeName('Untitled flow'), def: def, result: null };
      this._funnels.push(f);
      this.setAttribute('funnel', f.name);
      this._setRecording(true);  // after the attr change (which defaults it off)
      this.postFunnel('save', f.name, f.def);
    }

    // Optimistic def edit: re-hash (unless rehash===false), re-render, and
    // post a debounced 'save' so rapid step-clicking lands as one file write.
    _commitDef(f, rehash) {
      this._stopPlay();
      if (rehash !== false) f.def.hash = defHash(f.def);
      this._renderShelf(); this._renderFunnel();
      var self = this;
      clearTimeout(this._saveT);
      this._saveF = f;
      this._saveT = setTimeout(function () { self._flushSave(); }, 500);
    }

    _flushSave() {
      clearTimeout(this._saveT);
      var f = this._saveF; this._saveF = null;
      if (f && this._funnels && this._funnels.indexOf(f) >= 0) {
        this.postFunnel('save', f.name, f.def);
      }
    }

    _curFunnel() {
      var fv = this.getAttribute('funnel') || 'off';
      if (fv === 'off' || !this._funnels) return null;
      for (var i = 0; i < this._funnels.length; i++) if (this._funnels[i].name === fv) return this._funnels[i];
      return null;
    }

    _mockResult(name, def) {
      var self = this, arr = (this._funnels || []).slice();
      var base = null, steps = def.steps || [];
      var rows = [], gaps = [];
      for (var i = 0; i < steps.length; i++) {
        var s = steps[i];
        if (s.inst === false || !s.ev) { gaps.push(s.id); continue; }
        var n = base == null ? 1000 : Math.round(base * (0.55 + Math.random() * 0.3));
        if (base == null) base = n; else n = Math.min(n, base);
        base = n;
        rows.push({ step: i, users: n });
      }
      var result = { defHash: def.hash, asOf: def.asOf, ranAt: new Date().toISOString(), rows: rows, gaps: gaps,
        commentary: 'Mock read — in a hosted session this is a 2–3 sentence design note about what the drop-off pattern suggests and what to try next.' };
      var ix = -1;
      for (var j = 0; j < arr.length; j++) if (arr[j].name === name) { ix = j; break; }
      if (ix >= 0) arr[ix] = Object.assign({}, arr[ix], { result: result });
      else arr.push({ name: name, def: def, result: result });
      this._funnels = arr;
      this._fBusy = null; this._fBusyHash = null; this._fBusyIx = null; clearTimeout(this._fBusyT);
      this._render();
    }

    _setActiveStep(ix) {
      var set = function (els) {
        for (var i = 0; i < els.length; i++) {
          if (els[i].getAttribute('data-ix') === String(ix)) els[i].setAttribute('data-active', '');
          else els[i].removeAttribute('data-active');
        }
      };
      set(this._rail.querySelectorAll('.mxo-frow'));
      set(this._layer.querySelectorAll('.mxo-smark'));
    }

    _rectInStage(t) {
      var sb = this._stage.getBoundingClientRect(), r = t.getBoundingClientRect();
      return { x: r.left - sb.left, y: r.top - sb.top, w: r.width, h: r.height,
        cx: r.left - sb.left + r.width / 2, cy: r.top - sb.top + r.height / 2 };
    }

    _flash(id) {
      // Bare 'CSS' in this IIFE is the stylesheet string above; call the
      // global explicitly (with a no-op fallback for very old UAs).
      var cssEsc = window.CSS && window.CSS.escape ? window.CSS.escape : function (s) { return s; };
      var t = id ? this.querySelector('[data-metric-id="' + cssEsc(id) + '"]') : null;
      if (!t) return;
      try { t.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
      var b = this._rectInStage(t);
      var ping = document.createElement('span');
      ping.className = 'mxo-ping';
      ping.setAttribute('style', 'left:' + (b.x - 3) + 'px;top:' + (b.y - 3) + 'px;width:' + (b.w + 2) + 'px;height:' + (b.h + 2) + 'px');
      this._stage.appendChild(ping);
      // Shorter than the Play step interval so two rings never overlap.
      setTimeout(function () { ping.remove(); }, 1200);
    }

    // ▶ Play — highlight phase. Glide the persistent cursor dot to the
    // target's center; returns its box so the press phase can ring it.
    // Recording keeps plain \`_flash\` — this is Play-only.
    _highlightForPlay(t, id) {
      try { t.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
      var b = this._rectInStage(t);
      var c = this._cursorEl;
      if (!c || !c.isConnected) {
        c = document.createElement('span'); c.className = 'mxo-cursor';
        c.style.left = b.cx + 'px'; c.style.top = b.cy + 'px';
        this._stage.appendChild(c); this._cursorEl = c;
        // force layout so the first hop doesn't transition from 0,0
        c.getBoundingClientRect();
      }
      c.style.transform = 'scale(1)';
      c.style.left = b.cx + 'px'; c.style.top = b.cy + 'px';
      return { el: c, box: b };
    }

    // ▶ Play — press phase. Dip the cursor, ring the target, then call
    // \`then()\` on "mouse-up" so the synthetic .click() fires *after* the
    // press has visibly committed. The wait is stored on _clickT so
    // pause/stop cancels it.
    _pressForPlay(t, h, then) {
      var self = this;
      var fire = function (ms) { self._clickT = setTimeout(then || function () {}, ms); };
      if (!h) { fire(0); return; }
      var b = h.box;
      h.el.style.transform = 'scale(.65)';
      setTimeout(function () { if (h.el) h.el.style.transform = 'scale(1)'; }, 140);
      // pulse ring under the dot so the target reads as 'hit'
      var p = document.createElement('span'); p.className = 'mxo-ping';
      p.setAttribute('style', 'left:' + (b.x - 3) + 'px;top:' + (b.y - 3) + 'px;width:' + (b.w + 2) + 'px;height:' + (b.h + 2) + 'px');
      this._stage.appendChild(p); setTimeout(function () { p.remove(); }, 700);
      // click on "mouse-up" — after the dip bottoms out and starts back
      fire(160);
    }

    // Scroll+flash a step's element; optionally click it (▶ Play). If it's
    // not visible (off-screen route), emit metrics:navigate so the host can
    // route there, then retry once. On a miss, pulse the panel row.
    // \`onSettled\` fires once the step has resolved — after the click lands,
    // or after a miss is determined — so callers can chain the next step
    // from the *click* moment rather than the *highlight* moment.
    _locate(id, screen, rowEl, doClick, onSettled) {
      var self = this;
      var done = onSettled || function () {};
      var cssEsc = window.CSS && window.CSS.escape ? window.CSS.escape : function (s) { return s; };
      var find = function () {
        var t = id ? self.querySelector('[data-metric-id="' + cssEsc(id) + '"]') : null;
        // offsetParent is null for position:fixed too — use layout boxes.
        return t && t.isConnected && t.getClientRects().length ? t : null;
      };
      var hit = function (t) {
        if (!doClick) { self._flash(id); done(); return; }
        // ▶ Play: cursor glides to target, holds, dips, then click.
        var h = self._highlightForPlay(t, id);
        clearTimeout(self._clickT);
        self._clickT = setTimeout(function () {
          self._pressForPlay(t, h, function () {
            try { t.click(); } catch (e) {}
            done();
          });
        }, 500);
      };
      var t0 = find();
      if (t0) { hit(t0); return; }
      this.dispatchEvent(new CustomEvent('metrics:navigate',
        { detail: { screen: screen, id: id }, bubbles: true, composed: true }));
      clearTimeout(this._locateT);
      this._locateT = setTimeout(function () {
        var t1 = find();
        if (t1) { hit(t1); return; }
        if (rowEl) {
          rowEl.style.animation = 'mxo-pulse .6s ease-out';
          setTimeout(function () { rowEl.style.animation = ''; }, 600);
        }
        done();
      }, 250);
    }

    _play(f, fromIx) {
      var self = this, steps = f.def.steps;
      if (!steps.length) return;
      clearTimeout(this._playT); clearTimeout(this._locateT); clearTimeout(this._clickT);
      this._playFlow = f; this._playing = 'playing';
      this._playIx = fromIx != null ? fromIx : 0;
      this._setRecording(false);
      var tick = function () {
        if (self._playing !== 'playing' || self._playFlow !== f) return;
        var s = steps[self._playIx];
        if (!s) { self._stopPlay(); return; }
        self._setActiveStep(self._playIx);
        var row = self._rail.querySelector('.mxo-frow[data-ix="' + self._playIx + '"]');
        // Advance + schedule from the moment the step *settles* (click lands
        // or miss confirmed) so on-screen and off-screen steps both get the
        // same ~900ms to show their result before the next ring appears.
        self._locate(s.id, s.screen || '', row, true, function () {
          if (self._playing !== 'playing' || self._playFlow !== f) return;
          self._playIx++;
          self._renderPlay();
          self._playT = setTimeout(tick, 900);
        });
      };
      tick();
    }

    _pause() {
      if (this._playing !== 'playing') return;
      this._playing = 'paused';
      clearTimeout(this._playT); clearTimeout(this._locateT); clearTimeout(this._clickT);
      this._renderPlay();
    }

    _setRecording(on) {
      this._recording = !!on;
      if (on) this.setAttribute('data-recording', ''); else this.removeAttribute('data-recording');
      this._renderFunnel();
    }

    _stopPlay() {
      if (!this._playing) return;
      this._playing = null; this._playFlow = null; this._playIx = 0;
      clearTimeout(this._playT); clearTimeout(this._locateT); clearTimeout(this._clickT);
      if (this._cursorEl) { this._cursorEl.remove(); this._cursorEl = null; }
      this._setActiveStep(-1);
      this._renderFunnel();
    }

    // Re-render just the play controls (cheap; avoids wiping contenteditables).
    _renderPlay() {
      var f = this._curFunnel(); if (!f) return;
      var on = this._playing && this._playFlow === f;
      var h = '<button type="button" class="mxo-play"' + (on && this._playing === 'playing' ? ' data-on' : '') +
        (f.def.steps.length ? '' : ' disabled') + ' title="' +
        (on && this._playing === 'playing' ? 'Pause' : 'Play through the flow') + '">' +
        (on && this._playing === 'playing' ? pauseIcon : playIcon) + '</button>' +
        (on ? '<button type="button" class="mxo-restart" title="Restart">' + restartIcon + '</button>' +
          '<span class="mxo-pn">' + Math.min(this._playIx, f.def.steps.length) + '/' + f.def.steps.length + '</span>' : '');
      var slot = this._rail.querySelector('.mxo-pctl');
      if (slot) slot.innerHTML = h;
    }

    _renderShelf() {
      var fv = this.getAttribute('funnel') || 'off';
      var fs = this._funnels || [], h = '';
      for (var i = 0; i < fs.length; i++) {
        var f = fs[i];
        h += '<button type="button" class="mxo-pill" data-funnel="' + esc(f.name) + '"' + (fv === f.name ? ' data-on' : '') + '>' +
          miniSpark(f.result && f.result.rows) + esc(f.name) + '</button>';
      }
      h += '<button type="button" class="mxo-pill mxo-add">＋ Add user flow</button>';
      this._shelf.innerHTML = h;
    }

    _stepRows(steps, result) {
      // Walks steps in def order; result.rows may omit gap steps, so a
      // separate cursor tracks it. When there's no result yet the data
      // block (bar · drop% · count) is omitted.
      var A = this._adapter, rows = result && result.rows || null;
      var ri = 0, first = null, prev = null, prevTot = null, h = '';
      for (var i = 0; i < steps.length; i++) {
        var s = steps[i], m = A ? A.meta(s.id) : null;
        var hasEv = s.ev || (m && m.ev);
        var gap = s.inst === false || !hasEv || (result && result.gaps && result.gaps.indexOf(s.id) >= 0);
        var n = null, tot = null;
        if (!gap && rows) { var row = rows[ri]; if (row && (row.step === i || row.step == null)) { n = row.users; tot = row.total || null; ri++; } }
        if (first == null && n != null) first = n || 1;
        var pct = n != null && first ? Math.min(1, n / first) : 0;
        var drop = (prev != null && n != null && prev)
          ? '−' + Math.max(0, Math.round(100 * (1 - n / prev))) + '%' : '';
        // First-occurrence artifact signature: this step’s event reached
        // more users in-window than the previous step’s (tot > prevTot),
        // yet <20% carried through the funnel. Gated on !seq so a correctly-
        // computed strict-sequential result with this (legitimate) shape
        // isn’t nagged forever.
        var warn = (!(result && result.seq) && tot && prevTot && tot > prevTot && prev && n != null && (n / prev) < 0.2)
          ? 'This event reached more users in-window (' + fmtN(tot) + ') than the previous step (' + fmtN(prevTot) + '), but only ' + Math.round(100 * n / prev) + '% carried through — likely the first-occurrence compute artifact. Re-run “Get latest numbers”.'
          : '';
        if (n != null) { prev = n; prevTot = tot; }
        var ev = gap ? '○ suggest: ' + esc((m && m.suggest) || s.ev || '—')
          : esc(s.ev || (m && m.ev) || '—');
        h += '<div class="mxo-frow" data-ix="' + i + '">' +
          '<span class="mxo-fn">' + (i + 1) + '</span>' +
          '<div class="mxo-fhd">' +
          '<span class="mxo-flbl" contenteditable spellcheck="false" data-ix="' + i + '">' + esc(s.label || s.id) + '</span>' +
          '<button type="button" class="mxo-fx" data-ix="' + i + '" title="Remove">×</button></div>' +
          '<div class="mxo-fev' + (gap ? ' gap' : '') + '">' + ev + '</div>' +
          (rows ? '<div class="mxo-fdata"><div class="mxo-fbar' + (gap ? ' gap' : '') + '"><span style="width:' + (pct * 100).toFixed(1) + '%"></span></div>' +
            '<span class="mxo-fdrop">' + (gap ? '' : drop) + '</span>' +
            '<span class="mxo-fnum">' + (gap ? '—' : fmtN(n)) + '</span></div>' : '') +
          (warn ? '<div class="mxo-fwarn" title="' + esc(warn) + '">⚠ suspicious drop — re-run compute</div>' : '') +
          '</div>';
      }
      return h;
    }

    _renderFunnel() {
      var fv = this.getAttribute('funnel') || 'off';
      if (fv === 'off') { this._rail.innerHTML = ''; this._renderLayer(); return; }
      var f = this._curFunnel();
      if (!f) { this._rail.innerHTML = '<div class="mxo-fempty">No user flow named "' + esc(fv) + '".</div>'; this._renderLayer(); return; }
      var A = this._adapter;
      var st = funnelState(f), busy = this._fBusy === f.name;
      var rec = this._recording;
      var empty = !f.def.steps.length;
      var rows = empty
        ? '<div class="mxo-fempty">' + (rec
            ? 'Click elements on the template to add steps.'
            : 'No steps yet — click <b>Record steps</b>, then click elements on the template.') + '</div>'
        : this._stepRows(f.def.steps, f.result);
      this._rail.innerHTML =
        '<div class="mxo-fhdr"><span class="mxo-pctl"></span>' +
        '<div class="mxo-ftitle" contenteditable spellcheck="false">' + esc(f.name) + '</div>' +
        '<button type="button" class="mxo-fdel" title="Delete user flow">' + trashIcon + '</button></div>' +
        '<button type="button" class="mxo-rec"' + (rec ? ' data-on' : '') + '>' +
        (rec ? 'Recording — click to stop' : 'Record steps') + '</button>' +
        rows +
        (f.result && f.result.commentary
          ? '<div class="mxo-fcom"><b>Claude’s read</b>' + esc(f.result.commentary) + '</div>'
          : '') +
        (empty ? '' : '<div class="mxo-facts">' +
          '<div class="mxo-ffoot">' +
          (st === 'stale' ? '<span class="mxo-chip stale">stale</span> ' : '') +
          (st ? esc(windowRange(f.result.asOf || f.def.asOf, f.def.window)) : 'No data yet') +
          '</div>' + askBtn('compute', busy, false) + '</div>');
      this._renderPlay();
      this._renderLayer();
      if (this._playing && this._playFlow === f) this._setActiveStep(this._playIx - 1);
    }
  }

  // statics
  MetricsOverlay.createAdapter = createAdapter;
  MetricsOverlay.registerMode = registerMode;
  MetricsOverlay.modes = function () { return Object.keys(MODES).map(function (k) { return { key: k, label: MODES[k].label, explain: MODES[k].explain }; }); };
  MetricsOverlay.util = { fmtN: fmtN, pctStr: pctStr, sliceSum: sliceSum };

  // ─── <metrics-funnel> — standalone read-only chart ───────────────────
  // Drop a computed funnel into a deck or doc without the overlay stage.
  // Reads the same funnels.json; renders title + bars + window·asOf caption.
  var FCSS =
    ':host{display:block;font-family:var(--font-ui,-apple-system,sans-serif);color:var(--text-primary,rgba(15,12,8,.92))}' +
    '.mf-title{font:500 18px/1.3 var(--font-display,ui-serif,Georgia,serif);margin:0 0 10px}' +
    '.mf-row{display:grid;grid-template-columns:minmax(100px,auto) 1fr 44px 44px;gap:12px;align-items:center;margin-bottom:6px;font:400 12px/1.3 var(--font-ui,-apple-system,sans-serif)}' +
    '.mf-bar{height:10px;border-radius:5px;background:rgba(15,12,8,.06);position:relative;overflow:hidden}' +
    '.mf-bar>span{position:absolute;inset:0 auto 0 0;border-radius:5px;background:var(--accent-primary,#D97757)}' +
    '.mf-drop{text-align:right;font-variant-numeric:tabular-nums;font-weight:650}' +
    '.mf-n{text-align:right;font-variant-numeric:tabular-nums;font-weight:500;color:var(--text-tertiary,rgba(15,12,8,.48))}' +
    '.mf-cap{font:400 11px/1 var(--font-ui,-apple-system,sans-serif);color:var(--text-tertiary,rgba(15,12,8,.48));margin-top:8px}';

  class MetricsFunnel extends HTMLElement {
    static get observedAttributes() { return ['src', 'name']; }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).innerHTML = '<style>' + FCSS + '</style><div class="mf-body"></div>';
      this._body = this.shadowRoot.querySelector('.mf-body');
    }
    connectedCallback() {
      var self = this;
      this._onMsg = function (e) { if (e.data && e.data.type === 'metrics:reload') self._load(); };
      window.addEventListener('message', this._onMsg);
      this._load();
    }
    disconnectedCallback() { window.removeEventListener('message', this._onMsg); }
    attributeChangedCallback() { if (this.isConnected) this._load(); }
    _load() {
      var src = this.getAttribute('src'), name = this.getAttribute('name'), self = this;
      if (!src) { this._body.textContent = ''; return; }
      var abs; try { abs = new URL(src, document.baseURI).href; } catch (e) { abs = src; }
      fetch(abs, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (raw) {
        var arr = raw == null ? [] : Array.isArray(raw) ? raw : [raw];
        var f = null; for (var i = 0; i < arr.length; i++) if (!name || arr[i].name === name) { f = arr[i]; break; }
        if (!f) { self._body.innerHTML = '<div class="mf-cap">No user flow named "' + esc(name || '') + '"</div>'; return; }
        if (!f.result || !f.result.rows) { self._body.innerHTML = '<h3 class="mf-title">' + esc(f.name) + '</h3><div class="mf-cap">Not computed yet.</div>'; return; }
        var rows = f.result.rows, max = 0; for (var j = 0; j < rows.length; j++) if (rows[j].users > max) max = rows[j].users;
        var steps = f.def && f.def.steps || [], h = '<h3 class="mf-title">' + esc(f.name) + '</h3>';
        var prev = null;
        for (var k = 0; k < steps.length; k++) {
          var s = steps[k], row = null;
          for (var r2 = 0; r2 < rows.length; r2++) if (rows[r2].step === k) { row = rows[r2]; break; }
          var n = row ? row.users : null, w = n != null && max ? (100 * n / max).toFixed(1) : 0;
          var drop = (prev != null && n != null && prev)
            ? '−' + Math.max(0, Math.round(100 * (1 - n / prev))) + '%' : '';
          if (n != null) prev = n;
          h += '<div class="mf-row"><span>' + (k + 1) + '. ' + esc(s.label || s.id) + '</span>' +
            '<span class="mf-bar"><span style="width:' + w + '%"></span></span>' +
            '<span class="mf-drop">' + drop + '</span>' +
            '<span class="mf-n">' + (n == null ? '—' : fmtN(n)) + '</span></div>';
        }
        h += '<div class="mf-cap">' + esc(windowRange(f.result.asOf || '', (f.def && f.def.window) || '28d')) + '</div>';
        self._body.innerHTML = h;
      }).catch(function () { self._body.innerHTML = '<div class="mf-cap">Failed to load ' + esc(src) + '</div>'; });
    }
  }

  if (!customElements.get('metrics-overlay')) {
    customElements.define('metrics-overlay', MetricsOverlay);
  }
  if (!customElements.get('metrics-funnel')) {
    customElements.define('metrics-funnel', MetricsFunnel);
  }
  // Expose for hosts that want to drive it without a src file.
  window.MetricsOverlay = MetricsOverlay;
})();
`,
    pn = `/* BEGIN USAGE */
/**
 * <insight-overlay> — lightweight data-storytelling overlay.
 *
 * Wraps any rendered UI, tracks the live rect of every descendant with
 * data-metric-id="…", and paints ONE named insight on top: a colour wash +
 * value tag on each of the insight's listed elements (interpolated into a
 * single per-insight spectrum), an optional pinned callout card on any of
 * them, and every OTHER data-metric-id element dimmed so the insight's
 * subjects stand out. A pill picker switches insights.
 *
 * The component owns no data. It loads a insights file the agent wrote
 * (src="./insights.js") and each insight carries exactly the values it
 * paints. The one irreplaceable piece is the positioning engine —
 * MutationObserver + ResizeObserver + occlusion-tracked rects keeping
 * every wash, tag and callout pinned as the wrapped UI reflows.
 *
 * Attributes:
 *   src       URL of the insights file. .js → <script src>; assigns
 *             window.__insights = [...]. .json → fetch()ed. Re-fetched on
 *             attribute change and on a 'insight:reload' event. The global
 *             is a shared mailbox — one overlay per page for now (two
 *             overlays with different .js src race each other's loads);
 *             drive a second instance via el.setInsights().
 *   insight     id of the active insight. Default: first insight.
 *   controls  'picker' | 'none'. Default 'picker'. 'none' = headless
 *             (the host owns switching via el.insight = id).
 *
 * DOM contract on wrapped children:
 *   data-metric-id="copy-link"  the element handle every insight targets.
 *
 * Insights file shape:
 *   window.__insights = [
 *     { id: 'creation',
 *       label: 'How you start decides whether you finish',
 *       asOf: '2026-06-24',
 *       spectrum: {
 *         colors: ['#F0EEE6','#D97757'],  // ramp endpoints; 3 = diverging
 *         domain: [min, max],             // defaults to this insight's value range
 *         steps?: N,                      // quantize to N discrete bins
 *         scale?: 'linear'|'quantile',    // quantile = rank-based spacing
 *         baseline?: v,                   // divergence midpoint (3 colors);
 *                                         // when set, baseline WINS: the
 *                                         // piecewise mapping bypasses
 *                                         // good:'low' and scale:'quantile'
 *         good?: 'high'|'low',            // flips the ramp
 *         fmt?: 'pct'|'n'|fn,
 *         // sugar: hue:'#X' ≡ colors:['#F6F4EF','#X']
 *         // Colour strings must be #rgb / #rrggbb / rgb() / rgba() —
 *         // hsl(), oklch() and named colours are NOT parsed; a ramp stop
 *         // in those formats silently falls back to the default ramp,
 *         // and an el.color override falls back to the ramp colour.
 *       },
 *       dim: 0.25,                         // default 0.25
 *       elements: [
 *         { id: 'composer-create', value: 0.37,
 *           callout: { pin: 1, head: 'Composer Create',
 *                      body: 'The only path that asks for a prompt.',
 *                      place?: 'above', dx?, dy? } },
 *         { id: 'tplcard-prototype', value: 0.28 },   // wash + tag only
 *         { id: 'special', value: 0.9, color: '#2A78D6' }, // per-element override
 *         { id: 'blank-project-link' },                // spotlight only
 *       ],
 *       legend: true,                      // auto from spectrum
 *     },
 *   ];
 *
 * Semantics:
 *   - Listed \`elements\` are the insight's subjects. Every OTHER tracked
 *     data-metric-id element dims to \`dim\` (default 0.25).
 *   - \`value\` → a colour wash interpolated into the insight's spectrum,
 *     plus a small value tag on the element (spectrum.fmt formats it —
 *     'pct' default, 'n', or a function). \`null\` paints a hatched
 *     "no data" square. Absent value = plain spotlight.
 *   - \`callout\` → a pinned annotation card + leader line. Cards are laid
 *     out DETERMINISTICALLY: same insights file + same viewport → same
 *     layout. Each card tries below / above / right / left of its anchor
 *     (preferring spots that don't cover another callout's element), then
 *     shifts down past whatever it still hits; everything clamps inside
 *     the stage and the leader redraws to wherever the card landed.
 *     Setting place/dx/dy makes a card FIXED at that author position —
 *     the sweep routes the other cards around it. Pins auto-number
 *     1, 2, 3… in elements-array order when \`pin\` isn't set.
 *   - The spectrum is ONE definition per insight. \`colors\` is a true
 *     RGB ramp (not an alpha fade) so every value gets a distinct tint;
 *     \`domain\` defaults to the observed min/max across THIS insight's
 *     values, which is what makes clustered values distinguishable — set
 *     it explicitly only when insights need a shared scale. \`steps\`
 *     quantizes into N bins; \`scale:'quantile'\` spaces by rank for
 *     tightly clustered values. A per-element \`color\` bypasses the ramp.
 *   - \`legend:true\` auto-derives a ramp swatch row from the spectrum.
 *
 * Imperative API:
 *   el.insights            — the loaded insight array (getter)
 *   el.setInsights(arr)    — drive without a src file
 *   el.insight / el.insight = id
 *   el.measure()          — re-measure rects now
 *
 * Usage — ALWAYS add this as a tweak, never as an always-on wrapper. With
 * controls='none' and no src the overlay is a true passthrough.
 *
 *   <script src="insight-overlay.js"><\/script>
 *   <insight-overlay src="./insights.js" insight="creation">
 *     …product UI with data-metric-id attrs…
 *   </insight-overlay>
 */
/* END USAGE */

(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;';
    });
  }
  function fmtN(n) {
    if (n == null) return '–'; n = Number(n);
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'k';
    return String(Math.round(n));
  }
  function fmtPct(v) { return v == null ? '–' : (v * 100).toFixed(Math.abs(v) < 0.10 ? 1 : 0) + '%'; }
  function fmtOf(spec) {
    var f = spec && spec.fmt;
    if (typeof f === 'function') return f;
    if (f === 'n') return fmtN;
    return fmtPct;
  }
  function fmtDay(iso) {
    if (!iso) return '';
    var d = new Date(String(iso).indexOf('T') < 0 ? iso + 'T00:00:00' : iso);
    // Unparseable input renders as nothing rather than echoing the raw
    // string into the picker row (asOf is insight data, not trusted markup).
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  // Parse #rgb/#rrggbb/rgb()/rgba() → [r,g,b]. Returns null for unknown.
  function parseColor(c) {
    if (!c) return null;
    c = String(c).trim();
    var m = /^#([0-9a-f]{3})$/i.exec(c);
    if (m) return [0, 1, 2].map(function (i) { return parseInt(m[1][i] + m[1][i], 16); });
    m = /^#([0-9a-f]{6})$/i.exec(c);
    if (m) return [0, 2, 4].map(function (i) { return parseInt(m[1].slice(i, i + 2), 16); });
    m = /^rgba?\\(([^)]+)\\)$/i.exec(c);
    if (m) return m[1].split(',').slice(0, 3).map(function (n) { return Math.round(parseFloat(n)); });
    return null;
  }
  function rgbStr(c) { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }
  function lerpColor(a, b, t) {
    return [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); });
  }
  // Normalise an author colour string to a safe rgb() literal (colour
  // strings are the one unescaped sink into style attributes). Unparseable
  // → null so callers fall back to the ramp.
  function safeColor(c) { var p = parseColor(c); return p ? rgbStr(p) : null; }
  function accentOf(sp) { return sp && sp.hue ? safeColor(sp.hue) : null; }
  // Build a value→colour function from a spectrum spec. Supports:
  //   colors: ['#F0EEE6','#D97757']  — true RGB interpolation; 3 colors =
  //     diverging around baseline. hue:'#X' is sugar for colors:[paper,X].
  //   domain:[min,max] (default = observed range across this insight)
  //   steps:N quantizes t into N discrete bins (so clustered values
  //     render visibly distinct tints)
  //   scale:'quantile' maps each value to its rank position instead of
  //     its linear position — separates tightly-clustered values.
  //   baseline:v — with 3 colors, the divergence midpoint
  //   good:'low' flips the ramp (lower value = colors[1] end)
  function buildRamp(spec, values) {
    spec = spec || {};
    // Normalise shape first — a bare string or an empty array would throw
    // below, and buildRamp runs on every measure tick.
    var raw = Array.isArray(spec.colors) && spec.colors.length ? spec.colors
      : (spec.hue ? ['#F6F4EF', spec.hue] : ['#F6F4EF', '#558A42']);
    if (raw.length === 1) raw = ['#F6F4EF', raw[0]];
    var cols = raw.map(parseColor);
    // Fall back to a safe paper→green ramp if any stop is unparseable, so
    // a typo in one colour string can't blank the whole insight.
    if (cols.some(function (c) { return !c; })) cols = [parseColor('#F6F4EF'), parseColor('#558A42')];
    var dom = spec.domain, lo, hi;
    if (dom && dom.length >= 2) { lo = dom[0]; hi = dom[1]; }
    else {
      lo = Infinity; hi = -Infinity;
      for (var i = 0; i < values.length; i++) { var v = values[i]; if (v == null) continue; if (v < lo) lo = v; if (v > hi) hi = v; }
      if (lo === Infinity) { lo = 0; hi = 1; }
    }
    var flat = lo === hi;
    if (flat) hi = lo + 1;
    // quantile scale — sort the values and map v to its rank position.
    // quantile scale — rank among DISTINCT values, so ties (including a
    // tied maximum) land on the same t and the ramp's ends stay reachable.
    var sorted = null;
    if (spec.scale === 'quantile') {
      var seen = {};
      sorted = values.filter(function (v) {
        if (v == null || seen[v]) return false; seen[v] = 1; return true;
      }).sort(function (a, b) { return a - b; });
    }
    var toT = function (v) {
      var t;
      if (flat) t = 0.5;  // one distinct value — mid-ramp, not palest tint
      else if (sorted && sorted.length > 1) {
        var r = 0; while (r < sorted.length && sorted[r] < v) r++;
        t = r / (sorted.length - 1);
      } else {
        t = (v - lo) / (hi - lo);
      }
      t = Math.max(0, Math.min(1, t));
      if (spec.good === 'low') t = 1 - t;
      if (spec.steps > 1) t = Math.round(t * (spec.steps - 1)) / (spec.steps - 1);
      return t;
    };
    var at = function (t) {
      if (cols.length >= 3) {
        // diverging around baseline → left half cols[1]→cols[0], right
        // half cols[1]→cols[2]. baseline maps to t=0.5 when inside [lo,hi].
        return t < 0.5 ? lerpColor(cols[1], cols[0], 1 - t * 2) : lerpColor(cols[1], cols[2], (t - 0.5) * 2);
      }
      return lerpColor(cols[0], cols[cols.length - 1], t);
    };
    // baseline shifts the midpoint so v=baseline lands at t=0.5 in the
    // diverging case. Done by piecewise re-scaling either side.
    var base = spec.baseline;
    // flat ranges short-circuit to mid-ramp in toT; the baseline path must
    // not activate against the synthetic +1 bound (flat) either.
    var toTb = (cols.length >= 3 && base != null && !flat && base > lo && base < hi)
      ? function (v) {
        var raw = v <= base ? 0.5 * (v - lo) / (base - lo) : 0.5 + 0.5 * (v - base) / (hi - base);
        raw = Math.max(0, Math.min(1, raw));
        if (spec.steps > 1) raw = Math.round(raw * (spec.steps - 1)) / (spec.steps - 1);
        return raw;
      }
      : toT;
    var baselineActive = toTb !== toT;
    return {
      lo: lo, hi: hi, cols: cols,
      flat: flat,
      // whether low values actually map to the saturated end — the legend
      // reverses its swatch row on this, not on spec.good alone (a
      // diverging baseline bypasses the good flip: "baseline wins").
      flipped: spec.good === 'low' && !baselineActive,
      color: function (v) { return rgbStr(at(toTb(v))); },
      swatch: function (t) { return rgbStr(at(t)); },
    };
  }

  // Stack colliding tags into vertical lanes so neighbouring elements'
  // value labels don't overlap. Each rect gets a .tag {cx, ty}.
  function layoutTags(rects) {
    var W = 44, H = 14, GAP = 4, LANE = H + GAP;
    var sorted = rects.slice().sort(function (a, b) { return (a.y - b.y) || (a.x - b.x); });
    var placed = [];
    sorted.forEach(function (r) {
      var cx = r.x + r.w / 2, below = r.y < 60, lane = 0;
      while (lane < 8) {
        var ty = below ? r.y + r.h + GAP + lane * LANE : r.y - H - GAP - lane * LANE;
        var hit = placed.some(function (p) { return Math.abs(p.cx - cx) < W && Math.abs(p.ty - ty) < H; });
        if (!hit || lane === 7) { r.tag = { cx: cx, ty: ty }; placed.push({ cx: cx, ty: ty }); break; }
        lane++;
      }
    });
  }

  // Deterministic collision layout for callout cards. Pure: same inputs →
  // same output, every render. items: [{id, ax, ay, aw, ah, cw, ch, gap,
  // dx, dy, place, fixed, order}] (a* = anchor rect, c* = card size,
  // order = elements-array index). Returns {id: {x, y}}.
  //
  // Fixed cards (author set place/dx/dy) are placed first at their explicit
  // spot and never move; the rest are swept in (anchor.top, anchor.left,
  // order) order, each taking the first free candidate from a fixed
  // preference list — below, above, right, left — preferring positions
  // that don't cover another callout's anchor, then shifting down past the
  // lowest conflicting card. Everything clamps inside the stage.
  function layoutCallouts(items, sw, sh, avoid) {
    var M = 8, out = {}, placed = [];
    avoid = avoid || [];
    function clamp(x, y, cw, ch) {
      return { x: Math.max(8, Math.min(x, sw - cw - 8)),
        y: Math.max(4, Math.min(y, sh - ch - 4)) };
    }
    function overlaps(x, y, w, h, p, m) {
      return x < p.x + p.w + m && p.x < x + w + m && y < p.y + p.h + m && p.y < y + h + m;
    }
    function hit(x, y, w, h) {
      for (var i = 0; i < placed.length; i++) if (overlaps(x, y, w, h, placed[i], M)) return placed[i];
      return null;
    }
    function subjectRects(selfId) {
      var rs = [];
      for (var a = 0; a < items.length; a++) {
        var o = items[a];
        if (o.id !== selfId) rs.push({ x: o.ax, y: o.ay, w: o.aw, h: o.ah });
      }
      return rs.concat(avoid);
    }
    function covers(x, y, w, h, selfId) {
      var rs = subjectRects(selfId);
      for (var v = 0; v < rs.length; v++) if (overlaps(x, y, w, h, rs[v], 0)) return true;
      return false;
    }
    // Area-weighted damage: how much of each subject this spot obliterates.
    // Covering a sliver of a big wash scores low; blotting out a small
    // button scores ~1. Used to pick the least-bad spot when every spot
    // covers something.
    function damage(x, y, w, h, selfId) {
      var rs = subjectRects(selfId), d = 0;
      for (var v = 0; v < rs.length; v++) {
        var r = rs[v];
        var ow = Math.min(x + w, r.x + r.w) - Math.max(x, r.x);
        var oh = Math.min(y + h, r.y + r.h) - Math.max(y, r.y);
        if (ow > 0 && oh > 0) d += (ow * oh) / Math.max(1, r.w * r.h);
      }
      return d;
    }
    var sorted = items.slice().sort(function (a, b) {
      return (a.ay - b.ay) || (a.ax - b.ax) || (a.order - b.order);
    });
    function put(it, x, y) {
      out[it.id] = { x: x, y: y };
      placed.push({ x: x, y: y, w: it.cw, h: it.ch });
    }
    // fixed first — author overrides anchor the sweep
    for (var f = 0; f < sorted.length; f++) {
      var it = sorted[f]; if (!it.fixed) continue;
      var fy = it.place === 'above' ? it.ay - it.gap - it.ch : it.ay + it.ah + it.gap;
      var fp = clamp(it.ax + (it.dx || 0), fy, it.cw, it.ch);
      put(it, fp.x, fp.y);
    }
    for (var i = 0; i < sorted.length; i++) {
      var c = sorted[i]; if (c.fixed) continue;
      var cands = [
        { x: c.ax, y: c.ay + c.ah + c.gap },            // below
        { x: c.ax, y: c.ay - c.gap - c.ch },            // above
        { x: c.ax + c.aw + 10, y: c.ay },               // right
        { x: c.ax - c.cw - 10, y: c.ay },               // left
      ].map(function (p) { return clamp(p.x, p.y, c.cw, c.ch); });
      // shift-down walk from below-anchor, past conflicting cards
      function walk(wantClean) {
        var y = c.ay + c.ah + c.gap, n = 0;
        while (n++ < 24) {
          var cp = clamp(c.ax, y, c.cw, c.ch);
          var conf = hit(cp.x, cp.y, c.cw, c.ch);
          if (!conf && (!wantClean || !covers(cp.x, cp.y, c.cw, c.ch, c.id))) return cp;
          if (cp.y >= sh - c.ch - 4) return null;  // hit the floor
          y = (conf ? conf.y + conf.h : cp.y + c.ch) + M;
        }
        return null;
      }
      var chosen = null, k;
      // 1) a candidate free of cards AND of every subject rect
      for (k = 0; k < cands.length && !chosen; k++) {
        var p1 = cands[k];
        if (!hit(p1.x, p1.y, c.cw, c.ch) && !covers(p1.x, p1.y, c.cw, c.ch, c.id)) chosen = p1;
      }
      // 2) a clean spot further down beats covering someone's element
      if (!chosen) chosen = walk(true);
      // 3) every spot covers something (subjects tile the stage) — take
      // the card-free spot that obliterates the least, area-weighted
      // (ties resolve in preference order, keeping this deterministic)
      if (!chosen) {
        var walked = walk(false);
        var pool = cands.concat(walked ? [walked] : []);
        var best = null, bestD = Infinity;
        for (k = 0; k < pool.length; k++) {
          var p3 = pool[k];
          if (hit(p3.x, p3.y, c.cw, c.ch)) continue;
          var d3 = damage(p3.x, p3.y, c.cw, c.ch, c.id);
          if (d3 < bestD - 1e-9) { best = p3; bestD = d3; }
        }
        chosen = best;
      }
      // 4) clamped last resort
      if (!chosen) chosen = clamp(c.ax, c.ay + c.ah + c.gap, c.cw, c.ch);
      put(c, chosen.x, chosen.y);
    }
    return out;
  }

  var CSS =
    ':host{display:block;font-family:var(--font-ui,-apple-system,BlinkMacSystemFont,sans-serif);color:var(--text-primary,rgba(15,12,8,.92));padding:18px 20px}' +
    ':host([controls=none]){padding:0}' +
    '.io-picker{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:0 0 14px}' +
    '.io-pill{display:inline-flex;align-items:center;height:28px;padding:0 12px;border-radius:14px;border:1px solid var(--border-default,rgba(15,12,8,.14));background:var(--bg-surface,#fff);font:500 12px/1 var(--font-ui,-apple-system,sans-serif);color:var(--text-primary,rgba(15,12,8,.92));cursor:default;white-space:nowrap}' +
    '.io-pill:hover{background:rgba(15,12,8,.04)}' +
    '.io-pill[data-on]{background:var(--accent-black,#191915);border-color:var(--accent-black,#191915);color:var(--text-inverse,#FAF9F5)}' +
    '.io-asof{font:400 11px/1 var(--font-ui,-apple-system,sans-serif);color:var(--text-tertiary,rgba(15,12,8,.48));margin-left:auto}' +
    '.io-stage{position:relative;background:var(--bg-surface,#fff);border:1px solid var(--border-subtle,rgba(15,12,8,.08));border-radius:14px;box-shadow:var(--shadow-sm,0 1px 3px rgba(20,20,19,.06));overflow:hidden}' +
    ':host([controls=none]) .io-stage{border:0;border-radius:0;box-shadow:none;background:transparent;overflow:visible}' +
    '.io-layer{position:absolute;inset:0;pointer-events:none;z-index:100}' +
    '.io-box{position:absolute;border-radius:6px}' +
    '.io-wash{position:absolute;inset:-1px;border-radius:inherit;mix-blend-mode:multiply;opacity:.85}' +
    '.io-wash.nil{background:repeating-linear-gradient(45deg,rgba(15,12,8,.10) 0 4px,transparent 4px 8px);outline:1px dashed rgba(15,12,8,.25);mix-blend-mode:normal}' +
    '.io-tag{position:absolute;transform:translateX(-50%);min-width:28px;padding:2px 5px;border-radius:5px;color:#fff;font:700 9.5px/1 var(--font-ui,-apple-system,sans-serif);font-variant-numeric:tabular-nums;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.2)}' +
    '.io-spot{position:absolute;border:1.5px solid;border-radius:7px;box-sizing:border-box}' +
    // dim — every rect NOT in the insight's elements gets one of these
    '.io-dim{position:absolute;border-radius:6px;background:var(--bg-surface,#fff);mix-blend-mode:screen}' +
    // callout card + leader + numbered pin
    '.io-co{position:absolute;width:200px;padding:9px 11px;background:var(--bg-surface,#fff);border-radius:10px;box-shadow:0 4px 16px rgba(15,12,8,.16);white-space:normal;z-index:103;pointer-events:auto}' +
    '.io-coh{display:block;font:550 12px/1.3 var(--font-ui,-apple-system,sans-serif);color:var(--text-primary,rgba(15,12,8,.92));margin-bottom:3px}' +
    '.io-cob{display:block;font:400 11px/1.4 var(--font-ui,-apple-system,sans-serif);color:var(--text-tertiary,rgba(15,12,8,.48))}' +
    '.io-coleads{position:absolute;left:0;top:0;pointer-events:none;z-index:102}' +
    '.io-colead{stroke:rgba(15,12,8,.45);stroke-width:1;opacity:.6}' +
    '.io-pin{position:absolute;min-width:18px;height:18px;padding:0 4px;box-sizing:border-box;border-radius:9px;color:#fff;font:600 10px/18px var(--font-ui,-apple-system,sans-serif);text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.2);z-index:110}' +
    '.io-pin.inl{position:static;display:inline-block;margin-right:6px;vertical-align:-1px;box-shadow:none}' +
    // hover-to-isolate: hovering a subject fades every other callout
    '.io-co,.io-colead{transition:opacity .12s ease-out}' +
    '.io-layer[data-iso] .io-co:not([data-hot]),.io-layer[data-iso] .io-colead:not([data-hot]){opacity:0}' +
    // legend
    '.io-legend{display:flex;align-items:center;flex-wrap:wrap;gap:10px 18px;padding:12px 2px;font:400 11.5px/1.4 var(--font-ui,-apple-system,sans-serif);color:var(--text-secondary,rgba(15,12,8,.64))}' +
    '.io-legend:empty{display:none}' +
    '.io-li{display:inline-flex;align-items:center;gap:7px}' +
    '.io-lsw{width:13px;height:13px;border-radius:3px;display:inline-block}' +
    '.io-empty{position:absolute;inset:0;display:grid;place-items:center;font:500 13px/1.4 var(--font-ui,-apple-system,sans-serif);color:var(--text-tertiary,rgba(15,12,8,.48));text-align:center;padding:20px}';

  class InsightOverlay extends HTMLElement {
    static get observedAttributes() { return ['src', 'insight', 'controls']; }

    constructor() {
      super();
      var root = this.attachShadow({ mode: 'open' });
      root.innerHTML = '<style>' + CSS + '</style>' +
        '<div class="io-picker" part="picker"></div>' +
        '<div class="io-stage" part="stage"><slot></slot><div class="io-layer"></div></div>' +
        '<div class="io-legend" part="legend"></div>';
      this._picker = root.querySelector('.io-picker');
      this._stage = root.querySelector('.io-stage');
      this._layer = root.querySelector('.io-layer');
      this._legend = root.querySelector('.io-legend');
      this._insights = [];
      this._rects = [];
      this._loadGen = 0;
      this._isoId = null;
      var self = this;
      this._picker.addEventListener('click', function (e) {
        var p = e.target.closest('.io-pill'); if (!p) return;
        self.setAttribute('insight', p.getAttribute('data-insight'));
      });
      this._stage.addEventListener('mousemove', function (e) { self._isolate(e); });
      this._stage.addEventListener('mouseleave', function () { self._isolate(null); });
      this.addEventListener('insight:reload', function () { self._load(); });
    }

    connectedCallback() {
      var self = this;
      // Positioning engine — slotted light-DOM rects, re-measured on any
      // mutation/resize. A single rAF isn't enough for late-mounting
      // content (popovers, transitions): the MutationObserver fires but on
      // that first frame new nodes are still sub-2px. So each schedule also
      // runs a short trailing chain while anything is still under-size.
      var schedule = this._schedule = function () {
        cancelAnimationFrame(self._raf); clearTimeout(self._trail);
        self._retries = 0;
        self._raf = requestAnimationFrame(function () { self._measure(); });
        self._trail = setTimeout(function trail() {
          if (self._measure() && self._retries < 3) { self._retries++; self._trail = setTimeout(trail, 80); }
        }, 80);
      };
      this._mo = new MutationObserver(schedule);
      this._mo.observe(this, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class', 'data-metric-id'] });
      this._ro = new ResizeObserver(schedule);
      this._ro.observe(this._stage);
      window.addEventListener('resize', this._onWin = schedule);
      var n = 0; this._burst = setInterval(function () { self._measure(); if (++n > 12) clearInterval(self._burst); }, 120);
      this._load();
      this._render();
    }

    disconnectedCallback() {
      if (this._mo) this._mo.disconnect();
      if (this._ro) this._ro.disconnect();
      window.removeEventListener('resize', this._onWin);
      clearInterval(this._burst);
      cancelAnimationFrame(this._raf);
      clearTimeout(this._trail);
      if (this._scriptEl) this._scriptEl.remove();
      this._loadGen++;
    }

    attributeChangedCallback(name, prev, next) {
      if (!this.shadowRoot || prev === next) return;
      if (name === 'src') this._load();
      else this._render();
    }

    get insights() { return this._insights; }
    setInsights(arr) { this._insights = Array.isArray(arr) ? arr : []; this._render(); return this; }
    get insight() { return this.getAttribute('insight') || (this._insights[0] && this._insights[0].id) || ''; }
    set insight(id) { this.setAttribute('insight', id); }
    measure() { if (this._schedule) this._schedule(); else this._measure(); return this; }

    _active() {
      var id = this.getAttribute('insight');
      if (!this._insights.length) return null;
      for (var i = 0; i < this._insights.length; i++) if (this._insights[i].id === id) return this._insights[i];
      return this._insights[0];
    }

    _load() {
      if (!this.isConnected) return;
      var src = this.getAttribute('src');
      var gen = ++this._loadGen, self = this;
      var done = function (got) {
        if (gen !== self._loadGen) return;
        // null = "nothing loaded" (no src, fetch failure) — keep whatever
        // is already set so setInsights() before mount, and remounts,
        // aren't silently wiped.
        if (got != null) self._insights = Array.isArray(got) ? got : Array.isArray(got.insights) ? got.insights : [];
        self._render();
      };
      if (!src) return done(null);
      var abs; try { abs = new URL(src, document.baseURI).href; } catch (e) { abs = src; }
      if (/\\.json(\\?|$)/i.test(src)) {
        fetch(abs, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(done).catch(function () { done(null); });
      } else {
        var cur = window.__insights;
        if (!this._insights.length && cur && cur.__src === src) return done(cur);
        var pre = cur;
        window.__insights = undefined;
        if (this._scriptEl) this._scriptEl.remove();
        var s = document.createElement('script');
        s.src = abs + (abs.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now();
        s.onload = function () {
          var got = window.__insights;
          if (got) got.__src = src;
          done(got);
        };
        s.onerror = function () {
          if (gen !== self._loadGen) return;
          if (pre != null && window.__insights === undefined) window.__insights = pre;
          done(self._insights.length ? self._insights : pre || null);
        };
        this._scriptEl = s;
        try { document.head.appendChild(s); } catch (e) { done(null); }
      }
    }

    _measure() {
      var sb = this._stage.getBoundingClientRect();
      var seen = {}, out = [], skipped = 0;
      var els = this.querySelectorAll('[data-metric-id]');
      for (var i = 0; i < els.length; i++) {
        var el = els[i], id = el.getAttribute('data-metric-id');
        if (!id) continue;
        var r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) { skipped++; continue; }
        // Occlusion — centre covered by a sibling modal/popover inside the
        // overlay? The paint layer sits at one z-index above all slotted
        // content; painting on an occluded element would render on top of
        // the occluder. elementFromPoint ignores the layer (pointer-events:
        // none) and retargets shadow hits to the host.
        var top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        var occ = !!(top && top !== this && top !== el && !el.contains(top) && !top.contains(el) && this.contains(top));
        var rect = { id: id, x: r.left - sb.left, y: r.top - sb.top, w: r.width, h: r.height, occluded: occ };
        var at = seen[id];
        if (at != null) { if (!occ && out[at].occluded) out[at] = rect; continue; }
        seen[id] = out.length;
        out.push(rect);
      }
      var prev = this._rects;
      var same = prev.length === out.length && out.every(function (r, j) {
        var p = prev[j];
        return p && p.id === r.id && p.occluded === r.occluded && Math.abs(p.x - r.x) < 0.5 && Math.abs(p.y - r.y) < 0.5 && Math.abs(p.w - r.w) < 0.5 && Math.abs(p.h - r.h) < 0.5;
      });
      if (!same) { this._rects = out; this._renderLayer(); }
      return skipped;
    }

    _render() {
      this._renderPicker();
      this._renderLayer();
      this._renderLegend();
    }

    _renderPicker() {
      var controls = this.getAttribute('controls') || 'picker';
      if (controls === 'none') { this._picker.style.display = 'none'; return; }
      this._picker.style.display = '';
      var cur = this._active(), h = '';
      for (var i = 0; i < this._insights.length; i++) {
        var S = this._insights[i];
        h += '<button type="button" class="io-pill" data-insight="' + esc(S.id) + '"' +
          (cur && S.id === cur.id ? ' data-on' : '') + '>' + esc(S.label || S.id) + '</button>';
      }
      var asOf = cur && fmtDay(cur.asOf);
      if (asOf) h += '<span class="io-asof">as of ' + esc(asOf) + '</span>';
      this._picker.innerHTML = h;
    }

    _renderLegend() {
      var S = this._active();
      if (!S || !S.legend || !S.spectrum) { this._legend.innerHTML = ''; return; }
      var sp = S.spectrum, fmt = fmtOf(sp);
      var rmp = buildRamp(sp, this._values(S));
      var n = sp.steps > 1 ? Math.min(sp.steps, 7) : 4;
      // Swatches read left→right as lo→hi. rmp.flipped (good:'low' actually
      // in effect — a diverging baseline overrides it: "baseline wins")
      // reverses the row so the labels stay honest.
      var sw = '';
      for (var i = 0; i < n; i++) {
        var t = i / (n - 1);
        sw += '<span class="io-lsw" style="background:' + rmp.swatch(rmp.flipped ? 1 - t : t) + '"></span>';
      }
      this._legend.innerHTML = '<span class="io-li"><b>' + esc(sp.name || S.label || '') + '</b></span>' +
        '<span class="io-li">' + sw + ' ' + (rmp.flat ? fmt(rmp.lo) : fmt(rmp.lo) + ' → ' + fmt(rmp.hi)) + '</span>' +
        '<span class="io-li"><span class="io-lsw" style="background:repeating-linear-gradient(45deg,rgba(15,12,8,.18) 0 3px,transparent 3px 6px);outline:1px dashed rgba(15,12,8,.3)"></span> no data</span>';
    }

    _values(S) {
      var els = S.elements || [], out = [];
      for (var i = 0; i < els.length; i++) if ('value' in els[i]) out.push(els[i].value);
      return out;
    }

    _renderLayer() {
      var S = this._active(), rects = this._rects;
      if (!S) {
        this._layer.innerHTML = this.getAttribute('src')
          ? '<div class="io-empty">No insights at <code>' + esc(this.getAttribute('src')) + '</code></div>'
          : '';
        return;
      }
      var laid = rects.map(function (r) { return Object.assign({}, r); });
      var byId = {}; for (var j = 0; j < laid.length; j++) byId[laid[j].id] = laid[j];
      // Lane layout runs only over rects that will actually render a value
      // tag — spotlights, callout-only subjects and dimmed non-subjects
      // shouldn't reserve phantom collision lanes.
      var willTag = {};
      var selsPre = S.elements || [];
      for (var w = 0; w < selsPre.length; w++) if ('value' in selsPre[w]) willTag[selsPre[w].id] = 1;
      layoutTags(laid.filter(function (r) { return willTag[r.id]; }));
      var sb = this._stage.getBoundingClientRect(), sh = sb.height;
      var sp = S.spectrum || {}, fmt = fmtOf(sp);
      var rmp = buildRamp(sp, this._values(S));
      // Accent hue for pins/spotlight/callout leader — the dark end of the
      // ramp (or the single hue if given).
      // Accent for pins/spotlights/leaders/tags: always the ramp's far
      // stop — swatch(t) is direction-agnostic (good:'low' flips value→t
      // mapping, not the ramp itself), so swatch(1) is the saturated end
      // regardless of direction.
      var hue = accentOf(sp) || rmp.swatch(1);
      var subjects = {}, h = '';
      var dim = S.dim != null ? (Number(S.dim) || 0) : 0.25;
      var hasTags = this._values(S).length > 0;
      var sels = S.elements || [];
      // Pin numbers resolve in a pre-pass over the elements array so they
      // are stable across renders (an occluded anchor keeps its number) and
      // auto numbers skip values explicit pins already claim.
      var pinOf = {}, takenPins = {};
      for (var pp = 0; pp < sels.length; pp++) {
        var pc = sels[pp].callout;
        if (pc && pc.pin != null) takenPins[pc.pin] = 1;
      }
      var nextPin = 1;
      for (var pq = 0; pq < sels.length; pq++) {
        var qc = sels[pq].callout;
        if (!qc) continue;
        if (qc.pin != null) { pinOf[pq] = qc.pin; continue; }
        while (takenPins[nextPin]) nextPin++;
        pinOf[pq] = nextPin; takenPins[nextPin] = 1;
      }
      // Subjects: wash + tag (if value), callout (if set), spotlight ring
      // (if neither). Every other rect gets a dim overlay AFTER, so it
      // fades relative to the painted subjects.
      for (var i = 0; i < sels.length; i++) {
        var el = sels[i], r = byId[el.id];
        subjects[el.id] = 1;
        if (!r || r.occluded) continue;
        var box = 'left:' + r.x + 'px;top:' + r.y + 'px;width:' + r.w + 'px;height:' + r.h + 'px';
        if ('value' in el) {
          var v = el.value;
          var col = v == null ? null : ((el.color && safeColor(el.color)) || rmp.color(v));
          h += '<div class="io-box" data-id="' + esc(el.id) + '" style="' + box + '">' +
            (col == null ? '<span class="io-wash nil"></span>'
              : '<span class="io-wash" style="background:' + col + '"></span>') +
            '</div>' +
            '<span class="io-tag" style="left:' + r.tag.cx + 'px;top:' + r.tag.ty + 'px;background:' +
            (v == null ? 'transparent;border:1px dashed rgba(15,12,8,.3);color:var(--text-tertiary,rgba(15,12,8,.48))' : ((el.color && safeColor(el.color)) || hue)) +
            '">' + fmt(v) + '</span>';
        } else if (!el.callout) {
          h += '<span class="io-spot" style="' + box + ';border-color:' + hue + '"></span>';
        }
        var c = el.callout;
        if (c && r && !r.occluded) {
          // Pins auto-number in elements-array order (among callout
          // elements) when not explicitly set.
          var pinVal = pinOf[i];
          h += '<span class="io-pin" style="left:' + (r.x - 6) + 'px;top:' + (r.y - 6) + 'px;background:' + hue + '">' + esc(pinVal) + '</span>';
          var dy = Number(c.dy) || 0, dx = Number(c.dx) || 0;
          var gap = 10 + (hasTags ? 18 : 0) + dy;
          // The card renders unpositioned (visibility:hidden) — the
          // deterministic collision pass below measures real card sizes,
          // places every card, and draws the leaders.
          h += '<span class="io-co" data-for="' + esc(el.id) + '" data-gap="' + gap + '" data-dx="' + dx + '"' +
            (c.place === 'above' || c.place === 'below' ? ' data-place="' + c.place + '"' : '') +
            ((c.place || c.dx != null || c.dy != null) ? ' data-fixed' : '') +
            ' data-order="' + i + '" style="visibility:hidden;left:0;top:0">' +
            '<span class="io-coh">' +
            '<span class="io-pin inl" style="background:' + hue + '">' + esc(pinVal) + '</span>' +
            esc(c.head || '') + '</span>' +
            (c.body ? '<span class="io-cob">' + esc(c.body) + '</span>' : '') +
            '</span>';
        }
      }
      // Dim every tracked element that ISN'T a subject.
      for (var k = 0; k < laid.length; k++) {
        var rd = laid[k];
        if (subjects[rd.id] || rd.occluded) continue;
        h += '<span class="io-dim" style="left:' + rd.x + 'px;top:' + rd.y + 'px;width:' + rd.w + 'px;height:' + rd.h + 'px;opacity:' + (1 - dim) + '"></span>';
      }
      this._layer.innerHTML = h;
      this._fixCallouts(byId, sb.width, sh);
      this._isoId = null; this._layer.removeAttribute('data-iso');
    }

    // Post-layout pass: measure real card sizes, run the deterministic
    // collision layout (layoutCallouts), apply positions, and draw one SVG
    // of leader lines from each anchor to wherever its card landed.
    _fixCallouts(byId, sw, sh) {
      // A zero-size stage (headless DOM, display:none frame) still lays
      // out — a large synthetic stage keeps the sweep deterministic and
      // effectively unclamped until real geometry arrives.
      if (!sw) sw = 4096;
      if (!sh) sh = 4096;
      var cards = this._layer.querySelectorAll('.io-co');
      if (!cards.length) return;
      var items = [], nodes = {};
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i], id = card.getAttribute('data-for');
        var r = byId[id]; if (!r) continue;
        nodes[id] = card;
        items.push({
          id: id, order: parseInt(card.getAttribute('data-order'), 10) || 0,
          ax: r.x, ay: r.y, aw: r.w, ah: r.h,
          // happy-dom (and a mid-transition browser frame) can measure 0 —
          // fall back to the CSS width and a representative height so the
          // sweep still separates cards instead of stacking "0×0" rects.
          cw: card.offsetWidth || 200, ch: card.offsetHeight || 80,
          gap: parseFloat(card.getAttribute('data-gap')) || 10,
          dx: parseFloat(card.getAttribute('data-dx')) || 0,
          place: card.getAttribute('data-place') || '',
          fixed: card.hasAttribute('data-fixed'),
        });
      }
      // Prefer not covering ANY of this insight's subject elements (washes,
      // spotlights) — their rects join the soft-avoid set. Tag lane (~18px
      // under valued elements) included so cards don't sit on the numbers.
      var avoid = [];
      var avEls = (this._active() && this._active().elements) || [];
      for (var av = 0; av < avEls.length; av++) {
        var ar = byId[avEls[av].id];
        if (!ar) continue;
        // Extend the rect over the value-tag band on the side layoutTags
        // actually uses (below for top-row elements, above otherwise).
        var tagPad = 'value' in avEls[av] ? 20 : 0;
        var tagBelow = ar.y < 60;
        avoid.push({ x: ar.x, y: ar.y - (tagBelow ? 0 : tagPad), w: ar.w, h: ar.h + tagPad });
      }
      var pos = layoutCallouts(items, sw, sh, avoid);
      var leads = '';
      for (var j = 0; j < items.length; j++) {
        var it = items[j], p = pos[it.id]; if (!p) continue;
        var node = nodes[it.id];
        node.style.left = p.x + 'px';
        node.style.top = p.y + 'px';
        node.style.bottom = '';
        node.style.visibility = '';
        // leader: straight line between the nearest edge midpoints of the
        // anchor and the card.
        var cw = it.cw, ch = it.ch;
        var acx = it.ax + it.aw / 2, acy = it.ay + it.ah / 2;
        var ccx = p.x + cw / 2, ccy = p.y + ch / 2;
        var dxl = ccx - acx, dyl = ccy - acy;
        var a1, a2, c1, c2;
        if (Math.abs(dyl) >= Math.abs(dxl)) {
          a1 = acx; a2 = dyl > 0 ? it.ay + it.ah : it.ay;
          c1 = ccx; c2 = dyl > 0 ? p.y : p.y + ch;
        } else {
          a1 = dxl > 0 ? it.ax + it.aw : it.ax; a2 = acy;
          c1 = dxl > 0 ? p.x : p.x + cw; c2 = ccy;
        }
        leads += '<line class="io-colead" data-for="' + esc(it.id) + '" x1="' + a1 + '" y1="' + a2 + '" x2="' + c1 + '" y2="' + c2 + '"></line>';
      }
      var old = this._layer.querySelector('.io-coleads');
      if (old) old.remove();
      if (leads) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'io-coleads');
        svg.setAttribute('width', sw); svg.setAttribute('height', sh);
        svg.innerHTML = leads;
        this._layer.appendChild(svg);
      }
    }

    _isolate(e) {
      var rects = this._rects, id = null;
      if (e) {
        var sb = this._stage.getBoundingClientRect();
        var mx = e.clientX - sb.left, my = e.clientY - sb.top, hitA = Infinity;
        for (var i = 0; i < rects.length; i++) {
          var r = rects[i]; if (r.occluded) continue;
          if (mx >= r.x && mx < r.x + r.w && my >= r.y && my < r.y + r.h) {
            var a = r.w * r.h; if (a < hitA) { hitA = a; id = r.id; }
          }
        }
      }
      if (id === this._isoId) return;
      this._isoId = id;
      var cs = this._layer.querySelectorAll('.io-co,.io-colead'), hot = false;
      for (var j = 0; j < cs.length; j++) {
        if (cs[j].getAttribute('data-for') === id) { cs[j].setAttribute('data-hot', ''); hot = true; }
        else cs[j].removeAttribute('data-hot');
      }
      if (hot) this._layer.setAttribute('data-iso', ''); else this._layer.removeAttribute('data-iso');
    }
  }

  if (!customElements.get('insight-overlay')) {
    customElements.define('insight-overlay', InsightOverlay);
  }
  InsightOverlay.layoutCallouts = layoutCallouts;
  window.InsightOverlay = InsightOverlay;
})();

`,
    mn = t({
        STARTER_COMPONENTS: () => G,
        STARTER_COMPONENT_FILENAMES: () => gn,
        STARTER_COMPONENT_KINDS: () => hn,
        TWEAKS_SUGGESTION_BAR_FRAGMENT: () => cn,
        starterContent: () => _n
    }),
    G = {
        "design_canvas.jsx": {
            filename: `design-canvas.jsx`,
            description: `Pan/zoom canvas for presenting design options side-by-side — reorderable/deletable artboards, inline rename, focus-mode overlay`,
            content: en
        },
        "ios_frame.jsx": {
            filename: `ios-frame.jsx`,
            description: `iPhone device frame with status bar, home indicator, keyboard`,
            content: tn
        },
        "android_frame.jsx": {
            filename: `android-frame.jsx`,
            description: `Android device frame with status bar, nav bar, keyboard`,
            content: nn
        },
        "macos_window.jsx": {
            filename: `macos-window.jsx`,
            description: `macOS window chrome with traffic lights and titlebar`,
            content: rn
        },
        "browser_window.jsx": {
            filename: `browser-window.jsx`,
            description: `Browser window chrome with tabs, URL bar, controls`,
            content: an
        },
        "animations.jsx": {
            filename: `animations.jsx`,
            description: `Timeline-based animation engine — Stage, Sprite, easing, scrubber, video export. ALWAYS use this for any standalone animation (not embedded in another design) unless the user explicitly asks you not to.`,
            content: on
        },
        "tweaks_panel.jsx": {
            filename: `tweaks-panel.jsx`,
            description: `Tweaks shell — host protocol wiring + form-control helpers`,
            content: () => sn + (Qt() ? cn : ``)
        },
        "deck_stage.js": {
            filename: `deck-stage.js`,
            description: `Slide deck shell: scaling, keyboard nav, thumbnail rail (click to jump, drag to reorder, right-click to skip/move/duplicate/delete), speaker notes, print-to-PDF. Programmatic nav: document.querySelector('deck-stage').goTo(n) (0-indexed).`,
            content: ln
        },
        "doc_page.js": {
            filename: `doc-page.js`,
            description: `Paged-document shell: one continuous sheet on screen; at print the browser paginates the flow onto the declared paper size with no date/URL chrome. Optional slot="header"/slot="footer" repeat on every printed page.`,
            content: un
        },
        "image_slot.js": {
            filename: `image-slot.js`,
            description: `User-fillable image placeholder — drag-and-drop target that persists the dropped image. Shape/mask/size are author-controlled.`,
            content: dn
        },
        "metrics_overlay.js": {
            filename: `metrics-overlay.js`,
            description: `Product-metrics overlay — wraps a UI and paints usage glyphs (heat-map / trend / real-estate) on every [data-metric-id] element from a static snapshot file; sentence-builder filter control; posts metrics:refetch to the host when the user wants fresher data. Adds a pill shelf + click-to-record user-flow builder (Record/▶Play in a right panel; edits auto-save via the host, Get latest numbers has the agent compute the per-user sequential counts into funnels.json) and defines <metrics-funnel> for standalone read-only charts. Always expose this via a tweaks-panel toggle (off by default) — never mount it as an always-on wrapper.`,
            content: fn
        },
        "insight_overlay.js": {
            filename: `insight-overlay.js`,
            description: `Data-storytelling overlay — wraps a UI and paints one named insight on top: a colour wash + value tag on each of the insight's listed [data-metric-id] elements (interpolated into a single per-insight colour ramp), an optional pinned callout card on any of them, and every other tracked element dimmed so the insight's subjects stand out. A pill picker switches insights. Loads a static insights file the agent writes. Always expose this via a tweaks-panel toggle (off by default) — never mount it as an always-on wrapper.`,
            content: pn
        }
    },
    hn = Object.keys(G).filter(e => !G[e].hide),
    gn = new Set(Object.values(G).map(e => e.filename));

function _n(e) {
    return typeof e.content == `function` ? e.content() : e.content
}
var vn = `
document.addEventListener('DOMContentLoaded', async function() {
  const loading = document.getElementById('__bundler_loading');
  function setStatus(msg) { if (loading) loading.textContent = msg; }

  // Error sink persists across replaceWith since it's on window, not the DOM.
  window.addEventListener('error', function(e) {
    var p = document.body || document.documentElement;
    var d = document.getElementById('__bundler_err') || p.appendChild(document.createElement('div'));
    d.id = '__bundler_err';
    d.style.cssText = 'position:fixed;bottom:12px;left:12px;right:12px;font:12px/1.4 ui-monospace,monospace;background:#2a1215;color:#ff8a80;padding:10px 14px;border-radius:8px;border:1px solid #5c2b2e;z-index:99999;white-space:pre-wrap;max-height:40vh;overflow:auto';
    d.textContent = (d.textContent ? d.textContent + String.fromCharCode(10) : '') +
      '[bundle] ' + (e.message || e.type) +
      (e.filename ? ' (' + e.filename.slice(0, 60) + ':' + e.lineno + ')' : '');
  }, true);

  try {
    const manifestEl = document.querySelector('script[type="__bundler/manifest"]');
    const templateEl = document.querySelector('script[type="__bundler/template"]');
    if (!manifestEl || !templateEl) {
      setStatus('Error: missing bundle data');
      console.error('[bundler] Missing script tags — manifestEl:', !!manifestEl, 'templateEl:', !!templateEl);
      return;
    }

    const manifest = JSON.parse(manifestEl.textContent);
    let template = JSON.parse(templateEl.textContent);

    const uuids = Object.keys(manifest);
    setStatus('Unpacking ' + uuids.length + ' assets...');

    const blobUrls = {};
    await Promise.all(uuids.map(async (uuid) => {
      const entry = manifest[uuid];
      try {
        const binaryStr = atob(entry.data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

        let finalBytes = bytes;
        if (entry.compressed) {
          if (typeof DecompressionStream !== 'undefined') {
            const ds = new DecompressionStream('gzip');
            const writer = ds.writable.getWriter();
            const reader = ds.readable.getReader();
            writer.write(bytes);
            writer.close();
            const chunks = [];
            let totalLen = 0;
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
              totalLen += value.length;
            }
            finalBytes = new Uint8Array(totalLen);
            let offset = 0;
            for (const chunk of chunks) { finalBytes.set(chunk, offset); offset += chunk.length; }
          } else {
            console.warn('DecompressionStream not available, asset ' + uuid + ' may not render');
          }
        }

        blobUrls[uuid] = URL.createObjectURL(new Blob([finalBytes], { type: entry.mime }));
      } catch (err) {
        console.error('Failed to decode asset ' + uuid + ':', err);
        blobUrls[uuid] = URL.createObjectURL(new Blob([], { type: entry.mime }));
      }
    }));

    const extResEl = document.querySelector('script[type="__bundler/ext_resources"]');
    const extResources = extResEl ? JSON.parse(extResEl.textContent) : [];
    const resourceMap = {};
    for (const entry of extResources) {
      if (blobUrls[entry.uuid]) resourceMap[entry.id] = blobUrls[entry.uuid];
    }

    setStatus('Rendering...');
    for (const uuid of uuids) template = template.split(uuid).join(blobUrls[uuid]);

    // Strip integrity + crossorigin — blob URLs from a file:// document inherit
    // a null origin, so crossorigin forces a CORS fetch that SRI then rejects.
    // The manifest bytes are ours; SRI protects against CDN compromise, not this.
    template = template.replace(/\\s+integrity="[^"]*"/gi, '').replace(/\\s+crossorigin="[^"]*"/gi, '');

    const resourceScript = '<script>window.__resources = ' +
      JSON.stringify(resourceMap).split('</' + 'script>').join('<\\\\/' + 'script>') +
      ';</' + 'script>';
    // Inject after <head> so the DOCTYPE stays first; prepending the script
    // would push the parser into quirks mode. DOMParser always emits a <head>
    // (synthesizing one if the source HTML omitted it) but may carry
    // attributes through, so match the full opening tag. slice() rather than
    // replace() keeps us clear of $-pattern substitution in resourceScript.
    const headOpen = template.match(/<head[^>]*>/i);
    if (headOpen) {
      const i = headOpen.index + headOpen[0].length;
      template = template.slice(0, i) + resourceScript + template.slice(i);
    }

    // Parse the template and swap the root element. Scripts inserted via
    // DOMParser/replaceWith are inert per spec — re-create each with
    // createElement so they execute, awaiting onload for src scripts to
    // preserve ordering (React before ReactDOM before Babel before text/babel).
    const doc = new DOMParser().parseFromString(template, 'text/html');
    document.documentElement.replaceWith(doc.documentElement);
    const dead = Array.from(document.scripts);
    for (const old of dead) {
      const s = document.createElement('script');
      for (const a of old.attributes) s.setAttribute(a.name, a.value);
      s.textContent = old.textContent;
      // text/babel scripts with a src: fetch and inline. transformScriptTags
      // does XHR against the src, but blob:null/ from a file:// origin is
      // silently dropped. Inlining makes it a plain inline babel script,
      // which transformScriptTags handles unconditionally.
      if ((s.type === 'text/babel' || s.type === 'text/jsx') && s.src) {
        const r = await fetch(s.src);
        s.textContent = await r.text();
        s.removeAttribute('src');
      }
      const p = s.src ? new Promise(function(r) { s.onload = s.onerror = r; }) : null;
      old.replaceWith(s);
      if (p) await p;
    }
    // Babel standalone auto-transforms type=text/babel on DOMContentLoaded,
    // which fired before we swapped the document. Trigger manually if present.
    if (window.Babel && typeof window.Babel.transformScriptTags === 'function') {
      window.Babel.transformScriptTags();
    }
  } catch (err) {
    setStatus('Error unpacking: ' + err.message);
    console.error('Bundle unpack error:', err);
  }
});
`,
    yn = /^(#[0-9a-fA-F]{3,8}|rgba?\([\d.,%\s/]+\)|hsla?\([\d.,%\s/]+\)|[a-zA-Z]+)$/;

function bn(e, t) {
    let n = (e ? ? ``).trim();
    return yn.test(n) ? n : t
}
var xn = `support.js`,
    Sn = /<(x-import|dc-import)((?:[^>"']|"[^"]*"|'[^']*')*)\/>/gi;

function Cn(e) {
    return e.replace(/&/g, `&amp;`).replace(/"/g, `&quot;`).replace(/</g, `&lt;`).replace(/>/g, `&gt;`)
}

function wn(e) {
    return e.replace(Sn, (e, t, n) => `<${t}${n}></${t}>`)
}

function Tn(e) {
    return (e.split(`/`).pop() || e).replace(/\.dc\.html$/, ``)
}

function En(e) {
    let t = wn(e.dcHtml ? ? ``),
        n = e.dcJs ? ? ``,
        r = e.propsJson ? ? ``,
        i = ``;
    return (n.trim() || r.trim()) && (i = `<script type="text/x-dc" data-dc-script${r.trim()?` data-props="${Cn(r.trim())}"`:``}>${n.trim()?`\n${n}\n`:``}<\/script>\n`), `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./${xn}"><\/script>
</head>
<body>
<x-dc>
${t}
</x-dc>
${i}</body>
</html>
`
}

function Dn(e, t) {
    let n = null;
    for (let r = t; r < e.length; r++) {
        let t = e[r];
        if (n) t === n && (n = null);
        else if (t === `"` || t === `'`) n = t;
        else if (t === `>`) return r
    }
    return -1
}

function On(e) {
    let t = e.search(/<x-dc[\s>]/i);
    if (t === -1) return null;
    let n = Dn(e, t);
    if (n === -1) return null;
    let r = e.lastIndexOf(`</x-dc>`);
    if (r === -1 || r < n) return null;
    let i = n + 1,
        a = e.slice(i, r),
        o = /<script[^>]*\bdata-dc-script\b[^>]*>([\s\S]*?)<\/script>/i.exec(e);
    return {
        template: a,
        templateStart: i,
        templateEnd: r,
        js: o ? o[1] : ``,
        jsMatch: o
    }
}

function kn(e, t, n) {
    return e.slice(0, t.templateStart) + n + e.slice(t.templateEnd)
}

function An(e) {
    return e.replace(/&gt;/g, `>`).replace(/&lt;/g, `<`).replace(/&quot;/g, `"`).replace(/&amp;/g, `&`)
}

function jn(e) {
    let t = On(e);
    if (!t ? .jsMatch) return null;
    let n = Dn(e, t.jsMatch.index);
    if (n === -1) return null;
    let r = e.slice(t.jsMatch.index, n),
        i = /\bdata-props\s*=\s*"((?:[^"\\]|\\.)*)"/i.exec(r) ? ? /\bdata-props\s*=\s*'((?:[^'\\]|\\.)*)'/i.exec(r);
    return i ? An(i[1]) : null
}

function Mn(e, t) {
    let n = On(e);
    if (!n) return null;
    let r = t.trim() ? ` data-props="${Cn(t.trim())}"` : ``;
    if (!n.jsMatch) {
        let t = `<script type="text/x-dc" data-dc-script${r}><\/script>\n`,
            n = e.lastIndexOf(`</body>`);
        return n === -1 ? e + t : e.slice(0, n) + t + e.slice(n)
    }
    let i = n.jsMatch.index,
        a = Dn(e, i);
    if (a === -1) return null;
    let o = e.slice(i, a).replace(/\s+data-props\s*=\s*"(?:[^"\\]|\\.)*"/i, ``).replace(/\s+data-props\s*=\s*'(?:[^'\\]|\\.)*'/i, ``);
    return e.slice(0, i) + o + r + e.slice(a)
}

function Nn(e, t, n) {
    if (!t.jsMatch) {
        let t = `<script type="text/x-dc" data-dc-script>\n${n}\n<\/script>\n`,
            r = e.lastIndexOf(`</body>`);
        return r === -1 ? e + t : e.slice(0, r) + t + e.slice(r)
    }
    let r = t.jsMatch,
        i = r[0].slice(0, r[0].indexOf(`>`) + 1);
    return e.slice(0, r.index) + i + n + `<\/script>` + e.slice(r.index + r[0].length)
}
var Pn = [{
    re: /<!doctype/i,
    label: `<!DOCTYPE`
}, {
    re: /<html[\s>]/i,
    label: `<html>`
}, {
    re: /<head[\s>]/i,
    label: `<head>`
}, {
    re: /<body[\s>]/i,
    label: `<body>`
}, {
    re: /<\/?x-dc[\s>]/i,
    label: `<x-dc>`
}, {
    re: /data-dc-script/i,
    label: `data-dc-script`
}];

function Fn(e) {
    for (let {
            re: t,
            label: n
        } of Pn)
        if (t.test(e)) return n;
    return null
}

function In(e) {
    return /<\/?script/i.test(e) ? `<script>` : /<\/?x-dc[\s>]/i.test(e) ? `<x-dc>` : null
}

function Ln(e, t, n, r) {
    if (!t) return {
        ok: !0,
        value: e + n,
        count: 1
    };
    let i = e.indexOf(t);
    if (i === -1) return {
        ok: !1,
        reason: `not-found`
    };
    if (r) {
        let r = 0,
            i = ``,
            a = 0;
        for (let o = e.indexOf(t); o !== -1; o = e.indexOf(t, a)) i += e.slice(a, o) + n, a = o + t.length, r++;
        return i += e.slice(a), {
            ok: !0,
            value: i,
            count: r
        }
    }
    return e.indexOf(t, i + 1) === -1 ? {
        ok: !0,
        value: e.slice(0, i) + n + e.slice(i + t.length),
        count: 1
    } : {
        ok: !1,
        reason: `ambiguous`
    }
}
var Rn = new Set([`image/png`, `image/jpeg`, `image/webp`, `image/avif`, `image/gif`, `video/mp4`, `video/webm`, `audio/mpeg`, `audio/mp3`, `audio/aac`, `audio/ogg`, `font/woff`, `font/woff2`, `application/zip`, `application/gzip`]),
    zn = 10,
    Bn = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function Vn(e) {
    let t = [],
        n = 0,
        r = e.length,
        i = e => e === ` ` || e === `	` || e === `
` || e === `\r` || e === `\f`;
    for (; n < r;) {
        for (; n < r && (i(e[n]) || e[n] === `,`);) n++;
        if (n >= r) break;
        let a = n;
        for (; n < r && !i(e[n]);) n++;
        let o = e.slice(a, n);
        if (o.endsWith(`,`)) {
            for (; o.endsWith(`,`);) o = o.slice(0, -1);
            o && t.push(o);
            continue
        }
        for (; n < r && i(e[n]);) n++;
        let s = n;
        for (; n < r && e[n] !== `,`;) n++;
        let c = e.slice(s, n).trim();
        t.push(c ? `${o} ${c}` : o)
    }
    return t
}
async function Hn(e, t, n) {
    let r = /<x-dc(?:\s[^>]*)?>/.exec(e),
        i = e.lastIndexOf(`</x-dc>`),
        a = r && i >= r.index + r[0].length ? e.slice(0, r.index + r[0].length) + wn(e.slice(r.index + r[0].length, i)) + e.slice(i) : e,
        o = new DOMParser().parseFromString(a, `text/html`),
        s = new Map,
        c = new Map,
        l = [],
        u = new Set,
        d = async e => {
            let t = await n(e);
            return !t && !u.has(e) && (u.add(e), l.push(`asset not found: ${e}`)), t
        };
    async function f(e) {
        if (!e || e.startsWith(`#`)) return null;
        let n = e.slice(0, e.indexOf(`:`) + 1).toLowerCase();
        if (n === `data:` || n === `blob:` || n === `javascript:`) return null;
        let r = K(e, t);
        if (s.has(r)) return s.get(r).uuid;
        if (c.has(r)) return c.get(r);
        let i = (async () => {
            let e = await d(r);
            if (!e) return null;
            let t = crypto.randomUUID();
            return s.set(r, {
                uuid: t,
                data: e.data,
                mime: e.mime
            }), t
        })();
        c.set(r, i);
        let a = await i;
        return c.delete(r), a
    }
    async function p(e, t) {
        let n = e.getAttribute(t);
        if (!n) return;
        let r = n.indexOf(`#`),
            i = r >= 0 ? n.slice(r) : ``,
            a = await f(n);
        a && e.setAttribute(t, a + i)
    }
    async function m(e) {
        let t = e.getAttribute(`srcset`);
        if (!t) return;
        let n = Vn(t),
            r = [];
        for (let e of n) {
            let [t, ...n] = e.split(/\s+/), i = await f(t);
            r.push(i ? `${i} ${n.join(` `)}`.trim() : e)
        }
        e.setAttribute(`srcset`, r.join(`, `))
    }
    await Promise.all(Array.from(o.querySelectorAll(`img`)).map(async e => {
        await p(e, `src`), await m(e)
    })), await Promise.all(Array.from(o.querySelectorAll(`source[srcset]`)).map(e => m(e))), await Promise.all(Array.from(o.querySelectorAll(`image-slot[src]`)).map(e => p(e, `src`))), await Promise.all(Array.from(o.querySelectorAll(`svg image, svg use`)).map(async e => {
        e.hasAttribute(`href`) ? await p(e, `href`) : e.hasAttribute(`xlink:href`) && await p(e, `xlink:href`)
    }));
    let h = [],
        g = Array.from(o.querySelectorAll(`meta[name="ext-resource-dependency"]`));
    await Promise.all(g.map(async e => {
        let t = e.getAttribute(`content`),
            n = e.getAttribute(`data-resource-id`);
        if (t && n) {
            let e = await f(t);
            e && h.push({
                id: n,
                uuid: e
            })
        }
        e.remove()
    })), await Promise.all(Array.from(o.querySelectorAll(`video[src], audio[src], source[src], track[src]`)).map(e => p(e, `src`))), await Promise.all(Array.from(o.querySelectorAll(`video[poster]`)).map(e => p(e, `poster`))), await Promise.all(Array.from(o.querySelectorAll(`link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]`)).map(e => p(e, `href`))), await Promise.all(Array.from(o.querySelectorAll(`script[src]`)).map(e => p(e, `src`))), await Promise.all(Array.from(o.querySelectorAll(`x-dc x-import`)).map(async e => {
        let r = `from`;
        if (!e.getAttribute(r)) return;
        let i = e.getAttribute(r).trim();
        if (i.includes(`{{`)) return;
        if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(i)) {
            if (!/\/v1\/design\/projects\/[^/]+\/serve\//.test(i)) return;
            let e = K(i, t);
            if (!s.has(e)) {
                let t = await n(e);
                if (!t) return;
                s.has(e) || s.set(e, {
                    uuid: crypto.randomUUID(),
                    data: t.data,
                    mime: t.mime
                })
            }
        }
        let a = i.indexOf(`#`),
            o = a >= 0 ? i.slice(a) : ``,
            c = i.split(`#`)[0].split(`?`)[0].split(`/`).pop() || ``,
            l = await f(i);
        if (l) {
            let t = `${l}#/${c}${o}`,
                n = /\.(jsx|tsx)(\?|#|$)/i,
                a = n.exec(i);
            a && !n.test(t) && (t += `#.${a[1]}`), e.setAttribute(r, t)
        }
    }));
    let _ = Array.from(o.querySelectorAll(`style`));
    for (let e of Array.from(o.querySelectorAll(`link[rel~="stylesheet" i]`))) {
        let n = e.getAttribute(`href`);
        if (!n || (e.getAttribute(`rel`) || ``).toLowerCase().split(/\s+/).includes(`alternate`)) continue;
        let r = n.slice(0, n.indexOf(`:`) + 1).toLowerCase();
        if (r === `data:` || r === `blob:`) continue;
        let i = K(n, t),
            a = await d(i);
        if (a) {
            let t = new TextDecoder().decode(a.data);
            t = await Jn(t, i, d, s, 0);
            let n = o.createElement(`style`);
            e.hasAttribute(`disabled`) ? n.setAttribute(`media`, `not all`) : e.hasAttribute(`media`) && n.setAttribute(`media`, e.getAttribute(`media`)), e.hasAttribute(`title`) && n.setAttribute(`title`, e.getAttribute(`title`)), n.textContent = Wn(t), e.replaceWith(n)
        }
    }
    for (let e of Array.from(o.querySelectorAll(`link[rel~="preload" i], link[rel~="prefetch" i], link[rel~="modulepreload" i]`))) e.remove();
    for (let e of _) e.textContent = Wn(await Jn(e.textContent || ``, t, d, s, 0));
    for (let e of Array.from(o.querySelectorAll(`[style]`))) {
        let n = e.getAttribute(`style`) || ``;
        e.setAttribute(`style`, await Xn(n, t, d, s))
    }
    let v = o.querySelector(`template#__bundler_thumbnail`),
        y = ``,
        b = `#faf9f5`;
    v && (y = v.innerHTML, b = bn(v.getAttribute(`data-bg-color`), b), v.remove());
    let ee = o.querySelector(`title`) ? .textContent || `Bundled Page`,
        te = `<!DOCTYPE html>
` + o.documentElement.outerHTML,
        x = {};
    for (let [, e] of s) {
        let t = !Rn.has(e.mime),
            n = t ? await Zn(e.data) : e.data;
        x[e.uuid] = {
            mime: e.mime,
            compressed: t,
            data: Qn(n)
        }
    }
    let S = Gn(JSON.stringify(te)),
        C = Gn(JSON.stringify(h)),
        w = Object.values(x).reduce((e, t) => e + t.data.length, 0);
    return w > 200 * 1024 * 1024 && l.push(`total output is ${(w/1024/1024).toFixed(1)}MB — may cause browser perf issues`), {
        html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${Un(ee)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: ${b}; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    #__bundler_loading { position: fixed; bottom: 20px; right: 20px; font: 13px/1.4 -apple-system, BlinkMacSystemFont, sans-serif; color: #666; background: #fff; padding: 8px 14px; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.12); z-index: 10000; }
    #__bundler_thumbnail { position: fixed; inset: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: ${b}; z-index: 9999; }
    #__bundler_thumbnail svg { width: 100%; height: 100%; object-fit: contain; }
    #__bundler_placeholder { color: #999; font-size: 14px; }
  </style>
  <noscript>
    <style>#__bundler_loading { display: none; }</style>
    <div style="position:fixed;bottom:12px;left:12px;font:13px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;color:#999;background:rgba(255,255,255,0.9);padding:6px 12px;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,0.08);z-index:10000;">
      This page requires JavaScript to display.
    </div>
  </noscript>
</head>
<body>
  ${y?`<div id="__bundler_thumbnail">`+y+`</div>`:`<div id="__bundler_placeholder">Loading `+Un(ee)+`...</div>`}
  <div id="__bundler_loading">Unpacking...</div>

  <script>
    ${vn}
  <\/script>

  <script type="__bundler/manifest">
${Gn(JSON.stringify(x))}
  <\/script>

  <script type="__bundler/ext_resources">
${C}
  <\/script>

  <script type="__bundler/template">
${S}
  <\/script>
</body>
</html>`,
        warnings: l
    }
}

function K(e, t) {
    let n = e.split(`#`)[0];
    if (/^(https?:)?\/\//.test(n)) return n;
    if (/^https?:\/\//.test(t)) return new URL(n, t).href;
    if (t.startsWith(`//`)) return new URL(n, `https:` + t).href;
    let r = n.split(`?`)[0];
    if (r.startsWith(`/`)) return r;
    let i = t.split(`?`)[0],
        a = i.startsWith(`/`),
        o = i.split(`/`);
    o.pop();
    let s = [];
    for (let e of [...o, ...r.split(`/`)]) e === `.` || e === `` || (e === `..` ? s.pop() : s.push(e));
    return (a ? `/` : ``) + s.join(`/`)
}

function Un(e) {
    return e.replace(/&/g, `&amp;`).replace(/</g, `&lt;`).replace(/>/g, `&gt;`)
}

function Wn(e) {
    return e.replace(/<\/(style)/gi, `<\\/$1`)
}

function Gn(e) {
    return e.replace(/<\//g, `<\\u002F`)
}
var Kn = /@import\s+(?:url\(\s*(?:"([^"]+)"|'([^']+)'|([^)"'\s][^)]*?))\s*\)|"([^"]+)"|'([^']+)')([^;]*);/gi;

function qn(e, t) {
    if (t = t.trim(), !t) return e;
    let n = null,
        r = null,
        i = /^layer(?=\s|$|\()(?:\(([^)]*)\))?\s*/i.exec(t);
    i && (n = (i[1] ? ? ``).trim(), t = t.slice(i[0].length));
    let a = /^supports\(/i.exec(t);
    if (a) {
        let e = 0,
            n = a[0].length - 1;
        for (; n < t.length; n++)
            if (t[n] === `(`) e++;
            else if (t[n] === `)` && --e === 0) {
            n++;
            break
        }
        r = t.slice(a[0].length - 1, n), t = t.slice(n)
    }
    let o = t.trim();
    return o && (e = `@media ${o} {\n${e}\n}`), r && (e = `@supports ${r} {\n${e}\n}`), n !== null && (e = n ? `@layer ${n} {\n${e}\n}` : `@layer {\n${e}\n}`), e
}
async function Jn(e, t, n, r, i) {
    if (i >= zn) return e;
    let a = [];
    for (let o of e.matchAll(Kn)) {
        let e = o[1] ? ? o[2] ? ? o[3] ? ? o[4] ? ? o[5],
            s = e.slice(0, e.indexOf(`:`) + 1).toLowerCase();
        if (s === `data:` || s === `blob:`) continue;
        let c = K(e, t),
            l = await n(c);
        if (l) {
            let e = new TextDecoder().decode(l.data);
            e = await Jn(e, c, n, r, i + 1), e = qn(e, o[6] || ``), a.push({
                full: o[0],
                content: e
            })
        }
    }
    for (let t of a) e = e.split(t.full).join(t.content);
    return Xn(e, t, n, r)
}
var Yn = /url\(\s*(?:"(?!data:|blob:|#)([^"]+)"|'(?!data:|blob:|#)([^']+)'|(?!['"]|data:|blob:|#)([^)]+?))\s*\)/gi;
async function Xn(e, t, n, r) {
    let i = [],
        a;
    for (Yn.lastIndex = 0;
        (a = Yn.exec(e)) !== null;) {
        let e = a[1] ? ? a[2] ? ? a[3];
        if (Bn.test(e.split(`#`)[0])) continue;
        let o = e.indexOf(`#`),
            s = o >= 0 ? e.slice(o) : ``,
            c = K(e, t),
            l;
        if (r.has(c)) l = r.get(c).uuid;
        else {
            let e = await n(c);
            if (!e) continue;
            l = crypto.randomUUID(), r.set(c, {
                uuid: l,
                data: e.data,
                mime: e.mime
            })
        }
        i.push({
            original: a[0],
            replacement: `url("${l}${s}")`
        })
    }
    for (let t of i) e = e.split(t.original).join(t.replacement);
    return e
}
async function Zn(e) {
    let t = new CompressionStream(`gzip`),
        n = t.writable.getWriter();
    n.write(e), n.close();
    let r = t.readable.getReader(),
        i = [],
        a = 0;
    for (;;) {
        let {
            done: e,
            value: t
        } = await r.read();
        if (e) break;
        i.push(t), a += t.length
    }
    let o = new Uint8Array(a),
        s = 0;
    for (let e of i) o.set(e, s), s += e.length;
    return o
}

function Qn(e) {
    let t = ``,
        n = 32768;
    for (let r = 0; r < e.length; r += n) t += String.fromCharCode(...e.subarray(r, r + n));
    return btoa(t)
}
var $n = t({
        DS_ADHERENCE_PATH: () => Z,
        DS_DERIVED_ARTIFACTS: () => Jr,
        DS_MANIFEST_PATH: () => Q,
        STYLES_ENTRY_CANDIDATES: () => Xr,
        babelParse: () => Pr,
        componentSourcePaths: () => ti,
        computeBrandFontStatus: () => ir,
        discoverComponents: () => ni,
        extractFontFaces: () => Mr,
        extractRemoteCssImports: () => mr,
        extractTokens: () => jr,
        familiesFromFontValue: () => rr,
        familiesFromRemoteCssUrl: () => gr,
        inferTokenKind: () => Cr,
        injectDsCardMarker: () => lr,
        isV2Layout: () => ri,
        normalizeFamilyKey: () => q,
        parseDsCard: () => Hr,
        parseDsMigrationMarker: () => ar,
        parseDsSourceInventory: () => sr,
        parseDts: () => Kr,
        parseHtmlStartingPoint: () => Br,
        parseTemplate: () => Wr,
        readDsMigrationLatch: () => or,
        remoteFontInfoFromImports: () => _r,
        resolveCssRef: () => X,
        resolveTokenKinds: () => wr,
        serializeDsCardMarker: () => cr,
        themeLabel: () => Tr,
        walkDsLayout: () => Zr,
        walkStylesClosure: () => fr
    }),
    er = new Set(`serif.sans-serif.monospace.cursive.fantasy.system-ui.ui-serif.ui-sans-serif.ui-monospace.ui-rounded.emoji.math.fangsong.inherit.initial.unset.revert.normal.bold.bolder.lighter.italic.oblique.small-caps.condensed.expanded.-apple-system.blinkmacsystemfont.segoe ui.roboto.helvetica.helvetica neue.arial.noto sans.liberation sans.apple color emoji.segoe ui emoji.segoe ui symbol.noto color emoji.menlo.monaco.consolas.sfmono-regular.sf mono.courier new.courier.liberation mono.georgia.times.times new roman.verdana.tahoma.uppercase.lowercase.capitalize.none.antialiased.subpixel-antialiased`.split(`.`)),
    tr = /^["'][a-z0-9]{3,4}["'](?:\s+(?:\d[\d.]*|on|off))?$/,
    nr = /^["'](?:[a-z0-9]{3,4}["']\s+(?:\d[\d.]*|on|off)|(?:ss|cv)\d\d["'])$/;

function rr(e) {
    let t = e.trim();
    if (/^var\(/i.test(t)) return [];
    let n = /(?:\d[\d.]*(?:px|rem|r?em|pt|%|v[wh]|vmin|vmax|ch|ex)(?:\s*\/\s*\d[\d.]*\w*)?)\s+(.+)$/i.exec(t);
    n && (t = n[1]);
    let r = t.split(`,`).map(e => e.trim()),
        i = r.filter(e => e !== ``);
    if (i.length > 0 && i.every(e => tr.test(e)) && (i.length > 1 || nr.test(i[0]))) return [];
    let a = r.some(e => {
        let t = e.replace(/^['"]|['"]$/g, ``).toLowerCase();
        return er.has(t)
    });
    for (let e of r) {
        let t = /^['"]/.test(e),
            n = e.replace(/^['"]|['"]$/g, ``);
        if (!n || /^var\(/i.test(n) || /^-?\.?\d|^#|[()'"]/.test(n)) continue;
        let r = n.toLowerCase();
        if (!er.has(r) && !(!t && !a && xr(r)) && !(!t && !/[A-Z\s]/.test(n) && !a)) return [n]
    }
    return []
}

function q(e) {
    return e.toLowerCase().replace(/[-_\s]+/g, ` `).trim()
}

function ir(e, t, n) {
    let r = new Set((n ? .families ? ? []).map(q)),
        i = (n ? .unknownHosts.length ? ? 0) > 0,
        a = new Map;
    for (let e of t) {
        let t = e.family.toLowerCase(),
            n = a.get(t) ? ? {
                family: e.family,
                hasFace: !1,
                hasFile: !1,
                tokens: [],
                path: e.cssPath
            };
        n.hasFace = !0, n.hasFile = n.hasFile || e.files.length > 0 || e.remoteSrc === !0, a.set(t, n)
    }
    for (let t of e)
        if (t.kind === `font`)
            for (let e of rr(t.value)) {
                let n = e.toLowerCase(),
                    r = a.get(n) ? ? {
                        family: e,
                        hasFace: !1,
                        hasFile: !1,
                        tokens: [],
                        path: t.definedIn
                    };
                r.tokens.includes(t.name) || r.tokens.push(t.name), a.set(n, r)
            }
    return [...a.values()].map(({
        family: e,
        hasFace: t,
        hasFile: n,
        tokens: a,
        path: o
    }) => ({
        family: e,
        status: a.length === 0 ? `unreferenced` : r.has(q(e)) ? `ok` : t ? n ? `ok` : i ? `maybe-remote` : `no-file` : i ? `maybe-remote` : `no-face`,
        tokens: a,
        path: o
    }))
}

function ar(e) {
    if (typeof e != `object` || !e || Array.isArray(e)) return;
    let {
        v: t,
        migratedAssets: n
    } = e;
    if (!(typeof t != `number` || !Number.isInteger(t) || t < 1) && Array.isArray(n)) return {
        v: t,
        migratedAssets: n.filter(S).slice(0, 512)
    }
}

function or(e) {
    if (!e || typeof e != `object` || Array.isArray(e)) return {
        open: !1,
        migrated: new Set
    };
    let t = ar(e.migration),
        n = e.cards;
    return {
        open: t === void 0 || Array.isArray(n) && n.length === 0,
        migrated: new Set(t ? .migratedAssets)
    }
}

function sr(e) {
    if (typeof e != `object` || !e || Array.isArray(e)) return;
    let t = e;
    if (t.source !== `fig`) return;
    let n = e => typeof e == `number` && Number.isInteger(e) && e >= 0 && e <= 1e6 ? e : void 0,
        r = n(t.componentFamilies),
        i = n(t.textStyles);
    if (r === void 0 || i === void 0 || !Array.isArray(t.tokenCollections)) return;
    let a = [];
    for (let e of t.tokenCollections) {
        if (typeof e != `object` || !e) continue;
        let t = C(e.name, 100),
            r = n(e.variables);
        if (!(!t || r === void 0) && (a.push({
                name: t,
                variables: r
            }), a.length >= 512)) break
    }
    let o = Array.isArray(t.componentFamilyNames) ? t.componentFamilyNames.map(e => C(e, 100)).filter(e => e !== ``).slice(0, 512) : void 0,
        s = C(t.capturedAt, 40);
    return {
        source: `fig`,
        componentFamilies: r,
        ...o === void 0 ? {} : {
            componentFamilyNames: o
        },
        textStyles: i,
        tokenCollections: a,
        ...s ? {
            capturedAt: s
        } : {}
    }
}

function J(e) {
    return e.replace(/"/g, `'`).replace(/--/g, `–`).replace(/[\r\n]+/g, ` `).trim()
}

function cr(e) {
    let t = [`group="${J(e.group)}"`];
    return e.name && t.push(`name="${J(e.name)}"`), e.subtitle && t.push(`subtitle="${J(e.subtitle)}"`), e.viewport && t.push(`viewport="${J(e.viewport)}"`), `<!-- @dsCard ${t.join(` `)} -->`
}

function lr(e, t) {
    let n = /^\s*<!DOCTYPE[^>]*>/i.exec(e);
    if (n) {
        let r = n.index + n[0].length;
        return `${e.slice(0,r)}\n${t}${e.slice(r)}`
    }
    return `${t}\n${e}`
}
var Y = /\/\*[\s\S]*?\*\//g,
    ur = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function X(e, t) {
    if (ur.test(e)) return;
    let n = t.includes(`/`) ? t.slice(0, t.lastIndexOf(`/`) + 1) : ``;
    try {
        return decodeURIComponent(new URL(e, `file:///` + n).pathname.slice(1))
    } catch {
        return
    }
}
var dr = /@import\s+(?:url\(\s*(?:"([^"]+)"|'([^']+)'|([^)"'\s][^)]*?))\s*\)|"([^"]+)"|'([^']+)')([^;]*);/gi;

function fr(e, t) {
    let n = new Set,
        r = [],
        i = [];

    function a(e) {
        if (n.has(e)) return;
        n.add(e);
        let o = t(e);
        if (o === void 0) {
            i.push(e);
            return
        }
        for (let t of o.replace(Y, ``).matchAll(dr)) {
            let n = X((t[1] ? ? t[2] ? ? t[3] ? ? t[4] ? ? t[5] ? ? ``).trim(), e);
            n && a(n)
        }
        r.push(e)
    }
    return a(e), {
        closure: r,
        missing: i
    }
}
var pr = /^(?:https?:|\/\/)/i;

function mr(e) {
    let t = [];
    for (let n of e.replace(Y, ``).matchAll(dr)) {
        let e = (n[1] ? ? n[2] ? ? n[3] ? ? n[4] ? ? n[5] ? ? ``).trim();
        pr.test(e) && t.push(e)
    }
    return t
}

function hr(e) {
    try {
        return new URL(e.startsWith(`//`) ? `https:${e}` : e)
    } catch {
        return
    }
}

function gr(e) {
    let t = hr(e);
    if (!t) return;
    let n = t.searchParams.getAll(`family`);
    if (n.length === 0) return;
    let r = [];
    for (let e of n)
        for (let t of e.split(`|`)) {
            let e = t.split(`:`)[0].replace(/[-_]+/g, ` `).trim();
            e && r.push(e)
        }
    return r.length > 0 ? r : void 0
}

function _r(e) {
    let t = {
        families: [],
        unknownHosts: []
    };
    for (let n of e) {
        let e = gr(n);
        if (e) t.families.push(...e);
        else {
            let e = hr(n) ? .host || n.slice(0, 64);
            t.unknownHosts.includes(e) || t.unknownHosts.push(e)
        }
    }
    return t
}
var vr = new Set([`color`, `spacing`, `radius`, `shadow`, `font`, `other`]),
    yr = [
        [/(?:^|-)(?:shadow|elevation|elev)(?:-|$)/, `shadow`],
        [/(?:^|-)(?:radius|rounded|round|corner)(?:-|$)/, `radius`],
        [/(?:^|-)(?:font|type(?:face|set)?|text|weight|tracking|leading|line-height|letter)(?:-|$)/, `font`],
        [/(?:^|-)(?:color|colour|clr|bg|fg|fill|stroke|surface|palette|tint)s?(?:-|$)/, `color`],
        [/(?:^|-)(?:space|spacing|gap|inset|pad(?:ding)?|margin|size)(?:-|$)/, `spacing`]
    ],
    br = /^(?:transparent|currentcolor|inherit|black|white|red|green|blue|gray|grey|yellow|orange|purple|pink|brown|cyan|magenta|lime|navy|teal|silver|gold|indigo|violet|coral|salmon|crimson|rebeccapurple)$/,
    xr = e => typeof CSS < `u` && typeof CSS.supports == `function` ? CSS.supports(`color`, e) : br.test(e);

function Sr(e) {
    return /^#[0-9a-f]{3,8}$/.test(e) || /^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(/.test(e) || xr(e) ? `color` : /^-?(?:\d*\.)?\d+(?:px|rem|em|vh|vw|vmin|vmax|ch|ex|%)$/.test(e) ? `spacing` : /^(?:-?\d+(?:\.\d+)?(?:px|rem|em)?\s+){2,4}(?:#|rgb|hsl|var|okl)/.test(e) ? `shadow` : `other`
}

function Cr(e, t, n) {
    if (t && vr.has(t)) return t;
    if (n) {
        let e = n.replace(/^--/, ``).toLowerCase();
        for (let [t, n] of yr)
            if (t.test(e)) return n
    }
    return Sr(e.trim().toLowerCase())
}

function wr(e) {
    let t = (t, n) => {
            let r = (n === void 0 ? void 0 : e.get(`${t}\x00${n}`)) ? ? e.get(`${t}\x00`) ? ? e.get(t);
            if (r) return r;
            for (let n of e.values())
                if (n.name === t) return n
        },
        n = !0;
    for (; n;) {
        n = !1;
        for (let r of e.values()) {
            if (r.kind !== `other` || r.annotation === `other`) continue;
            let e = /^var\(\s*(--[A-Za-z0-9_-]+)/.exec(r.value.trim()) ? .[1],
                i = e ? t(e, r.scope) : void 0;
            i && i.kind !== `other` && (r.kind = i.kind, n = !0)
        }
    }
}

function Tr(e) {
    let t = e.replace(/^html\b/i, ``).replace(/[[\].="'#:]/g, ` `).replace(/\b(?:data|theme|bs|mode|is|has)\b/gi, ` `).replace(/[\s_-]+/g, ` `).trim();
    return t ? t.split(` `).map(e => e.charAt(0).toUpperCase() + e.slice(1)).join(` `) : e
}
var Er = /^(?::root|:host|html|body|\*)+$/i;

function Dr(e) {
    let t = 0;
    for (let n = 0; n < e.length; n++) {
        let r = e[n];
        if (r === `[` || r === `(`) t++;
        else if (r === `]` || r === `)`) t--;
        else if (t === 0 && (r === ` ` || r === `>` || r === `~` || r === `+`)) return !0
    }
    return !1
}

function Or(e) {
    if (Er.test(e)) return `global`;
    if (Dr(e) || /::|:(?!root\b|host\b)[a-z-]+/i.test(e)) return `component`;
    for (let t of e.matchAll(/\.([A-Za-z_][\w-]*)/g))
        if (/[A-Z]|__|--/.test(t[1])) return `component`;
    return `theme`
}

function kr(e) {
    let t;
    for (let n of e.split(`,`)) {
        let e = n.trim(),
            r = Or(e);
        if (r === `global`) return {
            ok: !0
        };
        r === `theme` && t === void 0 && (t = e)
    }
    return t === void 0 ? {
        ok: !1
    } : {
        ok: !0,
        scope: t
    }
}

function* Ar(e) {
    let t = 0,
        n = 0,
        r = e.length,
        i = function*(t) {
            t > n && (yield {
                kind: `chunk`,
                text: e.slice(n, t),
                rawEnd: t
            })
        };
    for (; t < r;) {
        let a = e[t];
        if (a === `/` && e[t + 1] === `*`) {
            let n = e.indexOf(`*/`, t + 2);
            t = n === -1 ? r : n + 2
        } else if (a === `"` || a === `'`) {
            for (t++; t < r && e[t] !== a;) t += e[t] === `\\` ? 2 : 1;
            t++
        } else if ((a === `u` || a === `U`) && /url\(/iy.test(e.slice(t, t + 4))) {
            t += 4;
            let n = e[t];
            if (n === `"` || n === `'`) {
                for (t++; t < r && e[t] !== n;) t += e[t] === `\\` ? 2 : 1;
                t++
            }
            for (; t < r && e[t] !== `)`;) t++;
            t++
        } else a === `{` || a === `}` || a === `;` ? (yield* i(t), yield {
            kind: a
        }, t++, n = t) : t++
    }
    yield* i(r)
}

function jr(e, t, n) {
    let r = [],
        i = new Set,
        a = e.replace(Y, e => ` `.repeat(e.length)),
        o = [],
        s = ``,
        c = 0;
    for (let l of Ar(a)) {
        if (l.kind === `chunk`) {
            s = l.text, c = l.rawEnd;
            continue
        }
        if (l.kind === `{`) {
            let e = s.trim(),
                t = o[o.length - 1];
            t && !t.ok ? o.push({
                ok: !1
            }) : /^@(?:media|layer|supports|scope|container|starting-style)\b/i.test(e) ? o.push(!1) : /^@theme\b/i.test(e) ? o.push({
                ok: !0
            }) : /^@property\s+(--[A-Za-z0-9_-]+)/i.test(e) ? o.push({
                ok: !0,
                scope: `@property`
            }) : e.startsWith(`@`) ? o.push({
                ok: !1
            }) : o.push({ ...kr(e),
                prelude: e
            }), s = ``
        } else {
            let a = o[o.length - 1],
                u = /(--[A-Za-z0-9_-]+)\s*:\s*([\s\S]*)$/.exec(s);
            if (u) {
                let o = e.indexOf(`
`, c),
                    l = Math.min(o === -1 ? e.length : o, c + 200),
                    d = /^[;\s]*\/\*+\s*@kind\s+([A-Za-z-]+)\s*\*+\//i.exec(e.slice(c, l)),
                    f = e.slice(c - s.length, c),
                    p = d ? null : /\/\*+\s*@kind\s+([A-Za-z-]+)\s*\*+\/\s*$/i.exec(f);
                p && f.slice(s.trimEnd().length, p.index).includes(`
`) && (p = null);
                let m = d ? ? p;
                if (m && a && i.add(d ? c + d[0].indexOf(`/*`) : c - s.length + p.index), a && a.ok) {
                    let e;
                    if (m) {
                        let r = m[1].toLowerCase();
                        vr.has(r) ? e = r : n && (n.unknownKindAnnotationCount++, !n.unknownKindAnnotations.some(e => e.token === u[1] && e.label === r && e.path === t) && n.unknownKindAnnotations.length < 5 && n.unknownKindAnnotations.push({
                            token: u[1],
                            label: r,
                            path: t
                        }))
                    }
                    a.scope && a.scope !== `@property` && n ? .themeScopes.add(a.scope), r.push({
                        name: u[1],
                        value: u[2].trim(),
                        kind: Cr(u[2], e, u[1]),
                        definedIn: t,
                        ...a.scope && a.scope !== `@property` ? {
                            scope: a.scope
                        } : {},
                        ...e ? {
                            annotation: e
                        } : {}
                    })
                } else if (a && !a.ok && n) {
                    n.offScopeDecls++;
                    let e = a.prelude ? ? ``;
                    e && n.offScopeSamples.length < 3 && !n.offScopeSamples.includes(e) && n.offScopeSamples.push(e)
                }
            }
            l.kind === `}` && o.pop(), s = ``
        }
    }
    if (n)
        for (let r of e.matchAll(Y)) {
            if (i.has(r.index) || !/^\/\*+\s*@kind\b/i.test(r[0]) || (n.orphanKindCommentCount++, n.orphanKindComments.length >= 5)) continue;
            let a = 1;
            for (let t = 0; t < r.index; t++) e[t] === `
` && a++;
            n.orphanKindComments.push({
                path: t,
                line: a,
                text: r[0].replace(/\s+/g, ` `).slice(0, 60)
            })
        }
    return r
}

function Mr(e, t) {
    let n = [];
    for (let r of e.replace(Y, ``).matchAll(/@font-face\s*{([^}]*)}/gi)) {
        let e = r[1],
            i = t => e.match(RegExp(`${t}\\s*:\\s*([^;}]+)`, `i`)) ? .[1] ? .trim().replace(/^['"]|['"]$/g, ``),
            a = i(`font-family`);
        if (!a) continue;
        let o = [],
            s = !1;
        for (let n of e.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi)) {
            let e = (n[1] ? ? n[2] ? ? n[3] ? ? ``).trim();
            if (ur.test(e)) {
                s = !0;
                continue
            }
            let r = X(e, t);
            r && o.push(r)
        }
        let c = i(`unicode-range`);
        n.push({
            family: a,
            weight: i(`font-weight`) ? ? `400`,
            style: i(`font-style`) ? ? `normal`,
            ...c ? {
                unicodeRange: c
            } : {},
            cssPath: t,
            files: o,
            ...s ? {
                remoteSrc: !0
            } : {}
        })
    }
    return n
}
var Nr;
async function Pr(e, t) {
    return Nr || = (await (await n(async () => {
        let {
            load: e
        } = await
        import (`./babel-standalone-cyL-SWky.js`);
        return {
            load: e
        }
    }, __vite__mapDeps([0, 1]))).load()).packages.parser, Nr.parse(e, {
        sourceType: `module`,
        plugins: t,
        errorRecovery: !0
    })
}
var Fr = e => Pr(e, [`typescript`]);

function Ir(e) {
    if (!e) return ``;
    for (let t = e.length - 1; t >= 0; t--) {
        let n = e[t];
        if (n.type === `CommentBlock` && n.value.startsWith(`*`)) return n.value.slice(1).split(`
`).map(e => e.replace(/^\s*\*\s?/, ``)).join(`
`).trim()
    }
    return ``
}

function Lr(e) {
    let t = new Map,
        n;
    for (let r of e.split(`
`)) {
        let e = /^@(\w+)\s*(.*)$/.exec(r.trim());
        if (e) {
            n = e[1];
            let r = t.get(n) ? ? [];
            r.push(e[2].trim()), t.set(n, r)
        } else if (n && r.trim()) {
            let e = t.get(n);
            e[e.length - 1] = (e[e.length - 1] + ` ` + r.trim()).trim()
        }
    }
    return t
}
var Rr = {
    section: 200,
    subtitle: 200,
    viewport: 20
};

function zr(e) {
    let t = {
        section: ``,
        subtitle: ``,
        viewport: ``
    };
    for (let n of e.matchAll(/(\w+)\s*=\s*(?:"([^"]*)"|(\S+))/g)) {
        let e = n[1];
        Object.hasOwn(t, e) && (t[e] = (n[2] ? ? n[3] ? ? ``).slice(0, Rr[e]))
    }
    return t
}

function Br(e) {
    let t = e.slice(0, 2048),
        n = t.search(/<!--\s*@startingPoint\b/);
    if (n < 0) return;
    let r = t.indexOf(`-->`, n);
    if (!(r < 0)) return zr(t.slice(n, r))
}
var Vr = {
    group: 100,
    viewport: 20,
    subtitle: 200,
    name: 100
};

function Hr(e) {
    let t = e.slice(0, 2048),
        n = t.search(/<!--\s*@dsCard\b/);
    if (n < 0) return;
    let r = t.indexOf(`-->`, n);
    if (r < 0) return;
    let i = t.slice(n, r),
        a = {};
    for (let e of i.matchAll(/(\w+)\s*=\s*(?:"([^"]*)"|(\S+))/g)) {
        let t = e[1];
        Object.hasOwn(Vr, t) && (a[t] = (e[2] ? ? e[3] ? ? ``).slice(0, Vr[t]))
    }
    if (!a.group) return;
    let o = {
        group: a.group
    };
    return a.viewport && (o.viewport = a.viewport), a.subtitle && (o.subtitle = a.subtitle), a.name && (o.name = a.name), o
}
var Ur = {
    name: 100,
    description: 200
};

function Wr(e) {
    let t = e.slice(0, 2048),
        n = t.search(/<!--\s*@template\b/);
    if (n < 0) return;
    let r = t.indexOf(`-->`, n);
    if (r < 0) return;
    let i = t.slice(n, r),
        a = {};
    for (let e of i.matchAll(/(\w+)\s*=\s*(?:"([^"]*)"|(\S+))/g)) {
        let t = e[1];
        Object.hasOwn(Ur, t) && (a[t] = (e[2] ? ? e[3] ? ? ``).slice(0, Ur[t]))
    }
    if (a.name) return {
        name: a.name,
        description: a.description ? ? ``
    }
}

function Gr(e) {
    let t = e ? .type === `TSUnionType` ? e.types : e ? .type === `TSLiteralType` ? [e] : void 0;
    if (!t) return;
    let n = [];
    for (let e of t)
        if (!(e.type === `TSUndefinedKeyword` || e.type === `TSNullKeyword`)) {
            if (e.type !== `TSLiteralType` || e.literal ? .type !== `StringLiteral`) return;
            n.push(e.literal.value)
        }
    return n.length > 0 ? n : void 0
}
async function Kr(e) {
    let t;
    try {
        t = await Fr(e)
    } catch (e) {
        return {
            error: x(e)
        }
    }
    let n, r;
    for (let e of t.program.body) {
        let t = e.type === `ExportNamedDeclaration` ? e.declaration : e;
        if (t ? .type === `TSInterfaceDeclaration`) {
            n = t, r = e.leadingComments ? ? t.leadingComments;
            break
        }
    }
    if (!n) return {
        error: `no interface declaration found`
    };
    let i = String(n.id.name).replace(/Props$/, ``),
        a = [];
    for (let t of n.body.body) {
        let n = t.type === `TSMethodSignature`;
        if (t.type !== `TSPropertySignature` && !n || t.key ? .type !== `Identifier`) continue;
        let r = n ? t : t.typeAnnotation ? .typeAnnotation,
            i = r ? .type === `TSUnionType` && r.types.some(e => e.type === `TSUndefinedKeyword`),
            o = {
                name: t.key.name,
                type: r ? .start != null && r.end != null ? e.slice(r.start, r.end) : `unknown`,
                required: !t.optional && !i
            },
            s = n ? void 0 : Gr(r);
        s && (o.literalUnion = s);
        let c = Ir(t.leadingComments);
        c && (o.jsdoc = c), a.push(o)
    }
    let o = n.body.body.some(e => e.type === `TSIndexSignature`),
        s = {
            name: i,
            props: a,
            openInterface: Array.isArray(n.extends) && n.extends.length > 0 || o
        },
        c = Ir(r);
    if (c) {
        let e = Lr(c),
            t = e.get(`replaces`) ? .flatMap(e => e.split(`,`).map(e => e.trim()).filter(Boolean));
        t ? .length && (s.replaces = t);
        let n = e.get(`startingPoint`) ? .[0];
        n !== void 0 && (s.startingPoint = zr(n))
    }
    return s
}
async function qr(e) {
    let t = m(),
        n = [],
        r = 0;
    for (;;) {
        let i = await t.listFiles({
            projectId: e,
            path: ``,
            depth: -1,
            offset: r
        });
        for (let e of i.entries) e.type === `file` && n.push({
            path: e.path,
            type: e.type,
            version: Number(e.version ? ? 0)
        });
        if (!i.truncated || i.entries.length === 0) break;
        r += i.entries.length
    }
    return n
}
var Z = `_adherence.oxlintrc.json`,
    Q = `_ds_manifest.json`,
    Jr = [Z, Q, `_ds_bundle.js`],
    Yr = {
        "readme.md": `readme`,
        "index.js": `indexJs`,
        "_version.json": `version`,
        [Z]: `adherenceConfig`,
        [Q]: `dsManifest`,
        "_ds_bundle.js": `dsBundle`
    },
    Xr = [`styles.css`, `index.css`, `global.css`, `globals.css`, `main.css`, `theme.css`, `tokens.css`];
async function Zr(e) {
    let t = (await qr(e)).filter(e => !/^_[^/]*\//.test(e.path)),
        n = {
            allFiles: t.map(e => e.path),
            versions: new Map(t.map(e => [e.path, e.version]))
        },
        r = new Map;
    for (let {
            path: e
        } of t) {
        if (e.includes(`/`)) continue;
        let t = e.toLowerCase();
        Object.hasOwn(Yr, t) ? n[Yr[t]] = e : Xr.includes(t) && r.set(t, e)
    }
    for (let e of Xr) {
        let t = r.get(e);
        if (t !== void 0) {
            n.stylesCss = t;
            break
        }
    }
    return n
}
var Qr = /\.(?:[jt]sx?|mjs|cjs)$/,
    $r = [`.tsx`, `.jsx`, `.ts`, `.js`],
    ei = /\.bundle\.(?:[jt]sx?|mjs|cjs)$/;

function ti(e) {
    return e.filter(e => {
        let t = e.slice(e.lastIndexOf(`/`) + 1);
        return Qr.test(t) && !t.endsWith(`.d.ts`) && !ei.test(t) && !t.startsWith(`_`) && t !== `support.js`
    })
}

function ni(e) {
    let t = new Map;
    for (let n of e) {
        let e = n.lastIndexOf(`/`),
            r = e >= 0 ? n.slice(0, e) : ``,
            i = t.get(r);
        i || t.set(r, i = new Set), i.add(n.slice(e + 1))
    }
    let n = [];
    for (let r of e) {
        if (!r.endsWith(`.d.ts`)) continue;
        let e = r.lastIndexOf(`/`),
            i = e >= 0 ? r.slice(0, e) : ``,
            a = r.slice(e + 1, -5);
        if (!/^[A-Z][A-Za-z0-9]*$/.test(a)) continue;
        let o = t.get(i),
            s;
        for (let e of $r)
            if (o.has(a + e)) {
                s = (i ? i + `/` : ``) + a + e;
                break
            }
        if (!s) continue;
        let c = {
                name: a,
                jsxPath: s,
                dtsPath: r
            },
            l = i ? i + `/` : ``;
        o.has(a + `.prompt.md`) && (c.promptMdPath = l + a + `.prompt.md`), n.push(c)
    }
    return n.sort((e, t) => e.name.localeCompare(t.name))
}

function ri(e) {
    return e.allFiles.some(e => e.endsWith(`.css`) || e.endsWith(`.d.ts`)) || e.dsManifest !== void 0 || e.adherenceConfig !== void 0 || e.dsBundle !== void 0
}
var ii = t({
        checkHtmlRefs: () => hi,
        extractLocalRefs: () => mi,
        formatMissingRefs: () => gi
    }),
    ai = new Set(Jr),
    oi = /<(script|link|img)\b[^>]*>/gi,
    si = /\ssrc\s*=\s*["']([^"']+)["']/i,
    ci = /\shref\s*=\s*["']([^"']+)["']/i,
    li = /\srel\s*=\s*["'][^"']*\bstylesheet\b[^"']*["']/i,
    ui = /<!--[\s\S]*?-->/g,
    di = /(<script\b[^>]*>)[\s\S]*?(<\/script>)/gi;

function fi(e) {
    return !e || e.startsWith(`#`) || e.startsWith(`/`) ? !1 : !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(e)
}

function pi(e) {
    try {
        return decodeURIComponent(e)
    } catch {
        return e
    }
}

function mi(e, t) {
    let n = e.replace(ui, ``).replace(di, `$1$2`),
        r = new Set;
    for (let e of n.matchAll(oi)) {
        let n = e[0],
            i = e[1].toLowerCase() === `link`;
        if (i && !li.test(n)) continue;
        let a = n.match(i ? ci : si) ? .[1];
        if (!a || !fi(a) || a.includes(`{{`)) continue;
        let o = pi(K(a, t));
        o && r.add(o)
    }
    return [...r]
}
async function hi(e, t, n, r) {
    let i = m(),
        a;
    try {
        let r = await i.getFile({
            projectId: e,
            path: t,
            raw: !0
        }, {
            signal: n
        });
        a = new TextDecoder().decode(r.content)
    } catch {
        return {
            missing: [],
            checked: 0,
            probeFailed: !0
        }
    }
    let o = mi(a, t);
    if (o.length === 0) return {
        missing: [],
        checked: 0
    };
    let s = new Set;
    try {
        let t = 0;
        for (;;) {
            let r = await i.listFiles({
                projectId: e,
                path: ``,
                depth: 100,
                offset: t
            }, {
                signal: n
            });
            for (let e of r.entries) e.type === `file` && s.add(e.path);
            if (!r.truncated || r.entries.length === 0) break;
            t += r.entries.length
        }
    } catch {
        return {
            missing: [],
            checked: 0,
            probeFailed: !0
        }
    }
    let c = r.isDsProject;
    return {
        missing: o.filter(e => !s.has(e) && !(c && ai.has(e))),
        checked: o.length
    }
}

function gi(e) {
    let t = e.map(e => `  - ${e}`).join(`
`);
    return `WARNING: ${e.length} referenced file(s) not found in project:\n${t}\nThese will 404 at runtime. Write them (or fix the src= path) before proceeding.`
}

function _i(e) {
    return /[[(<]\s*deprecated\s*[\])>]/i.test(e)
}

function vi(e) {
    let t = e.componentSets.filter(e => !_i(e.name)).length,
        n = e.standaloneComponents.filter(e => !_i(e)).length;
    return t + Math.max(0, n - e.liveIconLikeCount)
}

function $(e) {
    return e.toLowerCase().replace(/[^a-z0-9]/g, ``)
}

function yi(e) {
    return e.replace(/([a-z0-9])([A-Z])/g, `$1 $2`).replace(/([A-Z]+)([A-Z][a-z])/g, `$1 $2`).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
}

function bi(e, t) {
    let n = $(t);
    if (n === `` || $(e) === n) return !0;
    let r = yi(e),
        i = yi(t);
    return i.length === 0 || i.length >= r.length ? !1 : i.every((e, t) => r[t] === e) || i.every((e, t) => r[r.length - i.length + t] === e)
}

function xi(e) {
    return e.reduce((e, t) => e + t.variables, 0)
}
var Si = 50;

function Ci(e, t) {
    return t < Si || e >= t / 5 ? null : `The attached Figma kit's variable collections define ${t} variables; the design system registers ${e} ${e===1?`token`:`tokens`}. Port the remaining collections into styles.css custom properties or, if any are intentionally skipped, say which and why.`
}
var wi = .9;

function Ti(e, t) {
    return t <= 0 || e / t >= wi ? null : `The attached Figma kit defines ${t} component ${t===1?`family`:`families`}; the design system implements ${e}. Build the remaining families or, if any are intentionally skipped, say which and why.`
}
export {
    _n as $, fe as $t, or as A, gt as At, En as B, ze as Bt, q as C, yt as Ct, Kr as D, ht as Dt, sr as E, mt as Et, Tr as F, Ye as Ft, Fn as G, De as Gt, Tn as H, Ve as Ht, Zr as I, A as It, Nn as J, ke as Jt, On as K, Ce as Kt, fr as L, qe as Lt, X as M, $e as Mt, wr as N, j as Nt, Br as O, ut as Ot, cr as P, Ze as Pt, hn as Q, de as Qt, Hn as R, Re as Rt, ri as S, wt as St, ar as T, _t as Tt, jn as U, Be as Ut, wn as V, He as Vt, In as W, Ee as Wt, Ln as X, ge as Xt, kn as Y, _e as Yt, G as Z, T as Zt, Mr as _, U as _t, _i as a, oe as an, Ut as at, rr as b, I as bt, hi as c, ae as cn, B as ct, Z as d, v as dn, Bt as dt, C as en, mn as et, Q as f, y as fn, Ht as ft, $n as g, Ot as gt, ni as h, _ as hn, R as ht, Ci as i, ie as in , Jt as it, _r as j, tt as jt, Wr as k, P as kt, gi as l, x as ln, Et as lt, ir as m, ee as mn, Dt as mt, vi as n, re as nn, Yt as nt, $ as o, S as on, Qt as ot, ti as p, b as pn, Tt as pt, Mn as q, Te as qt, Ti as r, ne as rn, $t as rt, xi as s, se as sn, Zt as st, bi as t, w as tn, Wt as tt, ii as u, te as un, Vt as ut, mr as v, At as vt, Hr as w, F as wt, lr as x, Ct as xt, jr as y, H as yt, xn as z, Le as zt
};
import {
    o as e
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    h as t
} from "./client-lite-BraEm36W.js";
import {
    t as n
} from "./react-BthIFXYf.js";
import {
    Ft as r,
    Ht as i,
    Lt as a,
    Rt as o,
    Ut as s,
    Vt as c,
    Wt as l,
    Yt as u,
    Zt as d,
    at as f,
    tt as p,
    zt as m
} from "./fig-kit-coverage-DSUEqVg0.js";
import {
    Q as h,
    Yt as g
} from "./index-DxZs6uan.js";
import {
    T as _,
    c as v,
    t as y
} from "./client-BkAIwXnN.js";
import {
    Jn as b,
    Xn as ee,
    Yn as x,
    qn as S
} from "./connectrpc-BRKh2K0Y.js";
import {
    t as C
} from "./platform-BciTLfG8.js";
import {
    M as te
} from "./home-analytics-CvEfi_eq.js";
import {
    t as w
} from "./viewer-handle-Dsr1w91D.js";
var T = e(n(), 1);

function E(e, t) {
    let n = t.map(e => e === void 0 ? `undefined` : JSON.stringify(e)).join(`,`),
        r = JSON.stringify(e);
    return `window.__om ? (${r} in window.__om ? window.__om[${r}](${n}) : undefined) : undefined`
}
async function D(e, t, ...n) {
    try {
        return await e.executeJavaScript(E(String(t), n))
    } catch {
        return null
    }
}

function O(e, t, ...n) {
    e.executeJavaScriptUnchecked(E(String(t), n))
}

function ne(e, t) {
    let n = 0,
        r = e;
    for (let e = 0; e < r.length; e++) n = (n << 5) - n + r.charCodeAt(e) | 0;
    return `${Math.abs(n).toString(36)}-${t}`
}

function re(e, t, n, r) {
    e && (!r && !n || t(e.id, n, r))
}

function ie(e, t, n, r) {
    _(`autosend-attachments`, {
        label: e,
        attachments: t,
        kind: n,
        via: r ? .via,
        queueOnly: r ? .queueOnly
    })
}

function k(e) {
    return !(!e || e.includes(`..`) || e.startsWith(`/`) || /^[a-z]+:\/\//i.test(e))
}
async function A(e) {
    await D(e, `isBabelPage`) && (await D(e, `cacheBabelSources`), await D(e, `ensureJSXSource`))
}
async function j(e) {
    if (!await D(e, `isBabelPage`)) return null;
    await D(e, `cacheBabelSources`);
    let t = await D(e, `listBabelScripts`);
    return t ? t.map(e => ({
        idx: e.idx,
        src: e.src
    })) : []
}

function M(e) {
    if (e == null) return null;
    if (k(e)) return e;
    let t = e.match(/\/projects\/[0-9a-f-]+\/serve\/(.+)$/i);
    return t && k(t[1]) ? t[1] : `unresolvable`
}

function ae(e, t) {
    if (!t) return -1;
    for (let n of e) {
        let e = n.src;
        if (e && (t === e || t.slice(-e.length - 1) === `/` + e || e.slice(-t.length - 1) === `/` + t)) return n.idx
    }
    return -1
}
async function oe(e, t, n, r, i, a, o, s, c) {
    if (o === `text` && f(s.original, s.newText)) return C.trackEvent(`edit_blank_skipped`, {
        route: `library-jsx`
    }), c(p, `warning`), {
        written: !1,
        deferred: null,
        reason: null
    };
    let l = await D(e, `getJSXLoc`, i);
    if (!l) return c(`Can't save this edit — element isn't from project source.`), {
        written: !1,
        deferred: null,
        reason: null
    };
    if (l.scriptIdx < 0 || l.scriptIdx >= r.length) return c(`Can't save this edit — couldn't locate the source script.`), {
        written: !1,
        deferred: null,
        reason: null
    };
    let u = e => {
            let t = r[e],
                i = M(t.src);
            return i === `unresolvable` ? `unresolvable` : {
                ws: i,
                targetFile: i ? ? n
            }
        },
        d = (e, t, n) => {
            let r = e.tag ? `<${e.tag}>` : `component call-site`;
            return n ? `${t} (near line ${e.line}, ${r})` : `the inline babel script in ${t} (near script line ${e.line}, ${r})`
        },
        m = u(l.scriptIdx);
    if (m === `unresolvable`) return c(`Can't save this edit — couldn't locate the source script.`), {
        written: !1,
        deferred: null,
        reason: `jsx-stale-loc`
    };
    let h = d(l, m.targetFile, !!m.ws),
        g = o,
        _ = null;
    if ((o === `delete` || o === `attr`) && (await D(e, `countFibersAtLoc`, l.line, l.col, l.fileName) ? ? 0) > 1) {
        let t = await D(e, `findUniqueCallSite`, i, l.line, l.col, l.fileName, o === `delete` ? 8 : 1),
            n = t && (t.fileName ? ? ``) === (l.fileName ? ? ``) ? l.scriptIdx : t ? ae(r, t.fileName) : -1;
        if (o === `attr`)
            if (t && n >= 0) l = { ...l,
                scriptIdx: n,
                fileName: t.fileName,
                line: t.line,
                col: t.col,
                tag: t.tag
            };
            else return {
                written: !1,
                deferred: null,
                reason: `jsx-fiber-multi`
            };
        else if (t && n >= 0) _ = {
            csFile: t.fileName,
            csLine: t.line,
            csCol: t.col,
            token: `${l.fileName??``}:${l.line}:${l.col}`
        }, l = { ...l,
            scriptIdx: n,
            fileName: t.fileName,
            line: t.line,
            col: t.col,
            tag: t.tag
        }, g = `attr`;
        else return {
            written: !1,
            climb: !0,
            deferred: null,
            reason: `jsx-fiber-multi`
        };
        if (m = u(l.scriptIdx), m === `unresolvable`) return c(`Can't save this edit — couldn't locate the source script.`), {
            written: !1,
            deferred: null,
            reason: `jsx-stale-loc`
        };
        h = d(l, m.targetFile, !!m.ws)
    }
    let {
        ws: v
    } = m, y = await D(e, `patchJSXSource`, l.scriptIdx, l.line, l.col, l.tag, g, JSON.stringify(_ ? {
        name: `data-om-hide`,
        value: _.token
    } : {
        cssText: s.cssText,
        newText: s.newText,
        original: s.original,
        name: s.name,
        value: s.value
    })) ? ? {
        ok: !1,
        reason: `parse_error`
    }, b = e => {
        let t = s.cssText ? ? ``;
        return !e || e.length === 0 ? `set the inline style to \`${t}\`` : `set ${e.join(`, `)} to match \`${t}\` (current source value is a dynamic expression)`
    };
    if (y.ok) {
        let e = v ? `${t}/${v}` : `${t}/${n}`,
            r = v ? y.newSource : await se(e, l.scriptIdx, y.newSource);
        if (g === `attr`) {
            if (y.codeOrig != null) {
                let t = await ce(e, l.scriptIdx, !!v);
                if (t != null && t.trim() !== y.codeOrig.trim()) return _ ? {
                    written: !1,
                    climb: !0,
                    deferred: null,
                    reason: `jsx-fiber-multi`
                } : {
                    written: !1,
                    deferred: null,
                    reason: `jsx-disk-diverged`
                }
            }
            return {
                written: !0,
                writePath: e,
                newContent: r,
                deferred: null,
                reason: null,
                existingAttrValue: y.deferred[0],
                scriptIdx: l.scriptIdx,
                patchedSource: y.newSource,
                ..._ ? {
                    hide: _
                } : {}
            }
        }
        let i = y.deferred.length > 0 ? `In ${h}: ${b(y.deferred)}.` : null;
        return {
            written: !0,
            writePath: e,
            newContent: r,
            deferred: i,
            reason: i ? `jsx-dynamic-style-partial` : null
        }
    }
    if (g === `attr`) return _ ? {
        written: !1,
        climb: !0,
        deferred: null,
        reason: `jsx-fiber-multi`
    } : {
        written: !1,
        deferred: null,
        reason: null
    };
    if (y.reason === `dynamic_text` || y.reason === `dynamic_style` || y.reason === `stale_loc`) {
        let e = o === `text` ? `change the text from ${JSON.stringify(s.original??``)} to ${JSON.stringify(s.newText??``)}` : o === `delete` ? `delete the element described below` : b(y.deferred),
            t = y.reason === `dynamic_text` ? `jsx-dynamic-text` : y.reason === `dynamic_style` ? `jsx-dynamic-style` : `jsx-stale-loc`;
        return {
            written: !1,
            deferred: `In ${h}: ${e}.\n${a}`,
            reason: t
        }
    }
    return c(`Can't save this edit — element isn't from project source.`), {
        written: !1,
        deferred: null,
        reason: null
    }
}
var N = /(<script\b[^>]*type=["'](?:text\/babel|text\/jsx)["'][^>]*>)([\s\S]*?)(<\/script>)/gi;
async function se(e, t, n) {
    let r = await C.readFile(e),
        i = -1;
    return r.replace(N, (e, r, a, o) => (i++, i !== t || /\bsrc\s*=/.test(r) ? e : r + `
` + n + `
` + o))
}
async function ce(e, t, n) {
    try {
        let r = await C.readFile(e);
        if (n) return r;
        let i = 0;
        for (let e of r.matchAll(N))
            if (i++ === t) return e[2] ? ? null;
        return null
    } catch {
        return null
    }
}

function P(e) {
    let t = new TextEncoder().encode(e),
        n = 5381;
    for (let e = 0; e < t.length; e++) n = (n << 5) + n + t[e] >>> 0;
    return n.toString(16).padStart(8, `0`)
}
var F = `__om-edit-overrides`,
    I = 2048,
    L = 6160;

function R(e, t) {
    return e.length === 0 || e.length > L || !/^[\w.%!~*()'-]+$/.test(e) || t.length === 0 || t.length > I || t !== t.trim() || /[\x00-\x1f\x7f<>"`\\]/.test(t) ? !1 : /^https:\/\//i.test(t) ? !0 : !/^[a-z][a-z0-9+.-]*:/i.test(t) && !t.startsWith(`/`)
}
var z = class e {
    filePath;
    io;
    srcmap;
    bytes;
    ops = [];
    chain = Promise.resolve();
    pendingOwnWrites = 0;
    stale = !1;
    _staleReason = null;
    _lastRecovery = null;
    _iframeStale = !1;
    _lastWriteRawGen = null;
    markStale(e) {
        this.stale = !0, this._staleReason ? ? = e
    }
    markFresh() {
        this.stale = !1, this._staleReason = null, this._lastWriteRawGen = null
    }
    constructor(e, t, n, r) {
        this.filePath = e, this.io = t, this.srcmap = n, this.bytes = r
    }
    static async open(t, n, r) {
        let i = await n.readFile(t).catch(() => ``),
            a = new e(t, n, r, new TextEncoder().encode(i));
        if (!a.rebaseline(i)) {
            let e = !!r.gen && (r.entries.size > 0 || r.literals.length > 0);
            a.markStale(e ? `born-stale-offsets` : `born-stale-no-table`)
        }
        return i && r.gen && P(i) !== r.gen && (a._iframeStale = !0), a
    }
    rebaseline(e) {
        let t = this.srcmap.entries.size > 0 || this.srcmap.literals.length > 0;
        if (!this.srcmap.gen || !t || !e) return !1;
        let n = new TextEncoder().encode(e),
            r = P(e);
        return r !== this.srcmap.gen && (this.srcmap.entries.size === 0 || !B(n, this.srcmap.entries)) ? !1 : (this.bytes = n, this.srcmap = { ...this.srcmap,
            gen: r
        }, !0)
    }
    async refresh() {
        let e = this.srcmap.entries.size > 0 || this.srcmap.literals.length > 0;
        if (!this.srcmap.gen || !e) return;
        let t = this.chain.then(async () => {
            let e = this.stale,
                t = await this.io.readFile(this.filePath).catch(() => ``);
            if (t && P(t) !== (this._lastWriteRawGen ? ? this.srcmap.gen) && (this._iframeStale = !0), this.ops = [], this.rebaseline(t)) {
                this.markFresh(), e && (this._lastRecovery = `rebaseline`);
                return
            }
            if (this.io.fetchSrcMap && this.srcmap.entries.size > 0) {
                let e = await this.io.fetchSrcMap(this.filePath).catch(() => null);
                if (e && this.reindex(e, t)) {
                    this.markFresh(), this._lastRecovery = `reindex`;
                    return
                }
            }
            this.markStale(`refresh-fail`)
        });
        return this.chain = t.catch(() => {}), t
    }
    reindex(e, t) {
        let n = this.srcmap.entries,
            r = [...n.values()].sort((e, t) => e.openStart - t.openStart),
            i = [...e.entries.values()].sort((e, t) => e.openStart - t.openStart);
        if (r.length === 0 || r.length !== i.length) return !1;
        let a = new TextEncoder().encode(t);
        if (e.gen !== P(t) || !B(a, e.entries) || !B(this.bytes, n)) return !1;
        let o = i[0].openStart - r[0].openStart;
        for (let e = 0; e < r.length; e++)
            if (r[e].tag !== i[e].tag || i[e].openStart !== r[e].openStart + o || i[e].openEnd !== r[e].openEnd + o) return !1;
        let s = r[0].openStart,
            c = r.reduce((e, t) => Math.max(e, t.closeEnd ? ? t.openEnd), 0),
            l = new TextDecoder;
        if (l.decode(this.bytes.subarray(s, c)) !== l.decode(a.subarray(s + o, c + o))) return !1;
        let u = new Map;
        for (let e = 0; e < r.length; e++) {
            let t = r[e],
                n = i[e];
            u.set(t.id, { ...t,
                openStart: n.openStart,
                attrEnd: n.attrEnd,
                openEnd: n.openEnd,
                closeStart: n.closeStart,
                closeEnd: n.closeEnd,
                styleAttr: n.styleAttr,
                textRuns: n.textRuns
            })
        }
        return this.bytes = a, this.srcmap = {
            gen: e.gen,
            entries: u,
            literals: e.literals
        }, !0
    }
    get gen() {
        return this.srcmap.gen
    }
    get isStale() {
        return this.stale
    }
    get staleReason() {
        return this._staleReason
    }
    get iframeLagsDisk() {
        return this._iframeStale
    }
    takeLastRecovery() {
        let e = this._lastRecovery;
        return this._lastRecovery = null, e
    }
    get pendingCount() {
        return this.ops.length
    }
    canApply(e) {
        if (this.stale) return `ledger-stale`;
        switch (e.kind) {
            case `insert`:
            case `duplicate`:
            case `group`:
                return `not-implemented`;
            case `css-rule`:
                return null;
            case `head-link`:
                return R(e.id, e.href) ? null : `head-link-unsafe`;
            case `text-literal`:
                {
                    if (e.before.length < 3 || le(e.before)) return `no-src-loc`;
                    let t = q(this.bytes, this.srcmap.literals, e.before);
                    return t.length === 1 ? K(this.bytes, t[0]) === null ? `srcmap-offset-invalid` : null : `no-src-loc`
                }
            case `move`:
                {
                    if (this.ops.length > 0) return `not-implemented`;
                    let t = this.srcmap.entries.get(e.omId),
                        n = this.srcmap.entries.get(e.targetParentId);
                    if (!t || !n) return `non-canonical`;
                    if (t.closeEnd == null || n.closeEnd == null) return `implied-close-nonempty`;
                    if (t.closeEnd <= t.openStart || n.closeEnd <= n.openStart) return `srcmap-offset-invalid`;
                    if (e.sameParent && t.parentId !== e.targetParentId) return `move-dom-parent-mismatch`;
                    if (e.index < 0 || e.index > n.childIds.length) return `move-index-oob`;
                    for (let t = e.targetParentId; t;) {
                        if (t === e.omId) return `move-cycle`;
                        t = this.srcmap.entries.get(t) ? .parentId ? ? null
                    }
                    let r = n.childIds.filter(t => t !== e.omId);
                    return r.length > 0 && e.index >= r.length && this.srcmap.entries.get(r[r.length - 1]) ? .closeEnd == null ? `implied-close-nonempty` : null
                }
        }
        let t = this.srcmap.entries.get(e.omId);
        if (!t) return `non-canonical`;
        if (e.kind === `delete` && t.closeEnd == null) return `implied-close-nonempty`;
        if (e.kind === `attr` && !/^[a-zA-Z_:][\w:.-]*$/.test(e.name)) return `srcmap-offset-invalid`;
        if (e.kind === `text`) {
            let n = new TextDecoder;
            if (!t.textRuns.some(([t, r]) => {
                    let i = n.decode(this.bytes.subarray(t, r));
                    return i === e.before || i.replace(/&amp;/g, `&`).replace(/&lt;/g, `<`).replace(/&gt;/g, `>`) === e.before
                }) && t.closeStart == null) return `srcmap-offset-invalid`
        }
        return null
    }
    apply(e) {
        this.stale || this.canApply(e) !== null || this.ops.push(e)
    }
    reconcile() {
        let e = this.chain.then(() => this.doReconcile());
        return this.chain = e.catch(() => {}), e
    }
    async doReconcile() {
        if (this.ops.length === 0) return this.stale ? `stale` : `noop`;
        let e = this.io.readFileWithVersion ? await this.io.readFileWithVersion(this.filePath).catch(() => ({
                content: ``
            })) : {
                content: await this.io.readFile(this.filePath).catch(() => ``)
            },
            t = e.content;
        if (t && P(t) !== this.srcmap.gen && (this._iframeStale = !0), !this.rebaseline(t)) return this.markStale(`reconcile-race`), `stale`;
        this.markFresh();
        let n = V(this.ops),
            r = n.filter(e => e.kind === `css-rule`),
            i = n.filter(e => e.kind === `head-link`),
            a = n.filter(e => e.kind !== `css-rule` && e.kind !== `head-link`).map(e => H(this.bytes, this.srcmap, e, this._iframeStale));
        if (r.length > 0 && a.push(fe(this.bytes, r)), i.length > 0 && a.push(pe(this.bytes, this.srcmap, i)), a.some(e => e === null)) return this._iframeStale ? this.ops = [] : this.markStale(`plan-fail`), `stale`;
        let o = a.flatMap(e => Array.isArray(e) ? e : e === null ? [] : [e]);
        if (o.length === 0) return this.ops = [], `ok`;
        let s = W(this.bytes, o),
            c = new TextDecoder().decode(s);
        e.version !== void 0 && !e.isBase64 && this.io.onAdopted ? .(this.filePath, e.version, t), this.pendingOwnWrites++;
        try {
            await this.io.writeFile(this.filePath, c)
        } catch (e) {
            throw this.pendingOwnWrites--, e
        }
        return this.bytes = s, this.srcmap = {
            gen: P(c),
            entries: G(this.srcmap.entries, o),
            literals: J(this.srcmap.literals, o)
        }, this.ops = [], `ok`
    }
    writeRaw(e, t) {
        let n = this.chain.then(async () => {
            let n = e === this.filePath;
            n && this.pendingOwnWrites++;
            try {
                await this.io.writeFile(e, t)
            } catch (e) {
                throw n && this.pendingOwnWrites--, e
            }
            n && (this.ops = [], this.rebaseline(t) ? this.markFresh() : (this.markStale(`writeraw-moved`), this._lastWriteRawGen = P(t)))
        });
        return this.chain = n.catch(() => {}), n
    }
    onExternalWrite(e) {
        if (this.pendingOwnWrites > 0) return this.pendingOwnWrites--, !1;
        if (this._iframeStale = !0, !e || e.length === 0) return this.markStale(`external-write`), !0;
        let t = this.srcmap.gen,
            n = this.chain.then(() => {
                if (this.srcmap.gen === t) {
                    if (this.rebase(e)) {
                        this._lastRecovery = `rebase`;
                        return
                    }
                    this.markStale(`external-write`)
                }
            });
        return this.chain = n.catch(() => {}), !0
    }
    settle() {
        return this.chain.then(() => {})
    }
    rebase(e) {
        if (this.stale || e.length === 0 || !this.srcmap.gen) return !1;
        let t = new TextEncoder,
            n = this.bytes,
            r = this.srcmap.entries,
            i = this.srcmap.literals;
        for (let a of e) {
            let e = t.encode(a.old_string);
            if (e.length === 0) return !1;
            let o = U(n, e);
            if (o < 0 || U(n, e, o + 1) >= 0) return !1;
            let s = t.encode(a.new_string),
                c = 0,
                l = Math.min(e.length, s.length);
            for (; c < l && e[c] === s[c];) c++;
            let u = 0;
            for (; u < l - c && e[e.length - 1 - u] === s[s.length - 1 - u];) u++;
            let d = o + c,
                f = o + e.length - u,
                p = {
                    from: d,
                    to: f,
                    ins: s.subarray(c, s.length - u)
                };
            if (p.ins.includes(60)) return !1;
            let m = (e, t) => f > d ? d < t && f > e : d > e && d < t;
            for (let e of r.values())
                if (!(f > d && e.openStart >= d && e.openStart < f) && (m(e.openStart, e.openEnd) || e.closeStart != null && e.closeEnd != null && m(e.closeStart, e.closeEnd))) return !1;
            n = W(n, [p]), r = G(r, [p]), i = J(i, [p])
        }
        return B(n, r) ? (this.bytes = n, this.srcmap = { ...this.srcmap,
            gen: P(new TextDecoder().decode(n)),
            entries: r,
            literals: i
        }, !0) : !1
    }
};

function B(e, t) {
    let n = e => e >= 65 && e <= 90 ? e | 32 : e;
    for (let r of t.values()) {
        if (r.openEnd <= r.openStart || r.openEnd > e.length || e[r.openStart] !== 60 || e[r.openEnd - 1] !== 62) return !1;
        for (let t = 0; t < r.tag.length; t++)
            if (n(e[r.openStart + 1 + t]) !== n(r.tag.charCodeAt(t))) return !1;
        let t = e[r.openStart + 1 + r.tag.length];
        if (t !== 62 && t !== 32 && t !== 47 && !(t >= 9 && t <= 13)) return !1;
        if (r.closeEnd != null && r.closeEnd !== r.openEnd) {
            let t = r.closeEnd - r.tag.length - 3;
            if (t < r.openEnd || r.closeEnd > e.length || e[t] !== 60 || e[t + 1] !== 47 || e[r.closeEnd - 1] !== 62) return !1;
            for (let i = 0; i < r.tag.length; i++)
                if (n(e[t + 2 + i]) !== n(r.tag.charCodeAt(i))) return !1
        }
    }
    return !0
}

function V(e) {
    let t = new Map,
        n = [];
    for (let r of e) {
        let e = r.kind === `attr` ? `attr:${r.omId}:${r.name}` : r.kind === `css-rule` ? `css-rule:${r.selector}` : r.kind === `head-link` ? `head-link:${r.id}` : r.kind === `text-literal` ? `text-literal:${r.before}` : `omId` in r ? `${r.kind}:${r.omId}` : `${r.kind}:${JSON.stringify(r)}`,
            i = t.get(e);
        i == null ? (t.set(e, n.length), n.push(r)) : n[i] = r
    }
    return n
}

function H(e, t, n, r = !1) {
    let {
        entries: i
    } = t, a = new TextEncoder, o = new TextDecoder;
    switch (n.kind) {
        case `text-literal`:
            {
                let r = q(e, t.literals, n.before);
                if (r.length !== 1) return null;
                let [i, o] = r[0],
                s = K(e, r[0]);
                return s === null ? null : {
                    from: i,
                    to: o,
                    ins: a.encode(de(n.after, s))
                }
            }
        case `style`:
            {
                let t = i.get(n.omId);
                if (!t || t.openEnd > e.length || e[t.openEnd - 1] !== 62) return null;
                let r = Q(t.styleAttr ? o.decode(e.subarray(t.styleAttr[0], t.styleAttr[1])).replace(/&quot;/g, `"`).replace(/&#39;/g, `'`).replace(/&amp;/g, `&`) : ``);
                for (let [e, t] of Q(n.cssText)) r.set(e, t);
                let s = Array.from(r, ([e, t]) => `${e}: ${t}`).join(`; `).replace(/"/g, `&quot;`).replace(/'/g, `&#39;`),
                    c = a.encode(s);
                if (t.styleAttr) {
                    let r = t.styleAttr[0] > 0 ? e[t.styleAttr[0] - 1] : 0;
                    if (r !== 34 && r !== 39) {
                        let e = new Uint8Array(c.length + 2);
                        return e[0] = 34, e.set(c, 1), e[e.length - 1] = 34, {
                            from: t.styleAttr[0],
                            to: t.styleAttr[1],
                            ins: e,
                            setStyleAttr: {
                                omId: n.omId,
                                rel: [1, 1 + c.length]
                            }
                        }
                    }
                    return {
                        from: t.styleAttr[0],
                        to: t.styleAttr[1],
                        ins: c,
                        setStyleAttr: {
                            omId: n.omId,
                            rel: [0, c.length]
                        }
                    }
                }
                let l = a.encode(` style="`),
                    u = new Uint8Array(l.length + c.length + 1);
                return u.set(l),
                u.set(c, l.length),
                u[u.length - 1] = 34,
                {
                    from: t.attrEnd,
                    to: t.attrEnd,
                    ins: u,
                    setStyleAttr: {
                        omId: n.omId,
                        rel: [l.length, l.length + c.length]
                    }
                }
            }
        case `text`:
            {
                let t = i.get(n.omId);
                if (!t) return null;
                let s = n.after.replace(/&/g, `&amp;`).replace(/</g, `&lt;`).replace(/>/g, `&gt;`),
                    c = t.textRuns.find(([t, r]) => {
                        let i = o.decode(e.subarray(t, r));
                        return i === n.before || i.replace(/&amp;/g, `&`).replace(/&lt;/g, `<`).replace(/&gt;/g, `>`) === n.before
                    });
                return c ? {
                    from: c[0],
                    to: c[1],
                    ins: a.encode(s)
                } : t.closeStart == null || r ? null : {
                    from: t.openEnd,
                    to: t.closeStart,
                    ins: a.encode(s)
                }
            }
        case `attr`:
            {
                let t = i.get(n.omId);
                if (!t || t.openEnd > e.length || e[t.openEnd - 1] !== 62) return null;
                let r = n.value.replace(/&/g, `&amp;`).replace(/"/g, `&quot;`);
                return {
                    from: t.attrEnd,
                    to: t.attrEnd,
                    ins: a.encode(` ${n.name}="${r}"`)
                }
            }
        case `delete`:
            {
                let e = i.get(n.omId);
                return !e || e.closeEnd == null ? null : {
                    from: e.openStart,
                    to: e.closeEnd,
                    ins: new Uint8Array
                }
            }
        case `move`:
            {
                let t = i.get(n.omId),
                    r = i.get(n.targetParentId);
                if (!t || t.closeEnd == null || !r || r.closeEnd == null) return null;
                let a = e => e === 32 || e === 9 || e === 10 || e === 13,
                    o = t => {
                        let n = t;
                        for (; n > 0 && a(e[n - 1]);) n--;
                        return n
                    },
                    s = o(t.openStart),
                    c = t.closeEnd,
                    l = r.childIds.filter(e => e !== n.omId),
                    u = l[n.index] ? ? null,
                    d;
                if (u) {
                    let e = i.get(u);
                    if (!e) return null;
                    d = o(e.openStart)
                } else d = (l.length ? i.get(l[l.length - 1]) : null) ? .closeEnd ? ? r.openEnd;
                if (d >= s && d <= c) return [];
                let f = e.slice(s, c),
                    p = {
                        omId: n.omId,
                        cutFrom: s,
                        cutTo: c,
                        newParentId: n.targetParentId,
                        newIndex: n.index
                    };
                return [{
                    from: s,
                    to: c,
                    ins: new Uint8Array,
                    move: p
                }, {
                    from: d,
                    to: d,
                    ins: f,
                    move: p
                }]
            }
        default:
            return null
    }
}

function U(e, t, n = 0) {
    if (t.length === 0) return n;
    outer: for (let r = n; r + t.length <= e.length; r++) {
        for (let n = 0; n < t.length; n++)
            if (e[r + n] !== t[n]) continue outer;
        return r
    }
    return -1
}

function W(e, t) {
    let n = [...t].sort((e, t) => t.from - e.from),
        r = e;
    for (let e of n) {
        let t = new Uint8Array(r.length - (e.to - e.from) + e.ins.length);
        t.set(r.subarray(0, e.from)), t.set(e.ins, e.from), t.set(r.subarray(e.to), e.from + e.ins.length), r = t
    }
    return r
}

function G(e, t) {
    let n = [...t].sort((e, t) => e.from - t.from),
        r = e => {
            let t = 0;
            for (let r of n) {
                if (e < r.from || e === r.from && r.to > r.from) break;
                if (e < r.to) return r.from + t;
                t += r.ins.length - (r.to - r.from)
            }
            return e + t
        },
        i = e => {
            let t = 0;
            for (let r of n) {
                if (e <= r.from) break;
                if (e < r.to) return r.from + t;
                t += r.ins.length - (r.to - r.from)
            }
            return e + t
        },
        a = [];
    for (let e of n) e.to > e.from && !e.move && a.push([e.from, e.to]);
    let o = e => a.some(([t, n]) => e >= t && e < n),
        s = new Set;
    if (a.length)
        for (let [t, n] of e) o(n.openStart) && s.add(t);
    let c = n.find(e => e.move && e.from === e.to),
        l = c ? .move,
        u = c ? i(c.from) : 0,
        d = e => l ? e >= l.cutFrom && e < l.cutTo : !1,
        f = e => u + (e - (l ? .cutFrom ? ? 0)),
        p = new Map;
    for (let [t, n] of e) {
        if (o(n.openStart)) continue;
        let e = d(n.openStart),
            a = e ? f : r,
            c = e ? f : i,
            l = { ...n,
                openStart: a(n.openStart),
                attrEnd: c(n.attrEnd),
                openEnd: c(n.openEnd),
                closeStart: n.closeStart == null ? void 0 : a(n.closeStart),
                closeEnd: n.closeEnd == null ? void 0 : c(n.closeEnd),
                styleAttr: n.styleAttr ? [a(n.styleAttr[0]), c(n.styleAttr[1])] : void 0,
                textRuns: n.textRuns.map(([e, t]) => [a(e), c(t)]),
                childIds: s.size ? n.childIds.filter(e => !s.has(e)) : n.childIds
            };
        p.set(t, l)
    }
    if (c ? .move) {
        let {
            omId: e,
            newParentId: t,
            newIndex: n
        } = c.move, r = p.get(e), i = r ? .parentId ? p.get(r.parentId) : void 0, a = p.get(t);
        if (r && a) {
            i && (i.childIds = i.childIds.filter(t => t !== e));
            let o = a.childIds.filter(t => t !== e);
            o.splice(n, 0, e), a.childIds = o, r.parentId = t
        }
    }
    for (let e of n) {
        if (!e.setStyleAttr) continue;
        let t = p.get(e.setStyleAttr.omId);
        if (!t) continue;
        let n = i(e.from);
        t.styleAttr = [n + e.setStyleAttr.rel[0], n + e.setStyleAttr.rel[1]]
    }
    for (let e of n) {
        if (!e.addEntries) continue;
        let t = i(e.from);
        for (let n of e.addEntries) p.set(n.id, {
            id: n.id,
            tag: n.tag,
            openStart: t + n.openStart,
            attrEnd: t + n.attrEnd,
            openEnd: t + n.openEnd,
            closeEnd: t + n.openEnd,
            textRuns: [],
            parentId: null,
            childIds: []
        })
    }
    return p
}

function K(e, [t, n]) {
    if (t <= 0 || n > e.length) return null;
    let r = e[t - 1],
        i = n < e.length ? e[n] : 0;
    return r === 39 || r === 34 ? i === r ? r : null : (r === 96 || r === 125) && (i === 96 || i === 36 && n + 1 < e.length && e[n + 1] === 123) ? 96 : null
}

function le(e) {
    return !!(!/\p{L}/u.test(e) || /^[#./@]|^https?:|^data:/.test(e) || /^[A-Z_][A-Z0-9_]*$/.test(e))
}

function q(e, t, n) {
    if (!n) return [];
    let r = new TextDecoder;
    return t.filter(([t, i]) => i > e.length ? !1 : ue(r.decode(e.subarray(t, i))) === n)
}

function ue(e) {
    return e.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g, (e, t) => {
        if (t[0] === `u`) {
            let e = t[1] === `{` ? t.slice(2, -1) : t.slice(1);
            return String.fromCodePoint(parseInt(e, 16))
        }
        return t[0] === `x` ? String.fromCharCode(parseInt(t.slice(1), 16)) : {
            n: `
`,
            r: `\r`,
            t: `	`,
            b: `\b`,
            f: `\f`,
            v: `\v`,
            0: `\0`
        }[t] ? ? t
    })
}

function de(e, t) {
    let n = e.replace(/\\/g, `\\\\`).replace(/\r/g, `\\r`).replace(/</g, `\\x3c`).replace(/\u2028/g, `\\u2028`).replace(/\u2029/g, `\\u2029`);
    if (t === 96) n = n.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
    else {
        let e = String.fromCharCode(t);
        n = n.replace(/\n/g, `\\n`).replace(new RegExp(e, `g`), `\\` + e)
    }
    return n
}

function J(e, t) {
    let n = [...t].sort((e, t) => e.from - t.from),
        r = e => {
            let t = 0;
            for (let r of n) {
                if (e < r.from || e === r.from && r.to > r.from) break;
                if (e < r.to) return r.from + t;
                t += r.ins.length - (r.to - r.from)
            }
            return e + t
        },
        i = e => {
            let t = 0;
            for (let r of n) {
                if (e <= r.from) break;
                if (e < r.to) return r.from + t;
                t += r.ins.length - (r.to - r.from)
            }
            return e + t
        };
    return e.map(([e, t]) => [r(e), i(t)])
}

function fe(e, t) {
    let n = new TextEncoder,
        r = `<style id="${F}">`,
        i = n.encode(r),
        a = n.encode(`</style>`),
        o = (t, n) => {
            outer: for (let r = n; r + t.length <= e.length; r++) {
                for (let n = 0; n < t.length; n++)
                    if (e[r + n] !== t[n]) continue outer;
                return r
            }
            return -1
        },
        s = e => e.replace(/</g, `\\3c `),
        c = t.map(e => {
            let t = Array.from(Q(e.cssText), ([e, t]) => /!important\s*$/.test(t) ? `${e}: ${t}` : `${e}: ${t} !important`).join(`; `);
            return `${s(e.selector)} { ${s(t)} }`
        }).join(`
`),
        l = o(i, 0);
    if (l >= 0) {
        let e = o(a, l + i.length),
            t = e >= 0 ? e : l + i.length;
        return {
            from: t,
            to: t,
            ins: n.encode(c + `
`)
        }
    }
    return {
        from: e.length,
        to: e.length,
        ins: n.encode(`\n${r}\n${c}\n</style>\n`)
    }
}

function Y(e) {
    return e.replace(/&/g, `&amp;`).replace(/"/g, `&quot;`).replace(/</g, `&lt;`)
}

function X(e, t) {
    let n = RegExp(`[\\s/]${t}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]*))`, `i`).exec(e);
    return n ? (n[2] ? ? n[3] ? ? (n[4] ? ? ``).replace(/\/$/, ``)).replace(/&quot;/g, `"`).replace(/&#39;/g, `'`).replace(/&lt;/g, `<`).replace(/&gt;/g, `>`).replace(/&amp;/g, `&`) : null
}

function Z(e, t) {
    let n = e => e.replace(/^\.\//, ``);
    return n(e) === n(t)
}

function pe(e, t, n) {
    if (t.entries.size === 0) return me(e, n);
    let r = new TextEncoder,
        i = new TextDecoder,
        a = [],
        o, s;
    for (let n of t.entries.values()) n.tag === `link` ? n.openEnd > n.openStart && n.openEnd <= e.length && a.push(i.decode(e.subarray(n.openStart, n.openEnd))) : n.tag === `head` ? o ? ? = n.closeStart : n.tag === `html` && (s ? ? = n.closeStart);
    let c = e => a.some(t => {
            if (X(t, `id`) === e.id) return !0;
            let n = X(t, `rel`);
            if (n == null) return !1;
            let r = n.toLowerCase().split(/\s+/);
            if (!r.includes(`stylesheet`) || r.includes(`alternate`)) return !1;
            let i = X(t, `href`);
            return i != null && Z(i, e.href)
        }),
        l = n.filter(e => !c(e));
    if (l.length === 0) return [];
    let u = t => t != null && t >= 0 && t <= e.length,
        d = u(o) ? o : u(s) ? s : e.length,
        f = 0,
        p = [],
        m = [];
    for (let e of l) {
        let t = `<link id="${Y(e.id)}" rel="stylesheet" href="${Y(e.href)}">`,
            n = r.encode(t).length;
        m.push({
            id: `headlink:${e.id}`,
            tag: `link`,
            openStart: f,
            attrEnd: f + n - 1,
            openEnd: f + n
        }), p.push(t + `
`), f += n + 1
    }
    return [{
        from: d,
        to: d,
        ins: r.encode(p.join(``)),
        addEntries: m
    }]
}

function me(e, t) {
    let n = new TextEncoder,
        r = new TextDecoder().decode(e),
        i = r.replace(/<!--[\s\S]*?-->/g, e => ` `.repeat(e.length)).replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script\s*>)/gi, (e, t, n, r) => t + ` `.repeat(n.length) + r),
        a = i.match(/<link\b[^>]*>/gi) ? ? [],
        o = e => a.some(t => {
            if (X(t, `id`) === e.id) return !0;
            let n = X(t, `rel`);
            if (n == null) return !1;
            let r = n.toLowerCase().split(/\s+/);
            if (!r.includes(`stylesheet`) || r.includes(`alternate`)) return !1;
            let i = X(t, `href`);
            return i != null && Z(i, e.href)
        }),
        s = t.filter(e => !o(e)).map(e => `<link id="${Y(e.id)}" rel="stylesheet" href="${Y(e.href)}">\n`);
    if (s.length === 0) return [];
    let c = /<\/head\s*>/i.exec(i) ? ? /<\/html\s*>/i.exec(i),
        l = c ? n.encode(r.slice(0, c.index)).length : e.length;
    return [{
        from: l,
        to: l,
        ins: n.encode(s.join(``))
    }]
}

function Q(e) {
    let t = new Map,
        n = 0,
        r = ``,
        i = 0,
        a = e => {
            let n = e.indexOf(`:`);
            if (n <= 0) return;
            let r = e.slice(0, n).trim(),
                i = e.slice(n + 1).trim();
            r && t.set(r, i)
        };
    for (let t = 0; t < e.length; t++) {
        let o = e[t];
        r ? o === r && (r = ``) : o === `"` || o === `'` ? r = o : o === `(` ? n++ : o === `)` ? n = Math.max(0, n - 1) : o === `;` && n === 0 && (a(e.slice(i, t)), i = t + 1)
    }
    return a(e.slice(i)), t
}
var he = class {
    opts;
    fetchImpl;
    cursor = ``;
    lastEntryAt = 0;
    snapshot = {
        cursor: ``,
        lastEntryAt: 0
    };
    running = !1;
    controller = null;
    wake = new c;
    backoffMs = 500;
    listeners = new Set;
    constructor(e) {
        this.opts = {
            shortPollMs: m,
            ...e
        }, this.fetchImpl = e.fetchImpl ? ? globalThis.fetch.bind(globalThis)
    }
    subscribe(e) {
        return this.listeners.add(e), this.listeners.size === 1 && this.start(), () => {
            this.listeners.delete(e), this.listeners.size === 0 && this.stop()
        }
    }
    getSnapshot() {
        return this.snapshot
    }
    start() {
        this.running || (this.running = !0, typeof document < `u` && document.addEventListener(`visibilitychange`, this.onVisibilityChange), this.loop())
    }
    stop() {
        this.running && (this.running = !1, typeof document < `u` && document.removeEventListener(`visibilitychange`, this.onVisibilityChange), this.controller ? .abort(), this.controller = null, this.wake.cancel())
    }
    notify() {
        for (let e of this.listeners) e()
    }
    setCursor(e, t) {
        this.cursor = e, this.lastEntryAt = t, this.snapshot = {
            cursor: e,
            lastEntryAt: t
        }, this.notify()
    }
    onVisibilityChange = () => {
        typeof document > `u` || (document.visibilityState === `hidden` ? this.controller ? .abort() : this.wake.cancel())
    };
    isHidden() {
        return typeof document < `u` && document.visibilityState === `hidden`
    }
    async loop() {
        for (; this.running;) {
            let e = !this.isHidden() && this.cursor !== ``,
                t = new AbortController;
            this.controller = t;
            let n = !1;
            try {
                let n = this.buildUrl(e),
                    r = Date.now(),
                    i = await this.fetchImpl(n, {
                        signal: t.signal,
                        headers: {
                            accept: `application/x-ndjson`
                        }
                    });
                if (!this.running) return;
                if (i.status === 410) {
                    this.setCursor(``, Date.now()), this.opts.onGap(), this.backoffMs = 500;
                    continue
                }
                if (!i.ok) throw Error(`changelog poll ${i.status}`);
                let a = await i.text();
                if (!this.running) return;
                let o = ge(a);
                o.length > 0 && this.opts.onEntries(o);
                let s = i.headers.get(`X-Changelog-Cursor`);
                s && this.setCursor(s, o.length > 0 ? Date.now() : this.lastEntryAt), this.backoffMs = 500;
                let c = i.headers.get(`X-Changelog-Degraded`) === `1`,
                    l = e && o.length === 0 && Date.now() - r < 1e3;
                (this.isHidden() || c || l) && await this.wake.sleep(this.opts.shortPollMs)
            } catch (e) {
                if (!this.running) return;
                i(e) ? n = !0 : (await this.wake.sleep(s(this.backoffMs)), this.backoffMs = Math.min(this.backoffMs * 2, o))
            } finally {
                this.controller === t && (this.controller = null)
            }
            n && await Promise.resolve()
        }
    }
    buildUrl(e) {
        let t = this.opts.baseUrl.replace(/\/$/, ``),
            n = new URLSearchParams;
        this.cursor && n.set(`cursor`, this.cursor), e && this.cursor && n.set(`live`, `true`);
        let r = n.toString();
        return `${t}/v1/design/projects/${encodeURIComponent(this.opts.projectId)}/changes${r?`?${r}`:``}`
    }
};

function ge(e) {
    let t = [];
    for (let n of e.split(`
`)) {
        let e = n.trim();
        if (e) try {
            t.push(_e(JSON.parse(e)))
        } catch {}
    }
    return t
}

function _e(e) {
    return {
        table: e.table ? ? ``,
        op: e.op ? ? ``,
        rowId: e.rowId ? ? ``,
        version: Number(e.version) || 0,
        committedAt: e.committedAt && Date.parse(e.committedAt) || 0
    }
}
var ve = 6e4,
    ye = 10 * 6e4,
    be = class {
        opts;
        es = null;
        retryTimer = null;
        hideTimer = null;
        started = !1;
        backoffMs = 500;
        failStreak = 0;
        failStreakStartedAt = 0;
        constructor(e) {
            this.opts = e
        }
        start() {
            this.started || (this.started = !0, !(typeof document < `u` && (document.addEventListener(`visibilitychange`, this.onVisibilityChange), document.visibilityState === `hidden`)) && this.open())
        }
        stop() {
            this.started && (this.started = !1, typeof document < `u` && document.removeEventListener(`visibilitychange`, this.onVisibilityChange), this.close(), this.failStreak = 0, this.backoffMs = 500)
        }
        close() {
            this.retryTimer && = (clearTimeout(this.retryTimer), null), this.hideTimer && = (clearTimeout(this.hideTimer), null), this.es ? .close(), this.es = null
        }
        onVisibilityChange = () => {
            !this.started || typeof document > `u` || (document.visibilityState === `hidden` ? this.hideTimer ? ? = setTimeout(() => {
                this.hideTimer = null, this.close()
            }, ve) : (this.hideTimer && = (clearTimeout(this.hideTimer), null), this.failStreak = 0, this.backoffMs = 500, this.retryTimer && = (clearTimeout(this.retryTimer), null), this.es || this.open()))
        };
        open() {
            let e = `${this.opts.baseUrl.replace(/\/$/,``)}/v1/design/projects/${encodeURIComponent(this.opts.projectId)}/events?tab=${encodeURIComponent(this.opts.tabId)}`,
                t = new EventSource(e);
            this.es = t, t.addEventListener(`open`, () => {
                t === this.es && (this.backoffMs = 500, this.failStreak = 0)
            }), t.addEventListener(`presence`, e => {
                if (t === this.es) try {
                    let t = JSON.parse(e.data);
                    this.opts.onPresence(t.accounts ? ? [])
                } catch {}
            }), t.addEventListener(`error`, () => {
                if (t !== this.es || t.readyState !== EventSource.CLOSED) return;
                this.es = null, this.failStreak++, this.failStreak === 1 && (this.failStreakStartedAt = Date.now());
                let e = this.failStreak >= 5 && Date.now() - this.failStreakStartedAt >= 6e4 ? ye : this.backoffMs;
                this.retryTimer = setTimeout(() => {
                    this.retryTimer = null, this.open()
                }, s(e)), this.backoffMs = Math.min(this.backoffMs * 2, o)
            })
        }
    };

function xe(e, n) {
    let {
        writeSet: i,
        onProjectMeta: o
    } = n ? ? {}, s = g(), c = h(`__gb__3813248442`).on;
    (0, T.useEffect)(() => {
        if (e) return () => {
            u(e), a(e)
        }
    }, [e]), t(`agent-write-receipt`, (0, T.useCallback)(t => {
        if (!e || !i || !c) return;
        let n = t.detail;
        n ? .projectId !== e || !Array.isArray(n.files) || i.remember(n.files)
    }, [e, i, c])), (0, T.useEffect)(() => {
        if (!e || !c) return;
        let t = null,
            n = new he({
                projectId: e,
                baseUrl: `/design/`,
                fetchImpl: (e, t) => {
                    let n = new Headers(t ? .headers),
                        r = v();
                    return r && n.set(y, r), fetch(e, { ...t,
                        headers: n
                    })
                },
                onEntries: t => {
                    let n = [];
                    for (let r of t) i ? .isMine(r) || (n.push(r), r.table === `files` ? (te(r.rowId, !0), (r.op === `update` || r.op === `create`) && S(e, r.rowId)) : r.table === `project` && o ? .(e));
                    n.length > 0 && r(s, e, n)
                },
                onGap: () => {
                    t && clearTimeout(t), t = setTimeout(() => {
                        t = null, s.invalidateQueries({
                            queryKey: d.all(e)
                        }), o ? .(e)
                    }, Math.random() * 5e3)
                }
            });
        s.invalidateQueries({
            queryKey: d.all(e)
        });
        let a = n.subscribe(() => {});
        return () => {
            t && clearTimeout(t), a()
        }
    }, [e, c, i, o, s])
}
async function $(e, t, n) {
    let r = t.startsWith(`${e}/`) ? t.slice(e.length + 1) : t,
        i = !(r === t && t.startsWith(`/`));
    i && (x(e, r), C.pushAgentState(`directEdit`, {
        projectId: e,
        paths: [r],
        phase: `intent`
    }, e));
    try {
        await C.writeFile(t, n)
    } catch (t) {
        let n = t ? .code === 10;
        throw i && n && (b(e, r), C.pushAgentState(`directEdit`, {
            projectId: e,
            paths: [r],
            phase: `bailed`
        }, e)), t
    }
    i && (ee(e, r), C.pushAgentState(`directEdit`, {
        projectId: e,
        paths: [r],
        phase: `landed`
    }, e))
}

function Se(e, t, n, r) {
    let i = g(),
        a = (0, T.useRef)(null),
        o = (0, T.useRef)(null),
        s = (0, T.useRef)(0);
    (0, T.useEffect)(() => {
        a.current = null, o.current = null, s.current++
    }, [t, n, r]);
    let c = (0, T.useCallback)(e => o.current ? .onExternalWrite(e) ? ? !0, []),
        u = (0, T.useCallback)(async (e, t, n) => {
            let r = s.current,
                c = () => {
                    if (s.current !== r) throw Error(`ensureLedger: superseded`)
                };
            if (a.current === null) {
                let t = e ? await D(e, `readSrcMap`) : null;
                c();
                try {
                    let e = t ? JSON.parse(t) : null;
                    a.current = {
                        gen: e ? .gen ? ? ``,
                        entries: new Map((e ? .entries ? ? []).map(e => [e.id, e])),
                        literals: e ? .literals ? ? []
                    }
                } catch {
                    a.current = {
                        gen: ``,
                        entries: new Map,
                        literals: []
                    }
                }
            }
            if (o.current === null) {
                let e = {
                        readFile: e => C.readFile(e),
                        writeFile: (e, n) => $(t, e, n),
                        readFileWithVersion: C.readFileWithVersion ? e => C.readFileWithVersion(e) : void 0,
                        onAdopted: (e, n, r) => {
                            l(i, t, e.startsWith(`${t}/`) ? e.slice(t.length + 1) : e, n, r)
                        },
                        fetchSrcMap: C.readSrcMap ? async e => {
                            let t = await C.readSrcMap(e),
                                n = JSON.parse(t);
                            return {
                                gen: n.gen ? ? ``,
                                entries: new Map((n.entries ? ? []).map(e => [e.id, e])),
                                literals: n.literals ? ? []
                            }
                        } : void 0
                    },
                    r = await z.open(`${t}/${n}`, e, a.current);
                c(), o.current = r
            }
            return o.current.isStale && (await o.current.refresh(), c()), o.current
        }, [i]);
    (0, T.useEffect)(() => {
        t !== 0 && u(w(e.current), n, r).catch(() => {})
    }, [t, n, r]);
    let d = (0, T.useRef)(Promise.resolve());
    return {
        onExternalFileWrite: c,
        spliceAttr: (0, T.useCallback)(async (t, i, a) => {
            let o = w(e.current);
            if (!n || !r) return !1;
            let s = !1,
                c = d.current;
            return d.current = (async () => {
                await c.catch(() => {});
                let e = await u(o, n, r),
                    l = {
                        kind: `attr`,
                        omId: t,
                        name: i,
                        value: a
                    };
                e.isStale || e.canApply(l) !== null || (e.apply(l), s = await e.reconcile() === `ok`)
            })(), await d.current.catch(() => {}), s
        }, [e, n, r, u]),
        spliceJsxAttr: (0, T.useCallback)(async (t, i, a) => {
            let o = w(e.current);
            if (!n || !r || !o) return null;
            let s = null,
                c = d.current;
            return d.current = (async () => {
                await c.catch(() => {}), await D(o, `cacheBabelSources`, !0);
                let e = await j(o);
                if (!e) return;
                let l = await oe(o, n, r, e, t, ``, `attr`, {
                    name: i,
                    value: a
                }, () => {});
                l.written && (await (await u(o, n, r)).writeRaw(l.writePath, l.newContent), l.scriptIdx != null && l.patchedSource != null && await D(o, `commitBabelSource`, l.scriptIdx, l.patchedSource), s = l.existingAttrValue ? ? a)
            })(), await d.current.catch(() => {}), s
        }, [e, n, r, u])
    }
}
export {
    A as a, re as c, be as i, D as l, Se as n, ie as o, xe as r, ne as s, $ as t, O as u
};
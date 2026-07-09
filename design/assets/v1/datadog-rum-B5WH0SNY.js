import {
    r as e
} from "./rolldown-runtime-CMxvf4Kt.js";
var t = {
        log: `log`,
        debug: `debug`,
        info: `info`,
        warn: `warn`,
        error: `error`
    },
    n = console,
    r = {};
Object.keys(t).forEach(e => {
    r[e] = n[e]
});
var i = `Datadog Browser SDK:`,
    a = {
        debug: r.debug.bind(n, i),
        log: r.log.bind(n, i),
        info: r.info.bind(n, i),
        warn: r.warn.bind(n, i),
        error: r.error.bind(n, i)
    },
    o = `https://docs.datadoghq.com`,
    s = `${o}/real_user_monitoring/browser/troubleshooting`,
    c = `More details:`;

function l(e, t) {
    return (...n) => {
        try {
            return e(...n)
        } catch (e) {
            a.error(t, e)
        }
    }
}

function u(e) {
    return e !== 0 && Math.random() * 100 <= e
}

function d(e, t) {
    return +e.toFixed(t)
}

function f(e) {
    return p(e) && e >= 0 && e <= 100
}

function p(e) {
    return typeof e == `number`
}

function m(e) {
    try {
        return JSON.parse(e)
    } catch {}
}

function h(e) {
    return { ...e
    }
}

function g(e, t) {
    return Object.keys(e).some(n => e[n] === t)
}

function _(e) {
    return Object.keys(e).length === 0
}

function ee(e, t) {
    let n = {};
    for (let r of Object.keys(e)) n[r] = t(e[r]);
    return n
}

function v() {
    return globalThis
}
var y = v(),
    b = `WorkerGlobalScope` in y,
    x = 1e3,
    S = 60 * x,
    te = 60 * S,
    ne = 24 * te * 365;

function re(e) {
    return {
        relative: e,
        timeStamp: ae(e)
    }
}

function ie(e) {
    return {
        relative: le(e),
        timeStamp: e
    }
}

function ae(e) {
    let t = w() - performance.now();
    return t > A() ? Math.round(ce(t, e)) : ue(e)
}

function oe() {
    return Math.round(w() - ce(A(), performance.now()))
}

function C(e) {
    return p(e) ? d(e * 1e6, 0) : e
}

function w() {
    return new Date().getTime()
}

function T() {
    return w()
}

function E() {
    return performance.now()
}

function D() {
    return {
        relative: E(),
        timeStamp: T()
    }
}

function se() {
    return {
        relative: 0,
        timeStamp: A()
    }
}

function O(e, t) {
    return t - e
}

function ce(e, t) {
    return e + t
}

function le(e) {
    return e - A()
}

function ue(e) {
    return Math.round(ce(A(), e))
}

function de(e) {
    return e < ne
}
var k;

function A() {
    return k === void 0 && (k = performance.timing ? .navigationStart ? ? performance.timeOrigin), k
}
var fe = 4 * te,
    pe = 15 * S,
    me = ne,
    j = {
        COOKIE: `cookie`,
        MEMORY: `memory`,
        LOCAL_STORAGE: `local-storage`
    };

function M(e) {
    return e ? (parseInt(e, 10) ^ Math.random() * 16 >> parseInt(e, 10) / 4).toString(16) : `10000000-1000-4000-8000-100000000000`.replace(/[018]/g, M)
}
var he = /(\S+?)\s*=\s*(.*?)(?:;|$)/g;

function ge(e, t) {
    for (he.lastIndex = 0;;) {
        let n = he.exec(e);
        if (n) {
            if (n[1] === t) return n[2]
        } else break
    }
}

function _e(e) {
    let t = new Map;
    for (he.lastIndex = 0;;) {
        let n = he.exec(e);
        if (n) {
            let e = n[1],
                r = n[2];
            t.has(e) ? t.get(e).push(r) : t.set(e, [r])
        } else break
    }
    return t
}

function ve(e) {
    let t = new Map;
    for (he.lastIndex = 0;;) {
        let n = he.exec(e);
        if (n) t.set(n[1], n[2]);
        else break
    }
    return t
}

function ye(e, t, n = ``) {
    let r = e.charCodeAt(t - 1),
        i = r >= 55296 && r <= 56319 ? t + 1 : t;
    return e.length <= i ? e : `${e.slice(0,i)}${n}`
}

function be(e) {
    return Ce(e, location.href).href
}

function xe(e) {
    try {
        return !!Ce(e)
    } catch {
        return !1
    }
}

function Se(e) {
    let t = Ce(e).pathname;
    return t[0] === `/` ? t : `/${t}`
}

function Ce(e, t) {
    let {
        URL: n
    } = Te();
    try {
        return t === void 0 ? new n(e) : new n(e, t)
    } catch (e) {
        throw Error(`Failed to construct URL: ${String(e)}`)
    }
}
var we;

function Te() {
    if (!we) {
        let e, t;
        try {
            e = document.createElement(`iframe`), e.style.display = `none`, document.body.appendChild(e), t = e.contentWindow ? ? y
        } catch {
            t = y
        }
        we = {
            URL: t.URL
        }, e ? .remove()
    }
    return we
}

function Ee(e, t, n = 0, r) {
    let i = new Date;
    i.setTime(i.getTime() + n);
    let a = `expires=${i.toUTCString()}`,
        o = r && r.crossSite ? `none` : `strict`,
        s = r && r.domain ? `;domain=${r.domain}` : ``,
        c = r && r.secure ? `;secure` : ``,
        l = r && r.partitioned ? `;partitioned` : ``;
    document.cookie = `${e}=${t};${a};path=/;samesite=${o}${s}${c}${l}`
}

function De(e) {
    let t = ge(document.cookie, e);
    if (t !== ``) return t
}

function Oe(e) {
    return _e(document.cookie).get(e) || []
}
var ke;

function Ae(e) {
    return ke || = ve(document.cookie), ke.get(e)
}

function je(e, t) {
    Ee(e, ``, 0, t)
}

function Me(e) {
    if (document.cookie === void 0 || document.cookie === null) return !1;
    try {
        let t = `dd_cookie_test_${M()}`,
            n = `test`;
        Ee(t, n, S, e);
        let r = De(t) === n;
        return je(t, e), r
    } catch (e) {
        return a.error(e), !1
    }
}
var Ne;

function Pe(e = location.hostname, t = document.referrer) {
    if (Ne === void 0) {
        let n = Fe(e, t);
        if (n) {
            let e = `dd_site_test_${M()}`,
                t = n.split(`.`),
                r = t.pop();
            for (; t.length && !De(e);) r = `${t.pop()}.${r}`, Ee(e, `test`, x, {
                domain: r
            });
            je(e, {
                domain: r
            }), Ne = r
        }
    }
    return Ne
}

function Fe(e, t) {
    try {
        return e || Ce(t).hostname
    } catch {}
}

function Ie(e, t) {
    for (let n = e.length - 1; n >= 0; --n) {
        let r = e[n];
        if (t(r, n, e)) return r
    }
}

function Le(e) {
    return Object.values(e)
}

function Re(e) {
    return Object.entries(e)
}
var ze = /^([a-zA-Z]+)=([a-z0-9-]+)$/;

function Be(e) {
    return !!e && (e.indexOf(`&`) !== -1 || ze.test(e))
}

function Ve(e) {
    return e.created ? Number(e.created) : void 0
}

function He(e) {
    let t = e.expire && Number(e.expire),
        n = Ve(e);
    if (t && n) return Math.min(t, n + fe)
}

function Ue(e, t) {
    let n = {
        isExpired: `1`
    };
    return t.trackAnonymousUser && e ? .anonymousId && (n.anonymousId = e ? .anonymousId), n
}

function We(e) {
    return _(e)
}

function Ge(e) {
    return e.isExpired !== void 0 || !Ke(e)
}

function Ke(e) {
    let t = He(e);
    return t ? w() < t : !1
}

function qe(e) {
    e.expire = String(w() + pe)
}

function Je(e) {
    return Re(e).map(([e, t]) => e === `anonymousId` ? `aid=${t}` : `${e}=${t}`).join(`&`)
}

function Ye(e) {
    let t = {};
    return Be(e) && e.split(`&`).forEach(e => {
        let n = ze.exec(e);
        if (n !== null) {
            let [, e, r] = n;
            e === `aid` ? t.anonymousId = r : t[e] = r
        }
    }), t
}

function Xe(e, t) {
    return We(e) ? (t.trackAnonymousUser && (e.anonymousId = M()), Ue(e, t)) : e
}

function Ze(e, t) {
    if (We(e)) return e;
    let n = e;
    return Ge(e) && (n = Ue(e, t)), n.id || (n.id = M(), n.created = String(w())), t.trackAnonymousUser && !n.anonymousId && (n.anonymousId = M()), delete n.isExpired, qe(n), n
}

function Qe(e) {
    return Ge(e) || We(e) || !e.id || qe(e), e
}
var $e, et = !1;

function tt(e) {
    $e = e
}

function nt(e) {
    et = e
}

function N(e) {
    return function(...t) {
        return P(e, this, t)
    }
}

function P(e, t, n) {
    try {
        return e.apply(t, n)
    } catch (e) {
        F(e)
    }
}

function F(e) {
    if (rt(e), $e) try {
        $e(e)
    } catch (e) {
        rt(e)
    }
}

function rt(...e) {
    et && a.error(`[MONITOR]`, ...e)
}

function it(e) {
    let t = y.queueMicrotask;
    typeof t == `function` ? t(N(e)) : Promise.resolve().then(N(e))
}
var I = class {
    constructor(e) {
        this.onFirstSubscribe = e, this.observers = []
    }
    subscribe(e) {
        return this.addObserver(e), {
            unsubscribe: () => this.removeObserver(e)
        }
    }
    notify(e) {
        this.observers.forEach(t => t(e))
    }
    addObserver(e) {
        this.observers.push(e), this.observers.length === 1 && this.onFirstSubscribe && (this.onLastUnsubscribe = this.onFirstSubscribe(this) || void 0)
    }
    removeObserver(e) {
        this.observers = this.observers.filter(t => e !== t), !this.observers.length && this.onLastUnsubscribe && this.onLastUnsubscribe()
    }
};

function at(...e) {
    return new I(t => {
        let n = e.map(e => e.subscribe(e => t.notify(e)));
        return () => n.forEach(e => e.unsubscribe())
    })
}
var ot = class extends I {
    constructor(e, t) {
        super(), this.maxBufferSize = e, this.onDrop = t, this.buffer = [], this.droppedCount = 0
    }
    notify(e) {
        this.buffer.push(e), this.buffer.length > this.maxBufferSize && (this.buffer.shift(), this.droppedCount++), super.notify(e)
    }
    subscribe(e) {
        let t = !1;
        return it(() => {
            for (let n of this.buffer) {
                if (t) return;
                e(n)
            }
            t || this.addObserver(e)
        }), {
            unsubscribe: () => {
                t = !0, this.removeObserver(e)
            }
        }
    }
    unbuffer() {
        it(() => {
            this.droppedCount > 0 && this.onDrop && this.onDrop(this.droppedCount), this.maxBufferSize = this.buffer.length = 0
        })
    }
};

function L(e) {
    return e
}

function st(e, t) {
    let n = v(),
        r;
    return n.Zone && typeof n.Zone.__symbol__ == `function` && (r = e[n.Zone.__symbol__(t)]), r || = e[t], r
}

function R(e, t) {
    return st(v(), `setTimeout`)(N(e), t)
}

function z(e) {
    st(v(), `clearTimeout`)(e)
}

function ct(e, t) {
    return st(v(), `setInterval`)(N(e), t)
}

function lt(e) {
    st(v(), `clearInterval`)(e)
}
var ut = 1024,
    dt = 1024 * ut,
    ft = /[^\u0000-\u007F]/;

function pt(e) {
    return ft.test(e) ? new TextEncoder().encode(e).length : e.length
}

function mt(e) {
    if (e.length === 1) return e[0];
    let t = e.reduce((e, t) => e + t.length, 0),
        n = new Uint8Array(t),
        r = 0;
    for (let t of e) n.set(t, r), r += t.length;
    return n
}

function ht(e, t, n) {
    let r = n && n.leading !== void 0 ? n.leading : !0,
        i = n && n.trailing !== void 0 ? n.trailing : !0,
        a = !1,
        o, s;
    return {
        throttled: (...n) => {
            if (a) {
                o = n;
                return
            }
            r ? e(...n) : o = n, a = !0, s = R(() => {
                i && o && e(...o), a = !1, o = void 0
            }, t)
        },
        cancel: () => {
            z(s), a = !1, o = void 0
        }
    }
}

function B() {}

function gt(e, t, n) {
    if (typeof e != `object` || !e) return JSON.stringify(e);
    let r = _t(Object.prototype),
        i = _t(Array.prototype),
        a = _t(Object.getPrototypeOf(e)),
        o = _t(e);
    try {
        return JSON.stringify(e, t, n)
    } catch {
        return `<error: unable to serialize object>`
    } finally {
        r(), i(), a(), o()
    }
}

function _t(e) {
    let t = e,
        n = t.toJSON;
    return n ? (delete t.toJSON, () => {
        t.toJSON = n
    }) : B
}
var vt = 220 * ut,
    yt = `$`,
    bt = 3;

function V(e, t = vt) {
    let n = _t(Object.prototype),
        r = _t(Array.prototype),
        i = [],
        a = new WeakMap,
        o = xt(e, yt, void 0, i, a),
        s = JSON.stringify(o),
        c = s ? s.length : 0;
    if (c > t) {
        Et(t, `discarded`, e);
        return
    }
    for (; i.length > 0 && c < t;) {
        let n = i.shift(),
            r = 0;
        if (Array.isArray(n.source))
            for (let o = 0; o < n.source.length; o++) {
                let s = xt(n.source[o], n.path, o, i, a);
                if (s === void 0 ? c += 4 : c += JSON.stringify(s).length, c += r, r = 1, c > t) {
                    Et(t, `truncated`, e);
                    break
                }
                n.target[o] = s
            } else
                for (let o in n.source)
                    if (Object.prototype.hasOwnProperty.call(n.source, o)) {
                        let s = xt(n.source[o], n.path, o, i, a);
                        if (s !== void 0 && (c += JSON.stringify(s).length + r + o.length + bt, r = 1), c > t) {
                            Et(t, `truncated`, e);
                            break
                        }
                        n.target[o] = s
                    }
    }
    return n(), r(), o
}

function xt(e, t, n, r, i) {
    let a = Tt(e);
    if (!a || typeof a != `object`) return St(a);
    let o = Ct(a);
    if (o !== `[Object]` && o !== `[Array]` && o !== `[Error]`) return o;
    let s = e;
    if (i.has(s)) return `[Reference seen at ${i.get(s)}]`;
    let c = n === void 0 ? t : `${t}.${n}`,
        l = Array.isArray(a) ? [] : {};
    return i.set(s, c), r.push({
        source: a,
        target: l,
        path: c
    }), l
}

function St(e) {
    return typeof e == `bigint` ? `[BigInt] ${e.toString()}` : typeof e == `function` ? `[Function] ${e.name||`unknown`}` : typeof e == `symbol` ? `[Symbol] ${e.description||e.toString()}` : e
}

function Ct(e) {
    try {
        if (e instanceof Event) return wt(e);
        if (e instanceof RegExp) return `[RegExp] ${e.toString()}`;
        let t = Object.prototype.toString.call(e).match(/\[object (.*)\]/);
        if (t && t[1]) return `[${t[1]}]`
    } catch {}
    return `[Unserializable]`
}

function wt(e) {
    return {
        type: e.type,
        isTrusted: e.isTrusted,
        currentTarget: e.currentTarget ? Ct(e.currentTarget) : null,
        target: e.target ? Ct(e.target) : null
    }
}

function Tt(e) {
    let t = e;
    if (t && typeof t.toJSON == `function`) try {
        return t.toJSON()
    } catch {}
    return e
}

function Et(e, t, n) {
    a.warn(`The data provided has been ${t} as it is over the limit of ${e} characters:`, n)
}

function Dt(e) {
    return e === null ? `null` : Array.isArray(e) ? `array` : typeof e
}

function Ot(e) {
    return Dt(e) === `object`
}
var kt = `?`;

function At(e) {
    let t = [],
        n = Ut(e, `stack`),
        r = String(e);
    if (n && n.startsWith(r) && (n = n.slice(r.length)), n && n.split(`
`).forEach(e => {
            let n = Ft(e) || Lt(e) || zt(e) || Ht(e);
            n && (!n.func && n.line && (n.func = kt), t.push(n))
        }), t.length > 0 && Yt() && e instanceof Error) {
        let n = [],
            r = e;
        for (;
            (r = Object.getPrototypeOf(r)) && qt(r);) {
            let e = r.constructor ? .name || kt;
            n.push(e)
        }
        for (let e = n.length - 1; e >= 0 && t[0] ? .func === n[e]; e--) t.shift()
    }
    return {
        message: Ut(e, `message`),
        name: Ut(e, `name`),
        stack: t
    }
}
var jt = `((?:file|https?|blob|chrome-extension|electron|native|eval|webpack|snippet|<anonymous>|\\w+\\.|\\/).*?)`,
    Mt = `(?::(\\d+))`,
    Nt = RegExp(`^\\s*at (.*?) ?\\(${jt}${Mt}?${Mt}?\\)?\\s*$`, `i`),
    Pt = RegExp(`\\((\\S*)${Mt}${Mt}\\)`);

function Ft(e) {
    let t = Nt.exec(e);
    if (!t) return;
    let n = t[2] && t[2].indexOf(`native`) === 0,
        r = t[2] && t[2].indexOf(`eval`) === 0,
        i = Pt.exec(t[2]);
    return r && i && (t[2] = i[1], t[3] = i[2], t[4] = i[3]), {
        args: n ? [t[2]] : [],
        column: t[4] ? +t[4] : void 0,
        func: t[1] || kt,
        line: t[3] ? +t[3] : void 0,
        url: n ? void 0 : t[2]
    }
}
var It = RegExp(`^\\s*at\\s*(?:(.*)?(?: @))?\\s*${jt}${Mt}?${Mt}??\\s*$`, `i`);

function Lt(e) {
    let t = It.exec(e);
    if (t) return {
        args: [],
        column: t[4] ? +t[4] : void 0,
        func: t[1] || kt,
        line: t[3] ? +t[3] : void 0,
        url: t[2]
    }
}
var Rt = /^\s*at (?:((?:\[object object\])?.+) )?\(?((?:file|ms-appx|https?|webpack|blob):.*?):(\d+)(?::(\d+))?\)?\s*$/i;

function zt(e) {
    let t = Rt.exec(e);
    if (t) return {
        args: [],
        column: t[4] ? +t[4] : void 0,
        func: t[1] || kt,
        line: +t[3],
        url: t[2]
    }
}
var Bt = /^\s*(.*?)(?:\((.*?)\))?(?:(?:(?:^|@)((?:file|https?|blob|chrome|webpack|resource|capacitor|\[native).*?|[^@]*bundle|\[wasm code\])(?::(\d+))?(?::(\d+))?)|@)\s*$/i,
    Vt = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;

function Ht(e) {
    let t = Bt.exec(e);
    if (!t) return;
    let n = t[3] && t[3].indexOf(` > eval`) > -1,
        r = Vt.exec(t[3]);
    return n && r && (t[3] = r[1], t[4] = r[2], t[5] = void 0), {
        args: t[2] ? t[2].split(`,`) : [],
        column: t[5] ? +t[5] : void 0,
        func: t[1] || kt,
        line: t[4] ? +t[4] : void 0,
        url: t[3]
    }
}

function Ut(e, t) {
    return Ot(e) && typeof e[t] == `string` ? e[t] : void 0
}

function Wt(e, t, n, r) {
    if (t === void 0) return;
    let {
        name: i,
        message: a
    } = Kt(e);
    return {
        name: i,
        message: a,
        stack: [{
            url: t,
            column: r,
            line: n
        }]
    }
}
var Gt = /^(?:[Uu]ncaught (?:exception: )?)?(?:((?:Eval|Internal|Range|Reference|Syntax|Type|URI|)Error): )?([\s\S]*)$/;

function Kt(e) {
    let t, n;
    return {}.toString.call(e) === `[object String]` && ([, t, n] = Gt.exec(e)), {
        name: t,
        message: n
    }
}

function qt(e) {
    return String(e.constructor).startsWith(`class `)
}
var Jt;

function Yt() {
    if (Jt !== void 0) return Jt;
    class e extends Error {
        constructor() {
            super(), this.name = `Error`
        }
    }
    let [t, n] = [e, Error].map(e => new e);
    return Jt = qt(Object.getPrototypeOf(t)) && n.stack !== t.stack, Jt
}

function Xt(e) {
    let t = Error(e);
    t.name = `HandlingStack`;
    let n;
    return P(() => {
        let e = At(t);
        e.stack = e.stack.slice(2), n = Zt(e)
    }), n
}

function Zt(e) {
    let t = Qt(e);
    return e.stack.forEach(e => {
        let n = e.func === `?` ? `<anonymous>` : e.func,
            r = e.args && e.args.length > 0 ? `(${e.args.join(`, `)})` : ``,
            i = e.line ? `:${e.line}` : ``,
            a = e.line && e.column ? `:${e.column}` : ``;
        t += `\n  at ${n}${r} @ ${e.url}${i}${a}`
    }), t
}

function Qt(e) {
    return `${e.name||`Error`}: ${e.message}`
}
var $t = `No stack, consider using an instance of Error`;

function en({
    originalError: e,
    stackTrace: t,
    source: n,
    useFallbackStack: r = !0,
    nonErrorPrefix: i
}) {
    let a = on(e);
    return !t && a && (t = At(e)), {
        source: n,
        type: t ? t.name : void 0,
        message: nn(t, a, i, e),
        stack: t ? Zt(t) : r ? $t : void 0
    }
}

function tn({
    stackTrace: e,
    originalError: t,
    handlingStack: n,
    componentStack: r,
    startClocks: i,
    nonErrorPrefix: a,
    useFallbackStack: o = !0,
    source: s,
    handling: c
}) {
    return {
        startClocks: i,
        handling: c,
        handlingStack: n,
        componentStack: r,
        originalError: t,
        ...en({
            originalError: t,
            stackTrace: e,
            source: s,
            useFallbackStack: o,
            nonErrorPrefix: a
        }),
        causes: on(t) ? sn(t, s) : void 0,
        fingerprint: rn(t),
        context: an(t)
    }
}

function nn(e, t, n, r) {
    return e ? .message && e ? .name ? e.message : t ? `Empty message` : n ? `${n} ${gt(V(r))}` : gt(V(r))
}

function rn(e) {
    return on(e) && `dd_fingerprint` in e ? String(e.dd_fingerprint) : void 0
}

function an(e) {
    if (Ot(e)) return e.dd_context
}

function on(e) {
    return e instanceof Error || Object.prototype.toString.call(e) === `[object Error]`
}

function sn(e, t) {
    let n = [],
        r = e.cause;
    for (; r != null && n.length < 10;) {
        let e = en({
            originalError: r,
            source: t,
            useFallbackStack: !1
        });
        n.push(e), r = on(r) ? r.cause : void 0
    }
    return n.length ? n : void 0
}
var H;
(function(e) {
    e.TRACK_INTAKE_REQUESTS = `track_intake_requests`, e.FEATURE_OPERATION_VITAL = `feature_operation_vital`, e.START_STOP_ACTION = `start_stop_action`, e.START_STOP_RESOURCE = `start_stop_resource`, e.TOO_MANY_REQUESTS_INVESTIGATION = `too_many_requests_investigation`, e.SESSION_RENEWAL_DEBUG_CONTEXT = `session_renewal_debug_context`
})(H || = {});
var cn = new Set;

function ln(e) {
    Array.isArray(e) && un(e.filter(e => g(H, e)))
}

function un(e) {
    e.forEach(e => {
        cn.add(e)
    })
}

function dn(e) {
    return cn.has(e)
}

function fn() {
    return cn
}

function pn(e) {
    let {
        env: t,
        service: n,
        version: r,
        datacenter: i,
        sdkVersion: a,
        variant: o
    } = e, s = [mn(`sdk_version`, a ? ? `7.1.0`)];
    return t && s.push(mn(`env`, t)), n && s.push(mn(`service`, n)), r && s.push(mn(`version`, r)), i && s.push(mn(`datacenter`, i)), o && s.push(mn(`variant`, o)), s
}

function mn(e, t) {
    let n = t ? `${e}:${t}` : e;
    return (n.length > 200 || gn(n)) && a.warn(`Tag ${n} doesn't meet tag requirements and will be sanitized. ${c} ${o}/getting_started/tagging/#defining-tags`), hn(n)
}

function hn(e) {
    return e.replace(/,/g, `_`)
}

function gn(e) {
    return RegExp(`[^\\p{Ll}\\p{Lo}0-9_:./-]`, `u`).test(e)
}
var _n = `datad0g.com`,
    vn = `datadoghq.com`,
    yn = `datadoghq.eu`,
    bn = `ddog-gov.com`,
    xn = `us2.ddog-gov.com`,
    Sn = [`ddsource`, `dd-api-key`, `dd-request-id`];

function Cn(e, t) {
    let n = y.__ddBrowserSdkExtensionCallback;
    n && n({
        type: e,
        payload: t
    })
}

function wn(e, t, n = Dn()) {
    if (t === void 0) return e;
    if (typeof t != `object` || !t) return t;
    if (t instanceof Date) return new Date(t.getTime());
    if (t instanceof RegExp) return new RegExp(t.source, t.flags);
    if (n.hasAlreadyBeenSeen(t)) return;
    if (Array.isArray(t)) {
        let r = Array.isArray(e) ? e : [];
        for (let e = 0; e < t.length; ++e) r[e] = wn(r[e], t[e], n);
        return r
    }
    let r = Dt(e) === `object` ? e : {};
    for (let e in t) Object.prototype.hasOwnProperty.call(t, e) && (r[e] = wn(r[e], t[e], n));
    return r
}

function Tn(e) {
    return wn(void 0, e)
}

function En(...e) {
    let t;
    for (let n of e) n != null && (t = wn(t, n));
    return t
}

function Dn() {
    if (typeof WeakSet < `u`) {
        let e = new WeakSet;
        return {
            hasAlreadyBeenSeen(t) {
                let n = e.has(t);
                return n || e.add(t), n
            }
        }
    }
    let e = [];
    return {
        hasAlreadyBeenSeen(t) {
            let n = e.indexOf(t) >= 0;
            return n || e.push(t), n
        }
    }
}

function On() {
    let e = y.navigator;
    return {
        status: e.onLine ? `connected` : `not_connected`,
        interfaces: e.connection && e.connection.type ? [e.connection.type] : void 0,
        effective_type: e.connection ? .effectiveType
    }
}

function kn(e, t) {
    return st(v(), `fetch`)(e, t)
}

function An(e) {
    return e >= 500
}

function jn(e) {
    try {
        return e.clone()
    } catch {
        return
    }
}
var Mn = {
        AGENT: `agent`,
        CONSOLE: `console`,
        CUSTOM: `custom`,
        LOGGER: `logger`,
        NETWORK: `network`,
        SOURCE: `source`,
        REPORT: `report`
    },
    Nn = 80 * ut,
    Pn = 20 * dt,
    Fn = S,
    In = x;

function Ln(e, t, n, r, i, a) {
    t.transportStatus === 0 && t.queuedPayloads.size() === 0 && t.bandwidthMonitor.canHandle(e) ? zn(e, t, n, a, {
        onSuccess: () => Bn(0, t, n, r, i, a),
        onFailure: () => {
            t.queuedPayloads.enqueue(e) || a.notify({
                type: `queue-full`,
                bandwidth: t.bandwidthMonitor.stats(),
                payload: e
            }), Rn(t, n, r, i, a)
        }
    }) : t.queuedPayloads.enqueue(e) || a.notify({
        type: `queue-full`,
        bandwidth: t.bandwidthMonitor.stats(),
        payload: e
    })
}

function Rn(e, t, n, r, i) {
    e.transportStatus === 2 && R(() => {
        zn(e.queuedPayloads.first(), e, t, i, {
            onSuccess: () => {
                e.queuedPayloads.dequeue(), e.currentBackoffTime = In, Bn(1, e, t, n, r, i)
            },
            onFailure: () => {
                e.currentBackoffTime = Math.min(Fn, e.currentBackoffTime * 2), Rn(e, t, n, r, i)
            }
        })
    }, e.currentBackoffTime)
}

function zn(e, t, n, r, {
    onSuccess: i,
    onFailure: a
}) {
    t.bandwidthMonitor.add(e), n(e, n => {
        t.bandwidthMonitor.remove(e), Vn(n) ? (t.transportStatus = t.bandwidthMonitor.ongoingRequestCount > 0 ? 1 : 2, e.retry = {
            count: e.retry ? e.retry.count + 1 : 1,
            lastFailureStatus: n.status
        }, r.notify({
            type: `failure`,
            bandwidth: t.bandwidthMonitor.stats(),
            payload: e
        }), a()) : (t.transportStatus = 0, r.notify({
            type: `success`,
            bandwidth: t.bandwidthMonitor.stats(),
            payload: e
        }), i())
    })
}

function Bn(e, t, n, r, i, a) {
    e === 0 && t.queuedPayloads.isFull() && !t.queueFullReported && (i({
        message: `Reached max ${r} events size queued for upload: ${Pn/dt}MiB`,
        source: Mn.AGENT,
        startClocks: D()
    }), t.queueFullReported = !0);
    let o = t.queuedPayloads;
    for (t.queuedPayloads = Un(); o.size() > 0;) Ln(o.dequeue(), t, n, r, i, a)
}

function Vn(e) {
    return e.type !== `opaque` && (e.status === 0 && !navigator.onLine || e.status === 408 || e.status === 429 || An(e.status))
}

function Hn() {
    return {
        transportStatus: 0,
        currentBackoffTime: In,
        bandwidthMonitor: Wn(),
        queuedPayloads: Un(),
        queueFullReported: !1
    }
}

function Un() {
    let e = [];
    return {
        bytesCount: 0,
        enqueue(t) {
            return this.isFull() ? !1 : (e.push(t), this.bytesCount += t.bytesCount, !0)
        },
        first() {
            return e[0]
        },
        dequeue() {
            let t = e.shift();
            return t && (this.bytesCount -= t.bytesCount), t
        },
        size() {
            return e.length
        },
        isFull() {
            return this.bytesCount >= Pn
        }
    }
}

function Wn() {
    return {
        ongoingRequestCount: 0,
        ongoingByteCount: 0,
        canHandle(e) {
            return this.ongoingRequestCount === 0 || this.ongoingByteCount + e.bytesCount <= Nn && this.ongoingRequestCount < 32
        },
        add(e) {
            this.ongoingRequestCount += 1, this.ongoingByteCount += e.bytesCount
        },
        remove(e) {
            --this.ongoingRequestCount, this.ongoingByteCount -= e.bytesCount
        },
        stats() {
            return {
                ongoingByteCount: this.ongoingByteCount,
                ongoingRequestCount: this.ongoingRequestCount
            }
        }
    }
}
var Gn = 16 * ut;

function Kn(e, t, n = Gn) {
    let r = new I,
        i = Hn();
    return {
        observable: r,
        send: n => {
            for (let a of e) Ln(n, i, (e, t) => {
                Xn(a, e, t)
            }, a.trackType, t, r)
        },
        sendOnExit: t => {
            for (let r of e) qn(r, n, t)
        }
    }
}

function qn(e, t, n) {
    if (n.bytesCount < t) try {
        let t = e.build(`beacon`, n);
        if (navigator.sendBeacon(t, n.data)) return
    } catch (e) {
        Yn(e)
    }
    Xn(e, n)
}
var Jn = !1;

function Yn(e) {
    Jn || (Jn = !0, F(e))
}

function Xn(e, t, n) {
    kn(e.build(`fetch`, t), {
        method: `POST`,
        body: t.data,
        mode: `cors`
    }).then(N(e => n ? .({
        status: e.status,
        type: e.type
    }))).catch(N(() => n ? .({
        status: 0
    })))
}

function Zn() {
    let e = er();
    if (e) return {
        getCapabilities() {
            return JSON.parse(e.getCapabilities ? .() || `[]`)
        },
        getPrivacyLevel() {
            return e.getPrivacyLevel ? .()
        },
        getIsTraceSampled() {
            return JSON.parse(e.getIsTraceSampled ? .() || `null`)
        },
        getAllowedWebViewHosts() {
            return JSON.parse(e.getAllowedWebViewHosts())
        },
        send(t, n, r) {
            let i = r ? {
                id: r
            } : void 0;
            e.send(JSON.stringify({
                eventType: t,
                event: n,
                view: i
            }))
        }
    }
}

function Qn(e) {
    let t = Zn();
    return !!t && t.getCapabilities().includes(e)
}

function $n(e = v().location ? .hostname) {
    let t = Zn();
    return !!t && t.getAllowedWebViewHosts().some(t => e === t || e.endsWith(`.${t}`))
}

function er() {
    return v().DatadogEventBridge
}

function U(e, t, n, r, i) {
    return tr(e, t, [n], r, i)
}

function tr(e, t, n, r, {
    once: i,
    capture: a,
    passive: o
} = {}) {
    let s = N(t => {
            !t.isTrusted && !t.__ddIsTrusted && !e.allowUntrustedEvents || (i && d(), r(t))
        }),
        c = o ? {
            capture: a,
            passive: o
        } : a,
        l = window.EventTarget && t instanceof EventTarget ? window.EventTarget.prototype : t,
        u = st(l, `addEventListener`);
    n.forEach(e => u.call(t, e, s, c));

    function d() {
        let e = st(l, `removeEventListener`);
        n.forEach(n => e.call(t, n, s, c))
    }
    return {
        stop: d
    }
}
var nr = {
    HIDDEN: `visibility_hidden`,
    UNLOADING: `before_unload`,
    PAGEHIDE: `page_hide`,
    FROZEN: `page_frozen`
};

function rr(e) {
    return new I(t => {
        if (b) return;
        let {
            stop: n
        } = tr(e, window, [`visibilitychange`, `freeze`], e => {
            e.type === `visibilitychange` && document.visibilityState === `hidden` ? t.notify({
                reason: nr.HIDDEN
            }) : e.type === `freeze` && t.notify({
                reason: nr.FROZEN
            })
        }, {
            capture: !0
        }), r = U(e, window, `beforeunload`, () => {
            t.notify({
                reason: nr.UNLOADING
            })
        }).stop;
        return () => {
            n(), r()
        }
    })
}

function ir(e) {
    return Le(nr).includes(e)
}
var ar = 256 * ut;

function or({
    encoder: e,
    request: t,
    flushController: n
}) {
    let r = {},
        i = n.flushObservable.subscribe(e => u(e));

    function o(t, i, a) {
        if (a !== void 0) {
            let o;
            r[a] === void 0 ? (n.notifyBeforeAddMessage(i), o = 0) : o = i - e.estimateEncodedBytesCount(r[a]), r[a] = t, n.notifyAfterAddMessage(o)
        } else n.notifyBeforeAddMessage(i), e.write(e.isEmpty ? t : `\n${t}`, e => {
            n.notifyAfterAddMessage(e - i)
        })
    }

    function l(t, n) {
        let r = gt(t),
            i = e.estimateEncodedBytesCount(r);
        if (i >= ar) {
            a.warn(`Discarded a message whose size was bigger than the maximum allowed size ${ar/ut}KiB. ${c} ${s}/#technical-limitations`);
            return
        }
        o(r, i, n)
    }

    function u(n) {
        let i = Le(r).join(`
`);
        r = {};
        let a = ir(n.reason),
            o = a ? t.sendOnExit : t.send;
        if (a && e.isAsync) {
            let t = e.finishSync();
            t.outputBytesCount && o(sr(t));
            let n = [t.pendingData, i].filter(Boolean).join(`
`);
            n && o({
                data: n,
                bytesCount: pt(n)
            })
        } else i && e.write(e.isEmpty ? i : `\n${i}`), e.finish(e => {
            o(sr(e))
        })
    }
    return {
        flushController: n,
        add: l,
        upsert: l,
        stop: i.unsubscribe
    }
}

function sr(e) {
    let t;
    return t = typeof e.output == `string` ? e.output : new Blob([e.output], {
        type: `text/plain`
    }), {
        data: t,
        bytesCount: e.outputBytesCount,
        encoding: e.encoding
    }
}
var cr = 30 * x,
    lr = b ? 1 : 50;

function ur({
    pageMayExitObservable: e,
    sessionExpireObservable: t
}) {
    let n, r = new I,
        i = e.subscribe(e => {
            n = e.reason;
            try {
                r.notify(e.reason)
            } finally {
                n = void 0
            }
            l(e.reason)
        }),
        a = t.subscribe(() => l(`session_expire`)),
        o = new I(() => () => {
            i.unsubscribe(), a.unsubscribe()
        }),
        s = 0,
        c = 0;

    function l(e) {
        if (c === 0) return;
        let t = c,
            n = s;
        c = 0, s = 0, f(), o.notify({
            reason: e,
            messagesCount: t,
            bytesCount: n
        })
    }
    let u;

    function d() {
        u === void 0 && (u = R(() => {
            l(`duration_limit`)
        }, cr))
    }

    function f() {
        z(u), u = void 0
    }
    return {
        flushObservable: o,
        preparePageExitFlushObservable: r,
        get messagesCount() {
            return c
        },
        notifyBeforeAddMessage(e) {
            s + e >= Gn && l(n ? ? `bytes_limit`), c += 1, s += e, d()
        },
        notifyAfterAddMessage(e = 0) {
            s += e, c >= lr ? l(n ? ? `messages_limit`) : s >= Gn && l(n ? ? `bytes_limit`)
        }
    }
}

function dr() {
    let e = ``,
        t = 0;
    return {
        isAsync: !1,
        get isEmpty() {
            return !e
        },
        write(n, r) {
            let i = pt(n);
            t += i, e += n, r && r(i)
        },
        finish(e) {
            e(this.finishSync())
        },
        finishSync() {
            let n = {
                output: e,
                outputBytesCount: t,
                rawBytesCount: t,
                pendingData: ``
            };
            return e = ``, t = 0, n
        },
        estimateEncodedBytesCount(e) {
            return e.length
        }
    }
}
var fr = `DISCARDED`,
    W = `SKIPPED`;

function pr() {
    let e = {};
    return {
        register(t, n) {
            return e[t] || (e[t] = []), e[t].push(n), {
                unregister: () => {
                    e[t] = e[t].filter(e => e !== n)
                }
            }
        },
        triggerHook(t, n) {
            let r = e[t] || [],
                i = [];
            for (let e of r) {
                let t = e(n);
                if (t === `DISCARDED`) return fr;
                t !== `SKIPPED` && i.push(t)
            }
            return En(...i)
        }
    }
}
var mr = {
        LOG: `log`,
        CONFIGURATION: `configuration`,
        USAGE: `usage`
    },
    hr = [`https://www.datadoghq-browser-agent.com`, `https://www.datad0g-browser-agent.com`, `https://d3uc069fcn7uxw.cloudfront.net`, `https://d20xtzwzcl0ceb.cloudfront.net`, `http://localhost`, `<anonymous>`],
    gr = 1,
    _r = [bn, xn],
    vr = 15,
    yr;

function br() {
    return yr || = new ot(100), yr
}

function xr(e, t, n) {
    let r = new I,
        {
            enabled: i,
            metricsEnabled: a
        } = Sr(e, t, n, r),
        {
            stop: o
        } = Cr(t, r);
    return {
        stop: o,
        enabled: i,
        metricsEnabled: a
    }
}

function Sr(e, t, n, r, i = gr, a = vr) {
    let o = {},
        s = !_r.includes(t.site) && u(t.telemetrySampleRate),
        c = {
            [mr.LOG]: s,
            [mr.CONFIGURATION]: s && u(t.telemetryConfigurationSampleRate),
            [mr.USAGE]: s && u(t.telemetryUsageSampleRate),
            metric: s && u(i)
        },
        l = wr(),
        d = br();
    return d.subscribe(({
        rawEvent: t,
        metricName: i
    }) => {
        if (i && !c.metric || !c[t.type]) return;
        let s = i || t.status || t.type,
            u = o[s];
        if (u || = o[s] = new Set, u.size >= a) return;
        let d = gt(t);
        if (u.has(d)) return;
        let p = n.triggerHook(1, {
            startTime: D().relative
        });
        if (p === `DISCARDED`) return;
        let m = f(p, e, t, l);
        r.notify(m), Cn(`telemetry`, m), u.add(d)
    }), d.unbuffer(), tt(Dr), {
        enabled: s,
        metricsEnabled: c.metric
    };

    function f(e, n, r, i) {
        return En({
            type: `telemetry`,
            date: D().timeStamp,
            service: n,
            version: `7.1.0`,
            source: `browser`,
            _dd: {
                format_version: 2
            },
            telemetry: En(r, {
                runtime_env: i,
                connectivity: On(),
                sdk_setup: `npm`
            }),
            ddtags: pn(t).join(`,`),
            experimental_features: Array.from(fn())
        }, e)
    }
}

function Cr(e, t) {
    let n = [];
    if ($n()) {
        let e = Zn(),
            r = t.subscribe(t => e.send(`internal_telemetry`, t));
        n.push(r.unsubscribe)
    } else {
        let r = [e.rumEndpointBuilder];
        e.replica && Tr(e) && r.push(e.replica.rumEndpointBuilder);
        let i = or({
            encoder: dr(),
            request: Kn(r, B),
            flushController: ur({
                pageMayExitObservable: rr(e),
                sessionExpireObservable: new I
            })
        });
        n.push(i.stop);
        let a = t.subscribe(i.add);
        n.push(a.unsubscribe)
    }
    return {
        stop: () => n.forEach(e => e())
    }
}

function wr() {
    return {
        is_local_file: y.location ? .protocol === `file:`,
        is_worker: b
    }
}

function Tr(e) {
    return e.site === _n
}

function Er(e, n) {
    rt(t.debug, e, n), br().notify({
        rawEvent: {
            type: mr.LOG,
            message: e,
            status: `debug`,
            ...n
        }
    })
}

function Dr(e, t) {
    br().notify({
        rawEvent: {
            type: mr.LOG,
            status: `error`,
            ...Ar(e),
            ...t
        }
    })
}

function Or(e) {
    br().notify({
        rawEvent: {
            type: mr.CONFIGURATION,
            configuration: e
        }
    })
}

function kr(e, t) {
    br().notify({
        rawEvent: {
            type: mr.LOG,
            message: e,
            status: `debug`,
            ...t
        },
        metricName: e
    })
}

function G(e) {
    br().notify({
        rawEvent: {
            type: mr.USAGE,
            usage: e
        }
    })
}

function Ar(e) {
    if (on(e)) {
        let t = At(e);
        return {
            error: {
                kind: t.name,
                stack: Zt(jr(t))
            },
            message: t.message
        }
    }
    return {
        error: {
            stack: $t
        },
        message: `Uncaught ${gt(e)}`
    }
}

function jr(e) {
    return e.stack = e.stack.filter(e => !e.url || hr.some(t => e.url.startsWith(t))), e
}

function Mr(e, t, n) {
    let r = L(window.cookieStore);
    return r ? Nr(e, t, n, r) : Fr(e, n)
}

function Nr(e, t, n, r) {
    let i = new I(() => U(t, r, `change`, t => {
        (t.changed.some(t => t.name === e) || t.deleted.some(t => t.name === e)) && i.notify()
    }).stop);
    return {
        async getAll() {
            return (await r.getAll(e)).map(e => e.value)
        },
        async getAllAndSet(t) {
            let i = await r.getAll(e),
                {
                    value: a,
                    expireDelay: o
                } = t(i.map(e => e.value));
            try {
                await r.set({
                    name: e,
                    value: a,
                    expires: w() + o,
                    path: `/`,
                    sameSite: n.crossSite ? `none` : `strict`,
                    domain: n.domain,
                    secure: n.secure,
                    partitioned: n.partitioned
                })
            } catch (t) {
                let r = Oe(e);
                Er(`Failed to set cookie using Cookie Store API`, {
                    "error.message": t.message,
                    newValue: a,
                    cookieOptions: { ...n
                    },
                    cookies: i.map(e => ({ ...e
                    })),
                    cookieCount: i.length,
                    documentCookies: r
                })
            }
        },
        observable: i
    }
}
var Pr = x;

function Fr(e, t) {
    let n = Oe(e),
        r = new I(() => {
            let t = ct(() => {
                i(Oe(e))
            }, Pr);
            return () => {
                lt(t)
            }
        });

    function i(e) {
        String(e) !== String(n) && (n = e, r.notify())
    }
    return {
        getAll() {
            return Promise.resolve(Oe(e))
        },
        async getAllAndSet(n) {
            let {
                value: r,
                expireDelay: a
            } = n(Oe(e));
            Ee(e, r, a, t), await Promise.resolve(), i([r])
        },
        observable: r
    }
}
var Ir = `_dd_s_v2`,
    Lr = `_dd_s`,
    Rr = 0;

function zr(e) {
    let t = Wr(e);
    return t && Me(t) ? {
        type: j.COOKIE,
        cookieOptions: t
    } : void 0
}
var Br;

function Vr(e, t) {
    let n = new I,
        r = !!t.trackAnonymousUser,
        i = Gr(e),
        a = L(Mr)(Ir, t, e),
        o = !0;
    a.observable.subscribe(() => {
        a.getAll().then(e => {
            n.notify({
                cookieValues: e,
                sessionState: Hr(e, i)
            })
        }).catch(F)
    });

    function s(t) {
        return a.getAllAndSet(n => {
            let a = Hr(n, i);
            return o && _(a) && (a = Hr(Oe(Lr), i)), o = !1, {
                value: Ur(t(a), e),
                expireDelay: r ? me : fe
            }
        })
    }
    return {
        async setSessionState(e) {
            typeof navigator < `u` && navigator.locks ? await navigator.locks.request(Ir, () => s(e)) : (Br = (Br ? ? Promise.resolve()).then(() => s(e)), await Br)
        },
        sessionObservable: n
    }
}

function Hr(e, t) {
    let n;
    for (let r of e.slice().reverse())
        if (n = Ye(r), n.c === t) break;
    return delete n ? .c, n ? ? {}
}

function Ur(e, t) {
    return Je(_(e) ? e : { ...e,
        c: Gr(t)
    })
}

function Wr(e) {
    let t = {};
    if (t.secure = !!e.useSecureSessionCookie || !!e.usePartitionedCrossSiteSessionCookie, t.crossSite = !!e.usePartitionedCrossSiteSessionCookie, t.partitioned = !!e.usePartitionedCrossSiteSessionCookie, e.trackSessionAcrossSubdomains) {
        let e = Pe();
        if (!e) return;
        t.domain = e
    }
    return t
}

function Gr(e) {
    let t = e.domain ? e.domain.split(`.`).length - 1 : 0,
        n = 0;
    return n |= Rr << 5, n |= t << 1, n |= +!!e.crossSite, n.toString(16)
}
var Kr = `_dd_test_`;

function qr() {
    try {
        let e = M(),
            t = `${Kr}${e}`;
        localStorage.setItem(t, e);
        let n = localStorage.getItem(t);
        return localStorage.removeItem(t), e === n ? {
            type: j.LOCAL_STORAGE
        } : void 0
    } catch {
        return
    }
}

function Jr(e) {
    let t = new I(t => U(e, window, `storage`, e => {
            e.key === `_dd_s_v2` && e.storageArea === localStorage && t.notify({
                sessionState: Ye(e.newValue)
            })
        }).stop),
        n = !0;
    return {
        async setSessionState(e) {
            let r = Ye(localStorage.getItem(Ir));
            n && We(r) && (r = Ye(localStorage.getItem(Lr))), n = !1;
            let i = e(r);
            localStorage.setItem(Ir, Je(i)), await Promise.resolve(), t.notify({
                sessionState: i
            })
        },
        sessionObservable: t
    }
}
var Yr = `_DD_SESSION`;

function Xr() {
    return {
        type: j.MEMORY
    }
}

function Zr() {
    let e = v();
    e._DD_SESSION || (e[Yr] = {});
    let t = e[Yr],
        n = new I,
        r = t.onChange;
    return t.onChange = e => {
        r ? .(e), n.notify({
            sessionState: e
        })
    }, {
        async setSessionState(e) {
            let n = h(e(t.state ? ? {}));
            t.state = n, await Promise.resolve(), t.onChange ? .(n)
        },
        sessionObservable: n
    }
}

function Qr(e) {
    let {
        sessionPersistence: t
    } = e, n = $r(t);
    for (let t of n) {
        let n = ei(t, e);
        if (n !== void 0) return n
    }
}

function $r(e) {
    return Array.isArray(e) ? e : e === void 0 ? b ? [j.MEMORY] : [j.COOKIE] : [e]
}

function ei(e, t) {
    switch (e) {
        case j.COOKIE:
            return zr(t);
        case j.LOCAL_STORAGE:
            return qr();
        case j.MEMORY:
            return Xr();
        default:
            a.error(`Invalid session persistence '${String(e)}'`);
            return
    }
}

function ti(e, t) {
    switch (e.type) {
        case j.COOKIE:
            return Vr(e.cookieOptions, t);
        case j.LOCAL_STORAGE:
            return Jr(t);
        case j.MEMORY:
            return Zr()
    }
}
var ni = {
    GRANTED: `granted`,
    NOT_GRANTED: `not-granted`
};

function ri(e) {
    let t = new I;

    function n() {
        return e === ni.GRANTED
    }
    return {
        tryToInit(t) {
            e || = t
        },
        onGrantedOnce(e) {
            if (n()) e();
            else {
                let r = t.subscribe(() => {
                    n() && (e(), r.unsubscribe())
                })
            }
        },
        update(n) {
            e = n, t.notify()
        },
        isGranted: n,
        observable: t
    }
}

function ii(e) {
    let t = Dt(e);
    return t === `string` || t === `function` || e instanceof RegExp
}

function ai(e, t, n = !1) {
    return e.some(e => {
        try {
            if (typeof e == `function`) return e(t);
            if (e instanceof RegExp) return e.lastIndex = 0, e.test(t);
            if (typeof e == `string`) return n ? t.startsWith(e) : e === t
        } catch (e) {
            a.error(e)
        }
        return !1
    })
}
var oi = [`chrome-extension://`, `moz-extension://`];

function si(e) {
    return oi.some(t => e.includes(t))
}

function ci(e, t = ``) {
    return si(e) ? !1 : si(t.split(`
`).filter(e => {
        let t = e.trim();
        return t.length && /^at\s+|@/.test(t)
    })[1] || ``)
}
var li = "Running the Browser SDK in a Web extension content script is forbidden unless the `allowedTrackingOrigins` option is provided.",
    ui = `SDK initialized on a non-allowed domain.`;

function di(e, t) {
    let n = L(v().location),
        r = n ? n.origin : ``,
        i = e.allowedTrackingOrigins;
    if (!i) return ci(r, t) ? (a.error(li), !1) : !0;
    let o = ai(i, r);
    return o || a.error(ui), o
}

function fi(e, t, n) {
    let r = pi(e, t);
    return {
        build(i, a) {
            return r(hi(e, t, i, a, n))
        },
        trackType: t
    }
}

function pi(e, t) {
    let n = `/api/v2/${t}`,
        r = e.proxy;
    if (typeof r == `string`) {
        let e = be(r);
        return t => `${e}?ddforward=${encodeURIComponent(`${n}?${t}`)}`
    }
    if (typeof r == `function`) return e => r({
        path: n,
        parameters: e
    });
    let i = mi(e);
    return e => `https://${i}${n}?${e}`
}

function mi(e) {
    let {
        site: t = vn
    } = e, n = t.split(`.`), r = n.pop();
    return `browser-intake-${n.join(`-`)}.${r}`
}

function hi({
    clientToken: e,
    source: t = `browser`
}, n, r, {
    retry: i,
    encoding: a
}, o = []) {
    let s = [`ddsource=${t}`, `dd-api-key=${e}`, `dd-evp-origin-version=7.1.0`, `dd-evp-origin=browser`, `dd-request-id=${M()}`].concat(o);
    return a && s.push(`dd-evp-encoding=${a}`), n === `rum` && (s.push(`batch_time=${T()}`, `_dd.api=${r}`), i && s.push(`_dd.retry_count=${i.count}`, `_dd.retry_after=${i.lastFailureStatus}`)), s.join(`&`)
}

function gi(e) {
    let t = e.site || `datadoghq.com`,
        n = _i(e.source),
        r = vi({ ...e,
            site: t,
            source: n
        });
    return {
        replica: yi({ ...e,
            site: t,
            source: n
        }),
        site: t,
        source: n,
        ...r
    }
}

function _i(e) {
    return e === `flutter` || e === `unity` ? e : `browser`
}

function vi(e) {
    return {
        logsEndpointBuilder: fi(e, `logs`),
        rumEndpointBuilder: fi(e, `rum`),
        profilingEndpointBuilder: fi(e, `profile`),
        sessionReplayEndpointBuilder: fi(e, `replay`),
        exposuresEndpointBuilder: fi(e, `exposures`),
        flagEvaluationEndpointBuilder: fi(e, `flagevaluation`)
    }
}

function yi(e) {
    if (!e.replica) return;
    let t = { ...e,
        site: vn,
        clientToken: e.replica.clientToken
    };
    return {
        logsEndpointBuilder: fi(t, `logs`),
        rumEndpointBuilder: fi(t, `rum`, [`application.id=${e.replica.applicationId}`])
    }
}

function bi(e) {
    return Sn.every(t => e.includes(t))
}
var xi = {
        ALLOW: `allow`,
        MASK: `mask`,
        MASK_USER_INPUT: `mask-user-input`,
        MASK_UNLESS_ALLOWLISTED: `mask-unless-allowlisted`
    },
    Si = {
        ALL: `all`,
        SAMPLED: `sampled`
    };

function Ci(e, t) {
    return e != null && typeof e != `string` ? (a.error(`${t} must be defined as a string`), !1) : !0
}

function wi(e) {
    return e && typeof e == `string` && !/(datadog|ddog|datad0g|dd0g)/.test(e) ? (a.error(`Site should be a valid Datadog site. ${c} ${o}/getting_started/site/.`), !1) : !0
}

function Ti(e, t) {
    return e !== void 0 && !f(e) ? (a.error(`${t} Sample Rate should be a number between 0 and 100`), !1) : !0
}

function Ei(e, t) {
    if (!e || !e.clientToken) {
        a.error(`Client Token is not configured, we will not send any data.`);
        return
    }
    if (e.allowedTrackingOrigins !== void 0 && !Array.isArray(e.allowedTrackingOrigins)) {
        a.error(`Allowed Tracking Origins must be an array`);
        return
    }
    if (!(!wi(e.site) || !Ti(e.sessionSampleRate, `Session`) || !Ti(e.telemetrySampleRate, `Telemetry`) || !Ti(e.telemetryConfigurationSampleRate, `Telemetry Configuration`) || !Ti(e.telemetryUsageSampleRate, `Telemetry Usage`) || !Ci(e.version, `Version`) || !Ci(e.env, `Env`) || !Ci(e.service, `Service`) || !di(e, t ? ? ``))) {
        if (e.trackingConsent !== void 0 && !g(ni, e.trackingConsent)) {
            a.error(`Tracking Consent should be either "granted" or "not-granted"`);
            return
        }
        return {
            beforeSend: e.beforeSend && l(e.beforeSend, `beforeSend threw an error:`),
            sessionStoreStrategyType: Qr(e),
            sessionSampleRate: e.sessionSampleRate ? ? 100,
            telemetrySampleRate: e.telemetrySampleRate ? ? 20,
            telemetryConfigurationSampleRate: e.telemetryConfigurationSampleRate ? ? 5,
            telemetryUsageSampleRate: e.telemetryUsageSampleRate ? ? 5,
            service: e.service ? ? void 0,
            env: e.env ? ? void 0,
            version: e.version ? ? void 0,
            datacenter: e.datacenter ? ? void 0,
            silentMultipleInit: !!e.silentMultipleInit,
            allowUntrustedEvents: !!e.allowUntrustedEvents,
            trackingConsent: e.trackingConsent ? ? ni.GRANTED,
            trackAnonymousUser: e.trackAnonymousUser ? ? !0,
            storeContextsAcrossPages: !!e.storeContextsAcrossPages,
            variant: e.variant,
            sdkVersion: e.sdkVersion,
            ...gi(e)
        }
    }
}

function Di(e) {
    return {
        session_sample_rate: e.sessionSampleRate,
        telemetry_sample_rate: e.telemetrySampleRate,
        telemetry_configuration_sample_rate: e.telemetryConfigurationSampleRate,
        telemetry_usage_sample_rate: e.telemetryUsageSampleRate,
        use_before_send: !!e.beforeSend,
        use_partitioned_cross_site_session_cookie: e.usePartitionedCrossSiteSessionCookie,
        use_secure_session_cookie: e.useSecureSessionCookie,
        use_proxy: !!e.proxy,
        silent_multiple_init: e.silentMultipleInit,
        track_session_across_subdomains: e.trackSessionAcrossSubdomains,
        track_anonymous_user: e.trackAnonymousUser,
        session_persistence: Array.isArray(e.sessionPersistence) ? e.sessionPersistence[0] : e.sessionPersistence,
        store_contexts_across_pages: !!e.storeContextsAcrossPages,
        allow_untrusted_events: !!e.allowUntrustedEvents,
        tracking_consent: e.trackingConsent,
        use_allowed_tracking_origins: Array.isArray(e.allowedTrackingOrigins),
        source: e.source,
        sdk_version: e.sdkVersion,
        variant: e.variant
    }
}

function K(e, t, n, {
    computeHandlingStack: r
} = {}) {
    let i = e[t];
    if (typeof i != `function`)
        if (t in e && typeof t == `string` && t.startsWith(`on`)) i = B;
        else return {
            stop: B
        };
    let a = !1,
        o = function() {
            if (a) return i.apply(this, arguments);
            let e = Array.from(arguments),
                t;
            P(n, null, [{
                target: this,
                parameters: e,
                onPostCall: e => {
                    t = e
                },
                handlingStack: r ? Xt(`instrumented method`) : void 0
            }]);
            let o = i.apply(this, e);
            return t && P(t, null, [o]), o
        };
    return e[t] = o, {
        stop: () => {
            a = !0, e[t] === o && (e[t] = i)
        }
    }
}

function Oi() {
    return new I(e => {
        let t = (t, n) => {
                let r = tn({
                    stackTrace: n,
                    originalError: t,
                    startClocks: D(),
                    nonErrorPrefix: `Uncaught`,
                    source: Mn.SOURCE,
                    handling: `unhandled`
                });
                e.notify(r)
            },
            {
                stop: n
            } = ki(t),
            {
                stop: r
            } = Ai(t);
        return () => {
            n(), r()
        }
    })
}

function ki(e) {
    return K(v(), `onerror`, ({
        parameters: [t, n, r, i, a]
    }) => {
        let o;
        on(a) || (o = Wt(t, n, r, i)), e(a ? ? t, o)
    })
}

function Ai(e) {
    return K(v(), `onunhandledrejection`, ({
        parameters: [t]
    }) => {
        e(t.reason || `Empty reason`)
    })
}

function ji(e) {
    let t = {
        version: `7.1.0`,
        onReady(e) {
            e()
        },
        ...e
    };
    return Object.defineProperty(t, "_setDebug", {
        get() {
            return nt
        },
        enumerable: !1
    }), t
}

function Mi(e, t, n) {
    let r = e[t];
    r && !r.q && r.version && a.warn(`SDK is loaded more than once. This is unsupported and might have unexpected behavior.`), e[t] = n, r && r.q && r.q.forEach(e => l(e, `onReady callback threw an error:`)())
}

function Ni(e, t) {
    t.silentMultipleInit || a.error(`${e} is already initialized.`)
}
var Pi = {
    intervention: `intervention`,
    deprecation: `deprecation`,
    cspViolation: `csp_violation`
};

function Fi(e, t) {
    let n = [];
    t.includes(Pi.cspViolation) && n.push(Li(e));
    let r = t.filter(e => e !== Pi.cspViolation);
    return r.length && n.push(Ii(r)), at(...n)
}

function Ii(e) {
    return new I(t => {
        if (!window.ReportingObserver) return;
        let n = N((e, n) => e.forEach(e => t.notify(Ri(e)))),
            r = new window.ReportingObserver(n, {
                types: e,
                buffered: !0
            });
        return r.observe(), () => {
            r.disconnect()
        }
    })
}

function Li(e) {
    return new I(t => {
        let {
            stop: n
        } = U(e, document, `securitypolicyviolation`, e => {
            t.notify(zi(e))
        });
        return n
    })
}

function Ri(e) {
    let {
        type: t,
        body: n
    } = e;
    return Bi({
        type: n.id,
        message: `${t}: ${n.message}`,
        originalError: e,
        stack: Vi(n.id, n.message, n.sourceFile, n.lineNumber, n.columnNumber)
    })
}

function zi(e) {
    let t = `'${e.blockedURI}' blocked by '${e.effectiveDirective}' directive`;
    return Bi({
        type: e.effectiveDirective,
        message: `${Pi.cspViolation}: ${t}`,
        originalError: e,
        csp: {
            disposition: e.disposition
        },
        stack: Vi(e.effectiveDirective, e.originalPolicy ? `${t} of the policy "${ye(e.originalPolicy,100,`...`)}"` : `no policy`, e.sourceFile, e.lineNumber, e.columnNumber)
    })
}

function Bi(e) {
    return {
        startClocks: D(),
        source: Mn.REPORT,
        handling: `unhandled`,
        ...e
    }
}

function Vi(e, t, n, r, i) {
    return n ? Zt({
        name: e,
        message: t,
        stack: [{
            func: `?`,
            url: n,
            line: r ? ? void 0,
            column: i ? ? void 0
        }]
    }) : void 0
}

function Hi(e, t) {
    let n = e.indexOf(t);
    n >= 0 && e.splice(n, 1)
}

function Ui(e) {
    return Array.isArray(e) && e.length > 0
}
var Wi = 1 / 0,
    Gi = S,
    Ki, qi = new Set;

function Ji() {
    qi.forEach(e => e())
}

function Yi({
    expireDelay: e,
    maxEntries: t
}) {
    let n = [];
    Ki || = ct(() => Ji(), Gi);
    let r = () => {
        let t = E() - e;
        for (; n.length > 0 && n[n.length - 1].endTime < t;) n.pop()
    };
    qi.add(r);

    function i(e, r) {
        let i = {
            value: e,
            startTime: r,
            endTime: Wi,
            remove: () => {
                Hi(n, i)
            },
            close: e => {
                i.endTime = e
            }
        };
        return t && n.length >= t && n.pop(), n.unshift(i), i
    }

    function a(e = Wi, t = {
        returnInactive: !1
    }) {
        for (let r of n)
            if (r.startTime <= e) {
                if (t.returnInactive || e <= r.endTime) return r.value;
                break
            }
    }

    function o(e) {
        let t = n[0];
        t && t.endTime === Wi && t.close(e)
    }

    function s(e = Wi, t = 0) {
        let r = ce(e, t);
        return n.filter(t => t.startTime <= r && e <= t.endTime).map(e => e.value)
    }

    function c(e) {
        return n.filter(t => t.startTime === e)
    }

    function l() {
        n = []
    }

    function u() {
        qi.delete(r), qi.size === 0 && Ki && (lt(Ki), Ki = void 0)
    }
    return {
        add: i,
        find: a,
        closeActive: o,
        findAll: s,
        getEntries: c,
        reset: l,
        stop: u
    }
}

function Xi(e, t) {
    return e * t / 100
}
var Zi = new Map;

function Qi(e, t) {
    if (t === 100) return !0;
    if (t === 0) return !1;
    let n = Zi.get(t);
    if (n && e === n.sessionId) return n.decision;
    let r = $i(BigInt(`0x${e.split(`-`)[4]}`), t);
    return Zi.set(t, {
        sessionId: e,
        decision: r
    }), r
}

function $i(e, t) {
    let n = 2 n ** 64 n,
        r = e * 1111111111111111111 n % n;
    return Number(r) <= t / 100 * Number(n)
}
var ea = S,
    ta = fe,
    na = te * 12,
    ra = [];
async function ia(e, t) {
    let n = E(),
        r = new I,
        i = new I,
        o;
    if (!e.sessionStoreStrategyType) {
        a.warn(`No storage available for session. We will not send any data.`);
        return
    }
    let s = L(ti)(e.sessionStoreStrategyType, e),
        c = Yi({
            expireDelay: ta
        });
    ra.push(() => c.stop());
    let l = !1,
        {
            throttled: u,
            cancel: d
        } = ht(() => {
            l = !1, s.setSessionState(t => Ze(t, e)).catch(F)
        }, x);
    ra.push(d);
    let f;
    ra.push(() => z(f));
    let p = !1;
    ra.push(() => {
        p = !0
    });
    let m = await h().catch(F);
    if (!m || p) return;
    if (!t.isGranted()) {
        S();
        return
    }
    return c.add(te(m), se().relative), _(m), g(), ee(), kr(`Session manager init metrics`, {
        metrics: {
            duration: O(n, E())
        }
    }), v();
    async function h() {
        let t = {};
        return await s.setSessionState(n => (t = Ze(Xe(n, e), e), t)), t
    }

    function g() {
        let e = s.sessionObservable.subscribe(({
            cookieValues: e,
            sessionState: t
        }) => {
            _(t), y(t, {
                from: `sessionObservable`,
                cookieValues: e
            })
        });
        ra.push(() => e.unsubscribe())
    }

    function _(n) {
        z(f);
        let r = He(n);
        r && (f = R(() => {
            s.setSessionState(n => Ge(n) ? (t.isGranted() || delete n.anonymousId, Ue(n, e)) : n).catch(F)
        }, r - w()))
    }

    function ee() {
        t.observable.subscribe(() => {
            t.isGranted() ? (l = !1, s.setSessionState(t => Ze(t, e)).catch(F)) : S()
        }), b || (oa(e, () => {
            t.isGranted() && u()
        }), sa(e, () => {
            l || s.setSessionState(e => Qe(e)).catch(F)
        }), ca(e, () => {
            s.setSessionState(t => Xe(t, e)).catch(F)
        }))
    }

    function v() {
        return {
            findSession: (e, t) => c.find(e, t),
            findTrackedSession: (t, n) => {
                let r = c.find(t, n);
                if (!(!r || r.id === `invalid` || !Qi(r.id, e.sessionSampleRate)) && !(w() - r.createdAt > na)) return r
            },
            renewObservable: r,
            expireObservable: i,
            expire: S,
            updateSessionState: e => {
                s.setSessionState(t => ({ ...t,
                    ...e
                })).catch(F)
            }
        }
    }

    function y(e, {
        from: t,
        cookieValues: n
    }) {
        let a = c.find(),
            s = a ? .id !== void 0,
            u = e.id !== void 0,
            d = s && u && a.id !== e.id;
        if (s && (!u || d) && (dn(H.SESSION_RENEWAL_DEBUG_CONTEXT) && (o = {
                previousSession: a && { ...a
                },
                newState: { ...e
                },
                from: t,
                cookieValues: n,
                cookies: Oe(Ir),
                locksAvailable: !!globalThis.navigator ? .locks,
                cookieStoreAvailable: !!globalThis.cookieStore
            }), l = !0, i.notify(), c.closeActive(E())), u && (!s || d)) {
            if (l) return;
            c.add(te(e), E()), r.notify(dn(H.SESSION_RENEWAL_DEBUG_CONTEXT) ? {
                expire: o,
                renew: {
                    previousSession: a && { ...a
                    },
                    newState: { ...e
                    },
                    from: t,
                    cookieValues: n,
                    cookies: Oe(Ir),
                    locksAvailable: !!globalThis.navigator ? .locks,
                    cookieStoreAvailable: !!globalThis.cookieStore
                }
            } : void 0)
        } else s && u && !d && (a.isReplayForced = !!e.forcedReplay)
    }

    function S() {
        d();
        let n = Ue(c.find(), e);
        t.isGranted() || delete n.anonymousId, y(n, {
            from: `expire`
        }), s.setSessionState(n => (t.isGranted() || delete n.anonymousId, Ue(n, e))).catch(F)
    }

    function te(e) {
        let t = Ve(e) ? ? T();
        return e.id ? {
            id: e.id,
            isReplayForced: !!e.forcedReplay,
            anonymousId: e.anonymousId,
            createdAt: t
        } : {
            id: `invalid`,
            isReplayForced: !1,
            anonymousId: void 0,
            createdAt: t
        }
    }
}

function aa() {
    let e = {
        id: M(),
        isReplayForced: !1,
        anonymousId: void 0,
        createdAt: T()
    };
    return Promise.resolve({
        findSession: () => e,
        findTrackedSession: () => e,
        renewObservable: new I,
        expireObservable: new I,
        expire: B,
        updateSessionState: t => {
            e = { ...e,
                ...t
            }
        }
    })
}

function oa(e, t) {
    let {
        stop: n
    } = tr(e, window, [`click`, `touchstart`, `keydown`, `scroll`], t, {
        capture: !0,
        passive: !0
    });
    ra.push(n)
}

function sa(e, t) {
    let n = () => {
            document.visibilityState === `visible` && t()
        },
        {
            stop: r
        } = U(e, document, `visibilitychange`, n);
    ra.push(r);
    let i = ct(n, ea);
    ra.push(() => {
        lt(i)
    })
}

function ca(e, t) {
    let {
        stop: n
    } = U(e, window, `resume`, t, {
        capture: !0
    });
    ra.push(n)
}
var la = class {
        constructor() {
            this.callbacks = {}
        }
        notify(e, t) {
            let n = this.callbacks[e];
            n && n.forEach(e => e(t))
        }
        subscribe(e, t) {
            return this.callbacks[e] || (this.callbacks[e] = []), this.callbacks[e].push(t), {
                unsubscribe: () => {
                    this.callbacks[e] = this.callbacks[e].filter(e => t !== e)
                }
            }
        }
    },
    ua = 3e3;

function da(e, t, n = ua) {
    let r = 0,
        i = !1;
    return {
        isLimitReached() {
            if (r === 0 && R(() => {
                    r = 0
                }, S), r += 1, r <= n || i) return i = !1, !1;
            if (r === n + 1) {
                i = !0;
                try {
                    t({
                        message: `Reached max number of ${e}s by minute: ${n}`,
                        source: Mn.AGENT,
                        startClocks: D()
                    })
                } finally {
                    i = !1
                }
            }
            return !0
        }
    }
}

function fa(e, t, n) {
    return document.readyState === t || document.readyState === `complete` ? (n(), {
        stop: B
    }) : U(e, window, t === `complete` ? `load` : `DOMContentLoaded`, n, {
        once: !0
    })
}
var pa, ma = new WeakMap;

function ha(e) {
    return pa || = ga(e), pa
}

function ga(e) {
    return `XMLHttpRequest` in y ? new I(t => {
        let {
            stop: n
        } = K(XMLHttpRequest.prototype, `open`, _a), {
            stop: r
        } = K(XMLHttpRequest.prototype, `send`, n => {
            va(n, e, t)
        }, {
            computeHandlingStack: !0
        }), {
            stop: i
        } = K(XMLHttpRequest.prototype, `abort`, ya);
        return () => {
            n(), r(), i()
        }
    }) : new I
}

function _a({
    target: e,
    parameters: [t, n]
}) {
    ma.set(e, {
        state: `open`,
        method: String(t).toUpperCase(),
        url: be(String(n))
    })
}

function va({
    target: e,
    parameters: [t],
    handlingStack: n
}, r, i) {
    let a = ma.get(e);
    if (!a) return;
    let o = a;
    o.state = `start`, o.startClocks = D(), o.isAborted = !1, o.xhr = e, o.handlingStack = n, o.requestBody = t;
    let s = !1,
        {
            stop: c
        } = K(e, `onreadystatechange`, () => {
            e.readyState === XMLHttpRequest.DONE && l()
        }),
        l = () => {
            if (u(), c(), s) return;
            s = !0;
            let t = a;
            t.duration = O(o.startClocks.timeStamp, T()), t.status = e.status, typeof e.response == `string` && (t.responseBody = e.response), i.notify({ ...t,
                state: `complete`
            })
        },
        {
            stop: u
        } = U(r, e, `loadend`, l);
    i.notify(o)
}

function ya({
    target: e
}) {
    let t = ma.get(e);
    t && (t.isAborted = !0)
}
async function ba(e) {
    let t = e.getReader(),
        n = [];
    for (;;) {
        let e = await t.read();
        if (e.done) break;
        n.push(e.value)
    }
    return t.cancel().catch(B), mt(n)
}
var xa, Sa = [];

function Ca({
    responseBodyAction: e
} = {}) {
    return e && Sa.push(e), xa || = wa(), xa
}

function wa() {
    return new I(e => {
        if (!y.fetch) return;
        let {
            stop: t
        } = K(y, `fetch`, t => Ta(t, e), {
            computeHandlingStack: !0
        });
        return t
    })
}

function Ta({
    parameters: e,
    onPostCall: t,
    handlingStack: n
}, r) {
    let [i, a] = e, o = a && a.method;
    o === void 0 && i instanceof Request && (o = i.method);
    let s = o === void 0 ? `GET` : String(o).toUpperCase(),
        c = i instanceof Request ? i.url : be(String(i)),
        l = {
            state: `start`,
            init: a,
            input: i,
            method: s,
            startClocks: D(),
            url: c,
            handlingStack: n,
            isAbortedOnStart: i instanceof Request && i.signal ? .aborted || a ? .signal ? .aborted || !1
        };
    r.notify(l), e[0] = l.input, e[1] = l.init, t(e => {
        Ea(r, e, l).catch(F)
    })
}
async function Ea(e, t, n) {
    let r = n,
        i;
    try {
        i = await t
    } catch (t) {
        e.notify({ ...r,
            state: `resolve`,
            status: 0,
            isAborted: r.init ? .signal ? .aborted || t instanceof DOMException && t.code === DOMException.ABORT_ERR,
            error: t
        });
        return
    }
    if (r.response = i, r.status = i.status, r.responseType = i.type, r.isAborted = !1, Sa.reduce((e, t) => Math.max(e, t(r)), 0) === 1) {
        let e = jn(i);
        if (e && e.body) try {
            let t = await ba(e.body);
            r.responseBody = new TextDecoder().decode(t)
        } catch {}
    }
    e.notify({ ...r,
        state: `resolve`
    })
}

function Da(e, t) {
    if (window.requestIdleCallback && window.cancelIdleCallback) {
        let n = window.requestIdleCallback(N(e), t);
        return () => window.cancelIdleCallback(n)
    }
    return Oa(e)
}

function Oa(e) {
    let t = w(),
        n = R(() => {
            e({
                didTimeout: !1,
                timeRemaining: () => Math.max(0, 50 - (w() - t))
            })
        }, 0);
    return () => z(n)
}
var ka = x;

function Aa() {
    let e = [];

    function t(t) {
        let r;
        if (!t || t.didTimeout) {
            let e = performance.now();
            r = () => 30 - (performance.now() - e)
        } else r = t.timeRemaining.bind(t);
        for (; r() > 0 && e.length;) e.shift()();
        e.length && n()
    }

    function n() {
        Da(t, {
            timeout: ka
        })
    }
    return {
        push(t) {
            e.push(t) === 1 && n()
        },
        stop() {
            e.length = 0
        }
    }
}
var ja = {};

function Ma(e) {
    return at(...e.map(e => (ja[e] || (ja[e] = Na(e)), ja[e])))
}

function Na(e) {
    return new I(t => {
        let r = n[e];
        return n[e] = (...n) => {
            r.apply(console, n);
            let i = Xt(`console error`);
            P(() => {
                t.notify(Pa(n, e, i))
            })
        }, () => {
            n[e] = r
        }
    })
}

function Pa(e, n, r) {
    let i = e.map(e => Fa(e)).join(` `);
    if (n === t.error) {
        let t = tn({
            originalError: e.find(on),
            handlingStack: r,
            startClocks: D(),
            source: Mn.CONSOLE,
            handling: `handled`,
            nonErrorPrefix: `Provided`,
            useFallbackStack: !1
        });
        return t.message = i, {
            api: n,
            message: i,
            handlingStack: r,
            error: t
        }
    }
    return {
        api: n,
        message: i,
        error: void 0,
        handlingStack: r
    }
}

function Fa(e) {
    return typeof e == `string` ? V(e) : on(e) ? Qt(At(e)) : gt(V(e), void 0, 2)
}

function Ia(e) {
    let t = Dt(e) === `object`;
    return t || a.error(`Unsupported context:`, e), t
}

function La(e, t, n) {
    let r = { ...e
    };
    for (let [e, {
            required: i,
            type: o
        }] of Object.entries(t)) o === `string` && !Ra(r[e]) && (r[e] = String(r[e])), i && Ra(r[e]) && a.warn(`The property ${e} of ${n} is required; context will not be sent to the intake.`);
    return r
}

function Ra(e) {
    return e == null || e === ``
}

function za(e = ``, {
    propertiesConfig: t = {}
} = {}) {
    let n = {},
        r = new I,
        i = {
            getContext: () => Tn(n),
            setContext: a => {
                Ia(a) ? n = V(La(a, t, e)) : i.clearContext(), r.notify()
            },
            setContextProperty: (i, a) => {
                n = V(La({ ...n,
                    [i]: a
                }, t, e)), r.notify()
            },
            removeContextProperty: i => {
                delete n[i], La(n, t, e), r.notify()
            },
            clearContext: () => {
                n = {}, r.notify()
            },
            changeObservable: r
        };
    return i
}

function q(e, t, n, r) {
    return N((...i) => (r && G({
        feature: r
    }), e()[t][n](...i)))
}

function Ba(e, t, n) {
    e.changeObservable.subscribe(() => {
        let r = e.getContext();
        n.notify(e => e[t].setContext(r))
    })
}
var Va = `_dd_c`,
    Ha = [];

function Ua(e, t, n, r) {
    let i = Wa(n, r);
    Ha.push(U(e, window, `storage`, ({
        key: e
    }) => {
        i === e && o()
    })), t.changeObservable.subscribe(s);
    let a = En(c(), t.getContext());
    _(a) || t.setContext(a);

    function o() {
        t.setContext(c())
    }

    function s() {
        localStorage.setItem(i, JSON.stringify(t.getContext()))
    }

    function c() {
        let e = localStorage.getItem(i);
        return e ? JSON.parse(e) : {}
    }
}

function Wa(e, t) {
    return `${Va}_${e}_${t}`
}

function Ga(e, t, n) {
    let r = Ka();
    return t.storeContextsAcrossPages && Ua(t, r, n, 4), e.register(0, () => {
        let e = r.getContext();
        return _(e) || !e.id ? W : {
            account: e
        }
    }), r
}

function Ka() {
    return za(`account`, {
        propertiesConfig: {
            id: {
                type: `string`,
                required: !0
            },
            name: {
                type: `string`
            }
        }
    })
}
var qa = `_dd_tab_id`,
    Ja;

function Ya(e) {
    let t = Xa();
    e.register(0, () => ({
        tab: {
            id: t
        }
    }))
}

function Xa() {
    return Ja || = Za() ? ? M(), Ja
}

function Za() {
    try {
        let e = sessionStorage.getItem(qa);
        if (e) return e;
        let t = M();
        return sessionStorage.setItem(qa, t), t
    } catch {
        return
    }
}

function Qa(e, t, n, r) {
    let i = $a();
    return t.storeContextsAcrossPages && Ua(t, i, n, 2), e.register(0, () => {
        let e = i.getContext();
        return r ? {
            context: e
        } : e
    }), i
}

function $a() {
    return za(`global context`)
}

function eo(e, t, n, r) {
    let i = to();
    return t.storeContextsAcrossPages && Ua(t, i, r, 1), e.register(0, ({
        eventType: e,
        startTime: r
    }) => {
        let a = i.getContext(),
            o = n.findTrackedSession(r);
        return o && o.anonymousId && !a.anonymous_id && t.trackAnonymousUser && (a.anonymous_id = o.anonymousId), _(a) ? W : {
            type: e,
            usr: a
        }
    }), i
}

function to() {
    return za(`user`, {
        propertiesConfig: {
            id: {
                type: `string`
            },
            name: {
                type: `string`
            },
            email: {
                type: `string`
            }
        }
    })
}
var J = {
        userContext: `userContext`,
        globalContext: `globalContext`,
        accountContext: `accountContext`
    },
    Y = {
        getContext: `getContext`,
        setContext: `setContext`,
        setContextProperty: `setContextProperty`,
        removeContextProperty: `removeContextProperty`,
        clearContext: `clearContext`
    },
    no = `datadog-synthetics-`,
    ro = `${no}public-id`,
    io = `${no}result-id`,
    ao = `${no}injects-rum`,
    oo = `${no}rum-context`;

function so() {
    return b ? !1 : !!(y._DATADOG_SYNTHETICS_INJECTS_RUM || Ae(ao))
}

function co() {
    let e = uo();
    return fo(e) ? e : void 0
}

function lo() {
    return !!co()
}

function uo() {
    let e = y._DATADOG_SYNTHETICS_RUM_CONTEXT;
    if (e) return e;
    let t = Ae(oo);
    return t ? m(decodeURIComponent(t)) : {
        test_id: window._DATADOG_SYNTHETICS_PUBLIC_ID || Ae(ro),
        result_id: window._DATADOG_SYNTHETICS_RESULT_ID || Ae(io)
    }
}

function fo(e) {
    return typeof e == `object` && !!e && typeof e.test_id == `string` && typeof e.result_id == `string`
}
var X = {
        DOCUMENT: `document`,
        XHR: `xhr`,
        BEACON: `beacon`,
        FETCH: `fetch`,
        CSS: `css`,
        JS: `js`,
        IMAGE: `image`,
        FONT: `font`,
        MEDIA: `media`,
        OTHER: `other`
    },
    po = {
        FETCH: X.FETCH,
        XHR: X.XHR
    },
    mo = 500;

function ho() {
    let e = new ot(mo, e => {
            Er(`Early data collection dropped data on unbuffer`, {
                count: e
            })
        }),
        n = [];

    function r(t, r) {
        n.push(r.subscribe(n => {
            e.notify({
                type: t,
                data: n
            })
        }))
    }
    return r(0, L(Oi)()), r(1, Ca()), r(2, ha({
        allowUntrustedEvents: !0
    })), r(3, Ma(Object.values(t))), {
        observable: e,
        stop: () => n.forEach(e => e.unsubscribe())
    }
}

function go() {
    try {
        return new Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
        return
    }
}

function _o(e, t, n) {
    e.register(1, ({
        startTime: e
    }) => {
        let r = t.findTrackedSession(e);
        return r ? {
            session: {
                id: r.id
            },
            anonymous_id: r.anonymousId,
            ...n
        } : W
    })
}
var Z = {
        ACTION: `action`,
        ERROR: `error`,
        LONG_TASK: `long_task`,
        VIEW: `view`,
        RESOURCE: `resource`,
        VITAL: `vital`
    },
    vo = {
        LONG_TASK: `long-task`,
        LONG_ANIMATION_FRAME: `long-animation-frame`
    },
    yo = {
        INITIAL_LOAD: `initial_load`,
        ROUTE_CHANGE: `route_change`,
        SESSION_RENEWAL: `session_renewal`,
        BF_CACHE: `bf_cache`
    },
    bo = {
        CLICK: `click`,
        CUSTOM: `custom`,
        TAP: `tap`,
        SCROLL: `scroll`,
        SWIPE: `swipe`,
        APPLICATION_START: `application_start`,
        BACK: `back`
    },
    xo = {
        RAGE_CLICK: `rage_click`,
        ERROR_CLICK: `error_click`,
        DEAD_CLICK: `dead_click`
    },
    So = {
        DURATION: `duration`,
        OPERATION_STEP: `operation_step`
    },
    Co = [`tracecontext`, `datadog`],
    wo = [`cache-control`, `etag`, `age`, `expires`, `content-type`, `content-encoding`, `vary`, `content-length`, `server-timing`, `x-cache`];

function To(e, t) {
    if (e.trackFeatureFlagsForEvents !== void 0 && !Array.isArray(e.trackFeatureFlagsForEvents) && a.warn(`trackFeatureFlagsForEvents should be an array`), !e.applicationId) {
        a.error(`Application ID is not configured, no RUM data will be collected.`);
        return
    }
    if (!Ti(e.sessionReplaySampleRate, `Session Replay`) || !Ti(e.traceSampleRate, `Trace`)) return;
    if (e.excludedActivityUrls !== void 0 && !Array.isArray(e.excludedActivityUrls)) {
        a.error(`Excluded Activity Urls should be an array`);
        return
    }
    let n = Eo(e);
    if (!n) return;
    let r = Ei(e, t),
        i = ko(e);
    if (!r) return;
    let o = e.sessionReplaySampleRate ? ? 0;
    return {
        applicationId: e.applicationId,
        actionNameAttribute: e.actionNameAttribute,
        sessionReplaySampleRate: o,
        startSessionReplayRecordingManually: e.startSessionReplayRecordingManually === void 0 ? o === 0 : !!e.startSessionReplayRecordingManually,
        traceSampleRate: e.traceSampleRate ? ? 100,
        rulePsr: p(e.traceSampleRate) ? e.traceSampleRate / 100 : void 0,
        allowedTracingUrls: n,
        excludedActivityUrls: e.excludedActivityUrls ? ? [],
        workerUrl: e.workerUrl,
        compressIntakeRequests: !!e.compressIntakeRequests,
        trackUserInteractions: !!(e.trackUserInteractions ? ? !0),
        trackViewsManually: !!e.trackViewsManually,
        trackResources: !!(e.trackResources ? ? !0),
        trackResourceHeaders: jo(e),
        trackLongTasks: !!(e.trackLongTasks ? ? !0),
        subdomain: e.subdomain,
        defaultPrivacyLevel: g(xi, e.defaultPrivacyLevel) ? e.defaultPrivacyLevel : xi.MASK_USER_INPUT,
        enablePrivacyForActionName: e.enablePrivacyForActionName !== !1,
        traceContextInjection: g(Si, e.traceContextInjection) ? e.traceContextInjection : Si.SAMPLED,
        plugins: e.plugins || [],
        trackFeatureFlagsForEvents: e.trackFeatureFlagsForEvents || [],
        profilingSampleRate: e.profilingSampleRate ? ? 0,
        propagateTraceBaggage: e.propagateTraceBaggage !== !1,
        allowedGraphQlUrls: i,
        ...r
    }
}

function Eo(e) {
    if (e.allowedTracingUrls === void 0) return [];
    if (!Array.isArray(e.allowedTracingUrls)) {
        a.error(`Allowed Tracing URLs should be an array`);
        return
    }
    if (e.allowedTracingUrls.length !== 0 && e.service === void 0) {
        a.error(`Service needs to be configured when tracing is enabled`);
        return
    }
    let t = [];
    return e.allowedTracingUrls.forEach(e => {
        let n = Oo(e);
        n ? t.push(n) : a.warn(`Allowed Tracing Urls parameters should be a string, RegExp, function, or an object. Ignoring parameter`, e)
    }), t
}

function Do(e) {
    let t = new Set;
    return Ui(e.allowedTracingUrls) && e.allowedTracingUrls.forEach(e => {
        Oo(e) ? .propagatorTypes.forEach(e => t.add(e))
    }), Array.from(t)
}

function Oo(e) {
    if (ii(e)) return {
        match: e,
        propagatorTypes: Co
    };
    if (Ot(e) && ii(e.match) && (e.propagatorTypes === null || e.propagatorTypes === void 0 || Array.isArray(e.propagatorTypes))) return {
        match: e.match,
        propagatorTypes: e.propagatorTypes || Co
    }
}

function ko(e) {
    if (!e.allowedGraphQlUrls) return [];
    if (!Array.isArray(e.allowedGraphQlUrls)) return a.warn(`allowedGraphQlUrls should be an array`), [];
    let t = [];
    return e.allowedGraphQlUrls.forEach(e => {
        ii(e) ? t.push({
            match: e,
            trackPayload: !1,
            trackResponseErrors: !1
        }) : Ot(e) && ii(e.match) && t.push({
            match: e.match,
            trackPayload: !!e.trackPayload,
            trackResponseErrors: !!e.trackResponseErrors
        })
    }), t
}
var Ao = [`request`, `response`, `any`];

function jo(e) {
    let t = e.trackResourceHeaders;
    if (t === void 0 || t === !1) return [];
    if (t === !0) return wo.map(e => ({
        name: e
    }));
    if (!Array.isArray(t)) return a.warn(`trackResourceHeaders should be true or an array of MatchHeader`), [];
    if (t.length === 0) return a.warn(`trackResourceHeaders is an empty array, no headers will be captured`), [];
    let n = [];
    return t.forEach((e, t) => {
        if (!Ot(e) || !ii(e.name)) {
            a.warn(`trackResourceHeaders[${t}] should be a MatchHeader object with a 'name' property`);
            return
        }
        if (e.url !== void 0 && !ii(e.url)) {
            a.warn(`trackResourceHeaders[${t}].url should be a MatchOption`);
            return
        }
        if (e.extractor !== void 0 && !(e.extractor instanceof RegExp)) {
            a.warn(`trackResourceHeaders[${t}].extractor should be a RegExp`);
            return
        }
        if (e.location !== void 0 && !Ao.includes(e.location)) {
            a.warn(`trackResourceHeaders[${t}].location should be 'request', 'response', or 'any'`);
            return
        }
        n.push({ ...e,
            name: typeof e.name == `string` ? e.name.toLowerCase() : e.name
        })
    }), n
}

function Mo(e) {
    return Ui(e) && e.some(e => Ot(e) && e.trackPayload)
}

function No(e) {
    return Ui(e) && e.some(e => Ot(e) && e.trackResponseErrors)
}

function Po(e) {
    if (e === !0) return `default_headers`;
    if (Array.isArray(e)) return `custom`
}

function Fo(e) {
    let t = Di(e);
    return {
        session_replay_sample_rate: e.sessionReplaySampleRate,
        start_session_replay_recording_manually: e.startSessionReplayRecordingManually,
        trace_sample_rate: e.traceSampleRate,
        trace_context_injection: e.traceContextInjection,
        propagate_trace_baggage: e.propagateTraceBaggage,
        action_name_attribute: e.actionNameAttribute,
        use_allowed_tracing_urls: Ui(e.allowedTracingUrls),
        use_allowed_graph_ql_urls: Ui(e.allowedGraphQlUrls),
        use_track_graph_ql_payload: Mo(e.allowedGraphQlUrls),
        use_track_graph_ql_response_errors: No(e.allowedGraphQlUrls),
        selected_tracing_propagators: Do(e),
        default_privacy_level: e.defaultPrivacyLevel,
        enable_privacy_for_action_name: e.enablePrivacyForActionName,
        use_excluded_activity_urls: Ui(e.excludedActivityUrls),
        use_worker_url: !!e.workerUrl,
        compress_intake_requests: e.compressIntakeRequests,
        track_views_manually: e.trackViewsManually,
        track_user_interactions: e.trackUserInteractions,
        track_resources: e.trackResources,
        track_long_task: e.trackLongTasks,
        plugins: e.plugins ? .map(e => ({
            name: e.name,
            ...e.getConfigurationTelemetry ? .()
        })),
        track_feature_flags_for_events: e.trackFeatureFlagsForEvents,
        remote_configuration_id: e.remoteConfigurationId,
        profiling_sample_rate: e.profilingSampleRate,
        use_remote_configuration_proxy: !!e.remoteConfigurationProxy,
        track_resource_headers: Po(e.trackResourceHeaders),
        ...t
    }
}

function Io(e, t) {
    t.lastIndex = 0;
    let n = t.exec(e);
    if (!n) return;
    let [r, i] = n;
    return i || r
}

function Lo(e) {
    let t = [],
        n = 0,
        r, i = {
            quote: void 0,
            escapeSequence: void 0
        },
        a = ``;
    for (let o of e) {
        if (r = Wo[n].find(e => Uo[e](o, i)), !r) return [];
        if (i.escapeSequence !== void 0 && r !== 12) {
            if (!qo(i.escapeSequence)) return [];
            a += Yo(i.escapeSequence), i.escapeSequence = void 0
        }
        Go.includes(r) ? a += o : Ko.includes(r) && a !== `` ? (t.push(a), a = ``) : r === 12 ? i.escapeSequence = i.escapeSequence ? `${i.escapeSequence}${o}` : o : r === 8 ? i.quote = o : r === 9 && (i.quote = void 0), n = r
    }
    return Wo[n].includes(1) ? (a !== `` && t.push(a), t) : []
}
var Ro = /[a-zA-Z_$]/,
    zo = /[a-zA-Z0-9_$]/,
    Bo = /[0-9]/,
    Vo = /[a-fA-F0-9]/,
    Ho = `'"`,
    Uo = {
        0: () => !1,
        1: () => !1,
        2: e => Ro.test(e),
        3: e => zo.test(e),
        4: e => e === `.`,
        5: e => e === `[`,
        6: e => e === `]`,
        7: e => Bo.test(e),
        8: e => Ho.includes(e),
        9: (e, t) => e === t.quote,
        10: () => !0,
        11: e => e === `\\`,
        12: (e, t) => t.escapeSequence === void 0 ? `${t.quote}/\\bfnrtu`.includes(e) : t.escapeSequence.startsWith(`u`) && t.escapeSequence.length < 5 ? Vo.test(e) : !1
    },
    Wo = {
        0: [2, 5],
        1: [],
        2: [3, 4, 5, 1],
        3: [3, 4, 5, 1],
        4: [2],
        5: [8, 7],
        6: [4, 5, 1],
        7: [7, 6],
        8: [11, 9, 10],
        9: [6],
        10: [11, 9, 10],
        11: [12],
        12: [12, 11, 9, 10]
    },
    Go = [2, 3, 7, 10],
    Ko = [4, 5, 6];

function qo(e) {
    return `"'/\\bfnrt`.includes(e) || e.startsWith(`u`) && e.length === 5
}
var Jo = {
    '"': `"`,
    "'": `'`,
    "/": `/`,
    "\\": `\\`,
    b: `\b`,
    f: `\f`,
    n: `
`,
    r: `\r`,
    t: `	`
};

function Yo(e) {
    return e.startsWith(`u`) ? String.fromCharCode(parseInt(e.slice(1), 16)) : Jo[e]
}
var Xo = `v1`,
    Zo = [`applicationId`, `service`, `env`, `version`, `sessionSampleRate`, `sessionReplaySampleRate`, `defaultPrivacyLevel`, `enablePrivacyForActionName`, `traceSampleRate`, `trackSessionAcrossSubdomains`, `allowedTracingUrls`, `allowedTrackingOrigins`];
async function Qo(e, t) {
    let n, r = es(),
        i = await is(e);
    return i.ok ? (r.increment(`fetch`, `success`), n = $o(e, i.value, t, r)) : (r.increment(`fetch`, `failure`), a.error(i.error)), kr(`remote configuration metrics`, {
        metrics: r.get()
    }), n
}

function $o(e, t, n, r) {
    let i = { ...e
    };
    return Zo.forEach(e => {
        e in t && (i[e] = o(t[e]))
    }), Object.keys(n).forEach(e => {
        t[e] !== void 0 && s(n[e], t[e])
    }), i;

    function o(e) {
        if (Array.isArray(e)) return e.map(o);
        if (Ot(e)) {
            if (ts(e)) {
                let t = e.rcSerializedType;
                switch (t) {
                    case `string`:
                        return e.value;
                    case `regex`:
                        return ns(e.value);
                    case `dynamic`:
                        return c(e);
                    default:
                        a.error(`Unsupported remote configuration: "rcSerializedType": "${t}"`);
                        return
                }
            }
            return ee(e, o)
        }
        return e
    }

    function s(e, t) {
        t.forEach(({
            key: t,
            value: n
        }) => {
            e.setContextProperty(t, o(n))
        })
    }

    function c(e) {
        let t = e.strategy,
            n;
        switch (t) {
            case `cookie`:
                n = l(e);
                break;
            case `dom`:
                n = d(e);
                break;
            case `js`:
                n = p(e);
                break;
            case `localStorage`:
                n = u(e);
                break;
            default:
                a.error(`Unsupported remote configuration: "strategy": "${t}"`);
                return
        }
        let r = e.extractor;
        return r !== void 0 && typeof n == `string` ? rs(r, n) : n
    }

    function l({
        name: e
    }) {
        let t = De(e);
        return r.increment(`cookie`, t === void 0 ? `missing` : `success`), t
    }

    function u({
        key: e
    }) {
        let t;
        try {
            t = localStorage.getItem(e)
        } catch {
            r.increment(`localStorage`, `failure`);
            return
        }
        return r.increment(`localStorage`, t === null ? `missing` : `success`), t ? ? void 0
    }

    function d({
        selector: e,
        attribute: t
    }) {
        let n;
        try {
            n = document.querySelector(e)
        } catch {
            a.error(`Invalid selector in the remote configuration: '${e}'`), r.increment(`dom`, `failure`);
            return
        }
        if (!n) {
            r.increment(`dom`, `missing`);
            return
        }
        if (f(n, t)) {
            a.error(`Forbidden element selected by the remote configuration: '${e}'`), r.increment(`dom`, `failure`);
            return
        }
        let i = t === void 0 ? n.textContent : n.getAttribute(t);
        if (i === null) {
            r.increment(`dom`, `missing`);
            return
        }
        return r.increment(`dom`, `success`), i
    }

    function f(e, t) {
        return e.getAttribute(`type`) === `password` && t === `value`
    }

    function p({
        path: e
    }) {
        let t = window,
            n = Lo(e);
        if (n.length === 0) {
            a.error(`Invalid JSON path in the remote configuration: '${e}'`), r.increment(`js`, `failure`);
            return
        }
        for (let i of n) {
            if (!(i in t)) {
                r.increment(`js`, `missing`);
                return
            }
            try {
                t = t[i]
            } catch (t) {
                a.error(`Error accessing: '${e}'`, t), r.increment(`js`, `failure`);
                return
            }
        }
        return r.increment(`js`, `success`), t
    }
}

function es() {
    let e = {
        fetch: {}
    };
    return {
        get: () => e,
        increment: (t, n) => {
            e[t] || (e[t] = {}), e[t][n] || (e[t][n] = 0), e[t][n] = e[t][n] + 1
        }
    }
}

function ts(e) {
    return `rcSerializedType` in e
}

function ns(e) {
    try {
        return new RegExp(e)
    } catch {
        a.error(`Invalid regex in the remote configuration: '${e}'`)
    }
}

function rs(e, t) {
    let n = ns(e.value);
    if (n !== void 0) return Io(t, n)
}
async function is(e) {
    let t;
    try {
        t = await kn(as(e))
    } catch {
        t = void 0
    }
    if (!t || !t.ok) return {
        ok: !1,
        error: Error(`Error fetching the remote configuration.`)
    };
    let n = await t.json();
    return n.rum ? {
        ok: !0,
        value: n.rum
    } : {
        ok: !1,
        error: Error(`No remote configuration for RUM.`)
    }
}

function as(e) {
    return e.remoteConfigurationProxy ? e.remoteConfigurationProxy : `https://sdk-configuration.${mi(e)}/${Xo}/${encodeURIComponent(e.remoteConfigurationId)}.json`
}

function os(e, t, n) {
    if (e)
        for (let r of e) {
            let e = r[t];
            e && e(n)
        }
}
var ss = pr;

function cs(e, t) {
    e.register(1, () => t.isGranted() ? W : fr)
}

function ls({
    ignoreInitIfSyntheticsWillInjectRum: e = !0,
    startDeflateWorker: t
}, n, r) {
    let i = new ot(500, e => {
            Er(`preStartRum buffer data lost`, {
                count: e
            })
        }),
        o = $a();
    Ba(o, J.globalContext, i);
    let s = to();
    Ba(s, J.userContext, i);
    let c = Ka();
    Ba(c, J.accountContext, i);
    let l, u, d, f, p, m, h = ss(),
        g = n.observable.subscribe(v),
        _ = {},
        ee = !1;

    function v() {
        if (ee || !d || !f || !p || !m) return;
        g.unsubscribe();
        let e;
        if (f.trackViewsManually) {
            if (!l) return;
            e = l.options
        }
        let t = f.trackViewsManually ? l ? .callback : void 0,
            n = r(f, p, u, e, m, h);
        ee = !0, i.subscribe(e => {
            e !== t && e(n)
        }), i.unbuffer()
    }

    function y(e, r) {
        let i = $n();
        if (i && (e = us(e)), d = e, f) {
            Ni(`DD_RUM`, e);
            return
        }
        let o = To(e, r);
        o && (o.compressIntakeRequests && !i && t && (u = t(o, `Datadog RUM`, B), !u) || (f = o, n.tryToInit(o.trackingConsent), n.onGrantedOnce(() => {
            if (cs(h, n), m = L(xr)(`browser-rum-sdk`, o, h), b) {
                a.warn(`The RUM SDK is not supported in a web or service worker environment.`);
                return
            }($n() ? aa() : L(ia)(o, n)).then(t => {
                t && (p = t, _o(h, p, {
                    application: {
                        id: o.applicationId
                    }
                }), Or(Fo(e)), v())
            }).catch(F)
        })))
    }
    return {
        init(t, n, r) {
            if (!t) {
                a.error(`Missing configuration`);
                return
            }
            ln(t.enableExperimentalFeatures), d = t, !(e && so()) && (os(t.plugins, `onInit`, {
                initConfiguration: t,
                publicApi: n
            }), t.remoteConfigurationId ? Qo(t, {
                user: s,
                context: o
            }).then(e => {
                e && y(e, r)
            }).catch(F) : y(t, r))
        },
        get initConfiguration() {
            return d
        },
        getInternalContext: B,
        stopSession: B,
        addTiming(e, t = T()) {
            i.notify(n => n.addTiming(e, t))
        },
        setLoadingTime: (e => {
            i.notify(t => t.setLoadingTime(e))
        }),
        startView(e, t = D()) {
            let n = n => {
                n.startView(e, t)
            };
            i.notify(n), l || (l = {
                options: e,
                callback: n
            }, v())
        },
        setViewName(e) {
            i.notify(t => t.setViewName(e))
        },
        setViewContext(e) {
            i.notify(t => t.setViewContext(e))
        },
        setViewContextProperty(e, t) {
            i.notify(n => n.setViewContextProperty(e, t))
        },
        getViewContext: () => _,
        globalContext: o,
        userContext: s,
        accountContext: c,
        addAction(e) {
            i.notify(t => t.addAction(e))
        },
        startAction(e, t) {
            let n = D();
            i.notify(r => r.startAction(e, t, n))
        },
        stopAction(e, t) {
            let n = D();
            i.notify(r => r.stopAction(e, t, n))
        },
        startResource(e, t) {
            let n = D();
            i.notify(r => r.startResource(e, t, n))
        },
        stopResource(e, t) {
            let n = D();
            i.notify(r => r.stopResource(e, t, n))
        },
        addError(e) {
            i.notify(t => t.addError(e))
        },
        addFeatureFlagEvaluation(e, t) {
            i.notify(n => n.addFeatureFlagEvaluation(e, t))
        },
        startDurationVital(e, t) {
            let n = D();
            i.notify(r => r.startDurationVital(e, t, n))
        },
        stopDurationVital(e, t) {
            let n = D();
            i.notify(r => r.stopDurationVital(e, t, n))
        },
        addDurationVital(e) {
            i.notify(t => t.addDurationVital(e))
        },
        addOperationStepVital: (e, t, n, r) => {
            i.notify(i => i.addOperationStepVital(V(e), t, V(n), V(r)))
        }
    }
}

function us(e) {
    return { ...e,
        applicationId: `00000000-aaaa-0000-aaaa-000000000000`,
        clientToken: `empty`,
        sessionSampleRate: 100,
        defaultPrivacyLevel: e.defaultPrivacyLevel ? ? Zn() ? .getPrivacyLevel()
    }
}

function ds() {
    let e = fs();
    return new I(t => {
        let n = new e(N(e => t.notify(e)));
        return n.observe(document, {
            attributes: !0,
            characterData: !0,
            childList: !0,
            subtree: !0
        }), () => n.disconnect()
    })
}

function fs() {
    let e, t = window;
    if (t.Zone && (e = st(t, `MutationObserver`), t.MutationObserver && e === t.MutationObserver)) {
        let n = st(new t.MutationObserver(B), `originalInstance`);
        e = n && n.constructor
    }
    return e || = t.MutationObserver, e
}

function ps() {
    let e = new I,
        {
            stop: t
        } = K(window, `open`, () => e.notify());
    return {
        observable: e,
        stop: t
    }
}

function ms(e, t, n, r, i) {
    return {
        get: a => {
            let o = n.findView(a),
                s = i.findUrl(a),
                c = t.findTrackedSession(a);
            if (c && o && s) {
                let t = r.findActionId(a);
                return {
                    application_id: e,
                    session_id: c.id,
                    user_action: t ? {
                        id: t
                    } : void 0,
                    view: {
                        id: o.id,
                        name: o.name,
                        referrer: s.referrer,
                        url: s.url
                    }
                }
            }
        }
    }
}
var hs = la,
    gs = fe;

function _s(e) {
    let t = Yi({
        expireDelay: gs
    });
    e.subscribe(1, e => {
        t.add(n(e), e.startClocks.relative)
    }), e.subscribe(6, ({
        endClocks: e
    }) => {
        t.closeActive(e.relative)
    }), e.subscribe(3, e => {
        let n = t.find(e.startClocks.relative);
        n && (e.name && (n.name = e.name), e.context && (n.context = e.context), n.sessionIsActive = e.sessionIsActive)
    }), e.subscribe(10, () => {
        t.reset()
    });

    function n(e) {
        return {
            service: e.service,
            version: e.version,
            context: e.context,
            id: e.id,
            name: e.name,
            startClocks: e.startClocks
        }
    }
    return {
        findView: e => t.find(e),
        stop: () => {
            t.stop()
        }
    }
}
var vs = [
    [X.DOCUMENT, e => e === `navigation`],
    [X.XHR, e => e === `xmlhttprequest`],
    [X.FETCH, e => e === `fetch`],
    [X.BEACON, e => e === `beacon`],
    [X.CSS, (e, t) => /\.css$/i.test(t)],
    [X.JS, (e, t) => /\.js$/i.test(t)],
    [X.IMAGE, (e, t) => [`image`, `img`, `icon`].includes(e) || /\.(gif|jpg|jpeg|tiff|png|svg|ico)$/i.exec(t) !== null],
    [X.FONT, (e, t) => /\.(woff|eot|woff2|ttf)$/i.exec(t) !== null],
    [X.MEDIA, (e, t) => [`audio`, `video`].includes(e) || /\.(mp3|mp4)$/i.exec(t) !== null]
];

function ys(e) {
    let t = e.name;
    if (!xe(t)) return X.OTHER;
    let n = Se(t);
    for (let [t, r] of vs)
        if (r(e.initiatorType, n)) return t;
    return X.OTHER
}

function bs(...e) {
    for (let t = 1; t < e.length; t += 1)
        if (e[t - 1] > e[t]) return !1;
    return !0
}

function xs(e) {
    return e.initiatorType === `xmlhttprequest` || e.initiatorType === `fetch`
}

function Ss(e) {
    let {
        duration: t,
        startTime: n,
        responseEnd: r
    } = e;
    return e.initiatorType === `navigation` || t === 0 && n < r ? O(n, r) : t
}

function Cs(e) {
    if (!Ts(e)) return;
    let {
        startTime: t,
        fetchStart: n,
        workerStart: r,
        redirectStart: i,
        redirectEnd: a,
        domainLookupStart: o,
        domainLookupEnd: s,
        connectStart: c,
        secureConnectionStart: l,
        connectEnd: u,
        requestStart: d,
        responseStart: f,
        responseEnd: p
    } = e, m = {
        download: Ds(t, f, p),
        first_byte: Ds(t, d, f)
    };
    return 0 < r && r < n && (m.worker = Ds(t, r, n)), n < u && (m.connect = Ds(t, c, u), c <= l && l <= u && (m.ssl = Ds(t, l, u))), n < s && (m.dns = Ds(t, o, s)), t < a && (m.redirect = Ds(t, i, a)), m
}

function ws(e) {
    return e.duration >= 0
}

function Ts(e) {
    let t = bs(e.startTime, e.fetchStart, e.domainLookupStart, e.domainLookupEnd, e.connectStart, e.connectEnd, e.requestStart, e.responseStart, e.responseEnd),
        n = Es(e) ? bs(e.startTime, e.redirectStart, e.redirectEnd, e.fetchStart) : !0;
    return t && n
}

function Es(e) {
    return e.redirectEnd > e.startTime
}

function Ds(e, t, n) {
    if (e <= t && t <= n) return {
        duration: C(O(t, n)),
        start: C(O(e, t))
    }
}

function Os(e) {
    return e.nextHopProtocol === `` ? void 0 : e.nextHopProtocol
}

function ks(e) {
    return e.deliveryType === `` ? `other` : e.deliveryType
}

function As(e) {
    if (e.startTime < e.responseStart) {
        let {
            encodedBodySize: t,
            decodedBodySize: n,
            transferSize: r
        } = e;
        return {
            size: n,
            encoded_body_size: t,
            decoded_body_size: n,
            transfer_size: r
        }
    }
    return {
        size: void 0,
        encoded_body_size: void 0,
        decoded_body_size: void 0,
        transfer_size: void 0
    }
}

function js(e) {
    return e && (!bi(e) || dn(H.TRACK_INTAKE_REQUESTS))
}
var Ms = /data:(.+)?(;base64)?,/g,
    Ns = 24e3;

function Ps(e, t = Ns) {
    if (e.length <= t || !e.startsWith(`data:`)) return e;
    let n = e.substring(0, 100).match(Ms);
    return n ? `${n[0]}[...]` : e
}

function Fs() {
    return Ls(64)
}

function Is() {
    return Ls(63)
}

function Ls(e) {
    let t = crypto.getRandomValues(new Uint32Array(2)),
        n = BigInt(t[0]) + (BigInt(t[1]) << 32 n);
    return e === 63 && (n &= 9223372036854775807 n), n
}

function Rs(e) {
    return e.toString(16).padStart(16, `0`)
}

function zs(e) {
    e.status === 0 && !e.isAborted && (e.traceId = void 0, e.spanId = void 0, e.traceSampled = void 0)
}

function Bs(e, t, n, r) {
    return {
        clearTracingIfNeeded: zs,
        traceFetch: i => Vs(e, i, t, n, r, e => {
            if (i.input instanceof Request && !i.init ? .headers) i.input = new Request(i.input), Object.keys(e).forEach(t => {
                i.input.headers.append(t, e[t])
            });
            else {
                i.init = h(i.init);
                let t = [];
                i.init.headers instanceof Headers ? i.init.headers.forEach((e, n) => {
                    t.push([n, e])
                }) : Array.isArray(i.init.headers) ? i.init.headers.forEach(e => {
                    t.push(e)
                }) : i.init.headers && Object.keys(i.init.headers).forEach(e => {
                    t.push([e, i.init.headers[e]])
                }), i.init.headers = t.concat(Re(e))
            }
        }),
        traceXhr: (i, a) => Vs(e, i, t, n, r, e => {
            try {
                Object.keys(e).forEach(t => {
                    a.setRequestHeader(t, e[t])
                })
            } catch {}
        })
    }
}

function Vs(e, t, n, r, i, a) {
    let o = n.findTrackedSession();
    if (!o) return;
    let s = e.allowedTracingUrls.find(e => ai([e.match], t.url, !0));
    if (!s) return;
    let c = Qi(o.id, Xi(e.sessionSampleRate, e.traceSampleRate)),
        l = $n() ? Zn() ? .getIsTraceSampled() ? ? c : c;
    (l || e.traceContextInjection === Si.ALL) && (t.traceSampled = l, t.traceId = Fs(), t.spanId = Is(), a(Hs(t.traceId, t.spanId, t.traceSampled, o.id, s.propagatorTypes, r, i, e)))
}

function Hs(e, t, n, r, i, a, o, s) {
    let c = {};
    if (i.forEach(r => {
            switch (r) {
                case `datadog`:
                    Object.assign(c, {
                        "x-datadog-origin": `rum`,
                        "x-datadog-parent-id": t.toString(),
                        "x-datadog-sampling-priority": n ? `1` : `0`,
                        "x-datadog-trace-id": e.toString()
                    });
                    break;
                case `tracecontext`:
                    Object.assign(c, {
                        traceparent: `00-0000000000000000${Rs(e)}-${Rs(t)}-0${n?`1`:`0`}`,
                        tracestate: `dd=s:${n?`1`:`0`};o:rum`
                    });
                    break;
                case `b3`:
                    Object.assign(c, {
                        b3: `${Rs(e)}-${Rs(t)}-${n?`1`:`0`}`
                    });
                    break;
                case `b3multi`:
                    Object.assign(c, {
                        "X-B3-TraceId": Rs(e),
                        "X-B3-SpanId": Rs(t),
                        "X-B3-Sampled": n ? `1` : `0`
                    });
                    break
            }
        }), s.propagateTraceBaggage) {
        let e = {
                "session.id": r
            },
            t = a.getContext().id;
        typeof t == `string` && (e[`user.id`] = t);
        let n = o.getContext().id;
        typeof n == `string` && (e[`account.id`] = n);
        let i = Object.entries(e).map(([e, t]) => `${e}=${encodeURIComponent(t)}`).join(`,`);
        i && (c.baggage = i)
    }
    return c
}
var Us = 32 * ut;

function Ws(e, t) {
    let n = qs(e, t.trackPayload);
    if (n) {
        if (t.trackResponseErrors && e.responseBody) {
            let t = Gs(e.responseBody);
            t && (n.error_count = t.length, n.errors = t)
        }
        return n
    }
}

function Gs(e) {
    let t = m(e);
    if (!t || typeof t != `object`) return;
    let n = t;
    if (Ui(n.errors)) return n.errors.map(e => ({
        message: e.message,
        path: e.path,
        locations: e.locations,
        code: e.extensions ? .code
    }))
}

function Ks(e, t) {
    return t.allowedGraphQlUrls.find(t => ai([t.match], e))
}

function qs(e, t = !1) {
    let n;
    if (e.method === `POST` ? n = Js(e.requestBody) : e.method === `GET` && (n = Ys(e.url)), n) return Xs(n, t)
}

function Js(e) {
    if (!e || typeof e != `string`) return;
    let t = m(e);
    if (t) return {
        query: t.query,
        operationName: t.operationName,
        variables: t.variables ? JSON.stringify(t.variables) : void 0
    }
}

function Ys(e) {
    let t = Ce(e).searchParams,
        n = t.get(`variables`),
        r = n && m(n) !== void 0 ? n : void 0;
    return {
        query: t.get(`query`) || void 0,
        operationName: t.get(`operationName`) || void 0,
        variables: r
    }
}

function Xs(e, t) {
    let n, r, i;
    if (e.query) {
        let i = e.query.trim();
        n = Zs(i), t && (r = ye(i, Us, `...`))
    }
    return e.variables && (i = e.variables), {
        operationType: n,
        operationName: e.operationName,
        variables: i,
        payload: r
    }
}

function Zs(e) {
    return e.match(/^\s*(query|mutation|subscription)\b/i) ? .[1]
}
var Qs = 1;

function $s(e, t, n, r, i, a) {
    let o = Bs(t, n, r, i);
    ec(e, t, o, a), tc(e, t, o, a)
}

function ec(e, t, n, r) {
    let i = [];
    return i.push(ha(t).subscribe(e => {
        e.state === `start` && js(e.url) && (n.traceXhr(e, e.xhr), nc(e))
    })), i.push(r.subscribe(({
        data: t,
        type: r
    }) => {
        if (r !== 2) return;
        let i = t;
        if (js(i.url)) switch (i.state) {
            case `start`:
                nc(i), e.notify(7, {
                    requestIndex: i.requestIndex,
                    url: i.url
                });
                break;
            case `complete`:
                n.clearTracingIfNeeded(i), e.notify(8, { ...i,
                    type: po.XHR,
                    isAbortedOnStart: !1
                });
                break
        }
    })), {
        stop: () => i.forEach(e => e.unsubscribe())
    }
}

function tc(e, t, n, r) {
    let i = [];
    return i.push(Ca({
        responseBodyAction: e => +!!Ks(e.url, t) ? .trackResponseErrors
    }).subscribe(e => {
        e.state === `start` && js(e.url) && (n.traceFetch(e), nc(e))
    })), i.push(r.subscribe(({
        data: t,
        type: r
    }) => {
        if (r !== 1) return;
        let i = t;
        if (js(i.url)) switch (i.state) {
            case `start`:
                nc(i), e.notify(7, {
                    requestIndex: i.requestIndex,
                    url: i.url
                });
                break;
            case `resolve`:
                n.clearTracingIfNeeded(i), e.notify(8, { ...i,
                    duration: O(i.startClocks.timeStamp, T()),
                    type: po.FETCH,
                    requestBody: i.init ? .body
                });
                break
        }
    })), {
        stop: () => i.forEach(e => e.unsubscribe())
    }
}

function nc(e) {
    e.requestIndex || = Qs++
}

function rc(e) {
    return p(e) && e < 0 ? void 0 : e
}

function ic(e) {
    return e.nodeType === Node.TEXT_NODE
}

function ac(e) {
    return e.nodeType === Node.COMMENT_NODE
}

function oc(e) {
    return e.nodeType === Node.ELEMENT_NODE
}

function sc(e) {
    return oc(e) && !!e.shadowRoot
}

function cc(e) {
    let t = e;
    return !!t.host && t.nodeType === Node.DOCUMENT_FRAGMENT_NODE && oc(t.host)
}

function lc(e) {
    return cc(e) ? e.host : e.parentNode
}

function uc(e) {
    if (e.parentElement) return e.parentElement;
    let t = e.parentNode;
    return t && cc(t) ? t.host : null
}
var Q;
(function(e) {
    e.EVENT = `event`, e.FIRST_INPUT = `first-input`, e.LARGEST_CONTENTFUL_PAINT = `largest-contentful-paint`, e.LAYOUT_SHIFT = `layout-shift`, e.LONG_TASK = `longtask`, e.LONG_ANIMATION_FRAME = `long-animation-frame`, e.NAVIGATION = `navigation`, e.PAINT = `paint`, e.RESOURCE = `resource`, e.VISIBILITY_STATE = `visibility-state`
})(Q || = {});

function dc(e, t) {
    return new I(n => {
        let r = e => {
                let t = gc(e);
                t.length > 0 && n.notify(t)
            },
            i, a = !0,
            o = new PerformanceObserver(N(e => {
                a ? i = R(() => r(e.getEntries())) : r(e.getEntries())
            }));
        return o.observe(t), a = !1, pc(e), () => {
            o.disconnect(), z(i)
        }
    })
}
var fc;

function pc(e) {
    !fc && mc() && `addEventListener` in performance && (fc = U(e, performance, `resourcetimingbufferfull`, () => {
        performance.clearResourceTimings()
    }))
}

function mc() {
    return window.performance !== void 0 && `getEntries` in performance
}

function hc(e) {
    return PerformanceObserver.supportedEntryTypes.includes(e)
}

function gc(e) {
    return e.filter(e => !_c(e))
}

function _c(e) {
    return e.entryType === Q.RESOURCE && (!js(e.name) || !ws(e))
}

function vc(e, t, n, r, i, a) {
    let o = L(yc)(e, t, n, r),
        s, c = !1,
        l = R(N(() => p({
            hadActivity: !1
        })), 100),
        u = a === void 0 ? void 0 : R(N(() => p({
            hadActivity: !0,
            end: T()
        })), a),
        d = o.subscribe(({
            isBusy: e
        }) => {
            z(l), z(s);
            let t = T();
            e || (s = R(N(() => p({
                hadActivity: !0,
                end: t
            })), 100))
        }),
        f = () => {
            c = !0, z(l), z(s), z(u), d.unsubscribe()
        };

    function p(e) {
        c || (f(), i(e))
    }
    return {
        stop: f
    }
}

function yc(e, t, n, r) {
    return new I(i => {
        let a = [],
            o, s = 0;
        return a.push(t.subscribe(e => {
            e.every(xc) || c()
        }), n.subscribe(c), dc(r, {
            type: Q.RESOURCE
        }).subscribe(e => {
            e.some(e => !bc(r, e.name)) && c()
        }), e.subscribe(7, e => {
            bc(r, e.url) || (o === void 0 && (o = e.requestIndex), s += 1, c())
        }), e.subscribe(8, e => {
            bc(r, e.url) || o === void 0 || e.requestIndex < o || (--s, c())
        })), () => {
            a.forEach(e => e.unsubscribe())
        };

        function c() {
            i.notify({
                isBusy: s > 0
            })
        }
    })
}

function bc(e, t) {
    return ai(e.excludedActivityUrls, t)
}

function xc(e) {
    let t = e.type === `characterData` ? e.target.parentElement : e.target;
    return !!(t && oc(t) && t.matches(`[data-dd-excluded-activity-mutations], [data-dd-excluded-activity-mutations] *`))
}
var Sc = `data-dd-action-name`,
    Cc = `Masked Element`,
    wc = `::shadow `,
    Tc = [Sc, `data-testid`, `data-test`, `data-qa`, `data-cy`, `data-test-id`, `data-qa-id`, `data-testing`, `data-component`, `data-element`, `data-source-file`],
    Ec = [Fc, Mc],
    Dc = [Fc, Nc, Pc];

function Oc(e, t) {
    if (!e.isConnected) return;
    let n = kc(e),
        r = [];
    for (let {
            rootNode: e,
            target: i
        } of n) {
        let n = Ac(i, e, t);
        if (!n) return;
        r.push(n)
    }
    return r.join(wc)
}

function kc(e) {
    let t = [],
        n = e;
    for (; n;) {
        let e = n.getRootNode();
        if (t.push({
                rootNode: e,
                target: n
            }), cc(e)) n = e.host;
        else break
    }
    return t.reverse()
}

function Ac(e, t, n) {
    let r, i = e;
    for (; i && i.nodeName !== `HTML`;) {
        let e = zc(i, t, Ec, Bc, n, r);
        if (e) return Hc(e, r);
        r = Hc(zc(i, t, Dc, Vc, n, r) || Lc(i), r), i = i.parentElement
    }
    return r
}

function jc(e) {
    return /[0-9]/.test(e)
}

function Mc(e) {
    if (e.id && !jc(e.id)) return `#${CSS.escape(e.id)}`
}

function Nc(e) {
    if (e.tagName === `BODY`) return;
    let t = e.classList;
    for (let n = 0; n < t.length; n += 1) {
        let r = t[n];
        if (!jc(r)) return `${CSS.escape(e.tagName)}.${CSS.escape(r)}`
    }
}

function Pc(e) {
    return CSS.escape(e.tagName)
}

function Fc(e, t) {
    if (t) {
        let e = n(t);
        if (e) return e
    }
    for (let e of Tc) {
        let t = n(e);
        if (t) return t
    }

    function n(t) {
        if (e.hasAttribute(t)) return `${CSS.escape(e.tagName)}${Ic(t,e.getAttribute(t))}`
    }
}

function Ic(e, t) {
    return `[${e}="${CSS.escape(t)}"]`
}

function Lc(e) {
    let t = Rc(e);
    return `${CSS.escape(e.tagName)}:nth-of-type(${t})`
}

function Rc(e) {
    let t = e.parentNode.firstElementChild,
        n = 1;
    for (; t && t !== e;) t.tagName === e.tagName && (n += 1), t = t.nextElementSibling;
    return n
}

function zc(e, t, n, r, i, a) {
    for (let o of n) {
        let n = o(e, i);
        if (n && r(e, t, n, a)) return n
    }
}

function Bc(e, t, n, r) {
    return t.querySelectorAll(Hc(n, r)).length === 1
}

function Vc(e, t, n, r) {
    let i;
    if (r === void 0) i = e => e.matches(n);
    else {
        let e = Hc(`${n}:scope`, r);
        i = t => t.querySelector(e) !== null
    }
    let a = e.previousElementSibling;
    for (; a;) {
        if (i(a)) return !1;
        a = a.previousElementSibling
    }
    for (a = e.nextElementSibling; a;) {
        if (i(a)) return !1;
        a = a.nextElementSibling
    }
    return !0
}

function Hc(e, t) {
    return t ? `${e}>${t}` : e
}
var $ = {
        IGNORE: `ignore`,
        HIDDEN: `hidden`,
        ALLOW: xi.ALLOW,
        MASK: xi.MASK,
        MASK_USER_INPUT: xi.MASK_USER_INPUT,
        MASK_UNLESS_ALLOWLISTED: xi.MASK_UNLESS_ALLOWLISTED
    },
    Uc = `data-dd-privacy`,
    Wc = `dd-privacy-`,
    Gc = {
        INPUT: !0,
        OUTPUT: !0,
        TEXTAREA: !0,
        SELECT: !0,
        OPTION: !0,
        DATALIST: !0,
        OPTGROUP: !0
    };

function Kc(e) {
    return `[${Uc}="${e}"], .${Wc}${e}`
}

function qc(e, t, n) {
    if (n && n.has(e)) return n.get(e);
    let r = lc(e),
        i = r ? qc(r, t, n) : t,
        a = Jc(Yc(e), i);
    return n && n.set(e, a), a
}

function Jc(e, t) {
    switch (t) {
        case $.HIDDEN:
        case $.IGNORE:
            return t
    }
    switch (e) {
        case $.ALLOW:
        case $.MASK:
        case $.MASK_USER_INPUT:
        case $.MASK_UNLESS_ALLOWLISTED:
        case $.HIDDEN:
        case $.IGNORE:
            return e;
        default:
            return t
    }
}

function Yc(e) {
    if (oc(e)) {
        if (e.tagName === `BASE`) return $.ALLOW;
        if (e.tagName === `INPUT`) {
            let t = e;
            if (t.type === `password` || t.type === `email` || t.type === `tel` || t.type === `hidden`) return $.MASK;
            let n = t.getAttribute(`autocomplete`);
            if (n && (n.startsWith(`cc-`) || n.endsWith(`-password`))) return $.MASK
        }
        if (e.matches(Kc($.HIDDEN))) return $.HIDDEN;
        if (e.matches(Kc($.MASK))) return $.MASK;
        if (e.matches(Kc($.MASK_UNLESS_ALLOWLISTED))) return $.MASK_UNLESS_ALLOWLISTED;
        if (e.matches(Kc($.MASK_USER_INPUT))) return $.MASK_USER_INPUT;
        if (e.matches(Kc($.ALLOW))) return $.ALLOW;
        if (el(e)) return $.IGNORE
    }
}

function Xc(e, t) {
    switch (t) {
        case $.MASK:
        case $.HIDDEN:
        case $.IGNORE:
            return !0;
        case $.MASK_UNLESS_ALLOWLISTED:
            return ic(e) ? Qc(e.parentNode) ? !0 : !tl(e.textContent || ``) : Qc(e);
        case $.MASK_USER_INPUT:
            return ic(e) ? Qc(e.parentNode) : Qc(e);
        default:
            return !1
    }
}

function Zc(e, t, n, r, i) {
    if (r !== $.MASK && r !== $.MASK_UNLESS_ALLOWLISTED || t === `data-dd-privacy` || Tc.includes(t) || t === i.actionNameAttribute) return !1;
    switch (t) {
        case `title`:
        case `alt`:
        case `placeholder`:
        case `aria-label`:
        case `name`:
            return !0
    }
    return !!(e === `A` && t === `href` || e === `IFRAME` && t === `srcdoc` || n && t.startsWith(`data-`) || (e === `IMG` || e === `SOURCE`) && (t === `src` || t === `srcset`))
}

function Qc(e) {
    if (!e || e.nodeType !== e.ELEMENT_NODE) return !1;
    let t = e;
    if (t.tagName === `INPUT`) switch (t.type) {
        case `button`:
        case `color`:
        case `reset`:
        case `submit`:
            return !1
    }
    return !!Gc[t.tagName]
}

function $c(e) {
    return e.replace(/\S/g, `x`)
}

function el(e) {
    if (e.nodeName === `SCRIPT`) return !0;
    if (e.nodeName === `LINK`) {
        let e = t(`rel`);
        return /preload|prefetch/i.test(e) && t(`as`) === `script` || e === `shortcut icon` || e === `icon`
    }
    if (e.nodeName === `META`) {
        let n = t(`name`),
            r = t(`rel`),
            i = t(`property`);
        return /^msapplication-tile(image|color)$/.test(n) || n === `application-name` || r === `icon` || r === `apple-touch-icon` || r === `shortcut icon` || n === `keywords` || n === `description` || /^(og|twitter|fb):/.test(i) || /^(og|twitter):/.test(n) || n === `pinterest` || n === `robots` || n === `googlebot` || n === `bingbot` || e.hasAttribute(`http-equiv`) || n === `author` || n === `generator` || n === `framework` || n === `publisher` || n === `progid` || /^article:/.test(i) || /^product:/.test(i) || n === `google-site-verification` || n === `yandex-verification` || n === `csrf-token` || n === `p:domain_verify` || n === `verify-v1` || n === `verification` || n === `shopify-checkout-api-token`
    }

    function t(t) {
        return (e.getAttribute(t) || ``).toLowerCase()
    }
    return !1
}

function tl(e) {
    return !e || !e.trim() ? !0 : window.$DD_ALLOW ? .has(e.toLocaleLowerCase()) || !1
}

function nl(e, t) {
    return tl(e) ? e : t || $c(e)
}

function rl({
    lifeCycle: e,
    isChildEvent: t,
    onChange: n = B
}) {
    let r = {
            errorCount: 0,
            longTaskCount: 0,
            resourceCount: 0,
            actionCount: 0,
            frustrationCount: 0
        },
        i = e.subscribe(13, e => {
            if (!(e.type === `view` || e.type === `vital` || !t(e))) switch (e.type) {
                case Z.ERROR:
                    r.errorCount += 1, n();
                    break;
                case Z.ACTION:
                    r.actionCount += 1, e.action.frustration && (r.frustrationCount += e.action.frustration.type.length), n();
                    break;
                case Z.LONG_TASK:
                    r.longTaskCount += 1, n();
                    break;
                case Z.RESOURCE:
                    e._dd ? .discarded || (r.resourceCount += 1, n());
                    break
            }
        });
    return {
        stop: () => {
            i.unsubscribe()
        },
        eventCounts: r
    }
}
var il = 5 * S;

function al(e) {
    let t = Yi({
            expireDelay: il
        }),
        n = new Map;

    function r(e) {
        n.delete(e.key), e.eventCounts ? .stop()
    }

    function i() {
        n.forEach(e => {
            r(e)
        }), t.reset()
    }
    let a = e.subscribe(10, i);

    function o(i, a, o, s) {
        let c = M(),
            l = t.add(c, a.relative),
            u = n.get(i);
        u && r(u);
        let d = {
            id: c,
            key: i,
            startClocks: a,
            data: o,
            historyEntry: l,
            eventCounts: s ? .isChildEvent ? rl({
                lifeCycle: e,
                isChildEvent: s.isChildEvent(c)
            }) : void 0
        };
        return n.set(i, d), d
    }

    function s(e, t, i) {
        let a = n.get(e);
        if (!a) return;
        let o = i ? En(a.data, i) : a.data;
        a.historyEntry.close(t.relative);
        let s = O(a.startClocks.timeStamp, t.timeStamp),
            c = a.eventCounts ? .eventCounts;
        return r(a), { ...o,
            id: a.id,
            startClocks: a.startClocks,
            duration: s,
            counts: c
        }
    }

    function c(e) {
        let t = n.get(e);
        if (!t) return;
        let i = t.eventCounts ? .eventCounts;
        return r(t), t.historyEntry.remove(), { ...t.data,
            id: t.id,
            startClocks: t.startClocks,
            counts: i
        }
    }

    function l(e) {
        return t.findAll(e)
    }

    function u(e) {
        return n.get(e) ? .eventCounts ? .eventCounts
    }

    function d() {
        a.unsubscribe(), i(), t.stop()
    }
    return {
        start: o,
        stop: s,
        discard: c,
        getCounts: u,
        findId: l,
        stopAll: d
    }
}
var ol = [`HTML`, `BODY`],
    sl = 2 * ut,
    cl = Tc.concat([`role`, `type`, `disabled`, `readonly`, `tabindex`, `draggable`, `target`, `rel`, `download`, `method`, `action`, `enctype`, `autocomplete`]);

function ll(e, t) {
    let n = e.filter(e => e instanceof Element && !ol.includes(e.tagName));
    if (n.length === 0) return ``;
    let r = t ? [t].concat(cl) : cl,
        i = ``;
    for (let e of n) {
        let t = ul(e, r);
        if (i += t, i.length >= sl) return ye(i, sl)
    }
    return i
}

function ul(e, t) {
    let n = Pc(e),
        r = Mc(e),
        i = dl(e),
        a = pl(e, t),
        o = fl(e);
    return `${n}${r||``}${a}${i}${o};`
}

function dl(e) {
    return Array.from(e.classList).filter(e => !jc(e)).sort().map(e => `.${CSS.escape(e)}`).join(``)
}

function fl(e) {
    let t = Array.from(e.parentNode.children);
    if (t.length <= 1) return ``;
    let n = t.filter(t => t.tagName === e.tagName),
        r = t.indexOf(e),
        i = Rc(e);
    return `:nth-child(${r+1})${n.length>1?`:nth-of-type(${i})`:``}`
}

function pl(e, t) {
    let n = [],
        r = Array.from(e.attributes);
    for (let e of r) t.includes(e.name) && n.push(Ic(e.name, e.value));
    return n.sort().join(``)
}
var ml = x;

function hl(e, t) {
    let n = [],
        r = 0,
        i;
    a(e);

    function a(e) {
        e.stopObservable.subscribe(o), n.push(e), z(i), i = R(s, ml)
    }

    function o() {
        r === 1 && n.every(e => e.isStopped()) && (r = 2, t(n))
    }

    function s() {
        z(i), r === 0 && (r = 1, o())
    }
    return {
        tryAppend: e => r === 0 ? n.length > 0 && !gl(n[n.length - 1].event, e.event) ? (s(), !1) : (a(e), !0) : !1,
        stop: () => {
            s()
        }
    }
}

function gl(e, t) {
    return e.target === t.target && _l(e, t) <= 100 && e.timeStamp - t.timeStamp <= ml
}

function _l(e, t) {
    return Math.sqrt((e.clientX - t.clientX) ** 2 + (e.clientY - t.clientY) ** 2)
}

function vl(e, t, n = $.ALLOW) {
    let r = new Map,
        {
            actionNameAttribute: i
        } = t,
        a = yl(e, `data-dd-action-name`) || i && yl(e, i);
    return a ? {
        name: a,
        nameSource: `custom_attribute`
    } : n === $.MASK ? {
        name: Cc,
        nameSource: `mask_placeholder`
    } : wl(e, xl, t, r) || wl(e, Sl, t, r) || {
        name: ``,
        nameSource: `blank`
    }
}

function yl(e, t) {
    let n = bl(e, `[${t}]`);
    if (n) return El(Tl(n.getAttribute(t).trim()))
}

function bl(e, t) {
    let n = e;
    for (; n;) {
        if (n.matches(t)) return n;
        n = uc(n)
    }
    return null
}
var xl = [(e, t, n) => {
        if (`labels` in e && e.labels && e.labels.length > 0) return kl(e.labels[0], t, n)
    }, e => {
        if (e.nodeName === `INPUT`) {
            let t = e,
                n = t.getAttribute(`type`);
            if (n === `button` || n === `submit` || n === `reset`) return {
                name: t.value,
                nameSource: `text_content`
            }
        }
    }, (e, t, n) => {
        if (e.nodeName === `BUTTON` || e.nodeName === `LABEL` || e.getAttribute(`role`) === `button`) return kl(e, t, n)
    }, (e, t, n) => Ol(e, `aria-label`, t, n), (e, t, n) => {
        let r = e.getAttribute(`aria-labelledby`);
        if (r) return {
            name: r.split(/\s+/).map(t => Dl(e, t)).filter(e => !!e).map(e => Al(e, t, n)).join(` `),
            nameSource: `text_content`
        }
    }, (e, t, n) => Ol(e, `alt`, t, n), (e, t, n) => Ol(e, `name`, t, n), (e, t, n) => Ol(e, `title`, t, n), (e, t, n) => Ol(e, `placeholder`, t, n), (e, t, n) => {
        if (`options` in e && e.options.length > 0) return kl(e.options[0], t, n)
    }],
    Sl = [(e, t, n) => kl(e, t, n)],
    Cl = 10;

function wl(e, t, n, r) {
    let i = e,
        a = 0;
    for (; a <= Cl && i && i.nodeName !== `BODY` && i.nodeName !== `HTML` && i.nodeName !== `HEAD`;) {
        for (let e of t) {
            let t = e(i, n, r);
            if (t) {
                let {
                    name: e,
                    nameSource: n
                } = t, r = e && e.trim();
                if (r) return {
                    name: El(Tl(r)),
                    nameSource: n
                }
            }
        }
        if (i.nodeName === `FORM`) break;
        i = uc(i), a += 1
    }
}

function Tl(e) {
    return e.replace(/\s+/g, ` `)
}

function El(e) {
    return e.length > 100 ? `${ye(e,100)} [...]` : e
}

function Dl(e, t) {
    let n = e.getRootNode();
    if (n instanceof ShadowRoot) {
        let e = n.getElementById(t);
        if (e) return e
    }
    return e.ownerDocument ? e.ownerDocument.getElementById(t) : null
}

function Ol(e, t, n, r) {
    let {
        enablePrivacyForActionName: i,
        defaultPrivacyLevel: a
    } = n, o = e.getAttribute(t);
    if (o && i) {
        let i = qc(e, a, r);
        Zc(e.tagName, t, o, i, n) && (o = nl(o, Cc))
    } else o || = ``;
    return {
        name: o,
        nameSource: `standard_attribute`
    }
}

function kl(e, t, n) {
    return {
        name: Al(e, t, n) || ``,
        nameSource: `text_content`
    }
}

function Al(e, t, n) {
    if (e.isContentEditable) return;
    let {
        enablePrivacyForActionName: r,
        actionNameAttribute: i,
        defaultPrivacyLevel: a
    } = t, o = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, c), s = ``;
    for (; o.nextNode();) {
        let e = o.currentNode;
        if (oc(e)) {
            (e.nodeName === `BR` || e.nodeName === `P` || [`block`, `flex`, `grid`, `list-item`, `table`, `table-caption`].includes(getComputedStyle(e).display)) && (s += ` `);
            continue
        }
        s += e.textContent || ``
    }
    return s.replace(/\s+/g, ` `).trim();

    function c(e) {
        let t = qc(e, a, n);
        if (r && t && Xc(e, t)) return NodeFilter.FILTER_REJECT;
        if (oc(e)) {
            if (e.hasAttribute(`data-dd-action-name`) || i && e.hasAttribute(i)) return NodeFilter.FILTER_REJECT;
            let t = getComputedStyle(e);
            if (t.visibility !== `visible` || t.display === `none` || t.contentVisibility && t.contentVisibility !== `visible`) return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT
    }
}

function jl(e, {
    onPointerDown: t,
    onPointerUp: n
}) {
    let r, i = {
            selection: !1,
            input: !1,
            scroll: !1
        },
        a, o = [U(e, window, `pointerdown`, e => {
            Nl(e) && (r = Ml(), i = {
                selection: !1,
                input: !1,
                scroll: !1
            }, a = t(e))
        }, {
            capture: !0
        }), U(e, window, `selectionchange`, () => {
            (!r || !Ml()) && (i.selection = !0)
        }, {
            capture: !0
        }), U(e, window, `scroll`, () => {
            i.scroll = !0
        }, {
            capture: !0,
            passive: !0
        }), U(e, window, `pointerup`, e => {
            if (Nl(e) && a) {
                let t = i;
                n(a, e, () => t), a = void 0
            }
        }, {
            capture: !0
        }), U(e, window, `input`, () => {
            i.input = !0
        }, {
            capture: !0
        })];
    return {
        stop: () => {
            o.forEach(e => e.stop())
        }
    }
}

function Ml() {
    let e = window.getSelection();
    return !e || e.isCollapsed
}

function Nl(e) {
    return e.target instanceof Element && e.isPrimary !== !1
}
var Pl = 3;

function Fl(e, t) {
    if (Il(e)) return t.addFrustration(xo.RAGE_CLICK), e.some(Rl) && t.addFrustration(xo.DEAD_CLICK), t.hasError && t.addFrustration(xo.ERROR_CLICK), {
        isRage: !0
    };
    let n = e.some(e => e.getUserActivity().selection);
    return e.forEach(e => {
        e.hasError && e.addFrustration(xo.ERROR_CLICK), Rl(e) && !n && e.addFrustration(xo.DEAD_CLICK)
    }), {
        isRage: !1
    }
}

function Il(e) {
    if (e.some(e => e.getUserActivity().selection || e.getUserActivity().scroll)) return !1;
    for (let t = 0; t < e.length - (Pl - 1); t += 1)
        if (e[t + Pl - 1].event.timeStamp - e[t].event.timeStamp <= 1e3) return !0;
    return !1
}
var Ll = `input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="range"]),textarea,select,[contenteditable],[contenteditable] *,canvas,a[href],a[href] *`;

function Rl(e) {
    if (e.hasPageActivity || e.getUserActivity().input || e.getUserActivity().scroll) return !1;
    let t = e.event.target;
    return t.tagName === `LABEL` && t.hasAttribute(`for`) && (t = document.getElementById(t.getAttribute(`for`))), !t || !t.matches(Ll)
}
var zl = 10 * x,
    Bl = new Map;

function Vl(e) {
    let t = Bl.get(e);
    return Bl.delete(e), t
}

function Hl(e, t) {
    Bl.set(e, t), Bl.forEach((e, t) => {
        O(t, E()) > zl && Bl.delete(t)
    })
}

function Ul(e) {
    return t => t.action !== void 0 && t.action.id !== void 0 && t.action.id.includes(e)
}

function Wl(e, t, n, r) {
    let i = al(e),
        a = new I,
        o;
    e.subscribe(5, l), e.subscribe(11, l);
    let {
        stop: s
    } = jl(r, {
        onPointerDown: i => Gl(r, e, t, i, n),
        onPointerUp: ({
            clickActionBase: o,
            hadActivityOnPointerDown: s
        }, l, u) => {
            Kl(r, e, t, n, i, a, c, o, l, u, s)
        }
    });
    return {
        stop: () => {
            l(), a.notify(), s(), i.stopAll()
        },
        findActionId: i.findId
    };

    function c(e) {
        if (!o || !o.tryAppend(e)) {
            let t = e.clone();
            o = hl(e, e => {
                Xl(e, t), o = void 0
            })
        }
    }

    function l() {
        o && o.stop()
    }
}

function Gl(e, t, n, r, i) {
    let a;
    if (a = e.enablePrivacyForActionName ? qc(Jl(r), e.defaultPrivacyLevel) : $.ALLOW, a === $.HIDDEN) return;
    let o = ql(r, a, e),
        s = !1;
    return vc(t, n, i, e, e => {
        s = e.hadActivity
    }, 100), {
        clickActionBase: o,
        hadActivityOnPointerDown: () => s
    }
}

function Kl(e, t, n, r, i, a, o, s, c, l, u) {
    let d = Yl(t, i, l, s, c);
    o(d);
    let f = s ? .target ? .selector;
    f && Hl(c.timeStamp, f);
    let {
        stop: p
    } = vc(t, n, r, e, e => {
        e.hadActivity && e.end < d.startClocks.timeStamp ? d.discard() : e.hadActivity ? d.stop(e.end) : u() ? d.stop(d.startClocks.timeStamp) : d.stop()
    }, zl), m = t.subscribe(5, ({
        endClocks: e
    }) => {
        d.stop(e.timeStamp)
    }), h = t.subscribe(11, () => {
        d.stop(T())
    }), g = a.subscribe(() => {
        d.stop()
    });
    d.stopObservable.subscribe(() => {
        h.unsubscribe(), m.unsubscribe(), p(), g.unsubscribe()
    })
}

function ql(e, t, n) {
    let r = Jl(e),
        i = r.getBoundingClientRect(),
        a = Oc(r, n.actionNameAttribute),
        o = ll(e.composedPath(), n.actionNameAttribute);
    a && Hl(e.timeStamp, a);
    let {
        name: s,
        nameSource: c
    } = vl(r, n, t);
    return {
        type: bo.CLICK,
        target: {
            width: Math.round(i.width),
            height: Math.round(i.height),
            selector: a,
            composedPathSelector: o || void 0
        },
        position: {
            x: Math.round(e.clientX - i.left),
            y: Math.round(e.clientY - i.top)
        },
        name: s,
        nameSource: c
    }
}

function Jl(e) {
    if (e.composed && sc(e.target) && typeof e.composedPath == `function`) {
        let t = e.composedPath();
        if (t.length > 0 && t[0] instanceof Element) return t[0]
    }
    return e.target
}

function Yl(e, t, n, r, i) {
    let a = M(),
        o = re(i.timeStamp),
        s = t.start(a, o, r, {
            isChildEvent: Ul
        });
    e.notify(15, s);
    let c = 0,
        l, u = [],
        d = new I;

    function f(e) {
        c === 0 && (c = 1, l = e ? t.stop(a, ie(e)) : t.discard(a), d.notify())
    }
    return {
        event: i,
        stop: f,
        stopObservable: d,
        get hasError() {
            let e = l ? .counts ? ? t.getCounts(a);
            return e ? e.errorCount > 0 : !1
        },
        get hasPageActivity() {
            return l && `duration` in l
        },
        getUserActivity: n,
        addFrustration: e => {
            u.push(e)
        },
        get startClocks() {
            return o
        },
        isStopped: () => c === 1 || c === 2,
        clone: () => Yl(e, t, n, r, i),
        validate: t => {
            if (f(), c !== 1 || !l) return;
            let n = {
                frustrationTypes: u,
                events: t ? ? [i],
                event: i,
                ...l,
                counts: l.counts
            };
            e.notify(0, n), c = 2
        },
        discard: () => {
            f(), c = 2
        }
    }
}

function Xl(e, t) {
    let {
        isRage: n
    } = Fl(e, t);
    n ? (e.forEach(e => e.discard()), t.stop(T()), t.validate(e.map(e => e.event))) : (t.discard(), e.forEach(e => e.validate()))
}

function Zl(e, t) {
    let n = al(e);

    function r(t, r = {}, i = D()) {
        let a = r.actionKey ? ? t,
            o = n.start(a, i, {
                name: t,
                ...r
            }, {
                isChildEvent: Ul
            });
        e.notify(15, o)
    }

    function i(e, r = {}, i = D()) {
        let a = r.actionKey ? ? e,
            o = n.stop(a, i, r);
        if (!o) return;
        let s = [];
        o.counts && o.counts.errorCount > 0 && s.push(xo.ERROR_CLICK), t({ ...o,
            type: o.type || bo.CUSTOM,
            frustrationTypes: s
        })
    }

    function a(e) {
        t({
            id: M(),
            frustrationTypes: [],
            ...e
        })
    }
    return {
        addAction: a,
        startAction: r,
        stopAction: i,
        findActionId: n.findId,
        stop: n.stopAll
    }
}

function Ql(e, t, n, r, i) {
    let {
        unsubscribe: a
    } = e.subscribe(0, t => {
        e.notify(12, $l(t))
    }), o = B, s;
    i.trackUserInteractions && (s = Wl(e, n, r, i));
    let c = Zl(e, t => {
            e.notify(12, $l(t))
        }),
        l = {
            findActionId: e => {
                let t = c.findActionId(e),
                    n = s ? .findActionId(e) ? ? [];
                return t.concat(n)
            }
        };
    return t.register(0, ({
        startTime: e,
        eventType: t
    }) => {
        if (t !== Z.ERROR && t !== Z.RESOURCE && t !== Z.LONG_TASK) return W;
        let n = t === Z.LONG_TASK ? ce(e, 1) : e,
            r = l.findActionId(n);
        return r.length ? {
            type: t,
            action: {
                id: r
            }
        } : W
    }), t.register(1, ({
        startTime: e
    }) => ({
        action: {
            id: l.findActionId(e)
        }
    })), {
        addAction: c.addAction,
        startAction: c.startAction,
        stopAction: c.stopAction,
        actionContexts: l,
        stop: () => {
            a(), o(), c.stop(), s ? .stop()
        }
    }
}

function $l(e) {
    let t = eu(e),
        n = rc(C(e.duration));
    return {
        rawRumEvent: {
            type: Z.ACTION,
            date: e.startClocks.timeStamp,
            action: {
                id: e.id,
                target: {
                    name: e.name
                },
                type: e.type,
                ...n !== void 0 && {
                    loading_time: n
                },
                ...e.counts && {
                    error: {
                        count: e.counts.errorCount
                    },
                    long_task: {
                        count: e.counts.longTaskCount
                    },
                    resource: {
                        count: e.counts.resourceCount
                    }
                },
                frustration: {
                    type: e.frustrationTypes
                }
            },
            ...t ? {
                _dd: {
                    action: {
                        target: {
                            selector: e.target ? .selector || void 0,
                            width: e.target ? .width || void 0,
                            height: e.target ? .height || void 0,
                            composed_path_selector: e.target ? .composedPathSelector
                        },
                        position: e.position,
                        name_source: e.nameSource
                    }
                }
            } : {
                context: e.context
            }
        },
        duration: e.duration,
        startClocks: e.startClocks,
        domainContext: t ? {
            events: e.events
        } : {
            handlingStack: e.handlingStack
        }
    }
}

function eu(e) {
    return `events` in e
}

function tu(e, t) {
    let n = Fi(e, [Pi.cspViolation, Pi.intervention]).subscribe(e => t.notify(e));
    return {
        stop: () => {
            n.unsubscribe()
        }
    }
}

function nu(e, n, r) {
    let i = new I;
    return r.subscribe(({
        data: e,
        type: n
    }) => {
        n === 0 ? i.notify(e) : n === 3 && e.api === t.error && i.notify(e.error)
    }), tu(n, i), i.subscribe(t => e.notify(14, {
        error: t
    })), ru(e)
}

function ru(e) {
    return e.subscribe(14, ({
        error: t
    }) => {
        e.notify(12, iu(t))
    }), {
        addError: ({
            error: t,
            handlingStack: n,
            componentStack: r,
            startClocks: i,
            context: a
        }) => {
            let o = tn({
                originalError: t,
                handlingStack: n,
                componentStack: r,
                startClocks: i,
                nonErrorPrefix: `Provided`,
                source: Mn.CUSTOM,
                handling: `handled`
            });
            o.context = En(o.context, a), e.notify(14, {
                error: o
            })
        }
    }
}

function iu(e) {
    let t = {
            date: e.startClocks.timeStamp,
            error: {
                id: M(),
                message: e.message,
                source: e.source,
                stack: e.stack,
                handling_stack: e.handlingStack,
                component_stack: e.componentStack,
                type: e.type,
                handling: e.handling,
                causes: e.causes,
                source_type: `browser`,
                fingerprint: e.fingerprint,
                csp: e.csp
            },
            type: Z.ERROR,
            context: e.context
        },
        n = {
            error: e.originalError,
            handlingStack: e.handlingStack
        };
    return {
        rawRumEvent: t,
        startClocks: e.startClocks,
        domainContext: n
    }
}
var au = 2 * S;

function ou(e) {
    let t = su(e) || cu(e);
    if (!(!t || t.traceTime <= A() - au)) return t.traceId
}

function su(e) {
    let t = e.querySelector(`meta[name=dd-trace-id]`),
        n = e.querySelector(`meta[name=dd-trace-time]`);
    return lu(t && t.content, n && n.content)
}

function cu(e) {
    let t = uu(e);
    if (t) return lu(ge(t, `trace-id`), ge(t, `trace-time`))
}

function lu(e, t) {
    let n = t && Number(t);
    if (!(!e || !n)) return {
        traceId: e,
        traceTime: n
    }
}

function uu(e) {
    for (let t = 0; t < e.childNodes.length; t += 1) {
        let n = du(e.childNodes[t]);
        if (n) return n
    }
    if (e.body)
        for (let t = e.body.childNodes.length - 1; t >= 0; --t) {
            let n = e.body.childNodes[t],
                r = du(n);
            if (r) return r;
            if (!ic(n)) break
        }
}

function du(e) {
    if (e && ac(e)) {
        let t = /^\s*DATADOG;(.*?)\s*$/.exec(e.data);
        if (t) return t[1]
    }
}

function fu() {
    if (hc(Q.NAVIGATION)) {
        let e = performance.getEntriesByType(Q.NAVIGATION)[0];
        if (e) return e
    }
    let e = pu(),
        t = {
            entryType: Q.NAVIGATION,
            initiatorType: `navigation`,
            name: window.location.href,
            startTime: 0,
            duration: e.loadEventEnd,
            decodedBodySize: 0,
            encodedBodySize: 0,
            transferSize: 0,
            workerStart: 0,
            toJSON: () => ({ ...t,
                toJSON: void 0
            }),
            ...e
        };
    return t
}

function pu() {
    let e = {},
        t = performance.timing;
    for (let n in t)
        if (p(t[n])) {
            let r = n,
                i = t[r];
            e[r] = i === 0 ? 0 : le(i)
        }
    return e
}

function mu(e) {
    return e.responseStart >= 0 && e.responseStart <= E() ? e.responseStart : void 0
}

function hu() {
    if (hc(Q.RESOURCE)) return performance.getEntriesByType(Q.RESOURCE)
}

function gu(e, t) {
    let n = hu();
    if (n) return Ie(n, n => n.name === e && n.startTime <= t)
}

function _u(e) {
    let t = new Set,
        n = !1,
        r = e.subscribe(8, e => {
            if (t.add(e), t.size > 1e3) {
                let e = t.values().next().value;
                if (!n) {
                    n = !0;
                    let r;
                    if (dn(H.TOO_MANY_REQUESTS_INVESTIGATION)) {
                        let n = 0,
                            i = 0,
                            a = 0,
                            o = 0;
                        for (let e of t) e.isAborted && n++, e.isAbortedOnStart && i++, e.type === po.XHR && a++, performance.getEntriesByName(e.url, `resource`).some(t => t.startTime >= e.startClocks.relative) || o++;
                        let s = T() - e.startClocks.timeStamp;
                        r = {
                            abortedCount: n,
                            abortedOnStartCount: i,
                            xhrCount: a,
                            fetchCount: t.size - a,
                            oldestRequestAge: s,
                            oldestRequestEndAge: s - e.duration,
                            withoutMatchingEntryCount: o
                        }
                    }
                    Er(`Too many requests`, r)
                }
                t.delete(e)
            }
        });
    return {
        getMatchingRequest(e) {
            let n = 1 / 0,
                r;
            for (let i of t) {
                let t = e.startTime - i.startClocks.relative;
                0 <= t && t < n && i.url === e.name && (n = Math.abs(t), r = i)
            }
            return r && t.delete(r), r
        },
        stop() {
            r.unsubscribe()
        }
    }
}

function vu(e, t) {
    function n(e, n = {}, r = D()) {
        let i = n.resourceKey ? ? e;
        t.start(i, r, {
            url: e,
            ...n
        })
    }

    function r(n, r = {}, i = D()) {
        let a = r.resourceKey ? ? n,
            o = t.stop(a, i, {
                context: r.context,
                type: r.type
            });
        if (!o) return;
        let s = O(o.startClocks.relative, i.relative),
            c = {
                date: o.startClocks.timeStamp,
                type: Z.RESOURCE,
                resource: {
                    id: o.id,
                    type: o.type || X.OTHER,
                    url: Ps(o.url),
                    duration: C(s),
                    method: o.method,
                    status_code: r.statusCode,
                    size: r.size
                },
                _dd: {},
                context: o.context
            };
        e.notify(12, {
            rawRumEvent: c,
            startClocks: o.startClocks,
            duration: s,
            domainContext: {
                isManual: !0
            }
        })
    }
    return {
        startResource: n,
        stopResource: r
    }
}

function yu(e, t) {
    let n = L(Aa)(),
        r = _u(e),
        i = dc(t, {
            type: Q.RESOURCE,
            buffered: !0
        }).subscribe(e => {
            for (let n of e) o(() => bu(n, r, t))
        }),
        {
            stop: a
        } = fa(t, `interactive`, () => {
            o(() => bu(fu(), r, t))
        });

    function o(t) {
        n.push(() => {
            let n = t();
            n && e.notify(12, n)
        })
    }
    let s = al(e),
        c = vu(e, s);
    return {
        startResource: c.startResource,
        stopResource: c.stopResource,
        stop: () => {
            a(), n.stop(), i.unsubscribe(), s.stopAll()
        }
    }
}

function bu(e, t, n) {
    let r = xs(e) ? t.getMatchingRequest(e) : void 0,
        i = r ? wu(r, n) : Tu(e, n);
    if (!n.trackResources && !i) return;
    let a = re(e.startTime),
        o = Ss(e),
        s = Du(r, n);
    return {
        startClocks: a,
        duration: o,
        rawRumEvent: En({
            date: a.timeStamp,
            resource: {
                id: M(),
                duration: C(o),
                type: ys(e),
                method: r ? .method,
                status_code: r ? r.status : Eu(e.responseStatus),
                url: r ? Ps(r.url) : e.name,
                protocol: Os(e),
                delivery_type: ks(e),
                graphql: r && xu(r, n),
                render_blocking_status: e.renderBlockingStatus,
                ...As(e),
                ...Cs(e)
            },
            type: Z.RESOURCE,
            _dd: {
                discarded: !n.trackResources
            }
        }, i, Su(e), s),
        domainContext: Cu(e, r)
    }
}

function xu(e, t) {
    let n = Ks(e.url, t);
    if (n) return Ws(e, n)
}

function Su(e) {
    let t = e.contentType;
    if (t) return {
        resource: {
            response: {
                headers: {
                    "content-type": t
                }
            }
        }
    }
}

function Cu(e, t) {
    return {
        performanceEntry: e,
        isManual: !1,
        isAborted: t ? t.isAborted : !1,
        handlingStack: t ? .handlingStack,
        requestInit: t ? .init,
        requestInput: t ? .input,
        response: t ? .response,
        error: t ? .error,
        xhr: t ? .xhr
    }
}

function wu(e, t) {
    if (e.traceSampled && e.traceId && e.spanId) return {
        _dd: {
            span_id: e.spanId.toString(),
            trace_id: e.traceId.toString(),
            rule_psr: t.rulePsr
        }
    }
}

function Tu(e, t) {
    if (e.initiatorType !== `navigation`) return;
    let n = L(ou)(document);
    if (n) return {
        _dd: {
            trace_id: n,
            span_id: Is().toString(),
            rule_psr: t.rulePsr
        }
    }
}

function Eu(e) {
    return e === 0 ? void 0 : e
}

function Du(e, t) {
    let n = t.trackResourceHeaders;
    if (n.length === 0 || !e) return;
    let r = n.filter(t => t.url === void 0 ? !0 : ai([t.url], e.url, !0));
    if (r.length === 0) return;
    let i = r.filter(e => e.location === void 0 || e.location === `any` || e.location === `response`),
        a = r.filter(e => e.location === void 0 || e.location === `any` || e.location === `request`),
        o = i.length > 0 ? Ou(e, i) : void 0,
        s = a.length > 0 ? ku(e, a) : void 0;
    if (!(!o && !s)) return {
        resource: {
            request: s ? {
                headers: s
            } : void 0,
            response: o ? {
                headers: o
            } : void 0
        }
    }
}

function Ou(e, t) {
    if (e.type === po.FETCH && e.response) return Nu(e.response.headers, t);
    if (e.type === po.XHR && e.xhr) {
        let n = e.xhr.getAllResponseHeaders();
        if (n) try {
            return Nu(new Headers(Pu(n)), t)
        } catch {}
    }
}

function ku(e, t) {
    if (e.type !== po.FETCH) return;
    let n;
    return e.init ? .headers ? n = new Headers(e.init.headers) : e.input instanceof Request && (n = e.input.headers), n ? Nu(n, t) : void 0
}
var Au = /(token|cookie|secret|authorization|(api|secret|access|app).?key|(client|connecting|real).?ip|forwarded)/,
    ju = 100,
    Mu = 128;

function Nu(e, t) {
    let n = {},
        r = 0,
        i = 0,
        o = !1;
    return e.forEach((e, s) => {
        if (i++, r >= ju) {
            o || = (a.warn(`Maximum number of headers (${ju}) has been reached. Further headers are dropped.`), !0);
            return
        }
        let c = s.toLowerCase();
        if (Au.test(c)) return;
        let l = t.find(e => ai([e.name], c));
        if (!l) return;
        let {
            extractor: u
        } = l, d = u ? Io(e, u) : e;
        d !== void 0 && (d.length > Mu && (a.warn(`Header "${c}" value was truncated from ${d.length} to ${Mu} characters.`), Er(`Resource header value was truncated`, {
            header_name: c,
            original_length: d.length,
            limit: Mu
        })), n[c] = ye(d, Mu), r++)
    }), o && Er(`Maximum number of resource headers reached`, {
        collectedHeaderCount: r,
        totalHeaderCount: i
    }), r > 0 ? n : void 0
}

function Pu(e) {
    let t = [],
        n = e.trim().split(/\r\n/);
    for (let e of n) {
        let n = e.indexOf(`:`);
        n > 0 && t.push([e.substring(0, n).trim(), e.substring(n + 1).trim()])
    }
    return t
}

function Fu(e, t, n) {
    let {
        stop: r,
        eventCounts: i
    } = rl({
        lifeCycle: e,
        isChildEvent: e => e.view.id === t,
        onChange: n
    });
    return {
        stop: r,
        eventCounts: i
    }
}
var Iu = 10 * S;

function Lu(e, t, n) {
    return {
        stop: dc(e, {
            type: Q.PAINT,
            buffered: !0
        }).subscribe(e => {
            let r = e.find(e => e.name === `first-contentful-paint` && e.startTime < t.timeStamp && e.startTime < Iu);
            r && n(r.startTime)
        }).unsubscribe
    }
}

function Ru(e, t) {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            t(O(e, E()))
        })
    })
}

function zu(e, t) {
    return Hu(e, () => {
        let e = L(fu)();
        Vu(e) || t(Bu(e))
    })
}

function Bu(e) {
    return {
        domComplete: e.domComplete,
        domContentLoaded: e.domContentLoadedEventEnd,
        domInteractive: e.domInteractive,
        loadEvent: e.loadEventEnd,
        firstByte: mu(e)
    }
}

function Vu(e) {
    return e.loadEventEnd <= 0
}

function Hu(e, t) {
    let n, {
        stop: r
    } = fa(e, `complete`, () => {
        n = R(() => t())
    });
    return {
        stop: () => {
            r(), z(n)
        }
    }
}
var Uu = 10 * S;

function Wu(e, t, n, r) {
    let i = 1 / 0,
        {
            stop: a
        } = tr(e, n, [`pointerdown`, `keydown`], e => {
            i = e.timeStamp
        }, {
            capture: !0,
            once: !0
        }),
        o = 0,
        s = dc(e, {
            type: Q.LARGEST_CONTENTFUL_PAINT,
            buffered: !0
        }).subscribe(n => {
            let a = Ie(n, e => e.entryType === Q.LARGEST_CONTENTFUL_PAINT && e.startTime < i && e.startTime < t.timeStamp && e.startTime < Uu && e.size > o);
            if (a) {
                let t;
                a.element && (t = Oc(a.element, e.actionNameAttribute));
                let n = Gu(a),
                    i = a.startTime,
                    s = Ku(n, i);
                r({
                    value: i,
                    targetSelector: t,
                    resourceUrl: n,
                    subParts: s
                }), o = a.size
            }
        });
    return {
        stop: () => {
            a(), s.unsubscribe()
        }
    }
}

function Gu(e) {
    return e.url === `` ? void 0 : e.url
}

function Ku(e, t) {
    let n = mu(fu());
    if (n === void 0) return;
    let r = e ? gu(e, t) : void 0,
        i = r ? Math.max(n, r.requestStart || r.startTime) : n,
        a = Math.min(t, Math.max(i, r ? .responseEnd || 0));
    return {
        loadDelay: i - n,
        loadTime: a - i,
        renderDelay: t - a
    }
}

function qu(e, t, n = window) {
    if (document.visibilityState === `hidden`) return {
        timeStamp: 0,
        stop: B
    };
    if (hc(Q.VISIBILITY_STATE)) {
        let e = performance.getEntriesByType(Q.VISIBILITY_STATE).filter(e => e.name === `hidden`).find(e => e.startTime >= t.relative);
        if (e) return {
            timeStamp: e.startTime,
            stop: B
        }
    }
    let r = 1 / 0,
        {
            stop: i
        } = tr(e, n, [`pagehide`, `visibilitychange`], e => {
            (e.type === `pagehide` || document.visibilityState === `hidden`) && (r = e.timeStamp, i())
        }, {
            capture: !0
        });
    return {
        get timeStamp() {
            return r
        },
        stop: i
    }
}

function Ju(e, t, n, r) {
    let i = {},
        {
            stop: a
        } = zu(e, e => {
            n(e.loadEvent), i.navigationTimings = e, r()
        }),
        o = qu(e, t),
        {
            stop: s
        } = Lu(e, o, e => {
            i.firstContentfulPaint = e, r()
        }),
        {
            stop: c
        } = Wu(e, o, window, e => {
            i.largestContentfulPaint = e, r()
        });

    function l() {
        a(), s(), c(), o.stop()
    }
    return {
        stop: l,
        initialViewMetrics: i
    }
}
var Yu = (e, t) => e * t,
    Xu = (e, t) => {
        let n = Math.max(e.left, t.left),
            r = Math.max(e.top, t.top),
            i = Math.min(e.right, t.right),
            a = Math.min(e.bottom, t.bottom);
        return n >= i || r >= a ? 0 : Yu(i - n, a - r)
    },
    Zu = e => {
        let t = Yu(e.previousRect.width, e.previousRect.height),
            n = Yu(e.currentRect.width, e.currentRect.height),
            r = Xu(e.previousRect, e.currentRect);
        return t + n - r
    };

function Qu(e, t, n) {
    if (!id()) return {
        stop: B
    };
    let r = 0,
        i;
    n({
        value: 0
    });
    let a = rd(),
        o = dc(e, {
            type: Q.LAYOUT_SHIFT,
            buffered: !0
        }).subscribe(o => {
            for (let s of o) {
                if (s.hadRecentInput || s.startTime < t) continue;
                let {
                    cumulatedValue: o,
                    isMaxValue: c
                } = a.update(s);
                if (c) {
                    let e = $u(s.sources);
                    i = {
                        target: e ? .node ? new WeakRef(e.node) : void 0,
                        time: O(t, s.startTime),
                        previousRect: e ? .previousRect,
                        currentRect: e ? .currentRect,
                        devicePixelRatio: window.devicePixelRatio
                    }
                }
                if (o > r) {
                    r = o;
                    let t = i ? .target ? .deref();
                    n({
                        value: d(r, 4),
                        targetSelector: t && Oc(t, e.actionNameAttribute),
                        time: i ? .time,
                        previousRect: i ? .previousRect ? ed(i.previousRect) : void 0,
                        currentRect: i ? .currentRect ? ed(i.currentRect) : void 0,
                        devicePixelRatio: i ? .devicePixelRatio
                    })
                }
            }
        });
    return {
        stop: () => {
            o.unsubscribe()
        }
    }
}

function $u(e) {
    let t;
    for (let n of e)
        if (n.node && oc(n.node)) {
            let e = Zu(n);
            (!t || Zu(t) < e) && (t = n)
        }
    return t
}

function ed({
    x: e,
    y: t,
    width: n,
    height: r
}) {
    return {
        x: e,
        y: t,
        width: n,
        height: r
    }
}
var td = 5 * x,
    nd = x;

function rd() {
    let e = 0,
        t, n, r = 0;
    return {
        update: i => {
            let a = t === void 0 || i.startTime - n >= nd || i.startTime - t >= td,
                o;
            return a ? (t = n = i.startTime, r = e = i.value, o = !0) : (e += i.value, n = i.startTime, o = i.value > r, o && (r = i.value)), {
                cumulatedValue: e,
                isMaxValue: o
            }
        }
    }
}

function id() {
    return hc(Q.LAYOUT_SHIFT) && `WeakRef` in window
}
var ad, od = 0,
    sd = 1 / 0,
    cd = 0;

function ld() {
    `interactionCount` in performance || ad || (ad = new window.PerformanceObserver(N(e => {
        e.getEntries().forEach(e => {
            let t = e;
            t.interactionId && (sd = Math.min(sd, t.interactionId), cd = Math.max(cd, t.interactionId), od = (cd - sd) / 7 + 1)
        })
    })), ad.observe({
        type: `event`,
        buffered: !0,
        durationThreshold: 0
    }))
}
var ud = () => ad ? od : window.performance.interactionCount || 0,
    dd = 10,
    fd = 1 * S,
    pd = 8;

function md(e, t, n) {
    if (!vd()) return {
        getInteractionToNextPaint: () => void 0,
        setViewEnd: B,
        stop: B
    };
    let r = 1 / 0,
        i, {
            getViewInteractionCount: a,
            stopViewInteractionCount: o
        } = gd(n),
        s = hd(a),
        c = _d(s),
        l = dc(e, {
            type: Q.FIRST_INPUT,
            buffered: !0
        }).subscribe(d),
        u = dc(e, {
            type: Q.EVENT,
            durationThreshold: 40,
            buffered: !0
        }).subscribe(d);

    function d(e) {
        for (let n of e) n.interactionId && n.startTime >= t && n.startTime <= r && (s.process(n), c.process(n));
        c.pruneUntracked();
        let n = s.estimateP98Interaction();
        n && f(n)
    }

    function f(n) {
        let r = O(t, n.startTime);
        if (!i || n.duration !== i.duration || r !== i.startTime) {
            let t = Vl(n.startTime);
            !t && n.target && oc(n.target) && (t = Oc(n.target, e.actionNameAttribute)), i = {
                duration: n.duration,
                startTime: r,
                targetSelector: t
            }
        }
        i.subParts = c.computeSubParts(n, yd(i.duration))
    }
    return {
        getInteractionToNextPaint: () => {
            if (i) return {
                value: yd(i.duration),
                targetSelector: i.targetSelector,
                time: i.startTime,
                subParts: i.subParts
            };
            if (a()) return {
                value: 0
            }
        },
        setViewEnd: e => {
            r = e, o()
        },
        stop: () => {
            u.unsubscribe(), l.unsubscribe(), c.stop()
        }
    }
}

function hd(e) {
    let t = [];

    function n() {
        t.sort((e, t) => t.duration - e.duration).splice(dd)
    }
    return {
        process(e) {
            let r = t.findIndex(t => e.interactionId === t.interactionId),
                i = t[t.length - 1];
            r === -1 ? (t.length < dd || e.duration > i.duration) && (t.push(e), n()) : e.duration > t[r].duration && (t[r] = e, n())
        },
        estimateP98Interaction() {
            return t[Math.min(t.length - 1, Math.floor(e() / 50))]
        },
        isTracked(e) {
            return t.some(t => t.interactionId === e)
        }
    }
}

function gd(e) {
    ld();
    let t = e === yo.INITIAL_LOAD ? 0 : ud(),
        n = {
            stopped: !1
        };

    function r() {
        return ud() - t
    }
    return {
        getViewInteractionCount: () => n.stopped ? n.interactionCount : r(),
        stopViewInteractionCount: () => {
            n = {
                stopped: !0,
                interactionCount: r()
            }
        }
    }
}

function _d(e) {
    let t = new Map;

    function n(e, t) {
        e.startTime = Math.min(t.startTime, e.startTime), e.processingStart = Math.min(t.processingStart, e.processingStart), e.processingEnd = Math.max(t.processingEnd, e.processingEnd)
    }
    return {
        process(e) {
            if (e.interactionId === void 0 || !e.processingStart || !e.processingEnd) return;
            let r = e.startTime + e.duration,
                i = t.get(e.interactionId);
            if (i) {
                n(i, e);
                return
            }
            for (let [, i] of t.entries())
                if (Math.abs(r - i.referenceRenderTime) <= pd) {
                    n(i, e), t.set(e.interactionId, i);
                    return
                }
            t.set(e.interactionId, {
                startTime: e.startTime,
                processingStart: e.processingStart,
                processingEnd: e.processingEnd,
                referenceRenderTime: r
            })
        },
        pruneUntracked() {
            for (let [n] of t) e.isTracked(n) || t.delete(n)
        },
        computeSubParts(e, n) {
            if (!e.processingStart || !e.processingEnd || e.interactionId === void 0) return;
            let r = t.get(e.interactionId);
            if (!r) return;
            let i = Math.max(r.startTime + n, r.processingStart),
                a = Math.min(r.processingEnd, i);
            return {
                inputDelay: O(r.startTime, r.processingStart),
                processingDuration: O(r.processingStart, a),
                presentationDelay: O(a, i)
            }
        },
        stop() {
            t.clear()
        }
    }
}

function vd() {
    return hc(Q.EVENT) && window.PerformanceEventTiming && `interactionId` in PerformanceEventTiming.prototype
}

function yd(e) {
    return Math.min(e, fd)
}

function bd(e, t, n, r, i, a, o) {
    let s = i === yo.INITIAL_LOAD,
        c = !0,
        l = [],
        u = qu(r, a);

    function d() {
        if (!c && !s && l.length > 0) {
            let e = Math.max(...l);
            e < u.timeStamp - a.relative && o(e)
        }
    }
    let {
        stop: f
    } = vc(e, t, n, r, e => {
        c && (c = !1, e.hadActivity && l.push(O(a.timeStamp, e.end)), d())
    });
    return {
        stop: () => {
            f(), u.stop()
        },
        setLoadEvent: e => {
            s && (s = !1, l.push(e), d())
        }
    }
}

function xd() {
    let e, t = window.visualViewport;
    return e = t ? t.pageTop - t.offsetTop : window.scrollY === void 0 ? window.pageYOffset || 0 : window.scrollY, Math.round(e)
}
var Sd;

function Cd(e) {
    return Sd || = wd(e), Sd
}

function wd(e) {
    return new I(t => {
        let {
            throttled: n
        } = ht(() => {
            t.notify(Td())
        }, 200);
        return U(e, window, `resize`, n, {
            capture: !0,
            passive: !0
        }).stop
    })
}

function Td() {
    let e = window.visualViewport;
    return e ? {
        width: Number(e.width * e.scale),
        height: Number(e.height * e.scale)
    } : {
        width: Number(window.innerWidth || 0),
        height: Number(window.innerHeight || 0)
    }
}
var Ed = x;

function Dd(e, t, n, r = kd(e)) {
    let i = 0,
        a = 0,
        o = 0,
        s = r.subscribe(({
            scrollDepth: e,
            scrollTop: r,
            scrollHeight: s
        }) => {
            let c = !1;
            if (e > i && (i = e, c = !0), s > a) {
                a = s;
                let e = E();
                o = O(t.relative, e), c = !0
            }
            c && n({
                maxDepth: Math.min(i, a),
                maxDepthScrollTop: r,
                maxScrollHeight: a,
                maxScrollHeightTime: o
            })
        });
    return {
        stop: () => s.unsubscribe()
    }
}

function Od() {
    let e = xd(),
        {
            height: t
        } = Td();
    return {
        scrollHeight: Math.round((document.scrollingElement || document.documentElement).scrollHeight),
        scrollDepth: Math.round(t + e),
        scrollTop: e
    }
}

function kd(e, t = Ed) {
    return new I(n => {
        function r() {
            n.notify(Od())
        }
        let i = ht(r, t, {
                leading: !1,
                trailing: !0
            }),
            a = document.scrollingElement || document.documentElement,
            o = new ResizeObserver(N(i.throttled));
        a && o.observe(a);
        let s = U(e, window, `scroll`, i.throttled, {
            passive: !0
        });
        return () => {
            i.cancel(), o.disconnect(), s.stop()
        }
    })
}

function Ad(e, t, n, r, i, a, o) {
    let s = {},
        c = !1,
        l = !1,
        {
            stop: u,
            setLoadEvent: d
        } = bd(e, t, n, r, a, o, e => {
            c || (s.loadingTime = e, i())
        }),
        {
            stop: f
        } = Dd(r, o, e => {
            s.scroll = e
        }),
        {
            stop: p
        } = Qu(r, o.relative, e => {
            s.cumulativeLayoutShift = e, i()
        }),
        {
            stop: m,
            getInteractionToNextPaint: h,
            setViewEnd: g
        } = md(r, o.relative, a);
    return {
        stop: () => {
            u(), p(), f()
        },
        stopINPTracking: m,
        setLoadEvent: d,
        setViewEnd: e => {
            l = !0, g(e)
        },
        getCommonViewMetrics: () => (s.interactionToNextPaint = h(), s),
        setLoadingTime: e => {
            if (l) return;
            let t = O(o.timeStamp, e ? ? T());
            c || u(), c = !0, s.loadingTime = t, i()
        }
    }
}

function jd(e, t) {
    let {
        stop: n
    } = U(e, window, `pageshow`, e => {
        e.persisted && t(e)
    }, {
        capture: !0
    });
    return n
}

function Md(e, t, n) {
    Ru(e.relative, e => {
        t.firstContentfulPaint = e, t.largestContentfulPaint = {
            value: e
        }, n()
    })
}
var Nd = 3e3,
    Pd = 5 * S,
    Fd = 5 * S;

function Id(e, t, n, r, i, a, o) {
    let s = new Set,
        c = d(yo.INITIAL_LOAD, se(), o),
        l;
    f();
    let u;
    a && (u = p(i), l = jd(r, e => {
        c.end();
        let t = re(e.timeStamp);
        c = d(yo.BF_CACHE, t, void 0)
    }));

    function d(i, a, o) {
        let c = Ld(e, t, n, r, i, a, o);
        return s.add(c), c.stopObservable.subscribe(() => {
            s.delete(c)
        }), c
    }

    function f() {
        e.subscribe(10, e => {
            let t = c.contextManager.getContext();
            e && (t.is_session_renewal = !0, t.renew_event = e), c = d(yo.SESSION_RENEWAL, void 0, {
                name: c.name,
                service: c.service,
                version: c.version,
                context: t
            })
        }), e.subscribe(9, () => {
            c.end({
                sessionIsActive: !1
            })
        })
    }

    function p(e) {
        return e.subscribe(({
            oldLocation: e,
            newLocation: t
        }) => {
            zd(e, t) && (c.end(), c = d(yo.ROUTE_CHANGE))
        })
    }
    return {
        addTiming: (e, t = T()) => {
            c.addTiming(e, t)
        },
        setLoadingTime: e => c.setLoadingTime(e),
        startView: (e, t) => {
            c.end({
                endClocks: t
            }), c = d(yo.ROUTE_CHANGE, t, e)
        },
        setViewContext: e => {
            c.contextManager.setContext(e)
        },
        setViewContextProperty: (e, t) => {
            c.contextManager.setContextProperty(e, t)
        },
        setViewName: e => {
            c.setViewName(e)
        },
        getViewContext: () => c.contextManager.getContext(),
        stop: () => {
            u && u.unsubscribe(), l && l(), c.end(), s.forEach(e => e.stop())
        }
    }
}

function Ld(e, t, n, r, i, a = D(), o) {
    let s = M(),
        c = new I,
        l = {},
        u = 0,
        d, f = h(L(window.location)),
        p = za(),
        m = !0,
        g = o ? .name,
        _ = o ? .service || r.service,
        ee = o ? .version || r.version,
        v = o ? .context,
        y = o ? .handlingStack;
    v && p.setContext(v);
    let b = {
        id: s,
        name: g,
        startClocks: a,
        service: _,
        version: ee,
        context: v,
        url: o ? .url
    };
    e.notify(1, b), e.notify(2, b);
    let {
        throttled: x,
        cancel: S
    } = ht(A, Nd, {
        leading: !1
    }), {
        setLoadEvent: te,
        setViewEnd: ne,
        stop: re,
        stopINPTracking: ie,
        getCommonViewMetrics: ae,
        setLoadingTime: oe
    } = Ad(e, t, n, r, k, i, a), {
        stop: C,
        initialViewMetrics: w
    } = i === yo.INITIAL_LOAD ? Ju(r, a, te, k) : {
        stop: B,
        initialViewMetrics: {}
    };
    i === yo.BF_CACHE && Md(a, w, k);
    let {
        stop: E,
        eventCounts: se
    } = Fu(e, s, k), ce = ct(A, Pd), le = e.subscribe(11, e => {
        e.reason === nr.UNLOADING && A()
    });
    A(), p.changeObservable.subscribe(k);

    function ue() {
        e.notify(3, {
            id: s,
            name: g,
            context: p.getContext(),
            startClocks: a,
            sessionIsActive: m
        })
    }

    function k() {
        ue(), x()
    }

    function A() {
        S(), ue(), u += 1;
        let t = d === void 0 ? T() : d.timeStamp;
        e.notify(4, {
            customTimings: l,
            documentVersion: u,
            id: s,
            name: g,
            service: _,
            version: ee,
            context: p.getContext(),
            loadingType: i,
            location: f,
            handlingStack: y,
            startClocks: a,
            commonViewMetrics: ae(),
            initialViewMetrics: w,
            duration: O(a.timeStamp, t),
            isActive: d === void 0,
            sessionIsActive: m,
            eventCounts: se
        })
    }
    return {
        get name() {
            return g
        },
        service: _,
        version: ee,
        contextManager: p,
        stopObservable: c,
        end(t = {}) {
            d || (d = t.endClocks ? ? D(), m = t.sessionIsActive ? ? !0, e.notify(5, {
                endClocks: d
            }), e.notify(6, {
                endClocks: d
            }), lt(ce), ne(d.relative), re(), le.unsubscribe(), A(), R(() => {
                this.stop()
            }, Fd))
        },
        stop() {
            C(), E(), ie(), c.notify()
        },
        addTiming(e, t) {
            if (d) return;
            let n = de(t) ? t : O(a.timeStamp, t);
            l[Rd(e)] = n, k()
        },
        setLoadingTime: oe,
        setViewName(e) {
            g = e, A()
        }
    }
}

function Rd(e) {
    let t = e.replace(/[^a-zA-Z0-9-_.@$]/g, `_`);
    return t !== e && a.warn(`Invalid timing name: ${e}, sanitized to: ${t}`), t
}

function zd(e, t) {
    return e.pathname !== t.pathname || !Bd(t.hash) && Vd(t.hash) !== Vd(e.hash)
}

function Bd(e) {
    let t = e.substring(1);
    return t !== `` && !!document.getElementById(t)
}

function Vd(e) {
    let t = e.indexOf(`?`);
    return t < 0 ? e : e.slice(0, t)
}

function Hd(e, t, n, r, i, a, o, s, c) {
    return e.subscribe(4, t => e.notify(12, Ud(t, n, o))), t.register(0, ({
        startTime: e,
        eventType: t
    }) => {
        let n = s.findView(e);
        return n ? {
            type: t,
            service: n.service,
            version: n.version,
            context: n.context,
            view: {
                id: n.id,
                name: n.name
            }
        } : fr
    }), t.register(1, ({
        startTime: e
    }) => ({
        view: {
            id: s.findView(e) ? .id
        }
    })), Id(e, r, i, n, a, !n.trackViewsManually, c)
}

function Ud(e, t, n) {
    let r = n.getReplayStats(e.id),
        i = e.commonViewMetrics ? .cumulativeLayoutShift ? .devicePixelRatio,
        a = {
            _dd: {
                document_version: e.documentVersion,
                replay_stats: r,
                cls: i ? {
                    device_pixel_ratio: i
                } : void 0,
                configuration: {
                    start_session_replay_recording_manually: t.startSessionReplayRecordingManually
                }
            },
            date: e.startClocks.timeStamp,
            type: Z.VIEW,
            view: {
                action: {
                    count: e.eventCounts.actionCount
                },
                frustration: {
                    count: e.eventCounts.frustrationCount
                },
                cumulative_layout_shift: e.commonViewMetrics.cumulativeLayoutShift ? .value,
                cumulative_layout_shift_time: C(e.commonViewMetrics.cumulativeLayoutShift ? .time),
                cumulative_layout_shift_target_selector: e.commonViewMetrics.cumulativeLayoutShift ? .targetSelector,
                first_byte: C(e.initialViewMetrics.navigationTimings ? .firstByte),
                dom_complete: C(e.initialViewMetrics.navigationTimings ? .domComplete),
                dom_content_loaded: C(e.initialViewMetrics.navigationTimings ? .domContentLoaded),
                dom_interactive: C(e.initialViewMetrics.navigationTimings ? .domInteractive),
                error: {
                    count: e.eventCounts.errorCount
                },
                first_contentful_paint: C(e.initialViewMetrics.firstContentfulPaint),
                interaction_to_next_paint: C(e.commonViewMetrics.interactionToNextPaint ? .value),
                interaction_to_next_paint_time: C(e.commonViewMetrics.interactionToNextPaint ? .time),
                interaction_to_next_paint_target_selector: e.commonViewMetrics.interactionToNextPaint ? .targetSelector,
                is_active: e.isActive,
                name: e.name,
                largest_contentful_paint: C(e.initialViewMetrics.largestContentfulPaint ? .value),
                largest_contentful_paint_target_selector: e.initialViewMetrics.largestContentfulPaint ? .targetSelector,
                load_event: C(e.initialViewMetrics.navigationTimings ? .loadEvent),
                loading_time: rc(C(e.commonViewMetrics.loadingTime)),
                loading_type: e.loadingType,
                long_task: {
                    count: e.eventCounts.longTaskCount
                },
                performance: Wd(e.commonViewMetrics, e.initialViewMetrics),
                resource: {
                    count: e.eventCounts.resourceCount
                },
                time_spent: C(e.duration)
            },
            display: e.commonViewMetrics.scroll ? {
                scroll: {
                    max_depth: e.commonViewMetrics.scroll.maxDepth,
                    max_depth_scroll_top: e.commonViewMetrics.scroll.maxDepthScrollTop,
                    max_scroll_height: e.commonViewMetrics.scroll.maxScrollHeight,
                    max_scroll_height_time: C(e.commonViewMetrics.scroll.maxScrollHeightTime)
                }
            } : void 0,
            privacy: {
                replay_level: t.defaultPrivacyLevel
            },
            device: {
                locale: navigator.language,
                locales: navigator.languages,
                time_zone: go()
            }
        };
    return _(e.customTimings) || (a.view.custom_timings = ee(e.customTimings, C)), {
        rawRumEvent: a,
        startClocks: e.startClocks,
        duration: e.duration,
        domainContext: {
            location: e.location,
            handlingStack: e.handlingStack
        }
    }
}

function Wd({
    cumulativeLayoutShift: e,
    interactionToNextPaint: t
}, {
    firstContentfulPaint: n,
    largestContentfulPaint: r
}) {
    return {
        cls: e && {
            score: e.value,
            timestamp: C(e.time),
            target_selector: e.targetSelector,
            previous_rect: e.previousRect,
            current_rect: e.currentRect
        },
        fcp: n && {
            timestamp: C(n)
        },
        inp: t && {
            duration: C(t.value),
            timestamp: C(t.time),
            target_selector: t.targetSelector,
            sub_parts: t.subParts ? {
                input_delay: C(t.subParts.inputDelay),
                processing_duration: C(t.subParts.processingDuration),
                presentation_delay: C(t.subParts.presentationDelay)
            } : void 0
        },
        lcp: r && {
            timestamp: C(r.value),
            target_selector: r.targetSelector,
            resource_url: r.resourceUrl,
            sub_parts: r.subParts ? {
                load_delay: C(r.subParts.loadDelay),
                load_time: C(r.subParts.loadTime),
                render_delay: C(r.subParts.renderDelay)
            } : void 0
        }
    }
}

function Gd(e, t, n, r, i, a) {
    let o = [e.rumEndpointBuilder];
    e.replica && o.push(e.replica.rumEndpointBuilder);
    let s = or({
        encoder: a(2),
        request: Kn(o, n),
        flushController: ur({
            pageMayExitObservable: r,
            sessionExpireObservable: i
        })
    });
    return t.subscribe(13, e => {
        e.type === Z.VIEW ? s.upsert(e, e.view.id) : s.add(e)
    }), s
}

function Kd(e) {
    let t = Zn();
    e.subscribe(13, e => {
        t.send(`rum`, e)
    })
}
var qd = fe;

function Jd(e, t, n) {
    let r = Yi({
            expireDelay: qd
        }),
        i;
    e.subscribe(1, ({
        startClocks: e,
        url: t
    }) => {
        let n = L(location).href,
            a = t === void 0 ? n : Ce(t, n).href;
        r.add(o({
            url: a,
            referrer: i || document.referrer
        }), e.relative), i = a
    }), e.subscribe(6, ({
        endClocks: e
    }) => {
        r.closeActive(e.relative)
    });
    let a = n.subscribe(({
        newLocation: e
    }) => {
        let t = r.find();
        if (t) {
            let n = E();
            r.closeActive(n), r.add(o({
                url: e.href,
                referrer: t.referrer
            }), n)
        }
    });

    function o({
        url: e,
        referrer: t
    }) {
        return {
            url: e,
            referrer: t
        }
    }
    return t.register(0, ({
        startTime: e,
        eventType: t
    }) => {
        let n = r.find(e);
        return n ? {
            type: t,
            view: {
                url: n.url,
                referrer: n.referrer
            }
        } : fr
    }), {
        findUrl: e => r.find(e),
        stop: () => {
            a.unsubscribe(), r.stop()
        }
    }
}

function Yd(e) {
    let t = h(location);
    return new I(n => {
        let {
            stop: r
        } = Xd(e, a), {
            stop: i
        } = Zd(e, a);

        function a() {
            if (t.href === location.href) return;
            let e = h(location);
            n.notify({
                newLocation: e,
                oldLocation: t
            }), t = e
        }
        return () => {
            r(), i()
        }
    })
}

function Xd(e, t) {
    let {
        stop: n
    } = K(Qd(`pushState`), `pushState`, ({
        onPostCall: e
    }) => {
        e(t)
    }), {
        stop: r
    } = K(Qd(`replaceState`), `replaceState`, ({
        onPostCall: e
    }) => {
        e(t)
    }), {
        stop: i
    } = U(e, window, `popstate`, t);
    return {
        stop: () => {
            n(), r(), i()
        }
    }
}

function Zd(e, t) {
    return U(e, window, `hashchange`, t)
}

function Qd(e) {
    return Object.prototype.hasOwnProperty.call(history, e) ? history : History.prototype
}
var $d = fe;

function ef(e, t, n) {
    let r = Yi({
        expireDelay: $d
    });
    return e.subscribe(1, ({
        startClocks: e
    }) => {
        r.add({}, e.relative)
    }), e.subscribe(6, ({
        endClocks: e
    }) => {
        r.closeActive(e.relative)
    }), t.register(0, ({
        startTime: e,
        eventType: t
    }) => {
        if (!n.trackFeatureFlagsForEvents.concat([Z.VIEW, Z.ERROR]).includes(t)) return W;
        let i = r.find(e);
        return !i || _(i) ? W : {
            type: t,
            feature_flags: i
        }
    }), {
        addFeatureFlagEvaluation: (e, t) => {
            let n = r.find();
            n && (n[e] = t)
        }
    }
}
var tf = 10 * x,
    nf, rf;

function af(e, t, n) {
    e.metricsEnabled && (lf(), rf = !1, t.subscribe(13, () => {
        rf = !0
    }), n.subscribe(({
        bytesCount: e,
        messagesCount: t
    }) => {
        rf && (rf = !1, nf.batchCount += 1, cf(nf.batchBytesCount, e), cf(nf.batchMessagesCount, t))
    }), ct( of , tf))
}

function of () {
    nf.batchCount !== 0 && (kr(`Customer data measures`, nf), lf())
}

function sf() {
    return {
        min: 1 / 0,
        max: 0,
        sum: 0
    }
}

function cf(e, t) {
    e.sum += t, e.min = Math.min(e.min, t), e.max = Math.max(e.max, t)
}

function lf() {
    nf = {
        batchCount: 0,
        batchBytesCount: sf(),
        batchMessagesCount: sf()
    }
}
var uf = 4e3,
    df = fe;

function ff(e, t, n = 500) {
    let r = Yi({
            expireDelay: df,
            maxEntries: uf
        }),
        i;
    hc(Q.VISIBILITY_STATE) && performance.getEntriesByType(Q.VISIBILITY_STATE).forEach(e => {
        o(e.name === `hidden` ? `hidden` : `active`, e.startTime)
    }), o(hf(), E());
    let {
        stop: a
    } = tr(t, window, [`pageshow`, `focus`, `blur`, `visibilitychange`, `resume`, `freeze`, `pagehide`], e => {
        o(mf(e), e.timeStamp)
    }, {
        capture: !0
    });

    function o(e, t = E()) {
        e !== i && (i = e, r.closeActive(t), r.add({
            state: i,
            startTime: t
        }, t))
    }

    function s(e, t, n) {
        return r.findAll(t, n).some(t => t.state === e)
    }
    return e.register(0, ({
        startTime: e,
        duration: t = 0,
        eventType: i
    }) => i === Z.VIEW ? {
        type: i,
        _dd: {
            page_states: pf(r.findAll(e, t), e, n)
        }
    } : i === Z.ACTION || i === Z.ERROR ? {
        type: i,
        view: {
            in_foreground: s(`active`, e, 0)
        }
    } : W), {
        wasInPageStateDuringPeriod: s,
        addPageState: o,
        stop: () => {
            a(), r.stop()
        }
    }
}

function pf(e, t, n) {
    if (e.length !== 0) return e.slice(-n).reverse().map(({
        state: e,
        startTime: n
    }) => ({
        state: e,
        start: C(O(t, n))
    }))
}

function mf(e) {
    return e.type === `freeze` ? `frozen` : e.type === `pagehide` ? e.persisted ? `frozen` : `terminated` : hf()
}

function hf() {
    return document.visibilityState === `hidden` ? `hidden` : document.hasFocus() ? `active` : `passive`
}

function gf(e, t) {
    let n, r = requestAnimationFrame(N(() => {
            n = Td()
        })),
        i = Cd(t).subscribe(e => {
            n = e
        }).unsubscribe;
    return e.register(0, ({
        eventType: e
    }) => ({
        type: e,
        display: n ? {
            viewport: n
        } : void 0
    })), {
        stop: () => {
            i(), r && cancelAnimationFrame(r)
        }
    }
}

function _f(e, t) {
    let n = al(e);

    function r(e) {
        return !t.wasInPageStateDuringPeriod(`frozen`, e.startClocks.relative, e.duration)
    }

    function i(t) {
        r(t) && e.notify(12, vf(t))
    }

    function a(t, n, r, i) {
        if (!dn(H.FEATURE_OPERATION_VITAL)) return;
        let {
            operationKey: a,
            context: o,
            description: s,
            handlingStack: c
        } = r || {}, l = {
            name: t,
            type: So.OPERATION_STEP,
            operationKey: a,
            failureReason: i,
            stepType: n,
            startClocks: D(),
            context: V(o),
            description: s,
            handlingStack: c
        };
        e.notify(12, vf(l))
    }

    function o(t, r = {}, i = D()) {
        let {
            id: a
        } = n.start(r.vitalKey ? ? t, i, {
            name: t,
            ...r
        });
        e.notify(16, {
            id: a,
            name: t,
            startClocks: i,
            ...r
        })
    }

    function s(e, t = {}, r = D()) {
        let a = n.stop(t.vitalKey ? ? e, r, t);
        a && i({
            type: So.DURATION,
            ...a
        })
    }
    return {
        addOperationStepVital: a,
        addDurationVital: i,
        startDurationVital: o,
        stopDurationVital: s
    }
}

function vf(e) {
    let {
        startClocks: t,
        type: n,
        name: r,
        description: i,
        context: a,
        handlingStack: o
    } = e, s = {
        id: (e.type === So.DURATION ? e.id : void 0) ? ? M(),
        type: n,
        name: r,
        description: i,
        ...n === So.DURATION ? {
            duration: C(e.duration)
        } : {
            step_type: e.stepType,
            operation_key: e.operationKey,
            failure_reason: e.failureReason
        }
    };
    return {
        rawRumEvent: {
            date: t.timeStamp,
            vital: s,
            type: Z.VITAL,
            context: a
        },
        startClocks: t,
        duration: n === So.DURATION ? e.duration : void 0,
        domainContext: o ? {
            handlingStack: o
        } : {}
    }
}

function yf(e, t) {
    let n = window.cookieStore ? bf(e) : Sf;
    return new I(e => n(t, t => e.notify(t)))
}

function bf(e) {
    return (t, n) => U(e, window.cookieStore, `change`, e => {
        let r = e.changed.find(e => e.name === t) || e.deleted.find(e => e.name === t);
        r && n(r.value)
    }).stop
}
var xf = x;

function Sf(e, t) {
    let n = De(e),
        r = ct(() => {
            let r = De(e);
            r !== n && (n = r, t(r))
        }, xf);
    return () => {
        lt(r)
    }
}
var Cf = `datadog-ci-visibility-test-execution-id`;

function wf(e, t, n = yf(e, Cf)) {
    let r = Ae(`datadog-ci-visibility-test-execution-id`) || Tf(),
        i = n.subscribe(e => {
            r = e
        });
    return t.register(0, ({
        eventType: e
    }) => typeof r == `string` ? {
        type: e,
        session: {
            type: `ci_test`
        },
        ci_test: {
            test_execution_id: r
        }
    } : W), {
        stop: () => {
            i.unsubscribe()
        }
    }
}

function Tf() {
    let e = window.Cypress;
    if (e) try {
        return e.env(`traceId`)
    } catch {
        a.warn(`Failed to read Cypress test execution id via Cypress.env(). Upgrade dd-trace-js to >= 5.88.0 to keep RUM ↔ test correlation working.`);
        return
    }
}

function Ef(e, t) {
    let n = dc(t, {
        type: hc(Q.LONG_ANIMATION_FRAME) ? Q.LONG_ANIMATION_FRAME : Q.LONG_TASK,
        buffered: !0
    }).subscribe(n => {
        for (let r of n) {
            if (!t.trackLongTasks) break;
            let n = re(r.startTime),
                i = Df(r, n);
            e.notify(12, {
                rawRumEvent: i,
                startClocks: n,
                duration: r.duration,
                domainContext: {
                    performanceEntry: r
                }
            })
        }
    });
    return {
        stop: () => n.unsubscribe()
    }
}

function Df(e, t) {
    let n = M(),
        r = C(e.duration),
        i = {
            date: t.timeStamp,
            type: Z.LONG_TASK,
            _dd: {
                discarded: !1
            }
        };
    return e.entryType === Q.LONG_TASK ? { ...i,
        long_task: {
            id: n,
            entry_type: vo.LONG_TASK,
            duration: r
        }
    } : { ...i,
        long_task: {
            id: n,
            entry_type: vo.LONG_ANIMATION_FRAME,
            duration: r,
            blocking_duration: C(e.blockingDuration),
            first_ui_event_timestamp: C(e.firstUIEventTimestamp),
            render_start: C(e.renderStart),
            style_and_layout_start: C(e.styleAndLayoutStart),
            start_time: C(e.startTime),
            scripts: e.scripts.map(e => ({
                duration: C(e.duration),
                pause_duration: C(e.pauseDuration),
                forced_style_and_layout_duration: C(e.forcedStyleAndLayoutDuration),
                start_time: C(e.startTime),
                execution_start: C(e.executionStart),
                source_url: e.sourceURL,
                source_function_name: e.sourceFunctionName,
                source_char_position: e.sourceCharPosition,
                invoker: e.invoker,
                invoker_type: e.invokerType,
                window_attribution: e.windowAttribution
            }))
        }
    }
}

function Of(e) {
    e.register(0, ({
        eventType: e
    }) => lo() ? {
        type: e,
        session: {
            type: `synthetics`
        },
        synthetics: { ...co(),
            injected: so()
        }
    } : W)
}

function kf(e, t, n) {
    let r = Tn(e),
        i = n(r);
    return Re(t).forEach(([t, n]) => Af(e, r, t.split(/\.|(?=\[\])/), n)), i
}

function Af(e, t, n, r) {
    let [i, ...a] = n;
    if (i === `[]`) {
        Array.isArray(e) && Array.isArray(t) && e.forEach((e, n) => Af(e, t[n], a, r));
        return
    }
    if (!(!Mf(e) || !Mf(t))) {
        if (a.length > 0) return Af(e[i], t[i], a, r);
        jf(e, i, t[i], r)
    }
}

function jf(e, t, n, r) {
    if (e[t] === n) return;
    let i = Dt(n);
    i === r ? e[t] = V(n) : r === `object` && (i === `undefined` || i === `null`) && (e[t] = {})
}

function Mf(e) {
    return Dt(e) === `object`
}
var Nf = {
        "view.name": `string`,
        "view.url": `string`,
        "view.referrer": `string`
    },
    Pf = {
        context: `object`
    },
    Ff = {
        service: `string`,
        version: `string`
    },
    If;

function Lf(e, t, n, r, i) {
    If = {
        [Z.VIEW]: {
            "view.performance.lcp.resource_url": `string`,
            ...Pf,
            ...Nf,
            ...Ff
        },
        [Z.ERROR]: {
            "error.message": `string`,
            "error.stack": `string`,
            "error.handling_stack": `string`,
            "error.resource.url": `string`,
            "error.fingerprint": `string`,
            ...Pf,
            ...Nf,
            ...Ff
        },
        [Z.RESOURCE]: {
            "resource.url": `string`,
            "resource.graphql.variables": `string`,
            "resource.request.headers": `object`,
            "resource.response.headers": `object`,
            ...Pf,
            ...Nf,
            ...Ff
        },
        [Z.ACTION]: {
            "action.target.name": `string`,
            ...Pf,
            ...Nf,
            ...Ff
        },
        [Z.LONG_TASK]: {
            "long_task.scripts[].source_url": `string`,
            "long_task.scripts[].invoker": `string`,
            ...Pf,
            ...Nf,
            ...Ff
        },
        [Z.VITAL]: { ...Pf,
            ...Nf,
            ...Ff
        }
    };
    let a = {
        [Z.ERROR]: da(Z.ERROR, r, i),
        [Z.ACTION]: da(Z.ACTION, r, i),
        [Z.VITAL]: da(Z.VITAL, r, i)
    };
    t.subscribe(12, ({
        startClocks: r,
        duration: i,
        rawRumEvent: o,
        domainContext: s
    }) => {
        let c = n.triggerHook(0, {
            eventType: o.type,
            rawRumEvent: o,
            domainContext: s,
            startTime: r.relative,
            duration: i
        });
        if (c === `DISCARDED`) return;
        let l = En(c, o, {
            ddtags: pn(e).join(`,`)
        });
        Rf(l, e.beforeSend, s, a) && (_(l.context) && delete l.context, t.notify(13, l))
    })
}

function Rf(e, t, n, r) {
    if (t) {
        let r = kf(e, If[e.type], e => t(e, n));
        if (r === !1 && e.type !== Z.VIEW) return !1;
        r === !1 && a.warn(`Can't dismiss view events using beforeSend!`)
    }
    return !r[e.type] ? .isLimitReached()
}

function zf(e, t) {
    return $n() ? +!!Qn(`records`) : Qi(e.id, Xi(t.sessionSampleRate, t.sessionReplaySampleRate)) ? 1 : e.isReplayForced ? 2 : 0
}

function Bf(e, t, n, r, i) {
    e.register(0, ({
        eventType: e,
        startTime: a
    }) => {
        let o = n.findTrackedSession(a),
            s = i.findView(a);
        if (!o || !s) return fr;
        let c, l, u;
        return e === Z.VIEW ? (c = r.getReplayStats(s.id) ? !0 : void 0, l = zf(o, t) === 1, u = s.sessionIsActive ? void 0 : !1) : c = r.isRecording() ? !0 : void 0, {
            type: e,
            session: {
                id: o.id,
                type: `user`,
                has_replay: c,
                sampled_for_replay: l,
                is_active: u
            }
        }
    })
}

function Vf(e) {
    e.register(0, ({
        eventType: e
    }) => ({
        type: e,
        connectivity: On()
    }))
}

function Hf(e, t, n) {
    e.register(0, ({
        eventType: e
    }) => {
        let r = t.source;
        return {
            type: e,
            _dd: {
                format_version: 2,
                drift: oe(),
                configuration: {
                    session_sample_rate: d(t.sessionSampleRate, 3),
                    session_replay_sample_rate: d(t.sessionReplaySampleRate, 3),
                    profiling_sample_rate: d(t.profilingSampleRate, 3),
                    trace_sample_rate: d(t.traceSampleRate, 3)
                },
                browser_sdk_version: $n() ? `7.1.0` : void 0,
                sdk_name: n
            },
            application: {
                id: t.applicationId
            },
            date: T(),
            source: r
        }
    })
}
var Uf = [Z.ACTION, Z.ERROR, Z.LONG_TASK, Z.RESOURCE, Z.VITAL];

function Wf(e) {
    return {
        addEvent: (t, n, r, i) => {
            Uf.includes(n.type) && e.notify(12, {
                startClocks: re(t),
                rawRumEvent: n,
                domainContext: r,
                duration: i
            })
        }
    }
}

function Gf(e, t) {
    if (!t.metricsEnabled) return {
        stop: B
    };
    let {
        unsubscribe: n
    } = e.subscribe(4, ({
        initialViewMetrics: e
    }) => {
        !e.largestContentfulPaint || !e.navigationTimings || (kr(`Initial view metrics`, {
            metrics: Kf(e.largestContentfulPaint, e.navigationTimings)
        }), n())
    });
    return {
        stop: n
    }
}

function Kf(e, t) {
    return {
        lcp: {
            value: e.value
        },
        navigation: {
            domComplete: t.domComplete,
            domContentLoaded: t.domContentLoaded,
            domInteractive: t.domInteractive,
            firstByte: t.firstByte,
            loadEvent: t.loadEvent
        }
    }
}

function qf(e) {
    let t = window,
        n = new Map;

    function r() {
        t.DD_SOURCE_CODE_CONTEXT && = (Re(t.DD_SOURCE_CODE_CONTEXT).forEach(([e, t]) => {
            let r = At({
                stack: e
            }).stack[0];
            if (!r.url) {
                Dr(`Source code context: missing frame url`, {
                    stack: e
                });
                return
            }
            n.has(r.url) || n.set(r.url, t)
        }), {})
    }
    r(), e.register(0, ({
        domainContext: e,
        rawRumEvent: t
    }) => {
        if (r(), n.size === 0) return W;
        let i = Jf(e, t),
            a = i && n.get(i);
        return a ? {
            type: t.type,
            service: a.service,
            version: a.version
        } : W
    })
}

function Jf(e, t) {
    if (t.type === `long_task` && t.long_task.entry_type === `long-animation-frame`) return t.long_task.scripts[0] ? .source_url;
    let n;
    return `handlingStack` in e && (n = e.handlingStack), t.type === `error` && t.error.stack && (n = t.error.stack), At({
        stack: n
    }).stack[0] ? .url
}

function Yf(e, t, n, r, i, a, o, s, c, l) {
    let u = [],
        d = new hs;
    d.subscribe(13, e => Cn(`rum`, e)), t.expireObservable.subscribe(() => d.notify(9)), t.renewObservable.subscribe(e => d.notify(10, e));
    let f = e => {
            d.notify(14, {
                error: e
            }), Er(`Error reported to customer`, {
                "error.message": e.message
            })
        },
        p = rr(e);
    if ($n()) {
        Kd(d);
        let e = p.subscribe(e => {
            d.notify(11, e)
        });
        u.push(() => e.unsubscribe())
    } else {
        let n = Gd(e, d, f, p, t.expireObservable, a),
            r = n.flushController.preparePageExitFlushObservable.subscribe(e => {
                d.notify(11, {
                    reason: e
                })
            });
        u.push(() => r.unsubscribe()), u.push(() => n.stop()), af(s, d, n.flushController.flushObservable)
    }
    let {
        stop: m
    } = Gf(d, s);
    u.push(m);
    let {
        stop: h,
        ...g
    } = Xf(d, c, e, t, n, i, o, l, f);
    return u.push(h), o.unbuffer(), u.push(() => r.stop()), { ...g,
        lifeCycle: d,
        sessionManager: t,
        stopSession: () => t.expire(),
        telemetry: s,
        stop: () => {
            u.forEach(e => e())
        },
        hooks: c
    }
}

function Xf(e, t, n, r, i, a, o, s, c) {
    let l = [],
        u = ds(),
        d = Yd(n),
        {
            observable: f,
            stop: p
        } = ps();
    l.push(p), Hf(t, n, s);
    let m = ff(t, n);
    l.push(() => m.stop());
    let h = _s(e);
    l.push(() => h.stop());
    let g = Jd(e, t, d);
    l.push(() => g.stop());
    let _ = ef(e, t, n);
    Bf(t, n, r, i, h), Vf(t), Ya(t);
    let ee = Qa(t, n, `rum`, !0),
        v = eo(t, n, r, `rum`),
        y = Ga(t, n, `rum`),
        b = Ql(e, t, u, f, n);
    l.push(b.stop);
    let x = Wf(e),
        S = gf(t, n);
    l.push(S.stop);
    let te = wf(n, t);
    l.push(te.stop), Of(t), Lf(n, e, t, c);
    let {
        addTiming: ne,
        setLoadingTime: re,
        startView: ie,
        setViewName: ae,
        setViewContext: oe,
        setViewContextProperty: C,
        getViewContext: w,
        stop: T
    } = Hd(e, t, n, u, f, d, i, h, a);
    qf(t), l.push(T);
    let E = yu(e, n);
    l.push(E.stop);
    let {
        stop: D
    } = Ef(e, n);
    l.push(D);
    let {
        addError: se
    } = nu(e, n, o);
    $s(e, n, r, v, y, o);
    let O = _f(e, m),
        ce = ms(n.applicationId, r, h, b.actionContexts, g);
    return {
        addAction: b.addAction,
        startAction: b.startAction,
        stopAction: b.stopAction,
        startResource: E.startResource,
        stopResource: E.stopResource,
        addEvent: x.addEvent,
        addError: se,
        addTiming: ne,
        setLoadingTime: re,
        addFeatureFlagEvaluation: _.addFeatureFlagEvaluation,
        startView: ie,
        setViewContext: oe,
        setViewContextProperty: C,
        getViewContext: w,
        setViewName: ae,
        viewHistory: h,
        sessionManager: r,
        stopSession: () => r.expire(),
        getInternalContext: ce.get,
        startDurationVital: O.startDurationVital,
        stopDurationVital: O.stopDurationVital,
        addDurationVital: O.addDurationVital,
        addOperationStepVital: O.addOperationStepVital,
        globalContext: ee,
        userContext: v,
        accountContext: y,
        stop: () => l.forEach(e => e())
    }
}

function Zf(e, t, n = {}) {
    let r = ri(),
        i = ho(),
        a = ls(n, r, (r, o, s, c, l, u) => {
            let d = s && n.createDeflateEncoder ? e => n.createDeflateEncoder(r, s, e) : dr,
                f = L(Yf)(r, o, e, t, c, d, i.observable, l, u, n.sdkName);
            return e.onRumStart(f.lifeCycle, r, o, f.viewHistory, s, f.telemetry), t.onRumStart(f.lifeCycle, f.hooks, r, o, f.viewHistory, d), a = Qf(a, f), os(r.plugins, `onRumStart`, {
                addEvent: f.addEvent,
                addError: f.addError
            }), f
        }),
        o = () => a,
        s = ji({
            init: e => {
                let t = Error().stack;
                P(() => a.init(e, s, t))
            },
            setTrackingConsent: N(e => {
                r.update(e), G({
                    feature: `set-tracking-consent`,
                    tracking_consent: e
                })
            }),
            setViewName: N(e => {
                a.setViewName(e), G({
                    feature: `set-view-name`
                })
            }),
            setViewContext: N(e => {
                a.setViewContext(e), G({
                    feature: `set-view-context`
                })
            }),
            setViewContextProperty: N((e, t) => {
                a.setViewContextProperty(e, t), G({
                    feature: `set-view-context-property`
                })
            }),
            getViewContext: N(() => (G({
                feature: `set-view-context-property`
            }), a.getViewContext())),
            getInternalContext: N(e => a.getInternalContext(e)),
            getInitConfiguration: N(() => Tn(a.initConfiguration)),
            addAction: (e, t) => {
                let n = Xt(`action`);
                P(() => {
                    a.addAction({
                        name: V(e),
                        context: V(t),
                        startClocks: D(),
                        type: bo.CUSTOM,
                        handlingStack: n
                    }), G({
                        feature: `add-action`
                    })
                })
            },
            startAction: N((e, t) => {
                a.initConfiguration && !dn(H.START_STOP_ACTION) || a.startAction(V(e), {
                    type: V(t && t.type),
                    context: V(t && t.context),
                    actionKey: t && t.actionKey
                })
            }),
            stopAction: N((e, t) => {
                a.initConfiguration && !dn(H.START_STOP_ACTION) || a.stopAction(V(e), {
                    type: V(t && t.type),
                    context: V(t && t.context),
                    actionKey: t && t.actionKey
                })
            }),
            startResource: N((e, t) => {
                a.initConfiguration && !dn(H.START_STOP_RESOURCE) || a.startResource(V(e), {
                    type: V(t && t.type),
                    method: V(t && t.method),
                    context: V(t && t.context),
                    resourceKey: t && t.resourceKey
                })
            }),
            stopResource: N((e, t) => {
                a.initConfiguration && !dn(H.START_STOP_RESOURCE) || a.stopResource(V(e), {
                    type: V(t && t.type),
                    statusCode: t && t.statusCode,
                    size: t && t.size,
                    context: V(t && t.context),
                    resourceKey: t && t.resourceKey
                })
            }),
            addError: (e, t) => {
                let n = Xt(`error`);
                P(() => {
                    a.addError({
                        error: e,
                        handlingStack: n,
                        context: V(t),
                        startClocks: D()
                    }), G({
                        feature: `add-error`
                    })
                })
            },
            addTiming: N((e, t) => {
                a.addTiming(V(e), t)
            }),
            setViewLoadingTime: N(() => {
                let e = T();
                a.setLoadingTime(e), G({
                    feature: `addViewLoadingTime`
                })
            }),
            setGlobalContext: q(o, J.globalContext, Y.setContext, `set-global-context`),
            getGlobalContext: q(o, J.globalContext, Y.getContext, `get-global-context`),
            setGlobalContextProperty: q(o, J.globalContext, Y.setContextProperty, `set-global-context-property`),
            removeGlobalContextProperty: q(o, J.globalContext, Y.removeContextProperty, `remove-global-context-property`),
            clearGlobalContext: q(o, J.globalContext, Y.clearContext, `clear-global-context`),
            setUser: q(o, J.userContext, Y.setContext, `set-user`),
            getUser: q(o, J.userContext, Y.getContext, `get-user`),
            setUserProperty: q(o, J.userContext, Y.setContextProperty, `set-user-property`),
            removeUserProperty: q(o, J.userContext, Y.removeContextProperty, `remove-user-property`),
            clearUser: q(o, J.userContext, Y.clearContext, `clear-user`),
            setAccount: q(o, J.accountContext, Y.setContext, `set-account`),
            getAccount: q(o, J.accountContext, Y.getContext, `get-account`),
            setAccountProperty: q(o, J.accountContext, Y.setContextProperty, `set-account-property`),
            removeAccountProperty: q(o, J.accountContext, Y.removeContextProperty, `remove-account-property`),
            clearAccount: q(o, J.accountContext, Y.clearContext, `clear-account`),
            startView: e => {
                let t = Xt(`view`);
                P(() => {
                    let n = typeof e == `object` ? e : {
                        name: e
                    };
                    a.startView({ ...n,
                        handlingStack: t
                    }), G({
                        feature: `start-view`
                    })
                })
            },
            stopSession: N(() => {
                a.stopSession(), G({
                    feature: `stop-session`
                })
            }),
            addFeatureFlagEvaluation: N((e, t) => {
                a.addFeatureFlagEvaluation(V(e), V(t)), G({
                    feature: `add-feature-flag-evaluation`
                })
            }),
            getSessionReplayLink: N(() => e.getSessionReplayLink()),
            startSessionReplayRecording: N(t => {
                e.start(t), G({
                    feature: `start-session-replay-recording`,
                    force: t && t.force
                })
            }),
            stopSessionReplayRecording: N(() => e.stop()),
            addDurationVital: (e, t) => {
                let n = Xt(`vital`);
                P(() => {
                    G({
                        feature: `add-duration-vital`
                    }), a.addDurationVital({
                        id: M(),
                        name: V(e),
                        type: So.DURATION,
                        startClocks: ie(t.startTime),
                        duration: t.duration,
                        context: V(t && t.context),
                        description: V(t && t.description),
                        handlingStack: n
                    })
                })
            },
            startDurationVital: (e, t) => {
                let n = Xt(`vital`);
                P(() => {
                    G({
                        feature: `start-duration-vital`
                    }), a.startDurationVital(V(e), {
                        vitalKey: t && t.vitalKey,
                        context: V(t && t.context),
                        description: V(t && t.description),
                        handlingStack: n
                    })
                })
            },
            stopDurationVital: N((e, t) => {
                G({
                    feature: `stop-duration-vital`
                }), a.stopDurationVital(V(e), {
                    vitalKey: t && t.vitalKey,
                    context: V(t && t.context),
                    description: V(t && t.description)
                })
            }),
            startFeatureOperation: (e, t) => {
                let n = Xt(`vital`);
                P(() => {
                    G({
                        feature: `add-operation-step-vital`,
                        action_type: `start`
                    }), a.addOperationStepVital(e, `start`, { ...t,
                        handlingStack: n
                    })
                })
            },
            succeedFeatureOperation: N((e, t) => {
                G({
                    feature: `add-operation-step-vital`,
                    action_type: `succeed`
                }), a.addOperationStepVital(e, `end`, t)
            }),
            failFeatureOperation: N((e, t, n) => {
                G({
                    feature: `add-operation-step-vital`,
                    action_type: `fail`
                }), a.addOperationStepVital(e, `end`, n, t)
            }),
            DEFAULT_TRACKED_RESOURCE_HEADERS: wo
        });
    return s
}

function Qf(e, t) {
    return { ...e,
        init: e => {
            Ni(`DD_RUM`, e)
        },
        getInternalContext: t.getInternalContext,
        stopSession: t.stopSession,
        getViewContext: t.getViewContext,
        globalContext: t.globalContext,
        userContext: t.userContext,
        accountContext: t.accountContext
    }
}

function $f(e, {
    session: t,
    viewContext: n,
    errorType: r
}) {
    let i = t ? t.id : `no-session-id`,
        a = [];
    return r !== void 0 && a.push(`error-type=${r}`), n && (a.push(`seed=${n.id}`), a.push(`from=${n.startClocks.timeStamp}`)), `${ep(e)}${`/rum/replay/sessions/${i}`}?${a.join(`&`)}`
}

function ep(e) {
    let t = e.site,
        n = e.subdomain || tp(e);
    return `https://${n?`${n}.`:``}${t}`
}

function tp(e) {
    switch (e.site) {
        case vn:
        case yn:
            return `app`;
        case _n:
            return `dd`;
        default:
            return
    }
}

function np(e) {
    return $f(e, {
        errorType: `slim-package`
    })
}

function rp() {
    let e = B;
    return {
        start: B,
        stop: B,
        onRumStart(t, n) {
            e = () => np(n)
        },
        isRecording: () => !1,
        getReplayStats: () => void 0,
        getSessionReplayLink: () => e()
    }
}

function ip() {
    return {
        onRumStart: B,
        stop: B
    }
}
var ap = e({
        DEFAULT_TRACKED_RESOURCE_HEADERS: () => wo,
        DefaultPrivacyLevel: () => xi,
        datadogRum: () => op
    }),
    op = Zf(rp(), ip(), {
        sdkName: `rum-slim`
    });
Mi(v(), `DD_RUM`, op);
export {
    ap as t
};
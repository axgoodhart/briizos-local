import {
    o as e,
    t
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    t as n
} from "./react-BthIFXYf.js";
import {
    P as r
} from "./useOrg-DgFJtzUv.js";
import {
    t as i
} from "./jsx-runtime-DDrWIXeu.js";
import {
    t as a
} from "./cn-qYiRd2Uw.js";

function o(e, t) {
    return function(n, ...r) {
        let i = new URL(e);
        return i.searchParams.set(`code`, n.toString()), r.forEach(e => i.searchParams.append(`args[]`, e)), `${t} error #${n}; visit ${i} for the full message.`
    }
}
var s = o(`https://base-ui.com/production-error`, `Base UI`),
    c = e(n()),
    l = {};

function u(e, t) {
    let n = c.useRef(l);
    return n.current === l && (n.current = e(t)), n
}

function d(e, t, n, r) {
    let i = u(p).current;
    return m(i, e, t, n, r) && g(i, [e, t, n, r]), i.callback
}

function f(e) {
    let t = u(p).current;
    return h(t, e) && g(t, e), t.callback
}

function p() {
    return {
        callback: null,
        cleanup: null,
        refs: []
    }
}

function m(e, t, n, r, i) {
    return e.refs[0] !== t || e.refs[1] !== n || e.refs[2] !== r || e.refs[3] !== i
}

function h(e, t) {
    return e.refs.length !== t.length || e.refs.some((e, n) => e !== t[n])
}

function g(e, t) {
    if (e.refs = t, t.every(e => e == null)) {
        e.callback = null;
        return
    }
    e.callback = n => {
        if (e.cleanup && = (e.cleanup(), null), n != null) {
            let r = Array(t.length).fill(null);
            for (let e = 0; e < t.length; e += 1) {
                let i = t[e];
                if (i != null) switch (typeof i) {
                    case `function`:
                        {
                            let t = i(n);typeof t == `function` && (r[e] = t);
                            break
                        }
                    case `object`:
                        i.current = n;
                        break;
                    default:
                }
            }
            e.cleanup = () => {
                for (let e = 0; e < t.length; e += 1) {
                    let n = t[e];
                    if (n != null) switch (typeof n) {
                        case `function`:
                            {
                                let t = r[e];typeof t == `function` ? t() : n(null);
                                break
                            }
                        case `object`:
                            n.current = null;
                            break;
                        default:
                    }
                }
            }
        }
    }
}
var _ = 19;

function v(e) {
    return _ >= e
}

function y(e) {
    if (!c.isValidElement(e)) return null;
    let t = e,
        n = t.props;
    return (v(19) ? n ? .ref : t.ref) ? ? null
}

function b(e, t) {
    if (e && !t) return e;
    if (!e && t) return t;
    if (e || t) return { ...e,
        ...t
    }
}

function x() {}
var S = Object.freeze([]),
    C = Object.freeze({});

function w(e, t) {
    let n = {};
    for (let r in e) {
        let i = e[r];
        if (t ? .hasOwnProperty(r)) {
            let e = t[r](i);
            e != null && Object.assign(n, e);
            continue
        }
        i === !0 ? n[`data-${r.toLowerCase()}`] = `` : i && (n[`data-${r.toLowerCase()}`] = i.toString())
    }
    return n
}

function T(e, t) {
    return typeof e == `function` ? e(t) : e
}

function E(e, t) {
    return typeof e == `function` ? e(t) : e
}
var D = {};

function O(e, t, n, r, i) {
    if (!n && !r && !i && !e) return A(t);
    let a = A(e);
    return t && (a = j(a, t)), n && (a = j(a, n)), r && (a = j(a, r)), i && (a = j(a, i)), a
}

function k(e) {
    if (e.length === 0) return D;
    if (e.length === 1) return A(e[0]);
    let t = A(e[0]);
    for (let n = 1; n < e.length; n += 1) t = j(t, e[n]);
    return t
}

function A(e) {
    return F(e) ? { ...I(e, D)
    } : M(e)
}

function j(e, t) {
    return F(t) ? I(t, e) : N(e, t)
}

function M(e) {
    let t = { ...e
    };
    for (let e in t) {
        let n = t[e];
        P(e, n) && (t[e] = R(n))
    }
    return t
}

function N(e, t) {
    if (!t) return e;
    for (let n in t) {
        let r = t[n];
        switch (n) {
            case `style`:
                e[n] = b(e.style, r);
                break;
            case `className`:
                e[n] = te(e.className, r);
                break;
            default:
                P(n, r) ? e[n] = L(e[n], r) : e[n] = r
        }
    }
    return e
}

function P(e, t) {
    let n = e.charCodeAt(0),
        r = e.charCodeAt(1),
        i = e.charCodeAt(2);
    return n === 111 && r === 110 && i >= 65 && i <= 90 && (typeof t == `function` || t === void 0)
}

function F(e) {
    return typeof e == `function`
}

function I(e, t) {
    return F(e) ? e(t) : e ? ? D
}

function L(e, t) {
    return t ? e ? (...n) => {
        let r = n[0];
        if (ne(r)) {
            let i = r;
            ee(i);
            let a = t(...n);
            return i.baseUIHandlerPrevented || e ? .(...n), a
        }
        let i = t(...n);
        return e ? .(...n), i
    } : R(t) : e
}

function R(e) {
    return e && ((...t) => {
        let n = t[0];
        return ne(n) && ee(n), e(...t)
    })
}

function ee(e) {
    return e.preventBaseUIHandler = () => {
        e.baseUIHandlerPrevented = !0
    }, e
}

function te(e, t) {
    return t ? e ? t + ` ` + e : t : e
}

function ne(e) {
    return typeof e == `object` && !!e && `nativeEvent` in e
}

function re(e, t, n = {}) {
    let r = t.render,
        i = z(t, n);
    return n.enabled === !1 ? null : oe(e, r, i, n.state ? ? C)
}

function z(e, t = {}) {
    let {
        className: n,
        style: r,
        render: i
    } = e, {
        state: a = C,
        ref: o,
        props: s,
        stateAttributesMapping: c,
        enabled: l = !0
    } = t, u = l ? T(n, a) : void 0, p = l ? E(r, a) : void 0, m = l ? w(a, c) : C, h = l && s ? ie(s) : void 0, g = l ? b(m, h) ? ? {} : C;
    return typeof document < `u` && (l ? Array.isArray(o) ? g.ref = f([g.ref, y(i), ...o]) : g.ref = d(g.ref, y(i), o) : d(null, null)), l ? (u !== void 0 && (g.className = te(g.className, u)), p !== void 0 && (g.style = b(g.style, p)), g) : C
}

function ie(e) {
    return Array.isArray(e) ? k(e) : O(void 0, e)
}
var ae = Symbol.for(`react.lazy`);

function oe(e, t, n, r) {
    if (t) {
        if (typeof t == `function`) return t(n, r);
        let e = O(n, t.props);
        e.ref = n.ref;
        let i = t;
        return i ? .$$typeof === ae && (i = c.Children.toArray(t)[0]), c.cloneElement(i, e)
    }
    if (e && typeof e == `string`) return se(e, n);
    throw Error(s(8))
}

function se(e, t) {
    return e === `button` ? (0, c.createElement)(`button`, {
        type: `button`,
        ...t,
        key: t.key
    }) : e === `img` ? (0, c.createElement)(`img`, {
        alt: ``,
        ...t,
        key: t.key
    }) : c.createElement(e, t)
}

function ce(e) {
    return re(e.defaultTagName ? ? `div`, e, e)
}
var le = e(r()),
    B = i(),
    ue = /\b(?:Claude(?:Nest|Gov)?|Electron)\//i;

function de() {
    return typeof navigator > `u` ? `web` : ue.test(navigator.userAgent) ? `desktop` : `web`
}
var fe = (0, c.createContext)(void 0);

function pe() {
    return (0, c.useContext)(fe)
}

function me(e) {
    if (!e) return e;
    let t = e.replace(/[\x00-\x1f]/g, ``).trimStart(),
        n = t.toLowerCase();
    return n.startsWith(`javascript:`) || n.startsWith(`data:`) ? `#` : t
}
var he = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

function ge(e) {
    if (!he.test(e)) return !0;
    if (typeof window > `u`) return !1;
    try {
        return new URL(e, window.location.href).origin === window.location.origin
    } catch {
        return !1
    }
}

function _e(e, t) {
    return !t.router || !t.href || t.href === `#` || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || t.target && t.target !== `_self` || t.download !== null && t.download !== void 0 && t.download !== !1 ? !1 : ge(t.href)
}

function ve({
    href: e,
    routerOptions: t,
    target: n,
    rel: r,
    download: i,
    onClick: a
}) {
    let o = pe(),
        s = me(e),
        l = o ? .useHref && s && s !== `#` && !he.test(s) ? o.useHref(s) : s,
        u = (0, c.useCallback)(e => {
            if (a ? .(e), !_e(e, {
                    href: s,
                    target: n,
                    download: i,
                    router: o
                })) return;
            e.preventDefault();
            let r = s;
            if (he.test(r)) {
                let e = new URL(r, window.location.href);
                r = e.pathname + e.search + e.hash
            }
            o.navigate(r, t)
        }, [a, s, n, i, o, t]);
    return {
        href: l,
        target: n,
        rel: n === `_blank` && r === void 0 ? `noopener noreferrer` : r,
        download: i,
        onClick: u
    }
}
var ye = typeof window < `u` ? c.useLayoutEffect : c.useEffect;

function be(e) {
    return e && e !== `base` ? {
        "data-size": e
    } : {}
}
var xe = (0, c.createContext)(`comfortable`),
    Se = (0, c.createContext)(void 0),
    Ce = (0, c.createContext)(void 0),
    we = (0, c.createContext)(void 0),
    Te = (0, c.createContext)(void 0),
    Ee = (0, c.createContext)(void 0);

function De() {
    return (0, c.useContext)(xe)
}

function Oe() {
    return (0, c.useContext)(Se)
}

function ke() {
    return (0, c.useContext)(Ce) ? ? `web`
}

function Ae() {
    return (0, c.useContext)(we)
}

function je() {
    return (0, c.useContext)(Te)
}

function Me() {
    return (0, c.useContext)(Ee)
}

function Ne({
    density: e,
    mode: t,
    platform: n,
    font: r,
    pageBackground: i,
    router: o,
    render: s,
    className: l,
    children: u
}) {
    let d = (0, c.useContext)(xe),
        f = (0, c.useContext)(Se),
        p = (0, c.useContext)(Ce),
        m = (0, c.useContext)(we),
        h = (0, c.useContext)(Te),
        g = pe(),
        _ = e ? ? d,
        v = o ? ? g,
        y = r ? ? m ? ? `anthropic`,
        b = i ? ? h,
        [x, S] = (0, c.useState)(`web`);
    (0, c.useEffect)(() => {
        n !== void 0 || p !== void 0 || S(de())
    }, [n, p]);
    let C = n ? ? p ? ? x,
        w = (0, c.useRef)(null),
        [T, E] = (0, c.useState)();
    ye(() => {
        if (t !== void 0 || f !== void 0) return;
        let e = () => {
            let e = ((w.current ? .parentElement) ? .closest(`[data-mode]`)) ? .getAttribute(`data-mode`);
            E(e === `dark` || e === `light` ? e : e === `auto` || e === `system` ? `system` : void 0)
        };
        e();
        let n = new MutationObserver(e);
        return n.observe(document.documentElement, {
            attributes: !0,
            attributeFilter: [`data-mode`],
            subtree: !0
        }), () => n.disconnect()
    }, [t, f]);
    let D = t === `system` || t === void 0 && f === void 0 && (T === `system` || T === void 0),
        [O, k] = (0, c.useState)();
    ye(() => {
        if (!D) return;
        let e = window.matchMedia(`(prefers-color-scheme: dark)`),
            t = () => k(e.matches ? `dark` : `light`);
        return t(), e.addEventListener(`change`, t), () => e.removeEventListener(`change`, t)
    }, [D]);
    let A = t === `light` || t === `dark` ? t : t === `system` ? O : f ? ? (T === `light` || T === `dark` ? T : O),
        j = A ? ? t ? ? f;
    (0, c.useEffect)(() => {}, []);
    let M = ce({
        render: s,
        defaultTagName: `div`,
        ref: w,
        props: {
            className: a(`cds-root text-primary`, l),
            "data-density": _,
            "data-mode": j,
            "data-platform": C,
            "data-font": y,
            "data-page-bg": b,
            style: {
                fontSize: `var(--cds-font-size-body)`,
                ...b && {
                    "--cds-page-bg": `var(--cds-${b})`
                }
            },
            children: u
        }
    });
    return (0, B.jsx)(xe.Provider, {
        value: _,
        children: (0, B.jsx)(Se.Provider, {
            value: A,
            children: (0, B.jsx)(Ce.Provider, {
                value: C,
                children: (0, B.jsx)(we.Provider, {
                    value: y,
                    children: (0, B.jsx)(Te.Provider, {
                        value: b,
                        children: (0, B.jsx)(fe.Provider, {
                            value: v,
                            children: M
                        })
                    })
                })
            })
        })
    })
}

function Pe({
    children: e,
    className: t
}) {
    let n = De(),
        r = Oe(),
        i = ke(),
        o = Ae(),
        s = je();
    return (0, B.jsx)(`div`, {
        className: a(`cds-root pointer-events-auto`, t),
        "data-cds-portal": ``,
        "data-density": n,
        "data-mode": r,
        "data-platform": i,
        "data-font": o,
        "data-page-bg": s,
        style: s ? {
            "--cds-page-bg": `var(--cds-${s})`
        } : void 0,
        children: e
    })
}
var Fe = { ...c
    },
    Ie = Fe.useInsertionEffect,
    Le = Ie && Ie !== Fe.useLayoutEffect ? Ie : e => e();

function V(e) {
    let t = u(Re).current;
    return t.next = e, Le(t.effect), t.trampoline
}

function Re() {
    let e = {
        next: void 0,
        callback: ze,
        trampoline: (...t) => e.callback ? .(...t),
        effect: () => {
            e.callback = e.next
        }
    };
    return e
}

function ze() {}
var H = typeof document < `u` ? c.useLayoutEffect : () => {},
    Be = c.createContext(void 0);

function Ve() {
    return c.useContext(Be) ? .direction ? ? `ltr`
}
var He = `none`,
    Ue = `trigger-press`,
    We = `trigger-hover`,
    Ge = `trigger-focus`,
    Ke = `outside-press`,
    qe = `item-press`,
    Je = `close-press`,
    Ye = `clear-press`,
    Xe = `chip-remove-press`,
    Ze = `input-change`,
    Qe = `input-clear`,
    $e = `input-press`,
    et = `focus-out`,
    tt = `escape-key`,
    nt = `list-navigation`,
    rt = `cancel-open`,
    it = `sibling-open`,
    at = `disabled`,
    ot = `missing`,
    st = `initial`,
    ct = `imperative-action`;

function U(e, t, n, r) {
    let i = !1,
        a = !1,
        o = r ? ? C;
    return {
        reason: e,
        event: t ? ? new Event(`base-ui`),
        cancel() {
            i = !0
        },
        allowPropagation() {
            a = !0
        },
        get isCanceled() {
            return i
        },
        get isPropagationAllowed() {
            return a
        },
        trigger: n,
        ...o
    }
}

function lt(e, t, n) {
    let r = n ? ? C;
    return {
        reason: e,
        event: t ? ? new Event(`base-ui`),
        ...r
    }
}
var ut = 0;

function dt(e, t = `mui`) {
    let [n, r] = c.useState(e), i = e || n;
    return c.useEffect(() => {
        n ? ? (ut += 1, r(`${t}-${ut}`))
    }, [n, t]), i
}
var ft = Fe.useId;

function pt(e, t) {
    if (ft !== void 0) {
        let n = ft();
        return e ? ? (t ? `${t}-${n}` : n)
    }
    return dt(e, t)
}

function mt(e) {
    return pt(e, `base-ui`)
}
var ht = [];

function gt(e) {
    c.useEffect(e, ht)
}
var _t = null;
globalThis.requestAnimationFrame;
var vt = new class {
        callbacks = [];
        callbacksCount = 0;
        nextId = 1;
        startId = 1;
        isScheduled = !1;
        tick = e => {
            this.isScheduled = !1;
            let t = this.callbacks,
                n = this.callbacksCount;
            if (this.callbacks = [], this.callbacksCount = 0, this.startId = this.nextId, n > 0)
                for (let n = 0; n < t.length; n += 1) t[n] ? .(e)
        };
        request(e) {
            let t = this.nextId;
            return this.nextId += 1, this.callbacks.push(e), this.callbacksCount += 1, this.isScheduled || = (requestAnimationFrame(this.tick), !0), t
        }
        cancel(e) {
            let t = e - this.startId;
            t < 0 || t >= this.callbacks.length || (this.callbacks[t] = null, --this.callbacksCount)
        }
    },
    yt = class e {
        static create() {
            return new e
        }
        static request(e) {
            return vt.request(e)
        }
        static cancel(e) {
            return vt.cancel(e)
        }
        currentId = _t;
        request(e) {
            this.cancel(), this.currentId = vt.request(() => {
                this.currentId = _t, e()
            })
        }
        cancel = () => {
            this.currentId !== _t && (vt.cancel(this.currentId), this.currentId = _t)
        };
        disposeEffect = () => this.cancel
    };

function bt() {
    let e = u(yt.create).current;
    return gt(e.disposeEffect), e
}

function xt(e, t = !1, n = !1) {
    let [r, i] = c.useState(e && t ? `idle` : void 0), [a, o] = c.useState(e);
    return e && !a && (o(!0), i(`starting`)), !e && a && r !== `ending` && !n && i(`ending`), !e && !a && r === `ending` && i(void 0), H(() => {
        if (!e && a && r !== `ending` && n) {
            let e = yt.request(() => {
                i(`ending`)
            });
            return () => {
                yt.cancel(e)
            }
        }
    }, [e, a, r, n]), H(() => {
        if (!e || t) return;
        let n = yt.request(() => {
            i(void 0)
        });
        return () => {
            yt.cancel(n)
        }
    }, [t, e]), H(() => {
        if (!e || !t) return;
        e && a && r !== `idle` && i(`starting`);
        let n = yt.request(() => {
            i(`idle`)
        });
        return () => {
            yt.cancel(n)
        }
    }, [t, e, a, r]), {
        mounted: a,
        setMounted: o,
        transitionStatus: r
    }
}
var St = function(e) {
        return e.startingStyle = `data-starting-style`, e.endingStyle = `data-ending-style`, e
    }({}),
    Ct = {
        [St.startingStyle]: ``
    },
    wt = {
        [St.endingStyle]: ``
    },
    Tt = {
        transitionStatus(e) {
            return e === `starting` ? Ct : e === `ending` ? wt : null
        }
    };

function Et() {
    return typeof window < `u`
}

function W(e) {
    return Ot(e) ? (e.nodeName || ``).toLowerCase() : `#document`
}

function G(e) {
    var t;
    return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window
}

function Dt(e) {
    return ((Ot(e) ? e.ownerDocument : e.document) || window.document) ? .documentElement
}

function Ot(e) {
    return Et() ? e instanceof Node || e instanceof G(e).Node : !1
}

function K(e) {
    return Et() ? e instanceof Element || e instanceof G(e).Element : !1
}

function q(e) {
    return Et() ? e instanceof HTMLElement || e instanceof G(e).HTMLElement : !1
}

function kt(e) {
    return !Et() || typeof ShadowRoot > `u` ? !1 : e instanceof ShadowRoot || e instanceof G(e).ShadowRoot
}

function At(e) {
    let {
        overflow: t,
        overflowX: n,
        overflowY: r,
        display: i
    } = J(e);
    return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && i !== `inline` && i !== `contents`
}

function jt(e) {
    return /^(table|td|th)$/.test(W(e))
}

function Mt(e) {
    try {
        if (e.matches(`:popover-open`)) return !0
    } catch {}
    try {
        return e.matches(`:modal`)
    } catch {
        return !1
    }
}
var Nt = /transform|translate|scale|rotate|perspective|filter/,
    Pt = /paint|layout|strict|content/,
    Ft = e => !!e && e !== `none`,
    It;

function Lt(e) {
    let t = K(e) ? J(e) : e;
    return Ft(t.transform) || Ft(t.translate) || Ft(t.scale) || Ft(t.rotate) || Ft(t.perspective) || !zt() && (Ft(t.backdropFilter) || Ft(t.filter)) || Nt.test(t.willChange || ``) || Pt.test(t.contain || ``)
}

function Rt(e) {
    let t = Ht(e);
    for (; q(t) && !Bt(t);) {
        if (Lt(t)) return t;
        if (Mt(t)) return null;
        t = Ht(t)
    }
    return null
}

function zt() {
    return It ? ? = typeof CSS < `u` && CSS.supports && CSS.supports(`-webkit-backdrop-filter`, `none`), It
}

function Bt(e) {
    return /^(html|body|#document)$/.test(W(e))
}

function J(e) {
    return G(e).getComputedStyle(e)
}

function Vt(e) {
    return K(e) ? {
        scrollLeft: e.scrollLeft,
        scrollTop: e.scrollTop
    } : {
        scrollLeft: e.scrollX,
        scrollTop: e.scrollY
    }
}

function Ht(e) {
    if (W(e) === `html`) return e;
    let t = e.assignedSlot || e.parentNode || kt(e) && e.host || Dt(e);
    return kt(t) ? t.host : t
}

function Ut(e) {
    let t = Ht(e);
    return Bt(t) ? e.ownerDocument ? e.ownerDocument.body : e.body : q(t) && At(t) ? t : Ut(t)
}

function Wt(e, t, n) {
    t === void 0 && (t = []), n === void 0 && (n = !0);
    let r = Ut(e),
        i = r === e.ownerDocument ? .body,
        a = G(r);
    if (i) {
        let e = Gt(a);
        return t.concat(a, a.visualViewport || [], At(r) ? r : [], e && n ? Wt(e) : [])
    } else return t.concat(r, Wt(r, [], n))
}

function Gt(e) {
    return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null
}
var Kt = typeof navigator < `u`,
    qt = rn(),
    Jt = on(),
    Yt = an(),
    Xt = typeof CSS > `u` || !CSS.supports ? !1 : CSS.supports(`-webkit-backdrop-filter:none`),
    Zt = qt.platform === `MacIntel` && qt.maxTouchPoints > 1 ? !0 : /iP(hone|ad|od)|iOS/.test(qt.platform),
    Qt = Kt && /firefox/i.test(Yt),
    $t = Kt && /apple/i.test(navigator.vendor);
Kt && /Edg/i.test(Yt);
var en = Kt && /android/i.test(Jt) || /android/i.test(Yt),
    tn = Kt && Jt.toLowerCase().startsWith(`mac`) && !navigator.maxTouchPoints,
    nn = Yt.includes(`jsdom/`);

function rn() {
    if (!Kt) return {
        platform: ``,
        maxTouchPoints: -1
    };
    let e = navigator.userAgentData;
    return e ? .platform ? {
        platform: e.platform,
        maxTouchPoints: navigator.maxTouchPoints
    } : {
        platform: navigator.platform ? ? ``,
        maxTouchPoints: navigator.maxTouchPoints ? ? -1
    }
}

function an() {
    if (!Kt) return ``;
    let e = navigator.userAgentData;
    return e && Array.isArray(e.brands) ? e.brands.map(({
        brand: e,
        version: t
    }) => `${e}/${t}`).join(` `) : navigator.userAgent
}

function on() {
    if (!Kt) return ``;
    let e = navigator.userAgentData;
    return e ? .platform ? e.platform : navigator.platform ? ? ``
}
var sn = `data-base-ui-focusable`,
    cn = `input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])`,
    ln = `ArrowLeft`,
    un = `ArrowRight`,
    dn = `ArrowUp`,
    fn = `ArrowDown`;

function pn(e) {
    let t = e.activeElement;
    for (; t ? .shadowRoot ? .activeElement != null;) t = t.shadowRoot.activeElement;
    return t
}

function Y(e, t) {
    if (!e || !t) return !1;
    let n = t.getRootNode ? .();
    if (e.contains(t)) return !0;
    if (n && kt(n)) {
        let n = t;
        for (; n;) {
            if (e === n) return !0;
            n = n.parentNode || n.host
        }
    }
    return !1
}

function mn(e) {
    return `composedPath` in e ? e.composedPath()[0] : e.target
}

function hn(e, t) {
    if (!K(e)) return !1;
    let n = e;
    if (t.hasElement(n)) return !n.hasAttribute(`data-trigger-disabled`);
    for (let [, e] of t.entries())
        if (Y(e, n)) return !e.hasAttribute(`data-trigger-disabled`);
    return !1
}

function gn(e, t) {
    if (t == null) return !1;
    if (`composedPath` in e) return e.composedPath().includes(t);
    let n = e;
    return n.target != null && t.contains(n.target)
}

function _n(e) {
    return e.matches(`html,body`)
}

function vn(e) {
    return q(e) && e.matches(`input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])`)
}

function yn(e) {
    return e ? .closest(`button,a[href],[role="button"],select,[tabindex]:not([tabindex="-1"]),${cn}`) != null
}

function bn(e) {
    return e ? e.getAttribute(`role`) === `combobox` && vn(e) : !1
}

function xn(e) {
    if (!e || nn) return !0;
    try {
        return e.matches(`:focus-visible`)
    } catch {
        return !0
    }
}

function Sn(e) {
    return e ? e.hasAttribute(`data-base-ui-focusable`) ? e : e.querySelector(`[data-base-ui-focusable]`) || e : null
}

function Cn(e, t, n = !0) {
    return e.filter(e => e.parentId === t).flatMap(t => [...!n || t.context ? .open ? [t] : [], ...Cn(e, t.id, n)])
}

function wn(e, t) {
    let n = [],
        r = e.find(e => e.id === t) ? .parentId;
    for (; r;) {
        let t = e.find(e => e.id === r);
        r = t ? .parentId, t && (n = n.concat(t))
    }
    return n
}

function Tn(e) {
    e.preventDefault(), e.stopPropagation()
}

function En(e) {
    return `nativeEvent` in e
}

function Dn(e) {
    return e.pointerType === `` && e.isTrusted ? !0 : en && e.pointerType ? e.type === `click` && e.buttons === 1 : e.detail === 0 && !e.pointerType
}

function On(e) {
    return nn ? !1 : !en && e.width === 0 && e.height === 0 || en && e.width === 1 && e.height === 1 && e.pressure === 0 && e.detail === 0 && e.pointerType === `mouse` || e.width < 1 && e.height < 1 && e.pressure === 0 && e.detail === 0 && e.pointerType === `touch`
}

function kn(e, t) {
    let n = [`mouse`, `pen`];
    return t || n.push(``, void 0), n.includes(e)
}

function An(e) {
    let t = e.type;
    return t === `click` || t === `mousedown` || t === `keydown` || t === `keyup`
}
var jn = [`top`, `right`, `bottom`, `left`],
    Mn = Math.min,
    Nn = Math.max,
    Pn = Math.round,
    Fn = Math.floor,
    In = e => ({
        x: e,
        y: e
    }),
    Ln = {
        left: `right`,
        right: `left`,
        bottom: `top`,
        top: `bottom`
    };

function Rn(e, t, n) {
    return Nn(e, Mn(t, n))
}

function zn(e, t) {
    return typeof e == `function` ? e(t) : e
}

function Bn(e) {
    return e.split(`-`)[0]
}

function Vn(e) {
    return e.split(`-`)[1]
}

function Hn(e) {
    return e === `x` ? `y` : `x`
}

function Un(e) {
    return e === `y` ? `height` : `width`
}

function Wn(e) {
    let t = e[0];
    return t === `t` || t === `b` ? `y` : `x`
}

function Gn(e) {
    return Hn(Wn(e))
}

function Kn(e, t, n) {
    n === void 0 && (n = !1);
    let r = Vn(e),
        i = Gn(e),
        a = Un(i),
        o = i === `x` ? r === (n ? `end` : `start`) ? `right` : `left` : r === `start` ? `bottom` : `top`;
    return t.reference[a] > t.floating[a] && (o = tr(o)), [o, tr(o)]
}

function qn(e) {
    let t = tr(e);
    return [Jn(e), t, Jn(t)]
}

function Jn(e) {
    return e.includes(`start`) ? e.replace(`start`, `end`) : e.replace(`end`, `start`)
}
var Yn = [`left`, `right`],
    Xn = [`right`, `left`],
    Zn = [`top`, `bottom`],
    Qn = [`bottom`, `top`];

function $n(e, t, n) {
    switch (e) {
        case `top`:
        case `bottom`:
            return n ? t ? Xn : Yn : t ? Yn : Xn;
        case `left`:
        case `right`:
            return t ? Zn : Qn;
        default:
            return []
    }
}

function er(e, t, n, r) {
    let i = Vn(e),
        a = $n(Bn(e), n === `start`, r);
    return i && (a = a.map(e => e + `-` + i), t && (a = a.concat(a.map(Jn)))), a
}

function tr(e) {
    let t = Bn(e);
    return Ln[t] + e.slice(t.length)
}

function nr(e) {
    return {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        ...e
    }
}

function rr(e) {
    return typeof e == `number` ? {
        top: e,
        right: e,
        bottom: e,
        left: e
    } : nr(e)
}

function ir(e) {
    let {
        x: t,
        y: n,
        width: r,
        height: i
    } = e;
    return {
        width: r,
        height: i,
        top: n,
        left: t,
        right: t + r,
        bottom: n + i,
        x: t,
        y: n
    }
}

function ar(e, t, n) {
    return Math.floor(e / t) !== n
}

function or(e, t) {
    return t < 0 || t >= e.length
}

function sr(e, t) {
    return lr(e.current, {
        disabledIndices: t
    })
}

function cr(e, t) {
    return lr(e.current, {
        decrement: !0,
        startingIndex: e.current.length,
        disabledIndices: t
    })
}

function lr(e, {
    startingIndex: t = -1,
    decrement: n = !1,
    disabledIndices: r,
    amount: i = 1
} = {}) {
    let a = t;
    do a += n ? -i : i; while (a >= 0 && a <= e.length - 1 && mr(e, a, r));
    return a
}

function ur(e, {
    event: t,
    orientation: n,
    loopFocus: r,
    onLoop: i,
    rtl: a,
    cols: o,
    disabledIndices: s,
    minIndex: c,
    maxIndex: l,
    prevIndex: u,
    stopEvent: d = !1
}) {
    let f = u,
        p;
    if (t.key === `ArrowUp` ? p = `up` : t.key === `ArrowDown` && (p = `down`), p) {
        let n = [],
            a = [],
            m = !1,
            h = 0; {
            let t = null,
                r = -1;
            e.forEach((e, i) => {
                if (e == null) return;
                h += 1;
                let o = e.closest(`[role="row"]`);
                o && (m = !0), (o !== t || r === -1) && (t = o, r += 1, n[r] = []), n[r].push(i), a[i] = r
            })
        }
        let g = !1,
            _ = 0;
        if (m)
            for (let e of n) {
                let t = e.length;
                t > _ && (_ = t), t !== o && (g = !0)
            }
        let v = g && h < e.length,
            y = _ || o,
            b = o => {
                if (!g || u === -1) return;
                let c = a[u];
                if (c == null) return;
                let l = n[c].indexOf(u),
                    d = o === `up` ? -1 : 1;
                for (let o = c + d, f = 0; f < n.length; f += 1, o += d) {
                    if (o < 0 || o >= n.length) {
                        if (!r || v) return;
                        if (o = o < 0 ? n.length - 1 : 0, i) {
                            let e = Math.min(l, n[o].length - 1);
                            o = a[i(t, u, n[o][e] ? ? n[o][0])] ? ? o
                        }
                    }
                    let c = n[o];
                    for (let t = Math.min(l, c.length - 1); t >= 0; --t) {
                        let n = c[t];
                        if (!mr(e, n, s)) return n
                    }
                }
            },
            x = t => {
                if (!v || u === -1) return;
                let n = u % y,
                    i = t === `up` ? -y : y,
                    a = l - l % y,
                    o = Fn(l / y) + 1;
                for (let t = u - n + i, c = 0; c < o; c += 1, t += i) {
                    if (t < 0 || t > l) {
                        if (!r) return;
                        t = t < 0 ? a : 0
                    }
                    let i = Math.min(t + y - 1, l);
                    for (let r = Math.min(t + n, i); r >= t; --r)
                        if (!mr(e, r, s)) return r
                }
            };
        d && Tn(t);
        let S = b(p) ? ? x(p);
        if (S !== void 0) f = S;
        else if (u === -1) f = p === `up` ? l : c;
        else if (f = lr(e, {
                startingIndex: u,
                amount: y,
                decrement: p === `up`,
                disabledIndices: s
            }), r) {
            if (p === `up` && (u - y < c || f < 0)) {
                let e = u % y,
                    n = l % y,
                    r = l - (n - e);
                f = n === e ? l : n > e ? r : r - y, i && (f = i(t, u, f))
            }
            p === `down` && u + y > l && (f = lr(e, {
                startingIndex: u % y - y,
                amount: y,
                disabledIndices: s
            }), i && (f = i(t, u, f)))
        }
        or(e, f) && (f = u)
    }
    if (n === `both`) {
        let n = Fn(u / o);
        t.key === (a ? `ArrowLeft` : `ArrowRight`) && (d && Tn(t), u % o === o - 1 ? r && (f = lr(e, {
            startingIndex: u - u % o - 1,
            disabledIndices: s
        }), i && (f = i(t, u, f))) : (f = lr(e, {
            startingIndex: u,
            disabledIndices: s
        }), r && ar(f, o, n) && (f = lr(e, {
            startingIndex: u - u % o - 1,
            disabledIndices: s
        }), i && (f = i(t, u, f)))), ar(f, o, n) && (f = u)), t.key === (a ? `ArrowRight` : `ArrowLeft`) && (d && Tn(t), u % o === 0 ? r && (f = lr(e, {
            startingIndex: u + (o - u % o),
            decrement: !0,
            disabledIndices: s
        }), i && (f = i(t, u, f))) : (f = lr(e, {
            startingIndex: u,
            decrement: !0,
            disabledIndices: s
        }), r && ar(f, o, n) && (f = lr(e, {
            startingIndex: u + (o - u % o),
            decrement: !0,
            disabledIndices: s
        }), i && (f = i(t, u, f)))), ar(f, o, n) && (f = u));
        let c = Fn(l / o) === n;
        or(e, f) && (r && c ? (f = t.key === (a ? `ArrowRight` : `ArrowLeft`) ? l : lr(e, {
            startingIndex: u - u % o - 1,
            disabledIndices: s
        }), i && (f = i(t, u, f))) : f = u)
    }
    return f
}

function dr(e, t, n) {
    let r = [],
        i = 0;
    return e.forEach(({
        width: e,
        height: a
    }, o) => {
        let s = !1;
        for (n && (i = 0); !s;) {
            let n = [];
            for (let r = 0; r < e; r += 1)
                for (let e = 0; e < a; e += 1) n.push(i + r + e * t);
            i % t + e <= t && n.every(e => r[e] == null) ? (n.forEach(e => {
                r[e] = o
            }), s = !0) : i += 1
        }
    }), [...r]
}

function fr(e, t, n, r, i) {
    if (e === -1) return -1;
    let a = n.indexOf(e),
        o = t[e];
    switch (i) {
        case `tl`:
            return a;
        case `tr`:
            return o ? a + o.width - 1 : a;
        case `bl`:
            return o ? a + (o.height - 1) * r : a;
        case `br`:
            return n.lastIndexOf(e);
        default:
            return -1
    }
}

function pr(e, t) {
    return t.flatMap((t, n) => e.includes(t) ? [n] : [])
}

function mr(e, t, n) {
    if (typeof n == `function` ? n(t) : n ? .includes(t) ? ? !1) return !0;
    let r = e[t];
    return r ? gr(r) ? !n && (r.hasAttribute(`disabled`) || r.getAttribute(`aria-disabled`) === `true`) : !0 : !1
}

function hr(e) {
    return e.visibility === `hidden` || e.visibility === `collapse`
}

function gr(e, t = e ? J(e) : null) {
    return !e || !e.isConnected || !t || hr(t) ? !1 : typeof e.checkVisibility == `function` ? e.checkVisibility() : t.display !== `none` && t.display !== `contents`
}

function X(e) {
    return e ? .ownerDocument || document
}
var _r = `a[href],button,input,select,textarea,summary,details,iframe,object,embed,[tabindex],[contenteditable]:not([contenteditable="false"]),audio[controls],video[controls]`;

function vr(e) {
    let t = e.assignedSlot;
    if (t) return t;
    if (e.parentElement) return e.parentElement;
    let n = e.getRootNode();
    return kt(n) ? n.host : null
}

function yr(e) {
    for (let t of Array.from(e.children))
        if (W(t) === `summary`) return t;
    return null
}

function br(e, t) {
    let n = yr(t);
    return !!n && (e === n || Y(n, e))
}

function xr(e) {
    let t = e ? W(e) : ``;
    return e != null && e.matches(_r) && (t !== `summary` || e.parentElement != null && W(e.parentElement) === `details` && yr(e.parentElement) === e) && (t !== `details` || yr(e) == null) && (t !== `input` || e.type !== `hidden`)
}

function Sr(e) {
    if (!xr(e) || !e.isConnected || e.matches(`:disabled`)) return !1;
    for (let t = e; t; t = vr(t)) {
        let n = t !== e,
            r = W(t) === `slot`;
        if (t.hasAttribute(`inert`) || n && W(t) === `details` && !t.open && !br(e, t) || t.hasAttribute(`hidden`) || !r && !Cr(t, n)) return !1
    }
    return !0
}

function Cr(e, t) {
    let n = J(e);
    return t ? n.display !== `none` : gr(e, n)
}

function wr(e) {
    let t = e.tabIndex;
    if (t < 0) {
        let t = W(e);
        if (t === `details` || t === `audio` || t === `video` || q(e) && e.isContentEditable) return 0
    }
    return t
}

function Tr(e) {
    if (W(e) !== `input`) return null;
    let t = e;
    return t.type === `radio` && t.name !== `` ? t : null
}

function Er(e, t) {
    let n = Tr(e);
    if (!n) return !0;
    let r = t.find(e => {
        let t = Tr(e);
        return t ? .name === n.name && t.form === n.form && t.checked
    });
    return r ? r === n : t.find(e => {
        let t = Tr(e);
        return t ? .name === n.name && t.form === n.form
    }) === n
}

function Dr(e) {
    if (q(e) && W(e) === `slot`) {
        let t = e.assignedElements({
            flatten: !0
        });
        if (t.length > 0) return t
    }
    return q(e) && e.shadowRoot ? Array.from(e.shadowRoot.children) : Array.from(e.children)
}

function Or(e, t) {
    Dr(e).forEach(e => {
        xr(e) && t.push(e), Or(e, t)
    })
}

function kr(e, t, n) {
    Dr(e).forEach(e => {
        q(e) && e.matches(t) && n.push(e), kr(e, t, n)
    })
}

function Ar(e) {
    return Sr(e) && wr(e) >= 0
}

function jr(e) {
    let t = [];
    return Or(e, t), t.filter(Sr)
}

function Mr(e) {
    let t = jr(e);
    return t.filter(e => wr(e) >= 0 && Er(e, t))
}

function Nr(e, t) {
    let n = Mr(e),
        r = n.length;
    if (r === 0) return;
    let i = pn(X(e)),
        a = n.indexOf(i);
    return n[a === -1 ? t === 1 ? 0 : r - 1 : a + t]
}

function Pr(e) {
    return Nr(X(e).body, 1) || e
}

function Fr(e) {
    return Nr(X(e).body, -1) || e
}

function Ir(e, t) {
    if (!e) return null;
    let n = Mr(X(e).body),
        r = n.length;
    if (r === 0) return null;
    let i = n.indexOf(e);
    return i === -1 ? null : n[(i + t + r) % r]
}

function Lr(e) {
    return Ir(e, 1)
}

function Rr(e) {
    return Ir(e, -1)
}

function zr(e, t) {
    let n = t || e.currentTarget,
        r = e.relatedTarget;
    return !r || !Y(n, r)
}

function Br(e) {
    Mr(e).forEach(e => {
        e.dataset.tabindex = e.getAttribute(`tabindex`) || ``, e.setAttribute(`tabindex`, `-1`)
    })
}

function Vr(e) {
    let t = [];
    kr(e, `[data-tabindex]`, t), t.forEach(e => {
        let t = e.dataset.tabindex;
        delete e.dataset.tabindex, t ? e.setAttribute(`tabindex`, t) : e.removeAttribute(`tabindex`)
    })
}

function Z(e, t, n, r) {
    return e.addEventListener(t, n, r), () => {
        e.removeEventListener(t, n, r)
    }
}

function Hr(e) {
    let t = u(Ur, e).current;
    return t.next = e, H(t.effect), t
}

function Ur(e) {
    let t = {
        current: e,
        next: e,
        effect: () => {
            t.current = t.next
        }
    };
    return t
}

function Wr(e) {
    return e == null ? e : `current` in e ? e.current : e
}

function Gr(e, t = !1, n = !0) {
    let r = bt();
    return V((i, a = null) => {
        r.cancel();
        let o = Wr(e);
        if (o == null) return;
        let s = o,
            c = () => {
                le.flushSync(i)
            };
        if (typeof s.getAnimations != `function` || globalThis.BASE_UI_ANIMATIONS_DISABLED) {
            i();
            return
        }

        function l() {
            Promise.all(s.getAnimations().map(e => e.finished)).then(() => {
                a ? .aborted || c()
            }).catch(() => {
                if (n) {
                    a ? .aborted || c();
                    return
                }
                let e = s.getAnimations();
                !a ? .aborted && e.length > 0 && e.some(e => e.pending || e.playState !== `finished`) && l()
            })
        }
        if (t) {
            let e = St.startingStyle;
            if (!s.hasAttribute(e)) {
                r.request(l);
                return
            }
            let t = new MutationObserver(() => {
                s.hasAttribute(e) || (t.disconnect(), l())
            });
            t.observe(s, {
                attributes: !0,
                attributeFilter: [e]
            }), a ? .addEventListener(`abort`, () => t.disconnect(), {
                once: !0
            });
            return
        }
        r.request(l)
    })
}

function Kr(e) {
    let {
        enabled: t = !0,
        open: n,
        ref: r,
        onComplete: i
    } = e, a = V(i), o = Gr(r, n, !1);
    c.useEffect(() => {
        if (!t) return;
        let e = new AbortController;
        return o(a, e.signal), () => {
            e.abort()
        }
    }, [t, n, a, o])
}
var qr = {
        icons: {
            Activity: 57344,
            Add: 57345,
            AddCircle: 57346,
            Agent: 57347,
            Alarm: 57348,
            Android: 57349,
            Ant: 57350,
            Apple: 57351,
            Archive: 57352,
            ArrowDown: 57353,
            ArrowDownCircle: 57354,
            ArrowInSquare: 57355,
            ArrowLeft: 57356,
            ArrowLeftCircle: 57357,
            ArrowOutSquare: 57358,
            ArrowReturn: 57359,
            ArrowRight: 57360,
            ArrowRightCircle: 57361,
            ArrowSplitRight: 57362,
            ArrowUp: 57363,
            ArrowUpCircle: 57364,
            ArrowUpRight: 57365,
            ArrowsOut: 57366,
            Artifacts: 57367,
            Atom: 57368,
            Attachment: 57369,
            Batch: 57370,
            Beaker: 57371,
            Binoculars: 57372,
            Book: 57373,
            BookClosed: 57374,
            BookText: 57375,
            Box: 57376,
            BrowseSelect: 57377,
            Bullhorn: 57378,
            Cache: 57379,
            Calendar: 57380,
            Camera: 57381,
            Capacity: 57382,
            CaretDown: 57383,
            CaretDownUp: 57384,
            CaretLeft: 57385,
            CaretRight: 57386,
            CaretUp: 57387,
            CaretUpDown: 57388,
            ChangesPlusMinus: 57389,
            ChangesPlusMinusFilled: 57390,
            Chart: 57391,
            ChartLine: 57392,
            Chat: 57393,
            ChatAdd: 57394,
            ChatAddFilled: 57395,
            ChatDelete: 57396,
            ChatDeleteFilled: 57397,
            ChatFilled: 57398,
            ChatSimple: 57399,
            ChatSimpleFilled: 57400,
            Chats: 57401,
            ChatsFilled: 57402,
            Check: 57403,
            CheckCircle: 57404,
            CheckCircleFilled: 57405,
            CheckDouble: 57406,
            Checklist: 57407,
            ChecklistFilled: 57408,
            Clipboard: 57409,
            ClipboardArrow: 57410,
            Clock: 57411,
            Cloud: 57412,
            CloudFilled: 57413,
            CloudSlash: 57414,
            CloudSlashFilled: 57415,
            Code: 57416,
            CodeBlock: 57417,
            CodeBrackets: 57418,
            CodeFilled: 57419,
            CoffeeCup: 57420,
            Collapse: 57421,
            CommandCard: 57422,
            CommandLine: 57423,
            CommandLineFilled: 57424,
            CommandLinePrompt: 57425,
            Compact: 57426,
            Computer: 57427,
            Concierge: 57428,
            Connectors: 57429,
            Copy: 57430,
            Create: 57431,
            CreditCard: 57432,
            Cursor: 57433,
            CursorFilled: 57434,
            DNA: 57435,
            Database: 57436,
            Disconnect: 57437,
            Dispatch: 57438,
            DollarSign: 57439,
            DotsCircle: 57440,
            DotsHorizontal: 57441,
            DotsVertical: 57442,
            Download: 57443,
            Edit: 57444,
            Email: 57445,
            Evals: 57446,
            Expand: 57447,
            ExtendedThinking: 57448,
            Eye: 57449,
            EyeSlash: 57450,
            Fastforward: 57451,
            File: 57452,
            FileAdd: 57453,
            FileUpload: 57454,
            Files: 57455,
            Filter: 57456,
            Flag: 57457,
            Folder: 57458,
            FolderOpen: 57459,
            FolderPlus: 57460,
            Ghost: 57461,
            GhostFilled: 57462,
            Gift: 57463,
            GitBranch: 57464,
            GitCommit: 57465,
            GitDiff: 57466,
            GitFork: 57467,
            GitMerge: 57468,
            GitMergeConflict: 57469,
            GitMergedSimple: 57470,
            GitPullRequest: 57471,
            GitPullRequestClosed: 57472,
            GitPullRequestDraft: 57473,
            Globe: 57474,
            GraduationCap: 57475,
            Grid: 57476,
            Hand: 57477,
            HandHeart: 57478,
            Haptics: 57479,
            Help: 57480,
            History: 57481,
            Home: 57482,
            ID: 57483,
            Image: 57484,
            Indent: 57485,
            InfoSimple: 57486,
            Info: 57487,
            Interactive: 57488,
            Key: 57489,
            Keyboard: 57490,
            Laptop: 57491,
            LaptopFilled: 57492,
            LaptopSlash: 57493,
            Library: 57494,
            Lightbulb: 57495,
            Lightning: 57496,
            Link: 57497,
            LinkSimple: 57498,
            ListAdd: 57499,
            ListBullet: 57500,
            ListNumbered: 57501,
            Location: 57502,
            LocationQuestionMark: 57503,
            LocationSlash: 57504,
            Lock: 57505,
            LockOpen: 57506,
            LockShield: 57507,
            Logout: 57508,
            Mailbox: 57509,
            MapPin: 57510,
            Mcp: 57511,
            Memory: 57512,
            Mention: 57513,
            Menu: 57514,
            Microphone: 57515,
            MicrophoneFilled: 57516,
            MicrophoneSlash: 57517,
            Minus: 57518,
            MobilePhone: 57519,
            Moon: 57520,
            MoonFilled: 57521,
            MoonStars: 57522,
            Note: 57523,
            Notification: 57524,
            NotificationSlash: 57525,
            Organization: 57526,
            Owl: 57527,
            Palette: 57528,
            PaletteFilled: 57529,
            PaperPlane: 57530,
            Pause: 57531,
            Phone: 57532,
            Pin: 57533,
            PinFilled: 57534,
            PinSlash: 57535,
            Placeholder: 57536,
            Play: 57537,
            PlayCircle: 57538,
            PlayCircleFilled: 57539,
            PlayFilled: 57540,
            Plugin: 57541,
            Press: 57542,
            Pro: 57543,
            Prohibit: 57544,
            Projects: 57545,
            ProjectsFilled: 57546,
            ProjectsX: 57547,
            Prompt: 57548,
            Recording: 57549,
            Reload: 57550,
            Reorder: 57551,
            Research: 57552,
            Screenshare: 57553,
            Scroll: 57554,
            Search: 57555,
            SearchCircle: 57556,
            Select: 57557,
            Settings: 57558,
            Shapes: 57559,
            Share: 57560,
            ShareAndroid: 57561,
            ShareApple: 57562,
            ShieldSearch: 57563,
            Shuffle: 57564,
            Sidebar: 57565,
            SidebarClose: 57566,
            SidebarOpen: 57567,
            Signpost: 57568,
            SlashShortcutCommand: 57569,
            Slides: 57570,
            Sort: 57571,
            Speaker: 57572,
            Spinner: 57573,
            Spreadsheet: 57574,
            Star: 57575,
            StarFilled: 57576,
            StarSlash: 57577,
            Stop: 57578,
            StopCircle: 57579,
            StopFilled: 57580,
            Styles: 57581,
            Sun: 57582,
            SunFilled: 57583,
            SunHorizon: 57584,
            Tasks: 57585,
            Team: 57586,
            Temperature: 57587,
            TemperatureSimple: 57588,
            TextAa: 57589,
            TextBold: 57590,
            TextItalics: 57591,
            TextUnderline: 57592,
            ThumbsDown: 57593,
            ThumbsDownFilled: 57594,
            ThumbsUp: 57595,
            ThumbsUpFilled: 57596,
            Timer: 57597,
            Toggles: 57598,
            Token: 57599,
            Tool: 57600,
            Trash: 57601,
            Trust: 57602,
            Upload: 57603,
            User: 57604,
            UserCircle: 57605,
            Users: 57606,
            Verified: 57607,
            Voice: 57608,
            Warning: 57609,
            WarningCircle: 57610,
            WarningShield: 57611,
            Workspace: 57612,
            Wrench: 57613,
            WrenchFilled: 57614,
            X: 57615,
            XCircle: 57616,
            GitMergeQueue: 57617,
            Orbit: 57618,
            SidebarRight: 57619,
            Refresh: 57620,
            Bluetooth: 57621,
            BluetoothSlash: 57622
        },
        next: 57623,
        wght: {
            16: {
                lo: .8,
                hi: 1.25
            },
            20: {
                lo: 1.125,
                hi: 1.8
            }
        },
        anim: [`Artifacts`, `Chart`, `Chats`, `Code`, `Download`, `Lightbulb`, `Palette`, `Projects`, `Signpost`, `Tool`],
        animLoop: [`Code`],
        animDur: {
            Palette: 800
        },
        animEase: {
            Palette: `ease-out`
        }
    },
    Jr = {
        xs: {
            px: 12,
            master: `small`,
            stroke: {
                regular: .8
            }
        },
        sm: {
            px: 16,
            master: `small`,
            stroke: {
                regular: 1,
                strong: 1.25
            }
        },
        md: {
            px: 20,
            master: `base`,
            stroke: {
                regular: 1.2,
                strong: 1.5
            }
        },
        lg: {
            px: 24,
            master: `base`,
            stroke: {
                regular: 1.4
            }
        },
        xl: {
            px: 28,
            master: `base`,
            stroke: {
                regular: 1.6
            }
        },
        xxl: {
            px: 32,
            master: `base`,
            stroke: {
                regular: 1.8
            }
        }
    },
    Yr = [`xs`, `sm`, `md`, `lg`, `xl`, `xxl`];

function Xr(e, t) {
    if (e === `auto`) return t;
    if (e === `auto-sm` || e === `auto-lg`) {
        let n = Yr.indexOf(t) + (e === `auto-lg` ? 1 : -1);
        return Yr[Math.min(Math.max(n, 0), Yr.length - 1)]
    }
    return e
}

function Zr(e) {
    let t = Yr[0],
        n = 1 / 0;
    for (let r of Yr) {
        let i = Math.abs(Jr[r].px - e);
        i <= n && (n = i, t = r)
    }
    return t
}
var Qr = qr.icons,
    $r = new Set(qr.anim ? ? []),
    ei = new Set(qr.animLoop ? ? []),
    ti = qr.animDur ? ? {},
    ni = qr.animDurOut ? ? {},
    ri = qr.animEase ? ? {},
    ii = qr.wght,
    [ai, oi] = [400, 700];

function si(e, t, n) {
    let r = e * t / n,
        {
            lo: i,
            hi: a
        } = ii[`${t}`],
        o = (r - i) / (a - i),
        s = ai + (oi - ai) * o;
    return Math.round(Math.max(ai, Math.min(oi, s)) * 10) / 10
}
var ci = {
        flexShrink: 0
    },
    li = {
        fontFamily: `var(--font-anthropicons, Anthropicons-Variable)`,
        fontFeatureSettings: `"liga" 0`,
        fontOpticalSizing: `auto`,
        fontStyle: `normal`,
        fontVariationSettings: `normal`,
        lineHeight: 1,
        width: `1em`,
        height: `1em`,
        display: `flex`,
        alignItems: `center`,
        justifyContent: `center`,
        flexShrink: 0,
        userSelect: `none`
    };

function ui(e) {
    let t = De() === `comfortable` ? `md` : `sm`;
    if (e.customIcon) {
        let {
            customIcon: n,
            size: r = `md`,
            alt: i,
            className: a,
            style: o,
            name: s,
            icon: c,
            animated: l,
            ...u
        } = e, d = Jr[Xr(r, t)].px;
        return (0, B.jsx)(`svg`, {
            "data-cds": `Icon`,
            width: d,
            height: d,
            viewBox: `0 0 ${n.viewBox} ${n.viewBox}`,
            fill: `currentColor`,
            fillRule: `evenodd`,
            stroke: `none`,
            strokeLinecap: `round`,
            strokeLinejoin: `round`,
            xmlns: `http://www.w3.org/2000/svg`,
            style: o ? { ...ci,
                ...o
            } : ci,
            className: a,
            ...u,
            role: u.role ? ? (i ? `img` : void 0),
            "aria-hidden": u[`aria-hidden`] ? ? (i ? void 0 : !0),
            "aria-label": u[`aria-label`] ? ? (i || void 0),
            children: n.paths.map((e, t) => typeof e == `string` ? (0, B.jsx)(`path`, {
                d: e
            }, t) : (0, B.jsx)(`path`, {
                d: e.d,
                fill: `none`,
                stroke: `currentColor`,
                strokeWidth: e.strokeWidth,
                vectorEffect: `non-scaling-stroke`
            }, t))
        })
    }
    let {
        bold: n = !1,
        animated: r = !1,
        alt: i,
        className: a,
        style: o,
        name: s,
        icon: c,
        size: l,
        customSize: u,
        customIcon: d,
        ...f
    } = e, p = e.name ? ? e.icon.name, m, h;
    u === void 0 ? (h = Xr(l ? ? `md`, t), m = Jr[h].px) : (m = u, h = Zr(m));
    let g = Jr[h].stroke;
    n && `strong` in g;
    let _ = Qr[p],
        v = m <= 18 ? 16 : 20,
        y = si(n && `strong` in g ? g.strong : g.regular, v, m),
        b = r && $r.has(p),
        x = b ? ti[p] : void 0,
        S = b ? ni[p] : void 0,
        C = b ? ri[p] : void 0,
        w = b ? {
            fontSize: m,
            fontWeight: y,
            fontVariationSettings: void 0,
            "--cds-opsz": m,
            "--cds-wght": y,
            ...x !== void 0 && {
                "--cds-anim-dur": `${x}ms`
            },
            ...S !== void 0 && {
                "--cds-anim-dur-out": `${S}ms`
            },
            ...C !== void 0 && {
                "--cds-anim-ease": C
            }
        } : {
            fontSize: m,
            fontWeight: y
        };
    return (0, B.jsx)(`span`, {
        "data-cds": `Icon`,
        "data-cds-anim": b ? `` : void 0,
        "data-cds-anim-loop": b && ei.has(p) ? `` : void 0,
        style: { ...li,
            ...w,
            ...o
        },
        className: a,
        ...f,
        role: f.role ? ? (i ? `img` : void 0),
        "aria-hidden": f[`aria-hidden`] ? ? (i ? void 0 : !0),
        "aria-label": f[`aria-label`] ? ? (i || void 0),
        children: _ === void 0 ? null : String.fromCodePoint(_)
    })
}

function di(e) {
    var t, n, r = ``;
    if (typeof e == `string` || typeof e == `number`) r += e;
    else if (typeof e == `object`)
        if (Array.isArray(e))
            for (t = 0; t < e.length; t++) e[t] && (n = di(e[t])) && (r && (r += ` `), r += n);
        else
            for (t in e) e[t] && (r && (r += ` `), r += t);
    return r
}

function fi() {
    for (var e, t, n = 0, r = ``; n < arguments.length;)(e = arguments[n++]) && (t = di(e)) && (r && (r += ` `), r += t);
    return r
}
var pi = e => typeof e == `boolean` ? `${e}` : e === 0 ? `0` : e,
    mi = fi,
    hi = (e, t) => n => {
        if (t ? .variants == null) return mi(e, n ? .class, n ? .className);
        let {
            variants: r,
            defaultVariants: i
        } = t, a = Object.keys(r).map(e => {
            let t = n ? .[e],
                a = i ? .[e];
            if (t === null) return null;
            let o = pi(t) || pi(a);
            return r[e][o]
        }), o = n && Object.entries(n).reduce((e, t) => {
            let [n, r] = t;
            return r === void 0 || (e[n] = r), e
        }, {});
        return mi(e, a, t ? .compoundVariants ? .reduce((e, t) => {
            let {
                class: n,
                className: r,
                ...a
            } = t;
            return Object.entries(a).every(e => {
                let [t, n] = e;
                return Array.isArray(n) ? n.includes({ ...i,
                    ...o
                }[t]) : { ...i,
                    ...o
                }[t] === n
            }) ? [...e, n, r] : e
        }, []), n ? .class, n ? .className)
    },
    gi = [],
    _i = void 0;

function vi() {
    return _i
}

function yi(e) {
    gi.push(e)
}

function bi(e) {
    let t = (t, n) => {
        let r = u(Si).current,
            i;
        try {
            _i = r;
            for (let e of gi) e.before(r);
            i = e(t, n);
            for (let e of gi) e.after(r);
            r.didInitialize = !0
        } finally {
            _i = void 0
        }
        return i
    };
    return t.displayName = e.displayName || e.name, t
}

function xi(e) {
    return c.forwardRef(bi(e))
}

function Si() {
    return {
        didInitialize: !1
    }
}

function Ci(e) {
    let t = c.useRef(!0);
    t.current && (t.current = !1, e())
}
var wi = c.createContext(void 0);

function Ti(e) {
    let t = c.useContext(wi);
    if (t === void 0 && !e) throw Error(s(72));
    return t
}
var Ei = 0,
    Di = class e {
        static create() {
            return new e
        }
        currentId = Ei;
        start(e, t) {
            this.clear(), this.currentId = setTimeout(() => {
                this.currentId = Ei, t()
            }, e)
        }
        isStarted() {
            return this.currentId !== Ei
        }
        clear = () => {
            this.currentId !== Ei && (clearTimeout(this.currentId), this.currentId = Ei)
        };
        disposeEffect = () => this.clear
    };

function Oi() {
    let e = u(Di.create).current;
    return gt(e.disposeEffect), e
}

function ki(e, t) {
    return t != null && !kn(t) ? 0 : typeof e == `function` ? e() : e
}

function Ai(e, t, n) {
    let r = ki(e, n);
    return typeof r == `number` ? r : r ? .[t]
}

function ji(e) {
    return typeof e == `function` ? e() : e
}

function Mi(e, t) {
    return t || e === `click` || e === `mousedown`
}

function Ni(e) {
    return e ? .includes(`mouse`) && e !== `mousedown`
}
var Pi = c.createContext({
    hasProvider: !1,
    timeoutMs: 0,
    delayRef: {
        current: 0
    },
    initialDelayRef: {
        current: 0
    },
    timeout: new Di,
    currentIdRef: {
        current: null
    },
    currentContextRef: {
        current: null
    }
});

function Fi(e) {
    let {
        children: t,
        delay: n,
        timeoutMs: r = 0
    } = e, i = c.useRef(n), a = c.useRef(n), o = c.useRef(null), s = c.useRef(null), l = Oi();
    return (0, B.jsx)(Pi.Provider, {
        value: c.useMemo(() => ({
            hasProvider: !0,
            delayRef: i,
            initialDelayRef: a,
            currentIdRef: o,
            timeoutMs: r,
            currentContextRef: s,
            timeout: l
        }), [r, l]),
        children: t
    })
}

function Ii(e, t = {
    open: !1
}) {
    let {
        open: n
    } = t, r = `rootStore` in e ? e.rootStore : e, i = r.useState(`floatingId`), {
        currentIdRef: a,
        delayRef: o,
        timeoutMs: s,
        initialDelayRef: l,
        currentContextRef: u,
        hasProvider: d,
        timeout: f
    } = c.useContext(Pi), [p, m] = c.useState(!1);
    return H(() => {
        function e() {
            m(!1), u.current ? .setIsInstantPhase(!1), a.current = null, u.current = null, o.current = l.current
        }
        if (a.current && !n && a.current === i) {
            if (m(!1), s) {
                let t = i;
                return f.start(s, () => {
                    r.select(`open`) || a.current && a.current !== t || e()
                }), () => {
                    f.clear()
                }
            }
            e()
        }
    }, [n, i, a, o, s, l, u, f, r]), H(() => {
        if (!n) return;
        let e = u.current,
            t = a.current;
        f.clear(), u.current = {
            onOpenChange: r.setOpen,
            setIsInstantPhase: m
        }, a.current = i, o.current = {
            open: 0,
            close: Ai(l.current, `close`)
        }, t !== null && t !== i ? (m(!0), e ? .setIsInstantPhase(!0), e ? .onOpenChange(!1, U(He))) : (m(!1), e ? .setIsInstantPhase(!1))
    }, [n, i, r, a, o, l, u, f]), H(() => () => {
        u.current = null
    }, [u]), c.useMemo(() => ({
        hasProvider: d,
        delayRef: o,
        isInstantPhase: p
    }), [d, o, p])
}

function Li(...e) {
    return () => {
        for (let t = 0; t < e.length; t += 1) {
            let n = e[t];
            n && n()
        }
    }
}
var Ri = {
        clipPath: `inset(50%)`,
        overflow: `hidden`,
        whiteSpace: `nowrap`,
        border: 0,
        padding: 0,
        width: 1,
        height: 1,
        margin: -1
    },
    zi = { ...Ri,
        position: `fixed`,
        top: 0,
        left: 0
    },
    Bi = { ...Ri,
        position: `absolute`
    },
    Vi = c.forwardRef(function(e, t) {
        let [n, r] = c.useState();
        H(() => {
            $t && r(`button`)
        }, []);
        let i = {
            tabIndex: 0,
            role: n
        };
        return (0, B.jsx)(`span`, { ...e,
            ref: t,
            style: zi,
            "aria-hidden": n ? void 0 : !0,
            ...i,
            "data-base-ui-focus-guard": ``
        })
    });

function Hi(e) {
    return `data-base-ui-${e}`
}
var Ui = {
        style: {
            transition: `none`
        }
    },
    Wi = `data-base-ui-click-trigger`,
    Gi = {
        fallbackAxisSide: `none`
    },
    Ki = {
        fallbackAxisSide: `end`
    },
    qi = {
        clipPath: `inset(50%)`,
        position: `fixed`,
        top: 0,
        left: 0
    },
    Ji = c.createContext(null),
    Yi = () => c.useContext(Ji),
    Xi = Hi(`portal`);

function Zi(e = {}) {
    let {
        ref: t,
        container: n,
        componentProps: r = C,
        elementProps: i
    } = e, a = pt(), o = Yi() ? .portalNode, [s, l] = c.useState(null), [u, d] = c.useState(null), f = V(e => {
        e !== null && d(e)
    }), p = c.useRef(null);
    H(() => {
        if (n === null) {
            p.current && (p.current = null, d(null), l(null));
            return
        }
        if (a == null) return;
        let e = (n && (Ot(n) ? n : n.current)) ? ? o ? ? document.body;
        if (e == null) {
            p.current && (p.current = null, d(null), l(null));
            return
        }
        p.current !== e && (p.current = e, d(null), l(e))
    }, [n, o, a]);
    let m = re(`div`, r, {
        ref: [t, f],
        props: [{
            id: a,
            [Xi]: ``
        }, i]
    });
    return {
        portalNode: u,
        portalSubtree: s && m ? le.createPortal(m, s) : null
    }
}
var Qi = c.forwardRef(function(e, t) {
    let {
        render: n,
        className: r,
        style: i,
        children: a,
        container: o,
        renderGuards: s,
        ...l
    } = e, {
        portalNode: u,
        portalSubtree: d
    } = Zi({
        container: o,
        ref: t,
        componentProps: e,
        elementProps: l
    }), f = c.useRef(null), p = c.useRef(null), m = c.useRef(null), h = c.useRef(null), [g, _] = c.useState(null), v = c.useRef(!1), y = g ? .modal, b = g ? .open, x = typeof s == `boolean` ? s : !!g && !g.modal && g.open && !!u;
    c.useEffect(() => {
        if (!u || y) return;

        function e(e) {
            u && e.relatedTarget && zr(e) && (e.type === `focusin` ? v.current && = (Vr(u), !1) : (Br(u), v.current = !0))
        }
        return Li(Z(u, `focusin`, e, !0), Z(u, `focusout`, e, !0))
    }, [u, y]), c.useEffect(() => {
        !u || b !== !1 || (Vr(u), v.current = !1)
    }, [b, u]);
    let S = c.useMemo(() => ({
        beforeOutsideRef: f,
        afterOutsideRef: p,
        beforeInsideRef: m,
        afterInsideRef: h,
        portalNode: u,
        setFocusManagerState: _
    }), [u]);
    return (0, B.jsxs)(c.Fragment, {
        children: [d, (0, B.jsxs)(Ji.Provider, {
            value: S,
            children: [x && u && (0, B.jsx)(Vi, {
                "data-type": `outside`,
                ref: f,
                onFocus: e => {
                    zr(e, u) ? m.current ? .focus() : Fr(g ? g.domReference : null) ? .focus()
                }
            }), x && u && (0, B.jsx)(`span`, {
                "aria-owns": u.id,
                style: qi
            }), u && le.createPortal(a, u), x && u && (0, B.jsx)(Vi, {
                "data-type": `outside`,
                ref: p,
                onFocus: e => {
                    zr(e, u) ? h.current ? .focus() : (Pr(g ? g.domReference : null) ? .focus(), g ? .closeOnFocusOut && g ? .onOpenChange(!1, U(`focus-out`, e.nativeEvent)))
                }
            })]
        })]
    })
});

function $i() {
    let e = new Map;
    return {
        emit(t, n) {
            e.get(t) ? .forEach(e => e(n))
        },
        on(t, n) {
            e.has(t) || e.set(t, new Set), e.get(t).add(n)
        },
        off(t, n) {
            e.get(t) ? .delete(n)
        }
    }
}
var ea = class {
        nodesRef = {
            current: []
        };
        events = $i();
        addNode(e) {
            this.nodesRef.current.push(e)
        }
        removeNode(e) {
            let t = this.nodesRef.current.findIndex(t => t === e);
            t !== -1 && this.nodesRef.current.splice(t, 1)
        }
    },
    ta = c.createContext(null),
    na = c.createContext(null),
    ra = () => c.useContext(ta) ? .id || null,
    ia = e => {
        let t = c.useContext(na);
        return e ? ? t
    };

function aa(e) {
    let t = pt(),
        n = ia(e),
        r = ra();
    return H(() => {
        if (!t) return;
        let e = {
            id: t,
            parentId: r
        };
        return n ? .addNode(e), () => {
            n ? .removeNode(e)
        }
    }, [n, t, r]), t
}

function oa(e) {
    let {
        children: t,
        id: n
    } = e, r = ra();
    return (0, B.jsx)(ta.Provider, {
        value: c.useMemo(() => ({
            id: n,
            parentId: r
        }), [n, r]),
        children: t
    })
}

function sa(e) {
    let {
        children: t,
        externalTree: n
    } = e, r = u(() => n ? ? new ea).current;
    return (0, B.jsx)(na.Provider, {
        value: r,
        children: t
    })
}

function ca(e, t) {
    let n = null,
        r = null,
        i = !1;
    return {
        contextElement: e || void 0,
        getBoundingClientRect() {
            let a = e ? .getBoundingClientRect() || {
                    width: 0,
                    height: 0,
                    x: 0,
                    y: 0
                },
                o = t.axis === `x` || t.axis === `both`,
                s = t.axis === `y` || t.axis === `both`,
                c = [`mouseenter`, `mousemove`].includes(t.dataRef.current.openEvent ? .type || ``) && t.pointerType !== `touch`,
                l = a.width,
                u = a.height,
                d = a.x,
                f = a.y;
            return n == null && t.x && o && (n = a.x - t.x), r == null && t.y && s && (r = a.y - t.y), d -= n || 0, f -= r || 0, l = 0, u = 0, !i || c ? (l = t.axis === `y` ? a.width : 0, u = t.axis === `x` ? a.height : 0, d = o && t.x != null ? t.x : d, f = s && t.y != null ? t.y : f) : i && !c && (u = t.axis === `x` ? a.height : u, l = t.axis === `y` ? a.width : l), i = !0, {
                width: l,
                height: u,
                x: d,
                y: f,
                top: f,
                right: d + l,
                bottom: f + u,
                left: d
            }
        }
    }
}

function la(e) {
    return e != null && e.clientX != null
}

function ua(e, t = {}) {
    let {
        enabled: n = !0,
        axis: r = `both`
    } = t, i = `rootStore` in e ? e.rootStore : e, a = i.useState(`open`), o = i.useState(`floatingElement`), s = i.useState(`domReferenceElement`), l = i.context.dataRef, u = c.useRef(!1), d = c.useRef(null), [f, p] = c.useState(), [m, h] = c.useState([]), g = V(e => {
        i.set(`positionReference`, e)
    }), _ = V((e, t, n) => {
        u.current || l.current.openEvent && !la(l.current.openEvent) || i.set(`positionReference`, ca(n ? ? s, {
            x: e,
            y: t,
            axis: r,
            dataRef: l,
            pointerType: f
        }))
    }), v = V(e => {
        a ? d.current || (_(e.clientX, e.clientY, e.currentTarget), h([])) : _(e.clientX, e.clientY, e.currentTarget)
    }), y = kn(f) ? o : a;
    c.useEffect(() => {
        if (!n) {
            g(s);
            return
        }
        if (!y) return;

        function e() {
            d.current ? .(), d.current = null
        }
        let t = G(o);

        function r(t) {
            Y(o, mn(t)) ? e() : _(t.clientX, t.clientY)
        }
        return !l.current.openEvent || la(l.current.openEvent) ? d.current = Z(t, `mousemove`, r) : g(s), e
    }, [y, n, o, l, s, i, _, g, m]), c.useEffect(() => () => {
        i.set(`positionReference`, null)
    }, [i]), c.useEffect(() => {
        n && !o && (u.current = !1)
    }, [n, o]), c.useEffect(() => {
        !n && a && (u.current = !0)
    }, [n, a]);
    let b = c.useMemo(() => {
        function e(e) {
            p(e.pointerType)
        }
        return {
            onPointerDown: e,
            onPointerEnter: e,
            onMouseMove: v,
            onMouseEnter: v
        }
    }, [v]);
    return c.useMemo(() => n ? {
        reference: b,
        trigger: b
    } : {}, [n, b])
}
var da = {
    intentional: `onClick`,
    sloppy: `onPointerDown`
};

function fa() {
    return !1
}

function pa(e) {
    return {
        escapeKey: typeof e == `boolean` ? e : e ? .escapeKey ? ? !1,
        outsidePress: typeof e == `boolean` ? e : e ? .outsidePress ? ? !0
    }
}

function ma(e, t = {}) {
    let {
        enabled: n = !0,
        escapeKey: r = !0,
        outsidePress: i = !0,
        outsidePressEvent: a = `sloppy`,
        referencePress: o = fa,
        referencePressEvent: s = `sloppy`,
        bubbles: l,
        externalTree: u
    } = t, d = `rootStore` in e ? e.rootStore : e, f = d.useState(`open`), p = d.useState(`floatingElement`), {
        dataRef: m
    } = d.context, h = ia(u), g = V(typeof i == `function` ? i : () => !1), _ = typeof i == `function` ? g : i, v = _ !== !1, y = V(() => a), {
        escapeKey: b,
        outsidePress: x
    } = pa(l), S = c.useRef(!1), C = c.useRef(!1), w = c.useRef(!1), T = c.useRef(!1), E = c.useRef(``), D = c.useRef(null), O = Oi(), k = Oi(), A = V(() => {
        k.clear(), m.current.insideReactTree = !1
    }), j = V(e => {
        let t = m.current.floatingContext ? .nodeId;
        return (h ? Cn(h.nodesRef.current, t) : []).some(t => t.context ? .open && !t.context.dataRef.current[e])
    }), M = V(e => gn(e, d.select(`floatingElement`)) || gn(e, d.select(`domReferenceElement`))), N = V(e => {
        o() && d.setOpen(!1, U(Ue, e.nativeEvent))
    }), P = V(e => {
        if (!f || !n || !r || e.key !== `Escape` || T.current || !b && j(`__escapeKeyBubbles`)) return;
        let t = U(tt, En(e) ? e.nativeEvent : e);
        d.setOpen(!1, t), t.isCanceled || e.preventDefault(), !b && !t.isPropagationAllowed && e.stopPropagation()
    }), F = V(() => {
        m.current.insideReactTree = !0, k.start(0, A)
    }), I = V(e => {
        if (!f || !n || e.button !== 0) return;
        let t = mn(e.nativeEvent);
        Y(d.select(`floatingElement`), t) && (S.current || (S.current = !0, C.current = !1))
    }), L = V(e => {
        !f || !n || (e.defaultPrevented || e.nativeEvent.defaultPrevented) && S.current && (C.current = !0)
    });
    c.useEffect(() => {
        if (!f || !n) return;
        m.current.__escapeKeyBubbles = b, m.current.__outsidePressBubbles = x;
        let e = new Di,
            t = new Di;

        function i() {
            e.clear(), T.current = !0
        }

        function a() {
            e.start(zt() ? 5 : 0, () => {
                T.current = !1
            })
        }

        function o() {
            w.current = !0, t.start(0, () => {
                w.current = !1
            })
        }

        function s() {
            S.current = !1, C.current = !1
        }

        function c() {
            let e = E.current,
                t = e === `pen` || !e ? `mouse` : e,
                n = y(),
                r = typeof n == `function` ? n() : n;
            return typeof r == `string` ? r : r[t]
        }

        function l(e) {
            let t = c();
            return t === `intentional` && e.type !== `click` || t === `sloppy` && e.type === `click`
        }

        function u(e) {
            let t = m.current.floatingContext ? .nodeId,
                n = h && Cn(h.nodesRef.current, t).some(t => gn(e, t.context ? .elements.floating));
            return M(e) || n
        }

        function g(e) {
            if (l(e)) {
                e.type !== `click` && !M(e) && (t.clear(), w.current = !1), A();
                return
            }
            if (m.current.insideReactTree) {
                A();
                return
            }
            let n = mn(e),
                r = `[${Hi(`inert`)}]`,
                i = K(n) ? n.getRootNode() : null,
                a = Array.from((kt(i) ? i : X(d.select(`floatingElement`))).querySelectorAll(r)),
                o = d.context.triggerElements;
            if (n && (o.hasElement(n) || o.hasMatchingElement(e => Y(e, n)))) return;
            let s = K(n) ? n : null;
            for (; s && !Bt(s);) {
                let e = Ht(s);
                if (Bt(e) || !K(e)) break;
                s = e
            }
            if (!(a.length && K(n) && !_n(n) && !Y(n, d.select(`floatingElement`)) && a.every(e => !Y(s, e)))) {
                if (q(n) && !(`touches` in e)) {
                    let t = Bt(n),
                        r = J(n),
                        i = /auto|scroll/,
                        a = t || i.test(r.overflowX),
                        o = t || i.test(r.overflowY),
                        s = a && n.clientWidth > 0 && n.scrollWidth > n.clientWidth,
                        c = o && n.clientHeight > 0 && n.scrollHeight > n.clientHeight,
                        l = r.direction === `rtl`,
                        u = c && (l ? e.offsetX <= n.offsetWidth - n.clientWidth : e.offsetX > n.clientWidth),
                        d = s && e.offsetY > n.clientHeight;
                    if (u || d) return
                }
                if (!u(e)) {
                    if (c() === `intentional` && w.current) {
                        t.clear(), w.current = !1;
                        return
                    }
                    typeof _ == `function` && !_(e) || j(`__outsidePressBubbles`) || (d.setOpen(!1, U(Ke, e)), A())
                }
            }
        }

        function k(e) {
            c() !== `sloppy` || e.pointerType === `touch` || !d.select(`open`) || !n || M(e) || g(e)
        }

        function N(e) {
            if (c() !== `sloppy` || !d.select(`open`) || !n || M(e)) return;
            let t = e.touches[0];
            t && (D.current = {
                startTime: Date.now(),
                startX: t.clientX,
                startY: t.clientY,
                dismissOnTouchEnd: !1,
                dismissOnMouseDown: !0
            }, O.start(1e3, () => {
                D.current && (D.current.dismissOnTouchEnd = !1, D.current.dismissOnMouseDown = !1)
            }))
        }

        function F(e, t) {
            let n = mn(e);
            if (!n) return;
            let r = Z(n, e.type, () => {
                t(e), r()
            })
        }

        function I(e) {
            E.current = `touch`, F(e, N)
        }

        function L(e) {
            O.clear(), e.type === `pointerdown` && (E.current = e.pointerType), !(e.type === `mousedown` && D.current && !D.current.dismissOnMouseDown) && F(e, e => {
                e.type === `pointerdown` ? k(e) : g(e)
            })
        }

        function R(e) {
            if (!S.current) return;
            let n = C.current;
            if (s(), c() === `intentional`) {
                if (e.type === `pointercancel`) {
                    n && o();
                    return
                }
                if (!u(e)) {
                    if (n) {
                        o();
                        return
                    }
                    typeof _ == `function` && !_(e) || (t.clear(), w.current = !0, A())
                }
            }
        }

        function ee(e) {
            if (c() !== `sloppy` || !D.current || M(e)) return;
            let t = e.touches[0];
            if (!t) return;
            let n = Math.abs(t.clientX - D.current.startX),
                r = Math.abs(t.clientY - D.current.startY),
                i = Math.sqrt(n * n + r * r);
            i > 5 && (D.current.dismissOnTouchEnd = !0), i > 10 && (g(e), O.clear(), D.current = null)
        }

        function te(e) {
            F(e, ee)
        }

        function ne(e) {
            c() !== `sloppy` || !D.current || M(e) || (D.current.dismissOnTouchEnd && g(e), O.clear(), D.current = null)
        }

        function re(e) {
            F(e, ne)
        }
        let z = X(p),
            ie = Li(r && Li(Z(z, `keydown`, P), Z(z, `compositionstart`, i), Z(z, `compositionend`, a)), v && Li(Z(z, `click`, L, !0), Z(z, `pointerdown`, L, !0), Z(z, `pointerup`, R, !0), Z(z, `pointercancel`, R, !0), Z(z, `mousedown`, L, !0), Z(z, `mouseup`, R, !0), Z(z, `touchstart`, I, !0), Z(z, `touchmove`, te, !0), Z(z, `touchend`, re, !0)));
        return () => {
            ie(), e.clear(), t.clear(), s(), w.current = !1
        }
    }, [m, p, r, v, _, f, n, b, x, P, A, y, j, M, h, d, O]), c.useEffect(A, [_, A]);
    let R = c.useMemo(() => ({
            onKeyDown: P,
            [da[s]]: N,
            ...s !== `intentional` && {
                onClick: N
            }
        }), [P, N, s]),
        ee = c.useMemo(() => ({
            onKeyDown: P,
            onPointerDown: L,
            onMouseDown: L,
            onClickCapture: F,
            onMouseDownCapture(e) {
                F(), I(e)
            },
            onPointerDownCapture(e) {
                F(), I(e)
            },
            onMouseUpCapture: F,
            onTouchEndCapture: F,
            onTouchMoveCapture: F
        }), [P, F, I, L]);
    return c.useMemo(() => n ? {
        reference: R,
        floating: ee,
        trigger: R
    } : {}, [n, R, ee])
}

function ha(e, t, n) {
    let {
        reference: r,
        floating: i
    } = e, a = Wn(t), o = Gn(t), s = Un(o), c = Bn(t), l = a === `y`, u = r.x + r.width / 2 - i.width / 2, d = r.y + r.height / 2 - i.height / 2, f = r[s] / 2 - i[s] / 2, p;
    switch (c) {
        case `top`:
            p = {
                x: u,
                y: r.y - i.height
            };
            break;
        case `bottom`:
            p = {
                x: u,
                y: r.y + r.height
            };
            break;
        case `right`:
            p = {
                x: r.x + r.width,
                y: d
            };
            break;
        case `left`:
            p = {
                x: r.x - i.width,
                y: d
            };
            break;
        default:
            p = {
                x: r.x,
                y: r.y
            }
    }
    switch (Vn(t)) {
        case `start`:
            p[o] -= f * (n && l ? -1 : 1);
            break;
        case `end`:
            p[o] += f * (n && l ? -1 : 1);
            break
    }
    return p
}
async function ga(e, t) {
    t === void 0 && (t = {});
    let {
        x: n,
        y: r,
        platform: i,
        rects: a,
        elements: o,
        strategy: s
    } = e, {
        boundary: c = `clippingAncestors`,
        rootBoundary: l = `viewport`,
        elementContext: u = `floating`,
        altBoundary: d = !1,
        padding: f = 0
    } = zn(t, e), p = rr(f), m = o[d ? u === `floating` ? `reference` : `floating` : u], h = ir(await i.getClippingRect({
        element: await (i.isElement == null ? void 0 : i.isElement(m)) ? ? !0 ? m : m.contextElement || await (i.getDocumentElement == null ? void 0 : i.getDocumentElement(o.floating)),
        boundary: c,
        rootBoundary: l,
        strategy: s
    })), g = u === `floating` ? {
        x: n,
        y: r,
        width: a.floating.width,
        height: a.floating.height
    } : a.reference, _ = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(o.floating)), v = await (i.isElement == null ? void 0 : i.isElement(_)) && await (i.getScale == null ? void 0 : i.getScale(_)) || {
        x: 1,
        y: 1
    }, y = ir(i.convertOffsetParentRelativeRectToViewportRelativeRect ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
        elements: o,
        rect: g,
        offsetParent: _,
        strategy: s
    }) : g);
    return {
        top: (h.top - y.top + p.top) / v.y,
        bottom: (y.bottom - h.bottom + p.bottom) / v.y,
        left: (h.left - y.left + p.left) / v.x,
        right: (y.right - h.right + p.right) / v.x
    }
}
var _a = 50,
    va = async (e, t, n) => {
        let {
            placement: r = `bottom`,
            strategy: i = `absolute`,
            middleware: a = [],
            platform: o
        } = n, s = o.detectOverflow ? o : { ...o,
            detectOverflow: ga
        }, c = await (o.isRTL == null ? void 0 : o.isRTL(t)), l = await o.getElementRects({
            reference: e,
            floating: t,
            strategy: i
        }), {
            x: u,
            y: d
        } = ha(l, r, c), f = r, p = 0, m = {};
        for (let n = 0; n < a.length; n++) {
            let h = a[n];
            if (!h) continue;
            let {
                name: g,
                fn: _
            } = h, {
                x: v,
                y,
                data: b,
                reset: x
            } = await _({
                x: u,
                y: d,
                initialPlacement: r,
                placement: f,
                strategy: i,
                middlewareData: m,
                rects: l,
                platform: s,
                elements: {
                    reference: e,
                    floating: t
                }
            });
            u = v ? ? u, d = y ? ? d, m[g] = { ...m[g],
                ...b
            }, x && p < _a && (p++, typeof x == `object` && (x.placement && (f = x.placement), x.rects && (l = x.rects === !0 ? await o.getElementRects({
                reference: e,
                floating: t,
                strategy: i
            }) : x.rects), {
                x: u,
                y: d
            } = ha(l, f, c)), n = -1)
        }
        return {
            x: u,
            y: d,
            placement: f,
            strategy: i,
            middlewareData: m
        }
    },
    ya = function(e) {
        return e === void 0 && (e = {}), {
            name: `flip`,
            options: e,
            async fn(t) {
                var n;
                let {
                    placement: r,
                    middlewareData: i,
                    rects: a,
                    initialPlacement: o,
                    platform: s,
                    elements: c
                } = t, {
                    mainAxis: l = !0,
                    crossAxis: u = !0,
                    fallbackPlacements: d,
                    fallbackStrategy: f = `bestFit`,
                    fallbackAxisSideDirection: p = `none`,
                    flipAlignment: m = !0,
                    ...h
                } = zn(e, t);
                if ((n = i.arrow) != null && n.alignmentOffset) return {};
                let g = Bn(r),
                    _ = Wn(o),
                    v = Bn(o) === o,
                    y = await (s.isRTL == null ? void 0 : s.isRTL(c.floating)),
                    b = d || (v || !m ? [tr(o)] : qn(o)),
                    x = p !== `none`;
                !d && x && b.push(...er(o, m, p, y));
                let S = [o, ...b],
                    C = await s.detectOverflow(t, h),
                    w = [],
                    T = i.flip ? .overflows || [];
                if (l && w.push(C[g]), u) {
                    let e = Kn(r, a, y);
                    w.push(C[e[0]], C[e[1]])
                }
                if (T = [...T, {
                        placement: r,
                        overflows: w
                    }], !w.every(e => e <= 0)) {
                    let e = (i.flip ? .index || 0) + 1,
                        t = S[e];
                    if (t && (!(u === `alignment` && _ !== Wn(t)) || T.every(e => Wn(e.placement) === _ ? e.overflows[0] > 0 : !0))) return {
                        data: {
                            index: e,
                            overflows: T
                        },
                        reset: {
                            placement: t
                        }
                    };
                    let n = T.filter(e => e.overflows[0] <= 0).sort((e, t) => e.overflows[1] - t.overflows[1])[0] ? .placement;
                    if (!n) switch (f) {
                        case `bestFit`:
                            {
                                let e = T.filter(e => {
                                    if (x) {
                                        let t = Wn(e.placement);
                                        return t === _ || t === `y`
                                    }
                                    return !0
                                }).map(e => [e.placement, e.overflows.filter(e => e > 0).reduce((e, t) => e + t, 0)]).sort((e, t) => e[1] - t[1])[0] ? .[0];e && (n = e);
                                break
                            }
                        case `initialPlacement`:
                            n = o;
                            break
                    }
                    if (r !== n) return {
                        reset: {
                            placement: n
                        }
                    }
                }
                return {}
            }
        }
    };

function ba(e, t) {
    return {
        top: e.top - t.height,
        right: e.right - t.width,
        bottom: e.bottom - t.height,
        left: e.left - t.width
    }
}

function xa(e) {
    return jn.some(t => e[t] >= 0)
}
var Sa = function(e) {
        return e === void 0 && (e = {}), {
            name: `hide`,
            options: e,
            async fn(t) {
                let {
                    rects: n,
                    platform: r
                } = t, {
                    strategy: i = `referenceHidden`,
                    ...a
                } = zn(e, t);
                switch (i) {
                    case `referenceHidden`:
                        {
                            let e = ba(await r.detectOverflow(t, { ...a,
                                elementContext: `reference`
                            }), n.reference);
                            return {
                                data: {
                                    referenceHiddenOffsets: e,
                                    referenceHidden: xa(e)
                                }
                            }
                        }
                    case `escaped`:
                        {
                            let e = ba(await r.detectOverflow(t, { ...a,
                                altBoundary: !0
                            }), n.floating);
                            return {
                                data: {
                                    escapedOffsets: e,
                                    escaped: xa(e)
                                }
                            }
                        }
                    default:
                        return {}
                }
            }
        }
    },
    Ca = new Set([`left`, `top`]);
async function wa(e, t) {
    let {
        placement: n,
        platform: r,
        elements: i
    } = e, a = await (r.isRTL == null ? void 0 : r.isRTL(i.floating)), o = Bn(n), s = Vn(n), c = Wn(n) === `y`, l = Ca.has(o) ? -1 : 1, u = a && c ? -1 : 1, d = zn(t, e), {
        mainAxis: f,
        crossAxis: p,
        alignmentAxis: m
    } = typeof d == `number` ? {
        mainAxis: d,
        crossAxis: 0,
        alignmentAxis: null
    } : {
        mainAxis: d.mainAxis || 0,
        crossAxis: d.crossAxis || 0,
        alignmentAxis: d.alignmentAxis
    };
    return s && typeof m == `number` && (p = s === `end` ? m * -1 : m), c ? {
        x: p * u,
        y: f * l
    } : {
        x: f * l,
        y: p * u
    }
}
var Ta = function(e) {
        return e === void 0 && (e = 0), {
            name: `offset`,
            options: e,
            async fn(t) {
                var n;
                let {
                    x: r,
                    y: i,
                    placement: a,
                    middlewareData: o
                } = t, s = await wa(t, e);
                return a === o.offset ? .placement && (n = o.arrow) != null && n.alignmentOffset ? {} : {
                    x: r + s.x,
                    y: i + s.y,
                    data: { ...s,
                        placement: a
                    }
                }
            }
        }
    },
    Ea = function(e) {
        return e === void 0 && (e = {}), {
            name: `shift`,
            options: e,
            async fn(t) {
                let {
                    x: n,
                    y: r,
                    placement: i,
                    platform: a
                } = t, {
                    mainAxis: o = !0,
                    crossAxis: s = !1,
                    limiter: c = {
                        fn: e => {
                            let {
                                x: t,
                                y: n
                            } = e;
                            return {
                                x: t,
                                y: n
                            }
                        }
                    },
                    ...l
                } = zn(e, t), u = {
                    x: n,
                    y: r
                }, d = await a.detectOverflow(t, l), f = Wn(Bn(i)), p = Hn(f), m = u[p], h = u[f];
                if (o) {
                    let e = p === `y` ? `top` : `left`,
                        t = p === `y` ? `bottom` : `right`,
                        n = m + d[e],
                        r = m - d[t];
                    m = Rn(n, m, r)
                }
                if (s) {
                    let e = f === `y` ? `top` : `left`,
                        t = f === `y` ? `bottom` : `right`,
                        n = h + d[e],
                        r = h - d[t];
                    h = Rn(n, h, r)
                }
                let g = c.fn({ ...t,
                    [p]: m,
                    [f]: h
                });
                return { ...g,
                    data: {
                        x: g.x - n,
                        y: g.y - r,
                        enabled: {
                            [p]: o,
                            [f]: s
                        }
                    }
                }
            }
        }
    },
    Da = function(e) {
        return e === void 0 && (e = {}), {
            options: e,
            fn(t) {
                let {
                    x: n,
                    y: r,
                    placement: i,
                    rects: a,
                    middlewareData: o
                } = t, {
                    offset: s = 0,
                    mainAxis: c = !0,
                    crossAxis: l = !0
                } = zn(e, t), u = {
                    x: n,
                    y: r
                }, d = Wn(i), f = Hn(d), p = u[f], m = u[d], h = zn(s, t), g = typeof h == `number` ? {
                    mainAxis: h,
                    crossAxis: 0
                } : {
                    mainAxis: 0,
                    crossAxis: 0,
                    ...h
                };
                if (c) {
                    let e = f === `y` ? `height` : `width`,
                        t = a.reference[f] - a.floating[e] + g.mainAxis,
                        n = a.reference[f] + a.reference[e] - g.mainAxis;
                    p < t ? p = t : p > n && (p = n)
                }
                if (l) {
                    let e = f === `y` ? `width` : `height`,
                        t = Ca.has(Bn(i)),
                        n = a.reference[d] - a.floating[e] + (t && o.offset ? .[d] || 0) + (t ? 0 : g.crossAxis),
                        r = a.reference[d] + a.reference[e] + (t ? 0 : o.offset ? .[d] || 0) - (t ? g.crossAxis : 0);
                    m < n ? m = n : m > r && (m = r)
                }
                return {
                    [f]: p,
                    [d]: m
                }
            }
        }
    },
    Oa = function(e) {
        return e === void 0 && (e = {}), {
            name: `size`,
            options: e,
            async fn(t) {
                var n, r;
                let {
                    placement: i,
                    rects: a,
                    platform: o,
                    elements: s
                } = t, {
                    apply: c = () => {},
                    ...l
                } = zn(e, t), u = await o.detectOverflow(t, l), d = Bn(i), f = Vn(i), p = Wn(i) === `y`, {
                    width: m,
                    height: h
                } = a.floating, g, _;
                d === `top` || d === `bottom` ? (g = d, _ = f === (await (o.isRTL == null ? void 0 : o.isRTL(s.floating)) ? `start` : `end`) ? `left` : `right`) : (_ = d, g = f === `end` ? `top` : `bottom`);
                let v = h - u.top - u.bottom,
                    y = m - u.left - u.right,
                    b = Mn(h - u[g], v),
                    x = Mn(m - u[_], y),
                    S = !t.middlewareData.shift,
                    C = b,
                    w = x;
                if ((n = t.middlewareData.shift) != null && n.enabled.x && (w = y), (r = t.middlewareData.shift) != null && r.enabled.y && (C = v), S && !f) {
                    let e = Nn(u.left, 0),
                        t = Nn(u.right, 0),
                        n = Nn(u.top, 0),
                        r = Nn(u.bottom, 0);
                    p ? w = m - 2 * (e !== 0 || t !== 0 ? e + t : Nn(u.left, u.right)) : C = h - 2 * (n !== 0 || r !== 0 ? n + r : Nn(u.top, u.bottom))
                }
                await c({ ...t,
                    availableWidth: w,
                    availableHeight: C
                });
                let T = await o.getDimensions(s.floating);
                return m !== T.width || h !== T.height ? {
                    reset: {
                        rects: !0
                    }
                } : {}
            }
        }
    };

function ka(e) {
    let t = J(e),
        n = parseFloat(t.width) || 0,
        r = parseFloat(t.height) || 0,
        i = q(e),
        a = i ? e.offsetWidth : n,
        o = i ? e.offsetHeight : r,
        s = Pn(n) !== a || Pn(r) !== o;
    return s && (n = a, r = o), {
        width: n,
        height: r,
        $: s
    }
}

function Aa(e) {
    return K(e) ? e : e.contextElement
}

function ja(e) {
    let t = Aa(e);
    if (!q(t)) return In(1);
    let n = t.getBoundingClientRect(),
        {
            width: r,
            height: i,
            $: a
        } = ka(t),
        o = (a ? Pn(n.width) : n.width) / r,
        s = (a ? Pn(n.height) : n.height) / i;
    return (!o || !Number.isFinite(o)) && (o = 1), (!s || !Number.isFinite(s)) && (s = 1), {
        x: o,
        y: s
    }
}
var Ma = In(0);

function Na(e) {
    let t = G(e);
    return !zt() || !t.visualViewport ? Ma : {
        x: t.visualViewport.offsetLeft,
        y: t.visualViewport.offsetTop
    }
}

function Pa(e, t, n) {
    return t === void 0 && (t = !1), !n || t && n !== G(e) ? !1 : t
}

function Fa(e, t, n, r) {
    t === void 0 && (t = !1), n === void 0 && (n = !1);
    let i = e.getBoundingClientRect(),
        a = Aa(e),
        o = In(1);
    t && (r ? K(r) && (o = ja(r)) : o = ja(e));
    let s = Pa(a, n, r) ? Na(a) : In(0),
        c = (i.left + s.x) / o.x,
        l = (i.top + s.y) / o.y,
        u = i.width / o.x,
        d = i.height / o.y;
    if (a) {
        let e = G(a),
            t = r && K(r) ? G(r) : r,
            n = e,
            i = Gt(n);
        for (; i && r && t !== n;) {
            let e = ja(i),
                t = i.getBoundingClientRect(),
                r = J(i),
                a = t.left + (i.clientLeft + parseFloat(r.paddingLeft)) * e.x,
                o = t.top + (i.clientTop + parseFloat(r.paddingTop)) * e.y;
            c *= e.x, l *= e.y, u *= e.x, d *= e.y, c += a, l += o, n = G(i), i = Gt(n)
        }
    }
    return ir({
        width: u,
        height: d,
        x: c,
        y: l
    })
}

function Ia(e, t) {
    let n = Vt(e).scrollLeft;
    return t ? t.left + n : Fa(Dt(e)).left + n
}

function La(e, t) {
    let n = e.getBoundingClientRect();
    return {
        x: n.left + t.scrollLeft - Ia(e, n),
        y: n.top + t.scrollTop
    }
}

function Ra(e) {
    let {
        elements: t,
        rect: n,
        offsetParent: r,
        strategy: i
    } = e, a = i === `fixed`, o = Dt(r), s = t ? Mt(t.floating) : !1;
    if (r === o || s && a) return n;
    let c = {
            scrollLeft: 0,
            scrollTop: 0
        },
        l = In(1),
        u = In(0),
        d = q(r);
    if ((d || !d && !a) && ((W(r) !== `body` || At(o)) && (c = Vt(r)), d)) {
        let e = Fa(r);
        l = ja(r), u.x = e.x + r.clientLeft, u.y = e.y + r.clientTop
    }
    let f = o && !d && !a ? La(o, c) : In(0);
    return {
        width: n.width * l.x,
        height: n.height * l.y,
        x: n.x * l.x - c.scrollLeft * l.x + u.x + f.x,
        y: n.y * l.y - c.scrollTop * l.y + u.y + f.y
    }
}

function za(e) {
    return Array.from(e.getClientRects())
}

function Ba(e) {
    let t = Dt(e),
        n = Vt(e),
        r = e.ownerDocument.body,
        i = Nn(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth),
        a = Nn(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight),
        o = -n.scrollLeft + Ia(e),
        s = -n.scrollTop;
    return J(r).direction === `rtl` && (o += Nn(t.clientWidth, r.clientWidth) - i), {
        width: i,
        height: a,
        x: o,
        y: s
    }
}
var Va = 25;

function Ha(e, t) {
    let n = G(e),
        r = Dt(e),
        i = n.visualViewport,
        a = r.clientWidth,
        o = r.clientHeight,
        s = 0,
        c = 0;
    if (i) {
        a = i.width, o = i.height;
        let e = zt();
        (!e || e && t === `fixed`) && (s = i.offsetLeft, c = i.offsetTop)
    }
    let l = Ia(r);
    if (l <= 0) {
        let e = r.ownerDocument,
            t = e.body,
            n = getComputedStyle(t),
            i = e.compatMode === `CSS1Compat` && parseFloat(n.marginLeft) + parseFloat(n.marginRight) || 0,
            o = Math.abs(r.clientWidth - t.clientWidth - i);
        o <= Va && (a -= o)
    } else l <= Va && (a += l);
    return {
        width: a,
        height: o,
        x: s,
        y: c
    }
}

function Ua(e, t) {
    let n = Fa(e, !0, t === `fixed`),
        r = n.top + e.clientTop,
        i = n.left + e.clientLeft,
        a = q(e) ? ja(e) : In(1);
    return {
        width: e.clientWidth * a.x,
        height: e.clientHeight * a.y,
        x: i * a.x,
        y: r * a.y
    }
}

function Wa(e, t, n) {
    let r;
    if (t === `viewport`) r = Ha(e, n);
    else if (t === `document`) r = Ba(Dt(e));
    else if (K(t)) r = Ua(t, n);
    else {
        let n = Na(e);
        r = {
            x: t.x - n.x,
            y: t.y - n.y,
            width: t.width,
            height: t.height
        }
    }
    return ir(r)
}

function Ga(e, t) {
    let n = Ht(e);
    return n === t || !K(n) || Bt(n) ? !1 : J(n).position === `fixed` || Ga(n, t)
}

function Ka(e, t) {
    let n = t.get(e);
    if (n) return n;
    let r = Wt(e, [], !1).filter(e => K(e) && W(e) !== `body`),
        i = null,
        a = J(e).position === `fixed`,
        o = a ? Ht(e) : e;
    for (; K(o) && !Bt(o);) {
        let t = J(o),
            n = Lt(o);
        !n && t.position === `fixed` && (i = null), (a ? !n && !i : !n && t.position === `static` && i && (i.position === `absolute` || i.position === `fixed`) || At(o) && !n && Ga(e, o)) ? r = r.filter(e => e !== o) : i = t, o = Ht(o)
    }
    return t.set(e, r), r
}

function qa(e) {
    let {
        element: t,
        boundary: n,
        rootBoundary: r,
        strategy: i
    } = e, a = [...n === `clippingAncestors` ? Mt(t) ? [] : Ka(t, this._c) : [].concat(n), r], o = Wa(t, a[0], i), s = o.top, c = o.right, l = o.bottom, u = o.left;
    for (let e = 1; e < a.length; e++) {
        let n = Wa(t, a[e], i);
        s = Nn(n.top, s), c = Mn(n.right, c), l = Mn(n.bottom, l), u = Nn(n.left, u)
    }
    return {
        width: c - u,
        height: l - s,
        x: u,
        y: s
    }
}

function Ja(e) {
    let {
        width: t,
        height: n
    } = ka(e);
    return {
        width: t,
        height: n
    }
}

function Ya(e, t, n) {
    let r = q(t),
        i = Dt(t),
        a = n === `fixed`,
        o = Fa(e, !0, a, t),
        s = {
            scrollLeft: 0,
            scrollTop: 0
        },
        c = In(0);

    function l() {
        c.x = Ia(i)
    }
    if (r || !r && !a)
        if ((W(t) !== `body` || At(i)) && (s = Vt(t)), r) {
            let e = Fa(t, !0, a, t);
            c.x = e.x + t.clientLeft, c.y = e.y + t.clientTop
        } else i && l();
    a && !r && i && l();
    let u = i && !r && !a ? La(i, s) : In(0);
    return {
        x: o.left + s.scrollLeft - c.x - u.x,
        y: o.top + s.scrollTop - c.y - u.y,
        width: o.width,
        height: o.height
    }
}

function Xa(e) {
    return J(e).position === `static`
}

function Za(e, t) {
    if (!q(e) || J(e).position === `fixed`) return null;
    if (t) return t(e);
    let n = e.offsetParent;
    return Dt(e) === n && (n = n.ownerDocument.body), n
}

function Qa(e, t) {
    let n = G(e);
    if (Mt(e)) return n;
    if (!q(e)) {
        let t = Ht(e);
        for (; t && !Bt(t);) {
            if (K(t) && !Xa(t)) return t;
            t = Ht(t)
        }
        return n
    }
    let r = Za(e, t);
    for (; r && jt(r) && Xa(r);) r = Za(r, t);
    return r && Bt(r) && Xa(r) && !Lt(r) ? n : r || Rt(e) || n
}
var $a = async function(e) {
    let t = this.getOffsetParent || Qa,
        n = this.getDimensions,
        r = await n(e.floating);
    return {
        reference: Ya(e.reference, await t(e.floating), e.strategy),
        floating: {
            x: 0,
            y: 0,
            width: r.width,
            height: r.height
        }
    }
};

function eo(e) {
    return J(e).direction === `rtl`
}
var to = {
    convertOffsetParentRelativeRectToViewportRelativeRect: Ra,
    getDocumentElement: Dt,
    getClippingRect: qa,
    getOffsetParent: Qa,
    getElementRects: $a,
    getClientRects: za,
    getDimensions: Ja,
    getScale: ja,
    isElement: K,
    isRTL: eo
};

function no(e, t) {
    return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height
}

function ro(e, t) {
    let n = null,
        r, i = Dt(e);

    function a() {
        var e;
        clearTimeout(r), (e = n) == null || e.disconnect(), n = null
    }

    function o(s, c) {
        s === void 0 && (s = !1), c === void 0 && (c = 1), a();
        let l = e.getBoundingClientRect(),
            {
                left: u,
                top: d,
                width: f,
                height: p
            } = l;
        if (s || t(), !f || !p) return;
        let m = Fn(d),
            h = Fn(i.clientWidth - (u + f)),
            g = Fn(i.clientHeight - (d + p)),
            _ = Fn(u),
            v = {
                rootMargin: -m + `px ` + -h + `px ` + -g + `px ` + -_ + `px`,
                threshold: Nn(0, Mn(1, c)) || 1
            },
            y = !0;

        function b(t) {
            let n = t[0].intersectionRatio;
            if (n !== c) {
                if (!y) return o();
                n ? o(!1, n) : r = setTimeout(() => {
                    o(!1, 1e-7)
                }, 1e3)
            }
            n === 1 && !no(l, e.getBoundingClientRect()) && o(), y = !1
        }
        try {
            n = new IntersectionObserver(b, { ...v,
                root: i.ownerDocument
            })
        } catch {
            n = new IntersectionObserver(b, v)
        }
        n.observe(e)
    }
    return o(!0), a
}

function io(e, t, n, r) {
    r === void 0 && (r = {});
    let {
        ancestorScroll: i = !0,
        ancestorResize: a = !0,
        elementResize: o = typeof ResizeObserver == `function`,
        layoutShift: s = typeof IntersectionObserver == `function`,
        animationFrame: c = !1
    } = r, l = Aa(e), u = i || a ? [...l ? Wt(l) : [], ...t ? Wt(t) : []] : [];
    u.forEach(e => {
        i && e.addEventListener(`scroll`, n, {
            passive: !0
        }), a && e.addEventListener(`resize`, n)
    });
    let d = l && s ? ro(l, n) : null,
        f = -1,
        p = null;
    o && (p = new ResizeObserver(e => {
        let [r] = e;
        r && r.target === l && p && t && (p.unobserve(t), cancelAnimationFrame(f), f = requestAnimationFrame(() => {
            var e;
            (e = p) == null || e.observe(t)
        })), n()
    }), l && !c && p.observe(l), t && p.observe(t));
    let m, h = c ? Fa(e) : null;
    c && g();

    function g() {
        let t = Fa(e);
        h && !no(h, t) && n(), h = t, m = requestAnimationFrame(g)
    }
    return n(), () => {
        var e;
        u.forEach(e => {
            i && e.removeEventListener(`scroll`, n), a && e.removeEventListener(`resize`, n)
        }), d ? .(), (e = p) == null || e.disconnect(), p = null, c && cancelAnimationFrame(m)
    }
}
var ao = Ta,
    oo = Ea,
    so = ya,
    co = Oa,
    lo = Sa,
    uo = Da,
    fo = (e, t, n) => {
        let r = new Map,
            i = {
                platform: to,
                ...n
            },
            a = { ...i.platform,
                _c: r
            };
        return va(e, t, { ...i,
            platform: a
        })
    },
    po = typeof document < `u` ? c.useLayoutEffect : function() {};

function mo(e, t) {
    if (e === t) return !0;
    if (typeof e != typeof t) return !1;
    if (typeof e == `function` && e.toString() === t.toString()) return !0;
    let n, r, i;
    if (e && t && typeof e == `object`) {
        if (Array.isArray(e)) {
            if (n = e.length, n !== t.length) return !1;
            for (r = n; r-- !== 0;)
                if (!mo(e[r], t[r])) return !1;
            return !0
        }
        if (i = Object.keys(e), n = i.length, n !== Object.keys(t).length) return !1;
        for (r = n; r-- !== 0;)
            if (!{}.hasOwnProperty.call(t, i[r])) return !1;
        for (r = n; r-- !== 0;) {
            let n = i[r];
            if (!(n === `_owner` && e.$$typeof) && !mo(e[n], t[n])) return !1
        }
        return !0
    }
    return e !== e && t !== t
}

function ho(e) {
    return typeof window > `u` ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1
}

function go(e, t) {
    let n = ho(e);
    return Math.round(t * n) / n
}

function _o(e) {
    let t = c.useRef(e);
    return po(() => {
        t.current = e
    }), t
}

function vo(e) {
    e === void 0 && (e = {});
    let {
        placement: t = `bottom`,
        strategy: n = `absolute`,
        middleware: r = [],
        platform: i,
        elements: {
            reference: a,
            floating: o
        } = {},
        transform: s = !0,
        whileElementsMounted: l,
        open: u
    } = e, [d, f] = c.useState({
        x: 0,
        y: 0,
        strategy: n,
        placement: t,
        middlewareData: {},
        isPositioned: !1
    }), [p, m] = c.useState(r);
    mo(p, r) || m(r);
    let [h, g] = c.useState(null), [_, v] = c.useState(null), y = c.useCallback(e => {
        e !== C.current && (C.current = e, g(e))
    }, []), b = c.useCallback(e => {
        e !== w.current && (w.current = e, v(e))
    }, []), x = a || h, S = o || _, C = c.useRef(null), w = c.useRef(null), T = c.useRef(d), E = l != null, D = _o(l), O = _o(i), k = _o(u), A = c.useCallback(() => {
        if (!C.current || !w.current) return;
        let e = {
            placement: t,
            strategy: n,
            middleware: p
        };
        O.current && (e.platform = O.current), fo(C.current, w.current, e).then(e => {
            let t = { ...e,
                isPositioned: k.current !== !1
            };
            j.current && !mo(T.current, t) && (T.current = t, le.flushSync(() => {
                f(t)
            }))
        })
    }, [p, t, n, O, k]);
    po(() => {
        u === !1 && T.current.isPositioned && (T.current.isPositioned = !1, f(e => ({ ...e,
            isPositioned: !1
        })))
    }, [u]);
    let j = c.useRef(!1);
    po(() => (j.current = !0, () => {
        j.current = !1
    }), []), po(() => {
        if (x && (C.current = x), S && (w.current = S), x && S) {
            if (D.current) return D.current(x, S, A);
            A()
        }
    }, [x, S, A, D, E]);
    let M = c.useMemo(() => ({
            reference: C,
            floating: w,
            setReference: y,
            setFloating: b
        }), [y, b]),
        N = c.useMemo(() => ({
            reference: x,
            floating: S
        }), [x, S]),
        P = c.useMemo(() => {
            let e = {
                position: n,
                left: 0,
                top: 0
            };
            if (!N.floating) return e;
            let t = go(N.floating, d.x),
                r = go(N.floating, d.y);
            return s ? { ...e,
                transform: `translate(` + t + `px, ` + r + `px)`,
                ...ho(N.floating) >= 1.5 && {
                    willChange: `transform`
                }
            } : {
                position: n,
                left: t,
                top: r
            }
        }, [n, s, N.floating, d.x, d.y]);
    return c.useMemo(() => ({ ...d,
        update: A,
        refs: M,
        elements: N,
        floatingStyles: P
    }), [d, A, M, N, P])
}
var yo = (e, t) => {
        let n = ao(e);
        return {
            name: n.name,
            fn: n.fn,
            options: [e, t]
        }
    },
    bo = (e, t) => {
        let n = oo(e);
        return {
            name: n.name,
            fn: n.fn,
            options: [e, t]
        }
    },
    xo = (e, t) => ({
        fn: uo(e).fn,
        options: [e, t]
    }),
    So = (e, t) => {
        let n = so(e);
        return {
            name: n.name,
            fn: n.fn,
            options: [e, t]
        }
    },
    Co = (e, t) => {
        let n = co(e);
        return {
            name: n.name,
            fn: n.fn,
            options: [e, t]
        }
    },
    wo = (e, t) => {
        let n = lo(e);
        return {
            name: n.name,
            fn: n.fn,
            options: [e, t]
        }
    },
    Q = (e, t, n, r, i, a, ...o) => {
        if (o.length > 0) throw Error(s(1));
        let c;
        if (e && t && n && r && i && a) c = (o, s, c, l) => a(e(o, s, c, l), t(o, s, c, l), n(o, s, c, l), r(o, s, c, l), i(o, s, c, l), s, c, l);
        else if (e && t && n && r && i) c = (a, o, s, c) => i(e(a, o, s, c), t(a, o, s, c), n(a, o, s, c), r(a, o, s, c), o, s, c);
        else if (e && t && n && r) c = (i, a, o, s) => r(e(i, a, o, s), t(i, a, o, s), n(i, a, o, s), a, o, s);
        else if (e && t && n) c = (r, i, a, o) => n(e(r, i, a, o), t(r, i, a, o), i, a, o);
        else if (e && t) c = (n, r, i, a) => t(e(n, r, i, a), r, i, a);
        else if (e) c = e;
        else throw Error(`Missing arguments`);
        return c
    },
    To = t((e => {
        var t = n();

        function r(e, t) {
            return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t
        }
        var i = typeof Object.is == `function` ? Object.is : r,
            a = t.useState,
            o = t.useEffect,
            s = t.useLayoutEffect,
            c = t.useDebugValue;

        function l(e, t) {
            var n = t(),
                r = a({
                    inst: {
                        value: n,
                        getSnapshot: t
                    }
                }),
                i = r[0].inst,
                l = r[1];
            return s(function() {
                i.value = n, i.getSnapshot = t, u(i) && l({
                    inst: i
                })
            }, [e, n, t]), o(function() {
                return u(i) && l({
                    inst: i
                }), e(function() {
                    u(i) && l({
                        inst: i
                    })
                })
            }, [e]), c(n), n
        }

        function u(e) {
            var t = e.getSnapshot;
            e = e.value;
            try {
                var n = t();
                return !i(e, n)
            } catch {
                return !0
            }
        }

        function d(e, t) {
            return t()
        }
        var f = typeof window > `u` || window.document === void 0 || window.document.createElement === void 0 ? d : l;
        e.useSyncExternalStore = t.useSyncExternalStore === void 0 ? f : t.useSyncExternalStore
    })),
    Eo = t(((e, t) => {
        t.exports = To()
    })),
    Do = t((e => {
        var t = n(),
            r = Eo();

        function i(e, t) {
            return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t
        }
        var a = typeof Object.is == `function` ? Object.is : i,
            o = r.useSyncExternalStore,
            s = t.useRef,
            c = t.useEffect,
            l = t.useMemo,
            u = t.useDebugValue;
        e.useSyncExternalStoreWithSelector = function(e, t, n, r, i) {
            var d = s(null);
            if (d.current === null) {
                var f = {
                    hasValue: !1,
                    value: null
                };
                d.current = f
            } else f = d.current;
            d = l(function() {
                function e(e) {
                    if (!o) {
                        if (o = !0, s = e, e = r(e), i !== void 0 && f.hasValue) {
                            var t = f.value;
                            if (i(t, e)) return c = t
                        }
                        return c = e
                    }
                    if (t = c, a(s, e)) return t;
                    var n = r(e);
                    return i !== void 0 && i(t, n) ? (s = e, t) : (s = e, c = n)
                }
                var o = !1,
                    s, c, l = n === void 0 ? null : n;
                return [function() {
                    return e(t())
                }, l === null ? void 0 : function() {
                    return e(l())
                }]
            }, [t, n, r, i]);
            var p = o(e, d[0], d[1]);
            return c(function() {
                f.hasValue = !0, f.value = p
            }, [p]), u(p), p
        }
    })),
    Oo = t(((e, t) => {
        t.exports = Do()
    })),
    ko = Eo(),
    Ao = Oo(),
    jo = v(19) ? Po : Fo;

function Mo(e, t, n, r, i) {
    return jo(e, t, n, r, i)
}

function No(e, t, n, r, i) {
    let a = c.useCallback(() => t(e.getSnapshot(), n, r, i), [e, t, n, r, i]);
    return (0, ko.useSyncExternalStore)(e.subscribe, a, a)
}
yi({
    before(e) {
        e.syncIndex = 0, e.didInitialize || (e.syncTick = 1, e.syncHooks = [], e.didChangeStore = !0, e.getSnapshot = () => {
            let t = !1;
            for (let n = 0; n < e.syncHooks.length; n += 1) {
                let r = e.syncHooks[n],
                    i = r.selector(r.store.state, r.a1, r.a2, r.a3);
                (r.didChange || !Object.is(r.value, i)) && (t = !0, r.value = i, r.didChange = !1)
            }
            return t && (e.syncTick += 1), e.syncTick
        })
    },
    after(e) {
        e.syncHooks.length > 0 && (e.didChangeStore && (e.didChangeStore = !1, e.subscribe = t => {
            let n = new Set;
            for (let t of e.syncHooks) n.add(t.store);
            let r = [];
            for (let e of n) r.push(e.subscribe(t));
            return () => {
                for (let e of r) e()
            }
        }), (0, ko.useSyncExternalStore)(e.subscribe, e.getSnapshot, e.getSnapshot))
    }
});

function Po(e, t, n, r, i) {
    let a = vi();
    if (!a) return No(e, t, n, r, i);
    let o = a.syncIndex;
    a.syncIndex += 1;
    let s;
    return a.didInitialize ? (s = a.syncHooks[o], (s.store !== e || s.selector !== t || !Object.is(s.a1, n) || !Object.is(s.a2, r) || !Object.is(s.a3, i)) && (s.store !== e && (a.didChangeStore = !0), s.store = e, s.selector = t, s.a1 = n, s.a2 = r, s.a3 = i, s.didChange = !0)) : (s = {
        store: e,
        selector: t,
        a1: n,
        a2: r,
        a3: i,
        value: t(e.getSnapshot(), n, r, i),
        didChange: !1
    }, a.syncHooks.push(s)), s.value
}

function Fo(e, t, n, r, i) {
    return (0, Ao.useSyncExternalStoreWithSelector)(e.subscribe, e.getSnapshot, e.getSnapshot, e => t(e, n, r, i))
}
var Io = class {
        constructor(e) {
            this.state = e, this.listeners = new Set, this.updateTick = 0
        }
        subscribe = e => (this.listeners.add(e), () => {
            this.listeners.delete(e)
        });
        getSnapshot = () => this.state;
        setState(e) {
            if (this.state === e) return;
            this.state = e, this.updateTick += 1;
            let t = this.updateTick;
            for (let n of this.listeners) {
                if (t !== this.updateTick) return;
                n(e)
            }
        }
        update(e) {
            for (let t in e)
                if (!Object.is(this.state[t], e[t])) {
                    this.setState({ ...this.state,
                        ...e
                    });
                    return
                }
        }
        set(e, t) {
            Object.is(this.state[e], t) || this.setState({ ...this.state,
                [e]: t
            })
        }
        notifyAll() {
            let e = { ...this.state
            };
            this.setState(e)
        }
        use(e, t, n, r) {
            return Mo(this, e, t, n, r)
        }
    },
    Lo = class extends Io {
        constructor(e, t = {}, n) {
            super(e), this.context = t, this.selectors = n
        }
        useSyncedValue(e, t) {
            c.useDebugValue(e);
            let n = this;
            H(() => {
                n.state[e] !== t && n.set(e, t)
            }, [n, e, t])
        }
        useSyncedValueWithCleanup(e, t) {
            let n = this;
            H(() => (n.state[e] !== t && n.set(e, t), () => {
                n.set(e, void 0)
            }), [n, e, t])
        }
        useSyncedValues(e) {
            let t = this;
            H(() => {
                t.update(e)
            }, [t, ...Object.values(e)])
        }
        useControlledProp(e, t) {
            c.useDebugValue(e);
            let n = this,
                r = t !== void 0;
            H(() => {
                r && !Object.is(n.state[e], t) && n.setState({ ...n.state,
                    [e]: t
                })
            }, [n, e, t, r])
        }
        select(e, t, n, r) {
            let i = this.selectors[e];
            return i(this.state, t, n, r)
        }
        useState(e, t, n, r) {
            return c.useDebugValue(e), Mo(this, this.selectors[e], t, n, r)
        }
        useContextCallback(e, t) {
            c.useDebugValue(e);
            let n = V(t ? ? x);
            this.context[e] = n
        }
        useStateSetter(e) {
            let t = c.useRef(void 0);
            return t.current === void 0 && (t.current = t => {
                this.set(e, t)
            }), t.current
        }
        observe(e, t) {
            let n;
            n = typeof e == `function` ? e : this.selectors[e];
            let r = n(this.state);
            return t(r, r, this), this.subscribe(e => {
                let i = n(e);
                if (!Object.is(r, i)) {
                    let e = r;
                    r = i, t(i, e, this)
                }
            })
        }
    },
    Ro = {
        open: Q(e => e.open),
        transitionStatus: Q(e => e.transitionStatus),
        domReferenceElement: Q(e => e.domReferenceElement),
        referenceElement: Q(e => e.positionReference ? ? e.referenceElement),
        floatingElement: Q(e => e.floatingElement),
        floatingId: Q(e => e.floatingId)
    },
    zo = class extends Lo {
        constructor(e) {
            let {
                syncOnly: t,
                nested: n,
                onOpenChange: r,
                triggerElements: i,
                ...a
            } = e;
            super({ ...a,
                positionReference: a.referenceElement,
                domReferenceElement: a.referenceElement
            }, {
                onOpenChange: r,
                dataRef: {
                    current: {}
                },
                events: $i(),
                nested: n,
                triggerElements: i
            }, Ro), this.syncOnly = t
        }
        syncOpenEvent = (e, t) => {
            (!e || !this.state.open || t != null && An(t)) && (this.context.dataRef.current.openEvent = e ? t : void 0)
        };
        dispatchOpenChange = (e, t) => {
            this.syncOpenEvent(e, t.event);
            let n = {
                open: e,
                reason: t.reason,
                nativeEvent: t.event,
                nested: this.context.nested,
                triggerElement: t.trigger
            };
            this.context.events.emit(`openchange`, n)
        };
        setOpen = (e, t) => {
            if (this.syncOnly) {
                this.context.onOpenChange ? .(e, t);
                return
            }
            this.dispatchOpenChange(e, t), this.context.onOpenChange ? .(e, t)
        }
    };

function Bo(e) {
    let {
        popupStore: t,
        treatPopupAsFloatingElement: n = !1,
        floatingRootContext: r,
        floatingId: i,
        nested: a,
        onOpenChange: o
    } = e, s = t.useState(`open`), l = t.useState(`activeTriggerElement`), u = t.useState(n ? `popupElement` : `positionerElement`), d = t.context.triggerElements, f = o, p = c.useRef(null);
    r === void 0 && p.current === null && (p.current = new zo({
        open: s,
        transitionStatus: void 0,
        referenceElement: l,
        floatingElement: u,
        triggerElements: d,
        onOpenChange: f,
        floatingId: i,
        syncOnly: !0,
        nested: a
    }));
    let m = r ? ? p.current;
    return t.useSyncedValue(`floatingId`, i), H(() => {
        let e = {
            open: s,
            floatingId: i,
            referenceElement: l,
            floatingElement: u
        };
        K(l) && (e.domReferenceElement = l), m.state.positionReference === m.state.referenceElement && (e.positionReference = l), m.update(e)
    }, [s, i, l, u, m]), m.context.onOpenChange = f, m.context.nested = a, m
}
var Vo = {
    tabIndex: -1,
    [sn]: ``
};

function Ho(e, t, n = !1) {
    let r = pt(),
        i = ra() != null,
        a = c.useRef(null);
    e === void 0 && a.current === null && (a.current = t(r, i));
    let o = e ? ? a.current;
    return Bo({
        popupStore: o,
        treatPopupAsFloatingElement: n,
        floatingRootContext: o.state.floatingRootContext,
        floatingId: r,
        nested: i,
        onOpenChange: o.setOpen
    }), {
        store: o,
        internalStore: a.current
    }
}

function Uo(e, t) {
    let n = c.useRef(null),
        r = c.useRef(null);
    return c.useCallback(i => {
        if (e === void 0) return;
        let a = !1;
        if (n.current !== null) {
            let e = n.current,
                i = r.current,
                o = t.context.triggerElements.getById(e);
            i && o === i && (t.context.triggerElements.delete(e), a = !0), n.current = null, r.current = null
        }
        if (i !== null && (n.current = e, r.current = i, t.context.triggerElements.add(e, i), a = !0), a) {
            let e = t.context.triggerElements.size;
            t.select(`open`) && t.state.triggerCount !== e && t.set(`triggerCount`, e)
        }
    }, [t, e])
}

function Wo(e, t, n) {
    let r = n ? .id ? ? null;
    (r || t) && (e.activeTriggerId = r, e.activeTriggerElement = n ? ? null)
}

function Go(e, t, n, r) {
    let i = n.useState(`isMountedByTrigger`, e),
        a = Uo(e, n),
        o = V(t => {
            if (a(t), !t) return;
            let i = n.select(`open`),
                o = n.select(`activeTriggerId`);
            if (o === e) {
                n.update({
                    activeTriggerElement: t,
                    ...i ? r : null
                });
                return
            }
            o == null && i && n.update({
                activeTriggerId: e,
                activeTriggerElement: t,
                ...r
            })
        });
    return H(() => {
        i && n.update({
            activeTriggerElement: t.current,
            ...r
        })
    }, [i, n, t, ...Object.values(r)]), {
        registerTrigger: o,
        isMountedByThisTrigger: i
    }
}

function Ko(e) {
    let t = e.useState(`open`);
    H(() => {
        if (!t) {
            e.state.triggerCount !== 0 && e.set(`triggerCount`, 0);
            return
        }
        let n = e.context.triggerElements.size,
            r = {};
        if (e.state.triggerCount !== n && (r.triggerCount = n), !e.select(`activeTriggerId`) && n === 1) {
            let t = e.context.triggerElements.entries().next();
            if (!t.done) {
                let [e, n] = t.value;
                r.activeTriggerId = e, r.activeTriggerElement = n
            }
        }(r.triggerCount !== void 0 || r.activeTriggerId !== void 0) && e.update(r)
    }, [t, e, e.useState(`triggerCount`)])
}

function qo(e, t, n) {
    let {
        mounted: r,
        setMounted: i,
        transitionStatus: a
    } = xt(e);
    t.useSyncedValues({
        mounted: r,
        transitionStatus: a
    });
    let o = V(() => {
            i(!1), t.update({
                activeTriggerId: null,
                activeTriggerElement: null,
                mounted: !1,
                preventUnmountingOnClose: !1
            }), n ? .(), t.context.onOpenChangeComplete ? .(!1)
        }),
        s = t.useState(`preventUnmountingOnClose`);
    return Kr({
        enabled: r && !e && !s,
        open: e,
        ref: t.context.popupRef,
        onComplete() {
            e || o()
        }
    }), {
        forceUnmount: o,
        transitionStatus: a
    }
}

function Jo(e, t) {
    e.useSyncedValues(t), H(() => () => {
        e.update({
            activeTriggerProps: C,
            inactiveTriggerProps: C,
            popupProps: C
        })
    }, [e])
}

function Yo(e, t) {
    H(() => {
        !t && e.state.openMethod !== null && e.set(`openMethod`, null)
    }, [t, e]), H(() => () => {
        e.state.openMethod !== null && e.set(`openMethod`, null)
    }, [e])
}
var Xo = class {
    constructor() {
        this.elementsSet = new Set, this.idMap = new Map
    }
    add(e, t) {
        let n = this.idMap.get(e);
        n !== t && (n !== void 0 && this.elementsSet.delete(n), this.elementsSet.add(t), this.idMap.set(e, t))
    }
    delete(e) {
        let t = this.idMap.get(e);
        t && (this.elementsSet.delete(t), this.idMap.delete(e))
    }
    hasElement(e) {
        return this.elementsSet.has(e)
    }
    hasMatchingElement(e) {
        for (let t of this.elementsSet)
            if (e(t)) return !0;
        return !1
    }
    getById(e) {
        return this.idMap.get(e)
    }
    entries() {
        return this.idMap.entries()
    }
    elements() {
        return this.elementsSet.values()
    }
    get size() {
        return this.idMap.size
    }
};

function Zo() {
    return new zo({
        open: !1,
        transitionStatus: void 0,
        floatingElement: null,
        referenceElement: null,
        triggerElements: new Xo,
        floatingId: void 0,
        syncOnly: !1,
        nested: !1,
        onOpenChange: void 0
    })
}

function Qo() {
    return {
        open: !1,
        openProp: void 0,
        mounted: !1,
        transitionStatus: void 0,
        floatingRootContext: Zo(),
        floatingId: void 0,
        triggerCount: 0,
        preventUnmountingOnClose: !1,
        payload: void 0,
        activeTriggerId: null,
        activeTriggerElement: null,
        triggerIdProp: void 0,
        popupElement: null,
        positionerElement: null,
        activeTriggerProps: C,
        inactiveTriggerProps: C,
        popupProps: C
    }
}

function $o(e, t, n = !1) {
    return new zo({
        open: !1,
        transitionStatus: void 0,
        floatingElement: null,
        referenceElement: null,
        triggerElements: e,
        floatingId: t,
        syncOnly: !0,
        nested: n,
        onOpenChange: void 0
    })
}
var es = Q(e => e.triggerIdProp ? ? e.activeTriggerId),
    ts = Q(e => e.openProp ? ? e.open),
    ns = Q(e => (e.popupElement ? .id ? ? e.floatingId) || void 0);

function rs(e, t) {
    return t !== void 0 && ts(e) && es(e) === t
}

function is(e, t) {
    return rs(e, t) ? !0 : t !== void 0 && ts(e) && es(e) == null && e.triggerCount === 1
}
var as = {
    open: ts,
    mounted: Q(e => e.mounted),
    transitionStatus: Q(e => e.transitionStatus),
    floatingRootContext: Q(e => e.floatingRootContext),
    triggerCount: Q(e => e.triggerCount),
    preventUnmountingOnClose: Q(e => e.preventUnmountingOnClose),
    payload: Q(e => e.payload),
    activeTriggerId: es,
    activeTriggerElement: Q(e => e.mounted ? e.activeTriggerElement : null),
    popupId: ns,
    isTriggerActive: Q((e, t) => t !== void 0 && es(e) === t),
    isOpenedByTrigger: Q((e, t) => rs(e, t)),
    isMountedByTrigger: Q((e, t) => t !== void 0 && es(e) === t && e.mounted),
    triggerProps: Q((e, t) => t ? e.activeTriggerProps : e.inactiveTriggerProps),
    triggerPopupId: Q((e, t) => is(e, t) ? ns(e) : void 0),
    popupProps: Q(e => e.popupProps),
    popupElement: Q(e => e.popupElement),
    positionerElement: Q(e => e.positionerElement)
};

function os(e) {
    let {
        open: t = !1,
        onOpenChange: n,
        elements: r = {}
    } = e, i = pt(), a = ra() != null, o = u(() => new zo({
        open: t,
        transitionStatus: void 0,
        onOpenChange: n,
        referenceElement: r.reference ? ? null,
        floatingElement: r.floating ? ? null,
        triggerElements: new Xo,
        floatingId: i,
        syncOnly: !1,
        nested: a
    })).current;
    return H(() => {
        let e = {
            open: t,
            floatingId: i
        };
        r.reference !== void 0 && (e.referenceElement = r.reference, e.domReferenceElement = K(r.reference) ? r.reference : null), r.floating !== void 0 && (e.floatingElement = r.floating), o.update(e)
    }, [t, i, r.reference, r.floating, o]), o.context.onOpenChange = n, o.context.nested = a, o
}

function ss(e = {}) {
    let {
        nodeId: t,
        externalTree: n
    } = e, r = os(e), i = e.rootContext || r, a = i.useState(`referenceElement`), o = i.useState(`floatingElement`), s = i.useState(`domReferenceElement`), l = i.useState(`open`), u = i.useState(`floatingId`), [d, f] = c.useState(null), [p, m] = c.useState(void 0), [h, g] = c.useState(void 0), _ = c.useRef(null), v = ia(n), y = c.useMemo(() => ({
        reference: a,
        floating: o,
        domReference: s
    }), [a, o, s]), b = vo({ ...e,
        elements: { ...y,
            ...d && {
                reference: d
            }
        }
    }), x = K(p) ? p : null, S = h === void 0 ? i.state.floatingElement : h;
    i.useSyncedValue(`referenceElement`, p ? ? null), i.useSyncedValue(`domReferenceElement`, p === void 0 ? s : x), i.useSyncedValue(`floatingElement`, S);
    let C = c.useCallback(e => {
            let t = K(e) ? {
                getBoundingClientRect: () => e.getBoundingClientRect(),
                getClientRects: () => e.getClientRects(),
                contextElement: e
            } : e;
            f(t), b.refs.setReference(t)
        }, [b.refs]),
        w = c.useCallback(e => {
            (K(e) || e === null) && (_.current = e, m(e)), (K(b.refs.reference.current) || b.refs.reference.current === null || e !== null && !K(e)) && b.refs.setReference(e)
        }, [b.refs, m]),
        T = c.useCallback(e => {
            g(e), b.refs.setFloating(e)
        }, [b.refs]),
        E = c.useMemo(() => ({ ...b.refs,
            setReference: w,
            setFloating: T,
            setPositionReference: C,
            domReference: _
        }), [b.refs, w, T, C]),
        D = c.useMemo(() => ({ ...b.elements,
            domReference: s
        }), [b.elements, s]),
        O = c.useMemo(() => ({ ...b,
            dataRef: i.context.dataRef,
            open: l,
            onOpenChange: i.setOpen,
            events: i.context.events,
            floatingId: u,
            refs: E,
            elements: D,
            nodeId: t,
            rootStore: i
        }), [b, E, D, t, i, l, u]);
    return H(() => {
        s && (_.current = s)
    }, [s]), H(() => {
        i.context.dataRef.current.floatingContext = O;
        let e = v ? .nodesRef.current.find(e => e.id === t);
        e && (e.context = O)
    }), c.useMemo(() => ({ ...b,
        context: O,
        refs: E,
        elements: D,
        rootStore: i
    }), [b, E, D, O, i])
}
var cs = tn && $t;

function ls(e, t = {}) {
    let {
        enabled: n = !0,
        delay: r
    } = t, i = `rootStore` in e ? e.rootStore : e, {
        events: a,
        dataRef: o
    } = i.context, s = c.useRef(!1), l = c.useRef(null), u = c.useRef(!0), d = Oi();
    c.useEffect(() => {
        let e = i.select(`domReferenceElement`);
        if (!n) return;
        let t = G(e);

        function r() {
            let e = i.select(`domReferenceElement`);
            !i.select(`open`) && q(e) && e === pn(X(e)) && (s.current = !0)
        }

        function a() {
            u.current = !0
        }

        function o() {
            u.current = !1
        }
        return Li(Z(t, `blur`, r), cs && Z(t, `keydown`, a, !0), cs && Z(t, `pointerdown`, o, !0))
    }, [i, n]), c.useEffect(() => {
        if (!n) return;

        function e(e) {
            if (e.reason === `trigger-press` || e.reason === `escape-key`) {
                let e = i.select(`domReferenceElement`);
                K(e) && (l.current = e, s.current = !0)
            }
        }
        return a.on(`openchange`, e), () => {
            a.off(`openchange`, e)
        }
    }, [a, n, i]);
    let f = c.useMemo(() => {
        function e() {
            s.current = !1, l.current = null
        }
        return {
            onMouseLeave() {
                e()
            },
            onFocus(t) {
                let n = t.currentTarget;
                if (s.current) {
                    if (l.current === n) return;
                    e()
                }
                let a = mn(t.nativeEvent);
                if (K(a)) {
                    if (cs && !t.relatedTarget) {
                        if (!u.current && !vn(a)) return
                    } else if (!xn(a)) return
                }
                let o = hn(t.relatedTarget, i.context.triggerElements),
                    {
                        nativeEvent: c,
                        currentTarget: f
                    } = t,
                    p = typeof r == `function` ? r() : r;
                if (i.select(`open`) && o || p === 0 || p === void 0) {
                    i.setOpen(!0, U(Ge, c, f));
                    return
                }
                d.start(p, () => {
                    s.current || i.setOpen(!0, U(Ge, c, f))
                })
            },
            onBlur(t) {
                e();
                let n = t.relatedTarget,
                    r = t.nativeEvent,
                    a = K(n) && n.hasAttribute(Hi(`focus-guard`)) && n.getAttribute(`data-type`) === `outside`;
                d.start(0, () => {
                    let e = i.select(`domReferenceElement`),
                        t = pn(X(e));
                    !n && t === e || Y(o.current.floatingContext ? .refs.floating.current, t) || Y(e, t) || a || hn(n ? ? t, i.context.triggerElements) || i.setOpen(!1, U(Ge, r))
                })
            }
        }
    }, [o, r, i, d]);
    return c.useMemo(() => n ? {
        reference: f,
        trigger: f
    } : {}, [n, f])
}
var us = class e {
        constructor() {
            this.pointerType = void 0, this.interactedInside = !1, this.handler = void 0, this.blockMouseMove = !0, this.performedPointerEventsMutation = !1, this.pointerEventsScopeElement = null, this.pointerEventsReferenceElement = null, this.pointerEventsFloatingElement = null, this.restTimeoutPending = !1, this.openChangeTimeout = new Di, this.restTimeout = new Di, this.handleCloseOptions = void 0
        }
        static create() {
            return new e
        }
        dispose = () => {
            this.openChangeTimeout.clear(), this.restTimeout.clear()
        };
        disposeEffect = () => this.dispose
    },
    ds = new WeakMap;

function fs(e) {
    if (!e.performedPointerEventsMutation) return;
    let t = e.pointerEventsScopeElement;
    t && ds.get(t) === e && (e.pointerEventsScopeElement ? .style.removeProperty(`pointer-events`), e.pointerEventsReferenceElement ? .style.removeProperty(`pointer-events`), e.pointerEventsFloatingElement ? .style.removeProperty(`pointer-events`), ds.delete(t)), e.performedPointerEventsMutation = !1, e.pointerEventsScopeElement = null, e.pointerEventsReferenceElement = null, e.pointerEventsFloatingElement = null
}

function ps(e, t) {
    let {
        scopeElement: n,
        referenceElement: r,
        floatingElement: i
    } = t, a = ds.get(n);
    a && a !== e && fs(a), fs(e), e.performedPointerEventsMutation = !0, e.pointerEventsScopeElement = n, e.pointerEventsReferenceElement = r, e.pointerEventsFloatingElement = i, ds.set(n, e), n.style.pointerEvents = `none`, r.style.pointerEvents = `auto`, i.style.pointerEvents = `auto`
}

function ms(e) {
    let t = e.context.dataRef.current,
        n = u(() => t.hoverInteractionState ? ? us.create()).current;
    return t.hoverInteractionState || = n, gt(t.hoverInteractionState.disposeEffect), t.hoverInteractionState
}

function hs(e, t = {}) {
    let {
        enabled: n = !0,
        closeDelay: r = 0,
        nodeId: i
    } = t, a = `rootStore` in e ? e.rootStore : e, o = a.useState(`open`), s = a.useState(`floatingElement`), l = a.useState(`domReferenceElement`), {
        dataRef: u
    } = a.context, d = ia(), f = ra(), p = ms(a), m = Oi(), h = V(() => Mi(u.current.openEvent ? .type, p.interactedInside)), g = V(() => Ni(u.current.openEvent ? .type)), _ = V(() => {
        fs(p)
    });
    H(() => {
        o || (p.pointerType = void 0, p.restTimeoutPending = !1, p.interactedInside = !1, _())
    }, [o, p, _]), c.useEffect(() => _, [_]), H(() => {
        if (n && o && p.handleCloseOptions ? .blockPointerEvents && g() && K(l) && s) {
            let e = l,
                t = s,
                n = X(s),
                r = d ? .nodesRef.current.find(e => e.id === f) ? .context ? .elements.floating;
            r && (r.style.pointerEvents = ``);
            let i = p.pointerEventsScopeElement === t ? null : p.pointerEventsScopeElement,
                a = r === t ? null : r;
            return ps(p, {
                scopeElement: p.handleCloseOptions ? .getScope ? .() ? ? i ? ? a ? ? e.closest(`[data-rootownerid]`) ? ? n.body,
                referenceElement: e,
                floatingElement: t
            }), () => {
                _()
            }
        }
    }, [n, o, l, s, p, g, d, f, _]), c.useEffect(() => {
        if (!n) return;

        function e() {
            return !!(d && f && Cn(d.nodesRef.current, f).length > 0)
        }

        function t(e) {
            let t = Ai(r, `close`, p.pointerType),
                n = () => {
                    a.setOpen(!1, U(We, e)), d ? .events.emit(`floating.closed`, e)
                };
            t ? p.openChangeTimeout.start(t, n) : (p.openChangeTimeout.clear(), n())
        }

        function o(e) {
            let t = mn(e);
            if (!yn(t)) {
                p.interactedInside = !1;
                return
            }
            p.interactedInside = t ? .closest(`[aria-haspopup]`) != null
        }

        function c() {
            p.openChangeTimeout.clear(), m.clear(), d ? .events.off(`floating.closed`, g), _()
        }

        function l(n) {
            if (e() && d) {
                d.events.on(`floating.closed`, g);
                return
            }
            if (hn(n.relatedTarget, a.context.triggerElements)) return;
            let r = u.current.floatingContext ? .nodeId ? ? i,
                o = n.relatedTarget;
            if (!(d && r && K(o) && Cn(d.nodesRef.current, r, !1).some(e => Y(e.context ? .elements.floating, o)))) {
                if (p.handler) {
                    p.handler(n);
                    return
                }
                _(), h() || t(n)
            }
        }

        function g(t) {
            !d || !f || e() || m.start(0, () => {
                d.events.off(`floating.closed`, g), a.setOpen(!1, U(We, t)), d.events.emit(`floating.closed`, t)
            })
        }
        let v = s;
        return Li(v && Z(v, `mouseenter`, c), v && Z(v, `mouseleave`, l), v && Z(v, `pointerdown`, o, !0), () => {
            d ? .events.off(`floating.closed`, g)
        })
    }, [n, s, a, u, r, i, h, _, p, d, f, m])
}
var gs = {
    current: null
};

function _s(e, t = {}) {
    let {
        enabled: n = !0,
        delay: r = 0,
        handleClose: i = null,
        mouseOnly: a = !1,
        restMs: o = 0,
        move: s = !0,
        triggerElementRef: l = gs,
        externalTree: u,
        isActiveTrigger: d = !0,
        getHandleCloseContext: f,
        isClosing: p,
        shouldOpen: m
    } = t, h = `rootStore` in e ? e.rootStore : e, {
        dataRef: g,
        events: _
    } = h.context, v = ia(u), y = ms(h), b = c.useRef(!1), x = Hr(i), S = Hr(r), C = Hr(o), w = Hr(n), T = Hr(m), E = Hr(p), D = V(() => Mi(g.current.openEvent ? .type, y.interactedInside)), O = V(() => T.current ? .() !== !1), k = V((e, t, n) => {
        let r = h.context.triggerElements;
        if (r.hasElement(t)) return !e || !Y(e, t);
        if (!K(n)) return !1;
        let i = n;
        return r.hasMatchingElement(e => Y(e, i)) && (!e || !Y(e, i))
    }), A = V(() => {
        y.handler && = (X(h.select(`domReferenceElement`)).removeEventListener(`mousemove`, y.handler), void 0)
    }), j = V(() => {
        fs(y)
    });
    return d && (y.handleCloseOptions = x.current ? .__options), c.useEffect(() => A, [A]), c.useEffect(() => {
        if (!n) return;

        function e(e) {
            e.open ? b.current = !1 : (b.current = e.reason === We, A(), y.openChangeTimeout.clear(), y.restTimeout.clear(), y.blockMouseMove = !0, y.restTimeoutPending = !1)
        }
        return _.on(`openchange`, e), () => {
            _.off(`openchange`, e)
        }
    }, [n, _, y, A]), c.useEffect(() => {
        if (!n) return;

        function e(e, t = !0) {
            let n = Ai(S.current, `close`, y.pointerType);
            n ? y.openChangeTimeout.start(n, () => {
                h.setOpen(!1, U(We, e)), v ? .events.emit(`floating.closed`, e)
            }) : t && (y.openChangeTimeout.clear(), h.setOpen(!1, U(We, e)), v ? .events.emit(`floating.closed`, e))
        }
        let t = l.current ? ? (d ? h.select(`domReferenceElement`) : null);
        if (!K(t)) return;

        function r(e) {
            if (y.openChangeTimeout.clear(), y.blockMouseMove = !1, a && !kn(y.pointerType)) return;
            let t = ji(C.current),
                n = Ai(S.current, `open`, y.pointerType),
                r = mn(e),
                i = e.currentTarget ? ? null,
                o = h.select(`domReferenceElement`),
                s = i;
            if (K(r) && !h.context.triggerElements.hasElement(r)) {
                for (let e of h.context.triggerElements.elements())
                    if (Y(e, r)) {
                        s = e;
                        break
                    }
            }
            K(i) && K(o) && !h.context.triggerElements.hasElement(i) && Y(i, o) && (s = o);
            let c = s == null ? !1 : k(o, s, r),
                l = h.select(`open`),
                u = E.current ? .() ? ? h.select(`transitionStatus`) === `ending`,
                d = !l && u && b.current,
                f = !c && K(s) && K(o) && Y(o, s) && d,
                p = t > 0 && !n,
                m = c && (l || d) || f,
                g = !l || c;
            if (m) {
                O() && h.setOpen(!0, U(We, e, s));
                return
            }
            p || (n ? y.openChangeTimeout.start(n, () => {
                g && O() && h.setOpen(!0, U(We, e, s))
            }) : g && O() && h.setOpen(!0, U(We, e, s)))
        }

        function i(t) {
            if (D()) {
                j();
                return
            }
            A();
            let n = X(h.select(`domReferenceElement`));
            y.restTimeout.clear(), y.restTimeoutPending = !1;
            let r = g.current.floatingContext ? ? f ? .();
            if (!hn(t.relatedTarget, h.context.triggerElements)) {
                if (x.current && r) {
                    h.select(`open`) || y.openChangeTimeout.clear();
                    let i = l.current;
                    y.handler = x.current({ ...r,
                        tree: v,
                        x: t.clientX,
                        y: t.clientY,
                        onClose() {
                            j(), A(), w.current && !D() && i === h.select(`domReferenceElement`) && e(t, !0)
                        }
                    }), n.addEventListener(`mousemove`, y.handler), y.handler(t);
                    return
                }(y.pointerType !== `touch` || !Y(h.select(`floatingElement`), t.relatedTarget)) && e(t)
            }
        }
        return s ? Li(Z(t, `mousemove`, r, {
            once: !0
        }), Z(t, `mouseenter`, r), Z(t, `mouseleave`, i)) : Li(Z(t, `mouseenter`, r), Z(t, `mouseleave`, i))
    }, [A, j, g, S, h, n, x, y, d, k, D, a, s, C, l, v, w, f, E, O]), c.useMemo(() => {
        if (!n) return;

        function e(e) {
            y.pointerType = e.pointerType
        }
        return {
            onPointerDown: e,
            onPointerEnter: e,
            onMouseMove(e) {
                let {
                    nativeEvent: t
                } = e, n = e.currentTarget, r = h.select(`domReferenceElement`), i = h.select(`open`), o = k(r, n, e.target);
                if (a && !kn(y.pointerType)) return;
                if (i && o && y.handleCloseOptions ? .blockPointerEvents) {
                    let e = h.select(`floatingElement`);
                    e && ps(y, {
                        scopeElement: y.handleCloseOptions ? .getScope ? .() ? ? n.ownerDocument.body,
                        referenceElement: n,
                        floatingElement: e
                    })
                }
                let s = ji(C.current);
                if (i && !o || s === 0 || !o && y.restTimeoutPending && e.movementX ** 2 + e.movementY ** 2 < 2) return;
                y.restTimeout.clear();

                function c() {
                    if (y.restTimeoutPending = !1, D()) return;
                    let e = h.select(`open`);
                    !y.blockMouseMove && (!e || o) && O() && h.setOpen(!0, U(We, t, n))
                }
                y.pointerType === `touch` ? le.flushSync(() => {
                    c()
                }) : o && i ? c() : (y.restTimeoutPending = !0, y.restTimeout.start(s, c))
            }
        }
    }, [n, y, D, k, a, h, C, O])
}
var vs = .1,
    ys = vs * vs,
    $ = .5;

function bs(e, t, n, r, i, a) {
    return r >= t != a >= t && e <= (i - n) * (t - r) / (a - r) + n
}

function xs(e, t, n, r, i, a, o, s, c, l) {
    let u = !1;
    return bs(e, t, n, r, i, a) && (u = !u), bs(e, t, i, a, o, s) && (u = !u), bs(e, t, o, s, c, l) && (u = !u), bs(e, t, c, l, n, r) && (u = !u), u
}

function Ss(e, t, n) {
    return e >= n.x && e <= n.x + n.width && t >= n.y && t <= n.y + n.height
}

function Cs(e, t, n, r, i, a) {
    return e >= Math.min(n, i) && e <= Math.max(n, i) && t >= Math.min(r, a) && t <= Math.max(r, a)
}

function ws(e = {}) {
    let {
        blockPointerEvents: t = !1
    } = e, n = new Di, r = ({
        x: e,
        y: t,
        placement: r,
        elements: i,
        onClose: a,
        nodeId: o,
        tree: s
    }) => {
        let c = r ? .split(`-`)[0],
            l = !1,
            u = null,
            d = null,
            f = typeof performance < `u` ? performance.now() : 0;

        function p(e, t) {
            let n = performance.now(),
                r = n - f;
            if (u === null || d === null || r === 0) return u = e, d = t, f = n, !1;
            let i = e - u,
                a = t - d,
                o = i * i + a * a,
                s = r * r * ys;
            return u = e, d = t, f = n, o < s
        }

        function m() {
            n.clear(), a()
        }
        return function(r) {
            n.clear();
            let a = i.domReference,
                u = i.floating;
            if (!a || !u || c == null || e == null || t == null) return;
            let {
                clientX: d,
                clientY: f
            } = r, h = mn(r), g = r.type === `mouseleave`, _ = Y(u, h), v = Y(a, h);
            if (_ && (l = !0, !g)) return;
            if (v && (l = !1, !g)) {
                l = !0;
                return
            }
            if (g && K(r.relatedTarget) && Y(u, r.relatedTarget)) return;

            function y() {
                return !!(s && Cn(s.nodesRef.current, o).length > 0)
            }

            function b() {
                y() || m()
            }
            if (y()) return;
            let x = a.getBoundingClientRect(),
                S = u.getBoundingClientRect(),
                C = e > S.right - S.width / 2,
                w = t > S.bottom - S.height / 2,
                T = S.width > x.width,
                E = S.height > x.height,
                D = (T ? x : S).left,
                O = (T ? x : S).right,
                k = (E ? x : S).top,
                A = (E ? x : S).bottom;
            if (c === `top` && t >= x.bottom - 1 || c === `bottom` && t <= x.top + 1 || c === `left` && e >= x.right - 1 || c === `right` && e <= x.left + 1) {
                b();
                return
            }
            let j = !1;
            switch (c) {
                case `top`:
                    j = Cs(d, f, D, x.top + 1, O, S.bottom - 1);
                    break;
                case `bottom`:
                    j = Cs(d, f, D, S.top + 1, O, x.bottom - 1);
                    break;
                case `left`:
                    j = Cs(d, f, S.right - 1, A, x.left + 1, k);
                    break;
                case `right`:
                    j = Cs(d, f, x.right - 1, A, S.left + 1, k);
                    break;
                default:
            }
            if (j) return;
            if (l && !Ss(d, f, x)) {
                b();
                return
            }
            if (!g && p(d, f)) {
                b();
                return
            }
            let M = !1;
            switch (c) {
                case `top`:
                    {
                        let n = T ? $ / 2 : $ * 4,
                            r = T || C ? e + n : e - n,
                            i = T ? e - n : C ? e + n : e - n,
                            a = t + $ + 1,
                            o = C || T ? S.bottom - $ : S.top,
                            s = C ? T ? S.bottom - $ : S.top : S.bottom - $;M = xs(d, f, r, a, i, a, S.left, o, S.right, s);
                        break
                    }
                case `bottom`:
                    {
                        let n = T ? $ / 2 : $ * 4,
                            r = T || C ? e + n : e - n,
                            i = T ? e - n : C ? e + n : e - n,
                            a = t - $,
                            o = C || T ? S.top + $ : S.bottom,
                            s = C ? T ? S.top + $ : S.bottom : S.top + $;M = xs(d, f, r, a, i, a, S.left, o, S.right, s);
                        break
                    }
                case `left`:
                    {
                        let n = E ? $ / 2 : $ * 4,
                            r = E || w ? t + n : t - n,
                            i = E ? t - n : w ? t + n : t - n,
                            a = e + $ + 1,
                            o = w || E ? S.right - $ : S.left,
                            s = w ? E ? S.right - $ : S.left : S.right - $;M = xs(d, f, o, S.top, s, S.bottom, a, r, a, i);
                        break
                    }
                case `right`:
                    {
                        let n = E ? $ / 2 : $ * 4,
                            r = E || w ? t + n : t - n,
                            i = E ? t - n : w ? t + n : t - n,
                            a = e - $,
                            o = w || E ? S.left + $ : S.right,
                            s = w ? E ? S.left + $ : S.right : S.left + $;M = xs(d, f, a, r, a, i, o, S.top, s, S.bottom);
                        break
                    }
                default:
            }
            M ? l || n.start(40, b) : b()
        }
    };
    return r.__options = { ...e,
        blockPointerEvents: t
    }, r
}
var Ts = { ...as,
        disabled: Q(e => e.disabled),
        instantType: Q(e => e.instantType),
        isInstantPhase: Q(e => e.isInstantPhase),
        trackCursorAxis: Q(e => e.trackCursorAxis),
        disableHoverablePopup: Q(e => e.disableHoverablePopup),
        lastOpenChangeReason: Q(e => e.openChangeReason),
        closeOnClick: Q(e => e.closeOnClick),
        closeDelay: Q(e => e.closeDelay),
        hasViewport: Q(e => e.hasViewport)
    },
    Es = class e extends Lo {
        constructor(e, t, n = !1) {
            let r = new Xo,
                i = { ...Ds(),
                    ...e
                };
            i.floatingRootContext = $o(r, t, n), super(i, {
                popupRef: c.createRef(),
                onOpenChange: void 0,
                onOpenChangeComplete: void 0,
                triggerElements: r
            }, Ts)
        }
        setOpen = (e, t) => {
            let n = t.reason,
                r = n === We,
                i = e && n === `trigger-focus`,
                a = !e && (n === `trigger-press` || n === `escape-key`);
            if (t.preventUnmountOnClose = () => {
                    this.set(`preventUnmountingOnClose`, !0)
                }, this.context.onOpenChange ? .(e, t), t.isCanceled) return;
            this.state.floatingRootContext.dispatchOpenChange(e, t);
            let o = () => {
                let r = {
                    open: e,
                    openChangeReason: n
                };
                i ? r.instantType = `focus` : a ? r.instantType = `dismiss` : n === `trigger-hover` && (r.instantType = void 0), Wo(r, e, t.trigger), this.update(r)
            };
            r ? le.flushSync(o) : o()
        };
        cancelPendingOpen(e) {
            this.state.floatingRootContext.dispatchOpenChange(!1, U(Ue, e))
        }
        static useStore(t, n) {
            return Ho(t, (t, r) => new e(n, t, r)).store
        }
    };

function Ds() {
    return { ...Qo(),
        disabled: !1,
        instantType: void 0,
        isInstantPhase: !1,
        trackCursorAxis: `none`,
        disableHoverablePopup: !1,
        openChangeReason: null,
        closeOnClick: !0,
        closeDelay: 0,
        hasViewport: !1
    }
}
var Os = bi(function(e) {
    let {
        disabled: t = !1,
        defaultOpen: n = !1,
        open: r,
        disableHoverablePopup: i = !1,
        trackCursorAxis: a = `none`,
        actionsRef: o,
        onOpenChange: s,
        onOpenChangeComplete: l,
        handle: u,
        triggerId: d,
        defaultTriggerId: f = null,
        children: p
    } = e, m = Es.useStore(u ? .store, {
        open: n,
        openProp: r,
        activeTriggerId: f,
        triggerIdProp: d
    });
    Ci(() => {
        r === void 0 && m.state.open === !1 && n === !0 && m.update({
            open: !0,
            activeTriggerId: f
        })
    }), m.useControlledProp(`openProp`, r), m.useControlledProp(`triggerIdProp`, d), m.useContextCallback(`onOpenChange`, s), m.useContextCallback(`onOpenChangeComplete`, l);
    let h = m.useState(`open`),
        g = !t && h,
        _ = m.useState(`activeTriggerId`),
        v = m.useState(`mounted`),
        y = m.useState(`payload`);
    m.useSyncedValues({
        trackCursorAxis: a,
        disableHoverablePopup: i
    }), m.useSyncedValue(`disabled`, t), Ko(m);
    let {
        forceUnmount: b,
        transitionStatus: x
    } = qo(g, m), S = m.useState(`isInstantPhase`), C = m.useState(`instantType`), w = m.useState(`lastOpenChangeReason`), T = c.useRef(null);
    H(() => {
        h && t && m.setOpen(!1, U(at))
    }, [h, t, m]), H(() => {
        x === `ending` && w === `none` || x !== `ending` && S ? (C !== `delay` && (T.current = C), m.set(`instantType`, `delay`)) : T.current !== null && (m.set(`instantType`, T.current), T.current = null)
    }, [x, S, w, C, m]), H(() => {
        g && (_ ? ? m.set(`payload`, void 0))
    }, [m, _, g]);
    let E = c.useCallback(() => {
        m.setOpen(!1, U(ct))
    }, [m]);
    c.useImperativeHandle(o, () => ({
        unmount: b,
        close: E
    }), [b, E]);
    let D = g || v || !t && a !== `none`;
    return (0, B.jsxs)(wi.Provider, {
        value: m,
        children: [D && (0, B.jsx)(ks, {
            store: m,
            disabled: t,
            trackCursorAxis: a
        }), typeof p == `function` ? p({
            payload: y
        }) : p]
    })
});

function ks({
    store: e,
    disabled: t,
    trackCursorAxis: n
}) {
    let r = e.useState(`floatingRootContext`),
        i = ma(r, {
            enabled: !t,
            referencePress: () => e.select(`closeOnClick`)
        }),
        a = ua(r, {
            enabled: !t && n !== `none`,
            axis: n === `none` ? void 0 : n
        });
    return Jo(e, {
        activeTriggerProps: c.useMemo(() => O(a.reference, i.reference), [a.reference, i.reference]),
        inactiveTriggerProps: c.useMemo(() => O(a.trigger, i.trigger), [a.trigger, i.trigger]),
        popupProps: c.useMemo(() => O(Vo, a.floating, i.floating), [a.floating, i.floating])
    }), null
}
var As = function(e) {
        return e.open = `data-open`, e.closed = `data-closed`, e[e.startingStyle = St.startingStyle] = `startingStyle`, e[e.endingStyle = St.endingStyle] = `endingStyle`, e.anchorHidden = `data-anchor-hidden`, e.side = `data-side`, e.align = `data-align`, e
    }({}),
    js = function(e) {
        return e.popupOpen = `data-popup-open`, e.pressed = `data-pressed`, e
    }({}),
    Ms = {
        [js.popupOpen]: ``
    },
    Ns = {
        [js.popupOpen]: ``,
        [js.pressed]: ``
    },
    Ps = {
        [As.open]: ``
    },
    Fs = {
        [As.closed]: ``
    },
    Is = {
        [As.anchorHidden]: ``
    },
    Ls = {
        open(e) {
            return e ? Ms : null
        }
    },
    Rs = {
        open(e) {
            return e ? Ns : null
        }
    },
    zs = {
        open(e) {
            return e ? Ps : Fs
        },
        anchorHidden(e) {
            return e ? Is : null
        }
    },
    Bs = c.createContext(void 0);

function Vs() {
    return c.useContext(Bs)
}
var Hs = function(e) {
        return e[e.popupOpen = js.popupOpen] = `popupOpen`, e.triggerDisabled = `data-trigger-disabled`, e
    }({}),
    Us = `data-base-ui-tooltip-trigger`;

function Ws(e) {
    if (`composedPath` in e) {
        let t = e.composedPath();
        for (let e = 0; e < t.length; e += 1) {
            let n = t[e];
            if (K(n)) return n
        }
    }
    let t = e.target;
    return K(t) ? t : null
}

function Gs(e) {
    let t = e;
    for (; t;) {
        if (t.hasAttribute(Us)) return t;
        let e = t.parentElement;
        if (e) {
            t = e;
            continue
        }
        let n = t.getRootNode();
        t = `host` in n && K(n.host) ? n.host : null
    }
    return null
}
var Ks = xi(function(e, t) {
        let {
            render: n,
            className: r,
            style: i,
            handle: a,
            payload: o,
            disabled: l,
            delay: u,
            closeOnClick: d = !0,
            closeDelay: f,
            id: p,
            ...m
        } = e, h = Ti(!0), g = a ? .store ? ? h;
        if (!g) throw Error(s(82));
        let _ = mt(p),
            v = g.useState(`isTriggerActive`, _),
            y = g.useState(`isOpenedByTrigger`, _),
            b = g.useState(`floatingRootContext`),
            x = c.useRef(null),
            S = u ? ? 600,
            C = f ? ? 0,
            {
                registerTrigger: w,
                isMountedByThisTrigger: T
            } = Go(_, x, g, {
                payload: o,
                closeOnClick: d,
                closeDelay: C
            }),
            E = Vs(),
            {
                delayRef: D,
                isInstantPhase: O,
                hasProvider: k
            } = Ii(b, {
                open: y
            }),
            A = ms(b);
        g.useSyncedValue(`isInstantPhase`, O);
        let j = g.useState(`disabled`),
            M = l ? ? j,
            N = Hr(M),
            P = g.useState(`trackCursorAxis`),
            F = g.useState(`disableHoverablePopup`),
            I = c.useRef(!1),
            L = Oi(),
            R = c.useRef(void 0);

        function ee() {
            let e = E ? .delay,
                t = typeof D.current == `object` ? D.current.open : void 0,
                n = S;
            return k && (n = t === 0 ? 0 : u ? ? e ? ? S), n
        }

        function te(e) {
            let t = x.current;
            if (!t || !e) return !1;
            let n = Gs(e);
            return n !== null && n !== t && Y(t, n)
        }

        function ne(e) {
            let t = te(e);
            return I.current = t, t && (A.openChangeTimeout.clear(), A.restTimeout.clear(), A.restTimeoutPending = !1, L.clear()), t
        }
        let z = _s(b, {
                enabled: !M,
                mouseOnly: !0,
                move: !1,
                handleClose: !F && P !== `both` ? ws() : null,
                restMs: ee,
                delay() {
                    let e = typeof D.current == `object` ? D.current.close : void 0,
                        t = C;
                    return f == null && k && (t = e), {
                        close: t
                    }
                },
                triggerElementRef: x,
                isActiveTrigger: v,
                isClosing: () => g.select(`transitionStatus`) === `ending`,
                shouldOpen() {
                    return !I.current
                }
            }),
            ie = ls(b, {
                enabled: !M
            }).reference,
            ae = e => {
                let t = I.current,
                    n = Ws(e),
                    r = ne(n),
                    i = x.current,
                    a = i && n && Y(i, n);
                if (r && g.select(`open`) && g.select(`lastOpenChangeReason`) === `trigger-hover`) {
                    g.setOpen(!1, U(We, e));
                    return
                }
                if (t && !r && a && !N.current && !g.select(`open`) && i && kn(R.current)) {
                    let t = () => {
                            !I.current && !N.current && !g.select(`open`) && g.setOpen(!0, U(We, e, i))
                        },
                        n = ee();
                    n === 0 ? (L.clear(), t()) : L.start(n, t)
                }
            },
            oe = g.useState(`triggerProps`, T);
        return re(`button`, e, {
            state: {
                open: y
            },
            ref: [t, w, x],
            props: [z, ie, T || P !== `none` ? oe : void 0, {
                onMouseOver(e) {
                    ae(e.nativeEvent)
                },
                onFocus(e) {
                    te(Ws(e.nativeEvent)) && e.preventBaseUIHandler()
                },
                onMouseLeave() {
                    I.current = !1, L.clear(), R.current = void 0
                },
                onPointerEnter(e) {
                    R.current = e.pointerType
                },
                onPointerDown(e) {
                    R.current = e.pointerType, g.set(`closeOnClick`, d), d && !g.select(`open`) && g.cancelPendingOpen(e.nativeEvent)
                },
                onClick(e) {
                    d && !g.select(`open`) && g.cancelPendingOpen(e.nativeEvent)
                },
                id: _,
                [Hs.triggerDisabled]: M ? `` : void 0,
                [Us]: M ? void 0 : ``
            }, m],
            stateAttributesMapping: Ls
        })
    }),
    qs = c.createContext(void 0);

function Js() {
    let e = c.useContext(qs);
    if (e === void 0) throw Error(s(70));
    return e
}
var Ys = c.forwardRef(function(e, t) {
        let {
            children: n,
            container: r,
            className: i,
            render: a,
            style: o,
            ...s
        } = e, {
            portalNode: l,
            portalSubtree: u
        } = Zi({
            container: r,
            ref: t,
            componentProps: e,
            elementProps: s
        });
        return !u && !l ? null : (0, B.jsxs)(c.Fragment, {
            children: [u, l && le.createPortal(n, l)]
        })
    }),
    Xs = c.forwardRef(function(e, t) {
        let {
            keepMounted: n = !1,
            ...r
        } = e;
        return Ti().useState(`mounted`) || n ? (0, B.jsx)(qs.Provider, {
            value: n,
            children: (0, B.jsx)(Ys, {
                ref: t,
                ...r
            })
        }) : null
    }),
    Zs = c.createContext(void 0);

function Qs() {
    let e = c.useContext(Zs);
    if (e === void 0) throw Error(s(71));
    return e
}
var $s = e => ({
        name: `arrow`,
        options: e,
        async fn(t) {
            let {
                x: n,
                y: r,
                placement: i,
                rects: a,
                platform: o,
                elements: s,
                middlewareData: c
            } = t, {
                element: l,
                padding: u = 0,
                offsetParent: d = `real`
            } = zn(e, t) || {};
            if (l == null) return {};
            let f = rr(u),
                p = {
                    x: n,
                    y: r
                },
                m = Gn(i),
                h = Un(m),
                g = await o.getDimensions(l),
                _ = m === `y`,
                v = _ ? `top` : `left`,
                y = _ ? `bottom` : `right`,
                b = _ ? `clientHeight` : `clientWidth`,
                x = a.reference[h] + a.reference[m] - p[m] - a.floating[h],
                S = p[m] - a.reference[m],
                C = d === `real` ? await o.getOffsetParent ? .(l) : s.floating,
                w = s.floating[b] || a.floating[h];
            (!w || !await o.isElement ? .(C)) && (w = s.floating[b] || a.floating[h]);
            let T = x / 2 - S / 2,
                E = w / 2 - g[h] / 2 - 1,
                D = Math.min(f[v], E),
                O = Math.min(f[y], E),
                k = D,
                A = w - g[h] - O,
                j = w / 2 - g[h] / 2 + T,
                M = Rn(k, j, A),
                N = !c.arrow && Vn(i) != null && j !== M && a.reference[h] / 2 - (j < k ? D : O) - g[h] / 2 < 0,
                P = N ? j < k ? j - k : j - A : 0;
            return {
                [m]: p[m] + P,
                data: {
                    [m]: M,
                    centerOffset: j - M - P,
                    ...N && {
                        alignmentOffset: P
                    }
                },
                reset: N
            }
        }
    }),
    ec = (e, t) => ({ ...$s(e),
        options: [e, t]
    }),
    tc = {
        name: `hide`,
        async fn(e) {
            let {
                width: t,
                height: n,
                x: r,
                y: i
            } = e.rects.reference, a = t === 0 && n === 0 && r === 0 && i === 0;
            return {
                data: {
                    referenceHidden: (await wo().fn(e)).data ? .referenceHidden || a
                }
            }
        }
    },
    nc = {
        sideX: `left`,
        sideY: `top`
    },
    rc = {
        name: `adaptiveOrigin`,
        async fn(e) {
            let {
                x: t,
                y: n,
                rects: {
                    floating: r
                },
                elements: {
                    floating: i
                },
                platform: a,
                strategy: o,
                placement: s
            } = e, c = G(i), l = c.getComputedStyle(i);
            if (!(l.transitionDuration !== `0s` && l.transitionDuration !== ``)) return {
                x: t,
                y: n,
                data: nc
            };
            let u = await a.getOffsetParent ? .(i),
                d = {
                    width: 0,
                    height: 0
                };
            if (o === `fixed` && c ? .visualViewport) d = {
                width: c.visualViewport.width,
                height: c.visualViewport.height
            };
            else if (u === c) {
                let e = X(i);
                d = {
                    width: e.documentElement.clientWidth,
                    height: e.documentElement.clientHeight
                }
            } else await a.isElement ? .(u) && (d = await a.getDimensions(u));
            let f = Bn(s),
                p = t,
                m = n;
            f === `left` && (p = d.width - (t + r.width)), f === `top` && (m = d.height - (n + r.height));
            let h = f === `left` ? `right` : nc.sideX,
                g = f === `top` ? `bottom` : nc.sideY;
            return {
                x: p,
                y: m,
                data: {
                    sideX: h,
                    sideY: g
                }
            }
        }
    };

function ic(e, t, n) {
    let r = e === `inline-start` || e === `inline-end`;
    return {
        top: `top`,
        right: r ? n ? `inline-start` : `inline-end` : `right`,
        bottom: `bottom`,
        left: r ? n ? `inline-end` : `inline-start` : `left`
    }[t]
}

function ac(e, t, n) {
    let {
        rects: r,
        placement: i
    } = e;
    return {
        side: ic(t, Bn(i), n),
        align: Vn(i) || `center`,
        anchor: {
            width: r.reference.width,
            height: r.reference.height
        },
        positioner: {
            width: r.floating.width,
            height: r.floating.height
        }
    }
}

function oc(e) {
    let {
        anchor: t,
        positionMethod: n = `absolute`,
        side: r = `bottom`,
        sideOffset: i = 0,
        align: a = `center`,
        alignOffset: o = 0,
        collisionBoundary: s,
        collisionPadding: l = 5,
        sticky: u = !1,
        arrowPadding: d = 5,
        disableAnchorTracking: f = !1,
        inline: p,
        keepMounted: m = !1,
        floatingRootContext: h,
        mounted: g,
        collisionAvoidance: _,
        shiftCrossAxis: v = !1,
        nodeId: y,
        adaptiveOrigin: b,
        lazyFlip: x = !1,
        externalTree: S
    } = e, [C, w] = c.useState(null);
    !g && C !== null && w(null);
    let T = _.side || `flip`,
        E = _.align || `flip`,
        D = _.fallbackAxisSide || `end`,
        O = typeof t == `function` ? t : void 0,
        k = V(O),
        A = O ? k : t,
        j = Hr(t),
        M = Hr(g),
        N = Ve() === `rtl`,
        P = C || {
            top: `top`,
            right: `right`,
            bottom: `bottom`,
            left: `left`,
            "inline-end": N ? `left` : `right`,
            "inline-start": N ? `right` : `left`
        }[r],
        F = a === `center` ? P : `${P}-${a}`,
        I = l,
        L = +(r === `bottom`),
        R = +(r === `top`),
        ee = +(r === `right`),
        te = +(r === `left`);
    typeof I == `number` ? I = {
        top: I + L,
        right: I + te,
        bottom: I + R,
        left: I + ee
    } : I && = {
        top: (I.top || 0) + L,
        right: (I.right || 0) + te,
        bottom: (I.bottom || 0) + R,
        left: (I.left || 0) + ee
    };
    let ne = {
            boundary: s === `clipping-ancestors` ? `clippingAncestors` : s,
            padding: I
        },
        re = c.useRef(null),
        z = Hr(i),
        ie = Hr(o),
        ae = typeof i == `function` ? 0 : i,
        oe = typeof o == `function` ? 0 : o,
        se = [];
    p && se.push(p), se.push(yo(e => {
        let t = ac(e, r, N),
            n = typeof z.current == `function` ? z.current(t) : z.current,
            i = typeof ie.current == `function` ? ie.current(t) : ie.current;
        return {
            mainAxis: n,
            crossAxis: i,
            alignmentAxis: i
        }
    }, [ae, oe, N, r]));
    let ce = E === `none` && T !== `shift`,
        le = !ce && (u || v || T === `shift`),
        B = T === `none` ? null : So({ ...ne,
            padding: {
                top: I.top + 1,
                right: I.right + 1,
                bottom: I.bottom + 1,
                left: I.left + 1
            },
            mainAxis: !v && T === `flip`,
            crossAxis: E === `flip` ? `alignment` : !1,
            fallbackAxisSideDirection: D
        }),
        ue = ce ? null : bo(e => {
            let t = X(e.elements.floating).documentElement;
            return { ...ne,
                rootBoundary: v ? {
                    x: 0,
                    y: 0,
                    width: t.clientWidth,
                    height: t.clientHeight
                } : void 0,
                mainAxis: E !== `none`,
                crossAxis: le,
                limiter: u || v ? void 0 : xo(e => {
                    if (!re.current) return {};
                    let {
                        width: t,
                        height: n
                    } = re.current.getBoundingClientRect(), r = Wn(Bn(e.placement)), i = r === `y` ? t : n, a = r === `y` ? I.left + I.right : I.top + I.bottom;
                    return {
                        offset: i / 2 + a / 2
                    }
                })
            }
        }, [ne, u, v, I, E]);
    T === `shift` || E === `shift` || a === `center` ? se.push(ue, B) : se.push(B, ue), se.push(Co({ ...ne,
        apply({
            elements: {
                floating: e
            },
            availableWidth: t,
            availableHeight: n,
            rects: r
        }) {
            if (!M.current) return;
            let i = e.style;
            i.setProperty(`--available-width`, `${t}px`), i.setProperty(`--available-height`, `${n}px`);
            let a = G(e).devicePixelRatio || 1,
                {
                    x: o,
                    y: s,
                    width: c,
                    height: l
                } = r.reference,
                u = (Math.round((o + c) * a) - Math.round(o * a)) / a,
                d = (Math.round((s + l) * a) - Math.round(s * a)) / a;
            i.setProperty(`--anchor-width`, `${u}px`), i.setProperty(`--anchor-height`, `${d}px`)
        }
    }), ec(e => ({
        element: re.current || X(e.elements.floating).createElement(`div`),
        padding: d,
        offsetParent: `floating`
    }), [d]), {
        name: `transformOrigin`,
        fn(e) {
            let {
                elements: t,
                middlewareData: n,
                placement: a,
                rects: o,
                y: s
            } = e, c = Bn(a), l = Wn(c), u = re.current, d = n.arrow ? .x || 0, f = n.arrow ? .y || 0, p = u ? .clientWidth || 0, m = u ? .clientHeight || 0, h = d + p / 2, g = f + m / 2, _ = Math.abs(n.shift ? .y || 0), v = o.reference.height / 2, y = typeof i == `function` ? i(ac(e, r, N)) : i, b = _ > y, x = {
                top: `${h}px calc(100% + ${y}px)`,
                bottom: `${h}px ${-y}px`,
                left: `calc(100% + ${y}px) ${g}px`,
                right: `${-y}px ${g}px`
            }[c], S = `${h}px ${o.reference.y+v-s}px`;
            return t.floating.style.setProperty(`--transform-origin`, le && l === `y` && b ? S : x), {}
        }
    }, tc, b), H(() => {
        !g && h && h.update({
            referenceElement: null,
            floatingElement: null,
            domReferenceElement: null,
            positionReference: null
        })
    }, [g, h]);
    let de = c.useMemo(() => ({
            elementResize: !f && typeof ResizeObserver < `u`,
            layoutShift: !f && typeof IntersectionObserver < `u`
        }), [f]),
        {
            refs: fe,
            elements: pe,
            x: me,
            y: he,
            middlewareData: ge,
            update: _e,
            placement: ve,
            context: ye,
            isPositioned: be,
            floatingStyles: xe
        } = ss({
            rootContext: h,
            open: m ? g : void 0,
            placement: F,
            middleware: se,
            strategy: n,
            whileElementsMounted: m ? void 0 : (...e) => io(...e, de),
            nodeId: y,
            externalTree: S
        }),
        {
            sideX: Se,
            sideY: Ce
        } = ge.adaptiveOrigin || nc,
        we = be ? n : `fixed`,
        Te = c.useMemo(() => {
            let e = b ? {
                position: we,
                [Se]: me,
                [Ce]: he
            } : {
                position: we,
                ...xe
            };
            return be || (e.opacity = 0), e
        }, [b, we, Se, me, Ce, he, xe, be]),
        Ee = c.useRef(null);
    H(() => {
        if (!g) return;
        let e = j.current,
            t = typeof e == `function` ? e() : e,
            n = (sc(t) ? t.current : t) || null;
        n !== Ee.current && (fe.setPositionReference(n), Ee.current = n)
    }, [g, fe, A, j]), c.useEffect(() => {
        if (!g) return;
        let e = j.current;
        typeof e != `function` && sc(e) && e.current !== Ee.current && (fe.setPositionReference(e.current), Ee.current = e.current)
    }, [g, fe, A, j]), c.useEffect(() => {
        if (m && g && pe.domReference && pe.floating) return io(pe.domReference, pe.floating, _e, de)
    }, [m, g, pe, _e, de]);
    let De = Bn(ve),
        Oe = ic(r, De, N),
        ke = Vn(ve) || `center`,
        Ae = !!ge.hide ? .referenceHidden;
    H(() => {
        x && g && be && w(De)
    }, [x, g, be, De]);
    let je = c.useMemo(() => ({
            position: `absolute`,
            top: ge.arrow ? .y,
            left: ge.arrow ? .x
        }), [ge.arrow]),
        Me = ge.arrow ? .centerOffset !== 0;
    return c.useMemo(() => ({
        positionerStyles: Te,
        arrowStyles: je,
        arrowRef: re,
        arrowUncentered: Me,
        side: Oe,
        align: ke,
        physicalSide: De,
        anchorHidden: Ae,
        refs: fe,
        context: ye,
        isPositioned: be,
        update: _e
    }), [Te, je, re, Me, Oe, ke, De, Ae, fe, ye, be, _e])
}

function sc(e) {
    return e != null && `current` in e
}

function cc(e) {
    return e === `starting` ? Ui : C
}

function lc(e, t, {
    styles: n,
    transitionStatus: r,
    props: i,
    refs: a,
    hidden: o,
    inert: s = !1
}) {
    let c = { ...n
    };
    return s && (c.pointerEvents = `none`), re(`div`, e, {
        state: t,
        ref: a,
        props: [{
            role: `presentation`,
            hidden: o,
            style: c
        }, cc(r), i],
        stateAttributesMapping: zs
    })
}
var uc = c.forwardRef(function(e, t) {
        let {
            render: n,
            className: r,
            anchor: i,
            positionMethod: a = `absolute`,
            side: o = `top`,
            align: s = `center`,
            sideOffset: l = 0,
            alignOffset: u = 0,
            collisionBoundary: d = `clipping-ancestors`,
            collisionPadding: f = 5,
            arrowPadding: p = 5,
            sticky: m = !1,
            disableAnchorTracking: h = !1,
            collisionAvoidance: g = Ki,
            style: _,
            ...v
        } = e, y = Ti(), b = Js(), x = y.useState(`open`), S = y.useState(`mounted`), C = y.useState(`trackCursorAxis`), w = y.useState(`disableHoverablePopup`), T = y.useState(`floatingRootContext`), E = y.useState(`instantType`), D = y.useState(`transitionStatus`), O = oc({
            anchor: i,
            positionMethod: a,
            floatingRootContext: T,
            mounted: S,
            side: o,
            sideOffset: l,
            align: s,
            alignOffset: u,
            collisionBoundary: d,
            collisionPadding: f,
            sticky: m,
            arrowPadding: p,
            disableAnchorTracking: h,
            keepMounted: b,
            collisionAvoidance: g,
            adaptiveOrigin: y.useState(`hasViewport`) ? rc : void 0
        }), k = lc(e, c.useMemo(() => ({
            open: x,
            side: O.side,
            align: O.align,
            anchorHidden: O.anchorHidden,
            instant: C === `none` ? E : `tracking-cursor`
        }), [x, O.side, O.align, O.anchorHidden, C, E]), {
            styles: O.positionerStyles,
            transitionStatus: D,
            props: v,
            refs: [t, y.useStateSetter(`positionerElement`)],
            hidden: !S,
            inert: !x || C === `both` || w
        });
        return (0, B.jsx)(Zs.Provider, {
            value: O,
            children: k
        })
    }),
    dc = { ...zs,
        ...Tt
    },
    fc = c.forwardRef(function(e, t) {
        let {
            render: n,
            className: r,
            style: i,
            ...a
        } = e, o = Ti(), {
            side: s,
            align: c
        } = Qs(), l = o.useState(`open`), u = o.useState(`instantType`), d = o.useState(`transitionStatus`), f = o.useState(`popupProps`), p = o.useState(`floatingRootContext`), m = o.useState(`disabled`), h = o.useState(`closeDelay`);
        Kr({
            open: l,
            ref: o.context.popupRef,
            onComplete() {
                l && o.context.onOpenChangeComplete ? .(!0)
            }
        }), hs(p, {
            enabled: !m,
            closeDelay: h
        });
        let g = o.useStateSetter(`popupElement`);
        return re(`div`, e, {
            state: {
                open: l,
                side: s,
                align: c,
                instant: u,
                transitionStatus: d
            },
            ref: [t, o.context.popupRef, g],
            props: [f, cc(d), a],
            stateAttributesMapping: dc
        })
    }),
    pc = function(e) {
        let {
            delay: t,
            closeDelay: n,
            timeout: r = 400
        } = e, i = c.useMemo(() => ({
            delay: t,
            closeDelay: n
        }), [t, n]), a = c.useMemo(() => ({
            open: t,
            close: n
        }), [t, n]);
        return (0, B.jsx)(Bs.Provider, {
            value: i,
            children: (0, B.jsx)(Fi, {
                delay: a,
                timeoutMs: r,
                children: e.children
            })
        })
    },
    mc = /mac|iphone|ipad|ipod/i,
    hc = () => () => void 0;

function gc() {
    return (0, c.useSyncExternalStore)(hc, () => mc.test(navigator.userAgent), () => !1)
}
var _c = [`cmd`, `command`, `meta`, `ctrl`, `control`, `alt`, `option`, `shift`],
    vc = [`ctrl`, `control`, `alt`, `option`, `shift`, `cmd`, `command`, `meta`],
    yc = {
        ctrl: `⌃`,
        control: `⌃`,
        alt: `⌥`,
        option: `⌥`,
        shift: `⇧`,
        cmd: `⌘`,
        command: `⌘`,
        meta: `⌘`
    },
    bc = {
        ctrl: `Ctrl`,
        control: `Ctrl`,
        alt: `Alt`,
        option: `Alt`,
        shift: `⇧`,
        cmd: `Ctrl`,
        command: `Ctrl`,
        meta: `Ctrl`
    };

function xc(e, t) {
    if (t) {
        if (e === `space`) return `␣`;
        if (e === `enter` || e === `return`) return `⏎`;
        if (e === `delete` || e === `backspace`) return `⌫`;
        if (e === `escape` || e === `esc`) return `Esc`;
        if (e === `tab`) return `⇥`;
        if (e === `up`) return `↑`;
        if (e === `down`) return `↓`;
        if (e === `left`) return `←`;
        if (e === `right`) return `→`
    } else {
        if (e === `space`) return `Space`;
        if (e === `enter` || e === `return`) return `Enter`;
        if (e === `delete` || e === `backspace`) return `Backspace`;
        if (e === `escape` || e === `esc`) return `Esc`;
        if (e === `tab`) return `Tab`;
        if (e === `up`) return `Up`;
        if (e === `down`) return `Down`;
        if (e === `left`) return `Left`;
        if (e === `right`) return `Right`
    }
    return /^f\d+$/.test(e) || e.length === 1 ? e.toUpperCase() : e.charAt(0).toUpperCase() + e.slice(1)
}

function Sc(e, t) {
    let n = e.toLowerCase().split(`+`).map(e => e.trim()),
        r = [],
        i = [];
    for (let e of n) _c.includes(e) ? r.push(e) : i.push(e);
    let a = e => vc.indexOf(!t && (e === `cmd` || e === `command` || e === `meta`) ? `ctrl` : e);
    return r.sort((e, t) => a(e) - a(t)), {
        modifiers: r,
        keys: i
    }
}

function Cc(e, t) {
    if (!e) return [];
    let {
        modifiers: n,
        keys: r
    } = Sc(e, t), i = t ? yc : bc;
    return [...n.map(e => i[e]), ...r.map(e => xc(e, t))]
}
var wc = {
    ctrl: `Control`,
    control: `Control`,
    alt: `Alt`,
    option: `Alt`,
    shift: `Shift`,
    enter: `Enter`,
    return: `Enter`,
    escape: `Escape`,
    esc: `Escape`,
    space: `Space`,
    tab: `Tab`,
    delete: `Backspace`,
    backspace: `Backspace`,
    up: `ArrowUp`,
    down: `ArrowDown`,
    left: `ArrowLeft`,
    right: `ArrowRight`,
    home: `Home`,
    end: `End`,
    pageup: `PageUp`,
    pagedown: `PageDown`,
    insert: `Insert`
};

function Tc(e, t) {
    let n = t ? `Meta` : `Control`,
        r = e => e === `cmd` || e === `command` || e === `meta` ? n : wc[e] ? ? (/^f\d+$/.test(e) ? e.toUpperCase() : e.length === 1 ? e : e.charAt(0).toUpperCase() + e.slice(1));
    return e.split(/\s+/).map(e => {
        let {
            modifiers: n,
            keys: i
        } = Sc(e, t);
        return [...n, ...i].map(r).join(`+`)
    }).join(` `)
}
var Ec = (0, c.createContext)(!1);

function Dc() {
    return (0, c.useContext)(Ec)
}
var Oc = `px-2 rounded-[6px] bg-fill-primary text-on-primary text-[13px]/[18px] shadow-sm`,
    kc = `origin-[var(--transform-origin)] transition-[opacity,scale] duration-snap ease-snap motion-reduce:transition-none data-[starting-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[ending-style]:scale-[0.98] data-[instant]:duration-0`,
    Ac = `inline-flex items-center whitespace-nowrap gap-2 h-6`,
    jc = `flex flex-col gap-0.5 max-w-[240px] whitespace-normal py-1.5`;

function Mc({
    keys: e
}) {
    let t = gc();
    return (0, B.jsx)(`span`, {
        className: `inline-flex items-center gap-[1px] opacity-70`,
        children: Cc(e, t).map((e, n) => [!t && n > 0 ? (0, B.jsx)(`span`, {
            "aria-hidden": !0,
            className: `opacity-60`,
            children: `+`
        }, `sep-${n}`) : null, (0, B.jsx)(`kbd`, {
            className: `inline-flex items-center justify-center [font-family:inherit]`,
            children: e
        }, n)])
    })
}

function Nc({
    content: e,
    detail: t,
    multiline: n,
    shortcut: r,
    side: i = `top`,
    align: o,
    collisionPadding: s,
    delay: l = 300,
    closeDelay: u,
    hoverable: d = !0,
    container: f,
    className: p,
    children: m
}) {
    let h = Me(),
        g = e != null && e !== ``,
        _ = (0, c.isValidElement)(m) ? (0, B.jsx)(Ks, {
            delay: l,
            closeDelay: u,
            render: m
        }) : (0, B.jsx)(Ks, {
            delay: l,
            closeDelay: u,
            render: e => (0, B.jsx)(`span`, { ...e,
                className: `inline-flex`,
                children: m
            })
        });
    return (0, B.jsxs)(Os, {
        disableHoverablePopup: !d,
        disabled: !g,
        children: [(0, B.jsx)(Ec.Provider, {
            value: g,
            children: _
        }), g && (0, B.jsx)(Xs, {
            container: f ? ? h,
            children: (0, B.jsx)(Pe, {
                children: (0, B.jsx)(uc, {
                    "data-cds": `Tooltip`,
                    className: `z-tooltip`,
                    side: i,
                    align: o,
                    sideOffset: 4,
                    collisionPadding: s,
                    children: (0, B.jsx)(fc, {
                        className: a(Oc, kc, n || t ? jc : Ac, p),
                        children: n || t ? (0, B.jsxs)(B.Fragment, {
                            children: [(0, B.jsxs)(`span`, {
                                className: `inline-flex min-w-0 items-center gap-2`,
                                children: [(0, B.jsx)(`span`, {
                                    className: `min-w-0 break-words`,
                                    children: e
                                }), r && (0, B.jsx)(Mc, {
                                    keys: r
                                })]
                            }), t && (0, B.jsx)(`span`, {
                                className: `break-words text-[11px]/[14px] opacity-70`,
                                children: t
                            })]
                        }) : (0, B.jsxs)(B.Fragment, {
                            children: [(0, B.jsx)(`span`, {
                                children: e
                            }), r && (0, B.jsx)(Mc, {
                                keys: r
                            })]
                        })
                    })
                })
            })
        })]
    })
}

function Pc({
    reason: e,
    side: t,
    align: n,
    multiline: r = !0,
    delay: i,
    collisionPadding: o,
    className: s,
    wrapperClassName: c,
    children: l
}) {
    let u = !!e;
    return (0, B.jsx)(Nc, {
        content: u ? e : void 0,
        side: t,
        align: n,
        multiline: r,
        delay: i,
        collisionPadding: o,
        className: s,
        children: (0, B.jsx)(`span`, {
            tabIndex: u ? 0 : -1,
            className: a(`inline-flex`, c),
            children: l
        })
    })
}

function Fc({
    delay: e = 600,
    closeDelay: t = 200,
    children: n
}) {
    return (0, B.jsx)(pc, {
        delay: e,
        closeDelay: t,
        children: n
    })
}

function Ic(e, t) {
    (0, c.useEffect)(() => {}, [])
}
var Lc = {
        s: `sm`,
        m: `md`,
        l: `lg`
    },
    Rc = {
        sm: {
            box: 12,
            stroke: 1.5
        },
        md: {
            box: 16,
            stroke: 1.75
        },
        lg: {
            box: 20,
            stroke: 2
        }
    };

function zc({
    size: e = `sm`,
    delay: t = 0,
    inheritColor: n = !1,
    className: r
}) {
    let [i, o] = (0, c.useState)(t <= 0);
    if ((0, c.useEffect)(() => {
            if (t <= 0) return;
            let e = window.setTimeout(() => o(!0), t);
            return () => window.clearTimeout(e)
        }, [t]), !i) return null;
    let s = Rc[Lc[e] ? ? e],
        l = n ? `currentColor` : `var(--cds-text-muted)`,
        u = n ? `color-mix(in srgb, currentColor 25%, transparent)` : `var(--cds-border)`,
        d = `calc(100% - ${s.stroke}px)`,
        f = `radial-gradient(farthest-side, transparent ${d}, #000 calc(${d} + 0.5px))`;
    return (0, B.jsxs)(`span`, {
        "data-cds": `Spinner`,
        className: a(`relative inline-block shrink-0 align-middle`, r),
        style: {
            width: s.box,
            height: s.box
        },
        "aria-hidden": !0,
        children: [(0, B.jsx)(`span`, {
            className: `absolute inset-0 rounded-full`,
            style: {
                border: `${s.stroke}px solid ${u}`
            }
        }), (0, B.jsx)(`span`, {
            className: `absolute inset-0 rounded-full animate-[spin_2s_linear_infinite]`,
            style: {
                background: `conic-gradient(transparent 40%, ${l})`,
                WebkitMask: f,
                mask: f
            }
        })]
    })
}

function Bc(e) {
    return typeof e == `string`
}
var Vc = hi(`cds-reset group/btn relative isolate inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap select-none cursor-[var(--cds-cursor-interactive)] aria-disabled:cursor-default data-[disabled]:cursor-default border-0 outline-none rounded h-control font-sans text-body font-medium [&:disabled:not([aria-busy])]:opacity-50 disabled:pointer-events-none transition-shadow duration-fast focus-visible:shadow-focus`, {
        variants: {
            variant: {
                primary: `text-on-primary`,
                secondary: `text-primary aria-pressed:text-accent`,
                ghost: `text-primary aria-pressed:text-accent`,
                danger: `text-on-danger`,
                brand: `text-on-brand`,
                onAccent: `text-on-accent focus-visible:!shadow-[0_0_0_2px_rgb(255_255_255/0.7)]`
            },
            iconOnly: {
                true: `aspect-square w-control px-0`,
                false: `px-md`
            }
        },
        defaultVariants: {
            variant: `secondary`,
            iconOnly: !1
        }
    }),
    Hc = `absolute -z-[1] rounded-[inherit] transition-colors duration-fast group-focus-visible/btn:shadow-[inset_0_0_0_1px_var(--cds-page-bg)]`,
    Uc = `inset-[0.5px]`,
    Wc = `cds-btn-squish`,
    Gc = `shadow-field`,
    Kc = `group-aria-pressed/btn:bg-accent group-hover/btn:group-aria-pressed/btn:bg-accent`,
    qc = hi(Hc, {
        variants: {
            variant: {
                primary: `bg-fill-primary group-hover/btn:bg-fill-primary-hover group-aria-expanded/btn:bg-fill-primary-hover`,
                secondary: `bg-fill-secondary group-hover/btn:bg-fill-secondary-hover group-aria-expanded/btn:bg-fill-secondary-hover`,
                ghost: `bg-transparent group-hover/btn:bg-fill-ghost-hover group-aria-expanded/btn:bg-fill-ghost-hover`,
                danger: `bg-fill-danger group-hover/btn:bg-fill-danger-hover group-aria-expanded/btn:bg-fill-danger-hover`,
                brand: `bg-fill-brand group-hover/btn:bg-fill-brand-hover group-aria-expanded/btn:bg-fill-brand-hover`,
                onAccent: `bg-white/20 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.3)] group-focus-visible/btn:!shadow-[inset_0_0_0_1px_rgb(255_255_255/0.3)] group-hover/btn:bg-white/30 group-aria-expanded/btn:bg-white/30`
            }
        },
        defaultVariants: {
            variant: `secondary`
        }
    }),
    Jc = (0, c.createContext)(null);

function Yc() {
    return (0, c.useContext)(Jc)
}
var Xc = {
        start: `rounded-r-none`,
        end: `rounded-l-none`,
        middle: `rounded-none`
    },
    Zc = (0, c.forwardRef)(({
        variant: e,
        size: t,
        icon: n,
        iconOnly: r = !1,
        iconPosition: i = `start`,
        tooltip: o,
        shortcut: s,
        busy: l = !1,
        pressed: u,
        joined: d,
        disabled: f,
        disabledReason: p,
        disabledReasonSide: m,
        type: h,
        href: g,
        routerOptions: _,
        target: v,
        rel: y,
        download: b,
        render: x,
        className: S,
        children: C,
        "aria-label": w,
        ...T
    }, E) => {
        let D = Yc();
        D && (t ? ? = D.size, d ? ? = D.joined, D.enforceVariant ? e = D.buttonVariant : e ? ? = D.buttonVariant);
        let O = e ? ? `secondary`,
            k = De(),
            A = gc(),
            j = (0, c.useRef)(null);
        Ic(j, `Button`);
        let M = t === `xs` ? `sm` : t === `lg` || k === `comfortable` ? `md` : `sm`,
            N = Dc(),
            P = r && w && o !== !1,
            F = typeof o == `string` ? o : w,
            I = a(Vc({
                variant: e,
                iconOnly: r
            }), d ? Xc[d] : ``, S),
            L = (0, B.jsxs)(B.Fragment, {
                children: [(0, B.jsx)(`span`, {
                    ref: j,
                    "aria-hidden": !0,
                    className: `${qc({variant:e})} ${!d&&(O===`primary`||O===`danger`||O===`brand`)?Uc:`inset-0`} ${Kc} ${d?``:Wc} ${O===`secondary`&&!d?Gc:``}`
                }), (0, B.jsx)(`span`, {
                    className: `inline-flex items-center gap-1 ${l?`invisible`:``}`,
                    children: r && n ? Bc(n) ? (0, B.jsx)(ui, {
                        name: n,
                        size: M
                    }) : n : (0, B.jsxs)(B.Fragment, {
                        children: [n && i === `start` && (Bc(n) ? (0, B.jsx)(ui, {
                            name: n,
                            size: M,
                            className: `-ml-1`
                        }) : (0, B.jsx)(`span`, {
                            className: `-ml-1 inline-flex`,
                            children: n
                        })), C, n && i === `end` && (Bc(n) ? (0, B.jsx)(ui, {
                            name: n,
                            size: M,
                            className: `-mr-1`
                        }) : (0, B.jsx)(`span`, {
                            className: `-mr-1 inline-flex`,
                            children: n
                        })), s && (0, B.jsx)(`span`, {
                            "aria-hidden": !0,
                            className: `ml-1 inline-flex items-center gap-[4px] text-caption opacity-70`,
                            children: s.split(/\s+/).flatMap(e => Cc(e, A)).map((e, t) => (0, B.jsx)(`kbd`, {
                                className: `[font-family:inherit]`,
                                children: e
                            }, t))
                        })]
                    })
                }), l && (0, B.jsx)(`span`, {
                    className: `absolute inset-0 grid place-items-center`,
                    children: (0, B.jsx)(zc, {
                        size: `sm`,
                        inheritColor: !0
                    })
                })]
            }),
            R = ve({
                href: g,
                routerOptions: _,
                target: v,
                rel: y,
                download: b,
                onClick: T.onClick
            }),
            ee = ce({
                render: x ? ? (g === void 0 ? (0, B.jsx)(`button`, {
                    type: h ? ? `button`,
                    disabled: f || l
                }) : (0, B.jsx)(`a`, {})),
                ref: E,
                props: {
                    "data-cds": `Button`,
                    ...be(t),
                    className: I,
                    "aria-busy": l || void 0,
                    "aria-pressed": g === void 0 ? u : void 0,
                    "aria-label": w,
                    "aria-keyshortcuts": s ? Tc(s, A) : void 0,
                    children: L,
                    ...T,
                    ...g === void 0 ? void 0 : R
                }
            }),
            te = P ? (0, B.jsx)(Nc, {
                content: N ? void 0 : F,
                children: ee
            }) : ee;
        return p === void 0 || g !== void 0 ? te : (0, B.jsx)(Pc, {
            side: m,
            reason: f ? p : void 0,
            children: te
        })
    });
Zc.displayName = `Button`;
export {
    Hi as $, re as $n, en as $t, Jo as A, st as An, cr as At, Q as B, Ge as Bn, wn as Bt, $o as C, Xe as Cn, Mr as Ct, Wo as D, tt as Dn, fr as Dt, Vo as E, at as En, lr as Et, Bo as F, nt as Fn, Pn as Ft, ra as G, V as Gn, vn as Gt, oa as H, Ue as Hn, Sn as Ht, Lo as I, ot as In, kn as It, Qi as J, be as Jn, mn as Jt, ia as K, Pe as Kn, pn as Kt, Io as L, He as Ln, Dn as Lt, Ho as M, Qe as Mn, gr as Mt, Go as N, $e as Nn, or as Nt, Ko as O, et as On, pr as Ot, Uo as P, qe as Pn, mr as Pt, Ki as Q, ve as Qn, dn as Qt, Mo as R, Ke as Rn, On as Rt, Qo as S, rt as Sn, Ar as St, Xo as T, Je as Tn, dr as Tt, sa as U, Ve as Un, yn as Ut, ma as V, We as Vn, Cn as Vt, aa as W, H as Wn, bn as Wt, Wi as X, Me as Xn, ln as Xt, Yi as Y, De as Yn, fn as Yt, Gi as Z, me as Zn, un as Zt, ws as _, bt as _n, Pr as _t, Nc as a, W as an, v as ar, Oi as at, ls as b, U as bn, Rr as bt, gc as c, K as cn, s as cr, xi as ct, oc as d, At as dn, Kr as dt, Qt as en, ee as er, Vi as et, rc as f, kt as fn, Gr as ft, Ls as g, yt as gn, jr as gt, Rs as h, xt as hn, Z as ht, Pc as i, J as in , x as ir, Di as it, Yo as j, Ze as jn, sr as jt, qo as k, ct as kn, ur as kt, lc as l, q as ln, hi as lt, zs as m, Tt as mn, Hr as mt, zc as n, tn as nn, S as nr, Bi as nt, Fc as o, Ht as on, d as or, Ci as ot, As as p, St as pn, Wr as pt, ea as q, Ne as qn, Y as qt, Ic as r, Xt as rn, C as rr, Li as rt, Cc as s, G as sn, u as sr, bi as st, Zc as t, Zt as tn, O as tr, zi as tt, cc as u, Bt as un, ui as ut, _s as v, mt as vn, Fr as vt, as as w, Ye as wn, X as wt, os as x, lt as xn, zr as xt, hs as y, pt as yn, Lr as yt, Eo as z, it as zn, Tn as zt
};
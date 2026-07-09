import {
    o as e
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    d as t
} from "./client-lite-BraEm36W.js";
import {
    t as n
} from "./react-BthIFXYf.js";
import {
    S as r,
    c as i,
    g as a,
    l as o,
    m as s,
    u as c
} from "./useOrg-DgFJtzUv.js";
import {
    t as l
} from "./jsx-runtime-DDrWIXeu.js";
import {
    $ as u,
    Bt as d,
    Ct as f,
    Gn as p,
    Gt as m,
    Hn as h,
    Ht as g,
    It as _,
    Jn as v,
    Jt as y,
    K as ee,
    Kt as b,
    Lt as te,
    Mt as ne,
    On as re,
    Rt as ie,
    St as ae,
    Vt as oe,
    Wn as x,
    Wt as se,
    Y as ce,
    _n as le,
    _t as ue,
    an as de,
    ar as fe,
    at as pe,
    bn as me,
    cr as S,
    dn as C,
    er as w,
    et as he,
    fn as T,
    gn as ge,
    gt as E,
    ht as D,
    ir as O,
    it as _e,
    ln as k,
    mt as ve,
    or as ye,
    pt as A,
    qn as j,
    qt as M,
    rn as be,
    rr as N,
    rt as xe,
    sn as P,
    tn as F,
    tr as Se,
    vt as Ce,
    wt as I,
    xt as we,
    zt as Te
} from "./Button-JbIB5F4R.js";
import {
    t as L
} from "./cn-qYiRd2Uw.js";
import {
    G as R
} from "./index-DxZs6uan.js";
import {
    O as z,
    k as B
} from "./connectrpc-BRKh2K0Y.js";
import {
    t as V
} from "./platform-BciTLfG8.js";
var H = e(n());

function Ee({
    controlled: e,
    default: t,
    name: n,
    state: r = `value`
}) {
    let {
        current: i
    } = H.useRef(e !== void 0), [a, o] = H.useState(t);
    return [i ? e : a, H.useCallback(e => {
        i || o(e)
    }, [])]
}
var De = H.createContext(void 0);

function U(e = !1) {
    let t = H.useContext(De);
    if (t === void 0 && !e) throw Error(S(16));
    return t
}

function W(e) {
    let {
        focusableWhenDisabled: t,
        disabled: n,
        composite: r = !1,
        tabIndex: i = 0,
        isNativeButton: a
    } = e, o = r && t !== !1, s = r && t === !1;
    return {
        props: H.useMemo(() => {
            let e = {
                onKeyDown(e) {
                    n && t && e.key !== `Tab` && e.preventDefault()
                }
            };
            return r || (e.tabIndex = i, !a && n && (e.tabIndex = t ? i : -1)), (a && (t || o) || !a && n) && (e[`aria-disabled`] = n), a && (!t || s) && (e.disabled = n), e
        }, [r, n, t, o, s, a, i])
    }
}

function Oe(e = {}) {
    let {
        disabled: t = !1,
        focusableWhenDisabled: n,
        tabIndex: r = 0,
        native: i = !0,
        composite: a
    } = e, o = H.useRef(null), s = U(!0), c = a ? ? s !== void 0, {
        props: l
    } = W({
        focusableWhenDisabled: n,
        disabled: t,
        composite: c,
        tabIndex: r,
        isNativeButton: i
    }), u = H.useCallback(() => {
        let e = o.current;
        ke(e) && c && t && l.disabled === void 0 && e.disabled && (e.disabled = !1)
    }, [t, l.disabled, c]);
    return x(u, [u]), {
        getButtonProps: H.useCallback((e = {}) => {
            let {
                onClick: n,
                onMouseDown: r,
                onKeyUp: a,
                onKeyDown: o,
                onPointerDown: s,
                ...u
            } = e;
            return Se({
                onClick(e) {
                    if (t) {
                        e.preventDefault();
                        return
                    }
                    n ? .(e)
                },
                onMouseDown(e) {
                    t || r ? .(e)
                },
                onKeyDown(e) {
                    if (t || (w(e), o ? .(e), e.baseUIHandlerPrevented)) return;
                    let r = e.target === e.currentTarget,
                        a = e.currentTarget,
                        s = ke(a),
                        l = !i && Ae(a),
                        u = r && (i ? s : !l),
                        d = e.key === `Enter`,
                        f = e.key === ` `,
                        p = a.getAttribute(`role`),
                        m = p ? .startsWith(`menuitem`) || p === `option` || p === `gridcell`;
                    if (r && c && f) {
                        if (e.defaultPrevented && m) return;
                        e.preventDefault(), l || i && s ? (a.click(), e.preventBaseUIHandler()) : u && (n ? .(e), e.preventBaseUIHandler());
                        return
                    }
                    u && (!i && (f || d) && e.preventDefault(), !i && d && n ? .(e))
                },
                onKeyUp(e) {
                    if (!t) {
                        if (w(e), a ? .(e), e.target === e.currentTarget && i && c && ke(e.currentTarget) && e.key === ` `) {
                            e.preventDefault();
                            return
                        }
                        e.baseUIHandlerPrevented || e.target === e.currentTarget && !i && !c && e.key === ` ` && n ? .(e)
                    }
                },
                onPointerDown(e) {
                    if (t) {
                        e.preventDefault();
                        return
                    }
                    s ? .(e)
                }
            }, i ? {
                type: `button`
            } : {
                role: `button`
            }, l, u)
        }, [t, l, c, i]),
        buttonRef: p(e => {
            o.current = e, u()
        })
    }
}

function ke(e) {
    return k(e) && e.tagName === `BUTTON`
}

function Ae(e) {
    return !!(e ? .tagName === `A` && e ? .href)
}
var G = `ArrowUp`,
    K = `ArrowDown`,
    q = `ArrowLeft`,
    je = `ArrowRight`,
    J = `Home`,
    Y = new Set([q, je]),
    X = new Set([q, je, J, `End`]),
    Me = new Set([G, K]),
    Ne = new Set([G, K, J, `End`]),
    Pe = new Set([...Y, ...Me]),
    Fe = new Set([...Pe, J, `End`]),
    Ie = `Shift`,
    Le = new Set([Ie, `Control`, `Alt`, `Meta`]);

function Re(e) {
    return k(e) && e.tagName === `INPUT`
}

function ze(e) {
    return !!(Re(e) && e.selectionStart != null || k(e) && e.tagName === `TEXTAREA`)
}

function Be(e, t, n, r) {
    if (!e || !t || !t.scrollTo) return;
    let i = e.scrollLeft,
        a = e.scrollTop,
        o = e.clientWidth < e.scrollWidth,
        s = e.clientHeight < e.scrollHeight;
    if (o && r !== `vertical`) {
        let r = Ve(e, t, `left`),
            a = He(e),
            o = He(t);
        n === `ltr` && (r + t.offsetWidth + o.scrollMarginRight > e.scrollLeft + e.clientWidth - a.scrollPaddingRight ? i = r + t.offsetWidth + o.scrollMarginRight - e.clientWidth + a.scrollPaddingRight : r - o.scrollMarginLeft < e.scrollLeft + a.scrollPaddingLeft && (i = r - o.scrollMarginLeft - a.scrollPaddingLeft)), n === `rtl` && (r - o.scrollMarginRight < e.scrollLeft + a.scrollPaddingLeft ? i = r - o.scrollMarginLeft - a.scrollPaddingLeft : r + t.offsetWidth + o.scrollMarginRight > e.scrollLeft + e.clientWidth - a.scrollPaddingRight && (i = r + t.offsetWidth + o.scrollMarginRight - e.clientWidth + a.scrollPaddingRight))
    }
    if (s && r !== `horizontal`) {
        let n = Ve(e, t, `top`),
            r = He(e),
            i = He(t);
        n - i.scrollMarginTop < e.scrollTop + r.scrollPaddingTop ? a = n - i.scrollMarginTop - r.scrollPaddingTop : n + t.offsetHeight + i.scrollMarginBottom > e.scrollTop + e.clientHeight - r.scrollPaddingBottom && (a = n + t.offsetHeight + i.scrollMarginBottom - e.clientHeight + r.scrollPaddingBottom)
    }
    e.scrollTo({
        left: i,
        top: a,
        behavior: `auto`
    })
}

function Ve(e, t, n) {
    let r = n === `left` ? `offsetLeft` : `offsetTop`,
        i = 0;
    for (; t.offsetParent && (i += t[r], t.offsetParent !== e);) t = t.offsetParent;
    return i
}

function He(e) {
    let t = getComputedStyle(e);
    return {
        scrollMarginTop: parseFloat(t.scrollMarginTop) || 0,
        scrollMarginRight: parseFloat(t.scrollMarginRight) || 0,
        scrollMarginBottom: parseFloat(t.scrollMarginBottom) || 0,
        scrollMarginLeft: parseFloat(t.scrollMarginLeft) || 0,
        scrollPaddingTop: parseFloat(t.scrollPaddingTop) || 0,
        scrollPaddingRight: parseFloat(t.scrollPaddingRight) || 0,
        scrollPaddingBottom: parseFloat(t.scrollPaddingBottom) || 0,
        scrollPaddingLeft: parseFloat(t.scrollPaddingLeft) || 0
    }
}
var Ue = 0;

function We(e, t = {}) {
    let {
        preventScroll: n = !1,
        sync: r = !1,
        shouldFocus: i
    } = t;
    cancelAnimationFrame(Ue);

    function a() {
        i && !i() || e ? .focus({
            preventScroll: n
        })
    }
    if (r) return a(), O;
    let o = requestAnimationFrame(a);
    return Ue = o, () => {
        Ue === o && (cancelAnimationFrame(o), Ue = 0)
    }
}
var Ge = {
        inert: new WeakMap,
        "aria-hidden": new WeakMap
    },
    Ke = `data-base-ui-inert`,
    qe = {
        inert: new WeakSet,
        "aria-hidden": new WeakSet
    },
    Z = new WeakMap,
    Je = 0;

function Ye(e) {
    return qe[e]
}

function Xe(e) {
    return e ? T(e) ? e.host : Xe(e.parentNode) : null
}
var Ze = (e, t) => t.map(t => {
        if (e.contains(t)) return t;
        let n = Xe(t);
        return e.contains(n) ? n : null
    }).filter(e => e != null),
    Qe = e => {
        let t = new Set;
        return e.forEach(e => {
            let n = e;
            for (; n && !t.has(n);) t.add(n), n = n.parentNode
        }), t
    },
    $e = (e, t, n) => {
        let r = [],
            i = e => {
                !e || n.has(e) || Array.from(e.children).forEach(e => {
                    de(e) !== `script` && (t.has(e) ? i(e) : r.push(e))
                })
            };
        return i(e), r
    };

function et(e, t, n, r, {
    mark: i = !0,
    markerIgnoreElements: a = []
}) {
    let o = r ? `inert` : n ? `aria-hidden` : null,
        s = null,
        c = null,
        l = Ze(t, e),
        u = i ? Ze(t, a) : [],
        d = new Set(u),
        f = i ? $e(t, Qe(l), new Set(l)).filter(e => !d.has(e)) : [],
        p = [],
        m = [];
    if (o) {
        let e = Ge[o],
            n = Ye(o);
        c = n, s = e;
        let r = Ze(t, Array.from(t.querySelectorAll(`[aria-live]`))),
            i = l.concat(r);
        $e(t, Qe(i), new Set(i)).forEach(t => {
            let r = t.getAttribute(o),
                i = r !== null && r !== `false`,
                a = (e.get(t) || 0) + 1;
            e.set(t, a), p.push(t), a === 1 && i && n.add(t), i || t.setAttribute(o, o === `inert` ? `` : `true`)
        })
    }
    return i && f.forEach(e => {
        let t = (Z.get(e) || 0) + 1;
        Z.set(e, t), m.push(e), t === 1 && e.setAttribute(Ke, ``)
    }), Je += 1, () => {
        s && p.forEach(e => {
            let t = (s.get(e) || 0) - 1;
            s.set(e, t), t || (!c ? .has(e) && o && e.removeAttribute(o), c ? .delete(e))
        }), i && m.forEach(e => {
            let t = (Z.get(e) || 0) - 1;
            Z.set(e, t), t || e.removeAttribute(Ke)
        }), --Je, Je || (Ge.inert = new WeakMap, Ge[`aria-hidden`] = new WeakMap, qe.inert = new WeakSet, qe[`aria-hidden`] = new WeakSet, Z = new WeakMap)
    }
}

function tt(e, t = {}) {
    let {
        ariaHidden: n = !1,
        inert: r = !1,
        mark: i = !0,
        markerIgnoreElements: a = []
    } = t, o = I(e[0]).body;
    return et(e, o, n, r, {
        mark: i,
        markerIgnoreElements: a
    })
}
var Q = l();

function nt(e, t) {
    let n = P(y(e));
    return e instanceof n.KeyboardEvent ? `keyboard` : e instanceof n.FocusEvent ? t || `keyboard` : `pointerType` in e ? e.pointerType || `keyboard` : `touches` in e ? `touch` : e instanceof n.MouseEvent ? t || (e.detail === 0 ? `keyboard` : `mouse`) : ``
}
var rt = 20,
    $ = [];

function it() {
    $ = $.filter(e => e.deref() ? .isConnected)
}

function at(e) {
    it(), e && de(e) !== `body` && ($.push(new WeakRef(e)), $.length > rt && ($ = $.slice(-20)))
}

function ot() {
    return it(), $[$.length - 1] ? .deref()
}

function st(e) {
    return e ? ae(e) ? e : f(e)[0] || e : null
}

function ct(e, t) {
    if (e.hasAttribute(`tabindex`) && !e.hasAttribute(`data-tabindex`) || !t.current.includes(`floating`) && !e.getAttribute(`role`) ? .includes(`dialog`)) return;
    let n = E(e).filter(e => {
            let t = e.getAttribute(`data-tabindex`) || ``;
            return ae(e) || e.hasAttribute(`data-tabindex`) && !t.startsWith(`-`)
        }),
        r = e.getAttribute(`tabindex`);
    t.current.includes(`floating`) || n.length === 0 ? r !== `0` && e.setAttribute(`tabindex`, `0`) : (r !== `-1` || e.hasAttribute(`data-tabindex`) && e.getAttribute(`data-tabindex`) !== `-1`) && (e.setAttribute(`tabindex`, `-1`), e.setAttribute(`data-tabindex`, `-1`))
}

function lt(e) {
    let {
        context: t,
        children: n,
        disabled: r = !1,
        initialFocus: i = !0,
        returnFocus: a = !0,
        restoreFocus: o = !1,
        modal: s = !0,
        closeOnFocusOut: c = !0,
        openInteractionType: l = ``,
        nextFocusableElement: h,
        previousFocusableElement: _,
        beforeContentFocusGuardRef: v,
        externalTree: de,
        getInsideElements: fe
    } = e, S = `rootStore` in t ? t.rootStore : t, C = S.useState(`open`), w = S.useState(`domReferenceElement`), T = S.useState(`floatingElement`), {
        events: ge,
        dataRef: E
    } = S.context, O = p(() => E.current.floatingContext ? .nodeId), _e = i === !1, j = se(w) && _e, N = H.useRef([`content`]), P = ve(i), F = ve(a), Se = ve(l), L = ee(de), R = ce(), z = H.useRef(!1), B = H.useRef(!1), V = H.useRef(!1), Ee = H.useRef(null), De = H.useRef(``), U = H.useRef(``), W = H.useRef(null), Oe = H.useRef(null), ke = ye(W, v, R ? .beforeInsideRef), Ae = ye(Oe, R ? .afterInsideRef), G = pe(), K = pe(), q = le(), je = R != null, J = g(T), Y = p((e = J) => e ? f(e) : []), X = p(() => fe ? .().filter(e => e != null) ? ? []);
    H.useEffect(() => {
        if (r || !s) return;

        function e(e) {
            e.key === `Tab` && M(J, b(I(J))) && Y().length === 0 && !j && Te(e)
        }
        return D(I(J), `keydown`, e)
    }, [r, J, s, j, Y]), H.useEffect(() => {
        if (r || !C) return;
        let e = I(J);

        function t() {
            V.current = !1
        }

        function n(e) {
            let t = y(e),
                n = X();
            V.current = !(M(T, t) || M(w, t) || M(R ? .portalNode, t) || n.some(e => e === t || M(e, t))), U.current = e.pointerType || `keyboard`, t ? .closest(`[data-base-ui-click-trigger]`) && (B.current = !0)
        }

        function i() {
            U.current = `keyboard`
        }
        return xe(D(e, `pointerdown`, n, !0), D(e, `pointerup`, t, !0), D(e, `pointercancel`, t, !0), D(e, `keydown`, i, !0))
    }, [r, T, w, J, C, R, X]), H.useEffect(() => {
        if (r || !c) return;
        let e = I(J);

        function t() {
            B.current = !0, K.start(0, () => {
                B.current = !1
            })
        }

        function n(e) {
            let t = y(e);
            ae(t) && (Ee.current = t)
        }

        function i(t) {
            let n = t.relatedTarget,
                r = t.currentTarget,
                i = y(t);
            queueMicrotask(() => {
                let a = O(),
                    c = S.context.triggerElements,
                    l = X(),
                    f = n ? .hasAttribute(u(`focus-guard`)) && [W.current, Oe.current, R ? .beforeInsideRef.current, R ? .afterInsideRef.current, R ? .beforeOutsideRef.current, R ? .afterOutsideRef.current, A(_), A(h)].includes(n),
                    p = !(M(w, n) || M(T, n) || M(n, T) || M(R ? .portalNode, n) || l.some(e => e === n || M(e, n)) || n != null && c.hasElement(n) || c.hasMatchingElement(e => M(e, n)) || f || L && (oe(L.nodesRef.current, a).find(e => M(e.context ? .elements.floating, n) || M(e.context ? .elements.domReference, n)) || d(L.nodesRef.current, a).find(e => [e.context ? .elements.floating, g(e.context ? .elements.floating)].includes(n) || e.context ? .elements.domReference === n)));
                if (r === w && J && ct(J, N), o && r !== w && !ne(i) && b(e) === e.body) {
                    if (k(J) && (J.focus(), o === `popup`)) {
                        q.request(() => {
                            J.focus()
                        });
                        return
                    }
                    let e = Y(),
                        t = Ee.current,
                        n = (t && e.includes(t) ? t : null) || e[e.length - 1] || J;
                    k(n) && n.focus()
                }
                if (E.current.insideReactTree) {
                    E.current.insideReactTree = !1;
                    return
                }(j || !s) && n && p && !B.current && (j || n !== ot()) && (z.current = !0, S.setOpen(!1, me(re, t)))
            })
        }

        function a() {
            V.current || (E.current.insideReactTree = !0, G.start(0, () => {
                E.current.insideReactTree = !1
            }))
        }
        let l = k(w) ? w : null;
        if (!(!T && !l)) return xe(l && D(l, `focusout`, i), l && D(l, `pointerdown`, t), T && D(T, `focusin`, n), T && D(T, `focusout`, i), T && R && D(T, `focusout`, a, !0))
    }, [r, w, T, J, s, L, R, S, c, o, Y, j, O, N, E, G, K, q, h, _, X]), H.useEffect(() => {
        if (r || !T || !C) return;
        let e = Array.from(R ? .portalNode ? .querySelectorAll(`[${u(`portal`)}]`) || []),
            t = (L ? d(L.nodesRef.current, O()) : []).find(e => se(e.context ? .elements.domReference || null)) ? .context ? .elements.domReference,
            n = tt([T, ...e, W.current, Oe.current, R ? .beforeOutsideRef.current, R ? .afterOutsideRef.current, ...X(), t, A(_), A(h), j ? w : null].filter(e => e != null), {
                ariaHidden: s || j,
                mark: !1
            }),
            i = tt([T, ...e].filter(e => e != null));
        return () => {
            i(), n()
        }
    }, [C, r, w, T, s, R, j, L, O, h, _, X]), x(() => {
        if (!C || r || !k(J)) return;
        let e = I(J),
            t = b(e);
        queueMicrotask(() => {
            let n = P.current,
                r = typeof n == `function` ? n(Se.current || ``) : n;
            if (r === void 0 || r === !1 || M(J, t)) return;
            let i = null,
                a = () => (i ? ? = Y(J), i[0] || J),
                o;
            o = r === !0 || r === null ? a() : A(r), o || = a();
            let s = M(J, b(e));
            We(o, {
                preventScroll: o === J,
                shouldFocus() {
                    if (s) return !0;
                    let t = b(e);
                    return !(t !== o && M(J, t))
                }
            })
        })
    }, [r, C, J, Y, P, Se]), x(() => {
        if (r || !J) return;
        let e = I(J);
        at(b(e));

        function t(e) {
            if (e.open || (De.current = nt(e.nativeEvent, U.current)), e.reason === `trigger-hover` && e.nativeEvent.type === `mouseleave` && (z.current = !0), e.reason === `outside-press`)
                if (e.nested) z.current = !1;
                else if (te(e.nativeEvent) || ie(e.nativeEvent)) z.current = !1;
            else {
                let e = !1;
                I(J).createElement(`div`).focus({
                    get preventScroll() {
                        return e = !0, !1
                    }
                }), e ? z.current = !1 : z.current = !0
            }
        }
        ge.on(`openchange`, t);

        function n() {
            let e = F.current,
                t = typeof e == `function` ? e(De.current) : e;
            if (t === void 0 || t === !1) return null;
            if (t === null && (t = !0), typeof t == `boolean`) return w ? .isConnected ? w : ot() || null;
            let n = w ? .isConnected ? w : ot();
            return A(t) || n || null
        }
        return () => {
            ge.off(`openchange`, t);
            let r = b(e),
                i = X(),
                a = M(T, r) || i.some(e => e === r || M(e, r)) || L && oe(L.nodesRef.current, O(), !1).some(e => M(e.context ? .elements.floating, r)),
                o = F.current,
                s = n();
            queueMicrotask(() => {
                let t = st(s),
                    n = typeof o != `boolean`;
                o && !z.current && k(t) && (!(!n && t !== r && r !== e.body) || a) && t.focus({
                    preventScroll: !0
                }), z.current = !1
            })
        }
    }, [r, T, J, F, ge, L, w, O, X]), x(() => {
        if (!be || C || !T) return;
        let e = b(I(T));
        !k(e) || !m(e) || M(T, e) && e.blur()
    }, [C, T]), x(() => {
        if (!(r || !R)) return R.setFocusManagerState({
            modal: s,
            closeOnFocusOut: c,
            open: C,
            onOpenChange: S.setOpen,
            domReference: w
        }), () => {
            R.setFocusManagerState(null)
        }
    }, [r, R, s, C, S, c, w]), x(() => {
        if (!(r || !J)) return ct(J, N), () => {
            queueMicrotask(it)
        }
    }, [r, J, N]);
    let Me = !r && (s ? !j : !0) && (je || s);
    return (0, Q.jsxs)(H.Fragment, {
        children: [Me && (0, Q.jsx)(he, {
            "data-type": `inside`,
            ref: ke,
            onFocus: e => {
                if (s) {
                    let e = Y();
                    We(e[e.length - 1])
                } else R ? .portalNode && (z.current = !1, we(e, R.portalNode) ? ue(w) ? .focus() : A(_ ? ? R.beforeOutsideRef) ? .focus())
            }
        }), n, Me && (0, Q.jsx)(he, {
            "data-type": `inside`,
            ref: Ae,
            onFocus: e => {
                s ? We(Y()[0]) : R ? .portalNode && (c && (z.current = !0), we(e, R.portalNode) ? Ce(w) ? .focus() : A(h ? ? R.afterOutsideRef) ? .focus())
            }
        })]
    })
}

function ut(e, t = {}) {
    let {
        enabled: n = !0,
        event: r = `click`,
        toggle: i = !0,
        ignoreMouse: a = !1,
        stickIfOpen: o = !0,
        touchOpenDelay: s = 0,
        reason: c = h
    } = t, l = `rootStore` in e ? e.rootStore : e, u = l.context.dataRef, d = H.useRef(void 0), f = le(), p = pe(), g = H.useMemo(() => {
        function e(e, t, n, r) {
            let i = me(c, t, n);
            e && r === `touch` && s > 0 ? p.start(s, () => {
                l.setOpen(!0, i)
            }) : l.setOpen(e, i)
        }

        function t(e, t, n) {
            let r = u.current.openEvent,
                a = l.select(`domReferenceElement`) !== t;
            return e && a || !e || !i ? !0 : r && o ? !n(r.type) : !1
        }
        return {
            onPointerDown(e) {
                d.current = e.pointerType
            },
            onMouseDown(n) {
                let i = d.current,
                    o = n.nativeEvent,
                    s = l.select(`open`);
                if (n.button !== 0 || r === `click` || _(i, !0) && a) return;
                let c = t(s, n.currentTarget, e => e === `click` || e === `mousedown`),
                    u = y(o);
                if (m(u)) {
                    e(c, o, u, i);
                    return
                }
                let p = n.currentTarget;
                f.request(() => {
                    e(c, o, p, i)
                })
            },
            onClick(n) {
                if (r === `mousedown-only`) return;
                let i = d.current;
                if (r === `mousedown` && i) {
                    d.current = void 0;
                    return
                }
                _(i, !0) && a || e(t(l.select(`open`), n.currentTarget, e => e === `click` || e === `mousedown` || e === `keydown` || e === `keyup`), n.nativeEvent, n.currentTarget, i)
            },
            onKeyDown() {
                d.current = void 0
            }
        }
    }, [u, r, a, c, l, o, i, f, p, s]);
    return H.useMemo(() => n ? {
        reference: g
    } : N, [n, g])
}

function dt(e) {
    return fe(19) ? e : e ? `true` : void 0
}
var ft = {
        neutral: `bg-neutral text-secondary`,
        accent: `bg-accent text-accent`,
        success: `bg-success text-success`,
        warning: `bg-warning text-warning`,
        danger: `bg-danger text-danger`,
        pro: `bg-pro text-pro`
    },
    pt = (0, H.forwardRef)(({
        variant: e,
        size: t,
        truncate: n,
        className: r,
        children: i,
        ...a
    }, o) => {
        let s = e ? ? `accent`;
        return (0, Q.jsx)(`span`, {
            ref: o,
            "data-cds": `Badge`,
            ...t === `xxs` ? {
                "data-step": `1`
            } : v(t),
            ...a,
            className: L(`inline-flex items-center align-middle h-control-nested rounded-chip px-sm font-sans text-caption font-medium leading-tight`, n ? `min-w-0` : `shrink-0`, ft[s], r),
            children: n ? (0, Q.jsx)(`span`, {
                className: `truncate`,
                children: i
            }) : i
        })
    });
pt.displayName = `Badge`;

function mt(e, t) {
    let n = H.useRef(e),
        r = p(t);
    x(() => {
        n.current !== e && r(n.current)
    }, [e, r]), x(() => {
        n.current = e
    }, [e])
}

function ht(e) {
    let t = H.useRef(``),
        n = H.useCallback(n => {
            n.defaultPrevented || (t.current = n.pointerType, e(n, n.pointerType))
        }, [e]);
    return {
        onClick: H.useCallback(n => {
            if (n.detail === 0) {
                e(n, `keyboard`);
                return
            }
            `pointerType` in n ? e(n, n.pointerType) : e(n, t.current), t.current = ``
        }, [e]),
        onPointerDown: n
    }
}

function gt(e, t) {
    let {
        onClick: n,
        onPointerDown: r
    } = ht(p((n, r) => {
        (typeof e == `function` ? e() : e) || t(r || (F ? `touch` : ``))
    }));
    return H.useMemo(() => ({
        onClick: n,
        onPointerDown: r
    }), [n, r])
}

function _t(e) {
    let [t, n] = H.useState(null), r = gt(e, n);
    return mt(e, t => {
        t && !e && n(null)
    }), H.useMemo(() => ({
        openMethod: t,
        triggerProps: r
    }), [t, r])
}
var vt = H.forwardRef(function(e, t) {
        let {
            cutout: n,
            ...r
        } = e, i;
        if (n) {
            let e = n.getBoundingClientRect();
            i = `polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,${e.left}px ${e.top}px,${e.left}px ${e.bottom}px,${e.right}px ${e.bottom}px,${e.right}px ${e.top}px,${e.left}px ${e.top}px)`
        }
        return (0, Q.jsx)(`div`, {
            ref: t,
            role: `presentation`,
            "data-base-ui-inert": ``,
            ...r,
            style: {
                position: `fixed`,
                inset: 0,
                userSelect: `none`,
                WebkitUserSelect: `none`,
                clipPath: i
            }
        })
    }),
    yt = {},
    bt = {},
    xt = ``;

function St(e) {
    if (typeof document > `u`) return !1;
    let t = I(e);
    return P(t).innerWidth - t.documentElement.clientWidth > 0
}

function Ct(e) {
    if (!(typeof CSS < `u` && CSS.supports && CSS.supports(`scrollbar-gutter`, `stable`)) || typeof document > `u`) return !1;
    let t = I(e),
        n = t.documentElement,
        r = t.body,
        i = C(n) ? n : r,
        a = i.style.overflowY,
        o = n.style.scrollbarGutter;
    n.style.scrollbarGutter = `stable`, i.style.overflowY = `scroll`;
    let s = i.offsetWidth;
    i.style.overflowY = `hidden`;
    let c = i.offsetWidth;
    return i.style.overflowY = a, n.style.scrollbarGutter = o, s === c
}

function wt(e) {
    let t = I(e),
        n = t.documentElement,
        r = t.body,
        i = C(n) ? n : r,
        a = {
            overflowY: i.style.overflowY,
            overflowX: i.style.overflowX
        };
    return Object.assign(i.style, {
        overflowY: `hidden`,
        overflowX: `hidden`
    }), () => {
        Object.assign(i.style, a)
    }
}

function Tt(e) {
    let t = I(e),
        n = t.documentElement,
        r = t.body,
        i = P(n),
        a = 0,
        o = 0,
        s = !1,
        c = ge.create();
    if (be && (i.visualViewport ? .scale ? ? 1) !== 1) return () => {};

    function l() {
        let t = i.getComputedStyle(n),
            c = i.getComputedStyle(r),
            l = (t.scrollbarGutter || ``).includes(`both-edges`) ? `stable both-edges` : `stable`;
        a = n.scrollTop, o = n.scrollLeft, yt = {
            scrollbarGutter: n.style.scrollbarGutter,
            overflowY: n.style.overflowY,
            overflowX: n.style.overflowX
        }, xt = n.style.scrollBehavior, bt = {
            position: r.style.position,
            height: r.style.height,
            width: r.style.width,
            boxSizing: r.style.boxSizing,
            overflowY: r.style.overflowY,
            overflowX: r.style.overflowX,
            scrollBehavior: r.style.scrollBehavior
        };
        let u = n.scrollHeight > n.clientHeight,
            d = n.scrollWidth > n.clientWidth,
            f = t.overflowY === `scroll` || c.overflowY === `scroll`,
            p = t.overflowX === `scroll` || c.overflowX === `scroll`,
            m = Math.max(0, i.innerWidth - r.clientWidth),
            h = Math.max(0, i.innerHeight - r.clientHeight),
            g = parseFloat(c.marginTop) + parseFloat(c.marginBottom),
            _ = parseFloat(c.marginLeft) + parseFloat(c.marginRight),
            v = C(n) ? n : r;
        if (s = Ct(e), s) {
            n.style.scrollbarGutter = l, v.style.overflowY = `hidden`, v.style.overflowX = `hidden`;
            return
        }
        Object.assign(n.style, {
            scrollbarGutter: l,
            overflowY: `hidden`,
            overflowX: `hidden`
        }), (u || f) && (n.style.overflowY = `scroll`), (d || p) && (n.style.overflowX = `scroll`), Object.assign(r.style, {
            position: `relative`,
            height: g || h ? `calc(100dvh - ${g+h}px)` : `100dvh`,
            width: _ || m ? `calc(100vw - ${_+m}px)` : `100vw`,
            boxSizing: `border-box`,
            overflow: `hidden`,
            scrollBehavior: `unset`
        }), r.scrollTop = a, r.scrollLeft = o, n.setAttribute(`data-base-ui-scroll-locked`, ``), n.style.scrollBehavior = `unset`
    }

    function u() {
        Object.assign(n.style, yt), Object.assign(r.style, bt), s || (n.scrollTop = a, n.scrollLeft = o, n.removeAttribute(`data-base-ui-scroll-locked`), n.style.scrollBehavior = xt)
    }

    function d() {
        u(), c.request(l)
    }
    l();
    let f = D(i, `resize`, d);
    return () => {
        c.cancel(), u(), typeof i.removeEventListener == `function` && f()
    }
}
var Et = new class {
    lockCount = 0;
    restore = null;
    timeoutLock = _e.create();
    timeoutUnlock = _e.create();
    acquire(e) {
        return this.lockCount += 1, this.lockCount === 1 && this.restore === null && this.timeoutLock.start(0, () => this.lock(e)), this.release
    }
    release = () => {
        --this.lockCount, this.lockCount === 0 && this.restore && this.timeoutUnlock.start(0, this.unlock)
    };
    unlock = () => {
        this.lockCount === 0 && this.restore && (this.restore ? .(), this.restore = null)
    };
    lock(e) {
        if (this.lockCount === 0 || this.restore !== null) return;
        let t = I(e).documentElement,
            n = P(t).getComputedStyle(t).overflowY;
        if (n === `hidden` || n === `clip`) {
            this.restore = O;
            return
        }
        let r = F || !St(e);
        this.restore = r ? wt(e) : Tt(e)
    }
};

function Dt(e = !0, t = null) {
    x(() => {
        if (e) return Et.acquire(t)
    }, [e, t])
}
var Ot = {
    panel: `bg-surface-2 shadow-panel-sm`,
    popover: `bg-surface-3 shadow-panel`
};

function kt(e) {
    return `rounded-card ${Ot[e]}`
}
var At = (0, H.forwardRef)(({
    elevation: e,
    className: t,
    ...n
}, r) => (0, Q.jsx)(`div`, {
    ref: r,
    "data-cds": `Surface`,
    "data-surface": e,
    ...n,
    className: L(kt(e), t)
}));
At.displayName = `Surface`;

function jt(e) {
    let {
        resolved: t
    } = R();
    return (0, Q.jsx)(j, {
        mode: t,
        ...e
    })
}

function Mt(e, n) {
    if (!e) return;
    let r = n.replace(/\[[^\]]+\]/g, ``).trim();
    c(r), fetch(z() + `v1/design/model-selection`, {
        method: `POST`,
        credentials: `include`,
        keepalive: !0,
        headers: B(),
        body: JSON.stringify({
            model: r
        })
    }).then(e => t(`design.model_selection_persisted`, {
        attrs: {
            ok: e.ok,
            status: e.status
        }
    }), () => t(`design.model_selection_persisted`, {
        attrs: {
            ok: !1,
            status: 0
        }
    }))
}

function Nt() {
    let e = s();
    return (0, H.useCallback)(t => Mt(e, t), [e])
}
var Pt = !1;

function Ft() {
    Pt = !0
}

function It() {
    let [e, t] = (0, H.useState)(``), n = r(), s = a(), c = Nt();
    (0, H.useEffect)(() => {
        s === null || Pt || (Pt = !0, V.updateSettings({
            model: s
        }))
    }, [s]);
    let l = o(e) || s || `claude-opus-4-8`,
        u = n ? .find(e => e.id === l) ? .label || i(l),
        d = (0, H.useCallback)((e, n) => {
            let r = e.trim();
            t(r), Ft(), V.updateSettings({
                model: r
            }), n ? .persist !== !1 && c(r)
        }, [c]);
    return {
        presets: n,
        storedModel: e,
        settingsLoaded: n !== null,
        serverDefault: s,
        effectiveModel: l,
        effectiveModelLabel: u,
        setModel: d
    }
}
export {
    Be as A, Y as C, Me as D, Ie as E, De as M, U as N, Ne as O, Ee as P, J as S, Le as T, Pe as _, kt as a, G as b, _t as c, pt as d, dt as f, K as g, We as h, jt as i, Oe as j, ze as k, gt as l, lt as m, It as n, Dt as o, ut as p, Nt as r, vt as s, Ft as t, mt as u, q as v, X as w, Fe as x, je as y
};
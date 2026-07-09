import {
    o as e
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    t
} from "./react-BthIFXYf.js";
import {
    t as n
} from "./jsx-runtime-DDrWIXeu.js";
var r = n(),
    i = e(t(), 1),
    a = (0, i.createContext)({});

function o(e) {
    let t = (0, i.useRef)(null);
    return t.current === null && (t.current = e()), t.current
}
var s = typeof window < `u` ? i.useLayoutEffect : i.useEffect,
    c = (0, i.createContext)(null),
    l = e => typeof e == `object` && !!e;

function u(e) {
    return l(e) && `offsetHeight` in e && !(`ownerSVGElement` in e)
}
var d = (0, i.createContext)({
    transformPagePoint: e => e,
    isStatic: !1,
    reducedMotion: `never`
});

function f(e, t) {
    if (typeof e == `function`) return e(t);
    e != null && (e.current = t)
}

function p(...e) {
    return t => {
        let n = !1,
            r = e.map(e => {
                let r = f(e, t);
                return !n && typeof r == `function` && (n = !0), r
            });
        if (n) return () => {
            for (let t = 0; t < r.length; t++) {
                let n = r[t];
                typeof n == `function` ? n() : f(e[t], null)
            }
        }
    }
}

function m(...e) {
    return i.useCallback(p(...e), e)
}
var h = class extends i.Component {
    getSnapshotBeforeUpdate(e) {
        let t = this.props.childRef.current;
        if (u(t) && e.isPresent && !this.props.isPresent && this.props.pop !== !1) {
            let e = t.offsetParent,
                n = u(e) && e.offsetWidth || 0,
                r = u(e) && e.offsetHeight || 0,
                i = getComputedStyle(t),
                a = this.props.sizeRef.current;
            a.height = parseFloat(i.height), a.width = parseFloat(i.width), a.top = t.offsetTop, a.left = t.offsetLeft, a.right = n - a.width - a.left, a.bottom = r - a.height - a.top, a.direction = i.direction
        }
        return null
    }
    componentDidUpdate() {}
    render() {
        return this.props.children
    }
};

function g({
    children: e,
    isPresent: t,
    anchorX: n,
    anchorY: a,
    root: o,
    pop: s
}) {
    let c = (0, i.useId)(),
        l = (0, i.useRef)(null),
        u = (0, i.useRef)({
            width: 0,
            height: 0,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            direction: `ltr`
        }),
        {
            nonce: f
        } = (0, i.useContext)(d),
        p = m(l, e.props ? .ref ? ? e ? .ref);
    return (0, i.useInsertionEffect)(() => {
        let {
            width: e,
            height: r,
            top: i,
            left: d,
            right: p,
            bottom: m,
            direction: h
        } = u.current;
        if (t || s === !1 || !l.current || !e || !r) return;
        let g = h === `rtl`,
            _ = n === `left` ? g ? `right: ${p}` : `left: ${d}` : g ? `left: ${d}` : `right: ${p}`,
            v = a === `bottom` ? `bottom: ${m}` : `top: ${i}`;
        l.current.dataset.motionPopId = c;
        let y = document.createElement(`style`);
        f && (y.nonce = f);
        let b = o ? ? document.head;
        return b.appendChild(y), y.sheet && y.sheet.insertRule(`
          [data-motion-pop-id="${c}"] {
            position: absolute !important;
            width: ${e}px !important;
            height: ${r}px !important;
            ${_}px !important;
            ${v}px !important;
          }
        `), () => {
            l.current ? .removeAttribute(`data-motion-pop-id`), b.contains(y) && b.removeChild(y)
        }
    }, [t]), (0, r.jsx)(h, {
        isPresent: t,
        childRef: l,
        sizeRef: u,
        pop: s,
        children: s === !1 ? e : i.cloneElement(e, {
            ref: p
        })
    })
}
var _ = ({
    children: e,
    initial: t,
    isPresent: n,
    onExitComplete: a,
    custom: s,
    presenceAffectsLayout: l,
    mode: u,
    anchorX: d,
    anchorY: f,
    root: p
}) => {
    let m = o(v),
        h = (0, i.useId)(),
        _ = !0,
        y = (0, i.useMemo)(() => (_ = !1, {
            id: h,
            initial: t,
            isPresent: n,
            custom: s,
            onExitComplete: e => {
                m.set(e, !0);
                for (let e of m.values())
                    if (!e) return;
                a && a()
            },
            register: e => (m.set(e, !1), () => m.delete(e))
        }), [n, m, a]);
    return l && _ && (y = { ...y
    }), (0, i.useMemo)(() => {
        m.forEach((e, t) => m.set(t, !1))
    }, [n]), i.useEffect(() => {
        !n && !m.size && a && a()
    }, [n]), e = (0, r.jsx)(g, {
        pop: u === `popLayout`,
        isPresent: n,
        anchorX: d,
        anchorY: f,
        root: p,
        children: e
    }), (0, r.jsx)(c.Provider, {
        value: y,
        children: e
    })
};

function v() {
    return new Map
}

function y(e = !0) {
    let t = (0, i.useContext)(c);
    if (t === null) return [!0, null];
    let {
        isPresent: n,
        onExitComplete: r,
        register: a
    } = t, o = (0, i.useId)();
    (0, i.useEffect)(() => {
        if (e) return a(o)
    }, [e]);
    let s = (0, i.useCallback)(() => e && r && r(o), [o, r, e]);
    return !n && r ? [!1, s] : [!0]
}
var b = e => e.key || ``;

function x(e) {
    let t = [];
    return i.Children.forEach(e, e => {
        (0, i.isValidElement)(e) && t.push(e)
    }), t
}
var S = ({
    children: e,
    custom: t,
    initial: n = !0,
    onExitComplete: c,
    presenceAffectsLayout: l = !0,
    mode: u = `sync`,
    propagate: d = !1,
    anchorX: f = `left`,
    anchorY: p = `top`,
    root: m
}) => {
    let [h, g] = y(d), v = (0, i.useMemo)(() => x(e), [e]), S = d && !h ? [] : v.map(b), C = (0, i.useRef)(!0), w = (0, i.useRef)(v), T = o(() => new Map), E = (0, i.useRef)(new Set), [D, O] = (0, i.useState)(v), [k, A] = (0, i.useState)(v);
    s(() => {
        C.current = !1, w.current = v;
        for (let e = 0; e < k.length; e++) {
            let t = b(k[e]);
            S.includes(t) ? (T.delete(t), E.current.delete(t)) : T.get(t) !== !0 && T.set(t, !1)
        }
    }, [k, S.length, S.join(`-`)]);
    let j = [];
    if (v !== D) {
        let e = [...v];
        for (let t = 0; t < k.length; t++) {
            let n = k[t],
                r = b(n);
            S.includes(r) || (e.splice(t, 0, n), j.push(n))
        }
        return u === `wait` && j.length && (e = j), A(x(e)), O(v), null
    }
    let {
        forceRender: M
    } = (0, i.useContext)(a);
    return (0, r.jsx)(r.Fragment, {
        children: k.map(e => {
            let i = b(e),
                a = d && !h ? !1 : v === k || S.includes(i);
            return (0, r.jsx)(_, {
                isPresent: a,
                initial: !C.current || n ? void 0 : !1,
                custom: t,
                presenceAffectsLayout: l,
                mode: u,
                root: m,
                onExitComplete: a ? void 0 : () => {
                    if (E.current.has(i)) return;
                    if (T.has(i)) E.current.add(i), T.set(i, !0);
                    else return;
                    let e = !0;
                    T.forEach(t => {
                        t || (e = !1)
                    }), e && (M ? .(), A(w.current), d && g ? .(), c && c())
                },
                anchorX: f,
                anchorY: p,
                children: e
            }, i)
        })
    })
};
export {
    l as a, o as c, u as i, a as l, y as n, c as o, d as r, s, S as t
};
import {
    o as e
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    t
} from "./react-BthIFXYf.js";
import {
    t as n
} from "./jsx-runtime-DDrWIXeu.js";
import {
    $n as r,
    Jn as i,
    Ln as a,
    Wn as o,
    bn as s,
    cr as c,
    i as l,
    nt as u,
    or as ee,
    rr as te,
    sn as ne,
    tr as re,
    tt as ie,
    vn as d
} from "./Button-JbIB5F4R.js";
import {
    t as f
} from "./cn-qYiRd2Uw.js";
import {
    P as p,
    j as m,
    u as h
} from "./useModelSelection-Gs9zlsOR.js";
import {
    a as g,
    f as _,
    i as v,
    l as ae,
    n as oe,
    o as se,
    t as ce
} from "./useLabelableId-qsMIxjgj.js";
var y = e(t()),
    b = y.createContext(void 0);

function x() {
    let e = y.useContext(b);
    if (e === void 0) throw Error(c(63));
    return e
}
var S = function(e) {
        return e.checked = `data-checked`, e.unchecked = `data-unchecked`, e.disabled = `data-disabled`, e.readonly = `data-readonly`, e.required = `data-required`, e.valid = `data-valid`, e.invalid = `data-invalid`, e.touched = `data-touched`, e.dirty = `data-dirty`, e.filled = `data-filled`, e.focused = `data-focused`, e
    }({}),
    C = { ..._,
        checked(e) {
            return e ? {
                [S.checked]: ``
            } : {
                [S.unchecked]: ``
            }
        }
    },
    w = n(),
    T = y.forwardRef(function(e, t) {
        let {
            checked: n,
            className: i,
            defaultChecked: c,
            "aria-labelledby": l,
            form: f,
            id: _,
            inputRef: x,
            name: S,
            nativeButton: T = !1,
            onCheckedChange: E,
            readOnly: D = !1,
            required: O = !1,
            disabled: k = !1,
            render: A,
            uncheckedValue: j,
            value: M,
            style: le,
            ...N
        } = e, {
            clearErrors: P
        } = g(), {
            state: F,
            setTouched: I,
            setDirty: L,
            validityData: R,
            setFilled: z,
            setFocused: B,
            shouldValidateOnChange: V,
            validationMode: H,
            disabled: U,
            name: ue,
            validation: W
        } = ae(), {
            labelId: de
        } = v(), G = U || k, K = ue ? ? S, q = y.useRef(null), fe = ee(q, x, W.inputRef), J = y.useRef(null), Y = d(), X = ce({
            id: _,
            implicit: !1,
            controlRef: J
        }), Z = T ? void 0 : X, [Q, pe] = p({
            controlled: n,
            default: !!c,
            name: `Switch`,
            state: `checked`
        });
        se(J, Y, Q), o(() => {
            q.current && z(q.current.checked)
        }, [q, z]), h(Q, () => {
            P(K), L(Q !== R.initialValue), z(Q), V() ? W.commit(Q) : W.commit(Q, !0)
        });
        let {
            getButtonProps: me,
            buttonRef: he
        } = m({
            disabled: G,
            native: T
        }), ge = oe(l, de, q, !T, Z), _e = {
            id: T ? X : Y,
            role: `switch`,
            "aria-checked": Q,
            "aria-readonly": D || void 0,
            "aria-required": O || void 0,
            "aria-labelledby": ge,
            onFocus() {
                G || B(!0)
            },
            onBlur() {
                let e = q.current;
                !e || G || (I(!0), B(!1), H === `onBlur` && W.commit(e.checked))
            },
            onClick(e) {
                if (D || G) return;
                e.preventDefault();
                let t = q.current;
                t && t.dispatchEvent(new(ne(t)).PointerEvent(`click`, {
                    bubbles: !0,
                    shiftKey: e.shiftKey,
                    ctrlKey: e.ctrlKey,
                    altKey: e.altKey,
                    metaKey: e.metaKey
                }))
            }
        }, ve = re({
            checked: Q,
            disabled: G,
            form: f,
            id: Z,
            name: K,
            required: O,
            style: K ? u : ie,
            tabIndex: -1,
            type: `checkbox`,
            "aria-hidden": !0,
            ref: fe,
            onChange(e) {
                if (e.nativeEvent.defaultPrevented) return;
                if (D) {
                    e.preventDefault();
                    return
                }
                let t = e.currentTarget.checked,
                    n = s(a, e.nativeEvent);
                E ? .(t, n), !n.isCanceled && pe(t)
            },
            onFocus() {
                J.current ? .focus()
            }
        }, W.getInputValidationProps, M === void 0 ? te : {
            value: M
        }), $ = y.useMemo(() => ({ ...F,
            checked: Q,
            disabled: G,
            readOnly: D,
            required: O
        }), [F, Q, G, D, O]), ye = r(`span`, e, {
            state: $,
            ref: [t, J, he],
            props: [_e, W.getValidationProps, N, me],
            stateAttributesMapping: C
        });
        return (0, w.jsxs)(b.Provider, {
            value: $,
            children: [ye, !Q && K && j !== void 0 && (0, w.jsx)(`input`, {
                type: `hidden`,
                form: f,
                name: K,
                value: j
            }), (0, w.jsx)(`input`, { ...ve,
                suppressHydrationWarning: !0
            })]
        })
    }),
    E = y.forwardRef(function(e, t) {
        let {
            render: n,
            className: i,
            style: a,
            ...o
        } = e;
        return r(`span`, e, {
            state: x(),
            ref: t,
            stateAttributesMapping: C,
            props: o
        })
    }),
    D = `cds-reset relative inline-flex shrink-0 rounded-full border-0 outline-none bg-[var(--cds-switch-track)] hover:bg-[var(--cds-switch-track-hover)] data-[checked]:bg-fill-accent data-[checked]:hover:bg-fill-accent-hover data-[disabled]:opacity-50 data-[disabled]:hover:bg-[var(--cds-switch-track)] data-[checked]:data-[disabled]:hover:bg-fill-accent focus-visible:shadow-focus`,
    O = `block rounded-full bg-[var(--cds-switch-knob)] shadow-sm transition-transform duration-snap ease-overshoot motion-reduce:transition-none`,
    k = `h-[var(--cds-switch-h)] w-[calc(var(--cds-switch-h,20px)*1.8)] p-[2px]`,
    A = `size-[calc(var(--cds-switch-h,20px)-4px)] data-[checked]:translate-x-[calc(var(--cds-switch-h,20px)*0.8)]`,
    j = (0, y.forwardRef)(({
        className: e,
        size: t,
        disabledReason: n,
        disabledReasonSide: r,
        ...a
    }, o) => {
        let s = (0, w.jsx)(T, {
            ref: o,
            "data-cds": `Switch`,
            ...a,
            ...i(t),
            className: f(D, k, e),
            children: (0, w.jsx)(E, {
                className: `${O} ${A}`
            })
        });
        return n === void 0 ? s : (0, w.jsx)(l, {
            side: r,
            reason: a.disabled ? n : void 0,
            children: s
        })
    });
j.displayName = `Switch`;
export {
    j as t
};
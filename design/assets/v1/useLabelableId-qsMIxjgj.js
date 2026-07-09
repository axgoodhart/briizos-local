import {
    o as e
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    t
} from "./react-BthIFXYf.js";
import {
    Gn as n,
    Wn as r,
    cn as i,
    cr as a,
    ir as o,
    rr as s,
    sr as c,
    vn as l
} from "./Button-JbIB5F4R.js";
var u = e(t()),
    d = function(e) {
        return e.disabled = `data-disabled`, e.valid = `data-valid`, e.invalid = `data-invalid`, e.touched = `data-touched`, e.dirty = `data-dirty`, e.filled = `data-filled`, e.focused = `data-focused`, e
    }({}),
    f = {
        badInput: !1,
        customError: !1,
        patternMismatch: !1,
        rangeOverflow: !1,
        rangeUnderflow: !1,
        stepMismatch: !1,
        tooLong: !1,
        tooShort: !1,
        typeMismatch: !1,
        valid: null,
        valueMissing: !1
    },
    p = {
        valid: null,
        touched: !1,
        dirty: !1,
        filled: !1,
        focused: !1
    },
    m = {
        disabled: !1,
        ...p
    },
    h = {
        valid(e) {
            return e === null ? null : e ? {
                [d.valid]: ``
            } : {
                [d.invalid]: ``
            }
        }
    },
    g = {
        invalid: void 0,
        name: void 0,
        validityData: {
            state: f,
            errors: [],
            error: ``,
            value: ``,
            initialValue: null
        },
        setValidityData: o,
        disabled: void 0,
        touched: p.touched,
        setTouched: o,
        dirty: p.dirty,
        setDirty: o,
        filled: p.filled,
        setFilled: o,
        focused: p.focused,
        setFocused: o,
        validate: () => null,
        validationMode: `onSubmit`,
        validationDebounceTime: 0,
        shouldValidateOnChange: () => !1,
        state: m,
        markedDirtyRef: {
            current: !1
        },
        registerFieldControl: o,
        validation: {
            getValidationProps: (e = s) => e,
            getInputValidationProps: (e = s) => e,
            inputRef: {
                current: null
            },
            commit: async () => {}
        }
    },
    _ = u.createContext(g);

function v(e = !0) {
    let t = u.useContext(_);
    if (t.setValidityData === o && !e) throw Error(a(28));
    return t
}

function y(e, t, n, i, a = !0) {
    let {
        registerFieldControl: o
    } = v(), s = u.useRef(null);
    s.current || = Symbol(), r(() => {
        let r = s.current;
        if (!(!r || !a)) return o(r, {
            controlRef: e,
            getValue: i,
            id: t,
            value: n
        }), () => {
            o(r, void 0)
        }
    }, [e, a, i, t, o, n])
}
var b = u.createContext({
    formRef: {
        current: {
            fields: new Map
        }
    },
    errors: {},
    clearErrors: o,
    validationMode: `onSubmit`,
    submitAttemptedRef: {
        current: !1
    }
});

function x() {
    return u.useContext(b)
}
var S = u.createContext({
    controlId: void 0,
    registerControlId: o,
    labelId: void 0,
    setLabelId: o,
    messageIds: [],
    setMessageIds: o,
    getDescriptionProps: e => e
});

function C() {
    return u.useContext(S)
}

function w(e, t, n, i = !0, a) {
    let [o, s] = u.useState(), c = l(a ? `${a}-label` : void 0), d = e ? ? t ? ? o;
    return r(() => {
        let r = e || t || !i ? void 0 : T(n.current, c);
        o !== r && s(r)
    }), d
}

function T(e, t) {
    let n = E(e);
    if (n) return !n.id && t && (n.id = t), n.id || void 0
}

function E(e) {
    if (!e) return;
    let t = e.parentElement;
    if (t && t.tagName === `LABEL`) return t;
    let n = e.id;
    if (n) {
        let t = e.nextElementSibling;
        if (t && t.htmlFor === n) return t
    }
    let r = e.labels;
    return r && r[0]
}

function D(e = {}) {
    let {
        id: t,
        implicit: a = !1,
        controlRef: s
    } = e, {
        controlId: d,
        registerControlId: f
    } = C(), p = l(t), m = a ? d : void 0, h = c(() => Symbol(`labelable-control`)), g = u.useRef(!1), _ = u.useRef(t != null), v = n(() => {
        !g.current || f === o || (g.current = !1, f(h.current, void 0))
    });
    return r(() => {
        if (f === o) return;
        let e;
        if (a) {
            let n = s ? .current;
            e = i(n) && n.closest(`label`) != null ? t ? ? null : m ? ? p
        } else if (t != null) _.current = !0, e = t;
        else if (_.current) e = p;
        else {
            v();
            return
        }
        if (e === void 0) {
            v();
            return
        }
        g.current = !0, f(h.current, e)
    }, [t, s, m, f, a, p, h, v]), u.useEffect(() => v, [v]), d ? ? p
}
export {
    x as a, _ as c, f as d, h as f, C as i, v as l, w as n, y as o, S as r, g as s, D as t, p as u
};
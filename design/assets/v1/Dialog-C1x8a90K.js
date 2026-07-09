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
    A as i,
    B as a,
    C as o,
    D as s,
    E as c,
    I as l,
    J as u,
    Jt as d,
    Kn as f,
    M as p,
    N as m,
    O as h,
    S as g,
    T as _,
    Tn as v,
    V as y,
    X as b,
    Xn as x,
    bn as S,
    cr as C,
    dt as w,
    g as T,
    j as E,
    k as D,
    kn as O,
    m as k,
    mn as A,
    ot as j,
    p as M,
    qt as ee,
    rr as N,
    t as te,
    tr as ne,
    vn as P,
    w as re
} from "./Button-JbIB5F4R.js";
import {
    t as F
} from "./cn-qYiRd2Uw.js";
import {
    a as ie,
    f as ae,
    j as I,
    l as oe,
    m as se,
    o as ce,
    p as le,
    s as ue,
    x as de
} from "./useModelSelection-Gs9zlsOR.js";
var L = n(),
    R = e(t());

function fe(e) {
    let {
        store: t,
        parentContext: n,
        actionsRef: r,
        isDrawer: i
    } = e, a = t.useState(`open`);
    E(t, a), h(t);
    let {
        forceUnmount: o
    } = D(a, t), s = R.useCallback(() => {
        t.setOpen(!1, S(O))
    }, [t]);
    return R.useImperativeHandle(r, () => ({
        unmount: o,
        close: s
    }), [o, s]), {
        parentContext: n,
        isDrawer: i
    }
}

function pe({
    store: e,
    dialogRoot: t
}) {
    let {
        parentContext: n,
        isDrawer: r
    } = t, a = e.useState(`open`), o = e.useState(`disablePointerDismissal`), s = e.useState(`modal`), l = e.useState(`popupElement`), u = e.useState(`floatingRootContext`), [f, p] = R.useState(0), [m, h] = R.useState(0), g = f === 0, _ = y(u, {
        outsidePressEvent() {
            return e.context.internalBackdropRef.current || e.context.backdropRef.current ? `intentional` : {
                mouse: s === `trap-focus` ? `sloppy` : `intentional`,
                touch: `sloppy`
            }
        },
        outsidePress(t) {
            if (!e.context.outsidePressEnabledRef.current || `button` in t && t.button !== 0 || `touches` in t && t.touches.length !== 1) return !1;
            let n = d(t);
            if (g && !o) {
                let t = n;
                return s && (e.context.internalBackdropRef.current || e.context.backdropRef.current) ? e.context.internalBackdropRef.current === t || e.context.backdropRef.current === t || ee(t, l) && !t ? .hasAttribute(`data-base-ui-portal`) : !0
            }
            return !1
        },
        escapeKey: g
    });
    return ce(a && s === !0, l), e.useContextCallback(`onNestedDialogOpen`, (e, t) => {
        p(e), h(t)
    }), e.useContextCallback(`onNestedDialogClose`, () => {
        p(0), h(0)
    }), R.useEffect(() => (n ? .onNestedDialogOpen && a && n.onNestedDialogOpen(f + 1, m + +!!r), n ? .onNestedDialogClose && !a && n.onNestedDialogClose(), () => {
        n ? .onNestedDialogClose && a && n.onNestedDialogClose()
    }), [r, a, f, m, n]), i(e, {
        activeTriggerProps: _.reference ? ? N,
        inactiveTriggerProps: _.trigger ? ? N,
        popupProps: R.useMemo(() => ne(c, _.floating), [_.floating]),
        nestedOpenDialogCount: f,
        nestedOpenDrawerCount: m
    }), null
}
var z = R.createContext(!1),
    B = R.createContext(void 0);

function V(e) {
    let t = R.useContext(B);
    if (e === !1 && t === void 0) throw Error(C(27));
    return t
}
var me = { ...re,
        modal: a(e => e.modal),
        nested: a(e => e.nested),
        nestedOpenDialogCount: a(e => e.nestedOpenDialogCount),
        nestedOpenDrawerCount: a(e => e.nestedOpenDrawerCount),
        disablePointerDismissal: a(e => e.disablePointerDismissal),
        openMethod: a(e => e.openMethod),
        descriptionElementId: a(e => e.descriptionElementId),
        titleElementId: a(e => e.titleElementId),
        viewportElement: a(e => e.viewportElement),
        role: a(e => e.role)
    },
    he = class e extends l {
        constructor(e, t, n = !1) {
            let r = new _,
                i = ge(e);
            i.floatingRootContext = o(r, t, n), super(i, {
                popupRef: R.createRef(),
                backdropRef: R.createRef(),
                internalBackdropRef: R.createRef(),
                outsidePressEnabledRef: {
                    current: !0
                },
                triggerElements: r,
                onOpenChange: void 0,
                onOpenChangeComplete: void 0
            }, me)
        }
        setOpen = (e, t) => {
            if (t.preventUnmountOnClose = () => {
                    this.set(`preventUnmountingOnClose`, !0)
                }, !e && t.trigger == null && this.state.activeTriggerId != null && (t.trigger = this.state.activeTriggerElement ? ? void 0), this.context.onOpenChange ? .(e, t), t.isCanceled) return;
            this.state.floatingRootContext.dispatchOpenChange(e, t);
            let n = {
                open: e
            };
            s(n, e, t.trigger), this.update(n)
        };
        static useStore(t, n) {
            return p(t, (t, r) => new e(n, t, r), !0).store
        }
    };

function ge(e = {}) {
    return { ...g(),
        modal: !0,
        disablePointerDismissal: !1,
        popupElement: null,
        viewportElement: null,
        descriptionElementId: void 0,
        titleElementId: void 0,
        openMethod: null,
        nested: !1,
        nestedOpenDialogCount: 0,
        nestedOpenDrawerCount: 0,
        role: `dialog`,
        ...e
    }
}

function _e(e, t = `dialog`) {
    let {
        children: n,
        open: r,
        defaultOpen: i = !1,
        onOpenChange: a,
        onOpenChangeComplete: o,
        disablePointerDismissal: s = !1,
        modal: c = !0,
        actionsRef: l,
        handle: u,
        triggerId: d,
        defaultTriggerId: f = null
    } = e, p = t === `drawer`, m = t === `alert-dialog`, h = m ? !0 : c, g = m || s, _ = m ? `alertdialog` : `dialog`, v = V(!0), y = {
        modal: h,
        disablePointerDismissal: g,
        nested: !!v,
        role: _
    }, b = he.useStore(u ? .store, {
        open: i,
        openProp: r,
        activeTriggerId: f,
        triggerIdProp: d,
        ...y
    });
    j(() => {
        let e = r === void 0 && b.state.open === !1 && i === !0 ? {
            open: !0,
            activeTriggerId: f
        } : null;
        m ? b.update(e ? { ...y,
            ...e
        } : y) : e && b.update(e)
    }), b.useControlledProp(`openProp`, r), b.useControlledProp(`triggerIdProp`, d), b.useSyncedValues(y), b.useContextCallback(`onOpenChange`, a), b.useContextCallback(`onOpenChangeComplete`, o);
    let x = b.useState(`open`),
        S = b.useState(`mounted`),
        C = b.useState(`payload`),
        w = fe({
            store: b,
            actionsRef: l,
            parentContext: v ? .store.context,
            isDrawer: p
        }),
        T = x || S,
        E = R.useMemo(() => ({
            store: b
        }), [b]);
    return (0, L.jsx)(z.Provider, {
        value: !1,
        children: (0, L.jsxs)(B.Provider, {
            value: E,
            children: [T && (0, L.jsx)(pe, {
                store: b,
                dialogRoot: w
            }), typeof n == `function` ? n({
                payload: C
            }) : n]
        })
    })
}
var ve = { ...k,
        ...A
    },
    H = R.forwardRef(function(e, t) {
        let {
            render: n,
            className: i,
            style: a,
            forceRender: o = !1,
            ...s
        } = e, {
            store: c
        } = V(), l = c.useState(`open`), u = c.useState(`nested`), d = c.useState(`mounted`);
        return r(`div`, e, {
            state: {
                open: l,
                transitionStatus: c.useState(`transitionStatus`)
            },
            ref: [c.context.backdropRef, t],
            stateAttributesMapping: ve,
            props: [{
                role: `presentation`,
                hidden: !d,
                style: {
                    userSelect: `none`,
                    WebkitUserSelect: `none`
                }
            }, s],
            enabled: o || !u
        })
    }),
    U = R.forwardRef(function(e, t) {
        let {
            render: n,
            className: i,
            style: a,
            disabled: o = !1,
            nativeButton: s = !0,
            ...c
        } = e, {
            store: l
        } = V(), u = l.useState(`open`), {
            getButtonProps: d,
            buttonRef: f
        } = I({
            disabled: o,
            native: s
        }), p = {
            disabled: o
        };

        function m(e) {
            u && l.setOpen(!1, S(v, e.nativeEvent))
        }
        return r(`button`, e, {
            state: p,
            ref: [t, f],
            props: [{
                onClick: m
            }, c, d]
        })
    }),
    W = R.forwardRef(function(e, t) {
        let {
            render: n,
            className: i,
            style: a,
            id: o,
            ...s
        } = e, {
            store: c
        } = V(), l = P(o);
        return c.useSyncedValueWithCleanup(`descriptionElementId`, l), r(`p`, e, {
            ref: t,
            props: [{
                id: l
            }, s]
        })
    }),
    ye = function(e) {
        return e.nestedDialogs = `--nested-dialogs`, e
    }({}),
    be = function(e) {
        return e[e.open = M.open] = `open`, e[e.closed = M.closed] = `closed`, e[e.startingStyle = M.startingStyle] = `startingStyle`, e[e.endingStyle = M.endingStyle] = `endingStyle`, e.nested = `data-nested`, e.nestedDialogOpen = `data-nested-dialog-open`, e
    }({}),
    G = R.createContext(void 0);

function xe() {
    let e = R.useContext(G);
    if (e === void 0) throw Error(C(26));
    return e
}
var Se = { ...k,
        ...A,
        nestedDialogOpen(e) {
            return e ? {
                [be.nestedDialogOpen]: ``
            } : null
        }
    },
    Ce = R.forwardRef(function(e, t) {
        let {
            render: n,
            className: i,
            style: a,
            finalFocus: o,
            initialFocus: s,
            ...l
        } = e, {
            store: u
        } = V(), d = u.useState(`descriptionElementId`), f = u.useState(`disablePointerDismissal`), p = u.useState(`floatingRootContext`), m = u.useState(`popupProps`), h = u.useState(`modal`), g = u.useState(`mounted`), _ = u.useState(`nested`), v = u.useState(`nestedOpenDialogCount`), y = u.useState(`open`), b = u.useState(`openMethod`), x = u.useState(`titleElementId`), S = u.useState(`transitionStatus`), C = u.useState(`role`), T = p.useState(`floatingId`), E = l.id ? ? T;
        xe(), w({
            open: y,
            ref: u.context.popupRef,
            onComplete() {
                y && u.context.onOpenChangeComplete ? .(!0)
            }
        });

        function D(e) {
            return e === `touch` ? u.context.popupRef.current : !0
        }
        let O = s === void 0 ? D : s,
            k = v > 0,
            A = u.useStateSetter(`popupElement`),
            j = r(`div`, e, {
                state: {
                    open: y,
                    nested: _,
                    transitionStatus: S,
                    nestedDialogOpen: k
                },
                props: [m, {
                    id: E,
                    "aria-labelledby": x ? ? void 0,
                    "aria-describedby": d ? ? void 0,
                    role: C,
                    ...c,
                    hidden: !g,
                    onKeyDown(e) {
                        de.has(e.key) && e.stopPropagation()
                    },
                    style: {
                        [ye.nestedDialogs]: v
                    }
                }, l],
                ref: [t, u.context.popupRef, A],
                stateAttributesMapping: Se
            });
        return (0, L.jsx)(se, {
            context: p,
            openInteractionType: b,
            disabled: !g,
            closeOnFocusOut: !f,
            initialFocus: O,
            returnFocus: o,
            modal: h !== !1,
            restoreFocus: `popup`,
            children: j
        })
    }),
    we = R.forwardRef(function(e, t) {
        let {
            keepMounted: n = !1,
            ...r
        } = e, {
            store: i
        } = V(), a = i.useState(`mounted`), o = i.useState(`modal`), s = i.useState(`open`);
        return a || n ? (0, L.jsx)(G.Provider, {
            value: n,
            children: (0, L.jsxs)(u, {
                ref: t,
                ...r,
                children: [a && o === !0 && (0, L.jsx)(ue, {
                    ref: i.context.internalBackdropRef,
                    inert: ae(!s)
                }), e.children]
            })
        }) : null
    }),
    Te = R.forwardRef(function(e, t) {
        let {
            render: n,
            className: i,
            style: a,
            id: o,
            ...s
        } = e, {
            store: c
        } = V(), l = P(o);
        return c.useSyncedValueWithCleanup(`titleElementId`, l), r(`h2`, e, {
            ref: t,
            props: [{
                id: l
            }, s]
        })
    }),
    Ee = R.forwardRef(function(e, t) {
        let {
            render: n,
            className: i,
            style: a,
            disabled: o = !1,
            nativeButton: s = !0,
            id: c,
            payload: l,
            handle: u,
            ...d
        } = e, f = V(!0), p = u ? .store ? ? f ? .store;
        if (!p) throw Error(C(79));
        let h = P(c),
            g = p.useState(`floatingRootContext`),
            _ = p.useState(`isOpenedByTrigger`, h),
            v = p.useState(`triggerPopupId`, h),
            y = R.useRef(null),
            {
                registerTrigger: x,
                isMountedByThisTrigger: S
            } = m(h, y, p, {
                payload: l
            }),
            {
                getButtonProps: w,
                buttonRef: E
            } = I({
                disabled: o,
                native: s
            }),
            D = le(g, {
                enabled: g != null
            }),
            O = oe(() => p.select(`open`), e => {
                p.set(`openMethod`, e)
            }),
            k = {
                disabled: o,
                open: _
            },
            A = p.useState(`triggerProps`, S);
        return r(`button`, e, {
            state: k,
            ref: [E, t, x, y],
            props: [D.reference, A, O, {
                [b]: ``,
                id: h,
                "aria-haspopup": `dialog`,
                "aria-expanded": _,
                "aria-controls": v
            }, d, w],
            stateAttributesMapping: T
        })
    });

function De(e) {
    return _e(e, R.useContext(z) ? `drawer` : `dialog`)
}
var Oe = `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] ${`${ie(`popover`)} shadow-panel-lg`} cds-reset text-body text-primary outline-none`,
    ke = `flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[inherit] p-xl`,
    Ae = `transition-[opacity,scale] duration-base ease-out motion-reduce:transition-none data-[starting-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[ending-style]:scale-[0.98]`,
    je = `draggable-none fixed inset-0 bg-backdrop backdrop-blur-[2px] transition-opacity duration-base ease-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0`,
    Me = {
        sm: `max-w-[400px]`,
        md: `max-w-[520px]`,
        lg: `max-w-[720px]`,
        xl: `max-w-[880px]`,
        "2xl": `max-w-[1024px]`,
        "3xl": `max-w-[1152px]`
    },
    K = (0, R.forwardRef)(({
        size: e = `md`,
        fullHeight: t = !1,
        unstyled: n = !1,
        backdropClassName: r,
        backdropStyle: i,
        portalClassName: a,
        className: o,
        children: s,
        ...c
    }, l) => {
        let u = n ? `` : `${Oe} ${Ae} ${Me[e]} ${t?`h-[calc(100dvh-2rem)]`:``}`;
        return (0, L.jsx)(we, {
            container: x(),
            children: (0, L.jsxs)(f, {
                className: F(`relative z-modal`, a),
                children: [(0, L.jsx)(H, {
                    className: F(je, r),
                    style: i
                }), (0, L.jsx)(Ce, {
                    "data-cds": `Dialog`,
                    ref: l,
                    ...c,
                    className: F(`draggable-none`, u, o),
                    children: n ? s : (0, L.jsx)(`div`, {
                        className: ke,
                        children: s
                    })
                })]
            })
        })
    });
K.displayName = `Dialog.Popup`;
var q = (0, R.forwardRef)(({
    className: e,
    ...t
}, n) => (0, L.jsx)(Te, {
    ref: n,
    ...t,
    className: F(`text-title font-semibold text-primary`, e)
}));
q.displayName = `Dialog.Title`;
var J = `Close`;

function Y({
    "aria-label": e = J,
    className: t
}) {
    return (0, L.jsx)(U, {
        render: (0, L.jsx)(te, {
            variant: `ghost`,
            iconOnly: !0,
            icon: `X`,
            "aria-label": e,
            tooltip: !1,
            className: t
        })
    })
}
Y.displayName = `Dialog.CloseButton`;

function X({
    actions: e,
    description: t,
    showClose: n = !0,
    closeLabel: r,
    className: i,
    children: a
}) {
    return (0, L.jsxs)(`div`, {
        className: F(`mb-pad-md flex items-start gap-2`, i),
        children: [(0, L.jsxs)(`div`, {
            className: `-mt-1 flex min-w-0 flex-1 flex-col gap-1`,
            children: [(0, L.jsx)(q, {
                className: `break-words`,
                children: a
            }), t && (0, L.jsx)(W, {
                className: `text-body text-secondary`,
                children: t
            })]
        }), e && (0, L.jsx)(`div`, {
            className: `-mt-pad-sm`,
            children: e
        }), n && (0, L.jsx)(Y, {
            "aria-label": r,
            className: `-mr-pad-sm -mt-pad-sm`
        })]
    })
}
X.displayName = `Dialog.Header`;
var Z = (0, R.forwardRef)(({
    className: e,
    ...t
}, n) => (0, L.jsx)(W, {
    ref: n,
    ...t,
    className: F(`mt-1 text-body text-secondary`, e)
}));
Z.displayName = `Dialog.Description`;
var Ne = {
    start: `sm:justify-start`,
    center: `sm:justify-center`,
    end: `sm:justify-end`,
    between: `sm:justify-between`
};

function Q({
    align: e = `end`,
    className: t,
    children: n
}) {
    return (0, L.jsx)(`div`, {
        className: F(`mt-pad-lg flex flex-col-reverse gap-2 sm:flex-row`, Ne[e], t),
        children: n
    })
}
Q.displayName = `Dialog.Footer`;

function $({
    dismissible: e,
    disablePointerDismissal: t,
    ...n
}) {
    return (0, L.jsx)(De, {
        disablePointerDismissal: t ? ? (e === !1 ? !0 : void 0),
        ...n
    })
}
$.displayName = `Dialog.Root`;
var Pe = {
    Root: $,
    Trigger: Ee,
    Popup: K,
    Backdrop: H,
    Header: X,
    Title: q,
    Description: Z,
    Footer: Q,
    Close: U,
    CloseButton: Y
};
export {
    Pe as t
};
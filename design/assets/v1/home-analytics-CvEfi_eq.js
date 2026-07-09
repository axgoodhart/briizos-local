import {
    o as e
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    b as t,
    d as n,
    h as r,
    v as i
} from "./client-lite-BraEm36W.js";
import {
    t as a
} from "./react-BthIFXYf.js";
import {
    P as o,
    _ as s,
    b as c
} from "./useOrg-DgFJtzUv.js";
import {
    ln as l
} from "./fig-kit-coverage-DSUEqVg0.js";
import {
    t as u
} from "./jsx-runtime-DDrWIXeu.js";
import {
    t as d
} from "./cn-qYiRd2Uw.js";
import "./cn-BvRk9kiK.js";
import {
    Ft as f,
    G as p,
    Jt as m,
    Kt as h,
    Nt as g,
    Pt as _,
    V as v,
    Wt as y
} from "./index-DxZs6uan.js";
import {
    T as b
} from "./client-BkAIwXnN.js";
import {
    J as x,
    K as ee,
    Y as te,
    an as ne,
    fr as re,
    gr as ie,
    o as ae,
    s as oe,
    vr as se,
    xr as ce
} from "./connectrpc-BRKh2K0Y.js";
import {
    t as S
} from "./platform-BciTLfG8.js";
var C = e(a(), 1),
    le = e(o(), 1),
    w = u(),
    ue = 660,
    de = 1100,
    fe = `(max-width: ${ue}px)`;

function pe() {
    return i(fe)
}

function me() {
    return i(`(max-width: ${de}px)`)
}
var he = (0, C.createContext)(0),
    ge = [];

function _e() {
    let e;
    for (let t of ge)(!e || t.depth >= e.depth) && (e = t);
    return e ? .id
}

function ve({
    open: e,
    onClose: t,
    anchorPosition: n,
    anchorEl: i,
    placement: a = `bottom`,
    align: o = `left`,
    modalOnMobile: s = !1,
    children: c
}) {
    let l = pe(),
        u = s && l,
        f = (0, C.useContext)(he),
        p = y.popover + f * 2,
        m = p - 1,
        h = (0, C.useRef)(null),
        [g, _] = (0, C.useState)(!1),
        v = (0, C.useRef)(null);
    v.current === null && (v.current = Symbol(`popover`)), (0, C.useEffect)(() => {
        if (!e) return;
        let t = {
            id: v.current,
            depth: f
        };
        return ge.push(t), () => {
            let e = ge.indexOf(t);
            e >= 0 && ge.splice(e, 1)
        }
    }, [e, f]), (0, C.useEffect)(() => {
        e || _(!1)
    }, [e]);
    let b = (0, C.useCallback)(() => {
        if (!e || !h.current) return;
        let t = n ? .x ? ? 0,
            r = n ? .y ? ? 0,
            s = h.current,
            c = s.getBoundingClientRect();
        if (i) {
            let e = i.getBoundingClientRect();
            t = o === `right` ? e.right - c.width : e.left, r = a === `top` ? e.top - c.height - 4 : e.bottom + 4
        } else n && o === `right` && (t = n.x - c.width);
        let l = window.innerWidth,
            u = window.innerHeight;
        t + c.width > l - 8 && (t = l - c.width - 8), r + c.height > u - 8 && (r = u - c.height - 8), t < 8 && (t = 8), r < 8 && (r = 8), s.style.left = `${t}px`, s.style.top = `${r}px`, _(!0)
    }, [e, n, i, a, o, u]);
    (0, C.useLayoutEffect)(b, [b]), (0, C.useEffect)(() => {
        if (!e || !h.current) return;
        let t = new ResizeObserver(b);
        return t.observe(h.current), () => t.disconnect()
    }, [e, b]);
    let x = (0, C.useRef)(document);
    return r(`scroll`, () => {
        e && i && b()
    }, x, {
        capture: !0
    }), r(`keydown`, n => {
        e && n.key === `Escape` && _e() === v.current && (n.stopPropagation(), t())
    }, x), e ? u ? (0, le.createPortal)((0, w.jsxs)(he.Provider, {
        value: f + 1,
        children: [(0, w.jsx)(`div`, {
            className: `fixed inset-0 bg-om-bg-scrim`,
            style: {
                zIndex: m
            },
            "data-popover-backdrop": ``,
            onClick: t,
            onContextMenu: e => {
                e.preventDefault(), t()
            }
        }), (0, w.jsx)(`div`, {
            className: `fixed inset-4 m-auto max-w-[calc(100vw-32px)] max-h-[calc(100vh-32px)] w-fit h-fit bg-om-bg-elevated border border-om-border-default rounded-xl shadow-om-lg overflow-auto`,
            style: {
                zIndex: p
            },
            children: c
        })]
    }), document.body) : (0, le.createPortal)((0, w.jsxs)(he.Provider, {
        value: f + 1,
        children: [(0, w.jsx)(`div`, {
            className: `fixed inset-0`,
            style: {
                zIndex: m
            },
            "data-popover-backdrop": ``,
            onClick: t,
            onContextMenu: e => {
                e.preventDefault(), t()
            }
        }), (0, w.jsx)(`div`, {
            ref: h,
            className: d(`fixed left-0 top-0 bg-om-bg-elevated border border-om-border-default rounded-lg shadow-om-lg min-w-[140px] overflow-hidden`, !g && `invisible`),
            style: {
                zIndex: p
            },
            children: c
        })]
    }), document.body) : null
}

function ye({
    disabled: e,
    destructive: t,
    inertRow: n,
    muted: r,
    className: i,
    ...a
}) {
    return (0, w.jsx)(`button`, {
        type: `button`,
        className: d(`om-menu-item-btn flex w-full items-center gap-2 rounded-[4px] bg-transparent`, `px-3 py-2 text-left text-[13px] outline-none`, e ? `cursor-not-allowed` : `cursor-default`, e ? `text-om-text-disabled` : t ? `text-om-accent-error` : r ? `text-om-text-secondary` : `text-om-text-primary`, e || n ? `hover:bg-transparent` : `hover:bg-om-bg-hover`, `focus-visible:outline focus-visible:outline-2 focus-visible:outline-transparent`, `focus-visible:shadow-[0_0_0_2px_var(--om-text-secondary)]`, i),
        ...a
    })
}

function be({
    iconOnly: e,
    danger: t,
    pad: n,
    round: r,
    primary: i,
    className: a,
    style: o,
    ...s
}) {
    return (0, w.jsx)(`span`, {
        className: d(`flex shrink-0 cursor-default items-center justify-center text-[11px] font-medium`, r ? `rounded-full` : `rounded-[4px]`, i ? `text-om-text-primary` : `text-om-text-secondary`, e ? `hover:border-transparent` : `border border-om-border-subtle px-2 py-[3px] hover:border-om-border-default`, e && t ? `hover:text-om-accent-error` : `hover:text-om-text-primary`, r ? `hover:bg-om-bg-hover` : e ? `hover:bg-transparent` : `hover:bg-om-bg-surface`, `focus-visible:outline focus-visible:outline-2 focus-visible:outline-transparent`, `focus-visible:shadow-[0_0_0_2px_var(--om-text-secondary)]`, a),
        style: e ? {
            padding: n,
            margin: `${-n}px 0`,
            ...o
        } : o,
        ...s
    })
}

function xe({
    item: e,
    onClose: t
}) {
    if (`sectionHeader` in e && e.sectionHeader) return (0, w.jsx)(`div`, {
        className: d(`px-3 pb-1 pt-2 text-xs font-medium text-om-text-tertiary`, `[&:not(:first-child)]:mt-1 [&:not(:first-child)]:border-t`, `[&:not(:first-child)]:border-om-border-subtle [&:not(:first-child)]:pt-3`),
        children: e.label
    });
    if (e.separator) return (0, w.jsx)(`div`, {
        className: `mx-2 my-1 h-px bg-om-border-subtle`
    });
    let n = n => {
            e.disabled || (e.onClick ? .(n), e.keepOpen || t())
        },
        r = !!e.below,
        i = (0, w.jsxs)(ye, {
            disabled: !!e.disabled,
            destructive: !!e.destructive,
            inertRow: !!e.inert || r,
            muted: !!e.inert,
            onClick: r || e.inert ? void 0 : n,
            tabIndex: e.inert ? -1 : void 0,
            children: [e.icon && (0, w.jsx)(m, {
                name: e.icon,
                size: 14,
                style: {
                    color: e.destructive ? f.accent.error : e.iconColor ? ? f.text.secondary
                }
            }), (0, w.jsxs)(`div`, {
                className: `flex min-w-0 flex-1 flex-col gap-0.5`,
                children: [(0, w.jsx)(`span`, {
                    className: `truncate`,
                    title: e.label,
                    children: e.label
                }), e.subtitle && (0, w.jsx)(`span`, {
                    className: `truncate text-[11px] text-om-text-tertiary`,
                    title: typeof e.subtitle == `string` ? e.subtitle : void 0,
                    children: e.subtitle
                })]
            }), e.hint && (0, w.jsx)(`span`, {
                className: `shrink-0 text-om-text-secondary`,
                children: e.hint
            }), e.badge && (0, w.jsx)(`span`, {
                className: `h-4 shrink-0 rounded-full bg-om-accent-pro-bg px-2 text-[0.6rem] uppercase leading-4 text-om-accent-pro`,
                children: e.badge
            }), e.trailingIcon && (0, w.jsx)(m, {
                name: e.trailingIcon,
                size: 13,
                style: {
                    marginLeft: `auto`,
                    color: f.text.secondary,
                    flexShrink: 0
                }
            }), e.trailingAction && (0, w.jsx)(`span`, {
                className: `ml-auto flex shrink-0 items-center gap-0.5`,
                children: (Array.isArray(e.trailingAction) ? e.trailingAction : [e.trailingAction]).map((n, r) => {
                    let i = !!n.icon && !n.label,
                        a = n.iconSize ? ? 12,
                        o = i ? Math.max(3, Math.round((a - 12) / 2) + 3) : 3,
                        s = r => {
                            r.stopPropagation(), !e.disabled && (n.onClick(), n.keepOpen || t())
                        };
                    return (0, w.jsxs)(be, {
                        iconOnly: i,
                        danger: !!n.danger,
                        pad: o,
                        round: !!n.roundHover,
                        primary: !!e.inert,
                        role: `button`,
                        tabIndex: e.disabled ? -1 : 0,
                        "aria-disabled": e.disabled || void 0,
                        title: n.title,
                        "aria-label": i ? n.title ? ? n.icon : void 0,
                        onClick: s,
                        onKeyDown: e => {
                            e.key === `Enter` && !e.repeat ? (e.preventDefault(), s(e)) : e.key === ` ` && e.preventDefault()
                        },
                        onKeyUp: e => {
                            e.key === ` ` && (e.preventDefault(), s(e))
                        },
                        children: [n.icon && (0, w.jsx)(m, {
                            name: n.icon,
                            size: a
                        }), n.label]
                    }, r)
                })
            })]
        });
    return r ? (0, w.jsxs)(`div`, {
        onClick: e.inert ? void 0 : n,
        className: d(`rounded-[4px]`, e.disabled ? `cursor-not-allowed` : `cursor-default`, e.disabled || e.inert ? `hover:bg-transparent` : `hover:bg-om-bg-hover`, `[&>.om-menu-item-btn]:pb-0`),
        children: [i, (0, w.jsx)(`div`, {
            className: `pb-2 pl-[34px] pr-3 pt-0.5 text-[11px] text-om-text-tertiary`,
            children: e.below
        })]
    }) : i
}

function Se({
    open: e,
    onClose: t,
    anchorPosition: n,
    anchorEl: r,
    placement: i,
    align: a,
    modalOnMobile: o,
    header: s,
    minWidth: c,
    maxWidth: l = 320,
    autoFocusFirstItem: u,
    items: d
}) {
    let f = (0, C.useRef)(null);
    return (0, C.useEffect)(() => {
        if (!e || !u) return;
        let t = 0,
            n = requestAnimationFrame(() => {
                t = requestAnimationFrame(() => {
                    f.current ? .querySelector(`button:not([tabindex="-1"])`) ? .focus()
                })
            });
        return () => {
            cancelAnimationFrame(n), cancelAnimationFrame(t)
        }
    }, [e, u]), (0, w.jsx)(ve, {
        open: e,
        onClose: t,
        anchorPosition: n,
        anchorEl: r,
        placement: i,
        align: a,
        modalOnMobile: o,
        children: (0, w.jsxs)(`div`, {
            ref: f,
            role: `menu`,
            className: `max-h-[600px] overflow-y-auto p-1`,
            style: {
                minWidth: c,
                maxWidth: l
            },
            children: [s, d.map((e, n) => (0, w.jsx)(xe, {
                item: e,
                onClose: t
            }, n))]
        })
    })
}
var Ce = `text-[13px] text-om-text-primary outline-none transition-all duration-100 placeholder:text-om-text-tertiary disabled:text-om-text-disabled om-max-700:text-base [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden`,
    we = (0, C.forwardRef)(function({
        type: e = `text`,
        leadingIcon: t,
        bare: n,
        cdsHeight: r,
        className: i,
        ...a
    }, o) {
        let s = !!t,
            c = (0, w.jsx)(`input`, { ...a,
                ref: o,
                type: e,
                className: d(Ce, n ? `w-auto py-1 px-0.5 bg-transparent rounded-none shadow-none` : `w-full bg-om-bg-surface rounded-md border border-om-border-default focus:border-om-border-focus shadow-om-inset focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--om-accent-blue)_22%,transparent)]`, !n && (r ? `py-0 px-2.5` : `py-2 px-2.5`), r && `box-border h-[var(--cds-h-control,32px)]`, s && `pl-[30px]`, i)
            });
        return t ? (0, w.jsxs)(`div`, {
            className: `relative w-full cursor-text`,
            children: [(0, w.jsx)(`span`, {
                className: `absolute left-2.5 top-1/2 -translate-y-1/2 inline-flex text-om-text-tertiary pointer-events-none`,
                children: (0, w.jsx)(m, {
                    name: t,
                    size: 14
                })
            }), c]
        }) : c
    }),
    Te = C.forwardRef(function({
        rows: e = 3,
        className: t,
        ...n
    }, r) {
        return (0, w.jsx)(`textarea`, { ...n,
            ref: r,
            rows: e,
            className: d(`w-full py-2 px-2.5 text-[13px] bg-om-bg-surface border border-om-border-default focus:border-om-border-focus rounded-md text-om-text-primary outline-none resize-y leading-normal shadow-om-inset focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--om-accent-blue)_22%,transparent)] transition-all duration-100 placeholder:text-om-text-tertiary`, t)
        })
    });

function Ee(e, {
    submitOnEnter: t,
    onSubmit: n,
    onPlainEnter: r
}) {
    if (e.key === `Enter` && !(e.nativeEvent.isComposing || e.keyCode === 229)) {
        if (e.metaKey || e.ctrlKey) {
            e.preventDefault(), n ? .(`mod-enter`);
            return
        }
        e.shiftKey || e.altKey || (t ? (e.preventDefault(), n ? .(`enter`)) : r ? .())
    }
}
var De = C.forwardRef(({
    placeholder: e,
    value: t = ``,
    onChange: n,
    onSubmit: r,
    onPlainEnter: i,
    onPaste: a,
    onBlur: o,
    onEscape: s,
    submitOnEnter: c = !1,
    autoFocus: l,
    className: u,
    minRows: f = 2,
    maxRows: p = 10,
    style: m,
    "data-testid": h
}, g) => {
    let _ = C.useRef(null);
    return C.useImperativeHandle(g, () => _.current, []), C.useLayoutEffect(() => {
        let e = _.current;
        if (!e) return;
        let t = 21 * f,
            n = 21 * p;
        e.style.height = `auto`;
        let r = e.scrollHeight,
            i = Math.min(Math.max(r, t), n);
        e.style.height = `${i}px`, e.style.overflowY = r > n ? `auto` : `hidden`
    }, [t, f, p]), (0, w.jsx)(`textarea`, {
        ref: _,
        "data-testid": h,
        placeholder: e,
        value: t,
        onChange: e => n ? .(e.target.value),
        onKeyDown: e => {
            if (e.key === `Escape`) {
                s ? .();
                return
            }
            Ee(e, {
                submitOnEnter: c,
                onSubmit: r,
                onPlainEnter: i
            })
        },
        onPaste: a,
        onBlur: o,
        autoFocus: l,
        className: d(`w-full p-0 text-[13px] bg-transparent text-om-text-primary outline-none resize-none leading-normal overflow-y-hidden placeholder:text-om-text-tertiary om-max-700:text-base`, u),
        rows: f,
        style: m
    })
});

function Oe({
    checked: e = !1,
    onChange: t,
    disabled: n,
    title: r,
    style: i
}) {
    return (0, w.jsx)(`div`, {
        className: d(`w-8 h-[18px] rounded-[9px] p-0.5 transition-colors duration-150`, e ? `bg-om-accent-blue shadow-[inset_0_0_0_1px_var(--om-accent-blue-hover)]` : `bg-om-border-default shadow-[inset_0_0_0_1px_var(--om-border-strong)]`, n ? `cursor-not-allowed opacity-50` : `cursor-pointer`),
        title: r,
        onClick: r => {
            r.stopPropagation(), n || t ? .(!e)
        },
        style: i,
        children: (0, w.jsx)(`div`, {
            className: d(`w-3.5 h-3.5 rounded-full bg-om-bg-surface shadow-om-xs transition-transform duration-150`, e ? `translate-x-3.5` : `translate-x-0`)
        })
    })
}

function ke({
    checked: e,
    disabled: t,
    className: n,
    ...r
}) {
    return (0, w.jsx)(`div`, {
        className: d(`w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center text-om-text-inverse shrink-0 mt-px transition-all duration-[120ms]`, e ? `border-om-accent-black bg-om-accent-black` : `border-om-border-strong bg-om-bg-surface`, t && `opacity-50`, n),
        ...r
    })
}

function Ae({
    checked: e,
    onChange: t,
    label: n,
    hint: r,
    disabled: i,
    boxSide: a = `left`,
    leading: o
}) {
    let s = a === `right` || !r,
        c = (0, w.jsx)(ke, {
            checked: e,
            disabled: i,
            className: s && a === `left` ? `mt-0` : void 0,
            children: e && (0, w.jsx)(m, {
                name: `Check`,
                size: 11,
                bold: !0
            })
        });
    return (0, w.jsxs)(`button`, {
        type: `button`,
        disabled: i,
        className: d(`w-full flex gap-2.5 py-[7px] px-1 bg-transparent cursor-default text-left disabled:cursor-not-allowed`, s ? `items-center` : `items-start`),
        onClick: () => !i && t(!e),
        children: [a === `left` && c, o, (0, w.jsxs)(`div`, {
            style: {
                flex: 1,
                minWidth: 0
            },
            children: [(0, w.jsx)(`div`, {
                className: `text-[13px] font-medium text-om-text-primary`,
                children: n
            }), r && (0, w.jsx)(`div`, {
                className: `text-xs text-om-text-tertiary mt-px`,
                children: r
            })]
        }), a === `right` && c]
    })
}
var je = `bg-om-bg-elevated border border-om-border-default rounded-[10px] shadow-om-sm`;

function Me({
    className: e,
    ...t
}) {
    return (0, w.jsx)(`h1`, {
        className: d(`m-0 font-om-serif text-[24px] font-normal leading-tight tracking-[-0.2px] text-om-text-primary`, e),
        ...t
    })
}

function Ne({
    className: e,
    ...t
}) {
    return (0, w.jsx)(`h2`, {
        className: d(`m-0 font-om-serif text-[17px] font-[450] leading-[1.3] tracking-[-0.1px] text-om-text-primary`, e),
        ...t
    })
}

function Pe({
    className: e,
    ...t
}) {
    return (0, w.jsx)(`p`, {
        className: d(`m-0 text-pretty text-[13px] leading-normal text-om-text-secondary`, e),
        ...t
    })
}

function Fe({
    centered: e,
    className: t,
    ...n
}) {
    return (0, w.jsx)(`div`, {
        className: d(`flex flex-col gap-2 px-1`, e ? `items-center text-center` : `items-stretch text-left`, t),
        ...n
    })
}
var Ie = 8,
    Le = 6;

function Re({
    children: e,
    label: t,
    filterControl: n,
    footerLabel: r,
    tinted: i = !1,
    nextStackedItems: a = 0,
    className: o,
    style: s
}) {
    let c = Math.min(a, 2);
    return (0, w.jsxs)(`div`, {
        className: o,
        style: {
            marginBottom: c > 0 ? c * Le : void 0,
            ...s
        },
        children: [(t || n) && (0, w.jsxs)(`div`, {
            className: `flex min-h-[20px] items-end justify-between gap-3 px-1 pb-2`,
            children: [(0, w.jsx)(`div`, {
                className: `text-xs font-medium text-om-text-secondary`,
                children: t
            }), n]
        }), (0, w.jsxs)(`div`, {
            style: {
                position: `relative`,
                isolation: `isolate`
            },
            children: [(0, w.jsx)(`div`, {
                className: d(`om-form-list-card relative flex flex-col overflow-hidden rounded-[10px] border shadow-om-sm`, i ? `om-form-list-card-tinted border-[rgba(217,119,87,0.35)] bg-om-accent-primary-bg text-om-accent-primary` : `border-om-border-default bg-om-bg-elevated`),
                children: e
            }), Array.from({
                length: c
            }, (e, t) => {
                let n = t + 1;
                return (0, w.jsx)(`div`, {
                    "aria-hidden": !0,
                    className: d(`absolute rounded-[10px] border shadow-om-sm`, i ? `border-[rgba(217,119,87,0.35)] bg-om-accent-primary-bg` : `border-om-border-default bg-om-bg-elevated`),
                    style: {
                        left: n * Ie,
                        right: n * Ie,
                        height: 20,
                        bottom: -n * Le,
                        zIndex: -n
                    }
                }, t)
            })]
        }), r && (0, w.jsx)(`div`, {
            className: `px-1 pt-2 text-[11.5px] leading-normal text-om-text-tertiary`,
            children: r
        })]
    })
}

function ze({
    clickable: e,
    className: t,
    ...n
}) {
    return (0, w.jsx)(`div`, {
        className: d(`px-4 py-3`, e && `cursor-default hover:bg-om-bg-hover focus-visible:shadow-[inset_0_0_0_2px_var(--om-border-focus)] focus-visible:outline-none`, t),
        ...n
    })
}
var Be = `overflow-hidden text-ellipsis text-[13px] font-medium leading-[1.35] text-om-text-primary`;

function Ve({
    icon: e,
    title: t,
    subtitle: n,
    oneLineSubtitle: r = !1,
    mainContent: i,
    accessory: a,
    expandedContent: o,
    indentedDivider: s,
    onClick: c,
    role: l,
    "aria-checked": u,
    "aria-disabled": f,
    "data-testid": p,
    "data-autofocus": m,
    className: h,
    style: g,
    onDragEnter: _,
    onDragOver: v
}) {
    return (0, w.jsxs)(ze, {
        clickable: !!c,
        onClick: c,
        tabIndex: c ? 0 : void 0,
        onKeyDown: c ? e => {
            e.target === e.currentTarget && (e.key === `Enter` || e.key === ` `) && (e.preventDefault(), c())
        } : void 0,
        role: l,
        "aria-checked": u,
        "aria-disabled": f,
        "data-testid": p,
        "data-autofocus": m,
        className: h,
        style: g,
        onDragEnter: _,
        onDragOver: v,
        "data-indented-divider": s || void 0,
        children: [(0, w.jsxs)(`div`, {
            className: `flex min-h-[20px] items-center gap-3`,
            children: [e != null && (0, w.jsx)(`div`, {
                className: `inline-flex shrink-0 text-om-text-tertiary`,
                children: e
            }), (t != null || n != null || i != null) && (0, w.jsxs)(`div`, {
                className: `flex min-w-0 flex-1 flex-col gap-0.5`,
                children: [t != null && (0, w.jsx)(`div`, {
                    className: Be,
                    children: t
                }), n != null && (0, w.jsx)(`div`, {
                    className: d(`overflow-hidden text-ellipsis text-[11.5px] font-[450] leading-[1.4] text-om-text-tertiary`, r && `whitespace-nowrap`),
                    children: n
                }), i]
            }), a != null && (0, w.jsx)(`div`, {
                className: `inline-flex shrink-0 items-center gap-2`,
                onClick: e => e.stopPropagation(),
                children: a
            })]
        }), o != null && (0, w.jsx)(`div`, {
            className: `pt-3`,
            onClick: e => e.stopPropagation(),
            children: o
        })]
    })
}

function He({
    expanded: e
}) {
    return (0, w.jsx)(`span`, {
        className: d(`inline-flex text-om-text-tertiary transition-transform duration-150`, e ? `rotate-0` : `-rotate-90`),
        children: (0, w.jsx)(m, {
            name: `CaretDownSmall`,
            size: 12
        })
    })
}

function Ue({
    label: e,
    value: t,
    onChange: n,
    placeholder: r,
    minRows: i = 2,
    maxRows: a = 8,
    "data-testid": o
}) {
    return (0, w.jsxs)(ze, {
        clickable: !1,
        "data-testid": o,
        children: [e != null && (0, w.jsx)(`div`, {
            className: Be,
            style: {
                marginBottom: 6
            },
            children: e
        }), (0, w.jsx)(De, {
            value: t,
            onChange: n,
            placeholder: r,
            minRows: i,
            maxRows: a
        })]
    })
}

function We({
    title: e,
    subtitle: t,
    onClose: n,
    closeDisabled: r,
    leading: i,
    trailing: a,
    noDivider: o
}) {
    return (0, w.jsxs)(`header`, {
        className: d(`flex flex-col gap-0.5 px-5 pb-[14px] pt-[18px]`, !o && `border-b border-om-border-modal`),
        children: [(0, w.jsxs)(`div`, {
            className: `flex min-h-8 items-center gap-3`,
            children: [i, (0, w.jsx)(`div`, {
                className: `min-w-0 flex-1 text-[15px] font-semibold tracking-[-0.005em] text-om-text-primary`,
                children: e
            }), a, n && (0, w.jsx)(h, {
                icon: `X`,
                size: 32,
                iconSize: 16,
                onClick: n,
                disabled: r,
                title: `Close`
            })]
        }), t && (0, w.jsx)(`div`, {
            className: `text-[12.5px] leading-[1.45] text-om-text-secondary`,
            children: t
        })]
    })
}
var Ge = {
    xs: {
        h: 24,
        padX: 10,
        track: 2,
        fs: 11.5
    },
    sm: {
        h: 30,
        padX: 16,
        track: 3,
        fs: 12.5
    },
    md: {
        h: 36,
        padX: 14,
        track: 4,
        fs: 13
    }
};

function Ke({
    segments: e,
    value: t,
    onChange: n,
    size: r = `sm`,
    iconOnly: i = !1
}) {
    let a = Ge[r];
    return (0, w.jsx)(`div`, {
        role: `tablist`,
        className: d(`inline-flex gap-0.5 bg-om-bg-hover`, r === `xs` ? `rounded-lg` : `rounded-[10px]`),
        style: {
            padding: a.track
        },
        children: e.map(e => {
            let o = t === e.value;
            return (0, w.jsx)(`button`, {
                type: `button`,
                role: `tab`,
                "aria-selected": o,
                title: e.title,
                "data-testid": e.testId,
                onClick: () => n(e.value),
                className: d(`inline-flex items-center justify-center font-medium cursor-default hover:text-om-text-primary`, r === `md` ? `gap-[7px]` : `gap-1.5`, r === `xs` ? `rounded-md` : `rounded-lg`, o ? `bg-om-bg-elevated text-om-text-primary shadow-om-sm` : `bg-transparent text-om-text-secondary shadow-none`),
                style: {
                    height: a.h,
                    fontSize: a.fs,
                    ...i ? {
                        width: a.h,
                        padding: 0
                    } : {
                        padding: `0 ${a.padX}px`
                    }
                },
                children: e.label
            }, e.value)
        })
    })
}

function qe({
    className: e,
    ...t
}) {
    return (0, w.jsx)(`span`, {
        className: d(`text-[11px] font-[450] leading-[1.4] text-om-text-tertiary`, e),
        ...t
    })
}

function Je(e) {
    let t = [];
    for (let n of e.messages) n.role === `assistant` && n.contentBlocks && t.push(...n.contentBlocks);
    return e.streaming ? .blocks && t.push(...e.streaming.blocks), t
}

function Ye(e) {
    return Je(e).flatMap(e => e.type === `tool_call` ? [e.toolCall] : [])
}

function Xe(e, t) {
    if (Array.isArray(t.todos)) return t.todos.map((e, t) => {
        let n = e.name ? ? e.text;
        return {
            id: String(t),
            text: typeof n == `string` ? n : ``,
            completed: e.completed === !0
        }
    });
    let n = ne(t.operations),
        r = [...e],
        i = r.reduce((e, t) => Math.max(e, Number(t.id) || 0), 0) + 1;
    for (let e of n) e.type === `add` ? r.push({
        id: String(i++),
        text: typeof e.name == `string` ? e.name : ``,
        completed: !1
    }) : e.type === `remove` ? r = r.filter(t => t.id !== e.id) : e.type === `complete` && (r = r.map(t => t.id === e.id ? { ...t,
        completed: !0
    } : t));
    return r
}

function Ze(e) {
    let t = (e.todos ? ? []).map(e => ({
        text: e.text,
        completed: e.completed
    }));
    if (t.length === 0) {
        let n = [];
        for (let t of Ye(e)) t.name === `update_todos` && (n = Xe(n, t.input ? ? {}));
        t = n.map(e => ({
            text: e.text,
            completed: e.completed
        }))
    }
    let n = t.filter(e => e.completed).length,
        r = t.find(e => !e.completed) ? ? null;
    return {
        total: t.length,
        done: n,
        current: r,
        items: t
    }
}

function Qe(e) {
    let t = e ? Ze(e) : null;
    return Math.max(t && t.total > 0 ? t.done / t.total * 100 : 0, 1)
}

function $e(e) {
    return e.messages.some(e => e.role === `user` && e.attachments ? .some(e => e.name === `Create design system`))
}

function et(e) {
    return e.kind === `design-system` ? !0 : Object.values(e.chats).some($e)
}

function tt(e) {
    return e === `needs-review` || e === `approved` || e === `changes-requested` ? e : void 0
}

function nt(e) {
    let t = {},
        n = (e, n, r) => {
            let i = t[e] ? .versions ? ? [],
                a = r.status ? ? `needs-review`,
                o = i.findIndex(e => e.path === n);
            o >= 0 ? (i[o].status = a, r.subtitle !== void 0 && (i[o].subtitle = r.subtitle), r.viewport !== void 0 && (i[o].viewport = {
                width: r.viewport.width,
                height: r.viewport.height ? ? i[o].viewport ? .height
            }), r.section !== void 0 && (i[o].section = r.section)) : i.push({
                path: n,
                createdAt: ``,
                status: a,
                subtitle: r.subtitle,
                viewport: r.viewport,
                section: r.section
            }), t[e] = {
                versions: i
            }
        },
        r = e => {
            let t = e;
            return t && typeof t.width == `number` ? {
                width: t.width,
                height: typeof t.height == `number` ? t.height : void 0
            } : void 0
        };
    for (let t of Ye(e))
        if (t.name === `register_assets`) {
            let e = ne(t.input ? .items);
            for (let t of e) typeof t.asset == `string` && typeof t.path == `string` && n(t.asset, t.path, {
                status: tt(t.status),
                subtitle: typeof t.subtitle == `string` ? t.subtitle : void 0,
                viewport: r(t.viewport),
                section: typeof t.group == `string` && t.group !== `` ? t.group : void 0
            })
        } else if (t.name === `write_file` && typeof t.input ? .asset == `string` && typeof t.input ? .path == `string`) {
        let e = t.input;
        n(t.input.asset, t.input.path, {
            subtitle: typeof e.subtitle == `string` ? e.subtitle : void 0,
            viewport: r(e.viewport)
        })
    }
    return t
}

function rt(e) {
    let t = 0;
    for (let n of e.messages)
        if (!(n.role !== `assistant` || !n.contentBlocks) && (t += n.contentBlocks.length, n.contentBlocks.some(e => e.type === `tool_call` && e.toolCall.name === `create_design_resource` && e.toolCall.input ? .type === `brand`))) return t;
    return e.streaming ? .blocks && (t += e.streaming.blocks.length), t
}

function it(e, t) {
    let n = Je(e).slice(0, t),
        r = t >= rt(e),
        i = [];
    for (let e of n) e.type === `tool_call` && e.toolCall.name === `update_todos` && (i = Xe(i, e.toolCall.input ? ? {}));
    return { ...e,
        messages: e.messages.filter(e => e.role === `user`),
        todos: i,
        streaming: {
            isLoading: !r,
            blocks: n,
            error: null
        }
    }
}
var at = e => `omelette.tabAccess.${e}`;

function ot(e) {
    try {
        let t = localStorage.getItem(at(e));
        if (!t) return {};
        let n = JSON.parse(t);
        return n && typeof n == `object` ? n : {}
    } catch {
        return {}
    }
}

function st(e, t) {
    try {
        localStorage.setItem(at(e), JSON.stringify(t))
    } catch {}
}
var ct = {
        load: ot,
        touch(e, t) {
            let n = ot(e);
            n[t] = Date.now(), st(e, n)
        },
        forget(e, t) {
            let n = ot(e);
            t in n && (delete n[t], st(e, n))
        },
        reconcile(e, t, n = Date.now()) {
            let r = ot(e),
                i = {};
            for (let e of t) i[e] = r[e] ? ? n;
            st(e, i)
        }
    },
    lt = globalThis.__omeletteProjectContext ? ? = (0, C.createContext)(null);

function ut() {
    return crypto.randomUUID()
}
var dt = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ft(e) {
    let t = {};
    for (let [n, r] of Object.entries(e.chats)) {
        let e = new Set,
            i = r.messages.filter(t => e.has(t.id) ? !1 : (e.add(t.id), !0));
        t[n] = i.length === r.messages.length ? r : { ...r,
            messages: i
        }
    }
    return { ...e,
        chats: t
    }
}

function pt({
    projectPath: e,
    serverPort: t,
    initialData: n,
    initialFile: r,
    canEdit: i,
    children: a
}) {
    let [o, s] = (0, C.useState)(null), [u, d] = (0, C.useState)(null), f = (0, C.useRef)(null);
    f.current = o;
    let {
        showToast: p
    } = v();
    (0, C.useEffect)(() => (d(null), (n ? Promise.resolve(n) : S.getProjectData(e)).then(t => {
        if (t.viewState.openFiles = t.viewState.openFiles.map(re), r) {
            let e = re(r);
            t.viewState.openFiles.includes(e) || t.viewState.openFiles.push(e), t.viewState.activeFileTab = t.viewState.openFiles.indexOf(e) + 1
        } else(et(t) || oe() ? .type === `design_system`) && (t.viewState.activeFileTab = -2);
        s(ft(t));
        let n = Date.now(),
            a = ct.load(e),
            o = t.viewState.openFiles.filter(e => n - (a[e] ? ? n) > ie);
        o.length > 0 && S.updateProjectData(e, {
            type: `CLOSE_STALE_FILE_TABS`,
            stale: o
        }, {
            persist: i
        }), ct.reconcile(e, t.viewState.openFiles, n);
        let c = t.viewState.activeFileTab > 0 ? t.viewState.openFiles[t.viewState.activeFileTab - 1] : void 0;
        c && ct.touch(e, c)
    }).catch(e => {
        d(l(e))
    }), S.onProjectDataChanged((t, n) => {
        t === e && s(() => ft(n))
    })), [e]);
    let m = (0, C.useCallback)(t => {
            S.updateProjectData(e, t, {
                persist: i
            })
        }, [e, i]),
        h = (0, C.useCallback)(e => {
            m({
                type: `LOCAL_SET_ACTIVE_CHAT`,
                payload: e
            })
        }, [m]),
        g = (0, C.useCallback)(() => {
            let e = new Date().toISOString(),
                t = {
                    id: ut(),
                    title: se,
                    created: e,
                    lastOpened: e,
                    messages: [],
                    composer: {
                        text: ``,
                        attachments: [],
                        activeSkills: []
                    }
                };
            return m({
                type: `SHARED_CREATE_CHAT`,
                payload: t
            }), m({
                type: `LOCAL_SET_ACTIVE_CHAT`,
                payload: t.id
            }), t
        }, [m]),
        _ = (0, C.useCallback)(t => {
            S.cleanupChat(t, {
                deleted: !0
            }), m({
                type: `SHARED_DELETE_CHAT`,
                payload: t
            }), dt.test(t) && S.deleteChatRemote(e, t)
        }, [m, e]),
        y = (0, C.useCallback)(e => {
            S.cleanupChat(e), b(`viewport-gc`, {
                viewportKey: e
            }), m({
                type: `SHARED_CLOSE_CHAT`,
                payload: e
            })
        }, [m]),
        ne = (0, C.useCallback)(e => {
            b(`viewport-gc`, {
                viewportKey: e
            }), f.current ? .chats[e] ? .streaming ? .isLoading && S.interruptAgent(e), S.cleanupChat(e), m({
                type: `SHARED_CLOSE_CHAT`,
                payload: e
            })
        }, [m]),
        ae = (0, C.useCallback)(e => {
            m({
                type: `SHARED_REOPEN_CHAT`,
                payload: e
            }), m({
                type: `LOCAL_SET_ACTIVE_CHAT`,
                payload: e
            })
        }, [m]),
        ce = o ? .viewState.activeChatId ? ? null,
        le = (0, C.useRef)(new Set),
        ue = !!ce && !!o ? .chats[ce] ? .metadataOnly;
    (0, C.useEffect)(() => {
        if (!ce || !ue || le.current.has(ce)) return;
        le.current.add(ce);
        let t = ce,
            n = f.current ? .chats[t] ? .messageCount ? ? f.current ? .closedChats ? .find(e => e.id === t) ? .messageCount,
            r = new AbortController;
        return (async () => {
            let i;
            try {
                if (i = await S.getChatMessages(e, t, r.signal), r.signal.aborted) return;
                if (i.length === 0 && (n ? ? 1) > 0) throw Error(`empty chat body (expected ${n})`);
                n !== void 0 && i.length
            } catch {
                if (r.signal.aborted) return;
                f.current ? .chats[t] ? .metadataOnly && (S.cleanupChat(t), b(`viewport-gc`, {
                    viewportKey: t
                }), m({
                    type: `SHARED_CLOSE_CHAT`,
                    payload: t
                }), p(`Could not load chat — reopen from Recently Closed`, `error`));
                return
            } finally {
                r.signal.aborted || le.current.delete(t)
            }
            r.signal.aborted || f.current ? .chats[t] && m({
                type: `SHARED_REOPEN_CHAT`,
                payload: t,
                messages: i
            })
        })(), () => {
            r.abort(), le.current.delete(t)
        }
    }, [e, ce, ue, m, p]);
    let de = (0, C.useCallback)(t => {
            S.cleanupChat(t, {
                deleted: !0
            }), b(`viewport-gc`, {
                viewportKey: t
            }), m({
                type: `SHARED_DELETE_CLOSED_CHAT`,
                payload: t
            }), dt.test(t) && S.deleteChatRemote(e, t)
        }, [m, e]),
        {
            userId: fe,
            displayName: pe,
            email: me
        } = c() ? ? {},
        he = (0, C.useMemo)(() => fe != null && pe !== me ? {
            authorAccountUuid: fe,
            authorName: pe
        } : fe == null ? void 0 : {
            authorAccountUuid: fe
        }, [fe, pe, me]),
        ge = (0, C.useCallback)((e, t) => {
            let n = t.id ? ? ut();
            return m({
                type: `SHARED_ADD_MESSAGE`,
                chatId: e,
                payload: { ...t,
                    ...t.role === `user` && he ? he : {},
                    id: n,
                    timestamp: new Date().toISOString()
                }
            }), n
        }, [m, he]),
        _e = (0, C.useCallback)((t, n) => {
            S.appendCachedMessage(e, t, n), s(e => {
                if (!e) return e;
                let r = e.chats[t];
                return !r || r.messages.some(e => e.id === n.id) ? e : { ...e,
                    chats: { ...e.chats,
                        [t]: { ...r,
                            messages: [...r.messages, n]
                        }
                    }
                }
            })
        }, []),
        ve = (0, C.useCallback)((e, t) => {
            m({
                type: `LOCAL_UPDATE_COMPOSER`,
                chatId: e,
                payload: t
            })
        }, [m]),
        ye = (0, C.useCallback)((e, t) => {
            m({
                type: `LOCAL_APPEND_ATTACHMENTS`,
                chatId: e,
                payload: t
            })
        }, [m]),
        be = (0, C.useCallback)((e, t) => {
            m({
                type: `LOCAL_SET_FOLDER_ATTACHMENTS`,
                chatId: e,
                payload: t
            })
        }, [m]),
        xe = (0, C.useCallback)((e, t) => {
            m({
                type: `LOCAL_SET_DS_SKILL_ATTACHMENTS`,
                chatId: e,
                payload: t
            })
        }, [m]),
        Se = (0, C.useCallback)((e, t, n) => {
            m({
                type: `LOCAL_UPSERT_ATTACHMENT`,
                chatId: e,
                attachment: t ? ? void 0,
                removeId: n
            })
        }, [m]),
        Ce = (0, C.useCallback)((e, t) => {
            m({
                type: `LOCAL_RESOLVE_ATTACHMENTS`,
                chatId: e,
                resolved: t
            })
        }, [m]),
        we = (0, C.useCallback)((e, t) => {
            m({
                type: `SHARED_UPDATE_CHAT`,
                chatId: e,
                payload: t
            })
        }, [m]),
        Te = (0, C.useCallback)((e, t, n) => {
            m({
                type: `SHARED_TRUNCATE_CHAT`,
                chatId: e,
                length: t,
                expectedLength: n
            })
        }, [m]),
        Ee = (0, C.useCallback)(t => {
            let {
                barePath: n,
                fragment: r
            } = te(t);
            if (!n) return;
            let i = re(n);
            i && (r ? x(i, r) : ee(i), m({
                type: `OPEN_FILE`,
                payload: i
            }), ct.touch(e, i), setTimeout(() => {
                b(`agent-show-fragment`, {
                    filePath: i,
                    fragment: r
                })
            }, 0))
        }, [m, e]),
        De = (0, C.useCallback)(t => {
            m({
                type: `CLOSE_FILE`,
                payload: t
            }), ct.forget(e, t)
        }, [m, e]),
        Oe = (0, C.useCallback)(t => {
            m({
                type: `SET_ACTIVE_FILE_TAB`,
                payload: t
            });
            let n = t > 0 ? f.current ? .viewState.openFiles[t - 1] : void 0;
            n && ct.touch(e, n)
        }, [m, e]),
        ke = (0, C.useCallback)(e => {
            m({
                type: `NAVIGATE_FOLDER`,
                payload: e
            })
        }, [m]),
        Ae = (0, C.useCallback)(() => {
            m({
                type: `NAVIGATE_BACK`
            })
        }, [m]),
        je = (0, C.useCallback)(() => {
            m({
                type: `NAVIGATE_FORWARD`
            })
        }, [m]),
        Me = (0, C.useCallback)(e => {
            m({
                type: `SET_ACTIVE_SKILLS`,
                payload: e
            })
        }, [m]),
        Ne = (0, C.useCallback)((e, t, n) => {
            m({
                type: `SHARED_ADD_COMMENT`,
                chatId: e,
                messageId: t,
                payload: n
            })
        }, [m]),
        Pe = (0, C.useCallback)((e, t, n) => {
            m({
                type: `SHARED_RESOLVE_COMMENT`,
                chatId: e,
                messageId: t,
                commentId: n
            })
        }, [m]),
        Fe = (0, C.useCallback)(() => S.flush(), []),
        Ie = (0, C.useCallback)(e => {
            m({
                type: `SHARED_START_STREAMING`,
                chatId: e
            })
        }, [m]),
        Le = (0, C.useCallback)((e, t) => {
            m({
                type: `SHARED_ADD_STREAMING_INTERJECTION`,
                chatId: e,
                payload: t
            })
        }, [m]),
        Re = (0, C.useCallback)((e, t, n, r) => {
            m({
                type: `SHARED_UPDATE_PARAMETERIZED_EDIT`,
                chatId: e,
                toolCallId: t,
                lastApplied: n,
                values: r
            })
        }, [m]),
        ze = (0, C.useCallback)((e, t, n) => {
            m({
                type: `SHARED_SET_STREAMING_ERROR`,
                chatId: e,
                payload: t,
                debugInfo: n
            })
        }, [m]),
        Be = (0, C.useCallback)((e, t, n, r, i) => {
            m({
                type: `SHARED_FINISH_STREAMING`,
                chatId: e,
                resultText: t,
                sessionId: n,
                inputTokens: r,
                messageId: i
            })
        }, [m]),
        Ve = (0, C.useMemo)(() => ({
            projectPath: e,
            serverPort: t,
            data: o,
            loadError: u,
            setActiveChat: h,
            createChat: g,
            deleteChat: _,
            closeChat: y,
            retireChat: ne,
            reopenChat: ae,
            deleteClosedChat: de,
            addMessage: ge,
            appendRemoteMessage: _e,
            updateComposer: ve,
            appendAttachments: ye,
            setFolderAttachments: be,
            setDsSkillAttachments: xe,
            upsertComposerAttachment: Se,
            resolveAttachments: Ce,
            updateChat: we,
            truncateChatMessages: Te,
            openFile: Ee,
            closeFile: De,
            setActiveFileTab: Oe,
            navigateFolder: ke,
            navigateBack: Ae,
            navigateForward: je,
            setActiveSkills: Me,
            addComment: Ne,
            resolveComment: Pe,
            flush: Fe,
            startStreaming: Ie,
            addStreamingInterjection: Le,
            updateParameterizedEdit: Re,
            setStreamingError: ze,
            finishStreaming: Be
        }), [e, t, o, u, h, g, _, y, ne, ae, de, ge, _e, ve, ye, be, xe, Se, Ce, we, Te, Ee, De, Oe, ke, Ae, je, Me, Ne, Pe, Fe, Ie, Le, Re, ze, Be]);
    return (0, w.jsx)(lt.Provider, {
        value: Ve,
        children: a
    })
}

function mt() {
    let e = (0, C.useContext)(lt);
    if (!e) throw Error(`useProject must be used within a ProjectProvider`);
    return e
}

function ht() {
    return (0, C.useContext)(lt)
}

function gt() {
    return mt().data
}

function _t() {
    return mt().data ? .viewState ? ? null
}

function vt() {
    let {
        data: e
    } = mt();
    return e ? .viewState ? .activeChatId ? e.chats[e.viewState.activeChatId] ? ? null : null
}

function yt() {
    let {
        data: e
    } = mt();
    return e ? Object.values(e.chats).sort((e, t) => new Date(e.created).getTime() - new Date(t.created).getTime()) : []
}

function bt() {
    return mt().data ? .viewState ? .openFiles ? ? []
}
var xt = `Animated video`;

function St() {
    let e = gt();
    if (!e) return !1;
    if (e.activeSkills ? .includes(xt)) return !0;
    let t = e => e.type === `skill` && e.name === xt;
    for (let n of [...Object.values(e.chats), ...e.closedChats ? ? []])
        if (!n.metadataOnly) {
            if (n.composer ? .activeSkills ? .includes(xt) || n.composer ? .attachments ? .some(t)) return !0;
            for (let e of n.messages ? ? [])
                if (e.attachments ? .some(t)) return !0
        }
    return !1
}
var Ct = 7;

function wt({
    label: e,
    secondary: t,
    shortcut: n,
    delay: r = 400,
    open: i = !1,
    children: a
}) {
    let o = (0, C.useRef)(null),
        s = (0, C.useRef)(null),
        c = (0, C.useRef)(null),
        [l, u] = (0, C.useState)(null),
        [f, p] = (0, C.useState)(null),
        m = () => {
            c.current && = (clearTimeout(c.current), null)
        },
        h = () => {
            let e = o.current ? .getBoundingClientRect();
            e && u({
                x: e.left + e.width / 2,
                top: e.top,
                bottom: e.bottom
            })
        },
        g = () => {
            m(), c.current = setTimeout(h, r)
        },
        _ = () => {
            i || (m(), u(null), p(null))
        };
    (0, C.useEffect)(() => m, []), (0, C.useLayoutEffect)(() => {
        m(), i ? h() : (u(null), p(null))
    }, [i]), (0, C.useEffect)(() => {
        if (!l) return;
        let e = i ? h : _;
        return window.addEventListener(`scroll`, e, !0), window.addEventListener(`resize`, e), () => {
            window.removeEventListener(`scroll`, e, !0), window.removeEventListener(`resize`, e)
        }
    }, [l, i]), (0, C.useLayoutEffect)(() => {
        if (!l || !s.current) return;
        let e = s.current.getBoundingClientRect(),
            t = document.documentElement.clientWidth,
            n = document.documentElement.clientHeight,
            r = e.width / 2,
            i = Math.min(Math.max(l.x, Ct + r), t - Ct - r) - r,
            a = Math.min(Math.max(l.x - i, 8), e.width - 8),
            o = l.bottom + Ct + e.height <= n - Ct,
            c = l.top - Ct - e.height >= Ct,
            u = o || !c ? `bottom` : `top`;
        p({
            left: i,
            top: u === `bottom` ? l.bottom + Ct : l.top - Ct - e.height,
            arrowX: a,
            side: u
        })
    }, [l]);
    let v = f ? .side ? ? `bottom`;
    return (0, w.jsxs)(`div`, {
        ref: o,
        className: `inline-flex`,
        onMouseEnter: g,
        onFocus: g,
        onMouseLeave: _,
        onBlur: _,
        onClick: _,
        children: [a, l && (0, le.createPortal)((0, w.jsxs)(`div`, {
            ref: s,
            role: `tooltip`,
            className: `fixed px-2.5 py-1.5 text-[11px] font-medium leading-[1.3] text-om-text-inverse bg-om-accent-black rounded-lg max-w-[240px] [overflow-wrap:break-word] pointer-events-none z-om-popover`,
            style: f ? {
                left: f.left,
                top: f.top
            } : {
                left: 0,
                top: 0,
                visibility: `hidden`
            },
            children: [(0, w.jsx)(`div`, {
                className: d(`absolute -translate-x-1/2 border-[5px] border-transparent`, v === `bottom` ? `bottom-full border-b-om-accent-black border-t-0` : `top-full border-t-om-accent-black border-b-0`),
                style: {
                    left: f ? .arrowX ? ? `50%`
                }
            }), e, n && (0, w.jsx)(`span`, {
                className: `ml-1.5 opacity-60`,
                children: n
            }), t && (0, w.jsx)(`div`, {
                className: `mt-0.5 text-[10px] font-normal opacity-60`,
                children: t
            })]
        }), document.body)]
    })
}
var Tt = typeof navigator < `u` && /Mac/.test(navigator.platform),
    Et = Tt ? `⌘` : `Ctrl`,
    Dt = e => Tt ? `⌘${e}` : `Ctrl+${e}`;

function Ot({
    className: e,
    ...t
}) {
    return (0, w.jsx)(`kbd`, {
        className: d(`om-kbd inline-block min-w-[1.5em] px-1 text-center align-baseline whitespace-nowrap`, `text-[0.93em] font-medium leading-normal [font-family:ui-monospace,Menlo,monospace]`, `rounded-[4px] border border-b-2 border-om-border-default bg-om-bg-panel text-om-text-primary`, `[&+.om-kbd]:ml-0.5`, e),
        ...t
    })
}

function T(e) {
    this.content = e
}
T.prototype = {
    constructor: T,
    find: function(e) {
        for (var t = 0; t < this.content.length; t += 2)
            if (this.content[t] === e) return t;
        return -1
    },
    get: function(e) {
        var t = this.find(e);
        return t == -1 ? void 0 : this.content[t + 1]
    },
    update: function(e, t, n) {
        var r = n && n != e ? this.remove(n) : this,
            i = r.find(e),
            a = r.content.slice();
        return i == -1 ? a.push(n || e, t) : (a[i + 1] = t, n && (a[i] = n)), new T(a)
    },
    remove: function(e) {
        var t = this.find(e);
        if (t == -1) return this;
        var n = this.content.slice();
        return n.splice(t, 2), new T(n)
    },
    addToStart: function(e, t) {
        return new T([e, t].concat(this.remove(e).content))
    },
    addToEnd: function(e, t) {
        var n = this.remove(e).content.slice();
        return n.push(e, t), new T(n)
    },
    addBefore: function(e, t, n) {
        var r = this.remove(t),
            i = r.content.slice(),
            a = r.find(e);
        return i.splice(a == -1 ? i.length : a, 0, t, n), new T(i)
    },
    forEach: function(e) {
        for (var t = 0; t < this.content.length; t += 2) e(this.content[t], this.content[t + 1])
    },
    prepend: function(e) {
        return e = T.from(e), e.size ? new T(e.content.concat(this.subtract(e).content)) : this
    },
    append: function(e) {
        return e = T.from(e), e.size ? new T(this.subtract(e).content.concat(e.content)) : this
    },
    subtract: function(e) {
        var t = this;
        e = T.from(e);
        for (var n = 0; n < e.content.length; n += 2) t = t.remove(e.content[n]);
        return t
    },
    toObject: function() {
        var e = {};
        return this.forEach(function(t, n) {
            e[t] = n
        }), e
    },
    get size() {
        return this.content.length >> 1
    }
}, T.from = function(e) {
    if (e instanceof T) return e;
    var t = [];
    if (e)
        for (var n in e) t.push(n, e[n]);
    return new T(t)
};

function kt(e, t, n) {
    for (let r = 0;; r++) {
        if (r == e.childCount || r == t.childCount) return e.childCount == t.childCount ? null : n;
        let i = e.child(r),
            a = t.child(r);
        if (i == a) {
            n += i.nodeSize;
            continue
        }
        if (!i.sameMarkup(a)) return n;
        if (i.isText && i.text != a.text) {
            for (let e = 0; i.text[e] == a.text[e]; e++) n++;
            return n
        }
        if (i.content.size || a.content.size) {
            let e = kt(i.content, a.content, n + 1);
            if (e != null) return e
        }
        n += i.nodeSize
    }
}

function At(e, t, n, r) {
    for (let i = e.childCount, a = t.childCount;;) {
        if (i == 0 || a == 0) return i == a ? null : {
            a: n,
            b: r
        };
        let o = e.child(--i),
            s = t.child(--a),
            c = o.nodeSize;
        if (o == s) {
            n -= c, r -= c;
            continue
        }
        if (!o.sameMarkup(s)) return {
            a: n,
            b: r
        };
        if (o.isText && o.text != s.text) {
            let e = 0,
                t = Math.min(o.text.length, s.text.length);
            for (; e < t && o.text[o.text.length - e - 1] == s.text[s.text.length - e - 1];) e++, n--, r--;
            return {
                a: n,
                b: r
            }
        }
        if (o.content.size || s.content.size) {
            let e = At(o.content, s.content, n - 1, r - 1);
            if (e) return e
        }
        n -= c, r -= c
    }
}
var E = class e {
    constructor(e, t) {
        if (this.content = e, this.size = t || 0, t == null)
            for (let t = 0; t < e.length; t++) this.size += e[t].nodeSize
    }
    nodesBetween(e, t, n, r = 0, i) {
        for (let a = 0, o = 0; o < t; a++) {
            let s = this.content[a],
                c = o + s.nodeSize;
            if (c > e && n(s, r + o, i || null, a) !== !1 && s.content.size) {
                let i = o + 1;
                s.nodesBetween(Math.max(0, e - i), Math.min(s.content.size, t - i), n, r + i)
            }
            o = c
        }
    }
    descendants(e) {
        this.nodesBetween(0, this.size, e)
    }
    textBetween(e, t, n, r) {
        let i = ``,
            a = !0;
        return this.nodesBetween(e, t, (o, s) => {
            let c = o.isText ? o.text.slice(Math.max(e, s) - s, t - s) : o.isLeaf ? r ? typeof r == `function` ? r(o) : r : o.type.spec.leafText ? o.type.spec.leafText(o) : `` : ``;
            o.isBlock && (o.isLeaf && c || o.isTextblock) && n && (a ? a = !1 : i += n), i += c
        }, 0), i
    }
    append(t) {
        if (!t.size) return this;
        if (!this.size) return t;
        let n = this.lastChild,
            r = t.firstChild,
            i = this.content.slice(),
            a = 0;
        for (n.isText && n.sameMarkup(r) && (i[i.length - 1] = n.withText(n.text + r.text), a = 1); a < t.content.length; a++) i.push(t.content[a]);
        return new e(i, this.size + t.size)
    }
    cut(t, n = this.size) {
        if (t == 0 && n == this.size) return this;
        let r = [],
            i = 0;
        if (n > t)
            for (let e = 0, a = 0; a < n; e++) {
                let o = this.content[e],
                    s = a + o.nodeSize;
                s > t && ((a < t || s > n) && (o = o.isText ? o.cut(Math.max(0, t - a), Math.min(o.text.length, n - a)) : o.cut(Math.max(0, t - a - 1), Math.min(o.content.size, n - a - 1))), r.push(o), i += o.nodeSize), a = s
            }
        return new e(r, i)
    }
    cutByIndex(t, n) {
        return t == n ? e.empty : t == 0 && n == this.content.length ? this : new e(this.content.slice(t, n))
    }
    replaceChild(t, n) {
        let r = this.content[t];
        if (r == n) return this;
        let i = this.content.slice(),
            a = this.size + n.nodeSize - r.nodeSize;
        return i[t] = n, new e(i, a)
    }
    addToStart(t) {
        return new e([t].concat(this.content), this.size + t.nodeSize)
    }
    addToEnd(t) {
        return new e(this.content.concat(t), this.size + t.nodeSize)
    }
    eq(e) {
        if (this.content.length != e.content.length) return !1;
        for (let t = 0; t < this.content.length; t++)
            if (!this.content[t].eq(e.content[t])) return !1;
        return !0
    }
    get firstChild() {
        return this.content.length ? this.content[0] : null
    }
    get lastChild() {
        return this.content.length ? this.content[this.content.length - 1] : null
    }
    get childCount() {
        return this.content.length
    }
    child(e) {
        let t = this.content[e];
        if (!t) throw RangeError(`Index ` + e + ` out of range for ` + this);
        return t
    }
    maybeChild(e) {
        return this.content[e] || null
    }
    forEach(e) {
        for (let t = 0, n = 0; t < this.content.length; t++) {
            let r = this.content[t];
            e(r, n, t), n += r.nodeSize
        }
    }
    findDiffStart(e, t = 0) {
        return kt(this, e, t)
    }
    findDiffEnd(e, t = this.size, n = e.size) {
        return At(this, e, t, n)
    }
    findIndex(e) {
        if (e == 0) return Mt(0, e);
        if (e == this.size) return Mt(this.content.length, e);
        if (e > this.size || e < 0) throw RangeError(`Position ${e} outside of fragment (${this})`);
        for (let t = 0, n = 0;; t++) {
            let r = this.child(t),
                i = n + r.nodeSize;
            if (i >= e) return i == e ? Mt(t + 1, i) : Mt(t, n);
            n = i
        }
    }
    toString() {
        return `<` + this.toStringInner() + `>`
    }
    toStringInner() {
        return this.content.join(`, `)
    }
    toJSON() {
        return this.content.length ? this.content.map(e => e.toJSON()) : null
    }
    static fromJSON(t, n) {
        if (!n) return e.empty;
        if (!Array.isArray(n)) throw RangeError(`Invalid input for Fragment.fromJSON`);
        return e.fromArray(n.map(t.nodeFromJSON))
    }
    static fromArray(t) {
        if (!t.length) return e.empty;
        let n, r = 0;
        for (let e = 0; e < t.length; e++) {
            let i = t[e];
            r += i.nodeSize, e && i.isText && t[e - 1].sameMarkup(i) ? (n || = t.slice(0, e), n[n.length - 1] = i.withText(n[n.length - 1].text + i.text)) : n && n.push(i)
        }
        return new e(n || t, r)
    }
    static from(t) {
        if (!t) return e.empty;
        if (t instanceof e) return t;
        if (Array.isArray(t)) return this.fromArray(t);
        if (t.attrs) return new e([t], t.nodeSize);
        throw RangeError(`Can not convert ` + t + ` to a Fragment` + (t.nodesBetween ? ` (looks like multiple versions of prosemirror-model were loaded)` : ``))
    }
};
E.empty = new E([], 0);
var jt = {
    index: 0,
    offset: 0
};

function Mt(e, t) {
    return jt.index = e, jt.offset = t, jt
}

function Nt(e, t) {
    if (e === t) return !0;
    if (!(e && typeof e == `object`) || !(t && typeof t == `object`)) return !1;
    let n = Array.isArray(e);
    if (Array.isArray(t) != n) return !1;
    if (n) {
        if (e.length != t.length) return !1;
        for (let n = 0; n < e.length; n++)
            if (!Nt(e[n], t[n])) return !1
    } else {
        for (let n in e)
            if (!(n in t) || !Nt(e[n], t[n])) return !1;
        for (let n in t)
            if (!(n in e)) return !1
    }
    return !0
}
var D = class e {
    constructor(e, t) {
        this.type = e, this.attrs = t
    }
    addToSet(e) {
        let t, n = !1;
        for (let r = 0; r < e.length; r++) {
            let i = e[r];
            if (this.eq(i)) return e;
            if (this.type.excludes(i.type)) t || = e.slice(0, r);
            else if (i.type.excludes(this.type)) return e;
            else !n && i.type.rank > this.type.rank && (t || = e.slice(0, r), t.push(this), n = !0), t && t.push(i)
        }
        return t || = e.slice(), n || t.push(this), t
    }
    removeFromSet(e) {
        for (let t = 0; t < e.length; t++)
            if (this.eq(e[t])) return e.slice(0, t).concat(e.slice(t + 1));
        return e
    }
    isInSet(e) {
        for (let t = 0; t < e.length; t++)
            if (this.eq(e[t])) return !0;
        return !1
    }
    eq(e) {
        return this == e || this.type == e.type && Nt(this.attrs, e.attrs)
    }
    toJSON() {
        let e = {
            type: this.type.name
        };
        for (let t in this.attrs) {
            e.attrs = this.attrs;
            break
        }
        return e
    }
    static fromJSON(e, t) {
        if (!t) throw RangeError(`Invalid input for Mark.fromJSON`);
        let n = e.marks[t.type];
        if (!n) throw RangeError(`There is no mark type ${t.type} in this schema`);
        let r = n.create(t.attrs);
        return n.checkAttrs(r.attrs), r
    }
    static sameSet(e, t) {
        if (e == t) return !0;
        if (e.length != t.length) return !1;
        for (let n = 0; n < e.length; n++)
            if (!e[n].eq(t[n])) return !1;
        return !0
    }
    static setFrom(t) {
        if (!t || Array.isArray(t) && t.length == 0) return e.none;
        if (t instanceof e) return [t];
        let n = t.slice();
        return n.sort((e, t) => e.type.rank - t.type.rank), n
    }
};
D.none = [];
var Pt = class extends Error {},
    O = class e {
        constructor(e, t, n) {
            this.content = e, this.openStart = t, this.openEnd = n
        }
        get size() {
            return this.content.size - this.openStart - this.openEnd
        }
        insertAt(t, n) {
            let r = It(this.content, t + this.openStart, n, this.openStart + 1, this.openEnd + 1);
            return r && new e(r, this.openStart, this.openEnd)
        }
        removeBetween(t, n) {
            return new e(Ft(this.content, t + this.openStart, n + this.openStart), this.openStart, this.openEnd)
        }
        eq(e) {
            return this.content.eq(e.content) && this.openStart == e.openStart && this.openEnd == e.openEnd
        }
        toString() {
            return this.content + `(` + this.openStart + `,` + this.openEnd + `)`
        }
        toJSON() {
            if (!this.content.size) return null;
            let e = {
                content: this.content.toJSON()
            };
            return this.openStart > 0 && (e.openStart = this.openStart), this.openEnd > 0 && (e.openEnd = this.openEnd), e
        }
        static fromJSON(t, n) {
            if (!n) return e.empty;
            let r = n.openStart || 0,
                i = n.openEnd || 0;
            if (typeof r != `number` || typeof i != `number`) throw RangeError(`Invalid input for Slice.fromJSON`);
            return new e(E.fromJSON(t, n.content), r, i)
        }
        static maxOpen(t, n = !0) {
            let r = 0,
                i = 0;
            for (let e = t.firstChild; e && !e.isLeaf && (n || !e.type.spec.isolating); e = e.firstChild) r++;
            for (let e = t.lastChild; e && !e.isLeaf && (n || !e.type.spec.isolating); e = e.lastChild) i++;
            return new e(t, r, i)
        }
    };
O.empty = new O(E.empty, 0, 0);

function Ft(e, t, n) {
    let {
        index: r,
        offset: i
    } = e.findIndex(t), a = e.maybeChild(r), {
        index: o,
        offset: s
    } = e.findIndex(n);
    if (i == t || a.isText) {
        if (s != n && !e.child(o).isText) throw RangeError(`Removing non-flat range`);
        return e.cut(0, t).append(e.cut(n))
    }
    if (r != o) throw RangeError(`Removing non-flat range`);
    return e.replaceChild(r, a.copy(Ft(a.content, t - i - 1, n - i - 1)))
}

function It(e, t, n, r, i, a) {
    let {
        index: o,
        offset: s
    } = e.findIndex(t), c = e.maybeChild(o);
    if (s == t || c.isText) return a && r <= 0 && i <= 0 && !a.canReplace(o, o, n) ? null : e.cut(0, t).append(n).append(e.cut(t));
    let l = It(c.content, t - s - 1, n, o == 0 ? r - 1 : 0, o == e.childCount - 1 ? i - 1 : 0, c);
    return l && e.replaceChild(o, c.copy(l))
}

function Lt(e, t, n) {
    if (n.openStart > e.depth) throw new Pt(`Inserted content deeper than insertion position`);
    if (e.depth - n.openStart != t.depth - n.openEnd) throw new Pt(`Inconsistent open depths`);
    return Rt(e, t, n, 0)
}

function Rt(e, t, n, r) {
    let i = e.index(r),
        a = e.node(r);
    if (i == t.index(r) && r < e.depth - n.openStart) {
        let o = Rt(e, t, n, r + 1);
        return a.copy(a.content.replaceChild(i, o))
    } else if (!n.content.size) return Ut(a, Gt(e, t, r));
    else if (!n.openStart && !n.openEnd && e.depth == r && t.depth == r) {
        let r = e.parent,
            i = r.content;
        return Ut(r, i.cut(0, e.parentOffset).append(n.content).append(i.cut(t.parentOffset)))
    } else {
        let {
            start: i,
            end: o
        } = Kt(n, e);
        return Ut(a, Wt(e, i, o, t, r))
    }
}

function zt(e, t) {
    if (!t.type.compatibleContent(e.type)) throw new Pt(`Cannot join ` + t.type.name + ` onto ` + e.type.name)
}

function Bt(e, t, n) {
    let r = e.node(n);
    return zt(r, t.node(n)), r
}

function Vt(e, t) {
    let n = t.length - 1;
    n >= 0 && e.isText && e.sameMarkup(t[n]) ? t[n] = e.withText(t[n].text + e.text) : t.push(e)
}

function Ht(e, t, n, r) {
    let i = (t || e).node(n),
        a = 0,
        o = t ? t.index(n) : i.childCount;
    e && (a = e.index(n), e.depth > n ? a++ : e.textOffset && (Vt(e.nodeAfter, r), a++));
    for (let e = a; e < o; e++) Vt(i.child(e), r);
    t && t.depth == n && t.textOffset && Vt(t.nodeBefore, r)
}

function Ut(e, t) {
    return e.type.checkContent(t), e.copy(t)
}

function Wt(e, t, n, r, i) {
    let a = e.depth > i && Bt(e, t, i + 1),
        o = r.depth > i && Bt(n, r, i + 1),
        s = [];
    return Ht(null, e, i, s), a && o && t.index(i) == n.index(i) ? (zt(a, o), Vt(Ut(a, Wt(e, t, n, r, i + 1)), s)) : (a && Vt(Ut(a, Gt(e, t, i + 1)), s), Ht(t, n, i, s), o && Vt(Ut(o, Gt(n, r, i + 1)), s)), Ht(r, null, i, s), new E(s)
}

function Gt(e, t, n) {
    let r = [];
    return Ht(null, e, n, r), e.depth > n && Vt(Ut(Bt(e, t, n + 1), Gt(e, t, n + 1)), r), Ht(t, null, n, r), new E(r)
}

function Kt(e, t) {
    let n = t.depth - e.openStart,
        r = t.node(n).copy(e.content);
    for (let e = n - 1; e >= 0; e--) r = t.node(e).copy(E.from(r));
    return {
        start: r.resolveNoCache(e.openStart + n),
        end: r.resolveNoCache(r.content.size - e.openEnd - n)
    }
}
var qt = class e {
        constructor(e, t, n) {
            this.pos = e, this.path = t, this.parentOffset = n, this.depth = t.length / 3 - 1
        }
        resolveDepth(e) {
            return e == null ? this.depth : e < 0 ? this.depth + e : e
        }
        get parent() {
            return this.node(this.depth)
        }
        get doc() {
            return this.node(0)
        }
        node(e) {
            return this.path[this.resolveDepth(e) * 3]
        }
        index(e) {
            return this.path[this.resolveDepth(e) * 3 + 1]
        }
        indexAfter(e) {
            return e = this.resolveDepth(e), this.index(e) + (e == this.depth && !this.textOffset ? 0 : 1)
        }
        start(e) {
            return e = this.resolveDepth(e), e == 0 ? 0 : this.path[e * 3 - 1] + 1
        }
        end(e) {
            return e = this.resolveDepth(e), this.start(e) + this.node(e).content.size
        }
        before(e) {
            if (e = this.resolveDepth(e), !e) throw RangeError(`There is no position before the top-level node`);
            return e == this.depth + 1 ? this.pos : this.path[e * 3 - 1]
        }
        after(e) {
            if (e = this.resolveDepth(e), !e) throw RangeError(`There is no position after the top-level node`);
            return e == this.depth + 1 ? this.pos : this.path[e * 3 - 1] + this.path[e * 3].nodeSize
        }
        get textOffset() {
            return this.pos - this.path[this.path.length - 1]
        }
        get nodeAfter() {
            let e = this.parent,
                t = this.index(this.depth);
            if (t == e.childCount) return null;
            let n = this.pos - this.path[this.path.length - 1],
                r = e.child(t);
            return n ? e.child(t).cut(n) : r
        }
        get nodeBefore() {
            let e = this.index(this.depth),
                t = this.pos - this.path[this.path.length - 1];
            return t ? this.parent.child(e).cut(0, t) : e == 0 ? null : this.parent.child(e - 1)
        }
        posAtIndex(e, t) {
            t = this.resolveDepth(t);
            let n = this.path[t * 3],
                r = t == 0 ? 0 : this.path[t * 3 - 1] + 1;
            for (let t = 0; t < e; t++) r += n.child(t).nodeSize;
            return r
        }
        marks() {
            let e = this.parent,
                t = this.index();
            if (e.content.size == 0) return D.none;
            if (this.textOffset) return e.child(t).marks;
            let n = e.maybeChild(t - 1),
                r = e.maybeChild(t);
            if (!n) {
                let e = n;
                n = r, r = e
            }
            let i = n.marks;
            for (var a = 0; a < i.length; a++) i[a].type.spec.inclusive === !1 && (!r || !i[a].isInSet(r.marks)) && (i = i[a--].removeFromSet(i));
            return i
        }
        marksAcross(e) {
            let t = this.parent.maybeChild(this.index());
            if (!t || !t.isInline) return null;
            let n = t.marks,
                r = e.parent.maybeChild(e.index());
            for (var i = 0; i < n.length; i++) n[i].type.spec.inclusive === !1 && (!r || !n[i].isInSet(r.marks)) && (n = n[i--].removeFromSet(n));
            return n
        }
        sharedDepth(e) {
            for (let t = this.depth; t > 0; t--)
                if (this.start(t) <= e && this.end(t) >= e) return t;
            return 0
        }
        blockRange(e = this, t) {
            if (e.pos < this.pos) return e.blockRange(this);
            for (let n = this.depth - (this.parent.inlineContent || this.pos == e.pos ? 1 : 0); n >= 0; n--)
                if (e.pos <= this.end(n) && (!t || t(this.node(n)))) return new Zt(this, e, n);
            return null
        }
        sameParent(e) {
            return this.pos - this.parentOffset == e.pos - e.parentOffset
        }
        max(e) {
            return e.pos > this.pos ? e : this
        }
        min(e) {
            return e.pos < this.pos ? e : this
        }
        toString() {
            let e = ``;
            for (let t = 1; t <= this.depth; t++) e += (e ? `/` : ``) + this.node(t).type.name + `_` + this.index(t - 1);
            return e + `:` + this.parentOffset
        }
        static resolve(t, n) {
            if (!(n >= 0 && n <= t.content.size)) throw RangeError(`Position ` + n + ` out of range`);
            let r = [],
                i = 0,
                a = n;
            for (let e = t;;) {
                let {
                    index: t,
                    offset: n
                } = e.content.findIndex(a), o = a - n;
                if (r.push(e, t, i + n), !o || (e = e.child(t), e.isText)) break;
                a = o - 1, i += n + 1
            }
            return new e(n, r, a)
        }
        static resolveCached(t, n) {
            let r = Xt.get(t);
            if (r)
                for (let e = 0; e < r.elts.length; e++) {
                    let t = r.elts[e];
                    if (t.pos == n) return t
                } else Xt.set(t, r = new Jt);
            let i = r.elts[r.i] = e.resolve(t, n);
            return r.i = (r.i + 1) % Yt, i
        }
    },
    Jt = class {
        constructor() {
            this.elts = [], this.i = 0
        }
    },
    Yt = 12,
    Xt = new WeakMap,
    Zt = class {
        constructor(e, t, n) {
            this.$from = e, this.$to = t, this.depth = n
        }
        get start() {
            return this.$from.before(this.depth + 1)
        }
        get end() {
            return this.$to.after(this.depth + 1)
        }
        get parent() {
            return this.$from.node(this.depth)
        }
        get startIndex() {
            return this.$from.index(this.depth)
        }
        get endIndex() {
            return this.$to.indexAfter(this.depth)
        }
    },
    Qt = Object.create(null),
    $t = class e {
        constructor(e, t, n, r = D.none) {
            this.type = e, this.attrs = t, this.marks = r, this.content = n || E.empty
        }
        get children() {
            return this.content.content
        }
        get nodeSize() {
            return this.isLeaf ? 1 : 2 + this.content.size
        }
        get childCount() {
            return this.content.childCount
        }
        child(e) {
            return this.content.child(e)
        }
        maybeChild(e) {
            return this.content.maybeChild(e)
        }
        forEach(e) {
            this.content.forEach(e)
        }
        nodesBetween(e, t, n, r = 0) {
            this.content.nodesBetween(e, t, n, r, this)
        }
        descendants(e) {
            this.nodesBetween(0, this.content.size, e)
        }
        get textContent() {
            return this.isLeaf && this.type.spec.leafText ? this.type.spec.leafText(this) : this.textBetween(0, this.content.size, ``)
        }
        textBetween(e, t, n, r) {
            return this.content.textBetween(e, t, n, r)
        }
        get firstChild() {
            return this.content.firstChild
        }
        get lastChild() {
            return this.content.lastChild
        }
        eq(e) {
            return this == e || this.sameMarkup(e) && this.content.eq(e.content)
        }
        sameMarkup(e) {
            return this.hasMarkup(e.type, e.attrs, e.marks)
        }
        hasMarkup(e, t, n) {
            return this.type == e && Nt(this.attrs, t || e.defaultAttrs || Qt) && D.sameSet(this.marks, n || D.none)
        }
        copy(t = null) {
            return t == this.content ? this : new e(this.type, this.attrs, t, this.marks)
        }
        mark(t) {
            return t == this.marks ? this : new e(this.type, this.attrs, this.content, t)
        }
        cut(e, t = this.content.size) {
            return e == 0 && t == this.content.size ? this : this.copy(this.content.cut(e, t))
        }
        slice(e, t = this.content.size, n = !1) {
            if (e == t) return O.empty;
            let r = this.resolve(e),
                i = this.resolve(t),
                a = n ? 0 : r.sharedDepth(t),
                o = r.start(a);
            return new O(r.node(a).content.cut(r.pos - o, i.pos - o), r.depth - a, i.depth - a)
        }
        replace(e, t, n) {
            return Lt(this.resolve(e), this.resolve(t), n)
        }
        nodeAt(e) {
            for (let t = this;;) {
                let {
                    index: n,
                    offset: r
                } = t.content.findIndex(e);
                if (t = t.maybeChild(n), !t) return null;
                if (r == e || t.isText) return t;
                e -= r + 1
            }
        }
        childAfter(e) {
            let {
                index: t,
                offset: n
            } = this.content.findIndex(e);
            return {
                node: this.content.maybeChild(t),
                index: t,
                offset: n
            }
        }
        childBefore(e) {
            if (e == 0) return {
                node: null,
                index: 0,
                offset: 0
            };
            let {
                index: t,
                offset: n
            } = this.content.findIndex(e);
            if (n < e) return {
                node: this.content.child(t),
                index: t,
                offset: n
            };
            let r = this.content.child(t - 1);
            return {
                node: r,
                index: t - 1,
                offset: n - r.nodeSize
            }
        }
        resolve(e) {
            return qt.resolveCached(this, e)
        }
        resolveNoCache(e) {
            return qt.resolve(this, e)
        }
        rangeHasMark(e, t, n) {
            let r = !1;
            return t > e && this.nodesBetween(e, t, e => (n.isInSet(e.marks) && (r = !0), !r)), r
        }
        get isBlock() {
            return this.type.isBlock
        }
        get isTextblock() {
            return this.type.isTextblock
        }
        get inlineContent() {
            return this.type.inlineContent
        }
        get isInline() {
            return this.type.isInline
        }
        get isText() {
            return this.type.isText
        }
        get isLeaf() {
            return this.type.isLeaf
        }
        get isAtom() {
            return this.type.isAtom
        }
        toString() {
            if (this.type.spec.toDebugString) return this.type.spec.toDebugString(this);
            let e = this.type.name;
            return this.content.size && (e += `(` + this.content.toStringInner() + `)`), tn(this.marks, e)
        }
        contentMatchAt(e) {
            let t = this.type.contentMatch.matchFragment(this.content, 0, e);
            if (!t) throw Error(`Called contentMatchAt on a node with invalid content`);
            return t
        }
        canReplace(e, t, n = E.empty, r = 0, i = n.childCount) {
            let a = this.contentMatchAt(e).matchFragment(n, r, i),
                o = a && a.matchFragment(this.content, t);
            if (!o || !o.validEnd) return !1;
            for (let e = r; e < i; e++)
                if (!this.type.allowsMarks(n.child(e).marks)) return !1;
            return !0
        }
        canReplaceWith(e, t, n, r) {
            if (r && !this.type.allowsMarks(r)) return !1;
            let i = this.contentMatchAt(e).matchType(n),
                a = i && i.matchFragment(this.content, t);
            return a ? a.validEnd : !1
        }
        canAppend(e) {
            return e.content.size ? this.canReplace(this.childCount, this.childCount, e.content) : this.type.compatibleContent(e.type)
        }
        check() {
            this.type.checkContent(this.content), this.type.checkAttrs(this.attrs);
            let e = D.none;
            for (let t = 0; t < this.marks.length; t++) {
                let n = this.marks[t];
                n.type.checkAttrs(n.attrs), e = n.addToSet(e)
            }
            if (!D.sameSet(e, this.marks)) throw RangeError(`Invalid collection of marks for node ${this.type.name}: ${this.marks.map(e=>e.type.name)}`);
            this.content.forEach(e => e.check())
        }
        toJSON() {
            let e = {
                type: this.type.name
            };
            for (let t in this.attrs) {
                e.attrs = this.attrs;
                break
            }
            return this.content.size && (e.content = this.content.toJSON()), this.marks.length && (e.marks = this.marks.map(e => e.toJSON())), e
        }
        static fromJSON(e, t) {
            if (!t) throw RangeError(`Invalid input for Node.fromJSON`);
            let n;
            if (t.marks) {
                if (!Array.isArray(t.marks)) throw RangeError(`Invalid mark data for Node.fromJSON`);
                n = t.marks.map(e.markFromJSON)
            }
            if (t.type == `text`) {
                if (typeof t.text != `string`) throw RangeError(`Invalid text node in JSON`);
                return e.text(t.text, n)
            }
            let r = E.fromJSON(e, t.content),
                i = e.nodeType(t.type).create(t.attrs, r, n);
            return i.type.checkAttrs(i.attrs), i
        }
    };
$t.prototype.text = void 0;
var en = class e extends $t {
    constructor(e, t, n, r) {
        if (super(e, t, null, r), !n) throw RangeError(`Empty text nodes are not allowed`);
        this.text = n
    }
    toString() {
        return this.type.spec.toDebugString ? this.type.spec.toDebugString(this) : tn(this.marks, JSON.stringify(this.text))
    }
    get textContent() {
        return this.text
    }
    textBetween(e, t) {
        return this.text.slice(e, t)
    }
    get nodeSize() {
        return this.text.length
    }
    mark(t) {
        return t == this.marks ? this : new e(this.type, this.attrs, this.text, t)
    }
    withText(t) {
        return t == this.text ? this : new e(this.type, this.attrs, t, this.marks)
    }
    cut(e = 0, t = this.text.length) {
        return e == 0 && t == this.text.length ? this : this.withText(this.text.slice(e, t))
    }
    eq(e) {
        return this.sameMarkup(e) && this.text == e.text
    }
    toJSON() {
        let e = super.toJSON();
        return e.text = this.text, e
    }
};

function tn(e, t) {
    for (let n = e.length - 1; n >= 0; n--) t = e[n].type.name + `(` + t + `)`;
    return t
}
var nn = class e {
    constructor(e) {
        this.validEnd = e, this.next = [], this.wrapCache = []
    }
    static parse(t, n) {
        let r = new rn(t, n);
        if (r.next == null) return e.empty;
        let i = an(r);
        r.next && r.err(`Unexpected trailing text`);
        let a = hn(fn(i));
        return gn(a, r), a
    }
    matchType(e) {
        for (let t = 0; t < this.next.length; t++)
            if (this.next[t].type == e) return this.next[t].next;
        return null
    }
    matchFragment(e, t = 0, n = e.childCount) {
        let r = this;
        for (let i = t; r && i < n; i++) r = r.matchType(e.child(i).type);
        return r
    }
    get inlineContent() {
        return this.next.length != 0 && this.next[0].type.isInline
    }
    get defaultType() {
        for (let e = 0; e < this.next.length; e++) {
            let {
                type: t
            } = this.next[e];
            if (!(t.isText || t.hasRequiredAttrs())) return t
        }
        return null
    }
    compatible(e) {
        for (let t = 0; t < this.next.length; t++)
            for (let n = 0; n < e.next.length; n++)
                if (this.next[t].type == e.next[n].type) return !0;
        return !1
    }
    fillBefore(e, t = !1, n = 0) {
        let r = [this];

        function i(a, o) {
            let s = a.matchFragment(e, n);
            if (s && (!t || s.validEnd)) return E.from(o.map(e => e.createAndFill()));
            for (let e = 0; e < a.next.length; e++) {
                let {
                    type: t,
                    next: n
                } = a.next[e];
                if (!(t.isText || t.hasRequiredAttrs()) && r.indexOf(n) == -1) {
                    r.push(n);
                    let e = i(n, o.concat(t));
                    if (e) return e
                }
            }
            return null
        }
        return i(this, [])
    }
    findWrapping(e) {
        for (let t = 0; t < this.wrapCache.length; t += 2)
            if (this.wrapCache[t] == e) return this.wrapCache[t + 1];
        let t = this.computeWrapping(e);
        return this.wrapCache.push(e, t), t
    }
    computeWrapping(e) {
        let t = Object.create(null),
            n = [{
                match: this,
                type: null,
                via: null
            }];
        for (; n.length;) {
            let r = n.shift(),
                i = r.match;
            if (i.matchType(e)) {
                let e = [];
                for (let t = r; t.type; t = t.via) e.push(t.type);
                return e.reverse()
            }
            for (let e = 0; e < i.next.length; e++) {
                let {
                    type: a,
                    next: o
                } = i.next[e];
                !a.isLeaf && !a.hasRequiredAttrs() && !(a.name in t) && (!r.type || o.validEnd) && (n.push({
                    match: a.contentMatch,
                    type: a,
                    via: r
                }), t[a.name] = !0)
            }
        }
        return null
    }
    get edgeCount() {
        return this.next.length
    }
    edge(e) {
        if (e >= this.next.length) throw RangeError(`There's no ${e}th edge in this content match`);
        return this.next[e]
    }
    toString() {
        let e = [];

        function t(n) {
            e.push(n);
            for (let r = 0; r < n.next.length; r++) e.indexOf(n.next[r].next) == -1 && t(n.next[r].next)
        }
        return t(this), e.map((t, n) => {
            let r = n + (t.validEnd ? `*` : ` `) + ` `;
            for (let n = 0; n < t.next.length; n++) r += (n ? `, ` : ``) + t.next[n].type.name + `->` + e.indexOf(t.next[n].next);
            return r
        }).join(`
`)
    }
};
nn.empty = new nn(!0);
var rn = class {
    constructor(e, t) {
        this.string = e, this.nodeTypes = t, this.inline = null, this.pos = 0, this.tokens = e.split(/\s*(?=\b|\W|$)/), this.tokens[this.tokens.length - 1] == `` && this.tokens.pop(), this.tokens[0] == `` && this.tokens.shift()
    }
    get next() {
        return this.tokens[this.pos]
    }
    eat(e) {
        return this.next == e && (this.pos++ || !0)
    }
    err(e) {
        throw SyntaxError(e + ` (in content expression '` + this.string + `')`)
    }
};

function an(e) {
    let t = [];
    do t.push(on(e)); while (e.eat(`|`));
    return t.length == 1 ? t[0] : {
        type: `choice`,
        exprs: t
    }
}

function on(e) {
    let t = [];
    do t.push(sn(e)); while (e.next && e.next != `)` && e.next != `|`);
    return t.length == 1 ? t[0] : {
        type: `seq`,
        exprs: t
    }
}

function sn(e) {
    let t = dn(e);
    for (;;)
        if (e.eat(`+`)) t = {
            type: `plus`,
            expr: t
        };
        else if (e.eat(`*`)) t = {
        type: `star`,
        expr: t
    };
    else if (e.eat(`?`)) t = {
        type: `opt`,
        expr: t
    };
    else if (e.eat(`{`)) t = ln(e, t);
    else break;
    return t
}

function cn(e) {
    /\D/.test(e.next) && e.err(`Expected number, got '` + e.next + `'`);
    let t = Number(e.next);
    return e.pos++, t
}

function ln(e, t) {
    let n = cn(e),
        r = n;
    return e.eat(`,`) && (r = e.next == `}` ? -1 : cn(e)), e.eat(`}`) || e.err(`Unclosed braced range`), {
        type: `range`,
        min: n,
        max: r,
        expr: t
    }
}

function un(e, t) {
    let n = e.nodeTypes,
        r = n[t];
    if (r) return [r];
    let i = [];
    for (let e in n) {
        let r = n[e];
        r.isInGroup(t) && i.push(r)
    }
    return i.length == 0 && e.err(`No node type or group '` + t + `' found`), i
}

function dn(e) {
    if (e.eat(`(`)) {
        let t = an(e);
        return e.eat(`)`) || e.err(`Missing closing paren`), t
    } else if (/\W/.test(e.next)) e.err(`Unexpected token '` + e.next + `'`);
    else {
        let t = un(e, e.next).map(t => (e.inline == null ? e.inline = t.isInline : e.inline != t.isInline && e.err(`Mixing inline and block content`), {
            type: `name`,
            value: t
        }));
        return e.pos++, t.length == 1 ? t[0] : {
            type: `choice`,
            exprs: t
        }
    }
}

function fn(e) {
    let t = [
        []
    ];
    return i(a(e, 0), n()), t;

    function n() {
        return t.push([]) - 1
    }

    function r(e, n, r) {
        let i = {
            term: r,
            to: n
        };
        return t[e].push(i), i
    }

    function i(e, t) {
        e.forEach(e => e.to = t)
    }

    function a(e, t) {
        if (e.type == `choice`) return e.exprs.reduce((e, n) => e.concat(a(n, t)), []);
        if (e.type == `seq`)
            for (let r = 0;; r++) {
                let o = a(e.exprs[r], t);
                if (r == e.exprs.length - 1) return o;
                i(o, t = n())
            } else if (e.type == `star`) {
                let o = n();
                return r(t, o), i(a(e.expr, o), o), [r(o)]
            } else if (e.type == `plus`) {
            let o = n();
            return i(a(e.expr, t), o), i(a(e.expr, o), o), [r(o)]
        } else if (e.type == `opt`) return [r(t)].concat(a(e.expr, t));
        else if (e.type == `range`) {
            let o = t;
            for (let t = 0; t < e.min; t++) {
                let t = n();
                i(a(e.expr, o), t), o = t
            }
            if (e.max == -1) i(a(e.expr, o), o);
            else
                for (let t = e.min; t < e.max; t++) {
                    let t = n();
                    r(o, t), i(a(e.expr, o), t), o = t
                }
            return [r(o)]
        } else if (e.type == `name`) return [r(t, void 0, e.value)];
        else throw Error(`Unknown expr type`)
    }
}

function pn(e, t) {
    return t - e
}

function mn(e, t) {
    let n = [];
    return r(t), n.sort(pn);

    function r(t) {
        let i = e[t];
        if (i.length == 1 && !i[0].term) return r(i[0].to);
        n.push(t);
        for (let e = 0; e < i.length; e++) {
            let {
                term: t,
                to: a
            } = i[e];
            !t && n.indexOf(a) == -1 && r(a)
        }
    }
}

function hn(e) {
    let t = Object.create(null);
    return n(mn(e, 0));

    function n(r) {
        let i = [];
        r.forEach(t => {
            e[t].forEach(({
                term: t,
                to: n
            }) => {
                if (!t) return;
                let r;
                for (let e = 0; e < i.length; e++) i[e][0] == t && (r = i[e][1]);
                mn(e, n).forEach(e => {
                    r || i.push([t, r = []]), r.indexOf(e) == -1 && r.push(e)
                })
            })
        });
        let a = t[r.join(`,`)] = new nn(r.indexOf(e.length - 1) > -1);
        for (let e = 0; e < i.length; e++) {
            let r = i[e][1].sort(pn);
            a.next.push({
                type: i[e][0],
                next: t[r.join(`,`)] || n(r)
            })
        }
        return a
    }
}

function gn(e, t) {
    for (let n = 0, r = [e]; n < r.length; n++) {
        let e = r[n],
            i = !e.validEnd,
            a = [];
        for (let t = 0; t < e.next.length; t++) {
            let {
                type: n,
                next: o
            } = e.next[t];
            a.push(n.name), i && !(n.isText || n.hasRequiredAttrs()) && (i = !1), r.indexOf(o) == -1 && r.push(o)
        }
        i && t.err(`Only non-generatable nodes (` + a.join(`, `) + `) in a required position (see https://prosemirror.net/docs/guide/#generatable)`)
    }
}

function _n(e) {
    let t = Object.create(null);
    for (let n in e) {
        let r = e[n];
        if (!r.hasDefault) return null;
        t[n] = r.default
    }
    return t
}

function vn(e, t) {
    let n = Object.create(null);
    for (let r in e) {
        let i = t && t[r];
        if (i === void 0) {
            let t = e[r];
            if (t.hasDefault) i = t.default;
            else throw RangeError(`No value supplied for attribute ` + r)
        }
        n[r] = i
    }
    return n
}

function yn(e, t, n, r) {
    for (let r in t)
        if (!(r in e)) throw RangeError(`Unsupported attribute ${r} for ${n} of type ${r}`);
    for (let n in e) {
        let r = e[n];
        r.validate && r.validate(t[n])
    }
}

function bn(e, t) {
    let n = Object.create(null);
    if (t)
        for (let r in t) n[r] = new Cn(e, r, t[r]);
    return n
}
var xn = class e {
    constructor(e, t, n) {
        this.name = e, this.schema = t, this.spec = n, this.markSet = null, this.groups = n.group ? n.group.split(` `) : [], this.attrs = bn(e, n.attrs), this.defaultAttrs = _n(this.attrs), this.contentMatch = null, this.inlineContent = null, this.isBlock = !(n.inline || e == `text`), this.isText = e == `text`
    }
    get isInline() {
        return !this.isBlock
    }
    get isTextblock() {
        return this.isBlock && this.inlineContent
    }
    get isLeaf() {
        return this.contentMatch == nn.empty
    }
    get isAtom() {
        return this.isLeaf || !!this.spec.atom
    }
    isInGroup(e) {
        return this.groups.indexOf(e) > -1
    }
    get whitespace() {
        return this.spec.whitespace || (this.spec.code ? `pre` : `normal`)
    }
    hasRequiredAttrs() {
        for (let e in this.attrs)
            if (this.attrs[e].isRequired) return !0;
        return !1
    }
    compatibleContent(e) {
        return this == e || this.contentMatch.compatible(e.contentMatch)
    }
    computeAttrs(e) {
        return !e && this.defaultAttrs ? this.defaultAttrs : vn(this.attrs, e)
    }
    create(e = null, t, n) {
        if (this.isText) throw Error(`NodeType.create can't construct text nodes`);
        return new $t(this, this.computeAttrs(e), E.from(t), D.setFrom(n))
    }
    createChecked(e = null, t, n) {
        return t = E.from(t), this.checkContent(t), new $t(this, this.computeAttrs(e), t, D.setFrom(n))
    }
    createAndFill(e = null, t, n) {
        if (e = this.computeAttrs(e), t = E.from(t), t.size) {
            let e = this.contentMatch.fillBefore(t);
            if (!e) return null;
            t = e.append(t)
        }
        let r = this.contentMatch.matchFragment(t),
            i = r && r.fillBefore(E.empty, !0);
        return i ? new $t(this, e, t.append(i), D.setFrom(n)) : null
    }
    validContent(e) {
        let t = this.contentMatch.matchFragment(e);
        if (!t || !t.validEnd) return !1;
        for (let t = 0; t < e.childCount; t++)
            if (!this.allowsMarks(e.child(t).marks)) return !1;
        return !0
    }
    checkContent(e) {
        if (!this.validContent(e)) throw RangeError(`Invalid content for node ${this.name}: ${e.toString().slice(0,50)}`)
    }
    checkAttrs(e) {
        yn(this.attrs, e, `node`, this.name)
    }
    allowsMarkType(e) {
        return this.markSet == null || this.markSet.indexOf(e) > -1
    }
    allowsMarks(e) {
        if (this.markSet == null) return !0;
        for (let t = 0; t < e.length; t++)
            if (!this.allowsMarkType(e[t].type)) return !1;
        return !0
    }
    allowedMarks(e) {
        if (this.markSet == null) return e;
        let t;
        for (let n = 0; n < e.length; n++) this.allowsMarkType(e[n].type) ? t && t.push(e[n]) : t || = e.slice(0, n);
        return t ? t.length ? t : D.none : e
    }
    static compile(t, n) {
        let r = Object.create(null);
        t.forEach((t, i) => r[t] = new e(t, n, i));
        let i = n.spec.topNode || `doc`;
        if (!r[i]) throw RangeError(`Schema is missing its top node type ('` + i + `')`);
        if (!r.text) throw RangeError(`Every schema needs a 'text' type`);
        for (let e in r.text.attrs) throw RangeError(`The text node type should not have attributes`);
        return r
    }
};

function Sn(e, t, n) {
    let r = n.split(`|`);
    return n => {
        let i = n === null ? `null` : typeof n;
        if (r.indexOf(i) < 0) throw RangeError(`Expected value of type ${r} for attribute ${t} on type ${e}, got ${i}`)
    }
}
var Cn = class {
        constructor(e, t, n) {
            this.hasDefault = Object.prototype.hasOwnProperty.call(n, `default`), this.default = n.default, this.validate = typeof n.validate == `string` ? Sn(e, t, n.validate) : n.validate
        }
        get isRequired() {
            return !this.hasDefault
        }
    },
    wn = class e {
        constructor(e, t, n, r) {
            this.name = e, this.rank = t, this.schema = n, this.spec = r, this.attrs = bn(e, r.attrs), this.excluded = null;
            let i = _n(this.attrs);
            this.instance = i ? new D(this, i) : null
        }
        create(e = null) {
            return !e && this.instance ? this.instance : new D(this, vn(this.attrs, e))
        }
        static compile(t, n) {
            let r = Object.create(null),
                i = 0;
            return t.forEach((t, a) => r[t] = new e(t, i++, n, a)), r
        }
        removeFromSet(e) {
            for (var t = 0; t < e.length; t++) e[t].type == this && (e = e.slice(0, t).concat(e.slice(t + 1)), t--);
            return e
        }
        isInSet(e) {
            for (let t = 0; t < e.length; t++)
                if (e[t].type == this) return e[t]
        }
        checkAttrs(e) {
            yn(this.attrs, e, `mark`, this.name)
        }
        excludes(e) {
            return this.excluded.indexOf(e) > -1
        }
    },
    Tn = class {
        constructor(e) {
            this.linebreakReplacement = null, this.cached = Object.create(null);
            let t = this.spec = {};
            for (let n in e) t[n] = e[n];
            t.nodes = T.from(e.nodes), t.marks = T.from(e.marks || {}), this.nodes = xn.compile(this.spec.nodes, this), this.marks = wn.compile(this.spec.marks, this);
            let n = Object.create(null);
            for (let e in this.nodes) {
                if (e in this.marks) throw RangeError(e + ` can not be both a node and a mark`);
                let t = this.nodes[e],
                    r = t.spec.content || ``,
                    i = t.spec.marks;
                if (t.contentMatch = n[r] || (n[r] = nn.parse(r, this.nodes)), t.inlineContent = t.contentMatch.inlineContent, t.spec.linebreakReplacement) {
                    if (this.linebreakReplacement) throw RangeError(`Multiple linebreak nodes defined`);
                    if (!t.isInline || !t.isLeaf) throw RangeError(`Linebreak replacement nodes must be inline leaf nodes`);
                    this.linebreakReplacement = t
                }
                t.markSet = i == `_` ? null : i ? En(this, i.split(` `)) : i == `` || !t.inlineContent ? [] : null
            }
            for (let e in this.marks) {
                let t = this.marks[e],
                    n = t.spec.excludes;
                t.excluded = n == null ? [t] : n == `` ? [] : En(this, n.split(` `))
            }
            this.nodeFromJSON = e => $t.fromJSON(this, e), this.markFromJSON = e => D.fromJSON(this, e), this.topNodeType = this.nodes[this.spec.topNode || `doc`], this.cached.wrappings = Object.create(null)
        }
        node(e, t = null, n, r) {
            if (typeof e == `string`) e = this.nodeType(e);
            else if (!(e instanceof xn)) throw RangeError(`Invalid node type: ` + e);
            else if (e.schema != this) throw RangeError(`Node type from different schema used (` + e.name + `)`);
            return e.createChecked(t, n, r)
        }
        text(e, t) {
            let n = this.nodes.text;
            return new en(n, n.defaultAttrs, e, D.setFrom(t))
        }
        mark(e, t) {
            return typeof e == `string` && (e = this.marks[e]), e.create(t)
        }
        nodeType(e) {
            let t = this.nodes[e];
            if (!t) throw RangeError(`Unknown node type: ` + e);
            return t
        }
    };

function En(e, t) {
    let n = [];
    for (let r = 0; r < t.length; r++) {
        let i = t[r],
            a = e.marks[i],
            o = a;
        if (a) n.push(a);
        else
            for (let t in e.marks) {
                let r = e.marks[t];
                (i == `_` || r.spec.group && r.spec.group.split(` `).indexOf(i) > -1) && n.push(o = r)
            }
        if (!o) throw SyntaxError(`Unknown mark type: '` + t[r] + `'`)
    }
    return n
}

function Dn(e) {
    return e.tag != null
}

function On(e) {
    return e.style != null
}
var kn = class e {
        constructor(e, t) {
            this.schema = e, this.rules = t, this.tags = [], this.styles = [];
            let n = this.matchedStyles = [];
            t.forEach(e => {
                if (Dn(e)) this.tags.push(e);
                else if (On(e)) {
                    let t = /[^=]*/.exec(e.style)[0];
                    n.indexOf(t) < 0 && n.push(t), this.styles.push(e)
                }
            }), this.normalizeLists = !this.tags.some(t => {
                if (!/^(ul|ol)\b/.test(t.tag) || !t.node) return !1;
                let n = e.nodes[t.node];
                return n.contentMatch.matchType(n)
            })
        }
        parse(e, t = {}) {
            let n = new Rn(this, t, !1);
            return n.addAll(e, D.none, t.from, t.to), n.finish()
        }
        parseSlice(e, t = {}) {
            let n = new Rn(this, t, !0);
            return n.addAll(e, D.none, t.from, t.to), O.maxOpen(n.finish())
        }
        matchTag(e, t, n) {
            for (let r = n ? this.tags.indexOf(n) + 1 : 0; r < this.tags.length; r++) {
                let n = this.tags[r];
                if (Bn(e, n.tag) && (n.namespace === void 0 || e.namespaceURI == n.namespace) && (!n.context || t.matchesContext(n.context))) {
                    if (n.getAttrs) {
                        let t = n.getAttrs(e);
                        if (t === !1) continue;
                        n.attrs = t || void 0
                    }
                    return n
                }
            }
        }
        matchStyle(e, t, n, r) {
            for (let i = r ? this.styles.indexOf(r) + 1 : 0; i < this.styles.length; i++) {
                let r = this.styles[i],
                    a = r.style;
                if (!(a.indexOf(e) != 0 || r.context && !n.matchesContext(r.context) || a.length > e.length && (a.charCodeAt(e.length) != 61 || a.slice(e.length + 1) != t))) {
                    if (r.getAttrs) {
                        let e = r.getAttrs(t);
                        if (e === !1) continue;
                        r.attrs = e || void 0
                    }
                    return r
                }
            }
        }
        static schemaRules(e) {
            let t = [];

            function n(e) {
                let n = e.priority == null ? 50 : e.priority,
                    r = 0;
                for (; r < t.length; r++) {
                    let e = t[r];
                    if ((e.priority == null ? 50 : e.priority) < n) break
                }
                t.splice(r, 0, e)
            }
            for (let t in e.marks) {
                let r = e.marks[t].spec.parseDOM;
                r && r.forEach(e => {
                    n(e = Vn(e)), e.mark || e.ignore || e.clearMark || (e.mark = t)
                })
            }
            for (let t in e.nodes) {
                let r = e.nodes[t].spec.parseDOM;
                r && r.forEach(e => {
                    n(e = Vn(e)), e.node || e.ignore || e.mark || (e.node = t)
                })
            }
            return t
        }
        static fromSchema(t) {
            return t.cached.domParser || (t.cached.domParser = new e(t, e.schemaRules(t)))
        }
    },
    An = {
        address: !0,
        article: !0,
        aside: !0,
        blockquote: !0,
        canvas: !0,
        dd: !0,
        div: !0,
        dl: !0,
        fieldset: !0,
        figcaption: !0,
        figure: !0,
        footer: !0,
        form: !0,
        h1: !0,
        h2: !0,
        h3: !0,
        h4: !0,
        h5: !0,
        h6: !0,
        header: !0,
        hgroup: !0,
        hr: !0,
        li: !0,
        noscript: !0,
        ol: !0,
        output: !0,
        p: !0,
        pre: !0,
        section: !0,
        table: !0,
        tfoot: !0,
        ul: !0
    },
    jn = {
        head: !0,
        noscript: !0,
        object: !0,
        script: !0,
        style: !0,
        title: !0
    },
    Mn = {
        ol: !0,
        ul: !0
    },
    Nn = 1,
    Pn = 2,
    Fn = 4;

function In(e, t, n) {
    return t == null ? e && e.whitespace == `pre` ? 3 : n & -5 : (t ? Nn : 0) | (t === `full` ? Pn : 0)
}
var Ln = class {
        constructor(e, t, n, r, i, a) {
            this.type = e, this.attrs = t, this.marks = n, this.solid = r, this.options = a, this.content = [], this.activeMarks = D.none, this.match = i || (a & Fn ? null : e.contentMatch)
        }
        findWrapping(e) {
            if (!this.match) {
                if (!this.type) return [];
                let t = this.type.contentMatch.fillBefore(E.from(e));
                if (t) this.match = this.type.contentMatch.matchFragment(t);
                else {
                    let t = this.type.contentMatch,
                        n;
                    return (n = t.findWrapping(e.type)) ? (this.match = t, n) : null
                }
            }
            return this.match.findWrapping(e.type)
        }
        finish(e) {
            if (!(this.options & Nn)) {
                let e = this.content[this.content.length - 1],
                    t;
                if (e && e.isText && (t = /[ \t\r\n\u000c]+$/.exec(e.text))) {
                    let n = e;
                    e.text.length == t[0].length ? this.content.pop() : this.content[this.content.length - 1] = n.withText(n.text.slice(0, n.text.length - t[0].length))
                }
            }
            let t = E.from(this.content);
            return !e && this.match && (t = t.append(this.match.fillBefore(E.empty, !0))), this.type ? this.type.create(this.attrs, t, this.marks) : t
        }
        inlineContext(e) {
            return this.type ? this.type.inlineContent : this.content.length ? this.content[0].isInline : e.parentNode && !An.hasOwnProperty(e.parentNode.nodeName.toLowerCase())
        }
    },
    Rn = class {
        constructor(e, t, n) {
            this.parser = e, this.options = t, this.isOpen = n, this.open = 0, this.localPreserveWS = !1;
            let r = t.topNode,
                i, a = In(null, t.preserveWhitespace, 0) | (n ? Fn : 0);
            i = r ? new Ln(r.type, r.attrs, D.none, !0, t.topMatch || r.type.contentMatch, a) : n ? new Ln(null, null, D.none, !0, null, a) : new Ln(e.schema.topNodeType, null, D.none, !0, null, a), this.nodes = [i], this.find = t.findPositions, this.needsBlock = !1
        }
        get top() {
            return this.nodes[this.open]
        }
        addDOM(e, t) {
            e.nodeType == 3 ? this.addTextNode(e, t) : e.nodeType == 1 && this.addElement(e, t)
        }
        addTextNode(e, t) {
            let n = e.nodeValue,
                r = this.top,
                i = r.options & Pn ? `full` : this.localPreserveWS || (r.options & Nn) > 0,
                {
                    schema: a
                } = this.parser;
            if (i === `full` || r.inlineContext(e) || /[^ \t\r\n\u000c]/.test(n)) {
                if (!i) {
                    if (n = n.replace(/[ \t\r\n\u000c]+/g, ` `), /^[ \t\r\n\u000c]/.test(n) && this.open == this.nodes.length - 1) {
                        let t = r.content[r.content.length - 1],
                            i = e.previousSibling;
                        (!t || i && i.nodeName == `BR` || t.isText && /[ \t\r\n\u000c]$/.test(t.text)) && (n = n.slice(1))
                    }
                } else if (i === `full`) n = n.replace(/\r\n?/g, `
`);
                else if (a.linebreakReplacement && /[\r\n]/.test(n) && this.top.findWrapping(a.linebreakReplacement.create())) {
                    let e = n.split(/\r?\n|\r/);
                    for (let n = 0; n < e.length; n++) n && this.insertNode(a.linebreakReplacement.create(), t, !0), e[n] && this.insertNode(a.text(e[n]), t, !/\S/.test(e[n]));
                    n = ``
                } else n = n.replace(/\r?\n|\r/g, ` `);
                n && this.insertNode(a.text(n), t, !/\S/.test(n)), this.findInText(e)
            } else this.findInside(e)
        }
        addElement(e, t, n) {
            let r = this.localPreserveWS,
                i = this.top;
            (e.tagName == `PRE` || /pre/.test(e.style && e.style.whiteSpace)) && (this.localPreserveWS = !0);
            let a = e.nodeName.toLowerCase(),
                o;
            Mn.hasOwnProperty(a) && this.parser.normalizeLists && zn(e);
            let s = this.options.ruleFromNode && this.options.ruleFromNode(e) || (o = this.parser.matchTag(e, this, n));
            out: if (s ? s.ignore : jn.hasOwnProperty(a)) this.findInside(e), this.ignoreFallback(e, t);
                else
            if (!s || s.skip || s.closeParent) {
                s && s.closeParent ? this.open = Math.max(0, this.open - 1) : s && s.skip.nodeType && (e = s.skip);
                let n, r = this.needsBlock;
                if (An.hasOwnProperty(a)) i.content.length && i.content[0].isInline && this.open && (this.open--, i = this.top), n = !0, i.type || (this.needsBlock = !0);
                else if (!e.firstChild) {
                    this.leafFallback(e, t);
                    break out
                }
                let o = s && s.skip ? t : this.readStyles(e, t);
                o && this.addAll(e, o), n && this.sync(i), this.needsBlock = r
            } else {
                let n = this.readStyles(e, t);
                n && this.addElementByRule(e, s, n, s.consuming === !1 ? o : void 0)
            }
            this.localPreserveWS = r
        }
        leafFallback(e, t) {
            e.nodeName == `BR` && this.top.type && this.top.type.inlineContent && this.addTextNode(e.ownerDocument.createTextNode(`
`), t)
        }
        ignoreFallback(e, t) {
            e.nodeName == `BR` && (!this.top.type || !this.top.type.inlineContent) && this.findPlace(this.parser.schema.text(`-`), t, !0)
        }
        readStyles(e, t) {
            let n = e.style;
            if (n && n.length)
                for (let e = 0; e < this.parser.matchedStyles.length; e++) {
                    let r = this.parser.matchedStyles[e],
                        i = n.getPropertyValue(r);
                    if (i)
                        for (let e;;) {
                            let n = this.parser.matchStyle(r, i, this, e);
                            if (!n) break;
                            if (n.ignore) return null;
                            if (t = n.clearMark ? t.filter(e => !n.clearMark(e)) : t.concat(this.parser.schema.marks[n.mark].create(n.attrs)), n.consuming === !1) e = n;
                            else break
                        }
                }
            return t
        }
        addElementByRule(e, t, n, r) {
            let i, a;
            if (t.node)
                if (a = this.parser.schema.nodes[t.node], a.isLeaf) this.insertNode(a.create(t.attrs), n, e.nodeName == `BR`) || this.leafFallback(e, n);
                else {
                    let e = this.enter(a, t.attrs || null, n, t.preserveWhitespace);
                    e && (i = !0, n = e)
                }
            else {
                let e = this.parser.schema.marks[t.mark];
                n = n.concat(e.create(t.attrs))
            }
            let o = this.top;
            if (a && a.isLeaf) this.findInside(e);
            else if (r) this.addElement(e, n, r);
            else if (t.getContent) this.findInside(e), t.getContent(e, this.parser.schema).forEach(e => this.insertNode(e, n, !1));
            else {
                let r = e;
                typeof t.contentElement == `string` ? r = e.querySelector(t.contentElement) : typeof t.contentElement == `function` ? r = t.contentElement(e) : t.contentElement && (r = t.contentElement), this.findAround(e, r, !0), this.addAll(r, n), this.findAround(e, r, !1)
            }
            i && this.sync(o) && this.open--
        }
        addAll(e, t, n, r) {
            let i = n || 0;
            for (let a = n ? e.childNodes[n] : e.firstChild, o = r == null ? null : e.childNodes[r]; a != o; a = a.nextSibling, ++i) this.findAtPoint(e, i), this.addDOM(a, t);
            this.findAtPoint(e, i)
        }
        findPlace(e, t, n) {
            let r, i;
            for (let t = this.open, a = 0; t >= 0; t--) {
                let o = this.nodes[t],
                    s = o.findWrapping(e);
                if (s && (!r || r.length > s.length + a) && (r = s, i = o, !s.length)) break;
                if (o.solid) {
                    if (n) break;
                    a += 2
                }
            }
            if (!r) return null;
            this.sync(i);
            for (let e = 0; e < r.length; e++) t = this.enterInner(r[e], null, t, !1);
            return t
        }
        insertNode(e, t, n) {
            if (e.isInline && this.needsBlock && !this.top.type) {
                let e = this.textblockFromContext();
                e && (t = this.enterInner(e, null, t))
            }
            let r = this.findPlace(e, t, n);
            if (r) {
                this.closeExtra();
                let t = this.top;
                t.match && = t.match.matchType(e.type);
                let n = D.none;
                for (let i of r.concat(e.marks))(t.type ? t.type.allowsMarkType(i.type) : Hn(i.type, e.type)) && (n = i.addToSet(n));
                return t.content.push(e.mark(n)), !0
            }
            return !1
        }
        enter(e, t, n, r) {
            let i = this.findPlace(e.create(t), n, !1);
            return i && = this.enterInner(e, t, n, !0, r), i
        }
        enterInner(e, t, n, r = !1, i) {
            this.closeExtra();
            let a = this.top;
            a.match = a.match && a.match.matchType(e);
            let o = In(e, i, a.options);
            a.options & Fn && a.content.length == 0 && (o |= Fn);
            let s = D.none;
            return n = n.filter(t => (a.type ? a.type.allowsMarkType(t.type) : Hn(t.type, e)) ? (s = t.addToSet(s), !1) : !0), this.nodes.push(new Ln(e, t, s, r, null, o)), this.open++, n
        }
        closeExtra(e = !1) {
            let t = this.nodes.length - 1;
            if (t > this.open) {
                for (; t > this.open; t--) this.nodes[t - 1].content.push(this.nodes[t].finish(e));
                this.nodes.length = this.open + 1
            }
        }
        finish() {
            return this.open = 0, this.closeExtra(this.isOpen), this.nodes[0].finish(!!(this.isOpen || this.options.topOpen))
        }
        sync(e) {
            for (let t = this.open; t >= 0; t--)
                if (this.nodes[t] == e) return this.open = t, !0;
                else this.localPreserveWS && (this.nodes[t].options |= Nn);
            return !1
        }
        get currentPos() {
            this.closeExtra();
            let e = 0;
            for (let t = this.open; t >= 0; t--) {
                let n = this.nodes[t].content;
                for (let t = n.length - 1; t >= 0; t--) e += n[t].nodeSize;
                t && e++
            }
            return e
        }
        findAtPoint(e, t) {
            if (this.find)
                for (let n = 0; n < this.find.length; n++) this.find[n].node == e && this.find[n].offset == t && (this.find[n].pos = this.currentPos)
        }
        findInside(e) {
            if (this.find)
                for (let t = 0; t < this.find.length; t++) this.find[t].pos == null && e.nodeType == 1 && e.contains(this.find[t].node) && (this.find[t].pos = this.currentPos)
        }
        findAround(e, t, n) {
            if (e != t && this.find)
                for (let r = 0; r < this.find.length; r++) this.find[r].pos == null && e.nodeType == 1 && e.contains(this.find[r].node) && t.compareDocumentPosition(this.find[r].node) & (n ? 2 : 4) && (this.find[r].pos = this.currentPos)
        }
        findInText(e) {
            if (this.find)
                for (let t = 0; t < this.find.length; t++) this.find[t].node == e && (this.find[t].pos = this.currentPos - (e.nodeValue.length - this.find[t].offset))
        }
        matchesContext(e) {
            if (e.indexOf(`|`) > -1) return e.split(/\s*\|\s*/).some(this.matchesContext, this);
            let t = e.split(`/`),
                n = this.options.context,
                r = !this.isOpen && (!n || n.parent.type == this.nodes[0].type),
                i = -(n ? n.depth + 1 : 0) + +!r,
                a = (e, o) => {
                    for (; e >= 0; e--) {
                        let s = t[e];
                        if (s == ``) {
                            if (e == t.length - 1 || e == 0) continue;
                            for (; o >= i; o--)
                                if (a(e - 1, o)) return !0;
                            return !1
                        } else {
                            let e = o > 0 || o == 0 && r ? this.nodes[o].type : n && o >= i ? n.node(o - i).type : null;
                            if (!e || e.name != s && !e.isInGroup(s)) return !1;
                            o--
                        }
                    }
                    return !0
                };
            return a(t.length - 1, this.open)
        }
        textblockFromContext() {
            let e = this.options.context;
            if (e)
                for (let t = e.depth; t >= 0; t--) {
                    let n = e.node(t).contentMatchAt(e.indexAfter(t)).defaultType;
                    if (n && n.isTextblock && n.defaultAttrs) return n
                }
            for (let e in this.parser.schema.nodes) {
                let t = this.parser.schema.nodes[e];
                if (t.isTextblock && t.defaultAttrs) return t
            }
        }
    };

function zn(e) {
    for (let t = e.firstChild, n = null; t; t = t.nextSibling) {
        let e = t.nodeType == 1 ? t.nodeName.toLowerCase() : null;
        e && Mn.hasOwnProperty(e) && n ? (n.appendChild(t), t = n) : e == `li` ? n = t : e && (n = null)
    }
}

function Bn(e, t) {
    return (e.matches || e.msMatchesSelector || e.webkitMatchesSelector || e.mozMatchesSelector).call(e, t)
}

function Vn(e) {
    let t = {};
    for (let n in e) t[n] = e[n];
    return t
}

function Hn(e, t) {
    let n = t.schema.nodes;
    for (let r in n) {
        let i = n[r];
        if (!i.allowsMarkType(e)) continue;
        let a = [],
            o = e => {
                a.push(e);
                for (let n = 0; n < e.edgeCount; n++) {
                    let {
                        type: r,
                        next: i
                    } = e.edge(n);
                    if (r == t || a.indexOf(i) < 0 && o(i)) return !0
                }
            };
        if (o(i.contentMatch)) return !0
    }
}
var Un = class e {
    constructor(e, t) {
        this.nodes = e, this.marks = t
    }
    serializeFragment(e, t = {}, n) {
        n || = Gn(t).createDocumentFragment();
        let r = n,
            i = [];
        return e.forEach(e => {
            if (i.length || e.marks.length) {
                let n = 0,
                    a = 0;
                for (; n < i.length && a < e.marks.length;) {
                    let t = e.marks[a];
                    if (!this.marks[t.type.name]) {
                        a++;
                        continue
                    }
                    if (!t.eq(i[n][0]) || t.type.spec.spanning === !1) break;
                    n++, a++
                }
                for (; n < i.length;) r = i.pop()[1];
                for (; a < e.marks.length;) {
                    let n = e.marks[a++],
                        o = this.serializeMark(n, e.isInline, t);
                    o && (i.push([n, r]), r.appendChild(o.dom), r = o.contentDOM || o.dom)
                }
            }
            r.appendChild(this.serializeNodeInner(e, t))
        }), n
    }
    serializeNodeInner(e, t) {
        if (e.isText) return Gn(t).createTextNode(e.text);
        let {
            dom: n,
            contentDOM: r
        } = Yn(Gn(t), this.nodes[e.type.name](e), null, e.attrs);
        if (r) {
            if (e.isLeaf) throw RangeError(`Content hole not allowed in a leaf node spec`);
            this.serializeFragment(e.content, t, r)
        }
        return n
    }
    serializeNode(e, t = {}) {
        let n = this.serializeNodeInner(e, t);
        for (let r = e.marks.length - 1; r >= 0; r--) {
            let i = this.serializeMark(e.marks[r], e.isInline, t);
            i && ((i.contentDOM || i.dom).appendChild(n), n = i.dom)
        }
        return n
    }
    serializeMark(e, t, n = {}) {
        let r = this.marks[e.type.name];
        return r && Yn(Gn(n), r(e, t), null, e.attrs)
    }
    static renderSpec(e, t, n = null, r) {
        return typeof t == `string` ? {
            dom: e.createTextNode(t)
        } : Yn(e, t, n, r)
    }
    static fromSchema(t) {
        return t.cached.domSerializer || (t.cached.domSerializer = new e(this.nodesFromSchema(t), this.marksFromSchema(t)))
    }
    static nodesFromSchema(e) {
        let t = Wn(e.nodes);
        return t.text || = e => e.text, t
    }
    static marksFromSchema(e) {
        return Wn(e.marks)
    }
};

function Wn(e) {
    let t = {};
    for (let n in e) {
        let r = e[n].spec.toDOM;
        r && (t[n] = r)
    }
    return t
}

function Gn(e) {
    return e.document || window.document
}
var Kn = new WeakMap;

function qn(e) {
    let t = Kn.get(e);
    return t === void 0 && Kn.set(e, t = Jn(e)), t
}

function Jn(e) {
    let t = null;

    function n(e) {
        if (e && typeof e == `object`)
            if (Array.isArray(e))
                if (typeof e[0] == `string`) t || = [], t.push(e);
                else
                    for (let t = 0; t < e.length; t++) n(e[t]);
        else
            for (let t in e) n(e[t])
    }
    return n(e), t
}

function Yn(e, t, n, r) {
    if (t.nodeType == 1) return {
        dom: t
    };
    if (t.dom && t.dom.nodeType == 1) return t;
    let i = t[0],
        a;
    if (typeof i != `string`) throw RangeError(`Invalid array passed to renderSpec`);
    if (r && (a = qn(r)) && a.indexOf(t) > -1) throw RangeError(`Using an array from an attribute object as a DOM spec. This may be an attempted cross site scripting attack.`);
    let o = i.indexOf(` `);
    o > 0 && (n = i.slice(0, o), i = i.slice(o + 1));
    let s, c = n ? e.createElementNS(n, i) : e.createElement(i),
        l = t[1],
        u = 1;
    if (l && typeof l == `object` && l.nodeType == null && !Array.isArray(l)) {
        u = 2;
        for (let e in l)
            if (l[e] != null) {
                let t = e.indexOf(` `);
                t > 0 ? c.setAttributeNS(e.slice(0, t), e.slice(t + 1), l[e]) : e == `style` && c.style ? c.style.cssText = l[e] : c.setAttribute(e, l[e])
            }
    }
    for (let i = u; i < t.length; i++) {
        let a = t[i];
        if (a === 0) {
            if (i < t.length - 1 || i > u) throw RangeError(`Content hole must be the only child of its parent node`);
            return {
                dom: c,
                contentDOM: c
            }
        } else if (typeof a == `string`) c.appendChild(e.createTextNode(a));
        else {
            let {
                dom: t,
                contentDOM: i
            } = Yn(e, a, n, r);
            if (c.appendChild(t), i) {
                if (s) throw RangeError(`Multiple content holes`);
                s = i
            }
        }
    }
    return {
        dom: c,
        contentDOM: s
    }
}
var Xn = 65535,
    Zn = 2 ** 16;

function Qn(e, t) {
    return e + t * Zn
}

function $n(e) {
    return e & Xn
}

function er(e) {
    return (e - (e & Xn)) / Zn
}
var tr = 1,
    nr = 2,
    rr = 4,
    ir = 8,
    ar = class {
        constructor(e, t, n) {
            this.pos = e, this.delInfo = t, this.recover = n
        }
        get deleted() {
            return (this.delInfo & ir) > 0
        }
        get deletedBefore() {
            return (this.delInfo & 5) > 0
        }
        get deletedAfter() {
            return (this.delInfo & 6) > 0
        }
        get deletedAcross() {
            return (this.delInfo & rr) > 0
        }
    },
    or = class e {
        constructor(t, n = !1) {
            if (this.ranges = t, this.inverted = n, !t.length && e.empty) return e.empty
        }
        recover(e) {
            let t = 0,
                n = $n(e);
            if (!this.inverted)
                for (let e = 0; e < n; e++) t += this.ranges[e * 3 + 2] - this.ranges[e * 3 + 1];
            return this.ranges[n * 3] + t + er(e)
        }
        mapResult(e, t = 1) {
            return this._map(e, t, !1)
        }
        map(e, t = 1) {
            return this._map(e, t, !0)
        }
        _map(e, t, n) {
            let r = 0,
                i = this.inverted ? 2 : 1,
                a = this.inverted ? 1 : 2;
            for (let o = 0; o < this.ranges.length; o += 3) {
                let s = this.ranges[o] - (this.inverted ? r : 0);
                if (s > e) break;
                let c = this.ranges[o + i],
                    l = this.ranges[o + a],
                    u = s + c;
                if (e <= u) {
                    let i = c ? e == s ? -1 : e == u ? 1 : t : t,
                        a = s + r + (i < 0 ? 0 : l);
                    if (n) return a;
                    let d = e == (t < 0 ? s : u) ? null : Qn(o / 3, e - s),
                        f = e == s ? nr : e == u ? tr : rr;
                    return (t < 0 ? e != s : e != u) && (f |= ir), new ar(a, f, d)
                }
                r += l - c
            }
            return n ? e + r : new ar(e + r, 0, null)
        }
        touches(e, t) {
            let n = 0,
                r = $n(t),
                i = this.inverted ? 2 : 1,
                a = this.inverted ? 1 : 2;
            for (let t = 0; t < this.ranges.length; t += 3) {
                let o = this.ranges[t] - (this.inverted ? n : 0);
                if (o > e) break;
                let s = this.ranges[t + i];
                if (e <= o + s && t == r * 3) return !0;
                n += this.ranges[t + a] - s
            }
            return !1
        }
        forEach(e) {
            let t = this.inverted ? 2 : 1,
                n = this.inverted ? 1 : 2;
            for (let r = 0, i = 0; r < this.ranges.length; r += 3) {
                let a = this.ranges[r],
                    o = a - (this.inverted ? i : 0),
                    s = a + (this.inverted ? 0 : i),
                    c = this.ranges[r + t],
                    l = this.ranges[r + n];
                e(o, o + c, s, s + l), i += l - c
            }
        }
        invert() {
            return new e(this.ranges, !this.inverted)
        }
        toString() {
            return (this.inverted ? `-` : ``) + JSON.stringify(this.ranges)
        }
        static offset(t) {
            return t == 0 ? e.empty : new e(t < 0 ? [0, -t, 0] : [0, 0, t])
        }
    };
or.empty = new or([]);
var sr = class e {
        constructor(e, t, n = 0, r = e ? e.length : 0) {
            this.mirror = t, this.from = n, this.to = r, this._maps = e || [], this.ownData = !(e || t)
        }
        get maps() {
            return this._maps
        }
        slice(t = 0, n = this.maps.length) {
            return new e(this._maps, this.mirror, t, n)
        }
        appendMap(e, t) {
            this.ownData || = (this._maps = this._maps.slice(), this.mirror = this.mirror && this.mirror.slice(), !0), this.to = this._maps.push(e), t != null && this.setMirror(this._maps.length - 1, t)
        }
        appendMapping(e) {
            for (let t = 0, n = this._maps.length; t < e._maps.length; t++) {
                let r = e.getMirror(t);
                this.appendMap(e._maps[t], r != null && r < t ? n + r : void 0)
            }
        }
        getMirror(e) {
            if (this.mirror) {
                for (let t = 0; t < this.mirror.length; t++)
                    if (this.mirror[t] == e) return this.mirror[t + (t % 2 ? -1 : 1)]
            }
        }
        setMirror(e, t) {
            this.mirror || = [], this.mirror.push(e, t)
        }
        appendMappingInverted(e) {
            for (let t = e.maps.length - 1, n = this._maps.length + e._maps.length; t >= 0; t--) {
                let r = e.getMirror(t);
                this.appendMap(e._maps[t].invert(), r != null && r > t ? n - r - 1 : void 0)
            }
        }
        invert() {
            let t = new e;
            return t.appendMappingInverted(this), t
        }
        map(e, t = 1) {
            if (this.mirror) return this._map(e, t, !0);
            for (let n = this.from; n < this.to; n++) e = this._maps[n].map(e, t);
            return e
        }
        mapResult(e, t = 1) {
            return this._map(e, t, !1)
        }
        _map(e, t, n) {
            let r = 0;
            for (let n = this.from; n < this.to; n++) {
                let i = this._maps[n].mapResult(e, t);
                if (i.recover != null) {
                    let t = this.getMirror(n);
                    if (t != null && t > n && t < this.to) {
                        n = t, e = this._maps[t].recover(i.recover);
                        continue
                    }
                }
                r |= i.delInfo, e = i.pos
            }
            return n ? e : new ar(e, r, null)
        }
    },
    cr = Object.create(null),
    k = class {
        getMap() {
            return or.empty
        }
        merge(e) {
            return null
        }
        static fromJSON(e, t) {
            if (!t || !t.stepType) throw RangeError(`Invalid input for Step.fromJSON`);
            let n = cr[t.stepType];
            if (!n) throw RangeError(`No step type ${t.stepType} defined`);
            return n.fromJSON(e, t)
        }
        static jsonID(e, t) {
            if (e in cr) throw RangeError(`Duplicate use of step JSON ID ` + e);
            return cr[e] = t, t.prototype.jsonID = e, t
        }
    },
    A = class e {
        constructor(e, t) {
            this.doc = e, this.failed = t
        }
        static ok(t) {
            return new e(t, null)
        }
        static fail(t) {
            return new e(null, t)
        }
        static fromReplace(t, n, r, i) {
            try {
                return e.ok(t.replace(n, r, i))
            } catch (t) {
                if (t instanceof Pt) return e.fail(t.message);
                throw t
            }
        }
    };

function lr(e, t, n) {
    let r = [];
    for (let i = 0; i < e.childCount; i++) {
        let a = e.child(i);
        a.content.size && (a = a.copy(lr(a.content, t, a))), a.isInline && (a = t(a, n, i)), r.push(a)
    }
    return E.fromArray(r)
}
var ur = class e extends k {
    constructor(e, t, n) {
        super(), this.from = e, this.to = t, this.mark = n
    }
    apply(e) {
        let t = e.slice(this.from, this.to),
            n = e.resolve(this.from),
            r = n.node(n.sharedDepth(this.to)),
            i = new O(lr(t.content, (e, t) => !e.isAtom || !t.type.allowsMarkType(this.mark.type) ? e : e.mark(this.mark.addToSet(e.marks)), r), t.openStart, t.openEnd);
        return A.fromReplace(e, this.from, this.to, i)
    }
    invert() {
        return new dr(this.from, this.to, this.mark)
    }
    map(t) {
        let n = t.mapResult(this.from, 1),
            r = t.mapResult(this.to, -1);
        return n.deleted && r.deleted || n.pos >= r.pos ? null : new e(n.pos, r.pos, this.mark)
    }
    merge(t) {
        return t instanceof e && t.mark.eq(this.mark) && this.from <= t.to && this.to >= t.from ? new e(Math.min(this.from, t.from), Math.max(this.to, t.to), this.mark) : null
    }
    toJSON() {
        return {
            stepType: `addMark`,
            mark: this.mark.toJSON(),
            from: this.from,
            to: this.to
        }
    }
    static fromJSON(t, n) {
        if (typeof n.from != `number` || typeof n.to != `number`) throw RangeError(`Invalid input for AddMarkStep.fromJSON`);
        return new e(n.from, n.to, t.markFromJSON(n.mark))
    }
};
k.jsonID(`addMark`, ur);
var dr = class e extends k {
    constructor(e, t, n) {
        super(), this.from = e, this.to = t, this.mark = n
    }
    apply(e) {
        let t = e.slice(this.from, this.to),
            n = new O(lr(t.content, e => e.mark(this.mark.removeFromSet(e.marks)), e), t.openStart, t.openEnd);
        return A.fromReplace(e, this.from, this.to, n)
    }
    invert() {
        return new ur(this.from, this.to, this.mark)
    }
    map(t) {
        let n = t.mapResult(this.from, 1),
            r = t.mapResult(this.to, -1);
        return n.deleted && r.deleted || n.pos >= r.pos ? null : new e(n.pos, r.pos, this.mark)
    }
    merge(t) {
        return t instanceof e && t.mark.eq(this.mark) && this.from <= t.to && this.to >= t.from ? new e(Math.min(this.from, t.from), Math.max(this.to, t.to), this.mark) : null
    }
    toJSON() {
        return {
            stepType: `removeMark`,
            mark: this.mark.toJSON(),
            from: this.from,
            to: this.to
        }
    }
    static fromJSON(t, n) {
        if (typeof n.from != `number` || typeof n.to != `number`) throw RangeError(`Invalid input for RemoveMarkStep.fromJSON`);
        return new e(n.from, n.to, t.markFromJSON(n.mark))
    }
};
k.jsonID(`removeMark`, dr);
var fr = class e extends k {
    constructor(e, t) {
        super(), this.pos = e, this.mark = t
    }
    apply(e) {
        let t = e.nodeAt(this.pos);
        if (!t) return A.fail(`No node at mark step's position`);
        let n = t.type.create(t.attrs, null, this.mark.addToSet(t.marks));
        return A.fromReplace(e, this.pos, this.pos + 1, new O(E.from(n), 0, +!t.isLeaf))
    }
    invert(t) {
        let n = t.nodeAt(this.pos);
        if (n) {
            let t = this.mark.addToSet(n.marks);
            if (t.length == n.marks.length) {
                for (let r = 0; r < n.marks.length; r++)
                    if (!n.marks[r].isInSet(t)) return new e(this.pos, n.marks[r]);
                return new e(this.pos, this.mark)
            }
        }
        return new pr(this.pos, this.mark)
    }
    map(t) {
        let n = t.mapResult(this.pos, 1);
        return n.deletedAfter ? null : new e(n.pos, this.mark)
    }
    toJSON() {
        return {
            stepType: `addNodeMark`,
            pos: this.pos,
            mark: this.mark.toJSON()
        }
    }
    static fromJSON(t, n) {
        if (typeof n.pos != `number`) throw RangeError(`Invalid input for AddNodeMarkStep.fromJSON`);
        return new e(n.pos, t.markFromJSON(n.mark))
    }
};
k.jsonID(`addNodeMark`, fr);
var pr = class e extends k {
    constructor(e, t) {
        super(), this.pos = e, this.mark = t
    }
    apply(e) {
        let t = e.nodeAt(this.pos);
        if (!t) return A.fail(`No node at mark step's position`);
        let n = t.type.create(t.attrs, null, this.mark.removeFromSet(t.marks));
        return A.fromReplace(e, this.pos, this.pos + 1, new O(E.from(n), 0, +!t.isLeaf))
    }
    invert(e) {
        let t = e.nodeAt(this.pos);
        return !t || !this.mark.isInSet(t.marks) ? this : new fr(this.pos, this.mark)
    }
    map(t) {
        let n = t.mapResult(this.pos, 1);
        return n.deletedAfter ? null : new e(n.pos, this.mark)
    }
    toJSON() {
        return {
            stepType: `removeNodeMark`,
            pos: this.pos,
            mark: this.mark.toJSON()
        }
    }
    static fromJSON(t, n) {
        if (typeof n.pos != `number`) throw RangeError(`Invalid input for RemoveNodeMarkStep.fromJSON`);
        return new e(n.pos, t.markFromJSON(n.mark))
    }
};
k.jsonID(`removeNodeMark`, pr);
var j = class e extends k {
    constructor(e, t, n, r = !1) {
        super(), this.from = e, this.to = t, this.slice = n, this.structure = r
    }
    apply(e) {
        return this.structure && mr(e, this.from, this.to) ? A.fail(`Structure replace would overwrite content`) : A.fromReplace(e, this.from, this.to, this.slice)
    }
    getMap() {
        return new or([this.from, this.to - this.from, this.slice.size])
    }
    invert(t) {
        return new e(this.from, this.from + this.slice.size, t.slice(this.from, this.to))
    }
    map(t) {
        let n = t.mapResult(this.to, -1),
            r = this.from == this.to && e.MAP_BIAS < 0 ? n : t.mapResult(this.from, 1);
        return r.deletedAcross && n.deletedAcross ? null : new e(r.pos, Math.max(r.pos, n.pos), this.slice, this.structure)
    }
    merge(t) {
        if (!(t instanceof e) || t.structure || this.structure) return null;
        if (this.from + this.slice.size == t.from && !this.slice.openEnd && !t.slice.openStart) {
            let n = this.slice.size + t.slice.size == 0 ? O.empty : new O(this.slice.content.append(t.slice.content), this.slice.openStart, t.slice.openEnd);
            return new e(this.from, this.to + (t.to - t.from), n, this.structure)
        } else if (t.to == this.from && !this.slice.openStart && !t.slice.openEnd) {
            let n = this.slice.size + t.slice.size == 0 ? O.empty : new O(t.slice.content.append(this.slice.content), t.slice.openStart, this.slice.openEnd);
            return new e(t.from, this.to, n, this.structure)
        } else return null
    }
    toJSON() {
        let e = {
            stepType: `replace`,
            from: this.from,
            to: this.to
        };
        return this.slice.size && (e.slice = this.slice.toJSON()), this.structure && (e.structure = !0), e
    }
    static fromJSON(t, n) {
        if (typeof n.from != `number` || typeof n.to != `number`) throw RangeError(`Invalid input for ReplaceStep.fromJSON`);
        return new e(n.from, n.to, O.fromJSON(t, n.slice), !!n.structure)
    }
};
j.MAP_BIAS = 1, k.jsonID(`replace`, j);
var M = class e extends k {
    constructor(e, t, n, r, i, a, o = !1) {
        super(), this.from = e, this.to = t, this.gapFrom = n, this.gapTo = r, this.slice = i, this.insert = a, this.structure = o
    }
    apply(e) {
        if (this.structure && (mr(e, this.from, this.gapFrom) || mr(e, this.gapTo, this.to))) return A.fail(`Structure gap-replace would overwrite content`);
        let t = e.slice(this.gapFrom, this.gapTo);
        if (t.openStart || t.openEnd) return A.fail(`Gap is not a flat range`);
        let n = this.slice.insertAt(this.insert, t.content);
        return n ? A.fromReplace(e, this.from, this.to, n) : A.fail(`Content does not fit in gap`)
    }
    getMap() {
        return new or([this.from, this.gapFrom - this.from, this.insert, this.gapTo, this.to - this.gapTo, this.slice.size - this.insert])
    }
    invert(t) {
        let n = this.gapTo - this.gapFrom;
        return new e(this.from, this.from + this.slice.size + n, this.from + this.insert, this.from + this.insert + n, t.slice(this.from, this.to).removeBetween(this.gapFrom - this.from, this.gapTo - this.from), this.gapFrom - this.from, this.structure)
    }
    map(t) {
        let n = t.mapResult(this.from, 1),
            r = t.mapResult(this.to, -1),
            i = this.from == this.gapFrom ? n.pos : t.map(this.gapFrom, -1),
            a = this.to == this.gapTo ? r.pos : t.map(this.gapTo, 1);
        return n.deletedAcross && r.deletedAcross || i < n.pos || a > r.pos ? null : new e(n.pos, r.pos, i, a, this.slice, this.insert, this.structure)
    }
    toJSON() {
        let e = {
            stepType: `replaceAround`,
            from: this.from,
            to: this.to,
            gapFrom: this.gapFrom,
            gapTo: this.gapTo,
            insert: this.insert
        };
        return this.slice.size && (e.slice = this.slice.toJSON()), this.structure && (e.structure = !0), e
    }
    static fromJSON(t, n) {
        if (typeof n.from != `number` || typeof n.to != `number` || typeof n.gapFrom != `number` || typeof n.gapTo != `number` || typeof n.insert != `number`) throw RangeError(`Invalid input for ReplaceAroundStep.fromJSON`);
        return new e(n.from, n.to, n.gapFrom, n.gapTo, O.fromJSON(t, n.slice), n.insert, !!n.structure)
    }
};
k.jsonID(`replaceAround`, M);

function mr(e, t, n) {
    let r = e.resolve(t),
        i = n - t,
        a = r.depth;
    for (; i > 0 && a > 0 && r.indexAfter(a) == r.node(a).childCount;) a--, i--;
    if (i > 0) {
        let e = r.node(a).maybeChild(r.indexAfter(a));
        for (; i > 0;) {
            if (!e || e.isLeaf) return !0;
            e = e.firstChild, i--
        }
    }
    return !1
}

function hr(e, t, n, r) {
    let i = [],
        a = [],
        o, s;
    e.doc.nodesBetween(t, n, (e, c, l) => {
        if (!e.isInline) return;
        let u = e.marks;
        if (!r.isInSet(u) && l.type.allowsMarkType(r.type)) {
            let l = Math.max(c, t),
                d = Math.min(c + e.nodeSize, n),
                f = r.addToSet(u);
            for (let e = 0; e < u.length; e++) u[e].isInSet(f) || (o && o.to == l && o.mark.eq(u[e]) ? o.to = d : i.push(o = new dr(l, d, u[e])));
            s && s.to == l ? s.to = d : a.push(s = new ur(l, d, r))
        }
    }), i.forEach(t => e.step(t)), a.forEach(t => e.step(t))
}

function gr(e, t, n, r) {
    let i = [],
        a = 0;
    e.doc.nodesBetween(t, n, (e, o) => {
        if (!e.isInline) return;
        a++;
        let s = null;
        if (r instanceof wn) {
            let t = e.marks,
                n;
            for (; n = r.isInSet(t);)(s || = []).push(n), t = n.removeFromSet(t)
        } else r ? r.isInSet(e.marks) && (s = [r]) : s = e.marks;
        if (s && s.length) {
            let r = Math.min(o + e.nodeSize, n);
            for (let e = 0; e < s.length; e++) {
                let n = s[e],
                    c;
                for (let e = 0; e < i.length; e++) {
                    let t = i[e];
                    t.step == a - 1 && n.eq(i[e].style) && (c = t)
                }
                c ? (c.to = r, c.step = a) : i.push({
                    style: n,
                    from: Math.max(o, t),
                    to: r,
                    step: a
                })
            }
        }
    }), i.forEach(t => e.step(new dr(t.from, t.to, t.style)))
}

function _r(e, t, n, r = n.contentMatch, i = !0) {
    let a = e.doc.nodeAt(t),
        o = [],
        s = t + 1;
    for (let t = 0; t < a.childCount; t++) {
        let c = a.child(t),
            l = s + c.nodeSize,
            u = r.matchType(c.type);
        if (!u) o.push(new j(s, l, O.empty));
        else {
            r = u;
            for (let t = 0; t < c.marks.length; t++) n.allowsMarkType(c.marks[t].type) || e.step(new dr(s, l, c.marks[t]));
            if (i && c.isText && n.whitespace != `pre`) {
                let e, t = /\r?\n|\r/g,
                    r;
                for (; e = t.exec(c.text);) r || = new O(E.from(n.schema.text(` `, n.allowedMarks(c.marks))), 0, 0), o.push(new j(s + e.index, s + e.index + e[0].length, r))
            }
        }
        s = l
    }
    if (!r.validEnd) {
        let t = r.fillBefore(E.empty, !0);
        e.replace(s, s, new O(t, 0, 0))
    }
    for (let t = o.length - 1; t >= 0; t--) e.step(o[t])
}

function vr(e, t, n) {
    return (t == 0 || e.canReplace(t, e.childCount)) && (n == e.childCount || e.canReplace(0, n))
}

function yr(e) {
    let t = e.parent.content.cutByIndex(e.startIndex, e.endIndex);
    for (let n = e.depth, r = 0, i = 0;; --n) {
        let a = e.$from.node(n),
            o = e.$from.index(n) + r,
            s = e.$to.indexAfter(n) - i;
        if (n < e.depth && a.canReplace(o, s, t)) return n;
        if (n == 0 || a.type.spec.isolating || !vr(a, o, s)) break;
        o && (r = 1), s < a.childCount && (i = 1)
    }
    return null
}

function br(e, t, n) {
    let {
        $from: r,
        $to: i,
        depth: a
    } = t, o = r.before(a + 1), s = i.after(a + 1), c = o, l = s, u = E.empty, d = 0;
    for (let e = a, t = !1; e > n; e--) t || r.index(e) > 0 ? (t = !0, u = E.from(r.node(e).copy(u)), d++) : c--;
    let f = E.empty,
        p = 0;
    for (let e = a, t = !1; e > n; e--) t || i.after(e + 1) < i.end(e) ? (t = !0, f = E.from(i.node(e).copy(f)), p++) : l++;
    e.step(new M(c, l, o, s, new O(u.append(f), d, p), u.size - d, !0))
}

function xr(e, t, n = null, r = e) {
    let i = Cr(e, t),
        a = i && wr(r, t);
    return a ? i.map(Sr).concat({
        type: t,
        attrs: n
    }).concat(a.map(Sr)) : null
}

function Sr(e) {
    return {
        type: e,
        attrs: null
    }
}

function Cr(e, t) {
    let {
        parent: n,
        startIndex: r,
        endIndex: i
    } = e, a = n.contentMatchAt(r).findWrapping(t);
    if (!a) return null;
    let o = a.length ? a[0] : t;
    return n.canReplaceWith(r, i, o) ? a : null
}

function wr(e, t) {
    let {
        parent: n,
        startIndex: r,
        endIndex: i
    } = e, a = n.child(r), o = t.contentMatch.findWrapping(a.type);
    if (!o) return null;
    let s = (o.length ? o[o.length - 1] : t).contentMatch;
    for (let e = r; s && e < i; e++) s = s.matchType(n.child(e).type);
    return !s || !s.validEnd ? null : o
}

function Tr(e, t, n) {
    let r = E.empty;
    for (let e = n.length - 1; e >= 0; e--) {
        if (r.size) {
            let t = n[e].type.contentMatch.matchFragment(r);
            if (!t || !t.validEnd) throw RangeError(`Wrapper type given to Transform.wrap does not form valid content of its parent wrapper`)
        }
        r = E.from(n[e].type.create(n[e].attrs, r))
    }
    let i = t.start,
        a = t.end;
    e.step(new M(i, a, i, a, new O(r, 0, 0), n.length, !0))
}

function Er(e, t, n, r, i) {
    if (!r.isTextblock) throw RangeError(`Type given to setBlockType should be a textblock`);
    let a = e.steps.length;
    e.doc.nodesBetween(t, n, (t, n) => {
        let o = typeof i == `function` ? i(t) : i;
        if (t.isTextblock && !t.hasMarkup(r, o) && kr(e.doc, e.mapping.slice(a).map(n), r)) {
            let i = null;
            if (r.schema.linebreakReplacement) {
                let e = r.whitespace == `pre`,
                    t = !!r.contentMatch.matchType(r.schema.linebreakReplacement);
                e && !t ? i = !1 : !e && t && (i = !0)
            }
            i === !1 && Or(e, t, n, a), _r(e, e.mapping.slice(a).map(n, 1), r, void 0, i === null);
            let s = e.mapping.slice(a),
                c = s.map(n, 1),
                l = s.map(n + t.nodeSize, 1);
            return e.step(new M(c, l, c + 1, l - 1, new O(E.from(r.create(o, null, t.marks)), 0, 0), 1, !0)), i === !0 && Dr(e, t, n, a), !1
        }
    })
}

function Dr(e, t, n, r) {
    t.forEach((i, a) => {
        if (i.isText) {
            let o, s = /\r?\n|\r/g;
            for (; o = s.exec(i.text);) {
                let i = e.mapping.slice(r).map(n + 1 + a + o.index);
                e.replaceWith(i, i + 1, t.type.schema.linebreakReplacement.create())
            }
        }
    })
}

function Or(e, t, n, r) {
    t.forEach((i, a) => {
        if (i.type == i.type.schema.linebreakReplacement) {
            let i = e.mapping.slice(r).map(n + 1 + a);
            e.replaceWith(i, i + 1, t.type.schema.text(`
`))
        }
    })
}

function kr(e, t, n) {
    let r = e.resolve(t),
        i = r.index();
    return r.parent.canReplaceWith(i, i + 1, n)
}

function Ar(e, t, n, r, i) {
    let a = e.doc.nodeAt(t);
    if (!a) throw RangeError(`No node at given position`);
    n || = a.type;
    let o = n.create(r, null, i || a.marks);
    if (a.isLeaf) return e.replaceWith(t, t + a.nodeSize, o);
    if (!n.validContent(a.content)) throw RangeError(`Invalid content for node type ` + n.name);
    e.step(new M(t, t + a.nodeSize, t + 1, t + a.nodeSize - 1, new O(E.from(o), 0, 0), 1, !0))
}

function jr(e, t, n = 1, r) {
    let i = e.resolve(t),
        a = i.depth - n,
        o = r && r[r.length - 1] || i.parent;
    if (a < 0 || i.parent.type.spec.isolating || !i.parent.canReplace(i.index(), i.parent.childCount) || !o.type.validContent(i.parent.content.cutByIndex(i.index(), i.parent.childCount))) return !1;
    for (let e = i.depth - 1, t = n - 2; e > a; e--, t--) {
        let n = i.node(e),
            a = i.index(e);
        if (n.type.spec.isolating) return !1;
        let o = n.content.cutByIndex(a, n.childCount),
            s = r && r[t + 1];
        s && (o = o.replaceChild(0, s.type.create(s.attrs)));
        let c = r && r[t] || n;
        if (!n.canReplace(a + 1, n.childCount) || !c.type.validContent(o)) return !1
    }
    let s = i.indexAfter(a),
        c = r && r[0];
    return i.node(a).canReplaceWith(s, s, c ? c.type : i.node(a + 1).type)
}

function Mr(e, t, n = 1, r) {
    let i = e.doc.resolve(t),
        a = E.empty,
        o = E.empty;
    for (let e = i.depth, t = i.depth - n, s = n - 1; e > t; e--, s--) {
        a = E.from(i.node(e).copy(a));
        let t = r && r[s];
        o = E.from(t ? t.type.create(t.attrs, o) : i.node(e).copy(o))
    }
    e.step(new j(t, t, new O(a.append(o), n, n), !0))
}

function Nr(e, t) {
    let n = e.resolve(t),
        r = n.index();
    return Fr(n.nodeBefore, n.nodeAfter) && n.parent.canReplace(r, r + 1)
}

function Pr(e, t) {
    t.content.size || e.type.compatibleContent(t.type);
    let n = e.contentMatchAt(e.childCount),
        {
            linebreakReplacement: r
        } = e.type.schema;
    for (let i = 0; i < t.childCount; i++) {
        let a = t.child(i),
            o = a.type == r ? e.type.schema.nodes.text : a.type;
        if (n = n.matchType(o), !n || !e.type.allowsMarks(a.marks)) return !1
    }
    return n.validEnd
}

function Fr(e, t) {
    return !!(e && t && !e.isLeaf && Pr(e, t))
}

function Ir(e, t, n) {
    let r = null,
        {
            linebreakReplacement: i
        } = e.doc.type.schema,
        a = e.doc.resolve(t - n),
        o = a.node().type;
    if (i && o.inlineContent) {
        let e = o.whitespace == `pre`,
            t = !!o.contentMatch.matchType(i);
        e && !t ? r = !1 : !e && t && (r = !0)
    }
    let s = e.steps.length;
    if (r === !1) {
        let r = e.doc.resolve(t + n);
        Or(e, r.node(), r.before(), s)
    }
    o.inlineContent && _r(e, t + n - 1, o, a.node().contentMatchAt(a.index()), r == null);
    let c = e.mapping.slice(s),
        l = c.map(t - n);
    if (e.step(new j(l, c.map(t + n, -1), O.empty, !0)), r === !0) {
        let t = e.doc.resolve(l);
        Dr(e, t.node(), t.before(), e.steps.length)
    }
    return e
}

function Lr(e, t, n) {
    let r = e.resolve(t);
    if (r.parent.canReplaceWith(r.index(), r.index(), n)) return t;
    if (r.parentOffset == 0)
        for (let e = r.depth - 1; e >= 0; e--) {
            let t = r.index(e);
            if (r.node(e).canReplaceWith(t, t, n)) return r.before(e + 1);
            if (t > 0) return null
        }
    if (r.parentOffset == r.parent.content.size)
        for (let e = r.depth - 1; e >= 0; e--) {
            let t = r.indexAfter(e);
            if (r.node(e).canReplaceWith(t, t, n)) return r.after(e + 1);
            if (t < r.node(e).childCount) return null
        }
    return null
}

function Rr(e, t, n) {
    let r = e.resolve(t);
    if (!n.content.size) return t;
    let i = n.content;
    for (let e = 0; e < n.openStart; e++) i = i.firstChild.content;
    for (let e = 1; e <= (n.openStart == 0 && n.size ? 2 : 1); e++)
        for (let t = r.depth; t >= 0; t--) {
            let n = t == r.depth ? 0 : r.pos <= (r.start(t + 1) + r.end(t + 1)) / 2 ? -1 : 1,
                a = r.index(t) + +(n > 0),
                o = r.node(t),
                s = !1;
            if (e == 1) s = o.canReplace(a, a, i);
            else {
                let e = o.contentMatchAt(a).findWrapping(i.firstChild.type);
                s = e && o.canReplaceWith(a, a, e[0])
            }
            if (s) return n == 0 ? r.pos : n < 0 ? r.before(t + 1) : r.after(t + 1)
        }
    return null
}

function zr(e, t, n = t, r = O.empty) {
    if (t == n && !r.size) return null;
    let i = e.resolve(t),
        a = e.resolve(n);
    return Br(i, a, r) ? new j(t, n, r) : new Vr(i, a, r).fit()
}

function Br(e, t, n) {
    return !n.openStart && !n.openEnd && e.start() == t.start() && e.parent.canReplace(e.index(), t.index(), n.content)
}
var Vr = class {
    constructor(e, t, n) {
        this.$from = e, this.$to = t, this.unplaced = n, this.frontier = [], this.placed = E.empty;
        for (let t = 0; t <= e.depth; t++) {
            let n = e.node(t);
            this.frontier.push({
                type: n.type,
                match: n.contentMatchAt(e.indexAfter(t))
            })
        }
        for (let t = e.depth; t > 0; t--) this.placed = E.from(e.node(t).copy(this.placed))
    }
    get depth() {
        return this.frontier.length - 1
    }
    fit() {
        for (; this.unplaced.size;) {
            let e = this.findFittable();
            e ? this.placeNodes(e) : this.openMore() || this.dropNode()
        }
        let e = this.mustMoveInline(),
            t = this.placed.size - this.depth - this.$from.depth,
            n = this.$from,
            r = this.close(e < 0 ? this.$to : n.doc.resolve(e));
        if (!r) return null;
        let i = this.placed,
            a = n.depth,
            o = r.depth;
        for (; a && o && i.childCount == 1;) i = i.firstChild.content, a--, o--;
        let s = new O(i, a, o);
        return e > -1 ? new M(n.pos, e, this.$to.pos, this.$to.end(), s, t) : s.size || n.pos != this.$to.pos ? new j(n.pos, r.pos, s) : null
    }
    findFittable() {
        let e = this.unplaced.openStart;
        for (let t = this.unplaced.content, n = 0, r = this.unplaced.openEnd; n < e; n++) {
            let i = t.firstChild;
            if (t.childCount > 1 && (r = 0), i.type.spec.isolating && r <= n) {
                e = n;
                break
            }
            t = i.content
        }
        for (let t = 1; t <= 2; t++)
            for (let n = t == 1 ? e : this.unplaced.openStart; n >= 0; n--) {
                let e, r = null;
                n ? (r = Wr(this.unplaced.content, n - 1).firstChild, e = r.content) : e = this.unplaced.content;
                let i = e.firstChild;
                for (let e = this.depth; e >= 0; e--) {
                    let {
                        type: a,
                        match: o
                    } = this.frontier[e], s, c = null;
                    if (t == 1 && (i ? o.matchType(i.type) || (c = o.fillBefore(E.from(i), !1)) : r && a.compatibleContent(r.type))) return {
                        sliceDepth: n,
                        frontierDepth: e,
                        parent: r,
                        inject: c
                    };
                    if (t == 2 && i && (s = o.findWrapping(i.type))) return {
                        sliceDepth: n,
                        frontierDepth: e,
                        parent: r,
                        wrap: s
                    };
                    if (r && o.matchType(r.type)) break
                }
            }
    }
    openMore() {
        let {
            content: e,
            openStart: t,
            openEnd: n
        } = this.unplaced, r = Wr(e, t);
        return !r.childCount || r.firstChild.isLeaf ? !1 : (this.unplaced = new O(e, t + 1, Math.max(n, r.size + t >= e.size - n ? t + 1 : 0)), !0)
    }
    dropNode() {
        let {
            content: e,
            openStart: t,
            openEnd: n
        } = this.unplaced, r = Wr(e, t);
        if (r.childCount <= 1 && t > 0) {
            let i = e.size - t <= t + r.size;
            this.unplaced = new O(Hr(e, t - 1, 1), t - 1, i ? t - 1 : n)
        } else this.unplaced = new O(Hr(e, t, 1), t, n)
    }
    placeNodes({
        sliceDepth: e,
        frontierDepth: t,
        parent: n,
        inject: r,
        wrap: i
    }) {
        for (; this.depth > t;) this.closeFrontierNode();
        if (i)
            for (let e = 0; e < i.length; e++) this.openFrontierNode(i[e]);
        let a = this.unplaced,
            o = n ? n.content : a.content,
            s = a.openStart - e,
            c = 0,
            l = [],
            {
                match: u,
                type: d
            } = this.frontier[t];
        if (r) {
            for (let e = 0; e < r.childCount; e++) l.push(r.child(e));
            u = u.matchFragment(r)
        }
        let f = o.size + e - (a.content.size - a.openEnd);
        for (; c < o.childCount;) {
            let e = o.child(c),
                t = u.matchType(e.type);
            if (!t) break;
            c++, (c > 1 || s == 0 || e.content.size) && (u = t, l.push(Gr(e.mark(d.allowedMarks(e.marks)), c == 1 ? s : 0, c == o.childCount ? f : -1)))
        }
        let p = c == o.childCount;
        p || (f = -1), this.placed = Ur(this.placed, t, E.from(l)), this.frontier[t].match = u, p && f < 0 && n && n.type == this.frontier[this.depth].type && this.frontier.length > 1 && this.closeFrontierNode();
        for (let e = 0, t = o; e < f; e++) {
            let e = t.lastChild;
            this.frontier.push({
                type: e.type,
                match: e.contentMatchAt(e.childCount)
            }), t = e.content
        }
        this.unplaced = p ? e == 0 ? O.empty : new O(Hr(a.content, e - 1, 1), e - 1, f < 0 ? a.openEnd : e - 1) : new O(Hr(a.content, e, c), a.openStart, a.openEnd)
    }
    mustMoveInline() {
        if (!this.$to.parent.isTextblock) return -1;
        let e = this.frontier[this.depth],
            t;
        if (!e.type.isTextblock || !Kr(this.$to, this.$to.depth, e.type, e.match, !1) || this.$to.depth == this.depth && (t = this.findCloseLevel(this.$to)) && t.depth == this.depth) return -1;
        let {
            depth: n
        } = this.$to, r = this.$to.after(n);
        for (; n > 1 && r == this.$to.end(--n);) ++r;
        return r
    }
    findCloseLevel(e) {
        scan: for (let t = Math.min(this.depth, e.depth); t >= 0; t--) {
            let {
                match: n,
                type: r
            } = this.frontier[t], i = t < e.depth && e.end(t + 1) == e.pos + (e.depth - (t + 1)), a = Kr(e, t, r, n, i);
            if (a) {
                for (let n = t - 1; n >= 0; n--) {
                    let {
                        match: t,
                        type: r
                    } = this.frontier[n], i = Kr(e, n, r, t, !0);
                    if (!i || i.childCount) continue scan
                }
                return {
                    depth: t,
                    fit: a,
                    move: i ? e.doc.resolve(e.after(t + 1)) : e
                }
            }
        }
    }
    close(e) {
        let t = this.findCloseLevel(e);
        if (!t) return null;
        for (; this.depth > t.depth;) this.closeFrontierNode();
        t.fit.childCount && (this.placed = Ur(this.placed, t.depth, t.fit)), e = t.move;
        for (let n = t.depth + 1; n <= e.depth; n++) {
            let t = e.node(n),
                r = t.type.contentMatch.fillBefore(t.content, !0, e.index(n));
            this.openFrontierNode(t.type, t.attrs, r)
        }
        return e
    }
    openFrontierNode(e, t = null, n) {
        let r = this.frontier[this.depth];
        r.match = r.match.matchType(e), this.placed = Ur(this.placed, this.depth, E.from(e.create(t, n))), this.frontier.push({
            type: e,
            match: e.contentMatch
        })
    }
    closeFrontierNode() {
        let e = this.frontier.pop().match.fillBefore(E.empty, !0);
        e.childCount && (this.placed = Ur(this.placed, this.frontier.length, e))
    }
};

function Hr(e, t, n) {
    return t == 0 ? e.cutByIndex(n, e.childCount) : e.replaceChild(0, e.firstChild.copy(Hr(e.firstChild.content, t - 1, n)))
}

function Ur(e, t, n) {
    return t == 0 ? e.append(n) : e.replaceChild(e.childCount - 1, e.lastChild.copy(Ur(e.lastChild.content, t - 1, n)))
}

function Wr(e, t) {
    for (let n = 0; n < t; n++) e = e.firstChild.content;
    return e
}

function Gr(e, t, n) {
    if (t <= 0) return e;
    let r = e.content;
    return t > 1 && (r = r.replaceChild(0, Gr(r.firstChild, t - 1, r.childCount == 1 ? n - 1 : 0))), t > 0 && (r = e.type.contentMatch.fillBefore(r).append(r), n <= 0 && (r = r.append(e.type.contentMatch.matchFragment(r).fillBefore(E.empty, !0)))), e.copy(r)
}

function Kr(e, t, n, r, i) {
    let a = e.node(t),
        o = i ? e.indexAfter(t) : e.index(t);
    if (o == a.childCount && !n.compatibleContent(a.type)) return null;
    let s = r.fillBefore(a.content, !0, o);
    return s && !qr(n, a.content, o) ? s : null
}

function qr(e, t, n) {
    for (let r = n; r < t.childCount; r++)
        if (!e.allowsMarks(t.child(r).marks)) return !0;
    return !1
}

function Jr(e) {
    return e.spec.defining || e.spec.definingForContent
}

function Yr(e, t, n, r) {
    if (!r.size) return e.deleteRange(t, n);
    let i = e.doc.resolve(t),
        a = e.doc.resolve(n);
    if (Br(i, a, r)) return e.step(new j(t, n, r));
    let o = $r(i, a);
    o[o.length - 1] == 0 && o.pop();
    let s = -(i.depth + 1);
    o.unshift(s);
    for (let e = i.depth, t = i.pos - 1; e > 0; e--, t--) {
        let n = i.node(e).type.spec;
        if (n.defining || n.definingAsContext || n.isolating) break;
        o.indexOf(e) > -1 ? s = e : i.before(e) == t && o.splice(1, 0, -e)
    }
    let c = o.indexOf(s),
        l = [],
        u = r.openStart;
    for (let e = r.content, t = 0;; t++) {
        let n = e.firstChild;
        if (l.push(n), t == r.openStart) break;
        e = n.content
    }
    for (let e = u - 1; e >= 0; e--) {
        let t = l[e],
            n = Jr(t.type);
        if (n && !t.sameMarkup(i.node(Math.abs(s) - 1))) u = e;
        else if (n || !t.type.isTextblock) break
    }
    for (let t = r.openStart; t >= 0; t--) {
        let s = (t + u + 1) % (r.openStart + 1),
            d = l[s];
        if (d)
            for (let t = 0; t < o.length; t++) {
                let l = o[(t + c) % o.length],
                    u = !0;
                l < 0 && (u = !1, l = -l);
                let f = i.node(l - 1),
                    p = i.index(l - 1);
                if (f.canReplaceWith(p, p, d.type, d.marks)) return e.replace(i.before(l), u ? a.after(l) : n, new O(Xr(r.content, 0, r.openStart, s), s, r.openEnd))
            }
    }
    let d = e.steps.length;
    for (let s = o.length - 1; s >= 0 && (e.replace(t, n, r), !(e.steps.length > d)); s--) {
        let e = o[s];
        e < 0 || (t = i.before(e), n = a.after(e))
    }
}

function Xr(e, t, n, r, i) {
    if (t < n) {
        let i = e.firstChild;
        e = e.replaceChild(0, i.copy(Xr(i.content, t + 1, n, r, i)))
    }
    if (t > r) {
        let t = i.contentMatchAt(0),
            n = t.fillBefore(e).append(e);
        e = n.append(t.matchFragment(n).fillBefore(E.empty, !0))
    }
    return e
}

function Zr(e, t, n, r) {
    if (!r.isInline && t == n && e.doc.resolve(t).parent.content.size) {
        let i = Lr(e.doc, t, r.type);
        i != null && (t = n = i)
    }
    e.replaceRange(t, n, new O(E.from(r), 0, 0))
}

function Qr(e, t, n) {
    let r = e.doc.resolve(t),
        i = e.doc.resolve(n);
    if (r.parent.isTextblock && i.parent.isTextblock && r.start() != i.start() && r.parentOffset == 0 && i.parentOffset == 0) {
        let a = r.sharedDepth(n),
            o = !1;
        for (let e = r.depth; e > a; e--) r.node(e).type.spec.isolating && (o = !0);
        for (let e = i.depth; e > a; e--) i.node(e).type.spec.isolating && (o = !0);
        if (!o) {
            for (let e = r.depth; e > 0 && t == r.start(e); e--) t = r.before(e);
            for (let e = i.depth; e > 0 && n == i.start(e); e--) n = i.before(e);
            r = e.doc.resolve(t), i = e.doc.resolve(n)
        }
    }
    let a = $r(r, i);
    for (let t = 0; t < a.length; t++) {
        let n = a[t],
            o = t == a.length - 1;
        if (o && n == 0 || r.node(n).type.contentMatch.validEnd) return e.delete(r.start(n), i.end(n));
        if (n > 0 && (o || r.node(n - 1).canReplace(r.index(n - 1), i.indexAfter(n - 1)))) return e.delete(r.before(n), i.after(n))
    }
    for (let a = 1; a <= r.depth && a <= i.depth; a++)
        if (t - r.start(a) == r.depth - a && n > r.end(a) && i.end(a) - n != i.depth - a && r.start(a - 1) == i.start(a - 1) && r.node(a - 1).canReplace(r.index(a - 1), i.index(a - 1))) return e.delete(r.before(a), n);
    e.delete(t, n)
}

function $r(e, t) {
    let n = [],
        r = Math.min(e.depth, t.depth);
    for (let i = r; i >= 0; i--) {
        let r = e.start(i);
        if (r < e.pos - (e.depth - i) || t.end(i) > t.pos + (t.depth - i) || e.node(i).type.spec.isolating || t.node(i).type.spec.isolating) break;
        (r == t.start(i) || i == e.depth && i == t.depth && e.parent.inlineContent && t.parent.inlineContent && i && t.start(i - 1) == r - 1) && n.push(i)
    }
    return n
}
var ei = class e extends k {
    constructor(e, t, n) {
        super(), this.pos = e, this.attr = t, this.value = n
    }
    apply(e) {
        let t = e.nodeAt(this.pos);
        if (!t) return A.fail(`No node at attribute step's position`);
        let n = Object.create(null);
        for (let e in t.attrs) n[e] = t.attrs[e];
        n[this.attr] = this.value;
        let r = t.type.create(n, null, t.marks);
        return A.fromReplace(e, this.pos, this.pos + 1, new O(E.from(r), 0, +!t.isLeaf))
    }
    getMap() {
        return or.empty
    }
    invert(t) {
        return new e(this.pos, this.attr, t.nodeAt(this.pos).attrs[this.attr])
    }
    map(t) {
        let n = t.mapResult(this.pos, 1);
        return n.deletedAfter ? null : new e(n.pos, this.attr, this.value)
    }
    toJSON() {
        return {
            stepType: `attr`,
            pos: this.pos,
            attr: this.attr,
            value: this.value
        }
    }
    static fromJSON(t, n) {
        if (typeof n.pos != `number` || typeof n.attr != `string`) throw RangeError(`Invalid input for AttrStep.fromJSON`);
        return new e(n.pos, n.attr, n.value)
    }
};
k.jsonID(`attr`, ei);
var ti = class e extends k {
    constructor(e, t) {
        super(), this.attr = e, this.value = t
    }
    apply(e) {
        let t = Object.create(null);
        for (let n in e.attrs) t[n] = e.attrs[n];
        t[this.attr] = this.value;
        let n = e.type.create(t, e.content, e.marks);
        return A.ok(n)
    }
    getMap() {
        return or.empty
    }
    invert(t) {
        return new e(this.attr, t.attrs[this.attr])
    }
    map(e) {
        return this
    }
    toJSON() {
        return {
            stepType: `docAttr`,
            attr: this.attr,
            value: this.value
        }
    }
    static fromJSON(t, n) {
        if (typeof n.attr != `string`) throw RangeError(`Invalid input for DocAttrStep.fromJSON`);
        return new e(n.attr, n.value)
    }
};
k.jsonID(`docAttr`, ti);
var ni = class extends Error {};
ni = function e(t) {
    let n = Error.call(this, t);
    return n.__proto__ = e.prototype, n
}, ni.prototype = Object.create(Error.prototype), ni.prototype.constructor = ni, ni.prototype.name = `TransformError`;
var ri = class {
        constructor(e) {
            this.doc = e, this.steps = [], this.docs = [], this.mapping = new sr
        }
        get before() {
            return this.docs.length ? this.docs[0] : this.doc
        }
        step(e) {
            let t = this.maybeStep(e);
            if (t.failed) throw new ni(t.failed);
            return this
        }
        maybeStep(e) {
            let t = e.apply(this.doc);
            return t.failed || this.addStep(e, t.doc), t
        }
        get docChanged() {
            return this.steps.length > 0
        }
        changedRange() {
            let e = 1e9,
                t = -1e9;
            for (let n = 0; n < this.mapping.maps.length; n++) {
                let r = this.mapping.maps[n];
                n && (e = r.map(e, 1), t = r.map(t, -1)), r.forEach((n, r, i, a) => {
                    e = Math.min(e, i), t = Math.max(t, a)
                })
            }
            return e == 1e9 ? null : {
                from: e,
                to: t
            }
        }
        addStep(e, t) {
            this.docs.push(this.doc), this.steps.push(e), this.mapping.appendMap(e.getMap()), this.doc = t
        }
        replace(e, t = e, n = O.empty) {
            let r = zr(this.doc, e, t, n);
            return r && this.step(r), this
        }
        replaceWith(e, t, n) {
            return this.replace(e, t, new O(E.from(n), 0, 0))
        }
        delete(e, t) {
            return this.replace(e, t, O.empty)
        }
        insert(e, t) {
            return this.replaceWith(e, e, t)
        }
        replaceRange(e, t, n) {
            return Yr(this, e, t, n), this
        }
        replaceRangeWith(e, t, n) {
            return Zr(this, e, t, n), this
        }
        deleteRange(e, t) {
            return Qr(this, e, t), this
        }
        lift(e, t) {
            return br(this, e, t), this
        }
        join(e, t = 1) {
            return Ir(this, e, t), this
        }
        wrap(e, t) {
            return Tr(this, e, t), this
        }
        setBlockType(e, t = e, n, r = null) {
            return Er(this, e, t, n, r), this
        }
        setNodeMarkup(e, t, n = null, r) {
            return Ar(this, e, t, n, r), this
        }
        setNodeAttribute(e, t, n) {
            return this.step(new ei(e, t, n)), this
        }
        setDocAttribute(e, t) {
            return this.step(new ti(e, t)), this
        }
        addNodeMark(e, t) {
            return this.step(new fr(e, t)), this
        }
        removeNodeMark(e, t) {
            let n = this.doc.nodeAt(e);
            if (!n) throw RangeError(`No node at position ` + e);
            if (t instanceof D) t.isInSet(n.marks) && this.step(new pr(e, t));
            else {
                let r = n.marks,
                    i, a = [];
                for (; i = t.isInSet(r);) a.push(new pr(e, i)), r = i.removeFromSet(r);
                for (let e = a.length - 1; e >= 0; e--) this.step(a[e])
            }
            return this
        }
        split(e, t = 1, n) {
            return Mr(this, e, t, n), this
        }
        addMark(e, t, n) {
            return hr(this, e, t, n), this
        }
        removeMark(e, t, n) {
            return gr(this, e, t, n), this
        }
        clearIncompatible(e, t, n) {
            return _r(this, e, t, n), this
        }
    },
    ii = Object.create(null),
    N = class {
        constructor(e, t, n) {
            this.$anchor = e, this.$head = t, this.ranges = n || [new ai(e.min(t), e.max(t))]
        }
        get anchor() {
            return this.$anchor.pos
        }
        get head() {
            return this.$head.pos
        }
        get from() {
            return this.$from.pos
        }
        get to() {
            return this.$to.pos
        }
        get $from() {
            return this.ranges[0].$from
        }
        get $to() {
            return this.ranges[0].$to
        }
        get empty() {
            let e = this.ranges;
            for (let t = 0; t < e.length; t++)
                if (e[t].$from.pos != e[t].$to.pos) return !1;
            return !0
        }
        content() {
            return this.$from.doc.slice(this.from, this.to, !0)
        }
        replace(e, t = O.empty) {
            let n = t.content.lastChild,
                r = null;
            for (let e = 0; e < t.openEnd; e++) r = n, n = n.lastChild;
            let i = e.steps.length,
                a = this.ranges;
            for (let o = 0; o < a.length; o++) {
                let {
                    $from: s,
                    $to: c
                } = a[o], l = e.mapping.slice(i);
                e.replaceRange(l.map(s.pos), l.map(c.pos), o ? O.empty : t), o == 0 && fi(e, i, (n ? n.isInline : r && r.isTextblock) ? -1 : 1)
            }
        }
        replaceWith(e, t) {
            let n = e.steps.length,
                r = this.ranges;
            for (let i = 0; i < r.length; i++) {
                let {
                    $from: a,
                    $to: o
                } = r[i], s = e.mapping.slice(n), c = s.map(a.pos), l = s.map(o.pos);
                i ? e.deleteRange(c, l) : (e.replaceRangeWith(c, l, t), fi(e, n, t.isInline ? -1 : 1))
            }
        }
        static findFrom(e, t, n = !1) {
            let r = e.parent.inlineContent ? new P(e) : di(e.node(0), e.parent, e.pos, e.index(), t, n);
            if (r) return r;
            for (let r = e.depth - 1; r >= 0; r--) {
                let i = t < 0 ? di(e.node(0), e.node(r), e.before(r + 1), e.index(r), t, n) : di(e.node(0), e.node(r), e.after(r + 1), e.index(r) + 1, t, n);
                if (i) return i
            }
            return null
        }
        static near(e, t = 1) {
            return this.findFrom(e, t) || this.findFrom(e, -t) || new I(e.node(0))
        }
        static atStart(e) {
            return di(e, e, 0, 0, 1) || new I(e)
        }
        static atEnd(e) {
            return di(e, e, e.content.size, e.childCount, -1) || new I(e)
        }
        static fromJSON(e, t) {
            if (!t || !t.type) throw RangeError(`Invalid input for Selection.fromJSON`);
            let n = ii[t.type];
            if (!n) throw RangeError(`No selection type ${t.type} defined`);
            return n.fromJSON(e, t)
        }
        static jsonID(e, t) {
            if (e in ii) throw RangeError(`Duplicate use of selection JSON ID ` + e);
            return ii[e] = t, t.prototype.jsonID = e, t
        }
        getBookmark() {
            return P.between(this.$anchor, this.$head).getBookmark()
        }
    };
N.prototype.visible = !0;
var ai = class {
        constructor(e, t) {
            this.$from = e, this.$to = t
        }
    },
    oi = !1;

function si(e) {
    !oi && !e.parent.inlineContent && (oi = !0)
}
var P = class e extends N {
    constructor(e, t = e) {
        si(e), si(t), super(e, t)
    }
    get $cursor() {
        return this.$anchor.pos == this.$head.pos ? this.$head : null
    }
    map(t, n) {
        let r = t.resolve(n.map(this.head));
        if (!r.parent.inlineContent) return N.near(r);
        let i = t.resolve(n.map(this.anchor));
        return new e(i.parent.inlineContent ? i : r, r)
    }
    replace(e, t = O.empty) {
        if (super.replace(e, t), t == O.empty) {
            let t = this.$from.marksAcross(this.$to);
            t && e.ensureMarks(t)
        }
    }
    eq(t) {
        return t instanceof e && t.anchor == this.anchor && t.head == this.head
    }
    getBookmark() {
        return new ci(this.anchor, this.head)
    }
    toJSON() {
        return {
            type: `text`,
            anchor: this.anchor,
            head: this.head
        }
    }
    static fromJSON(t, n) {
        if (typeof n.anchor != `number` || typeof n.head != `number`) throw RangeError(`Invalid input for TextSelection.fromJSON`);
        return new e(t.resolve(n.anchor), t.resolve(n.head))
    }
    static create(e, t, n = t) {
        let r = e.resolve(t);
        return new this(r, n == t ? r : e.resolve(n))
    }
    static between(t, n, r) {
        let i = t.pos - n.pos;
        if ((!r || i) && (r = i >= 0 ? 1 : -1), !n.parent.inlineContent) {
            let e = N.findFrom(n, r, !0) || N.findFrom(n, -r, !0);
            if (e) n = e.$head;
            else return N.near(n, r)
        }
        return t.parent.inlineContent || (i == 0 ? t = n : (t = (N.findFrom(t, -r, !0) || N.findFrom(t, r, !0)).$anchor, t.pos < n.pos != i < 0 && (t = n))), new e(t, n)
    }
};
N.jsonID(`text`, P);
var ci = class e {
        constructor(e, t) {
            this.anchor = e, this.head = t
        }
        map(t) {
            return new e(t.map(this.anchor), t.map(this.head))
        }
        resolve(e) {
            return P.between(e.resolve(this.anchor), e.resolve(this.head))
        }
    },
    F = class e extends N {
        constructor(e) {
            let t = e.nodeAfter,
                n = e.node(0).resolve(e.pos + t.nodeSize);
            super(e, n), this.node = t
        }
        map(t, n) {
            let {
                deleted: r,
                pos: i
            } = n.mapResult(this.anchor), a = t.resolve(i);
            return r ? N.near(a) : new e(a)
        }
        content() {
            return new O(E.from(this.node), 0, 0)
        }
        eq(t) {
            return t instanceof e && t.anchor == this.anchor
        }
        toJSON() {
            return {
                type: `node`,
                anchor: this.anchor
            }
        }
        getBookmark() {
            return new li(this.anchor)
        }
        static fromJSON(t, n) {
            if (typeof n.anchor != `number`) throw RangeError(`Invalid input for NodeSelection.fromJSON`);
            return new e(t.resolve(n.anchor))
        }
        static create(t, n) {
            return new e(t.resolve(n))
        }
        static isSelectable(e) {
            return !e.isText && e.type.spec.selectable !== !1
        }
    };
F.prototype.visible = !1, N.jsonID(`node`, F);
var li = class e {
        constructor(e) {
            this.anchor = e
        }
        map(t) {
            let {
                deleted: n,
                pos: r
            } = t.mapResult(this.anchor);
            return n ? new ci(r, r) : new e(r)
        }
        resolve(e) {
            let t = e.resolve(this.anchor),
                n = t.nodeAfter;
            return n && F.isSelectable(n) ? new F(t) : N.near(t)
        }
    },
    I = class e extends N {
        constructor(e) {
            super(e.resolve(0), e.resolve(e.content.size))
        }
        replace(e, t = O.empty) {
            if (t == O.empty) {
                e.delete(0, e.doc.content.size);
                let t = N.atStart(e.doc);
                t.eq(e.selection) || e.setSelection(t)
            } else super.replace(e, t)
        }
        toJSON() {
            return {
                type: `all`
            }
        }
        static fromJSON(t) {
            return new e(t)
        }
        map(t) {
            return new e(t)
        }
        eq(t) {
            return t instanceof e
        }
        getBookmark() {
            return ui
        }
    };
N.jsonID(`all`, I);
var ui = {
    map() {
        return this
    },
    resolve(e) {
        return new I(e)
    }
};

function di(e, t, n, r, i, a = !1) {
    if (t.inlineContent) return P.create(e, n);
    for (let o = r - (i > 0 ? 0 : 1); i > 0 ? o < t.childCount : o >= 0; o += i) {
        let r = t.child(o);
        if (!r.isAtom) {
            let t = di(e, r, n + i, i < 0 ? r.childCount : 0, i, a);
            if (t) return t
        } else if (!a && F.isSelectable(r)) return F.create(e, n - (i < 0 ? r.nodeSize : 0));
        n += r.nodeSize * i
    }
    return null
}

function fi(e, t, n) {
    let r = e.steps.length - 1;
    if (r < t) return;
    let i = e.steps[r];
    if (!(i instanceof j || i instanceof M)) return;
    let a = e.mapping.maps[r],
        o;
    a.forEach((e, t, n, r) => {
        o ? ? = r
    }), e.setSelection(N.near(e.doc.resolve(o), n))
}
var pi = 1,
    mi = 2,
    hi = 4,
    gi = class extends ri {
        constructor(e) {
            super(e.doc), this.curSelectionFor = 0, this.updated = 0, this.meta = Object.create(null), this.time = Date.now(), this.curSelection = e.selection, this.storedMarks = e.storedMarks
        }
        get selection() {
            return this.curSelectionFor < this.steps.length && (this.curSelection = this.curSelection.map(this.doc, this.mapping.slice(this.curSelectionFor)), this.curSelectionFor = this.steps.length), this.curSelection
        }
        setSelection(e) {
            if (e.$from.doc != this.doc) throw RangeError(`Selection passed to setSelection must point at the current document`);
            return this.curSelection = e, this.curSelectionFor = this.steps.length, this.updated = (this.updated | pi) & -3, this.storedMarks = null, this
        }
        get selectionSet() {
            return (this.updated & pi) > 0
        }
        setStoredMarks(e) {
            return this.storedMarks = e, this.updated |= mi, this
        }
        ensureMarks(e) {
            return D.sameSet(this.storedMarks || this.selection.$from.marks(), e) || this.setStoredMarks(e), this
        }
        addStoredMark(e) {
            return this.ensureMarks(e.addToSet(this.storedMarks || this.selection.$head.marks()))
        }
        removeStoredMark(e) {
            return this.ensureMarks(e.removeFromSet(this.storedMarks || this.selection.$head.marks()))
        }
        get storedMarksSet() {
            return (this.updated & mi) > 0
        }
        addStep(e, t) {
            super.addStep(e, t), this.updated &= -3, this.storedMarks = null
        }
        setTime(e) {
            return this.time = e, this
        }
        replaceSelection(e) {
            return this.selection.replace(this, e), this
        }
        replaceSelectionWith(e, t = !0) {
            let n = this.selection;
            return t && (e = e.mark(this.storedMarks || (n.empty ? n.$from.marks() : n.$from.marksAcross(n.$to) || D.none))), n.replaceWith(this, e), this
        }
        deleteSelection() {
            return this.selection.replace(this), this
        }
        insertText(e, t, n) {
            let r = this.doc.type.schema;
            if (t == null) return e ? this.replaceSelectionWith(r.text(e), !0) : this.deleteSelection(); {
                if (n ? ? = t, !e) return this.deleteRange(t, n);
                let i = this.storedMarks;
                if (!i) {
                    let e = this.doc.resolve(t);
                    i = n == t ? e.marks() : e.marksAcross(this.doc.resolve(n))
                }
                return this.replaceRangeWith(t, n, r.text(e, i)), !this.selection.empty && this.selection.to == t + e.length && this.setSelection(N.near(this.selection.$to)), this
            }
        }
        setMeta(e, t) {
            return this.meta[typeof e == `string` ? e : e.key] = t, this
        }
        getMeta(e) {
            return this.meta[typeof e == `string` ? e : e.key]
        }
        get isGeneric() {
            for (let e in this.meta) return !1;
            return !0
        }
        scrollIntoView() {
            return this.updated |= hi, this
        }
        get scrolledIntoView() {
            return (this.updated & hi) > 0
        }
    };

function _i(e, t) {
    return !t || !e ? e : e.bind(t)
}
var vi = class {
        constructor(e, t, n) {
            this.name = e, this.init = _i(t.init, n), this.apply = _i(t.apply, n)
        }
    },
    yi = [new vi(`doc`, {
        init(e) {
            return e.doc || e.schema.topNodeType.createAndFill()
        },
        apply(e) {
            return e.doc
        }
    }), new vi(`selection`, {
        init(e, t) {
            return e.selection || N.atStart(t.doc)
        },
        apply(e) {
            return e.selection
        }
    }), new vi(`storedMarks`, {
        init(e) {
            return e.storedMarks || null
        },
        apply(e, t, n, r) {
            return r.selection.$cursor ? e.storedMarks : null
        }
    }), new vi(`scrollToSelection`, {
        init() {
            return 0
        },
        apply(e, t) {
            return e.scrolledIntoView ? t + 1 : t
        }
    })],
    bi = class {
        constructor(e, t) {
            this.schema = e, this.plugins = [], this.pluginsByKey = Object.create(null), this.fields = yi.slice(), t && t.forEach(e => {
                if (this.pluginsByKey[e.key]) throw RangeError(`Adding different instances of a keyed plugin (` + e.key + `)`);
                this.plugins.push(e), this.pluginsByKey[e.key] = e, e.spec.state && this.fields.push(new vi(e.key, e.spec.state, e))
            })
        }
    },
    xi = class e {
        constructor(e) {
            this.config = e
        }
        get schema() {
            return this.config.schema
        }
        get plugins() {
            return this.config.plugins
        }
        apply(e) {
            return this.applyTransaction(e).state
        }
        filterTransaction(e, t = -1) {
            for (let n = 0; n < this.config.plugins.length; n++)
                if (n != t) {
                    let t = this.config.plugins[n];
                    if (t.spec.filterTransaction && !t.spec.filterTransaction.call(t, e, this)) return !1
                }
            return !0
        }
        applyTransaction(e) {
            if (!this.filterTransaction(e)) return {
                state: this,
                transactions: []
            };
            let t = [e],
                n = this.applyInner(e),
                r = null;
            for (;;) {
                let i = !1;
                for (let a = 0; a < this.config.plugins.length; a++) {
                    let o = this.config.plugins[a];
                    if (o.spec.appendTransaction) {
                        let s = r ? r[a].n : 0,
                            c = r ? r[a].state : this,
                            l = s < t.length && o.spec.appendTransaction.call(o, s ? t.slice(s) : t, c, n);
                        if (l && n.filterTransaction(l, a)) {
                            if (l.setMeta(`appendedTransaction`, e), !r) {
                                r = [];
                                for (let e = 0; e < this.config.plugins.length; e++) r.push(e < a ? {
                                    state: n,
                                    n: t.length
                                } : {
                                    state: this,
                                    n: 0
                                })
                            }
                            t.push(l), n = n.applyInner(l), i = !0
                        }
                        r && (r[a] = {
                            state: n,
                            n: t.length
                        })
                    }
                }
                if (!i) return {
                    state: n,
                    transactions: t
                }
            }
        }
        applyInner(t) {
            if (!t.before.eq(this.doc)) throw RangeError(`Applying a mismatched transaction`);
            let n = new e(this.config),
                r = this.config.fields;
            for (let e = 0; e < r.length; e++) {
                let i = r[e];
                n[i.name] = i.apply(t, this[i.name], this, n)
            }
            return n
        }
        get tr() {
            return new gi(this)
        }
        static create(t) {
            let n = new bi(t.doc ? t.doc.type.schema : t.schema, t.plugins),
                r = new e(n);
            for (let e = 0; e < n.fields.length; e++) r[n.fields[e].name] = n.fields[e].init(t, r);
            return r
        }
        reconfigure(t) {
            let n = new bi(this.schema, t.plugins),
                r = n.fields,
                i = new e(n);
            for (let e = 0; e < r.length; e++) {
                let n = r[e].name;
                i[n] = this.hasOwnProperty(n) ? this[n] : r[e].init(t, i)
            }
            return i
        }
        toJSON(e) {
            let t = {
                doc: this.doc.toJSON(),
                selection: this.selection.toJSON()
            };
            if (this.storedMarks && (t.storedMarks = this.storedMarks.map(e => e.toJSON())), e && typeof e == `object`)
                for (let n in e) {
                    if (n == `doc` || n == `selection`) throw RangeError("The JSON fields `doc` and `selection` are reserved");
                    let r = e[n],
                        i = r.spec.state;
                    i && i.toJSON && (t[n] = i.toJSON.call(r, this[r.key]))
                }
            return t
        }
        static fromJSON(t, n, r) {
            if (!n) throw RangeError(`Invalid input for EditorState.fromJSON`);
            if (!t.schema) throw RangeError(`Required config field 'schema' missing`);
            let i = new bi(t.schema, t.plugins),
                a = new e(i);
            return i.fields.forEach(e => {
                if (e.name == `doc`) a.doc = $t.fromJSON(t.schema, n.doc);
                else if (e.name == `selection`) a.selection = N.fromJSON(a.doc, n.selection);
                else if (e.name == `storedMarks`) n.storedMarks && (a.storedMarks = n.storedMarks.map(t.schema.markFromJSON));
                else {
                    if (r)
                        for (let i in r) {
                            let o = r[i],
                                s = o.spec.state;
                            if (o.key == e.name && s && s.fromJSON && Object.prototype.hasOwnProperty.call(n, i)) {
                                a[e.name] = s.fromJSON.call(o, t, n[i], a);
                                return
                            }
                        }
                    a[e.name] = e.init(t, a)
                }
            }), a
        }
    };

function Si(e, t, n) {
    for (let r in e) {
        let i = e[r];
        i instanceof Function ? i = i.bind(t) : r == `handleDOMEvents` && (i = Si(i, t, {})), n[r] = i
    }
    return n
}
var Ci = class {
        constructor(e) {
            this.spec = e, this.props = {}, e.props && Si(e.props, this, this.props), this.key = e.key ? e.key.key : Ti(`plugin`)
        }
        getState(e) {
            return e[this.key]
        }
    },
    wi = Object.create(null);

function Ti(e) {
    return e in wi ? e + `$` + ++wi[e] : (wi[e] = 0, e + `$`)
}
var Ei = class {
        constructor(e = `key`) {
            this.key = Ti(e)
        }
        get(e) {
            return e.config.pluginsByKey[this.key]
        }
        getState(e) {
            return e[this.key]
        }
    },
    Di = (e, t) => e.selection.empty ? !1 : (t && t(e.tr.deleteSelection().scrollIntoView()), !0);

function Oi(e, t) {
    let {
        $cursor: n
    } = e.selection;
    return !n || (t ? !t.endOfTextblock(`backward`, e) : n.parentOffset > 0) ? null : n
}
var ki = (e, t, n) => {
    let r = Oi(e, n);
    if (!r) return !1;
    let i = Mi(r);
    if (!i) {
        let n = r.blockRange(),
            i = n && yr(n);
        return i == null ? !1 : (t && t(e.tr.lift(n, i).scrollIntoView()), !0)
    }
    let a = i.nodeBefore;
    if (qi(e, i, t, -1)) return !0;
    if (r.parent.content.size == 0 && (Ai(a, `end`) || F.isSelectable(a)))
        for (let n = r.depth;; n--) {
            let o = zr(e.doc, r.before(n), r.after(n), O.empty);
            if (o && o.slice.size < o.to - o.from) {
                if (t) {
                    let n = e.tr.step(o);
                    n.setSelection(Ai(a, `end`) ? N.findFrom(n.doc.resolve(n.mapping.map(i.pos, -1)), -1) : F.create(n.doc, i.pos - a.nodeSize)), t(n.scrollIntoView())
                }
                return !0
            }
            if (n == 1 || r.node(n - 1).childCount > 1) break
        }
    return a.isAtom && i.depth == r.depth - 1 ? (t && t(e.tr.delete(i.pos - a.nodeSize, i.pos).scrollIntoView()), !0) : !1
};

function Ai(e, t, n = !1) {
    for (let r = e; r; r = t == `start` ? r.firstChild : r.lastChild) {
        if (r.isTextblock) return !0;
        if (n && r.childCount != 1) return !1
    }
    return !1
}
var ji = (e, t, n) => {
    let {
        $head: r,
        empty: i
    } = e.selection, a = r;
    if (!i) return !1;
    if (r.parent.isTextblock) {
        if (n ? !n.endOfTextblock(`backward`, e) : r.parentOffset > 0) return !1;
        a = Mi(r)
    }
    let o = a && a.nodeBefore;
    return !o || !F.isSelectable(o) ? !1 : (t && t(e.tr.setSelection(F.create(e.doc, a.pos - o.nodeSize)).scrollIntoView()), !0)
};

function Mi(e) {
    if (!e.parent.type.spec.isolating)
        for (let t = e.depth - 1; t >= 0; t--) {
            if (e.index(t) > 0) return e.doc.resolve(e.before(t + 1));
            if (e.node(t).type.spec.isolating) break
        }
    return null
}

function Ni(e, t) {
    let {
        $cursor: n
    } = e.selection;
    return !n || (t ? !t.endOfTextblock(`forward`, e) : n.parentOffset < n.parent.content.size) ? null : n
}
var Pi = (e, t, n) => {
        let r = Ni(e, n);
        if (!r) return !1;
        let i = Ii(r);
        if (!i) return !1;
        let a = i.nodeAfter;
        if (qi(e, i, t, 1)) return !0;
        if (r.parent.content.size == 0 && (Ai(a, `start`) || F.isSelectable(a))) {
            let n = zr(e.doc, r.before(), r.after(), O.empty);
            if (n && n.slice.size < n.to - n.from) {
                if (t) {
                    let r = e.tr.step(n);
                    r.setSelection(Ai(a, `start`) ? N.findFrom(r.doc.resolve(r.mapping.map(i.pos)), 1) : F.create(r.doc, r.mapping.map(i.pos))), t(r.scrollIntoView())
                }
                return !0
            }
        }
        return a.isAtom && i.depth == r.depth - 1 ? (t && t(e.tr.delete(i.pos, i.pos + a.nodeSize).scrollIntoView()), !0) : !1
    },
    Fi = (e, t, n) => {
        let {
            $head: r,
            empty: i
        } = e.selection, a = r;
        if (!i) return !1;
        if (r.parent.isTextblock) {
            if (n ? !n.endOfTextblock(`forward`, e) : r.parentOffset < r.parent.content.size) return !1;
            a = Ii(r)
        }
        let o = a && a.nodeAfter;
        return !o || !F.isSelectable(o) ? !1 : (t && t(e.tr.setSelection(F.create(e.doc, a.pos)).scrollIntoView()), !0)
    };

function Ii(e) {
    if (!e.parent.type.spec.isolating)
        for (let t = e.depth - 1; t >= 0; t--) {
            let n = e.node(t);
            if (e.index(t) + 1 < n.childCount) return e.doc.resolve(e.after(t + 1));
            if (n.type.spec.isolating) break
        }
    return null
}
var Li = (e, t) => {
        let {
            $from: n,
            $to: r
        } = e.selection, i = n.blockRange(r), a = i && yr(i);
        return a == null ? !1 : (t && t(e.tr.lift(i, a).scrollIntoView()), !0)
    },
    Ri = (e, t) => {
        let {
            $head: n,
            $anchor: r
        } = e.selection;
        return !n.parent.type.spec.code || !n.sameParent(r) ? !1 : (t && t(e.tr.insertText(`
`).scrollIntoView()), !0)
    };

function zi(e) {
    for (let t = 0; t < e.edgeCount; t++) {
        let {
            type: n
        } = e.edge(t);
        if (n.isTextblock && !n.hasRequiredAttrs()) return n
    }
    return null
}
var Bi = (e, t) => {
        let {
            $head: n,
            $anchor: r
        } = e.selection;
        if (!n.parent.type.spec.code || !n.sameParent(r)) return !1;
        let i = n.node(-1),
            a = n.indexAfter(-1),
            o = zi(i.contentMatchAt(a));
        if (!o || !i.canReplaceWith(a, a, o)) return !1;
        if (t) {
            let r = n.after(),
                i = e.tr.replaceWith(r, r, o.createAndFill());
            i.setSelection(N.near(i.doc.resolve(r), 1)), t(i.scrollIntoView())
        }
        return !0
    },
    Vi = (e, t) => {
        let n = e.selection,
            {
                $from: r,
                $to: i
            } = n;
        if (n instanceof I || r.parent.inlineContent || i.parent.inlineContent) return !1;
        let a = zi(i.parent.contentMatchAt(i.indexAfter()));
        if (!a || !a.isTextblock) return !1;
        if (t) {
            let n = (!r.parentOffset && i.index() < i.parent.childCount ? r : i).pos,
                o = e.tr.insert(n, a.createAndFill());
            o.setSelection(P.create(o.doc, n + 1)), t(o.scrollIntoView())
        }
        return !0
    },
    Hi = (e, t) => {
        let {
            $cursor: n
        } = e.selection;
        if (!n || n.parent.content.size) return !1;
        if (n.depth > 1 && n.after() != n.end(-1)) {
            let r = n.before();
            if (jr(e.doc, r)) return t && t(e.tr.split(r).scrollIntoView()), !0
        }
        let r = n.blockRange(),
            i = r && yr(r);
        return i == null ? !1 : (t && t(e.tr.lift(r, i).scrollIntoView()), !0)
    };

function Ui(e) {
    return (t, n) => {
        let {
            $from: r,
            $to: i
        } = t.selection;
        if (t.selection instanceof F && t.selection.node.isBlock) return !r.parentOffset || !jr(t.doc, r.pos) ? !1 : (n && n(t.tr.split(r.pos).scrollIntoView()), !0);
        if (!r.depth) return !1;
        let a = [],
            o, s, c = !1,
            l = !1;
        for (let t = r.depth;; t--)
            if (r.node(t).isBlock) {
                c = r.end(t) == r.pos + (r.depth - t), l = r.start(t) == r.pos - (r.depth - t), s = zi(r.node(t - 1).contentMatchAt(r.indexAfter(t - 1)));
                let n = e && e(i.parent, c, r);
                a.unshift(n || (c && s ? {
                    type: s
                } : null)), o = t;
                break
            } else {
                if (t == 1) return !1;
                a.unshift(null)
            }
        let u = t.tr;
        (t.selection instanceof P || t.selection instanceof I) && u.deleteSelection();
        let d = u.mapping.map(r.pos),
            f = jr(u.doc, d, a.length, a);
        if (f || = (a[0] = s ? {
                type: s
            } : null, jr(u.doc, d, a.length, a)), !f) return !1;
        if (u.split(d, a.length, a), !c && l && r.node(o).type != s) {
            let e = u.mapping.map(r.before(o)),
                t = u.doc.resolve(e);
            s && r.node(o - 1).canReplaceWith(t.index(), t.index() + 1, s) && u.setNodeMarkup(u.mapping.map(r.before(o)), s)
        }
        return n && n(u.scrollIntoView()), !0
    }
}
var Wi = Ui(),
    Gi = (e, t) => (t && t(e.tr.setSelection(new I(e.doc))), !0);

function Ki(e, t, n) {
    let r = t.nodeBefore,
        i = t.nodeAfter,
        a = t.index();
    return !r || !i || !r.type.compatibleContent(i.type) ? !1 : !r.content.size && t.parent.canReplace(a - 1, a) ? (n && n(e.tr.delete(t.pos - r.nodeSize, t.pos).scrollIntoView()), !0) : !t.parent.canReplace(a, a + 1) || !(i.isTextblock || Nr(e.doc, t.pos)) ? !1 : (n && n(e.tr.join(t.pos).scrollIntoView()), !0)
}

function qi(e, t, n, r) {
    let i = t.nodeBefore,
        a = t.nodeAfter,
        o, s, c = i.type.spec.isolating || a.type.spec.isolating;
    if (!c && Ki(e, t, n)) return !0;
    let l = !c && t.parent.canReplace(t.index(), t.index() + 1);
    if (l && (o = (s = i.contentMatchAt(i.childCount)).findWrapping(a.type)) && s.matchType(o[0] || a.type).validEnd) {
        if (n) {
            let r = t.pos + a.nodeSize,
                s = E.empty;
            for (let e = o.length - 1; e >= 0; e--) s = E.from(o[e].create(null, s));
            s = E.from(i.copy(s));
            let c = e.tr.step(new M(t.pos - 1, r, t.pos, r, new O(s, 1, 0), o.length, !0)),
                l = c.doc.resolve(r + 2 * o.length);
            l.nodeAfter && l.nodeAfter.type == i.type && Nr(c.doc, l.pos) && c.join(l.pos), n(c.scrollIntoView())
        }
        return !0
    }
    let u = a.type.spec.isolating || r > 0 && c ? null : N.findFrom(t, 1),
        d = u && u.$from.blockRange(u.$to),
        f = d && yr(d);
    if (f != null && f >= t.depth) return n && n(e.tr.lift(d, f).scrollIntoView()), !0;
    if (l && Ai(a, `start`, !0) && Ai(i, `end`)) {
        let r = i,
            o = [];
        for (; o.push(r), !r.isTextblock;) r = r.lastChild;
        let s = a,
            c = 1;
        for (; !s.isTextblock; s = s.firstChild) c++;
        if (r.canReplace(r.childCount, r.childCount, s.content)) {
            if (n) {
                let r = E.empty;
                for (let e = o.length - 1; e >= 0; e--) r = E.from(o[e].copy(r));
                n(e.tr.step(new M(t.pos - o.length, t.pos + a.nodeSize, t.pos + c, t.pos + a.nodeSize - c, new O(r, o.length, 0), 0, !0)).scrollIntoView())
            }
            return !0
        }
    }
    return !1
}

function Ji(e) {
    return function(t, n) {
        let r = t.selection,
            i = e < 0 ? r.$from : r.$to,
            a = i.depth;
        for (; i.node(a).isInline;) {
            if (!a) return !1;
            a--
        }
        return i.node(a).isTextblock ? (n && n(t.tr.setSelection(P.create(t.doc, e < 0 ? i.start(a) : i.end(a)))), !0) : !1
    }
}
var Yi = Ji(-1),
    Xi = Ji(1);

function Zi(e, t = null) {
    return function(n, r) {
        let {
            $from: i,
            $to: a
        } = n.selection, o = i.blockRange(a), s = o && xr(o, e, t);
        return s ? (r && r(n.tr.wrap(o, s).scrollIntoView()), !0) : !1
    }
}

function Qi(e, t = null) {
    return function(n, r) {
        let i = !1;
        for (let r = 0; r < n.selection.ranges.length && !i; r++) {
            let {
                $from: {
                    pos: a
                },
                $to: {
                    pos: o
                }
            } = n.selection.ranges[r];
            n.doc.nodesBetween(a, o, (r, a) => {
                if (i) return !1;
                if (!(!r.isTextblock || r.hasMarkup(e, t)))
                    if (r.type == e) i = !0;
                    else {
                        let t = n.doc.resolve(a),
                            r = t.index();
                        i = t.parent.canReplaceWith(r, r + 1, e)
                    }
            })
        }
        if (!i) return !1;
        if (r) {
            let i = n.tr;
            for (let r = 0; r < n.selection.ranges.length; r++) {
                let {
                    $from: {
                        pos: a
                    },
                    $to: {
                        pos: o
                    }
                } = n.selection.ranges[r];
                i.setBlockType(a, o, e, t)
            }
            r(i.scrollIntoView())
        }
        return !0
    }
}

function $i(e, t, n, r) {
    for (let i = 0; i < t.length; i++) {
        let {
            $from: a,
            $to: o
        } = t[i], s = a.depth == 0 ? e.inlineContent && e.type.allowsMarkType(n) : !1;
        if (e.nodesBetween(a.pos, o.pos, (e, t) => {
                if (s || !r && e.isAtom && e.isInline && t >= a.pos && t + e.nodeSize <= o.pos) return !1;
                s = e.inlineContent && e.type.allowsMarkType(n)
            }), s) return !0
    }
    return !1
}

function ea(e) {
    let t = [];
    for (let n = 0; n < e.length; n++) {
        let {
            $from: r,
            $to: i
        } = e[n];
        r.doc.nodesBetween(r.pos, i.pos, (e, n) => {
            if (e.isAtom && e.content.size && e.isInline && n >= r.pos && n + e.nodeSize <= i.pos) return n + 1 > r.pos && t.push(new ai(r, r.doc.resolve(n + 1))), r = r.doc.resolve(n + 1 + e.content.size), !1
        }), r.pos < i.pos && t.push(new ai(r, i))
    }
    return t
}

function ta(e, t = null, n) {
    let r = (n && n.removeWhenPresent) !== !1,
        i = (n && n.enterInlineAtoms) !== !1,
        a = !(n && n.includeWhitespace);
    return function(n, o) {
        let {
            empty: s,
            $cursor: c,
            ranges: l
        } = n.selection;
        if (s && !c || !$i(n.doc, l, e, i)) return !1;
        if (o)
            if (c) e.isInSet(n.storedMarks || c.marks()) ? o(n.tr.removeStoredMark(e)) : o(n.tr.addStoredMark(e.create(t)));
            else {
                let s, c = n.tr;
                i || (l = ea(l)), s = r ? !l.some(t => n.doc.rangeHasMark(t.$from.pos, t.$to.pos, e)) : !l.every(t => {
                    let n = !1;
                    return c.doc.nodesBetween(t.$from.pos, t.$to.pos, (r, i, a) => {
                        if (n) return !1;
                        n = !e.isInSet(r.marks) && !!a && a.type.allowsMarkType(e) && !(r.isText && /^\s*$/.test(r.textBetween(Math.max(0, t.$from.pos - i), Math.min(r.nodeSize, t.$to.pos - i))))
                    }), !n
                });
                for (let n = 0; n < l.length; n++) {
                    let {
                        $from: r,
                        $to: i
                    } = l[n];
                    if (!s) c.removeMark(r.pos, i.pos, e);
                    else {
                        let n = r.pos,
                            o = i.pos,
                            s = r.nodeAfter,
                            l = i.nodeBefore,
                            u = a && s && s.isText ? /^\s*/.exec(s.text)[0].length : 0,
                            d = a && l && l.isText ? /\s*$/.exec(l.text)[0].length : 0;
                        n + u < o && (n += u, o -= d), c.addMark(n, o, e.create(t))
                    }
                }
                o(c.scrollIntoView())
            }
        return !0
    }
}

function na(...e) {
    return function(t, n, r) {
        for (let i = 0; i < e.length; i++)
            if (e[i](t, n, r)) return !0;
        return !1
    }
}
var ra = na(Di, ki, ji),
    ia = na(Di, Pi, Fi),
    aa = {
        Enter: na(Ri, Vi, Hi, Wi),
        "Mod-Enter": Bi,
        Backspace: ra,
        "Mod-Backspace": ra,
        "Shift-Backspace": ra,
        Delete: ia,
        "Mod-Delete": ia,
        "Mod-a": Gi
    },
    oa = {
        "Ctrl-h": aa.Backspace,
        "Alt-Backspace": aa[`Mod-Backspace`],
        "Ctrl-d": aa.Delete,
        "Ctrl-Alt-Backspace": aa[`Mod-Delete`],
        "Alt-Delete": aa[`Mod-Delete`],
        "Alt-d": aa[`Mod-Delete`],
        "Ctrl-a": Yi,
        "Ctrl-e": Xi
    };
for (let e in aa) oa[e] = aa[e];
var sa = (typeof navigator < `u` ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : typeof os < `u` && os.platform && os.platform() == `darwin`) ? oa : aa,
    ca = 200,
    L = function() {};
L.prototype.append = function(e) {
    return e.length ? (e = L.from(e), !this.length && e || e.length < ca && this.leafAppend(e) || this.length < ca && e.leafPrepend(this) || this.appendInner(e)) : this
}, L.prototype.prepend = function(e) {
    return e.length ? L.from(e).append(this) : this
}, L.prototype.appendInner = function(e) {
    return new ua(this, e)
}, L.prototype.slice = function(e, t) {
    return e === void 0 && (e = 0), t === void 0 && (t = this.length), e >= t ? L.empty : this.sliceInner(Math.max(0, e), Math.min(this.length, t))
}, L.prototype.get = function(e) {
    if (!(e < 0 || e >= this.length)) return this.getInner(e)
}, L.prototype.forEach = function(e, t, n) {
    t === void 0 && (t = 0), n === void 0 && (n = this.length), t <= n ? this.forEachInner(e, t, n, 0) : this.forEachInvertedInner(e, t, n, 0)
}, L.prototype.map = function(e, t, n) {
    t === void 0 && (t = 0), n === void 0 && (n = this.length);
    var r = [];
    return this.forEach(function(t, n) {
        return r.push(e(t, n))
    }, t, n), r
}, L.from = function(e) {
    return e instanceof L ? e : e && e.length ? new la(e) : L.empty
};
var la = function(e) {
    function t(t) {
        e.call(this), this.values = t
    }
    e && (t.__proto__ = e), t.prototype = Object.create(e && e.prototype), t.prototype.constructor = t;
    var n = {
        length: {
            configurable: !0
        },
        depth: {
            configurable: !0
        }
    };
    return t.prototype.flatten = function() {
        return this.values
    }, t.prototype.sliceInner = function(e, n) {
        return e == 0 && n == this.length ? this : new t(this.values.slice(e, n))
    }, t.prototype.getInner = function(e) {
        return this.values[e]
    }, t.prototype.forEachInner = function(e, t, n, r) {
        for (var i = t; i < n; i++)
            if (e(this.values[i], r + i) === !1) return !1
    }, t.prototype.forEachInvertedInner = function(e, t, n, r) {
        for (var i = t - 1; i >= n; i--)
            if (e(this.values[i], r + i) === !1) return !1
    }, t.prototype.leafAppend = function(e) {
        if (this.length + e.length <= ca) return new t(this.values.concat(e.flatten()))
    }, t.prototype.leafPrepend = function(e) {
        if (this.length + e.length <= ca) return new t(e.flatten().concat(this.values))
    }, n.length.get = function() {
        return this.values.length
    }, n.depth.get = function() {
        return 0
    }, Object.defineProperties(t.prototype, n), t
}(L);
L.empty = new la([]);
var ua = function(e) {
        function t(t, n) {
            e.call(this), this.left = t, this.right = n, this.length = t.length + n.length, this.depth = Math.max(t.depth, n.depth) + 1
        }
        return e && (t.__proto__ = e), t.prototype = Object.create(e && e.prototype), t.prototype.constructor = t, t.prototype.flatten = function() {
            return this.left.flatten().concat(this.right.flatten())
        }, t.prototype.getInner = function(e) {
            return e < this.left.length ? this.left.get(e) : this.right.get(e - this.left.length)
        }, t.prototype.forEachInner = function(e, t, n, r) {
            var i = this.left.length;
            if (t < i && this.left.forEachInner(e, t, Math.min(n, i), r) === !1 || n > i && this.right.forEachInner(e, Math.max(t - i, 0), Math.min(this.length, n) - i, r + i) === !1) return !1
        }, t.prototype.forEachInvertedInner = function(e, t, n, r) {
            var i = this.left.length;
            if (t > i && this.right.forEachInvertedInner(e, t - i, Math.max(n, i) - i, r + i) === !1 || n < i && this.left.forEachInvertedInner(e, Math.min(t, i), n, r) === !1) return !1
        }, t.prototype.sliceInner = function(e, t) {
            if (e == 0 && t == this.length) return this;
            var n = this.left.length;
            return t <= n ? this.left.slice(e, t) : e >= n ? this.right.slice(e - n, t - n) : this.left.slice(e, n).append(this.right.slice(0, t - n))
        }, t.prototype.leafAppend = function(e) {
            var n = this.right.leafAppend(e);
            if (n) return new t(this.left, n)
        }, t.prototype.leafPrepend = function(e) {
            var n = this.left.leafPrepend(e);
            if (n) return new t(n, this.right)
        }, t.prototype.appendInner = function(e) {
            return this.left.depth >= Math.max(this.right.depth, e.depth) + 1 ? new t(this.left, new t(this.right, e)) : new t(this, e)
        }, t
    }(L),
    da = 500,
    fa = class e {
        constructor(e, t) {
            this.items = e, this.eventCount = t
        }
        popEvent(t, n) {
            if (this.eventCount == 0) return null;
            let r = this.items.length;
            for (;; r--)
                if (this.items.get(r - 1).selection) {
                    --r;
                    break
                }
            let i, a;
            n && (i = this.remapping(r, this.items.length), a = i.maps.length);
            let o = t.tr,
                s, c, l = [],
                u = [];
            return this.items.forEach((t, n) => {
                if (!t.step) {
                    i || (i = this.remapping(r, n + 1), a = i.maps.length), a--, u.push(t);
                    return
                }
                if (i) {
                    u.push(new ma(t.map));
                    let e = t.step.map(i.slice(a)),
                        n;
                    e && o.maybeStep(e).doc && (n = o.mapping.maps[o.mapping.maps.length - 1], l.push(new ma(n, void 0, void 0, l.length + u.length))), a--, n && i.appendMap(n, a)
                } else o.maybeStep(t.step);
                if (t.selection) return s = i ? t.selection.map(i.slice(a)) : t.selection, c = new e(this.items.slice(0, r).append(u.reverse().concat(l)), this.eventCount - 1), !1
            }, this.items.length, 0), {
                remaining: c,
                transform: o,
                selection: s
            }
        }
        addTransform(t, n, r, i) {
            let a = [],
                o = this.eventCount,
                s = this.items,
                c = !i && s.length ? s.get(s.length - 1) : null;
            for (let e = 0; e < t.steps.length; e++) {
                let r = t.steps[e].invert(t.docs[e]),
                    l = new ma(t.mapping.maps[e], r, n),
                    u;
                (u = c && c.merge(l)) && (l = u, e ? a.pop() : s = s.slice(0, s.length - 1)), a.push(l), n && = (o++, void 0), i || (c = l)
            }
            let l = o - r.depth;
            return l > ga && (s = pa(s, l), o -= l), new e(s.append(a), o)
        }
        remapping(e, t) {
            let n = new sr;
            return this.items.forEach((t, r) => {
                let i = t.mirrorOffset != null && r - t.mirrorOffset >= e ? n.maps.length - t.mirrorOffset : void 0;
                n.appendMap(t.map, i)
            }, e, t), n
        }
        addMaps(t) {
            return this.eventCount == 0 ? this : new e(this.items.append(t.map(e => new ma(e))), this.eventCount)
        }
        rebased(t, n) {
            if (!this.eventCount) return this;
            let r = [],
                i = Math.max(0, this.items.length - n),
                a = t.mapping,
                o = t.steps.length,
                s = this.eventCount;
            this.items.forEach(e => {
                e.selection && s--
            }, i);
            let c = n;
            this.items.forEach(e => {
                let n = a.getMirror(--c);
                if (n == null) return;
                o = Math.min(o, n);
                let i = a.maps[n];
                if (e.step) {
                    let o = t.steps[n].invert(t.docs[n]),
                        l = e.selection && e.selection.map(a.slice(c + 1, n));
                    l && s++, r.push(new ma(i, o, l))
                } else r.push(new ma(i))
            }, i);
            let l = [];
            for (let e = n; e < o; e++) l.push(new ma(a.maps[e]));
            let u = new e(this.items.slice(0, i).append(l).append(r), s);
            return u.emptyItemCount() > da && (u = u.compress(this.items.length - r.length)), u
        }
        emptyItemCount() {
            let e = 0;
            return this.items.forEach(t => {
                t.step || e++
            }), e
        }
        compress(t = this.items.length) {
            let n = this.remapping(0, t),
                r = n.maps.length,
                i = [],
                a = 0;
            return this.items.forEach((e, o) => {
                if (o >= t) i.push(e), e.selection && a++;
                else if (e.step) {
                    let t = e.step.map(n.slice(r)),
                        o = t && t.getMap();
                    if (r--, o && n.appendMap(o, r), t) {
                        let s = e.selection && e.selection.map(n.slice(r));
                        s && a++;
                        let c = new ma(o.invert(), t, s),
                            l, u = i.length - 1;
                        (l = i.length && i[u].merge(c)) ? i[u] = l: i.push(c)
                    }
                } else e.map && r--
            }, this.items.length, 0), new e(L.from(i.reverse()), a)
        }
    };
fa.empty = new fa(L.empty, 0);

function pa(e, t) {
    let n;
    return e.forEach((e, r) => {
        if (e.selection && t-- == 0) return n = r, !1
    }), e.slice(n)
}
var ma = class e {
        constructor(e, t, n, r) {
            this.map = e, this.step = t, this.selection = n, this.mirrorOffset = r
        }
        merge(t) {
            if (this.step && t.step && !t.selection) {
                let n = t.step.merge(this.step);
                if (n) return new e(n.getMap().invert(), n, this.selection)
            }
        }
    },
    ha = class {
        constructor(e, t, n, r, i) {
            this.done = e, this.undone = t, this.prevRanges = n, this.prevTime = r, this.prevComposition = i
        }
    },
    ga = 20;

function _a(e, t, n, r) {
    let i = n.getMeta(Ta),
        a;
    if (i) return i.historyState;
    n.getMeta(Ea) && (e = new ha(e.done, e.undone, null, 0, -1));
    let o = n.getMeta(`appendedTransaction`);
    if (n.steps.length == 0) return e;
    if (o && o.getMeta(Ta)) return o.getMeta(Ta).redo ? new ha(e.done.addTransform(n, void 0, r, wa(t)), e.undone, ya(n.mapping.maps), e.prevTime, e.prevComposition) : new ha(e.done, e.undone.addTransform(n, void 0, r, wa(t)), null, e.prevTime, e.prevComposition);
    if (n.getMeta(`addToHistory`) !== !1 && !(o && o.getMeta(`addToHistory`) === !1)) {
        let i = n.getMeta(`composition`),
            a = e.prevTime == 0 || !o && e.prevComposition != i && (e.prevTime < (n.time || 0) - r.newGroupDelay || !va(n, e.prevRanges)),
            s = o ? ba(e.prevRanges, n.mapping) : ya(n.mapping.maps);
        return new ha(e.done.addTransform(n, a ? t.selection.getBookmark() : void 0, r, wa(t)), fa.empty, s, n.time, i ? ? e.prevComposition)
    } else if (a = n.getMeta(`rebased`)) return new ha(e.done.rebased(n, a), e.undone.rebased(n, a), ba(e.prevRanges, n.mapping), e.prevTime, e.prevComposition);
    else return new ha(e.done.addMaps(n.mapping.maps), e.undone.addMaps(n.mapping.maps), ba(e.prevRanges, n.mapping), e.prevTime, e.prevComposition)
}

function va(e, t) {
    if (!t) return !1;
    if (!e.docChanged) return !0;
    let n = !1;
    return e.mapping.maps[0].forEach((e, r) => {
        for (let i = 0; i < t.length; i += 2) e <= t[i + 1] && r >= t[i] && (n = !0)
    }), n
}

function ya(e) {
    let t = [];
    for (let n = e.length - 1; n >= 0 && t.length == 0; n--) e[n].forEach((e, n, r, i) => t.push(r, i));
    return t
}

function ba(e, t) {
    if (!e) return null;
    let n = [];
    for (let r = 0; r < e.length; r += 2) {
        let i = t.map(e[r], 1),
            a = t.map(e[r + 1], -1);
        i <= a && n.push(i, a)
    }
    return n
}

function xa(e, t, n) {
    let r = wa(t),
        i = Ta.get(t).spec.config,
        a = (n ? e.undone : e.done).popEvent(t, r);
    if (!a) return null;
    let o = a.selection.resolve(a.transform.doc),
        s = (n ? e.done : e.undone).addTransform(a.transform, t.selection.getBookmark(), i, r),
        c = new ha(n ? s : a.remaining, n ? a.remaining : s, null, 0, -1);
    return a.transform.setSelection(o).setMeta(Ta, {
        redo: n,
        historyState: c
    })
}
var Sa = !1,
    Ca = null;

function wa(e) {
    let t = e.plugins;
    if (Ca != t) {
        Sa = !1, Ca = t;
        for (let e = 0; e < t.length; e++)
            if (t[e].spec.historyPreserveItems) {
                Sa = !0;
                break
            }
    }
    return Sa
}
var Ta = new Ei(`history`),
    Ea = new Ei(`closeHistory`);

function Da(e = {}) {
    return e = {
        depth: e.depth || 100,
        newGroupDelay: e.newGroupDelay || 500
    }, new Ci({
        key: Ta,
        state: {
            init() {
                return new ha(fa.empty, fa.empty, null, 0, -1)
            },
            apply(t, n, r) {
                return _a(n, r, t, e)
            }
        },
        config: e,
        props: {
            handleDOMEvents: {
                beforeinput(e, t) {
                    let n = t.inputType,
                        r = n == `historyUndo` ? ka : n == `historyRedo` ? Aa : null;
                    return !r || !e.editable ? !1 : (t.preventDefault(), r(e.state, e.dispatch))
                }
            }
        }
    })
}

function Oa(e, t) {
    return (n, r) => {
        let i = Ta.getState(n);
        if (!i || (e ? i.undone : i.done).eventCount == 0) return !1;
        if (r) {
            let a = xa(i, n, e);
            a && r(t ? a.scrollIntoView() : a)
        }
        return !0
    }
}
var ka = Oa(!1, !0),
    Aa = Oa(!0, !0),
    ja = class {
        constructor(e, t, n = {}) {
            this.match = e, this.match = e, this.handler = typeof t == `string` ? Ma(t) : t, this.undoable = n.undoable !== !1, this.inCode = n.inCode || !1, this.inCodeMark = n.inCodeMark !== !1
        }
    };

function Ma(e) {
    return function(t, n, r, i) {
        let a = e;
        if (n[1]) {
            let e = n[0].lastIndexOf(n[1]);
            a += n[0].slice(e + n[1].length), r += e;
            let t = r - i;
            t > 0 && (a = n[0].slice(e - t, e) + a, r = i)
        }
        return t.tr.insertText(a, r, i)
    }
}
var Na = 500;

function Pa({
    rules: e
}) {
    let t = new Ci({
        state: {
            init() {
                return null
            },
            apply(e, t) {
                return e.getMeta(this) || (e.selectionSet || e.docChanged ? null : t)
            }
        },
        props: {
            handleTextInput(n, r, i, a) {
                return Fa(n, r, i, a, e, t)
            },
            handleDOMEvents: {
                compositionend: n => {
                    setTimeout(() => {
                        let {
                            $cursor: r
                        } = n.state.selection;
                        r && Fa(n, r.pos, r.pos, ``, e, t)
                    })
                }
            }
        },
        isInputRules: !0
    });
    return t
}

function Fa(e, t, n, r, i, a) {
    if (e.composing) return !1;
    let o = e.state,
        s = o.doc.resolve(t),
        c = s.parent.textBetween(Math.max(0, s.parentOffset - Na), s.parentOffset, null, `￼`) + r;
    for (let l = 0; l < i.length; l++) {
        let u = i[l];
        if (!u.inCodeMark && s.marks().some(e => e.type.spec.code)) continue;
        if (s.parent.type.spec.code) {
            if (!u.inCode) continue
        } else if (u.inCode === `only`) continue;
        let d = u.match.exec(c);
        if (!d || d[0].length < r.length) continue;
        let f = t - (d[0].length - r.length);
        if (!u.inCodeMark) {
            let e = !1;
            if (o.doc.nodesBetween(f, s.pos, t => {
                    t.isInline && t.marks.some(e => e.type.spec.code) && (e = !0)
                }), e) continue
        }
        let p = u.handler(o, d, f, n);
        if (p) return u.undoable && p.setMeta(a, {
            transform: p,
            from: t,
            to: n,
            text: r
        }), e.dispatch(p), !0
    }
    return !1
}
var Ia = (e, t) => {
    let n = e.plugins;
    for (let r = 0; r < n.length; r++) {
        let i = n[r],
            a;
        if (i.spec.isInputRules && (a = i.getState(e))) {
            if (t) {
                let n = e.tr,
                    r = a.transform;
                for (let e = r.steps.length - 1; e >= 0; e--) n.step(r.steps[e].invert(r.docs[e]));
                if (a.text) {
                    let t = n.doc.resolve(a.from).marks();
                    n.replaceWith(a.from, a.to, e.schema.text(a.text, t))
                } else n.delete(a.from, a.to);
                t(n)
            }
            return !0
        }
    }
    return !1
};
new ja(/--$/, `—`, {
    inCodeMark: !1
}), new ja(/\.\.\.$/, `…`, {
    inCodeMark: !1
}), new ja(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/, `“`, {
    inCodeMark: !1
}), new ja(/"$/, `”`, {
    inCodeMark: !1
}), new ja(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/, `‘`, {
    inCodeMark: !1
}), new ja(/'$/, `’`, {
    inCodeMark: !1
});

function La(e, t, n = null, r) {
    return new ja(e, (e, i, a, o) => {
        let s = n instanceof Function ? n(i) : n,
            c = e.tr.delete(a, o),
            l = c.doc.resolve(a).blockRange(),
            u = l && xr(l, t, s);
        if (!u) return null;
        c.wrap(l, u);
        let d = c.doc.resolve(a - 1).nodeBefore;
        return d && d.type == t && Nr(c.doc, a - 1) && (!r || r(i, d)) && c.join(a - 1), c
    })
}

function Ra(e, t, n = null) {
    return new ja(e, (e, r, i, a) => {
        let o = e.doc.resolve(i),
            s = n instanceof Function ? n(r) : n;
        return o.node(-1).canReplaceWith(o.index(-1), o.indexAfter(-1), t) ? e.tr.delete(i, a).setBlockType(i, i, t, s) : null
    })
}
for (var za = {
        8: `Backspace`,
        9: `Tab`,
        10: `Enter`,
        12: `NumLock`,
        13: `Enter`,
        16: `Shift`,
        17: `Control`,
        18: `Alt`,
        20: `CapsLock`,
        27: `Escape`,
        32: ` `,
        33: `PageUp`,
        34: `PageDown`,
        35: `End`,
        36: `Home`,
        37: `ArrowLeft`,
        38: `ArrowUp`,
        39: `ArrowRight`,
        40: `ArrowDown`,
        44: `PrintScreen`,
        45: `Insert`,
        46: `Delete`,
        59: `;`,
        61: `=`,
        91: `Meta`,
        92: `Meta`,
        106: `*`,
        107: `+`,
        108: `,`,
        109: `-`,
        110: `.`,
        111: `/`,
        144: `NumLock`,
        145: `ScrollLock`,
        160: `Shift`,
        161: `Shift`,
        162: `Control`,
        163: `Control`,
        164: `Alt`,
        165: `Alt`,
        173: `-`,
        186: `;`,
        187: `=`,
        188: `,`,
        189: `-`,
        190: `.`,
        191: `/`,
        192: "`",
        219: `[`,
        220: `\\`,
        221: `]`,
        222: `'`
    }, Ba = {
        48: `)`,
        49: `!`,
        50: `@`,
        51: `#`,
        52: `$`,
        53: `%`,
        54: `^`,
        55: `&`,
        56: `*`,
        57: `(`,
        59: `:`,
        61: `+`,
        173: `_`,
        186: `:`,
        187: `+`,
        188: `<`,
        189: `_`,
        190: `>`,
        191: `?`,
        192: `~`,
        219: `{`,
        220: `|`,
        221: `}`,
        222: `"`
    }, Va = typeof navigator < `u` && /Mac/.test(navigator.platform), Ha = typeof navigator < `u` && /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent), R = 0; R < 10; R++) za[48 + R] = za[96 + R] = String(R);
for (var R = 1; R <= 24; R++) za[R + 111] = `F` + R;
for (var R = 65; R <= 90; R++) za[R] = String.fromCharCode(R + 32), Ba[R] = String.fromCharCode(R);
for (var Ua in za) Ba.hasOwnProperty(Ua) || (Ba[Ua] = za[Ua]);

function Wa(e) {
    var t = !(Va && e.metaKey && e.shiftKey && !e.ctrlKey && !e.altKey || Ha && e.shiftKey && e.key && e.key.length == 1 || e.key == `Unidentified`) && e.key || (e.shiftKey ? Ba : za)[e.keyCode] || e.key || `Unidentified`;
    return t == `Esc` && (t = `Escape`), t == `Del` && (t = `Delete`), t == `Left` && (t = `ArrowLeft`), t == `Up` && (t = `ArrowUp`), t == `Right` && (t = `ArrowRight`), t == `Down` && (t = `ArrowDown`), t
}
var Ga = typeof navigator < `u` && /Mac|iP(hone|[oa]d)/.test(navigator.platform),
    Ka = typeof navigator < `u` && /Win/.test(navigator.platform);

function qa(e) {
    let t = e.split(/-(?!$)/),
        n = t[t.length - 1];
    n == `Space` && (n = ` `);
    let r, i, a, o;
    for (let e = 0; e < t.length - 1; e++) {
        let n = t[e];
        if (/^(cmd|meta|m)$/i.test(n)) o = !0;
        else if (/^a(lt)?$/i.test(n)) r = !0;
        else if (/^(c|ctrl|control)$/i.test(n)) i = !0;
        else if (/^s(hift)?$/i.test(n)) a = !0;
        else if (/^mod$/i.test(n)) Ga ? o = !0 : i = !0;
        else throw Error(`Unrecognized modifier name: ` + n)
    }
    return r && (n = `Alt-` + n), i && (n = `Ctrl-` + n), o && (n = `Meta-` + n), a && (n = `Shift-` + n), n
}

function Ja(e) {
    let t = Object.create(null);
    for (let n in e) t[qa(n)] = e[n];
    return t
}

function Ya(e, t, n = !0) {
    return t.altKey && (e = `Alt-` + e), t.ctrlKey && (e = `Ctrl-` + e), t.metaKey && (e = `Meta-` + e), n && t.shiftKey && (e = `Shift-` + e), e
}

function Xa(e) {
    return new Ci({
        props: {
            handleKeyDown: Za(e)
        }
    })
}

function Za(e) {
    let t = Ja(e);
    return function(e, n) {
        let r = Wa(n),
            i, a = t[Ya(r, n)];
        if (a && a(e.state, e.dispatch, e)) return !0;
        if (r.length == 1 && r != ` `) {
            if (n.shiftKey) {
                let i = t[Ya(r, n, !1)];
                if (i && i(e.state, e.dispatch, e)) return !0
            }
            if ((n.altKey || n.metaKey || n.ctrlKey) && !(Ka && n.ctrlKey && n.altKey) && (i = za[n.keyCode]) && i != r) {
                let r = t[Ya(i, n)];
                if (r && r(e.state, e.dispatch, e)) return !0
            }
        }
        return !1
    }
}
var z = function(e) {
        for (var t = 0;; t++)
            if (e = e.previousSibling, !e) return t
    },
    Qa = function(e) {
        let t = e.assignedSlot || e.parentNode;
        return t && t.nodeType == 11 ? t.host : t
    },
    $a = null,
    eo = function(e, t, n) {
        let r = $a || = document.createRange();
        return r.setEnd(e, n ? ? e.nodeValue.length), r.setStart(e, t || 0), r
    },
    to = function() {
        $a = null
    },
    no = function(e, t, n, r) {
        return n && (io(e, t, n, r, -1) || io(e, t, n, r, 1))
    },
    ro = /^(img|br|input|textarea|hr)$/i;

function io(e, t, n, r, i) {
    for (;;) {
        if (e == n && t == r) return !0;
        if (t == (i < 0 ? 0 : B(e))) {
            let n = e.parentNode;
            if (!n || n.nodeType != 1 || co(e) || ro.test(e.nodeName) || e.contentEditable == `false`) return !1;
            t = z(e) + (i < 0 ? 0 : 1), e = n
        } else if (e.nodeType == 1) {
            let n = e.childNodes[t + (i < 0 ? -1 : 0)];
            if (n.nodeType == 1 && n.contentEditable == `false`)
                if (n.pmViewDesc ? .ignoreForSelection) t += i;
                else return !1;
            else e = n, t = i < 0 ? B(e) : 0
        } else return !1
    }
}

function B(e) {
    return e.nodeType == 3 ? e.nodeValue.length : e.childNodes.length
}

function ao(e, t) {
    for (;;) {
        if (e.nodeType == 3 && t) return e;
        if (e.nodeType == 1 && t > 0) {
            if (e.contentEditable == `false`) return null;
            e = e.childNodes[t - 1], t = B(e)
        } else if (e.parentNode && !co(e)) t = z(e), e = e.parentNode;
        else return null
    }
}

function oo(e, t) {
    for (;;) {
        if (e.nodeType == 3 && t < e.nodeValue.length) return e;
        if (e.nodeType == 1 && t < e.childNodes.length) {
            if (e.contentEditable == `false`) return null;
            e = e.childNodes[t], t = 0
        } else if (e.parentNode && !co(e)) t = z(e) + 1, e = e.parentNode;
        else return null
    }
}

function so(e, t, n) {
    for (let r = t == 0, i = t == B(e); r || i;) {
        if (e == n) return !0;
        let t = z(e);
        if (e = e.parentNode, !e) return !1;
        r && = t == 0, i && = t == B(e)
    }
}

function co(e) {
    let t;
    for (let n = e; n && !(t = n.pmViewDesc); n = n.parentNode);
    return t && t.node && t.node.isBlock && (t.dom == e || t.contentDOM == e)
}
var lo = function(e) {
    return e.focusNode && no(e.focusNode, e.focusOffset, e.anchorNode, e.anchorOffset)
};

function uo(e, t) {
    let n = document.createEvent(`Event`);
    return n.initEvent(`keydown`, !0, !0), n.keyCode = e, n.key = n.code = t, n
}

function fo(e) {
    let t = e.activeElement;
    for (; t && t.shadowRoot;) t = t.shadowRoot.activeElement;
    return t
}

function po(e, t, n) {
    if (e.caretPositionFromPoint) try {
        let r = e.caretPositionFromPoint(t, n);
        if (r) return {
            node: r.offsetNode,
            offset: Math.min(B(r.offsetNode), r.offset)
        }
    } catch {}
    if (e.caretRangeFromPoint) {
        let r = e.caretRangeFromPoint(t, n);
        if (r) return {
            node: r.startContainer,
            offset: Math.min(B(r.startContainer), r.startOffset)
        }
    }
}
var V = typeof navigator < `u` ? navigator : null,
    mo = typeof document < `u` ? document : null,
    ho = V && V.userAgent || ``,
    go = /Edge\/(\d+)/.exec(ho),
    _o = /MSIE \d/.exec(ho),
    vo = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(ho),
    H = !!(_o || vo || go),
    yo = _o ? document.documentMode : vo ? +vo[1] : go ? +go[1] : 0,
    U = !H && /gecko\/(\d+)/i.test(ho);
U && +(/Firefox\/(\d+)/.exec(ho) || [0, 0])[1];
var bo = !H && /Chrome\/(\d+)/.exec(ho),
    W = !!bo,
    xo = bo ? +bo[1] : 0,
    G = !H && !!V && /Apple Computer/.test(V.vendor),
    So = G && (/Mobile\/\w+/.test(ho) || !!V && V.maxTouchPoints > 2),
    K = So || (V ? /Mac/.test(V.platform) : !1),
    Co = V ? /Win/.test(V.platform) : !1,
    wo = /Android \d/.test(ho),
    To = !!mo && `webkitFontSmoothing` in mo.documentElement.style,
    Eo = To ? +(/\bAppleWebKit\/(\d+)/.exec(navigator.userAgent) || [0, 0])[1] : 0;

function Do(e) {
    let t = e.defaultView && e.defaultView.visualViewport;
    return t ? {
        left: 0,
        right: t.width,
        top: 0,
        bottom: t.height
    } : {
        left: 0,
        right: e.documentElement.clientWidth,
        top: 0,
        bottom: e.documentElement.clientHeight
    }
}

function Oo(e, t) {
    return typeof e == `number` ? e : e[t]
}

function ko(e) {
    let t = e.getBoundingClientRect(),
        n = t.width / e.offsetWidth || 1,
        r = t.height / e.offsetHeight || 1;
    return {
        left: t.left,
        right: t.left + e.clientWidth * n,
        top: t.top,
        bottom: t.top + e.clientHeight * r
    }
}

function Ao(e, t, n) {
    let r = e.someProp(`scrollThreshold`) || 0,
        i = e.someProp(`scrollMargin`) || 5,
        a = e.dom.ownerDocument;
    for (let o = n || e.dom; o;) {
        if (o.nodeType != 1) {
            o = Qa(o);
            continue
        }
        let e = o,
            n = e == a.body,
            s = n ? Do(a) : ko(e),
            c = 0,
            l = 0;
        if (t.top < s.top + Oo(r, `top`) ? l = -(s.top - t.top + Oo(i, `top`)) : t.bottom > s.bottom - Oo(r, `bottom`) && (l = t.bottom - t.top > s.bottom - s.top ? t.top + Oo(i, `top`) - s.top : t.bottom - s.bottom + Oo(i, `bottom`)), t.left < s.left + Oo(r, `left`) ? c = -(s.left - t.left + Oo(i, `left`)) : t.right > s.right - Oo(r, `right`) && (c = t.right - s.right + Oo(i, `right`)), c || l)
            if (n) a.defaultView.scrollBy(c, l);
            else {
                let n = e.scrollLeft,
                    r = e.scrollTop;
                l && (e.scrollTop += l), c && (e.scrollLeft += c);
                let i = e.scrollLeft - n,
                    a = e.scrollTop - r;
                t = {
                    left: t.left - i,
                    top: t.top - a,
                    right: t.right - i,
                    bottom: t.bottom - a
                }
            }
        let u = n ? `fixed` : getComputedStyle(o).position;
        if (/^(fixed|sticky)$/.test(u)) break;
        o = u == `absolute` ? o.offsetParent : Qa(o)
    }
}

function jo(e) {
    let t = e.dom.getBoundingClientRect(),
        n = Math.max(0, t.top),
        r, i;
    for (let a = (t.left + t.right) / 2, o = n + 1; o < Math.min(innerHeight, t.bottom); o += 5) {
        let t = e.root.elementFromPoint(a, o);
        if (!t || t == e.dom || !e.dom.contains(t)) continue;
        let s = t.getBoundingClientRect();
        if (s.top >= n - 20) {
            r = t, i = s.top;
            break
        }
    }
    return {
        refDOM: r,
        refTop: i,
        stack: Mo(e.dom)
    }
}

function Mo(e) {
    let t = [],
        n = e.ownerDocument;
    for (let r = e; r && (t.push({
            dom: r,
            top: r.scrollTop,
            left: r.scrollLeft
        }), e != n); r = Qa(r));
    return t
}

function No({
    refDOM: e,
    refTop: t,
    stack: n
}) {
    let r = e ? e.getBoundingClientRect().top : 0;
    Po(n, r == 0 ? 0 : r - t)
}

function Po(e, t) {
    for (let n = 0; n < e.length; n++) {
        let {
            dom: r,
            top: i,
            left: a
        } = e[n];
        r.scrollTop != i + t && (r.scrollTop = i + t), r.scrollLeft != a && (r.scrollLeft = a)
    }
}
var Fo = null;

function Io(e) {
    if (e.setActive) return e.setActive();
    if (Fo) return e.focus(Fo);
    let t = Mo(e);
    e.focus(Fo == null ? {
        get preventScroll() {
            return Fo = {
                preventScroll: !0
            }, !0
        }
    } : void 0), Fo || (Fo = !1, Po(t, 0))
}

function Lo(e, t) {
    let n, r = 2e8,
        i, a = 0,
        o = t.top,
        s = t.top,
        c, l;
    for (let u = e.firstChild, d = 0; u; u = u.nextSibling, d++) {
        let e;
        if (u.nodeType == 1) e = u.getClientRects();
        else if (u.nodeType == 3) e = eo(u).getClientRects();
        else continue;
        for (let f = 0; f < e.length; f++) {
            let p = e[f];
            if (p.top <= o && p.bottom >= s) {
                o = Math.max(p.bottom, o), s = Math.min(p.top, s);
                let e = p.left > t.left ? p.left - t.left : p.right < t.left ? t.left - p.right : 0;
                if (e < r) {
                    n = u, r = e, i = e && n.nodeType == 3 ? {
                        left: p.right < t.left ? p.right : p.left,
                        top: t.top
                    } : t, u.nodeType == 1 && e && (a = d + +(t.left >= (p.left + p.right) / 2));
                    continue
                }
            } else p.top > t.top && !c && p.left <= t.left && p.right >= t.left && (c = u, l = {
                left: Math.max(p.left, Math.min(p.right, t.left)),
                top: p.top
            });
            !n && (t.left >= p.right && t.top >= p.top || t.left >= p.left && t.top >= p.bottom) && (a = d + 1)
        }
    }
    return !n && c && (n = c, i = l, r = 0), n && n.nodeType == 3 ? Ro(n, i) : !n || r && n.nodeType == 1 ? {
        node: e,
        offset: a
    } : Lo(n, i)
}

function Ro(e, t) {
    let n = e.nodeValue.length,
        r = document.createRange(),
        i;
    for (let a = 0; a < n; a++) {
        r.setEnd(e, a + 1), r.setStart(e, a);
        let n = Ko(r, 1);
        if (n.top != n.bottom && zo(t, n)) {
            i = {
                node: e,
                offset: a + +(t.left >= (n.left + n.right) / 2)
            };
            break
        }
    }
    return r.detach(), i || {
        node: e,
        offset: 0
    }
}

function zo(e, t) {
    return e.left >= t.left - 1 && e.left <= t.right + 1 && e.top >= t.top - 1 && e.top <= t.bottom + 1
}

function Bo(e, t) {
    let n = e.parentNode;
    return n && /^li$/i.test(n.nodeName) && t.left < e.getBoundingClientRect().left ? n : e
}

function Vo(e, t, n) {
    let {
        node: r,
        offset: i
    } = Lo(t, n), a = -1;
    if (r.nodeType == 1 && !r.firstChild) {
        let e = r.getBoundingClientRect();
        a = e.left != e.right && n.left > (e.left + e.right) / 2 ? 1 : -1
    }
    return e.docView.posFromDOM(r, i, a)
}

function Ho(e, t, n, r) {
    let i = -1;
    for (let n = t, a = !1; n != e.dom;) {
        let t = e.docView.nearestDesc(n, !0),
            o;
        if (!t) return null;
        if (t.dom.nodeType == 1 && (t.node.isBlock && t.parent || !t.contentDOM) && ((o = t.dom.getBoundingClientRect()).width || o.height) && (t.node.isBlock && t.parent && !/^T(R|BODY|HEAD|FOOT)$/.test(t.dom.nodeName) && (!a && o.left > r.left || o.top > r.top ? i = t.posBefore : (!a && o.right < r.left || o.bottom < r.top) && (i = t.posAfter), a = !0), !t.contentDOM && i < 0 && !t.node.isText)) return (t.node.isBlock ? r.top < (o.top + o.bottom) / 2 : r.left < (o.left + o.right) / 2) ? t.posBefore : t.posAfter;
        n = t.dom.parentNode
    }
    return i > -1 ? i : e.docView.posFromDOM(t, n, -1)
}

function Uo(e, t, n) {
    let r = e.childNodes.length;
    if (r && n.top < n.bottom)
        for (let i = Math.max(0, Math.min(r - 1, Math.floor(r * (t.top - n.top) / (n.bottom - n.top)) - 2)), a = i;;) {
            let n = e.childNodes[a];
            if (n.nodeType == 1) {
                let e = n.getClientRects();
                for (let r = 0; r < e.length; r++) {
                    let i = e[r];
                    if (zo(t, i)) return Uo(n, t, i)
                }
            }
            if ((a = (a + 1) % r) == i) break
        }
    return e
}

function Wo(e, t) {
    let n = e.dom.ownerDocument,
        r, i = 0,
        a = po(n, t.left, t.top);
    a && ({
        node: r,
        offset: i
    } = a);
    let o = (e.root.elementFromPoint ? e.root : n).elementFromPoint(t.left, t.top),
        s;
    if (!o || !e.dom.contains(o.nodeType == 1 ? o : o.parentNode)) {
        let n = e.dom.getBoundingClientRect();
        if (!zo(t, n) || (o = Uo(e.dom, t, n), !o)) return null
    }
    if (G)
        for (let e = o; r && e; e = Qa(e)) e.draggable && (r = void 0);
    if (o = Bo(o, t), r) {
        if (U && r.nodeType == 1 && (i = Math.min(i, r.childNodes.length), i < r.childNodes.length)) {
            let e = r.childNodes[i],
                n;
            e.nodeName == `IMG` && (n = e.getBoundingClientRect()).right <= t.left && n.bottom > t.top && i++
        }
        let n;
        To && i && r.nodeType == 1 && (n = r.childNodes[i - 1]).nodeType == 1 && n.contentEditable == `false` && n.getBoundingClientRect().top >= t.top && i--, r == e.dom && i == r.childNodes.length - 1 && r.lastChild.nodeType == 1 && t.top > r.lastChild.getBoundingClientRect().bottom ? s = e.state.doc.content.size : (i == 0 || r.nodeType != 1 || r.childNodes[i - 1].nodeName != `BR`) && (s = Ho(e, r, i, t))
    }
    s ? ? = Vo(e, o, t);
    let c = e.docView.nearestDesc(o, !0);
    return {
        pos: s,
        inside: c ? c.posAtStart - c.border : -1
    }
}

function Go(e) {
    return e.top < e.bottom || e.left < e.right
}

function Ko(e, t) {
    let n = e.getClientRects();
    if (n.length) {
        let e = n[t < 0 ? 0 : n.length - 1];
        if (Go(e)) return e
    }
    return Array.prototype.find.call(n, Go) || e.getBoundingClientRect()
}
var qo = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;

function Jo(e, t, n) {
    let {
        node: r,
        offset: i,
        atom: a
    } = e.docView.domFromPos(t, n < 0 ? -1 : 1), o = To || U;
    if (r.nodeType == 3)
        if (o && (qo.test(r.nodeValue) || (n < 0 ? !i : i == r.nodeValue.length))) {
            let e = Ko(eo(r, i, i), n);
            if (U && i && /\s/.test(r.nodeValue[i - 1]) && i < r.nodeValue.length) {
                let t = Ko(eo(r, i - 1, i - 1), -1);
                if (t.top == e.top) {
                    let n = Ko(eo(r, i, i + 1), -1);
                    if (n.top != e.top) return Yo(n, n.left < t.left)
                }
            }
            return e
        } else {
            let e = i,
                t = i,
                a = n < 0 ? 1 : -1;
            return n < 0 && !i ? (t++, a = -1) : n >= 0 && i == r.nodeValue.length ? (e--, a = 1) : n < 0 ? e-- : t++, Yo(Ko(eo(r, e, t), a), a < 0)
        }
    if (!e.state.doc.resolve(t - (a || 0)).parent.inlineContent) {
        if (a == null && i && (n < 0 || i == B(r))) {
            let e = r.childNodes[i - 1];
            if (e.nodeType == 1) return Xo(e.getBoundingClientRect(), !1)
        }
        if (a == null && i < B(r)) {
            let e = r.childNodes[i];
            if (e.nodeType == 1) return Xo(e.getBoundingClientRect(), !0)
        }
        return Xo(r.getBoundingClientRect(), n >= 0)
    }
    if (a == null && i && (n < 0 || i == B(r))) {
        let e = r.childNodes[i - 1],
            t = e.nodeType == 3 ? eo(e, B(e) - +!o) : e.nodeType == 1 && (e.nodeName != `BR` || !e.nextSibling) ? e : null;
        if (t) return Yo(Ko(t, 1), !1)
    }
    if (a == null && i < B(r)) {
        let e = r.childNodes[i];
        for (; e.pmViewDesc && e.pmViewDesc.ignoreForCoords;) e = e.nextSibling;
        let t = e ? e.nodeType == 3 ? eo(e, 0, +!o) : e.nodeType == 1 ? e : null : null;
        if (t) return Yo(Ko(t, -1), !0)
    }
    return Yo(Ko(r.nodeType == 3 ? eo(r) : r, -n), n >= 0)
}

function Yo(e, t) {
    if (e.width == 0) return e;
    let n = t ? e.left : e.right;
    return {
        top: e.top,
        bottom: e.bottom,
        left: n,
        right: n
    }
}

function Xo(e, t) {
    if (e.height == 0) return e;
    let n = t ? e.top : e.bottom;
    return {
        top: n,
        bottom: n,
        left: e.left,
        right: e.right
    }
}

function Zo(e, t, n) {
    let r = e.state,
        i = e.root.activeElement;
    r != t && e.updateState(t), i != e.dom && e.focus();
    try {
        return n()
    } finally {
        r != t && e.updateState(r), i != e.dom && i && i.focus()
    }
}

function Qo(e, t, n) {
    let r = t.selection,
        i = n == `up` ? r.$from : r.$to;
    return Zo(e, t, () => {
        let {
            node: t
        } = e.docView.domFromPos(i.pos, n == `up` ? -1 : 1);
        for (;;) {
            let n = e.docView.nearestDesc(t, !0);
            if (!n) break;
            if (n.node.isBlock) {
                t = n.contentDOM || n.dom;
                break
            }
            t = n.dom.parentNode
        }
        let r = Jo(e, i.pos, 1);
        for (let e = t.firstChild; e; e = e.nextSibling) {
            let t;
            if (e.nodeType == 1) t = e.getClientRects();
            else if (e.nodeType == 3) t = eo(e, 0, e.nodeValue.length).getClientRects();
            else continue;
            for (let e = 0; e < t.length; e++) {
                let i = t[e];
                if (i.bottom > i.top + 1 && (n == `up` ? r.top - i.top > (i.bottom - r.top) * 2 : i.bottom - r.bottom > (r.bottom - i.top) * 2)) return !1
            }
        }
        return !0
    })
}
var $o = /[\u0590-\u08ac]/;

function es(e, t, n) {
    let {
        $head: r
    } = t.selection;
    if (!r.parent.isTextblock) return !1;
    let i = r.parentOffset,
        a = !i,
        o = i == r.parent.content.size,
        s = e.domSelection();
    return s ? !$o.test(r.parent.textContent) || !s.modify ? n == `left` || n == `backward` ? a : o : Zo(e, t, () => {
        let {
            focusNode: t,
            focusOffset: i,
            anchorNode: a,
            anchorOffset: o
        } = e.domSelectionRange(), c = s.caretBidiLevel;
        s.modify(`move`, n, `character`);
        let l = r.depth ? e.docView.domAfterPos(r.before()) : e.dom,
            {
                focusNode: u,
                focusOffset: d
            } = e.domSelectionRange(),
            f = u && !l.contains(u.nodeType == 1 ? u : u.parentNode) || t == u && i == d;
        try {
            s.collapse(a, o), t && (t != a || i != o) && s.extend && s.extend(t, i)
        } catch {}
        return c != null && (s.caretBidiLevel = c), f
    }) : r.pos == r.start() || r.pos == r.end()
}
var ts = null,
    ns = null,
    rs = !1;

function is(e, t, n) {
    return ts == t && ns == n ? rs : (ts = t, ns = n, rs = n == `up` || n == `down` ? Qo(e, t, n) : es(e, t, n))
}
var q = 0,
    as = 1,
    ss = 2,
    J = 3,
    cs = class {
        constructor(e, t, n, r) {
            this.parent = e, this.children = t, this.dom = n, this.contentDOM = r, this.dirty = q, n.pmViewDesc = this
        }
        matchesWidget(e) {
            return !1
        }
        matchesMark(e) {
            return !1
        }
        matchesNode(e, t, n) {
            return !1
        }
        matchesHack(e) {
            return !1
        }
        parseRule() {
            return null
        }
        stopEvent(e) {
            return !1
        }
        get size() {
            let e = 0;
            for (let t = 0; t < this.children.length; t++) e += this.children[t].size;
            return e
        }
        get border() {
            return 0
        }
        destroy() {
            this.parent = void 0, this.dom.pmViewDesc == this && (this.dom.pmViewDesc = void 0);
            for (let e = 0; e < this.children.length; e++) this.children[e].destroy()
        }
        posBeforeChild(e) {
            for (let t = 0, n = this.posAtStart;; t++) {
                let r = this.children[t];
                if (r == e) return n;
                n += r.size
            }
        }
        get posBefore() {
            return this.parent.posBeforeChild(this)
        }
        get posAtStart() {
            return this.parent ? this.parent.posBeforeChild(this) + this.border : 0
        }
        get posAfter() {
            return this.posBefore + this.size
        }
        get posAtEnd() {
            return this.posAtStart + this.size - 2 * this.border
        }
        localPosFromDOM(e, t, n) {
            if (this.contentDOM && this.contentDOM.contains(e.nodeType == 1 ? e : e.parentNode))
                if (n < 0) {
                    let n, r;
                    if (e == this.contentDOM) n = e.childNodes[t - 1];
                    else {
                        for (; e.parentNode != this.contentDOM;) e = e.parentNode;
                        n = e.previousSibling
                    }
                    for (; n && !((r = n.pmViewDesc) && r.parent == this);) n = n.previousSibling;
                    return n ? this.posBeforeChild(r) + r.size : this.posAtStart
                } else {
                    let n, r;
                    if (e == this.contentDOM) n = e.childNodes[t];
                    else {
                        for (; e.parentNode != this.contentDOM;) e = e.parentNode;
                        n = e.nextSibling
                    }
                    for (; n && !((r = n.pmViewDesc) && r.parent == this);) n = n.nextSibling;
                    return n ? this.posBeforeChild(r) : this.posAtEnd
                }
            let r;
            if (e == this.dom && this.contentDOM) r = t > z(this.contentDOM);
            else if (this.contentDOM && this.contentDOM != this.dom && this.dom.contains(this.contentDOM)) r = e.compareDocumentPosition(this.contentDOM) & 2;
            else if (this.dom.firstChild) {
                if (t == 0)
                    for (let t = e;; t = t.parentNode) {
                        if (t == this.dom) {
                            r = !1;
                            break
                        }
                        if (t.previousSibling) break
                    }
                if (r == null && t == e.childNodes.length)
                    for (let t = e;; t = t.parentNode) {
                        if (t == this.dom) {
                            r = !0;
                            break
                        }
                        if (t.nextSibling) break
                    }
            }
            return r ? ? n > 0 ? this.posAtEnd : this.posAtStart
        }
        nearestDesc(e, t = !1) {
            for (let n = !0, r = e; r; r = r.parentNode) {
                let i = this.getDesc(r),
                    a;
                if (i && (!t || i.node))
                    if (n && (a = i.nodeDOM) && !(a.nodeType == 1 ? a.contains(e.nodeType == 1 ? e : e.parentNode) : a == e)) n = !1;
                    else return i
            }
        }
        getDesc(e) {
            let t = e.pmViewDesc;
            for (let e = t; e; e = e.parent)
                if (e == this) return t
        }
        posFromDOM(e, t, n) {
            for (let r = e; r; r = r.parentNode) {
                let i = this.getDesc(r);
                if (i) return i.localPosFromDOM(e, t, n)
            }
            return -1
        }
        descAt(e) {
            for (let t = 0, n = 0; t < this.children.length; t++) {
                let r = this.children[t],
                    i = n + r.size;
                if (n == e && i != n) {
                    for (; !r.border && r.children.length;)
                        for (let e = 0; e < r.children.length; e++) {
                            let t = r.children[e];
                            if (t.size) {
                                r = t;
                                break
                            }
                        }
                    return r
                }
                if (e < i) return r.descAt(e - n - r.border);
                n = i
            }
        }
        domFromPos(e, t) {
            if (!this.contentDOM) return {
                node: this.dom,
                offset: 0,
                atom: e + 1
            };
            let n = 0,
                r = 0;
            for (let t = 0; n < this.children.length; n++) {
                let i = this.children[n],
                    a = t + i.size;
                if (a > e || i instanceof hs) {
                    r = e - t;
                    break
                }
                t = a
            }
            if (r) return this.children[n].domFromPos(r - this.children[n].border, t);
            for (let e; n && !(e = this.children[n - 1]).size && e instanceof ls && e.side >= 0; n--);
            if (t <= 0) {
                let e, r = !0;
                for (; e = n ? this.children[n - 1] : null, !(!e || e.dom.parentNode == this.contentDOM); n--, r = !1);
                return e && t && r && !e.border && !e.domAtom ? e.domFromPos(e.size, t) : {
                    node: this.contentDOM,
                    offset: e ? z(e.dom) + 1 : 0
                }
            } else {
                let e, r = !0;
                for (; e = n < this.children.length ? this.children[n] : null, !(!e || e.dom.parentNode == this.contentDOM); n++, r = !1);
                return e && r && !e.border && !e.domAtom ? e.domFromPos(0, t) : {
                    node: this.contentDOM,
                    offset: e ? z(e.dom) : this.contentDOM.childNodes.length
                }
            }
        }
        parseRange(e, t, n = 0) {
            if (this.children.length == 0) return {
                node: this.contentDOM,
                from: e,
                to: t,
                fromOffset: 0,
                toOffset: this.contentDOM.childNodes.length
            };
            let r = -1,
                i = -1;
            for (let a = n, o = 0;; o++) {
                let n = this.children[o],
                    s = a + n.size;
                if (r == -1 && e <= s) {
                    let i = a + n.border;
                    if (e >= i && t <= s - n.border && n.node && n.contentDOM && this.contentDOM.contains(n.contentDOM)) return n.parseRange(e, t, i);
                    e = a;
                    for (let t = o; t > 0; t--) {
                        let n = this.children[t - 1];
                        if (n.size && n.dom.parentNode == this.contentDOM && !n.emptyChildAt(1)) {
                            r = z(n.dom) + 1;
                            break
                        }
                        e -= n.size
                    }
                    r == -1 && (r = 0)
                }
                if (r > -1 && (s > t || o == this.children.length - 1)) {
                    t = s;
                    for (let e = o + 1; e < this.children.length; e++) {
                        let n = this.children[e];
                        if (n.size && n.dom.parentNode == this.contentDOM && !n.emptyChildAt(-1)) {
                            i = z(n.dom);
                            break
                        }
                        t += n.size
                    }
                    i == -1 && (i = this.contentDOM.childNodes.length);
                    break
                }
                a = s
            }
            return {
                node: this.contentDOM,
                from: e,
                to: t,
                fromOffset: r,
                toOffset: i
            }
        }
        emptyChildAt(e) {
            if (this.border || !this.contentDOM || !this.children.length) return !1;
            let t = this.children[e < 0 ? 0 : this.children.length - 1];
            return t.size == 0 || t.emptyChildAt(e)
        }
        domAfterPos(e) {
            let {
                node: t,
                offset: n
            } = this.domFromPos(e, 0);
            if (t.nodeType != 1 || n == t.childNodes.length) throw RangeError(`No node after pos ` + e);
            return t.childNodes[n]
        }
        setSelection(e, t, n, r = !1) {
            let i = Math.min(e, t),
                a = Math.max(e, t);
            for (let o = 0, s = 0; o < this.children.length; o++) {
                let c = this.children[o],
                    l = s + c.size;
                if (i > s && a < l) return c.setSelection(e - s - c.border, t - s - c.border, n, r);
                s = l
            }
            let o = this.domFromPos(e, e ? -1 : 1),
                s = t == e ? o : this.domFromPos(t, t ? -1 : 1),
                c = n.root.getSelection(),
                l = n.domSelectionRange(),
                u = !1;
            if ((U || G) && e == t) {
                let {
                    node: e,
                    offset: t
                } = o;
                if (e.nodeType == 3) {
                    if (u = !!(t && e.nodeValue[t - 1] == `
`), u && t == e.nodeValue.length)
                        for (let t = e, n; t; t = t.parentNode) {
                            if (n = t.nextSibling) {
                                n.nodeName == `BR` && (o = s = {
                                    node: n.parentNode,
                                    offset: z(n) + 1
                                });
                                break
                            }
                            let e = t.pmViewDesc;
                            if (e && e.node && e.node.isBlock) break
                        }
                } else {
                    let n = e.childNodes[t - 1];
                    u = n && (n.nodeName == `BR` || n.contentEditable == `false`)
                }
            }
            if (U && l.focusNode && l.focusNode != s.node && l.focusNode.nodeType == 1) {
                let e = l.focusNode.childNodes[l.focusOffset];
                e && e.contentEditable == `false` && (r = !0)
            }
            if (!(r || u && G) && no(o.node, o.offset, l.anchorNode, l.anchorOffset) && no(s.node, s.offset, l.focusNode, l.focusOffset)) return;
            let d = !1;
            if ((c.extend || e == t) && !(u && U)) {
                c.collapse(o.node, o.offset);
                try {
                    e != t && c.extend(s.node, s.offset), d = !0
                } catch {}
            }
            if (!d) {
                if (e > t) {
                    let e = o;
                    o = s, s = e
                }
                let n = document.createRange();
                n.setEnd(s.node, s.offset), n.setStart(o.node, o.offset), c.removeAllRanges(), c.addRange(n)
            }
        }
        ignoreMutation(e) {
            return !this.contentDOM && e.type != `selection`
        }
        get contentLost() {
            return this.contentDOM && this.contentDOM != this.dom && !this.dom.contains(this.contentDOM)
        }
        markDirty(e, t) {
            for (let n = 0, r = 0; r < this.children.length; r++) {
                let i = this.children[r],
                    a = n + i.size;
                if (n == a ? e <= a && t >= n : e < a && t > n) {
                    let r = n + i.border,
                        o = a - i.border;
                    if (e >= r && t <= o) {
                        this.dirty = e == n || t == a ? ss : as, e == r && t == o && (i.contentLost || i.dom.parentNode != this.contentDOM) ? i.dirty = J : i.markDirty(e - r, t - r);
                        return
                    } else i.dirty = i.dom == i.contentDOM && i.dom.parentNode == this.contentDOM && !i.children.length ? ss : J
                }
                n = a
            }
            this.dirty = ss
        }
        markParentsDirty() {
            let e = 1;
            for (let t = this.parent; t; t = t.parent, e++) {
                let n = e == 1 ? ss : as;
                t.dirty < n && (t.dirty = n)
            }
        }
        get domAtom() {
            return !1
        }
        get ignoreForCoords() {
            return !1
        }
        get ignoreForSelection() {
            return !1
        }
        isText(e) {
            return !1
        }
    },
    ls = class extends cs {
        constructor(e, t, n, r) {
            let i, a = t.type.toDOM;
            if (typeof a == `function` && (a = a(n, () => {
                    if (!i) return r;
                    if (i.parent) return i.parent.posBeforeChild(i)
                })), !t.type.spec.raw) {
                if (a.nodeType != 1) {
                    let e = document.createElement(`span`);
                    e.appendChild(a), a = e
                }
                a.contentEditable = `false`, a.classList.add(`ProseMirror-widget`)
            }
            super(e, [], a, null), this.widget = t, this.widget = t, i = this
        }
        matchesWidget(e) {
            return this.dirty == q && e.type.eq(this.widget.type)
        }
        parseRule() {
            return {
                ignore: !0
            }
        }
        stopEvent(e) {
            let t = this.widget.spec.stopEvent;
            return t ? t(e) : !1
        }
        ignoreMutation(e) {
            return e.type != `selection` || this.widget.spec.ignoreSelection
        }
        destroy() {
            this.widget.type.destroy(this.dom), super.destroy()
        }
        get domAtom() {
            return !0
        }
        get ignoreForSelection() {
            return !!this.widget.type.spec.relaxedSide
        }
        get side() {
            return this.widget.type.side
        }
    },
    us = class extends cs {
        constructor(e, t, n, r) {
            super(e, [], t, null), this.textDOM = n, this.text = r
        }
        get size() {
            return this.text.length
        }
        localPosFromDOM(e, t) {
            return e == this.textDOM ? this.posAtStart + t : this.posAtStart + (t ? this.size : 0)
        }
        domFromPos(e) {
            return {
                node: this.textDOM,
                offset: e
            }
        }
        ignoreMutation(e) {
            return e.type === `characterData` && e.target.nodeValue == e.oldValue
        }
    },
    ds = class e extends cs {
        constructor(e, t, n, r, i) {
            super(e, [], n, r), this.mark = t, this.spec = i
        }
        static create(t, n, r, i) {
            let a = i.nodeViews[n.type.name],
                o = a && a(n, i, r);
            return (!o || !o.dom) && (o = Un.renderSpec(document, n.type.spec.toDOM(n, r), null, n.attrs)), new e(t, n, o.dom, o.contentDOM || o.dom, o)
        }
        parseRule() {
            return this.dirty & J || this.mark.type.spec.reparseInView ? null : {
                mark: this.mark.type.name,
                attrs: this.mark.attrs,
                contentElement: this.contentDOM
            }
        }
        matchesMark(e) {
            return this.dirty != J && this.mark.eq(e)
        }
        markDirty(e, t) {
            if (super.markDirty(e, t), this.dirty != q) {
                let e = this.parent;
                for (; !e.node;) e = e.parent;
                e.dirty < this.dirty && (e.dirty = this.dirty), this.dirty = q
            }
        }
        slice(t, n, r) {
            let i = e.create(this.parent, this.mark, !0, r),
                a = this.children,
                o = this.size;
            n < o && (a = Ms(a, n, o, r)), t > 0 && (a = Ms(a, 0, t, r));
            for (let e = 0; e < a.length; e++) a[e].parent = i;
            return i.children = a, i
        }
        ignoreMutation(e) {
            return this.spec.ignoreMutation ? this.spec.ignoreMutation(e) : super.ignoreMutation(e)
        }
        destroy() {
            this.spec.destroy && this.spec.destroy(), super.destroy()
        }
    },
    fs = class e extends cs {
        constructor(e, t, n, r, i, a, o, s, c) {
            super(e, [], i, a), this.node = t, this.outerDeco = n, this.innerDeco = r, this.nodeDOM = o
        }
        static create(t, n, r, i, a, o) {
            let s = a.nodeViews[n.type.name],
                c, l = s && s(n, a, () => {
                    if (!c) return o;
                    if (c.parent) return c.parent.posBeforeChild(c)
                }, r, i),
                u = l && l.dom,
                d = l && l.contentDOM;
            if (n.isText) {
                if (!u) u = document.createTextNode(n.text);
                else if (u.nodeType != 3) throw RangeError(`Text must be rendered as a DOM text node`)
            } else if (!u) {
                let e = Un.renderSpec(document, n.type.spec.toDOM(n), null, n.attrs);
                ({
                    dom: u,
                    contentDOM: d
                } = e)
            }!d && !n.isText && u.nodeName != `BR` && (u.hasAttribute(`contenteditable`) || (u.contentEditable = `false`), n.type.spec.draggable && (u.draggable = !0));
            let f = u;
            return u = Cs(u, r, n), l ? c = new gs(t, n, r, i, u, d || null, f, l, a, o + 1) : n.isText ? new ms(t, n, r, i, u, f, a) : new e(t, n, r, i, u, d || null, f, a, o + 1)
        }
        parseRule() {
            if (this.node.type.spec.reparseInView) return null;
            let e = {
                node: this.node.type.name,
                attrs: this.node.attrs
            };
            if (this.node.type.whitespace == `pre` && (e.preserveWhitespace = `full`), !this.contentDOM) e.getContent = () => this.node.content;
            else if (!this.contentLost) e.contentElement = this.contentDOM;
            else {
                for (let t = this.children.length - 1; t >= 0; t--) {
                    let n = this.children[t];
                    if (this.dom.contains(n.dom.parentNode)) {
                        e.contentElement = n.dom.parentNode;
                        break
                    }
                }
                e.contentElement || (e.getContent = () => E.empty)
            }
            return e
        }
        matchesNode(e, t, n) {
            return this.dirty == q && e.eq(this.node) && ws(t, this.outerDeco) && n.eq(this.innerDeco)
        }
        get size() {
            return this.node.nodeSize
        }
        get border() {
            return +!this.node.isLeaf
        }
        updateChildren(e, t) {
            let n = this.node.inlineContent,
                r = t,
                i = e.composing ? this.localCompositionInfo(e, t) : null,
                a = i && i.pos > -1 ? i : null,
                o = i && i.pos < 0,
                s = new Es(this, a && a.node, e);
            ks(this.node, this.innerDeco, (t, i, a) => {
                t.spec.marks ? s.syncToMarks(t.spec.marks, n, e, i) : t.type.side >= 0 && !a && s.syncToMarks(i == this.node.childCount ? D.none : this.node.child(i).marks, n, e, i), s.placeWidget(t, e, r)
            }, (t, a, c, l) => {
                s.syncToMarks(t.marks, n, e, l);
                let u;
                s.findNodeMatch(t, a, c, l) || o && e.state.selection.from > r && e.state.selection.to < r + t.nodeSize && (u = s.findIndexWithChild(i.node)) > -1 && s.updateNodeAt(t, a, c, u, e) || s.updateNextNode(t, a, c, e, l, r) || s.addNode(t, a, c, e, r), r += t.nodeSize
            }), s.syncToMarks([], n, e, 0), this.node.isTextblock && s.addTextblockHacks(), s.destroyRest(), (s.changed || this.dirty == ss) && (a && this.protectLocalComposition(e, a), _s(this.contentDOM, this.children, e), So && As(this.dom))
        }
        localCompositionInfo(e, t) {
            let {
                from: n,
                to: r
            } = e.state.selection;
            if (!(e.state.selection instanceof P) || n < t || r > t + this.node.content.size) return null;
            let i = e.input.compositionNode;
            if (!i || !this.dom.contains(i.parentNode)) return null;
            if (this.node.inlineContent) {
                let e = i.nodeValue,
                    a = js(this.node.content, e, n - t, r - t);
                return a < 0 ? null : {
                    node: i,
                    pos: a,
                    text: e
                }
            } else return {
                node: i,
                pos: -1,
                text: ``
            }
        }
        protectLocalComposition(e, {
            node: t,
            pos: n,
            text: r
        }) {
            if (this.getDesc(t)) return;
            let i = t;
            for (; i.parentNode != this.contentDOM; i = i.parentNode) {
                for (; i.previousSibling;) i.parentNode.removeChild(i.previousSibling);
                for (; i.nextSibling;) i.parentNode.removeChild(i.nextSibling);
                i.pmViewDesc && = void 0
            }
            let a = new us(this, i, t, r);
            e.input.compositionNodes.push(a), this.children = Ms(this.children, n, n + r.length, e, a)
        }
        update(e, t, n, r) {
            return this.dirty == J || !e.sameMarkup(this.node) ? !1 : (this.updateInner(e, t, n, r), !0)
        }
        updateInner(e, t, n, r) {
            this.updateOuterDeco(t), this.node = e, this.innerDeco = n, this.contentDOM && this.updateChildren(r, this.posAtStart), this.dirty = q
        }
        updateOuterDeco(e) {
            if (ws(e, this.outerDeco)) return;
            let t = this.nodeDOM.nodeType != 1,
                n = this.dom;
            this.dom = xs(this.dom, this.nodeDOM, bs(this.outerDeco, this.node, t), bs(e, this.node, t)), this.dom != n && (n.pmViewDesc = void 0, this.dom.pmViewDesc = this), this.outerDeco = e
        }
        selectNode() {
            this.nodeDOM.nodeType == 1 && (this.nodeDOM.classList.add(`ProseMirror-selectednode`), (this.contentDOM || !this.node.type.spec.draggable) && (this.nodeDOM.draggable = !0))
        }
        deselectNode() {
            this.nodeDOM.nodeType == 1 && (this.nodeDOM.classList.remove(`ProseMirror-selectednode`), (this.contentDOM || !this.node.type.spec.draggable) && this.nodeDOM.removeAttribute(`draggable`))
        }
        get domAtom() {
            return this.node.isAtom
        }
    };

function ps(e, t, n, r, i) {
    Cs(r, t, e);
    let a = new fs(void 0, e, t, n, r, r, r, i, 0);
    return a.contentDOM && a.updateChildren(i, 0), a
}
var ms = class e extends fs {
        constructor(e, t, n, r, i, a, o) {
            super(e, t, n, r, i, null, a, o, 0)
        }
        parseRule() {
            let e = this.nodeDOM.parentNode;
            for (; e && e != this.dom && !e.pmIsDeco;) e = e.parentNode;
            return {
                skip: e || !0
            }
        }
        update(e, t, n, r) {
            return this.dirty == J || this.dirty != q && !this.inParent() || !e.sameMarkup(this.node) ? !1 : (this.updateOuterDeco(t), (this.dirty != q || e.text != this.node.text) && e.text != this.nodeDOM.nodeValue && (this.nodeDOM.nodeValue = e.text, r.trackWrites == this.nodeDOM && (r.trackWrites = null)), this.node = e, this.dirty = q, !0)
        }
        inParent() {
            let e = this.parent.contentDOM;
            for (let t = this.nodeDOM; t; t = t.parentNode)
                if (t == e) return !0;
            return !1
        }
        domFromPos(e) {
            return {
                node: this.nodeDOM,
                offset: e
            }
        }
        localPosFromDOM(e, t, n) {
            return e == this.nodeDOM ? this.posAtStart + Math.min(t, this.node.text.length) : super.localPosFromDOM(e, t, n)
        }
        ignoreMutation(e) {
            return e.type != `characterData` && e.type != `selection`
        }
        slice(t, n, r) {
            let i = this.node.cut(t, n),
                a = document.createTextNode(i.text);
            return new e(this.parent, i, this.outerDeco, this.innerDeco, a, a, r)
        }
        markDirty(e, t) {
            super.markDirty(e, t), this.dom != this.nodeDOM && (e == 0 || t == this.nodeDOM.nodeValue.length) && (this.dirty = J)
        }
        get domAtom() {
            return !1
        }
        isText(e) {
            return this.node.text == e
        }
    },
    hs = class extends cs {
        parseRule() {
            return {
                ignore: !0
            }
        }
        matchesHack(e) {
            return this.dirty == q && this.dom.nodeName == e
        }
        get domAtom() {
            return !0
        }
        get ignoreForCoords() {
            return this.dom.nodeName == `IMG`
        }
    },
    gs = class extends fs {
        constructor(e, t, n, r, i, a, o, s, c, l) {
            super(e, t, n, r, i, a, o, c, l), this.spec = s
        }
        update(e, t, n, r) {
            if (this.dirty == J) return !1;
            if (this.spec.update && (this.node.type == e.type || this.spec.multiType)) {
                let i = this.spec.update(e, t, n);
                return i && this.updateInner(e, t, n, r), i
            } else if (!this.contentDOM && !e.isLeaf) return !1;
            else return super.update(e, t, n, r)
        }
        selectNode() {
            this.spec.selectNode ? this.spec.selectNode() : super.selectNode()
        }
        deselectNode() {
            this.spec.deselectNode ? this.spec.deselectNode() : super.deselectNode()
        }
        setSelection(e, t, n, r) {
            this.spec.setSelection ? this.spec.setSelection(e, t, n.root) : super.setSelection(e, t, n, r)
        }
        destroy() {
            this.spec.destroy && this.spec.destroy(), super.destroy()
        }
        stopEvent(e) {
            return this.spec.stopEvent ? this.spec.stopEvent(e) : !1
        }
        ignoreMutation(e) {
            return this.spec.ignoreMutation ? this.spec.ignoreMutation(e) : super.ignoreMutation(e)
        }
    };

function _s(e, t, n) {
    let r = e.firstChild,
        i = !1;
    for (let a = 0; a < t.length; a++) {
        let o = t[a],
            s = o.dom;
        if (s.parentNode == e) {
            for (; s != r;) r = Ts(r), i = !0;
            r = r.nextSibling
        } else i = !0, e.insertBefore(s, r);
        if (o instanceof ds) {
            let t = r ? r.previousSibling : e.lastChild;
            _s(o.contentDOM, o.children, n), r = t ? t.nextSibling : e.firstChild
        }
    }
    for (; r;) r = Ts(r), i = !0;
    i && n.trackWrites == e && (n.trackWrites = null)
}
var vs = function(e) {
    e && (this.nodeName = e)
};
vs.prototype = Object.create(null);
var ys = [new vs];

function bs(e, t, n) {
    if (e.length == 0) return ys;
    let r = n ? ys[0] : new vs,
        i = [r];
    for (let a = 0; a < e.length; a++) {
        let o = e[a].type.attrs;
        if (o) {
            o.nodeName && i.push(r = new vs(o.nodeName));
            for (let e in o) {
                let a = o[e];
                a != null && (n && i.length == 1 && i.push(r = new vs(t.isInline ? `span` : `div`)), e == `class` ? r.class = (r.class ? r.class + ` ` : ``) + a : e == `style` ? r.style = (r.style ? r.style + `;` : ``) + a : e != `nodeName` && (r[e] = a))
            }
        }
    }
    return i
}

function xs(e, t, n, r) {
    if (n == ys && r == ys) return t;
    let i = t;
    for (let t = 0; t < r.length; t++) {
        let a = r[t],
            o = n[t];
        if (t) {
            let t;
            o && o.nodeName == a.nodeName && i != e && (t = i.parentNode) && t.nodeName.toLowerCase() == a.nodeName ? i = t : (t = document.createElement(a.nodeName), t.pmIsDeco = !0, t.appendChild(i), o = ys[0], i = t)
        }
        Ss(i, o || ys[0], a)
    }
    return i
}

function Ss(e, t, n) {
    for (let r in t) r != `class` && r != `style` && r != `nodeName` && !(r in n) && e.removeAttribute(r);
    for (let r in n) r != `class` && r != `style` && r != `nodeName` && n[r] != t[r] && e.setAttribute(r, n[r]);
    if (t.class != n.class) {
        let r = t.class ? t.class.split(` `).filter(Boolean) : [],
            i = n.class ? n.class.split(` `).filter(Boolean) : [];
        for (let t = 0; t < r.length; t++) i.indexOf(r[t]) == -1 && e.classList.remove(r[t]);
        for (let t = 0; t < i.length; t++) r.indexOf(i[t]) == -1 && e.classList.add(i[t]);
        e.classList.length == 0 && e.removeAttribute(`class`)
    }
    if (t.style != n.style) {
        if (t.style) {
            let n = /\s*([\w\-\xa1-\uffff]+)\s*:(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\(.*?\)|[^;])*/g,
                r;
            for (; r = n.exec(t.style);) e.style.removeProperty(r[1])
        }
        n.style && (e.style.cssText += n.style)
    }
}

function Cs(e, t, n) {
    return xs(e, e, ys, bs(t, n, e.nodeType != 1))
}

function ws(e, t) {
    if (e.length != t.length) return !1;
    for (let n = 0; n < e.length; n++)
        if (!e[n].type.eq(t[n].type)) return !1;
    return !0
}

function Ts(e) {
    let t = e.nextSibling;
    return e.parentNode.removeChild(e), t
}
var Es = class {
    constructor(e, t, n) {
        this.lock = t, this.view = n, this.index = 0, this.stack = [], this.changed = !1, this.top = e, this.preMatch = Ds(e.node.content, e)
    }
    destroyBetween(e, t) {
        if (e != t) {
            for (let n = e; n < t; n++) this.top.children[n].destroy();
            this.top.children.splice(e, t - e), this.changed = !0
        }
    }
    destroyRest() {
        this.destroyBetween(this.index, this.top.children.length)
    }
    syncToMarks(e, t, n, r) {
        let i = 0,
            a = this.stack.length >> 1,
            o = Math.min(a, e.length);
        for (; i < o && (i == a - 1 ? this.top : this.stack[i + 1 << 1]).matchesMark(e[i]) && e[i].type.spec.spanning !== !1;) i++;
        for (; i < a;) this.destroyRest(), this.top.dirty = q, this.index = this.stack.pop(), this.top = this.stack.pop(), a--;
        for (; a < e.length;) {
            this.stack.push(this.top, this.index + 1);
            let i = -1,
                o = this.top.children.length;
            r < this.preMatch.index && (o = Math.min(this.index + 3, o));
            for (let t = this.index; t < o; t++) {
                let n = this.top.children[t];
                if (n.matchesMark(e[a]) && !this.isLocked(n.dom)) {
                    i = t;
                    break
                }
            }
            if (i > -1) i > this.index && (this.changed = !0, this.destroyBetween(this.index, i)), this.top = this.top.children[this.index];
            else {
                let r = ds.create(this.top, e[a], t, n);
                this.top.children.splice(this.index, 0, r), this.top = r, this.changed = !0
            }
            this.index = 0, a++
        }
    }
    findNodeMatch(e, t, n, r) {
        let i = -1,
            a;
        if (r >= this.preMatch.index && (a = this.preMatch.matches[r - this.preMatch.index]).parent == this.top && a.matchesNode(e, t, n)) i = this.top.children.indexOf(a, this.index);
        else
            for (let r = this.index, a = Math.min(this.top.children.length, r + 5); r < a; r++) {
                let a = this.top.children[r];
                if (a.matchesNode(e, t, n) && !this.preMatch.matched.has(a)) {
                    i = r;
                    break
                }
            }
        return i < 0 ? !1 : (this.destroyBetween(this.index, i), this.index++, !0)
    }
    updateNodeAt(e, t, n, r, i) {
        let a = this.top.children[r];
        return a.dirty == J && a.dom == a.contentDOM && (a.dirty = ss), a.update(e, t, n, i) ? (this.destroyBetween(this.index, r), this.index++, !0) : !1
    }
    findIndexWithChild(e) {
        for (;;) {
            let t = e.parentNode;
            if (!t) return -1;
            if (t == this.top.contentDOM) {
                let t = e.pmViewDesc;
                if (t) {
                    for (let e = this.index; e < this.top.children.length; e++)
                        if (this.top.children[e] == t) return e
                }
                return -1
            }
            e = t
        }
    }
    updateNextNode(e, t, n, r, i, a) {
        for (let o = this.index; o < this.top.children.length; o++) {
            let s = this.top.children[o];
            if (s instanceof fs) {
                let c = this.preMatch.matched.get(s);
                if (c != null && c != i) return !1;
                let l = s.dom,
                    u, d = this.isLocked(l) && !(e.isText && s.node && s.node.isText && s.nodeDOM.nodeValue == e.text && s.dirty != J && ws(t, s.outerDeco));
                if (!d && s.update(e, t, n, r)) return this.destroyBetween(this.index, o), s.dom != l && (this.changed = !0), this.index++, !0;
                if (!d && (u = this.recreateWrapper(s, e, t, n, r, a))) return this.destroyBetween(this.index, o), this.top.children[this.index] = u, u.contentDOM && (u.dirty = ss, u.updateChildren(r, a + 1), u.dirty = q), this.changed = !0, this.index++, !0;
                break
            }
        }
        return !1
    }
    recreateWrapper(e, t, n, r, i, a) {
        if (e.dirty || t.isAtom || !e.children.length || !e.node.content.eq(t.content) || !ws(n, e.outerDeco) || !r.eq(e.innerDeco)) return null;
        let o = fs.create(this.top, t, n, r, i, a);
        if (o.contentDOM) {
            o.children = e.children, e.children = [];
            for (let e of o.children) e.parent = o
        }
        return e.destroy(), o
    }
    addNode(e, t, n, r, i) {
        let a = fs.create(this.top, e, t, n, r, i);
        a.contentDOM && a.updateChildren(r, i + 1), this.top.children.splice(this.index++, 0, a), this.changed = !0
    }
    placeWidget(e, t, n) {
        let r = this.index < this.top.children.length ? this.top.children[this.index] : null;
        if (r && r.matchesWidget(e) && (e == r.widget || !r.widget.type.toDOM.parentNode)) this.index++;
        else {
            let r = new ls(this.top, e, t, n);
            this.top.children.splice(this.index++, 0, r), this.changed = !0
        }
    }
    addTextblockHacks() {
        let e = this.top.children[this.index - 1],
            t = this.top;
        for (; e instanceof ds;) t = e, e = t.children[t.children.length - 1];
        (!e || !(e instanceof ms) || /\n$/.test(e.node.text) || this.view.requiresGeckoHackNode && /\s$/.test(e.node.text)) && ((G || W) && e && e.dom.contentEditable == `false` && this.addHackNode(`IMG`, t), this.addHackNode(`BR`, this.top))
    }
    addHackNode(e, t) {
        if (t == this.top && this.index < t.children.length && t.children[this.index].matchesHack(e)) this.index++;
        else {
            let n = document.createElement(e);
            e == `IMG` && (n.className = `ProseMirror-separator`, n.alt = ``), e == `BR` && (n.className = `ProseMirror-trailingBreak`);
            let r = new hs(this.top, [], n, null);
            t == this.top ? t.children.splice(this.index++, 0, r) : t.children.push(r), this.changed = !0
        }
    }
    isLocked(e) {
        return this.lock && (e == this.lock || e.nodeType == 1 && e.contains(this.lock.parentNode))
    }
};

function Ds(e, t) {
    let n = t,
        r = n.children.length,
        i = e.childCount,
        a = new Map,
        o = [];
    outer: for (; i > 0;) {
        let s;
        for (;;)
            if (r) {
                let e = n.children[r - 1];
                if (e instanceof ds) n = e, r = e.children.length;
                else {
                    s = e, r--;
                    break
                }
            } else if (n == t) break outer;
        else r = n.parent.children.indexOf(n), n = n.parent;
        let c = s.node;
        if (c) {
            if (c != e.child(i - 1)) break;
            --i, a.set(s, i), o.push(s)
        }
    }
    return {
        index: i,
        matched: a,
        matches: o.reverse()
    }
}

function Os(e, t) {
    return e.type.side - t.type.side
}

function ks(e, t, n, r) {
    let i = t.locals(e),
        a = 0;
    if (i.length == 0) {
        for (let n = 0; n < e.childCount; n++) {
            let o = e.child(n);
            r(o, i, t.forChild(a, o), n), a += o.nodeSize
        }
        return
    }
    let o = 0,
        s = [],
        c = null;
    for (let l = 0;;) {
        let u, d;
        for (; o < i.length && i[o].to == a;) {
            let e = i[o++];
            e.widget && (u ? (d || = [u]).push(e) : u = e)
        }
        if (u)
            if (d) {
                d.sort(Os);
                for (let e = 0; e < d.length; e++) n(d[e], l, !!c)
            } else n(u, l, !!c);
        let f, p;
        if (c) p = -1, f = c, c = null;
        else if (l < e.childCount) p = l, f = e.child(l++);
        else break;
        for (let e = 0; e < s.length; e++) s[e].to <= a && s.splice(e--, 1);
        for (; o < i.length && i[o].from <= a && i[o].to > a;) s.push(i[o++]);
        let m = a + f.nodeSize;
        if (f.isText) {
            let e = m;
            o < i.length && i[o].from < e && (e = i[o].from);
            for (let t = 0; t < s.length; t++) s[t].to < e && (e = s[t].to);
            e < m && (c = f.cut(e - a), f = f.cut(0, e - a), m = e, p = -1)
        } else
            for (; o < i.length && i[o].to < m;) o++;
        let h = f.isInline && !f.isLeaf ? s.filter(e => !e.inline) : s.slice();
        r(f, h, t.forChild(a, f), p), a = m
    }
}

function As(e) {
    if (e.nodeName == `UL` || e.nodeName == `OL`) {
        let t = e.style.cssText;
        e.style.cssText = t + `; list-style: square !important`, window.getComputedStyle(e).listStyle, e.style.cssText = t
    }
}

function js(e, t, n, r) {
    for (let i = 0, a = 0; i < e.childCount && a <= r;) {
        let o = e.child(i++),
            s = a;
        if (a += o.nodeSize, !o.isText) continue;
        let c = o.text;
        for (; i < e.childCount;) {
            let t = e.child(i++);
            if (a += t.nodeSize, !t.isText) break;
            c += t.text
        }
        if (a >= n) {
            if (a >= r && c.slice(r - t.length - s, r - s) == t) return r - t.length;
            let e = s < r ? c.lastIndexOf(t, r - s - 1) : -1;
            if (e >= 0 && e + t.length + s >= n) return s + e;
            if (n == r && c.length >= r + t.length - s && c.slice(r - s, r - s + t.length) == t) return r
        }
    }
    return -1
}

function Ms(e, t, n, r, i) {
    let a = [];
    for (let o = 0, s = 0; o < e.length; o++) {
        let c = e[o],
            l = s,
            u = s += c.size;
        l >= n || u <= t ? a.push(c) : (l < t && a.push(c.slice(0, t - l, r)), i && = (a.push(i), void 0), u > n && a.push(c.slice(n - l, c.size, r)))
    }
    return a
}

function Ns(e, t = null) {
    let n = e.domSelectionRange(),
        r = e.state.doc;
    if (!n.focusNode) return null;
    let i = e.docView.nearestDesc(n.focusNode),
        a = i && i.size == 0,
        o = e.docView.posFromDOM(n.focusNode, n.focusOffset, 1);
    if (o < 0) return null;
    let s = r.resolve(o),
        c, l;
    if (lo(n)) {
        for (c = o; i && !i.node;) i = i.parent;
        let e = i.node;
        if (i && e.isAtom && F.isSelectable(e) && i.parent && !(e.isInline && so(n.focusNode, n.focusOffset, i.dom))) {
            let e = i.posBefore;
            l = new F(o == e ? s : r.resolve(e))
        }
    } else {
        if (n instanceof e.dom.ownerDocument.defaultView.Selection && n.rangeCount > 1) {
            let t = o,
                i = o;
            for (let r = 0; r < n.rangeCount; r++) {
                let a = n.getRangeAt(r);
                t = Math.min(t, e.docView.posFromDOM(a.startContainer, a.startOffset, 1)), i = Math.max(i, e.docView.posFromDOM(a.endContainer, a.endOffset, -1))
            }
            if (t < 0) return null;
            [c, o] = i == e.state.selection.anchor ? [i, t] : [t, i], s = r.resolve(o)
        } else c = e.docView.posFromDOM(n.anchorNode, n.anchorOffset, 1);
        if (c < 0) return null
    }
    let u = r.resolve(c);
    if (!l) {
        let n = t == `pointer` || e.state.selection.head < s.pos && !a ? 1 : -1;
        l = Ws(e, u, s, n)
    }
    return l
}

function Ps(e) {
    return e.editable ? e.hasFocus() : Ks(e) && document.activeElement && document.activeElement.contains(e.dom)
}

function Fs(e, t = !1) {
    let n = e.state.selection;
    if (Hs(e, n), Ps(e)) {
        if (!t && e.input.mouseDown && e.input.mouseDown.allowDefault && W) {
            let t = e.domSelectionRange(),
                n = e.domObserver.currentSelection;
            if (t.anchorNode && n.anchorNode && no(t.anchorNode, t.anchorOffset, n.anchorNode, n.anchorOffset)) {
                e.input.mouseDown.delayedSelectionSync = !0, e.domObserver.setCurSelection();
                return
            }
        }
        if (e.domObserver.disconnectSelection(), e.cursorWrapper) Vs(e);
        else {
            let {
                anchor: r,
                head: i
            } = n, a, o;
            Is && !(n instanceof P) && (n.$from.parent.inlineContent || (a = Ls(e, n.from)), !n.empty && !n.$from.parent.inlineContent && (o = Ls(e, n.to))), e.docView.setSelection(r, i, e, t), Is && (a && zs(a), o && zs(o)), n.visible ? e.dom.classList.remove(`ProseMirror-hideselection`) : (e.dom.classList.add(`ProseMirror-hideselection`), `onselectionchange` in document && Bs(e))
        }
        e.domObserver.setCurSelection(), e.domObserver.connectSelection()
    }
}
var Is = G || W && xo < 63;

function Ls(e, t) {
    let {
        node: n,
        offset: r
    } = e.docView.domFromPos(t, 0), i = r < n.childNodes.length ? n.childNodes[r] : null, a = r ? n.childNodes[r - 1] : null;
    if (G && i && i.contentEditable == `false`) return Rs(i);
    if ((!i || i.contentEditable == `false`) && (!a || a.contentEditable == `false`)) {
        if (i) return Rs(i);
        if (a) return Rs(a)
    }
}

function Rs(e) {
    return e.contentEditable = `true`, G && e.draggable && (e.draggable = !1, e.wasDraggable = !0), e
}

function zs(e) {
    e.contentEditable = `false`, e.wasDraggable && = (e.draggable = !0, null)
}

function Bs(e) {
    let t = e.dom.ownerDocument;
    t.removeEventListener(`selectionchange`, e.input.hideSelectionGuard);
    let n = e.domSelectionRange(),
        r = n.anchorNode,
        i = n.anchorOffset;
    t.addEventListener(`selectionchange`, e.input.hideSelectionGuard = () => {
        (n.anchorNode != r || n.anchorOffset != i) && (t.removeEventListener(`selectionchange`, e.input.hideSelectionGuard), setTimeout(() => {
            (!Ps(e) || e.state.selection.visible) && e.dom.classList.remove(`ProseMirror-hideselection`)
        }, 20))
    })
}

function Vs(e) {
    let t = e.domSelection();
    if (!t) return;
    let n = e.cursorWrapper.dom,
        r = n.nodeName == `IMG`;
    r ? t.collapse(n.parentNode, z(n) + 1) : t.collapse(n, 0), !r && !e.state.selection.visible && H && yo <= 11 && (n.disabled = !0, n.disabled = !1)
}

function Hs(e, t) {
    if (t instanceof F) {
        let n = e.docView.descAt(t.from);
        n != e.lastSelectedViewDesc && (Us(e), n && n.selectNode(), e.lastSelectedViewDesc = n)
    } else Us(e)
}

function Us(e) {
    e.lastSelectedViewDesc && = (e.lastSelectedViewDesc.parent && e.lastSelectedViewDesc.deselectNode(), void 0)
}

function Ws(e, t, n, r) {
    return e.someProp(`createSelectionBetween`, r => r(e, t, n)) || P.between(t, n, r)
}

function Gs(e) {
    return e.editable && !e.hasFocus() ? !1 : Ks(e)
}

function Ks(e) {
    let t = e.domSelectionRange();
    if (!t.anchorNode) return !1;
    try {
        return e.dom.contains(t.anchorNode.nodeType == 3 ? t.anchorNode.parentNode : t.anchorNode) && (e.editable || e.dom.contains(t.focusNode.nodeType == 3 ? t.focusNode.parentNode : t.focusNode))
    } catch {
        return !1
    }
}

function qs(e) {
    let t = e.docView.domFromPos(e.state.selection.anchor, 0),
        n = e.domSelectionRange();
    return no(t.node, t.offset, n.anchorNode, n.anchorOffset)
}

function Js(e, t) {
    let {
        $anchor: n,
        $head: r
    } = e.selection, i = t > 0 ? n.max(r) : n.min(r), a = i.parent.inlineContent ? i.depth ? e.doc.resolve(t > 0 ? i.after() : i.before()) : null : i;
    return a && N.findFrom(a, t)
}

function Ys(e, t) {
    return e.dispatch(e.state.tr.setSelection(t).scrollIntoView()), !0
}

function Xs(e, t, n) {
    let r = e.state.selection;
    if (r instanceof P) {
        if (n.indexOf(`s`) > -1) {
            let {
                $head: n
            } = r, i = n.textOffset ? null : t < 0 ? n.nodeBefore : n.nodeAfter;
            if (!i || i.isText || !i.isLeaf) return !1;
            let a = e.state.doc.resolve(n.pos + i.nodeSize * (t < 0 ? -1 : 1));
            return Ys(e, new P(r.$anchor, a))
        } else if (!r.empty) return !1;
        else if (e.endOfTextblock(t > 0 ? `forward` : `backward`)) {
            let n = Js(e.state, t);
            return n && n instanceof F ? Ys(e, n) : !1
        } else if (!(K && n.indexOf(`m`) > -1)) {
            let n = r.$head,
                i = n.textOffset ? null : t < 0 ? n.nodeBefore : n.nodeAfter,
                a;
            if (!i || i.isText) return !1;
            let o = t < 0 ? n.pos - i.nodeSize : n.pos;
            return i.isAtom || (a = e.docView.descAt(o)) && !a.contentDOM ? F.isSelectable(i) ? Ys(e, new F(t < 0 ? e.state.doc.resolve(n.pos - i.nodeSize) : n)) : To ? Ys(e, new P(e.state.doc.resolve(t < 0 ? o : o + i.nodeSize))) : !1 : !1
        }
    } else if (r instanceof F && r.node.isInline) return Ys(e, new P(t > 0 ? r.$to : r.$from));
    else {
        let n = Js(e.state, t);
        return n ? Ys(e, n) : !1
    }
}

function Zs(e) {
    return e.nodeType == 3 ? e.nodeValue.length : e.childNodes.length
}

function Qs(e, t) {
    let n = e.pmViewDesc;
    return n && n.size == 0 && (t < 0 || e.nextSibling || e.nodeName != `BR`)
}

function $s(e, t) {
    return t < 0 ? ec(e) : tc(e)
}

function ec(e) {
    let t = e.domSelectionRange(),
        n = t.focusNode,
        r = t.focusOffset;
    if (!n) return;
    let i, a, o = !1;
    for (U && n.nodeType == 1 && r < Zs(n) && Qs(n.childNodes[r], -1) && (o = !0);;)
        if (r > 0) {
            if (n.nodeType != 1) break; {
                let e = n.childNodes[r - 1];
                if (Qs(e, -1)) i = n, a = --r;
                else if (e.nodeType == 3) n = e, r = n.nodeValue.length;
                else break
            }
        } else if (nc(n)) break;
    else {
        let t = n.previousSibling;
        for (; t && Qs(t, -1);) i = n.parentNode, a = z(t), t = t.previousSibling;
        if (t) n = t, r = Zs(n);
        else {
            if (n = n.parentNode, n == e.dom) break;
            r = 0
        }
    }
    o ? ac(e, n, r) : i && ac(e, i, a)
}

function tc(e) {
    let t = e.domSelectionRange(),
        n = t.focusNode,
        r = t.focusOffset;
    if (!n) return;
    let i = Zs(n),
        a, o;
    for (;;)
        if (r < i) {
            if (n.nodeType != 1) break;
            let e = n.childNodes[r];
            if (Qs(e, 1)) a = n, o = ++r;
            else break
        } else if (nc(n)) break;
    else {
        let t = n.nextSibling;
        for (; t && Qs(t, 1);) a = t.parentNode, o = z(t) + 1, t = t.nextSibling;
        if (t) n = t, r = 0, i = Zs(n);
        else {
            if (n = n.parentNode, n == e.dom) break;
            r = i = 0
        }
    }
    a && ac(e, a, o)
}

function nc(e) {
    let t = e.pmViewDesc;
    return t && t.node && t.node.isBlock
}

function rc(e, t) {
    for (; e && t == e.childNodes.length && !co(e);) t = z(e) + 1, e = e.parentNode;
    for (; e && t < e.childNodes.length;) {
        let n = e.childNodes[t];
        if (n.nodeType == 3) return n;
        if (n.nodeType == 1 && n.contentEditable == `false`) break;
        e = n, t = 0
    }
}

function ic(e, t) {
    for (; e && !t && !co(e);) t = z(e), e = e.parentNode;
    for (; e && t;) {
        let n = e.childNodes[t - 1];
        if (n.nodeType == 3) return n;
        if (n.nodeType == 1 && n.contentEditable == `false`) break;
        e = n, t = e.childNodes.length
    }
}

function ac(e, t, n) {
    if (t.nodeType != 3) {
        let e, r;
        (r = rc(t, n)) ? (t = r, n = 0) : (e = ic(t, n)) && (t = e, n = e.nodeValue.length)
    }
    let r = e.domSelection();
    if (!r) return;
    if (lo(r)) {
        let e = document.createRange();
        e.setEnd(t, n), e.setStart(t, n), r.removeAllRanges(), r.addRange(e)
    } else r.extend && r.extend(t, n);
    e.domObserver.setCurSelection();
    let {
        state: i
    } = e;
    setTimeout(() => {
        e.state == i && Fs(e)
    }, 50)
}

function oc(e, t) {
    let n = e.state.doc.resolve(t);
    if (!(W || Co) && n.parent.inlineContent) {
        let r = e.coordsAtPos(t);
        if (t > n.start()) {
            let n = e.coordsAtPos(t - 1),
                i = (n.top + n.bottom) / 2;
            if (i > r.top && i < r.bottom && Math.abs(n.left - r.left) > 1) return n.left < r.left ? `ltr` : `rtl`
        }
        if (t < n.end()) {
            let n = e.coordsAtPos(t + 1),
                i = (n.top + n.bottom) / 2;
            if (i > r.top && i < r.bottom && Math.abs(n.left - r.left) > 1) return n.left > r.left ? `ltr` : `rtl`
        }
    }
    return getComputedStyle(e.dom).direction == `rtl` ? `rtl` : `ltr`
}

function sc(e, t, n) {
    let r = e.state.selection;
    if (r instanceof P && !r.empty || n.indexOf(`s`) > -1 || K && n.indexOf(`m`) > -1) return !1;
    let {
        $from: i,
        $to: a
    } = r;
    if (!i.parent.inlineContent || e.endOfTextblock(t < 0 ? `up` : `down`)) {
        let n = Js(e.state, t);
        if (n && n instanceof F) return Ys(e, n)
    }
    if (!i.parent.inlineContent) {
        let n = t < 0 ? i : a,
            o = r instanceof I ? N.near(n, t) : N.findFrom(n, t);
        return o ? Ys(e, o) : !1
    }
    return !1
}

function cc(e, t) {
    if (!(e.state.selection instanceof P)) return !0;
    let {
        $head: n,
        $anchor: r,
        empty: i
    } = e.state.selection;
    if (!n.sameParent(r)) return !0;
    if (!i) return !1;
    if (e.endOfTextblock(t > 0 ? `forward` : `backward`)) return !0;
    let a = !n.textOffset && (t < 0 ? n.nodeBefore : n.nodeAfter);
    if (a && !a.isText) {
        let r = e.state.tr;
        return t < 0 ? r.delete(n.pos - a.nodeSize, n.pos) : r.delete(n.pos, n.pos + a.nodeSize), e.dispatch(r), !0
    }
    return !1
}

function lc(e, t, n) {
    e.domObserver.stop(), t.contentEditable = n, e.domObserver.start()
}

function uc(e) {
    if (!G || e.state.selection.$head.parentOffset > 0) return !1;
    let {
        focusNode: t,
        focusOffset: n
    } = e.domSelectionRange();
    if (t && t.nodeType == 1 && n == 0 && t.firstChild && t.firstChild.contentEditable == `false`) {
        let n = t.firstChild;
        lc(e, n, `true`), setTimeout(() => lc(e, n, `false`), 20)
    }
    return !1
}

function dc(e) {
    let t = ``;
    return e.ctrlKey && (t += `c`), e.metaKey && (t += `m`), e.altKey && (t += `a`), e.shiftKey && (t += `s`), t
}

function fc(e, t) {
    let n = t.keyCode,
        r = dc(t);
    if (n == 8 || K && n == 72 && r == `c`) return cc(e, -1) || $s(e, -1);
    if (n == 46 && !t.shiftKey || K && n == 68 && r == `c`) return cc(e, 1) || $s(e, 1);
    if (n == 13 || n == 27) return !0;
    if (n == 37 || K && n == 66 && r == `c`) {
        let t = n == 37 ? oc(e, e.state.selection.from) == `ltr` ? -1 : 1 : -1;
        return Xs(e, t, r) || $s(e, t)
    } else if (n == 39 || K && n == 70 && r == `c`) {
        let t = n == 39 ? oc(e, e.state.selection.from) == `ltr` ? 1 : -1 : 1;
        return Xs(e, t, r) || $s(e, t)
    } else if (n == 38 || K && n == 80 && r == `c`) return sc(e, -1, r) || $s(e, -1);
    else if (n == 40 || K && n == 78 && r == `c`) return uc(e) || sc(e, 1, r) || $s(e, 1);
    else if (r == (K ? `m` : `c`) && (n == 66 || n == 73 || n == 89 || n == 90)) return !0;
    return !1
}

function pc(e, t) {
    e.someProp(`transformCopied`, n => {
        t = n(t, e)
    });
    let n = [],
        {
            content: r,
            openStart: i,
            openEnd: a
        } = t;
    for (; i > 1 && a > 1 && r.childCount == 1 && r.firstChild.childCount == 1;) {
        i--, a--;
        let e = r.firstChild;
        n.push(e.type.name, e.attrs == e.type.defaultAttrs ? null : e.attrs), r = e.content
    }
    let o = e.someProp(`clipboardSerializer`) || Un.fromSchema(e.state.schema),
        s = wc(),
        c = s.createElement(`div`);
    c.appendChild(o.serializeFragment(r, {
        document: s
    }));
    let l = c.firstChild,
        u, d = 0;
    for (; l && l.nodeType == 1 && (u = Sc[l.nodeName.toLowerCase()]);) {
        for (let e = u.length - 1; e >= 0; e--) {
            let t = s.createElement(u[e]);
            for (; c.firstChild;) t.appendChild(c.firstChild);
            c.appendChild(t), d++
        }
        l = c.firstChild
    }
    return l && l.nodeType == 1 && l.setAttribute(`data-pm-slice`, `${i} ${a}${d?` -${d}`:``} ${JSON.stringify(n)}`), {
        dom: c,
        text: e.someProp(`clipboardTextSerializer`, n => n(t, e)) || t.content.textBetween(0, t.content.size, `

`),
        slice: t
    }
}

function mc(e, t, n, r, i) {
    let a = i.parent.type.spec.code,
        o, s;
    if (!n && !t) return null;
    let c = !!t && (r || a || !n);
    if (c) {
        if (e.someProp(`transformPastedText`, n => {
                t = n(t, a || r, e)
            }), a) return s = new O(E.from(e.state.schema.text(t.replace(/\r\n?/g, `
`))), 0, 0), e.someProp(`transformPasted`, t => {
            s = t(s, e, !0)
        }), s;
        let n = e.someProp(`clipboardTextParser`, n => n(t, i, r, e));
        if (n) s = n;
        else {
            let n = i.marks(),
                {
                    schema: r
                } = e.state,
                a = Un.fromSchema(r);
            o = document.createElement(`div`), t.split(/(?:\r\n?|\n)+/).forEach(e => {
                let t = o.appendChild(document.createElement(`p`));
                e && t.appendChild(a.serializeNode(r.text(e, n)))
            })
        }
    } else e.someProp(`transformPastedHTML`, t => {
        n = t(n, e)
    }), o = Dc(n), To && Oc(o);
    let l = o && o.querySelector(`[data-pm-slice]`),
        u = l && /^(\d+) (\d+)(?: -(\d+))? (.*)/.exec(l.getAttribute(`data-pm-slice`) || ``);
    if (u && u[3])
        for (let e = +u[3]; e > 0; e--) {
            let e = o.firstChild;
            for (; e && e.nodeType != 1;) e = e.nextSibling;
            if (!e) break;
            o = e
        }
    if (s || = (e.someProp(`clipboardParser`) || e.someProp(`domParser`) || kn.fromSchema(e.state.schema)).parseSlice(o, {
            preserveWhitespace: !!(c || u),
            context: i,
            ruleFromNode(e) {
                return e.nodeName == `BR` && !e.nextSibling && e.parentNode && !hc.test(e.parentNode.nodeName) ? {
                    ignore: !0
                } : null
            }
        }), u) s = kc(xc(s, +u[1], +u[2]), u[4]);
    else if (s = O.maxOpen(gc(s.content, i), !0), s.openStart || s.openEnd) {
        let e = 0,
            t = 0;
        for (let t = s.content.firstChild; e < s.openStart && !t.type.spec.isolating; e++, t = t.firstChild);
        for (let e = s.content.lastChild; t < s.openEnd && !e.type.spec.isolating; t++, e = e.lastChild);
        s = xc(s, e, t)
    }
    return e.someProp(`transformPasted`, t => {
        s = t(s, e, c)
    }), s
}
var hc = /^(a|abbr|acronym|b|cite|code|del|em|i|ins|kbd|label|output|q|ruby|s|samp|span|strong|sub|sup|time|u|tt|var)$/i;

function gc(e, t) {
    if (e.childCount < 2) return e;
    for (let n = t.depth; n >= 0; n--) {
        let r = t.node(n).contentMatchAt(t.index(n)),
            i, a = [];
        if (e.forEach(e => {
                if (!a) return;
                let t = r.findWrapping(e.type),
                    n;
                if (!t) return a = null;
                if (n = a.length && i.length && vc(t, i, e, a[a.length - 1], 0)) a[a.length - 1] = n;
                else {
                    a.length && (a[a.length - 1] = yc(a[a.length - 1], i.length));
                    let n = _c(e, t);
                    a.push(n), r = r.matchType(n.type), i = t
                }
            }), a) return E.from(a)
    }
    return e
}

function _c(e, t, n = 0) {
    for (let r = t.length - 1; r >= n; r--) e = t[r].create(null, E.from(e));
    return e
}

function vc(e, t, n, r, i) {
    if (i < e.length && i < t.length && e[i] == t[i]) {
        let a = vc(e, t, n, r.lastChild, i + 1);
        if (a) return r.copy(r.content.replaceChild(r.childCount - 1, a));
        if (r.contentMatchAt(r.childCount).matchType(i == e.length - 1 ? n.type : e[i + 1])) return r.copy(r.content.append(E.from(_c(n, e, i + 1))))
    }
}

function yc(e, t) {
    if (t == 0) return e;
    let n = e.content.replaceChild(e.childCount - 1, yc(e.lastChild, t - 1)),
        r = e.contentMatchAt(e.childCount).fillBefore(E.empty, !0);
    return e.copy(n.append(r))
}

function bc(e, t, n, r, i, a) {
    let o = t < 0 ? e.firstChild : e.lastChild,
        s = o.content;
    return e.childCount > 1 && (a = 0), i < r - 1 && (s = bc(s, t, n, r, i + 1, a)), i >= n && (s = t < 0 ? o.contentMatchAt(0).fillBefore(s, a <= i).append(s) : s.append(o.contentMatchAt(o.childCount).fillBefore(E.empty, !0))), e.replaceChild(t < 0 ? 0 : e.childCount - 1, o.copy(s))
}

function xc(e, t, n) {
    return t < e.openStart && (e = new O(bc(e.content, -1, t, e.openStart, 0, e.openEnd), t, e.openEnd)), n < e.openEnd && (e = new O(bc(e.content, 1, n, e.openEnd, 0, 0), e.openStart, n)), e
}
var Sc = {
        thead: [`table`],
        tbody: [`table`],
        tfoot: [`table`],
        caption: [`table`],
        colgroup: [`table`],
        col: [`table`, `colgroup`],
        tr: [`table`, `tbody`],
        td: [`table`, `tbody`, `tr`],
        th: [`table`, `tbody`, `tr`]
    },
    Cc = null;

function wc() {
    return Cc || = document.implementation.createHTMLDocument(`title`)
}
var Tc = null;

function Ec(e) {
    let t = window.trustedTypes;
    return t ? (Tc || = t.defaultPolicy || t.createPolicy(`ProseMirrorClipboard`, {
        createHTML: e => e
    }), Tc.createHTML(e)) : e
}

function Dc(e) {
    let t = /^(\s*<meta [^>]*>)*/.exec(e);
    t && (e = e.slice(t[0].length));
    let n = wc().createElement(`div`),
        r = /<([a-z][^>\s]+)/i.exec(e),
        i;
    if ((i = r && Sc[r[1].toLowerCase()]) && (e = i.map(e => `<` + e + `>`).join(``) + e + i.map(e => `</` + e + `>`).reverse().join(``)), n.innerHTML = Ec(e), i)
        for (let e = 0; e < i.length; e++) n = n.querySelector(i[e]) || n;
    return n
}

function Oc(e) {
    let t = e.querySelectorAll(W ? `span:not([class]):not([style])` : `span.Apple-converted-space`);
    for (let n = 0; n < t.length; n++) {
        let r = t[n];
        r.childNodes.length == 1 && r.textContent == `\xA0` && r.parentNode && r.parentNode.replaceChild(e.ownerDocument.createTextNode(` `), r)
    }
}

function kc(e, t) {
    if (!e.size) return e;
    let n = e.content.firstChild.type.schema,
        r;
    try {
        r = JSON.parse(t)
    } catch {
        return e
    }
    let {
        content: i,
        openStart: a,
        openEnd: o
    } = e;
    for (let e = r.length - 2; e >= 0; e -= 2) {
        let t = n.nodes[r[e]];
        if (!t || t.hasRequiredAttrs()) break;
        i = E.from(t.create(r[e + 1], i)), a++, o++
    }
    return new O(i, a, o)
}
var Y = {},
    X = {},
    Ac = {
        touchstart: !0,
        touchmove: !0
    },
    jc = class {
        constructor() {
            this.shiftKey = !1, this.mouseDown = null, this.lastKeyCode = null, this.lastKeyCodeTime = 0, this.lastClick = {
                time: 0,
                x: 0,
                y: 0,
                type: ``,
                button: 0
            }, this.lastSelectionOrigin = null, this.lastSelectionTime = 0, this.lastIOSEnter = 0, this.lastIOSEnterFallbackTimeout = -1, this.lastFocus = 0, this.lastTouch = 0, this.lastChromeDelete = 0, this.composing = !1, this.compositionNode = null, this.composingTimeout = -1, this.compositionNodes = [], this.compositionEndedAt = -2e8, this.compositionID = 1, this.badSafariComposition = !1, this.compositionPendingChanges = 0, this.domChangeCount = 0, this.eventHandlers = Object.create(null), this.hideSelectionGuard = null
        }
    };

function Mc(e) {
    for (let t in Y) {
        let n = Y[t];
        e.dom.addEventListener(t, e.input.eventHandlers[t] = t => {
            Lc(e, t) && !Ic(e, t) && (e.editable || !(t.type in X)) && n(e, t)
        }, Ac[t] ? {
            passive: !0
        } : void 0)
    }
    G && e.dom.addEventListener(`input`, () => null), Fc(e)
}

function Nc(e, t) {
    e.input.lastSelectionOrigin = t, e.input.lastSelectionTime = Date.now()
}

function Pc(e) {
    e.domObserver.stop();
    for (let t in e.input.eventHandlers) e.dom.removeEventListener(t, e.input.eventHandlers[t]);
    clearTimeout(e.input.composingTimeout), clearTimeout(e.input.lastIOSEnterFallbackTimeout)
}

function Fc(e) {
    e.someProp(`handleDOMEvents`, t => {
        for (let n in t) e.input.eventHandlers[n] || e.dom.addEventListener(n, e.input.eventHandlers[n] = t => Ic(e, t))
    })
}

function Ic(e, t) {
    return e.someProp(`handleDOMEvents`, n => {
        let r = n[t.type];
        return r ? r(e, t) || t.defaultPrevented : !1
    })
}

function Lc(e, t) {
    if (!t.bubbles) return !0;
    if (t.defaultPrevented) return !1;
    for (let n = t.target; n != e.dom; n = n.parentNode)
        if (!n || n.nodeType == 11 || n.pmViewDesc && n.pmViewDesc.stopEvent(t)) return !1;
    return !0
}

function Rc(e, t) {
    !Ic(e, t) && Y[t.type] && (e.editable || !(t.type in X)) && Y[t.type](e, t)
}
X.keydown = (e, t) => {
    let n = t;
    if (e.input.shiftKey = n.keyCode == 16 || n.shiftKey, !Qc(e, n) && (e.input.lastKeyCode = n.keyCode, e.input.lastKeyCodeTime = Date.now(), !(wo && W && n.keyCode == 13)))
        if (n.keyCode != 229 && e.domObserver.forceFlush(), So && n.keyCode == 13 && !n.ctrlKey && !n.altKey && !n.metaKey) {
            let t = Date.now();
            e.input.lastIOSEnter = t, e.input.lastIOSEnterFallbackTimeout = setTimeout(() => {
                e.input.lastIOSEnter == t && (e.someProp(`handleKeyDown`, t => t(e, uo(13, `Enter`))), e.input.lastIOSEnter = 0)
            }, 200)
        } else e.someProp(`handleKeyDown`, t => t(e, n)) || fc(e, n) ? n.preventDefault() : Nc(e, `key`)
}, X.keyup = (e, t) => {
    t.keyCode == 16 && (e.input.shiftKey = !1)
}, X.keypress = (e, t) => {
    let n = t;
    if (Qc(e, n) || !n.charCode || n.ctrlKey && !n.altKey || K && n.metaKey) return;
    if (e.someProp(`handleKeyPress`, t => t(e, n))) {
        n.preventDefault();
        return
    }
    let r = e.state.selection;
    if (!(r instanceof P) || !r.$from.sameParent(r.$to)) {
        let t = String.fromCharCode(n.charCode),
            i = () => e.state.tr.insertText(t).scrollIntoView();
        !/[\r\n]/.test(t) && !e.someProp(`handleTextInput`, n => n(e, r.$from.pos, r.$to.pos, t, i)) && e.dispatch(i()), n.preventDefault()
    }
};

function zc(e) {
    return {
        left: e.clientX,
        top: e.clientY
    }
}

function Bc(e, t) {
    let n = t.x - e.clientX,
        r = t.y - e.clientY;
    return n * n + r * r < 100
}

function Vc(e, t, n, r, i) {
    if (r == -1) return !1;
    let a = e.state.doc.resolve(r);
    for (let r = a.depth + 1; r > 0; r--)
        if (e.someProp(t, t => r > a.depth ? t(e, n, a.nodeAfter, a.before(r), i, !0) : t(e, n, a.node(r), a.before(r), i, !1))) return !0;
    return !1
}

function Hc(e, t, n) {
    if (e.focused || e.focus(), e.state.selection.eq(t)) return;
    let r = e.state.tr.setSelection(t);
    n == `pointer` && r.setMeta(`pointer`, !0), e.dispatch(r)
}

function Uc(e, t) {
    if (t == -1) return !1;
    let n = e.state.doc.resolve(t),
        r = n.nodeAfter;
    return r && r.isAtom && F.isSelectable(r) ? (Hc(e, new F(n), `pointer`), !0) : !1
}

function Wc(e, t) {
    if (t == -1) return !1;
    let n = e.state.selection,
        r, i;
    n instanceof F && (r = n.node);
    let a = e.state.doc.resolve(t);
    for (let e = a.depth + 1; e > 0; e--) {
        let t = e > a.depth ? a.nodeAfter : a.node(e);
        if (F.isSelectable(t)) {
            i = r && n.$from.depth > 0 && e >= n.$from.depth && a.before(n.$from.depth + 1) == n.$from.pos ? a.before(n.$from.depth) : a.before(e);
            break
        }
    }
    return i == null ? !1 : (Hc(e, F.create(e.state.doc, i), `pointer`), !0)
}

function Gc(e, t, n, r, i) {
    return Vc(e, `handleClickOn`, t, n, r) || e.someProp(`handleClick`, n => n(e, t, r)) || (i ? Wc(e, n) : Uc(e, n))
}

function Kc(e, t, n, r) {
    return Vc(e, `handleDoubleClickOn`, t, n, r) || e.someProp(`handleDoubleClick`, n => n(e, t, r))
}

function qc(e, t, n, r) {
    return Vc(e, `handleTripleClickOn`, t, n, r) || e.someProp(`handleTripleClick`, n => n(e, t, r)) || Jc(e, n, r)
}

function Jc(e, t, n) {
    if (n.button != 0) return !1;
    let r = e.state.doc;
    if (t == -1) return r.inlineContent ? (Hc(e, P.create(r, 0, r.content.size), `pointer`), !0) : !1;
    let i = r.resolve(t);
    for (let t = i.depth + 1; t > 0; t--) {
        let n = t > i.depth ? i.nodeAfter : i.node(t),
            a = i.before(t);
        if (n.inlineContent) Hc(e, P.create(r, a + 1, a + 1 + n.content.size), `pointer`);
        else if (F.isSelectable(n)) Hc(e, F.create(r, a), `pointer`);
        else continue;
        return !0
    }
}

function Yc(e) {
    return al(e)
}
var Xc = K ? `metaKey` : `ctrlKey`;
Y.mousedown = (e, t) => {
    let n = t;
    e.input.shiftKey = n.shiftKey;
    let r = Yc(e),
        i = Date.now(),
        a = `singleClick`;
    i - e.input.lastClick.time < 500 && Bc(n, e.input.lastClick) && !n[Xc] && e.input.lastClick.button == n.button && (e.input.lastClick.type == `singleClick` ? a = `doubleClick` : e.input.lastClick.type == `doubleClick` && (a = `tripleClick`)), e.input.lastClick = {
        time: i,
        x: n.clientX,
        y: n.clientY,
        type: a,
        button: n.button
    };
    let o = e.posAtCoords(zc(n));
    o && (a == `singleClick` ? (e.input.mouseDown && e.input.mouseDown.done(), e.input.mouseDown = new Zc(e, o, n, !!r)) : (a == `doubleClick` ? Kc : qc)(e, o.pos, o.inside, n) ? n.preventDefault() : Nc(e, `pointer`))
};
var Zc = class {
    constructor(e, t, n, r) {
        this.view = e, this.pos = t, this.event = n, this.flushed = r, this.delayedSelectionSync = !1, this.mightDrag = null, this.startDoc = e.state.doc, this.selectNode = !!n[Xc], this.allowDefault = n.shiftKey;
        let i, a;
        if (t.inside > -1) i = e.state.doc.nodeAt(t.inside), a = t.inside;
        else {
            let n = e.state.doc.resolve(t.pos);
            i = n.parent, a = n.depth ? n.before() : 0
        }
        let o = r ? null : n.target,
            s = o ? e.docView.nearestDesc(o, !0) : null;
        this.target = s && s.nodeDOM.nodeType == 1 ? s.nodeDOM : null;
        let {
            selection: c
        } = e.state;
        n.button == 0 && (i.type.spec.draggable && i.type.spec.selectable !== !1 || c instanceof F && c.from <= a && c.to > a) && (this.mightDrag = {
            node: i,
            pos: a,
            addAttr: !!(this.target && !this.target.draggable),
            setUneditable: !!(this.target && U && !this.target.hasAttribute(`contentEditable`))
        }), this.target && this.mightDrag && (this.mightDrag.addAttr || this.mightDrag.setUneditable) && (this.view.domObserver.stop(), this.mightDrag.addAttr && (this.target.draggable = !0), this.mightDrag.setUneditable && setTimeout(() => {
            this.view.input.mouseDown == this && this.target.setAttribute(`contentEditable`, `false`)
        }, 20), this.view.domObserver.start()), e.root.addEventListener(`mouseup`, this.up = this.up.bind(this)), e.root.addEventListener(`mousemove`, this.move = this.move.bind(this)), Nc(e, `pointer`)
    }
    done() {
        this.view.root.removeEventListener(`mouseup`, this.up), this.view.root.removeEventListener(`mousemove`, this.move), this.mightDrag && this.target && (this.view.domObserver.stop(), this.mightDrag.addAttr && this.target.removeAttribute(`draggable`), this.mightDrag.setUneditable && this.target.removeAttribute(`contentEditable`), this.view.domObserver.start()), this.delayedSelectionSync && setTimeout(() => Fs(this.view)), this.view.input.mouseDown = null
    }
    up(e) {
        if (this.done(), !this.view.dom.contains(e.target)) return;
        let t = this.pos;
        this.view.state.doc != this.startDoc && (t = this.view.posAtCoords(zc(e))), this.updateAllowDefault(e), this.allowDefault || !t ? Nc(this.view, `pointer`) : Gc(this.view, t.pos, t.inside, e, this.selectNode) ? e.preventDefault() : e.button == 0 && (this.flushed || G && this.mightDrag && !this.mightDrag.node.isAtom || W && !this.view.state.selection.visible && Math.min(Math.abs(t.pos - this.view.state.selection.from), Math.abs(t.pos - this.view.state.selection.to)) <= 2) ? (Hc(this.view, N.near(this.view.state.doc.resolve(t.pos)), `pointer`), e.preventDefault()) : Nc(this.view, `pointer`)
    }
    move(e) {
        this.updateAllowDefault(e), Nc(this.view, `pointer`), e.buttons == 0 && this.done()
    }
    updateAllowDefault(e) {
        !this.allowDefault && (Math.abs(this.event.x - e.clientX) > 4 || Math.abs(this.event.y - e.clientY) > 4) && (this.allowDefault = !0)
    }
};
Y.touchstart = e => {
    e.input.lastTouch = Date.now(), Yc(e), Nc(e, `pointer`)
}, Y.touchmove = e => {
    e.input.lastTouch = Date.now(), Nc(e, `pointer`)
}, Y.contextmenu = e => Yc(e);

function Qc(e, t) {
    return e.composing ? !0 : G && Math.abs(t.timeStamp - e.input.compositionEndedAt) < 500 ? (e.input.compositionEndedAt = -2e8, !0) : !1
}
var $c = wo ? 5e3 : -1;
X.compositionstart = X.compositionupdate = e => {
    if (!e.composing) {
        e.domObserver.flush();
        let {
            state: t
        } = e, n = t.selection.$to;
        if (t.selection instanceof P && (t.storedMarks || !n.textOffset && n.parentOffset && n.nodeBefore.marks.some(e => e.type.spec.inclusive === !1) || W && Co && el(e))) e.markCursor = e.state.storedMarks || n.marks(), al(e, !0), e.markCursor = null;
        else if (al(e, !t.selection.empty), U && t.selection.empty && n.parentOffset && !n.textOffset && n.nodeBefore.marks.length) {
            let t = e.domSelectionRange();
            for (let n = t.focusNode, r = t.focusOffset; n && n.nodeType == 1 && r != 0;) {
                let t = r < 0 ? n.lastChild : n.childNodes[r - 1];
                if (!t) break;
                if (t.nodeType == 3) {
                    let n = e.domSelection();
                    n && n.collapse(t, t.nodeValue.length);
                    break
                } else n = t, r = -1
            }
        }
        e.input.composing = !0
    }
    tl(e, $c)
};

function el(e) {
    let {
        focusNode: t,
        focusOffset: n
    } = e.domSelectionRange();
    if (!t || t.nodeType != 1 || n >= t.childNodes.length) return !1;
    let r = t.childNodes[n];
    return r.nodeType == 1 && r.contentEditable == `false`
}
X.compositionend = (e, t) => {
    e.composing && (e.input.composing = !1, e.input.compositionEndedAt = t.timeStamp, e.input.compositionPendingChanges = e.domObserver.pendingRecords().length ? e.input.compositionID : 0, e.input.compositionNode = null, e.input.badSafariComposition ? e.domObserver.forceFlush() : e.input.compositionPendingChanges && Promise.resolve().then(() => e.domObserver.flush()), e.input.compositionID++, tl(e, 20))
};

function tl(e, t) {
    clearTimeout(e.input.composingTimeout), t > -1 && (e.input.composingTimeout = setTimeout(() => al(e), t))
}

function nl(e) {
    for (e.composing && (e.input.composing = !1, e.input.compositionEndedAt = il()); e.input.compositionNodes.length > 0;) e.input.compositionNodes.pop().markParentsDirty()
}

function rl(e) {
    let t = e.domSelectionRange();
    if (!t.focusNode) return null;
    let n = ao(t.focusNode, t.focusOffset),
        r = oo(t.focusNode, t.focusOffset);
    if (n && r && n != r) {
        let t = r.pmViewDesc,
            i = e.domObserver.lastChangedTextNode;
        if (n == i || r == i) return i;
        if (!t || !t.isText(r.nodeValue)) return r;
        if (e.input.compositionNode == r) {
            let e = n.pmViewDesc;
            if (!(!e || !e.isText(n.nodeValue))) return r
        }
    }
    return n || r
}

function il() {
    let e = document.createEvent(`Event`);
    return e.initEvent(`event`, !0, !0), e.timeStamp
}

function al(e, t = !1) {
    if (!(wo && e.domObserver.flushingSoon >= 0)) {
        if (e.domObserver.forceFlush(), nl(e), t || e.docView && e.docView.dirty) {
            let n = Ns(e),
                r = e.state.selection;
            return n && !n.eq(r) ? e.dispatch(e.state.tr.setSelection(n)) : (e.markCursor || t) && !r.$from.node(r.$from.sharedDepth(r.to)).inlineContent ? e.dispatch(e.state.tr.deleteSelection()) : e.updateState(e.state), !0
        }
        return !1
    }
}

function ol(e, t) {
    if (!e.dom.parentNode) return;
    let n = e.dom.parentNode.appendChild(document.createElement(`div`));
    n.appendChild(t), n.style.cssText = `position: fixed; left: -10000px; top: 10px`;
    let r = getSelection(),
        i = document.createRange();
    i.selectNodeContents(t), e.dom.blur(), r.removeAllRanges(), r.addRange(i), setTimeout(() => {
        n.parentNode && n.parentNode.removeChild(n), e.focus()
    }, 50)
}
var sl = H && yo < 15 || So && Eo < 604;
Y.copy = X.cut = (e, t) => {
    let n = t,
        r = e.state.selection,
        i = n.type == `cut`;
    if (r.empty) return;
    let a = sl ? null : n.clipboardData,
        {
            dom: o,
            text: s
        } = pc(e, r.content());
    a ? (n.preventDefault(), a.clearData(), a.setData(`text/html`, o.innerHTML), a.setData(`text/plain`, s)) : ol(e, o), i && e.dispatch(e.state.tr.deleteSelection().scrollIntoView().setMeta(`uiEvent`, `cut`))
};

function cl(e) {
    return e.openStart == 0 && e.openEnd == 0 && e.content.childCount == 1 ? e.content.firstChild : null
}

function ll(e, t) {
    if (!e.dom.parentNode) return;
    let n = e.input.shiftKey || e.state.selection.$from.parent.type.spec.code,
        r = e.dom.parentNode.appendChild(document.createElement(n ? `textarea` : `div`));
    n || (r.contentEditable = `true`), r.style.cssText = `position: fixed; left: -10000px; top: 10px`, r.focus();
    let i = e.input.shiftKey && e.input.lastKeyCode != 45;
    setTimeout(() => {
        e.focus(), r.parentNode && r.parentNode.removeChild(r), n ? ul(e, r.value, null, i, t) : ul(e, r.textContent, r.innerHTML, i, t)
    }, 50)
}

function ul(e, t, n, r, i) {
    let a = mc(e, t, n, r, e.state.selection.$from);
    if (e.someProp(`handlePaste`, t => t(e, i, a || O.empty))) return !0;
    if (!a) return !1;
    let o = cl(a),
        s = o ? e.state.tr.replaceSelectionWith(o, r) : e.state.tr.replaceSelection(a);
    return e.dispatch(s.scrollIntoView().setMeta(`paste`, !0).setMeta(`uiEvent`, `paste`)), !0
}

function dl(e) {
    let t = e.getData(`text/plain`) || e.getData(`Text`);
    if (t) return t;
    let n = e.getData(`text/uri-list`);
    return n ? n.replace(/\r?\n/g, ` `) : ``
}
X.paste = (e, t) => {
    let n = t;
    if (e.composing && !wo) return;
    let r = sl ? null : n.clipboardData,
        i = e.input.shiftKey && e.input.lastKeyCode != 45;
    r && ul(e, dl(r), r.getData(`text/html`), i, n) ? n.preventDefault() : ll(e, n)
};
var fl = class {
        constructor(e, t, n) {
            this.slice = e, this.move = t, this.node = n
        }
    },
    pl = K ? `altKey` : `ctrlKey`;

function ml(e, t) {
    let n;
    return e.someProp(`dragCopies`, e => {
        n || = e(t)
    }), n == null ? !t[pl] : !n
}
Y.dragstart = (e, t) => {
    let n = t,
        r = e.input.mouseDown;
    if (r && r.done(), !n.dataTransfer) return;
    let i = e.state.selection,
        a = i.empty ? null : e.posAtCoords(zc(n)),
        o;
    if (!(a && a.pos >= i.from && a.pos <= (i instanceof F ? i.to - 1 : i.to))) {
        if (r && r.mightDrag) o = F.create(e.state.doc, r.mightDrag.pos);
        else if (n.target && n.target.nodeType == 1) {
            let t = e.docView.nearestDesc(n.target, !0);
            t && t.node.type.spec.draggable && t != e.docView && (o = F.create(e.state.doc, t.posBefore))
        }
    }
    let {
        dom: s,
        text: c,
        slice: l
    } = pc(e, (o || e.state.selection).content());
    (!n.dataTransfer.files.length || !W || xo > 120) && n.dataTransfer.clearData(), n.dataTransfer.setData(sl ? `Text` : `text/html`, s.innerHTML), n.dataTransfer.effectAllowed = `copyMove`, sl || n.dataTransfer.setData(`text/plain`, c), e.dragging = new fl(l, ml(e, n), o)
}, Y.dragend = e => {
    let t = e.dragging;
    window.setTimeout(() => {
        e.dragging == t && (e.dragging = null)
    }, 50)
}, X.dragover = X.dragenter = (e, t) => t.preventDefault(), X.drop = (e, t) => {
    try {
        hl(e, t, e.dragging)
    } finally {
        e.dragging = null
    }
};

function hl(e, t, n) {
    if (!t.dataTransfer) return;
    let r = e.posAtCoords(zc(t));
    if (!r) return;
    let i = e.state.doc.resolve(r.pos),
        a = n && n.slice;
    a ? e.someProp(`transformPasted`, t => {
        a = t(a, e, !1)
    }) : a = mc(e, dl(t.dataTransfer), sl ? null : t.dataTransfer.getData(`text/html`), !1, i);
    let o = !!(n && ml(e, t));
    if (e.someProp(`handleDrop`, n => n(e, t, a || O.empty, o))) {
        t.preventDefault();
        return
    }
    if (!a) return;
    t.preventDefault();
    let s = a ? Rr(e.state.doc, i.pos, a) : i.pos;
    s ? ? = i.pos;
    let c = e.state.tr;
    if (o) {
        let {
            node: e
        } = n;
        e ? e.replace(c) : c.deleteSelection()
    }
    let l = c.mapping.map(s),
        u = a.openStart == 0 && a.openEnd == 0 && a.content.childCount == 1,
        d = c.doc;
    if (u ? c.replaceRangeWith(l, l, a.content.firstChild) : c.replaceRange(l, l, a), c.doc.eq(d)) return;
    let f = c.doc.resolve(l);
    if (u && F.isSelectable(a.content.firstChild) && f.nodeAfter && f.nodeAfter.sameMarkup(a.content.firstChild)) c.setSelection(new F(f));
    else {
        let t = c.mapping.map(s);
        c.mapping.maps[c.mapping.maps.length - 1].forEach((e, n, r, i) => t = i), c.setSelection(Ws(e, f, c.doc.resolve(t)))
    }
    e.focus(), e.dispatch(c.setMeta(`uiEvent`, `drop`))
}
Y.focus = e => {
    e.input.lastFocus = Date.now(), e.focused || (e.domObserver.stop(), e.dom.classList.add(`ProseMirror-focused`), e.domObserver.start(), e.focused = !0, setTimeout(() => {
        e.docView && e.hasFocus() && !e.domObserver.currentSelection.eq(e.domSelectionRange()) && Fs(e)
    }, 20))
}, Y.blur = (e, t) => {
    let n = t;
    e.focused && = (e.domObserver.stop(), e.dom.classList.remove(`ProseMirror-focused`), e.domObserver.start(), n.relatedTarget && e.dom.contains(n.relatedTarget) && e.domObserver.currentSelection.clear(), !1)
}, Y.beforeinput = (e, t) => {
    if (W && wo && t.inputType == `deleteContentBackward`) {
        e.domObserver.flushSoon();
        let {
            domChangeCount: t
        } = e.input;
        setTimeout(() => {
            if (e.input.domChangeCount != t || (e.dom.blur(), e.focus(), e.someProp(`handleKeyDown`, t => t(e, uo(8, `Backspace`))))) return;
            let {
                $cursor: n
            } = e.state.selection;
            n && n.pos > 0 && e.dispatch(e.state.tr.delete(n.pos - 1, n.pos).scrollIntoView())
        }, 50)
    }
};
for (let e in X) Y[e] = X[e];

function gl(e, t) {
    if (e == t) return !0;
    for (let n in e)
        if (e[n] !== t[n]) return !1;
    for (let n in t)
        if (!(n in e)) return !1;
    return !0
}
var _l = class e {
        constructor(e, t) {
            this.toDOM = e, this.spec = t || Sl, this.side = this.spec.side || 0
        }
        map(e, t, n, r) {
            let {
                pos: i,
                deleted: a
            } = e.mapResult(t.from + r, this.side < 0 ? -1 : 1);
            return a ? null : new bl(i - n, i - n, this)
        }
        valid() {
            return !0
        }
        eq(t) {
            return this == t || t instanceof e && (this.spec.key && this.spec.key == t.spec.key || this.toDOM == t.toDOM && gl(this.spec, t.spec))
        }
        destroy(e) {
            this.spec.destroy && this.spec.destroy(e)
        }
    },
    vl = class e {
        constructor(e, t) {
            this.attrs = e, this.spec = t || Sl
        }
        map(e, t, n, r) {
            let i = e.map(t.from + r, this.spec.inclusiveStart ? -1 : 1) - n,
                a = e.map(t.to + r, this.spec.inclusiveEnd ? 1 : -1) - n;
            return i >= a ? null : new bl(i, a, this)
        }
        valid(e, t) {
            return t.from < t.to
        }
        eq(t) {
            return this == t || t instanceof e && gl(this.attrs, t.attrs) && gl(this.spec, t.spec)
        }
        static is(t) {
            return t.type instanceof e
        }
        destroy() {}
    },
    yl = class e {
        constructor(e, t) {
            this.attrs = e, this.spec = t || Sl
        }
        map(e, t, n, r) {
            let i = e.mapResult(t.from + r, 1);
            if (i.deleted) return null;
            let a = e.mapResult(t.to + r, -1);
            return a.deleted || a.pos <= i.pos ? null : new bl(i.pos - n, a.pos - n, this)
        }
        valid(e, t) {
            let {
                index: n,
                offset: r
            } = e.content.findIndex(t.from), i;
            return r == t.from && !(i = e.child(n)).isText && r + i.nodeSize == t.to
        }
        eq(t) {
            return this == t || t instanceof e && gl(this.attrs, t.attrs) && gl(this.spec, t.spec)
        }
        destroy() {}
    },
    bl = class e {
        constructor(e, t, n) {
            this.from = e, this.to = t, this.type = n
        }
        copy(t, n) {
            return new e(t, n, this.type)
        }
        eq(e, t = 0) {
            return this.type.eq(e.type) && this.from + t == e.from && this.to + t == e.to
        }
        map(e, t, n) {
            return this.type.map(e, this, t, n)
        }
        static widget(t, n, r) {
            return new e(t, t, new _l(n, r))
        }
        static inline(t, n, r, i) {
            return new e(t, n, new vl(r, i))
        }
        static node(t, n, r, i) {
            return new e(t, n, new yl(r, i))
        }
        get spec() {
            return this.type.spec
        }
        get inline() {
            return this.type instanceof vl
        }
        get widget() {
            return this.type instanceof _l
        }
    },
    xl = [],
    Sl = {},
    Z = class e {
        constructor(e, t) {
            this.local = e.length ? e : xl, this.children = t.length ? t : xl
        }
        static create(e, t) {
            return t.length ? kl(t, e, 0, Sl) : Q
        }
        find(e, t, n) {
            let r = [];
            return this.findInner(e ? ? 0, t ? ? 1e9, r, 0, n), r
        }
        findInner(e, t, n, r, i) {
            for (let a = 0; a < this.local.length; a++) {
                let o = this.local[a];
                o.from <= t && o.to >= e && (!i || i(o.spec)) && n.push(o.copy(o.from + r, o.to + r))
            }
            for (let a = 0; a < this.children.length; a += 3)
                if (this.children[a] < t && this.children[a + 1] > e) {
                    let o = this.children[a] + 1;
                    this.children[a + 2].findInner(e - o, t - o, n, r + o, i)
                }
        }
        map(e, t, n) {
            return this == Q || e.maps.length == 0 ? this : this.mapInner(e, t, 0, 0, n || Sl)
        }
        mapInner(t, n, r, i, a) {
            let o;
            for (let e = 0; e < this.local.length; e++) {
                let s = this.local[e].map(t, r, i);
                s && s.type.valid(n, s) ? (o || = []).push(s) : a.onRemove && a.onRemove(this.local[e].spec)
            }
            return this.children.length ? wl(this.children, o || [], t, n, r, i, a) : o ? new e(o.sort(Al), xl) : Q
        }
        add(t, n) {
            return n.length ? this == Q ? e.create(t, n) : this.addInner(t, n, 0) : this
        }
        addInner(t, n, r) {
            let i, a = 0;
            t.forEach((e, t) => {
                let o = t + r,
                    s;
                if (s = Dl(n, e, o)) {
                    for (i || = this.children.slice(); a < i.length && i[a] < t;) a += 3;
                    i[a] == t ? i[a + 2] = i[a + 2].addInner(e, s, o + 1) : i.splice(a, 0, t, t + e.nodeSize, kl(s, e, o + 1, Sl)), a += 3
                }
            });
            let o = Tl(a ? Ol(n) : n, -r);
            for (let e = 0; e < o.length; e++) o[e].type.valid(t, o[e]) || o.splice(e--, 1);
            return new e(o.length ? this.local.concat(o).sort(Al) : this.local, i || this.children)
        }
        remove(e) {
            return e.length == 0 || this == Q ? this : this.removeInner(e, 0)
        }
        removeInner(t, n) {
            let r = this.children,
                i = this.local;
            for (let e = 0; e < r.length; e += 3) {
                let i, a = r[e] + n,
                    o = r[e + 1] + n;
                for (let e = 0, n; e < t.length; e++)(n = t[e]) && n.from > a && n.to < o && (t[e] = null, (i || = []).push(n));
                if (!i) continue;
                r == this.children && (r = this.children.slice());
                let s = r[e + 2].removeInner(i, a + 1);
                s == Q ? (r.splice(e, 3), e -= 3) : r[e + 2] = s
            }
            if (i.length) {
                for (let e = 0, r; e < t.length; e++)
                    if (r = t[e])
                        for (let e = 0; e < i.length; e++) i[e].eq(r, n) && (i == this.local && (i = this.local.slice()), i.splice(e--, 1))
            }
            return r == this.children && i == this.local ? this : i.length || r.length ? new e(i, r) : Q
        }
        forChild(t, n) {
            if (this == Q) return this;
            if (n.isLeaf) return e.empty;
            let r, i;
            for (let e = 0; e < this.children.length; e += 3)
                if (this.children[e] >= t) {
                    this.children[e] == t && (r = this.children[e + 2]);
                    break
                }
            let a = t + 1,
                o = a + n.content.size;
            for (let e = 0; e < this.local.length; e++) {
                let t = this.local[e];
                if (t.from < o && t.to > a && t.type instanceof vl) {
                    let e = Math.max(a, t.from) - a,
                        n = Math.min(o, t.to) - a;
                    e < n && (i || = []).push(t.copy(e, n))
                }
            }
            if (i) {
                let t = new e(i.sort(Al), xl);
                return r ? new Cl([t, r]) : t
            }
            return r || Q
        }
        eq(t) {
            if (this == t) return !0;
            if (!(t instanceof e) || this.local.length != t.local.length || this.children.length != t.children.length) return !1;
            for (let e = 0; e < this.local.length; e++)
                if (!this.local[e].eq(t.local[e])) return !1;
            for (let e = 0; e < this.children.length; e += 3)
                if (this.children[e] != t.children[e] || this.children[e + 1] != t.children[e + 1] || !this.children[e + 2].eq(t.children[e + 2])) return !1;
            return !0
        }
        locals(e) {
            return jl(this.localsInner(e))
        }
        localsInner(e) {
            if (this == Q) return xl;
            if (e.inlineContent || !this.local.some(vl.is)) return this.local;
            let t = [];
            for (let e = 0; e < this.local.length; e++) this.local[e].type instanceof vl || t.push(this.local[e]);
            return t
        }
        forEachSet(e) {
            e(this)
        }
    };
Z.empty = new Z([], []), Z.removeOverlap = jl;
var Q = Z.empty,
    Cl = class e {
        constructor(e) {
            this.members = e
        }
        map(t, n) {
            let r = this.members.map(e => e.map(t, n, Sl));
            return e.from(r)
        }
        forChild(t, n) {
            if (n.isLeaf) return Z.empty;
            let r = [];
            for (let i = 0; i < this.members.length; i++) {
                let a = this.members[i].forChild(t, n);
                a != Q && (a instanceof e ? r = r.concat(a.members) : r.push(a))
            }
            return e.from(r)
        }
        eq(t) {
            if (!(t instanceof e) || t.members.length != this.members.length) return !1;
            for (let e = 0; e < this.members.length; e++)
                if (!this.members[e].eq(t.members[e])) return !1;
            return !0
        }
        locals(e) {
            let t, n = !0;
            for (let r = 0; r < this.members.length; r++) {
                let i = this.members[r].localsInner(e);
                if (i.length)
                    if (!t) t = i;
                    else {
                        n && = (t = t.slice(), !1);
                        for (let e = 0; e < i.length; e++) t.push(i[e])
                    }
            }
            return t ? jl(n ? t : t.sort(Al)) : xl
        }
        static from(t) {
            switch (t.length) {
                case 0:
                    return Q;
                case 1:
                    return t[0];
                default:
                    return new e(t.every(e => e instanceof Z) ? t : t.reduce((e, t) => e.concat(t instanceof Z ? t : t.members), []))
            }
        }
        forEachSet(e) {
            for (let t = 0; t < this.members.length; t++) this.members[t].forEachSet(e)
        }
    };

function wl(e, t, n, r, i, a, o) {
    let s = e.slice();
    for (let e = 0, t = a; e < n.maps.length; e++) {
        let r = 0;
        n.maps[e].forEach((e, n, i, a) => {
            let o = a - i - (n - e);
            for (let i = 0; i < s.length; i += 3) {
                let a = s[i + 1];
                if (a < 0 || e > a + t - r) continue;
                let c = s[i] + t - r;
                n >= c ? s[i + 1] = e <= c ? -2 : -1 : e >= t && o && (s[i] += o, s[i + 1] += o)
            }
            r += o
        }), t = n.maps[e].map(t, -1)
    }
    let c = !1;
    for (let t = 0; t < s.length; t += 3)
        if (s[t + 1] < 0) {
            if (s[t + 1] == -2) {
                c = !0, s[t + 1] = -1;
                continue
            }
            let l = n.map(e[t] + a),
                u = l - i;
            if (u < 0 || u >= r.content.size) {
                c = !0;
                continue
            }
            let d = n.map(e[t + 1] + a, -1) - i,
                {
                    index: f,
                    offset: p
                } = r.content.findIndex(u),
                m = r.maybeChild(f);
            if (m && p == u && p + m.nodeSize == d) {
                let r = s[t + 2].mapInner(n, m, l + 1, e[t] + a + 1, o);
                r == Q ? (s[t + 1] = -2, c = !0) : (s[t] = u, s[t + 1] = d, s[t + 2] = r)
            } else c = !0
        }
    if (c) {
        let c = kl(El(s, e, t, n, i, a, o), r, 0, o);
        t = c.local;
        for (let e = 0; e < s.length; e += 3) s[e + 1] < 0 && (s.splice(e, 3), e -= 3);
        for (let e = 0, t = 0; e < c.children.length; e += 3) {
            let n = c.children[e];
            for (; t < s.length && s[t] < n;) t += 3;
            s.splice(t, 0, c.children[e], c.children[e + 1], c.children[e + 2])
        }
    }
    return new Z(t.sort(Al), s)
}

function Tl(e, t) {
    if (!t || !e.length) return e;
    let n = [];
    for (let r = 0; r < e.length; r++) {
        let i = e[r];
        n.push(new bl(i.from + t, i.to + t, i.type))
    }
    return n
}

function El(e, t, n, r, i, a, o) {
    function s(e, t) {
        for (let a = 0; a < e.local.length; a++) {
            let s = e.local[a].map(r, i, t);
            s ? n.push(s) : o.onRemove && o.onRemove(e.local[a].spec)
        }
        for (let n = 0; n < e.children.length; n += 3) s(e.children[n + 2], e.children[n] + t + 1)
    }
    for (let n = 0; n < e.length; n += 3) e[n + 1] == -1 && s(e[n + 2], t[n] + a + 1);
    return n
}

function Dl(e, t, n) {
    if (t.isLeaf) return null;
    let r = n + t.nodeSize,
        i = null;
    for (let t = 0, a; t < e.length; t++)(a = e[t]) && a.from > n && a.to < r && ((i || = []).push(a), e[t] = null);
    return i
}

function Ol(e) {
    let t = [];
    for (let n = 0; n < e.length; n++) e[n] != null && t.push(e[n]);
    return t
}

function kl(e, t, n, r) {
    let i = [],
        a = !1;
    t.forEach((t, o) => {
        let s = Dl(e, t, o + n);
        if (s) {
            a = !0;
            let e = kl(s, t, n + o + 1, r);
            e != Q && i.push(o, o + t.nodeSize, e)
        }
    });
    let o = Tl(a ? Ol(e) : e, -n).sort(Al);
    for (let e = 0; e < o.length; e++) o[e].type.valid(t, o[e]) || (r.onRemove && r.onRemove(o[e].spec), o.splice(e--, 1));
    return o.length || i.length ? new Z(o, i) : Q
}

function Al(e, t) {
    return e.from - t.from || e.to - t.to
}

function jl(e) {
    let t = e;
    for (let n = 0; n < t.length - 1; n++) {
        let r = t[n];
        if (r.from != r.to)
            for (let i = n + 1; i < t.length; i++) {
                let a = t[i];
                if (a.from == r.from) {
                    a.to != r.to && (t == e && (t = e.slice()), t[i] = a.copy(a.from, r.to), Ml(t, i + 1, a.copy(r.to, a.to)));
                    continue
                } else {
                    a.from < r.to && (t == e && (t = e.slice()), t[n] = r.copy(r.from, a.from), Ml(t, i, r.copy(a.from, r.to)));
                    break
                }
            }
    }
    return t
}

function Ml(e, t, n) {
    for (; t < e.length && Al(n, e[t]) > 0;) t++;
    e.splice(t, 0, n)
}

function Nl(e) {
    let t = [];
    return e.someProp(`decorations`, n => {
        let r = n(e.state);
        r && r != Q && t.push(r)
    }), e.cursorWrapper && t.push(Z.create(e.state.doc, [e.cursorWrapper.deco])), Cl.from(t)
}
var Pl = {
        childList: !0,
        characterData: !0,
        characterDataOldValue: !0,
        attributes: !0,
        attributeOldValue: !0,
        subtree: !0
    },
    Fl = H && yo <= 11,
    Il = class {
        constructor() {
            this.anchorNode = null, this.anchorOffset = 0, this.focusNode = null, this.focusOffset = 0
        }
        set(e) {
            this.anchorNode = e.anchorNode, this.anchorOffset = e.anchorOffset, this.focusNode = e.focusNode, this.focusOffset = e.focusOffset
        }
        clear() {
            this.anchorNode = this.focusNode = null
        }
        eq(e) {
            return e.anchorNode == this.anchorNode && e.anchorOffset == this.anchorOffset && e.focusNode == this.focusNode && e.focusOffset == this.focusOffset
        }
    },
    Ll = class {
        constructor(e, t) {
            this.view = e, this.handleDOMChange = t, this.queue = [], this.flushingSoon = -1, this.observer = null, this.currentSelection = new Il, this.onCharData = null, this.suppressingSelectionUpdates = !1, this.lastChangedTextNode = null, this.observer = window.MutationObserver && new window.MutationObserver(t => {
                for (let e = 0; e < t.length; e++) this.queue.push(t[e]);
                H && yo <= 11 && t.some(e => e.type == `childList` && e.removedNodes.length || e.type == `characterData` && e.oldValue.length > e.target.nodeValue.length) ? this.flushSoon() : G && e.composing && t.some(e => e.type == `childList` && e.target.nodeName == `TR`) ? (e.input.badSafariComposition = !0, this.flushSoon()) : this.flush()
            }), Fl && (this.onCharData = e => {
                this.queue.push({
                    target: e.target,
                    type: `characterData`,
                    oldValue: e.prevValue
                }), this.flushSoon()
            }), this.onSelectionChange = this.onSelectionChange.bind(this)
        }
        flushSoon() {
            this.flushingSoon < 0 && (this.flushingSoon = window.setTimeout(() => {
                this.flushingSoon = -1, this.flush()
            }, 20))
        }
        forceFlush() {
            this.flushingSoon > -1 && (window.clearTimeout(this.flushingSoon), this.flushingSoon = -1, this.flush())
        }
        start() {
            this.observer && (this.observer.takeRecords(), this.observer.observe(this.view.dom, Pl)), this.onCharData && this.view.dom.addEventListener(`DOMCharacterDataModified`, this.onCharData), this.connectSelection()
        }
        stop() {
            if (this.observer) {
                let e = this.observer.takeRecords();
                if (e.length) {
                    for (let t = 0; t < e.length; t++) this.queue.push(e[t]);
                    window.setTimeout(() => this.flush(), 20)
                }
                this.observer.disconnect()
            }
            this.onCharData && this.view.dom.removeEventListener(`DOMCharacterDataModified`, this.onCharData), this.disconnectSelection()
        }
        connectSelection() {
            this.view.dom.ownerDocument.addEventListener(`selectionchange`, this.onSelectionChange)
        }
        disconnectSelection() {
            this.view.dom.ownerDocument.removeEventListener(`selectionchange`, this.onSelectionChange)
        }
        suppressSelectionUpdates() {
            this.suppressingSelectionUpdates = !0, setTimeout(() => this.suppressingSelectionUpdates = !1, 50)
        }
        onSelectionChange() {
            if (Gs(this.view)) {
                if (this.suppressingSelectionUpdates) return Fs(this.view);
                if (H && yo <= 11 && !this.view.state.selection.empty) {
                    let e = this.view.domSelectionRange();
                    if (e.focusNode && no(e.focusNode, e.focusOffset, e.anchorNode, e.anchorOffset)) return this.flushSoon()
                }
                this.flush()
            }
        }
        setCurSelection() {
            this.currentSelection.set(this.view.domSelectionRange())
        }
        ignoreSelectionChange(e) {
            if (!e.focusNode) return !0;
            let t = new Set,
                n;
            for (let n = e.focusNode; n; n = Qa(n)) t.add(n);
            for (let r = e.anchorNode; r; r = Qa(r))
                if (t.has(r)) {
                    n = r;
                    break
                }
            let r = n && this.view.docView.nearestDesc(n);
            if (r && r.ignoreMutation({
                    type: `selection`,
                    target: n.nodeType == 3 ? n.parentNode : n
                })) return this.setCurSelection(), !0
        }
        pendingRecords() {
            if (this.observer)
                for (let e of this.observer.takeRecords()) this.queue.push(e);
            return this.queue
        }
        flush() {
            let {
                view: e
            } = this;
            if (!e.docView || this.flushingSoon > -1) return;
            let t = this.pendingRecords();
            t.length && (this.queue = []);
            let n = e.domSelectionRange(),
                r = !this.suppressingSelectionUpdates && !this.currentSelection.eq(n) && Gs(e) && !this.ignoreSelectionChange(n),
                i = -1,
                a = -1,
                o = !1,
                s = [];
            if (e.editable)
                for (let e = 0; e < t.length; e++) {
                    let n = this.registerMutation(t[e], s);
                    n && (i = i < 0 ? n.from : Math.min(n.from, i), a = a < 0 ? n.to : Math.max(n.to, a), n.typeOver && (o = !0))
                }
            if (s.some(e => e.nodeName == `BR`) && (e.input.lastKeyCode == 8 || e.input.lastKeyCode == 46)) {
                for (let e of s)
                    if (e.nodeName == `BR` && e.parentNode) {
                        let t = e.nextSibling;
                        for (; t && t.nodeType == 1;) {
                            if (t.contentEditable == `false`) {
                                e.parentNode.removeChild(e);
                                break
                            }
                            t = t.firstChild
                        }
                    }
            } else if (U && s.length) {
                let t = s.filter(e => e.nodeName == `BR`);
                if (t.length == 2) {
                    let [e, n] = t;
                    e.parentNode && e.parentNode.parentNode == n.parentNode ? n.remove() : e.remove()
                } else {
                    let {
                        focusNode: n
                    } = this.currentSelection;
                    for (let r of t) {
                        let t = r.parentNode;
                        t && t.nodeName == `LI` && (!n || Ul(e, n) != t) && r.remove()
                    }
                }
            }
            let c = null;
            i < 0 && r && e.input.lastFocus > Date.now() - 200 && Math.max(e.input.lastTouch, e.input.lastClick.time) < Date.now() - 300 && lo(n) && (c = Ns(e)) && c.eq(N.near(e.state.doc.resolve(0), 1)) ? (e.input.lastFocus = 0, Fs(e), this.currentSelection.set(n), e.scrollToSelection()) : (i > -1 || r) && (i > -1 && (e.docView.markDirty(i, a), Bl(e)), e.input.badSafariComposition && (e.input.badSafariComposition = !1, Wl(e, s)), this.handleDOMChange(i, a, o, s), e.docView && e.docView.dirty ? e.updateState(e.state) : this.currentSelection.eq(n) || Fs(e), this.currentSelection.set(n))
        }
        registerMutation(e, t) {
            if (t.indexOf(e.target) > -1) return null;
            let n = this.view.docView.nearestDesc(e.target);
            if (e.type == `attributes` && (n == this.view.docView || e.attributeName == `contenteditable` || e.attributeName == `style` && !e.oldValue && !e.target.getAttribute(`style`)) || !n || n.ignoreMutation(e)) return null;
            if (e.type == `childList`) {
                for (let n = 0; n < e.addedNodes.length; n++) {
                    let r = e.addedNodes[n];
                    t.push(r), r.nodeType == 3 && (this.lastChangedTextNode = r)
                }
                if (n.contentDOM && n.contentDOM != n.dom && !n.contentDOM.contains(e.target)) return {
                    from: n.posBefore,
                    to: n.posAfter
                };
                let r = e.previousSibling,
                    i = e.nextSibling;
                if (H && yo <= 11 && e.addedNodes.length)
                    for (let t = 0; t < e.addedNodes.length; t++) {
                        let {
                            previousSibling: n,
                            nextSibling: a
                        } = e.addedNodes[t];
                        (!n || Array.prototype.indexOf.call(e.addedNodes, n) < 0) && (r = n), (!a || Array.prototype.indexOf.call(e.addedNodes, a) < 0) && (i = a)
                    }
                let a = r && r.parentNode == e.target ? z(r) + 1 : 0,
                    o = n.localPosFromDOM(e.target, a, -1),
                    s = i && i.parentNode == e.target ? z(i) : e.target.childNodes.length;
                return {
                    from: o,
                    to: n.localPosFromDOM(e.target, s, 1)
                }
            } else if (e.type == `attributes`) return {
                from: n.posAtStart - n.border,
                to: n.posAtEnd + n.border
            };
            else return this.lastChangedTextNode = e.target, {
                from: n.posAtStart,
                to: n.posAtEnd,
                typeOver: e.target.nodeValue == e.oldValue
            }
        }
    },
    Rl = new WeakMap,
    zl = !1;

function Bl(e) {
    if (!Rl.has(e) && (Rl.set(e, null), [`normal`, `nowrap`, `pre-line`].indexOf(getComputedStyle(e.dom).whiteSpace) !== -1)) {
        if (e.requiresGeckoHackNode = U, zl) return;
        zl = !0
    }
}

function Vl(e, t) {
    let n = t.startContainer,
        r = t.startOffset,
        i = t.endContainer,
        a = t.endOffset,
        o = e.domAtPos(e.state.selection.anchor);
    return no(o.node, o.offset, i, a) && ([n, r, i, a] = [i, a, n, r]), {
        anchorNode: n,
        anchorOffset: r,
        focusNode: i,
        focusOffset: a
    }
}

function Hl(e, t) {
    if (t.getComposedRanges) {
        let n = t.getComposedRanges(e.root)[0];
        if (n) return Vl(e, n)
    }
    let n;

    function r(e) {
        e.preventDefault(), e.stopImmediatePropagation(), n = e.getTargetRanges()[0]
    }
    return e.dom.addEventListener(`beforeinput`, r, !0), document.execCommand(`indent`), e.dom.removeEventListener(`beforeinput`, r, !0), n ? Vl(e, n) : null
}

function Ul(e, t) {
    for (let n = t.parentNode; n && n != e.dom; n = n.parentNode) {
        let t = e.docView.nearestDesc(n, !0);
        if (t && t.node.isBlock) return n
    }
    return null
}

function Wl(e, t) {
    let {
        focusNode: n,
        focusOffset: r
    } = e.domSelectionRange();
    for (let i of t)
        if (i.parentNode ? .nodeName == `TR`) {
            let t = i.nextSibling;
            for (; t && t.nodeName != `TD` && t.nodeName != `TH`;) t = t.nextSibling;
            if (t) {
                let a = t;
                for (;;) {
                    let e = a.firstChild;
                    if (!e || e.nodeType != 1 || e.contentEditable == `false` || /^(BR|IMG)$/.test(e.nodeName)) break;
                    a = e
                }
                a.insertBefore(i, a.firstChild), n == i && e.domSelection().collapse(i, r)
            } else i.parentNode.removeChild(i)
        }
}

function Gl(e, t, n) {
    let {
        node: r,
        fromOffset: i,
        toOffset: a,
        from: o,
        to: s
    } = e.docView.parseRange(t, n), c = e.domSelectionRange(), l, u = c.anchorNode;
    if (u && e.dom.contains(u.nodeType == 1 ? u : u.parentNode) && (l = [{
            node: u,
            offset: c.anchorOffset
        }], lo(c) || l.push({
            node: c.focusNode,
            offset: c.focusOffset
        })), W && e.input.lastKeyCode === 8)
        for (let e = a; e > i; e--) {
            let t = r.childNodes[e - 1],
                n = t.pmViewDesc;
            if (t.nodeName == `BR` && !n) {
                a = e;
                break
            }
            if (!n || n.size) break
        }
    let d = e.state.doc,
        f = e.someProp(`domParser`) || kn.fromSchema(e.state.schema),
        p = d.resolve(o),
        m = null,
        h = f.parse(r, {
            topNode: p.parent,
            topMatch: p.parent.contentMatchAt(p.index()),
            topOpen: !0,
            from: i,
            to: a,
            preserveWhitespace: p.parent.type.whitespace == `pre` ? `full` : !0,
            findPositions: l,
            ruleFromNode: Kl,
            context: p
        });
    if (l && l[0].pos != null) {
        let e = l[0].pos,
            t = l[1] && l[1].pos;
        t ? ? = e, m = {
            anchor: e + o,
            head: t + o
        }
    }
    return {
        doc: h,
        sel: m,
        from: o,
        to: s
    }
}

function Kl(e) {
    let t = e.pmViewDesc;
    if (t) return t.parseRule();
    if (e.nodeName == `BR` && e.parentNode) {
        if (G && /^(ul|ol)$/i.test(e.parentNode.nodeName)) {
            let e = document.createElement(`div`);
            return e.appendChild(document.createElement(`li`)), {
                skip: e
            }
        } else if (e.parentNode.lastChild == e || G && /^(tr|table)$/i.test(e.parentNode.nodeName)) return {
            ignore: !0
        }
    } else if (e.nodeName == `IMG` && e.getAttribute(`mark-placeholder`)) return {
        ignore: !0
    };
    return null
}
var ql = /^(a|abbr|acronym|b|bd[io]|big|br|button|cite|code|data(list)?|del|dfn|em|i|img|ins|kbd|label|map|mark|meter|output|q|ruby|s|samp|small|span|strong|su[bp]|time|u|tt|var)$/i;

function Jl(e, t, n, r, i) {
    let a = e.input.compositionPendingChanges || (e.composing ? e.input.compositionID : 0);
    if (e.input.compositionPendingChanges = 0, t < 0) {
        let t = e.input.lastSelectionTime > Date.now() - 50 ? e.input.lastSelectionOrigin : null,
            n = Ns(e, t);
        if (n && !e.state.selection.eq(n)) {
            if (W && wo && e.input.lastKeyCode === 13 && Date.now() - 100 < e.input.lastKeyCodeTime && e.someProp(`handleKeyDown`, t => t(e, uo(13, `Enter`)))) return;
            let r = e.state.tr.setSelection(n);
            t == `pointer` ? r.setMeta(`pointer`, !0) : t == `key` && r.scrollIntoView(), a && r.setMeta(`composition`, a), e.dispatch(r)
        }
        return
    }
    let o = e.state.doc.resolve(t),
        s = o.sharedDepth(n);
    t = o.before(s + 1), n = e.state.doc.resolve(n).after(s + 1);
    let c = e.state.selection,
        l = Gl(e, t, n),
        u = e.state.doc,
        d = u.slice(l.from, l.to),
        f, p;
    e.input.lastKeyCode === 8 && Date.now() - 100 < e.input.lastKeyCodeTime ? (f = e.state.selection.to, p = `end`) : (f = e.state.selection.from, p = `start`), e.input.lastKeyCode = null;
    let m = $l(d.content, l.doc.content, l.from, f, p);
    if (m && e.input.domChangeCount++, (So && e.input.lastIOSEnter > Date.now() - 225 || wo) && i.some(e => e.nodeType == 1 && !ql.test(e.nodeName)) && (!m || m.endA >= m.endB) && e.someProp(`handleKeyDown`, t => t(e, uo(13, `Enter`)))) {
        e.input.lastIOSEnter = 0;
        return
    }
    if (!m)
        if (r && c instanceof P && !c.empty && c.$head.sameParent(c.$anchor) && !e.composing && !(l.sel && l.sel.anchor != l.sel.head)) m = {
            start: c.from,
            endA: c.to,
            endB: c.to
        };
        else {
            if (l.sel) {
                let t = Yl(e, e.state.doc, l.sel);
                if (t && !t.eq(e.state.selection)) {
                    let n = e.state.tr.setSelection(t);
                    a && n.setMeta(`composition`, a), e.dispatch(n)
                }
            }
            return
        }
    e.state.selection.from < e.state.selection.to && m.start == m.endB && e.state.selection instanceof P && (m.start > e.state.selection.from && m.start <= e.state.selection.from + 2 && e.state.selection.from >= l.from ? m.start = e.state.selection.from : m.endA < e.state.selection.to && m.endA >= e.state.selection.to - 2 && e.state.selection.to <= l.to && (m.endB += e.state.selection.to - m.endA, m.endA = e.state.selection.to)), H && yo <= 11 && m.endB == m.start + 1 && m.endA == m.start && m.start > l.from && l.doc.textBetween(m.start - l.from - 1, m.start - l.from + 1) == ` \xA0` && (m.start--, m.endA--, m.endB--);
    let h = l.doc.resolveNoCache(m.start - l.from),
        g = l.doc.resolveNoCache(m.endB - l.from),
        _ = u.resolve(m.start),
        v = h.sameParent(g) && h.parent.inlineContent && _.end() >= m.endA;
    if ((So && e.input.lastIOSEnter > Date.now() - 225 && (!v || i.some(e => e.nodeName == `DIV` || e.nodeName == `P`)) || !v && h.pos < l.doc.content.size && (!h.sameParent(g) || !h.parent.inlineContent) && h.pos < g.pos && !/\S/.test(l.doc.textBetween(h.pos, g.pos, ``, ``))) && e.someProp(`handleKeyDown`, t => t(e, uo(13, `Enter`)))) {
        e.input.lastIOSEnter = 0;
        return
    }
    if (e.state.selection.anchor > m.start && Zl(u, m.start, m.endA, h, g) && e.someProp(`handleKeyDown`, t => t(e, uo(8, `Backspace`)))) {
        wo && W && e.domObserver.suppressSelectionUpdates();
        return
    }
    W && m.endB == m.start && (e.input.lastChromeDelete = Date.now()), wo && !v && h.start() != g.start() && g.parentOffset == 0 && h.depth == g.depth && l.sel && l.sel.anchor == l.sel.head && l.sel.head == m.endA && (m.endB -= 2, g = l.doc.resolveNoCache(m.endB - l.from), setTimeout(() => {
        e.someProp(`handleKeyDown`, function(t) {
            return t(e, uo(13, `Enter`))
        })
    }, 20));
    let y = m.start,
        b = m.endA,
        x = t => {
            let n = t || e.state.tr.replace(y, b, l.doc.slice(m.start - l.from, m.endB - l.from));
            if (l.sel) {
                let t = Yl(e, n.doc, l.sel);
                t && !(W && e.composing && t.empty && (m.start != m.endB || e.input.lastChromeDelete < Date.now() - 100) && (t.head == y || t.head == n.mapping.map(b) - 1) || H && t.empty && t.head == y) && n.setSelection(t)
            }
            return a && n.setMeta(`composition`, a), n.scrollIntoView()
        },
        ee;
    if (v)
        if (h.pos == g.pos) {
            H && yo <= 11 && h.parentOffset == 0 && (e.domObserver.suppressSelectionUpdates(), setTimeout(() => Fs(e), 20));
            let t = x(e.state.tr.delete(y, b)),
                n = u.resolve(m.start).marksAcross(u.resolve(m.endA));
            n && t.ensureMarks(n), e.dispatch(t)
        } else if (m.endA == m.endB && (ee = Xl(h.parent.content.cut(h.parentOffset, g.parentOffset), _.parent.content.cut(_.parentOffset, m.endA - _.start())))) {
        let t = x(e.state.tr);
        ee.type == `add` ? t.addMark(y, b, ee.mark) : t.removeMark(y, b, ee.mark), e.dispatch(t)
    } else if (h.parent.child(h.index()).isText && h.index() == g.index() - +!g.textOffset) {
        let t = h.parent.textBetween(h.parentOffset, g.parentOffset),
            n = () => x(e.state.tr.insertText(t, y, b));
        e.someProp(`handleTextInput`, r => r(e, y, b, t, n)) || e.dispatch(n())
    } else e.dispatch(x());
    else e.dispatch(x())
}

function Yl(e, t, n) {
    return Math.max(n.anchor, n.head) > t.content.size ? null : Ws(e, t.resolve(n.anchor), t.resolve(n.head))
}

function Xl(e, t) {
    let n = e.firstChild.marks,
        r = t.firstChild.marks,
        i = n,
        a = r,
        o, s, c;
    for (let e = 0; e < r.length; e++) i = r[e].removeFromSet(i);
    for (let e = 0; e < n.length; e++) a = n[e].removeFromSet(a);
    if (i.length == 1 && a.length == 0) s = i[0], o = `add`, c = e => e.mark(s.addToSet(e.marks));
    else if (i.length == 0 && a.length == 1) s = a[0], o = `remove`, c = e => e.mark(s.removeFromSet(e.marks));
    else return null;
    let l = [];
    for (let e = 0; e < t.childCount; e++) l.push(c(t.child(e)));
    if (E.from(l).eq(e)) return {
        mark: s,
        type: o
    }
}

function Zl(e, t, n, r, i) {
    if (n - t <= i.pos - r.pos || Ql(r, !0, !1) < i.pos) return !1;
    let a = e.resolve(t);
    if (!r.parent.isTextblock) {
        let e = a.nodeAfter;
        return e != null && n == t + e.nodeSize
    }
    if (a.parentOffset < a.parent.content.size || !a.parent.isTextblock) return !1;
    let o = e.resolve(Ql(a, !0, !0));
    return !o.parent.isTextblock || o.pos > n || Ql(o, !0, !1) < n ? !1 : r.parent.content.cut(r.parentOffset).eq(o.parent.content)
}

function Ql(e, t, n) {
    let r = e.depth,
        i = t ? e.end() : e.pos;
    for (; r > 0 && (t || e.indexAfter(r) == e.node(r).childCount);) r--, i++, t = !1;
    if (n) {
        let t = e.node(r).maybeChild(e.indexAfter(r));
        for (; t && !t.isLeaf;) t = t.firstChild, i++
    }
    return i
}

function $l(e, t, n, r, i) {
    let a = e.findDiffStart(t, n);
    if (a == null) return null;
    let {
        a: o,
        b: s
    } = e.findDiffEnd(t, n + e.size, n + t.size);
    if (i == `end`) {
        let e = Math.max(0, a - Math.min(o, s));
        r -= o + e - a
    }
    if (o < a && e.size < t.size) {
        let e = r <= a && r >= o ? a - r : 0;
        a -= e, a && a < t.size && eu(t.textBetween(a - 1, a + 1)) && (a += e ? 1 : -1), s = a + (s - o), o = a
    } else if (s < a) {
        let t = r <= a && r >= s ? a - r : 0;
        a -= t, a && a < e.size && eu(e.textBetween(a - 1, a + 1)) && (a += t ? 1 : -1), o = a + (o - s), s = a
    }
    return {
        start: a,
        endA: o,
        endB: s
    }
}

function eu(e) {
    if (e.length != 2) return !1;
    let t = e.charCodeAt(0),
        n = e.charCodeAt(1);
    return t >= 56320 && t <= 57343 && n >= 55296 && n <= 56319
}
var tu = class {
    constructor(e, t) {
        this._root = null, this.focused = !1, this.trackWrites = null, this.mounted = !1, this.markCursor = null, this.cursorWrapper = null, this.lastSelectedViewDesc = void 0, this.input = new jc, this.prevDirectPlugins = [], this.pluginViews = [], this.requiresGeckoHackNode = !1, this.dragging = null, this._props = t, this.state = t.state, this.directPlugins = t.plugins || [], this.directPlugins.forEach(cu), this.dispatch = this.dispatch.bind(this), this.dom = e && e.mount || document.createElement(`div`), e && (e.appendChild ? e.appendChild(this.dom) : typeof e == `function` ? e(this.dom) : e.mount && (this.mounted = !0)), this.editable = iu(this), ru(this), this.nodeViews = ou(this), this.docView = ps(this.state.doc, nu(this), Nl(this), this.dom, this), this.domObserver = new Ll(this, (e, t, n, r) => Jl(this, e, t, n, r)), this.domObserver.start(), Mc(this), this.updatePluginViews()
    }
    get composing() {
        return this.input.composing
    }
    get props() {
        if (this._props.state != this.state) {
            let e = this._props;
            this._props = {};
            for (let t in e) this._props[t] = e[t];
            this._props.state = this.state
        }
        return this._props
    }
    update(e) {
        e.handleDOMEvents != this._props.handleDOMEvents && Fc(this);
        let t = this._props;
        this._props = e, e.plugins && (e.plugins.forEach(cu), this.directPlugins = e.plugins), this.updateStateInner(e.state, t)
    }
    setProps(e) {
        let t = {};
        for (let e in this._props) t[e] = this._props[e];
        t.state = this.state;
        for (let n in e) t[n] = e[n];
        this.update(t)
    }
    updateState(e) {
        this.updateStateInner(e, this._props)
    }
    updateStateInner(e, t) {
        let n = this.state,
            r = !1,
            i = !1;
        e.storedMarks && this.composing && (nl(this), i = !0), this.state = e;
        let a = n.plugins != e.plugins || this._props.plugins != t.plugins;
        if (a || this._props.plugins != t.plugins || this._props.nodeViews != t.nodeViews) {
            let e = ou(this);
            su(e, this.nodeViews) && (this.nodeViews = e, r = !0)
        }(a || t.handleDOMEvents != this._props.handleDOMEvents) && Fc(this), this.editable = iu(this), ru(this);
        let o = Nl(this),
            s = nu(this),
            c = n.plugins != e.plugins && !n.doc.eq(e.doc) ? `reset` : e.scrollToSelection > n.scrollToSelection ? `to selection` : `preserve`,
            l = r || !this.docView.matchesNode(e.doc, s, o);
        (l || !e.selection.eq(n.selection)) && (i = !0);
        let u = c == `preserve` && i && this.dom.style.overflowAnchor == null && jo(this);
        if (i) {
            this.domObserver.stop();
            let t = l && (H || W) && !this.composing && !n.selection.empty && !e.selection.empty && au(n.selection, e.selection);
            if (l) {
                let n = W ? this.trackWrites = this.domSelectionRange().focusNode : null;
                this.composing && (this.input.compositionNode = rl(this)), (r || !this.docView.update(e.doc, s, o, this)) && (this.docView.updateOuterDeco(s), this.docView.destroy(), this.docView = ps(e.doc, s, o, this.dom, this)), n && (!this.trackWrites || !this.dom.contains(this.trackWrites)) && (t = !0)
            }
            t || !(this.input.mouseDown && this.domObserver.currentSelection.eq(this.domSelectionRange()) && qs(this)) ? Fs(this, t) : (Hs(this, e.selection), this.domObserver.setCurSelection()), this.domObserver.start()
        }
        this.updatePluginViews(n), this.dragging ? .node && !n.doc.eq(e.doc) && this.updateDraggedNode(this.dragging, n), c == `reset` ? this.dom.scrollTop = 0 : c == `to selection` ? this.scrollToSelection() : u && No(u)
    }
    scrollToSelection() {
        let e = this.domSelectionRange().focusNode;
        if (!(!e || !this.dom.contains(e.nodeType == 1 ? e : e.parentNode)) && !this.someProp(`handleScrollToSelection`, e => e(this)))
            if (this.state.selection instanceof F) {
                let t = this.docView.domAfterPos(this.state.selection.from);
                t.nodeType == 1 && Ao(this, t.getBoundingClientRect(), e)
            } else Ao(this, this.coordsAtPos(this.state.selection.head, 1), e)
    }
    destroyPluginViews() {
        let e;
        for (; e = this.pluginViews.pop();) e.destroy && e.destroy()
    }
    updatePluginViews(e) {
        if (!e || e.plugins != this.state.plugins || this.directPlugins != this.prevDirectPlugins) {
            this.prevDirectPlugins = this.directPlugins, this.destroyPluginViews();
            for (let e = 0; e < this.directPlugins.length; e++) {
                let t = this.directPlugins[e];
                t.spec.view && this.pluginViews.push(t.spec.view(this))
            }
            for (let e = 0; e < this.state.plugins.length; e++) {
                let t = this.state.plugins[e];
                t.spec.view && this.pluginViews.push(t.spec.view(this))
            }
        } else
            for (let t = 0; t < this.pluginViews.length; t++) {
                let n = this.pluginViews[t];
                n.update && n.update(this, e)
            }
    }
    updateDraggedNode(e, t) {
        let n = e.node,
            r = -1;
        if (n.from < this.state.doc.content.size && this.state.doc.nodeAt(n.from) == n.node) r = n.from;
        else {
            let e = n.from + (this.state.doc.content.size - t.doc.content.size);
            (e > 0 && e < this.state.doc.content.size && this.state.doc.nodeAt(e)) == n.node && (r = e)
        }
        this.dragging = new fl(e.slice, e.move, r < 0 ? void 0 : F.create(this.state.doc, r))
    }
    someProp(e, t) {
        let n = this._props && this._props[e],
            r;
        if (n != null && (r = t ? t(n) : n)) return r;
        for (let n = 0; n < this.directPlugins.length; n++) {
            let i = this.directPlugins[n].props[e];
            if (i != null && (r = t ? t(i) : i)) return r
        }
        let i = this.state.plugins;
        if (i)
            for (let n = 0; n < i.length; n++) {
                let a = i[n].props[e];
                if (a != null && (r = t ? t(a) : a)) return r
            }
    }
    hasFocus() {
        if (H) {
            let e = this.root.activeElement;
            if (e == this.dom) return !0;
            if (!e || !this.dom.contains(e)) return !1;
            for (; e && this.dom != e && this.dom.contains(e);) {
                if (e.contentEditable == `false`) return !1;
                e = e.parentElement
            }
            return !0
        }
        return this.root.activeElement == this.dom
    }
    focus() {
        this.domObserver.stop(), this.editable && Io(this.dom), Fs(this), this.domObserver.start()
    }
    get root() {
        let e = this._root;
        if (e == null) {
            for (let e = this.dom.parentNode; e; e = e.parentNode)
                if (e.nodeType == 9 || e.nodeType == 11 && e.host) return e.getSelection || (Object.getPrototypeOf(e).getSelection = () => e.ownerDocument.getSelection()), this._root = e
        }
        return e || document
    }
    updateRoot() {
        this._root = null
    }
    posAtCoords(e) {
        return Wo(this, e)
    }
    coordsAtPos(e, t = 1) {
        return Jo(this, e, t)
    }
    domAtPos(e, t = 0) {
        return this.docView.domFromPos(e, t)
    }
    nodeDOM(e) {
        let t = this.docView.descAt(e);
        return t ? t.nodeDOM : null
    }
    posAtDOM(e, t, n = -1) {
        let r = this.docView.posFromDOM(e, t, n);
        if (r == null) throw RangeError(`DOM position not inside the editor`);
        return r
    }
    endOfTextblock(e, t) {
        return is(this, t || this.state, e)
    }
    pasteHTML(e, t) {
        return ul(this, ``, e, !1, t || new ClipboardEvent(`paste`))
    }
    pasteText(e, t) {
        return ul(this, e, null, !0, t || new ClipboardEvent(`paste`))
    }
    serializeForClipboard(e) {
        return pc(this, e)
    }
    destroy() {
        this.docView && (Pc(this), this.destroyPluginViews(), this.mounted ? (this.docView.update(this.state.doc, [], Nl(this), this), this.dom.textContent = ``) : this.dom.parentNode && this.dom.parentNode.removeChild(this.dom), this.docView.destroy(), this.docView = null, to())
    }
    get isDestroyed() {
        return this.docView == null
    }
    dispatchEvent(e) {
        return Rc(this, e)
    }
    domSelectionRange() {
        let e = this.domSelection();
        return e ? G && this.root.nodeType === 11 && fo(this.dom.ownerDocument) == this.dom && Hl(this, e) || e : {
            focusNode: null,
            focusOffset: 0,
            anchorNode: null,
            anchorOffset: 0
        }
    }
    domSelection() {
        return this.root.getSelection()
    }
};
tu.prototype.dispatch = function(e) {
    let t = this._props.dispatchTransaction;
    t ? t.call(this, e) : this.updateState(this.state.apply(e))
};

function nu(e) {
    let t = Object.create(null);
    return t.class = `ProseMirror`, t.contenteditable = String(e.editable), e.someProp(`attributes`, n => {
        if (typeof n == `function` && (n = n(e.state)), n)
            for (let e in n) e == `class` ? t.class += ` ` + n[e] : e == `style` ? t.style = (t.style ? t.style + `;` : ``) + n[e] : !t[e] && e != `contenteditable` && e != `nodeName` && (t[e] = String(n[e]))
    }), t.translate || = `no`, [bl.node(0, e.state.doc.content.size, t)]
}

function ru(e) {
    if (e.markCursor) {
        let t = document.createElement(`img`);
        t.className = `ProseMirror-separator`, t.setAttribute(`mark-placeholder`, `true`), t.setAttribute(`alt`, ``), e.cursorWrapper = {
            dom: t,
            deco: bl.widget(e.state.selection.from, t, {
                raw: !0,
                marks: e.markCursor
            })
        }
    } else e.cursorWrapper = null
}

function iu(e) {
    return !e.someProp(`editable`, t => t(e.state) === !1)
}

function au(e, t) {
    let n = Math.min(e.$anchor.sharedDepth(e.head), t.$anchor.sharedDepth(t.head));
    return e.$anchor.start(n) != t.$anchor.start(n)
}

function ou(e) {
    let t = Object.create(null);

    function n(e) {
        for (let n in e) Object.prototype.hasOwnProperty.call(t, n) || (t[n] = e[n])
    }
    return e.someProp(`nodeViews`, n), e.someProp(`markViews`, n), t
}

function su(e, t) {
    let n = 0,
        r = 0;
    for (let r in e) {
        if (e[r] != t[r]) return !0;
        n++
    }
    for (let e in t) r++;
    return n != r
}

function cu(e) {
    if (e.spec.state || e.spec.filterTransaction || e.spec.appendTransaction) throw RangeError(`Plugins passed directly to the view must not have a state component`)
}
var lu = [
    [`->`, `→`],
    [`<-`, `←`]
];

function uu(e) {
    for (let [t, n] of lu)
        if (e.endsWith(t)) return {
            pattern: t,
            glyph: n
        };
    return null
}
var du = /https?:\/\/[^\s<>"'`]+|\bwww\.[^\s<>"'`]+/i,
    fu = `.,;:!?`;

function pu(e) {
    let t = e.length;
    for (; t > 0; t--) {
        let n = e[t - 1];
        if (fu.includes(n)) continue;
        if (n !== `)`) break;
        let r = e.slice(0, t);
        if (r.split(`)`).length <= r.split(`(`).length) break
    }
    return e.slice(0, t)
}

function mu(e) {
    let t = /^www\./i.test(e) ? `https://${e}` : e;
    try {
        let e = new URL(t);
        return e.protocol !== `http:` && e.protocol !== `https:` ? null : e.href
    } catch {
        return null
    }
}

function hu(e) {
    let t = [],
        n = new RegExp(du.source, `gi`);
    for (let r of e.matchAll(n)) {
        let e = pu(r[0]),
            n = mu(e);
        n && t.push({
            from: r.index,
            to: r.index + e.length,
            href: n
        })
    }
    return t
}
var gu = new Tn({
        nodes: {
            doc: {
                content: `block+`
            },
            paragraph: {
                group: `block`,
                content: `inline*`,
                parseDOM: [{
                    tag: `p`
                }],
                toDOM: () => [`p`, 0]
            },
            text: {
                group: `inline`
            },
            hard_break: {
                group: `inline`,
                inline: !0,
                selectable: !1,
                parseDOM: [{
                    tag: `br`
                }],
                toDOM: () => [`br`]
            }
        },
        marks: {
            link: {
                attrs: {
                    href: {},
                    auto: {
                        default: !1
                    }
                },
                inclusive: !1,
                parseDOM: [{
                    tag: `a[href]`,
                    getAttrs: e => {
                        let t = mu(e.getAttribute(`href`) ? ? ``);
                        return t ? {
                            href: t
                        } : !1
                    }
                }],
                toDOM: e => [`a`, {
                    href: String(e.attrs.href),
                    rel: `noreferrer noopener`,
                    target: `_blank`
                }, 0]
            }
        }
    }),
    $ = gu.marks.link,
    _u = gu.nodes.paragraph,
    vu = gu.nodes.hard_break,
    yu = /\[((?:[^\\\]]|\\[\\[\]])*)\]\(<(https?:\/\/[^<>\s]+)>\)/g;

function bu(e) {
    e.focus(), e.state.doc.textContent.length > 0 && e.dispatch(e.state.tr.setSelection(P.atEnd(e.state.doc)))
}

function xu(e) {
    let t = e.replace(/\r\n?/g, `
`).split(`
`).map(e => {
        if (!e) return _u.create(null, []);
        let t = [],
            n = e => {
                let n = 0;
                for (let {
                        from: r,
                        to: i,
                        href: a
                    } of hu(e)) r > n && t.push(gu.text(e.slice(n, r))), t.push(gu.text(e.slice(r, i), [$.create({
                    href: a,
                    auto: !0
                })])), n = i;
                n < e.length && t.push(gu.text(e.slice(n)))
            },
            r = 0;
        for (let i of e.matchAll(yu)) {
            i.index > r && n(e.slice(r, i.index));
            let a = i[1].replace(/\\([\\[\]])/g, `$1`),
                o = mu(i[2]);
            o && a ? t.push(gu.text(a, [$.create({
                href: o,
                auto: !1
            })])) : n(i[0]), r = i.index + i[0].length
        }
        return r < e.length && n(e.slice(r)), _u.create(null, t)
    });
    return gu.node(`doc`, null, t)
}

function Su(e) {
    let t = [];
    return e.forEach((e, n, r) => {
        r > 0 && t.push(`
`), e.forEach(e => {
            if (e.type === vu) {
                t.push(`
`);
                return
            }
            if (!e.isText) return;
            let n = e.text ? ? ``,
                r = $.isInSet(e.marks);
            if (r && !r.attrs.auto) {
                let e = n.replace(/[\\[\]]/g, `\\$&`);
                t.push(`[${e}](<${r.attrs.href}>)`)
            } else t.push(n)
        })
    }), t.join(``)
}
var Cu = (e, t) => e.length === t.length && e.every((e, n) => e.from === t[n].from && e.to === t[n].to && e.href === t[n].href);

function wu(e, t) {
    let n = e.doc.nodeAt(t);
    if (!n || n.type !== _u) return;
    let r = [],
        i = null;
    n.forEach((e, n) => {
        let a = t + 1 + n,
            o = e.isText ? $.isInSet(e.marks) : null;
        if (!(e.isText && (!o || o.attrs.auto))) {
            i = null;
            return
        }(!i || i.base + i.text.length !== a) && (i = {
            base: a,
            text: ``,
            have: []
        }, r.push(i)), o && i.have.push({
            from: a - i.base,
            to: a - i.base + e.nodeSize,
            href: String(o.attrs.href)
        }), i.text += e.text ? ? ``
    });
    for (let t of r) {
        let n = hu(t.text);
        if (!Cu(t.have, n)) {
            for (let n of t.have) e.removeMark(t.base + n.from, t.base + n.to, $);
            for (let r of n) e.addMark(t.base + r.from, t.base + r.to, $.create({
                href: r.href,
                auto: !0
            }))
        }
    }
}
var Tu = new Ei(`autolink`);

function Eu() {
    return new Ci({
        key: Tu,
        appendTransaction(e, t, n) {
            if (e.some(e => e.getMeta(Tu)) || !e.some(e => e.docChanged)) return null;
            let r = n.tr;
            return n.doc.forEach((e, t) => {
                e.type === _u && wu(r, t)
            }), r.steps.length ? r.setMeta(Tu, !0) : null
        }
    })
}

function Du() {
    return new Ci({
        appendTransaction(e, t, n) {
            if (t.selection.eq(n.selection)) return null;
            let {
                $from: r,
                empty: i
            } = n.selection;
            if (!i) return null;
            let a = r.marks();
            if (!$.isInSet(a)) return null;
            let o = r.nodeBefore;
            return o && $.isInSet(o.marks) ? null : n.tr.setStoredMarks($.removeFromSet(a))
        }
    })
}

function Ou(e) {
    return new Ci({
        props: {
            decorations(t) {
                let n = t.doc.firstChild;
                return t.doc.childCount > 1 || !n || n.content.size > 0 || !e.current ? null : Z.create(t.doc, [bl.node(0, n.nodeSize, {
                    class: `is-empty`,
                    "data-placeholder": e.current
                })])
            }
        }
    })
}

function ku(e) {
    e.updateState(xi.create({
        doc: e.state.doc,
        selection: e.state.selection,
        plugins: e.state.plugins
    }))
}

function Au() {
    return new ja(/(?:->|<-)$/, (e, t, n, r) => {
        let i = uu(t[0]);
        return i ? e.tr.insertText(i.glyph, n, r) : null
    })
}
var ju = (0, C.forwardRef)(function({
        placeholder: e,
        value: t = ``,
        onChange: n,
        onSubmit: r,
        onPlainEnter: i,
        onPaste: a,
        onBlur: o,
        onEscape: s,
        submitOnEnter: c = !1,
        autoFocus: l,
        historyKey: u,
        minRows: f = 2,
        maxRows: p = 10,
        style: m,
        className: h,
        "data-testid": g
    }, _) {
        let v = (0, C.useRef)(null),
            y = (0, C.useRef)(null),
            b = (0, C.useRef)(t),
            x = (0, C.useRef)({
                onChange: n,
                onSubmit: r,
                onPlainEnter: i,
                onPaste: a,
                onBlur: o,
                onEscape: s,
                submitOnEnter: c
            });
        x.current = {
            onChange: n,
            onSubmit: r,
            onPlainEnter: i,
            onPaste: a,
            onBlur: o,
            onEscape: s,
            submitOnEnter: c
        };
        let ee = (0, C.useRef)(e ? ? ``);
        return ee.current = e ? ? ``, (0, C.useImperativeHandle)(_, () => ({
            focus: () => y.current ? .focus(),
            get scrollDOM() {
                return v.current
            }
        }), []), (0, C.useLayoutEffect)(() => {
            let e = v.current;
            if (!e || y.current) return;
            let t = (e, t) => (t && t(e.tr.replaceSelectionWith(vu.create()).scrollIntoView()), !0),
                n = () => (x.current.onSubmit ? .(`mod-enter`), !0),
                r = new tu(e, {
                    state: xi.create({
                        doc: xu(b.current),
                        plugins: [Da(), Pa({
                            rules: [Au()]
                        }), Xa({
                            "Mod-z": ka,
                            "Shift-Mod-z": Aa,
                            "Mod-y": Aa,
                            Backspace: Ia,
                            Escape: () => (x.current.onEscape ? .(), !!x.current.onEscape),
                            ...Object.fromEntries([`Mod-`, `Ctrl-`, `Meta-`].flatMap(e => [``, `Shift-`, `Alt-`, `Shift-Alt-`].map(t => [`${t}${e}Enter`, n]))),
                            "Shift-Enter": t,
                            "Alt-Enter": t,
                            "Shift-Alt-Enter": t,
                            Enter: () => x.current.submitOnEnter ? (x.current.onSubmit ? .(`enter`), !0) : (x.current.onPlainEnter ? .(), !1)
                        }), Xa(sa), Eu(), Du(), Ou(ee)]
                    }),
                    attributes: () => ({
                        role: `textbox`,
                        "aria-multiline": `true`,
                        "aria-label": ee.current || `Message`,
                        ...g ? {
                            "data-testid": g
                        } : {}
                    }),
                    handlePaste(e, t) {
                        if (x.current.onPaste ? .(t), t.defaultPrevented) return !0;
                        let n = t.clipboardData ? .getData(`text/plain`) ? ? ``;
                        if (!n) return !1;
                        let {
                            from: r,
                            to: i,
                            empty: a,
                            $from: o,
                            $to: s
                        } = e.state.selection;
                        if (!a && o.sameParent(s) && o.parent.textBetween(o.parentOffset, s.parentOffset, `
`, `
`).indexOf(`
`) === -1) {
                            let t = n.trim(),
                                [a, o] = hu(t);
                            if (a && !o && a.from === 0 && a.to === t.length) {
                                let t = e.state.tr.addMark(r, i, $.create({
                                    href: a.href,
                                    auto: !1
                                }));
                                return t.setSelection(P.create(t.doc, i)), e.dispatch(t.scrollIntoView()), !0
                            }
                        }
                        let c = new O(xu(n).content, 1, 1);
                        return e.dispatch(e.state.tr.replaceSelection(c).scrollIntoView()), !0
                    },
                    handleClickOn(e, t, n, r, i) {
                        if (!(Tt ? i.metaKey : i.ctrlKey)) return !1;
                        let a = i.target.closest(`a[href]`);
                        return a ? (window.open(a.href, `_blank`, `noopener`), !0) : !1
                    },
                    handleDOMEvents: {
                        blur() {
                            return x.current.onBlur ? .(), !1
                        }
                    },
                    dispatchTransaction(e) {
                        let t = r.state.apply(e);
                        if (r.updateState(t), !e.docChanged || e.getMeta(`external`)) return;
                        let n = Su(t.doc);
                        n !== b.current && (b.current = n, x.current.onChange ? .(n))
                    }
                });
            return y.current = r, l && bu(r), () => {
                r.destroy(), y.current = null
            }
        }, []), (0, C.useEffect)(() => {
            let e = y.current;
            l && e && bu(e)
        }, [l]), (0, C.useLayoutEffect)(() => {
            let e = y.current;
            if (!e || t === b.current) return;
            b.current = t;
            let n = xu(t),
                r = e.state.tr.replaceWith(0, e.state.doc.content.size, n.content).setMeta(`external`, !0).setMeta(`addToHistory`, !1);
            r.setSelection(P.atEnd(r.doc)), e.dispatch(r), t === `` && ku(e)
        }, [t]), (0, C.useLayoutEffect)(() => {
            let e = y.current;
            e && ku(e)
        }, [u]), (0, C.useEffect)(() => {
            let t = y.current;
            t && t.setProps({
                attributes: {
                    role: `textbox`,
                    "aria-multiline": `true`,
                    "aria-label": e || `Message`,
                    ...g ? {
                        "data-testid": g
                    } : {}
                }
            })
        }, [e, g]), (0, w.jsx)(`div`, {
            ref: v,
            className: d(`om-rich-input`, h),
            style: {
                "--om-ri-min-rows": f,
                "--om-ri-max-rows": p,
                ...m
            }
        })
    }),
    Mu = {
        xs: `gap-[3px] py-0.5 px-1 text-[9px]`,
        sm: `gap-1 py-0.5 px-1.5 text-[10px]`,
        md: `gap-1 py-[3px] px-2 text-[11px]`
    },
    Nu = {
        xs: 8,
        sm: 10,
        md: 12
    },
    Pu = {
        default: `bg-om-bg-panel border-om-border-default text-om-text-secondary`,
        accent: `bg-om-bg-selected border-om-border-default text-om-text-primary`,
        primary: `bg-om-accent-primary border-om-accent-primary text-white`
    };

function Fu({
    children: e,
    variant: t = `default`,
    icon: n,
    onRemove: r,
    onClick: i,
    size: a = `sm`,
    style: o,
    title: s
}) {
    return (0, w.jsxs)(`div`, {
        className: d(`group inline-flex items-center font-medium border rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.04)] min-w-0 shrink`, Mu[a], Pu[t], i && `cursor-pointer hover:border-om-border-strong`),
        style: o,
        title: s,
        onClick: i,
        role: i ? `button` : void 0,
        tabIndex: i ? 0 : void 0,
        onKeyDown: i ? e => {
            (e.key === `Enter` || e.key === ` `) && (e.preventDefault(), i())
        } : void 0,
        children: [n && (0, w.jsx)(m, {
            name: n,
            size: Nu[a],
            style: {
                flexShrink: 0
            }
        }), (0, w.jsx)(`span`, {
            className: `truncate`,
            children: e
        }), r && (0, w.jsx)(`span`, {
            className: `cursor-default opacity-50 ml-0.5 shrink-0 translate-y-px group-hover:opacity-100`,
            onClick: e => {
                e.stopPropagation(), r()
            },
            children: (0, w.jsx)(m, {
                name: `X`,
                size: Nu[a],
                bold: !0
            })
        })]
    })
}

function Iu({
    children: e,
    title: t,
    onRemove: n,
    onClick: r
}) {
    return (0, w.jsx)(Fu, {
        title: t,
        onRemove: n,
        onClick: r,
        children: e
    })
}
var Lu = 32,
    Ru = 40;

function zu({
    tabs: e,
    activeTab: t,
    onChange: n,
    showAddButton: r = !0,
    onAddClick: i,
    style: a
}) {
    return (0, w.jsxs)(`div`, {
        className: `flex items-end bg-om-bg-secondary-tab-bar px-2 gap-0 shrink-0 shadow-[inset_0_-1px_0_color-mix(in_srgb,var(--om-text-primary)_5.5%,transparent)] [[data-theme=dark]_&]:shadow-[inset_0_-1px_0_color-mix(in_srgb,var(--om-text-primary)_10%,transparent)]`,
        style: {
            height: Ru,
            ...a
        },
        children: [(0, w.jsx)(`div`, {
            className: `om-tabs-scroll flex items-end gap-0.5 overflow-x-auto overflow-y-hidden min-w-0 flex-1 pt-0.5`,
            children: e.map((e, r) => {
                let i = r === t;
                return (0, w.jsxs)(`div`, {
                    onClick: () => n ? .(r),
                    className: d(`relative flex items-center gap-1.5 px-3.5 text-xs font-semibold cursor-default transition-all duration-150`, i ? `text-om-text-primary bg-om-bg-surface rounded-t-[10px] [box-shadow:0_0_0_1px_color-mix(in_srgb,var(--om-text-primary)_15%,transparent),var(--om-shadow-sm)] [[data-theme=dark]_&]:[box-shadow:0_0_0_1px_color-mix(in_srgb,var(--om-text-primary)_25%,transparent),var(--om-shadow-sm)]` : `text-om-text-tertiary bg-transparent hover:bg-om-bg-hover rounded-t-lg shadow-none`),
                    style: {
                        height: Lu,
                        paddingRight: e.closable ? 6 : 14,
                        ...i && e.activeBackground ? {
                            background: e.activeBackground
                        } : void 0
                    },
                    children: [e.icon && (0, w.jsx)(m, {
                        name: e.icon,
                        size: 13
                    }), e.label && (0, w.jsx)(`span`, {
                        className: `max-w-[120px] truncate`,
                        children: e.label
                    }), e.closable && (0, w.jsx)(h, {
                        icon: `X`,
                        size: 18,
                        iconSize: 10,
                        onClick: t => {
                            t.stopPropagation(), e.onClose ? .()
                        },
                        style: {
                            marginLeft: 4
                        }
                    })]
                }, r)
            })
        }), r && (0, w.jsx)(`div`, {
            className: `shrink-0 flex items-end pl-1`,
            children: (0, w.jsx)(h, {
                icon: `Add`,
                size: 26,
                iconSize: 14,
                style: {
                    marginBottom: 6
                },
                onClick: i
            })
        })]
    })
}

function Bu({
    children: e,
    style: t
}) {
    return (0, w.jsx)(`div`, {
        className: `flex items-center gap-1.5 border-b border-om-border-subtle bg-om-bg-surface px-2.5 py-1.5`,
        style: t,
        children: e
    })
}
var Vu = f.bg.panel,
    Hu = `var(--om-border-default)`,
    Uu = .5,
    Wu = 8,
    Gu = `0 1px 2px rgba(0,0,0,0.04)`,
    Ku = 14,
    qu = 12,
    Ju = `color-mix(in srgb, var(--om-accent-primary), var(--om-text-primary) 25%)`,
    Yu = {
        default: `bg-om-bg-panel border-[0.5px] border-[var(--om-border-default)] shadow-[0_1px_2px_rgba(0,0,0,0.04)]`,
        dark: `bg-om-accent-black shadow-[0_2px_8px_rgba(0,0,0,0.18),0_1px_3px_rgba(0,0,0,0.12)] transition-all duration-150 hover:bg-om-accent-black-hover`,
        glow: `bg-om-accent-primary-bg border-[0.5px] border-[color-mix(in_srgb,var(--om-accent-primary)_30%,transparent)]`
    },
    Xu = {
        default: `text-om-text-secondary`,
        dark: `text-om-text-inverse`,
        glow: `text-[color-mix(in_srgb,var(--om-accent-primary),var(--om-text-primary)_25%)]`
    };

function Zu({
    icon: e,
    label: t,
    actionIcon: n,
    expanded: r,
    onClick: i,
    wrapLabel: a,
    overflowVisible: o,
    variant: s = `default`,
    footer: c,
    children: l
}) {
    let u = !!i,
        p = r && l,
        h = s === `dark` ? f.text.inverse : s === `glow` ? Ju : f.text.secondary;
    return (0, w.jsxs)(`div`, {
        className: d(`my-2 rounded-lg`, o ? `overflow-visible` : `overflow-hidden`, Yu[s]),
        children: [(0, w.jsxs)(`div`, {
            className: d(`flex min-h-6 gap-2`, a ? `items-start py-1.5 px-2.5 select-text` : [`items-center h-6 select-none`, s === `dark` ? `px-3` : `px-2.5`], u ? `cursor-pointer` : `cursor-default`),
            onClick: i,
            children: [e && (0, w.jsx)(m, {
                name: e,
                size: Ku,
                style: {
                    color: h,
                    flexShrink: 0,
                    marginTop: +!!a
                }
            }), (0, w.jsx)(`span`, {
                className: d(`text-[11px] font-medium flex-1 overflow-hidden tabular-nums`, Xu[s], a ? `whitespace-pre-wrap [word-break:break-word]` : `text-ellipsis whitespace-nowrap`),
                children: t
            }), n && (0, w.jsx)(m, {
                name: n,
                size: qu,
                className: d(`text-om-text-tertiary shrink-0 transition-transform duration-150`, r ? `rotate-180` : `rotate-0`)
            })]
        }), p && (0, w.jsx)(`div`, {
            className: `border-t-[0.5px] border-[var(--om-border-default)] py-2 px-2.5 bg-om-bg-panel`,
            children: l
        }), c && (0, w.jsx)(`div`, {
            className: `flex flex-wrap gap-1 pt-1 px-1.5 pb-1.5 border-t-[0.5px] border-[var(--om-border-default)]`,
            children: c
        })]
    })
}
var Qu = {
    bg: Vu,
    border: Hu,
    borderWidth: Uu,
    radius: Wu,
    shadow: Gu
};

function $u({
    icon: e,
    title: t,
    subtitle: n,
    actions: r,
    maxWidth: i = 360
}) {
    return (0, w.jsxs)(`div`, {
        className: `flex flex-col items-center text-center gap-[14px] py-8 px-6`,
        children: [e && (0, w.jsx)(`div`, {
            className: `w-14 h-14 rounded-full bg-om-bg-muted flex items-center justify-center text-om-text-secondary mb-0.5`,
            children: (0, w.jsx)(m, {
                name: e,
                size: 28
            })
        }), (0, w.jsx)(`div`, {
            className: `text-[17px] font-semibold text-om-text-primary tracking-[-0.005em] leading-[1.3]`,
            style: {
                maxWidth: i
            },
            children: t
        }), n && (0, w.jsx)(`div`, {
            className: `text-[13px] text-om-text-secondary leading-normal text-pretty`,
            style: {
                maxWidth: i
            },
            children: n
        }), r && (0, w.jsx)(`div`, {
            className: `flex gap-2 mt-1 flex-wrap justify-center`,
            children: r
        })]
    })
}

function ed({
    className: e,
    ...t
}) {
    return (0, w.jsx)(`a`, {
        className: d(`w-7 h-7 rounded-[7px] inline-flex items-center justify-center self-center shrink-0 text-om-accent-primary bg-om-bg-elevated cursor-default no-underline`, `shadow-[0_1px_2px_rgba(20,20,19,0.08),0_0_0_1px_var(--om-border-subtle)]`, `transition-[box-shadow,transform] duration-[120ms]`, `hover:shadow-[0_2px_5px_rgba(20,20,19,0.12),0_0_0_1px_var(--om-border-default)] hover:-translate-y-px`, `active:translate-y-px`, e),
        ...t
    })
}

function td({
    size: e = 22
}) {
    return (0, w.jsx)(`svg`, {
        width: e,
        height: e,
        viewBox: `0 0 20 21`,
        fill: `none`,
        "aria-hidden": `true`,
        children: (0, w.jsx)(`path`, {
            d: `M9.99902 0C15.5258 0.000170936 19.999 4.50643 19.999 10.0547C19.999 11.7656 19.5863 12.9976 18.7861 13.8203C17.9924 14.6362 16.9465 14.9138 15.9854 15.0078C15.05 15.0993 14.0097 15.0262 13.2549 15.0186C12.8524 15.0145 12.5177 15.0267 12.2441 15.0703C11.9682 15.1144 11.8143 15.1813 11.7305 15.2432C11.4745 15.4322 11.3353 15.7121 11.2656 16.1602C11.2303 16.3875 11.2168 16.6362 11.209 16.9131C11.2017 17.1715 11.1986 17.4893 11.1807 17.7705C11.1469 18.2975 11.0495 19.0865 10.4199 19.5908C9.7846 20.0996 8.88652 20.1057 7.85449 19.877C7.36399 19.7682 6.88652 19.6232 6.42578 19.4453C2.66989 17.9949 0.000187748 14.3414 0 10.0547C0 4.50643 4.47223 0.000171048 9.99902 0ZM9.99902 1.60547C5.36781 1.60564 1.60547 5.38391 1.60547 10.0547C1.60566 13.6582 3.84823 16.7296 7.00391 17.9482C7.39027 18.0974 7.79085 18.2184 8.20215 18.3096C9.1375 18.5169 9.384 18.3633 9.41602 18.3379C9.4524 18.3087 9.54558 18.1915 9.5791 17.668C9.5947 17.4239 9.59473 17.1786 9.60352 16.8672C9.61179 16.5742 9.62831 16.2435 9.67969 15.9131C9.78359 15.2455 10.0474 14.4906 10.7764 13.9521C11.1479 13.6778 11.5842 13.5493 11.9912 13.4844C12.4007 13.4191 12.8434 13.4088 13.2705 13.4131C14.1753 13.4222 15.0071 13.4905 15.8291 13.4102C16.6257 13.3322 17.2249 13.1235 17.6357 12.7012C18.0401 12.2855 18.3935 11.5261 18.3936 10.0547C18.3936 5.38391 14.6302 1.60564 9.99902 1.60547ZM5.11621 9.86719C5.86386 9.91468 6.45486 10.5348 6.45508 11.2939C6.45506 12.0838 5.81519 12.7245 5.02539 12.7246C4.28481 12.7246 3.67573 12.1617 3.60254 11.4404L3.59473 11.2939L3.60156 11.1533C3.66942 10.4596 4.23282 9.91186 4.93359 9.86719H5.11621ZM14.9814 7.19141C15.729 7.23889 16.3199 7.85919 16.3203 8.61816C16.3203 9.40801 15.6804 10.0487 14.8906 10.0488C14.1501 10.0487 13.5409 9.48586 13.4678 8.76465L13.46 8.61816L13.4668 8.47754C13.5348 7.78403 14.0983 7.23618 14.7988 7.19141H14.9814ZM6.4541 4.93457C7.20161 4.9822 7.79275 5.60231 7.79297 6.36133C7.79288 7.151 7.15291 7.7917 6.36328 7.79199C5.62274 7.79199 5.01369 7.22903 4.94043 6.50781L4.93262 6.36133L4.93945 6.2207C5.00731 5.52698 5.5707 4.97922 6.27148 4.93457H6.4541ZM11.3867 3.59668C12.1343 3.64419 12.7253 4.26436 12.7256 5.02344C12.7256 5.81326 12.0857 6.45393 11.2959 6.4541C10.5553 6.4541 9.94622 5.89123 9.87305 5.16992L9.86523 5.02344L9.87207 4.88281C9.93996 4.18912 10.5033 3.64133 11.2041 3.59668H11.3867Z`,
            fill: `currentColor`
        })
    })
}
var nd = {
    h1: `text-[28px] font-[380] leading-[1.2] tracking-[-0.3px] mx-0 mt-0 mb-1.5`,
    h2: `text-[20px] font-[420] leading-tight tracking-[-0.2px] mx-0 mt-0 mb-1`,
    h3: `text-base font-[450] leading-[1.3] tracking-[-0.1px] m-0`
};

function rd({
    variant: e = `h1`,
    children: t,
    subtitle: n,
    centered: r = !1,
    dim: i = !1,
    style: a,
    className: o
}) {
    let s = e;
    return (0, w.jsxs)(`div`, {
        className: d(r ? `text-center` : `text-left`, o),
        style: a,
        children: [(0, w.jsx)(s, {
            className: d(`font-om-serif`, i ? `text-om-text-tertiary` : `text-om-text-primary`, nd[e]),
            children: t
        }), n && (0, w.jsx)(`p`, {
            className: `text-[13px] text-om-text-tertiary leading-normal m-0`,
            children: n
        })]
    })
}

function id({
    sizing: e,
    align: t = `center`,
    children: n
}) {
    return (0, w.jsxs)(`span`, {
        className: `inline-grid [&>*]:[grid-area:1/1]`,
        style: {
            textAlign: t
        },
        children: [(0, w.jsx)(`span`, {
            className: `invisible select-none pointer-events-none`,
            "aria-hidden": !0,
            children: e
        }), (0, w.jsx)(`span`, {
            children: n
        })]
    })
}
var ad = new Map;

function od(e, t = !1, n) {
    let r = ad.get(re(e));
    if (r)
        for (let e of r) e(!1, t, n)
}

function sd(e) {
    let t = ad.get(re(e));
    if (t)
        for (let e of t) e(!0, !1)
}

function cd(e, t, n, r, i) {
    (0, C.useEffect)(() => {
        if (!e) return;
        let a = (e, a, o) => {
                if (!e && a && n) {
                    n(o, !0);
                    return
                }
                if (!e && n ? .(o, !1)) return;
                let s = t.current;
                if (!s) return;
                let c = new URL(s.src, window.location.href);
                c.searchParams.set(`_r`, String(Date.now())), c.hash = r ? .() ? ? ``, i ? .(), s.src = c.toString()
            },
            o = ad.get(e);
        return o || ad.set(e, o = new Set), o.add(a), () => {
            o.delete(a), o.size === 0 && ad.delete(e)
        }
    }, [e, t, n, r, i])
}
typeof window < `u` && window.addEventListener(`file-written`, e => {
    let t = e.detail;
    t ? .path && od(t.path, !!t.remote, t.edits)
});

function ld(e, t, n) {
    if (!t || !(`contentWindow` in t) || e.source !== t.contentWindow) return !1;
    let r = n ? ? ae() ? .origin;
    return r ? e.origin === r : !1
}

function ud(e) {
    return !!e && e.canEdit && e.editArmed
}

function dd(e) {
    return !!e && e.canEdit && e.tweaksArmed
}
var fd = /[;{}\\@<>]|\/\*|url\s*\(|expression\s*\(|image(-set)?\s*\(|element\s*\(|cross-fade\s*\(|paint\s*\(|[\r\n]/i;

function pd(e, t) {
    if (typeof e != `string`) return `transparent`;
    let n = e.trim();
    return n.length === 0 || n.length > 512 || fd.test(n) || typeof CSS < `u` && typeof CSS.supports == `function` && !CSS.supports(t, n) ? `transparent` : n
}

function md(e) {
    return pd(e, `color`)
}

function hd(e) {
    return pd(e, `background`)
}
var gd = new Set([`messages`, `system`, `temperature`, `top_p`, `top_k`, `stop_sequences`, `tools`, `tool_choice`]);

function _d(e) {
    let t = {};
    for (let n of gd) e[n] != null && (t[n] = e[n]);
    return t
}
var vd = /^claude-(haiku|sonnet)-[\w.-]+$/,
    yd = 32e3;

function bd(e) {
    if (!Array.isArray(e)) return `tools must be an array`;
    for (let t of e) {
        if (!wd(t)) return `each tool must be a plain object`;
        if (typeof t.name != `string` || t.name.length === 0) return `each tool needs a non-empty string name`;
        if (`type` in t && t.type !== `custom`) return `tool "${t.name}": only client tools are allowed (no \`type\`, or type: 'custom' — server tools are blocked)`;
        if (!wd(t.input_schema)) return `tool "${t.name}" needs an input_schema object`
    }
    return null
}
var xd = 2 * 1024 * 1024,
    Sd = class {
        cap;
        refillPerSec;
        tokens;
        last = performance.now();
        constructor(e, t) {
            this.cap = e, this.refillPerSec = t, this.tokens = e
        }
        take() {
            let e = performance.now();
            return this.tokens = Math.min(this.cap, this.tokens + (e - this.last) / 1e3 * this.refillPerSec), this.last = e, this.tokens < 1 ? !1 : (--this.tokens, !0)
        }
    };

function Cd(e, t) {
    return Number.isInteger(e) && e >= 0 && e < t
}

function wd(e) {
    if (typeof e != `object` || !e) return !1;
    let t = Object.getPrototypeOf(e);
    return t === Object.prototype || t === null
}
var Td = `cubic-bezier(0.2, 0, 0, 1)`;

function Ed(e, t, n, r) {
    let i = t ? .width ? ? e,
        a = t ? .height ? n / t.height : 1,
        o = e > 0 && i > 0 ? Math.min(e / i, a, 1) : 1;
    return {
        scale: o,
        designW: i,
        wrapperH: Math.min(r * o, n),
        wrapperW: i * o
    }
}

function Dd({
    src: e,
    title: n,
    viewport: i,
    maxHeight: a = 500,
    fallback: o = 60,
    refreshPath: s,
    preview: c,
    initialWidth: l,
    onLoad: u
}) {
    let {
        resolved: d
    } = p(), f = e + (e.includes(`?`) ? `&` : `?`) + `theme=` + d, m = (0, C.useRef)(null), h = (0, C.useRef)(null), [g, _] = (0, C.useState)(null), v = ce(), {
        width: y = 0
    } = t({
        ref: m,
        box: `border-box`
    });
    cd(s ? ? null, h), (0, C.useLayoutEffect)(() => {
        _(null)
    }, [e]), r(`message`, e => {
        let t = (c ? ? v) ? .origin;
        if (!ld(e, h.current, t) || e.data ? .type !== `omelette:height`) return;
        let n = e.data.height;
        typeof n == `number` && Number.isFinite(n) && _(n)
    });
    let b = g ? ? i ? .height ? ? o,
        {
            scale: x,
            designW: ee,
            wrapperH: te,
            wrapperW: ne
        } = Ed(y || l || 0, i, a, b),
        re = Math.min(b, a / (x || 1));
    return (0, w.jsx)(`div`, {
        ref: m,
        className: `flex justify-center`,
        style: {
            height: te,
            transition: `height 0.35s ${Td}`
        },
        children: (0, w.jsx)(`div`, {
            className: `overflow-hidden`,
            style: {
                width: ne,
                height: te
            },
            children: (0, w.jsx)(`iframe`, {
                ref: h,
                src: f,
                title: n,
                allow: `camera 'none'; microphone 'none'; geolocation 'none'`,
                sandbox: `allow-scripts${c||v?` allow-same-origin`:``}`,
                referrerPolicy: `no-referrer`,
                onLoad: u,
                className: `block origin-top-left bg-transparent [color-scheme:normal]`,
                style: {
                    width: ee || `100%`,
                    height: re,
                    transform: x < 1 ? `scale(${x})` : void 0,
                    transition: `transform 0.35s ${Td}`
                }
            })
        })
    })
}

function Od(e) {
    for (let t = e.parentElement; t; t = t.parentElement) {
        let e = getComputedStyle(t).overflowY;
        if (e === `auto` || e === `scroll`) return t
    }
    return null
}

function kd({
    placeholderHeight: e,
    children: t,
    onNear: n
}) {
    let r = (0, C.useRef)(null),
        [i, a] = (0, C.useState)(() => typeof IntersectionObserver != `function`),
        o = (0, C.useRef)(n);
    return o.current = n, (0, C.useEffect)(() => {
        if (i) {
            o.current ? .();
            return
        }
        let e = r.current;
        if (!e) return;
        let t = new IntersectionObserver(e => {
            e.some(e => e.isIntersecting) && a(!0)
        }, {
            root: Od(e),
            rootMargin: `100% 0px`
        });
        return t.observe(e), () => t.disconnect()
    }, [i]), i ? (0, w.jsx)(w.Fragment, {
        children: t
    }) : (0, w.jsx)(`div`, {
        ref: r,
        style: {
            height: e
        },
        "aria-hidden": !0
    })
}

function Ad({
    className: e,
    ...t
}) {
    return (0, w.jsx)(`div`, {
        className: d(je, `overflow-hidden`, e),
        ...t
    })
}

function jd({
    className: e,
    ...t
}) {
    return (0, w.jsx)(`div`, {
        className: d(`p-5`, e),
        ...t
    })
}

function Md({
    className: e,
    ...t
}) {
    return (0, w.jsx)(`div`, {
        className: d(`mb-4 text-[13px] leading-normal text-om-text-secondary`, e),
        ...t
    })
}
var Nd = `Only Claude Design admins can publish and manage default design systems. Contact your administrator.`;

function Pd() {
    let {
        restricted: e
    } = s();
    return e ? (0, w.jsxs)(g, {
        $variant: `hint`,
        role: `status`,
        "data-testid": `design-admin-notice`,
        children: [(0, w.jsx)(_, {
            name: `Info`
        }), (0, w.jsx)(`span`, {
            children: Nd
        })]
    }) : null
}

function Fd() {
    let {
        projectPath: e
    } = mt(), [t, n] = (0, C.useState)(), i = (0, C.useRef)(0), a = (0, C.useCallback)(() => {
        let t = ++i.current;
        S.readFile(`${e}/_ds_manifest.json`).then(e => t === i.current && n(JSON.parse(e).source)).catch(() => t === i.current && n(void 0))
    }, [e]);
    return (0, C.useEffect)(a, [a]), (0, C.useEffect)(() => () => {
        i.current++
    }, []), r(`files-changed`, t => {
        t.detail ? .projectPath === e && t.detail.paths ? .some(e => e === `*` || e.split(`/`).pop() === `_ds_manifest.json`) && a()
    }), t === `design-sync-cli` ? (0, w.jsxs)(g, {
        $variant: `hint`,
        role: `status`,
        "data-testid": `ds-source-notice`,
        children: [(0, w.jsx)(_, {
            name: `Info`
        }), (0, w.jsx)(`span`, {
            children: `This design system was imported from code using the /design-sync Claude Code skill. To make changes to the design system, edit your code and re-run /design-sync. The skill can take feedback and commit notes for future runs.`
        })]
    }) : null
}

function Id({
    top: e,
    bottom: t,
    bottomHeight: n,
    min: r = 60,
    max: i = 400,
    onBottomHeightChange: a
}) {
    let o = t != null,
        [s, c] = (0, C.useState)(!1),
        l = (0, C.useRef)({
            y: 0,
            h: 0
        }),
        u = (0, C.useCallback)(e => {
            e.preventDefault(), l.current = {
                y: e.clientY,
                h: n
            }, c(!0);
            let t = n,
                o = e => {
                    let n = l.current.y - e.clientY;
                    t = Math.max(r, Math.min(i, l.current.h + n)), a(t, !1)
                },
                s = () => {
                    c(!1), a(t, !0), window.removeEventListener(`mousemove`, o), window.removeEventListener(`mouseup`, s)
                };
            window.addEventListener(`mousemove`, o), window.addEventListener(`mouseup`, s)
        }, [n, r, i, a]);
    return (0, w.jsxs)(`div`, {
        className: `flex-1 flex flex-col min-h-0 relative`,
        children: [(0, w.jsx)(`div`, {
            className: `flex-1 min-h-0 flex flex-col`,
            children: e
        }), o && (0, w.jsx)(`div`, {
            className: `absolute left-0 right-0 h-2 cursor-row-resize z-10`,
            style: {
                bottom: n - 4
            },
            onMouseDown: u
        }), o && (0, w.jsx)(`div`, {
            className: `shrink-0 flex flex-col min-h-0`,
            style: {
                height: n
            },
            children: t
        }), s && (0, w.jsx)(`div`, {
            className: `absolute inset-0 z-[100] cursor-row-resize select-none`
        })]
    })
}

function Ld(e) {
    let t = new URLSearchParams(e);
    return { ...t.get(`utm_source`) === `claude_code` && {
            mode: `claude_code`
        },
        ...t.get(`utm_campaign`) === `tengu_cedar_plume` && {
            reason: `tengu_cedar_plume`
        }
    }
}
var Rd = null;

function zd(e, t) {
    Rd = Date.now();
    let r = Ld(window.location.search);
    S.trackEvent(`home_open`, {
        via: e,
        knob: t,
        ...r
    }), n(`design.home.open`, {
        attrs: {
            via: e,
            ...r
        }
    })
}

function Bd(e, t, r, i, a) {
    S.trackEvent(`home_entry_action`, {
        via: e,
        mode: t,
        ...r && {
            reason: r.cls,
            knob: String(r.rowIndex)
        },
        ...i && {
            reason: i.cluster,
            knob: String(i.index)
        },
        ...a && {
            knob: a
        }
    }), n(`design.home.entry_action`, {
        attrs: {
            via: e,
            mode: t,
            reason: r ? .cls ? ? i ? .cluster
        }
    })
}

function Vd(e, t, r, i) {
    let a = i.map(e => (e.type || ``).startsWith(`image/`) ? `image` : `file`),
        o = Rd === null ? void 0 : Math.round(Date.now() - Rd);
    S.trackEvent(`home_project_created`, {
        via: e,
        mode: t,
        attachmentsCount: i.length,
        ...a.length > 0 && {
            attachmentTypes: a
        },
        ...o !== void 0 && {
            durationMs: o
        }
    }, void 0, r), n(`design.home.project_created`, {
        duration: o,
        attrs: {
            via: e,
            mode: t,
            count: i.length
        },
        viewTiming: !1
    })
}

function Hd(e, t) {
    let r = t === `fresh` && Rd !== null ? Math.round(Date.now() - Rd) : void 0;
    S.trackEvent(`home_ds_chip_settled`, {
        via: e,
        mode: t,
        ...r !== void 0 && {
            durationMs: r
        }
    }), n(`design.home.ds_chip_settled`, {
        duration: r,
        attrs: {
            via: e,
            mode: t
        },
        viewTiming: !1
    })
}

function Ud(e) {
    S.trackEvent(`home_ds_chip_blocked_submit`, {
        via: e
    }), n(`design.home.ds_chip_blocked_submit`, {
        attrs: {
            via: e
        }
    })
}

function Wd(e, t) {
    S.trackEvent(`home_first_turn_sent`, {
        via: e
    }, void 0, t), n(`design.home.first_turn_sent`, {
        attrs: {
            via: e
        }
    })
}

function Gd(e, t) {
    S.trackEvent(`home_list_action`, {
        mode: t
    }), n(`design.home.list_action`, {
        attrs: {
            via: e,
            mode: t
        }
    })
}

function Kd(e, t) {
    S.trackEvent(e, {
        via: t
    })
}
export {
    La as $, Pe as $t, bd as A, bt as At, Zu as B, it as Bt, ld as C, Ot as Ct, hd as D, pt as Dt, dd as E, wt as Et, rd as F, _t as Ft, ju as G, We as Gt, zu as H, Ze as Ht, ed as I, nt as It, tu as J, Ve as Jt, bl as K, Fe as Kt, td as L, rt as Lt, od as M, mt as Mt, cd as N, gt as Nt, md as O, vt as Ot, id as P, yt as Pt, Ra as Q, Ue as Qt, $u as R, et as Rt, Cd as S, O as St, ud as T, Dt as Tt, Iu as U, qe as Ut, Bu as V, Qe as Vt, Fu as W, Ke as Wt, Xa as X, Me as Xt, Za as Y, He as Yt, Pa as Z, Ne as Zt, Ed as _, yr as _t, Gd as a, Oe as an, Qi as at, yd as b, Zt as bt, Kd as c, ve as cn, xi as ct, Pd as d, N as dt, je as en, Da as et, Ad as f, P as ft, Dd as g, xr as gt, kd as h, jr as ht, Wd as i, Te as in , Li as it, sd as j, ht as jt, _d as k, St as kt, Id as l, me as ln, F as lt, Md as m, Nr as mt, Hd as n, De as nn, ka as nt, Vd as o, Ee as on, ta as ot, jd as p, M as pt, Z as q, Re as qt, Bd as r, we as rn, sa as rt, zd as s, Se as sn, Zi as st, Ud as t, Ae as tn, Aa as tt, Fd as u, pe as un, Ci as ut, Sd as v, E as vt, wd as w, Et as wt, vd as x, Tn as xt, xd as y, D as yt, Qu as z, $e as zt
};
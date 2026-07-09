import {
    o as e,
    r as t
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    t as n
} from "./react-BthIFXYf.js";
import {
    dn as r
} from "./fig-kit-coverage-DSUEqVg0.js";
import {
    t as i
} from "./jsx-runtime-DDrWIXeu.js";
import {
    a,
    qn as o,
    t as s
} from "./Button-JbIB5F4R.js";
import {
    t as c
} from "./cn-qYiRd2Uw.js";
import {
    i as l
} from "./useModelSelection-Gs9zlsOR.js";
import {
    J as u,
    K as d,
    U as f,
    _t as p,
    dt as m,
    ft as h,
    it as g,
    lt as _,
    pt as v,
    q as y,
    s as b,
    ut as x,
    vt as S,
    xn as C
} from "./format-ZLL9BhVd.js";
import "./cn-BvRk9kiK.js";
import {
    Gt as w,
    Ht as T,
    J as E,
    Jt as D,
    Ut as O,
    Z as k
} from "./index-DxZs6uan.js";
import {
    g as A,
    tt as j
} from "./connectrpc-BRKh2K0Y.js";
import {
    t as M
} from "./platform-BciTLfG8.js";
import {
    g as N
} from "./home-analytics-CvEfi_eq.js";
var P = e(n(), 1),
    F = i(),
    I = `Upgrade to Max to create design systems`;

function L({
    onClick: e,
    loading: t,
    size: n,
    variant: i = `primary`,
    className: o,
    children: c,
    iconOnly: l,
    label: u
}) {
    let {
        planGated: d,
        createDisabled: f
    } = k(), p = {
        variant: i,
        size: n,
        className: o,
        "data-testid": `create-design-system-button`
    };
    return f ? l ? (0, F.jsx)(s, { ...p,
        iconOnly: !0,
        icon: `Add`,
        "aria-label": u,
        tooltip: !1,
        disabled: !0,
        disabledReason: `${u}: ${E}`
    }) : (0, F.jsx)(s, { ...p,
        disabled: !0,
        disabledReason: E,
        children: c
    }) : d ? (0, F.jsx)(s, { ...p,
        href: `${r()}/upgrade?feature=design`,
        target: `_blank`,
        onClick: () => M.trackEvent(`ds_upgrade_cta_clicked`, {
            via: `button`
        }),
        children: I
    }) : l ? (0, F.jsx)(a, {
        content: u,
        delay: 0,
        hoverable: !1,
        children: (0, F.jsx)(s, { ...p,
            iconOnly: !0,
            icon: `Add`,
            "aria-label": u,
            busy: t,
            onClick: e
        })
    }) : (0, F.jsx)(s, { ...p,
        busy: t,
        onClick: e,
        children: c
    })
}

function R({
    $size: e,
    $weight: t = 430,
    $ls: n = -.35,
    className: r,
    style: i,
    ...a
}) {
    return (0, F.jsx)(`span`, {
        className: c(`leading-[1.1] [color:var(--cds-text-primary)]`, r),
        style: {
            fontFamily: `var(--cds-font-voice, 'Anthropic Serif', Georgia, serif)`,
            fontSize: `${e}px`,
            fontWeight: t,
            fontVariationSettings: `'wght' ${t}, 'opsz' ${e}`,
            letterSpacing: `${n}px`,
            ...i
        },
        ...a
    })
}

function z({
    className: e,
    ...t
}) {
    return (0, F.jsx)(`div`, {
        className: c(`text-[13px] text-[var(--cds-text-secondary)] mt-[5px]`, e),
        ...t
    })
}

function B({
    className: e,
    ...t
}) {
    return (0, F.jsx)(`div`, {
        className: c(`text-[18px] font-[550] text-[var(--cds-text-primary)] mt-[30px] mb-1.5`, e),
        ...t
    })
}

function V({
    className: e,
    ...t
}) {
    return (0, F.jsx)(`span`, {
        className: c(`text-[13px] font-normal text-[var(--cds-text-muted)] ml-2`, e),
        ...t
    })
}

function H({
    selected: e,
    onClick: t,
    title: n,
    children: r
}) {
    let i = c(`block w-[162px] h-[108px] p-0 rounded-lg box-border overflow-hidden bg-[var(--cds-surface-2)] [box-shadow:var(--cds-shadow-sm)] cursor-default [&_*]:pointer-events-none`, e ? `border-[1.5px] border-[var(--cds-fill-accent)]` : `border-[1.5px] border-[var(--cds-border)]`, t && !e && `hover:border-[var(--cds-border-strong)]`);
    return t ? (0, F.jsx)(`button`, {
        type: `button`,
        onClick: t,
        className: i,
        title: n,
        children: r
    }) : (0, F.jsx)(`div`, {
        className: i,
        title: n,
        children: r
    })
}

function U({
    ds: e,
    onOpenProject: t,
    insideOpenProject: n = !1,
    selectedTemplate: r,
    onToggleTemplate: i,
    onUseTemplate: a
}) {
    let o = h(e ? .projectId ? ? null),
        {
            previewReady: s,
            localPreview: l
        } = v(e ? .projectId ? ? null, n),
        [u, d] = (0, P.useState)(null),
        [f, y] = (0, P.useState)(new Set);
    (0, P.useEffect)(() => {
        d(null), y(new Set)
    }, [e ? .projectId]);
    let b = o.manifest ? .templates ? ? [],
        T = o.manifest ? .brand,
        E = (0, P.useMemo)(() => T ? p(T.colorTokens) : [], [T]),
        O = (T ? .colorTokens.length ? ? 0) > 0,
        k = (T ? .fontEntries.length ? ? 0) > 0,
        M = (0, P.useMemo)(() => {
            let e = o.manifest;
            return (e ? x(e.cards, e.startingPoints, e.templates) : _(o.assets, o.groupMap)).filter(t => !(e ? .templates.length && t.label === `Templates` || O && /^colou?rs?$/i.test(t.label) || k && /^typ(?:e|ography)$/i.test(t.label)))
        }, [o, O, k]);
    return e ? (0, F.jsxs)(F.Fragment, {
        children: [(0, F.jsxs)(`div`, {
            className: `flex items-start justify-between gap-4`,
            children: [(0, F.jsxs)(`div`, {
                style: {
                    minWidth: 0
                },
                children: [(0, F.jsx)(R, {
                    $size: 26,
                    $weight: 500,
                    $ls: -.3,
                    children: e.name
                }), (0, F.jsxs)(z, {
                    children: [e.ownerDisplayName ? `Made by ${e.ownerDisplayName} · ` : ``, e.updatedAt ? `updated ${new Date(e.updatedAt).toLocaleDateString()}` : ``]
                })]
            }), t && (0, F.jsxs)(`button`, {
                type: `button`,
                onClick: () => t(e.projectId),
                className: `inline-flex items-center gap-1.5 h-8 py-0 px-2.5 shrink-0 mt-1 bg-transparent text-[var(--cds-text-secondary)] rounded-[7px] text-[12.5px] cursor-default hover:bg-[var(--cds-fill-ghost-hover)] hover:text-[var(--cds-text-primary)]`,
                children: [(0, F.jsx)(D, {
                    name: `ArrowUpRight`,
                    size: 13
                }), `Open source file`]
            })]
        }), o.loading && (0, F.jsx)(z, {
            style: {
                marginTop: 28
            },
            children: `Loading…`
        }), b.length > 0 && (0, F.jsxs)(F.Fragment, {
            children: [(0, F.jsxs)(B, {
                style: {
                    marginBottom: 12
                },
                children: [`Templates`, (0, F.jsxs)(V, {
                    children: [`· `, b.length]
                })]
            }), (0, F.jsx)(`div`, {
                className: `flex gap-3.5 overflow-x-auto -mx-11 pt-0.5 px-11 pb-1.5`,
                children: b.map(t => (0, F.jsxs)(`div`, {
                    className: `shrink-0 w-[162px] text-left cursor-default`,
                    children: [(0, F.jsx)(H, {
                        selected: r ? .dsProjectId === e.projectId && r.template.entryPath === t.entryPath,
                        onClick: i ? () => i(t) : void 0,
                        title: t.description || t.name,
                        children: s && (0, F.jsx)(N, {
                            src: A(e.projectId, t.entryPath, {
                                forIframe: !0,
                                preview: l
                            }),
                            title: t.name,
                            viewport: m(`1280x800`),
                            maxHeight: 105,
                            initialWidth: 159
                        })
                    }), (0, F.jsxs)(`span`, {
                        className: `flex items-center gap-2 mt-2`,
                        children: [(0, F.jsx)(`span`, {
                            className: `flex-1 min-w-0 text-sm leading-normal text-[var(--cds-text-primary)] truncate`,
                            children: t.name
                        }), a && (0, F.jsx)(w, {
                            variant: `default`,
                            size: `xs`,
                            onClick: () => a(t),
                            children: `Use`
                        })]
                    })]
                }, t.entryPath))
            })]
        }), O && T && (0, F.jsxs)(F.Fragment, {
            children: [(0, F.jsxs)(B, {
                children: [`Colors`, (0, F.jsxs)(V, {
                    children: [`· `, T.colorCount, ` token`, T.colorCount === 1 ? `` : `s`]
                })]
            }), E.map(e => {
                let t = f.has(e.label);
                return (0, F.jsxs)(`div`, {
                    children: [(0, F.jsxs)(`button`, {
                        type: `button`,
                        onClick: () => y(t => {
                            let n = new Set(t);
                            return n.has(e.label) ? n.delete(e.label) : n.add(e.label), n
                        }),
                        className: `flex items-center gap-2.5 w-full mt-2.5 py-[9px] px-3 bg-om-bg-stripe rounded-md text-[15px] font-semibold text-[var(--cds-text-primary)] text-left cursor-default`,
                        children: [(0, F.jsx)(D, {
                            name: `CaretDown`,
                            size: 12,
                            style: {
                                transform: t ? `rotate(-90deg)` : `none`,
                                transition: `transform var(--cds-dur-snap) var(--cds-ease-out)`,
                                color: `var(--cds-text-muted)`
                            }
                        }), e.label, (0, F.jsxs)(`span`, {
                            className: `text-xs font-normal text-[var(--cds-text-muted)]`,
                            children: [e.tokens.length, ` token`, e.tokens.length === 1 ? `` : `s`]
                        })]
                    }), !t && (0, F.jsx)(`div`, {
                        className: `grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-4 gap-y-[18px] pt-3.5 px-0.5 pb-2.5`,
                        children: e.tokens.map(e => {
                            let t = S(e.value, T.colorTokens) ? ? e.value;
                            return (0, F.jsxs)(`div`, {
                                children: [(0, F.jsx)(`div`, {
                                    className: `h-16 rounded-xl border border-[var(--cds-border)]`,
                                    style: {
                                        background: t
                                    }
                                }), (0, F.jsx)(`div`, {
                                    className: `mt-[7px] [font-family:var(--cds-font-mono)] text-xs text-[var(--cds-text-primary)] truncate`,
                                    title: e.name,
                                    children: e.name
                                }), (0, F.jsx)(`div`, {
                                    className: `[font-family:var(--cds-font-mono)] text-[11px] text-[var(--cds-text-muted)] truncate`,
                                    title: t,
                                    children: t
                                })]
                            }, `${e.name} ${e.scope??``}`)
                        })
                    })]
                }, e.label)
            })]
        }), k && T && (0, F.jsxs)(F.Fragment, {
            children: [(0, F.jsxs)(B, {
                children: [`Type`, (0, F.jsxs)(V, {
                    children: [`· `, T.fontEntries.length, ` token`, T.fontEntries.length === 1 ? `` : `s`]
                })]
            }), T.fontEntries.map(e => (0, F.jsxs)(`div`, {
                className: `flex items-baseline gap-3 py-[9px] border-b border-[var(--cds-border)]`,
                children: [(0, F.jsx)(`span`, {
                    className: `text-[22px] leading-tight text-[var(--cds-text-primary)] truncate`,
                    style: {
                        fontFamily: `${C(e.family)}, sans-serif`
                    },
                    children: e.label
                }), (0, F.jsx)(`span`, {
                    className: `text-[11px] text-[var(--cds-text-muted)] whitespace-nowrap shrink-0`,
                    children: e.family
                })]
            }, `${e.label} ${e.family}`))]
        }), M.map(t => (0, F.jsxs)(`div`, {
            children: [(0, F.jsxs)(B, {
                children: [t.label, (0, F.jsxs)(V, {
                    children: [`· `, t.items.length]
                })]
            }), t.items.map(t => {
                let n = !Array.isArray(t),
                    r = n ? t.key : t[0],
                    i = n ? t.name : t[0],
                    a = n ? void 0 : j(t[1]),
                    o = n ? t.subtitle : a ? .subtitle,
                    f = n ? t.previewPath : a ? .path,
                    p = n ? m(t.viewport) : a ? .viewport,
                    h = u === r;
                return (0, F.jsxs)(`div`, {
                    children: [(0, F.jsxs)(`button`, {
                        type: `button`,
                        onClick: () => d(e => e === r ? null : r),
                        className: `relative flex items-baseline gap-2 w-full py-[9px] px-0 bg-transparent text-left cursor-default hover:bg-om-bg-stripe`,
                        children: [(0, F.jsx)(D, {
                            name: `CaretRight`,
                            size: 12,
                            className: c(`absolute -left-[19px] top-3 text-[var(--cds-text-muted)] [transition:transform_var(--cds-dur-snap)_var(--cds-ease-out)]`, h && `rotate-90`)
                        }), (0, F.jsx)(`span`, {
                            className: `text-sm font-semibold text-[var(--cds-text-primary)] truncate`,
                            children: i
                        }), o && (0, F.jsx)(`span`, {
                            className: `text-[11px] text-[var(--cds-text-muted)] whitespace-nowrap shrink-0`,
                            children: o
                        })]
                    }), h && s && f && (0, F.jsx)(`div`, {
                        style: {
                            padding: `2px 0 18px`
                        },
                        children: (0, F.jsx)(g, {
                            children: (0, F.jsx)(N, {
                                src: A(e.projectId, f, {
                                    forIframe: !0,
                                    preview: l
                                }),
                                title: f,
                                viewport: p
                            })
                        })
                    })]
                }, r)
            })]
        }, t.label)), !o.loading && M.length === 0 && b.length === 0 && !O && !k && (0, F.jsx)(z, {
            style: {
                marginTop: 28
            },
            children: `This design system is empty — finish setting it up to add tokens, components, and brand assets.`
        })]
    }) : (0, F.jsx)(`div`, {
        className: `h-full flex items-center justify-center text-[13.5px] text-[var(--cds-text-muted)]`,
        children: `Select a design system to browse it`
    })
}
var W = t({
    DS_MODAL_PICK_CLS: () => Z,
    DefaultBadge: () => Y,
    DsBrowseModal: () => te,
    DsListRow: () => $,
    DsRowMetaLines: () => X,
    INFO_BTN_CLS: () => Q,
    ModalBody: () => K,
    ModalBrowse: () => J,
    ModalHead: () => G,
    ModalList: () => q
});

function G({
    className: e,
    ...t
}) {
    return (0, F.jsx)(`div`, {
        className: c(`relative flex items-center gap-2 p-2 border-b border-[var(--cds-border)] bg-[var(--cds-surface-popover)]`, e),
        ...t
    })
}

function K({
    className: e,
    ...t
}) {
    return (0, F.jsx)(`div`, {
        className: c(`flex-1 flex min-h-0`, e),
        ...t
    })
}

function q({
    className: e,
    ...t
}) {
    return (0, F.jsx)(`div`, {
        className: c(`w-[340px] shrink-0 overflow-y-auto py-[5px] px-2 bg-[var(--cds-surface-popover)] border-r border-[var(--cds-border)]`, `[@media(max-width:719px)]:w-full [@media(max-width:719px)]:border-r-0`, e),
        ...t
    })
}

function J({
    className: e,
    paperColor: t,
    style: n,
    children: r,
    ...i
}) {
    return (0, F.jsx)(`div`, {
        className: c(`flex-1 min-w-0 overflow-y-auto pt-8 px-[44px] pb-[44px] bg-[var(--cds-page-bg)]`, `[@media(max-width:719px)]:hidden`, e),
        style: t ? { ...n,
            background: t
        } : n,
        ...i,
        children: t ? (0, F.jsx)(o, {
            mode: `light`,
            density: `compact`,
            className: `contents`,
            children: r
        }) : r
    })
}

function Y({
    className: e,
    ...t
}) {
    return (0, F.jsx)(`span`, {
        className: c(`shrink-0 text-[10.5px] font-medium text-[var(--cds-text-secondary)] bg-[var(--cds-page-bg)] border border-[var(--cds-border)] rounded-full py-[1.5px] px-[7px]`, e),
        ...t
    })
}

function X({
    ds: e
}) {
    let t = h(e.projectId),
        n = t.manifest ? .brand ? .fontFamilies ? ? [],
        r = t.manifest ? .templates.length ? ? 0,
        i = [n.length > 0 ? n.slice(0, 2).join(`, `) + (n.length > 2 ? ` +${n.length-2}` : ``) : null, r > 0 ? `${r} template${r===1?``:`s`}` : null].filter(Boolean);
    return i.length === 0 ? null : (0, F.jsx)(y, {
        children: i.join(` · `)
    })
}
var Z = `flex flex-1 items-center gap-2.5 min-w-0 p-0 text-left cursor-default [font:inherit] [color:inherit] outline-none`,
    Q = `inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-md p-0 text-[var(--cds-text-muted)] [font:inherit] cursor-default hover:bg-[var(--cds-fill-ghost-hover)] hover:text-[var(--cds-text-primary)]`;

function $({
    ds: e,
    checked: t,
    isDefault: n,
    onPick: r,
    onBrowse: i
}) {
    return (0, F.jsxs)(d, {
        selected: t,
        selectedTone: `accent`,
        className: `[&:has(:focus-visible)]:bg-[var(--cds-fill-ghost-hover)] [&:has(:focus-visible)]:[box-shadow:var(--cds-focus-shadow)]`,
        onClick: r,
        "data-testid": `ds-browse-row`,
        children: [(0, F.jsxs)(`button`, {
            type: `button`,
            className: Z,
            "aria-pressed": t,
            onClick: e => {
                e.stopPropagation(), r(e)
            },
            children: [(0, F.jsx)(b, {
                projectId: e.projectId,
                updatedAt: e.updatedAt
            }), (0, F.jsxs)(`span`, {
                style: {
                    flex: 1,
                    minWidth: 0
                },
                children: [(0, F.jsx)(u, {
                    children: e.name
                }), (0, F.jsx)(X, {
                    ds: e
                })]
            }), n && (0, F.jsx)(Y, {
                children: `Org default`
            })]
        }), (0, F.jsx)(`button`, {
            type: `button`,
            className: Q,
            title: `See contents`,
            onClick: e => {
                e.stopPropagation(), i()
            },
            children: (0, F.jsx)(D, {
                name: `CaretRight`,
                size: 13
            })
        })]
    })
}

function ee(e, t, n, r) {
    let i = new Set(t.map(e => e.projectId)),
        a = [],
        o = [],
        s = [];
    for (let t of e) {
        if (i.has(t)) continue;
        let e = n ? .byId.get(t);
        e ? a.push(e) : r || n ? .pendingIds.has(t) ? o.push(t) : s.push(t)
    }
    return {
        boundSelected: a,
        pendingSelected: o,
        unknownSelected: s
    }
}

function te({
    isOpen: e,
    onClose: t,
    designSystems: n,
    dsListLoading: r = !1,
    defaultDsId: i,
    selectedDsIds: a,
    resolution: o,
    onToggleDs: p,
    onSelectOnlyDs: m,
    onClearDs: g,
    onSetupDesignSystem: _,
    creatingDesignSystem: v = !1,
    onOpenProject: b,
    insideOpenProject: x = !1,
    selectedTemplate: S,
    onToggleTemplate: C,
    onUseTemplate: E
}) {
    let [k, A] = (0, P.useState)(``), [j, M] = (0, P.useState)(null), N = m != null, [I, R] = (0, P.useState)(!0);
    (0, P.useEffect)(() => {
        e && (A(``), M(null), R(!0))
    }, [e]);
    let z = (e, t) => {
            M(e);
            let n = !N || I || t.shiftKey;
            if (t.shiftKey && !I && R(!0), n || m == null) {
                p(e);
                return
            }
            m(e)
        },
        B = (0, P.useMemo)(() => {
            let e = k.toLowerCase();
            return n.filter(t => !e || t.name.toLowerCase().includes(e)).sort((e, t) => e.projectId === i ? -1 : t.projectId === i ? 1 : e.name.localeCompare(t.name, void 0, {
                sensitivity: `base`
            }))
        }, [n, k, i]),
        {
            boundSelected: V,
            pendingSelected: H,
            unknownSelected: W
        } = (0, P.useMemo)(() => ee(a, n, o, r), [a, n, o, r]),
        Y = e => e ? n.find(t => t.projectId === e) ? ? o ? .byId.get(e) ? ? null : null,
        X = Y(j ? ? void 0) ? ? Y(a[0]),
        Q = h(X ? .projectId ? ? null).manifest ? .brand ? .paperColor;
    return (0, F.jsx)(T, {
        isOpen: e,
        onClose: t,
        children: (0, F.jsx)(l, {
            density: `compact`,
            className: `contents`,
            children: (0, F.jsxs)(`div`, {
                role: `dialog`,
                "aria-modal": `true`,
                "aria-label": `Browse design systems`,
                "data-testid": `ds-browse-modal`,
                className: c(`w-[80vw] h-[80vh] max-w-[1480px] bg-[var(--cds-surface-popover)] border border-om-border-modal rounded-xl shadow-om-modal flex flex-col overflow-hidden`, O, `[animation-duration:0.18s] [animation-timing-function:ease]`, `[@media(max-width:719px)]:w-[calc(100vw-24px)] [@media(max-width:719px)]:h-[calc(100vh-24px)]`),
                children: [(0, F.jsxs)(G, {
                    children: [(0, F.jsxs)(f, {
                        style: {
                            flex: `1 1 160px`,
                            maxWidth: 324,
                            height: 34
                        },
                        children: [(0, F.jsx)(D, {
                            name: `Search`,
                            size: 14
                        }), (0, F.jsx)(`input`, {
                            "data-autofocus": !0,
                            value: k,
                            onChange: e => A(e.target.value),
                            placeholder: `Search design systems`
                        })]
                    }), N && (0, F.jsx)(s, {
                        variant: `ghost`,
                        pressed: I,
                        icon: `Checklist`,
                        onClick: () => R(e => !e),
                        children: `Select multiple`
                    }), g && a.length > 0 && (0, F.jsx)(s, {
                        variant: `ghost`,
                        icon: `XCircle`,
                        onClick: g,
                        children: `Clear selection`
                    }), (0, F.jsx)(`div`, {
                        style: {
                            flex: 1
                        }
                    }), _ && (0, F.jsx)(L, {
                        variant: `secondary`,
                        loading: v,
                        onClick: () => {
                            t(), _()
                        },
                        children: `Create design system`
                    }), (0, F.jsx)(w, {
                        variant: `black`,
                        onClick: t,
                        children: `Done`
                    })]
                }), (0, F.jsxs)(K, {
                    children: [(0, F.jsxs)(q, {
                        children: [V.map(e => (0, F.jsx)($, {
                            ds: e,
                            checked: !0,
                            isDefault: e.projectId === i,
                            onPick: t => z(e.projectId, t),
                            onBrowse: () => M(e.projectId)
                        }, e.projectId)), [...H.map(e => ({
                            id: e,
                            pending: !0
                        })), ...W.map(e => ({
                            id: e,
                            pending: !1
                        }))].map(({
                            id: e,
                            pending: t
                        }) => (0, F.jsx)(d, {
                            selected: !0,
                            selectedTone: `accent`,
                            className: `[&:has(:focus-visible)]:bg-[var(--cds-fill-ghost-hover)] [&:has(:focus-visible)]:[box-shadow:var(--cds-focus-shadow)]`,
                            onClick: () => p(e),
                            children: (0, F.jsx)(`button`, {
                                type: `button`,
                                className: Z,
                                title: `Remove design system`,
                                onClick: t => {
                                    t.stopPropagation(), p(e)
                                },
                                children: (0, F.jsxs)(`span`, {
                                    style: {
                                        flex: 1,
                                        minWidth: 0
                                    },
                                    children: [(0, F.jsx)(u, {
                                        children: t ? `Loading…` : `Unknown design system`
                                    }), (0, F.jsx)(y, {
                                        children: t ? `Resolving design system — click to remove it` : `No longer available — click to remove it`
                                    })]
                                })
                            })
                        }, e)), B.map(e => (0, F.jsx)($, {
                            ds: e,
                            checked: a.includes(e.projectId),
                            isDefault: e.projectId === i,
                            onPick: t => z(e.projectId, t),
                            onBrowse: () => M(e.projectId)
                        }, e.projectId)), B.length === 0 && V.length === 0 && H.length === 0 && W.length === 0 && (0, F.jsx)(y, {
                            style: {
                                padding: `14px 10px`
                            },
                            children: r ? `Loading…` : k ? `No design systems match` : `No design systems yet`
                        })]
                    }), (0, F.jsx)(J, {
                        paperColor: Q,
                        children: (0, F.jsx)(U, {
                            ds: X,
                            onOpenProject: b,
                            insideOpenProject: x,
                            selectedTemplate: S,
                            onToggleTemplate: C && X ? e => C(e, X.projectId) : void 0,
                            onUseTemplate: E && X ? e => {
                                E(e, X.projectId), t()
                            } : void 0
                        })
                    })]
                })]
            })
        })
    })
}
export {
    X as a, J as c, U as d, R as f, W as i, G as l, Y as n, Q as o, L as p, te as r, K as s, Z as t, q as u
};
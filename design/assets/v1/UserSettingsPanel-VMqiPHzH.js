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
    p as r
} from "./useOrg-DgFJtzUv.js";
import {
    t as i
} from "./jsx-runtime-DDrWIXeu.js";
import {
    ut as a
} from "./Button-JbIB5F4R.js";
import {
    t as o
} from "./cn-qYiRd2Uw.js";
import {
    i as s
} from "./useModelSelection-Gs9zlsOR.js";
import "./cn-BvRk9kiK.js";
import {
    G as c,
    Gt as l,
    H as u,
    Ht as d,
    Q as f,
    Ut as p,
    V as m
} from "./index-DxZs6uan.js";
import {
    x as h
} from "./client-BkAIwXnN.js";
import {
    t as g
} from "./platform-BciTLfG8.js";
import {
    Ct as _,
    Gt as v,
    Jt as y,
    Wt as b,
    qt as x,
    rn as S,
    wt as C
} from "./home-analytics-CvEfi_eq.js";
import {
    n as w,
    t as T
} from "./useReferral-Cg9xOWlq.js";
import {
    r as E
} from "./useUserSettings-DXDUhhmv.js";
var D = e(n(), 1),
    O = i(),
    k = [{
        value: `send`,
        label: `Sends message`
    }, {
        value: `newline`,
        label: `Starts a new line`
    }],
    A = [{
        value: `on`,
        label: `On`
    }, {
        value: `off`,
        label: `Off`
    }],
    j = [{
        value: `system`,
        label: `System`
    }, {
        value: `light`,
        label: `Light`
    }, {
        value: `dark`,
        label: `Dark`
    }];

function M() {
    let e = f(`__gb__375802038`).on,
        n = w(),
        r = e && (n === null || n.placements.settings !== !1),
        {
            eligible: i,
            shareLink: o,
            remaining: c,
            limit: d,
            termsUrl: p
        } = T({
            enabled: r
        }),
        {
            copied: h,
            copy: _
        } = u(),
        {
            showToast: v
        } = m(),
        b = r && i && !!o && c !== void 0 && c > 0;
    (0, D.useEffect)(() => {
        b && (t(`design.guest_pass.shown`, {
            attrs: {
                source: `settings`
            }
        }), g.trackEvent(`guest_pass_shown`, {
            via: `settings`
        }))
    }, [b]);
    let C = (0, D.useCallback)(() => {
        o && _(o).then(e => {
            t(`design.guest_pass.copy_link`, {
                attrs: {
                    ok: e,
                    source: `settings`
                }
            }), g.trackEvent(`guest_pass_link_copied`, {
                via: `settings`,
                ok: e
            }), e || v(`Could not copy link. Try again.`, `error`)
        })
    }, [o, _, v]);
    return b ? (0, O.jsx)(x, {
        label: `Guest passes`,
        children: (0, O.jsx)(y, {
            icon: (0, O.jsx)(s, {
                className: `contents`,
                children: (0, O.jsx)(a, {
                    name: `Gift`,
                    size: `md`
                })
            }),
            title: `${c}/${d??c} left`,
            subtitle: (0, O.jsxs)(O.Fragment, {
                children: [`Send a friend a free week of Claude. If they subscribe, you’ll get $10 of usage credits.`, p ? .startsWith(`https://`) && (0, O.jsxs)(O.Fragment, {
                    children: [` `, (0, O.jsx)(`a`, {
                        href: p,
                        target: `_blank`,
                        rel: `noopener noreferrer`,
                        className: `underline`,
                        children: `Terms apply`
                    })]
                })]
            }),
            expandedContent: (0, O.jsxs)(`div`, {
                className: `flex items-center gap-2`,
                children: [(0, O.jsx)(S, {
                    readOnly: !0,
                    value: o,
                    "aria-label": `Guest pass invite link`,
                    className: `flex-1 min-w-0 truncate`,
                    onFocus: e => e.currentTarget.select(),
                    onMouseUp: e => {
                        document.activeElement === e.currentTarget && e.preventDefault()
                    }
                }), (0, O.jsx)(l, {
                    size: `xs`,
                    onClick: C,
                    children: (0, O.jsxs)(`span`, {
                        className: `inline-grid place-items-center`,
                        children: [(0, O.jsx)(`span`, {
                            "aria-hidden": !0,
                            className: `invisible col-start-1 row-start-1`,
                            children: `Copy link`
                        }), (0, O.jsx)(`span`, {
                            className: `col-start-1 row-start-1`,
                            children: h ? `Copied!` : `Copy link`
                        })]
                    })
                })]
            })
        })
    }) : null
}

function N({
    open: e,
    onClose: t
}) {
    let {
        theme: n,
        setTheme: i,
        enabled: a
    } = c(), [s, l] = E(), u = f(`__gb__3669825161`).on, m = r(), g = s.enterForNewline ? `newline` : `send`, S = h ? (0, O.jsxs)(O.Fragment, {
        children: [`On touch devices, `, (0, O.jsx)(_, {
            children: `Enter`
        }), ` always inserts a new line. Use the Send button.`]
    }) : g === `send` ? (0, O.jsxs)(O.Fragment, {
        children: [(0, O.jsx)(_, {
            children: `Shift`
        }), (0, O.jsx)(_, {
            children: `Enter`
        }), ` for a new line.`]
    }) : (0, O.jsxs)(O.Fragment, {
        children: [(0, O.jsx)(_, {
            children: C
        }), (0, O.jsx)(_, {
            children: `Enter`
        }), ` to send.`]
    });
    return (0, O.jsx)(d, {
        isOpen: e,
        onClose: t,
        children: (0, O.jsxs)(`div`, {
            className: o(`w-[500px] max-w-[calc(100vw-32px)] bg-om-bg-app border border-om-border-default rounded-[14px] shadow-om-modal overflow-hidden [animation-duration:0.18s] [animation-timing-function:ease]`, p),
            children: [(0, O.jsx)(v, {
                title: `Settings`,
                onClose: t
            }), (0, O.jsxs)(`div`, {
                className: `flex flex-col pt-[1em] px-5 pb-5`,
                style: {
                    gap: 24
                },
                children: [(0, O.jsx)(x, {
                    footerLabel: S,
                    children: (0, O.jsx)(y, {
                        title: `Enter key`,
                        accessory: (0, O.jsx)(b, {
                            size: `xs`,
                            segments: k,
                            value: g,
                            onChange: e => l(t => ({ ...t,
                                enterForNewline: e === `newline`
                            }))
                        })
                    })
                }), a && (0, O.jsx)(x, {
                    children: (0, O.jsx)(y, {
                        title: `Appearance`,
                        accessory: (0, O.jsx)(b, {
                            size: `xs`,
                            segments: j,
                            value: n,
                            onChange: i
                        })
                    })
                }), u && (0, O.jsx)(x, {
                    children: (0, O.jsx)(y, {
                        title: `Switch models when a message is flagged`,
                        subtitle: `When safety measures flag a message, automatically switch to a different model to keep chatting. When off, your chat will pause instead.`,
                        accessory: (0, O.jsx)(b, {
                            size: `xs`,
                            segments: A,
                            value: s.autoFallbackOnRefusal ? `on` : `off`,
                            onChange: e => l(t => ({ ...t,
                                autoFallbackOnRefusal: e === `on`
                            }))
                        })
                    })
                }), (0, O.jsx)(M, {}), m === `full` && (0, O.jsx)(x, {
                    children: (0, O.jsx)(y, {
                        title: `Claude Code access`,
                        subtitle: `Let Claude read and edit your Design projects from Claude Code and other connected tools.`,
                        accessory: (0, O.jsx)(b, {
                            size: `xs`,
                            segments: A,
                            value: s.agentDesignProjectsAt ? `on` : `off`,
                            onChange: e => l(t => ({ ...t,
                                agentDesignProjectsAt: e === `on` ? new Date : null
                            }))
                        })
                    })
                })]
            })]
        })
    })
}
export {
    N as UserSettingsPanel
};
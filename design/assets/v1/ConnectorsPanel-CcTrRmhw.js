import {
    o as e
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    t
} from "./react-BthIFXYf.js";
import {
    fn as n,
    ln as r
} from "./fig-kit-coverage-DSUEqVg0.js";
import {
    t as i
} from "./jsx-runtime-DDrWIXeu.js";
import {
    t as a
} from "./cn-qYiRd2Uw.js";
import "./cn-BvRk9kiK.js";
import {
    Ft as o,
    Gt as s,
    Ht as c,
    Jt as l,
    Q as u,
    Ut as d,
    V as f
} from "./index-DxZs6uan.js";
import {
    r as p
} from "./client-BkAIwXnN.js";
import {
    At as m,
    Bt as h,
    Cr as g,
    Ft as _,
    Lt as v,
    Mt as y,
    Nt as b,
    Rt as x,
    jt as S,
    kt as C
} from "./connectrpc-BRKh2K0Y.js";
import {
    t as w
} from "./platform-BciTLfG8.js";
import {
    Gt as T,
    Jt as E,
    qt as D,
    sn as O
} from "./home-analytics-CvEfi_eq.js";
var k = e(t(), 1),
    A = i(),
    j = {
        figma: `Import frames and design context`,
        github: `Read repos, open pull requests`,
        "google drive": `Search and read your Drive files`,
        slack: `Search channels and read threads`,
        linear: `Create and update issues`,
        notion: `Search and read pages`,
        sentry: `Investigate errors and traces`,
        stripe: `Look up customers and charges`,
        intercom: `Read conversations and contacts`,
        postgres: `Query your database`
    };

function M(e) {
    return j[e.toLowerCase()]
}

function N(e, t) {
    return e.connected === t.connected ? e.name.localeCompare(t.name) : e.connected ? -1 : 1
}

function P({
    entry: e
}) {
    let t = M(e.name),
        [i, a] = (0, k.useState)(!1),
        [o, c] = (0, k.useState)(!1),
        l = (0, k.useRef)(null),
        {
            showToast: u
        } = f(),
        d = async (t, n) => {
            a(!0);
            try {
                await n()
            } catch (n) {
                let i = r(n);
                i.includes(`was closed`) || u(i || `Failed to ${t} ${e.name}`, `error`)
            } finally {
                a(!1)
            }
        },
        p = n(e.serverId ? {
            connector: e.serverId
        } : void 0),
        m = () => w.openExternal(p),
        h = e.connected ? (0, A.jsxs)(A.Fragment, {
            children: [(0, A.jsxs)(`span`, {
                className: `inline-flex items-center gap-[5px] text-[9px] font-semibold tracking-[0.4px] uppercase text-om-accent-success`,
                children: [(0, A.jsx)(`span`, {
                    className: `w-[5px] h-[5px] rounded-full bg-om-accent-success`
                }), `Connected`]
            }), e.type === `native` ? (0, A.jsxs)(A.Fragment, {
                children: [(0, A.jsx)(s, {
                    ref: l,
                    size: `xs`,
                    variant: `default`,
                    onClick: () => c(!0),
                    disabled: i,
                    children: `Manage`
                }), (0, A.jsx)(O, {
                    open: o,
                    onClose: () => c(!1),
                    anchorEl: l.current,
                    placement: `bottom`,
                    items: [...e.account ? [{
                        label: `Connected as ${e.account}`,
                        disabled: !0
                    }] : [], ...e.onConfigure ? [{
                        label: `Configure access`,
                        disabled: i,
                        onClick: e.onConfigure
                    }] : [], {
                        label: i ? `Disconnecting…` : `Disconnect`,
                        icon: `Logout`,
                        destructive: !0,
                        disabled: i || !e.onDisconnect,
                        onClick: () => e.onDisconnect && void d(`disconnect`, e.onDisconnect)
                    }]
                })]
            }) : (0, A.jsx)(s, {
                size: `xs`,
                variant: `default`,
                icon: `ArrowOutSquare`,
                onClick: m,
                children: `Manage`
            })]
        }) : e.onConnect ? (0, A.jsx)(s, {
            size: `xs`,
            variant: `default`,
            onClick: () => void d(`connect`, e.onConnect),
            disabled: i,
            loading: i,
            children: `Connect`
        }) : (0, A.jsx)(s, {
            size: `xs`,
            variant: `default`,
            icon: `ArrowOutSquare`,
            onClick: m,
            children: `Connect`
        });
    return (0, A.jsx)(E, {
        title: (0, A.jsxs)(`span`, {
            className: `inline-flex items-center gap-2 min-w-0`,
            children: [e.name, e.type === `mcp` && (0, A.jsx)(`span`, {
                className: `text-[9px] font-semibold tracking-[0.4px] uppercase rounded-[4px] py-0.5 px-[5px] shrink-0 text-om-text-tertiary bg-om-bg-muted`,
                children: `mcp`
            })]
        }),
        subtitle: t ? ? (e.connected ? `Connected` : `Not connected`),
        accessory: h
    })
}

function F({
    open: e,
    onClose: t
}) {
    let [r, i] = (0, k.useState)(() => x()), [f, O] = (0, k.useState)(() => y()), [j, M] = (0, k.useState)([]), [F, I] = (0, k.useState)(!0), L = u(`__gb__2420051580`).on;
    (0, k.useEffect)(() => h(i), []), (0, k.useEffect)(() => b(O), []), (0, k.useEffect)(() => {
        if (!e) return;
        let t = !1,
            n = e => {
                p().mcpListConnectors({}).then(n => {
                    t || (M(n.connectors ? ? []), e && g({
                        force: !0
                    }))
                }, () => !t && M([])).finally(() => !t && I(!1))
            };
        n(!0);
        let r = () => n(!1);
        return window.addEventListener(`focus`, r), () => {
            t = !0, window.removeEventListener(`focus`, r)
        }
    }, [e]);
    let R = (0, k.useMemo)(() => [...L ? [{
            name: `Figma`,
            type: `native`,
            connected: r.connected,
            onConnect: _,
            onDisconnect: v
        }] : [], {
            name: `GitHub`,
            type: `native`,
            connected: f.connected,
            account: f.connected ? f.login : void 0,
            onConnect: () => C(),
            onConfigure: m,
            onDisconnect: S
        }].sort(N), [r.connected, f.connected, f.login, L]),
        z = (0, k.useMemo)(() => j.map(e => ({
            name: e.displayName,
            type: `mcp`,
            connected: e.connected,
            serverId: e.serverId || void 0
        })).sort(N), [j]),
        B = R,
        V = z;
    return (0, A.jsx)(c, {
        isOpen: e,
        onClose: t,
        children: (0, A.jsxs)(`div`, {
            className: a(`w-[500px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-64px)] flex flex-col bg-om-bg-app border border-om-border-default rounded-[14px] shadow-om-modal overflow-hidden`, d, `[animation-duration:0.18s] [animation-timing-function:ease]`),
            children: [(0, A.jsx)(T, {
                title: `Connectors`,
                subtitle: `Bring your tools and data into Claude`,
                onClose: t
            }), (0, A.jsxs)(`div`, {
                className: `pt-[1em] px-5 pb-5 overflow-y-auto flex-1 flex flex-col gap-4`,
                children: [B.length > 0 && (0, A.jsx)(D, {
                    label: `Connectors`,
                    children: B.map(e => (0, A.jsx)(P, {
                        entry: e
                    }, `native:${e.name}`))
                }), F && V.length === 0 && (0, A.jsx)(D, {
                    label: `claude.ai connectors`,
                    children: (0, A.jsx)(E, {
                        title: (0, A.jsx)(`span`, {
                            style: {
                                color: o.text.tertiary
                            },
                            children: `Loading…`
                        })
                    })
                }), V.length > 0 && (0, A.jsx)(D, {
                    label: `claude.ai connectors`,
                    children: V.map(e => (0, A.jsx)(P, {
                        entry: e
                    }, `mcp:${e.name}`))
                })]
            }), (0, A.jsxs)(`div`, {
                className: `flex items-center gap-2 py-3 px-5 bg-om-bg-panel border-t border-om-border-subtle shrink-0`,
                children: [(0, A.jsx)(l, {
                    name: `Info`,
                    size: 12,
                    style: {
                        color: o.text.tertiary,
                        flexShrink: 0
                    }
                }), (0, A.jsx)(`span`, {
                    className: `flex-1 text-[11px] text-om-text-tertiary`,
                    children: `Configured Claude.ai connectors will also be available here`
                }), (0, A.jsx)(s, {
                    size: `xs`,
                    variant: `default`,
                    icon: `ArrowOutSquare`,
                    onClick: () => w.openExternal(n({
                        directory: !0
                    })),
                    children: `Browse directory`
                })]
            })]
        })
    })
}
export {
    F as ConnectorsPanel
};
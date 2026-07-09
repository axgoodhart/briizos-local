import {
    o as e
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    a as t,
    d as n,
    n as r
} from "./client-lite-BraEm36W.js";
import {
    t as i
} from "./react-BthIFXYf.js";
import {
    t as a
} from "./jsx-runtime-DDrWIXeu.js";
import {
    t as o
} from "./cn-qYiRd2Uw.js";
import "./cn-BvRk9kiK.js";
import {
    Gt as s,
    H as c,
    Ht as ee,
    Kt as l,
    Ut as u,
    V as d
} from "./index-DxZs6uan.js";
import {
    A as te,
    k as ne,
    r as re,
    y as f
} from "./client-BkAIwXnN.js";
import {
    s as ie
} from "./connectrpc-BRKh2K0Y.js";
import {
    t as p
} from "./platform-BciTLfG8.js";
import {
    Wt as ae,
    in as m,
    tn as h
} from "./home-analytics-CvEfi_eq.js";
import {
    a as g
} from "./shared-BtICgni1.js";
var _ = e(i(), 1),
    v = a(),
    oe = `X-Omelette-Reason`,
    se = `claude_code_unavailable`,
    y = `bundle_too_large`,
    b = {
        bg: `#1a1918`,
        chrome: `#252321`,
        fg: `#d1cfc5`,
        gray: `rgb(153,153,153)`,
        blue: `rgb(177,185,249)`,
        orange: `rgb(215,119,87)`,
        font: `'JetBrains Mono', 'SF Mono', Menlo, Monaco, monospace`
    },
    x = `https://api.anthropic.com/v1/design/mcp`;

function S({
    className: e,
    ...t
}) {
    return (0, v.jsx)(`div`, {
        className: o(`w-[580px] max-w-[calc(100vw-32px)] bg-om-bg-surface border border-om-border-default rounded-[14px] shadow-om-modal overflow-hidden`, u, `[animation-duration:0.18s] [animation-timing-function:ease]`, e),
        ...t
    })
}

function C({
    c: e
}) {
    return (0, v.jsx)(`span`, {
        className: `w-[11px] h-[11px] rounded-full`,
        style: {
            background: e
        }
    })
}

function w({
    children: e
}) {
    return (0, v.jsx)(`span`, {
        className: `text-[#bcd1ca] break-all`,
        children: e
    })
}

function T(e) {
    return e.replace(/[^A-Za-z0-9]+/g, `-`).toLowerCase().replace(/^-+|-+$/g, ``).slice(0, 60).replace(/-+$/, ``) || `untitled`
}
var E = [{
    value: `local`,
    label: `Send to local coding agent`
}, {
    value: `web`,
    label: `Send to Claude Code Web`
}];

function D({
    open: e,
    onClose: i,
    projectId: a,
    projectName: u,
    currentFile: D
}) {
    let {
        showToast: O
    } = d(), [k, A] = (0, _.useState)(`local`), [j, M] = (0, _.useState)(``), [N, P] = (0, _.useState)(!1), [F, I] = (0, _.useState)(!1), [L, R] = (0, _.useState)(!1), [z, B] = (0, _.useState)(null), V = ie() ? .hasClaudeCodeSession ? ? !1, {
        copied: H,
        copy: U,
        reset: W
    } = c(), G = T(u), K = (0, _.useRef)(null), ce = () => K.current ? .focus(), le = (0, _.useMemo)(() => {
        let e = new URLSearchParams;
        return D && e.set(`open_file`, D), e
    }, [D]), q = (0, _.useMemo)(() => {
        let e = new URL(`/design/p/${encodeURIComponent(a)}`, window.location.origin);
        return D && e.searchParams.set(`file`, D), e.href
    }, [a, D]), J = k === `web`, Y = !z, X = j.trim() || D || `the designs in this project`, Z = !j.trim(), Q = !J && N, ue = (0, _.useMemo)(() => Q ? `Import the attached ${G}.zip — read the README inside.\nImplement: ${X}` : `Use the claude_design MCP (${x}, auth via /design-login) to import this project:\n${q}\n\nImplement: ${X}`, [Q, G, q, X]), de = `Your designs and context are attached — please implement ${X}.`;
    (0, _.useEffect)(() => {
        if (!e) {
            W(), P(!1), M(``), A(`local`), B(null), R(!1), I(!1);
            return
        }
        W()
    }, [e, W]), (0, _.useEffect)(() => {
        !Y && k === `web` && A(`local`)
    }, [Y, k]), (0, _.useEffect)(() => {
        J && N && P(!1)
    }, [J, N]);
    let fe = async () => {
            if (L) return;
            let e = null;
            if (!f) {
                if (e = window.open(``, `_blank`), !e) {
                    n(`design.open_in_claude_code`, {
                        attrs: {
                            popup_blocked: !0
                        }
                    }), O(`Your browser blocked the new tab. Allow pop-ups for this site, then try again.`, `error`);
                    return
                }
                e.opener = null
            }
            R(!0), n(`design.open_in_claude_code`);
            try {
                let t = await re().createClaudeCodeSession({
                    projectId: a,
                    instructions: de,
                    openFile: D ? ? void 0
                });
                f ? (p.openExternal(t.sessionUrl), O(t.resumed ? `Resumed your Claude Code session in your browser.` : `Opening a new Claude Code session in your browser — give it a few seconds to set up.`, `success`)) : e.closed ? O(`Your Claude Code session is ready, but the new tab was closed. Open it at ${t.sessionUrl}`, `success`) : (e.location.href = t.sessionUrl, O(t.resumed ? `Resumed your Claude Code session.` : `Opened a new Claude Code session — give it a few seconds to set up.`, `success`)), i()
            } catch (t) {
                if (e ? .close(), t instanceof ne && t.code === te.FailedPrecondition) {
                    let e = t.metadata.get(oe);
                    if (e === se) {
                        B(!0), O(`Claude Code browser sessions aren’t available for your organization — use the local coding agent option instead.`, `error`);
                        return
                    }
                    if (e === y) {
                        O(`This project is too large to seed a Claude Code session. Use the local coding agent option and download the bundle instead.`, `error`);
                        return
                    }
                }
                O(`Couldn’t open a Claude Code session — please try again.`, `error`)
            } finally {
                R(!1)
            }
        },
        pe = async () => {
            n(`design.handoff_prompt_copied`, {
                attrs: {
                    download_zip: Q,
                    has_scope: !Z,
                    via_mcp: !0
                }
            }), await U(ue) ? O(`Copied — paste into your coding agent`, `success`) : O(`Could not copy — please try again.`, `error`)
        },
        me = async () => {
            if (!F) {
                I(!0), n(`design.handoff_bundle_download`);
                try {
                    let e = t(),
                        n = {};
                    e && (n[r] = e);
                    let i = await fetch(`/design/v1/design/projects/${encodeURIComponent(a)}/handoff?${le}`, {
                        headers: n
                    });
                    if (!i.ok) throw Error(`Download failed: ${i.status}`);
                    await g(i, `handoff.zip`)
                } catch {
                    O(`Handoff bundle download failed — please try again.`, `error`)
                } finally {
                    I(!1)
                }
            }
        },
        $ = (0, v.jsx)(`span`, {
            className: o(`cursor-pointer`, Z ? `italic` : `not-italic`),
            onClick: ce,
            title: `Click to edit below`,
            children: X
        });
    return (0, v.jsx)(ee, {
        isOpen: e,
        onClose: i,
        children: (0, v.jsxs)(S, {
            children: [(0, v.jsxs)(`div`, {
                className: `pt-[18px] px-5 flex items-center justify-between gap-3`,
                children: [(0, v.jsx)(ae, {
                    segments: Y ? E : E.slice(0, 1),
                    value: k,
                    onChange: A
                }), (0, v.jsx)(l, {
                    icon: `X`,
                    size: 32,
                    iconSize: 16,
                    onClick: i
                })]
            }), (0, v.jsx)(`div`, {
                className: `pt-4 px-6`,
                children: J ? (0, v.jsxs)(`div`, {
                    className: `bg-om-bg-panel rounded-[10px] border border-om-border-default py-3.5 px-4 text-[13.5px] leading-[1.65] text-om-text-primary`,
                    children: [(0, v.jsx)(`div`, {
                        className: `text-[10.5px] font-semibold text-om-text-tertiary uppercase tracking-[0.4px] mb-[7px]`,
                        children: `Your new session will start with`
                    }), (0, v.jsxs)(`div`, {
                        children: [`Your designs and context are attached — please implement`, ` `, $, `.`]
                    })]
                }) : (0, v.jsxs)(`div`, {
                    className: `bg-[#1a1a1a] rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.04)]`,
                    children: [(0, v.jsxs)(`div`, {
                        className: `py-2.5 px-3.5 flex items-center gap-1.5 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]`,
                        children: [(0, v.jsx)(C, {
                            c: `#ff5f57`
                        }), (0, v.jsx)(C, {
                            c: `#febc2e`
                        }), (0, v.jsx)(C, {
                            c: `#28c840`
                        }), (0, v.jsx)(`span`, {
                            className: `flex-1 text-center text-[11px] font-medium text-[rgba(255,255,255,0.45)] mr-[45px]`,
                            children: `Claude Code`
                        })]
                    }), (0, v.jsxs)(`div`, {
                        className: `pt-4 px-4 pb-[18px] text-[13px] leading-[1.65] text-[rgba(255,255,255,0.92)] flex items-start`,
                        style: {
                            fontFamily: b.font
                        },
                        children: [(0, v.jsx)(`span`, {
                            className: `text-[rgba(255,255,255,0.4)] mr-2.5 select-none`,
                            children: `>`
                        }), (0, v.jsxs)(`div`, {
                            style: {
                                flex: 1,
                                minWidth: 0
                            },
                            children: [(0, v.jsx)(`div`, {
                                style: {
                                    marginBottom: 8
                                },
                                children: Q ? (0, v.jsxs)(v.Fragment, {
                                    children: [`Import the attached `, (0, v.jsxs)(w, {
                                        children: [G, `.zip`]
                                    }), ` — read the`, ` `, (0, v.jsx)(w, {
                                        children: `README`
                                    }), ` inside.`]
                                }) : (0, v.jsxs)(v.Fragment, {
                                    children: [`Use the `, (0, v.jsx)(w, {
                                        children: `claude_design`
                                    }), ` MCP (`, (0, v.jsx)(w, {
                                        children: x
                                    }), `, auth via`, ` `, (0, v.jsx)(w, {
                                        children: `/design-login`
                                    }), `) to import this project:`, (0, v.jsx)(`div`, {
                                        children: (0, v.jsx)(w, {
                                            children: q
                                        })
                                    })]
                                })
                            }), (0, v.jsxs)(`div`, {
                                children: [`Implement: `, $]
                            })]
                        })]
                    })]
                })
            }), (0, v.jsx)(`div`, {
                className: `pt-3.5 px-6 flex gap-2.5 flex-wrap`,
                children: J ? (0, v.jsx)(s, {
                    variant: `black`,
                    size: `md`,
                    icon: `ArrowUpRight`,
                    loading: L,
                    onClick: fe,
                    children: V ? `Resume in Claude Code Web` : `Open in Claude Code Web`
                }) : (0, v.jsxs)(v.Fragment, {
                    children: [(0, v.jsx)(s, {
                        variant: `black`,
                        size: `md`,
                        icon: H ? `Check` : `Clipboard`,
                        onClick: pe,
                        children: H ? `Copied` : `Copy prompt`
                    }), Q && (0, v.jsx)(s, {
                        variant: `default`,
                        size: `md`,
                        icon: `Download`,
                        loading: F,
                        onClick: me,
                        children: `Download .zip`
                    })]
                })
            }), !J && (0, v.jsxs)(`div`, {
                className: `pt-5 px-6`,
                children: [(0, v.jsx)(`div`, {
                    className: `text-[11px] font-semibold text-om-text-tertiary mb-2 tracking-[0.3px] uppercase`,
                    children: `Options`
                }), (0, v.jsx)(h, {
                    checked: Q,
                    onChange: P,
                    label: `Download zip instead`,
                    hint: `For agents without the Claude Design connector — drop the bundle into your agent’s chat manually.`
                })]
            }), (0, v.jsxs)(`div`, {
                className: `pt-[18px] px-6 pb-[22px]`,
                children: [(0, v.jsxs)(`label`, {
                    className: `block text-[12.5px] font-medium text-om-text-primary mb-1.5`,
                    children: [`Give the agent more detail on what to implement`, ` `, (0, v.jsx)(`span`, {
                        className: `text-om-text-tertiary font-normal`,
                        children: `(optional)`
                    })]
                }), (0, v.jsx)(m, {
                    ref: K,
                    value: j,
                    onChange: e => M(e.target.value),
                    placeholder: D || `the designs in this project`,
                    rows: 2,
                    style: {
                        resize: `none`
                    }
                })]
            })]
        })
    })
}
export {
    b as CC, D as HandoffModal, S as Panel
};
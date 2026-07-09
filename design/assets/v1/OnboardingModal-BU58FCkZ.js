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
    t as r
} from "./cn-qYiRd2Uw.js";
import "./cn-BvRk9kiK.js";
import {
    Ft as i,
    Ht as a,
    Jt as o,
    Ut as s
} from "./index-DxZs6uan.js";
import {
    t as c
} from "./platform-BciTLfG8.js";
import {
    a as l,
    i as u,
    n as d,
    o as f,
    r as p,
    s as m,
    t as h
} from "./data-CPw4QE_v.js";
var g = e(t(), 1),
    _ = n();

function v({
    selected: e,
    onToggle: t
}) {
    return (0, _.jsxs)(_.Fragment, {
        children: [(0, _.jsx)(`h2`, {
            style: {
                margin: 0,
                fontSize: 22,
                fontWeight: 600
            },
            children: `What do you do?`
        }), (0, _.jsx)(`p`, {
            style: {
                margin: `6px 0 0`,
                fontSize: 13,
                color: i.text.secondary
            },
            children: `Pick all that apply — we'll tailor tips to your workflow.`
        }), (0, _.jsx)(`div`, {
            className: `mb-7 mt-5 grid grid-cols-2 gap-2.5`,
            children: d.map(n => {
                let a = e.includes(n.id);
                return (0, _.jsxs)(`button`, {
                    type: `button`,
                    onClick: () => t(n.id),
                    className: r(`flex cursor-pointer appearance-none items-center gap-2.5 rounded-[10px] bg-clip-padding`, `border-[1.5px] px-4 py-3.5 text-left outline-none transition-all duration-[120ms]`, `text-sm font-medium text-om-text-primary`, a ? `border-om-accent-blue bg-om-accent-blue-bg hover:border-om-accent-blue` : `border-om-border-default bg-om-bg-surface hover:border-om-border-strong`),
                    children: [(0, _.jsx)(o, {
                        name: n.icon,
                        size: 16,
                        style: {
                            color: a ? i.accent.blue : i.text.tertiary
                        }
                    }), n.label]
                }, n.id)
            })
        })]
    })
}

function y({
    roles: e,
    selected: t,
    onToggle: n
}) {
    let a = l(e);
    return (0, _.jsxs)(_.Fragment, {
        children: [(0, _.jsx)(`h2`, {
            style: {
                margin: 0,
                fontSize: 22,
                fontWeight: 600
            },
            children: `What will you make?`
        }), (0, _.jsx)(`p`, {
            style: {
                margin: `6px 0 0`,
                fontSize: 13,
                color: i.text.secondary
            },
            children: `Choose a few — or skip to see everything.`
        }), (0, _.jsx)(`div`, {
            className: `flex flex-wrap gap-2 mt-5 mb-7`,
            children: a.map(e => (0, _.jsx)(`button`, {
                onClick: () => n(e.id),
                className: r(`appearance-none outline-none py-[9px] px-[14px] rounded-[100px] cursor-pointer border-[1.5px] text-[13px] font-medium transition-all duration-[120ms]`, t.includes(e.id) ? `border-om-accent-blue bg-om-accent-blue text-om-text-inverse hover:border-om-accent-blue-hover hover:bg-om-accent-blue-hover` : `border-om-border-default bg-om-bg-surface text-om-text-primary hover:border-om-border-strong`),
                children: e.label
            }, e.id))
        })]
    })
}
var b = e => `/design/chrome/backgrounds/${e}`,
    x = e => `/design/chrome/pictograms/${e}`,
    S = `appearance-none outline-none bg-transparent p-0 m-0 absolute top-[30px] bottom-0 w-[40%] cursor-pointer z-[2]`;

function C({
    tips: e,
    index: t,
    onNav: n
}) {
    let r = e[t],
        i = h[t % h.length],
        a = (0, g.useCallback)(e => {
            e.key === `ArrowRight` || e.key === ` ` ? (e.preventDefault(), n(1)) : e.key === `ArrowLeft` && (e.preventDefault(), n(-1))
        }, [n]);
    return (0, g.useEffect)(() => (document.addEventListener(`keydown`, a), () => document.removeEventListener(`keydown`, a)), [a]), r ? (0, _.jsxs)(`div`, {
        className: `relative w-full h-full flex flex-col`,
        children: [(0, _.jsxs)(`div`, {
            className: `absolute inset-0 text-white flex flex-col bg-blend-soft-light`,
            style: {
                background: `url('${b(i.texture)}') center/cover no-repeat, ${i.bg}`
            },
            children: [(0, _.jsx)(`div`, {
                className: `flex gap-1 pt-[14px] px-4`,
                children: e.map((e, n) => (0, _.jsx)(`div`, {
                    className: n <= t ? `flex-1 h-[3px] rounded-[2px] transition-colors duration-200 bg-[rgba(255,255,255,0.95)]` : `flex-1 h-[3px] rounded-[2px] transition-colors duration-200 bg-[rgba(255,255,255,0.3)]`
                }, n))
            }), (0, _.jsxs)(`div`, {
                className: `flex-1 flex flex-col justify-end pt-6 px-7 pb-8 gap-2.5`,
                children: [(0, _.jsx)(`img`, {
                    src: x(r.pictogram),
                    alt: ``,
                    className: `w-[88px] h-[88px] mb-3 brightness-0 invert opacity-90`
                }), (0, _.jsx)(`h3`, {
                    className: `m-0 text-[24px] font-semibold leading-[1.2]`,
                    children: r.title
                }), (0, _.jsx)(`p`, {
                    className: `m-0 text-sm leading-normal opacity-[0.92]`,
                    children: r.description
                })]
            }), (0, _.jsx)(`div`, {
                className: `absolute bottom-[14px] right-[18px] flex gap-1.5 opacity-70 pointer-events-none`,
                children: (0, _.jsx)(o, {
                    name: `CaretRight`,
                    size: 14
                })
            })]
        }), (0, _.jsx)(`button`, {
            className: `${S} left-0`,
            onClick: () => n(-1),
            "aria-label": `Previous`
        }), (0, _.jsx)(`button`, {
            className: `${S} right-0`,
            onClick: () => n(1),
            "aria-label": `Next`
        })]
    }) : null
}

function w({
    primary: e,
    className: t,
    ...n
}) {
    return (0, _.jsx)(`button`, {
        type: `button`,
        className: r(`cursor-pointer appearance-none rounded-lg px-[18px] py-2.5 outline-none`, `text-[13px] font-medium transition-all duration-[120ms]`, `disabled:cursor-default disabled:opacity-40`, e ? `bg-om-accent-black text-om-text-inverse hover:bg-om-accent-black-hover` : `bg-transparent text-om-text-secondary hover:bg-om-bg-hover`, t),
        ...n
    })
}

function T({
    onClose: e
}) {
    let t = (0, g.useMemo)(() => f(), []),
        [n, d] = (0, g.useState)(t ? .screen ? ? `roles`),
        [h, b] = (0, g.useState)(t ? .roles ? ? []),
        [x, S] = (0, g.useState)(t ? .useCases ? ? []),
        [T, E] = (0, g.useState)(0),
        D = (0, g.useMemo)(() => u(x), [x]);
    (0, g.useEffect)(() => {
        let e = new Set(l(h).map(e => e.id));
        S(t => {
            let n = t.filter(t => e.has(t));
            return n.length === t.length ? t : n
        })
    }, [h]), (0, g.useEffect)(() => {
        m({
            roles: h,
            useCases: x,
            screen: n
        })
    }, [h, x, n]);
    let O = (e, t) => e.includes(t) ? e.filter(e => e !== t) : [...e, t],
        k = () => {
            p(), e()
        },
        A = e => {
            let t = T + e;
            t < 0 ? d(`ready`) : t >= D.length ? (c.trackEvent(`onboarding_complete`, {
                roles: h.length,
                useCases: x.length
            }), k()) : E(t)
        },
        j = n === `story`;
    return (0, _.jsx)(a, {
        isOpen: !0,
        onClose: e,
        children: (0, _.jsxs)(`div`, {
            className: r(`relative flex w-[460px] max-w-[calc(100vw-32px)] flex-col overflow-hidden`, `rounded-2xl bg-om-bg-app shadow-om-lg`, `max-h-[calc(100vh-32px)]`, j ? `h-[580px]` : `h-auto`, s, `[animation-duration:0.18s] [animation-timing-function:ease]`),
            children: [(0, _.jsx)(`button`, {
                type: `button`,
                onClick: e,
                "aria-label": `Close`,
                className: r(`absolute right-3 top-3 z-10 grid h-7 w-7 cursor-pointer appearance-none`, `place-items-center rounded-full outline-none transition-colors duration-[120ms]`, j ? `bg-black/20 text-white hover:bg-[rgba(0,0,0,0.35)]` : `bg-om-bg-hover text-om-text-secondary hover:bg-om-bg-active`),
                children: (0, _.jsx)(o, {
                    name: `X`,
                    size: 13
                })
            }), j ? (0, _.jsx)(C, {
                tips: D,
                index: T,
                onNav: A
            }) : (0, _.jsxs)(_.Fragment, {
                children: [(0, _.jsxs)(`div`, {
                    className: `flex-1 px-7 pb-5 pt-8`,
                    children: [n === `roles` && (0, _.jsx)(v, {
                        selected: h,
                        onToggle: e => b(O(h, e))
                    }), n === `usecases` && (0, _.jsx)(y, {
                        roles: h,
                        selected: x,
                        onToggle: e => S(O(x, e))
                    }), n === `ready` && (0, _.jsxs)(`div`, {
                        className: `px-3 py-10 text-center`,
                        children: [(0, _.jsx)(`h2`, {
                            style: {
                                margin: 0,
                                fontSize: 24,
                                fontWeight: 600
                            },
                            children: `You're all set`
                        }), (0, _.jsxs)(`p`, {
                            style: {
                                margin: `10px 0 0`,
                                fontSize: 14,
                                color: i.text.secondary
                            },
                            children: [`Here are `, D.length, ` quick tips picked for you.`, (0, _.jsx)(`br`, {}), `Tap or arrow through.`]
                        })]
                    })]
                }), (0, _.jsxs)(`div`, {
                    className: `flex items-center justify-between gap-3 px-7 pb-6`,
                    children: [n === `roles` ? (0, _.jsx)(w, {
                        onClick: () => {
                            c.trackEvent(`onboarding_skip`, {
                                from: n
                            }), k()
                        },
                        children: `Skip`
                    }) : (0, _.jsx)(w, {
                        onClick: () => d(n === `ready` ? `usecases` : `roles`),
                        children: `Back`
                    }), (0, _.jsx)(w, {
                        primary: !0,
                        "data-autofocus": !0,
                        onClick: () => {
                            let e = n === `roles` ? `usecases` : n === `usecases` ? `ready` : `story`;
                            c.trackEvent(`onboarding_step`, {
                                from: n,
                                to: e
                            }), e === `story` && E(0), d(e)
                        },
                        children: n === `ready` ? `Start` : `Continue`
                    })]
                })]
            })]
        })
    })
}
export {
    T as OnboardingModal
};
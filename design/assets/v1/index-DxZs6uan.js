const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/v1/client-BkAIwXnN.js", "assets/v1/rolldown-runtime-CMxvf4Kt.js", "assets/v1/client-lite-BraEm36W.js", "assets/v1/preload-helper-7XptfjGJ.js", "assets/v1/react-BthIFXYf.js", "assets/v1/host-BwlQdwMG.js", "assets/v1/DesignSpotlight-DgbyBcYz.js", "assets/v1/useModelSelection-Gs9zlsOR.js", "assets/v1/connectrpc-BRKh2K0Y.js", "assets/v1/useOrg-DgFJtzUv.js", "assets/v1/connect-lite-vzd2EiZc.js", "assets/v1/client-event-bus-CUOhmLFi.js", "assets/v1/fig-kit-coverage-DSUEqVg0.js", "assets/v1/timestamp-BohYTGqR.js", "assets/v1/platform-BciTLfG8.js", "assets/v1/Button-JbIB5F4R.js", "assets/v1/cn-qYiRd2Uw.js", "assets/v1/jsx-runtime-DDrWIXeu.js", "assets/v1/Button-C3hHoRdu.css", "assets/v1/useUserSettings-DXDUhhmv.js", "assets/v1/Dialog-C1x8a90K.js", "assets/v1/Switch-BW47dRdR.js", "assets/v1/useLabelableId-qsMIxjgj.js", "assets/v1/hooks-dYpRZMxP.js", "assets/v1/useQuery-H1uIcgPW.js", "assets/v1/AnimatePresence-CdFTYeUp.js", "assets/v1/schemas-DgQq6Z5S.js", "assets/v1/GuestPassChin-bkx5OMvw.js", "assets/v1/useReferral-Cg9xOWlq.js", "assets/v1/DesignChatTooltip-BBKw8FP0.js", "assets/v1/IntroVideo-DVMP6uWs.js", "assets/v1/home-analytics-CvEfi_eq.js", "assets/v1/cn-BvRk9kiK.js", "assets/v1/home-analytics-Jip0Shg4.css", "assets/v1/useIntroOnboardingVariant-CAG4gcol.js", "assets/v1/IntroVideo-CxrzDPcC.css", "assets/v1/completion-CK5lepEv.js", "assets/v1/data-CPw4QE_v.js", "assets/v1/registry-DDfaFazS.js", "assets/v1/gb-setters-RWtEzghG.js", "assets/v1/ProjectsPage-DyYkbxtU.js", "assets/v1/format-ZLL9BhVd.js", "assets/v1/SpinnerCursorContext-FnwGR7gg.js", "assets/v1/viewer-handle-Dsr1w91D.js", "assets/v1/shared-BtICgni1.js", "assets/v1/browser-BV-Pd9QF.js", "assets/v1/format-DCxtFyAS.css", "assets/v1/use-starter-picks-bodnsNGw.js", "assets/v1/DsBrowseModal-BkxM-KID.js", "assets/v1/TextInput-DxNI7vVC.js", "assets/v1/TextLink-CipyhACt.js", "assets/v1/ProjectsPage-RlG8t8BF.css", "assets/v1/ProjectPage-Hre4_7pa.js", "assets/v1/spark-CWRdL_eg.js", "assets/v1/AttachmentChips-VCc8GHb2.js", "assets/v1/path-B8831-h-.js", "assets/v1/sourcePersistence-BAW7tRE6.js", "assets/v1/capture-mutex-C_-Q9CPb.js", "assets/v1/presenterChannel-CJwPOshM.js", "assets/v1/LimitUpsellOptionCard--KpBn-HH.js", "assets/v1/glyph-BHo4ckbs.js", "assets/v1/esm-DmY0fRjs.js", "assets/v1/ProjectPage-CSDuc-ds.css", "assets/v1/FromCcPage-BTycE_ui.js", "assets/v1/PresenterNotesPage-DXCJ_mWE.js", "assets/v1/PresenterNotesPage-Deh9-zd9.css"]))) => i.map(i => d[i]);
import {
    o as e,
    t
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    t as n
} from "./preload-helper-7XptfjGJ.js";
import {
    E as r,
    T as i,
    _ as a,
    a as o,
    d as s,
    f as c,
    g as l,
    h as u,
    r as d,
    u as f,
    v as p,
    w as m,
    x as h
} from "./client-lite-BraEm36W.js";
import {
    t as g
} from "./react-BthIFXYf.js";
import {
    C as _,
    D as v,
    M as y,
    N as b,
    O as x,
    P as ee,
    b as te,
    d as ne,
    i as re,
    j as ie,
    p as ae,
    v as oe,
    w as se,
    y as ce
} from "./useOrg-DgFJtzUv.js";
import {
    t as le
} from "./jsx-runtime-DDrWIXeu.js";
import {
    t as ue
} from "./cn-qYiRd2Uw.js";
import "./cn-BvRk9kiK.js";
(function() {
    let e = document.createElement(`link`).relList;
    if (e && e.supports && e.supports(`modulepreload`)) return;
    for (let e of document.querySelectorAll(`link[rel="modulepreload"]`)) n(e);
    new MutationObserver(e => {
        for (let t of e)
            if (t.type === `childList`)
                for (let e of t.addedNodes) e.tagName === `LINK` && e.rel === `modulepreload` && n(e)
    }).observe(document, {
        childList: !0,
        subtree: !0
    });

    function t(e) {
        let t = {};
        return e.integrity && (t.integrity = e.integrity), e.referrerPolicy && (t.referrerPolicy = e.referrerPolicy), e.crossOrigin === `use-credentials` ? t.credentials = `include` : e.crossOrigin === `anonymous` ? t.credentials = `omit` : t.credentials = `same-origin`, t
    }

    function n(e) {
        if (e.ep) return;
        e.ep = !0;
        let n = t(e);
        fetch(e.href, n)
    }
})();
var de = new Set([`limit`, `offset`, `page`, `sort`, `tab`, `mode`, `step`]),
    fe = /(^|\/)_t\/[^/]+\//,
    S = /(\/v1\/design\/projects\/[^/]+\/serve\/).+/;

function C(e) {
    return e.replace(fe, `$1_t/REDACTED/`).replace(S, `$1REDACTED`)
}

function pe(e) {
    try {
        let t = new URL(e),
            n = new URLSearchParams;
        for (let [e, r] of t.searchParams) de.has(e) && n.append(e, r);
        return t.search = n.toString(), t.hash = ``, t.pathname = C(t.pathname), t.toString()
    } catch {
        let t = e.search(/[?#]/);
        return C(t === -1 ? e : e.slice(0, t))
    }
}
var me = [`ResizeObserver loop completed with undelivered notifications.`, `ResizeObserver loop limit exceeded`, `Invalid call to runtime.sendMessage(). Tab not found.`, `lastActiveOrg changed mid-session; reloading`, `auth proxy redirected; reloading`],
    he = /(?:chrome|moz|safari-web|ms-browser)-extension:/,
    ge = /(^|[^A-Za-z])Script error\b/,
    _e = /The user aborted a request|signal is aborted without reason/;

function w(e) {
    return e ? e.message && me.some(t => e.message.includes(t)) ? `expected` : e.message && ge.test(e.message) ? `cross_origin_masked` : e.message && _e.test(e.message) ? `abort` : e.stack && he.test(e.stack) ? `extension_stack` : e.source === `report` ? `csp_report` : null : null
}

function ve(e) {
    return e ? e.includes(`__`) ? e.startsWith(`figma__`) ? `figma_mcp` : `toolbox_mcp` : e.slice(0, 64) : `unknown`
}

function ye(e) {
    if (!e) return ``;
    let t = e.slice(e.lastIndexOf(`/`) + 1),
        n = t.lastIndexOf(`.`);
    if (n <= 0) return ``;
    let r = t.slice(n + 1, n + 11).toLowerCase();
    return /^[a-z0-9]+$/.test(r) ? r : ``
}

function be(e) {
    return e && e.length > 200 ? e.slice(0, 200) + `…[truncated]` : e
}
var xe = 20,
    Se = 2e3,
    Ce = /^\s*at\s.*(?::\d+:\d+\)?|\(<anonymous>\))$|^\S*@\S+:\d+:\d+$/,
    we = /^[A-Za-z][\w$.]*$/;

function Te(e) {
    if (!e) return e;
    let t = e.split(`
`);
    if (!Ce.test(t[0] ? ? ``)) {
        let e = t[0] ? ? ``,
            n = e.indexOf(`: `),
            r = n > 0 ? e.slice(0, n) : e,
            i = we.test(r) ? r : ``,
            a = 1;
        for (; a < t.length && !Ce.test(t[a]);) a++;
        t.splice(0, a, i === e ? e : i ? `${i}: …` : `…`)
    }
    let n = t.length > xe ? t.slice(0, xe).join(`
`) + `
…[truncated]` : t.join(`
`);
    return n.length > Se && (n = n.slice(0, Se) + `…[truncated]`), n
}

function Ee(e) {
    if (e.message = be(e.message), e.stack = Te(e.stack), e.causes)
        for (let t of e.causes) Ee(t)
}
var De = `anthropic-consent-preferences`;

function Oe() {
    if (typeof document > `u`) return !1;
    for (let e of document.cookie.split(`;`)) {
        let [t, n] = e.split(`=`);
        if (t.trim() === De) try {
            return JSON.parse(decodeURIComponent(n ? ? ``)).analytics === !0
        } catch {
            return !1
        }
    }
    return !1
}
var ke = 100;

function Ae(e) {
    if (e.type === `error` && e.error) {
        let t = w(e.error);
        if (t !== null) return (t === `cross_origin_masked` || t === `abort`) && Math.random() * ke < 1 && r.addAction(`design.rum.dropped_error`, {
            family: t,
            sampled_one_in: ke
        }), !1;
        Ee(e.error)
    }
    return e.view && (e.view.url = pe(e.view.url), e.view.referrer && (e.view.referrer = pe(e.view.referrer))), e.resource && (e.resource.url = pe(e.resource.url)), e.error ? .resource && (e.error.resource.url = pe(e.error.resource.url)), !0
} {
    let e = {
            applicationId: `0bd60fc3-f3d9-4cba-a7aa-ffa882939bc7`,
            clientToken: `pub2a0ae4ec45498df9b080f0680384403f`,
            site: `us5.datadoghq.com`,
            service: `omelette-spa`,
            env: `production`,
            version: `aa93b5ed4aefa2e80e4c4e122a3ffe4818a9769a`,
            sessionSampleRate: 100,
            defaultPrivacyLevel: `mask`,
            trackUserInteractions: !1,
            enablePrivacyForActionName: !0,
            trackResources: !0,
            trackLongTasks: !0,
            trackingConsent: Oe() ? `granted` : `not-granted`,
            allowedTracingUrls: [e => e.startsWith(window.location.origin + `/design/`)],
            beforeSend: Ae
        },
        t = () => void i(e);
    typeof requestIdleCallback == `function` ? requestIdleCallback(t, {
        timeout: 2e3
    }) : setTimeout(t, 0);
    let n = window.__OMELETTE_DESKTOP__,
        a = new URLSearchParams(window.location.search).get(`embed`),
        o = window.location.ancestorOrigins ? .length ? ? (window.self === window.top ? 0 : 1),
        s = a === `desktop` ? `param` : o > 0 ? `ancestry` : `none`;
    r.setGlobalContextProperty(`host`, n ? `desktop_app` : `web`), r.setGlobalContextProperty(`host_version`, n ? .version), r.setGlobalContextProperty(`embed_source`, s), r.setGlobalContextProperty(`frame_depth`, o);
    let c = Oe();
    document.addEventListener(`visibilitychange`, () => {
        if (document.visibilityState !== `visible`) return;
        let e = Oe();
        e !== c && (c = e, e ? je() : Me())
    })
}

function je() {
    r.setTrackingConsent(`granted`)
}

function Me() {
    r.setTrackingConsent(`not-granted`)
}

function Ne() {
    let e = new URLSearchParams(window.location.search);
    if (window.location.hash === `#present` && e.get(`present`) !== `1` && (e.set(`present`, `1`), window.history.replaceState(window.history.state, ``, window.location.pathname + `?` + e.toString())), e.get(`present`) !== `1`) return null;
    let t = window.location.pathname;
    try {
        t = decodeURIComponent(t)
    } catch {}
    return /\/p\/([0-9a-f-]{36})\b/i.exec(t) ? .[1] ? .toLowerCase() ? ? null
}
var Pe = Ne(),
    Fe = t((e => {
        function t(e, t) {
            var n = e.length;
            e.push(t);
            a: for (; 0 < n;) {
                var r = n - 1 >>> 1,
                    a = e[r];
                if (0 < i(a, t)) e[r] = t, e[n] = a, n = r;
                else break a
            }
        }

        function n(e) {
            return e.length === 0 ? null : e[0]
        }

        function r(e) {
            if (e.length === 0) return null;
            var t = e[0],
                n = e.pop();
            if (n !== t) {
                e[0] = n;
                a: for (var r = 0, a = e.length, o = a >>> 1; r < o;) {
                    var s = 2 * (r + 1) - 1,
                        c = e[s],
                        l = s + 1,
                        u = e[l];
                    if (0 > i(c, n)) l < a && 0 > i(u, c) ? (e[r] = u, e[l] = n, r = l) : (e[r] = c, e[s] = n, r = s);
                    else if (l < a && 0 > i(u, n)) e[r] = u, e[l] = n, r = l;
                    else break a
                }
            }
            return t
        }

        function i(e, t) {
            var n = e.sortIndex - t.sortIndex;
            return n === 0 ? e.id - t.id : n
        }
        if (e.unstable_now = void 0, typeof performance == `object` && typeof performance.now == `function`) {
            var a = performance;
            e.unstable_now = function() {
                return a.now()
            }
        } else {
            var o = Date,
                s = o.now();
            e.unstable_now = function() {
                return o.now() - s
            }
        }
        var c = [],
            l = [],
            u = 1,
            d = null,
            f = 3,
            p = !1,
            m = !1,
            h = !1,
            g = !1,
            _ = typeof setTimeout == `function` ? setTimeout : null,
            v = typeof clearTimeout == `function` ? clearTimeout : null,
            y = typeof setImmediate < `u` ? setImmediate : null;

        function b(e) {
            for (var i = n(l); i !== null;) {
                if (i.callback === null) r(l);
                else if (i.startTime <= e) r(l), i.sortIndex = i.expirationTime, t(c, i);
                else break;
                i = n(l)
            }
        }

        function x(e) {
            if (h = !1, b(e), !m)
                if (n(c) !== null) m = !0, ee || (ee = !0, oe());
                else {
                    var t = n(l);
                    t !== null && le(x, t.startTime - e)
                }
        }
        var ee = !1,
            te = -1,
            ne = 5,
            re = -1;

        function ie() {
            return g ? !0 : !(e.unstable_now() - re < ne)
        }

        function ae() {
            if (g = !1, ee) {
                var t = e.unstable_now();
                re = t;
                var i = !0;
                try {
                    a: {
                        m = !1,
                        h && (h = !1, v(te), te = -1),
                        p = !0;
                        var a = f;
                        try {
                            b: {
                                for (b(t), d = n(c); d !== null && !(d.expirationTime > t && ie());) {
                                    var o = d.callback;
                                    if (typeof o == `function`) {
                                        d.callback = null, f = d.priorityLevel;
                                        var s = o(d.expirationTime <= t);
                                        if (t = e.unstable_now(), typeof s == `function`) {
                                            d.callback = s, b(t), i = !0;
                                            break b
                                        }
                                        d === n(c) && r(c), b(t)
                                    } else r(c);
                                    d = n(c)
                                }
                                if (d !== null) i = !0;
                                else {
                                    var u = n(l);
                                    u !== null && le(x, u.startTime - t), i = !1
                                }
                            }
                            break a
                        }
                        finally {
                            d = null, f = a, p = !1
                        }
                        i = void 0
                    }
                }
                finally {
                    i ? oe() : ee = !1
                }
            }
        }
        var oe;
        if (typeof y == `function`) oe = function() {
            y(ae)
        };
        else if (typeof MessageChannel < `u`) {
            var se = new MessageChannel,
                ce = se.port2;
            se.port1.onmessage = ae, oe = function() {
                ce.postMessage(null)
            }
        } else oe = function() {
            _(ae, 0)
        };

        function le(t, n) {
            te = _(function() {
                t(e.unstable_now())
            }, n)
        }
        e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
            e.callback = null
        }, e.unstable_forceFrameRate = function(e) {
            0 > e || 125 < e || (ne = 0 < e ? Math.floor(1e3 / e) : 5)
        }, e.unstable_getCurrentPriorityLevel = function() {
            return f
        }, e.unstable_next = function(e) {
            switch (f) {
                case 1:
                case 2:
                case 3:
                    var t = 3;
                    break;
                default:
                    t = f
            }
            var n = f;
            f = t;
            try {
                return e()
            } finally {
                f = n
            }
        }, e.unstable_requestPaint = function() {
            g = !0
        }, e.unstable_runWithPriority = function(e, t) {
            switch (e) {
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                    break;
                default:
                    e = 3
            }
            var n = f;
            f = e;
            try {
                return t()
            } finally {
                f = n
            }
        }, e.unstable_scheduleCallback = function(r, i, a) {
            var o = e.unstable_now();
            switch (typeof a == `object` && a ? (a = a.delay, a = typeof a == `number` && 0 < a ? o + a : o) : a = o, r) {
                case 1:
                    var s = -1;
                    break;
                case 2:
                    s = 250;
                    break;
                case 5:
                    s = 1073741823;
                    break;
                case 4:
                    s = 1e4;
                    break;
                default:
                    s = 5e3
            }
            return s = a + s, r = {
                id: u++,
                callback: i,
                priorityLevel: r,
                startTime: a,
                expirationTime: s,
                sortIndex: -1
            }, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (v(te), te = -1) : h = !0, le(x, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, ee || (ee = !0, oe()))), r
        }, e.unstable_shouldYield = ie, e.unstable_wrapCallback = function(e) {
            var t = f;
            return function() {
                var n = f;
                f = t;
                try {
                    return e.apply(this, arguments)
                } finally {
                    f = n
                }
            }
        }
    })),
    Ie = t(((e, t) => {
        t.exports = Fe()
    })),
    Le = t((e => {
        var t = Ie(),
            n = g(),
            r = ee();

        function i(e) {
            var t = `https://react.dev/errors/` + e;
            if (1 < arguments.length) {
                t += `?args[]=` + encodeURIComponent(arguments[1]);
                for (var n = 2; n < arguments.length; n++) t += `&args[]=` + encodeURIComponent(arguments[n])
            }
            return `Minified React error #` + e + `; visit ` + t + ` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`
        }

        function a(e) {
            return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11)
        }

        function o(e) {
            var t = e,
                n = e;
            if (e.alternate)
                for (; t.return;) t = t.return;
            else {
                e = t;
                do t = e, t.flags & 4098 && (n = t.return), e = t.return; while (e)
            }
            return t.tag === 3 ? n : null
        }

        function s(e) {
            if (e.tag === 13) {
                var t = e.memoizedState;
                if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated
            }
            return null
        }

        function c(e) {
            if (e.tag === 31) {
                var t = e.memoizedState;
                if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated
            }
            return null
        }

        function l(e) {
            if (o(e) !== e) throw Error(i(188))
        }

        function u(e) {
            var t = e.alternate;
            if (!t) {
                if (t = o(e), t === null) throw Error(i(188));
                return t === e ? e : null
            }
            for (var n = e, r = t;;) {
                var a = n.return;
                if (a === null) break;
                var s = a.alternate;
                if (s === null) {
                    if (r = a.return, r !== null) {
                        n = r;
                        continue
                    }
                    break
                }
                if (a.child === s.child) {
                    for (s = a.child; s;) {
                        if (s === n) return l(a), e;
                        if (s === r) return l(a), t;
                        s = s.sibling
                    }
                    throw Error(i(188))
                }
                if (n.return !== r.return) n = a, r = s;
                else {
                    for (var c = !1, u = a.child; u;) {
                        if (u === n) {
                            c = !0, n = a, r = s;
                            break
                        }
                        if (u === r) {
                            c = !0, r = a, n = s;
                            break
                        }
                        u = u.sibling
                    }
                    if (!c) {
                        for (u = s.child; u;) {
                            if (u === n) {
                                c = !0, n = s, r = a;
                                break
                            }
                            if (u === r) {
                                c = !0, r = s, n = a;
                                break
                            }
                            u = u.sibling
                        }
                        if (!c) throw Error(i(189))
                    }
                }
                if (n.alternate !== r) throw Error(i(190))
            }
            if (n.tag !== 3) throw Error(i(188));
            return n.stateNode.current === n ? e : t
        }

        function d(e) {
            var t = e.tag;
            if (t === 5 || t === 26 || t === 27 || t === 6) return e;
            for (e = e.child; e !== null;) {
                if (t = d(e), t !== null) return t;
                e = e.sibling
            }
            return null
        }
        var f = Object.assign,
            p = Symbol.for(`react.element`),
            m = Symbol.for(`react.transitional.element`),
            h = Symbol.for(`react.portal`),
            _ = Symbol.for(`react.fragment`),
            v = Symbol.for(`react.strict_mode`),
            y = Symbol.for(`react.profiler`),
            b = Symbol.for(`react.consumer`),
            x = Symbol.for(`react.context`),
            te = Symbol.for(`react.forward_ref`),
            ne = Symbol.for(`react.suspense`),
            re = Symbol.for(`react.suspense_list`),
            ie = Symbol.for(`react.memo`),
            ae = Symbol.for(`react.lazy`),
            oe = Symbol.for(`react.activity`),
            se = Symbol.for(`react.memo_cache_sentinel`),
            ce = Symbol.iterator;

        function le(e) {
            return typeof e != `object` || !e ? null : (e = ce && e[ce] || e[`@@iterator`], typeof e == `function` ? e : null)
        }
        var ue = Symbol.for(`react.client.reference`);

        function de(e) {
            if (e == null) return null;
            if (typeof e == `function`) return e.$$typeof === ue ? null : e.displayName || e.name || null;
            if (typeof e == `string`) return e;
            switch (e) {
                case _:
                    return `Fragment`;
                case y:
                    return `Profiler`;
                case v:
                    return `StrictMode`;
                case ne:
                    return `Suspense`;
                case re:
                    return `SuspenseList`;
                case oe:
                    return `Activity`
            }
            if (typeof e == `object`) switch (e.$$typeof) {
                case h:
                    return `Portal`;
                case x:
                    return e.displayName || `Context`;
                case b:
                    return (e._context.displayName || `Context`) + `.Consumer`;
                case te:
                    var t = e.render;
                    return e = e.displayName, e || = (e = t.displayName || t.name || ``, e === `` ? `ForwardRef` : `ForwardRef(` + e + `)`), e;
                case ie:
                    return t = e.displayName || null, t === null ? de(e.type) || `Memo` : t;
                case ae:
                    t = e._payload, e = e._init;
                    try {
                        return de(e(t))
                    } catch {}
            }
            return null
        }
        var fe = Array.isArray,
            S = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
            C = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
            pe = {
                pending: !1,
                data: null,
                method: null,
                action: null
            },
            me = [],
            he = -1;

        function ge(e) {
            return {
                current: e
            }
        }

        function _e(e) {
            0 > he || (e.current = me[he], me[he] = null, he--)
        }

        function w(e, t) {
            he++, me[he] = e.current, e.current = t
        }
        var ve = ge(null),
            ye = ge(null),
            be = ge(null),
            xe = ge(null);

        function Se(e, t) {
            switch (w(be, t), w(ye, e), w(ve, null), t.nodeType) {
                case 9:
                case 11:
                    e = (e = t.documentElement) && (e = e.namespaceURI) ? Vd(e) : 0;
                    break;
                default:
                    if (e = t.tagName, t = t.namespaceURI) t = Vd(t), e = Hd(t, e);
                    else switch (e) {
                        case `svg`:
                            e = 1;
                            break;
                        case `math`:
                            e = 2;
                            break;
                        default:
                            e = 0
                    }
            }
            _e(ve), w(ve, e)
        }

        function Ce() {
            _e(ve), _e(ye), _e(be)
        }

        function we(e) {
            e.memoizedState !== null && w(xe, e);
            var t = ve.current,
                n = Hd(t, e.type);
            t !== n && (w(ye, e), w(ve, n))
        }

        function Te(e) {
            ye.current === e && (_e(ve), _e(ye)), xe.current === e && (_e(xe), Qf._currentValue = pe)
        }
        var Ee, De;

        function Oe(e) {
            if (Ee === void 0) try {
                throw Error()
            } catch (e) {
                var t = e.stack.trim().match(/\n( *(at )?)/);
                Ee = t && t[1] || ``, De = -1 < e.stack.indexOf(`
    at`) ? ` (<anonymous>)` : -1 < e.stack.indexOf(`@`) ? `@unknown:0:0` : ``
            }
            return `
` + Ee + e + De
        }
        var ke = !1;

        function Ae(e, t) {
            if (!e || ke) return ``;
            ke = !0;
            var n = Error.prepareStackTrace;
            Error.prepareStackTrace = void 0;
            try {
                var r = {
                    DetermineComponentFrameRoot: function() {
                        try {
                            if (t) {
                                var n = function() {
                                    throw Error()
                                };
                                if (Object.defineProperty(n.prototype, "props", {
                                        set: function() {
                                            throw Error()
                                        }
                                    }), typeof Reflect == `object` && Reflect.construct) {
                                    try {
                                        Reflect.construct(n, [])
                                    } catch (e) {
                                        var r = e
                                    }
                                    Reflect.construct(e, [], n)
                                } else {
                                    try {
                                        n.call()
                                    } catch (e) {
                                        r = e
                                    }
                                    e.call(n.prototype)
                                }
                            } else {
                                try {
                                    throw Error()
                                } catch (e) {
                                    r = e
                                }(n = e()) && typeof n.catch == `function` && n.catch(function() {})
                            }
                        } catch (e) {
                            if (e && r && typeof e.stack == `string`) return [e.stack, r.stack]
                        }
                        return [null, null]
                    }
                };
                r.DetermineComponentFrameRoot.displayName = `DetermineComponentFrameRoot`;
                var i = Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot, `name`);
                i && i.configurable && Object.defineProperty(r.DetermineComponentFrameRoot, "name", {
                    value: `DetermineComponentFrameRoot`
                });
                var a = r.DetermineComponentFrameRoot(),
                    o = a[0],
                    s = a[1];
                if (o && s) {
                    var c = o.split(`
`),
                        l = s.split(`
`);
                    for (i = r = 0; r < c.length && !c[r].includes(`DetermineComponentFrameRoot`);) r++;
                    for (; i < l.length && !l[i].includes(`DetermineComponentFrameRoot`);) i++;
                    if (r === c.length || i === l.length)
                        for (r = c.length - 1, i = l.length - 1; 1 <= r && 0 <= i && c[r] !== l[i];) i--;
                    for (; 1 <= r && 0 <= i; r--, i--)
                        if (c[r] !== l[i]) {
                            if (r !== 1 || i !== 1)
                                do
                                    if (r--, i--, 0 > i || c[r] !== l[i]) {
                                        var u = `
` + c[r].replace(` at new `, ` at `);
                                        return e.displayName && u.includes(`<anonymous>`) && (u = u.replace(`<anonymous>`, e.displayName)), u
                                    }
                            while (1 <= r && 0 <= i);
                            break
                        }
                }
            } finally {
                ke = !1, Error.prepareStackTrace = n
            }
            return (n = e ? e.displayName || e.name : ``) ? Oe(n) : ``
        }

        function je(e, t) {
            switch (e.tag) {
                case 26:
                case 27:
                case 5:
                    return Oe(e.type);
                case 16:
                    return Oe(`Lazy`);
                case 13:
                    return e.child !== t && t !== null ? Oe(`Suspense Fallback`) : Oe(`Suspense`);
                case 19:
                    return Oe(`SuspenseList`);
                case 0:
                case 15:
                    return Ae(e.type, !1);
                case 11:
                    return Ae(e.type.render, !1);
                case 1:
                    return Ae(e.type, !0);
                case 31:
                    return Oe(`Activity`);
                default:
                    return ``
            }
        }

        function Me(e) {
            try {
                var t = ``,
                    n = null;
                do t += je(e, n), n = e, e = e.return; while (e);
                return t
            } catch (e) {
                return `
Error generating stack: ` + e.message + `
` + e.stack
            }
        }
        var Ne = Object.prototype.hasOwnProperty,
            Pe = t.unstable_scheduleCallback,
            Fe = t.unstable_cancelCallback,
            Le = t.unstable_shouldYield,
            Re = t.unstable_requestPaint,
            T = t.unstable_now,
            ze = t.unstable_getCurrentPriorityLevel,
            Be = t.unstable_ImmediatePriority,
            Ve = t.unstable_UserBlockingPriority,
            E = t.unstable_NormalPriority,
            He = t.unstable_LowPriority,
            Ue = t.unstable_IdlePriority,
            We = t.log,
            Ge = t.unstable_setDisableYieldValue,
            Ke = null,
            qe = null;

        function Je(e) {
            if (typeof We == `function` && Ge(e), qe && typeof qe.setStrictMode == `function`) try {
                qe.setStrictMode(Ke, e)
            } catch {}
        }
        var Ye = Math.clz32 ? Math.clz32 : Qe,
            Xe = Math.log,
            Ze = Math.LN2;

        function Qe(e) {
            return e >>>= 0, e === 0 ? 32 : 31 - (Xe(e) / Ze | 0) | 0
        }
        var $e = 256,
            et = 262144,
            tt = 4194304;

        function nt(e) {
            var t = e & 42;
            if (t !== 0) return t;
            switch (e & -e) {
                case 1:
                    return 1;
                case 2:
                    return 2;
                case 4:
                    return 4;
                case 8:
                    return 8;
                case 16:
                    return 16;
                case 32:
                    return 32;
                case 64:
                    return 64;
                case 128:
                    return 128;
                case 256:
                case 512:
                case 1024:
                case 2048:
                case 4096:
                case 8192:
                case 16384:
                case 32768:
                case 65536:
                case 131072:
                    return e & 261888;
                case 262144:
                case 524288:
                case 1048576:
                case 2097152:
                    return e & 3932160;
                case 4194304:
                case 8388608:
                case 16777216:
                case 33554432:
                    return e & 62914560;
                case 67108864:
                    return 67108864;
                case 134217728:
                    return 134217728;
                case 268435456:
                    return 268435456;
                case 536870912:
                    return 536870912;
                case 1073741824:
                    return 0;
                default:
                    return e
            }
        }

        function rt(e, t, n) {
            var r = e.pendingLanes;
            if (r === 0) return 0;
            var i = 0,
                a = e.suspendedLanes,
                o = e.pingedLanes;
            e = e.warmLanes;
            var s = r & 134217727;
            return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = nt(n))) : i = nt(o) : i = nt(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = nt(n))) : i = nt(o)) : i = nt(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i
        }

        function it(e, t) {
            return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0
        }

        function at(e, t) {
            switch (e) {
                case 1:
                case 2:
                case 4:
                case 8:
                case 64:
                    return t + 250;
                case 16:
                case 32:
                case 128:
                case 256:
                case 512:
                case 1024:
                case 2048:
                case 4096:
                case 8192:
                case 16384:
                case 32768:
                case 65536:
                case 131072:
                case 262144:
                case 524288:
                case 1048576:
                case 2097152:
                    return t + 5e3;
                case 4194304:
                case 8388608:
                case 16777216:
                case 33554432:
                    return -1;
                case 67108864:
                case 134217728:
                case 268435456:
                case 536870912:
                case 1073741824:
                    return -1;
                default:
                    return -1
            }
        }

        function ot() {
            var e = tt;
            return tt <<= 1, !(tt & 62914560) && (tt = 4194304), e
        }

        function st(e) {
            for (var t = [], n = 0; 31 > n; n++) t.push(e);
            return t
        }

        function ct(e, t) {
            e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0)
        }

        function lt(e, t, n, r, i, a) {
            var o = e.pendingLanes;
            e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
            var s = e.entanglements,
                c = e.expirationTimes,
                l = e.hiddenUpdates;
            for (n = o & ~n; 0 < n;) {
                var u = 31 - Ye(n),
                    d = 1 << u;
                s[u] = 0, c[u] = -1;
                var f = l[u];
                if (f !== null)
                    for (l[u] = null, u = 0; u < f.length; u++) {
                        var p = f[u];
                        p !== null && (p.lane &= -536870913)
                    }
                n &= ~d
            }
            r !== 0 && ut(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t))
        }

        function ut(e, t, n) {
            e.pendingLanes |= t, e.suspendedLanes &= ~t;
            var r = 31 - Ye(t);
            e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 261930
        }

        function dt(e, t) {
            var n = e.entangledLanes |= t;
            for (e = e.entanglements; n;) {
                var r = 31 - Ye(n),
                    i = 1 << r;
                i & t | e[r] & t && (e[r] |= t), n &= ~i
            }
        }

        function ft(e, t) {
            var n = t & -t;
            return n = n & 42 ? 1 : pt(n), (n & (e.suspendedLanes | t)) === 0 ? n : 0
        }

        function pt(e) {
            switch (e) {
                case 2:
                    e = 1;
                    break;
                case 8:
                    e = 4;
                    break;
                case 32:
                    e = 16;
                    break;
                case 256:
                case 512:
                case 1024:
                case 2048:
                case 4096:
                case 8192:
                case 16384:
                case 32768:
                case 65536:
                case 131072:
                case 262144:
                case 524288:
                case 1048576:
                case 2097152:
                case 4194304:
                case 8388608:
                case 16777216:
                case 33554432:
                    e = 128;
                    break;
                case 268435456:
                    e = 134217728;
                    break;
                default:
                    e = 0
            }
            return e
        }

        function mt(e) {
            return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2
        }

        function ht() {
            var e = C.p;
            return e === 0 ? (e = window.event, e === void 0 ? 32 : mp(e.type)) : e
        }

        function gt(e, t) {
            var n = C.p;
            try {
                return C.p = e, t()
            } finally {
                C.p = n
            }
        }
        var _t = Math.random().toString(36).slice(2),
            vt = `__reactFiber$` + _t,
            yt = `__reactProps$` + _t,
            bt = `__reactContainer$` + _t,
            xt = `__reactEvents$` + _t,
            St = `__reactListeners$` + _t,
            Ct = `__reactHandles$` + _t,
            wt = `__reactResources$` + _t,
            Tt = `__reactMarker$` + _t;

        function Et(e) {
            delete e[vt], delete e[yt], delete e[xt], delete e[St], delete e[Ct]
        }

        function Dt(e) {
            var t = e[vt];
            if (t) return t;
            for (var n = e.parentNode; n;) {
                if (t = n[bt] || n[vt]) {
                    if (n = t.alternate, t.child !== null || n !== null && n.child !== null)
                        for (e = df(e); e !== null;) {
                            if (n = e[vt]) return n;
                            e = df(e)
                        }
                    return t
                }
                e = n, n = e.parentNode
            }
            return null
        }

        function Ot(e) {
            if (e = e[vt] || e[bt]) {
                var t = e.tag;
                if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e
            }
            return null
        }

        function kt(e) {
            var t = e.tag;
            if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
            throw Error(i(33))
        }

        function At(e) {
            var t = e[wt];
            return t || = e[wt] = {
                hoistableStyles: new Map,
                hoistableScripts: new Map
            }, t
        }

        function jt(e) {
            e[Tt] = !0
        }
        var Mt = new Set,
            Nt = {};

        function Pt(e, t) {
            Ft(e, t), Ft(e + `Capture`, t)
        }

        function Ft(e, t) {
            for (Nt[e] = t, e = 0; e < t.length; e++) Mt.add(t[e])
        }
        var It = RegExp(`^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$`),
            Lt = {},
            Rt = {};

        function zt(e) {
            return Ne.call(Rt, e) ? !0 : Ne.call(Lt, e) ? !1 : It.test(e) ? Rt[e] = !0 : (Lt[e] = !0, !1)
        }

        function Bt(e, t, n) {
            if (zt(t))
                if (n === null) e.removeAttribute(t);
                else {
                    switch (typeof n) {
                        case `undefined`:
                        case `function`:
                        case `symbol`:
                            e.removeAttribute(t);
                            return;
                        case `boolean`:
                            var r = t.toLowerCase().slice(0, 5);
                            if (r !== `data-` && r !== `aria-`) {
                                e.removeAttribute(t);
                                return
                            }
                    }
                    e.setAttribute(t, `` + n)
                }
        }

        function Vt(e, t, n) {
            if (n === null) e.removeAttribute(t);
            else {
                switch (typeof n) {
                    case `undefined`:
                    case `function`:
                    case `symbol`:
                    case `boolean`:
                        e.removeAttribute(t);
                        return
                }
                e.setAttribute(t, `` + n)
            }
        }

        function Ht(e, t, n, r) {
            if (r === null) e.removeAttribute(n);
            else {
                switch (typeof r) {
                    case `undefined`:
                    case `function`:
                    case `symbol`:
                    case `boolean`:
                        e.removeAttribute(n);
                        return
                }
                e.setAttributeNS(t, n, `` + r)
            }
        }

        function Ut(e) {
            switch (typeof e) {
                case `bigint`:
                case `boolean`:
                case `number`:
                case `string`:
                case `undefined`:
                    return e;
                case `object`:
                    return e;
                default:
                    return ``
            }
        }

        function Wt(e) {
            var t = e.type;
            return (e = e.nodeName) && e.toLowerCase() === `input` && (t === `checkbox` || t === `radio`)
        }

        function Gt(e, t, n) {
            var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
            if (!e.hasOwnProperty(t) && r !== void 0 && typeof r.get == `function` && typeof r.set == `function`) {
                var i = r.get,
                    a = r.set;
                return Object.defineProperty(e, t, {
                    configurable: !0,
                    get: function() {
                        return i.call(this)
                    },
                    set: function(e) {
                        n = `` + e, a.call(this, e)
                    }
                }), Object.defineProperty(e, t, {
                    enumerable: r.enumerable
                }), {
                    getValue: function() {
                        return n
                    },
                    setValue: function(e) {
                        n = `` + e
                    },
                    stopTracking: function() {
                        e._valueTracker = null, delete e[t]
                    }
                }
            }
        }

        function Kt(e) {
            if (!e._valueTracker) {
                var t = Wt(e) ? `checked` : `value`;
                e._valueTracker = Gt(e, t, `` + e[t])
            }
        }

        function qt(e) {
            if (!e) return !1;
            var t = e._valueTracker;
            if (!t) return !0;
            var n = t.getValue(),
                r = ``;
            return e && (r = Wt(e) ? e.checked ? `true` : `false` : e.value), e = r, e === n ? !1 : (t.setValue(e), !0)
        }

        function Jt(e) {
            if (e || = typeof document < `u` ? document : void 0, e === void 0) return null;
            try {
                return e.activeElement || e.body
            } catch {
                return e.body
            }
        }
        var Yt = /[\n"\\]/g;

        function Xt(e) {
            return e.replace(Yt, function(e) {
                return `\\` + e.charCodeAt(0).toString(16) + ` `
            })
        }

        function Zt(e, t, n, r, i, a, o, s) {
            e.name = ``, o != null && typeof o != `function` && typeof o != `symbol` && typeof o != `boolean` ? e.type = o : e.removeAttribute(`type`), t == null ? o !== `submit` && o !== `reset` || e.removeAttribute(`value`) : o === `number` ? (t === 0 && e.value === `` || e.value != t) && (e.value = `` + Ut(t)) : e.value !== `` + Ut(t) && (e.value = `` + Ut(t)), t == null ? n == null ? r != null && e.removeAttribute(`value`) : $t(e, o, Ut(n)) : $t(e, o, Ut(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != `function` && typeof i != `symbol`), s != null && typeof s != `function` && typeof s != `symbol` && typeof s != `boolean` ? e.name = `` + Ut(s) : e.removeAttribute(`name`)
        }

        function Qt(e, t, n, r, i, a, o, s) {
            if (a != null && typeof a != `function` && typeof a != `symbol` && typeof a != `boolean` && (e.type = a), t != null || n != null) {
                if (!(a !== `submit` && a !== `reset` || t != null)) {
                    Kt(e);
                    return
                }
                n = n == null ? `` : `` + Ut(n), t = t == null ? n : `` + Ut(t), s || t === e.value || (e.value = t), e.defaultValue = t
            }
            r ? ? = i, r = typeof r != `function` && typeof r != `symbol` && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != `function` && typeof o != `symbol` && typeof o != `boolean` && (e.name = o), Kt(e)
        }

        function $t(e, t, n) {
            t === `number` && Jt(e.ownerDocument) === e || e.defaultValue === `` + n || (e.defaultValue = `` + n)
        }

        function en(e, t, n, r) {
            if (e = e.options, t) {
                t = {};
                for (var i = 0; i < n.length; i++) t[`$` + n[i]] = !0;
                for (n = 0; n < e.length; n++) i = t.hasOwnProperty(`$` + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0)
            } else {
                for (n = `` + Ut(n), t = null, i = 0; i < e.length; i++) {
                    if (e[i].value === n) {
                        e[i].selected = !0, r && (e[i].defaultSelected = !0);
                        return
                    }
                    t !== null || e[i].disabled || (t = e[i])
                }
                t !== null && (t.selected = !0)
            }
        }

        function D(e, t, n) {
            if (t != null && (t = `` + Ut(t), t !== e.value && (e.value = t), n == null)) {
                e.defaultValue !== t && (e.defaultValue = t);
                return
            }
            e.defaultValue = n == null ? `` : `` + Ut(n)
        }

        function tn(e, t, n, r) {
            if (t == null) {
                if (r != null) {
                    if (n != null) throw Error(i(92));
                    if (fe(r)) {
                        if (1 < r.length) throw Error(i(93));
                        r = r[0]
                    }
                    n = r
                }
                n ? ? = ``, t = n
            }
            n = Ut(t), e.defaultValue = n, r = e.textContent, r === n && r !== `` && r !== null && (e.value = r), Kt(e)
        }

        function nn(e, t) {
            if (t) {
                var n = e.firstChild;
                if (n && n === e.lastChild && n.nodeType === 3) {
                    n.nodeValue = t;
                    return
                }
            }
            e.textContent = t
        }
        var rn = new Set(`animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp`.split(` `));

        function an(e, t, n) {
            var r = t.indexOf(`--`) === 0;
            n == null || typeof n == `boolean` || n === `` ? r ? e.setProperty(t, ``) : t === `float` ? e.cssFloat = `` : e[t] = `` : r ? e.setProperty(t, n) : typeof n != `number` || n === 0 || rn.has(t) ? t === `float` ? e.cssFloat = n : e[t] = (`` + n).trim() : e[t] = n + `px`
        }

        function on(e, t, n) {
            if (t != null && typeof t != `object`) throw Error(i(62));
            if (e = e.style, n != null) {
                for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf(`--`) === 0 ? e.setProperty(r, ``) : r === `float` ? e.cssFloat = `` : e[r] = ``);
                for (var a in t) r = t[a], t.hasOwnProperty(a) && n[a] !== r && an(e, a, r)
            } else
                for (var o in t) t.hasOwnProperty(o) && an(e, o, t[o])
        }

        function sn(e) {
            if (e.indexOf(`-`) === -1) return !1;
            switch (e) {
                case `annotation-xml`:
                case `color-profile`:
                case `font-face`:
                case `font-face-src`:
                case `font-face-uri`:
                case `font-face-format`:
                case `font-face-name`:
                case `missing-glyph`:
                    return !1;
                default:
                    return !0
            }
        }
        var cn = new Map([
                [`acceptCharset`, `accept-charset`],
                [`htmlFor`, `for`],
                [`httpEquiv`, `http-equiv`],
                [`crossOrigin`, `crossorigin`],
                [`accentHeight`, `accent-height`],
                [`alignmentBaseline`, `alignment-baseline`],
                [`arabicForm`, `arabic-form`],
                [`baselineShift`, `baseline-shift`],
                [`capHeight`, `cap-height`],
                [`clipPath`, `clip-path`],
                [`clipRule`, `clip-rule`],
                [`colorInterpolation`, `color-interpolation`],
                [`colorInterpolationFilters`, `color-interpolation-filters`],
                [`colorProfile`, `color-profile`],
                [`colorRendering`, `color-rendering`],
                [`dominantBaseline`, `dominant-baseline`],
                [`enableBackground`, `enable-background`],
                [`fillOpacity`, `fill-opacity`],
                [`fillRule`, `fill-rule`],
                [`floodColor`, `flood-color`],
                [`floodOpacity`, `flood-opacity`],
                [`fontFamily`, `font-family`],
                [`fontSize`, `font-size`],
                [`fontSizeAdjust`, `font-size-adjust`],
                [`fontStretch`, `font-stretch`],
                [`fontStyle`, `font-style`],
                [`fontVariant`, `font-variant`],
                [`fontWeight`, `font-weight`],
                [`glyphName`, `glyph-name`],
                [`glyphOrientationHorizontal`, `glyph-orientation-horizontal`],
                [`glyphOrientationVertical`, `glyph-orientation-vertical`],
                [`horizAdvX`, `horiz-adv-x`],
                [`horizOriginX`, `horiz-origin-x`],
                [`imageRendering`, `image-rendering`],
                [`letterSpacing`, `letter-spacing`],
                [`lightingColor`, `lighting-color`],
                [`markerEnd`, `marker-end`],
                [`markerMid`, `marker-mid`],
                [`markerStart`, `marker-start`],
                [`overlinePosition`, `overline-position`],
                [`overlineThickness`, `overline-thickness`],
                [`paintOrder`, `paint-order`],
                [`panose-1`, `panose-1`],
                [`pointerEvents`, `pointer-events`],
                [`renderingIntent`, `rendering-intent`],
                [`shapeRendering`, `shape-rendering`],
                [`stopColor`, `stop-color`],
                [`stopOpacity`, `stop-opacity`],
                [`strikethroughPosition`, `strikethrough-position`],
                [`strikethroughThickness`, `strikethrough-thickness`],
                [`strokeDasharray`, `stroke-dasharray`],
                [`strokeDashoffset`, `stroke-dashoffset`],
                [`strokeLinecap`, `stroke-linecap`],
                [`strokeLinejoin`, `stroke-linejoin`],
                [`strokeMiterlimit`, `stroke-miterlimit`],
                [`strokeOpacity`, `stroke-opacity`],
                [`strokeWidth`, `stroke-width`],
                [`textAnchor`, `text-anchor`],
                [`textDecoration`, `text-decoration`],
                [`textRendering`, `text-rendering`],
                [`transformOrigin`, `transform-origin`],
                [`underlinePosition`, `underline-position`],
                [`underlineThickness`, `underline-thickness`],
                [`unicodeBidi`, `unicode-bidi`],
                [`unicodeRange`, `unicode-range`],
                [`unitsPerEm`, `units-per-em`],
                [`vAlphabetic`, `v-alphabetic`],
                [`vHanging`, `v-hanging`],
                [`vIdeographic`, `v-ideographic`],
                [`vMathematical`, `v-mathematical`],
                [`vectorEffect`, `vector-effect`],
                [`vertAdvY`, `vert-adv-y`],
                [`vertOriginX`, `vert-origin-x`],
                [`vertOriginY`, `vert-origin-y`],
                [`wordSpacing`, `word-spacing`],
                [`writingMode`, `writing-mode`],
                [`xmlnsXlink`, `xmlns:xlink`],
                [`xHeight`, `x-height`]
            ]),
            ln = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;

        function un(e) {
            return ln.test(`` + e) ? `javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')` : e
        }

        function dn() {}
        var fn = null;

        function pn(e) {
            return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e
        }
        var mn = null,
            hn = null;

        function gn(e) {
            var t = Ot(e);
            if (t && (e = t.stateNode)) {
                var n = e[yt] || null;
                a: switch (e = t.stateNode, t.type) {
                    case `input`:
                        if (Zt(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === `radio` && t != null) {
                            for (n = e; n.parentNode;) n = n.parentNode;
                            for (n = n.querySelectorAll(`input[name="` + Xt(`` + t) + `"][type="radio"]`), t = 0; t < n.length; t++) {
                                var r = n[t];
                                if (r !== e && r.form === e.form) {
                                    var a = r[yt] || null;
                                    if (!a) throw Error(i(90));
                                    Zt(r, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name)
                                }
                            }
                            for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && qt(r)
                        }
                        break a;
                    case `textarea`:
                        D(e, n.value, n.defaultValue);
                        break a;
                    case `select`:
                        t = n.value, t != null && en(e, !!n.multiple, t, !1)
                }
            }
        }
        var _n = !1;

        function vn(e, t, n) {
            if (_n) return e(t, n);
            _n = !0;
            try {
                return e(t)
            } finally {
                if (_n = !1, (mn !== null || hn !== null) && (xu(), mn && (t = mn, e = hn, hn = mn = null, gn(t), e)))
                    for (t = 0; t < e.length; t++) gn(e[t])
            }
        }

        function yn(e, t) {
            var n = e.stateNode;
            if (n === null) return null;
            var r = n[yt] || null;
            if (r === null) return null;
            n = r[t];
            a: switch (t) {
                case `onClick`:
                case `onClickCapture`:
                case `onDoubleClick`:
                case `onDoubleClickCapture`:
                case `onMouseDown`:
                case `onMouseDownCapture`:
                case `onMouseMove`:
                case `onMouseMoveCapture`:
                case `onMouseUp`:
                case `onMouseUpCapture`:
                case `onMouseEnter`:
                    (r = !r.disabled) || (e = e.type, r = !(e === `button` || e === `input` || e === `select` || e === `textarea`)), e = !r;
                    break a;
                default:
                    e = !1
            }
            if (e) return null;
            if (n && typeof n != `function`) throw Error(i(231, t, typeof n));
            return n
        }
        var bn = !(typeof window > `u` || window.document === void 0 || window.document.createElement === void 0),
            xn = !1;
        if (bn) try {
            var Sn = {};
            Object.defineProperty(Sn, "passive", {
                get: function() {
                    xn = !0
                }
            }), window.addEventListener(`test`, Sn, Sn), window.removeEventListener(`test`, Sn, Sn)
        } catch {
            xn = !1
        }
        var Cn = null,
            wn = null,
            Tn = null;

        function En() {
            if (Tn) return Tn;
            var e, t = wn,
                n = t.length,
                r, i = `value` in Cn ? Cn.value : Cn.textContent,
                a = i.length;
            for (e = 0; e < n && t[e] === i[e]; e++);
            var o = n - e;
            for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
            return Tn = i.slice(e, 1 < r ? 1 - r : void 0)
        }

        function Dn(e) {
            var t = e.keyCode;
            return `charCode` in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0
        }

        function On() {
            return !0
        }

        function kn() {
            return !1
        }

        function An(e) {
            function t(t, n, r, i, a) {
                for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
                return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? On : kn, this.isPropagationStopped = kn, this
            }
            return f(t.prototype, {
                preventDefault: function() {
                    this.defaultPrevented = !0;
                    var e = this.nativeEvent;
                    e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != `unknown` && (e.returnValue = !1), this.isDefaultPrevented = On)
                },
                stopPropagation: function() {
                    var e = this.nativeEvent;
                    e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != `unknown` && (e.cancelBubble = !0), this.isPropagationStopped = On)
                },
                persist: function() {},
                isPersistent: On
            }), t
        }
        var jn = {
                eventPhase: 0,
                bubbles: 0,
                cancelable: 0,
                timeStamp: function(e) {
                    return e.timeStamp || Date.now()
                },
                defaultPrevented: 0,
                isTrusted: 0
            },
            Mn = An(jn),
            Nn = f({}, jn, {
                view: 0,
                detail: 0
            }),
            Pn = An(Nn),
            Fn, In, Ln, Rn = f({}, Nn, {
                screenX: 0,
                screenY: 0,
                clientX: 0,
                clientY: 0,
                pageX: 0,
                pageY: 0,
                ctrlKey: 0,
                shiftKey: 0,
                altKey: 0,
                metaKey: 0,
                getModifierState: Yn,
                button: 0,
                buttons: 0,
                relatedTarget: function(e) {
                    return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget
                },
                movementX: function(e) {
                    return `movementX` in e ? e.movementX : (e !== Ln && (Ln && e.type === `mousemove` ? (Fn = e.screenX - Ln.screenX, In = e.screenY - Ln.screenY) : In = Fn = 0, Ln = e), Fn)
                },
                movementY: function(e) {
                    return `movementY` in e ? e.movementY : In
                }
            }),
            zn = An(Rn),
            Bn = An(f({}, Rn, {
                dataTransfer: 0
            })),
            Vn = An(f({}, Nn, {
                relatedTarget: 0
            })),
            Hn = An(f({}, jn, {
                animationName: 0,
                elapsedTime: 0,
                pseudoElement: 0
            })),
            Un = An(f({}, jn, {
                clipboardData: function(e) {
                    return `clipboardData` in e ? e.clipboardData : window.clipboardData
                }
            })),
            Wn = An(f({}, jn, {
                data: 0
            })),
            Gn = {
                Esc: `Escape`,
                Spacebar: ` `,
                Left: `ArrowLeft`,
                Up: `ArrowUp`,
                Right: `ArrowRight`,
                Down: `ArrowDown`,
                Del: `Delete`,
                Win: `OS`,
                Menu: `ContextMenu`,
                Apps: `ContextMenu`,
                Scroll: `ScrollLock`,
                MozPrintableKey: `Unidentified`
            },
            Kn = {
                8: `Backspace`,
                9: `Tab`,
                12: `Clear`,
                13: `Enter`,
                16: `Shift`,
                17: `Control`,
                18: `Alt`,
                19: `Pause`,
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
                45: `Insert`,
                46: `Delete`,
                112: `F1`,
                113: `F2`,
                114: `F3`,
                115: `F4`,
                116: `F5`,
                117: `F6`,
                118: `F7`,
                119: `F8`,
                120: `F9`,
                121: `F10`,
                122: `F11`,
                123: `F12`,
                144: `NumLock`,
                145: `ScrollLock`,
                224: `Meta`
            },
            qn = {
                Alt: `altKey`,
                Control: `ctrlKey`,
                Meta: `metaKey`,
                Shift: `shiftKey`
            };

        function Jn(e) {
            var t = this.nativeEvent;
            return t.getModifierState ? t.getModifierState(e) : (e = qn[e]) ? !!t[e] : !1
        }

        function Yn() {
            return Jn
        }
        var Xn = An(f({}, Nn, {
                key: function(e) {
                    if (e.key) {
                        var t = Gn[e.key] || e.key;
                        if (t !== `Unidentified`) return t
                    }
                    return e.type === `keypress` ? (e = Dn(e), e === 13 ? `Enter` : String.fromCharCode(e)) : e.type === `keydown` || e.type === `keyup` ? Kn[e.keyCode] || `Unidentified` : ``
                },
                code: 0,
                location: 0,
                ctrlKey: 0,
                shiftKey: 0,
                altKey: 0,
                metaKey: 0,
                repeat: 0,
                locale: 0,
                getModifierState: Yn,
                charCode: function(e) {
                    return e.type === `keypress` ? Dn(e) : 0
                },
                keyCode: function(e) {
                    return e.type === `keydown` || e.type === `keyup` ? e.keyCode : 0
                },
                which: function(e) {
                    return e.type === `keypress` ? Dn(e) : e.type === `keydown` || e.type === `keyup` ? e.keyCode : 0
                }
            })),
            Zn = An(f({}, Rn, {
                pointerId: 0,
                width: 0,
                height: 0,
                pressure: 0,
                tangentialPressure: 0,
                tiltX: 0,
                tiltY: 0,
                twist: 0,
                pointerType: 0,
                isPrimary: 0
            })),
            Qn = An(f({}, Nn, {
                touches: 0,
                targetTouches: 0,
                changedTouches: 0,
                altKey: 0,
                metaKey: 0,
                ctrlKey: 0,
                shiftKey: 0,
                getModifierState: Yn
            })),
            $n = An(f({}, jn, {
                propertyName: 0,
                elapsedTime: 0,
                pseudoElement: 0
            })),
            er = An(f({}, Rn, {
                deltaX: function(e) {
                    return `deltaX` in e ? e.deltaX : `wheelDeltaX` in e ? -e.wheelDeltaX : 0
                },
                deltaY: function(e) {
                    return `deltaY` in e ? e.deltaY : `wheelDeltaY` in e ? -e.wheelDeltaY : `wheelDelta` in e ? -e.wheelDelta : 0
                },
                deltaZ: 0,
                deltaMode: 0
            })),
            tr = An(f({}, jn, {
                newState: 0,
                oldState: 0
            })),
            nr = [9, 13, 27, 32],
            rr = bn && `CompositionEvent` in window,
            ir = null;
        bn && `documentMode` in document && (ir = document.documentMode);
        var ar = bn && `TextEvent` in window && !ir,
            or = bn && (!rr || ir && 8 < ir && 11 >= ir),
            sr = ` `,
            cr = !1;

        function lr(e, t) {
            switch (e) {
                case `keyup`:
                    return nr.indexOf(t.keyCode) !== -1;
                case `keydown`:
                    return t.keyCode !== 229;
                case `keypress`:
                case `mousedown`:
                case `focusout`:
                    return !0;
                default:
                    return !1
            }
        }

        function ur(e) {
            return e = e.detail, typeof e == `object` && `data` in e ? e.data : null
        }
        var dr = !1;

        function fr(e, t) {
            switch (e) {
                case `compositionend`:
                    return ur(t);
                case `keypress`:
                    return t.which === 32 ? (cr = !0, sr) : null;
                case `textInput`:
                    return e = t.data, e === sr && cr ? null : e;
                default:
                    return null
            }
        }

        function pr(e, t) {
            if (dr) return e === `compositionend` || !rr && lr(e, t) ? (e = En(), Tn = wn = Cn = null, dr = !1, e) : null;
            switch (e) {
                case `paste`:
                    return null;
                case `keypress`:
                    if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
                        if (t.char && 1 < t.char.length) return t.char;
                        if (t.which) return String.fromCharCode(t.which)
                    }
                    return null;
                case `compositionend`:
                    return or && t.locale !== `ko` ? null : t.data;
                default:
                    return null
            }
        }
        var mr = {
            color: !0,
            date: !0,
            datetime: !0,
            "datetime-local": !0,
            email: !0,
            month: !0,
            number: !0,
            password: !0,
            range: !0,
            search: !0,
            tel: !0,
            text: !0,
            time: !0,
            url: !0,
            week: !0
        };

        function hr(e) {
            var t = e && e.nodeName && e.nodeName.toLowerCase();
            return t === `input` ? !!mr[e.type] : t === `textarea`
        }

        function gr(e, t, n, r) {
            mn ? hn ? hn.push(r) : hn = [r] : mn = r, t = Ed(t, `onChange`), 0 < t.length && (n = new Mn(`onChange`, `change`, null, n, r), e.push({
                event: n,
                listeners: t
            }))
        }
        var _r = null,
            vr = null;

        function yr(e) {
            yd(e, 0)
        }

        function br(e) {
            if (qt(kt(e))) return e
        }

        function xr(e, t) {
            if (e === `change`) return t
        }
        var Sr = !1;
        if (bn) {
            var Cr;
            if (bn) {
                var wr = `oninput` in document;
                if (!wr) {
                    var Tr = document.createElement(`div`);
                    Tr.setAttribute(`oninput`, `return;`), wr = typeof Tr.oninput == `function`
                }
                Cr = wr
            } else Cr = !1;
            Sr = Cr && (!document.documentMode || 9 < document.documentMode)
        }

        function Er() {
            _r && (_r.detachEvent(`onpropertychange`, Dr), vr = _r = null)
        }

        function Dr(e) {
            if (e.propertyName === `value` && br(vr)) {
                var t = [];
                gr(t, vr, e, pn(e)), vn(yr, t)
            }
        }

        function Or(e, t, n) {
            e === `focusin` ? (Er(), _r = t, vr = n, _r.attachEvent(`onpropertychange`, Dr)) : e === `focusout` && Er()
        }

        function kr(e) {
            if (e === `selectionchange` || e === `keyup` || e === `keydown`) return br(vr)
        }

        function Ar(e, t) {
            if (e === `click`) return br(t)
        }

        function jr(e, t) {
            if (e === `input` || e === `change`) return br(t)
        }

        function Mr(e, t) {
            return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t
        }
        var Nr = typeof Object.is == `function` ? Object.is : Mr;

        function Pr(e, t) {
            if (Nr(e, t)) return !0;
            if (typeof e != `object` || !e || typeof t != `object` || !t) return !1;
            var n = Object.keys(e),
                r = Object.keys(t);
            if (n.length !== r.length) return !1;
            for (r = 0; r < n.length; r++) {
                var i = n[r];
                if (!Ne.call(t, i) || !Nr(e[i], t[i])) return !1
            }
            return !0
        }

        function Fr(e) {
            for (; e && e.firstChild;) e = e.firstChild;
            return e
        }

        function Ir(e, t) {
            var n = Fr(e);
            e = 0;
            for (var r; n;) {
                if (n.nodeType === 3) {
                    if (r = e + n.textContent.length, e <= t && r >= t) return {
                        node: n,
                        offset: t - e
                    };
                    e = r
                }
                a: {
                    for (; n;) {
                        if (n.nextSibling) {
                            n = n.nextSibling;
                            break a
                        }
                        n = n.parentNode
                    }
                    n = void 0
                }
                n = Fr(n)
            }
        }

        function Lr(e, t) {
            return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Lr(e, t.parentNode) : `contains` in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1
        }

        function Rr(e) {
            e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
            for (var t = Jt(e.document); t instanceof e.HTMLIFrameElement;) {
                try {
                    var n = typeof t.contentWindow.location.href == `string`
                } catch {
                    n = !1
                }
                if (n) e = t.contentWindow;
                else break;
                t = Jt(e.document)
            }
            return t
        }

        function zr(e) {
            var t = e && e.nodeName && e.nodeName.toLowerCase();
            return t && (t === `input` && (e.type === `text` || e.type === `search` || e.type === `tel` || e.type === `url` || e.type === `password`) || t === `textarea` || e.contentEditable === `true`)
        }
        var Br = bn && `documentMode` in document && 11 >= document.documentMode,
            Vr = null,
            Hr = null,
            Ur = null,
            Wr = !1;

        function Gr(e, t, n) {
            var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
            Wr || Vr == null || Vr !== Jt(r) || (r = Vr, `selectionStart` in r && zr(r) ? r = {
                start: r.selectionStart,
                end: r.selectionEnd
            } : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
                anchorNode: r.anchorNode,
                anchorOffset: r.anchorOffset,
                focusNode: r.focusNode,
                focusOffset: r.focusOffset
            }), Ur && Pr(Ur, r) || (Ur = r, r = Ed(Hr, `onSelect`), 0 < r.length && (t = new Mn(`onSelect`, `select`, null, t, n), e.push({
                event: t,
                listeners: r
            }), t.target = Vr)))
        }

        function Kr(e, t) {
            var n = {};
            return n[e.toLowerCase()] = t.toLowerCase(), n[`Webkit` + e] = `webkit` + t, n[`Moz` + e] = `moz` + t, n
        }
        var qr = {
                animationend: Kr(`Animation`, `AnimationEnd`),
                animationiteration: Kr(`Animation`, `AnimationIteration`),
                animationstart: Kr(`Animation`, `AnimationStart`),
                transitionrun: Kr(`Transition`, `TransitionRun`),
                transitionstart: Kr(`Transition`, `TransitionStart`),
                transitioncancel: Kr(`Transition`, `TransitionCancel`),
                transitionend: Kr(`Transition`, `TransitionEnd`)
            },
            Jr = {},
            Yr = {};
        bn && (Yr = document.createElement(`div`).style, `AnimationEvent` in window || (delete qr.animationend.animation, delete qr.animationiteration.animation, delete qr.animationstart.animation), `TransitionEvent` in window || delete qr.transitionend.transition);

        function Xr(e) {
            if (Jr[e]) return Jr[e];
            if (!qr[e]) return e;
            var t = qr[e],
                n;
            for (n in t)
                if (t.hasOwnProperty(n) && n in Yr) return Jr[e] = t[n];
            return e
        }
        var Zr = Xr(`animationend`),
            Qr = Xr(`animationiteration`),
            $r = Xr(`animationstart`),
            ei = Xr(`transitionrun`),
            ti = Xr(`transitionstart`),
            ni = Xr(`transitioncancel`),
            ri = Xr(`transitionend`),
            ii = new Map,
            ai = `abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel`.split(` `);
        ai.push(`scrollEnd`);

        function oi(e, t) {
            ii.set(e, t), Pt(t, [e])
        }
        var si = typeof reportError == `function` ? reportError : function(e) {
                if (typeof window == `object` && typeof window.ErrorEvent == `function`) {
                    var t = new window.ErrorEvent(`error`, {
                        bubbles: !0,
                        cancelable: !0,
                        message: typeof e == `object` && e && typeof e.message == `string` ? String(e.message) : String(e),
                        error: e
                    });
                    if (!window.dispatchEvent(t)) return
                } else if (typeof process == `object` && typeof process.emit == `function`) {
                    process.emit(`uncaughtException`, e);
                    return
                }
            },
            ci = [],
            li = 0,
            ui = 0;

        function di() {
            for (var e = li, t = ui = li = 0; t < e;) {
                var n = ci[t];
                ci[t++] = null;
                var r = ci[t];
                ci[t++] = null;
                var i = ci[t];
                ci[t++] = null;
                var a = ci[t];
                if (ci[t++] = null, r !== null && i !== null) {
                    var o = r.pending;
                    o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i
                }
                a !== 0 && hi(n, i, a)
            }
        }

        function fi(e, t, n, r) {
            ci[li++] = e, ci[li++] = t, ci[li++] = n, ci[li++] = r, ui |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r)
        }

        function pi(e, t, n, r) {
            return fi(e, t, n, r), gi(e)
        }

        function mi(e, t) {
            return fi(e, null, null, t), gi(e)
        }

        function hi(e, t, n) {
            e.lanes |= n;
            var r = e.alternate;
            r !== null && (r.lanes |= n);
            for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
            return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - Ye(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null
        }

        function gi(e) {
            if (50 < fu) throw fu = 0, pu = null, Error(i(185));
            for (var t = e.return; t !== null;) e = t, t = e.return;
            return e.tag === 3 ? e.stateNode : null
        }
        var _i = {};

        function vi(e, t, n, r) {
            this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null
        }

        function yi(e, t, n, r) {
            return new vi(e, t, n, r)
        }

        function bi(e) {
            return e = e.prototype, !(!e || !e.isReactComponent)
        }

        function xi(e, t) {
            var n = e.alternate;
            return n === null ? (n = yi(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 65011712, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
                lanes: t.lanes,
                firstContext: t.firstContext
            }, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n
        }

        function Si(e, t) {
            e.flags &= 65011714;
            var n = e.alternate;
            return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
                lanes: t.lanes,
                firstContext: t.firstContext
            }), e
        }

        function Ci(e, t, n, r, a, o) {
            var s = 0;
            if (r = e, typeof e == `function`) bi(e) && (s = 1);
            else if (typeof e == `string`) s = Uf(e, n, ve.current) ? 26 : e === `html` || e === `head` || e === `body` ? 27 : 5;
            else a: switch (e) {
                case oe:
                    return e = yi(31, n, t, a), e.elementType = oe, e.lanes = o, e;
                case _:
                    return wi(n.children, a, o, t);
                case v:
                    s = 8, a |= 24;
                    break;
                case y:
                    return e = yi(12, n, t, a | 2), e.elementType = y, e.lanes = o, e;
                case ne:
                    return e = yi(13, n, t, a), e.elementType = ne, e.lanes = o, e;
                case re:
                    return e = yi(19, n, t, a), e.elementType = re, e.lanes = o, e;
                default:
                    if (typeof e == `object` && e) switch (e.$$typeof) {
                        case x:
                            s = 10;
                            break a;
                        case b:
                            s = 9;
                            break a;
                        case te:
                            s = 11;
                            break a;
                        case ie:
                            s = 14;
                            break a;
                        case ae:
                            s = 16, r = null;
                            break a
                    }
                    s = 29, n = Error(i(130, e === null ? `null` : typeof e, ``)), r = null
            }
            return t = yi(s, n, t, a), t.elementType = e, t.type = r, t.lanes = o, t
        }

        function wi(e, t, n, r) {
            return e = yi(7, e, r, t), e.lanes = n, e
        }

        function Ti(e, t, n) {
            return e = yi(6, e, null, t), e.lanes = n, e
        }

        function Ei(e) {
            var t = yi(18, null, null, 0);
            return t.stateNode = e, t
        }

        function Di(e, t, n) {
            return t = yi(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
                containerInfo: e.containerInfo,
                pendingChildren: null,
                implementation: e.implementation
            }, t
        }
        var Oi = new WeakMap;

        function ki(e, t) {
            if (typeof e == `object` && e) {
                var n = Oi.get(e);
                return n === void 0 ? (t = {
                    value: e,
                    source: t,
                    stack: Me(t)
                }, Oi.set(e, t), t) : n
            }
            return {
                value: e,
                source: t,
                stack: Me(t)
            }
        }
        var Ai = [],
            ji = 0,
            Mi = null,
            Ni = 0,
            Pi = [],
            Fi = 0,
            Ii = null,
            Li = 1,
            Ri = ``;

        function zi(e, t) {
            Ai[ji++] = Ni, Ai[ji++] = Mi, Mi = e, Ni = t
        }

        function Bi(e, t, n) {
            Pi[Fi++] = Li, Pi[Fi++] = Ri, Pi[Fi++] = Ii, Ii = e;
            var r = Li;
            e = Ri;
            var i = 32 - Ye(r) - 1;
            r &= ~(1 << i), n += 1;
            var a = 32 - Ye(t) + i;
            if (30 < a) {
                var o = i - i % 5;
                a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, Li = 1 << 32 - Ye(t) + i | n << i | r, Ri = a + e
            } else Li = 1 << a | n << i | r, Ri = e
        }

        function Vi(e) {
            e.return !== null && (zi(e, 1), Bi(e, 1, 0))
        }

        function Hi(e) {
            for (; e === Mi;) Mi = Ai[--ji], Ai[ji] = null, Ni = Ai[--ji], Ai[ji] = null;
            for (; e === Ii;) Ii = Pi[--Fi], Pi[Fi] = null, Ri = Pi[--Fi], Pi[Fi] = null, Li = Pi[--Fi], Pi[Fi] = null
        }

        function Ui(e, t) {
            Pi[Fi++] = Li, Pi[Fi++] = Ri, Pi[Fi++] = Ii, Li = t.id, Ri = t.overflow, Ii = e
        }
        var Wi = null,
            O = null,
            k = !1,
            Gi = null,
            Ki = !1,
            qi = Error(i(519));

        function Ji(e) {
            throw ea(ki(Error(i(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? `text` : `HTML`, ``)), e)), qi
        }

        function Yi(e) {
            var t = e.stateNode,
                n = e.type,
                r = e.memoizedProps;
            switch (t[vt] = e, t[yt] = r, n) {
                case `dialog`:
                    Q(`cancel`, t), Q(`close`, t);
                    break;
                case `iframe`:
                case `object`:
                case `embed`:
                    Q(`load`, t);
                    break;
                case `video`:
                case `audio`:
                    for (n = 0; n < _d.length; n++) Q(_d[n], t);
                    break;
                case `source`:
                    Q(`error`, t);
                    break;
                case `img`:
                case `image`:
                case `link`:
                    Q(`error`, t), Q(`load`, t);
                    break;
                case `details`:
                    Q(`toggle`, t);
                    break;
                case `input`:
                    Q(`invalid`, t), Qt(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0);
                    break;
                case `select`:
                    Q(`invalid`, t);
                    break;
                case `textarea`:
                    Q(`invalid`, t), tn(t, r.value, r.defaultValue, r.children)
            }
            n = r.children, typeof n != `string` && typeof n != `number` && typeof n != `bigint` || t.textContent === `` + n || !0 === r.suppressHydrationWarning || Md(t.textContent, n) ? (r.popover != null && (Q(`beforetoggle`, t), Q(`toggle`, t)), r.onScroll != null && Q(`scroll`, t), r.onScrollEnd != null && Q(`scrollend`, t), r.onClick != null && (t.onclick = dn), t = !0) : t = !1, t || Ji(e, !0)
        }

        function Xi(e) {
            for (Wi = e.return; Wi;) switch (Wi.tag) {
                case 5:
                case 31:
                case 13:
                    Ki = !1;
                    return;
                case 27:
                case 3:
                    Ki = !0;
                    return;
                default:
                    Wi = Wi.return
            }
        }

        function Zi(e) {
            if (e !== Wi) return !1;
            if (!k) return Xi(e), k = !0, !1;
            var t = e.tag,
                n;
            if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = !(n !== `form` && n !== `button`) || Ud(e.type, e.memoizedProps)), n = !n), n && O && Ji(e), Xi(e), t === 13) {
                if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
                O = uf(e)
            } else if (t === 31) {
                if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
                O = uf(e)
            } else t === 27 ? (t = O, Zd(e.type) ? (e = lf, lf = null, O = e) : O = t) : O = Wi ? cf(e.stateNode.nextSibling) : null;
            return !0
        }

        function Qi() {
            O = Wi = null, k = !1
        }

        function $i() {
            var e = Gi;
            return e !== null && ($l === null ? $l = e : $l.push.apply($l, e), Gi = null), e
        }

        function ea(e) {
            Gi === null ? Gi = [e] : Gi.push(e)
        }
        var ta = ge(null),
            na = null,
            ra = null;

        function ia(e, t, n) {
            w(ta, t._currentValue), t._currentValue = n
        }

        function aa(e) {
            e._currentValue = ta.current, _e(ta)
        }

        function oa(e, t, n) {
            for (; e !== null;) {
                var r = e.alternate;
                if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
                e = e.return
            }
        }

        function sa(e, t, n, r) {
            var a = e.child;
            for (a !== null && (a.return = e); a !== null;) {
                var o = a.dependencies;
                if (o !== null) {
                    var s = a.child;
                    o = o.firstContext;
                    a: for (; o !== null;) {
                        var c = o;
                        o = a;
                        for (var l = 0; l < t.length; l++)
                            if (c.context === t[l]) {
                                o.lanes |= n, c = o.alternate, c !== null && (c.lanes |= n), oa(o.return, n, e), r || (s = null);
                                break a
                            }
                        o = c.next
                    }
                } else if (a.tag === 18) {
                    if (s = a.return, s === null) throw Error(i(341));
                    s.lanes |= n, o = s.alternate, o !== null && (o.lanes |= n), oa(s, n, e), s = null
                } else s = a.child;
                if (s !== null) s.return = a;
                else
                    for (s = a; s !== null;) {
                        if (s === e) {
                            s = null;
                            break
                        }
                        if (a = s.sibling, a !== null) {
                            a.return = s.return, s = a;
                            break
                        }
                        s = s.return
                    }
                a = s
            }
        }

        function ca(e, t, n, r) {
            e = null;
            for (var a = t, o = !1; a !== null;) {
                if (!o) {
                    if (a.flags & 524288) o = !0;
                    else if (a.flags & 262144) break
                }
                if (a.tag === 10) {
                    var s = a.alternate;
                    if (s === null) throw Error(i(387));
                    if (s = s.memoizedProps, s !== null) {
                        var c = a.type;
                        Nr(a.pendingProps.value, s.value) || (e === null ? e = [c] : e.push(c))
                    }
                } else if (a === xe.current) {
                    if (s = a.alternate, s === null) throw Error(i(387));
                    s.memoizedState.memoizedState !== a.memoizedState.memoizedState && (e === null ? e = [Qf] : e.push(Qf))
                }
                a = a.return
            }
            e !== null && sa(t, e, n, r), t.flags |= 262144
        }

        function la(e) {
            for (e = e.firstContext; e !== null;) {
                if (!Nr(e.context._currentValue, e.memoizedValue)) return !0;
                e = e.next
            }
            return !1
        }

        function ua(e) {
            na = e, ra = null, e = e.dependencies, e !== null && (e.firstContext = null)
        }

        function da(e) {
            return pa(na, e)
        }

        function fa(e, t) {
            return na === null && ua(e), pa(e, t)
        }

        function pa(e, t) {
            var n = t._currentValue;
            if (t = {
                    context: t,
                    memoizedValue: n,
                    next: null
                }, ra === null) {
                if (e === null) throw Error(i(308));
                ra = t, e.dependencies = {
                    lanes: 0,
                    firstContext: t
                }, e.flags |= 524288
            } else ra = ra.next = t;
            return n
        }
        var ma = typeof AbortController < `u` ? AbortController : function() {
                var e = [],
                    t = this.signal = {
                        aborted: !1,
                        addEventListener: function(t, n) {
                            e.push(n)
                        }
                    };
                this.abort = function() {
                    t.aborted = !0, e.forEach(function(e) {
                        return e()
                    })
                }
            },
            ha = t.unstable_scheduleCallback,
            ga = t.unstable_NormalPriority,
            A = {
                $$typeof: x,
                Consumer: null,
                Provider: null,
                _currentValue: null,
                _currentValue2: null,
                _threadCount: 0
            };

        function _a() {
            return {
                controller: new ma,
                data: new Map,
                refCount: 0
            }
        }

        function j(e) {
            e.refCount--, e.refCount === 0 && ha(ga, function() {
                e.controller.abort()
            })
        }
        var va = null,
            ya = 0,
            ba = 0,
            xa = null;

        function Sa(e, t) {
            if (va === null) {
                var n = va = [];
                ya = 0, ba = dd(), xa = {
                    status: `pending`,
                    value: void 0,
                    then: function(e) {
                        n.push(e)
                    }
                }
            }
            return ya++, t.then(Ca, Ca), t
        }

        function Ca() {
            if (--ya === 0 && va !== null) {
                xa !== null && (xa.status = `fulfilled`);
                var e = va;
                va = null, ba = 0, xa = null;
                for (var t = 0; t < e.length; t++)(0, e[t])()
            }
        }

        function wa(e, t) {
            var n = [],
                r = {
                    status: `pending`,
                    value: null,
                    reason: null,
                    then: function(e) {
                        n.push(e)
                    }
                };
            return e.then(function() {
                r.status = `fulfilled`, r.value = t;
                for (var e = 0; e < n.length; e++)(0, n[e])(t)
            }, function(e) {
                for (r.status = `rejected`, r.reason = e, e = 0; e < n.length; e++)(0, n[e])(void 0)
            }), r
        }
        var Ta = S.S;
        S.S = function(e, t) {
            nu = T(), typeof t == `object` && t && typeof t.then == `function` && Sa(e, t), Ta !== null && Ta(e, t)
        };
        var Ea = ge(null);

        function Da() {
            var e = Ea.current;
            return e === null ? W.pooledCache : e
        }

        function Oa(e, t) {
            t === null ? w(Ea, Ea.current) : w(Ea, t.pool)
        }

        function ka() {
            var e = Da();
            return e === null ? null : {
                parent: A._currentValue,
                pool: e
            }
        }
        var Aa = Error(i(460)),
            ja = Error(i(474)),
            Ma = Error(i(542)),
            Na = {
                then: function() {}
            };

        function Pa(e) {
            return e = e.status, e === `fulfilled` || e === `rejected`
        }

        function Fa(e, t, n) {
            switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(dn, dn), t = n), t.status) {
                case `fulfilled`:
                    return t.value;
                case `rejected`:
                    throw e = t.reason, za(e), e;
                default:
                    if (typeof t.status == `string`) t.then(dn, dn);
                    else {
                        if (e = W, e !== null && 100 < e.shellSuspendCounter) throw Error(i(482));
                        e = t, e.status = `pending`, e.then(function(e) {
                            if (t.status === `pending`) {
                                var n = t;
                                n.status = `fulfilled`, n.value = e
                            }
                        }, function(e) {
                            if (t.status === `pending`) {
                                var n = t;
                                n.status = `rejected`, n.reason = e
                            }
                        })
                    }
                    switch (t.status) {
                        case `fulfilled`:
                            return t.value;
                        case `rejected`:
                            throw e = t.reason, za(e), e
                    }
                    throw La = t, Aa
            }
        }

        function Ia(e) {
            try {
                var t = e._init;
                return t(e._payload)
            } catch (e) {
                throw typeof e == `object` && e && typeof e.then == `function` ? (La = e, Aa) : e
            }
        }
        var La = null;

        function Ra() {
            if (La === null) throw Error(i(459));
            var e = La;
            return La = null, e
        }

        function za(e) {
            if (e === Aa || e === Ma) throw Error(i(483))
        }
        var Ba = null,
            Va = 0;

        function Ha(e) {
            var t = Va;
            return Va += 1, Ba === null && (Ba = []), Fa(Ba, e, t)
        }

        function Ua(e, t) {
            t = t.props.ref, e.ref = t === void 0 ? null : t
        }

        function Wa(e, t) {
            throw t.$$typeof === p ? Error(i(525)) : (e = Object.prototype.toString.call(t), Error(i(31, e === `[object Object]` ? `object with keys {` + Object.keys(t).join(`, `) + `}` : e)))
        }

        function Ga(e) {
            function t(t, n) {
                if (e) {
                    var r = t.deletions;
                    r === null ? (t.deletions = [n], t.flags |= 16) : r.push(n)
                }
            }

            function n(n, r) {
                if (!e) return null;
                for (; r !== null;) t(n, r), r = r.sibling;
                return null
            }

            function r(e) {
                for (var t = new Map; e !== null;) e.key === null ? t.set(e.index, e) : t.set(e.key, e), e = e.sibling;
                return t
            }

            function a(e, t) {
                return e = xi(e, t), e.index = 0, e.sibling = null, e
            }

            function o(t, n, r) {
                return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 67108866, n) : (r = r.index, r < n ? (t.flags |= 67108866, n) : r)) : (t.flags |= 1048576, n)
            }

            function s(t) {
                return e && t.alternate === null && (t.flags |= 67108866), t
            }

            function c(e, t, n, r) {
                return t === null || t.tag !== 6 ? (t = Ti(n, e.mode, r), t.return = e, t) : (t = a(t, n), t.return = e, t)
            }

            function l(e, t, n, r) {
                var i = n.type;
                return i === _ ? d(e, t, n.props.children, r, n.key) : t !== null && (t.elementType === i || typeof i == `object` && i && i.$$typeof === ae && Ia(i) === t.type) ? (t = a(t, n.props), Ua(t, n), t.return = e, t) : (t = Ci(n.type, n.key, n.props, null, e.mode, r), Ua(t, n), t.return = e, t)
            }

            function u(e, t, n, r) {
                return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = Di(n, e.mode, r), t.return = e, t) : (t = a(t, n.children || []), t.return = e, t)
            }

            function d(e, t, n, r, i) {
                return t === null || t.tag !== 7 ? (t = wi(n, e.mode, r, i), t.return = e, t) : (t = a(t, n), t.return = e, t)
            }

            function f(e, t, n) {
                if (typeof t == `string` && t !== `` || typeof t == `number` || typeof t == `bigint`) return t = Ti(`` + t, e.mode, n), t.return = e, t;
                if (typeof t == `object` && t) {
                    switch (t.$$typeof) {
                        case m:
                            return n = Ci(t.type, t.key, t.props, null, e.mode, n), Ua(n, t), n.return = e, n;
                        case h:
                            return t = Di(t, e.mode, n), t.return = e, t;
                        case ae:
                            return t = Ia(t), f(e, t, n)
                    }
                    if (fe(t) || le(t)) return t = wi(t, e.mode, n, null), t.return = e, t;
                    if (typeof t.then == `function`) return f(e, Ha(t), n);
                    if (t.$$typeof === x) return f(e, fa(e, t), n);
                    Wa(e, t)
                }
                return null
            }

            function p(e, t, n, r) {
                var i = t === null ? null : t.key;
                if (typeof n == `string` && n !== `` || typeof n == `number` || typeof n == `bigint`) return i === null ? c(e, t, `` + n, r) : null;
                if (typeof n == `object` && n) {
                    switch (n.$$typeof) {
                        case m:
                            return n.key === i ? l(e, t, n, r) : null;
                        case h:
                            return n.key === i ? u(e, t, n, r) : null;
                        case ae:
                            return n = Ia(n), p(e, t, n, r)
                    }
                    if (fe(n) || le(n)) return i === null ? d(e, t, n, r, null) : null;
                    if (typeof n.then == `function`) return p(e, t, Ha(n), r);
                    if (n.$$typeof === x) return p(e, t, fa(e, n), r);
                    Wa(e, n)
                }
                return null
            }

            function g(e, t, n, r, i) {
                if (typeof r == `string` && r !== `` || typeof r == `number` || typeof r == `bigint`) return e = e.get(n) || null, c(t, e, `` + r, i);
                if (typeof r == `object` && r) {
                    switch (r.$$typeof) {
                        case m:
                            return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
                        case h:
                            return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
                        case ae:
                            return r = Ia(r), g(e, t, n, r, i)
                    }
                    if (fe(r) || le(r)) return e = e.get(n) || null, d(t, e, r, i, null);
                    if (typeof r.then == `function`) return g(e, t, n, Ha(r), i);
                    if (r.$$typeof === x) return g(e, t, n, fa(t, r), i);
                    Wa(t, r)
                }
                return null
            }

            function v(i, a, s, c) {
                for (var l = null, u = null, d = a, m = a = 0, h = null; d !== null && m < s.length; m++) {
                    d.index > m ? (h = d, d = null) : h = d.sibling;
                    var _ = p(i, d, s[m], c);
                    if (_ === null) {
                        d === null && (d = h);
                        break
                    }
                    e && d && _.alternate === null && t(i, d), a = o(_, a, m), u === null ? l = _ : u.sibling = _, u = _, d = h
                }
                if (m === s.length) return n(i, d), k && zi(i, m), l;
                if (d === null) {
                    for (; m < s.length; m++) d = f(i, s[m], c), d !== null && (a = o(d, a, m), u === null ? l = d : u.sibling = d, u = d);
                    return k && zi(i, m), l
                }
                for (d = r(d); m < s.length; m++) h = g(d, i, m, s[m], c), h !== null && (e && h.alternate !== null && d.delete(h.key === null ? m : h.key), a = o(h, a, m), u === null ? l = h : u.sibling = h, u = h);
                return e && d.forEach(function(e) {
                    return t(i, e)
                }), k && zi(i, m), l
            }

            function y(a, s, c, l) {
                if (c == null) throw Error(i(151));
                for (var u = null, d = null, m = s, h = s = 0, _ = null, v = c.next(); m !== null && !v.done; h++, v = c.next()) {
                    m.index > h ? (_ = m, m = null) : _ = m.sibling;
                    var y = p(a, m, v.value, l);
                    if (y === null) {
                        m === null && (m = _);
                        break
                    }
                    e && m && y.alternate === null && t(a, m), s = o(y, s, h), d === null ? u = y : d.sibling = y, d = y, m = _
                }
                if (v.done) return n(a, m), k && zi(a, h), u;
                if (m === null) {
                    for (; !v.done; h++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, h), d === null ? u = v : d.sibling = v, d = v);
                    return k && zi(a, h), u
                }
                for (m = r(m); !v.done; h++, v = c.next()) v = g(m, a, h, v.value, l), v !== null && (e && v.alternate !== null && m.delete(v.key === null ? h : v.key), s = o(v, s, h), d === null ? u = v : d.sibling = v, d = v);
                return e && m.forEach(function(e) {
                    return t(a, e)
                }), k && zi(a, h), u
            }

            function b(e, r, o, c) {
                if (typeof o == `object` && o && o.type === _ && o.key === null && (o = o.props.children), typeof o == `object` && o) {
                    switch (o.$$typeof) {
                        case m:
                            a: {
                                for (var l = o.key; r !== null;) {
                                    if (r.key === l) {
                                        if (l = o.type, l === _) {
                                            if (r.tag === 7) {
                                                n(e, r.sibling), c = a(r, o.props.children), c.return = e, e = c;
                                                break a
                                            }
                                        } else if (r.elementType === l || typeof l == `object` && l && l.$$typeof === ae && Ia(l) === r.type) {
                                            n(e, r.sibling), c = a(r, o.props), Ua(c, o), c.return = e, e = c;
                                            break a
                                        }
                                        n(e, r);
                                        break
                                    } else t(e, r);
                                    r = r.sibling
                                }
                                o.type === _ ? (c = wi(o.props.children, e.mode, c, o.key), c.return = e, e = c) : (c = Ci(o.type, o.key, o.props, null, e.mode, c), Ua(c, o), c.return = e, e = c)
                            }
                            return s(e);
                        case h:
                            a: {
                                for (l = o.key; r !== null;) {
                                    if (r.key === l)
                                        if (r.tag === 4 && r.stateNode.containerInfo === o.containerInfo && r.stateNode.implementation === o.implementation) {
                                            n(e, r.sibling), c = a(r, o.children || []), c.return = e, e = c;
                                            break a
                                        } else {
                                            n(e, r);
                                            break
                                        }
                                    else t(e, r);
                                    r = r.sibling
                                }
                                c = Di(o, e.mode, c),
                                c.return = e,
                                e = c
                            }
                            return s(e);
                        case ae:
                            return o = Ia(o), b(e, r, o, c)
                    }
                    if (fe(o)) return v(e, r, o, c);
                    if (le(o)) {
                        if (l = le(o), typeof l != `function`) throw Error(i(150));
                        return o = l.call(o), y(e, r, o, c)
                    }
                    if (typeof o.then == `function`) return b(e, r, Ha(o), c);
                    if (o.$$typeof === x) return b(e, r, fa(e, o), c);
                    Wa(e, o)
                }
                return typeof o == `string` && o !== `` || typeof o == `number` || typeof o == `bigint` ? (o = `` + o, r !== null && r.tag === 6 ? (n(e, r.sibling), c = a(r, o), c.return = e, e = c) : (n(e, r), c = Ti(o, e.mode, c), c.return = e, e = c), s(e)) : n(e, r)
            }
            return function(e, t, n, r) {
                try {
                    Va = 0;
                    var i = b(e, t, n, r);
                    return Ba = null, i
                } catch (t) {
                    if (t === Aa || t === Ma) throw t;
                    var a = yi(29, t, null, e.mode);
                    return a.lanes = r, a.return = e, a
                }
            }
        }
        var Ka = Ga(!0),
            qa = Ga(!1),
            M = !1;

        function Ja(e) {
            e.updateQueue = {
                baseState: e.memoizedState,
                firstBaseUpdate: null,
                lastBaseUpdate: null,
                shared: {
                    pending: null,
                    lanes: 0,
                    hiddenCallbacks: null
                },
                callbacks: null
            }
        }

        function Ya(e, t) {
            e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
                baseState: e.baseState,
                firstBaseUpdate: e.firstBaseUpdate,
                lastBaseUpdate: e.lastBaseUpdate,
                shared: e.shared,
                callbacks: null
            })
        }

        function Xa(e) {
            return {
                lane: e,
                tag: 0,
                payload: null,
                callback: null,
                next: null
            }
        }

        function Za(e, t, n) {
            var r = e.updateQueue;
            if (r === null) return null;
            if (r = r.shared, U & 2) {
                var i = r.pending;
                return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = gi(e), hi(e, null, n), t
            }
            return fi(e, r, t, n), gi(e)
        }

        function Qa(e, t, n) {
            if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
                var r = t.lanes;
                r &= e.pendingLanes, n |= r, t.lanes = n, dt(e, n)
            }
        }

        function $a(e, t) {
            var n = e.updateQueue,
                r = e.alternate;
            if (r !== null && (r = r.updateQueue, n === r)) {
                var i = null,
                    a = null;
                if (n = n.firstBaseUpdate, n !== null) {
                    do {
                        var o = {
                            lane: n.lane,
                            tag: n.tag,
                            payload: n.payload,
                            callback: null,
                            next: null
                        };
                        a === null ? i = a = o : a = a.next = o, n = n.next
                    } while (n !== null);
                    a === null ? i = a = t : a = a.next = t
                } else i = a = t;
                n = {
                    baseState: r.baseState,
                    firstBaseUpdate: i,
                    lastBaseUpdate: a,
                    shared: r.shared,
                    callbacks: r.callbacks
                }, e.updateQueue = n;
                return
            }
            e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t
        }
        var eo = !1;

        function to() {
            if (eo) {
                var e = xa;
                if (e !== null) throw e
            }
        }

        function no(e, t, n, r) {
            eo = !1;
            var i = e.updateQueue;
            M = !1;
            var a = i.firstBaseUpdate,
                o = i.lastBaseUpdate,
                s = i.shared.pending;
            if (s !== null) {
                i.shared.pending = null;
                var c = s,
                    l = c.next;
                c.next = null, o === null ? a = l : o.next = l, o = c;
                var u = e.alternate;
                u !== null && (u = u.updateQueue, s = u.lastBaseUpdate, s !== o && (s === null ? u.firstBaseUpdate = l : s.next = l, u.lastBaseUpdate = c))
            }
            if (a !== null) {
                var d = i.baseState;
                o = 0, u = l = c = null, s = a;
                do {
                    var p = s.lane & -536870913,
                        m = p !== s.lane;
                    if (m ? (K & p) === p : (r & p) === p) {
                        p !== 0 && p === ba && (eo = !0), u !== null && (u = u.next = {
                            lane: 0,
                            tag: s.tag,
                            payload: s.payload,
                            callback: null,
                            next: null
                        });
                        a: {
                            var h = e,
                                g = s;p = t;
                            var _ = n;
                            switch (g.tag) {
                                case 1:
                                    if (h = g.payload, typeof h == `function`) {
                                        d = h.call(_, d, p);
                                        break a
                                    }
                                    d = h;
                                    break a;
                                case 3:
                                    h.flags = h.flags & -65537 | 128;
                                case 0:
                                    if (h = g.payload, p = typeof h == `function` ? h.call(_, d, p) : h, p == null) break a;
                                    d = f({}, d, p);
                                    break a;
                                case 2:
                                    M = !0
                            }
                        }
                        p = s.callback, p !== null && (e.flags |= 64, m && (e.flags |= 8192), m = i.callbacks, m === null ? i.callbacks = [p] : m.push(p))
                    } else m = {
                        lane: p,
                        tag: s.tag,
                        payload: s.payload,
                        callback: s.callback,
                        next: null
                    }, u === null ? (l = u = m, c = d) : u = u.next = m, o |= p;
                    if (s = s.next, s === null) {
                        if (s = i.shared.pending, s === null) break;
                        m = s, s = m.next, m.next = null, i.lastBaseUpdate = m, i.shared.pending = null
                    }
                } while (1);
                u === null && (c = d), i.baseState = c, i.firstBaseUpdate = l, i.lastBaseUpdate = u, a === null && (i.shared.lanes = 0), ql |= o, e.lanes = o, e.memoizedState = d
            }
        }

        function ro(e, t) {
            if (typeof e != `function`) throw Error(i(191, e));
            e.call(t)
        }

        function io(e, t) {
            var n = e.callbacks;
            if (n !== null)
                for (e.callbacks = null, e = 0; e < n.length; e++) ro(n[e], t)
        }
        var ao = ge(null),
            oo = ge(0);

        function so(e, t) {
            e = Kl, w(oo, e), w(ao, t), Kl = e | t.baseLanes
        }

        function co() {
            w(oo, Kl), w(ao, ao.current)
        }

        function lo() {
            Kl = oo.current, _e(ao), _e(oo)
        }
        var uo = ge(null),
            fo = null;

        function po(e) {
            var t = e.alternate;
            w(N, N.current & 1), w(uo, e), fo === null && (t === null || ao.current !== null || t.memoizedState !== null) && (fo = e)
        }

        function mo(e) {
            w(N, N.current), w(uo, e), fo === null && (fo = e)
        }

        function ho(e) {
            e.tag === 22 ? (w(N, N.current), w(uo, e), fo === null && (fo = e)) : go(e)
        }

        function go() {
            w(N, N.current), w(uo, uo.current)
        }

        function _o(e) {
            _e(uo), fo === e && (fo = null), _e(N)
        }
        var N = ge(0);

        function vo(e) {
            for (var t = e; t !== null;) {
                if (t.tag === 13) {
                    var n = t.memoizedState;
                    if (n !== null && (n = n.dehydrated, n === null || af(n) || of (n))) return t
                } else if (t.tag === 19 && (t.memoizedProps.revealOrder === `forwards` || t.memoizedProps.revealOrder === `backwards` || t.memoizedProps.revealOrder === `unstable_legacy-backwards` || t.memoizedProps.revealOrder === `together`)) {
                    if (t.flags & 128) return t
                } else if (t.child !== null) {
                    t.child.return = t, t = t.child;
                    continue
                }
                if (t === e) break;
                for (; t.sibling === null;) {
                    if (t.return === null || t.return === e) return null;
                    t = t.return
                }
                t.sibling.return = t.return, t = t.sibling
            }
            return null
        }
        var yo = 0,
            P = null,
            F = null,
            I = null,
            bo = !1,
            xo = !1,
            So = !1,
            Co = 0,
            wo = 0,
            To = null,
            Eo = 0;

        function L() {
            throw Error(i(321))
        }

        function Do(e, t) {
            if (t === null) return !1;
            for (var n = 0; n < t.length && n < e.length; n++)
                if (!Nr(e[n], t[n])) return !1;
            return !0
        }

        function Oo(e, t, n, r, i, a) {
            return yo = a, P = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, S.H = e === null || e.memoizedState === null ? Ws : Gs, So = !1, a = n(r, i), So = !1, xo && (a = Ao(t, n, r, i)), ko(e), a
        }

        function ko(e) {
            S.H = Us;
            var t = F !== null && F.next !== null;
            if (yo = 0, I = F = P = null, bo = !1, wo = 0, To = null, t) throw Error(i(300));
            e === null || z || (e = e.dependencies, e !== null && la(e) && (z = !0))
        }

        function Ao(e, t, n, r) {
            P = e;
            var a = 0;
            do {
                if (xo && (To = null), wo = 0, xo = !1, 25 <= a) throw Error(i(301));
                if (a += 1, I = F = null, e.updateQueue != null) {
                    var o = e.updateQueue;
                    o.lastEffect = null, o.events = null, o.stores = null, o.memoCache != null && (o.memoCache.index = 0)
                }
                S.H = Ks, o = t(n, r)
            } while (xo);
            return o
        }

        function jo() {
            var e = S.H,
                t = e.useState()[0];
            return t = typeof t.then == `function` ? Lo(t) : t, e = e.useState()[0], (F === null ? null : F.memoizedState) !== e && (P.flags |= 1024), t
        }

        function Mo() {
            var e = Co !== 0;
            return Co = 0, e
        }

        function No(e, t, n) {
            t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~n
        }

        function Po(e) {
            if (bo) {
                for (e = e.memoizedState; e !== null;) {
                    var t = e.queue;
                    t !== null && (t.pending = null), e = e.next
                }
                bo = !1
            }
            yo = 0, I = F = P = null, xo = !1, wo = Co = 0, To = null
        }

        function Fo() {
            var e = {
                memoizedState: null,
                baseState: null,
                baseQueue: null,
                queue: null,
                next: null
            };
            return I === null ? P.memoizedState = I = e : I = I.next = e, I
        }

        function R() {
            if (F === null) {
                var e = P.alternate;
                e = e === null ? null : e.memoizedState
            } else e = F.next;
            var t = I === null ? P.memoizedState : I.next;
            if (t !== null) I = t, F = e;
            else {
                if (e === null) throw P.alternate === null ? Error(i(467)) : Error(i(310));
                F = e, e = {
                    memoizedState: F.memoizedState,
                    baseState: F.baseState,
                    baseQueue: F.baseQueue,
                    queue: F.queue,
                    next: null
                }, I === null ? P.memoizedState = I = e : I = I.next = e
            }
            return I
        }

        function Io() {
            return {
                lastEffect: null,
                events: null,
                stores: null,
                memoCache: null
            }
        }

        function Lo(e) {
            var t = wo;
            return wo += 1, To === null && (To = []), e = Fa(To, e, t), t = P, (I === null ? t.memoizedState : I.next) === null && (t = t.alternate, S.H = t === null || t.memoizedState === null ? Ws : Gs), e
        }

        function Ro(e) {
            if (typeof e == `object` && e) {
                if (typeof e.then == `function`) return Lo(e);
                if (e.$$typeof === x) return da(e)
            }
            throw Error(i(438, String(e)))
        }

        function zo(e) {
            var t = null,
                n = P.updateQueue;
            if (n !== null && (t = n.memoCache), t == null) {
                var r = P.alternate;
                r !== null && (r = r.updateQueue, r !== null && (r = r.memoCache, r != null && (t = {
                    data: r.data.map(function(e) {
                        return e.slice()
                    }),
                    index: 0
                })))
            }
            if (t ? ? = {
                    data: [],
                    index: 0
                }, n === null && (n = Io(), P.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0)
                for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = se;
            return t.index++, n
        }

        function Bo(e, t) {
            return typeof t == `function` ? t(e) : t
        }

        function Vo(e) {
            return Ho(R(), F, e)
        }

        function Ho(e, t, n) {
            var r = e.queue;
            if (r === null) throw Error(i(311));
            r.lastRenderedReducer = n;
            var a = e.baseQueue,
                o = r.pending;
            if (o !== null) {
                if (a !== null) {
                    var s = a.next;
                    a.next = o.next, o.next = s
                }
                t.baseQueue = a = o, r.pending = null
            }
            if (o = e.baseState, a === null) e.memoizedState = o;
            else {
                t = a.next;
                var c = s = null,
                    l = null,
                    u = t,
                    d = !1;
                do {
                    var f = u.lane & -536870913;
                    if (f === u.lane ? (yo & f) === f : (K & f) === f) {
                        var p = u.revertLane;
                        if (p === 0) l !== null && (l = l.next = {
                            lane: 0,
                            revertLane: 0,
                            gesture: null,
                            action: u.action,
                            hasEagerState: u.hasEagerState,
                            eagerState: u.eagerState,
                            next: null
                        }), f === ba && (d = !0);
                        else if ((yo & p) === p) {
                            u = u.next, p === ba && (d = !0);
                            continue
                        } else f = {
                            lane: 0,
                            revertLane: u.revertLane,
                            gesture: null,
                            action: u.action,
                            hasEagerState: u.hasEagerState,
                            eagerState: u.eagerState,
                            next: null
                        }, l === null ? (c = l = f, s = o) : l = l.next = f, P.lanes |= p, ql |= p;
                        f = u.action, So && n(o, f), o = u.hasEagerState ? u.eagerState : n(o, f)
                    } else p = {
                        lane: f,
                        revertLane: u.revertLane,
                        gesture: u.gesture,
                        action: u.action,
                        hasEagerState: u.hasEagerState,
                        eagerState: u.eagerState,
                        next: null
                    }, l === null ? (c = l = p, s = o) : l = l.next = p, P.lanes |= f, ql |= f;
                    u = u.next
                } while (u !== null && u !== t);
                if (l === null ? s = o : l.next = c, !Nr(o, e.memoizedState) && (z = !0, d && (n = xa, n !== null))) throw n;
                e.memoizedState = o, e.baseState = s, e.baseQueue = l, r.lastRenderedState = o
            }
            return a === null && (r.lanes = 0), [e.memoizedState, r.dispatch]
        }

        function Uo(e) {
            var t = R(),
                n = t.queue;
            if (n === null) throw Error(i(311));
            n.lastRenderedReducer = e;
            var r = n.dispatch,
                a = n.pending,
                o = t.memoizedState;
            if (a !== null) {
                n.pending = null;
                var s = a = a.next;
                do o = e(o, s.action), s = s.next; while (s !== a);
                Nr(o, t.memoizedState) || (z = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o
            }
            return [o, r]
        }

        function Wo(e, t, n) {
            var r = P,
                a = R(),
                o = k;
            if (o) {
                if (n === void 0) throw Error(i(407));
                n = n()
            } else n = t();
            var s = !Nr((F || a).memoizedState, n);
            if (s && (a.memoizedState = n, z = !0), a = a.queue, hs(qo.bind(null, r, a, e), [e]), a.getSnapshot !== t || s || I !== null && I.memoizedState.tag & 1) {
                if (r.flags |= 2048, us(9, {
                        destroy: void 0
                    }, Ko.bind(null, r, a, n, t), null), W === null) throw Error(i(349));
                o || yo & 127 || Go(r, t, n)
            }
            return n
        }

        function Go(e, t, n) {
            e.flags |= 16384, e = {
                getSnapshot: t,
                value: n
            }, t = P.updateQueue, t === null ? (t = Io(), P.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e))
        }

        function Ko(e, t, n, r) {
            t.value = n, t.getSnapshot = r, Jo(t) && Yo(e)
        }

        function qo(e, t, n) {
            return n(function() {
                Jo(t) && Yo(e)
            })
        }

        function Jo(e) {
            var t = e.getSnapshot;
            e = e.value;
            try {
                var n = t();
                return !Nr(e, n)
            } catch {
                return !0
            }
        }

        function Yo(e) {
            var t = mi(e, 2);
            t !== null && gu(t, e, 2)
        }

        function Xo(e) {
            var t = Fo();
            if (typeof e == `function`) {
                var n = e;
                if (e = n(), So) {
                    Je(!0);
                    try {
                        n()
                    } finally {
                        Je(!1)
                    }
                }
            }
            return t.memoizedState = t.baseState = e, t.queue = {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: Bo,
                lastRenderedState: e
            }, t
        }

        function Zo(e, t, n, r) {
            return e.baseState = n, Ho(e, F, typeof r == `function` ? r : Bo)
        }

        function Qo(e, t, n, r, a) {
            if (Bs(e)) throw Error(i(485));
            if (e = t.action, e !== null) {
                var o = {
                    payload: a,
                    action: e,
                    next: null,
                    isTransition: !0,
                    status: `pending`,
                    value: null,
                    reason: null,
                    listeners: [],
                    then: function(e) {
                        o.listeners.push(e)
                    }
                };
                S.T === null ? o.isTransition = !1 : n(!0), r(o), n = t.pending, n === null ? (o.next = t.pending = o, $o(t, o)) : (o.next = n.next, t.pending = n.next = o)
            }
        }

        function $o(e, t) {
            var n = t.action,
                r = t.payload,
                i = e.state;
            if (t.isTransition) {
                var a = S.T,
                    o = {};
                S.T = o;
                try {
                    var s = n(i, r),
                        c = S.S;
                    c !== null && c(o, s), es(e, t, s)
                } catch (n) {
                    ns(e, t, n)
                } finally {
                    a !== null && o.types !== null && (a.types = o.types), S.T = a
                }
            } else try {
                a = n(i, r), es(e, t, a)
            } catch (n) {
                ns(e, t, n)
            }
        }

        function es(e, t, n) {
            typeof n == `object` && n && typeof n.then == `function` ? n.then(function(n) {
                ts(e, t, n)
            }, function(n) {
                return ns(e, t, n)
            }) : ts(e, t, n)
        }

        function ts(e, t, n) {
            t.status = `fulfilled`, t.value = n, rs(t), e.state = n, t = e.pending, t !== null && (n = t.next, n === t ? e.pending = null : (n = n.next, t.next = n, $o(e, n)))
        }

        function ns(e, t, n) {
            var r = e.pending;
            if (e.pending = null, r !== null) {
                r = r.next;
                do t.status = `rejected`, t.reason = n, rs(t), t = t.next; while (t !== r)
            }
            e.action = null
        }

        function rs(e) {
            e = e.listeners;
            for (var t = 0; t < e.length; t++)(0, e[t])()
        }

        function is(e, t) {
            return t
        }

        function as(e, t) {
            if (k) {
                var n = W.formState;
                if (n !== null) {
                    a: {
                        var r = P;
                        if (k) {
                            if (O) {
                                b: {
                                    for (var i = O, a = Ki; i.nodeType !== 8;) {
                                        if (!a) {
                                            i = null;
                                            break b
                                        }
                                        if (i = cf(i.nextSibling), i === null) {
                                            i = null;
                                            break b
                                        }
                                    }
                                    a = i.data,
                                    i = a === `F!` || a === `F` ? i : null
                                }
                                if (i) {
                                    O = cf(i.nextSibling), r = i.data === `F!`;
                                    break a
                                }
                            }
                            Ji(r)
                        }
                        r = !1
                    }
                    r && (t = n[0])
                }
            }
            return n = Fo(), n.memoizedState = n.baseState = t, r = {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: is,
                lastRenderedState: t
            }, n.queue = r, n = Ls.bind(null, P, r), r.dispatch = n, r = Xo(!1), a = zs.bind(null, P, !1, r.queue), r = Fo(), i = {
                state: t,
                dispatch: null,
                action: e,
                pending: null
            }, r.queue = i, n = Qo.bind(null, P, i, a, n), i.dispatch = n, r.memoizedState = e, [t, n, !1]
        }

        function os(e) {
            return ss(R(), F, e)
        }

        function ss(e, t, n) {
            if (t = Ho(e, t, is)[0], e = Vo(Bo)[0], typeof t == `object` && t && typeof t.then == `function`) try {
                var r = Lo(t)
            } catch (e) {
                throw e === Aa ? Ma : e
            } else r = t;
            t = R();
            var i = t.queue,
                a = i.dispatch;
            return n !== t.memoizedState && (P.flags |= 2048, us(9, {
                destroy: void 0
            }, cs.bind(null, i, n), null)), [r, a, e]
        }

        function cs(e, t) {
            e.action = t
        }

        function ls(e) {
            var t = R(),
                n = F;
            if (n !== null) return ss(t, n, e);
            R(), t = t.memoizedState, n = R();
            var r = n.queue.dispatch;
            return n.memoizedState = e, [t, r, !1]
        }

        function us(e, t, n, r) {
            return e = {
                tag: e,
                create: n,
                deps: r,
                inst: t,
                next: null
            }, t = P.updateQueue, t === null && (t = Io(), P.updateQueue = t), n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e
        }

        function ds() {
            return R().memoizedState
        }

        function fs(e, t, n, r) {
            var i = Fo();
            P.flags |= e, i.memoizedState = us(1 | t, {
                destroy: void 0
            }, n, r === void 0 ? null : r)
        }

        function ps(e, t, n, r) {
            var i = R();
            r = r === void 0 ? null : r;
            var a = i.memoizedState.inst;
            F !== null && r !== null && Do(r, F.memoizedState.deps) ? i.memoizedState = us(t, a, n, r) : (P.flags |= e, i.memoizedState = us(1 | t, a, n, r))
        }

        function ms(e, t) {
            fs(8390656, 8, e, t)
        }

        function hs(e, t) {
            ps(2048, 8, e, t)
        }

        function gs(e) {
            P.flags |= 4;
            var t = P.updateQueue;
            if (t === null) t = Io(), P.updateQueue = t, t.events = [e];
            else {
                var n = t.events;
                n === null ? t.events = [e] : n.push(e)
            }
        }

        function _s(e) {
            var t = R().memoizedState;
            return gs({
                    ref: t,
                    nextImpl: e
                }),
                function() {
                    if (U & 2) throw Error(i(440));
                    return t.impl.apply(void 0, arguments)
                }
        }

        function vs(e, t) {
            return ps(4, 2, e, t)
        }

        function ys(e, t) {
            return ps(4, 4, e, t)
        }

        function bs(e, t) {
            if (typeof t == `function`) {
                e = e();
                var n = t(e);
                return function() {
                    typeof n == `function` ? n() : t(null)
                }
            }
            if (t != null) return e = e(), t.current = e,
                function() {
                    t.current = null
                }
        }

        function xs(e, t, n) {
            n = n == null ? null : n.concat([e]), ps(4, 4, bs.bind(null, t, e), n)
        }

        function Ss() {}

        function Cs(e, t) {
            var n = R();
            t = t === void 0 ? null : t;
            var r = n.memoizedState;
            return t !== null && Do(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e)
        }

        function ws(e, t) {
            var n = R();
            t = t === void 0 ? null : t;
            var r = n.memoizedState;
            if (t !== null && Do(t, r[1])) return r[0];
            if (r = e(), So) {
                Je(!0);
                try {
                    e()
                } finally {
                    Je(!1)
                }
            }
            return n.memoizedState = [r, t], r
        }

        function Ts(e, t, n) {
            return n === void 0 || yo & 1073741824 && !(K & 261930) ? e.memoizedState = t : (e.memoizedState = n, e = hu(), P.lanes |= e, ql |= e, n)
        }

        function Es(e, t, n, r) {
            return Nr(n, t) ? n : ao.current === null ? !(yo & 42) || yo & 1073741824 && !(K & 261930) ? (z = !0, e.memoizedState = n) : (e = hu(), P.lanes |= e, ql |= e, t) : (e = Ts(e, n, r), Nr(e, t) || (z = !0), e)
        }

        function Ds(e, t, n, r, i) {
            var a = C.p;
            C.p = a !== 0 && 8 > a ? a : 8;
            var o = S.T,
                s = {};
            S.T = s, zs(e, !1, t, n);
            try {
                var c = i(),
                    l = S.S;
                l !== null && l(s, c), typeof c == `object` && c && typeof c.then == `function` ? Rs(e, t, wa(c, r), mu(e)) : Rs(e, t, r, mu(e))
            } catch (n) {
                Rs(e, t, {
                    then: function() {},
                    status: `rejected`,
                    reason: n
                }, mu())
            } finally {
                C.p = a, o !== null && s.types !== null && (o.types = s.types), S.T = o
            }
        }

        function Os() {}

        function ks(e, t, n, r) {
            if (e.tag !== 5) throw Error(i(476));
            var a = As(e).queue;
            Ds(e, a, t, pe, n === null ? Os : function() {
                return js(e), n(r)
            })
        }

        function As(e) {
            var t = e.memoizedState;
            if (t !== null) return t;
            t = {
                memoizedState: pe,
                baseState: pe,
                baseQueue: null,
                queue: {
                    pending: null,
                    lanes: 0,
                    dispatch: null,
                    lastRenderedReducer: Bo,
                    lastRenderedState: pe
                },
                next: null
            };
            var n = {};
            return t.next = {
                memoizedState: n,
                baseState: n,
                baseQueue: null,
                queue: {
                    pending: null,
                    lanes: 0,
                    dispatch: null,
                    lastRenderedReducer: Bo,
                    lastRenderedState: n
                },
                next: null
            }, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t
        }

        function js(e) {
            var t = As(e);
            t.next === null && (t = e.alternate.memoizedState), Rs(e, t.next.queue, {}, mu())
        }

        function Ms() {
            return da(Qf)
        }

        function Ns() {
            return R().memoizedState
        }

        function Ps() {
            return R().memoizedState
        }

        function Fs(e) {
            for (var t = e.return; t !== null;) {
                switch (t.tag) {
                    case 24:
                    case 3:
                        var n = mu();
                        e = Xa(n);
                        var r = Za(t, e, n);
                        r !== null && (gu(r, t, n), Qa(r, t, n)), t = {
                            cache: _a()
                        }, e.payload = t;
                        return
                }
                t = t.return
            }
        }

        function Is(e, t, n) {
            var r = mu();
            n = {
                lane: r,
                revertLane: 0,
                gesture: null,
                action: n,
                hasEagerState: !1,
                eagerState: null,
                next: null
            }, Bs(e) ? Vs(t, n) : (n = pi(e, t, n, r), n !== null && (gu(n, e, r), Hs(n, t, r)))
        }

        function Ls(e, t, n) {
            Rs(e, t, n, mu())
        }

        function Rs(e, t, n, r) {
            var i = {
                lane: r,
                revertLane: 0,
                gesture: null,
                action: n,
                hasEagerState: !1,
                eagerState: null,
                next: null
            };
            if (Bs(e)) Vs(t, i);
            else {
                var a = e.alternate;
                if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
                    var o = t.lastRenderedState,
                        s = a(o, n);
                    if (i.hasEagerState = !0, i.eagerState = s, Nr(s, o)) return fi(e, t, i, 0), W === null && di(), !1
                } catch {}
                if (n = pi(e, t, i, r), n !== null) return gu(n, e, r), Hs(n, t, r), !0
            }
            return !1
        }

        function zs(e, t, n, r) {
            if (r = {
                    lane: 2,
                    revertLane: dd(),
                    gesture: null,
                    action: r,
                    hasEagerState: !1,
                    eagerState: null,
                    next: null
                }, Bs(e)) {
                if (t) throw Error(i(479))
            } else t = pi(e, n, r, 2), t !== null && gu(t, e, 2)
        }

        function Bs(e) {
            var t = e.alternate;
            return e === P || t !== null && t === P
        }

        function Vs(e, t) {
            xo = bo = !0;
            var n = e.pending;
            n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t
        }

        function Hs(e, t, n) {
            if (n & 4194048) {
                var r = t.lanes;
                r &= e.pendingLanes, n |= r, t.lanes = n, dt(e, n)
            }
        }
        var Us = {
            readContext: da,
            use: Ro,
            useCallback: L,
            useContext: L,
            useEffect: L,
            useImperativeHandle: L,
            useLayoutEffect: L,
            useInsertionEffect: L,
            useMemo: L,
            useReducer: L,
            useRef: L,
            useState: L,
            useDebugValue: L,
            useDeferredValue: L,
            useTransition: L,
            useSyncExternalStore: L,
            useId: L,
            useHostTransitionStatus: L,
            useFormState: L,
            useActionState: L,
            useOptimistic: L,
            useMemoCache: L,
            useCacheRefresh: L
        };
        Us.useEffectEvent = L;
        var Ws = {
                readContext: da,
                use: Ro,
                useCallback: function(e, t) {
                    return Fo().memoizedState = [e, t === void 0 ? null : t], e
                },
                useContext: da,
                useEffect: ms,
                useImperativeHandle: function(e, t, n) {
                    n = n == null ? null : n.concat([e]), fs(4194308, 4, bs.bind(null, t, e), n)
                },
                useLayoutEffect: function(e, t) {
                    return fs(4194308, 4, e, t)
                },
                useInsertionEffect: function(e, t) {
                    fs(4, 2, e, t)
                },
                useMemo: function(e, t) {
                    var n = Fo();
                    t = t === void 0 ? null : t;
                    var r = e();
                    if (So) {
                        Je(!0);
                        try {
                            e()
                        } finally {
                            Je(!1)
                        }
                    }
                    return n.memoizedState = [r, t], r
                },
                useReducer: function(e, t, n) {
                    var r = Fo();
                    if (n !== void 0) {
                        var i = n(t);
                        if (So) {
                            Je(!0);
                            try {
                                n(t)
                            } finally {
                                Je(!1)
                            }
                        }
                    } else i = t;
                    return r.memoizedState = r.baseState = i, e = {
                        pending: null,
                        lanes: 0,
                        dispatch: null,
                        lastRenderedReducer: e,
                        lastRenderedState: i
                    }, r.queue = e, e = e.dispatch = Is.bind(null, P, e), [r.memoizedState, e]
                },
                useRef: function(e) {
                    var t = Fo();
                    return e = {
                        current: e
                    }, t.memoizedState = e
                },
                useState: function(e) {
                    e = Xo(e);
                    var t = e.queue,
                        n = Ls.bind(null, P, t);
                    return t.dispatch = n, [e.memoizedState, n]
                },
                useDebugValue: Ss,
                useDeferredValue: function(e, t) {
                    return Ts(Fo(), e, t)
                },
                useTransition: function() {
                    var e = Xo(!1);
                    return e = Ds.bind(null, P, e.queue, !0, !1), Fo().memoizedState = e, [!1, e]
                },
                useSyncExternalStore: function(e, t, n) {
                    var r = P,
                        a = Fo();
                    if (k) {
                        if (n === void 0) throw Error(i(407));
                        n = n()
                    } else {
                        if (n = t(), W === null) throw Error(i(349));
                        K & 127 || Go(r, t, n)
                    }
                    a.memoizedState = n;
                    var o = {
                        value: n,
                        getSnapshot: t
                    };
                    return a.queue = o, ms(qo.bind(null, r, o, e), [e]), r.flags |= 2048, us(9, {
                        destroy: void 0
                    }, Ko.bind(null, r, o, n, t), null), n
                },
                useId: function() {
                    var e = Fo(),
                        t = W.identifierPrefix;
                    if (k) {
                        var n = Ri,
                            r = Li;
                        n = (r & ~(1 << 32 - Ye(r) - 1)).toString(32) + n, t = `_` + t + `R_` + n, n = Co++, 0 < n && (t += `H` + n.toString(32)), t += `_`
                    } else n = Eo++, t = `_` + t + `r_` + n.toString(32) + `_`;
                    return e.memoizedState = t
                },
                useHostTransitionStatus: Ms,
                useFormState: as,
                useActionState: as,
                useOptimistic: function(e) {
                    var t = Fo();
                    t.memoizedState = t.baseState = e;
                    var n = {
                        pending: null,
                        lanes: 0,
                        dispatch: null,
                        lastRenderedReducer: null,
                        lastRenderedState: null
                    };
                    return t.queue = n, t = zs.bind(null, P, !0, n), n.dispatch = t, [e, t]
                },
                useMemoCache: zo,
                useCacheRefresh: function() {
                    return Fo().memoizedState = Fs.bind(null, P)
                },
                useEffectEvent: function(e) {
                    var t = Fo(),
                        n = {
                            impl: e
                        };
                    return t.memoizedState = n,
                        function() {
                            if (U & 2) throw Error(i(440));
                            return n.impl.apply(void 0, arguments)
                        }
                }
            },
            Gs = {
                readContext: da,
                use: Ro,
                useCallback: Cs,
                useContext: da,
                useEffect: hs,
                useImperativeHandle: xs,
                useInsertionEffect: vs,
                useLayoutEffect: ys,
                useMemo: ws,
                useReducer: Vo,
                useRef: ds,
                useState: function() {
                    return Vo(Bo)
                },
                useDebugValue: Ss,
                useDeferredValue: function(e, t) {
                    return Es(R(), F.memoizedState, e, t)
                },
                useTransition: function() {
                    var e = Vo(Bo)[0],
                        t = R().memoizedState;
                    return [typeof e == `boolean` ? e : Lo(e), t]
                },
                useSyncExternalStore: Wo,
                useId: Ns,
                useHostTransitionStatus: Ms,
                useFormState: os,
                useActionState: os,
                useOptimistic: function(e, t) {
                    return Zo(R(), F, e, t)
                },
                useMemoCache: zo,
                useCacheRefresh: Ps
            };
        Gs.useEffectEvent = _s;
        var Ks = {
            readContext: da,
            use: Ro,
            useCallback: Cs,
            useContext: da,
            useEffect: hs,
            useImperativeHandle: xs,
            useInsertionEffect: vs,
            useLayoutEffect: ys,
            useMemo: ws,
            useReducer: Uo,
            useRef: ds,
            useState: function() {
                return Uo(Bo)
            },
            useDebugValue: Ss,
            useDeferredValue: function(e, t) {
                var n = R();
                return F === null ? Ts(n, e, t) : Es(n, F.memoizedState, e, t)
            },
            useTransition: function() {
                var e = Uo(Bo)[0],
                    t = R().memoizedState;
                return [typeof e == `boolean` ? e : Lo(e), t]
            },
            useSyncExternalStore: Wo,
            useId: Ns,
            useHostTransitionStatus: Ms,
            useFormState: ls,
            useActionState: ls,
            useOptimistic: function(e, t) {
                var n = R();
                return F === null ? (n.baseState = e, [e, n.queue.dispatch]) : Zo(n, F, e, t)
            },
            useMemoCache: zo,
            useCacheRefresh: Ps
        };
        Ks.useEffectEvent = _s;

        function qs(e, t, n, r) {
            t = e.memoizedState, n = n(r, t), n = n == null ? t : f({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n)
        }
        var Js = {
            enqueueSetState: function(e, t, n) {
                e = e._reactInternals;
                var r = mu(),
                    i = Xa(r);
                i.payload = t, n != null && (i.callback = n), t = Za(e, i, r), t !== null && (gu(t, e, r), Qa(t, e, r))
            },
            enqueueReplaceState: function(e, t, n) {
                e = e._reactInternals;
                var r = mu(),
                    i = Xa(r);
                i.tag = 1, i.payload = t, n != null && (i.callback = n), t = Za(e, i, r), t !== null && (gu(t, e, r), Qa(t, e, r))
            },
            enqueueForceUpdate: function(e, t) {
                e = e._reactInternals;
                var n = mu(),
                    r = Xa(n);
                r.tag = 2, t != null && (r.callback = t), t = Za(e, r, n), t !== null && (gu(t, e, n), Qa(t, e, n))
            }
        };

        function Ys(e, t, n, r, i, a, o) {
            return e = e.stateNode, typeof e.shouldComponentUpdate == `function` ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Pr(n, r) || !Pr(i, a) : !0
        }

        function Xs(e, t, n, r) {
            e = t.state, typeof t.componentWillReceiveProps == `function` && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == `function` && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Js.enqueueReplaceState(t, t.state, null)
        }

        function Zs(e, t) {
            var n = t;
            if (`ref` in t)
                for (var r in n = {}, t) r !== `ref` && (n[r] = t[r]);
            if (e = e.defaultProps)
                for (var i in n === t && (n = f({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
            return n
        }

        function Qs(e) {
            si(e)
        }

        function $s(e) {}

        function ec(e) {
            si(e)
        }

        function tc(e, t) {
            try {
                var n = e.onUncaughtError;
                n(t.value, {
                    componentStack: t.stack
                })
            } catch (e) {
                setTimeout(function() {
                    throw e
                })
            }
        }

        function nc(e, t, n) {
            try {
                var r = e.onCaughtError;
                r(n.value, {
                    componentStack: n.stack,
                    errorBoundary: t.tag === 1 ? t.stateNode : null
                })
            } catch (e) {
                setTimeout(function() {
                    throw e
                })
            }
        }

        function rc(e, t, n) {
            return n = Xa(n), n.tag = 3, n.payload = {
                element: null
            }, n.callback = function() {
                tc(e, t)
            }, n
        }

        function ic(e) {
            return e = Xa(e), e.tag = 3, e
        }

        function ac(e, t, n, r) {
            var i = n.type.getDerivedStateFromError;
            if (typeof i == `function`) {
                var a = r.value;
                e.payload = function() {
                    return i(a)
                }, e.callback = function() {
                    nc(t, n, r)
                }
            }
            var o = n.stateNode;
            o !== null && typeof o.componentDidCatch == `function` && (e.callback = function() {
                nc(t, n, r), typeof i != `function` && (au === null ? au = new Set([this]) : au.add(this));
                var e = r.stack;
                this.componentDidCatch(r.value, {
                    componentStack: e === null ? `` : e
                })
            })
        }

        function oc(e, t, n, r, a) {
            if (n.flags |= 32768, typeof r == `object` && r && typeof r.then == `function`) {
                if (t = n.alternate, t !== null && ca(t, n, a, !0), n = uo.current, n !== null) {
                    switch (n.tag) {
                        case 31:
                        case 13:
                            return fo === null ? Ou() : n.alternate === null && J === 0 && (J = 3), n.flags &= -257, n.flags |= 65536, n.lanes = a, r === Na ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = new Set([r]) : t.add(r), Ku(e, r, a)), !1;
                        case 22:
                            return n.flags |= 65536, r === Na ? n.flags |= 16384 : (t = n.updateQueue, t === null ? (t = {
                                transitions: null,
                                markerInstances: null,
                                retryQueue: new Set([r])
                            }, n.updateQueue = t) : (n = t.retryQueue, n === null ? t.retryQueue = new Set([r]) : n.add(r)), Ku(e, r, a)), !1
                    }
                    throw Error(i(435, n.tag))
                }
                return Ku(e, r, a), Ou(), !1
            }
            if (k) return t = uo.current, t === null ? (r !== qi && (t = Error(i(423), {
                cause: r
            }), ea(ki(t, n))), e = e.current.alternate, e.flags |= 65536, a &= -a, e.lanes |= a, r = ki(r, n), a = rc(e.stateNode, r, a), $a(e, a), J !== 4 && (J = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = a, r !== qi && (e = Error(i(422), {
                cause: r
            }), ea(ki(e, n)))), !1;
            var o = Error(i(520), {
                cause: r
            });
            if (o = ki(o, n), Ql === null ? Ql = [o] : Ql.push(o), J !== 4 && (J = 2), t === null) return !0;
            r = ki(r, n), n = t;
            do {
                switch (n.tag) {
                    case 3:
                        return n.flags |= 65536, e = a & -a, n.lanes |= e, e = rc(n.stateNode, r, e), $a(n, e), !1;
                    case 1:
                        if (t = n.type, o = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == `function` || o !== null && typeof o.componentDidCatch == `function` && (au === null || !au.has(o)))) return n.flags |= 65536, a &= -a, n.lanes |= a, a = ic(a), ac(a, e, n, r), $a(n, a), !1
                }
                n = n.return
            } while (n !== null);
            return !1
        }
        var sc = Error(i(461)),
            z = !1;

        function cc(e, t, n, r) {
            t.child = e === null ? qa(t, null, n, r) : Ka(t, e.child, n, r)
        }

        function lc(e, t, n, r, i) {
            n = n.render;
            var a = t.ref;
            if (`ref` in r) {
                var o = {};
                for (var s in r) s !== `ref` && (o[s] = r[s])
            } else o = r;
            return ua(t), r = Oo(e, t, n, o, a, i), s = Mo(), e !== null && !z ? (No(e, t, i), Nc(e, t, i)) : (k && s && Vi(t), t.flags |= 1, cc(e, t, r, i), t.child)
        }

        function uc(e, t, n, r, i) {
            if (e === null) {
                var a = n.type;
                return typeof a == `function` && !bi(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, dc(e, t, a, r, i)) : (e = Ci(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e)
            }
            if (a = e.child, !Pc(e, i)) {
                var o = a.memoizedProps;
                if (n = n.compare, n = n === null ? Pr : n, n(o, r) && e.ref === t.ref) return Nc(e, t, i)
            }
            return t.flags |= 1, e = xi(a, r), e.ref = t.ref, e.return = t, t.child = e
        }

        function dc(e, t, n, r, i) {
            if (e !== null) {
                var a = e.memoizedProps;
                if (Pr(a, r) && e.ref === t.ref)
                    if (z = !1, t.pendingProps = r = a, Pc(e, i)) e.flags & 131072 && (z = !0);
                    else return t.lanes = e.lanes, Nc(e, t, i)
            }
            return yc(e, t, n, r, i)
        }

        function fc(e, t, n, r) {
            var i = r.children,
                a = e === null ? null : e.memoizedState;
            if (e === null && t.stateNode === null && (t.stateNode = {
                    _visibility: 1,
                    _pendingMarkers: null,
                    _retryCache: null,
                    _transitions: null
                }), r.mode === `hidden`) {
                if (t.flags & 128) {
                    if (a = a === null ? n : a.baseLanes | n, e !== null) {
                        for (r = t.child = e.child, i = 0; r !== null;) i = i | r.lanes | r.childLanes, r = r.sibling;
                        r = i & ~a
                    } else r = 0, t.child = null;
                    return mc(e, t, a, n, r)
                }
                if (n & 536870912) t.memoizedState = {
                    baseLanes: 0,
                    cachePool: null
                }, e !== null && Oa(t, a === null ? null : a.cachePool), a === null ? co() : so(t, a), ho(t);
                else return r = t.lanes = 536870912, mc(e, t, a === null ? n : a.baseLanes | n, n, r)
            } else a === null ? (e !== null && Oa(t, null), co(), go(t)) : (Oa(t, a.cachePool), so(t, a), go(t), t.memoizedState = null);
            return cc(e, t, i, n), t.child
        }

        function pc(e, t) {
            return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
                _visibility: 1,
                _pendingMarkers: null,
                _retryCache: null,
                _transitions: null
            }), t.sibling
        }

        function mc(e, t, n, r, i) {
            var a = Da();
            return a = a === null ? null : {
                parent: A._currentValue,
                pool: a
            }, t.memoizedState = {
                baseLanes: n,
                cachePool: a
            }, e !== null && Oa(t, null), co(), ho(t), e !== null && ca(e, t, r, !0), t.childLanes = i, null
        }

        function hc(e, t) {
            return t = Oc({
                mode: t.mode,
                children: t.children
            }, e.mode), t.ref = e.ref, e.child = t, t.return = e, t
        }

        function gc(e, t, n) {
            return Ka(t, e.child, null, n), e = hc(t, t.pendingProps), e.flags |= 2, _o(t), t.memoizedState = null, e
        }

        function _c(e, t, n) {
            var r = t.pendingProps,
                a = (t.flags & 128) != 0;
            if (t.flags &= -129, e === null) {
                if (k) {
                    if (r.mode === `hidden`) return e = hc(t, r), t.lanes = 536870912, pc(null, e);
                    if (mo(t), (e = O) ? (e = rf(e, Ki), e = e !== null && e.data === `&` ? e : null, e !== null && (t.memoizedState = {
                            dehydrated: e,
                            treeContext: Ii === null ? null : {
                                id: Li,
                                overflow: Ri
                            },
                            retryLane: 536870912,
                            hydrationErrors: null
                        }, n = Ei(e), n.return = t, t.child = n, Wi = t, O = null)) : e = null, e === null) throw Ji(t);
                    return t.lanes = 536870912, null
                }
                return hc(t, r)
            }
            var o = e.memoizedState;
            if (o !== null) {
                var s = o.dehydrated;
                if (mo(t), a)
                    if (t.flags & 256) t.flags &= -257, t = gc(e, t, n);
                    else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
                else throw Error(i(558));
                else if (z || ca(e, t, n, !1), a = (n & e.childLanes) !== 0, z || a) {
                    if (r = W, r !== null && (s = ft(r, n), s !== 0 && s !== o.retryLane)) throw o.retryLane = s, mi(e, s), gu(r, e, s), sc;
                    Ou(), t = gc(e, t, n)
                } else e = o.treeContext, O = cf(s.nextSibling), Wi = t, k = !0, Gi = null, Ki = !1, e !== null && Ui(t, e), t = hc(t, r), t.flags |= 4096;
                return t
            }
            return e = xi(e.child, {
                mode: r.mode,
                children: r.children
            }), e.ref = t.ref, t.child = e, e.return = t, e
        }

        function vc(e, t) {
            var n = t.ref;
            if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
            else {
                if (typeof n != `function` && typeof n != `object`) throw Error(i(284));
                (e === null || e.ref !== n) && (t.flags |= 4194816)
            }
        }

        function yc(e, t, n, r, i) {
            return ua(t), n = Oo(e, t, n, r, void 0, i), r = Mo(), e !== null && !z ? (No(e, t, i), Nc(e, t, i)) : (k && r && Vi(t), t.flags |= 1, cc(e, t, n, i), t.child)
        }

        function bc(e, t, n, r, i, a) {
            return ua(t), t.updateQueue = null, n = Ao(t, r, n, i), ko(e), r = Mo(), e !== null && !z ? (No(e, t, a), Nc(e, t, a)) : (k && r && Vi(t), t.flags |= 1, cc(e, t, n, a), t.child)
        }

        function xc(e, t, n, r, i) {
            if (ua(t), t.stateNode === null) {
                var a = _i,
                    o = n.contextType;
                typeof o == `object` && o && (a = da(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = Js, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, Ja(t), o = n.contextType, a.context = typeof o == `object` && o ? da(o) : _i, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == `function` && (qs(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == `function` || typeof a.getSnapshotBeforeUpdate == `function` || typeof a.UNSAFE_componentWillMount != `function` && typeof a.componentWillMount != `function` || (o = a.state, typeof a.componentWillMount == `function` && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == `function` && a.UNSAFE_componentWillMount(), o !== a.state && Js.enqueueReplaceState(a, a.state, null), no(t, r, a, i), to(), a.state = t.memoizedState), typeof a.componentDidMount == `function` && (t.flags |= 4194308), r = !0
            } else if (e === null) {
                a = t.stateNode;
                var s = t.memoizedProps,
                    c = Zs(n, s);
                a.props = c;
                var l = a.context,
                    u = n.contextType;
                o = _i, typeof u == `object` && u && (o = da(u));
                var d = n.getDerivedStateFromProps;
                u = typeof d == `function` || typeof a.getSnapshotBeforeUpdate == `function`, s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != `function` && typeof a.componentWillReceiveProps != `function` || (s || l !== o) && Xs(t, a, r, o), M = !1;
                var f = t.memoizedState;
                a.state = f, no(t, r, a, i), to(), l = t.memoizedState, s || f !== l || M ? (typeof d == `function` && (qs(t, n, d, r), l = t.memoizedState), (c = M || Ys(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != `function` && typeof a.componentWillMount != `function` || (typeof a.componentWillMount == `function` && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == `function` && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == `function` && (t.flags |= 4194308)) : (typeof a.componentDidMount == `function` && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == `function` && (t.flags |= 4194308), r = !1)
            } else {
                a = t.stateNode, Ya(e, t), o = t.memoizedProps, u = Zs(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = _i, typeof l == `object` && l && (c = da(l)), s = n.getDerivedStateFromProps, (l = typeof s == `function` || typeof a.getSnapshotBeforeUpdate == `function`) || typeof a.UNSAFE_componentWillReceiveProps != `function` && typeof a.componentWillReceiveProps != `function` || (o !== d || f !== c) && Xs(t, a, r, c), M = !1, f = t.memoizedState, a.state = f, no(t, r, a, i), to();
                var p = t.memoizedState;
                o !== d || f !== p || M || e !== null && e.dependencies !== null && la(e.dependencies) ? (typeof s == `function` && (qs(t, n, s, r), p = t.memoizedState), (u = M || Ys(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && la(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != `function` && typeof a.componentWillUpdate != `function` || (typeof a.componentWillUpdate == `function` && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == `function` && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == `function` && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == `function` && (t.flags |= 1024)) : (typeof a.componentDidUpdate != `function` || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != `function` || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != `function` || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != `function` || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1)
            }
            return a = r, vc(e, t), r = (t.flags & 128) != 0, a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != `function` ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = Ka(t, e.child, null, i), t.child = Ka(t, null, n, i)) : cc(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = Nc(e, t, i), e
        }

        function Sc(e, t, n, r) {
            return Qi(), t.flags |= 256, cc(e, t, n, r), t.child
        }
        var Cc = {
            dehydrated: null,
            treeContext: null,
            retryLane: 0,
            hydrationErrors: null
        };

        function wc(e) {
            return {
                baseLanes: e,
                cachePool: ka()
            }
        }

        function Tc(e, t, n) {
            return e = e === null ? 0 : e.childLanes & ~n, t && (e |= Xl), e
        }

        function Ec(e, t, n) {
            var r = t.pendingProps,
                a = !1,
                o = (t.flags & 128) != 0,
                s;
            if ((s = o) || (s = e !== null && e.memoizedState === null ? !1 : (N.current & 2) != 0), s && (a = !0, t.flags &= -129), s = (t.flags & 32) != 0, t.flags &= -33, e === null) {
                if (k) {
                    if (a ? po(t) : go(t), (e = O) ? (e = rf(e, Ki), e = e !== null && e.data !== `&` ? e : null, e !== null && (t.memoizedState = {
                            dehydrated: e,
                            treeContext: Ii === null ? null : {
                                id: Li,
                                overflow: Ri
                            },
                            retryLane: 536870912,
                            hydrationErrors: null
                        }, n = Ei(e), n.return = t, t.child = n, Wi = t, O = null)) : e = null, e === null) throw Ji(t);
                    return of(e) ? t.lanes = 32 : t.lanes = 536870912, null
                }
                var c = r.children;
                return r = r.fallback, a ? (go(t), a = t.mode, c = Oc({
                    mode: `hidden`,
                    children: c
                }, a), r = wi(r, a, n, null), c.return = t, r.return = t, c.sibling = r, t.child = c, r = t.child, r.memoizedState = wc(n), r.childLanes = Tc(e, s, n), t.memoizedState = Cc, pc(null, r)) : (po(t), Dc(t, c))
            }
            var l = e.memoizedState;
            if (l !== null && (c = l.dehydrated, c !== null)) {
                if (o) t.flags & 256 ? (po(t), t.flags &= -257, t = kc(e, t, n)) : t.memoizedState === null ? (go(t), c = r.fallback, a = t.mode, r = Oc({
                    mode: `visible`,
                    children: r.children
                }, a), c = wi(c, a, n, null), c.flags |= 2, r.return = t, c.return = t, r.sibling = c, t.child = r, Ka(t, e.child, null, n), r = t.child, r.memoizedState = wc(n), r.childLanes = Tc(e, s, n), t.memoizedState = Cc, t = pc(null, r)) : (go(t), t.child = e.child, t.flags |= 128, t = null);
                else if (po(t), of (c)) {
                    if (s = c.nextSibling && c.nextSibling.dataset, s) var u = s.dgst;
                    s = u, r = Error(i(419)), r.stack = ``, r.digest = s, ea({
                        value: r,
                        source: null,
                        stack: null
                    }), t = kc(e, t, n)
                } else if (z || ca(e, t, n, !1), s = (n & e.childLanes) !== 0, z || s) {
                    if (s = W, s !== null && (r = ft(s, n), r !== 0 && r !== l.retryLane)) throw l.retryLane = r, mi(e, r), gu(s, e, r), sc;
                    af(c) || Ou(), t = kc(e, t, n)
                } else af(c) ? (t.flags |= 192, t.child = e.child, t = null) : (e = l.treeContext, O = cf(c.nextSibling), Wi = t, k = !0, Gi = null, Ki = !1, e !== null && Ui(t, e), t = Dc(t, r.children), t.flags |= 4096);
                return t
            }
            return a ? (go(t), c = r.fallback, a = t.mode, l = e.child, u = l.sibling, r = xi(l, {
                mode: `hidden`,
                children: r.children
            }), r.subtreeFlags = l.subtreeFlags & 65011712, u === null ? (c = wi(c, a, n, null), c.flags |= 2) : c = xi(u, c), c.return = t, r.return = t, r.sibling = c, t.child = r, pc(null, r), r = t.child, c = e.child.memoizedState, c === null ? c = wc(n) : (a = c.cachePool, a === null ? a = ka() : (l = A._currentValue, a = a.parent === l ? a : {
                parent: l,
                pool: l
            }), c = {
                baseLanes: c.baseLanes | n,
                cachePool: a
            }), r.memoizedState = c, r.childLanes = Tc(e, s, n), t.memoizedState = Cc, pc(e.child, r)) : (po(t), n = e.child, e = n.sibling, n = xi(n, {
                mode: `visible`,
                children: r.children
            }), n.return = t, n.sibling = null, e !== null && (s = t.deletions, s === null ? (t.deletions = [e], t.flags |= 16) : s.push(e)), t.child = n, t.memoizedState = null, n)
        }

        function Dc(e, t) {
            return t = Oc({
                mode: `visible`,
                children: t
            }, e.mode), t.return = e, e.child = t
        }

        function Oc(e, t) {
            return e = yi(22, e, null, t), e.lanes = 0, e
        }

        function kc(e, t, n) {
            return Ka(t, e.child, null, n), e = Dc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e
        }

        function Ac(e, t, n) {
            e.lanes |= t;
            var r = e.alternate;
            r !== null && (r.lanes |= t), oa(e.return, t, n)
        }

        function jc(e, t, n, r, i, a) {
            var o = e.memoizedState;
            o === null ? e.memoizedState = {
                isBackwards: t,
                rendering: null,
                renderingStartTime: 0,
                last: r,
                tail: n,
                tailMode: i,
                treeForkCount: a
            } : (o.isBackwards = t, o.rendering = null, o.renderingStartTime = 0, o.last = r, o.tail = n, o.tailMode = i, o.treeForkCount = a)
        }

        function Mc(e, t, n) {
            var r = t.pendingProps,
                i = r.revealOrder,
                a = r.tail;
            r = r.children;
            var o = N.current,
                s = (o & 2) != 0;
            if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, w(N, o), cc(e, t, r, n), r = k ? Ni : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
                if (e.tag === 13) e.memoizedState !== null && Ac(e, n, t);
                else if (e.tag === 19) Ac(e, n, t);
                else if (e.child !== null) {
                    e.child.return = e, e = e.child;
                    continue
                }
                if (e === t) break a;
                for (; e.sibling === null;) {
                    if (e.return === null || e.return === t) break a;
                    e = e.return
                }
                e.sibling.return = e.return, e = e.sibling
            }
            switch (i) {
                case `forwards`:
                    for (n = t.child, i = null; n !== null;) e = n.alternate, e !== null && vo(e) === null && (i = n), n = n.sibling;
                    n = i, n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), jc(t, !1, i, n, a, r);
                    break;
                case `backwards`:
                case `unstable_legacy-backwards`:
                    for (n = null, i = t.child, t.child = null; i !== null;) {
                        if (e = i.alternate, e !== null && vo(e) === null) {
                            t.child = i;
                            break
                        }
                        e = i.sibling, i.sibling = n, n = i, i = e
                    }
                    jc(t, !0, n, null, a, r);
                    break;
                case `together`:
                    jc(t, !1, null, null, void 0, r);
                    break;
                default:
                    t.memoizedState = null
            }
            return t.child
        }

        function Nc(e, t, n) {
            if (e !== null && (t.dependencies = e.dependencies), ql |= t.lanes, (n & t.childLanes) === 0)
                if (e !== null) {
                    if (ca(e, t, n, !1), (n & t.childLanes) === 0) return null
                } else return null;
            if (e !== null && t.child !== e.child) throw Error(i(153));
            if (t.child !== null) {
                for (e = t.child, n = xi(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = xi(e, e.pendingProps), n.return = t;
                n.sibling = null
            }
            return t.child
        }

        function Pc(e, t) {
            return (e.lanes & t) === 0 ? (e = e.dependencies, !!(e !== null && la(e))) : !0
        }

        function Fc(e, t, n) {
            switch (t.tag) {
                case 3:
                    Se(t, t.stateNode.containerInfo), ia(t, A, e.memoizedState.cache), Qi();
                    break;
                case 27:
                case 5:
                    we(t);
                    break;
                case 4:
                    Se(t, t.stateNode.containerInfo);
                    break;
                case 10:
                    ia(t, t.type, t.memoizedProps.value);
                    break;
                case 31:
                    if (t.memoizedState !== null) return t.flags |= 128, mo(t), null;
                    break;
                case 13:
                    var r = t.memoizedState;
                    if (r !== null) return r.dehydrated === null ? (n & t.child.childLanes) === 0 ? (po(t), e = Nc(e, t, n), e === null ? null : e.sibling) : Ec(e, t, n) : (po(t), t.flags |= 128, null);
                    po(t);
                    break;
                case 19:
                    var i = (e.flags & 128) != 0;
                    if (r = (n & t.childLanes) !== 0, r || = (ca(e, t, n, !1), (n & t.childLanes) !== 0), i) {
                        if (r) return Mc(e, t, n);
                        t.flags |= 128
                    }
                    if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), w(N, N.current), r) break;
                    return null;
                case 22:
                    return t.lanes = 0, fc(e, t, n, t.pendingProps);
                case 24:
                    ia(t, A, e.memoizedState.cache)
            }
            return Nc(e, t, n)
        }

        function Ic(e, t, n) {
            if (e !== null)
                if (e.memoizedProps !== t.pendingProps) z = !0;
                else {
                    if (!Pc(e, n) && !(t.flags & 128)) return z = !1, Fc(e, t, n);
                    z = !!(e.flags & 131072)
                }
            else z = !1, k && t.flags & 1048576 && Bi(t, Ni, t.index);
            switch (t.lanes = 0, t.tag) {
                case 16:
                    a: {
                        var r = t.pendingProps;
                        if (e = Ia(t.elementType), t.type = e, typeof e == `function`) bi(e) ? (r = Zs(e, r), t.tag = 1, t = xc(null, t, e, r, n)) : (t.tag = 0, t = yc(null, t, e, r, n));
                        else {
                            if (e != null) {
                                var a = e.$$typeof;
                                if (a === te) {
                                    t.tag = 11, t = lc(null, t, e, r, n);
                                    break a
                                } else if (a === ie) {
                                    t.tag = 14, t = uc(null, t, e, r, n);
                                    break a
                                }
                            }
                            throw t = de(e) || e, Error(i(306, t, ``))
                        }
                    }
                    return t;
                case 0:
                    return yc(e, t, t.type, t.pendingProps, n);
                case 1:
                    return r = t.type, a = Zs(r, t.pendingProps), xc(e, t, r, a, n);
                case 3:
                    a: {
                        if (Se(t, t.stateNode.containerInfo), e === null) throw Error(i(387));r = t.pendingProps;
                        var o = t.memoizedState;a = o.element,
                        Ya(e, t),
                        no(t, r, null, n);
                        var s = t.memoizedState;
                        if (r = s.cache, ia(t, A, r), r !== o.cache && sa(t, [A], n, !0), to(), r = s.element, o.isDehydrated)
                            if (o = {
                                    element: r,
                                    isDehydrated: !1,
                                    cache: s.cache
                                }, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
                                t = Sc(e, t, r, n);
                                break a
                            } else if (r !== a) {
                            a = ki(Error(i(424)), t), ea(a), t = Sc(e, t, r, n);
                            break a
                        } else {
                            switch (e = t.stateNode.containerInfo, e.nodeType) {
                                case 9:
                                    e = e.body;
                                    break;
                                default:
                                    e = e.nodeName === `HTML` ? e.ownerDocument.body : e
                            }
                            for (O = cf(e.firstChild), Wi = t, k = !0, Gi = null, Ki = !0, n = qa(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 4096, n = n.sibling
                        } else {
                            if (Qi(), r === a) {
                                t = Nc(e, t, n);
                                break a
                            }
                            cc(e, t, r, n)
                        }
                        t = t.child
                    }
                    return t;
                case 26:
                    return vc(e, t), e === null ? (n = kf(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : k || (n = t.type, e = t.pendingProps, r = Bd(be.current).createElement(n), r[vt] = t, r[yt] = e, Pd(r, n, e), jt(r), t.stateNode = r) : t.memoizedState = kf(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
                case 27:
                    return we(t), e === null && k && (r = t.stateNode = ff(t.type, t.pendingProps, be.current), Wi = t, Ki = !0, a = O, Zd(t.type) ? (lf = a, O = cf(r.firstChild)) : O = a), cc(e, t, t.pendingProps.children, n), vc(e, t), e === null && (t.flags |= 4194304), t.child;
                case 5:
                    return e === null && k && ((a = r = O) && (r = tf(r, t.type, t.pendingProps, Ki), r === null ? a = !1 : (t.stateNode = r, Wi = t, O = cf(r.firstChild), Ki = !1, a = !0)), a || Ji(t)), we(t), a = t.type, o = t.pendingProps, s = e === null ? null : e.memoizedProps, r = o.children, Ud(a, o) ? r = null : s !== null && Ud(a, s) && (t.flags |= 32), t.memoizedState !== null && (a = Oo(e, t, jo, null, null, n), Qf._currentValue = a), vc(e, t), cc(e, t, r, n), t.child;
                case 6:
                    return e === null && k && ((e = n = O) && (n = nf(n, t.pendingProps, Ki), n === null ? e = !1 : (t.stateNode = n, Wi = t, O = null, e = !0)), e || Ji(t)), null;
                case 13:
                    return Ec(e, t, n);
                case 4:
                    return Se(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Ka(t, null, r, n) : cc(e, t, r, n), t.child;
                case 11:
                    return lc(e, t, t.type, t.pendingProps, n);
                case 7:
                    return cc(e, t, t.pendingProps, n), t.child;
                case 8:
                    return cc(e, t, t.pendingProps.children, n), t.child;
                case 12:
                    return cc(e, t, t.pendingProps.children, n), t.child;
                case 10:
                    return r = t.pendingProps, ia(t, t.type, r.value), cc(e, t, r.children, n), t.child;
                case 9:
                    return a = t.type._context, r = t.pendingProps.children, ua(t), a = da(a), r = r(a), t.flags |= 1, cc(e, t, r, n), t.child;
                case 14:
                    return uc(e, t, t.type, t.pendingProps, n);
                case 15:
                    return dc(e, t, t.type, t.pendingProps, n);
                case 19:
                    return Mc(e, t, n);
                case 31:
                    return _c(e, t, n);
                case 22:
                    return fc(e, t, n, t.pendingProps);
                case 24:
                    return ua(t), r = da(A), e === null ? (a = Da(), a === null && (a = W, o = _a(), a.pooledCache = o, o.refCount++, o !== null && (a.pooledCacheLanes |= n), a = o), t.memoizedState = {
                        parent: r,
                        cache: a
                    }, Ja(t), ia(t, A, a)) : ((e.lanes & n) !== 0 && (Ya(e, t), no(t, null, null, n), to()), a = e.memoizedState, o = t.memoizedState, a.parent === r ? (r = o.cache, ia(t, A, r), r !== a.cache && sa(t, [A], n, !0)) : (a = {
                        parent: r,
                        cache: r
                    }, t.memoizedState = a, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a), ia(t, A, r))), cc(e, t, t.pendingProps.children, n), t.child;
                case 29:
                    throw t.pendingProps
            }
            throw Error(i(156, t.tag))
        }

        function Lc(e) {
            e.flags |= 4
        }

        function Rc(e, t, n, r, i) {
            if ((t = (e.mode & 32) != 0) && (t = !1), t) {
                if (e.flags |= 16777216, (i & 335544128) === i)
                    if (e.stateNode.complete) e.flags |= 8192;
                    else if (Tu()) e.flags |= 8192;
                else throw La = Na, ja
            } else e.flags &= -16777217
        }

        function zc(e, t) {
            if (t.type !== `stylesheet` || t.state.loading & 4) e.flags &= -16777217;
            else if (e.flags |= 16777216, !Wf(t))
                if (Tu()) e.flags |= 8192;
                else throw La = Na, ja
        }

        function Bc(e, t) {
            t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : ot(), e.lanes |= t, Zl |= t)
        }

        function Vc(e, t) {
            if (!k) switch (e.tailMode) {
                case `hidden`:
                    t = e.tail;
                    for (var n = null; t !== null;) t.alternate !== null && (n = t), t = t.sibling;
                    n === null ? e.tail = null : n.sibling = null;
                    break;
                case `collapsed`:
                    n = e.tail;
                    for (var r = null; n !== null;) n.alternate !== null && (r = n), n = n.sibling;
                    r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null
            }
        }

        function B(e) {
            var t = e.alternate !== null && e.alternate.child === e.child,
                n = 0,
                r = 0;
            if (t)
                for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 65011712, r |= i.flags & 65011712, i.return = e, i = i.sibling;
            else
                for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
            return e.subtreeFlags |= r, e.childLanes = n, t
        }

        function Hc(e, t, n) {
            var r = t.pendingProps;
            switch (Hi(t), t.tag) {
                case 16:
                case 15:
                case 0:
                case 11:
                case 7:
                case 8:
                case 12:
                case 9:
                case 14:
                    return B(t), null;
                case 1:
                    return B(t), null;
                case 3:
                    return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), aa(A), Ce(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (Zi(t) ? Lc(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, $i())), B(t), null;
                case 26:
                    var a = t.type,
                        o = t.memoizedState;
                    return e === null ? (Lc(t), o === null ? (B(t), Rc(t, a, null, r, n)) : (B(t), zc(t, o))) : o ? o === e.memoizedState ? (B(t), t.flags &= -16777217) : (Lc(t), B(t), zc(t, o)) : (e = e.memoizedProps, e !== r && Lc(t), B(t), Rc(t, a, e, r, n)), null;
                case 27:
                    if (Te(t), n = be.current, a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && Lc(t);
                    else {
                        if (!r) {
                            if (t.stateNode === null) throw Error(i(166));
                            return B(t), null
                        }
                        e = ve.current, Zi(t) ? Yi(t, e) : (e = ff(a, r, n), t.stateNode = e, Lc(t))
                    }
                    return B(t), null;
                case 5:
                    if (Te(t), a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && Lc(t);
                    else {
                        if (!r) {
                            if (t.stateNode === null) throw Error(i(166));
                            return B(t), null
                        }
                        if (o = ve.current, Zi(t)) Yi(t, o);
                        else {
                            var s = Bd(be.current);
                            switch (o) {
                                case 1:
                                    o = s.createElementNS(`http://www.w3.org/2000/svg`, a);
                                    break;
                                case 2:
                                    o = s.createElementNS(`http://www.w3.org/1998/Math/MathML`, a);
                                    break;
                                default:
                                    switch (a) {
                                        case `svg`:
                                            o = s.createElementNS(`http://www.w3.org/2000/svg`, a);
                                            break;
                                        case `math`:
                                            o = s.createElementNS(`http://www.w3.org/1998/Math/MathML`, a);
                                            break;
                                        case `script`:
                                            o = s.createElement(`div`), o.innerHTML = `<script><\/script>`, o = o.removeChild(o.firstChild);
                                            break;
                                        case `select`:
                                            o = typeof r.is == `string` ? s.createElement(`select`, {
                                                is: r.is
                                            }) : s.createElement(`select`), r.multiple ? o.multiple = !0 : r.size && (o.size = r.size);
                                            break;
                                        default:
                                            o = typeof r.is == `string` ? s.createElement(a, {
                                                is: r.is
                                            }) : s.createElement(a)
                                    }
                            }
                            o[vt] = t, o[yt] = r;
                            a: for (s = t.child; s !== null;) {
                                if (s.tag === 5 || s.tag === 6) o.appendChild(s.stateNode);
                                else if (s.tag !== 4 && s.tag !== 27 && s.child !== null) {
                                    s.child.return = s, s = s.child;
                                    continue
                                }
                                if (s === t) break a;
                                for (; s.sibling === null;) {
                                    if (s.return === null || s.return === t) break a;
                                    s = s.return
                                }
                                s.sibling.return = s.return, s = s.sibling
                            }
                            t.stateNode = o;
                            a: switch (Pd(o, a, r), a) {
                                case `button`:
                                case `input`:
                                case `select`:
                                case `textarea`:
                                    r = !!r.autoFocus;
                                    break a;
                                case `img`:
                                    r = !0;
                                    break a;
                                default:
                                    r = !1
                            }
                            r && Lc(t)
                        }
                    }
                    return B(t), Rc(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n), null;
                case 6:
                    if (e && t.stateNode != null) e.memoizedProps !== r && Lc(t);
                    else {
                        if (typeof r != `string` && t.stateNode === null) throw Error(i(166));
                        if (e = be.current, Zi(t)) {
                            if (e = t.stateNode, n = t.memoizedProps, r = null, a = Wi, a !== null) switch (a.tag) {
                                case 27:
                                case 5:
                                    r = a.memoizedProps
                            }
                            e[vt] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || Md(e.nodeValue, n)), e || Ji(t, !0)
                        } else e = Bd(e).createTextNode(r), e[vt] = t, t.stateNode = e
                    }
                    return B(t), null;
                case 31:
                    if (n = t.memoizedState, e === null || e.memoizedState !== null) {
                        if (r = Zi(t), n !== null) {
                            if (e === null) {
                                if (!r) throw Error(i(318));
                                if (e = t.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(557));
                                e[vt] = t
                            } else Qi(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
                            B(t), e = !1
                        } else n = $i(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), e = !0;
                        if (!e) return t.flags & 256 ? (_o(t), t) : (_o(t), null);
                        if (t.flags & 128) throw Error(i(558))
                    }
                    return B(t), null;
                case 13:
                    if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
                        if (a = Zi(t), r !== null && r.dehydrated !== null) {
                            if (e === null) {
                                if (!a) throw Error(i(318));
                                if (a = t.memoizedState, a = a === null ? null : a.dehydrated, !a) throw Error(i(317));
                                a[vt] = t
                            } else Qi(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
                            B(t), a = !1
                        } else a = $i(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), a = !0;
                        if (!a) return t.flags & 256 ? (_o(t), t) : (_o(t), null)
                    }
                    return _o(t), t.flags & 128 ? (t.lanes = n, t) : (n = r !== null, e = e !== null && e.memoizedState !== null, n && (r = t.child, a = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (a = r.alternate.memoizedState.cachePool.pool), o = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (o = r.memoizedState.cachePool.pool), o !== a && (r.flags |= 2048)), n !== e && n && (t.child.flags |= 8192), Bc(t, t.updateQueue), B(t), null);
                case 4:
                    return Ce(), e === null && Sd(t.stateNode.containerInfo), B(t), null;
                case 10:
                    return aa(t.type), B(t), null;
                case 19:
                    if (_e(N), r = t.memoizedState, r === null) return B(t), null;
                    if (a = (t.flags & 128) != 0, o = r.rendering, o === null)
                        if (a) Vc(r, !1);
                        else {
                            if (J !== 0 || e !== null && e.flags & 128)
                                for (e = t.child; e !== null;) {
                                    if (o = vo(e), o !== null) {
                                        for (t.flags |= 128, Vc(r, !1), e = o.updateQueue, t.updateQueue = e, Bc(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) Si(n, e), n = n.sibling;
                                        return w(N, N.current & 1 | 2), k && zi(t, r.treeForkCount), t.child
                                    }
                                    e = e.sibling
                                }
                            r.tail !== null && T() > ru && (t.flags |= 128, a = !0, Vc(r, !1), t.lanes = 4194304)
                        }
                    else {
                        if (!a)
                            if (e = vo(o), e !== null) {
                                if (t.flags |= 128, a = !0, e = e.updateQueue, t.updateQueue = e, Bc(t, e), Vc(r, !0), r.tail === null && r.tailMode === `hidden` && !o.alternate && !k) return B(t), null
                            } else 2 * T() - r.renderingStartTime > ru && n !== 536870912 && (t.flags |= 128, a = !0, Vc(r, !1), t.lanes = 4194304);
                        r.isBackwards ? (o.sibling = t.child, t.child = o) : (e = r.last, e === null ? t.child = o : e.sibling = o, r.last = o)
                    }
                    return r.tail === null ? (B(t), null) : (e = r.tail, r.rendering = e, r.tail = e.sibling, r.renderingStartTime = T(), e.sibling = null, n = N.current, w(N, a ? n & 1 | 2 : n & 1), k && zi(t, r.treeForkCount), e);
                case 22:
                case 23:
                    return _o(t), lo(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (B(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : B(t), n = t.updateQueue, n !== null && Bc(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && _e(Ea), null;
                case 24:
                    return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), aa(A), B(t), null;
                case 25:
                    return null;
                case 30:
                    return null
            }
            throw Error(i(156, t.tag))
        }

        function Uc(e, t) {
            switch (Hi(t), t.tag) {
                case 1:
                    return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
                case 3:
                    return aa(A), Ce(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
                case 26:
                case 27:
                case 5:
                    return Te(t), null;
                case 31:
                    if (t.memoizedState !== null) {
                        if (_o(t), t.alternate === null) throw Error(i(340));
                        Qi()
                    }
                    return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
                case 13:
                    if (_o(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
                        if (t.alternate === null) throw Error(i(340));
                        Qi()
                    }
                    return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
                case 19:
                    return _e(N), null;
                case 4:
                    return Ce(), null;
                case 10:
                    return aa(t.type), null;
                case 22:
                case 23:
                    return _o(t), lo(), e !== null && _e(Ea), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
                case 24:
                    return aa(A), null;
                case 25:
                    return null;
                default:
                    return null
            }
        }

        function Wc(e, t) {
            switch (Hi(t), t.tag) {
                case 3:
                    aa(A), Ce();
                    break;
                case 26:
                case 27:
                case 5:
                    Te(t);
                    break;
                case 4:
                    Ce();
                    break;
                case 31:
                    t.memoizedState !== null && _o(t);
                    break;
                case 13:
                    _o(t);
                    break;
                case 19:
                    _e(N);
                    break;
                case 10:
                    aa(t.type);
                    break;
                case 22:
                case 23:
                    _o(t), lo(), e !== null && _e(Ea);
                    break;
                case 24:
                    aa(A)
            }
        }

        function Gc(e, t) {
            try {
                var n = t.updateQueue,
                    r = n === null ? null : n.lastEffect;
                if (r !== null) {
                    var i = r.next;
                    n = i;
                    do {
                        if ((n.tag & e) === e) {
                            r = void 0;
                            var a = n.create,
                                o = n.inst;
                            r = a(), o.destroy = r
                        }
                        n = n.next
                    } while (n !== i)
                }
            } catch (e) {
                X(t, t.return, e)
            }
        }

        function Kc(e, t, n) {
            try {
                var r = t.updateQueue,
                    i = r === null ? null : r.lastEffect;
                if (i !== null) {
                    var a = i.next;
                    r = a;
                    do {
                        if ((r.tag & e) === e) {
                            var o = r.inst,
                                s = o.destroy;
                            if (s !== void 0) {
                                o.destroy = void 0, i = t;
                                var c = n,
                                    l = s;
                                try {
                                    l()
                                } catch (e) {
                                    X(i, c, e)
                                }
                            }
                        }
                        r = r.next
                    } while (r !== a)
                }
            } catch (e) {
                X(t, t.return, e)
            }
        }

        function qc(e) {
            var t = e.updateQueue;
            if (t !== null) {
                var n = e.stateNode;
                try {
                    io(t, n)
                } catch (t) {
                    X(e, e.return, t)
                }
            }
        }

        function Jc(e, t, n) {
            n.props = Zs(e.type, e.memoizedProps), n.state = e.memoizedState;
            try {
                n.componentWillUnmount()
            } catch (n) {
                X(e, t, n)
            }
        }

        function Yc(e, t) {
            try {
                var n = e.ref;
                if (n !== null) {
                    switch (e.tag) {
                        case 26:
                        case 27:
                        case 5:
                            var r = e.stateNode;
                            break;
                        case 30:
                            r = e.stateNode;
                            break;
                        default:
                            r = e.stateNode
                    }
                    typeof n == `function` ? e.refCleanup = n(r) : n.current = r
                }
            } catch (n) {
                X(e, t, n)
            }
        }

        function Xc(e, t) {
            var n = e.ref,
                r = e.refCleanup;
            if (n !== null)
                if (typeof r == `function`) try {
                    r()
                } catch (n) {
                    X(e, t, n)
                } finally {
                    e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null)
                } else if (typeof n == `function`) try {
                    n(null)
                } catch (n) {
                    X(e, t, n)
                } else n.current = null
        }

        function Zc(e) {
            var t = e.type,
                n = e.memoizedProps,
                r = e.stateNode;
            try {
                a: switch (t) {
                    case `button`:
                    case `input`:
                    case `select`:
                    case `textarea`:
                        n.autoFocus && r.focus();
                        break a;
                    case `img`:
                        n.src ? r.src = n.src : n.srcSet && (r.srcset = n.srcSet)
                }
            }
            catch (t) {
                X(e, e.return, t)
            }
        }

        function Qc(e, t, n) {
            try {
                var r = e.stateNode;
                Fd(r, e.type, n, t), r[yt] = t
            } catch (t) {
                X(e, e.return, t)
            }
        }

        function $c(e) {
            return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Zd(e.type) || e.tag === 4
        }

        function el(e) {
            a: for (;;) {
                for (; e.sibling === null;) {
                    if (e.return === null || $c(e.return)) return null;
                    e = e.return
                }
                for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
                    if (e.tag === 27 && Zd(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue a;
                    e.child.return = e, e = e.child
                }
                if (!(e.flags & 2)) return e.stateNode
            }
        }

        function tl(e, t, n) {
            var r = e.tag;
            if (r === 5 || r === 6) e = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === `HTML` ? n.ownerDocument.body : n).insertBefore(e, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === `HTML` ? n.ownerDocument.body : n, t.appendChild(e), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = dn));
            else if (r !== 4 && (r === 27 && Zd(e.type) && (n = e.stateNode, t = null), e = e.child, e !== null))
                for (tl(e, t, n), e = e.sibling; e !== null;) tl(e, t, n), e = e.sibling
        }

        function nl(e, t, n) {
            var r = e.tag;
            if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
            else if (r !== 4 && (r === 27 && Zd(e.type) && (n = e.stateNode), e = e.child, e !== null))
                for (nl(e, t, n), e = e.sibling; e !== null;) nl(e, t, n), e = e.sibling
        }

        function rl(e) {
            var t = e.stateNode,
                n = e.memoizedProps;
            try {
                for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
                Pd(t, r, n), t[vt] = e, t[yt] = n
            } catch (t) {
                X(e, e.return, t)
            }
        }
        var il = !1,
            V = !1,
            al = !1,
            ol = typeof WeakSet == `function` ? WeakSet : Set,
            sl = null;

        function cl(e, t) {
            if (e = e.containerInfo, Rd = sp, e = Rr(e), zr(e)) {
                if (`selectionStart` in e) var n = {
                    start: e.selectionStart,
                    end: e.selectionEnd
                };
                else a: {
                    n = (n = e.ownerDocument) && n.defaultView || window;
                    var r = n.getSelection && n.getSelection();
                    if (r && r.rangeCount !== 0) {
                        n = r.anchorNode;
                        var a = r.anchorOffset,
                            o = r.focusNode;
                        r = r.focusOffset;
                        try {
                            n.nodeType, o.nodeType
                        } catch {
                            n = null;
                            break a
                        }
                        var s = 0,
                            c = -1,
                            l = -1,
                            u = 0,
                            d = 0,
                            f = e,
                            p = null;
                        b: for (;;) {
                            for (var m; f !== n || a !== 0 && f.nodeType !== 3 || (c = s + a), f !== o || r !== 0 && f.nodeType !== 3 || (l = s + r), f.nodeType === 3 && (s += f.nodeValue.length), (m = f.firstChild) !== null;) p = f, f = m;
                            for (;;) {
                                if (f === e) break b;
                                if (p === n && ++u === a && (c = s), p === o && ++d === r && (l = s), (m = f.nextSibling) !== null) break;
                                f = p, p = f.parentNode
                            }
                            f = m
                        }
                        n = c === -1 || l === -1 ? null : {
                            start: c,
                            end: l
                        }
                    } else n = null
                }
                n || = {
                    start: 0,
                    end: 0
                }
            } else n = null;
            for (zd = {
                    focusedElem: e,
                    selectionRange: n
                }, sp = !1, sl = t; sl !== null;)
                if (t = sl, e = t.child, t.subtreeFlags & 1028 && e !== null) e.return = t, sl = e;
                else
                    for (; sl !== null;) {
                        switch (t = sl, o = t.alternate, e = t.flags, t.tag) {
                            case 0:
                                if (e & 4 && (e = t.updateQueue, e = e === null ? null : e.events, e !== null))
                                    for (n = 0; n < e.length; n++) a = e[n], a.ref.impl = a.nextImpl;
                                break;
                            case 11:
                            case 15:
                                break;
                            case 1:
                                if (e & 1024 && o !== null) {
                                    e = void 0, n = t, a = o.memoizedProps, o = o.memoizedState, r = n.stateNode;
                                    try {
                                        var h = Zs(n.type, a);
                                        e = r.getSnapshotBeforeUpdate(h, o), r.__reactInternalSnapshotBeforeUpdate = e
                                    } catch (e) {
                                        X(n, n.return, e)
                                    }
                                }
                                break;
                            case 3:
                                if (e & 1024) {
                                    if (e = t.stateNode.containerInfo, n = e.nodeType, n === 9) ef(e);
                                    else if (n === 1) switch (e.nodeName) {
                                        case `HEAD`:
                                        case `HTML`:
                                        case `BODY`:
                                            ef(e);
                                            break;
                                        default:
                                            e.textContent = ``
                                    }
                                }
                                break;
                            case 5:
                            case 26:
                            case 27:
                            case 6:
                            case 4:
                            case 17:
                                break;
                            default:
                                if (e & 1024) throw Error(i(163))
                        }
                        if (e = t.sibling, e !== null) {
                            e.return = t.return, sl = e;
                            break
                        }
                        sl = t.return
                    }
        }

        function ll(e, t, n) {
            var r = n.flags;
            switch (n.tag) {
                case 0:
                case 11:
                case 15:
                    Cl(e, n), r & 4 && Gc(5, n);
                    break;
                case 1:
                    if (Cl(e, n), r & 4)
                        if (e = n.stateNode, t === null) try {
                            e.componentDidMount()
                        } catch (e) {
                            X(n, n.return, e)
                        } else {
                            var i = Zs(n.type, t.memoizedProps);
                            t = t.memoizedState;
                            try {
                                e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate)
                            } catch (e) {
                                X(n, n.return, e)
                            }
                        }
                    r & 64 && qc(n), r & 512 && Yc(n, n.return);
                    break;
                case 3:
                    if (Cl(e, n), r & 64 && (e = n.updateQueue, e !== null)) {
                        if (t = null, n.child !== null) switch (n.child.tag) {
                            case 27:
                            case 5:
                                t = n.child.stateNode;
                                break;
                            case 1:
                                t = n.child.stateNode
                        }
                        try {
                            io(e, t)
                        } catch (e) {
                            X(n, n.return, e)
                        }
                    }
                    break;
                case 27:
                    t === null && r & 4 && rl(n);
                case 26:
                case 5:
                    Cl(e, n), t === null && r & 4 && Zc(n), r & 512 && Yc(n, n.return);
                    break;
                case 12:
                    Cl(e, n);
                    break;
                case 31:
                    Cl(e, n), r & 4 && ml(e, n);
                    break;
                case 13:
                    Cl(e, n), r & 4 && hl(e, n), r & 64 && (e = n.memoizedState, e !== null && (e = e.dehydrated, e !== null && (n = Yu.bind(null, n), sf(e, n))));
                    break;
                case 22:
                    if (r = n.memoizedState !== null || il, !r) {
                        t = t !== null && t.memoizedState !== null || V, i = il;
                        var a = V;
                        il = r, (V = t) && !a ? Tl(e, n, (n.subtreeFlags & 8772) != 0) : Cl(e, n), il = i, V = a
                    }
                    break;
                case 30:
                    break;
                default:
                    Cl(e, n)
            }
        }

        function ul(e) {
            var t = e.alternate;
            t !== null && (e.alternate = null, ul(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && Et(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null
        }
        var H = null,
            dl = !1;

        function fl(e, t, n) {
            for (n = n.child; n !== null;) pl(e, t, n), n = n.sibling
        }

        function pl(e, t, n) {
            if (qe && typeof qe.onCommitFiberUnmount == `function`) try {
                qe.onCommitFiberUnmount(Ke, n)
            } catch {}
            switch (n.tag) {
                case 26:
                    V || Xc(n, t), fl(e, t, n), n.memoizedState ? n.memoizedState.count-- : n.stateNode && (n = n.stateNode, n.parentNode.removeChild(n));
                    break;
                case 27:
                    V || Xc(n, t);
                    var r = H,
                        i = dl;
                    Zd(n.type) && (H = n.stateNode, dl = !1), fl(e, t, n), pf(n.stateNode), H = r, dl = i;
                    break;
                case 5:
                    V || Xc(n, t);
                case 6:
                    if (r = H, i = dl, H = null, fl(e, t, n), H = r, dl = i, H !== null)
                        if (dl) try {
                            (H.nodeType === 9 ? H.body : H.nodeName === `HTML` ? H.ownerDocument.body : H).removeChild(n.stateNode)
                        } catch (e) {
                            X(n, t, e)
                        } else try {
                            H.removeChild(n.stateNode)
                        } catch (e) {
                            X(n, t, e)
                        }
                    break;
                case 18:
                    H !== null && (dl ? (e = H, Qd(e.nodeType === 9 ? e.body : e.nodeName === `HTML` ? e.ownerDocument.body : e, n.stateNode), Np(e)) : Qd(H, n.stateNode));
                    break;
                case 4:
                    r = H, i = dl, H = n.stateNode.containerInfo, dl = !0, fl(e, t, n), H = r, dl = i;
                    break;
                case 0:
                case 11:
                case 14:
                case 15:
                    Kc(2, n, t), V || Kc(4, n, t), fl(e, t, n);
                    break;
                case 1:
                    V || (Xc(n, t), r = n.stateNode, typeof r.componentWillUnmount == `function` && Jc(n, t, r)), fl(e, t, n);
                    break;
                case 21:
                    fl(e, t, n);
                    break;
                case 22:
                    V = (r = V) || n.memoizedState !== null, fl(e, t, n), V = r;
                    break;
                default:
                    fl(e, t, n)
            }
        }

        function ml(e, t) {
            if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
                e = e.dehydrated;
                try {
                    Np(e)
                } catch (e) {
                    X(t, t.return, e)
                }
            }
        }

        function hl(e, t) {
            if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
                Np(e)
            } catch (e) {
                X(t, t.return, e)
            }
        }

        function gl(e) {
            switch (e.tag) {
                case 31:
                case 13:
                case 19:
                    var t = e.stateNode;
                    return t === null && (t = e.stateNode = new ol), t;
                case 22:
                    return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new ol), t;
                default:
                    throw Error(i(435, e.tag))
            }
        }

        function _l(e, t) {
            var n = gl(e);
            t.forEach(function(t) {
                if (!n.has(t)) {
                    n.add(t);
                    var r = Xu.bind(null, e, t);
                    t.then(r, r)
                }
            })
        }

        function vl(e, t) {
            var n = t.deletions;
            if (n !== null)
                for (var r = 0; r < n.length; r++) {
                    var a = n[r],
                        o = e,
                        s = t,
                        c = s;
                    a: for (; c !== null;) {
                        switch (c.tag) {
                            case 27:
                                if (Zd(c.type)) {
                                    H = c.stateNode, dl = !1;
                                    break a
                                }
                                break;
                            case 5:
                                H = c.stateNode, dl = !1;
                                break a;
                            case 3:
                            case 4:
                                H = c.stateNode.containerInfo, dl = !0;
                                break a
                        }
                        c = c.return
                    }
                    if (H === null) throw Error(i(160));
                    pl(o, s, a), H = null, dl = !1, o = a.alternate, o !== null && (o.return = null), a.return = null
                }
            if (t.subtreeFlags & 13886)
                for (t = t.child; t !== null;) bl(t, e), t = t.sibling
        }
        var yl = null;

        function bl(e, t) {
            var n = e.alternate,
                r = e.flags;
            switch (e.tag) {
                case 0:
                case 11:
                case 14:
                case 15:
                    vl(t, e), xl(e), r & 4 && (Kc(3, e, e.return), Gc(3, e), Kc(5, e, e.return));
                    break;
                case 1:
                    vl(t, e), xl(e), r & 512 && (V || n === null || Xc(n, n.return)), r & 64 && il && (e = e.updateQueue, e !== null && (r = e.callbacks, r !== null && (n = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = n === null ? r : n.concat(r))));
                    break;
                case 26:
                    var a = yl;
                    if (vl(t, e), xl(e), r & 512 && (V || n === null || Xc(n, n.return)), r & 4) {
                        var o = n === null ? null : n.memoizedState;
                        if (r = e.memoizedState, n === null)
                            if (r === null)
                                if (e.stateNode === null) {
                                    a: {
                                        r = e.type,
                                        n = e.memoizedProps,
                                        a = a.ownerDocument || a;b: switch (r) {
                                            case `title`:
                                                o = a.getElementsByTagName(`title`)[0], (!o || o[Tt] || o[vt] || o.namespaceURI === `http://www.w3.org/2000/svg` || o.hasAttribute(`itemprop`)) && (o = a.createElement(r), a.head.insertBefore(o, a.querySelector(`head > title`))), Pd(o, r, n), o[vt] = e, jt(o), r = o;
                                                break a;
                                            case `link`:
                                                var s = Vf(`link`, `href`, a).get(r + (n.href || ``));
                                                if (s) {
                                                    for (var c = 0; c < s.length; c++)
                                                        if (o = s[c], o.getAttribute(`href`) === (n.href == null || n.href === `` ? null : n.href) && o.getAttribute(`rel`) === (n.rel == null ? null : n.rel) && o.getAttribute(`title`) === (n.title == null ? null : n.title) && o.getAttribute(`crossorigin`) === (n.crossOrigin == null ? null : n.crossOrigin)) {
                                                            s.splice(c, 1);
                                                            break b
                                                        }
                                                }
                                                o = a.createElement(r), Pd(o, r, n), a.head.appendChild(o);
                                                break;
                                            case `meta`:
                                                if (s = Vf(`meta`, `content`, a).get(r + (n.content || ``))) {
                                                    for (c = 0; c < s.length; c++)
                                                        if (o = s[c], o.getAttribute(`content`) === (n.content == null ? null : `` + n.content) && o.getAttribute(`name`) === (n.name == null ? null : n.name) && o.getAttribute(`property`) === (n.property == null ? null : n.property) && o.getAttribute(`http-equiv`) === (n.httpEquiv == null ? null : n.httpEquiv) && o.getAttribute(`charset`) === (n.charSet == null ? null : n.charSet)) {
                                                            s.splice(c, 1);
                                                            break b
                                                        }
                                                }
                                                o = a.createElement(r), Pd(o, r, n), a.head.appendChild(o);
                                                break;
                                            default:
                                                throw Error(i(468, r))
                                        }
                                        o[vt] = e,
                                        jt(o),
                                        r = o
                                    }
                                    e.stateNode = r
                                }
                        else Hf(a, e.type, e.stateNode);
                        else e.stateNode = If(a, r, e.memoizedProps);
                        else o === r ? r === null && e.stateNode !== null && Qc(e, e.memoizedProps, n.memoizedProps) : (o === null ? n.stateNode !== null && (n = n.stateNode, n.parentNode.removeChild(n)) : o.count--, r === null ? Hf(a, e.type, e.stateNode) : If(a, r, e.memoizedProps))
                    }
                    break;
                case 27:
                    vl(t, e), xl(e), r & 512 && (V || n === null || Xc(n, n.return)), n !== null && r & 4 && Qc(e, e.memoizedProps, n.memoizedProps);
                    break;
                case 5:
                    if (vl(t, e), xl(e), r & 512 && (V || n === null || Xc(n, n.return)), e.flags & 32) {
                        a = e.stateNode;
                        try {
                            nn(a, ``)
                        } catch (t) {
                            X(e, e.return, t)
                        }
                    }
                    r & 4 && e.stateNode != null && (a = e.memoizedProps, Qc(e, a, n === null ? a : n.memoizedProps)), r & 1024 && (al = !0);
                    break;
                case 6:
                    if (vl(t, e), xl(e), r & 4) {
                        if (e.stateNode === null) throw Error(i(162));
                        r = e.memoizedProps, n = e.stateNode;
                        try {
                            n.nodeValue = r
                        } catch (t) {
                            X(e, e.return, t)
                        }
                    }
                    break;
                case 3:
                    if (Bf = null, a = yl, yl = gf(t.containerInfo), vl(t, e), yl = a, xl(e), r & 4 && n !== null && n.memoizedState.isDehydrated) try {
                        Np(t.containerInfo)
                    } catch (t) {
                        X(e, e.return, t)
                    }
                    al && (al = !1, Sl(e));
                    break;
                case 4:
                    r = yl, yl = gf(e.stateNode.containerInfo), vl(t, e), xl(e), yl = r;
                    break;
                case 12:
                    vl(t, e), xl(e);
                    break;
                case 31:
                    vl(t, e), xl(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, _l(e, r)));
                    break;
                case 13:
                    vl(t, e), xl(e), e.child.flags & 8192 && e.memoizedState !== null != (n !== null && n.memoizedState !== null) && (tu = T()), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, _l(e, r)));
                    break;
                case 22:
                    a = e.memoizedState !== null;
                    var l = n !== null && n.memoizedState !== null,
                        u = il,
                        d = V;
                    if (il = u || a, V = d || l, vl(t, e), V = d, il = u, xl(e), r & 8192) a: for (t = e.stateNode, t._visibility = a ? t._visibility & -2 : t._visibility | 1, a && (n === null || l || il || V || wl(e)), n = null, t = e;;) {
                        if (t.tag === 5 || t.tag === 26) {
                            if (n === null) {
                                l = n = t;
                                try {
                                    if (o = l.stateNode, a) s = o.style, typeof s.setProperty == `function` ? s.setProperty(`display`, `none`, `important`) : s.display = `none`;
                                    else {
                                        c = l.stateNode;
                                        var f = l.memoizedProps.style,
                                            p = f != null && f.hasOwnProperty(`display`) ? f.display : null;
                                        c.style.display = p == null || typeof p == `boolean` ? `` : (`` + p).trim()
                                    }
                                } catch (e) {
                                    X(l, l.return, e)
                                }
                            }
                        } else if (t.tag === 6) {
                            if (n === null) {
                                l = t;
                                try {
                                    l.stateNode.nodeValue = a ? `` : l.memoizedProps
                                } catch (e) {
                                    X(l, l.return, e)
                                }
                            }
                        } else if (t.tag === 18) {
                            if (n === null) {
                                l = t;
                                try {
                                    var m = l.stateNode;
                                    a ? $d(m, !0) : $d(l.stateNode, !1)
                                } catch (e) {
                                    X(l, l.return, e)
                                }
                            }
                        } else if ((t.tag !== 22 && t.tag !== 23 || t.memoizedState === null || t === e) && t.child !== null) {
                            t.child.return = t, t = t.child;
                            continue
                        }
                        if (t === e) break a;
                        for (; t.sibling === null;) {
                            if (t.return === null || t.return === e) break a;
                            n === t && (n = null), t = t.return
                        }
                        n === t && (n = null), t.sibling.return = t.return, t = t.sibling
                    }
                    r & 4 && (r = e.updateQueue, r !== null && (n = r.retryQueue, n !== null && (r.retryQueue = null, _l(e, n))));
                    break;
                case 19:
                    vl(t, e), xl(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, _l(e, r)));
                    break;
                case 30:
                    break;
                case 21:
                    break;
                default:
                    vl(t, e), xl(e)
            }
        }

        function xl(e) {
            var t = e.flags;
            if (t & 2) {
                try {
                    for (var n, r = e.return; r !== null;) {
                        if ($c(r)) {
                            n = r;
                            break
                        }
                        r = r.return
                    }
                    if (n == null) throw Error(i(160));
                    switch (n.tag) {
                        case 27:
                            var a = n.stateNode;
                            nl(e, el(e), a);
                            break;
                        case 5:
                            var o = n.stateNode;
                            n.flags & 32 && (nn(o, ``), n.flags &= -33), nl(e, el(e), o);
                            break;
                        case 3:
                        case 4:
                            var s = n.stateNode.containerInfo;
                            tl(e, el(e), s);
                            break;
                        default:
                            throw Error(i(161))
                    }
                } catch (t) {
                    X(e, e.return, t)
                }
                e.flags &= -3
            }
            t & 4096 && (e.flags &= -4097)
        }

        function Sl(e) {
            if (e.subtreeFlags & 1024)
                for (e = e.child; e !== null;) {
                    var t = e;
                    Sl(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling
                }
        }

        function Cl(e, t) {
            if (t.subtreeFlags & 8772)
                for (t = t.child; t !== null;) ll(e, t.alternate, t), t = t.sibling
        }

        function wl(e) {
            for (e = e.child; e !== null;) {
                var t = e;
                switch (t.tag) {
                    case 0:
                    case 11:
                    case 14:
                    case 15:
                        Kc(4, t, t.return), wl(t);
                        break;
                    case 1:
                        Xc(t, t.return);
                        var n = t.stateNode;
                        typeof n.componentWillUnmount == `function` && Jc(t, t.return, n), wl(t);
                        break;
                    case 27:
                        pf(t.stateNode);
                    case 26:
                    case 5:
                        Xc(t, t.return), wl(t);
                        break;
                    case 22:
                        t.memoizedState === null && wl(t);
                        break;
                    case 30:
                        wl(t);
                        break;
                    default:
                        wl(t)
                }
                e = e.sibling
            }
        }

        function Tl(e, t, n) {
            for (n && = (t.subtreeFlags & 8772) != 0, t = t.child; t !== null;) {
                var r = t.alternate,
                    i = e,
                    a = t,
                    o = a.flags;
                switch (a.tag) {
                    case 0:
                    case 11:
                    case 15:
                        Tl(i, a, n), Gc(4, a);
                        break;
                    case 1:
                        if (Tl(i, a, n), r = a, i = r.stateNode, typeof i.componentDidMount == `function`) try {
                            i.componentDidMount()
                        } catch (e) {
                            X(r, r.return, e)
                        }
                        if (r = a, i = r.updateQueue, i !== null) {
                            var s = r.stateNode;
                            try {
                                var c = i.shared.hiddenCallbacks;
                                if (c !== null)
                                    for (i.shared.hiddenCallbacks = null, i = 0; i < c.length; i++) ro(c[i], s)
                            } catch (e) {
                                X(r, r.return, e)
                            }
                        }
                        n && o & 64 && qc(a), Yc(a, a.return);
                        break;
                    case 27:
                        rl(a);
                    case 26:
                    case 5:
                        Tl(i, a, n), n && r === null && o & 4 && Zc(a), Yc(a, a.return);
                        break;
                    case 12:
                        Tl(i, a, n);
                        break;
                    case 31:
                        Tl(i, a, n), n && o & 4 && ml(i, a);
                        break;
                    case 13:
                        Tl(i, a, n), n && o & 4 && hl(i, a);
                        break;
                    case 22:
                        a.memoizedState === null && Tl(i, a, n), Yc(a, a.return);
                        break;
                    case 30:
                        break;
                    default:
                        Tl(i, a, n)
                }
                t = t.sibling
            }
        }

        function El(e, t) {
            var n = null;
            e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && j(n))
        }

        function Dl(e, t) {
            e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && j(e))
        }

        function Ol(e, t, n, r) {
            if (t.subtreeFlags & 10256)
                for (t = t.child; t !== null;) kl(e, t, n, r), t = t.sibling
        }

        function kl(e, t, n, r) {
            var i = t.flags;
            switch (t.tag) {
                case 0:
                case 11:
                case 15:
                    Ol(e, t, n, r), i & 2048 && Gc(9, t);
                    break;
                case 1:
                    Ol(e, t, n, r);
                    break;
                case 3:
                    Ol(e, t, n, r), i & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && j(e)));
                    break;
                case 12:
                    if (i & 2048) {
                        Ol(e, t, n, r), e = t.stateNode;
                        try {
                            var a = t.memoizedProps,
                                o = a.id,
                                s = a.onPostCommit;
                            typeof s == `function` && s(o, t.alternate === null ? `mount` : `update`, e.passiveEffectDuration, -0)
                        } catch (e) {
                            X(t, t.return, e)
                        }
                    } else Ol(e, t, n, r);
                    break;
                case 31:
                    Ol(e, t, n, r);
                    break;
                case 13:
                    Ol(e, t, n, r);
                    break;
                case 23:
                    break;
                case 22:
                    a = t.stateNode, o = t.alternate, t.memoizedState === null ? a._visibility & 2 ? Ol(e, t, n, r) : (a._visibility |= 2, Al(e, t, n, r, (t.subtreeFlags & 10256) != 0 || !1)) : a._visibility & 2 ? Ol(e, t, n, r) : jl(e, t), i & 2048 && El(o, t);
                    break;
                case 24:
                    Ol(e, t, n, r), i & 2048 && Dl(t.alternate, t);
                    break;
                default:
                    Ol(e, t, n, r)
            }
        }

        function Al(e, t, n, r, i) {
            for (i && = (t.subtreeFlags & 10256) != 0 || !1, t = t.child; t !== null;) {
                var a = e,
                    o = t,
                    s = n,
                    c = r,
                    l = o.flags;
                switch (o.tag) {
                    case 0:
                    case 11:
                    case 15:
                        Al(a, o, s, c, i), Gc(8, o);
                        break;
                    case 23:
                        break;
                    case 22:
                        var u = o.stateNode;
                        o.memoizedState === null ? (u._visibility |= 2, Al(a, o, s, c, i)) : u._visibility & 2 ? Al(a, o, s, c, i) : jl(a, o), i && l & 2048 && El(o.alternate, o);
                        break;
                    case 24:
                        Al(a, o, s, c, i), i && l & 2048 && Dl(o.alternate, o);
                        break;
                    default:
                        Al(a, o, s, c, i)
                }
                t = t.sibling
            }
        }

        function jl(e, t) {
            if (t.subtreeFlags & 10256)
                for (t = t.child; t !== null;) {
                    var n = e,
                        r = t,
                        i = r.flags;
                    switch (r.tag) {
                        case 22:
                            jl(n, r), i & 2048 && El(r.alternate, r);
                            break;
                        case 24:
                            jl(n, r), i & 2048 && Dl(r.alternate, r);
                            break;
                        default:
                            jl(n, r)
                    }
                    t = t.sibling
                }
        }
        var Ml = 8192;

        function Nl(e, t, n) {
            if (e.subtreeFlags & Ml)
                for (e = e.child; e !== null;) Pl(e, t, n), e = e.sibling
        }

        function Pl(e, t, n) {
            switch (e.tag) {
                case 26:
                    Nl(e, t, n), e.flags & Ml && e.memoizedState !== null && Gf(n, yl, e.memoizedState, e.memoizedProps);
                    break;
                case 5:
                    Nl(e, t, n);
                    break;
                case 3:
                case 4:
                    var r = yl;
                    yl = gf(e.stateNode.containerInfo), Nl(e, t, n), yl = r;
                    break;
                case 22:
                    e.memoizedState === null && (r = e.alternate, r !== null && r.memoizedState !== null ? (r = Ml, Ml = 16777216, Nl(e, t, n), Ml = r) : Nl(e, t, n));
                    break;
                default:
                    Nl(e, t, n)
            }
        }

        function Fl(e) {
            var t = e.alternate;
            if (t !== null && (e = t.child, e !== null)) {
                t.child = null;
                do t = e.sibling, e.sibling = null, e = t; while (e !== null)
            }
        }

        function Il(e) {
            var t = e.deletions;
            if (e.flags & 16) {
                if (t !== null)
                    for (var n = 0; n < t.length; n++) {
                        var r = t[n];
                        sl = r, zl(r, e)
                    }
                Fl(e)
            }
            if (e.subtreeFlags & 10256)
                for (e = e.child; e !== null;) Ll(e), e = e.sibling
        }

        function Ll(e) {
            switch (e.tag) {
                case 0:
                case 11:
                case 15:
                    Il(e), e.flags & 2048 && Kc(9, e, e.return);
                    break;
                case 3:
                    Il(e);
                    break;
                case 12:
                    Il(e);
                    break;
                case 22:
                    var t = e.stateNode;
                    e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Rl(e)) : Il(e);
                    break;
                default:
                    Il(e)
            }
        }

        function Rl(e) {
            var t = e.deletions;
            if (e.flags & 16) {
                if (t !== null)
                    for (var n = 0; n < t.length; n++) {
                        var r = t[n];
                        sl = r, zl(r, e)
                    }
                Fl(e)
            }
            for (e = e.child; e !== null;) {
                switch (t = e, t.tag) {
                    case 0:
                    case 11:
                    case 15:
                        Kc(8, t, t.return), Rl(t);
                        break;
                    case 22:
                        n = t.stateNode, n._visibility & 2 && (n._visibility &= -3, Rl(t));
                        break;
                    default:
                        Rl(t)
                }
                e = e.sibling
            }
        }

        function zl(e, t) {
            for (; sl !== null;) {
                var n = sl;
                switch (n.tag) {
                    case 0:
                    case 11:
                    case 15:
                        Kc(8, n, t);
                        break;
                    case 23:
                    case 22:
                        if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
                            var r = n.memoizedState.cachePool.pool;
                            r != null && r.refCount++
                        }
                        break;
                    case 24:
                        j(n.memoizedState.cache)
                }
                if (r = n.child, r !== null) r.return = n, sl = r;
                else a: for (n = e; sl !== null;) {
                    r = sl;
                    var i = r.sibling,
                        a = r.return;
                    if (ul(r), r === n) {
                        sl = null;
                        break a
                    }
                    if (i !== null) {
                        i.return = a, sl = i;
                        break a
                    }
                    sl = a
                }
            }
        }
        var Bl = {
                getCacheForType: function(e) {
                    var t = da(A),
                        n = t.data.get(e);
                    return n === void 0 && (n = e(), t.data.set(e, n)), n
                },
                cacheSignal: function() {
                    return da(A).controller.signal
                }
            },
            Vl = typeof WeakMap == `function` ? WeakMap : Map,
            U = 0,
            W = null,
            G = null,
            K = 0,
            q = 0,
            Hl = null,
            Ul = !1,
            Wl = !1,
            Gl = !1,
            Kl = 0,
            J = 0,
            ql = 0,
            Jl = 0,
            Yl = 0,
            Xl = 0,
            Zl = 0,
            Ql = null,
            $l = null,
            eu = !1,
            tu = 0,
            nu = 0,
            ru = 1 / 0,
            iu = null,
            au = null,
            Y = 0,
            ou = null,
            su = null,
            cu = 0,
            lu = 0,
            uu = null,
            du = null,
            fu = 0,
            pu = null;

        function mu() {
            return U & 2 && K !== 0 ? K & -K : S.T === null ? ht() : dd()
        }

        function hu() {
            if (Xl === 0)
                if (!(K & 536870912) || k) {
                    var e = et;
                    et <<= 1, !(et & 3932160) && (et = 262144), Xl = e
                } else Xl = 536870912;
            return e = uo.current, e !== null && (e.flags |= 32), Xl
        }

        function gu(e, t, n) {
            (e === W && (q === 2 || q === 9) || e.cancelPendingCommit !== null) && (Cu(e, 0), bu(e, K, Xl, !1)), ct(e, n), (!(U & 2) || e !== W) && (e === W && (!(U & 2) && (Jl |= n), J === 4 && bu(e, K, Xl, !1)), rd(e))
        }

        function _u(e, t, n) {
            if (U & 6) throw Error(i(327));
            var r = !n && (t & 127) == 0 && (t & e.expiredLanes) === 0 || it(e, t),
                a = r ? ju(e, t) : ku(e, t, !0),
                o = r;
            do {
                if (a === 0) {
                    Wl && !r && bu(e, t, 0, !1);
                    break
                } else {
                    if (n = e.current.alternate, o && !yu(n)) {
                        a = ku(e, t, !1), o = !1;
                        continue
                    }
                    if (a === 2) {
                        if (o = t, e.errorRecoveryDisabledLanes & o) var s = 0;
                        else s = e.pendingLanes & -536870913, s = s === 0 ? s & 536870912 ? 536870912 : 0 : s;
                        if (s !== 0) {
                            t = s;
                            a: {
                                var c = e;a = Ql;
                                var l = c.current.memoizedState.isDehydrated;
                                if (l && (Cu(c, s).flags |= 256), s = ku(c, s, !1), s !== 2) {
                                    if (Gl && !l) {
                                        c.errorRecoveryDisabledLanes |= o, Jl |= o, a = 4;
                                        break a
                                    }
                                    o = $l, $l = a, o !== null && ($l === null ? $l = o : $l.push.apply($l, o))
                                }
                                a = s
                            }
                            if (o = !1, a !== 2) continue
                        }
                    }
                    if (a === 1) {
                        Cu(e, 0), bu(e, t, 0, !0);
                        break
                    }
                    a: {
                        switch (r = e, o = a, o) {
                            case 0:
                            case 1:
                                throw Error(i(345));
                            case 4:
                                if ((t & 4194048) !== t) break;
                            case 6:
                                bu(r, t, Xl, !Ul);
                                break a;
                            case 2:
                                $l = null;
                                break;
                            case 3:
                            case 5:
                                break;
                            default:
                                throw Error(i(329))
                        }
                        if ((t & 62914560) === t && (a = tu + 300 - T(), 10 < a)) {
                            if (bu(r, t, Xl, !Ul), rt(r, 0, !0) !== 0) break a;
                            cu = t, r.timeoutHandle = Kd(vu.bind(null, r, n, $l, iu, eu, t, Xl, Jl, Zl, Ul, o, `Throttled`, -0, 0), a);
                            break a
                        }
                        vu(r, n, $l, iu, eu, t, Xl, Jl, Zl, Ul, o, null, -0, 0)
                    }
                }
                break
            } while (1);
            rd(e)
        }

        function vu(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
            if (e.timeoutHandle = -1, d = t.subtreeFlags, d & 8192 || (d & 16785408) == 16785408) {
                d = {
                    stylesheets: null,
                    count: 0,
                    imgCount: 0,
                    imgBytes: 0,
                    suspenseyImages: [],
                    waitingForImages: !0,
                    waitingForViewTransition: !1,
                    unsuspend: dn
                }, Pl(t, a, d);
                var m = (a & 62914560) === a ? tu - T() : (a & 4194048) === a ? nu - T() : 0;
                if (m = qf(d, m), m !== null) {
                    cu = a, e.cancelPendingCommit = m(Ru.bind(null, e, t, a, n, r, i, o, s, c, u, d, null, f, p)), bu(e, a, o, !l);
                    return
                }
            }
            Ru(e, t, a, n, r, i, o, s, c)
        }

        function yu(e) {
            for (var t = e;;) {
                var n = t.tag;
                if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue, n !== null && (n = n.stores, n !== null)))
                    for (var r = 0; r < n.length; r++) {
                        var i = n[r],
                            a = i.getSnapshot;
                        i = i.value;
                        try {
                            if (!Nr(a(), i)) return !1
                        } catch {
                            return !1
                        }
                    }
                if (n = t.child, t.subtreeFlags & 16384 && n !== null) n.return = t, t = n;
                else {
                    if (t === e) break;
                    for (; t.sibling === null;) {
                        if (t.return === null || t.return === e) return !0;
                        t = t.return
                    }
                    t.sibling.return = t.return, t = t.sibling
                }
            }
            return !0
        }

        function bu(e, t, n, r) {
            t &= ~Yl, t &= ~Jl, e.suspendedLanes |= t, e.pingedLanes &= ~t, r && (e.warmLanes |= t), r = e.expirationTimes;
            for (var i = t; 0 < i;) {
                var a = 31 - Ye(i),
                    o = 1 << a;
                r[a] = -1, i &= ~o
            }
            n !== 0 && ut(e, n, t)
        }

        function xu() {
            return U & 6 ? !0 : (id(0, !1), !1)
        }

        function Su() {
            if (G !== null) {
                if (q === 0) var e = G.return;
                else e = G, ra = na = null, Po(e), Ba = null, Va = 0, e = G;
                for (; e !== null;) Wc(e.alternate, e), e = e.return;
                G = null
            }
        }

        function Cu(e, t) {
            var n = e.timeoutHandle;
            n !== -1 && (e.timeoutHandle = -1, qd(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), cu = 0, Su(), W = e, G = n = xi(e.current, null), K = t, q = 0, Hl = null, Ul = !1, Wl = it(e, t), Gl = !1, Zl = Xl = Yl = Jl = ql = J = 0, $l = Ql = null, eu = !1, t & 8 && (t |= t & 32);
            var r = e.entangledLanes;
            if (r !== 0)
                for (e = e.entanglements, r &= t; 0 < r;) {
                    var i = 31 - Ye(r),
                        a = 1 << i;
                    t |= e[i], r &= ~a
                }
            return Kl = t, di(), n
        }

        function wu(e, t) {
            P = null, S.H = Us, t === Aa || t === Ma ? (t = Ra(), q = 3) : t === ja ? (t = Ra(), q = 4) : q = t === sc ? 8 : typeof t == `object` && t && typeof t.then == `function` ? 6 : 1, Hl = t, G === null && (J = 1, tc(e, ki(t, e.current)))
        }

        function Tu() {
            var e = uo.current;
            return e === null ? !0 : (K & 4194048) === K ? fo === null : (K & 62914560) === K || K & 536870912 ? e === fo : !1
        }

        function Eu() {
            var e = S.H;
            return S.H = Us, e === null ? Us : e
        }

        function Du() {
            var e = S.A;
            return S.A = Bl, e
        }

        function Ou() {
            J = 4, Ul || (K & 4194048) !== K && uo.current !== null || (Wl = !0), !(ql & 134217727) && !(Jl & 134217727) || W === null || bu(W, K, Xl, !1)
        }

        function ku(e, t, n) {
            var r = U;
            U |= 2;
            var i = Eu(),
                a = Du();
            (W !== e || K !== t) && (iu = null, Cu(e, t)), t = !1;
            var o = J;
            a: do try {
                    if (q !== 0 && G !== null) {
                        var s = G,
                            c = Hl;
                        switch (q) {
                            case 8:
                                Su(), o = 6;
                                break a;
                            case 3:
                            case 2:
                            case 9:
                            case 6:
                                uo.current === null && (t = !0);
                                var l = q;
                                if (q = 0, Hl = null, Fu(e, s, c, l), n && Wl) {
                                    o = 0;
                                    break a
                                }
                                break;
                            default:
                                l = q, q = 0, Hl = null, Fu(e, s, c, l)
                        }
                    }
                    Au(), o = J;
                    break
                } catch (t) {
                    wu(e, t)
                }
                while (1);
                return t && e.shellSuspendCounter++, ra = na = null, U = r, S.H = i, S.A = a, G === null && (W = null, K = 0, di()), o
        }

        function Au() {
            for (; G !== null;) Nu(G)
        }

        function ju(e, t) {
            var n = U;
            U |= 2;
            var r = Eu(),
                a = Du();
            W !== e || K !== t ? (iu = null, ru = T() + 500, Cu(e, t)) : Wl = it(e, t);
            a: do try {
                    if (q !== 0 && G !== null) {
                        t = G;
                        var o = Hl;
                        b: switch (q) {
                            case 1:
                                q = 0, Hl = null, Fu(e, t, o, 1);
                                break;
                            case 2:
                            case 9:
                                if (Pa(o)) {
                                    q = 0, Hl = null, Pu(t);
                                    break
                                }
                                t = function() {
                                    q !== 2 && q !== 9 || W !== e || (q = 7), rd(e)
                                }, o.then(t, t);
                                break a;
                            case 3:
                                q = 7;
                                break a;
                            case 4:
                                q = 5;
                                break a;
                            case 7:
                                Pa(o) ? (q = 0, Hl = null, Pu(t)) : (q = 0, Hl = null, Fu(e, t, o, 7));
                                break;
                            case 5:
                                var s = null;
                                switch (G.tag) {
                                    case 26:
                                        s = G.memoizedState;
                                    case 5:
                                    case 27:
                                        var c = G;
                                        if (s ? Wf(s) : c.stateNode.complete) {
                                            q = 0, Hl = null;
                                            var l = c.sibling;
                                            if (l !== null) G = l;
                                            else {
                                                var u = c.return;
                                                u === null ? G = null : (G = u, Iu(u))
                                            }
                                            break b
                                        }
                                }
                                q = 0, Hl = null, Fu(e, t, o, 5);
                                break;
                            case 6:
                                q = 0, Hl = null, Fu(e, t, o, 6);
                                break;
                            case 8:
                                Su(), J = 6;
                                break a;
                            default:
                                throw Error(i(462))
                        }
                    }
                    Mu();
                    break
                } catch (t) {
                    wu(e, t)
                }
                while (1);
                return ra = na = null, S.H = r, S.A = a, U = n, G === null ? (W = null, K = 0, di(), J) : 0
        }

        function Mu() {
            for (; G !== null && !Le();) Nu(G)
        }

        function Nu(e) {
            var t = Ic(e.alternate, e, Kl);
            e.memoizedProps = e.pendingProps, t === null ? Iu(e) : G = t
        }

        function Pu(e) {
            var t = e,
                n = t.alternate;
            switch (t.tag) {
                case 15:
                case 0:
                    t = bc(n, t, t.pendingProps, t.type, void 0, K);
                    break;
                case 11:
                    t = bc(n, t, t.pendingProps, t.type.render, t.ref, K);
                    break;
                case 5:
                    Po(t);
                default:
                    Wc(n, t), t = G = Si(t, Kl), t = Ic(n, t, Kl)
            }
            e.memoizedProps = e.pendingProps, t === null ? Iu(e) : G = t
        }

        function Fu(e, t, n, r) {
            ra = na = null, Po(t), Ba = null, Va = 0;
            var i = t.return;
            try {
                if (oc(e, i, t, n, K)) {
                    J = 1, tc(e, ki(n, e.current)), G = null;
                    return
                }
            } catch (t) {
                if (i !== null) throw G = i, t;
                J = 1, tc(e, ki(n, e.current)), G = null;
                return
            }
            t.flags & 32768 ? (k || r === 1 ? e = !0 : Wl || K & 536870912 ? e = !1 : (Ul = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = uo.current, r !== null && r.tag === 13 && (r.flags |= 16384))), Lu(t, e)) : Iu(t)
        }

        function Iu(e) {
            var t = e;
            do {
                if (t.flags & 32768) {
                    Lu(t, Ul);
                    return
                }
                e = t.return;
                var n = Hc(t.alternate, t, Kl);
                if (n !== null) {
                    G = n;
                    return
                }
                if (t = t.sibling, t !== null) {
                    G = t;
                    return
                }
                G = t = e
            } while (t !== null);
            J === 0 && (J = 5)
        }

        function Lu(e, t) {
            do {
                var n = Uc(e.alternate, e);
                if (n !== null) {
                    n.flags &= 32767, G = n;
                    return
                }
                if (n = e.return, n !== null && (n.flags |= 32768, n.subtreeFlags = 0, n.deletions = null), !t && (e = e.sibling, e !== null)) {
                    G = e;
                    return
                }
                G = e = n
            } while (e !== null);
            J = 6, G = null
        }

        function Ru(e, t, n, r, a, o, s, c, l) {
            e.cancelPendingCommit = null;
            do Uu(); while (Y !== 0);
            if (U & 6) throw Error(i(327));
            if (t !== null) {
                if (t === e.current) throw Error(i(177));
                if (o = t.lanes | t.childLanes, o |= ui, lt(e, n, o, s, c, l), e === W && (G = W = null, K = 0), su = t, ou = e, cu = n, lu = o, uu = a, du = r, t.subtreeFlags & 10256 || t.flags & 10256 ? (e.callbackNode = null, e.callbackPriority = 0, Zu(E, function() {
                        return Wu(), null
                    })) : (e.callbackNode = null, e.callbackPriority = 0), r = (t.flags & 13878) != 0, t.subtreeFlags & 13878 || r) {
                    r = S.T, S.T = null, a = C.p, C.p = 2, s = U, U |= 4;
                    try {
                        cl(e, t, n)
                    } finally {
                        U = s, C.p = a, S.T = r
                    }
                }
                Y = 1, zu(), Bu(), Vu()
            }
        }

        function zu() {
            if (Y === 1) {
                Y = 0;
                var e = ou,
                    t = su,
                    n = (t.flags & 13878) != 0;
                if (t.subtreeFlags & 13878 || n) {
                    n = S.T, S.T = null;
                    var r = C.p;
                    C.p = 2;
                    var i = U;
                    U |= 4;
                    try {
                        bl(t, e);
                        var a = zd,
                            o = Rr(e.containerInfo),
                            s = a.focusedElem,
                            c = a.selectionRange;
                        if (o !== s && s && s.ownerDocument && Lr(s.ownerDocument.documentElement, s)) {
                            if (c !== null && zr(s)) {
                                var l = c.start,
                                    u = c.end;
                                if (u === void 0 && (u = l), `selectionStart` in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
                                else {
                                    var d = s.ownerDocument || document,
                                        f = d && d.defaultView || window;
                                    if (f.getSelection) {
                                        var p = f.getSelection(),
                                            m = s.textContent.length,
                                            h = Math.min(c.start, m),
                                            g = c.end === void 0 ? h : Math.min(c.end, m);
                                        !p.extend && h > g && (o = g, g = h, h = o);
                                        var _ = Ir(s, h),
                                            v = Ir(s, g);
                                        if (_ && v && (p.rangeCount !== 1 || p.anchorNode !== _.node || p.anchorOffset !== _.offset || p.focusNode !== v.node || p.focusOffset !== v.offset)) {
                                            var y = d.createRange();
                                            y.setStart(_.node, _.offset), p.removeAllRanges(), h > g ? (p.addRange(y), p.extend(v.node, v.offset)) : (y.setEnd(v.node, v.offset), p.addRange(y))
                                        }
                                    }
                                }
                            }
                            for (d = [], p = s; p = p.parentNode;) p.nodeType === 1 && d.push({
                                element: p,
                                left: p.scrollLeft,
                                top: p.scrollTop
                            });
                            for (typeof s.focus == `function` && s.focus(), s = 0; s < d.length; s++) {
                                var b = d[s];
                                b.element.scrollLeft = b.left, b.element.scrollTop = b.top
                            }
                        }
                        sp = !!Rd, zd = Rd = null
                    } finally {
                        U = i, C.p = r, S.T = n
                    }
                }
                e.current = t, Y = 2
            }
        }

        function Bu() {
            if (Y === 2) {
                Y = 0;
                var e = ou,
                    t = su,
                    n = (t.flags & 8772) != 0;
                if (t.subtreeFlags & 8772 || n) {
                    n = S.T, S.T = null;
                    var r = C.p;
                    C.p = 2;
                    var i = U;
                    U |= 4;
                    try {
                        ll(e, t.alternate, t)
                    } finally {
                        U = i, C.p = r, S.T = n
                    }
                }
                Y = 3
            }
        }

        function Vu() {
            if (Y === 4 || Y === 3) {
                Y = 0, Re();
                var e = ou,
                    t = su,
                    n = cu,
                    r = du;
                t.subtreeFlags & 10256 || t.flags & 10256 ? Y = 5 : (Y = 0, su = ou = null, Hu(e, e.pendingLanes));
                var i = e.pendingLanes;
                if (i === 0 && (au = null), mt(n), t = t.stateNode, qe && typeof qe.onCommitFiberRoot == `function`) try {
                    qe.onCommitFiberRoot(Ke, t, void 0, (t.current.flags & 128) == 128)
                } catch {}
                if (r !== null) {
                    t = S.T, i = C.p, C.p = 2, S.T = null;
                    try {
                        for (var a = e.onRecoverableError, o = 0; o < r.length; o++) {
                            var s = r[o];
                            a(s.value, {
                                componentStack: s.stack
                            })
                        }
                    } finally {
                        S.T = t, C.p = i
                    }
                }
                cu & 3 && Uu(), rd(e), i = e.pendingLanes, n & 261930 && i & 42 ? e === pu ? fu++ : (fu = 0, pu = e) : fu = 0, id(0, !1)
            }
        }

        function Hu(e, t) {
            (e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, j(t)))
        }

        function Uu() {
            return zu(), Bu(), Vu(), Wu()
        }

        function Wu() {
            if (Y !== 5) return !1;
            var e = ou,
                t = lu;
            lu = 0;
            var n = mt(cu),
                r = S.T,
                a = C.p;
            try {
                C.p = 32 > n ? 32 : n, S.T = null, n = uu, uu = null;
                var o = ou,
                    s = cu;
                if (Y = 0, su = ou = null, cu = 0, U & 6) throw Error(i(331));
                var c = U;
                if (U |= 4, Ll(o.current), kl(o, o.current, s, n), U = c, id(0, !1), qe && typeof qe.onPostCommitFiberRoot == `function`) try {
                    qe.onPostCommitFiberRoot(Ke, o)
                } catch {}
                return !0
            } finally {
                C.p = a, S.T = r, Hu(e, t)
            }
        }

        function Gu(e, t, n) {
            t = ki(n, t), t = rc(e.stateNode, t, 2), e = Za(e, t, 2), e !== null && (ct(e, 2), rd(e))
        }

        function X(e, t, n) {
            if (e.tag === 3) Gu(e, e, n);
            else
                for (; t !== null;) {
                    if (t.tag === 3) {
                        Gu(t, e, n);
                        break
                    } else if (t.tag === 1) {
                        var r = t.stateNode;
                        if (typeof t.type.getDerivedStateFromError == `function` || typeof r.componentDidCatch == `function` && (au === null || !au.has(r))) {
                            e = ki(n, e), n = ic(2), r = Za(t, n, 2), r !== null && (ac(n, r, t, e), ct(r, 2), rd(r));
                            break
                        }
                    }
                    t = t.return
                }
        }

        function Ku(e, t, n) {
            var r = e.pingCache;
            if (r === null) {
                r = e.pingCache = new Vl;
                var i = new Set;
                r.set(t, i)
            } else i = r.get(t), i === void 0 && (i = new Set, r.set(t, i));
            i.has(n) || (Gl = !0, i.add(n), e = qu.bind(null, e, t, n), t.then(e, e))
        }

        function qu(e, t, n) {
            var r = e.pingCache;
            r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, W === e && (K & n) === n && (J === 4 || J === 3 && (K & 62914560) === K && 300 > T() - tu ? !(U & 2) && Cu(e, 0) : Yl |= n, Zl === K && (Zl = 0)), rd(e)
        }

        function Ju(e, t) {
            t === 0 && (t = ot()), e = mi(e, t), e !== null && (ct(e, t), rd(e))
        }

        function Yu(e) {
            var t = e.memoizedState,
                n = 0;
            t !== null && (n = t.retryLane), Ju(e, n)
        }

        function Xu(e, t) {
            var n = 0;
            switch (e.tag) {
                case 31:
                case 13:
                    var r = e.stateNode,
                        a = e.memoizedState;
                    a !== null && (n = a.retryLane);
                    break;
                case 19:
                    r = e.stateNode;
                    break;
                case 22:
                    r = e.stateNode._retryCache;
                    break;
                default:
                    throw Error(i(314))
            }
            r !== null && r.delete(t), Ju(e, n)
        }

        function Zu(e, t) {
            return Pe(e, t)
        }
        var Qu = null,
            $u = null,
            Z = !1,
            ed = !1,
            td = !1,
            nd = 0;

        function rd(e) {
            e !== $u && e.next === null && ($u === null ? Qu = $u = e : $u = $u.next = e), ed = !0, Z || (Z = !0, ud())
        }

        function id(e, t) {
            if (!td && ed) {
                td = !0;
                do
                    for (var n = !1, r = Qu; r !== null;) {
                        if (!t)
                            if (e !== 0) {
                                var i = r.pendingLanes;
                                if (i === 0) var a = 0;
                                else {
                                    var o = r.suspendedLanes,
                                        s = r.pingedLanes;
                                    a = (1 << 31 - Ye(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0
                                }
                                a !== 0 && (n = !0, ld(r, a))
                            } else a = K, a = rt(r, r === W ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || it(r, a) || (n = !0, ld(r, a));
                        r = r.next
                    }
                while (n);
                td = !1
            }
        }

        function ad() {
            od()
        }

        function od() {
            ed = Z = !1;
            var e = 0;
            nd !== 0 && Gd() && (e = nd);
            for (var t = T(), n = null, r = Qu; r !== null;) {
                var i = r.next,
                    a = sd(r, t);
                a === 0 ? (r.next = null, n === null ? Qu = i : n.next = i, i === null && ($u = n)) : (n = r, (e !== 0 || a & 3) && (ed = !0)), r = i
            }
            Y !== 0 && Y !== 5 || id(e, !1), nd !== 0 && (nd = 0)
        }

        function sd(e, t) {
            for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes & -62914561; 0 < a;) {
                var o = 31 - Ye(a),
                    s = 1 << o,
                    c = i[o];
                c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = at(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s
            }
            if (t = W, n = K, n = rt(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (q === 2 || q === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && Fe(r), e.callbackNode = null, e.callbackPriority = 0;
            if (!(n & 3) || it(e, n)) {
                if (t = n & -n, t === e.callbackPriority) return t;
                switch (r !== null && Fe(r), mt(n)) {
                    case 2:
                    case 8:
                        n = Ve;
                        break;
                    case 32:
                        n = E;
                        break;
                    case 268435456:
                        n = Ue;
                        break;
                    default:
                        n = E
                }
                return r = cd.bind(null, e), n = Pe(n, r), e.callbackPriority = t, e.callbackNode = n, t
            }
            return r !== null && r !== null && Fe(r), e.callbackPriority = 2, e.callbackNode = null, 2
        }

        function cd(e, t) {
            if (Y !== 0 && Y !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
            var n = e.callbackNode;
            if (Uu() && e.callbackNode !== n) return null;
            var r = K;
            return r = rt(e, e === W ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (_u(e, r, t), sd(e, T()), e.callbackNode != null && e.callbackNode === n ? cd.bind(null, e) : null)
        }

        function ld(e, t) {
            if (Uu()) return null;
            _u(e, t, !0)
        }

        function ud() {
            Yd(function() {
                U & 6 ? Pe(Be, ad) : od()
            })
        }

        function dd() {
            if (nd === 0) {
                var e = ba;
                e === 0 && (e = $e, $e <<= 1, !($e & 261888) && ($e = 256)), nd = e
            }
            return nd
        }

        function fd(e) {
            return e == null || typeof e == `symbol` || typeof e == `boolean` ? null : typeof e == `function` ? e : un(`` + e)
        }

        function pd(e, t) {
            var n = t.ownerDocument.createElement(`input`);
            return n.name = t.name, n.value = t.value, e.id && n.setAttribute(`form`, e.id), t.parentNode.insertBefore(n, t), e = new FormData(e), n.parentNode.removeChild(n), e
        }

        function md(e, t, n, r, i) {
            if (t === `submit` && n && n.stateNode === i) {
                var a = fd((i[yt] || null).action),
                    o = r.submitter;
                o && (t = (t = o[yt] || null) ? fd(t.formAction) : o.getAttribute(`formAction`), t !== null && (a = t, o = null));
                var s = new Mn(`action`, `action`, null, r, i);
                e.push({
                    event: s,
                    listeners: [{
                        instance: null,
                        listener: function() {
                            if (r.defaultPrevented) {
                                if (nd !== 0) {
                                    var e = o ? pd(i, o) : new FormData(i);
                                    ks(n, {
                                        pending: !0,
                                        data: e,
                                        method: i.method,
                                        action: a
                                    }, null, e)
                                }
                            } else typeof a == `function` && (s.preventDefault(), e = o ? pd(i, o) : new FormData(i), ks(n, {
                                pending: !0,
                                data: e,
                                method: i.method,
                                action: a
                            }, a, e))
                        },
                        currentTarget: i
                    }]
                })
            }
        }
        for (var hd = 0; hd < ai.length; hd++) {
            var gd = ai[hd];
            oi(gd.toLowerCase(), `on` + (gd[0].toUpperCase() + gd.slice(1)))
        }
        oi(Zr, `onAnimationEnd`), oi(Qr, `onAnimationIteration`), oi($r, `onAnimationStart`), oi(`dblclick`, `onDoubleClick`), oi(`focusin`, `onFocus`), oi(`focusout`, `onBlur`), oi(ei, `onTransitionRun`), oi(ti, `onTransitionStart`), oi(ni, `onTransitionCancel`), oi(ri, `onTransitionEnd`), Ft(`onMouseEnter`, [`mouseout`, `mouseover`]), Ft(`onMouseLeave`, [`mouseout`, `mouseover`]), Ft(`onPointerEnter`, [`pointerout`, `pointerover`]), Ft(`onPointerLeave`, [`pointerout`, `pointerover`]), Pt(`onChange`, `change click focusin focusout input keydown keyup selectionchange`.split(` `)), Pt(`onSelect`, `focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange`.split(` `)), Pt(`onBeforeInput`, [`compositionend`, `keypress`, `textInput`, `paste`]), Pt(`onCompositionEnd`, `compositionend focusout keydown keypress keyup mousedown`.split(` `)), Pt(`onCompositionStart`, `compositionstart focusout keydown keypress keyup mousedown`.split(` `)), Pt(`onCompositionUpdate`, `compositionupdate focusout keydown keypress keyup mousedown`.split(` `));
        var _d = `abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting`.split(` `),
            vd = new Set(`beforetoggle cancel close invalid load scroll scrollend toggle`.split(` `).concat(_d));

        function yd(e, t) {
            t = (t & 4) != 0;
            for (var n = 0; n < e.length; n++) {
                var r = e[n],
                    i = r.event;
                r = r.listeners;
                a: {
                    var a = void 0;
                    if (t)
                        for (var o = r.length - 1; 0 <= o; o--) {
                            var s = r[o],
                                c = s.instance,
                                l = s.currentTarget;
                            if (s = s.listener, c !== a && i.isPropagationStopped()) break a;
                            a = s, i.currentTarget = l;
                            try {
                                a(i)
                            } catch (e) {
                                si(e)
                            }
                            i.currentTarget = null, a = c
                        } else
                            for (o = 0; o < r.length; o++) {
                                if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
                                a = s, i.currentTarget = l;
                                try {
                                    a(i)
                                } catch (e) {
                                    si(e)
                                }
                                i.currentTarget = null, a = c
                            }
                }
            }
        }

        function Q(e, t) {
            var n = t[xt];
            n === void 0 && (n = t[xt] = new Set);
            var r = e + `__bubble`;
            n.has(r) || (Cd(t, e, 2, !1), n.add(r))
        }

        function bd(e, t, n) {
            var r = 0;
            t && (r |= 4), Cd(n, e, r, t)
        }
        var xd = `_reactListening` + Math.random().toString(36).slice(2);

        function Sd(e) {
            if (!e[xd]) {
                e[xd] = !0, Mt.forEach(function(t) {
                    t !== `selectionchange` && (vd.has(t) || bd(t, !1, e), bd(t, !0, e))
                });
                var t = e.nodeType === 9 ? e : e.ownerDocument;
                t === null || t[xd] || (t[xd] = !0, bd(`selectionchange`, !1, t))
            }
        }

        function Cd(e, t, n, r) {
            switch (mp(t)) {
                case 2:
                    var i = cp;
                    break;
                case 8:
                    i = lp;
                    break;
                default:
                    i = up
            }
            n = i.bind(null, t, n, e), i = void 0, !xn || t !== `touchstart` && t !== `touchmove` && t !== `wheel` || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
                capture: !0,
                passive: i
            }) : i === void 0 ? e.addEventListener(t, n, !1) : e.addEventListener(t, n, {
                passive: i
            })
        }

        function wd(e, t, n, r, i) {
            var a = r;
            if (!(t & 1) && !(t & 2) && r !== null) a: for (;;) {
                if (r === null) return;
                var s = r.tag;
                if (s === 3 || s === 4) {
                    var c = r.stateNode.containerInfo;
                    if (c === i) break;
                    if (s === 4)
                        for (s = r.return; s !== null;) {
                            var l = s.tag;
                            if ((l === 3 || l === 4) && s.stateNode.containerInfo === i) return;
                            s = s.return
                        }
                    for (; c !== null;) {
                        if (s = Dt(c), s === null) return;
                        if (l = s.tag, l === 5 || l === 6 || l === 26 || l === 27) {
                            r = a = s;
                            continue a
                        }
                        c = c.parentNode
                    }
                }
                r = r.return
            }
            vn(function() {
                var r = a,
                    i = pn(n),
                    s = [];
                a: {
                    var c = ii.get(e);
                    if (c !== void 0) {
                        var l = Mn,
                            u = e;
                        switch (e) {
                            case `keypress`:
                                if (Dn(n) === 0) break a;
                            case `keydown`:
                            case `keyup`:
                                l = Xn;
                                break;
                            case `focusin`:
                                u = `focus`, l = Vn;
                                break;
                            case `focusout`:
                                u = `blur`, l = Vn;
                                break;
                            case `beforeblur`:
                            case `afterblur`:
                                l = Vn;
                                break;
                            case `click`:
                                if (n.button === 2) break a;
                            case `auxclick`:
                            case `dblclick`:
                            case `mousedown`:
                            case `mousemove`:
                            case `mouseup`:
                            case `mouseout`:
                            case `mouseover`:
                            case `contextmenu`:
                                l = zn;
                                break;
                            case `drag`:
                            case `dragend`:
                            case `dragenter`:
                            case `dragexit`:
                            case `dragleave`:
                            case `dragover`:
                            case `dragstart`:
                            case `drop`:
                                l = Bn;
                                break;
                            case `touchcancel`:
                            case `touchend`:
                            case `touchmove`:
                            case `touchstart`:
                                l = Qn;
                                break;
                            case Zr:
                            case Qr:
                            case $r:
                                l = Hn;
                                break;
                            case ri:
                                l = $n;
                                break;
                            case `scroll`:
                            case `scrollend`:
                                l = Pn;
                                break;
                            case `wheel`:
                                l = er;
                                break;
                            case `copy`:
                            case `cut`:
                            case `paste`:
                                l = Un;
                                break;
                            case `gotpointercapture`:
                            case `lostpointercapture`:
                            case `pointercancel`:
                            case `pointerdown`:
                            case `pointermove`:
                            case `pointerout`:
                            case `pointerover`:
                            case `pointerup`:
                                l = Zn;
                                break;
                            case `toggle`:
                            case `beforetoggle`:
                                l = tr
                        }
                        var d = (t & 4) != 0,
                            f = !d && (e === `scroll` || e === `scrollend`),
                            p = d ? c === null ? null : c + `Capture` : c;
                        d = [];
                        for (var m = r, h; m !== null;) {
                            var g = m;
                            if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = yn(m, p), g != null && d.push(Td(m, g, h))), f) break;
                            m = m.return
                        }
                        0 < d.length && (c = new l(c, u, null, n, i), s.push({
                            event: c,
                            listeners: d
                        }))
                    }
                }
                if (!(t & 7)) {
                    a: {
                        if (c = e === `mouseover` || e === `pointerover`, l = e === `mouseout` || e === `pointerout`, c && n !== fn && (u = n.relatedTarget || n.fromElement) && (Dt(u) || u[bt])) break a;
                        if ((l || c) && (c = i.window === i ? i : (c = i.ownerDocument) ? c.defaultView || c.parentWindow : window, l ? (u = n.relatedTarget || n.toElement, l = r, u = u ? Dt(u) : null, u !== null && (f = o(u), d = u.tag, u !== f || d !== 5 && d !== 27 && d !== 6) && (u = null)) : (l = null, u = r), l !== u)) {
                            if (d = zn, g = `onMouseLeave`, p = `onMouseEnter`, m = `mouse`, (e === `pointerout` || e === `pointerover`) && (d = Zn, g = `onPointerLeave`, p = `onPointerEnter`, m = `pointer`), f = l == null ? c : kt(l), h = u == null ? c : kt(u), c = new d(g, m + `leave`, l, n, i), c.target = f, c.relatedTarget = h, g = null, Dt(i) === r && (d = new d(p, m + `enter`, u, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, l && u) b: {
                                for (d = Dd, p = l, m = u, h = 0, g = p; g; g = d(g)) h++;g = 0;
                                for (var _ = m; _; _ = d(_)) g++;
                                for (; 0 < h - g;) p = d(p),
                                h--;
                                for (; 0 < g - h;) m = d(m),
                                g--;
                                for (; h--;) {
                                    if (p === m || m !== null && p === m.alternate) {
                                        d = p;
                                        break b
                                    }
                                    p = d(p), m = d(m)
                                }
                                d = null
                            }
                            else d = null;
                            l !== null && Od(s, c, l, d, !1), u !== null && f !== null && Od(s, f, u, d, !0)
                        }
                    }
                    a: {
                        if (c = r ? kt(r) : window, l = c.nodeName && c.nodeName.toLowerCase(), l === `select` || l === `input` && c.type === `file`) var v = xr;
                        else if (hr(c))
                            if (Sr) v = jr;
                            else {
                                v = kr;
                                var y = Or
                            }
                        else l = c.nodeName,
                        !l || l.toLowerCase() !== `input` || c.type !== `checkbox` && c.type !== `radio` ? r && sn(r.elementType) && (v = xr) : v = Ar;
                        if (v && = v(e, r)) {
                            gr(s, v, n, i);
                            break a
                        }
                        y && y(e, c, r),
                        e === `focusout` && r && c.type === `number` && r.memoizedProps.value != null && $t(c, `number`, c.value)
                    }
                    switch (y = r ? kt(r) : window, e) {
                        case `focusin`:
                            (hr(y) || y.contentEditable === `true`) && (Vr = y, Hr = r, Ur = null);
                            break;
                        case `focusout`:
                            Ur = Hr = Vr = null;
                            break;
                        case `mousedown`:
                            Wr = !0;
                            break;
                        case `contextmenu`:
                        case `mouseup`:
                        case `dragend`:
                            Wr = !1, Gr(s, n, i);
                            break;
                        case `selectionchange`:
                            if (Br) break;
                        case `keydown`:
                        case `keyup`:
                            Gr(s, n, i)
                    }
                    var b;
                    if (rr) b: {
                        switch (e) {
                            case `compositionstart`:
                                var x = `onCompositionStart`;
                                break b;
                            case `compositionend`:
                                x = `onCompositionEnd`;
                                break b;
                            case `compositionupdate`:
                                x = `onCompositionUpdate`;
                                break b
                        }
                        x = void 0
                    }
                    else dr ? lr(e, n) && (x = `onCompositionEnd`) : e === `keydown` && n.keyCode === 229 && (x = `onCompositionStart`);x && (or && n.locale !== `ko` && (dr || x !== `onCompositionStart` ? x === `onCompositionEnd` && dr && (b = En()) : (Cn = i, wn = `value` in Cn ? Cn.value : Cn.textContent, dr = !0)), y = Ed(r, x), 0 < y.length && (x = new Wn(x, e, null, n, i), s.push({
                        event: x,
                        listeners: y
                    }), b ? x.data = b : (b = ur(n), b !== null && (x.data = b)))),
                    (b = ar ? fr(e, n) : pr(e, n)) && (x = Ed(r, `onBeforeInput`), 0 < x.length && (y = new Wn(`onBeforeInput`, `beforeinput`, null, n, i), s.push({
                        event: y,
                        listeners: x
                    }), y.data = b)),
                    md(s, e, r, n, i)
                }
                yd(s, t)
            })
        }

        function Td(e, t, n) {
            return {
                instance: e,
                listener: t,
                currentTarget: n
            }
        }

        function Ed(e, t) {
            for (var n = t + `Capture`, r = []; e !== null;) {
                var i = e,
                    a = i.stateNode;
                if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = yn(e, n), i != null && r.unshift(Td(e, i, a)), i = yn(e, t), i != null && r.push(Td(e, i, a))), e.tag === 3) return r;
                e = e.return
            }
            return []
        }

        function Dd(e) {
            if (e === null) return null;
            do e = e.return; while (e && e.tag !== 5 && e.tag !== 27);
            return e || null
        }

        function Od(e, t, n, r, i) {
            for (var a = t._reactName, o = []; n !== null && n !== r;) {
                var s = n,
                    c = s.alternate,
                    l = s.stateNode;
                if (s = s.tag, c !== null && c === r) break;
                s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = yn(n, a), l != null && o.unshift(Td(n, l, c))) : i || (l = yn(n, a), l != null && o.push(Td(n, l, c)))), n = n.return
            }
            o.length !== 0 && e.push({
                event: t,
                listeners: o
            })
        }
        var kd = /\r\n?/g,
            Ad = /\u0000|\uFFFD/g;

        function jd(e) {
            return (typeof e == `string` ? e : `` + e).replace(kd, `
`).replace(Ad, ``)
        }

        function Md(e, t) {
            return t = jd(t), jd(e) === t
        }

        function $(e, t, n, r, a, o) {
            switch (n) {
                case `children`:
                    typeof r == `string` ? t === `body` || t === `textarea` && r === `` || nn(e, r) : (typeof r == `number` || typeof r == `bigint`) && t !== `body` && nn(e, `` + r);
                    break;
                case `className`:
                    Vt(e, `class`, r);
                    break;
                case `tabIndex`:
                    Vt(e, `tabindex`, r);
                    break;
                case `dir`:
                case `role`:
                case `viewBox`:
                case `width`:
                case `height`:
                    Vt(e, n, r);
                    break;
                case `style`:
                    on(e, r, o);
                    break;
                case `data`:
                    if (t !== `object`) {
                        Vt(e, `data`, r);
                        break
                    }
                case `src`:
                case `href`:
                    if (r === `` && (t !== `a` || n !== `href`)) {
                        e.removeAttribute(n);
                        break
                    }
                    if (r == null || typeof r == `function` || typeof r == `symbol` || typeof r == `boolean`) {
                        e.removeAttribute(n);
                        break
                    }
                    r = un(`` + r), e.setAttribute(n, r);
                    break;
                case `action`:
                case `formAction`:
                    if (typeof r == `function`) {
                        e.setAttribute(n, `javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')`);
                        break
                    } else typeof o == `function` && (n === `formAction` ? (t !== `input` && $(e, t, `name`, a.name, a, null), $(e, t, `formEncType`, a.formEncType, a, null), $(e, t, `formMethod`, a.formMethod, a, null), $(e, t, `formTarget`, a.formTarget, a, null)) : ($(e, t, `encType`, a.encType, a, null), $(e, t, `method`, a.method, a, null), $(e, t, `target`, a.target, a, null)));
                    if (r == null || typeof r == `symbol` || typeof r == `boolean`) {
                        e.removeAttribute(n);
                        break
                    }
                    r = un(`` + r), e.setAttribute(n, r);
                    break;
                case `onClick`:
                    r != null && (e.onclick = dn);
                    break;
                case `onScroll`:
                    r != null && Q(`scroll`, e);
                    break;
                case `onScrollEnd`:
                    r != null && Q(`scrollend`, e);
                    break;
                case `dangerouslySetInnerHTML`:
                    if (r != null) {
                        if (typeof r != `object` || !(`__html` in r)) throw Error(i(61));
                        if (n = r.__html, n != null) {
                            if (a.children != null) throw Error(i(60));
                            e.innerHTML = n
                        }
                    }
                    break;
                case `multiple`:
                    e.multiple = r && typeof r != `function` && typeof r != `symbol`;
                    break;
                case `muted`:
                    e.muted = r && typeof r != `function` && typeof r != `symbol`;
                    break;
                case `suppressContentEditableWarning`:
                case `suppressHydrationWarning`:
                case `defaultValue`:
                case `defaultChecked`:
                case `innerHTML`:
                case `ref`:
                    break;
                case `autoFocus`:
                    break;
                case `xlinkHref`:
                    if (r == null || typeof r == `function` || typeof r == `boolean` || typeof r == `symbol`) {
                        e.removeAttribute(`xlink:href`);
                        break
                    }
                    n = un(`` + r), e.setAttributeNS(`http://www.w3.org/1999/xlink`, `xlink:href`, n);
                    break;
                case `contentEditable`:
                case `spellCheck`:
                case `draggable`:
                case `value`:
                case `autoReverse`:
                case `externalResourcesRequired`:
                case `focusable`:
                case `preserveAlpha`:
                    r != null && typeof r != `function` && typeof r != `symbol` ? e.setAttribute(n, `` + r) : e.removeAttribute(n);
                    break;
                case `inert`:
                case `allowFullScreen`:
                case `async`:
                case `autoPlay`:
                case `controls`:
                case `default`:
                case `defer`:
                case `disabled`:
                case `disablePictureInPicture`:
                case `disableRemotePlayback`:
                case `formNoValidate`:
                case `hidden`:
                case `loop`:
                case `noModule`:
                case `noValidate`:
                case `open`:
                case `playsInline`:
                case `readOnly`:
                case `required`:
                case `reversed`:
                case `scoped`:
                case `seamless`:
                case `itemScope`:
                    r && typeof r != `function` && typeof r != `symbol` ? e.setAttribute(n, ``) : e.removeAttribute(n);
                    break;
                case `capture`:
                case `download`:
                    !0 === r ? e.setAttribute(n, ``) : !1 !== r && r != null && typeof r != `function` && typeof r != `symbol` ? e.setAttribute(n, r) : e.removeAttribute(n);
                    break;
                case `cols`:
                case `rows`:
                case `size`:
                case `span`:
                    r != null && typeof r != `function` && typeof r != `symbol` && !isNaN(r) && 1 <= r ? e.setAttribute(n, r) : e.removeAttribute(n);
                    break;
                case `rowSpan`:
                case `start`:
                    r == null || typeof r == `function` || typeof r == `symbol` || isNaN(r) ? e.removeAttribute(n) : e.setAttribute(n, r);
                    break;
                case `popover`:
                    Q(`beforetoggle`, e), Q(`toggle`, e), Bt(e, `popover`, r);
                    break;
                case `xlinkActuate`:
                    Ht(e, `http://www.w3.org/1999/xlink`, `xlink:actuate`, r);
                    break;
                case `xlinkArcrole`:
                    Ht(e, `http://www.w3.org/1999/xlink`, `xlink:arcrole`, r);
                    break;
                case `xlinkRole`:
                    Ht(e, `http://www.w3.org/1999/xlink`, `xlink:role`, r);
                    break;
                case `xlinkShow`:
                    Ht(e, `http://www.w3.org/1999/xlink`, `xlink:show`, r);
                    break;
                case `xlinkTitle`:
                    Ht(e, `http://www.w3.org/1999/xlink`, `xlink:title`, r);
                    break;
                case `xlinkType`:
                    Ht(e, `http://www.w3.org/1999/xlink`, `xlink:type`, r);
                    break;
                case `xmlBase`:
                    Ht(e, `http://www.w3.org/XML/1998/namespace`, `xml:base`, r);
                    break;
                case `xmlLang`:
                    Ht(e, `http://www.w3.org/XML/1998/namespace`, `xml:lang`, r);
                    break;
                case `xmlSpace`:
                    Ht(e, `http://www.w3.org/XML/1998/namespace`, `xml:space`, r);
                    break;
                case `is`:
                    Bt(e, `is`, r);
                    break;
                case `innerText`:
                case `textContent`:
                    break;
                default:
                    (!(2 < n.length) || n[0] !== `o` && n[0] !== `O` || n[1] !== `n` && n[1] !== `N`) && (n = cn.get(n) || n, Bt(e, n, r))
            }
        }

        function Nd(e, t, n, r, a, o) {
            switch (n) {
                case `style`:
                    on(e, r, o);
                    break;
                case `dangerouslySetInnerHTML`:
                    if (r != null) {
                        if (typeof r != `object` || !(`__html` in r)) throw Error(i(61));
                        if (n = r.__html, n != null) {
                            if (a.children != null) throw Error(i(60));
                            e.innerHTML = n
                        }
                    }
                    break;
                case `children`:
                    typeof r == `string` ? nn(e, r) : (typeof r == `number` || typeof r == `bigint`) && nn(e, `` + r);
                    break;
                case `onScroll`:
                    r != null && Q(`scroll`, e);
                    break;
                case `onScrollEnd`:
                    r != null && Q(`scrollend`, e);
                    break;
                case `onClick`:
                    r != null && (e.onclick = dn);
                    break;
                case `suppressContentEditableWarning`:
                case `suppressHydrationWarning`:
                case `innerHTML`:
                case `ref`:
                    break;
                case `innerText`:
                case `textContent`:
                    break;
                default:
                    if (!Nt.hasOwnProperty(n)) a: {
                        if (n[0] === `o` && n[1] === `n` && (a = n.endsWith(`Capture`), t = n.slice(2, a ? n.length - 7 : void 0), o = e[yt] || null, o = o == null ? null : o[n], typeof o == `function` && e.removeEventListener(t, o, a), typeof r == `function`)) {
                            typeof o != `function` && o !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(t, r, a);
                            break a
                        }
                        n in e ? e[n] = r : !0 === r ? e.setAttribute(n, ``) : Bt(e, n, r)
                    }
            }
        }

        function Pd(e, t, n) {
            switch (t) {
                case `div`:
                case `span`:
                case `svg`:
                case `path`:
                case `a`:
                case `g`:
                case `p`:
                case `li`:
                    break;
                case `img`:
                    Q(`error`, e), Q(`load`, e);
                    var r = !1,
                        a = !1,
                        o;
                    for (o in n)
                        if (n.hasOwnProperty(o)) {
                            var s = n[o];
                            if (s != null) switch (o) {
                                case `src`:
                                    r = !0;
                                    break;
                                case `srcSet`:
                                    a = !0;
                                    break;
                                case `children`:
                                case `dangerouslySetInnerHTML`:
                                    throw Error(i(137, t));
                                default:
                                    $(e, t, o, s, n, null)
                            }
                        }
                    a && $(e, t, `srcSet`, n.srcSet, n, null), r && $(e, t, `src`, n.src, n, null);
                    return;
                case `input`:
                    Q(`invalid`, e);
                    var c = o = s = a = null,
                        l = null,
                        u = null;
                    for (r in n)
                        if (n.hasOwnProperty(r)) {
                            var d = n[r];
                            if (d != null) switch (r) {
                                case `name`:
                                    a = d;
                                    break;
                                case `type`:
                                    s = d;
                                    break;
                                case `checked`:
                                    l = d;
                                    break;
                                case `defaultChecked`:
                                    u = d;
                                    break;
                                case `value`:
                                    o = d;
                                    break;
                                case `defaultValue`:
                                    c = d;
                                    break;
                                case `children`:
                                case `dangerouslySetInnerHTML`:
                                    if (d != null) throw Error(i(137, t));
                                    break;
                                default:
                                    $(e, t, r, d, n, null)
                            }
                        }
                    Qt(e, o, c, l, u, s, a, !1);
                    return;
                case `select`:
                    for (a in Q(`invalid`, e), r = s = o = null, n)
                        if (n.hasOwnProperty(a) && (c = n[a], c != null)) switch (a) {
                            case `value`:
                                o = c;
                                break;
                            case `defaultValue`:
                                s = c;
                                break;
                            case `multiple`:
                                r = c;
                            default:
                                $(e, t, a, c, n, null)
                        }
                    t = o, n = s, e.multiple = !!r, t == null ? n != null && en(e, !!r, n, !0) : en(e, !!r, t, !1);
                    return;
                case `textarea`:
                    for (s in Q(`invalid`, e), o = a = r = null, n)
                        if (n.hasOwnProperty(s) && (c = n[s], c != null)) switch (s) {
                            case `value`:
                                r = c;
                                break;
                            case `defaultValue`:
                                a = c;
                                break;
                            case `children`:
                                o = c;
                                break;
                            case `dangerouslySetInnerHTML`:
                                if (c != null) throw Error(i(91));
                                break;
                            default:
                                $(e, t, s, c, n, null)
                        }
                    tn(e, r, a, o);
                    return;
                case `option`:
                    for (l in n)
                        if (n.hasOwnProperty(l) && (r = n[l], r != null)) switch (l) {
                            case `selected`:
                                e.selected = r && typeof r != `function` && typeof r != `symbol`;
                                break;
                            default:
                                $(e, t, l, r, n, null)
                        }
                    return;
                case `dialog`:
                    Q(`beforetoggle`, e), Q(`toggle`, e), Q(`cancel`, e), Q(`close`, e);
                    break;
                case `iframe`:
                case `object`:
                    Q(`load`, e);
                    break;
                case `video`:
                case `audio`:
                    for (r = 0; r < _d.length; r++) Q(_d[r], e);
                    break;
                case `image`:
                    Q(`error`, e), Q(`load`, e);
                    break;
                case `details`:
                    Q(`toggle`, e);
                    break;
                case `embed`:
                case `source`:
                case `link`:
                    Q(`error`, e), Q(`load`, e);
                case `area`:
                case `base`:
                case `br`:
                case `col`:
                case `hr`:
                case `keygen`:
                case `meta`:
                case `param`:
                case `track`:
                case `wbr`:
                case `menuitem`:
                    for (u in n)
                        if (n.hasOwnProperty(u) && (r = n[u], r != null)) switch (u) {
                            case `children`:
                            case `dangerouslySetInnerHTML`:
                                throw Error(i(137, t));
                            default:
                                $(e, t, u, r, n, null)
                        }
                    return;
                default:
                    if (sn(t)) {
                        for (d in n) n.hasOwnProperty(d) && (r = n[d], r !== void 0 && Nd(e, t, d, r, n, void 0));
                        return
                    }
            }
            for (c in n) n.hasOwnProperty(c) && (r = n[c], r != null && $(e, t, c, r, n, null))
        }

        function Fd(e, t, n, r) {
            switch (t) {
                case `div`:
                case `span`:
                case `svg`:
                case `path`:
                case `a`:
                case `g`:
                case `p`:
                case `li`:
                    break;
                case `input`:
                    var a = null,
                        o = null,
                        s = null,
                        c = null,
                        l = null,
                        u = null,
                        d = null;
                    for (m in n) {
                        var f = n[m];
                        if (n.hasOwnProperty(m) && f != null) switch (m) {
                            case `checked`:
                                break;
                            case `value`:
                                break;
                            case `defaultValue`:
                                l = f;
                            default:
                                r.hasOwnProperty(m) || $(e, t, m, null, r, f)
                        }
                    }
                    for (var p in r) {
                        var m = r[p];
                        if (f = n[p], r.hasOwnProperty(p) && (m != null || f != null)) switch (p) {
                            case `type`:
                                o = m;
                                break;
                            case `name`:
                                a = m;
                                break;
                            case `checked`:
                                u = m;
                                break;
                            case `defaultChecked`:
                                d = m;
                                break;
                            case `value`:
                                s = m;
                                break;
                            case `defaultValue`:
                                c = m;
                                break;
                            case `children`:
                            case `dangerouslySetInnerHTML`:
                                if (m != null) throw Error(i(137, t));
                                break;
                            default:
                                m !== f && $(e, t, p, m, r, f)
                        }
                    }
                    Zt(e, s, c, l, u, d, o, a);
                    return;
                case `select`:
                    for (o in m = s = c = p = null, n)
                        if (l = n[o], n.hasOwnProperty(o) && l != null) switch (o) {
                            case `value`:
                                break;
                            case `multiple`:
                                m = l;
                            default:
                                r.hasOwnProperty(o) || $(e, t, o, null, r, l)
                        }
                    for (a in r)
                        if (o = r[a], l = n[a], r.hasOwnProperty(a) && (o != null || l != null)) switch (a) {
                            case `value`:
                                p = o;
                                break;
                            case `defaultValue`:
                                c = o;
                                break;
                            case `multiple`:
                                s = o;
                            default:
                                o !== l && $(e, t, a, o, r, l)
                        }
                    t = c, n = s, r = m, p == null ? !!r != !!n && (t == null ? en(e, !!n, n ? [] : ``, !1) : en(e, !!n, t, !0)) : en(e, !!n, p, !1);
                    return;
                case `textarea`:
                    for (c in m = p = null, n)
                        if (a = n[c], n.hasOwnProperty(c) && a != null && !r.hasOwnProperty(c)) switch (c) {
                            case `value`:
                                break;
                            case `children`:
                                break;
                            default:
                                $(e, t, c, null, r, a)
                        }
                    for (s in r)
                        if (a = r[s], o = n[s], r.hasOwnProperty(s) && (a != null || o != null)) switch (s) {
                            case `value`:
                                p = a;
                                break;
                            case `defaultValue`:
                                m = a;
                                break;
                            case `children`:
                                break;
                            case `dangerouslySetInnerHTML`:
                                if (a != null) throw Error(i(91));
                                break;
                            default:
                                a !== o && $(e, t, s, a, r, o)
                        }
                    D(e, p, m);
                    return;
                case `option`:
                    for (var h in n)
                        if (p = n[h], n.hasOwnProperty(h) && p != null && !r.hasOwnProperty(h)) switch (h) {
                            case `selected`:
                                e.selected = !1;
                                break;
                            default:
                                $(e, t, h, null, r, p)
                        }
                    for (l in r)
                        if (p = r[l], m = n[l], r.hasOwnProperty(l) && p !== m && (p != null || m != null)) switch (l) {
                            case `selected`:
                                e.selected = p && typeof p != `function` && typeof p != `symbol`;
                                break;
                            default:
                                $(e, t, l, p, r, m)
                        }
                    return;
                case `img`:
                case `link`:
                case `area`:
                case `base`:
                case `br`:
                case `col`:
                case `embed`:
                case `hr`:
                case `keygen`:
                case `meta`:
                case `param`:
                case `source`:
                case `track`:
                case `wbr`:
                case `menuitem`:
                    for (var g in n) p = n[g], n.hasOwnProperty(g) && p != null && !r.hasOwnProperty(g) && $(e, t, g, null, r, p);
                    for (u in r)
                        if (p = r[u], m = n[u], r.hasOwnProperty(u) && p !== m && (p != null || m != null)) switch (u) {
                            case `children`:
                            case `dangerouslySetInnerHTML`:
                                if (p != null) throw Error(i(137, t));
                                break;
                            default:
                                $(e, t, u, p, r, m)
                        }
                    return;
                default:
                    if (sn(t)) {
                        for (var _ in n) p = n[_], n.hasOwnProperty(_) && p !== void 0 && !r.hasOwnProperty(_) && Nd(e, t, _, void 0, r, p);
                        for (d in r) p = r[d], m = n[d], !r.hasOwnProperty(d) || p === m || p === void 0 && m === void 0 || Nd(e, t, d, p, r, m);
                        return
                    }
            }
            for (var v in n) p = n[v], n.hasOwnProperty(v) && p != null && !r.hasOwnProperty(v) && $(e, t, v, null, r, p);
            for (f in r) p = r[f], m = n[f], !r.hasOwnProperty(f) || p === m || p == null && m == null || $(e, t, f, p, r, m)
        }

        function Id(e) {
            switch (e) {
                case `css`:
                case `script`:
                case `font`:
                case `img`:
                case `image`:
                case `input`:
                case `link`:
                    return !0;
                default:
                    return !1
            }
        }

        function Ld() {
            if (typeof performance.getEntriesByType == `function`) {
                for (var e = 0, t = 0, n = performance.getEntriesByType(`resource`), r = 0; r < n.length; r++) {
                    var i = n[r],
                        a = i.transferSize,
                        o = i.initiatorType,
                        s = i.duration;
                    if (a && s && Id(o)) {
                        for (o = 0, s = i.responseEnd, r += 1; r < n.length; r++) {
                            var c = n[r],
                                l = c.startTime;
                            if (l > s) break;
                            var u = c.transferSize,
                                d = c.initiatorType;
                            u && Id(d) && (c = c.responseEnd, o += u * (c < s ? 1 : (s - l) / (c - l)))
                        }
                        if (--r, t += 8 * (a + o) / (i.duration / 1e3), e++, 10 < e) break
                    }
                }
                if (0 < e) return t / e / 1e6
            }
            return navigator.connection && (e = navigator.connection.downlink, typeof e == `number`) ? e : 5
        }
        var Rd = null,
            zd = null;

        function Bd(e) {
            return e.nodeType === 9 ? e : e.ownerDocument
        }

        function Vd(e) {
            switch (e) {
                case `http://www.w3.org/2000/svg`:
                    return 1;
                case `http://www.w3.org/1998/Math/MathML`:
                    return 2;
                default:
                    return 0
            }
        }

        function Hd(e, t) {
            if (e === 0) switch (t) {
                case `svg`:
                    return 1;
                case `math`:
                    return 2;
                default:
                    return 0
            }
            return e === 1 && t === `foreignObject` ? 0 : e
        }

        function Ud(e, t) {
            return e === `textarea` || e === `noscript` || typeof t.children == `string` || typeof t.children == `number` || typeof t.children == `bigint` || typeof t.dangerouslySetInnerHTML == `object` && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null
        }
        var Wd = null;

        function Gd() {
            var e = window.event;
            return e && e.type === `popstate` ? e === Wd ? !1 : (Wd = e, !0) : (Wd = null, !1)
        }
        var Kd = typeof setTimeout == `function` ? setTimeout : void 0,
            qd = typeof clearTimeout == `function` ? clearTimeout : void 0,
            Jd = typeof Promise == `function` ? Promise : void 0,
            Yd = typeof queueMicrotask == `function` ? queueMicrotask : Jd === void 0 ? Kd : function(e) {
                return Jd.resolve(null).then(e).catch(Xd)
            };

        function Xd(e) {
            setTimeout(function() {
                throw e
            })
        }

        function Zd(e) {
            return e === `head`
        }

        function Qd(e, t) {
            var n = t,
                r = 0;
            do {
                var i = n.nextSibling;
                if (e.removeChild(n), i && i.nodeType === 8)
                    if (n = i.data, n === `/$` || n === `/&`) {
                        if (r === 0) {
                            e.removeChild(i), Np(t);
                            return
                        }
                        r--
                    } else if (n === `$` || n === `$?` || n === `$~` || n === `$!` || n === `&`) r++;
                else if (n === `html`) pf(e.ownerDocument.documentElement);
                else if (n === `head`) {
                    n = e.ownerDocument.head, pf(n);
                    for (var a = n.firstChild; a;) {
                        var o = a.nextSibling,
                            s = a.nodeName;
                        a[Tt] || s === `SCRIPT` || s === `STYLE` || s === `LINK` && a.rel.toLowerCase() === `stylesheet` || n.removeChild(a), a = o
                    }
                } else n === `body` && pf(e.ownerDocument.body);
                n = i
            } while (n);
            Np(t)
        }

        function $d(e, t) {
            var n = e;
            e = 0;
            do {
                var r = n.nextSibling;
                if (n.nodeType === 1 ? t ? (n._stashedDisplay = n.style.display, n.style.display = `none`) : (n.style.display = n._stashedDisplay || ``, n.getAttribute(`style`) === `` && n.removeAttribute(`style`)) : n.nodeType === 3 && (t ? (n._stashedText = n.nodeValue, n.nodeValue = ``) : n.nodeValue = n._stashedText || ``), r && r.nodeType === 8)
                    if (n = r.data, n === `/$`) {
                        if (e === 0) break;
                        e--
                    } else n !== `$` && n !== `$?` && n !== `$~` && n !== `$!` || e++;
                n = r
            } while (n)
        }

        function ef(e) {
            var t = e.firstChild;
            for (t && t.nodeType === 10 && (t = t.nextSibling); t;) {
                var n = t;
                switch (t = t.nextSibling, n.nodeName) {
                    case `HTML`:
                    case `HEAD`:
                    case `BODY`:
                        ef(n), Et(n);
                        continue;
                    case `SCRIPT`:
                    case `STYLE`:
                        continue;
                    case `LINK`:
                        if (n.rel.toLowerCase() === `stylesheet`) continue
                }
                e.removeChild(n)
            }
        }

        function tf(e, t, n, r) {
            for (; e.nodeType === 1;) {
                var i = n;
                if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
                    if (!r && (e.nodeName !== `INPUT` || e.type !== `hidden`)) break
                } else if (!r)
                    if (t === `input` && e.type === `hidden`) {
                        var a = i.name == null ? null : `` + i.name;
                        if (i.type === `hidden` && e.getAttribute(`name`) === a) return e
                    } else return e;
                else if (!e[Tt]) switch (t) {
                    case `meta`:
                        if (!e.hasAttribute(`itemprop`)) break;
                        return e;
                    case `link`:
                        if (a = e.getAttribute(`rel`), a === `stylesheet` && e.hasAttribute(`data-precedence`) || a !== i.rel || e.getAttribute(`href`) !== (i.href == null || i.href === `` ? null : i.href) || e.getAttribute(`crossorigin`) !== (i.crossOrigin == null ? null : i.crossOrigin) || e.getAttribute(`title`) !== (i.title == null ? null : i.title)) break;
                        return e;
                    case `style`:
                        if (e.hasAttribute(`data-precedence`)) break;
                        return e;
                    case `script`:
                        if (a = e.getAttribute(`src`), (a !== (i.src == null ? null : i.src) || e.getAttribute(`type`) !== (i.type == null ? null : i.type) || e.getAttribute(`crossorigin`) !== (i.crossOrigin == null ? null : i.crossOrigin)) && a && e.hasAttribute(`async`) && !e.hasAttribute(`itemprop`)) break;
                        return e;
                    default:
                        return e
                }
                if (e = cf(e.nextSibling), e === null) break
            }
            return null
        }

        function nf(e, t, n) {
            if (t === ``) return null;
            for (; e.nodeType !== 3;)
                if ((e.nodeType !== 1 || e.nodeName !== `INPUT` || e.type !== `hidden`) && !n || (e = cf(e.nextSibling), e === null)) return null;
            return e
        }

        function rf(e, t) {
            for (; e.nodeType !== 8;)
                if ((e.nodeType !== 1 || e.nodeName !== `INPUT` || e.type !== `hidden`) && !t || (e = cf(e.nextSibling), e === null)) return null;
            return e
        }

        function af(e) {
            return e.data === `$?` || e.data === `$~`
        }

        function of (e) {
            return e.data === `$!` || e.data === `$?` && e.ownerDocument.readyState !== `loading`
        }

        function sf(e, t) {
            var n = e.ownerDocument;
            if (e.data === `$~`) e._reactRetry = t;
            else if (e.data !== `$?` || n.readyState !== `loading`) t();
            else {
                var r = function() {
                    t(), n.removeEventListener(`DOMContentLoaded`, r)
                };
                n.addEventListener(`DOMContentLoaded`, r), e._reactRetry = r
            }
        }

        function cf(e) {
            for (; e != null; e = e.nextSibling) {
                var t = e.nodeType;
                if (t === 1 || t === 3) break;
                if (t === 8) {
                    if (t = e.data, t === `$` || t === `$!` || t === `$?` || t === `$~` || t === `&` || t === `F!` || t === `F`) break;
                    if (t === `/$` || t === `/&`) return null
                }
            }
            return e
        }
        var lf = null;

        function uf(e) {
            e = e.nextSibling;
            for (var t = 0; e;) {
                if (e.nodeType === 8) {
                    var n = e.data;
                    if (n === `/$` || n === `/&`) {
                        if (t === 0) return cf(e.nextSibling);
                        t--
                    } else n !== `$` && n !== `$!` && n !== `$?` && n !== `$~` && n !== `&` || t++
                }
                e = e.nextSibling
            }
            return null
        }

        function df(e) {
            e = e.previousSibling;
            for (var t = 0; e;) {
                if (e.nodeType === 8) {
                    var n = e.data;
                    if (n === `$` || n === `$!` || n === `$?` || n === `$~` || n === `&`) {
                        if (t === 0) return e;
                        t--
                    } else n !== `/$` && n !== `/&` || t++
                }
                e = e.previousSibling
            }
            return null
        }

        function ff(e, t, n) {
            switch (t = Bd(n), e) {
                case `html`:
                    if (e = t.documentElement, !e) throw Error(i(452));
                    return e;
                case `head`:
                    if (e = t.head, !e) throw Error(i(453));
                    return e;
                case `body`:
                    if (e = t.body, !e) throw Error(i(454));
                    return e;
                default:
                    throw Error(i(451))
            }
        }

        function pf(e) {
            for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
            Et(e)
        }
        var mf = new Map,
            hf = new Set;

        function gf(e) {
            return typeof e.getRootNode == `function` ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument
        }
        var _f = C.d;
        C.d = {
            f: vf,
            r: yf,
            D: Sf,
            C: Cf,
            L: wf,
            m: Tf,
            X: Df,
            S: Ef,
            M: Of
        };

        function vf() {
            var e = _f.f(),
                t = xu();
            return e || t
        }

        function yf(e) {
            var t = Ot(e);
            t !== null && t.tag === 5 && t.type === `form` ? js(t) : _f.r(e)
        }
        var bf = typeof document > `u` ? null : document;

        function xf(e, t, n) {
            var r = bf;
            if (r && typeof t == `string` && t) {
                var i = Xt(t);
                i = `link[rel="` + e + `"][href="` + i + `"]`, typeof n == `string` && (i += `[crossorigin="` + n + `"]`), hf.has(i) || (hf.add(i), e = {
                    rel: e,
                    crossOrigin: n,
                    href: t
                }, r.querySelector(i) === null && (t = r.createElement(`link`), Pd(t, `link`, e), jt(t), r.head.appendChild(t)))
            }
        }

        function Sf(e) {
            _f.D(e), xf(`dns-prefetch`, e, null)
        }

        function Cf(e, t) {
            _f.C(e, t), xf(`preconnect`, e, t)
        }

        function wf(e, t, n) {
            _f.L(e, t, n);
            var r = bf;
            if (r && e && t) {
                var i = `link[rel="preload"][as="` + Xt(t) + `"]`;
                t === `image` && n && n.imageSrcSet ? (i += `[imagesrcset="` + Xt(n.imageSrcSet) + `"]`, typeof n.imageSizes == `string` && (i += `[imagesizes="` + Xt(n.imageSizes) + `"]`)) : i += `[href="` + Xt(e) + `"]`;
                var a = i;
                switch (t) {
                    case `style`:
                        a = Af(e);
                        break;
                    case `script`:
                        a = Pf(e)
                }
                mf.has(a) || (e = f({
                    rel: `preload`,
                    href: t === `image` && n && n.imageSrcSet ? void 0 : e,
                    as: t
                }, n), mf.set(a, e), r.querySelector(i) !== null || t === `style` && r.querySelector(jf(a)) || t === `script` && r.querySelector(Ff(a)) || (t = r.createElement(`link`), Pd(t, `link`, e), jt(t), r.head.appendChild(t)))
            }
        }

        function Tf(e, t) {
            _f.m(e, t);
            var n = bf;
            if (n && e) {
                var r = t && typeof t.as == `string` ? t.as : `script`,
                    i = `link[rel="modulepreload"][as="` + Xt(r) + `"][href="` + Xt(e) + `"]`,
                    a = i;
                switch (r) {
                    case `audioworklet`:
                    case `paintworklet`:
                    case `serviceworker`:
                    case `sharedworker`:
                    case `worker`:
                    case `script`:
                        a = Pf(e)
                }
                if (!mf.has(a) && (e = f({
                        rel: `modulepreload`,
                        href: e
                    }, t), mf.set(a, e), n.querySelector(i) === null)) {
                    switch (r) {
                        case `audioworklet`:
                        case `paintworklet`:
                        case `serviceworker`:
                        case `sharedworker`:
                        case `worker`:
                        case `script`:
                            if (n.querySelector(Ff(a))) return
                    }
                    r = n.createElement(`link`), Pd(r, `link`, e), jt(r), n.head.appendChild(r)
                }
            }
        }

        function Ef(e, t, n) {
            _f.S(e, t, n);
            var r = bf;
            if (r && e) {
                var i = At(r).hoistableStyles,
                    a = Af(e);
                t || = `default`;
                var o = i.get(a);
                if (!o) {
                    var s = {
                        loading: 0,
                        preload: null
                    };
                    if (o = r.querySelector(jf(a))) s.loading = 5;
                    else {
                        e = f({
                            rel: `stylesheet`,
                            href: e,
                            "data-precedence": t
                        }, n), (n = mf.get(a)) && Rf(e, n);
                        var c = o = r.createElement(`link`);
                        jt(c), Pd(c, `link`, e), c._p = new Promise(function(e, t) {
                            c.onload = e, c.onerror = t
                        }), c.addEventListener(`load`, function() {
                            s.loading |= 1
                        }), c.addEventListener(`error`, function() {
                            s.loading |= 2
                        }), s.loading |= 4, Lf(o, t, r)
                    }
                    o = {
                        type: `stylesheet`,
                        instance: o,
                        count: 1,
                        state: s
                    }, i.set(a, o)
                }
            }
        }

        function Df(e, t) {
            _f.X(e, t);
            var n = bf;
            if (n && e) {
                var r = At(n).hoistableScripts,
                    i = Pf(e),
                    a = r.get(i);
                a || (a = n.querySelector(Ff(i)), a || (e = f({
                    src: e,
                    async: !0
                }, t), (t = mf.get(i)) && zf(e, t), a = n.createElement(`script`), jt(a), Pd(a, `link`, e), n.head.appendChild(a)), a = {
                    type: `script`,
                    instance: a,
                    count: 1,
                    state: null
                }, r.set(i, a))
            }
        }

        function Of(e, t) {
            _f.M(e, t);
            var n = bf;
            if (n && e) {
                var r = At(n).hoistableScripts,
                    i = Pf(e),
                    a = r.get(i);
                a || (a = n.querySelector(Ff(i)), a || (e = f({
                    src: e,
                    async: !0,
                    type: `module`
                }, t), (t = mf.get(i)) && zf(e, t), a = n.createElement(`script`), jt(a), Pd(a, `link`, e), n.head.appendChild(a)), a = {
                    type: `script`,
                    instance: a,
                    count: 1,
                    state: null
                }, r.set(i, a))
            }
        }

        function kf(e, t, n, r) {
            var a = (a = be.current) ? gf(a) : null;
            if (!a) throw Error(i(446));
            switch (e) {
                case `meta`:
                case `title`:
                    return null;
                case `style`:
                    return typeof n.precedence == `string` && typeof n.href == `string` ? (t = Af(n.href), n = At(a).hoistableStyles, r = n.get(t), r || (r = {
                        type: `style`,
                        instance: null,
                        count: 0,
                        state: null
                    }, n.set(t, r)), r) : {
                        type: `void`,
                        instance: null,
                        count: 0,
                        state: null
                    };
                case `link`:
                    if (n.rel === `stylesheet` && typeof n.href == `string` && typeof n.precedence == `string`) {
                        e = Af(n.href);
                        var o = At(a).hoistableStyles,
                            s = o.get(e);
                        if (s || (a = a.ownerDocument || a, s = {
                                type: `stylesheet`,
                                instance: null,
                                count: 0,
                                state: {
                                    loading: 0,
                                    preload: null
                                }
                            }, o.set(e, s), (o = a.querySelector(jf(e))) && !o._p && (s.instance = o, s.state.loading = 5), mf.has(e) || (n = {
                                rel: `preload`,
                                as: `style`,
                                href: n.href,
                                crossOrigin: n.crossOrigin,
                                integrity: n.integrity,
                                media: n.media,
                                hrefLang: n.hrefLang,
                                referrerPolicy: n.referrerPolicy
                            }, mf.set(e, n), o || Nf(a, e, n, s.state))), t && r === null) throw Error(i(528, ``));
                        return s
                    }
                    if (t && r !== null) throw Error(i(529, ``));
                    return null;
                case `script`:
                    return t = n.async, n = n.src, typeof n == `string` && t && typeof t != `function` && typeof t != `symbol` ? (t = Pf(n), n = At(a).hoistableScripts, r = n.get(t), r || (r = {
                        type: `script`,
                        instance: null,
                        count: 0,
                        state: null
                    }, n.set(t, r)), r) : {
                        type: `void`,
                        instance: null,
                        count: 0,
                        state: null
                    };
                default:
                    throw Error(i(444, e))
            }
        }

        function Af(e) {
            return `href="` + Xt(e) + `"`
        }

        function jf(e) {
            return `link[rel="stylesheet"][` + e + `]`
        }

        function Mf(e) {
            return f({}, e, {
                "data-precedence": e.precedence,
                precedence: null
            })
        }

        function Nf(e, t, n, r) {
            e.querySelector(`link[rel="preload"][as="style"][` + t + `]`) ? r.loading = 1 : (t = e.createElement(`link`), r.preload = t, t.addEventListener(`load`, function() {
                return r.loading |= 1
            }), t.addEventListener(`error`, function() {
                return r.loading |= 2
            }), Pd(t, `link`, n), jt(t), e.head.appendChild(t))
        }

        function Pf(e) {
            return `[src="` + Xt(e) + `"]`
        }

        function Ff(e) {
            return `script[async]` + e
        }

        function If(e, t, n) {
            if (t.count++, t.instance === null) switch (t.type) {
                case `style`:
                    var r = e.querySelector(`style[data-href~="` + Xt(n.href) + `"]`);
                    if (r) return t.instance = r, jt(r), r;
                    var a = f({}, n, {
                        "data-href": n.href,
                        "data-precedence": n.precedence,
                        href: null,
                        precedence: null
                    });
                    return r = (e.ownerDocument || e).createElement(`style`), jt(r), Pd(r, `style`, a), Lf(r, n.precedence, e), t.instance = r;
                case `stylesheet`:
                    a = Af(n.href);
                    var o = e.querySelector(jf(a));
                    if (o) return t.state.loading |= 4, t.instance = o, jt(o), o;
                    r = Mf(n), (a = mf.get(a)) && Rf(r, a), o = (e.ownerDocument || e).createElement(`link`), jt(o);
                    var s = o;
                    return s._p = new Promise(function(e, t) {
                        s.onload = e, s.onerror = t
                    }), Pd(o, `link`, r), t.state.loading |= 4, Lf(o, n.precedence, e), t.instance = o;
                case `script`:
                    return o = Pf(n.src), (a = e.querySelector(Ff(o))) ? (t.instance = a, jt(a), a) : (r = n, (a = mf.get(o)) && (r = f({}, n), zf(r, a)), e = e.ownerDocument || e, a = e.createElement(`script`), jt(a), Pd(a, `link`, r), e.head.appendChild(a), t.instance = a);
                case `void`:
                    return null;
                default:
                    throw Error(i(443, t.type))
            } else t.type === `stylesheet` && !(t.state.loading & 4) && (r = t.instance, t.state.loading |= 4, Lf(r, n.precedence, e));
            return t.instance
        }

        function Lf(e, t, n) {
            for (var r = n.querySelectorAll(`link[rel="stylesheet"][data-precedence],style[data-precedence]`), i = r.length ? r[r.length - 1] : null, a = i, o = 0; o < r.length; o++) {
                var s = r[o];
                if (s.dataset.precedence === t) a = s;
                else if (a !== i) break
            }
            a ? a.parentNode.insertBefore(e, a.nextSibling) : (t = n.nodeType === 9 ? n.head : n, t.insertBefore(e, t.firstChild))
        }

        function Rf(e, t) {
            e.crossOrigin ? ? = t.crossOrigin, e.referrerPolicy ? ? = t.referrerPolicy, e.title ? ? = t.title
        }

        function zf(e, t) {
            e.crossOrigin ? ? = t.crossOrigin, e.referrerPolicy ? ? = t.referrerPolicy, e.integrity ? ? = t.integrity
        }
        var Bf = null;

        function Vf(e, t, n) {
            if (Bf === null) {
                var r = new Map,
                    i = Bf = new Map;
                i.set(n, r)
            } else i = Bf, r = i.get(n), r || (r = new Map, i.set(n, r));
            if (r.has(e)) return r;
            for (r.set(e, null), n = n.getElementsByTagName(e), i = 0; i < n.length; i++) {
                var a = n[i];
                if (!(a[Tt] || a[vt] || e === `link` && a.getAttribute(`rel`) === `stylesheet`) && a.namespaceURI !== `http://www.w3.org/2000/svg`) {
                    var o = a.getAttribute(t) || ``;
                    o = e + o;
                    var s = r.get(o);
                    s ? s.push(a) : r.set(o, [a])
                }
            }
            return r
        }

        function Hf(e, t, n) {
            e = e.ownerDocument || e, e.head.insertBefore(n, t === `title` ? e.querySelector(`head > title`) : null)
        }

        function Uf(e, t, n) {
            if (n === 1 || t.itemProp != null) return !1;
            switch (e) {
                case `meta`:
                case `title`:
                    return !0;
                case `style`:
                    if (typeof t.precedence != `string` || typeof t.href != `string` || t.href === ``) break;
                    return !0;
                case `link`:
                    if (typeof t.rel != `string` || typeof t.href != `string` || t.href === `` || t.onLoad || t.onError) break;
                    switch (t.rel) {
                        case `stylesheet`:
                            return e = t.disabled, typeof t.precedence == `string` && e == null;
                        default:
                            return !0
                    }
                case `script`:
                    if (t.async && typeof t.async != `function` && typeof t.async != `symbol` && !t.onLoad && !t.onError && t.src && typeof t.src == `string`) return !0
            }
            return !1
        }

        function Wf(e) {
            return !(e.type === `stylesheet` && !(e.state.loading & 3))
        }

        function Gf(e, t, n, r) {
            if (n.type === `stylesheet` && (typeof r.media != `string` || !1 !== matchMedia(r.media).matches) && !(n.state.loading & 4)) {
                if (n.instance === null) {
                    var i = Af(r.href),
                        a = t.querySelector(jf(i));
                    if (a) {
                        t = a._p, typeof t == `object` && t && typeof t.then == `function` && (e.count++, e = Jf.bind(e), t.then(e, e)), n.state.loading |= 4, n.instance = a, jt(a);
                        return
                    }
                    a = t.ownerDocument || t, r = Mf(r), (i = mf.get(i)) && Rf(r, i), a = a.createElement(`link`), jt(a);
                    var o = a;
                    o._p = new Promise(function(e, t) {
                        o.onload = e, o.onerror = t
                    }), Pd(a, `link`, r), n.instance = a
                }
                e.stylesheets === null && (e.stylesheets = new Map), e.stylesheets.set(n, t), (t = n.state.preload) && !(n.state.loading & 3) && (e.count++, n = Jf.bind(e), t.addEventListener(`load`, n), t.addEventListener(`error`, n))
            }
        }
        var Kf = 0;

        function qf(e, t) {
            return e.stylesheets && e.count === 0 && Xf(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(n) {
                var r = setTimeout(function() {
                    if (e.stylesheets && Xf(e, e.stylesheets), e.unsuspend) {
                        var t = e.unsuspend;
                        e.unsuspend = null, t()
                    }
                }, 6e4 + t);
                0 < e.imgBytes && Kf === 0 && (Kf = 62500 * Ld());
                var i = setTimeout(function() {
                    if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && Xf(e, e.stylesheets), e.unsuspend)) {
                        var t = e.unsuspend;
                        e.unsuspend = null, t()
                    }
                }, (e.imgBytes > Kf ? 50 : 800) + t);
                return e.unsuspend = n,
                    function() {
                        e.unsuspend = null, clearTimeout(r), clearTimeout(i)
                    }
            } : null
        }

        function Jf() {
            if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
                if (this.stylesheets) Xf(this, this.stylesheets);
                else if (this.unsuspend) {
                    var e = this.unsuspend;
                    this.unsuspend = null, e()
                }
            }
        }
        var Yf = null;

        function Xf(e, t) {
            e.stylesheets = null, e.unsuspend !== null && (e.count++, Yf = new Map, t.forEach(Zf, e), Yf = null, Jf.call(e))
        }

        function Zf(e, t) {
            if (!(t.state.loading & 4)) {
                var n = Yf.get(e);
                if (n) var r = n.get(null);
                else {
                    n = new Map, Yf.set(e, n);
                    for (var i = e.querySelectorAll(`link[data-precedence],style[data-precedence]`), a = 0; a < i.length; a++) {
                        var o = i[a];
                        (o.nodeName === `LINK` || o.getAttribute(`media`) !== `not all`) && (n.set(o.dataset.precedence, o), r = o)
                    }
                    r && n.set(null, r)
                }
                i = t.instance, o = i.getAttribute(`data-precedence`), a = n.get(o) || r, a === r && n.set(null, i), n.set(o, i), this.count++, r = Jf.bind(this), i.addEventListener(`load`, r), i.addEventListener(`error`, r), a ? a.parentNode.insertBefore(i, a.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(i, e.firstChild)), t.state.loading |= 4
            }
        }
        var Qf = {
            $$typeof: x,
            Provider: null,
            Consumer: null,
            _currentValue: pe,
            _currentValue2: pe,
            _threadCount: 0
        };

        function $f(e, t, n, r, i, a, o, s, c) {
            this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = st(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = st(0), this.hiddenUpdates = st(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.incompleteTransitions = new Map
        }

        function ep(e, t, n, r, i, a, o, s, c, l, u, d) {
            return e = new $f(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = yi(3, null, null, t), e.current = a, a.stateNode = e, t = _a(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
                element: r,
                isDehydrated: n,
                cache: t
            }, Ja(a), e
        }

        function tp(e) {
            return e ? (e = _i, e) : _i
        }

        function np(e, t, n, r, i, a) {
            i = tp(i), r.context === null ? r.context = i : r.pendingContext = i, r = Xa(t), r.payload = {
                element: n
            }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = Za(e, r, t), n !== null && (gu(n, e, t), Qa(n, e, t))
        }

        function rp(e, t) {
            if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
                var n = e.retryLane;
                e.retryLane = n !== 0 && n < t ? n : t
            }
        }

        function ip(e, t) {
            rp(e, t), (e = e.alternate) && rp(e, t)
        }

        function ap(e) {
            if (e.tag === 13 || e.tag === 31) {
                var t = mi(e, 67108864);
                t !== null && gu(t, e, 67108864), ip(e, 67108864)
            }
        }

        function op(e) {
            if (e.tag === 13 || e.tag === 31) {
                var t = mu();
                t = pt(t);
                var n = mi(e, t);
                n !== null && gu(n, e, t), ip(e, t)
            }
        }
        var sp = !0;

        function cp(e, t, n, r) {
            var i = S.T;
            S.T = null;
            var a = C.p;
            try {
                C.p = 2, up(e, t, n, r)
            } finally {
                C.p = a, S.T = i
            }
        }

        function lp(e, t, n, r) {
            var i = S.T;
            S.T = null;
            var a = C.p;
            try {
                C.p = 8, up(e, t, n, r)
            } finally {
                C.p = a, S.T = i
            }
        }

        function up(e, t, n, r) {
            if (sp) {
                var i = dp(r);
                if (i === null) wd(e, t, r, fp, n), Cp(e, r);
                else if (Tp(i, e, t, n, r)) r.stopPropagation();
                else if (Cp(e, r), t & 4 && -1 < Sp.indexOf(e)) {
                    for (; i !== null;) {
                        var a = Ot(i);
                        if (a !== null) switch (a.tag) {
                            case 3:
                                if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
                                    var o = nt(a.pendingLanes);
                                    if (o !== 0) {
                                        var s = a;
                                        for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
                                            var c = 1 << 31 - Ye(o);
                                            s.entanglements[1] |= c, o &= ~c
                                        }
                                        rd(a), !(U & 6) && (ru = T() + 500, id(0, !1))
                                    }
                                }
                                break;
                            case 31:
                            case 13:
                                s = mi(a, 2), s !== null && gu(s, a, 2), xu(), ip(a, 2)
                        }
                        if (a = dp(r), a === null && wd(e, t, r, fp, n), a === i) break;
                        i = a
                    }
                    i !== null && r.stopPropagation()
                } else wd(e, t, r, null, n)
            }
        }

        function dp(e) {
            return e = pn(e), pp(e)
        }
        var fp = null;

        function pp(e) {
            if (fp = null, e = Dt(e), e !== null) {
                var t = o(e);
                if (t === null) e = null;
                else {
                    var n = t.tag;
                    if (n === 13) {
                        if (e = s(t), e !== null) return e;
                        e = null
                    } else if (n === 31) {
                        if (e = c(t), e !== null) return e;
                        e = null
                    } else if (n === 3) {
                        if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
                        e = null
                    } else t !== e && (e = null)
                }
            }
            return fp = e, null
        }

        function mp(e) {
            switch (e) {
                case `beforetoggle`:
                case `cancel`:
                case `click`:
                case `close`:
                case `contextmenu`:
                case `copy`:
                case `cut`:
                case `auxclick`:
                case `dblclick`:
                case `dragend`:
                case `dragstart`:
                case `drop`:
                case `focusin`:
                case `focusout`:
                case `input`:
                case `invalid`:
                case `keydown`:
                case `keypress`:
                case `keyup`:
                case `mousedown`:
                case `mouseup`:
                case `paste`:
                case `pause`:
                case `play`:
                case `pointercancel`:
                case `pointerdown`:
                case `pointerup`:
                case `ratechange`:
                case `reset`:
                case `resize`:
                case `seeked`:
                case `submit`:
                case `toggle`:
                case `touchcancel`:
                case `touchend`:
                case `touchstart`:
                case `volumechange`:
                case `change`:
                case `selectionchange`:
                case `textInput`:
                case `compositionstart`:
                case `compositionend`:
                case `compositionupdate`:
                case `beforeblur`:
                case `afterblur`:
                case `beforeinput`:
                case `blur`:
                case `fullscreenchange`:
                case `focus`:
                case `hashchange`:
                case `popstate`:
                case `select`:
                case `selectstart`:
                    return 2;
                case `drag`:
                case `dragenter`:
                case `dragexit`:
                case `dragleave`:
                case `dragover`:
                case `mousemove`:
                case `mouseout`:
                case `mouseover`:
                case `pointermove`:
                case `pointerout`:
                case `pointerover`:
                case `scroll`:
                case `touchmove`:
                case `wheel`:
                case `mouseenter`:
                case `mouseleave`:
                case `pointerenter`:
                case `pointerleave`:
                    return 8;
                case `message`:
                    switch (ze()) {
                        case Be:
                            return 2;
                        case Ve:
                            return 8;
                        case E:
                        case He:
                            return 32;
                        case Ue:
                            return 268435456;
                        default:
                            return 32
                    }
                default:
                    return 32
            }
        }
        var hp = !1,
            gp = null,
            _p = null,
            vp = null,
            yp = new Map,
            bp = new Map,
            xp = [],
            Sp = `mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset`.split(` `);

        function Cp(e, t) {
            switch (e) {
                case `focusin`:
                case `focusout`:
                    gp = null;
                    break;
                case `dragenter`:
                case `dragleave`:
                    _p = null;
                    break;
                case `mouseover`:
                case `mouseout`:
                    vp = null;
                    break;
                case `pointerover`:
                case `pointerout`:
                    yp.delete(t.pointerId);
                    break;
                case `gotpointercapture`:
                case `lostpointercapture`:
                    bp.delete(t.pointerId)
            }
        }

        function wp(e, t, n, r, i, a) {
            return e === null || e.nativeEvent !== a ? (e = {
                blockedOn: t,
                domEventName: n,
                eventSystemFlags: r,
                nativeEvent: a,
                targetContainers: [i]
            }, t !== null && (t = Ot(t), t !== null && ap(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e)
        }

        function Tp(e, t, n, r, i) {
            switch (t) {
                case `focusin`:
                    return gp = wp(gp, e, t, n, r, i), !0;
                case `dragenter`:
                    return _p = wp(_p, e, t, n, r, i), !0;
                case `mouseover`:
                    return vp = wp(vp, e, t, n, r, i), !0;
                case `pointerover`:
                    var a = i.pointerId;
                    return yp.set(a, wp(yp.get(a) || null, e, t, n, r, i)), !0;
                case `gotpointercapture`:
                    return a = i.pointerId, bp.set(a, wp(bp.get(a) || null, e, t, n, r, i)), !0
            }
            return !1
        }

        function Ep(e) {
            var t = Dt(e.target);
            if (t !== null) {
                var n = o(t);
                if (n !== null) {
                    if (t = n.tag, t === 13) {
                        if (t = s(n), t !== null) {
                            e.blockedOn = t, gt(e.priority, function() {
                                op(n)
                            });
                            return
                        }
                    } else if (t === 31) {
                        if (t = c(n), t !== null) {
                            e.blockedOn = t, gt(e.priority, function() {
                                op(n)
                            });
                            return
                        }
                    } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
                        e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
                        return
                    }
                }
            }
            e.blockedOn = null
        }

        function Dp(e) {
            if (e.blockedOn !== null) return !1;
            for (var t = e.targetContainers; 0 < t.length;) {
                var n = dp(e.nativeEvent);
                if (n === null) {
                    n = e.nativeEvent;
                    var r = new n.constructor(n.type, n);
                    fn = r, n.target.dispatchEvent(r), fn = null
                } else return t = Ot(n), t !== null && ap(t), e.blockedOn = n, !1;
                t.shift()
            }
            return !0
        }

        function Op(e, t, n) {
            Dp(e) && n.delete(t)
        }

        function kp() {
            hp = !1, gp !== null && Dp(gp) && (gp = null), _p !== null && Dp(_p) && (_p = null), vp !== null && Dp(vp) && (vp = null), yp.forEach(Op), bp.forEach(Op)
        }

        function Ap(e, n) {
            e.blockedOn === n && (e.blockedOn = null, hp || (hp = !0, t.unstable_scheduleCallback(t.unstable_NormalPriority, kp)))
        }
        var jp = null;

        function Mp(e) {
            jp !== e && (jp = e, t.unstable_scheduleCallback(t.unstable_NormalPriority, function() {
                jp === e && (jp = null);
                for (var t = 0; t < e.length; t += 3) {
                    var n = e[t],
                        r = e[t + 1],
                        i = e[t + 2];
                    if (typeof r != `function`) {
                        if (pp(r || n) === null) continue;
                        break
                    }
                    var a = Ot(n);
                    a !== null && (e.splice(t, 3), t -= 3, ks(a, {
                        pending: !0,
                        data: i,
                        method: n.method,
                        action: r
                    }, r, i))
                }
            }))
        }

        function Np(e) {
            function t(t) {
                return Ap(t, e)
            }
            gp !== null && Ap(gp, e), _p !== null && Ap(_p, e), vp !== null && Ap(vp, e), yp.forEach(t), bp.forEach(t);
            for (var n = 0; n < xp.length; n++) {
                var r = xp[n];
                r.blockedOn === e && (r.blockedOn = null)
            }
            for (; 0 < xp.length && (n = xp[0], n.blockedOn === null);) Ep(n), n.blockedOn === null && xp.shift();
            if (n = (e.ownerDocument || e).$$reactFormReplay, n != null)
                for (r = 0; r < n.length; r += 3) {
                    var i = n[r],
                        a = n[r + 1],
                        o = i[yt] || null;
                    if (typeof a == `function`) o || Mp(n);
                    else if (o) {
                        var s = null;
                        if (a && a.hasAttribute(`formAction`)) {
                            if (i = a, o = a[yt] || null) s = o.formAction;
                            else if (pp(i) !== null) continue
                        } else s = o.action;
                        typeof s == `function` ? n[r + 1] = s : (n.splice(r, 3), r -= 3), Mp(n)
                    }
                }
        }

        function Pp() {
            function e(e) {
                e.canIntercept && e.info === `react-transition` && e.intercept({
                    handler: function() {
                        return new Promise(function(e) {
                            return i = e
                        })
                    },
                    focusReset: `manual`,
                    scroll: `manual`
                })
            }

            function t() {
                i !== null && (i(), i = null), r || setTimeout(n, 20)
            }

            function n() {
                if (!r && !navigation.transition) {
                    var e = navigation.currentEntry;
                    e && e.url != null && navigation.navigate(e.url, {
                        state: e.getState(),
                        info: `react-transition`,
                        history: `replace`
                    })
                }
            }
            if (typeof navigation == `object`) {
                var r = !1,
                    i = null;
                return navigation.addEventListener(`navigate`, e), navigation.addEventListener(`navigatesuccess`, t), navigation.addEventListener(`navigateerror`, t), setTimeout(n, 100),
                    function() {
                        r = !0, navigation.removeEventListener(`navigate`, e), navigation.removeEventListener(`navigatesuccess`, t), navigation.removeEventListener(`navigateerror`, t), i !== null && (i(), i = null)
                    }
            }
        }

        function Fp(e) {
            this._internalRoot = e
        }
        Ip.prototype.render = Fp.prototype.render = function(e) {
            var t = this._internalRoot;
            if (t === null) throw Error(i(409));
            var n = t.current;
            np(n, mu(), e, t, null, null)
        }, Ip.prototype.unmount = Fp.prototype.unmount = function() {
            var e = this._internalRoot;
            if (e !== null) {
                this._internalRoot = null;
                var t = e.containerInfo;
                np(e.current, 2, null, e, null, null), xu(), t[bt] = null
            }
        };

        function Ip(e) {
            this._internalRoot = e
        }
        Ip.prototype.unstable_scheduleHydration = function(e) {
            if (e) {
                var t = ht();
                e = {
                    blockedOn: null,
                    target: e,
                    priority: t
                };
                for (var n = 0; n < xp.length && t !== 0 && t < xp[n].priority; n++);
                xp.splice(n, 0, e), n === 0 && Ep(e)
            }
        };
        var Lp = n.version;
        if (Lp !== `19.2.6`) throw Error(i(527, Lp, `19.2.6`));
        C.findDOMNode = function(e) {
            var t = e._reactInternals;
            if (t === void 0) throw typeof e.render == `function` ? Error(i(188)) : (e = Object.keys(e).join(`,`), Error(i(268, e)));
            return e = u(t), e = e === null ? null : d(e), e = e === null ? null : e.stateNode, e
        };
        var Rp = {
            bundleType: 0,
            version: `19.2.6`,
            rendererPackageName: `react-dom`,
            currentDispatcherRef: S,
            reconcilerVersion: `19.2.6`
        };
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < `u`) {
            var zp = __REACT_DEVTOOLS_GLOBAL_HOOK__;
            if (!zp.isDisabled && zp.supportsFiber) try {
                Ke = zp.inject(Rp), qe = zp
            } catch {}
        }
        e.createRoot = function(e, t) {
            if (!a(e)) throw Error(i(299));
            var n = !1,
                r = ``,
                o = Qs,
                s = $s,
                c = ec;
            return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (o = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = ep(e, 1, !1, null, null, n, r, null, o, s, c, Pp), e[bt] = t.current, Sd(e), new Fp(t)
        }
    })),
    Re = t(((e, t) => {
        function n() {
            if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > `u` || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != `function`)) try {
                __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)
            } catch {}
        }
        n(), t.exports = Le()
    })),
    T = e(g(), 1),
    ze = `popstate`;

function Be(e) {
    return typeof e == `object` && !!e && `pathname` in e && `search` in e && `hash` in e && `state` in e && `key` in e
}

function Ve(e = {}) {
    function t(e, t) {
        let n = t.state ? .masked,
            {
                pathname: r,
                search: i,
                hash: a
            } = n || e.location;
        return Ge(``, {
            pathname: r,
            search: i,
            hash: a
        }, t.state && t.state.usr || null, t.state && t.state.key || `default`, n ? {
            pathname: e.location.pathname,
            search: e.location.search,
            hash: e.location.hash
        } : void 0)
    }

    function n(e, t) {
        return typeof t == `string` ? t : Ke(t)
    }
    return Je(t, n, null, e)
}

function E(e, t) {
    if (e === !1 || e == null) throw Error(t)
}

function He(e, t) {
    if (!e) try {
        throw Error(t)
    } catch {}
}

function Ue() {
    return Math.random().toString(36).substring(2, 10)
}

function We(e, t) {
    return {
        usr: e.state,
        key: e.key,
        idx: t,
        masked: e.mask ? {
            pathname: e.pathname,
            search: e.search,
            hash: e.hash
        } : void 0
    }
}

function Ge(e, t, n = null, r, i) {
    return {
        pathname: typeof e == `string` ? e : e.pathname,
        search: ``,
        hash: ``,
        ...typeof t == `string` ? qe(t) : t,
        state: n,
        key: t && t.key || r || Ue(),
        mask: i
    }
}

function Ke({
    pathname: e = `/`,
    search: t = ``,
    hash: n = ``
}) {
    return t && t !== `?` && (e += t.charAt(0) === `?` ? t : `?` + t), n && n !== `#` && (e += n.charAt(0) === `#` ? n : `#` + n), e
}

function qe(e) {
    let t = {};
    if (e) {
        let n = e.indexOf(`#`);
        n >= 0 && (t.hash = e.substring(n), e = e.substring(0, n));
        let r = e.indexOf(`?`);
        r >= 0 && (t.search = e.substring(r), e = e.substring(0, r)), e && (t.pathname = e)
    }
    return t
}

function Je(e, t, n, r = {}) {
    let {
        window: i = document.defaultView,
        v5Compat: a = !1
    } = r, o = i.history, s = `POP`, c = null, l = u();
    l ? ? (l = 0, o.replaceState({ ...o.state,
        idx: l
    }, ``));

    function u() {
        return (o.state || {
            idx: null
        }).idx
    }

    function d() {
        s = `POP`;
        let e = u(),
            t = e == null ? null : e - l;
        l = e, c && c({
            action: s,
            location: h.location,
            delta: t
        })
    }

    function f(e, t) {
        s = `PUSH`;
        let r = Be(e) ? e : Ge(h.location, e, t);
        n && n(r, e), l = u() + 1;
        let d = We(r, l),
            f = h.createHref(r.mask || r);
        try {
            o.pushState(d, ``, f)
        } catch (e) {
            if (e instanceof DOMException && e.name === `DataCloneError`) throw e;
            i.location.assign(f)
        }
        a && c && c({
            action: s,
            location: h.location,
            delta: 1
        })
    }

    function p(e, t) {
        s = `REPLACE`;
        let r = Be(e) ? e : Ge(h.location, e, t);
        n && n(r, e), l = u();
        let i = We(r, l),
            d = h.createHref(r.mask || r);
        o.replaceState(i, ``, d), a && c && c({
            action: s,
            location: h.location,
            delta: 0
        })
    }

    function m(e) {
        return Ye(i, e)
    }
    let h = {
        get action() {
            return s
        },
        get location() {
            return e(i, o)
        },
        listen(e) {
            if (c) throw Error(`A history only accepts one active listener`);
            return i.addEventListener(ze, d), c = e, () => {
                i.removeEventListener(ze, d), c = null
            }
        },
        createHref(e) {
            return t(i, e)
        },
        createURL: m,
        encodeLocation(e) {
            let t = m(e);
            return {
                pathname: t.pathname,
                search: t.search,
                hash: t.hash
            }
        },
        push: f,
        replace: p,
        go(e) {
            return o.go(e)
        }
    };
    return h
}

function Ye(e, t, n = !1) {
    let r = `http://localhost`;
    e && (r = e.location.origin === `null` ? e.location.href : e.location.origin), E(r, `No window.location.(origin|href) available to create URL`);
    let i = typeof t == `string` ? t : Ke(t);
    return i = i.replace(/ $/, `%20`), !n && i.startsWith(`//`) && (i = r + i), new URL(i, r)
}

function Xe(e, t, n = `/`) {
    return Ze(e, t, n, !1)
}

function Ze(e, t, n, r, i) {
    let a = gt((typeof t == `string` ? qe(t) : t).pathname || `/`, n);
    if (a == null) return null;
    let o = i ? ? $e(e),
        s = null,
        c = ht(a);
    for (let e = 0; s == null && e < o.length; ++e) s = ft(o[e], c, r);
    return s
}

function Qe(e, t) {
    let {
        route: n,
        pathname: r,
        params: i
    } = e;
    return {
        id: n.id,
        pathname: r,
        params: i,
        data: t[n.id],
        loaderData: t[n.id],
        handle: n.handle
    }
}

function $e(e) {
    let t = et(e);
    return nt(t), t
}

function et(e, t = [], n = [], r = ``, i = !1) {
    let a = (e, a, o = i, s) => {
        let c = {
            relativePath: s === void 0 ? e.path || `` : s,
            caseSensitive: e.caseSensitive === !0,
            childrenIndex: a,
            route: e
        };
        if (c.relativePath.startsWith(`/`)) {
            if (!c.relativePath.startsWith(r) && o) return;
            E(c.relativePath.startsWith(r), `Absolute route path "${c.relativePath}" nested under path "${r}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`), c.relativePath = c.relativePath.slice(r.length)
        }
        let l = Tt([r, c.relativePath]),
            u = n.concat(c);
        e.children && e.children.length > 0 && (E(e.index !== !0, `Index routes must not have child routes. Please remove all child routes from route path "${l}".`), et(e.children, t, u, l, o)), !(e.path == null && !e.index) && t.push({
            path: l,
            score: ut(l, e.index),
            routesMeta: u
        })
    };
    return e.forEach((e, t) => {
        if (e.path === `` || !e.path ? .includes(`?`)) a(e, t);
        else
            for (let n of tt(e.path)) a(e, t, !0, n)
    }), t
}

function tt(e) {
    let t = e.split(`/`);
    if (t.length === 0) return [];
    let [n, ...r] = t, i = n.endsWith(`?`), a = n.replace(/\?$/, ``);
    if (r.length === 0) return i ? [a, ``] : [a];
    let o = tt(r.join(`/`)),
        s = [];
    return s.push(...o.map(e => e === `` ? a : [a, e].join(`/`))), i && s.push(...o), s.map(t => e.startsWith(`/`) && t === `` ? `/` : t)
}

function nt(e) {
    e.sort((e, t) => e.score === t.score ? dt(e.routesMeta.map(e => e.childrenIndex), t.routesMeta.map(e => e.childrenIndex)) : t.score - e.score)
}
var rt = /^:[\w-]+$/,
    it = 3,
    at = 2,
    ot = 1,
    st = 10,
    ct = -2,
    lt = e => e === `*`;

function ut(e, t) {
    let n = e.split(`/`),
        r = n.length;
    return n.some(lt) && (r += ct), t && (r += at), n.filter(e => !lt(e)).reduce((e, t) => e + (rt.test(t) ? it : t === `` ? ot : st), r)
}

function dt(e, t) {
    return e.length === t.length && e.slice(0, -1).every((e, n) => e === t[n]) ? e[e.length - 1] - t[t.length - 1] : 0
}

function ft(e, t, n = !1) {
    let {
        routesMeta: r
    } = e, i = {}, a = `/`, o = [];
    for (let e = 0; e < r.length; ++e) {
        let s = r[e],
            c = e === r.length - 1,
            l = a === `/` ? t : t.slice(a.length) || `/`,
            u = pt({
                path: s.relativePath,
                caseSensitive: s.caseSensitive,
                end: c
            }, l),
            d = s.route;
        if (!u && c && n && !r[r.length - 1].route.index && (u = pt({
                path: s.relativePath,
                caseSensitive: s.caseSensitive,
                end: !1
            }, l)), !u) return null;
        Object.assign(i, u.params), o.push({
            params: i,
            pathname: Tt([a, u.pathname]),
            pathnameBase: Dt(Tt([a, u.pathnameBase])),
            route: d
        }), u.pathnameBase !== `/` && (a = Tt([a, u.pathnameBase]))
    }
    return o
}

function pt(e, t) {
    typeof e == `string` && (e = {
        path: e,
        caseSensitive: !1,
        end: !0
    });
    let [n, r] = mt(e.path, e.caseSensitive, e.end), i = t.match(n);
    if (!i) return null;
    let a = i[0],
        o = a.replace(/(.)\/+$/, `$1`),
        s = i.slice(1);
    return {
        params: r.reduce((e, {
            paramName: t,
            isOptional: n
        }, r) => {
            if (t === `*`) {
                let e = s[r] || ``;
                o = a.slice(0, a.length - e.length).replace(/(.)\/+$/, `$1`)
            }
            let i = s[r];
            return n && !i ? e[t] = void 0 : e[t] = (i || ``).replace(/%2F/g, `/`), e
        }, {}),
        pathname: a,
        pathnameBase: o,
        pattern: e
    }
}

function mt(e, t = !1, n = !0) {
    He(e === `*` || !e.endsWith(`*`) || e.endsWith(`/*`), `Route path "${e}" will be treated as if it were "${e.replace(/\*$/,`/*`)}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${e.replace(/\*$/,`/*`)}".`);
    let r = [],
        i = `^` + e.replace(/\/*\*?$/, ``).replace(/^\/*/, `/`).replace(/[\\.*+^${}|()[\]]/g, `\\$&`).replace(/\/:([\w-]+)(\?)?/g, (e, t, n, i, a) => {
            if (r.push({
                    paramName: t,
                    isOptional: n != null
                }), n) {
                let t = a.charAt(i + e.length);
                return t && t !== `/` ? `/([^\\/]*)` : `(?:/([^\\/]*))?`
            }
            return `/([^\\/]+)`
        }).replace(/\/([\w-]+)\?(\/|$)/g, `(/$1)?$2`);
    return e.endsWith(`*`) ? (r.push({
        paramName: `*`
    }), i += e === `*` || e === `/*` ? `(.*)$` : `(?:\\/(.+)|\\/*)$`) : n ? i += `\\/*$` : e !== `` && e !== `/` && (i += `(?:(?=\\/|$))`), [new RegExp(i, t ? void 0 : `i`), r]
}

function ht(e) {
    try {
        return e.split(`/`).map(e => decodeURIComponent(e).replace(/\//g, `%2F`)).join(`/`)
    } catch (t) {
        return He(!1, `The URL path "${e}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${t}).`), e
    }
}

function gt(e, t) {
    if (t === `/`) return e;
    if (!e.toLowerCase().startsWith(t.toLowerCase())) return null;
    let n = t.endsWith(`/`) ? t.length - 1 : t.length,
        r = e.charAt(n);
    return r && r !== `/` ? null : e.slice(n) || `/`
}
var _t = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function vt(e, t = `/`) {
    let {
        pathname: n,
        search: r = ``,
        hash: i = ``
    } = typeof e == `string` ? qe(e) : e, a;
    return n ? (n = wt(n), a = n.startsWith(`/`) ? yt(n.substring(1), `/`) : yt(n, t)) : a = t, {
        pathname: a,
        search: Ot(r),
        hash: kt(i)
    }
}

function yt(e, t) {
    let n = Et(t).split(`/`);
    return e.split(`/`).forEach(e => {
        e === `..` ? n.length > 1 && n.pop() : e !== `.` && n.push(e)
    }), n.length > 1 ? n.join(`/`) : `/`
}

function bt(e, t, n, r) {
    return `Cannot include a '${e}' character in a manually specified \`to.${t}\` field [${JSON.stringify(r)}].  Please separate it out to the \`to.${n}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`
}

function xt(e) {
    return e.filter((e, t) => t === 0 || e.route.path && e.route.path.length > 0)
}

function St(e) {
    let t = xt(e);
    return t.map((e, n) => n === t.length - 1 ? e.pathname : e.pathnameBase)
}

function Ct(e, t, n, r = !1) {
    let i;
    typeof e == `string` ? i = qe(e) : (i = { ...e
    }, E(!i.pathname || !i.pathname.includes(`?`), bt(`?`, `pathname`, `search`, i)), E(!i.pathname || !i.pathname.includes(`#`), bt(`#`, `pathname`, `hash`, i)), E(!i.search || !i.search.includes(`#`), bt(`#`, `search`, `hash`, i)));
    let a = e === `` || i.pathname === ``,
        o = a ? `/` : i.pathname,
        s;
    if (o == null) s = n;
    else {
        let e = t.length - 1;
        if (!r && o.startsWith(`..`)) {
            let t = o.split(`/`);
            for (; t[0] === `..`;) t.shift(), --e;
            i.pathname = t.join(`/`)
        }
        s = e >= 0 ? t[e] : `/`
    }
    let c = vt(i, s),
        l = o && o !== `/` && o.endsWith(`/`),
        u = (a || o === `.`) && n.endsWith(`/`);
    return !c.pathname.endsWith(`/`) && (l || u) && (c.pathname += `/`), c
}
var wt = e => e.replace(/\/\/+/g, `/`),
    Tt = e => wt(e.join(`/`)),
    Et = e => e.replace(/\/+$/, ``),
    Dt = e => Et(e).replace(/^\/*/, `/`),
    Ot = e => !e || e === `?` ? `` : e.startsWith(`?`) ? e : `?` + e,
    kt = e => !e || e === `#` ? `` : e.startsWith(`#`) ? e : `#` + e,
    At = class {
        constructor(e, t, n, r = !1) {
            this.status = e, this.statusText = t || ``, this.internal = r, n instanceof Error ? (this.data = n.toString(), this.error = n) : this.data = n
        }
    };

function jt(e) {
    return e != null && typeof e.status == `number` && typeof e.statusText == `string` && typeof e.internal == `boolean` && `data` in e
}

function Mt(e) {
    return Tt(e.map(e => e.route.path).filter(Boolean)) || `/`
}
var Nt = typeof window < `u` && window.document !== void 0 && window.document.createElement !== void 0;

function Pt(e, t) {
    let n = e;
    if (typeof n != `string` || !_t.test(n)) return {
        absoluteURL: void 0,
        isExternal: !1,
        to: n
    };
    let r = n,
        i = !1;
    if (Nt) try {
        let e = new URL(window.location.href),
            r = n.startsWith(`//`) ? new URL(e.protocol + n) : new URL(n),
            a = gt(r.pathname, t);
        r.origin === e.origin && a != null ? n = a + r.search + r.hash : i = !0
    } catch {
        He(!1, `<Link to="${n}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`)
    }
    return {
        absoluteURL: r,
        isExternal: i,
        to: n
    }
}
Object.getOwnPropertyNames(Object.prototype).sort().join(`\0`);
var Ft = [`POST`, `PUT`, `PATCH`, `DELETE`];
new Set(Ft);
var It = [`GET`, ...Ft];
new Set(It);
var Lt = T.createContext(null);
Lt.displayName = `DataRouter`;
var Rt = T.createContext(null);
Rt.displayName = `DataRouterState`;
var zt = T.createContext(!1);

function Bt() {
    return T.useContext(zt)
}
var Vt = T.createContext({
    isTransitioning: !1
});
Vt.displayName = `ViewTransition`;
var Ht = T.createContext(new Map);
Ht.displayName = `Fetchers`;
var Ut = T.createContext(null);
Ut.displayName = `Await`;
var Wt = T.createContext(null);
Wt.displayName = `Navigation`;
var Gt = T.createContext(null);
Gt.displayName = `Location`;
var Kt = T.createContext({
    outlet: null,
    matches: [],
    isDataRoute: !1
});
Kt.displayName = `Route`;
var qt = T.createContext(null);
qt.displayName = `RouteError`;
var Jt = `REACT_ROUTER_ERROR`,
    Yt = `REDIRECT`,
    Xt = `ROUTE_ERROR_RESPONSE`;

function Zt(e) {
    if (e.startsWith(`${Jt}:${Yt}:{`)) try {
        let t = JSON.parse(e.slice(28));
        if (typeof t == `object` && t && typeof t.status == `number` && typeof t.statusText == `string` && typeof t.location == `string` && typeof t.reloadDocument == `boolean` && typeof t.replace == `boolean`) return t
    } catch {}
}

function Qt(e) {
    if (e.startsWith(`${Jt}:${Xt}:{`)) try {
        let t = JSON.parse(e.slice(40));
        if (typeof t == `object` && t && typeof t.status == `number` && typeof t.statusText == `string`) return new At(t.status, t.statusText, t.data)
    } catch {}
}

function $t(e, {
    relative: t
} = {}) {
    E(en(), `useHref() may be used only in the context of a <Router> component.`);
    let {
        basename: n,
        navigator: r
    } = T.useContext(Wt), {
        hash: i,
        pathname: a,
        search: o
    } = sn(e, {
        relative: t
    }), s = a;
    return n !== `/` && (s = a === `/` ? n : Tt([n, a])), r.createHref({
        pathname: s,
        search: o,
        hash: i
    })
}

function en() {
    return T.useContext(Gt) != null
}

function D() {
    return E(en(), `useLocation() may be used only in the context of a <Router> component.`), T.useContext(Gt).location
}
var tn = `You should call navigate() in a React.useEffect(), not when your component is first rendered.`;

function nn(e) {
    T.useContext(Wt).static || T.useLayoutEffect(e)
}

function rn() {
    let {
        isDataRoute: e
    } = T.useContext(Kt);
    return e ? En() : an()
}

function an() {
    E(en(), `useNavigate() may be used only in the context of a <Router> component.`);
    let e = T.useContext(Lt),
        {
            basename: t,
            navigator: n
        } = T.useContext(Wt),
        {
            matches: r
        } = T.useContext(Kt),
        {
            pathname: i
        } = D(),
        a = JSON.stringify(St(r)),
        o = T.useRef(!1);
    return nn(() => {
        o.current = !0
    }), T.useCallback((r, s = {}) => {
        if (He(o.current, tn), !o.current) return;
        if (typeof r == `number`) {
            n.go(r);
            return
        }
        let c = Ct(r, JSON.parse(a), i, s.relative === `path`);
        e == null && t !== `/` && (c.pathname = c.pathname === `/` ? t : Tt([t, c.pathname])), (s.replace ? n.replace : n.push)(c, s.state, s)
    }, [t, n, a, i, e])
}
T.createContext(null);

function on() {
    let {
        matches: e
    } = T.useContext(Kt);
    return e[e.length - 1] ? .params ? ? {}
}

function sn(e, {
    relative: t
} = {}) {
    let {
        matches: n
    } = T.useContext(Kt), {
        pathname: r
    } = D(), i = JSON.stringify(St(n));
    return T.useMemo(() => Ct(e, JSON.parse(i), r, t === `path`), [e, i, r, t])
}

function cn(e, t) {
    return ln(e, t)
}

function ln(e, t, n) {
    E(en(), `useRoutes() may be used only in the context of a <Router> component.`);
    let {
        navigator: r
    } = T.useContext(Wt), {
        matches: i
    } = T.useContext(Kt), a = i[i.length - 1], o = a ? a.params : {}, s = a ? a.pathname : `/`, c = a ? a.pathnameBase : `/`, l = a && a.route; {
        let e = l && l.path || ``;
        On(s, !l || e.endsWith(`*`) || e.endsWith(`*?`), `You rendered descendant <Routes> (or called \`useRoutes()\`) at "${s}" (under <Route path="${e}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${e}"> to <Route path="${e===`/`?`*`:`${e}/*`}">.`)
    }
    let u = D(),
        d;
    if (t) {
        let e = typeof t == `string` ? qe(t) : t;
        E(c === `/` || e.pathname ? .startsWith(c), `When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, the location pathname must begin with the portion of the URL pathname that was matched by all parent routes. The current pathname base is "${c}" but pathname "${e.pathname}" was given in the \`location\` prop.`), d = e
    } else d = u;
    let f = d.pathname || `/`,
        p = f;
    if (c !== `/`) {
        let e = c.replace(/^\//, ``).split(`/`);
        p = `/` + f.replace(/^\//, ``).split(`/`).slice(e.length).join(`/`)
    }
    let m = n && n.state.matches.length ? n.state.matches.map(e => Object.assign(e, {
        route: n.manifest[e.route.id] || e.route
    })) : Xe(e, {
        pathname: p
    });
    He(l || m != null, `No routes matched location "${d.pathname}${d.search}${d.hash}" `), He(m == null || m[m.length - 1].route.element !== void 0 || m[m.length - 1].route.Component !== void 0 || m[m.length - 1].route.lazy !== void 0, `Matched leaf route at location "${d.pathname}${d.search}${d.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`);
    let h = gn(m && m.map(e => Object.assign({}, e, {
        params: Object.assign({}, o, e.params),
        pathname: Tt([c, r.encodeLocation ? r.encodeLocation(e.pathname.replace(/%/g, `%25`).replace(/\?/g, `%3F`).replace(/#/g, `%23`)).pathname : e.pathname]),
        pathnameBase: e.pathnameBase === `/` ? c : Tt([c, r.encodeLocation ? r.encodeLocation(e.pathnameBase.replace(/%/g, `%25`).replace(/\?/g, `%3F`).replace(/#/g, `%23`)).pathname : e.pathnameBase])
    })), i, n);
    return t && h ? T.createElement(Gt.Provider, {
        value: {
            location: {
                pathname: `/`,
                search: ``,
                hash: ``,
                state: null,
                key: `default`,
                mask: void 0,
                ...d
            },
            navigationType: `POP`
        }
    }, h) : h
}

function un() {
    let e = Tn(),
        t = jt(e) ? `${e.status} ${e.statusText}` : e instanceof Error ? e.message : JSON.stringify(e),
        n = e instanceof Error ? e.stack : null,
        r = `rgba(200,200,200, 0.5)`,
        i = {
            padding: `0.5rem`,
            backgroundColor: r
        },
        a = {
            padding: `2px 4px`,
            backgroundColor: r
        },
        o = null;
    return o = T.createElement(T.Fragment, null, T.createElement(`p`, null, `💿 Hey developer 👋`), T.createElement(`p`, null, `You can provide a way better UX than this when your app throws errors by providing your own `, T.createElement(`code`, {
        style: a
    }, `ErrorBoundary`), ` or`, ` `, T.createElement(`code`, {
        style: a
    }, `errorElement`), ` prop on your route.`)), T.createElement(T.Fragment, null, T.createElement(`h2`, null, `Unexpected Application Error!`), T.createElement(`h3`, {
        style: {
            fontStyle: `italic`
        }
    }, t), n ? T.createElement(`pre`, {
        style: i
    }, n) : null, o)
}
var dn = T.createElement(un, null),
    fn = class extends T.Component {
        constructor(e) {
            super(e), this.state = {
                location: e.location,
                revalidation: e.revalidation,
                error: e.error
            }
        }
        static getDerivedStateFromError(e) {
            return {
                error: e
            }
        }
        static getDerivedStateFromProps(e, t) {
            return t.location !== e.location || t.revalidation !== `idle` && e.revalidation === `idle` ? {
                error: e.error,
                location: e.location,
                revalidation: e.revalidation
            } : {
                error: e.error === void 0 ? t.error : e.error,
                location: t.location,
                revalidation: e.revalidation || t.revalidation
            }
        }
        componentDidCatch(e, t) {
            this.props.onError && this.props.onError(e, t)
        }
        render() {
            let e = this.state.error;
            if (this.context && typeof e == `object` && e && `digest` in e && typeof e.digest == `string`) {
                let t = Qt(e.digest);
                t && (e = t)
            }
            let t = e === void 0 ? this.props.children : T.createElement(Kt.Provider, {
                value: this.props.routeContext
            }, T.createElement(qt.Provider, {
                value: e,
                children: this.props.component
            }));
            return this.context ? T.createElement(mn, {
                error: e
            }, t) : t
        }
    };
fn.contextType = zt;
var pn = new WeakMap;

function mn({
    children: e,
    error: t
}) {
    let {
        basename: n
    } = T.useContext(Wt);
    if (typeof t == `object` && t && `digest` in t && typeof t.digest == `string`) {
        let e = Zt(t.digest);
        if (e) {
            let r = pn.get(t);
            if (r) throw r;
            let i = Pt(e.location, n);
            if (Nt && !pn.get(t))
                if (i.isExternal || e.reloadDocument) window.location.href = i.absoluteURL || i.to;
                else {
                    let n = Promise.resolve().then(() => window.__reactRouterDataRouter.navigate(i.to, {
                        replace: e.replace
                    }));
                    throw pn.set(t, n), n
                }
            return T.createElement(`meta`, {
                httpEquiv: `refresh`,
                content: `0;url=${i.absoluteURL||i.to}`
            })
        }
    }
    return e
}

function hn({
    routeContext: e,
    match: t,
    children: n
}) {
    let r = T.useContext(Lt);
    return r && r.static && r.staticContext && (t.route.errorElement || t.route.ErrorBoundary) && (r.staticContext._deepestRenderedBoundaryId = t.route.id), T.createElement(Kt.Provider, {
        value: e
    }, n)
}

function gn(e, t = [], n) {
    let r = n ? .state;
    if (e == null) {
        if (!r) return null;
        if (r.errors) e = r.matches;
        else if (t.length === 0 && !r.initialized && r.matches.length > 0) e = r.matches;
        else return null
    }
    let i = e,
        a = r ? .errors;
    if (a != null) {
        let e = i.findIndex(e => e.route.id && a ? .[e.route.id] !== void 0);
        E(e >= 0, `Could not find a matching route for errors on route IDs: ${Object.keys(a).join(`,`)}`), i = i.slice(0, Math.min(i.length, e + 1))
    }
    let o = !1,
        s = -1;
    if (n && r) {
        o = r.renderFallback;
        for (let e = 0; e < i.length; e++) {
            let t = i[e];
            if ((t.route.HydrateFallback || t.route.hydrateFallbackElement) && (s = e), t.route.id) {
                let {
                    loaderData: e,
                    errors: a
                } = r, c = t.route.loader && !e.hasOwnProperty(t.route.id) && (!a || a[t.route.id] === void 0);
                if (t.route.lazy || c) {
                    n.isStatic && (o = !0), i = s >= 0 ? i.slice(0, s + 1) : [i[0]];
                    break
                }
            }
        }
    }
    let c = n ? .onError,
        l = r && c ? (e, t) => {
            c(e, {
                location: r.location,
                params: r.matches ? .[0] ? .params ? ? {},
                pattern: Mt(r.matches),
                errorInfo: t
            })
        } : void 0;
    return i.reduceRight((e, n, c) => {
        let u, d = !1,
            f = null,
            p = null;
        r && (u = a && n.route.id ? a[n.route.id] : void 0, f = n.route.errorElement || dn, o && (s < 0 && c === 0 ? (On(`route-fallback`, !1, "No `HydrateFallback` element provided to render during initial hydration"), d = !0, p = null) : s === c && (d = !0, p = n.route.hydrateFallbackElement || null)));
        let m = t.concat(i.slice(0, c + 1)),
            h = () => {
                let t;
                return t = u ? f : d ? p : n.route.Component ? T.createElement(n.route.Component, null) : n.route.element ? n.route.element : e, T.createElement(hn, {
                    match: n,
                    routeContext: {
                        outlet: e,
                        matches: m,
                        isDataRoute: r != null
                    },
                    children: t
                })
            };
        return r && (n.route.ErrorBoundary || n.route.errorElement || c === 0) ? T.createElement(fn, {
            location: r.location,
            revalidation: r.revalidation,
            component: f,
            error: u,
            children: h(),
            routeContext: {
                outlet: null,
                matches: m,
                isDataRoute: !0
            },
            onError: l
        }) : h()
    }, null)
}

function _n(e) {
    return `${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`
}

function vn(e) {
    let t = T.useContext(Lt);
    return E(t, _n(e)), t
}

function yn(e) {
    let t = T.useContext(Rt);
    return E(t, _n(e)), t
}

function bn(e) {
    let t = T.useContext(Kt);
    return E(t, _n(e)), t
}

function xn(e) {
    let t = bn(e),
        n = t.matches[t.matches.length - 1];
    return E(n.route.id, `${e} can only be used on routes that contain a unique "id"`), n.route.id
}

function Sn() {
    return xn(`useRouteId`)
}

function Cn() {
    let e = yn(`useNavigation`);
    return T.useMemo(() => {
        let {
            matches: t,
            historyAction: n,
            ...r
        } = e.navigation;
        return r
    }, [e.navigation])
}

function wn() {
    let {
        matches: e,
        loaderData: t
    } = yn(`useMatches`);
    return T.useMemo(() => e.map(e => Qe(e, t)), [e, t])
}

function Tn() {
    let e = T.useContext(qt),
        t = yn(`useRouteError`),
        n = xn(`useRouteError`);
    return e === void 0 ? t.errors ? .[n] : e
}

function En() {
    let {
        router: e
    } = vn(`useNavigate`), t = xn(`useNavigate`), n = T.useRef(!1);
    return nn(() => {
        n.current = !0
    }), T.useCallback(async (r, i = {}) => {
        He(n.current, tn), n.current && (typeof r == `number` ? await e.navigate(r) : await e.navigate(r, {
            fromRouteId: t,
            ...i
        }))
    }, [e, t])
}
var Dn = {};

function On(e, t, n) {
    !t && !Dn[e] && (Dn[e] = !0, He(!1, n))
}
T.memo(kn);

function kn({
    routes: e,
    manifest: t,
    future: n,
    state: r,
    isStatic: i,
    onError: a
}) {
    return ln(e, void 0, {
        manifest: t,
        state: r,
        isStatic: i,
        onError: a,
        future: n
    })
}

function An({
    to: e,
    replace: t,
    state: n,
    relative: r
}) {
    E(en(), `<Navigate> may be used only in the context of a <Router> component.`);
    let {
        static: i
    } = T.useContext(Wt);
    He(!i, `<Navigate> must not be used on the initial render in a <StaticRouter>. This is a no-op, but you should modify your code so the <Navigate> is only ever rendered in response to some user interaction or state change.`);
    let {
        matches: a
    } = T.useContext(Kt), {
        pathname: o
    } = D(), s = rn(), c = Ct(e, St(a), o, r === `path`), l = JSON.stringify(c);
    return T.useEffect(() => {
        s(JSON.parse(l), {
            replace: t,
            state: n,
            relative: r
        })
    }, [s, l, r, t, n]), null
}

function jn(e) {
    E(!1, `A <Route> is only ever to be used as the child of <Routes> element, never rendered directly. Please wrap your <Route> in a <Routes>.`)
}

function Mn({
    basename: e = `/`,
    children: t = null,
    location: n,
    navigationType: r = `POP`,
    navigator: i,
    static: a = !1,
    useTransitions: o
}) {
    E(!en(), `You cannot render a <Router> inside another <Router>. You should never have more than one in your app.`);
    let s = e.replace(/^\/*/, `/`),
        c = T.useMemo(() => ({
            basename: s,
            navigator: i,
            static: a,
            useTransitions: o,
            future: {}
        }), [s, i, a, o]);
    typeof n == `string` && (n = qe(n));
    let {
        pathname: l = `/`,
        search: u = ``,
        hash: d = ``,
        state: f = null,
        key: p = `default`,
        mask: m
    } = n, h = T.useMemo(() => {
        let e = gt(l, s);
        return e == null ? null : {
            location: {
                pathname: e,
                search: u,
                hash: d,
                state: f,
                key: p,
                mask: m
            },
            navigationType: r
        }
    }, [s, l, u, d, f, p, r, m]);
    return He(h != null, `<Router basename="${s}"> is not able to match the URL "${l}${u}${d}" because it does not start with the basename, so the <Router> won't render anything.`), h == null ? null : T.createElement(Wt.Provider, {
        value: c
    }, T.createElement(Gt.Provider, {
        children: t,
        value: h
    }))
}

function Nn({
    children: e,
    location: t
}) {
    return cn(Pn(e), t)
}
T.Component;

function Pn(e, t = []) {
    let n = [];
    return T.Children.forEach(e, (e, r) => {
        if (!T.isValidElement(e)) return;
        let i = [...t, r];
        if (e.type === T.Fragment) {
            n.push.apply(n, Pn(e.props.children, i));
            return
        }
        E(e.type === jn, `[${typeof e.type==`string`?e.type:e.type.name}] is not a <Route> component. All component children of <Routes> must be a <Route> or <React.Fragment>`), E(!e.props.index || !e.props.children, `An index route cannot have child routes.`);
        let a = {
            id: e.props.id || i.join(`-`),
            caseSensitive: e.props.caseSensitive,
            element: e.props.element,
            Component: e.props.Component,
            index: e.props.index,
            path: e.props.path,
            middleware: e.props.middleware,
            loader: e.props.loader,
            action: e.props.action,
            hydrateFallbackElement: e.props.hydrateFallbackElement,
            HydrateFallback: e.props.HydrateFallback,
            errorElement: e.props.errorElement,
            ErrorBoundary: e.props.ErrorBoundary,
            hasErrorBoundary: e.props.hasErrorBoundary === !0 || e.props.ErrorBoundary != null || e.props.errorElement != null,
            shouldRevalidate: e.props.shouldRevalidate,
            handle: e.props.handle,
            lazy: e.props.lazy
        };
        e.props.children && (a.children = Pn(e.props.children, i)), n.push(a)
    }), n
}
var Fn = `get`,
    In = `application/x-www-form-urlencoded`;

function Ln(e) {
    return typeof HTMLElement < `u` && e instanceof HTMLElement
}

function Rn(e) {
    return Ln(e) && e.tagName.toLowerCase() === `button`
}

function zn(e) {
    return Ln(e) && e.tagName.toLowerCase() === `form`
}

function Bn(e) {
    return Ln(e) && e.tagName.toLowerCase() === `input`
}

function Vn(e) {
    return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
}

function Hn(e, t) {
    return e.button === 0 && (!t || t === `_self`) && !Vn(e)
}

function Un(e = ``) {
    return new URLSearchParams(typeof e == `string` || Array.isArray(e) || e instanceof URLSearchParams ? e : Object.keys(e).reduce((t, n) => {
        let r = e[n];
        return t.concat(Array.isArray(r) ? r.map(e => [n, e]) : [
            [n, r]
        ])
    }, []))
}

function Wn(e, t) {
    let n = Un(e);
    return t && t.forEach((e, r) => {
        n.has(r) || t.getAll(r).forEach(e => {
            n.append(r, e)
        })
    }), n
}
var Gn = null;

function Kn() {
    if (Gn === null) try {
        new FormData(document.createElement(`form`), 0), Gn = !1
    } catch {
        Gn = !0
    }
    return Gn
}
var qn = new Set([`application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`]);

function Jn(e) {
    return e != null && !qn.has(e) ? (He(!1, `"${e}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${In}"`), null) : e
}

function Yn(e, t) {
    let n, r, i, a, o;
    if (zn(e)) {
        let o = e.getAttribute(`action`);
        r = o ? gt(o, t) : null, n = e.getAttribute(`method`) || Fn, i = Jn(e.getAttribute(`enctype`)) || In, a = new FormData(e)
    } else if (Rn(e) || Bn(e) && (e.type === `submit` || e.type === `image`)) {
        let o = e.form;
        if (o == null) throw Error(`Cannot submit a <button> or <input type="submit"> without a <form>`);
        let s = e.getAttribute(`formaction`) || o.getAttribute(`action`);
        if (r = s ? gt(s, t) : null, n = e.getAttribute(`formmethod`) || o.getAttribute(`method`) || Fn, i = Jn(e.getAttribute(`formenctype`)) || Jn(o.getAttribute(`enctype`)) || In, a = new FormData(o, e), !Kn()) {
            let {
                name: t,
                type: n,
                value: r
            } = e;
            if (n === `image`) {
                let e = t ? `${t}.` : ``;
                a.append(`${e}x`, `0`), a.append(`${e}y`, `0`)
            } else t && a.append(t, r)
        }
    } else if (Ln(e)) throw Error(`Cannot submit element that is not <form>, <button>, or <input type="submit|image">`);
    else n = Fn, r = null, i = In, o = e;
    return a && i === `text/plain` && (o = a, a = void 0), {
        action: r,
        method: n.toLowerCase(),
        encType: i,
        formData: a,
        body: o
    }
}
Object.getOwnPropertyNames(Object.prototype).sort().join(`\0`);
var Xn = {
        "&": `\\u0026`,
        ">": `\\u003e`,
        "<": `\\u003c`,
        "\u2028": `\\u2028`,
        "\u2029": `\\u2029`
    },
    Zn = /[&><\u2028\u2029]/g;

function Qn(e) {
    return e.replace(Zn, e => Xn[e])
}

function $n(e, t) {
    if (e === !1 || e == null) throw Error(t)
}

function er(e, t, n, r) {
    let i = typeof e == `string` ? new URL(e, typeof window > `u` ? `server://singlefetch/` : window.location.origin) : e;
    return n ? i.pathname.endsWith(`/`) ? i.pathname = `${i.pathname}_.${r}` : i.pathname = `${i.pathname}.${r}` : i.pathname === `/` ? i.pathname = `_root.${r}` : t && gt(i.pathname, t) === `/` ? i.pathname = `${Et(t)}/_root.${r}` : i.pathname = `${Et(i.pathname)}.${r}`, i
}
async function tr(e, t) {
    if (e.id in t) return t[e.id];
    try {
        let r = await n(() =>
            import (e.module), []);
        return t[e.id] = r, r
    } catch {
        return window.__reactRouterContext && window.__reactRouterContext.isSpaMode, window.location.reload(), new Promise(() => {})
    }
}

function nr(e) {
    return e != null && typeof e.page == `string`
}

function rr(e) {
    return e == null ? !1 : e.href == null ? e.rel === `preload` && typeof e.imageSrcSet == `string` && typeof e.imageSizes == `string` : typeof e.rel == `string` && typeof e.href == `string`
}
async function ir(e, t, n) {
    return lr((await Promise.all(e.map(async e => {
        let r = t.routes[e.route.id];
        if (r) {
            let e = await tr(r, n);
            return e.links ? e.links() : []
        }
        return []
    }))).flat(1).filter(rr).filter(e => e.rel === `stylesheet` || e.rel === `preload`).map(e => e.rel === `stylesheet` ? { ...e,
        rel: `prefetch`,
        as: `style`
    } : { ...e,
        rel: `prefetch`
    }))
}

function ar(e, t, n, r, i, a) {
    let o = (e, t) => n[t] ? e.route.id !== n[t].route.id : !0,
        s = (e, t) => n[t].pathname !== e.pathname || n[t].route.path ? .endsWith(`*`) && n[t].params[`*`] !== e.params[`*`];
    return a === `assets` ? t.filter((e, t) => o(e, t) || s(e, t)) : a === `data` ? t.filter((t, a) => {
        let c = r.routes[t.route.id];
        if (!c || !c.hasLoader) return !1;
        if (o(t, a) || s(t, a)) return !0;
        if (t.route.shouldRevalidate) {
            let r = t.route.shouldRevalidate({
                currentUrl: new URL(i.pathname + i.search + i.hash, window.origin),
                currentParams: n[0] ? .params || {},
                nextUrl: new URL(e, window.origin),
                nextParams: t.params,
                defaultShouldRevalidate: !0
            });
            if (typeof r == `boolean`) return r
        }
        return !0
    }) : []
}

function or(e, t, {
    includeHydrateFallback: n
} = {}) {
    return sr(e.map(e => {
        let r = t.routes[e.route.id];
        if (!r) return [];
        let i = [r.module];
        return r.clientActionModule && (i = i.concat(r.clientActionModule)), r.clientLoaderModule && (i = i.concat(r.clientLoaderModule)), n && r.hydrateFallbackModule && (i = i.concat(r.hydrateFallbackModule)), r.imports && (i = i.concat(r.imports)), i
    }).flat(1))
}

function sr(e) {
    return [...new Set(e)]
}

function cr(e) {
    let t = {},
        n = Object.keys(e).sort();
    for (let r of n) t[r] = e[r];
    return t
}

function lr(e, t) {
    let n = new Set,
        r = new Set(t);
    return e.reduce((e, i) => {
        if (t && !nr(i) && i.as === `script` && i.href && r.has(i.href)) return e;
        let a = JSON.stringify(cr(i));
        return n.has(a) || (n.add(a), e.push({
            key: a,
            link: i
        })), e
    }, [])
}

function ur() {
    let e = T.useContext(Lt);
    return $n(e, `You must render this element inside a <DataRouterContext.Provider> element`), e
}

function dr() {
    let e = T.useContext(Rt);
    return $n(e, `You must render this element inside a <DataRouterStateContext.Provider> element`), e
}
var fr = T.createContext(void 0);
fr.displayName = `FrameworkContext`;

function pr() {
    let e = T.useContext(fr);
    return $n(e, `You must render this element inside a <HydratedRouter> element`), e
}

function mr(e, t) {
    let n = T.useContext(fr),
        [r, i] = T.useState(!1),
        [a, o] = T.useState(!1),
        {
            onFocus: s,
            onBlur: c,
            onMouseEnter: l,
            onMouseLeave: u,
            onTouchStart: d
        } = t,
        f = T.useRef(null);
    T.useEffect(() => {
        if (e === `render` && o(!0), e === `viewport`) {
            let e = new IntersectionObserver(e => {
                e.forEach(e => {
                    o(e.isIntersecting)
                })
            }, {
                threshold: .5
            });
            return f.current && e.observe(f.current), () => {
                e.disconnect()
            }
        }
    }, [e]), T.useEffect(() => {
        if (r) {
            let e = setTimeout(() => {
                o(!0)
            }, 100);
            return () => {
                clearTimeout(e)
            }
        }
    }, [r]);
    let p = () => {
            i(!0)
        },
        m = () => {
            i(!1), o(!1)
        };
    return n ? e === `intent` ? [a, f, {
        onFocus: hr(s, p),
        onBlur: hr(c, m),
        onMouseEnter: hr(l, p),
        onMouseLeave: hr(u, m),
        onTouchStart: hr(d, p)
    }] : [a, f, {}] : [!1, f, {}]
}

function hr(e, t) {
    return n => {
        e && e(n), n.defaultPrevented || t(n)
    }
}

function gr({
    page: e,
    ...t
}) {
    let n = Bt(),
        {
            router: r
        } = ur(),
        i = T.useMemo(() => Xe(r.routes, e, r.basename), [r.routes, e, r.basename]);
    return i ? n ? T.createElement(vr, {
        page: e,
        matches: i,
        ...t
    }) : T.createElement(yr, {
        page: e,
        matches: i,
        ...t
    }) : null
}

function _r(e) {
    let {
        manifest: t,
        routeModules: n
    } = pr(), [r, i] = T.useState([]);
    return T.useEffect(() => {
        let r = !1;
        return ir(e, t, n).then(e => {
            r || i(e)
        }), () => {
            r = !0
        }
    }, [e, t, n]), r
}

function vr({
    page: e,
    matches: t,
    ...n
}) {
    let r = D(),
        {
            future: i
        } = pr(),
        {
            basename: a
        } = ur(),
        o = T.useMemo(() => {
            if (e === r.pathname + r.search + r.hash) return [];
            let n = er(e, a, i.v8_trailingSlashAwareDataRequests, `rsc`),
                o = !1,
                s = [];
            for (let e of t) typeof e.route.shouldRevalidate == `function` ? o = !0 : s.push(e.route.id);
            return o && s.length > 0 && n.searchParams.set(`_routes`, s.join(`,`)), [n.pathname + n.search]
        }, [a, i.v8_trailingSlashAwareDataRequests, e, r, t]);
    return T.createElement(T.Fragment, null, o.map(e => T.createElement(`link`, {
        key: e,
        rel: `prefetch`,
        as: `fetch`,
        href: e,
        ...n
    })))
}

function yr({
    page: e,
    matches: t,
    ...n
}) {
    let r = D(),
        {
            future: i,
            manifest: a,
            routeModules: o
        } = pr(),
        {
            basename: s
        } = ur(),
        {
            loaderData: c,
            matches: l
        } = dr(),
        u = T.useMemo(() => ar(e, t, l, a, r, `data`), [e, t, l, a, r]),
        d = T.useMemo(() => ar(e, t, l, a, r, `assets`), [e, t, l, a, r]),
        f = T.useMemo(() => {
            if (e === r.pathname + r.search + r.hash) return [];
            let n = new Set,
                l = !1;
            if (t.forEach(e => {
                    let t = a.routes[e.route.id];
                    !t || !t.hasLoader || (!u.some(t => t.route.id === e.route.id) && e.route.id in c && o[e.route.id] ? .shouldRevalidate || t.hasClientLoader ? l = !0 : n.add(e.route.id))
                }), n.size === 0) return [];
            let d = er(e, s, i.v8_trailingSlashAwareDataRequests, `data`);
            return l && n.size > 0 && d.searchParams.set(`_routes`, t.filter(e => n.has(e.route.id)).map(e => e.route.id).join(`,`)), [d.pathname + d.search]
        }, [s, i.v8_trailingSlashAwareDataRequests, c, r, a, u, t, e, o]),
        p = T.useMemo(() => or(d, a), [d, a]),
        m = _r(d);
    return T.createElement(T.Fragment, null, f.map(e => T.createElement(`link`, {
        key: e,
        rel: `prefetch`,
        as: `fetch`,
        href: e,
        ...n
    })), p.map(e => T.createElement(`link`, {
        key: e,
        rel: `modulepreload`,
        href: e,
        ...n
    })), m.map(({
        key: e,
        link: t
    }) => T.createElement(`link`, {
        key: e,
        nonce: n.nonce,
        ...t,
        crossOrigin: t.crossOrigin ? ? n.crossOrigin
    })))
}

function br(...e) {
    return t => {
        e.forEach(e => {
            typeof e == `function` ? e(t) : e != null && (e.current = t)
        })
    }
}
T.Component;
var xr = typeof window < `u` && window.document !== void 0 && window.document.createElement !== void 0;
try {
    xr && (window.__reactRouterVersion = `7.17.0`)
} catch {}

function Sr({
    basename: e,
    children: t,
    useTransitions: n,
    window: r
}) {
    let i = T.useRef();
    i.current ? ? = Ve({
        window: r,
        v5Compat: !0
    });
    let a = i.current,
        [o, s] = T.useState({
            action: a.action,
            location: a.location
        }),
        c = T.useCallback(e => {
            n === !1 ? s(e) : T.startTransition(() => s(e))
        }, [n]);
    return T.useLayoutEffect(() => a.listen(c), [a, c]), T.createElement(Mn, {
        basename: e,
        children: t,
        location: o.location,
        navigationType: o.action,
        navigator: a,
        useTransitions: n
    })
}

function Cr({
    basename: e,
    children: t,
    history: n,
    useTransitions: r
}) {
    let [i, a] = T.useState({
        action: n.action,
        location: n.location
    }), o = T.useCallback(e => {
        r === !1 ? a(e) : T.startTransition(() => a(e))
    }, [r]);
    return T.useLayoutEffect(() => n.listen(o), [n, o]), T.createElement(Mn, {
        basename: e,
        children: t,
        location: i.location,
        navigationType: i.action,
        navigator: n,
        useTransitions: r
    })
}
Cr.displayName = `unstable_HistoryRouter`;
var wr = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,
    Tr = T.forwardRef(function({
        onClick: e,
        discover: t = `render`,
        prefetch: n = `none`,
        relative: r,
        reloadDocument: i,
        replace: a,
        mask: o,
        state: s,
        target: c,
        to: l,
        preventScrollReset: u,
        viewTransition: d,
        defaultShouldRevalidate: f,
        ...p
    }, m) {
        let {
            basename: h,
            navigator: g,
            useTransitions: _
        } = T.useContext(Wt), v = typeof l == `string` && wr.test(l), y = Pt(l, h);
        l = y.to;
        let b = $t(l, {
                relative: r
            }),
            x = D(),
            ee = null;
        if (o) {
            let e = Ct(o, [], x.mask ? x.mask.pathname : `/`, !0);
            h !== `/` && (e.pathname = e.pathname === `/` ? h : Tt([h, e.pathname])), ee = g.createHref(e)
        }
        let [te, ne, re] = mr(n, p), ie = Mr(l, {
            replace: a,
            mask: o,
            state: s,
            target: c,
            preventScrollReset: u,
            relative: r,
            viewTransition: d,
            defaultShouldRevalidate: f,
            useTransitions: _
        });

        function ae(t) {
            e && e(t), t.defaultPrevented || ie(t)
        }
        let oe = !(y.isExternal || i),
            se = T.createElement(`a`, { ...p,
                ...re,
                href: (oe ? ee : void 0) || y.absoluteURL || b,
                onClick: oe ? ae : e,
                ref: br(m, ne),
                target: c,
                "data-discover": !v && t === `render` ? `true` : void 0
            });
        return te && !v ? T.createElement(T.Fragment, null, se, T.createElement(gr, {
            page: b
        })) : se
    });
Tr.displayName = `Link`;
var Er = T.forwardRef(function({
    "aria-current": e = `page`,
    caseSensitive: t = !1,
    className: n = ``,
    end: r = !1,
    style: i,
    to: a,
    viewTransition: o,
    children: s,
    ...c
}, l) {
    let u = sn(a, {
            relative: c.relative
        }),
        d = D(),
        f = T.useContext(Rt),
        {
            navigator: p,
            basename: m
        } = T.useContext(Wt),
        h = f != null && Ur(u) && o === !0,
        g = p.encodeLocation ? p.encodeLocation(u).pathname : u.pathname,
        _ = d.pathname,
        v = f && f.navigation && f.navigation.location ? f.navigation.location.pathname : null;
    t || (_ = _.toLowerCase(), v = v ? v.toLowerCase() : null, g = g.toLowerCase()), v && m && (v = gt(v, m) || v);
    let y = g !== `/` && g.endsWith(`/`) ? g.length - 1 : g.length,
        b = _ === g || !r && _.startsWith(g) && _.charAt(y) === `/`,
        x = v != null && (v === g || !r && v.startsWith(g) && v.charAt(g.length) === `/`),
        ee = {
            isActive: b,
            isPending: x,
            isTransitioning: h
        },
        te = b ? e : void 0,
        ne;
    ne = typeof n == `function` ? n(ee) : [n, b ? `active` : null, x ? `pending` : null, h ? `transitioning` : null].filter(Boolean).join(` `);
    let re = typeof i == `function` ? i(ee) : i;
    return T.createElement(Tr, { ...c,
        "aria-current": te,
        className: ne,
        ref: l,
        style: re,
        to: a,
        viewTransition: o
    }, typeof s == `function` ? s(ee) : s)
});
Er.displayName = `NavLink`;
var Dr = T.forwardRef(({
    discover: e = `render`,
    fetcherKey: t,
    navigate: n,
    reloadDocument: r,
    replace: i,
    state: a,
    method: o = Fn,
    action: s,
    onSubmit: c,
    relative: l,
    preventScrollReset: u,
    viewTransition: d,
    defaultShouldRevalidate: f,
    ...p
}, m) => {
    let {
        useTransitions: h
    } = T.useContext(Wt), g = Ir(), _ = Lr(s, {
        relative: l
    }), v = o.toLowerCase() === `get` ? `get` : `post`, y = typeof s == `string` && wr.test(s);
    return T.createElement(`form`, {
        ref: m,
        method: v,
        action: _,
        onSubmit: r ? c : e => {
            if (c && c(e), e.defaultPrevented) return;
            e.preventDefault();
            let r = e.nativeEvent.submitter,
                s = r ? .getAttribute(`formmethod`) || o,
                p = () => g(r || e.currentTarget, {
                    fetcherKey: t,
                    method: s,
                    navigate: n,
                    replace: i,
                    state: a,
                    relative: l,
                    preventScrollReset: u,
                    viewTransition: d,
                    defaultShouldRevalidate: f
                });
            h && n !== !1 ? T.startTransition(() => p()) : p()
        },
        ...p,
        "data-discover": !y && e === `render` ? `true` : void 0
    })
});
Dr.displayName = `Form`;

function Or({
    getKey: e,
    storageKey: t,
    ...n
}) {
    let r = T.useContext(fr),
        {
            basename: i
        } = T.useContext(Wt),
        a = D(),
        o = wn();
    Vr({
        getKey: e,
        storageKey: t
    });
    let s = T.useMemo(() => {
        if (!r || !e) return null;
        let t = Br(a, o, i, e);
        return t === a.key ? null : t
    }, []);
    if (!r || r.isSpaMode) return null;
    let c = ((e, t) => {
        if (!window.history.state || !window.history.state.key) {
            let e = Math.random().toString(32).slice(2);
            window.history.replaceState({
                key: e
            }, ``)
        }
        try {
            let n = JSON.parse(sessionStorage.getItem(e) || `{}`)[t || window.history.state.key];
            typeof n == `number` && window.scrollTo(0, n)
        } catch {
            sessionStorage.removeItem(e)
        }
    }).toString();
    return T.createElement(`script`, { ...n,
        suppressHydrationWarning: !0,
        dangerouslySetInnerHTML: {
            __html: `(${c})(${Qn(JSON.stringify(t||Rr))}, ${Qn(JSON.stringify(s))})`
        }
    })
}
Or.displayName = `ScrollRestoration`;

function kr(e) {
    return `${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`
}

function Ar(e) {
    let t = T.useContext(Lt);
    return E(t, kr(e)), t
}

function jr(e) {
    let t = T.useContext(Rt);
    return E(t, kr(e)), t
}

function Mr(e, {
    target: t,
    replace: n,
    mask: r,
    state: i,
    preventScrollReset: a,
    relative: o,
    viewTransition: s,
    defaultShouldRevalidate: c,
    useTransitions: l
} = {}) {
    let u = rn(),
        d = D(),
        f = sn(e, {
            relative: o
        });
    return T.useCallback(p => {
        if (Hn(p, t)) {
            p.preventDefault();
            let t = n === void 0 ? Ke(d) === Ke(f) : n,
                m = () => u(e, {
                    replace: t,
                    mask: r,
                    state: i,
                    preventScrollReset: a,
                    relative: o,
                    viewTransition: s,
                    defaultShouldRevalidate: c
                });
            l ? T.startTransition(() => m()) : m()
        }
    }, [d, u, f, n, r, i, t, e, a, o, s, c, l])
}

function Nr(e) {
    He(typeof URLSearchParams < `u`, "You cannot use the `useSearchParams` hook in a browser that does not support the URLSearchParams API. If you need to support Internet Explorer 11, we recommend you load a polyfill such as https://github.com/ungap/url-search-params.");
    let t = T.useRef(Un(e)),
        n = T.useRef(!1),
        r = D(),
        i = T.useMemo(() => Wn(r.search, n.current ? null : t.current), [r.search]),
        a = rn();
    return [i, T.useCallback((e, t) => {
        let r = Un(typeof e == `function` ? e(new URLSearchParams(i)) : e);
        n.current = !0, a(`?` + r, t)
    }, [a, i])]
}
var Pr = 0,
    Fr = () => `__${String(++Pr)}__`;

function Ir() {
    let {
        router: e
    } = Ar(`useSubmit`), {
        basename: t
    } = T.useContext(Wt), n = Sn(), r = e.fetch, i = e.navigate;
    return T.useCallback(async (e, a = {}) => {
        let {
            action: o,
            method: s,
            encType: c,
            formData: l,
            body: u
        } = Yn(e, t);
        a.navigate === !1 ? await r(a.fetcherKey || Fr(), n, a.action || o, {
            defaultShouldRevalidate: a.defaultShouldRevalidate,
            preventScrollReset: a.preventScrollReset,
            formData: l,
            body: u,
            formMethod: a.method || s,
            formEncType: a.encType || c,
            flushSync: a.flushSync
        }) : await i(a.action || o, {
            defaultShouldRevalidate: a.defaultShouldRevalidate,
            preventScrollReset: a.preventScrollReset,
            formData: l,
            body: u,
            formMethod: a.method || s,
            formEncType: a.encType || c,
            replace: a.replace,
            state: a.state,
            fromRouteId: n,
            flushSync: a.flushSync,
            viewTransition: a.viewTransition
        })
    }, [r, i, t, n])
}

function Lr(e, {
    relative: t
} = {}) {
    let {
        basename: n
    } = T.useContext(Wt), r = T.useContext(Kt);
    E(r, `useFormAction must be used inside a RouteContext`);
    let [i] = r.matches.slice(-1), a = { ...sn(e || `.`, {
            relative: t
        })
    }, o = D();
    if (e == null) {
        a.search = o.search;
        let e = new URLSearchParams(a.search),
            t = e.getAll(`index`);
        if (t.some(e => e === ``)) {
            e.delete(`index`), t.filter(e => e).forEach(t => e.append(`index`, t));
            let n = e.toString();
            a.search = n ? `?${n}` : ``
        }
    }
    return (!e || e === `.`) && i.route.index && (a.search = a.search ? a.search.replace(/^\?/, `?index&`) : `?index`), n !== `/` && (a.pathname = a.pathname === `/` ? n : Tt([n, a.pathname])), Ke(a)
}
var Rr = `react-router-scroll-positions`,
    zr = {};

function Br(e, t, n, r) {
    let i = null;
    return r && (i = r(n === `/` ? e : { ...e,
        pathname: gt(e.pathname, n) || e.pathname
    }, t)), i ? ? = e.key, i
}

function Vr({
    getKey: e,
    storageKey: t
} = {}) {
    let {
        router: n
    } = Ar(`useScrollRestoration`), {
        restoreScrollPosition: r,
        preventScrollReset: i
    } = jr(`useScrollRestoration`), {
        basename: a
    } = T.useContext(Wt), o = D(), s = wn(), c = Cn();
    T.useEffect(() => (window.history.scrollRestoration = `manual`, () => {
        window.history.scrollRestoration = `auto`
    }), []), Hr(T.useCallback(() => {
        if (c.state === `idle`) {
            let t = Br(o, s, a, e);
            zr[t] = window.scrollY
        }
        try {
            sessionStorage.setItem(t || Rr, JSON.stringify(zr))
        } catch (e) {
            He(!1, `Failed to save scroll positions in sessionStorage, <ScrollRestoration /> will not work properly (${e}).`)
        }
        window.history.scrollRestoration = `auto`
    }, [c.state, e, a, o, s, t])), typeof document < `u` && (T.useLayoutEffect(() => {
        try {
            let e = sessionStorage.getItem(t || Rr);
            e && (zr = JSON.parse(e))
        } catch {}
    }, [t]), T.useLayoutEffect(() => {
        let t = n ? .enableScrollRestoration(zr, () => window.scrollY, e ? (t, n) => Br(t, n, a, e) : void 0);
        return () => t && t()
    }, [n, a, e]), T.useLayoutEffect(() => {
        if (r !== !1) {
            if (typeof r == `number`) {
                window.scrollTo(0, r);
                return
            }
            try {
                if (o.hash) {
                    let e = document.getElementById(decodeURIComponent(o.hash.slice(1)));
                    if (e) {
                        e.scrollIntoView();
                        return
                    }
                }
            } catch {
                He(!1, `"${o.hash.slice(1)}" is not a decodable element ID. The view will not scroll to it.`)
            }
            i !== !0 && window.scrollTo(0, 0)
        }
    }, [o, r, i]))
}

function Hr(e, t) {
    let {
        capture: n
    } = t || {};
    T.useEffect(() => {
        let t = n == null ? void 0 : {
            capture: n
        };
        return window.addEventListener(`pagehide`, e, t), () => {
            window.removeEventListener(`pagehide`, e, t)
        }
    }, [e, n])
}

function Ur(e, {
    relative: t
} = {}) {
    let n = T.useContext(Vt);
    E(n != null, "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?");
    let {
        basename: r
    } = Ar(`useViewTransitionState`), i = sn(e, {
        relative: t
    });
    if (!n.isTransitioning) return !1;
    let a = gt(n.currentLocation.pathname, r) || n.currentLocation.pathname,
        o = gt(n.nextLocation.pathname, r) || n.nextLocation.pathname;
    return pt(i.pathname, o) != null || pt(i.pathname, a) != null
}
var Wr = class {
        constructor() {
            this.listeners = new Set, this.subscribe = this.subscribe.bind(this)
        }
        subscribe(e) {
            return this.listeners.add(e), this.onSubscribe(), () => {
                this.listeners.delete(e), this.onUnsubscribe()
            }
        }
        hasListeners() {
            return this.listeners.size > 0
        }
        onSubscribe() {}
        onUnsubscribe() {}
    },
    Gr = new class extends Wr {#
        e;#
        t;#
        n;
        constructor() {
            super(), this.#n = e => {
                if (typeof window < `u` && window.addEventListener) {
                    let t = () => e();
                    return window.addEventListener(`visibilitychange`, t, !1), () => {
                        window.removeEventListener(`visibilitychange`, t)
                    }
                }
            }
        }
        onSubscribe() {
            this.#t || this.setEventListener(this.#n)
        }
        onUnsubscribe() {
            this.hasListeners() || (this.#t ? .(), this.#t = void 0)
        }
        setEventListener(e) {
            this.#n = e, this.#t ? .(), this.#t = e(e => {
                typeof e == `boolean` ? this.setFocused(e) : this.onFocus()
            })
        }
        setFocused(e) {
            this.#e !== e && (this.#e = e, this.onFocus())
        }
        onFocus() {
            let e = this.isFocused();
            this.listeners.forEach(t => {
                t(e)
            })
        }
        isFocused() {
            return typeof this.#e == `boolean` ? this.#e : globalThis.document ? .visibilityState !== `hidden`
        }
    },
    Kr = {
        setTimeout: (e, t) => setTimeout(e, t),
        clearTimeout: e => clearTimeout(e),
        setInterval: (e, t) => setInterval(e, t),
        clearInterval: e => clearInterval(e)
    },
    qr = new class {#
        e = Kr;
        setTimeoutProvider(e) {
            this.#e = e
        }
        setTimeout(e, t) {
            return this.#e.setTimeout(e, t)
        }
        clearTimeout(e) {
            this.#e.clearTimeout(e)
        }
        setInterval(e, t) {
            return this.#e.setInterval(e, t)
        }
        clearInterval(e) {
            this.#e.clearInterval(e)
        }
    };

function Jr(e) {
    setTimeout(e, 0)
}
var Yr = typeof window > `u` || `Deno` in globalThis;

function Xr() {}

function Zr(e, t) {
    return typeof e == `function` ? e(t) : e
}

function Qr(e) {
    return typeof e == `number` && e >= 0 && e !== 1 / 0
}

function $r(e, t) {
    return Math.max(e + (t || 0) - Date.now(), 0)
}

function ei(e, t) {
    return typeof e == `function` ? e(t) : e
}

function ti(e, t) {
    return typeof e == `function` ? e(t) : e
}

function ni(e, t) {
    let {
        type: n = `all`,
        exact: r,
        fetchStatus: i,
        predicate: a,
        queryKey: o,
        stale: s
    } = e;
    if (o) {
        if (r) {
            if (t.queryHash !== ii(o, t.options)) return !1
        } else if (!oi(t.queryKey, o)) return !1
    }
    if (n !== `all`) {
        let e = t.isActive();
        if (n === `active` && !e || n === `inactive` && e) return !1
    }
    return !(typeof s == `boolean` && t.isStale() !== s || i && i !== t.state.fetchStatus || a && !a(t))
}

function ri(e, t) {
    let {
        exact: n,
        status: r,
        predicate: i,
        mutationKey: a
    } = e;
    if (a) {
        if (!t.options.mutationKey) return !1;
        if (n) {
            if (ai(t.options.mutationKey) !== ai(a)) return !1
        } else if (!oi(t.options.mutationKey, a)) return !1
    }
    return !(r && t.state.status !== r || i && !i(t))
}

function ii(e, t) {
    return (t ? .queryKeyHashFn || ai)(e)
}

function ai(e) {
    return JSON.stringify(e, (e, t) => di(t) ? Object.keys(t).sort().reduce((e, n) => (e[n] = t[n], e), {}) : t)
}

function oi(e, t) {
    return e === t ? !0 : typeof e == typeof t && e && t && typeof e == `object` && typeof t == `object` ? Object.keys(t).every(n => oi(e[n], t[n])) : !1
}
var si = Object.prototype.hasOwnProperty;

function ci(e, t, n = 0) {
    if (e === t) return e;
    if (n > 500) return t;
    let r = ui(e) && ui(t);
    if (!r && !(di(e) && di(t))) return t;
    let i = (r ? e : Object.keys(e)).length,
        a = r ? t : Object.keys(t),
        o = a.length,
        s = r ? Array(o) : {},
        c = 0;
    for (let l = 0; l < o; l++) {
        let o = r ? l : a[l],
            u = e[o],
            d = t[o];
        if (u === d) {
            s[o] = u, (r ? l < i : si.call(e, o)) && c++;
            continue
        }
        if (u === null || d === null || typeof u != `object` || typeof d != `object`) {
            s[o] = d;
            continue
        }
        let f = ci(u, d, n + 1);
        s[o] = f, f === u && c++
    }
    return i === o && c === i ? e : s
}

function li(e, t) {
    if (!t || Object.keys(e).length !== Object.keys(t).length) return !1;
    for (let n in e)
        if (e[n] !== t[n]) return !1;
    return !0
}

function ui(e) {
    return Array.isArray(e) && e.length === Object.keys(e).length
}

function di(e) {
    if (!fi(e)) return !1;
    let t = e.constructor;
    if (t === void 0) return !0;
    let n = t.prototype;
    return !(!fi(n) || !n.hasOwnProperty(`isPrototypeOf`) || Object.getPrototypeOf(e) !== Object.prototype)
}

function fi(e) {
    return Object.prototype.toString.call(e) === `[object Object]`
}

function pi(e) {
    return new Promise(t => {
        qr.setTimeout(t, e)
    })
}

function mi(e, t, n) {
    return typeof n.structuralSharing == `function` ? n.structuralSharing(e, t) : n.structuralSharing === !1 ? t : ci(e, t)
}

function hi(e) {
    return e
}

function gi(e, t, n = 0) {
    let r = [...e, t];
    return n && r.length > n ? r.slice(1) : r
}

function _i(e, t, n = 0) {
    let r = [t, ...e];
    return n && r.length > n ? r.slice(0, -1) : r
}
var vi = Symbol();

function yi(e, t) {
    return !e.queryFn && t ? .initialPromise ? () => t.initialPromise : !e.queryFn || e.queryFn === vi ? () => Promise.reject(Error(`Missing queryFn: '${e.queryHash}'`)) : e.queryFn
}

function bi(e, t) {
    return typeof e == `function` ? e(...t) : !!e
}

function xi(e, t, n) {
    let r = !1,
        i;
    return Object.defineProperty(e, "signal", {
        enumerable: !0,
        get: () => (i ? ? = t(), r ? i : (r = !0, i.aborted ? n() : i.addEventListener(`abort`, n, {
            once: !0
        }), i))
    }), e
}
var Si = (() => {
    let e = () => Yr;
    return {
        isServer() {
            return e()
        },
        setIsServer(t) {
            e = t
        }
    }
})();

function Ci() {
    let e, t, n = new Promise((n, r) => {
        e = n, t = r
    });
    n.status = `pending`, n.catch(() => {});

    function r(e) {
        Object.assign(n, e), delete n.resolve, delete n.reject
    }
    return n.resolve = t => {
        r({
            status: `fulfilled`,
            value: t
        }), e(t)
    }, n.reject = e => {
        r({
            status: `rejected`,
            reason: e
        }), t(e)
    }, n
}
var wi = Jr;

function Ti() {
    let e = [],
        t = 0,
        n = e => {
            e()
        },
        r = e => {
            e()
        },
        i = wi,
        a = r => {
            t ? e.push(r) : i(() => {
                n(r)
            })
        },
        o = () => {
            let t = e;
            e = [], t.length && i(() => {
                r(() => {
                    t.forEach(e => {
                        n(e)
                    })
                })
            })
        };
    return {
        batch: e => {
            let n;
            t++;
            try {
                n = e()
            } finally {
                t--, t || o()
            }
            return n
        },
        batchCalls: e => (...t) => {
            a(() => {
                e(...t)
            })
        },
        schedule: a,
        setNotifyFunction: e => {
            n = e
        },
        setBatchNotifyFunction: e => {
            r = e
        },
        setScheduler: e => {
            i = e
        }
    }
}
var Ei = Ti(),
    Di = new class extends Wr {#
        e = !0;#
        t;#
        n;
        constructor() {
            super(), this.#n = e => {
                if (typeof window < `u` && window.addEventListener) {
                    let t = () => e(!0),
                        n = () => e(!1);
                    return window.addEventListener(`online`, t, !1), window.addEventListener(`offline`, n, !1), () => {
                        window.removeEventListener(`online`, t), window.removeEventListener(`offline`, n)
                    }
                }
            }
        }
        onSubscribe() {
            this.#t || this.setEventListener(this.#n)
        }
        onUnsubscribe() {
            this.hasListeners() || (this.#t ? .(), this.#t = void 0)
        }
        setEventListener(e) {
            this.#n = e, this.#t ? .(), this.#t = e(this.setOnline.bind(this))
        }
        setOnline(e) {
            this.#e !== e && (this.#e = e, this.listeners.forEach(t => {
                t(e)
            }))
        }
        isOnline() {
            return this.#e
        }
    };

function Oi(e) {
    return Math.min(1e3 * 2 ** e, 3e4)
}

function ki(e) {
    return (e ? ? `online`) === `online` ? Di.isOnline() : !0
}
var Ai = class extends Error {
    constructor(e) {
        super(`CancelledError`), this.revert = e ? .revert, this.silent = e ? .silent
    }
};

function ji(e) {
    let t = !1,
        n = 0,
        r, i = Ci(),
        a = () => i.status !== `pending`,
        o = t => {
            if (!a()) {
                let n = new Ai(t);
                f(n), e.onCancel ? .(n)
            }
        },
        s = () => {
            t = !0
        },
        c = () => {
            t = !1
        },
        l = () => Gr.isFocused() && (e.networkMode === `always` || Di.isOnline()) && e.canRun(),
        u = () => ki(e.networkMode) && e.canRun(),
        d = e => {
            a() || (r ? .(), i.resolve(e))
        },
        f = e => {
            a() || (r ? .(), i.reject(e))
        },
        p = () => new Promise(t => {
            r = e => {
                (a() || l()) && t(e)
            }, e.onPause ? .()
        }).then(() => {
            r = void 0, a() || e.onContinue ? .()
        }),
        m = () => {
            if (a()) return;
            let r, i = n === 0 ? e.initialPromise : void 0;
            try {
                r = i ? ? e.fn()
            } catch (e) {
                r = Promise.reject(e)
            }
            Promise.resolve(r).then(d).catch(r => {
                if (a()) return;
                let i = e.retry ? ? (Si.isServer() ? 0 : 3),
                    o = e.retryDelay ? ? Oi,
                    s = typeof o == `function` ? o(n, r) : o,
                    c = i === !0 || typeof i == `number` && n < i || typeof i == `function` && i(n, r);
                if (t || !c) {
                    f(r);
                    return
                }
                n++, e.onFail ? .(n, r), pi(s).then(() => l() ? void 0 : p()).then(() => {
                    t ? f(r) : m()
                })
            })
        };
    return {
        promise: i,
        status: () => i.status,
        cancel: o,
        continue: () => (r ? .(), i),
        cancelRetry: s,
        continueRetry: c,
        canStart: u,
        start: () => (u() ? m() : p().then(m), i)
    }
}
var Mi = class {#
    e;
    destroy() {
        this.clearGcTimeout()
    }
    scheduleGc() {
        this.clearGcTimeout(), Qr(this.gcTime) && (this.#e = qr.setTimeout(() => {
            this.optionalRemove()
        }, this.gcTime))
    }
    updateGcTime(e) {
        this.gcTime = Math.max(this.gcTime || 0, e ? ? (Si.isServer() ? 1 / 0 : 300 * 1e3))
    }
    clearGcTimeout() {
        this.#e !== void 0 && (qr.clearTimeout(this.#e), this.#e = void 0)
    }
};

function Ni(e) {
    return {
        onFetch: (t, n) => {
            let r = t.options,
                i = t.fetchOptions ? .meta ? .fetchMore ? .direction,
                a = t.state.data ? .pages || [],
                o = t.state.data ? .pageParams || [],
                s = {
                    pages: [],
                    pageParams: []
                },
                c = 0,
                l = async () => {
                    let n = !1,
                        l = e => {
                            xi(e, () => t.signal, () => n = !0)
                        },
                        u = yi(t.options, t.fetchOptions),
                        d = async (e, r, i) => {
                            if (n) return Promise.reject(t.signal.reason);
                            if (r == null && e.pages.length) return Promise.resolve(e);
                            let a = await u((() => {
                                    let e = {
                                        client: t.client,
                                        queryKey: t.queryKey,
                                        pageParam: r,
                                        direction: i ? `backward` : `forward`,
                                        meta: t.options.meta
                                    };
                                    return l(e), e
                                })()),
                                {
                                    maxPages: o
                                } = t.options,
                                s = i ? _i : gi;
                            return {
                                pages: s(e.pages, a, o),
                                pageParams: s(e.pageParams, r, o)
                            }
                        };
                    if (i && a.length) {
                        let e = i === `backward`,
                            t = e ? Fi : Pi,
                            n = {
                                pages: a,
                                pageParams: o
                            };
                        s = await d(n, t(r, n), e)
                    } else {
                        let t = e ? ? a.length;
                        do {
                            let e = c === 0 ? o[0] ? ? r.initialPageParam : Pi(r, s);
                            if (c > 0 && e == null) break;
                            s = await d(s, e), c++
                        } while (c < t)
                    }
                    return s
                };
            t.options.persister ? t.fetchFn = () => t.options.persister ? .(l, {
                client: t.client,
                queryKey: t.queryKey,
                meta: t.options.meta,
                signal: t.signal
            }, n) : t.fetchFn = l
        }
    }
}

function Pi(e, {
    pages: t,
    pageParams: n
}) {
    let r = t.length - 1;
    return t.length > 0 ? e.getNextPageParam(t[r], t, n[r], n) : void 0
}

function Fi(e, {
    pages: t,
    pageParams: n
}) {
    return t.length > 0 ? e.getPreviousPageParam ? .(t[0], t, n[0], n) : void 0
}
var Ii = class extends Mi {#
    e;#
    t;#
    n;#
    r;#
    i;#
    a;#
    o;#
    s;
    constructor(e) {
        super(), this.#s = !1, this.#o = e.defaultOptions, this.setOptions(e.options), this.observers = [], this.#i = e.client, this.#r = this.#i.getQueryCache(), this.queryKey = e.queryKey, this.queryHash = e.queryHash, this.#t = zi(this.options), this.state = e.state ? ? this.#t, this.scheduleGc()
    }
    get meta() {
        return this.options.meta
    }
    get queryType() {
        return this.#e
    }
    get promise() {
        return this.#a ? .promise
    }
    setOptions(e) {
        if (this.options = { ...this.#o,
                ...e
            }, e ? ._type && (this.#e = e._type), this.updateGcTime(this.options.gcTime), this.state && this.state.data === void 0) {
            let e = zi(this.options);
            e.data !== void 0 && (this.setState(Ri(e.data, e.dataUpdatedAt)), this.#t = e)
        }
    }
    optionalRemove() {
        !this.observers.length && this.state.fetchStatus === `idle` && this.#r.remove(this)
    }
    setData(e, t) {
        let n = mi(this.state.data, e, this.options);
        return this.#l({
            data: n,
            type: `success`,
            dataUpdatedAt: t ? .updatedAt,
            manual: t ? .manual
        }), n
    }
    setState(e) {
        this.#l({
            type: `setState`,
            state: e
        })
    }
    cancel(e) {
        let t = this.#a ? .promise;
        return this.#a ? .cancel(e), t ? t.then(Xr).catch(Xr) : Promise.resolve()
    }
    destroy() {
        super.destroy(), this.cancel({
            silent: !0
        })
    }
    get resetState() {
        return this.#t
    }
    reset() {
        this.destroy(), this.setState(this.resetState)
    }
    isActive() {
        return this.observers.some(e => ti(e.options.enabled, this) !== !1)
    }
    isDisabled() {
        return this.getObserversCount() > 0 ? !this.isActive() : this.options.queryFn === vi || !this.isFetched()
    }
    isFetched() {
        return this.state.dataUpdateCount + this.state.errorUpdateCount > 0
    }
    isStatic() {
        return this.getObserversCount() > 0 ? this.observers.some(e => ei(e.options.staleTime, this) === `static`) : !1
    }
    isStale() {
        return this.getObserversCount() > 0 ? this.observers.some(e => e.getCurrentResult().isStale) : this.state.data === void 0 || this.state.isInvalidated
    }
    isStaleByTime(e = 0) {
        return this.state.data === void 0 ? !0 : e === `static` ? !1 : this.state.isInvalidated ? !0 : !$r(this.state.dataUpdatedAt, e)
    }
    onFocus() {
        this.observers.find(e => e.shouldFetchOnWindowFocus()) ? .refetch({
            cancelRefetch: !1
        }), this.#a ? .continue()
    }
    onOnline() {
        this.observers.find(e => e.shouldFetchOnReconnect()) ? .refetch({
            cancelRefetch: !1
        }), this.#a ? .continue()
    }
    addObserver(e) {
        this.observers.includes(e) || (this.observers.push(e), this.clearGcTimeout(), this.#r.notify({
            type: `observerAdded`,
            query: this,
            observer: e
        }))
    }
    removeObserver(e) {
        this.observers.includes(e) && (this.observers = this.observers.filter(t => t !== e), this.observers.length || (this.#a && (this.#s || this.#c() ? this.#a.cancel({
            revert: !0
        }) : this.#a.cancelRetry()), this.scheduleGc()), this.#r.notify({
            type: `observerRemoved`,
            query: this,
            observer: e
        }))
    }
    getObserversCount() {
        return this.observers.length
    }#
    c() {
        return this.state.fetchStatus === `paused` && this.state.status === `pending`
    }
    invalidate() {
        this.state.isInvalidated || this.#l({
            type: `invalidate`
        })
    }
    async fetch(e, t) {
        if (this.state.fetchStatus !== `idle` && this.#a ? .status() !== `rejected`) {
            if (this.state.data !== void 0 && t ? .cancelRefetch) this.cancel({
                silent: !0
            });
            else if (this.#a) return this.#a.continueRetry(), this.#a.promise
        }
        if (e && this.setOptions(e), !this.options.queryFn) {
            let e = this.observers.find(e => e.options.queryFn);
            e && this.setOptions(e.options)
        }
        let n = new AbortController,
            r = e => {
                Object.defineProperty(e, "signal", {
                    enumerable: !0,
                    get: () => (this.#s = !0, n.signal)
                })
            },
            i = () => {
                let e = yi(this.options, t),
                    n = (() => {
                        let e = {
                            client: this.#i,
                            queryKey: this.queryKey,
                            meta: this.meta
                        };
                        return r(e), e
                    })();
                return this.#s = !1, this.options.persister ? this.options.persister(e, n, this) : e(n)
            },
            a = (() => {
                let e = {
                    fetchOptions: t,
                    options: this.options,
                    queryKey: this.queryKey,
                    client: this.#i,
                    state: this.state,
                    fetchFn: i
                };
                return r(e), e
            })();
        (this.#e === `infinite` ? Ni(this.options.pages) : this.options.behavior) ? .onFetch(a, this), this.#n = this.state, (this.state.fetchStatus === `idle` || this.state.fetchMeta !== a.fetchOptions ? .meta) && this.#l({
            type: `fetch`,
            meta: a.fetchOptions ? .meta
        }), this.#a = ji({
            initialPromise: t ? .initialPromise,
            fn: a.fetchFn,
            onCancel: e => {
                e instanceof Ai && e.revert && this.setState({ ...this.#n,
                    fetchStatus: `idle`
                }), n.abort()
            },
            onFail: (e, t) => {
                this.#l({
                    type: `failed`,
                    failureCount: e,
                    error: t
                })
            },
            onPause: () => {
                this.#l({
                    type: `pause`
                })
            },
            onContinue: () => {
                this.#l({
                    type: `continue`
                })
            },
            retry: a.options.retry,
            retryDelay: a.options.retryDelay,
            networkMode: a.options.networkMode,
            canRun: () => !0
        });
        try {
            let e = await this.#a.start();
            if (e === void 0) throw Error(`${this.queryHash} data is undefined`);
            return this.setData(e), this.#r.config.onSuccess ? .(e, this), this.#r.config.onSettled ? .(e, this.state.error, this), e
        } catch (e) {
            if (e instanceof Ai) {
                if (e.silent) return this.#a.promise;
                if (e.revert) {
                    if (this.state.data === void 0) throw e;
                    return this.state.data
                }
            }
            throw this.#l({
                type: `error`,
                error: e
            }), this.#r.config.onError ? .(e, this), this.#r.config.onSettled ? .(this.state.data, e, this), e
        } finally {
            this.scheduleGc()
        }
    }#
    l(e) {
        let t = t => {
            switch (e.type) {
                case `failed`:
                    return { ...t,
                        fetchFailureCount: e.failureCount,
                        fetchFailureReason: e.error
                    };
                case `pause`:
                    return { ...t,
                        fetchStatus: `paused`
                    };
                case `continue`:
                    return { ...t,
                        fetchStatus: `fetching`
                    };
                case `fetch`:
                    return { ...t,
                        ...Li(t.data, this.options),
                        fetchMeta: e.meta ? ? null
                    };
                case `success`:
                    let n = { ...t,
                        ...Ri(e.data, e.dataUpdatedAt),
                        dataUpdateCount: t.dataUpdateCount + 1,
                        ...!e.manual && {
                            fetchStatus: `idle`,
                            fetchFailureCount: 0,
                            fetchFailureReason: null
                        }
                    };
                    return this.#n = e.manual ? n : void 0, n;
                case `error`:
                    let r = e.error;
                    return { ...t,
                        error: r,
                        errorUpdateCount: t.errorUpdateCount + 1,
                        errorUpdatedAt: Date.now(),
                        fetchFailureCount: t.fetchFailureCount + 1,
                        fetchFailureReason: r,
                        fetchStatus: `idle`,
                        status: `error`,
                        isInvalidated: !0
                    };
                case `invalidate`:
                    return { ...t,
                        isInvalidated: !0
                    };
                case `setState`:
                    return { ...t,
                        ...e.state
                    }
            }
        };
        this.state = t(this.state), Ei.batch(() => {
            this.observers.forEach(e => {
                e.onQueryUpdate()
            }), this.#r.notify({
                query: this,
                type: `updated`,
                action: e
            })
        })
    }
};

function Li(e, t) {
    return {
        fetchFailureCount: 0,
        fetchFailureReason: null,
        fetchStatus: ki(t.networkMode) ? `fetching` : `paused`,
        ...e === void 0 && {
            error: null,
            status: `pending`
        }
    }
}

function Ri(e, t) {
    return {
        data: e,
        dataUpdatedAt: t ? ? Date.now(),
        error: null,
        isInvalidated: !1,
        status: `success`
    }
}

function zi(e) {
    let t = typeof e.initialData == `function` ? e.initialData() : e.initialData,
        n = t !== void 0,
        r = n ? typeof e.initialDataUpdatedAt == `function` ? e.initialDataUpdatedAt() : e.initialDataUpdatedAt : 0;
    return {
        data: t,
        dataUpdateCount: 0,
        dataUpdatedAt: n ? r ? ? Date.now() : 0,
        error: null,
        errorUpdateCount: 0,
        errorUpdatedAt: 0,
        fetchFailureCount: 0,
        fetchFailureReason: null,
        fetchMeta: null,
        isInvalidated: !1,
        status: n ? `success` : `pending`,
        fetchStatus: `idle`
    }
}
var Bi = class extends Mi {#
    e;#
    t;#
    n;#
    r;
    constructor(e) {
        super(), this.#e = e.client, this.mutationId = e.mutationId, this.#n = e.mutationCache, this.#t = [], this.state = e.state || Vi(), this.setOptions(e.options), this.scheduleGc()
    }
    setOptions(e) {
        this.options = e, this.updateGcTime(this.options.gcTime)
    }
    get meta() {
        return this.options.meta
    }
    addObserver(e) {
        this.#t.includes(e) || (this.#t.push(e), this.clearGcTimeout(), this.#n.notify({
            type: `observerAdded`,
            mutation: this,
            observer: e
        }))
    }
    removeObserver(e) {
        this.#t = this.#t.filter(t => t !== e), this.scheduleGc(), this.#n.notify({
            type: `observerRemoved`,
            mutation: this,
            observer: e
        })
    }
    optionalRemove() {
        this.#t.length || (this.state.status === `pending` ? this.scheduleGc() : this.#n.remove(this))
    }
    continue () {
        return this.#r ? .continue() ? ? this.execute(this.state.variables)
    }
    async execute(e) {
        let t = () => {
                this.#i({
                    type: `continue`
                })
            },
            n = {
                client: this.#e,
                meta: this.options.meta,
                mutationKey: this.options.mutationKey
            };
        this.#r = ji({
            fn: () => this.options.mutationFn ? this.options.mutationFn(e, n) : Promise.reject(Error(`No mutationFn found`)),
            onFail: (e, t) => {
                this.#i({
                    type: `failed`,
                    failureCount: e,
                    error: t
                })
            },
            onPause: () => {
                this.#i({
                    type: `pause`
                })
            },
            onContinue: t,
            retry: this.options.retry ? ? 0,
            retryDelay: this.options.retryDelay,
            networkMode: this.options.networkMode,
            canRun: () => this.#n.canRun(this)
        });
        let r = this.state.status === `pending`,
            i = !this.#r.canStart();
        try {
            if (r) t();
            else {
                this.#i({
                    type: `pending`,
                    variables: e,
                    isPaused: i
                }), this.#n.config.onMutate && await this.#n.config.onMutate(e, this, n);
                let t = await this.options.onMutate ? .(e, n);
                t !== this.state.context && this.#i({
                    type: `pending`,
                    context: t,
                    variables: e,
                    isPaused: i
                })
            }
            let a = await this.#r.start();
            return await this.#n.config.onSuccess ? .(a, e, this.state.context, this, n), await this.options.onSuccess ? .(a, e, this.state.context, n), await this.#n.config.onSettled ? .(a, null, this.state.variables, this.state.context, this, n), await this.options.onSettled ? .(a, null, e, this.state.context, n), this.#i({
                type: `success`,
                data: a
            }), a
        } catch (t) {
            try {
                await this.#n.config.onError ? .(t, e, this.state.context, this, n)
            } catch (e) {
                Promise.reject(e)
            }
            try {
                await this.options.onError ? .(t, e, this.state.context, n)
            } catch (e) {
                Promise.reject(e)
            }
            try {
                await this.#n.config.onSettled ? .(void 0, t, this.state.variables, this.state.context, this, n)
            } catch (e) {
                Promise.reject(e)
            }
            try {
                await this.options.onSettled ? .(void 0, t, e, this.state.context, n)
            } catch (e) {
                Promise.reject(e)
            }
            throw this.#i({
                type: `error`,
                error: t
            }), t
        } finally {
            this.#n.runNext(this)
        }
    }#
    i(e) {
        let t = t => {
            switch (e.type) {
                case `failed`:
                    return { ...t,
                        failureCount: e.failureCount,
                        failureReason: e.error
                    };
                case `pause`:
                    return { ...t,
                        isPaused: !0
                    };
                case `continue`:
                    return { ...t,
                        isPaused: !1
                    };
                case `pending`:
                    return { ...t,
                        context: e.context,
                        data: void 0,
                        failureCount: 0,
                        failureReason: null,
                        error: null,
                        isPaused: e.isPaused,
                        status: `pending`,
                        variables: e.variables,
                        submittedAt: Date.now()
                    };
                case `success`:
                    return { ...t,
                        data: e.data,
                        failureCount: 0,
                        failureReason: null,
                        error: null,
                        status: `success`,
                        isPaused: !1
                    };
                case `error`:
                    return { ...t,
                        data: void 0,
                        error: e.error,
                        failureCount: t.failureCount + 1,
                        failureReason: e.error,
                        isPaused: !1,
                        status: `error`
                    }
            }
        };
        this.state = t(this.state), Ei.batch(() => {
            this.#t.forEach(t => {
                t.onMutationUpdate(e)
            }), this.#n.notify({
                mutation: this,
                type: `updated`,
                action: e
            })
        })
    }
};

function Vi() {
    return {
        context: void 0,
        data: void 0,
        error: null,
        failureCount: 0,
        failureReason: null,
        isPaused: !1,
        status: `idle`,
        variables: void 0,
        submittedAt: 0
    }
}
var Hi = class extends Wr {
    constructor(e = {}) {
        super(), this.config = e, this.#e = new Set, this.#t = new Map, this.#n = 0
    }#
    e;#
    t;#
    n;
    build(e, t, n) {
        let r = new Bi({
            client: e,
            mutationCache: this,
            mutationId: ++this.#n,
            options: e.defaultMutationOptions(t),
            state: n
        });
        return this.add(r), r
    }
    add(e) {
        this.#e.add(e);
        let t = Ui(e);
        if (typeof t == `string`) {
            let n = this.#t.get(t);
            n ? n.push(e) : this.#t.set(t, [e])
        }
        this.notify({
            type: `added`,
            mutation: e
        })
    }
    remove(e) {
        if (this.#e.delete(e)) {
            let t = Ui(e);
            if (typeof t == `string`) {
                let n = this.#t.get(t);
                if (n)
                    if (n.length > 1) {
                        let t = n.indexOf(e);
                        t !== -1 && n.splice(t, 1)
                    } else n[0] === e && this.#t.delete(t)
            }
        }
        this.notify({
            type: `removed`,
            mutation: e
        })
    }
    canRun(e) {
        let t = Ui(e);
        if (typeof t == `string`) {
            let n = this.#t.get(t) ? .find(e => e.state.status === `pending`);
            return !n || n === e
        } else return !0
    }
    runNext(e) {
        let t = Ui(e);
        return typeof t == `string` ? (this.#t.get(t) ? .find(t => t !== e && t.state.isPaused)) ? .continue() ? ? Promise.resolve() : Promise.resolve()
    }
    clear() {
        Ei.batch(() => {
            this.#e.forEach(e => {
                this.notify({
                    type: `removed`,
                    mutation: e
                })
            }), this.#e.clear(), this.#t.clear()
        })
    }
    getAll() {
        return Array.from(this.#e)
    }
    find(e) {
        let t = {
            exact: !0,
            ...e
        };
        return this.getAll().find(e => ri(t, e))
    }
    findAll(e = {}) {
        return this.getAll().filter(t => ri(e, t))
    }
    notify(e) {
        Ei.batch(() => {
            this.listeners.forEach(t => {
                t(e)
            })
        })
    }
    resumePausedMutations() {
        let e = this.getAll().filter(e => e.state.isPaused);
        return Ei.batch(() => Promise.all(e.map(e => e.continue().catch(Xr))))
    }
};

function Ui(e) {
    return e.options.scope ? .id
}
var Wi = class extends Wr {
        constructor(e = {}) {
            super(), this.config = e, this.#e = new Map
        }#
        e;
        build(e, t, n) {
            let r = t.queryKey,
                i = t.queryHash ? ? ii(r, t),
                a = this.get(i);
            return a || (a = new Ii({
                client: e,
                queryKey: r,
                queryHash: i,
                options: e.defaultQueryOptions(t),
                state: n,
                defaultOptions: e.getQueryDefaults(r)
            }), this.add(a)), a
        }
        add(e) {
            this.#e.has(e.queryHash) || (this.#e.set(e.queryHash, e), this.notify({
                type: `added`,
                query: e
            }))
        }
        remove(e) {
            let t = this.#e.get(e.queryHash);
            t && (e.destroy(), t === e && this.#e.delete(e.queryHash), this.notify({
                type: `removed`,
                query: e
            }))
        }
        clear() {
            Ei.batch(() => {
                this.getAll().forEach(e => {
                    this.remove(e)
                })
            })
        }
        get(e) {
            return this.#e.get(e)
        }
        getAll() {
            return [...this.#e.values()]
        }
        find(e) {
            let t = {
                exact: !0,
                ...e
            };
            return this.getAll().find(e => ni(t, e))
        }
        findAll(e = {}) {
            let t = this.getAll();
            return Object.keys(e).length > 0 ? t.filter(t => ni(e, t)) : t
        }
        notify(e) {
            Ei.batch(() => {
                this.listeners.forEach(t => {
                    t(e)
                })
            })
        }
        onFocus() {
            Ei.batch(() => {
                this.getAll().forEach(e => {
                    e.onFocus()
                })
            })
        }
        onOnline() {
            Ei.batch(() => {
                this.getAll().forEach(e => {
                    e.onOnline()
                })
            })
        }
    },
    O = class {#
        e;#
        t;#
        n;#
        r;#
        i;#
        a;#
        o;#
        s;
        constructor(e = {}) {
            this.#e = e.queryCache || new Wi, this.#t = e.mutationCache || new Hi, this.#n = e.defaultOptions || {}, this.#r = new Map, this.#i = new Map, this.#a = 0
        }
        mount() {
            this.#a++, this.#a === 1 && (this.#o = Gr.subscribe(async e => {
                e && (await this.resumePausedMutations(), this.#e.onFocus())
            }), this.#s = Di.subscribe(async e => {
                e && (await this.resumePausedMutations(), this.#e.onOnline())
            }))
        }
        unmount() {
            this.#a--, this.#a === 0 && (this.#o ? .(), this.#o = void 0, this.#s ? .(), this.#s = void 0)
        }
        isFetching(e) {
            return this.#e.findAll({ ...e,
                fetchStatus: `fetching`
            }).length
        }
        isMutating(e) {
            return this.#t.findAll({ ...e,
                status: `pending`
            }).length
        }
        getQueryData(e) {
            let t = this.defaultQueryOptions({
                queryKey: e
            });
            return this.#e.get(t.queryHash) ? .state.data
        }
        ensureQueryData(e) {
            let t = this.defaultQueryOptions(e),
                n = this.#e.build(this, t),
                r = n.state.data;
            return r === void 0 ? this.fetchQuery(e) : (e.revalidateIfStale && n.isStaleByTime(ei(t.staleTime, n)) && this.prefetchQuery(t), Promise.resolve(r))
        }
        getQueriesData(e) {
            return this.#e.findAll(e).map(({
                queryKey: e,
                state: t
            }) => [e, t.data])
        }
        setQueryData(e, t, n) {
            let r = this.defaultQueryOptions({
                    queryKey: e
                }),
                i = this.#e.get(r.queryHash) ? .state.data,
                a = Zr(t, i);
            if (a !== void 0) return this.#e.build(this, r).setData(a, { ...n,
                manual: !0
            })
        }
        setQueriesData(e, t, n) {
            return Ei.batch(() => this.#e.findAll(e).map(({
                queryKey: e
            }) => [e, this.setQueryData(e, t, n)]))
        }
        getQueryState(e) {
            let t = this.defaultQueryOptions({
                queryKey: e
            });
            return this.#e.get(t.queryHash) ? .state
        }
        removeQueries(e) {
            let t = this.#e;
            Ei.batch(() => {
                t.findAll(e).forEach(e => {
                    t.remove(e)
                })
            })
        }
        resetQueries(e, t) {
            let n = this.#e;
            return Ei.batch(() => (n.findAll(e).forEach(e => {
                e.reset()
            }), this.refetchQueries({
                type: `active`,
                ...e
            }, t)))
        }
        cancelQueries(e, t = {}) {
            let n = {
                    revert: !0,
                    ...t
                },
                r = Ei.batch(() => this.#e.findAll(e).map(e => e.cancel(n)));
            return Promise.all(r).then(Xr).catch(Xr)
        }
        invalidateQueries(e, t = {}) {
            return Ei.batch(() => (this.#e.findAll(e).forEach(e => {
                e.invalidate()
            }), e ? .refetchType === `none` ? Promise.resolve() : this.refetchQueries({ ...e,
                type: e ? .refetchType ? ? e ? .type ? ? `active`
            }, t)))
        }
        refetchQueries(e, t = {}) {
            let n = { ...t,
                    cancelRefetch: t.cancelRefetch ? ? !0
                },
                r = Ei.batch(() => this.#e.findAll(e).filter(e => !e.isDisabled() && !e.isStatic()).map(e => {
                    let t = e.fetch(void 0, n);
                    return n.throwOnError || (t = t.catch(Xr)), e.state.fetchStatus === `paused` ? Promise.resolve() : t
                }));
            return Promise.all(r).then(Xr)
        }
        fetchQuery(e) {
            let t = this.defaultQueryOptions(e);
            t.retry === void 0 && (t.retry = !1);
            let n = this.#e.build(this, t);
            return n.isStaleByTime(ei(t.staleTime, n)) ? n.fetch(t) : Promise.resolve(n.state.data)
        }
        prefetchQuery(e) {
            return this.fetchQuery(e).then(Xr).catch(Xr)
        }
        fetchInfiniteQuery(e) {
            return e._type = `infinite`, this.fetchQuery(e)
        }
        prefetchInfiniteQuery(e) {
            return this.fetchInfiniteQuery(e).then(Xr).catch(Xr)
        }
        ensureInfiniteQueryData(e) {
            return e._type = `infinite`, this.ensureQueryData(e)
        }
        resumePausedMutations() {
            return Di.isOnline() ? this.#t.resumePausedMutations() : Promise.resolve()
        }
        getQueryCache() {
            return this.#e
        }
        getMutationCache() {
            return this.#t
        }
        getDefaultOptions() {
            return this.#n
        }
        setDefaultOptions(e) {
            this.#n = e
        }
        setQueryDefaults(e, t) {
            this.#r.set(ai(e), {
                queryKey: e,
                defaultOptions: t
            })
        }
        getQueryDefaults(e) {
            let t = [...this.#r.values()],
                n = {};
            return t.forEach(t => {
                oi(e, t.queryKey) && Object.assign(n, t.defaultOptions)
            }), n
        }
        setMutationDefaults(e, t) {
            this.#i.set(ai(e), {
                mutationKey: e,
                defaultOptions: t
            })
        }
        getMutationDefaults(e) {
            let t = [...this.#i.values()],
                n = {};
            return t.forEach(t => {
                oi(e, t.mutationKey) && Object.assign(n, t.defaultOptions)
            }), n
        }
        defaultQueryOptions(e) {
            if (e._defaulted) return e;
            let t = { ...this.#n.queries,
                ...this.getQueryDefaults(e.queryKey),
                ...e,
                _defaulted: !0
            };
            return t.queryHash || = ii(t.queryKey, t), t.refetchOnReconnect === void 0 && (t.refetchOnReconnect = t.networkMode !== `always`), t.throwOnError === void 0 && (t.throwOnError = !!t.suspense), !t.networkMode && t.persister && (t.networkMode = `offlineFirst`), t.queryFn === vi && (t.enabled = !1), t
        }
        defaultMutationOptions(e) {
            return e ? ._defaulted ? e : { ...this.#n.mutations,
                ...e ? .mutationKey && this.getMutationDefaults(e.mutationKey),
                ...e,
                _defaulted : !0
            }
        }
        clear() {
            this.#e.clear(), this.#t.clear()
        }
    },
    k = le(),
    Gi = T.createContext(void 0),
    Ki = e => {
        let t = T.useContext(Gi);
        if (e) return e;
        if (!t) throw Error(`No QueryClient set, use QueryClientProvider to set one`);
        return t
    },
    qi = ({
        client: e,
        children: t
    }) => (T.useEffect(() => (e.mount(), () => {
        e.unmount()
    }), [e]), (0, k.jsx)(Gi.Provider, {
        value: e,
        children: t
    })),
    Ji = Re(),
    Yi = {
        regular: void 0,
        medium: `0.02em currentColor`,
        bold: `0.04em currentColor`
    };

function Xi({
    name: e,
    size: t = 14,
    style: n,
    className: r,
    onClick: i,
    weight: a,
    bold: o = !1
}) {
    let s = a ? ? (o ? `bold` : `regular`);
    return (0, k.jsx)(`i`, {
        className: ue(`ai-${e}`, `leading-none not-italic w-[1em] h-[1em] inline-flex items-center justify-center shrink-0`, r),
        style: {
            fontSize: t,
            WebkitTextStroke: Yi[s],
            ...n
        },
        onClick: i
    })
}
var Zi = {
        xs: `px-2 py-1 text-[11px] gap-1 rounded-md`,
        sm: `px-3 py-1.5 text-xs gap-[5px] rounded-lg`,
        md: `px-4 py-2 text-[13px] gap-1.5 rounded-lg`
    },
    Qi = {
        xs: 11,
        sm: 12,
        md: 14
    },
    $i = {
        xs: 3,
        sm: 4,
        md: 5
    },
    ea = {
        default: `bg-om-bg-surface hover:bg-om-bg-hover active:bg-om-bg-active border-om-border-default text-om-text-primary shadow-om-xs`,
        primary: `bg-om-accent-primary hover:bg-om-accent-primary-hover active:bg-om-accent-primary-active text-white border-[rgba(0,0,0,0.15)] shadow-[0_1px_3px_rgba(180,90,30,0.35),0_2px_6px_rgba(180,90,30,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]`,
        black: `bg-om-accent-black hover:bg-om-accent-black-hover active:bg-om-accent-black-active text-om-text-inverse border-transparent shadow-om-sm`,
        blue: `bg-om-accent-secondary hover:bg-om-accent-secondary-hover active:bg-om-accent-secondary-active text-om-text-inverse border-[rgba(0,0,0,0.12)] shadow-[0_1px_2px_rgba(90,139,187,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]`,
        destructive: `bg-om-accent-error hover:bg-om-accent-error-hover active:bg-om-accent-error-active text-om-text-inverse border-[rgba(0,0,0,0.15)] shadow-[0_1px_3px_rgba(166,50,68,0.3),0_2px_6px_rgba(166,50,68,0.18),inset_0_1px_0_rgba(255,255,255,0.12)]`,
        ghost: `bg-transparent hover:bg-om-bg-hover active:bg-om-bg-active text-om-text-secondary`
    },
    ta = {
        default: `bg-om-accent-blue-bg hover:bg-om-accent-blue-bg active:bg-om-accent-blue-bg border-om-accent-secondary`,
        primary: `bg-om-accent-primary-active hover:bg-om-accent-primary-active`,
        black: `bg-om-accent-black-active hover:bg-om-accent-black-active`,
        blue: `bg-om-accent-secondary-active hover:bg-om-accent-secondary-active`,
        destructive: `bg-om-accent-error-active hover:bg-om-accent-error-active`,
        ghost: `bg-om-bg-active hover:bg-om-bg-active`
    },
    na = T.forwardRef(function({
        children: e,
        variant: t = `default`,
        size: n = `sm`,
        icon: r,
        iconStyle: i,
        iconRight: a,
        disabled: o = !1,
        loading: s = !1,
        active: c = !1,
        onClick: l,
        style: u,
        className: d,
        title: f,
        "aria-label": p,
        "aria-keyshortcuts": m,
        "data-testid": h,
        "data-autofocus": g
    }, _) {
        return (0, k.jsxs)(`button`, {
            ref: _,
            disabled: o || s,
            onClick: l,
            className: ue(`relative inline-flex min-w-0 shrink cursor-default select-none items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap border border-transparent font-medium outline-none`, `disabled:cursor-not-allowed disabled:opacity-50`, Zi[n], ea[t], c && ta[t], d),
            style: u,
            title: f,
            "aria-label": p,
            "aria-keyshortcuts": m,
            "data-testid": h,
            "data-autofocus": g || void 0,
            children: [(0, k.jsxs)(`span`, {
                className: ue(`inline-flex items-center gap-[inherit]`, s && `opacity-0`),
                children: [r && (0, k.jsx)(Xi, {
                    name: r,
                    size: Qi[n],
                    style: i
                }), e, a && (0, k.jsx)(Xi, {
                    name: a,
                    size: Qi[n]
                })]
            }), s && (0, k.jsxs)(`div`, {
                className: `absolute inset-0 flex items-center justify-center`,
                style: {
                    gap: $i[n] * .75
                },
                children: [(0, k.jsx)(`span`, {
                    className: `animate-om-pulse rounded-full bg-current`,
                    style: {
                        width: $i[n],
                        height: $i[n]
                    }
                }), (0, k.jsx)(`span`, {
                    className: `animate-om-pulse rounded-full bg-current [animation-delay:0.15s]`,
                    style: {
                        width: $i[n],
                        height: $i[n]
                    }
                }), (0, k.jsx)(`span`, {
                    className: `animate-om-pulse rounded-full bg-current [animation-delay:0.3s]`,
                    style: {
                        width: $i[n],
                        height: $i[n]
                    }
                })]
            })]
        })
    }),
    ra = {
        default: `bg-om-bg-surface hover:bg-om-bg-hover active:bg-om-bg-active border border-om-border-default shadow-om-xs`,
        primary: `bg-om-accent-primary hover:bg-om-accent-primary-hover active:bg-om-accent-primary-active text-white border border-[rgba(0,0,0,0.15)] shadow-[0_1px_3px_rgba(180,90,30,0.35),0_2px_6px_rgba(180,90,30,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]`,
        ghost: `bg-transparent hover:bg-om-bg-hover active:bg-om-bg-active border border-transparent`
    };

function ia({
    icon: e,
    size: t = 28,
    iconSize: n,
    iconBold: r = !1,
    iconStyle: i,
    variant: a = `ghost`,
    active: o = !1,
    disabled: s = !1,
    onClick: c,
    onMouseDown: l,
    style: u,
    className: d,
    title: f,
    "aria-label": p,
    "data-testid": m,
    "aria-pressed": h,
    "aria-haspopup": g,
    "aria-expanded": _
}) {
    return (0, k.jsx)(`button`, {
        disabled: s,
        onClick: c,
        onMouseDown: l,
        className: ue(`flex cursor-default select-none items-center justify-center rounded-md p-0 text-om-text-secondary outline-none`, `disabled:cursor-not-allowed disabled:opacity-30`, ra[a], o && `border border-[rgba(0,0,0,0.15)] bg-[#2f75ff] text-white shadow-[0_0_0_3px_rgba(47,117,255,0.22),0_1px_3px_rgba(30,90,220,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-[#2968f0] active:bg-[#1d55d8]`, d),
        style: {
            width: t,
            height: t,
            ...u
        },
        title: f,
        "aria-label": p,
        "data-testid": m,
        "aria-pressed": h,
        "aria-haspopup": g,
        "aria-expanded": _,
        children: (0, k.jsx)(Xi, {
            name: e,
            size: n ? ? t * .5,
            bold: r,
            style: i
        })
    })
}
var aa = T.forwardRef(function({
        icon: e,
        size: t = 20,
        iconSize: n,
        disabled: r = !1,
        onClick: i,
        style: a,
        className: o,
        title: s,
        "aria-label": c,
        "data-testid": l,
        href: u
    }, d) {
        let f = ue(`flex cursor-default select-none items-center justify-center rounded p-0 text-om-text-tertiary no-underline outline-none`, `bg-transparent hover:bg-om-bg-hover hover:text-om-text-secondary active:brightness-[.8]`, `disabled:cursor-not-allowed disabled:opacity-30`, o),
            p = (0, k.jsx)(Xi, {
                name: e,
                size: n || t * .6,
                bold: !0
            }),
            m = {
                width: t,
                height: t,
                ...a
            };
        return u ? (0, k.jsx)(`a`, {
            ref: d,
            href: u,
            className: f,
            style: m,
            onClick: i,
            title: s,
            "aria-label": c,
            "data-testid": l,
            children: p
        }) : (0, k.jsx)(`button`, {
            ref: d,
            disabled: r,
            className: f,
            style: m,
            onClick: i,
            title: s,
            "aria-label": c,
            "data-testid": l,
            children: p
        })
    }),
    oa = e(ee(), 1),
    sa = {
        modal: 2e3,
        modalTop: 3e3,
        popover: 3500,
        panelOverlay: 4e3,
        toast: 1e4
    },
    ca = `animate-om-scale-in`,
    la = `button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])`,
    ua = [];

function da({
    isOpen: e,
    onClose: t,
    zLayer: n = `modal`,
    children: r
}) {
    let i = (0, T.useRef)(null),
        a = (0, T.useRef)(null),
        o = (0, T.useRef)(Symbol());
    return (0, T.useEffect)(() => {
        if (!e) return;
        let t = o.current;
        return ua.push(t), () => {
            let e = ua.lastIndexOf(t);
            e >= 0 && ua.splice(e, 1)
        }
    }, [e]), u(`keydown`, n => {
        if (e && ua[ua.length - 1] === o.current) {
            if (n.key === `Escape`) n.preventDefault(), n.stopImmediatePropagation(), t();
            else if (n.key === `Tab`) {
                let e = i.current;
                if (!e) return;
                let t = e.querySelectorAll(la);
                if (t.length === 0) {
                    n.preventDefault(), e.focus();
                    return
                }
                let r = t[0],
                    a = t[t.length - 1],
                    o = document.activeElement;
                if (!e.contains(o)) {
                    n.preventDefault(), (n.shiftKey ? a : r).focus();
                    return
                }
                n.shiftKey && o === r ? (n.preventDefault(), a.focus()) : !n.shiftKey && o === a && (n.preventDefault(), r.focus())
            }
        }
    }), (0, T.useEffect)(() => {
        if (!e) return;
        a.current = document.activeElement;
        let t = requestAnimationFrame(() => {
            let e = i.current,
                t = e ? .querySelector(`[data-autofocus]`),
                n = e ? .querySelector(la);
            (t ? ? n ? ? e) ? .focus()
        });
        return () => {
            cancelAnimationFrame(t);
            let e = a.current;
            e instanceof HTMLElement && e.focus()
        }
    }, [e]), e ? (0, oa.createPortal)((0, k.jsx)(`div`, {
        className: `fixed inset-0 grid place-items-center bg-om-bg-scrim animate-om-fade-in`,
        style: {
            zIndex: sa[n]
        },
        onMouseDown: e => e.target === e.currentTarget && t(),
        children: (0, k.jsx)(`div`, {
            ref: i,
            role: `dialog`,
            "aria-modal": `true`,
            "data-modal-primitive": !0,
            tabIndex: -1,
            style: {
                outline: `none`
            },
            children: r
        })
    }), document.body) : null
}
var fa = (0, T.createContext)(null);

function pa() {
    let e = (0, T.useContext)(fa);
    if (!e) throw Error(`useConfirm must be used within a ConfirmDialogProvider`);
    return e
}
var ma = null;
async function ha(e) {
    if (ma) return ma(e);
    let t = typeof e.message == `string` ? e.message : e.title ? ? `Are you sure?`;
    return window.confirm(t)
}

function ga({
    children: e
}) {
    let [t, n] = (0, T.useState)(null), r = (0, T.useRef)(null), i = (0, T.useCallback)(e => (r.current ? .resolve(!1), new Promise(t => {
        let i = {
            opts: e,
            resolve: t
        };
        r.current = i, n(i)
    })), []);
    (0, T.useEffect)(() => (ma = i, () => {
        ma = null
    }), [i]), (0, T.useEffect)(() => {
        r.current && (r.current.resolve(!1), r.current = null, n(null))
    }, [D()]);
    let a = e => {
            r.current ? .resolve(e), r.current = null, n(null)
        },
        o = t ? .opts,
        s = o ? .danger ? ? !1;
    return (0, k.jsxs)(fa.Provider, {
        value: i,
        children: [e, (0, k.jsx)(da, {
            isOpen: t !== null,
            onClose: () => a(!1),
            zLayer: `modalTop`,
            children: o && (0, k.jsxs)(`div`, {
                "data-testid": `confirm-dialog`,
                className: ue(`w-[360px] max-w-[calc(100vw-32px)] bg-om-bg-surface border border-om-border-default rounded-xl shadow-om-lg overflow-hidden`, `animate-om-scale-in`, `[animation-duration:0.18s] [animation-timing-function:ease]`),
                children: [(0, k.jsxs)(`div`, {
                    className: `pt-5 px-5 pb-4`,
                    children: [o.title && (0, k.jsx)(`div`, {
                        className: `text-sm font-semibold text-om-text-primary mb-1`,
                        children: o.title
                    }), (0, k.jsx)(`div`, {
                        className: `text-[13px] leading-normal text-om-text-secondary`,
                        children: o.message
                    })]
                }), (0, k.jsxs)(`div`, {
                    className: `py-3.5 px-5 bg-om-bg-app border-t border-om-border-subtle flex justify-end gap-2`,
                    children: [!o.hideCancel && (0, k.jsx)(na, {
                        variant: `ghost`,
                        size: `md`,
                        onClick: () => a(!1),
                        ...o.autofocusCancel ? {
                            "data-autofocus": !0
                        } : {},
                        children: o.cancelLabel ? ? `Cancel`
                    }), o.secondaryAction && (0, k.jsx)(na, {
                        variant: `default`,
                        size: `md`,
                        onClick: () => {
                            o.secondaryAction ? .onClick(), a(!1)
                        },
                        children: o.secondaryAction.label
                    }), s ? (0, k.jsx)(na, {
                        variant: `destructive`,
                        size: `md`,
                        onClick: () => a(!0),
                        "data-testid": `confirm-dialog-confirm`,
                        ...o.autofocusCancel ? {} : {
                            "data-autofocus": !0
                        },
                        children: o.confirmLabel ? ? `Delete`
                    }) : (0, k.jsx)(na, {
                        variant: `black`,
                        size: `md`,
                        onClick: () => a(!0),
                        "data-testid": `confirm-dialog-confirm`,
                        ...o.autofocusCancel ? {} : {
                            "data-autofocus": !0
                        },
                        children: o.confirmLabel ? ? `Confirm`
                    })]
                })]
            })
        })]
    })
}

function A({
    className: e,
    ...t
}) {
    return (0, k.jsx)(`div`, {
        className: ue(`om-loader-bar w-[120px] h-[3px] bg-om-bg-selected rounded-[2px] overflow-hidden`, e),
        ...t
    })
}

function _a({
    fixed: e = !1,
    label: t = `Loading`
}) {
    return (0, k.jsx)(`div`, {
        className: ue(e ? `fixed` : `absolute`, `inset-0 flex items-center justify-center pointer-events-none`),
        role: `status`,
        "aria-live": `polite`,
        "aria-label": t,
        children: (0, k.jsx)(A, {})
    })
}
var j = {
    bg: {
        app: `var(--om-bg-app)`,
        panel: `var(--om-bg-panel)`,
        surface: `var(--om-bg-surface)`,
        elevated: `var(--om-bg-elevated)`,
        hover: `var(--om-bg-hover)`,
        active: `var(--om-bg-active)`,
        selected: `var(--om-bg-selected)`,
        muted: `var(--om-bg-muted)`,
        stripe: `var(--om-bg-stripe)`,
        tintDesignSystem: `var(--om-bg-tint-design-system)`,
        tintTemplate: `var(--om-bg-tint-template)`,
        primaryTabBar: `var(--om-bg-primary-tab-bar)`,
        secondaryTabBar: `var(--om-bg-secondary-tab-bar)`,
        errorTint: `var(--om-bg-error-tint)`,
        introSplash: `var(--om-bg-intro-splash)`,
        thumb: `var(--om-bg-thumb)`,
        scrim: `var(--om-bg-scrim)`
    },
    border: {
        subtle: `var(--om-border-subtle)`,
        card: `var(--om-border-card)`,
        default: `var(--om-border-default)`,
        strong: `var(--om-border-strong)`,
        focus: `var(--om-border-focus)`,
        modal: `var(--om-border-modal)`
    },
    text: {
        primary: `var(--om-text-primary)`,
        prose: `var(--om-text-prose)`,
        secondary: `var(--om-text-secondary)`,
        tertiary: `var(--om-text-tertiary)`,
        disabled: `var(--om-text-disabled)`,
        designSystemBadge: `var(--om-text-design-system-badge)`,
        inverse: `var(--om-text-inverse)`,
        link: `var(--om-text-link)`
    },
    accent: {
        primary: `var(--om-accent-primary)`,
        primaryBg: `var(--om-accent-primary-bg)`,
        primaryTint: `var(--om-accent-primary-tint)`,
        primaryDash: `var(--om-accent-primary-dash)`,
        primaryTail: `var(--om-accent-primary-tail)`,
        primaryHover: `var(--om-accent-primary-hover)`,
        primaryActive: `var(--om-accent-primary-active)`,
        secondary: `var(--om-accent-secondary)`,
        secondaryHover: `var(--om-accent-secondary-hover)`,
        secondaryActive: `var(--om-accent-secondary-active)`,
        success: `var(--om-accent-success)`,
        sage: `var(--om-accent-sage)`,
        warning: `var(--om-accent-warning)`,
        error: `var(--om-accent-error)`,
        errorHover: `var(--om-accent-error-hover)`,
        errorActive: `var(--om-accent-error-active)`,
        pro: `var(--om-accent-pro)`,
        proBg: `var(--om-accent-pro-bg)`,
        blue: `var(--om-accent-blue)`,
        blueBg: `var(--om-accent-blue-bg)`,
        blueHover: `var(--om-accent-blue-hover)`,
        review: `var(--om-accent-review)`,
        verifier: `var(--om-accent-verifier)`,
        verifierSoft: `var(--om-accent-verifier-soft)`,
        black: `var(--om-accent-black)`,
        blackHover: `var(--om-accent-black-hover)`,
        blackActive: `var(--om-accent-black-active)`
    },
    scrollbar: {
        thumb: `var(--om-scrollbar-thumb)`,
        thumbHover: `var(--om-scrollbar-thumb-hover)`
    },
    shadow: {
        xs: `var(--om-shadow-xs)`,
        sm: `var(--om-shadow-sm)`,
        md: `var(--om-shadow-md)`,
        diffuse: `var(--om-shadow-diffuse)`,
        lg: `var(--om-shadow-lg)`,
        inset: `var(--om-shadow-inset)`,
        modal: `var(--om-shadow-modal)`,
        card: `var(--om-shadow-card)`,
        pin: `var(--om-shadow-pin)`,
        pinHover: `var(--om-shadow-pin-hover)`,
        thumb: `var(--om-shadow-thumb)`
    },
    presenter: {
        bg: `#1a1a1a`,
        text: `#e8e8e8`,
        border: `#333333`,
        divider: `#2a2a2a`,
        dividerHover: `#3a3a3a`,
        slideBg: `#000000`,
        slideHoverBorder: `#555555`,
        controlBg: `#2a2a2a`,
        controlHover: `#333333`,
        controlActive: `#3a3a3a`,
        controlBorder: `#444444`,
        muted: `#999999`,
        label: `#888888`,
        placeholder: `#555555`,
        toggleTrack: `#3a3a3a`
    }
};

function va(e, t) {
    if (typeof document > `u`) return t ? ? e;
    let n = e.match(/^var\((--[A-Za-z0-9-]+)\)$/);
    if (n) {
        let e = getComputedStyle(document.documentElement).getPropertyValue(n[1]).trim();
        if (e) return e
    }
    return t ? ? e
}
var ya = (e, t) => `color-mix(in srgb, ${e} ${Math.round(t*1e3)/10}%, transparent)`,
    ba = {
        info: {
            bg: ya(j.accent.secondary, .08),
            border: ya(j.accent.secondary, .18),
            fg: j.text.secondary,
            weight: 500
        },
        hint: {
            bg: j.bg.muted,
            border: j.border.default,
            fg: j.text.secondary,
            weight: 500
        },
        warning: {
            bg: ya(j.accent.primary, .14),
            border: j.accent.primaryActive,
            fg: j.accent.primaryActive,
            weight: 600
        },
        error: {
            bg: j.bg.muted,
            border: ya(j.accent.error, .2),
            fg: j.text.primary,
            weight: 500
        }
    };

function xa({
    $variant: e = `hint`,
    $placement: t = `standalone`,
    className: n,
    style: r,
    ...i
}) {
    let a = ba[e];
    return (0, k.jsx)(`div`, {
        className: ue(`relative flex items-center gap-2 leading-[1.4]`, t === `docked` ? `text-[11px] pt-1.5 px-3 pb-3.5 mt-0 mx-px -mb-2 border-[0.5px] border-b-0 rounded-t-[10px]` : `text-xs py-2.5 px-3 border rounded-lg select-text`, n),
        style: {
            background: a.bg,
            color: a.fg,
            fontWeight: a.weight,
            borderColor: a.border,
            ...r
        },
        ...i
    })
}

function Sa({
    name: e,
    size: t = 14
}) {
    return (0, T.useEffect)(() => {}, [e]), (0, k.jsx)(Xi, {
        name: e,
        size: t,
        style: {
            flexShrink: 0
        }
    })
}
var Ca = {
    fetch: globalThis.fetch ? globalThis.fetch.bind(globalThis) : void 0,
    SubtleCrypto: globalThis.crypto ? globalThis.crypto.subtle : void 0,
    EventSource: globalThis.EventSource
};

function wa() {
    return Ca
}

function Ta(e) {
    let t = 2166136261,
        n = e.length;
    for (let r = 0; r < n; r++) t ^= e.charCodeAt(r), t += (t << 1) + (t << 4) + (t << 7) + (t << 8) + (t << 24);
    return t >>> 0
}

function Ea(e, t, n) {
    return n === 2 ? Ta(Ta(e + t) + ``) % 1e4 / 1e4 : n === 1 ? Ta(t + e) % 1e3 / 1e3 : null
}

function Da(e) {
    return e <= 0 ? [] : Array(e).fill(1 / e)
}

function Oa(e, t) {
    return e >= t[0] && e < t[1]
}

function ka(e, t) {
    let n = Ea(`__` + t[0], e, 1);
    return n === null ? !1 : n >= t[1] && n < t[2]
}

function Aa(e, t) {
    for (let n = 0; n < t.length; n++)
        if (Oa(e, t[n])) return n;
    return -1
}

function ja(e) {
    try {
        let t = e.replace(/([^\\])\//g, `$1\\/`);
        return new RegExp(t)
    } catch {
        return
    }
}

function Ma(e, t) {
    if (!t.length) return !1;
    let n = !1,
        r = !1;
    for (let i = 0; i < t.length; i++) {
        let a = Fa(e, t[i].type, t[i].pattern);
        if (t[i].include === !1) {
            if (a) return !1
        } else n = !0, a && (r = !0)
    }
    return r || !n
}

function Na(e, t, n) {
    try {
        let r = t.replace(/[*.+?^${}()|[\]\\]/g, `\\$&`).replace(/_____/g, `.*`);
        return n && (r = `\\/?` + r.replace(/(^\/|\/$)/g, ``) + `\\/?`), RegExp(`^` + r + `$`, `i`).test(e)
    } catch {
        return !1
    }
}

function Pa(e, t) {
    try {
        let n = new URL(t.replace(/^([^:/?]*)\./i, `https://$1.`).replace(/\*/g, `_____`), `https://_____`),
            r = [
                [e.host, n.host, !1],
                [e.pathname, n.pathname, !0]
            ];
        return n.hash && r.push([e.hash, n.hash, !1]), n.searchParams.forEach((t, n) => {
            r.push([e.searchParams.get(n) || ``, t, !1])
        }), !r.some(e => !Na(e[0], e[1], e[2]))
    } catch {
        return !1
    }
}

function Fa(e, t, n) {
    try {
        let r = new URL(e, `https://_`);
        if (t === `regex`) {
            let e = ja(n);
            return e ? e.test(r.href) || e.test(r.href.substring(r.origin.length)) : !1
        } else if (t === `simple`) return Pa(r, n);
        return !1
    } catch {
        return !1
    }
}

function Ia(e, t, n) {
    t = t === void 0 ? 1 : t, t < 0 ? t = 0 : t > 1 && (t = 1);
    let r = Da(e);
    n || = r, n.length !== e && (n = r);
    let i = n.reduce((e, t) => t + e, 0);
    (i < .99 || i > 1.01) && (n = r);
    let a = 0;
    return n.map(e => {
        let n = a;
        return a += e, [n, n + t * e]
    })
}

function La(e, t, n) {
    if (!t) return null;
    let r = t.split(`?`)[1];
    if (!r) return null;
    let i = r.replace(/#.*/, ``).split(`&`).map(e => e.split(`=`, 2)).filter(([t]) => t === e).map(([, e]) => parseInt(e));
    return i.length > 0 && i[0] >= 0 && i[0] < n ? i[0] : null
}

function Ra(e) {
    try {
        return e()
    } catch {
        return !1
    }
}
var za = e => Uint8Array.from(atob(e), e => e.charCodeAt(0));
async function Ba(e, t, n) {
    if (t || = ``, n = n || globalThis.crypto && globalThis.crypto.subtle || Ca.SubtleCrypto, !n) throw Error(`No SubtleCrypto implementation found`);
    try {
        let r = await n.importKey(`raw`, za(t), {
                name: `AES-CBC`,
                length: 128
            }, !0, [`encrypt`, `decrypt`]),
            [i, a] = e.split(`.`),
            o = await n.decrypt({
                name: `AES-CBC`,
                iv: za(i)
            }, r, za(a));
        return new TextDecoder().decode(o)
    } catch {
        throw Error(`Failed to decrypt`)
    }
}

function Va(e) {
    return typeof e == `string` ? e : JSON.stringify(e)
}

function Ha(e) {
    typeof e == `number` && (e += ``), (!e || typeof e != `string`) && (e = `0`);
    let t = e.replace(/(^v|\+.*$)/g, ``).split(/[-.]/);
    return t.length === 3 && t.push(`~`), t.map(e => e.match(/^[0-9]+$/) ? e.padStart(5, ` `) : e).join(`-`)
}

function Ua() {
    let e;
    try {
        e = `1.6.5`
    } catch {
        e = ``
    }
    return e
}

function Wa(e, t) {
    let n, r;
    try {
        n = new URL(e), r = new URL(t)
    } catch {
        return t
    }
    return n.searchParams.forEach((e, t) => {
        r.searchParams.has(t) || r.searchParams.set(t, e)
    }), r.toString()
}

function Ga(e) {
    return typeof e == `object` && !!e
}

function Ka(e) {
    return e.urlPatterns && e.variations.some(e => Ga(e) && `urlRedirect` in e) ? `redirect` : e.variations.some(e => Ga(e) && (e.domMutations || `js` in e || `css` in e)) ? `visual` : `unknown`
}
async function qa(e, t) {
    return new Promise(n => {
        let r = !1,
            i, a = e => {
                r || (r = !0, i && clearTimeout(i), n(e || null))
            };
        t && (i = setTimeout(() => a(), t)), e.then(e => a(e)).catch(() => a())
    })
}
var M = {
        staleTTL: 1e3 * 60,
        maxAge: 1e3 * 60 * 60 * 4,
        cacheKey: `gbFeaturesCache`,
        backgroundSync: !0,
        maxEntries: 10,
        disableIdleStreams: !1,
        idleStreamInterval: 2e4,
        disableCache: !1
    },
    Ja = wa(),
    Ya = {
        fetchFeaturesCall: ({
            host: e,
            clientKey: t,
            headers: n
        }) => Ja.fetch(`${e}/api/features/${t}`, {
            headers: n
        }),
        fetchRemoteEvalCall: ({
            host: e,
            clientKey: t,
            payload: n,
            headers: r
        }) => {
            let i = {
                method: `POST`,
                headers: {
                    "Content-Type": `application/json`,
                    ...r
                },
                body: JSON.stringify(n)
            };
            return Ja.fetch(`${e}/api/eval/${t}`, i)
        },
        eventSourceCall: ({
            host: e,
            clientKey: t,
            headers: n
        }) => n ? new Ja.EventSource(`${e}/sub/${t}`, {
            headers: n
        }) : new Ja.EventSource(`${e}/sub/${t}`),
        startIdleListener: () => {
            let e;
            if (!(typeof window < `u` && typeof document < `u`)) return;
            let t = () => {
                document.visibilityState === `visible` ? (window.clearTimeout(e), so()) : document.visibilityState === `hidden` && (e = window.setTimeout(oo, M.idleStreamInterval))
            };
            return document.addEventListener(`visibilitychange`, t), () => document.removeEventListener(`visibilitychange`, t)
        },
        stopIdleListener: () => {}
    };
try {
    globalThis.localStorage && (Ja.localStorage = globalThis.localStorage)
} catch {}
var Xa = new Map,
    Za = !1,
    Qa = new Map,
    $a = new Map,
    eo = new Map,
    to = new Set;

function no(e) {
    Object.assign(M, e), M.backgroundSync || I()
}
async function ro({
    instance: e,
    timeout: t,
    skipCache: n,
    allowStale: r,
    backgroundSync: i
}) {
    return i || (M.backgroundSync = !1), lo({
        instance: e,
        allowStale: r,
        timeout: t,
        skipCache: n
    })
}

function io(e) {
    let t = uo(e),
        n = Xa.get(t) || new Set;
    n.add(e), Xa.set(t, n)
}

function ao(e) {
    Xa.forEach(t => t.delete(e))
}

function oo() {
    eo.forEach(e => {
        e && (e.state = `idle`, yo(e))
    })
}

function so() {
    eo.forEach(e => {
        e && e.state === `idle` && P(e)
    })
}
async function co() {
    try {
        if (!Ja.localStorage) return;
        await Ja.localStorage.setItem(M.cacheKey, JSON.stringify(Array.from(Qa.entries())))
    } catch {}
}
async function lo({
    instance: e,
    allowStale: t,
    timeout: n,
    skipCache: r
}) {
    let i = uo(e),
        a = fo(e),
        o = new Date,
        s = new Date(o.getTime() - M.maxAge + M.staleTTL);
    await po();
    let c = !M.disableCache && !r ? Qa.get(a) : void 0;
    return c && (t || c.staleAt > o) && c.staleAt > s ? (c.sse && to.add(i), c.staleAt < o ? _o(e) : N(e), {
        data: c.data,
        success: !0,
        source: `cache`
    }) : await qa(_o(e), n) || {
        data: null,
        success: !1,
        source: `timeout`,
        error: Error(`Timeout`)
    }
}

function uo(e) {
    let [t, n] = e.getApiInfo();
    return `${t}||${n}`
}

function fo(e) {
    let t = uo(e);
    if (!(`isRemoteEval` in e) || !e.isRemoteEval()) return t;
    let n = e.getAttributes(),
        r = e.getCacheKeyAttributes() || Object.keys(e.getAttributes()),
        i = {};
    r.forEach(e => {
        i[e] = n[e]
    });
    let a = e.getForcedVariations(),
        o = e.getUrl();
    return `${t}||${JSON.stringify({ca:i,fv:a,url:o})}`
}
async function po() {
    if (!Za) {
        Za = !0;
        try {
            if (Ja.localStorage) {
                let e = await Ja.localStorage.getItem(M.cacheKey);
                if (!M.disableCache && e) {
                    let t = JSON.parse(e);
                    t && Array.isArray(t) && t.forEach(([e, t]) => {
                        Qa.set(e, { ...t,
                            staleAt: new Date(t.staleAt)
                        })
                    }), mo()
                }
            }
        } catch {}
        if (!M.disableIdleStreams) {
            let e = Ya.startIdleListener();
            e && (Ya.stopIdleListener = e)
        }
    }
}

function mo() {
    let e = Array.from(Qa.entries()).map(([e, t]) => ({
            key: e,
            staleAt: t.staleAt.getTime()
        })).sort((e, t) => e.staleAt - t.staleAt),
        t = Math.min(Math.max(0, Qa.size - M.maxEntries), Qa.size);
    for (let n = 0; n < t; n++) Qa.delete(e[n].key)
}

function ho(e, t, n) {
    let r = n.dateUpdated || ``,
        i = new Date(Date.now() + M.staleTTL),
        a = M.disableCache ? void 0 : Qa.get(t);
    if (a && r && a.version === r) {
        a.staleAt = i, co();
        return
    }
    M.disableCache || (Qa.set(t, {
        data: n,
        version: r,
        staleAt: i,
        sse: to.has(e)
    }), mo()), co();
    let o = Xa.get(e);
    o && o.forEach(e => go(e, n))
}
async function go(e, t) {
    await e.setPayload(t || e.getPayload())
}
async function _o(e) {
    let {
        apiHost: t,
        apiRequestHeaders: n
    } = e.getApiHosts(), r = e.getClientKey(), i = `isRemoteEval` in e && e.isRemoteEval(), a = uo(e), o = fo(e), s = $a.get(o);
    return s || (s = (i ? Ya.fetchRemoteEvalCall({
        host: t,
        clientKey: r,
        payload: {
            attributes: e.getAttributes(),
            forcedVariations: e.getForcedVariations(),
            forcedFeatures: Array.from(e.getForcedFeatures().entries()),
            url: e.getUrl()
        },
        headers: n
    }) : Ya.fetchFeaturesCall({
        host: t,
        clientKey: r,
        headers: n
    })).then(e => {
        if (!e.ok) throw Error(`HTTP error: ${e.status}`);
        return e.headers.get(`x-sse-support`) === `enabled` && to.add(a), e.json()
    }).then(t => (ho(a, o, t), N(e), $a.delete(o), {
        data: t,
        success: !0,
        source: `network`
    })).catch(e => ($a.delete(o), {
        data: null,
        source: `error`,
        success: !1,
        error: e
    })), $a.set(o, s)), s
}

function N(e, t = !1) {
    let n = uo(e),
        r = fo(e),
        {
            streamingHost: i,
            streamingHostRequestHeaders: a
        } = e.getApiHosts(),
        o = e.getClientKey();
    if (t && to.add(n), M.backgroundSync && to.has(n) && Ja.EventSource) {
        if (eo.has(n)) return;
        let e = {
            src: null,
            host: i,
            clientKey: o,
            headers: a,
            cb: t => {
                try {
                    if (t.type === `features-updated`) {
                        let e = Xa.get(n);
                        e && e.forEach(e => {
                            _o(e)
                        })
                    } else t.type === `features` && ho(n, r, JSON.parse(t.data));
                    e.errors = 0
                } catch {
                    vo(e)
                }
            },
            errors: 0,
            state: `active`
        };
        eo.set(n, e), P(e)
    }
}

function vo(e) {
    if (e.state !== `idle` && (e.errors++, e.errors > 3 || e.src && e.src.readyState === 2)) {
        let t = 3 ** (e.errors - 3) * (1e3 + Math.random() * 1e3);
        yo(e), setTimeout(() => {
            [`idle`, `active`].includes(e.state) || P(e)
        }, Math.min(t, 3e5))
    }
}

function yo(e) {
    e.src && (e.src.onopen = null, e.src.onerror = null, e.src.close(), e.src = null, e.state === `active` && (e.state = `disabled`))
}

function P(e) {
    e.src = Ya.eventSourceCall({
        host: e.host,
        clientKey: e.clientKey,
        headers: e.headers
    }), e.state = `active`, e.src.addEventListener(`features`, e.cb), e.src.addEventListener(`features-updated`, e.cb), e.src.onerror = () => vo(e), e.src.onopen = () => {
        e.errors = 0
    }
}

function F(e, t) {
    yo(e), eo.delete(t)
}

function I() {
    to.clear(), eo.forEach(F), Xa.clear(), Ya.stopIdleListener()
}

function bo(e, t) {
    if (t.streaming) {
        if (!e.getClientKey()) throw Error(`Must specify clientKey to enable streaming`);
        t.payload && N(e, !0), io(e)
    }
}
var xo = /^[a-zA-Z:_][a-zA-Z0-9:_.-]*$/,
    So = {
        revert: function() {}
    },
    Co = new Map,
    wo = new Set;

function To(e) {
    return e === `html` ? {
        childList: !0,
        subtree: !0,
        attributes: !0,
        characterData: !0
    } : {
        childList: !1,
        subtree: !1,
        attributes: !0,
        attributeFilter: [e]
    }
}

function Eo(e) {
    var t = Co.get(e);
    return t || (t = {
        element: e,
        attributes: {}
    }, Co.set(e, t)), t
}

function L(e, t, n, r, i) {
    var a = n(e),
        o = {
            isDirty: !1,
            originalValue: a,
            virtualValue: a,
            mutations: [],
            el: e,
            _positionTimeout: null,
            observer: new MutationObserver(function() {
                if (!(t === `position` && o._positionTimeout)) {
                    t === `position` && (o._positionTimeout = setTimeout(function() {
                        o._positionTimeout = null
                    }, 1e3));
                    var r = n(e);
                    t === `position` && r.parentNode === o.virtualValue.parentNode && r.insertBeforeNode === o.virtualValue.insertBeforeNode || r !== o.virtualValue && (o.originalValue = r, i(o))
                }
            }),
            mutationRunner: i,
            setValue: r,
            getCurrentValue: n
        };
    return t === `position` && e.parentNode ? o.observer.observe(e.parentNode, {
        childList: !0,
        subtree: !0,
        attributes: !1,
        characterData: !1
    }) : o.observer.observe(e, To(t)), o
}

function Do(e, t) {
    var n = t.getCurrentValue(t.el);
    t.virtualValue = e, e && typeof e != `string` ? (!n || e.parentNode !== n.parentNode || e.insertBeforeNode !== n.insertBeforeNode) && (t.isDirty = !0, Yo()) : e !== n && (t.isDirty = !0, Yo())
}

function Oo(e) {
    var t = e.originalValue;
    e.mutations.forEach(function(e) {
        return t = e.mutate(t)
    }), Do(Ko(t), e)
}

function ko(e) {
    var t = new Set(e.originalValue.split(/\s+/).filter(Boolean));
    e.mutations.forEach(function(e) {
        return e.mutate(t)
    }), Do(Array.from(t).filter(Boolean).join(` `), e)
}

function Ao(e) {
    var t = e.originalValue;
    e.mutations.forEach(function(e) {
        return t = e.mutate(t)
    }), Do(t, e)
}

function jo(e) {
    var t = e.parentSelector,
        n = e.insertBeforeSelector,
        r = document.querySelector(t);
    if (!r) return null;
    var i = n ? document.querySelector(n) : null;
    return n && !i ? null : {
        parentNode: r,
        insertBeforeNode: i
    }
}

function Mo(e) {
    var t = e.originalValue;
    e.mutations.forEach(function(e) {
        t = jo(e.mutate()) || t
    }), Do(t, e)
}
var No = function(e) {
        return e.innerHTML
    },
    Po = function(e, t) {
        return e.innerHTML = t
    };

function Fo(e) {
    var t = Eo(e);
    return t.html || = L(e, `html`, No, Po, Oo), t.html
}
var R = function(e) {
        return {
            parentNode: e.parentElement,
            insertBeforeNode: e.nextElementSibling
        }
    },
    Io = function(e, t) {
        t.insertBeforeNode && !t.parentNode.contains(t.insertBeforeNode) || t.parentNode.insertBefore(e, t.insertBeforeNode)
    };

function Lo(e) {
    var t = Eo(e);
    return t.position || = L(e, `position`, R, Io, Mo), t.position
}
var Ro = function(e, t) {
        return t ? e.className = t : e.removeAttribute(`class`)
    },
    zo = function(e) {
        return e.className
    };

function Bo(e) {
    var t = Eo(e);
    return t.classes || = L(e, `class`, zo, Ro, ko), t.classes
}
var Vo = function(e) {
        return function(t) {
            return t.getAttribute(e) ? ? null
        }
    },
    Ho = function(e) {
        return function(t, n) {
            return n === null ? t.removeAttribute(e) : t.setAttribute(e, n)
        }
    };

function Uo(e, t) {
    var n = Eo(e);
    return n.attributes[t] || (n.attributes[t] = L(e, t, Vo(t), Ho(t), Ao)), n.attributes[t]
}

function Wo(e, t) {
    var n = Co.get(e);
    if (n)
        if (t === `html`) {
            var r, i;
            (r = n.html) == null || (i = r.observer) == null || i.disconnect(), delete n.html
        } else if (t === `class`) {
        var a, o;
        (a = n.classes) == null || (o = a.observer) == null || o.disconnect(), delete n.classes
    } else if (t === `position`) {
        var s, c;
        (s = n.position) == null || (c = s.observer) == null || c.disconnect(), delete n.position
    } else {
        var l, u, d;
        (l = n.attributes) == null || (u = l[t]) == null || (d = u.observer) == null || d.disconnect(), delete n.attributes[t]
    }
}
var Go;

function Ko(e) {
    return Go || = document.createElement(`div`), Go.innerHTML = e, Go.innerHTML
}

function qo(e, t, n) {
    if (n.isDirty) {
        n.isDirty = !1;
        var r = n.virtualValue;
        n.mutations.length || Wo(e, t), n.setValue(e, r)
    }
}

function Jo(e, t) {
    e.html && qo(t, `html`, e.html), e.classes && qo(t, `class`, e.classes), e.position && qo(t, `position`, e.position), Object.keys(e.attributes).forEach(function(n) {
        qo(t, n, e.attributes[n])
    })
}

function Yo() {
    Co.forEach(Jo)
}

function Xo(e, t) {
    var n = null;
    e.kind === `html` ? n = Fo(t) : e.kind === `class` ? n = Bo(t) : e.kind === `attribute` ? n = Uo(t, e.attribute) : e.kind === `position` && (n = Lo(t)), n && (n.mutations.push(e), n.mutationRunner(n))
}

function Zo(e, t) {
    var n = null;
    if (e.kind === `html` ? n = Fo(t) : e.kind === `class` ? n = Bo(t) : e.kind === `attribute` ? n = Uo(t, e.attribute) : e.kind === `position` && (n = Lo(t)), n) {
        var r = n.mutations.indexOf(e);
        r !== -1 && n.mutations.splice(r, 1), n.mutationRunner(n)
    }
}

function Qo(e) {
    if (!(e.kind === `position` && e.elements.size === 1)) {
        var t = new Set(e.elements);
        document.querySelectorAll(e.selector).forEach(function(n) {
            t.has(n) || (e.elements.add(n), Xo(e, n))
        })
    }
}

function $o(e) {
    e.elements.forEach(function(t) {
        return Zo(e, t)
    }), e.elements.clear(), wo.delete(e)
}

function es() {
    wo.forEach(Qo)
}
var ts;

function ns() {
    typeof document > `u` || (ts || = new MutationObserver(function() {
        es()
    }), es(), ts.observe(document.documentElement, {
        childList: !0,
        subtree: !0,
        attributes: !1,
        characterData: !1
    }))
}
ns();

function rs(e) {
    return typeof document > `u` ? So : (wo.add(e), Qo(e), {
        revert: function() {
            $o(e)
        }
    })
}

function is(e, t) {
    return rs({
        kind: `html`,
        elements: new Set,
        mutate: t,
        selector: e
    })
}

function as(e, t) {
    return rs({
        kind: `position`,
        elements: new Set,
        mutate: t,
        selector: e
    })
}

function os(e, t) {
    return rs({
        kind: `class`,
        elements: new Set,
        mutate: t,
        selector: e
    })
}

function ss(e, t, n) {
    return xo.test(t) ? t === `class` || t === `className` ? os(e, function(e) {
        var t = n(Array.from(e).join(` `));
        e.clear(), t && t.split(/\s+/g).filter(Boolean).forEach(function(t) {
            return e.add(t)
        })
    }) : rs({
        kind: `attribute`,
        attribute: t,
        elements: new Set,
        mutate: n,
        selector: e
    }) : So
}

function cs(e) {
    var t = e.selector,
        n = e.action,
        r = e.value,
        i = e.attribute,
        a = e.parentSelector,
        o = e.insertBeforeSelector;
    if (i === `html`) {
        if (n === `append`) return is(t, function(e) {
            return e + (r ? ? ``)
        });
        if (n === `set`) return is(t, function() {
            return r ? ? ``
        })
    } else if (i === `class`) {
        if (n === `append`) return os(t, function(e) {
            r && e.add(r)
        });
        if (n === `remove`) return os(t, function(e) {
            r && e.delete(r)
        });
        if (n === `set`) return os(t, function(e) {
            e.clear(), r && e.add(r)
        })
    } else if (i === `position`) {
        if (n === `set` && a) return as(t, function() {
            return {
                insertBeforeSelector: o,
                parentSelector: a
            }
        })
    } else if (n === `append`) return ss(t, i, function(e) {
        return e === null ? r ? ? `` : e + (r ? ? ``)
    });
    else if (n === `set`) return ss(t, i, function() {
        return r ? ? ``
    });
    else if (n === `remove`) return ss(t, i, function() {
        return null
    });
    return So
}
var ls = {
        html: is,
        classes: os,
        attribute: ss,
        position: as,
        declarative: cs
    },
    us = {};

function ds(e, t, n) {
    n || = {};
    for (let [r, i] of Object.entries(t)) switch (r) {
        case `$or`:
            if (!xs(e, i, n)) return !1;
            break;
        case `$nor`:
            if (xs(e, i, n)) return !1;
            break;
        case `$and`:
            if (!Ss(e, i, n)) return !1;
            break;
        case `$not`:
            if (ds(e, i, n)) return !1;
            break;
        default:
            if (!ms(i, fs(e, r), n)) return !1
    }
    return !0
}

function fs(e, t) {
    let n = t.split(`.`),
        r = e;
    for (let e = 0; e < n.length; e++)
        if (r && typeof r == `object` && n[e] in r) r = r[n[e]];
        else return null;
    return r
}

function ps(e, t = !1) {
    let n = `${e}${t?`/i`:``}`;
    return us[n] || (us[n] = new RegExp(e.replace(/([^\\])\//g, `$1\\/`), t ? `i` : void 0)), us[n]
}

function ms(e, t, n, r = !1) {
    if (typeof e == `string`) return r ? String(t).toLowerCase() === e.toLowerCase() : t + `` === e;
    if (typeof e == `number`) return t * 1 === e;
    if (typeof e == `boolean`) return t !== null && !!t === e;
    if (e === null) return t === null;
    if (Array.isArray(e) || !hs(e)) return JSON.stringify(t) === JSON.stringify(e);
    for (let r in e)
        if (!bs(r, t, e[r], n)) return !1;
    return !0
}

function hs(e) {
    let t = Object.keys(e);
    return t.length > 0 && t.filter(e => e[0] === `$`).length === t.length
}

function gs(e) {
    if (e === null) return `null`;
    if (Array.isArray(e)) return `array`;
    let t = typeof e;
    return [`string`, `number`, `boolean`, `object`, `undefined`].includes(t) ? t : `unknown`
}

function _s(e, t, n) {
    if (!Array.isArray(e)) return !1;
    let r = hs(t) ? e => ms(t, e, n) : e => ds(e, t, n);
    for (let t = 0; t < e.length; t++)
        if (e[t] && r(e[t])) return !0;
    return !1
}

function vs(e, t, n = !1) {
    if (n) {
        let n = e => typeof e == `string` ? e.toLowerCase() : e;
        return Array.isArray(e) ? e.some(e => t.some(t => n(e) === n(t))) : t.some(t => n(e) === n(t))
    }
    return Array.isArray(e) ? e.some(e => t.includes(e)) : t.includes(e)
}

function ys(e, t, n, r = !1) {
    if (!Array.isArray(e)) return !1;
    for (let i = 0; i < t.length; i++) {
        let a = !1;
        for (let o = 0; o < e.length; o++)
            if (ms(t[i], e[o], n, r)) {
                a = !0;
                break
            }
        if (!a) return !1
    }
    return !0
}

function bs(e, t, n, r) {
    switch (e) {
        case `$veq`:
            return Ha(t) === Ha(n);
        case `$vne`:
            return Ha(t) !== Ha(n);
        case `$vgt`:
            return Ha(t) > Ha(n);
        case `$vgte`:
            return Ha(t) >= Ha(n);
        case `$vlt`:
            return Ha(t) < Ha(n);
        case `$vlte`:
            return Ha(t) <= Ha(n);
        case `$eq`:
            return t === n;
        case `$ne`:
            return t !== n;
        case `$lt`:
            return t < n;
        case `$lte`:
            return t <= n;
        case `$gt`:
            return t > n;
        case `$gte`:
            return t >= n;
        case `$exists`:
            return n ? t != null : t == null;
        case `$in`:
            return Array.isArray(n) ? vs(t, n) : !1;
        case `$ini`:
            return Array.isArray(n) ? vs(t, n, !0) : !1;
        case `$inGroup`:
            return vs(t, r[n] || []);
        case `$notInGroup`:
            return !vs(t, r[n] || []);
        case `$nin`:
            return Array.isArray(n) ? !vs(t, n) : !1;
        case `$nini`:
            return Array.isArray(n) ? !vs(t, n, !0) : !1;
        case `$not`:
            return !ms(n, t, r);
        case `$size`:
            return Array.isArray(t) ? ms(n, t.length, r) : !1;
        case `$elemMatch`:
            return _s(t, n, r);
        case `$all`:
            return Array.isArray(n) ? ys(t, n, r) : !1;
        case `$alli`:
            return Array.isArray(n) ? ys(t, n, r, !0) : !1;
        case `$regex`:
            try {
                return ps(n).test(t)
            } catch {
                return !1
            }
        case `$regexi`:
            try {
                return ps(n, !0).test(t)
            } catch {
                return !1
            }
        case `$type`:
            return gs(t) === n;
        default:
            return !1
    }
}

function xs(e, t, n) {
    if (!t.length) return !0;
    for (let r = 0; r < t.length; r++)
        if (ds(e, t[r], n)) return !0;
    return !1
}

function Ss(e, t, n) {
    for (let r = 0; r < t.length; r++)
        if (!ds(e, t[r], n)) return !1;
    return !0
}
var Cs = `Feature Evaluated`,
    ws = `Experiment Viewed`;

function Ts(e) {
    let t = new Map;
    return e.global.forcedFeatureValues && e.global.forcedFeatureValues.forEach((e, n) => t.set(n, e)), e.user.forcedFeatureValues && e.user.forcedFeatureValues.forEach((e, n) => t.set(n, e)), t
}

function Es(e) {
    return e.global.forcedVariations && e.user.forcedVariations ? { ...e.global.forcedVariations,
        ...e.user.forcedVariations
    } : e.global.forcedVariations ? e.global.forcedVariations : e.user.forcedVariations ? e.user.forcedVariations : {}
}
async function Ds(e) {
    try {
        await e()
    } catch {}
}

function Os(e, t, n) {
    if (e.user.trackedExperiments) {
        let r = Qs(t, n);
        if (e.user.trackedExperiments.has(r)) return [];
        e.user.trackedExperiments.add(r)
    }
    e.user.enableDevMode && e.user.devLogs && e.user.devLogs.push({
        experiment: t,
        result: n,
        timestamp: Date.now().toString(),
        logType: `experiment`
    });
    let r = [];
    if (e.global.trackingCallback) {
        let i = e.global.trackingCallback;
        r.push(Ds(() => i(t, n, e.user)))
    }
    if (e.user.trackingCallback) {
        let i = e.user.trackingCallback;
        r.push(Ds(() => i(t, n)))
    }
    if (e.global.eventLogger) {
        let i = e.global.eventLogger;
        r.push(Ds(() => i(ws, {
            experimentId: t.key,
            variationId: n.key,
            hashAttribute: n.hashAttribute,
            hashValue: n.hashValue
        }, e.user)))
    }
    return r
}

function ks(e, t, n) {
    if (e.user.trackedFeatureUsage) {
        let r = JSON.stringify(n.value);
        if (e.user.trackedFeatureUsage[t] === r) return;
        e.user.trackedFeatureUsage[t] = r, e.user.enableDevMode && e.user.devLogs && e.user.devLogs.push({
            featureKey: t,
            result: n,
            timestamp: Date.now().toString(),
            logType: `feature`
        })
    }
    if (e.global.onFeatureUsage) {
        let r = e.global.onFeatureUsage;
        Ds(() => r(t, n, e.user))
    }
    if (e.user.onFeatureUsage) {
        let r = e.user.onFeatureUsage;
        Ds(() => r(t, n))
    }
    if (e.global.eventLogger) {
        let r = e.global.eventLogger;
        Ds(() => r(Cs, {
            feature: t,
            source: n.source,
            value: n.value,
            ruleId: n.source === `defaultValue` ? `$default` : n.ruleId || ``,
            variationId: n.experimentResult ? n.experimentResult.key : ``
        }, e.user))
    }
}

function As(e, t) {
    if (t.stack.evaluatedFeatures.has(e)) return Ms(t, e, null, `cyclicPrerequisite`);
    t.stack.evaluatedFeatures.add(e), t.stack.id = e;
    let n = Ts(t);
    if (n.has(e)) return Ms(t, e, n.get(e), `override`);
    if (!t.global.features || !t.global.features[e]) return Ms(t, e, null, `unknownFeature`);
    let r = t.global.features[e];
    if (r.rules) {
        let n = new Set(t.stack.evaluatedFeatures);
        rules: for (let i of r.rules) {
            if (i.parentConditions)
                for (let r of i.parentConditions) {
                    t.stack.evaluatedFeatures = new Set(n);
                    let i = As(r.id, t);
                    if (i.source === `cyclicPrerequisite`) return Ms(t, e, null, `cyclicPrerequisite`);
                    if (!ds({
                            value: i.value
                        }, r.condition || {})) {
                        if (r.gate) return Ms(t, e, null, `prerequisite`);
                        continue rules
                    }
                }
            if (i.filters && Fs(i.filters, t)) continue;
            if (`force` in i) {
                if (i.condition && !Ps(i.condition, t) || !Is(t, i.seed || e, i.hashAttribute, t.user.saveStickyBucketAssignmentDoc && !i.disableStickyBucketing ? i.fallbackAttribute : void 0, i.range, i.coverage, i.hashVersion)) continue;
                return i.tracks && i.tracks.forEach(e => {
                    !Os(t, e.experiment, e.result).length && t.global.saveDeferredTrack && t.global.saveDeferredTrack({
                        experiment: e.experiment,
                        result: e.result
                    })
                }), Ms(t, e, i.force, `force`, i.id)
            }
            if (!i.variations) continue;
            let r = {
                variations: i.variations,
                key: i.key || e
            };
            `coverage` in i && (r.coverage = i.coverage), i.weights && (r.weights = i.weights), i.hashAttribute && (r.hashAttribute = i.hashAttribute), i.fallbackAttribute && (r.fallbackAttribute = i.fallbackAttribute), i.disableStickyBucketing && (r.disableStickyBucketing = i.disableStickyBucketing), i.bucketVersion !== void 0 && (r.bucketVersion = i.bucketVersion), i.minBucketVersion !== void 0 && (r.minBucketVersion = i.minBucketVersion), i.namespace && (r.namespace = i.namespace), i.meta && (r.meta = i.meta), i.ranges && (r.ranges = i.ranges), i.name && (r.name = i.name), i.phase && (r.phase = i.phase), i.seed && (r.seed = i.seed), i.hashVersion && (r.hashVersion = i.hashVersion), i.filters && (r.filters = i.filters), i.condition && (r.condition = i.condition);
            let {
                result: a
            } = js(r, e, t);
            if (t.global.onExperimentEval && t.global.onExperimentEval(r, a), a.inExperiment && !a.passthrough) return Ms(t, e, a.value, `experiment`, i.id, r, a)
        }
    }
    return Ms(t, e, r.defaultValue === void 0 ? null : r.defaultValue, `defaultValue`)
}

function js(e, t, n) {
    let r = e.key,
        i = e.variations.length;
    if (i < 2 || n.global.enabled === !1 || n.user.enabled === !1 || (e = Rs(e, n), e.urlPatterns && !Ma(n.user.url || ``, e.urlPatterns))) return {
        result: Ls(n, e, -1, !1, t)
    };
    let a = La(r, n.user.url || ``, i);
    if (a !== null) return {
        result: Ls(n, e, a, !1, t)
    };
    let o = Es(n);
    if (r in o) {
        let i = o[r];
        return {
            result: Ls(n, e, i, !1, t)
        }
    }
    if (e.status === `draft` || e.active === !1) return {
        result: Ls(n, e, -1, !1, t)
    };
    let {
        hashAttribute: s,
        hashValue: c
    } = zs(n, e.hashAttribute, n.user.saveStickyBucketAssignmentDoc && !e.disableStickyBucketing ? e.fallbackAttribute : void 0);
    if (!c) return {
        result: Ls(n, e, -1, !1, t)
    };
    let l = -1,
        u = !1,
        d = !1;
    if (n.user.saveStickyBucketAssignmentDoc && !e.disableStickyBucketing) {
        let {
            variation: t,
            versionIsBlocked: r
        } = Hs({
            ctx: n,
            expKey: e.key,
            expBucketVersion: e.bucketVersion,
            expHashAttribute: e.hashAttribute,
            expFallbackAttribute: e.fallbackAttribute,
            expMinBucketVersion: e.minBucketVersion,
            expMeta: e.meta
        });
        u = t >= 0, l = t, d = !!r
    }
    if (!u) {
        if (e.filters) {
            if (Fs(e.filters, n)) return {
                result: Ls(n, e, -1, !1, t)
            }
        } else if (e.namespace && !ka(c, e.namespace)) return {
            result: Ls(n, e, -1, !1, t)
        };
        if (e.include && !Ra(e.include) || e.condition && !Ps(e.condition, n)) return {
            result: Ls(n, e, -1, !1, t)
        };
        if (e.parentConditions) {
            let r = new Set(n.stack.evaluatedFeatures);
            for (let i of e.parentConditions) {
                n.stack.evaluatedFeatures = new Set(r);
                let a = As(i.id, n);
                if (a.source === `cyclicPrerequisite` || !ds({
                        value: a.value
                    }, i.condition || {})) return {
                    result: Ls(n, e, -1, !1, t)
                }
            }
        }
        if (e.groups && !Vs(e.groups, n)) return {
            result: Ls(n, e, -1, !1, t)
        }
    }
    if (e.url && !Bs(e.url, n)) return {
        result: Ls(n, e, -1, !1, t)
    };
    let f = Ea(e.seed || r, c, e.hashVersion || 1);
    if (f === null) return {
        result: Ls(n, e, -1, !1, t)
    };
    if (u || (l = Aa(f, e.ranges || Ia(i, e.coverage === void 0 ? 1 : e.coverage, e.weights))), d) return {
        result: Ls(n, e, -1, !1, t, void 0, !0)
    };
    if (l < 0) return {
        result: Ls(n, e, -1, !1, t)
    };
    if (`force` in e) return {
        result: Ls(n, e, e.force === void 0 ? -1 : e.force, !1, t)
    };
    if (n.global.qaMode || n.user.qaMode || e.status === `stopped`) return {
        result: Ls(n, e, -1, !1, t)
    };
    let p = Ls(n, e, l, !0, t, f, u);
    if (n.user.saveStickyBucketAssignmentDoc && !e.disableStickyBucketing) {
        let {
            changed: t,
            key: r,
            doc: i
        } = Ks(n, s, Va(c), {
            [Us(e.key, e.bucketVersion)]: p.key
        });
        t && (n.user.stickyBucketAssignmentDocs = n.user.stickyBucketAssignmentDocs || {}, n.user.stickyBucketAssignmentDocs[r] = i, n.user.saveStickyBucketAssignmentDoc(i))
    }
    let m = Os(n, e, p);
    m.length === 0 && n.global.saveDeferredTrack && n.global.saveDeferredTrack({
        experiment: e,
        result: p
    });
    let h = m.length ? m.length === 1 ? m[0] : Promise.all(m).then(() => {}) : void 0;
    return `changeId` in e && e.changeId && n.global.recordChangeId && n.global.recordChangeId(e.changeId), {
        result: p,
        trackingCall: h
    }
}

function Ms(e, t, n, r, i, a, o) {
    let s = {
        value: n,
        on: !!n,
        off: !n,
        source: r,
        ruleId: i || ``
    };
    return a && (s.experiment = a), o && (s.experimentResult = o), r !== `override` && ks(e, t, s), s
}

function Ns(e) {
    return { ...e.user.attributes,
        ...e.user.attributeOverrides
    }
}

function Ps(e, t) {
    return ds(Ns(t), e, t.global.savedGroups || {})
}

function Fs(e, t) {
    return e.some(e => {
        let {
            hashValue: n
        } = zs(t, e.attribute);
        if (!n) return !0;
        let r = Ea(e.seed, n, e.hashVersion || 2);
        return r === null ? !0 : !e.ranges.some(e => Oa(r, e))
    })
}

function Is(e, t, n, r, i, a, o) {
    if (!i && a === void 0) return !0;
    if (!i && a === 0) return !1;
    let {
        hashValue: s
    } = zs(e, n, r);
    if (!s) return !1;
    let c = Ea(t, s, o || 1);
    return c === null ? !1 : i ? Oa(c, i) : a === void 0 ? !0 : c <= a
}

function Ls(e, t, n, r, i, a, o) {
    let s = !0;
    (n < 0 || n >= t.variations.length) && (n = 0, s = !1);
    let {
        hashAttribute: c,
        hashValue: l
    } = zs(e, t.hashAttribute, e.user.saveStickyBucketAssignmentDoc && !t.disableStickyBucketing ? t.fallbackAttribute : void 0), u = t.meta ? t.meta[n] : {}, d = {
        key: u.key || `` + n,
        featureId: i,
        inExperiment: s,
        hashUsed: r,
        variationId: n,
        value: t.variations[n],
        hashAttribute: c,
        hashValue: l,
        stickyBucketUsed: !!o
    };
    return u.name && (d.name = u.name), a !== void 0 && (d.bucket = a), u.passthrough && (d.passthrough = u.passthrough), d
}

function Rs(e, t) {
    let n = e.key,
        r = t.global.overrides;
    return r && r[n] && (e = Object.assign({}, e, r[n]), typeof e.url == `string` && (e.url = ja(e.url))), e
}

function zs(e, t, n) {
    let r = t || `id`,
        i = ``,
        a = Ns(e);
    return a[r] && (i = a[r]), !i && n && (a[n] && (i = a[n]), i && (r = n)), {
        hashAttribute: r,
        hashValue: i
    }
}

function Bs(e, t) {
    let n = t.user.url;
    if (!n) return !1;
    let r = n.replace(/^https?:\/\//, ``).replace(/^[^/]*\//, `/`);
    return !!(e.test(n) || e.test(r))
}

function Vs(e, t) {
    let n = t.global.groups || {};
    for (let t = 0; t < e.length; t++)
        if (n[e[t]]) return !0;
    return !1
}

function Hs({
    ctx: e,
    expKey: t,
    expBucketVersion: n,
    expHashAttribute: r,
    expFallbackAttribute: i,
    expMinBucketVersion: a,
    expMeta: o
}) {
    n || = 0, a || = 0, r || = `id`, o || = [];
    let s = Us(t, n),
        c = Gs(e, r, i);
    if (a > 0) {
        for (let e = 0; e < a; e++)
            if (c[Us(t, e)] !== void 0) return {
                variation: -1,
                versionIsBlocked: !0
            }
    }
    let l = c[s];
    if (l === void 0) return {
        variation: -1
    };
    let u = o.findIndex(e => e.key === l);
    return u < 0 ? {
        variation: -1
    } : {
        variation: u
    }
}

function Us(e, t) {
    return t || = 0, `${e}__${t}`
}

function Ws(e, t) {
    return `${e}||${t}`
}

function Gs(e, t, n) {
    if (!e.user.stickyBucketAssignmentDocs) return {};
    let {
        hashAttribute: r,
        hashValue: i
    } = zs(e, t), a = Ws(r, Va(i)), {
        hashAttribute: o,
        hashValue: s
    } = zs(e, n), c = s ? Ws(o, Va(s)) : null, l = {};
    return c && e.user.stickyBucketAssignmentDocs[c] && Object.assign(l, e.user.stickyBucketAssignmentDocs[c].assignments || {}), e.user.stickyBucketAssignmentDocs[a] && Object.assign(l, e.user.stickyBucketAssignmentDocs[a].assignments || {}), l
}

function Ks(e, t, n, r) {
    let i = Ws(t, n),
        a = e.user.stickyBucketAssignmentDocs && e.user.stickyBucketAssignmentDocs[i] && e.user.stickyBucketAssignmentDocs[i].assignments || {},
        o = { ...a,
            ...r
        },
        s = JSON.stringify(a) !== JSON.stringify(o);
    return {
        key: i,
        doc: {
            attributeName: t,
            attributeValue: n,
            assignments: o
        },
        changed: s
    }
}

function qs(e, t) {
    let n = new Set,
        r = t && t.features ? t.features : e.global.features || {},
        i = t && t.experiments ? t.experiments : e.global.experiments || [];
    return Object.keys(r).forEach(e => {
        let t = r[e];
        if (t.rules)
            for (let e of t.rules) e.variations && (n.add(e.hashAttribute || `id`), e.fallbackAttribute && n.add(e.fallbackAttribute))
    }), i.map(e => {
        n.add(e.hashAttribute || `id`), e.fallbackAttribute && n.add(e.fallbackAttribute)
    }), Array.from(n)
}
async function Js(e, t, n) {
    let r = Ys(e, n);
    return t.getAllAssignments(r)
}

function Ys(e, t) {
    let n = {};
    return qs(e, t).forEach(t => {
        let {
            hashValue: r
        } = zs(e, t);
        n[t] = Va(r)
    }), n
}
async function Xs(e, t, n) {
    if (e = { ...e
        }, e.encryptedFeatures) {
        try {
            e.features = JSON.parse(await Ba(e.encryptedFeatures, t, n))
        } catch {}
        delete e.encryptedFeatures
    }
    if (e.encryptedExperiments) {
        try {
            e.experiments = JSON.parse(await Ba(e.encryptedExperiments, t, n))
        } catch {}
        delete e.encryptedExperiments
    }
    if (e.encryptedSavedGroups) {
        try {
            e.savedGroups = JSON.parse(await Ba(e.encryptedSavedGroups, t, n))
        } catch {}
        delete e.encryptedSavedGroups
    }
    return e
}

function Zs(e) {
    let t = e.apiHost || `https://cdn.growthbook.io`;
    return {
        apiHost: t.replace(/\/*$/, ``),
        streamingHost: (e.streamingHost || t).replace(/\/*$/, ``),
        apiRequestHeaders: e.apiHostRequestHeaders,
        streamingHostRequestHeaders: e.streamingHostRequestHeaders
    }
}

function Qs(e, t) {
    return t.hashAttribute + t.hashValue + e.key + t.variationId
}
var $s = typeof window < `u` && typeof document < `u`,
    ec = Ua(),
    tc = class {
        constructor(e) {
            if (e || = {}, this.version = ec, this._options = this.context = e, this._renderer = e.renderer || null, this._trackedExperiments = new Set, this._completedChangeIds = new Set, this._trackedFeatures = {}, this.debug = !!e.debug, this._subscriptions = new Set, this.ready = !1, this._assigned = new Map, this._activeAutoExperiments = new Map, this._triggeredExpKeys = new Set, this._initialized = !1, this._redirectedUrl = ``, this._deferredTrackingCalls = new Map, this._autoExperimentsAllowed = !e.disableExperimentsOnLoad, this._destroyCallbacks = [], this.logs = [], this.log = this.log.bind(this), this._saveDeferredTrack = this._saveDeferredTrack.bind(this), this._onExperimentEval = this._onExperimentEval.bind(this), this._fireSubscriptions = this._fireSubscriptions.bind(this), this._recordChangedId = this._recordChangedId.bind(this), e.remoteEval) {
                if (e.decryptionKey) throw Error(`Encryption is not available for remoteEval`);
                if (!e.clientKey) throw Error(`Missing clientKey`);
                let t = !1;
                try {
                    t = !!new URL(e.apiHost || ``).hostname.match(/growthbook\.io$/i)
                } catch {}
                if (t) throw Error(`Cannot use remoteEval on GrowthBook Cloud`)
            } else if (e.cacheKeyAttributes) throw Error(`cacheKeyAttributes are only used for remoteEval`);
            if (e.stickyBucketService) {
                let t = e.stickyBucketService;
                this._saveStickyBucketAssignmentDoc = e => t.saveAssignments(e)
            }
            if (e.plugins)
                for (let t of e.plugins) t(this);
            if (e.features && (this.ready = !0), $s && e.enableDevMode && (window._growthbook = this, document.dispatchEvent(new Event(`gbloaded`))), e.experiments && (this.ready = !0, this._updateAllAutoExperiments()), this._options.stickyBucketService && this._options.stickyBucketAssignmentDocs)
                for (let e in this._options.stickyBucketAssignmentDocs) {
                    let t = this._options.stickyBucketAssignmentDocs[e];
                    t && this._options.stickyBucketService.saveAssignments(t).catch(() => {})
                }
            this.ready && this.refreshStickyBuckets(this.getPayload())
        }
        async setPayload(e) {
            this._payload = e;
            let t = await Xs(e, this._options.decryptionKey);
            this._decryptedPayload = t, await this.refreshStickyBuckets(t), t.features && (this._options.features = t.features), t.savedGroups && (this._options.savedGroups = t.savedGroups), t.experiments && (this._options.experiments = t.experiments, this._updateAllAutoExperiments()), this.ready = !0, this._render()
        }
        initSync(e) {
            this._initialized = !0;
            let t = e.payload;
            if (t.encryptedExperiments || t.encryptedFeatures) throw Error(`initSync does not support encrypted payloads`);
            return this._options.stickyBucketService && !this._options.stickyBucketAssignmentDocs && (this._options.stickyBucketAssignmentDocs = this.generateStickyBucketAssignmentDocsSync(this._options.stickyBucketService, t)), this._payload = t, this._decryptedPayload = t, t.features && (this._options.features = t.features), t.experiments && (this._options.experiments = t.experiments, this._updateAllAutoExperiments()), this.ready = !0, bo(this, e), this
        }
        async init(e) {
            if (this._initialized = !0, e || = {}, e.cacheSettings && no(e.cacheSettings), e.payload) return await this.setPayload(e.payload), bo(this, e), {
                success: !0,
                source: `init`
            }; {
                let {
                    data: t,
                    ...n
                } = await this._refresh({ ...e,
                    allowStale: !0
                });
                return bo(this, e), await this.setPayload(t || {}), n
            }
        }
        async loadFeatures(e) {
            e || = {}, await this.init({
                skipCache: e.skipCache,
                timeout: e.timeout,
                streaming: (this._options.backgroundSync ? ? !0) && (e.autoRefresh || this._options.subscribeToChanges)
            })
        }
        async refreshFeatures(e) {
            let t = await this._refresh({ ...e || {},
                allowStale: !1
            });
            t.data && await this.setPayload(t.data)
        }
        getApiInfo() {
            return [this.getApiHosts().apiHost, this.getClientKey()]
        }
        getApiHosts() {
            return Zs(this._options)
        }
        getClientKey() {
            return this._options.clientKey || ``
        }
        getPayload() {
            return this._payload || {
                features: this.getFeatures(),
                experiments: this.getExperiments()
            }
        }
        getDecryptedPayload() {
            return this._decryptedPayload || this.getPayload()
        }
        isRemoteEval() {
            return this._options.remoteEval || !1
        }
        getCacheKeyAttributes() {
            return this._options.cacheKeyAttributes
        }
        async _refresh({
            timeout: e,
            skipCache: t,
            allowStale: n,
            streaming: r
        }) {
            if (!this._options.clientKey) throw Error(`Missing clientKey`);
            return ro({
                instance: this,
                timeout: e,
                skipCache: t || this._options.disableCache,
                allowStale: n,
                backgroundSync: r ? ? this._options.backgroundSync ? ? !0
            })
        }
        _render() {
            if (this._renderer) try {
                this._renderer()
            } catch {}
        }
        setFeatures(e) {
            this._options.features = e, this.ready = !0, this._render()
        }
        async setEncryptedFeatures(e, t, n) {
            let r = await Ba(e, t || this._options.decryptionKey, n);
            this.setFeatures(JSON.parse(r))
        }
        setExperiments(e) {
            this._options.experiments = e, this.ready = !0, this._updateAllAutoExperiments()
        }
        async setEncryptedExperiments(e, t, n) {
            let r = await Ba(e, t || this._options.decryptionKey, n);
            this.setExperiments(JSON.parse(r))
        }
        async setAttributes(e) {
            if (this._options.attributes = e, this._options.stickyBucketService && await this.refreshStickyBuckets(), this._options.remoteEval) {
                await this._refreshForRemoteEval();
                return
            }
            this._render(), this._updateAllAutoExperiments()
        }
        async updateAttributes(e) {
            return this.setAttributes({ ...this._options.attributes,
                ...e
            })
        }
        async setAttributeOverrides(e) {
            if (this._options.attributeOverrides = e, this._options.stickyBucketService && await this.refreshStickyBuckets(), this._options.remoteEval) {
                await this._refreshForRemoteEval();
                return
            }
            this._render(), this._updateAllAutoExperiments()
        }
        async setForcedVariations(e) {
            if (this._options.forcedVariations = e || {}, this._options.remoteEval) {
                await this._refreshForRemoteEval();
                return
            }
            this._render(), this._updateAllAutoExperiments()
        }
        setForcedFeatures(e) {
            this._options.forcedFeatureValues = e, this._render()
        }
        async setURL(e) {
            if (e !== this._options.url) {
                if (this._options.url = e, this._redirectedUrl = ``, this._options.remoteEval) {
                    await this._refreshForRemoteEval(), this._updateAllAutoExperiments(!0);
                    return
                }
                this._updateAllAutoExperiments(!0)
            }
        }
        getAttributes() {
            return { ...this._options.attributes,
                ...this._options.attributeOverrides
            }
        }
        getForcedVariations() {
            return this._options.forcedVariations || {}
        }
        getForcedFeatures() {
            return this._options.forcedFeatureValues || new Map
        }
        getStickyBucketAssignmentDocs() {
            return this._options.stickyBucketAssignmentDocs || {}
        }
        getUrl() {
            return this._options.url || ``
        }
        getFeatures() {
            return this._options.features || {}
        }
        getExperiments() {
            return this._options.experiments || []
        }
        getCompletedChangeIds() {
            return Array.from(this._completedChangeIds)
        }
        subscribe(e) {
            return this._subscriptions.add(e), () => {
                this._subscriptions.delete(e)
            }
        }
        async _refreshForRemoteEval() {
            if (!this._options.remoteEval || !this._initialized) return;
            let e = await this._refresh({
                allowStale: !1
            });
            e.data && await this.setPayload(e.data)
        }
        getAllResults() {
            return new Map(this._assigned)
        }
        onDestroy(e) {
            this._destroyCallbacks.push(e)
        }
        isDestroyed() {
            return !!this._destroyed
        }
        destroy(e) {
            e || = {}, this._destroyed = !0, this._destroyCallbacks.forEach(e => {
                try {
                    e()
                } catch {}
            }), this._subscriptions.clear(), this._assigned.clear(), this._trackedExperiments.clear(), this._completedChangeIds.clear(), this._deferredTrackingCalls.clear(), this._trackedFeatures = {}, this._destroyCallbacks = [], this._payload = void 0, this._saveStickyBucketAssignmentDoc = void 0, ao(this), e.destroyAllStreams && I(), this.logs = [], $s && window._growthbook === this && delete window._growthbook, this._activeAutoExperiments.forEach(e => {
                e.undo()
            }), this._activeAutoExperiments.clear(), this._triggeredExpKeys.clear()
        }
        setRenderer(e) {
            this._renderer = e
        }
        forceVariation(e, t) {
            if (this._options.forcedVariations = this._options.forcedVariations || {}, this._options.forcedVariations[e] = t, this._options.remoteEval) {
                this._refreshForRemoteEval();
                return
            }
            this._updateAllAutoExperiments(), this._render()
        }
        run(e) {
            let {
                result: t
            } = js(e, null, this._getEvalContext());
            return this._onExperimentEval(e, t), t
        }
        triggerExperiment(e) {
            return this._triggeredExpKeys.add(e), this._options.experiments ? this._options.experiments.filter(t => t.key === e).map(e => this._runAutoExperiment(e)).filter(e => e !== null) : null
        }
        triggerAutoExperiments() {
            this._autoExperimentsAllowed = !0, this._updateAllAutoExperiments(!0)
        }
        _getEvalContext() {
            return {
                user: this._getUserContext(),
                global: this._getGlobalContext(),
                stack: {
                    evaluatedFeatures: new Set
                }
            }
        }
        _getUserContext() {
            return {
                attributes: this._options.user ? { ...this._options.user,
                    ...this._options.attributes
                } : this._options.attributes,
                enableDevMode: this._options.enableDevMode,
                blockedChangeIds: this._options.blockedChangeIds,
                stickyBucketAssignmentDocs: this._options.stickyBucketAssignmentDocs,
                url: this._getContextUrl(),
                forcedVariations: this._options.forcedVariations,
                forcedFeatureValues: this._options.forcedFeatureValues,
                attributeOverrides: this._options.attributeOverrides,
                saveStickyBucketAssignmentDoc: this._saveStickyBucketAssignmentDoc,
                trackingCallback: this._options.trackingCallback,
                onFeatureUsage: this._options.onFeatureUsage,
                devLogs: this.logs,
                trackedExperiments: this._trackedExperiments,
                trackedFeatureUsage: this._trackedFeatures
            }
        }
        _getGlobalContext() {
            return {
                features: this._options.features,
                experiments: this._options.experiments,
                log: this.log,
                enabled: this._options.enabled,
                qaMode: this._options.qaMode,
                savedGroups: this._options.savedGroups,
                groups: this._options.groups,
                overrides: this._options.overrides,
                onExperimentEval: this._onExperimentEval,
                recordChangeId: this._recordChangedId,
                saveDeferredTrack: this._saveDeferredTrack,
                eventLogger: this._options.eventLogger
            }
        }
        _runAutoExperiment(e, t) {
            let n = this._activeAutoExperiments.get(e);
            if (e.manual && !this._triggeredExpKeys.has(e.key) && !n) return null;
            let r = this._isAutoExperimentBlockedByContext(e),
                i, a;
            r ? i = Ls(this._getEvalContext(), e, -1, !1, ``) : ({
                result: i,
                trackingCall: a
            } = js(e, null, this._getEvalContext()), this._onExperimentEval(e, i));
            let o = JSON.stringify(i.value);
            if (!t && i.inExperiment && n && n.valueHash === o) return i;
            if (n && this._undoActiveAutoExperiment(e), i.inExperiment) {
                let t = Ka(e);
                if (t === `redirect` && i.value.urlRedirect && e.urlPatterns) {
                    let t = e.persistQueryString ? Wa(this._getContextUrl(), i.value.urlRedirect) : i.value.urlRedirect;
                    if (Ma(t, e.urlPatterns)) return this.log(`Skipping redirect because original URL matches redirect URL`, {
                        id: e.key
                    }), i;
                    this._redirectedUrl = t;
                    let {
                        navigate: n,
                        delay: r
                    } = this._getNavigateFunction();
                    if (n)
                        if ($s) Promise.all([...a ? [qa(a, this._options.maxNavigateDelay ? ? 1e3)] : [], new Promise(e => window.setTimeout(e, this._options.navigateDelay ? ? r))]).then(() => {
                            try {
                                n(t)
                            } catch {}
                        });
                        else try {
                            n(t)
                        } catch {}
                } else if (t === `visual`) {
                    let t = this._options.applyDomChangesCallback ? this._options.applyDomChangesCallback(i.value) : this._applyDOMChanges(i.value);
                    t && this._activeAutoExperiments.set(e, {
                        undo: t,
                        valueHash: o
                    })
                }
            }
            return i
        }
        _undoActiveAutoExperiment(e) {
            let t = this._activeAutoExperiments.get(e);
            t && (t.undo(), this._activeAutoExperiments.delete(e))
        }
        _updateAllAutoExperiments(e) {
            if (!this._autoExperimentsAllowed) return;
            let t = this._options.experiments || [],
                n = new Set(t);
            this._activeAutoExperiments.forEach((e, t) => {
                n.has(t) || (e.undo(), this._activeAutoExperiments.delete(t))
            });
            for (let n of t) {
                let t = this._runAutoExperiment(n, e);
                if (t && t.inExperiment && Ka(n) === `redirect`) break
            }
        }
        _onExperimentEval(e, t) {
            let n = this._assigned.get(e.key);
            this._assigned.set(e.key, {
                experiment: e,
                result: t
            }), this._subscriptions.size > 0 && this._fireSubscriptions(e, t, n)
        }
        _fireSubscriptions(e, t, n) {
            (!n || n.result.inExperiment !== t.inExperiment || n.result.variationId !== t.variationId) && this._subscriptions.forEach(n => {
                try {
                    n(e, t)
                } catch {}
            })
        }
        _recordChangedId(e) {
            this._completedChangeIds.add(e)
        }
        isOn(e) {
            return this.evalFeature(e).on
        }
        isOff(e) {
            return this.evalFeature(e).off
        }
        getFeatureValue(e, t) {
            let n = this.evalFeature(e).value;
            return n === null ? t : n
        }
        feature(e) {
            return this.evalFeature(e)
        }
        evalFeature(e) {
            return As(e, this._getEvalContext())
        }
        log(e, t) {
            this.debug && this._options.log && this._options.log(e, t)
        }
        getDeferredTrackingCalls() {
            return Array.from(this._deferredTrackingCalls.values())
        }
        setDeferredTrackingCalls(e) {
            this._deferredTrackingCalls = new Map(e.filter(e => e && e.experiment && e.result).map(e => [Qs(e.experiment, e.result), e]))
        }
        async fireDeferredTrackingCalls() {
            if (!this._options.trackingCallback) return;
            let e = [];
            this._deferredTrackingCalls.forEach(t => {
                !t || !t.experiment || !t.result || e.push(this._options.trackingCallback(t.experiment, t.result))
            }), this._deferredTrackingCalls.clear(), await Promise.all(e)
        }
        setTrackingCallback(e) {
            this._options.trackingCallback = e, this.fireDeferredTrackingCalls()
        }
        setFeatureUsageCallback(e) {
            this._options.onFeatureUsage = e
        }
        setEventLogger(e) {
            this._options.eventLogger = e
        }
        async logEvent(e, t) {
            if (!this._destroyed && (this._options.enableDevMode && this.logs.push({
                    eventName: e,
                    properties: t,
                    timestamp: Date.now().toString(),
                    logType: `event`
                }), this._options.eventLogger)) try {
                await this._options.eventLogger(e, t || {}, this._getUserContext())
            } catch {}
        }
        _saveDeferredTrack(e) {
            this._deferredTrackingCalls.set(Qs(e.experiment, e.result), e)
        }
        _getContextUrl() {
            return this._options.url || ($s ? window.location.href : ``)
        }
        _isAutoExperimentBlockedByContext(e) {
            let t = Ka(e);
            if (t === `visual`) {
                if (this._options.disableVisualExperiments || this._options.disableJsInjection && e.variations.some(e => e.js)) return !0
            } else if (t === `redirect`) {
                if (this._options.disableUrlRedirectExperiments) return !0;
                try {
                    let t = new URL(this._getContextUrl());
                    for (let n of e.variations) {
                        if (!n || !n.urlRedirect) continue;
                        let e = new URL(n.urlRedirect);
                        if (this._options.disableCrossOriginUrlRedirectExperiments && (e.protocol !== t.protocol || e.host !== t.host)) return !0
                    }
                } catch (t) {
                    return this.log(`Error parsing current or redirect URL`, {
                        id: e.key,
                        error: t
                    }), !0
                }
            } else return !0;
            return !!(e.changeId && (this._options.blockedChangeIds || []).includes(e.changeId))
        }
        getRedirectUrl() {
            return this._redirectedUrl
        }
        _getNavigateFunction() {
            return this._options.navigate ? {
                navigate: this._options.navigate,
                delay: 0
            } : $s ? {
                navigate: e => {
                    window.location.replace(e)
                },
                delay: 100
            } : {
                navigate: null,
                delay: 0
            }
        }
        _applyDOMChanges(e) {
            if (!$s) return;
            let t = [];
            if (e.css) {
                let n = document.createElement(`style`);
                n.innerHTML = e.css, document.head.appendChild(n), t.push(() => n.remove())
            }
            if (e.js) {
                let n = document.createElement(`script`);
                n.innerHTML = e.js, this._options.jsInjectionNonce && (n.nonce = this._options.jsInjectionNonce), document.head.appendChild(n), t.push(() => n.remove())
            }
            return e.domMutations && e.domMutations.forEach(e => {
                t.push(ls.declarative(e).revert)
            }), () => {
                t.forEach(e => e())
            }
        }
        async refreshStickyBuckets(e) {
            if (this._options.stickyBucketService) {
                let t = await Js(this._getEvalContext(), this._options.stickyBucketService, e);
                this._options.stickyBucketAssignmentDocs = t
            }
        }
        generateStickyBucketAssignmentDocsSync(e, t) {
            if (!(`getAllAssignmentsSync` in e)) return;
            let n = Ys(this._getEvalContext(), t);
            return e.getAllAssignmentsSync(n)
        }
        inDevMode() {
            return !!this._options.enableDevMode
        }
    };

function nc() {
    return nc = Object.assign ? Object.assign.bind() : function(e) {
        for (var t = 1; t < arguments.length; t++) {
            var n = arguments[t];
            for (var r in n)({}).hasOwnProperty.call(n, r) && (e[r] = n[r])
        }
        return e
    }, nc.apply(null, arguments)
}
var rc = T.createContext({});

function ic(e) {
    return ac().evalFeature(e)
}

function ac() {
    let {
        growthbook: e
    } = T.useContext(rc);
    if (!e) throw Error(`Missing or invalid GrowthBookProvider`);
    return e
}
var oc = e => t => T.createElement(rc.Consumer, null, ({
    growthbook: n
}) => T.createElement(e, nc({}, t, {
    runExperiment: e => n.run(e)
})));
oc.displayName = `WithRunExperiment`;
var sc = ({
        children: e,
        growthbook: t
    }) => {
        let [n, r] = T.useState(0);
        return T.useEffect(() => {
            if (!(!t || !t.setRenderer)) return t.setRenderer(() => {
                r(e => e + 1)
            }), () => {
                t.setRenderer(() => {})
            }
        }, [t]), T.createElement(rc.Provider, {
            value: {
                growthbook: t
            }
        }, e)
    },
    z = !1;

function cc(e) {
    z = e
}

function lc() {
    return z
}
var uc = !1;

function dc(e) {
    uc = e
}

function fc() {
    return uc
}
var pc = !1;

function mc(e) {
    pc = e
}

function hc() {
    return pc
}
var gc = `off`;

function _c(e) {
    return e === `on` || e === `no_create` ? e : `off`
}

function vc(e) {
    gc = _c(e)
}

function yc() {
    return gc !== `off`
}

function bc() {
    return gc === `on`
}
var xc = !1;

function Sc(e) {
    xc = e
}

function Cc() {
    return xc
}
var wc = !1;

function Tc(e) {
    wc = e
}

function Ec() {
    return wc
}
var Dc = !1;

function Oc(e) {
    Dc = e
}

function kc() {
    return Dc
}
var Ac = !1;

function jc(e) {
    Ac = e
}

function Mc() {
    return Ac
}
var Nc = !1;

function Pc(e) {
    Nc = e
}

function Fc() {
    return Nc
}
var Ic = !1;

function Lc(e) {
    Ic = e
}

function Rc() {
    return Ic
}
var zc = !1;

function Bc(e) {
    zc = e
}

function Vc() {
    return zc
}
var B = !1;

function Hc(e) {
    B = e
}

function Uc() {
    return B
}
var Wc = !1;

function Gc(e) {
    Wc = e
}

function Kc() {
    return Wc
}
var qc = !1;

function Jc(e) {
    qc = e
}

function Yc() {
    return qc
}
var Xc = !1;

function Zc(e) {
    Xc = e
}

function Qc() {
    return Xc
}
var $c = ``;

function el(e) {
    $c = typeof e == `string` ? e : ``
}

function tl() {
    return $c
}
var nl = {
    adaptiveEffort: {
        flag: `__gb__3259014779`,
        field: `value`
    },
    dataStorySkillEnabled: {
        flag: `__gb__3299559052`
    },
    dcHelmetClassesEnabled: {
        flag: `__gb__2295492666`
    },
    docPageStarterEnabled: {
        flag: `__gb__3657086880`
    },
    doneEndsTurnEnabled: {
        flag: `__gb__737652865`
    },
    dsContentLatchEnabled: {
        flag: `__gb__2339954792`
    },
    dsLazyAssetsEnabled: {
        flag: `__gb__3885738648`
    },
    dsThumbnailEnabled: {
        flag: `__gb__1649941334`
    },
    experimentSkillEnabled: {
        flag: `__gb__2350294185`
    },
    figmaMcpEnabled: {
        flag: `__gb__2420051580`
    },
    followUpsEnabled: {
        flag: `__gb__3123903501`
    },
    julienneEnabled: {
        flag: `__gb__617433922`
    },
    legacyTemplatesMode: {
        flag: `__gb__2469959517`,
        field: `value`
    },
    metricsSkillEnabled: {
        flag: `__gb__2898290939`
    },
    persistApiTranscriptEnabled: {
        flag: `__gb__1151484512`
    },
    productResearchSkillEnabled: {
        flag: `__gb__717940119`
    },
    sendToGenericEnabled: {
        flag: `__gb__683719888`
    },
    systemPromptAppend: {
        flag: `__gb__1396658271`,
        field: `value`
    },
    tweaksSuggestionBarEnabled: {
        flag: `__gb__657312184`
    },
    userSkillsEnabled: {
        flag: `__gb__2408657372`
    }
};

function rl(e) {
    if (e.startsWith(`__gb__`)) return e.slice(6);
    let t = 0;
    for (let n = 0; n < e.length; n++) t = (t << 5) - t + e.charCodeAt(n), t &= t;
    return ((t & 4294967295) >>> 0).toString()
}
var il = {
    [rl(`__gb__2420051580`)]: !1,
    [rl(`__gb__1964418062`)]: !0
};

function V(e) {
    let t = rl(e),
        n = ic(t);
    if (n.source === `unknownFeature` && t in il) {
        let e = il[t];
        return { ...n,
            value: e,
            on: !!e,
            off: !e,
            source: `defaultValue`
        }
    }
    return n
}

function al() {
    return ae() === `viewer`
}

function ol() {
    let e = V(`__gb__3803514950`).on,
        t = al();
    return {
        planGated: e,
        createDisabled: t,
        gated: e || t
    }
}

function sl() {
    return _c(V(`__gb__2469959517`).value)
}

function cl() {
    return sl() !== `off`
}

function ll() {
    return V(`__gb__2374642242`).on
}
var ul = `__gb__83837317`;

function H() {
    return V(ul).on
}

function dl() {
    return sl() === `on`
}
var fl = `Temporarily unavailable`,
    pl = {
        "claude.ai": `rwppv331jlwc`,
        "Claude Code": `yyzkbfz2thpt`,
        Cowork: `bpp5gb3hpjcl`
    },
    ml = `https://status.claude.com/api/v2/summary.json`,
    hl = 6e4,
    gl = {
        severity: `warning`,
        message: `Anthropic services may be degraded. Check`,
        linkText: `status.claude.com`,
        linkHref: `https://status.claude.com/`,
        linkTrailing: `for updates.`
    };

function _l(e) {
    let t = new Map((e.components ? ? []).map(e => [e.id, e.status]));
    return Object.values(pl).every(e => {
        let n = t.get(e);
        return typeof n == `string` && n !== `operational`
    })
}
var vl = 0,
    yl = new Set;

function bl(e) {
    vl = Math.max(0, vl + (e ? 1 : -1));
    for (let e of yl) e()
}

function xl(e) {
    return yl.add(e), () => {
        yl.delete(e)
    }
}
var Sl = () => vl > 0;

function Cl() {
    let e = (0, T.useSyncExternalStore)(xl, Sl, () => !1),
        [t, n] = (0, T.useState)(!1),
        r = e && !0,
        i = () => {
            fetch(ml, {
                cache: `no-store`
            }).then(e => e.ok ? e.json() : Promise.reject(Error(String(e.status)))).then(e => n(_l(e))).catch(() => {})
        };
    return (0, T.useEffect)(() => {
        r && i()
    }, [r]), l(i, r ? hl : null), r && t ? gl : null
}
var wl = {
    info: {
        bg: ya(j.accent.secondary, .12),
        fg: j.accent.secondaryActive,
        icon: `Info`
    },
    warning: {
        bg: ya(j.accent.primary, .14),
        fg: j.accent.primaryActive,
        icon: `Warning`
    },
    critical: {
        bg: ya(j.accent.error, .12),
        fg: j.accent.error,
        icon: `Warning`
    }
};

function Tl({
    severity: e = `info`,
    onDismiss: t,
    children: n,
    testid: r
}) {
    let i = wl[e];
    return (0, k.jsxs)(`div`, {
        className: `relative flex items-center justify-center gap-2 py-2 px-10 text-[13px] font-medium leading-[1.4] border-b`,
        style: {
            background: i.bg,
            color: i.fg,
            borderBottomColor: ya(i.fg, .2)
        },
        role: `status`,
        "data-testid": r,
        children: [(0, k.jsx)(Sa, {
            name: i.icon,
            size: 15
        }), (0, k.jsx)(`span`, {
            className: `min-w-0`,
            children: n
        }), t && (0, k.jsx)(`div`, {
            className: `absolute right-2 top-1/2 -translate-y-1/2`,
            children: (0, k.jsx)(aa, {
                icon: `X`,
                size: 22,
                title: `Dismiss`,
                style: {
                    color: `inherit`
                },
                onClick: t
            })
        })]
    })
}

function El() {
    let e = V(`__gb__1512845023`).value,
        t = Cl(),
        [n, r] = h(`omelette-incident-banner-dismissed`, ``),
        i = e && typeof e == `object` && typeof e.message == `string` && e.message.trim() ? e : t;
    if (!i || typeof i != `object`) return null;
    let {
        message: a,
        severity: o,
        linkText: s,
        linkHref: c,
        linkTrailing: l
    } = i;
    if (typeof a != `string` || !a.trim() || n === a) return null;
    let u = typeof o == `string` && o in wl ? o : `warning`,
        d = typeof c == `string` && /^https?:\/\//i.test(c) ? c : void 0,
        f = typeof s == `string` ? s : void 0,
        p = typeof l == `string` ? l : void 0;
    return (0, k.jsxs)(Tl, {
        severity: u,
        testid: `incident-banner`,
        onDismiss: () => r(a),
        children: [a, d && (0, k.jsxs)(k.Fragment, {
            children: [` `, (0, k.jsx)(`a`, {
                href: d,
                target: `_blank`,
                rel: `noopener noreferrer`,
                className: `text-inherit font-semibold underline cursor-pointer whitespace-nowrap`,
                children: f || `Learn more`
            })]
        }), p && (0, k.jsxs)(k.Fragment, {
            children: [` `, p]
        })]
    })
}
var Dl = `om:theme`,
    Ol = `om:dark-mode-enabled`,
    kl = (0, T.createContext)(null);

function Al({
    children: e
}) {
    let t = V(`__gb__505682162`).on,
        n = oe() !== null,
        [r] = (0, T.useState)(() => {
            try {
                return localStorage.getItem(Ol) === `1`
            } catch {
                return !1
            }
        }),
        i = n ? t : r,
        [o, s] = a(Dl, `system`),
        c = p(`(prefers-color-scheme: dark)`),
        l = i ? o === `system` ? c ? `dark` : `light` : o : `light`;
    return (0, T.useEffect)(() => {
        document.documentElement.style.removeProperty(`background`)
    }, []), (0, T.useEffect)(() => {
        let e = document.documentElement;
        e.setAttribute(`data-theme-switching`, ``), e.dataset.theme = l;
        let r = 0,
            i = requestAnimationFrame(() => {
                r = requestAnimationFrame(() => {
                    e.removeAttribute(`data-theme-switching`)
                })
            });
        if (n) try {
            localStorage.setItem(Ol, t ? `1` : `0`)
        } catch {}
        return () => {
            cancelAnimationFrame(i), cancelAnimationFrame(r), e.removeAttribute(`data-theme-switching`)
        }
    }, [l, t, n]), (0, k.jsx)(kl.Provider, {
        value: {
            theme: o,
            setTheme: s,
            resolved: l,
            enabled: i
        },
        children: e
    })
}

function jl() {
    return (0, T.useContext)(kl) ? ? {
        theme: `light`,
        setTheme: () => {},
        resolved: `light`,
        enabled: !1
    }
}
var Ml = `Claude Design`,
    Nl = `__gb__3290303989`;

function Pl() {
    return V(Nl).value || `Claude Design`
}
var Fl = `/upgrade?feature=design`;

function Il() {
    let e = ae(),
        t = Pl();
    return e === `viewer` ? (0, k.jsxs)(`div`, {
        role: `status`,
        "data-testid": `viewer-mode-banner`,
        className: `flex items-center justify-center gap-2 py-2 px-4 text-[13px] font-medium leading-[1.4] text-om-accent-secondary-active border-b`,
        style: {
            background: ya(j.accent.secondary, .12),
            borderBottomColor: ya(j.accent.secondaryActive, .2)
        },
        children: [(0, k.jsx)(Sa, {
            name: `Info`,
            size: 15
        }), (0, k.jsxs)(`span`, {
            className: `min-w-0`,
            children: [`Your subscription has ended, so `, t, ` is in view-only mode. You can still open and download your existing projects.`]
        }), (0, k.jsx)(`a`, {
            href: Fl,
            className: `text-inherit font-semibold underline cursor-pointer whitespace-nowrap`,
            children: `Resubscribe`
        })]
    }) : null
}

function Ll(e = 2e3) {
    let [t, n] = (0, T.useState)(!1), r = (0, T.useRef)(void 0);
    return (0, T.useEffect)(() => () => clearTimeout(r.current), []), {
        copied: t,
        copy: (0, T.useCallback)(async t => {
            try {
                await navigator.clipboard.writeText(t)
            } catch {
                return !1
            }
            return clearTimeout(r.current), n(!0), r.current = setTimeout(() => n(!1), e), !0
        }, [e]),
        reset: (0, T.useCallback)(() => {
            clearTimeout(r.current), n(!1)
        }, [])
    }
}
var Rl = (0, T.createContext)(null);

function zl() {
    let e = (0, T.useContext)(Rl);
    if (!e) throw Error(`useToast must be used within a ToastProvider`);
    return e
}
var Bl = {
        error: `border-[color-mix(in_srgb,var(--om-accent-error)_40%,var(--om-border-default))] bg-[color-mix(in_srgb,var(--om-accent-error)_8%,var(--om-bg-surface))]`,
        success: `border-[color-mix(in_srgb,var(--om-accent-success)_40%,var(--om-border-default))] bg-[color-mix(in_srgb,var(--om-accent-success)_8%,var(--om-bg-surface))]`,
        warning: `border-[color-mix(in_srgb,var(--om-accent-warning)_40%,var(--om-border-default))] bg-[color-mix(in_srgb,var(--om-accent-warning)_8%,var(--om-bg-surface))]`,
        info: ``
    },
    Vl = {
        error: `text-om-accent-error`,
        success: `text-om-accent-success`,
        warning: `text-om-accent-warning`,
        info: `text-om-accent-blue`
    };

function U(e) {
    switch (e) {
        case `error`:
            return `Prohibit`;
        case `success`:
            return `CheckCircle`;
        case `warning`:
            return `Warning`;
        default:
            return `Info`
    }
}

function W({
    toast: e,
    onClose: t
}) {
    let [n, r] = (0, T.useState)(!1), {
        copied: i,
        copy: a
    } = Ll(1500), o = (0, T.useRef)(void 0), s = (0, T.useRef)(t);
    s.current = t;
    let c = (0, T.useCallback)(() => {
        r(!0), clearTimeout(o.current), o.current = setTimeout(() => s.current(), 200)
    }, []);
    (0, T.useEffect)(() => {
        if (e.duration && e.duration > 0) {
            let t = setTimeout(c, e.duration);
            return () => clearTimeout(t)
        }
    }, [e.duration, c]), (0, T.useEffect)(() => () => clearTimeout(o.current), []);
    let l = () => void a(typeof e.message == `string` ? e.message : ``),
        u = !!e.title;
    return (0, k.jsxs)(`div`, {
        className: ue(`flex items-start gap-2.5 py-3 px-4 bg-om-bg-surface border border-om-border-default rounded-lg shadow-om-lg max-w-[min(440px,calc(100vw-32px))] pointer-events-auto`, n ? `om-toast-sink-out` : `om-toast-rise-in`, Bl[e.type]),
        children: [(0, k.jsx)(`div`, {
            className: ue(`shrink-0 w-[18px] h-[18px] flex items-center justify-center opacity-70`, Vl[e.type]),
            children: (0, k.jsx)(Xi, {
                name: U(e.type),
                size: 16,
                bold: !0
            })
        }), (0, k.jsxs)(`div`, {
            className: `flex-1 min-w-0`,
            children: [u && (0, k.jsx)(`div`, {
                className: `text-[13px] font-semibold leading-[1.3] text-om-text-primary mb-0.5`,
                children: e.title
            }), (0, k.jsx)(`div`, {
                className: ue(`leading-[1.4] select-text cursor-text [&_a]:text-om-accent-blue [&_a]:underline [&_a]:cursor-pointer [&_a:hover]:opacity-80`, u ? `text-xs text-om-text-secondary` : `text-[13px] text-om-text-primary`),
                children: e.message
            }), e.action && (0, k.jsx)(`div`, {
                className: `flex gap-1.5 mt-2`,
                children: (0, k.jsx)(na, {
                    size: `xs`,
                    onClick: e.action.onClick,
                    children: e.action.label
                })
            })]
        }), e.type === `error` && e.copyable !== !1 && (0, k.jsx)(`button`, {
            onClick: l,
            title: `Copy error message`,
            className: `shrink-0 w-[18px] h-[18px] flex items-center justify-center bg-transparent p-0 cursor-pointer text-om-text-tertiary rounded-[4px] hover:bg-om-bg-hover hover:text-om-text-secondary`,
            children: (0, k.jsx)(Xi, {
                name: i ? `Check` : `Copy`,
                size: 12
            })
        }), (0, k.jsx)(aa, {
            icon: `X`,
            size: 20,
            iconSize: 11,
            onClick: c,
            title: `Dismiss`
        })]
    })
}

function G({
    children: e
}) {
    let [t, n] = (0, T.useState)([]), r = (0, T.useRef)(new Map), i = (0, T.useCallback)((e, t = `info`, i = 5e3, a) => {
        let o = crypto.randomUUID(),
            {
                onDismiss: s,
                ...c
            } = a ? ? {};
        return s && r.current.set(o, s), n(n => [...n, {
            id: o,
            message: e,
            type: t,
            duration: i,
            ...c
        }]), o
    }, []), a = (0, T.useCallback)((e, t) => {
        n(n => n.map(n => n.id === e ? { ...n,
            message: t
        } : n))
    }, []), o = (0, T.useCallback)(e => {
        n(t => t.filter(t => t.id !== e));
        let t = r.current.get(e);
        t && (r.current.delete(e), t())
    }, []), s = (0, T.useMemo)(() => ({
        showToast: i,
        updateToast: a,
        hideToast: o
    }), [i, a, o]);
    return (0, k.jsxs)(Rl.Provider, {
        value: s,
        children: [e, (0, k.jsx)(`div`, {
            className: `fixed bottom-5 left-1/2 -translate-x-1/2 z-om-toast flex flex-col items-center gap-2 pointer-events-none`,
            children: t.map(e => (0, k.jsx)(W, {
                toast: e,
                onClose: () => o(e.id)
            }, e.id))
        })]
    })
}
var K = `claude_web`,
    q = (0, T.createContext)(null);

function Hl({
    host: e,
    useGlobalDisabled: t,
    placementRegistry: n,
    platform: r = K,
    defaultAllowedPaths: i,
    children: a
}) {
    let o = (0, T.useMemo)(() => ({
        host: e,
        useGlobalDisabled: t,
        placementRegistry: n,
        platform: r,
        defaultAllowedPaths: i
    }), [e, t, n, r, i]);
    return (0, k.jsx)(q.Provider, {
        value: o,
        children: a
    })
}

function Ul() {
    return (0, T.useContext)(q)
}
var Wl = {
    usePathname: () => `/`,
    useLocale: () => `en`,
    useAccount: () => ({
        orgUuid: void 0,
        isEnterprise: !1
    }),
    useFeatureGate: () => !1,
    useDynamicConfig: (e, t) => t,
    apiClient: {
        fetchExperiences: () => Promise.reject(Error(`experience-framework: no host wired`)),
        trackExperience: () => Promise.resolve({
            success: !1
        })
    }
};

function Gl() {
    let e = Ul();
    return e ? e.host : Wl
}
var Kl = () => !1;

function J() {
    return Ul() ? .useGlobalDisabled ? ? Kl
}

function ql() {
    return Ul() ? .defaultAllowedPaths
}

function Jl() {
    return Ul() ? .platform ? ? K
}

function Yl() {
    return Gl().isPubSecBuild ? ? !1
}
var Xl = {
        resolvedMode: `light`,
        mounted: !0
    },
    Zl = () => Xl;

function Ql() {
    return Gl().useTheme ? ? Zl
}
var $l = () => null;

function eu() {
    return Gl().useNuxCoordination ? ? $l
}
var tu = e => e.defaultMessage,
    nu = () => tu;

function ru() {
    return Gl().useFormatMessage ? ? nu
}
var iu = class extends T.Component {
    constructor() {
        super(...arguments), this.state = {
            failed: !1
        }
    }
    static getDerivedStateFromError() {
        return {
            failed: !0
        }
    }
    componentDidCatch(e, t) {}
    render() {
        return this.state.failed ? null : this.props.children
    }
};

function au(e, t) {
    let n = (0, T.lazy)(() => e().then(e => ({
        default: e[t]
    })));

    function r(e) {
        return (0, k.jsx)(iu, {
            name: t,
            children: (0, k.jsx)(T.Suspense, {
                fallback: null,
                children: (0, k.jsx)(n, { ...e
                })
            })
        })
    }
    return r.displayName = `LazyPlacement(${t})`, r
}
var Y = new Map,
    ou = () => ({
        global: {
            rate_limit: null,
            cooldown: null
        },
        placements: {},
        tiers: {}
    });

function su(e) {
    return {
        rate_limit: e.rateLimit ? {
            remaining: e.rateLimit.remaining,
            reset_at: new Date(Number(e.rateLimit.resetsAt) * 1e3).toISOString()
        } : null,
        cooldown: e.cooldown ? {
            seconds: e.cooldown.seconds
        } : null
    }
}

function cu(e) {
    let t = {};
    for (let [n, r] of Object.entries(e)) t[n] = su(r);
    return t
}

function lu(e) {
    let t = null;
    if (e.contentJson) try {
        let n = JSON.parse(e.contentJson);
        typeof n == `object` && n && !Array.isArray(n) ? t = n : s(`design.experience_framework.content_not_object`, {
            attrs: {
                experience_id: e.id
            }
        })
    } catch {
        s(`design.experience_framework.parse_error`, {
            attrs: {
                experience_id: e.id,
                len: e.contentJson.length
            }
        })
    }
    return {
        id: e.id,
        key: e.key,
        content: t,
        config: e.allowedPaths.length > 0 ? {
            platform: {
                allowed_paths: e.allowedPaths
            }
        } : null,
        placement_key: e.placementKey,
        template_key: e.templateKey ? ? null,
        enabled: e.enabled,
        tier: e.tier ? ? null
    }
}
var uu = {
        fetchExperiences: async (e, t, r) => {
            let {
                getOmeletteClient: i
            } = await b(() => n(() =>
                import (`./client-BkAIwXnN.js`).then(e => e.n), __vite__mapDeps([0, 1, 2, 3, 4, 5]))) ? ? await y, a = await i().listExperiences({});
            for (let e of a.experiences)(e.variantKey !== void 0 || e.expId !== void 0) && Y.set(e.id, {
                variantKey: e.variantKey,
                expId: e.expId
            });
            return {
                experiences: a.experiences.map(lu),
                rules: a.rules ? {
                    global: a.rules.global ? su(a.rules.global) : {
                        rate_limit: null,
                        cooldown: null
                    },
                    placements: cu(a.rules.placements),
                    tiers: cu(a.rules.tiers)
                } : ou()
            }
        },
        executeExperienceAction: async (e, t) => {
            let {
                getOmeletteClient: r
            } = await b(() => n(() =>
                import (`./client-BkAIwXnN.js`).then(e => e.n), __vite__mapDeps([0, 1, 2, 3, 4, 5]))) ? ? await y, i = await r().executeExperienceAction({
                experienceId: t.experience_id,
                actionId: t.action_id,
                paramsJson: t.params === void 0 ? void 0 : JSON.stringify(t.params)
            }), a = [];
            if (i.actionsJson) try {
                let e = JSON.parse(i.actionsJson);
                Array.isArray(e) ? (a = e.filter(e => typeof e == `object` && !!e && typeof e.type == `string`), a.length !== e.length && s(`design.experience_framework.client_action_dropped`, {
                    attrs: {
                        action_id: t.action_id
                    }
                })) : s(`design.experience_framework.action_response_not_array`, {
                    attrs: {
                        action_id: t.action_id
                    }
                })
            } catch {
                s(`design.experience_framework.action_response_parse_error`, {
                    attrs: {
                        action_id: t.action_id
                    }
                })
            }
            return {
                actions: a
            }
        },
        trackExperience: async (e, t) => {
            let r = Y.get(t.experience_uuid),
                i = t.metadata !== void 0 || r ? .expId !== void 0 ? { ...t.metadata ? ? {},
                    ...r ? .expId === void 0 ? {} : {
                        exp_id: r.expId
                    }
                } : void 0,
                {
                    getOmeletteClient: a
                } = await b(() => n(() =>
                    import (`./client-BkAIwXnN.js`).then(e => e.n), __vite__mapDeps([0, 1, 2, 3, 4, 5]))) ? ? await y;
            return {
                success: (await a().trackExperience({
                    experienceId: t.experience_uuid,
                    action: t.action,
                    variantKey: r ? .variantKey,
                    metadataJson: i === void 0 ? void 0 : JSON.stringify(i)
                })).success
            }
        }
    },
    du = () => D().pathname,
    fu = () => `en`,
    pu = () => {
        let e = _(),
            t = e.ready && !e.isImpersonating ? e.orgId : void 0;
        return (0, T.useMemo)(() => ({
            orgUuid: t,
            isEnterprise: !1
        }), [t])
    },
    mu = e => V(e).on;

function hu(e, t, n) {
    let {
        value: r
    } = V(e);
    return (0, T.useMemo)(() => {
        if (r == null) return t;
        let e = n.safeParse(r);
        return e.success ? e.data : t
    }, [r, t, n])
}
var gu = {
        usePathname: du,
        useLocale: fu,
        useAccount: pu,
        useFeatureGate: mu,
        useDynamicConfig: hu,
        apiClient: uu,
        isPubSecBuild: !1,
        loadShed: !1
    },
    _u = {
        "design-spotlight": (0, T.lazy)(() => b(() => n(() =>
            import (`./DesignSpotlight-DgbyBcYz.js`), __vite__mapDeps([6, 1, 2, 3, 4, 0, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]))).then(e => e ? {
            default: e.DesignSpotlightPlacement
        } : y)),
        "design-guest-pass-home": (0, T.lazy)(() => b(() => n(() =>
            import (`./GuestPassChin-bkx5OMvw.js`), __vite__mapDeps([27, 1, 2, 3, 4, 28, 0, 5, 24, 17, 26, 14, 8, 9, 10, 11, 12, 13, 15, 16, 18, 23, 25]))).then(e => e ? {
            default: e.GuestPassChinPlacement
        } : y)),
        "design-chat-tooltip": (0, T.lazy)(() => b(() => n(() =>
            import (`./DesignChatTooltip-BBKw8FP0.js`), __vite__mapDeps([29, 1, 2, 3, 4, 0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]))).then(e => e ? {
            default: e.DesignChatTooltipPlacement
        } : y)),
        "design-intro-video": (0, T.lazy)(() => b(() => n(() =>
            import (`./IntroVideo-DVMP6uWs.js`), __vite__mapDeps([30, 1, 31, 8, 3, 2, 4, 0, 5, 9, 10, 11, 12, 13, 14, 32, 16, 17, 33, 34, 23, 24, 25, 26, 35]))).then(e => e ? {
            default: e.IntroVideoPlacement
        } : y))
    },
    vu = `__gb__1819818117`,
    yu = [`/*`];

function bu({
    children: e
}) {
    return V(vu).on ? (0, k.jsx)(Hl, {
        host: gu,
        platform: `claude_design`,
        placementRegistry: _u,
        defaultAllowedPaths: yu,
        children: e
    }) : (0, k.jsx)(k.Fragment, {
        children: e
    })
}
var xu = au(() => b(() => n(() =>
    import (`./DesignSpotlight-DgbyBcYz.js`), __vite__mapDeps([6, 1, 2, 3, 4, 0, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]))).then(e => e ? ? y), `DesignSpotlightPlacement`);

function Su() {
    return V(vu).on ? (0, k.jsx)(xu, {}) : null
}
var Cu = au(() => b(() => n(() =>
    import (`./GuestPassChin-bkx5OMvw.js`), __vite__mapDeps([27, 1, 2, 3, 4, 28, 0, 5, 24, 17, 26, 14, 8, 9, 10, 11, 12, 13, 15, 16, 18, 23, 25]))).then(e => e ? ? y), `GuestPassChinPlacement`);

function wu() {
    return V(vu).on ? (0, k.jsx)(Cu, {}) : null
}
var Tu = au(() => b(() => n(() =>
    import (`./DesignChatTooltip-BBKw8FP0.js`), __vite__mapDeps([29, 1, 2, 3, 4, 0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]))).then(e => e ? ? y), `DesignChatTooltipPlacement`);

function Eu() {
    return V(vu).on ? (0, k.jsx)(Tu, {}) : null
}
var Du = au(() => b(() => n(() =>
    import (`./IntroVideo-DVMP6uWs.js`), __vite__mapDeps([30, 1, 31, 8, 3, 2, 4, 0, 5, 9, 10, 11, 12, 13, 14, 32, 16, 17, 33, 34, 23, 24, 25, 26, 35]))).then(e => e ? ? y), `IntroVideoPlacement`);

function Ou(e) {
    return V(vu).on ? (0, k.jsx)(Du, { ...e
    }) : null
}
var ku = class extends T.Component {
    hasCaptured = !1;
    constructor(e) {
        super(e), this.state = {
            error: null
        }
    }
    static getDerivedStateFromError(e) {
        return {
            error: e
        }
    }
    componentDidUpdate(e) {
        if (this.state.error === null) return;
        let t = e.resetKeys,
            n = this.props.resetKeys;
        t === void 0 && n === void 0 || ((t ? .length ? ? 0) !== (n ? .length ? ? 0) || (n ? ? []).some((e, n) => !Object.is(e, t ? .[n]))) && this.setState({
            error: null
        })
    }
    componentDidCatch(e, t) {
        this.hasCaptured || (this.hasCaptured = !0, this.props.onCatch ? .(e), r.addError(e, {
            source: `render_error_boundary`,
            component: this.props.componentName,
            ...this.props.tags,
            url: typeof window < `u` ? window.location.pathname : ``,
            componentStack: t.componentStack
        }))
    }
    reset = () => {
        this.setState({
            error: null
        })
    };
    render() {
        if (this.state.error) {
            let {
                fallback: e
            } = this.props;
            return typeof e == `function` ? e(this.state.error, this.reset) : e
        }
        return this.props.children
    }
};

function Au() {
    let e = V(`__gb__3049740115`),
        {
            showToast: t
        } = zl(),
        r = al(),
        i = (0, T.useRef)(e.value);
    i.current = e.value;
    let a = (0, T.useRef)(r);
    return a.current = r, (0, T.useEffect)(() => {
        if (!e.on) return;
        let r, o = !1;
        return n(() =>
            import (`./completion-CK5lepEv.js`).then(e => e.t).then(e => {
                o || e.isDismissed() || (r = e.subscribeCompletions({
                    flagValue: () => i.current,
                    createDisabled: () => a.current,
                    dismissed: () => e.isDismissed(),
                    showToast: t
                }))
            }), __vite__mapDeps([36, 1, 37, 11, 38])), () => {
            o = !0, r ? .()
        }
    }, [e.on, t]), null
}
var ju = `omelette_auth_redirect_reload_at`,
    Mu = new Map,
    Nu = !1;

function Pu(e) {
    let t = e ? ? `window`,
        n = Date.now();
    n - (Mu.get(t) ? ? 0) < 3e4 || (Mu.set(t, n), s(`design.auth_redirect_reload_guarded`, {
        attrs: {
            phase: Nu ? `burst` : `wedged`,
            ...e && {
                reason: e
            }
        }
    }))
}

function Fu() {
    if (c()) {
        Pu(`unload-guard`);
        return
    }
    let e = 0;
    try {
        e = Number(sessionStorage.getItem(ju) ? ? 0)
    } catch {}
    if (Date.now() - e < 3e4) {
        Pu();
        return
    }
    try {
        sessionStorage.setItem(ju, String(Date.now()))
    } catch {
        Pu(`setItem`);
        return
    }
    Nu = !0, s(`design.auth_redirect_reload`), window.location.reload()
}

function Iu() {
    u(`auth-expired`, Fu)
}
var Lu = !1;

function Ru(e) {
    Lu = e
}

function zu() {
    return Lu
}
var Bu = !1;

function Vu(e) {
    Bu = e
}

function Hu() {
    return Bu
}

function Uu(e) {
    return e.quotaStatus === `rejected` && !e.isUsingOverage
}

function Wu(e) {
    return !e.isUsingOverage && !e.unifiedRateLimitFallbackAvailable && e.overageHeaderStatus !== `allowed` && e.overageHeaderStatus !== `allowed_warning` && e.rateLimitType !== `overage` && (e.utilization ? ? 0) >= .95
}
var Gu = new Set([`upgrade_plan`, `overage`]),
    X = {
        five_hour: `session limit`,
        seven_day: `weekly limit`,
        seven_day_omelette: `Claude Design weekly limit`,
        seven_day_opus: `Opus limit`,
        seven_day_sonnet: `Sonnet limit`,
        seven_day_overage_included: `weekly limit`,
        omelette_promotional: `included Claude Design usage`,
        overage: `usage credits limit`
    },
    Ku;

function qu(e) {
    Ku = e
}

function Ju(e) {
    return e === `seven_day_overage_included` && Ku ? `${Ku.replace(/^Claude\s+/,``)} weekly limit` : e && X[e] || `usage limit`
}

function Yu(e) {
    return e === `omelette_promotional`
}

function Xu(e) {
    return e === `seven_day_omelette` || e === `omelette_promotional`
}

function Zu(e) {
    return e === `five_hour` || e === `seven_day` || e === `seven_day_opus` || e === `seven_day_sonnet` || e === `seven_day_overage_included`
}

function Qu(e) {
    return e === `org_level_disabled_until` || e === `org_spend_cap_reached`
}
var $u = {
        "5h": `five_hour`,
        "7d_opus": `seven_day_opus`,
        "7d_sonnet": `seven_day_sonnet`,
        "7d_oi": `seven_day_overage_included`,
        "7d_om": `seven_day_omelette`,
        omelette_promotional: `omelette_promotional`,
        "7d": `seven_day`,
        overage: `overage`
    },
    Z = {
        quotaStatus: `allowed`,
        unifiedRateLimitFallbackAvailable: !1,
        isUsingOverage: !1
    },
    ed = new Set;

function td(e) {
    return ed.add(e), () => ed.delete(e)
}

function nd(e) {
    Z = e, ad(e), ed.forEach(t => t(e))
}
var rd = new Set([`seven_day_omelette`, `omelette_promotional`, `five_hour`, `seven_day`, void 0]),
    id;

function ad(e, t = 0) {
    if (id !== void 0 && (clearTimeout(id), id = void 0), e.quotaStatus !== `rejected` || e.creditsRequired || Yu(e.rateLimitType) || !rd.has(e.rateLimitType)) return;
    let n = e.resetsAt ? e.resetsAt * 1e3 - Date.now() : 0,
        r = Math.max(n, t);
    r <= 0 || r > 2147483647 || (id = setTimeout(() => {
        id = void 0, gd ? vd().finally(() => {
            id === void 0 && ad(Z, 3e4)
        }) : Z.quotaStatus === `rejected` && nd({ ...Z,
            quotaStatus: `allowed`,
            isUsingOverage: !1
        })
    }, r))
}

function od(e) {
    let t = {};
    for (let [n, r] of Object.entries(e)) t[n.toLowerCase()] = r;
    return t
}

function sd(e) {
    let t = e[`anthropic-ratelimit-unified-overage-status`],
        n = e[`anthropic-ratelimit-unified-overage-disabled-reason`],
        r = e[`anthropic-ratelimit-unified-overage-reset`],
        i = e[`anthropic-ratelimit-unified-upgrade-paths`] ? .split(`,`).filter(e => Gu.has(e)),
        a = e[`anthropic-ratelimit-unified-credits-can-purchase`],
        o = e[`anthropic-ratelimit-unified-credits-has-payment-method`],
        s = a !== void 0 && o !== void 0 ? {
            canUserPurchaseCredits: a === `true`,
            hasChargeableSavedPaymentMethod: o === `true`
        } : void 0;
    return { ...t && {
            overageHeaderStatus: t
        },
        ...n && {
            overageDisabledReason: n
        },
        ...r && {
            overageResetsAt: Number(r)
        },
        ...i && i.length > 0 && {
            upgradePaths: i
        },
        ...s && {
            creditsRequired: s
        }
    }
}

function cd(e, t) {
    for (let [n, r] of Object.entries($u)) {
        let i = e[`anthropic-ratelimit-unified-${n}-surpassed-threshold`];
        if (i !== void 0) {
            let a = e[`anthropic-ratelimit-unified-${n}-utilization`],
                o = e[`anthropic-ratelimit-unified-${n}-reset`];
            return {
                quotaStatus: `allowed_warning`,
                rateLimitType: r,
                resetsAt: o === void 0 ? void 0 : Number(o),
                utilization: a === void 0 ? void 0 : Number(a),
                surpassedThreshold: Number(i),
                unifiedRateLimitFallbackAvailable: t,
                isUsingOverage: !1,
                ...sd(e)
            }
        }
    }
    return null
}

function ld(e) {
    let t = od(e),
        n = t[`anthropic-ratelimit-unified-status`] || `allowed`,
        r = t[`anthropic-ratelimit-unified-reset`],
        i = r === void 0 ? void 0 : Number(r),
        a = t[`anthropic-ratelimit-unified-fallback`] === `available`,
        o = t[`anthropic-ratelimit-unified-representative-claim`],
        s = sd(t),
        c = n === `rejected` && (s.overageHeaderStatus === `allowed` || s.overageHeaderStatus === `allowed_warning`);
    if (n !== `rejected`) {
        let e = cd(t, a);
        if (e) return e
    }
    return {
        quotaStatus: n === `rejected` ? `rejected` : `allowed`,
        resetsAt: i,
        unifiedRateLimitFallbackAvailable: a,
        ...o && {
            rateLimitType: o
        },
        ...s,
        isUsingOverage: c
    }
}

function ud(e, t) {
    return JSON.stringify(e) === JSON.stringify(t)
}
var dd = `anthropic-ratelimit-unified-status`;

function fd(e, t) {
    if (e.overageHeaderStatus !== void 0) return e;
    let n = Z;
    return !(n.overageHeaderStatus === `allowed` || n.overageHeaderStatus === `allowed_warning`) || e.quotaStatus !== `rejected` && t ? e : { ...e,
        quotaStatus: `rejected`,
        ...e.rateLimitType === void 0 && n.rateLimitType !== void 0 && {
            rateLimitType: n.rateLimitType
        },
        ...e.resetsAt === void 0 && n.resetsAt !== void 0 && {
            resetsAt: n.resetsAt
        },
        overageHeaderStatus: n.overageHeaderStatus,
        ...n.overageDisabledReason !== void 0 && {
            overageDisabledReason: n.overageDisabledReason
        },
        ...n.overageResetsAt !== void 0 && {
            overageResetsAt: n.overageResetsAt
        },
        ...n.upgradePaths !== void 0 && {
            upgradePaths: n.upgradePaths
        },
        isUsingOverage: !0
    }
}

function pd(e) {
    let t = dd in od(e),
        n = fd(ld(e), t);
    ud(Z, n) || nd(n)
}

function md(e) {
    let t = ld(e);
    t.quotaStatus = `rejected`, t.isUsingOverage = t.overageHeaderStatus === `allowed` || t.overageHeaderStatus === `allowed_warning`;
    let n = fd(t, !1);
    ud(Z, n) || nd(n)
}

function hd(e) {
    let t = {
            seven_day_omelette: e.sevenDayOmelette,
            omelette_promotional: e.omelettePromotional,
            five_hour: e.fiveHour,
            seven_day: e.sevenDay
        },
        n = e => t[e] ? .utilization !== void 0,
        r;
    if (n(`seven_day_omelette`)) r = `seven_day_omelette`;
    else if (n(`omelette_promotional`)) r = `omelette_promotional`;
    else if (n(`five_hour`) || n(`seven_day`)) r = (t.five_hour ? .utilization ? ? -1) >= (t.seven_day ? .utilization ? ? -1) ? `five_hour` : `seven_day`;
    else return;
    let i = t[r];
    if (!i || i.utilization === void 0) return;
    let a = i.utilization >= 100 ? `rejected` : `allowed`,
        o = i.resetsAt === void 0 ? void 0 : Number(i.resetsAt),
        s = Z.overageResetsAt,
        c = Z.upgradePaths,
        l, u;
    if (e.extraUsage) {
        let t = e.extraUsage.disabledReason;
        e.extraUsage.isEnabled ? (e.extraUsage.utilization ? ? 0) >= 100 ? (l = `rejected`, u = t ? ? `org_spend_cap_reached`) : l = Z.overageHeaderStatus === `allowed_warning` ? `allowed_warning` : `allowed` : (l = `rejected`, u = t ? ? `overage_not_provisioned`)
    } else Z.overageHeaderStatus && (l = Z.overageHeaderStatus, u = Z.overageDisabledReason);
    let d = {
        quotaStatus: a,
        rateLimitType: r,
        unifiedRateLimitFallbackAvailable: !1,
        isUsingOverage: a === `rejected` && (l === `allowed` || l === `allowed_warning`),
        ...o !== void 0 && {
            resetsAt: o
        },
        ...l && {
            overageHeaderStatus: l
        },
        ...u && {
            overageDisabledReason: u
        },
        ...s !== void 0 && {
            overageResetsAt: s
        },
        ...c && {
            upgradePaths: c
        }
    };
    ud(Z, d) || nd(d)
}
var gd = null;

function _d(e) {
    gd = e
}
async function vd() {
    if (gd) try {
        hd(await gd())
    } catch {}
}
async function yd() {
    Z.quotaStatus === `rejected` && (Z.creditsRequired || Z.isUsingOverage || Z.rateLimitType !== `overage` && !rd.has(Z.rateLimitType) || await vd())
}
typeof document < `u` && document.addEventListener(`visibilitychange`, () => {
    document.visibilityState === `visible` && yd()
});
var Q = new Intl.DateTimeFormat(void 0, {
        hour: `numeric`,
        minute: `2-digit`
    }),
    bd = new Intl.DateTimeFormat(void 0, {
        weekday: `short`
    }),
    xd = new Intl.DateTimeFormat(void 0, {
        weekday: `short`,
        month: `short`,
        day: `numeric`
    });

function Sd(e) {
    if (!e) return ``;
    let t = new Date(e * 1e3),
        n = t.getTime() - Date.now();
    if (n <= 0) return ``;
    let r = new Date().toDateString() === t.toDateString(),
        i = Q.format(t);
    return r ? `at ${i}` : n > 2880 * 60 * 1e3 ? xd.format(t) : `${bd.format(t)} ${i}`
}

function Cd(e) {
    return e ? String(Math.round(e / 900) * 900) : ``
}

function wd(e) {
    if (!e) return ``;
    let t = Sd(e);
    return t ? `resets ${t}` : `resets soon`
}

function Td(e) {
    let t = Ju(e.rateLimitType),
        n = Yu(e.rateLimitType),
        r = n ? `` : wd(e.resetsAt),
        i = r ? ` · It ${r}` : ``,
        a = Xu(e.rateLimitType) ? `. Claude Design has its own usage limit, separate from your regular Claude usage.` : ``;
    if (e.isUsingOverage) return e.overageHeaderStatus === `allowed_warning` ? {
        text: `You're close to your usage credits spend limit`,
        severity: `warning`
    } : n ? null : {
        text: `You're now using usage credits · Your ${t} ${r||`will reset`}`,
        severity: `info`
    };
    if (e.quotaStatus === `rejected`) {
        let r = wd(e.overageResetsAt),
            o = r ? ` · It ${r}` : ``;
        return e.overageDisabledReason === `out_of_credits` ? {
            text: `You're out of usage credits` + o,
            severity: `error`
        } : Qu(e.overageDisabledReason) ? {
            text: `You've reached your monthly usage credits spend limit` + o,
            severity: `error`
        } : e.overageDisabledReason === `fetch_error` ? {
            text: `We couldn't check your usage credits right now. Try again in a moment.`,
            severity: `error`
        } : n ? {
            text: `You've used all of your ${t}. ${e.overageHeaderStatus===`rejected`?`Contact your administrator to enable usage credits.`:`You can keep going with usage credits.`}`,
            severity: `error`
        } : {
            text: `You've hit your ${t}${i}${a}`,
            severity: `error`
        }
    }
    if (e.quotaStatus === `allowed_warning`) {
        if (Yu(e.rateLimitType) && e.overageHeaderStatus === `allowed`) return null;
        let n = e.utilization === void 0 ? void 0 : Math.round(e.utilization * 100);
        return {
            text: `You've used ${n===void 0?``:`${n}% of `}your ${t}${i}${a}`,
            severity: `warning`
        }
    }
    return null
}
var Ed = new Map,
    Dd = new Set,
    Od = () => Ed.size === 0;

function kd(e, t = .2) {
    return e * (1 + (Math.random() * 2 - 1) * t)
}

function Ad(e, t) {
    let {
        base: n,
        cap: r
    } = t, i = Math.min(r, n * 2 ** e);
    return n + Math.random() * (i - n)
}
var jd = 720 * 60 * 1e3,
    Md = 30 / 720,
    $ = 3600 * 1e3,
    Nd = 300 * 1e3,
    Pd = `omelette_stale_reload_at`,
    Fd = 60 * 1e3;

function Id(e, t, n, r, i, a, o = jd) {
    if (e - t < o || !i || a) return !1;
    let s = e - n > $;
    return r || s
}

function Ld() {
    let e = (0, T.useRef)(Date.now()),
        t = (0, T.useRef)(Date.now()),
        n = (0, T.useRef)(document),
        r = (0, T.useRef)(kd(jd, Md)).current,
        i = () => {
            t.current = Date.now()
        },
        a = () => {
            let n = Date.now();
            if (Id(n, e.current, t.current, document.hidden, Od(), c(), r)) {
                try {
                    if (n - Number(sessionStorage.getItem(Pd) ? ? 0) < Fd) return;
                    sessionStorage.setItem(Pd, String(n))
                } catch {}
                s(`design.stale_reload`, {
                    attrs: {
                        open_hours: (n - e.current) / 36e5,
                        hidden: document.hidden,
                        idle_minutes: (n - t.current) / 6e4
                    }
                }), window.location.reload()
            }
        };
    u(`mousemove`, i), u(`keydown`, i), u(`iframe-activity`, i), u(`visibilitychange`, a, n), l(a, Nd)
}
var Rd = Object.keys(nl);

function zd(e) {
    let t = {};
    for (let e of Rd) {
        let n = nl[e],
            r = V(n.flag);
        t[e] = n.field === `value` ? n.coerce ? n.coerce(r.value) : r.value : r.on
    }(0, T.useEffect)(() => {
        e && n(() =>
            import (`./gb-setters-RWtEzghG.js`).then(e => {
                for (let n of Rd) e.AGENT_GB_SETTERS[n](t[n])
            }), __vite__mapDeps([39, 8, 1, 3, 2, 4, 0, 5, 9, 10, 11, 12, 13])).catch(e => void 0)
    }, [JSON.stringify(t), e])
}

function Bd(e) {
    r.setUser({
        id: e.id,
        organization_id: e.organization_id
    })
}

function Vd() {
    r.clearUser()
}

function Hd(e) {
    r.setGlobalContextProperty(`home_variant`, e)
}

function Ud() {
    let e = se(),
        t = e ? .accountUuid,
        n = e ? .organizationUuid;
    (0, T.useEffect)(() => {
        t && n ? Bd({
            id: t,
            organization_id: n
        }) : Vd()
    }, [t, n])
}

function Wd() {
    return V(`__gb__1227884110`).value === `promptbox` ? `promptbox` : `make`
}
var Gd = !1,
    Kd = !1;

function qd(e) {
    Gd = e
}

function Jd(e) {
    Kd = e
}

function Yd() {
    return Gd && Kd || !1
}
var Xd = {
    continuous: 16,
    instant: 100,
    responsive: 400,
    flow_preserving: 1e3,
    attention_holding: 1e4,
    unattended: null
};

function Zd(e) {
    let t = Xd[e];
    return t === null ? 3e4 : Math.min(t * 10, 3e4)
}
var Qd = () => performance.now();

function $d() {
    let e = new Uint8Array(8);
    return crypto.getRandomValues(e), Array.from(e, e => e.toString(16).padStart(2, `0`)).join(``)
}
var ef = new WeakMap;

function tf(e, t) {
    if (!e.isOpen) {
        t();
        return
    }
    let n = ef.get(e);
    n ? n.push(t) : ef.set(e, [t])
}

function nf(e) {
    let t = ef.get(e);
    if (t) {
        ef.delete(e);
        for (let e of t) try {
            e()
        } catch {}
    }
}

function rf(e, t, n, r, i) {
    let a = $d(),
        o = [],
        s = [],
        c = null,
        l = null,
        u = { ...n
        },
        d = {
            id: a,
            traceId: i,
            name: e,
            start: t,
            get attrs() {
                return u
            },
            get marks() {
                return o
            },
            get children() {
                return s
            },
            get end() {
                return c
            },
            get isOpen() {
                return c === null
            },
            get outcome() {
                return l
            },
            annotate(e) {
                Object.assign(u, e)
            },
            mark(e, t) {
                o.push({
                    name: e,
                    at: Qd(),
                    attrs: { ...t
                    }
                })
            },
            child(e, t) {
                let n = rf(e, Qd(), t ? ? {}, void 0, i);
                return s.push(n), n
            },
            finish(e = `ok`, n, i) {
                if (c !== null) return;
                n && Object.assign(u, n);
                let a = Qd();
                c = i === void 0 ? a : Math.max(t, Math.min(i, a)), l = e, nf(d);
                for (let e of s) e.isOpen && e.finish(`interrupted`);
                r ? .(d)
            }
        };
    return d
}

function af(e) {
    let t = e.end ? ? e.start;
    return {
        id: e.id,
        traceId: e.traceId,
        name: e.name,
        timeOrigin: performance.timeOrigin,
        start: e.start,
        end: t,
        ms: t - e.start,
        outcome: e.outcome ? ? `abandoned`,
        attrs: { ...e.attrs
        },
        marks: [...e.marks],
        children: e.children.map(t => ({ ...af(t),
            parentId: e.id
        }))
    }
}

function of (e) {
    return e != null && typeof e.then == `function`
}

function sf(e) {
    return e ? .constructor ? .name ? ? `Error`
}

function cf() {
    return typeof requestAnimationFrame != `function` || typeof document < `u` && document.hidden ? Promise.resolve() : new Promise(e => {
        let t = !1,
            n = () => {
                document.hidden && r()
            },
            r = () => {
                t || (t = !0, typeof document < `u` && document.removeEventListener(`visibilitychange`, n), e())
            };
        typeof document < `u` && document.addEventListener(`visibilitychange`, n), requestAnimationFrame(() => requestAnimationFrame(r))
    })
}

function lf(e) {
    return {
        span: e,
        async trace(t, n, r) {
            let i = e.child(t, r),
                a = lf(i);
            try {
                let e = n(a),
                    t = of (e) ? await e : e;
                return i.finish(`ok`), t
            } catch (e) {
                throw i.finish(`error`, {
                    error: sf(e)
                }), e
            }
        },
        child: (t, n) => e.child(t, n),
        mark: (t, n) => e.mark(t, n),
        phase: (t, n) => e.mark(t, {
            phase: !0,
            regime: n,
            budgetMs: Xd[n]
        }),
        annotate: t => e.annotate(t),
        finishNow: (t, n) => e.finish(t, n),
        finishAfterPaint: async (t, n) => {
            await cf(), e.finish(t, n)
        }
    }
}
var uf = /^design\.[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)?$/;

function df(e) {
    let t = e.warn ? ? (e => void 0),
        n = new Set;
    typeof window < `u` && window.addEventListener(`pagehide`, () => {
        for (let e of n) e.finish(`abandoned`, {
            wasUnload: !0
        })
    });

    function r(n) {
        let r = af(n);
        for (let n of e.reporters) try {
            n.onRootEnd(r)
        } catch (e) {
            t(`reporter threw: ${String(e)}`)
        }
    }

    function i(e, i) {
        uf.test(e) || t(`interaction name "${e}" should be design.<entity>.<verb> (lowercase, dot-separated)`);
        let a = i.triggerEvent ? .timeStamp ? ? Qd(),
            o = $d() + $d(),
            s = Xd[i.regime],
            c = {
                regime: i.regime,
                budgetMs: s
            },
            l, u, d = rf(e, a, { ...c,
                ...i.attrs ? ? {}
            }, e => {
                n.delete(e), l && clearTimeout(l), u && document.removeEventListener(`visibilitychange`, u), r(e)
            }, o);
        return n.add(d), typeof document < `u` && (u = () => {
            document.hidden && d.annotate({
                wasHidden: !0
            })
        }, document.hidden && u(), document.addEventListener(`visibilitychange`, u)), i.maxDurationMs !== void 0 && (l = setTimeout(() => d.finish(`timeout`), i.maxDurationMs)), lf(d)
    }
    return {
        start: i,
        config: e
    }
}
var ff = 1024 * 1024,
    pf = new Set([`heap_used_mb`, `heap_total_mb`, `heap_limit_mb`]);

function mf() {
    try {
        if (typeof performance > `u`) return null;
        let e = performance.memory;
        if (!e) return null;
        let {
            usedJSHeapSize: t,
            totalJSHeapSize: n,
            jsHeapSizeLimit: r
        } = e;
        return !Number.isFinite(t) || !Number.isFinite(n) || !Number.isFinite(r) ? null : {
            used: Math.round(t / ff),
            total: Math.round(n / ff),
            limit: Math.round(r / ff)
        }
    } catch {
        return null
    }
}

function hf() {
    let e = mf();
    return e ? {
        heap_used_mb: e.used,
        heap_total_mb: e.total,
        heap_limit_mb: e.limit
    } : {}
}
var gf = !1;

function _f() {
    if (typeof window > `u` || typeof document > `u` || gf) return;
    let e = () => {
        if (typeof document > `u`) return;
        if (document.visibilityState !== `visible`) {
            document.addEventListener(`visibilitychange`, () => setTimeout(e, 500), {
                once: !0
            });
            return
        }
        let t = [],
            n = -1,
            r = () => document.addEventListener(`visibilitychange`, () => setTimeout(e, 500), {
                once: !0
            }),
            i = e => {
                if (document.visibilityState !== `visible`) {
                    r();
                    return
                }
                if (n >= 0 && t.push(e - n), n = e, t.length < 10) {
                    requestAnimationFrame(i);
                    return
                }
                t.sort((e, t) => e - t);
                let a = t.length >> 1,
                    o = t.length & 1 ? t[a] : (t[a - 1] + t[a]) / 2,
                    s = o > 0 ? Math.round(1e3 / o) : 0;
                s >= 24 && s <= 480 ? gf = !0 : r()
            };
        requestAnimationFrame(i)
    };
    document.readyState === `complete` ? setTimeout(e, 500) : window.addEventListener(`load`, () => setTimeout(e, 500), {
        once: !0
    })
}
_f();
var vf = e => Math.round(e * 10) / 10;

function yf() {
    if (typeof navigator > `u`) return `other`;
    let e = navigator.userAgentData ? .platform ? .toLowerCase();
    if (e) {
        if (e.includes(`mac`)) return `mac`;
        if (e.includes(`win`)) return `windows`;
        if (e.includes(`android`)) return `android`;
        if (e.includes(`cros`) || e.includes(`chrome os`)) return `cros`;
        if (e.includes(`linux`)) return `linux`;
        if (e === `ios` || e.includes(`iphone`) || e.includes(`ipad`)) return `ios`
    }
    let t = navigator.userAgent;
    return /iPhone|iPad|iPod/.test(t) ? `ios` : /Android/.test(t) ? `android` : /CrOS/.test(t) ? `cros` : /Mac OS X/.test(t) ? `mac` : /Windows/.test(t) ? `windows` : /Linux/.test(t) ? `linux` : `other`
}
var bf;

function xf() {
    return bf ? ? = yf()
}

function Sf(e, t, n = {}) {
    return {
        "anthropic.regime": e,
        "anthropic.outcome": t,
        "anthropic.budget_ms": Xd[e],
        os_bucket: xf(),
        ...n.wasHidden ? {
            was_hidden: !0
        } : {}
    }
}
var Cf = e => e.replace(/[A-Z]/g, e => `_` + e.toLowerCase()),
    wf = new Set([`regime`, `budgetMs`, `wasHidden`, `wasUnload`, `noop`, `gestureMs`, `firstFrameMs`, `frameP95Ms`, `frameMaxMs`, `histLt8`, `histLt16`, `histLt33`, `histLt50`, `histGte50`, `loafMaxBlockingMs`, `worstInvoker`, `deviceFps`, `heapUsedMb`, `heapTotalMb`, `heapLimitMb`]);

function Tf(e, t) {
    let n = {};
    for (let [r, i] of Object.entries(e)) {
        if (i === void 0 || wf.has(r) || t && typeof i == `string`) continue;
        let e = Cf(r);
        pf.has(e) || (n[e] = i)
    }
    return n
}

function Ef(e) {
    let t = e.heapUsedMb,
        n = e.heapTotalMb,
        r = e.heapLimitMb;
    return !Number.isFinite(t) || !Number.isFinite(n) || !Number.isFinite(r) ? {} : {
        heap_used_mb: t,
        heap_total_mb: n,
        heap_limit_mb: r
    }
}

function Df(e) {
    let t = [],
        n = (e, r) => {
            for (let i of e.children) t.push({
                span: i,
                depth: r,
                parentName: e.name
            }), n(i, r + 1)
        };
    return n(e, 1), t
}

function Of(e, t, n) {
    let r = e.attrs,
        i = r.regime === `continuous`;
    return { ...Tf(r, n),
        "anthropic.regime": r.regime,
        "anthropic.outcome": e.outcome,
        "anthropic.budget_ms": r.budgetMs,
        duration_ms: vf(e.ms),
        was_hidden: r.wasHidden === !0 || void 0,
        was_noop: e.outcome === `noop` || r.noop === !0 || void 0,
        was_unload: r.wasUnload === !0 || void 0,
        os_bucket: xf(),
        ...i ? Ef(r) : hf(),
        trace_id: t.traceId,
        ...i ? {
            gesture_ms: typeof r.gestureMs == `number` ? vf(r.gestureMs) : void 0,
            first_frame_ms: typeof r.firstFrameMs == `number` ? vf(r.firstFrameMs) : null,
            frame_p95_ms: typeof r.frameP95Ms == `number` ? vf(r.frameP95Ms) : null,
            frame_max_ms: typeof r.frameMaxMs == `number` ? vf(r.frameMaxMs) : null,
            hist_lt8: r.histLt8,
            hist_lt16: r.histLt16,
            hist_lt33: r.histLt33,
            hist_lt50: r.histLt50,
            hist_gte50: r.histGte50,
            loaf_max_blocking_ms: r.loafMaxBlockingMs,
            worst_invoker: r.worstInvoker,
            device_fps: r.deviceFps
        } : {}
    }
}
var kf = {
        onRootEnd(e) {
            if (typeof window > `u`) return;
            let t = Df(e),
                n = new Set([e, ...t.map(e => e.span)].filter(e => e.attrs.regime === `continuous`).map(e => e.id)),
                i = Of(e, e, n.has(e.id)),
                a = t.filter(e => !n.has(e.span.id)).map(e => ({
                    name: e.span.name,
                    duration_ms: vf(e.span.ms),
                    outcome: e.span.outcome,
                    depth: e.depth,
                    parent_name: e.parentName
                })),
                o = e.marks.filter(e => e.attrs.phase === !0).map(t => ({
                    phase: t.name,
                    ms: vf(t.at - e.start),
                    regime: t.attrs.regime,
                    budget_ms: t.attrs.budgetMs
                }));
            r.addAction(e.name, { ...i,
                child_spans: a.length ? a : void 0,
                phases: o.length ? o : void 0
            });
            for (let i of t) n.has(i.span.id) && r.addAction(`${e.name}/${i.span.name}`, { ...Of(i.span, e, !0),
                depth: i.depth,
                parent_name: i.parentName
            })
        }
    },
    Af = 200,
    jf = {
        onRootEnd(e) {
            if (typeof window > `u`) return;
            let t = window.__perfEvents ? ? = [];
            t.push(e), t.length > Af && t.splice(0, t.length - Af)
        }
    };

function Mf() {
    return [kf, jf]
}
var Nf = {};

function Pf() {
    let e = Object.keys(Nf);
    if (e.length) {
        r.addAction(`design._meta.gated`, {
            counts: { ...Nf
            }
        });
        for (let t of e) delete Nf[t]
    }
}
var Ff = (0, T.createContext)(null),
    If = {
        perf: df({
            reporters: [],
            warn: () => {}
        })
    };

function Lf(e) {
    return (0, T.useContext)(Ff) || If
}

function Rf({
    perf: e,
    extraReporters: t,
    children: n
}) {
    let [r] = (0, T.useState)(() => ({
        perf: e ? ? df({
            reporters: [...Mf(), ...t ? ? []]
        })
    }));
    return (0, T.useEffect)(() => {
        let e = () => {
            document.visibilityState === `hidden` && Pf()
        };
        return document.addEventListener(`visibilitychange`, e), window.addEventListener(`pagehide`, Pf), () => {
            document.removeEventListener(`visibilitychange`, e), window.removeEventListener(`pagehide`, Pf)
        }
    }, []), (0, k.jsx)(Ff.Provider, {
        value: r,
        children: n
    })
}

function zf() {
    return Lf(`usePerf`).perf
}

function Bf() {
    if (!(typeof performance > `u`)) return performance.getEntriesByType ? .(`navigation`) ? .[0]
}

function Vf() {
    return typeof document < `u` && `prerendering` in document && document.prerendering ? !0 : (Bf() ? .activationStart ? ? 0) > 0
}
var Hf = df({
        reporters: Mf()
    }),
    Uf = `flow_preserving`,
    Wf = {
        ok: `success`,
        error: `failure`,
        timeout: `aborted`
    },
    Gf = null;

function Kf(e, t) {
    Gf ? .finishNow(`abandoned`), Gf = Hf.start(e, {
        regime: Uf,
        triggerEvent: t === void 0 ? void 0 : {
            timeStamp: t
        },
        maxDurationMs: Zd(Uf),
        attrs: {
            platform: `web`
        }
    });
    let n = Gf.span;
    return tf(n, () => {
        let t = n.outcome,
            i = t === null ? void 0 : Wf[t];
        i !== void 0 && (n.annotate({
            outcome: i
        }), e === `design.page.load` && r.addAction(`design.page_load`, {
            outcome: i,
            platform: `web`,
            error_type: n.attrs.errorType
        }))
    }), Gf
}

function qf() {
    Kf(`design.page.load`, Bf() ? .activationStart ? ? 0).annotate({
        wasPrerendered: Vf()
    })
}
typeof window < `u` && (typeof document < `u` && document.prerendering ? document.addEventListener(`prerenderingchange`, qf, {
    once: !0
}) : qf());

function Jf() {
    let {
        pathname: e
    } = D(), t = (0, T.useRef)(e);
    return (0, T.useLayoutEffect)(() => {
        t.current !== e && (t.current = e, Kf(`design.page.navigate`))
    }, [e]), null
}

function Yf({
    route: e,
    outcome: t,
    errorType: n
}) {
    let {
        key: r
    } = D();
    return (0, T.useEffect)(() => {
        let r = () => {
            let r = Gf;
            r && (Gf = null, r.annotate({
                route: e
            }), t === `error` ? (r.annotate({
                errorType: n
            }), r.finishNow(`error`)) : r.finishAfterPaint(`ok`))
        };
        if (document.prerendering) return document.addEventListener(`prerenderingchange`, r, {
            once: !0
        }), () => document.removeEventListener(`prerenderingchange`, r);
        r()
    }, [e, r, t, n]), null
}

function Xf(e = `render_error`) {
    Gf ? .annotate({
        errorType: e
    }), Gf ? .finishNow(`error`), Gf = null
}
var Zf = `/p/:projectId`,
    Qf = (0, T.lazy)(() => b(() => n(() =>
        import (`./ProjectsPage-DyYkbxtU.js`), __vite__mapDeps([40, 8, 1, 3, 2, 4, 0, 5, 9, 10, 11, 12, 13, 41, 31, 14, 32, 16, 17, 33, 7, 15, 18, 42, 43, 44, 19, 24, 45, 46, 47, 48, 34, 36, 37, 38, 49, 22, 21, 50, 51]))).then(e => e ? {
        default: e.ProjectsPage
    } : y)),
    $f = (0, T.lazy)(() => b(() => n(() =>
        import (`./ProjectPage-Hre4_7pa.js`), __vite__mapDeps([52, 8, 1, 3, 2, 4, 0, 5, 9, 10, 11, 12, 13, 41, 31, 14, 32, 16, 17, 33, 7, 15, 18, 42, 43, 44, 19, 24, 45, 46, 53, 54, 55, 56, 57, 58, 59, 20, 60, 61, 62]))).then(e => e ? {
        default: e.ProjectPage
    } : y)),
    ep = (0, T.lazy)(() => b(() => n(() =>
        import (`./FromCcPage-BTycE_ui.js`), __vite__mapDeps([63, 8, 1, 3, 2, 4, 0, 5, 9, 10, 11, 12, 13, 14, 17]))).then(e => e ? {
        default: e.FromCcPage
    } : y)),
    tp = (0, T.lazy)(() => b(() => n(() =>
        import (`./PresenterNotesPage-DXCJ_mWE.js`), __vite__mapDeps([64, 1, 2, 3, 4, 14, 8, 0, 5, 9, 10, 11, 12, 13, 32, 58, 16, 17, 65]))).then(e => e ? {
        default: e.PresenterNotesPage
    } : y)),
    np = (0, k.jsx)(_a, {
        fixed: !0
    });

function rp() {
    let {
        projectId: e
    } = on(), t = te();
    return e ? t ? (0, k.jsx)($f, {
        id: e,
        userId: t.userId,
        userEmail: t.email
    }) : np : (0, k.jsx)(An, {
        to: `/`,
        replace: !0
    })
}

function ip() {
    dc(V(`__gb__2058095250`).on), mc(V(`__gb__1649941334`).on), vc(V(`__gb__2469959517`).value), Sc(V(`__gb__3275324994`).on), Bc(V(`__gb__2898290939`).on), Hc(V(`__gb__717940119`).on), Gc(V(`__gb__2350294185`).on), Jc(V(`__gb__3299559052`).on), Tc(V(`__gb__2339954792`).on), qd(V(`__gb__167478287`).on), Jd(V(`__gb__2936519687`).on), v(V(`__gb__1718071824`).on), x(V(`__gb__2092971980`).on); {
        let e = V(`__gb__3461028739`).on,
            t = ce(),
            n = V(`__gb__2932278662`).value,
            r = e || t ? void 0 : typeof n ? .model_id == `string` && n.model_id ? n.model_id : void 0,
            i = typeof n ? .label == `string` && n.label ? n.label : void 0;
        ne(r, i), qu(r ? i : void 0)
    }
    let e = oe();
    zd(e !== null), Ud();
    let t = Wd();
    return (0, T.useEffect)(() => {
        e !== null && Hd(t)
    }, [e, t]), te(), Ru(!1), Vu(re()), null
}

function ap() {
    return Ld(), Iu(), (0, k.jsx)(Al, {
        children: (0, k.jsx)(G, {
            children: (0, k.jsx)(ga, {
                children: (0, k.jsxs)(bu, {
                    children: [(0, k.jsx)(ip, {}), (0, k.jsx)(Au, {}), (0, k.jsx)(ku, {
                        componentName: `DesignSpotlightPlacement`,
                        fallback: null,
                        children: (0, k.jsx)(Su, {})
                    }), (0, k.jsx)(ku, {
                        componentName: `DesignChatTooltipPlacement`,
                        fallback: null,
                        children: (0, k.jsx)(Eu, {})
                    }), (0, k.jsxs)(`div`, {
                        className: `h-dvh flex flex-col`,
                        children: [(0, k.jsx)(ku, {
                            componentName: `IncidentBanner`,
                            fallback: null,
                            children: (0, k.jsx)(El, {})
                        }), (0, k.jsx)(ku, {
                            componentName: `ViewerModeBanner`,
                            fallback: null,
                            children: (0, k.jsx)(Il, {})
                        }), !1, (0, k.jsxs)(`div`, {
                            className: `flex-1 min-h-0`,
                            children: [(0, k.jsx)(Jf, {}), (0, k.jsx)(T.Suspense, {
                                fallback: np,
                                children: (0, k.jsxs)(Nn, {
                                    children: [(0, k.jsx)(jn, {
                                        path: `/`,
                                        element: (0, k.jsx)(Qf, {})
                                    }), (0, k.jsx)(jn, {
                                        path: Zf,
                                        element: (0, k.jsx)(rp, {})
                                    }), (0, k.jsx)(jn, {
                                        path: `/p/:projectPath/presenter`,
                                        element: (0, k.jsx)(tp, {})
                                    }), (0, k.jsx)(jn, {
                                        path: `/fromcc`,
                                        element: (0, k.jsx)(ep, {})
                                    }), (0, k.jsx)(jn, {
                                        path: `*`,
                                        element: (0, k.jsx)(An, {
                                            to: `/`,
                                            replace: !0
                                        })
                                    })]
                                })
                            })]
                        })]
                    })]
                })
            })
        })
    })
}
var op = 1e4,
    sp = `claude_design_web`,
    cp = `production`,
    lp = `/api/event_logging/v2/batch`,
    up = [],
    dp = null,
    fp = new Set;
async function pp() {
    if (!Oe()) {
        for (let e of up) fp.delete(`${e.event_data.experiment_id}:${e.event_data.variation_id}`);
        up = [], dp && = (clearTimeout(dp), null);
        return
    }
    if (up.length === 0) return;
    let e = [...up];
    up = [], dp && = (clearTimeout(dp), null);
    let t = () => {
            for (let t of e) fp.delete(`${t.event_data.experiment_id}:${t.event_data.variation_id}`)
        },
        n = o();
    try {
        (await fetch(lp, {
            method: `POST`,
            headers: {
                "Content-Type": `application/json`,
                "x-service-name": sp,
                ...n ? {
                    "x-organization-uuid": n
                } : {}
            },
            body: JSON.stringify({
                events: e
            }),
            credentials: `include`,
            keepalive: !0
        })).ok || t()
    } catch {
        t()
    }
}

function mp() {
    dp || = setTimeout(() => {
        dp = null, pp()
    }, op)
}

function hp(e) {
    let t = `${e.event_data.experiment_id}:${e.event_data.variation_id}`;
    fp.has(t) || (fp.add(t), up.push(e), mp())
}

function gp(e) {
    if (!(typeof document > `u`))
        for (let t of document.cookie.split(`;`)) {
            let [n, r] = t.split(`=`);
            if (n.trim() === e) return decodeURIComponent(r ? ? ``)
        }
}
var _p, vp;

function yp() {
    return _p ? ? = gp(`anthropic-device-id`), _p ? ? `unknown`
}

function bp() {
    return vp ? ? = gp(`ajs_anonymous_id`), vp ? ? `unknown`
}
typeof window < `u` && window.addEventListener(`pagehide`, () => {
    pp()
}, {
    passive: !0
});

function xp({
    children: e
}) {
    let t = oe();
    return (0, k.jsx)(sc, {
        growthbook: (0, T.useMemo)(() => {
            let e = Sp(t);
            return new tc({
                trackingCallback: (e, t) => {
                    t.inExperiment && (hp({
                        event_type: `GrowthbookExperimentEvent`,
                        event_data: {
                            device_id: yp(),
                            anonymous_id: bp(),
                            timestamp: new Date().toISOString(),
                            experiment_id: e.key,
                            variation_id: t.variationId,
                            environment: cp
                        }
                    }), f(e.key, String(t.variationId)))
                }
            }).initSync({
                payload: {
                    features: e
                }
            })
        }, [t]),
        children: e
    })
}

function Sp(e) {
    if (!e) return {};
    try {
        return JSON.parse(e).features ? ? {}
    } catch {
        return s(`design.growthbook.payload_parse_failed`, {
            attrs: {
                payload_len: e.length
            }
        }), {}
    }
}
var Cp = !1,
    wp = 0,
    Tp = 50;

function Ep(e) {
    return e instanceof Text ? `#text` : e instanceof Element ? e.tagName : e.nodeName
}

function Dp(e, t) {
    if (wp++ >= Tp) return;
    let n = document.documentElement.classList.contains(`translated-ltr`) || document.documentElement.classList.contains(`translated-rtl`);
    r.addError(Error(`${e} suppressed: node not a child`), {
        source: `dom_translation_guard`,
        method: e,
        translated: n,
        ...t
    })
}

function Op() {
    if (typeof Node > `u` || Cp) return;
    Cp = !0;
    let e = Node.prototype.removeChild;
    Node.prototype.removeChild = function(t) {
        if (t instanceof Node && t.parentNode !== this) {
            let n = t.parentNode;
            return Dp(`removeChild`, {
                child_tag: Ep(t),
                parent_tag: Ep(this),
                parent_null: n === null
            }), n instanceof Element && n.tagName === `FONT` && this.contains(n) && e.call(n, t), t
        }
        return e.call(this, t)
    };
    let t = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function(e, n) {
        return n instanceof Node && n.parentNode !== this ? (Dp(`insertBefore`, {
            node_tag: Ep(e),
            ref_tag: Ep(n),
            parent_tag: Ep(this),
            ref_parent_null: n.parentNode === null
        }), e.parentNode === this ? e : t.call(this, e, null)) : t.call(this, e, n)
    }
}
try {
    Op()
} catch {}
var kp = `omelette_preload_reload_at`;
window.addEventListener(`vite:preloadError`, e => {
    if (!ie() && !(m() || String(e.payload).includes(`datadog-rum`)) && !c()) {
        try {
            let e = Number(sessionStorage.getItem(kp) ? ? 0);
            if (Date.now() - e < 1e4) return
        } catch {}
        s(`design.preload_reload`), e.preventDefault(), setTimeout(() => {
            try {
                sessionStorage.setItem(kp, String(Date.now()))
            } catch {}
            window.location.reload()
        }, Math.random() * 500)
    }
});
try {
    d()
} catch {}
_d(() => b(() => n(() =>
    import (`./client-BkAIwXnN.js`).then(e => e.n), __vite__mapDeps([0, 1, 2, 3, 4, 5]))).then(e => e ? e.getOmeletteClient().getUsageStatus({}) : y));
var Ap = new O({
        defaultOptions: {
            queries: {
                retry: 1,
                refetchOnWindowFocus: !1
            }
        }
    }),
    jp = `/design/`.replace(/\/$/, ``),
    Mp = (0, k.jsxs)(`div`, {
        style: {
            padding: `2rem`,
            textAlign: `center`
        },
        children: [(0, k.jsx)(`p`, {
            children: `Something went wrong.`
        }), (0, k.jsx)(`button`, {
            onClick: () => window.location.reload(),
            style: {
                border: `revert`,
                font: `revert`
            },
            children: `Reload`
        })]
    });
(0, Ji.createRoot)(document.getElementById(`root`)).render((0, k.jsx)(T.StrictMode, {
    children: (0, k.jsx)(ku, {
        componentName: `App`,
        fallback: Mp,
        onCatch: () => Xf(),
        children: (0, k.jsx)(Rf, {
            perf: Hf,
            children: (0, k.jsx)(qi, {
                client: Ap,
                children: (0, k.jsx)(xp, {
                    children: (0, k.jsx)(Sr, {
                        basename: jp,
                        useTransitions: !1,
                        children: (0, k.jsx)(ap, {})
                    })
                })
            })
        })
    })
}));
export {
    ll as $, Ci as $t, ku as A, el as At, Ql as B, ha as Bt, Qu as C, mc as Ct, Wu as D, Bc as Dt, td as E, vc as Et, ru as F, j as Ft, jl as G, na as Gt, Ll as H, da as Ht, J as I, va as It, fl as J, Xi as Jt, Tl as K, aa as Kt, Gl as L, ya as Lt, Ou as M, yc as Mt, ql as N, xa as Nt, Hu as O, Oc as Ot, Jl as P, Sa as Pt, V as Q, Ei as Qt, Yl as R, _a as Rt, Zu as S, Tc as St, Cd as T, Pc as Tt, Ml as U, ca as Ut, zl as V, pa as Vt, Pl as W, sa as Wt, al as X, Vi as Xt, dl as Y, Ki as Yt, ol as Z, Li as Zt, wd as _, Nr as _n, Qc as _t, Zd as a, mi as an, lc as at, Uu as b, ve as bn, Lc as bt, Wd as c, li as cn, Ec as ct, Dd as d, qr as dn, Fc as dt, Si as en, H as et, Ed as f, Gr as fn, Vc as ft, Sd as g, on as gn, fc as gt, pd as h, rn as hn, Cc as ht, Sf as i, Xr as in , Yc as it, wu as j, Zc as jt, zu as k, Hc as kt, kd as l, bi as ln, hc as lt, md as m, D as mn, Uc as mt, Hf as n, Qr as nn, bc as nt, tf as o, ti as on, Rc as ot, Z as p, Wr as pn, kc as pt, bl as q, ia as qt, zf as r, hi as rn, tl as rt, Yd as s, ei as sn, Mc as st, Yf as t, ai as tn, cl as tt, Ad as u, $r as un, Kc as ut, Td as v, Pe as vn, Jc as vt, vd as w, Gc as wt, Yu as x, jc as xt, Ju as y, ye as yn, cc as yt, eu as z, A as zt
};
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/v1/client-BkAIwXnN.js", "assets/v1/rolldown-runtime-CMxvf4Kt.js", "assets/v1/client-lite-BraEm36W.js", "assets/v1/preload-helper-7XptfjGJ.js", "assets/v1/react-BthIFXYf.js", "assets/v1/host-BwlQdwMG.js", "assets/v1/useUserSettings-DXDUhhmv.js", "assets/v1/connect-lite-vzd2EiZc.js", "assets/v1/timestamp-BohYTGqR.js", "assets/v1/connectrpc-BRKh2K0Y.js", "assets/v1/index-DxZs6uan.js", "assets/v1/cn-BvRk9kiK.js", "assets/v1/cn-qYiRd2Uw.js", "assets/v1/jsx-runtime-DDrWIXeu.js", "assets/v1/index-C5h2YR6l.css", "assets/v1/client-event-bus-CUOhmLFi.js", "assets/v1/fig-kit-coverage-DSUEqVg0.js"]))) => i.map(i => d[i]);
import {
    o as e,
    t
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    t as n
} from "./preload-helper-7XptfjGJ.js";
import {
    E as r,
    c as i,
    l as a
} from "./client-lite-BraEm36W.js";
import {
    t as o
} from "./react-BthIFXYf.js";
import {
    n as s,
    r as c,
    t as l
} from "./connect-lite-vzd2EiZc.js";
var u = t((e => {
        var t = o();

        function n(e) {
            var t = `https://react.dev/errors/` + e;
            if (1 < arguments.length) {
                t += `?args[]=` + encodeURIComponent(arguments[1]);
                for (var n = 2; n < arguments.length; n++) t += `&args[]=` + encodeURIComponent(arguments[n])
            }
            return `Minified React error #` + e + `; visit ` + t + ` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`
        }

        function r() {}
        var i = {
                d: {
                    f: r,
                    r: function() {
                        throw Error(n(522))
                    },
                    D: r,
                    C: r,
                    L: r,
                    m: r,
                    X: r,
                    S: r,
                    M: r
                },
                p: 0,
                findDOMNode: null
            },
            a = Symbol.for(`react.portal`);

        function s(e, t, n) {
            var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
            return {
                $$typeof: a,
                key: r == null ? null : `` + r,
                children: e,
                containerInfo: t,
                implementation: n
            }
        }
        var c = t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

        function l(e, t) {
            if (e === `font`) return ``;
            if (typeof t == `string`) return t === `use-credentials` ? t : ``
        }
        e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = i, e.createPortal = function(e, t) {
            var r = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
            if (!t || t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11) throw Error(n(299));
            return s(e, t, null, r)
        }, e.flushSync = function(e) {
            var t = c.T,
                n = i.p;
            try {
                if (c.T = null, i.p = 2, e) return e()
            } finally {
                c.T = t, i.p = n, i.d.f()
            }
        }, e.preconnect = function(e, t) {
            typeof e == `string` && (t ? (t = t.crossOrigin, t = typeof t == `string` ? t === `use-credentials` ? t : `` : void 0) : t = null, i.d.C(e, t))
        }, e.prefetchDNS = function(e) {
            typeof e == `string` && i.d.D(e)
        }, e.preinit = function(e, t) {
            if (typeof e == `string` && t && typeof t.as == `string`) {
                var n = t.as,
                    r = l(n, t.crossOrigin),
                    a = typeof t.integrity == `string` ? t.integrity : void 0,
                    o = typeof t.fetchPriority == `string` ? t.fetchPriority : void 0;
                n === `style` ? i.d.S(e, typeof t.precedence == `string` ? t.precedence : void 0, {
                    crossOrigin: r,
                    integrity: a,
                    fetchPriority: o
                }) : n === `script` && i.d.X(e, {
                    crossOrigin: r,
                    integrity: a,
                    fetchPriority: o,
                    nonce: typeof t.nonce == `string` ? t.nonce : void 0
                })
            }
        }, e.preinitModule = function(e, t) {
            if (typeof e == `string`)
                if (typeof t == `object` && t) {
                    if (t.as == null || t.as === `script`) {
                        var n = l(t.as, t.crossOrigin);
                        i.d.M(e, {
                            crossOrigin: n,
                            integrity: typeof t.integrity == `string` ? t.integrity : void 0,
                            nonce: typeof t.nonce == `string` ? t.nonce : void 0
                        })
                    }
                } else t ? ? i.d.M(e)
        }, e.preload = function(e, t) {
            if (typeof e == `string` && typeof t == `object` && t && typeof t.as == `string`) {
                var n = t.as,
                    r = l(n, t.crossOrigin);
                i.d.L(e, n, {
                    crossOrigin: r,
                    integrity: typeof t.integrity == `string` ? t.integrity : void 0,
                    nonce: typeof t.nonce == `string` ? t.nonce : void 0,
                    type: typeof t.type == `string` ? t.type : void 0,
                    fetchPriority: typeof t.fetchPriority == `string` ? t.fetchPriority : void 0,
                    referrerPolicy: typeof t.referrerPolicy == `string` ? t.referrerPolicy : void 0,
                    imageSrcSet: typeof t.imageSrcSet == `string` ? t.imageSrcSet : void 0,
                    imageSizes: typeof t.imageSizes == `string` ? t.imageSizes : void 0,
                    media: typeof t.media == `string` ? t.media : void 0
                })
            }
        }, e.preloadModule = function(e, t) {
            if (typeof e == `string`)
                if (t) {
                    var n = l(t.as, t.crossOrigin);
                    i.d.m(e, {
                        as: typeof t.as == `string` && t.as !== `script` ? t.as : void 0,
                        crossOrigin: n,
                        integrity: typeof t.integrity == `string` ? t.integrity : void 0
                    })
                } else i.d.m(e)
        }, e.requestFormReset = function(e) {
            i.d.r(e)
        }, e.unstable_batchedUpdates = function(e, t) {
            return e(t)
        }, e.useFormState = function(e, t, n) {
            return c.H.useFormState(e, t, n)
        }, e.useFormStatus = function() {
            return c.H.useHostTransitionStatus()
        }, e.version = `19.2.6`
    })),
    d = t(((e, t) => {
        function n() {
            if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > `u` || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != `function`)) try {
                __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)
            } catch {}
        }
        n(), t.exports = u()
    })),
    f = e(o()),
    p = new Promise(() => {}),
    m = e => e().catch(e),
    h = 0,
    g = e => {
        h += e
    };

function _() {
    return h > 0
}

function v(e, t) {
    {
        let n = e instanceof Error ? e : Error(String(e));
        r.addError(n, {
            source: `caught`,
            ui_context: t,
            ...y(e)
        })
    }
}

function y(e) {
    if (!c(e)) return;
    let t = {
        connect_code: s(e.code)
    };
    e.cause instanceof Error && (t.connect_cause_name = e.cause.name);
    let n = ee(e);
    return n && (t.error_kind = n), t
}
var b = /failed to fetch|network ?error|load failed/i;

function ee(e) {
    if (e.code === l.Unknown) {
        let t = e.cause instanceof TypeError ? e.cause.message : ``;
        if (b.test(t) || b.test(e.rawMessage)) return `client_network`
    }
    if (e.code === l.InvalidArgument && /unsupported content type/i.test(e.rawMessage)) return `unsupported_content_type`
}
var te = /^claude-fable-5(-|$)/,
    ne = /^claude-mythos-5(-|$)/,
    x = !1,
    S = !1;

function C(e) {
    x = e
}

function w(e) {
    S = e
}
var T = `https://www.anthropic.com/news/fable-mythos-access`;

function E(e) {
    return te.test(e) ? !x : ne.test(e) ? !S : !1
}
var D = {
        UNSPECIFIED: 0,
        FULL: 1,
        VIEWER: 2
    },
    re = `fake_`,
    O = `anthropic`;

function k(e) {
    let t = e.dsManageEnforced ? ? !1;
    return {
        user_id: e.accountUuid,
        email: e.email ? ? ``,
        display_name: e.displayName || null,
        org_id: e.organizationUuid,
        org_name: e.orgName ? ? ``,
        growthbook_payload: e.growthbookPayload ? ? ``,
        can_impersonate: !H(),
        is_eap: !1,
        is_anthropic: e.isAnthropic ? ? !1,
        is_personal_org: e.isPersonalOrg ? ? !1,
        is_admin: !1,
        access_level: e.accessLevel === `ACCESS_LEVEL_VIEWER` || e.accessLevel === D.VIEWER ? `viewer` : `full`,
        model_presets: (e.modelPresets ? ? []).map(e => ({
            id: e.id ? ? ``,
            label: e.label ? ? ``,
            description: e.description ? ? ``,
            overflow: e.overflow ? ? !1,
            maxTokens: e.maxTokens ? ? 2e5,
            supportsAdaptiveThinking: e.supportsAdaptiveThinking ? ? !1,
            effortOptions: (e.effortOptions ? ? []).map(e => ({
                id: e.id ? ? ``,
                name: e.name ? ? ``,
                recommended: e.recommended ? ? !1
            }))
        })),
        memberships: (e.memberships ? ? []).map(e => ({
            uuid: e.uuid ? ? ``,
            name: e.name ? ? ``
        })),
        default_model_id: e.defaultModelId ? ? ``,
        has_oauth_tokens: e.hasOauthTokens ? ? !1,
        ds_manage_enforced: t,
        can_manage_ds: t ? e.canManageDs ? ? !1 : !0,
        org_scope_sharing_allowed: e.orgScopeSharingAllowed ? ? !0,
        can_manage_billing: (e.canManageBilling ? ? !1) || (e.isPersonalOrg ? ? !1),
        has_usage_based_seat_tier: e.hasUsageBasedSeatTier ? ? !1
    }
}
var ie = [`email`, `displayName`, `orgName`, `growthbookPayload`, `defaultModelId`],
    ae = [`isAnthropic`, `isPersonalOrg`, `hasOauthTokens`, `dsManageEnforced`, `canManageDs`, `orgScopeSharingAllowed`, `canManageBilling`, `hasUsageBasedSeatTier`];

function oe() {
    return {}
}

function A(e) {
    let t = e => e == null || typeof e == `string`,
        n = e => e == null || typeof e == `boolean`,
        r = e => e == null || typeof e == `string` || typeof e == `number`,
        i = e => typeof e == `string` && e !== ``;
    return [...i(e.accountUuid) ? [] : [`accountUuid`], ...i(e.organizationUuid) ? [] : [`organizationUuid`], ...ie.filter(n => !t(e[n])), ...ae.filter(t => !n(e[t])), ...r(e.accessLevel) ? [] : [`accessLevel`]]
}

function j() {
    if (typeof document > `u`) return null;
    let e = document.getElementById(`omelette-me`);
    if (!(e instanceof HTMLScriptElement) || e.type !== `application/json` || !e.textContent) return null;
    try {
        let t = JSON.parse(e.textContent);
        if (typeof t != `object` || !t || Array.isArray(t)) return null;
        let n = t;
        return typeof n.accountUuid != `string` || n.accountUuid === `` || typeof n.organizationUuid != `string` || n.organizationUuid === `` ? null : n
    } catch {
        return null
    }
}
var M = j(),
    N = null;

function P(e, t) {
    let n = oe(),
        r = { ...e,
            ...n
        };
    if (t === `discard-all`) {
        let e = A(r);
        if (e.length === 0) return r;
        throw Error(`converter input drift: ${e.join(`, `)}`)
    }
    let i = Object.keys(n ? ? {});
    if (i.length === 0) return e;
    let a = A(r).filter(e => i.includes(e));
    if (a.length === 0) return r;
    try {
        v(Error(`converter input drift (overrides dropped): ${a.join(`, `)}`), `island_seed_invalid`)
    } catch {}
    return e
}
if (M) try {
    N = k(P(M, `discard-all`))
} catch (e) {
    try {
        v(e, `island_seed_invalid`)
    } catch {}
}
N && (a(N.org_id), i(N.user_id));
var F = null,
    I = null,
    L = new Set;

function R() {
    return N ? Promise.resolve(N) : I || (F = null, I = m(() => n(() =>
        import (`./client-BkAIwXnN.js`).then(e => e.n), __vite__mapDeps([0, 1, 2, 3, 4, 5]))).then(e => e ? e.getOmeletteClient().getMe({}) : p).then(e => e ? k(P(e, `drop-overrides`)) : p).catch(e => {
        if (c(e) && e.code === l.Unauthenticated) {
            let e;
            try {
                let t = (window.top ? ? window).location;
                e = t.pathname + t.search + t.hash
            } catch {
                e = window.location.pathname + window.location.search + window.location.hash
            }
            return J(`/login?returnTo=${encodeURIComponent(e)}`), null
        }
        return c(e) && e.code === l.PermissionDenied && ve(), F = e instanceof Error ? e : Error(String(e)), null
    }).then(e => {
        N = e, e && (a(e.org_id), i(e.user_id), m(() => n(() =>
            import (`./useUserSettings-DXDUhhmv.js`).then(e => e.i), __vite__mapDeps([6, 1, 2, 3, 4, 0, 5, 7, 8]))).then(e => e ? .rehydrateUserSettings()).catch(() => {}), m(() => n(() =>
            import (`./connectrpc-BRKh2K0Y.js`).then(e => e.i), __vite__mapDeps([9, 1, 10, 3, 2, 4, 11, 12, 13, 14, 0, 5, 15, 16, 8]))).then(e => {
            e && e.connectPlatform.refreshAgentHello()
        }).catch(() => {}));
        for (let e of L) e();
        return e
    }).finally(() => {
        I = null
    }), I)
}

function z(e) {
    return L.add(e), R(), () => {
        L.delete(e)
    }
}

function B() {
    return F ? ? N
}

function V() {
    let e = (0, f.useSyncExternalStore)(z, B);
    if (e instanceof Error) throw e;
    return e
}

function H() {
    return !0
}
async function U() {
    return H() ? (await R()) ? .is_anthropic ? ? !1 : !0
}
async function W() {
    let e = (await R()) ? .email ? ? ``,
        t = e.lastIndexOf(`@`);
    return t >= 0 ? e.slice(t + 1) : ``
}

function G() {
    return H() ? N ? .is_anthropic ? ? !1 : !0
}

function K() {
    return H() ? {
        id: ``,
        orgId: ``,
        name: ``,
        canImpersonate: !1,
        isImpersonating: !1,
        isAnthropic: !1,
        isPersonal: !1,
        isAdmin: !1,
        orgScopeSharingAllowed: !0,
        ready: !1
    } : {
        id: O,
        orgId: O,
        name: `Anthropic`,
        canImpersonate: !1,
        isImpersonating: !1,
        isAnthropic: !1,
        isPersonal: !1,
        isAdmin: !1,
        orgScopeSharingAllowed: !0,
        ready: !1
    }
}

function q(e) {
    let t = V();
    if (!t) return K();
    let n = ((typeof window < `u` ? new URLSearchParams(window.location.search).get(`org`) : null) || e || ``).trim().toLowerCase() || null;
    return t.can_impersonate && n && n !== t.org_id ? {
        id: n,
        orgId: `${re}${n}`,
        name: n,
        canImpersonate: !0,
        isImpersonating: !0,
        isAnthropic: !1,
        isPersonal: !1,
        isAdmin: t.is_admin,
        orgScopeSharingAllowed: !0,
        ready: !0
    } : {
        id: t.org_id,
        orgId: t.org_id,
        name: t.org_name,
        canImpersonate: t.can_impersonate,
        isImpersonating: !1,
        isAnthropic: t.is_anthropic,
        isPersonal: t.is_personal_org,
        isAdmin: t.is_admin,
        orgScopeSharingAllowed: t.org_scope_sharing_allowed,
        ready: !0
    }
}

function se() {
    let e = V();
    return e ? {
        userId: e.user_id,
        displayName: e.display_name || e.email,
        email: e.email
    } : null
}

function ce() {
    let e = V();
    return e ? {
        accountUuid: e.user_id,
        organizationUuid: e.org_id
    } : null
}

function le() {
    return V() ? .access_level ? ? `full`
}

function ue() {
    let e = V(),
        t = e ? .ds_manage_enforced ? ? !1,
        n = e ? .can_manage_ds ? ? !0;
    return {
        enforced: t,
        canManage: n,
        restricted: t && !n,
        resolved: e != null
    }
}

function de() {
    return V() ? .has_usage_based_seat_tier ? ? !1
}

function fe() {
    return V() ? .can_manage_billing ? ? !1
}

function J(e) {
    try {
        (window.top ? ? window).location.href = e
    } catch {
        window.location.href = e
    }
}

function pe() {
    try {
        localStorage.removeItem(`omelette-org-ds-projects-cache`), localStorage.removeItem(`omelette-org-settings-cache`), localStorage.removeItem(`omelette-user-settings`)
    } catch {}
    let e = !1,
        t = () => {
            e || (e = !0, J(`/logout`))
        };
    try {
        let e = indexedDB.deleteDatabase(`omelette-api-transcript`);
        e.onsuccess = e.onerror = e.onblocked = t
    } catch {
        t()
    }
    setTimeout(t, 500)
}

function me() {
    return V() ? .growthbook_payload ? ? null
}

function he() {
    return V() ? .model_presets ? ? null
}

function ge() {
    return V() ? .memberships ? ? null
}
var Y = `lastActiveOrg`;

function _e(e) {
    if (e === `claude.ai` || e.endsWith(`.claude.ai`)) return `.claude.ai`;
    if (e === `claude.com` || e.endsWith(`.claude.com`)) return `.claude.com`;
    if (e.endsWith(`.anthropic.com`)) return `.anthropic.com`
}

function X(e, t) {
    let n = `Path=/; SameSite=Lax${window.location.protocol===`https:`?`; Secure`:``}`,
        r = _e(window.location.hostname);
    r && (document.cookie = `${Y}=; Max-Age=0; ${n}`);
    let i = r ? `; Domain=${r}` : ``;
    document.cookie = `${Y}=${encodeURIComponent(e)}; Max-Age=${t}; ${n}${i}`
}

function ve() {
    X(``, 0)
}

function ye(e, t) {
    if (!e) return;
    try {
        sessionStorage.removeItem(`omelette-org-banner-dismissed`)
    } catch {}
    let n = new URL(window.location.href);
    n.searchParams.delete(`org`), n.hash = ``;
    let r = t ? ? n;
    window.history.replaceState(null, ``, r), X(e, 31536e3), window.location.assign(r)
}

function Z() {
    return N ? .model_presets ? ? []
}

function be(e) {
    return Z().find(t => t.id === e) ? .label || (e === Q && $ ? $ : e)
}

function xe() {
    return V() ? .default_model_id || null
}

function Se() {
    return N ? .default_model_id || null
}

function Ce(e) {
    if (!(!N || N.default_model_id === e)) {
        N = { ...N,
            default_model_id: e
        };
        for (let e of L) e()
    }
}

function we() {
    return V() ? .org_id ? ? null
}

function Te(e) {
    let t = () => {
            let e = Se();
            return e && !E(e) ? e : void 0
        },
        n = e ? .trim();
    return !n || E(n) ? t() : H() ? Z().some(e => e.id === n) || n === Q ? n : t() : n
}
var Q, $ = ``;

function Ee(e, t) {
    Q = e, $ = t || ``
}

function De(e, t) {
    return e ? t.some(t => e === t || e === `claude-${t}` || e.startsWith(`${t}-`) || e.startsWith(`claude-${t}-`)) : !1
}
export {
    g as A, q as C, C as D, E, p as M, m as N, w as O, d as P, he as S, T, ue as _, De as a, se as b, be as c, Ee as d, ye as f, xe as g, fe as h, G as i, _ as j, v as k, Te as l, we as m, W as n, H as o, le as p, U as r, pe as s, Z as t, Ce as u, me as v, ce as w, ge as x, de as y
};
import {
    o as e
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    t
} from "./react-BthIFXYf.js";
import {
    t as n
} from "./useQuery-H1uIcgPW.js";
import {
    hn as r
} from "./fig-kit-coverage-DSUEqVg0.js";
import {
    t as i
} from "./jsx-runtime-DDrWIXeu.js";
import {
    c as a,
    n as o,
    o as s,
    r as c,
    s as l
} from "./schemas-DgQq6Z5S.js";
import {
    t as u
} from "./AnimatePresence-CdFTYeUp.js";
import {
    I as d,
    L as f,
    N as p,
    P as m,
    R as h
} from "./index-DxZs6uan.js";
var g = e => Symbol.iterator in e,
    _ = e => `entries` in e,
    v = (e, t) => {
        let n = e instanceof Map ? e : new Map(e.entries()),
            r = t instanceof Map ? t : new Map(t.entries());
        if (n.size !== r.size) return !1;
        for (let [e, t] of n)
            if (!r.has(e) || !Object.is(t, r.get(e))) return !1;
        return !0
    },
    y = (e, t) => {
        let n = e[Symbol.iterator](),
            r = t[Symbol.iterator](),
            i = n.next(),
            a = r.next();
        for (; !i.done && !a.done;) {
            if (!Object.is(i.value, a.value)) return !1;
            i = n.next(), a = r.next()
        }
        return !!i.done && !!a.done
    };

function b(e, t) {
    return Object.is(e, t) ? !0 : typeof e != `object` || !e || typeof t != `object` || !t || Object.getPrototypeOf(e) !== Object.getPrototypeOf(t) ? !1 : g(e) && g(t) ? _(e) && _(t) ? v(e, t) : y(e, t) : v({
        entries: () => Object.entries(e)
    }, {
        entries: () => Object.entries(t)
    })
}
var x = e(t(), 1);

function S(e) {
    let t = x.useRef(void 0);
    return n => {
        let r = e(n);
        return b(t.current, r) ? t.current : t.current = r
    }
}

function C(e, t) {
    if (t === e || t === `/*`) return !0;
    if (t.endsWith(`/*`)) {
        let n = t.slice(0, -2);
        if (e === n || e.startsWith(n + `/`)) return !0
    }
    return !1
}
var w = 360 * 60,
    T = [`/new`],
    E = l(s({
        paths: o(a()),
        enabled: c()
    }));

function D(e) {
    return e.kind === `global` ? `global` : `${e.kind}:${e.key}`
}

function O(e) {
    let t = e.tier === `ambient` ? [] : [{
        kind: `global`
    }];
    return e.tier != null && t.push({
        kind: `tier`,
        key: e.tier
    }), t.push({
        kind: `placement`,
        key: e.placement_key
    }), t
}

function k(e, t) {
    if (t) switch (e.kind) {
        case `global`:
            return t.global;
        case `tier`:
            return t.tiers ? .[e.key];
        case `placement`:
            return t.placements[e.key]
    }
}

function A(e, t) {
    switch (t.kind) {
        case `global`:
            return !0;
        case `tier`:
            return e.tier != null && e.tier === t.key;
        case `placement`:
            return e.placement_key === t.key
    }
}

function j(e, t) {
    let n = t.findIndex(t => t.id === e.id);
    return n === -1 ? 2 ** 53 - 1 : n
}

function M(e, t) {
    let n = new Set,
        r = null;
    for (let [i, a] of e) {
        if (a.tier === `ambient`) {
            n.add(i);
            continue
        }
        let e = j(a, t);
        (r === null || e < r.pri) && (r = {
            pk: i,
            pri: e
        })
    }
    return r && n.add(r.pk), n
}

function ee(e, t) {
    let n = t.experiences.filter(t => t.placement_key === e);
    return te(e, t) || n.find(e => t.store.shownIds.has(e.id) && N(e, t)) || (n.find(e => N(e, t) && ne(e, t)) ? ? null)
}

function te(e, t) {
    return t.forcedKeys ? .size ? t.experiences.find(n => n.placement_key === e && t.forcedKeys ? .has(n.key ? ? n.id)) ? ? null : null
}

function N(e, t) {
    return !(t.clientEligibility !== void 0 && t.clientEligibility[e.key ? ? e.id] === !1 || t.store.dismissedIds.has(e.id) || t.store.actionedIds.has(e.id) || !oe(t.placementConfig[e.placement_key], t.pathname) || !L(e, t.pathname, t.defaultAllowedPaths))
}

function ne(e, t) {
    return O(e).every(e => {
        let n = k(e, t.rules);
        return P(e, n, t) && F(e, n, t)
    })
}

function P(e, t, n) {
    let r = t ? .rate_limit;
    return r ? r.remaining - re(e, n) > 0 : !0
}

function re(e, t) {
    if (e.kind === `global`) {
        let e = t.experiences.reduce((e, n) => n.tier === `ambient` && t.store.shownIds.has(n.id) ? e + 1 : e, 0);
        return t.store.shownIds.size - e
    }
    return t.experiences.reduce((n, r) => t.store.shownIds.has(r.id) && A(r, e) ? n + 1 : n, 0)
}

function F(e, t, n) {
    let r = n.store.lastActionAt.get(D(e));
    if (r === void 0) return !0;
    let i = t ? .cooldown ? .seconds ? ? ie(e);
    return i === null ? !1 : i <= 0 ? !0 : n.now - r >= i * 1e3
}

function ie(e) {
    switch (e.kind) {
        case `global`:
            return w;
        case `tier`:
            return 0;
        case `placement`:
            return null
    }
}

function I(e) {
    return Array.isArray(e) ? e.filter(e => typeof e == `string`) : []
}

function ae(e, t) {
    let n = I(e.config ? .platform ? .allowed_paths);
    if (n.length > 0) return n;
    let r = I(e.content ? .allowed_paths);
    return r.length > 0 ? r : t
}

function oe(e, t) {
    return e ? .enabled ? e.paths.some(e => C(t, e)) : !1
}

function L(e, t, n = T) {
    return ae(e, n).some(e => C(t, e))
}

function se(e, t) {
    let n = e.key ? ? e.id;
    if (t.clientEligibility !== void 0 && t.clientEligibility[n] === !1) return {
        gate: `probe-false`
    };
    if (t.store.dismissedIds.has(e.id)) return {
        gate: `dismissed`
    };
    if (t.store.actionedIds.has(e.id)) return {
        gate: `actioned`
    };
    let r = t.placementConfig[e.placement_key];
    if (!oe(r, t.pathname)) return {
        gate: `placement-path`,
        detail: r ? r.enabled ? `ef_placement_config["${e.placement_key}"].paths excludes ${t.pathname}` : `ef_placement_config["${e.placement_key}"].enabled is false` : `ef_placement_config["${e.placement_key}"] missing`
    };
    if (!L(e, t.pathname, t.defaultAllowedPaths)) return {
        gate: `experience-path`,
        detail: `allowed_paths excludes ${t.pathname}`
    };
    for (let n of O(e)) {
        let e = k(n, t.rules);
        if (!P(n, e, t)) return {
            gate: `pacing-rate-limit`,
            detail: D(n)
        };
        if (!F(n, e, t)) return {
            gate: `pacing-cooldown`,
            detail: D(n)
        }
    }
    return null
}

function ce(e, t) {
    return t.experiences.filter(t => t.placement_key === e).map(e => {
        let n = se(e, t);
        return {
            key: e.key ? ? e.id,
            id: e.id,
            gate: n ? .gate ? ? null,
            detail: n ? .detail
        }
    })
}

function R(e, t) {
    return e.verdict === t.verdict && e.pickedKey === t.pickedKey && e.detail === t.detail && e.candidates.length === t.candidates.length && e.candidates.every((e, n) => {
        let r = t.candidates[n];
        return e.key === r.key && e.id === r.id && e.gate === r.gate && e.detail === r.detail
    })
}
var z = e => {
        let t, n = new Set,
            r = (e, r) => {
                let i = typeof e == `function` ? e(t) : e;
                if (!Object.is(i, t)) {
                    let e = t;
                    t = r ? ? (typeof i != `object` || !i) ? i : Object.assign({}, t, i), n.forEach(n => n(t, e))
                }
            },
            i = () => t,
            a = {
                setState: r,
                getState: i,
                getInitialState: () => o,
                subscribe: e => (n.add(e), () => n.delete(e))
            },
            o = t = e(r, i, a);
        return a
    },
    le = (e => e ? z(e) : z),
    ue = e => e;

function de(e, t = ue) {
    let n = x.useSyncExternalStore(e.subscribe, x.useCallback(() => t(e.getState()), [e, t]), x.useCallback(() => t(e.getInitialState()), [e, t]));
    return x.useDebugValue(n), n
}
var B = e => {
        let t = le(e),
            n = e => de(t, e);
        return Object.assign(n, t), n
    },
    fe = (e => e ? B(e) : B);

function pe(e, t) {
    let n;
    try {
        n = e()
    } catch {
        return
    }
    return {
        getItem: e => {
            let r = e => e === null ? null : JSON.parse(e, t ? .reviver),
                i = n.getItem(e) ? ? null;
            return i instanceof Promise ? i.then(r) : r(i)
        },
        setItem: (e, r) => n.setItem(e, JSON.stringify(r, t ? .replacer)),
        removeItem: e => n.removeItem(e)
    }
}
var V = e => t => {
        try {
            let n = e(t);
            return n instanceof Promise ? n : {
                then(e) {
                    return V(e)(n)
                },
                catch (e) {
                    return this
                }
            }
        } catch (e) {
            return {
                then(e) {
                    return this
                },
                catch (t) {
                    return V(t)(e)
                }
            }
        }
    },
    me = (e, t) => (n, r, i) => {
        let a = {
                storage: pe(() => window.localStorage),
                partialize: e => e,
                version: 0,
                merge: (e, t) => ({ ...t,
                    ...e
                }),
                ...t
            },
            o = !1,
            s = 0,
            c = new Set,
            l = new Set,
            u = a.storage;
        if (!u) return e((...e) => {
            n(...e)
        }, r, i);
        let d = () => {
                let e = a.partialize({ ...r()
                });
                return u.setItem(a.name, {
                    state: e,
                    version: a.version
                })
            },
            f = i.setState;
        i.setState = (e, t) => (f(e, t), d());
        let p = e((...e) => (n(...e), d()), r, i);
        i.getInitialState = () => p;
        let m, h = () => {
            if (!u) return;
            let e = ++s;
            o = !1, c.forEach(e => e(r() ? ? p));
            let t = a.onRehydrateStorage ? .call(a, r() ? ? p) || void 0;
            return V(u.getItem.bind(u))(a.name).then(e => {
                if (e)
                    if (typeof e.version == `number` && e.version !== a.version) {
                        if (a.migrate) {
                            let t = a.migrate(e.state, e.version);
                            return t instanceof Promise ? t.then(e => [!0, e]) : [!0, t]
                        }
                    } else return [!1, e.state];
                return [!1, void 0]
            }).then(t => {
                if (e !== s) return;
                let [i, o] = t;
                if (m = a.merge(o, r() ? ? p), n(m, !0), i) return d()
            }).then(() => {
                e === s && (t ? .(r(), void 0), m = r(), o = !0, l.forEach(e => e(m)))
            }).catch(n => {
                e === s && t ? .(void 0, n)
            })
        };
        return i.persist = {
            setOptions: e => {
                a = { ...a,
                    ...e
                }, e.storage && (u = e.storage)
            },
            clearStorage: () => {
                u ? .removeItem(a.name)
            },
            getOptions: () => a,
            rehydrate: () => h(),
            hasHydrated: () => o,
            onHydrate: e => (c.add(e), () => {
                c.delete(e)
            }),
            onFinishHydration: e => (l.add(e), () => {
                l.delete(e)
            })
        }, a.skipHydration || h(), m || p
    };

function he() {
    if (typeof window > `u`) return !1;
    try {
        let e = `__ef_probe__`;
        return window.sessionStorage.setItem(e, e), window.sessionStorage.removeItem(e), !0
    } catch {
        return !1
    }
}
var H = {
        length: 0,
        clear: () => {},
        getItem: () => null,
        key: () => null,
        removeItem: () => {},
        setItem: () => {}
    },
    U;

function W() {
    return typeof window > `u` ? H : U || (U = he() ? window.sessionStorage : H, U)
}
var G = fe()(me(e => ({
        dismissedIds: new Set,
        shownIds: new Set,
        actionedIds: new Set,
        placementLastActionAt: new Map,
        tierLastActionAt: new Map,
        lastGlobalActionAt: null,
        markDismissed: (t, n) => {
            let r = Date.now();
            e(e => ({
                dismissedIds: new Set([...e.dismissedIds, t.id]),
                placementLastActionAt: new Map([...e.placementLastActionAt, [t.placement_key, r]]),
                ...t.tier == null ? {} : {
                    tierLastActionAt: new Map([...e.tierLastActionAt, [t.tier, r]])
                },
                ...n ? .skipGlobalCooldown ? {} : {
                    lastGlobalActionAt: r
                }
            }))
        },
        markNotTargeted: t => {
            e(e => ({
                dismissedIds: new Set([...e.dismissedIds, t])
            }))
        },
        markShown: t => {
            e(e => ({
                shownIds: new Set([...e.shownIds, t])
            }))
        },
        markActioned: (t, n) => {
            let r = Date.now();
            e(e => ({
                actionedIds: new Set([...e.actionedIds, t.id]),
                placementLastActionAt: new Map([...e.placementLastActionAt, [t.placement_key, r]]),
                ...t.tier == null ? {} : {
                    tierLastActionAt: new Map([...e.tierLastActionAt, [t.tier, r]])
                },
                ...n ? .skipGlobalCooldown ? {} : {
                    lastGlobalActionAt: r
                }
            }))
        },
        markPlacementCooldown: t => {
            let n = Date.now();
            e(e => ({
                placementLastActionAt: new Map([...e.placementLastActionAt, [t, n]]),
                lastGlobalActionAt: n
            }))
        },
        markGlobalCooldown: () => {
            e({
                lastGlobalActionAt: Date.now()
            })
        },
        resetExperience: t => {
            e(e => {
                let n = new Set(e.dismissedIds);
                n.delete(t);
                let r = new Set(e.actionedIds);
                return r.delete(t), {
                    dismissedIds: n,
                    actionedIds: r
                }
            })
        },
        resetPlacement: t => {
            e(e => {
                let n = new Map(e.placementLastActionAt);
                return n.delete(t), {
                    placementLastActionAt: n
                }
            })
        },
        resetShownIds: () => {
            e({
                shownIds: new Set
            })
        },
        resetAll: () => {
            e({
                dismissedIds: new Set,
                shownIds: new Set,
                actionedIds: new Set,
                placementLastActionAt: new Map,
                tierLastActionAt: new Map,
                lastGlobalActionAt: null,
                mountedCallers: new Map,
                currentlyShowing: new Map,
                selectedByPlacement: new Map,
                probeResults: new Map
            })
        },
        mountedCallers: new Map,
        currentlyShowing: new Map,
        selectedByPlacement: new Map,
        probeResults: new Map,
        selectionTrace: new Map,
        incrementMountedCallers: t => {
            let n = 0;
            return e(e => {
                let r = new Map(e.mountedCallers);
                return n = (r.get(t) ? ? 0) + 1, r.set(t, n), {
                    mountedCallers: r
                }
            }), n
        },
        decrementMountedCallers: t => {
            let n = 0;
            return e(e => {
                let r = new Map(e.mountedCallers);
                return n = Math.max(0, (r.get(t) ? ? 0) - 1), n === 0 ? r.delete(t) : r.set(t, n), {
                    mountedCallers: r
                }
            }), n
        },
        setCurrentlyShowing: (t, n) => {
            e(e => {
                if (e.currentlyShowing.get(t) === n) return e;
                let r = new Map(e.currentlyShowing);
                return r.set(t, n), {
                    currentlyShowing: r
                }
            })
        },
        clearCurrentlyShowing: t => {
            e(e => {
                if (!e.currentlyShowing.has(t)) return e;
                let n = new Map(e.currentlyShowing);
                return n.delete(t), {
                    currentlyShowing: n
                }
            })
        },
        setSelectedByPlacement: (t, n) => {
            e(e => {
                let r = e.selectedByPlacement.get(t);
                if (r ? .expId === n.expId && r.selectionScope === n.selectionScope) return e;
                let i = new Map(e.selectedByPlacement);
                return i.set(t, n), {
                    selectedByPlacement: i
                }
            })
        },
        clearSelectedByPlacement: t => {
            e(e => {
                if (!e.selectedByPlacement.has(t)) return e;
                let n = new Map(e.selectedByPlacement);
                return n.delete(t), {
                    selectedByPlacement: n
                }
            })
        },
        setProbeResult: (t, n, r) => {
            e(e => {
                let i = e.probeResults.get(t);
                if (i ? .[n] === r) return e;
                let a = new Map(e.probeResults);
                return a.set(t, { ...i,
                    [n]: r
                }), {
                    probeResults: a
                }
            })
        },
        clearProbeResult: (t, n) => {
            e(e => {
                let r = e.probeResults.get(t);
                if (!r || !(n in r)) return e;
                let {
                    [n]: i, ...a
                } = r, o = new Map(e.probeResults);
                return Object.keys(a).length === 0 ? o.delete(t) : o.set(t, a), {
                    probeResults: o
                }
            })
        },
        setSelectionTrace: (t, n) => {
            e(e => {
                let r = e.selectionTrace.get(t);
                if (r && R(r, n)) return e;
                let i = new Map(e.selectionTrace);
                return i.set(t, n), {
                    selectionTrace: i
                }
            })
        },
        clearSelectionTrace: t => {
            e(e => {
                if (!e.selectionTrace.has(t)) return e;
                let n = new Map(e.selectionTrace);
                return n.delete(t), {
                    selectionTrace: n
                }
            })
        }
    }), {
        name: `experience-storage`,
        storage: {
            getItem: e => {
                let t = W().getItem(e);
                if (!t) return null;
                let n = JSON.parse(t);
                return n.state.dismissedIds && (n.state.dismissedIds = new Set(n.state.dismissedIds)), n.state.shownIds && (n.state.shownIds = new Set(n.state.shownIds)), n.state.actionedIds && (n.state.actionedIds = new Set(n.state.actionedIds)), n.state.placementLastActionAt && (n.state.placementLastActionAt = new Map(n.state.placementLastActionAt)), n.state.tierLastActionAt && (n.state.tierLastActionAt = new Map(n.state.tierLastActionAt)), n.state.selectedByPlacement && (n.state.selectedByPlacement = new Map(n.state.selectedByPlacement)), n
            },
            setItem: (e, t) => {
                let n = { ...t,
                    state: { ...t.state,
                        dismissedIds: Array.from(t.state.dismissedIds ? ? new Set),
                        shownIds: Array.from(t.state.shownIds ? ? new Set),
                        actionedIds: Array.from(t.state.actionedIds ? ? new Set),
                        placementLastActionAt: Array.from(t.state.placementLastActionAt ? ? new Map),
                        tierLastActionAt: Array.from(t.state.tierLastActionAt ? ? new Map),
                        selectedByPlacement: Array.from(t.state.selectedByPlacement ? ? new Map)
                    }
                };
                W().setItem(e, JSON.stringify(n))
            },
            removeItem: e => {
                W().removeItem(e)
            }
        },
        partialize: ({
            currentlyShowing: e,
            mountedCallers: t,
            probeResults: n,
            selectionTrace: r,
            ...i
        }) => i
    })),
    K = `ef_url_overrides`,
    q = `ef_force`,
    J = `ef_clear`,
    ge = `ef_trace`;

function Y(e) {
    return e === `1` || e === `true`
}

function X() {
    return window.localStorage
}

function _e() {
    if (typeof window > `u`) return [];
    let e = null;
    try {
        e = X().getItem(K)
    } catch {
        return []
    }
    if (!e) return [];
    try {
        let t = JSON.parse(e);
        if (Array.isArray(t) && t.every(e => typeof e == `string`)) return t
    } catch {}
    try {
        X().removeItem(K)
    } catch {}
    return []
}

function ve(e) {
    if (!(typeof window > `u`)) try {
        e.length === 0 ? X().removeItem(K) : X().setItem(K, JSON.stringify(e))
    } catch {}
}

function ye(e) {
    return typeof window > `u` || !e ? !1 : Y(new URLSearchParams(window.location.search).get(ge))
}

function be(e) {
    if (typeof window > `u` || !e) return;
    let t = new URLSearchParams(window.location.search);
    if (!t.has(q) && !t.has(J)) return;
    t.delete(q), t.delete(J);
    let n = t.toString(),
        r = `${window.location.pathname}${n?`?${n}`:``}${window.location.hash}`;
    try {
        window.history.replaceState(window.history.state, ``, r)
    } catch {}
}

function xe() {
    let e = new URLSearchParams(window.location.search),
        t = Y(e.get(J));
    return {
        keys: e.getAll(q).filter(e => e.length > 0),
        shouldClear: t
    }
}

function Se(e) {
    if (typeof window > `u` || !e) return new Set;
    let {
        keys: t,
        shouldClear: n
    } = xe(), r = n ? [] : _e(), i = new Set([...r, ...t]);
    return (n || t.length > 0) && ve([...i]), i
}

function Z() {
    let e = f(),
        t = p(),
        n = e.useLocale(),
        r = e.usePathname(),
        i = m(),
        {
            orgUuid: a,
            isAnt: o = !1
        } = e.useAccount(),
        s = (0, x.useMemo)(() => Se(o), [o]);
    (0, x.useEffect)(() => {
        be(o)
    }, [o, s]);
    let {
        data: c,
        isLoading: l
    } = Fe(i, n), u = l || !a, d = e.useDynamicConfig(`ef_placement_config`, {}, E), h = G(S(e => ({
        dismissedIds: e.dismissedIds,
        actionedIds: e.actionedIds,
        shownIds: e.shownIds,
        placementLastActionAt: e.placementLastActionAt,
        tierLastActionAt: e.tierLastActionAt,
        lastGlobalActionAt: e.lastGlobalActionAt
    }))), g = (0, x.useMemo)(() => {
        let e = new Map;
        h.lastGlobalActionAt !== null && e.set(D({
            kind: `global`
        }), h.lastGlobalActionAt);
        for (let [t, n] of h.tierLastActionAt) e.set(D({
            kind: `tier`,
            key: t
        }), n);
        for (let [t, n] of h.placementLastActionAt) e.set(D({
            kind: `placement`,
            key: t
        }), n);
        return {
            dismissedIds: h.dismissedIds,
            actionedIds: h.actionedIds,
            shownIds: h.shownIds,
            lastActionAt: e
        }
    }, [h]);
    return {
        ctx: (0, x.useMemo)(() => ({
            experiences: c ? .experiences ? ? [],
            rules: c ? .rules,
            pathname: r,
            placementConfig: d,
            defaultAllowedPaths: t,
            store: g,
            forcedKeys: s,
            now: Date.now()
        }), [c ? .experiences, c ? .rules, d, t, g, r, s]),
        isLoading: u,
        isAnt: o
    }
}

function Ce(e, t = {}) {
    let {
        clientEligibility: n,
        selectionScope: r,
        probesSettled: i = !0
    } = t, a = h(), o = d()(), s = a || o || (t.disabled ? ? !1), {
        setCurrentlyShowing: c,
        clearCurrentlyShowing: l,
        setSelectedByPlacement: u,
        incrementMountedCallers: f,
        decrementMountedCallers: p
    } = G.getState(), {
        ctx: m,
        isLoading: g,
        isAnt: _
    } = Z(), {
        currentlyShowing: v,
        selectedByPlacement: y
    } = G(S(e => ({
        currentlyShowing: e.currentlyShowing,
        selectedByPlacement: e.selectedByPlacement
    }))), b = (0, x.useMemo)(() => m ? { ...m,
        clientEligibility: n
    } : null, [m, n]), C = (0, x.useMemo)(() => b ? te(e, b) : null, [b, e]), w = (0, x.useMemo)(() => {
        if (s || !b) return null;
        if (C) return C;
        let t = y.get(e);
        if (t && t.selectionScope === r) {
            let n = b.experiences.find(n => n.id === t.expId && n.placement_key === e);
            if (n && N(n, { ...b,
                    clientEligibility: void 0
                })) return n
        }
        return i ? ee(e, b) : null
    }, [s, C, i, b, y, e, r]);
    (0, x.useLayoutEffect)(() => (f(e), () => {
        p(e) === 0 && l(e)
    }), [e, f, p, l]), (0, x.useLayoutEffect)(() => {
        w && !C ? c(e, w) : l(e)
    }, [e, w, C, c, l]);
    let T = (0, x.useMemo)(() => m ? M(v, m.experiences).has(e) : !1, [m, v, e]) || C ? w : null;
    return (0, x.useEffect)(() => {
        if (!_) return;
        let {
            setSelectionTrace: t,
            selectionTrace: n
        } = G.getState(), r = b ? ce(e, b) : [], a, o, c = T ? T.key ? ? T.id : void 0;
        if (g) a = `loading`;
        else if (s) a = `disabled`;
        else if (C) a = `forced`;
        else if (T !== null) a = `shown`;
        else if (r.length === 0) a = `no-candidates`;
        else if (!i) a = `probes-loading`;
        else if (w === null) a = `all-blocked`;
        else {
            a = `priority-lost`;
            let e = b ? [...M(v, b.experiences)].filter(e => v.get(e) ? .tier !== `ambient`) : [];
            o = e.length ? `winner: ${e.join(`, `)}` : void 0
        }
        let l = a !== `shown` || c === void 0 ? r : r.map(e => e.key === c && e.gate !== null ? { ...e,
                gate: null,
                detail: void 0
            } : e),
            u = n.get(e),
            d = {
                verdict: a,
                pickedKey: c,
                detail: o,
                candidates: l
            },
            f = u === void 0 || !R(u, d);
        t(e, d), f && ye(_)
    }, [_, g, s, C, i, e, b, w, T, v]), (0, x.useEffect)(() => {
        if (_) return () => {
            let {
                mountedCallers: t,
                clearSelectionTrace: n
            } = G.getState();
            (t.get(e) ? ? 0) === 0 && n(e)
        }
    }, [_, e]), (0, x.useEffect)(() => {
        w && !C && u(e, {
            expId: w.id,
            selectionScope: r
        })
    }, [w, C, e, r, u]), T
}
var we = () => {
        let e = f(),
            {
                orgUuid: t
            } = e.useAccount(),
            n = e.loadShed ? ? !1;
        return r({
            mutationFn: r => !t || n ? Promise.resolve({
                success: !1
            }) : e.apiClient.trackExperience(t, r)
        })
    },
    Q = i();

function Te(e) {
    return typeof e == `object` && !!e && (`nativeEvent` in e || `_reactName` in e || `type` in e && `target` in e && `currentTarget` in e)
}

function $(e) {
    return typeof e == `boolean` || e === void 0 ? e : e.isLoading ? void 0 : e.isTargeted
}
var Ee = {},
    De = [];

function Oe(e) {
    let {
        ctx: t
    } = Z();
    return (0, x.useMemo)(() => t ? .experiences.filter(t => t.placement_key === e) ? ? De, [t ? .experiences, e])
}

function ke({
    placementKey: e,
    entryKey: t,
    useTargeting: n,
    targetingContext: r
}) {
    let i = $(n(r)),
        {
            setProbeResult: a,
            clearProbeResult: o
        } = G.getState();
    return (0, x.useLayoutEffect)(() => (a(e, t, i), () => {
        (G.getState().mountedCallers.get(e) ? ? 0) <= 1 && o(e, t)
    }), [e, t, i, a, o]), null
}

function Ae({
    placementKey: e,
    experience: t,
    usePlacementTargeting: n,
    targetingContext: r
}) {
    let i = $(n(t, r)),
        a = t.key ? ? t.id,
        {
            setProbeResult: o,
            clearProbeResult: s
        } = G.getState();
    return (0, x.useLayoutEffect)(() => (o(e, a, i), () => {
        (G.getState().mountedCallers.get(e) ? ? 0) <= 1 && s(e, a)
    }), [e, a, i, o, s]), null
}

function je(e, t, n, r, i) {
    let {
        clientEligibility: a,
        probesSettled: o,
        selectionScope: s,
        visible: c
    } = i, l = (0, x.useMemo)(() => new Set(t.filter(([, e]) => e.componentLoader !== void 0).map(([e]) => e)), [t]), {
        isEnterprise: u
    } = f().useAccount(), {
        ctx: d,
        isLoading: p
    } = Z(), {
        mutate: m
    } = we(), h = (0, x.useMemo)(() => new Set(t.map(([e]) => e)), [t]), g = Ce(e, {
        clientEligibility: a,
        probesSettled: o,
        selectionScope: s,
        disabled: u && !r && t.length === 0
    }), _ = g !== null && (g.key !== void 0 && l.has(g.key) || g.template_key != null && n.has(g.template_key) && g.content != null), v = g !== null && u && !r && !h.has(g.key ? ? ``);
    (0, x.useEffect)(() => {
        if (g && (!_ || v)) {
            let {
                markNotTargeted: t,
                clearCurrentlyShowing: n
            } = G.getState();
            t(g.id), n(e)
        }
    }, [g, _, v, e]);
    let y = (0, x.useRef)(null);
    (0, x.useEffect)(() => {
        if (!g || !_ || v || c === !1 || a ? .[g.key ? ? g.id] === !1) return;
        let {
            shownIds: t,
            markShown: n,
            currentlyShowing: r
        } = G.getState();
        t.has(g.id) || y.current === g.id || d && !M(r, d.experiences).has(e) || (y.current = g.id, m({
            experience_uuid: g.id,
            action: `shown`,
            metadata: {
                enabled: g.enabled
            }
        }), n(g.id))
    }, [g, _, v, c, a, d, e, m]);
    let b = (0, x.useCallback)(() => {
            if (!g) return;
            let {
                dismissedIds: e,
                markDismissed: t
            } = G.getState();
            e.has(g.id) || (m({
                experience_uuid: g.id,
                action: `dismissed`,
                metadata: {
                    enabled: g.enabled
                }
            }), t(g, {
                skipGlobalCooldown: g.tier === `ambient`
            }))
        }, [g, m]),
        S = (0, x.useCallback)(e => {
            if (!g) return;
            let {
                actionedIds: t,
                markActioned: n
            } = G.getState();
            if (t.has(g.id)) return;
            let r = Te(e) ? void 0 : e;
            m({
                experience_uuid: g.id,
                action: `actioned`,
                metadata: {
                    enabled: g.enabled,
                    ...r
                }
            }), n(g, {
                skipGlobalCooldown: g.tier === `ambient`
            })
        }, [g, m]);
    return {
        state: p ? `loading` : g === null || !_ || v ? `hidden` : g.enabled === !1 ? `control` : `shown`,
        exp: _ && !v ? g : null,
        onDismiss: b,
        onAction: S
    }
}

function Me(e, t, n, r, i) {
    if (e.length === 0 && t === void 0) return;
    let a = {};
    for (let [o, s] of e) {
        let e = i || (s.enterpriseAllowed ? ? !1),
            c = r && !e;
        a[o] = (s.useTargeting !== void 0 || (t ? .has(o) ? ? !1) ? n[o] ? ? !1 : !0) && !c
    }
    if (t) {
        let e = r && !i;
        for (let r of t) r in a || (a[r] = (n[r] ? ? !1) && !e)
    }
    return a
}

function Ne(e) {
    let {
        placementKey: t,
        experienceComponents: n = {},
        templateComponents: r = {},
        usePlacementTargeting: i,
        enterpriseAllowed: a = !1
    } = e, o = Object.entries(n), s = new Map(o), c = new Set(Object.keys(r)), l = Object.fromEntries(o.map(([e, t]) => [e, t.componentLoader ? (0, x.lazy)(t.componentLoader) : void 0])), p = Object.fromEntries(Object.entries(r).map(([e, t]) => [e, (0, x.lazy)(t)])), m = (0, x.memo)(({
        targetingContext: e,
        selectionScope: n,
        render: r,
        visible: m
    }) => {
        let g = h(),
            _ = d()(),
            {
                isEnterprise: v
            } = f().useAccount(),
            y = Oe(t),
            b = (0, x.useMemo)(() => new Set(y.map(e => e.key ? ? e.id)), [y]),
            C = G(S(e => e.probeResults.get(t) ? ? Ee)),
            w = je(t, o, c, a, {
                clientEligibility: (0, x.useMemo)(() => Me(o, i === void 0 ? void 0 : b, C, v, a), [b, C, v]),
                probesSettled: (0, x.useMemo)(() => {
                    if (!o.every(([e, t]) => t.useTargeting === void 0 || !b.has(e) || C[e] !== void 0)) return !1;
                    if (i === void 0) return !0;
                    for (let e of b)
                        if (s.get(e) ? .useTargeting === void 0 && C[e] === void 0) return !1;
                    return !0
                }, [b, C]),
                selectionScope: n,
                visible: m
            }),
            {
                state: T,
                exp: E,
                onDismiss: D,
                onAction: O
            } = w,
            k = g || _,
            A = k ? null : (0, Q.jsxs)(Q.Fragment, {
                children: [o.map(([n, r]) => r.useTargeting && b.has(n) ? (0, Q.jsx)(ke, {
                    placementKey: t,
                    entryKey: n,
                    useTargeting: r.useTargeting,
                    targetingContext: e
                }, n) : null), i && y.map(n => n.key == null || s.get(n.key) ? .useTargeting === void 0 ? (0, Q.jsx)(Ae, {
                    placementKey: t,
                    experience: n,
                    usePlacementTargeting: i,
                    targetingContext: e
                }, n.key ? ? n.id) : null)]
            });
        if (r) return (0, Q.jsxs)(Q.Fragment, {
            children: [A, (0, Q.jsx)(u, {
                children: r(w)
            })]
        });
        if (k) return null;
        let j = null;
        if ((T === `shown` || T === `control`) && E) {
            let e = E.key === void 0 ? void 0 : l[E.key];
            if (e) j = (0, Q.jsx)(e, {
                enabled: E.enabled !== !1,
                onDismiss: D,
                onAction: O
            });
            else if (E.template_key && E.content) {
                let e = p[E.template_key];
                e && (j = (0, Q.jsx)(e, {
                    experienceKey: E.key ? ? E.id,
                    experienceId: E.id,
                    content: E.content,
                    enabled: E.enabled !== !1,
                    onDismiss: D,
                    onAction: O
                }))
            }
        }
        return (0, Q.jsxs)(Q.Fragment, {
            children: [A, (0, Q.jsx)(u, {
                children: j !== null && E ? (0, Q.jsx)(x.Suspense, {
                    fallback: null,
                    children: j
                }, E.id) : null
            })]
        })
    });
    return m.displayName = `Placement(${t})`, {
        Placement: m
    }
}
var Pe = `experiences`,
    Fe = (e, t) => {
        let r = f(),
            {
                orgUuid: i
            } = r.useAccount(),
            a = r.useFeatureGate(`ef_enabled`),
            o = r.loadShed ? ? !1;
        return n({
            queryKey: [Pe, {
                orgUuid: i,
                platform: e,
                locale: t
            }],
            queryFn: () => r.apiClient.fetchExperiences(i, e, t),
            enabled: !!i && a && !o,
            staleTime: 3600 * 1e3,
            refetchOnWindowFocus: !1,
            retry: !1
        })
    };
export {
    Ne as t
};
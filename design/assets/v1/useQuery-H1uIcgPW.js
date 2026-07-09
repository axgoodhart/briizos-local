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
    $t as r,
    Qt as i,
    Yt as a,
    Zt as o,
    an as s,
    cn as c,
    dn as l,
    en as u,
    fn as d,
    in as f,
    ln as p,
    nn as m,
    on as h,
    pn as g,
    sn as _,
    un as v
} from "./index-DxZs6uan.js";
var y = class extends g {
    constructor(e, t) {
        super(), this.options = t, this.#e = e, this.#s = null, this.#o = r(), this.bindMethods(), this.setOptions(t)
    }#
    e;#
    t = void 0;#
    n = void 0;#
    r = void 0;#
    i;#
    a;#
    o;#
    s;#
    c;#
    l;#
    u;#
    d;#
    f;#
    p;#
    m = new Set;
    bindMethods() {
        this.refetch = this.refetch.bind(this)
    }
    onSubscribe() {
        this.listeners.size === 1 && (this.#t.addObserver(this), x(this.#t, this.options) ? this.#h() : this.updateResult(), this.#y())
    }
    onUnsubscribe() {
        this.hasListeners() || this.destroy()
    }
    shouldFetchOnReconnect() {
        return S(this.#t, this.options, this.options.refetchOnReconnect)
    }
    shouldFetchOnWindowFocus() {
        return S(this.#t, this.options, this.options.refetchOnWindowFocus)
    }
    destroy() {
        this.listeners = new Set, this.#b(), this.#x(), this.#t.removeObserver(this)
    }
    setOptions(e) {
        let t = this.options,
            n = this.#t;
        if (this.options = this.#e.defaultQueryOptions(e), this.options.enabled !== void 0 && typeof this.options.enabled != `boolean` && typeof this.options.enabled != `function` && typeof h(this.options.enabled, this.#t) != `boolean`) throw Error(`Expected enabled to be a boolean or a callback that returns a boolean`);
        this.#S(), this.#t.setOptions(this.options), t._defaulted && !c(this.options, t) && this.#e.getQueryCache().notify({
            type: `observerOptionsUpdated`,
            query: this.#t,
            observer: this
        });
        let r = this.hasListeners();
        r && C(this.#t, n, this.options, t) && this.#h(), this.updateResult(), r && (this.#t !== n || h(this.options.enabled, this.#t) !== h(t.enabled, this.#t) || _(this.options.staleTime, this.#t) !== _(t.staleTime, this.#t)) && this.#g();
        let i = this.#_();
        r && (this.#t !== n || h(this.options.enabled, this.#t) !== h(t.enabled, this.#t) || i !== this.#p) && this.#v(i)
    }
    getOptimisticResult(e) {
        let t = this.#e.getQueryCache().build(this.#e, e),
            n = this.createResult(t, e);
        return T(this, n) && (this.#r = n, this.#a = this.options, this.#i = this.#t.state), n
    }
    getCurrentResult() {
        return this.#r
    }
    trackResult(e, t) {
        return new Proxy(e, {
            get: (e, n) => (this.trackProp(n), t ? .(n), n === `promise` && (this.trackProp(`data`), !this.options.experimental_prefetchInRender && this.#o.status === `pending` && this.#o.reject(Error(`experimental_prefetchInRender feature flag is not enabled`))), Reflect.get(e, n))
        })
    }
    trackProp(e) {
        this.#m.add(e)
    }
    getCurrentQuery() {
        return this.#t
    }
    refetch({ ...e
    } = {}) {
        return this.fetch({ ...e
        })
    }
    fetchOptimistic(e) {
        let t = this.#e.defaultQueryOptions(e),
            n = this.#e.getQueryCache().build(this.#e, t);
        return n.fetch().then(() => this.createResult(n, t))
    }
    fetch(e) {
        return this.#h({ ...e,
            cancelRefetch: e.cancelRefetch ? ? !0
        }).then(() => (this.updateResult(), this.#r))
    }#
    h(e) {
        this.#S();
        let t = this.#t.fetch(this.options, e);
        return e ? .throwOnError || (t = t.catch(f)), t
    }#
    g() {
        this.#b();
        let e = _(this.options.staleTime, this.#t);
        if (u.isServer() || this.#r.isStale || !m(e)) return;
        let t = v(this.#r.dataUpdatedAt, e) + 1;
        this.#d = l.setTimeout(() => {
            this.#r.isStale || this.updateResult()
        }, t)
    }#
    _() {
        return (typeof this.options.refetchInterval == `function` ? this.options.refetchInterval(this.#t) : this.options.refetchInterval) ? ? !1
    }#
    v(e) {
        this.#x(), this.#p = e, !(u.isServer() || h(this.options.enabled, this.#t) === !1 || !m(this.#p) || this.#p === 0) && (this.#f = l.setInterval(() => {
            (this.options.refetchIntervalInBackground || d.isFocused()) && this.#h()
        }, this.#p))
    }#
    y() {
        this.#g(), this.#v(this.#_())
    }#
    b() {
        this.#d !== void 0 && (l.clearTimeout(this.#d), this.#d = void 0)
    }#
    x() {
        this.#f !== void 0 && (l.clearInterval(this.#f), this.#f = void 0)
    }
    createResult(e, t) {
        let n = this.#t,
            i = this.options,
            a = this.#r,
            c = this.#i,
            l = this.#a,
            u = e === n ? this.#n : e.state,
            {
                state: d
            } = e,
            f = { ...d
            },
            p = !1,
            m;
        if (t._optimisticResults) {
            let r = this.hasListeners(),
                a = !r && x(e, t),
                s = r && C(e, n, t, i);
            (a || s) && (f = { ...f,
                ...o(d.data, e.options)
            }), t._optimisticResults === `isRestoring` && (f.fetchStatus = `idle`)
        }
        let {
            error: g,
            errorUpdatedAt: _,
            status: v
        } = f;
        m = f.data;
        let y = !1;
        if (t.placeholderData !== void 0 && m === void 0 && v === `pending`) {
            let e;
            a ? .isPlaceholderData && t.placeholderData === l ? .placeholderData ? (e = a.data, y = !0) : e = typeof t.placeholderData == `function` ? t.placeholderData(this.#u ? .state.data, this.#u) : t.placeholderData, e !== void 0 && (v = `success`, m = s(a ? .data, e, t), p = !0)
        }
        if (t.select && m !== void 0 && !y)
            if (a && m === c ? .data && t.select === this.#c) m = this.#l;
            else try {
                this.#c = t.select, m = t.select(m), m = s(a ? .data, m, t), this.#l = m, this.#s = null
            } catch (e) {
                this.#s = e
            }
        this.#s && (g = this.#s, m = this.#l, _ = Date.now(), v = `error`);
        let b = f.fetchStatus === `fetching`,
            S = v === `pending`,
            T = v === `error`,
            E = S && b,
            D = m !== void 0,
            O = {
                status: v,
                fetchStatus: f.fetchStatus,
                isPending: S,
                isSuccess: v === `success`,
                isError: T,
                isInitialLoading: E,
                isLoading: E,
                data: m,
                dataUpdatedAt: f.dataUpdatedAt,
                error: g,
                errorUpdatedAt: _,
                failureCount: f.fetchFailureCount,
                failureReason: f.fetchFailureReason,
                errorUpdateCount: f.errorUpdateCount,
                isFetched: e.isFetched(),
                isFetchedAfterMount: f.dataUpdateCount > u.dataUpdateCount || f.errorUpdateCount > u.errorUpdateCount,
                isFetching: b,
                isRefetching: b && !S,
                isLoadingError: T && !D,
                isPaused: f.fetchStatus === `paused`,
                isPlaceholderData: p,
                isRefetchError: T && D,
                isStale: w(e, t),
                refetch: this.refetch,
                promise: this.#o,
                isEnabled: h(t.enabled, e) !== !1
            };
        if (this.options.experimental_prefetchInRender) {
            let t = O.data !== void 0,
                i = O.status === `error` && !t,
                a = e => {
                    i ? e.reject(O.error) : t && e.resolve(O.data)
                },
                o = () => {
                    a(this.#o = O.promise = r())
                },
                s = this.#o;
            switch (s.status) {
                case `pending`:
                    e.queryHash === n.queryHash && a(s);
                    break;
                case `fulfilled`:
                    (i || O.data !== s.value) && o();
                    break;
                case `rejected`:
                    (!i || O.error !== s.reason) && o();
                    break
            }
        }
        return O
    }
    updateResult() {
        let e = this.#r,
            t = this.createResult(this.#t, this.options);
        this.#i = this.#t.state, this.#a = this.options, this.#i.data !== void 0 && (this.#u = this.#t), !c(t, e) && (this.#r = t, this.#C({
            listeners: (() => {
                if (!e) return !0;
                let {
                    notifyOnChangeProps: t
                } = this.options, n = typeof t == `function` ? t() : t;
                if (n === `all` || !n && !this.#m.size) return !0;
                let r = new Set(n ? ? this.#m);
                return this.options.throwOnError && r.add(`error`), Object.keys(this.#r).some(t => {
                    let n = t;
                    return this.#r[n] !== e[n] && r.has(n)
                })
            })()
        }))
    }#
    S() {
        let e = this.#e.getQueryCache().build(this.#e, this.options);
        if (e === this.#t) return;
        let t = this.#t;
        this.#t = e, this.#n = e.state, this.hasListeners() && (t ? .removeObserver(this), e.addObserver(this))
    }
    onQueryUpdate() {
        this.updateResult(), this.hasListeners() && this.#y()
    }#
    C(e) {
        i.batch(() => {
            e.listeners && this.listeners.forEach(e => {
                e(this.#r)
            }), this.#e.getQueryCache().notify({
                query: this.#t,
                type: `observerResultsUpdated`
            })
        })
    }
};

function b(e, t) {
    return h(t.enabled, e) !== !1 && e.state.data === void 0 && !(e.state.status === `error` && h(t.retryOnMount, e) === !1)
}

function x(e, t) {
    return b(e, t) || e.state.data !== void 0 && S(e, t, t.refetchOnMount)
}

function S(e, t, n) {
    if (h(t.enabled, e) !== !1 && _(t.staleTime, e) !== `static`) {
        let r = typeof n == `function` ? n(e) : n;
        return r === `always` || r !== !1 && w(e, t)
    }
    return !1
}

function C(e, t, n, r) {
    return (e !== t || h(r.enabled, e) === !1) && (!n.suspense || e.state.status !== `error`) && w(e, n)
}

function w(e, t) {
    return h(t.enabled, e) !== !1 && e.isStaleByTime(_(t.staleTime, e))
}

function T(e, t) {
    return !c(e.getCurrentResult(), t)
}
n();
var E = e(t(), 1),
    D = E.createContext(!1),
    O = () => E.useContext(D);
D.Provider;

function k() {
    let e = !1;
    return {
        clearReset: () => {
            e = !1
        },
        reset: () => {
            e = !0
        },
        isReset: () => e
    }
}
var A = E.createContext(k()),
    j = () => E.useContext(A),
    M = (e, t, n) => {
        let r = n ? .state.error && typeof e.throwOnError == `function` ? p(e.throwOnError, [n.state.error, n]) : e.throwOnError;
        (e.suspense || e.experimental_prefetchInRender || r) && (t.isReset() || (e.retryOnMount = !1))
    },
    N = e => {
        E.useEffect(() => {
            e.clearReset()
        }, [e])
    },
    P = ({
        result: e,
        errorResetBoundary: t,
        throwOnError: n,
        query: r,
        suspense: i
    }) => e.isError && !t.isReset() && !e.isFetching && r && (i && e.data === void 0 || p(n, [e.error, r])),
    F = e => {
        if (e.suspense) {
            let t = 1e3,
                n = e => e === `static` ? e : Math.max(e ? ? t, t),
                r = e.staleTime;
            e.staleTime = typeof r == `function` ? (...e) => n(r(...e)) : n(r), typeof e.gcTime == `number` && (e.gcTime = Math.max(e.gcTime, t))
        }
    },
    I = (e, t) => e.isLoading && e.isFetching && !t,
    L = (e, t) => e ? .suspense && t.isPending,
    R = (e, t, n) => t.fetchOptimistic(e).catch(() => {
        n.clearReset()
    });

function z(e, t, n) {
    let r = O(),
        o = j(),
        s = a(n),
        c = s.defaultQueryOptions(e);
    s.getDefaultOptions().queries ? ._experimental_beforeQuery ? .(c);
    let l = s.getQueryCache().get(c.queryHash);
    c._optimisticResults = r ? `isRestoring` : `optimistic`, F(c), M(c, o, l), N(o);
    let d = !s.getQueryCache().get(c.queryHash),
        [p] = E.useState(() => new t(s, c)),
        m = p.getOptimisticResult(c),
        h = !r && e.subscribed !== !1;
    if (E.useSyncExternalStore(E.useCallback(e => {
            let t = h ? p.subscribe(i.batchCalls(e)) : f;
            return p.updateResult(), t
        }, [p, h]), () => p.getCurrentResult(), () => p.getCurrentResult()), E.useEffect(() => {
            p.setOptions(c)
        }, [c, p]), L(c, m)) throw R(c, p, o);
    if (P({
            result: m,
            errorResetBoundary: o,
            throwOnError: c.throwOnError,
            query: l,
            suspense: c.suspense
        })) throw m.error;
    return s.getDefaultOptions().queries ? ._experimental_afterQuery ? .(c, m), c.experimental_prefetchInRender && !u.isServer() && I(m, r) && (d ? R(c, p, o) : l ? .promise) ? .catch(f).finally(() => {
        p.updateResult()
    }), c.notifyOnChangeProps ? m : p.trackResult(m)
}

function B(e, t) {
    return z(e, y, t)
}
export {
    B as t
};
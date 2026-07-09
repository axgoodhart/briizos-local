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
    a as r,
    o as i,
    r as a
} from "./schemas-DgQq6Z5S.js";
import {
    Q as o,
    Yt as s
} from "./index-DxZs6uan.js";
import {
    r as c
} from "./client-BkAIwXnN.js";
var l = e(t()),
    u = i({
        minProjectCount: r().int().nonnegative(),
        placements: i({
            chin: a(),
            postShare: a(),
            postExport: a(),
            settings: a().optional()
        })
    });

function d() {
    let {
        value: e
    } = o(`__gb__2319326955`);
    return (0, l.useMemo)(() => {
        if (e == null) return null;
        let t = u.safeParse(e);
        return t.success ? t.data : null
    }, [e])
}

function f(e, t, n) {
    return e === null ? !0 : e.placements[t] ? n === void 0 || n.items.length >= e.minProjectCount || n.cursor !== null : !1
}
var p = [
    [`projects`, void 0, ``],
    [`projects`, `mine`, ``]
];

function m(e) {
    let t = d(),
        n = s(),
        r;
    for (let e of p) {
        let t = n.getQueryData(e);
        if (t) {
            r = t;
            break
        }
    }
    return f(t, e, r)
}
var h = [`referral`, `eligibility`];

function g(e) {
    let {
        data: t
    } = n({
        queryKey: h,
        queryFn: () => c().getReferralEligibility({}),
        enabled: e ? .enabled ? ? !0,
        staleTime: 6e4
    });
    return {
        eligible: t ? .eligible ? ? !1,
        shareLink: t ? .shareLink,
        remaining: t ? .remaining,
        limit: t ? .limit,
        termsUrl: t ? .termsUrl
    }
}
export {
    d as n, m as r, g as t
};
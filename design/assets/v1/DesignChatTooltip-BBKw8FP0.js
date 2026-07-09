import {
    o as e
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    d as t,
    h as n
} from "./client-lite-BraEm36W.js";
import {
    t as r
} from "./react-BthIFXYf.js";
import {
    S as i
} from "./useOrg-DgFJtzUv.js";
import {
    t as a
} from "./jsx-runtime-DDrWIXeu.js";
import {
    t as o
} from "./hooks-dYpRZMxP.js";
import {
    c as s,
    o as c,
    t as l
} from "./schemas-DgQq6Z5S.js";
import {
    hn as u
} from "./index-DxZs6uan.js";
import {
    T as d
} from "./client-BkAIwXnN.js";
import {
    t as f
} from "./platform-BciTLfG8.js";
import {
    classifyHref as p,
    t as m
} from "./DesignSpotlight-DgbyBcYz.js";
var h = c({
        text: s(),
        type: l([`href`, `model`]),
        value: s()
    }),
    g = c({
        type: l([`model-selector`, `add-menu`]),
        nuxText: s(),
        nuxBadgeText: s().optional(),
        ctaAction: h.optional()
    }),
    _ = e(r(), 1),
    v = a();

function y(e) {
    return e.type === `model-selector` ? {
        nuxText: e.nuxText,
        nuxBadgeText: e.nuxBadgeText,
        cta: e.ctaAction ? {
            text: e.ctaAction.text
        } : void 0
    } : `unsupported`
}

function b({
    content: e,
    enabled: r,
    onAction: a,
    onDismiss: o
}) {
    let s = u(),
        c = i(),
        l = (0, _.useMemo)(() => g.safeParse(e), [e]);
    (0, _.useEffect)(() => {
        l.success || t(`design.experience_framework.template_parse_error`, {
            attrs: {
                template: `design-chat-tooltip-v1`
            }
        })
    }, [l]);
    let h = (0, _.useMemo)(() => l.success ? y(l.data) : void 0, [l]);
    return (0, _.useEffect)(() => {
        h === `unsupported` && t(`design.experience_framework.unsupported_tooltip_type`, {
            attrs: {
                type: l.success ? l.data.type : void 0
            }
        })
    }, [h, l]), n(`chat-tooltip:cta`, (0, _.useCallback)(() => {
        if (!l.success || !l.data.ctaAction) return;
        let {
            type: e,
            value: n
        } = l.data.ctaAction;
        if (e === `model`) {
            let r = m(n, c);
            if (r.action !== `apply`) {
                t(`design.experience_framework.model_cta_skipped`, {
                    attrs: {
                        reason: r.reason
                    }
                });
                return
            }
            a({
                actionType: e,
                actionValue: n
            }), f.updateSettings({
                model: r.id
            }), d(`composer:set-model`, {
                id: r.id,
                via: `coachmark`
            })
        } else if (e === `href`) {
            a({
                actionType: e,
                actionValue: n
            });
            let r = p(n);
            r === void 0 ? t(`design.experience_framework.unsafe_href`, {
                attrs: {
                    template: `design-chat-tooltip-v1`
                }
            }) : r.kind === `internal` ? s(r.path) : r.kind === `same-origin-external` ? window.location.assign(r.href) : window.open(r.href, `_blank`, `noopener,noreferrer`)
        }
    }, [l, c, s, a])), n(`chat-tooltip:dismissed`, () => o()), (0, _.useEffect)(() => {
        if (!(!r || !h || h === `unsupported`)) return d(`composer:set-chat-tooltip`, h), () => {
            d(`composer:clear-chat-tooltip`)
        }
    }, [r, h]), null
}
var {
    Placement: x
} = o({
    placementKey: `design-chat-tooltip`,
    templateComponents: {
        "design-chat-tooltip-v1": () => Promise.resolve({
            default: b
        })
    }
});

function S() {
    return (0, v.jsx)(x, {})
}
export {
    S as DesignChatTooltipPlacement, y as toTooltipDetail
};
import {
    t as e
} from "./jsx-runtime-DDrWIXeu.js";
import {
    Rn as t
} from "./format-ZLL9BhVd.js";
import {
    Jt as n
} from "./index-DxZs6uan.js";
import {
    g as r
} from "./connectrpc-BRKh2K0Y.js";
var i = e(),
    a = 56,
    o = e => e ? Math.min(120, Math.max(36, Math.round(a * e))) : void 0;

function s({
    attachments: e,
    projectPath: s,
    onRemove: c
}) {
    return e.length === 0 ? null : (0, i.jsx)(`div`, {
        className: `flex flex-wrap items-start gap-1.5 mt-1.5`,
        children: e.map(e => {
            let l = o(e.aspectRatio) ? ? (e.uploading ? Math.round(a * 1.75) : void 0);
            return (0, i.jsxs)(`div`, {
                title: e.uploading ? `${e.name} (uploading…)` : e.name,
                className: `group relative rounded-md overflow-hidden border border-om-border-default bg-om-bg-muted`,
                style: {
                    height: a,
                    ...l !== void 0 && {
                        width: l
                    },
                    ...e.uploading ? {
                        opacity: .6
                    } : {},
                    transition: `width 0.15s ease`
                },
                children: [(e.previewUrl || e.path) && (0, i.jsx)(`img`, {
                    src: e.previewUrl ? ? (e.path ? t(e.path) ? ? r(s, e.path) : void 0),
                    alt: e.name,
                    className: `block h-full min-w-[36px] max-w-[120px] object-cover`,
                    style: l === void 0 ? void 0 : {
                        width: `100%`,
                        maxWidth: `none`
                    }
                }), (0, i.jsx)(`button`, {
                    type: `button`,
                    onClick: () => c(e.id),
                    "aria-label": `Remove image`,
                    className: `absolute top-[3px] right-[3px] flex p-0.5 rounded-full bg-[rgba(0,0,0,0.6)] text-white cursor-pointer opacity-0 transition-opacity duration-100 group-hover:opacity-100`,
                    children: (0, i.jsx)(n, {
                        name: `X`,
                        size: 9
                    })
                })]
            }, e.id)
        })
    })
}
export {
    s as t
};
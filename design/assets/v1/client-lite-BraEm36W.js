const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/v1/datadog-rum-B5WH0SNY.js", "assets/v1/rolldown-runtime-CMxvf4Kt.js"]))) => i.map(i => d[i]);
import {
    o as e,
    t
} from "./rolldown-runtime-CMxvf4Kt.js";
import {
    t as n
} from "./preload-helper-7XptfjGJ.js";
import {
    t as r
} from "./react-BthIFXYf.js";
var i, a = !1,
    o = !1,
    s = [];

function c() {
    return o
}
var l = 500,
    u = `design.thumbnail.capture_svg_failed`,
    d = `design.thumbnail.capture_skipped`,
    f = new Set([u, d, `design.page.load`, `design.page_load`, `design.chat.send`, `design.project.open`, `design.project.create`, `design.file.save`, `design.preview.render`, `design.project.export`]);

function p(e, t) {
    return e === `addAction` ? f.has(t[0]) ? 2 : 0 : e === `addTiming` ? 1 : e === `setTrackingConsent` ? 4 : 3
}

function m(e, t) {
    if (!(typeof window > `u`)) {
        if (i) {
            i[e](...t);
            return
        }
        if (!a) {
            if (s.length >= l) {
                let n = p(e, t),
                    r = -1;
                for (let e = 0; e < n && r === -1; e++) r = s.findIndex(([t, n]) => p(t, n) === e);
                if (r === -1) return;
                s.splice(r, 1)
            }
            s.push([e, t])
        }
    }
}

function h(e) {
    return { ...e,
        queued_at_ms: Math.round(performance.now())
    }
}
var g = {
    addAction: (...e) => m(`addAction`, i ? e : [e[0], h(e[1])]),
    addTiming: (e, t) => m(`addTiming`, [e, t ? ? (i ? void 0 : performance.now())]),
    addError: (...e) => m(`addError`, i ? e : [e[0], h(e[1])]),
    setGlobalContextProperty: (...e) => m(`setGlobalContextProperty`, e),
    addFeatureFlagEvaluation: (...e) => m(`addFeatureFlagEvaluation`, e),
    setUser: (...e) => m(`setUser`, e),
    clearUser: (...e) => m(`clearUser`, e),
    setTrackingConsent: (...e) => m(`setTrackingConsent`, e)
};
async function _(e) {
    if (typeof window > `u` || i || a) return;
    let t;
    o = !0;
    try {
        ({
            datadogRum: t
        } = await n(() =>
            import (`./datadog-rum-B5WH0SNY.js`).then(e => e.t), __vite__mapDeps([0, 1]))), t.init(e)
    } catch {
        a = !0, s.length = 0;
        return
    } finally {
        o = !1
    }
    i = t;
    for (let [e, t] of s) try {
        i[e](...t)
    } catch {}
    s.length = 0
}
var v = t((e => {
        Object.defineProperty(e, "__esModule", {
            value: !0
        }), e.parse = s, e.stringifySetCookie = c, e.serialize = c, e.stringifySetCookie = c, e.serialize = c;
        var t = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/,
            n = /^[\u0021-\u003A\u003C-\u007E]*$/,
            r = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i,
            i = /^[\u0020-\u003A\u003D-\u007E]*$/,
            a = Object.prototype.toString,
            o = (() => {
                let e = function() {};
                return e.prototype = Object.create(null), e
            })();

        function s(e, t) {
            let n = new o,
                r = e.length;
            if (r < 2) return n;
            let i = t ? .decode || f,
                a = 0;
            do {
                let t = u(e, a, r);
                if (t === -1) break;
                let o = l(e, a, r);
                if (t > o) {
                    a = e.lastIndexOf(`;`, t - 1) + 1;
                    continue
                }
                let s = d(e, a, t);
                n[s] === void 0 && (n[s] = i(d(e, t + 1, o))), a = o + 1
            } while (a < r);
            return n
        }

        function c(e, a, o) {
            let s = typeof e == `object` ? e : { ...o,
                    name: e,
                    value: String(a)
                },
                c = (typeof a == `object` ? a : o) ? .encode || encodeURIComponent;
            if (!t.test(s.name)) throw TypeError(`argument name is invalid: ${s.name}`);
            let l = s.value ? c(s.value) : ``;
            if (!n.test(l)) throw TypeError(`argument val is invalid: ${s.value}`);
            let u = s.name + `=` + l;
            if (s.maxAge !== void 0) {
                if (!Number.isInteger(s.maxAge)) throw TypeError(`option maxAge is invalid: ${s.maxAge}`);
                u += `; Max-Age=` + s.maxAge
            }
            if (s.domain) {
                if (!r.test(s.domain)) throw TypeError(`option domain is invalid: ${s.domain}`);
                u += `; Domain=` + s.domain
            }
            if (s.path) {
                if (!i.test(s.path)) throw TypeError(`option path is invalid: ${s.path}`);
                u += `; Path=` + s.path
            }
            if (s.expires) {
                if (!p(s.expires) || !Number.isFinite(s.expires.valueOf())) throw TypeError(`option expires is invalid: ${s.expires}`);
                u += `; Expires=` + s.expires.toUTCString()
            }
            if (s.httpOnly && (u += `; HttpOnly`), s.secure && (u += `; Secure`), s.partitioned && (u += `; Partitioned`), s.priority) switch (typeof s.priority == `string` ? s.priority.toLowerCase() : void 0) {
                case `low`:
                    u += `; Priority=Low`;
                    break;
                case `medium`:
                    u += `; Priority=Medium`;
                    break;
                case `high`:
                    u += `; Priority=High`;
                    break;
                default:
                    throw TypeError(`option priority is invalid: ${s.priority}`)
            }
            if (s.sameSite) switch (typeof s.sameSite == `string` ? s.sameSite.toLowerCase() : s.sameSite) {
                case !0:
                case `strict`:
                    u += `; SameSite=Strict`;
                    break;
                case `lax`:
                    u += `; SameSite=Lax`;
                    break;
                case `none`:
                    u += `; SameSite=None`;
                    break;
                default:
                    throw TypeError(`option sameSite is invalid: ${s.sameSite}`)
            }
            return u
        }

        function l(e, t, n) {
            let r = e.indexOf(`;`, t);
            return r === -1 ? n : r
        }

        function u(e, t, n) {
            let r = e.indexOf(`=`, t);
            return r < n ? r : -1
        }

        function d(e, t, n) {
            let r = t,
                i = n;
            do {
                let t = e.charCodeAt(r);
                if (t !== 32 && t !== 9) break
            } while (++r < i);
            for (; i > r;) {
                let t = e.charCodeAt(i - 1);
                if (t !== 32 && t !== 9) break;
                i--
            }
            return e.slice(r, i)
        }

        function f(e) {
            if (e.indexOf(`%`) === -1) return e;
            try {
                return decodeURIComponent(e)
            } catch {
                return e
            }
        }

        function p(e) {
            return a.call(e) === `[object Date]`
        }
    })),
    y = t(((e, t) => {
        var n = `Expected a function`,
            r = NaN,
            i = `[object Symbol]`,
            a = /^\s+|\s+$/g,
            o = /^[-+]0x[0-9a-f]+$/i,
            s = /^0b[01]+$/i,
            c = /^0o[0-7]+$/i,
            l = parseInt,
            u = typeof global == `object` && global && global.Object === Object && global,
            d = typeof self == `object` && self && self.Object === Object && self,
            f = u || d || Function(`return this`)(),
            p = Object.prototype.toString,
            m = Math.max,
            h = Math.min,
            g = function() {
                return f.Date.now()
            };

        function _(e, t, r) {
            var i, a, o, s, c, l, u = 0,
                d = !1,
                f = !1,
                p = !0;
            if (typeof e != `function`) throw TypeError(n);
            t = x(t) || 0, v(r) && (d = !!r.leading, f = `maxWait` in r, o = f ? m(x(r.maxWait) || 0, t) : o, p = `trailing` in r ? !!r.trailing : p);

            function _(t) {
                var n = i,
                    r = a;
                return i = a = void 0, u = t, s = e.apply(r, n), s
            }

            function y(e) {
                return u = e, c = setTimeout(C, t), d ? _(e) : s
            }

            function b(e) {
                var n = e - l,
                    r = e - u,
                    i = t - n;
                return f ? h(i, o - r) : i
            }

            function S(e) {
                var n = e - l,
                    r = e - u;
                return l === void 0 || n >= t || n < 0 || f && r >= o
            }

            function C() {
                var e = g();
                if (S(e)) return w(e);
                c = setTimeout(C, b(e))
            }

            function w(e) {
                return c = void 0, p && i ? _(e) : (i = a = void 0, s)
            }

            function T() {
                c !== void 0 && clearTimeout(c), u = 0, i = l = a = c = void 0
            }

            function E() {
                return c === void 0 ? s : w(g())
            }

            function D() {
                var e = g(),
                    n = S(e);
                if (i = arguments, a = this, l = e, n) {
                    if (c === void 0) return y(l);
                    if (f) return c = setTimeout(C, t), _(l)
                }
                return c === void 0 && (c = setTimeout(C, t)), s
            }
            return D.cancel = T, D.flush = E, D
        }

        function v(e) {
            var t = typeof e;
            return !!e && (t == `object` || t == `function`)
        }

        function y(e) {
            return !!e && typeof e == `object`
        }

        function b(e) {
            return typeof e == `symbol` || y(e) && p.call(e) == i
        }

        function x(e) {
            if (typeof e == `number`) return e;
            if (b(e)) return r;
            if (v(e)) {
                var t = typeof e.valueOf == `function` ? e.valueOf() : e;
                e = v(t) ? t + `` : t
            }
            if (typeof e != `string`) return e === 0 ? e : +e;
            e = e.replace(a, ``);
            var n = s.test(e);
            return n || c.test(e) ? l(e.slice(2), n ? 2 : 8) : o.test(e) ? r : +e
        }
        t.exports = _
    })),
    b = v(),
    x = e(r(), 1),
    S = e(y(), 1),
    C = typeof window < `u` ? x.useLayoutEffect : x.useEffect;

function w(e, t, n, r) {
    let i = (0, x.useRef)(t);
    C(() => {
        i.current = t
    }, [t]), (0, x.useEffect)(() => {
        let t = n ? .current ? ? window;
        if (!(t && t.addEventListener)) return;
        let a = e => {
            i.current(e)
        };
        return t.addEventListener(e, a, r), () => {
            t.removeEventListener(e, a, r)
        }
    }, [e, n, r])
}

function T(e, t) {
    let n = (0, x.useRef)(e);
    C(() => {
        n.current = e
    }, [e]), (0, x.useEffect)(() => {
        if (t === null) return;
        let e = setInterval(() => {
            n.current()
        }, t);
        return () => {
            clearInterval(e)
        }
    }, [t])
}

function E(e) {
    let t = (0, x.useRef)(() => {
        throw Error(`Cannot call an event handler while rendering.`)
    });
    return C(() => {
        t.current = e
    }, [e]), (0, x.useCallback)((...e) => t.current ? .call(t, ...e), [t])
}
var D = typeof window > `u`;

function O(e, t, n = {}) {
    let {
        initializeWithValue: r = !0
    } = n, i = (0, x.useCallback)(e => n.serializer ? n.serializer(e) : JSON.stringify(e), [n]), a = (0, x.useCallback)(e => {
        if (n.deserializer) return n.deserializer(e);
        if (e === `undefined`) return;
        let r = t instanceof Function ? t() : t,
            i;
        try {
            i = JSON.parse(e)
        } catch {
            return r
        }
        return i
    }, [n, t]), o = (0, x.useCallback)(() => {
        let n = t instanceof Function ? t() : t;
        if (D) return n;
        try {
            let t = window.localStorage.getItem(e);
            return t ? a(t) : n
        } catch {
            return n
        }
    }, [t, e, a]), [s, c] = (0, x.useState)(() => r ? o() : t instanceof Function ? t() : t), l = E(t => {
        try {
            let n = t instanceof Function ? t(o()) : t;
            window.localStorage.setItem(e, i(n)), c(n), window.dispatchEvent(new StorageEvent(`local-storage`, {
                key: e
            }))
        } catch {}
    }), u = E(() => {
        let n = t instanceof Function ? t() : t;
        window.localStorage.removeItem(e), c(n), window.dispatchEvent(new StorageEvent(`local-storage`, {
            key: e
        }))
    });
    (0, x.useEffect)(() => {
        c(o())
    }, [e]);
    let d = (0, x.useCallback)(t => {
        t.key && t.key !== e || c(o())
    }, [e, o]);
    return w(`storage`, d), w(`local-storage`, d), [s, l, u]
}
var k = typeof window > `u`;

function ee(e, {
    defaultValue: t = !1,
    initializeWithValue: n = !0
} = {}) {
    let r = e => k ? t : window.matchMedia(e).matches,
        [i, a] = (0, x.useState)(() => n ? r(e) : t);

    function o() {
        a(r(e))
    }
    return C(() => {
        let t = window.matchMedia(e);
        return o(), t.addListener ? t.addListener(o) : t.addEventListener(`change`, o), () => {
            t.removeListener ? t.removeListener(o) : t.removeEventListener(`change`, o)
        }
    }, [e]), i
}

function te(e) {
    let t = (0, x.useRef)(e);
    t.current = e, (0, x.useEffect)(() => () => {
        t.current()
    }, [])
}

function A(e, t = 500, n) {
    let r = (0, x.useRef)();
    te(() => {
        r.current && r.current.cancel()
    });
    let i = (0, x.useMemo)(() => {
        let i = (0, S.default)(e, t, n),
            a = (...e) => i(...e);
        return a.cancel = () => {
            i.cancel()
        }, a.isPending = () => !!r.current, a.flush = () => i.flush(), a
    }, [e, t, n]);
    return (0, x.useEffect)(() => {
        r.current = (0, S.default)(e, t, n)
    }, [e, t, n]), i
}

function j(e, t, n) {
    let r = n ? .equalityFn ? ? ((e, t) => e === t),
        i = e instanceof Function ? e() : e,
        [a, o] = (0, x.useState)(i),
        s = (0, x.useRef)(i),
        c = A(o, t, n);
    return r(s.current, i) || (c(i), s.current = i), [a, c]
}

function M() {
    let e = (0, x.useRef)(!1);
    return (0, x.useEffect)(() => (e.current = !0, () => {
        e.current = !1
    }), []), (0, x.useCallback)(() => e.current, [])
}

function N(e, t, n = `mousedown`, r = {}) {
    w(n, n => {
        let r = n.target;
        !r || !r.isConnected || (Array.isArray(e) ? e.filter(e => !!e.current).every(e => e.current && !e.current.contains(r)) : e.current && !e.current.contains(r)) && t(n)
    }, void 0, r)
}
var P = {
    width: void 0,
    height: void 0
};

function F(e) {
    let {
        ref: t,
        box: n = `content-box`
    } = e, [{
        width: r,
        height: i
    }, a] = (0, x.useState)(P), o = M(), s = (0, x.useRef)({ ...P
    }), c = (0, x.useRef)(void 0);
    return c.current = e.onResize, (0, x.useEffect)(() => {
        if (!t.current || typeof window > `u` || !(`ResizeObserver` in window)) return;
        let e = new ResizeObserver(([e]) => {
            let t = n === `border-box` ? `borderBoxSize` : n === `device-pixel-content-box` ? `devicePixelContentBoxSize` : `contentBoxSize`,
                r = I(e, t, `inlineSize`),
                i = I(e, t, `blockSize`);
            if (s.current.width !== r || s.current.height !== i) {
                let e = {
                    width: r,
                    height: i
                };
                s.current.width = r, s.current.height = i, c.current ? c.current(e) : o() && a(e)
            }
        });
        return e.observe(t.current, {
            box: n
        }), () => {
            e.disconnect()
        }
    }, [n, t, o]), {
        width: r,
        height: i
    }
}

function I(e, t, n) {
    return e[t] ? Array.isArray(e[t]) ? e[t][0][n] : e[t][n] : t === `contentBoxSize` ? e.contentRect[n === `inlineSize` ? `width` : `height`] : void 0
}
var ne = typeof window > `u`;

function re(e, t, n = {}) {
    let {
        initializeWithValue: r = !0
    } = n, i = (0, x.useCallback)(e => n.serializer ? n.serializer(e) : JSON.stringify(e), [n]), a = (0, x.useCallback)(e => {
        if (n.deserializer) return n.deserializer(e);
        if (e === `undefined`) return;
        let r = t instanceof Function ? t() : t,
            i;
        try {
            i = JSON.parse(e)
        } catch {
            return r
        }
        return i
    }, [n, t]), o = (0, x.useCallback)(() => {
        let n = t instanceof Function ? t() : t;
        if (ne) return n;
        try {
            let t = window.sessionStorage.getItem(e);
            return t ? a(t) : n
        } catch {
            return n
        }
    }, [t, e, a]), [s, c] = (0, x.useState)(() => r ? o() : t instanceof Function ? t() : t), l = E(t => {
        try {
            let n = t instanceof Function ? t(o()) : t;
            window.sessionStorage.setItem(e, i(n)), c(n), window.dispatchEvent(new StorageEvent(`session-storage`, {
                key: e
            }))
        } catch {}
    }), u = E(() => {
        let n = t instanceof Function ? t() : t;
        window.sessionStorage.removeItem(e), c(n), window.dispatchEvent(new StorageEvent(`session-storage`, {
            key: e
        }))
    });
    (0, x.useEffect)(() => {
        c(o())
    }, [e]);
    let d = (0, x.useCallback)(t => {
        t.key && t.key !== e || c(o())
    }, [e, o]);
    return w(`storage`, d), w(`session-storage`, d), [s, l, u]
}
var L = new Set;

function R() {
    for (let e of L)
        if (e()) return !0;
    return !1
}

function ie(e) {
    let t = (0, x.useRef)(e);
    t.current = e, (0, x.useEffect)(() => {
        let e = () => typeof t.current == `function` ? t.current() : t.current;
        return L.add(e), () => {
            L.delete(e)
        }
    }, []), w(`beforeunload`, t => {
        (typeof e == `function` ? e() : e) && (t.preventDefault(), t.returnValue = ``)
    })
}
var z = new Set(`turn_id,message_id,action_id,experience_id,project_id_hash,namesHash,tool_name,prev_tool_name,tool,op,subagent,subagent_kind,ok,result_kind,result_reason,stop_reason,screenshot_opt_in,input_chars_log2,same_path_as_prev_call,ttft_ms,model_time_ms,thinking_ms,responding_ms,tool_time_ms,toolbox_wait_ms,toolbox_wait_timed_out,send_acquire_ms,pre_send_flush_ms,start_turn_setup_ms,build_system_prompt_ms,load_transcript_ms,count_tokens_ms,active_duration_ms,suspended_ms,elapsed_ms,retry_wait_ms,time_in_background_ms,threshold_ms,duration_ms,iteration_count,iteration_idx,iterations,tool_call_count,agent_worker_mode,verifier_forked,is_resume,resume_kind,adaptive_effort,adaptive_thinking,token_mitigations,ds_folder_pinned,root_listing_seeded,done_ends_turn_on,model,from_model,to_model,effort,input_tokens,output_tokens,thinking_tokens,usage_thinking_tokens,cache_read_input_tokens,cache_creation_input_tokens,input_total,tokens,tokens_log2,ratio,hit,round,open_hours,idle_minutes,hidden,aborted,code,category,retried,reattempt,fieldPath,verdict,directed,parse_path,has_description,needs_work_streak,unparsed_cause,unknown_cause,raw_len,had_open_tag,had_close_tag,had_parameter_block,had_json,fail_stage,settle_ms,capture_ms,upload_ms,queued_ms,rate_waited_ms,coalesced,upload_ok,steps,hq,bytes,format,capture_w,capture_h,label,savings,paper_page,px_page,authored_width,authored_height,frame_count,ds_skill_ms,create_rpc_ms,ds_count,tokens_est_log2,tokens_freed_log2,real_tokens_log2,est_target_log2,est_shortfall_log2,est_cut_log2,phase0_cut_log2,cache_read,registered_snips,total_registered,snips_applied,budget,budget_hit,budgetMs,reason_len,result_chars,n_edits,request_body_bytes,image_count,est_image_tokens,pct_used,max,protected_start,count,file_id_count,base64_count,omitted_count,flipped_count,status,card_count,sp_count,chat_count,message_count,turn_index,message_length,first_visible_kind,first_token_offset_ms,screen_count,components,families,source_files,unexposed_exports,duplicate_exports,unresolved,dropped_packages,bundle_bytes,findings,wrote,injected,refreshed,skipped,dropped,failed,placed,frames,len,payload_len,fontCount,tokenCount,themeScopeCount,closureSize,offScopeDecls,orphanKindComments,unknownKindAnnotations,unclassified,warnings,heapUsedMb,trigger,source,phase,mode,via,regime,reason,outcome,kind,type,cause,template,tab,access,view_mode,member_role,vote,dir,order,display,platform,cache,wm_permission,xml_error_kind,error_kind,file_ext,icon,granted,compiled,tight,threw,fell_back,rpc,realm,attempt,yielded,last_event_age_ms,pings_received,max_idle_gap_ms,hidden_at_terminal,effective_type,transport_error_class,online_at_death,probe_delay_ms,next_hop_protocol,is_retry,is_new_conversation,is_owner,claimed,has_file,has_notes,has_scope,has_xml_diagnostic,has_multiple_displays,on_other_display,with_screen_option,download_zip,via_mcp,popup_blocked,doc_hidden,parse_failed,write_failed,bundle_skipped,manifest_ok,legacy_assets,sentinel_present,stylesCss,typography,default,active_ttft_ms,was_hidden,anthropic.regime,anthropic.outcome,anthropic.budget_ms,was_unload,os_bucket,tool_class,substantive_tool_call_count,is_ds,ready,settled,settle_unavailable,blank_root,missing_refs,console_errors,logs_unavailable,check_html_refs_ms,pull_ds_assets_ms,await_viewport_ready_ms,await_app_settled_ms,validators_ms`.split(`,`)),
    B = null;

function V(e, t = {}) {
    if (B) try {
        B(e, t, Date.now())
    } catch {}
    if (typeof window > `u`) return;
    let n = {};
    for (let [e, r] of Object.entries(t.attrs ? ? {})) z.has(e) && (n[e] = r);
    n.duration_ms = t.duration, t.attrs ? .regime !== void 0 && (n[`anthropic.regime`] = t.attrs.regime), g.addAction(e, n), t.duration !== void 0 && t.viewTiming !== !1 && g.addTiming(e)
}

function H(e, t) {
    typeof window > `u` || g.addFeatureFlagEvaluation(e, t)
}
var U = `lastActiveOrg`,
    W = `lastActiveOrg changed mid-session; reloading`;

function G() {
    if (!(typeof document > `u`)) return (0, b.parse)(document.cookie)[U] || void 0
}
var K, q = !1,
    J = !1;

function Y(e) {
    R() || J || (J = !0, V(`design.org_guard_fired`, {
        attrs: {
            trigger: e
        }
    }), typeof window < `u` && window.location.reload())
}

function X() {
    if (K === void 0) return !1;
    let e = G();
    return e !== void 0 && e !== K
}

function ae() {
    if (q) return;
    if (K = G(), K === void 0) {
        q = !0;
        return
    }
    let e = e => {
        document.visibilityState === `visible` && X() && Y(e)
    };
    window.cookieStore ? .addEventListener(`change`, t => {
        t.changed.some(e => e.name === U) && e(`cookiestore`)
    }), document.addEventListener(`visibilitychange`, () => e(`visibility`)), window.addEventListener(`focus`, () => e(`focus`)), q = !0
}
var oe = `x-organization-uuid`,
    Z;

function se(e) {
    Z = e
}

function Q() {
    return Z
}
var $;

function ce(e) {
    $ = e
}

function le() {
    return $
}
export {
    d as C, g as E, u as S, _ as T, O as _, Q as a, F as b, ce as c, V as d, R as f, T as g, w as h, le as i, se as l, j as m, oe as n, X as o, ie as p, ae as r, Y as s, W as t, H as u, ee as v, c as w, re as x, N as y
};
import {
    r as e
} from "./rolldown-runtime-CMxvf4Kt.js";
var t = e({
        getHost: () => i,
        installHost: () => r
    }),
    n = typeof window < `u` ? {
        isWorker: !1,
        emitOmEvent(e, t) {
            window.dispatchEvent(new CustomEvent(e, {
                detail: t
            }))
        },
        onOmEvent(e, t) {
            let n = e => t(e.detail);
            return window.addEventListener(e, n), () => window.removeEventListener(e, n)
        },
        roundtrip(e) {
            return new Promise(t => {
                let n = () => {
                    r(), t({
                        ok: !1,
                        error: `Aborted`
                    })
                };

                function r() {
                    clearTimeout(i), window.removeEventListener(e.responseEvent, a), e.signal ? .removeEventListener(`abort`, n)
                }
                let i = setTimeout(() => {
                    r(), t({
                        ok: !1,
                        error: e.timeoutError
                    })
                }, e.timeout);

                function a(n) {
                    let i = n.detail;
                    if (e.filter && !e.filter(i)) return;
                    r();
                    let a = e.reject ? .(i);
                    t(a ? {
                        ok: !1,
                        error: a
                    } : {
                        ok: !0,
                        value: e.extract(i)
                    })
                }
                window.addEventListener(e.responseEvent, a), e.signal ? .addEventListener(`abort`, n, {
                    once: !0
                }), window.dispatchEvent(new CustomEvent(e.dispatch.name, {
                    detail: e.dispatch.detail
                }))
            })
        },
        execToolInTab() {
            return Promise.reject(Error(`execToolInTab called from tab host`))
        },
        mirrorPreviewFile() {},
        broadcastSubagents() {},
        readSetting(e) {
            try {
                return localStorage.getItem(e) ? ? sessionStorage.getItem(e)
            } catch {
                return null
            }
        },
        trackTurnEvent(e, t, n, r) {
            window.dispatchEvent(new CustomEvent(`telemetry:track`, {
                detail: {
                    eventType: e,
                    properties: t,
                    chatId: n,
                    projectId: r
                }
            }))
        },
        reportSpan(e, t, n, r) {
            window.dispatchEvent(new CustomEvent(`telemetry:span`, {
                detail: {
                    name: e,
                    opts: t,
                    chatId: n,
                    projectId: r
                }
            }))
        },
        captureTranscript() {}
    } : {
        isWorker: !1,
        emitOmEvent() {},
        onOmEvent: () => () => {},
        roundtrip: () => Promise.resolve({
            ok: !1,
            error: `no host`
        }),
        execToolInTab: () => Promise.reject(Error(`no host`)),
        mirrorPreviewFile() {},
        broadcastSubagents() {},
        readSetting: () => null,
        trackTurnEvent() {},
        reportSpan() {},
        captureTranscript() {}
    };

function r(e) {
    n = e
}

function i() {
    return n
}
export {
    t as n, i as t
};
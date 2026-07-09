const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/v1/UPNG-B9BHKIzL.js", "assets/v1/rolldown-runtime-CMxvf4Kt.js"]))) => i.map(i => d[i]);
import {
    t as e
} from "./preload-helper-7XptfjGJ.js";
import {
    d as t
} from "./client-lite-BraEm36W.js";
import {
    Ln as n
} from "./connectrpc-BRKh2K0Y.js";
import {
    C as r
} from "./home-analytics-CvEfi_eq.js";
import {
    n as i
} from "./shared-BtICgni1.js";
var a = `#f0eee6`;

function o(e) {
    return e ? e.startsWith(`[data-comment-anchor=`) ? `anchor` : e.startsWith(`[data-om-id=`) ? `om-id` : e.includes(`:nth-child`) || e.includes(`:last-child`) ? `nth-child` : `other` : `none`
}

function s(e, t, n, r) {
    function i(n, i) {
        let a = t(n, i),
            o = a.content;
        if (!o || o === `none` || o === `normal`) return null;
        let s = e.createElement(`span`),
            c = ``;
        for (let e = 0; e < a.length; e++) {
            let t = a[e];
            c += t + `:` + a.getPropertyValue(t) + `;`
        }
        c += `animation:none;transition:none;`, s.setAttribute(`style`, c);
        let l;
        try {
            l = JSON.parse(o)
        } catch {}
        return typeof l == `string` ? s.textContent = l : r.push(`::before/::after content not rendered (only single quoted-string content is synthesized): ` + o), s
    }

    function a(o) {
        if (o.nodeType === 8) return e.createTextNode(``);
        if (o.nodeType !== 1) {
            let e = o.cloneNode(!1);
            for (let t = o.firstChild; t; t = t.nextSibling) e.appendChild(a(t));
            return e
        }
        let s = o,
            c = s.tagName.toUpperCase();
        if (c === `SCRIPT` || c === `STYLE` || s.hasAttribute(`data-omelette-chrome`) || s.hasAttribute(`data-noncommentable`)) return e.createTextNode(``);
        c === `IFRAME` && r.push(`<iframe> content is not captured (src=` + (s.getAttribute(`src`) || `about:blank`) + `)`);
        let l = s.cloneNode(!1),
            u = t(s),
            d = ``;
        for (let e = 0; e < u.length; e++) {
            let t = u[e];
            d += t + `:` + u.getPropertyValue(t) + `;`
        }
        if (d += `animation:none;transition:none;`, n && (s === e.documentElement || s === e.body) && (d += `background:transparent;`), l.setAttribute(`style`, d), c === `CANVAS`) try {
            let t = e.createElement(`img`);
            return t.src = s.toDataURL(), t.setAttribute(`style`, d), t
        } catch {
            r.push(`<canvas> could not be serialized (tainted by cross-origin content)`)
        }
        if (c === `VIDEO` && s.readyState >= 2) try {
            let t = s,
                n = e.createElement(`canvas`);
            n.width = t.videoWidth || t.clientWidth, n.height = t.videoHeight || t.clientHeight;
            let r = n.getContext(`2d`);
            if (r) {
                r.drawImage(t, 0, 0, n.width, n.height);
                let i = e.createElement(`img`);
                return i.src = n.toDataURL(), i.setAttribute(`style`, d), i.width = t.clientWidth, i.height = t.clientHeight, i
            }
        } catch {
            r.push(`<video> frame could not be serialized (tainted by cross-origin content)`)
        }
        if (c === `SVG` && s.ownerSVGElement == null && s.hasAttribute(`data-om-exportable-video-with-duration-secs`)) {
            let t = s.querySelector(`foreignObject`);
            if (t) try {
                let n = e.createElement(`div`);
                n.setAttribute(`style`, d);
                for (let e = t.firstChild; e; e = e.nextSibling) n.appendChild(a(e));
                return n
            } catch (e) {
                r.push(`inline <svg><foreignObject> could not be unwrapped: ` + (e && e.message || String(e)))
            }
        }
        let f = i(s, `::before`);
        f && l.appendChild(f);
        let p;
        if (s.shadowRoot) p = s.shadowRoot.childNodes;
        else if (c === `SLOT`) {
            let e = s.assignedNodes({
                flatten: !0
            });
            p = e.length ? e : s.childNodes
        } else p = s.childNodes;
        for (let e = 0; e < p.length; e++) {
            let t = p[e];
            t && l.appendChild(a(t))
        }
        let m = i(s, `::after`);
        return m && l.appendChild(m), l
    }
    return a
}
var c = `(async function(){
  try{await document.fonts.ready}catch(e){}
  // rAF-gated FOUC guards (deck-stage) can outlive fonts.ready in a hidden
  // iframe where rAF is throttled; the opacity:0 would bake into the clone.
  document.querySelectorAll('[data-fonts-pending]').forEach(function(el){el.removeAttribute('data-fonts-pending')});
  var warn=[];
  var vp=__VP__;
  var root=document.documentElement;
  var fw=root.scrollWidth,fh=root.scrollHeight;
  var w=vp?root.clientWidth:fw,h=vp?root.clientHeight:fh;
  var crop=__CROP__;
  // Spliced matte (see buildCaptureScript): optional opaque color ('' =
  // off) for thumbnail captures of canvas-mode documents. The injected
  // canvas backdrop tracks the APP theme, so a dark-mode session would
  // otherwise bake a dark matte into thumbnails that mostly render on
  // light gallery tiles. Normalized in the captured raster only — the live
  // document is never touched (re-theming it for a capture visibly flashes
  // the preview): the root/body backdrop is neutralized in the clone and
  // the matte painted flat behind the painted bounds. NOTE: never write
  // the spliced token's literal name in comments — splicing must hit the
  // declaration, not prose.
  var matte=__MATTE__;
  if(matte&&!root.hasAttribute('data-dc-canvas'))matte='';
  // Zero-area viewport (iframe not laid out / backgrounded tab): the crop
  // scan's getImageData would throw IndexSizeError and toDataURL returns
  // "data:,". Throw a named error so thumbnail callers can downgrade it to
  // a telemetry action instead of a browser error. Scoped to crop so
  // non-thumbnail captures are unaffected.
  if(crop&&(!w||!h))throw new Error('capture: zero-area viewport');
  var sx=vp?(window.scrollX||0):0,sy=vp?(window.scrollY||0):0;
  var scale=__SCALE__||Math.min(1,__MAX__/Math.max(w,h,1));

  // Cache across per-slide evals — the serve path sends no-store so the
  // browser's HTTP cache can't help, but the same assets recur every slide.
  // Only persists when runGenPptx has primed window.__omCaptureCache; other
  // capture callers get a per-invocation map so edits aren't served stale.
  var _dc=window.__omCaptureCache||{};
  function toDataURL(url){if(_dc[url])return Promise.resolve(_dc[url]);return fetch(url).then(function(r){if(!r.ok)throw new Error('http '+r.status);return r.blob()}).then(function(b){return new Promise(function(res){var fr=new FileReader();fr.onload=function(){res(_dc[url]=fr.result)};fr.onerror=function(){res(url)};fr.readAsDataURL(b)})}).catch(function(){return url})}

  async function inlineFonts(){
    var rules=[];
    for(var i=0;i<document.styleSheets.length;i++){
      var ss=document.styleSheets[i];
      var cssRules;try{cssRules=ss.cssRules}catch(e){
        // Cross-origin sheet without CORS (e.g. fonts.googleapis.com <link>
        // missing crossorigin attr) — fetch the CSS text directly (those
        // endpoints send ACAO:*) and regex-extract the @font-face blocks.
        if(ss.href){
          try{
            var txt=await fetch(ss.href).then(function(r){if(!r.ok)throw 0;return r.text()});
            var ff=txt.match(/@font-face\\s*{[^}]*}/g)||[];
            for(var k=0;k<ff.length;k++)rules.push({css:ff[k],base:ss.href});
          }catch(e2){warn.push('cross-origin stylesheet '+ss.href+' could not be read; its @font-face rules are not inlined and those fonts may fall back')}
        }
        continue
      }
      for(var j=0;j<cssRules.length;j++){
        var r=cssRules[j];
        if(r.type===CSSRule.FONT_FACE_RULE)rules.push({css:r.cssText,base:ss.href||location.href});
      }
    }
    if(!rules.length)return '';
    var parts=await Promise.all(rules.map(async function(rule){
      var re=/url\\((['"]?)([^'")]+)\\1\\)/g,m,out=rule.css,seen={};
      while((m=re.exec(rule.css))){
        var u=m[2];
        if(u.indexOf('data:')===0||seen[u])continue;
        seen[u]=1;
        var abs;try{abs=new URL(u,rule.base).href}catch(e){continue}
        var d=await toDataURL(abs);
        out=out.split(m[0]).join('url("'+d+'")');
      }
      return out;
    }));
    return '<style><![CDATA['+parts.join('\\n')+']]></style>';
  }

  async function inlineImages(node){
    var jobs=[];
    var imgs=node.querySelectorAll('img');
    for(var i=0;i<imgs.length;i++)(function(el){
      var src=el.getAttribute('src');
      if(src&&src.indexOf('data:')!==0)jobs.push(function(){return toDataURL(el.src).then(function(d){el.setAttribute('src',d)})});
    })(imgs[i]);
    var all=node.querySelectorAll('*');
    for(var j=0;j<all.length;j++)(function(el){
      var bg=el.style.backgroundImage;
      var m=bg&&bg.match(/url\\(["']?([^"')]+)["']?\\)/);
      if(m&&m[1].indexOf('data:')!==0)jobs.push(function(){return toDataURL(m[1]).then(function(d){el.style.backgroundImage='url('+d+')'})});
    })(all[j]);
    var cur=0,N=Math.min(6,jobs.length)||1;
    await Promise.all(Array.from({length:N},async function(){while(cur<jobs.length)await jobs[cur++]()}));
  }

  // Clone walk — embedded from makeCloneStyled (a real exported function,
  // so tests exercise it directly with no dynamic evaluation). Bound here,
  // after the matte gate above has finalized, with this run's warn collector.
  var cloneStyled=(${s.toString()})(document,getComputedStyle,matte,warn);
  // Font-CSS cache: like __omCaptureCache but for the assembled <style> string,
  // so repeat captures (video-export frame loop) skip the stylesheet scan +
  // string assembly entirely. Only persists when a caller has primed the slot
  // (set to null); otherwise recomputed so edits aren't served stale.
  var fontCss=window.__omCaptureFontCss;
  if(fontCss==null){fontCss=await inlineFonts();if(window.__omCaptureFontCss===null)window.__omCaptureFontCss=fontCss}
  var clone=cloneStyled(root);
  clone.setAttribute('xmlns','http://www.w3.org/1999/xhtml');
  await inlineImages(clone);
  var xml=new XMLSerializer().serializeToString(clone);
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'"><foreignObject x="'+(-sx)+'" y="'+(-sy)+'" width="'+fw+'" height="'+fh+'">'+fontCss+xml+'</foreignObject></svg>';
  var svgUrl='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);

  // On onerror, re-parse via DOMParser to surface the actual XML error
  // (line/col + reason). The bare 'svg load failed' gave the agent nothing
  // to act on; the parse diagnostic points at the DOM construct that broke
  // serialization so it can route around it.
  function xmlErr(){try{var e=new DOMParser().parseFromString(svg,'image/svg+xml').querySelector('parsererror');return e?': '+e.textContent.replace(/\\s+/g,' ').slice(0,200):''}catch(e){return ''}}
  var img=new Image();
  await new Promise(function(res,rej){img.onload=res;img.onerror=function(){rej(new Error('svg load failed'+xmlErr()))};img.src=svgUrl});
  var cv=document.createElement('canvas');
  cv.width=Math.round(w*scale);cv.height=Math.round(h*scale);
  var ctx=cv.getContext('2d');
  // Viewport-canvas background: html's bg, or body's when html is the
  // initial transparent (the browser's root-bg propagation rule), falling
  // back to white. The foreignObject only paints where the cloned <html>
  // box reaches, so a page smaller than the capture viewport would
  // otherwise leave empty space in the output.
  var xp=function(c){return !c||c==='transparent'||c==='rgba(0, 0, 0, 0)'};
  var bg=getComputedStyle(root).backgroundColor;
  if(xp(bg))bg=document.body?getComputedStyle(document.body).backgroundColor:'';
  bg=xp(bg)?'#fff':bg;
  if(matte)bg=matte;
  // Non-crop callers (model screenshot, pptx export) pad the empty space
  // with the page background. Crop callers (thumbnails) leave it
  // transparent so the alpha scan below can find the painted bounds.
  if(!crop){ctx.fillStyle=bg;ctx.fillRect(0,0,cv.width,cv.height);}
  ctx.scale(scale,scale);
  ctx.drawImage(img,0,0);
  if(crop){
    var W=cv.width,H=cv.height,d=ctx.getImageData(0,0,W,H).data;
    var x0=W,y0=H,x1=-1,y1=-1;
    for(var y=0;y<H;y++)for(var x=0;x<W;x++)if(d[(y*W+x)*4+3]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
    if(x1>=0){
      var cw=x1-x0+1,ch=y1-y0+1,cv2=document.createElement('canvas');
      cv2.width=cw;cv2.height=ch;
      var ctx2=cv2.getContext('2d');
      // #fff under bg: bg can be semi-transparent (xp() only catches fully-
      // transparent), and the JPEG fallback below would otherwise composite
      // those pixels onto black.
      ctx2.fillStyle='#fff';ctx2.fillRect(0,0,cw,ch);
      ctx2.fillStyle=bg;ctx2.fillRect(0,0,cw,ch);
      ctx2.drawImage(cv,x0,y0,cw,ch,0,0,cw,ch);
      cv=cv2;
    }else{ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);ctx.fillStyle=bg;ctx.fillRect(0,0,cv.width,cv.height);}
  }
  var fmt=__FMT__,q=__Q__,maxL=__CAP__,u=cv.toDataURL(fmt,q);
  // WebKit's canvas can't encode WebP — toDataURL silently returns PNG and
  // ignores quality. Re-encode as JPEG so the quality knob and the maxL
  // loop below actually bite; the bg fillRect above has already composited
  // any alpha onto an opaque background, so JPEG's alpha-drop is a no-op.
  if(fmt==='image/webp'&&u.indexOf('data:image/webp')!==0){fmt='image/jpeg';q=0.85;u=cv.toDataURL(fmt,q);}
  // Step quality, then halve dimensions once, until the data-URL fits the
  // caller's byte cap (SetProjectThumbnail's protovalidate max_bytes).
  while(maxL&&u.length>maxL&&q>0.3){q-=0.1;u=cv.toDataURL(fmt,q);}
  if(maxL&&u.length>maxL){var hv=document.createElement('canvas');hv.width=cv.width>>1||1;hv.height=cv.height>>1||1;hv.getContext('2d').drawImage(cv,0,0,hv.width,hv.height);cv=hv;u=cv.toDataURL(fmt,q);}
  return {u:u,w:warn.filter(function(v,i){return warn.indexOf(v)===i}),cw:cv.width,ch:cv.height};
})()`;

function l(e, t, n, r = 0, i = !1, a = !1, o = 0, s = ``) {
    return c.replaceAll(`__FMT__`, JSON.stringify(e)).replaceAll(`__Q__`, String(t)).replaceAll(`__MAX__`, String(n)).replaceAll(`__SCALE__`, String(r)).replaceAll(`__VP__`, i ? `1` : `0`).replaceAll(`__CROP__`, a ? `1` : `0`).replaceAll(`__CAP__`, String(o)).replaceAll(`__MATTE__`, JSON.stringify(s))
}

function u(o) {
    if (!o) return null;
    let s = o;

    function c(e, t = 1e4) {
        return new Promise((n, i) => {
            let a = Math.random().toString(36).slice(2),
                o = setTimeout(() => {
                    l(), i(Error(`executeJavaScript timed out (${t/1e3}s)`))
                }, t),
                c = e => {
                    if (!r(e, s)) return;
                    let t = e.data;
                    if (!(!t || !t.__om_eval_r || t.id !== a))
                        if (l(), t.ok)
                            if (t.v === void 0) n(void 0);
                            else try {
                                n(JSON.parse(t.v))
                            } catch (e) {
                                i(Error(`eval returned unparseable JSON: ${e instanceof Error?e.message:e}`))
                            } else i(Error(t.e || `eval failed`))
                },
                l = () => {
                    clearTimeout(o), window.removeEventListener(`message`, c)
                };
            window.addEventListener(`message`, c), s.contentWindow ? .postMessage({
                __om_eval: 1,
                id: a,
                code: e
            }, `*`)
        })
    }

    function u(e, t) {
        return c(e, t)
    }
    let d = new Map;
    return {
        reload() {
            u(`location.reload()`).catch(() => {
                let e = new URL(s.src, window.location.href);
                t(`design.preview.bridge_reload_fallback`), e.searchParams.set(`_r`, String(Date.now())), s.src = e.toString()
            })
        },
        setZoomFactor(e) {
            s.style.transform = `scale(${e})`, s.style.transformOrigin = `top left`, s.style.width = `${100/e}%`, s.style.height = `${100/e}%`
        },
        lockViewportSize(e, t) {
            let n = `data-genpptx-vplock`;
            s.setAttribute(n, ``);
            let r = document.createElement(`style`);
            return r.setAttribute(n, ``), r.textContent = `iframe[${n}]{width:${e}px!important;height:${t}px!important;max-width:none!important;max-height:none!important;transform:none!important}`, document.head.appendChild(r), () => {
                s.removeAttribute(n), r.remove()
            }
        },
        async executeJavaScript(e, t) {
            return u(e, t)
        },
        executeJavaScriptUnchecked(e) {
            u(e).catch(() => {})
        },
        async awaitSettled(e = 500) {
            let t = typeof e == `number` ? {
                    capMs: e
                } : e,
                n, r = new Promise(e => {
                    n = setTimeout(e, t.capMs)
                });
            try {
                await Promise.race([u(i(t), t.capMs + 1e3).then(() => {}, () => r), r])
            } finally {
                clearTimeout(n)
            }
        },
        capturePage(t) {
            return (async () => {
                if (t ? .thumbnail) {
                    let {
                        u: e,
                        w: t,
                        cw: n,
                        ch: r
                    } = await u(l(`image/webp`, .8, 640, 0, !0, !0, 19e4, a), 2e4);
                    return {
                        toDataURL: () => e,
                        warnings: t,
                        captureW: n,
                        captureH: r
                    }
                }
                if (!t ? .hq) {
                    let {
                        u: e,
                        w: n,
                        cw: r,
                        ch: i
                    } = await u(l(`image/jpeg`, .4, 2576, t ? .scale, t ? .viewport), 7e3);
                    return {
                        toDataURL: () => e,
                        warnings: n,
                        captureW: r,
                        captureH: i
                    }
                }
                let e = performance.now(),
                    {
                        u: n,
                        w: i,
                        cw: o,
                        ch: s
                    } = await u(l(`image/png`, 1, 2576, t ? .scale, t ? .viewport), t ? .timeoutMs ? ? 15e3);
                return t ? .raw ? {
                    toDataURL: () => n,
                    warnings: i,
                    captureW: o,
                    captureH: s
                } : { ...await r(n, e),
                    warnings: i,
                    captureW: o,
                    captureH: s
                }
            })();
            async function r(t, r) {
                performance.now();
                let i = t.slice(t.indexOf(`,`) + 1),
                    a = atob(i),
                    o = new Uint8Array(a.length);
                for (let e = 0; e < a.length; e++) o[e] = a.charCodeAt(e);
                o.length;
                let s = await e(() =>
                        import (`./UPNG-B9BHKIzL.js`), __vite__mapDeps([0, 1])),
                    c = s.default ? ? s,
                    l = c.decode(o.buffer),
                    u = c.toRGBA8(l)[0],
                    d = c.encode([u], l.width, l.height, 77),
                    f = new Uint8Array(d);
                if (performance.now(), f.length > 36e5) {
                    let e = new OffscreenCanvas(l.width, l.height);
                    e.getContext(`2d`).putImageData(new ImageData(new Uint8ClampedArray(u), l.width, l.height), 0, 0);
                    let t = await n(e, `image/webp`);
                    t.base64.length * 3 / 4;
                    let r = `data:${t.mediaType};base64,${t.base64}`;
                    return {
                        toDataURL: () => r
                    }
                }
                f.length;
                let p = ``;
                for (let e = 0; e < f.length; e++) p += String.fromCharCode(f[e]);
                let m = `data:image/png;base64,` + btoa(p);
                return {
                    toDataURL: () => m
                }
            }
        },
        addEventListener(e, t) {
            if (e === `dom-ready`) s.addEventListener(`load`, t);
            else if (e === `console-message`) {
                let e = e => {
                    if (!r(e, s)) return;
                    let n = e.data;
                    n ? .__omelette_log && n.type === `log` && t({
                        message: n.data
                    })
                };
                d.set(t, e), window.addEventListener(`message`, e)
            } else s.addEventListener(e, t)
        },
        removeEventListener(e, t) {
            if (e === `dom-ready`) s.removeEventListener(`load`, t);
            else if (e === `console-message`) {
                let e = d.get(t);
                e && (window.removeEventListener(`message`, e), d.delete(t))
            } else s.removeEventListener(e, t)
        }
    }
}
export {
    o as n, u as t
};
function e(e, t) {
    let n = document.createElement(`a`);
    n.href = e, n.download = t, document.body.appendChild(n), n.click(), n.remove()
}

function t(t, n) {
    let r = URL.createObjectURL(t);
    try {
        e(r, n)
    } finally {
        setTimeout(() => URL.revokeObjectURL(r), 1e3)
    }
}
var n = /filename\*=UTF-8'[^']*'([^;]+)/i,
    r = /filename="([^"]*)"/i,
    i = /filename=([^;"\s]+)/i;

function a(e, t) {
    if (!e) return t;
    let a = e.match(n);
    if (a) try {
        return decodeURIComponent(a[1])
    } catch {}
    let o = e.match(r);
    return o ? o[1] || t : e.match(i) ? .[1] || t
}
async function o(e, n) {
    let r = a(e.headers.get(`content-disposition`), n);
    t(await e.blob(), r)
}
var s = `(() => {
  var hide = function (root, sel) {
    var els = root.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) els[i].style.display = 'none';
  };
  hide(document, '[data-omelette-chrome]');
  // Per-project deck-stage.js is frozen at creation; older copies lack the
  // attribute, so the shadow-root pass also matches the known class names.
  var ds = document.querySelector('deck-stage');
  if (ds && ds.shadowRoot) hide(ds.shadowRoot,
    '[data-omelette-chrome],.overlay,.rail,.rail-resize,.ctxmenu,.confirm-backdrop');
})()`;

function c(e) {
    return l.replace(`__CAP__`, String(e.capMs)).replace(`__REVEAL__`, e.revealLazy ? `1` : `0`)
}
var l = `(async function(){
  var t0=performance.now(),cap=__CAP__,reveal=__REVEAL__;
  var left=function(){return Math.max(0,cap-(performance.now()-t0))};
  var race=function(p){return Promise.race([p,new Promise(function(r){setTimeout(r,left())})])};
  var fontsReady=false,imagesReady=false;
  await race(document.fonts.ready.then(function(){fontsReady=true}));
  if(reveal){
    try{
      var dets=document.querySelectorAll('details');
      for(var i=0;i<dets.length;i++)dets[i].open=true;
      var lz=document.querySelectorAll('img[loading="lazy"]');
      for(var j=0;j<lz.length;j++)lz[j].loading='eager';
      var sc=document.scrollingElement||document.documentElement;
      var full=Math.max(sc.scrollHeight,document.body.scrollHeight);
      var step=window.innerHeight||800;
      for(var y=0;y<=full&&left()>0;y+=step){
        window.scrollTo(0,y);
        await race(new Promise(function(r){requestAnimationFrame(r)}));
      }
      window.scrollTo(0,0);
    }catch(e){}
  }
  try{
    var imgs=document.images,p=[];
    for(var k=0;k<imgs.length;k++){
      var im=imgs[k];
      if(im.complete&&im.naturalWidth>0)continue;
      if(!reveal&&im.loading==='lazy')continue;
      if(typeof im.decode==='function')p.push(im.decode().catch(function(){}));
    }
    if(p.length)await race(Promise.all(p).then(function(){imagesReady=true}));
    else imagesReady=true;
  }catch(e){}
  await race(new Promise(function(r){requestAnimationFrame(function(){requestAnimationFrame(r)})}));
  return{fontsReady:fontsReady,imagesReady:imagesReady,timedOut:left()<=0};
})()`;

function u(e, t) {
    let n = (e.split(`/`).pop() ? ? e).replace(/(\.dc)?\.html?$/i, ``).replace(/\.napkin$/i, ``) || `design`;
    return t ? .slide == null ? n : `${n}-slide-${t.slide+1}`
}
export {
    o as a, t as i, c as n, e as o, u as r, s as t
};
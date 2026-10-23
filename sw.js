const CACHE="trainer-1237fd3fdc";
const PAGE="./";
const ASSETS=["./manifest.webmanifest","./icons/apple-touch-icon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png"];
// iOS Safari refuses a page response that went through a redirect ("Response served by service worker has redirections"),
// so always cache "./" (never ./index.html, which Cloudflare 308-redirects to /) and strip any redirect flag before use.
function clean(r){return r&&r.redirected?r.blob().then(b=>new Response(b,{status:r.status,statusText:r.statusText,headers:r.headers})):Promise.resolve(r)}
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.all([PAGE,...ASSETS].map(a=>fetch(a,{cache:"no-store"}).then(clean).then(r=>r&&r.ok?c.put(a,r):0).catch(()=>0)))))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
function cached(){return caches.match(PAGE).then(clean)}
function fromNet(req){return fetch(req.url,{cache:"no-store",credentials:"same-origin"}).then(clean).then(r=>{if(r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(PAGE,cp)).catch(()=>0)}return r})}
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;
 if(e.request.mode==="navigate"){e.respondWith(new Promise(res=>{let done=false;const net=fromNet(e.request);
  const fb=()=>cached().then(c=>{if(c&&!done){done=true;res(c)}}).catch(()=>0);
  const t=setTimeout(fb,4000);
  net.then(r=>{clearTimeout(t);if(!done){done=true;res(r)}}).catch(()=>{clearTimeout(t);cached().catch(()=>null).then(c=>{if(!done){done=true;res(c||Response.error())}})});
 }));return}
 if(u.pathname.endsWith("/sw.js"))return;
 e.respondWith(caches.match(e.request).then(r=>{const net=fetch(e.request).then(n=>{if(n.ok){const cp=n.clone();caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>0)}return n});return r||net}))});

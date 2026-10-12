'use strict';
const PREFIX='oneclick-ai:'+self.registration.scope+':';
const CACHE=PREFIX+'20261012-15';
const SHELL=['./','index.html','style.css?v=15','i18n.js?v=15','zip.js?v=15','app.js?v=15','retouch.js?v=15','pwa.js?v=15','image-worker.js?v=8','retouch-worker.js?v=13','manifest.json','favicon.ico','favicon-16x16.png','favicon-32x32.png','apple-touch-icon.png','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png'];
const ALLOWED=new Set(SHELL.map(p=>new URL(p,self.registration.scope).pathname));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL.map(p=>new Request(new URL(p,self.registration.scope),{cache:'reload'}))))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||!ALLOWED.has(url.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{const response=await fetch(req,{cache:'no-store'});if(response.ok){await cache.put(req,response.clone());return response;}const saved=await cache.match(req);return saved||response;}
  catch(error){const saved=await cache.match(req);if(saved)return saved;if(req.mode==='navigate')return (await cache.match(new URL('index.html',self.registration.scope)))||Response.error();return Response.error();}
 })());
});

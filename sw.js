const CACHE='kosti-final-v9';
const A=['./','./index.html','./styles.css?v=9','./app.js?v=9','./manifest.webmanifest','./assets/wood.svg','./assets/leather-black.svg','./assets/leather-red.svg','./assets/gold-frame.svg','./assets/button.svg','./assets/cup.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(A)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x))))])));
self.addEventListener('fetch',e=>e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request))));

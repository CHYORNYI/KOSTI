const CACHE='kosti-v7';
const A=['./','./index.html','./styles.css?v=7','./app.js?v=7','./manifest.webmanifest','./assets/wood.jpg','./assets/leather_black.jpg','./assets/leather_red.jpg','./assets/parchment.jpg','./assets/button.jpg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(A)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x))))])));
self.addEventListener('fetch',e=>e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request))));

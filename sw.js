self.addEventListener('install',e=>{
  e.waitUntil(caches.open('v1').then(c=>c.addAll(['','.','index.html','manifest.json','icon-192.png'])));
});
self.addEventListener('fetch',e=>{
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});

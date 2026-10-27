const V = 'xc-istore-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    // Archivos de la app: primero la red (para recibir mejoras), y sin internet, la copia guardada.
    e.respondWith(
      fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; })
        .catch(() => caches.match(r).then(m => m || caches.match('index.html')))
    );
  } else if (u.hostname.endsWith('googleapis.com') || u.hostname.endsWith('gstatic.com')) {
    // Fuentes: copia guardada primero, y se refresca en segundo plano.
    e.respondWith(caches.open(V).then(c => c.match(r).then(m => {
      const net = fetch(r).then(res => { c.put(r, res.clone()); return res; }).catch(() => m);
      return m || net;
    })));
  }
  // Las consultas de tasas (otros dominios) no se tocan: siempre van a internet.
});

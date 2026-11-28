const C = 'takt-v147';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  /* Die Seite selbst passt auch mit Zusatz in der Adresse (?neu=ausgabe vom Kurzbefehl), damit sie so auch ohne Netz startet; gespeichert wird sie nur ohne Zusatz */
  const nav = e.request.mode === 'navigate', plain = !nav || !new URL(e.request.url).search;
  e.respondWith(caches.match(e.request, { ignoreSearch: nav }).then(hit => {
    const net = fetch(e.request).then(r => {
      if (plain && r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); }
      return r;
    }).catch(() => hit);
    return hit || net;
  }));
});

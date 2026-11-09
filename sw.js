// Sistema LB · service worker (instalación como app + apertura sin conexión)
const V = 'lb-wms-v1';
const SHELL = ['./wms_multotec.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.hostname.endsWith('supabase.co')) return;            // los datos siempre van en vivo
  if (r.mode === 'navigate' || u.pathname.endsWith('.html')) { // la app: red primero (recibe las actualizaciones)
    e.respondWith(fetch(r).then(x => { const c = x.clone(); caches.open(V).then(ch => ch.put(r, c)); return x; })
      .catch(() => caches.match(r).then(m => m || caches.match('./wms_multotec.html'))));
    return;
  }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(x => {   // librerías y archivos propios: caché primero
    if (x && (x.ok || x.type === 'opaque')) { const c = x.clone(); caches.open(V).then(ch => ch.put(r, c)); }
    return x;
  })));
});

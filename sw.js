// Enkel offline-støtte: appens egne filer og Firebase-biblioteket hentes fra cache når nettet er borte.
// Data (Firestore) håndteres av Firebase selv, som lagrer lokalt og synker når nettet kommer tilbake.
const CACHE = 'slitsomt-v10';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'logic.js', 'avatar.js', 'store-firebase.js', 'store-local.js', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const ok = u.origin === location.origin || u.hostname === 'www.gstatic.com' || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if (!ok) return;
  // Nettet først (så oppdateringer vises med en gang), cache som reserve når nettet er borte.
  e.respondWith(caches.open(CACHE).then(async c => {
    try {
      const res = await fetch(r);
      if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone());
      return res;
    } catch (err) {
      const hit = await c.match(r);
      if (hit) return hit;
      throw err;
    }
  }));

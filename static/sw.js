// TWIN service worker — intentionally minimal.
// It exists ONLY to make the app installable (Add to Home Screen). It does NOT cache
// HTML pages, so an actively-developed app never serves a stale screen to a tester.
// Static assets fall back to a tiny cache only if the network is unavailable.
const CACHE = 'twin-static-v1';
const ASSETS = ['/static/twin_logo.png', '/static/twin_logo_180.png', '/static/twin_keel.png', '/static/axon_logo.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // never touch POSTs (check-ins, DMs, etc.)
  const url = new URL(req.url);
  // Static images: cache-first (fast, offline-safe). Everything else: straight to network (always fresh).
  if (url.pathname.startsWith('/static/') && /\.(png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
  // All pages/API: default network behavior — no HTML caching, no stale screens.
});

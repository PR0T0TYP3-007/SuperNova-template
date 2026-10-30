// Supernova service worker.
//
// Caches the static shell only (HTML, CSS, JS, fonts, images) so the app opens
// fast from the home screen and shows a friendly page when offline. Pages are
// network-first so updates appear straight away; assets carry ?v= versions so
// a stale copy is never served after a deploy. When the real API exists, its
// requests (and anything authenticated, checkout or payment) must bypass the
// cache entirely: see the `api/` check below.
const VERSION = 'sn-v2';
const SHELL = [
  './', './index.html', './food.html', './market.html', './laundry.html', './flights.html', './orders.html', './offline.html',
  './assets/favicon.svg', './assets/icons/icon-192.png', './manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never cache API calls or anything off our origin except fonts.
  if (url.pathname.includes('/api/')) return;
  const sameOrigin = url.origin === location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return;

  // Pages: network first, fall back to cache, then the offline page.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req)
      .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./offline.html'))));
    return;
  }

  // Assets: serve from cache, refresh in the background.
  e.respondWith(caches.match(req).then(hit => {
    const fresh = fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => hit);
    return hit || fresh;
  }));
});

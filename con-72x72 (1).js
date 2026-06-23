const CACHE = 'dabi-v1';
const SHELL = [
  './',
  './index.html',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Live API calls — network only, never cache
  if (
    url.hostname === 'nominatim.openstreetmap.org' ||
    url.hostname === 'api.aladhan.com'
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Cross-origin (fonts, CDN) — network only
  if (url.origin !== self.location.origin) return;

  // Same-origin — cache-first, fall back to network and cache the result
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});

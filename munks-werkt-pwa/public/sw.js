const CACHE = 'munks-werkt-shell-v3';
const SHELL = ['/', '/manifest.webmanifest', '/app-icon.svg'];
const STATIC_PATHS = new Set(['/manifest.webmanifest', '/app-icon.svg']);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Navigaties kunnen persoonsgegevens of sessiewaarden in de query bevatten.
  // Haal die altijd van het netwerk en gebruik alleen de queryloze shell als
  // offline terugval; sla de bezochte URL zelf nooit op.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/')));
    return;
  }

  // Alleen onveranderlijke websitebestanden zonder query zijn cachebaar.
  if (url.search || (!STATIC_PATHS.has(url.pathname) && !url.pathname.startsWith('/assets/'))) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && !response.headers.get('Cache-Control')?.toLowerCase().includes('no-store')) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(url.pathname, copy));
    }
    return response;
  }).catch(() => caches.match(url.pathname)));
});

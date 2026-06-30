/* ============================================================================
   IONITY — service worker. Makes the site an installable PWA that works offline.
   • App-shell precache on install (pages + key icons).
   • HTML = network-first (fresh content online; cached/offline fallback when not).
   • Versioned assets (?v=NN) = cache-first + background refresh (safe: a new ?v
     is a new URL, so updates are picked up automatically).
   • Cross-origin (fonts, CDNs, the Gemini API) passes straight through.
   ========================================================================== */
const VERSION = 'ionity-v66';
const SHELL = [
  '/', '/index.html', '/services.html', '/edge.html', '/about.html',
  '/faq.html', '/contact.html', '/privacy.html', '/terms.html', '/404.html',
  '/manifest.json',
  '/assets/img/favicon.ico', '/assets/img/icon-192.png', '/assets/img/icon-512.png',
  '/assets/img/ai-mark-white.png', '/assets/img/wordmark.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await Promise.allSettled(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' }))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // CDNs / fonts / API pass through

  // HTML navigations: network-first, fall back to cache, then to the cached home.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const c = await caches.open(VERSION); c.put(req, fresh.clone());
        return fresh;
      } catch (_) {
        return (await caches.match(req)) || (await caches.match('/index.html')) || (await caches.match('/')) || Response.error();
      }
    })());
    return;
  }

  // static assets: cache-first, refresh in the background.
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === 'basic') { const c = await caches.open(VERSION); c.put(req, res.clone()); }
      return res;
    } catch (_) { return cached || Response.error(); }
  })());
});

/* The game stays online and server-authoritative. No API, session or game asset cache. */
/* global self, caches, fetch, URL */
const scope = new URL(self.registration.scope);
const cachePrefix = 'riftmon-offline-' + scope.pathname + '-';
const cacheName = cachePrefix + 'v1';
const offlineUrl = new URL('offline.html', scope).href;
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const response = await fetch(offlineUrl, { cache: 'reload', credentials: 'omit' });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw Error('Offline page unavailable');
    const cache = await caches.open(cacheName);
    await cache.put(offlineUrl, response);
  })());
  // A new worker waits for existing windows to close; never reload a running battle.
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(cachePrefix) && name !== cacheName).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || request.mode !== 'navigate' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const path = url.pathname.slice(scope.pathname.length);
  if (/^(api|socket\.io)(\/|$)/.test(path)) return;
  event.respondWith(fetch(request).catch(async () => (await caches.open(cacheName)).match(offlineUrl)));
});

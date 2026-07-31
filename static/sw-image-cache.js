const CACHE_NAME = 'postimg-image-cache-v1';
const IMAGE_HOSTS = new Set(['i.postimg.cc']);

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith('postimg-image-cache-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

function shouldHandle(request) {
  if (!request || request.method !== 'GET') return false;
  if (request.destination !== 'image') return false;
  try {
    const url = new URL(request.url);
    return IMAGE_HOSTS.has(url.hostname);
  } catch (e) {
    return false;
  }
}

async function cacheNetworkResponse(cache, request) {
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return null;
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (!shouldHandle(request)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    const networkPromise = cacheNetworkResponse(cache, request);

    if (cached) {
      event.waitUntil(networkPromise);
      return cached;
    }

    const networkResponse = await networkPromise;
    if (networkResponse) return networkResponse;

    return cached || Response.error();
  })());
});

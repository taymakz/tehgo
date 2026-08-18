const CACHE_NAME = "tehgo-shell-v2";
const SHELL_URLS = [
  "/fa",
  "/en",
  "/logo.svg",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "/maskable-icon-512x512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Cross-origin GET requests (map tiles, basemap styles/glyphs/sprites, worker
// scripts, webfonts) rarely change and matter most for offline use: serve
// instantly from cache, refresh in the background.
function staleWhileRevalidate(event) {
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok || response.type === "opaque") {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => cached);
      return cached ?? network;
    })
  );
}

// Same-origin app requests: prefer fresh content, fall back to cache offline.
function networkFirst(event) {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached ?? caches.match("/fa")))
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    staleWhileRevalidate(event);
    return;
  }

  networkFirst(event);
});

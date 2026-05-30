const CACHE_NAME = "learnv2-v2.6.0";
// Scope-relative so the precache works under any base path (localhost or the
// GitHub Pages "/learnv2/" subpath).
const STATIC_ASSETS = ["./", "./index.html", "./manifest.json", "./favicon.svg"];
const ASSET_EXTENSIONS = [".js", ".css", ".woff2", ".svg", ".png", ".json"];

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const scope = self.registration.scope;
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if (client.url.startsWith(scope) && "focus" in client) {
          await client.focus();
          return;
        }
      }
      if (self.clients.openWindow) await self.clients.openWindow(scope);
    })(),
  );
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const pathname = new URL(event.request.url).pathname;
  const shouldCache = ASSET_EXTENSIONS.some((ext) => pathname.endsWith(ext));

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse?.status === 200 && shouldCache) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    }),
  );
});

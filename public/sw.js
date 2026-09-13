const CACHE_NAME = "waldemar-sga-v1";
const URLS_PARA_CACHE = ["/", "/login", "/manifest.json", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_PARA_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
});

// Cache-first para o boletim funcionar offline (regra PWA).
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((respostaCache) => {
      if (respostaCache) return respostaCache;

      return fetch(event.request)
        .then((respostaRede) => {
          const clone = respostaRede.clone();
          if (event.request.url.includes("/boletim") || event.request.url.includes("/api/notas")) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return respostaRede;
        })
        .catch(() => caches.match("/login"));
    })
  );
});

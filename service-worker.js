// Service Worker del Vademécum - habilita el uso offline.
// IMPORTANTE: al actualizar contenido (nuevos fármacos, cambios de CSS/JS),
// subir el número de versión de CACHE_NAME para que los dispositivos
// descarguen la versión nueva en lugar de seguir usando la cacheada.
const CACHE_NAME = "vademecum-cache-v6";

const ARCHIVOS_APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/app.js",
  "./data/farmacos.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS_APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// Estrategia: "network first" para farmacos.json (datos clínicos siempre frescos
// si hay conexión) y "stale-while-revalidate" para el resto: responde al instante
// desde caché y actualiza en segundo plano (gasta pocos datos y ya no hace falta
// subir la versión para cada cambio de CSS/JS; la próxima apertura lo toma).
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // El panel de administración y su API nunca se cachean.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;

  if (url.pathname.endsWith("farmacos.json")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copia = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cacheado) => {
      const red = fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const copia = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          }
          return res;
        })
        .catch(() => cacheado);
      return cacheado || red;
    })
  );
});

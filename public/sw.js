const VERYA_CACHE_PREFIX = "verya-";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith(VERYA_CACHE_PREFIX)).map((key) => caches.delete(key)));
      await self.registration.unregister();
      await self.clients.claim();
    })()
  );
});

// This worker intentionally has no fetch handler.
// The previous worker cached Next.js/App Router responses and could retain
// incompatible RSC or asset responses across deployments.

// Service worker de Caisse Simple.
// Stratégie "cache d'abord, réseau en secours" : une fois l'appli
// ouverte une première fois avec internet, tout continue de
// fonctionner hors connexion, y compris après avoir quitté puis
// rouvert l'appli. Chaque page rechargée avec internet met le cache
// à jour automatiquement.

const CACHE_NAME = 'caisse-simple-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

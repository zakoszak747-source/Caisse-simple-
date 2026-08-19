// Service worker de Caisse Simple.
// Stratégie "réseau d'abord, cache en secours" : quand le téléphone a
// internet, l'appli va toujours chercher la dernière version en
// ligne (donc les mises à jour arrivent tout de suite, sans rester
// bloqué sur une ancienne version en cache). Si le réseau ne répond
// pas (hors connexion), l'appli se rabat automatiquement sur la
// dernière version mise en cache — le fonctionnement hors ligne reste
// intact.

const CACHE_NAME = 'caisse-simple-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

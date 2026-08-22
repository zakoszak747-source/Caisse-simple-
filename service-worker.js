// Service worker de Caisse Simple.
// Stratégie "réseau d'abord, cache en secours" : quand le téléphone a
// internet, l'appli va toujours chercher la dernière version en
// ligne (donc les mises à jour arrivent tout de suite, sans rester
// bloqué sur une ancienne version en cache). Si le réseau ne répond
// pas (hors connexion), l'appli se rabat automatiquement sur la
// dernière version mise en cache — le fonctionnement hors ligne reste
// intact.

const CACHE_NAME = 'caisse-simple-v3';

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
  // Si le réseau est instable (répond très lentement, sans jamais
  // échouer franchement), on n'attend pas indéfiniment : au bout de
  // 5 secondes, on bascule sur le cache pour que l'appli reste
  // utilisable plutôt que de sembler figée.
  const networkWithTimeout = Promise.race([
    fetch(event.request),
    new Promise((_, reject) => setTimeout(() => reject(new Error('network-timeout')), 5000))
  ]);
  event.respondWith(
    networkWithTimeout
      .then((response) => {
        // Une ressource d'un autre site (ex: la librairie de graphiques
        // sur cdnjs.cloudflare.com) revient en réponse "opaque" (statut
        // toujours à 0, même en cas de succès) — on la met en cache
        // quand même, sinon elle ne serait jamais disponible hors
        // connexion et l'appli resterait bloquée à essayer de la
        // retélécharger à chaque ouverture sans internet stable.
        if (response && (response.status === 200 || response.type === 'opaque')) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

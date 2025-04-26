/**
 * Service Worker for Hochzeits-Bingo PWA
 * Enables offline functionality by caching resources
 */

const CACHE_NAME = 'hochzeit-bingo-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './css/flag-icons.min.css',
  './css/modules/animations.css',
  './css/modules/footer.css',
  './css/modules/game-screen.css',
  './css/modules/help-modal.css',
  './css/modules/language-switcher.css',
  './css/modules/responsive.css',
  './css/modules/splash-screen.css',
  './css/modules/variables.css',
  './css/modules/winner-screen.css',
  './js/app.js',
  './js/bingoGame.js',
  './js/config.js',
  './js/dataService.js',
  './js/helpController.js',
  './js/i18n.js',
  './js/uiController.js',
  './json/i18n/tasks/de_tasks.json',
  './json/i18n/tasks/en_tasks.json',
  './json/i18n/tasks/pl_tasks.json',
  './json/i18n/ui/de.json',
  './json/i18n/ui/en.json',
  './json/i18n/ui/pl.json',
  './assets/sound/air-horn-273892.mp3',
  './manifest.json',
  './icons/favicon.ico',
  './icons/favicon-16x16.png',
  './icons/favicon-32x32.png',
  './icons/apple-touch-icon.png',
  './icons/android-chrome-192x192.png',
  './icons/android-chrome-512x512.png'
];

/**
 * On installation, cache all important assets
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * On activation, clean up old caches
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

/**
 * Network-first strategy with cache fallback
 * Tries to load resources from the network first, and falls back to the cache
 * if no network connection exists
 */
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone the response, as it can only be read once
        const responseClone = response.clone();
        
        // Update cache
        caches.open(CACHE_NAME)
          .then(cache => {
            // Store only successful requests in the cache
            if (event.request.method === 'GET' && response.status === 200) {
              cache.put(event.request, responseClone);
            }
          });
          
        return response;
      })
      .catch(() => {
        // Serve from cache on network failure
        return caches.match(event.request);
      })
  );
});

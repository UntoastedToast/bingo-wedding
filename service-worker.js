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
  './css/modules/tooltip.css',
  './css/modules/variables.css',
  './css/modules/winner-screen.css',
  './js/app.js',
  './js/controllers/helpController.js',
  './js/controllers/uiController.js',
  './js/core/config.js',
  './js/core/game.js',
  './js/core/storage.js',
  './js/managers/AudioManager.js',
  './js/managers/BoardManager.js',
  './js/managers/DialogManager.js',
  './js/managers/ScreenManager.js',
  './js/services/i18n.js',
  './json/i18n/tasks/de_tasks.json',
  './json/i18n/tasks/en_tasks.json',
  './json/i18n/tasks/pl_tasks.json',
  './json/i18n/ui/de.json',
  './json/i18n/ui/en.json',
  './json/i18n/ui/pl.json',
  './assets/sound/air-horn-273892.mp3',
  './assets/music/410578__manuelgraf__game-win-screen-background-music.mp3',
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
        // Einzelne Dateien cachen, damit ein Fehler nicht den gesamten Prozess abbricht
        const cachePromises = ASSETS_TO_CACHE.map(url => {
          return cache.add(url).catch(error => {
            console.warn(`Fehler beim Cachen von ${url}:`, error);
            // Fehler bei einzelnen Dateien ignorieren
            return Promise.resolve();
          });
        });
        return Promise.all(cachePromises);
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
 * Cache-first strategy with network fallback for static assets
 * Network-first strategy for dynamic content
 * This improves performance and reliability for offline usage
 */
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  const url = new URL(event.request.url);
  
  // Use cache-first strategy for static assets (better performance)
  const isStaticAsset = ASSETS_TO_CACHE.some(asset => {
    const assetUrl = new URL(asset, self.location.origin).pathname;
    return url.pathname === assetUrl;
  });
  
  if (isStaticAsset) {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return cached response immediately
            return cachedResponse;
          }
          
          // If not in cache, fetch from network and cache
          return fetch(event.request)
            .then(response => {
              if (!response || response.status !== 200) {
                return response;
              }
              
              // Clone the response and cache it
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            });
        })
    );
  } else {
    // Network-first for dynamic content
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response, as it can only be read once
          const responseClone = response.clone();
          
          // Update cache for successful responses
          if (response.status === 200) {
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseClone);
              });
          }
            
          return response;
        })
        .catch(() => {
          // Serve from cache on network failure
          return caches.match(event.request);
        })
    );
  }
});

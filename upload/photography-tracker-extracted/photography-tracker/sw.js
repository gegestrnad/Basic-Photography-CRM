/* Photography Tracker — Service Worker */
var CACHE = 'photo-tracker-v2';
var ASSETS = [
  './',
  './dashboard.html',
  './jobs.html',
  './payments.html',
  './tasks.html',
  './shared.css',
  './data.js',
  './cloud-sync.js',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); })
      );
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(r) {
      return r || fetch(e.request).catch(function() {
        // Offline fallback — return dashboard for navigation requests
        if (e.request.mode === 'navigate') {
          return caches.match('./dashboard.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

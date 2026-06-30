const CACHE_NAME = 'reissubudjetti-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js'
];

// Asennus ja tiedostojen välimuistiin tallennus offline-käyttöä varten
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// Pyyntöjen käsittely välimuistista käsin
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

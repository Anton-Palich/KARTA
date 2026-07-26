const CACHE_NAME = 'siberian-atlas-v1';
const urlsToCache = [
  '/kartaGV/',
  '/kartaGV/index.html',
  '/kartaGV/style.css',
  '/kartaGV/favicon.ico',
  '/kartaGV/manifest.json',
  '/kartaGV/data/main.geojson'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
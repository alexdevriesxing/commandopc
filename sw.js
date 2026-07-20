const CACHE = 'commando-pc-v3';
const CHUNKS = Array.from({ length: 19 }, (_, index) => `./src/chunks/game-${String(index).padStart(2, '0')}.part`);
const ASSETS = [
  './', './index.html', './styles.css', './src/game.js',
  './assets/logo.svg', './assets/favicon.svg', './assets/key-art.svg', './manifest.webmanifest',
  ...CHUNKS
];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  })));
});

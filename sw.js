const CACHE = 'black-horizon-v3';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './src/game.js',
  './src/production-art.js',
  './manifest.webmanifest',
  './assets/asset-manifest.json',
  './assets/logo.svg',
  './assets/favicon.svg',
  './assets/key-art.svg',
  './assets/intro/comic-intro.svg',
  './assets/portraits/hero.svg',
  './assets/sprites/player-atlas.svg',
  './assets/sprites/enemy-atlas.svg',
  './assets/sprites/pickup-weapon-atlas.svg',
  './assets/tiles/environment-atlas.svg',
  './assets/vfx/vfx-atlas.svg',
  './assets/ui/ui-atlas.svg',
  './src/chunks/game-00.part',
  './src/chunks/game-01.part',
  './src/chunks/game-02.part',
  './src/chunks/game-03.part',
  './src/chunks/game-04.part',
  './src/chunks/game-05.part',
  './src/chunks/game-06.part',
  './src/chunks/game-07.part',
  './src/chunks/game-08.part',
  './src/chunks/game-09.part',
  './src/chunks/game-10.part',
  './src/chunks/game-11.part',
  './src/chunks/game-12.part',
  './src/chunks/game-13.part',
  './src/chunks/game-14.part',
  './src/chunks/game-15.part',
  './src/chunks/game-16.part',
  './src/chunks/game-17.part',
  './src/chunks/game-18.part'
];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response;
  })));
});

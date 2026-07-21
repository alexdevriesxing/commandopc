const CACHE = 'black-horizon-v6';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './src/game.js',
  './src/production-art.js',
  './src/production-raster.js',
  './src/polish.js',
  './src/ship-polish.js',
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
  './assets/raster/production-board-atlas-00.part',
  './assets/raster/production-board-atlas-01.part',
  './assets/raster/production-board-atlas-02.part',
  './assets/raster/production-board-atlas-03.part',
  './assets/raster/production-board-atlas-04.part',
  './assets/raster/production-board-atlas-05.part',
  './assets/raster/production-board-atlas-06.part',
  './assets/raster/production-board-atlas-07.part',
  './assets/raster/production-board-atlas-08.part',
  './assets/raster/production-board-atlas-09.part',
  './assets/raster/production-board-atlas-10.part',
  './assets/raster/production-board-atlas-11.part',
  './assets/raster/production-board-atlas-12.part',
  './assets/raster/production-board-atlas-13.part',
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

const cacheResponse = async (request, response) => {
  if (response?.ok && response.type !== 'opaque') {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request)
      .then((response) => cacheResponse(event.request, response))
      .catch(async () => (await caches.match(event.request)) || caches.match('./index.html')));
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => {
    const network = fetch(event.request)
      .then((response) => cacheResponse(event.request, response))
      .catch(() => cached);
    return cached || network;
  }));
});

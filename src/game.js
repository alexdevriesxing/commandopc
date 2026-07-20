const chunkUrls = Array.from({ length: 15 }, (_, index) =>
  new URL(`./chunks/game-${String(index).padStart(2, '0')}.part`, import.meta.url)
);

try {
  const parts = await Promise.all(chunkUrls.map(async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Unable to load game source: ${url.pathname}`);
    return response.text();
  }));
  const source = `${parts.join('')}\n//# sourceURL=operation-cinder.bundle.js`;
  (0, eval)(source);
} catch (error) {
  console.error(error);
  const canvas = document.querySelector('#game');
  const context = canvas?.getContext('2d');
  if (context) {
    context.fillStyle = '#071018';
    context.fillRect(0, 0, 1280, 720);
    context.fillStyle = '#ff6b2c';
    context.font = '900 34px system-ui, sans-serif';
    context.textAlign = 'center';
    context.fillText('GAME SOURCE FAILED TO LOAD', 640, 330);
    context.fillStyle = '#f8f2df';
    context.font = '600 18px system-ui, sans-serif';
    context.fillText('Refresh the page or clear the offline cache.', 640, 372);
  }
}

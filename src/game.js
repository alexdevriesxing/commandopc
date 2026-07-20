const chunkUrls = Array.from({ length: 19 }, (_, index) =>
  new URL(`./chunks/game-${String(index).padStart(2, '0')}.part`, import.meta.url)
);
const productionArtUrls = [
  new URL('./production-art.js', import.meta.url),
  new URL('./production-raster.js', import.meta.url),
];
const rasterPartUrls = Array.from({ length: 14 }, (_, index) =>
  new URL(`../assets/raster/production-board-atlas-${String(index).padStart(2, '0')}.part`, import.meta.url)
);

const loadText = async (url, label) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load ${label}: ${url.pathname}`);
  return response.text();
};

try {
  const [parts, productionLayers, rasterParts] = await Promise.all([
    Promise.all(chunkUrls.map((url) => loadText(url, 'game source'))),
    Promise.all(productionArtUrls.map((url) => loadText(url, 'production layer'))),
    Promise.all(rasterPartUrls.map((url) => loadText(url, 'raster production atlas'))),
  ]);
  const rasterPayload = rasterParts
    .map((part) => part.replace(/^BLACK_HORIZON_PRODUCTION_ATLAS_PART_\d+\n/, ''))
    .join('');
  const rasterUrl = `data:image/webp;base64,${rasterPayload}`;
  const rasterLayer = productionLayers[1].replace('__RASTER_ATLAS_URL__', rasterUrl);
  const source = `${parts.join('')}
${productionLayers[0]}
${rasterLayer}
//# sourceURL=black-horizon.bundle.js`;
  (0, eval)(source);
} catch (error) {
  console.error(error);
  const canvas = document.querySelector('#game');
  const context = canvas?.getContext('2d');
  if (context) {
    context.fillStyle = '#03080c'; context.fillRect(0, 0, 1280, 720);
    context.fillStyle = '#f8f2df'; context.font = '900 42px system-ui, sans-serif'; context.textAlign = 'center';
    context.fillText('BLACK HORIZON', 640, 300);
    context.fillStyle = '#ff6b2c'; context.font = '900 20px system-ui, sans-serif';
    context.fillText('CINDER PROTOCOL', 640, 338);
    context.fillStyle = '#d2dcdb'; context.font = '600 17px system-ui, sans-serif';
    context.fillText('Production assets failed to load. Refresh or clear the offline cache.', 640, 390);
  }
}

const chunkUrls = Array.from({ length: 19 }, (_, index) =>
  new URL(`./chunks/game-${String(index).padStart(2, '0')}.part`, import.meta.url)
);
const productionArtUrls = [
  new URL('./production-art.js', import.meta.url),
  new URL('./production-raster.js', import.meta.url),
  new URL('./polish.js', import.meta.url),
  new URL('./ship-polish.js', import.meta.url),
];
const rasterPartUrls = Array.from({ length: 14 }, (_, index) =>
  new URL(`../assets/raster/production-board-atlas-${String(index).padStart(2, '0')}.part`, import.meta.url)
);

const createBootStatus = () => {
  const canvas = document.querySelector('#game');
  const host = canvas?.parentElement || document.body;
  const panel = document.createElement('div');
  panel.id = 'black-horizon-boot';
  panel.setAttribute('role', 'status');
  panel.setAttribute('aria-live', 'polite');
  panel.innerHTML = `
    <div style="font:900 clamp(24px,4vw,42px)/1 system-ui,sans-serif;letter-spacing:.06em;color:#f8f2df">BLACK HORIZON</div>
    <div style="margin-top:8px;font:900 13px/1 system-ui,sans-serif;letter-spacing:.28em;color:#ff7a3d">CINDER PROTOCOL</div>
    <div data-boot-copy style="margin-top:28px;font:700 12px/1.4 system-ui,sans-serif;letter-spacing:.12em;color:#b8c6c9">INITIALIZING FIELD SYSTEMS</div>
    <div style="width:min(420px,72vw);height:5px;margin-top:14px;background:#14242c;border:1px solid #334b57;overflow:hidden"><div data-boot-bar style="width:4%;height:100%;background:linear-gradient(90deg,#ff6b2c,#ffd45a,#42e8dc);transition:width .18s ease"></div></div>`;
  Object.assign(panel.style, {
    position: 'absolute', inset: '0', zIndex: '30', display: 'grid', placeContent: 'center', textAlign: 'center',
    background: 'radial-gradient(circle at 65% 35%,rgba(65,95,103,.28),transparent 36%),linear-gradient(135deg,#02070b,#07141b 60%,#2e1717)',
    pointerEvents: 'none', opacity: '1', transition: 'opacity .28s ease',
  });
  const hostPosition = getComputedStyle(host).position;
  if (hostPosition === 'static') host.style.position = 'relative';
  host.appendChild(panel);
  const copy = panel.querySelector('[data-boot-copy]');
  const bar = panel.querySelector('[data-boot-bar]');
  return {
    set(progress, message) {
      bar.style.width = `${Math.max(4, Math.min(100, progress))}%`;
      if (message) copy.textContent = message;
    },
    finish(message = 'DEPLOYMENT READY') {
      this.set(100, message);
      window.setTimeout(() => { panel.style.opacity = '0'; }, 100);
      window.setTimeout(() => panel.remove(), 420);
    },
    fail(message) {
      copy.textContent = message;
      copy.style.color = '#ff8d68';
      bar.style.background = '#ff5d55';
      bar.style.width = '100%';
    },
  };
};

const bootStatus = createBootStatus();
const totalRequests = chunkUrls.length + productionArtUrls.length + rasterPartUrls.length;
let completedRequests = 0;
const loadText = async (url, label) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load ${label}: ${url.pathname}`);
  const text = await response.text();
  completedRequests++;
  bootStatus.set(8 + (completedRequests / totalRequests) * 70, `LOADING ${label.toUpperCase()} ${completedRequests}/${totalRequests}`);
  return text;
};

const normalizeRasterPart = (part, index) => {
  const lines = part.replace(/\r\n/g, '\n').trim().split('\n');
  if (/^BLACK_HORIZON_PRODUCTION_ATLAS_PART_\d+$/.test(lines[0] || '')) lines.shift();
  const payload = lines.join('').replace(/\s+/g, '');
  if (!payload || !/^[A-Za-z0-9+/=]+$/.test(payload)) throw new Error(`Raster atlas part ${index} is invalid`);
  return payload;
};

const createRasterObjectUrl = (parts) => {
  const payload = parts.map(normalizeRasterPart).join('');
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return URL.createObjectURL(new Blob([bytes], { type: 'image/webp' }));
};

const waitForProductionAssets = (timeoutMs = 5000) => new Promise((resolve) => {
  const started = performance.now();
  const tick = () => {
    const vector = window.__blackHorizonAssets;
    const raster = window.__blackHorizonRaster;
    const vectorRatio = vector?.total ? vector.loaded / vector.total : 0;
    const rasterRatio = raster?.total ? raster.loaded / raster.total : 0;
    const ratio = (vectorRatio + rasterRatio) / 2;
    bootStatus.set(90 + ratio * 10, ratio >= 1 ? 'PRODUCTION ART ONLINE' : 'DECODING PRODUCTION ART');
    if (ratio >= 1 || performance.now() - started >= timeoutMs) resolve(ratio >= 1);
    else requestAnimationFrame(tick);
  };
  tick();
});

let rasterObjectUrl = null;
try {
  const [parts, productionLayers, rasterParts] = await Promise.all([
    Promise.all(chunkUrls.map((url) => loadText(url, 'game source'))),
    Promise.all(productionArtUrls.map((url) => loadText(url, 'production layer'))),
    Promise.all(rasterPartUrls.map((url) => loadText(url, 'production atlas'))),
  ]);
  bootStatus.set(82, 'ASSEMBLING PRODUCTION ATLAS');
  rasterObjectUrl = createRasterObjectUrl(rasterParts);
  productionLayers[1] = productionLayers[1].replace('__RASTER_ATLAS_URL__', rasterObjectUrl);
  const source = `${parts.join('')}\n${productionLayers.join('\n')}\n//# sourceURL=black-horizon.bundle.js`;
  bootStatus.set(88, 'DEPLOYING COMBAT SYSTEMS');
  (0, eval)(source);
  const artReady = await waitForProductionAssets();
  bootStatus.finish(artReady ? 'DEPLOYMENT READY' : 'DEPLOYED WITH RESILIENT FALLBACKS');
  window.addEventListener('pagehide', () => {
    if (rasterObjectUrl) URL.revokeObjectURL(rasterObjectUrl);
  }, { once: true });
} catch (error) {
  console.error(error);
  if (rasterObjectUrl) URL.revokeObjectURL(rasterObjectUrl);
  bootStatus.fail('DEPLOYMENT FAILED — REFRESH OR CLEAR THE OFFLINE CACHE');
  const canvas = document.querySelector('#game');
  const context = canvas?.getContext('2d');
  if (context) {
    context.fillStyle = '#03080c'; context.fillRect(0, 0, 1280, 720);
    context.fillStyle = '#f8f2df'; context.font = '900 42px system-ui, sans-serif'; context.textAlign = 'center';
    context.fillText('BLACK HORIZON', 640, 300);
    context.fillStyle = '#ff6b2c'; context.font = '900 20px system-ui, sans-serif';
    context.fillText('CINDER PROTOCOL', 640, 338);
    context.fillStyle = '#d2dcdb'; context.font = '600 17px system-ui, sans-serif';
    context.fillText('Production systems failed to load. Refresh or clear the offline cache.', 640, 390);
  }
}

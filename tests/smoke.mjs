import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
const loader = fs.readFileSync(new URL('src/boot-v9.js', root), 'utf8');
const compatibilityLoader = fs.readFileSync(new URL('src/game.js', root), 'utf8');
const serviceWorker = fs.readFileSync(new URL('sw.js', root), 'utf8');
const headers = fs.readFileSync(new URL('_headers', root), 'utf8');
const manifest = JSON.parse(fs.readFileSync(new URL('assets/asset-manifest.json', root), 'utf8'));
const spec = JSON.parse(fs.readFileSync(new URL('assets/sprites/spritesheet-spec.json', root), 'utf8'));
const chunkDir = new URL('src/chunks/', root);
const chunkFiles = fs.readdirSync(chunkDir).filter((name) => name.endsWith('.part')).sort();

assert.equal(chunkFiles.length, 19, 'expected all campaign source chunks');
assert.match(html, /src="src\/boot-v9\.js"/);
assert.match(compatibilityLoader, /import '\.\/boot-v9\.js'/);
assert.match(loader, /GAMEPLAY_ATLAS_REPLACEMENTS/);
assert.match(loader, /selectProductionSprites/);
assert.match(loader, /player-atlas-v3\.svg/);
assert.match(loader, /decodeBase64/);
assert.match(loader, /cache:\s*'no-store'/);
assert.match(serviceWorker, /black-horizon-v9/);
assert.match(serviceWorker, /player-atlas-v3\.svg/);
assert.match(headers, /assets\/sprites\/\*-v3\.svg/);
assert.equal(manifest.version, 3);
assert.equal(spec.version, '3.0.0');
assert.equal(spec.quality.runtimeAddressable, true);
assert.equal(spec.quality.presentationBoardsAreNotGameplayAtlases, true);

for (const [key, atlas] of Object.entries(manifest.atlases)) {
  const source = fs.readFileSync(new URL(atlas.src, root), 'utf8');
  assert.match(source, /^<svg[\s>]/, `${key} must be SVG`);
  assert.match(source, /production atlas v3/i, `${key} must carry production metadata`);
  assert.doesNotMatch(source, /placeholder|sample sprite/i, `${key} must not be placeholder art`);
  const width = Number(source.match(/\bwidth="(\d+)"/)?.[1]);
  const height = Number(source.match(/\bheight="(\d+)"/)?.[1]);
  assert.equal(width, atlas.cell[0] * atlas.cols, `${key} width must align to fixed cells`);
  assert.equal(height, atlas.cell[1] * atlas.rows, `${key} height must align to fixed cells`);
  const transforms = (source.match(/<g transform="translate\(/g) || []).length;
  assert.ok(transforms >= atlas.cols * atlas.rows, `${key} must contain at least one authored group per cell`);
}
assert.equal(manifest.atlases.player.cols * manifest.atlases.player.rows, 32);
assert.equal(manifest.atlases.enemies.cols * manifest.atlases.enemies.rows, 44);
assert.equal(manifest.atlases.environment.cols * manifest.atlases.environment.rows, 36);
assert.equal(manifest.atlases.vfx.cols * manifest.atlases.vfx.rows, 32);
assert.equal(manifest.atlases.ui.cols * manifest.atlases.ui.rows, 32);

console.log('Smoke checks passed: six versioned runtime spritesheets, 188 addressable cells, exact grids, immutable caching, stale-shell compatibility and production-board separation are present.');

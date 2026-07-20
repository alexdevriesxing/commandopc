import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
const css = fs.readFileSync(new URL('styles.css', root), 'utf8');
const loader = fs.readFileSync(new URL('src/game.js', root), 'utf8');
const production = fs.readFileSync(new URL('src/production-art.js', root), 'utf8');
const rasterRuntime = fs.readFileSync(new URL('src/production-raster.js', root), 'utf8');
const manifest = JSON.parse(fs.readFileSync(new URL('assets/asset-manifest.json', root), 'utf8'));
const chunkDir = new URL('src/chunks/', root);
const chunkFiles = fs.readdirSync(chunkDir).filter((name) => name.endsWith('.part')).sort();
const js = chunkFiles.map((name) => fs.readFileSync(new URL(name, chunkDir), 'utf8')).join('') + '\n' + production + '\n' + rasterRuntime;

assert.equal(chunkFiles.length, 19, 'expected all campaign source chunks');
assert.doesNotThrow(() => new Function(js), 'assembled game and production layers must parse');
assert.match(html, /Black Horizon: Cinder Protocol/);
assert.doesNotMatch(html, /Commando PC|Operation Cinder/);
assert.match(html, /canvas id="game"/);
assert.match(loader, /length: 19/);
assert.match(loader, /production-art\.js/);
assert.match(loader, /production-raster\.js/);
assert.match(loader, /rasterPayload/);
assert.match(loader, /BLACK_HORIZON_PRODUCTION_ATLAS_PART_/);
assert.match(css, /aspect-ratio:\s*16\s*\/\s*9/);
assert.equal(manifest.title, 'BLACK HORIZON: CINDER PROTOCOL');
assert.equal(manifest.version, 2);
assert.equal(manifest.atlases.player.frames, 8);
assert.equal(manifest.atlases.enemies.types.length, 11);
assert.equal(manifest.atlases.vfx.cols * manifest.atlases.vfx.rows, 32);
assert.equal(Object.keys(manifest.rasterProduction.regions).length, 10);
for (const src of [manifest.screens.keyArt, manifest.screens.comicIntro, manifest.screens.heroPortrait, manifest.screens.logo, ...Object.values(manifest.atlases).map((atlas) => atlas.src)]) {
  const file = new URL(src, root); assert.ok(fs.existsSync(file), `missing vector asset ${src}`);
  assert.match(fs.readFileSync(file, 'utf8'), /<svg[\s>]/, `${src} must be SVG`);
}
const rasterParts = manifest.rasterProduction.parts.map((src) => new URL(src, root));
for (const file of rasterParts) assert.ok(fs.existsSync(file), `missing raster production part ${file.pathname}`);
const rasterBase64 = rasterParts
  .map((file) => fs.readFileSync(file, 'utf8').replace(/^BLACK_HORIZON_PRODUCTION_ATLAS_PART_\d+\n/, ''))
  .join('');
const rasterBytes = Buffer.from(rasterBase64, 'base64');
assert.ok(rasterBytes.length > 60_000, 'raster production atlas must contain the full art pack');
assert.equal(manifest.rasterProduction.encoding, 'base64-parts');
assert.match(production, /BLACK_HORIZON_ASSET_MANIFEST/);
assert.match(rasterRuntime, /RASTER_PRODUCTION_MANIFEST/);
assert.match(rasterRuntime, /RasterProductionBank/);
assert.match(rasterRuntime, /drawTextLogoFallback/);
assert.match(rasterRuntime, /Player\.prototype\.draw/);
assert.match(rasterRuntime, /Enemy\.prototype\.draw/);
assert.match(rasterRuntime, /Pickup\.prototype\.draw/);
assert.match(rasterRuntime, /Game\.prototype\.drawProp/);
assert.match(rasterRuntime, /drawCampaignVictory/);
assert.doesNotMatch(rasterRuntime, /COMMANDO PC|OPERATION CINDER|Operation Cinder/);
assert.match(js, /const LEVELS = \[/);
assert.match(js, /const DIFFICULTIES = \{/);
assert.match(js, /const FIELD_DOCTRINES = \[/);
assert.match(js, /const OPERATION_MUTATORS = \[/);
assert.match(js, /spawnDirectorWave/);
assert.match(js, /rocketeer:/); assert.match(js, /medic:/); assert.match(js, /hunter:/);
assert.equal((js.match(/codename:/g) || []).length, 6, 'expected six campaign missions');
console.log('Smoke checks passed: no user-visible legacy fallback, 10 raster production boards, vector gameplay atlases, four difficulties, campaign director, mutators, doctrines, expanded enemies, audio and offline shell are present.');

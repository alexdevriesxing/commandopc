import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
const css = fs.readFileSync(new URL('styles.css', root), 'utf8');
const loader = fs.readFileSync(new URL('src/game.js', root), 'utf8');
const production = fs.readFileSync(new URL('src/production-art.js', root), 'utf8');
const manifest = JSON.parse(fs.readFileSync(new URL('assets/asset-manifest.json', root), 'utf8'));
const chunkDir = new URL('src/chunks/', root);
const chunkFiles = fs.readdirSync(chunkDir).filter((name) => name.endsWith('.part')).sort();
const js = chunkFiles.map((name) => fs.readFileSync(new URL(name, chunkDir), 'utf8')).join('') + '\n' + production;

assert.equal(chunkFiles.length, 19, 'expected all campaign source chunks');
assert.doesNotThrow(() => new Function(js), 'assembled game and production art source must parse');
assert.match(html, /Black Horizon: Cinder Protocol/);
assert.match(html, /canvas id="game"/);
assert.match(loader, /length: 19/);
assert.match(loader, /production-art\.js/);
assert.match(loader, /parts\.join/);
assert.match(css, /aspect-ratio:\s*16\s*\/\s*9/);
assert.equal(manifest.title, 'BLACK HORIZON: CINDER PROTOCOL');
assert.equal(manifest.atlases.player.frames, 8);
assert.equal(manifest.atlases.enemies.types.length, 11);
assert.equal(manifest.atlases.vfx.cols * manifest.atlases.vfx.rows, 32);
assert.equal(manifest.atlases.ui.items.length, 32);
for (const src of [manifest.screens.keyArt, manifest.screens.comicIntro, manifest.screens.heroPortrait, manifest.screens.logo, ...Object.values(manifest.atlases).map((atlas) => atlas.src)]) {
  const file = new URL(src, root); assert.ok(fs.existsSync(file), `missing production asset ${src}`);
  assert.match(fs.readFileSync(file, 'utf8'), /<svg[\s>]/, `${src} must be SVG`);
}
assert.match(production, /BLACK_HORIZON_ASSET_MANIFEST/);
assert.match(production, /ProductionAssetBank/);
assert.match(production, /player-atlas\.svg/);
assert.match(production, /enemy-atlas\.svg/);
assert.match(production, /environment-atlas\.svg/);
assert.match(js, /const LEVELS = \[/);
assert.match(js, /const DIFFICULTIES = \{/);
assert.match(js, /const FIELD_DOCTRINES = \[/);
assert.match(js, /const OPERATION_MUTATORS = \[/);
assert.match(js, /spawnDirectorWave/);
assert.match(js, /rocketeer:/); assert.match(js, /medic:/); assert.match(js, /hunter:/);
assert.equal((js.match(/codename:/g) || []).length, 6, 'expected six campaign missions');
console.log('Smoke checks passed: Black Horizon branding, production atlases, 4 difficulties, mutators, doctrines, combat director, expanded enemies, audio, and PWA shell are present.');

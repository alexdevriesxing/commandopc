import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
const css = fs.readFileSync(new URL('styles.css', root), 'utf8');
const loader = fs.readFileSync(new URL('src/game.js', root), 'utf8');
const chunkDir = new URL('src/chunks/', root);
const chunkFiles = fs.readdirSync(chunkDir).filter((name) => name.endsWith('.part')).sort();
const js = chunkFiles.map((name) => fs.readFileSync(new URL(name, chunkDir), 'utf8')).join('');

assert.equal(chunkFiles.length, 15, 'expected all source chunks');
assert.doesNotThrow(() => new Function(js), 'assembled game source must parse');
assert.match(html, /canvas id="game"/);
assert.match(loader, /parts\.join/);
assert.match(js, /assets\/key-art\.svg/);
assert.match(css, /aspect-ratio:\s*16\s*\/\s*9/);
assert.match(js, /const LEVELS = \[/);
assert.match(js, /const WEAPONS = \{/);
assert.match(js, /const ENEMY_TYPES = \{/);
assert.match(js, /class AudioEngine/);
assert.match(js, /class Game/);
assert.equal((js.match(/codename:/g) || []).length, 6, 'expected six campaign missions');
assert.ok((js.match(/name: '/g) || []).length >= 12, 'expected a varied arsenal and enemy roster');

console.log('Smoke checks passed: loader, source, shell, assets, campaign, audio, weapons, and enemies are present.');

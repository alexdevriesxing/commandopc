import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const js = fs.readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');

assert.match(html, /canvas id="game"/);
assert.match(js, /assets\/key-art\.svg/);
assert.match(css, /aspect-ratio:\s*16\s*\/\s*9/);
assert.match(js, /const LEVELS = \[/);
assert.match(js, /const WEAPONS = \{/);
assert.match(js, /const ENEMY_TYPES = \{/);
assert.match(js, /class AudioEngine/);
assert.match(js, /class Game/);
assert.equal((js.match(/codename:/g) || []).length, 6, 'expected six campaign missions');
assert.ok((js.match(/name: '/g) || []).length >= 12, 'expected a varied arsenal and enemy roster');

console.log('Smoke checks passed: shell, assets, campaign, audio, weapons, and enemies are present.');

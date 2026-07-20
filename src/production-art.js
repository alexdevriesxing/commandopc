// -----------------------------------------------------------------------------
// BLACK HORIZON production visual asset integration
// The runtime keeps the original vector renderer as a graceful fallback while
// loading the final atlas set defined in assets/asset-manifest.json.
// -----------------------------------------------------------------------------
const BLACK_HORIZON_ASSET_MANIFEST = {
  title: 'BLACK HORIZON: CINDER PROTOCOL',
  player: { src: 'assets/sprites/player-atlas.svg', cell: 128, cols: 8, rows: 4 },
  enemies: { src: 'assets/sprites/enemy-atlas.svg', cell: 128, cols: 4, rows: 11 },
  pickups: { src: 'assets/sprites/pickup-weapon-atlas.svg', cell: 112, cols: 6, rows: 2 },
  environment: { src: 'assets/tiles/environment-atlas.svg', cell: 160, cols: 6, rows: 6 },
  vfx: { src: 'assets/vfx/vfx-atlas.svg', cell: 128, cols: 8, rows: 4 },
  ui: { src: 'assets/ui/ui-atlas.svg', cell: 96, cols: 8, rows: 4 },
  keyArt: { src: 'assets/key-art.svg' },
  comicIntro: { src: 'assets/intro/comic-intro.svg' },
  hero: { src: 'assets/portraits/hero.svg' },
  logo: { src: 'assets/logo.svg' },
};

class ProductionAssetBank {
  constructor(manifest) {
    this.manifest = manifest;
    this.images = {};
    this.loaded = 0;
    this.total = 0;
    for (const [key, config] of Object.entries(manifest)) {
      if (!config?.src) continue;
      this.total++;
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => { this.loaded++; };
      image.onerror = () => console.warn(`Visual asset unavailable: ${config.src}`);
      image.src = config.src;
      this.images[key] = image;
    }
  }
  ready(key) {
    const image = this.images[key];
    return Boolean(image?.complete && image.naturalWidth > 0);
  }
  drawCell(c, key, col, row, dx, dy, dw, dh, rotation = 0, alpha = 1) {
    const config = this.manifest[key];
    const image = this.images[key];
    if (!config || !this.ready(key)) return false;
    const cell = config.cell;
    c.save();
    c.globalAlpha *= alpha;
    c.translate(dx + dw / 2, dy + dh / 2);
    if (rotation) c.rotate(rotation);
    c.drawImage(image, col * cell, row * cell, cell, cell, -dw / 2, -dh / 2, dw, dh);
    c.restore();
    return true;
  }
  drawContain(c, key, x, y, w, h, alpha = 1) {
    const image = this.images[key];
    if (!this.ready(key)) return false;
    const iw = image.naturalWidth || w, ih = image.naturalHeight || h;
    const scale = Math.min(w / iw, h / ih);
    const dw = iw * scale, dh = ih * scale;
    c.save(); c.globalAlpha *= alpha; c.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); c.restore();
    return true;
  }
  drawCover(c, key, x, y, w, h, alpha = 1) {
    const image = this.images[key];
    if (!this.ready(key)) return false;
    const iw = image.naturalWidth || w, ih = image.naturalHeight || h;
    const scale = Math.max(w / iw, h / ih);
    const sw = w / scale, sh = h / scale;
    c.save(); c.globalAlpha *= alpha; c.drawImage(image, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h); c.restore();
    return true;
  }
}

const productionAssets = new ProductionAssetBank(BLACK_HORIZON_ASSET_MANIFEST);
window.__blackHorizonAssets = productionAssets;
game.keyArt = productionAssets.images.keyArt;

const ENEMY_ATLAS_ROWS = ['rifleman', 'runner', 'grenadier', 'sniper', 'shield', 'heavy', 'drone', 'rocketeer', 'medic', 'hunter', 'boss'];
const PICKUP_ATLAS_ITEMS = ['health', 'armor', 'ammo', 'grenade', 'intel', 'core'];
const WEAPON_ATLAS_ITEMS = ['rifle', 'smg', 'shotgun', 'lmg', 'launcher', 'plasma'];
const BIOME_ATLAS_ROWS = ['canyon', 'oasis', 'ruins', 'salt', 'night', 'facility'];
const UI_ATLAS_ITEMS = ['story','operative','veteran','nightmare','health','armor','ammo','grenade','rapid','chain','survivor','elite','crossfire','armored','drone','hunter','medic','volatile','mine','blackout','power','ghost','iron','scavenge','explosive','combo','damage','reload','dash','objective','extract','core'];
const uiCellFor = (key) => {
  const index = Math.max(0, UI_ATLAS_ITEMS.indexOf(key));
  return { col: index % 8, row: Math.floor(index / 8) };
};
const drawUiIcon = (c, key, x, y, size = 54, alpha = 1) => {
  const cell = uiCellFor(key);
  return productionAssets.drawCell(c, 'ui', cell.col, cell.row, x, y, size, size, 0, alpha);
};

class AtlasBurst {
  constructor(x, y, row, size, life = .55, rotation = 0) {
    this.x = x; this.y = y; this.row = row; this.size = size; this.life = life; this.maxLife = life; this.rotation = rotation;
  }
  update(dt) { this.life -= dt; return this.life > 0; }
  draw(c, cameraY) {
    const progress = clamp(1 - this.life / this.maxLife, 0, 1);
    const frame = Math.min(7, Math.floor(progress * 8));
    const grow = this.row === 2 ? .7 + progress * .85 : .75 + progress * .35;
    productionAssets.drawCell(c, 'vfx', frame, this.row, this.x - this.size * grow / 2, this.y - cameraY - this.size * grow / 2, this.size * grow, this.size * grow, this.rotation, 1 - progress * .62);
  }
}

const fallbackPlayerProductionDraw = Player.prototype.draw;
Player.prototype.draw = function(c, cameraY) {
  if (!productionAssets.ready('player')) return fallbackPlayerProductionDraw.call(this, c, cameraY);
  const y = this.y - cameraY;
  const direction = ((Math.round((this.aim + Math.PI / 2) / (Math.PI / 2)) % 4) + 4) % 4;
  const frame = Math.abs(Math.floor(this.walk * .82)) % 8;
  const alpha = this.invuln > 0 && Math.floor(this.invuln * 18) % 2 === 0 ? .42 : 1;
  c.save(); c.globalAlpha = alpha;
  c.fillStyle = 'rgba(0,0,0,.32)'; c.beginPath(); c.ellipse(this.x, y + 23, 32, 12, 0, 0, TAU); c.fill();
  productionAssets.drawCell(c, 'player', frame, direction, this.x - 58, y - 71, 116, 116, 0, this.hurtFlash > 0 ? .8 : 1);
  if (this.dashTimer > 0) {
    const dashFrame = Math.min(7, Math.floor((.18 - Math.max(0, this.dashTimer)) / .18 * 8));
    productionAssets.drawCell(c, 'vfx', dashFrame, 3, this.x - 62, y - 62, 124, 124, this.aim + Math.PI / 2, .72);
  }
  if (this.muzzle > 0) {
    const mx = this.x + Math.cos(this.aim) * 49, my = y + Math.sin(this.aim) * 49;
    productionAssets.drawCell(c, 'vfx', Math.floor(this.walk * 3) & 7, 0, mx - 31, my - 31, 62, 62, this.aim, 1);
  }
  c.restore();
  if (this.reloadTimer > 0) {
    const p = 1 - this.reloadTimer / this.weapon.reload;
    c.save(); c.strokeStyle = '#071018'; c.lineWidth = 8; c.beginPath(); c.arc(this.x, y - 52, 25, -Math.PI / 2, -Math.PI / 2 + TAU); c.stroke();
    c.strokeStyle = '#42e8dc'; c.lineWidth = 4; c.beginPath(); c.arc(this.x, y - 52, 25, -Math.PI / 2, -Math.PI / 2 + TAU * p); c.stroke(); c.restore();
  }
};

const fallbackEnemyProductionDraw = Enemy.prototype.draw;
Enemy.prototype.draw = function(c, cameraY) {
  const row = ENEMY_ATLAS_ROWS.indexOf(this.typeKey);
  if (row < 0 || !productionAssets.ready('enemies')) return fallbackEnemyProductionDraw.call(this, c, cameraY);
  const sy = this.y - cameraY;
  if (sy < -120 || sy > H + 140) return;
  const state = this.dead ? 3 : this.hitFlash > 0 ? 2 : this.fireTimer > 0 && this.fireTimer < Math.min(.16, this.fireRate * .28) ? 1 : 0;
  const size = this.typeKey === 'boss' ? 154 : this.flying ? 104 : this.behavior === 'heavy' ? 118 : 96;
  const rotation = this.dead ? Math.sin(clamp(this.deathTimer / 1.2, 0, 1) * Math.PI) * .65 * this.orbitDir : this.angle + Math.PI / 2;
  c.save();
  c.globalAlpha = this.dead ? 1 - clamp((this.deathTimer - .7) / .75, 0, 1) : 1;
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(this.x, sy + size * .23, size * .28, size * .1, 0, 0, TAU); c.fill();
  productionAssets.drawCell(c, 'enemies', state, row, this.x - size / 2, sy - size * .59, size, size, rotation, 1);
  if (state === 1 && !this.dead) {
    const mx = this.x + Math.cos(this.angle) * size * .4, my = sy + Math.sin(this.angle) * size * .4;
    productionAssets.drawCell(c, 'vfx', (Math.floor(this.phase * 12) & 7), 0, mx - 24, my - 24, 48, 48, this.angle, .85);
  }
  if (this.elite && !this.dead) {
    c.globalAlpha = .68 + Math.sin(this.phase * 5) * .22; c.strokeStyle = '#ffd45a'; c.lineWidth = 3; c.setLineDash([7, 6]);
    c.beginPath(); c.arc(this.x, sy, this.radius + 11, 0, TAU); c.stroke(); c.setLineDash([]);
    text(c, 'ELITE', this.x, sy - this.radius - 36, 9, '#ffd45a', 'center', 900, 'Inter, sans-serif');
  }
  if (this.telegraph > 0 && !this.dead) {
    c.globalAlpha = clamp(1 - this.telegraph, .25, .85); c.strokeStyle = '#ff3f3f'; c.lineWidth = 2; c.setLineDash([10, 9]);
    c.beginPath(); c.moveTo(this.x, sy); c.lineTo(game.player.x, game.player.y - cameraY); c.stroke(); c.setLineDash([]);
  }
  c.restore();
  if (!this.dead && this.hp < this.maxHp && this.typeKey !== 'boss') {
    const w = this.radius * 2.35; c.fillStyle = 'rgba(5,10,14,.8)'; c.fillRect(this.x - w / 2, sy - this.radius - 27, w, 7);
    c.fillStyle = this.elite ? '#ffd45a' : '#ff5b45'; c.fillRect(this.x - w / 2, sy - this.radius - 27, w * clamp(this.hp / this.maxHp, 0, 1), 7);
  }
};

const fallbackPickupProductionDraw = Pickup.prototype.draw;
Pickup.prototype.draw = function(c, cameraY) {
  if (!productionAssets.ready('pickups')) return fallbackPickupProductionDraw.call(this, c, cameraY);
  const y = this.y - cameraY + Math.sin(this.phase) * 5;
  let row = 0, col = PICKUP_ATLAS_ITEMS.indexOf(this.type);
  if (this.type === 'weapon') { row = 1; col = WEAPON_ATLAS_ITEMS.indexOf(this.value); }
  if (col < 0) col = 2;
  c.save(); c.shadowColor = this.type === 'weapon' ? '#42e8dc' : this.type === 'health' ? '#ff6258' : '#ffd45a'; c.shadowBlur = 20;
  productionAssets.drawCell(c, 'pickups', col, row, this.x - 38, y - 38, 76, 76, Math.sin(this.phase * .7) * .05, 1);
  c.restore();
};

const fallbackPropProductionDraw = Game.prototype.drawProp;
Game.prototype.drawProp = function(c, o, p) {
  if (!productionAssets.ready('environment')) return fallbackPropProductionDraw.call(this, c, o, p);
  const biome = Math.max(0, BIOME_ATLAS_ROWS.indexOf(this.level.palette));
  const categories = {
    rock: 1, salt: 1, crater: 1, bones: 1,
    scrub: 2, palm: 2, pool: 2, banner: 2, lamp: 2,
    wreck: 3, truck: 3,
    wall: 4, ruin: 4, concrete: 4, market: 4, pillar: 4, pipe: 4, tank: 4, reactor: 4, vent: 4, hazard: 4,
    checkpoint: 5, barrier: 5, antenna: 5,
  };
  const col = categories[o.type] ?? 2;
  const sy = o.y - this.cameraY;
  const base = col === 3 ? 150 : col === 4 ? 132 : col === 5 ? 122 : 106;
  const size = base * o.scale;
  productionAssets.drawCell(c, 'environment', col, biome, o.x - size / 2, sy - size / 2, size, size, o.rot * .12, 1);
};

const fallbackExplodeProduction = Game.prototype.explode;
Game.prototype.explode = function(x, y, radius, damage, team) {
  const result = fallbackExplodeProduction.call(this, x, y, radius, damage, team);
  if (productionAssets.ready('vfx')) {
    this.particles.push(new AtlasBurst(x, y, 1, Math.max(90, radius * 1.55), .55, rand(-.25, .25)));
    this.particles.push(new AtlasBurst(x, y, 2, Math.max(80, radius * 1.28), 1.05, rand(-.4, .4)));
  }
  return result;
};

const fallbackMenuProductionDraw = Game.prototype.drawMenu;
Game.prototype.drawMenu = function(c) {
  if (!productionAssets.ready('keyArt') || !productionAssets.ready('logo')) return fallbackMenuProductionDraw.call(this, c);
  const pulse = (Math.sin(this.time * 1.7) + 1) * .5;
  productionAssets.drawCover(c, 'keyArt', 0, 0, W, H, 1);
  const vignette = c.createLinearGradient(0, 0, 640, 0); vignette.addColorStop(0, 'rgba(3,9,14,.99)'); vignette.addColorStop(.72, 'rgba(3,9,14,.84)'); vignette.addColorStop(1, 'rgba(3,9,14,0)');
  c.fillStyle = vignette; c.fillRect(0, 0, 740, H);
  c.fillStyle = 'rgba(4,11,16,.9)'; roundRect(c, 34, 26, 492, 664, 18); c.fill();
  c.strokeStyle = 'rgba(66,232,220,.3)'; c.lineWidth = 2; c.stroke();
  productionAssets.drawContain(c, 'logo', 62, 44, 430, 164, 1);
  text(c, 'A DESERT EXTRACTION CAMPAIGN', 66, 198, 11, '#9cb1b7', 'left', 900, 'Inter, sans-serif');
  const startY = 224;
  this.menuItems.forEach((item, i) => {
    const selected = i === this.menuIndex, x = 58, y = startY + i * 57, w = 442, h = 46;
    this.button(c, x, y, w, h, item, () => this.activateMenu(i), selected, i === 1 ? '#ffd45a' : selected ? '#ff6b2c' : '#42e8dc');
  });
  c.fillStyle = 'rgba(2,8,12,.86)'; roundRect(c, 58, 528, 442, 132, 13); c.fill();
  text(c, 'OPERATOR RECORD', 78, 550, 10, '#7d969e', 'left', 900, 'Inter, sans-serif');
  text(c, formatScore(this.highScore), 78, 580, 25, '#f8f2df');
  const diffIcon = uiCellFor(this.difficultyKey); productionAssets.drawCell(c, 'ui', diffIcon.col, diffIcon.row, 371, 548, 50, 50, 0, .95);
  text(c, this.difficulty.label, 482, 573, 15, '#ff9867', 'right');
  text(c, `SCORE POTENTIAL  x${this.difficulty.score.toFixed(2)}`, 482, 602, 10, '#96abb2', 'right', 900, 'Inter, sans-serif');
  text(c, 'M  AUDIO', 482, 636, 10, pulse > .5 ? '#42e8dc' : '#7f959d', 'right', 900, 'Inter, sans-serif');
  text(c, 'FICTIONAL OPERATION · ORIGINAL VISUALS · NO STOCK ASSETS', W - 28, H - 22, 10, 'rgba(255,255,255,.62)', 'right', 800, 'Inter, sans-serif');
};

const fallbackIntroProductionDraw = Game.prototype.drawIntro;
Game.prototype.drawIntro = function(c) {
  if (!productionAssets.ready('comicIntro')) return fallbackIntroProductionDraw.call(this, c);
  c.fillStyle = '#03080c'; c.fillRect(0, 0, W, H);
  productionAssets.drawCover(c, 'comicIntro', 0, 0, W, H, 1);
  c.fillStyle = 'rgba(2,8,12,.84)'; roundRect(c, 38, H - 76, 420, 44, 10); c.fill();
  text(c, `INTEL PANEL ${String(this.introIndex + 1).padStart(2, '0')} / ${String(INTRO_PANELS.length).padStart(2, '0')}`, 58, H - 54, 11, '#42e8dc', 'left', 900, 'Inter, sans-serif');
  text(c, 'CLICK / ENTER TO ADVANCE', 438, H - 54, 10, '#f0c77b', 'right', 900, 'Inter, sans-serif');
  this.button(c, W - 204, 18, 162, 38, 'SKIP INTRO', () => this.startLevel(0), false, '#ff6b2c');
};

const fallbackDifficultyProductionDraw = Game.prototype.drawDifficulty;
Game.prototype.drawDifficulty = function(c) {
  fallbackDifficultyProductionDraw.call(this, c);
  Object.values(DIFFICULTIES).forEach((d, i) => {
    const x = 64 + i * 296, y = 154;
    drawUiIcon(c, d.key, x + 188, y + 22, 58, i === this.difficultyIndex ? 1 : .62);
  });
  productionAssets.drawContain(c, 'logo', 880, 36, 330, 80, .92);
};

const fallbackArmoryProductionDraw = Game.prototype.drawArmory;
Game.prototype.drawArmory = function(c) {
  fallbackArmoryProductionDraw.call(this, c);
  const doctrineIcons = { power: 'power', ghost: 'ghost', iron: 'iron', scavenge: 'scavenge', explosive: 'explosive', combo: 'combo', damage: 'damage', reload: 'reload', dash: 'dash' };
  this.armoryChoices.forEach((d, i) => {
    const x = 78 + i * 402, y = 166;
    drawUiIcon(c, doctrineIcons[d.key] || 'power', x + 26, y + 27, 64, i === this.armoryIndex ? 1 : .72);
  });
  productionAssets.drawContain(c, 'logo', 875, 38, 330, 76, .86);
};

const fallbackBriefingProductionDraw = Game.prototype.drawBriefing;
Game.prototype.drawBriefing = function(c) {
  fallbackBriefingProductionDraw.call(this, c);
  if (productionAssets.ready('hero')) {
    c.save();
    c.fillStyle = 'rgba(3,9,14,.74)'; roundRect(c, 1017, 118, 164, 280, 14); c.fill();
    c.strokeStyle = 'rgba(255,107,44,.58)'; c.lineWidth = 2; c.stroke();
    productionAssets.drawCover(c, 'hero', 1023, 124, 152, 268, .92);
    c.restore();
  }
  productionAssets.drawContain(c, 'logo', 820, 34, 350, 72, .92);
};

const fallbackHudProductionDraw = Game.prototype.drawHUD;
Game.prototype.drawHUD = function(c) {
  fallbackHudProductionDraw.call(this, c);
  const weaponIndex = Math.max(0, WEAPON_ATLAS_ITEMS.indexOf(this.player.weaponKey));
  productionAssets.drawCell(c, 'pickups', weaponIndex, 1, W - 380, 37, 54, 54, 0, .9);
  const d = uiCellFor(this.difficultyKey); productionAssets.drawCell(c, 'ui', d.col, d.row, W / 2 + 157, 27, 42, 42, 0, .85);
};

const fallbackVictoryProductionDraw = Game.prototype.drawVictory;
Game.prototype.drawVictory = function(c) {
  fallbackVictoryProductionDraw.call(this, c);
  if (productionAssets.ready('hero')) {
    c.save(); roundRect(c, 742, 106, 398, 410, 16); c.clip(); productionAssets.drawCover(c, 'hero', 742, 106, 398, 410, .94); c.restore();
    c.strokeStyle = '#071018'; c.lineWidth = 8; roundRect(c, 742, 106, 398, 410, 16); c.stroke();
    c.fillStyle = 'rgba(3,9,14,.88)'; c.fillRect(742, 455, 398, 61);
    text(c, this.level.reward ? 'REQUISITION APPROVED' : 'CORE ROUTE CONFIRMED', 941, 475, 10, '#8ea2aa', 'center', 900, 'Inter, sans-serif');
    text(c, this.level.reward ? WEAPONS[this.level.reward].name : 'FINAL APPROACH', 941, 500, 17, this.level.reward ? '#42e8dc' : '#ff6b2c', 'center');
  }
};

const fallbackCampaignVictoryProductionDraw = Game.prototype.drawCampaignVictory;
Game.prototype.drawCampaignVictory = function(c) {
  fallbackCampaignVictoryProductionDraw.call(this, c);
  if (productionAssets.ready('logo')) productionAssets.drawContain(c, 'logo', W / 2 - 260, 52, 520, 105, .92);
};

// Expose the production manifest for QA and future native ports.
game.productionAssets = BLACK_HORIZON_ASSET_MANIFEST;
document.title = 'Black Horizon: Cinder Protocol';


const fallbackCreditsProductionDraw = Game.prototype.drawCredits;
Game.prototype.drawCredits = function(c) {
  c.fillStyle = '#071018'; c.fillRect(0, 0, W, H); this.drawTopographic(c, '#42e8dc');
  productionAssets.drawContain(c, 'logo', 330, 42, 620, 130, 1);
  c.fillStyle = 'rgba(255,255,255,.035)'; roundRect(c, 140, 168, 1000, 470, 18); c.fill(); c.strokeStyle = 'rgba(255,255,255,.12)'; c.stroke();
  const items = [
    ['GAME DESIGN + ENGINE', 'Original dependency-free HTML5 Canvas architecture'],
    ['PRODUCTION ART', 'Custom SVG sprite, environment, VFX, UI, portrait and comic atlases'],
    ['MUSIC + SOUND', 'Original real-time WebAudio score and procedural SFX'],
    ['CAMPAIGN SYSTEMS', 'Six missions, four difficulties, mutators, doctrines and combat director'],
    ['ACCESS', 'Keyboard, mouse, touch controls and responsive presentation'],
    ['ASSET POLICY', 'No stock packs, copied sprites, sample tracks or placeholder assets'],
  ];
  items.forEach((item, i) => { const y = 214 + i * 62; text(c, item[0], 222, y, 11, i % 2 ? '#42e8dc' : '#ff8b57', 'left', 900, 'Inter, sans-serif'); text(c, item[1], 222, y + 25, 15, '#cad4d5', 'left', 650, 'Inter, sans-serif'); });
  this.wrapText(c, 'Black Horizon: Cinder Protocol is a fictional arcade narrative. It does not depict real operations, real individuals, or real faction insignia.', W / 2, 574, 760, 13, 21, '#84979e', false, 'center');
  text(c, 'PRESS ENTER / CLICK TO RETURN', W / 2, 616, 11, '#ff9564', 'center', 900, 'Inter, sans-serif');
};

const originalCampaignVictoryBrandedDraw = Game.prototype.drawCampaignVictory;
Game.prototype.drawCampaignVictory = function(c) {
  originalCampaignVictoryBrandedDraw.call(this, c);
  c.fillStyle = 'rgba(5,12,18,.97)'; roundRect(c, W / 2 - 390, 122, 780, 98, 14); c.fill();
  productionAssets.drawContain(c, 'logo', W / 2 - 320, 128, 640, 84, 1);
};

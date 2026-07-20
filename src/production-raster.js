// BLACK HORIZON raster production presentation layer.
// Loaded after the gameplay atlas runtime. Ten production boards are packed into
// one cache-efficient WebP atlas and every board is used by a live game screen.
const RASTER_PRODUCTION_MANIFEST = {
  src: '__RASTER_ATLAS_URL__',
  width: 1536,
  height: 1328,
  regions: {
    keyArt: { x: 0, y: 0, w: 768, h: 432 },
    comicIntro: { x: 768, y: 0, w: 768, h: 432 },
    playerBoard: { x: 0, y: 432, w: 384, h: 256 },
    enemyBoard: { x: 384, y: 432, w: 384, h: 256 },
    bossBoard: { x: 768, y: 432, w: 384, h: 256 },
    itemsBoard: { x: 1152, y: 432, w: 384, h: 256 },
    vfxBoard: { x: 0, y: 688, w: 384, h: 256 },
    uiBoard: { x: 384, y: 688, w: 384, h: 256 },
    environmentBoard: { x: 768, y: 688, w: 384, h: 384 },
    logo: { x: 0, y: 1072, w: 768, h: 256 },
  },
};

class RasterProductionBank {
  constructor(manifest) {
    this.manifest = manifest;
    this.image = new Image();
    this.image.decoding = 'async';
    this.loaded = 0;
    this.total = Object.keys(manifest.regions).length;
    this.image.onload = () => { this.loaded = this.total; };
    this.image.onerror = () => console.warn(`Raster production atlas unavailable: ${manifest.src}`);
    this.image.src = manifest.src;
  }
  ready(key) {
    return Boolean(this.manifest.regions[key] && this.image.complete && this.image.naturalWidth > 0);
  }
  cover(c, key, x, y, w, h, alpha = 1, focusX = .5, focusY = .5) {
    const region = this.manifest.regions[key];
    if (!this.ready(key)) return false;
    const scale = Math.max(w / region.w, h / region.h);
    const sw = w / scale, sh = h / scale;
    const sx = region.x + clamp((region.w - sw) * focusX, 0, Math.max(0, region.w - sw));
    const sy = region.y + clamp((region.h - sh) * focusY, 0, Math.max(0, region.h - sh));
    c.save(); c.globalAlpha *= alpha;
    c.drawImage(this.image, sx, sy, sw, sh, x, y, w, h);
    c.restore();
    return true;
  }
  contain(c, key, x, y, w, h, alpha = 1) {
    const region = this.manifest.regions[key];
    if (!this.ready(key)) return false;
    const scale = Math.min(w / region.w, h / region.h);
    const dw = region.w * scale, dh = region.h * scale;
    c.save(); c.globalAlpha *= alpha;
    c.drawImage(this.image, region.x, region.y, region.w, region.h, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    c.restore();
    return true;
  }
}

const rasterAssets = new RasterProductionBank(RASTER_PRODUCTION_MANIFEST);
window.__blackHorizonRaster = rasterAssets;
game.rasterAssets = RASTER_PRODUCTION_MANIFEST;

const vectorAssets = window.__blackHorizonAssets;
const drawBrandSafeBackdrop = (c, accent = '#ff6b2c') => {
  const gradient = c.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, '#03080c'); gradient.addColorStop(.55, '#10242e'); gradient.addColorStop(1, '#5a2b26');
  c.fillStyle = gradient; c.fillRect(0, 0, W, H);
  c.strokeStyle = `${accent}33`; c.lineWidth = 1;
  for (let x = -H; x < W + H; x += 48) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + H, H); c.stroke(); }
};
const drawTextLogoFallback = (c, x, y, scale = 1, align = 'left') => {
  strokeText(c, 'BLACK HORIZON', x, y, 52 * scale, '#f8f2df', '#03080c', 10 * scale, align);
  text(c, 'CINDER PROTOCOL', x, y + 42 * scale, 16 * scale, '#ff6b2c', align, 900, 'Inter, sans-serif');
};

const atlasPlayerDraw = Player.prototype.draw;
Player.prototype.draw = function(c, cameraY) {
  if (vectorAssets?.ready('player')) return atlasPlayerDraw.call(this, c, cameraY);
  const sy = this.y - cameraY;
  c.save(); c.translate(this.x, sy); c.rotate(this.aim + Math.PI / 2);
  c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, 24, 28, 10, 0, 0, TAU); c.fill();
  c.fillStyle = '#263b3b'; c.strokeStyle = '#071018'; c.lineWidth = 5; roundRect(c, -20, -24, 40, 54, 12); c.fill(); c.stroke();
  c.fillStyle = '#c98e67'; c.beginPath(); c.arc(0, -36, 14, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = '#42e8dc'; c.fillRect(-12, -40, 24, 4);
  c.strokeStyle = '#121b20'; c.lineWidth = 8; c.beginPath(); c.moveTo(0, -15); c.lineTo(0, -61); c.stroke();
  c.fillStyle = '#26333a'; roundRect(c, -6, -68, 12, 51, 3); c.fill();
  c.restore();
};

const atlasEnemyDraw = Enemy.prototype.draw;
Enemy.prototype.draw = function(c, cameraY) {
  if (vectorAssets?.ready('enemies')) return atlasEnemyDraw.call(this, c, cameraY);
  const sy = this.y - cameraY;
  if (sy < -100 || sy > H + 120) return;
  const size = this.typeKey === 'boss' ? 58 : this.flying ? 30 : 38;
  c.save(); c.translate(this.x, sy); c.rotate((this.angle || 0) + Math.PI / 2);
  c.globalAlpha = this.dead ? Math.max(0, 1 - this.deathTimer) : 1;
  c.fillStyle = this.elite ? '#8f6a2d' : '#5a4037'; c.strokeStyle = '#071018'; c.lineWidth = 5;
  roundRect(c, -size * .45, -size * .48, size * .9, size, size * .2); c.fill(); c.stroke();
  c.fillStyle = this.typeKey === 'medic' ? '#63f0c3' : this.typeKey === 'boss' ? '#ff6b2c' : '#d09a65';
  c.beginPath(); c.arc(0, -size * .62, size * .22, 0, TAU); c.fill(); c.stroke();
  c.strokeStyle = '#1a252b'; c.lineWidth = Math.max(5, size * .13); c.beginPath(); c.moveTo(0, -size * .25); c.lineTo(0, -size * 1.1); c.stroke();
  c.restore();
};

const atlasPickupDraw = Pickup.prototype.draw;
Pickup.prototype.draw = function(c, cameraY) {
  if (vectorAssets?.ready('pickups')) return atlasPickupDraw.call(this, c, cameraY);
  const sy = this.y - cameraY + Math.sin(this.phase) * 4;
  c.save(); c.translate(this.x, sy); c.rotate(this.phase * .08);
  c.fillStyle = this.type === 'health' ? '#ff5d55' : this.type === 'armor' ? '#5ed4ff' : '#ffd45a';
  c.strokeStyle = '#071018'; c.lineWidth = 5; roundRect(c, -22, -22, 44, 44, 9); c.fill(); c.stroke();
  text(c, this.type === 'health' ? '+' : this.type === 'armor' ? 'A' : this.type === 'grenade' ? 'G' : '•', 0, 1, 18, '#071018', 'center');
  c.restore();
};

const atlasPropDraw = Game.prototype.drawProp;
Game.prototype.drawProp = function(c, o, p) {
  if (vectorAssets?.ready('environment')) return atlasPropDraw.call(this, c, o, p);
  const sy = o.y - this.cameraY, r = 24 * o.scale;
  c.save(); c.translate(o.x, sy); c.rotate(o.rot || 0);
  c.fillStyle = o.type === 'palm' || o.type === 'scrub' ? '#53664a' : o.type === 'wreck' || o.type === 'truck' ? '#303b3f' : p?.sand2 || '#9b664d';
  c.strokeStyle = '#071018'; c.lineWidth = 4; roundRect(c, -r, -r * .7, r * 2, r * 1.4, 8); c.fill(); c.stroke();
  c.restore();
};

const vectorMenuDraw = Game.prototype.drawMenu;
Game.prototype.drawMenu = function(c) {
  if (!rasterAssets.ready('keyArt')) {
    if (vectorAssets?.ready('keyArt') && vectorAssets?.ready('logo')) return vectorMenuDraw.call(this, c);
    drawBrandSafeBackdrop(c); drawTextLogoFallback(c, 60, 90, 1.1);
  } else {
    rasterAssets.cover(c, 'keyArt', 0, 0, W, H, 1, .52, .5);
  }
  const shade = c.createLinearGradient(0, 0, 760, 0); shade.addColorStop(0, 'rgba(2,7,11,.99)'); shade.addColorStop(.72, 'rgba(2,7,11,.87)'); shade.addColorStop(1, 'rgba(2,7,11,0)');
  c.fillStyle = shade; c.fillRect(0, 0, 820, H);
  c.fillStyle = 'rgba(3,9,14,.88)'; roundRect(c, 30, 24, 505, 670, 18); c.fill(); c.strokeStyle = 'rgba(255,107,44,.48)'; c.lineWidth = 2; c.stroke();
  if (!rasterAssets.contain(c, 'logo', 56, 40, 450, 154, 1)) drawTextLogoFallback(c, 66, 92, .83);
  text(c, 'DESERT EXTRACTION CAMPAIGN', 64, 194, 11, '#d1a765', 'left', 900, 'Inter, sans-serif');
  const startY = 222;
  this.menuItems.forEach((item, i) => this.button(c, 58, startY + i * 58, 448, 46, item, () => this.activateMenu(i), i === this.menuIndex, i === 1 ? '#ffd45a' : i === this.menuIndex ? '#ff6b2c' : '#42e8dc'));
  c.fillStyle = 'rgba(2,8,12,.9)'; roundRect(c, 58, 526, 448, 136, 13); c.fill();
  text(c, 'OPERATOR RECORD', 78, 550, 10, '#7d969e', 'left', 900, 'Inter, sans-serif');
  text(c, formatScore(this.highScore), 78, 582, 25, '#f8f2df');
  text(c, this.difficulty.label, 482, 574, 15, '#ff9867', 'right');
  text(c, `SCORE POTENTIAL  x${this.difficulty.score.toFixed(2)}`, 482, 606, 10, '#96abb2', 'right', 900, 'Inter, sans-serif');
  text(c, `PRODUCTION PACK ${rasterAssets.loaded}/${rasterAssets.total}`, 482, 638, 9, rasterAssets.loaded === rasterAssets.total ? '#63f0c3' : '#ffd45a', 'right', 900, 'Inter, sans-serif');
  text(c, 'FICTIONAL OPERATION · ORIGINAL PRODUCTION ART', W - 28, H - 22, 10, 'rgba(255,255,255,.68)', 'right', 800, 'Inter, sans-serif');
};

const vectorIntroDraw = Game.prototype.drawIntro;
Game.prototype.drawIntro = function(c) {
  if (rasterAssets.ready('comicIntro')) {
    c.fillStyle = '#03080c'; c.fillRect(0, 0, W, H); rasterAssets.cover(c, 'comicIntro', 0, 0, W, H, 1);
    c.fillStyle = 'rgba(2,8,12,.86)'; roundRect(c, 34, H - 72, 430, 42, 10); c.fill();
    text(c, `INTEL PANEL ${String(this.introIndex + 1).padStart(2, '0')} / ${String(INTRO_PANELS.length).padStart(2, '0')}`, 54, H - 51, 10, '#42e8dc', 'left', 900, 'Inter, sans-serif');
    text(c, 'CLICK / ENTER TO ADVANCE', 444, H - 51, 10, '#f0c77b', 'right', 900, 'Inter, sans-serif');
    this.button(c, W - 204, 18, 162, 38, 'SKIP INTRO', () => this.startLevel(0), false, '#ff6b2c');
    return;
  }
  if (vectorAssets?.ready('comicIntro')) return vectorIntroDraw.call(this, c);
  drawBrandSafeBackdrop(c); drawTextLogoFallback(c, W / 2, 105, .9, 'center');
  this.wrapText(c, INTRO_PANELS[this.introIndex]?.body || 'The Cinder Protocol is active. Recover the stolen core.', W / 2, 300, 760, 24, 36, '#f8f2df', false, 'center');
  text(c, 'ENTER / CLICK TO ADVANCE', W / 2, H - 70, 11, '#ff9564', 'center', 900, 'Inter, sans-serif');
};

const productionDifficultyDraw = Game.prototype.drawDifficulty;
Game.prototype.drawDifficulty = function(c) {
  if (rasterAssets.ready('uiBoard')) rasterAssets.cover(c, 'uiBoard', 0, 0, W, H, .16, .52, .42);
  productionDifficultyDraw.call(this, c);
};

const productionArmoryDraw = Game.prototype.drawArmory;
Game.prototype.drawArmory = function(c) {
  if (rasterAssets.ready('itemsBoard')) rasterAssets.cover(c, 'itemsBoard', 0, 0, W, H, .18, .5, .52);
  productionArmoryDraw.call(this, c);
};

const productionBriefingDraw = Game.prototype.drawBriefing;
Game.prototype.drawBriefing = function(c) {
  if (this.levelIndex === LEVELS.length - 1 && rasterAssets.ready('bossBoard')) rasterAssets.cover(c, 'bossBoard', 720, 112, 500, 390, .38, .58, .46);
  else if (rasterAssets.ready('enemyBoard')) rasterAssets.cover(c, 'enemyBoard', 720, 112, 500, 390, .3, .5, .43);
  productionBriefingDraw.call(this, c);
};

const productionMissionSelectDraw = Game.prototype.drawMissionSelect;
Game.prototype.drawMissionSelect = function(c) {
  if (rasterAssets.ready('environmentBoard')) rasterAssets.cover(c, 'environmentBoard', 0, 0, W, H, .17, .5, .5);
  productionMissionSelectDraw.call(this, c);
};

const productionHowToDraw = Game.prototype.drawHowTo;
Game.prototype.drawHowTo = function(c) {
  productionHowToDraw.call(this, c);
  if (rasterAssets.ready('playerBoard')) {
    c.save(); roundRect(c, 918, 132, 290, 438, 16); c.clip(); rasterAssets.cover(c, 'playerBoard', 918, 132, 290, 438, .44, .68, .44); c.restore();
    c.strokeStyle = 'rgba(255,107,44,.58)'; c.lineWidth = 2; roundRect(c, 918, 132, 290, 438, 16); c.stroke();
  }
};

const productionVictoryDraw = Game.prototype.drawVictory;
Game.prototype.drawVictory = function(c) {
  if (rasterAssets.ready('vfxBoard')) rasterAssets.cover(c, 'vfxBoard', 0, 0, W, H, .12, .55, .5);
  productionVictoryDraw.call(this, c);
};

Game.prototype.drawCampaignVictory = function(c) {
  if (rasterAssets.ready('bossBoard')) rasterAssets.cover(c, 'bossBoard', 0, 0, W, H, .44, .55, .45); else drawBrandSafeBackdrop(c, '#42e8dc');
  c.fillStyle = 'rgba(2,8,12,.84)'; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(5,12,18,.94)'; roundRect(c, W / 2 - 430, 72, 860, 548, 22); c.fill(); c.strokeStyle = '#42e8dc'; c.lineWidth = 3; c.stroke();
  if (!rasterAssets.contain(c, 'logo', W / 2 - 320, 82, 640, 116, 1)) drawTextLogoFallback(c, W / 2, 120, .9, 'center');
  text(c, 'CINDER PROTOCOL COMPLETE', W / 2, 224, 13, '#42e8dc', 'center', 900, 'Inter, sans-serif');
  strokeText(c, 'CORE SECURED', W / 2, 294, 62, '#f8f2df', '#071018', 12, 'center');
  c.fillStyle = '#ff6b2c'; c.fillRect(W / 2 - 220, 322, 440, 8);
  this.wrapText(c, 'Containment teams received the isotope core intact. The Cinder Directorate network is offline, and the surviving operators are coming home.', W / 2, 372, 650, 20, 31, '#d2dcdb', false, 'center');
  text(c, `FINAL SCORE  ${formatScore(this.score)}`, W / 2, 480, 28, '#ffd45a', 'center');
  text(c, `TOTAL HOSTILES  ${this.kills}`, W / 2, 522, 13, '#98abb2', 'center', 800, 'Inter, sans-serif');
  text(c, 'RANGER ONE // MISSION ACCOMPLISHED', W / 2, 566, 12, '#ff9b65', 'center', 900, 'Inter, sans-serif');
  this.button(c, W / 2 - 190, H - 78, 380, 48, 'RETURN TO MAIN MENU', () => this.setState('menu'), true, '#42e8dc');
};

Game.prototype.drawCredits = function(c) {
  drawBrandSafeBackdrop(c, '#42e8dc');
  if (rasterAssets.ready('uiBoard')) rasterAssets.cover(c, 'uiBoard', 0, 0, W, H, .13, .5, .5);
  c.fillStyle = 'rgba(3,9,14,.94)'; roundRect(c, 44, 30, 1192, 660, 20); c.fill(); c.strokeStyle = 'rgba(255,107,44,.45)'; c.lineWidth = 2; c.stroke();
  if (!rasterAssets.contain(c, 'logo', 350, 40, 580, 105, 1)) drawTextLogoFallback(c, W / 2, 86, .78, 'center');
  text(c, 'PRODUCTION ASSET INDEX', W / 2, 157, 12, '#d1a765', 'center', 900, 'Inter, sans-serif');
  const boards = [
    ['playerBoard', 'OPERATOR ANIMATION'], ['enemyBoard', 'HOSTILE ROSTER'], ['bossBoard', 'BOSS PHASES'],
    ['itemsBoard', 'ARSENAL + PICKUPS'], ['vfxBoard', 'COMBAT EFFECTS'], ['environmentBoard', 'WORLD KIT'],
  ];
  boards.forEach(([key, label], i) => {
    const col = i % 3, row = Math.floor(i / 3), x = 76 + col * 388, y = 190 + row * 216;
    c.save(); roundRect(c, x, y, 350, 168, 12); c.clip(); rasterAssets.cover(c, key, x, y, 350, 168, .82, .5, .48); c.restore();
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 2; roundRect(c, x, y, 350, 168, 12); c.stroke();
    c.fillStyle = 'rgba(2,8,12,.88)'; c.fillRect(x, y + 132, 350, 36);
    text(c, label, x + 16, y + 150, 10, i % 2 ? '#42e8dc' : '#ff9b65', 'left', 900, 'Inter, sans-serif');
  });
  text(c, `PRODUCTION ASSETS LOADED  ${rasterAssets.loaded}/${rasterAssets.total}`, W / 2, 636, 11, rasterAssets.loaded === rasterAssets.total ? '#63f0c3' : '#ffd45a', 'center', 900, 'Inter, sans-serif');
  text(c, 'BLACK HORIZON: CINDER PROTOCOL IS A FICTIONAL ORIGINAL WORK', W / 2, 662, 10, '#84979e', 'center', 900, 'Inter, sans-serif');
  text(c, 'PRESS ENTER / CLICK TO RETURN', W / 2, 682, 10, '#ff9564', 'center', 900, 'Inter, sans-serif');
};

document.title = 'Black Horizon: Cinder Protocol';

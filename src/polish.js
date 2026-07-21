// BLACK HORIZON final presentation and accessibility polish.
(() => {
  'use strict';

  const version = '1.1.0';
  const canvas = document.querySelector('#game');
  const reducedMotion = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const highContrast = Boolean(window.matchMedia?.('(prefers-contrast: more)').matches);
  const stateLabels = {
    menu: 'Main menu', intro: 'Mission intelligence', difficulty: 'Difficulty selection', briefing: 'Mission briefing',
    playing: 'Operation active', paused: 'Operation paused', pause: 'Operation paused', armory: 'Field armory',
    missionSelect: 'Mission selection', howTo: 'Field manual', victory: 'Mission complete', defeat: 'Mission failed',
    campaignVictory: 'Campaign complete', credits: 'Production credits',
  };

  const liveRegion = document.createElement('div');
  liveRegion.id = 'black-horizon-live-status';
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  Object.assign(liveRegion.style, {
    position: 'fixed', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden',
    clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: '0',
  });
  document.body.appendChild(liveRegion);

  let lastAnnouncement = '';
  const announce = (message) => {
    if (!message || message === lastAnnouncement) return;
    lastAnnouncement = message;
    liveRegion.textContent = '';
    window.setTimeout(() => { liveRegion.textContent = message; }, 20);
  };

  if (canvas) {
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Black Horizon: Cinder Protocol. Top-down action game. Use WASD or arrow keys to move, mouse to aim and fire, Shift to dash, Space for grenades, P to pause, and Alt plus Enter for fullscreen.');
    canvas.addEventListener('pointerdown', () => canvas.focus({ preventScroll: true }));
  }

  const toggleFullscreen = async () => {
    const target = canvas?.parentElement || canvas;
    if (!target || !document.fullscreenEnabled) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await target.requestFullscreen({ navigationUI: 'hide' });
      announce(document.fullscreenElement ? 'Fullscreen enabled' : 'Fullscreen disabled');
    } catch (error) {
      console.warn('Fullscreen transition unavailable', error);
    }
  };
  document.addEventListener('keydown', (event) => {
    if (event.altKey && event.key === 'Enter') {
      event.preventDefault();
      toggleFullscreen();
    }
  });

  const originalSetState = Game.prototype.setState;
  if (typeof originalSetState === 'function') {
    Game.prototype.setState = function(nextState, ...args) {
      const previousState = this.state;
      const result = originalSetState.call(this, nextState, ...args);
      if (previousState !== nextState) {
        this.__polishTransition = {
          from: previousState,
          to: nextState,
          started: performance.now(),
          duration: reducedMotion ? 0 : 420,
        };
        const levelName = nextState === 'briefing' && this.level?.codename ? `: ${this.level.codename}` : '';
        announce(`${stateLabels[nextState] || nextState}${levelName}`);
        document.title = `${stateLabels[nextState] || 'Black Horizon'} — Black Horizon: Cinder Protocol`;
      }
      return result;
    };
  }

  const drawVignette = (c, strength = .42) => {
    const gradient = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .25, W / 2, H / 2, Math.max(W, H) * .72);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${strength})`);
    c.fillStyle = gradient;
    c.fillRect(0, 0, W, H);
  };

  const drawAmbientDust = (instance, c, amount = 12) => {
    if (reducedMotion) return;
    const now = Number.isFinite(instance.time) ? instance.time : performance.now() / 1000;
    c.save();
    for (let index = 0; index < amount; index++) {
      const phase = now * (.08 + index * .004) + index * 12.7;
      const x = ((index * 193 + phase * 46) % (W + 120)) - 60;
      const y = 70 + ((index * 89 + Math.sin(phase) * 110) % (H - 120));
      const radius = 1.2 + (index % 4) * .65;
      c.globalAlpha = .08 + (index % 3) * .035;
      c.fillStyle = index % 4 === 0 ? '#42e8dc' : '#f0c77b';
      c.beginPath(); c.arc(x, y, radius, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  };

  const drawTransition = (instance, c) => {
    const transition = instance.__polishTransition;
    if (!transition || !transition.duration) return;
    const progress = Math.min(1, (performance.now() - transition.started) / transition.duration);
    if (progress >= 1) { instance.__polishTransition = null; return; }
    const alpha = (1 - progress) ** 2;
    c.save();
    c.fillStyle = `rgba(2,7,11,${alpha * .94})`;
    c.fillRect(0, 0, W, H);
    c.fillStyle = `rgba(255,107,44,${alpha * .9})`;
    c.fillRect(0, H * progress - 3, W, 6);
    c.restore();
  };

  const drawFramePolish = (instance, c, kind) => {
    drawVignette(c, highContrast ? .56 : .38);
    if (kind === 'menu' || kind === 'briefing' || kind === 'intro') drawAmbientDust(instance, c, kind === 'menu' ? 18 : 10);
    c.save();
    c.fillStyle = highContrast ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.18)';
    c.fillRect(24, 18, W - 48, 1);
    c.fillStyle = 'rgba(255,107,44,.72)';
    c.fillRect(24, 18, 132, 3);
    c.restore();
    if (kind === 'menu') {
      text(c, 'ALT+ENTER  FULLSCREEN   ·   P  PAUSE   ·   M  AUDIO', 58, H - 20, 9, '#9aabb0', 'left', 850, 'Inter, sans-serif');
    }
    drawTransition(instance, c);
  };

  const screenMethods = {
    drawMenu: 'menu', drawIntro: 'intro', drawDifficulty: 'difficulty', drawBriefing: 'briefing',
    drawMissionSelect: 'missionSelect', drawHowTo: 'howTo', drawArmory: 'armory', drawVictory: 'victory',
    drawCampaignVictory: 'campaignVictory', drawCredits: 'credits', drawDefeat: 'defeat', drawPause: 'paused',
    drawPaused: 'paused',
  };
  for (const [methodName, kind] of Object.entries(screenMethods)) {
    const original = Game.prototype[methodName];
    if (typeof original !== 'function') continue;
    Game.prototype[methodName] = function(c, ...args) {
      const result = original.call(this, c, ...args);
      drawFramePolish(this, c, kind);
      return result;
    };
  }

  const originalHud = Game.prototype.drawHUD;
  if (typeof originalHud === 'function') {
    Game.prototype.drawHUD = function(c, ...args) {
      const result = originalHud.call(this, c, ...args);
      const player = this.player;
      const maxHp = Math.max(1, Number(player?.maxHp || 100));
      const healthRatio = Math.max(0, Math.min(1, Number(player?.hp || 0) / maxHp));
      const hurt = Math.max(0, Number(player?.hurtFlash || 0));
      const threat = Math.max(0, Math.min(1, Number(this.directorThreat ?? this.threat ?? 0)));

      if (healthRatio < .38 || hurt > 0) {
        const pulse = reducedMotion ? 1 : .72 + Math.sin(performance.now() / 115) * .18;
        const alpha = Math.max((.38 - healthRatio) * 1.45, Math.min(.28, hurt * .55)) * pulse;
        const damageGradient = c.createRadialGradient(W / 2, H / 2, H * .2, W / 2, H / 2, W * .68);
        damageGradient.addColorStop(0, 'rgba(120,0,0,0)');
        damageGradient.addColorStop(1, `rgba(160,12,12,${alpha})`);
        c.fillStyle = damageGradient; c.fillRect(0, 0, W, H);
      }

      if (threat > .72) {
        const pulse = reducedMotion ? .22 : .16 + Math.sin(performance.now() / 170) * .06;
        c.strokeStyle = `rgba(255,107,44,${pulse + (threat - .72) * .5})`;
        c.lineWidth = 4; c.strokeRect(6, 6, W - 12, H - 12);
      }

      const combo = Number(this.comboCount ?? this.combo ?? 0);
      if (combo >= 8) {
        const scale = reducedMotion ? 1 : 1 + Math.sin(performance.now() / 120) * .035;
        c.save(); c.translate(W / 2, 92); c.scale(scale, scale);
        c.fillStyle = 'rgba(3,9,14,.82)'; roundRect(c, -78, -18, 156, 36, 10); c.fill();
        c.strokeStyle = combo >= 20 ? '#ffd45a' : '#ff6b2c'; c.lineWidth = 2; c.stroke();
        text(c, `${Math.floor(combo)} HIT MOMENTUM`, 0, 1, 11, combo >= 20 ? '#ffd45a' : '#f8f2df', 'center', 900, 'Inter, sans-serif');
        c.restore();
      }
      drawTransition(this, c);
      return result;
    };
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) document.title = `Stand by — Black Horizon: Cinder Protocol`;
    else document.title = `${stateLabels[game?.state] || 'Black Horizon'} — Black Horizon: Cinder Protocol`;
  });

  window.__blackHorizonPolish = Object.freeze({
    version,
    reducedMotion,
    highContrast,
    fullscreen: toggleFullscreen,
    announce,
    diagnostics() {
      return {
        state: game?.state,
        vectorAssets: `${window.__blackHorizonAssets?.loaded || 0}/${window.__blackHorizonAssets?.total || 0}`,
        rasterAssets: `${window.__blackHorizonRaster?.loaded || 0}/${window.__blackHorizonRaster?.total || 0}`,
      };
    },
  });

  announce('Black Horizon: Cinder Protocol ready');
})();

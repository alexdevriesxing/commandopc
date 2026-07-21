// BLACK HORIZON browser-shell, PWA, mobile and persistent preference polish.
(() => {
  'use strict';

  const version = '1.0.0';
  const root = document.documentElement;
  const canvas = document.querySelector('#game');
  const shell = document.querySelector('#shell');
  const frame = document.querySelector('#gameFrame');
  const topbar = document.querySelector('.topbar');
  const footer = document.querySelector('.footerbar');
  const cluster = document.querySelector('.status-cluster');
  const toast = document.querySelector('#toast');
  const touch = document.querySelector('#touchControls');
  const key = 'blackHorizon.shell.v1';
  const systemReduced = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const systemContrast = Boolean(window.matchMedia?.('(prefers-contrast: more)').matches);
  const stored = (() => { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } })();
  const prefs = {
    reducedMotion: stored.reducedMotion ?? systemReduced,
    highContrast: stored.highContrast ?? systemContrast,
    scanlines: stored.scanlines ?? true,
    haptics: stored.haptics ?? true,
    autoPause: stored.autoPause ?? true,
    adaptiveEffects: stored.adaptiveEffects ?? true,
  };
  let performanceMode = false;
  let frameAverage = 16.7;
  let slowFrames = 0;
  let fastFrames = 0;
  let lastFrame = performance.now();
  let deferredInstall = null;
  let waitingWorker = null;
  let changedController = false;
  let autoPaused = false;
  let toastTimer = 0;

  const save = () => { try { localStorage.setItem(key, JSON.stringify(prefs)); } catch { /* optional */ } };
  const apply = () => {
    root.classList.toggle('bh-reduced-motion', prefs.reducedMotion);
    root.classList.toggle('bh-high-contrast', prefs.highContrast);
    root.classList.toggle('bh-no-scanlines', !prefs.scanlines);
    root.classList.toggle('bh-performance-mode', performanceMode);
  };
  apply();

  const announce = (message) => window.__blackHorizonPolish?.announce?.(message);
  const showToast = (message, duration = 2600, action) => {
    if (!toast || !message) return;
    clearTimeout(toastTimer);
    toast.replaceChildren();
    const copy = document.createElement('span'); copy.textContent = message; toast.append(copy);
    if (action) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'toast-action'; button.textContent = action.label;
      button.addEventListener('click', () => { action.run(); toast.classList.remove('is-visible'); }, { once: true });
      toast.append(button);
    }
    toast.classList.add('is-visible'); announce(message);
    if (duration > 0) toastTimer = setTimeout(() => toast.classList.remove('is-visible'), duration);
  };

  const makeButton = (label, title, extra = '') => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = `utility-button ${extra}`.trim();
    button.textContent = label; button.title = title; button.setAttribute('aria-label', title);
    return button;
  };
  const deck = document.createElement('div');
  deck.className = 'utility-deck'; deck.setAttribute('aria-label', 'Game utilities');
  const installButton = makeButton('INSTALL', 'Install Black Horizon', 'install-button'); installButton.hidden = true;
  const fullscreenButton = makeButton('FULLSCREEN', 'Toggle fullscreen');
  const settingsButton = makeButton('DISPLAY', 'Open display and accessibility settings');
  deck.append(installButton, fullscreenButton, settingsButton); topbar?.append(deck);

  const dialog = document.createElement('dialog');
  dialog.id = 'black-horizon-settings'; dialog.className = 'settings-dialog';
  dialog.setAttribute('aria-labelledby', 'black-horizon-settings-title');
  dialog.innerHTML = `<form method="dialog" class="settings-panel">
    <div class="settings-heading"><div><p class="eyebrow">FIELD DISPLAY SYSTEMS</p><h2 id="black-horizon-settings-title">Presentation settings</h2></div><button class="icon-button" value="cancel" aria-label="Close settings">×</button></div>
    <div class="settings-grid">
      <label class="setting-row"><span><strong>Reduced interface motion</strong><small>Removes shell transitions and animated controls.</small></span><input name="reducedMotion" type="checkbox"></label>
      <label class="setting-row"><span><strong>High contrast</strong><small>Strengthens borders, text and focus indicators.</small></span><input name="highContrast" type="checkbox"></label>
      <label class="setting-row"><span><strong>CRT scanlines</strong><small>Controls the subtle display texture over gameplay.</small></span><input name="scanlines" type="checkbox"></label>
      <label class="setting-row"><span><strong>Touch haptics</strong><small>Uses supported vibration for action controls.</small></span><input name="haptics" type="checkbox"></label>
      <label class="setting-row"><span><strong>Auto-pause</strong><small>Pauses combat when the tab is hidden.</small></span><input name="autoPause" type="checkbox"></label>
      <label class="setting-row"><span><strong>Adaptive effects</strong><small>Reduces shell effects when frame pacing drops.</small></span><input name="adaptiveEffects" type="checkbox"></label>
    </div>
    <div class="settings-footer"><button type="button" class="secondary-button" data-reset>RESET</button><button value="save" class="primary-button">APPLY SETTINGS</button></div>
    <p class="settings-shortcut">F2 opens this panel · Alt+Enter toggles fullscreen</p>
  </form>`;
  document.body.append(dialog);
  const form = dialog.querySelector('form');
  const sync = () => Object.entries(prefs).forEach(([name, value]) => { const input = form.elements.namedItem(name); if (input instanceof HTMLInputElement) input.checked = value; });
  const openSettings = () => { sync(); dialog.showModal?.(); if (!dialog.open) dialog.setAttribute('open', ''); announce('Presentation settings opened'); };
  const closeSettings = () => { dialog.close?.(); if (dialog.open) dialog.removeAttribute('open'); canvas?.focus({ preventScroll: true }); };
  settingsButton.addEventListener('click', openSettings);
  dialog.addEventListener('click', (event) => { if (event.target === dialog) closeSettings(); });
  dialog.addEventListener('close', () => canvas?.focus({ preventScroll: true }));
  dialog.addEventListener('submit', (event) => {
    if (event.submitter?.value !== 'save') return;
    event.preventDefault();
    Object.keys(prefs).forEach((name) => { const input = form.elements.namedItem(name); if (input instanceof HTMLInputElement) prefs[name] = input.checked; });
    save(); apply(); closeSettings(); showToast('Display settings applied');
  });
  dialog.querySelector('[data-reset]')?.addEventListener('click', () => {
    Object.assign(prefs, { reducedMotion: systemReduced, highContrast: systemContrast, scanlines: true, haptics: true, autoPause: true, adaptiveEffects: true });
    performanceMode = false; save(); apply(); sync(); showToast('Display settings reset');
  });

  const toggleFullscreen = () => window.__blackHorizonPolish?.fullscreen?.();
  fullscreenButton.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', () => {
    const active = Boolean(document.fullscreenElement);
    fullscreenButton.textContent = active ? 'EXIT FULLSCREEN' : 'FULLSCREEN';
    root.classList.toggle('bh-fullscreen', active);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'F2') { event.preventDefault(); if (dialog.open) closeSettings(); else openSettings(); }
  });

  const network = document.createElement('span');
  network.className = 'status-chip'; network.setAttribute('aria-label', 'Network status'); cluster?.append(network);
  const updateNetwork = () => {
    network.textContent = navigator.onLine ? 'ONLINE' : 'OFFLINE READY';
    network.classList.toggle('status-chip--warning', !navigator.onLine);
    root.classList.toggle('bh-offline', !navigator.onLine);
  };
  addEventListener('online', () => { updateNetwork(); showToast('Connection restored'); });
  addEventListener('offline', () => { updateNetwork(); showToast('Offline mode active'); });
  updateNetwork();

  addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); deferredInstall = event; installButton.hidden = false;
    showToast('Black Horizon is ready to install', 4200, { label: 'INSTALL', run: () => installButton.click() });
  });
  installButton.addEventListener('click', async () => {
    if (waitingWorker) { waitingWorker.postMessage({ type: 'SKIP_WAITING' }); return; }
    if (!deferredInstall) return;
    deferredInstall.prompt(); const choice = await deferredInstall.userChoice; deferredInstall = null; installButton.hidden = true;
    showToast(choice.outcome === 'accepted' ? 'Installation started' : 'Installation dismissed');
  });
  addEventListener('appinstalled', () => { deferredInstall = null; installButton.hidden = true; showToast('Black Horizon installed'); });

  const exposeUpdate = (registration) => {
    waitingWorker = registration.waiting; if (!waitingWorker) return;
    installButton.hidden = false; installButton.textContent = 'UPDATE'; installButton.setAttribute('aria-label', 'Apply game update');
    showToast('A new field build is ready', 0, { label: 'UPDATE', run: () => waitingWorker?.postMessage({ type: 'SKIP_WAITING' }) });
  };
  const hadController = Boolean(navigator.serviceWorker?.controller);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      exposeUpdate(registration);
      registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', () => {
        if (registration.installing?.state === 'installed' && navigator.serviceWorker.controller) exposeUpdate(registration);
      }));
    }).catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (changedController || !hadController) return; changedController = true;
      showToast('Update applied. Reload to enter the new build.', 0, { label: 'RELOAD', run: () => location.reload() });
    });
  }

  const hints = {
    menu: [['NAVIGATE','ARROWS / WASD'],['SELECT','ENTER'],['DISPLAY','F2'],['FULLSCREEN','ALT+ENTER']],
    playing: [['MOVE','WASD / ARROWS'],['AIM + FIRE','MOUSE / J'],['RELOAD','R'],['GRENADE','SPACE'],['DASH','SHIFT'],['PAUSE','P / ESC']],
    paused: [['RESUME','P / ESC'],['DISPLAY','F2'],['FULLSCREEN','ALT+ENTER']],
    briefing: [['DEPLOY','ENTER / CLICK'],['BACK','ESC'],['DISPLAY','F2']],
    armory: [['CHOOSE','ARROWS / WASD'],['CONFIRM','ENTER'],['DISPLAY','F2']],
    difficulty: [['CHOOSE','ARROWS / WASD'],['CONFIRM','ENTER'],['BACK','ESC']],
    default: [['SELECT','ENTER / CLICK'],['BACK','ESC'],['DISPLAY','F2'],['FULLSCREEN','ALT+ENTER']],
  };
  const updateFooter = (state) => {
    if (!footer) return; const list = hints[state] || hints.default;
    footer.replaceChildren(...list.map(([label, input]) => {
      const item = document.createElement('div'); item.className = 'control-hint';
      const strong = document.createElement('strong'); strong.textContent = label; item.append(strong, document.createTextNode(` ${input}`)); return item;
    }));
  };
  const previousSetState = Game.prototype.setState;
  Game.prototype.setState = function(nextState, ...args) {
    const result = previousSetState.call(this, nextState, ...args); updateFooter(nextState); canvas?.focus({ preventScroll: true }); return result;
  };
  updateFooter(game?.state || 'menu');

  const pauseWithKey = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', code: 'KeyP', bubbles: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && prefs.autoPause && game?.state === 'playing') { autoPaused = true; pauseWithKey(); announce('Operation auto-paused'); }
    else if (!document.hidden && autoPaused) { autoPaused = false; showToast('Operation paused. Press P or Escape when ready.'); }
  });

  const coarse = window.matchMedia?.('(hover: none) and (pointer: coarse)');
  const syncTouch = () => touch?.setAttribute('aria-hidden', coarse?.matches ? 'false' : 'true'); coarse?.addEventListener?.('change', syncTouch); syncTouch();
  touch?.querySelectorAll('[data-touch]').forEach((button) => {
    button.addEventListener('pointerdown', () => { button.classList.add('is-pressed'); if (prefs.haptics && navigator.vibrate) navigator.vibrate(button.dataset.touch === 'fire' ? 8 : 14); });
    ['pointerup','pointercancel','pointerleave'].forEach((name) => button.addEventListener(name, () => button.classList.remove('is-pressed')));
  });

  let pointerTimer = 0;
  const revealPointer = () => { root.classList.remove('bh-pointer-idle'); clearTimeout(pointerTimer); if (game?.state === 'playing') pointerTimer = setTimeout(() => root.classList.add('bh-pointer-idle'), 1800); };
  frame?.addEventListener('pointermove', revealPointer, { passive: true }); frame?.addEventListener('pointerdown', revealPointer, { passive: true });

  const monitor = () => {
    const now = performance.now(); const delta = Math.min(100, Math.max(1, now - lastFrame)); lastFrame = now; frameAverage += (delta - frameAverage) * .035;
    if (frameAverage > 28) { slowFrames++; fastFrames = 0; } else if (frameAverage < 20) { fastFrames++; slowFrames = Math.max(0, slowFrames - 2); }
    if (prefs.adaptiveEffects && !performanceMode && slowFrames > 180) { performanceMode = true; apply(); showToast('Adaptive performance mode enabled'); }
    if (performanceMode && fastFrames > 540) { performanceMode = false; slowFrames = 0; apply(); showToast('Full presentation effects restored'); }
    requestAnimationFrame(monitor);
  };
  requestAnimationFrame(monitor);

  window.__blackHorizonShip = Object.freeze({
    version, preferences: prefs, settings: openSettings,
    diagnostics: () => ({ online: navigator.onLine, installed: matchMedia?.('(display-mode: standalone)').matches || false, fps: Math.round(1000 / Math.max(1, frameAverage)), performanceMode, waitingUpdate: Boolean(waitingWorker) }),
  });
})();

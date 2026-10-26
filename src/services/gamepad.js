// Standard browser mapping: Xbox-style indices, independent of printed labels.
export const GAMEPAD_EVENT = 'riftmon:gamepad';
export const GAMEPAD_STATUS_EVENT = 'riftmon:gamepad-status';
export const PREFERENCES_EVENT = 'riftmon:preferences';
const DEAD_ZONE = 0.35;
const RELEASE_ZONE = 0.23;

export function readGamepad(pad, layout = 'standard', previousDirection = null) {
  const down = i => !!pad?.buttons?.[i]?.pressed || Number(pad?.buttons?.[i]?.value) > 0.5;
  let x = Number(pad?.axes?.[0]) || 0, y = Number(pad?.axes?.[1]) || 0;
  if (!Number.isFinite(x)) x = 0;
  if (!Number.isFinite(y)) y = 0;
  const threshold = previousDirection ? RELEASE_ZONE : DEAD_ZONE;
  let direction = null;
  if (Math.max(Math.abs(x), Math.abs(y)) >= threshold) {
    direction = Math.abs(x) > Math.abs(y) ? (x < 0 ? 'left' : 'right') : (y < 0 ? 'up' : 'down');
  }
  // D-pad wins over a drifting stick. Opposite directions cancel out.
  if ([12, 13, 14, 15].some(down)) {
    direction = down(12) !== down(13) ? (down(12) ? 'up' : 'down')
      : down(14) !== down(15) ? (down(14) ? 'left' : 'right') : null;
  }
  const nintendo = layout === 'nintendo';
  return { direction, confirm: down(nintendo ? 1 : 0), back: down(nintendo ? 0 : 1),
    team: down(nintendo ? 3 : 2), bag: down(nintendo ? 2 : 3), menu: down(9),
    previous: down(4), next: down(5) };
}

// No browser globals at import time: this state machine is also tested in Node.
export class GamepadReader {
  constructor(emit) { this.emit = emit; this.reset(); }
  reset() {
    if (this.direction) this.emit({ action: 'direction', direction: null });
    this.direction = null; this.buttons = {}; this.armed = false; this.nextRepeat = 0;
  }
  update(pad, time, layout) {
    const state = readGamepad(pad, layout, this.direction);
    if (!this.armed) {
      // Releasing controls after blur, reconnect or a route change prevents an
      // old held A from accepting a new battle/menu or moving on return.
      this.armed = !state.direction && !Object.keys(state).some(k => k !== 'direction' && state[k]);
      return;
    }
    if (state.direction !== this.direction) {
      this.direction = state.direction; this.nextRepeat = time + 320;
      this.emit({ action: 'direction', direction: this.direction, repeat: false });
    } else if (this.direction && time >= this.nextRepeat) {
      this.nextRepeat = time + 110;
      this.emit({ action: 'direction', direction: this.direction, repeat: true });
    }
    for (const action of ['confirm', 'back', 'team', 'bag', 'menu', 'previous', 'next']) {
      if (state[action] && !this.buttons[action]) this.emit({ action });
    }
    this.buttons = state;
  }
}

const CONTROL_SELECTOR = 'button, a[href], input:not([type="hidden"]), select, textarea, summary, [role="button"][tabindex], [role="tab"][tabindex]';
const SCOPE_SELECTOR = '[role="dialog"], [role="alertdialog"], [data-gamepad-scope], .battle-action-shell, .battle-grid, .menu-dropdown, .team-panel, .appearance-panel, .interaction-card, .chat-popup';
export function gamepadVisible(element) {
  if (!element || element.closest('[inert], [aria-hidden="true"], [hidden]') || element.matches(':disabled, [aria-disabled="true"]')) return false;
  const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
}
export function gamepadScope(root) {
  let best = root, score = -1;
  for (const node of root.querySelectorAll(SCOPE_SELECTOR)) {
    if (!gamepadVisible(node)) continue;
    let z = 0, depth = 0;
    for (let p = node; p && p !== root; p = p.parentElement) {
      z = Math.max(z, Number.parseInt(getComputedStyle(p).zIndex, 10) || 0); depth++;
    }
    const rank = z * 1000 + depth;
    if (rank >= score) { best = node; score = rank; }
  }
  return best;
}
const isBackControl = node => node.matches('.close-button, .panel-close, .team-close, [data-gamepad-back], button[aria-label="Fermer"], button[aria-label="Close"]');
export function gamepadControls(scope) {
  const nodes = [...scope.querySelectorAll(CONTROL_SELECTOR)].filter(n => gamepadVisible(n) && !n.matches('.battle-sound-toggle'));
  // Start on an action, not an icon to close the panel or mute the battle.
  return nodes.filter(n => !isBackControl(n)).concat(nodes.filter(isBackControl));
}
function focusControl(node, root) {
  root.querySelectorAll('.gamepad-focus').forEach(n => n.classList.remove('gamepad-focus'));
  if (!node) return;
  node.classList.add('gamepad-focus'); node.focus({ preventScroll: true });
  node.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
}
export function moveGamepadFocus(root, direction) {
  const scope = gamepadScope(root), nodes = gamepadControls(scope), active = document.activeElement;
  if (!nodes.includes(active)) { focusControl(nodes[0], root); return; }
  // Native selects/sliders remain usable without opening a platform popup.
  const delta = ['left', 'up'].includes(direction) ? -1 : 1;
  if (active.matches('select') && ['left', 'right'].includes(direction)) {
    const options = [...active.options].filter(o => !o.disabled && !o.hidden);
    const i = options.indexOf(active.selectedOptions[0]), option = options[i + delta];
    if (option) { active.value = option.value; active.dispatchEvent(new Event('change', { bubbles: true })); }
    return;
  }
  if (active.matches('input[type="range"]') && ['left', 'right'].includes(direction)) {
    const min = Number(active.min) || 0, max = Number(active.max) || 100, step = Number(active.step) || 1;
    active.value = Math.max(min, Math.min(max, Number(active.value) + delta * step));
    active.dispatchEvent(new Event('input', { bubbles: true })); return;
  }
  const r = active.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
  let next, best = Infinity;
  for (const n of nodes) {
    if (n === active) continue;
    const b = n.getBoundingClientRect(), dx = b.x + b.width / 2 - x, dy = b.y + b.height / 2 - y;
    const along = direction === 'left' ? -dx : direction === 'right' ? dx : direction === 'up' ? -dy : dy;
    const across = ['left', 'right'].includes(direction) ? Math.abs(dy) : Math.abs(dx);
    if (along <= 2) continue;
    const cost = along + across * 3;
    if (cost < best) { best = cost; next = n; }
  }
  if (next) focusControl(next, root);
}
export function navigateGamepad(root, detail) {
  if (!root?.isConnected) return;
  if (detail.action === 'direction') { if (detail.direction) moveGamepadFocus(root, detail.direction); return; }
  const scope = gamepadScope(root), nodes = gamepadControls(scope);
  if (detail.action === 'confirm') {
    let active = document.activeElement;
    if (!nodes.includes(active) || (isBackControl(active) && !active.classList.contains('gamepad-focus'))) { active = nodes[0]; focusControl(active, root); }
    if (active && !active.matches('input:not([type="checkbox"]):not([type="radio"]), textarea, select')) {
      if (typeof active.click === 'function') active.click();
      else active.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  } else if (detail.action === 'back' || detail.action === 'menu') {
    const target = scope.contains(document.activeElement) ? document.activeElement : scope;
    const event = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    if (!event.defaultPrevented) {
      const close = scope.querySelector('[data-gamepad-back], .close-button, .panel-close, button[aria-label="Fermer"], button[aria-label="Close"]');
      if (gamepadVisible(close)) close.click();
    }
  } else if (['previous', 'next'].includes(detail.action)) {
    const tabs = [...scope.querySelectorAll('[role="tab"]')].filter(gamepadVisible);
    if (!tabs.length) return;
    const index = Math.max(0, tabs.findIndex(n => n.getAttribute('aria-selected') === 'true'));
    const next = tabs[(index + (detail.action === 'next' ? 1 : tabs.length - 1)) % tabs.length];
    focusControl(next, root); next.click();
  }
}

export function startGamepadControls(root, preferences) {
  let config = preferences, frame = null, timer = null, stopped = false, index = null, statusKey = '';
  let focused = document.hasFocus();
  const reader = new GamepadReader(detail => {
    const event = new CustomEvent(GAMEPAD_EVENT, { detail, cancelable: true });
    if (window.dispatchEvent(event)) navigateGamepad(root, detail);
  });
  const status = pad => {
    const value = { supported: typeof navigator.getGamepads === 'function', connected: !!pad,
      enabled: config.controllerEnabled !== false, id: pad?.id || '', mapping: pad?.mapping || '' };
    const key = JSON.stringify(value);
    if (key !== statusKey) { statusKey = key; window.dispatchEvent(new CustomEvent(GAMEPAD_STATUS_EVENT, { detail: value })); }
  };
  const cancel = () => { cancelAnimationFrame(frame); clearTimeout(timer); frame = timer = null; };
  const poll = time => {
    frame = timer = null;
    if (stopped || document.hidden || !focused) return;
    let pads;
    try { pads = navigator.getGamepads?.() || []; } catch (_) { status(null); return; }
    const pad = [...pads].find(p => p?.connected && p.index === index) || [...pads].find(p => p?.connected);
    if ((pad?.index ?? null) !== index) { reader.reset(); index = pad?.index ?? null; }
    status(pad);
    if (pad && config.controllerEnabled !== false) reader.update(pad, time || performance.now(), config.controllerLayout);
    else reader.reset();
    if (pad && config.controllerEnabled !== false) frame = requestAnimationFrame(poll);
    else if (typeof navigator.getGamepads === 'function') timer = setTimeout(poll, 1000);
  };
  const wake = () => { cancel(); if (!stopped && !document.hidden && focused) poll(performance.now()); };
  const suspend = () => { focused = false; cancel(); reader.reset(); };
  const focus = () => { focused = true; reader.reset(); wake(); };
  const visibility = () => { if (document.hidden) { cancel(); reader.reset(); } else { focused = document.hasFocus(); wake(); } };
  const update = event => { config = event.detail || config; reader.reset(); wake(); };
  const pointer = () => root.querySelectorAll('.gamepad-focus').forEach(n => n.classList.remove('gamepad-focus'));
  window.addEventListener('gamepadconnected', wake); window.addEventListener('gamepaddisconnected', wake);
  window.addEventListener('blur', suspend); window.addEventListener('focus', focus);
  window.addEventListener(PREFERENCES_EVENT, update); window.addEventListener('pointerdown', pointer);
  document.addEventListener('visibilitychange', visibility); wake();
  return { reset: () => reader.reset(), refresh: () => { statusKey = ''; wake(); }, destroy() {
    stopped = true; cancel(); reader.reset(); pointer();
    window.removeEventListener('gamepadconnected', wake); window.removeEventListener('gamepaddisconnected', wake);
    window.removeEventListener('blur', suspend); window.removeEventListener('focus', focus);
    window.removeEventListener(PREFERENCES_EVENT, update); window.removeEventListener('pointerdown', pointer);
    document.removeEventListener('visibilitychange', visibility);
  } };
}

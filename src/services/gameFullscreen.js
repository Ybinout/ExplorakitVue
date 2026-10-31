import { WORLD_WIDTH, WORLD_HEIGHT } from './worldCamera.js';

export function fittedGameWidth(width, height, toolbarHeight, fullscreen = false) {
  return Math.max(1, Math.floor(Math.min(fullscreen ? Infinity : WORLD_WIDTH,
    Math.max(1, width), Math.max(1, height - toolbarHeight) * WORLD_WIDTH / WORLD_HEIGHT)));
}

// Request the whole game root so fixed menus, dialogues and battles stay in
// the browser's fullscreen layer. Never request automatically on page load.
export function attachGameFullscreen(root, toolbar, onChange) {
  const doc = root.ownerDocument;
  const current = () => doc.fullscreenElement || doc.webkitFullscreenElement;
  const request = root.requestFullscreen || root.webkitRequestFullscreen;
  const exit = doc.exitFullscreen || doc.webkitExitFullscreen;
  const supported = Boolean(request && exit &&
    (root.requestFullscreen ? doc.fullscreenEnabled !== false : doc.webkitFullscreenEnabled !== false));
  const nav = doc.defaultView.navigator;
  const desktop = !(/Android|iPad|iPhone|iPod/i.test(nav.userAgent) ||
    (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1) || nav.userAgentData?.mobile === true);
  let destroyed = false;
  let resizeFrame = 0;
  const setSize = (key, value) => {
    if (root.style.getPropertyValue(key) !== value) root.style.setProperty(key, value);
  };
  const resize = () => {
    if (destroyed || root.classList.contains('is-mobile')) return;
    // Windowed laptops need the same fit as fullscreen. Measure the actual
    // content box/header, including browser zoom and wrapped toolbar content.
    const fullscreen = current() === root;
    const style = getComputedStyle(root);
    const availableWidth = root.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
    const availableHeight = root.clientHeight - (parseFloat(style.paddingTop) || 0) - (parseFloat(style.paddingBottom) || 0);
    const toolbarHeight = toolbar.getBoundingClientRect().height;
    const width = fittedGameWidth(availableWidth, availableHeight, toolbarHeight, fullscreen);
    setSize(fullscreen ? '--game-fullscreen-width' : '--game-window-width', `${width}px`);
    setSize('--game-toolbar-height', `${toolbarHeight}px`);
    setSize('--game-fullscreen-toolbar-height', `${toolbarHeight}px`);
  };
  // Defer geometry writes out of ResizeObserver delivery (notably WebKit).
  // Only actual notifications queue a frame; this is not an animation loop.
  const scheduleResize = () => {
    if (destroyed || resizeFrame) return;
    resizeFrame = doc.defaultView.requestAnimationFrame(() => {
      resizeFrame = 0;
      resize();
    });
  };
  const sync = () => {
    if (destroyed) return;
    onChange({ active: current() === root, supported, desktop });
    scheduleResize();
  };
  doc.addEventListener('fullscreenchange', sync);
  doc.addEventListener('webkitfullscreenchange', sync);
  window.addEventListener('resize', scheduleResize, { passive: true });
  const observer = new ResizeObserver(scheduleResize);
  observer.observe(root);
  observer.observe(toolbar);
  sync();
  return {
    // The request is called synchronously from the Options click, preserving
    // the browser's transient user activation.
    toggle() {
      if (destroyed || !supported) return Promise.reject(new Error('Fullscreen unavailable'));
      try {
        return Promise.resolve(current() === root ? exit.call(doc) : request.call(root)).finally(sync);
      } catch (error) { sync(); return Promise.reject(error); }
    },
    destroy() {
      destroyed = true;
      if (resizeFrame) doc.defaultView.cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      doc.removeEventListener('fullscreenchange', sync);
      doc.removeEventListener('webkitfullscreenchange', sync);
      window.removeEventListener('resize', scheduleResize);
      root.style.removeProperty('--game-fullscreen-width');
      root.style.removeProperty('--game-fullscreen-toolbar-height');
      root.style.removeProperty('--game-window-width');
      root.style.removeProperty('--game-toolbar-height');
      if (current() === root && exit) {
        try { Promise.resolve(exit.call(doc)).catch(() => {}); } catch (_) { /* Browser exits when the root is removed. */ }
      }
    }
  };
}

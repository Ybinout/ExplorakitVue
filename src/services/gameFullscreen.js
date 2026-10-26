import { WORLD_WIDTH, WORLD_HEIGHT } from './worldCamera';

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
  const resize = () => {
    if (destroyed || current() !== root) return;
    // Fit the unchanged 7:5 world below the actual toolbar, including the
    // taller Rift header. No stretching, cropping or CSS scale transforms.
    const toolbarHeight = toolbar.getBoundingClientRect().height;
    const height = Math.max(1, root.clientHeight - toolbarHeight);
    const width = Math.floor(Math.min(root.clientWidth, height * WORLD_WIDTH / WORLD_HEIGHT));
    root.style.setProperty('--game-fullscreen-width', `${width}px`);
    root.style.setProperty('--game-fullscreen-toolbar-height', `${toolbarHeight}px`);
  };
  const sync = () => {
    if (destroyed) return;
    onChange({ active: current() === root, supported, desktop });
    resize();
  };
  doc.addEventListener('fullscreenchange', sync);
  doc.addEventListener('webkitfullscreenchange', sync);
  window.addEventListener('resize', resize, { passive: true });
  const observer = new ResizeObserver(resize);
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
      observer.disconnect();
      doc.removeEventListener('fullscreenchange', sync);
      doc.removeEventListener('webkitfullscreenchange', sync);
      window.removeEventListener('resize', resize);
      root.style.removeProperty('--game-fullscreen-width');
      root.style.removeProperty('--game-fullscreen-toolbar-height');
      if (current() === root && exit) {
        try { Promise.resolve(exit.call(doc)).catch(() => {}); } catch (_) { /* Browser exits when the root is removed. */ }
      }
    }
  };
}

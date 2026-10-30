// Keep viewport-based overlays aligned without creating a containing block for
// their fixed descendants (notably the PC drag preview and battle overlays).
export function attachGamePopupLayout(root, stage) {
  let frame = 0;
  const header = root.querySelector('.game-header');
  const measure = () => {
    frame = 0;
    const rect = stage.getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    const height = window.innerHeight;
    let left = Math.max(0, rect.left);
    let right = Math.min(width, rect.right);
    let top = Math.max(0, rect.top);
    let bottom = Math.min(height, rect.bottom);
    // A scrolled-away game must not leave a dialog off-screen or collapsed.
    if (right - left < 240 || bottom - top < 240) {
      left = 0; right = width; top = 0; bottom = height;
    }
    const values = {
      top: top + 12, right: width - right + 12,
      bottom: height - bottom + 12, left: left + 12,
      width: Math.max(0, right - left - 24),
      height: Math.max(0, bottom - top - 24),
      'center-x': (left + right) / 2, 'center-y': (top + bottom) / 2,
    };
    for (const [name, value] of Object.entries(values)) {
      root.style.setProperty(`--game-popup-${name}`, `${value}px`);
    }
    if (header) {
      const viewportBottom = window.visualViewport ? window.visualViewport.offsetTop + window.visualViewport.height : height;
      root.style.setProperty('--game-menu-max-height', `${Math.max(44, viewportBottom - header.getBoundingClientRect().bottom - 28)}px`);
    }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
  const observer = new ResizeObserver(schedule);
  observer.observe(stage);
  if (header) observer.observe(header);
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true });
  window.visualViewport?.addEventListener('resize', schedule, { passive: true });
  window.visualViewport?.addEventListener('scroll', schedule, { passive: true });
  measure();
  return () => {
    observer.disconnect();
    window.removeEventListener('resize', schedule);
    window.removeEventListener('scroll', schedule);
    window.visualViewport?.removeEventListener('resize', schedule);
    window.visualViewport?.removeEventListener('scroll', schedule);
    if (frame) cancelAnimationFrame(frame);
  };
}

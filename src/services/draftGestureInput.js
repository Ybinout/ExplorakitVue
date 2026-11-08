// Shared input plumbing only: Draft swipe and preparation drag have independent
// intent, thresholds and release rules. Native scrolling wins before intent.
export function pointer(event) {
  const p = event.touches?.[0] || event.changedTouches?.[0] || event;
  return { x: p.clientX, y: p.clientY };
}
export function canStart(event) {
  return (
    event.isPrimary !== false &&
    event.pointerType !== 'touch' &&
    (event.button === undefined || event.button === 0) &&
    (!event.touches || event.touches.length === 1) &&
    !event.target.closest(
      'button,select,input,a,summary,[data-draft-no-gesture]'
    )
  );
}
export function track(event, { move, end, cancel }) {
  const touch = !!event.touches,
    id = event.pointerId,
    touchId = event.touches?.[0]?.identifier;
  const same = (e) =>
    touch
      ? [...(e.changedTouches || e.touches || [])].some(
          (t) => t.identifier === touchId
        )
      : e.pointerId === id;
  const onMove = (e) => {
    if (touch && e.touches.length !== 1) cancel();
    else if (same(e)) move(e, pointer(e));
  };
  const onEnd = (e) => {
    if (same(e)) end(e, pointer(e));
  };
  const onKey = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      cancel();
    }
  };
  const names = touch
    ? ['touchmove', 'touchend', 'touchcancel']
    : ['pointermove', 'pointerup', 'pointercancel'];
  window.addEventListener(names[0], onMove, { capture: true, passive: false });
  window.addEventListener(names[1], onEnd, true);
  window.addEventListener(names[2], cancel, true);
  window.addEventListener('blur', cancel);
  window.addEventListener('keydown', onKey, true);
  return () => {
    window.removeEventListener(names[0], onMove, true);
    window.removeEventListener(names[1], onEnd, true);
    window.removeEventListener(names[2], cancel, true);
    window.removeEventListener('blur', cancel);
    window.removeEventListener('keydown', onKey, true);
  };
}
export function suppressClick(root) {
  const block = (e) => {
    if (root.contains(e.target)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };
  document.addEventListener('click', block, true);
  setTimeout(() => document.removeEventListener('click', block, true), 650);
}
export function floatingCard(root, kind) {
  const rect = root.getBoundingClientRect(),
    ghost = root.cloneNode(true),
    computed = getComputedStyle(root);
  for (const name of computed)
    if (name.startsWith('--'))
      ghost.style.setProperty(name, computed.getPropertyValue(name));
  ghost.removeAttribute('data-draft-card');
  ghost.setAttribute('aria-hidden', 'true');
  ghost.inert = true;
  ghost.dataset.draftGesture = kind;
  ghost.style.cssText += `;position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;margin:0;z-index:8000;pointer-events:none;box-sizing:border-box;transform-origin:center;animation:none;will-change:transform;box-shadow:0 16px 35px #0005;overflow:hidden;`;
  ghost.style.fontFamily = computed.fontFamily;
  ghost.style.fontSize = computed.fontSize;
  root.classList.add('is-gesture-origin');
  document.body.append(ghost);
  let frame, timer;
  function clean() {
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    ghost.remove();
    root.classList.remove('is-gesture-origin');
  }
  function render(x, y, rotation = 0, scale = 1.025) {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      ghost.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rotation}deg) scale(${scale})`;
    });
  }
  function settle(x, y, scale, callback, exit = false) {
    cancelAnimationFrame(frame);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      clean();
      callback?.();
      return;
    }
    ghost.getBoundingClientRect();
    ghost.style.transition =
      'transform 240ms cubic-bezier(.2,.8,.2,1),opacity 220ms';
    ghost.style.transform = `translate3d(${x}px,${y}px,0) scale(${scale})`;
    if (exit) ghost.style.opacity = '0';
    timer = setTimeout(() => {
      clean();
      callback?.();
    }, 250);
  }
  return { ghost, rect, render, settle, clean };
}

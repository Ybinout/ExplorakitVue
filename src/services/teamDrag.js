// Sort UUIDs after a deliberate drop; keep the latest server-owned Pokémon.
export function createTeamDrag({ root, roster, allowed, changed, drop, ended }) {
  let gesture = null, frame = 0;
  const targetAt = (x, y) => {
    const node = document.elementFromPoint(x, y)?.closest('[data-team-uuid]');
    return node && root.contains(node) ? node.dataset.teamUuid : null;
  };
  function update() {
    frame = 0;
    if (!gesture?.active) return;
    if (!root.isConnected || !allowed()) { cancel(); return; }
    const list = root.querySelector('.team-list'), rect = list?.getBoundingClientRect();
    let scrolling = false;
    if (rect && gesture.x >= rect.left && gesture.x <= rect.right && gesture.y >= rect.top && gesture.y <= rect.bottom) {
      const delta = gesture.y < rect.top + 30 ? -8 : gesture.y > rect.bottom - 30 ? 8 : 0;
      const previous = list.scrollTop;
      if (delta) list.scrollTop += delta;
      scrolling = previous !== list.scrollTop;
    }
    gesture.to = targetAt(gesture.x, gesture.y);
    changed({ uuid: gesture.uuid, to: gesture.to, x: gesture.x, y: gesture.y });
    if (scrolling) frame = requestAnimationFrame(update);
  }
  function cancel() {
    const old = gesture; gesture = null;
    cancelAnimationFrame(frame); frame = 0;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', finish);
    window.removeEventListener('pointercancel', cancelled);
    window.removeEventListener('blur', cancel);
    window.removeEventListener('keydown', key);
    document.removeEventListener('visibilitychange', visibility);
    root.removeEventListener('lostpointercapture', cancelled);
    if (old?.active) {
      ended?.();
      try { root.releasePointerCapture(old.pointerId); } catch { /* Already released. */ }
    }
    changed(null);
  }
  function cancelled(event) { if (event.pointerId === gesture?.pointerId) cancel(); }
  function key(event) { if (event.key === 'Escape') cancel(); }
  function visibility() { if (document.hidden) cancel(); }
  function move(event) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    gesture.x = event.clientX; gesture.y = event.clientY;
    if (!gesture.active && Math.hypot(gesture.x - gesture.startX, gesture.y - gesture.startY) >= 8) {
      gesture.active = true;
      try { root.setPointerCapture(event.pointerId); } catch { /* Synthetic pointer. */ }
    }
    if (gesture.active) {
      event.preventDefault();
      if (!frame) frame = requestAnimationFrame(update);
    }
  }
  function finish(event) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    const current = gesture, target = current.active ? targetAt(event.clientX, event.clientY) : null;
    const valid = current.active && allowed() && root.isConnected && JSON.stringify(roster()) === current.roster;
    if (current.active) event.preventDefault();
    cancel();
    if (valid && target && target !== current.uuid) drop(current.uuid, target);
  }
  return {
    start(event, uuid) {
      if (gesture || !allowed() || event.isPrimary === false || event.button !== 0 || !roster().includes(uuid)) return;
      gesture = { pointerId: event.pointerId, uuid, roster: JSON.stringify(roster()), startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, active: false, to: null };
      window.addEventListener('pointermove', move, { passive: false });
      window.addEventListener('pointerup', finish);
      window.addEventListener('pointercancel', cancelled);
      window.addEventListener('blur', cancel);
      window.addEventListener('keydown', key);
      document.addEventListener('visibilitychange', visibility);
      root.addEventListener('lostpointercapture', cancelled);
    },
    cancel
  };
}

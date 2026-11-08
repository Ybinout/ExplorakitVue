// A dedicated grip leaves card scrolling native. Both touch and mouse use the
// same pointer path; movement updates the floating preview, never game state.
export function startDraftDrag(event, card, onDrop) {
  if (event.button !== undefined && event.button !== 0) return () => {};
  const handle = event.currentTarget,
    root = handle.closest('[data-draft-card]'),
    ghost = root.cloneNode(true);
  ghost.classList.add('draft-drag-ghost');
  ghost.style.cssText =
    'position:fixed;left:0;top:0;width:145px;z-index:8000;pointer-events:none;opacity:.88;transform:translate(-999px,-999px);box-shadow:0 10px 30px #0005';
  document.body.append(ghost);
  let target = null,
    point = event,
    frame = null;
  const scroll = handle.closest('.draft-body');
  const autoScroll = () => {
    if (scroll) {
      const b = scroll.getBoundingClientRect(),
        delta =
          point.clientY < b.top + 50
            ? -12
            : point.clientY > b.bottom - 50
            ? 12
            : 0;
      if (delta) scroll.scrollTop += delta;
    }
    frame = requestAnimationFrame(autoScroll);
  };
  frame = requestAnimationFrame(autoScroll);
  const move = (e) => {
    point = e;
    ghost.style.transform = `translate(${e.clientX - 65}px,${
      e.clientY - 30
    }px) rotate(-3deg)`;
    target =
      document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest('[data-draft-drop]') || null;
  };
  const clean = () => {
    cancelAnimationFrame(frame);
    ghost.remove();
    handle.removeEventListener('pointermove', move);
    handle.removeEventListener('pointerup', up);
    handle.removeEventListener('pointercancel', cancel);
    window.removeEventListener('blur', cancel);
    try {
      handle.releasePointerCapture(event.pointerId);
    } catch {
      /* Pointer may already have ended. */
    }
  };
  const up = (e) => {
      move(e);
      const where = target?.dataset.draftDrop;
      clean();
      if (where) onDrop(card, where);
    },
    cancel = () => clean();
  handle.setPointerCapture?.(event.pointerId);
  handle.addEventListener('pointermove', move);
  handle.addEventListener('pointerup', up);
  handle.addEventListener('pointercancel', cancel);
  window.addEventListener('blur', cancel);
  move(event);
  return clean;
}

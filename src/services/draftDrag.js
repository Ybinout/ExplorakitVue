import {
  canStart,
  pointer,
  track,
  floatingCard,
  suppressClick,
} from './draftGestureInput';
// Preparation only: hold a card, then move it freely onto a precise team slot.
export function startDraftDrag(
  event,
  card,
  { drop, ended, active, accepts = () => true }
) {
  if (!canStart(event)) return () => {};
  const root = event.currentTarget.closest(
      '[data-draft-card],[data-draft-slot]'
    ),
    panel = root.closest('[data-draft-panel]'),
    start = pointer(event),
    touch = !!event.touches;
  let p = start,
    visual,
    unbind = () => {},
    hold,
    frame,
    done = false,
    target = null;
  const clearTarget = () => {
    target?.classList.remove('draft-drop-target');
    target = null;
  };
  const updateTarget = () => {
    const el = document
      .elementFromPoint(p.x, p.y)
      ?.closest('[data-draft-drop]');
    if (el !== target) {
      clearTarget();
      if (el && panel.contains(el) && accepts(card, el.dataset.draftDrop)) {
        target = el;
        target.classList.add('draft-drop-target');
      }
    }
  };
  const loop = () => {
    if (!visual || done) return;
    const body = panel.querySelector('.draft-body'),
      r = body.getBoundingClientRect();
    if (p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom) {
      const delta = p.y < r.top + 38 ? -12 : p.y > r.bottom - 38 ? 12 : 0;
      if (delta) body.scrollTop += delta;
    }
    updateTarget();
    frame = requestAnimationFrame(loop);
  };
  const begin = () => {
    if (done || !root.isConnected) return;
    visual = floatingCard(root, 'drag');
    active?.();
    visual.render(p.x - start.x, p.y - start.y, -2);
    frame = requestAnimationFrame(loop);
  };
  const context = (e) => e.preventDefault();
  root.addEventListener('contextmenu', context);
  const finish = () => {
    if (done) return;
    done = true;
    unbind();
    clearTimeout(hold);
    cancelAnimationFrame(frame);
    clearTarget();
    visual?.clean();
    root.removeEventListener('contextmenu', context);
    ended?.();
  };
  unbind = track(event, {
    cancel: finish,
    move(e, point) {
      p = point;
      const distance = Math.hypot(p.x - start.x, p.y - start.y);
      if (!visual) {
        if (touch && distance > 10) {
          finish();
          return;
        }
        if (!touch && distance >= 7) begin();
      }
      if (visual) {
        if (e.cancelable) e.preventDefault();
        visual.render(p.x - start.x, p.y - start.y, -2);
        updateTarget();
      }
    },
    end(e, point) {
      p = point;
      clearTimeout(hold);
      unbind();
      cancelAnimationFrame(frame);
      if (!visual) {
        finish();
        return;
      }
      if (e.cancelable) e.preventDefault();
      suppressClick(root);
      updateTarget();
      const destination = target?.dataset.draftDrop,
        r = target?.getBoundingClientRect(),
        origin = root.getBoundingClientRect();
      const dx = r
        ? r.left + r.width / 2 - visual.rect.left - visual.rect.width / 2
        : origin.left - visual.rect.left;
      const dy = r
        ? r.top + r.height / 2 - visual.rect.top - visual.rect.height / 2
        : origin.top - visual.rect.top;
      const scale = r
        ? Math.min(
            1,
            r.width / visual.rect.width,
            r.height / visual.rect.height
          )
        : 1;
      visual.settle(dx, dy, scale, () => {
        finish();
        if (destination) drop(card, destination);
      });
    },
  });
  if (touch) hold = setTimeout(begin, 230);
  return finish;
}

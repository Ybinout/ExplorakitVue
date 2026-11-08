import {
  canStart,
  pointer,
  track,
  floatingCard,
  suppressClick,
} from './draftGestureInput';
// Booster only: down commits, short movement springs back, up/horizontal scrolls.
export function startDraftSwipe(event, card, { select, ended, active }) {
  if (!canStart(event)) return () => {};
  const root = event.currentTarget.closest('[data-draft-card]'),
    start = pointer(event);
  let visual,
    unbind = () => {},
    done = false,
    dx = 0,
    dy = 0;
  const finish = () => {
    if (!done) {
      done = true;
      unbind();
      visual?.clean();
      ended?.();
    }
  };
  const release = () => {
    unbind();
    if (!visual) {
      finish();
      return;
    }
    suppressClick(root);
    const commit = dy >= Math.min(120, Math.max(70, visual.rect.height * 0.16));
    visual.settle(
      commit ? dx * 0.45 : 0,
      commit ? innerHeight + visual.rect.height : 0,
      commit ? 0.96 : 1,
      () => {
        finish();
        if (commit) select(card);
      },
      commit
    );
  };
  unbind = track(event, {
    cancel: finish,
    end: release,
    move(e, p) {
      dx = p.x - start.x;
      dy = p.y - start.y;
      if (!visual) {
        if (dy < -8 || (Math.abs(dx) > 8 && Math.abs(dx) > dy * 1.15)) {
          finish();
          return;
        }
        if (dy < 8) return;
        visual = floatingCard(root, 'swipe');
        active?.();
        visual.ghost.classList.add('draft-swipe-ghost');
      }
      if (e.cancelable) e.preventDefault();
      visual.ghost.dataset.ready =
        dy >= Math.min(120, Math.max(70, visual.rect.height * 0.16))
          ? 'true'
          : 'false';
      visual.render(
        dx * 0.35,
        Math.max(-20, dy),
        Math.max(-4, Math.min(4, dx / 25))
      );
    },
  });
  return finish;
}

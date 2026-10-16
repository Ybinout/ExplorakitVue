// A battle's events keep their wire order. Cancelling resolves pending waits too.
export function createBattlePresentation({ changed = () => {} } = {}) {
  let generation = 0, pending = 0, tail = Promise.resolve(), release = null;
  const skipWait = () => { release?.(); };
  return {
    push(play, delay = 0) {
      const current = generation;
      pending++; changed(true);
      const task = tail.then(async () => {
        if (current !== generation) return;
        play();
        const ms = typeof delay === 'function' ? delay() : delay;
        if (ms > 0) await new Promise(resolve => {
          const finish = () => { clearTimeout(timer); release = null; resolve(); };
          const timer = setTimeout(finish, ms); release = finish;
        });
      });
      tail = task.catch(() => {}).finally(() => { if (current === generation && --pending === 0) changed(false); });
      return task;
    },
    drain() { return tail; },
    skipWait,
    cancel() { generation++; pending = 0; skipWait(); tail = Promise.resolve(); changed(false); }
  };
}

// Wait for the actual <picture> selection and visible fighters, not every asset in the game.
function imageReady(image, signal) {
  return new Promise(resolve => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      image.removeEventListener('load', loaded);
      image.removeEventListener('error', finish);
      signal.removeEventListener('abort', finish);
      resolve();
    };
    const loaded = () => {
      if (typeof image.decode !== 'function') return finish();
      // A failed/missing sprite must not hold the battle indefinitely.
      Promise.resolve().then(() => image.decode()).then(finish, finish);
    };
    image.addEventListener('load', loaded);
    image.addEventListener('error', finish);
    signal.addEventListener('abort', finish, { once: true });
    if (signal.aborted) finish();
    else if (image.complete) {
      if (image.naturalWidth > 0) loaded();
      else finish();
    }
  });
}

export async function waitForBattleAssets(images, { signal, timeoutMs = 2400 } = {}) {
  const pending = new AbortController();
  const cancel = () => pending.abort();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; cancel(); }, timeoutMs);
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) cancel();
  try {
    while (!pending.signal.aborted) {
      const current = images();
      const sources = current.map(image => image.currentSrc || image.src);
      await Promise.all(current.map(image => imageReady(image, pending.signal)));
      if (pending.signal.aborted) break;
      const next = images();
      // Rotation or a field update can select a different picture while decoding.
      if (next.length === current.length && next.every((image, i) => image === current[i] && image.complete && (image.currentSrc || image.src) === sources[i])) break;
    }
    return { timedOut, cancelled: Boolean(signal?.aborted) };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}

export function entranceDelay(ms, signal) {
  return new Promise(resolve => {
    const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', finish); resolve(); };
    const timer = setTimeout(finish, Math.max(0, ms));
    signal.addEventListener('abort', finish, { once: true });
    if (signal.aborted) finish();
  });
}

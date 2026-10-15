import { experienceProgress } from './pokemonProgress.js';

export function experienceFrames(payload) {
  const pokemon = payload?.pokemon;
  if (!pokemon || !(payload.xpGained > 0)) return [];
  const first = Math.max(1, Number(payload.previousLevel) || pokemon.level);
  const last = Math.max(first, Number(pokemon.level));
  const before = experienceProgress({ ...pokemon, level: first, experience: payload.previousExperience });
  const after = experienceProgress(pokemon);
  // Keep a large multi-level gain readable without delaying a timed expedition for minutes.
  const levels = Array.from({ length: Math.min(4, last - first) }, (_, i) => first + i);
  if (last - first > 4) levels.push(last - 1);
  return [...levels.map((level, i) => ({ level, from: i ? 0 : before.percent, to: 100 })),
    { level: last, from: last === first ? before.percent : 0, to: after.percent }];
}

function wait(ms, signal) {
  return new Promise(resolve => {
    if (signal.aborted) return resolve();
    const done = () => { clearTimeout(timer); signal.removeEventListener('abort', done); resolve(); };
    const timer = setTimeout(done, ms);
    signal.addEventListener('abort', done, { once: true });
  });
}

export async function playExperienceGain(payload, onFrame, signal, reducedMotion = false) {
  const frames = experienceFrames(payload);
  if (!frames.length || signal.aborted) return;
  const duration = reducedMotion ? 0 : Math.min(700, 2300 / frames.length);
  for (const frame of frames) {
    if (signal.aborted) return;
    const start = Date.now();
    onFrame({ ...frame, percent: frame.from });
    do {
      await wait(16, signal);
      if (signal.aborted) return;
      const fraction = duration ? Math.min(1, (Date.now() - start) / duration) : 1;
      onFrame({ ...frame, percent: frame.from + (frame.to - frame.from) * fraction });
    } while (Date.now() - start < duration);
    if (frame.to === 100 && !reducedMotion) await wait(100, signal);
  }
  await wait(reducedMotion ? 150 : 350, signal);
}

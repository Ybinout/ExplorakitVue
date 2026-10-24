export const WORLD_TIME_ZONE = 'Europe/Paris';
const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: WORLD_TIME_ZONE, hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit',
});
export const smooth = value => { const x = Math.max(0, Math.min(1, value)); return x * x * (3 - 2 * x); };
// Authored real-day lighting, deliberately independent of the device's timezone.
// No seasonal sunrise simulation: the schedule stays predictable for players.
const keys = [
  [0, 1, 0], [6, 1, 0], [7, .32, .7], [8, 0, 0],
  [18, 0, 0], [19, .16, 1], [20, .65, .32], [21, 1, 0], [24, 1, 0],
];
export function daylightAt(timestamp) {
  const parts = formatter.formatToParts(new Date(Number.isFinite(timestamp) ? timestamp : Date.now()));
  const value = type => Number(parts.find(part => part.type === type)?.value || 0);
  const hour = value('hour') % 24 + value('minute') / 60 + value('second') / 3600;
  const right = keys.findIndex(key => key[0] > hour), a = keys[right - 1], b = keys[right];
  const mix = smooth((hour - a[0]) / (b[0] - a[0]));
  const night = a[1] + (b[1] - a[1]) * mix, warmth = a[2] + (b[2] - a[2]) * mix;
  return { night, warmth, lamps: smooth((night - .08) / .72),
    phase: hour < 6 || hour >= 21 ? 'night' : hour < 8 ? 'dawn' : hour < 18 ? 'day' : 'dusk' };
}
export class WorldClock {
  constructor(wall = Date.now(), monotonic = performance.now()) {
    this.wall = wall; this.anchor = monotonic; this.synced = false;
  }
  now(monotonic = performance.now()) { return this.wall + Math.max(0, monotonic - this.anchor); }
  sync(state, received = performance.now(), sent = received) {
    const elapsed = received - sent;
    if (!Number.isFinite(state?.serverTime) || state.serverTime <= 0 || state.timeZone !== WORLD_TIME_ZONE
      || !Number.isFinite(elapsed) || elapsed < 0 || elapsed > 10000) return false;
    this.wall = state.serverTime + elapsed / 2; this.anchor = received; this.synced = true;
    return true;
  }
}
// The five-second UI tick is suspended in hidden tabs. Canvas particles use the
// same monotonic clock directly, without reactive updates on every frame.
export function bindWorldClock(socket, clock, update) {
  let timer, lastSync = -Infinity, disposed = false;
  const refresh = () => { if (!disposed) update(daylightAt(clock.now())); };
  const sync = () => {
    if (!socket.connected || document.hidden || disposed) return;
    const sent = performance.now(); lastSync = sent;
    socket.timeout(10000).emit('worldClock:sync', (error, state) => {
      if (!disposed && !error && clock.sync(state, performance.now(), sent)) refresh();
    });
  };
  const state = payload => { if (!disposed && clock.sync(payload)) refresh(); };
  const tick = () => {
    clearTimeout(timer);
    if (disposed || document.hidden) return;
    refresh();
    if (performance.now() - lastSync >= 300000) sync();
    timer = setTimeout(tick, 5000);
  };
  const visible = () => { if (!document.hidden) sync(); tick(); };
  socket.on('connect', sync); socket.on('worldClockState', state);
  document.addEventListener('visibilitychange', visible); tick();
  return () => { disposed = true; clearTimeout(timer); socket.off('connect', sync);
    socket.off('worldClockState', state); document.removeEventListener('visibilitychange', visible); };
}

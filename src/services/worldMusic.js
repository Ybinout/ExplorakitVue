// A map change never reloads an already selected track. All playheads survive
// battles, mute, visibility changes and a return to another kind of location.
export function worldMusicTrack(map) {
  if (/^cave(?:\d|_|$)/.test(map)) return 'cave';
  if (/^ville5(?:_|$)/.test(map)) return 'snow';
  if (map==='ville_commerciale'||/^tour_(?:rdc|etage[123])$/.test(map)) return 'village';
  if (/^(?:gen_)?route\d+$/.test(map) || map === 'gen_shop_route10' || /^pk[12]$/.test(map)) return 'route';
  if (map === 'start' || /^(?:ville(?:_safe)?\d+|gen_ville\d+)(?:_|$)/.test(map)
    || /^(?:maison\d*|etage\d*|centre|route2_maison)$/.test(map)
    || /^gen_(?:shop|maison|arene)/.test(map)) return 'village';
  return null;
}

export class WorldMusic {
  constructor(sources, createAudio = src => new Audio(src)) {
    this.sources = sources;
    this.createAudio = createAudio;
    this.tracks = new Map();
    this.pending = new Set();
    this.track = null;
    this.active = false;
    this.volume = 0;
    this.destroyed = false;
  }

  update({ map, active, volume }) {
    if (this.destroyed) return;
    this.track = worldMusicTrack(map);
    this.active = Boolean(active);
    this.volume = Math.max(0, Math.min(1, Number(volume) || 0)) * 0.22;
    this.sync();
  }

  wanted(key) { return !this.destroyed && this.active && this.volume > 0 && key === this.track; }

  sync() {
    if (this.destroyed) return;
    if (this.wanted(this.track) && !this.tracks.has(this.track) && this.sources[this.track]) {
      const audio = this.createAudio(this.sources[this.track]);
      audio.loop = true;
      audio.preload = 'none';
      this.tracks.set(this.track, audio);
    }
    for (const [key, audio] of this.tracks) {
      audio.volume = this.volume;
      if (!this.wanted(key)) { audio.pause(); continue; }
      if (!audio.paused || this.pending.has(audio)) continue;
      this.pending.add(audio);
      // Autoplay can be refused: the next real touch/key retries, with no timer
      // or unhandled rejection. A late play promise cannot resurrect old music.
      try {
        Promise.resolve(audio.play()).then(() => {
          if (!this.wanted(key)) audio.pause();
        }, () => {}).finally(() => this.pending.delete(audio));
      } catch (_) { this.pending.delete(audio); }
    }
  }

  destroy() {
    this.destroyed = true;
    for (const audio of this.tracks.values()) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    this.tracks.clear();
    this.pending.clear();
  }
}

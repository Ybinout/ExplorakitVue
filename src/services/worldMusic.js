// Adjacent maps sharing a theme keep playing. Returning from a different theme
// starts at the beginning; battle, mute and visibility pauses preserve position.
export function worldMusicTrack(map) {
  if (map === 'professor_lab') return 'lucie-room';
  if (map === 'ville1_arene') return 'mounir-room';
  if (map === 'ville_safe1_arene') return 'hoze-room';
  if (map === 'centre') return 'center';
  if (map === 'route4_maison' || map === 'route3_maison_nrv') return 'village';
  if (map === 'route2_maison') return 'lucie-room';
  if (map === 'ville3_arene') return 'ana-room';
  if (map === 'gen_arene5') return 'raph-room';
  if (map === 'ville4_arene') return 'wanda-room';
  if (map === 'ville5_arene') return 'sevenp-room';
  if (map === 'route13' || map === 'route14') return 'snow';
  if (/^cave(?:\d|_|$)/.test(map)) return 'cave';
  if (/^ville5(?:_|$)/.test(map)) return 'snow';
  if (map==='ville_commerciale'||/^tour_(?:rdc|etage[123])$/.test(map)) return 'village';
  if (/^(?:gen_)?route\d+$/.test(map) || map === 'gen_shop_route10' || /^pk[12]$/.test(map)) return 'route';
  if (map === 'start' || /^(?:ville(?:_safe)?\d+|gen_ville\d+)(?:_|$)/.test(map)
    || /^(?:maison\d*|etage\d*|route2_maison)$/.test(map)
    || /^gen_(?:shop|maison|arene)/.test(map)) return 'village';
  return null;
}

function worldMusicGain(map, track) {
  // An event room can share a town's track while using a stronger mix.
  if (map === 'professor_lab' || map === 'route2_maison') return 0.5;
  if (map === 'route4_maison' || /(?:^|_)arene\d*$/.test(map)) return 0.34;
  if (['village', 'route', 'snow'].includes(track)) return 0.14;
  return 0.22;
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
    const nextTrack = worldMusicTrack(map);
    if (nextTrack !== this.track) {
      const audio = this.tracks.get(nextTrack);
      if (audio) audio.currentTime = 0;
      this.track = nextTrack;
    }
    this.active = Boolean(active);
    this.volume = Math.max(0, Math.min(1, Number(volume) || 0)) * worldMusicGain(map, nextTrack);
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

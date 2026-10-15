// Small synthesized effects: no download on the critical path of an attack.
export class BattleAudio {
  constructor(createContext = () => {
    const Context = window.AudioContext || window.webkitAudioContext;
    return Context ? new Context() : null;
  }) {
    this.createContext = createContext;
    this.context = null;
    this.output = null;
    this.volume = 0;
    this.voices = new Set();
    this.disposed = false;
  }
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, Number(volume) || 0));
    if (this.output) this.output.gain.setValueAtTime(this.volume, this.context.currentTime);
    if (!this.volume) this.stop();
  }
  unlock() {
    if (this.disposed || !this.volume) return Promise.resolve();
    try {
      if (!this.context) {
        this.context = this.createContext();
        if (!this.context) return Promise.resolve();
        this.output = this.context.createGain();
        this.output.gain.value = this.volume;
        this.output.connect(this.context.destination);
      }
      // Called from pointer/key gestures, including touch release on Safari.
      return this.context.state !== 'running' ? this.context.resume().catch(() => {}) : Promise.resolve();
    } catch (_) { return Promise.resolve(); }
  }
  voice(source, duration, options, filter = null) {
    const c = this.context, gain = c.createGain();
    const start = c.currentTime + (options.delay || 0);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(options.volume || 0.1, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter || gain);
    if (filter) filter.connect(gain);
    gain.connect(this.output);
    this.voices.add(source);
    source.onended = () => {
      this.voices.delete(source); source.disconnect(); gain.disconnect(); filter?.disconnect();
    };
    source.start(start); source.stop(start + duration + 0.02);
    return start;
  }
  ready() { return !this.disposed && this.volume > 0 && this.context?.state === 'running'; }
  tone(frequency, duration, options = {}) {
    if (!this.ready()) return;
    const source = this.context.createOscillator();
    const start = this.context.currentTime + (options.delay || 0);
    source.type = options.type || 'sine';
    source.frequency.setValueAtTime(Math.max(40, frequency), start);
    if (options.endFrequency) source.frequency.exponentialRampToValueAtTime(Math.max(40, options.endFrequency), start + duration);
    this.voice(source, duration, options);
  }
  noise(duration, frequency, options = {}) {
    if (!this.ready()) return;
    const c = this.context;
    if (!this.noiseBuffer) {
      this.noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const source = c.createBufferSource(), filter = c.createBiquadFilter();
    source.buffer = this.noiseBuffer;
    filter.type = 'bandpass'; filter.Q.value = 0.8;
    const start = c.currentTime + (options.delay || 0);
    filter.frequency.setValueAtTime(frequency, start);
    filter.frequency.exponentialRampToValueAtTime(options.endFrequency || frequency / 2, start + duration);
    this.voice(source, duration, options, filter);
  }
  move({ moveType = 'Normal', damageClass = 'physical' } = {}) {
    if (!this.ready()) return;
    if (damageClass === 'status') {
      [440, 660, 880].forEach((note, i) => this.tone(note, 0.18, { delay: i * 0.06, volume: 0.07 }));
    } else if (['Electric', 'Steel'].includes(moveType)) {
      this.noise(0.22, 3600, { volume: 0.17 });
      this.tone(760, 0.23, { type: 'sawtooth', endFrequency: 120, volume: 0.08 });
    } else if (['Water', 'Ice'].includes(moveType)) {
      this.noise(0.38, 1600, { endFrequency: 4300, volume: 0.2 });
      [520, 760, 1080].forEach((note, i) => this.tone(note, 0.1, { delay: i * 0.07, volume: 0.06 }));
    } else if (['Fire', 'Ground', 'Rock', 'Dragon'].includes(moveType)) {
      this.noise(0.36, 850, { volume: 0.3 });
      this.tone(180, 0.25, { endFrequency: 48, type: 'triangle', volume: 0.2 });
    } else if (['Grass', 'Bug', 'Flying'].includes(moveType)) {
      this.noise(0.24, 3200, { volume: 0.23 });
      this.tone(240, 0.16, { endFrequency: 90, volume: 0.12, delay: 0.08 });
    } else if (damageClass === 'special') {
      this.tone(300, 0.3, { endFrequency: 1100, volume: 0.1 });
      this.tone(600, 0.25, { endFrequency: 160, volume: 0.1, delay: 0.08 });
    } else {
      this.noise(0.12, 2400, { volume: 0.25 });
      this.tone(150, 0.18, { endFrequency: 45, type: 'triangle', volume: 0.22 });
    }
  }
  stop() {
    for (const source of this.voices) { try { source.stop(); } catch (_) { /* Already ended. */ } }
    this.voices.clear();
  }
  dispose() {
    this.stop(); this.disposed = true;
    this.context?.close().catch(() => {});
  }
}

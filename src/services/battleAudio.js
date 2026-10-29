import {moveSoundPlan} from './moveSounds.js';

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
    if (this.output) {
      const gain=this.output.gain,now=this.context.currentTime;
      if(gain.setTargetAtTime)gain.setTargetAtTime(this.volume,now,.012);
      else gain.setValueAtTime(this.volume,now);
    }
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
    // Bound even fast/reduced-motion battles, and release evicted nodes now.
    if(this.voices.size>=48){const oldest=this.voices.values().next().value;try{oldest.stop();}catch{ /* Already ended. */ }oldest.onended?.();}
    const start = c.currentTime + (options.delay || 0);
    const attack=Math.min(duration*.4,options.attack||.008),hold=Math.min(duration-.01,options.hold||0);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(options.volume || 0.1, start + attack);
    if(hold>attack)gain.gain.setValueAtTime(options.volume||.1,start+hold);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter || gain);
    if (filter) filter.connect(gain);
    gain.connect(this.output);
    this.voices.add(source);
    let released=false;
    source.onended = () => {
      if(released)return;released=true;
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
    filter.type = options.filter || 'bandpass'; filter.Q.value = 0.8;
    const start = c.currentTime + (options.delay || 0);
    filter.frequency.setValueAtTime(frequency, start);
    filter.frequency.exponentialRampToValueAtTime(options.endFrequency || frequency / 2, start + duration);
    this.voice(source, duration, options, filter);
  }
  playPlan(payload,stage) {
    if(!this.ready())return;
    for(const voice of moveSoundPlan(payload,stage)){
      const {kind,frequency,duration,...options}=voice;
      if(kind==='noise')this.noise(duration,frequency,options);
      else this.tone(frequency,duration,options);
    }
  }
  move(payload={}) { this.playPlan({damageClass:'physical',...payload},'cast'); }
  impact(payload={}) { this.playPlan(payload,'impact'); }
  stop() {
    for (const source of this.voices) { try { source.stop(); } catch (_) { /* Already ended. */ } source.onended?.(); }
    this.voices.clear();
  }
  dispose() {
    this.stop(); this.disposed = true;
    this.context?.close?.().catch(() => {});
  }
}

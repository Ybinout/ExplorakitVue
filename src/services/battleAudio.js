import {damageImpactPlan,combatCuePlan,audibleCombatPlan,IMPACT_GAIN,STATUS_GAIN} from './moveSounds.js';
import {BattleSamples} from './battleSamples.js';
import {BattleWeatherAudio,weatherAudioKind} from './battleWeatherAudio.js';

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
    this.weatherDesired=null;this.weatherAudio=new BattleWeatherAudio(this);
  }
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, Number(volume) || 0));
    if (this.output) {
      const gain=this.output.gain,now=this.context.currentTime;
      if(gain.setTargetAtTime)gain.setTargetAtTime(this.volume,now,.012);
      else gain.setValueAtTime(this.volume,now);
    }
    if (!this.volume) this.stop({keepWeather:true});else this.weatherAudio.set(this.weatherDesired);
  }
  unlock() {
    if (this.disposed || !this.volume) return Promise.resolve();
    try {
      this.ensureContext();if(!this.context)return Promise.resolve();
      // Called from pointer/key gestures, including touch release on Safari.
      return (this.context.state !== 'running' ? this.context.resume().catch(() => {}) : Promise.resolve()).then(()=>this.weatherAudio.set(this.weatherDesired));
    } catch (_) { return Promise.resolve(); }
  }
  ensureContext(){if(!this.context&&!this.disposed){try{this.context=this.createContext();if(this.context){this.output=this.context.createGain();this.output.gain.value=this.volume;this.output.connect(this.context.destination);}}catch{ /* Audio unavailable. */ }}}
  enableSamples(catalogue,options){this.samples ||= new BattleSamples(this,catalogue,options);return this.samples;}
  effectDestination(){
    if(!this.context.createWaveShaper)return this.output;
    // A peak-only ceiling preserves quiet impacts; it does not pull their
    // envelope down like a compressor recovering from the previous transient.
    if(!this.effectLimiter){const n=this.context.createWaveShaper(),curve=new Float32Array(4097);for(let i=0;i<curve.length;i++){const x=i/(curve.length-1)*2-1,a=Math.abs(x);curve[i]=Math.sign(x)*(a<=.85?a:.85+.1*Math.tanh((a-.85)/.1));}n.curve=curve;n.oversample='2x';n.connect(this.output);this.effectLimiter=n;}
    return this.effectLimiter;
  }
  voice(source, duration, options, filter = null) {
    const c = this.context, gain = c.createGain();
    // Bound even fast/reduced-motion battles, and release evicted nodes now.
    if(this.voices.size>=48){const oldest=this.voices.values().next().value;try{oldest.stop();}catch{ /* Already ended. */ }oldest.onended?.();}
    const start = c.currentTime + (options.delay || 0);
    const mixGain=options.mixGain??1,level=(options.volume||.1)*mixGain,floor=.0001*mixGain;
    const attack=Math.min(duration*.4,options.attack||.008),hold=Math.min(duration-.01,options.hold||0);
    gain.gain.setValueAtTime(floor, start);
    gain.gain.exponentialRampToValueAtTime(level, start + attack);
    if(hold>attack)gain.gain.setValueAtTime(level,start+hold);
    gain.gain.exponentialRampToValueAtTime(floor, start + duration);
    source.connect(filter || gain);
    if (filter) filter.connect(gain);
    gain.connect(this.effectDestination());
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
  impact(payload={}) {
    this.samples?.duck();
    this.playPlan(payload.weather?combatCuePlan({kind:'weather-damage',weather:payload.weather}):damageImpactPlan(payload),IMPACT_GAIN);
  }
  cue(payload={}) {
    this.playPlan(combatCuePlan(payload),payload.kind==='status'?STATUS_GAIN:payload.kind==='weather-damage'?IMPACT_GAIN:1);
  }
  setWeather(kind){this.weatherDesired=weatherAudioKind(kind);this.weatherAudio.set(this.weatherDesired);}
  playPlan(plan,gain=1) {
    if(!this.ready())return;
    for(const voice of audibleCombatPlan(plan)){
      const {kind,frequency,duration,...options}=voice;options.mixGain=gain;
      if(kind==='noise')this.noise(duration,frequency,options);
      else this.tone(frequency,duration,options);
    }
  }
  stop({keepWeather=false}={}) {
    this.weatherAudio.stop();if(!keepWeather)this.weatherDesired=null;
    this.samples?.stop();
    for (const source of this.voices) { try { source.stop(); } catch (_) { /* Already ended. */ } source.onended?.(); }
    this.voices.clear();
  }
  dispose() {
    this.samples?.dispose();
    this.stop(); this.disposed = true;
    this.effectLimiter?.disconnect();
    this.context?.close?.().catch(() => {});
  }
}

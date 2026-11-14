const id=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'');
export function weatherAudioKind(value){return({rain:'rain',raindance:'rain',primordialsea:'rain',sandstorm:'sandstorm',hail:'hail',snow:'snow',snowscape:'snow',sun:'sun',sunnyday:'sun',desolateland:'sun'})[id(value?.kind||value)]||null;}
export function weatherDamageKind(value){const source=id(value?.source||value);if(/sandstorm|sable/.test(source))return 'sandstorm';if(source==='hail'||/grele|hail/.test(source))return 'hail';return null;}
export const WEATHER_BEDS={rain:{frequency:2100,volume:.085},sandstorm:{frequency:700,volume:.075},hail:{frequency:3400,volume:.06},snow:{frequency:1100,volume:.04},sun:{frequency:380,volume:.035}};
// One filtered noise loop with slow modulation, on the existing audio clock.
// There is no per-frame JS sound work and no timer creating repeated voices.
export class BattleWeatherAudio{
 constructor(audio){this.audio=audio;this.kind=null;this.nodes=[];}
 set(value){const kind=weatherAudioKind(value);if(kind===this.kind&&this.nodes.length)return;this.stop();if(!kind||!this.audio.ready())return;
  const c=this.audio.context,p=WEATHER_BEDS[kind];this.kind=kind;
  if(!this.audio.noiseBuffer){this.audio.noiseBuffer=c.createBuffer(1,c.sampleRate,c.sampleRate);const a=this.audio.noiseBuffer.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;}
  const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain(),lfo=c.createOscillator(),depth=c.createGain();source.buffer=this.audio.noiseBuffer;source.loop=true;filter.type=kind==='rain'||kind==='hail'?'bandpass':'lowpass';filter.frequency.value=p.frequency;filter.Q.value=.65;gain.gain.value=p.volume;depth.gain.value=p.volume*.18;lfo.frequency.value=kind==='sandstorm'?.23:.15;source.connect(filter);filter.connect(gain);gain.connect(this.audio.output);lfo.connect(depth);depth.connect(gain.gain);source.start();lfo.start();this.nodes=[source,filter,gain,lfo,depth];
 }
 stop(){for(const n of this.nodes){try{n.stop?.();}catch{ /* Already stopped. */ }n.disconnect();}this.nodes=[];this.kind=null;}
}

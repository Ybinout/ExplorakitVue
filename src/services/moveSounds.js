// Presentation only: play a result when its authoritative visual is presented.
// A failed move never creates a damage impact, even if its packet says critical.
export function damageImpactStrength(damage, maxHp) {
  if (!Number.isFinite(damage) || !Number.isFinite(maxHp) || damage <= 0 || maxHp <= 0) return null;
  const fraction = damage / maxHp;
  return fraction >= 0.5 ? 'heavy' : fraction >= 0.2 ? 'medium' : 'light';
}

const profiles = {
  light: { frequency: 155, endFrequency: 72, duration: 0.12, volume: 0.20, noiseFrequency: 1900, noiseDuration: 0.08, noiseVolume: 0.16 },
  medium: { frequency: 110, endFrequency: 48, duration: 0.19, volume: 0.30, noiseFrequency: 1550, noiseDuration: 0.12, noiseVolume: 0.25 },
  heavy: { frequency: 78, endFrequency: 40, duration: 0.25, volume: 0.38, noiseFrequency: 1100, noiseDuration: 0.17, noiseVolume: 0.33 }
};

export function damageImpactPlan({ damage, maxHp, critical = false, effectiveness = 1, direct = true } = {}) {
  const profile = profiles[damageImpactStrength(damage, maxHp)];
  if (!profile) return [];
  const { frequency, endFrequency, duration, volume, noiseFrequency, noiseDuration, noiseVolume } = profile;
  if(direct && effectiveness===0)return [];
  if(direct && critical)return [
    {kind:'tone',type:'triangle',frequency:98,endFrequency:40,duration:.30,volume:.34,attack:.003},
    {kind:'noise',filter:'lowpass',frequency:2600,endFrequency:550,duration:.18,volume:.27,attack:.002},
    {kind:'tone',type:'triangle',frequency:196,endFrequency:90,duration:.14,volume:.12,attack:.003},
    {kind:'tone',type:'sine',frequency:55,endFrequency:40,duration:.24,volume:.10,delay:.025,attack:.003}
  ];
  const scale=direct&&effectiveness<1?.53:direct&&effectiveness>1?1.08:1;
  const voices=[
    { kind: 'tone', type: 'triangle', frequency, endFrequency, duration, volume:volume*scale, attack: 0.004 },
    { kind: 'noise', filter: 'lowpass', frequency: noiseFrequency, endFrequency: noiseFrequency / 3, duration: noiseDuration, volume:noiseVolume*scale, attack: 0.003 }
  ];
  if(direct&&effectiveness>1)voices.push({kind:'tone',type:'triangle',frequency:165,endFrequency:72,duration:.20,volume:.12,delay:.015,attack:.004});
  return voices;
}

// Boost only combat plans, preserving world jingles and master-volume behaviour.
// Conservative aggregate amplitude prevents clipping even for simultaneous notes.
export function audibleCombatPlan(plan){
 const total=plan.reduce((sum,v)=>sum+v.volume,0),budget=plan.length>=4?.92:plan.length===3?.88:.76,gain=Math.min(1.65,budget/Math.max(.001,total));
 return plan.map(v=>({...v,volume:v.volume*gain}));
}
export const COMBAT_MUSIC_GAIN=.75;

const tone=(frequency,endFrequency,duration=.18,volume=.10,delay=0,type='sine')=>({kind:'tone',frequency,endFrequency,duration,volume,delay,type});
const noise=(frequency,endFrequency,duration,volume,filter='bandpass',delay=0)=>({kind:'noise',frequency,endFrequency,duration,volume,filter,delay});
export function combatCuePlan({kind,status}={}) {
  if(kind==='stat-up'||kind==='stat-down'){
    const up=kind==='stat-up',notes=up?[392,494,659]:[659,494,392];
    return notes.map((f,i)=>tone(f,f*(up?1.14:.87),.19,.10,i*.055,'triangle'));
  }
  if(kind==='miss')return [noise(2400,900,.13,.075,'highpass'),tone(520,180,.13,.055,0,'triangle')];
  if(kind!=='status')return [];
  switch(status){
    case 'poison':return [tone(180,300,.19,.09),tone(240,140,.21,.085,.08),tone(155,280,.18,.08,.18),noise(850,450,.22,.035)];
    case 'burn':return [noise(2100,450,.29,.12,'highpass'),tone(105,65,.27,.075,0,'triangle'),noise(3600,1200,.10,.06,'bandpass',.10)];
    case 'paralysis':return [tone(140,190,.09,.055,0,'sawtooth'),noise(4200,1800,.07,.07),tone(230,130,.08,.06,.11,'sawtooth'),tone(110,180,.08,.05,.22,'triangle')];
    case 'freeze':return [tone(1568,1319,.18,.075),tone(2093,1760,.22,.06,.055),noise(6500,3100,.18,.05,'highpass',.04)];
    case 'confusion':return [tone(523,784,.16,.09),tone(740,494,.19,.085,.10),tone(440,659,.20,.07,.22)];
    case 'disable':return [tone(440,220,.13,.09,0,'triangle'),tone(311,155,.19,.09,.10,'triangle')];
    case 'sleep':return [tone(440,392,.24,.075),tone(330,294,.26,.065,.12),tone(262,247,.28,.055,.24)];
    case 'attraction':return [tone(659,784,.22,.08),tone(988,1047,.24,.07,.10)];
    case 'curse':return [tone(131,98,.30,.10,0,'triangle'),tone(185,139,.27,.065,.06)];
    case 'seed':return [tone(330,440,.13,.08,0,'triangle'),tone(523,392,.16,.07,.08)];
    case 'trap':return [noise(800,250,.13,.08),tone(190,105,.20,.08,0,'triangle')];
    case 'recoil':return [tone(180,90,.12,.07,0,'triangle')];
    case 'cure':return [tone(659,784,.18,.075),tone(988,1175,.21,.065,.08)];
    default:return [];
  }
}

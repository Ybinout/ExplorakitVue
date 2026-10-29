import {moveVisual,moveConnected} from './moveVisuals.js';

// Original, short game effects. Voices share BattleAudio's cached noise buffer;
// no samples, downloads or timers are required on the battle's critical path.
const tone=(frequency,duration,volume,endFrequency=frequency,delay=0,type='sine',hold=0)=>({kind:'tone',frequency,duration,volume,endFrequency,delay,type,hold});
const noise=(frequency,duration,volume,endFrequency=frequency/2,delay=0,filter='bandpass',hold=0)=>({kind:'noise',frequency,duration,volume,endFrequency,delay,filter,hold});
const casts={
  bite:()=>[noise(2400,.07,.29,700),noise(1700,.07,.18,500,.07),tone(130,.15,.16,65)],
  claw:()=>[noise(4800,.19,.31,1100),noise(3600,.10,.17,1600,.06)],
  punch:()=>[noise(950,.18,.24,3100),tone(155,.17,.20,75,0,'triangle')],
  charge:()=>[noise(2600,.24,.28,650),tone(115,.20,.18,60,0,'triangle')],
  beam:()=>[tone(140,.34,.17,620,0,'triangle',.20),tone(285,.32,.12,1040,.02,'sine',.18),noise(1400,.32,.20,3600,.04,'bandpass',.16)],
  projectile:()=>[noise(3400,.18,.22,1200),tone(330,.23,.18,960,0,'triangle')],
  drain:()=>[tone(630,.23,.15,210),tone(840,.25,.12,280,.05),noise(2300,.22,.13,600)],
  zone:()=>[noise(620,.42,.32,150,0,'lowpass',.15),tone(100,.38,.24,40,0,'triangle',.12)],
  status:()=>[tone(350,.22,.15,420),tone(525,.22,.13,630,.07),tone(700,.23,.11,840,.14)],
  purify:()=>[tone(440,.32,.16,880),tone(660,.30,.13,1320,.08),tone(880,.35,.11,1760,.16)]
};
const elements={
  Normal:()=>[],
  Fighting:()=>[tone(95,.16,.15,45,0,'triangle')],
  Fire:()=>[noise(1000,.36,.28,180,0,'lowpass',.12),noise(3100,.08,.13,600,.08),tone(85,.28,.12,45,0,'triangle')],
  Water:()=>[noise(1200,.35,.25,3200,0,'bandpass',.14),tone(460,.12,.13,180,.02),tone(650,.12,.12,240,.10),tone(890,.13,.10,330,.18)],
  Electric:()=>[tone(95,.26,.12,210,0,'sawtooth',.14),noise(5200,.07,.20,1900),noise(4600,.06,.18,1800,.09),noise(6000,.08,.16,2200,.18)],
  Grass:()=>[noise(4600,.28,.20,1700,0,'highpass'),tone(710,.20,.10,480,.04,'triangle')],
  Ice:()=>[tone(1450,.23,.12,1800,0,'triangle'),tone(2175,.26,.10,2600,.07,'triangle'),tone(3100,.24,.07,3200,.13),noise(6500,.18,.09,4200)],
  Flying:()=>[noise(2600,.35,.25,780,0,'bandpass',.12),tone(760,.25,.10,1250,.03)],
  Poison:()=>[tone(280,.23,.18,65,0,'triangle'),tone(420,.17,.12,100,.08),noise(820,.25,.15,240)],
  Ground:()=>[noise(380,.37,.27,90,0,'lowpass',.13),tone(65,.31,.21,40,0,'triangle')],
  Rock:()=>[noise(1050,.13,.24,210),noise(1900,.10,.18,400,.11),noise(2700,.09,.14,600,.21),tone(90,.27,.12,42,0,'triangle')],
  Bug:()=>[tone(145,.22,.08,95,0,'square'),noise(3800,.09,.14,1800),noise(3400,.10,.12,1400,.12)],
  Psychic:()=>[tone(360,.35,.15,720),tone(367,.35,.12,735),tone(920,.26,.09,460,.08)],
  Ghost:()=>[tone(210,.39,.16,105),tone(318,.36,.11,159,.07),noise(2300,.31,.10,650)],
  Dark:()=>[tone(110,.29,.16,55,0,'sawtooth'),noise(1600,.30,.21,280)],
  Dragon:()=>[noise(700,.38,.25,180,0,'lowpass',.13),tone(160,.35,.15,75,0,'sawtooth'),tone(245,.29,.10,110,.03,'triangle')],
  Steel:()=>[tone(770,.30,.13,740,0,'triangle'),tone(1180,.25,.10,1120,.02,'triangle'),tone(2070,.19,.07,1900,.03),noise(4200,.08,.12,1700)],
  Fairy:()=>[tone(660,.28,.12,880),tone(990,.29,.10,1320,.06),tone(1320,.28,.08,1760,.12)]
};
const impacts={
  bite:()=>[noise(1900,.10,.34,550),tone(180,.13,.22,48,0,'triangle')],
  claw:()=>[noise(5300,.13,.30,1300),noise(2900,.08,.17,700,.025)],
  punch:()=>[tone(135,.20,.30,42,0,'triangle'),noise(1500,.13,.31,300)],
  charge:()=>[noise(1700,.17,.32,320),tone(105,.23,.29,40,0,'triangle')],
  beam:()=>[noise(3100,.23,.29,720),tone(210,.23,.17,70,0,'triangle')],
  projectile:()=>[noise(2300,.16,.30,650),tone(220,.16,.23,55,0,'triangle')],
  drain:()=>[tone(260,.32,.16,780),tone(390,.32,.12,1170,.06)],
  zone:()=>[noise(460,.35,.34,100,0,'lowpass',.08),tone(85,.31,.25,40,0,'triangle')]
};

export function moveSoundPlan(payload={},stage='cast') {
  const family=moveVisual(payload).family;
  if(stage==='impact'){
    if(payload.phase==='prepare'||!moveConnected(payload.result)||!(payload.result?.damage>0))return [];
    const recipe=impacts[family]||impacts.projectile,hits=Math.min(6,Math.max(1,Number(payload.result.hits)||1));
    return Array.from({length:hits},(_,i)=>recipe().map(v=>({...v,delay:v.delay+i*.075,volume:v.volume*(hits>1?.65:1)}))).flat();
  }
  if(payload.phase==='prepare')return [tone(145,.42,.18,580,0,'triangle',.22),noise(550,.38,.17,2200,0,'bandpass',.20)];
  const base=(casts[family]||casts.status)();
  const elemental=(elements[payload.moveType]||elements.Normal)();
  // Element texture colours the gesture without drowning out its rhythm.
  return [...base,...elemental.map(v=>({...v,volume:v.volume*(payload.damageClass==='status'?.45:.75)}))];
}

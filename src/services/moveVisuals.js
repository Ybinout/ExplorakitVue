import {MOVE_VARIANTS} from './moveVariantEffects.js';
import {pacedMovePhases} from './battlePacing.js';
import { MOVE_VISUAL_CATALOG } from './moveVisualCatalog.js';
// Presentation-only families. Canonical move names stay independent of localisation.
const groups = {
  purify: ['Purify'],
  bite: ['Bite','Crunch','Fire Fang','Ice Fang','Thunder Fang','Poison Fang','Psychic Fangs','Hyper Fang','Super Fang','Psychic Fangs'],
  claw: ['Scratch','Slash','Night Slash','Shadow Claw','Dragon Claw','Metal Claw','Fury Swipes','Crush Claw','Razor Shell','Cut','X-Scissor','Psycho Cut','Air Slash','Air Cutter','Fury Cutter','Aerial Ace'],
  punch: ['Pound','Mega Punch','Fire Punch','Ice Punch','Thunder Punch','Mach Punch','Bullet Punch','Shadow Punch','Dynamic Punch','Focus Punch','Power-Up Punch','Sky Uppercut','Hammer Arm','Meteor Mash','Comet Punch','Dizzy Punch','Double Hit','Karate Chop','Cross Chop','Close Combat','Brick Break','Force Palm'],
  kick: ['Double Kick','Mega Kick','Jump Kick','High Jump Kick','Low Kick','Low Sweep','Rolling Kick','Triple Kick','Blaze Kick','Trop Kick','Stomp','Triple Axel'],
  charge: ['Wave Crash','Tackle','Body Slam','Take Down','Double-Edge','Headbutt','Zen Headbutt','Iron Head','Head Smash','Quick Attack','Extreme Speed','Aqua Jet','Flame Charge','Flare Blitz','Volt Tackle','Wild Charge','Brave Bird','Giga Impact','Rollout','Bide','Sucker Punch'],
  beam: ['Hyper Beam','Solar Beam','Ice Beam','Bubble Beam','Aurora Beam','Psybeam','Signal Beam','Charge Beam','Flash Cannon','Hydro Pump','Water Gun','Flamethrower','Dragon Breath','Dragon Pulse','Dark Pulse','Thunderbolt','Zap Cannon','Focus Blast','Tri Attack','Hyper Voice'],
  drain: ['Strength Sap','Absorb','Mega Drain','Giga Drain','Drain Punch','Draining Kiss','Leech Life','Dream Eater','Oblivion Wing','Parabolic Charge','Horn Leech'],
  zone: ['Ice Spinner','Earthquake','Magnitude','Bulldoze','Earth Power','Surf','Muddy Water','Whirlpool','Blizzard','Heat Wave','Lava Plume','Discharge','Eruption','Water Spout','Sludge Wave','Petal Blizzard','Dazzling Gleam','Explosion','Self-Destruct','Rock Slide','Rock Tomb','Ancient Power','Sand Tomb','Fire Spin','Hurricane','Twister','Spikes','Stealth Rock','Toxic Spikes'],
  projectile: ['Ember','Water Pulse','Bubble','Ice Shard','Icy Wind','Swift','Shadow Ball','Energy Ball','Aura Sphere','Sludge Bomb','Mud Bomb','Magnet Bomb','Seed Bomb','Egg Bomb','Acid','Poison Sting','Pin Missile','Bullet Seed','Rock Blast','Icicle Spear','Rock Throw','Razor Leaf','Leaf Storm','Leaf Tornado','Electro Ball','Gyro Ball','Dragon Rage','Dragon Meteor','Draco Meteor','Flame Burst']
};
const families = new Map(Object.entries(groups).flatMap(([family,names])=>names.map(name=>[name.toLowerCase(),family])));
// Form, cadence and palette are composed independently; a type is not an animation.
export const ELEMENTS = Object.freeze({
 Normal:{ink:'#c2cbd3',light:'#fff8e9',dark:'#52647c',shape:'dash'},
 Fire:{ink:'#ff7040',light:'#fff0a0',dark:'#ac263d',shape:'flame'},
 Water:{ink:'#43b9ef',light:'#d4ffff',dark:'#2867af',shape:'drop'},
 Electric:{ink:'#ffe34d',light:'#ffffe3',dark:'#bd751b',shape:'bolt'},
 Grass:{ink:'#78ca68',light:'#e4ff9b',dark:'#327456',shape:'leaf'},
 Ice:{ink:'#82e5f2',light:'#f3ffff',dark:'#4f88d4',shape:'crystal'},
 Fighting:{ink:'#ef8c60',light:'#ffe1ae',dark:'#903d45',shape:'fist'},
 Poison:{ink:'#be68dc',light:'#efbdff',dark:'#61358e',shape:'bubble'},
 Ground:{ink:'#c39a69',light:'#f4d2a2',dark:'#694c41',shape:'earth'},
 Flying:{ink:'#bbdce9',light:'#ffffff',dark:'#7196b7',shape:'feather'},
 Psychic:{ink:'#ef7caf',light:'#ffdfef',dark:'#854eab',shape:'lens'},
 Bug:{ink:'#b6cf58',light:'#f5ffc7',dark:'#668644',shape:'wing'},
 Rock:{ink:'#b7a68a',light:'#f2dfae',dark:'#625c64',shape:'stone'},
 Ghost:{ink:'#a58ce4',light:'#d9e4ff',dark:'#423057',shape:'wisp'},
 Dragon:{ink:'#a08bff',light:'#d5fffc',dark:'#5841a8',shape:'dragon'},
 Dark:{ink:'#96779b',light:'#d7c3d4',dark:'#262438',shape:'shadow'},
 Steel:{ink:'#a9cbd8',light:'#f4ffff',dark:'#4c6a87',shape:'metal'},
 Fairy:{ink:'#f3a5da',light:'#fff3e3',dark:'#ac69b1',shape:'star'}
});
const signatures = {
 'Helping Hand':'helping-hands','Facade':'facade-rush','Return':'return-comet',
 'Double Kick':'double-kick','Triple Kick':'spinning-kick','Triple Axel':'spinning-kick','Rolling Kick':'spinning-kick','Blaze Kick':'blazing-kick',
 'Flamethrower':'flame-stream','Fire Blast':'fire-blast','Fire Spin':'fire-vortex','Inferno':'fire-vortex',
 'Thunderbolt':'lightning-chain','Thunder':'sky-thunder','Volt Switch':'volt-return','Discharge':'electric-field',
 'Hyper Beam':'hyper-beam','Solar Beam':'solar-lance','Ice Beam':'frost-beam','Aurora Beam':'aurora-beam',
 'Psybeam':'psy-beam','Charge Beam':'charge-beam','Dragon Pulse':'dragon-beam','Dragon Breath':'dragon-breath',
 'Hydro Pump':'water-cannon','Water Gun':'water-jet','Bubble Beam':'bubble-stream','Signal Beam':'insect-beam',
 'Surf':'surf','Muddy Water':'mud-wave','Earthquake':'earthquake','Magnitude':'earthquake','Bulldoze':'earthquake',
 'Blizzard':'blizzard','Rock Slide':'rock-slide','Rock Tomb':'rock-cage','Draco Meteor':'draco-meteors','Dragon Meteor':'draco-meteors',
 'Eruption':'eruption','Water Spout':'water-spout','Heat Wave':'heat-wave','Lava Plume':'eruption','Sludge Wave':'toxic-wave',
 'Explosion':'detonation','Self-Destruct':'detonation','Dazzling Gleam':'fairy-field','Hurricane':'hurricane','Twister':'hurricane',
 'Ice Spinner':'ice-spin','Petal Dance':'petal-dance','Petal Blizzard':'petal-dance','Leaf Storm':'leaf-storm',
 'Razor Leaf':'razor-leaves','Bullet Seed':'seed-volley','Pin Missile':'pin-volley','Rock Blast':'rock-volley','Icicle Spear':'ice-volley',
 'Psyshock':'psy-shock','Psystrike':'psy-shock','Psychic':'psychic-orb','Moonblast':'moon-orb','Mist Ball':'mist-orb','Luster Purge':'prism-orb',
 'Shadow Ball':'shadow-orb','Aura Sphere':'aura-orb','Energy Ball':'seed-orb','Pollen Puff':'seed-orb','Electro Ball':'electric-orb',
 'Sludge Bomb':'toxic-bomb','Ember':'embers','Flame Burst':'fire-burst','Ice Shard':'ice-shards','Swift':'star-volley',
 'Swords Dance':'sword-dance','Calm Mind':'calm-mind','Dragon Dance':'dragon-dance','Quiver Dance':'butterfly-dance',
 'Toxic':'toxic-drops','Poison Powder':'spores','Sleep Powder':'spores','Stun Spore':'spores','Will-O-Wisp':'spirit-flames',
 'Recover':'recovery','Roost':'recovery','Soft-Boiled':'recovery','Milk Drink':'recovery','Synthesis':'recovery','Moonlight':'recovery','Morning Sun':'recovery',
 'Protect':'barrier','Detect':'barrier','Wide Guard':'barrier','Light Screen':'barrier','Reflect':'barrier','Aurora Veil':'barrier',
 'Stealth Rock':'hazard-rocks','Spikes':'hazard-spikes','Toxic Spikes':'hazard-spikes','Sticky Web':'hazard-web',
 'Substitute':'decoy','Teleport':'warp','Trick Room':'trick-room','Wish':'wish','Future Sight':'future-sight','Doom Desire':'future-sight',
 'Drain Punch':'drain-punch','Horn Leech':'drain-charge','Giga Drain':'drain-vines','Mega Drain':'drain-siphon','Absorb':'drain-siphon','Leech Life':'drain-bite','Dream Eater':'dream-drain',
 'Purify':'purify'
};
const normalize=s=>String(s||'').toLowerCase().trim();
const metaByName=new Map(Object.entries(MOVE_VISUAL_CATALOG).map(([name,data])=>[normalize(name),data]));
const variants=new Map(Object.entries(MOVE_VARIANTS).map(([name,variant])=>[normalize(name),variant]));
const styleByName=new Map(Object.entries(signatures).map(([name,style])=>[normalize(name),style]));
export const SIGNATURE_MOVES = Object.freeze(Object.keys(signatures));
export function moveVisual(payload = {}) {
  const name=normalize(payload.moveName), meta=metaByName.get(name)||[], phase=payload.phase;
  const damageClass=payload.healing?'status':normalize(payload.damageClass||meta[2]||'status');
  const family=phase==='prepare'?'status':families.get(name)
    || (damageClass==='physical'?'charge':damageClass==='special'?'projectile':'status');
  const moveType=Object.keys(ELEMENTS).find(type=>normalize(type)===normalize(payload.moveType||meta[0]))||'Normal';
  const power=Math.max(0,Math.min(250,Number(payload.movePower??payload.power??meta[1])|| (damageClass==='status'?0:50)));
  const intensity=Math.max(.18,Math.min(1,(power-15)/145));
  let style=styleByName.get(name)||(family==='zone'?'ground-wave':family);
  if(damageClass==='status'&&!styleByName.has(name)) {
    const effects=meta[4]||'';
    style=effects.includes('heal')?'recovery':effects.includes('stat_stage')?'stat-weave':effects.includes('status')?'status-motes':'status';
  }
  if(payload.healing)style='recovery';
  if(phase==='prepare')style='gather';
  // The existing presentation queue remains authoritative. Bounded phases never
  // wait for the renderer or add an asynchronous network dependency.
  const magical=['Fairy','Psychic','Ghost','Dragon'].includes(moveType);
  const vivid=damageClass!=='status'&&(['projectile','beam','drain','zone'].includes(family)||magical);
  const visibilityScale=vivid?(family==='beam'?1.5:family==='zone'?1.45:magical?2.45:2.15):1;
  const heavy=['hyper-beam','draco-meteors','sky-thunder','fire-blast'].includes(style);
  const profile = {family,style,moveType,damageClass,power,intensity,visibilityScale,
    target:payload.moveTarget||meta[3]||'opponent',
    windupMs:phase==='prepare'?460:family==='kick'||style==='facade-rush'||style==='return-comet'?200:style==='helping-hands'?160:vivid?(family==='beam'?300:magical?260:220):heavy?280:family==='beam'?180:family==='charge'||family==='punch'?120:90,
    travelMs:family==='kick'?360:style==='helping-hands'?680:style==='facade-rush'||style==='return-comet'?380:vivid?(family==='zone'?620:family==='beam'?680:magical?780:700):heavy?510:family==='beam'?390:family==='projectile'?360:family==='zone'?410:family==='charge'||family==='punch'?250:190,
    impactMs:family==='kick'||style==='facade-rush'||style==='return-comet'?520:style==='helping-hands'?460:vivid?(magical||heavy?700:640):heavy?620:410,camera:power>=100||heavy};
  return {...profile,variant:variants.get(name)||null,...pacedMovePhases(profile)};
}
export function persistentMoveVisuals(pokemon) {
  if (!pokemon?.uuid || !(pokemon.currentHp > 0)) return {shield:false,clone:false};
  return {shield:Boolean(pokemon.__battle?.protect),clone:Number(pokemon.__battle?.substituteHp)>0};
}
export function moveConnected(result) { return !result || !(result.success === false || result.missed || result.immune || result.blocked || result.effectiveness === 0); }

export function moveTargetsSelf(target) { return ['self','user','ally_side','self_side','allySide','userSide'].includes(target); }

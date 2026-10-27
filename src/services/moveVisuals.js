// Presentation-only families. Canonical move names stay independent of localisation.
const groups = {
  purify: ['Purify'],
  bite: ['Bite','Crunch','Fire Fang','Ice Fang','Thunder Fang','Poison Fang','Psychic Fangs','Hyper Fang','Super Fang','Psychic Fangs'],
  claw: ['Scratch','Slash','Night Slash','Shadow Claw','Dragon Claw','Metal Claw','Fury Swipes','Crush Claw','Razor Shell','Cut','X-Scissor','Psycho Cut','Air Slash','Air Cutter','Fury Cutter','Aerial Ace'],
  punch: ['Pound','Mega Punch','Fire Punch','Ice Punch','Thunder Punch','Mach Punch','Bullet Punch','Shadow Punch','Dynamic Punch','Focus Punch','Power-Up Punch','Sky Uppercut','Hammer Arm','Meteor Mash','Comet Punch','Dizzy Punch','Double Hit','Karate Chop','Cross Chop','Close Combat','Brick Break','Force Palm'],
  charge: ['Tackle','Body Slam','Take Down','Double-Edge','Headbutt','Zen Headbutt','Iron Head','Head Smash','Quick Attack','Extreme Speed','Aqua Jet','Flame Charge','Flare Blitz','Volt Tackle','Wild Charge','Brave Bird','Giga Impact','Rollout','Bide','Sucker Punch'],
  beam: ['Hyper Beam','Solar Beam','Ice Beam','Bubble Beam','Aurora Beam','Psybeam','Signal Beam','Charge Beam','Flash Cannon','Hydro Pump','Water Gun','Flamethrower','Dragon Breath','Dragon Pulse','Dark Pulse','Thunderbolt','Zap Cannon','Focus Blast','Tri Attack','Hyper Voice'],
  drain: ['Strength Sap','Absorb','Mega Drain','Giga Drain','Drain Punch','Draining Kiss','Leech Life','Dream Eater','Oblivion Wing','Parabolic Charge','Horn Leech'],
  zone: ['Earthquake','Magnitude','Bulldoze','Earth Power','Surf','Muddy Water','Whirlpool','Blizzard','Heat Wave','Lava Plume','Discharge','Eruption','Water Spout','Sludge Wave','Petal Blizzard','Dazzling Gleam','Explosion','Self-Destruct','Rock Slide','Rock Tomb','Ancient Power','Sand Tomb','Fire Spin','Hurricane','Twister','Spikes','Stealth Rock','Toxic Spikes'],
  projectile: ['Ember','Water Pulse','Bubble','Ice Shard','Icy Wind','Swift','Shadow Ball','Energy Ball','Aura Sphere','Sludge Bomb','Mud Bomb','Magnet Bomb','Seed Bomb','Egg Bomb','Acid','Poison Sting','Pin Missile','Bullet Seed','Rock Blast','Icicle Spear','Rock Throw','Razor Leaf','Leaf Storm','Leaf Tornado','Electro Ball','Gyro Ball','Dragon Rage','Dragon Meteor','Draco Meteor','Flame Burst']
};
const families = new Map(Object.entries(groups).flatMap(([family,names])=>names.map(name=>[name.toLowerCase(),family])));
export function moveVisual(payload = {}) {
  const family = payload.phase === 'prepare' ? 'status' : families.get(String(payload.moveName || '').toLowerCase())
    || (payload.damageClass === 'physical' ? 'charge' : payload.damageClass === 'special' ? 'projectile' : 'status');
  return { family, travelMs: family === 'beam' ? 360 : family === 'projectile' ? 340 : family === 'charge' || family === 'punch' ? 240 : 160 };
}
export function persistentMoveVisuals(pokemon) {
  if (!pokemon?.uuid || !(pokemon.currentHp > 0)) return {shield:false,clone:false};
  return {shield:Boolean(pokemon.__battle?.protect),clone:Number(pokemon.__battle?.substituteHp)>0};
}
export function moveConnected(result) { return !result || !(result.success === false || result.missed || result.immune || result.blocked || result.effectiveness === 0); }

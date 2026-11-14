<template>
 <svg class="poke-ball-visual" :class="{'is-open':opened,'is-corrupt':type.startsWith('corrupted_ball_')}" :style="palette" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
  <defs><radialGradient :id="'cap-'+uid" cx="33%" cy="20%" r="90%"><stop stop-color="var(--ball-light)"/><stop offset="1" stop-color="var(--ball-dark)"/></radialGradient><radialGradient :id="'base-'+uid" cx="32%" cy="20%" r="95%"><stop stop-color="#fffef8"/><stop offset=".62" stop-color="#e4edf1"/><stop offset="1" stop-color="#91a8b9"/></radialGradient></defs>
  <ellipse class="ball-inner" cx="32" cy="32" rx="22" ry="15" fill="var(--ball-aura)"/>
  <g class="ball-cap"><path d="M7 32a25 25 0 0 1 50 0Z" :fill="'url(#cap-'+uid+')'" stroke="#243a4b" stroke-width="2.5" stroke-linejoin="round"/>
   <g v-if="type==='master_ball'" fill="var(--ball-accent)"><ellipse cx="16" cy="21" rx="6" ry="8"/><ellipse cx="48" cy="21" rx="6" ry="8"/></g>
   <g v-if="type==='repeat_ball'" fill="none" stroke="var(--ball-accent)" stroke-width="3"><circle cx="20" cy="21" r="5"/><circle cx="44" cy="21" r="5"/></g>
   <circle v-if="type==='dusk_ball'" cx="32" cy="19" r="8" fill="var(--ball-accent)"/>
   <path v-if="mark" :d="mark" fill="none" :stroke="type==='master_ball'?'#fff5ff':'var(--ball-accent)'" :stroke-width="type==='net_ball'?1.5:3" stroke-linejoin="round"/>
   <path d="M15 20q5-8 12-9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".65"/>
  </g>
  <g class="ball-base"><path d="M7 32a25 25 0 0 0 50 0Z" :fill="'url(#base-'+uid+')'" stroke="#243a4b" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 41q9 14 25 12" fill="none" stroke="#fff" stroke-width="1.5" opacity=".6"/></g>
  <g class="ball-lock"><path d="M8 32h48" stroke="#243a4b" stroke-width="4.5"/><circle cx="32" cy="32" r="8" fill="#e8f2f7" stroke="#243a4b" stroke-width="2.5"/><circle cx="32" cy="32" r="4.5" fill="#faffff" stroke="#8daec1" stroke-width="1.5"/><circle cx="31" cy="30" r="1.3" fill="#fff"/></g>
 </svg>
</template>
<script>
import {pokeBallStyle,ballMark} from '@/services/pokeBallStyle';
export default{props:{type:{type:String,default:'pokeball'},opened:Boolean},computed:{uid(){return this._uid;},palette(){return pokeBallStyle(this.type);},mark(){return ballMark(this.type);}}};
</script>
<style scoped>
.poke-ball-visual{display:block;width:100%;height:100%;overflow:visible}.ball-cap,.ball-base,.ball-lock{transform-origin:32px 32px;transition:transform .14s ease-out,opacity .12s}.ball-inner{opacity:0;transition:opacity .12s}.is-open .ball-cap{transform:translateY(-8px) rotate(-10deg)}.is-open .ball-base{transform:translateY(7px) rotate(6deg)}.is-open .ball-lock{opacity:0;transform:scale(.6)}.is-open .ball-inner{opacity:.95}.is-corrupt{filter:drop-shadow(0 0 3px var(--ball-accent))}
</style>

<template>
 <div class="raid-field-effects" :class="{'is-still':reduced}" aria-hidden="true">
  <div v-if="state.terrain.kind" class="raid-field-terrain" :data-raid-terrain="state.terrain.kind"/>
  <battle-field-effects :state="state" :changes="[]" :nonce="0" language="fr" :animations-enabled="!reduced"/>
  <div v-for="side in ['player','opponent']" :key="side" class="raid-field-side" :class="'raid-field-'+side" :data-raid-field-side="side">
   <battle-field-side :state="remainingState" :side="side" :pokemon="{}" :changes="[]" :nonce="0" :animations-enabled="!reduced"/>
   <svg v-for="screen in ['reflect','lightScreen']" :key="screen" v-show="state.sides[side].screens[screen+'Turns']" class="raid-field-screen" :class="'raid-screen-'+screen" :data-raid-screen="state.sides[side].screens[screen+'Turns']?screen:null" viewBox="0 0 240 140">
    <path d="M32 125V34L116 14L207 33V125L116 106Z M116 14V106"/><path class="raid-screen-glint" d="M45 71L94 27M137 91L194 47"/>
   </svg>
  </div>
 </div>
</template>
<script>
import BattleFieldEffects from '../battle/BattleFieldEffects.vue';
import BattleFieldSide from '../battle/BattleFieldSide.vue';
import {raidFieldModel} from '@/services/raidField';
export default{components:{BattleFieldEffects,BattleFieldSide},props:{frame:Object,reduced:Boolean},computed:{
 state(){return raidFieldModel(this.frame);},
 remainingState(){const state=raidFieldModel(this.frame);for(const side of Object.values(state.sides)){side.screens.reflectTurns=0;side.screens.lightScreenTurns=0;}return state;}
}};
</script>
<style scoped>
.raid-field-effects{position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden}.raid-field-side{position:absolute;width:49%;height:42%;left:-1%;bottom:1%}.raid-field-opponent{left:auto;right:-1%;bottom:29%;width:44%;height:40%}.raid-field-side ::v-deep .battle-field-side{position:absolute;inset:0;width:100%;height:100%}.raid-field-side ::v-deep .field-side-art{left:0;bottom:0;width:100%;height:100%;transform:none}.raid-field-effects ::v-deep .field-hud{display:none}.raid-field-screen{position:absolute;inset:0;width:100%;height:100%;overflow:visible;color:#a4cfff;fill:currentColor;fill-opacity:.08;stroke:currentColor;stroke-width:1.4;stroke-linejoin:round;stroke-linecap:round;opacity:.75}.raid-screen-lightScreen{color:#ffe3a4;translate:14px -8px}.raid-screen-glint{fill:none;stroke-width:3;opacity:.5;animation:raid-screen-light 3.6s ease-in-out infinite alternate}.raid-field-terrain{position:absolute;inset:45% 0 0;background:linear-gradient(0deg,#d7b06824,transparent)}[data-raid-terrain=electric_terrain]{background:repeating-linear-gradient(106deg,transparent 0 68px,#e8d47719 70px 73px),linear-gradient(0deg,#e8d47728,transparent)}[data-raid-terrain=grassy_terrain]{background:linear-gradient(0deg,#89c99735,transparent)}[data-raid-terrain=misty_terrain]{background:linear-gradient(0deg,#e3bae93d,transparent)}[data-raid-terrain=psychic_terrain]{background:linear-gradient(0deg,#b995e73d,transparent)}
@keyframes raid-screen-light{to{opacity:.15;translate:3px -2px}}.is-still *{animation:none!important}@media(prefers-reduced-motion:reduce){*{animation:none!important}}@media(max-width:700px){.raid-field-player{width:56%;height:42%;left:-5%}.raid-field-opponent{width:48%;right:-1%;bottom:31%;height:39%}.raid-screen-lightScreen{translate:8px -5px}}
</style>

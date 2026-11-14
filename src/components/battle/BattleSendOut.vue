<template>
 <div class="battle-send-out" :class="['send-out-'+side,{'is-recall':recall}]" :style="palette" data-battle-send-out :data-side="side" aria-hidden="true">
  <poke-ball-visual class="send-out-ball" :type="ballType" :opened="opened"/>
  <span ref="flash" class="send-out-flash" @animationstart="emerge" @webkitAnimationStart="emerge"/>
  <span class="send-out-orbit"/>
  <i v-for="n in 12" :key="n" :style="{'--ray':n,'--reach':(32+n%3*9)+'px'}"/>
 </div>
</template>
<script>
import PokeBallVisual from './PokeBallVisual.vue';
import {pokeBallStyle} from '@/services/pokeBallStyle';
import {ENTRY_BLOOM_DELAY} from '@/services/battleSamples';
export default{name:'BattleSendOut',components:{PokeBallVisual},props:{side:{type:String,default:'player'},ballType:{type:String,default:'pokeball'},recall:Boolean},data:()=>({opened:false}),computed:{palette(){return {...pokeBallStyle(this.ballType),'--bloom-delay':ENTRY_BLOOM_DELAY+'s'};}},
 mounted(){if(!this.recall){this.$emit('schedule',{delay:ENTRY_BLOOM_DELAY});this._frame=requestAnimationFrame(this.followBloom);}},beforeDestroy(){this._closed=true;cancelAnimationFrame(this._frame);},
 methods:{
  emerge(){if(this._closed||this._emerged||this.recall)return;this._emerged=true;cancelAnimationFrame(this._frame);this.opened=true;this.$emit('emerge');},
  followBloom(time){
   if(this._closed||this._emerged)return;this._firstFrame ??= time;
   // WebKit can omit animationstart on a freshly inserted composite layer.
   // Follow the actual CSS animation clock, with a bounded legacy fallback.
   this._bloom ||= this.$refs.flash?.getAnimations?.().find(a=>a.animationName?.startsWith('send-out-bloom'));
   if((this._bloom?.currentTime||0)>=340||time-this._firstFrame>=360){this.emerge();return;}
   this._frame=requestAnimationFrame(this.followBloom);
  }
 }};
</script>
<style scoped>
.battle-send-out{position:absolute;width:110px;height:110px;transform:translate(-50%,-50%);z-index:58;pointer-events:none;--throw-x:-110px;--throw-y:85px}.send-out-wild{--throw-x:110px;--throw-y:-85px}.send-out-ball{position:absolute;left:calc(50% - 17px);top:calc(50% - 17px);width:34px;height:34px;animation:send-out-throw .48s cubic-bezier(.18,.62,.35,1) both;filter:drop-shadow(0 3px 2px #1235)}.send-out-flash{position:absolute;inset:8%;border-radius:50%;background:radial-gradient(ellipse,#fff 0%,var(--ball-aura) 22%,transparent 65%);animation:send-out-bloom .46s var(--bloom-delay) ease-out both}.send-out-orbit{position:absolute;inset:8%;border-radius:50%;border:2px solid var(--ball-aura);animation:send-out-orbit .45s .35s ease-out both}i{position:absolute;left:calc(50% - 2px);top:calc(50% - 2px);width:4px;height:7px;background:var(--ball-aura);border-radius:3px;animation:send-out-ray .45s .35s ease-out both;--angle:calc(var(--ray) * 30deg)}
@keyframes send-out-throw{0%{transform:translate(var(--throw-x),var(--throw-y)) rotate(-250deg) scale(.6);opacity:0}15%{opacity:1}55%{transform:translate(-15px,-38px) rotate(40deg) scale(1)}78%{transform:translate(0,0) rotate(145deg);opacity:1}100%{transform:translate(0,0) rotate(180deg) scale(.5);opacity:0}}
@keyframes send-out-bloom{0%{transform:scale(.12);opacity:0}25%{opacity:.95}100%{transform:scale(1.25);opacity:0}}@keyframes send-out-orbit{from{transform:scale(.15,.3);opacity:.8}to{transform:scale(1.5,.65);opacity:0}}@keyframes send-out-ray{0%{transform:rotate(var(--angle)) translateX(4px) scale(.5);opacity:0}20%{opacity:.95}100%{transform:rotate(var(--angle)) translateX(var(--reach)) scale(.1);opacity:0}}
.is-recall .send-out-ball{display:none}.is-recall .send-out-flash{animation:send-out-bloom .45s reverse both}.is-recall .send-out-orbit{animation:send-out-orbit .45s reverse both}.is-recall i{animation:send-out-ray .45s reverse both}
@media(prefers-reduced-motion:reduce){.battle-send-out{display:none}}
</style>

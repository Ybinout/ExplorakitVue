<template>
  <div v-if="info" ref="root" class="battle-weather-anchor" data-battle-weather-info @pointerenter="enter" @pointerleave="leave" @focusout="blur" @keydown.esc.stop.prevent="dismiss">
    <button ref="trigger" class="battle-weather-indicator" :class="`battle-weather-${weather}`" :data-battle-weather="weather" :aria-label="`${info.name} · ${english?'Weather effects':'Effets de la météo'}`" :aria-expanded="String(open)" :aria-describedby="open?'battle-weather-description':null" aria-controls="battle-weather-description" @focus="show" @click.stop="click" @pointerup.stop="pointerUp" @pointerdown.stop>
      <journal-icon :name="`weather-${weather}`" />
    </button>
    <div v-if="open" id="battle-weather-description" class="weather-description" role="tooltip" :style="bounds">
      <header><strong>{{ info.name }}</strong><small v-if="duration">{{ duration }}</small></header>
      <ul><li v-for="effect in info.effects" :key="effect">{{ effect }}</li></ul>
      <p>{{ info.note }}</p>
      <span class="weather-dismiss-hint">{{ english?'Tap the icon again or outside to close.':'Retouche l’icône ou touche à côté pour fermer.' }}</span>
    </div>
  </div>
</template>
<script>
import JournalIcon from '../menu/JournalIcon.vue';
import {battleWeatherInfo,battleWeatherDuration} from '@/services/battleWeatherInfo';
export default {
 components:{JournalIcon},props:{weather:String,metadata:{type:Object,default:()=>({})},language:{type:String,default:'fr'}},
 data:()=>({open:false,pinned:false,bounds:{}}),
 computed:{english(){return this.language==='en';},info(){return battleWeatherInfo(this.weather,this.language);},duration(){return battleWeatherDuration(this.metadata,this.language);}},
 watch:{weather(){this.dismiss();}},
 mounted(){this.outside=e=>{if(this.open&&!this.$refs.root?.contains(e.target))this.dismiss();};this.escape=e=>{if(this.open&&e.key==='Escape'){this.dismiss();e.stopPropagation();}};this.visibility=()=>{if(document.hidden)this.dismiss();};this.resize=()=>{if(this.open)this.measure();};document.addEventListener('pointerdown',this.outside,true);document.addEventListener('keydown',this.escape);document.addEventListener('visibilitychange',this.visibility);window.addEventListener('resize',this.resize,{passive:true});},
 beforeDestroy(){clearTimeout(this.closeTimer);document.removeEventListener('pointerdown',this.outside,true);document.removeEventListener('keydown',this.escape);document.removeEventListener('visibilitychange',this.visibility);window.removeEventListener('resize',this.resize);},
 methods:{
  measure(){const scene=this.$el.closest('.battle-scene')?.getBoundingClientRect(),trigger=this.$refs.trigger?.getBoundingClientRect();if(!scene||!trigger)return;this.bounds={'--weather-info-width':`${Math.min(300,scene.width-20)}px`,'--weather-info-height':`${Math.max(80,scene.bottom-trigger.bottom-14)}px`};},
  show(){clearTimeout(this.closeTimer);this.measure();this.open=true;},
  enter(e){if(e.pointerType!=='touch')this.show();},
  leave(e){if(e.pointerType==='touch')return;clearTimeout(this.closeTimer);if(!this.pinned)this.closeTimer=setTimeout(()=>{if(!this.pinned)this.open=false;},160);},
  pointerUp(e){if(e.pointerType==='touch'||e.pointerType==='pen'){this.ignoreClickUntil=Date.now()+750;this.toggle();}},
  click(e){if(e.detail>0&&Date.now()<(this.ignoreClickUntil||0))return;this.toggle();},
  toggle(){if(this.pinned)this.dismiss();else{this.pinned=true;this.show();}},
  blur(e){if(!this.pinned&&!this.$refs.root?.contains(e.relatedTarget))this.dismiss();},
  dismiss(){clearTimeout(this.closeTimer);this.open=false;this.pinned=false;}
 }
};
</script>
<style scoped>
.battle-weather-anchor{position:absolute;z-index:90;top:8px;right:8px;text-align:left;font-family:var(--journal-font,Arial,sans-serif)}
button.battle-weather-indicator{position:relative;display:grid;place-items:center;width:44px;height:44px;min-height:44px;padding:8px;border:1px solid #96b8cb;border-radius:10px;background:#19384df2;color:#b5e0f8;box-shadow:0 2px 0 #10263460;cursor:help;touch-action:manipulation}
.battle-weather-indicator .journal-icon{width:25px;height:25px}.battle-weather-indicator:focus-visible{outline:3px solid #fff0b9;outline-offset:2px}.battle-weather-indicator[aria-expanded=true]{background:#28546b;border-color:#def0f8}.battle-weather-sun{color:#f6d580!important;border-color:#d6bc7b!important}.battle-weather-sandstorm{color:#efd19e!important;border-color:#c3aa7e!important}.battle-weather-hail{color:#e2f6ff!important}
.weather-description{position:absolute;right:0;top:50px;width:var(--weather-info-width,280px);max-height:min(340px,var(--weather-info-height,340px));box-sizing:border-box;overflow:auto;overscroll-behavior:contain;touch-action:pan-y;padding:14px 15px;border:1px solid var(--journal-border,#abc7d9);border-radius:12px;background:var(--journal-paper,#edf5fc);color:var(--journal-ink,#253f50);box-shadow:0 8px 26px #0005;font-size:12px;line-height:1.55}
.weather-description header{padding:0 0 10px;border-bottom:1px solid var(--journal-border,#abc7d9);display:flex;flex-direction:column;gap:4px}.weather-description strong{font-size:16px;color:var(--journal-heading,#244c66)}.weather-description small{font-size:10px;color:var(--journal-muted,#526d80)}.weather-description ul{padding-left:15px;margin:11px 0}.weather-description li{margin:8px 0}.weather-description p{font-size:11px;color:var(--journal-muted,#526d80);margin:10px 0 0}.weather-dismiss-hint{display:block;font-size:10px;color:var(--journal-muted,#526d80);padding-top:10px}
</style>

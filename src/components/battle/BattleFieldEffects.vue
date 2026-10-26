<template>
  <div class="battle-field-effects" :class="{'field-still':!animationsEnabled}">
    <div class="field-ground" aria-hidden="true">
      <div v-if="state.field.trickRoomTurns || state.field.wonderRoomTurns || state.field.magicRoomTurns" class="field-room-grid" :class="{'field-room-gold':state.field.wonderRoomTurns,'field-room-rose':state.field.magicRoomTurns}" />
      <div v-if="state.field.gravityTurns" class="field-gravity"><i v-for="i in 7" :key="i" :style="{left:`${i*13}%`}">↓</i></div>
      <div v-if="state.field.mudSportTurns" class="field-mud" />
      <div v-if="state.field.waterSportTurns" class="field-water" />
      <div v-if="state.field.ionDelugeTurns" class="field-ion" />
      <div v-if="state.field.fairyLockTurns" class="field-lock" />
    </div>
    <div v-if="changes.length" :key="nonce" class="field-change-art" aria-hidden="true"><span v-for="e in changes" :key="e.id" :class="['field-change-flash',`field-change-${e.kind}`,{'field-change-end':e.change==='end'}]" :style="{'--field-color':e.color}" /></div>
    <p v-if="changes.length" :key="`notice-${nonce}`" class="field-change-notice" role="status">{{ changeLabel }}</p>
    <div v-if="entries.length" class="field-hud" @keydown.esc.stop="expanded=false">
      <button class="field-hud-toggle" type="button" :aria-expanded="String(expanded)" aria-controls="battle-field-info" @click="expanded=!expanded"><span aria-hidden="true">▧</span> {{ language==='en'?'Field effects':'Terrain' }} · {{ entries.length }}</button>
      <section v-if="expanded" id="battle-field-info" class="field-info" :aria-label="language==='en'?'Active field effects':'Effets de terrain actifs'">
        <div v-for="e in entries" :key="e.id" :data-field-effect="e.id" class="field-info-row" :style="{'--field-color':e.color}"><strong>{{ e.name }} <b>{{ e.duration }}{{ e.layers?'':language==='en'?' turns':' tours' }}</b></strong><small>{{ e.scopeLabel }}</small><p>{{ e.description }}</p></div>
      </section>
    </div>
  </div>
</template>
<script>
import { battleFieldEntries } from '@/services/battleField';
export default {
  props:{state:Object,changes:Array,nonce:Number,language:String,animationsEnabled:Boolean},
  data:()=>({expanded:false}),
  computed:{entries(){return battleFieldEntries(this.state,this.language);},changeLabel(){return this.changes.slice(0,2).map(e=>`${e.scope==='player'?'Votre camp · ':e.scope==='opponent'?'Camp adverse · ':''}${e.name}${e.change==='end'?' terminé':e.layers&&e.value>1?` ×${e.value}`:''}`).join(' — ');}},
  watch:{entries(value){if(!value.length)this.expanded=false;}}
};
</script>
<style scoped>
.battle-field-effects{position:absolute;inset:0;pointer-events:none}.field-ground{position:absolute;inset:0;overflow:hidden;z-index:3}.field-room-grid{position:absolute;inset:28% -15% -40%;background-image:linear-gradient(#c3a0fa44 1px,transparent 1px),linear-gradient(90deg,#c3a0fa44 1px,transparent 1px);background-size:48px 48px;transform:perspective(350px) rotateX(53deg);transform-origin:50% 80%;opacity:.6;animation:field-room-open .65s ease-out both}.field-room-gold{filter:hue-rotate(150deg)}.field-room-rose{filter:hue-rotate(35deg)}.field-gravity{position:absolute;inset:35% 0 7%;color:#ddc29766}.field-gravity i{position:absolute;bottom:0;font:bold 28px sans-serif;font-style:normal;animation:field-gravity-set .6s ease-out both}.field-mud{position:absolute;inset:60% 0 0;background:repeating-linear-gradient(168deg,transparent 0 22px,#98765d17 23px 37px)}.field-water{position:absolute;inset:50% 0 0;background:repeating-linear-gradient(174deg,transparent 0 24px,#99d9ee1a 26px 29px)}.field-ion{position:absolute;inset:0;background:linear-gradient(110deg,transparent 45%,#f4e48822 46%,transparent 47%,transparent 65%,#f4e48822 66%,transparent 67%)}.field-lock{position:absolute;inset:0;border:3px dashed #edbce033}
.field-change-art{position:absolute;inset:0;overflow:hidden;z-index:54}.field-change-flash{position:absolute;inset:45% 0 0;background:linear-gradient(0deg,var(--field-color),transparent);opacity:0;animation:field-arrive .7s ease-out both}.field-change-end{animation-name:field-clear}.field-change-rock,.field-change-spikes,.field-change-toxic,.field-change-web,.field-change-screen,.field-change-wind,.field-change-mist,.field-change-chant{display:none}.field-change-notice{position:absolute;z-index:60;left:50%;top:32%;transform:translateX(-50%);max-width:88%;margin:0;padding:7px 12px;border:1px solid #b9d6e4;border-radius:6px;background:#142d40ed;color:#f1f8fe;text-align:center;font-size:12px;line-height:1.4;animation:field-caption 1.3s ease-out both}
.field-hud{position:absolute;z-index:61;right:10px;top:52px;pointer-events:auto;max-width:calc(100% - 20px)}.field-hud-toggle{display:flex;gap:6px;align-items:center;margin-left:auto;border:1px solid var(--journal-border,#96b8cb);background:var(--journal-card,#19384d);color:var(--journal-ink,#d9edfa);border-radius:7px;padding:6px 9px;font-size:11px;cursor:pointer}.field-hud-toggle:focus-visible{outline:2px solid #a6dfff;outline-offset:2px}.field-info{width:min(290px,calc(100vw - 42px));max-height:45vh;overflow:auto;margin-top:5px;background:var(--journal-card,#19384d);color:var(--journal-ink,#d9edfa);border:1px solid var(--journal-border,#96b8cb);border-radius:7px;box-shadow:0 4px 14px #061b3355;padding:10px}.field-info-row{border-left:3px solid var(--field-color);padding:2px 0 2px 9px;margin-bottom:10px;font-size:11px}.field-info-row:last-child{margin-bottom:0}.field-info-row strong{display:flex;justify-content:space-between;gap:7px}.field-info-row b{font-size:10px;white-space:nowrap}.field-info-row small{opacity:.7}.field-info-row p{margin:4px 0 0;font-size:11px;line-height:1.45}
@keyframes field-room-open{from{opacity:0}to{opacity:.6}}@keyframes field-gravity-set{from{translate:0 -30px;opacity:0}to{translate:0 0;opacity:1}}@keyframes field-arrive{0%{opacity:0;transform:translateY(20%)}35%{opacity:.16}100%{opacity:0;transform:translateY(0)}}@keyframes field-clear{from{opacity:.12}to{opacity:0}}@keyframes field-caption{0%{opacity:0}10%,75%{opacity:1}100%{opacity:0}}
.field-still .field-ground *,.field-still .field-change-art{animation:none!important}.field-still .field-change-art{display:none}.field-still .field-change-notice{animation:none;display:none}@media(prefers-reduced-motion:reduce){.field-ground *{animation:none!important}.field-change-art,.field-change-notice{display:none}}
@media(max-width:540px){.field-hud-toggle{font-size:10px;padding:5px 7px}.field-change-notice{font-size:11px;top:29%}.field-info{max-height:40vh}}
</style>

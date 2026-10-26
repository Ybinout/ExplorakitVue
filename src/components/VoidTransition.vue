<template>
  <div class="void-transition" :class="[flight.phase,{reduced}]" :style="{'--void-x':`${flight.origin?.x??50}%`,'--void-y':`${flight.origin?.y??50}%`}" data-void-transition aria-busy="true" role="status" aria-label="Passage">
    <div class="void-cover"></div><div class="void-mouth"><i></i><i></i><i></i></div>
    <span v-if="flight.phase==='loading'" class="void-wait" aria-label="Chargement">· · ·</span>
  </div>
</template>
<script>export default {props:{flight:{type:Object,required:true},reduced:Boolean}};</script>
<style scoped>
.void-transition{position:absolute;inset:0;z-index:38;overflow:hidden;pointer-events:auto;background:transparent}
.void-cover{position:absolute;inset:0;background:#030207;opacity:0}.loading .void-cover{opacity:1}.departure .void-cover{animation:void-cover .65s ease-in both}.arrival .void-cover{animation:void-uncover .65s ease-out both}
.void-mouth{position:absolute;left:var(--void-x,50%);top:var(--void-y,50%);width:32vmin;height:32vmin;transform:translate(-50%,-50%);border-radius:50%;background:#020105;box-shadow:0 0 9px 3px #74618799,inset 0 0 18px #75658d;animation:void-open .65s ease-in both}
.void-mouth i{position:absolute;inset:-6%;border:2px solid #8d7baf66;border-radius:40% 60% 48% 52%;animation:void-spin 2s linear infinite}.void-mouth i:nth-child(2){inset:-12%;opacity:.6;animation-direction:reverse}.void-mouth i:nth-child(3){inset:9%;opacity:.45;animation-duration:1s}
.arrival .void-mouth{animation:void-close .65s ease-out both}.loading .void-mouth{opacity:0}.void-wait{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:#b4a4c7;font:26px var(--journal-font);letter-spacing:8px}
@keyframes void-cover{from{opacity:0}to{opacity:1}}@keyframes void-uncover{from{opacity:1}to{opacity:0}}@keyframes void-open{from{scale:.08;opacity:0}to{scale:5;opacity:1}}@keyframes void-close{from{scale:5;opacity:1}to{scale:.02;opacity:0}}@keyframes void-spin{to{rotate:360deg}}
.reduced .void-mouth{display:none}.reduced .void-cover{animation:none}.reduced.loading .void-cover{opacity:1}
@media(prefers-reduced-motion:reduce){.void-mouth{display:none}.void-cover{animation:none!important}}
</style>

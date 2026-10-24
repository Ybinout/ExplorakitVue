<template>
  <div class="flight-transition" :class="[flight.phase, {reduced}]" data-flight-transition role="status" aria-live="polite">
    <div class="flight-veil"></div>
    <div class="flight-caption">
      <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 26 43 7 29 43l-7-14Z"/><path d="m22 29 21-22"/></svg>
      <strong>{{ flight.phase === 'arrival' ? (en ? 'Arrival' : 'Arrivée') : (en ? 'Flight Module' : 'Module Vol') }}</strong>
      <span>{{ flight.label }}</span>
      <span v-if="flight.phase === 'loading'" class="flight-dots">{{ en ? 'Travelling…' : 'Voyage en cours…' }}</span>
    </div>
  </div>
</template>
<script>
export default {props:{flight:{type:Object,required:true},reduced:Boolean,language:String},computed:{en(){return this.language==='en';}}};
</script>
<style scoped>
.flight-transition{position:absolute;inset:0;z-index:38;pointer-events:auto;color:#edf7ff;text-align:center;overflow:hidden}
.flight-veil{position:absolute;inset:0;background:linear-gradient(140deg,#142d46,#355c70);opacity:0}
.departure .flight-veil{animation:flight-cover .65s ease-in both}.loading .flight-veil{opacity:1}.arrival .flight-veil{animation:flight-uncover .65s ease-out both}
.flight-caption{position:absolute;left:50%;top:30%;transform:translate(-50%,-50%);display:grid;justify-items:center;gap:8px;padding:18px 28px;min-width:160px;border:1px solid #c8e4ee55;border-radius:18px;background:#142c40e8;font:14px var(--journal-font);box-shadow:0 10px 32px #071d2640}
.flight-caption svg{width:34px;fill:#d1e7ed;stroke:#6e9eae;stroke-width:2}.flight-caption strong{font-size:18px}.flight-dots{font-size:12px;color:#bcd4df}.arrival .flight-caption{animation:flight-uncover .65s ease-out both}
@keyframes flight-cover{0%{opacity:0}55%{opacity:.1}100%{opacity:1}}@keyframes flight-uncover{from{opacity:1}to{opacity:0}}
.reduced .flight-veil,.reduced .flight-caption{animation:none}.reduced.loading .flight-veil{opacity:1}
@media(prefers-reduced-motion:reduce){.flight-veil,.flight-caption{animation:none!important}.loading .flight-veil{opacity:1}}
</style>

<template>
  <div class="battle-entrance" :class="{ 'is-revealing': phase === 'revealing', 'is-reduced': reducedMotion }" data-battle-entrance :data-phase="phase" role="status" aria-live="polite" @pointerdown.stop.prevent @pointerup.stop.prevent @click.stop.prevent>
    <div class="entrance-shutter entrance-shutter-top" aria-hidden="true"></div>
    <div class="entrance-shutter entrance-shutter-bottom" aria-hidden="true"></div>
    <div class="entrance-caption">
      <svg class="entrance-ball" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><circle cx="24" cy="24" r="20"/><path d="M4 24h13m14 0h13"/><circle cx="24" cy="24" r="7"/></svg>
      <span>{{ language === 'en' ? 'Battle starting' : 'Un combat commence' }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BattleEntrance',
  props: { phase: { type: String, required: true }, language: { type: String, default: 'fr' }, reducedMotion: Boolean }
};
</script>

<style scoped>
.battle-entrance { position:absolute; inset:0; z-index:100; overflow:hidden; touch-action:none; color:#edf5fc; font:700 14px Arial,Helvetica,sans-serif; }
.entrance-shutter { position:absolute; left:0; right:0; height:calc(50% + 1px); background:#17394c; transition:transform .42s cubic-bezier(.65,0,.3,1); will-change:transform; }
.entrance-shutter-top { top:0; border-bottom:2px solid #96b7cd; }
.entrance-shutter-bottom { bottom:0; border-top:2px solid #96b7cd; }
.entrance-caption { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; transition:opacity .15s ease; }
.entrance-caption span { background:#17394c; padding:8px 14px; }
.entrance-ball { width:48px; height:48px; background:#17394c; border-radius:50%; outline:8px solid #17394c; animation:entrance-ball-in .4s ease-out both; }
.is-revealing .entrance-shutter-top { transform:translateY(-101%); }
.is-revealing .entrance-shutter-bottom { transform:translateY(101%); }
.is-revealing .entrance-caption { opacity:0; }
@keyframes entrance-ball-in { from { transform:scale(.75); opacity:0; } to { transform:scale(1); opacity:1; } }
.is-reduced .entrance-shutter,.is-reduced .entrance-caption { transition:none; }
.is-reduced .entrance-ball { animation:none; }
@media(prefers-reduced-motion:reduce) { .entrance-shutter,.entrance-caption { transition:none; } .entrance-ball { animation:none; } }
</style>

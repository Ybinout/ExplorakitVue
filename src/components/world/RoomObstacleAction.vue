<template>
  <div class="room-obstacle-action" role="status" aria-live="polite">
    <span class="room-obstacle-label">{{ language === 'en' ? 'Clearing the boards…' : action.message }}</span>
    <span class="room-obstacle-track" aria-hidden="true"><i :style="{ animationDuration: `${action.duration}ms` }"></i></span>
  </div>
</template>
<script>
export default { props: { action: { type: Object, required: true }, language: { type: String, default: 'fr' } } };
</script>
<style scoped>
.room-obstacle-action { position:absolute; z-index:25; left:50%; bottom:16px; transform:translateX(-50%); width:min(360px,calc(100% - 32px)); padding:12px 14px; border:2px solid #74849b; border-radius:4px; background:#182639f2; color:#f0e4d3; box-shadow:0 4px 0 #0b1224aa; font:13px/1.5 Arial,sans-serif; pointer-events:none; }
.room-obstacle-label { display:block; min-height:2.8em; }
.room-obstacle-track { display:block; height:5px; background:#394559; margin-top:6px; overflow:hidden; }
.room-obstacle-track i { display:block; width:100%; height:100%; background:#c1a881; transform-origin:left; animation:clearing-progress linear both; }
@keyframes clearing-progress { from { transform:scaleX(0); } to { transform:scaleX(1); } }
@media (prefers-reduced-motion:reduce) { .room-obstacle-track i { animation:none; } }
</style>

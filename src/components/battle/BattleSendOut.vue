<template>
  <div class="battle-send-out" :class="`send-out-${side}`" data-battle-send-out :data-side="side" aria-hidden="true">
    <svg class="send-out-ball" viewBox="0 0 48 48"><path d="M4 24a20 20 0 0 1 40 0Z" fill="#da5d50"/><path d="M4 24a20 20 0 0 0 40 0Z" fill="#edf5fc"/><circle cx="24" cy="24" r="20" fill="none" stroke="#18394b" stroke-width="3"/><path d="M4 24h40" stroke="#18394b" stroke-width="3"/><circle cx="24" cy="24" r="6" fill="#edf5fc" stroke="#18394b" stroke-width="3"/></svg>
    <span class="send-out-flash"></span>
    <i v-for="n in 8" :key="n" :style="{ '--ray': n }"></i>
  </div>
</template>

<script>
export default { name: 'BattleSendOut', props: { side: { type: String, required: true } } };
</script>

<style scoped>
.battle-send-out{position:absolute;width:96px;height:96px;transform:translate(-50%,-50%);z-index:58;pointer-events:none;--throw-x:-100px;--throw-y:80px}
.send-out-wild{--throw-x:100px;--throw-y:-100px}
.send-out-ball{position:absolute;left:calc(50% - 12px);top:calc(50% - 12px);width:24px;height:24px;animation:send-out-throw .38s ease-out both}
.send-out-flash{position:absolute;inset:8%;border:3px solid #b9edff;border-radius:50%;background:radial-gradient(circle,#fff 0%,#d1f4ffb3 30%,transparent 68%);animation:send-out-bloom .42s .32s ease-out both}
i{position:absolute;left:calc(50% - 2px);top:calc(50% - 2px);width:4px;height:4px;background:#e2faff;border-radius:50%;animation:send-out-ray .4s .34s ease-out both;--angle:calc(var(--ray) * 45deg)}
@keyframes send-out-throw{0%{transform:translate(var(--throw-x),var(--throw-y)) rotate(-210deg);opacity:0}25%{opacity:1}70%{transform:translate(0,-24px) rotate(60deg)}90%{opacity:1}100%{transform:translate(0,0) rotate(110deg);opacity:0}}
@keyframes send-out-bloom{from{transform:scale(.1);opacity:0}25%{opacity:1}to{transform:scale(1.4);opacity:0}}
@keyframes send-out-ray{from{transform:rotate(var(--angle)) translateX(8px);opacity:0}25%{opacity:1}to{transform:rotate(var(--angle)) translateX(56px);opacity:0}}
@media(prefers-reduced-motion:reduce){.battle-send-out{display:none}}
</style>

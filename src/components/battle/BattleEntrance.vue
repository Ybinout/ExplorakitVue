<template>
  <div class="battle-entrance" :class="{ 'is-revealing': phase === 'revealing', 'is-reduced': reducedMotion, 'is-arena': champion, 'is-story': champion && champion.story }" :style="champion ? { '--champion-accent': champion.accent } : null" data-battle-entrance :data-phase="phase" role="status" aria-live="polite" @pointerdown.stop.prevent @pointerup.stop.prevent @click.stop.prevent>
    <div class="entrance-shutter entrance-shutter-top" aria-hidden="true"></div>
    <div class="entrance-shutter entrance-shutter-bottom" aria-hidden="true"></div>
    <section v-if="champion" class="champion-intro" :class="{ 'portrait-ready': portraitReady }" data-arena-intro>
      <div class="champion-band" aria-hidden="true"></div>
      <div class="champion-art" aria-hidden="true">
        <span class="champion-emblem">VS</span>
        <img v-if="!portraitFailed" class="entrance-portrait" :src="champion.src" alt="" decoding="async" @load="onPortraitLoad" @error="portraitFailed = true" />
      </div>
      <div class="champion-heading">
        <p class="champion-eyebrow">{{ language === 'en' ? (champion.eyebrowEn || 'GYM CHALLENGE') : (champion.eyebrow || 'DÉFI D’ARÈNE') }}</p>
        <h2>{{ champion.name }}</h2>
        <p class="champion-city">{{ language === 'en' ? champion.cityEn : champion.city }}</p>
      </div>
      <div class="champion-footer"><span class="champion-loading" aria-hidden="true"></span><span>{{ language === 'en' ? 'The duel is about to begin' : 'Le duel va commencer' }}</span></div>
    </section>
    <div v-else class="entrance-caption">
      <svg class="entrance-ball" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><circle cx="24" cy="24" r="20"/><path d="M4 24h13m14 0h13"/><circle cx="24" cy="24" r="7"/></svg>
      <span>{{ language === 'en' ? 'Battle starting' : 'Un combat commence' }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BattleEntrance',
  props: { phase: { type: String, required: true }, language: { type: String, default: 'fr' }, reducedMotion: Boolean, champion: { type: Object, default: null } },
  data: () => ({ portraitReady: false, portraitFailed: false }),
  methods: {
    async onPortraitLoad(event) {
      const image = event.currentTarget;
      try { if (image.decode) await image.decode(); } catch { /* Keep the loaded illustration when decode is unsupported. */ }
      if (this._isDestroyed || this._isBeingDestroyed || this.phase !== 'holding') return;
      this.portraitReady = true;
      this.$emit('portrait-ready');
    }
  }
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
.is-story .champion-intro { background:linear-gradient(115deg,#151521 15%,#343044 80%); }
.is-story .champion-footer { background:#151521ed; }
/* Arena cards use the existing full-resolution dialogue illustrations. */
.is-arena .entrance-shutter { background:#102936; border-color:var(--champion-accent); }
.champion-intro { position:absolute; inset:0; overflow:hidden; transition:opacity .28s ease; background:linear-gradient(115deg,#0b202c 15%,#183e50 80%); }
.champion-band { position:absolute; width:72%; height:160%; top:-30%; right:-8%; transform:rotate(18deg); background:linear-gradient(90deg,transparent,rgba(164,213,231,.12)); border-left:1px solid var(--champion-accent); opacity:.65; }
.champion-band::after { content:''; position:absolute; inset:0; border-left:22px solid rgba(172,214,234,.05); }
.champion-art { position:absolute; right:0; bottom:7%; width:66%; height:88%; }
.champion-emblem { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font:italic 900 clamp(100px,20vw,240px)/1 Arial,sans-serif; color:var(--champion-accent); opacity:.08; }
.entrance-portrait { position:absolute; width:100%; height:100%; object-fit:contain; object-position:center bottom; opacity:0; filter:drop-shadow(0 14px 18px #06162088); }
.portrait-ready .entrance-portrait { opacity:1; animation:champion-arrive .75s cubic-bezier(.2,.75,.2,1) both; }
.champion-heading { position:absolute; top:24%; left:7%; right:52%; z-index:1; text-shadow:0 3px 20px #061620; animation:champion-title .5s ease-out both; }
.champion-eyebrow { margin:0 0 18px; color:var(--champion-accent); font:700 11px/1.4 Arial,sans-serif; letter-spacing:.2em; }
.champion-heading h2 { margin:0; color:#f1f7fc; font:700 clamp(40px,6vw,80px)/1.05 Georgia,serif; overflow-wrap:anywhere; }
.champion-city { display:inline-block; margin:20px 0 0; padding-top:14px; border-top:2px solid var(--champion-accent); font:500 15px/1.4 Arial,sans-serif; color:#d2e3ed; }
.champion-footer { position:absolute; z-index:2; bottom:0; left:0; right:0; min-height:48px; padding:12px 7%; box-sizing:border-box; display:flex; align-items:center; gap:12px; background:#0b202ce8; color:#b5cbd8; font:500 12px/1.4 Arial,sans-serif; }
.champion-loading { width:24px; height:2px; background:var(--champion-accent); animation:champion-pulse 1.2s ease-in-out infinite alternate; }
.is-revealing .champion-intro { opacity:0; }
@keyframes champion-arrive { from { opacity:0; transform:translateX(36px) scale(1.035); } to { opacity:1; transform:translateX(0) scale(1); } }
@keyframes champion-title { from { opacity:0; transform:translateX(-18px); } to { opacity:1; transform:translateX(0); } }
@keyframes champion-pulse { to { opacity:.3; transform:scaleX(.45); } }
@media(max-width:600px) and (orientation:portrait) {
  .champion-heading { top:8%; left:8%; right:8%; }
  .champion-heading h2 { font-size:clamp(44px,13vw,68px); }
  .champion-eyebrow { margin-bottom:10px; }
  .champion-city { margin-top:12px; padding-top:10px; font-size:14px; }
  .champion-art { bottom:8%; right:-3%; width:106%; height:64%; }
  .champion-band { width:80%; right:-20%; }
}
@media(max-height:420px) and (orientation:landscape) {
  .champion-heading { top:15%; }
  .champion-heading h2 { font-size:42px; }
  .champion-eyebrow { margin-bottom:10px; }
  .champion-city { margin-top:12px; padding-top:8px; }
  .champion-art { height:89%; bottom:9%; }
  .champion-footer { min-height:34px; padding-block:8px; }
}
.is-reduced .champion-intro { transition:none; }
.is-reduced .entrance-portrait,.is-reduced .champion-heading,.is-reduced .champion-loading { animation:none; }
@media(prefers-reduced-motion:reduce) {
  .champion-intro { transition:none; }
  .entrance-portrait,.champion-heading,.champion-loading { animation:none!important; }
}
</style>

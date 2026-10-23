<template>
  <div v-if="state" :class="['fishing-ui',{'is-offer':offer,'has-bite':state.phase==='bite'}]">
    <section v-if="offer" ref="dialog" class="fishing-card" role="dialog" aria-modal="true" aria-labelledby="fishing-title" @keydown.stop="keys">
      <header><bag-item-icon pocket="field" item-key="fishing_rod"/><div><small>AU BORD DE L’EAU</small><h2 id="fishing-title">Un coin pour pêcher</h2></div></header>
      <p>Tu veux lancer ta ligne ici ?</p><p class="fishing-help">Attends le <b>!</b>, puis appuie vite sur <strong>Action / A / Espace</strong> pour ferrer.</p>
      <footer><button @click="$emit('cancel')">Pas maintenant</button><button ref="yes" class="fishing-yes" @click="$emit('start')">Lancer la ligne</button></footer>
    </section>
    <div v-else class="fishing-status" role="status" aria-live="polite"><b>{{ label }}</b><span>{{ hint }}</span><button aria-label="Ranger la canne" @click="$emit('cancel')">×</button></div>
  </div>
</template>
<script>
import BagItemIcon from '../menu/BagItemIcon.vue';
export default {
  name:'FishingPrompt',components:{BagItemIcon},props:{state:Object},
  computed:{offer(){return this.state?.phase==='offer';},label(){return {casting:'La ligne est lancée…',waiting:'Ça va mordre…',bite:'Ça mord ! Action pour ferrer !',hooked:'Bien ferré !'}[this.state?.phase]||'';},hint(){return this.state?.phase==='bite'?'A · Espace · bouton Action':'Un déplacement range la canne.';}},
  watch:{offer:{immediate:true,handler(value){if(value)this.$nextTick(()=>this.$refs.yes?.focus({preventScroll:true}));}}},
  methods:{keys(e){if(e.key==='Escape'){e.preventDefault();this.$emit('cancel');}if(e.key==='Tab'){const buttons=[...this.$refs.dialog.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}}}
};
</script>
<style scoped>
.fishing-ui{position:absolute;z-index:34;top:90px;left:14px;right:14px;pointer-events:none;font-family:var(--journal-font)}
.fishing-ui.is-offer{inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:#0d253653;pointer-events:auto}
.fishing-card{width:360px;max-width:100%;overflow:hidden;border:2px solid var(--journal-border);border-radius:12px;background:var(--journal-paper);color:var(--journal-ink);box-shadow:0 6px 0 #10253445,0 14px 45px #00121c50}
header{display:flex;align-items:center;gap:12px;padding:19px 20px 15px;background:var(--journal-soft);border-bottom:1px solid var(--journal-border)}
small{font-size:9px;letter-spacing:1.4px;color:var(--journal-muted)}h2{font-size:20px;margin:4px 0 0}p{margin:18px 20px 10px;font-size:16px}.fishing-help{font-size:13px;line-height:1.65;margin-top:0;color:var(--journal-muted)}.fishing-help b{color:var(--journal-accent)}
footer{display:flex;gap:9px;padding:15px 20px 20px}button{border:1px solid var(--journal-border);border-radius:7px;padding:11px 12px;background:var(--journal-soft);color:var(--journal-ink);cursor:pointer;font:inherit;min-height:44px}.fishing-yes{background:var(--journal-accent);color:var(--journal-paper);font-weight:700;flex:1}button:focus-visible{outline:3px solid var(--journal-accent);outline-offset:3px}
.fishing-status{position:relative;max-width:320px;margin:auto;padding:10px 42px 10px 14px;border:1px solid var(--journal-border);border-radius:9px;background:var(--journal-paper);color:var(--journal-ink);box-shadow:0 3px 0 #10253430}.fishing-status b{display:block;font-size:14px}.fishing-status span{font-size:11px;color:var(--journal-muted)}.fishing-status button{pointer-events:auto;position:absolute;right:0;top:0;padding:0;width:40px;background:none;border:0;font-size:24px}.has-bite .fishing-status{border:2px solid var(--journal-accent)}
@media(max-width:480px){.fishing-ui{top:72px}.fishing-ui.is-offer{top:0}.fishing-card header{padding:16px}footer{padding:12px}.fishing-status b{font-size:13px}}
</style>

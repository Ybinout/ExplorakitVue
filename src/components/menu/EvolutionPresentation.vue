<template>
  <div class="evolution-backdrop" @mousedown.stop @pointerdown.stop @click.stop @keydown.stop="onKeydown" @keyup.stop>
    <section ref="dialog" class="evolution-sheet" :class="{ revealed, still: reducedMotion }" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="evolution-title" aria-describedby="evolution-description">
      <small>UN NOUVEAU CHAPITRE</small>
      <h2 id="evolution-title">{{ revealed ? 'Évolution réussie !' : 'Ton Pokémon évolue…' }}</h2>
      <div class="evolution-stage" aria-hidden="true">
        <div class="evolution-orbit"></div><div class="evolution-halo"></div>
        <img v-if="!failedBefore" class="evolution-before" :src="sprite(evolution.from)" alt="" @error="failedBefore = true">
        <img v-if="!failedAfter" class="evolution-after" :src="sprite(evolution.to)" alt="" @error="failedAfter = true">
        <span v-if="revealed && failedAfter" class="evolution-fallback">✦</span>
        <span class="evolution-spark spark-one">✦</span><span class="evolution-spark spark-two">✧</span><span class="evolution-spark spark-three">✦</span>
      </div>
      <p id="evolution-description" aria-live="polite">{{ revealed ? `${evolution.fromName} a évolué en` : `${evolution.fromName} se transforme…` }}<strong v-if="revealed">{{ evolution.toName }}</strong></p>
      <p class="evolution-note">{{ revealed ? 'Son aventure continue avec toi.' : 'Une nouvelle force s’éveille.' }}</p>
      <button ref="action" type="button" data-evolution-continue :disabled="busy" @click="advance">{{ busy ? 'Sauvegarde…' : revealed ? (remaining > 1 ? 'Évolution suivante' : 'Continuer') : cancellable ? 'Poursuivre l’évolution' : 'Passer l’animation' }}<span aria-hidden="true"> →</span></button>
      <button v-if="cancellable && !revealed" class="evolution-cancel" data-evolution-cancel :disabled="busy" @click="cancel">Annuler l’évolution</button>
      <p v-if="error" class="evolution-error" role="alert">{{ error }}</p>
      <small v-if="remaining > 1" class="evolution-count">Encore {{ remaining - 1 }} évolution{{ remaining > 2 ? 's' : '' }} à découvrir</small>
    </section>
  </div>
</template>
<script>
export default {
  name:'EvolutionPresentation',
  props: { busy:Boolean,error:String,evolution: { type: Object, required: true }, remaining: { type: Number, default: 1 }, animationsEnabled: { type: Boolean, default: true } },
  data() { return { revealed: false, reducedMotion: false, failedBefore: false, failedAfter: false }; },
  computed:{cancellable(){return Boolean(this.evolution.pending||this.evolution.request);}},
  watch:{'evolution.resolved'(value){if(value){clearTimeout(this.revealTimer);this.revealed=true;}},error(value){if(value)this.requestSent=false;}},
  mounted() {
    this.previousFocus = document.activeElement;
    this.$refs.dialog.focus();
    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.onMotionChange = () => { this.reducedMotion = !this.animationsEnabled || this.motionQuery.matches; if (this.reducedMotion && !this.cancellable) this.reveal(); };
    this.motionQuery.addEventListener?.('change', this.onMotionChange);
    this.onMotionChange();
    // Preload the reveal, but never block the player on a missing/slow sprite.
    const image = new Image(); image.src = this.sprite(this.evolution.to);
    if(!this.reducedMotion)this.revealTimer = setTimeout(this.reveal, 2300);
  },
  beforeDestroy() {
    clearTimeout(this.revealTimer);
    this.motionQuery?.removeEventListener?.('change', this.onMotionChange);
    if (this.previousFocus?.isConnected) this.previousFocus.focus?.();
  },
  methods: {
    sprite(id) { return `${process.env.BASE_URL}img/pokemon/front/${id}.png`; },
    reveal() { clearTimeout(this.revealTimer);if(this.busy||this.requestSent)return;if(this.cancellable&&!this.evolution.resolved){this.requestSent=true;this.$emit('resolve',false);}else this.revealed=true; },
    cancel(){if(this.busy||this.revealed)return;clearTimeout(this.revealTimer);this.$emit('resolve',true);},
    advance() { if (!this.revealed) this.reveal(); else this.$emit('continue'); },
    onKeydown(event) {
      if (event.key === 'Escape') { event.preventDefault();if(this.cancellable&&!this.revealed)this.cancel();else this.advance(); }
      if (event.key === 'Tab') {const nodes=[...this.$refs.dialog.querySelectorAll('button:not(:disabled)')],first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
      if ((event.key === 'Enter' || event.key === ' ') && event.target === this.$refs.dialog) { event.preventDefault(); this.advance(); }
    }
  }
};
</script>
<style scoped>
.evolution-cancel{margin-top:9px;background:transparent;color:#486375;border-color:#9cabb0}.evolution-error{color:#9e4141;margin:12px 0;min-height:0}button:disabled{opacity:.55;cursor:wait}
.evolution-backdrop{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;box-sizing:border-box;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));background:#071f32dc;backdrop-filter:blur(5px)}
.evolution-sheet{box-sizing:border-box;width:min(100%,450px);max-height:100%;overflow:auto;overscroll-behavior:contain;text-align:center;padding:28px 24px;background:radial-gradient(ellipse at 50% 40%,#fffdf1,#f3f3e9 75%);border:1px solid #c6b784;border-radius:22px;box-shadow:0 22px 90px #03172899;color:#233f3d;font:15px/1.5 Arial,sans-serif;outline:none}.evolution-sheet>small{color:#667b6c;font-size:10px;letter-spacing:1.7px}h2{font:30px/1.2 Georgia,serif;margin:10px 0 0}.evolution-stage{height:230px;position:relative;display:grid;place-items:center;isolation:isolate}.evolution-stage img{position:absolute;width:190px;height:190px;object-fit:contain;image-rendering:pixelated;transition:opacity .55s,transform .65s,filter .55s}.evolution-before{animation:evolution-gather 2.3s ease-in-out both}.evolution-after{opacity:0;transform:scale(.65);filter:brightness(2)}.revealed .evolution-before{opacity:0;animation:none;transform:scale(.8)}.revealed .evolution-after{opacity:1;transform:scale(1);filter:none}.evolution-orbit{position:absolute;width:205px;height:205px;border:1px dashed #bfa661;border-radius:50%;animation:evolution-orbit 12s linear infinite}.evolution-halo{position:absolute;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,#f5dfa8c9,transparent 70%);animation:evolution-glow 1.1s ease-in-out infinite alternate}.evolution-spark{position:absolute;color:#b3964f;font-size:24px;animation:evolution-glow .8s ease-in-out infinite alternate}.spark-one{left:12%;top:18%}.spark-two{right:9%;top:43%;animation-delay:.3s}.spark-three{left:22%;bottom:9%;font-size:17px;animation-delay:.6s}.evolution-fallback{font-size:100px;color:#b3964f}p{margin:0;min-height:60px}strong{display:block;font:29px/1.3 Georgia,serif;color:#287366}.evolution-note{min-height:0;font-size:12px;color:#667b6c;margin:10px 0 20px}button{box-sizing:border-box;min-height:48px;width:100%;border:1px solid #236354;border-radius:10px;background:#287366;color:#fff;font:600 14px Arial,sans-serif;cursor:pointer;padding:12px}button:focus-visible{outline:3px solid #bda365;outline-offset:3px}.evolution-count{display:block;margin-top:12px;letter-spacing:0!important}.still *{animation:none!important;transition:none!important}@keyframes evolution-gather{0%{transform:scale(.9);filter:none}60%{transform:scale(1.06);filter:brightness(2)}100%{transform:scale(.9);filter:brightness(10)}}@keyframes evolution-orbit{to{transform:rotate(360deg)}}@keyframes evolution-glow{to{opacity:.45;transform:scale(.9)}}@media(max-height:550px){.evolution-sheet{padding:14px 18px}h2{font-size:24px}.evolution-stage{height:155px}.evolution-stage img{width:145px;height:145px}.evolution-orbit{width:145px;height:145px}.evolution-halo{width:130px;height:130px}p{min-height:50px}strong{font-size:24px}.evolution-note{margin:4px 0 10px}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>

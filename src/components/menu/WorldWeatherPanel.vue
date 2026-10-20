<template>
  <div class="weather-preview-backdrop" @mousedown.stop @pointerdown.stop @click.stop @keydown.stop @keyup.stop @keydown.esc.prevent="$emit('close')" @keydown.tab="trapFocus">
    <section ref="dialog" class="weather-preview-sheet" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="weather-preview-title">
      <header><div><small>{{ text.eyebrow }}</small><h2 id="weather-preview-title">{{ text.title }}</h2></div><button type="button" :aria-label="text.close" @click="$emit('close')">×</button></header>
      <p class="weather-preview-intro">{{ climate === 'rain' ? text.rainIntro : text.intro }}</p>
      <fieldset v-for="kind in ['wind', 'rain']" :key="kind">
        <legend>{{ text[kind] }}</legend>
        <div class="weather-preview-levels">
          <label v-for="(label, level) in text.levels[kind]" :key="level" :class="{ selected: value[kind] === level }">
            <input type="radio" :name="`village-weather-${kind}`" :value="level" :checked="value[kind] === level" :data-weather-kind="kind" :data-weather-level="level" @change="$emit('change', { ...value, [kind]: level })"><span>{{ label }}</span>
          </label>
        </div>
      </fieldset>
      <p class="weather-preview-summary" role="status">{{ summary }}</p>
      <p v-if="reducedMotion" class="weather-preview-motion">{{ text.still }}</p>
      <footer><button type="button" @click="$emit('reset')">{{ text.reset }}</button><button type="button" class="weather-preview-primary" @click="$emit('close')">{{ text.observe }} →</button></footer>
    </section>
  </div>
</template>
<script>
const labels = {
  fr: { eyebrow: 'ESSAI · VILLAGE DE DÉPART', title: 'Météo du village', rainIntro: 'La pluie du village accompagne les combats. Ajuste ici son affichage.', intro: 'Ajuste l’ambiance et observe le village derrière ce panneau.', wind: 'Vent', rain: 'Pluie', levels: { wind: ['Arrêt','Léger','Soutenu','Fort'], rain: ['Masquée','Fine','Modérée','Averse'] }, close: 'Fermer la météo', reset: 'Réinitialiser', observe: 'Observer', still: 'Mouvement réduit : l’ambiance reste fixe.' },
  en: { eyebrow: 'PREVIEW · STARTING VILLAGE', title: 'Village weather', rainIntro: 'The village rain carries into battles. Adjust its display here.', intro: 'Adjust the atmosphere and watch the village behind this panel.', wind: 'Wind', rain: 'Rain', levels: { wind: ['Off','Light','Steady','Strong'], rain: ['Hidden','Drizzle','Moderate','Downpour'] }, close: 'Close weather', reset: 'Reset', observe: 'Watch', still: 'Reduced motion: the atmosphere stays still.' }
};
export default {
  props: { climate: { type: String, default: null }, value: { type: Object, required: true }, language: { type: String, default: 'fr' }, reducedMotion: Boolean },
  computed: { text() { return labels[this.language] || labels.fr; }, summary() { return `${this.text.wind} · ${this.text.levels.wind[this.value.wind]} — ${this.text.rain} · ${this.text.levels.rain[this.value.rain]}`; } },
  mounted() { this.previousFocus = document.activeElement; this.$refs.dialog.focus(); },
  beforeDestroy() { this.previousFocus?.focus?.(); },
  methods: {
    trapFocus(event) {
      const controls = [...this.$refs.dialog.querySelectorAll('button, input:checked')];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === this.$refs.dialog)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }
};
</script>
<style scoped>
.weather-preview-backdrop{position:fixed;inset:0;z-index:2900;display:flex;align-items:flex-end;justify-content:flex-end;box-sizing:border-box;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));background:#173d3730}.weather-preview-sheet{box-sizing:border-box;width:min(100%,410px);max-height:100%;overflow:auto;overscroll-behavior:contain;background:#fafbf4;color:#26483f;border:1px solid #b8c8b0;border-radius:18px;padding:20px;box-shadow:0 14px 60px #0a2d3b55;font:13px/1.45 Arial,sans-serif;outline:none}header{display:flex;align-items:center;justify-content:space-between;gap:12px}header small{font-size:9px;letter-spacing:1.1px;color:#6e806e}h2{font:26px/1.2 Georgia,serif;margin:5px 0 0}button{font:inherit;cursor:pointer;border:1px solid #c1cfb9;border-radius:9px;background:#edf2e7;color:inherit;min-height:44px;min-width:44px;padding:8px 12px}button:focus-visible{outline:3px solid #287366;outline-offset:2px}.weather-preview-intro{color:#62796b;font-size:12px;margin:10px 0 14px}fieldset{border:0;padding:0;margin:0 0 14px;min-width:0}legend{font-weight:600;margin-bottom:7px}.weather-preview-levels{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.weather-preview-levels label{position:relative;min-height:44px;display:grid;place-items:center;box-sizing:border-box;border:1px solid #c5d2bd;border-radius:9px;background:#f0f4e9;font-size:12px;cursor:pointer}.weather-preview-levels label.selected{border-color:#287366;background:#287366;color:white}.weather-preview-levels label:focus-within{outline:3px solid #bba162;outline-offset:2px}input{position:absolute;opacity:0;width:1px;height:1px;margin:0}.weather-preview-summary{font-size:11px;margin:4px 0 14px;color:#496d5c}.weather-preview-motion{font-size:11px;color:#766544;margin:0 0 12px}footer{display:flex;gap:8px}footer button{flex:1}.weather-preview-primary{background:#287366;color:white;border-color:#287366}@media(max-height:500px){.weather-preview-sheet{padding:14px}h2{font-size:23px}.weather-preview-intro{margin:6px 0 10px}fieldset{margin-bottom:10px}}
</style>

<template>
  <fieldset class="fullscreen-options" data-fullscreen-options>
    <legend>{{ english ? 'Screen' : 'Affichage' }}</legend>
    <div class="fullscreen-row">
      <span><strong>{{ english ? 'Fullscreen' : 'Plein écran' }}</strong><small id="fullscreen-help">{{ english ? 'Enlarge the game while keeping its proportions.' : 'Agrandit le jeu en conservant ses proportions.' }}</small></span>
      <button type="button" data-fullscreen-toggle :aria-pressed="state.active" aria-describedby="fullscreen-help" :disabled="state.busy || !state.supported" @click="$emit('toggle')">
        <journal-icon name="fullscreen" />
        {{ state.busy ? (english ? 'Switching…' : 'Changement…') : state.active ? (english ? 'Windowed mode' : 'Revenir en fenêtre') : (english ? 'Fullscreen' : 'Passer en plein écran') }}
      </button>
    </div>
    <p v-if="!state.supported">{{ english ? 'Fullscreen is unavailable in this browser.' : 'Le plein écran est indisponible dans ce navigateur.' }}</p>
    <p v-else>{{ english ? 'Press Esc to return to windowed mode.' : 'Appuie sur Échap pour revenir en fenêtre.' }}</p>
    <p v-if="state.error" class="fullscreen-error" role="alert">{{ state.error }}</p>
  </fieldset>
</template>
<script>
import JournalIcon from './JournalIcon.vue';
export default {
  components: { JournalIcon },
  props: { state: { type: Object, required: true }, language: String },
  computed: { english() { return this.language === 'en'; } }
};
</script>
<style scoped>
.fullscreen-options{min-width:0;margin:0;padding:16px;border:1px solid var(--journal-border);border-radius:12px;background:var(--journal-card);color:var(--journal-ink)}
legend{padding:0 6px;font-weight:800}
.fullscreen-row{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}
.fullscreen-row>span{display:flex;flex-direction:column;gap:6px;font-size:13px}
small,p{color:var(--journal-muted);font-size:12px;line-height:1.6}
p{margin:10px 0 0}
button{display:flex;align-items:center;justify-content:center;gap:9px;min-height:44px;padding:10px 14px;border:1px solid var(--journal-border);border-radius:9px;background:var(--journal-soft);color:var(--journal-heading);font:600 13px var(--journal-font);cursor:pointer}
button:hover{background:var(--journal-selected)}
button:disabled{opacity:.6;cursor:default}
button:focus-visible{outline:2px solid var(--journal-accent);outline-offset:3px}
.fullscreen-error{color:var(--journal-heading);font-weight:700}
</style>

<template>
  <div class="learning-backdrop" @keydown.esc.stop="$emit('later')" @keydown.tab="trapFocus">
    <section ref="dialog" tabindex="-1" class="learning-sheet" role="dialog" aria-modal="true" aria-labelledby="learning-title" :aria-busy="busy">
      <header><div><small>CARNET D’ENTRAÎNEMENT · NIVEAU {{ choice.level }}</small><h2 id="learning-title">Une nouvelle attaque</h2></div><button aria-label="Choisir plus tard" :disabled="busy" @click="$emit('later')">×</button></header>
      <p><strong>{{ pokemon.name }}</strong> peut apprendre <strong>{{ label(choice.move) }}</strong>.</p>
      <div class="new-move"><strong>{{ label(choice.move) }}</strong><span>{{ details(choice.move) }}</span><p class="learning-description" data-learning-description>{{ description(choice.move) }}</p></div>
      <p v-if="pokemon.abilities.length >= 4">Choisis l’attaque à oublier pour la remplacer.</p>
      <div v-if="pokemon.abilities.length >= 4" class="move-choices">
        <button v-for="(move, slot) in pokemon.abilities" :key="slot" :disabled="busy" @click="$emit('choose', slot)"><strong>{{ label(move) }}</strong><span>{{ details(move) }}</span><span class="learning-description" data-learning-description>{{ description(move) }}</span><small>Remplacer cette attaque →</small></button>
      </div>
      <button v-else class="learn-primary" :disabled="busy" @click="$emit('choose', pokemon.abilities.length)">Apprendre {{ label(choice.move) }}</button>
      <p v-if="error" class="learning-error" role="alert">{{ error }}</p>
      <p v-if="busy" role="status">Sauvegarde du choix…</p>
      <footer><button ref="later" :disabled="busy" @click="$emit('later')">Plus tard</button><button :disabled="busy" @click="$emit('choose', null)">Ne pas apprendre</button></footer>
      <small class="learning-hint">Retrouve tes choix dans Menu → Attaques à apprendre.</small>
    </section>
  </div>
</template>
<script>
import moves from '@/data/moveLearning.json';
import reference from '@/data/pokemonReference.fr.json';
import { localizeMoveName } from '@/services/i18n';
const types = { Normal:'Normal', Fire:'Feu', Water:'Eau', Grass:'Plante', Electric:'Électrik', Ice:'Glace', Fighting:'Combat', Poison:'Poison', Ground:'Sol', Flying:'Vol', Psychic:'Psy', Bug:'Insecte', Rock:'Roche', Ghost:'Spectre', Dragon:'Dragon', Dark:'Ténèbres', Steel:'Acier', Fairy:'Fée' };
export default {
  props: { pokemon: { type: Object, required: true }, busy: Boolean, error: String },
  computed: { choice() { return this.pokemon.pendingMoves[0]; } },
  mounted() { this.previousFocus = document.activeElement; this.$refs.dialog?.focus(); },
  beforeDestroy() { this.previousFocus?.focus?.(); },
  methods: {
    label(name) { return localizeMoveName(name, 'fr'); },
    description(name) { return reference.moves[name]?.description || 'Description de cette capacité indisponible.'; },
    details(name) {
      const move = moves[name];
      if (!move) return '';
      const category = { physical:'Physique', special:'Spéciale', status:'Statut' }[move.category];
      return `${types[move.type] || move.type} · ${category} · Puiss. ${move.power || '—'} · Préc. ${move.accuracy || '—'} · ${move.pp} PP`;
    },
    trapFocus(event) {
      const buttons = [...this.$refs.dialog.querySelectorAll('button:not(:disabled)')];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === this.$refs.dialog)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }
};
</script>
<style scoped>
.new-move .learning-description,.move-choices .learning-description{margin:3px 0 0;font-size:12px;line-height:1.55;color:inherit;font-weight:400}
.learning-backdrop{position:fixed;inset:0;z-index:3100;background:#142f36b8;display:grid;place-items:center;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));box-sizing:border-box}
.learning-sheet{box-sizing:border-box;width:min(100%,540px);max-height:100%;overflow:auto;overscroll-behavior:contain;background:#fcfcf8;color:#253b39;border:1px solid #d3ddd2;border-radius:18px;padding:24px;font:14px/1.5 Arial,sans-serif;box-shadow:0 18px 65px #071d3440}
header{display:flex;gap:12px;justify-content:space-between;align-items:center}header small{font-size:9px;letter-spacing:1px;color:#677b70}h2{font:27px/1.2 Georgia,serif;margin:6px 0}button{font:inherit;color:inherit;border:1px solid #c9d7cd;border-radius:9px;background:#f1f5ed;min-height:44px;min-width:44px;cursor:pointer}button:disabled{opacity:.6;cursor:wait}button:focus-visible{outline:3px solid #287366;outline-offset:2px}.new-move{display:grid;gap:4px;border:1px solid #9bb9a8;border-radius:10px;padding:14px;background:#e7efdf}.new-move strong{color:#247263;font-size:18px}.new-move span,.move-choices span{font-size:11px;line-height:1.7;color:#5a6e65}.move-choices{display:grid;grid-template-columns:1fr 1fr;gap:8px}.move-choices button{display:grid;text-align:left;gap:5px;padding:12px;background:white}.move-choices small{font-size:10px;color:#287366}.learn-primary{width:100%;background:#287366;color:white;margin-top:16px}footer{display:flex;gap:8px;margin-top:20px}footer button{flex:1;padding:8px}.learning-hint{display:block;color:#5a6e65;margin-top:12px;font-size:10px}.learning-error{color:#a33f35}@media(max-width:360px){.learning-sheet{padding:16px}.move-choices{grid-template-columns:1fr}h2{font-size:23px}}
</style>

<template>
  <div class="learning-backdrop" @keydown.esc.stop="!busy && $emit('later')" @keydown.tab="trapFocus">
    <section ref="dialog" tabindex="-1" class="learning-sheet" role="dialog" aria-modal="true" aria-labelledby="learning-title" :aria-busy="busy">
      <header><div><small>CARNET D’ENTRAÎNEMENT · NIVEAU {{ choice.level }}</small><h2 id="learning-title">Une nouvelle attaque</h2></div><button aria-label="Choisir plus tard" :disabled="busy" @click="$emit('later')">×</button></header>
      <div class="learning-content">
      <aside class="learning-new">
      <p><strong>{{ pokemon.name }}</strong> peut apprendre une nouvelle capacité.</p>
      <div class="new-move"><strong>{{ label(choice.move) }}</strong><span>{{ details(choice.move) }}</span><p class="learning-description" data-learning-description>{{ description(choice.move) }}</p></div>
      </aside>
      <div class="learning-current">
      <p v-if="pokemon.abilities.length >= 4" class="learning-instruction">Choisis l’attaque à oublier pour la remplacer.</p>
      <div v-if="pokemon.abilities.length >= 4" class="move-choices">
        <button v-for="(move, slot) in pokemon.abilities" :key="slot" :disabled="busy" @click="$emit('choose', slot)"><strong>{{ label(move) }}</strong><span>{{ details(move) }}</span><span class="learning-description" data-learning-description>{{ description(move) }}</span><small>Remplacer cette attaque →</small></button>
      </div>
      <button v-else class="learn-primary" :disabled="busy" @click="$emit('choose', pokemon.abilities.length)">Apprendre {{ label(choice.move) }}</button>
      </div>
      </div>
      <div class="learning-feedback" aria-live="polite">
      <p v-if="error" class="learning-error" role="alert">{{ error }}</p>
      <p v-if="busy" role="status">Sauvegarde du choix…</p>
      </div>
      <footer><small class="learning-hint">Retrouve tes choix dans Menu → Attaques à apprendre.</small><div><button ref="later" :disabled="busy" @click="$emit('later')">Plus tard</button><button :disabled="busy" @click="$emit('choose', null)">Ne pas apprendre</button></div></footer>
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
.learning-backdrop{position:fixed;inset:0;z-index:3100;background:var(--journal-backdrop);display:grid;place-items:center;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));box-sizing:border-box}
.learning-sheet{box-sizing:border-box;display:flex;flex-direction:column;min-height:0;width:min(100%,600px);max-height:100%;overflow:hidden;background:var(--journal-paper);color:var(--journal-ink);border:1px solid var(--journal-border);border-radius:18px;font:14px/1.5 var(--journal-font);box-shadow:var(--journal-shadow)}
header{display:flex;flex:none;gap:12px;justify-content:space-between;align-items:center;padding:18px 22px;background:var(--journal-card);border-bottom:1px solid var(--journal-border)}header small{font-size:9px;letter-spacing:1px;color:var(--journal-muted)}h2{font:27px/1.2 Georgia,serif;margin:6px 0;color:var(--journal-heading)}button{font:inherit;color:inherit;border:1px solid var(--journal-border);border-radius:9px;background:var(--journal-card);min-height:44px;min-width:44px;cursor:pointer}button:disabled{opacity:.6;cursor:wait}button:focus-visible{outline:3px solid var(--journal-accent);outline-offset:2px}
.learning-content{min-height:0;overflow:auto;overscroll-behavior:contain;padding:18px 22px;display:grid;gap:18px}.learning-content p{margin:0 0 12px}.learning-new,.learning-current{min-width:0}.new-move{display:grid;gap:7px;border:1px solid var(--journal-progress);border-radius:12px;padding:16px;background:var(--journal-selected)}.new-move strong{color:var(--journal-heading);font:600 22px/1.2 Georgia,serif}.new-move>span,.move-choices button>span{font-size:11px;line-height:1.55;color:var(--journal-muted)}.new-move .learning-description,.move-choices .learning-description{margin:3px 0 0;font-size:12px;line-height:1.55;color:var(--journal-ink);font-weight:400}.move-choices{display:grid;grid-template-columns:1fr 1fr;gap:8px}.move-choices button{display:flex;flex-direction:column;text-align:left;gap:6px;padding:13px}.move-choices strong{color:var(--journal-heading)}.move-choices small{margin-top:auto;padding-top:5px;font-size:10px;color:var(--journal-accent)}.learn-primary{width:100%;background:var(--journal-accent);color:var(--journal-on-accent)}
.learning-feedback{flex:none;padding:0 22px}.learning-feedback p{margin:0 0 10px;font-size:12px}.learning-error{color:var(--journal-danger)}footer{flex:none;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 22px;background:var(--journal-soft);border-top:1px solid var(--journal-border)}footer>div{display:flex;gap:8px;flex:none}footer button{padding:9px 14px}.learning-hint{display:block;color:var(--journal-muted);font-size:10px;max-width:230px}
@media(min-width:921px){.learning-sheet{width:min(100%,980px)}.learning-content{grid-template-columns:minmax(190px,.7fr) minmax(0,1.6fr);gap:22px}.learning-new{border-right:1px solid var(--journal-border);padding-right:20px}.learning-instruction{font-size:12px}.move-choices .learning-description{font-size:11px;line-height:1.45}}
@media(max-width:600px){header{padding:12px 16px}h2{font-size:23px}.learning-content{padding:14px 16px;gap:14px}footer{padding:12px 16px;flex-wrap:wrap;gap:8px}footer>div{width:100%}footer button{flex:1}.learning-hint{max-width:none}.new-move{padding:12px}}
@media(max-width:360px){.move-choices{grid-template-columns:1fr}}
@media(min-width:921px) and (max-height:650px){header{padding:12px 22px}h2{font-size:25px}.learning-content{padding-block:14px}footer{padding-block:10px}}
</style>

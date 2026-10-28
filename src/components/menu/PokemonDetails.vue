<template>
  <div class="companion-backdrop" @mousedown.self="$emit('close')" @keydown.esc.stop="$emit('close')" @keydown.tab="trapFocus">
    <section ref="dialog" class="companion-sheet" role="dialog" aria-modal="true" :aria-label="`Fiche de ${pokemon.name}`">
      <header class="companion-heading">
        <div><span class="companion-kicker">{{ contextLabel }} · {{ position }} / {{ total }}</span><h2>{{ pokemon.name }}</h2></div>
        <button ref="close" class="companion-close" aria-label="Fermer la fiche" @click="$emit('close')">×</button>
      </header>
      <nav class="companion-pagination" aria-label="Parcourir les Pokémon"><button data-companion-previous :disabled="position <= 1" @click="$emit('navigate', -1)">‹ Précédent</button><span>{{ position }} / {{ total }}</span><button data-companion-next :disabled="position >= total" @click="$emit('navigate', 1)">Suivant ›</button></nav>
      <div class="companion-body">
        <div class="companion-identity">
          <div class="companion-art"><span class="companion-number">N° {{ String(pokemon.spriteId).padStart(3, '0') }}</span><pokemon-portrait :src="`${$assetBase}img/pokemon/front/${pokemon.spriteId}.png`" :alt="pokemon.truename || pokemon.name" /><span class="companion-level">Niv. {{ pokemon.level }}</span></div>
          <div class="companion-types"><span v-for="type in pokemon.data.type" :key="type">{{ typeNames[type] || type }}</span></div>
          <p class="companion-species">{{ pokemon.truename }}</p>
          <div class="companion-health"><strong>PV</strong><span>{{ pokemon.currentHp }} / {{ pokemon.maxHp }}</span><div><i :style="{ width: hpPercent + '%' }"></i></div></div>
          <experience-bar :pokemon="pokemon" detailed />
          <p class="companion-next">Prochain niveau : {{ progress.remaining }} XP</p>
          <div class="companion-traits"><span>Nature <strong>{{ nature.label }}</strong></span><small>{{ nature.effect }}</small><span>Talent <strong>{{ abilityName }}</strong></span><span>Potentiel <potential-star :value="pokemon.k" /></span></div>
          <p class="companion-ability-description" data-ability-description>{{ abilityDescription }}</p>
          <p v-if="abilityNotice" class="evolution-help" data-ability-notice>{{ abilityNotice }}</p>
        </div>
        <div class="companion-training">
          <div class="companion-tabs" role="tablist" aria-label="Graphique Pokémon">
            <button v-for="item in modes" :id="`companion-tab-${item.key}`" :key="item.key" role="tab" :aria-selected="mode === item.key" :tabindex="mode === item.key ? 0 : -1" aria-controls="companion-chart" @click="mode = item.key" @keydown="switchTab($event, item.key)">{{ item.label }}</button>
          </div>
          <div id="companion-chart" role="tabpanel" :aria-labelledby="`companion-tab-${mode}`">
            <svg class="companion-radar" viewBox="0 0 320 280" role="img" :aria-label="chartDescription">
              <polygon v-for="ring in 4" :key="`ring-${ring}`" :points="polygon(Array(6).fill(ring / 4))" class="radar-ring" />
              <line v-for="(stat, index) in stats" :key="`axis-${stat.key}`" x1="160" y1="140" :x2="point(index, 1).x" :y2="point(index, 1).y" class="radar-axis" />
              <polygon :points="polygon(ratios)" class="radar-value" />
              <g v-for="(stat, index) in stats" :key="stat.key">
                <circle :cx="point(index, ratios[index]).x" :cy="point(index, ratios[index]).y" r="3" class="radar-dot" />
                <text :x="point(index, 1.35).x" :y="point(index, 1.27).y" text-anchor="middle" class="radar-label">{{ stat.label }}<tspan :x="point(index, 1.35).x" dy="16" class="radar-number">{{ values[index] }}</tspan></text>
              </g>
            </svg>
            <p class="companion-chart-caption">{{ chartCaption }}</p>
            <div class="companion-stat-lines"><div v-for="(stat, index) in stats" :key="stat.key"><span>{{ stat.full }}</span><strong>{{ values[index] }}<small v-if="mode !== 'stats'"> / {{ mode === 'iv' ? 31 : 252 }}</small></strong></div></div>
          </div>
          <p class="companion-tip">{{ mode === 'ev' ? `Entraînement : ${effortTotal} / 510. Les adversaires vaincus améliorent progressivement tes statistiques.` : mode === 'iv' ? 'Les IV sont innés. Le potentiel multiplie leur contribution aux statistiques ; il ne modifie pas les EV.' : 'Les statistiques combinent espèce, niveau, nature, IV, potentiel et entraînement. Les effets temporaires du combat sont exclus.' }}</p>
        </div>
      </div>
      <section class="companion-pc-moves" aria-labelledby="companion-moves-title">
        <h3 id="companion-moves-title">Capacités</h3>
        <p class="evolution-help">Les dégâts réels dépendent des statistiques, des types et des effets en combat.</p>
        <p v-if="!moves.length" class="evolution-help">Aucune capacité apprise.</p>
        <article v-for="(move,index) in moves" :key="`${index}-${move.name}`" :data-companion-move="move.name" :style="typeStyle(move.type)">
          <div class="companion-move-heading"><strong>{{ moveName(move.name) }}</strong><div><span class="companion-move-type">{{ typeName(move.type) || 'Type inconnu' }}</span><span class="companion-move-class">{{ moveClass(move.damageClass) }}</span></div></div>
          <dl><div><dt>{{ move.fixedDamage ? 'Dégâts fixes' : 'Puissance' }}</dt><dd>{{ move.powerLabel }}</dd></div><div><dt>Précision</dt><dd>{{ move.accuracy>0?`${move.accuracy} %`:'—' }}</dd></div><div><dt>PP</dt><dd>{{ move.pp ?? '—' }} / {{ move.maxPp ?? '—' }}</dd></div></dl>
          <p class="companion-move-description" data-move-description>{{ move.description }}</p>
        </article>
        <p v-if="pokemon.heldItemName" class="evolution-help">Objet tenu : <strong>{{ pokemon.heldItemName }}</strong></p>
      </section>
      <section v-if="!readOnly" class="companion-evolutions" aria-labelledby="companion-evolution-title">
        <h3 ref="evolutionTitle" id="companion-evolution-title" tabindex="-1">Évolution</h3>
        <p v-if="evolutionLoading" role="status">Chargement des conditions…</p>
        <p v-else-if="!evolutionOptions.length && !evolutionError">Ce Pokémon n’a pas d’évolution dans RiftMon.</p>
        <p v-else class="evolution-help">Les évolutions à branche unique se déclenchent avec l’XP. Tu peux aussi évoluer ici si les conditions sont remplies. Pour plusieurs formes, choisis celle que tu souhaites conserver.</p>
        <p v-if="evolutionNotice" class="evolution-success" role="status">{{ evolutionNotice }}</p>
        <p v-if="evolutionError" class="evolution-error" role="alert">{{ evolutionError }} <button @click="$emit('reload-evolutions')">Réessayer</button></p>
        <article v-for="option in evolutionOptions" :key="option.targetId" :data-evolution-target="option.targetId">
          <pokemon-portrait :src="`${$assetBase}img/pokemon/front/${option.targetId}.png`" :alt="option.name" />
          <div><strong>{{ option.name }}</strong><p>{{ option.condition }}</p><small v-if="option.adaptation">Règle solo : {{ option.adaptation }}</small></div>
          <span v-if="option.stone" class="evolution-stone">Avec une pierre</span>
          <button v-else :disabled="!option.ready || !evolutionAllowed || evolutionBusy || evolutionLoading" @click="$emit('evolve',option.targetId)">{{ evolutionBusy ? 'Évolution…' : option.ready ? `Évoluer en ${option.name}` : 'Conditions requises' }}</button>
        </article>
        <p v-if="pokemon.currentHp <= 0 && evolutionOptions.length" class="evolution-help">Soigne ce Pokémon avant de le faire évoluer.</p>
      </section>
      <footer class="companion-footer"><span>{{ footerLabel }}</span></footer>
    </section>
  </div>
</template>
<script>
import PotentialStar from '../PotentialStar.vue';
import PokemonPortrait from '../PokemonPortrait.vue';
import ExperienceBar from '../ExperienceBar.vue';
import { experienceProgress } from '@/services/pokemonProgress';
import { localizeTypeName, typeBadgeStyle } from '@/services/pokemonTypes';
import { localizeAbilityName, localizeMoveName } from '@/services/i18n';
import { createPokemonReference } from '@/services/pokemonReference';
import referenceData from '@/data/pokemonReference.fr.json';
import {natures} from '@/services/pokemonNatures';
const reference=createPokemonReference(referenceData);
const stats = [
  { key: 'hp', label: 'PV', full: 'Points de vie' }, { key: 'attack', label: 'ATQ', full: 'Attaque' },
  { key: 'defense', label: 'DÉF', full: 'Défense' }, { key: 'speed', label: 'VIT', full: 'Vitesse' },
  { key: 'specialDefense', label: 'DÉF. SPÉ.', full: 'Défense spéciale' }, { key: 'specialAttack', label: 'ATQ. SPÉ.', full: 'Attaque spéciale' }
];

export default {
  components: { ExperienceBar, PokemonPortrait, PotentialStar },
  props: { pokemon: { type: Object, required: true }, position: Number, total: Number, readOnly:Boolean, contextLabel:{type:String,default:'CARNET DE VOYAGE'}, footerLabel:{type:String,default:'TON ÉQUIPE · TON AVENTURE'}, evolutionOptions: { type: Array, default: () => [] }, evolutionLoading: Boolean, evolutionBusy: Boolean, evolutionError: String, evolutionNotice: String, evolutionAllowed: Boolean },
  data: () => ({ mode: 'stats', stats, modes: [{ key: 'stats', label: 'Stats' }, { key: 'iv', label: 'Potentiel' }, { key: 'ev', label: 'Entraînement' }], previousFocus: null,
    typeNames: { Grass: 'Plante', Fire: 'Feu', Water: 'Eau', Bug: 'Insecte', Flying: 'Vol', Electric: 'Électrik', Ground: 'Sol', Rock: 'Roche', Ice: 'Glace', Fighting: 'Combat', Psychic: 'Psy', Ghost: 'Spectre', Dark: 'Ténèbres', Steel: 'Acier', Fairy: 'Fée' } }),
  computed: {
    progress() { return experienceProgress(this.pokemon); },
    hpPercent() { return Math.min(100, this.pokemon.currentHp / this.pokemon.maxHp * 100); },
    abilityName() { return localizeAbilityName(this.pokemon.passiveAbility, 'fr') || '—'; },
    abilityDescription() { return reference.abilityDescription(this.pokemon.passiveAbility); },
    moves() { return reference.moves(this.pokemon); },
    abilityNotice() {
      const name=this.pokemon.passiveAbility;
      if(['Battery','Friend Guard','Healer','Minus','Plus','Receiver','Symbiosis','Telepathy'].includes(name))return 'Ce talent agit sur les alliés en combat double. Les modes actuels se jouent en un contre un.';
      if(['Honey Gather','Illuminate'].includes(name))return 'L’effet hors combat de ce talent n’est pas encore disponible dans RiftMon.';
      if(name==='Multitype')return 'Le changement de type nécessite une Plaque, un objet qui n’est pas encore proposé dans RiftMon.';
      if(name==='RKS System')return 'Le changement de type nécessite un ROM, un objet qui n’est pas encore proposé dans RiftMon.';
      return '';
    },
    nature() {
      const n = natures[this.pokemon.nature] || ['Pudique'];
      const label = key => stats.find(stat => stat.key === key)?.label;
      return { label: n[0], effect: n[1] ? `${label(n[1])} +10 % · ${label(n[2])} −10 %` : 'Nature neutre · aucune statistique modifiée' };
    },
    values() { return stats.map(stat => Number(this.mode === 'stats' ? this.pokemon[stat.key === 'hp' ? 'maxHp' : stat.key] : this.pokemon[this.mode]?.[stat.key]) || 0); },
    scale() { return this.mode === 'iv' ? 31 : this.mode === 'ev' ? 252 : Math.max(1, ...this.values); },
    ratios() { return this.values.map(value => value / this.scale); },
    effortTotal() { return Object.values(this.pokemon.ev || {}).reduce((sum, value) => sum + value, 0); },
    chartDescription() { return this.stats.map((stat, index) => `${stat.full} : ${this.values[index]}`).join(', '); },
    chartCaption() { return this.mode === 'stats' ? `Échelle commune : 0 à ${this.scale}` : this.mode === 'iv' ? 'Qualités innées · IV de 0 à 31' : 'Points d’effort · EV de 0 à 252 par statistique'; }
  },
  watch: { evolutionNotice(value) { if(value)this.$nextTick(()=>this.$refs.evolutionTitle?.focus()); } },
  mounted() { this.previousFocus = document.activeElement; this.$refs.close.focus(); },
  beforeDestroy() { this.previousFocus?.focus?.(); },
  methods: {
    moveName(name){return localizeMoveName(name,'fr');},typeName:localizeTypeName,
    typeStyle:typeBadgeStyle,
    moveClass(value){return {physical:'Physique',special:'Spéciale',status:'Statut'}[value] || '—';},
    point(index, ratio) { const angle = -Math.PI / 2 + index * Math.PI / 3; return { x: 160 + Math.cos(angle) * 85 * ratio, y: 140 + Math.sin(angle) * 85 * ratio }; },
    polygon(ratios) { return ratios.map((ratio, index) => { const p = this.point(index, ratio); return `${p.x},${p.y}`; }).join(' '); },
    switchTab(event, key) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = this.modes.findIndex(mode => mode.key === key);
      const target = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
      this.mode = this.modes[target].key;
      this.$nextTick(() => document.getElementById(`companion-tab-${this.mode}`).focus());
    },
    trapFocus(event) {
      const elements = [...this.$refs.dialog.querySelectorAll('button:not(:disabled):not([tabindex="-1"])')];
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }
};
</script>
<style scoped>
.companion-pagination{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 24px;background:var(--journal-paper);border-bottom:1px solid var(--journal-border);color:var(--journal-muted);font:12px var(--journal-font)}.companion-pagination button{min-height:44px;padding:8px 14px;border:1px solid var(--journal-border);border-radius:8px;background:var(--journal-card);color:var(--journal-ink);font:inherit;cursor:pointer}.companion-pagination button:disabled{opacity:.4;cursor:default}.companion-pagination button:focus-visible{outline:2px solid var(--journal-accent);outline-offset:2px}@media(max-width:400px){.companion-pagination{padding:8px 12px}.companion-pagination button{padding:8px 10px}}

/* Learned moves are shared by team and PC sheets. */
.companion-pc-moves{padding:4px 26px 24px;border-top:1px solid var(--journal-border)}
.companion-pc-moves h3{font:24px Georgia,serif;color:var(--journal-heading);margin:20px 0 8px}
.companion-pc-moves article{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px 18px;margin-top:12px;padding:15px;border:1px solid var(--journal-border);border-left:4px solid var(--pokemon-type-color);border-radius:10px;background:var(--journal-card)}
.companion-move-heading{min-width:0;align-self:center}.companion-move-heading strong{font-size:14px;color:var(--journal-heading);overflow-wrap:anywhere}.companion-move-heading>div{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-top:7px}
.companion-move-type{display:inline-block;padding:3px 9px;border-radius:5px;background:var(--pokemon-type-color);color:var(--pokemon-type-ink);font-size:10px;font-weight:bold}
.companion-move-class{font-size:11px;color:var(--journal-muted)}
.companion-pc-moves dl{display:flex;align-items:center;gap:18px;margin:0}.companion-pc-moves dt{font-size:10px;color:var(--journal-muted)}.companion-pc-moves dd{margin:4px 0 0;font-size:13px;text-align:right;color:var(--journal-heading);font-weight:bold}
.companion-move-description{grid-column:1 / -1;margin:0;padding-top:10px;border-top:1px solid var(--journal-border);font-size:12px;line-height:1.65;color:var(--journal-ink)}
.companion-ability-description{grid-column:1 / -1;margin:12px 0 0;padding:10px 12px;border-left:3px solid var(--journal-accent);background:var(--journal-soft);color:var(--journal-ink);font-size:12px;line-height:1.65}
.companion-identity>[data-ability-notice]{grid-column:1 / -1}
.companion-heading>div{min-width:0}.companion-heading h2{overflow-wrap:anywhere}
@media(max-width:540px){.companion-pc-moves{padding:4px 18px 18px}.companion-pc-moves article{grid-template-columns:minmax(0,1fr);gap:12px;padding:13px}.companion-pc-moves dl{justify-content:space-between;gap:10px}.companion-pc-moves dd{text-align:left}}

.companion-evolutions{padding:4px 26px 24px;border-top:1px solid var(--journal-border)}
.companion-evolutions h3{font:24px Georgia,serif;margin:20px 0 10px}.evolution-help{font-size:12px;line-height:1.6;color:var(--journal-muted)}
.companion-evolutions article{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--journal-border)}
.companion-evolutions .pokemon-portrait{width:60px;height:60px;flex-shrink:0}.companion-evolutions article>div{flex:1;min-width:0}.companion-evolutions article p{font-size:12px;margin:5px 0}.companion-evolutions small{display:block;font-size:11px;line-height:1.5;color:var(--journal-muted)}
.companion-evolutions button{min-height:44px;border:1px solid var(--journal-border);border-radius:8px;background:var(--journal-card);color:var(--journal-ink);font:700 12px Arial;padding:10px;cursor:pointer}.companion-evolutions button:disabled{opacity:.5;cursor:default}.companion-evolutions button:focus-visible{outline:2px solid #287366;outline-offset:3px}.evolution-stone{font-size:11px;color:var(--journal-muted)}.evolution-error{color:#a33f35}.evolution-success{color:#287366}
@media(max-width:540px){.companion-evolutions{padding:4px 18px 18px}.companion-evolutions article{flex-wrap:wrap;gap:10px}.companion-evolutions article>button,.companion-evolutions article>.evolution-stone{width:100%}.companion-evolutions article>div{min-width:130px}}

.companion-backdrop{position:fixed;inset:0;z-index:1400;display:grid;place-items:center;padding:20px;background:var(--journal-backdrop);backdrop-filter:blur(5px);font:14px/1.45 Arial,sans-serif;color:var(--journal-ink)}
.companion-sheet{width:min(790px,100%);max-height:calc(100dvh - 40px);overflow:auto;background:var(--journal-paper);border:1px solid var(--journal-border);border-radius:22px;box-shadow:var(--journal-shadow)}
.companion-heading{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 26px;background:var(--journal-card);color:var(--journal-heading);border-bottom:1px solid var(--journal-border)}
.companion-kicker{font-size:9px;letter-spacing:2px;color:var(--journal-muted)}.companion-heading h2{margin:4px 0 0;font:700 28px var(--journal-font)}.companion-close{width:44px;height:44px;border:1px solid var(--journal-border);border-radius:50%;background:#ffffff0d;color:inherit;font-size:28px;cursor:pointer}
.companion-body{display:grid;grid-template-columns:240px 1fr;gap:26px;padding:24px}.companion-identity{min-width:0}.companion-art{position:relative;display:grid;place-items:center;min-height:200px;border-radius:16px;background:var(--journal-soft);border:1px solid var(--journal-border)}
.companion-art .pokemon-portrait{width:160px;height:160px;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 10px 5px #20304025)}.companion-number{position:absolute;left:12px;top:12px;color:var(--journal-muted);font:10px monospace}.companion-level{position:absolute;bottom:10px;right:10px;border-radius:14px;padding:3px 12px;background:var(--journal-accent);color:var(--journal-on-accent);font-weight:700}
.companion-types{display:flex;gap:6px;justify-content:center;margin:12px 0 0}.companion-types span{background:var(--journal-soft);border:1px solid var(--journal-border);border-radius:20px;padding:3px 12px;font-size:11px;font-weight:bold}.companion-species{text-align:center;margin:5px 0 16px;color:var(--journal-muted);font-size:12px}.companion-health{display:flex;flex-wrap:wrap;gap:6px;font-size:11px;justify-content:space-between}.companion-health>div{width:100%;height:7px;border-radius:6px;background:var(--journal-border);overflow:hidden}.companion-health i{display:block;height:100%;background:linear-gradient(90deg,#389776,#83c791)}.companion-next{font-size:10px;color:var(--journal-muted);text-align:right;margin:6px 0 18px}
.companion-traits{display:flex;flex-direction:column;gap:8px;padding-top:12px;border-top:1px solid var(--journal-border);font-size:12px}.companion-traits>span{display:flex;align-items:center;justify-content:space-between;gap:10px}.companion-traits small{font-size:10px;color:var(--journal-muted);margin-top:-4px}
.companion-tabs{display:flex;border-bottom:2px solid var(--journal-border);gap:4px}.companion-tabs button{flex:1;min-height:44px;border:0;border-radius:10px 10px 0 0;background:var(--journal-soft);color:var(--journal-muted);font:bold 12px Arial;cursor:pointer;padding:8px}.companion-tabs button[aria-selected=true]{background:var(--journal-selected);color:var(--journal-heading);box-shadow:inset 0 -3px var(--journal-progress)}.companion-radar{display:block;width:100%;max-height:290px}.radar-ring{fill:none;stroke:#c6caba;stroke-width:1}.radar-axis{stroke:#d5d7cb;stroke-width:1}.radar-value{fill:#42a49e42;stroke:#388f98;stroke-width:2}.radar-dot{fill:#286579}.radar-label{font:9px Arial;fill:var(--journal-muted)}.radar-number{font:bold 12px Arial;fill:var(--journal-heading)}.companion-chart-caption{text-align:center;font-size:10px;color:var(--journal-muted);margin:0 0 15px}.companion-stat-lines{display:grid;grid-template-columns:1fr 1fr;gap:5px 18px}.companion-stat-lines>div{display:flex;justify-content:space-between;gap:5px;font-size:11px;padding:4px 0;border-bottom:1px dotted var(--journal-border)}.companion-stat-lines small{color:var(--journal-muted);font-size:9px;font-weight:normal}.companion-tip{font-size:11px;line-height:1.6;color:var(--journal-muted);background:var(--journal-soft);border-left:3px solid var(--journal-progress);padding:10px 12px;margin:16px 0 0}.companion-footer{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 20px;border-top:1px solid var(--journal-border);background:var(--journal-soft)}.companion-footer button{min-height:44px;padding:6px 15px;background:var(--journal-accent);color:var(--journal-on-accent);border:1px solid var(--journal-accent);border-radius:9px;font-weight:bold;cursor:pointer}.companion-footer span{font-size:8px;letter-spacing:1.5px;color:var(--journal-muted)}.companion-footer button:disabled{opacity:.35;cursor:default}button:focus-visible{outline:3px solid var(--journal-accent);outline-offset:2px}
@media(max-width:600px){.companion-backdrop{padding:10px}.companion-sheet{max-height:calc(100dvh - 20px);border-radius:16px}.companion-heading{padding:14px 16px}.companion-heading h2{font-size:24px}.companion-kicker{font-size:8px;letter-spacing:1px}.companion-body{grid-template-columns:1fr;padding:16px;gap:20px}.companion-identity{display:grid;grid-template-columns:115px 1fr;gap:5px 14px}.companion-art{grid-row:1 / 6;min-height:140px}.companion-art .pokemon-portrait{width:110px;height:110px}.companion-number{font-size:9px;left:8px;top:6px}.companion-level{font-size:10px;bottom:6px;right:8px}.companion-types{margin:0;align-self:end;justify-content:flex-start}.companion-types span{font-size:10px;padding:2px 8px}.companion-species{text-align:left;margin:0;font-size:11px}.companion-next{margin:0}.companion-traits{grid-column:1 / -1;margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:6px 14px}.companion-traits>small{grid-column:1 / -1;grid-row:2}.companion-traits>span:last-child{grid-column:1 / -1}.companion-footer{padding:10px 12px}.companion-footer span{display:none}.companion-radar{max-height:260px}.companion-stat-lines{gap:5px 12px}}
</style>

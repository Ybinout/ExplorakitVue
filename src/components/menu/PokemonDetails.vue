<template>
  <div class="companion-backdrop" @mousedown.self="$emit('close')" @keydown.esc.stop="$emit('close')" @keydown.tab="trapFocus">
    <section ref="dialog" class="companion-sheet" role="dialog" aria-modal="true" :aria-label="`Fiche de ${pokemon.name}`">
      <header class="companion-heading">
        <div><span class="companion-kicker">CARNET DE VOYAGE · {{ position }} / {{ total }}</span><h2>{{ pokemon.name }}</h2></div>
        <button ref="close" class="companion-close" aria-label="Fermer la fiche" @click="$emit('close')">×</button>
      </header>
      <div class="companion-body">
        <div class="companion-identity">
          <div class="companion-art"><span class="companion-number">N° {{ String(pokemon.spriteId).padStart(3, '0') }}</span><pokemon-portrait :src="`${$assetBase}img/pokemon/front/${pokemon.spriteId}.png`" :alt="pokemon.truename || pokemon.name" /><span class="companion-level">Niv. {{ pokemon.level }}</span></div>
          <div class="companion-types"><span v-for="type in pokemon.data.type" :key="type">{{ typeNames[type] || type }}</span></div>
          <p class="companion-species">{{ pokemon.truename }}</p>
          <div class="companion-health"><strong>PV</strong><span>{{ pokemon.currentHp }} / {{ pokemon.maxHp }}</span><div><i :style="{ width: hpPercent + '%' }"></i></div></div>
          <experience-bar :pokemon="pokemon" detailed />
          <p class="companion-next">Prochain niveau : {{ progress.remaining }} XP</p>
          <div class="companion-traits"><span>Nature <strong>{{ nature.label }}</strong></span><small>{{ nature.effect }}</small><span>Talent <strong>{{ abilityName }}</strong></span><span>Potentiel <potential-star :value="pokemon.k" /></span></div>
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
      <footer class="companion-footer"><button :disabled="position <= 1" @click="$emit('navigate', -1)">‹ Précédent</button><span>TON ÉQUIPE · TON AVENTURE</span><button :disabled="position >= total" @click="$emit('navigate', 1)">Suivant ›</button></footer>
    </section>
  </div>
</template>
<script>
import PotentialStar from '../PotentialStar.vue';
import PokemonPortrait from '../PokemonPortrait.vue';
import ExperienceBar from '../ExperienceBar.vue';
import { experienceProgress } from '@/services/pokemonProgress';
import { localizeAbilityName } from '@/services/i18n';
const stats = [
  { key: 'hp', label: 'PV', full: 'Points de vie' }, { key: 'attack', label: 'ATQ', full: 'Attaque' },
  { key: 'defense', label: 'DÉF', full: 'Défense' }, { key: 'speed', label: 'VIT', full: 'Vitesse' },
  { key: 'specialDefense', label: 'DÉF. SPÉ.', full: 'Défense spéciale' }, { key: 'specialAttack', label: 'ATQ. SPÉ.', full: 'Attaque spéciale' }
];
const natures = {
  Hardy: ['Hardi'], Docile: ['Docile'], Serious: ['Sérieux'], Bashful: ['Pudique'], Quirky: ['Bizarre'],
  Adamant: ['Rigide', 'attack', 'specialAttack'], Bold: ['Assuré', 'defense', 'attack'], Brave: ['Brave', 'attack', 'speed'],
  Calm: ['Calme', 'specialDefense', 'attack'], Careful: ['Prudent', 'specialDefense', 'specialAttack'], Gentle: ['Gentil', 'specialDefense', 'defense'],
  Hasty: ['Pressé', 'speed', 'defense'], Impish: ['Malin', 'defense', 'specialAttack'], Jolly: ['Jovial', 'speed', 'specialAttack'],
  Lax: ['Lâche', 'defense', 'specialDefense'], Lonely: ['Solo', 'attack', 'defense'], Mild: ['Doux', 'specialAttack', 'defense'],
  Modest: ['Modeste', 'specialAttack', 'attack'], Naive: ['Naïf', 'speed', 'specialDefense'], Naughty: ['Mauvais', 'attack', 'specialDefense'],
  Quiet: ['Discret', 'specialAttack', 'speed'], Rash: ['Foufou', 'specialAttack', 'specialDefense'], Relaxed: ['Relax', 'defense', 'speed'],
  Sassy: ['Malpoli', 'specialDefense', 'speed'], Timid: ['Timide', 'speed', 'attack']
};
export default {
  components: { ExperienceBar, PokemonPortrait, PotentialStar },
  props: { pokemon: { type: Object, required: true }, position: Number, total: Number },
  data: () => ({ mode: 'stats', stats, modes: [{ key: 'stats', label: 'Stats' }, { key: 'iv', label: 'Potentiel' }, { key: 'ev', label: 'Entraînement' }], previousFocus: null,
    typeNames: { Grass: 'Plante', Fire: 'Feu', Water: 'Eau', Bug: 'Insecte', Flying: 'Vol', Electric: 'Électrik', Ground: 'Sol', Rock: 'Roche', Ice: 'Glace', Fighting: 'Combat', Psychic: 'Psy', Ghost: 'Spectre', Dark: 'Ténèbres', Steel: 'Acier', Fairy: 'Fée' } }),
  computed: {
    progress() { return experienceProgress(this.pokemon); },
    hpPercent() { return Math.min(100, this.pokemon.currentHp / this.pokemon.maxHp * 100); },
    abilityName() { return localizeAbilityName(this.pokemon.passiveAbility, 'fr') || '—'; },
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
  mounted() { this.previousFocus = document.activeElement; this.$refs.close.focus(); },
  beforeDestroy() { this.previousFocus?.focus?.(); },
  methods: {
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
.companion-backdrop{position:fixed;inset:0;z-index:1400;display:grid;place-items:center;padding:20px;background:#0a1b2ccc;backdrop-filter:blur(5px);font:14px/1.45 Arial,sans-serif;color:#243950}
.companion-sheet{width:min(790px,100%);max-height:calc(100dvh - 40px);overflow:auto;background:#fbf6e9;border:2px solid #cfb886;border-radius:22px;box-shadow:0 0 0 5px #243950,0 25px 80px #0008}
.companion-heading{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 26px;background:#233c51;color:#fff8e9;border-bottom:3px solid #c2a66f}
.companion-kicker{font-size:9px;letter-spacing:2px;color:#dbc99d}.companion-heading h2{margin:4px 0 0;font:700 28px Georgia,serif}.companion-close{width:44px;height:44px;border:1px solid #83949f;border-radius:50%;background:#ffffff0d;color:inherit;font-size:28px;cursor:pointer}
.companion-body{display:grid;grid-template-columns:240px 1fr;gap:26px;padding:24px}.companion-identity{min-width:0}.companion-art{position:relative;display:grid;place-items:center;min-height:200px;border-radius:50% 50% 20px 20px;background:radial-gradient(circle,#fffdf6 30%,#e1e9d9 31%,#edf0df 58%,#d5dfce 59%,#e5ebdb 61%);border:1px solid #d1dacb}
.companion-art .pokemon-portrait{width:160px;height:160px;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 10px 5px #20304025)}.companion-number{position:absolute;left:12px;top:12px;color:#687965;font:10px monospace}.companion-level{position:absolute;bottom:10px;right:10px;border-radius:14px;padding:3px 12px;background:#233c51;color:#fff7e8;font-weight:700}
.companion-types{display:flex;gap:6px;justify-content:center;margin:12px 0 0}.companion-types span{background:#e7deca;border:1px solid #d0c0a1;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:bold}.companion-species{text-align:center;margin:5px 0 16px;color:#687878;font-size:12px}.companion-health{display:flex;flex-wrap:wrap;gap:6px;font-size:11px;justify-content:space-between}.companion-health>div{width:100%;height:7px;border-radius:6px;background:#dbded2;overflow:hidden}.companion-health i{display:block;height:100%;background:linear-gradient(90deg,#389776,#83c791)}.companion-next{font-size:10px;color:#647a88;text-align:right;margin:6px 0 18px}
.companion-traits{display:flex;flex-direction:column;gap:8px;padding-top:12px;border-top:1px solid #dfd4bd;font-size:12px}.companion-traits>span{display:flex;align-items:center;justify-content:space-between;gap:10px}.companion-traits small{font-size:10px;color:#6e7a81;margin-top:-4px}
.companion-tabs{display:flex;border-bottom:2px solid #d5c6a5;gap:4px}.companion-tabs button{flex:1;min-height:44px;border:0;border-radius:10px 10px 0 0;background:#eee5d1;color:#53636c;font:bold 12px Arial;cursor:pointer;padding:8px}.companion-tabs button[aria-selected=true]{background:#24495b;color:#fff7e8;box-shadow:inset 0 -3px #c8a357}.companion-radar{display:block;width:100%;max-height:290px}.radar-ring{fill:none;stroke:#c6caba;stroke-width:1}.radar-axis{stroke:#d5d7cb;stroke-width:1}.radar-value{fill:#42a49e42;stroke:#388f98;stroke-width:2}.radar-dot{fill:#286579}.radar-label{font:9px Arial;fill:#6c787b}.radar-number{font:bold 12px Arial;fill:#223e51}.companion-chart-caption{text-align:center;font-size:10px;color:#6d7b7b;margin:0 0 15px}.companion-stat-lines{display:grid;grid-template-columns:1fr 1fr;gap:5px 18px}.companion-stat-lines>div{display:flex;justify-content:space-between;gap:5px;font-size:11px;padding:4px 0;border-bottom:1px dotted #d4c8af}.companion-stat-lines small{color:#84908c;font-size:9px;font-weight:normal}.companion-tip{font-size:11px;line-height:1.6;color:#617178;background:#eee9d9;border-left:3px solid #c7ab6c;padding:10px 12px;margin:16px 0 0}.companion-footer{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 20px;border-top:1px solid #dbcfb8;background:#f1ebdc}.companion-footer button{min-height:44px;padding:6px 15px;background:#233c51;color:#fff8eb;border:1px solid #506678;border-radius:9px;font-weight:bold;cursor:pointer}.companion-footer span{font-size:8px;letter-spacing:1.5px;color:#899185}.companion-footer button:disabled{opacity:.35;cursor:default}button:focus-visible{outline:3px solid #d5a748;outline-offset:2px}
@media(max-width:600px){.companion-backdrop{padding:10px}.companion-sheet{max-height:calc(100dvh - 20px);border-radius:16px}.companion-heading{padding:14px 16px}.companion-heading h2{font-size:24px}.companion-kicker{font-size:8px;letter-spacing:1px}.companion-body{grid-template-columns:1fr;padding:16px;gap:20px}.companion-identity{display:grid;grid-template-columns:115px 1fr;gap:5px 14px}.companion-art{grid-row:1 / 6;min-height:140px}.companion-art .pokemon-portrait{width:110px;height:110px}.companion-number{font-size:9px;left:8px;top:6px}.companion-level{font-size:10px;bottom:6px;right:8px}.companion-types{margin:0;align-self:end;justify-content:flex-start}.companion-types span{font-size:10px;padding:2px 8px}.companion-species{text-align:left;margin:0;font-size:11px}.companion-next{margin:0}.companion-traits{grid-column:1 / -1;margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:6px 14px}.companion-traits>small{grid-column:1 / -1;grid-row:2}.companion-traits>span:last-child{grid-column:1 / -1}.companion-footer{padding:10px 12px}.companion-footer span{display:none}.companion-radar{max-height:260px}.companion-stat-lines{gap:5px 12px}}
</style>

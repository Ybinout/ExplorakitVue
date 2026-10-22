<template>
  <div class="dex-backdrop" @mousedown.self="$emit('close')">
    <section class="dex" role="dialog" aria-modal="true" aria-labelledby="dex-title" @keydown.stop="handleKeydown" @keyup.stop>
      <header class="dex-header">
        <div class="dex-brand">
          <span class="dex-device" aria-hidden="true"><i></i><b></b><b></b></span>
          <div><p class="dex-eyebrow">RiftMon <span>/ {{ tr('dexJournal') }}</span></p><h2 id="dex-title">{{ tr('pokedex') }}</h2></div>
        </div>
        <button ref="close" class="dex-close" :aria-label="tr('close')" @click="$emit('close')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </header>

      <div class="dex-summary">
        <div class="dex-summary-copy"><span class="dex-ball" aria-hidden="true"></span><span>{{ tr('dexCollection') }}</span></div>
        <div class="dex-totals"><strong>{{ pokedex.caught || 0 }}<span> / {{ pokedex.total || 493 }}</span></strong><span>{{ tr('caughtPlural') }}</span></div>
        <div class="dex-progress" role="progressbar" :aria-label="tr('dexCollection')" :aria-valuenow="caughtPercent" aria-valuemin="0" aria-valuemax="100"><span :style="{ width: caughtPercent + '%' }"></span></div>
      </div>

      <div class="dex-tools">
        <div class="dex-search-row">
          <label class="dex-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg>
            <input v-model="search" type="search" :placeholder="tr('dexSearch')" :aria-label="tr('searchPokemon')" autocomplete="off" spellcheck="false">
          </label>
          <select v-model="region" class="dex-region" :aria-label="tr('dexRegion')">
            <option value="all">{{ tr('dexAllRegions') }}</option>
            <option v-for="area in regions" :key="area.name" :value="area.name">{{ area.name }}</option>
          </select>
        </div>
        <div class="dex-filter-row">
          <div class="dex-filters" role="group" :aria-label="tr('dexFilter')">
            <button v-for="filter in filters" :key="filter.key" :class="{ selected: status === filter.key }" :aria-pressed="status === filter.key" @click="status = filter.key">
              {{ tr(filter.label) }}<span>{{ filter.count }}</span>
            </button>
          </div>
          <span class="dex-order">{{ tr('dexNumberOrder') }} <span aria-hidden="true">↓</span></span>
        </div>
      </div>

      <div ref="scroll" class="dex-scroll" :aria-busy="loading" tabindex="0" :aria-label="tr('dexCollection')">
        <div v-if="loading" class="dex-empty" role="status"><span class="dex-ball" aria-hidden="true"></span><p>{{ tr('syncingServer') }}</p></div>
        <div v-else-if="filteredEntries.length" class="dex-grid">
          <article v-for="pokemon in filteredEntries" :key="pokemon.id" :class="['dex-entry', { 'is-unknown': !pokemon.seen, 'is-caught': pokemon.caught }]">
            <div class="dex-entry-top"><span class="dex-number">#{{ String(pokemon.id).padStart(3, '0') }}</span><span v-if="pokemon.caught" class="dex-caught" :aria-label="tr('caught')" :title="tr('caught')"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 8 3 3 5-6"/></svg></span><span v-else-if="pokemon.seen" class="dex-seen" :aria-label="tr('spotted')" :title="tr('spotted')"></span></div>
            <div class="dex-sprite">
              <img v-if="pokemon.seen" :src="`${$assetBase}img/pokemon/front/${pokemon.id}.png`" alt="" width="80" height="80" loading="lazy" decoding="async">
              <span v-else class="dex-unregistered" aria-hidden="true"><span class="dex-ball"></span></span>
            </div>
            <h3 :title="pokemon.seen ? pokemon.name : tr('dexUndiscovered')">{{ pokemon.seen ? pokemon.name : '— — —' }}</h3>
            <div v-if="pokemon.seen" class="dex-types"><span v-for="type in pokemon.types || []" :key="type" :class="['dex-type', `type-${type.toLowerCase()}`]">{{ typeName(type) }}</span></div>
            <p v-else class="dex-unknown-label">{{ tr('dexUndiscovered') }}</p>
          </article>
        </div>
        <div v-else class="dex-empty" role="status">
          <span class="dex-ball" aria-hidden="true"></span><h3>{{ tr('empty') }}</h3><p>{{ tr('dexEmptyHelp') }}</p>
          <button @click="resetFilters">{{ tr('dexReset') }}</button>
        </div>
      </div>
      <footer class="dex-footer"><span role="status">{{ tr('dexResults', { count: loading ? '…' : filteredEntries.length }) }}</span><span>{{ tr('dexGenerations') }} <b>I — IV</b></span></footer>
    </section>
  </div>
</template>

<script>
import { translate } from '@/services/i18n';

const regions = [
  { name: 'Kanto', first: 1, last: 151 },
  { name: 'Johto', first: 152, last: 251 },
  { name: 'Hoenn', first: 252, last: 386 },
  { name: 'Sinnoh', first: 387, last: 493 }
];
const frenchTypes = { Normal: 'Normal', Fire: 'Feu', Water: 'Eau', Electric: 'Électrik', Grass: 'Plante', Ice: 'Glace', Fighting: 'Combat', Poison: 'Poison', Ground: 'Sol', Flying: 'Vol', Psychic: 'Psy', Bug: 'Insecte', Rock: 'Roche', Ghost: 'Spectre', Dragon: 'Dragon', Dark: 'Ténèbres', Steel: 'Acier', Fairy: 'Fée' };
const normalizeSearch = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default {
  name: 'PokedexPanel',
  props: {
    pokedex: { type: Object, required: true },
    loading: { type: Boolean, default: false },
    language: { type: String, default: 'fr' }
  },
  data() { return { search: '', status: 'all', region: 'all', regions }; },
  computed: {
    caughtPercent() { return Math.max(0, Math.min(100, Math.round((this.pokedex.caught || 0) / (this.pokedex.total || 493) * 100))); },
    filters() {
      return [
        { key: 'all', label: 'all', count: this.pokedex.total || 493 },
        { key: 'seen', label: 'seen', count: this.pokedex.seen || 0 },
        { key: 'caught', label: 'caughtPlural', count: this.pokedex.caught || 0 }
      ];
    },
    filteredEntries() {
      const query = normalizeSearch(this.search.trim()).replace(/^#/, '');
      const area = regions.find((item) => item.name === this.region);
      return (this.pokedex.entries || []).filter((pokemon) => {
        if (area && (pokemon.id < area.first || pokemon.id > area.last)) return false;
        if (this.status === 'seen' && !pokemon.seen) return false;
        if (this.status === 'caught' && !pokemon.caught) return false;
        return !query || String(pokemon.id).padStart(3, '0').includes(query) || (pokemon.seen && normalizeSearch(pokemon.name).includes(query));
      }).slice().sort((a, b) => a.id - b.id);
    }
  },
  watch: {
    search: 'resetScroll', status: 'resetScroll', region: 'resetScroll'
  },
  mounted() {
    this.previousFocus = document.activeElement;
    this.$refs.close.focus({ preventScroll: true });
  },
  beforeDestroy() {
    if (this.previousFocus?.isConnected) this.previousFocus.focus({ preventScroll: true });
  },
  methods: {
    tr(key, parameters) { return translate(this.language, key, parameters); },
    typeName(type) { return this.language === 'en' ? type : frenchTypes[type] || type; },
    resetScroll() { if (this.$refs.scroll) this.$refs.scroll.scrollTop = 0; },
    resetFilters() { this.search = ''; this.status = 'all'; this.region = 'all'; },
    handleKeydown(event) {
      if (event.key === 'Escape') { event.preventDefault(); this.$emit('close'); }
      if (event.key !== 'Tab') return;
      const elements = [...this.$el.querySelectorAll('button, input, select, [tabindex="0"]')];
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }
};
</script>

<style scoped>
.dex-backdrop {
  position:fixed;
  inset:0;
  z-index:1200;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:24px;
  background:var(--journal-backdrop);
  backdrop-filter:blur(7px);
}
.dex,.dex * {
  box-sizing:border-box;
  font-family:var(--journal-font);
}
.dex {
  display:flex;
  flex-direction:column;
  width:820px;
  max-width:100%;
  height:min(780px,90dvh);
  min-height:0;
  overflow:hidden;
  color:var(--journal-ink);
  background:var(--journal-paper);
  border:1px solid var(--journal-border);
  border-radius:20px;
  box-shadow:0 24px 90px #0005;
  text-align:left;
  font-size:13px;
  line-height:1.4;
  color-scheme:light;
}
.dex button,.dex input,.dex select {
  font:inherit;
}
.dex button {
  cursor:pointer;
}
.dex button:focus-visible,.dex select:focus-visible,.dex input:focus-visible,.dex-scroll:focus-visible {
  outline:2px solid var(--journal-accent);
  outline-offset:3px;
}
.dex-header {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  padding:22px 26px 18px;
  background:var(--journal-card);
}
.dex-brand {
  display:flex;
  align-items:center;
  gap:13px;
}
.dex-eyebrow {
  margin:0 0 3px;
  color:var(--journal-muted);
  font-size:9px;
  font-weight:700;
  letter-spacing:.15em;
  text-transform:uppercase;
}
.dex-eyebrow span {
  font-weight:400;
  letter-spacing:.06em;
}
.dex h2 {
  margin:0;
  color:var(--journal-heading);
  font-size:28px;
  font-weight:700;
  letter-spacing:-1.2px;
  line-height:1.15;
}
.dex-device {
  display:flex;
  position:relative;
  align-items:flex-end;
  justify-content:center;
  gap:3px;
  width:34px;
  height:44px;
  padding-bottom:9px;
  border-radius:7px 7px 10px 7px;
  background:#cc6250;
  box-shadow:inset -4px 0 #b84e41;
  transform:rotate(-7deg);
}
.dex-device i {
  position:absolute;
  top:7px;
  left:8px;
  width:12px;
  height:12px;
  border:3px solid #fae7d3;
  border-radius:50%;
  background:#9bd0d0;
}
.dex-device b {
  width:7px;
  height:3px;
  background:#f3b7a1;
  border-radius:2px;
}
.dex-close {
  display:grid;
  place-items:center;
  flex:none;
  width:44px;
  height:44px;
  padding:11px;
  border:1px solid var(--journal-border);
  border-radius:50%;
  background:transparent;
  color:var(--journal-muted);
}
.dex-close:hover {
  background:var(--journal-soft);
}
.dex svg {
  display:block;
  fill:none;
  stroke:currentColor;
  stroke-width:1.6;
  stroke-linecap:round;
  stroke-linejoin:round;
  width:100%;
  height:100%;
}
.dex-summary {
  display:grid;
  grid-template-columns:1fr auto;
  align-items:center;
  gap:10px 20px;
  padding:13px 26px 16px;
  background:var(--journal-soft);
  border-top:1px solid var(--journal-border);
  border-bottom:1px solid var(--journal-border);
}
.dex-summary-copy {
  display:flex;
  align-items:center;
  gap:9px;
  color:var(--journal-muted);
  font-size:12px;
}
.dex-totals {
  display:flex;
  align-items:baseline;
  gap:7px;
  color:var(--journal-muted);
  font-size:11px;
}
.dex-totals strong {
  color:var(--journal-heading);
  font-size:20px;
  font-weight:700;
  font-variant-numeric:tabular-nums;
  letter-spacing:-.5px;
}
.dex-totals strong span {
  font-weight:400;
  font-size:13px;
  color:var(--journal-muted);
  letter-spacing:0;
}
.dex-ball {
  position:relative;
  display:block;
  width:18px;
  height:18px;
  flex:none;
  border:1.5px solid currentColor;
  border-radius:50%;
  overflow:hidden;
}
.dex-ball::before {
  content:'';
  position:absolute;
  left:0;
  right:0;
  top:calc(50% - .75px);
  border-top:1.5px solid currentColor;
}
.dex-ball::after {
  content:'';
  position:absolute;
  left:50%;
  top:50%;
  transform:translate(-50%,-50%);
  width:6px;
  height:6px;
  background:var(--journal-soft);
  border:1.5px solid currentColor;
  border-radius:50%;
}
.dex-progress {
  grid-column:1/-1;
  height:3px;
  overflow:hidden;
  background:var(--journal-border);
  border-radius:3px;
}
.dex-progress>span {
  display:block;
  height:100%;
  background:var(--journal-progress);
  border-radius:3px;
}
.dex-tools {
  flex:none;
  padding:18px 26px 0;
  background:var(--journal-paper);
}
.dex-search-row {
  display:flex;
  gap:10px;
}
.dex-search {
  display:flex;
  align-items:center;
  flex:1;
  gap:10px;
  min-width:0;
  min-height:44px;
  padding:0 13px;
  border:1px solid var(--journal-border);
  border-radius:9px;
  background:var(--journal-card);
}
.dex-search svg {
  width:17px;
  height:17px;
  flex:none;
  color:var(--journal-muted);
}
.dex-search input {
  min-width:0;
  width:100%;
  height:42px;
  border:0;
  background:transparent;
  color:var(--journal-heading);
  font-size:13px;
}
.dex-search input::placeholder {
  color:var(--journal-muted);
}
.dex-region {
  max-width:150px;
  min-width:0;
  min-height:44px;
  padding:0 10px;
  border:1px solid var(--journal-border);
  border-radius:9px;
  background:var(--journal-card);
  color:var(--journal-ink);
  font-size:12px;
}
.dex-filter-row {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  margin-top:12px;
  padding-bottom:12px;
  border-bottom:1px solid var(--journal-border);
}
.dex-filters {
  display:flex;
  gap:5px;
}
.dex-filters button {
  display:flex;
  align-items:center;
  gap:7px;
  min-height:44px;
  padding:0 12px;
  border:1px solid transparent;
  border-radius:8px;
  background:transparent;
  color:var(--journal-muted);
  font-size:12px;
  text-transform:capitalize;
}
.dex-filters button:hover {
  background:var(--journal-soft);
}
.dex-filters button.selected {
  border-color:var(--journal-border);
  color:var(--journal-accent);
  background:var(--journal-selected);
  font-weight:700;
}
.dex-filters button span {
  font-size:10px;
  color:var(--journal-muted);
  font-variant-numeric:tabular-nums;
}
.dex-order {
  color:var(--journal-muted);
  font-size:10px;
  white-space:nowrap;
}
.dex-order span {
  margin-left:6px;
}
.dex-scroll {
  flex:1;
  min-height:0;
  overflow:auto;
  overscroll-behavior:contain;
  scrollbar-width:thin;
  scrollbar-color:var(--journal-muted) transparent;
  padding:16px 26px 20px;
  outline-offset:-3px!important;
}
.dex-grid {
  display:grid;
  grid-template-columns:repeat(5,minmax(0,1fr));
  gap:9px;
}
.dex-entry {
  position:relative;
  min-width:0;
  padding:10px 9px 12px;
  border:1px solid var(--journal-border);
  border-radius:10px;
  background:var(--journal-card);
}
.dex-entry.is-caught {
  border-color:#9bb8cf;
  background:var(--journal-selected);
}
.dex-entry-top {
  display:flex;
  align-items:center;
  justify-content:space-between;
  height:15px;
}
.dex-number {
  color:var(--journal-muted);
  font-size:10px;
  font-variant-numeric:tabular-nums;
  letter-spacing:.04em;
}
.dex-caught {
  display:block;
  width:16px;
  height:16px;
  border-radius:50%;
  color:#fff;
  background:#6b8b59;
}
.dex-caught svg {
  stroke-width:1.8;
}
.dex-seen {
  width:5px;
  height:5px;
  margin-right:5px;
  border-radius:50%;
  background:#bca061;
}
.dex-sprite {
  display:flex;
  align-items:center;
  justify-content:center;
  height:78px;
}
.dex-sprite img {
  width:80px;
  height:80px;
  object-fit:contain;
  image-rendering:pixelated;
  filter:drop-shadow(0 4px 2px #31412216);
}
.dex h3 {
  margin:2px 0 7px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  text-align:center;
  font-size:12px;
  font-weight:600;
  line-height:1.4;
  letter-spacing:-.15px;
}
.dex-types {
  display:flex;
  justify-content:center;
  gap:4px;
  min-height:17px;
}
.dex-type {
  padding:2px 5px;
  border-radius:4px;
  background:#efeee7;
  color:#727363;
  font-size:9px;
  line-height:13px;
}
.type-grass,.type-bug {
  color:#59703d;
  background:#e8efd8;
}
.type-poison,.type-ghost,.type-psychic {
  color:#826785;
  background:#eee5ed;
}
.type-water,.type-ice,.type-flying {
  color:#507c96;
  background:#e5eef4;
}
.type-fire,.type-fighting {
  color:#a66b49;
  background:#f7e6d9;
}
.type-electric,.type-ground,.type-rock {
  color:#8d7a3b;
  background:#f3edcf;
}
.type-fairy {
  color:#a16e81;
  background:#f6e6ef;
}
.type-dark,.type-dragon,.type-steel {
  color:#697587;
  background:#e9ebf1;
}
.dex-entry.is-unknown {
  background:var(--journal-soft);
  border-color:var(--journal-border);
}
.is-unknown .dex-number {
  color:var(--journal-muted);
}
.dex-unregistered {
  display:grid;
  place-items:center;
  width:50px;
  height:50px;
  border:1px dashed var(--journal-border);
  border-radius:50%;
  color:var(--journal-muted);
}
.dex-unregistered .dex-ball {
  width:28px;
  height:28px;
}
.dex-unregistered .dex-ball::after {
  background:var(--journal-soft);
  width:9px;
  height:9px;
}
.is-unknown h3 {
  color:var(--journal-muted);
  font-size:10px;
  letter-spacing:2px;
  margin-bottom:9px;
}
.dex-unknown-label {
  margin:0;
  color:var(--journal-muted);
  text-align:center;
  font-size:10px;
  line-height:17px;
}
.dex-empty {
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  min-height:230px;
  height:100%;
  gap:10px;
  color:var(--journal-muted);
  text-align:center;
}
.dex-empty>.dex-ball {
  width:32px;
  height:32px;
}
.dex-empty h3,.dex-empty p {
  margin:0;
  white-space:normal;
}
.dex-empty h3 {
  font-size:16px;
  color:var(--journal-heading);
}
.dex-empty button {
  min-height:44px;
  margin-top:8px;
  padding:0 16px;
  border:1px solid var(--journal-border);
  border-radius:8px;
  background:var(--journal-selected);
  color:var(--journal-accent);
  font-size:12px;
}
.dex-footer {
  display:flex;
  flex:none;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  padding:12px 26px;
  border-top:1px solid var(--journal-border);
  background:var(--journal-soft);
  color:var(--journal-muted);
  font-size:10px;
  letter-spacing:.02em;
}
.dex-footer b {
  margin-left:6px;
  color:var(--journal-muted);
  font-size:10px;
  font-weight:500;
}
@media(max-width:600px) {
  .dex-backdrop {
    padding:10px;
  }
  .dex {
    height:calc(100dvh - 20px);
    max-height:850px;
    border-radius:15px;
  }
  .dex-header {
    padding:16px;
  }
  .dex h2 {
    font-size:25px;
  }
  .dex-eyebrow {
    font-size:8px;
  }
  .dex-eyebrow span {
    display:none;
  }
  .dex-summary {
    padding:10px 16px 13px;
  }
  .dex-totals {
    gap:4px;
    font-size:10px;
  }
  .dex-totals strong {
    font-size:18px;
  }
  .dex-summary-copy {
    font-size:11px;
  }
  .dex-tools {
    padding:13px 12px 0;
  }
  .dex-search-row {
    gap:7px;
  }
  .dex-search {
    padding:0 9px;
    gap:6px;
  }
  .dex-search input {
    font-size:16px;
  }
  .dex-region {
    max-width:123px;
    font-size:11px;
    padding:0 5px;
  }
  .dex-filter-row {
    margin-top:8px;
    padding-bottom:9px;
  }
  .dex-filters {
    width:100%;
    gap:5px;
  }
  .dex-filters button {
    flex:1;
    justify-content:center;
    padding:0 6px;
    font-size:11px;
    gap:6px;
  }
  .dex-order {
    display:none;
  }
  .dex-scroll {
    padding:12px;
  }
  .dex-grid {
    grid-template-columns:repeat(3,minmax(0,1fr));
    gap:7px;
  }
  .dex-entry {
    padding:8px 5px 10px;
    border-radius:8px;
  }
  .dex-sprite {
    height:68px;
  }
  .dex-sprite img {
    width:72px;
    height:72px;
  }
  .dex h3 {
    font-size:11px;
  }
  .is-unknown h3 {
    font-size:10px;
  }
  .dex-types {
    gap:3px;
  }
  .dex-type {
    font-size:8px;
    padding:1px 4px;
  }
  .dex-unknown-label {
    font-size:9px;
  }
  .dex-footer {
    padding:11px 14px;
    padding-bottom:max(11px,env(safe-area-inset-bottom));
  }
}
@media(max-width:350px) {
  .dex-backdrop {
    padding:5px;
  }
  .dex {
    height:calc(100dvh - 10px);
  }
  .dex-header {
    padding:12px;
  }
  .dex-grid {
    gap:5px;
  }
  .dex-scroll {
    padding:10px;
  }
  .dex-summary {
    padding-inline:12px;
  }
  .dex-search input {
    width:100%;
  }
  .dex-region {
    max-width:108px;
  }
  .dex-entry {
    padding-inline:3px;
  }
}
@media(max-height:500px) and (min-width:601px) {
  .dex-backdrop {
    padding:8px;
  }
  .dex {
    height:calc(100dvh - 16px);
  }
  .dex-header {
    padding:8px 20px;
  }
  .dex h2 {
    font-size:22px;
  }
  .dex-device {
    height:36px;
  }
  .dex-summary {
    padding:6px 20px;
    gap:4px;
  }
  .dex-tools {
    display:flex;
    align-items:center;
    gap:10px;
    padding:8px 20px;
  }
  .dex-search-row {
    flex:1;
    min-width:0;
  }
  .dex-filter-row {
    margin:0;
    padding:0;
    border:0;
  }
  .dex-order {
    display:none;
  }
  .dex-filters button {
    padding:0 8px;
    font-size:11px;
  }
  .dex-footer {
    padding:6px 20px;
  }
}
</style>

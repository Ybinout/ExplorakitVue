<template>
  <div v-if="active" class="info-backdrop" @mousedown.self="$emit('close')">
    <section class="info-panel" role="dialog" aria-modal="true" :aria-label="panelTitle">
      <header class="info-header">
        <div>
          <p class="info-kicker">Explorakit</p>
          <h2>{{ panelTitle }}</h2>
        </div>
        <button class="close-button" :aria-label="tr('close')" @click="$emit('close')">×</button>
      </header>

      <div v-if="loading" class="panel-state">{{ tr('syncingServer') }}</div>

      <template v-else-if="active === 'pokedex'">
        <div class="stat-row">
          <div class="stat-card"><strong>{{ pokedex.seen || 0 }}</strong><span>{{ tr('seen') }}</span></div>
          <div class="stat-card"><strong>{{ pokedex.caught || 0 }}</strong><span>{{ tr('caughtPlural') }}</span></div>
          <div class="stat-card"><strong>{{ pokedex.total || 493 }}</strong><span>{{ tr('species') }}</span></div>
        </div>
        <div class="toolbar">
          <input v-model.trim="search" type="search" :placeholder="tr('searchPokemon')" :aria-label="tr('searchPokemon')">
          <select v-model="pokedexFilter" :aria-label="tr('pokedex')">
            <option value="all">{{ tr('all') }}</option>
            <option value="seen">{{ tr('seen') }}</option>
            <option value="caught">{{ tr('caughtPlural') }}</option>
          </select>
        </div>
        <div class="pokedex-grid">
          <article
            v-for="pokemon in filteredPokedex"
            :key="pokemon.id"
            :class="['pokedex-entry', { unknown: !pokemon.seen }]"
          >
            <img v-if="pokemon.seen" :src="`/img/pokemon/front/${pokemon.id}.png`" alt="">
            <div v-else class="unknown-sprite">?</div>
            <div class="entry-copy">
              <span class="entry-number">N° {{ String(pokemon.id).padStart(3, '0') }}</span>
              <strong>{{ pokemon.seen ? pokemon.name : '???' }}</strong>
              <small>{{ pokemon.caught ? tr('caught') : pokemon.seen ? tr('spotted') : tr('unknown') }}</small>
            </div>
            <span v-if="pokemon.caught" class="caught-mark" title="Capturé">●</span>
          </article>
        </div>
        <div v-if="filteredPokedex.length === 0" class="panel-state">{{ tr('empty') }}</div>
      </template>

      <template v-else-if="active === 'progress'">
        <div class="progress-columns">
          <section>
            <h3>{{ tr('activeQuests') }}</h3>
            <article v-for="quest in activeQuests" :key="quest.key" class="quest-card">
              <div class="quest-heading"><strong>{{ quest.title }}</strong><span>{{ quest.progress }}/{{ quest.target }}</span></div>
              <p>{{ quest.description }}</p>
              <div class="quest-track"><span :style="{ width: questPercent(quest) + '%' }"></span></div>
            </article>
            <p v-if="activeQuests.length === 0" class="empty-copy">{{ tr('noActiveQuest') }}</p>
          </section>
          <section>
            <h3>{{ tr('completedQuests') }}</h3>
            <article v-for="quest in completedQuests" :key="quest.key" class="quest-card completed">
              <strong>{{ quest.title }}</strong><span class="completed-label">{{ tr('completed') }}</span>
            </article>
            <p v-if="completedQuests.length === 0" class="empty-copy">{{ tr('noCompletedQuest') }}</p>
          </section>
        </div>
        <h3>{{ tr('badges') }}</h3>
        <div class="badge-grid">
          <div v-for="badge in progress.badges || []" :key="badge.key" :class="['badge-card', { earned: badge.earned }]">
            <span class="badge-medal">◆</span>
            <strong>{{ badge.earned ? badge.name : tr('unknownBadge') }}</strong>
            <small>{{ badge.earned ? tr('earned') : tr('toConquer') }}</small>
          </div>
        </div>
      </template>

      <template v-else-if="active === 'save'">
        <div :class="['save-orb', saveState.status]">{{ saveIcon }}</div>
        <h3 class="save-title">{{ saveTitle }}</h3>
        <p class="save-copy">{{ saveState.message || tr('autoSave') }}</p>
        <p v-if="saveState.lastSyncedAt" class="save-date">{{ tr('lastSync', { date: formatDate(saveState.lastSyncedAt) }) }}</p>
        <button class="primary-button" :disabled="saveState.status === 'syncing'" @click="$emit('save')">
          {{ saveState.status === 'syncing' ? tr('syncing') : tr('syncNow') }}
        </button>
      </template>

      <template v-else-if="active === 'options'">
        <div class="option-list">
          <label class="option-row">
            <span><strong>{{ tr('masterVolume') }}</strong><small>{{ tr('volumeHelp') }}</small></span>
            <div class="option-control volume-control">
              <input :value="preferences.masterVolume" type="range" min="0" max="100" step="5" @input="updatePreference('masterVolume', Number($event.target.value))">
              <b>{{ preferences.masterVolume }}%</b>
            </div>
          </label>
          <label class="option-row">
            <span><strong>{{ tr('textSpeed') }}</strong><small>{{ tr('textSpeedHelp') }}</small></span>
            <select :value="preferences.textSpeed" @change="updatePreference('textSpeed', Number($event.target.value))">
              <option :value="45">{{ tr('slow') }}</option>
              <option :value="120">{{ tr('normal') }}</option>
              <option :value="10000">{{ tr('instant') }}</option>
            </select>
          </label>
          <label class="option-row">
            <span><strong>{{ tr('animations') }}</strong><small>{{ tr('animationsHelp') }}</small></span>
            <input class="switch" :checked="preferences.animationsEnabled" type="checkbox" @change="updatePreference('animationsEnabled', $event.target.checked)">
          </label>
          <label class="option-row">
            <span><strong>{{ tr('language') }}</strong><small>{{ tr('languageHelp') }}</small></span>
            <select :value="preferences.language" @change="updatePreference('language', $event.target.value)">
              <option value="fr">{{ tr('french') }}</option>
              <option value="en">{{ tr('english') }}</option>
            </select>
          </label>
        </div>
        <p class="options-note">{{ tr('localOptions') }}</p>
      </template>
    </section>
  </div>
</template>

<script>
import { translate } from '@/services/i18n';

export default {
  name: 'GameInfoPanels',
  props: {
    active: { type: String, default: '' },
    loading: { type: Boolean, default: false },
    pokedex: { type: Object, default: () => ({ entries: [] }) },
    progress: { type: Object, default: () => ({ quests: [], badges: [] }) },
    saveState: { type: Object, default: () => ({ status: 'idle' }) },
    preferences: { type: Object, required: true }
  },
  data() {
    return { search: '', pokedexFilter: 'all' };
  },
  computed: {
    panelTitle() {
      const titleKey = { pokedex: 'pokedex', progress: 'progress', save: 'save', options: 'options' }[this.active] || 'menu';
      return this.tr(titleKey);
    },
    filteredPokedex() {
      const entries = Array.isArray(this.pokedex.entries) ? this.pokedex.entries : [];
      const query = this.search.toLocaleLowerCase(this.preferences.language || 'fr');
      return entries.filter((pokemon) => {
        if (this.pokedexFilter === 'seen' && !pokemon.seen) return false;
        if (this.pokedexFilter === 'caught' && !pokemon.caught) return false;
        if (!query) return true;
        return String(pokemon.id).includes(query) || (pokemon.seen && pokemon.name.toLocaleLowerCase(this.preferences.language || 'fr').includes(query));
      });
    },
    activeQuests() {
      return (this.progress.quests || []).filter((quest) => quest.status === 'active');
    },
    completedQuests() {
      return (this.progress.quests || []).filter((quest) => quest.status === 'completed');
    },
    saveIcon() {
      return this.saveState.status === 'error' ? '!' : this.saveState.status === 'syncing' ? '↻' : '✓';
    },
    saveTitle() {
      if (this.saveState.status === 'syncing') return this.tr('syncRunning');
      if (this.saveState.status === 'error') return this.tr('syncInterrupted');
      if (this.saveState.status === 'synced') return this.tr('gameSynced');
      return this.tr('autoSaveActive');
    }
  },
  methods: {
    tr(key, parameters) {
      return translate(this.preferences.language, key, parameters);
    },
    questPercent(quest) {
      return Math.max(0, Math.min(100, (Number(quest.progress) / Math.max(1, Number(quest.target))) * 100));
    },
    formatDate(value) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? '' : date.toLocaleString(this.preferences.language === 'en' ? 'en-GB' : 'fr-FR');
    },
    updatePreference(key, value) {
      this.$emit('update-preferences', { ...this.preferences, [key]: value });
    }
  }
};
</script>

<style scoped>
.info-backdrop{position:fixed;inset:0;z-index:1200;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(3,8,18,.72);backdrop-filter:blur(6px)}
.info-panel{width:min(920px,100%);max-height:min(760px,92vh);overflow:auto;padding:24px;color:#eef6ff;background:linear-gradient(145deg,#16243a,#0c1424 62%);border:1px solid #55749d;border-radius:18px;box-shadow:0 22px 70px rgba(0,0,0,.55);font-family:Arial,sans-serif}
.info-header{position:sticky;top:-24px;z-index:2;display:flex;align-items:center;justify-content:space-between;margin:-24px -24px 20px;padding:20px 24px 16px;background:rgba(13,22,39,.96);border-bottom:1px solid #334a6b}.info-header h2{margin:2px 0 0;font-size:26px}.info-kicker{margin:0;color:#6ed5c3;font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}.close-button{width:38px;height:38px;color:white;background:#253a58;border:1px solid #6581a7;border-radius:10px;font-size:25px;cursor:pointer}
.panel-state,.empty-copy{padding:28px;text-align:center;color:#9eb0c8}.stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}.stat-card{display:flex;flex-direction:column;padding:14px 18px;background:#20334e;border:1px solid #3e5a7f;border-radius:12px}.stat-card strong{font-size:25px;color:#73e0c8}.stat-card span{font-size:12px;color:#afbed1;text-transform:uppercase;letter-spacing:.08em}.toolbar{display:flex;gap:10px;margin-bottom:14px}.toolbar input,.toolbar select,.option-row select{padding:11px 12px;color:#eaf3ff;background:#0c1628;border:1px solid #425e84;border-radius:9px}.toolbar input{flex:1}.pokedex-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.pokedex-entry{position:relative;display:flex;align-items:center;min-height:84px;padding:8px;background:#1b2c45;border:1px solid #3a567c;border-radius:12px}.pokedex-entry.unknown{opacity:.62}.pokedex-entry img,.unknown-sprite{width:68px;height:68px;object-fit:contain}.unknown-sprite{display:grid;place-items:center;font-size:32px;color:#60718a}.entry-copy{display:flex;min-width:0;flex-direction:column;gap:3px}.entry-copy strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.entry-copy small,.entry-number{color:#9eafc5;font-size:11px}.caught-mark{position:absolute;right:10px;top:8px;color:#63dd9c}.progress-columns{display:grid;grid-template-columns:1fr 1fr;gap:18px}.progress-columns h3,.info-panel>h3{margin:8px 0 12px;color:#b9d5ff}.quest-card{position:relative;margin-bottom:10px;padding:14px;background:#1b2c45;border:1px solid #3e5a7f;border-radius:11px}.quest-card.completed{display:flex;align-items:center;justify-content:space-between;border-color:#367963}.quest-heading{display:flex;justify-content:space-between;gap:12px}.quest-card p{margin:7px 0 11px;color:#b0bfd1;font-size:13px;line-height:1.45}.quest-track{height:6px;overflow:hidden;background:#08111f;border-radius:4px}.quest-track span{display:block;height:100%;background:linear-gradient(90deg,#4ba7e8,#58d6a5)}.completed-label{color:#66d8a7;font-size:12px}.badge-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.badge-card{display:flex;flex-direction:column;align-items:center;gap:7px;padding:15px 8px;text-align:center;color:#75859a;background:#111d30;border:1px solid #293d5a;border-radius:12px}.badge-card.earned{color:#ffe7a1;border-color:#c69637;background:#3a2d16}.badge-medal{font-size:30px}.badge-card small{font-size:10px}.save-orb{display:grid;place-items:center;width:92px;height:92px;margin:38px auto 16px;border-radius:50%;color:#08151b;background:#63d7ae;font-size:46px;box-shadow:0 0 36px rgba(99,215,174,.32)}.save-orb.syncing{animation:spin 1s linear infinite}.save-orb.error{color:white;background:#d74f67}.save-title,.save-copy,.save-date{text-align:center}.save-copy,.save-date{color:#aebdd0}.save-date{font-size:12px}.primary-button{display:block;margin:24px auto 10px;padding:12px 20px;color:#07131b;background:#65dcb5;border:0;border-radius:9px;font-weight:800;cursor:pointer}.primary-button:disabled{opacity:.55}.option-list{display:flex;flex-direction:column;gap:12px}.option-row{display:flex;align-items:center;justify-content:space-between;gap:22px;padding:18px;background:#192b44;border:1px solid #3c587c;border-radius:12px}.option-row>span{display:flex;flex-direction:column;gap:5px}.option-row small{color:#9fb0c6}.option-control{display:flex;align-items:center;gap:12px}.volume-control input{width:190px}.switch{width:24px;height:24px;accent-color:#59d4aa}.options-note{text-align:center;color:#8fa2bb;font-size:12px}@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:700px){.info-backdrop{padding:0}.info-panel{height:100vh;max-height:none;border-radius:0;padding:16px}.info-header{top:-16px;margin:-16px -16px 16px;padding:15px 16px}.pokedex-grid{grid-template-columns:1fr 1fr}.progress-columns{grid-template-columns:1fr}.badge-grid{grid-template-columns:repeat(3,1fr)}.option-row{align-items:flex-start;flex-direction:column}.option-control,.volume-control input{width:100%}}
@media(max-width:430px){.pokedex-grid{grid-template-columns:1fr}.stat-card{padding:10px}.toolbar{flex-direction:column}}
</style>

<template>
  <pokedex-panel v-if="active === 'pokedex'" :pokedex="pokedex" :loading="loading" :language="preferences.language" :current-map="currentMap" :current-region="currentRegion" :animations-enabled="preferences.animationsEnabled" @close="$emit('close')" />
  <region-map-panel v-else-if="active === 'minimap'" :flight="progress.flight" :flight-allowed="flightAllowed" @fly="$emit('fly',$event)" :current-map="currentMap" :current-region="currentRegion" :language="preferences.language" :animations-enabled="preferences.animationsEnabled" @close="$emit('close')" />
  <badges-panel v-else-if="active === 'badges'" :badges="progress.badges || []" :capture="progress.capture" :loading="loading" :language="preferences.language" @close="$emit('close')" />
  <div v-else-if="active" class="info-backdrop" @mousedown.self="$emit('close')">
    <section class="info-panel" role="dialog" aria-modal="true" :aria-label="panelTitle">
      <header class="info-header">
        <div>
          <p class="info-kicker">RiftMon</p>
          <h2>{{ panelTitle }}</h2>
        </div>
        <button class="close-button" :aria-label="tr('close')" @click="$emit('close')">×</button>
      </header>

      <div v-if="loading" class="panel-state">{{ tr('syncingServer') }}</div>

      <template v-else-if="active === 'progress'">
        <adventure-guide :objective="progress.objective || null" :language="preferences.language" />
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
            <article v-for="quest in completedQuests" :key="quest.key" class="quest-card completed" :class="{ 'main-story-completed': quest.key === 'main_sister_search' }">
              <strong>{{ quest.title }}</strong><span class="completed-label">{{ tr('completed') }}</span>
              <p v-if="quest.key === 'main_sister_search'">{{ quest.description }}</p>
            </article>
            <p v-if="completedQuests.length === 0" class="empty-copy">{{ tr('noCompletedQuest') }}</p>
          </section>
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
          <fieldset class="theme-options">
            <legend>{{ tr('interfaceColor') }}</legend>
            <div class="theme-colors">
              <label v-for="color in themeColors" :key="color.key" class="theme-choice" :class="{ selected: preferences.themeColor === color.key }">
                <input type="radio" name="interface-color" :value="color.key" :checked="preferences.themeColor === color.key" :data-theme-color="color.key" @change="updatePreference('themeColor', color.key)">
                <span class="theme-swatch" :style="{ background: color.swatch }" aria-hidden="true"></span>
                <span>{{ tr(color.label) }}</span>
              </label>
            </div>
          </fieldset>
          <fieldset class="theme-options">
            <legend>{{ tr('displayMode') }}</legend>
            <div class="theme-modes">
              <label v-for="mode in ['light', 'dark']" :key="mode" class="theme-choice" :class="{ selected: preferences.themeMode === mode }">
                <input type="radio" name="interface-mode" :value="mode" :checked="preferences.themeMode === mode" :data-theme-mode="mode" @change="updatePreference('themeMode', mode)">
                <span>{{ tr(mode === 'dark' ? 'nightMode' : 'lightMode') }}</span>
              </label>
            </div>
          </fieldset>
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
        <details class="debug-options" data-debug-options>
          <summary>{{ tr('debugTools') }}</summary>
          <p>{{ tr('unstuckHelp') }}</p>
          <button type="button" data-recover-position :disabled="recoveryBusy || !recoveryAllowed" @click="$emit('recover-position')">{{ tr(recoveryBusy ? 'unstuckBusy' : 'unstuckButton') }}</button>
          <p v-if="recoveryNotice" role="status" class="recovery-feedback">{{ recoveryNotice }}</p>
          <p v-else-if="!recoveryAllowed" class="recovery-feedback">{{ tr('unstuckUnavailable') }}</p>
        </details>
      </template>
    </section>
  </div>
</template>

<script>
import { translate } from '@/services/i18n';
import RegionMapPanel from './RegionMapPanel.vue';
import PokedexPanel from './PokedexPanel.vue';
import AdventureGuide from './AdventureGuide.vue';
import BadgesPanel from './BadgesPanel.vue';

export default {
  name: 'GameInfoPanels',
  components: { RegionMapPanel, PokedexPanel, AdventureGuide, BadgesPanel },
  props: {
    currentMap: String, currentRegion: String, flightAllowed: Boolean,
    recoveryBusy: Boolean, recoveryAllowed: Boolean, recoveryNotice: {type:String,default:''},
    active: { type: String, default: '' },
    loading: { type: Boolean, default: false },
    pokedex: { type: Object, default: () => ({ entries: [] }) },
    progress: { type: Object, default: () => ({ quests: [], badges: [] }) },
    saveState: { type: Object, default: () => ({ status: 'idle' }) },
    preferences: { type: Object, required: true }
  },
  data: () => ({ themeColors: [
    { key: 'blue', label: 'themeBlue', swatch: '#6699b2' },
    { key: 'sage', label: 'themeSage', swatch: '#739e83' },
    { key: 'lavender', label: 'themeLavender', swatch: '#a38bb8' },
    { key: 'sand', label: 'themeSand', swatch: '#b89a6a' }
  ] }),
  computed: {
    panelTitle() {
      const titleKey = { pokedex: 'pokedex', progress: 'progress', save: 'save', options: 'options' }[this.active] || 'menu';
      return this.tr(titleKey);
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
.panel-state,.empty-copy{padding:28px;text-align:center;color:#9eb0c8}.option-row select{padding:11px 12px;color:#eaf3ff;background:#0c1628;border:1px solid #425e84;border-radius:9px}.progress-columns{display:grid;grid-template-columns:1fr 1fr;gap:18px}.progress-columns h3,.info-panel>h3{margin:8px 0 12px;color:#b9d5ff}.quest-card{position:relative;margin-bottom:10px;padding:14px;background:#1b2c45;border:1px solid #3e5a7f;border-radius:11px}.quest-card.completed{display:flex;align-items:center;justify-content:space-between;border-color:#367963}.quest-card.main-story-completed{flex-wrap:wrap;gap:8px}.quest-card.main-story-completed p{flex-basis:100%;margin-bottom:0}.quest-heading{display:flex;justify-content:space-between;gap:12px}.quest-card p{margin:7px 0 11px;color:#b0bfd1;font-size:13px;line-height:1.45}.quest-track{height:6px;overflow:hidden;background:#08111f;border-radius:4px}.quest-track span{display:block;height:100%;background:linear-gradient(90deg,#4ba7e8,#58d6a5)}.completed-label{color:#66d8a7;font-size:12px}.badge-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.badge-card{display:flex;flex-direction:column;align-items:center;gap:7px;padding:15px 8px;text-align:center;color:#75859a;background:#111d30;border:1px solid #293d5a;border-radius:12px}.badge-card.earned{color:#ffe7a1;border-color:#c69637;background:#3a2d16}.badge-medal{font-size:30px}.badge-card small{font-size:10px}.save-orb{display:grid;place-items:center;width:92px;height:92px;margin:38px auto 16px;border-radius:50%;color:#08151b;background:#63d7ae;font-size:46px;box-shadow:0 0 36px rgba(99,215,174,.32)}.save-orb.syncing{animation:spin 1s linear infinite}.save-orb.error{color:white;background:#d74f67}.save-title,.save-copy,.save-date{text-align:center}.save-copy,.save-date{color:#aebdd0}.save-date{font-size:12px}.primary-button{display:block;margin:24px auto 10px;padding:12px 20px;color:#07131b;background:#65dcb5;border:0;border-radius:9px;font-weight:800;cursor:pointer}.primary-button:disabled{opacity:.55}.option-list{display:flex;flex-direction:column;gap:12px}.option-row{display:flex;align-items:center;justify-content:space-between;gap:22px;padding:18px;background:#192b44;border:1px solid #3c587c;border-radius:12px}.option-row>span{display:flex;flex-direction:column;gap:5px}.option-row small{color:#9fb0c6}.option-control{display:flex;align-items:center;gap:12px}.volume-control input{width:190px}.switch{width:24px;height:24px;accent-color:#59d4aa}.options-note{text-align:center;color:#8fa2bb;font-size:12px}@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:700px){.info-backdrop{padding:0}.info-panel{height:100vh;max-height:none;border-radius:0;padding:16px}.info-header{top:-16px;margin:-16px -16px 16px;padding:15px 16px}.progress-columns{grid-template-columns:1fr}.badge-grid{grid-template-columns:repeat(3,1fr)}.option-row{align-items:flex-start;flex-direction:column}.option-control,.volume-control input{width:100%}}

.theme-options{min-width:0;margin:0;padding:14px 16px 16px;border:1px solid var(--journal-border);border-radius:12px;background:var(--journal-card);color:var(--journal-ink)}
.theme-options legend{padding:0 6px;font-size:13px;font-weight:bold;color:var(--journal-heading)}
.theme-colors,.theme-modes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.theme-modes{grid-template-columns:1fr 1fr}
.theme-choice{position:relative;display:flex;align-items:center;justify-content:center;gap:7px;min-height:46px;padding:9px 8px;border:1px solid var(--journal-border);border-radius:9px;background:var(--journal-paper);font-size:13px;cursor:pointer}
.theme-choice.selected{border-color:var(--journal-accent);background:var(--journal-selected);color:var(--journal-heading)}
.theme-choice:focus-within{outline:2px solid var(--journal-accent);outline-offset:2px}
.theme-choice input{position:absolute;opacity:0;width:100%;height:100%;inset:0;margin:0;cursor:pointer}
.theme-swatch{width:16px;height:16px;flex:none;border-radius:50%;border:1px solid #0002}
@media(max-width:480px){.theme-colors{grid-template-columns:1fr 1fr}}
</style>

<style scoped>
.debug-options{margin-top:20px;border:1px solid var(--journal-border);border-radius:10px;background:var(--journal-card);color:var(--journal-ink);padding:0 16px 12px}
.debug-options summary{min-height:48px;display:list-item;align-content:center;cursor:pointer;color:var(--journal-heading);font-weight:700}
.debug-options p{font-size:13px;line-height:1.5;color:var(--journal-muted);margin:8px 0 12px}
.debug-options button{min-height:48px;padding:12px 16px;border:1px solid var(--journal-border);border-radius:8px;background:var(--journal-selected);color:var(--journal-heading);font:inherit;font-weight:700;cursor:pointer;width:100%}
.debug-options button:disabled{opacity:.6;cursor:default}.debug-options :focus-visible{outline:2px solid var(--journal-accent);outline-offset:3px}
</style>

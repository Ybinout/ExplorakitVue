<template>
  <div class="battle-summary-backdrop" @keydown="handleKeydown" @keyup.stop @keypress.stop>
    <section
      ref="dialog"
      class="battle-summary"
      :class="`outcome-${outcome}`"
      data-battle-result
      :data-outcome="outcome"
      role="dialog"
      aria-modal="true"
      aria-labelledby="battle-result-title"
      :aria-describedby="description ? 'battle-result-description' : null"
    >
      <header class="result-heading">
        <div class="result-emblem" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <g v-if="outcome === 'victory'">
              <path d="M15 9h18v10c0 8-4 12-9 12s-9-4-9-12V9Z" />
              <path d="M15 13H9v5c0 5 3 8 8 8m16-13h6v5c0 5-3 8-8 8M24 31v7m-8 2h16M21 17l3-4 3 4-3 5-3-5Z" />
            </g>
            <g v-else-if="outcome === 'captured'">
              <circle cx="24" cy="25" r="15" /><path d="M9 25h10m10 0h10" /><circle cx="24" cy="25" r="5" /><path d="m36 5 1.5 3.5L41 10l-3.5 1.5L36 15l-1.5-3.5L31 10l3.5-1.5L36 5Z" />
            </g>
            <g v-else-if="outcome === 'defeat'">
              <path d="m24 6 14 6v11c0 9-7 15-14 19-7-4-14-10-14-19V12l14-6Z" /><path d="m26 14-5 9 6 3-6 9" />
            </g>
            <g v-else-if="outcome === 'fled'">
              <path d="M28 9H12v30h16m-7-15h21m-7-7 7 7-7 7" />
            </g>
            <g v-else-if="outcome === 'draw'">
              <path d="M24 8v31m-8 0h16M10 16h28M14 16 7 29h14l-7-13Zm20 0-7 13h14l-7-13Z" />
            </g>
            <g v-else><circle cx="24" cy="24" r="17" /><path d="M19 17v14m10-14v14" /></g>
          </svg>
        </div>
        <div class="result-heading-copy">
          <span class="result-kicker">{{ modeLabel }} <span aria-hidden="true">·</span> Fin du combat</span>
          <h2 id="battle-result-title">{{ title }}</h2>
          <p v-if="description" id="battle-result-description">{{ description }}</p>
        </div>
      </header>

      <div v-if="hasDetails" ref="content" class="result-content" tabindex="0" aria-label="Détails du combat">
        <div v-if="capturedPokemon" class="result-capture">
          <div class="capture-portrait">
            <pokemon-portrait v-if="capturedPokemon.pokemonId" :src="portrait(capturedPokemon)" :alt="capturedPokemon.name" />
            <span v-else aria-hidden="true">✦</span>
          </div>
          <div><span class="result-label">Pokémon capturé</span><h3>{{ capturedPokemon.name }}</h3><span v-if="capturedPokemon.level" class="capture-level">Niveau {{ capturedPokemon.level }}</span></div>
          <span class="capture-check" aria-label="Capture réussie">✓</span>
        </div>

        <section v-if="experience.length" class="result-experience" aria-labelledby="result-xp-title">
          <h3 id="result-xp-title" class="result-label">Expérience gagnée</h3>
          <ul>
            <li v-for="(entry, index) in experience" :key="entry.uuid || index">
              <pokemon-portrait v-if="entry.pokemonId" :src="portrait(entry)" alt="" />
              <span class="experience-name"><strong>{{ entry.name }}</strong><small v-if="entry.level > entry.previousLevel" class="level-gained">Niveau {{ entry.previousLevel }} <span aria-hidden="true">→</span> {{ entry.level }} <span class="sr-only">: niveau supérieur !</span><span aria-hidden="true">✦</span></small></span>
              <strong class="experience-value">+{{ formatNumber(entry.xpGained) }} <small>XP</small></strong>
            </li>
          </ul>
        </section>

        <div v-if="money" class="result-money">
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M10 17V7h3a3 3 0 0 1 0 6H8m0 2h6" /></svg>{{ money > 0 ? 'Récompense' : 'Argent perdu' }}</span>
          <strong>{{ money > 0 ? '+' : '−' }}{{ formatNumber(Math.abs(money)) }} <small>₽</small></strong>
        </div>

        <section v-if="loot.length" class="result-loot" aria-labelledby="result-loot-title">
          <h3 id="result-loot-title" class="result-label">Objets obtenus</h3>
          <ul><li v-for="(item, index) in loot" :key="index"><span aria-hidden="true">◇</span>{{ item }}</li></ul>
        </section>

        <section v-if="lostPokemon.length" class="result-losses" aria-labelledby="result-losses-title">
          <h3 id="result-losses-title">Compagnons perdus</h3>
          <p>Ces Pokémon ont quitté ton équipe.</p>
          <ul><li v-for="(pokemon, index) in lostPokemon" :key="pokemon.uuid || index"><span>{{ pokemon.name }}</span><small v-if="pokemon.level">Niv. {{ pokemon.level }}</small></li></ul>
        </section>

        <p v-if="result.recoveryMessage" class="result-recovery">{{ result.recoveryMessage }}</p>
      </div>

      <footer class="result-footer">
        <p v-if="explorationActive" class="result-timer">Le temps d’exploration continue.</p>
        <button ref="continue" type="button" class="result-continue" data-battle-result-continue @click="continueAdventure">Continuer <span aria-hidden="true">›</span></button>
      </footer>
    </section>
  </div>
</template>

<script>
import PokemonPortrait from '../PokemonPortrait.vue';

const outcomes = ['victory', 'defeat', 'captured', 'fled', 'draw', 'interrupted'];

export default {
  name: 'BattleResultPanel',
  components: { PokemonPortrait },
  props: {
    result: { type: Object, required: true },
    gameMode: { type: String, default: '' },
    explorationActive: { type: Boolean, default: false }
  },
  data: () => ({ previousFocus: null, continuing: false }),
  computed: {
    outcome() { return outcomes.includes(this.result.outcome) ? this.result.outcome : 'interrupted'; },
    modeLabel() {
      if (this.gameMode === 'colosseum') return 'Colosseum';
      return this.gameMode === 'rift' || this.result.mode === 'drift' ? 'Rift' : 'Aventure';
    },
    title() { return { victory: 'Victoire', defeat: 'Défaite', captured: 'Capture réussie', fled: 'Combat quitté', draw: 'Match nul', interrupted: 'Combat interrompu' }[this.outcome]; },
    description() {
      if (this.outcome === 'victory') return ['fled', 'forfeit', 'opponent_disconnected'].includes(this.result.reason) ? 'Tu remportes le duel par forfait adverse.' : '';
      if (this.outcome === 'defeat') return ['forfeit', 'opponent_disconnected'].includes(this.result.reason) ? 'Le duel se termine sur ton forfait.' : 'Ton équipe a été vaincue.';
      if (['captured', 'fled', 'draw'].includes(this.outcome)) return '';
      if (this.result.reason === 'timer') return 'Le temps d’exploration est écoulé.';
      if (this.result.reason === 'closed') return 'L’expédition est terminée.';
      if (['disconnect', 'player_disconnected', 'both_disconnected', 'socket_missing'].includes(this.result.reason)) return 'La connexion au combat a été interrompue.';
      if (['timeout', 'action_timeout'].includes(this.result.reason)) return 'Le délai pour jouer est écoulé.';
      return 'Le combat s’est arrêté avant son dénouement.';
    },
    experience() { return (this.result.experience || []).filter(entry => Number(entry.xpGained) > 0); },
    money() { return Number(this.result.money) || 0; },
    loot() { return this.result.loot || []; },
    capturedPokemon() { return this.result.capturedPokemon || null; },
    lostPokemon() { return this.result.lostPokemon || []; },
    hasDetails() { return Boolean(this.capturedPokemon || this.experience.length || this.money || this.loot.length || this.lostPokemon.length || this.result.recoveryMessage); }
  },
  mounted() {
    this.previousFocus = document.activeElement;
    this.$refs.continue.focus({ preventScroll: true });
  },
  beforeDestroy() {
    if (this.previousFocus?.isConnected) this.previousFocus.focus({ preventScroll: true });
  },
  methods: {
    portrait(pokemon) { return `${process.env.BASE_URL}img/pokemon/front/${pokemon.pokemonId}.png`; },
    formatNumber(value) { return Number(value).toLocaleString('fr-FR'); },
    continueAdventure() {
      if (this.continuing) return;
      this.continuing = true;
      this.$emit('continue');
    },
    handleKeydown(event) {
      event.stopPropagation();
      if (event.key === 'Tab') {
        const focusable = [...this.$refs.dialog.querySelectorAll('button:not(:disabled), [tabindex="0"]')];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !this.$refs.dialog.contains(document.activeElement))) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !this.$refs.dialog.contains(document.activeElement))) {
          event.preventDefault(); first?.focus();
        }
      } else if (['Enter', ' ', 'Escape'].includes(event.key)) {
        event.preventDefault();
        if (!event.repeat && !event.isComposing) this.continueAdventure();
      }
    }
  }
};
</script>

<style scoped>
.battle-summary-backdrop { position:fixed; inset:0; z-index:1600; display:grid; place-items:center; padding:20px; background:var(--journal-backdrop); backdrop-filter:blur(3px); color:var(--journal-ink); font:14px/1.45 var(--journal-font); }
.battle-summary, .battle-summary * { box-sizing:border-box; }
.battle-summary { --result-band:var(--journal-heading); --result-band-ink:var(--journal-card); --result-trim:#c5ad7b; width:min(490px,100%); max-height:calc(100vh - 40px); max-height:calc(100dvh - 40px); display:flex; flex-direction:column; overflow:hidden; background:var(--journal-paper); border:2px solid var(--result-trim); border-radius:12px 28px 12px 28px; box-shadow:0 0 0 4px var(--result-band),var(--journal-shadow); }
.result-heading { display:flex; align-items:center; flex-shrink:0; gap:20px; padding:25px 24px; background:var(--result-band); color:var(--result-band-ink); border-bottom:2px solid var(--result-trim); }
.result-emblem { flex-shrink:0; display:grid; place-items:center; width:64px; height:64px; border:1px solid var(--result-trim); outline:1px solid #c5ad7b40; outline-offset:5px; border-radius:50%; background:#ffffff08; color:var(--result-trim); }
.result-emblem svg { width:40px; height:40px; }
.outcome-defeat .result-emblem { color:#f3b7aa; }
.result-heading-copy { min-width:0; }
.result-kicker { color:inherit; font-size:10px; font-weight:700; letter-spacing:.8px; text-transform:uppercase; }
.result-kicker > span { margin:0 4px; }
.result-heading h2 { margin:7px 0 0; color:inherit; font:700 35px/1.1 Georgia,serif; overflow-wrap:anywhere; }
.result-heading p { margin:10px 0 0; color:inherit; font-size:13px; }
.result-content { min-height:0; overflow-y:auto; overscroll-behavior:contain; padding:18px 24px; scrollbar-width:thin; scrollbar-color:var(--journal-progress) transparent; }
.result-content:focus-visible { outline:2px solid var(--journal-accent); outline-offset:-4px; }
.result-content > :first-child { margin-top:0; }
.result-content > :last-child { margin-bottom:0; }
.result-label { display:block; margin:0 0 8px; color:var(--journal-muted); font-size:12px; font-weight:700; }
.result-capture { display:flex; align-items:center; gap:12px; padding-bottom:14px; margin-bottom:14px; border-bottom:1px solid var(--journal-border); }
.result-capture:only-child { padding-bottom:0; border-bottom:0; }
.capture-portrait { width:64px; height:64px; flex-shrink:0; display:grid; place-items:center; }
.capture-portrait .pokemon-portrait { width:100%; height:100%; }
.capture-portrait > span { color:var(--journal-accent); font-size:32px; }
.result-capture > div:nth-child(2) { min-width:0; }
.result-capture .result-label { margin-bottom:3px; }
.result-capture h3 { margin:0; color:var(--journal-heading); font-size:18px; overflow-wrap:anywhere; }
.capture-level { color:var(--journal-muted); font-size:12px; }
.capture-check { flex-shrink:0; margin-left:auto; color:var(--journal-accent); font-size:20px; }
.result-experience { margin-bottom:16px; }
.result-experience ul, .result-loot ul, .result-losses ul { list-style:none; padding:0; margin:0; }
.result-experience li { display:flex; align-items:center; gap:8px; min-height:48px; padding:6px 0; border-bottom:1px solid var(--journal-border); }
.result-experience li:last-child { border-bottom:0; }
.result-experience .pokemon-portrait { width:36px; height:36px; flex-shrink:0; }
.experience-name { flex:1; min-width:0; }
.experience-name > strong { font-size:13px; overflow-wrap:anywhere; }
.level-gained { display:flex; align-items:center; flex-wrap:wrap; gap:4px; margin-top:3px; color:var(--journal-accent); font-size:11px; font-weight:700; }
.experience-value { flex-shrink:0; color:var(--journal-accent); font-size:15px; font-variant-numeric:tabular-nums; }
.experience-value small { font-size:10px; }
.result-money { display:flex; justify-content:space-between; align-items:center; gap:12px; margin:12px 0 16px; padding:10px 12px; color:var(--journal-heading); background:var(--journal-soft); border-radius:8px; }
.result-money > span { display:flex; align-items:center; gap:8px; font-size:13px; }
.result-money svg { width:20px; height:20px; flex-shrink:0; }
.result-money strong { white-space:nowrap; font-size:15px; }
.result-money small { font-size:12px; }
.result-loot { margin:16px 0; }
.result-loot li { display:flex; align-items:baseline; gap:8px; padding:4px 0; font-size:13px; overflow-wrap:anywhere; }
.result-loot li > span { color:var(--journal-accent); }
.result-losses { margin:16px 0; padding:12px; border:1px solid var(--journal-border); border-radius:8px; }
.result-losses h3 { margin:0; color:var(--journal-danger); font-size:13px; }
.result-losses p { margin:4px 0 10px; color:var(--journal-muted); font-size:12px; }
.result-losses li { display:flex; align-items:baseline; justify-content:space-between; gap:10px; margin-top:5px; font-size:13px; overflow-wrap:anywhere; }
.result-losses li small { color:var(--journal-muted); font-size:12px; white-space:nowrap; }
.result-recovery { margin:16px 0 0; padding-top:12px; border-top:1px solid var(--journal-border); color:var(--journal-muted); font-size:13px; }
.result-footer { display:flex; flex-wrap:wrap; justify-content:flex-end; flex-shrink:0; gap:12px; padding:16px 24px 20px; background:var(--journal-soft); }
.result-content + .result-footer { border-top:1px solid var(--journal-border); }
.result-timer { flex:1 1 150px; align-self:center; margin:0; color:var(--journal-muted); font-size:12px; }
.result-continue { display:flex; align-items:center; justify-content:space-between; gap:16px; width:auto; min-width:172px; min-height:48px; padding:10px 16px; border:1px solid var(--result-trim); border-radius:7px 16px 7px 16px; background:var(--result-band); color:var(--result-band-ink); box-shadow:0 3px 0 var(--journal-border),inset 0 0 0 1px #ffffff18; font:700 14px var(--journal-font); cursor:pointer; }
.result-continue > span { color:var(--result-trim); font-size:22px; font-weight:400; line-height:1; }
.result-continue:hover { filter:brightness(.94); }
.result-continue:active { filter:brightness(.88); }
.result-continue:focus-visible { outline:2px solid var(--journal-accent); outline-offset:3px; }
.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
@media (max-width:480px) {
  .battle-summary-backdrop { padding:16px; }
  .battle-summary { max-height:calc(100vh - 32px); max-height:calc(100dvh - 32px); }
  .result-heading { padding:23px 19px; gap:16px; }
  .result-emblem { width:52px; height:52px; }
  .result-emblem svg { width:34px; height:34px; }
  .result-kicker { font-size:9px; letter-spacing:.5px; }
  .result-heading h2 { font-size:29px; }
  .result-content { padding:14px 16px; }
  .result-footer { padding:14px 18px 18px; }
}
@media (max-height:480px) and (orientation:landscape) {
  .battle-summary-backdrop { padding:12px; }
  .battle-summary { width:min(520px,100%); max-height:calc(100vh - 24px); max-height:calc(100dvh - 24px); }
  .result-heading { padding:12px 16px; }
  .result-emblem { width:44px; height:44px; }
  .result-emblem svg { width:30px; height:30px; }
  .result-heading h2 { font-size:27px; }
  .result-content { padding:12px 16px; }
  .result-footer { padding:10px 16px 14px; }
  .result-content + .result-footer { padding-top:8px; }
}
html[data-game-theme-mode="dark"] .battle-summary { --result-band:var(--journal-soft); --result-band-ink:var(--journal-heading); }
@media(max-width:350px) { .result-heading { gap:12px; padding:21px 16px; } .result-emblem { width:44px; height:44px; } .result-emblem svg { width:30px; height:30px; } .result-heading h2 { font-size:27px; } }
</style>

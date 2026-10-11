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
      aria-describedby="battle-result-description"
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
          <span class="result-kicker">FIN DU COMBAT <span aria-hidden="true">·</span> {{ result.mode === 'drift' ? 'DRIFT' : 'AVENTURE' }}</span>
          <h2 id="battle-result-title">{{ title }}</h2>
          <p id="battle-result-description">{{ description }}</p>
        </div>
      </header>

      <div ref="content" class="result-content" tabindex="0" aria-label="Détails du combat">
        <div v-if="capturedPokemon" class="result-capture">
          <div class="capture-portrait">
            <pokemon-portrait v-if="capturedPokemon.pokemonId" :src="portrait(capturedPokemon)" :alt="capturedPokemon.name" />
            <span v-else aria-hidden="true">✦</span>
          </div>
          <div><span class="result-label">POKÉMON CAPTURÉ</span><h3>{{ capturedPokemon.name }}</h3><span v-if="capturedPokemon.level" class="capture-level">Niveau {{ capturedPokemon.level }}</span></div>
          <span class="capture-check" aria-label="Capture réussie">✓</span>
        </div>

        <section v-if="experience.length" class="result-experience" aria-labelledby="result-xp-title">
          <h3 id="result-xp-title" class="result-label">EXPÉRIENCE GAGNÉE</h3>
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
          <h3 id="result-loot-title" class="result-label">BUTIN OBTENU</h3>
          <ul><li v-for="(item, index) in loot" :key="index"><span aria-hidden="true">◇</span>{{ item }}</li></ul>
        </section>

        <section v-if="lostPokemon.length" class="result-losses" aria-labelledby="result-losses-title">
          <h3 id="result-losses-title">Compagnons perdus</h3>
          <p>En Drift, chaque K.O. est définitif.</p>
          <ul><li v-for="(pokemon, index) in lostPokemon" :key="pokemon.uuid || index"><span>{{ pokemon.name }}</span><small v-if="pokemon.level">Niv. {{ pokemon.level }}</small></li></ul>
        </section>

        <p v-if="result.recoveryMessage" class="result-recovery">{{ result.recoveryMessage }}</p>
        <p v-if="!hasDetails" class="result-quiet">{{ quietMessage }}</p>
      </div>

      <footer class="result-footer">
        <span>{{ result.mode === 'drift' ? 'Le bilan ne met pas l’expédition en pause.' : 'Une rencontre de plus dans ton histoire.' }}</span>
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
  props: { result: { type: Object, required: true } },
  data: () => ({ previousFocus: null, continuing: false }),
  computed: {
    outcome() { return outcomes.includes(this.result.outcome) ? this.result.outcome : 'interrupted'; },
    title() { return { victory: 'Victoire !', defeat: 'Défaite', captured: 'Capture réussie !', fled: 'Combat quitté', draw: 'Match nul', interrupted: 'Combat interrompu' }[this.outcome]; },
    description() {
      if (this.outcome === 'victory') return ['fled', 'forfeit', 'opponent_disconnected'].includes(this.result.reason) ? 'Tu remportes le duel par forfait adverse.' : 'Tu remportes le combat.';
      if (this.outcome === 'defeat') return ['forfeit', 'opponent_disconnected'].includes(this.result.reason) ? 'Le duel se termine sur ton forfait.' : 'Ton équipe a été vaincue.';
      if (this.outcome === 'captured') return 'La Ball s’est refermée. Un nouveau compagnon !';
      if (this.outcome === 'fled') return 'Tu as quitté le combat.';
      if (this.outcome === 'draw') return 'Le combat se termine sans vainqueur.';
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
    hasDetails() { return Boolean(this.capturedPokemon || this.experience.length || this.money || this.loot.length || this.lostPokemon.length || this.result.recoveryMessage); },
    quietMessage() {
      if (this.outcome === 'defeat' && this.result.mode === 'drift') return 'Consulte le carnet Drift pour retrouver le bilan de ton expédition.';
      if (this.outcome === 'interrupted' && this.result.reason === 'timer') return 'Le carnet Drift indique la suite de l’expédition.';
      return 'Prends un instant avant de poursuivre ton aventure.';
    }
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
.battle-summary-backdrop { position:fixed; inset:0; z-index:1600; display:grid; place-items:center; padding:24px; background:#0b1d2ac9; backdrop-filter:blur(4px); color:#243c50; font:14px/1.45 Arial,Helvetica,sans-serif; }
.battle-summary, .battle-summary * { box-sizing:border-box; }
.battle-summary { width:min(540px,100%); max-height:calc(100vh - 48px); max-height:calc(100dvh - 48px); display:flex; flex-direction:column; overflow:hidden; background:#faf4e5; border:2px solid #c5ad7b; border-radius:12px 26px 12px 26px; box-shadow:0 0 0 4px #243c50,0 24px 80px #0007; }
.result-heading { display:flex; align-items:center; flex-shrink:0; gap:18px; padding:25px 26px 23px; color:#fff5de; background:radial-gradient(ellipse at 0 100%,#345866,transparent 70%),#1c3548; border-bottom:3px solid #c3a66e; }
.result-emblem { flex-shrink:0; display:grid; place-items:center; width:68px; height:68px; border:1px solid #d4bc8059; outline:1px solid #d4bc801c; outline-offset:5px; border-radius:50%; background:#d9bd7010; color:#e0c38a; }
.result-emblem svg { width:46px; height:46px; }
.outcome-defeat .result-emblem { color:#e5b5a1; border-color:#e5b5a14d; }
.result-heading-copy { min-width:0; }
.result-kicker { color:#d6c49c; font-size:9px; font-weight:700; letter-spacing:1.55px; }
.result-kicker > span { margin:0 4px; }
.result-heading h2 { margin:6px 0; color:inherit; font:700 clamp(26px,5vw,35px)/1.1 Georgia,serif; }
.result-heading p { margin:0; color:#d3dcd8; font-size:12px; line-height:1.55; }
.result-content { min-height:0; overflow-y:auto; overscroll-behavior:contain; padding:22px 26px; scrollbar-width:thin; scrollbar-color:#bbae91 transparent; }
.result-content:focus-visible { outline:2px solid #ad8746; outline-offset:-5px; }
.result-content > :first-child { margin-top:0; }
.result-content > :last-child { margin-bottom:0; }
.result-label { display:block; margin:0 0 9px; color:#7e7054; font-size:9px; font-weight:700; letter-spacing:1.4px; }
.result-capture { display:flex; align-items:center; gap:18px; padding:0 0 17px; margin-bottom:19px; border-bottom:1px solid #d9ccb0; }
.capture-portrait { position:relative; width:102px; height:102px; flex-shrink:0; display:grid; place-items:center; background:radial-gradient(circle,#fefdf7 0,#e0e8d4 65%,#d1dcc6); border:1px solid #c4cfb8; border-radius:50% 50% 12px 12px; }
.capture-portrait .pokemon-portrait { width:100%; }
.capture-portrait > span { color:#75917a; font-size:44px; }
.result-capture > div:nth-child(2) { min-width:0; }
.result-capture h3 { margin:0 0 7px; font:700 25px Georgia,serif; overflow-wrap:anywhere; }
.capture-level { color:#476f65; font-size:11px; }
.capture-check { display:grid; place-items:center; flex-shrink:0; margin-left:auto; width:26px; height:26px; border:1px solid #a3c0a7; border-radius:50%; color:#427b60; background:#e4eddb; }
.result-experience { margin-bottom:18px; }
.result-experience ul, .result-loot ul, .result-losses ul { list-style:none; padding:0; margin:0; }
.result-experience li { display:flex; align-items:center; gap:10px; min-height:48px; padding:8px 0; border-bottom:1px solid #e4d9c3; }
.result-experience li:last-child { border-bottom:0; }
.result-experience .pokemon-portrait { width:40px; height:40px; }
.experience-name { flex:1; min-width:0; }
.experience-name > strong { font-size:13px; overflow-wrap:anywhere; }
.level-gained { display:flex; align-items:center; flex-wrap:wrap; gap:5px; margin-top:3px; color:#34715b; font-size:10px; font-weight:700; }
.level-gained > span:last-child { color:#a98641; }
.experience-value { flex-shrink:0; color:#3e7395; font-size:16px; font-variant-numeric:tabular-nums; }
.experience-value small { font-size:9px; letter-spacing:.6px; }
.result-money { display:flex; justify-content:space-between; align-items:center; gap:12px; margin:8px 0 20px; padding:12px 14px; color:#785e2c; background:#eee1c1; border:1px solid #d6c39b; border-radius:5px 13px 5px 13px; }
.result-money > span { display:flex; align-items:center; gap:8px; font-size:12px; }
.result-money svg { width:22px; height:22px; flex-shrink:0; }
.result-money strong { white-space:nowrap; font-size:16px; }
.result-money small { font-size:12px; }
.result-loot { margin:18px 0; }
.result-loot li { display:flex; align-items:baseline; gap:9px; padding:5px 0; font-size:12px; overflow-wrap:anywhere; }
.result-loot li > span { color:#a07e3b; font-size:16px; }
.result-losses { margin:20px 0; padding:13px 15px; border-left:3px solid #b7816c; background:#f0e3d6; border-radius:0 8px 8px 0; }
.result-losses h3 { margin:0; color:#82513e; font-size:12px; }
.result-losses p { margin:4px 0 10px; color:#886d5e; font-size:11px; }
.result-losses li { display:flex; align-items:baseline; justify-content:space-between; gap:10px; margin-top:5px; color:#644f44; font-size:12px; }
.result-losses li small { font-size:10px; white-space:nowrap; }
.result-recovery { margin:17px 0 0; padding-top:14px; border-top:1px solid #d9ccb0; color:#5e716b; font-size:12px; line-height:1.65; }
.result-quiet { margin:0; color:#6c766e; font-size:12px; line-height:1.65; }
.result-footer { display:flex; align-items:center; justify-content:space-between; flex-shrink:0; gap:18px; padding:15px 26px; background:#efe7d4; border-top:1px solid #d6c6a5; }
.result-footer > span { color:#897b60; font-size:10px; max-width:160px; line-height:1.5; }
.result-continue { display:flex; align-items:center; justify-content:space-between; gap:24px; min-height:46px; min-width:155px; padding:10px 16px; border:1px solid #70828b; border-radius:6px 13px 6px 13px; background:#28495c; box-shadow:0 3px 0 #142e3f,inset 0 1px 0 #ffffff12; color:#fff5df; font:700 13px Arial,sans-serif; cursor:pointer; }
.result-continue > span { color:#dfc38b; font-size:24px; font-weight:400; line-height:1; }
.result-continue:hover { background:#345d71; }
.result-continue:active { transform:translateY(1px); box-shadow:0 2px 0 #142e3f; }
.result-continue:focus-visible { outline:3px solid #bb9144; outline-offset:3px; }
.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
@media (max-width:480px) {
  .battle-summary-backdrop { padding:16px; }
  .battle-summary { max-height:calc(100vh - 32px); max-height:calc(100dvh - 32px); }
  .result-heading { padding:21px 18px; gap:15px; }
  .result-emblem { width:52px; height:52px; }
  .result-emblem svg { width:37px; height:37px; }
  .result-kicker { font-size:8px; letter-spacing:1px; }
  .result-heading h2 { font-size:27px; }
  .result-heading p { font-size:11px; }
  .result-content { padding:18px; }
  .result-capture { gap:13px; }
  .capture-portrait { width:80px; height:80px; }
  .result-capture h3 { font-size:23px; }
  .result-footer { padding:13px 18px; gap:12px; }
  .result-footer > span { max-width:120px; font-size:9px; }
  .result-continue { min-width:137px; gap:18px; }
}
@media (max-height:480px) and (orientation:landscape) {
  .battle-summary-backdrop { padding:12px; }
  .battle-summary { width:min(620px,100%); max-height:calc(100vh - 24px); max-height:calc(100dvh - 24px); }
  .result-heading { gap:15px; padding:13px 22px; }
  .result-emblem { width:48px; height:48px; }
  .result-emblem svg { width:34px; height:34px; }
  .result-heading h2 { font-size:27px; margin:3px 0; }
  .result-heading p { font-size:11px; }
  .result-content { padding:15px 22px; }
  .result-footer { padding:9px 22px; }
  .result-footer > span { max-width:none; }
  .result-continue { min-height:44px; }
  .capture-portrait { width:70px; height:70px; }
}
</style>

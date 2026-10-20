<template>
  <section class="colosseum-run" data-colosseum-run>
    <p class="kicker">RIFT COLOSSEUM · {{ state.durationMinutes === 30 ? 'EXPRESS / 30 MIN' : 'CLASSIQUE / 1 H' }}</p>
    <h3>{{ finished ? 'Ton passage au Colosseum' : exploring ? `${durationLabel} pour tout préparer` : reward ? 'Le gardien est vaincu.' : `Défi ${next.wave}` }}</h3>
    <div class="score"><div><small>TON SCORE</small><strong>{{ number(state.colosseum.score) }} <span>pts</span></strong></div><div><small>VICTOIRES</small><strong>{{ state.colosseum.wins }}</strong></div><div><small>{{ finished ? 'GARDIENS' : 'SURVIVANTS' }}</small><strong>{{ finished ? guardianCount : state.team.length }}<span v-if="!finished"> / 6</span></strong></div></div>
    <template v-if="finished">
      <router-link class="ranking-link" :to="`/classements?mode=${state.durationMinutes}`" target="_blank" rel="noopener">Voir mon rang et le classement ↗</router-link>
      <p>{{ reason }}</p><p role="status">{{ state.settlement?.status === 'complete' ? state.colosseum.wins ? 'Résultat enregistré. Ton meilleur score figure au classement.' : 'Tentative enregistrée. Gagne un combat au Colosseum pour rejoindre le classement.' : 'Enregistrement de ton résultat…' }}</p>
      <div v-if="resultTeam.length" class="final-team" data-colosseum-result-team aria-label="Équipe complète au meilleur niveau atteint"><div v-for="p in resultTeam" :key="p.uuid" :class="{ lost: p.currentHp <= 0 }"><pokemon-portrait :src="sprite(p.pokemonId)" :alt="p.name"/><strong>{{ p.name }}</strong><span>N. {{ p.level }}{{ p.currentHp <= 0 ? ' · K.O.' : '' }}</span><details class="companion-details"><summary>Détails</summary><p v-if="p.heldItem">{{ itemName(p.heldItem) }}</p><p>{{ (p.moveNames || p.moves || []).join(' · ') }}</p><p v-if="p.initialLevel">Niveau initial : {{ p.initialLevel }}</p></details></div></div>
      <colosseum-defeat :defeat="state.colosseum.defeat"/>
      <p v-if="resultTeam.length" class="hint">{{ entryTeam.length ? 'Les six places de ton équipe d’entrée, avec la dernière forme et le meilleur niveau conservés pour chacun, même après son K.O.' : 'La dernière équipe conservée pour cette tentative.' }}</p>
    </template>
    <template v-else>
      <section v-if="reward" class="milestone" data-colosseum-reward aria-labelledby="reward-title">
        <p class="kicker">PALIER {{ reward.wave }} FRANCHI</p><h4 id="reward-title">Un Drift pour la suite</h4><p>Choisis un seul bonus. Il rejoint ton inventaire : équipe-le ensuite dans tes cinq emplacements.</p>
        <div class="reward-options"><button v-for="option in reward.options" :key="option.definitionId" :data-colosseum-reward-option="option.definitionId" :disabled="busy" @click="chooseReward(option)"><small>{{ option.rarity === 'legendary' ? 'LÉGENDAIRE' : 'ÉPIQUE' }}</small><strong>{{ option.name }}</strong><span>{{ option.description }} : {{ option.value }}{{ option.unit }}.</span><b>Choisir →</b></button></div>
      </section>
      <template v-else>
        <div v-if="next.nextGuardian" class="milestone-track" :aria-label="`${progress} victoires sur ${milestoneSize} dans ce palier`"><div><span>Vers {{ next.nextGuardian.name }}</span><strong>Gardien · {{ next.nextGuardian.wave }}</strong></div><div class="steps" aria-hidden="true"><i v-for="step in milestoneSize" :key="step" :class="{ done: step <= progress, boss: step === milestoneSize }"></i></div><small>{{ next.nextGuardian.specialty }} · {{ milestoneSize - progress }} victoire{{ milestoneSize - progress > 1 ? 's' : '' }} avant la récompense</small></div>
        <p v-if="exploring">Capture une équipe variée, trouve des Drifts et protège tes compagnons. À la fin du chrono, les survivants rejoignent automatiquement l’arène.</p>
        <article class="challenger" :class="{ guardian: next.guardian }" data-colosseum-preview>
          <div class="challenger-heading"><div><p class="kicker">{{ exploring ? 'TON PREMIER ADVERSAIRE' : next.guardian ? 'LE GARDIEN DU PALIER' : 'PROCHAIN ADVERSAIRE' }}</p><h4>{{ next.title.split(' · ')[0] }}</h4></div><span class="level">N. {{ next.level }}</span></div>
          <div v-if="next.strategy" class="opponent-strategy" data-colosseum-strategy><strong>{{ next.strategy.name }}</strong><p>{{ next.strategy.description }}</p><details><summary>Conseil de préparation</summary><p>{{ next.strategy.hint }}</p></details></div>
          <p v-if="next.guardian" class="specialty">{{ next.guardian.specialty }}</p>
          <div class="opponent-team"><div v-for="(p,index) in next.preview" :key="index"><pokemon-portrait :src="sprite(p.id)" :alt="p.name"/><span>{{ p.name }}</span><small v-if="p.itemName" class="held-item" data-colosseum-item :title="p.itemDescription">{{ p.itemName }}</small></div></div>
          <details v-if="next.preview.some(p => p.itemName)" class="loadouts"><summary>{{ next.strategy ? 'Voir leurs rôles et capacités' : 'Comprendre leurs objets' }}</summary><ul><li v-for="(p,index) in next.preview" :key="index"><strong>{{ p.name }} · {{ p.tacticalRole || p.role }}</strong><span v-if="p.moves" class="opponent-moves" data-colosseum-moves>{{ p.moves.map(moveName).join(' · ') }}</span><span>{{ p.itemName }} : {{ p.itemReason }}</span></li></ul></details>
          <drift-passives v-if="next.drifts && next.drifts.length" :drifts="next.drifts" :limit="3" title="Passifs du gardien" />
          <p v-if="next.guardian" class="tactical-hint">{{ next.guardian.hint }}</p>
          <div class="challenge-meta"><span>{{ next.size }} Pokémon<span v-if="next.potential > 2"> · potentiel {{ next.potential }}</span></span><strong>+{{ number(next.points) }} pts</strong></div>
        </article>
        <p v-if="state.colosseum.lastReward" class="claimed" role="status">{{ state.colosseum.lastReward.name }} a rejoint tes Drifts au palier {{ state.colosseum.lastReward.wave }}.</p>
        <details class="passives-toggle"><summary>Mes bonus équipés · {{ state.equipped.length }}/5</summary><drift-passives :drifts="equippedDrifts" :catalogue="catalogue" /></details>
        <div class="prepare-actions"><button @click="$emit('prepare','team')">Préparer mon équipe <span>→</span></button><button @click="$emit('prepare','drifts')">Équiper mes Drifts <span>{{ state.equipped.length }}/5 →</span></button></div>
        <button v-if="!exploring" class="start-wave" data-colosseum-ready :disabled="busy || state.phase !== 'colosseum_ready'" @click="ready">{{ busy ? 'Entrée dans l’arène…' : next.guardian ? 'Défier le gardien' : 'Affronter ce dresseur' }} <span>→</span></button>
      </template>
      <details class="difficulty" data-colosseum-difficulty><summary>Intelligence · {{ next.difficulty.label }} <span>{{ next.difficulty.tier }}/{{ next.difficulty.totalTiers || 6 }}</span></summary><p>{{ next.difficulty.description }}</p><small>{{ next.difficulty.nextWave ? `Prochain palier au combat ${next.difficulty.nextWave}.` : 'Intelligence maximale. La puissance continue d’augmenter.' }}</small></details>
      <p class="survival-rule"><strong>Chaque K.O. est définitif.</strong> Les survivants récupèrent tous leurs PV et PP entre les combats. Fuir l’arène met fin à la tentative.</p>
    </template>
  </section>
</template>
<script>
import { localizeMoveName } from '@/services/i18n';
import DriftPassives from './DriftPassives.vue';
import ColosseumDefeat from './ColosseumDefeat.vue';
import heldItems from '@/data/heldItems.json';
import PokemonPortrait from '../PokemonPortrait.vue';
export default {
  name: 'ColosseumRun', components: { PokemonPortrait, ColosseumDefeat, DriftPassives }, props: { state: Object, catalogue: Object },
  data() { return { busy: false, busyTimer: null }; },
  computed: {
    equippedDrifts() { return this.state.drifts.filter(d=>this.state.equipped.includes(d.uuid)); },
    durationLabel() { return this.state.durationMinutes === 30 ? '30 minutes' : 'Une heure'; },
    finished() { return this.state.phase === 'results'; },
    entryTeam() { return this.state.report?.players?.[0]?.tournamentTeam || []; },
    resultTeam() { return (this.state.colosseum.resultTeam || (this.entryTeam.length ? this.entryTeam : this.state.colosseum.lastTeam || [])).slice(0, 6); },
    exploring() { return this.state.phase === 'exploration'; },
    next() { return this.state.colosseum.next; },
    reward() { return this.state.colosseum.reward; },
    milestoneSize() { return this.next.milestoneSize || (this.state.colosseum.version >= 3 ? 5 : 10); },
    progress() { return this.state.colosseum.wins % this.milestoneSize; },
    guardianCount() { return this.state.colosseum.version >= 2 ? Math.floor(this.state.colosseum.wins / this.milestoneSize) : 0; },
    reason() { return { defeated: 'Ton dernier Pokémon est tombé. Ton parcours s’arrête ici.', forfeit: 'Tu as mis fin à cette tentative.', disconnected: 'Tu n’es pas revenu dans les 90 secondes suivant ta déconnexion.' }[this.state.reason] || 'Cette tentative est terminée.'; }
  },
  watch: { 'state.phase'() { this.clearBusy(); }, reward() { this.clearBusy(); } },
  beforeDestroy() { this.clearBusy(); },
  methods: {
    moveName(name) { return localizeMoveName(name,'fr'); },
    itemName(key) { return heldItems[key]?.name || key; },
    number(n) { return Number(n).toLocaleString('fr-FR'); },
    sprite(id) { return `${this.$assetBase}img/pokemon/front/${id}.png`; },
    clearBusy() { clearTimeout(this.busyTimer); this.busy = false; },
    dispatch(name, payload) { if (this.busy) return; this.busy = true; this.$emit(name, payload); this.busyTimer = setTimeout(this.clearBusy, 5000); },
    ready() { this.dispatch('ready'); },
    chooseReward(option) { this.dispatch('reward', { offerId: this.reward.id, definitionId: option.definitionId }); }
  }
};
</script>
<style scoped>
.opponent-strategy{border-left:3px solid #608579;padding:9px 12px;margin:14px 0;background:var(--journal-soft);border-radius:0 8px 8px 0;font-size:12px}.opponent-strategy>strong{color:var(--journal-accent)}.opponent-strategy p{font:12px/1.6 Arial!important;margin:6px 0 0!important}.opponent-strategy summary{cursor:pointer;min-height:44px;box-sizing:border-box;padding:12px 0;font-size:11px;color:var(--journal-accent)}.opponent-strategy details p{margin-top:0!important}.opponent-moves{color:var(--journal-ink)!important}

.passives-toggle{margin-top:14px}.passives-toggle>summary{min-height:44px;padding:12px 0;box-sizing:border-box;font-size:12px;color:var(--journal-accent);cursor:pointer}
.ranking-link{display:inline-flex;align-items:center;min-height:44px;color:var(--journal-accent);font-size:12px;font-weight:700}

.held-item{display:block;font:10px/1.4 Arial;color:var(--journal-accent);margin-top:5px;overflow-wrap:anywhere}.loadouts{border-top:1px solid var(--journal-border);font-size:11px;margin-bottom:12px}.loadouts summary{min-height:44px;box-sizing:border-box;padding:14px 0;cursor:pointer;color:var(--journal-accent)}.loadouts ul{list-style:none;padding:0;margin:0;display:grid;gap:12px}.loadouts li{display:grid;gap:5px}.loadouts li span{color:var(--journal-muted);line-height:1.6}

.colosseum-run{max-width:680px;margin:auto;color:var(--journal-ink);font-family:Arial,sans-serif}.colosseum-run p{font-size:13px;line-height:1.7;color:var(--journal-muted)}.colosseum-run .kicker{font-size:9px;letter-spacing:.14em;color:var(--journal-accent);font-weight:700;margin:0 0 8px}h3{font:500 32px/1.15 Georgia,serif;margin:0 0 22px}h4{font:500 25px/1.2 Georgia,serif;margin:0}.score{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:12px;padding:18px 0;margin-bottom:22px;border-block:1px solid var(--journal-border)}.score>div{display:flex;flex-direction:column;gap:9px}.score small{font-size:9px;color:var(--journal-muted);letter-spacing:.08em}.score strong{font:28px Georgia,serif;color:var(--journal-accent)}.score strong span{font:11px Arial;color:var(--journal-muted)}.milestone-track{margin:0 0 24px}.milestone-track>div:first-child{display:flex;justify-content:space-between;gap:10px;font-size:12px}.milestone-track strong{font-size:11px;color:var(--journal-accent)}.milestone-track small{font-size:10px;color:var(--journal-muted)}.steps{display:flex;gap:5px;margin:12px 0 8px}.steps i{height:6px;border-radius:3px;flex:1;background:var(--journal-border)}.steps .done{background:var(--journal-accent)}.steps .boss{background:#c9ae70}.challenger{padding:20px;border:1px solid var(--journal-border);border-radius:12px;background:var(--journal-soft)}.challenger.guardian{border-color:#c9ae70;background:var(--journal-selected)}.challenger-heading{display:flex;justify-content:space-between;align-items:center;gap:10px}.level{border:1px solid var(--journal-border);border-radius:20px;padding:6px 10px;font-size:12px;white-space:nowrap;background:var(--journal-card)}.specialty{margin:10px 0 0!important;color:var(--journal-accent)!important;font-weight:700}.opponent-team{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;margin:16px 0}.opponent-team>div{text-align:center;min-width:0}.opponent-team .pokemon-portrait{width:100%;max-width:84px;margin:auto}.opponent-team span{font-size:10px;overflow-wrap:anywhere;display:block}.tactical-hint{padding:12px 0 0;border-top:1px solid #ddcfac;font-size:12px!important}.challenge-meta{display:flex;justify-content:space-between;gap:12px;font-size:11px;color:var(--journal-muted)}.challenge-meta strong{color:var(--journal-accent);white-space:nowrap}.prepare-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0}.prepare-actions button{display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:48px;border:1px solid var(--journal-border);border-radius:8px;background:var(--journal-card);color:var(--journal-accent);font-size:11px;padding:10px;text-align:left;cursor:pointer}.prepare-actions span{white-space:nowrap}.start-wave{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:52px;padding:14px 18px;border:1px solid var(--journal-accent);border-radius:8px;background:var(--journal-accent);color:var(--journal-on-accent);font-weight:700;cursor:pointer;margin:16px 0 20px}button:disabled{opacity:.6;cursor:wait}button:focus-visible,summary:focus-visible{outline:3px solid #9b791f;outline-offset:3px}.difficulty{border-block:1px solid var(--journal-border);padding:0;margin:20px 0 12px}.difficulty summary{cursor:pointer;min-height:44px;padding:14px 0;box-sizing:border-box;font-size:12px;color:var(--journal-accent)}.difficulty summary span{float:right;color:var(--journal-muted)}.difficulty p{margin:0 0 6px}.difficulty small{display:block;font:11px/1.5 Arial;color:var(--journal-muted);padding-bottom:14px}.colosseum-run .survival-rule{font-size:11px;margin-bottom:0}.survival-rule strong{color:var(--journal-muted)}.colosseum-run .hint{font-size:11px}.final-team{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:22px}.final-team>div{display:flex;align-items:center;flex-direction:column;border:1px solid var(--journal-border);border-radius:9px;padding:10px;background:var(--journal-card);min-width:0}.final-team .pokemon-portrait{width:72px}.companion-details{width:100%;font-size:11px}.companion-details summary{min-height:44px;display:grid;place-items:center;cursor:pointer;color:var(--journal-accent)}.companion-details p{font-size:11px;overflow-wrap:anywhere}.final-team strong{font-size:12px;overflow-wrap:anywhere}.final-team span{font-size:10px;color:var(--journal-muted);margin:6px 0}.milestone{padding:20px;border:1px solid #c9ae70;border-radius:12px;background:var(--journal-card)}.reward-options{display:grid;gap:10px;margin-top:16px}.reward-options button{display:grid;gap:8px;text-align:left;padding:16px;min-height:44px;background:var(--journal-card);color:var(--journal-ink);border:1px solid var(--journal-border);border-radius:8px;cursor:pointer}.reward-options small{font-size:9px;letter-spacing:.1em;color:var(--journal-accent)}.reward-options strong{font:20px Georgia,serif}.reward-options span{font-size:12px;line-height:1.6;color:var(--journal-muted)}.reward-options b{font-size:11px;color:var(--journal-accent)}.colosseum-run .claimed{font-size:11px;color:var(--journal-accent);padding:10px;border-left:2px solid var(--journal-accent)}
@media(max-width:420px){h3{font-size:26px}.score strong{font-size:25px}.score{gap:8px}.score small{font-size:8px}.challenger,.milestone{padding:14px}h4{font-size:22px}.opponent-team{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.opponent-team .pokemon-portrait{max-width:66px}.colosseum-run p{font-size:12px}.final-team{grid-template-columns:repeat(2,minmax(0,1fr))}.milestone-track>div:first-child{font-size:11px}}
</style>

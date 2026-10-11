<template>
  <section class="participants" data-rift-participants aria-labelledby="survivors-title">
    <header><span class="survivor-emblem"><drift-glyph name="players" /></span><div><small>UNE EXPÉDITION PARTAGÉE</small><h3 id="survivors-title">Les dresseurs en lice</h3></div><strong data-survivor-count>{{ survivors.length }}<small>/ {{ players.length }}</small></strong></header>
    <p class="participants-note">Un dresseur reste en lice tant qu’il possède un Pokémon vivant. Les équipes seront dévoilées dans le bilan final.</p>
    <ul class="participant-list"><li v-for="player in survivors" :key="player.id" :data-participant="player.id"><span class="presence" :class="{ offline: player.connected === false, battling: player.inBattle }"><drift-glyph :name="player.inBattle ? 'trophy' : 'team'" /></span><div><strong>{{ player.username }}<small v-if="player.id === userId"> · toi</small></strong><span>{{ status(player) }}</span></div><span class="alive-tag">En lice</span></li></ul>
    <p v-if="!survivors.length" class="participants-note">L’expédition est terminée. Retrouve chaque parcours dans le bilan.</p>
    <section v-if="watchableMatches.length" class="live-duels" aria-labelledby="live-duels-title"><h4 id="live-duels-title">Depuis les tribunes</h4><p class="participants-note">Pendant ton attente, suis un duel en direct.</p><button v-for="match in watchableMatches" :key="match.id" :data-spectate-match="match.id" @click="$emit('watch', match.id)"><drift-glyph name="trophy" /><span>{{ playerName(match.players[0]) }} <small>contre</small> {{ playerName(match.players[1]) }}</span><strong>Regarder →</strong></button></section>
    <details v-if="eliminated.length" class="fallen-list"><summary>{{ eliminated.length }} {{ eliminated.length > 1 ? 'dresseurs ont quitté la course' : 'dresseur a quitté la course' }}</summary><ul class="participant-list"><li v-for="player in eliminated" :key="player.id" :data-participant="player.id"><span class="presence departed"><drift-glyph name="team" /></span><div><strong>{{ player.username }}<small v-if="player.id === userId"> · toi</small></strong><span>{{ reason(player.reason) }}</span></div></li></ul></details>
  </section>
</template>

<script>
import DriftGlyph from './DriftGlyph.vue';
export default {
  name: 'RiftParticipants',
  components: { DriftGlyph },
  props: { state: { type: Object, required: true }, userId: { type: Number, required: true } },
  computed: {
    players() { return this.state.players || []; },
    survivors() { return this.players.filter(player => player.alive); },
    eliminated() { return this.players.filter(player => !player.alive); },
    watchableMatches() { return this.state.spectatingAvailable && !this.state.ready ? (this.state.matches || []).filter(match => match.status === 'battle' && !match.players.includes(this.userId)) : []; }
  },
  methods: {
    playerName(id) { return this.players.find(player => player.id === id)?.username || 'Dresseur'; },
    status(player) { if (player.connected === false) return 'Reconnexion en cours'; if (player.inBattle) return 'En combat'; if (this.state.phase === 'exploration') return 'Explore le monde'; const match = (this.state.matches || []).find(match => match.round === this.state.currentRound && match.players.includes(player.id)); return match?.status === 'bye' ? 'Exempt · attend le prochain round' : player.ready ? 'Prêt pour son duel' : 'Prépare son équipe'; },
    reason(key) { return { defeated: 'Tous ses Pokémon sont tombés', disconnected: 'Forfait après déconnexion', forfeit: 'A quitté l’expédition', not_ready: 'Absent au départ du round', winner: 'Vainqueur', finished: 'Parcours terminé' }[key] || 'Éliminé'; }
  }
};
</script>

<style scoped>
.participants { color: #284557; }.participants * { box-sizing: border-box; }header { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }.survivor-emblem { display: grid; place-items: center; width: 43px; height: 43px; flex-shrink: 0; border: 1px solid #a2c2d3; border-radius: 50%; background: #e1eced; color: #417c9f; }.survivor-emblem svg { width: 25px; height: 25px; }header > div { flex: 1; min-width: 0; }header small { font-size: 8px; letter-spacing: .1em; color: #73939c; }h3 { font: 500 24px/1.2 Georgia, serif; margin: 4px 0 0; }header > strong { color: #387da2; font: 500 32px Georgia, serif; white-space: nowrap; }header > strong small { font: 12px 'Trebuchet MS', Arial, sans-serif; margin-left: 4px; letter-spacing: 0; }.participants-note { color: #718890; font-size: 11px; line-height: 1.6; margin: 8px 0 16px; }
.participant-list { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }.participant-list li { display: flex; align-items: center; gap: 11px; min-width: 0; padding: 13px; border: 1px solid #c9d7d2; border-radius: 8px; background: #fffcf2; }.presence { display: grid; place-items: center; flex: 0 0 35px; height: 35px; border-radius: 50%; color: #49826b; background: #e2ecdc; }.presence svg { width: 21px; height: 21px; }.presence.battling { color: #417b9f; background: #dceaf1; }.presence.offline { color: #a28c65; background: #efe7d4; }.presence.departed { color: #98a3a4; background: #e8eae4; }.participant-list li > div { min-width: 0; flex: 1; }.participant-list strong { display: block; font-size: 12px; overflow-wrap: anywhere; }.participant-list strong small { font-size: 9px; color: #76939c; font-weight: normal; }.participant-list div > span { display: block; margin-top: 3px; font-size: 10px; color: #7b9399; }.alive-tag { font-size: 8px; color: #518a70; padding: 3px 5px; border: 1px solid #b7ccba; border-radius: 3px; white-space: nowrap; }.fallen-list { margin-top: 22px; }.fallen-list summary { min-height: 44px; padding: 11px 0; font-size: 11px; color: #7d8e92; cursor: pointer; }.fallen-list .participant-list { margin-top: 10px; }.fallen-list li { background: #ebece1; }
.live-duels { margin-top: 24px; border-top: 1px solid #c9d7d2; padding-top: 18px; }.live-duels h4 { font: 500 23px Georgia, serif; margin: 0; }.live-duels button { display: flex; align-items: center; gap: 10px; padding: 12px; min-height: 50px; width: 100%; margin: 8px 0; border: 1px solid #6397b3; border-radius: 8px; background: #e1edf0; color: #356783; text-align: left; cursor: pointer; font: inherit; }.live-duels svg { width: 22px; height: 22px; flex-shrink: 0; }.live-duels span { flex: 1; min-width: 0; font-size: 12px; overflow-wrap: anywhere; }.live-duels span small { font-size: 9px; color: #7e98a3; }.live-duels strong { font-size: 10px; white-space: nowrap; }button:focus-visible, summary:focus-visible { outline: 2px solid #468ab2; outline-offset: 3px; }
@media (max-width: 600px) { .participant-list { grid-template-columns: minmax(0, 1fr); }.participant-list li { padding: 11px; }h3 { font-size: 21px; }header { gap: 9px; }.survivor-emblem { width: 35px; height: 35px; }.survivor-emblem svg { width: 21px; height: 21px; }header > strong { font-size: 28px; }.participants-note { font-size: 10px; }.live-duels button { flex-wrap: wrap; }.live-duels span { font-size: 11px; }.live-duels strong { margin-left: auto; } }
</style>

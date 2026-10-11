<template>
  <div class="spectator-backdrop" @keydown.stop="keyboard" @keyup.stop>
    <section ref="dialog" class="spectator-panel" role="dialog" aria-modal="true" aria-labelledby="spectator-title" data-rift-spectator>
      <header class="spectator-header"><div><small>RIFTMON · LES TRIBUNES</small><h2 id="spectator-title">{{ frame.active ? 'Le duel en direct' : 'Le duel est terminé' }}</h2></div><button ref="close" aria-label="Revenir au tableau du tournoi" data-spectator-close @click="$emit('close')"><drift-glyph name="close" /></button></header>
      <div class="spectator-body">
        <div class="duel-caption"><span><i :class="{ live: frame.active }" />{{ frame.active ? 'En direct' : 'Résultat du duel' }}</span><span>Round {{ frame.round || 1 }} · Tour {{ frame.turn || 1 }}</span></div>
        <div class="duel-stage" aria-label="Les deux combattants">
          <article v-for="(player,index) in frame.players || []" :key="player.id" class="duelist" :class="{ 'duelist-right': index === 1, fallen: player.pokemon && player.pokemon.currentHp <= 0 }" :data-spectator-player="player.id">
            <div class="trainer-name">{{ player.username }}</div>
            <div class="pokemon-stage"><span class="platform" /><pokemon-portrait v-if="player.pokemon" :src="`${$assetBase}img/pokemon/front/${player.pokemon.pokemonId}.png`" :alt="player.pokemon.name" /><drift-glyph v-else name="team" /></div>
            <div v-if="player.pokemon" class="combatant-info"><h3>{{ player.pokemon.name }} <small>N. {{ player.pokemon.level }}</small></h3><div class="health-caption"><span>PV</span><strong>{{ player.pokemon.currentHp }} / {{ player.pokemon.maxHp }}</strong></div><div class="health-track" :class="{ low: hpPercent(player.pokemon) < 30 }" role="progressbar" :aria-label="`PV de ${player.pokemon.name}`" :aria-valuenow="player.pokemon.currentHp" :aria-valuemin="0" :aria-valuemax="player.pokemon.maxHp"><i :style="{ width: hpPercent(player.pokemon) + '%' }" /></div><span class="status">{{ statusLabel(player.pokemon.status) }}</span></div>
            <p v-else class="empty-combatant">Changement de Pokémon…</p>
          </article>
          <span class="versus" aria-hidden="true">VS</span>
        </div>
        <p v-if="!frame.active" class="match-conclusion" role="status">{{ winner ? `${winner.username} remporte ce duel.` : 'Ce duel se termine sans vainqueur.' }}</p>
        <section class="duel-journal" aria-label="Actions du duel"><h3>Au fil du combat</h3><ol ref="log" role="log" aria-live="polite" aria-relevant="additions text" data-spectator-log><li v-for="(line,index) in frame.log || []" :key="index">{{ line }}</li><li v-if="!frame.log?.length">Les dresseurs préparent leur première action.</li></ol></section>
      </div>
      <footer><p>{{ frame.active ? 'Ton tour viendra. Observe les stratégies de tes rivaux.' : 'Retrouve les survivants et la suite du tournoi dans le tableau.' }}</p><button data-spectator-return @click="$emit('close')"><drift-glyph name="back" />Retour au tableau</button></footer>
    </section>
  </div>
</template>

<script>
import DriftGlyph from './DriftGlyph.vue';
import PokemonPortrait from '../PokemonPortrait.vue';

export default {
  name: 'RiftSpectatorPanel',
  components: { DriftGlyph, PokemonPortrait },
  props: { frame: { type: Object, required: true } },
  data() { return { previousFocus: null }; },
  computed: { winner() { return (this.frame.players || []).find(player => player.id === this.frame.winnerId); } },
  watch: { 'frame.log'() { this.$nextTick(() => { const log = this.$refs.log; if (log) log.scrollTop = log.scrollHeight; }); } },
  mounted() { this.previousFocus = document.activeElement; this.$refs.close.focus(); },
  beforeDestroy() { if (this.previousFocus?.isConnected) this.previousFocus.focus(); },
  methods: {
    hpPercent(pokemon) { return Math.max(0, Math.min(100, Number(pokemon.currentHp) / Math.max(1, Number(pokemon.maxHp)) * 100)); },
    statusLabel(status) { return { burn: 'Brûlé', burned: 'Brûlé', poison: 'Empoisonné', poisoned: 'Empoisonné', toxic: 'Gravement empoisonné', paralysis: 'Paralysé', paralyzed: 'Paralysé', sleep: 'Endormi', asleep: 'Endormi', freeze: 'Gelé', frozen: 'Gelé' }[status] || ''; },
    keyboard(event) {
      if (event.key === 'Escape') { event.preventDefault(); this.$emit('close'); return; }
      if (event.key !== 'Tab') return;
      const nodes = [...this.$refs.dialog.querySelectorAll('button:not(:disabled)')].filter(node => node.getClientRects().length);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }
};
</script>

<style scoped>
.spectator-backdrop { position: fixed; inset: 0; z-index: 1500; display: grid; place-items: center; padding: 18px; background: #06172bdd; backdrop-filter: blur(5px); color: #17354d; font: 13px/1.5 'Trebuchet MS', Arial, sans-serif; text-align: left; }
.spectator-backdrop *, .spectator-backdrop *::before, .spectator-backdrop *::after { box-sizing: border-box; }
.spectator-panel { display: flex; flex-direction: column; width: min(800px, 100%); max-height: calc(100dvh - 36px); overflow: hidden; border: 1px solid #8fc5e8; border-radius: 15px; background: #f3f4ec; box-shadow: 0 0 0 4px #143651, 0 20px 80px #0008; }
button { min-height: 44px; cursor: pointer; font: inherit; }button:focus-visible { outline: 3px solid #6caed4; outline-offset: 3px; }
.spectator-header { display: flex; align-items: center; gap: 16px; justify-content: space-between; padding: 18px 24px; background: linear-gradient(120deg, #142d48, #21577a); color: #eff8ff; flex-shrink: 0; }.spectator-header small { color: #b2d4e9; letter-spacing: .16em; font-size: 9px; }.spectator-header h2 { font: 500 28px Georgia, serif; margin: 3px 0 0; }.spectator-header button { display: grid; place-items: center; width: 44px; border: 1px solid #7fa8c06b; border-radius: 8px; background: #ffffff0d; color: #e6f3ff; }.spectator-header svg { width: 19px; height: 19px; }
.spectator-body { overflow-y: auto; min-height: 0; padding: 18px 24px; overscroll-behavior: contain; }.duel-caption { display: flex; justify-content: space-between; gap: 12px; color: #5a7b8c; font-size: 10px; }.duel-caption > span:first-child { display: flex; align-items: center; gap: 7px; }.duel-caption i { width: 6px; height: 6px; background: #92a2a5; border-radius: 50%; }.duel-caption i.live { background: #388bc1; box-shadow: 0 0 0 3px #388bc11f; }
.duel-stage { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 60px; position: relative; margin: 18px 0; padding: 16px 22px 12px; background: radial-gradient(ellipse at center, #d8e8ed, #edf3ec); border: 1px solid #cad8d4; border-radius: 12px; }.duelist { min-width: 0; }.trainer-name { color: #355e76; font-size: 12px; font-weight: bold; text-align: center; overflow-wrap: anywhere; }.pokemon-stage { position: relative; display: grid; place-items: center; height: 145px; }.pokemon-stage .pokemon-portrait { width: 135px; height: 135px; position: relative; z-index: 1; }.pokemon-stage > svg { width: 56px; height: 56px; color: #98b0b9; }.platform { position: absolute; width: 90%; height: 25px; bottom: 14px; border: 1px solid #9db8b555; border-radius: 50%; background: #a7c2bc33; box-shadow: 0 5px 0 #94adb222; }.duelist-right .pokemon-portrait { transform: scaleX(-1); }.fallen .pokemon-stage { filter: grayscale(.7); opacity: .6; }.combatant-info h3 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 5px 10px; margin: 0 0 9px; font-size: 15px; }.combatant-info h3 small { color: #6f8b91; font-size: 10px; font-weight: normal; }.health-caption { display: flex; justify-content: space-between; gap: 7px; font-size: 9px; color: #6f8a8c; }.health-caption strong { font-weight: normal; font-variant-numeric: tabular-nums; }.health-track { height: 7px; margin: 4px 0; background: #cddcd8; border-radius: 5px; overflow: hidden; }.health-track i { display: block; height: 100%; background: #4d9d83; transition: width .4s ease; }.health-track.low i { background: #c18b65; }.status { display: block; min-height: 15px; color: #9b754e; font-size: 9px; }.versus { position: absolute; left: 50%; top: 46%; transform: translate(-50%, -50%); color: #91a9b0; font: italic 24px Georgia, serif; }.empty-combatant { font-size: 11px; color: #7a9197; }
.match-conclusion { padding: 12px; border: 1px solid #b3c6cb; border-radius: 7px; background: #dfecee; color: #365f72; text-align: center; font-weight: bold; }.duel-journal h3 { margin: 0 0 8px; font-size: 10px; letter-spacing: .09em; text-transform: uppercase; color: #70909d; }.duel-journal ol { max-height: 130px; padding: 10px 14px; margin: 0; border: 1px solid #d0d9d2; border-radius: 8px; background: #fffdf4; list-style: none; overflow-y: auto; overscroll-behavior: contain; }.duel-journal li { padding: 4px 0; font-size: 11px; color: #54717d; overflow-wrap: anywhere; }.duel-journal li:last-child { color: #244e69; }
footer { flex-shrink: 0; display: flex; align-items: center; gap: 18px; justify-content: space-between; padding: 10px 24px; border-top: 1px solid #cad6d3; background: #e9eee6; }footer p { margin: 0; color: #6b848a; font-size: 10px; max-width: 330px; }footer button { display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid #2b5d7a; border-radius: 7px; background: #215779; color: #f1f8fa; padding: 9px 13px; font-size: 11px; white-space: nowrap; }footer svg { width: 17px; height: 17px; }
@media (max-width: 600px) { .spectator-backdrop { padding: 10px; }.spectator-panel { max-height: calc(100dvh - 20px); border-radius: 11px; }.spectator-header { padding: 12px 14px; }.spectator-header small { font-size: 7px; }.spectator-header h2 { font-size: 23px; }.spectator-body { padding: 13px; }.duel-stage { padding: 12px; gap: 24px; }.trainer-name { font-size: 10px; }.pokemon-stage { height: 110px; }.pokemon-stage .pokemon-portrait { width: 100%; max-width: 105px; height: auto; }.combatant-info h3 { font-size: 12px; }.versus { font-size: 16px; top: 42%; }.duel-caption { font-size: 9px; }.duel-journal ol { max-height: 160px; }.duel-journal li { font-size: 10px; }footer { padding: 9px 13px; gap: 8px; }footer p { font-size: 9px; }footer button { font-size: 10px; padding-inline: 9px; } }
@media (max-height: 500px) and (min-width: 601px) { .spectator-header { padding-block: 7px; }.spectator-header h2 { font-size: 22px; }.spectator-body { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 10px 20px; padding-block: 10px; }.duel-caption { grid-column: 1 / -1; }.duel-stage { margin: 0; padding-block: 7px; gap: 30px; }.pokemon-stage { height: 84px; }.pokemon-stage .pokemon-portrait { width: 80px; height: 80px; }.combatant-info h3 { font-size: 12px; margin-bottom: 5px; }.duel-journal { align-self: center; }.duel-journal ol { max-height: 140px; }.match-conclusion { grid-column: 1 / -1; margin: 0; }footer { padding-block: 6px; } }
@media (prefers-reduced-motion: reduce) { .health-track i { transition: none; } }
</style>

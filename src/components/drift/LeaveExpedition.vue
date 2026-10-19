<template>
  <div class="leave-expedition">
    <button v-if="!confirming" type="button" data-expedition-leave :disabled="busy || disabled" @click="ask">{{ label }}</button>
    <div v-else class="leave-confirm" role="group" aria-label="Confirmer la sortie">
      <p>{{ phase === 'lobby' ? 'Tu vas quitter ce salon. Les autres dresseurs pourront continuer.' : phase === 'results' ? 'Revenir au choix d’une nouvelle expédition ?' : 'Abandonner cette expédition ? Ton équipe et ton butin seront perdus. Ton Aventure reste sauvegardée.' }}</p>
      <div><button ref="keep" type="button" :disabled="busy" @click="confirming=false">Continuer à jouer</button><button type="button" data-expedition-leave-confirm :disabled="busy || disabled" @click="$emit('confirm')">{{ busy ? 'Sortie…' : 'Confirmer la sortie' }}</button></div>
    </div>
  </div>
</template>
<script>
export default {
  props:{phase:String,busy:Boolean,disabled:Boolean},
  data(){return{confirming:false};},
  computed:{label(){return this.phase==='lobby'?'Quitter le salon':this.phase==='selection'?'Annuler l’expédition':this.phase==='results'?'Quitter cette expédition':'Abandonner l’expédition';}},
  methods:{ask(){this.confirming=true;this.$nextTick(()=>this.$refs.keep?.focus());}}
};
</script>
<style scoped>
.leave-expedition{margin-top:12px;font:12px/1.6 Arial,sans-serif}.leave-expedition button{min-height:44px;padding:9px 13px;border:1px solid #a78667;border-radius:8px;background:#faf5eb;color:#704a37;cursor:pointer;font:inherit}.leave-confirm{padding:12px;border:1px solid #cfb899;border-radius:10px;background:#faf5eb;color:#513e30}.leave-confirm p{margin:0 0 10px!important;color:inherit!important}.leave-confirm>div{display:flex;flex-wrap:wrap;gap:8px}.leave-expedition button:disabled{opacity:.6;cursor:wait}.leave-expedition button:focus-visible{outline:3px solid #287366;outline-offset:2px}
</style>

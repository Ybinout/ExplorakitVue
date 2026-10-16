<template>
  <section class="contracts" data-expedition-contracts>
    <header><p class="eyebrow">À TON RYTHME</p><h3>Les contrats de l’expédition</h3><p>Ils progressent automatiquement pendant tes rencontres. Aucun n’est obligatoire. Choisis une récompense par contrat accompli, avant la fin de l’exploration.</p></header>
    <p v-if="state.phase!=='exploration'" class="notice">L’exploration est terminée. Les récompenses non récupérées ont expiré.</p>
    <p role="status">{{ notice }}</p>
    <article v-for="contract in state.contracts" :key="contract.id" :data-contract="contract.key" :class="{complete:contract.complete}">
      <div class="contract-heading"><h4>{{ contract.name }}</h4><span>{{ contract.claimed ? '✓ Récupéré' : contract.complete ? 'Récompense prête' : `${contract.progress} / ${contract.goal}` }}</span></div>
      <p>{{ contract.description }}</p><progress :value="contract.progress" :max="contract.goal" :aria-label="contract.name" />
      <button v-if="contract.complete&&!contract.claimed&&state.phase==='exploration'" class="choose-reward" :aria-expanded="opened===contract.id" :disabled="busy||!state.alive" @click="opened=opened===contract.id?null:contract.id">Choisir ma récompense</button>
      <div v-if="opened===contract.id&&!contract.claimed&&state.phase==='exploration'" class="rewards"><p>Un seul choix. Tu conserves tes autres contrats.</p><button v-for="reward in contract.rewards" :key="reward.key" :data-contract-reward="reward.key" :disabled="busy||!reward.available||!state.alive" @click="claim(contract,reward)"><strong>{{ reward.name }}</strong><span>{{ reward.description }}</span><small v-if="!reward.available">Il te faut un équipier vivant en réserve.</small></button></div>
      <p v-if="contract.claimed" class="claimed">Récompense reçue : {{ rewardName(contract) }}.</p>
    </article>
    <details class="trainer-directory"><summary>Où trouver les dresseurs ?</summary><p>Approche-toi d’un dresseur et parle-lui avec A ou Espace. Tu verras son équipe avant d’accepter.</p><ul><li v-for="trainer in state.trainers" :key="trainer.id"><strong>{{ trainer.name }}</strong><span>{{ trainer.place }} · N. {{ trainer.level }} · {{ trainer.defeated?'Déjà vaincu':`${trainer.team.length} Pokémon` }}</span></li></ul></details>
  </section>
</template>
<script>
export default {props:{state:Object,execute:Function},data(){return {opened:null,busy:false,notice:''};},methods:{
 rewardName(c){return c.rewards.find(r=>r.key===c.claimed)?.name||'Choix enregistré';},
 async claim(c,r){if(this.busy)return;this.busy=true;this.notice='';try{const ok=await this.execute({name:'drift:contractClaim',data:{contractId:c.id,reward:r.key}});this.notice=ok?'Récompense reçue : '+r.name+'.':'Récompense non reçue. Vérifie le message du serveur puis réessaie.';if(ok)this.opened=null;}finally{this.busy=false;}}
}};
</script>
<style scoped>
.contracts{color:#24464b;max-width:800px;margin:auto}.eyebrow{color:#8c713e;font-size:10px;letter-spacing:.15em}h3{font:26px Georgia,serif;margin:6px 0 12px}.contracts p{font-size:13px;line-height:1.6}.contracts article{background:#fffdf3;border:1px solid #c7c9b4;padding:18px;border-radius:12px;margin:16px 0}.contracts article.complete{border-color:#668c6e}.contract-heading{display:flex;justify-content:space-between;gap:12px;align-items:start}.contract-heading h4{font:600 19px Georgia,serif;margin:0}.contract-heading span{flex-shrink:0;background:#e6eddf;border-radius:6px;padding:6px;font-size:12px}progress{width:100%;height:8px;accent-color:#377c64;display:block;margin:14px 0}.contracts button,.trainer-directory summary{min-height:44px;cursor:pointer}.contracts button{border:1px solid #aec2aa;border-radius:8px;padding:12px;font:inherit;text-align:left}.contracts button:disabled{opacity:.55;cursor:default}.choose-reward{background:#2c6f62;color:white;width:100%;font-size:14px!important}.rewards{display:grid;gap:9px;margin-top:12px}.rewards>p{margin:0}.rewards button{background:#edf1e3;display:grid;gap:6px;color:inherit}.rewards button span,.rewards small{font-size:12px;line-height:1.5}.claimed{color:#326d57}.trainer-directory{margin-top:24px}.trainer-directory summary{padding:12px 0;box-sizing:border-box}.trainer-directory ul{list-style:none;padding:0}.trainer-directory li{display:grid;gap:5px;padding:12px 0;border-bottom:1px solid #c8cfbd;font-size:13px}.notice{padding:12px;border:1px solid #cbb98b;background:#eee5cf}button:focus-visible,summary:focus-visible{outline:3px solid #a8873b;outline-offset:3px}@media(max-width:400px){.contracts article{padding:13px}.contract-heading{flex-wrap:wrap}.contract-heading h4{font-size:18px}}
</style>

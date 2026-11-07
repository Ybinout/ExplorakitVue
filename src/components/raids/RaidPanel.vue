<template>
 <div class="raid-backdrop" @keydown.stop @keyup.stop>
  <section ref="panel" tabindex="-1" class="raid-panel" role="dialog" aria-modal="true" aria-labelledby="raid-title" @keydown.esc.prevent="close" @keydown.tab="trap">
   <header><div><small>DARK CONTINENT · FAILLE DE CORRUPTION</small><h2 id="raid-title">{{ rift.name }} <span>N. {{ rift.level }}</span></h2></div><button class="raid-help" @click="help=true" aria-label="Comprendre les raids">?</button><button @click="close" :disabled="busy" aria-label="Fermer">×</button></header>
   <div class="raid-panel-body">
    <template v-if="!state">
     <div class="raid-preview"><div class="raid-preview-art"><pokemon-portrait :src="sprite(rift.boss)" :alt="rift.boss.name"/></div><div><span class="raid-tag">CORROMPU · K4</span><h3>{{ rift.boss.name }}</h3><p>Quatre Pokémon alliés. Un boss. Prépare tes soutiens et protège ton équipe.</p><b>1 à 4 dresseurs</b></div></div>
     <div class="raid-prizes"><b>{{ money(rift.reward.money) }} ₽ par dresseur</b><span>{{ rift.reward.platesGuaranteed?'Toutes les plaques garanties':'Chaque plaque : un tirage indépendant à 50 %' }}</span><span>Perle de Potentiel · {{ Math.round(rift.reward.pearl*100) }} %</span></div>
     <p class="raid-danger">Les K.O. sont définitifs ici. Un Kit de survie protège son porteur une fois. Tu peux retirer un Pokémon pour le sauver.</p>
     <button class="raid-primary" :disabled="busy" @click="$emit('command','enter',{riftId:rift.id})">Entrer dans la faille →</button>
    </template>
    <template v-else-if="state.phase==='lobby'">
     <div class="raid-lobby-title"><div><h3>Préparer l’expédition</h3><p>Choisis {{ me?.quota }} Pokémon de ton équipe actuelle, puis confirme.</p></div><span class="raid-tag">{{ state.members.length }} / 4 dresseurs</span></div>
     <div class="raid-members"><article v-for="(member,i) in state.members" :key="member.id" :class="{'is-ready':member.ready}"><header><b>{{ member.name }} <small v-if="member.id===userId">toi</small></b><span>{{ member.reserved?'En combat · place réservée':member.ready?'Prêt ✓':'Préparation' }}</span><button v-if="state.hostId===userId&&member.id!==userId" aria-label="Retirer ce participant" :disabled="busy" @click="$emit('command','remove',{userId:member.id})">×</button></header><div class="raid-slots"><button v-for="slot in member.quota" :key="slot" :disabled="!member.selected[slot-1]" @click="inspect(member.selected[slot-1])"><template v-if="member.selected[slot-1]"><pokemon-portrait :src="sprite(member.selected[slot-1])" alt=""/><b>{{ member.selected[slot-1].speciesName }}</b><small>N. {{ member.selected[slot-1].level }} · {{ member.selected[slot-1].types.map(type).join(' / ') }}</small></template><span v-else>+<small>Emplacement {{ i+1 }}.{{ slot }}</small></span></button></div><button v-if="state.members.length===3&&state.hostId===userId" class="raid-extra" :disabled="busy||state.extraOwner===i" @click="$emit('command','extra',{ownerId:member.id})">{{ state.extraOwner===i?'Fournit le 4e Pokémon':'Confier le 4e Pokémon' }}</button></article></div>
     <div v-if="!me?.reserved" class="raid-selection"><h4>Tes Pokémon <small>{{ me?.selected.length }} / {{ me?.quota }} choisis</small></h4><div><button v-for="p in inventory" :key="p.uuid" :disabled="busy||p.currentHp<=0" :aria-pressed="selected(p.uuid)" @click="toggle(p)"><pokemon-portrait :src="sprite(p)" alt=""/><span><b>{{ p.speciesName }}</b><small>N. {{ p.level }} · {{ p.currentHp }}/{{ p.maxHp }} PV</small></span><potential-star :value="p.potential"/><span v-if="selected(p.uuid)">✓</span></button></div></div>
     <div class="raid-invites"><label for="raid-friend">Inviter un ami</label><select id="raid-friend" v-model="friend"><option :value="null">Choisir un ami connecté</option><option v-for="f in availableFriends" :key="f.id" :value="f.id">{{ f.name || f.username }}</option></select><button :disabled="busy||!friend||state.members.length>=4" @click="$emit('command','invite',{userId:friend})">Inviter</button></div>
     <div class="raid-chat"><h4>Le campement</h4><ol ref="chat" aria-live="polite"><li v-for="m in state.chat" :key="m.id"><b>{{ m.name }}</b> {{ m.text }}</li><li v-if="!state.chat.length" class="raid-muted">Préparez votre stratégie ensemble.</li></ol><form @submit.prevent="send"><input v-model="message" maxlength="240" placeholder="Un message aux participants…" aria-label="Message aux participants"/><button :disabled="busy||!message.trim()">Envoyer</button></form></div>
     <footer><button :disabled="busy" @click="$emit('command','leave')">Quitter</button><button :disabled="busy||me?.reserved||me?.selected.length!==me?.quota||me?.ready" @click="$emit('command','ready')">{{ me?.ready?'Prêt ✓':'Je suis prêt' }}</button><button v-if="state.hostId===userId" class="raid-primary" :disabled="busy||!allReady" @click="$emit('command','start')">Lancer le raid →</button></footer>
    </template>
    <template v-else>
     <div class="raid-ended"><span class="raid-end-symbol">{{ state.won?'✧':'◇' }}</span><h3>{{ state.won?'La corruption cède.':state.phase==='closed'?'Expédition annulée':'La faille a résisté.' }}</h3><p>{{ state.won?'Votre victoire est sauvegardée.':'Les Pokémon retirés sont en sécurité. Les K.O. suivent les règles du Dark Continent.' }}</p></div><p v-if="state.reopensAt" class="raid-cooldown">La faille se reformera avec un autre Pokémon à {{ new Date(state.reopensAt).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}) }}.</p><p v-for="p in me?.casualties||[]" :key="p.uuid" class="raid-danger">{{ p.name }} : {{ p.protected?'Kit de survie consommé, K.O. récupérable après un soin.':'définitivement perdu.' }}</p><raid-rewards v-if="state.reward" :reward="state.reward"/><button class="raid-primary" :disabled="busy" @click="$emit('command','leave')">Revenir à l’exploration</button>
    </template>
    <p v-if="error" class="raid-error" role="alert">{{ error }}</p><p v-if="notice" class="raid-muted" role="status">{{ notice }}</p>
   </div>
  </section>
  <section v-if="help" class="raid-guide" role="dialog" aria-modal="true" aria-labelledby="raid-guide-title" @keydown.esc.stop="dismissHelp"><header><h2 id="raid-guide-title">Entrer préparé</h2><button @click="dismissHelp" aria-label="Fermer le guide">×</button></header><div><p>Chaque raid rassemble <b>quatre Pokémon, pour 1 à 4 dresseurs</b>. Chacun commande ses propres Pokémon. À trois, l’organisateur choisit qui fournit le quatrième.</p><h3>Deux actions à anticiper</h3><p>Le boss agit deux fois par tour. Une attaque de zone est annoncée à l’avance tous les deux tours : pense à Abri et aux soutiens.</p><h3>Protéger ses alliés</h3><p>Les dégâts font monter la jauge orange d’aggro ; les soins l’augmentent plus lentement. Par Ici et Poudre Fureur attirent l’attention à son maximum. Provoc l’augmente aussi. Les attaques de zone ignorent cette jauge.</p><h3>Briser la corruption</h3><p>À 70 % et 30 % de ses PV, le boss lève un bouclier qui réduit les dégâts de 75 %. Brise sa résistance pour obtenir deux tours de répit avant le prochain bouclier.</p><h3>Soutien et relais</h3><p>Choisis la carte d’un allié pour le soigner ou le soutenir. Passer la main sacrifie ton action et donne une réserve d’action à un allié, même s’il a déjà joué. Chaque réserve ne peut visiter un même Pokémon qu’une seule fois. Vœu soigne le prochain allié qui agit au tour suivant.</p><h3>Le danger est réel</h3><p>Une fois par Pokémon, l’amitié sauve d’une attaque mortelle à pleine vie. Ce sursis dure jusqu’à ton prochain choix. <b>Retirer mon Pokémon</b> le met définitivement à l’abri pour ce raid. Un K.O. sans Kit de survie reste une perte définitive.</p><p>Tu disposes de 30 secondes pour choisir. Une déconnexion ne remet pas le minuteur à zéro : sans action validée, ton Pokémon est retiré en sécurité.</p><h3>Une récompense pour chacun</h3><p>Chaque vainqueur reçoit sa propre prime et ses propres tirages de plaques et de Perle de Potentiel (+1 K, jusqu’à K4). Aucun gain d’XP dans les raids.</p></div><button class="raid-primary" @click="dismissHelp">J’ai compris</button></section>
  <pokemon-details v-if="detail" :pokemon="detail" :position="1" :total="1" read-only context-label="ALLIÉ DU RAID" @close="detail=null"/>
 </div>
</template>
<script>
import PokemonPortrait from '../PokemonPortrait.vue';
import RaidRewards from './RaidRewards.vue';
import PotentialStar from '../PotentialStar.vue';
import PokemonDetails from '../menu/PokemonDetails.vue';
import { computerPokemonDetails } from '@/services/pokemonComputer';
import { localizeTypeName } from '@/services/pokemonTypes';
export default {
  components: {
    PokemonPortrait,
    RaidRewards,
    PotentialStar,
    PokemonDetails
  },
  props: {
    preview: Object,
    state: Object,
    inventory: {
      type: Array,
      default: () => []
    },
    friends: {
      type: Array,
      default: () => []
    },
    userId: Number,
    busy: Boolean,
    error: String,
    notice: String,
    showTutorial: Boolean
  },
  data: () => ({
    friend: null,
    message: '',
    detail: null,
    help: false
  }),
  computed: {
    rift() {
      return this.state?.rift || this.preview;
    },
    me() {
      return this.state?.members.find(m => m.id === this.userId);
    },
    allReady() {
      return this.state?.members.every(m => m.ready && !m.reserved);
    },
    availableFriends() {
      return this.friends.filter(f => f.online && !this.state?.members.some(m => m.id === f.id));
    }
  },
  mounted() {
    this._previous = document.activeElement;
    this.$refs.panel.focus({
      preventScroll: true
    });
    this.help = this.showTutorial;
  },
  beforeDestroy() {
    if (this._previous?.isConnected) this._previous.focus({
      preventScroll: true
    });
  },
  watch: {
    showTutorial(value) {
      if (value) this.help = true;
    },
    'state.chat.length'() {
      this.$nextTick(() => {
        if (this.$refs.chat) this.$refs.chat.scrollTop = this.$refs.chat.scrollHeight;
      });
    }
  },
  methods: {
    type: localizeTypeName,
    money: n => Number(n || 0).toLocaleString('fr-FR'),
    sprite(p) {
      return this.$pokemonSprite(p);
    },
    inspect(p) {
      this.detail = computerPokemonDetails(p);
    },
    selected(uuid) {
      return this.me?.selected.some(p => p.uuid === uuid);
    },
    toggle(p) {
      const ids = this.me.selected.map(p => p.uuid),
        i = ids.indexOf(p.uuid);
      if (i >= 0) ids.splice(i, 1);else if (ids.length < this.me.quota) ids.push(p.uuid);else return;
      this.$emit('command', 'select', {
        uuids: ids
      });
    },
    send() {
      if (!this.message.trim()) return;
      this.$emit('command', 'chat', {
        text: this.message.trim()
      });
      this.message = '';
    },
    dismissHelp() {
      this.help = false;
      this.$emit('command', 'tutorial');
    },
    close() {
      if (this.help) {
        this.dismissHelp();
        return;
      }
      if (this.busy) return;
      if (this.state && this.state.phase!=='lobby')this.$emit('command','leave');else if (this.state) this.$emit('minimize');else this.$emit('close');
    },
    trap(e) {
      const list = [...this.$refs.panel.querySelectorAll('button:not(:disabled),input,select')].filter(n => n.getClientRects().length),
        a = list[0],
        b = list.at(-1);
      if (e.shiftKey && [a, this.$refs.panel].includes(document.activeElement)) {
        e.preventDefault();
        b?.focus();
      } else if (!e.shiftKey && document.activeElement === b) {
        e.preventDefault();
        a?.focus();
      }
    }
  }
};
</script>
<style scoped>
.raid-backdrop{position:fixed;inset:0;z-index:2250;display:grid;place-items:center;background:#0d1025bc;padding:14px;color:var(--journal-ink);font:14px/1.5 var(--journal-font)}.raid-backdrop *{box-sizing:border-box}.raid-panel{width:min(880px,100%);max-height:calc(100dvh - 28px);display:flex;flex-direction:column;background:var(--journal-paper);border:1px solid #a389ba;border-radius:16px;box-shadow:0 20px 90px #05071480;overflow:hidden}.raid-panel>header{padding:18px 24px;border-bottom:1px solid var(--journal-border);background:var(--journal-soft)}header{display:flex;gap:10px;align-items:center}header>div{flex:1;min-width:0}header small{font-size:9px;letter-spacing:.14em;color:var(--journal-muted)}h2{font:500 28px Georgia,serif;margin:4px 0;color:var(--journal-heading)}h2 span{font:12px var(--journal-font);margin-left:10px}h3,h4,p{margin:0 0 10px}h3{font:500 22px Georgia,serif;color:var(--journal-heading)}h4{font-size:12px}h4 small{font-weight:400;margin-left:8px}.raid-panel-body{overflow:auto;overscroll-behavior:contain;padding:22px;scrollbar-gutter:stable}button,select,input{font:inherit;color:inherit;border:1px solid var(--journal-border);border-radius:8px;background:var(--journal-card);padding:9px 12px;min-height:42px}button{cursor:pointer}button:disabled{opacity:.45;cursor:default}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #a775ca;outline-offset:2px}header>button{min-width:42px;font-size:20px;padding:4px}.raid-preview{display:flex;gap:26px;align-items:center}.raid-preview-art{width:200px;height:190px;flex:none;display:grid;place-items:center;background:radial-gradient(ellipse,#b598d956,transparent 68%)}.raid-preview-art .pokemon-portrait{width:160px;height:160px;object-fit:contain;image-rendering:pixelated}.raid-tag{display:inline-block;color:#79509e;border:1px solid #9a75bb66;background:#a583c322;padding:4px 8px;font-size:10px;letter-spacing:.05em;border-radius:6px;margin-bottom:8px}.raid-prizes{display:flex;flex-wrap:wrap;gap:8px;padding:16px;background:var(--journal-soft);border:1px solid var(--journal-border);border-radius:10px;margin:16px 0}.raid-prizes b{width:100%;color:var(--journal-heading)}.raid-prizes span{font-size:12px;background:var(--journal-paper);padding:4px 9px;border-radius:5px}.raid-danger{padding:12px 15px;border-left:3px solid #ad7e58;font-size:12px;color:var(--journal-muted)}.raid-primary{background:#75558d;color:#fff;border-color:#8e70a3;font-weight:600}.raid-lobby-title{display:flex;gap:10px;align-items:center;justify-content:space-between}.raid-lobby-title p{font-size:12px;color:var(--journal-muted)}.raid-members{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.raid-members article{border:1px solid var(--journal-border);border-radius:10px;padding:12px;background:var(--journal-card)}.raid-members article.is-ready{border-color:#80a38b}.raid-members header{font-size:12px;justify-content:space-between}.raid-members header span{font-size:10px;color:var(--journal-muted)}.raid-members header small{font-size:9px;letter-spacing:0}.raid-members header>button{min-height:28px;min-width:28px;font-size:16px}.raid-slots{display:flex;gap:5px;margin-top:8px}.raid-slots button{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;padding:5px;font-size:11px;background:var(--journal-paper)}.raid-slots button:disabled{opacity:.65}.raid-slots .pokemon-portrait{height:54px;width:60px;object-fit:contain;image-rendering:pixelated}.raid-slots small{font-size:9px;display:block}.raid-slots>button>span{font-size:23px;color:var(--journal-muted);padding:4px}.raid-extra{font-size:10px;padding:4px 8px;min-height:30px;margin-top:8px}.raid-selection{margin:18px 0}.raid-selection>div{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.raid-selection button{display:flex;gap:6px;align-items:center;padding:7px;text-align:left;min-width:0}.raid-selection button[aria-pressed=true]{border-color:#9c75bc;background:#a783bb22}.raid-selection .pokemon-portrait{width:44px;height:44px;object-fit:contain;image-rendering:pixelated}.raid-selection b,.raid-selection small{display:block;font-size:11px;overflow-wrap:anywhere}.raid-selection small{font-size:9px;color:var(--journal-muted)}.raid-selection .potential-star{flex:none}.raid-invites{display:flex;gap:8px;align-items:center;margin:14px 0}.raid-invites label{font-size:12px}.raid-invites select{flex:1;min-width:0;font-size:12px}.raid-chat{border-top:1px solid var(--journal-border);padding-top:14px}.raid-chat ol{list-style:none;padding:8px 12px;margin:0 0 8px;max-height:115px;overflow:auto;background:var(--journal-soft);border-radius:8px;font-size:12px;min-height:45px;overflow-wrap:anywhere}.raid-chat li+li{margin-top:4px}.raid-chat b{color:#9370ac;margin-right:5px}.raid-chat form{display:flex;gap:8px}.raid-chat input{flex:1;min-width:0}.raid-chat button{font-size:12px}footer{display:flex;gap:8px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap}.raid-error{color:var(--journal-danger);padding:10px;background:var(--journal-soft);margin:12px 0 0}.raid-muted{color:var(--journal-muted);font-size:12px}.raid-ended{text-align:center;padding:10px}.raid-end-symbol{font-size:60px;color:#a280bd}.raid-guide{position:absolute;width:min(600px,calc(100% - 24px));max-height:calc(100dvh - 30px);display:flex;flex-direction:column;gap:12px;background:var(--journal-paper);border:2px solid #a386b9;border-radius:14px;padding:22px;box-shadow:0 0 0 100vmax #090a18a8;z-index:2}.raid-guide header h2{flex:1}.raid-guide>div{overflow:auto;font-size:13px;padding-right:10px}.raid-guide h3{font:600 14px var(--journal-font);margin:16px 0 6px}.raid-guide>button{flex:none}@media(max-width:600px){.raid-backdrop{padding:6px}.raid-panel{max-height:calc(100dvh - 12px)}.raid-panel>header{padding:12px}.raid-panel-body{padding:12px}h2{font-size:23px}.raid-preview{gap:10px}.raid-preview-art{width:110px;height:145px}.raid-preview-art .pokemon-portrait{width:110px;height:130px}.raid-preview p{font-size:12px}.raid-members{grid-template-columns:1fr}.raid-selection>div{grid-template-columns:repeat(2,minmax(0,1fr))}.raid-invites{flex-wrap:wrap}.raid-invites label{width:100%}.raid-guide{padding:16px}.raid-lobby-title{align-items:flex-start}.raid-slots b{font-size:10px}}
</style>

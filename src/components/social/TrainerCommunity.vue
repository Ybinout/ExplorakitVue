<template>
  <main class="trainer-community" data-trainer-community>
    <div class="community-shell">
      <nav class="community-top"><router-link to="/">← Les aventures</router-link><span>LE CARNET DES DRESSEURS</span></nav>
      <header><p class="eyebrow">LES RENCONTRES FONT L’AVENTURE</p><h1>{{ tab==='profil' ? 'Carnet de dresseur' : tab==='amis' ? 'Ton cercle d’amis' : tab==='classement' ? 'Les meilleurs des Rifts' : 'Rencontre les dresseurs' }}</h1><p>Retrouve tes compagnons, découvre tes rivaux et gravis les rangs.</p></header>
      <nav class="community-tabs" aria-label="Carnet des dresseurs">
        <router-link :to="`/profil/${userId}`" :aria-current="tab==='profil' && targetId===userId ? 'page' : null">Mon profil</router-link>
        <router-link to="/dresseurs?onglet=amis" :aria-current="tab==='amis' ? 'page' : null">Amis <span v-if="friends.incoming.length" class="count">{{ friends.incoming.length }}</span></router-link>
        <router-link to="/dresseurs?onglet=classement" :aria-current="tab==='classement' ? 'page' : null">Classements</router-link>
        <router-link to="/dresseurs?onglet=recherche" :aria-current="tab==='recherche' ? 'page' : null">Rechercher</router-link>
      </nav>
      <p v-if="error" class="error" role="alert">{{ error }} <button class="quiet-button" @click="load">Réessayer</button></p>
      <p v-if="notice" class="notice" role="status">{{ notice }}</p>
      <p v-if="loading" class="empty" role="status">Ouverture du carnet…</p>
      <template v-else-if="tab==='profil' && profile">
        <section class="profile-heading" :style="profile.frame ? {borderColor:profile.frame} : {}" data-trainer-profile>
          <span class="portrait" aria-hidden="true"><span :class="{'second-sprite':profile.sprite==='sprite2.png'}" /></span>
          <div><p class="eyebrow">{{ targetId===userId ? 'TON PROFIL' : 'LE DRESSEUR' }}</p><h2>{{ profile.username }}</h2><p v-if="profile.title">{{ profile.title }}</p></div>
          <friend-actions :relationship="profile.relationship" :busy="busy" @action="act(profile.id,$event)" />
        </section>
        <div class="profile-grid">
          <section class="community-card rift-card"><p class="eyebrow">RIFT MULTIJOUEUR</p><rank-badge :rank="profile.rift.rank" :detail="`${number(profile.rift.rating)} Elo`" />
            <p class="muted">{{ profile.rift.ratedGames ? `${profile.rift.ratedGames} expédition${profile.rift.ratedGames>1 ? 's' : ''} classée${profile.rift.ratedGames>1 ? 's' : ''}` : 'Premier rang après une expédition terminée.' }}</p>
            <div v-if="profile.rift.ratedGames" class="rank-progress"><progress :value="profile.rift.rank.progress" max="100" :aria-label="`Progression du rang ${profile.rift.rank.name}`"/><span>{{ profile.rift.rank.next ? `${number(profile.rift.rank.next.minimum-profile.rift.rating)} Elo avant ${profile.rift.rank.next.name}` : 'Diamant · Le sommet des rangs' }}</span></div>
            <dl class="trainer-stats"><div><dt>Victoires</dt><dd>{{ number(profile.rift.wins) }}</dd></div><div><dt>Défaites</dt><dd>{{ number(profile.rift.losses) }}</dd></div><div><dt>Départs</dt><dd>{{ number(profile.rift.gamesStarted) }}</dd></div></dl>
            <router-link class="text-link" to="/dresseurs?onglet=classement">Voir le classement Rift →</router-link>
          </section>
          <section v-for="record in profile.colosseum" :key="record.durationMinutes" class="community-card"><p class="eyebrow">COLOSSEUM · {{ record.durationMinutes===30 ? '30 MIN' : '1 HEURE' }}</p><rank-badge :rank="record.rank" :detail="`${number(record.score)} points`" />
            <p class="muted">{{ record.wins ? `${record.wins} dresseurs vaincus sur ce record` : 'Aucun record classé dans ce format.' }}</p>
            <div v-if="record.wins" class="rank-progress"><progress :value="record.rank.progress" max="100" :aria-label="`Progression du rang ${record.rank.name}`"/><span>{{ record.rank.next ? `${number(record.rank.next.minimum-record.score)} points avant ${record.rank.next.name}` : 'Diamant · Le sommet des rangs' }}</span></div>
            <div v-if="record.team.length" class="record-team" aria-label="Équipe du record"><span v-for="(p,index) in record.team" :key="index"><img :src="`${$assetBase}img/pokemon/front/${p.pokemonId}.png`" :alt="p.name"/><small>N. {{ p.level }}{{ p.knockedOut ? ' · K.O.' : '' }}</small></span></div>
          </section>
        </div>
        <p class="privacy-note">Les profils montrent les rangs, résultats et équipes des records Colosseum. Les objets, pièces et Pokémon de l’Aventure restent privés.</p>
      </template>
      <template v-else-if="tab==='amis'">
        <div class="section-title"><h2>Les liens du camp</h2><button class="quiet-button" :disabled="busy" @click="load">Actualiser</button></div>
        <p v-if="!friendGroups.some(g=>g.entries.length)" class="empty">Ton carnet attend ses premières rencontres. <router-link to="/dresseurs?onglet=recherche">Chercher un ami →</router-link></p>
        <section v-for="group in friendGroups.filter(g=>g.entries.length)" :key="group.key" class="friend-group"><h3>{{ group.title }} <small>{{ group.entries.length }}</small></h3>
          <ul class="trainer-list"><li v-for="trainer in group.entries" :key="trainer.id" :data-trainer-id="trainer.id"><router-link class="trainer-link" :to="`/profil/${trainer.id}`"><strong>{{ trainer.username }}</strong><rank-badge :rank="trainer.rift.rank" :detail="`${number(trainer.rift.rating)} Elo`" /></router-link><friend-actions :relationship="trainer.relationship" :busy="busy" @action="act(trainer.id,$event)"/></li></ul>
        </section>
      </template>
      <section v-else-if="tab==='recherche'" class="community-card search-card">
        <h2>Un nom, une nouvelle rencontre</h2><form class="trainer-search" @submit.prevent="search(0)"><label for="trainer-search">Nom du dresseur<input id="trainer-search" v-model.trim="query" minlength="2" maxlength="50" required autocomplete="off" placeholder="Les premières lettres de son nom"/></label><button :disabled="searching">{{ searching ? 'Recherche…' : 'Rechercher' }}</button></form>
        <p class="muted">Au moins deux lettres. Ouvre un profil pour envoyer une demande d’ami.</p>
        <p v-if="searched && !results.length && !searching" class="empty">Aucun dresseur ne correspond à ce nom.</p>
        <ul class="trainer-list"><li v-for="trainer in results" :key="trainer.id" :data-trainer-id="trainer.id"><router-link class="trainer-link" :to="`/profil/${trainer.id}`"><strong>{{ trainer.username }}</strong><rank-badge :rank="trainer.rift.rank" :detail="`${number(trainer.rift.rating)} Elo`"/><span class="text-link">Voir le profil →</span></router-link></li></ul>
        <div v-if="searched" class="pagination"><button v-if="offset>0" class="quiet-button" :disabled="searching" @click="search(offset-20)">← Précédents</button><button v-if="hasMore" class="quiet-button" :disabled="searching" @click="search(offset+20)">Suivants →</button></div>
      </section>
      <template v-else-if="tab==='classement'">
        <div class="ranking-modes" aria-label="Mode du classement"><button v-for="mode in rankingModes" :key="mode.key" :aria-pressed="rankingMode===mode.key" :data-ranking-mode="mode.key" @click="rankingMode=mode.key;load()">{{ mode.label }}</button></div>
        <section class="community-card"><div class="section-title"><h2>{{ rankingMode==='rift' ? 'Le classement Elo' : 'Les records du Colosseum' }}</h2><button class="quiet-button" @click="load">Actualiser</button></div>
          <p class="muted">Les 50 premiers dresseurs. Ton rang personnel reste visible au-delà du top 50.</p>
          <p v-if="personal" class="personal-rank" data-personal-rank>Ta position : <strong>#{{ personal.position || personal.rank }}</strong> · {{ number(rankingMode==='rift' ? personal.rift.rating : personal.score) }} {{ rankingMode==='rift' ? 'Elo' : 'points' }}</p>
          <p v-if="!ranking.length" class="empty">Le classement attend ses premiers dresseurs.</p>
          <ol class="trainer-list ranking-list"><li v-for="trainer in ranking" :key="trainer.id || trainer.userId" :data-trainer-id="trainer.id || trainer.userId"><span class="position">{{ trainer.position || trainer.rank }}</span><router-link class="trainer-link" :to="`/profil/${trainer.id || trainer.userId}`"><strong>{{ trainer.username }}<small v-if="(trainer.id || trainer.userId)===userId"> · toi</small></strong><rank-badge :rank="rankingMode==='rift' ? trainer.rift.rank : trainer.league" :detail="`${number(rankingMode==='rift' ? trainer.rift.rating : trainer.score)} ${rankingMode==='rift' ? 'Elo' : 'points'}`"/></router-link></li></ol>
        </section>
        <details class="ranking-rules"><summary>Comprendre les rangs</summary><p>En Rift, tu démarres à 1 000 Elo. Chaque expédition terminée compare ta place à celle des autres dresseurs et à leur Elo. Battre des joueurs mieux classés rapporte davantage. Les éliminations au même tour partagent la même place ; les abandons restent comptés. Les rangs débutent après ta première partie classée. Les anciennes parties ne sont pas recalculées.</p><ul><li v-for="(name,i) in rankNames" :key="name"><strong>{{ name }}</strong><span>Rift : {{ i===0 ? 'moins de 1 200' : number(rules.eloThresholds[i])+' et plus' }} Elo</span><span>Colosseum : {{ i===0 ? '1 victoire' : number(rules.colosseumThresholds[i])+' points' }}</span></li></ul><p>Le Colosseum utilise ton meilleur score, avec un rang distinct en 30 et 60 minutes. Une tentative moins bonne ne fait pas perdre ce rang.</p></details>
      </template>
    </div>
  </main>
</template>
<script>
import api from '@/services/api';
import { getSession } from '@/services/session';
import RankBadge from './RankBadge.vue';
import FriendActions from './FriendActions.vue';
export default {
  name:'TrainerCommunity',components:{RankBadge,FriendActions},
  data(){return {userId:Number(getSession()?.id),profile:null,friends:{accepted:[],incoming:[],outgoing:[]},loading:false,busy:false,error:'',notice:'',request:0,searchRequest:0,query:'',results:[],searched:false,searching:false,offset:0,hasMore:false,rankingMode:'rift',ranking:[],personal:null,rules:{eloThresholds:[0,1200,1400,1600,1800],colosseumThresholds:[]},rankNames:['Bronze','Argent','Or','Platine','Diamant'],rankingModes:[{key:'rift',label:'Rift multijoueur'},{key:'30',label:'Colosseum · 30 min'},{key:'60',label:'Colosseum · 1 h'}]};},
  computed:{tab(){return this.$route.params.id?'profil':['amis','classement','recherche'].includes(this.$route.query.onglet)?this.$route.query.onglet:'profil';},targetId(){return Number(this.$route.params.id || this.userId);},friendGroups(){return [{key:'incoming',title:'Demandes reçues',entries:this.friends.incoming},{key:'accepted',title:'Tes amis',entries:this.friends.accepted},{key:'outgoing',title:'Demandes envoyées',entries:this.friends.outgoing}];}},
  watch:{'$route':{immediate:true,handler(){this.notice='';this.searchRequest++;this.searching=false;this.load();}}},
  beforeDestroy(){this.request++;this.searchRequest++;},
  methods:{
    number(n){return Number(n || 0).toLocaleString('fr-FR');},
    async load(){const request=++this.request;this.loading=true;this.error='';this.profile=null;
      try{const {data:friends}=await api.get('/community/friends');if(request!==this.request)return;this.friends=friends;
        if(this.tab==='profil'){const {data}=await api.get(`/community/profiles/${this.targetId}`);if(request!==this.request)return;this.profile=data;}
        if(this.tab==='classement'){const {data:rift}=await api.get('/community/leaderboard');if(request!==this.request)return;this.rules=rift.rules;let data=rift;
          if(this.rankingMode!=='rift')({data}=await api.get('/rift/colosseum/leaderboard',{params:{durationMinutes:Number(this.rankingMode)}}));if(request!==this.request)return;this.ranking=data.entries;this.personal=data.personal;}
      }catch(e){if(request===this.request)this.error=e.response?.data?.message || 'Impossible d’ouvrir le carnet.';}finally{if(request===this.request)this.loading=false;}
    },
    async search(offset){const request=++this.searchRequest;this.searching=true;this.error='';try{const {data}=await api.get('/community/search',{params:{q:this.query,offset}});if(request!==this.searchRequest)return;this.results=data.entries;this.hasMore=data.hasMore;this.offset=offset;this.searched=true;}catch(e){if(request===this.searchRequest)this.error=e.response?.data?.message || 'Recherche indisponible.';}finally{if(request===this.searchRequest)this.searching=false;}},
    async act(id,action){if(this.busy)return;this.busy=true;this.error='';this.notice='';try{const {data}=await api.post(`/community/friends/${id}`,{action});await this.load();this.notice={request:'Demande envoyée. Le dresseur pourra l’accepter dans son carnet.',accept:'Vous êtes maintenant amis.',decline:'Demande refusée.',cancel:'Demande annulée.',remove:'Dresseur retiré de tes amis.'}[action];if(action==='request' && data.relationship==='incoming')this.notice='Ce dresseur t’a déjà envoyé une demande. Tu peux l’accepter.';}catch(e){this.error=e.response?.data?.message || 'Cette action n’a pas pu être enregistrée.';}finally{this.busy=false;}}
  }
};
</script>
<style scoped src="./community.css"></style>

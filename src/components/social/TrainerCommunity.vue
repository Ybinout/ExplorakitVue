<template>
  <main class="trainer-community" data-trainer-community>
    <div class="community-shell">
      <nav class="community-top"><router-link to="/">← Les aventures</router-link><span>LE CARNET DES DRESSEURS</span></nav>
      <header><p class="eyebrow">LES RENCONTRES FONT L’AVENTURE</p><h1>{{ tab==='profil' ? 'Carnet de dresseur' : tab==='amis' ? 'Ton cercle d’amis' : tab==='classement' ? 'Les classements de RiftMon' : 'Rencontre les dresseurs' }}</h1><p>Retrouve tes compagnons, découvre tes rivaux et gravis les rangs.</p></header>
      <nav class="community-tabs" aria-label="Carnet des dresseurs">
        <router-link :to="`/profil/${userId}`" :aria-current="tab==='profil' && targetId===userId ? 'page' : null">Mon profil</router-link>
        <router-link to="/dresseurs?onglet=amis" :aria-current="tab==='amis' ? 'page' : null">Amis <span v-if="friends.incoming.length" class="count">{{ friends.incoming.length }}</span></router-link>
        <router-link to="/classements" :aria-current="tab==='classement' ? 'page' : null">Classements</router-link>
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
          <section class="community-card rift-card"><p class="eyebrow">RIFT MULTIJOUEUR</p><rank-progress :rank="profile.rift.rank" :value="profile.rift.rating" unit="Elo" empty-hint="Termine une expédition Rift pour obtenir ton premier rang."/><p class="muted">{{ number(profile.rift.rating) }} Elo</p>
            <p class="muted">{{ profile.rift.ratedGames ? `${profile.rift.ratedGames} expédition${profile.rift.ratedGames>1 ? 's' : ''} classée${profile.rift.ratedGames>1 ? 's' : ''}` : 'Premier rang après une expédition terminée.' }}</p>
            <dl class="trainer-stats"><div><dt>Victoires</dt><dd>{{ number(profile.rift.wins) }}</dd></div><div><dt>Défaites</dt><dd>{{ number(profile.rift.losses) }}</dd></div><div><dt>Départs</dt><dd>{{ number(profile.rift.gamesStarted) }}</dd></div></dl>
            <router-link class="text-link" to="/classements">Voir le classement Rift →</router-link>
          </section>
          <section v-for="record in profile.colosseum" :key="record.durationMinutes" class="community-card"><p class="eyebrow">COLOSSEUM · {{ record.durationMinutes===30 ? '30 MIN' : '1 HEURE' }}</p><rank-progress :rank="record.rank" :value="record.score"/><p class="muted">{{ number(record.score) }} points</p>
            <p class="muted">{{ record.wins ? `${record.wins} dresseurs vaincus sur ce record` : 'Aucun record classé dans ce format.' }}</p>
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
      <template v-else-if="tab==='classement' && !error">
        <div class="ranking-modes" aria-label="Mode du classement"><button v-for="mode in rankingModes" :key="mode.key" :aria-pressed="rankingMode===mode.key" :data-ranking-mode="mode.key" @click="selectRanking(mode.key)">{{ mode.label }}</button></div>
        <div class="ranked-overview">
          <section class="community-card ranked-personal"><p class="eyebrow">TON RANG · {{ rankingMode==='rift' ? 'RIFT MULTIJOUEUR' : `COLOSSEUM ${rankingMode} MIN` }}</p>
            <rank-progress :rank="personalLeague" :value="personalValue" :unit="rankingMode==='rift' ? 'Elo' : 'points'" :empty-hint="rankingMode==='rift' ? 'Termine une expédition multijoueur pour entrer dans le classement.' : 'Remporte au moins un combat dans l’arène pour inscrire ton record.'"/>
            <p v-if="personal" class="personal-rank" data-personal-rank>Ta position : <strong>#{{ personal.position || personal.rank }}</strong> · {{ number(personalValue) }} {{ rankingMode==='rift' ? 'Elo' : 'points' }}</p>
            <router-link class="ranked-play" :to="rankingMode==='rift' ? '/drift' : '/colosseum'">{{ rankingMode==='rift' ? 'Jouer un Rift' : 'Jouer au Colosseum' }} →</router-link>
          </section>
          <section class="community-card ranked-road"><p class="eyebrow">LA ROUTE VERS DIAMANT</p><ol aria-label="Les cinq ligues"><li v-for="(name,i) in rankNames" :key="name" :class="{current:personalLeague.key===rankKeys[i]}"><rank-badge :rank="{key:rankKeys[i],name}"/><small>IV → III → II → I</small></li></ol><p class="muted">100 points de ligue pour remplir une division. Les PL indiquent ta progression à partir de ton {{ rankingMode==='rift' ? 'Elo' : 'meilleur score' }}.</p></section>
        </div>
        <section class="community-card ranked-board"><div class="section-title"><div><p class="eyebrow">LE TABLEAU DES DRESSEURS</p><h2>{{ rankingMode==='rift' ? 'Rift multijoueur' : `Colosseum · ${rankingMode==='30' ? '30 minutes' : '1 heure'}` }}</h2></div><button class="quiet-button" @click="load">Actualiser</button></div>
          <p class="muted">Les 50 premiers. Ta position personnelle reste visible au-delà du top 50.</p>
          <p v-if="!ranking.length" class="empty">Le classement attend ses premiers dresseurs. À toi de prendre la première place !</p>
          <ol class="trainer-list ranking-list"><li v-for="trainer in ranking" :key="trainer.id || trainer.userId" :data-trainer-id="trainer.id || trainer.userId" :class="{me:(trainer.id || trainer.userId)===userId,podium:(trainer.position || trainer.rank)<=3}">
            <span class="position">#{{ trainer.position || trainer.rank }}</span><div class="ranked-player"><router-link class="trainer-link" :to="`/profil/${trainer.id || trainer.userId}`"><strong>{{ trainer.username }}<small v-if="(trainer.id || trainer.userId)===userId"> · toi</small></strong><rank-badge :rank="rankingMode==='rift' ? trainer.rift.rank : trainer.league" :detail="`${(rankingMode==='rift' ? trainer.rift.rank : trainer.league).lp} PL`"/></router-link>
              <div v-if="rankingMode!=='rift' && trainer.team.length" class="ranking-team" aria-label="Équipe du record"><img v-for="(p,index) in trainer.team" :key="index" :src="`${$assetBase}img/pokemon/front/${p.pokemonId}.png`" :alt="p.name" :title="`${p.name} · N. ${p.level}${p.knockedOut ? ' · K.O.' : ''}`"/></div>
            </div><div class="ranked-value"><strong>{{ number(rankingMode==='rift' ? trainer.rift.rating : trainer.score) }}</strong><small>{{ rankingMode==='rift' ? 'Elo' : 'points' }}</small><span>{{ rankingMode==='rift' ? `${trainer.rift.ratedGames} partie${trainer.rift.ratedGames>1 ? 's' : ''}` : `${trainer.wins} victoire${trainer.wins>1 ? 's' : ''}` }}</span></div>
          </li></ol>
        </section>
        <details class="ranking-rules"><summary>Comprendre les rangs et les points</summary><p>Chaque ligue comporte quatre divisions : IV, III, II puis I. Les points de ligue (PL) vont de 0 à 100 ; ils représentent l’avancement dans la division, pas une monnaie. Une promotion repart à 0 PL dans la division suivante. Au sommet de Diamant I, ton score continue de départager le classement.</p><p>En Rift, tu démarres à 1 000 Elo. Chaque expédition terminée compare ta place à celle des autres dresseurs et à leur Elo. Battre des joueurs mieux classés rapporte davantage. Une défaite peut faire perdre des PL ou une division. Les éliminations au même tour partagent la même place ; les abandons restent comptés. Ton premier rang arrive après une partie classée. Les cotes existantes sont conservées.</p><ul><li v-for="(name,i) in rankNames" :key="name"><strong>{{ name }} IV</strong><span>Rift : {{ number(rules.eloThresholds[i]) }} Elo</span><span>Colosseum : {{ i===0 ? '1 victoire pour être classé' : number(rules.colosseumThresholds[i])+' points' }}</span></li></ul><p>Le Colosseum utilise ton meilleur score, avec un rang distinct en 30 et 60 minutes. Une tentative moins bonne ne fait pas perdre ce rang. Argent, Or, Platine et Diamant correspondent aux scores cumulés des défis 5, 10, 15 et 20. À égalité de score et de victoires, le premier record établi garde sa place.</p></details>
      </template>
    </div>
  </main>
</template>
<script>
import api from '@/services/api';
import { getSession } from '@/services/session';
import RankProgress from './RankProgress.vue';
import RankBadge from './RankBadge.vue';
import FriendActions from './FriendActions.vue';
export default {
  name:'TrainerCommunity',components:{RankBadge,RankProgress,FriendActions},
  data(){return {userId:Number(getSession()?.id),profile:null,friends:{accepted:[],incoming:[],outgoing:[]},loading:false,busy:false,error:'',notice:'',request:0,searchRequest:0,query:'',results:[],searched:false,searching:false,offset:0,hasMore:false,rankingMode:'rift',ranking:[],personal:null,rules:{eloThresholds:[0,1200,1400,1600,1800],colosseumThresholds:[]},rankKeys:['bronze','silver','gold','platinum','diamond'],rankNames:['Bronze','Argent','Or','Platine','Diamant'],rankingModes:[{key:'rift',label:'Rift multijoueur'},{key:'30',label:'Colosseum · 30 min'},{key:'60',label:'Colosseum · 1 h'}]};},
  computed:{personalLeague(){return (this.rankingMode==='rift'?this.personal?.rift?.rank:this.personal?.league)||{key:'unranked',name:'Non classé'};},personalValue(){return Number(this.rankingMode==='rift'?this.personal?.rift?.rating:this.personal?.score)||0;},tab(){if(this.$route.name==='Rankings')return 'classement';return this.$route.params.id?'profil':['amis','classement','recherche'].includes(this.$route.query.onglet)?this.$route.query.onglet:'profil';},targetId(){return Number(this.$route.params.id || this.userId);},friendGroups(){return [{key:'incoming',title:'Demandes reçues',entries:this.friends.incoming},{key:'accepted',title:'Tes amis',entries:this.friends.accepted},{key:'outgoing',title:'Demandes envoyées',entries:this.friends.outgoing}];}},
  watch:{'$route':{immediate:true,handler(){this.rankingMode=['rift','30','60'].includes(this.$route.query.mode)?this.$route.query.mode:'rift';this.notice='';this.searchRequest++;this.searching=false;this.load();}}},
  beforeDestroy(){this.request++;this.searchRequest++;},
  methods:{
    selectRanking(mode){if(this.rankingMode===mode)return;this.$router.push({path:'/classements',query:{mode}});},
    number(n){return Number(n || 0).toLocaleString('fr-FR');},
    async load(){const request=++this.request;this.loading=true;this.error='';this.profile=null;if(this.tab==='classement'){this.ranking=[];this.personal=null;}
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

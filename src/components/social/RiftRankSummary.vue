<template><div class="rank-summary" data-rift-rank-summary><template v-if="profile"><rank-badge :rank="profile.rift.rank" :detail="`${profile.rift.rank.lp} PL · ${profile.rift.rating.toLocaleString('fr-FR')} Elo`"/><div><router-link :to="`/profil/${profile.id}`" :target="inLobby ? '_blank' : null" rel="noopener">Mon profil et mes amis ↗</router-link><router-link to="/classements" :target="inLobby ? '_blank' : null" rel="noopener">Classements →</router-link></div></template><p v-else-if="failed">Rang indisponible. <button @click="load">Réessayer</button></p><span v-else>Chargement du rang…</span></div></template>
<script>
import api from '@/services/api';
import { getSession } from '@/services/session';
import RankBadge from './RankBadge.vue';
export default {name:'RiftRankSummary',components:{RankBadge},props:{inLobby:Boolean},data(){return {profile:null,failed:false};},mounted(){this.load();},methods:{async load(){this.failed=false;try{this.profile=(await api.get(`/community/profiles/${getSession()?.id}`)).data;}catch(e){this.failed=true;}}}};
</script>
<style scoped>
.rank-summary{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:15px 19px;margin:0 0 25px;border:1px solid #d3ddd2;border-radius:10px;background:#fcfcf8;font:12px Arial;color:#5c716b}.rank-summary>div{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.rank-summary a{display:inline-flex;align-items:center;min-height:44px;color:#287366;text-decoration:none}.rank-summary a:focus-visible{outline:3px solid #9b791f}.rank-summary button{min-height:44px;border:1px solid #d3ddd2;border-radius:8px;background:#fcfcf8;color:#287366;cursor:pointer}@media(max-width:480px){.rank-summary{flex-wrap:wrap;gap:7px}.rank-summary>div{width:100%;justify-content:space-between;font-size:11px}}
</style>

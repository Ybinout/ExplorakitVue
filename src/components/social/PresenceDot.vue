<template><span class="presence-dot" :class="status" :title="label" :aria-label="label" role="img"><journal-icon v-if="person?.online&&person?.afk" name="afk"/></span></template>
<script>
import JournalIcon from '../menu/JournalIcon.vue';
import {presenceLabel} from '@/services/friendPresence';
export default{components:{JournalIcon},props:{person:Object,connected:{type:Boolean,default:true}},computed:{label(){return presenceLabel(this.person,this.connected);},status(){return !this.connected||!this.person?.online?'offline':this.person.afk?'afk':'online';}}};
</script>
<style scoped>
.presence-dot{display:inline-flex;align-items:center;justify-content:center;flex:none;width:9px;height:9px;border-radius:50%;background:var(--journal-muted);opacity:.5}.presence-dot.online{background:#45a478;opacity:1;box-shadow:0 0 0 3px #45a47820}.presence-dot.afk{width:16px;height:16px;background:#efaa3d26;color:#c77e16;opacity:1}.presence-dot.afk>.journal-icon{width:13px;height:13px}[data-game-theme-mode=dark] .presence-dot.afk{color:#ffc36b}
</style>

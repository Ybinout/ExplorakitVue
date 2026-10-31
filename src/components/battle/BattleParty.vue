<template>
  <div v-if="party && party.length" class="battle-opponent-party" data-opponent-party role="img" :aria-label="label" :title="label">
    <battle-ball v-for="(state,index) in states" :key="index" class="party-ball" :state="state" :data-party-state="state" />
  </div>
</template>

<script>
import BattleBall from './BattleBall.vue';
export default {
  name:'BattleParty',components:{BattleBall},
  props:{ party:{type:Array,default:null}, language:{type:String,default:'fr'} },
  computed:{
    states(){return this.party.map(value=>value===true?'ready':value===false?'ko':value);},
    label(){
      const remaining=this.states.filter(state=>state!=='ko').length,total=this.states.length,hurt=this.states.filter(state=>state==='hurt').length;
      return (this.language==='en' ? `Opponent's team: ${remaining} of ${total} Pokémon remaining` : `Équipe adverse : ${remaining} Pokémon encore apte${remaining>1?'s':''} sur ${total}`)
        +(hurt ? (this.language==='en'?` · ${hurt} injured`:` · ${hurt} blessé${hurt>1?'s':''}`) : '');
    }
  }
};
</script>

<style scoped>
.battle-opponent-party{position:absolute;top:calc(100% + 5px);left:6px;display:flex;align-items:center;gap:4px;padding:3px 6px;border:1px solid var(--journal-border,#8fa6b2);border-radius:12px;background:var(--journal-card,#edf5fa);box-shadow:0 2px 3px #10232d24;line-height:0;pointer-events:auto}
</style>

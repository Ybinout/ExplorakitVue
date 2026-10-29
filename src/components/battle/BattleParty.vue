<template>
  <div v-if="party && party.length" class="battle-opponent-party" data-opponent-party role="img" :aria-label="label" :title="label">
    <svg v-for="(alive,index) in party" :key="index" :class="['party-ball', { 'is-fainted':!alive }]" :data-party-state="alive ? 'ready' : 'ko'" viewBox="0 0 20 20" aria-hidden="true">
      <circle class="ball-bottom" cx="10" cy="10" r="8.5" />
      <path class="ball-top" d="M1.5 10a8.5 8.5 0 0 1 17 0Z" />
      <circle class="ball-outline" cx="10" cy="10" r="8.5" />
      <path class="ball-seam" d="M2 10h16" />
      <circle class="ball-button" cx="10" cy="10" r="3" />
    </svg>
  </div>
</template>

<script>
export default {
  name:'BattleParty',
  props:{ party:{type:Array,default:null}, language:{type:String,default:'fr'} },
  computed:{
    label(){
      const remaining=this.party.filter(Boolean).length,total=this.party.length;
      return this.language==='en' ? `Opponent's team: ${remaining} of ${total} Pokémon remaining` : `Équipe adverse : ${remaining} Pokémon encore apte${remaining>1?'s':''} sur ${total}`;
    }
  }
};
</script>

<style scoped>
.battle-opponent-party{position:absolute;top:calc(100% + 5px);left:6px;display:flex;align-items:center;gap:4px;padding:3px 6px;border:1px solid var(--journal-border,#8fa6b2);border-radius:12px;background:var(--journal-card,#edf5fa);box-shadow:0 2px 3px #10232d24;line-height:0;pointer-events:auto}
.party-ball{display:block;flex:none;width:14px;height:14px;--ball-top:#df5e57;--ball-bottom:#f8fcff;--ball-line:#354a58;--ball-button:#fff}
.ball-top{fill:var(--ball-top)}.ball-bottom{fill:var(--ball-bottom)}.ball-outline,.ball-seam{fill:none;stroke:var(--ball-line);stroke-width:1.5}.ball-button{fill:var(--ball-button);stroke:var(--ball-line);stroke-width:1.5}
.party-ball.is-fainted{--ball-top:#9ba4ab;--ball-bottom:#b8c0c5;--ball-line:#7c878f;--ball-button:#c5cdd1;opacity:.72}
</style>

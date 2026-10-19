<template>
  <div v-if="conditions.length" class="battle-conditions" tabindex="0" role="group" aria-label="Bonus, malus et effets actifs — faire défiler">
    <span v-for="effect in conditions" :key="effect.key" :class="effect.kind" :title="effect.title" :aria-label="effect.title">{{ effect.text }}</span>
  </div>
</template>
<script>
import { battleConditions } from '@/services/battleConditions';
export default {props:{pokemon:Object},computed:{conditions(){return battleConditions(this.pokemon);}}};
</script>
<style scoped>
.battle-conditions{display:flex;gap:3px;min-width:0;overflow-x:auto;white-space:nowrap;scrollbar-width:none;align-items:center;touch-action:pan-x;height:16px;mask-image:linear-gradient(to right,#000 94%,transparent)}.battle-conditions::-webkit-scrollbar{display:none}.battle-conditions span{font:700 9px/14px Arial,sans-serif;padding:0 3px;border-radius:3px;flex:none;background:#e4d8f3;color:#5d3071}.battle-conditions .up,.battle-conditions .heal{background:#d6eadb;color:#245f3f}.battle-conditions .down,.battle-conditions .status{background:#f7dfd6;color:#8c362c}.battle-conditions .shield{background:#d4e9f2;color:#245a75}.battle-conditions:focus-visible{outline:2px solid #ac8c40}
</style>

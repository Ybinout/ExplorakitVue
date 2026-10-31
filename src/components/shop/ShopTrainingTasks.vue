<template>
  <div class="training-goals" role="group" :aria-label="english?'Choose a training goal':'Choisir un objectif d’entraînement'">
    <button v-for="task in tasks" :key="task.key" :data-training-task="task.key" :disabled="busy" @click="$emit('choose',task.key)">
      <bag-item-icon :pocket="task.pocket" :item-key="task.itemKey"/><span><strong>{{ english?task.en:task.name }}</strong><small>{{ english?task.enHint:task.hint }}</small></span><span aria-hidden="true">›</span>
    </button>
  </div>
</template>
<script>
import BagItemIcon from '../menu/BagItemIcon.vue';
import {TRAINING_TASKS} from '@/services/shopBrowse';
export default {name:'ShopTrainingTasks',components:{BagItemIcon},props:{busy:Boolean,english:Boolean},data:()=>({tasks:TRAINING_TASKS})};
</script>
<style scoped>
.training-goals{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}button{display:flex;align-items:center;gap:8px;min-width:0;min-height:70px;padding:8px;border:1px solid var(--journal-border);border-radius:11px;background:var(--journal-card);color:var(--journal-heading);text-align:left;cursor:pointer;font:12px var(--journal-font)}button:hover{border-color:var(--journal-accent);background:var(--journal-selected)}button:focus-visible{outline:2px solid var(--journal-accent);outline-offset:2px}button:disabled{opacity:.5;cursor:wait}.bag-object-icon{width:30px;height:30px;flex:none}button>span:not([aria-hidden]){flex:1;min-width:0}strong,small{display:block}strong{font-size:12px;line-height:1.4}small{margin-top:5px;color:var(--journal-muted);font-size:10px;line-height:1.5}[aria-hidden]{font-size:23px;color:var(--journal-muted)}
@media(max-width:600px){.training-goals{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}button{flex-wrap:wrap;gap:7px;padding:10px;min-height:118px;align-content:start}.bag-object-icon{width:26px;height:26px}button>span:not([aria-hidden]){flex-basis:100%;order:1}button>[aria-hidden]{margin-left:auto}strong{font-size:11px}small{font-size:10px}}
</style>

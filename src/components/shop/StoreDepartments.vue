<template>
  <ol class="department-directory store-departments" :aria-label="english?'Store departments':'Rayons du Grand Comptoir'">
    <li v-for="floor in floors" :key="floor.number" :aria-current="floor.number===selected?'true':null">
      <button v-if="interactive" type="button" :data-store-department="floor.number" :aria-pressed="floor.number===selected" :disabled="busy" @click="$emit('choose',floor.number)"><bag-item-icon :pocket="floor.pocket"/><span><strong>{{ english?floor.en:floor.name }}</strong><small>{{ english?floor.enHint:floor.hint }}</small></span></button>
      <span v-else class="store-floor-label"><b>{{ floor.number }}</b>{{ english?floor.en:floor.name }}</span>
    </li>
  </ol>
</template>
<script>
import BagItemIcon from '../menu/BagItemIcon.vue';
import {STORE_DEPARTMENTS} from '@/services/shopBrowse';
export default {name:'StoreDepartments',components:{BagItemIcon},props:{selected:Number,interactive:Boolean,busy:Boolean,english:Boolean},data:()=>({floors:STORE_DEPARTMENTS})};
</script>
<style scoped>
.store-departments{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;list-style:none;margin:0;padding:10px 16px;border-bottom:1px solid var(--journal-border);background:var(--journal-card);flex:none}
li{min-width:0}button,.store-floor-label{box-sizing:border-box;display:flex;align-items:center;gap:9px;width:100%;min-height:60px;padding:9px;border:1px solid var(--journal-border);border-radius:10px;background:var(--journal-paper);color:var(--journal-muted);font:12px var(--journal-font);text-align:left}button{cursor:pointer}button[aria-pressed=true],[aria-current]>.store-floor-label{border-color:var(--journal-accent);background:var(--journal-selected);color:var(--journal-heading);box-shadow:inset 0 -3px var(--journal-progress)}button:focus-visible{outline:2px solid var(--journal-accent);outline-offset:2px}button:disabled{cursor:wait;opacity:.6}.bag-object-icon{width:28px;height:28px;flex:none}strong,small{display:block}strong{font-size:12px}small{font-size:10px;line-height:1.35;margin-top:4px}b{margin-right:5px}
@media(max-width:600px){.store-departments{gap:4px;padding:7px 10px}button{flex-direction:column;justify-content:center;gap:4px;min-height:60px;padding:5px 1px;text-align:center}strong{font-size:9px}small{display:none}.bag-object-icon{width:24px;height:24px}.store-floor-label{min-height:44px;padding:4px;font-size:9px;gap:2px}}
@media(max-height:500px){.store-departments{padding-top:5px;padding-bottom:5px}button{min-height:44px;padding:5px;gap:5px}.bag-object-icon{width:22px;height:22px}small{display:none}}
</style>

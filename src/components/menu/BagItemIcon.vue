<template>
  <svg class="bag-object-icon" :style="palette" :data-item-design="design ? design.kind : itemKey || pocket" :data-item-stat="design && design.stat" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <template v-if="itemKey==='experience_module'"><rect x="10" y="5" width="28" height="38" rx="5" fill="var(--item-main)"/><rect x="15" y="11" width="18" height="14" rx="2" fill="var(--item-light)"/><path d="M24 21v-7m-4 4 4-4 4 4M16 32h4m8 0h4m-12 5h8"/></template>
    <bag-equipment-icon v-else-if="design && design.family==='equipment'" :kind="design.kind"/>
    <bag-training-icon v-else-if="design && design.family==='training'" :design="design"/>
    <bag-stone-icon v-else-if="design && design.family==='stone'" :kind="design.kind"/>
    <template v-else-if="itemKey==='rare_candy'"><path d="m13 15-8-3 2 10-2 10 9-3m21-14 8-3-2 10 2 10-9-3" fill="var(--item-light)"/><circle cx="24" cy="23" r="13" fill="var(--item-main)"/><path d="m17 17 3 4m8-6 3 4m-15 7 4 3m6-5 4 4" stroke="var(--item-light)"/></template>
    <template v-else-if="itemKey==='heavy_duty_boots'"><path d="M8 7h12v19l7 5v9H5V29h3Z" fill="var(--item-main)"/><path d="M28 5h12v19l5 6v8H29V28h-1Z" fill="var(--item-main)"/><path d="M5 36h22M29 34h16M10 13h8m-8 6h8m12-8h8m-8 6h8"/><path d="M11 26h7m14-2h6" stroke="var(--item-light)"/></template>
    <template v-else-if="pocket==='treasures'"><path :d="itemKey==='crystal_shard'?'m12 29 6-16 8 4 10-8-2 26-13 8Z':'m24 4 13 10-3 22-10 8-13-10-2-20Z'" :fill="itemKey==='aurora_prism'?'#b8a0d2':itemKey==='clear_crystal'?'#8cc6dc':'#b2bcc8'"/><path d="m24 8-5 13 5 20 6-20Zm-13 7 8 6 11 0 7-7"/><path v-if="itemKey==='crystal_shard'" d="m14 29 10-5-2 8 11-2"/><path v-if="itemKey==='aurora_prism'" d="m39 5 1 4 4 1-4 1-1 4-1-4-4-1 4-1Z" fill="var(--item-light)"/></template>
    <template v-else-if="itemKey==='fishing_rod'"><path d="m9 40 22-31" stroke-width="5"/><path d="m9 40 8-11" stroke-width="7"/><path d="M31 9c7 1 8 9 7 17v9"/><ellipse cx="38" cy="37" rx="4" ry="6" fill="var(--item-main)"/><path d="M34 37h8"/><circle cx="19" cy="29" r="4" fill="var(--item-light)"/></template>
    <template v-else-if="pocket==='balls'"><circle cx="24" cy="24" r="17" fill="var(--item-light)"/><path d="M7 24a17 17 0 0 1 34 0Z" fill="var(--item-main)"/><path d="M7 24h12m10 0h12"/><circle cx="24" cy="24" r="5" fill="var(--item-light)"/><path v-if="itemKey==='superball'" d="m13 16 4-4m14 0 4 4" stroke-width="4"/><path v-if="itemKey==='hyperball'" d="M14 20v-8m20 8v-8M18 10v7h12v-7" stroke-width="3"/></template>
    <template v-else-if="pocket==='medicine'"><path d="M19 7h11v7H19ZM17 14h15v7l4 6v13H13V27l4-6Z" fill="var(--item-main)"/><path d="M20 7V4h13v5m-20 20h23"/><path v-if="itemKey==='revive'" d="m24 21 7 10-7 8-7-8Z" fill="var(--item-light)"/><path v-else d="M24 25v10m-5-5h10" stroke-width="3"/></template>
    <template v-else-if="pocket==='machines'"><circle cx="24" cy="24" r="18" fill="var(--item-main)"/><circle cx="24" cy="24" r="5" fill="var(--item-light)"/><path d="m13 12 6 6m10 12 6 6m-23-18 6 6m12 5 6 6"/></template>
    <template v-else-if="pocket==='training'"><path d="M17 5h14v7H17ZM15 12h18v29H15Z" fill="var(--item-main)"/><path d="M15 20h18m-18 15h18m-14-9 10 5m-5-7v10"/><path d="m36 8 2-4m1 7 4-1"/></template>
    <template v-else-if="pocket==='field'"><path d="M16 17h17v25H13V24Z" fill="var(--item-main)"/><path d="M19 17V9h11v8M19 9V5h16v6h-5m-13 15h12m-12 6h12"/><path d="m38 12 4-2m-4 6 5 1m-6 4 4 3"/></template>
    <template v-else-if="pocket==='berries'"><path d="M24 18C8 8 4 29 14 38c6 6 18 4 22-3 9-15-2-26-12-17Z" fill="var(--item-main)"/><path d="M24 18C21 9 24 4 35 5c-1 8-4 12-11 13Zm0 0-8-9"/><path d="M13 24v5m8 4 1 3m9-13 1 4"/></template>
    <template v-else-if="pocket==='evolution'"><path d="m24 4 14 12-3 22-18 6L7 25l6-15Z" fill="var(--item-main)"/><path d="m13 10 9 8 16-2m-16 2-5 26m5-26 13 20M7 25l15-7"/><path d="m26 23-4 8h6l-3 7"/></template>
    <template v-else-if="pocket==='key'"><path v-if="itemKey.includes('letter')" d="M6 12h36v25H6Zm0 0 18 15 18-15M6 37l12-13m24 13L30 24" fill="var(--item-main)"/><template v-else><path d="M12 5h25v37H12a5 5 0 0 1-5-5V10a5 5 0 0 1 5-5Z" fill="var(--item-main)"/><path d="M12 5v37m7-27h11m-11 6h11m-11 6h7"/></template></template>
    <template v-else><path d="m24 5 14 9v20l-14 9-14-9V14Z" fill="var(--item-main)"/><circle cx="24" cy="24" r="9" fill="var(--item-light)"/><path d="m24 17 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></template>
  </svg>
</template>
<script>
import BagEquipmentIcon from './BagEquipmentIcon.vue';
import BagTrainingIcon from './BagTrainingIcon.vue';
import BagStoneIcon from './BagStoneIcon.vue';
import {bagItemDesign} from '@/services/bagItemPresentation';
const colors={medicine:'#c197d8',balls:'#e37a77',field:'#82c3ad',berries:'#d984a0',training:'#e8bd70',machines:'#91b8de',evolution:'#b5a1d9',held:'#d8bd7c',key:'#cfa18c'};
export default {
  name:'BagItemIcon',components:{BagEquipmentIcon,BagTrainingIcon,BagStoneIcon},
  props:{pocket:String,itemKey:{type:String,default:''}},
  computed:{
    design(){return bagItemDesign(this.itemKey);},
    palette(){const main=this.design?.main||{experience_module:'#83c4d7',rare_candy:'#83b9df',heavy_duty_boots:'#b29c83',pokeball:'#e97672',superball:'#6eabdf',hyperball:'#e3bd62',potion:'#bd96d5',super_potion:'#eaaa6e',hyper_potion:'#e88eaa',max_potion:'#8eb4e3',antidote:'#dfc467',repel:'#87bdb0',super_repel:'#81b6d8',max_repel:'#d4a2c7'}[this.itemKey]||colors[this.pocket]||'#b5c5cf';return {'--item-main':main,'--item-accent':this.design?.accent||'#f6f9f6','--item-light':'#f6f9f6',color:'#435b68'};}
  }
};
</script>
<style scoped>.bag-object-icon{display:block;width:40px;height:40px;flex:none;color:var(--journal-accent)}</style>

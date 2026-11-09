<template><span class="berry-icon" :class="{corrupted,failed}" aria-hidden="true"><img v-if="classic" :src="classic" alt=""/><svg v-else :viewBox="viewBox" focusable="false"><image :href="source" x="0" y="0" :width="failed?128:192" :height="failed?32:224"/></svg></span></template>
<script>
import catalog from '@/data/berryMutation.json';
const base=new Set(catalog.classic.map(i=>i.key));
const locations=new Map(catalog.families.flatMap((f,i)=>Object.entries(f.results).filter(([r])=>r!=='failed').map(([rarity,key])=>[key,{i,rarity}])));
const atlases={common:require('@/assets/berries/mutations-common-v1.png'),rare:require('@/assets/berries/mutations-rare-v1.png'),legendary:require('@/assets/berries/mutations-legendary-v1.png')};
export default{props:{itemKey:String},computed:{corrupted(){return this.itemKey?.startsWith('corrupted_');},failed(){return this.itemKey==='failed_mutation_berry';},classic(){const key=this.corrupted?this.itemKey.slice(10):this.itemKey;return base.has(key)?require('@/assets/berries/'+key+'.png'):null;},location(){return locations.get(this.itemKey)||{i:0,rarity:'common'};},source(){return this.failed?require('@/assets/berries/growth-v1.png'):atlases[this.location.rarity];},viewBox(){return this.failed?'96 0 32 32':`${this.location.i%6*32} ${Math.floor(this.location.i/6)*32} 32 32`;}}};
</script>
<style scoped>.berry-icon{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;flex:none;vertical-align:middle;image-rendering:pixelated}.berry-icon img,.berry-icon svg{display:block;width:100%;height:100%;object-fit:contain;overflow:hidden;image-rendering:pixelated}.berry-icon.corrupted{filter:sepia(1) saturate(3) hue-rotate(210deg)}.berry-icon.failed{opacity:.8}</style>

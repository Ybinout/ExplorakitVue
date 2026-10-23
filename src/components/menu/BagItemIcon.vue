<template>
  <svg class="bag-object-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <template v-if="itemKey==='fishing_rod'"><path d="m9 40 22-31" stroke-width="5"/><path d="m9 40 8-11" stroke-width="7"/><path d="M31 9c7 1 8 9 7 17v9"/><ellipse cx="38" cy="37" rx="4" ry="6" fill="var(--journal-selected)"/><path d="M34 37h8"/><circle cx="19" cy="29" r="4" fill="var(--journal-paper)"/></template>
    <template v-else-if="pocket==='balls'"><circle cx="24" cy="24" r="17" fill="var(--journal-card)"/><path d="M7 24a17 17 0 0 1 34 0Z" fill="var(--journal-selected)"/><path d="M7 24h12m10 0h12"/><circle cx="24" cy="24" r="5" fill="var(--journal-paper)"/><path v-if="itemKey==='superball'" d="m13 16 4-4m14 0 4 4" stroke-width="4"/><path v-if="itemKey==='hyperball'" d="M14 20v-8m20 8v-8M18 10v7h12v-7" stroke-width="3"/></template>
    <template v-else-if="pocket==='medicine'"><path d="M19 7h11v7H19ZM17 14h15v7l4 6v13H13V27l4-6Z" fill="var(--journal-selected)"/><path d="M20 7V4h13v5m-20 20h23"/><path v-if="itemKey==='revive'" d="m24 21 7 10-7 8-7-8Z" fill="var(--journal-card)"/><path v-else d="M24 25v10m-5-5h10" stroke-width="3"/></template>
    <template v-else-if="pocket==='training'"><path d="M17 5h14v7H17ZM15 12h18v29H15Z" fill="var(--journal-selected)"/><path d="M15 20h18m-18 15h18m-14-9 10 5m-5-7v10"/><path d="m36 8 2-4m1 7 4-1"/></template>
    <template v-else-if="pocket==='field'"><path d="M16 17h17v25H13V24Z" fill="var(--journal-selected)"/><path d="M19 17V9h11v8M19 9V5h16v6h-5m-13 15h12m-12 6h12"/><path d="m38 12 4-2m-4 6 5 1m-6 4 4 3"/></template>
    <template v-else-if="pocket==='berries'"><path d="M24 18C8 8 4 29 14 38c6 6 18 4 22-3 9-15-2-26-12-17Z" fill="var(--journal-selected)"/><path d="M24 18C21 9 24 4 35 5c-1 8-4 12-11 13Zm0 0-8-9"/><path d="M13 24v5m8 4 1 3m9-13 1 4"/></template>
    <template v-else-if="pocket==='evolution'"><path d="m24 4 14 12-3 22-18 6L7 25l6-15Z" fill="var(--journal-selected)"/><path d="m13 10 9 8 16-2m-16 2-5 26m5-26 13 20M7 25l15-7"/><path d="m26 23-4 8h6l-3 7"/></template>
    <template v-else-if="pocket==='key'"><path v-if="itemKey.includes('letter')" d="M6 12h36v25H6Zm0 0 18 15 18-15M6 37l12-13m24 13L30 24" fill="var(--journal-selected)"/><template v-else><path d="M12 5h25v37H12a5 5 0 0 1-5-5V10a5 5 0 0 1 5-5Z" fill="var(--journal-selected)"/><path d="M12 5v37m7-27h11m-11 6h11m-11 6h7"/></template></template>
    <template v-else><path d="m24 5 14 9v20l-14 9-14-9V14Z" fill="var(--journal-selected)"/><circle cx="24" cy="24" r="9" fill="var(--journal-card)"/><path d="m24 17 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></template>
  </svg>
</template>
<script>
export default {name:'BagItemIcon',props:{pocket:String,itemKey:{type:String,default:''}}};
</script>
<style scoped>.bag-object-icon{display:block;width:40px;height:40px;flex:none;color:var(--journal-accent)}</style>

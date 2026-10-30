<template>
  <g>
    <path d="m23 4 14 8 5 16-11 15-17-3-9-16 7-15Z" fill="var(--item-main)"/>
    <path d="m12 9 6 8-3 17m22-22-6 6 4 16m-20 6 3-6 13 9M5 24l13-7M42 28l-11-10" opacity=".55"/>
    <path v-if="kind==='fire_stone'" d="M24 11c4 8-5 10-1 15 2 1 4-1 5-4 8 10-1 16-7 12-8-5-4-12 0-16-1 6 2 6 3 4 2-3-1-6 0-11Z" fill="var(--item-accent)"/>
    <path v-else-if="kind==='water_stone'" d="M24 12c-2 5-9 11-9 16a9 9 0 0 0 18 0c0-5-7-11-9-16Zm-4 16q0 5 4 5" fill="var(--item-accent)"/>
    <path v-else-if="kind==='thunder_stone'" d="m26 11-11 16h8l-1 11 12-18h-9Z" fill="var(--item-accent)"/>
    <path v-else-if="kind==='leaf_stone'" d="M15 32C12 19 20 12 33 14c0 14-7 23-18 18Zm0 0 13-13m-7 7 7 1m-7-1-1-7" fill="var(--item-accent)"/>
    <path v-else-if="kind==='moon_stone'" d="M30 13a12 12 0 1 0 1 22 13 13 0 0 1-1-22Z" fill="var(--item-accent)"/>
    <g v-else-if="kind==='sun_stone'"><path d="M24 10v4m0 21v4M10 24h4m21 0h4M14 14l3 3m14 14 3 3m0-20-3 3M17 31l-3 3"/><circle cx="24" cy="24" r="8" fill="var(--item-accent)"/></g>
    <path v-else-if="kind==='shiny_stone'" d="m24 11 4 10 9 3-9 4-4 10-4-10-9-4 9-3Z" fill="var(--item-accent)"/>
    <g v-else-if="kind==='dusk_stone'"><path d="m24 12 8 12-8 13-8-13Z" fill="var(--item-accent)"/><path d="m24 18-3 6 3 7 3-7Z" fill="var(--item-main)"/></g>
    <g v-else-if="kind==='dawn_stone'"><path d="m24 12 9 12-9 13-9-13Z" fill="var(--item-accent)"/><path d="M16 25h16m-8-9v18m-5-14 10 10m0-10L19 30"/></g>
    <path v-else d="M24 11v26M13 18l22 13M13 31l22-13m-15-3 4 4 4-4m-8 18 4-4 4 4m-13-9 5-1-1-5m10 13-1-5 5-1m0-5-5-1 1-5m-10 13 1-5-5-1" stroke="var(--item-light)"/>
  </g>
</template>
<script>
export default {name:'BagStoneIcon',props:{kind:{type:String,required:true}}};
</script>

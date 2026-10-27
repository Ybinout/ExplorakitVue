<template>
  <svg class="badge-emblem" :style="{ '--badge-color': design.color }" viewBox="0 0 80 80" fill="none" aria-hidden="true" focusable="false">
    <path class="badge-setting" d="M40 5 66 20v34L40 75 14 54V20Z" />
    <path class="badge-face" d="M40 11 61 23v28L40 68 19 51V23Z" />
    <path class="badge-motif" :d="design.path" />
    <path class="badge-shine" d="m23 24 13-8M21 30v12" />
    <path v-if="cracked" class="badge-fracture" d="m43 8-8 17 8 8-10 12 8 9-7 16m7-37 12 5 6-5M33 45l-9 2-5 7" />
  </svg>
</template>
<script>
const designs = {
  pardon_badge:{color:'#79a398',path:'M40 55V34m0 8C24 43 24 28 25 25c12 0 15 8 15 17Zm0 5c0-16 8-21 16-21 1 14-7 21-16 21Zm-8 10h16'},
  violence_badge:{color:'#655064',path:'m26 53 5-21 8 7 5-16 10 27-12 9-16-6Zm4-25 5-5m16 30 5 5M38 43l4 5'},
  summit_badge: { color: '#849fb5', path: 'm23 54 12-29 8 17 6-11 10 23H23Zm7-15 5 4 5-4m3 8 6-4 5 4M29 59h22' },
  lake_badge: { color: '#6baac4', path: 'M40 19c-4 8-12 15-12 23a12 12 0 0 0 24 0c0-8-8-15-12-23Zm-6 24c0 4 2 6 6 7M25 59c5-4 10 4 15 0s10 4 15 0' },
  dune_badge: { color: '#c69b4e', path: 'm25 47 9-17 8 12 6-8 9 16H25Zm4 8h22M48 24h1' },
  bloom_badge: { color: '#c27b96', path: 'M40 32c-13-18-24 3-9 10-15 7-1 24 9 10 10 14 24-3 9-10 15-7 4-28-9-10Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z' },
  ore_badge: { color: '#a38966', path: 'm29 28 18-2 9 18-17 15-15-15Zm0 0 10 15 8-17M24 44l15-1 17 1M39 43v16' },
  tide_badge: { color: '#609fae', path: 'M25 39c10 0 7-16 19-16 10 0 13 14 4 17 4-9-10-8-8 1 2 9 10 11 17 8-7 13-28 11-32-1m3 7h24' }
};
export default {
  name: 'BadgeEmblem', props: { badgeKey: String, cracked:Boolean },
  computed: { design() { return designs[this.badgeKey] || designs.ore_badge; } }
};
</script>
<style scoped>
.badge-emblem{display:block;width:76px;height:76px;flex:none;filter:drop-shadow(0 5px 3px #263a3020)}.badge-setting{fill:#bca879;stroke:#8f805d;stroke-width:2;stroke-linejoin:round}.badge-face{fill:var(--badge-color);stroke:#fff9;stroke-width:1.5}.badge-motif{stroke:#fff8dc;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}.badge-shine{stroke:#fff8;stroke-width:2;stroke-linecap:round}
.badge-fracture{stroke:#222738;stroke-width:3.5;stroke-linejoin:bevel;stroke-linecap:square;filter:drop-shadow(1px 0 0 #e9e0c9)}
</style>

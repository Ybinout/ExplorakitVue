<template>
  <span :class="['potential-star', `potential-star--${tier}`]" :title="label" role="img" :aria-label="label">
    <svg :width="size" :height="size" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0" :stop-color="palette[0]" />
          <stop offset="0.55" :stop-color="palette[1]" />
          <stop offset="1" :stop-color="palette[2]" />
        </linearGradient>
      </defs>
      <path class="potential-star__shape" d="M16 3.5 19.9 11.6 28.8 12.9 22.4 19.2 23.9 28.1 16 23.9 8.1 28.1 9.6 19.2 3.2 12.9 12.1 11.6Z"
        :fill="`url(#${gradientId})`" :stroke="palette[3]" stroke-width="1.4" stroke-linejoin="round" />
      <path d="M16 5.5 16 17 5.3 13.6 13.2 12.5Z" fill="#fff" :opacity="tier === 1 ? 0.18 : 0.42" />
      <g v-if="tier === 4" class="potential-star__sparkles" fill="#fffce5" stroke="#d99c20" stroke-width="0.45">
        <path d="M25 1 26.1 4.1 29.2 5.2 26.1 6.3 25 9.4 23.9 6.3 20.8 5.2 23.9 4.1Z" />
        <path d="M4 21 4.8 23.2 7 24 4.8 24.8 4 27 3.2 24.8 1 24 3.2 23.2Z" />
      </g>
    </svg>
  </span>
</template>
<script>
const PALETTES = [
  ['#c8cdd0', '#969fa6', '#747e88', '#66737e'],
  ['#fffbed', '#e9dfb8', '#c8bb91', '#9d916e'],
  ['#fff493', '#ffcf36', '#eaa51c', '#b87c19'],
  ['#ffffff', '#ffe873', '#ffbd21', '#c38b16']
];
export default {
  props: { value: { type: [Number, String], default: 1 }, language: { type: String, default: 'fr' } },
  computed: {
    tier() { const value = Number(this.value); return [1, 2, 3, 4].includes(value) ? value : 1; },
    size() { return 12 + this.tier * 4; },
    palette() { return PALETTES[this.tier - 1]; },
    gradientId() { return `potential-star-${this._uid}`; },
    label() {
      const names = this.language === 'en' ? ['Common', 'Promising', 'Rare', 'Exceptional'] : ['Commun', 'Prometteur', 'Rare', 'Exceptionnel'];
      return `${this.language === 'en' ? 'Potential' : 'Potentiel'} : ${names[this.tier - 1]}`;
    }
  }
};
</script>
<style scoped>
.potential-star{display:inline-flex;align-items:center;justify-content:center;width:30px;height:28px;flex:0 0 30px;vertical-align:middle;line-height:1}
.potential-star svg{display:block;overflow:visible;flex-shrink:0}
.potential-star--4 .potential-star__shape{filter:drop-shadow(0 0 2px #ffcf55)}
.potential-star__sparkles{animation:potential-shimmer 2.8s ease-in-out infinite;transform-origin:center}
@keyframes potential-shimmer{0%,100%{opacity:.55;transform:scale(.88)}50%{opacity:1;transform:scale(1.08)}}
.reduced-game-motion .potential-star__sparkles{animation:none}
@media(prefers-reduced-motion:reduce){.potential-star__sparkles{animation:none}}
</style>

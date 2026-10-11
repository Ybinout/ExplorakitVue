<template>
  <svg class="drift-glyph-icon" :class="rarity" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path v-for="(path, index) in paths" :key="index" :d="path" />
  </svg>
</template>
<script>
const glyphs = {
  drift: ['M12 2 20 9 12 22 4 9Z', 'M4 9h16M8 5l4 17 4-17'],
  compass: ['M12 2v2m0 16v2M2 12h2m16 0h2', 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16', 'm15.5 8.5-2 5-5 2 2-5Z'],
  team: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', 'M3 12h6m6 0h6', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6'],
  trophy: ['M8 3h8v6a4 4 0 0 1-8 0Z', 'M8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 13v5m-4 3h8m-6-3h4l2 3H8Z'],
  clock: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', 'M12 7v5l3 2'],
  players: ['M9 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6m7 1a2.5 2.5 0 0 1 0 5', 'M3 20v-3a6 6 0 0 1 12 0v3Zm14-7a5 5 0 0 1 4 5v2h-3'],
  back: ['m10 5-7 7 7 7M3 12h18'],
  close: ['m6 6 12 12M6 18 18 6'],
  search: ['M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15m5.5 13 5 5'],
  coin: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18', 'M12 7v10m-3-8h4a2 2 0 0 1 0 4H9m0 3h6'],
  attack: ['m14 3 7 0 0 7-12 9-4-4Z', 'm14 3 7 7M3 13l8 8m-4-4-4 4'],
  defense: ['m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Z', 'm8 12 3 3 5-6'],
  counter: ['M4 10a8 8 0 0 1 14-5l3 3m0-5v5h-5', 'M20 14a8 8 0 0 1-14 5l-3-3m0 5v-5h5'],
  tactics: ['m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z', 'M12 8v8M8 12h8'],
  progress: ['M12 21V10', 'M12 14C5 15 3 10 3 5c7 0 10 4 9 9Z', 'M12 11c0-6 4-8 9-8 0 6-3 9-9 8'],
  special: ['m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z', 'm19 3 2 2M3 19l2 2']
};
export default {
  name: 'DriftGlyph',
  props: { name: { type: String, default: 'drift' }, category: String, rarity: String },
  computed: {
    paths() {
      const category = { Offensif: 'attack', Défensif: 'defense', 'Contre / perturbation': 'counter', 'Contre / Perturbation': 'counter', 'Contre/Perturbation': 'counter', Tactique: 'tactics', Progression: 'progress', Spécial: 'special' }[this.category];
      return glyphs[category || this.name] || glyphs.drift;
    }
  }
};
</script>
<style scoped>
.drift-glyph-icon { display: inline-block; width: 24px; height: 24px; flex-shrink: 0; vertical-align: middle; }
.common { color: #788c95; }.rare { color: #60a78b; }.epic { color: #b499da; }.legendary { color: #d8b66e; }.mythic { color: #dc94b1; }
</style>

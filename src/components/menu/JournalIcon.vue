<template>
  <svg class="journal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path :d="paths[name] || paths.pokedex" />
  </svg>
</template>

<script>
const paths = {
  minimap: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16',
  menu: 'M4 6h16M4 12h16M4 18h16',
  quit: 'M10 4H4v16h6m4-12 4 4-4 4m-5-4h12',
  'weather-rain': 'M6 14a4 4 0 0 1-1-7.9 5 5 0 0 1 9.6-1.2A4.5 4.5 0 1 1 18 14ZM8 17l-1 3m6-3-1 3m6-3-1 3',
  'weather-sun': 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5',
  'weather-sandstorm': 'M3 7h12a2.5 2.5 0 1 0-2.5-2.5M2 12h17a2.5 2.5 0 1 1-2.5 2.5M4 17h6a2 2 0 1 1-2 2M3 21h.1M20 4h.1',
  'weather-hail': 'M6 13a4 4 0 0 1-1-7.9 5 5 0 0 1 9.6-1.2A4.5 4.5 0 1 1 18 13ZM6 17l1.5 2L6 21l-1.5-2Zm6-2 1.5 2-1.5 2-1.5-2Zm6 2 1.5 2-1.5 2-1.5-2Z',
  pokedex: 'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM8 7h8v6H8ZM8 17h3m3 0h2',
  badges: 'm12 2 7 4v8l-7 8-7-8V6Zm0 4 3 5-3 5-3-5ZM5 14l7 2 7-2',
  progress: 'M6 4h12v17H6ZM9 4V2h6v2M9 9h6m-6 4h6m-6 4h3',
  pokemon: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h6m6 0h6m-6 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  appearance: 'm8 3-5 3 3 5 2-1v11h8V10l2 1 3-5-5-3a4 4 0 0 1-8 0Z',
  bag: 'M8 7V5a4 4 0 0 1 8 0v2M6 7h12l2 14H4ZM8 12h8v5H8Z',
  save: 'M5 3h12l4 4v14H3V3ZM7 3v6h10V3M7 21v-8h10v8',
  options: 'M5 3v5m0 6v7M12 3v10m0 6v2M19 3v1m0 6v11M2 8h6v6H2Zm7 5h6v6H9Zm7-9h6v6h-6Z',
  location: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Zm-4 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  drifts: 'm12 2 9 10-9 10L3 12Zm0 0v20M3 12h18'
};
export default { name: 'JournalIcon', props: { name: String }, data: () => ({ paths }) };
</script>

<style scoped>
.journal-icon { display: block; width: 20px; height: 20px; flex: none; }
</style>

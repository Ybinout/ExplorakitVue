<template>
  <svg class="journal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path :d="paths[name] || paths.pokedex" />
  </svg>
</template>

<script>
const paths = {
  menu: 'M4 6h16M4 12h16M4 18h16',
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

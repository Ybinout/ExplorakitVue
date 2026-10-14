<template>
  <section class="adventure-guide" :aria-label="english ? 'Your objective' : 'Ton objectif'">
    <h3>{{ english ? 'Your objective' : 'Ton objectif' }}</h3>
    <p class="objective">{{ objective ? objective.text : (english ? 'Explore, complete quests and look after your team.' : 'Explore, complète tes quêtes et prends soin de ton équipe.') }}</p>
    <p v-if="objective && objective.destination" class="destination">Destination : {{ objective.destination }}</p>
    <details class="help">
      <summary>{{ english ? 'How to play' : 'Comment jouer ?' }}</summary>
      <ol>
        <li>{{ english ? 'Move with ZQSD, the arrow keys or the touch controls.' : 'Déplace-toi avec ZQSD, les flèches ou le pavé tactile.' }}</li>
        <li>{{ english ? 'Approach a character and press Space or A to talk.' : 'Approche un personnage et appuie sur Espace ou A pour parler.' }}</li>
        <li>{{ english ? 'Catch wild Pokémon with Balls from your bag during battle.' : 'Capture des Pokémon sauvages avec les Balls du sac pendant un combat.' }}</li>
        <li>{{ english ? 'The Pokémon Centre and your mother heal your team for free. Use Potions and Revives from your bag outside battle.' : 'Le Centre et ta mère soignent gratuitement ton équipe. Les Potions et Rappels du sac s’utilisent hors combat.' }}</li>
        <li>{{ english ? 'You can play alone. Battles with other players are optional.' : 'Tu peux jouer seul ; les duels avec les autres joueurs sont facultatifs.' }}</li>
      </ol>
      <p>{{ english ? 'Progress is saved automatically. Menu → Save lets you check synchronisation.' : 'Ta progression se sauvegarde automatiquement. Menu → Sauvegarde permet de vérifier la synchronisation.' }}</p>
    </details>
  </section>
</template>
<script>
export default {
  props: { objective: { type: Object, default: null }, language: { type: String, default: 'fr' } },
  computed: { english() { return this.language === 'en'; } }
};
</script>
<style scoped>
.adventure-guide {
  margin-bottom:24px; padding:16px; color:var(--journal-ink); background:var(--journal-soft);
  border:1px solid var(--journal-border); border-radius:12px; text-align:left; font:13px/1.6 var(--journal-font);
}
.adventure-guide h3 { margin:0 0 10px; color:var(--journal-heading); font-size:16px; }
.objective { margin:0 0 10px; }
.destination { color:var(--journal-accent); font-weight:600; }
.help { border-top:1px solid var(--journal-border); margin-top:14px; padding-top:4px; }
.help summary { cursor:pointer; min-height:44px; padding-block:10px; color:var(--journal-accent); font-weight:600; }
.help ol { padding-left:20px; }
.help li { margin-bottom:8px; }
.help p { color:var(--journal-muted); }
</style>

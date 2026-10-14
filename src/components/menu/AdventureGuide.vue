<template>
  <section class="adventure-guide" aria-label="Carnet d’aventure" @keydown.stop @keyup.stop>
    <details>
      <summary>
        <span>{{ objective ? 'Ton objectif' : 'Ton aventure' }}</span
        ><span>Objectif et aide +</span>
      </summary>
      <p class="objective">
        {{ objective ? objective.text : 'Explore, complète tes quêtes et prends soin de ton équipe.' }}
      </p>
      <p v-if="objective && objective.destination" class="destination">
        Destination : {{ objective.destination }}
      </p>
      <details class="help">
        <summary>Comment jouer ?</summary>
        <ol>
          <li>Déplace-toi avec ZQSD, les flèches ou le pavé tactile.</li>
          <li>Approche un personnage et appuie sur Espace ou A pour parler.</li>
          <li>Capture des Pokémon sauvages avec les Balls du sac pendant un combat.</li>
          <li>
            Le Centre soigne gratuitement ton équipe. Les Potions et Rappels du sac s’utilisent hors combat.
          </li>
          <li>
            Menu → Quêtes pour suivre ton histoire. Tu peux jouer seul ; les duels avec les autres joueurs
            sont facultatifs.
          </li>
        </ol>
        <p>
          Ta progression se sauvegarde automatiquement. Menu → Sauvegarde permet de vérifier la
          synchronisation.
        </p>
      </details>
    </details>
    <span class="objective-preview" v-if="objective">{{ objective.text }}</span>
  </section>
</template>
<script>
export default { props: { objective: { type: Object, default: null } } };
</script>
<style scoped>
.adventure-guide {
  position: absolute;
  z-index: 6;
  left: 12px;
  top: 76px;
  width: min(390px, calc(100% - 24px));
  color: var(--journal-ink);
  background: var(--journal-paper);
  border: 1px solid var(--journal-border);
  border-radius: 14px;
  padding: 10px 12px;
  box-shadow: 0 5px 20px #152b2426;
  text-align: left;
  font: 13px/1.5 var(--journal-font);
}
.adventure-guide summary {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  min-height: 44px;
  align-items: center;
  font-weight: bold;
}
.adventure-guide summary span:last-child {
  font-size: 11px;
  color: var(--journal-accent);
}
.objective {
  margin: 8px 0;
}
.destination {
  color: var(--journal-accent);
}
.objective-preview {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--journal-muted);
  font-size: 11px;
}
.adventure-guide:has(> details[open]) > .objective-preview {
  display: none;
}
.help {
  border-top: 1px solid var(--journal-border);
  margin-top: 12px;
  padding-top: 8px;
}
.help ol {
  padding-left: 20px;
}
.help li {
  margin-bottom: 8px;
}
.help p {
  color: var(--journal-muted);
}
.adventure-guide:has(> details[open]) {
  max-height: min(55vh, calc(100vh - 200px));
  overflow: auto;
}
@media (max-width: 600px) {
  .adventure-guide {
    top: 76px;
    width: calc(100% - 24px);
    padding: 6px 10px;
  }
  .adventure-guide summary {
    font-size: 12px;
  }
}
@media (max-height: 500px) {
  .adventure-guide {
    width: 260px;
    top: 76px;
    font-size: 11px;
  }
  .objective-preview {
    display: none;
  }
}
</style>

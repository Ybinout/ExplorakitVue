<template>
  <section
    class="draft-inspector"
    :class="{ 'is-compact': compact }"
    aria-label="Détail de la carte"
    data-draft-inspector
  >
    <header>
      <small>INSPECTION</small
      ><button
        v-if="!compact"
        @click="$emit('close')"
        aria-label="Fermer le détail"
      >
        ×
      </button>
    </header>
    <draft-card :card="card" :show-compatibility="false" />
    <template v-if="p"
      ><p class="draft-talent">
        <b>{{ abilityName(p.passiveAbility) }}</b> —
        {{ reference.abilityDescription(p.passiveAbility) }}
      </p>
      <p>{{ natureName(p.nature) }} · {{ natureEffect(p.nature) }}</p>
      <table>
        <thead>
          <tr>
            <th>Stat.</th>
            <th>Valeur</th>
            <th>IV</th>
            <th>EV</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in stats" :key="s[0]">
            <th>{{ s[1] }}</th>
            <td>{{ s[0] === 'hp' ? p.maxHp : p.stats[s[0]] }}</td>
            <td>{{ p.iv[s[0]] }}</td>
            <td>{{ p.ev[s[0]] }}</td>
          </tr>
        </tbody>
      </table>
      <article
        v-for="m in reference.moves(p)"
        :key="m.name"
        class="draft-inspected-move"
        :style="typeStyle(m.type)"
      >
        <b>{{ moveName(m.name) }}</b
        ><small
          >{{ typeName(m.type) }} ·
          {{
            m.damageClass === 'physical'
              ? 'Physique'
              : m.damageClass === 'special'
              ? 'Spéciale'
              : 'Statut'
          }}
          · {{ m.powerLabel }} puiss. · {{ m.accuracy || '—' }} préc. ·
          {{ m.maxPp }} PP</small
        >
        <p>{{ m.description }}</p>
      </article>
    </template>
    <p v-else-if="card.kind === 'ability'">
      {{ reference.abilityDescription(card.ability) }}
    </p>
    <template v-else-if="card.kind === 'move'"
      ><p>{{ reference.moves({ abilities: [card.move] })[0]?.description }}</p>
      <p>
        Une utilisation. Le Pokémon doit pouvoir apprendre cette capacité.
      </p></template
    >
    <p v-else-if="card.kind === 'rift'">
      Ce Rift modifie toute ton équipe. Un seul peut être actif. Il est
      verrouillé lors de la validation.
    </p>
    <p v-else>
      {{
        card.description ||
        (card.kind === 'iv'
          ? 'Cette carte fixe à 31 l’IV indiqué. Tu peux la retirer ou la déplacer pendant la préparation.'
          : 'Cette amélioration reste temporaire et peut être retirée pendant la préparation.')
      }}
    </p>
    <section
      v-if="card.kind === 'move' && card.compatibility"
      class="draft-compatibility-list"
      data-draft-compatibility-list
    >
      <h4>Tes Pokémon sélectionnés</h4>
      <p v-if="!card.compatibility.length">
        Sélectionne un Pokémon : sa compatibilité apparaîtra sur les cartes
        d’attaque.
      </p>
      <div
        v-for="p in card.compatibility"
        :key="p.cardId"
        :class="{ 'is-compatible': p.compatible && !p.known }"
      >
        <pokemon-portrait
          :src="$pokemonSprite({ data: { id: p.pokemonId } })"
          :alt="p.name"
        /><b>{{ p.name }}</b
        ><span>{{
          p.known
            ? 'Déjà connue'
            : p.compatible
            ? '✓ Compatible'
            : 'Incompatible'
        }}</span>
      </div>
    </section>
    <slot />
  </section>
</template>
<script>
import DraftCard from './DraftCard.vue';
import PokemonPortrait from '../PokemonPortrait.vue';
import catalog from '@/data/pokemonReference.fr.json';
import { createPokemonReference } from '@/services/pokemonReference';
import { localizeMoveName, localizeAbilityName } from '@/services/i18n';
import { localizeTypeName, typeBadgeStyle } from '@/services/pokemonTypes';
import { natureLabel, natureDescription } from '@/services/pokemonNatures';
export default {
  components: { DraftCard, PokemonPortrait },
  props: { card: Object, compact: Boolean },
  data: () => ({
    reference: createPokemonReference(catalog),
    stats: [
      ['hp', 'PV'],
      ['attack', 'Attaque'],
      ['defense', 'Défense'],
      ['specialAttack', 'Atq. Spé.'],
      ['specialDefense', 'Déf. Spé.'],
      ['speed', 'Vitesse'],
    ],
  }),
  computed: {
    p() {
      return this.card?.pokemon;
    },
  },
  methods: {
    typeName: localizeTypeName,
    typeStyle: typeBadgeStyle,
    natureName: natureLabel,
    natureEffect: natureDescription,
    moveName: (n) => localizeMoveName(n, 'fr'),
    abilityName: (n) => localizeAbilityName(n, 'fr'),
  },
};
</script>
<style scoped>
.draft-inspector {
  padding: 15px;
  color: var(--journal-ink);
  background: var(--journal-paper);
  border: 1px solid var(--journal-border);
  border-radius: 11px;
  font: 12px/1.6 var(--journal-font);
  min-width: 0;
}
.draft-inspector header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 9px;
}
.draft-inspector header > small {
  letter-spacing: 0.12em;
  color: var(--journal-muted);
  font-size: 8px;
}
.draft-inspector header button {
  width: 36px;
  height: 36px;
  background: var(--journal-card);
  border: 1px solid var(--journal-border);
  border-radius: 50%;
  font-size: 22px;
  color: inherit;
}
.draft-inspector .draft-card {
  box-shadow: none;
}
.draft-inspector .draft-card:hover {
  transform: none;
}
.draft-talent {
  margin-top: 14px;
}
.draft-inspector table {
  width: 100%;
  border-collapse: collapse;
  margin: 14px 0;
  font-size: 11px;
}
.draft-inspector th {
  text-align: left;
}
.draft-inspector td {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.draft-inspector td,
.draft-inspector th {
  padding: 6px;
  border-bottom: 1px solid var(--journal-border);
}
.draft-inspected-move {
  padding: 10px;
  border-left: 3px solid var(--pokemon-type-color);
  border-radius: 4px;
  background: var(--journal-soft);
  margin: 8px 0;
}
.draft-inspected-move small {
  display: block;
  font-size: 9px;
  margin: 4px 0;
  color: var(--journal-muted);
}
.draft-inspected-move p {
  margin: 5px 0 0;
  font-size: 11px;
}
.is-compact {
  font-size: 11px;
}
.draft-compatibility-list {
  margin-top: 15px;
  border-top: 1px solid var(--journal-border);
}
.draft-compatibility-list h4 {
  font-size: 12px;
}
.draft-compatibility-list > div {
  display: flex;
  gap: 9px;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid var(--journal-border);
  font-size: 10px;
}
.draft-compatibility-list .pokemon-portrait {
  width: 30px;
  height: 32px;
}
.draft-compatibility-list b {
  flex: 1;
}
.draft-compatibility-list span {
  color: var(--journal-muted);
}
.draft-compatibility-list .is-compatible span {
  color: var(--journal-accent);
  font-weight: 600;
}
</style>

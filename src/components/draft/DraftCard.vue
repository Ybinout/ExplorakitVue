<template>
  <article
    class="draft-card"
    :class="['kind-' + card.kind, { 'is-used': used, 'is-selected': selected }]"
    :style="tone"
    :data-draft-card="card.id"
    @mouseenter="$emit('preview', card)"
  >
    <header>
      <small>{{ kind }}</small
      ><button
        v-if="draggable && !used"
        class="draft-grip"
        aria-label="Glisser cette carte"
        title="Glisser cette carte"
        @pointerdown.stop.prevent="$emit('drag', $event, card)"
        @click.stop
      >
        ⠿</button
      ><potential-star v-if="pokemon" :value="pokemon.potential || pokemon.k" />
    </header>
    <button
      class="draft-card-face"
      @click="$emit('inspect', card)"
      :aria-label="'Inspecter ' + label"
    >
      <div class="draft-card-art">
        <pokemon-portrait
          v-if="pokemon"
          :src="$pokemonSprite(pokemon)"
          :alt="label"
        /><span
          v-else-if="card.kind === 'rift'"
          class="draft-rift-glyph"
          aria-hidden="true"
          >◇</span
        ><span
          v-else-if="card.kind === 'move'"
          class="draft-move-glyph"
          aria-hidden="true"
          >✦</span
        ><bag-item-icon v-else :item-key="iconKey" pocket="training" />
      </div>
      <h3>{{ label }}</h3>
      <div class="draft-card-types">
        <span v-for="type in types" :key="type" :style="typeStyle(type)">{{
          typeName(type)
        }}</span>
      </div>
      <template v-if="pokemon"
        ><small
          >Niv. {{ pokemon.level }} · {{ natureName(pokemon.nature) }}</small
        >
        <p class="draft-card-ability">
          {{ abilityName(pokemon.passiveAbility) }}
        </p>
        <div class="draft-card-stats">
          <span
            >PV <b>{{ pokemon.maxHp }}</b></span
          ><span
            >ATQ <b>{{ pokemon.stats.attack }}</b></span
          ><span
            >VIT <b>{{ pokemon.stats.speed }}</b></span
          >
        </div></template
      >
      <p v-else-if="card.kind === 'rift'" class="draft-rift-effect">
        <b>{{ card.bonus }}</b
        ><span>{{ card.penalty }}</span>
      </p>
      <p v-else-if="card.kind === 'move'" class="draft-card-effect">
        {{
          card.damageClass === 'physical'
            ? 'Physique'
            : card.damageClass === 'special'
            ? 'Spéciale'
            : 'Statut'
        }}<br />{{ card.power || '—' }} puiss. ·
        {{ card.accuracy || '—' }} préc. · {{ card.pp }} PP
      </p>
      <p v-else class="draft-card-effect">
        {{
          card.kind === 'iv'
            ? 'Fixe cet IV à 31'
            : card.kind === 'nature'
            ? natureEffect(card.nature)
            : card.kind === 'ability'
            ? 'Un talent libre pour ton Pokémon'
            : card.description
        }}
      </p>
      <small class="draft-inspect-label">Voir la carte ↗</small>
    </button>
    <button
      v-if="action"
      class="draft-card-select"
      :disabled="disabled || used"
      @click="$emit('select', card)"
    >
      {{ used ? 'Utilisée' : action }}
    </button>
  </article>
</template>
<script>
import PokemonPortrait from '../PokemonPortrait.vue';
import PotentialStar from '../PotentialStar.vue';
import BagItemIcon from '../menu/BagItemIcon.vue';
import { localizeTypeName, typeBadgeStyle } from '@/services/pokemonTypes';
import { natureLabel, natureDescription } from '@/services/pokemonNatures';
import { localizeMoveName, localizeAbilityName } from '@/services/i18n';
export default {
  components: { PokemonPortrait, PotentialStar, BagItemIcon },
  props: {
    card: Object,
    action: String,
    disabled: Boolean,
    draggable: Boolean,
    used: Boolean,
    selected: Boolean,
  },
  computed: {
    pokemon() {
      return this.card.kind === 'pokemon' ? this.card.pokemon : null;
    },
    kind() {
      return {
        pokemon: 'Pokémon',
        move: 'Capacité',
        item: 'Objet tenu',
        nature: 'Nature',
        iv: 'Entraînement',
        ability: 'Talent',
        rift: 'Rift d’équipe',
      }[this.card.kind];
    },
    label() {
      return this.pokemon
        ? this.pokemon.name
        : this.card.kind === 'move'
        ? this.moveName(this.card.move)
        : this.card.kind === 'nature'
        ? 'Nature ' + this.natureName(this.card.nature)
        : this.card.kind === 'ability'
        ? this.abilityName(this.card.ability)
        : this.card.name;
    },
    types() {
      return this.pokemon?.types || (this.card.type ? [this.card.type] : []);
    },
    tone() {
      return {
        '--draft-card-color': this.types[0]
          ? typeBadgeStyle(this.types[0])['--pokemon-type-color']
          : this.card.kind === 'rift'
          ? '#ae86d1'
          : this.card.kind === 'ability'
          ? '#b295cf'
          : this.card.kind === 'nature'
          ? '#81ac99'
          : '#bca16c',
      };
    },
    iconKey() {
      return (
        this.card.item ||
        (this.card.kind === 'iv'
          ? 'iv_randomizer_' + this.card.stat
          : this.card.kind === 'nature'
          ? 'nature_capsule'
          : 'ability_capsule')
      );
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
.draft-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid
    color-mix(in srgb, var(--draft-card-color) 65%, var(--journal-border));
  border-top: 4px solid var(--draft-card-color);
  border-radius: 10px;
  background: var(--journal-card);
  box-shadow: 0 3px 0 var(--journal-border);
  overflow: hidden;
  transition: transform 0.15s, border-color 0.15s;
}
.draft-card:hover {
  transform: translateY(-3px);
}
.draft-card.is-selected {
  outline: 2px solid var(--journal-accent);
  outline-offset: 2px;
}
.draft-card.is-used {
  opacity: 0.65;
}
.draft-card header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 33px;
  gap: 5px;
  padding: 4px 9px;
  background: color-mix(
    in srgb,
    var(--draft-card-color) 13%,
    var(--journal-card)
  );
}
.draft-card header small {
  text-transform: uppercase;
  font-size: 8px;
  letter-spacing: 0.08em;
}
.draft-grip {
  touch-action: none;
  cursor: grab;
  font-size: 20px;
  line-height: 1;
  min-height: 28px;
  min-width: 28px;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  color: var(--journal-muted);
}
.draft-card-face {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 10px 9px 8px;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: center;
  min-width: 0;
}
.draft-card-art {
  height: 86px;
  width: 100%;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: radial-gradient(
    ellipse,
    color-mix(in srgb, var(--draft-card-color) 22%, transparent),
    transparent 72%
  );
  margin-bottom: 5px;
}
.draft-card-art .pokemon-portrait {
  width: 95px;
  height: 86px;
}
.draft-card-art .bag-item-icon {
  width: 62px;
  height: 62px;
}
.draft-move-glyph {
  font-size: 66px;
  color: var(--draft-card-color);
  text-shadow: 0 3px 0 #0002;
}
.draft-rift-glyph {
  font: 85px Georgia, serif;
  color: #b48bdd;
  text-shadow: 0 0 13px #b98ad388;
  line-height: 1;
  animation: draft-rift-breathe 3s ease-in-out infinite;
}
h3 {
  font-size: 14px;
  line-height: 1.25;
  margin: 4px 0;
  overflow-wrap: anywhere;
}
.draft-card-types {
  display: flex;
  gap: 3px;
  justify-content: center;
  flex-wrap: wrap;
  margin: 2px 0 5px;
}
.draft-card-types span {
  background: var(--pokemon-type-color);
  color: var(--pokemon-type-ink);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
}
.draft-card-face > small {
  font-size: 9px;
  color: var(--journal-muted);
}
.draft-card-ability {
  font-size: 10px;
  line-height: 1.4;
  margin: 6px 0;
  color: var(--journal-accent);
}
.draft-card-stats {
  width: 100%;
  display: flex;
  justify-content: space-around;
  border-top: 1px solid var(--journal-border);
  padding-top: 8px;
  margin-top: auto;
  font-size: 8px;
  color: var(--journal-muted);
}
.draft-card-stats b {
  display: block;
  font-size: 12px;
  color: var(--journal-ink);
  margin-top: 2px;
}
.draft-card-effect {
  font-size: 10px;
  line-height: 1.55;
  margin: 7px 0;
  color: var(--journal-muted);
  max-height: 65px;
  overflow: hidden;
}
.draft-rift-effect {
  font-size: 11px;
  line-height: 1.5;
}
.draft-rift-effect b,
.draft-rift-effect span {
  display: block;
}
.draft-rift-effect b {
  color: var(--journal-accent);
}
.draft-rift-effect span {
  color: var(--journal-danger);
  margin-top: 7px;
}
.draft-inspect-label {
  margin: 7px 0 0;
  font-size: 8px !important;
}
.draft-card-select {
  width: 100%;
  border: 0 !important;
  border-top: 1px solid var(--journal-border) !important;
  border-radius: 0 !important;
  padding: 10px 5px !important;
  font: 600 11px var(--journal-font);
  background: var(--journal-soft) !important;
  color: var(--journal-heading);
  min-height: 38px;
  cursor: pointer;
}
.draft-card-select:disabled {
  opacity: 0.5;
  cursor: default;
}
@keyframes draft-rift-breathe {
  50% {
    transform: scale(1.06);
    filter: brightness(1.15);
  }
}
@media (prefers-reduced-motion: reduce) {
  .draft-card {
    transition: none;
  }
  .draft-rift-glyph {
    animation: none;
  }
}
</style>

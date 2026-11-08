<template>
  <article
    class="draft-card"
    :class="[
      'kind-' + card.kind,
      { 'is-used': used, 'is-selected': selected, 'is-interactive': !!action },
    ]"
    :style="tone"
    :data-draft-card="card.id"
    @dragstart.prevent
    @pointerdown="gesture"
    @touchstart="gesture"
  >
    <header>
      <small>{{ kind }}</small
      ><potential-star
        v-if="pokemon"
        :value="pokemon.potential || pokemon.k"
      /><span v-if="used" class="draft-used-label">Sélectionnée ✓</span>
      <button
        v-if="discardable"
        class="draft-card-discard"
        :disabled="disabled"
        :aria-label="'Supprimer définitivement ' + label + ' de cette draft'"
        title="Supprimer définitivement de cette partie"
        data-draft-discard
        @click.stop="$emit('discard', card)"
      >
        <svg
          viewBox="0 0 20 20"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          aria-hidden="true"
        >
          <path d="M3 5h14M7 5V2.8h6V5M5 5l.7 12h8.6L15 5M8 8v6M12 8v6" />
        </svg>
      </button>
    </header>
    <div
      class="draft-card-face"
      :role="action ? 'button' : undefined"
      :tabindex="action && !disabled ? 0 : undefined"
      :aria-label="action ? action + ' ' + label : undefined"
      :aria-disabled="action ? disabled || (used && !reversible) : undefined"
      @click="activate"
      @keydown.enter.prevent.stop="activate"
      @keydown.space.prevent.stop="activate"
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
      <template v-if="pokemon">
        <small
          >Niv. {{ pokemon.level }} · {{ natureName(pokemon.nature) }}</small
        >
        <p class="draft-card-ability">
          <b>{{ abilityName(pokemon.passiveAbility) }}</b> ·
          {{ abilityDescription(pokemon.passiveAbility) }}
        </p>
        <div class="draft-card-stats" data-draft-full-stats>
          <span v-for="stat in stats" :key="stat[0]"
            ><small>{{ stat[1] }}</small
            ><b>{{
              stat[0] === 'hp' ? pokemon.maxHp : pokemon.stats[stat[0]]
            }}</b
            ><small class="draft-genetics"
              >IV {{ pokemon.iv?.[stat[0]] ?? '—' }} · EV
              {{ pokemon.ev?.[stat[0]] ?? '—' }}</small
            ></span
          >
        </div>
        <div class="draft-card-moves" data-draft-full-moves>
          <span v-for="m in moves" :key="m.name" :style="typeStyle(m.type)"
            ><b>{{ moveName(m.name) }}</b
            ><small
              >{{ typeName(m.type) }} ·
              {{
                m.damageClass === 'physical'
                  ? 'Phys.'
                  : m.damageClass === 'special'
                  ? 'Spé.'
                  : 'Statut'
              }}
              · {{ m.powerLabel }} · {{ m.maxPp }} PP</small
            ></span
          >
        </div>
      </template>
      <template v-else-if="card.kind === 'move'"
        ><p class="draft-card-effect">
          <b>{{
            card.damageClass === 'physical'
              ? 'Physique'
              : card.damageClass === 'special'
              ? 'Spéciale'
              : 'Statut'
          }}</b>
          · {{ moveDetail.powerLabel }} puiss. ·
          {{ card.accuracy || '—' }} préc. · {{ card.pp }} PP
        </p>
        <p class="draft-card-description">
          {{ moveDetail.description }}
        </p></template
      >
      <p v-else-if="card.kind === 'rift'" class="draft-rift-effect">
        <b>{{ card.bonus }}</b
        ><span>{{ card.penalty }}</span>
      </p>
      <p v-else class="draft-card-description">
        {{
          card.kind === 'iv'
            ? 'Fixe à 31 l’IV de ' +
              ivName +
              '. Les statistiques sont recalculées.'
            : card.kind === 'nature'
            ? natureEffect(card.nature)
            : card.kind === 'ability'
            ? abilityDescription(card.ability)
            : card.description
        }}
      </p>
    </div>
    <div
      v-if="showCompatibility && card.kind === 'move' && card.compatibility"
      class="draft-compatibility"
      data-draft-compatibility
      data-draft-no-gesture
    >
      <small>{{ compatibilityLabel }}</small>
      <div class="draft-compat-sprites">
        <span
          v-for="p in card.compatibility"
          :key="p.cardId"
          :class="{ 'has-match': p.compatible && !p.known }"
          :title="
            p.name +
            ' : ' +
            (p.known ? 'déjà connue' : p.compatible ? 'apte' : 'inapte')
          "
          :aria-label="
            p.name +
            ' : ' +
            (p.known ? 'déjà connue' : p.compatible ? 'apte' : 'inapte')
          "
          ><pokemon-portrait
            :src="$pokemonSprite({ data: { id: p.pokemonId } })"
            alt=""
          /><b>{{ p.known ? '=' : p.compatible ? '✓' : '×' }}</b></span
        >
      </div>
    </div>
    <button
      v-if="action"
      class="draft-card-select"
      :disabled="disabled || (used && !reversible)"
      @click.stop="activate"
    >
      {{ used ? (reversible ? 'Désélectionner' : 'Sélectionnée ✓') : action }}
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
import catalog from '@/data/pokemonReference.fr.json';
import { createPokemonReference } from '@/services/pokemonReference';
const reference = createPokemonReference(catalog);
const stats = [
  ['hp', 'PV'],
  ['attack', 'ATQ'],
  ['defense', 'DÉF'],
  ['specialAttack', 'ATQ SPÉ'],
  ['specialDefense', 'DÉF SPÉ'],
  ['speed', 'VIT'],
];
export default {
  components: { PokemonPortrait, PotentialStar, BagItemIcon },
  props: {
    card: Object,
    showCompatibility: { type: Boolean, default: true },
    action: String,
    disabled: Boolean,
    draggable: Boolean,
    used: Boolean,
    selected: Boolean,
    reversible: Boolean,
    discardable: Boolean,
  },
  computed: {
    stats: () => stats,
    moves() {
      return this.pokemon ? reference.moves(this.pokemon) : [];
    },
    moveDetail() {
      return reference.moves({ abilities: [this.card.move] })[0] || {};
    },
    ivName() {
      return {
        hp: 'PV',
        attack: 'l’Attaque',
        defense: 'la Défense',
        specialAttack: 'l’Attaque Spéciale',
        specialDefense: 'la Défense Spéciale',
        speed: 'la Vitesse',
      }[this.card.stat];
    },
    learners() {
      return (this.card.compatibility || []).filter(
        (p) => p.compatible && !p.known
      );
    },
    compatibilityLabel() {
      return !this.card.compatibility?.length
        ? 'Pas encore de Pokémon'
        : this.learners.length
        ? this.learners.length +
          ' compatible' +
          (this.learners.length > 1 ? 's' : '')
        : this.card.compatibility.some((p) => p.known)
        ? 'Déjà connue'
        : 'Aucun compatible';
    },
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
    activate() {
      if (this.action && !this.disabled && (!this.used || this.reversible))
        this.$emit('select', this.card);
    },
    gesture(event) {
      if (this.draggable && !this.disabled && (!this.used || this.reversible))
        this.$emit('gesture', event, this.card);
    },
    typeName: localizeTypeName,
    typeStyle: typeBadgeStyle,
    natureName: natureLabel,
    natureEffect: natureDescription,
    moveName: (n) => localizeMoveName(n, 'fr'),
    abilityName: (n) => localizeAbilityName(n, 'fr'),
    abilityDescription: reference.abilityDescription,
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
  border-radius: 12px;
  background: var(--journal-card);
  box-shadow: 0 3px 0 var(--journal-border);
  overflow: hidden;
  transition: border-color 0.18s, opacity 0.18s;
  user-select: none;
  -webkit-touch-callout: none;
}
.draft-card.is-interactive {
  cursor: grab;
}
.draft-card.is-selected {
  outline: 2px solid var(--journal-accent);
  outline-offset: 2px;
}
.draft-card.is-used {
  opacity: 0.57;
  filter: saturate(0.55);
}
.draft-card.is-gesture-origin {
  opacity: 0.16;
}
.draft-card header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 30px;
  gap: 5px;
  padding: 4px 10px;
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
.draft-used-label {
  font-size: 8px;
}
.draft-card-discard {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 30px;
  min-width: 30px;
  min-height: 30px;
  padding: 5px !important;
  border: 0 !important;
  border-radius: 5px;
  background: transparent !important;
  color: var(--journal-danger);
  cursor: pointer;
}
.draft-card-discard:hover,
.draft-card-discard:focus-visible {
  outline: 1px solid var(--journal-danger);
  background: var(--journal-soft) !important;
}
.draft-card-discard:disabled {
  opacity: 0.4;
  cursor: default;
}
.draft-card-face {
  flex: 1;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 9px 10px 11px;
  color: inherit;
  text-align: center;
  min-width: 0;
  outline-offset: -3px;
}
.draft-card-art {
  height: 66px;
  width: 100%;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: radial-gradient(
    ellipse,
    color-mix(in srgb, var(--draft-card-color) 22%, transparent),
    transparent 72%
  );
}
.draft-card-art .pokemon-portrait {
  width: 80px;
  height: 66px;
}
.draft-card-art .bag-item-icon {
  width: 46px;
  height: 46px;
}
.draft-move-glyph {
  font-size: 52px;
  color: var(--draft-card-color);
  text-shadow: 0 3px 0 #0002;
}
.draft-rift-glyph {
  font: 66px Georgia, serif;
  color: #b48bdd;
  line-height: 1;
}
h3 {
  font-size: 15px;
  line-height: 1.25;
  margin: 5px 0;
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
  line-height: 1.45;
  margin: 6px 0 9px;
  color: var(--journal-muted);
}
.draft-card-ability b {
  color: var(--journal-accent);
}
.draft-card-stats {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  border-top: 1px solid var(--journal-border);
  padding-top: 8px;
  font-size: 8px;
  color: var(--journal-muted);
}
.draft-card-stats > span {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.draft-card-stats b {
  font-size: 13px;
  color: var(--journal-ink);
}
.draft-card-stats small {
  font-size: 8px;
  white-space: nowrap;
}
.draft-card-stats .draft-genetics {
  font-size: 7px;
}
.draft-card-moves {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
  margin-top: 10px;
  text-align: left;
}
.draft-card-moves > span {
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-left: 3px solid var(--pokemon-type-color);
  background: color-mix(
    in srgb,
    var(--pokemon-type-color) 9%,
    var(--journal-card)
  );
  border-radius: 4px;
  padding: 5px;
  min-width: 0;
}
.draft-card-moves b {
  font-size: 9px;
  overflow-wrap: anywhere;
}
.draft-card-moves small {
  font-size: 7px;
  line-height: 1.35;
  color: var(--journal-muted);
}
.draft-card-effect,
.draft-card-description {
  font-size: 11px;
  line-height: 1.55;
  margin: 7px 0;
  color: var(--journal-muted);
  overflow-wrap: anywhere;
}
.draft-rift-effect {
  font-size: 12px;
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
.draft-card-select {
  width: 100%;
  border: 0 !important;
  border-top: 1px solid var(--journal-border) !important;
  border-radius: 0 !important;
  padding: 10px 5px !important;
  font: 600 11px var(--journal-font);
  background: var(--journal-soft) !important;
  color: var(--journal-heading);
  min-height: 40px;
  cursor: pointer;
}
.draft-card-select:disabled {
  opacity: 0.5;
  cursor: default;
}
.draft-compatibility {
  padding: 6px 9px;
  border-top: 1px solid var(--journal-border);
  color: var(--journal-muted);
}
.draft-compatibility > small {
  font-size: 9px;
}
.draft-compat-sprites {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 4px;
}
.draft-compat-sprites > span {
  display: flex;
  align-items: center;
  border: 1px solid var(--journal-border);
  border-radius: 5px;
  opacity: 0.55;
}
.draft-compat-sprites .has-match {
  opacity: 1;
  border-color: var(--journal-accent);
  color: var(--journal-accent);
}
.draft-compat-sprites .pokemon-portrait {
  width: 23px;
  height: 25px;
}
.draft-compat-sprites b {
  font-size: 10px;
  padding-right: 4px;
}
@media (prefers-reduced-motion: reduce) {
  .draft-card {
    transition: none;
  }
}
</style>

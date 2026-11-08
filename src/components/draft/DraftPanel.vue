<template>
  <div class="draft-backdrop" @keydown.stop="keyDown" @keyup.stop>
    <section
      ref="panel"
      tabindex="-1"
      class="draft-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="draft-title"
      data-draft-panel
    >
      <header class="draft-heading">
        <span class="draft-emblem" aria-hidden="true">▱</span>
        <div>
          <small>VILLE DU LAC · {{ phaseLabel }}</small>
          <h2 id="draft-title">Maison des Drafts</h2>
        </div>
        <span
          v-if="clock"
          class="draft-clock"
          :class="{ 'is-urgent': seconds <= 10 }"
          role="timer"
          >{{ clock }}</span
        ><button
          class="draft-close"
          @click="$emit('close')"
          aria-label="Fermer"
        >
          ×
        </button>
      </header>
      <p v-if="error" class="draft-error" role="alert">{{ error }}</p>
      <p v-if="!connected" class="draft-error" role="status">
        Connexion interrompue. La partie reste sauvegardée ; les chronomètres
        continuent.
      </p>
      <div class="draft-body" :class="'phase-' + (state?.phase || 'home')">
        <template v-if="!state?.id">
          <div class="draft-welcome">
            <small>CHOISIR. CONSTRUIRE. COMBATTRE.</small>
            <h3>Ta prochaine équipe est dans ces cartes.</h3>
            <p>
              Quatre dresseurs, quatre boosters et un Rift. Chaque carte compte
              ; seuls les Pokédollars gagnés repartent avec toi.
            </p>
            <div class="draft-features">
              <span><b>4 × 8</b>cartes classiques</span
              ><span><b>1 × 8</b>cartes Rift</span
              ><span><b>150 000 ₽</b>pour le vainqueur</span>
            </div>
          </div>
          <section class="draft-new-table">
            <h3>Ouvrir une table</h3>
            <label
              >Niveau commun<select v-model.number="level" data-draft-level>
                <option
                  v-for="n in catalog.levels || [25, 50, 75, 100]"
                  :key="n"
                  :value="n"
                >
                  Niveau {{ n }}
                </option>
              </select></label
            ><button
              class="draft-primary"
              :disabled="busy || !connected"
              data-draft-create
              @click="send('create', { level })"
            >
              Créer une partie →
            </button>
          </section>
          <section class="draft-existing">
            <h3>Tables en attente</h3>
            <p v-if="!catalog.tables?.length" class="draft-muted">
              Aucune table ouverte. Tu peux jouer seul : trois IA te
              rejoindront.
            </p>
            <button
              v-for="t in catalog.tables || []"
              :key="t.id"
              :disabled="busy"
              @click="send('join', { id: t.id })"
            >
              <span
                ><b>{{ t.host }}</b
                ><small
                  >Niv. {{ t.level }} · {{ t.participants }}/4</small
                ></span
              >Rejoindre →
            </button>
          </section>
          <details class="draft-rules">
            <summary>Comment ça se joue ?</summary>
            <p>
              À chaque choix, prends une carte puis passe les autres à droite.
              Tu as {{ pickSeconds }} secondes. Après 32 choix, le dernier
              booster ne contient que des Rifts.
            </p>
            <p>
              Tu disposes ensuite de {{ preparationMinutes }} minutes pour
              préparer jusqu’à 6 Pokémon. Les attaques suivent leur movepool,
              les cartes Talent sont libres. Une amélioration retirée revient
              dans ta collection.
            </p>
            <p>
              Deux demi-finales et une finale, sans utiliser le sac. Ton équipe
              est soignée avant chaque duel. Vainqueur : 150 000 ₽ ; finaliste :
              50 000 ₽. Aucun Pokémon ni objet permanent n’est utilisé et aucune
              XP n’est gagnée.
            </p>
          </details>
        </template>
        <template v-else>
          <div class="draft-seats" aria-label="Participants">
            <article
              v-for="s in state.participants"
              :key="s.index"
              :class="{
                'is-self': s.index === state.you,
                'is-ready': s.ready,
                'is-out': s.eliminated || s.forfeited,
              }"
            >
              <span class="draft-seat-number">{{ s.index + 1 }}</span>
              <div>
                <b>{{ s.name }}</b
                ><small
                  >{{ s.bot ? 'IA' : s.online ? 'En ligne' : 'Déconnecté'
                  }}<template v-if="state.phase === 'draft'">
                    ·
                    {{
                      s.ready ? 'Choix prêt' : s.remaining + ' cartes'
                    }}</template
                  ><template v-else-if="state.phase === 'preparation'">
                    · {{ s.ready ? 'Équipe prête' : 'Préparation' }}</template
                  ></small
                >
              </div>
              <span class="draft-pass-arrow" aria-hidden="true">→</span>
            </article>
          </div>
          <div v-if="state.phase === 'lobby'" class="draft-lobby">
            <h3>La table est ouverte.</h3>
            <p>
              Invite tes amis ou complète les places avec des IA. Tout le monde
              reçoit des cartes au niveau {{ state.level }}.
            </p>
            <div class="draft-lobby-actions">
              <button
                v-if="host"
                :disabled="busy"
                @click="send('bots', { fill: true })"
              >
                Compléter avec des IA</button
              ><button
                v-if="host && state.participants.some((s) => s.bot)"
                :disabled="busy"
                @click="send('bots', { fill: false })"
              >
                Libérer les places IA</button
              ><button
                v-if="host"
                class="draft-primary"
                :disabled="busy || !connected"
                data-draft-start
                @click="send('start')"
              >
                Ouvrir les boosters →
              </button>
              <p v-else class="draft-muted">
                L’hôte lance la partie dès que la table est prête.
              </p>
            </div>
            <section v-if="host" class="draft-invites">
              <h4>Inviter un ami</h4>
              <button @click="$emit('friends')">Actualiser les amis</button>
              <p v-if="!friends.length" class="draft-muted">
                Tes amis apparaîtront ici. Ils doivent rejoindre la Maison des
                Drafts pour prendre place.
              </p>
              <button
                v-for="f in friends"
                :key="f.id"
                :disabled="
                  busy ||
                  !f.online ||
                  state.participants.some((s) => s.userId === f.id)
                "
                @click="send('invite', { userId: f.id })"
              >
                <span
                  >{{ f.name
                  }}<small>{{
                    f.online
                      ? f.here
                        ? 'Dans la salle'
                        : 'En ligne'
                      : 'Hors ligne'
                  }}</small></span
                >Inviter +
              </button>
            </section>
          </div>
          <template v-else-if="state.phase === 'draft'">
            <div class="draft-round-title">
              <div>
                <small>{{
                  state.round === 4
                    ? 'LE BOOSTER RIFT'
                    : 'BOOSTER ' + (state.round + 1) + ' / 4'
                }}</small>
                <h3>
                  {{
                    state.round === 4
                      ? 'Un avantage. Une contrepartie.'
                      : 'Quelle carte vas-tu garder ?'
                  }}
                </h3>
              </div>
              <span>Choix {{ state.pick + 1 }} / {{ state.packSize }}</span>
            </div>
            <div
              :key="'round-' + state.round + '-' + state.pick"
              class="draft-pack"
              :class="{ 'is-rift-pack': state.round === 4 }"
              data-draft-pack
            >
              <draft-card
                v-for="(card, i) in state.pack"
                :key="card.id"
                :card="card"
                :style="{ '--deal-index': i }"
                :selected="state.picked === card.id"
                :disabled="busy || !!state.picked || !connected"
                :draggable="!state.picked && !busy"
                action="Sélectionner"
                @select="choose"
                @inspect="inspect"
                @preview="preview = $event"
                @drag="drag"
              />
            </div>
            <div
              class="draft-pick-zone"
              :class="{ 'is-picked': !!state.picked }"
              data-draft-drop="pick"
            >
              <b>{{
                state.picked
                  ? 'Ta carte est choisie.'
                  : 'Glisse ta carte ici pour la garder.'
              }}</b
              ><span>{{
                state.picked
                  ? 'Le booster circule dès que les quatre choix sont prêts.'
                  : 'Tu peux aussi utiliser le bouton Sélectionner.'
              }}</span>
            </div>
            <details class="draft-collection-preview">
              <summary>
                Ma collection · {{ state.collection.length }} cartes
              </summary>
              <div class="draft-small-cards">
                <draft-card
                  v-for="card in state.collection"
                  :key="card.id"
                  :card="card"
                  @inspect="inspect"
                />
              </div>
            </details>
          </template>
          <template v-else-if="state.phase === 'preparation'">
            <div class="draft-round-title">
              <div>
                <small
                  >{{ preparationMinutes }} MINUTES POUR TOUT PRÉPARER</small
                >
                <h3>Compose ton équipe.</h3>
              </div>
              <button
                class="draft-primary"
                :disabled="
                  busy ||
                  state.preparation.confirmed ||
                  !state.preparation.team.some(Boolean) ||
                  !connected
                "
                data-draft-confirm
                @click="send('confirm')"
              >
                {{
                  state.preparation.confirmed
                    ? 'Équipe validée ✓'
                    : 'Valider mon équipe →'
                }}
              </button>
            </div>
            <p class="draft-muted">
              Choisis une carte puis un emplacement, ou utilise sa poignée pour
              la glisser. Une carte d’amélioration ne s’utilise qu’une fois ; tu
              peux la retirer avant de valider.
            </p>
            <div class="draft-preparation">
              <section class="draft-team-area">
                <h4>
                  Mon équipe
                  <small
                    >{{ state.preparation.team.filter(Boolean).length }} /
                    6</small
                  >
                </h4>
                <p
                  v-if="selected?.kind === 'move'"
                  ref="moveGuidance"
                  class="draft-move-guidance"
                  role="status"
                  aria-live="polite"
                  data-draft-move-guidance
                >
                  <b>{{ cardLabel(selected) }}</b> · Choisis un Pokémon apte
                  ci-dessous.
                </p>
                <div ref="team" class="draft-team-grid">
                  <article
                    v-for="(p, i) in state.preparation.team"
                    :key="i"
                    class="draft-team-slot"
                    :class="{
                      'is-target': p && selectedPokemon === p.cardId,
                      'is-apt':
                        p &&
                        selected?.kind === 'move' &&
                        moveAptitude(p).eligible,
                      'is-inapt':
                        p &&
                        selected?.kind === 'move' &&
                        !moveAptitude(p).eligible,
                    }"
                    :data-draft-drop="'team:' + i"
                    :data-draft-slot="i"
                  >
                    <button
                      v-if="!p"
                      class="draft-empty-slot"
                      :disabled="locked"
                      @click="place(i)"
                    >
                      <span>{{ i + 1 }}</span
                      >{{
                        selected?.kind === 'pokemon'
                          ? 'Placer ici +'
                          : 'Emplacement libre'
                      }}</button
                    ><template v-else
                      ><button
                        class="draft-slot-remove"
                        :disabled="locked"
                        :aria-label="'Retirer ' + p.name + ' de l’équipe'"
                        @click="
                          send('edit', {
                            action: 'slot',
                            slot: i,
                            cardId: null,
                          })
                        "
                      >
                        ×</button
                      ><button
                        class="draft-slot-face"
                        :disabled="
                          selected?.kind === 'move' && !moveAptitude(p).eligible
                        "
                        @click="target(p)"
                      >
                        <potential-star :value="p.potential" /><pokemon-portrait
                          :src="$pokemonSprite(p)"
                          :alt="p.name"
                        /><b>{{ p.name }}</b
                        ><span
                          v-if="selected?.kind === 'move'"
                          class="draft-slot-aptitude"
                          :data-draft-aptitude="
                            moveAptitude(p).eligible ? 'apt' : 'inapt'
                          "
                          >{{ moveAptitude(p).label }}</span
                        ><small>{{
                          p.heldItemName || 'Sans objet'
                        }}</small></button
                      ><button
                        class="draft-slot-detail"
                        @click="
                          inspect({ id: p.cardId, kind: 'pokemon', pokemon: p })
                        "
                      >
                        Fiche ↗
                      </button></template
                    >
                  </article>
                </div>
                <div class="draft-active-rift">
                  <small>RIFT D’ÉQUIPE</small
                  ><template v-if="activeRift"
                    ><b>{{ activeRift.name }}</b
                    ><span>{{ activeRift.bonus }}</span
                    ><span class="draft-danger">{{ activeRift.penalty }}</span
                    ><button
                      :disabled="locked"
                      @click="send('edit', { action: 'rift', cardId: null })"
                    >
                      Retirer
                    </button></template
                  >
                  <p v-else>
                    Choisis un seul Rift dans ta collection, ou joue sans Rift.
                  </p>
                </div>
              </section>
              <section class="draft-prep-collection">
                <nav class="draft-filters" aria-label="Catégories de cartes">
                  <button
                    v-for="f in filters"
                    :key="f.key"
                    :class="{ 'is-active': filter === f.key }"
                    @click="filter = f.key"
                  >
                    {{ f.label }}
                    <small>{{
                      state.collection.filter(
                        (c) => f.key === 'all' || c.kind === f.key
                      ).length
                    }}</small>
                  </button>
                </nav>
                <div class="draft-small-cards">
                  <draft-card
                    v-for="card in filtered"
                    :key="card.id"
                    :card="card"
                    :used="used(card)"
                    :selected="selected?.id === card.id"
                    :draggable="!locked && !used(card)"
                    :disabled="locked"
                    :action="
                      card.kind === 'pokemon'
                        ? 'Choisir'
                        : card.kind === 'rift'
                        ? 'Activer'
                        : 'Appliquer'
                    "
                    @select="selectUpgrade"
                    @inspect="inspect"
                    @preview="preview = $event"
                    @drag="drag"
                  />
                </div>
              </section>
              <aside ref="application" class="draft-application">
                <template v-if="selectedPokemonView"
                  ><h4>{{ selectedPokemonView.name }}</h4>
                  <p
                    v-if="
                      selected &&
                      selected.kind !== 'pokemon' &&
                      selected.kind !== 'rift'
                    "
                  >
                    Carte choisie : <b>{{ cardLabel(selected) }}</b>
                  </p>
                  <label v-if="selected?.kind === 'move'"
                    >Capacité à remplacer<select v-model.number="moveSlot">
                      <option
                        v-for="(m, i) in selectedPokemonView.moveDetails || []"
                        :key="i"
                        :value="i"
                      >
                        {{ moveName(m.name) }}
                      </option>
                      <option
                        v-if="
                          (selectedPokemonView.moveDetails || []).length < 4
                        "
                        :value="selectedPokemonView.moveDetails.length"
                      >
                        Nouvel emplacement
                      </option>
                    </select></label
                  ><button
                    v-if="
                      selected && !['pokemon', 'rift'].includes(selected.kind)
                    "
                    class="draft-primary"
                    :disabled="
                      locked ||
                      used(selected) ||
                      (selected.kind === 'move' &&
                        !moveAptitude(selectedPokemonView).eligible)
                    "
                    @click="applySelected"
                  >
                    Appliquer cette carte
                  </button>
                  <p v-else class="draft-muted">
                    Sélectionne une carte d’amélioration dans ta collection.
                  </p>
                  <ul class="draft-applied">
                    <li v-for="a in applied" :key="a.slot">
                      <span>{{ cardLabel(a.card) }}</span
                      ><button
                        :disabled="locked"
                        @click="
                          send('edit', {
                            action: 'remove',
                            pokemonId: selectedPokemon,
                            slot: a.slot,
                          })
                        "
                      >
                        Retirer ↩
                      </button>
                    </li>
                  </ul></template
                >
                <p v-else class="draft-muted">
                  Choisis un Pokémon placé dans l’équipe pour lui attribuer tes
                  améliorations.
                </p>
                <draft-inspector
                  v-if="preview"
                  :card="preview"
                  compact
                  class="draft-desktop-inspector"
                />
              </aside>
            </div>
          </template>
          <section
            v-else-if="state.phase === 'tournament'"
            class="draft-bracket"
          >
            <small>LE TOURNOI</small>
            <h3>
              {{
                state.activeMatch
                  ? 'Ton duel est prêt.'
                  : mySeat?.eliminated
                  ? 'Ton parcours s’arrête en demi-finale.'
                  : 'Les duels se poursuivent.'
              }}
            </h3>
            <p v-if="mySeat?.eliminated">
              Tu peux suivre les résultats ou quitter la table pour rejouer.
            </p>
            <button
              v-if="state.activeMatch"
              :disabled="busy"
              class="draft-primary"
              @click="send('refresh')"
            >
              Reprendre le combat →</button
            ><template
              v-if="
                state.finalists?.includes(state.you) &&
                !state.matches.some((m) => m.round === 'final')
              "
              ><p>
                Tu es qualifié pour la finale. Ton équipe repartira entièrement
                soignée.
              </p>
              <button
                class="draft-primary"
                :disabled="busy || state.finalReady"
                @click="send('continue')"
              >
                {{
                  state.finalReady
                    ? 'Prêt pour la finale ✓'
                    : 'Je suis prêt pour la finale →'
                }}
              </button></template
            >
            <article
              v-for="m in state.matches"
              :key="m.id"
              :class="{ 'is-final': m.round === 'final' }"
            >
              <small>{{
                m.round === 'final' ? 'FINALE' : 'DEMI-FINALE'
              }}</small>
              <div>
                <span
                  v-for="i in m.seats"
                  :key="i"
                  :class="{
                    'is-winner': m.status === 'finished' && m.winner === i,
                  }"
                  >{{ state.participants[i].name }}
                  <b v-if="m.status === 'finished' && m.winner === i"
                    >✓</b
                  ></span
                >
              </div>
              <p>
                {{
                  m.status === 'active'
                    ? 'Combat en cours · tour ' + m.turn
                    : m.winner === null
                    ? 'Aucun vainqueur'
                    : 'Victoire de ' + state.participants[m.winner].name
                }}
              </p>
            </article>
          </section>
          <section
            v-else-if="state.phase === 'finished'"
            class="draft-results"
            data-draft-results
          >
            <small>TABLE TERMINÉE</small>
            <h3>
              {{
                mySeat?.rank === 1
                  ? 'Tu remportes la draft !'
                  : mySeat?.rank === 2
                  ? 'Une place en finale.'
                  : 'La prochaine équipe sera différente.'
              }}
            </h3>
            <p>
              Les gains sont sauvegardés. Les Pokémon et les cartes de cette
              partie restent à la Maison des Drafts.
            </p>
            <article
              v-for="s in sortedResults"
              :key="s.index"
              :class="['rank-' + s.rank, { 'is-self': s.index === state.you }]"
            >
              <strong>{{
                s.rank === 1 ? '1' : s.rank === 2 ? '2' : '3'
              }}</strong>
              <div>
                <b>{{ s.name }}</b
                ><small>{{
                  s.forfeited
                    ? 'Abandon'
                    : s.rank === 1
                    ? 'Vainqueur'
                    : s.rank === 2
                    ? 'Finaliste'
                    : 'Demi-finaliste'
                }}</small
                ><span class="draft-result-team"
                  ><pokemon-portrait
                    v-for="(p, i) in s.team"
                    :key="i"
                    :src="$pokemonSprite({ data: { id: p.id } })"
                    alt=""
                /></span>
              </div>
              <b>{{ money(s.reward) }} ₽</b>
            </article>
            <button class="draft-primary" @click="$emit('finish')">
              Retour dans la salle →
            </button>
          </section>
          <section v-else class="draft-lobby">
            <h3>Cette table a été fermée.</h3>
            <button @click="$emit('finish')">Retour</button>
          </section>
        </template>
      </div>
      <footer
        v-if="state?.id && !['finished', 'cancelled'].includes(state.phase)"
        class="draft-footer"
      >
        <small>{{
          state.phase === 'lobby'
            ? 'Tous les Pokémon et objets sont temporaires.'
            : 'Ta progression est sauvegardée. Fermer cette fenêtre ne quitte pas la partie.'
        }}</small
        ><button @click="quitConfirm = true" :disabled="busy">
          {{
            state.phase === 'lobby' ? 'Quitter la table' : 'Abandonner la draft'
          }}
        </button>
      </footer>
      <div
        v-if="inspection"
        v-back="() => (inspection = null)"
        class="draft-inspect-backdrop"
        @click.self="inspection = null"
      >
        <draft-inspector :card="inspection" @close="inspection = null" />
      </div>
      <div
        v-if="quitConfirm"
        v-back="() => (quitConfirm = false)"
        class="draft-inspect-backdrop"
      >
        <section class="draft-quit-confirm" role="alertdialog">
          <h3>
            {{
              state?.phase === 'lobby'
                ? 'Quitter cette table ?'
                : 'Abandonner cette draft ?'
            }}
          </h3>
          <p>
            {{
              state?.phase === 'lobby'
                ? 'Ta place sera libérée.'
                : 'Tu seras déclaré forfait. Aucune carte ni Pokémon permanent ne sera perdu.'
            }}
          </p>
          <button @click="quitConfirm = false">Rester</button
          ><button
            :disabled="busy"
            @click="
              send('leave');
              quitConfirm = false;
            "
          >
            Quitter
          </button>
        </section>
      </div>
    </section>
  </div>
</template>
<script>
import DraftCard from './DraftCard.vue';
import DraftInspector from './DraftInspector.vue';
import PokemonPortrait from '../PokemonPortrait.vue';
import PotentialStar from '../PotentialStar.vue';
import { startDraftDrag } from '@/services/draftDrag';
import { localizeMoveName, localizeAbilityName } from '@/services/i18n';
import { natureLabel } from '@/services/pokemonNatures';
const filters = [
  { key: 'all', label: 'Tout' },
  { key: 'pokemon', label: 'Pokémon' },
  { key: 'move', label: 'Capacités' },
  { key: 'item', label: 'Objets' },
  { key: 'nature', label: 'Natures' },
  { key: 'iv', label: 'IV' },
  { key: 'ability', label: 'Talents' },
  { key: 'rift', label: 'Rifts' },
];
export default {
  components: { DraftCard, DraftInspector, PokemonPortrait, PotentialStar },
  props: {
    state: Object,
    catalog: { type: Object, default: () => ({}) },
    friends: { type: Array, default: () => [] },
    busy: Boolean,
    error: String,
    connected: Boolean,
  },
  data() {
    return {
      level: this.catalog.defaultLevel || 100,
      filters,
      filter: 'all',
      selected: null,
      selectedPokemon: null,
      moveSlot: 0,
      inspection: null,
      preview: null,
      quitConfirm: false,
      at: Date.now(),
    };
  },
  computed: {
    pickSeconds() {
      return (
        (this.state?.timing?.pickMs || this.catalog.timing?.pickMs || 50000) /
        1000
      );
    },
    preparationMinutes() {
      return (
        (this.state?.timing?.preparationMs ||
          this.catalog.timing?.preparationMs ||
          420000) / 60000
      );
    },
    moveTargets() {
      return Object.fromEntries(
        (this.selected?.compatibility || []).map((p) => [p.cardId, p])
      );
    },
    phaseLabel() {
      return (
        {
          lobby: 'Table ouverte',
          draft: 'Draft en cours',
          preparation: 'Préparation',
          tournament: 'Tournoi',
          finished: 'Résultats',
        }[this.state?.phase] || 'Le jeu dans le jeu'
      );
    },
    host() {
      return this.mySeat?.userId === this.state.hostId;
    },
    mySeat() {
      return this.state?.participants?.[this.state.you];
    },
    locked() {
      return (
        this.busy || !!this.state?.preparation?.confirmed || !this.connected
      );
    },
    seconds() {
      const deadline = this.state?.deadline || this.state?.finalDeadline;
      return deadline
        ? Math.max(
            0,
            Math.ceil((deadline - (this.at + (this._offset || 0))) / 1000)
          )
        : 0;
    },
    clock() {
      if (!this.state?.deadline && !this.state?.finalDeadline) return '';
      return `${Math.floor(this.seconds / 60)}:${String(
        this.seconds % 60
      ).padStart(2, '0')}`;
    },
    filtered() {
      return (this.state?.collection || []).filter(
        (c) => this.filter === 'all' || c.kind === this.filter
      );
    },
    activeRift() {
      return this.state?.collection?.find(
        (c) => c.id === this.state.preparation?.rift
      );
    },
    selectedPokemonView() {
      return this.state?.preparation?.team?.find(
        (p) => p?.cardId === this.selectedPokemon
      );
    },
    applied() {
      return Object.entries(
        this.state?.preparation?.attachments?.[this.selectedPokemon] || {}
      )
        .map(([slot, id]) => ({
          slot,
          card: this.state.collection.find((c) => c.id === id),
        }))
        .filter((a) => a.card);
    },
    sortedResults() {
      return [...(this.state?.results || [])].sort(
        (a, b) => a.rank - b.rank || a.index - b.index
      );
    },
  },
  watch: {
    state: {
      immediate: true,
      handler(s) {
        if (s?.serverNow) this._offset = s.serverNow - Date.now();
        if (this.inspection?.kind === 'move')
          this.inspection =
            [...(s?.pack || []), ...(s?.collection || [])].find(
              (c) => c.id === this.inspection.id
            ) || null;
        if (this.selected)
          this.selected =
            s?.collection?.find((c) => c.id === this.selected.id) || null;
      },
    },
    'state.phase'() {
      this.inspection = null;
      this.preview = null;
      this.selected = null;
      this.selectedPokemon = null;
    },
  },
  mounted() {
    this._before = document.activeElement;
    this.$refs.panel.focus({ preventScroll: true });
    this._clock = setInterval(() => {
      this.at = Date.now();
    }, 250);
  },
  beforeDestroy() {
    clearInterval(this._clock);
    this._stopDrag?.();
    if (this._before?.isConnected) this._before.focus({ preventScroll: true });
  },
  methods: {
    keyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (this.inspection) this.inspection = null;
        else if (this.quitConfirm) this.quitConfirm = false;
        else this.$emit('close');
        return;
      }
      if (e.key !== 'Tab') return;
      const scope =
          this.$el.querySelector('.draft-inspect-backdrop') || this.$refs.panel,
        items = [
          ...scope.querySelectorAll(
            'button:not(:disabled),select:not(:disabled),summary,[tabindex="0"]'
          ),
        ].filter((el) => el.getClientRects().length);
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const i = items.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && (i === items.length - 1 || i < 0)) {
        e.preventDefault();
        items[0].focus();
      }
    },
    showApplication() {
      if (innerWidth <= 700)
        this.$nextTick(() =>
          this.$refs.application?.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
          })
        );
    },
    send(name, payload = {}) {
      this.$emit('command', name, { id: this.state?.id, ...payload });
    },
    money: (n) => Number(n || 0).toLocaleString('fr-FR'),
    moveName: (n) => localizeMoveName(n, 'fr'),
    cardLabel(c) {
      return c.kind === 'move'
        ? this.moveName(c.move)
        : c.kind === 'ability'
        ? localizeAbilityName(c.ability, 'fr')
        : c.kind === 'nature'
        ? natureLabel(c.nature)
        : c.name;
    },
    inspect(c) {
      this.inspection = c;
    },
    used(c) {
      return !!this.state?.preparation?.used?.includes(c.id);
    },
    choose(c) {
      if (this.busy || this.state.picked) return;
      this.send('pick', {
        cardId: c.id,
        round: this.state.round,
        pick: this.state.pick,
      });
    },
    moveAptitude(p) {
      const candidate = this.moveTargets[p?.cardId];
      const eligible = !!candidate?.compatible && !candidate.known;
      return {
        eligible,
        label: candidate?.known
          ? 'Déjà connue'
          : eligible
          ? '✓ Apte'
          : 'Inapte',
      };
    },
    selectUpgrade(c) {
      if (this.locked) return;
      this.selected = c;
      if (c.kind === 'move') {
        this.selectedPokemon = null;
        this.moveSlot = 0;
        this.$nextTick(() =>
          this.$refs.moveGuidance?.scrollIntoView({
            block: innerWidth <= 700 ? 'start' : 'nearest',
            behavior: 'auto',
          })
        );
      }
      if (c.kind === 'rift')
        this.send('edit', { action: 'rift', cardId: c.id });
      else if (c.kind === 'pokemon') {
        const empty = this.state.preparation.team.findIndex((p) => !p);
        if (empty >= 0) this.place(empty);
      }
    },
    place(slot) {
      if (this.locked) return;
      if (this.selected?.kind === 'pokemon')
        this.send('edit', { action: 'slot', slot, cardId: this.selected.id });
    },
    target(p) {
      if (
        this.locked ||
        (this.selected?.kind === 'move' && !this.moveAptitude(p).eligible)
      )
        return;
      if (this.selected?.kind === 'pokemon' && !this.locked) {
        const slot = this.state.preparation.team.findIndex(
          (q) => q?.cardId === p.cardId
        );
        this.place(slot);
      } else {
        this.selectedPokemon = p.cardId;
        this.moveSlot = 0;
        this.showApplication();
      }
    },
    applySelected() {
      if (
        this.locked ||
        (this.selected?.kind === 'move' &&
          !this.moveAptitude(this.selectedPokemonView).eligible)
      )
        return;
      if (this.selectedPokemon && this.selected)
        this.send('edit', {
          action: 'apply',
          cardId: this.selected.id,
          pokemonId: this.selectedPokemon,
          moveSlot: this.moveSlot,
        });
    },
    drag(event, card) {
      this._stopDrag?.();
      this._stopDrag = startDraftDrag(event, card, (c, where) => {
        if (this.state.phase === 'draft') {
          if (where === 'pick') this.choose(c);
          return;
        }
        const index = Number(where.split(':')[1]);
        if (!Number.isInteger(index)) return;
        const p = this.state.preparation.team[index];
        this.selected = c;
        if (c.kind === 'pokemon') this.place(index);
        else if (c.kind === 'rift')
          this.send('edit', { action: 'rift', cardId: c.id });
        else if (p) {
          if (c.kind === 'move') this.target(p);
          else {
            this.selectedPokemon = p.cardId;
            this.applySelected();
          }
        }
      });
    },
  },
};
</script>
<style scoped>
.draft-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2050;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background: var(--journal-backdrop);
  backdrop-filter: blur(7px);
  box-sizing: border-box;
}
.draft-panel {
  width: min(1260px, 100%);
  height: min(900px, calc(100dvh - 32px));
  max-height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--journal-border);
  border-radius: 16px;
  box-shadow: var(--journal-shadow);
  background: var(--journal-paper);
  color: var(--journal-ink);
  font: 13px/1.5 var(--journal-font);
  position: relative;
  overflow: hidden;
  text-align: left;
}
.draft-panel * {
  box-sizing: border-box;
}
.draft-panel button,
.draft-panel select {
  font: inherit;
  color: inherit;
  cursor: pointer;
  min-height: 38px;
  border: 1px solid var(--journal-border);
  border-radius: 7px;
  background: var(--journal-card);
  padding: 8px 12px;
}
.draft-panel button:disabled {
  opacity: 0.5;
  cursor: default;
}
.draft-panel button:focus-visible,
.draft-panel select:focus-visible,
.draft-panel summary:focus-visible {
  outline: 3px solid var(--journal-accent);
  outline-offset: 2px;
}
.draft-heading {
  display: flex;
  gap: 12px;
  align-items: center;
  flex: none;
  padding: 17px 23px;
  background: var(--journal-soft);
  border-bottom: 1px solid var(--journal-border);
}
.draft-heading > div {
  flex: 1;
  min-width: 0;
}
.draft-heading small,
.draft-round-title small,
.draft-welcome > small,
.draft-bracket > small,
.draft-results > small {
  font-size: 8px;
  letter-spacing: 0.15em;
  color: var(--journal-muted);
}
h2 {
  font: 28px Georgia, serif;
  color: var(--journal-heading);
  margin: 3px 0 0;
}
.draft-emblem {
  font: 44px Georgia, serif;
  color: var(--journal-accent);
  line-height: 1;
  rotate: -8deg;
}
.draft-close {
  border-radius: 50% !important;
  width: 38px;
  padding: 0 !important;
  font-size: 22px !important;
}
.draft-clock {
  background: var(--journal-card);
  border: 1px solid var(--journal-border);
  border-radius: 7px;
  padding: 6px 10px;
  font-size: 19px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.draft-clock.is-urgent {
  color: var(--journal-danger);
  border-color: var(--journal-danger);
}
.draft-error {
  margin: 0;
  padding: 10px 22px;
  color: var(--journal-danger);
  background: var(--journal-card);
  border-bottom: 1px solid var(--journal-border);
  flex: none;
}
.draft-body {
  min-height: 0;
  overflow: auto;
  padding: 22px;
  overscroll-behavior: contain;
}
.draft-primary {
  background: var(--journal-accent) !important;
  color: var(--journal-on-accent) !important;
  border-color: var(--journal-accent) !important;
}
.draft-muted {
  color: var(--journal-muted);
  font-size: 12px;
}
.draft-danger {
  color: var(--journal-danger);
}
.draft-welcome {
  padding: 30px;
  background: linear-gradient(
    115deg,
    var(--journal-selected),
    var(--journal-card)
  );
  border: 1px solid var(--journal-border);
  border-left: 4px solid #b3a06b;
  border-radius: 12px;
  margin-bottom: 22px;
}
.draft-welcome h3 {
  font: 30px/1.2 Georgia, serif;
  max-width: 550px;
  margin: 13px 0;
  color: var(--journal-heading);
}
.draft-welcome p {
  max-width: 600px;
  color: var(--journal-muted);
}
.draft-features {
  display: flex;
  gap: 35px;
  flex-wrap: wrap;
  margin-top: 22px;
}
.draft-features span {
  font-size: 10px;
  color: var(--journal-muted);
}
.draft-features b {
  display: block;
  font-size: 18px;
  color: var(--journal-accent);
}
.draft-new-table {
  display: flex;
  align-items: end;
  gap: 18px;
  padding: 15px 0 25px;
  border-bottom: 1px solid var(--journal-border);
}
.draft-new-table h3 {
  margin: auto auto auto 0;
}
.draft-new-table label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 10px;
}
.draft-existing {
  margin: 20px 0;
}
.draft-existing > button,
.draft-invites > button:not(:first-of-type) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin: 8px 0;
}
.draft-existing small,
.draft-invites small {
  display: block;
  font-size: 10px;
  color: var(--journal-muted);
}
.draft-rules {
  background: var(--journal-soft);
  padding: 14px 18px;
  border: 1px solid var(--journal-border);
  border-radius: 8px;
}
.draft-rules summary {
  font-weight: 600;
  cursor: pointer;
}
.draft-rules p {
  font-size: 12px;
  max-width: 750px;
}
.draft-seats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 23px;
}
.draft-seats article {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: var(--journal-card);
  border: 1px solid var(--journal-border);
  border-radius: 8px;
  min-width: 0;
}
.draft-seats article.is-self {
  border-color: var(--journal-accent);
  background: var(--journal-selected);
}
.draft-seat-number {
  display: grid;
  place-items: center;
  flex: none;
  border: 1px solid var(--journal-border);
  background: var(--journal-soft);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 10px;
}
.draft-seats article > div {
  min-width: 0;
  flex: 1;
}
.draft-seats b {
  font-size: 11px;
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.draft-seats small {
  font-size: 9px;
  display: block;
  color: var(--journal-muted);
}
.draft-pass-arrow {
  font-size: 19px;
  color: var(--journal-accent);
}
.draft-seats article.is-ready .draft-seat-number {
  background: #4e9178;
  color: #fff;
}
.draft-seats article.is-out {
  opacity: 0.6;
}
.draft-lobby {
  max-width: 800px;
  padding: 10px;
  margin: auto;
}
.draft-lobby h3 {
  font: 30px Georgia, serif;
  color: var(--journal-heading);
  margin: 8px 0 15px;
}
.draft-lobby-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 25px 0;
}
.draft-invites {
  border-top: 1px solid var(--journal-border);
  margin-top: 25px;
  padding-top: 12px;
}
.draft-round-title {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 18px;
}
.draft-round-title h3 {
  font: 25px Georgia, serif;
  margin: 5px 0;
  color: var(--journal-heading);
}
.draft-round-title > span {
  white-space: nowrap;
  color: var(--journal-accent);
  font-size: 11px;
}
.draft-pack {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.draft-pack > .draft-card {
  animation: draft-deal 0.4s ease-out both;
  animation-delay: calc(var(--deal-index) * 45ms);
}
.is-rift-pack {
  padding: 14px;
  border: 1px solid #b497ce;
  border-radius: 12px;
  background: linear-gradient(150deg, #a484c51c, transparent);
}
.is-rift-pack > .draft-card {
  animation-name: draft-rift-deal;
}
.draft-pick-zone {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 3px;
  border: 1px dashed var(--journal-accent);
  border-radius: 8px;
  background: var(--journal-selected);
  padding: 15px;
  margin: 20px 0;
}
.draft-pick-zone span {
  font-size: 10px;
  color: var(--journal-muted);
}
.draft-pick-zone.is-picked {
  border-style: solid;
}
.draft-small-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
  gap: 12px;
}
.draft-collection-preview summary {
  cursor: pointer;
  font-weight: 600;
  padding: 10px 0;
}
.draft-collection-preview .draft-small-cards {
  padding-top: 12px;
}
.draft-preparation {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr) 250px;
  gap: 18px;
  align-items: start;
}
.draft-team-area {
  position: sticky;
  top: 0;
}
.draft-team-area h4 {
  display: flex;
  justify-content: space-between;
  margin: 0 0 10px;
}
.draft-team-area h4 small {
  color: var(--journal-muted);
}
.draft-team-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.draft-team-slot {
  position: relative;
  min-height: 136px;
  border: 1px solid var(--journal-border);
  border-radius: 9px;
  background: var(--journal-card);
  min-width: 0;
  overflow: hidden;
}
.draft-team-slot.is-target {
  outline: 2px solid var(--journal-accent);
  outline-offset: -2px;
  background: var(--journal-selected);
}
.draft-move-guidance {
  font-size: 12px;
  line-height: 1.5;
  margin: 0 0 10px;
  color: var(--journal-text);
}
.draft-team-slot.is-apt {
  border-color: #61a68a;
  box-shadow: inset 0 0 0 1px #61a68a55;
}
.draft-team-slot.is-inapt {
  border-style: dashed;
}
.draft-slot-aptitude {
  font-size: 10px;
  font-weight: 700;
  color: var(--journal-muted);
  margin: 3px 0;
}
.is-apt .draft-slot-aptitude {
  color: var(--journal-accent);
}
.draft-slot-face:disabled {
  opacity: 0.65;
  cursor: default;
}
.draft-empty-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 9px !important;
  border: 0 !important;
  background: transparent !important;
  color: var(--journal-muted) !important;
}
.draft-empty-slot span {
  font: 24px Georgia, serif;
  color: var(--journal-accent);
  margin-bottom: 8px;
}
.draft-slot-face {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 4px 4px !important;
  border: 0 !important;
  background: transparent !important;
  border-radius: 0 !important;
  min-width: 0;
}
.draft-slot-face .pokemon-portrait {
  width: 55px;
  height: 53px;
}
.draft-slot-face b {
  font-size: 10px;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.draft-slot-face small {
  font-size: 8px;
  color: var(--journal-muted);
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.draft-slot-face .potential-star {
  position: absolute;
  left: 5px;
  top: 6px;
  width: 15px;
  height: 15px;
}
.draft-slot-remove {
  position: absolute;
  z-index: 1;
  right: 2px;
  top: 2px;
  font-size: 17px !important;
  border: 0 !important;
  padding: 0 !important;
  width: 26px;
  min-height: 26px !important;
  background: transparent !important;
}
.draft-slot-detail {
  font-size: 9px !important;
  min-height: 26px !important;
  padding: 3px !important;
  border: 0 !important;
  border-top: 1px solid var(--journal-border) !important;
  border-radius: 0 !important;
  width: 100%;
}
.draft-active-rift {
  border: 1px solid #b699ce;
  border-radius: 8px;
  background: var(--journal-card);
  padding: 12px;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 11px;
}
.draft-active-rift > small {
  font-size: 8px;
  letter-spacing: 0.1em;
  color: var(--journal-muted);
}
.draft-active-rift p {
  color: var(--journal-muted);
  font-size: 10px;
}
.draft-active-rift > button {
  align-self: start;
  font-size: 10px;
  min-height: 30px;
}
.draft-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.draft-filters button {
  font-size: 10px;
  padding: 5px 8px;
  min-height: 32px;
}
.draft-filters button.is-active {
  background: var(--journal-selected);
  border-color: var(--journal-accent);
}
.draft-filters small {
  opacity: 0.6;
  margin-left: 3px;
}
.draft-application {
  background: var(--journal-soft);
  border: 1px solid var(--journal-border);
  border-radius: 9px;
  padding: 12px;
  min-width: 0;
  position: sticky;
  top: 0;
}
.draft-application h4 {
  margin: 0 0 9px;
}
.draft-application p {
  font-size: 11px;
}
.draft-application label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 11px;
  margin-bottom: 12px;
}
.draft-application select {
  min-width: 0;
  width: 100%;
  font-size: 11px;
}
.draft-application > button {
  font-size: 11px;
  width: 100%;
}
.draft-applied {
  list-style: none;
  padding: 0;
  margin: 16px 0 0;
}
.draft-applied li {
  padding: 8px 0;
  border-bottom: 1px solid var(--journal-border);
  font-size: 11px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.draft-applied button {
  font-size: 9px;
  align-self: start;
  padding: 3px 8px;
  min-height: 28px;
}
.draft-desktop-inspector {
  margin-top: 16px;
  max-height: 440px;
  overflow: auto;
}
.draft-bracket,
.draft-results {
  max-width: 800px;
  margin: 20px auto;
}
.draft-bracket h3,
.draft-results h3 {
  font: 29px Georgia, serif;
  color: var(--journal-heading);
}
.draft-bracket > article {
  background: var(--journal-card);
  border: 1px solid var(--journal-border);
  border-radius: 9px;
  padding: 16px;
  margin: 15px 0;
}
.draft-bracket > article.is-final {
  border-color: #b29a60;
}
.draft-bracket article > small {
  font-size: 9px;
  color: var(--journal-muted);
}
.draft-bracket article > div {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  font-size: 15px;
  padding: 12px 0;
}
.draft-bracket article p {
  margin: 0;
  color: var(--journal-muted);
  font-size: 11px;
}
.is-winner {
  color: var(--journal-accent);
  font-weight: 700;
}
.draft-results > article {
  display: flex;
  align-items: center;
  gap: 15px;
  border: 1px solid var(--journal-border);
  background: var(--journal-card);
  border-radius: 9px;
  padding: 15px;
  margin: 12px 0;
}
.draft-results article.rank-1 {
  border-left: 4px solid #bba161;
}
.draft-results article.rank-2 {
  border-left: 4px solid #97adb9;
}
.draft-results article > strong {
  font: 28px Georgia, serif;
  width: 28px;
  color: var(--journal-accent);
}
.draft-results article > div {
  flex: 1;
  min-width: 0;
}
.draft-results article > div > small {
  display: block;
  font-size: 10px;
  color: var(--journal-muted);
}
.draft-result-team {
  display: flex;
  flex-wrap: wrap;
}
.draft-result-team .pokemon-portrait {
  width: 35px;
  height: 40px;
}
.draft-results article.is-self {
  background: var(--journal-selected);
}
.draft-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
  padding: 12px 22px;
  border-top: 1px solid var(--journal-border);
  flex: none;
  background: var(--journal-soft);
}
.draft-footer small {
  font-size: 10px;
  color: var(--journal-muted);
}
.draft-footer button {
  font-size: 10px;
  white-space: nowrap;
}
.draft-inspect-backdrop {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: var(--journal-backdrop);
}
.draft-inspect-backdrop > .draft-inspector {
  max-width: 480px;
  width: 100%;
  max-height: 100%;
  overflow: auto;
}
.draft-quit-confirm {
  padding: 24px;
  max-width: 430px;
  background: var(--journal-paper);
  border-radius: 12px;
  border: 1px solid var(--journal-border);
}
.draft-quit-confirm button {
  margin-right: 8px;
}
@keyframes draft-deal {
  from {
    opacity: 0;
    transform: translateY(20px) rotate(-3deg);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes draft-rift-deal {
  from {
    opacity: 0;
    transform: scale(0.86);
    filter: brightness(1.7);
  }
  to {
    opacity: 1;
    transform: none;
    filter: none;
  }
}
@media (max-width: 1100px) {
  .draft-preparation {
    grid-template-columns: 220px minmax(0, 1fr);
  }
  .draft-application {
    grid-column: 1/-1;
    position: static;
  }
  .draft-desktop-inspector {
    display: none;
  }
  .draft-pack {
    gap: 10px;
  }
  .draft-round-title h3 {
    font-size: 23px;
  }
}
@media (max-width: 700px) {
  .draft-backdrop {
    padding: 6px;
  }
  .draft-panel {
    height: calc(100dvh - 12px);
    border-radius: 10px;
  }
  .draft-heading {
    padding: 12px;
    gap: 9px;
  }
  h2 {
    font-size: 21px;
  }
  .draft-heading small {
    font-size: 6px;
  }
  .draft-emblem {
    font-size: 32px;
  }
  .draft-clock {
    font-size: 16px;
    padding: 5px 7px;
  }
  .draft-close {
    width: 32px;
    min-height: 32px !important;
  }
  .draft-body {
    padding: 12px;
  }
  .draft-seats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
    margin-bottom: 17px;
  }
  .draft-seats article {
    padding: 7px;
    gap: 6px;
  }
  .draft-seats b {
    font-size: 10px;
  }
  .draft-seats small {
    font-size: 8px;
  }
  .draft-pass-arrow {
    font-size: 14px;
  }
  .draft-seat-number {
    width: 20px;
    height: 20px;
    font-size: 9px;
  }
  .draft-welcome {
    padding: 18px;
  }
  .draft-welcome h3 {
    font-size: 26px;
  }
  .draft-features {
    gap: 18px;
  }
  .draft-new-table {
    flex-wrap: wrap;
    gap: 12px;
  }
  .draft-new-table h3 {
    width: 100%;
    margin: 0;
  }
  .draft-new-table > button {
    flex: 1;
  }
  .draft-pack {
    display: flex;
    gap: 11px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding: 4px 3px 12px;
    overscroll-behavior-x: contain;
    touch-action: pan-x pan-y;
  }
  .draft-pack > .draft-card {
    flex: 0 0 190px;
    scroll-snap-align: center;
  }
  .draft-round-title {
    align-items: start;
    gap: 8px;
    flex-wrap: wrap;
  }
  .draft-round-title h3 {
    font-size: 23px;
  }
  .draft-round-title > span {
    font-size: 10px;
  }
  .draft-preparation {
    display: flex;
    flex-direction: column;
    gap: 17px;
  }
  .draft-team-area,
  .draft-prep-collection,
  .draft-application {
    width: 100%;
    position: static;
  }
  .draft-team-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }
  .draft-team-slot {
    min-height: 125px;
  }
  .draft-slot-face .pokemon-portrait {
    width: 50px;
    height: 45px;
  }
  .draft-active-rift {
    padding: 10px;
    margin-top: 12px;
  }
  .draft-active-rift button {
    min-height: 28px;
  }
  .draft-small-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }
  .draft-application {
    order: 1;
  }
  .draft-prep-collection {
    order: 2;
  }
  .draft-team-area {
    order: 0;
  }
  .draft-filters {
    gap: 5px;
  }
  .draft-filters button {
    font-size: 9px;
    padding: 4px 6px;
  }
  .draft-footer {
    padding: 9px 12px;
    gap: 8px;
  }
  .draft-footer small {
    font-size: 8px;
    max-width: 55%;
  }
  .draft-footer button {
    font-size: 9px;
    padding: 7px 8px;
  }
  .draft-inspect-backdrop {
    padding: 8px;
  }
  .draft-bracket h3,
  .draft-results h3 {
    font-size: 25px;
  }
  .draft-results > article {
    padding: 10px;
    gap: 9px;
  }
  .draft-results article > strong {
    width: 20px;
  }
  .draft-results article > b {
    font-size: 11px;
  }
  .draft-result-team .pokemon-portrait {
    width: 26px;
    height: 31px;
  }
  .draft-pick-zone {
    font-size: 12px;
    padding: 12px;
  }
  .draft-pick-zone span {
    font-size: 9px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .draft-body {
    scroll-behavior: auto;
  }
  .draft-card.is-selected {
    animation: none !important;
  }
  .draft-pack > .draft-card {
    animation: none !important;
  }
}
</style>

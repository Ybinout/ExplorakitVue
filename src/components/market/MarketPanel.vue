<template>
  <div class="market-backdrop" @keydown.stop="keys" @keyup.stop>
    <section
      ref="dialog"
      class="market-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="market-title"
      tabindex="-1"
    >
      <header>
        <span class="market-seal" aria-hidden="true">⚖</span>
        <div>
          <small>LE COMPTOIR DES DRESSEURS</small>
          <h2 id="market-title">Hôtel des ventes</h2>
        </div>
        <strong class="wallet">{{ money(state.money) }} ₽</strong
        ><button :disabled="busy" aria-label="Fermer" @click="$emit('close')">
          ×
        </button>
      </header>
      <nav class="market-tabs">
        <button
          v-for="t in tabs"
          :key="t.key"
          :aria-pressed="tab === t.key"
          @click="changeTab(t.key)"
        >
          {{ t.name }}
        </button>
      </nav>
      <div class="market-layout">
        <aside v-if="tab === 'browse'" aria-label="Catégories">
          <button :aria-pressed="!filters.category" @click="category('')">
            Tout le comptoir</button
          ><button
            v-for="c in state.categories"
            :key="c.key"
            :aria-pressed="filters.category === c.key"
            @click="category(c.key)"
          >
            {{ c.name }}
          </button>
        </aside>
        <main>
          <template v-if="tab !== 'sell'">
            <form class="market-filters" @submit.prevent="load(0)">
              <input
                v-model="filters.search"
                maxlength="80"
                type="search"
                placeholder="Pokémon, objet, talent…"
                aria-label="Rechercher"
              /><select
                v-model="filters.sort"
                aria-label="Trier"
                @change="load(0)"
              >
                <option value="new">Plus récents</option>
                <option value="price">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option></select
              ><button :disabled="busy">Rechercher</button>
              <details>
                <summary>Filtres Pokémon</summary>
                <div class="pokemon-filters">
                  <input
                    v-model.number="filters.minLevel"
                    type="number"
                    min="1"
                    max="9999"
                    placeholder="Niveau min"
                    aria-label="Niveau minimum"
                  /><input
                    v-model.number="filters.maxLevel"
                    type="number"
                    min="1"
                    max="9999"
                    placeholder="Niveau max"
                    aria-label="Niveau maximum"
                  /><select v-model="filters.k" aria-label="Potentiel">
                    <option value="">Tous les potentiels</option>
                    <option v-for="k in 4" :key="k" :value="k">
                      K{{ k }}
                    </option></select
                  ><select v-model="filters.type" aria-label="Type">
                    <option value="">Tous les types</option>
                    <option
                      v-for="(name, type) in types"
                      :key="type"
                      :value="type"
                    >
                      {{ name }}
                    </option></select
                  ><label
                    ><input v-model="filters.shiny" type="checkbox" />
                    Shiny</label
                  >
                </div>
              </details>
            </form>
            <p v-if="!state.listings.length && !busy" class="market-empty">
              {{
                tab === "mine"
                  ? "Tes annonces apparaîtront ici."
                  : "Aucune annonce pour ces critères."
              }}
            </p>
            <div class="market-listings">
              <article
                v-for="l in state.listings"
                :key="l.id"
                :class="{ corrupted: l.category.includes('corrupt') }"
                :data-market-listing="l.id"
              >
                <pokemon-portrait
                  v-if="l.pokemon"
                  :src="$pokemonSprite(l.pokemon)"
                  :alt="l.name"
                /><bag-item-icon
                  v-else
                  :item-key="l.itemKey"
                  :pocket="l.category"
                />
                <div class="listing-info">
                  <small
                    >{{
                      l.kind === "pokemon" ? "Pokémon" : "Lot de " + l.quantity
                    }}
                    · {{ l.seller || "Toi" }}</small
                  >
                  <h3>{{ l.pokemon?.nickname || l.name }}</h3>
                  <span v-if="l.pokemon" class="pokemon-summary"
                    >Niv. {{ l.pokemon.level }}
                    <potential-star :value="l.pokemon.potential" /><span>{{
                      l.pokemon.types.map(typeName).join(" / ")
                    }}</span
                    ><span v-if="l.pokemon.shiny">✦ Shiny</span></span
                  >
                  <p v-else>{{ l.description }}</p>
                  <button
                    v-if="l.pokemon"
                    class="details-button"
                    @click="detail = computerPokemonDetails(l.pokemon)"
                  >
                    Examiner le Pokémon
                  </button>
                </div>
                <div class="listing-action">
                  <strong>{{ money(l.price) }} ₽</strong
                  ><small v-if="l.quantity > 1"
                    >le lot · {{ money(l.price / l.quantity) }} ₽ / unité</small
                  ><button
                    v-if="tab === 'mine' && l.status === 'open'"
                    :disabled="busy"
                    @click="confirm = { kind: 'cancel', listing: l }"
                  >
                    Retirer</button
                  ><span v-else-if="tab === 'mine'" class="listing-status">{{
                    l.status === "sold" ? "Vendu" : "Retiré"
                  }}</span
                  ><button
                    v-else
                    :disabled="
                      busy || l.sellerId === userId || l.price > state.money
                    "
                    @click="confirm = { kind: 'buy', listing: l }"
                  >
                    {{ l.sellerId === userId ? "Ton annonce" : "Acheter" }}
                  </button>
                </div>
              </article>
            </div>
            <div class="market-pages">
              <button
                :disabled="busy || state.page === 0"
                @click="load(state.page - 1)"
              >
                ← Précédent</button
              ><span>Page {{ state.page + 1 }}</span
              ><button
                :disabled="busy || !state.hasMore"
                @click="load(state.page + 1)"
              >
                Suivant →
              </button>
            </div>
          </template>
          <template v-else>
            <p class="market-intro">
              Fixe le prix total de ton annonce. Le bien est conservé au
              comptoir jusqu’à son achat ou son retrait. Les Pokémon achetés ou
              retirés rejoignent le PC. Les objets personnels de l’histoire ne
              sont pas vendables.
            </p>
            <div class="sell-kind">
              <button
                :aria-pressed="sellKind === 'item'"
                @click="
                  sellKind = 'item';
                  selection = null;
                "
              >
                Objets du sac</button
              ><button
                :aria-pressed="sellKind === 'pokemon'"
                @click="
                  sellKind = 'pokemon';
                  selection = null;
                "
              >
                Équipe et PC
              </button>
            </div>
            <input
              v-model="inventorySearch"
              class="inventory-search"
              type="search"
              placeholder="Rechercher dans tes biens…"
              aria-label="Rechercher un bien"
            />
            <label v-if="sellKind === 'item'" class="inventory-location"
              >Catégorie
              <select
                v-model="inventoryCategory"
                aria-label="Catégorie des objets"
              >
                <option value="">Tout le sac</option>
                <option
                  v-for="c in state.categories.filter((c) =>
                    (inventory?.items || []).some((i) => i.category === c.key)
                  )"
                  :key="c.key"
                  :value="c.key"
                >
                  {{ c.name }}
                </option>
              </select></label
            >
            <div v-if="sellKind === 'pokemon'" class="inventory-location">
              <button
                :aria-pressed="source === 'team'"
                @click="source = 'team'"
              >
                Équipe</button
              ><select v-model="source" aria-label="Boîte PC">
                <option value="team">Équipe</option>
                <option
                  v-for="(name, index) in inventory?.boxNames || []"
                  :key="index"
                  :value="'box:' + index"
                >
                  {{ name }}
                </option>
              </select>
            </div>
            <div class="market-inventory">
              <button
                v-for="entry in available.slice(0, visibleCount)"
                :key="entry.uuid || entry.key"
                :class="{
                  selected: selection === (entry.uuid || entry.key),
                  corrupted: entry.corruption,
                }"
                :disabled="busy || !!entry.unavailableReason"
                @click="select(entry)"
              >
                <pokemon-portrait
                  v-if="sellKind === 'pokemon'"
                  :src="$pokemonSprite(entry)"
                  :alt="entry.name"
                /><bag-item-icon
                  v-else
                  :item-key="entry.key"
                  :pocket="entry.category"
                /><span
                  ><b>{{ entry.nickname || entry.speciesName || entry.name }}</b
                  ><small v-if="sellKind === 'pokemon'"
                    >Niv. {{ entry.level }} · K{{ entry.potential }} ·
                    {{ entry.types.map(typeName).join(" / ") }}</small
                  ><small v-else>En réserve : {{ entry.quantity }}</small
                  ><small v-if="entry.unavailableReason" class="unavailable">{{
                    entry.unavailableReason
                  }}</small></span
                >
              </button>
            </div>
            <button
              v-if="available.length > visibleCount"
              :disabled="busy"
              @click="visibleCount += 60"
            >
              Afficher les suivants · {{ available.length - visibleCount }}
            </button>
            <form
              v-if="selectedEntry"
              class="sell-form"
              @submit.prevent="prepareSale"
            >
              <h3>
                {{
                  selectedEntry.nickname ||
                  selectedEntry.speciesName ||
                  selectedEntry.name
                }}
              </h3>
              <label v-if="sellKind === 'item'"
                >Quantité du lot<input
                  v-model.number="quantity"
                  type="number"
                  min="1"
                  :max="Math.min(9999, selectedEntry.quantity)"
                  required /></label
              ><label
                >Prix total du lot en ₽<input
                  v-model.number="price"
                  type="number"
                  min="1"
                  max="9007199254740991"
                  required
              /></label>
              <p>
                Tu recevras exactement <strong>{{ money(price) }} ₽</strong> à
                la vente, même hors connexion.
              </p>
              <button class="market-primary" :disabled="busy">
                Préparer l’annonce
              </button>
            </form>
          </template>
        </main>
      </div>
      <p v-if="notice" class="market-notice" role="status">{{ notice }}</p>
      <p v-if="error" class="market-error" role="alert">{{ error }}</p>
      <div v-if="busy" class="market-loading" role="status">
        Enregistrement auprès du comptoir…
      </div>
      <pokemon-details
        v-back="() => (detail = null)"
        v-if="detail"
        class="market-pokemon-details"
        :pokemon="detail"
        :position="1"
        :total="1"
        :read-only="true"
        context-label="HÔTEL DES VENTES"
        footer-label="Caractéristiques du Pokémon proposé"
        @close="detail = null"
      />
      <div v-if="confirm" class="market-overlay">
        <section class="market-confirm">
          <small>VÉRIFICATION DE L’OPÉRATION</small>
          <h3>
            {{
              confirm.kind === "buy"
                ? "Confirmer cet achat ?"
                : confirm.kind === "cancel"
                ? "Retirer cette annonce ?"
                : "Publier cette annonce ?"
            }}
          </h3>
          <p>
            {{
              confirm.listing?.name ||
              selectedEntry?.name ||
              selectedEntry?.speciesName
            }}
          </p>
          <strong v-if="confirm.kind !== 'cancel'"
            >{{ money(confirm.listing?.price || price) }} ₽</strong
          >
          <p>
            {{
              confirm.kind === "buy"
                ? "Le montant sera débité une seule fois. Le bien rejoindra ton sac ou ton PC."
                : confirm.kind === "cancel"
                ? "Tu récupères le bien dans ton sac ou ton PC."
                : "Le bien quitte ton inventaire et devient disponible à l’achat."
            }}
          </p>
          <div>
            <button
              :disabled="busy"
              @click="
                confirm = null;
                publishRequest = null;
              "
            >
              Annuler</button
            ><button class="market-primary" :disabled="busy" @click="execute">
              {{ busy ? "Enregistrement…" : "Confirmer" }}
            </button>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>
<script>
import PokemonPortrait from "../PokemonPortrait.vue";
import PotentialStar from "../PotentialStar.vue";
import BagItemIcon from "../menu/BagItemIcon.vue";
import PokemonDetails from "../menu/PokemonDetails.vue";
import { computerPokemonDetails } from "@/services/pokemonComputer";
const types = {
  Normal: "Normal",
  Fire: "Feu",
  Water: "Eau",
  Electric: "Électrik",
  Grass: "Plante",
  Ice: "Glace",
  Fighting: "Combat",
  Poison: "Poison",
  Ground: "Sol",
  Flying: "Vol",
  Psychic: "Psy",
  Bug: "Insecte",
  Rock: "Roche",
  Ghost: "Spectre",
  Dragon: "Dragon",
  Dark: "Ténèbres",
  Steel: "Acier",
  Fairy: "Fée",
};
export default {
  components: { PokemonPortrait, PotentialStar, BagItemIcon, PokemonDetails },
  props: { initial: Object, socket: Object, userId: Number },
  data() {
    return {
      state: this.initial,
      tab: "browse",
      tabs: [
        { key: "browse", name: "Acheter" },
        { key: "sell", name: "Déposer une annonce" },
        { key: "mine", name: "Mes ventes" },
      ],
      types,
      stats: {
        hp: "PV",
        attack: "Attaque",
        defense: "Défense",
        specialAttack: "Atq. Spé.",
        specialDefense: "Déf. Spé.",
        speed: "Vitesse",
      },
      filters: {
        category: "",
        search: "",
        sort: "new",
        minLevel: "",
        maxLevel: "",
        k: "",
        type: "",
        shiny: false,
      },
      inventory: null,
      sellKind: "item",
      inventorySearch: "",
      visibleCount: 60,
      inventoryCategory: "",
      source: "team",
      selection: null,
      price: 1000,
      quantity: 1,
      busy: false,
      error: "",
      notice: "",
      detail: null,
      confirm: null,
      publishRequest: null,
    };
  },
  computed: {
    available() {
      if (!this.inventory) return [];
      const source =
        this.sellKind === "item"
          ? this.inventory.items
          : this.source === "team"
          ? this.inventory.team
          : this.inventory.entries
              .filter((e) => e.box === Number(this.source.slice(4)))
              .map((e) => e.pokemon);
      return source.filter(
        (e) =>
          (this.sellKind !== "item" ||
            !this.inventoryCategory ||
            e.category === this.inventoryCategory) &&
          (e.name + " " + e.speciesName)
            .toLocaleLowerCase()
            .includes(this.inventorySearch.toLocaleLowerCase())
      );
    },
    selectedEntry() {
      return this.available.find((e) => (e.uuid || e.key) === this.selection);
    },
  },
  mounted() {
    this.$refs.dialog.focus({ preventScroll: true });
    this._onMarketChange = () => {
      clearTimeout(this._marketRefresh);
      this._marketRefresh = setTimeout(() => {
        if (!this.busy && !this.confirm && !this.detail && this.tab !== "sell")
          this.load(this.state.page || 0);
      }, 300);
    };
    this.socket.on("market:changed", this._onMarketChange);
  },
  beforeDestroy() {
    clearTimeout(this._marketRefresh);
    this.socket.off("market:changed", this._onMarketChange);
  },
  watch: {
    inventorySearch() {
      this.visibleCount = 60;
    },
    inventoryCategory() {
      this.visibleCount = 60;
    },
    source() {
      this.visibleCount = 60;
    },
    sellKind() {
      this.visibleCount = 60;
    },
    confirm(value, old) {
      this.$nextTick(() => {
        if (value) {
          this._confirmFocus = document.activeElement;
          this.$el
            .querySelector(".market-confirm button")
            ?.focus({ preventScroll: true });
        } else if (old && this._confirmFocus?.isConnected)
          this._confirmFocus.focus({ preventScroll: true });
      });
    },
  },
  methods: {
    computerPokemonDetails,
    money(n) {
      return Math.floor(Number(n) || 0).toLocaleString("fr-FR");
    },
    typeName(t) {
      return types[t] || t;
    },
    keys(e) {
      if (this.detail) return;
      if (e.key === "Tab") {
        const scope =
            this.$el.querySelector(".market-confirm") || this.$refs.dialog,
          nodes = [
            ...scope.querySelectorAll(
              "button:not(:disabled),input:not(:disabled),select:not(:disabled)"
            ),
          ].filter((n) => n.getClientRects().length),
          first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
        return;
      }
      if (e.key !== "Escape") return;
      if (this.busy) return;
      if (this.confirm) this.confirm = null;
      else if (this.detail) this.detail = null;
      else this.$emit("close");
    },
    async command(op, data) {
      this.error = "";
      return new Promise((resolve) => {
        this.socket.timeout(12000).emit("market:" + op, data, (error, r) => {
          if (error) {
            this.error =
              "Réponse interrompue. Réessaie : la même confirmation sera utilisée.";
            resolve(null);
          } else if (!r?.success) {
            this.error = r?.message || "Opération indisponible.";
            resolve(null);
          } else resolve(r);
        });
      });
    },
    async load(page = 0) {
      if (this.busy) return;
      this.busy = true;
      try {
        const r = await this.command("browse", {
          ...this.filters,
          page,
          mine: this.tab === "mine",
        });
        if (r) this.state = r;
      } finally {
        this.busy = false;
      }
    },
    category(key) {
      this.filters.category = key;
      this.load(0);
    },
    async changeTab(tab) {
      if (this.busy) return;
      this.tab = tab;
      this.notice = "";
      this.selection = null;
      this.confirm = null;
      this.publishRequest = null;
      if (tab === "sell") {
        this.busy = true;
        try {
          const r = await this.command("inventory", {});
          if (r) this.inventory = r.inventory;
        } finally {
          this.busy = false;
        }
      } else await this.load(0);
    },
    select(e) {
      this.selection = e.uuid || e.key;
      this.quantity = 1;
      this.publishRequest = null;
    },
    prepareSale() {
      if (!this.selectedEntry) return;
      this.publishRequest = {
        requestId: crypto.randomUUID(),
        kind: this.sellKind,
        price: Number(this.price),
        ...(this.sellKind === "pokemon"
          ? { pokemonUuid: this.selectedEntry.uuid }
          : {
              itemKey: this.selectedEntry.key,
              quantity: Number(this.quantity),
            }),
      };
      this.confirm = { kind: "publish" };
    },
    async execute() {
      if (this.busy || !this.confirm) return;
      const op = this.confirm.kind,
        data =
          op === "publish"
            ? this.publishRequest
            : { id: this.confirm.listing.id };
      this.busy = true;
      let r;
      try {
        r = await this.command(op, data);
      } finally {
        this.busy = false;
      }
      if (!r) return;
      this.confirm = null;
      this.publishRequest = null;
      this.notice =
        op === "buy"
          ? "Achat effectué. Le bien est dans ton sac ou ton PC."
          : op === "cancel"
          ? "Annonce retirée. Ton bien a été restitué."
          : "Annonce publiée. Tu seras averti de la vente.";
      this.tab = op === "publish" ? "mine" : this.tab;
      await this.load(this.state.page || 0);
    },
  },
};
</script>
<style scoped>
.market-pokemon-details {
  z-index: 1850;
  box-sizing: border-box;
}
.market-pokemon-details::v-deep .companion-sheet {
  max-height: 100%;
  box-sizing: border-box;
}

.market-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1450;
  display: grid;
  place-items: center;
  padding: 20px;
  background: #071b2bc9;
}
.market-panel {
  width: min(1120px, 100%);
  height: min(850px, 100%);
  max-height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--journal-border);
  border-radius: 18px;
  background: var(--journal-paper);
  color: var(--journal-ink);
  box-shadow: 0 24px 90px #06131d90;
  outline: none;
}
header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  background: var(--journal-soft);
  border-bottom: 1px solid var(--journal-border);
}
header small,
.market-confirm > small {
  font-size: 9px;
  letter-spacing: 0.18em;
}
.market-seal {
  font-size: 30px;
  color: var(--journal-accent);
}
h2 {
  font: 600 27px Georgia, serif;
  margin: 3px 0 0;
}
.wallet {
  margin-left: auto;
  white-space: nowrap;
  font-size: 14px;
}
button,
input,
select {
  font: inherit;
  color: inherit;
  border: 1px solid var(--journal-border);
  background: var(--journal-card);
  border-radius: 8px;
  padding: 10px 12px;
  min-height: 42px;
  box-sizing: border-box;
}
button {
  cursor: pointer;
}
button:disabled {
  opacity: 0.45;
  cursor: default;
}
button[aria-pressed="true"],
button.selected {
  background: var(--journal-selected);
  border-color: var(--journal-accent);
}
button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--journal-accent);
  outline-offset: 2px;
}
header > button {
  font-size: 23px;
}
.market-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--journal-border);
}
.market-tabs button {
  flex: 1;
  font-weight: 600;
  font-size: 13px;
}
.market-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}
aside {
  width: 190px;
  flex: none;
  overflow: auto;
  padding: 14px;
  border-right: 1px solid var(--journal-border);
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: var(--journal-soft);
}
aside button {
  text-align: left;
  font-size: 12px;
  background: transparent;
  flex: none;
}
.market-layout main {
  flex: 1;
  min-width: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 20px;
}
.market-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.market-filters > input {
  flex: 1;
  min-width: 130px;
}
.market-filters > select {
  max-width: 170px;
}
.market-filters details {
  width: 100%;
  font-size: 12px;
  margin: 5px 0 10px;
}
.market-filters summary {
  cursor: pointer;
  padding: 7px 0;
}
.pokemon-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.pokemon-filters input[type="number"] {
  width: 100px;
}
.pokemon-filters label {
  display: flex;
  align-items: center;
  gap: 5px;
}
.market-listings {
  display: grid;
  gap: 10px;
}
.market-listings article {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--journal-border);
  border-radius: 12px;
  background: var(--journal-card);
}
.market-listings article.corrupted,
.market-inventory .corrupted {
  background: #9675c41c;
  border-color: #9472b96e;
}
.market-listings .pokemon-portrait {
  width: 70px;
  height: 70px;
  flex: none;
}
.market-listings .bag-item-icon {
  width: 45px;
  height: 45px;
  flex: none;
}
.listing-info {
  flex: 1;
  min-width: 0;
}
.listing-info small {
  font-size: 10px;
  color: var(--journal-muted);
}
h3 {
  font-size: 15px;
  margin: 4px 0;
  overflow-wrap: anywhere;
}
.listing-info p {
  font-size: 11px;
  line-height: 1.5;
  margin: 6px 0;
  color: var(--journal-muted);
}
.pokemon-summary {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 11px;
}
.listing-action {
  display: grid;
  gap: 6px;
  justify-items: end;
  flex: none;
}
.listing-action > strong {
  font-size: 16px;
}
.listing-action > small {
  font-size: 9px;
  color: var(--journal-muted);
}
.listing-action > button,
.market-primary {
  background: var(--journal-accent);
  color: var(--journal-paper);
  font-weight: 600;
}
.details-button {
  font-size: 10px;
  padding: 4px 0;
  border: 0;
  min-height: 30px;
  background: transparent;
  text-decoration: underline;
  color: var(--journal-accent);
}
.market-pages {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px 0 0;
  font-size: 12px;
}
.market-empty {
  padding: 40px 10px;
  text-align: center;
  color: var(--journal-muted);
  font-size: 13px;
}
.market-intro {
  font-size: 13px;
  line-height: 1.7;
  margin: 0 0 16px;
}
.sell-kind,
.inventory-location {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.inventory-search {
  width: 100%;
  margin-bottom: 12px;
}
.market-inventory {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  max-height: 310px;
  overflow: auto;
  padding: 3px;
}
.market-inventory button {
  display: flex;
  align-items: center;
  text-align: left;
  gap: 8px;
  min-width: 0;
}
.market-inventory .pokemon-portrait {
  width: 46px;
  flex: none;
}
.market-inventory .bag-item-icon {
  width: 35px;
  height: 35px;
  flex: none;
}
.market-inventory span {
  min-width: 0;
}
.market-inventory b {
  font-size: 12px;
  overflow-wrap: anywhere;
}
.market-inventory small {
  display: block;
  font-size: 10px;
  margin-top: 4px;
  line-height: 1.4;
}
.unavailable {
  color: #b76d68;
}
.sell-form {
  margin-top: 20px;
  padding: 16px;
  border: 1px solid var(--journal-border);
  background: var(--journal-soft);
  border-radius: 12px;
  display: flex;
  gap: 12px;
  align-items: end;
  flex-wrap: wrap;
}
.sell-form h3,
.sell-form p {
  width: 100%;
  margin: 0;
}
.sell-form label {
  font-size: 12px;
  display: grid;
  gap: 7px;
  flex: 1;
}
.sell-form input {
  width: 100%;
}
.sell-form p {
  font-size: 12px;
  line-height: 1.6;
}
.market-error,
.market-notice {
  margin: 0;
  padding: 12px 24px;
  font-size: 12px;
  line-height: 1.5;
}
.market-error {
  background: #ca72721f;
  color: #c07870;
}
.market-notice {
  background: #78a69b24;
}
.market-loading {
  font-size: 11px;
  text-align: center;
  padding: 7px;
  background: var(--journal-soft);
}
.market-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: #091b31c9;
  display: grid;
  place-items: center;
  padding: 20px;
  overflow: auto;
}
.market-confirm,
.market-detail {
  position: relative;
  width: min(540px, 100%);
  max-height: 100%;
  overflow: auto;
  box-sizing: border-box;
  padding: 24px;
  border: 1px solid var(--journal-border);
  background: var(--journal-paper);
  border-radius: 14px;
  box-shadow: 0 20px 70px #06131d80;
}
.market-confirm h3 {
  font: 600 24px Georgia, serif;
  margin: 12px 0;
}
.market-confirm p {
  font-size: 13px;
  line-height: 1.6;
}
.market-confirm > strong {
  font-size: 23px;
}
.market-confirm > div {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.market-confirm button {
  flex: 1;
}
.market-detail > .pokemon-portrait {
  width: 100px;
  height: 100px;
  margin: auto;
}
.market-detail p,
.market-detail li,
.market-detail dl {
  font-size: 12px;
  line-height: 1.6;
}
.market-detail dl {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.market-detail dd {
  margin: 0;
}
.detail-close {
  position: absolute;
  right: 12px;
  top: 12px;
}
.market-detail ul {
  padding-left: 18px;
}
.listing-status {
  font-size: 12px;
  color: var(--journal-muted);
}
@media (max-width: 700px) {
  .market-backdrop {
    padding: 7px;
  }
  .market-panel {
    height: 100%;
    max-height: 100%;
    border-radius: 13px;
  }
  header {
    padding: 12px;
    gap: 8px;
  }
  header small {
    font-size: 7px;
  }
  h2 {
    font-size: 20px;
  }
  .market-seal {
    font-size: 23px;
  }
  .wallet {
    font-size: 11px;
  }
  .market-tabs {
    padding: 9px;
    gap: 5px;
  }
  .market-tabs button {
    padding: 9px 5px;
    font-size: 11px;
  }
  .market-layout {
    flex-direction: column;
  }
  aside {
    width: auto;
    flex-direction: row;
    overflow: auto;
    max-height: 70px;
    padding: 9px;
    border-right: 0;
    border-bottom: 1px solid var(--journal-border);
  }
  aside button {
    white-space: nowrap;
    font-size: 11px;
    min-height: 38px;
  }
  .market-layout main {
    padding: 12px;
  }
  .market-filters > select {
    max-width: 135px;
    font-size: 11px;
  }
  .market-filters > button {
    font-size: 11px;
  }
  .market-listings article {
    padding: 10px;
    gap: 7px;
    flex-wrap: wrap;
  }
  .market-listings .pokemon-portrait {
    width: 52px;
    height: 52px;
  }
  .listing-action {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid var(--journal-border);
    padding-top: 8px;
  }
  .listing-action > button {
    min-width: 100px;
  }
  .market-inventory {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-height: 310px;
  }
  .market-inventory button {
    padding: 8px;
  }
  .market-inventory .pokemon-portrait {
    width: 38px;
  }
  .sell-form {
    padding: 12px;
  }
  .market-overlay {
    padding: 10px;
  }
  .market-confirm,
  .market-detail {
    padding: 18px;
  }
  .market-detail dl {
    font-size: 11px;
  }
  .market-pages {
    gap: 6px;
  }
  .market-pages button {
    font-size: 11px;
  }
  .market-notice,
  .market-error {
    padding: 10px 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
</style>

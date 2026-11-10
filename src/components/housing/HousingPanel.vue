<template>
  <berry-garden-panel v-if="['garden','mutator'].includes(payload.kind)" :payload="payload" :busy="busy" :error="error" :command="command" @close="$emit('close')"/>
  <div v-else class="housing-backdrop" @keydown.stop="keyDown" @keyup.stop>
    <section
      ref="dialog"
      tabindex="-1"
      class="housing-panel"
      :class="{'is-editor':tab==='editor'&&payload.kind==='manage'}"
      role="dialog"
      aria-modal="true"
      aria-labelledby="housing-title"
      data-housing-panel
    >
      <header>
        <span class="house-emblem" aria-hidden="true">⌂</span>
        <div>
          <small>{{
            payload.kind === 'shop'
              ? 'GRAND COMPTOIR · MEUBLES & DÉCORATION'
              : payload.kind === 'purchase'
              ? 'UN NOUVEAU CHEZ-TOI'
              : 'MA MAISON · ' + floorLabel
          }}</small>
          <h2 id="housing-title">
            {{
              payload.kind === 'shop'
                ? 'Trouve ta place.'
                : payload.kind === 'purchase'
                ? payload.entry.name
                : 'Un intérieur à ton image'
            }}
          </h2>
        </div>
        <span class="house-wallet">{{ money(payload.money) }} ₽</span
        ><button :disabled="busy" aria-label="Fermer" @click="close">×</button>
      </header>
      <nav
        v-if="payload.kind === 'manage'"
        class="housing-tabs"
        role="tablist"
        aria-label="Gestion de la maison"
      >
        <button
          v-for="t in tabs"
          :key="t.key"
          role="tab"
          :aria-selected="tab === t.key"
          @click="switchTab(t.key)"
        >
          <span aria-hidden="true">{{ t.icon }}</span
          >{{ t.name }}
        </button>
      </nav>
      <div class="housing-body" :class="{'is-editor':tab==='editor'&&payload.kind==='manage'}">
        <template v-if="payload.kind === 'purchase'">
          <div v-if="home.entryKey" class="house-already-owned">
            <h3>Tu as déjà un chez-toi.</h3>
            <p>
              Chaque dresseur peut posséder une maison. Tes meubles et tes
              étages t’attendent à ton adresse habituelle.
            </p>
          </div>
          <template v-else
            ><p class="house-intro">
              Choisis le volume qui te ressemble. Tu pourras ajouter deux
              étages, chacun avec son propre modèle. L’intérieur sera
              entièrement vide au départ et réservé à toi et à tes invités.
            </p>
            <div class="house-models">
              <button
                v-for="m in models"
                :key="m.key"
                :aria-pressed="model === m.key"
                :disabled="busy || !!pending"
                @click="model = m.key"
              >
                <housing-model-preview :model-key="m.key" /><span
                  ><b>{{ m.name }}</b
                  ><small>{{ area(m) }} cases · {{ m.w }} × {{ m.h }}</small
                  ><strong>{{ money(m.price) }} ₽</strong></span
                >
              </button>
            </div></template
          >
        </template>
        <template v-else-if="payload.kind === 'shop'">
          <p class="house-intro">
            Les achats rejoignent ta bibliothèque de Housing, même avant ta
            première maison. Déplacer ou ranger un meuble ne le consomme pas.
          </p>
          <div class="house-shop-tools">
            <input
              v-model="query"
              type="search"
              placeholder="Un meuble, une plante…"
              aria-label="Chercher un meuble"
            /><select v-model="category" aria-label="Catégorie de meubles">
              <option value="">Tous les meubles</option>
              <option v-for="(name, key) in categories" :key="key" :value="key">
                {{ name }}
              </option>
            </select>
          </div>
          <div class="housing-shop">
            <article v-for="item in furniture" :key="item.key">
              <housing-item-icon :item-key="item.key" />
              <div>
                <small>{{ categories[item.category] }}</small>
                <h3>{{ item.name }}</h3>
                <p>
                  {{ item.w }} × {{ item.h }} case{{
                    item.w * item.h > 1 ? 's' : ''
                  }}
                  · {{ item.solid ? 'Meuble' : 'Traversable' }}
                </p>
                <small
                  >{{ home.inventory[item.key] || 0 }} possédé{{
                    (home.inventory[item.key] || 0) > 1 ? 's' : ''
                  }}</small
                >
              </div>
              <div class="furniture-buy">
                <label
                  ><span class="sr-only">Quantité</span
                  ><select
                    v-model.number="quantities[item.key]"
                    :disabled="busy || !!pending"
                  >
                    <option v-for="q in [1, 5, 10]" :key="q" :value="q">
                      × {{ q }}
                    </option>
                  </select></label
                ><button
                  :disabled="
                    busy ||
                    !!pending ||
                    payload.money < item.price * quantity(item) ||
                    99 - (home.inventory[item.key] || 0) < quantity(item)
                  "
                  @click="buyFurniture(item)"
                >
                  {{ money(item.price * quantity(item)) }} ₽<small
                    >Acheter</small
                  >
                </button>
              </div>
            </article>
          </div>
        </template>
        <template v-else-if="tab === 'editor'">
          <housing-editor
            ref="editor"
            :home="home"
            :floor="payload.floor || 0"
            :locked="busy || !!pending"
            @dirty="dirty = $event"
          />
        </template>
        <template v-else-if="tab === 'floors'">
          <section class="house-levels">
            <h3>Une maison, trois niveaux au maximum.</h3>
            <p>
              Chaque étage possède son modèle et ses dix emplacements de
              meubles. Les escaliers sont inclus, et peuvent être déplacés dans
              l’éditeur.
            </p>
            <ol>
              <li v-for="(f, i) in home.floors" :key="i">
                <span>{{ i === 0 ? 'RDC' : i }}</span>
                <div>
                  <b>{{ models.find((m) => m.key === f.model).name }}</b
                  ><small
                    >{{
                      i === 0
                        ? 'Rez-de-chaussée'
                        : i === 1
                        ? 'Premier étage'
                        : 'Deuxième étage'
                    }}
                    · {{ f.placements.length }} / 20 meubles</small
                  >
                </div>
                <i v-if="i === (payload.floor || 0)">Tu es ici</i>
              </li>
            </ol>
          </section>
          <template v-if="home.floors.length < 3"
            ><h3 class="house-section-title">Choisir le prochain étage</h3>
            <div class="house-models">
              <button
                v-for="m in models"
                :key="m.key"
                :aria-pressed="model === m.key"
                :disabled="busy || !!pending"
                @click="model = m.key"
              >
                <housing-model-preview :model-key="m.key" /><span
                  ><b>{{ m.name }}</b
                  ><small>{{ area(m) }} cases</small
                  ><strong>{{ money(m.price) }} ₽</strong></span
                >
              </button>
            </div></template
          >
        </template>
        <template v-else-if="tab === 'settings'">
          <section class="house-sale" data-housing-sale>
            <small>PARAMÈTRES · PROPRIÉTÉ</small>
            <h3>Un nouveau départ.</h3>
            <p>
              Revendre cette maison te rend 80 % du total payé pour la maison
              et ses étages. La maison et ses étages sont retirés ; tous tes
              meubles, PC et équipements restent dans ton stockage Housing pour
              ta prochaine maison.
            </p>
            <div class="house-sale-amount">
              <span>Montant reversé</span
              ><strong>{{ money(salePrice) }} ₽</strong>
            </div>
            <p>
              Les visiteurs repartent à leur point d’origine. L’adresse
              disparaît de ta minimap.
            </p>
            <button
              v-if="!saleConfirm"
              :disabled="busy || !!pending"
              @click="saleConfirm = true"
            >
              Revendre ma maison
            </button>
            <div
              v-else
              class="house-sale-confirm"
              role="alertdialog"
              aria-labelledby="house-sale-title"
              data-housing-sale-confirm
            >
              <h3 id="house-sale-title">Confirmer la revente ?</h3>
              <p>
                Tu recevras <b>{{ money(salePrice) }} ₽</b>. Tous tes meubles et
                équipements sont conservés, même ceux actuellement posés.
              </p>
              <div>
                <button
                  :disabled="busy || !!pending"
                  @click="saleConfirm = false"
                >
                  Garder ma maison</button
                ><button
                  class="house-primary"
                  :disabled="busy || !!pending"
                  @click="paid('sell', { refund: salePrice })"
                >
                  Confirmer · {{ money(salePrice) }} ₽
                </button>
              </div>
            </div>
          </section>
        </template>
        <template v-else>
          <div class="house-invite-intro">
            <h3>La porte est ouverte à tes amis.</h3>
            <p>
              Ils pourront visiter tous les étages et repartir à l’endroit où
              ils étaient avant la visite. L’aménagement reste entre tes mains.
            </p>
          </div>
          <div class="house-friends">
            <article v-for="f in friends" :key="f.id">
              <span class="friend-status" :class="{ online: f.online }">●</span>
              <div>
                <b>{{ f.username || f.name }}</b
                ><small>{{ f.online ? 'En ligne' : 'Hors ligne' }}</small>
              </div>
              <button
                :disabled="busy || !f.online"
                @click="command('invite', { userId: f.id })"
              >
                Inviter
              </button>
            </article>
            <p v-if="!friends.length">
              Ajoute des amis dans le menu Amis pour les inviter chez toi.
            </p>
          </div>
        </template>
      </div>
      <p v-if="error" class="house-error" role="alert">{{ error }}</p>
      <p v-if="notice" class="house-notice" role="status">{{ notice }}</p>
      <footer>
        <template v-if="pending"
          ><span
            >Une confirmation est en attente. Réessaie pour vérifier son
            enregistrement.</span
          ><button :disabled="busy" @click="retry">
            Vérifier la confirmation</button
          ><button :disabled="busy" @click="reload">Recharger</button></template
        >
        <template v-else-if="payload.kind === 'purchase' && !home.entryKey"
          ><span
            >Une seule maison par dresseur · étage ajouté au prix de son
            modèle</span
          ><button
            class="house-primary"
            :disabled="busy || payload.money < chosen.price"
            @click="paid('purchase', { entryKey: payload.entry.key, model })"
          >
            Acheter {{ chosen.name }} · {{ money(chosen.price) }} ₽ →
          </button></template
        >
        <template v-else-if="payload.kind === 'manage' && tab === 'editor'"
          ><span>{{
            dirty
              ? 'Les changements ne sont pas encore enregistrés.'
              : 'Aménagement enregistré.'
          }}</span
          ><button :disabled="busy || !dirty" @click="resetEditor">
            Annuler les changements</button
          ><button
            class="house-primary"
            :disabled="busy || !dirty"
            @click="save"
          >
            Sauvegarder →
          </button></template
        >
        <template
          v-else-if="
            payload.kind === 'manage' &&
            tab === 'floors' &&
            home.floors.length < 3
          "
          ><span>Le nouvel escalier reliera ton dernier étage à celui-ci.</span
          ><button
            class="house-primary"
            :disabled="busy || payload.money < chosen.price"
            @click="paid('floor', { model })"
          >
            Ajouter {{ chosen.name }} · {{ money(chosen.price) }} ₽ →
          </button></template
        >
        <template v-else
          ><span>{{
            payload.kind === 'shop'
              ? 'Les meubles restent dans ton inventaire de Housing.'
              : 'Tes visiteurs ne peuvent pas modifier la maison.'
          }}</span
          ><button @click="close">Retour</button></template
        >
      </footer>
    </section>
  </div>
</template>
<script>
import { housingModels, housingItems } from '@/services/housingArt';
import HousingEditor from './HousingEditor.vue';
import BerryGardenPanel from './BerryGardenPanel.vue';
import HousingItemIcon from './HousingItemIcon.vue';
import HousingModelPreview from './HousingModelPreview.vue';
const categories = {
  tables: 'Tables et bureaux',
  assises: 'Chaises et canapés',
  repos: 'Lits',
  rangement: 'Rangement',
  decoration: 'Décoration',
  tapis: 'Tapis',
  lumieres: 'Lumières',
  equipements: 'Équipements Pokémon',
  plantes: 'Plantes',
  cultures: 'Culture et mutation',
};
export default {
  components: { BerryGardenPanel, HousingEditor, HousingItemIcon, HousingModelPreview },
  props: {
    payload: Object,
    room: Object,
    friends: { type: Array, default: () => [] },
    busy: Boolean,
    error: String,
    notice: String,
    command: Function,
  },
  data: () => ({
    tab: 'editor',
    saleConfirm: false,
    model: 'nid',
    query: '',
    category: '',
    quantities: Object.fromEntries(housingItems.map((i) => [i.key, 1])),
    dirty: false,
    pending: null,
  }),
  computed: {
    home() {
      return this.payload.home;
    },
    models: () => housingModels,
    categories: () => categories,
    chosen() {
      return housingModels.find((m) => m.key === this.model);
    },
    tabs: () => [
      { key: 'editor', name: 'Aménager', icon: '▦' },
      { key: 'floors', name: 'Étages', icon: '↗' },
      { key: 'friends', name: 'Inviter', icon: '♧' },
      { key: 'settings', name: 'Paramètres', icon: '⚙' },
    ],
    salePrice() {
      const total = this.home.floors.reduce(
        (sum, f) =>
          sum +
          (f.purchasePrice ?? this.models.find((m) => m.key === f.model).price),
        0
      );
      return Math.floor(total * 0.8);
    },
    floorLabel() {
      return (this.payload.floor || 0) === 0
        ? 'REZ-DE-CHAUSSÉE'
        : this.payload.floor === 1
        ? '1ER ÉTAGE'
        : '2E ÉTAGE';
    },
    furniture() {
      return housingItems.filter(
        (i) =>
          (!this.category || i.category === this.category) &&
          i.name.toLocaleLowerCase().includes(this.query.toLocaleLowerCase())
      );
    },
  },
  mounted() {
    this._before = document.activeElement;
    this.$refs.dialog?.focus({ preventScroll: true });
  },
  beforeDestroy() {
    this._before?.isConnected && this._before.focus({ preventScroll: true });
  },
  methods: {
    money: (n) => Number(n || 0).toLocaleString('fr-FR'),
    area: (m) => m.w * m.h - (m.cutout ? m.cutout.w * m.cutout.h : 0),
    quantity(i) {
      return this.quantities[i.key] || 1;
    },
    close() {
      if (this.busy) return;
      if (
        this.dirty &&
        !window.confirm('Fermer sans sauvegarder cet aménagement ?')
      )
        return;
      this.$emit('close');
    },
    switchTab(t) {
      if (this.dirty && !window.confirm('Changer d’onglet sans sauvegarder ?'))
        return;
      this.dirty = false;
      this.tab = t;
    },
    resetEditor() {
      this.$refs.editor?.reset();
      this.dirty = false;
    },
    async paid(name, data) {
      this.pending = {
        name,
        data: {
          ...data,
          revision: this.home.revision,
          requestId: crypto.randomUUID(),
        },
      };
      await this.retry();
    },
    async retry() {
      if (!this.pending) return;
      const p = this.pending,
        r = await this.command(p.name, p.data);
      if (r?.success) {
        this.pending = null;
        this.dirty = false;
      }
    },
    async reload() {
      const r = await this.command(
        this.payload.kind === 'shop' ? 'shop' : 'open'
      );
      if (r?.success) {
        this.pending = null;
        this.dirty = false;
        this.$refs.editor?.reset();
      }
    },
    save() {
      const floor = this.payload.floor || 0;
      this.paid('save', {
        floor,
        layout: JSON.parse(JSON.stringify(this.$refs.editor.draft)),
      });
    },
    buyFurniture(item) {
      this.paid('furniture', { key: item.key, quantity: this.quantity(item) });
    },
    keyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
        return;
      }
      if (e.key !== 'Tab') return;
      const els = [
        ...this.$refs.dialog.querySelectorAll(
          'button:not(:disabled),input,select,canvas[tabindex]'
        ),
      ].filter((el) => el.getClientRects().length);
      if (!els.length) return;
      const i = els.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        els.at(-1).focus();
      } else if (!e.shiftKey && i === els.length - 1) {
        e.preventDefault();
        els[0].focus();
      }
    },
  },
};
</script>
<style scoped>
.housing-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2600;
  background: #071722a6;
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  font-family: var(--journal-font);
  color: var(--journal-ink);
}
.housing-panel {
  display: flex;
  flex-direction: column;
  width: min(1120px, 100%);
  max-height: calc(100dvh - 28px);
  background: var(--journal-paper);
  border: 1px solid var(--journal-border);
  border-radius: 17px;
  box-shadow: var(--journal-shadow);
  overflow: hidden;
}
.housing-panel > header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 25px;
  border-bottom: 1px solid var(--journal-border);
  background: var(--journal-card);
  flex: none;
}
.house-emblem {
  display: grid;
  place-items: center;
  width: 45px;
  height: 45px;
  border: 1px solid var(--journal-border);
  border-radius: 11px;
  background: var(--journal-selected);
  color: var(--journal-accent);
  font-size: 33px;
  flex: none;
}
header > div {
  flex: 1;
  min-width: 0;
}
header small {
  font-size: 9px;
  letter-spacing: 0.13em;
  color: var(--journal-muted);
}
h2 {
  font-size: 26px;
  line-height: 1.2;
  margin: 5px 0;
  color: var(--journal-heading);
}
.house-wallet {
  font-size: 13px;
  font-weight: bold;
  white-space: nowrap;
  color: var(--journal-heading);
}
button,
select,
input {
  font: inherit;
}
button {
  border: 1px solid var(--journal-border);
  border-radius: 8px;
  padding: 10px 14px;
  background: var(--journal-card);
  color: var(--journal-ink);
  cursor: pointer;
}
header > button {
  font-size: 23px;
  padding: 5px;
  width: 38px;
  height: 38px;
  flex: none;
}
button:disabled {
  opacity: 0.45;
  cursor: default;
}
.house-sale {
  max-width: 650px;
  margin: auto;
}
.house-sale > small {
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--journal-muted);
}
.house-sale h3 {
  font-size: 23px;
  margin: 10px 0;
}
.house-sale p {
  font-size: 13px;
  line-height: 1.8;
  color: var(--journal-muted);
}
.house-sale-amount {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px;
  border: 1px solid var(--journal-border);
  border-radius: 10px;
  background: var(--journal-selected);
}
.house-sale-amount strong {
  font-size: 26px;
  color: var(--journal-heading);
}
.house-sale-amount span {
  font-size: 12px;
}
.house-sale-confirm {
  border: 1px solid var(--journal-accent);
  padding: 18px;
  border-radius: 12px;
  margin-top: 18px;
  background: var(--journal-card);
}
.house-sale-confirm > div {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.house-primary {
  background: var(--journal-accent);
  color: var(--journal-on-accent);
}
.housing-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 25px;
  border-bottom: 1px solid var(--journal-border);
  flex: none;
}
.housing-tabs button {
  flex: 1;
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  min-height: 42px;
  font-size: 12px;
}
.housing-tabs [aria-selected='true'] {
  background: var(--journal-selected);
  border-color: var(--journal-accent);
  color: var(--journal-heading);
  font-weight: 700;
}
.housing-body {
  overflow: auto;
  overscroll-behavior: contain;
  padding: 22px 25px;
  min-height: 0;
}
.house-intro {
  font-size: 13px;
  line-height: 1.7;
  color: var(--journal-muted);
  max-width: 760px;
  margin: 0 0 20px;
}
.house-models {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 13px;
}
.house-models > button {
  padding: 9px;
  text-align: left;
  min-width: 0;
}
.house-models > button[aria-pressed='true'] {
  border-color: var(--journal-accent);
  background: var(--journal-selected);
  box-shadow: inset 0 -2px var(--journal-accent);
}
.house-models > button > span {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px 3px 5px;
}
.house-models b {
  font-size: 14px;
}
.house-models small {
  font-size: 10px;
  color: var(--journal-muted);
}
.house-models strong {
  font-size: 13px;
  color: var(--journal-heading);
}
.house-shop-tools {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
}
.house-shop-tools input {
  flex: 1;
  min-width: 0;
}
.house-shop-tools select {
  max-width: 45%;
}
input,
select {
  border: 1px solid var(--journal-border);
  border-radius: 8px;
  padding: 10px;
  background: var(--journal-card);
  color: var(--journal-ink);
  box-sizing: border-box;
}
.housing-shop {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.housing-shop article {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 14px;
  border: 1px solid var(--journal-border);
  border-radius: 10px;
  background: var(--journal-card);
}
.housing-shop article > div:nth-child(2) {
  min-width: 0;
  flex: 1;
}
.housing-shop h3 {
  font-size: 14px;
  margin: 4px 0;
}
.housing-shop small {
  font-size: 9px;
  color: var(--journal-muted);
}
.housing-shop p {
  font-size: 10px;
  line-height: 1.5;
  color: var(--journal-muted);
  margin: 5px 0;
}
.furniture-buy {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 95px;
  flex: none;
}
.furniture-buy select {
  width: 100%;
  padding: 6px;
  font-size: 11px;
}
.furniture-buy button {
  background: var(--journal-accent);
  color: var(--journal-on-accent);
  padding: 8px 5px;
  font-size: 11px;
  font-weight: bold;
}
.furniture-buy button small {
  display: block;
  color: inherit;
  opacity: 0.8;
  font-size: 9px;
  margin-top: 3px;
}
.house-levels h3,
.house-section-title {
  font-size: 17px;
  margin: 0 0 8px;
}
.house-levels p,
.house-invite-intro p {
  font-size: 12px;
  line-height: 1.7;
  color: var(--journal-muted);
  margin-bottom: 18px;
}
.house-levels ol {
  padding: 0;
  list-style: none;
  display: flex;
  gap: 10px;
  margin: 18px 0 24px;
}
.house-levels li {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--journal-border);
  border-radius: 10px;
  padding: 15px;
  background: var(--journal-card);
  position: relative;
}
.house-levels li > span {
  font-size: 24px;
  color: var(--journal-accent);
  font-weight: bold;
}
.house-levels li small {
  display: block;
  font-size: 10px;
  color: var(--journal-muted);
  margin-top: 5px;
}
.house-levels li b {
  font-size: 13px;
}
.house-levels i {
  font-style: normal;
  font-size: 8px;
  position: absolute;
  top: 5px;
  right: 7px;
  color: var(--journal-accent);
}
.house-section-title {
  margin-top: 20px;
}
.house-invite-intro h3 {
  font-size: 19px;
  margin-top: 0;
}
.house-friends {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.house-friends article {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  border: 1px solid var(--journal-border);
  border-radius: 10px;
  background: var(--journal-card);
}
.house-friends article > div {
  flex: 1;
}
.house-friends b {
  font-size: 13px;
}
.house-friends small {
  display: block;
  font-size: 10px;
  color: var(--journal-muted);
  margin-top: 4px;
}
.house-friends button {
  font-size: 12px;
}
.friend-status {
  color: #80909b;
}
.friend-status.online {
  color: #58a47a;
}
.house-error,
.house-notice {
  font-size: 12px;
  line-height: 1.5;
  padding: 10px 25px;
  margin: 0;
  border-top: 1px solid var(--journal-border);
  background: var(--journal-soft);
  flex: none;
}
.house-error {
  color: #bf5552;
}
.house-notice {
  color: var(--journal-accent);
}
footer {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 16px 25px;
  border-top: 1px solid var(--journal-border);
  flex: none;
  flex-wrap: wrap;
  background: var(--journal-paper);
}
footer > span {
  flex: 1;
  min-width: 150px;
  font-size: 11px;
  color: var(--journal-muted);
  line-height: 1.5;
}
footer button {
  font-size: 12px;
  min-height: 41px;
}
footer .house-primary {
  background: var(--journal-accent);
  color: var(--journal-on-accent);
  font-weight: bold;
}
.house-already-owned p {
  font-size: 13px;
  line-height: 1.7;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  clip: rect(0, 0, 0, 0);
  overflow: hidden;
}
@media (max-width: 700px) {
  .housing-backdrop {
    padding: 6px;
  }
  .housing-panel {
    max-height: calc(100dvh - 12px);
    border-radius: 13px;
  }
  .housing-panel > header {
    padding: 14px;
    gap: 8px;
    flex-wrap: wrap;
  }
  .house-emblem {
    width: 34px;
    height: 34px;
    font-size: 27px;
  }
  header small {
    font-size: 8px;
  }
  h2 {
    font-size: 19px;
  }
  .house-wallet {
    font-size: 11px;
    order: 3;
    margin-left: 43px;
    flex-basis: 100%;
  }
  header > button {
    width: 33px;
    height: 33px;
  }
  .housing-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 9px 12px;
    gap: 5px;
  }
  .housing-tabs button {
    font-size: 11px;
    padding: 8px 6px;
    min-height: 39px;
  }
  .housing-body {
    padding: 14px;
  }
  .house-models {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .house-models > button {
    padding: 6px;
  }
  .house-models b {
    font-size: 12px;
  }
  .house-models strong {
    font-size: 11px;
  }
  .housing-shop {
    grid-template-columns: minmax(0, 1fr);
  }
  .housing-shop article {
    padding: 10px;
    gap: 8px;
  }
  .house-shop-tools {
    gap: 7px;
  }
  .house-shop-tools select {
    font-size: 11px;
    max-width: 45%;
  }
  input {
    font-size: 12px;
  }
  .house-levels ol {
    flex-direction: column;
  }
  .house-levels li {
    padding: 12px;
  }
  footer {
    padding: 12px;
    gap: 6px;
  }
  footer > span {
    flex-basis: 100%;
    font-size: 10px;
  }
  footer button {
    flex: 1;
    font-size: 11px;
    padding: 10px 8px;
  }
  .house-error,
  .house-notice {
    padding: 9px 13px;
    font-size: 11px;
  }
  .house-intro {
    font-size: 12px;
  }
}
@media (min-width: 701px) and (max-height: 700px) {
  .housing-panel > header {
    padding: 12px 20px;
  }
  h2 {
    font-size: 22px;
  }
  .housing-tabs {
    padding: 8px 20px;
  }
  .housing-body {
    padding: 15px 20px;
  }
  footer {
    padding: 10px 20px;
  }
  .house-models {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.housing-panel.is-editor{height:min(900px,calc(100dvh - 28px))}.housing-body.is-editor{flex:1;display:flex;flex-direction:column;overflow:hidden;padding:14px 20px}.housing-body.is-editor>.housing-editor{flex:1}
@media(max-width:700px){.housing-panel.is-editor{height:calc(100dvh - 12px)}.housing-body.is-editor{padding:9px}.housing-panel.is-editor>header{padding:10px 12px}.housing-panel.is-editor .housing-tabs{display:flex;flex-wrap:nowrap;overflow-x:auto;padding:6px 9px}.housing-panel.is-editor .housing-tabs button{flex:none;min-height:37px}.housing-panel.is-editor footer{padding:8px 10px}.housing-panel.is-editor footer>span{display:none}}
@media(max-height:550px){.housing-panel.is-editor>header{padding:7px 12px;gap:8px;flex-wrap:nowrap}.housing-panel.is-editor>header small,.housing-panel.is-editor .house-emblem{display:none}.housing-panel.is-editor h2{font-size:17px;line-height:1.2}.housing-panel.is-editor .house-wallet{font-size:10px;flex-basis:auto;order:0;margin-left:auto;white-space:nowrap}.housing-panel.is-editor>header>button{width:30px;height:30px}.housing-panel.is-editor .housing-tabs{display:flex;gap:5px;padding:4px 12px;overflow-x:auto;flex:none}.housing-panel.is-editor .housing-tabs button{flex:none;min-height:30px;font-size:10px;padding:5px 8px}.housing-panel.is-editor .housing-body{padding:6px 12px}.housing-panel.is-editor footer{padding:6px 12px;flex-wrap:nowrap}.housing-panel.is-editor footer>span{display:none}.housing-panel.is-editor footer button{min-height:32px;font-size:10px;padding:6px 8px}.housing-panel.is-editor .house-notice,.housing-panel.is-editor .house-error{font-size:10px;padding:5px 12px}}
</style>

<template>
  <details class="collection" @toggle="onToggle">
    <summary><span>Boutique & personnalisation</span><span>+</span></summary>
    <div v-if="open" class="collection-body">
      <p class="intro">Titres et cadres pour ton carnet. Aucun bonus en combat.</p>
      <p class="balance">{{ coins }} pièces disponibles</p>
      <p v-if="error" role="alert">{{ error }} <button @click="load">Réessayer</button></p>
      <p v-if="loading">Chargement de ta collection…</p>
      <div v-else class="collection-grid">
        <article
          v-for="item in collection.catalog"
          :key="item.key"
          :style="item.color ? { '--cosmetic-color': item.color } : {}"
        >
          <span class="preview" :class="item.type">{{ item.type === 'title' ? '✦' : '▣' }}</span>
          <h3>{{ item.name }}</h3>
          <p>{{ item.description }}</p>
          <button v-if="collection.owned.includes(item.key)" :disabled="busy" @click="equip(item)">
            {{ selected(item) ? 'Retirer' : 'Équiper' }}
          </button>
          <button v-else :disabled="busy || Number(coins) < item.price" @click="purchase(item)">
            Acheter · {{ item.price }} pièces
          </button>
          <span v-if="selected(item)" class="equipped">Équipé</span>
        </article>
      </div>
      <p role="status">{{ notice }}</p>
    </div>
  </details>
</template>
<script>
import api from '@/services/api';
export default {
  props: { coins: { type: [String, Number], default: 0 } },
  data() {
    return {
      open: false,
      loading: false,
      busy: false,
      error: '',
      notice: '',
      collection: { catalog: [], owned: [], appearance: {} },
    };
  },
  mounted() {
    this.load();
  },
  methods: {
    onToggle(e) {
      this.open = e.target.open;
    },
    selected(item) {
      return this.collection.appearance[item.type + '_key'] === item.key;
    },
    sync(data) {
      this.collection = data;
      this.$emit('appearance', {
        title: data.catalog.find((i) => i.key === data.appearance.title_key)?.name || '',
        color: data.catalog.find((i) => i.key === data.appearance.frame_key)?.color || '',
      });
    },
    async load() {
      this.loading = true;
      this.error = '';
      try {
        this.sync((await api.get('/rift/collection')).data);
      } catch (e) {
        this.error = 'Ta collection est indisponible.';
      } finally {
        this.loading = false;
      }
    },
    async purchase(item) {
      if (this.busy) return;
      this.busy = true;
      this.error = '';
      try {
        this.sync((await api.post('/rift/collection/buy', { key: item.key })).data);
        this.notice = item.name + ' ajouté à ta collection.';
        this.$emit('purchase');
      } catch (e) {
        this.error = e.response?.data?.message || 'Achat impossible.';
      } finally {
        this.busy = false;
      }
    },
    async equip(item) {
      if (this.busy) return;
      this.busy = true;
      this.error = '';
      try {
        this.sync(
          (
            await api.post('/rift/collection/equip', {
              type: item.type,
              key: this.selected(item) ? null : item.key,
            })
          ).data
        );
        this.notice = 'Ton carnet a été mis à jour.';
      } catch (e) {
        this.error = e.response?.data?.message || 'Personnalisation impossible.';
      } finally {
        this.busy = false;
      }
    },
  },
};
</script>
<style scoped>
.collection {
  border-bottom: 1px solid var(--journal-border);
  color: var(--journal-ink);
  text-align: left;
}
.collection > summary {
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  min-height: 52px;
  padding: 14px 2px;
  list-style: none;
  font-size: 14px;
}
.collection-body {
  padding: 8px 0 20px;
}
.intro {
  font-size: 13px;
}
.balance {
  color: #806639;
}
.collection-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.collection-grid article {
  position: relative;
  background: var(--journal-card);
  border: 1px solid var(--journal-border);
  border-radius: 10px;
  padding: 15px;
  display: flex;
  flex-direction: column;
}
.preview {
  font-size: 28px;
  color: var(--cosmetic-color, #806639);
}
h3 {
  font-size: 15px;
  margin: 10px 0 6px;
}
article p {
  font-size: 12px;
  flex: 1;
  line-height: 1.6;
}
button {
  min-height: 44px;
  background: var(--journal-accent);
  color: #ffffff;
  border: 1px solid var(--journal-accent);
  border-radius: 6px;
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
button:focus-visible,
summary:focus-visible {
  outline: 2px solid var(--journal-accent);
  outline-offset: 3px;
}
.equipped {
  color: var(--journal-accent);
  font-size: 12px;
  margin-top: 8px;
}
@media (max-width: 600px) {
  .collection-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 360px) {
  .collection-grid {
    grid-template-columns: 1fr;
  }
}
</style>

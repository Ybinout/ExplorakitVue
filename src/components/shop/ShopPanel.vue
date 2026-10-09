<template>
  <div v-if="visible" class="shop-backdrop" @click.self="$emit('close')">
    <section class="shop-card" role="dialog" aria-modal="true" :aria-label="text.title">
      <header class="shop-header">
        <div>
          <div class="shop-kicker">{{ text.counter }}</div>
          <h2>{{ text.title }}</h2>
        </div>
        <button class="shop-close" type="button" @click="$emit('close')">×</button>
      </header>

      <div class="shop-wallet">{{ text.wallet }} <strong>{{ money }} ₽</strong></div>
      <div v-if="error" class="shop-error">{{ error }}</div>
      <div v-if="loading && !catalog.length" class="shop-empty">{{ text.loading }}</div>
      <div v-else class="shop-list">
        <article v-for="item in catalog" :key="item.key" class="shop-item">
          <div class="shop-item-copy">
            <div class="shop-item-title">{{ item.name }}</div>
            <div class="shop-item-description">{{ item.description }}</div>
            <div class="shop-owned">{{ text.owned }} : {{ ownedQuantity(item.key) }}</div>
          </div>
          <div class="shop-buy-controls">
            <select v-model.number="quantities[item.key]" :disabled="loading">
              <option :value="1">×1</option>
              <option :value="5">×5</option>
              <option :value="10">×10</option>
            </select>
            <button
              type="button"
              :disabled="loading || money < totalFor(item)"
              @click="$emit('buy', { itemKey: item.key, quantity: quantityFor(item.key) })"
            >
              {{ totalFor(item) }} ₽
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'ShopPanel',
  props: {
    visible: { type: Boolean, default: false },
    catalog: { type: Array, default: () => [] },
    items: { type: Array, default: () => [] },
    money: { type: Number, default: 0 },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
    language: { type: String, default: 'fr' }
  },
  data() {
    return { quantities: {} };
  },
  computed: {
    text() {
      return this.language === 'en'
        ? { counter: 'Pokémon Shop', title: 'What do you need?', wallet: 'Wallet:', owned: 'Owned', loading: 'Loading…' }
        : { counter: 'Boutique Pokémon', title: 'De quoi as-tu besoin ?', wallet: 'Porte-monnaie :', owned: 'Possédé', loading: 'Chargement…' };
    }
  },
  watch: {
    catalog: {
      immediate: true,
      handler(items) {
        (items || []).forEach((item) => {
          if (!this.quantities[item.key]) this.$set(this.quantities, item.key, 1);
        });
      }
    }
  },
  methods: {
    quantityFor(itemKey) {
      return Number(this.quantities[itemKey]) || 1;
    },
    totalFor(item) {
      return Number(item.price) * this.quantityFor(item.key);
    },
    ownedQuantity(itemKey) {
      return Number(this.items.find((item) => item.key === itemKey)?.quantity) || 0;
    }
  }
};
</script>

<style scoped>
.shop-backdrop { position: absolute; inset: 0; z-index: 90; display: grid; place-items: center; padding: 18px; background: rgba(3, 8, 13, .68); }
.shop-card { width: min(690px, 96%); max-height: 84%; overflow: hidden; border: 3px solid #263a45; border-radius: 14px; background: #f5f0df; color: #18252d; box-shadow: 0 18px 48px rgba(0,0,0,.55), inset 0 0 0 3px #fff; }
.shop-header { display: flex; align-items: center; justify-content: space-between; padding: 15px 18px; color: white; background: linear-gradient(135deg, #287e8b, #185568); }
.shop-header h2 { margin: 5px 0 0; font-size: 15px; }
.shop-kicker { color: #bdeef0; font-size: 8px; text-transform: uppercase; }
.shop-close { width: 34px; height: 34px; border-radius: 50%; color: white; background: rgba(0,0,0,.22); font-size: 21px; }
.shop-wallet { padding: 11px 18px; border-bottom: 2px solid #d4ccb7; text-align: right; font-size: 10px; }
.shop-list { max-height: 440px; overflow-y: auto; padding: 10px 14px 16px; }
.shop-item { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 5px; border-bottom: 1px solid #cfc7b4; }
.shop-item-copy { min-width: 0; }
.shop-item-title { margin-bottom: 6px; font-size: 10px; }
.shop-item-description { color: #596269; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.35; }
.shop-owned { margin-top: 6px; color: #30717b; font-size: 8px; }
.shop-buy-controls { display: flex; gap: 7px; flex: 0 0 auto; }
.shop-buy-controls select, .shop-buy-controls button { min-height: 34px; border: 1px solid #536b70; border-radius: 6px; font-size: 9px; }
.shop-buy-controls select { padding: 0 5px; background: white; }
.shop-buy-controls button { min-width: 105px; padding: 0 10px; color: white; background: #2e8b57; }
.shop-buy-controls button:disabled { opacity: .45; cursor: not-allowed; }
.shop-error, .shop-empty { padding: 15px 18px; color: #9c2929; font-size: 9px; line-height: 1.5; }
@media (max-width: 620px) {
  .shop-backdrop { padding: 8px; }
  .shop-card { width: 100%; max-height: 78%; }
  .shop-item { align-items: stretch; flex-direction: column; }
  .shop-buy-controls { justify-content: flex-end; }
}
</style>

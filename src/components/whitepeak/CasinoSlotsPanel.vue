<template>
  <div class="slots-backdrop" @keydown.stop="keyboard" @keyup.stop>
    <section
      ref="panel"
      tabindex="-1"
      class="slots-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="slots-title"
      data-slots-panel
    >
      <header>
        <div class="slots-header-icon" aria-hidden="true">7</div>
        <div>
          <small>CASINO DE BLANCHECIME · MACHINE {{ machine }}</small>
          <h2 id="slots-title">Les trois étoiles</h2>
        </div>
        <button aria-label="Fermer la machine" @click="$emit('close')">
          ×
        </button>
      </header>
      <div class="slots-body">
        <div class="slots-balance">
          <span>Ton porte-monnaie</span><b>{{ money(balance) }} ₽</b>
        </div>
        <div
          class="slots-cabinet"
          :class="{
            spinning,
            jackpot: result?.kind === 'seven',
            won: result?.payout > 0,
          }"
        >
          <div class="slots-marquee">
            <i></i><span>7 <small>•</small> 7 <small>•</small> 7</span><i></i>
          </div>
          <div class="slots-game-row">
            <div class="slots-reel-window" aria-hidden="true">
              <div v-for="(reel, i) in strips" :key="i" class="slots-reel">
                <div
                  class="slots-strip"
                  :style="{
                    transform: 'translate3d(0,' + -offset(i) * 100 + '%,0)',
                  }"
                >
                  <span
                    v-for="(symbol, n) in reel"
                    :key="n"
                    class="slots-symbol-cell"
                    ><span
                      class="slot-symbol"
                      :style="symbolStyle(symbol)"
                    ></span
                  ></span>
                </div>
              </div>
              <div class="slots-reel-shade"></div>
              <div class="slots-reel-payline"></div>
            </div>
            <button
              ref="lever"
              class="slots-lever"
              :class="{ disabled: !canSpin }"
              :disabled="!canSpin"
              aria-label="Tirer le levier"
              aria-describedby="lever-help"
              @pointerdown="leverDown"
              @click="leverClick"
              :style="{ '--pull': pull + 'px' }"
            >
              <span class="lever-rail"></span><span class="lever-arm"></span
              ><span class="lever-ball"></span><span class="lever-base"></span>
            </button>
          </div>
          <p class="slots-live" aria-live="polite">
            {{
              spinning
                ? 'Les rouleaux tournent…'
                : result
                ? result.kind === 'none'
                  ? 'Pas de combinaison cette fois.'
                  : result.kind === 'seven'
                  ? '777 · JACKPOT !'
                  : result.label
                : 'Trois rouleaux. À toi de jouer.'
            }}
          </p>
          <div class="slots-result" :class="{ show: !!result }">
            <small>GAIN TOTAL</small
            ><b>{{ result ? money(result.payout) : '—' }} <span>₽</span></b
            ><span v-if="result"
              >Mise de {{ money(result.amount) }} ₽ déjà déduite.</span
            ><span v-else>Les gains comprennent la mise.</span>
          </div>
        </div>
        <p id="lever-help" class="lever-help">
          {{
            spinning
              ? 'Le tirage est enregistré, même si tu fermes la fenêtre.'
              : 'Fais glisser le levier vers le bas, ou clique dessus.'
          }}
        </p>
        <div class="slots-stake">
          <label for="slots-bet"
            >Ta mise
            <span
              ><input
                id="slots-bet"
                v-model.number="amount"
                type="number"
                inputmode="numeric"
                :min="config.minimumBet"
                :max="Math.min(balance, config.maximumBet)"
                step="100"
                :disabled="spinning || busy"
              />
              ₽</span
            ></label
          >
          <div class="slots-presets">
            <button
              v-for="n in [1000, 10000, 100000]"
              :key="n"
              :disabled="spinning || busy || balance < n"
              @click="amount = n"
            >
              {{ money(n) }}
            </button>
          </div>
          <small>100 ₽ à 1 000 000 ₽ · la mise est déduite au lancement.</small>
        </div>
        <p v-if="error" class="slots-error" role="alert">
          {{ error }}
          <button :disabled="busy" @click="$emit('command', 'refresh')">
            Actualiser
          </button>
        </p>
        <details class="slots-paytable">
          <summary>Combinaisons et gains <span>⌄</span></summary>
          <table>
            <thead>
              <tr>
                <th>Résultat</th>
                <th>Chance</th>
                <th>Gain total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in config.results" :key="r.kind">
                <td>{{ r.label }}</td>
                <td>{{ (r.weight / 10000).toLocaleString('fr-FR') }} %</td>
                <td>
                  ×{{ (r.numerator / r.denominator).toLocaleString('fr-FR') }}
                </td>
              </tr>
            </tbody>
          </table>
          <p>
            Un tirage indépendant à chaque partie. Les deux symboles identiques
            rendent la moitié de la mise ; un montant impair est arrondi à
            l’unité inférieure.
          </p>
        </details>
      </div>
      <footer>
        <span>{{
          busy
            ? 'Enregistrement…'
            : spinning
            ? 'Tirage en cours'
            : 'Levier prêt'
        }}</span
        ><button :disabled="busy" @click="$emit('close')">
          Retour au casino
        </button>
      </footer>
    </section>
  </div>
</template>
<script>
import config from '@/data/casinoSlots.json';
const symbols = require('@/assets/casino/slot-symbols-v1.png');
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export default {
  props: {
    state: Object,
    machine: Number,
    balance: Number,
    busy: Boolean,
    error: String,
    connected: Boolean,
    motion: Boolean,
  },
  data: () => ({
    amount: 10000,
    pull: 0,
    clock: Date.now(),
    oldSymbols: ['cherry', 'star', 'bell'],
    ready: false,
  }),
  computed: {
    config: () => config,
    spinning() {
      return this.state?.spin?.phase === 'spinning';
    },
    canSpin() {
      return (
        this.ready &&
        this.connected &&
        !this.busy &&
        !this.spinning &&
        !!this.state?.nextId &&
        Number.isSafeInteger(this.amount) &&
        this.amount >= config.minimumBet &&
        this.amount <= Math.min(this.balance, config.maximumBet)
      );
    },
    result() {
      const s = this.state?.spin;
      if (!s || this.spinning) return null;
      return {
        ...s,
        label: config.results.find((r) => r.kind === s.kind)?.label,
      };
    },
    strips() {
      const s = this.state?.spin;
      if (!this.spinning)
        return [0, 1, 2].map((i) => [s?.symbols?.[i] || this.oldSymbols[i]]);
      const seed = s.id.charCodeAt(0);
      return [0, 1, 2].map((i) =>
        Array.from({ length: this.steps(i) + 1 }, (_, n) =>
          n === this.steps(i)
            ? s.symbols[i]
            : n === 0
            ? this.oldSymbols[i]
            : config.symbols[(n * 7 + i + seed) % 4]
        )
      );
    },
  },
  watch: {
    state(next, previous) {
      if (next?.spin?.id !== previous?.spin?.id)
        this.oldSymbols = previous?.spin?.symbols || this.oldSymbols;
      this.animate();
    },
    motion() {
      this.animate();
    },
  },
  async mounted() {
    this._focus = document.activeElement;
    this.$refs.panel.focus({ preventScroll: true });
    try {
      await new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = resolve;
        im.onerror = reject;
        im.src = symbols;
      });
      this.ready = true;
    } catch (_) {
      this.$emit(
        'asset-error',
        'Les symboles n’ont pas pu être chargés. Rouvre la machine.'
      );
    }
    this.animate();
  },
  beforeDestroy() {
    cancelAnimationFrame(this._frame);
    clearTimeout(this._refreshTimer);
    this.clearLever();
    if (this._focus?.isConnected) this._focus.focus({ preventScroll: true });
  },
  methods: {
    money: (n) => Number(n || 0).toLocaleString('fr-FR'),
    steps: (i) => 28 + i * 6,
    symbolStyle(s) {
      return {
        backgroundImage: `url(${symbols})`,
        backgroundPosition: (config.symbols.indexOf(s) * 100) / 3 + '% 50%',
      };
    },
    offset(i) {
      if (!this.spinning) return 0;
      if (!this.motion) return this.steps(i);
      const elapsed =
          this.clock + (this.state?.offset || 0) - this.state.spin.startedAt,
        t = clamp(elapsed / (3100 + i * 600), 0, 1);
      return this.steps(i) * (1 - Math.pow(1 - t, 3));
    },
    animate() {
      cancelAnimationFrame(this._frame);
      clearTimeout(this._refreshTimer);
      this.clock = Date.now();
      if (!this.spinning) return;
      const draw = () => {
        this.clock = Date.now();
        if (
          this.spinning &&
          this.motion &&
          this.clock + (this.state?.offset || 0) < this.state.spin.resultAt
        )
          this._frame = requestAnimationFrame(draw);
      };
      draw();
      this._refreshTimer = setTimeout(
        () => this.$emit('command', 'refresh'),
        Math.max(
          500,
          this.state.spin.resultAt -
            (this.state.offset || 0) -
            Date.now() +
            1000
        )
      );
    },
    spin() {
      if (!this.canSpin) return;
      this.pull = 0;
      this.$emit('command', 'spin', {
        id: this.state.nextId,
        machine: this.machine,
        amount: this.amount,
      });
    },
    leverDown(e) {
      if (!this.canSpin) return;
      e.preventDefault();
      this.clearLever();
      const y = e.clientY,
        id = e.pointerId;
      let moved = false;
      const move = (ev) => {
        if (ev.pointerId !== id) return;
        ev.preventDefault();
        this.pull = clamp(ev.clientY - y, 0, 65);
        moved ||= Math.abs(ev.clientY - y) > 5;
      };
      const end = (ev) => {
        if (ev.pointerId !== id) return;
        const fire = this.pull >= 34;
        this.clearLever();
        this.pull = 0;
        if (moved) this._ignoreClick = performance.now() + 400;
        if (fire) this.spin();
      };
      const cancel = () => {
        this.clearLever();
        this.pull = 0;
      };
      window.addEventListener('pointermove', move, { passive: false });
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', cancel);
      this._leverCleanup = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', cancel);
      };
    },
    leverClick() {
      if (performance.now() < (this._ignoreClick || 0)) return;
      this.spin();
    },
    clearLever() {
      this._leverCleanup?.();
      this._leverCleanup = null;
    },
    keyboard(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.$emit('close');
        return;
      }
      if (e.key !== 'Tab') return;
      const a = [
          ...this.$refs.panel.querySelectorAll(
            'button:not(:disabled),input:not(:disabled),summary'
          ),
        ].filter((x) => x.getClientRects().length),
        first = a[0],
        last = a.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    },
  },
};
</script>
<style scoped>
.slots-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2650;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: #07111baf;
  backdrop-filter: blur(5px);
  font-family: var(--journal-font);
  color: var(--journal-ink);
}
.slots-panel {
  width: min(670px, 100%);
  max-height: calc(100dvh - 24px);
  display: flex;
  flex-direction: column;
  border: 1px solid var(--journal-border);
  border-radius: 15px;
  box-shadow: var(--journal-shadow);
  background: var(--journal-paper);
  overflow: hidden;
  outline: none;
}
header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 19px 23px;
  border-bottom: 1px solid var(--journal-border);
  background: var(--journal-card);
}
header > div:nth-child(2) {
  flex: 1;
  min-width: 0;
}
.slots-header-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  background: #71293c;
  border: 1px solid #b58b4c;
  border-radius: 8px;
  color: #f1cf87;
  font: 900 31px Georgia, serif;
}
header small {
  font-size: 8px;
  letter-spacing: 0.15em;
  color: var(--journal-muted);
}
h2 {
  font: 700 24px var(--journal-font);
  margin: 5px 0 0;
  color: var(--journal-heading);
}
button,
input {
  font: inherit;
}
button {
  cursor: pointer;
  color: var(--journal-ink);
  background: var(--journal-card);
  border: 1px solid var(--journal-border);
  border-radius: 7px;
  padding: 9px 13px;
}
button:disabled {
  opacity: 0.45;
  cursor: default;
}
header > button {
  width: 35px;
  height: 35px;
  padding: 0;
  font-size: 25px;
}
.slots-body {
  padding: 17px 24px 20px;
  overflow: auto;
  overscroll-behavior: contain;
  min-height: 0;
}
.slots-balance {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 13px;
  font-size: 12px;
}
.slots-balance > span {
  color: var(--journal-muted);
}
.slots-balance b {
  color: var(--journal-heading);
}
.slots-cabinet {
  position: relative;
  padding: 12px 20px 16px;
  background: linear-gradient(120deg, #223c4d, #142937);
  border: 3px solid #b79356;
  border-radius: 15px;
  box-shadow: inset 0 0 0 2px #122433, 0 5px 0 #172b37;
  color: #f5e1b0;
}
.slots-marquee {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  margin: 0 0 10px;
}
.slots-marquee > span {
  font: 900 32px Georgia, serif;
  letter-spacing: 9px;
  padding-left: 9px;
  color: #efc771;
}
.slots-marquee small {
  font-size: 10px;
}
.slots-marquee i {
  width: 7px;
  height: 7px;
  display: block;
  background: #f1c46f;
  border-radius: 50%;
  box-shadow: 0 0 10px #eab95777;
}
.slots-game-row {
  display: flex;
  gap: 12px;
  align-items: center;
}
.slots-reel-window {
  position: relative;
  display: flex;
  flex: 1;
  min-width: 0;
  height: 108px;
  overflow: hidden;
  border: 3px solid #be9c61;
  border-radius: 10px;
  background: #f5ebcf;
  box-shadow: inset 0 0 0 3px #0c1d29;
}
.slots-reel {
  position: relative;
  flex: 1;
  height: 100%;
  overflow: hidden;
  border-right: 1px solid #bea77a;
}
.slots-reel:last-of-type {
  border: 0;
}
.slots-strip {
  height: 100%;
  will-change: transform;
  position: relative;
}
.slots-symbol-cell {
  height: 100%;
  display: grid;
  place-items: center;
}
.slot-symbol {
  display: block;
  width: 85px;
  max-width: 95%;
  height: 85px;
  background-size: 400% 100%;
  background-repeat: no-repeat;
  image-rendering: pixelated;
}
.slots-reel-shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    #091c2b55,
    transparent 28%,
    transparent 72%,
    #091c2b55
  );
  box-shadow: inset 0 0 8px #09233266;
}
.slots-reel-payline {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  border-top: 1px solid #b75b5544;
  pointer-events: none;
}
.slots-lever {
  position: relative;
  width: 46px;
  height: 122px;
  flex: none;
  padding: 0;
  background: none;
  border: 0;
  touch-action: none;
  user-select: none;
}
.lever-rail {
  position: absolute;
  left: 20px;
  top: 30px;
  width: 7px;
  height: 76px;
  background: #061725;
  border: 1px solid #677b84;
  border-radius: 5px;
}
.lever-arm {
  position: absolute;
  left: 20px;
  top: 20px;
  width: 7px;
  height: 71px;
  transform: translateY(calc(var(--pull) * 0.35));
  background: linear-gradient(90deg, #866a36, #f2d593, #8f713d);
  border-radius: 5px;
}
.lever-ball {
  position: absolute;
  left: 5px;
  top: 1px;
  width: 36px;
  height: 36px;
  border: 2px solid #c99277;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 25%, #f7aa99, #a4384b 50%, #641b30);
  box-shadow: 0 3px 0 #110c1f;
  transform: translateY(var(--pull));
  transition: filter 0.15s;
}
.lever-base {
  position: absolute;
  left: 12px;
  top: 89px;
  width: 26px;
  height: 23px;
  background: #b49256;
  border: 2px solid #e3c788;
  border-radius: 5px;
}
.slots-lever:not(:disabled):hover .lever-ball {
  filter: brightness(1.2);
}
.slots-lever.disabled {
  opacity: 0.55;
}
.slots-live {
  text-align: center;
  font-size: 13px;
  min-height: 20px;
  line-height: 1.5;
  margin: 12px 0 9px;
  font-weight: 700;
  color: #f5e3bc;
}
.slots-result {
  border-top: 1px solid #9b875841;
  min-height: 71px;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding-top: 10px;
}
.slots-result small {
  font-size: 8px;
  letter-spacing: 0.2em;
  color: #cfba8a;
}
.slots-result b {
  font: 800 26px var(--journal-font);
  margin: 4px 0;
}
.slots-result b span {
  font-size: 18px;
}
.slots-result > span {
  font-size: 10px;
  color: #cfbe9c;
}
.slots-cabinet.won .slots-result b {
  color: #ffdc87;
}
.slots-cabinet.won {
  box-shadow: inset 0 0 0 2px #122433, 0 0 19px #cfad4c44, 0 5px 0 #172b37;
}
.slots-cabinet.jackpot {
  border-color: #ffe3a0;
  background: linear-gradient(120deg, #624326, #293947);
}
.slots-cabinet.jackpot .slots-marquee {
  animation: jackpotGlow 1.4s ease-in-out 3;
}
.lever-help {
  font-size: 11px;
  color: var(--journal-muted);
  line-height: 1.5;
  text-align: center;
  margin: 15px 0;
}
.slots-stake > label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  font-weight: 700;
}
.slots-stake label > span {
  display: flex;
  align-items: center;
  gap: 8px;
}
.slots-stake input {
  width: 145px;
  padding: 10px;
  border: 1px solid var(--journal-border);
  border-radius: 7px;
  background: var(--journal-card);
  color: var(--journal-heading);
  font-weight: 700;
}
.slots-presets {
  display: flex;
  gap: 7px;
  margin: 9px 0;
}
.slots-presets button {
  flex: 1;
  font-size: 11px;
  min-height: 35px;
}
.slots-stake > small {
  font-size: 9px;
  color: var(--journal-muted);
}
.slots-paytable {
  border-top: 1px solid var(--journal-border);
  margin-top: 17px;
  padding-top: 13px;
}
.slots-paytable summary {
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
}
.slots-paytable table {
  border-collapse: collapse;
  width: 100%;
  font-size: 10px;
  margin-top: 13px;
}
.slots-paytable th,
.slots-paytable td {
  padding: 8px 5px;
  border-bottom: 1px solid var(--journal-border);
  text-align: right;
}
.slots-paytable th:first-child,
.slots-paytable td:first-child {
  text-align: left;
}
.slots-paytable p {
  font-size: 10px;
  color: var(--journal-muted);
  line-height: 1.5;
}
.slots-error {
  font-size: 12px;
  line-height: 1.5;
  color: #bb5055;
}
.slots-error button {
  font-size: 11px;
}
footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 23px;
  border-top: 1px solid var(--journal-border);
  background: var(--journal-card);
  flex: none;
  font-size: 11px;
}
footer > span {
  color: var(--journal-muted);
}
footer button {
  font-size: 11px;
}
@keyframes jackpotGlow {
  50% {
    filter: brightness(1.4);
    text-shadow: 0 0 13px #ffd56b;
  }
}
@media (max-width: 600px) {
  .slots-backdrop {
    padding: 6px;
  }
  .slots-panel {
    max-height: calc(100dvh - 12px);
    border-radius: 12px;
  }
  header {
    padding: 13px;
    gap: 9px;
  }
  h2 {
    font-size: 20px;
  }
  header small {
    font-size: 7px;
  }
  .slots-header-icon {
    width: 32px;
    height: 32px;
    font-size: 27px;
  }
  .slots-body {
    padding: 13px 14px;
  }
  .slots-cabinet {
    padding: 9px 10px 12px;
  }
  .slots-marquee {
    gap: 13px;
    margin-bottom: 3px;
  }
  .slots-marquee > span {
    font-size: 28px;
  }
  .slots-reel-window {
    height: 92px;
  }
  .slots-game-row {
    gap: 7px;
  }
  .slot-symbol {
    width: 65px;
    height: 65px;
  }
  .slots-lever {
    width: 40px;
    transform: scale(0.85);
    transform-origin: center;
    margin: 0 -4px;
  }
  .slots-live {
    font-size: 11px;
    margin-top: 6px;
  }
  .slots-result b {
    font-size: 25px;
  }
  .slots-stake input {
    width: 125px;
  }
  footer {
    padding: 10px 13px;
  }
  .lever-help {
    font-size: 10px;
    margin: 12px 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .slots-cabinet.jackpot .slots-marquee {
    animation: none;
  }
}
</style>

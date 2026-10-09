<template>
  <div v-if="active" :class="['battle', { 'battle-reduced-motion': !preferences.animationsEnabled }]" role="region" :aria-label="tr('battle')">
    <div
      ref="battleScene"
      :class="[
        'battle-scene',
        fieldClasses,
        { 'battle-impact-active': attackFx.wild.hit || attackFx.player.hit }
      ]"
    >
      <img src="../../assets/battle/back.webp" class="battle-background" alt="">
      <div class="battle-atmosphere" aria-hidden="true"></div>
      <div class="battle-weather-layer" aria-hidden="true"></div>
      <div class="battle-terrain-layer" aria-hidden="true"></div>

      <div v-if="fieldLabel" class="battle-field-label" aria-live="polite">
        {{ fieldLabel }}
      </div>

      <div
        v-if="battleMoveFx.visible"
        :key="`move-${battleMoveFx.nonce}`"
        :class="[
          'battle-move-effect',
          `battle-move-${battleMoveFx.damageClass}`,
          `battle-move-from-${battleMoveFx.actor}`
        ]"
        :style="battleMoveStyle"
        aria-hidden="true"
      >
        <span></span>
      </div>

      <div
        v-if="opponent && opponent.data"
        ref="opponentAnchor"
        :key="`opponent-${getPokemonBattleKey(opponent)}`"
        :class="[
          'battle-sprite-anchor',
          'battle-sprite-wild',
          {
            'battle-attacking-wild': battleMoveFx.visible && battleMoveFx.actor === 'opponent',
            'battle-capture-target': captureFx.visible,
            'capture-target-contained': captureFx.targetContained,
            [`capture-state-${captureFx.state}`]: captureFx.visible
          }
        ]"
      >
        <img
          :class="['battle-sprite', { 'battle-hit-shake': attackFx.wild.hit }]"
          :style="battleSpriteStyles.wild"
          :src="getPokemonSprite(opponent, 'front')"
          :alt="opponent.truename || opponent.name || 'Pokemon adverse'"
          @load="calibrateBattleSprite($event, 'wild')"
        >
      </div>

      <div
        v-if="currentPokemon && currentPokemon.data"
        ref="playerAnchor"
        :key="`player-${getPokemonBattleKey(currentPokemon)}`"
        :class="[
          'battle-sprite-anchor',
          'battle-sprite-player',
          { 'battle-attacking-player': battleMoveFx.visible && battleMoveFx.actor === 'player' }
        ]"
      >
        <img
          :class="['battle-sprite', { 'battle-hit-shake': attackFx.player.hit }]"
          :style="battleSpriteStyles.player"
          :src="getPokemonSprite(currentPokemon, 'back')"
          :alt="currentPokemon.name || 'Ton Pokemon'"
          @load="calibrateBattleSprite($event, 'player')"
        >
      </div>

      <div
        v-if="opponent"
        :class="['battle-status', 'battle-status-wild', { 'battle-status-hit': attackFx.wild.hit }]"
      >
        <div class="battle-status-top">
          <span class="battle-status-name">{{ opponent.truename || opponent.name }}</span>
          <span class="battle-status-lvl">lv.{{ opponent.level }}</span>
          <span class="battle-status-tier">K{{ opponent.k }}</span>
          <span
            v-if="opponentStatus"
            :class="['battle-status-ailment', `status-${opponentStatus.key}`]"
            :title="opponentStatus.label"
          >
            {{ opponentStatus.code }}
          </span>
        </div>
        <health-bar :current-hp="opponent.currentHp" :hp-max="opponent.maxHp" />
        <div class="battle-status-details">
          <span>{{ formatBattleHp(opponent) }}</span>
          <span v-if="opponent.passiveAbility">{{ tr('ability') }} : {{ localizedAbility(opponent.passiveAbility) }}</span>
        </div>
      </div>

      <div
        v-if="currentPokemon"
        :class="['battle-status', 'battle-status-player', { 'battle-status-hit': attackFx.player.hit }]"
      >
        <div class="battle-status-top">
          <span class="battle-status-name">{{ currentPokemon.name || currentPokemon.truename }}</span>
          <span class="battle-status-lvl">lv.{{ currentPokemon.level }}</span>
          <span class="battle-status-tier">K{{ currentPokemon.k }}</span>
          <span
            v-if="playerStatus"
            :class="['battle-status-ailment', `status-${playerStatus.key}`]"
            :title="playerStatus.label"
          >
            {{ playerStatus.code }}
          </span>
        </div>
        <health-bar :current-hp="currentPokemon.currentHp" :hp-max="currentPokemon.maxHp" />
        <div class="battle-status-details">
          <span>{{ formatBattleHp(currentPokemon) }}</span>
          <span v-if="currentPokemon.passiveAbility">{{ tr('ability') }} : {{ localizedAbility(currentPokemon.passiveAbility) }}</span>
        </div>
      </div>

      <div
        v-if="attackFx.wild.visible"
        :key="`wild-${attackFx.wild.nonce}`"
        :class="['battle-damage-text', 'battle-damage-wild', `battle-health-${attackFx.wild.kind}`]"
        :style="getEffectPosition('wild')"
      >
        {{ attackFx.wild.kind === 'heal' ? '+' : '-' }}{{ attackFx.wild.amount }}
      </div>

      <div
        v-if="attackFx.player.visible"
        :key="`player-${attackFx.player.nonce}`"
        :class="['battle-damage-text', 'battle-damage-player', `battle-health-${attackFx.player.kind}`]"
        :style="getEffectPosition('player')"
      >
        {{ attackFx.player.kind === 'heal' ? '+' : '-' }}{{ attackFx.player.amount }}
      </div>

      <div
        v-if="resultFx.visible"
        :key="`result-${resultFx.nonce}`"
        :class="['battle-result-fx', `battle-result-${resultFx.actor}`]"
        :style="getEffectPosition(resultFx.actor === 'opponent' ? 'wild' : 'player')"
        role="status"
        aria-live="assertive"
      >
        <span
          v-for="label in resultFx.labels"
          :key="label.key"
          :class="['battle-result-chip', `result-${label.key}`]"
        >
          {{ label.text }}
        </span>
      </div>

      <div
        v-if="captureFx.visible"
        :class="['capture-fx-overlay', `capture-state-${captureFx.state}`]"
        :style="captureStyle"
      >
        <div class="capture-fx-beam"></div>
        <div class="capture-fx-burst"><i v-for="spark in 8" :key="spark"></i></div>
        <div class="capture-fx-shadow"></div>
        <div class="capture-fx-ring" :class="`ring-${captureFx.state}`"></div>
        <div
          :key="captureFx.nonce"
          class="capture-fx-ball"
          :class="[`ball-${captureFx.ballType}`, `state-${captureFx.state}`]"
        ></div>
        <div class="capture-fx-text">{{ captureFx.message }}</div>
      </div>
    </div>

    <div class="bar battle-action-shell">
      <div :class="['battle-turn-indicator', { 'is-ready': canChooseAction }]">
        <span class="battle-turn-dot" aria-hidden="true"></span>
        {{ turnLabel }}
      </div>

      <button
        type="button"
        class="battle-sound-toggle"
        :aria-label="soundEnabled ? tr('soundOff') : tr('soundOn')"
        :title="soundEnabled ? tr('soundsEnabled') : tr('soundsMuted')"
        @click="toggleSound"
      >
        {{ soundEnabled ? '♪' : '×' }}
      </button>

      <div class="battle-action-display">
        <div
          v-if="actionState.patient"
          :key="messageNonce"
          class="battle-text-box"
          role="status"
          aria-live="polite"
        >
          {{ actionState.text }}
        </div>

        <div v-else-if="actionState.attackPanel" class="battle-grid battle-grid-attacks">
          <button
            v-for="index in 4"
            :key="index"
            type="button"
            class="battle-choice-btn"
            :disabled="isMoveUnavailable(index - 1)"
            @click="submitAction({ action: 'attack', number: index - 1 }, tr('attackRunning'))"
          >
            {{ moveButtonLabel(index - 1) }}
          </button>
        </div>

        <div v-else-if="actionState.pokemonPanel" class="battle-grid battle-grid-pokemon">
          <button
            v-for="(pokemon, index) in battleTeam"
            :key="getPokemonBattleKey(pokemon) || index"
            type="button"
            class="battle-choice-btn battle-pokemon-choice"
            :disabled="isSwitchUnavailable(pokemon, index)"
            @click="submitAction({ action: 'change', number: index }, tr('switchRunning'))"
          >
            <span>{{ pokemon.name || pokemon.truename || 'Pokemon' }}</span>
            <small>{{ formatBattleHp(pokemon) }}<template v-if="index === 0"> · {{ tr('activePokemon') }}</template></small>
          </button>
          <div v-if="battleTeam.length <= 1" class="battle-empty-state">{{ tr('noOtherPokemon') }}</div>
        </div>

        <div v-else-if="actionState.bagPanel" class="battle-grid battle-grid-bag">
          <div v-if="bagLoading" class="battle-empty-state">{{ tr('loadingBag') }}</div>
          <div v-else-if="battleBallItems.length === 0" class="battle-empty-state">{{ tr('noBall') }}</div>
          <button
            v-for="item in battleBallItems"
            :key="item.key"
            type="button"
            class="battle-choice-btn battle-choice-btn-bag"
            :disabled="!canChooseAction"
            @click="submitAction({ action: 'bag', itemKey: item.key }, tr('throwBall'))"
          >
            <span>{{ item.name }}</span>
            <span>x{{ item.quantity }}</span>
          </button>
        </div>

        <div v-else class="battle-text-box battle-text-box-muted">{{ tr('chooseAction') }}</div>
      </div>

      <div class="battle-main-actions">
        <button class="battle-main-btn action-attack" :disabled="!canChooseAction" @click="setPanel('attack')">{{ tr('attack') }}</button>
        <button class="battle-main-btn action-bag" :disabled="!canChooseAction" @click="openBag">{{ tr('bag') }}</button>
        <button class="battle-main-btn action-pokemon" :disabled="!canChooseAction" @click="setPanel('pokemon')">{{ tr('pokemon') }}</button>
        <button class="battle-main-btn action-flee" :disabled="!canChooseAction" @click="submitAction({ action: 'flee' }, tr('fleeing'))">{{ tr('flee') }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import HealthBar from '../HealthBar.vue';
import { getBattleStatus } from '@/services/gameView';
import { localizeAbilityName, localizeMoveName, translate } from '@/services/i18n';

const MOVE_COLORS = {
  bug: '#9fca3b', dark: '#71605a', dragon: '#7864e8', electric: '#f6cf3f',
  fairy: '#f39dcc', fighting: '#dc594d', fire: '#f27b38', flying: '#78a7e8',
  ghost: '#6f72b8', grass: '#5fbd58', ground: '#d5a64a', ice: '#63c9d3',
  normal: '#a4a49a', poison: '#a85bad', psychic: '#e95d91', rock: '#b7a34b',
  steel: '#8da4ad', water: '#4e8ee8'
};

const FIELD_LABELS = {
  fr: {
    rain: 'Pluie', sun: 'Soleil', sandstorm: 'Tempête de sable', hail: 'Grêle',
    electric_terrain: 'Champ Électrifié', grassy_terrain: 'Champ Herbu',
    misty_terrain: 'Champ Brumeux', psychic_terrain: 'Champ Psychique'
  },
  en: {
    rain: 'Rain', sun: 'Sun', sandstorm: 'Sandstorm', hail: 'Hail',
    electric_terrain: 'Electric Terrain', grassy_terrain: 'Grassy Terrain',
    misty_terrain: 'Misty Terrain', psychic_terrain: 'Psychic Terrain'
  }
};

export default {
  name: 'BattleOverlay',
  components: { HealthBar },
  props: {
    active: { type: Boolean, default: false },
    bagItems: { type: Array, default: () => [] },
    bagLoading: { type: Boolean, default: false },
    preferences: {
      type: Object,
      default: () => ({ masterVolume: 35, animationsEnabled: true, language: 'fr' })
    }
  },
  data() {
    return {
      player: null,
      opponent: null,
      canAct: false,
      actionState: {
        patient: false,
        attackPanel: false,
        pokemonPanel: false,
        bagPanel: false,
        text: "pas d'information"
      },
      messageNonce: 0,
      messageTimer: null,
      moveTimer: null,
      resultTimer: null,
      battleMoveFx: {
        visible: false, actor: 'player', moveName: '', moveType: 'Normal', damageClass: 'status', nonce: 0
      },
      movePath: { startX: 180, startY: 390, targetX: 700, targetY: 220 },
      resultFx: { visible: false, actor: 'opponent', labels: [], nonce: 0 },
      battleSpriteStyles: { wild: {}, player: {} },
      battleSpriteMetrics: {
        wild: { widthRatio: 1, heightRatio: 1 },
        player: { widthRatio: 1, heightRatio: 1 }
      },
      captureTimers: [],
      captureFx: {
        visible: false,
        state: 'idle',
        ballType: 'pokeball',
        message: '',
        nonce: 0,
        targetContained: false,
        path: { startX: 180, startY: 390, targetX: 700, targetY: 220, groundY: 310 }
      },
      healthTimers: { wild: [], player: [] },
      attackFx: {
        wild: { visible: false, hit: false, amount: 0, kind: 'damage', nonce: 0 },
        player: { visible: false, hit: false, amount: 0, kind: 'damage', nonce: 0 }
      },
      fieldState: { weather: null, terrain: null },
      soundEnabled: localStorage.getItem('battleSoundEnabled') !== 'false',
      audioContext: null
    };
  },
  computed: {
    currentPokemon() {
      return this.player?.equipe?.pokemons?.[0] || null;
    },
    battleTeam() {
      return Array.isArray(this.player?.equipe?.pokemons) ? this.player.equipe.pokemons : [];
    },
    canChooseAction() {
      return this.canAct && !this.captureFx.visible;
    },
    turnLabel() {
      if (this.captureFx.visible) return this.tr('captureRunning');
      return this.canChooseAction ? this.tr('yourTurn') : this.tr('resolvingTurn');
    },
    battleMoveStyle() {
      const moveType = String(this.battleMoveFx.moveType || 'normal').toLowerCase();
      return {
        '--battle-move-color': MOVE_COLORS[moveType] || MOVE_COLORS.normal,
        '--move-start-x': `${this.movePath.startX}px`,
        '--move-start-y': `${this.movePath.startY}px`,
        '--move-dx': `${this.movePath.targetX - this.movePath.startX}px`,
        '--move-dy': `${this.movePath.targetY - this.movePath.startY}px`
      };
    },
    captureStyle() {
      const path = this.captureFx.path;
      const deltaX = path.targetX - path.startX;
      const deltaY = path.targetY - path.startY;
      return {
        '--capture-start-x': `${path.startX}px`,
        '--capture-start-y': `${path.startY}px`,
        '--capture-target-x': `${path.targetX}px`,
        '--capture-target-y': `${path.targetY}px`,
        '--capture-ground-y': `${path.groundY}px`,
        '--capture-dx': `${deltaX}px`,
        '--capture-dy': `${deltaY}px`,
        '--capture-mid-x': `${deltaX * 0.55}px`,
        '--capture-mid-y': `${deltaY * 0.55 - 105}px`,
        '--capture-near-x': `${deltaX * 0.88}px`,
        '--capture-near-y': `${deltaY * 0.88 - 38}px`,
        '--capture-drop-y': `${path.groundY - path.targetY}px`
      };
    },
    opponentStatus() {
      return getBattleStatus(this.opponent?.status);
    },
    playerStatus() {
      return getBattleStatus(this.currentPokemon?.status);
    },
    battleBallItems() {
      return this.bagItems.filter((item) => item.category === 'ball' && Number(item.quantity) > 0);
    },
    fieldClasses() {
      return [
        this.fieldState.weather ? `weather-${this.fieldState.weather}` : '',
        this.fieldState.terrain ? `terrain-${this.fieldState.terrain}` : ''
      ].filter(Boolean);
    },
    fieldLabel() {
      const labels = FIELD_LABELS[this.preferences.language] || FIELD_LABELS.fr;
      return [labels[this.fieldState.weather], labels[this.fieldState.terrain]]
        .filter(Boolean)
        .join(' · ');
    },
    audioVolume() {
      return Math.max(0, Math.min(1, Number(this.preferences.masterVolume) / 100));
    }
  },
  watch: {
    active(isActive) {
      if (!isActive) this.resetBattleUi();
    }
  },
  beforeDestroy() {
    this.clearAllTimers();
    if (this.audioContext && typeof this.audioContext.close === 'function') {
      this.audioContext.close().catch(() => {});
    }
  },
  methods: {
    tr(key, parameters) {
      return translate(this.preferences.language, key, parameters);
    },
    localizedAbility(name) {
      return localizeAbilityName(name, this.preferences.language);
    },
    getPokemonSprite(pokemon, side) {
      const id = Number.parseInt(pokemon?.data?.id, 10);
      if (!Number.isInteger(id) || id <= 0) return '';
      const folder = side === 'back' ? 'back' : 'front';
      return `/img/pokemon/${folder}/${id}.png`;
    },
    getPokemonBattleKey(pokemon) {
      return pokemon?.uuid || `${pokemon?.data?.id || 'pokemon'}-${pokemon?.name || pokemon?.truename || ''}`;
    },
    formatBattleHp(pokemon) {
      const currentHp = Math.max(0, Math.round(Number(pokemon?.currentHp) || 0));
      const maxHp = Math.max(1, Math.round(Number(pokemon?.maxHp) || 1));
      return `${currentHp}/${maxHp} PV`;
    },
    moveButtonLabel(index) {
      const moveName = this.currentPokemon?.abilities?.[index];
      if (!moveName) return '-';
      const localizedName = localizeMoveName(moveName, this.preferences.language);
      const currentPp = this.currentPokemon?.movePp?.[index];
      return Number.isFinite(Number(currentPp)) ? `${localizedName} · ${currentPp} PP` : localizedName;
    },
    isMoveUnavailable(index) {
      if (!this.canChooseAction) return true;
      const pokemon = this.currentPokemon;
      if (!pokemon?.abilities?.[index]) return true;
      const pp = Array.isArray(pokemon.movePp) ? pokemon.movePp : [];
      const allEmpty = pokemon.abilities.every((moveName, moveIndex) => !moveName || Number(pp[moveIndex]) <= 0);
      return !allEmpty && Number(pp[index]) <= 0;
    },
    isSwitchUnavailable(pokemon, index) {
      return !this.canChooseAction || index === 0 || Number(pokemon?.currentHp || 0) <= 0;
    },
    setPanel(panel) {
      if (!this.canChooseAction) return;
      this.actionState.patient = false;
      this.actionState.attackPanel = panel === 'attack';
      this.actionState.pokemonPanel = panel === 'pokemon';
      this.actionState.bagPanel = panel === 'bag';
    },
    closePanels() {
      this.actionState.attackPanel = false;
      this.actionState.pokemonPanel = false;
      this.actionState.bagPanel = false;
    },
    openBag() {
      if (!this.canChooseAction) {
        this.showMessage(this.tr('waitTurnBag'));
        return;
      }
      this.setPanel('bag');
      this.$emit('request-bag');
    },
    submitAction(payload, message) {
      if (!this.canChooseAction) return;
      this.unlockAudio();
      this.canAct = false;
      this.$emit('action', payload);
      this.showMessage(message, true);
    },
    requestAction(message) {
      this.canAct = true;
      this.showMessage(message || this.tr('chooseAction'), true);
      this.$emit('request-bag');
    },
    showMessage(message, hold = false) {
      if (!message) return;
      if (this.messageTimer) clearTimeout(this.messageTimer);
      this.messageTimer = null;
      this.actionState.text = message;
      this.messageNonce += 1;
      this.actionState.patient = true;
      this.actionState.attackPanel = false;
      this.actionState.pokemonPanel = false;
      this.actionState.bagPanel = false;
      if (!hold) {
        this.messageTimer = setTimeout(() => {
          this.actionState.patient = false;
          this.messageTimer = null;
        }, 2200);
      }
    },
    updateBattleState(payload = {}) {
      const nextPlayer = payload.player || null;
      const nextOpponent = payload.wildPokemon || null;
      const previousOpponentKey = this.getPokemonBattleKey(this.opponent);
      const previousPlayerKey = this.getPokemonBattleKey(this.currentPokemon);
      const previousOpponentHp = Number(this.opponent?.currentHp);
      const previousPlayerHp = Number(this.currentPokemon?.currentHp);
      this.player = nextPlayer;
      this.opponent = nextOpponent;
      const nextOpponentHp = Number(this.opponent?.currentHp);
      const nextPlayerHp = Number(this.currentPokemon?.currentHp);
      if (previousOpponentKey === this.getPokemonBattleKey(this.opponent)
        && Number.isFinite(previousOpponentHp) && Number.isFinite(nextOpponentHp)) {
        this.triggerHealthFx('wild', nextOpponentHp - previousOpponentHp, nextOpponentHp);
      }
      if (previousPlayerKey === this.getPokemonBattleKey(this.currentPokemon)
        && Number.isFinite(previousPlayerHp) && Number.isFinite(nextPlayerHp)) {
        this.triggerHealthFx('player', nextPlayerHp - previousPlayerHp, nextPlayerHp);
      }
    },
    updateFieldState(payload = {}) {
      this.fieldState.weather = payload.weather?.kind || payload.weather || null;
      this.fieldState.terrain = payload.terrain?.kind || payload.terrain || null;
    },
    getSpriteGeometry(side) {
      const scene = this.$refs.battleScene;
      const anchor = side === 'wild' ? this.$refs.opponentAnchor : this.$refs.playerAnchor;
      const sceneRect = scene?.getBoundingClientRect?.();
      const anchorRect = anchor?.getBoundingClientRect?.();
      const fallbackWidth = Number(sceneRect?.width) || 896;
      const fallbackHeight = Number(sceneRect?.height) || 515;
      if (!sceneRect || !anchorRect) {
        return side === 'wild'
          ? { centerX: fallbackWidth * 0.8, centerY: fallbackHeight * 0.48, bottomY: fallbackHeight * 0.68, width: 120, height: 120 }
          : { centerX: fallbackWidth * 0.2, centerY: fallbackHeight * 0.86, bottomY: fallbackHeight, width: 118, height: 118 };
      }
      const metrics = this.battleSpriteMetrics[side] || { widthRatio: 1, heightRatio: 1 };
      const visibleWidth = anchorRect.width * metrics.widthRatio;
      const visibleHeight = anchorRect.width * metrics.heightRatio;
      return {
        centerX: anchorRect.left - sceneRect.left,
        centerY: anchorRect.top - sceneRect.top - visibleHeight / 2,
        bottomY: anchorRect.top - sceneRect.top,
        width: visibleWidth,
        height: visibleHeight
      };
    },
    getEffectPosition(side) {
      const geometry = this.getSpriteGeometry(side);
      return { left: `${geometry.centerX}px`, top: `${geometry.centerY}px` };
    },
    buildMovePath(actor, damageClass) {
      const sourceSide = actor === 'opponent' ? 'wild' : 'player';
      const targetSide = actor === 'opponent' ? 'player' : 'wild';
      const source = this.getSpriteGeometry(sourceSide);
      const target = damageClass === 'status' ? source : this.getSpriteGeometry(targetSide);
      return {
        startX: source.centerX,
        startY: source.centerY,
        targetX: target.centerX,
        targetY: target.centerY
      };
    },
    buildCapturePath() {
      const source = this.getSpriteGeometry('player');
      const target = this.getSpriteGeometry('wild');
      return {
        startX: source.centerX + source.width * 0.18,
        startY: source.centerY - source.height * 0.12,
        targetX: target.centerX,
        targetY: target.centerY,
        groundY: Math.min(target.bottomY + 13, (this.$refs.battleScene?.clientHeight || 515) - 34)
      };
    },
    calibrateBattleSprite(event, side) {
      if (!['wild', 'player'].includes(side)) return;
      const image = event?.currentTarget;
      const width = Number(image?.naturalWidth);
      const height = Number(image?.naturalHeight);
      if (!image || !width || !height) return;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      try {
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, width, height).data;
        let minX = width;
        let maxX = -1;
        let minY = height;
        let maxY = -1;
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            if (pixels[(y * width + x) * 4 + 3] <= 8) continue;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        }
        if (maxX < minX || maxY < minY) return;
        const visibleHeight = Math.max(1, maxY - minY + 1);
        const visibleWidth = Math.max(1, maxX - minX + 1);
        const visibleExtent = Math.max(visibleWidth, visibleHeight);
        const centerX = (minX + maxX + 1) / 2;
        this.$set(this.battleSpriteMetrics, side, {
          widthRatio: visibleWidth / visibleExtent,
          heightRatio: visibleHeight / visibleExtent
        });
        this.$set(this.battleSpriteStyles, side, {
          '--sprite-image-width': `${(width / visibleExtent) * 100}%`,
          '--sprite-image-left': `${(-centerX / visibleExtent) * 100}%`,
          '--sprite-image-top': `${(-(maxY + 1) / visibleExtent) * 100}%`
        });
      } catch (error) {
        // Le style de secours garde le sprite visible si le canvas est indisponible.
      }
    },
    playMoveAnimation(payload = {}) {
      const actor = payload.actor === 'opponent' ? 'opponent' : 'player';
      const damageClass = ['physical', 'special', 'status'].includes(payload.damageClass)
        ? payload.damageClass
        : 'status';
      this.clearMoveFx();
      this.movePath = this.buildMovePath(actor, damageClass);
      Object.assign(this.battleMoveFx, {
        actor,
        moveName: payload.moveName || '',
        moveType: payload.moveType || 'Normal',
        damageClass,
        visible: true,
        nonce: this.battleMoveFx.nonce + 1
      });
      this.playSound(damageClass === 'status' ? 'status' : 'attack');
      this.moveTimer = setTimeout(() => {
        this.battleMoveFx.visible = false;
        this.moveTimer = null;
      }, damageClass === 'status' ? 850 : 650);
    },
    playMoveResult(payload = {}) {
      const labels = [];
      if (payload.missed) labels.push({ key: 'miss', text: this.tr('missed') });
      if (payload.immune || Number(payload.effectiveness) === 0) labels.push({ key: 'immune', text: this.tr('immune') });
      else if (payload.blocked) labels.push({ key: 'blocked', text: this.tr('blocked') });
      if (payload.critical) labels.push({ key: 'critical', text: this.tr('critical') });
      if (Number(payload.effectiveness) > 1) labels.push({ key: 'super', text: this.tr('superEffective') });
      if (Number(payload.effectiveness) > 0 && Number(payload.effectiveness) < 1) {
        labels.push({ key: 'resisted', text: this.tr('resisted') });
      }
      if (!labels.length) return;
      if (this.resultTimer) clearTimeout(this.resultTimer);
      this.resultFx.actor = payload.actor === 'player' ? 'opponent' : 'player';
      this.resultFx.labels = labels;
      this.resultFx.nonce += 1;
      this.resultFx.visible = true;
      if (payload.missed) this.playSound('miss');
      else if (payload.critical) this.playSound('critical');
      this.resultTimer = setTimeout(() => {
        this.resultFx.visible = false;
        this.resultTimer = null;
      }, 1150);
    },
    triggerHealthFx(target, delta, nextHp) {
      if (!target || !this.attackFx[target]) return;
      const numericDelta = Number(delta);
      if (!Number.isFinite(numericDelta) || numericDelta === 0) return;
      this.clearHealthTimers(target);
      const fxState = this.attackFx[target];
      fxState.amount = Math.max(1, Math.round(Math.abs(numericDelta)));
      fxState.kind = numericDelta > 0 ? 'heal' : 'damage';
      fxState.hit = numericDelta < 0;
      fxState.visible = true;
      fxState.nonce += 1;
      if (numericDelta > 0) this.playSound('heal');
      if (numericDelta < 0 && Number(nextHp) <= 0) this.playSound('ko');
      const hitTimer = setTimeout(() => { fxState.hit = false; }, 300);
      const visibleTimer = setTimeout(() => { fxState.visible = false; }, 980);
      this.healthTimers[target] = [hitTimer, visibleTimer];
    },
    playCaptureAnimation(payload = {}) {
      const itemKey = payload.itemKey || 'pokeball';
      const itemName = payload.itemName || 'Ball';
      const success = Boolean(payload.success);
      const shakes = Math.max(0, Math.min(3, Math.round(Number(payload.shakes) || 0)));
      const pokemonName = payload.wildPokemonName || this.opponent?.truename || 'Pokemon';
      this.clearCaptureTimers();
      Object.assign(this.captureFx, {
        visible: true,
        state: 'throw',
        ballType: itemKey,
        message: this.tr('launched', { item: itemName }),
        nonce: this.captureFx.nonce + 1,
        targetContained: false,
        path: this.buildCapturePath()
      });
      this.playSound('capture');
      const timers = [];
      timers.push(setTimeout(() => {
        this.captureFx.state = 'impact';
        this.captureFx.message = this.tr('hitPokemon', { item: itemName, pokemon: pokemonName });
        this.captureFx.nonce += 1;
        this.playSound('captureTick');
      }, 500));
      timers.push(setTimeout(() => {
        this.captureFx.state = 'absorb';
        this.captureFx.targetContained = true;
        this.captureFx.message = this.tr('absorbed', { pokemon: pokemonName });
        this.captureFx.nonce += 1;
      }, 620));
      timers.push(setTimeout(() => {
        this.captureFx.state = 'drop';
        this.captureFx.message = this.tr('ballDrops');
        this.captureFx.nonce += 1;
      }, 900));
      for (let index = 0; index < shakes; index += 1) {
        timers.push(setTimeout(() => {
          this.captureFx.state = 'shake';
          this.captureFx.message = `Clic… ${index + 1}/${shakes}`;
          this.captureFx.nonce += 1;
          this.playSound('captureTick');
        }, 1080 + index * 300));
      }
      const resultDelay = 1180 + shakes * 300;
      timers.push(setTimeout(() => {
        this.captureFx.state = success ? 'success' : 'fail';
        if (!success) this.captureFx.targetContained = false;
        this.captureFx.message = success
          ? this.tr('captured', { pokemon: pokemonName })
          : this.tr('escaped', { pokemon: pokemonName });
        this.captureFx.nonce += 1;
        this.playSound(success ? 'captureSuccess' : 'miss');
      }, resultDelay));
      timers.push(setTimeout(() => {
        this.captureFx.visible = false;
        this.captureFx.state = 'idle';
        this.captureFx.targetContained = false;
      }, resultDelay + 620));
      this.captureTimers = timers;
    },
    ensureAudioContext() {
      if (!this.soundEnabled || this.audioVolume <= 0) return null;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      if (!this.audioContext) this.audioContext = new AudioContextClass();
      return this.audioContext;
    },
    unlockAudio() {
      const context = this.ensureAudioContext();
      if (context?.state === 'suspended') context.resume().catch(() => {});
    },
    tone(frequency, duration, options = {}) {
      const context = this.ensureAudioContext();
      if (!context || context.state !== 'running') return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + Number(options.delay || 0);
      oscillator.type = options.type || 'sine';
      oscillator.frequency.setValueAtTime(Math.max(40, frequency), start);
      if (options.endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, options.endFrequency), start + duration);
      }
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Number(options.volume || 0.06) * this.audioVolume, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    },
    playSound(kind) {
      if (!this.soundEnabled) return;
      const sounds = {
        attack: () => this.tone(190, 0.16, { type: 'sawtooth', endFrequency: 85, volume: 0.045 }),
        status: () => {
          this.tone(420, 0.18, { volume: 0.035 });
          this.tone(630, 0.2, { delay: 0.08, volume: 0.03 });
        },
        heal: () => [440, 554, 659].forEach((note, index) => this.tone(note, 0.18, { delay: index * 0.08, volume: 0.035 })),
        ko: () => this.tone(220, 0.48, { type: 'square', endFrequency: 55, volume: 0.035 }),
        miss: () => this.tone(260, 0.12, { type: 'triangle', endFrequency: 150, volume: 0.025 }),
        critical: () => {
          this.tone(330, 0.11, { type: 'square', volume: 0.035 });
          this.tone(660, 0.17, { delay: 0.08, type: 'square', volume: 0.03 });
        },
        capture: () => this.tone(520, 0.16, { endFrequency: 260, volume: 0.035 }),
        captureTick: () => this.tone(360, 0.08, { type: 'triangle', volume: 0.025 }),
        captureSuccess: () => [523, 659, 784].forEach((note, index) => this.tone(note, 0.2, { delay: index * 0.1, volume: 0.035 }))
      };
      sounds[kind]?.();
    },
    toggleSound() {
      this.soundEnabled = !this.soundEnabled;
      localStorage.setItem('battleSoundEnabled', String(this.soundEnabled));
      if (this.soundEnabled) {
        this.unlockAudio();
        this.playSound('status');
      }
    },
    clearMoveFx() {
      if (this.moveTimer) clearTimeout(this.moveTimer);
      this.moveTimer = null;
      this.battleMoveFx.visible = false;
    },
    clearCaptureTimers() {
      this.captureTimers.forEach((timer) => clearTimeout(timer));
      this.captureTimers = [];
    },
    clearHealthTimers(target = null) {
      const targets = target ? [target] : ['wild', 'player'];
      targets.forEach((side) => {
        this.healthTimers[side].forEach((timer) => clearTimeout(timer));
        this.healthTimers[side] = [];
      });
    },
    clearAllTimers() {
      if (this.messageTimer) clearTimeout(this.messageTimer);
      if (this.resultTimer) clearTimeout(this.resultTimer);
      this.messageTimer = null;
      this.resultTimer = null;
      this.clearMoveFx();
      this.clearCaptureTimers();
      this.clearHealthTimers();
    },
    resetBattleUi() {
      this.clearAllTimers();
      this.player = null;
      this.opponent = null;
      this.canAct = false;
      Object.assign(this.actionState, {
        patient: false,
        attackPanel: false,
        pokemonPanel: false,
        bagPanel: false,
        text: "pas d'information"
      });
      Object.assign(this.captureFx, { visible: false, state: 'idle', message: '', targetContained: false });
      this.resultFx.visible = false;
      ['wild', 'player'].forEach((side) => {
        Object.assign(this.attackFx[side], { visible: false, hit: false, amount: 0, kind: 'damage' });
      });
      this.fieldState.weather = null;
      this.fieldState.terrain = null;
    }
  }
};
</script>

<style scoped>
.battle-scene {
  position: absolute;
  inset: 0 0 155px;
  overflow: hidden;
  isolation: isolate;
}

.battle-background {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.2) contrast(1.05);
}

.battle-atmosphere {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(circle at 77% 46%, rgba(255, 255, 255, 0.18), transparent 18%),
    linear-gradient(180deg, rgba(50, 92, 140, 0.08), rgba(8, 14, 24, 0.2));
}

.battle-sprite-anchor {
  position: absolute;
  z-index: 55;
  width: var(--sprite-visible-size);
  height: var(--sprite-visible-size);
  pointer-events: none;
  transform-origin: 0 0;
}

.battle-sprite {
  position: absolute;
  left: var(--sprite-image-left, -90%);
  top: var(--sprite-image-top, -160%);
  width: var(--sprite-image-width, 180%);
  max-width: none;
  image-rendering: pixelated;
  transform-origin: 50% 90%;
  animation: battle-sprite-enter 0.55s cubic-bezier(0.2, 0.85, 0.3, 1) both;
}

.battle-hit-shake {
  animation: battle-hit-shake 0.3s linear;
  filter: brightness(1.12) saturate(1.25);
}

.battle-sprite-wild {
  --sprite-visible-size: 120px;
  left: 80%;
  top: 68%;
}

.battle-sprite-player {
  --sprite-visible-size: 118px;
  left: 20%;
  top: 100%;
}

.battle-status {
  position: absolute;
  z-index: 56;
  width: min(285px, 38%);
  min-height: 88px;
  border: 2px solid rgba(15, 18, 23, 0.85);
  border-radius: 16px;
  padding: 10px 12px;
  background: linear-gradient(145deg, rgba(238, 243, 247, 0.95), rgba(210, 220, 228, 0.9));
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.35);
}

.battle-status-hit {
  animation: battle-status-hit 0.35s ease-out;
}

.battle-status-wild {
  top: 28px;
  left: 12px;
}

.battle-status-player {
  right: 12px;
  bottom: 16px;
}

.battle-status-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #1b1f2a;
}

.battle-status-name {
  flex: 1;
  font-size: 11px;
}

.battle-status-lvl {
  font-size: 10px;
}

.battle-status-tier {
  font-size: 10px;
  color: #3a4a7a;
}

.battle-status-details {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 7px;
  color: #354057;
  font-size: 7px;
  line-height: 1.35;
}

.battle-status-details span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
}

.battle-status-ailment {
  margin-left: auto;
  min-width: 38px;
  height: 18px;
  padding: 0 7px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.45px;
  color: #ffffff;
  text-transform: uppercase;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.18), 0 2px 4px rgba(0, 0, 0, 0.2);
}

.status-burn {
  background: linear-gradient(145deg, #ff8b42, #d94716);
}

.status-poison {
  background: linear-gradient(145deg, #ac6cff, #7336d1);
}

.status-badly_poison {
  background: linear-gradient(145deg, #9e52ff, #5f1fb8);
}

.status-paralyze {
  background: linear-gradient(145deg, #f3d44d, #b89416);
  color: #2d2200;
}

.status-sleep {
  background: linear-gradient(145deg, #6f8bff, #415bc8);
}

.status-freeze {
  background: linear-gradient(145deg, #6ad4f7, #2788d7);
}

.status-confusion {
  background: linear-gradient(145deg, #ffa76a, #e06f2a);
}

.status-infatuation {
  background: linear-gradient(145deg, #ff7cb5, #cf3f7b);
}

.status-other {
  background: linear-gradient(145deg, #7f92a8, #516274);
}

.battle-damage-text {
  position: absolute;
  z-index: 57;
  color: #ffeded;
  font-size: clamp(14px, 2.2vw, 20px);
  text-shadow: 0 1px 0 #000, 0 0 8px rgba(255, 65, 65, 0.5);
  pointer-events: none;
  animation: battle-damage-float 0.95s ease-out forwards;
}

.battle-health-heal {
  color: #d9ffe2;
  text-shadow: 0 1px 0 #14301a, 0 0 10px rgba(78, 225, 117, 0.72);
}

.battle-damage-wild {
  margin-top: -42px;
}

.battle-damage-player {
  margin-top: -42px;
}

.battle-action-shell {
  z-index: 60;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 12px;
  min-height: 155px;
  padding: 12px;
  background: linear-gradient(180deg, rgba(15, 17, 29, 0.9), rgba(7, 9, 16, 0.97));
  border-top: 2px solid rgba(95, 120, 173, 0.45);
}

.battle-turn-indicator {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 26px;
  padding: 5px 9px;
  border: 1px solid rgba(135, 151, 190, 0.42);
  border-radius: 999px;
  background: rgba(10, 15, 27, 0.9);
  color: #c6cee0;
  font-size: 7px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.24);
}

.battle-turn-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #78839c;
}

.battle-turn-indicator.is-ready {
  color: #edfff1;
  border-color: rgba(86, 211, 126, 0.6);
}

.battle-turn-indicator.is-ready .battle-turn-dot {
  background: #54df82;
  box-shadow: 0 0 9px rgba(84, 223, 130, 0.85);
  animation: battle-turn-pulse 1.25s ease-in-out infinite;
}

.battle-action-display {
  width: 62%;
  min-height: 128px;
}

.battle-text-box {
  width: 100%;
  min-height: 126px;
  border: 2px solid rgba(93, 136, 255, 0.35);
  background: rgba(21, 27, 43, 0.93);
  color: #f2f5ff;
  border-radius: 12px;
  padding: 12px;
  font-size: 16px;
  line-height: 1.5;
  display: flex;
  align-items: center;
  animation: battle-message-in 0.22s ease-out both;
}

.battle-text-box-muted {
  color: #b9c3de;
}

.battle-grid {
  width: 100%;
  display: grid;
  gap: 8px;
}

.battle-grid-attacks,
.battle-grid-bag {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.battle-grid-pokemon {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.battle-choice-btn {
  border: 1px solid #3f4e7e;
  border-radius: 10px;
  min-height: 58px;
  padding: 8px 10px;
  background: linear-gradient(160deg, #f7f8fe, #d6ddf4);
  color: #1e2640;
  font-size: 9px;
  text-align: left;
  transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
}

.battle-choice-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 12px rgba(9, 16, 38, 0.25);
  filter: brightness(1.04);
}

.battle-choice-btn:disabled,
.battle-main-btn:disabled {
  cursor: not-allowed;
  opacity: 0.42;
  filter: grayscale(0.35);
  transform: none;
  box-shadow: none;
}

.battle-choice-btn:focus-visible,
.battle-main-btn:focus-visible {
  outline: 3px solid #fff2a8;
  outline-offset: 2px;
}

.battle-pokemon-choice {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 7px;
}

.battle-pokemon-choice small {
  color: #526184;
  font-size: 7px;
}

.battle-choice-btn-bag {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.battle-empty-state {
  grid-column: 1 / -1;
  border-radius: 10px;
  border: 1px solid #3d4f79;
  background: rgba(24, 31, 53, 0.9);
  color: #ced8fa;
  font-size: 9px;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
}

.battle-main-actions {
  width: 38%;
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.battle-main-btn {
  border-radius: 11px;
  min-height: 58px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #fbfcff;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2px;
  transition: transform 0.14s ease, filter 0.14s ease;
}

.battle-main-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
}

.action-attack {
  background: linear-gradient(145deg, #d24f5f, #9e2036);
}

.action-bag {
  background: linear-gradient(145deg, #d4a13f, #a5731a);
}

.action-pokemon {
  background: linear-gradient(145deg, #4ea067, #217f4a);
}

.action-flee {
  background: linear-gradient(145deg, #4c82c5, #1c5ea8);
}

.capture-fx-overlay {
  position: absolute;
  inset: 0;
  z-index: 58;
  pointer-events: none;
}

.capture-fx-ring {
  position: absolute;
  left: var(--capture-target-x);
  top: var(--capture-target-y);
  width: 118px;
  height: 118px;
  margin: -59px 0 0 -59px;
  border-radius: 999px;
  border: 3px solid rgba(255, 255, 255, 0.55);
  opacity: 0;
}

.capture-fx-ball {
  position: absolute;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 2px solid #111;
  background: linear-gradient(#d94545 0 48%, #f8f8f8 48% 100%);
  left: var(--capture-start-x);
  top: var(--capture-start-y);
  margin: -22px 0 0 -22px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35);
}

.capture-fx-ball::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 48%;
  height: 3px;
  background: #111;
}

.capture-fx-ball::after {
  content: "";
  position: absolute;
  width: 11px;
  height: 11px;
  border-radius: 999px;
  background: #f3f3f3;
  border: 2px solid #111;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.capture-fx-ball.ball-superball {
  background: linear-gradient(#3f64e0 0 48%, #f8f8f8 48% 100%);
}

.capture-fx-ball.ball-hyperball {
  background: linear-gradient(#2d2d2d 0 48%, #f3d647 48% 100%);
}

.capture-fx-ball.state-throw {
  animation: capture-throw 0.52s cubic-bezier(0.2, 0.72, 0.3, 1) forwards;
}

.capture-fx-ball.state-impact,
.capture-fx-ball.state-absorb {
  left: var(--capture-target-x);
  top: var(--capture-target-y);
  animation: capture-impact 0.28s ease-out both;
}

.capture-fx-ball.state-drop {
  left: var(--capture-target-x);
  top: var(--capture-target-y);
  animation: capture-drop 0.28s cubic-bezier(0.3, 0.05, 0.7, 1) forwards;
}

.capture-fx-ball.state-shake {
  left: var(--capture-target-x);
  top: var(--capture-ground-y);
  animation: capture-shake 0.28s ease-in-out;
}

.capture-fx-ball.state-success {
  left: var(--capture-target-x);
  top: var(--capture-ground-y);
  animation: capture-success 0.62s ease-out forwards;
}

.capture-fx-ball.state-fail {
  left: var(--capture-target-x);
  top: var(--capture-ground-y);
  animation: capture-fail 0.62s ease-out forwards;
}

.capture-fx-ring.ring-impact,
.capture-fx-ring.ring-absorb {
  animation: capture-ring 0.55s ease-out forwards;
}

.capture-fx-ring.ring-success {
  animation: capture-ring-success 0.9s ease-out forwards;
}

.capture-fx-ring.ring-fail {
  animation: capture-ring-fail 0.8s ease-out forwards;
}

.capture-fx-text {
  position: absolute;
  left: 50%;
  bottom: 168px;
  transform: translateX(-50%);
  min-width: 280px;
  text-align: center;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(11, 17, 31, 0.9);
  border: 1px solid rgba(124, 150, 220, 0.42);
  color: #eef3ff;
  font-size: 10px;
}

.capture-fx-beam {
  position: absolute;
  z-index: -1;
  left: var(--capture-target-x);
  top: var(--capture-target-y);
  width: 18px;
  height: 130px;
  opacity: 0;
  transform: translate(-50%, -50%) rotate(90deg);
  background: linear-gradient(90deg, transparent, rgba(255, 77, 77, 0.9), #fff, rgba(255, 77, 77, 0.9), transparent);
  filter: blur(2px) drop-shadow(0 0 8px #ff6767);
}

.capture-fx-overlay.capture-state-absorb .capture-fx-beam {
  animation: capture-beam 0.36s ease-out both;
}

.capture-fx-burst {
  position: absolute;
  left: var(--capture-target-x);
  top: var(--capture-target-y);
  width: 1px;
  height: 1px;
}

.capture-fx-burst i {
  position: absolute;
  width: 5px;
  height: 32px;
  border-radius: 999px;
  opacity: 0;
  transform-origin: 50% 0;
  background: linear-gradient(#fff, rgba(255, 95, 95, 0));
}

.capture-fx-burst i:nth-child(1) { transform: rotate(0deg); }
.capture-fx-burst i:nth-child(2) { transform: rotate(45deg); }
.capture-fx-burst i:nth-child(3) { transform: rotate(90deg); }
.capture-fx-burst i:nth-child(4) { transform: rotate(135deg); }
.capture-fx-burst i:nth-child(5) { transform: rotate(180deg); }
.capture-fx-burst i:nth-child(6) { transform: rotate(225deg); }
.capture-fx-burst i:nth-child(7) { transform: rotate(270deg); }
.capture-fx-burst i:nth-child(8) { transform: rotate(315deg); }

.capture-fx-overlay.capture-state-impact .capture-fx-burst i,
.capture-fx-overlay.capture-state-fail .capture-fx-burst i {
  animation: capture-spark 0.42s ease-out both;
}

.capture-fx-shadow {
  position: absolute;
  left: var(--capture-target-x);
  top: calc(var(--capture-ground-y) + 19px);
  width: 58px;
  height: 13px;
  margin-left: -29px;
  border-radius: 50%;
  opacity: 0;
  background: rgba(10, 18, 16, 0.6);
  filter: blur(4px);
}

.capture-fx-overlay.capture-state-drop .capture-fx-shadow,
.capture-fx-overlay.capture-state-shake .capture-fx-shadow,
.capture-fx-overlay.capture-state-success .capture-fx-shadow,
.capture-fx-overlay.capture-state-fail .capture-fx-shadow {
  opacity: 0.4;
}

.battle-capture-target .battle-sprite {
  transition: opacity 0.2s ease, filter 0.2s ease, transform 0.32s cubic-bezier(0.4, 0, 0.9, 0.4);
}

.battle-capture-target.capture-state-impact .battle-sprite {
  filter: brightness(2.8) saturate(0.4) drop-shadow(0 0 12px #fff);
}

.battle-capture-target.capture-state-absorb .battle-sprite,
.battle-capture-target.capture-target-contained .battle-sprite {
  animation: capture-target-absorb 0.32s cubic-bezier(0.55, 0, 1, 0.45) both !important;
}

.battle-capture-target.capture-target-contained:not(.capture-state-absorb) .battle-sprite {
  animation: none !important;
  opacity: 0;
  transform: translateY(-10px) scale(0.04);
  filter: brightness(4) saturate(0);
}

.battle {
  background: radial-gradient(circle at 50% 30%, #2f3d67 0%, #101624 58%, #070b14 100%);
  width: 100%;
  height: min(670px, calc(100dvh - 56px));
  min-height: 520px;
  position: absolute;
  top: 44px;
  left: 0;
  z-index: 50;
  margin-top: 0;
  transform: none;
  animation: battle-enter 0.48s cubic-bezier(0.2, 0.85, 0.25, 1) both;
}


@keyframes battle-hit-shake {
  0% { transform: translate(0, 0); }
  20% { transform: translate(-5px, 1px) rotate(-2deg); }
  40% { transform: translate(4px, -2px) rotate(2deg); }
  60% { transform: translate(-4px, 2px) rotate(-1deg); }
  80% { transform: translate(3px, -1px) rotate(1deg); }
  100% { transform: translate(0, 0); }
}

.battle-scene::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 53;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.52), transparent 38%);
}

.battle-scene.battle-impact-active::after {
  animation: battle-impact-flash 0.28s ease-out;
}

.battle-move-effect {
  position: absolute;
  z-index: 54;
  width: 66px;
  height: 66px;
  border-radius: 50%;
  pointer-events: none;
  color: var(--battle-move-color);
  background: radial-gradient(circle, #ffffff 0 8%, currentColor 20%, transparent 68%);
  filter: drop-shadow(0 0 10px currentColor);
  left: var(--move-start-x);
  top: var(--move-start-y);
}

.battle-move-effect span {
  position: absolute;
  inset: 11px;
  border: 3px solid currentColor;
  border-radius: 50%;
}

.battle-move-from-player {
  --move-rotation: 150deg;
}

.battle-move-from-opponent {
  --move-rotation: -150deg;
}

.battle-move-physical.battle-move-from-player,
.battle-move-special.battle-move-from-player,
.battle-move-physical.battle-move-from-opponent,
.battle-move-special.battle-move-from-opponent {
  animation: battle-projectile-target 0.62s cubic-bezier(0.3, 0.75, 0.4, 1) both;
}

.battle-move-physical {
  width: 48px;
  height: 48px;
  clip-path: polygon(50% 0, 64% 28%, 100% 20%, 75% 50%, 100% 80%, 64% 72%, 50% 100%, 36% 72%, 0 80%, 25% 50%, 0 20%, 36% 28%);
}

.battle-move-status {
  background: transparent;
  border: 3px solid currentColor;
  box-shadow: 0 0 18px currentColor;
  animation: battle-status-aura 0.82s ease-out both;
}

.battle-move-status span {
  animation: battle-status-orbit 0.82s linear both;
}

.battle-attacking-player {
  animation: battle-lunge-player 0.58s ease-in-out both;
}

.battle-attacking-wild {
  animation: battle-lunge-opponent 0.58s ease-in-out both;
}

@keyframes battle-status-hit {
  0% { transform: scale(1); box-shadow: 0 10px 18px rgba(0, 0, 0, 0.35); }
  45% { transform: scale(1.03); box-shadow: 0 0 0 3px rgba(255, 106, 106, 0.45); }
  100% { transform: scale(1); box-shadow: 0 10px 18px rgba(0, 0, 0, 0.35); }
}

@keyframes battle-damage-float {
  0% { opacity: 0; transform: translate(-50%, 8px) scale(0.8); }
  15% { opacity: 1; transform: translate(-50%, 0) scale(1); }
  80% { opacity: 1; transform: translate(-50%, -26px) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -36px) scale(1.02); }
}

@keyframes battle-enter {
  from { opacity: 0; transform: translateY(8px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes battle-sprite-enter {
  from { opacity: 0; transform: translateY(22px) scale(0.82); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes battle-message-in {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes battle-turn-pulse {
  0%, 100% { transform: scale(0.9); opacity: 0.72; }
  50% { transform: scale(1.18); opacity: 1; }
}

@keyframes battle-impact-flash {
  0% { opacity: 0; }
  35% { opacity: 0.72; }
  100% { opacity: 0; }
}

@keyframes battle-lunge-player {
  0%, 100% { transform: translate(0, 0) scale(1); }
  48% { transform: translate(42px, -22px) scale(1.06); }
}

@keyframes battle-lunge-opponent {
  0%, 100% { transform: translate(0, 0) scale(1); }
  48% { transform: translate(-40px, 20px) scale(1.06); }
}

@keyframes battle-projectile-target {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.45) rotate(0); }
  18% { opacity: 1; }
  82% { opacity: 1; }
  100% { opacity: 0; transform: translate(calc(-50% + var(--move-dx)), calc(-50% + var(--move-dy))) scale(1.15) rotate(var(--move-rotation)); }
}

@keyframes battle-status-aura {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.35); }
  45% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.7); }
}

@keyframes battle-status-orbit {
  from { transform: rotate(0deg) scale(0.7); }
  to { transform: rotate(240deg) scale(1.2); }
}

@keyframes capture-throw {
  0% {
    transform: scale(0.88) rotate(-30deg);
  }
  55% {
    transform: translate(var(--capture-mid-x), var(--capture-mid-y)) scale(1.08) rotate(205deg);
  }
  82% {
    transform: translate(var(--capture-near-x), var(--capture-near-y)) scale(1.02) rotate(330deg);
  }
  100% {
    transform: translate(var(--capture-dx), var(--capture-dy)) scale(1) rotate(390deg);
  }
}

@keyframes capture-impact {
  0% { transform: scale(0.72); filter: brightness(2.5) drop-shadow(0 0 16px #fff); }
  55% { transform: scale(1.2); filter: brightness(1.6) drop-shadow(0 0 12px #ff6b6b); }
  100% { transform: scale(1) rotate(8deg); filter: none; }
}

@keyframes capture-drop {
  0% { transform: translateY(0) rotate(0); }
  72% { transform: translateY(var(--capture-drop-y)) rotate(150deg); }
  88% { transform: translateY(calc(var(--capture-drop-y) - 8px)) scaleY(0.86) rotate(166deg); }
  100% { transform: translateY(var(--capture-drop-y)) rotate(175deg); }
}

@keyframes capture-shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-8px) rotate(-7deg);
  }
  50% {
    transform: translateX(8px) rotate(7deg);
  }
  75% {
    transform: translateX(-5px) rotate(-5deg);
  }
}

@keyframes capture-success {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.16);
  }
  100% {
    transform: scale(0.94);
  }
}

@keyframes capture-fail {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  35% {
    transform: scale(1.12);
  }
  100% {
    transform: scale(1.55);
    opacity: 0;
  }
}

@keyframes capture-ring {
  0% {
    opacity: 0.7;
    transform: scale(0.8);
  }
  100% {
    opacity: 0;
    transform: scale(1.5);
  }
}

@keyframes capture-ring-success {
  0% {
    opacity: 0.9;
    transform: scale(0.8);
    border-color: rgba(126, 239, 165, 0.9);
  }
  100% {
    opacity: 0;
    transform: scale(1.7);
    border-color: rgba(126, 239, 165, 0);
  }
}

@keyframes capture-ring-fail {
  0% {
    opacity: 0.9;
    transform: scale(0.8);
    border-color: rgba(255, 126, 126, 0.9);
  }
  100% {
    opacity: 0;
    transform: scale(1.7);
    border-color: rgba(255, 126, 126, 0);
  }
}

@keyframes capture-beam {
  0% { opacity: 0; transform: translate(-50%, -50%) rotate(90deg) scaleY(0.12); }
  35% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -50%) rotate(90deg) scaleY(1.35); }
}

@keyframes capture-spark {
  0% { opacity: 1; height: 12px; }
  100% { opacity: 0; height: 58px; }
}

@keyframes capture-target-absorb {
  0% { opacity: 1; transform: translateY(0) scale(1); filter: brightness(1) saturate(1); }
  45% { opacity: 0.95; transform: translateY(-5px) scale(0.72, 1.04); filter: brightness(3) saturate(0.2); }
  100% { opacity: 0; transform: translateY(-10px) scale(0.04); filter: brightness(4) saturate(0); }
}


@media (max-width: 720px) {
  .battle {
    position: fixed;
    top: 0;
    height: 100dvh;
    min-height: 560px;
  }

  .battle-scene {
    inset: 0 0 245px;
  }

  .battle-sprite-wild {
    --sprite-visible-size: 98px;
    left: 76%;
    top: 64%;
  }

  .battle-sprite-player {
    --sprite-visible-size: 96px;
    left: 22%;
    top: 100%;
  }

  .battle-status {
    width: min(250px, 58%);
    min-height: 78px;
    padding: 8px 9px;
  }

  .battle-status-wild {
    top: 10px;
    left: 8px;
  }

  .battle-status-player {
    right: 8px;
    bottom: 8px;
  }

  .battle-status-top {
    gap: 5px;
    margin-bottom: 6px;
  }

  .battle-status-name,
  .battle-status-lvl,
  .battle-status-tier {
    font-size: 8px;
  }

  .battle-status-details {
    font-size: 6px;
  }

  .battle-status-details span:last-child {
    display: none;
  }

  .battle-action-shell {
    min-height: 245px;
    padding: 9px;
    flex-direction: column;
    gap: 8px;
  }

  .battle-action-display,
  .battle-main-actions {
    width: 100%;
  }

  .battle-action-display,
  .battle-text-box {
    min-height: 112px;
  }

  .battle-text-box {
    font-size: 11px;
    padding: 10px;
  }

  .battle-main-actions {
    min-height: 102px;
  }

  .battle-main-btn,
  .battle-choice-btn {
    min-height: 46px;
  }

  .battle-grid-pokemon {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-height: 112px;
    overflow-y: auto;
  }

  .battle-turn-indicator {
    top: -28px;
    right: auto;
    left: 50%;
  }

  .capture-fx-text {
    bottom: 12px;
    min-width: min(280px, 86vw);
  }
}

@media (prefers-reduced-motion: reduce) {
  .battle,
  .battle-sprite-anchor,
  .battle-sprite,
  .battle-hit-shake,
  .battle-status-hit,
  .battle-damage-text,
  .battle-text-box,
  .battle-turn-dot,
  .battle-move-effect,
  .capture-fx-ball,
  .capture-fx-ring {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}

.bar {
  width: 100%;
}

.battle-weather-layer,
.battle-terrain-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
}

.weather-rain .battle-weather-layer {
  background: repeating-linear-gradient(
    105deg,
    transparent 0 34px,
    rgba(193, 225, 255, 0.32) 35px 37px,
    transparent 38px 69px
  );
  animation: battle-rain 0.7s linear infinite;
}

.weather-sun .battle-weather-layer {
  background: radial-gradient(circle at 82% 8%, rgba(255, 244, 143, 0.7), transparent 27%);
  mix-blend-mode: screen;
  animation: battle-sun 2.8s ease-in-out infinite alternate;
}

.weather-sandstorm .battle-weather-layer {
  background-image:
    radial-gradient(circle, rgba(230, 196, 121, 0.75) 0 2px, transparent 3px),
    radial-gradient(circle, rgba(195, 151, 69, 0.55) 0 1px, transparent 2px);
  background-size: 56px 41px, 39px 33px;
  animation: battle-sand 1.25s linear infinite;
}

.weather-hail .battle-weather-layer {
  background-image: radial-gradient(circle, rgba(242, 250, 255, 0.92) 0 3px, transparent 4px);
  background-size: 58px 58px;
  animation: battle-hail 1.1s linear infinite;
}

.battle-terrain-layer {
  top: auto;
  height: 46%;
  opacity: 0.48;
}

.terrain-electric_terrain .battle-terrain-layer {
  background: linear-gradient(to top, rgba(255, 229, 61, 0.58), transparent);
  animation: battle-terrain-pulse 1.5s ease-in-out infinite alternate;
}

.terrain-grassy_terrain .battle-terrain-layer {
  background: linear-gradient(to top, rgba(47, 201, 80, 0.5), transparent);
}

.terrain-misty_terrain .battle-terrain-layer {
  background: linear-gradient(to top, rgba(236, 174, 255, 0.58), transparent);
}

.terrain-psychic_terrain .battle-terrain-layer {
  background: linear-gradient(to top, rgba(235, 94, 198, 0.53), transparent);
  animation: battle-terrain-pulse 1.8s ease-in-out infinite alternate;
}

.battle-field-label {
  position: absolute;
  z-index: 12;
  top: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  max-width: 58%;
  padding: 0.34rem 0.65rem;
  border: 1px solid rgba(255, 255, 255, 0.38);
  border-radius: 999px;
  color: #fff;
  background: rgba(7, 16, 29, 0.72);
  font-size: 0.68rem;
  text-align: center;
  backdrop-filter: blur(5px);
}

.battle-result-chip {
  position: relative;
  max-width: 12rem;
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  color: #fff;
  background: rgba(13, 22, 37, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.42);
  font-size: 0.76rem;
  text-align: center;
  animation: battle-result-pop 1.05s ease-out forwards;
}

.battle-result-fx {
  position: absolute;
  z-index: 24;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  pointer-events: none;
  transform: translate(-50%, -125%);
}

.battle-result-chip.result-critical {
  color: #ffe572;
  border-color: #ffe572;
}

.battle-result-chip.result-immune,
.battle-result-chip.result-blocked,
.battle-result-chip.result-miss {
  color: #dce7f5;
}

.battle-result-chip.result-super {
  color: #ffb454;
}

.battle-result-chip.result-resisted {
  color: #b7d9ff;
}

.battle-sound-toggle {
  position: absolute;
  z-index: 30;
  top: 0.7rem;
  right: 0.7rem;
  min-width: 2.2rem;
  height: 2.2rem;
  padding: 0 0.55rem;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 999px;
  color: #fff;
  background: rgba(7, 16, 29, 0.72);
  cursor: pointer;
}

@keyframes battle-rain {
  from { transform: translate3d(-20px, -45px, 0); }
  to { transform: translate3d(20px, 45px, 0); }
}

@keyframes battle-sun {
  from { opacity: 0.55; }
  to { opacity: 0.95; }
}

@keyframes battle-sand {
  from { background-position: 0 0, 0 0; }
  to { background-position: 120px 30px, 85px 18px; }
}

@keyframes battle-hail {
  from { background-position: 0 -70px; }
  to { background-position: 16px 70px; }
}

@keyframes battle-terrain-pulse {
  from { opacity: 0.32; }
  to { opacity: 0.58; }
}

@keyframes battle-result-pop {
  0% { opacity: 0; transform: translateY(8px) scale(0.78); }
  18%, 72% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-10px) scale(0.94); }
}

@media (max-width: 720px) {
  .battle-field-label {
    top: 0.4rem;
    max-width: 64%;
    font-size: 0.58rem;
  }

  .battle-sound-toggle {
    top: 0.38rem;
    right: 0.38rem;
    height: 1.9rem;
    min-width: 1.9rem;
    font-size: 0.72rem;
  }

  .battle-result-chip {
    max-width: 9.5rem;
    font-size: 0.62rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .battle-weather-layer,
  .battle-terrain-layer,
  .battle-result-chip {
    animation: none !important;
  }
}
</style>

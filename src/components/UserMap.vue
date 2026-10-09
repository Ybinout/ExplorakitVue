<template>
  <div :class="['game-root', { 'reduced-game-motion': !preferences.animationsEnabled }]" style="background-color: black;">
    <!-- <navBar></navBar> -->
    <div>
      <div class="game-stage">
      <battle-overlay
        ref="battleOverlay"
        :active="battle"
        :bag-items="bagItems"
        :bag-loading="bagLoading"
        :preferences="preferences"
        @action="handleBattleAction"
        @request-bag="loadBagItems"
      />
      <div class="game-shell">
        <div class="game-header" ref="gameHeader">
          <button class="menu-toggle-btn" @click="toggleMenu">
            {{ tr('menu') }}
          </button>
          <div v-if="isMenuOpen" class="menu-dropdown">
            <button
              v-for="item in menuItems"
              :key="item.key"
              class="menu-dropdown-item"
              @click="handleMenuAction(item.key)"
            >
              {{ menuItemLabel(item) }}
            </button>
          </div>
        </div>
        <div v-if="!battle" class="location-banner">
          <span class="location-pin">◆</span>
          <span>{{ locationLabel }}</span>
          <button v-if="isShopMap" class="location-shop-btn" type="button" @click="openShop">
            {{ tr('openShop') }}
          </button>
        </div>
        <div v-if="isBagOpen" class="bag-panel" ref="bagPanel">
          <div class="bag-title">{{ tr('bag') }}</div>
          <div v-if="bagLoading" class="bag-state">{{ tr('loading') }}</div>
          <div v-else-if="bagError" class="bag-state bag-error">{{ bagError }}</div>
          <div v-else-if="bagItems.length === 0" class="bag-state">{{ tr('emptyBag') }}</div>
          <div v-else class="bag-items">
            <div v-for="item in bagItems" :key="item.key" class="bag-item-row">
              <span class="bag-item-name">{{ item.name }}</span>
              <span class="bag-item-qty">x{{ item.quantity }}</span>
            </div>
          </div>
        </div>
        <div v-if="isAppearancePanelOpen" class="appearance-panel" ref="appearancePanel">
          <div class="appearance-title">{{ tr('appearance') }}</div>
          <div class="appearance-grid">
            <button
              v-for="spriteOption in availableSprites"
              :key="spriteOption.key"
              class="appearance-option"
              :class="{ 'is-active': selectedSprite === spriteOption.key }"
              @click="selectPlayerSprite(spriteOption.key)"
            >
              <img class="appearance-preview" :src="spriteOption.src" alt="">
              <span class="appearance-label">{{ spriteOption.label }}</span>
            </button>
          </div>
        </div>
        <div v-if="isTeamPanelOpen" class="team-panel" ref="teamPanel">
          <div class="team-title">{{ tr('team') }}</div>
          <div v-if="teamLoading" class="team-state">{{ tr('loading') }}</div>
          <div v-else-if="teamError" class="team-state team-error">{{ teamError }}</div>
          <div v-else-if="teamPokemons.length === 0" class="team-state">{{ tr('noPokemon') }}</div>
          <div v-else class="team-list">
            <div
              v-for="(pokemon, index) in teamPokemons"
              :key="pokemon.uuid || `slot-${index}`"
              class="team-row"
            >
              <div class="team-row-visual">
                <img
                  v-if="pokemon.spriteId"
                  class="team-pokemon-sprite"
                  :src="getPokemonFrontSprite(pokemon.spriteId)"
                  alt=""
                >
              </div>
              <div class="team-row-main">
                <div class="team-row-top">
                  <span class="team-slot">#{{ index + 1 }}</span>
                  <span class="team-row-name">{{ pokemon.name }}</span>
                  <span class="team-level">lv.{{ pokemon.level }}</span>
                </div>
                <div class="team-hp-track">
                  <div
                    class="team-hp-fill"
                    :class="getTeamHpBarClass(pokemon)"
                    :style="{ width: `${getTeamHpPercent(pokemon)}%` }"
                  ></div>
                </div>
                <div class="team-row-meta">
                  {{ tr('hp') }} {{ pokemon.currentHp }} / {{ pokemon.maxHp }}
                </div>
                <div class="team-row-meta">{{ tr('ability') }} : {{ localizedAbility(pokemon.passiveAbility) || tr('noAbility') }}</div>
                <select
                  class="team-held-item-select"
                  :value="pokemon.heldItem || ''"
                  :disabled="teamSaving"
                  @change="equipHeldItem(pokemon, $event.target.value)"
                >
                  <option value="">{{ tr('noHeldItem') }}</option>
                  <option v-for="item in heldItemChoices(pokemon)" :key="item.key" :value="item.key">
                    {{ item.name }}{{ item.quantity ? ` (x${item.quantity})` : '' }}
                  </option>
                </select>
              </div>
              <div class="team-row-actions">
                <button
                  class="team-order-btn"
                  :disabled="index === 0 || teamSaving"
                  @click="moveTeamPokemon(index, 'up')"
                >
                  â†‘
                </button>
                <button
                  class="team-order-btn"
                  :disabled="index === teamPokemons.length - 1 || teamSaving"
                  @click="moveTeamPokemon(index, 'down')"
                >
                  â†“
                </button>
              </div>
            </div>
          </div>
          <button
            class="team-save-btn"
            :disabled="!teamDirty || teamSaving"
            @click="saveTeamOrder"
          >
            {{ teamSaving ? tr('saving') : tr('saveOrder') }}
          </button>
        </div>
        <game-info-panels
          :active="activeInfoPanel"
          :loading="menuDataLoading"
          :pokedex="pokedexState"
          :progress="progressionState"
          :save-state="saveState"
          :preferences="preferences"
          @close="closeInfoPanel"
          @save="saveGameNow"
          @update-preferences="updatePreferences"
        />
        <shop-panel
          :visible="shop.visible"
          :catalog="shop.catalog"
          :items="bagItems"
          :money="shop.money"
          :loading="shop.loading"
          :error="shop.error"
          :language="preferences.language"
          @close="closeShop"
          @buy="buyShopItem"
        />
        <canvas class="test" ref="monCanvas"></canvas>
        <div
          v-if="showMobileControls && !battle"
          :class="['mobile-controls-shell', { 'dialogue-active': textImageSequence.length > 0 }]"
        >
          <div v-if="textImageSequence.length === 0" class="mobile-dpad" aria-label="Pad directionnel">
            <button
              class="mobile-dpad-btn mobile-dpad-up"
              @pointerdown.prevent="onMobileDirectionPress('z', $event)"
              @pointerup.prevent="onMobileDirectionRelease('z', $event)"
              @pointercancel.prevent="onMobileDirectionRelease('z', $event)"
              @pointerleave.prevent="onMobileDirectionRelease('z', $event)"
            >
              ▲
            </button>
            <button
              class="mobile-dpad-btn mobile-dpad-left"
              @pointerdown.prevent="onMobileDirectionPress('q', $event)"
              @pointerup.prevent="onMobileDirectionRelease('q', $event)"
              @pointercancel.prevent="onMobileDirectionRelease('q', $event)"
              @pointerleave.prevent="onMobileDirectionRelease('q', $event)"
            >
              ◀
            </button>
            <div class="mobile-dpad-center"></div>
            <button
              class="mobile-dpad-btn mobile-dpad-right"
              @pointerdown.prevent="onMobileDirectionPress('d', $event)"
              @pointerup.prevent="onMobileDirectionRelease('d', $event)"
              @pointercancel.prevent="onMobileDirectionRelease('d', $event)"
              @pointerleave.prevent="onMobileDirectionRelease('d', $event)"
            >
              ▶
            </button>
            <button
              class="mobile-dpad-btn mobile-dpad-down"
              @pointerdown.prevent="onMobileDirectionPress('s', $event)"
              @pointerup.prevent="onMobileDirectionRelease('s', $event)"
              @pointercancel.prevent="onMobileDirectionRelease('s', $event)"
              @pointerleave.prevent="onMobileDirectionRelease('s', $event)"
            >
              ▼
            </button>
          </div>
          <button
            v-if="textImageSequence.length === 0"
            :class="['mobile-action-a', { 'dialogue-action': textImageSequence.length > 0 }]"
            @pointerdown.prevent="triggerMobileActionA"
          >
            A
          </button>
        </div>
        <div v-if="interactionNotice" class="interaction-notice">
          {{ interactionNotice }}
        </div>
        <div v-if="interactionChoice.visible" class="interaction-popup">
          <div class="interaction-card">
            <div class="interaction-title">{{ tr('interaction') }}</div>
            <div class="interaction-text">{{ tr('withPlayer', { name: interactionChoice.targetName }) }}</div>
            <div class="interaction-actions">
              <button class="interaction-btn" @click="sendPlayerInteractionChoice('chat')">{{ tr('chat') }}</button>
              <button
                class="interaction-btn"
                :disabled="!interactionChoice.battleAvailable"
                @click="sendPlayerInteractionChoice('battle')"
              >
                {{ tr('battle') }}
              </button>
              <button class="interaction-btn interaction-btn-muted" @click="closeInteractionChoice">{{ tr('cancel') }}</button>
            </div>
            <div v-if="!interactionChoice.battleAvailable" class="interaction-note">
              {{ tr('battleUnavailable') }}
            </div>
          </div>
        </div>
        <div v-if="incomingRequest.visible" class="interaction-popup">
          <div class="interaction-card">
            <div class="interaction-title">{{ tr('requestReceived') }}</div>
            <div class="interaction-text">
              {{ tr('requestSentence', {
                name: incomingRequest.fromName,
                kind: incomingRequest.type === 'battle' ? tr('aBattle') : tr('aChat')
              }) }}
            </div>
            <div class="interaction-actions">
              <button class="interaction-btn" @click="respondToInteractionRequest(true)">{{ tr('accept') }}</button>
              <button class="interaction-btn interaction-btn-muted" @click="respondToInteractionRequest(false)">{{ tr('refuse') }}</button>
            </div>
          </div>
        </div>
        <div v-if="chatSession.visible" class="chat-panel">
          <div class="chat-header">
            <span class="chat-title">Chat: {{ chatSession.peerName }}</span>
            <button class="chat-close-btn" @click="closeChatSession()">{{ tr('close') }}</button>
          </div>
          <div class="chat-messages" ref="chatMessages">
            <div
              v-for="message in chatMessages"
              :key="message.id"
              class="chat-message-row"
              :class="{ 'is-me': message.fromId === (socket && socket.id), 'is-system': message.system }"
            >
              <span class="chat-author" v-if="!message.system">{{ message.fromName }}:</span>
              <span class="chat-message">{{ message.message }}</span>
            </div>
          </div>
          <div class="chat-input-row">
            <input
              v-model="chatDraft"
              class="chat-input"
              type="text"
              maxlength="300"
              :placeholder="tr('writeMessage')"
              @keydown.enter.prevent="submitChatMessage"
            >
            <button class="chat-send-btn" @click="submitChatMessage">{{ tr('send') }}</button>
          </div>
        </div>
      </div>
      </div>
      <div v-if="textImageSequence.length > 0" class="dialogue-backdrop"></div>
      <div v-if="textImageSequence.length > 0" class="dialogue-layer">
        <TextWithImage
          :sequence="textImageSequence"
          :char-per-step="preferences.textSpeed"
          :sound-volume="preferences.masterVolume / 100"
          :sound-enabled="preferences.masterVolume > 0"
          @sequence-end="clearSequence"
        />
      </div>
      <button
        v-if="showMobileControls && !battle && textImageSequence.length > 0"
        class="mobile-dialogue-action-top"
        @pointerdown.prevent="triggerMobileActionA"
      >
        A
      </button>
    </div>

    <!-- <button @click="toto()">TEST</button> -->
  </div>
</template>

<script>
import api from "@/services/api";
import { getSession } from "@/services/session";
import { createGameSocket } from "@/services/realtime";
import {
  getDirectionFromAction,
  getDirectionFromDelta,
  getSpriteLabel,
  getSpriteOrder,
  getTeamHpPercent,
  normalizeSpriteName,
  normalizeTeamPokemon
} from "@/services/gameView";
import BattleOverlay from './battle/BattleOverlay.vue';
import GameInfoPanels from './menu/GameInfoPanels.vue';
import ShopPanel from './shop/ShopPanel.vue';
import TextWithImage from './TextWithImage.vue';
import { loadGamePreferences, saveGamePreferences } from '@/services/gamePreferences';
import { localizeAbilityName, translate } from '@/services/i18n';
import { getMapLocationLabel } from '@/services/mapLocations';
// import navBar from "./NavBar.vue"
/* eslint-disable */

const MOVEMENT_INPUT_INTERVAL_MS = 150;
const MOVEMENT_INTERPOLATION_MS = 175;
const MAP_ASSET_ALIASES = Object.freeze({
  ville1_arene: 'gen_arene1',
  ville1_shop: 'gen_shop1'
});
const mapAssetContext = require.context(
  '@/assets',
  false,
  /^\.\/(?:start|etage2?|maison2?|pk[12]|route[1-6]|ville1|centre|cave[12]|gen_(?:route[1-8]|ville[1-5]|arene[1-5]|maison[1-3]|shop1))(?:_f)?\.png$/
);

function resolveMapAsset(mapName, foreground = false) {
  const suffix = foreground ? '_f' : '';
  const assetMapName = MAP_ASSET_ALIASES[mapName] || mapName;
  return mapAssetContext(`./${assetMapName}${suffix}.png`);
}

export default {
  components: {
    // navBar
    TextWithImage,
    BattleOverlay,
    GameInfoPanels,
    ShopPanel
  },
  data() {
    return {
      endSentences: null,
      textImageSequence: [],
      socket: null,
      animationFrameId: null,
      lastAnimationTimestamp: null,
      movementIntervalId: null,
      lock: false,
      battle: false,
      user: {
        nom: '',
        mdp: ''
      },
      keysPressed: {
        z: false,
        q: false,
        s: false,
        d: false
      },
      foregroundImage: null,
      mapImage: null,
      map: "start",
      players: {},
      pnjs: [],
      pnjSpriteSources: {},
      pnjSpriteSheets: {},
      currentPlayer: { x: 512, y: 288, targetX: 512, targetY: 288 }, // Ajout de targetX et targetY,
      isMenuOpen: false,
      isBagOpen: false,
      isAppearancePanelOpen: false,
      isTeamPanelOpen: false,
      activeInfoPanel: '',
      menuDataLoading: false,
      pokedexState: { total: 493, seen: 0, caught: 0, entries: [] },
      progressionState: { flags: {}, quests: [], badges: [], completedNpcBattles: [], money: 0 },
      shop: {
        visible: false,
        loading: false,
        error: '',
        catalog: [],
        money: 0
      },
      saveState: {
        status: 'idle',
        lastSyncedAt: null,
        message: 'La position et l’équipe sont sauvegardées automatiquement.'
      },
      preferences: loadGamePreferences(),
      bagItems: [],
      bagLoading: false,
      bagError: '',
      teamLoading: false,
      teamSaving: false,
      teamError: '',
      teamId: null,
      teamPokemons: [],
      teamDirty: false,
      currentUserId: null,
      currentUsername: '',
      showMobileControls: false,
      interactionChoice: {
        visible: false,
        targetId: null,
        targetName: '',
        battleAvailable: false
      },
      incomingRequest: {
        visible: false,
        requestId: null,
        type: 'chat',
        fromId: null,
        fromName: ''
      },
      interactionNotice: '',
      interactionNoticeTimer: null,
      chatSession: {
        visible: false,
        chatId: null,
        peerId: null,
        peerName: ''
      },
      chatMessages: [],
      chatDraft: '',
      menuItems: [
        { key: 'pokedex' },
        { key: 'progress' },
        { key: 'pokemon' },
        { key: 'appearance' },
        { key: 'bag' },
        { key: 'save' },
        { key: 'options' }
      ],


      spriteSheet: null,
      spriteSheets: {},
      availableSprites: [],
      selectedSprite: 'sprite.png',
      // spriteWidth: 32,  // Change ces valeurs selon la taille de tes sprites
      // spriteHeight: 32,
      spriteAnimations: {
        down: [
          { x: 0, y: 0 },
          { x: 64, y: 0 },
          { x: 128, y: 0 },
          { x: 192, y: 0 }
        ],
        left: [
          { x: 0, y: 64 },
          { x: 64, y: 64 },
          { x: 128, y: 64 },
          { x: 192, y: 64 }
        ],
        right: [
          { x: 0, y: 128 },
          { x: 64, y: 128 },
          { x: 128, y: 128 },
          { x: 192, y: 128 }
        ],
        up: [
          { x: 0, y: 192 },
          { x: 64, y: 192 },
          { x: 128, y: 192 },
          { x: 192, y: 192 }
        ]
      },

      spriteWidth: 64,  // Largeur rÃ©elle de chaque sprite
      spriteHeight: 64,



    };
  },
  computed: {
    locationLabel() {
      return getMapLocationLabel(this.map, this.preferences.language);
    },
    isShopMap() {
      return ['ville1_shop', 'gen_shop1', 'gen_shop_ville2_1', 'gen_shop_ville5_1'].includes(this.map);
    },
    heldBagItems() {
      if (!Array.isArray(this.bagItems)) return [];
      return this.bagItems.filter((item) => item.category === 'held' && Number(item.quantity) > 0);
    }
  },
  watch: {
    battle(isInBattle) {
      if (isInBattle) {
        this.releaseAllMovementKeys();
      }
    }
  },

  methods: {
    tr(key, parameters) {
      return translate(this.preferences.language, key, parameters);
    },
    localizedAbility(name) {
      return localizeAbilityName(name, this.preferences.language);
    },
    getDirectionFromAction,
    getDirectionFromDelta,
    getSpriteLabel,
    getSpriteOrder,
    getTeamHpPercent,
    normalizeSpriteName,
    normalizeTeamPokemon,
    getPokemonFrontSprite(spriteId) {
      const id = Number.parseInt(spriteId, 10);
      return Number.isInteger(id) && id > 0 ? `/img/pokemon/front/${id}.png` : '';
    },
    closeShop() {
      this.shop.visible = false;
      this.shop.error = '';
    },
    applyShopState(payload = {}) {
      if (!payload.success) return;
      if (Array.isArray(payload.catalog)) this.shop.catalog = payload.catalog;
      if (Array.isArray(payload.items)) this.bagItems = payload.items;
      this.shop.money = Number(payload.money) || 0;
      this.shop.loading = false;
      this.shop.error = '';
      this.shop.visible = true;
    },
    getShopError(reason) {
      const isEnglish = this.preferences.language === 'en';
      const messages = isEnglish
        ? {
            insufficient_funds: 'You do not have enough money.',
            not_in_shop: 'You must be inside a shop.',
            invalid_quantity: 'Invalid quantity.',
            item_unavailable: 'This item is unavailable.',
            battle_active: 'The shop is unavailable during battle.'
          }
        : {
            insufficient_funds: "Tu n'as pas assez d'argent.",
            not_in_shop: 'Tu dois être dans une boutique.',
            invalid_quantity: 'Quantité invalide.',
            item_unavailable: "Cet objet n'est pas disponible.",
            battle_active: 'La boutique est indisponible pendant un combat.'
          };
      return messages[reason] || (isEnglish ? 'The shop is temporarily unavailable.' : 'La boutique est temporairement indisponible.');
    },
    openShop() {
      if (!this.socket || !this.socket.connected || !this.isShopMap) return;
      this.shop.visible = true;
      this.shop.loading = true;
      this.shop.error = '';
      this.socket.emit('requestShop', (payload = {}) => {
        this.shop.loading = false;
        if (!payload.success) {
          this.shop.error = this.getShopError(payload.reason);
          return;
        }
        this.applyShopState(payload);
      });
    },
    buyShopItem({ itemKey, quantity }) {
      if (!this.socket || !this.socket.connected || this.shop.loading) return;
      this.shop.loading = true;
      this.shop.error = '';
      this.socket.emit('buyShopItem', { itemKey, quantity }, (payload = {}) => {
        this.shop.loading = false;
        if (!payload.success) {
          this.shop.error = this.getShopError(payload.reason);
          if (Number.isFinite(Number(payload.money))) this.shop.money = Number(payload.money);
          return;
        }
        if (Array.isArray(payload.items)) this.bagItems = payload.items;
        this.shop.money = Number(payload.money) || 0;
        if (payload.progression) this.progressionState = payload.progression;
        const boughtItem = this.shop.catalog.find((item) => item.key === itemKey);
        this.showInteractionNotice(`${boughtItem?.name || itemKey} ×${quantity}`);
      });
    },

    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    },
    getStoredUserId() {
      return getSession()?.id || null;
    },
    getStoredUsername() {
      const session = getSession();
      const usernameCandidate = session?.username || session?.name || session?.nom || '';
      return typeof usernameCandidate === 'string' ? usernameCandidate.trim() : '';
    },
    getStoredToken() {
      const token = getSession()?.token;
      return typeof token === 'string' ? token : '';
    },
    showInteractionNotice(message, duration = 2600) {
      if (!message) return;
      this.interactionNotice = message;
      if (this.interactionNoticeTimer) {
        clearTimeout(this.interactionNoticeTimer);
        this.interactionNoticeTimer = null;
      }
      this.interactionNoticeTimer = setTimeout(() => {
        this.interactionNotice = '';
        this.interactionNoticeTimer = null;
      }, duration);
    },
    getInteractionReasonMessage(reason) {
      const messages = {
        already_in_battle: 'Action impossible: un des joueurs est deja en combat.',
        chat_active: 'Action impossible: tu as deja un chat ouvert.',
        target_chat_active: 'Action impossible: ce joueur est deja en chat.',
        pending_request: 'Tu as deja une demande en attente.',
        target_pending_request: 'Ce joueur a deja une demande en attente.',
        invalid_target: 'Cible invalide.',
        target_not_found: 'Joueur introuvable.',
        target_not_available: 'Le joueur cible n est plus disponible.',
        target_in_battle: 'Ce joueur est deja en combat.',
        target_too_far: 'Le joueur est trop loin.',
        requester_no_pokemon: 'Tu n as aucun Pokemon en etat de combattre.',
        target_no_pokemon: 'Ce joueur n a aucun Pokemon en etat de combattre.',
        invalid_type: 'Type d interaction invalide.',
        player_disconnected: 'Demande annulee: joueur deconnecte.',
        expired: 'Demande expiree.'
      };
      return messages[reason] || 'Action impossible pour le moment.';
    },
    closeInteractionChoice() {
      this.interactionChoice.visible = false;
      this.interactionChoice.targetId = null;
      this.interactionChoice.targetName = '';
      this.interactionChoice.battleAvailable = false;
    },
    clearIncomingRequest() {
      this.incomingRequest.visible = false;
      this.incomingRequest.requestId = null;
      this.incomingRequest.type = 'chat';
      this.incomingRequest.fromId = null;
      this.incomingRequest.fromName = '';
    },
    sendPlayerInteractionChoice(type) {
      if (!this.socket || !this.socket.connected) return;
      if (!this.interactionChoice.visible || !this.interactionChoice.targetId) return;

      const normalizedType = type === 'combat' ? 'battle' : type;
      if (!['chat', 'battle'].includes(normalizedType)) return;
      if (normalizedType === 'battle' && !this.interactionChoice.battleAvailable) {
        this.showInteractionNotice('Combat indisponible.');
        return;
      }

      this.socket.emit('playerInteractionChoice', {
        targetId: this.interactionChoice.targetId,
        type: normalizedType
      });

      this.closeInteractionChoice();
      this.showInteractionNotice(`Demande de ${normalizedType === 'battle' ? 'combat' : 'chat'} envoyee.`);
    },
    respondToInteractionRequest(accept) {
      if (!this.socket || !this.socket.connected) return;
      if (!this.incomingRequest.visible || !this.incomingRequest.requestId) return;

      this.socket.emit('interactionRequestDecision', {
        requestId: this.incomingRequest.requestId,
        accept: !!accept
      });

      if (!accept) {
        this.showInteractionNotice('Demande refusee.');
      }
      this.clearIncomingRequest();
    },
    appendChatMessage(messagePayload = {}) {
      const messageText = typeof messagePayload.message === 'string' ? messagePayload.message : '';
      if (!messageText) return;

      this.chatMessages.push({
        id: messagePayload.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        fromId: messagePayload.fromId || null,
        fromName: messagePayload.fromName || 'Systeme',
        message: messageText,
        system: !!messagePayload.system
      });
      this.$nextTick(() => {
        const container = this.$refs.chatMessages;
        if (!container) return;
        container.scrollTop = container.scrollHeight;
      });
    },
    startChatSession(payload = {}) {
      this.chatSession.visible = true;
      this.chatSession.chatId = payload.chatId || null;
      this.chatSession.peerId = payload.peerId || null;
      this.chatSession.peerName = payload.peerName || 'Joueur';
      this.chatMessages = [];
      this.chatDraft = '';
      this.closeInteractionChoice();
      this.clearIncomingRequest();
      this.appendChatMessage({
        message: `Chat ouvert avec ${this.chatSession.peerName}.`,
        system: true
      });
    },
    closeChatSession(localOnly = false) {
      const activeChatId = this.chatSession.chatId;
      if (this.socket && this.socket.connected && activeChatId && !localOnly) {
        this.socket.emit('leaveChat', { chatId: activeChatId });
      }

      this.chatSession.visible = false;
      this.chatSession.chatId = null;
      this.chatSession.peerId = null;
      this.chatSession.peerName = '';
      this.chatMessages = [];
      this.chatDraft = '';
    },
    submitChatMessage() {
      if (!this.socket || !this.socket.connected) return;
      if (!this.chatSession.visible || !this.chatSession.chatId) return;

      const message = typeof this.chatDraft === 'string' ? this.chatDraft.trim() : '';
      if (!message) return;

      this.socket.emit('chatMessage', {
        chatId: this.chatSession.chatId,
        message
      });
      this.chatDraft = '';
    },
    updateMobileControlsVisibility() {
      this.showMobileControls = window.innerWidth <= 920;
      if (!this.showMobileControls) {
        this.releaseAllMovementKeys();
      }
    },
    syncPlayerIdleState() {
      if (!this.socket || !this.socket.id) return;
      const player = this.players[this.socket.id];
      if (!player) return;

      if (!this.keysPressed.z && !this.keysPressed.q && !this.keysPressed.s && !this.keysPressed.d) {
        player.isMoving = false;
        player.animationFrame = 0;
      }
    },
    releaseAllMovementKeys() {
      this.keysPressed.z = false;
      this.keysPressed.q = false;
      this.keysPressed.s = false;
      this.keysPressed.d = false;
      this.syncPlayerIdleState();
    },
    onMobileDirectionPress(directionKey, event) {
      if (this.battle) return;
      if (!Object.prototype.hasOwnProperty.call(this.keysPressed, directionKey)) return;

      if (event && event.target && typeof event.target.setPointerCapture === 'function' && event.pointerId !== undefined) {
        try {
          event.target.setPointerCapture(event.pointerId);
        } catch (error) {
          // no-op
        }
      }

      this.releaseAllMovementKeys();
      this.keysPressed[directionKey] = true;
      this.restartMovementInput();
    },
    onMobileDirectionRelease(directionKey, event) {
      if (!Object.prototype.hasOwnProperty.call(this.keysPressed, directionKey)) return;
      this.keysPressed[directionKey] = false;

      if (event && event.target && typeof event.target.releasePointerCapture === 'function' && event.pointerId !== undefined) {
        try {
          event.target.releasePointerCapture(event.pointerId);
        } catch (error) {
          // no-op
        }
      }

      this.syncPlayerIdleState();
    },
    triggerMobileActionA() {
      if (this.battle) return;
      if (this.textImageSequence.length > 0) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space' }));
        return;
      }
      this.espace();
    },
    loadAvailableSprites() {
      const spriteContext = require.context('@/assets', false, /^\.\/sprite\d*\.png$/);
      const options = spriteContext.keys()
        .map((contextKey) => {
          const spriteName = contextKey.replace('./', '');
          const normalizedName = this.normalizeSpriteName(spriteName);
          return {
            key: normalizedName,
            label: this.getSpriteLabel(normalizedName),
            src: spriteContext(contextKey)
          };
        })
        .sort((left, right) => this.getSpriteOrder(left.key) - this.getSpriteOrder(right.key));

      if (options.length === 0) {
        options.push({
          key: 'sprite.png',
          label: 'Sprite 1',
          src: require('@/assets/sprite.png')
        });
      }

      this.availableSprites = options;
      options.forEach((option) => {
        this.ensureSpriteSheet(option.key);
      });
    },
    ensureSpriteSheet(spriteName) {
      const normalizedSprite = this.normalizeSpriteName(spriteName);
      if (this.spriteSheets[normalizedSprite]) {
        return this.spriteSheets[normalizedSprite];
      }

      const spriteOption = this.availableSprites.find((option) => option.key === normalizedSprite);
      const spriteSource = spriteOption ? spriteOption.src : require('@/assets/sprite.png');
      const image = new Image();
      image.src = spriteSource;
      this.$set(this.spriteSheets, normalizedSprite, image);
      return image;
    },
    hydratePlayerSprite(player) {
      if (!player) return;
      const normalizedSprite = this.normalizeSpriteName(player.sprite);
      this.$set(player, 'sprite', normalizedSprite);
      this.ensureSpriteSheet(normalizedSprite);
    },
    getSpriteSheetForPlayer(player) {
      const normalizedSprite = this.normalizeSpriteName(player?.sprite || this.selectedSprite);
      const resolvedSprite = this.spriteSheets[normalizedSprite]
        ? normalizedSprite
        : 'sprite.png';

      if (!this.spriteSheets[resolvedSprite]) {
        this.ensureSpriteSheet(resolvedSprite);
      }

      return this.spriteSheets[resolvedSprite] || this.spriteSheet;
    },
    loadPnjSpriteSources() {
      const pnjContext = require.context('@/assets/pnj', false, /\.(png|jpe?g|webp)$/);
      const playerSpriteContext = require.context('@/assets', false, /^\.\/sprite\d*\.png$/);
      const sources = {};
      const registerSources = (context) => context.keys().forEach((contextKey) => {
        const filename = contextKey.replace('./', '').toLowerCase();
        sources[filename] = context(contextKey);
      });
      registerSources(pnjContext);
      registerSources(playerSpriteContext);
      this.pnjSpriteSources = sources;
    },
    normalizePnjSpriteName(spriteName) {
      if (typeof spriteName !== 'string') return '';
      return spriteName.trim().toLowerCase();
    },
    ensurePnjSpriteSheet(spriteName) {
      const normalizedName = this.normalizePnjSpriteName(spriteName);
      if (!normalizedName) return null;
      if (this.pnjSpriteSheets[normalizedName]) {
        return this.pnjSpriteSheets[normalizedName];
      }

      const resolvedSource = this.pnjSpriteSources[normalizedName];
      if (!resolvedSource) return null;

      const image = new Image();
      image.src = resolvedSource;
      this.$set(this.pnjSpriteSheets, normalizedName, image);
      return image;
    },
    syncPnjs(payload = {}) {
      const rawPnjs = Array.isArray(payload?.pnjs) ? payload.pnjs : [];
      this.pnjs = rawPnjs
        .map((pnj) => ({
          ...pnj,
          x: Number(pnj?.x),
          y: Number(pnj?.y),
          sprite: this.normalizePnjSpriteName(pnj?.sprite || 'perso1.png')
        }))
        .filter((pnj) => Number.isFinite(pnj.x) && Number.isFinite(pnj.y));

      this.pnjs.forEach((pnj) => {
        this.ensurePnjSpriteSheet(pnj.sprite);
      });

      this.drawPlayers();
    },
    drawPnjs(context) {
      if (!Array.isArray(this.pnjs) || this.pnjs.length === 0) return;

      const idleFrame = this.spriteAnimations?.down?.[0] || { x: 0, y: 0 };
      for (const pnj of this.pnjs) {
        const spriteSheet = this.ensurePnjSpriteSheet(pnj.sprite);
        if (!spriteSheet || !spriteSheet.complete) continue;

        const drawX = pnj.x * 32 + 16 - 32;
        const drawY = pnj.y * 32 + 16 - 42;
        const treatAsSpriteSheet =
          spriteSheet.naturalWidth >= this.spriteWidth * 2 &&
          spriteSheet.naturalHeight >= this.spriteHeight * 2;

        if (treatAsSpriteSheet) {
          context.drawImage(
            spriteSheet,
            idleFrame.x,
            idleFrame.y,
            this.spriteWidth,
            this.spriteHeight,
            drawX,
            drawY,
            this.spriteWidth,
            this.spriteHeight
          );
        } else {
          context.drawImage(spriteSheet, drawX, drawY, this.spriteWidth, this.spriteHeight);
        }
      }
    },
    selectPlayerSprite(spriteName) {
      const normalizedSprite = this.normalizeSpriteName(spriteName);
      this.selectedSprite = normalizedSprite;
      this.ensureSpriteSheet(normalizedSprite);

      if (this.socket && this.socket.id && this.players[this.socket.id]) {
        this.$set(this.players[this.socket.id], 'sprite', normalizedSprite);
      }

      if (this.socket && this.socket.connected) {
        this.socket.emit('setSprite', { sprite: normalizedSprite });
      }
    },
    async loadBagItems() {
      const userId = this.currentUserId || this.getStoredUserId();
      if (!userId) {
        this.bagError = 'Utilisateur non connecte.';
        this.bagItems = [];
        return;
      }

      this.bagLoading = true;
      this.bagError = '';

      try {
        const response = await api.get(`/users/${userId}/items`);
        const receivedItems = response?.data?.items;
        this.bagItems = Array.isArray(receivedItems) ? receivedItems : [];
      } catch (error) {
        console.error('Erreur pendant le chargement du sac:', error);
        this.bagError = 'Impossible de charger le sac.';
        this.bagItems = [];
      } finally {
        this.bagLoading = false;
      }
    },
    applyTeamPokemons(teamSource = []) {
      const normalizedTeam = (Array.isArray(teamSource) ? teamSource : [])
        .map((pokemon, index) => this.normalizeTeamPokemon(pokemon, index))
        .sort((a, b) => (a.position || 0) - (b.position || 0));

      this.teamPokemons = normalizedTeam;
      this.teamDirty = false;
    },
    getTeamHpBarClass(pokemon) {
      const hpPercent = this.getTeamHpPercent(pokemon);
      if (hpPercent > 50) return 'hp-good';
      if (hpPercent > 20) return 'hp-mid';
      return 'hp-low';
    },
    heldItemChoices(pokemon) {
      const choices = [...this.heldBagItems];
      const currentKey = pokemon?.heldItem;
      if (currentKey && !choices.some((item) => item.key === currentKey)) {
        choices.unshift({ key: currentKey, name: currentKey, quantity: 0 });
      }
      return choices;
    },
    async equipHeldItem(pokemon, itemKey) {
      if (!this.teamId || !pokemon?.uuid || this.teamSaving) return;
      this.teamSaving = true;
      this.teamError = '';
      try {
        let result;
        if (this.socket?.connected) {
          result = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Le serveur ne repond pas.')), 5000);
            this.socket.emit('equipHeldItem', {
              teamId: this.teamId,
              pokemonUuid: pokemon.uuid,
              itemKey: itemKey || null
            }, (payload = {}) => {
              clearTimeout(timeout);
              if (!payload.success) reject(new Error(payload.message || "Impossible d'equiper cet objet."));
              else resolve(payload);
            });
          });
        } else {
          const response = await api.put(
            `/teams/${this.teamId}/pokemons/${pokemon.uuid}/held-item`,
            { itemKey: itemKey || null }
          );
          result = response?.data || {};
        }
        pokemon.heldItem = result.heldItem || null;
        if (Array.isArray(result.items)) this.bagItems = result.items;
      } catch (error) {
        this.teamError = error?.response?.data?.message || error?.message || "Impossible d'equiper cet objet.";
        await this.loadTeamPokemons();
      } finally {
        this.teamSaving = false;
      }
    },
    async loadTeamPokemons() {
      const userId = this.currentUserId || this.getStoredUserId();
      if (!userId) {
        this.teamError = 'Utilisateur non connecte.';
        this.teamPokemons = [];
        return;
      }

      this.teamLoading = true;
      this.teamError = '';

      try {
        const teamResponse = await api.get(`/users/${userId}/team`);
        const teamId = teamResponse?.data?.id;
        if (!teamId) {
          this.teamPokemons = [];
          this.teamId = null;
          return;
        }

        this.teamId = teamId;

        const teamFromEquipeRoute = Array.isArray(teamResponse?.data?.pokemons)
          ? teamResponse.data.pokemons
          : [];
        let teamFromApi = [];
        try {
          const pokemonsResponse = await api.get(`/teams/${teamId}/pokemons`);
          if (Array.isArray(pokemonsResponse?.data)) {
            teamFromApi = pokemonsResponse.data;
          } else if (Array.isArray(pokemonsResponse?.data?.pokemons)) {
            teamFromApi = pokemonsResponse.data.pokemons;
          }
        } catch (pokemonError) {
          if (pokemonError?.response?.status !== 404) {
            throw pokemonError;
          }
        }

        if (teamFromApi.length > 0 && teamFromEquipeRoute.length > 0) {
          const dbByUuid = new Map(teamFromApi.map((pokemon) => [pokemon.uuid, pokemon]));
          const mergedTeam = teamFromEquipeRoute.map((pokemon) => {
            const dbPokemon = dbByUuid.get(pokemon?.uuid);
            if (!dbPokemon) return pokemon;
            return {
              ...pokemon,
              ...dbPokemon,
              currentHp: Number(dbPokemon?.current_hp ?? pokemon?.currentHp ?? 0),
              position: Number(dbPokemon?.position ?? pokemon?.position ?? 0)
            };
          });
          teamFromApi = mergedTeam;
        } else if (teamFromEquipeRoute.length > 0) {
          teamFromApi = teamFromEquipeRoute;
        }

        this.applyTeamPokemons(teamFromApi);
      } catch (error) {
        console.error("Erreur pendant le chargement de l'equipe:", error);
        this.teamError = "Impossible de charger l'equipe.";
        this.teamPokemons = [];
      } finally {
        this.teamLoading = false;
      }
    },
    moveTeamPokemon(index, direction) {
      if (this.teamSaving) return;
      if (!Array.isArray(this.teamPokemons)) return;
      if (index < 0 || index >= this.teamPokemons.length) return;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= this.teamPokemons.length) return;

      const reordered = [...this.teamPokemons];
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      this.teamPokemons = reordered;
      this.teamDirty = true;
    },
    async saveTeamOrder() {
      if (this.teamSaving || !this.teamDirty) return;
      if (!this.teamId) {
        this.teamError = "Equipe introuvable.";
        return;
      }

      const orderedUuids = this.teamPokemons.map((pokemon) => pokemon.uuid).filter(Boolean);
      if (!orderedUuids.length || orderedUuids.length !== this.teamPokemons.length) {
        this.teamError = "Impossible de sauvegarder l'ordre.";
        return;
      }

      this.teamSaving = true;
      this.teamError = '';

      try {
        await api.put(
          `/teams/${this.teamId}/pokemons/reorder`,
          { orderedUuids }
        );

        await this.loadTeamPokemons();
        this.teamDirty = false;
      } catch (error) {
        console.error("Erreur pendant la sauvegarde de l'ordre d'equipe:", error);
        this.teamError = "Sauvegarde impossible.";
      } finally {
        this.teamSaving = false;
      }
    },
    handleBattleAction(payload = {}) {
      if (!this.socket || !this.socket.connected) return;
      const action = typeof payload.action === 'string' ? payload.action : '';
      if (!['attack', 'flee', 'change', 'bag'].includes(action)) return;
      this.socket.emit('actionResponse', payload);
    },
    menuItemLabel(item) {
      if (item.key !== 'save') return this.tr(item.key);
      if (this.saveState.status === 'syncing') return this.tr('saving');
      if (this.saveState.status === 'synced') return `${this.tr('save')} ✓`;
      if (this.saveState.status === 'error') return `${this.tr('save')} !`;
      return this.tr('save');
    },
    closeLegacyPanels() {
      this.isBagOpen = false;
      this.isAppearancePanelOpen = false;
      this.isTeamPanelOpen = false;
    },
    closeInfoPanel() {
      this.activeInfoPanel = '';
    },
    async loadPokedexState() {
      const userId = this.currentUserId || this.getStoredUserId();
      if (!userId) return;
      const response = await api.get(`/users/${userId}/pokedex`);
      this.pokedexState = response?.data || this.pokedexState;
    },
    async loadProgressionState() {
      const userId = this.currentUserId || this.getStoredUserId();
      if (!userId) return;
      const response = await api.get(`/users/${userId}/progress`);
      this.progressionState = response?.data || this.progressionState;
    },
    updatePreferences(nextPreferences) {
      this.preferences = saveGamePreferences(nextPreferences);
      if (this.preferences.masterVolume > 0) {
        this.$refs.battleOverlay?.unlockAudio();
      }
    },
    async openServerPanel(panel) {
      this.closeLegacyPanels();
      this.activeInfoPanel = panel;
      this.menuDataLoading = true;
      try {
        if (panel === 'pokedex') await this.loadPokedexState();
        if (panel === 'progress') await this.loadProgressionState();
      } catch (error) {
        console.error(`Erreur chargement panneau ${panel}:`, error);
        this.showInteractionNotice('Impossible de synchroniser ces données.');
      } finally {
        this.menuDataLoading = false;
      }
    },
    async saveGameNow() {
      if (!this.socket?.connected) {
        this.saveState = { ...this.saveState, status: 'error', message: 'Serveur déconnecté. Reconnexion en cours…' };
        return;
      }
      this.saveState = { ...this.saveState, status: 'syncing', message: 'Envoi de la progression au serveur…' };
      try {
        const result = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Le serveur ne répond pas.')), 8000);
          this.socket.emit('requestGameSave', (payload = {}) => {
            clearTimeout(timeout);
            if (!payload.success) reject(new Error(payload.message || 'Synchronisation impossible.'));
            else resolve(payload);
          });
        });
        if (result.progression) this.progressionState = result.progression;
        if (result.pokedex) this.pokedexState = result.pokedex;
        this.saveState = {
          status: 'synced',
          lastSyncedAt: result.syncedAt,
          message: 'Position, équipe et progression enregistrées sur le serveur.'
        };
      } catch (error) {
        this.saveState = {
          ...this.saveState,
          status: 'error',
          message: error.message || 'Synchronisation impossible.'
        };
      }
    },
    async handleMenuAction(actionKey) {
      this.isMenuOpen = false;

      if (actionKey === 'pokedex' || actionKey === 'progress') {
        await this.openServerPanel(actionKey);
        return;
      }

      if (actionKey === 'save') {
        this.closeLegacyPanels();
        this.activeInfoPanel = 'save';
        await this.saveGameNow();
        return;
      }

      if (actionKey === 'options') {
        this.closeLegacyPanels();
        this.activeInfoPanel = 'options';
        return;
      }

      this.closeInfoPanel();
      if (actionKey === 'bag') {
        this.isAppearancePanelOpen = false;
        this.isTeamPanelOpen = false;
        if (this.isBagOpen) {
          this.isBagOpen = false;
          return;
        }

        this.isBagOpen = true;
        await this.loadBagItems();
        return;
      }

      if (actionKey === 'pokemon') {
        this.isAppearancePanelOpen = false;
        this.isBagOpen = false;
        if (this.isTeamPanelOpen) {
          this.isTeamPanelOpen = false;
          return;
        }

        this.isTeamPanelOpen = true;
        await Promise.all([this.loadTeamPokemons(), this.loadBagItems()]);
        return;
      }

      if (actionKey === 'appearance') {
        this.isBagOpen = false;
        this.isTeamPanelOpen = false;
        this.isAppearancePanelOpen = !this.isAppearancePanelOpen;
        return;
      }

      this.closeLegacyPanels();
    },
    handleOutsideMenuClick(event) {
      const header = this.$refs.gameHeader;
      const bagPanel = this.$refs.bagPanel;
      const appearancePanel = this.$refs.appearancePanel;
      const teamPanel = this.$refs.teamPanel;

      if (this.isMenuOpen && header && !header.contains(event.target)) {
        this.isMenuOpen = false;
      }

      if (this.isBagOpen) {
        const clickedOnHeader = header && header.contains(event.target);
        const clickedOnBagPanel = bagPanel && bagPanel.contains(event.target);
        if (!clickedOnHeader && !clickedOnBagPanel) {
          this.isBagOpen = false;
        }
      }

      if (this.isAppearancePanelOpen) {
        const clickedOnHeader = header && header.contains(event.target);
        const clickedOnAppearancePanel = appearancePanel && appearancePanel.contains(event.target);
        if (!clickedOnHeader && !clickedOnAppearancePanel) {
          this.isAppearancePanelOpen = false;
        }
      }

      if (this.isTeamPanelOpen) {
        const clickedOnHeader = header && header.contains(event.target);
        const clickedOnTeamPanel = teamPanel && teamPanel.contains(event.target);
        if (!clickedOnHeader && !clickedOnTeamPanel) {
          this.isTeamPanelOpen = false;
        }
      }
    },
    importAllImages(r) {
      let images = {};
      r.keys().forEach((item) => {
        images[item.replace('./', '')] = r(item);
      });
      return images;
    },
    updateTextImageSequence(sentences) {
      const images = this.importAllImages(require.context('@/assets/image', false, /\.(png|jpe?g|svg)$/));

      // Mettre Ã  jour `textImageSequence` avec les sentences reÃ§ues du serveur
      this.textImageSequence = sentences.map(sentence => {
        return { text: sentence.text, image: images[sentence.imageName] };
      });
    },
    clearSequence() {
      // Remet Ã  zÃ©ro la sÃ©quence, ce qui cache le composant enfant
      this.socket.emit('onEndDialogue', this.endSentences);
      this.textImageSequence = [];
    },


    espace() {
      console.log('espace');
      if (this.interactionChoice.visible || this.incomingRequest.visible) {
        return;
      }
      if (this.chatSession.visible) {
        return;
      }
      if (this.textImageSequence.length <= 0) {
        this.socket.emit('Space', { action: 'Space' });
      }

    },


    loadMapImage() {
      this.mapImage = new Image();

      // Gestionnaire d'erreurs pour le chargement de l'image
      this.mapImage.onerror = (err) => {
        console.error('Error loading the image:', err);
      };

      // Une fois l'image chargÃ©e, vous pouvez redessiner le canvas (optionnel)
      this.mapImage.onload = () => {
        this.drawPlayers();
      };

      // DÃ©finir la source de l'image, ce qui dÃ©clenchera le tÃ©lÃ©chargement de l'image
      try {
        this.mapImage.src = resolveMapAsset(this.map);
      } catch (error) {
        console.error(`Image de carte introuvable: ${this.map}`, error);
      }

    },
    loadForegroundImage() {
      const requestedMap = this.map;
      const foregroundImage = new Image();

      foregroundImage.onerror = () => {
        if (this.map === requestedMap) {
          this.foregroundImage = null;
          this.drawPlayers();
        }
      };

      foregroundImage.onload = () => {
        if (this.map === requestedMap) {
          this.drawPlayers();
        }
      };

      try {
        foregroundImage.src = resolveMapAsset(requestedMap, true);
        this.foregroundImage = foregroundImage;
      } catch (error) {
        // Certaines cartes n'ont volontairement pas de couche de premier plan.
        this.foregroundImage = null;
        this.drawPlayers();
      }
    },
    handleKeydown(e) {
      if (e.key === 'Escape') {
        if (this.interactionChoice.visible) {
          this.closeInteractionChoice();
        }
        if (this.incomingRequest.visible) {
          this.respondToInteractionRequest(false);
        }
        if (this.chatSession.visible) {
          this.closeChatSession();
        }
        this.isMenuOpen = false;
        this.isBagOpen = false;
        this.isTeamPanelOpen = false;
        if (this.battle) {
          this.$refs.battleOverlay?.closePanels();
        }
      }
      if (Object.prototype.hasOwnProperty.call(this.keysPressed, e.key)) {
        const wasMoving = Object.values(this.keysPressed).some(Boolean);
        this.keysPressed[e.key] = true;
        if (!wasMoving) this.restartMovementInput();
      }
      if (e.code === 'Space') {
        this.espace();
      }
    },
    handleKeyup(e) {
      if (Object.prototype.hasOwnProperty.call(this.keysPressed, e.key)) {
        this.keysPressed[e.key] = false;
        this.syncPlayerIdleState();
      }
    },
    startGameLoop() {
      if (this.animationFrameId !== null) return;
      this.lastAnimationTimestamp = null;
      this.animationFrameId = window.requestAnimationFrame(this.animate);
    },
    stopGameLoop() {
      if (this.animationFrameId === null) return;
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      this.lastAnimationTimestamp = null;
    },
    startMovementLoop() {
      if (this.movementIntervalId !== null) return;
      this.movementIntervalId = window.setInterval(
        this.updatePlayerPosition,
        MOVEMENT_INPUT_INTERVAL_MS
      );
    },
    stopMovementLoop() {
      if (this.movementIntervalId === null) return;
      window.clearInterval(this.movementIntervalId);
      this.movementIntervalId = null;
    },
    restartMovementInput() {
      this.stopMovementLoop();
      this.updatePlayerPosition();
      this.startMovementLoop();
    },
    animate(timestamp) {
      if (!this.$refs.monCanvas) {
        this.animationFrameId = null;
        return;
      }

      const now = Number.isFinite(timestamp) ? timestamp : performance.now();
      const frameDelta = this.lastAnimationTimestamp === null
        ? 0
        : Math.min(50, Math.max(0, now - this.lastAnimationTimestamp));
      this.lastAnimationTimestamp = now;

      for (const playerId in this.players) {
        const player = this.players[playerId];

        if (player.startTime && player.endTime) {
          const t = (now - player.startTime) / (player.endTime - player.startTime);

          if (t < 1) {
            player.x = player.startX + t * (player.targetX - player.startX);
            player.y = player.startY + t * (player.targetY - player.startY);
            player.animationFrame += frameDelta / 90;
          } else {
            player.x = player.targetX;
            player.y = player.targetY;
            const isLocalPlayer = this.socket && playerId === this.socket.id;
            player.isMoving = isLocalPlayer && Object.values(this.keysPressed).some(Boolean);
            delete player.startX;
            delete player.startY;
            delete player.startTime;
            delete player.endTime;
          }
        }
      }

      this.drawPlayers();
      this.animationFrameId = window.requestAnimationFrame(this.animate);
    }

    ,
    clearAllPlayers() {
      const currentPlayerId = this.socket.id;
      for (const id in this.players) {
        if (id !== currentPlayerId) {
          this.$delete(this.players, id);
        }
      }
    }
    ,
    updatePlayerPosition() {
      if (!this.socket || !this.socket.connected || !this.socket.id) return;

      let action = null;
      if (this.keysPressed.z) action = 'move_z';
      if (this.keysPressed.q) action = 'move_q';
      if (this.keysPressed.s) action = 'move_s';
      if (this.keysPressed.d) action = 'move_d';

      if (action && !this.lock) {
        const player = this.players[this.socket.id];
        if (!player) return;

        this.socket.emit('playerAction', action);

        player.direction = this.getDirectionFromAction(action);  // Une fonction pour dÃ©terminer la direction
        player.isMoving = true;
      }
    },
    drawPlayers() {
      const canvas = this.$refs.monCanvas;
      if (!canvas) return;
      const c = canvas.getContext('2d');
      if (!c) return;

      // Clear the canvas for the new render
      c.clearRect(0, 0, canvas.width, canvas.height);

      // Fill the canvas with the map image
      if (this.mapImage) {
        c.drawImage(this.mapImage, 0, 0, canvas.width, canvas.height);
      }

      this.drawPnjs(c);

      // Loop through all the players and draw them
      for (const playerId in this.players) {
        const player = this.players[playerId];

        // DÃ©finit une direction par dÃ©faut si la direction actuelle est indÃ©finie
        if (!player.direction) {
          player.direction = 'down';  // DÃ©finit la direction par dÃ©faut
        }

        const animation = this.spriteAnimations[player.direction];

        // VÃ©rifie si l'animation est valide
        if (animation) {
          // VÃ©rifie que player.animationFrame est un nombre
          if (typeof player.animationFrame !== 'number') {
            console.error(`Invalid animationFrame for player: ${player.animationFrame}`);
            player.animationFrame = 0;  // Remet Ã  zÃ©ro si ce n'est pas un nombre
          }

          // VÃ©rifie que animation.length est un nombre valide
          if (typeof animation.length !== 'number' || animation.length <= 0) {
            console.error(`Invalid animation length for direction: ${player.direction}`);
            continue;  // Ignore ce joueur si l'animation est invalide
          }

          const currentFrame = Math.floor(player.animationFrame) % animation.length;
          const sprite = animation[currentFrame];
          const playerSpriteSheet = this.getSpriteSheetForPlayer(player);

          // Assure-toi que le sprite existe avant d'essayer de dessiner
          if (sprite && playerSpriteSheet && playerSpriteSheet.complete) {
            c.drawImage(
              playerSpriteSheet,
              sprite.x, sprite.y, this.spriteWidth, this.spriteHeight,
              player.x - 32, player.y - 42, this.spriteWidth, this.spriteHeight  // DÃ©cale la position Y de 32 pixels
            );
          } else {
            console.error(`Invalid sprite frame: ${currentFrame}`);
          }
        } else {
          console.error(`Invalid direction: ${player.direction}`);
        }
      }

      // Dessiner les Ã©lÃ©ments de premier plan si nÃ©cessaire
      if (this.foregroundImage) {
        c.drawImage(this.foregroundImage, 0, 0, canvas.width, canvas.height);
      }
    },








  },
  mounted() {



    this.loadMapImage();
    this.loadForegroundImage();
    this.loadAvailableSprites();
    this.loadPnjSpriteSources();
    this.spriteSheet = this.ensureSpriteSheet('sprite.png');
    // const userId = 1;
    const userId = this.getStoredUserId();
    const username = this.getStoredUsername();
    const token = this.getStoredToken();
    this.currentUserId = userId;
    this.currentUsername = username;

    if (!userId || !token) {
      console.error("Utilisateur non connecte, impossible d'ouvrir la socket de jeu.");
      this.$router.push('/connexion');
      return;
    }

    this.socket = createGameSocket(token);

    this.socket.on("connect", () => {
      console.log(`ConnectÃ© au serveur en tant qu'utilisateur ${userId}`);
      this.saveState = {
        ...this.saveState,
        status: this.saveState.lastSyncedAt ? 'synced' : 'idle',
        message: 'Connecté : sauvegarde automatique active.'
      };
    });

    this.socket.on('progressionState', (payload = {}) => {
      this.progressionState = payload;
      if (payload.syncedAt) {
        this.saveState = { ...this.saveState, lastSyncedAt: payload.syncedAt };
      }
    });

    this.socket.on('pokedexState', (payload = {}) => {
      this.pokedexState = payload;
    });

    this.socket.on('pokedexChanged', () => {
      this.loadPokedexState().catch((error) => console.error('Erreur actualisation Pokédex:', error));
    });

    this.socket.on('progressionNotice', (payload = {}) => {
      this.showInteractionNotice(payload.message || 'Progression mise à jour.', 3800);
    });

    this.socket.on('saveSyncState', (payload = {}) => {
      this.saveState = {
        ...this.saveState,
        status: payload.status || this.saveState.status,
        lastSyncedAt: payload.syncedAt || this.saveState.lastSyncedAt,
        message: payload.message || this.saveState.message
      };
    });

    this.socket.on('playersList', (allPlayers) => {
      console.log('Mise Ã  jour de la liste des joueurs:', allPlayers);
      this.players = allPlayers;
      for (const id in this.players) {
        if (!this.players[id].direction) {
          this.$set(this.players[id], 'direction', 'down');
        }
        if (typeof this.players[id].animationFrame !== 'number') {
          this.$set(this.players[id], 'animationFrame', 0);
        }
        this.hydratePlayerSprite(this.players[id]);
      }

      const me = this.players[this.socket.id];
      if (me) {
        const normalizedSprite = this.normalizeSpriteName(me.sprite);
        this.selectedSprite = normalizedSprite;
        this.ensureSpriteSheet(normalizedSprite);
      }
      if (me && me.currentmap && me.currentmap !== this.map) {
        this.map = me.currentmap;
        this.loadMapImage();
        this.loadForegroundImage();
      }
    });

    this.socket.on('pnjsList', (payload) => {
      this.syncPnjs(payload);
    });

    this.socket.on('interactionChoice', (payload = {}) => {
      const targetId = payload?.targetId || null;
      const targetName = payload?.targetName || 'Joueur';
      if (!targetId) return;

      this.clearIncomingRequest();
      this.interactionChoice.visible = true;
      this.interactionChoice.targetId = targetId;
      this.interactionChoice.targetName = targetName;
      this.interactionChoice.battleAvailable = !!payload?.battleAvailable;
    });

    this.socket.on('incomingInteractionRequest', (payload = {}) => {
      if (!payload?.requestId || !payload?.fromId) return;
      this.closeInteractionChoice();
      this.incomingRequest.visible = true;
      this.incomingRequest.requestId = payload.requestId;
      this.incomingRequest.type = payload.type === 'battle' ? 'battle' : 'chat';
      this.incomingRequest.fromId = payload.fromId;
      this.incomingRequest.fromName = payload.fromName || 'Joueur';
    });

    this.socket.on('interactionRequestSent', (payload = {}) => {
      const typeLabel = payload.type === 'battle' ? 'combat' : 'chat';
      this.showInteractionNotice(`Demande de ${typeLabel} envoyee a ${payload.targetName || 'joueur'}.`);
    });

    this.socket.on('interactionRequestAccepted', (payload = {}) => {
      this.clearIncomingRequest();
      this.closeInteractionChoice();
      const typeLabel = payload.type === 'battle' ? 'combat' : 'chat';
      this.showInteractionNotice(`Demande de ${typeLabel} acceptee.`);
    });

    this.socket.on('interactionRequestDeclined', (payload = {}) => {
      this.clearIncomingRequest();
      this.closeInteractionChoice();
      const typeLabel = payload.type === 'battle' ? 'combat' : 'chat';
      this.showInteractionNotice(`Demande de ${typeLabel} refusee.`);
    });

    this.socket.on('interactionRequestExpired', () => {
      this.clearIncomingRequest();
      this.closeInteractionChoice();
      this.showInteractionNotice('La demande a expire.');
    });

    this.socket.on('interactionRejected', (payload = {}) => {
      const message = payload.reason === 'trainer_team_unavailable'
        ? "Ce dresseur n'est pas prêt à combattre."
        : "Cette interaction n'est plus disponible. Rapproche-toi et réessaie.";
      this.showInteractionNotice(message);
    });

    this.socket.on('interactionRequestCancelled', (payload = {}) => {
      this.clearIncomingRequest();
      this.closeInteractionChoice();
      this.showInteractionNotice(this.getInteractionReasonMessage(payload.reason));
    });

    this.socket.on('interactionRequestResolved', (payload = {}) => {
      if (payload.accepted === false) {
        this.showInteractionNotice('Demande refusee.');
      }
      this.clearIncomingRequest();
    });

    this.socket.on('interactionRequestFailed', (payload = {}) => {
      this.clearIncomingRequest();
      this.closeInteractionChoice();
      this.showInteractionNotice(this.getInteractionReasonMessage(payload.reason));
    });

    this.socket.on('chatSessionStarted', (payload = {}) => {
      if (!payload?.chatId) return;
      this.startChatSession(payload);
      this.showInteractionNotice(`Chat lance avec ${payload.peerName || 'joueur'}.`);
    });

    this.socket.on('chatMessage', (payload = {}) => {
      if (!this.chatSession.visible) return;
      if (!payload?.chatId || payload.chatId !== this.chatSession.chatId) return;
      this.appendChatMessage(payload);
    });

    this.socket.on('chatSessionEnded', (payload = {}) => {
      if (!this.chatSession.visible) return;
      if (payload?.chatId && payload.chatId !== this.chatSession.chatId) return;
      this.closeChatSession(true);
      this.showInteractionNotice('Chat ferme.');
    });

    this.socket.on('teamStateChanged', async (payload = {}) => {
      const teamFromPayload = Array.isArray(payload?.equipe?.pokemons)
        ? payload.equipe.pokemons
        : [];
      if (teamFromPayload.length > 0) {
        this.applyTeamPokemons(teamFromPayload);
      }

      if (this.isTeamPanelOpen) {
        await this.loadTeamPokemons();
      }
    });

    this.socket.on('blackout', (payload = {}) => {
      const healedTeam = Array.isArray(payload?.equipe?.pokemons)
        ? payload.equipe.pokemons
        : [];
      if (healedTeam.length > 0) {
        this.applyTeamPokemons(healedTeam);
      }
      this.showInteractionNotice(
        payload.message || 'Ton equipe a ete soignee et tu as ete ramene en lieu sur.'
      );
    });

    this.socket.on('playerLeft', ({ id }) => {
      console.log('le player qui leave', id);

      delete this.players[id]
      // this.drawPlayers();
    });

    this.socket.on('dialogue', (sentences) => {
      if (sentences && sentences.length > 0) {
        this.updateTextImageSequence(sentences[0]);
        this.endSentences = sentences[1]
      } else {
        this.textImageSequence = [];
      }
    });

    this.socket.on('newPlayer', ({ id, player }) => {
      this.$set(this.players, id, player);
      this.$set(this.players[id], 'direction', player.direction || 'down');
      this.$set(this.players[id], 'animationFrame', typeof player.animationFrame === 'number' ? player.animationFrame : 0);
      this.hydratePlayerSprite(this.players[id]);
      console.log('new player tsurement');
    });



    this.socket.on('endbattle', () => {
      this.battle = false;
      this.lock = false;
      this.loadTeamPokemons();
    });

    this.socket.on('playerMoved', ({ id, player }) => {
      console.log('il mouve uwu');
      if (this.players[id]) {
        const startX = this.players[id].x;
        const startY = this.players[id].y;
        this.players[id].startX = startX;
        this.players[id].startY = startY;
        this.players[id].targetX = player.x;
        this.players[id].targetY = player.y;
        if (player && player.sprite) {
          this.$set(this.players[id], 'sprite', this.normalizeSpriteName(player.sprite));
          this.ensureSpriteSheet(this.players[id].sprite);
        }
        const resolvedDirection = this.getDirectionFromDelta(
          startX,
          startY,
          player.x,
          player.y,
          player.direction || this.players[id].direction || 'down'
        );
        this.$set(this.players[id], 'direction', resolvedDirection);
        this.players[id].isMoving = true;
        if (typeof this.players[id].animationFrame !== 'number') {
          this.players[id].animationFrame = 0;
        }
        this.players[id].startTime = performance.now();
        this.players[id].endTime = this.players[id].startTime + MOVEMENT_INTERPOLATION_MS;
      }
      // console.log('le player qui bouge :', this.players[id]);
    });

    this.socket.on('newmap', ({ mapname, playersList }) => {
      this.clearAllPlayers();
      this.players = playersList
      this.pnjs = [];
      this.closeInteractionChoice();
      this.clearIncomingRequest();
      for (const id in this.players) {
        if (!this.players[id].direction) {
          this.$set(this.players[id], 'direction', 'down');
        }
        if (typeof this.players[id].animationFrame !== 'number') {
          this.$set(this.players[id], 'animationFrame', 0);
        }
        this.hydratePlayerSprite(this.players[id]);
      }

      this.map = mapname;
      if (!['ville1_shop', 'gen_shop1', 'gen_shop_ville2_1', 'gen_shop_ville5_1'].includes(mapname)) {
        this.closeShop();
      }
      this.loadMapImage();
      this.loadForegroundImage();
      this.drawPlayers();
    });

    this.socket.on('playerDisconnected', ({ id }) => {
      this.$delete(this.players, id);
    });

    this.socket.on('playerJoined', (data) => {
      this.players[data.id] = data.player;
      this.$set(this.players[data.id], 'direction', data.player.direction || 'down');
      this.$set(this.players[data.id], 'animationFrame', typeof data.player.animationFrame === 'number' ? data.player.animationFrame : 0);
      this.hydratePlayerSprite(this.players[data.id]);
      // console.log('la liste des joueurs:', this.players);
    });

    this.socket.on('playerAppearanceUpdated', ({ id, sprite }) => {
      if (!this.players[id]) return;
      const normalizedSprite = this.normalizeSpriteName(sprite);
      this.$set(this.players[id], 'sprite', normalizedSprite);
      this.ensureSpriteSheet(normalizedSprite);
      if (id === this.socket.id) {
        this.selectedSprite = normalizedSprite;
      }
    });

    this.socket.on("connect_error", (error) => {
      console.log("Erreur de connexion au serveur:", error);
      this.saveState = { ...this.saveState, status: 'error', message: 'Connexion au serveur interrompue.' };
    });

    this.socket.on('disconnect', () => {
      this.saveState = { ...this.saveState, status: 'error', message: 'Hors ligne : reconnexion automatique…' };
    });


    this.socket.on('battletrigger', (data) => {
      this.closeInteractionChoice();
      this.clearIncomingRequest();
      this.closeChatSession(true);
      this.$refs.battleOverlay?.resetBattleUi();
      this.battle = true;
      if (data?.message) this.$nextTick(() => this.$refs.battleOverlay?.showMessage(data.message));

    });

    this.socket.on('update', (data) => {
      this.currentPlayer.targetX = data.player.x;
      this.currentPlayer.targetY = data.player.y;
    });


    this.socket.on('requestAction', (data) => {
      this.$refs.battleOverlay?.requestAction(data?.message || 'Choisis une action.');
    });

    this.socket.on('battleText', (data) => {
      this.$refs.battleOverlay?.showMessage(data?.message || '...');
    });

    this.socket.on('bagUpdated', (data) => {
      if (Array.isArray(data?.items)) this.bagItems = data.items;
    });

    this.socket.on('shopOpened', (data) => {
      this.applyShopState(data);
    });

    this.socket.on('captureAnimation', (data) => {
      this.$refs.battleOverlay?.playCaptureAnimation(data);
    });

    this.socket.on('battleMoveAnimation', (data) => {
      this.$refs.battleOverlay?.playMoveAnimation(data);
    });

    this.socket.on('battleMoveResult', (data) => {
      this.$refs.battleOverlay?.playMoveResult(data);
    });

    this.socket.on('battleFieldState', (data) => {
      this.$refs.battleOverlay?.updateFieldState(data);
    });

    this.socket.on('introAnimation', (data) => {
      this.lock = true;
      this.$refs.battleOverlay?.updateBattleState(data);
    });




    window.addEventListener('keydown', this.handleKeydown);
    window.addEventListener('keyup', this.handleKeyup);
    window.addEventListener('mousedown', this.handleOutsideMenuClick);
    window.addEventListener('resize', this.updateMobileControlsVisibility);
    window.addEventListener('orientationchange', this.updateMobileControlsVisibility);
    window.addEventListener('blur', this.releaseAllMovementKeys);
    this.updateMobileControlsVisibility();

    const canvas = this.$refs.monCanvas;
    canvas.width = 28 * 16 * 2;
    canvas.height = 20 * 16 * 2;

    this.startGameLoop();
    this.startMovementLoop();






    this.spriteSheet = this.ensureSpriteSheet(this.selectedSprite);
    if (this.spriteSheet && !this.spriteSheet.complete) {
      this.spriteSheet.onload = () => {
        this.drawPlayers();
      };
    }




  }
  ,
  beforeDestroy() {
    this.stopMovementLoop();
    this.stopGameLoop();
    window.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('keyup', this.handleKeyup);
    window.removeEventListener('mousedown', this.handleOutsideMenuClick);
    window.removeEventListener('resize', this.updateMobileControlsVisibility);
    window.removeEventListener('orientationchange', this.updateMobileControlsVisibility);
    window.removeEventListener('blur', this.releaseAllMovementKeys);
    this.releaseAllMovementKeys();
    if (this.interactionNoticeTimer) {
      clearTimeout(this.interactionNoticeTimer);
      this.interactionNoticeTimer = null;
    }
    this.closeInteractionChoice();
    this.clearIncomingRequest();
    this.closeChatSession(true);
    this.$refs.battleOverlay?.resetBattleUi();
    if (this.socket) {
      this.socket.disconnect();
    }
  }
};
</script>


<style>
.reduced-game-motion *,
.reduced-game-motion *::before,
.reduced-game-motion *::after {
  animation-duration: 0.001ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.001ms !important;
  scroll-behavior: auto !important;
}

.btnbar {
  border-radius: 8px;
  width: 155px;
  height: 50px;
  margin: 5px;
}

body {
  overflow: hidden;
}

.btnbaratk {
  border-radius: 8px;
  width: 260px;
  height: 50px;
  margin: 5px;
}

.btnbarpkmn {
  border-radius: 8px;
  width: 80px;
  height: 100px;
  margin: 5px;
}

.bar {
  width: 100%;
  position: relative;
}

* {
  font-family: 'Press Start 2P', cursive;
  box-sizing: border-box;
}

body {
  background-color: black;
}

h1 {
  margin: 0;
}

button {
  border: 0;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #ddd;
}

.test {
  margin-top: 0;
  display: block;
  width: 100%;
  border: 2px solid #4a4a4a;
  border-top: none;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

.mobile-controls-shell {
  display: none;
}

.mobile-dialogue-action-top {
  display: none;
}

.game-shell {
  position: relative;
  width: 100%;
  max-width: none;
  margin: 0;
}

.interaction-notice {
  position: absolute;
  top: 98px;
  right: 10px;
  z-index: 55;
  max-width: 320px;
  border: 1px solid #4a5f84;
  border-radius: 7px;
  background: rgba(11, 17, 31, 0.94);
  color: #d7e8ff;
  padding: 8px 10px;
  font-size: 9px;
  line-height: 1.45;
}

.interaction-popup {
  position: absolute;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}

.interaction-card {
  width: min(92%, 380px);
  border: 1px solid #5d6f8f;
  border-radius: 10px;
  background: linear-gradient(170deg, #111a29, #0e1320);
  color: #f4f8ff;
  padding: 14px;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.4);
}

.interaction-title {
  font-size: 12px;
  margin-bottom: 8px;
}

.interaction-text {
  font-size: 9px;
  line-height: 1.5;
  margin-bottom: 10px;
}

.interaction-actions {
  display: flex;
  gap: 8px;
}

.interaction-btn {
  flex: 1;
  border: 1px solid #4d638f;
  border-radius: 6px;
  background: #27406a;
  color: #f4f8ff;
  font-size: 9px;
  padding: 7px 6px;
}

.interaction-btn:hover {
  background: #36558a;
}

.interaction-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.interaction-btn-muted {
  background: #2a2a2a;
  border-color: #515151;
}

.interaction-note {
  margin-top: 8px;
  color: #ffd2a3;
  font-size: 8px;
  line-height: 1.45;
}

.chat-panel {
  position: absolute;
  right: 10px;
  bottom: 12px;
  width: min(360px, calc(100% - 20px));
  border: 1px solid #596b8b;
  border-radius: 8px;
  background: rgba(9, 13, 23, 0.95);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
  z-index: 58;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #26344f;
}

.chat-title {
  color: #e8f1ff;
  font-size: 9px;
}

.chat-close-btn {
  border: 1px solid #4e5f80;
  background: #263956;
  color: #f4f8ff;
  border-radius: 6px;
  font-size: 8px;
  padding: 4px 7px;
}

.chat-messages {
  height: 165px;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-message-row {
  border: 1px solid #28344a;
  border-radius: 7px;
  background: #151f33;
  color: #e5efff;
  padding: 6px;
  font-size: 8px;
  line-height: 1.45;
}

.chat-message-row.is-me {
  border-color: #3d5a8e;
  background: #1f3357;
}

.chat-message-row.is-system {
  border-color: #5f5236;
  background: #2e2617;
  color: #ffe0b6;
}

.chat-author {
  color: #a9c8ff;
  margin-right: 4px;
}

.chat-message {
  color: inherit;
}

.chat-input-row {
  display: flex;
  gap: 6px;
  border-top: 1px solid #26344f;
  padding: 8px;
}

.chat-input {
  flex: 1;
  min-width: 0;
  border: 1px solid #445673;
  border-radius: 6px;
  background: #0d1320;
  color: #edf4ff;
  font-size: 9px;
  padding: 6px 8px;
}

.chat-send-btn {
  border: 1px solid #4e6998;
  border-radius: 6px;
  background: #2e4e82;
  color: #f4f8ff;
  font-size: 8px;
  padding: 6px 9px;
}

.game-stage {
  position: relative;
  width: 896px;
  max-width: calc(100vw - 32px);
  margin: 5% auto 0;
  z-index: 5;
}

.game-header {
  position: relative;
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  background: rgba(14, 14, 14, 0.96);
  border: 2px solid #4a4a4a;
  border-bottom: none;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.location-banner {
  position: absolute;
  top: 54px;
  right: 12px;
  z-index: 32;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: calc(100% - 24px);
  padding: 9px 11px;
  border: 2px solid rgba(235, 244, 255, 0.9);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(15, 34, 47, 0.94), rgba(21, 63, 76, 0.94));
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  font-size: 9px;
  line-height: 1.2;
  pointer-events: none;
}

.location-pin {
  color: #74e2c2;
  font-size: 10px;
}

.location-shop-btn {
  pointer-events: auto;
  margin-left: 4px;
  padding: 6px 8px;
  border: 1px solid #d9edc5;
  border-radius: 5px;
  background: #4f8e42;
  color: #ffffff;
  font-size: 8px;
}

.location-shop-btn:hover {
  background: #65a653;
}

.menu-toggle-btn {
  border: 1px solid #6b6b6b;
  background: #212121;
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
}

.menu-toggle-btn:hover {
  background: #313131;
}

.menu-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 10px;
  min-width: 230px;
  background: rgba(10, 10, 10, 0.98);
  border: 1px solid #5a5a5a;
  border-radius: 8px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  z-index: 30;
}

.menu-dropdown-item {
  width: 100%;
  text-align: left;
  background: transparent;
  color: #f4f4f4;
  border: none;
  border-bottom: 1px solid #2d2d2d;
  padding: 10px 12px;
  font-size: 11px;
}

.menu-dropdown-item:last-child {
  border-bottom: none;
}

.menu-dropdown-item:hover {
  background: #252525;
}

.bag-panel {
  position: absolute;
  top: 52px;
  left: 10px;
  width: 260px;
  max-height: 330px;
  background: rgba(10, 10, 10, 0.98);
  border: 1px solid #5a5a5a;
  border-radius: 8px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.45);
  padding: 10px;
  z-index: 35;
  overflow-y: auto;
}

.bag-title {
  color: #f4f4f4;
  font-size: 12px;
  margin-bottom: 8px;
}

.bag-state {
  color: #f4f4f4;
  font-size: 10px;
  padding: 6px 0;
}

.bag-error {
  color: #ff9a9a;
}

.bag-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bag-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #f4f4f4;
  border: 1px solid #2d2d2d;
  border-radius: 6px;
  background: #1a1a1a;
  padding: 7px 8px;
}

.bag-item-name,
.bag-item-qty {
  font-size: 9px;
}

.appearance-panel {
  position: absolute;
  top: 52px;
  left: 10px;
  width: 330px;
  max-height: 380px;
  background: rgba(10, 10, 10, 0.98);
  border: 1px solid #5a5a5a;
  border-radius: 8px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.45);
  padding: 10px;
  z-index: 35;
  overflow-y: auto;
}

.appearance-title {
  color: #f4f4f4;
  font-size: 12px;
  margin-bottom: 8px;
}

.appearance-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.appearance-option {
  border: 1px solid #2d2d2d;
  border-radius: 8px;
  background: #141414;
  color: #f4f4f4;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px;
  font-size: 9px;
}

.appearance-option:hover {
  background: #1f1f1f;
  border-color: #4a6fa4;
}

.appearance-option.is-active {
  border-color: #7fb4ff;
  box-shadow: 0 0 0 1px rgba(127, 180, 255, 0.45);
  background: #1a2536;
}

.appearance-preview {
  width: 64px;
  height: 64px;
  object-fit: contain;
  image-rendering: pixelated;
}

.appearance-label {
  font-size: 9px;
}

.team-panel {
  position: absolute;
  top: 52px;
  left: 282px;
  width: 330px;
  max-height: 430px;
  background: rgba(10, 10, 10, 0.98);
  border: 1px solid #5a5a5a;
  border-radius: 8px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.45);
  padding: 10px;
  z-index: 35;
  overflow-y: auto;
}

.team-title {
  color: #f4f4f4;
  font-size: 12px;
  margin-bottom: 8px;
}

.team-state {
  color: #f4f4f4;
  font-size: 10px;
  padding: 6px 0;
}

.team-error {
  color: #ff9a9a;
}

.team-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.team-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: stretch;
  border: 1px solid #2d2d2d;
  border-radius: 7px;
  background: linear-gradient(155deg, #1d2436, #141a28);
  padding: 8px;
}

.team-row-visual {
  width: 58px;
  min-width: 58px;
  border-radius: 8px;
  border: 1px solid #2f3952;
  background: radial-gradient(circle at 40% 30%, #2f3f63, #1a2337);
  display: flex;
  align-items: center;
  justify-content: center;
}

.team-pokemon-sprite {
  width: 48px;
  height: 48px;
  object-fit: contain;
  image-rendering: pixelated;
}

.team-row-main {
  min-width: 0;
  flex: 1;
}

.team-row-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
}

.team-slot {
  color: #9eb0d6;
  font-size: 9px;
}

.team-level {
  margin-left: auto;
  color: #dff5ff;
  background: #304f72;
  border: 1px solid #547eac;
  border-radius: 999px;
  padding: 2px 6px;
  font-size: 8px;
}

.team-row-name {
  color: #f8fbff;
  font-size: 10px;
  margin-bottom: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.team-hp-track {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  border: 1px solid #23304f;
  background: #0f1523;
  overflow: hidden;
  margin-bottom: 4px;
}

.team-hp-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.25s ease;
}

.team-hp-fill.hp-good {
  background: linear-gradient(90deg, #69e779, #2fb35a);
}

.team-hp-fill.hp-mid {
  background: linear-gradient(90deg, #f2d35a, #de9f35);
}

.team-hp-fill.hp-low {
  background: linear-gradient(90deg, #ff7f7f, #d34b4b);
}

.team-row-meta {
  color: #bfd0f3;
  font-size: 9px;
}

.team-row-actions {
  display: flex;
  gap: 4px;
}

.team-order-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #415079;
  background: #252f4a;
  color: #f4f4f4;
  font-size: 12px;
  line-height: 1;
}

.team-order-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.team-save-btn {
  margin-top: 10px;
  width: 100%;
  height: 34px;
  border-radius: 7px;
  border: 1px solid #4e8764;
  background: #1e5c38;
  color: #f4f4f4;
  font-size: 10px;
}

.team-save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 920px) {
  .location-banner {
    top: 50px;
    right: 7px;
    padding: 7px 8px;
    font-size: 8px;
  }

  .interaction-notice {
    top: 92px;
  }

  .mobile-controls-shell {
    position: fixed;
    left: 0;
    right: 0;
    bottom: max(16px, env(safe-area-inset-bottom));
    z-index: 40;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    padding: 0 16px;
    pointer-events: none;
  }

  .mobile-controls-shell.dialogue-active {
    z-index: 130;
    justify-content: flex-end;
    padding: 0 12px;
  }

  .mobile-dpad,
  .mobile-action-a {
    pointer-events: auto;
    touch-action: none;
    user-select: none;
  }

  .mobile-dpad {
    display: grid;
    grid-template-columns: repeat(3, 72px);
    grid-template-rows: repeat(3, 72px);
    gap: 10px;
  }

  .mobile-dpad-btn {
    border: 1px solid #56637f;
    border-radius: 20px;
    background: linear-gradient(165deg, rgba(52, 64, 95, 0.92), rgba(25, 33, 52, 0.92));
    color: #f7f9ff;
    font-size: 26px;
    line-height: 1;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mobile-dpad-btn:active {
    transform: scale(0.96);
    filter: brightness(1.12);
  }

  .mobile-dpad-up {
    grid-column: 2;
    grid-row: 1;
  }

  .mobile-dpad-left {
    grid-column: 1;
    grid-row: 2;
  }

  .mobile-dpad-right {
    grid-column: 3;
    grid-row: 2;
  }

  .mobile-dpad-down {
    grid-column: 2;
    grid-row: 3;
  }

  .mobile-dpad-center {
    grid-column: 2;
    grid-row: 2;
    border-radius: 20px;
    border: 1px solid rgba(93, 104, 136, 0.65);
    background: radial-gradient(circle at 30% 30%, rgba(59, 72, 106, 0.82), rgba(24, 31, 47, 0.86));
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.35);
  }

  .mobile-action-a {
    position: absolute;
    right: 16px;
    bottom: 0;
    width: 88px;
    height: 88px;
    border-radius: 999px;
    border: 2px solid #84c1ff;
    background: radial-gradient(circle at 30% 28%, #7ad1ff, #2f77d3 58%, #1f4594 100%);
    color: #ffffff;
    font-size: 34px;
    font-weight: 700;
    letter-spacing: 1px;
    text-shadow: 0 2px 5px rgba(0, 0, 0, 0.28);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.42);
  }

  .mobile-action-a.dialogue-action {
    position: fixed;
    right: 10px;
    bottom: max(14px, env(safe-area-inset-bottom));
    width: 96px;
    height: 96px;
    border-color: #ffe499;
    box-shadow: 0 14px 30px rgba(0, 0, 0, 0.55);
    z-index: 1000;
  }

  .mobile-action-a:active {
    transform: scale(0.96);
    filter: brightness(1.1);
  }

  .mobile-dialogue-action-top {
    display: block;
    position: fixed;
    right: 10px;
    bottom: max(14px, env(safe-area-inset-bottom));
    width: 98px;
    height: 98px;
    border-radius: 999px;
    border: 2px solid #ffe499;
    background: radial-gradient(circle at 30% 28%, #7ad1ff, #2f77d3 58%, #1f4594 100%);
    color: #ffffff;
    font-size: 34px;
    font-weight: 700;
    letter-spacing: 1px;
    text-shadow: 0 2px 5px rgba(0, 0, 0, 0.28);
    box-shadow: 0 14px 30px rgba(0, 0, 0, 0.55);
    z-index: 99999;
    pointer-events: auto;
    touch-action: none;
    user-select: none;
  }

  .mobile-dialogue-action-top:active {
    transform: scale(0.96);
    filter: brightness(1.1);
  }

  .appearance-panel {
    left: 10px;
    width: calc(100% - 20px);
    max-height: 340px;
  }

  .team-panel {
    left: 10px;
    width: calc(100% - 20px);
    max-height: 360px;
  }

}

.dialogue-backdrop {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 74%);
  backdrop-filter: blur(4px);
  z-index: 120;
}

.dialogue-layer {
  position: fixed;
  inset: 0;
  z-index: 121;
}

@-webkit-keyframes flicker-in-1 {
  0% {
    opacity: 0;
  }

  10% {
    opacity: 0;
  }

  10.1% {
    opacity: 1;
  }

  10.2% {
    opacity: 0;
  }

  20% {
    opacity: 0;
  }

  20.1% {
    opacity: 1;
  }

  20.6% {
    opacity: 0;
  }

  30% {
    opacity: 0;
  }

  30.1% {
    opacity: 1;
  }

  30.5% {
    opacity: 1;
  }

  30.6% {
    opacity: 0;
  }

  45% {
    opacity: 0;
  }

  45.1% {
    opacity: 1;
  }

  50% {
    opacity: 1;
  }

  55% {
    opacity: 1;
  }

  55.1% {
    opacity: 0;
  }

  57% {
    opacity: 0;
  }

  57.1% {
    opacity: 1;
  }

  60% {
    opacity: 1;
  }

  60.1% {
    opacity: 0;
  }

  65% {
    opacity: 0;
  }

  65.1% {
    opacity: 1;
  }

  75% {
    opacity: 1;
  }

  75.1% {
    opacity: 0;
  }

  77% {
    opacity: 0;
  }

  77.1% {
    opacity: 1;
  }

  85% {
    opacity: 1;
  }

  85.1% {
    opacity: 0;
  }

  86% {
    opacity: 0;
  }

  86.1% {
    opacity: 1;
  }

  100% {
    opacity: 1;
  }
}

@keyframes flicker-in-1 {
  0% {
    opacity: 0;
  }

  10% {
    opacity: 0;
  }

  10.1% {
    opacity: 1;
  }

  10.2% {
    opacity: 0;
  }

  20% {
    opacity: 0;
  }

  20.1% {
    opacity: 1;
  }

  20.6% {
    opacity: 0;
  }

  30% {
    opacity: 0;
  }

  30.1% {
    opacity: 1;
  }

  30.5% {
    opacity: 1;
  }

  30.6% {
    opacity: 0;
  }

  45% {
    opacity: 0;
  }

  45.1% {
    opacity: 1;
  }

  50% {
    opacity: 1;
  }

  55% {
    opacity: 1;
  }

  55.1% {
    opacity: 0;
  }

  57% {
    opacity: 0;
  }

  57.1% {
    opacity: 1;
  }

  60% {
    opacity: 1;
  }

  60.1% {
    opacity: 0;
  }

  65% {
    opacity: 0;
  }

  65.1% {
    opacity: 1;
  }

  75% {
    opacity: 1;
  }

  75.1% {
    opacity: 0;
  }

  77% {
    opacity: 0;
  }

  77.1% {
    opacity: 1;
  }

  85% {
    opacity: 1;
  }

  85.1% {
    opacity: 0;
  }

  86% {
    opacity: 0;
  }

  86.1% {
    opacity: 1;
  }

  100% {
    opacity: 1;
  }
}

@media (max-width: 720px) {
  .game-stage {
    max-width: 100vw;
    margin-top: 0;
  }

}
</style>

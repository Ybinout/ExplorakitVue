<template>
  <div v-if="active" :class="['battle', { 'battle-reduced-motion': !preferences.animationsEnabled, 'battle-entry-holding': entrancePhase === 'holding', 'battle-colosseum': challenge, 'battle-cave': environment === 'cave' }]" role="region" :aria-label="tr('battle')" :aria-busy="entranceActive ? 'true' : null">
    <battle-entrance v-if="entranceActive" :phase="entrancePhase" :language="preferences.language" :reduced-motion="!preferences.animationsEnabled" />
    <div
      ref="battleScene"
      :inert="entranceActive ? '' : null" :aria-hidden="entranceActive ? 'true' : null"
      :class="[
        'battle-scene',
        fieldClasses,
        { 'battle-impact-active': attackFx.wild.hit || attackFx.player.hit }
      ]"
    >
      <picture v-if="challenge" class="battle-arena-background"><source media="(orientation: landscape)" :srcset="raining ? rainBackgrounds.arenaWide : require('@/assets/battle/colosseum-wide-v2.webp')"><img :src="raining ? rainBackgrounds.arenaMobile : require('@/assets/battle/colosseum-mobile-v3.webp')" class="battle-background battle-colosseum-background" alt=""></picture>
      <picture v-else-if="environment === 'cave'" class="battle-arena-background" data-battle-environment="cave"><source v-if="mobile" media="(orientation: portrait)" :srcset="require('@/assets/battle/cave-mobile-v1.webp')"><img src="../../assets/battle/cave-wide-v1.webp" class="battle-background battle-cave-background" alt=""></picture>
      <picture v-else class="battle-arena-background"><source v-if="mobile" media="(orientation: portrait)" :srcset="raining ? rainBackgrounds.grassMobile : require('@/assets/battle/grass-mobile-v3.webp')"><img :src="raining ? rainBackgrounds.grassWide : require('@/assets/battle/back.webp')" class="battle-background" alt=""></picture>
      <!-- Share the fighters' ground anchors; background cropping must not move their platforms. -->
      <template v-if="challenge || mobile || environment === 'cave'">
        <div v-for="side in ['wild', 'player']" :key="`platform-${side}`" :class="['battle-platform', `battle-position-${side}`]" :data-battle-platform="side" aria-hidden="true">
          <span v-if="mobile || environment === 'cave'" :class="['battle-ground-disc', { 'arena-disc': challenge, 'cave-disc': environment === 'cave' }]" ></span><img v-else src="../../assets/battle/colosseum-platform.webp" alt="">
        </div>
      </template>
      <div class="battle-atmosphere" aria-hidden="true"></div>
      <battle-rain v-if="fieldState.weather === 'rain'" :animations-enabled="preferences.animationsEnabled" :environment="challenge ? 'colosseum' : environment" />
      <div v-else class="battle-weather-layer" aria-hidden="true"></div>
      <div class="battle-terrain-layer" aria-hidden="true"></div>
      <battle-send-out v-for="entry in sendOuts" :key="entry.uuid" :side="entry.side" :style="sendOutPosition(entry.side)" />

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
          'battle-position-wild',
          {
            'battle-fainted': Number(opponent.currentHp)<=0 && !transitionFx.wild,
            [`battle-transition-${transitionFx.wild}`]: Boolean(transitionFx.wild),
            'battle-attacking-wild': battleMoveFx.visible && battleMoveFx.actor === 'opponent',
            'battle-capture-target': captureFx.visible,
            'capture-target-contained': captureFx.targetContained,
            [`capture-state-${captureFx.state}`]: captureFx.visible
          }
        ]"
      >
        <img
          :class="['battle-sprite', { 'battle-hit-shake': attackFx.wild.hit, 'battle-sprite-ready': battleSpriteStyles.wild['--sprite-image-width'] }]"
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
          'battle-position-player',
          { 'battle-fainted': Number(currentPokemon.currentHp)<=0 && !transitionFx.player, [`battle-transition-${transitionFx.player}`]: Boolean(transitionFx.player), 'battle-attacking-player': battleMoveFx.visible && battleMoveFx.actor === 'player' }
        ]"
      >
        <img
          :class="['battle-sprite', { 'battle-hit-shake': attackFx.player.hit, 'battle-sprite-ready': battleSpriteStyles.player['--sprite-image-width'] }]"
          :style="battleSpriteStyles.player"
          :src="getPokemonSprite(currentPokemon, 'back')"
          :alt="currentPokemon.name || 'Ton Pokemon'"
          @load="calibrateBattleSprite($event, 'player')"
        >
      </div>

      <div
        v-if="opponent" ref="opponentStatusCard"
        :class="['battle-status', 'battle-status-wild', { 'battle-status-hit': attackFx.wild.hit }]"
      >
        <div class="battle-status-top">
          <span class="battle-status-name">{{ opponent.__battle?.illusion?.name || opponent.truename || opponent.name }}</span>
          <span class="battle-status-lvl">lv.{{ opponent.level }}</span>
          <potential-star :value="opponent.k" :language="preferences.language" />
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
          <span class="battle-hp-value">{{ formatBattleHp(opponent) }}</span>
          <battle-conditions :pokemon="opponent"/>
          <span v-if="opponent.passiveAbility" class="battle-status-ability">{{ tr('ability') }} : {{ localizedAbility(opponent.passiveAbility) }}</span>
        </div>
        <p v-if="opponentEffortLabel" class="battle-effort-yield" data-battle-effort-yield :title="effortYieldHint">{{ opponentEffortLabel }}</p>
      </div>

      <div
        v-if="currentPokemon" ref="playerStatusCard"
        :class="['battle-status', 'battle-status-player', { 'battle-status-hit': attackFx.player.hit }]"
      >
        <div class="battle-status-top">
          <span class="battle-status-name">{{ currentPokemon.name || currentPokemon.truename }}</span>
          <span class="battle-status-lvl">lv.{{ experienceVisual?.uuid === currentPokemon.uuid ? experienceVisual.level : currentPokemon.level }}</span>
          <potential-star :value="currentPokemon.k" :language="preferences.language" />
          <span
            v-if="playerStatus"
            :class="['battle-status-ailment', `status-${playerStatus.key}`]"
            :title="playerStatus.label"
          >
            {{ playerStatus.code }}
          </span>
        </div>
        <health-bar :current-hp="currentPokemon.currentHp" :hp-max="currentPokemon.maxHp" />
        <experience-bar :pokemon="currentPokemon" :playback-percent="experienceVisual?.uuid === currentPokemon.uuid ? experienceVisual.percent : null" />
        <span v-if="experienceNotice" class="experience-notice" role="status">{{ experienceNotice }}</span>
        <div class="battle-status-details">
          <span class="battle-hp-value">{{ formatBattleHp(currentPokemon) }}</span>
          <battle-conditions :pokemon="currentPokemon"/>
          <span v-if="currentPokemon.passiveAbility" class="battle-status-ability">{{ tr('ability') }} : {{ localizedAbility(currentPokemon.passiveAbility) }}</span>
        </div>
      </div>

      <div v-for="side in ['wild','player']" :key="`conditions-${side}`" class="battle-condition-fx" :data-condition-side="side" :style="conditionPosition(side)" aria-hidden="true">
        <i v-for="(effect,index) in conditionFx[side]" :key="effect.key" :class="`condition-${effect.kind}`" :style="{'--effect-index':index,'--effect-count':conditionFx[side].length}">{{ effect.symbol }}</i>
      </div>

      <div v-if="criticalFx.side" :key="`critical-${criticalFx.nonce}`" class="battle-critical-burst" :data-critical-side="criticalFx.side" :style="conditionPosition(criticalFx.side)" aria-hidden="true"><i v-for="ray in 8" :key="ray" :style="{'--ray':ray}"></i><b>✦</b></div>
      <template v-for="side in ['wild', 'player']">
        <div v-if="attackFx[side].visible || resultSide === side" :key="`feedback-${side}`" :ref="`feedback-${side}`"
          :class="['battle-result-fx', `battle-result-${side}`]" :style="getResultPosition(side)" role="status" aria-live="polite">
          <template v-if="resultSide === side"><span v-for="label in resultFx.labels" :key="label.key" :class="['battle-result-chip', `result-${label.key}`]">{{ label.text }}</span></template>
          <span v-if="attackFx[side].visible" :key="`damage-${attackFx[side].nonce}`" :class="['battle-damage-text', `battle-health-${attackFx[side].kind}`, { 'is-critical': attackFx[side].critical }]">
            {{ attackFx[side].kind === 'heal' ? '+' : '-' }}{{ attackFx[side].amount }}
          </span>
        </div>
      </template>

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
      </div>
    </div>

    <div class="bar battle-action-shell" :inert="entranceActive ? '' : null" :aria-hidden="entranceActive ? 'true' : null" :class="{ 'has-battle-notices': hasAnnouncements }">
      <div :class="['battle-turn-indicator', { 'is-ready': canChooseAction }]">
        <span class="battle-turn-dot" aria-hidden="true"></span>
        {{ turnLabel }}
        <span v-if="challenge" class="battle-challenge" data-battle-challenge>{{ challenge.guardian ? 'Gardien' : 'Défi' }} {{ challenge.wave }} · {{ challenge.guardian?.name || challenge.difficulty?.label }}</span>
      </div>

        <div v-if="hasAnnouncements && mobile" class="battle-announcements battle-mobile-announcements" role="status">
          <p v-if="notice" class="battle-action-notice">{{ notice }}</p>
          <p v-if="captureFx.visible && captureFx.message" class="battle-capture-notice">{{ captureFx.message }}</p>
          <p v-if="conditionNotice" class="battle-condition-notice" data-battle-condition-notice>{{ conditionNotice }}</p>
          <p v-if="transitionLabel && !trainerSpeech" class="battle-transition-label" data-battle-transition>{{ transitionLabel }}</p>
          <div v-if="driftNotices.length" class="battle-drift-notices" data-battle-drift-effects><p v-for="notice in driftNotices" :key="notice.side">✧ {{ notice.side==='player' ? 'Tes Drifts' : 'Drifts adverses' }} · {{ notice.text }}</p></div>
          <p v-if="fieldLabel" class="battle-field-label">{{ fieldLabel }}</p>
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

      <div class="battle-action-display" :class="{ 'has-battle-notices': hasAnnouncements && !mobile }">
        <div v-if="hasAnnouncements && !mobile" class="battle-announcements" role="status">
          <p v-if="notice" class="battle-action-notice">{{ notice }}</p>
          <p v-if="captureFx.visible && captureFx.message" class="battle-capture-notice">{{ captureFx.message }}</p>
          <p v-if="conditionNotice" class="battle-condition-notice" data-battle-condition-notice>{{ conditionNotice }}</p>
          <p v-if="transitionLabel && !trainerSpeech" class="battle-transition-label" data-battle-transition>{{ transitionLabel }}</p>
          <div v-if="driftNotices.length" class="battle-drift-notices" data-battle-drift-effects><p v-for="notice in driftNotices" :key="notice.side">✧ {{ notice.side==='player' ? 'Tes Drifts' : 'Drifts adverses' }} · {{ notice.text }}</p></div>
          <p v-if="fieldLabel" class="battle-field-label">{{ fieldLabel }}</p>
        </div>
        <div v-if="trainerSpeech" class="battle-text-box battle-trainer-speech" data-trainer-speech role="status" aria-live="polite">
          <strong>{{ trainerSpeech.name }}</strong><p>{{ trainerSpeech.text }}</p>
        </div>
        <div
          v-else-if="actionState.patient"
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
            class="battle-choice-btn battle-move-choice"
            :style="moveButtonStyle(index - 1)"
            :data-move-type="moveButtonType(index - 1)"
            :disabled="isMoveUnavailable(index - 1)"
            @click="submitAction({ action: 'attack', number: index - 1 }, tr('attackRunning'))"
          >
            <span>{{ moveButtonLabel(index - 1) }}</span>
            <small v-if="moveButtonType(index - 1)" class="move-type-label">{{ preferences.language === 'en' ? moveButtonType(index - 1) : typeLabel(moveButtonType(index - 1)) }}</small>
          </button>
        </div>

        <div v-else-if="actionState.pokemonPanel" class="battle-grid battle-grid-pokemon" :data-replacement-choice="replacementChoice ? 'true' : null" aria-label="Pokémon disponibles">
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
        <button class="battle-main-btn action-attack" :disabled="!canChooseAction || replacementChoice" @click="setPanel('attack')">{{ tr('attack') }}</button>
        <button class="battle-main-btn action-bag" :disabled="!canChooseAction || replacementChoice" @click="openBag">{{ tr('bag') }}</button>
        <button class="battle-main-btn action-pokemon" :disabled="!canChooseAction" @click="setPanel('pokemon')">{{ tr('pokemon') }}</button>
        <button class="battle-main-btn action-flee" :disabled="!canChooseAction || replacementChoice" @click="submitAction({ action: 'flee' }, tr('fleeing'))">{{ tr('flee') }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import BattleEntrance from './BattleEntrance.vue';
import BattleSendOut from './BattleSendOut.vue';
import { waitForBattleAssets, entranceDelay } from '@/services/battleEntrance';
import { createBattlePresentation } from '@/services/battlePresentation';
import { playExperienceGain } from '@/services/experiencePlayback';
import { BattleAudio } from '@/services/battleAudio';
import moveLearning from '@/data/moveLearning.json';
import { localizeTypeName } from '@/services/pokemonTypes';
import PotentialStar from '../PotentialStar.vue';
import BattleConditions from './BattleConditions.vue';
import BattleRain from './BattleRain.vue';
import { battleConditionChanges } from '@/services/battleConditions';
import ExperienceBar from '../ExperienceBar.vue';
import './battleViewport.css';
import HealthBar from '../HealthBar.vue';
import { getBattleStatus } from '@/services/gameView';
import { localizeAbilityName, localizeMoveName, translate } from '@/services/i18n';

const RAIN_BACKGROUNDS = Object.freeze({
  grassMobile: require('@/assets/battle/grass-rain-mobile-v1.webp'),
  grassWide: require('@/assets/battle/grass-rain-wide-v1.webp'),
  arenaMobile: require('@/assets/battle/colosseum-rain-mobile-v1.webp'),
  arenaWide: require('@/assets/battle/colosseum-rain-wide-v1.webp')
});
const preloadedBackgrounds = new Set();

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

import { battleEnvironment } from '@/services/battleEnvironment';

export default {
  name: 'BattleOverlay',
  components: { BattleEntrance, BattleSendOut, HealthBar, ExperienceBar, PotentialStar, BattleConditions, BattleRain },
  props: {
    mobile: Boolean,
    mapName: { type: String, default: '' },
    notice: { type: String, default: '' },
    active: { type: Boolean, default: false },
    colosseumChallenge: { type: Object, default: null },
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
      challenge: null,
      opponent: null,
      opponentEffortYield: null,
      canAct: false,
      replacementChoice: false,
      replacementIndexes: null,
      replacementId: null,
      actionTurnId: null,
      presentationBusy: false,
      entrancePhase: 'ready',
      feedbackHeights: { wild: 0, player: 0 }, feedbackSceneSize: { width: 0, height: 0 },
      visualEpoch:0, transitionFx:{player:'',wild:''}, transitionLabel:'', conditionNotice:'', conditionFx:{wild:[],player:[]}, conditionTimer:null, driftNotices:[], driftNoticeTimer:null,
      sendOuts: [], trainerSpeech: null,
      usableMoveIndexes: null,
      resolvedMoveTypes: null,
      actionState: {
        patient: false,
        attackPanel: false,
        pokemonPanel: false,
        bagPanel: false,
        text: "pas d'information"
      },
      battleMapName: this.mapName,
      messageNonce: 0,
      messageTimer: null,
      moveTimer: null,
      resultTimer: null,
      criticalFx: { side: null, nonce: 0 }, criticalTimer: null, pendingCritical: null,
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
        wild: { visible: false, hit: false, amount: 0, kind: 'damage', nonce: 0, critical: false },
        player: { visible: false, hit: false, amount: 0, kind: 'damage', nonce: 0, critical: false }
      },
      fieldState: { weather: null, terrain: null },
      soundEnabled: localStorage.getItem('battleSoundEnabled') !== 'false',
      music: null,
      musicKind: null,
      experienceNotice: '',
      experienceTimer: null,
      experienceVisual: null,
      experienceBusy: false,
      finishing: false
    };
  },
  computed: {
    entranceActive() { return this.entrancePhase !== 'ready'; },
    raining() { return this.fieldState.weather === 'rain'; },
    rainBackgrounds() { return RAIN_BACKGROUNDS; },
    environment() { return battleEnvironment(this.battleMapName, Boolean(this.challenge)); },
    hasAnnouncements() { if (this.replacementChoice) return false; return this.notice || this.transitionLabel || this.conditionNotice || this.driftNotices.length || this.fieldLabel || (this.captureFx.visible && this.captureFx.message); },
    resultSide() { return this.resultFx.visible ? (this.resultFx.actor === 'opponent' ? 'wild' : 'player') : null; },
    currentPokemon() {
      return this.player?.equipe?.pokemons?.[0] || null;
    },
    battleTeam() {
      return Array.isArray(this.player?.equipe?.pokemons) ? this.player.equipe.pokemons : [];
    },
    canChooseAction() {
      return this.canAct && !this.entranceActive && !this.presentationBusy && !this.captureFx.visible && !this.experienceBusy && !this.finishing;
    },
    turnLabel() {
      if (this.captureFx.visible) return this.tr('captureRunning');
      if (this.replacementChoice) return this.preferences.language === 'en' ? 'Choose your next Pokémon' : 'Choisis ton prochain Pokémon';
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
    effortYieldHint() {
      return this.preferences.language === 'en'
        ? 'Base EV yield on defeat or capture, up to 252 per stat and 510 total.'
        : 'EV de base à la victoire ou à la capture, dans la limite de 252 par stat et 510 au total.';
    },
    opponentEffortLabel() {
      const labels = this.preferences.language === 'en'
        ? {hp:'HP',attack:'Atk',defense:'Def',specialAttack:'Sp. Atk',specialDefense:'Sp. Def',speed:'Speed'}
        : {hp:'PV',attack:'Atq.',defense:'Déf.',specialAttack:'Atq. Spé.',specialDefense:'Déf. Spé.',speed:'Vit.'};
      const gains = Object.entries(labels).filter(([key])=>Number(this.opponentEffortYield?.[key])>0)
        .map(([key,label])=>`+${this.opponentEffortYield[key]} ${label}`);
      return gains.length ? `EV : ${gains.join(' · ')}` : '';
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
    audioVolume() { this.syncAudio(); },
    soundEnabled() { this.syncAudio(); },
    active(isActive) {
      if (isActive) this.battleMapName = this.mapName;
      if (!isActive) { this._battleAudio?.stop(); this.stopMusic(); this.resetBattleUi(); }
    }
  },
  mounted() {
    // Warm the two matching weather variants before a battle, sharing the browser cache.
    const format = this.mobile && window.matchMedia('(orientation: portrait)').matches ? 'Mobile' : 'Wide';
    for (const scene of ['grass', 'arena']) {
      const src = RAIN_BACKGROUNDS[scene + format];
      if (!preloadedBackgrounds.has(src)) {
        preloadedBackgrounds.add(src);
        const image = new Image();
        image.src = src;
      }
    }
    this._feedbackObserver = new ResizeObserver(this.measureFeedback);
    this._battleAudio = new BattleAudio();
    this.syncAudio();
    window.addEventListener('pointerdown', this.resumeAudio);
    window.addEventListener('pointerup', this.resumeAudio);
    window.addEventListener('keydown', this.resumeAudio);
    document.addEventListener('visibilitychange', this.syncAudio);
  },
  updated() { this.measureFeedback(); },
  beforeDestroy() {
    this._feedbackObserver?.disconnect();
    this._presentation?.cancel();
    this.cancelExperience();
    this.stopMusic();
    clearTimeout(this.experienceTimer);
    window.removeEventListener('pointerdown', this.resumeAudio);
    window.removeEventListener('pointerup', this.resumeAudio);
    window.removeEventListener('keydown', this.resumeAudio);
    document.removeEventListener('visibilitychange', this.syncAudio);
    this.clearAllTimers();
    this._battleAudio?.dispose();
  },
  methods: {
    prepareEntrance() {
      this.cancelEntrance();
      this.battleMapName = this.mapName;
      this._entranceController = new AbortController();
      this._entranceStartedAt = performance.now();
      this.entrancePhase = 'holding';
    },
    cancelEntrance() {
      this._entranceController?.abort();
      this._entranceController = null;
      this.entrancePhase = 'ready';
    },
    async revealEntrance(epoch) {
      const controller = this._entranceController;
      if (!controller) return;
      const { signal } = controller;
      const obsolete = () => signal.aborted || epoch !== this.visualEpoch;
      await this.$nextTick();
      if (obsolete()) return;
      await waitForBattleAssets(() => [...(this.$el.querySelectorAll?.('.battle-background, .battle-sprite, .battle-platform img') || [])], { signal });
      if (obsolete()) return;
      // Cached images may have loaded before their Vue load handler was attached.
      for (const [side, anchor] of [['wild', this.$refs.opponentAnchor], ['player', this.$refs.playerAnchor]]) {
        const image = anchor?.querySelector('.battle-sprite');
        if (image) this.calibrateBattleSprite({ currentTarget: image }, side);
      }
      await this.$nextTick();
      if (!this.reducedMotion()) await entranceDelay(520 - (performance.now() - this._entranceStartedAt), signal);
      if (obsolete()) return;
      if (!this.reducedMotion()) {
        this.entrancePhase = 'revealing';
        await entranceDelay(420, signal);
      }
      if (obsolete()) return;
      this.entrancePhase = 'ready';
      this._entranceController = null;
    },
    presentEvent(method, payload) {
      this._presentation ||= createBattlePresentation({ changed: busy => { this.presentationBusy = busy; } });
      const delay = () => {
        if (!this.preferences.animationsEnabled || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 0;
        if (method === 'playMoveAnimation') return payload?.damageClass === 'status' ? 850 : 650;
        if (method === 'playDriftEffects') return 650;
        if (method === 'playMoveResult') return this.resultFx.visible ? 1150 : 250;
        return 0;
      };
      return this._presentation.push(() => method==='updateBattleState' ? this.presentState(payload) : this[method](payload), delay);
    },
    startMusic(kind) {
      if(this.musicKind===kind&&this.music){this.syncMusic();return;}
      this.stopMusic();
      this.musicKind = kind;
      const tracks = { wild: require('@/assets/msc/wild.mp3'), arena: require('@/assets/msc/arene.mp3'), trainer: require('@/assets/msc/arene.mp3'), colosseum: require('@/assets/msc/cyntia.mp3'), pvp: require('@/assets/msc/cyntia.mp3') };
      this.music = new Audio(tracks[kind] || tracks.wild);
      this.music.loop = true;
      this.syncMusic();
    },
    syncMusic() {
      if (!this.music) return;
      this.music.volume = this.audioVolume * 0.4;
      if (!this.active || !this.soundEnabled || !this.audioVolume || document.hidden) this.music.pause();
      else if (this.music.paused) this.music.play().catch(() => {});
    },
    syncAudio() {
      if (document.hidden) { this.cancelEntrance(); this._presentation?.skipWait(); this._transitionRelease?.(); this.clearCaptureTimers(); }
      this._battleAudio?.setVolume(this.soundEnabled && !document.hidden ? this.audioVolume : 0);
      this.syncMusic();
    },
    resumeAudio() { this.unlockAudio(); if (this.active) this.syncMusic(); },
    stopMusic() {
      if (this.music) { this.music.pause(); this.music.removeAttribute('src'); this.music.load(); }
      this.music = null;
      this.musicKind = null;
    },
    updateExperience(payload) {
      const pokemon = payload?.pokemon;
      const index = this.battleTeam.findIndex(entry => entry.uuid === pokemon?.uuid);
      if (index < 0) return;
      this.experienceBusy = true;
      this._experienceAbort ||= new AbortController();
      const signal = this._experienceAbort.signal;
      const play = async () => {
        if (signal.aborted) return;
        this.experienceNotice = `+${payload.xpGained} XP`;
        const reduced = !this.preferences.animationsEnabled || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        await playExperienceGain(payload, frame => {
          this.experienceVisual = { ...frame, uuid: pokemon.uuid };
          if (frame.level > payload.previousLevel) this.experienceNotice = `Niveau ${frame.level} ! +${payload.xpGained} XP`;
        }, signal, reduced);
      };
      const previous = this._experiencePlayback;
      // The first frame is set synchronously, before the authoritative team update renders.
      const task = previous ? previous.then(play) : play();
      this._experiencePlayback = task;
      this.$set(this.player.equipe.pokemons, index, pokemon);
      task.finally(() => {
        if (this._experiencePlayback !== task || signal.aborted) return;
        this._experiencePlayback = null;
        this.experienceBusy = false;
        this.experienceVisual = null;
        clearTimeout(this.experienceTimer);
        this.experienceTimer = setTimeout(() => { this.experienceNotice = ''; }, 2000);
      });
      return task;
    },
    async finishPresentation() {
      this.finishing = true;
      this.canAct = false;
      await this._presentation?.drain();
      await this._experiencePlayback;
    },
    cancelExperience() {
      this._experienceAbort?.abort();
      this._experienceAbort = null;
      this._experiencePlayback = null;
      this.experienceVisual = null;
      this.experienceBusy = false;
    },
    tr(key, parameters) {
      return translate(this.preferences.language, key, parameters);
    },
    localizedAbility(name) {
      return localizeAbilityName(name, this.preferences.language);
    },
    getPokemonSprite(pokemon, side) {
      const id = Number.parseInt(pokemon?.__battle?.illusion?.id || pokemon?.__battle?.formSpriteId || pokemon?.data?.id, 10);
      if (!Number.isInteger(id) || id <= 0) return '';
      const folder = side === 'back' ? 'back' : 'front';
      return `${process.env.BASE_URL}img/pokemon/${folder}/${id}.png`;
    },
    getPokemonBattleKey(pokemon) {
      return pokemon?.uuid || `${pokemon?.data?.id || 'pokemon'}-${pokemon?.name || pokemon?.truename || ''}`;
    },
    formatBattleHp(pokemon) {
      const currentHp = Math.max(0, Math.round(Number(pokemon?.currentHp) || 0));
      const maxHp = Math.max(1, Math.round(Number(pokemon?.maxHp) || 1));
      return `${currentHp}/${maxHp} PV`;
    },
    typeLabel: localizeTypeName,
    moveButtonType(index) {
      if (Array.isArray(this.usableMoveIndexes) && !this.usableMoveIndexes.length && index === 0) return 'Normal';
      return this.resolvedMoveTypes?.[index] || moveLearning[this.currentPokemon?.abilities?.[index]]?.type || '';
    },
    moveButtonStyle(index) {
      return {'--move-choice-color':MOVE_COLORS[this.moveButtonType(index).toLowerCase()] || MOVE_COLORS.normal};
    },
    moveButtonLabel(index) {
      if (Array.isArray(this.usableMoveIndexes) && !this.usableMoveIndexes.length && index === 0) return 'Lutte';
      const moveName = this.currentPokemon?.abilities?.[index];
      if (!moveName) return '-';
      const localizedName = localizeMoveName(moveName, this.preferences.language);
      const currentPp = this.currentPokemon?.movePp?.[index];
      return Number.isFinite(Number(currentPp)) ? `${localizedName} · ${currentPp} PP` : localizedName;
    },
    isMoveUnavailable(index) {
      if (!this.canChooseAction) return true;
      const pokemon = this.currentPokemon;
      if (Array.isArray(this.usableMoveIndexes)) return this.usableMoveIndexes.length ? !this.usableMoveIndexes.includes(index) : index !== 0;
      if (!pokemon?.abilities?.[index]) return true;
      const pp = Array.isArray(pokemon.movePp) ? pokemon.movePp : [];
      const allEmpty = pokemon.abilities.every((moveName, moveIndex) => !moveName || Number(pp[moveIndex]) <= 0);
      return !allEmpty && Number(pp[index]) <= 0;
    },
    isSwitchUnavailable(pokemon, index) {
      return !this.canChooseAction || index === 0 || Number(pokemon?.currentHp || 0) <= 0
        || (this.replacementChoice && !this.replacementIndexes?.includes(index));
    },
    setPanel(panel) {
      if (!this.canChooseAction || (this.replacementChoice && panel !== 'pokemon')) return;
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
      if (this.replacementChoice && (payload.action !== 'change' || this.isSwitchUnavailable(this.battleTeam[payload.number],payload.number))) return;
      this.unlockAudio();
      this.canAct = false;
      this.$emit('action', { ...payload, ...(this.replacementId ? { replacementId:this.replacementId } : {}), ...(this.actionTurnId ? { turnId:this.actionTurnId } : {}) });
      this.replacementChoice = false;
      this.showMessage(message, true);
    },
    requestAction(request) {
      const data = typeof request === 'string' ? { message:request } : request || {};
      this.replacementChoice = Boolean(data.replacement);
      this.replacementIndexes = Array.isArray(data.allowedPokemonIndexes) ? data.allowedPokemonIndexes : null;
      this.replacementId = data.replacementId || null;
      this.actionTurnId = data.turnId || null;
      this.canAct = true;
      this.showMessage(data.message || this.tr('chooseAction'), true);
      if (this.replacementChoice) {
        this.actionState.patient = false;
        this.actionState.pokemonPanel = true;
      } else this.$emit('request-bag');
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
    reducedMotion() { return !this.preferences.animationsEnabled || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches; },
    transitionWait(ms) { return new Promise(resolve=>{const finish=()=>{clearTimeout(this._transitionTimer);this._transitionRelease=null;resolve();};this._transitionRelease=finish;this._transitionTimer=setTimeout(finish,ms);}); },
    async presentState(payload = {}) {
      const epoch = this.visualEpoch;
      const opening = !this.player && this.entrancePhase === 'holding';
      const events = payload.transitions || [];
      const changes = { player:battleConditionChanges(this.currentPokemon,payload.player?.equipe?.pokemons?.[0]), wild:battleConditionChanges(this.opponent,payload.wildPokemon) };
      const outgoing = events.filter(e => e.kind === 'faint' || e.kind === 'recall');
      const incoming = events.filter(e => e.kind === 'enter');
      // Settle damage on the Pokémon that received it before removing its sprite.
      let hpChanged = false;
      for (const [side, previous, next] of [
        ['player', this.currentPokemon, payload.player?.equipe?.pokemons?.[0]],
        ['wild', this.opponent, payload.wildPokemon]
      ]) {
        const faint = outgoing.some(e => e.kind === 'faint' && (e.side === 'player' ? 'player' : 'wild') === side);
        const nextHp = faint ? 0 : previous?.uuid === next?.uuid ? Number(next?.currentHp) : NaN;
        if (previous && Number.isFinite(nextHp) && nextHp !== Number(previous.currentHp)) {
          const delta = nextHp - Number(previous.currentHp);
          if (faint) this.$set(this.transitionFx, side, 'hit');
          this.$set(previous, 'currentHp', nextHp);
          this.triggerHealthFx(side, delta, nextHp);
          hpChanged = true;
        }
      }
      this.pendingCritical = null;
      if (hpChanged && !this.reducedMotion()) await this.transitionWait(1020);
      if (epoch !== this.visualEpoch) return;
      if (outgoing.length) {
        this.clearMoveFx(); this.resultFx.visible = false; this.driftNotices = [];
        this.transitionLabel = outgoing.map(e => `${e.name} ${e.kind === 'faint' ? 'est K.O.' : 'est rappelé.'}`).join(' · ');
        this.transitionFx = { player: '', wild: '' };
        for (const e of outgoing) this.$set(this.transitionFx, e.side === 'player' ? 'player' : 'wild', e.kind);
        if (!this.reducedMotion()) await this.transitionWait(550);
      }
      if (epoch !== this.visualEpoch) return;
      this.transitionFx = { player: '', wild: '' };
      for (const e of incoming) this.$set(this.transitionFx,e.side === 'player' ? 'player' : 'wild','waiting');
      this.updateBattleState(payload);
      if (opening) {
        await this.revealEntrance(epoch);
        if (epoch !== this.visualEpoch) return;
      }
      if (incoming.length) {
        this.transitionLabel = incoming.map(e => `${e.name} entre en combat.`).join(' · ');
        await this.$nextTick();
        this._sendOutController = new AbortController();
        await waitForBattleAssets(() => [...this.$el.querySelectorAll('.battle-sprite')], {signal:this._sendOutController.signal,timeoutMs:1800});
        if (epoch !== this.visualEpoch) return;
        for (const [side, anchor] of [['wild',this.$refs.opponentAnchor],['player',this.$refs.playerAnchor]]) {
          const image=anchor?.querySelector('.battle-sprite');
          if(image)this.calibrateBattleSprite({currentTarget:image},side);
        }
        for (const e of incoming) this.$set(this.transitionFx, e.side === 'player' ? 'player' : 'wild', 'enter');
        this.trainerSpeech = incoming.find(e => e.trainerSpeech)?.trainerSpeech || null;
        this.sendOuts = this.reducedMotion() ? [] : incoming.map(e=>({side:e.side==='player'?'player':'wild',uuid:e.uuid}));
        if (!this.reducedMotion()) await this.transitionWait(800);
      }
      if (epoch !== this.visualEpoch) return;
      this.sendOuts = [];
      this.transitionFx = { player: '', wild: '' };
      if (this.trainerSpeech) {
        // Keep the line readable with reduced motion too, without moving controls.
        await this.transitionWait(document.hidden ? 0 : 2300);
        if (epoch !== this.visualEpoch) return;
        this.trainerSpeech = null;
      }
      if (changes.player.length || changes.wild.length) {
        this.playConditionChanges(changes);
        if (!this.reducedMotion()) await this.transitionWait(680);
        if (epoch !== this.visualEpoch) return;
        this.conditionFx={player:[],wild:[]};
      }
      if (events.length) {
        clearTimeout(this._transitionLabelTimer);
        this._transitionLabelTimer = setTimeout(() => { this.transitionLabel = ''; }, 900);
      }
    },
    conditionPosition(side) {
      const geometry = this.getSpriteGeometry(side);
      return {left:`${geometry.centerX}px`,top:`${geometry.centerY}px`,width:`${Math.max(52,geometry.width)}px`,height:`${Math.max(52,geometry.height)}px`};
    },
    sendOutPosition(side) {
      const geometry=this.getSpriteGeometry(side);
      return {left:`${geometry.centerX}px`,top:`${geometry.centerY}px`};
    },
    playConditionChanges(changes) {
      clearTimeout(this.conditionTimer);
      this.conditionNotice = ['player','wild'].filter(side=>changes[side].length).map(side=>`${side==='player'?'Allié':'Adversaire'} · ${changes[side].map(e=>e.text).join(' · ')}`).join(' / ');
      this.conditionFx = this.reducedMotion() ? {player:[],wild:[]} : changes;
      this.conditionTimer = setTimeout(()=>{this.conditionFx={player:[],wild:[]};this.conditionNotice='';},1200);
    },
    playDriftEffects(payload={}) {
      clearTimeout(this.driftNoticeTimer);
      this.driftNotices=['player','opponent'].map(side=>({side,text:(payload.effects||[]).filter(e=>e.side===side).map(e=>e.name+(e.detail?' : '+e.detail:'')).join(' · ')})).filter(e=>e.text);
      this.driftNoticeTimer=setTimeout(()=>{this.driftNotices=[];},2200);
    },
    updateBattleState(payload = {}) {
      this.opponentEffortYield = payload.effortYield || null;
      if(payload.musicKind)this.startMusic(payload.musicKind);
      this.usableMoveIndexes = Array.isArray(payload.usableMoveIndexes) ? payload.usableMoveIndexes : null;
      this.resolvedMoveTypes = Array.isArray(payload.moveTypes) ? payload.moveTypes : null;
      if (!this.player) this.challenge = this.colosseumChallenge;
      const nextPlayer = payload.player || null;
      const nextOpponent = payload.wildPokemon || null;
      const previousOpponentKey = this.getPokemonBattleKey(this.opponent);
      const previousPlayerKey = this.getPokemonBattleKey(this.currentPokemon);
      const previousOpponentHp = Number(this.opponent?.currentHp);
      const previousPlayerHp = Number(this.currentPokemon?.currentHp);
      for (const [side, previous, next] of [['wild', this.opponent, nextOpponent], ['player', this.currentPokemon, nextPlayer?.equipe?.pokemons?.[0]]]) {
        if (this.getPokemonBattleKey(previous) !== this.getPokemonBattleKey(next) || previous?.data?.id !== next?.data?.id) {
          this.clearHealthTimers(side);
          if (this.pendingCritical?.side === side) this.pendingCritical = null;
          if (this.criticalFx.side === side) { clearTimeout(this.criticalTimer); this.criticalFx.side = null; }
          Object.assign(this.attackFx[side], {visible:false,hit:false});
          this.$set(this.battleSpriteStyles, side, {});
          this.$set(this.battleSpriteMetrics, side, { widthRatio: 1, heightRatio: 1 });
        }
      }
      this.player = nextPlayer ? JSON.parse(JSON.stringify(nextPlayer)) : null;
      this.opponent = nextOpponent ? JSON.parse(JSON.stringify(nextOpponent)) : null;
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
      this.fieldState.weather = typeof payload.weather === 'string' ? payload.weather : payload.weather?.kind || null;
      this.fieldState.terrain = typeof payload.terrain === 'string' ? payload.terrain : payload.terrain?.kind || null;
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
    measureFeedback() {
      const scene = this.$refs.battleScene;
      if (scene !== this._feedbackScene) {
        this._feedbackObserver?.disconnect(); this._feedbackScene = scene;
        if (scene) this._feedbackObserver?.observe(scene);
      }
      if (!scene) return;
      if (this.feedbackSceneSize.width !== scene.clientWidth || this.feedbackSceneSize.height !== scene.clientHeight)
        this.feedbackSceneSize = { width: scene.clientWidth, height: scene.clientHeight };
      for (const side of ['wild', 'player']) {
        const ref = this.$refs[`feedback-${side}`], element = Array.isArray(ref) ? ref[0] : ref;
        const height = element?.offsetHeight || 0;
        if (this.feedbackHeights[side] !== height) this.$set(this.feedbackHeights, side, height);
      }
    },
    getResultPosition(side) {
      const geometry = this.getSpriteGeometry(side), scene = this.$refs.battleScene;
      const width = this.feedbackSceneSize.width || scene?.clientWidth || 320;
      const height = this.feedbackSceneSize.height || scene?.clientHeight || 220;
      const sceneRect = scene?.getBoundingClientRect();
      const card = (side === 'wild' ? this.$refs.opponentStatusCard : this.$refs.playerStatusCard)?.getBoundingClientRect();
      // Keep each feedback stack in the free column beside its HP card.
      const low = side === 'wild' && card && sceneRect ? card.right - sceneRect.left + 8 : 8;
      const high = side === 'player' && card && sceneRect ? card.left - sceneRect.left - 8 : width - 8;
      const maxWidth = Math.max(64, Math.min(180, high - low));
      const stackHeight = this.feedbackHeights[side] || 70;
      const otherCard = (side === 'wild' ? this.$refs.playerStatusCard : this.$refs.opponentStatusCard)?.getBoundingClientRect();
      let topLimit = 8, bottomLimit = height - 8;
      if (otherCard && sceneRect && low < otherCard.right - sceneRect.left && high > otherCard.left - sceneRect.left) {
        if (side === 'player') topLimit = Math.max(topLimit, otherCard.bottom - sceneRect.top + 8);
        else bottomLimit = Math.min(bottomLimit, otherCard.top - sceneRect.top - 8);
      }
      return {
        left: `${Math.max(low + maxWidth / 2, Math.min(high - maxWidth / 2, geometry.centerX))}px`,
        top: `${Math.max(topLimit, Math.min(bottomLimit - stackHeight, geometry.bottomY - geometry.height - stackHeight - 8))}px`,
        width: `${maxWidth}px`, maxHeight: `${Math.max(1, bottomLimit - topLimit)}px`
      };
    },
    buildMovePath(actor, damageClass, moveTarget) {
      const sourceSide = actor === 'opponent' ? 'wild' : 'player';
      const targetSide = actor === 'opponent' ? 'player' : 'wild';
      const source = this.getSpriteGeometry(sourceSide);
      const target = damageClass === 'status' && moveTarget !== 'opponent' ? source : this.getSpriteGeometry(targetSide);
      if (damageClass === 'status') return {startX:target.centerX,startY:target.centerY,targetX:target.centerX,targetY:target.centerY};
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
      if (this.reducedMotion()) return;
      this.movePath = this.buildMovePath(actor, damageClass, payload.moveTarget);
      Object.assign(this.battleMoveFx, {
        actor,
        moveName: payload.moveName || '',
        moveType: payload.moveType || 'Normal',
        damageClass,
        visible: true,
        nonce: this.battleMoveFx.nonce + 1
      });
      this._battleAudio?.move({ damageClass, moveType: payload.moveType || 'Normal' });
      this.moveTimer = setTimeout(() => {
        this.battleMoveFx.visible = false;
        this.moveTimer = null;
      }, damageClass === 'status' ? 850 : 650);
    },
    playMoveResult(payload = {}) {
      const labels = [];
      const side = payload.actor === 'opponent' ? 'player' : 'wild';
      const critical = payload.critical && Number(payload.damage) > 0 && !payload.missed && !payload.blocked && !payload.immune;
      clearTimeout(this.criticalTimer);
      this.criticalFx.side = null;
      this.pendingCritical = critical ? {side, key:this.getPokemonBattleKey(side === 'player' ? this.currentPokemon : this.opponent)} : null;
      if (critical && !this.reducedMotion()) {
        this.criticalFx = {side, nonce:this.criticalFx.nonce+1};
        this.criticalTimer = setTimeout(()=>{this.criticalFx.side=null;},700);
      }
      if (Number(payload.hits)>1 && !payload.missed && !payload.blocked && !payload.immune) {
        const side=payload.actor==='opponent'?'player':'wild';
        const hits=Math.min(10,Math.floor(Number(payload.hits)));
        this.playConditionChanges({player:[],wild:[],[side]:Array.from({length:hits},(_,i)=>({key:`hit-${i}`,kind:'hit',symbol:'✦',text:i===0?`${hits} coups`:''})).filter(Boolean)});
        // The count stays in result labels; don't duplicate it in the header.
        this.conditionNotice='';
      }
      if (Number(payload.hits) > 1) labels.push({ key: 'hits', text: `${payload.hits} ${this.preferences.language === 'en' ? 'hits' : 'coups'}` });
      if (payload.missed) labels.push({ key: 'miss', text: this.tr('missed') });
      if (payload.immune || Number(payload.effectiveness) === 0) labels.push({ key: 'immune', text: this.tr('immune') });
      else if (payload.blocked) labels.push({ key: 'blocked', text: this.tr('blocked') });
      if (critical) labels.push({ key: 'critical', text: this.tr('critical') });
      if (Number(payload.effectiveness) > 1) labels.push({ key: 'super', text: this.tr('superEffective') });
      if (Number(payload.effectiveness) > 0 && Number(payload.effectiveness) < 1) {
        labels.push({ key: 'resisted', text: this.tr('resisted') });
      }
      this.resultFx.visible = false;
      if (!labels.length) return;
      if (this.resultTimer) clearTimeout(this.resultTimer);
      this.resultFx.actor = payload.actor === 'player' ? 'opponent' : 'player';
      this.resultFx.labels = labels;
      this.resultFx.nonce += 1;
      this.resultFx.visible = true;
      if (payload.missed) this.playSound('miss');
      else if (critical) this.playSound('critical');
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
      fxState.critical = numericDelta < 0 && this.pendingCritical?.side === target && this.pendingCritical.key === this.getPokemonBattleKey(target === 'player' ? this.currentPokemon : this.opponent);
      if (this.pendingCritical?.side === target) this.pendingCritical = null;
      fxState.amount = Math.max(1, Math.round(Math.abs(numericDelta)));
      fxState.kind = numericDelta > 0 ? 'heal' : 'damage';
      fxState.hit = numericDelta < 0;
      fxState.visible = true;
      fxState.nonce += 1;
      if (numericDelta > 0) {
        this.playSound('heal');
        this.playConditionChanges({player:[],wild:[],[target]:[{key:'heal',kind:'heal',symbol:'+',text:'Soin'}]});
      }
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
      if (this.reducedMotion()) {
        this.showMessage(success ? this.tr('captured', { pokemon: pokemonName }) : this.tr('escaped', { pokemon: pokemonName }));
        return;
      }
      let complete;
      const playback = new Promise(resolve => { complete = resolve; });
      this._captureRelease = complete;
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
        this._captureRelease = null; complete();
      }, resultDelay + 620));
      this.captureTimers = timers;
      return playback;
    },
    unlockAudio() {
      this.syncAudio();
      return this._battleAudio?.unlock();
    },
    tone(frequency, duration, options = {}) {
      this._battleAudio?.tone(frequency, duration, options);
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
      this._captureRelease?.(); this._captureRelease = null;
      Object.assign(this.captureFx, {visible:false,state:'idle',targetContained:false});
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
      this.cancelEntrance();
      clearTimeout(this.criticalTimer); this.criticalFx.side=null; this.pendingCritical=null;
      this.visualEpoch++;this._sendOutController?.abort();this.sendOuts=[];this.trainerSpeech=null;this._transitionRelease?.();clearTimeout(this._transitionLabelTimer);clearTimeout(this.driftNoticeTimer);this.transitionFx={player:'',wild:''};this.transitionLabel='';this.driftNotices=[];clearTimeout(this.conditionTimer);this.conditionFx={player:[],wild:[]};this.conditionNotice='';
      if (this.messageTimer) clearTimeout(this.messageTimer);
      if (this.resultTimer) clearTimeout(this.resultTimer);
      this.messageTimer = null;
      this.resultTimer = null;
      this.clearMoveFx();
      this.clearCaptureTimers();
      this.clearHealthTimers();
    },
    resetBattleUi() {
      this._presentation?.cancel();
      this.usableMoveIndexes = null;
      this.resolvedMoveTypes = null;
      this.challenge = null;
      this.cancelExperience();
      this.finishing = false;
      clearTimeout(this.experienceTimer);
      this.experienceNotice = '';
      this.clearAllTimers();
      this.player = null;
      this.opponent = null;
      this.opponentEffortYield = null;
      this.canAct = false;
      this.replacementChoice = false;
      this.replacementIndexes = null;
      this.replacementId = null;
      this.actionTurnId = null;
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
.battle-critical-burst{position:absolute;transform:translate(-50%,-50%);z-index:55;pointer-events:none;color:#ffe390;filter:drop-shadow(0 2px 1px #633425);animation:critical-burst .7s ease-out both}
.battle-critical-burst i{position:absolute;left:50%;top:50%;height:5px;width:45%;background:linear-gradient(90deg,#fff7ce,#ffab45);border-radius:100%;transform-origin:0 50%;transform:rotate(calc(var(--ray)*45deg)) translateX(28%)}
.battle-critical-burst b{position:absolute;left:50%;top:50%;font:900 60px/1 Arial;transform:translate(-50%,-50%)}
@keyframes critical-burst{0%{opacity:0;scale:.45}22%{opacity:1;scale:1}75%{opacity:.8}100%{opacity:0;scale:1.3}}
@media(prefers-reduced-motion:reduce){.battle-critical-burst{display:none}}
.battle-reduced-motion .battle-critical-burst{display:none}

.battle-status-details {align-items:center;height:16px;min-height:16px}
.battle-status-details .battle-hp-value {flex:none;white-space:nowrap}
.battle-status-details .battle-conditions {flex:1}
.battle-status-details:has(.battle-conditions)>.battle-status-ability {display:none}
.battle-condition-notice{background:#ecf1e2;color:#325441;border:1px solid #abbc8e}
.battle-condition-fx{position:absolute;z-index:55;transform:translate(-50%,-50%);pointer-events:none;display:grid;place-items:center}
.battle-condition-fx i{position:absolute;inset:-10%;display:grid;place-items:center;font:bold 30px Arial,sans-serif;font-style:normal;color:#9ef5b6;text-shadow:0 1px 3px #112c28;border:2px solid currentColor;border-radius:50%;animation:condition-bloom .65s ease-out both;animation-delay:calc(min(var(--effect-index),3) * 10ms)}
.battle-condition-fx .condition-up{border:0;animation-name:condition-rise}
.battle-condition-fx .condition-down{border:0;color:#ffae92;animation-name:condition-fall}
.battle-condition-fx .condition-status{color:#dfaeff;animation-name:condition-orbit}
.battle-condition-fx .condition-shield{color:#a4e7ff;border-radius:25%;box-shadow:inset 0 0 16px #8fcfff70}
.battle-condition-fx .condition-break{color:#b3e0ff;border-style:dashed;animation-name:condition-break}
.battle-condition-fx .condition-charge{color:#ffe6a1}
.battle-condition-fx .condition-hit{border:0;color:#fff1b5;animation:condition-strike .16s ease-out both;animation-delay:calc(var(--effect-index) * 850ms / var(--effect-count));font-size:45px}
@keyframes condition-bloom{from{opacity:0;transform:scale(.45)}40%{opacity:1}to{opacity:0;transform:scale(1.25)}}
@keyframes condition-rise{from{opacity:0;transform:translateY(20px)}40%{opacity:1}to{opacity:0;transform:translateY(-30px)}}
@keyframes condition-fall{from{opacity:0;transform:translateY(-30px)}40%{opacity:1}to{opacity:0;transform:translateY(20px)}}
@keyframes condition-orbit{from{opacity:0;transform:scale(.7) rotate(-20deg)}40%{opacity:1}to{opacity:0;transform:scale(1.1) rotate(20deg)}}
@keyframes condition-break{from{opacity:1;transform:scale(.8)}to{opacity:0;transform:scale(1.5) rotate(20deg)}}
@keyframes condition-strike{from{opacity:0;transform:scale(.4) rotate(-30deg)}40%{opacity:1}to{opacity:0;transform:scale(1.25) rotate(20deg)}}
@media(prefers-reduced-motion:reduce){.battle-condition-fx{display:none}}
.battle-reduced-motion .battle-condition-fx{display:none}

/* Announcements share normal document flow; long Drift chains scroll inside the message area. */
.battle-announcements{display:flex;flex-direction:column;gap:5px;padding:7px 9px;flex:none;overflow-wrap:anywhere}
.battle-announcements p{position:static;transform:none;max-width:none;width:auto;margin:0;line-height:1.45;font-size:12px;padding:5px 8px;border-radius:7px}
.battle-transition-label{background:#fffbe9;color:#23483d;border:1px solid #c6d7b7}
.battle-action-notice{background:#fff1d8;color:#714c1e;border:1px solid #c7a260}
.battle-capture-notice{background:#e6f4f8;color:#245268;border:1px solid #9bbac8}
.battle-drift-notices{display:flex;flex-direction:column;gap:5px;color:#f8f1ff}
.battle-drift-notices p{border:1px solid #bfadd9;background:#413563}
.battle-fainted{opacity:0}.battle-transition-recall .battle-sprite{animation:combat-recall .55s ease-in forwards!important}.battle-transition-faint .battle-sprite{animation:combat-faint .55s ease-in forwards!important}.battle-transition-waiting .battle-sprite{opacity:0;animation:none!important}.battle-transition-enter .battle-sprite{animation:combat-enter .42s .34s ease-out both!important}@keyframes combat-recall{to{filter:brightness(3);transform:scale(.05);opacity:0}}@keyframes combat-faint{to{filter:grayscale(1);transform:translateY(65%);opacity:0}}@keyframes combat-enter{from{filter:brightness(2);transform:scale(.15);opacity:0}to{transform:scale(1);opacity:1}}.battle-reduced-motion .battle-sprite{animation:none!important}@media(prefers-reduced-motion:reduce){.battle-sprite{animation:none!important}}

.battle-entry-holding > .battle-scene, .battle-entry-holding > .battle-action-shell { visibility:hidden; }
.battle-entry-holding .battle-sprite { animation:none; }

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

.battle-cave .battle-background { filter:none; image-rendering:pixelated; object-position:50% 50%; }
.battle-cave .battle-atmosphere { background:linear-gradient(180deg,#211c4315,transparent 60%); }
.battle-cave .battle-ground-disc.cave-disc { position:absolute; left:0; top:0; width:calc(var(--sprite-visible-size) * 1.65); height:calc(var(--sprite-visible-size) * .4); transform:translate(-50%,-58%); border:3px solid #776b83; border-bottom:5px solid #51485f; border-radius:50%; background:#a19295; box-shadow:0 3px 0 #251d4140,inset 0 3px 0 #c8b4a6; }
.battle-cave .battle-position-player .cave-disc { width:calc(var(--sprite-visible-size) * 1.9); height:calc(var(--sprite-visible-size) * .46); transform:translate(-50%,-84%); }
.battle-colosseum .battle-background { filter:none; object-position:50% 44%; }
.battle-arena-background { position:absolute; inset:0; }
.battle-platform { position:absolute; z-index:0; width:var(--sprite-visible-size); height:0; pointer-events:none; }
.battle-platform img { position:absolute; left:0; top:0; width:170%; max-width:none; height:auto; transform:translate(-50%,var(--platform-offset-y,-46%)); }
.battle-platform.battle-position-player img { width:210%; }
.battle-challenge { color:#e7d19a; font:10px Arial,sans-serif; }
.battle-colosseum .battle-sprite { filter:drop-shadow(0 5px 2px #49361645); }
.battle-colosseum .battle-sprite:not(.battle-sprite-ready) { visibility:hidden; }
.battle-sprite-wild .battle-sprite { image-rendering:auto; }
.battle-colosseum .battle-position-player { top:88%; }

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

.battle-position-wild {
  --sprite-visible-size: 120px;
  left: 80%;
  top: 68%;
}

.battle-position-player {
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

.battle-effort-yield {
  margin: 5px 0 0;
  color: var(--journal-muted, #58717e);
  font: 10px/1.35 Arial, sans-serif;
  overflow-wrap: anywhere;
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

.battle-status-details .battle-status-ability {
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
  position: static;
  flex: none;
  z-index: 57;
  color: #ffeded;
  font: 900 clamp(22px, 3vw, 30px)/1.1 Arial, sans-serif;
  font-variant-numeric: tabular-nums;
  padding: 4px 9px;
  border: 2px solid #f1aaa1;
  border-radius: 10px;
  background: #3f1724f2;
  max-width: 100%;
  box-sizing: border-box;
  text-shadow: 0 1px 0 #000, 0 0 8px rgba(255, 65, 65, 0.5);
  pointer-events: none;
  animation: battle-feedback-number .95s ease-out forwards;
}

.battle-damage-text.is-critical { color:#ffe87b; border-color:#ffce50; background:#4a2912f5; }
.battle-health-heal {
  background:#143d2af2; border-color:#83dba4;
  color: #d9ffe2;
  text-shadow: 0 1px 0 #14301a, 0 0 10px rgba(78, 225, 117, 0.72);
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
  animation: none;
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

  .battle-position-wild {
    --sprite-visible-size: 98px;
    left: 76%;
    top: 64%;
  }

  .battle-position-player {
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
  .battle-status-lvl {
    font-size: 8px;
  }

  .battle-status-details {
    font-size: 6px;
  }

  .battle-status-details .battle-status-ability {
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
  line-height: 1.2;
  box-shadow: 0 2px 6px #10232270;
  animation: battle-feedback-label 1.05s ease-out forwards;
  flex:none;
  box-sizing:border-box;
  width:100%;
  overflow-wrap:anywhere;
}

.battle-result-fx {
  position: absolute;
  z-index: 72;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  pointer-events: none;
  transform: translateX(-50%);
  overflow:auto;
  overscroll-behavior:contain;
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

@keyframes battle-feedback-number { 0%{opacity:0} 15%,80%{opacity:1} 100%{opacity:0} }
@keyframes battle-feedback-label { 0%{opacity:0} 15%,85%{opacity:1} 100%{opacity:0} }
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
.experience-notice { color:#297eb5; font-size:11px; font-weight:800; }
</style>

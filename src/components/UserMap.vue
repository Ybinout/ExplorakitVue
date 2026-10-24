<template>
  <div :class="['game-root', { 'reduced-game-motion': !preferences.animationsEnabled, 'is-drift': isDrift, 'is-mobile': showMobileControls }]">
    <!-- <navBar></navBar> -->
    <div class="game-layout">
      <div class="game-stage" ref="gameStage">
      <fishing-prompt v-if="fishing && !battle" :state="fishing" @start="fishingAction" @cancel="cancelFishing()" />
      <p v-if="isDrift && driftState && driftState.storagePaused" class="recovery-notice" role="status">Sauvegarde indisponible. La partie est en pause ; elle reprendra automatiquement.</p>
      <p v-else-if="isDrift && driftState && driftState.recoveryWaiting" class="recovery-notice" role="status">Expédition restaurée. Le temps est suspendu : les dresseurs ont cinq minutes pour revenir.</p>
      <starter-choice v-if="isDrift && driftState?.phase==='selection'" :choices="driftState.starterChoices" :seconds="Math.max(0,Math.ceil((driftState.selectionEndsAt-driftClock-driftOffset)/1000))" :busy="starterBusy" :error="starterError" @choose="chooseStarter" @cancel="cancelStarter" />
      <move-learning-panel v-if="learningVisible" :key="learningPokemon.pendingMoves[0].id" :pokemon="learningPokemon" :busy="learningBusy" :error="learningError" @choose="chooseLearnedMove" @later="learningDeferred = true" />
      <battle-result-panel v-if="battleResult" :result="battleResult" :game-mode="isColosseum ? 'colosseum' : isDrift ? 'rift' : 'adventure'" :exploration-active="isDrift && driftState?.phase === 'exploration'" @continue="dismissBattleResult" />
      <rift-spectator-panel v-if="driftSpectator && !battle && !battleResult" :frame="driftSpectator" @close="closeDriftSpectator" />
      <drift-run-panel v-show="!learningVisible && !evolutionVisible" v-if="isDrift && driftState?.phase!=='selection' && isDriftPanelOpen && !battle && !battleResult && !driftSpectator" :initial-tab="driftPanelTab" :run-command="driftCommand" :state="driftState" :catalogue="driftCatalogue" :in-shop="isShopMap" :feedback="interactionNotice" @close="isDriftPanelOpen = false" @command="driftCommand" @team="openDriftTeam" @leave="leaveDrift" @watch="watchDriftMatch" />
      <expedition-trainer-offer v-if="trainerOffer && !battle && driftState?.phase==='exploration'" :offer="trainerOffer" :busy="trainerBusy" :error="trainerError" @close="trainerOffer=null" @challenge="challengeTrainer" />
      <battle-overlay
        ref="battleOverlay"
        :active="battle" :mobile="showMobileControls" :map-name="map"
        :bag-items="bagItems"
        :bag-loading="bagLoading"
        :preferences="preferences"
        :notice="interactionNotice"
        :colosseum-challenge="isColosseum && driftState?.phase !== 'exploration' ? driftState?.colosseum?.next : null"
        @action="handleBattleAction"
        @request-bag="loadBagItems"
      />
      <div class="game-shell" :inert="trainerOffer || driftState?.phase==='selection' || battleResult || driftSpectator || learningVisible || evolutionVisible ? '' : null" :aria-hidden="trainerOffer || driftState?.phase==='selection' || battleResult || driftSpectator || learningVisible || evolutionVisible ? 'true' : null">
        <div class="world-toolbar">
        <div class="game-header" ref="gameHeader">
          <div class="header-actions">
          <button ref="menuToggle" class="menu-toggle-btn" :class="{ 'has-contract-reward': readyContractCount > 0 }" :aria-expanded="isMenuOpen" aria-controls="adventure-menu" @click="toggleMenu">
            <journal-icon name="menu" />
            {{ tr('menu') }}
            <span v-if="readyContractCount" class="contract-reward-dot" data-contract-alert role="status" :aria-label="`${readyContractCount} récompense${readyContractCount > 1 ? 's' : ''} de contrat disponible${readyContractCount > 1 ? 's' : ''}`">{{ readyContractCount }}</span>
          </button>
          <button ref="teamToggle" class="team-toggle-btn" data-menu-action="pokemon" :aria-expanded="isTeamPanelOpen" aria-controls="pokemon-team-panel" @click="handleMenuAction('pokemon')">
            <journal-icon name="pokemon" /><span>{{ tr('pokemon') }}</span>
          </button>
          </div>
          <div v-if="isDrift" class="drift-hud">
            <div class="drift-clock"><drift-glyph name="clock" /><span><small>{{ driftPhaseLabel }}</small><strong>{{ driftCountdown || 'Rift' }}</strong></span></div>
            <button class="drift-hud-toggle" :aria-expanded="isDriftPanelOpen" aria-label="Ouvrir le carnet Drift" @click="toggleDriftPanel"><drift-glyph /><span>Drifts <small>{{ driftState?.equipped?.length || 0 }}/5</small></span></button>
          </div>
          <nav v-if="isMenuOpen" id="adventure-menu" class="menu-dropdown" :aria-label="tr('menu')">
            <button v-if="learningPokemon" class="menu-dropdown-item" @click="openMoveLearning"><journal-icon name="pokemon" /><span>Attaques à apprendre</span></button>
            <div class="menu-caption"><span>RiftMon</span><small>{{ isDrift ? (isColosseum ? 'Colosseum' : 'RiftMon') : (preferences.language === 'en' ? 'Adventure' : 'Aventure') }}</small></div>
            <button
              v-for="item in visibleMenuItems"
              :key="item.key"
              class="menu-dropdown-item"
              :data-menu-action="item.key"
              @click="handleMenuAction(item.key)"
            >
              <journal-icon :name="item.key==='contracts'?'progress':item.key" /><span>{{ menuItemLabel(item) }}</span>
              <small v-if="item.key==='contracts' && readyContractCount" class="contract-reward-label">{{ readyContractCount }} à récupérer</small>
            </button>
            <button class="menu-dropdown-item" data-menu-action="minimap" @click="handleMenuAction('minimap')"><journal-icon name="minimap" /><span>Minimap</span></button>
            <button class="menu-dropdown-item" data-menu-action="quit" :disabled="quitting" @click="quitGame"><journal-icon name="quit" /><span>{{ quitting ? tr('saving') : tr('saveAndQuit') }}</span><small>Accueil</small></button>
            <small v-if="isDrift" class="menu-quit-hint">Le temps continue hors du jeu. Une déconnexion prolongée compte comme un abandon.</small>
            <leave-expedition v-if="isDrift" :phase="driftState?.phase" :busy="starterBusy" :disabled="!socket?.connected" @confirm="cancelStarter" />
          </nav>
        </div>
        <div v-if="!battle" class="location-banner">
          <journal-icon class="location-pin" name="location" />
          <span class="location-copy"><small>{{ preferences.language === 'en' ? 'Current location' : 'Tu es ici' }}</small><span class="location-name" :title="locationLabel">{{ locationLabel }}</span></span>
          <button v-if="isShopMap" class="location-shop-btn" type="button" @click="openShop">
            {{ tr('openShop') }}
          </button>
        </div>
        </div>
        <bag-panel v-if="isBagOpen" ref="bagPanel" :items="bagItems" :loading="bagLoading" :error="bagError" :notice="medicineNotice" :repel-steps="repelSteps" :empty-label="emptyBagLabel" :expedition="isDrift" :language="preferences.language" @close="isBagOpen = false" @team="handleMenuAction('pokemon')">
          <template #actions="{item}">
              <machine-item-use v-if="item.category==='machine'" :key="item.key" :item="item" :team="teamPokemons" :busy="medicineBusy || teamLoading" :allowed="canUseBagItem(item)" @use="useBagMachine" />
              <template v-else-if="isBagConsumable(item)">
                <select data-medicine-target :disabled="medicineBusy || teamLoading || !canUseBagItem(item)" :value="medicineTargets[item.key] || ''" :aria-label="`Utiliser ${item.name} sur un Pokémon`" @change="$set(medicineTargets, item.key, $event.target.value)">
                  <option value="">Choisir un Pokémon…</option>
                  <option v-for="p in teamPokemons" :key="p.uuid" :value="p.uuid" :disabled="!canReceiveMedicine(item, p)">{{ medicineTargetLabel(item,p) }}</option>
                </select>
                <small v-if="(item.fieldUse?.effort||item.fieldUse?.ivReroll||item.fieldUse?.effortReset) && medicineTargets[item.key]" class="bag-use-hint" data-effort-preview>{{ effortPreview(item) }}</small>
                <label v-if="item.fieldUse?.effort?.amount>0&&item.quantity>=5" class="bag-use-hint">Quantité <select data-medicine-quantity :value="medicineQuantities[item.key]||1" :disabled="medicineBusy" @change="$set(medicineQuantities,item.key,Number($event.target.value))"><option v-for="n in [1,5,10,25].filter(n=>n<=item.quantity)" :key="n" :value="n">×{{ n }}</option></select><small>Seules les vitamines utiles seront consommées.</small></label>
                <button class="bag-use-button" :disabled="medicineBusy || teamLoading || !canUseBagItem(item) || !canReceiveMedicine(item, teamPokemons.find(p => p.uuid === medicineTargets[item.key]))" @click="useBagMedicine(item)">{{ medicineBusy ? 'Utilisation…' : 'Utiliser' }}</button>
                <small v-if="!canUseBagItem(item)" class="bag-use-hint">{{ isDrift && driftState?.phase !== 'exploration' ? 'Soins automatiques entre les combats du tournoi.' : 'Disponible hors combat.' }}</small>
                <small v-else-if="!teamPokemons.some(p => canReceiveMedicine(item, p))" class="bag-use-hint">{{ item.category === 'evolution' ? 'Aucun Pokémon compatible et apte dans ton équipe. Soigne les Pokémon K.O. avant de les faire évoluer.' : 'Aucun Pokémon n’a besoin de cet objet.' }}</small>
              </template>
              <template v-else-if="item.category==='field' && item.repelSteps">
                <button class="bag-use-button" data-use-repel :disabled="medicineBusy || !canUseBagConsumables || repelSteps>0 || !teamPokemons.some(p=>p.currentHp>0)" @click="useBagRepel(item)">{{ medicineBusy ? 'Utilisation…' : 'Utiliser' }}</button>
                <small v-if="repelSteps>0" class="bag-use-hint">Attends la fin du Repousse actif pour en utiliser un autre.</small>
                <small v-else-if="!canUseBagConsumables" class="bag-use-hint">Disponible pendant l’exploration, hors combat.</small>
              </template>
              <small v-else-if="isDrift && item.revive" class="bag-use-hint">Les K.O. sont définitifs dans ce mode.</small>
          </template>
        </bag-panel>
        <pokemon-computer v-if="pc.visible && pc.state" :state="pc.state" :busy="pc.busy" :error="pc.error" :notice="pc.notice" :username="currentUsername" :animations-enabled="preferences.animationsEnabled" @close="pc.visible=false" @command="useComputer"/>
        <div v-if="isAppearancePanelOpen" class="appearance-panel" ref="appearancePanel">
          <div class="appearance-title"><span><small>RiftMon</small>{{ tr('appearance') }}</span><button class="panel-close" :aria-label="tr('close')" @click="isAppearancePanelOpen = false">×</button></div>
          <div class="appearance-grid">
            <button
              v-for="spriteOption in availableSprites"
              :key="spriteOption.key"
              class="appearance-option"
              :class="{ 'is-active': selectedSprite === spriteOption.key }"
              :aria-pressed="selectedSprite === spriteOption.key"
              :disabled="appearanceBusy"
              :data-appearance="spriteOption.key"
              @click="selectPlayerSprite(spriteOption.key)"
            >
              <span class="appearance-preview" aria-hidden="true" :style="{ backgroundImage: `url(${spriteOption.src})` }"></span>
              <span class="appearance-label">{{ spriteOption.label }}</span>
            </button>
          </div>
          <p v-if="appearanceError" class="team-state team-error" role="alert">{{ appearanceError }}</p>
        </div>
        <div v-if="isTeamPanelOpen" id="pokemon-team-panel" class="team-panel" ref="teamPanel">
          <div class="team-title"><span><small>COMPAGNONS DE VOYAGE</small>{{ tr('team') }}</span><button class="team-close" :aria-label="tr('close')" @click="closeTeamPanel">×</button></div>
          <div v-if="teamLoading" class="team-state">{{ tr('loading') }}</div>
          <p v-if="teamError" class="team-state team-error" role="alert">{{ teamError }}</p>
          <div v-if="!teamLoading && teamPokemons.length === 0" class="team-state">{{ tr('noPokemon') }}</div>
          <div v-if="!teamLoading && teamPokemons.length" class="team-list">
            <div
              v-for="(pokemon, index) in teamPokemons"
              :key="pokemon.uuid || `slot-${index}`"
              class="team-row" :data-team-uuid="pokemon.uuid"
            >
              <button class="team-row-visual" :aria-label="`Voir la fiche de ${pokemon.name}`" @click="openPokemonDetails(pokemon)">
                <pokemon-portrait
                  v-if="pokemon.spriteId"
                  class="team-pokemon-sprite"
                  :src="getPokemonFrontSprite(pokemon.spriteId)"
                  alt=""
                />
              </button>
              <div class="team-row-main">
                <div class="team-row-top">
                  <span class="team-slot">#{{ index + 1 }}</span>
                  <button class="team-row-name team-detail-link" @click="openPokemonDetails(pokemon)">{{ pokemon.name }} <span>›</span></button>
                  <span class="team-level">lv.{{ pokemon.level }}</span>
                </div>
                <div class="team-hp-track">
                  <div
                    class="team-hp-fill"
                    :class="getTeamHpBarClass(pokemon)"
                    :style="{ width: `${getTeamHpPercent(pokemon)}%` }"
                  ></div>
                </div>
                <experience-bar :pokemon="pokemon" />
                <div class="team-row-meta">
                  {{ tr('hp') }} {{ pokemon.currentHp }} / {{ pokemon.maxHp }}
                </div>
                <div class="team-row-meta">{{ tr('ability') }} : {{ localizedAbility(pokemon.passiveAbility) || tr('noAbility') }}</div>
                <select
                  class="team-held-item-select"
                  :aria-label="`${preferences.language === 'en' ? 'Held item' : 'Objet tenu'} · ${pokemon.name}`"
                  :value="pokemon.heldItem || ''"
                  :disabled="teamSaving"
                  @change="equipHeldItem(pokemon, $event.target.value)"
                >
                  <option value="">{{ tr('noHeldItem') }}</option>
                  <option v-for="item in heldItemChoices(pokemon)" :key="item.key" :value="item.key">
                    {{ item.name }}{{ item.quantity ? ` (x${item.quantity})` : '' }}
                  </option>
                </select>
                <p v-if="pokemon.heldItem" class="team-item-description">{{ heldDescription(pokemon.heldItem) }}</p>
                <p v-if="pokemon.riftFainted" class="team-item-description">Sauvé par un talisman · K.O. jusqu’à un soin hors combat.</p>
              </div>
              <div class="team-row-actions">
                <button
                  class="team-order-btn"
                  :aria-label="`${preferences.language === 'en' ? 'Move up' : 'Monter'} ${pokemon.name}`"
                  :disabled="index === 0 || teamSaving"
                  @click="moveTeamPokemon(index, 'up')"
                >
                  ↑
                </button>
                <button
                  class="team-order-btn"
                  :aria-label="`${preferences.language === 'en' ? 'Move down' : 'Descendre'} ${pokemon.name}`"
                  :disabled="index === teamPokemons.length - 1 || teamSaving"
                  @click="moveTeamPokemon(index, 'down')"
                >
                  ↓
                </button>
              </div>
            </div>
          </div>
          <p class="team-order-status" role="status">{{ teamSaving ? tr('saving') : teamOrderNotice || tr('orderAutoSave') }}</p>
        </div>
        <game-info-panels
          :flight-allowed="!isDrift" @fly="flyToTown"
          :active="activeInfoPanel"
          :current-map="map" :current-region="players[socket?.id]?.regionLocation"
          :recovery-busy="positionRecoveryBusy" :recovery-allowed="!battle && !battleResult && (!isDrift || (driftState?.alive && driftState?.phase === 'exploration' && !driftState?.storagePaused && !driftState?.recoveryWaiting))" :recovery-notice="positionRecoveryNotice"
          @recover-position="recoverPosition"
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
          :catalog="shop.catalog" :metadata="shop.metadata" :location="locationLabel"
          :expedition="isDrift" :merchant="shop.metadata.department && shop.metadata.department!==1 ? null : driftState?.merchant" :drift-catalogue="driftCatalogue" :drifts="driftState?.drifts || []" :equipped="driftState?.equipped || []" @merchant="merchantCommand"
          :items="bagItems"
          :money="shop.money"
          :loading="shop.loading"
          :error="shop.error"
          :language="preferences.language"
          @close="closeShop"
          @buy="buyShopItem"
        />
        <div class="world-viewport" ref="worldViewport">
          <flight-transition v-if="flight" :flight="flight" :reduced="!preferences.animationsEnabled || worldWeatherReducedMotion" :language="preferences.language" />
          <canvas class="test" ref="monCanvas" :aria-label="locationLabel"
            @pointerdown="startMobileGesture($event, 'map')" @pointermove="moveMobileGesture"
            @pointerup="endMobileGesture" @pointercancel="endMobileGesture" @lostpointercapture="endMobileGesture"></canvas>
          <room-obstacle-action v-if="roomObstacleAction && !battle" :action="roomObstacleAction" :language="preferences.language" />
          <div v-if="!roomObstacleAction && interactionNotice && interactionNoticeKind === 'gate' && !battle && !textImageSequence.length" class="story-gate-notice" role="status">{{ interactionNotice }}</div>
          <div v-if="nearbyRoomObstacle && !roomObstacleAction && !interactionNotice && !battle && !textImageSequence.length" class="story-gate-notice" role="status">{{ preferences.language === 'en' ? 'A / Space · Clear the boards' : 'A / Espace · Dégager les planches' }}</div>
          <div v-if="mapLoading || mapLoadError || worldContextLost" class="world-loading" role="status" :class="{ 'has-error': mapLoadError }">
            <span>{{ mapLoadError || (preferences.language === 'en' ? 'Loading location…' : 'Chargement du lieu…') }}</span>
            <button v-if="mapLoadError" @click="loadMapImage">{{ preferences.language === 'en' ? 'Retry' : 'Réessayer' }}</button>
          </div>
        </div>
        <div v-if="showMobileControls" class="mobile-control-dock"
          @pointerdown="startMobileGesture($event, 'map')" @pointermove="moveMobileGesture"
          @pointerup="endMobileGesture" @pointercancel="endMobileGesture" @lostpointercapture="endMobileGesture">
        <div
          v-if="showMobileControls && !pc.visible && !trainerOffer && !battle && !battleResult && !driftSpectator && !learningVisible && !isMenuOpen && !isBagOpen && !isTeamPanelOpen && !isAppearancePanelOpen && !activeInfoPanel && !shop.visible && !selectedPokemonUuid && !isDriftPanelOpen"
          :class="['mobile-controls-shell', { 'dialogue-active': textImageSequence.length > 0 }]"
        >
          <div class="mobile-dpad" :inert="textImageSequence.length ? '' : null" :aria-hidden="textImageSequence.length ? 'true' : null" aria-label="Pad directionnel"
            @pointerdown.stop.prevent="startMobileGesture($event, 'pad')" @pointermove.stop.prevent="moveMobileGesture"
            @pointerup.prevent="endMobileGesture" @pointercancel.prevent="endMobileGesture" @lostpointercapture="endMobileGesture">
            <button
              class="mobile-dpad-btn mobile-dpad-up"
              aria-label="Aller en haut"
              data-direction="z" :class="{ 'is-held': keysPressed.z }" @click="tapMobileDirection('z', $event)"
            >
              ▲
            </button>
            <button
              class="mobile-dpad-btn mobile-dpad-left"
              aria-label="Aller à gauche"
              data-direction="q" :class="{ 'is-held': keysPressed.q }" @click="tapMobileDirection('q', $event)"
            >
              ◀
            </button>
            <div class="mobile-dpad-center"></div>
            <button
              class="mobile-dpad-btn mobile-dpad-right"
              aria-label="Aller à droite"
              data-direction="d" :class="{ 'is-held': keysPressed.d }" @click="tapMobileDirection('d', $event)"
            >
              ▶
            </button>
            <button
              class="mobile-dpad-btn mobile-dpad-down"
              aria-label="Aller en bas"
              data-direction="s" :class="{ 'is-held': keysPressed.s }" @click="tapMobileDirection('s', $event)"
            >
              ▼
            </button>
          </div>
          <div class="mobile-action-group">
          <button
            class="mobile-action-a"
            :disabled="!!roomObstacleAction"
            :aria-label="textImageSequence.length ? (preferences.language === 'en' ? 'Continue dialogue' : 'Continuer le dialogue') : (preferences.language === 'en' ? 'Interact' : 'Parler ou agir')"
            @pointerdown.stop.prevent="triggerMobileActionA"
            @click="activateMobileActionA"
          >
            A
          </button>
          <span>{{ textImageSequence.length ? (preferences.language === 'en' ? 'Continue' : 'Continuer') : (nearbyRoomObstacle ? (preferences.language === 'en' ? 'Clear boards' : 'Dégager') : (preferences.language === 'en' ? 'Interact' : 'Parler / agir')) }}</span>
          </div>
        </div>
        </div>
        <div v-if="interactionNotice && interactionNoticeKind !== 'gate' && !battle" class="interaction-notice">
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
      <div v-if="textImageSequence.length > 0 && !battleResult && !driftSpectator" class="dialogue-backdrop"></div>
      <div v-if="textImageSequence.length > 0 && !battleResult && !driftSpectator" class="dialogue-layer">
        <TextWithImage
          :sequence="textImageSequence"
          :char-per-step="preferences.textSpeed"
          :sound-volume="preferences.masterVolume / 100"
          :sound-enabled="preferences.masterVolume > 0"
          @sequence-end="clearSequence"
        />
      </div>
      </div>
    </div>

    <evolution-presentation v-if="evolutionVisible" :key="evolutionQueue[0].key" :evolution="evolutionQueue[0]" :remaining="evolutionQueue.length" :animations-enabled="preferences.animationsEnabled" @continue="evolutionQueue.shift()" />
    <pokemon-details v-if="selectedPokemonUuid && selectedPokemon" v-show="!evolutionVisible" :pokemon="selectedPokemon" :position="teamPokemons.indexOf(selectedPokemon) + 1" :total="teamPokemons.length" :evolution-options="evolutionOptions" :evolution-loading="evolutionLoading" :evolution-busy="evolutionBusy" :evolution-error="evolutionError" :evolution-notice="evolutionNotice" :evolution-allowed="!battle && !battleResult && (!isDrift || (driftState?.alive && !driftState?.storagePaused && !driftState?.recoveryWaiting))" @evolve="evolveCompanion" @reload-evolutions="loadEvolutionOptions" @close="selectedPokemonUuid = null" @navigate="navigatePokemonDetails" />
  </div>
</template>

<script>
import FishingPrompt from './world/FishingPrompt.vue';
import { drawFishing } from '@/services/fishingRenderer';
import RoomObstacleAction from './world/RoomObstacleAction.vue';
import { StoryGateRenderer } from '@/services/storyGateRenderer';
import { drawNpcFrame, npcWorldSize, usesClassicNpcAtlas, npcRenderOffset } from '@/services/npcFrames';
import FlightTransition from './FlightTransition.vue';
import { flightPose } from '@/services/flightAnimation';
import {resolveMapAsset} from '@/services/mapAssets';
import { getWorldCamera, WORLD_WIDTH, WORLD_HEIGHT } from '@/services/worldCamera';
import { createMapSceneLoader } from '@/services/mapScene';
import { moveTouchGesture } from '@/services/touchMovement';
import JournalIcon from './menu/JournalIcon.vue';
import BagPanel from './menu/BagPanel.vue';
import MachineItemUse from './menu/MachineItemUse.vue';
import moveLearningData from '@/data/moveLearning.json';
import PokemonComputer from './menu/PokemonComputer.vue';
import {drawPokemonComputers} from '@/services/pokemonComputer';
import api from "@/services/api";
import { getSession, clearSession } from "@/services/session";
import { saveDriftReport } from "@/services/driftReportHistory";
import DriftRunPanel from "./drift/DriftRunPanel.vue";
import ExpeditionTrainerOffer from "./drift/ExpeditionTrainerOffer.vue";
import RiftSpectatorPanel from "./drift/RiftSpectatorPanel.vue";
import DriftGlyph from "./drift/DriftGlyph.vue";
import { createGameSocket, createDriftSocket, isSessionConnectionFailure } from "@/services/realtime";
import {
  getDirectionFromAction,
  getDirectionFromDelta,
  getSpriteLabel,
  getSpriteOrder,
  getTeamHpPercent,
  normalizeSpriteName,
  normalizeTeamPokemon
} from "@/services/gameView";
import PokemonPortrait from './PokemonPortrait.vue';
import LeaveExpedition from './drift/LeaveExpedition.vue';
import StarterChoice from './drift/StarterChoice.vue';
import heldItemDefinitions from '@/data/heldItems.json';
import PokemonDetails from './menu/PokemonDetails.vue';
import ExperienceBar from './ExperienceBar.vue';
import './adventure.css';
import './worldViewport.css';
import './gamePopupLayout.css';
import { attachGamePopupLayout } from './gamePopupLayout';
import BattleOverlay from './battle/BattleOverlay.vue';
import BattleResultPanel from './battle/BattleResultPanel.vue';
import MoveLearningPanel from './menu/MoveLearningPanel.vue';
import EvolutionPresentation from './menu/EvolutionPresentation.vue';
import { illustratedNpcPortrait } from '@/services/npcPortraits';
import { VillageWaterRenderer, hasVillageWater } from '@/services/villageWater';
import { PlaceAmbienceRenderer, placeAmbienceProfile } from '@/services/placeAmbience';
import { ForegroundWindRenderer, hasWindTrees } from '@/services/foregroundWind';
import { GrassRustleRenderer, hasRustlingGrass } from '@/services/grassRustle';
import { SnowFootprintsRenderer, hasSnowGround } from '@/services/snowFootprints';
import { DirtFootprintsRenderer, hasDirtGround } from '@/services/dirtFootprints';
import { WorldWeatherRenderer, worldWeatherEnabled, mapWorldWeather } from '@/services/worldWeather';
import { createEvolutionTracker } from '@/services/evolutionPresentation';
import evolutionGraph from '@/data/evolutionGraph.json';
import { buildBattleResult } from '@/services/battleResult';
import GameInfoPanels from './menu/GameInfoPanels.vue';
import ShopPanel from './shop/ShopPanel.vue';
import TextWithImage from './TextWithImage.vue';
import { loadGamePreferences, saveGamePreferences } from '@/services/gamePreferences';
import { localizeAbilityName, translate } from '@/services/i18n';
import { getMapLocationLabel } from '@/services/mapLocations';
import { WorldMusic } from '@/services/worldMusic';
// import navBar from "./NavBar.vue"
/* eslint-disable */

const MOVEMENT_INPUT_INTERVAL_MS = 150;
const MOVEMENT_INTERPOLATION_MS = 175;

export default {
  components: {
    RoomObstacleAction,
    FlightTransition,
    FishingPrompt, StarterChoice, LeaveExpedition,
    JournalIcon, BagPanel, MachineItemUse, PokemonComputer,
    BattleResultPanel,
    MoveLearningPanel, EvolutionPresentation,
    DriftRunPanel, ExpeditionTrainerOffer,
    RiftSpectatorPanel,
    DriftGlyph,
    PokemonPortrait,
    PokemonDetails,
    ExperienceBar,
    TextWithImage,
    BattleOverlay,
    GameInfoPanels,
    ShopPanel
  },
  data() {
    return {
      fishing:null, fishingReceivedAt:0,
      mapWeather: null, worldWeatherReducedMotion: false,
      worldAudioConnected: false,
      trainerOffer:null, trainerBusy:false, trainerError:'', driftPanelTab:'drifts', driftState: null, driftCatalogue: null, isDriftPanelOpen: false, driftTurnId: null, driftClock: Date.now(), driftOffset: 0, driftClockTimer: null, archivedDriftRunId: null, driftSpectator: null,
      starterBusy:false,starterError:'',
      worldDevices:null, pc:{visible:false,busy:false,state:null,error:'',notice:''},
      repelSteps:0, medicineBusy:false, medicineNotice:'', medicineTargets: {}, medicineQuantities:{},
      endSentences: null,
      flight: null,
      textImageSequence: [],
      socket: null,
      animationFrameId: null,
      lastAnimationTimestamp: null,
      movementIntervalId: null,
      lock: false,
      battle: false,
      worldContextLost: false,
      battleResult: null,
      pendingBattleResult: null,
      learningDeferred: false, learningBusy: false, learningError: '',
      evolutionQueue: [], evolutionTracker: createEvolutionTracker(evolutionGraph),
      positionRecoveryBusy: false, positionRecoveryNotice: '',
      evolutionOptions: [], evolutionLoading: false, evolutionBusy: false, evolutionError: '', evolutionNotice: '',
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
      renderedMap: null,
      mapLoading: true,
      mapLoadError: '',
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
      selectedPokemonUuid: null,
      activeInfoPanel: '',
      menuDataLoading: false,
      pokedexState: { total: 493, seen: 0, caught: 0, entries: [] },
      progressionState: { flags: {}, quests: [], badges: [], completedNpcBattles: [], money: 0 },
      shop: {
        visible: false,
        loading: false,
        error: '',
        catalog: [],
        metadata:{},
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
      teamOrderNotice: '',
      currentUserId: null,
      currentUsername: '',
      showMobileControls: false,
      worldFrame: { width: WORLD_WIDTH, height: WORLD_HEIGHT, pixelRatio: 1 },
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
      roomObstacleAction: null,
      roomObstacles: [],
      interactionNotice: '',
      interactionNoticeKind: '',
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
        { key: 'badges' },
        { key: 'appearance' },
        { key: 'bag' },
        { key: 'options' }
      ],


      spriteSheet: null,
      spriteSheets: {},
      availableSprites: [],
      selectedSprite: 'sprite.png',
      appearanceBusy: false,
      appearanceError: '',
      quitting: false,
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
    worldMusicState() {
      return {
        map: this.map,
        volume: this.preferences.masterVolume / 100,
        // Keep playing while the next map decodes, including route → route.
        active: this.worldAudioConnected && Boolean(this.renderedMap) && !this.battle && !this.battleResult
          && !this.pendingBattleResult && !this.driftSpectator
          && (!this.isDrift || this.driftState?.phase === 'exploration')
      };
    },
    placeAmbienceActive() { return Boolean(placeAmbienceProfile(this.map)) && !(this.battle || this.battleResult || this.pendingBattleResult || this.driftSpectator || this.evolutionVisible || this.learningVisible || this.mapLoading || this.mapLoadError || this.renderedMap !== this.map); },
    villageWaterActive() { return hasVillageWater(this.map) && !(this.battle || this.battleResult || this.pendingBattleResult || this.driftSpectator || this.evolutionVisible || this.learningVisible || this.mapLoading || this.mapLoadError || this.renderedMap !== this.map); },
    effectiveWorldWeather() { return mapWorldWeather(this.map, this.mapWeather); },
    worldWeatherActive() { return Boolean(this.effectiveWorldWeather.wind || this.effectiveWorldWeather.rain || this.effectiveWorldWeather.sand || this.effectiveWorldWeather.snow) && worldWeatherEnabled(this.map, { battle: this.battle || this.battleResult || this.pendingBattleResult || this.driftSpectator || this.evolutionVisible || this.learningVisible, loading: this.mapLoading || this.mapLoadError || this.renderedMap !== this.map }); },
    snowFootprintsActive() { return hasSnowGround(this.map) && this.preferences.animationsEnabled && !this.worldWeatherReducedMotion && !this.mapLoading && !this.mapLoadError && this.renderedMap === this.map && !this.battle && !this.battleResult && !this.pendingBattleResult && !this.driftSpectator && !this.evolutionVisible && !this.learningVisible; },
    dirtFootprintsActive() { return hasDirtGround(this.map) && this.preferences.animationsEnabled && !this.worldWeatherReducedMotion && !this.mapLoading && !this.mapLoadError && this.renderedMap === this.map && !this.battle && !this.battleResult && !this.pendingBattleResult && !this.driftSpectator && !this.evolutionVisible && !this.learningVisible; },
    grassRustleActive() { return hasRustlingGrass(this.map) && this.preferences.animationsEnabled && !this.worldWeatherReducedMotion && !this.mapLoading && !this.mapLoadError && this.renderedMap === this.map && !this.battle && !this.battleResult && !this.pendingBattleResult && !this.driftSpectator && !this.evolutionVisible && !this.learningVisible; },
    learningPokemon() {
      if (this.isDrift && (!this.driftState?.alive || this.driftState.phase === 'results')) return null;
      return this.teamPokemons.find(p => p.currentHp > 0 && p.pendingMoves?.length);
    },
    evolutionVisible() { return Boolean(this.evolutionQueue.length && !this.pc.visible && !this.battle && !this.battleResult && !this.pendingBattleResult && !this.driftSpectator && !this.trainerOffer && !this.textImageSequence.length && !this.evolutionBusy && !this.medicineBusy && !this.learningBusy && this.driftState?.phase !== 'selection'); },
    learningVisible() { return Boolean(!this.evolutionQueue.length && !this.pc.visible && this.learningPokemon && !this.learningDeferred && !this.battle && !this.battleResult && !this.pendingBattleResult && !this.driftSpectator && !this.selectedPokemonUuid); },
    isColosseum() { return this.$route.name === 'ColosseumGame' || this.driftState?.mode === 'colosseum'; },
    driftLobbyPath() { return this.isColosseum ? '/colosseum' : '/drift'; },
    isDrift() { return ['DriftGame','ColosseumGame'].includes(this.$route.name); },
    emptyBagLabel() {
      if (this.isDrift && this.driftState && !this.driftState.alive) return 'Ton expédition est terminée : ses objets ont disparu.';
      return this.tr('emptyBag');
    },
    visibleMenuItems() { return this.isDrift ? [...this.menuItems.filter(i => !['pokedex', 'progress', 'badges', 'save'].includes(i.key)), { key: 'drifts' }, ...(this.driftState?.contracts?.length?[{key:'contracts'}]:[])] : this.menuItems; },
    readyContractCount() { return this.isDrift && this.driftState?.alive && this.driftState.phase === 'exploration' ? (this.driftState.contracts || []).filter(c => c.complete && !c.claimed).length : 0; },
    driftPhaseLabel() { return { selection:'Choix du compagnon', exploration: 'Exploration', transition: 'Rassemblement', preparation: 'Préparation du tournoi', tournament: 'Tournoi', colosseum_ready: 'Colosseum · prêt ?', colosseum_battle: 'Colosseum', results: 'Expédition terminée' }[this.driftState?.phase] || 'Connexion Drift'; },
    driftCountdown() { const end = this.driftState?.phase === 'exploration' ? this.driftState.endsAt : ['preparation','tournament'].includes(this.driftState?.phase) ? this.driftState.preparationEndsAt : null; if (!end) return this.isColosseum && this.driftState?.colosseum ? `${this.driftState.colosseum.score} pts` : ''; const seconds = Math.max(0, Math.ceil((end - this.driftClock - this.driftOffset) / 1000)); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; },
    selectedPokemon() { return this.teamPokemons.find(pokemon => pokemon.uuid === this.selectedPokemonUuid); },
    evolutionLookupKey() { const p = this.selectedPokemon; return p ? [p.uuid,p.data?.id,p.level,p.currentHp,p.attack,p.defense,(p.abilities || []).join(',')].join(':') : ''; },
    locationLabel() {
      if (this.isColosseum && this.map === 'ville1_arene' && this.driftState?.phase !== 'exploration') return 'Colosseum';
      return getMapLocationLabel(this.map, this.preferences.language);
    },
    isShopMap() {
      return ['tour_rdc','tour_etage1','tour_etage2','tour_etage3','ville_safe1_shop', 'ville1_shop', 'gen_shop1', 'gen_shop_ville2_1', 'gen_shop_ville5_1', 'gen_shop_route10', 'ville3_shop', 'ville4_shop', 'ville5_shop'].includes(this.map);
    },
    heldBagItems() {
      if (!Array.isArray(this.bagItems)) return [];
      return this.bagItems.filter((item) => item.category === 'held' && Number(item.quantity) > 0);
    },
    nearbyRoomObstacle() {
      const player = this.players[this.socket?.id];
      if (!player || this.isDrift) return null;
      const x = Math.floor(player.x / 32), y = Math.floor(player.y / 32);
      return this.roomObstacles.find(o => o.map === this.map && o.locked
        && o.cells.some(p => Math.abs(p.x - x) + Math.abs(p.y - y) <= 1)) || null;
    },
    movementBlocked() { return this.worldContextLost || this.mapLoading || !!this.mapLoadError || this.movementSuspended; },
    movementSuspended() {
      return !!this.roomObstacleAction || !!this.flight || this.quitting || this.lock || this.battle || this.battleResult || this.driftSpectator
        || this.evolutionVisible || this.trainerOffer || this.learningVisible || this.isDriftPanelOpen || this.isMenuOpen || this.isBagOpen || this.isAppearancePanelOpen
        || this.pc.visible || this.selectedPokemonUuid || this.isTeamPanelOpen || this.activeInfoPanel || this.chatSession.visible
        || this.shop.visible || this.textImageSequence.length > 0 || this.interactionChoice.visible || this.incomingRequest.visible
        || (this.isDrift && (!this.driftState?.alive || this.driftState.phase !== 'exploration' || this.driftState.storagePaused || this.driftState.recoveryWaiting));
    },
    canUseBagConsumables() {
      return !this.battle && (!this.isDrift || (this.driftState?.alive && this.driftState?.phase === 'exploration' && !this.driftState?.storagePaused && !this.driftState?.recoveryWaiting));
    }
  },
  watch: {
    worldMusicState: { handler() { this.syncWorldMusic(); }, deep: true },
    placeAmbienceActive(active) { if (!active) this._placeAmbience?.suspend(); },
    villageWaterActive(active) { if (!active) this._villageWater?.suspend(); },
    worldWeatherActive(active) { if (!active) { this._worldWeather?.suspend(); this._foregroundWind?.suspend(); this._backgroundWind?.suspend(); } },
    map() { this.cancelFishing(); this._worldWeather?.suspend(); this._foregroundWind?.suspend(); this._backgroundWind?.suspend(); this._placeAmbience?.suspend(); this._villageWater?.suspend(); this._grassRustle?.suspend(); this._snowFootprints?.suspend(); this._dirtFootprints?.suspend(); },
    dirtFootprintsActive(active) { if (!active) this._dirtFootprints?.suspend(); },
    snowFootprintsActive(active) { if (!active) this._snowFootprints?.suspend(); },
    grassRustleActive(active) { if (!active) this._grassRustle?.suspend(); },
    mapLoadError(error) { if (error) this.releaseAllMovementKeys(); },
    evolutionLookupKey() { this.loadEvolutionOptions(); },
    selectedPokemonUuid() { this.evolutionNotice = ''; },
    movementSuspended(blocked) { if (blocked) { this.cancelFishing(); this.releaseAllMovementKeys(); } },
    movementBlocked(blocked) {
      if (blocked) {
        if (this.mapLoading && !this.movementSuspended && this._touchGesture) this.setMobileDirection(null);
        else this.releaseAllMovementKeys();
      } else this.resumeMobileGesture();
    },
    learningVisible(visible) { if (visible) { this.releaseAllMovementKeys(); this.learningError = ''; } },
    battle(isInBattle) {
      if (isInBattle) {
        this.releaseAllMovementKeys();
      }
    }
  },

  methods: {
    syncWorldMusic() {
      this._worldMusic?.update({ ...this.worldMusicState, active: this.worldMusicState.active && !document.hidden });
    },
    async loadEvolutionOptions() {
      const pokemon = this.selectedPokemon, key = this.evolutionLookupKey;
      this.evolutionOptions = []; this.evolutionError = '';
      if (!pokemon || !this.socket?.connected) { this.evolutionLoading = false; return; }
      this.evolutionLoading = true;
      try {
        const response = await new Promise((resolve,reject) => this.socket.timeout(8000).emit('getPokemonEvolutions', { pokemonUuid: pokemon.uuid }, (error,result) => error ? reject(new Error('Chargement indisponible. Réessaie dans un instant.')) : resolve(result)));
        if (this.evolutionLookupKey !== key) return;
        if (!response?.success) throw new Error(response?.message || 'Conditions indisponibles.');
        this.evolutionOptions = response.options || [];
      } catch (error) { if (this.evolutionLookupKey === key) this.evolutionError = error.message; }
      finally { if (this.evolutionLookupKey === key) this.evolutionLoading = false; }
    },
    async evolveCompanion(targetId) {
      const pokemon = this.selectedPokemon;
      if (!pokemon || this.evolutionBusy || !this.socket?.connected || this.battle || this.battleResult) return;
      this.evolutionBusy = true; this.evolutionError = ''; this.evolutionNotice = '';
      try {
        const response = await new Promise((resolve,reject) => this.socket.timeout(8000).emit('evolvePokemon', { pokemonUuid: pokemon.uuid, fromSpeciesId: pokemon.data.id, targetId }, (error,result) => error ? reject(new Error('Vérifie la fiche avant de réessayer : le serveur ne répond pas.')) : resolve(result)));
        if (!response?.success) throw new Error(response?.message || 'Évolution indisponible.');
        if (response.equipe?.pokemons) this.applyTeamPokemons(response.equipe.pokemons);
        if (this.selectedPokemonUuid === pokemon.uuid) this.evolutionNotice = `${pokemon.truename || pokemon.name} a évolué en ${response.evolution.name} !`;
      } catch (error) { if (this.selectedPokemonUuid === pokemon.uuid) this.evolutionError = error.message; }
      finally { this.evolutionBusy = false; }
    },
    openMoveLearning() { this.isMenuOpen = false; this.learningDeferred = false; this.releaseAllMovementKeys(); },
    async chooseLearnedMove(slot) {
      const pokemon = this.learningPokemon;
      if (this.learningBusy || !pokemon || !this.socket?.connected) return;
      this.learningBusy = true; this.learningError = '';
      try {
        const data = { pokemonUuid: pokemon.uuid, choiceId: pokemon.pendingMoves[0].id, slot };
        const response = await new Promise((resolve, reject) => this.socket.timeout(8000).emit(this.isDrift ? 'drift:learnMove' : 'learnMove', data,
          (error, result) => error ? reject(new Error('Connexion interrompue. Vérifie ton équipe avant de réessayer.')) : resolve(result)));
        if (!response?.success) throw new Error(response?.message || 'Apprentissage indisponible.');
        if (response.equipe) this.applyTeamPokemons(response.equipe.pokemons);
      } catch (error) { this.learningError = error.message; }
      finally { this.learningBusy = false; }
    },
    async presentBattleEnd(payload) {
      const result = buildBattleResult(payload, this.isDrift ? 'drift' : 'adventure');
      this.pendingBattleResult = result;
      this.releaseAllMovementKeys();
      this.closeLegacyPanels(); this.closeInfoPanel(); this.closeShop();
      this.isMenuOpen = false; this.selectedPokemonUuid = null; this.lock = true;
      try {
        await this.$refs.battleOverlay?.finishPresentation();
      } catch (error) {
        // A failed visual effect must never strand an already settled combat.
        if (this.pendingBattleResult !== result || this._isDestroyed || this._isBeingDestroyed) return;
        console.warn('Présentation de fin de combat interrompue:', error);
        this.$refs.battleOverlay?.resetBattleUi();
      }
      if (this.pendingBattleResult !== result || this._isDestroyed || this._isBeingDestroyed) return;
      this.battleResult = result; this.pendingBattleResult = null;
      this.battle = false;
      this.loadTeamPokemons();
    },
    isBagConsumable(item) {
      return Boolean((item.category === 'medicine' || item.category === 'heal' || item.fieldUse || item.category==='evolution') && !(this.isDrift && item.revive));
    },
    canUseBagItem(item) { return (item.category==='machine' || item.category==='evolution' || item.fieldUse?.effort || item.fieldUse?.ivReroll || item.fieldUse?.effortReset) && this.isDrift ? !this.battle && this.driftState?.alive && ['exploration','preparation','tournament','colosseum_ready'].includes(this.driftState?.phase) : this.canUseBagConsumables; },
    canReceiveMedicine(item, pokemon) {
      if (!pokemon) return false;
      if(item.category==='evolution')return !pokemon.isEgg && pokemon.currentHp > 0 && Boolean(item.evolutions?.[pokemon.uuid]);
      const effect = item.fieldUse || item;
      if (effect.revive) return !this.isDrift && pokemon.currentHp <= 0;
      if (pokemon.currentHp <= 0 && !(this.isDrift && pokemon.riftFainted && (effect.heal || effect.healFraction || item.category==='heal'))) return false;
      if(effect.ivReroll)return !pokemon.isEgg&&Number.isInteger(pokemon.iv?.[effect.ivReroll])&&pokemon.iv[effect.ivReroll]>=0&&pokemon.iv[effect.ivReroll]<=31;
      if(effect.effortReset)return !pokemon.isEgg&&(effect.effortReset==='all'?Object.values(pokemon.ev||{}).some(n=>n>0):(pokemon.ev?.[effect.effortReset]||0)>0);
      if (effect.effort) {
        if (pokemon.isEgg) return false;
        const ev=pokemon.ev || {},value=Number(ev[effect.effort.stat]) || 0;
        return effect.effort.amount < 0 ? value>0 : value<252 && Object.values(ev).reduce((n,v)=>n+Number(v),0)<510;
      }
      if (effect.restorePp) return !pokemon.isEgg && pokemon.abilities?.some((name,i)=>pokemon.movePp?.[i] < (moveLearningData[name]?.pp || 1));
      return Boolean(((effect.heal || effect.healFraction || item.category === 'heal') && pokemon.currentHp < pokemon.maxHp) || effect.cure?.includes(pokemon.status));
    },
    medicineStatus(pokemon) {
      const statuses = { poison: 'empoisonné', badly_poison: 'empoisonné', burn: 'brûlé', paralyze: 'paralysé', sleep: 'endormi', freeze: 'gelé' };
      return pokemon.currentHp <= 0 ? pokemon.riftFainted ? ' · K.O. protégé' : ' · K.O.' : statuses[pokemon.status] ? ` · ${statuses[pokemon.status]}` : '';
    },
    effortPreview(item) {
      const p=this.teamPokemons.find(p=>p.uuid===this.medicineTargets[item.key]),ev=p?.ev || {};
      const names={hp:'PV',attack:'Attaque',defense:'Défense',specialAttack:'Attaque Spéciale',specialDefense:'Défense Spéciale',speed:'Vitesse'};
      if(item.fieldUse.ivReroll)return `IV ${names[item.fieldUse.ivReroll]} : ${p?.iv?.[item.fieldUse.ivReroll]||0}/31 · Tirage 0–31 : remplace la valeur actuelle, même si elle baisse. Potentiel K inchangé.`;
      if(item.fieldUse.effortReset)return item.fieldUse.effortReset==='all'?`EV totaux : ${Object.values(ev).reduce((n,v)=>n+Number(v),0)}/510 → 0. Les six statistiques seront remises à zéro.`:`EV ${names[item.fieldUse.effortReset]} : ${ev[item.fieldUse.effortReset]||0}/252 → 0. Les autres statistiques restent identiques.`;
      return `EV ${names[item.fieldUse.effort.stat]} : ${ev[item.fieldUse.effort.stat] || 0}/252 · Total : ${Object.values(ev).reduce((n,v)=>n+Number(v),0)}/510`;
    },
    medicineTargetLabel(item,p){
      if(item.category==='evolution')return `${p.name}${item.evolutions?.[p.uuid]?` → ${item.evolutions[p.uuid].name}`:''}${this.medicineStatus(p)}`;
      if(item.fieldUse?.ivReroll)return `${p.name} · IV ${p.iv?.[item.fieldUse.ivReroll]||0}/31`;
      if(item.fieldUse?.effortReset)return `${p.name} · EV ${item.fieldUse.effortReset==='all'?Object.values(p.ev||{}).reduce((s,n)=>s+Number(n),0):(p.ev?.[item.fieldUse.effortReset]||0)}`;
      return `${p.name} · ${p.currentHp}/${p.maxHp} PV${this.medicineStatus(p)}`;
    },
    trainingNotice(change,name,quantity=1){
      const stats={hp:'PV',attack:'Attaque',defense:'Défense',specialAttack:'Attaque Spéciale',specialDefense:'Défense Spéciale',speed:'Vitesse'};
      if(change.kind==='iv')return `${name} · IV ${stats[change.stat]} : ${change.before} → ${change.after} (tirage ${change.rolled}). Nouvel IV sauvegardé.`;
      if(change.kind==='evReset')return `${name} · ${change.stat==='all'?'Tous les EV':`EV ${stats[change.stat]}`} remis à zéro. Entraînement sauvegardé.`;
      return `${name} · ${quantity} vitamine${quantity>1?'s':''} · EV ${stats[change.stat]} : ${change.before} → ${change.after}.`;
    },
    async useComputer(payload){
      if(this.pc.busy || !this.pc.visible)return;
      this.pc.busy=true;this.pc.error='';this.pc.notice='';
      try{
        const result=await new Promise((resolve,reject)=>this.socket.timeout(10000).emit('pc:action',payload,(error,response)=>error?reject(new Error('Le serveur ne répond pas. Rouvre le PC pour vérifier ton équipe.')):resolve(response)));
        if(!result?.success)throw new Error(result?.message || 'Transfert impossible.');
        this.pc.state=result.state;
        if(result.equipe)this.applyTeamPokemons(result.equipe.pokemons);
        if(result.items)this.applyBagItems(result.items);
        this.pc.notice={move:'Nouvel emplacement sauvegardé.',deposit:'Compagnon déposé dans le PC.',withdraw:'Compagnon ajouté à ton équipe.',swap:'Les deux Pokémon ont échangé leur place.',release:'Pokémon relâché. Son éventuel objet tenu est dans ton sac.'}[payload.action];
      }catch(error){this.pc.error=error.message;}
      finally{this.pc.busy=false;}
    },
    async useBagRepel(item) {
      if(this.medicineBusy || !this.canUseBagConsumables || this.repelSteps>0)return;
      this.medicineNotice='';this.bagError='';
      if(!this.socket?.connected){this.bagError='Reconnecte-toi pour utiliser un objet.';return;}
      this.medicineBusy=true;
      try{
        const response=await new Promise((resolve,reject)=>this.socket.timeout(8000).emit(this.isDrift?'drift:repel':'useRepel',{itemKey:item.key},(error,result)=>error?reject(new Error('Le serveur ne répond pas. Vérifie ton sac avant de réessayer.')):resolve(result)));
        if(!response?.success)throw new Error(response?.message || 'Repousse inutilisable.');
        this.repelSteps=Number(response.repelSteps)||0;
        if(response.items)this.applyBagItems(response.items);
        this.medicineNotice=`${item.name} utilisé.`;
      }catch(error){this.bagError=error.message;}
      finally{this.medicineBusy=false;}
    },
    async useBagMachine(choice) {
      const item=this.bagItems.find(i=>i.key===choice.itemKey);
      if (!item || this.medicineBusy || !this.canUseBagItem(item)) return;
      this.medicineNotice=''; this.bagError='';
      if (!this.socket?.connected) { this.bagError='Reconnecte-toi pour utiliser une CS.'; return; }
      this.medicineBusy=true;
      try {
        const response=await new Promise((resolve,reject)=>this.socket.timeout(8000).emit(this.isDrift?'drift:useMachine':'useMachine',choice,(error,result)=>error?reject(new Error('Le serveur ne répond pas. Vérifie ton sac avant de réessayer.')):resolve(result)));
        if (!response?.success) throw new Error(response?.message || 'Apprentissage impossible.');
        if (response.items) this.applyBagItems(response.items);
        if (response.equipe) this.applyTeamPokemons(response.equipe.pokemons);
        this.medicineNotice=`${item.name} utilisée. La nouvelle attaque est sauvegardée.`;
      } catch(error) { this.bagError=error.message; }
      finally { this.medicineBusy=false; }
    },
    async useBagMedicine(item) {
      const pokemonUuid = this.medicineTargets[item.key];
      const pokemon = this.teamPokemons.find(p => p.uuid === pokemonUuid);
      if (this.medicineBusy || !this.canUseBagItem(item) || !this.canReceiveMedicine(item, pokemon)) return;
      this.medicineNotice = ''; this.bagError = '';
      if (!this.socket?.connected) { this.bagError = 'Reconnecte-toi pour utiliser un objet.'; return; }
      this.medicineBusy = true;
      try {
        const event = item.category === 'evolution' ? (this.isDrift ? 'drift:evolve' : 'useEvolutionStone') : (this.isDrift ? 'drift:heal' : 'useMedicine');
        const response = await new Promise((resolve, reject) => this.socket.timeout(8000).emit(event, { itemKey: item.key, pokemonUuid,quantity:item.fieldUse?.effort?.amount>0?Math.min(Number(this.medicineQuantities[item.key])||1,item.quantity):1 }, (error, result) => error ? reject(new Error('Le serveur ne répond pas. Vérifie ton sac avant de réessayer.')) : resolve(result)));
        if (!response?.success) throw new Error(response?.message || 'Utilisation impossible.');
        if (response.items) this.applyBagItems(response.items);
        if (response.equipe) this.applyTeamPokemons(response.equipe.pokemons);
        this.$set(this.medicineQuantities,item.key,1);
        this.medicineNotice = response.trainingChange?this.trainingNotice(response.trainingChange,pokemon.name,response.consumed):response.evolution ? `${pokemon.name} a évolué en ${response.evolution.name} !` : `${item.name} utilisée sur ${pokemon.name}. Soin sauvegardé.`;
      } catch (error) { this.bagError = error.message; }
      finally { this.medicineBusy = false; }
    },
    dismissBattleResult() {
      this.releaseAllMovementKeys();
      this.battleResult = null;
      this.learningDeferred = false;
      this.lock = Boolean(this.battle);
      this.$nextTick(this.restoreWorldView);
    },
    async chooseStarter(pokemonUuid) {
      if(this.starterBusy)return;this.starterBusy=true;this.starterError='';
      if(!await this.driftCommand({name:'drift:chooseStarter',data:{pokemonUuid}}))this.starterError='Choix indisponible. Réessaie après la reconnexion.';
      this.starterBusy=false;
    },
    async merchantCommand(command) {
      if(this.shop.loading)return;this.shop.loading=true;this.shop.error='';
      const ok=await this.driftCommand(command);this.shop.loading=false;
      if(!ok)this.shop.error=this.interactionNotice || 'Transaction indisponible.';
      else this.showInteractionNotice('Transaction sauvegardée.');
    },
    async cancelStarter() {
      if(this.starterBusy)return;this.starterBusy=true;this.starterError='';
      try { await this.leaveDrift();this.starterError=this.interactionNotice; } finally {this.starterBusy=false;}
    },
    async leaveDrift() { if (await this.driftCommand({ name: 'drift:exit' })) this.$router.replace(this.driftLobbyPath); },
    async watchDriftMatch(matchId) {
      this.releaseAllMovementKeys();
      await this.driftCommand({ name: 'drift:spectate', data: { matchId } });
    },
    closeDriftSpectator() {
      this.driftSpectator = null;
      this.releaseAllMovementKeys();
      this.isDriftPanelOpen = true;
      if (this.socket?.connected) this.driftCommand({ name: 'drift:stopSpectating' });
    },
    async challengeTrainer(){
      if(this.trainerBusy||!this.trainerOffer)return;this.trainerBusy=true;this.trainerError='';
      try{const ok=await this.driftCommand({name:'onEndDialogue',data:this.trainerOffer.id});if(ok)this.trainerOffer=null;else this.trainerError='Défi indisponible. Ferme cette fenêtre et reparle au dresseur.';}finally{this.trainerBusy=false;}
    },
    toggleDriftPanel() {
      this.driftPanelTab='drifts';
      const open = !this.isDriftPanelOpen;
      this.closeLegacyPanels();
      this.isMenuOpen = false;
      this.isDriftPanelOpen = open;
      if (open) this.releaseAllMovementKeys();
    },
    openDriftTeam() { this.isDriftPanelOpen = false; this.handleMenuAction('pokemon'); },
    async driftCommand({ name, data = {}, includeResponse = false }) {
      if (!this.socket?.connected) return false;
      try {
        const response = await new Promise((resolve, reject) => this.socket.timeout(6000).emit(name, data, (error, result) => error ? reject(error) : resolve(result)));
        if (!response?.success) throw new Error(response?.message || 'Action impossible.');
        return includeResponse ? response : true;
      } catch (error) { this.showInteractionNotice(error.message); return false; }
    },
    openPokemonDetails(pokemon) { this.releaseAllMovementKeys(); this.selectedPokemonUuid = pokemon.uuid; },
    navigatePokemonDetails(delta) {
      const index = this.teamPokemons.findIndex(pokemon => pokemon.uuid === this.selectedPokemonUuid);
      const next = this.teamPokemons[index + delta];
      if (next) this.selectedPokemonUuid = next.uuid;
    },
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
      return Number.isInteger(id) && id > 0 ? `${process.env.BASE_URL}img/pokemon/front/${id}.png` : '';
    },
    closeShop() {
      this.shop.visible = false;
      this.shop.error = '';
    },
    applyShopState(payload = {}) {
      if (!payload.success) return;
      if (Array.isArray(payload.catalog)) this.shop.catalog = payload.catalog;
      if(payload.shopMeta)this.shop.metadata=payload.shopMeta;
      this.applyBagItems(payload.items);
      this.shop.money = Number(payload.money) || 0;
      this.shop.loading = false;
      this.shop.error = '';
      this.shop.visible = true;
    },
    getShopError(reason) {
      const isEnglish = this.preferences.language === 'en';
      const messages = isEnglish
        ? {
            purchase_limit: 'You already own this rod. One is all you need.',
            insufficient_funds: 'You do not have enough money.',
            not_in_shop: 'You must be inside a shop.',
            invalid_quantity: 'Invalid quantity.',
            badge_required: 'Earn the indicated Gym Badge to purchase this item.',
            item_unavailable: 'This item is unavailable at this stage or in this shop.',inventory_busy:'Another action is in progress.',
            battle_active: 'The shop is unavailable during battle.'
          }
        : {
            purchase_limit: "Tu possèdes déjà cette canne. Un seul exemplaire suffit.",
            insufficient_funds: "Tu n'as pas assez d'argent.",
            not_in_shop: 'Tu dois être dans une boutique.',
            invalid_quantity: 'Quantité invalide.',
            badge_required: "Obtiens le badge indiqué pour acheter cet article.",
            item_unavailable: "Cet objet n’est pas disponible à ce stade ou dans cette boutique.",inventory_busy:"Une autre action est en cours.",
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
          this.shop.error = payload.message || this.getShopError(payload.reason);
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
          this.shop.error = payload.message || this.getShopError(payload.reason);
          if (Number.isFinite(Number(payload.money))) this.shop.money = Number(payload.money);
          return;
        }
        this.applyBagItems(payload.items);
        this.shop.money = Number(payload.money) || 0;
        if (payload.progression) this.progressionState = payload.progression;
        const boughtItem = this.shop.catalog.find((item) => item.key === itemKey);
        this.showInteractionNotice(`${boughtItem?.name || itemKey} ×${quantity}`);
      });
    },

    closeTeamPanel() {
      this.isTeamPanelOpen = false;
      this.$nextTick(() => this.$refs.teamToggle?.focus());
    },
    toggleMenu() {
      if(this.flight)return;
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
    showInteractionNotice(message, duration = 2600, kind = '') {
      if (!message) return;
      this.interactionNotice = message;
      this.interactionNoticeKind = kind;
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
      const mobile = window.innerWidth <= 920 || window.matchMedia('(pointer: coarse)').matches;
      // Browser address bars resize the height during a swipe; keep that touch.
      if (mobile !== this.showMobileControls || this._touchViewportWidth !== window.innerWidth) this.releaseAllMovementKeys();
      this._touchViewportWidth = window.innerWidth;
      this.showMobileControls = mobile;
      this.$nextTick(this.resizeWorldViewport);
    },
    resizeWorldViewport() {
      const canvas = this.$refs.monCanvas;
      const viewport = this.$refs.worldViewport;
      if (!canvas || !viewport) return;
      const width = Math.max(1, viewport.clientWidth);
      const height = Math.max(1, viewport.clientHeight);
      const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
      if (width === this.worldFrame.width && height === this.worldFrame.height && pixelRatio === this.worldFrame.pixelRatio
        && canvas.width === Math.round(width * pixelRatio)) return;
      this.worldFrame = { width, height, pixelRatio };
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      this.drawPlayers();
    },
    restoreWorldView() {
      if (this._isDestroyed || this._isBeingDestroyed || document.hidden || this.worldContextLost) return;
      const canvas = this.$refs.monCanvas;
      if (!canvas) return;
      // Mobile browsers may discard the canvas backing store while the combat
      // or another app covers it. Recreate it without changing the player/map.
      this.resizeWorldViewport();
      canvas.width = Math.round(this.worldFrame.width * this.worldFrame.pixelRatio);
      canvas.height = Math.round(this.worldFrame.height * this.worldFrame.pixelRatio);
      this.startGameLoop();
      this.startMovementLoop();
      this.drawPlayers();
    },
    onWorldContextLost(event) {
      event.preventDefault();
      this.worldContextLost = true;
      this.releaseAllMovementKeys();
      this.stopGameLoop();
    },
    onWorldContextRestored() {
      this.worldContextLost = false;
      this.restoreWorldView();
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
      const gesture = this._touchGesture;
      this._touchGesture = null;
      if (gesture) {
        try { gesture.element.releasePointerCapture(gesture.id); } catch (_) { /* Already released. */ }
      }
      this.keysPressed.z = false;
      this.keysPressed.q = false;
      this.keysPressed.s = false;
      this.keysPressed.d = false;
      this.syncPlayerIdleState();
    },
    startMobileGesture(event, surface) {
      if (!this.showMobileControls || this.movementSuspended || this.mapLoadError || this._touchGesture || event.isPrimary === false
        || (surface === 'map' && !['touch', 'pen'].includes(event.pointerType)) || event.button > 0) return;
      event.preventDefault();
      this.releaseAllMovementKeys();
      const element = event.currentTarget, rect = element.getBoundingClientRect();
      this._touchGesture = { id: event.pointerId, element, surface, direction: null,
        x: surface === 'pad' ? rect.left + rect.width / 2 : event.clientX,
        y: surface === 'pad' ? rect.top + rect.height / 2 : event.clientY };
      try { element.setPointerCapture(event.pointerId); } catch (_) { /* Pointer no longer active. */ }
      if (surface === 'pad') this.moveMobileGesture(event);
    },
    moveMobileGesture(event) {
      const gesture = this._touchGesture;
      if (!gesture || gesture.id !== event.pointerId) return;
      if (this.movementSuspended || this.mapLoadError) { this.releaseAllMovementKeys(); return; }
      event.preventDefault();
      const direction = moveTouchGesture(gesture, event.clientX, event.clientY);
      if (direction === gesture.direction) return;
      gesture.direction = direction;
      this.setMobileDirection(this.movementBlocked ? null : direction);
    },
    setMobileDirection(direction) {
      for (const key of ['z', 'q', 's', 'd']) this.keysPressed[key] = key === direction;
      if (direction) this.restartMovementInput();
      else this.syncPlayerIdleState();
    },
    pauseMovementForMap() {
      if (this._touchGesture && !this.movementSuspended && !this.mapLoadError) this.setMobileDirection(null);
      else this.releaseAllMovementKeys();
    },
    resumeMobileGesture() {
      const direction = this._touchGesture?.direction;
      if (direction && !this.movementBlocked && !this.keysPressed[direction]) this.setMobileDirection(direction);
    },
    endMobileGesture(event) {
      if (this._touchGesture?.id === event.pointerId) this.releaseAllMovementKeys();
    },
    tapMobileDirection(direction, event) {
      // Keyboard/assistive activation of the existing buttons still takes one step.
      if (event.detail || this.movementBlocked) return;
      this.keysPressed[direction] = true; this.updatePlayerPosition(); this.releaseAllMovementKeys();
    },
    onWorldVisibility() { if (!document.hidden) { this.restoreWorldView(); return; } if (document.hidden) { this.cancelFishing(); this.releaseAllMovementKeys(); this._worldWeather?.suspend(); this._foregroundWind?.suspend(); this._backgroundWind?.suspend(); this._placeAmbience?.suspend(); this._villageWater?.suspend(); this._grassRustle?.suspend(); this._snowFootprints?.suspend(); this._dirtFootprints?.suspend(); } },
    activateMobileActionA(event) { if (!event.detail) this.triggerMobileActionA(); },
    triggerMobileActionA() {
      if(this.flight)return;
      this.releaseAllMovementKeys();
      if (this.battle || this.battleResult || this.driftSpectator || this.learningVisible || this.evolutionVisible) return;
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
      sources['townspeople.png'] = require('@/assets/6931.png');
      sources['perso1.png'] = sources['townspeople.png'];
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
      if ((payload.mapname || payload.mapname === '') && payload.mapname !== this.map) return;
      if (payload.map && payload.map !== this.map) return;
      const previous = new Map(this.pnjs.map(pnj => [pnj.name, pnj]));
      const rawPnjs = Array.isArray(payload?.pnjs) ? payload.pnjs : [];
      this.pnjs = rawPnjs
        .map((pnj) => ({
          ...pnj,
          fromX: payload.walking ? (previous.get(pnj.name)?.x ?? pnj.x) : pnj.x,
          fromY: payload.walking ? (previous.get(pnj.name)?.y ?? pnj.y) : pnj.y,
          movedAt: performance.now(),
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
    pnjWorldPosition(pnj, now) {
      const progress = this.preferences.animationsEnabled && Number.isFinite(pnj.movedAt) ? Math.min(1, Math.max(0, (now - pnj.movedAt) / 380)) : 1;
      return { x: ((pnj.fromX ?? pnj.x) + (pnj.x - (pnj.fromX ?? pnj.x)) * progress) * 32 + 16,
        y: ((pnj.fromY ?? pnj.y) + (pnj.y - (pnj.fromY ?? pnj.y)) * progress) * 32 + 16,
        progress, moving: progress < 1 && (pnj.fromX !== pnj.x || pnj.fromY !== pnj.y) };
    },
    grassActors(now) {
      const actors = [];
      for (const [id, player] of Object.entries(this.players)) {
        if (player.currentmap !== this.map || player.inbattle || !this.getSpriteSheetForPlayer(player)?.complete) continue;
        actors.push({ id: `player:${id}`, x: player.x, y: player.y });
      }
      for (const pnj of this.pnjs) {
        if (!this.ensurePnjSpriteSheet(pnj.sprite)?.complete) continue;
        const { x, y } = this.pnjWorldPosition(pnj, now);
        actors.push({ id: `pnj:${pnj.name}`, x, y });
      }
      return actors;
    },
    drawPnjs(context, now = performance.now()) {
      if (!Array.isArray(this.pnjs) || this.pnjs.length === 0) return;

      const idleFrame = this.spriteAnimations?.down?.[0] || { x: 0, y: 0 };
      for (const pnj of this.pnjs) {
        const spriteSheet = this.ensurePnjSpriteSheet(pnj.sprite);
        if (!spriteSheet?.complete || !spriteSheet.naturalWidth || !spriteSheet.naturalHeight) continue;

        const { x, y, progress, moving } = this.pnjWorldPosition(pnj, now);
        const offset = npcRenderOffset(this.map, pnj);
        const drawX = Math.round(x - 32 + offset.x);
        const drawY = Math.round(y - 42 + offset.y - (moving ? Math.abs(Math.sin(progress * Math.PI * 3)) * 2 : 0));
        if (pnj.challengeLevel) {
          context.save(); context.fillStyle='#173e48'; context.strokeStyle='#c5ac6d';
          context.fillRect(drawX-10,drawY-24,84,20); context.strokeRect(drawX-10,drawY-24,84,20);
          context.fillStyle='#fff8df'; context.font='12px sans-serif'; context.textAlign='center';
          context.fillText(`Défi · N. ${pnj.challengeLevel}`,drawX+32,drawY-10); context.restore();
        }
        if (pnj.spriteFrame || usesClassicNpcAtlas(spriteSheet)) {
          // Original pixels at 2x, cropped to one person; preserve the feet anchor.
          const size = npcWorldSize(spriteSheet);
          drawNpcFrame(context, spriteSheet, pnj.spriteFrame, drawX + (64-size)/2, drawY + 52-size, size, pnj);
          continue;
        }
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
    async selectPlayerSprite(spriteName) {
      if (this.appearanceBusy) return;
      const normalizedSprite = this.normalizeSpriteName(spriteName);
      this.appearanceBusy = true;
      this.appearanceError = '';
      try {
        if (!this.socket?.connected) throw new Error('Reconnexion en cours. Réessaie dans un instant.');
        await this.ensureSpriteSheet(normalizedSprite).decode();
        const result = await new Promise((resolve,reject)=>this.socket.timeout(6000).emit('setSprite',{sprite:normalizedSprite},(error,result)=>error?reject(new Error('Le serveur ne répond pas. Réessaie.')):resolve(result)));
        if (!result?.success) throw new Error(result?.message || 'Apparence indisponible.');
        this.selectedSprite = this.normalizeSpriteName(result.sprite);
        if (this.players[this.socket.id]) this.$set(this.players[this.socket.id], 'sprite', this.selectedSprite);
      } catch (error) { this.appearanceError = error.message || 'Apparence indisponible.'; }
      finally { this.appearanceBusy = false; }
    },
    applyBagItems(items) {
      if (!Array.isArray(items)) return;
      this.bagItems = items;
      this.bagLoading = false;
      this.bagError = '';
      // Socket inventory updates also refresh the carnet, so reopening the bag
      // never restores a snapshot from before a capture or a purchase.
      if (this.isDrift && this.driftState) this.$set(this.driftState, 'items', items);
    },
    async loadBagItems() {
      if (this.isDrift) {
        this.bagError = '';
        this.bagLoading = !this.driftState;
        return;
      }
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

      this.evolutionQueue.push(...this.evolutionTracker.observe(normalizedTeam));
      this.teamPokemons = normalizedTeam;
      this.teamDirty = false;
    },
    getTeamHpBarClass(pokemon) {
      const hpPercent = this.getTeamHpPercent(pokemon);
      if (hpPercent > 50) return 'hp-good';
      if (hpPercent > 20) return 'hp-mid';
      return 'hp-low';
    },
    heldDescription(key) { return heldItemDefinitions[key]?.description || ''; },
    heldItemChoices(pokemon) {
      const choices = [...this.heldBagItems];
      const currentKey = pokemon?.heldItem;
      if (currentKey && !choices.some((item) => item.key === currentKey)) {
        choices.unshift({ key: currentKey, name: heldItemDefinitions[currentKey]?.name || currentKey, quantity: 0 });
      }
      return choices;
    },
    async equipHeldItem(pokemon, itemKey) {
      if (this.isDrift && !this.socket?.connected) return;
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
        this.applyBagItems(result.items);
      } catch (error) {
        this.teamError = error?.response?.data?.message || error?.message || "Impossible d'equiper cet objet.";
        await this.loadTeamPokemons();
      } finally {
        this.teamSaving = false;
      }
    },
    async loadTeamPokemons() {
      if (this.isDrift) { this.teamId = "drift"; this.applyTeamPokemons(this.driftState?.team || []); return; }
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
    async moveTeamPokemon(index, direction) {
      if (this.teamSaving || this.teamLoading) return;
      if (!Array.isArray(this.teamPokemons)) return;
      if (index < 0 || index >= this.teamPokemons.length) return;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= this.teamPokemons.length) return;

      const previous = [...this.teamPokemons];
      const reordered = [...previous];
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      this.teamPokemons = reordered;
      this.teamDirty = true;
      if (!await this.saveTeamOrder()) {
        const message = this.teamError;
        await this.loadTeamPokemons();
        if (!this.isDrift && this.teamError) this.teamPokemons = previous;
        this.teamError = message;
        this.teamDirty = false;
      }
    },
    async saveTeamOrder() {
      if (this.teamSaving || !this.teamDirty) return false;
      this.teamSaving = true;
      this.teamError = '';
      this.teamOrderNotice = '';
      try {
        if (this.isDrift) {
          if (!await this.driftCommand({ name: 'drift:reorder', data: { orderedUuids: this.teamPokemons.map(p => p.uuid) } })) throw new Error('rejected');
          await this.loadTeamPokemons();
        } else {
          if (!this.socket?.connected) throw new Error('offline');
          const response = await new Promise((resolve, reject) => this.socket.timeout(6000).emit('reorderTeam',
            { orderedUuids: this.teamPokemons.map(p => p.uuid) }, (error, result) => error ? reject(error) : resolve(result)));
          if (!response?.success) throw new Error('rejected');
          this.applyTeamPokemons(response.equipe.pokemons);
        }
        this.teamDirty = false;
        this.teamOrderNotice = this.tr('orderSaved');
        return true;
      } catch (error) {
        this.teamError = this.tr('orderFailed');
        return false;
      } finally {
        this.teamSaving = false;
      }
    },
    handleBattleAction(payload = {}) {
      if (this.pc.visible || this.battleResult || this.driftSpectator || this.learningVisible || this.evolutionVisible) return;
      if (!this.socket || !this.socket.connected) return;
      const action = typeof payload.action === 'string' ? payload.action : '';
      if (!['attack', 'flee', 'change', 'bag'].includes(action)) return;
      this.socket.emit('actionResponse', this.isDrift ? { ...payload, turnId: payload.turnId || this.driftTurnId } : payload);
    },
    menuItemLabel(item) {
      if(item.key==='contracts')return 'Contrats facultatifs';
      if (item.key === "drifts") return this.isColosseum ? "Drifts et Colosseum" : "Drifts et tournoi";
      if (item.key !== 'save') return this.tr(item.key);
      if (this.saveState.status === 'syncing') return this.tr('saving');
      if (this.saveState.status === 'synced') return `${this.tr('save')} ✓`;
      if (this.saveState.status === 'error') return `${this.tr('save')} !`;
      return this.tr('save');
    },
    closeLegacyPanels() {
      this.pc.visible=false;
      this.isBagOpen = false;
      this.isAppearancePanelOpen = false;
      this.isTeamPanelOpen = false;
    },
    closeInfoPanel() {
      const restoreFocus = ['badges', 'minimap'].includes(this.activeInfoPanel);
      this.activeInfoPanel = '';
      if (restoreFocus) this.$nextTick(() => this.$refs.menuToggle?.focus());
    },
    async loadPokedexState() {
      if (this.isDrift) return;
      const userId = this.currentUserId || this.getStoredUserId();
      if (!userId) return;
      const response = await api.get(`/users/${userId}/pokedex`);
      this.pokedexState = response?.data || this.pokedexState;
    },
    async loadProgressionState() {
      if (this.isDrift) return;
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
        if (panel === 'progress' || panel === 'badges' || panel === 'minimap') await this.loadProgressionState();
      } catch (error) {
        console.error(`Erreur chargement panneau ${panel}:`, error);
        this.showInteractionNotice('Impossible de synchroniser ces données.');
      } finally {
        this.menuDataLoading = false;
      }
    },
    async flyToTown(map) {
      if(this.flight||this.isDrift||this.battle||this.battleResult||!this.socket?.connected)return;
      this.releaseAllMovementKeys();this.closeInfoPanel();this.isMenuOpen=false;
      const reduced=!this.preferences.animationsEnabled||this.worldWeatherReducedMotion;
      const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
      const alive=()=>!this._isDestroyed&&!this._isBeingDestroyed;
      this.flight={phase:'departure',startedAt:performance.now(),label:getMapLocationLabel(map,this.preferences.language)};
      try {
        if(!reduced)await wait(650);
        if(!alive())return;
        this.flight={...this.flight,phase:'loading',startedAt:performance.now()};
        const response=await new Promise((resolve,reject)=>this.socket.timeout(10000).emit('flyToTown',{map},(error,result)=>error?reject(new Error('Connexion interrompue. Vérifie ta position après reconnexion.')):resolve(result)));
        if(!response?.success)throw new Error(response?.message||'Vol indisponible.');
        const deadline=performance.now()+16000;
        while(alive()&&(this.mapLoading||this.renderedMap!==map||this.map!==map)){
          if(this.mapLoadError||performance.now()>deadline)throw new Error('Le lieu attend encore son chargement. Utilise Réessayer si nécessaire.');
          await wait(50);
        }
        if(!alive())return;
        this.flight={...this.flight,phase:'arrival',startedAt:performance.now()};
        if(!reduced)await wait(650);
      } catch(error) { if(alive())this.showInteractionNotice(error.message); }
      finally { if(alive()){this.flight=null;this.drawPlayers();} }
    },
    async recoverPosition() {
      if (this.positionRecoveryBusy) return;
      this.positionRecoveryNotice = '';
      if (!this.socket?.connected) { this.positionRecoveryNotice = this.tr('unstuckOffline'); return; }
      this.positionRecoveryBusy = true;
      this.releaseAllMovementKeys();
      try {
        const response = await new Promise((resolve, reject) => this.socket.timeout(8000).emit('recoverPosition', {}, (error, result) => error ? reject(new Error(this.tr('unstuckOffline'))) : resolve(result)));
        if (!response?.success) throw new Error(response?.message || this.tr('unstuckUnavailable'));
        this.positionRecoveryNotice = this.tr('unstuckDone');
      } catch (error) { this.positionRecoveryNotice = error.message; }
      finally { this.positionRecoveryBusy = false; }
    },
    async saveGameNow() {
      if (this.isDrift) return;
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
    async quitGame() {
      if (this.quitting || this.appearanceBusy) return;
      this.quitting = true;
      this.releaseAllMovementKeys();
      try {
        if (!this.socket?.connected) { this.showInteractionNotice('Serveur déconnecté. Attends la reconnexion avant de quitter.'); return; }
        if (this.isDrift) {
          if (!await this.driftCommand({ name:'drift:save' })) return;
        } else {
          await this.saveGameNow();
          if (this.saveState.status !== 'synced') { this.showInteractionNotice(this.saveState.message); return; }
        }
        await this.$router.push('/');
      } finally { this.quitting = false; }
    },
    async handleMenuAction(actionKey) {
      if(this.flight)return;
      this.isMenuOpen = false;
      if (["drifts","contracts"].includes(actionKey)) { this.closeLegacyPanels(); this.driftPanelTab=actionKey; this.releaseAllMovementKeys(); this.isDriftPanelOpen = true; return; }

      if (['pokedex', 'progress', 'badges', 'minimap'].includes(actionKey)) {
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
        this.activeInfoPanel = actionKey;
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
        this.medicineNotice='';
        await Promise.all([this.loadBagItems(), this.loadTeamPokemons()]);
        return;
      }

      if (actionKey === 'pokemon') {
        this.releaseAllMovementKeys();
        this.isDriftPanelOpen = false;
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
      if (this.evolutionVisible || this.selectedPokemonUuid) return;
      const header = this.$refs.gameHeader;
      const bagPanel = this.$refs.bagPanel?.$el;
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
    updateTextImageSequence(sentences, dialogueName = '') {
      const images = this.importAllImages(require.context('@/assets/image', false, /\.(png|jpe?g|svg)$/));

      // Mettre Ã  jour `textImageSequence` avec les sentences reÃ§ues du serveur
      this.textImageSequence = sentences.map(original => {
        const sentence = illustratedNpcPortrait(original, dialogueName);
        return { text: sentence.text, image: images[sentence.imageName], portraitFrame: sentence.portraitFrame, typewriterMs: sentence.typewriterMs };
      });
    },
    clearSequence() {
      // Remet Ã  zÃ©ro la sÃ©quence, ce qui cache le composant enfant
      this.socket.emit('onEndDialogue', this.endSentences);
      this.textImageSequence = [];
    },


    cancelFishing(send=true) {
      if (!this.fishing) return;
      this.fishing=null;
      if(send && this.socket?.connected)this.socket.emit('fishing:cancel',{});
    },
    fishingAction() {
      if(!this.fishing || !this.socket?.connected)return;
      const event=this.fishing.phase==='offer'?'fishing:start':'fishing:reel';
      this.socket.emit(event,{id:this.fishing.id});
    },
    espace() {
      if(this.fishing){this.fishingAction();return;}
      if (this.pc.visible || this.battleResult || this.driftSpectator || this.learningVisible || this.evolutionVisible) return;
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


    async loadMapImage() {
      this._worldRenderFailures = 0;
      this.startGameLoop();
      const requestedMap = this.map;
      const version = this._mapLoadVersion = (this._mapLoadVersion || 0) + 1;
      if (!this.mapLoading && this.renderedMap && this.$refs.monCanvas) {
        const canvas = this.$refs.monCanvas, held = document.createElement('canvas');
        held.width = canvas.width; held.height = canvas.height;
        held.getContext('2d').drawImage(canvas, 0, 0);
        this._heldWorldFrame = held;
      }
      this.mapLoading = true; this.mapLoadError = '';
      this.pauseMovementForMap();
      this._mapScenes ||= createMapSceneLoader(resolveMapAsset);
      try {
        const scene = await this._mapScenes.load(requestedMap);
        if (version !== this._mapLoadVersion || this.map !== requestedMap || this._isBeingDestroyed || this._isDestroyed) return;
        this.mapImage = scene.background;
        this.foregroundImage = scene.foreground;
        this.renderedMap = requestedMap;
        this.mapLoading = false;
        this.drawPlayers();
        this.resumeMobileGesture();
      } catch (_) {
        if (version !== this._mapLoadVersion || this._isBeingDestroyed || this._isDestroyed) return;
        this.mapLoading = false;
        this.mapLoadError = this.preferences.language === 'en' ? 'Unable to load this location.' : 'Impossible de charger ce lieu.';
      }
    },
    drawHeldWorldFrame(context, canvas) {
      context.save(); context.setTransform(1, 0, 0, 1, 0, 0);
      context.fillStyle = '#173c37'; context.fillRect(0, 0, canvas.width, canvas.height);
      const held = this._heldWorldFrame;
      if (held?.width && held?.height) {
        const scale = Math.max(canvas.width / held.width, canvas.height / held.height);
        context.drawImage(held, (canvas.width - held.width * scale) / 2, (canvas.height - held.height * scale) / 2, held.width * scale, held.height * scale);
      }
      context.restore();
    },
    handleKeydown(e) {
      if(this.flight){e.preventDefault();return;}
      if(this.fishing && e.key==='Escape'){e.preventDefault();this.cancelFishing();return;}
      if(this.fishing && (e.code==='Space' || e.code==='KeyA') && !e.ctrlKey && !e.metaKey && !e.altKey){e.preventDefault();if(!e.repeat)this.fishingAction();return;}
      if (this.battleResult || this.driftSpectator || this.learningVisible || this.evolutionVisible) { this.releaseAllMovementKeys(); return; }
      if (this.isDriftPanelOpen) { if (e.key === "Escape") this.isDriftPanelOpen = false; return; }
      if (this.selectedPokemonUuid) return;
      if (e.key === 'Escape' && this.shop.visible) {e.preventDefault();this.closeShop();return;}
      if (e.key === 'Escape') {
        this.closeInfoPanel();
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
        if (this.isTeamPanelOpen) this.closeTeamPanel();
        this.isAppearancePanelOpen = false;
        if (this.battle) {
          this.$refs.battleOverlay?.closePanels();
        }
      }
      if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey
        || e.target?.closest?.('input, textarea, select, [contenteditable="true"]')
        || this.pc.visible || this.isMenuOpen || this.isBagOpen || this.isAppearancePanelOpen || this.selectedPokemonUuid || this.isTeamPanelOpen || this.activeInfoPanel || this.chatSession.visible || this.battle) return;
      const directionKey = this.getMovementKey(e);
      if (directionKey) {
        e.preventDefault();
        const wasMoving = Object.values(this.keysPressed).some(Boolean);
        this.keysPressed[directionKey] = true;
        if (!wasMoving) this.restartMovementInput();
      }
      if (e.code === 'Space') {
        e.preventDefault();
        this.espace();
      }
    },
    getMovementKey(e) {
      const key = String(e.key || '').toLowerCase();
      return { z: 'z', w: 'z', arrowup: 'z', q: 'q', a: 'q', arrowleft: 'q', s: 's', arrowdown: 's', d: 'd', arrowright: 'd' }[key] || null;
    },
    handleKeyup(e) {
      const directionKey = this.getMovementKey(e);
      if (directionKey) {
        this.keysPressed[directionKey] = false;
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

      // Queue the next frame before drawing: one failed image/effect must not
      // leave a non-null frame ID that prevents the world from ever restarting.
      this.animationFrameId = window.requestAnimationFrame(this.animate);
      if (this.worldContextLost) return;
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

      try {
        this.drawPlayers();
        this._worldRenderFailures = 0;
      } catch (error) {
        this._worldRenderFailures = (this._worldRenderFailures || 0) + 1;
        if (this._worldRenderFailures === 1) console.warn('Affichage de la carte interrompu:', error);
        if (this._worldRenderFailures >= 3) {
          this.mapLoadError = this.preferences.language === 'en' ? 'Unable to display this location.' : 'Affichage du lieu interrompu. Réessaie pour reprendre.';
        }
      }
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
      if (this.movementBlocked || document.hidden) {
        if (this.mapLoading && !document.hidden) this.pauseMovementForMap();
        else this.releaseAllMovementKeys();
        return;
      }
      if (!this.socket || !this.socket.connected || !this.socket.id) return;

      let action = null;
      if (this.keysPressed.z) action = 'move_z';
      if (this.keysPressed.q) action = 'move_q';
      if (this.keysPressed.s) action = 'move_s';
      if (this.keysPressed.d) action = 'move_d';

      if (action && !this.lock) {
        const player = this.players[this.socket.id];
        if (!player) return;

        this.cancelFishing();
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
      const me = this.players[this.socket?.id];
      // Never combine a new position with the previous map, nor centre on a
      // placeholder while the authoritative player snapshot is still arriving.
      if (this.mapLoading || this.mapLoadError || this.renderedMap !== this.map
        || !me || me.currentmap !== this.map || !this.mapImage?.complete || !this.mapImage.naturalWidth) {
        this._placeAmbience?.suspend(); this._villageWater?.suspend(); this._foregroundWind?.suspend(); this._backgroundWind?.suspend();
        this._grassRustle?.suspend(); this._snowFootprints?.suspend(); this._dirtFootprints?.suspend();
        this.drawHeldWorldFrame(c, canvas);
        return;
      }

      // Clear the canvas for the new render
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, canvas.width, canvas.height);
      const camera = getWorldCamera(this.worldFrame.width, this.worldFrame.height, me, this.showMobileControls);
      const scale = camera.scale * this.worldFrame.pixelRatio;
      c.save();
      try {
      c.imageSmoothingEnabled = false;
      c.setTransform(scale, 0, 0, scale, -camera.x * scale, -camera.y * scale);
      const now = performance.now();

      // Fill the canvas with the map image
      if (this.mapImage) {
        if (this.villageWaterActive && !document.hidden) {
          if (!this._villageWater) this._villageWater = new VillageWaterRenderer();
          this._villageWater.draw(c, this.mapImage, performance.now(), this.preferences.animationsEnabled && !this.worldWeatherReducedMotion, this.map);
        } else { this._villageWater?.suspend(); c.drawImage(this.mapImage, 0, 0, WORLD_WIDTH, WORLD_HEIGHT); }
      }

      if (hasWindTrees(this.map,'background') && this.worldWeatherActive && this.effectiveWorldWeather.wind && !document.hidden) {
        if(!this._backgroundWind)this._backgroundWind=new ForegroundWindRenderer();
        this._backgroundWind.draw(c,this.mapImage,now,this.effectiveWorldWeather.wind,this.preferences.animationsEnabled&&!this.worldWeatherReducedMotion,this.map,'background');
      } else this._backgroundWind?.suspend();

      if (this.grassRustleActive && !document.hidden) {
        if (!this._grassRustle) this._grassRustle = new GrassRustleRenderer();
        this._grassRustle.draw(c, this.mapImage, this.map, this.grassActors(now), now);
      } else this._grassRustle?.suspend();

      if (this.dirtFootprintsActive && !document.hidden) {
        if (!this._dirtFootprints) this._dirtFootprints = new DirtFootprintsRenderer();
        this._dirtFootprints.draw(c,this.mapImage,this.map,this.grassActors(now).map(a=>({...a,y:a.y+16})),now);
      } else this._dirtFootprints?.suspend();

      if (this.snowFootprintsActive && !document.hidden) {
        if (!this._snowFootprints) this._snowFootprints = new SnowFootprintsRenderer();
        this._snowFootprints.draw(c,this.mapImage,this.map,this.grassActors(now).map(a=>({...a,y:a.y+16})),now);
      } else this._snowFootprints?.suspend();

      if (this.worldWeatherActive && !document.hidden) {
        if (!this._worldWeather) this._worldWeather = new WorldWeatherRenderer();
        this._worldWeather.drawGround(c, performance.now(), this.effectiveWorldWeather, this.preferences.animationsEnabled && !this.worldWeatherReducedMotion, this.map);
      } else this._worldWeather?.suspend();

      if (!this.isDrift && !this.battle && !this.battleResult && !document.hidden) this._storyGateRenderer?.draw(c,this.map,now,this.preferences.animationsEnabled&&!this.worldWeatherReducedMotion);
      drawPokemonComputers(c,this.worldDevices,this.map);
      this.drawPnjs(c, now);

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
          if (sprite && playerSpriteSheet?.complete && playerSpriteSheet.naturalWidth && playerSpriteSheet.naturalHeight) {
            const pose=flightPose(playerId===this.socket?.id?this.flight:null,now,!this.preferences.animationsEnabled||this.worldWeatherReducedMotion);
            c.save();c.globalAlpha=pose.alpha;
            c.translate(player.x,player.y+10-pose.lift);c.scale(pose.scale,pose.scale);c.translate(-player.x,-player.y-10);
            c.drawImage(
              playerSpriteSheet,
              sprite.x, sprite.y, this.spriteWidth, this.spriteHeight,
              player.x - 32, player.y - 42, this.spriteWidth, this.spriteHeight  // DÃ©cale la position Y de 32 pixels
            );
            c.restore();
          } else {
            console.error(`Invalid sprite frame: ${currentFrame}`);
          }
        } else {
          console.error(`Invalid direction: ${player.direction}`);
        }
      }

      // Dessiner les Ã©lÃ©ments de premier plan si nÃ©cessaire
      if (this.foregroundImage?.complete && this.foregroundImage.naturalWidth) {
        if (hasWindTrees(this.map) && this.worldWeatherActive && this.effectiveWorldWeather.wind && !document.hidden) {
          if (!this._foregroundWind) this._foregroundWind = new ForegroundWindRenderer();
          this._foregroundWind.draw(c, this.foregroundImage, performance.now(), this.effectiveWorldWeather.wind, this.preferences.animationsEnabled && !this.worldWeatherReducedMotion, this.map);
        } else { this._foregroundWind?.suspend(); c.drawImage(this.foregroundImage, 0, 0, WORLD_WIDTH, WORLD_HEIGHT); }
      }
      if (this.worldWeatherActive && !document.hidden) {
        if (!this._worldWeather) this._worldWeather = new WorldWeatherRenderer();
        this._worldWeather.draw(c, performance.now(), this.effectiveWorldWeather, this.preferences.animationsEnabled && !this.worldWeatherReducedMotion, this.map);
      } else this._worldWeather?.suspend();
      if (this.placeAmbienceActive && !document.hidden) {
        if (!this._placeAmbience) this._placeAmbience = new PlaceAmbienceRenderer();
        this._placeAmbience.draw(c, this.mapImage, this.map, now, this.preferences.animationsEnabled && !this.worldWeatherReducedMotion, this.effectiveWorldWeather.wind);
      } else this._placeAmbience?.suspend();
      if(this.fishing && this.fishing.map===this.map && !document.hidden && !this.mapLoading && !this.battle)
        drawFishing(c,this.fishing,performance.now()-this.fishingReceivedAt,this.preferences.animationsEnabled&&!this.worldWeatherReducedMotion);
      } finally {
        c.restore();
      }
    },

  },
  mounted() {
    this._worldMusic = new WorldMusic({ 'mounir-room': require('@/assets/msc/mounir-arene.mp3'), 'hoze-room': require('@/assets/msc/hoze-arene.mp3'), village: require('@/assets/msc/village.mp3'), route: require('@/assets/msc/start.mp3'), cave: require('@/assets/msc/cave.mp3'), snow: require('@/assets/msc/snow.mp3'), 'wanda-room': require('@/assets/msc/areneWanda.mp3'), 'sevenp-room': require('@/assets/msc/arene7p.mp3'), 'raph-room': require('@/assets/msc/areneraph.mp3'), 'ana-room': require('@/assets/msc/ana_arene.mp3'), 'lucie-room': require('@/assets/msc/lucie-maison.mp3') });
    window.addEventListener('pointerdown', this.syncWorldMusic);
    window.addEventListener('pointerup', this.syncWorldMusic);
    window.addEventListener('keydown', this.syncWorldMusic);
    document.addEventListener('visibilitychange', this.syncWorldMusic);
    this._detachPopupLayout = attachGamePopupLayout(this.$el, this.$refs.gameStage);
    document.body.classList.add("in-world");
    this._weatherMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    this._weatherMotionChange = () => { this.worldWeatherReducedMotion = Boolean(this._weatherMotionQuery?.matches); };
    this._weatherMotionChange();
    this._weatherMotionQuery?.addEventListener?.('change', this._weatherMotionChange);



    // Wait for the server's saved map and position before painting a world.
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

    this.socket = this.isDrift ? createDriftSocket(token) : createGameSocket(token);
    if (this.isDrift) {
      this.driftClockTimer = setInterval(() => { this.driftClock = Date.now(); }, 250);
      this.socket.on('drift:bootstrap', payload => { this.driftCatalogue = payload.catalogue; });
      this.socket.on('drift:spectator', frame => {
        if (frame.active && !this.battle) {
          this.driftSpectator = frame;
          this.releaseAllMovementKeys();
          this.closeLegacyPanels();
          this.selectedPokemonUuid = null;
          this.isMenuOpen = false;
          this.textImageSequence = [];
          this.isDriftPanelOpen = false;
        } else if (frame.reason === 'finished' && this.driftSpectator?.matchId === frame.matchId) {
          this.driftSpectator = { ...this.driftSpectator, ...frame };
        } else if (!frame.active) {
          this.driftSpectator = null;
          this.isDriftPanelOpen = true;
        }
      });
      this.socket.on('expedition:trainerOffer', offer=>{this.releaseAllMovementKeys();this.closeLegacyPanels();this.isDriftPanelOpen=false;this.isMenuOpen=false;this.trainerError='';this.trainerOffer=offer;});
      this.socket.on('drift:state', state => {
        if(state.phase!=='exploration'){this.trainerOffer=null;this.pc.visible=false;}
        const previousPhase = this.driftState?.phase; const previousAlive = this.driftState?.alive;
        if (previousPhase==='selection' && state.phase==='exploration') this.isDriftPanelOpen=false;
        this.repelSteps=Number(state.repelSteps)||0;
        this.driftState = state; this.driftOffset = state.serverNow - Date.now(); this.teamId = 'drift';
        if (state.mode !== 'colosseum' && state.phase === 'results' && state.report && this.archivedDriftRunId !== state.report.runId) {
          this.archivedDriftRunId = state.report.runId;
          if (!saveDriftReport(userId, state.report)) this.interactionNotice = 'Le souvenir n’a pas pu être enregistré sur cet appareil. Tu peux encore exporter le bilan avant de quitter.';
        }
        this.applyBagItems(state.items || []); this.shop.money = state.money;
        if (!this.teamDirty || this.battle || !state.alive) this.applyTeamPokemons(state.team || []);
        if ((!state.alive || !['exploration','selection'].includes(state.phase)) && (previousPhase !== state.phase || previousAlive !== state.alive)) { this.textImageSequence = []; this.isDriftPanelOpen = true; }
      });
      this.socket.on('drift:lobby', lobby => { if (!lobby && this.driftState) this.$router.replace(this.driftLobbyPath); });
      this.socket.on('drift:replaced', () => { this.socket.disconnect(); this.$router.replace('/'); });
      this.socket.on('connect', () => this.socket.emit('drift:enter', {}, response => { if (!response?.success) this.$router.replace(this.driftLobbyPath); }));
    }

    this.socket.on("connect", () => {
      this.worldAudioConnected = true;
      console.log(`ConnectÃ© au serveur en tant qu'utilisateur ${userId}`);
      this.saveState = {
        ...this.saveState,
        status: this.saveState.lastSyncedAt ? 'synced' : 'idle',
        message: this.isDrift ? 'Session Drift en cours.' : 'Connecté : sauvegarde automatique active.'
      };
    });

    this.socket.on('flightState', state=>this.$set(this.progressionState,'flight',state));
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

    this.socket.on('fieldEffectState', (payload={})=>{this.repelSteps=Number(payload.repelSteps)||0;});
    this.socket.on('roomObstacleAction', (action = {}) => {
      clearTimeout(this._roomObstacleTimer);
      this.roomObstacleAction = action.active && action.map === this.map ? action : null;
      this._storyGateRenderer?.work(this.roomObstacleAction);
      if (this.roomObstacleAction) this._roomObstacleTimer = setTimeout(() => {
        this.roomObstacleAction = null;
        this._storyGateRenderer?.work(null);
      }, Math.min(8000, Number(action.duration) + 4000));
      this.drawPlayers();
    });
    this.socket.on('storyGatesState', (payload = {}) => {
      if (this.isDrift) return;
      if (!this._storyGateRenderer) this._storyGateRenderer = new StoryGateRenderer();
      const opened = (payload.gates || []).some(g => !g.locked && this._storyGateRenderer.gates.get(g.id)?.locked && g.map === this.map);
      this.roomObstacles = (payload.gates || []).filter(g => g.kind === 'barricade');
      this._storyGateRenderer.sync(payload.gates || []);
      if (opened && this.interactionNoticeKind === 'gate') this.showInteractionNotice(this.preferences.language === 'en' ? 'The passage is open!' : 'Le passage est ouvert !', 1800, 'gate');
      this.drawPlayers();
    });
    this.socket.on('storyGateBlocked', (payload = {}) => {
      if (this.isDrift || payload.map !== this.map) return;
      this._storyGateRenderer?.pulse(payload.id);
      this.showInteractionNotice(this.preferences.language === 'en' ? payload.messageEn : payload.message, 3500, 'gate');
      this.drawPlayers();
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
      if (!this.isDrift) this.loadTeamPokemons();
      console.log('Mise Ã  jour de la liste des joueurs:', allPlayers);
      if (!allPlayers[this.socket.id]) return;
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
      if (me && me.currentmap && (me.currentmap !== this.map || !this.renderedMap)) {
        this.map = me.currentmap;
        this.loadMapImage();
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
      if (teamFromPayload.length > 0 || this.isDrift) {
        this.applyTeamPokemons(teamFromPayload);
      }

      if (this.isTeamPanelOpen && payload.reason !== 'reorder') {
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
      const result = this.battleResult || this.pendingBattleResult;
      if (result) this.$set(result, 'recoveryMessage', payload.message || 'Ton équipe a été soignée et ramenée en lieu sûr.');
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
        this.updateTextImageSequence(sentences[0], sentences[1]);
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



    this.socket.on('endbattle', payload => this.presentBattleEnd(payload));

    this.socket.on('playerMoved', ({ id, player }) => {
      if (player.currentmap && player.currentmap !== this.map) return;
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
      this.pc.visible=false;
      this.pauseMovementForMap();
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
      if (!['ville_safe1_shop', 'ville1_shop', 'gen_shop1', 'gen_shop_ville2_1', 'gen_shop_ville5_1', 'gen_shop_route10', 'ville3_shop', 'ville4_shop', 'ville5_shop'].includes(mapname)) {
        this.closeShop();
      }
      this.loadMapImage();
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
      if (isSessionConnectionFailure(error)) {
        const redirect = this.isDrift ? this.driftLobbyPath : '/game';
        clearSession();
        this.socket.disconnect();
        this.$router.replace({path:'/connexion',query:{redirect,reason:'session-expired'}});
        return;
      }
      console.log("Erreur de connexion au serveur:", error);
      this.saveState = { ...this.saveState, status: 'error', message: 'Connexion au serveur interrompue.' };
    });

    this.socket.on('disconnect', () => {
      clearTimeout(this._roomObstacleTimer);
      this.roomObstacleAction = null;
      this._storyGateRenderer?.work(null);
      this.cancelFishing(false);
      this.worldAudioConnected = false;
      this.syncWorldMusic();
      this.pc.visible=false;
      this.releaseAllMovementKeys();
      this.pendingBattleResult = null;
      this.$refs.battleOverlay?.cancelExperience();
      this.battle = false;
      this.lock = false;
      this.$refs.battleOverlay?.resetBattleUi();
      if (this.driftSpectator) { this.driftSpectator = null; this.isDriftPanelOpen = true; }
      this.$refs.battleOverlay?.stopMusic();
      this.saveState = { ...this.saveState, status: 'error', message: 'Hors ligne : reconnexion automatique…' };
    });


    this.socket.on('fishingState', state => {
      if(state.phase==='idle'){
        this.cancelFishing(false);
        if(state.message)this.showInteractionNotice(state.message,3600);
        return;
      }
      if(state.map!==this.map || this.movementSuspended || this.mapLoading || document.hidden){this.socket.emit('fishing:cancel',{});return;}
      if(state.phase==='offer')this.releaseAllMovementKeys();
      const owner=this.players[this.socket.id];if(owner&&state.phase==='casting'){owner.direction=state.direction;owner.isMoving=false;}
      this.fishing=state;this.fishingReceivedAt=performance.now();
    });
    this.socket.on('mapWeatherState', state => { this.mapWeather = state; });
    this.socket.on('worldDevicesState', state=>{this.worldDevices=state;});
    this.socket.on('pcOpened', state=>{this.releaseAllMovementKeys();this.closeLegacyPanels();this.closeInfoPanel();this.closeShop();this.isMenuOpen=false;this.pc={visible:true,busy:false,state,error:'',notice:''};});
    this.socket.on('pcUpdated',state=>{if(this.pc.visible)this.pc.state=state;});

    this.socket.on('battletrigger', (data) => {
      this.cancelFishing();
      this.pc.visible=false;
      this.pendingBattleResult = null;
      this.battleResult = null;
      this.driftSpectator = null;
      if (this.isDrift) { this.isDriftPanelOpen = false; this.closeLegacyPanels(); this.textImageSequence = []; }
      this.closeInteractionChoice();
      this.clearIncomingRequest();
      this.closeChatSession(true);
      this.$refs.battleOverlay?.resetBattleUi();
      this.$refs.battleOverlay?.setEncounterEnvironment(data?.environment);
      this.$refs.battleOverlay?.prepareEntrance(data?.musicKind || data?.battleType || 'wild');
      this.$refs.battleOverlay?.updateFieldState(data?.field || {});
      this.battle = true;
      this.syncWorldMusic();
      this.$nextTick(() => this.$refs.battleOverlay?.startMusic(data?.musicKind || data?.battleType || 'wild'));
      if (data?.message) this.$nextTick(() => this.$refs.battleOverlay?.showMessage(data.message));

    });

    this.socket.on('update', (data) => {
      this.currentPlayer.targetX = data.player.x;
      this.currentPlayer.targetY = data.player.y;
    });


    this.socket.on('requestAction', (data) => {
      if (this.isDrift) this.driftTurnId = data?.turnId;
      this.$refs.battleOverlay?.presentEvent('requestAction', data || { message:'Choisis une action.' });
    });

    this.socket.on('battleText', (data) => {
      this.$refs.battleOverlay?.presentEvent('showMessage', data?.message || '...');
    });

    this.socket.on('bagUpdated', (data) => {
      this.applyBagItems(data?.items);
    });

    this.socket.on('shopOpened', (data) => {
      this.applyShopState(data);
    });

    this.socket.on('captureAnimation', (data) => {
      this.$refs.battleOverlay?.presentEvent('playCaptureAnimation', data);
    });

    this.socket.on('battleMoveAnimation', (data) => {
      this.$refs.battleOverlay?.presentEvent('playMoveAnimation', data);
    });

    this.socket.on('battleDriftEffects', data => this.$refs.battleOverlay?.presentEvent('playDriftEffects', data));

    this.socket.on('battleMoveResult', (data) => {
      this.$refs.battleOverlay?.presentEvent('playMoveResult', data);
    });

    this.socket.on('battleFieldState', (data) => {
      this.$refs.battleOverlay?.presentEvent('updateFieldState', data);
    });

    this.socket.on('battleExperience', data => this.$refs.battleOverlay?.presentEvent('updateExperience', data));

    this.socket.on('introAnimation', (data) => {
      if (!this.battle || this.pendingBattleResult) return;
      this.lock = true;
      this.$refs.battleOverlay?.presentEvent('updateBattleState', data);
    });




    // The shared Socket.IO manager may have been created by the Rift hub with
    // autoConnect disabled. Both worlds connect after registering listeners.
    this.socket.connect();
    window.addEventListener('keydown', this.handleKeydown);
    window.addEventListener('keyup', this.handleKeyup);
    window.addEventListener('mousedown', this.handleOutsideMenuClick);
    window.addEventListener('resize', this.updateMobileControlsVisibility);
    window.addEventListener('orientationchange', this.updateMobileControlsVisibility);
    window.addEventListener('blur', this.releaseAllMovementKeys);
    document.addEventListener('visibilitychange', this.onWorldVisibility);
    window.addEventListener('pageshow', this.restoreWorldView);
    this.updateMobileControlsVisibility();

    const canvas = this.$refs.monCanvas;
    canvas.addEventListener('contextlost', this.onWorldContextLost);
    canvas.addEventListener('contextrestored', this.onWorldContextRestored);
    canvas.width = WORLD_WIDTH;
    canvas.height = WORLD_HEIGHT;
    this.worldResizeObserver = new ResizeObserver(this.resizeWorldViewport);
    this.worldResizeObserver.observe(this.$refs.worldViewport);
    this.$nextTick(this.resizeWorldViewport);

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
    this.cancelFishing();
    this._worldMusic?.destroy();
    window.removeEventListener('pointerdown', this.syncWorldMusic);
    window.removeEventListener('pointerup', this.syncWorldMusic);
    window.removeEventListener('keydown', this.syncWorldMusic);
    document.removeEventListener('visibilitychange', this.syncWorldMusic);
    this._detachPopupLayout?.();
    this._villageWater?.destroy();
    this._placeAmbience?.destroy();
    this._worldWeather?.destroy();
    this._foregroundWind?.destroy(); this._backgroundWind?.destroy();
    this._grassRustle?.destroy();
    this._snowFootprints?.destroy();
    this._dirtFootprints?.destroy();
    clearTimeout(this._roomObstacleTimer);
    this._storyGateRenderer?.destroy();
    this._weatherMotionQuery?.removeEventListener?.('change', this._weatherMotionChange);
    this._mapLoadVersion = (this._mapLoadVersion || 0) + 1;
    this._mapScenes?.clear();
    this._heldWorldFrame = null;
    this.pendingBattleResult = null;
    document.body.classList.remove("in-world");
    this.worldResizeObserver?.disconnect();
    if (this.driftClockTimer) clearInterval(this.driftClockTimer);
    this.stopMovementLoop();
    this.stopGameLoop();
    window.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('keyup', this.handleKeyup);
    window.removeEventListener('mousedown', this.handleOutsideMenuClick);
    window.removeEventListener('resize', this.updateMobileControlsVisibility);
    window.removeEventListener('orientationchange', this.updateMobileControlsVisibility);
    window.removeEventListener('blur', this.releaseAllMovementKeys);
    document.removeEventListener('visibilitychange', this.onWorldVisibility);
    window.removeEventListener('pageshow', this.restoreWorldView);
    this.$refs.monCanvas?.removeEventListener('contextlost', this.onWorldContextLost);
    this.$refs.monCanvas?.removeEventListener('contextrestored', this.onWorldContextRestored);
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

body.in-world {
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
  box-sizing: border-box;
}

body.in-world {
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

.game-shell {
  position: relative;
  width: 100%;
  max-width: none;
  margin: 0;
}

.story-gate-notice {
  position:absolute;left:12px;right:12px;bottom:12px;z-index:55;margin:auto;max-width:380px;
  padding:10px 13px;border:1px solid var(--journal-border);border-radius:10px;background:var(--journal-paper);
  color:var(--journal-ink);font:13px/1.45 var(--journal-font);box-shadow:0 3px 10px #0002;pointer-events:none;
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
  gap: 12px;
  color: #243c50;
  border: 1px solid #dacdb4;
  border-radius: 6px;
  background: #fffcf3;
  padding: 7px 8px;
}

.bag-item-name,
.bag-item-qty {
  font: 13px/1.4 Arial, sans-serif;
}

.bag-item-name {
  min-width: 0;
  overflow-wrap: anywhere;
}

.bag-item-qty {
  flex-shrink: 0;
  min-width: 44px;
  text-align: center;
  font-variant-numeric: tabular-nums;
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
  display: block;
  width: 64px;
  height: 64px;
  background-size: 256px 256px;
  background-position: 0 0;
  background-repeat: no-repeat;
  image-rendering: pixelated;
}
.menu-quit-hint { display:block; padding:0 12px 10px; font-size:10px; line-height:1.4; color:var(--journal-muted); }

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

  .mobile-action-a:active {
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

<style scoped>
.team-item-description{font:11px/1.6 Arial,sans-serif;color:#5c716b;margin:7px 0;}

.world-toolbar { display: contents; }
.game-root.is-drift .world-toolbar { display: flex; flex-direction: column; gap: 3px; padding: 6px 8px 5px; border: 1px solid var(--journal-border); border-radius: 16px 16px 0 0; background: var(--journal-card); box-shadow: none; }
.game-root.is-drift .game-header { width: 100%; height: auto; min-height: 44px; gap: 10px; padding: 0; border: 0; background: transparent; }
.game-root.is-drift .menu-toggle-btn { flex-shrink: 0; }
.game-root.is-drift .menu-dropdown { left: 0; z-index: 60; }
.game-root.is-drift .location-banner { position: static; align-self: flex-end; gap: 6px; max-width: 100%; min-height: 21px; padding: 2px 5px; border: 0; border-radius: 0; box-shadow: none; background: transparent; color: var(--journal-ink); font: 12px/1.4 var(--journal-font); }
.game-root.is-drift .location-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.game-root.is-drift .location-shop-btn { flex-shrink: 0; min-height: 44px; margin: 0; padding: 6px 10px; border: 1px solid var(--journal-border); border-radius: 8px; background: var(--journal-soft); color: var(--journal-accent); font-size: 12px; }
.drift-hud { display: flex; align-items: center; gap: 14px; min-width: 0; margin-left: auto; color: var(--journal-heading); font: 12px var(--journal-font); }
.drift-clock { display: flex; align-items: center; gap: 8px; min-width: 0; }
.drift-clock > svg { flex-shrink: 0; width: 18px; height: 18px; color: var(--journal-accent); }
.drift-clock > span { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.drift-clock small { color: var(--journal-muted); font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.drift-clock strong { font-variant-numeric: tabular-nums; font-size: 18px; letter-spacing: .03em; }
.drift-hud-toggle { display: flex; align-items: center; gap: 7px; flex-shrink: 0; min-height: 44px; border: 1px solid var(--journal-border); border-radius: 7px; padding: 6px 11px; background: var(--journal-soft); color: var(--journal-ink); cursor: pointer; font: inherit; box-shadow: inset 0 0 0 2px #ffffff05; }
.drift-hud-toggle > svg { width: 20px; height: 20px; color: var(--journal-accent); }
.drift-hud-toggle small { margin-left: 5px; color: var(--journal-muted); font-size: 10px; }
.drift-hud-toggle:hover { background: var(--journal-selected); }
.drift-hud-toggle:focus-visible { outline: 2px solid var(--journal-accent); outline-offset: 3px; }
.bag-mode-note { margin: -5px 0 10px; color: #586c63; font: 11px/1.4 Arial, sans-serif; }
@media(max-width:550px) {
  .game-root.is-drift .world-toolbar { padding-inline: 6px; }
  .game-root.is-drift .game-header { gap: 8px; }
  .game-root.is-drift .menu-toggle-btn { padding-inline: 10px; font-size: 12px; }
  .game-root.is-drift .menu-toggle-btn::before { margin-right: 6px; }
  .game-root.is-drift .location-banner { font-size: 10px; }
  .drift-hud { gap: 8px; }
  .drift-clock { gap: 5px; }
  .drift-clock > svg { display: none; }
  .drift-clock strong { font-size: 16px; }
  .drift-clock small { max-width: 88px; font-size: 9px; }
  .drift-hud-toggle { gap: 5px; padding-inline: 8px; font-size: 11px; }
  .drift-hud-toggle > svg { width: 17px; height: 17px; }
  .drift-hud-toggle small { margin-left: 3px; font-size: 10px; }
}
</style>

<style scoped>
.recovery-notice{position:absolute;z-index:20;top:65px;left:5%;width:90%;padding:12px;background:#173851;color:#fff;border:1px solid #a7c7df;border-radius:8px}
.has-contract-reward{position:relative}
.contract-reward-dot{position:absolute;top:-5px;right:-5px;display:grid;place-items:center;min-width:18px;height:18px;padding:0 4px;border-radius:50%;background:#b17c24;color:#fffaf0;font:700 10px Arial,sans-serif;box-shadow:0 0 0 3px var(--journal-paper);animation:contract-ready-pulse 2.4s ease-in-out infinite}
.contract-reward-label{margin-left:auto;color:#876020;font-size:10px;white-space:nowrap}
@keyframes contract-ready-pulse{0%,100%{box-shadow:0 0 0 3px var(--journal-paper),0 0 0 4px #bc913a55}50%{box-shadow:0 0 0 3px var(--journal-paper),0 0 0 8px #bc913a10}}
.reduced-game-motion .contract-reward-dot{animation:none}
@media(prefers-reduced-motion:reduce){.contract-reward-dot{animation:none}}
</style>

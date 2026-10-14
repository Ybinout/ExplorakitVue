<template>
  <main class="drift-page" data-rift-hub>
    <div class="drift-shell"><router-link class="modes-back" to="/">← Choisir un mode</router-link>
      <header class="drift-nav">
        <span class="camp-label"><drift-glyph name="compass" /> LE CAMP DES DRESSEURS</span>
        <div class="account-nav"><span class="connection" role="status"><i :class="{ online: connected }"></i><span>{{ username }}</span></span><button class="account-button" :disabled="busy || Boolean(lobby)" :title="lobby ? 'Quitte le salon pour changer de compte' : 'Changer de compte'" @click="logout">Déconnexion</button></div>
      </header>

      <section class="drift-hero" aria-labelledby="drift-title">
        <div class="hero-title">
          <p class="eyebrow">LE CAMP DE BASE</p>
          <h1 id="drift-title">Rift<span>Mon</span></h1>
          <p class="hero-copy">Une équipe, une vie. À toi de jouer.</p>
        </div>
        <img class="camp-companion" :src="$assetBase + 'img/pokemon/front/133.png'" alt="" />
      </section>
      <button class="solo-adventure" data-rift-solo :disabled="busy" @click="playAdventure"><span class="solo-icon"><drift-glyph name="progress" /></span><span><strong>Jouer une aventure en solo</strong><span>Avance à ton rythme dans un monde partagé. Multijoueur facultatif.</span></span><b aria-hidden="true">→</b></button>
      <div v-if="!lobby" class="play-intro"><h2>Ou jouer une partie RiftMon</h2><p>Rejoins des dresseurs ou prépare une partie pour tes amis.</p></div>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <template v-if="connectionFailed">
        <button v-if="connectionFailureKind === 'session'" class="subtle-button reconnect-button" @click="$router.push({ path: '/connexion', query: { redirect: '/drift' } })">Se reconnecter au compte</button>
        <button v-else class="subtle-button reconnect-button" @click="retryConnection">Réessayer la connexion</button>
      </template>

      <div v-if="!lobby" class="hub-tabs" aria-label="Préparer une partie">
        <button :aria-pressed="hubTab === 'browse'" data-rift-browse-tab @click="hubTab = 'browse'"><drift-glyph name="search" /> Rejoindre une partie</button>
        <button :aria-pressed="hubTab === 'create'" data-rift-create-tab @click="hubTab = 'create'"><drift-glyph name="compass" /> Créer une partie</button>
      </div>
      <div class="camp-layout" :class="{ 'has-lobby': lobby }">
        <section class="camp-card lobby-card" :class="{ 'mobile-hidden': !lobby && hubTab !== 'create' }" aria-labelledby="camp-title">
          <div class="section-heading"><span class="section-emblem"><drift-glyph :name="lobby ? 'team' : 'compass'" /></span><div><p class="eyebrow">{{ lobby ? 'AU POINT DE RENDEZ-VOUS' : 'LE DÉPART T’APPARTIENT' }}</p><h2 id="camp-title">{{ lobby ? 'Ton groupe d’aventure' : 'Ta prochaine partie' }}</h2></div><span v-if="lobby" class="room-count">{{ lobby.players.length }}/{{ lobby.capacity }}</span></div>

          <template v-if="!lobby">
            <form @submit.prevent="createLobby">
              <fieldset class="creation-rules" :disabled="busy || !connected || !bootstrapped"><legend class="sr-only">Les règles du Rift</legend>
                <label for="rift-capacity"><drift-glyph name="players" /> Dresseurs<select id="rift-capacity" v-model.number="capacity" data-rift-capacity><option v-for="size in capacities" :key="size" :value="size">{{ size }} joueurs</option></select></label>
                <label for="rift-visibility">Visibilité<select id="rift-visibility" v-model="visibility" data-rift-visibility><option value="public">Public · ouvert à tous</option><option value="private">Privé · sur invitation</option></select></label>
              </fieldset>
              <fieldset :disabled="busy || !connected || !bootstrapped"><legend><drift-glyph name="clock" /> Le temps d’exploration</legend>
                <div class="choice-row duration-row"><button v-for="minutes in durations" :key="minutes" type="button" :data-rift-duration="minutes" :class="{ selected: durationMinutes === minutes }" :aria-pressed="durationMinutes === minutes" @click="durationMinutes = minutes">{{ durationLabel(minutes) }}</button></div>
              </fieldset>
              <details class="reward-details" data-rift-reward-preview><summary>Récompense : jusqu’à {{ rewardEstimate.toLocaleString('fr-FR') }} pièces <span aria-hidden="true">+</span></summary><p>2,5 pièces par dresseur et par minute d’exploration pour le vainqueur. Estimation pour {{ rewardParticipants }} joueurs, {{ durationLabel(rewardMinutes) }}. Une fin anticipée réduit la prime ; le tournoi ne compte pas.</p></details>
              <p class="quiet creation-hint">{{ visibility === 'public' ? 'Ton salon apparaîtra dans les Rifts ouverts.' : 'Seuls les joueurs avec ton code peuvent rejoindre.' }}</p>
              <button class="gold-button" data-rift-create :disabled="busy || !connected || !bootstrapped"><drift-glyph name="compass" /> Créer mon expédition <span class="button-arrow" aria-hidden="true">→</span></button>
            </form>

          </template>

          <template v-else>
            <div class="invite"><div><small>{{ lobby.visibility === 'public' ? 'RIFT PUBLIC · INVITE TES RIVAUX' : 'RIFT PRIVÉ · INVITE TES RIVAUX' }}</small><strong>{{ lobby.code }}</strong></div><button class="subtle-button" @click="copyCode">{{ copied ? 'Copié !' : 'Copier le code' }}</button></div>
            <div class="lobby-rules"><label><span><drift-glyph name="players" /> Dresseurs</span><select :value="lobby.capacity" :disabled="!isHost || busy || !connected" @change="configure('capacity', Number($event.target.value))"><option v-for="size in capacities" :key="size" :value="size" :disabled="size < lobby.players.length">{{ size }} joueurs</option></select></label>
              <label><span><drift-glyph name="clock" /> Exploration</span><select :value="lobby.durationMinutes" :disabled="!isHost || busy || !connected" @change="configure('durationMinutes', Number($event.target.value))"><option v-for="minutes in durations" :key="minutes" :value="minutes">{{ durationLabel(minutes) }}</option></select></label></div>
            <details class="reward-details" data-rift-reward-preview><summary>Récompense : jusqu’à {{ rewardEstimate.toLocaleString('fr-FR') }} pièces <span aria-hidden="true">+</span></summary><p>2,5 pièces par dresseur et par minute d’exploration pour le vainqueur. Estimation pour {{ rewardParticipants }} joueurs, {{ durationLabel(rewardMinutes) }}. Une fin anticipée réduit la prime ; le tournoi ne compte pas.</p></details>
            <label class="room-visibility">Visibilité du salon<select :value="lobby.visibility || 'private'" :disabled="!isHost || busy || !connected" @change="configure('visibility', $event.target.value)"><option value="public">Public · dans les Rifts ouverts</option><option value="private">Privé · sur invitation</option></select></label>
            <p class="quiet room-hint">{{ isHost ? 'Tes règles, votre aventure. Un changement annule les prêts.' : 'Le créateur choisit les règles de l’expédition.' }}</p>
            <ul class="players" :class="{ 'large-party': lobby.capacity > 4 }" aria-label="Dresseurs du salon">
              <li v-for="(player, index) in seats" :key="index" class="trainer-seat" :class="{ 'empty-player': !player, 'seat-ready': player && player.ready, 'my-seat': player && player.id === userId }">
                <template v-if="player"><span class="trainer-token" aria-hidden="true"><i class="trainer-sprite" /></span><div class="seat-info"><strong>{{ player.username }}</strong><small>{{ player.id === lobby.hostId ? 'Chef d’expédition' : 'Dresseur' }}{{ player.id === userId ? ' · toi' : '' }}</small><span class="player-status" :class="{ ready: player.ready }"><i />{{ !player.connected ? 'Retour · 90 s' : player.ready ? 'Prêt à partir' : 'En préparation' }}</span></div></template>
                <template v-else><span class="trainer-token empty-token" aria-hidden="true"><drift-glyph name="players" /></span><div class="seat-info"><strong>Place {{ String(index + 1).padStart(2, '0') }}</strong><small>En attente d’un rival</small></div></template>
              </li>
            </ul>
            <div class="room-actions"><button class="gold-button" :disabled="busy || !connected" :aria-pressed="isReady" @click="setReady"><span aria-hidden="true">{{ isReady ? '✓' : '✦' }}</span>{{ isReady ? 'Je me prépare encore' : 'Je suis prêt' }}</button><button class="subtle-button" :disabled="busy || !connected" @click="leaveLobby">Quitter</button></div>
            <div class="launch-note"><span><i :style="{ '--readiness': `${readyCount / lobby.capacity * 100}%` }" />{{ readyCount }} / {{ lobby.capacity }} dresseurs prêts</span><button v-if="isHost" class="gold-button" :disabled="busy || !connected || readyCount !== lobby.capacity || lobby.players.length !== lobby.capacity" @click="command('drift:start')"><drift-glyph name="compass" /> Lancer l’expédition <span class="button-arrow" aria-hidden="true">→</span></button><p v-else class="quiet">Le départ sera donné quand tout le groupe sera prêt.</p></div>
          </template>
        </section>

        <section v-if="!lobby" class="camp-card room-browser" :class="{ 'mobile-hidden': hubTab !== 'browse' }" aria-labelledby="rooms-title" data-rift-browser>
          <div class="section-heading"><span class="section-emblem"><drift-glyph name="search" /></span><div><p class="eyebrow">IL RESTE UNE PLACE POUR TOI</p><h2 id="rooms-title">Parties disponibles</h2></div><button class="refresh-rooms" :disabled="!connected || listLoading" aria-label="Actualiser les Rifts ouverts" @click="refreshLobbies"><drift-glyph name="counter" /></button></div>
          <label v-if="publicLobbies.length || lobbySearch" class="room-search" for="rift-search"><span class="sr-only">Chercher un salon par dresseur ou code</span><drift-glyph name="search" /><input id="rift-search" v-model.trim="lobbySearch" type="search" placeholder="Un dresseur, un code…" autocomplete="off" /></label>
          <p class="quiet live-rooms" role="status"><i :class="{ online: connected && listLoaded }" />{{ listLoading ? 'À la recherche de rivaux…' : listLoaded ? `${filteredLobbies.length} salon${filteredLobbies.length > 1 ? 's' : ''} disponible${filteredLobbies.length > 1 ? 's' : ''}` : 'Connexion aux Rifts…' }}</p>
          <p v-if="listError" class="room-list-error" role="alert">{{ listError }}</p>
          <ul v-else-if="filteredLobbies.length" class="open-rooms" aria-label="Salons publics disponibles">
            <li v-for="room in filteredLobbies" :key="room.code" :data-rift-room="room.code"><span class="room-icon" aria-hidden="true"><drift-glyph name="compass" /></span><div class="room-info"><strong>Le Rift de {{ room.hostName }}</strong><span><drift-glyph name="players" /> {{ room.playerCount }}/{{ room.capacity }} <i>·</i> <drift-glyph name="clock" /> {{ durationLabel(room.durationMinutes) }}</span><small>{{ room.code }}</small></div><button class="subtle-button" :disabled="busy || !connected || room.playerCount >= room.capacity" @click="joinPublicLobby(room.code)">Rejoindre <span aria-hidden="true">→</span></button></li>
          </ul>
          <div v-else-if="listLoaded && !listLoading" class="rooms-empty"><drift-glyph name="compass" /><strong>{{ lobbySearch ? 'Aucun Rift ne correspond.' : 'Le camp est calme pour le moment.' }}</strong><p>{{ lobbySearch ? 'Essaie un autre nom, ou rejoins un ami avec son code.' : 'Lance une partie et invite tes amis à te rejoindre.' }}</p><button class="gold-button" @click="focusCreate">Créer une partie</button></div>
            <form class="join-form" @submit.prevent="joinLobby">
              <label for="drift-code">Tu as un code d’invitation ?</label>
              <div><input id="drift-code" v-model.trim="inviteCode" maxlength="8" minlength="8" pattern="[a-fA-F0-9]{8}" required autocomplete="off" spellcheck="false" autocapitalize="characters" placeholder="Code du salon" />
                <button class="subtle-button" :disabled="busy || !connected || !bootstrapped">Rejoindre</button></div>
            </form>
        </section>
        <details v-else class="expedition-guide"><summary>Comment se déroule une partie ?</summary>
          <div class="guide-heading"><p class="eyebrow">UNE ÉQUIPE · UNE VIE</p><h2 id="guide-title">Écris ta propre légende.</h2><p>Le même monde. Un nouveau départ.<br />Et un seul vainqueur.</p></div>
          <ol class="adventure-steps"><li><span class="step-symbol"><drift-glyph name="compass" /></span><div><small>01 · L’EXPLORATION</small><strong>Un compagnon, mille possibles.</strong><p>Un petit Pokémon aléatoire au départ. Capture, entraîne et soigne ton équipe.</p></div></li>
            <li><span class="step-symbol"><drift-glyph name="drift" /></span><div><small>02 · LES DRIFTS</small><strong>Forge ta stratégie.</strong><p>Gagne des Drifts en combat et équipe jusqu’à cinq pouvoirs pour prendre l’avantage.</p></div></li>
            <li><span class="step-symbol"><drift-glyph name="trophy" /></span><div><small>03 · LE DERNIER DUEL</small><strong>Fais face aux survivants.</strong><p>Un tirage au sort compose le tournoi. En cas d’exemption, regarde les duels en attendant ton tour.</p></div></li></ol>
          <div class="survival-note"><span aria-hidden="true">!</span><p><strong>Chaque K.O. est définitif.</strong> Même au tournoi. Sans Pokémon vivant, l’expédition s’arrête pour toi.</p></div>
          <p class="adventure-note">Une parenthèse entre amis. Ton aventure principale conserve son équipe et ses objets.</p>
        </details>
      </div>


      <div class="camp-extras">
        <rift-collection :coins="profile ? profile.coins : 0" @appearance="appearance=$event" @purchase="loadProfile" />
        <details class="profile-details"><summary><span>Mon palmarès</span><span aria-hidden="true">+</span></summary>
      <section class="profile-strip" :style="appearance.color ? {borderColor:appearance.color,boxShadow:`inset 0 0 0 2px ${appearance.color}`} : {}" aria-label="Ton palmarès RiftMon" data-rift-profile :aria-busy="profileLoading">
        <div class="profile-identity"><span class="trainer-token" aria-hidden="true"><i class="trainer-sprite" /></span><div><small>TON CARNET DE DRESSEUR</small><strong>{{ username }}</strong><span v-if="appearance.title" class="profile-title">{{ appearance.title }}</span></div></div>
        <dl class="profile-stats">
          <div><dt><drift-glyph name="trophy" /> Victoires</dt><dd data-rift-wins>{{ profileValue('wins') }}</dd></div>
          <div><dt><drift-glyph name="defense" /> Défaites</dt><dd data-rift-losses>{{ profileValue('losses') }}</dd></div>
          <div><dt><drift-glyph name="compass" /> Parties</dt><dd data-rift-games>{{ profileValue('gamesStarted') }}</dd></div>
          <div class="coin-stat"><dt><drift-glyph name="coin" /> Pièces</dt><dd data-rift-coins>{{ profileValue('coins') }}</dd></div>
        </dl>

      </section>
      <p v-if="profileError" class="profile-error" role="status">Palmarès indisponible. <button :disabled="profileLoading" @click="loadProfile">Actualiser</button></p>
        </details>
      <section class="camp-card history" data-drift-history aria-labelledby="history-title">
        <details>
          <summary data-drift-history-toggle><span class="section-emblem"><drift-glyph name="trophy" /></span><div><h2 id="history-title">Tes expéditions</h2></div><span class="history-count">{{ reports.length }}</span></summary>
          <p class="quiet history-note">Tes vingt dernières expéditions synchronisées avec ton compte, complétées par les souvenirs de cet appareil. Les anciennes parties non archivées côté serveur restent locales.</p>
          <p v-if="historyError" class="quiet" role="status">Historique en ligne indisponible. <button class="subtle-button" @click="loadHistory">Réessayer</button></p>
          <p v-if="!reports.length" class="quiet">Ton prochain bilan complet apparaîtra ici à la fin de la partie.</p>
          <div v-else class="history-list" aria-label="Choisir une expédition passée">
            <button v-for="report in reports" :key="report.runId" :data-drift-history-run="report.runId" :aria-pressed="selectedReportId === report.runId" @click="selectedReportId = report.runId">
              <drift-glyph :name="report.winnerId === userId ? 'trophy' : 'compass'" />
              <span><strong>{{ historyTitle(report) }}</strong><small>{{ historyDate(report.finishedAt) }} · {{ report.players.length }} dresseurs</small></span><span aria-hidden="true">→</span>
            </button>
          </div>
          <div v-if="selectedReport" class="history-report"><drift-run-report :key="selectedReport.runId" :report="selectedReport" :user-id="userId" /></div>
        </details>
      </section>

      <section class="camp-card catalogue" aria-labelledby="catalogue-title">
        <details @toggle="catalogueOpen = $event.target.open"><summary><span class="section-emblem"><drift-glyph name="drift" /></span><div><h2 id="catalogue-title">Les {{ definitions.length || 59 }} Drifts</h2></div><span class="catalogue-toggle">{{ catalogueOpen ? 'Refermer' : 'Découvrir' }} <b aria-hidden="true">{{ catalogueOpen ? '−' : '+' }}</b></span></summary>
          <div class="catalogue-body"><div class="catalogue-controls"><label><span><drift-glyph name="search" /> Trouver un Drift</span><input v-model="search" type="search" placeholder="Nom, effet, catégorie…" /></label>
              <label><span><drift-glyph name="drift" /> Rareté</span><select v-model="rarity"><option v-for="tier in rarities" :key="tier.key" :value="tier.key">{{ tier.name }}</option></select></label></div>
            <p class="quiet catalogue-caption">{{ filteredDefinitions.length }} pouvoirs · Les effets d’XP et d’économie restent réservés à l’exploration.</p>
            <div class="drift-grid"><article v-for="drift in filteredDefinitions" :key="drift.id" class="drift-entry" :class="rarity"><div class="entry-heading"><span class="drift-glyph"><drift-glyph :category="drift.category" :rarity="rarity" /></span><div><small>{{ drift.category }}</small><h3>{{ drift.name }}</h3></div></div><p>{{ drift.description }}</p>
                <div class="entry-value"><strong v-if="drift.values[rarity] !== null" class="drift-value">{{ formatValue(drift.values[rarity]) }} {{ drift.unit }}<small>{{ drift.stat }}</small></strong><strong v-else class="reserved">Légendaire ou Mythique uniquement</strong><span class="rarity-label">{{ rarityName(rarity) }}</span></div>
                <p v-if="drift.rule" class="drift-limit">{{ drift.rule }}</p>
              </article></div>
            <p v-if="!filteredDefinitions.length" class="quiet empty-search">Aucun pouvoir trouvé. Essaie un autre nom ou effet.</p>
          </div>
        </details>
      </section>

      </div>
      <footer class="drift-footer"><span>RIFTMON</span><span>Le voyage dure une partie. Le souvenir reste.</span></footer>
    </div>
  </main>
</template>

<script>
import { clearSession, getSession } from '@/services/session';
import api from '@/services/api';
import { createDriftSocket, getDriftConnectionFailure } from '@/services/realtime';
import RiftCollection from './RiftCollection.vue';
import DriftGlyph from './DriftGlyph.vue';
import DriftRunReport from './DriftRunReport.vue';
import { readDriftReports } from '@/services/driftReportHistory';

export default {
  name: 'DriftLobby',
  components: { RiftCollection, DriftGlyph, DriftRunReport },
  data() {
    const user = getSession() || {};
    return { userId: Number(user.id), username: user.username || 'Dresseur', socket: null, connected: false,
      bootstrapped: false, connectionFailed: false, connectionFailureKind: '', lobby: null, busy: false, error: '', capacity: 4, durationMinutes: 30,
      capacities: Array.from({ length: 15 }, (_, index) => index + 2), durations: [20, 30, 40, 60, 90, 120, 300], inviteCode: '', copied: false,
      visibility: 'public', hubTab: 'browse', publicLobbies: [], lobbySearch: '', listLoading: false, listLoaded: false, listError: '',
      appearance:{title:'',color:''}, historyError:false, profile: null, profileLoading: false, profileError: false,
      catalogueOpen: false, search: '', rarity: 'common', definitions: [], rarities: [],
      reports: readDriftReports(user.id).filter(r => r.mode !== 'colosseum'), selectedReportId: null };
  },
  computed: {
    rewardParticipants() { return this.lobby?.capacity || this.capacity; },
    rewardMinutes() { return this.lobby?.durationMinutes || this.durationMinutes; },
    rewardEstimate() { return Math.floor(2.5 * this.rewardParticipants * this.rewardMinutes); },
    filteredLobbies() {
      const query = this.normalizeSearch(this.lobbySearch);
      return this.publicLobbies.filter(room => this.normalizeSearch(`${room.hostName} ${room.code}`).includes(query));
    },
    selectedReport() { return this.reports.find(report => report.runId === this.selectedReportId) || null; },
    isHost() { return this.lobby?.hostId === this.userId; },
    isReady() { return Boolean(this.lobby?.players.find(player => player.id === this.userId)?.ready); },
    emptySlots() { return Math.max(0, (this.lobby?.capacity || 0) - (this.lobby?.players.length || 0)); },
    seats() { return Array.from({ length: this.lobby?.capacity || 0 }, (_, index) => this.lobby.players[index] || null); },
    readyCount() { return this.lobby?.players.filter(player => player.ready && player.connected).length || 0; },
    filteredDefinitions() {
      const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const query = normalize(this.search.trim());
      return this.definitions.filter(drift => normalize(`${drift.name} ${drift.category} ${drift.description}`).includes(query));
    }
  },
  mounted() {
    this.loadProfile();
    this.loadHistory();
    this.socket = createDriftSocket(getSession()?.token);
    this.socket.on('connect', () => { this.connected = true; this.bootstrapped = false; this.connectionFailed = false; this.connectionFailureKind = ''; this.error = ''; });
    this.socket.on('disconnect', () => { this.connected = false; this.bootstrapped = false; this.listLoaded = false; this.publicLobbies = []; });
    this.socket.on('connect_error', error => {
      const failure = getDriftConnectionFailure(error);
      this.connected = false; this.bootstrapped = false; this.connectionFailed = true;
      this.connectionFailureKind = failure.kind; this.error = failure.message;
    });
    this.socket.on('drift:bootstrap', payload => {
      this.capacities = payload.capacities; this.durations = payload.durations;
      this.definitions = payload.catalogue.definitions; this.rarities = payload.catalogue.rarities; this.bootstrapped = true;
      this.refreshLobbies();
    });
    this.socket.on('drift:lobbies', rooms => { this.publicLobbies = Array.isArray(rooms) ? rooms : []; this.listLoaded = true; this.listError = ''; });
    this.socket.on('drift:lobby', lobby => { this.lobby = lobby; if (lobby?.mode === 'colosseum') this.$router.replace(lobby.phase === 'lobby' || lobby.phase === 'results' ? '/colosseum' : '/colosseum/game'); else if (lobby && lobby.phase !== 'lobby') this.$router.replace('/drift/game'); });
    this.socket.connect();
  },
  beforeDestroy() { this.socket?.removeAllListeners(); this.socket?.disconnect(); },
  methods: {
    async loadHistory(){
      this.historyError=false;
      try {
        const remote=(await api.get('/rift/history')).data.reports||[];
        const combined=new Map([...this.reports,...remote].map(r=>[r.runId,r]));
        this.reports=[...combined.values()].sort((a,b)=>b.finishedAt-a.finishedAt).slice(0,20);
      }catch(e){this.historyError=true;}
    },
    normalizeSearch(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); },
    durationLabel(minutes) {
      return minutes >= 60 ? `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60}` : ''}` : `${minutes} min`;
    },
    profileValue(key) {
      return this.profile && Number.isFinite(Number(this.profile[key])) ? Number(this.profile[key]).toLocaleString('fr-FR') : '—';
    },
    async loadProfile() {
      if (this.profileLoading) return;
      this.profileLoading = true; this.profileError = false;
      try { this.profile = (await api.get('/rift/profile')).data; }
      catch (error) { this.profileError = true; }
      finally { this.profileLoading = false; }
    },
    async refreshLobbies() {
      if (!this.socket || !this.connected || this.listLoading) return;
      this.listLoading = true; this.listError = '';
      try {
        const response = await new Promise((resolve, reject) => this.socket.timeout(8000).emit('drift:list', {}, (error, result) => error ? reject(error) : resolve(result)));
        if (!response?.ok) throw new Error(response?.message || 'Les salons ne sont pas disponibles.');
        this.publicLobbies = Array.isArray(response.lobbies) ? response.lobbies : []; this.listLoaded = true;
      } catch (error) { this.listError = 'Impossible de charger les salons. Actualise la liste pour réessayer.'; }
      finally { this.listLoading = false; }
    },
    focusCreate() {
      this.hubTab = 'create';
      this.$nextTick(() => this.$el.querySelector('[data-rift-capacity]')?.focus());
    },
    joinPublicLobby(code) { return this.command('drift:join', { code }); },
    logout() {
      if (this.lobby || this.busy) return;
      clearSession(); this.$emit('logout');
      if (this.$route.path !== '/') this.$router.push('/');
    },
    async playAdventure() {
      if (this.busy) return;
      if (this.lobby) { await this.leaveLobby(); if (this.lobby) return; }
      this.$router.push('/game');
    },
    historyTitle(report) {
      if (report.winnerId === this.userId) return 'Ton expédition victorieuse';
      const winner = report.players.find(player => player.id === report.winnerId);
      return winner ? `Victoire de ${winner.username}` : 'Une expédition sans vainqueur';
    },
    historyDate(timestamp) { return new Date(timestamp).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }); },
    retryConnection() {
      if (!this.socket || this.connected) return;
      this.bootstrapped = false; this.connectionFailed = false; this.connectionFailureKind = ''; this.error = '';
      this.socket.auth = { ...this.socket.auth, token: getSession()?.token };
      this.socket.connect();
    },
    async command(name, payload = {}) {
      if (this.busy || !this.connected) return;
      this.busy = true; this.error = '';
      try {
        const response = await new Promise((resolve, reject) => this.socket.timeout(8000).emit(name, payload, (error, result) => error ? reject(error) : resolve(result)));
        if (!response?.ok) throw new Error(response?.message || 'Action impossible.');
        this.lobby = response.lobby; this.copied = false;
      } catch (error) { this.error = error.message || 'Le salon ne répond pas. Réessaie.'; }
      finally { this.busy = false; }
    },
    createLobby() { return this.command('drift:create', { capacity: this.capacity, durationMinutes: this.durationMinutes, visibility: this.visibility }); },
    joinLobby() { return this.command('drift:join', { code: this.inviteCode.toUpperCase() }); },
    configure(key, value) { return this.command('drift:configure', { capacity: this.lobby.capacity, durationMinutes: this.lobby.durationMinutes, visibility: this.lobby.visibility || 'private', [key]: value }); },
    setReady() { return this.command('drift:ready', { ready: !this.isReady }); },
    leaveLobby() { return this.command('drift:leave'); },
    async copyCode() {
      try { await navigator.clipboard.writeText(this.lobby.code); this.copied = true; }
      catch (error) { this.error = 'Sélectionne le code du salon pour le copier.'; }
    },
    rarityName(key) { return this.rarities.find(tier => tier.key === key)?.name || key; },
    formatValue(value) { return Number(value).toLocaleString('fr-FR'); }
  }
};
</script>

<style scoped>
.modes-back{display:inline-flex;align-items:center;min-height:44px;color:#d5ecff;text-decoration:none;font-size:12px;margin-bottom:8px;}
.drift-page { --ink: #142b3b; --paper: #f5efdf; --gold: #c5a568; --mint: #83c2f1; --muted: #aac0d2; box-sizing: border-box; min-height: 100vh; padding: 12px 28px 26px; color: var(--paper); background: radial-gradient(ellipse at 76% 8%, #4a9ae944, transparent 42%), linear-gradient(125deg, #081d36f5, #173d60ee), url('~@/assets/backgroundmenu.webp') center/cover fixed; font: 13px/1.5 'Trebuchet MS', Arial, sans-serif; text-align: left; }
.drift-shell { max-width: 1080px; margin: auto; }.drift-page *, .drift-page *::before, .drift-page *::after { box-sizing: border-box; }
.drift-nav { display: flex; justify-content: space-between; align-items: center; gap: 14px; min-height: 44px; color: #c6d3d3; font-size: 12px; }.drift-nav a { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; color: inherit; text-decoration: none; }.drift-nav .drift-glyph-icon { width: 17px; height: 17px; }.connection { display: flex; align-items: center; gap: 8px; min-width: 0; }.connection > span { min-width: 0; overflow-wrap: anywhere; }.connection i { flex: 0 0 6px; height: 6px; border-radius: 50%; background: var(--gold); }.connection i.online { background: var(--mint); box-shadow: 0 0 8px #89c7ba65; }
.drift-hero { position: relative; display: grid; grid-template-columns: 1.15fr 1fr; align-items: center; gap: 20px; padding: 26px 12px 32px; }.eyebrow { margin: 0 0 7px; color: var(--gold); font-size: 9px; font-weight: 700; letter-spacing: .16em; }.hero-title { z-index: 1; }h1 { margin: 0; color: var(--paper); font: 500 clamp(70px, 8vw, 94px)/1 Georgia, serif; letter-spacing: -.035em; }.title-spark { display: inline-block; margin-left: 13px; color: var(--mint); font: 26px Georgia, serif; vertical-align: top; padding-top: 10px; }.hero-copy { margin: 12px 0 18px; color: #bbcccd; font-size: 17px; line-height: 1.55; }.hero-copy strong { color: var(--paper); font-weight: 400; }.rule-ribbon { display: flex; flex-wrap: wrap; gap: 9px 18px; color: #c3d2d1; font-size: 11px; }.rule-ribbon span { display: flex; align-items: center; gap: 6px; }.rule-ribbon .drift-glyph-icon { width: 16px; height: 16px; color: var(--gold); }
.companion-art { position: relative; height: 255px; max-width: 380px; width: 100%; justify-self: center; isolation: isolate; }.companion-orbit { position: absolute; width: 235px; height: 235px; left: 50%; top: 0; transform: translateX(-50%); border: 1px solid #a8c4b72e; border-radius: 50%; box-shadow: inset 0 0 0 9px #89c7ba06, 0 0 0 16px #89c7ba04; background: radial-gradient(circle, #89c7ba19, transparent 67%); }.companion-orbit::after { content: ''; position: absolute; inset: 22px; border: 1px dashed #c5a56835; border-radius: 50%; }.companion-orbit .drift-glyph-icon { position: absolute; inset: 18%; width: 64%; height: 64%; color: #c5a56823; }.companion { position: absolute; width: 125px; height: 125px; image-rendering: pixelated; object-fit: contain; filter: drop-shadow(0 10px 6px #07131c75); }.companion-center { width: 170px; height: 170px; top: 71px; left: calc(50% - 85px); z-index: 2; }.companion-left { top: 54px; left: 0; transform: rotate(-8deg); }.companion-right { top: 38px; right: 0; transform: rotate(8deg); }.companion-caption { position: absolute; bottom: 0; left: 0; width: 100%; text-align: center; color: #a5c1bb; font-size: 10px; letter-spacing: .07em; }.orbit-star { position: absolute; color: var(--gold); font-size: 15px; }.star-one { top: 16px; left: 23%; }.star-two { right: 13%; top: 145px; font-size: 24px; }
.camp-layout { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr); align-items: start; gap: 32px; }.camp-card { min-width: 0; padding: 23px; border: 1px solid #9aab9a70; border-radius: 12px; background: linear-gradient(140deg, #213c4c, #142b3b); box-shadow: inset 0 0 0 3px #0d233173, 0 12px 25px #04121c35; }.section-heading { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }.section-heading > div { min-width: 0; }.section-emblem { flex-shrink: 0; display: grid; place-items: center; width: 39px; height: 39px; border: 1px solid #c5a56877; border-radius: 9px; background: #c5a5680b; color: var(--gold); }.section-emblem .drift-glyph-icon { width: 24px; height: 24px; }h2 { margin: 0; font: 500 24px/1.2 Georgia, serif; }.section-heading .eyebrow { font-size: 8px; }.room-count { margin-left: auto; color: var(--mint); font-size: 16px; }
fieldset { padding: 0; border: 0; margin: 0 0 18px; min-width: 0; }legend, label { margin-bottom: 8px; color: #cfdbd9; font-size: 11px; font-weight: 700; }legend { display: flex; align-items: center; gap: 7px; }legend .drift-glyph-icon { width: 16px; height: 16px; color: var(--muted); }.choice-row { display: flex; gap: 8px; }button, input, select { font: inherit; }button { cursor: pointer; transition: background .15s, border-color .15s; }button:disabled { opacity: .48; cursor: default; }button:focus-visible, a:focus-visible, summary:focus-visible { outline: 2px solid var(--mint); outline-offset: 3px; }button:not(:disabled):hover { filter: brightness(1.13); }.choice-row button { flex: 1; min-width: 0; min-height: 46px; padding: 8px 5px; border: 1px solid #66808b; border-radius: 8px; color: #c8d7d6; background: #102735; box-shadow: inset 0 -3px #0a1d2970; font-weight: 700; }.choice-row button > span { display: block; font-size: 23px; line-height: 1.2; }.choice-row button small { display: block; margin-top: 3px; font-size: 10px; font-weight: 400; }.choice-row button.selected { color: var(--ink); background: #ece8d8; border-color: #e6d3a8; box-shadow: inset 0 -3px #c5a56877, 0 0 0 1px #c5a56838; }
.gold-button { display: flex; justify-content: center; align-items: center; gap: 9px; width: 100%; min-height: 46px; padding: 11px 14px; border: 1px solid #e0c896; border-radius: 8px; background: linear-gradient(#dac28f, #c5a568); color: #152b36; font-size: 13px; font-weight: 700; box-shadow: inset 0 -3px #81663745; }.gold-button .drift-glyph-icon { width: 20px; height: 20px; }.button-arrow { margin-left: auto; font-size: 18px; }.subtle-button { min-height: 44px; padding: 9px 13px; border: 1px solid #829395; border-radius: 8px; background: #1d3747; color: var(--paper); font-size: 12px; font-weight: 700; }.join-form { margin-top: 22px; padding-top: 17px; border-top: 1px solid #aac3bf30; }.join-form label { display: block; color: #aebfc0; font-weight: 400; }.join-form > div { display: flex; gap: 8px; }input, select { box-sizing: border-box; min-height: 44px; min-width: 0; width: 100%; padding: 9px 11px; border: 1px solid #72878d; border-radius: 7px; background: #102635; color: var(--paper); font-size: 16px; }input::placeholder { color: #94a8ad; opacity: 1; }input:focus, select:focus { outline: 2px solid var(--mint); outline-offset: 2px; }.join-form input { text-transform: uppercase; letter-spacing: .07em; font-size: 14px; }.join-form .subtle-button { flex-shrink: 0; }.quiet { color: var(--muted); font-size: 11px; line-height: 1.6; }
.expedition-guide { min-width: 0; padding: 12px 0 0; }.guide-heading { padding: 0 0 5px 12px; }.guide-heading h2 { color: #f1e7d1; font-size: 27px; }.guide-heading > p:last-child { margin: 10px 0; color: #a7bdc0; font-size: 12px; line-height: 1.7; }.adventure-steps { position: relative; list-style: none; padding: 0; margin: 18px 0; }.adventure-steps::before { content: ''; position: absolute; top: 20px; bottom: 45px; left: 23px; border-left: 1px dashed #66877f; }.adventure-steps li { position: relative; display: flex; gap: 14px; padding: 0 0 20px; }.adventure-steps li:last-child { padding-bottom: 0; }.step-symbol { position: relative; display: grid; place-items: center; flex: 0 0 46px; height: 46px; border: 1px solid #6f9b904f; border-radius: 50%; background: #193441; color: var(--mint); box-shadow: inset 0 0 0 4px #0e263a66; }.step-symbol .drift-glyph-icon { width: 24px; height: 24px; }.adventure-steps small { display: block; margin: 2px 0 5px; color: #95b5ac; font-size: 8px; letter-spacing: .12em; }.adventure-steps strong { color: #eee9da; font-size: 13px; font-weight: 700; }.adventure-steps p { margin: 5px 0 0; color: #a9bdc0; font-size: 12px; line-height: 1.55; }.survival-note { display: flex; align-items: flex-start; gap: 11px; margin: 20px 0 0; padding: 12px 14px; border-left: 2px solid #c5a568; background: #c5a5680e; }.survival-note > span { display: grid; place-items: center; flex: 0 0 19px; height: 19px; border: 1px solid #c5a5687f; border-radius: 50%; color: var(--gold); font-weight: 700; }.survival-note p { margin: 0; color: #b9c3bd; font-size: 11px; line-height: 1.6; }.survival-note strong { color: #e2c993; }.adventure-note { color: #93acb1; font-size: 10px; line-height: 1.6; padding: 0 14px; }
.invite { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 12px 14px; border: 1px solid #71837b66; border-radius: 8px; background: #0e2431; }.invite small { display: block; color: #b2c0b9; font-size: 8px; letter-spacing: .12em; }.invite strong { display: block; margin-top: 3px; color: #f2e3b7; font: 700 23px/1.2 'Trebuchet MS', sans-serif; letter-spacing: .12em; }.invite .subtle-button { background: transparent; font-size: 11px; padding-inline: 10px; }.lobby-rules { display: flex; gap: 12px; margin-top: 17px; }.lobby-rules label { flex: 1; min-width: 0; margin-bottom: 0; }.lobby-rules label > span { display: flex; align-items: center; gap: 5px; }.lobby-rules .drift-glyph-icon { width: 15px; height: 15px; color: var(--muted); }.lobby-rules select { margin-top: 7px; font-size: 13px; }.room-hint { font-size: 10px; margin: 8px 0 16px; }
.players { list-style: none; padding: 0; margin: 0 0 19px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }.trainer-seat { display: flex; align-items: center; gap: 8px; min-width: 0; min-height: 78px; padding: 8px; border: 1px solid #5d777d; border-radius: 8px; background: #203d4a; }.trainer-seat.my-seat { border-color: #c5a56890; }.trainer-seat.seat-ready { border-color: #89c7ba; background: #23494d; }.trainer-token { flex: 0 0 39px; display: grid; place-items: center; width: 39px; height: 52px; position: relative; overflow: hidden; }.trainer-token::after { content: ''; position: absolute; width: 30px; height: 7px; border-radius: 50%; background: #07182370; bottom: 2px; z-index: 0; }.trainer-sprite { position: relative; display: block; flex-shrink: 0; width: 48px; height: 48px; background: url('~@/assets/sprite.png') 0 0/192px 192px; image-rendering: pixelated; z-index: 1; }.seat-info { min-width: 0; }.players strong { display: block; font-size: 12px; line-height: 1.3; overflow-wrap: anywhere; }.players small { display: block; margin-top: 3px; font-size: 9px; color: #b0c3c1; }.player-status { display: flex; align-items: center; gap: 5px; font-size: 9px; color: #c8b99b; margin-top: 6px; }.player-status i { width: 4px; height: 4px; border-radius: 50%; background: currentColor; flex-shrink: 0; }.player-status.ready { color: #b4e4ca; }.players .empty-player { border: 1px dashed #6f858766; background: #0f283447; }.empty-player strong { color: #99aeae; font-weight: 400; font-size: 11px; }.empty-player small { color: #839ca0; font-size: 9px; }.empty-token { color: #739089; }.empty-token::after { display: none; }.empty-token .drift-glyph-icon { width: 26px; height: 26px; opacity: .65; }.large-party .trainer-seat { min-height: 67px; }.large-party .empty-player { min-height: 54px; }.large-party .empty-token { height: 34px; }
.room-actions { display: flex; align-items: stretch; gap: 9px; }.room-actions .gold-button { flex: 1; }.room-actions .subtle-button { flex-shrink: 0; }.launch-note { display: grid; gap: 10px; padding-top: 15px; margin-top: 16px; border-top: 1px solid #aac3bf30; font-size: 11px; text-align: center; color: #b7c9c5; }.launch-note > span { display: flex; justify-content: space-between; align-items: center; gap: 12px; }.launch-note > span i { display: block; flex: 1; max-width: 170px; height: 4px; border-radius: 3px; background: linear-gradient(to right, var(--mint) var(--readiness), #476068 var(--readiness)); }.launch-note button:not(:disabled) { background: linear-gradient(#b5dac8, #89c7ba); border-color: #a9e4d3; box-shadow: inset 0 -3px #33594d44; }.launch-note .quiet { margin: 0; }
.catalogue { margin-top: 26px; padding: 0; background: #142b3bcc; }.catalogue summary { display: flex; align-items: center; gap: 12px; min-height: 86px; padding: 19px 23px; cursor: pointer; list-style: none; border-radius: 12px; }.catalogue summary::-webkit-details-marker { display: none; }.catalogue summary .eyebrow { font-size: 8px; }.catalogue summary h2 { font-size: 23px; }.catalogue-toggle { display: flex; align-items: center; gap: 18px; margin-left: auto; color: #b8cfc7; font-size: 12px; }.catalogue-toggle b { display: grid; place-items: center; width: 29px; height: 29px; border: 1px solid #70918a; border-radius: 50%; font-size: 19px; font-weight: 400; }.catalogue-body { padding: 0 23px 23px; border-top: 1px solid #91a59a35; }.catalogue-controls { display: flex; gap: 15px; margin-top: 17px; }.catalogue-controls label { display: grid; gap: 7px; flex: 1; min-width: 0; }.catalogue-controls label:first-child { flex: 1.6; }.catalogue-controls label > span { display: flex; align-items: center; gap: 6px; }.catalogue-controls .drift-glyph-icon { width: 15px; height: 15px; color: var(--muted); }.catalogue-controls input, .catalogue-controls select { font-size: 14px; }.catalogue-caption { margin: 3px 0 16px; }.drift-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }.drift-entry { --tier: #7f989e; display: flex; flex-direction: column; min-width: 0; padding: 15px; border: 1px solid #71878d; border-radius: 8px; background: #f5efdf; color: #243e49; overflow-wrap: anywhere; }.drift-entry.rare { --tier: #3a795f; }.drift-entry.epic { --tier: #81599c; }.drift-entry.legendary { --tier: #866626; }.drift-entry.mythic { --tier: #9c456b; }.entry-heading { display: flex; align-items: center; gap: 9px; }.entry-heading > div { min-width: 0; }.drift-glyph { display: grid; place-items: center; flex: 0 0 38px; height: 38px; border: 1px solid #c7c6ac; border-radius: 9px; background: #142b3b; color: var(--gold); }.drift-glyph .drift-glyph-icon { width: 26px; height: 26px; }.entry-heading small { display: block; color: #61726e; font-size: 9px; }.drift-entry h3 { margin: 3px 0 0; font: 700 13px/1.35 'Trebuchet MS', Arial, sans-serif; }.drift-entry > p { margin: 12px 0; color: #516368; font-size: 11px; line-height: 1.6; }.entry-value { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 9px; border-top: 1px solid #cdd0bf; }.drift-value { color: var(--tier); font-size: 20px; line-height: 1.2; }.drift-value small { display: block; color: #5e726e; font-size: 9px; font-weight: 400; margin-top: 4px; }.rarity-label { color: var(--tier); font-size: 8px; text-transform: uppercase; letter-spacing: .04em; }.drift-entry .drift-limit { color: #69776d; font-size: 10px; margin: 10px 0 0; }.reserved { font-size: 10px; color: #7c6541; }.empty-search { padding-block: 20px; text-align: center; }.error { padding: 12px 16px; color: #f8ddc6; background: #653a36; border: 1px solid #c88f76; border-radius: 8px; font-size: 13px; line-height: 1.5; }.reconnect-button { margin-bottom: 18px; }.drift-footer { display: flex; justify-content: space-between; gap: 16px; padding: 20px 4px 0; color: #809ca2; font-size: 9px; }.drift-footer > span:first-child { color: #a8b9b5; letter-spacing: .2em; font-weight: 700; }
@media (max-width: 900px) { .drift-page { padding-inline: 22px; }.camp-layout { gap: 22px; grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr); }.camp-card { padding: 20px; }.section-heading { gap: 9px; }.section-heading h2 { font-size: 22px; }.guide-heading h2 { font-size: 24px; }.drift-hero { padding-inline: 0; }.companion-art { max-width: 310px; }.drift-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.catalogue { padding: 0; } }
@media (max-width: 680px) { .drift-page { padding: 8px 16px 18px; }.drift-hero { grid-template-columns: 1.15fr .85fr; gap: 0; padding: 21px 0 25px; }.hero-title > .eyebrow { font-size: 7px; letter-spacing: .11em; }h1 { font-size: 65px; }.title-spark { font-size: 17px; margin-left: 8px; }.hero-copy { font-size: 13px; margin: 8px 0 15px; }.rule-ribbon { position: relative; width: 170%; gap: 11px; font-size: 10px; }.rule-ribbon .drift-glyph-icon { width: 13px; height: 13px; }.companion-art { height: 180px; margin-top: -16px; }.companion-orbit { width: 146px; height: 146px; top: 15px; }.companion { width: 74px; height: 74px; }.companion-center { width: 112px; height: 112px; left: calc(50% - 56px); top: 67px; }.companion-left { left: -13px; top: 36px; }.companion-right { right: -5px; top: 35px; }.companion-caption { display: none; }.star-one { top: 15px; left: 18%; font-size: 11px; }.star-two { right: 0; top: 118px; font-size: 16px; }.camp-layout { grid-template-columns: 1fr; gap: 22px; }.camp-card { padding: 20px; }.section-heading { margin-bottom: 21px; }.section-heading h2 { font-size: 23px; }.expedition-guide { padding: 0 4px; }.guide-heading { padding-left: 0; }.guide-heading h2 { font-size: 25px; }.guide-heading > p:last-child { display: none; }.adventure-steps { margin-top: 18px; }.adventure-steps li { padding-bottom: 18px; }.adventure-steps p { font-size: 12px; }.survival-note { margin-top: 16px; }.adventure-note { padding: 0; }.catalogue { padding: 0; margin-top: 22px; }.catalogue summary { padding: 16px; gap: 10px; min-height: 78px; }.catalogue summary h2 { font-size: 23px; }.catalogue summary .eyebrow { font-size: 7px; }.catalogue-toggle { font-size: 10px; gap: 8px; }.catalogue-toggle b { width: 24px; height: 24px; font-size: 17px; }.catalogue-body { padding: 0 16px 16px; }.catalogue-controls { gap: 10px; }.drift-grid { grid-template-columns: 1fr; }.drift-entry { padding: 14px; }.drift-footer { align-items: center; font-size: 8px; }.drift-footer > span:last-child { max-width: 170px; text-align: right; } }
@media (max-width: 370px) { .drift-page { padding-inline: 12px; }.drift-nav { font-size: 10px; gap: 9px; }.drift-nav a { gap: 5px; }.drift-hero { padding-top: 17px; }.hero-title > .eyebrow { max-width: 170px; font-size: 6px; }h1 { font-size: 61px; }.hero-copy { font-size: 12px; }.rule-ribbon { gap: 8px; font-size: 9px; }.companion-orbit { width: 125px; height: 125px; top: 22px; }.companion-center { width: 100px; height: 100px; left: calc(50% - 50px); }.companion-left, .companion-right { width: 65px; height: 65px; }.companion-left { left: -8px; }.camp-card { padding: 16px; }.section-heading h2 { font-size: 21px; }.section-heading .eyebrow { font-size: 7px; }.section-emblem { width: 32px; height: 36px; }.capacity-row button small { font-size: 9px; }.invite { padding: 10px; gap: 6px; }.invite strong { font-size: 19px; letter-spacing: .08em; }.invite .subtle-button { font-size: 10px; padding-inline: 8px; }.players { gap: 6px; }.trainer-seat { gap: 4px; padding: 7px 5px; }.trainer-token { flex-basis: 31px; width: 31px; }.players strong { font-size: 11px; }.players small { font-size: 8px; }.player-status { font-size: 8px; }.join-form input { font-size: 12px; }.join-form .subtle-button { padding-inline: 9px; font-size: 11px; }.catalogue { padding: 0; }.catalogue summary { gap: 8px; padding: 14px; }.catalogue summary h2 { font-size: 21px; }.catalogue-toggle { gap: 5px; font-size: 9px; }.catalogue-controls { flex-direction: column; gap: 4px; }.catalogue-body { padding-inline: 14px; } }
@media (max-height: 500px) and (min-width: 681px) { .drift-page { padding-top: 4px; }.drift-hero { padding-block: 12px 18px; min-height: 182px; }h1 { font-size: 64px; }.hero-copy { font-size: 14px; margin: 6px 0 10px; }.companion-art { height: 180px; max-width: 260px; }.companion-orbit { width: 165px; height: 165px; }.companion { width: 94px; height: 94px; }.companion-center { width: 126px; height: 126px; top: 37px; left: calc(50% - 63px); }.companion-left { top: 21px; }.companion-right { top: 18px; }.companion-caption { bottom: 1px; }.star-two { top: 105px; }.camp-layout { gap: 20px; }.section-heading h2 { font-size: 21px; }.camp-card { padding: 18px; }.catalogue { padding: 0; } }
.history { margin-top: 28px; }.history summary { display: flex; align-items: center; gap: 12px; min-height: 44px; cursor: pointer; list-style: none; }.history summary::-webkit-details-marker { display: none; }.history summary > div { flex: 1; min-width: 0; }.history h2 { margin: 0; font: 500 24px Georgia, serif; }.history-count { color: #b9cebf; font-size: 12px; white-space: nowrap; }.history-note { margin-top: 18px; }.history-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 16px 0; }.history-list button { display: flex; align-items: center; gap: 12px; min-height: 66px; padding: 12px; text-align: left; border: 1px solid #79968b66; border-radius: 8px; background: #0d2536; color: #f5efdf; }.history-list button[aria-pressed="true"] { background: #305153; border-color: #c5a568; }.history-list .drift-glyph-icon { flex: 0 0 22px; width: 22px; height: 22px; color: #c5a568; }.history-list button > span:first-of-type { flex: 1; min-width: 0; overflow-wrap: anywhere; }.history-list strong { display: block; font-size: 12px; }.history-list small { display: block; margin-top: 5px; color: #b8c8c4; font-size: 10px; }.history-report { padding: 20px; border: 1px solid #c5a568; border-radius: 10px; background: #f5efdf; color: #263e4d; }
@media (max-width: 600px) { .history h2 { font-size: 21px; }.history-list { grid-template-columns: minmax(0, 1fr); }.history-report { padding: 12px; margin-inline: -8px; } }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; clip: rect(0, 0, 0, 0); overflow: hidden; white-space: nowrap; border: 0; }
.camp-label { display: inline-flex; align-items: center; gap: 8px; color: #98bdd8; font-size: 9px; letter-spacing: .1em; }.account-nav { display: flex; align-items: center; gap: 13px; min-width: 0; }.account-button { border: 0; color: #a4bbcc; padding: 7px 0 7px 10px; min-height: 44px; border-left: 1px solid #7899b34a; background: transparent; font-size: 10px; }.connection { max-width: 220px; }.connection i.online { background: #80c8eb; box-shadow: 0 0 8px #80c8eb65; }
.drift-hero { padding: 13px 12px 24px; }.hero-title h1 { color: #8cccff; font-size: clamp(64px, 8vw, 91px); font-weight: 700; letter-spacing: -.055em; text-shadow: 0 5px #081e3244, 0 0 45px #5aabff20; }.hero-title h1 > span { color: #d9edff; }.title-spark { color: var(--gold); }.hero-title > .eyebrow { color: #a4cae5; font-size: 8px; }.hero-copy { margin-top: 8px; }.companion-orbit { border-color: #84b7e340; color: #90c4ed; }.rule-ribbon { width: auto; }.camp-layout { grid-template-columns: minmax(0, 1.12fr) minmax(0, 1fr); gap: 22px; align-items: start; }.camp-card { background: linear-gradient(135deg, #163652ee, #112b43ee); border-color: #6689a78a; }.room-browser { order: -1; }.has-lobby .lobby-card { order: -2; }.camp-card .section-heading h2 { font-size: 25px; }.section-emblem { background: #23476a; }.subtle-button { background: #1d3d59; }.hub-tabs { display: none; }
.profile-strip { display: flex; align-items: center; gap: 24px; padding: 16px 20px; border: 1px solid #c6d4d9; border-radius: 13px 4px 13px 4px; background: linear-gradient(125deg, #f6f1e5, #e1e7e8); color: #203b53; box-shadow: 0 9px 24px #02142c26, inset 0 0 0 3px #f8f4e999; }.profile-identity { display: flex; align-items: center; gap: 10px; min-width: 0; width: 210px; }.profile-identity > div { min-width: 0; }.profile-identity small { display: block; color: #647b8c; font-size: 7px; letter-spacing: .09em; }.profile-identity strong { display: block; margin-top: 3px; font: 700 18px Georgia, serif; overflow-wrap: anywhere; }.profile-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); flex: 1; gap: 14px; margin: 0; }.profile-stats > div { display: flex; flex-direction: column-reverse; align-items: center; }.profile-stats dt { display: flex; align-items: center; gap: 4px; margin-top: 2px; color: #65788a; font-size: 10px; }.profile-stats dt .drift-glyph-icon { width: 13px; height: 13px; }.profile-stats dd { margin: 0; color: #214569; font: 700 26px Georgia, serif; overflow-wrap: anywhere; }.profile-stats .coin-stat dd { color: #916b28; }.shop-soon { display: flex; justify-content: center; align-items: center; gap: 9px; padding: 10px 14px; border: 1px solid #a5b5bf; border-radius: 7px; background: #d5dce0; color: #536c7e; font-size: 11px; opacity: .7; }.shop-soon > span { display: grid; text-align: left; }.shop-soon small { font-size: 9px; font-weight: 400; }.shop-soon .drift-glyph-icon { width: 20px; height: 20px; }.reward-note, .profile-error { margin: 9px 2px 24px; color: #aac4d8; font-size: 10px; }.reward-note .drift-glyph-icon { width: 13px; height: 13px; margin-right: 3px; color: var(--gold); }.profile-error button { min-height: 30px; border: 0; background: transparent; text-decoration: underline; color: #d0e7f9; font-size: inherit; }
.creation-rules { display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); gap: 12px; }.creation-rules label { display: block; margin: 0; }.creation-rules label > .drift-glyph-icon { height: 15px; width: 15px; margin-right: 4px; }.creation-rules select { margin-top: 8px; font-size: 13px; background: #0d2741; }.duration-row { display: flex; flex-wrap: wrap; gap: 6px; }.duration-row button { flex: 1 0 calc(25% - 6px); min-width: 44px; white-space: nowrap; font-size: 12px; min-height: 44px; padding: 7px 3px; background: #0e2a42; border-color: #547994; }.creation-hint { margin: -3px 0 15px; font-size: 10px; }.room-visibility { display: block; margin-top: 12px; }.room-visibility select { display: block; margin-top: 7px; font-size: 13px; }.room-browser .section-heading { margin-bottom: 19px; }.refresh-rooms { display: grid; place-items: center; flex-shrink: 0; width: 44px; height: 44px; margin-left: auto; border: 1px solid #52718a; border-radius: 8px; background: #142f4b; color: #a5c5dc; }.refresh-rooms .drift-glyph-icon { width: 18px; height: 18px; }.room-search { position: relative; display: block; margin: 0; }.room-search > .drift-glyph-icon { position: absolute; left: 12px; top: 13px; width: 18px; height: 18px; color: #7c9db7; }.room-search input { padding-left: 39px; background: #0b243b; border-color: #557b98; font-size: 14px; }.live-rooms { display: flex; align-items: center; gap: 6px; font-size: 10px; margin: 11px 0; }.live-rooms i { width: 5px; height: 5px; border-radius: 50%; background: #8b9ca7; }.live-rooms i.online { background: #84c0ee; }.open-rooms { display: grid; gap: 9px; max-height: 334px; padding: 0 3px 1px 0; margin: 0; overflow-y: auto; list-style: none; scrollbar-width: thin; scrollbar-color: #6387a5 #0e2b44; }.open-rooms li { display: flex; align-items: center; gap: 10px; padding: 13px 11px; border: 1px solid #6e93ac75; border-radius: 9px 3px 9px 3px; background: linear-gradient(110deg, #234868, #173951); }.room-icon { display: grid; place-items: center; width: 33px; height: 41px; flex: 0 0 33px; color: #c4a970; }.room-info { flex: 1; min-width: 0; }.room-info strong { display: block; color: #f1ecdf; font-size: 12px; overflow-wrap: anywhere; }.room-info > span { display: flex; align-items: center; gap: 5px; color: #b6ccdd; font-size: 10px; margin-top: 5px; }.room-info > span .drift-glyph-icon { width: 12px; height: 12px; }.room-info i { margin-inline: 2px; font-style: normal; }.room-info small { display: block; margin-top: 3px; color: #87a7bf; font-size: 8px; letter-spacing: .09em; }.open-rooms .subtle-button { flex-shrink: 0; min-height: 44px; padding: 8px; font-size: 10px; border-color: #96b7c5; }.open-rooms .subtle-button span { margin-left: 4px; }.rooms-empty { display: flex; flex-direction: column; align-items: center; padding: 24px 10px; text-align: center; border: 1px dashed #6286a34f; border-radius: 8px; }.rooms-empty > .drift-glyph-icon { width: 41px; height: 41px; margin-bottom: 14px; color: #83adcf; }.rooms-empty strong { color: #d8e6f1; font: 500 19px Georgia, serif; }.rooms-empty p { max-width: 280px; color: #9ebace; font-size: 11px; line-height: 1.6; margin: 9px 0 14px; }.room-list-error { font-size: 12px; color: #f2c7ad; }.public-rule { display: flex; gap: 10px; align-items: center; padding-top: 17px; color: #a8c0d1; }.public-rule .drift-glyph-icon { width: 19px; height: 19px; color: #c0a56a; }.public-rule p { font-size: 10px; line-height: 1.6; margin: 0; }
.solo-adventure { display: flex; align-items: center; gap: 18px; width: 100%; margin-top: 24px; padding: 18px 23px; border: 1px solid #bdb89b9c; border-radius: 12px 4px 12px 4px; background: linear-gradient(110deg, #2a4b58, #143047); color: var(--paper); text-align: left; }.solo-icon { display: grid; place-items: center; width: 46px; height: 48px; flex: 0 0 46px; border: 1px solid #a2bdba66; border-radius: 50%; color: #bcdcd1; background: #153a4955; }.solo-adventure > span:nth-child(2) { display: grid; gap: 4px; min-width: 0; }.solo-adventure small { font-size: 7px; color: #b7c5c8; letter-spacing: .15em; }.solo-adventure strong { font: 500 22px Georgia, serif; }.solo-adventure > span > span { color: #a5c0c4; font-size: 11px; }.solo-adventure b { margin-left: auto; font-size: 23px; color: var(--gold); }
@media (max-width: 900px) { .profile-strip { gap: 14px; padding: 14px; }.profile-identity { width: 160px; }.profile-identity small { font-size: 6px; }.profile-identity strong { font-size: 15px; }.profile-stats { gap: 8px; }.profile-stats dt .drift-glyph-icon { display: none; }.shop-soon { padding: 9px; }.shop-soon > .drift-glyph-icon { display: none; }.camp-layout { grid-template-columns: repeat(2, minmax(0, 1fr)); }.room-icon { display: none; }.camp-card .section-heading h2 { font-size: 23px; }.creation-rules { grid-template-columns: 1fr; gap: 10px; }.creation-rules label { display: flex; align-items: center; gap: 5px; }.creation-rules select { flex: 1; width: auto; margin: 0 0 0 auto; max-width: 65%; }.profile-stats dd { font-size: 23px; } }
@media (max-width: 680px) { .camp-label { font-size: 7px; letter-spacing: .06em; }.camp-label .drift-glyph-icon { width: 15px; height: 15px; }.account-nav { gap: 8px; }.account-button { padding-left: 8px; font-size: 9px; }.connection { max-width: 125px; font-size: 10px; }.drift-hero { padding: 15px 0 19px; grid-template-columns: 1.35fr .65fr; }.hero-title h1 { font-size: clamp(47px, 12vw, 75px); }.hero-title > .eyebrow { font-size: 6px; letter-spacing: .09em; white-space: nowrap; }.hero-title .title-spark { font-size: 13px; margin-left: 4px; }.hero-copy { font-size: 12px; margin-bottom: 14px; }.companion-art { height: 145px; align-self: start; margin-top: 5px; }.companion-orbit { width: 116px; height: 116px; top: 9px; }.companion-center { width: 88px; height: 88px; top: 52px; left: calc(50% - 44px); }.companion-left, .companion-right { width: 61px; height: 61px; top: 20px; }.companion-left { left: -19px; }.companion-right { right: -5px; }.star-two { top: 101px; }.rule-ribbon { width: 150%; gap: 7px 11px; font-size: 9px; }.profile-strip { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; padding: 12px 13px; }.profile-identity { width: auto; }.profile-identity .trainer-token { height: 40px; flex-basis: 32px; }.profile-identity .trainer-sprite { transform: scale(.82); }.profile-identity strong { font-size: 15px; }.profile-identity small { font-size: 6px; }.shop-soon { grid-column: 2; grid-row: 1; padding: 6px 10px; font-size: 10px; min-height: 36px; }.shop-soon small { font-size: 8px; }.profile-stats { grid-column: 1/-1; grid-row: 2; border-top: 1px solid #bdc9ce; padding-top: 10px; gap: 5px; }.profile-stats dt { font-size: 9px; }.profile-stats dd { font-size: 23px; }.profile-stats dt .drift-glyph-icon { display: inline-block; width: 11px; height: 11px; }.reward-note, .profile-error { font-size: 9px; margin-bottom: 20px; }.hub-tabs { display: flex; gap: 6px; margin-bottom: 13px; padding: 4px; border: 1px solid #55789370; border-radius: 9px; background: #0a2239; }.hub-tabs button { display: flex; align-items: center; justify-content: center; gap: 7px; flex: 1; min-height: 44px; border: 1px solid transparent; border-radius: 6px; background: transparent; color: #a6c2d7; font-size: 11px; }.hub-tabs .drift-glyph-icon { width: 16px; height: 16px; }.hub-tabs button[aria-pressed="true"] { background: linear-gradient(#3b6689, #284e70); color: #edf6fb; border-color: #80a8c8; box-shadow: inset 0 -2px #12334d55; }.camp-layout { display: flex; flex-direction: column; gap: 20px; }.camp-layout > * { width: 100%; }.mobile-hidden { display: none; }.room-browser .section-heading { gap: 9px; margin-bottom: 16px; }.camp-card .section-heading h2 { font-size: 23px; }.section-heading .eyebrow { font-size: 7px; }.room-icon { display: grid; flex-basis: 27px; width: 27px; }.open-rooms li { gap: 7px; padding: 11px 8px; }.open-rooms { max-height: 300px; }.open-rooms .subtle-button { padding: 7px; font-size: 10px; }.open-rooms .subtle-button span { display: none; }.creation-rules { grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); }.creation-rules label { display: block; }.creation-rules select { display: block; margin: 7px 0 0; max-width: none; width: 100%; font-size: 12px; }.duration-row button { font-size: 11px; }.solo-adventure { padding: 16px; gap: 11px; }.solo-adventure strong { font-size: 19px; }.solo-adventure > span > span { font-size: 10px; }.solo-icon { width: 36px; height: 40px; flex-basis: 36px; }.solo-adventure b { font-size: 20px; }.history { margin-top: 20px; } }
@media (max-width: 370px) { .camp-label { font-size: 6px; }.camp-label .drift-glyph-icon { display: none; }.connection { max-width: 100px; }.hero-title h1 { font-size: 46px; }.hero-title > .eyebrow { font-size: 5.5px; }.drift-hero { grid-template-columns: 1.4fr .6fr; }.companion-art { height: 131px; }.companion-left { left: -23px; }.companion-right { right: -9px; }.companion-orbit { width: 93px; height: 93px; }.hero-copy { font-size: 11px; }.rule-ribbon { font-size: 8px; gap: 6px 8px; width: 160%; }.rule-ribbon .drift-glyph-icon { width: 11px; height: 11px; }.profile-stats dt .drift-glyph-icon { display: none; }.profile-stats dt { font-size: 8px; }.camp-card .section-heading h2 { font-size: 21px; }.section-heading .eyebrow { font-size: 6px; }.room-icon { display: none; }.room-info strong { font-size: 11px; }.room-info > span { font-size: 9px; }.solo-adventure strong { font-size: 17px; }.solo-adventure small { font-size: 6px; }.solo-icon { display: none; } }
@media (max-height: 500px) and (min-width: 681px) { .drift-hero { padding-block: 5px 17px; }.hero-title h1 { font-size: 66px; }.profile-strip { padding-block: 10px; } }
@media (prefers-reduced-motion: reduce) { button { transition: none; } }
.reward-preview { display: flex; align-items: flex-start; gap: 12px; margin: 17px 0; padding: 15px 14px; border: 1px solid #a4bcd07d; border-radius: 10px 3px 10px 3px; background: linear-gradient(110deg, #244d6c, #163752); box-shadow: inset 3px 0 #bda169; }.reward-seal { display: grid; place-items: center; flex: 0 0 32px; height: 36px; margin-top: 4px; color: #e1c487; }.reward-seal .drift-glyph-icon { width: 26px; height: 26px; }.reward-preview > div { min-width: 0; }.reward-preview small { display: block; color: #d0ba8e; font-size: 8px; letter-spacing: .09em; }.reward-preview strong { display: block; margin: 4px 0; color: #fbf0d8; font: 500 23px/1.2 Georgia, serif; }.reward-preview span:not(.reward-seal) { display: block; color: #c1d8e9; font-size: 10px; }.reward-preview p { margin: 9px 0 0; color: #aac5d8; font-size: 10px; line-height: 1.6; }
@media (max-width: 370px) { .reward-preview { gap: 8px; padding: 13px 10px; }.reward-seal { flex-basis: 25px; }.reward-preview strong { font-size: 21px; } }

/* Camp: one decision at a time, with optional details below the play area. */
.drift-page { background: radial-gradient(ellipse at 85% 0%, #254b6966, transparent 55%), #0c2033; padding: 20px 24px 32px; font-size: 15px; }
.drift-shell { max-width: 780px; }
.drift-nav { min-height: 42px; padding-bottom: 12px; border-bottom: 1px solid #ffffff12; }
.camp-label { font-size: 10px; letter-spacing: .08em; }
.account-nav { flex-shrink: 0; }
.connection, .connection > span { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px; }
.account-button { font-size: 12px; min-height: 44px; }
.drift-hero { display: flex; justify-content: space-between; padding: 28px 0 26px; gap: 16px; }
.hero-title h1 { font-size: 58px; line-height: 1; }
.hero-title > .eyebrow { font-size: 10px; margin-bottom: 10px; letter-spacing: .12em; }
.hero-copy { font-size: 15px; margin: 12px 0 0; color: #b4c8d9; }
.camp-companion { width: 120px; height: 120px; object-fit: contain; image-rendering: pixelated; filter: drop-shadow(0 8px 15px #0005); }
.play-intro { margin: 0 0 20px; }
.play-intro h2 { font: 600 25px/1.3 'Trebuchet MS', sans-serif; }
.play-intro p { color: #a9c0d2; margin: 7px 0 0; font-size: 14px; }
.hub-tabs { display: flex; gap: 4px; margin: 0 0 16px; padding: 5px; border: 1px solid #48647b; border-radius: 12px; background: #081a2a; }
.hub-tabs button { display: flex; align-items: center; justify-content: center; gap: 9px; flex: 1; min-height: 48px; border: 0; border-radius: 8px; color: #a9c2d7; background: transparent; font-size: 15px; font-weight: 700; }
.hub-tabs .drift-glyph-icon { width: 19px; height: 19px; }
.hub-tabs button[aria-pressed="true"] { background: #315c7c; color: #fff; box-shadow: none; }
.camp-layout, .camp-layout.has-lobby { display: flex; flex-direction: column; gap: 16px; }
.camp-layout > * { width: 100%; }
.camp-layout .mobile-hidden { display: none; }
.camp-card { padding: 24px; border: 1px solid #49667c80; border-radius: 14px; background: #142e44; box-shadow: none; }
.section-heading .eyebrow { display: none; }
.section-heading .section-emblem { display: none; }
.camp-card .section-heading h2 { font: 600 20px/1.3 'Trebuchet MS', sans-serif; }
.section-heading, .room-browser .section-heading { margin-bottom: 16px; }
.rooms-empty { border: 0; background: #10273b; padding: 22px 16px; }
.rooms-empty > .drift-glyph-icon { width: 30px; height: 30px; margin-bottom: 12px; }
.rooms-empty strong { font: 600 18px/1.4 'Trebuchet MS', sans-serif; }
.rooms-empty p { font-size: 14px; max-width: 420px; }
.rooms-empty .gold-button { width: auto; min-width: 210px; margin-top: 6px; }
.live-rooms { font-size: 12px; }
.join-form { margin-top: 22px; padding-top: 20px; }
.join-form label { font-size: 14px; color: #bdcfdd; margin-bottom: 10px; }
.join-form > div { max-width: 470px; }
.creation-rules { grid-template-columns: 1fr 1fr; }
.creation-rules label { display: block; font-size: 14px; }
.creation-rules select { display: block; max-width: none; width: 100%; margin-top: 8px; font-size: 15px; }
legend { font-size: 14px; }
.duration-row button { flex: 1 0 70px; font-size: 14px; }
.reward-details { margin: 12px 0 18px; border-top: 1px solid #ffffff18; border-bottom: 1px solid #ffffff18; }
.reward-details summary { display: flex; justify-content: space-between; gap: 12px; padding: 14px 0; color: #b9ccdb; font-size: 13px; cursor: pointer; list-style: none; }
.reward-details p { color: #b4c8d9; font-size: 13px; margin: 0 0 16px; line-height: 1.7; }
.creation-hint { font-size: 12px; }
.gold-button, .subtle-button { font-size: 14px; min-height: 46px; }
.solo-adventure { margin: 0 0 28px; padding: 22px; border: 1px solid #84baa3; border-radius: 14px; background: linear-gradient(115deg, #285047, #193c3f); gap: 16px; box-shadow: 0 6px 24px #0002; }
.solo-adventure .solo-icon { display: grid; border: 0; background: #173b45; width: 42px; flex-basis: 42px; height: 42px; border-radius: 10px; }
.solo-adventure strong { font: 700 20px/1.4 'Trebuchet MS', sans-serif; }
.solo-adventure > span > span { font-size: 14px; color: #c6e0d6; line-height: 1.6; }
.camp-extras { margin-top: 14px; }
.camp-extras > .camp-card, .profile-details { padding: 0; margin: 0; border: 0; border-bottom: 1px solid #ffffff14; border-radius: 0; background: transparent; box-shadow: none; }
.camp-extras summary, .profile-details > summary { display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 12px 2px; list-style: none; color: #b1c6d7; cursor: pointer; }
.camp-extras summary h2 { font: 400 14px/1.4 'Trebuchet MS', sans-serif; }
.camp-extras summary .section-emblem { display: none; }
.profile-details > summary { justify-content: space-between; font-size: 14px; }
.catalogue-toggle { font-size: 12px; }
.catalogue-toggle b { border: 0; width: auto; height: auto; font-size: 18px; }
.profile-strip { margin: 0 0 12px; padding: 18px; border-radius: 10px; }
.profile-identity { width: 150px; }
.catalogue-body { padding: 0 0 18px; }
.history-note { margin-top: 0; }
.expedition-guide { padding: 14px 20px; border: 1px solid #ffffff18; border-radius: 10px; }
.expedition-guide > summary { cursor: pointer; color: #b5cbda; font-size: 14px; }
.expedition-guide .guide-heading { padding-top: 20px; }
.drift-footer { margin-top: 20px; font-size: 10px; color: #93aabd; }
@media (max-width: 680px) {
 .drift-page { padding: 12px 16px 24px; }
 .camp-label { font-size: 8px; }
 .camp-label .drift-glyph-icon { display: none; }
 .account-nav { gap: 8px; }
 .connection, .connection > span { max-width: 100px; font-size: 12px; }
 .account-button { font-size: 11px; }
 .drift-hero { padding: 24px 0; }
 .hero-title h1 { font-size: 45px; }
 .hero-title > .eyebrow { font-size: 9px; }
 .hero-copy { font-size: 13px; max-width: 210px; }
 .camp-companion { width: 82px; height: 96px; }
 .play-intro h2 { font-size: 22px; }
 .play-intro p { font-size: 13px; }
 .hub-tabs button { font-size: 13px; gap: 6px; }
 .hub-tabs .drift-glyph-icon { display: none; }
 .camp-card { padding: 18px; }
 .camp-card .section-heading h2 { font-size: 18px; }
 .rooms-empty { padding: 20px 10px; }
 .rooms-empty strong { font-size: 16px; }
 .rooms-empty p { font-size: 13px; }
 .creation-rules { grid-template-columns: 1fr; gap: 16px; }
 .profile-strip { display: flex; flex-wrap: wrap; }
 .profile-stats { flex-basis: 100%; }
 .solo-adventure { padding: 18px 14px; gap: 10px; }
 .solo-adventure strong { font-size: 17px; }
 .solo-adventure > span > span { font-size: 12px; }
 .drift-footer > span:last-child { display: none; }
}

</style>

<style scoped>
.modes-back{display:inline-flex;align-items:center;min-height:44px;color:#d5ecff;text-decoration:none;font-size:12px;margin-bottom:8px;}.profile-title{display:block;color:#3d5c69;font-size:11px;margin-top:5px}</style>

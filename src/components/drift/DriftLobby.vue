<template>
  <main class="drift-page" data-rift-hub>
    <div class="drift-shell"><router-link class="modes-back" to="/">← Choisir un mode</router-link>
      <header class="drift-nav">
        <span class="camp-label"><drift-glyph name="compass" /> LE CAMP DES DRESSEURS</span>
        <div class="account-nav"><span class="connection" role="status"><i :class="{ online: connected }"></i><span>{{ username }}</span></span><button class="account-button" :disabled="busy || Boolean(lobby)" :title="lobby ? 'Quitte le salon pour changer de compte' : 'Changer de compte'" @click="logout">Déconnexion</button></div>
      </header>

      <section class="drift-hero" aria-labelledby="drift-title">
        <div class="hero-title">
          <p class="eyebrow">LE RENDEZ-VOUS DES RIVAUX</p>
          <h1 id="drift-title">Rift multijoueur</h1>
          <p class="hero-copy">Explore, compose ton équipe, puis affronte tes amis.</p><div class="hero-tags"><span>2 à 16 dresseurs</span><span>5 Drifts équipés</span><span>K.O. définitifs</span></div>
        </div>
        <img class="camp-companion" :src="$assetBase + 'img/pokemon/front/133.png'" alt="" />
      </section>


      <rift-rank-summary :in-lobby="Boolean(lobby)" />
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
          <ol class="adventure-steps"><li><span class="step-symbol"><drift-glyph name="compass" /></span><div><small>01 · L’EXPLORATION</small><strong>Un compagnon, mille possibles.</strong><p>Un petit Pokémon aléatoire au départ. Capture, entraîne et soigne ton équipe. Les gains d’XP sont doublés.</p></div></li>
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
      <button class="solo-adventure" data-rift-solo :disabled="busy" @click="playAdventure"><span class="solo-icon"><drift-glyph name="progress" /></span><span><strong>Jouer une aventure en solo</strong><span>Avance à ton rythme dans un monde partagé. Multijoueur facultatif.</span></span><b aria-hidden="true">→</b></button>
      <footer class="drift-footer"><span>RIFTMON</span><span>Le voyage dure une partie. Le souvenir reste.</span></footer>
    </div>
  </main>
</template>

<script>
import { clearSession, getSession } from '@/services/session';
import api from '@/services/api';
import { createDriftSocket, getDriftConnectionFailure } from '@/services/realtime';
import RiftRankSummary from '../social/RiftRankSummary.vue';
import RiftCollection from './RiftCollection.vue';
import DriftGlyph from './DriftGlyph.vue';
import DriftRunReport from './DriftRunReport.vue';
import { readDriftReports } from '@/services/driftReportHistory';

export default {
  name: 'DriftLobby',
  components: { RiftRankSummary, RiftCollection, DriftGlyph, DriftRunReport },
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
.drift-page{min-height:100dvh;background:var(--journal-paper);color:var(--journal-ink);font:14px/1.6 var(--journal-font);text-align:left;padding:env(safe-area-inset-top) max(22px,env(safe-area-inset-left)) max(28px,env(safe-area-inset-bottom))}.drift-page *,.drift-page *::before,.drift-page *::after{box-sizing:border-box}.drift-shell{max-width:960px;margin:auto}.drift-page svg{width:19px;height:19px;flex-shrink:0}.drift-page button,.drift-page input,.drift-page select{font:inherit}.drift-page button{cursor:pointer;min-height:44px}.drift-page button:disabled{opacity:.5;cursor:default}.drift-page :focus-visible{outline:3px solid var(--journal-accent);outline-offset:3px}.drift-page a{color:var(--journal-accent)}.modes-back{display:inline-flex;align-items:center;min-height:44px;text-decoration:none;font-size:12px;margin-top:10px}.drift-nav{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:4px 0 16px;border-bottom:1px solid var(--journal-border)}.camp-label,.account-nav,.connection{display:flex;align-items:center;gap:9px}.camp-label{font-size:9px;letter-spacing:.12em;color:var(--journal-muted)}.account-nav{font-size:12px;min-width:0}.connection span{max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.connection i,.live-rooms i{width:6px;height:6px;border-radius:50%;background:#a3aaa1;display:inline-block;flex-shrink:0}.connection i.online,.live-rooms i.online{background:var(--journal-progress)}.account-button{border:0;background:transparent;color:var(--journal-muted);font-size:11px!important;padding:0 0 0 14px}.drift-hero{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:28px 0}.eyebrow{font-size:9px;letter-spacing:.13em;color:#806639;font-weight:700;margin:0 0 8px}h1{font:500 clamp(32px,5vw,48px)/1.15 Georgia,serif;letter-spacing:-.035em;margin:0;color:var(--journal-heading)}.hero-copy{color:var(--journal-muted);margin:12px 0 0;line-height:1.7;font-size:13px}.hero-tags{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.hero-tags span{padding:4px 9px;border:1px solid var(--journal-border);border-radius:20px;font-size:10px;color:var(--journal-muted);background:var(--journal-card)}.camp-companion{width:115px;height:115px;object-fit:contain;image-rendering:pixelated;border-radius:50%;background:var(--journal-selected);padding:10px}.hub-tabs{display:flex;width:max-content;max-width:100%;gap:4px;border:1px solid var(--journal-border);border-radius:10px;padding:4px;background:var(--journal-soft);margin-bottom:18px}.hub-tabs button{display:flex;align-items:center;justify-content:center;gap:9px;padding:10px 20px;border:0;border-radius:7px;color:var(--journal-muted);background:transparent;font-weight:700;font-size:12px}.hub-tabs button[aria-pressed="true"]{background:var(--journal-card);color:var(--journal-accent);box-shadow:0 1px 4px #233e3717}.camp-layout{display:grid;gap:18px}.camp-layout.has-lobby{grid-template-columns:minmax(0,1fr) 290px;align-items:start}.camp-card{border:1px solid var(--journal-border);border-radius:14px;background:var(--journal-card);padding:24px;min-width:0}.mobile-hidden{display:none}.section-heading{display:flex;align-items:center;gap:12px;margin-bottom:22px}.section-heading>div{flex:1;min-width:0}.section-emblem{display:grid;place-items:center;flex-shrink:0;width:38px;height:38px;border:1px solid var(--journal-border);border-radius:10px;background:var(--journal-soft);color:var(--journal-accent)}h2{font:500 26px/1.2 Georgia,serif;margin:0;color:var(--journal-heading)}.section-heading .eyebrow{font-size:8px;margin-bottom:6px}.room-count{font-size:12px;color:var(--journal-muted)}fieldset{border:0;margin:0 0 20px;padding:0;min-width:0}legend,label{font-size:12px;color:var(--journal-ink)}legend{padding:0 0 9px}legend svg,label svg{vertical-align:middle;margin-right:4px;width:16px!important;height:16px!important}.creation-rules,.lobby-rules{display:grid;grid-template-columns:1fr 1fr;gap:16px}label{display:block}.drift-page input,.drift-page select{min-height:46px;border:1px solid var(--journal-border);border-radius:8px;background:var(--journal-paper);color:var(--journal-ink);padding:10px 12px;width:100%;min-width:0;font-size:16px}.drift-page select{margin-top:7px}.choice-row{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}.choice-row button{background:var(--journal-paper);border:1px solid var(--journal-border);border-radius:8px;color:var(--journal-muted);font-size:12px}.choice-row button.selected{background:var(--journal-selected);border-color:var(--journal-accent);box-shadow:inset 0 0 0 1px var(--journal-accent);color:var(--journal-accent);font-weight:700}.gold-button,.subtle-button,.refresh-rooms{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;border:1px solid var(--journal-accent);border-radius:8px;background:var(--journal-accent);color:white;font-size:12px!important;font-weight:700}.gold-button:hover:enabled{background:#1d5e53}.subtle-button,.refresh-rooms{background:var(--journal-soft);color:var(--journal-accent);border-color:var(--journal-border)}.refresh-rooms{width:44px;flex-shrink:0;padding:8px}.lobby-card form>.gold-button,.launch-note>.gold-button{width:100%;justify-content:flex-start;min-height:50px}.button-arrow{margin-left:auto;font-size:21px}.quiet{font-size:11px;color:var(--journal-muted);line-height:1.7}.creation-hint{margin:20px 0 10px}.reward-details{border:1px solid var(--journal-border);border-radius:8px;background:var(--journal-soft);padding:0 13px;font-size:11px}.reward-details summary{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;color:var(--journal-muted);list-style:none}.reward-details p{color:var(--journal-muted);line-height:1.7;margin:0 0 14px}.room-search{position:relative}.room-search>svg{position:absolute;top:15px;left:12px;color:var(--journal-muted)}.room-search input{padding-left:38px}.live-rooms{display:flex;gap:8px;align-items:center;margin:12px 0}.rooms-empty{display:flex;flex-direction:column;align-items:center;text-align:center;background:var(--journal-soft);border:1px dashed var(--journal-border);border-radius:10px;padding:25px 16px;gap:10px}.rooms-empty>svg{width:32px;height:32px;color:var(--journal-progress);margin-bottom:4px}.rooms-empty strong{font:500 24px/1.3 Georgia,serif}.rooms-empty p{font-size:12px;color:var(--journal-muted);margin:0 0 6px}.rooms-empty .gold-button{min-width:170px}.join-form{margin-top:22px;padding-top:19px;border-top:1px solid var(--journal-border)}.join-form label{margin-bottom:9px}.join-form>div{display:flex;gap:10px}.join-form input{flex:1;text-transform:uppercase;font-size:14px}.open-rooms{list-style:none;margin:10px 0;padding:0}.open-rooms>li{display:flex;align-items:center;gap:12px;padding:15px 0;border-top:1px solid var(--journal-border)}.room-icon{color:var(--journal-accent)}.room-info{flex:1;min-width:0}.room-info strong{display:block;font-size:13px;overflow-wrap:anywhere}.room-info>span{display:flex;gap:6px;align-items:center;font-size:11px;color:var(--journal-muted);margin-top:5px}.room-info svg{width:14px;height:14px}.room-info small{font-size:10px;color:var(--journal-muted)}.room-info i{font-style:normal}.invite{display:flex;justify-content:space-between;gap:12px;align-items:center;background:var(--journal-selected);padding:16px;border-radius:10px;margin-bottom:22px}.invite small{display:block;font-size:8px;letter-spacing:.08em;color:var(--journal-muted)}.invite strong{font-size:25px;letter-spacing:.15em;color:var(--journal-accent)}.invite button{font-size:10px!important}.lobby-rules{margin-bottom:18px}.room-visibility{margin-top:18px}.players{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));list-style:none;gap:10px;margin:20px 0;padding:0}.trainer-seat{display:flex;align-items:center;gap:10px;border:1px solid var(--journal-border);border-radius:9px;padding:12px;min-width:0;min-height:90px;background:var(--journal-paper)}.seat-ready{background:var(--journal-selected);border-color:var(--journal-progress)}.empty-player{border-style:dashed;color:var(--journal-muted)}.trainer-token{display:grid;place-items:center;width:30px;height:42px;flex-shrink:0}.trainer-sprite{display:block;width:24px;height:32px;background-image:url('~@/assets/sprite.png');background-size:96px 128px;image-rendering:pixelated}.empty-token svg{color:var(--journal-muted)}.seat-info{min-width:0;flex:1}.seat-info strong,.seat-info small,.player-status{display:block}.seat-info strong{font-size:12px;overflow-wrap:anywhere}.seat-info small{font-size:9px;color:var(--journal-muted)}.player-status{font-size:9px;margin-top:7px;color:var(--journal-muted)}.player-status.ready{color:var(--journal-accent)}.room-actions{display:flex;gap:10px}.room-actions>.gold-button{flex:1}.launch-note{margin-top:20px;padding-top:18px;border-top:1px solid var(--journal-border)}.launch-note>span{display:block;margin-bottom:14px;color:var(--journal-muted);font-size:11px}.launch-note i{height:5px;background:linear-gradient(to right,var(--journal-progress) var(--readiness),var(--journal-soft) var(--readiness));display:block;margin-bottom:9px;border-radius:6px}.expedition-guide{background:var(--journal-soft);border:1px solid var(--journal-border);border-radius:12px;padding:0 18px}.expedition-guide>summary{min-height:52px;display:flex;align-items:center;font-size:12px;cursor:pointer}.guide-heading{padding-top:12px}.guide-heading h2{font-size:25px}.guide-heading p:last-child,.adventure-note{font-size:11px;color:var(--journal-muted);line-height:1.7}.adventure-steps{list-style:none;padding:0;margin:20px 0}.adventure-steps li{display:flex;gap:10px;margin-bottom:22px}.step-symbol{color:var(--journal-accent)}.adventure-steps small,.adventure-steps strong{display:block}.adventure-steps small{font-size:8px;color:#806639;letter-spacing:.07em}.adventure-steps strong{font-size:12px;margin:6px 0}.adventure-steps p{font-size:11px;color:var(--journal-muted);line-height:1.7;margin:0}.survival-note{display:flex;gap:10px;font-size:11px;color:#8a4b37}.survival-note p{margin:0}.survival-note strong{display:block}.camp-extras{margin-top:28px;border-top:1px solid var(--journal-border)}.camp-extras>.camp-card{padding:0;border:0;border-radius:0;border-bottom:1px solid var(--journal-border);background:transparent}.camp-extras summary{display:flex;align-items:center;gap:12px;list-style:none;min-height:64px;cursor:pointer}.camp-extras summary::-webkit-details-marker,.reward-details summary::-webkit-details-marker{display:none}.camp-extras h2{font:500 16px Arial,sans-serif}.camp-extras .section-emblem{width:30px;height:30px;border-radius:8px}.history-count,.catalogue-toggle{margin-left:auto;color:var(--journal-muted);font-size:11px}.catalogue-toggle b{margin-left:8px}.profile-details{border-bottom:1px solid var(--journal-border)}.profile-details>summary{justify-content:space-between;font-size:14px}.profile-strip{border:1px solid var(--journal-border);border-radius:10px;background:var(--journal-card);padding:18px;margin-bottom:18px}.profile-identity{display:flex;align-items:center;gap:12px}.profile-identity small,.profile-identity strong,.profile-title{display:block}.profile-identity small{font-size:8px;color:var(--journal-muted);letter-spacing:.08em}.profile-identity strong{font:22px Georgia,serif;overflow-wrap:anywhere}.profile-title{font-size:10px;color:#806639}.profile-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:20px 0 0}.profile-stats>div{display:flex;flex-direction:column-reverse;align-items:center;gap:5px}.profile-stats dt{font-size:10px;color:var(--journal-muted)}.profile-stats svg{vertical-align:middle;width:13px;height:13px}.profile-stats dd{font:26px Georgia,serif;color:var(--journal-accent);margin:0}.profile-error,.error,.room-list-error{color:var(--journal-danger);font-size:12px;overflow-wrap:anywhere}.error{padding:12px 16px;background:#f5eae5;border-radius:8px}.history-list{display:grid;gap:8px;margin:16px 0}.history-list button{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:12px;border:1px solid var(--journal-border);background:var(--journal-card);color:var(--journal-ink);border-radius:8px}.history-list button[aria-pressed="true"]{background:var(--journal-selected);border-color:var(--journal-accent)}.history-list button>span:nth-child(2){flex:1;min-width:0}.history-list strong,.history-list small{display:block}.history-list strong{font-size:12px}.history-list small{color:var(--journal-muted);font-size:10px;margin-top:5px}.history-report{margin:20px 0;padding:16px;border:1px solid var(--journal-border);border-radius:10px;background:var(--journal-card)}.catalogue-body{padding:16px 0}.catalogue-controls{display:grid;grid-template-columns:2fr 1fr;gap:16px}.catalogue-controls input{margin-top:7px}.drift-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:20px}.drift-entry{border:1px solid var(--journal-border);border-radius:10px;padding:15px;background:var(--journal-card);min-width:0}.entry-heading{display:flex;gap:10px;align-items:center}.entry-heading>div{min-width:0}.entry-heading small{color:var(--journal-muted);font-size:9px}.entry-heading h3{font-size:13px;margin:3px 0;overflow-wrap:anywhere}.drift-glyph{background:var(--journal-soft);padding:8px;border-radius:8px}.drift-entry p{font-size:11px;line-height:1.7;color:var(--journal-muted)}.entry-value{display:flex;justify-content:space-between;align-items:center;gap:8px;border-top:1px solid var(--journal-border);padding-top:12px}.drift-value{font-size:19px;color:var(--journal-accent)}.drift-value small{display:block;font-size:9px;font-weight:400}.rarity-label,.reserved{font-size:9px;color:#806639}.drift-limit{font-size:10px!important}.solo-adventure{display:flex;align-items:center;gap:14px;width:100%;border:1px solid var(--journal-border);border-radius:12px;background:var(--journal-soft);padding:18px;color:var(--journal-ink);text-align:left;margin:25px 0}.solo-adventure>span:nth-child(2){flex:1;min-width:0}.solo-adventure strong,.solo-adventure>span>span{display:block}.solo-adventure strong{font-size:14px;margin-bottom:5px}.solo-adventure>span>span{font-size:11px;color:var(--journal-muted)}.solo-icon{color:var(--journal-accent)}.solo-adventure b{font-size:22px;font-weight:400}.drift-footer{display:flex;justify-content:space-between;gap:12px;color:var(--journal-muted);font-size:9px;padding:22px 0}.drift-footer span:first-child{letter-spacing:.15em}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media(max-width:740px){.drift-page{padding-inline:max(16px,env(safe-area-inset-left))}.drift-nav{gap:6px}.camp-label{font-size:8px}.camp-label svg{display:none}.account-nav{gap:5px}.connection span{max-width:90px}.account-button{font-size:10px!important;padding-left:8px}.drift-hero{padding:26px 0}.camp-companion{width:85px;height:85px}.hero-copy{font-size:12px}.hero-tags span{font-size:9px;padding:3px 7px}.hub-tabs{width:100%}.hub-tabs button{flex:1;gap:6px;padding:9px 6px;font-size:11px}.hub-tabs svg{width:16px;height:16px}.camp-card{padding:19px}.camp-layout.has-lobby{grid-template-columns:1fr}.section-heading{gap:10px;margin-bottom:18px}h2{font-size:24px}.section-heading .eyebrow{font-size:7px}.section-emblem{width:32px;height:32px}.creation-rules,.lobby-rules{gap:10px}.choice-row{grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.choice-row button:last-child{grid-column:span 2}.open-rooms>li{gap:7px}.room-icon{display:none}.open-rooms .subtle-button{font-size:10px!important;padding:8px}.join-form>div{gap:7px}.join-form .subtle-button{padding-inline:11px}.players{gap:8px}.trainer-seat{padding:9px;gap:6px}.trainer-token{width:24px}.seat-info strong{font-size:11px}.invite{padding:13px;gap:8px}.invite strong{font-size:22px;letter-spacing:.1em}.invite small{font-size:7px}.invite button{padding-inline:9px}.profile-stats{gap:7px}.profile-stats dt{font-size:9px}.profile-stats svg{display:none}.catalogue-controls{grid-template-columns:1fr}.drift-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.drift-entry{padding:12px}.entry-heading{gap:6px}.drift-glyph{padding:5px}.entry-value{flex-wrap:wrap}.history-report{padding:10px}.solo-adventure{padding:15px}.drift-footer{font-size:8px}.drift-footer span:last-child{max-width:50%;text-align:right}}
@media(max-width:360px){.camp-companion{display:none}.drift-hero{gap:0}.camp-card{padding:16px}.section-emblem{display:none}.rooms-empty strong{font-size:22px}.players{grid-template-columns:1fr}.drift-grid{grid-template-columns:1fr}.creation-rules{grid-template-columns:1fr}.profile-stats dd{font-size:22px}.account-nav{font-size:10px}.camp-label{font-size:7px}}
</style>

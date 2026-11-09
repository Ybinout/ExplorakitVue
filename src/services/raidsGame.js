const activePhase = s => s?.phase === 'active';
export default {
  data: () => ({
    raidBosses: [],
    raidWorld: null,
    raidState: null,
    raidPreview: null,
    raidInventory: [],
    raidBusy: false,
    raidError: '',
    raidNotice: '',
    raidPanelVisible: false,
    raidTutorial: false,
    raidInvitation: null,raidInviteExpanded:false,
    raidInviteClock: Date.now()
  }),
  beforeDestroy() {
    this._unbindRaids?.();
  },
  computed: {
    raidCombatActive() {
      return activePhase(this.raidState) && !!this.raidState.combat || !!this.raidState?.combat && this.battle && ['won', 'lost'].includes(this.raidState.phase);
    },
    raidInvitationSeconds() {
      return Math.max(0, Math.ceil(((this.raidInvitation?.expiresAt || 0) - this.raidInviteClock) / 1000));
    }
  },
  methods: {
    bindRaidSocket() {
      this._unbindRaids?.();
      if (this.isDrift) return;
      const socket = this.socket,
        bindings = [];
      const on = (name, fn) => {
        socket.on(name, fn);
        bindings.push([name, fn]);
      };
      on('raid:world', world => {
        this.raidWorld = {
          ...world,
          offset: world.serverNow - Date.now()
        };
        this.drawPlayers();
      });
      on('raid:open', payload => {
        this.releaseAllMovementKeys();
        this.closeLegacyPanels();
        this.raidPreview = payload.preview;
        this.raidTutorial = payload.tutorial;
        this.raidPanelVisible = true;
        this.raidError = '';
      });
      on('raid:state', state => {
        const was = !!this.raidState?.combat && this.battle,
          first = state?.id !== this.raidState?.id;
        this.raidState = state;
        this.raidError = '';
        if (!state) {
          this.raidPanelVisible = false;
          this.raidPreview = null;
          this.raidInventory = [];
          if (was) {
            this.battle = false;
            this.$refs.battleOverlay?.stopMusic();
            this.syncWorldMusic();
            this.restoreWorldView();
          }
          return;
        }
        const me = state.members.find(m => m.id === Number(this.currentUserId));
        if (me?.reserved) {
          this.raidNotice = 'Ta place est réservée. Tu rejoindras le campement après ton combat.';
          return;
        }
        this.releaseAllMovementKeys();
        if (activePhase(state)) {
          this.raidPanelVisible = false;
          const entering = !this.battle;
          this.battle = true;
          if (entering) {
            this.closeLegacyPanels();
            this.syncWorldMusic();
            this.$nextTick(() => this.$refs.battleOverlay?.startMusic('colosseum'));
          }
        } else if (state.phase === 'lobby') {
          if (first || !this.raidInventory.length) {
            this.raidPanelVisible = true;
            void this.raidCommand('inventory');
          }
          this.raidTutorial = state.needsTutorial;
        } else if (!was) this.raidPanelVisible = true;
      });
      on('raid:invitation', inv => {
        this.raidInvitation = inv;this.raidInviteExpanded=!this.battle;
        this.raidInviteClock = Date.now();
        if (inv) this._feedbackAudio?.play('notification');
      });
      const timer = setInterval(() => {
        this.raidInviteClock = Date.now();
        if (this.raidInvitation && this.raidInvitation.expiresAt < this.raidInviteClock) this.raidInvitation = null;
      }, 500);
      this._unbindRaids = () => {
        clearInterval(timer);
        for (const [n, fn] of bindings) socket.off(n, fn);
      };
    },
    async raidCommand(name, data = {}) {
      if (this.raidBusy) return;
      if (!this.socket?.connected) {
        this.raidError = 'Connexion interrompue. Le raid reste sauvegardé.';
        return;
      }
      this.raidBusy = true;
      this.raidError = '';
      this.raidNotice = '';
      try {
        const r = await new Promise((resolve, reject) => this.socket.timeout(12000).emit('raid:' + name, data, (e, r) => e ? reject(Error('La réponse tarde. Reconnecte-toi pour retrouver ton raid sauvegardé.')) : resolve(r)));
        if (!r?.success) throw Error(r?.message || 'Cette action est indisponible.');
        if (r.bosses) this.raidBosses=r.bosses;
        if(name==='training')this.clubPanel=null;
        if (r.pokemons) this.raidInventory = r.pokemons;
        if (name === 'tutorial') this.raidTutorial = false;
        if (name === 'invite') this.raidNotice = 'Invitation envoyée. Ton ami a 60 secondes pour répondre.';
        if (name === 'invitation') {
          this.raidInvitation = null;
          if (data.accept && !this.raidCombatActive && this.battle) this.showInteractionNotice('Place réservée : tu rejoindras le raid après ton combat.');
        }
      } catch (e) {
        this.raidError = e.message;
        if (name === 'invitation') this.showInteractionNotice(e.message, 6500);
      } finally {
        this.raidBusy = false;
        if (name !== 'inventory' && this.raidState?.phase === 'lobby' && !this.raidInventory.length && !this.raidState.members.find(m => m.id === Number(this.currentUserId))?.reserved) this.$nextTick(() => this.raidCommand('inventory'));
      }
    },
    showRaidResults() {
      this.battle = false;
      this.raidPanelVisible = true;
      this.$refs.battleOverlay?.stopMusic();
      this.syncWorldMusic();
    },
    closeRaidPreview() {
      this.raidPanelVisible = false;
      this.raidPreview = null;
      this.raidError = '';
    },
    raidImpact(data) {
      this._feedbackAudio?.impact(data);
    }
  }
};

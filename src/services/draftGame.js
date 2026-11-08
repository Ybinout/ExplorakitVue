export default {
  data: () => ({
    draftState: null,
    draftCatalog: {},
    draftOpen: false,
    draftBusy: false,
    draftError: '',
    draftFriends: [],
    draftInvitation: null,
  }),
  watch: {
    socket: {
      immediate: true,
      handler(socket) {
        this._unbindDraft?.();
        if (!socket) return;
        const state = (s) => this.applyDraftState(s),
          open = (p) => {
            this.releaseAllMovementKeys();
            this.closeLegacyPanels();
            this.closeInfoPanel();
            this.isMenuOpen = false;
            if (p?.id) this.applyDraftState(p);
            else {
              this.draftState = null;
              this.draftCatalog = p || {};
            }
            this.draftOpen = true;
            this.draftError = '';
          },
          invitation = (i) => {
            this.draftInvitation = i;
            this._feedbackAudio?.play('notification');
          },
          wallet = (p) => {
            if (Number.isFinite(p?.balance))
              this.$set(this.progressionState, 'money', p.balance);
          };
        socket.on('draft:state', state);
        socket.on('draft:open', open);
        socket.on('draft:invitation', invitation);
        socket.on('draft:wallet', wallet);
        this._unbindDraft = () => {
          socket.off('draft:state', state);
          socket.off('draft:open', open);
          socket.off('draft:invitation', invitation);
          socket.off('draft:wallet', wallet);
        };
      },
    },
  },
  beforeDestroy() {
    this._unbindDraft?.();
  },
  methods: {
    applyDraftState(s) {
      if (!s) {
        this.draftState = null;
        return;
      }
      if (this.draftState?.id === s.id && s.version < this.draftState.version)
        return;
      this.draftState = s;
    },
    async draftCommand(name, data = {}) {
      if (this.draftBusy && name !== 'action') return;
      const socket = this.socket;
      if (!socket?.connected) {
        this.draftError = 'Connexion interrompue. La partie est sauvegardée.';
        return;
      }
      this.draftBusy = true;
      this.draftError = '';
      let recover = false;
      try {
        const r = await new Promise((resolve, reject) =>
          socket
            .timeout(15000)
            .emit('draft:' + name, data, (e, r) =>
              e
                ? reject(
                    Error(
                      'La réponse tarde. Rouvre la table pour retrouver la partie.'
                    )
                  )
                : resolve(r)
            )
        );
        if (!r?.success)
          throw Error(r?.message || 'Cette action est indisponible.');
        if (socket !== this.socket) return;
        if (Object.hasOwn(r, 'state')) this.applyDraftState(r.state);
        if (r.friends) this.draftFriends = r.friends;
        if (r.invited)
          this.draftError = 'Invitation envoyée à ' + r.invited + '.';
        if (name === 'leave') {
          this.draftState = null;
          this.draftOpen = false;
          if (this.battle) {
            this.battle = false;
            this.$refs.battleOverlay?.stopMusic();
            this.restoreWorldView();
            this.syncWorldMusic();
          }
        }
        if (['create', 'join', 'accept'].includes(name)) {
          this.draftOpen = true;
          this.$nextTick(() => this.loadDraftFriends());
        }
        if (name === 'accept') this.draftInvitation = null;
      } catch (e) {
        this.draftError = e.message;
        if (name === 'action' && this.battle) recover = true;
      } finally {
        this.draftBusy = false;
      }
      if (recover) await this.draftCommand('refresh', { battleSync: true });
    },
    async loadDraftFriends() {
      await this.draftCommand('friends');
    },
    resumeDraft() {
      this.releaseAllMovementKeys();
      this.closeLegacyPanels();
      this.closeInfoPanel();
      this.draftOpen = true;
    },
    acceptDraftInvitation() {
      if (!this.draftInvitation) return;
      this.draftOpen = true;
      this.draftCommand('accept', {
        id: this.draftInvitation.tableId,
        invitationId: this.draftInvitation.id,
      });
    },
    finishDraft() {
      this.draftOpen = false;
      this.draftState = null;
    },
  },
};

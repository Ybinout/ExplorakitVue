export default {
  data: () => ({
    slotsOpen: false,
    slotsMachine: 1,
    slotsState: null,
    slotsBusy: false,
    slotsError: '',
  }),
  beforeDestroy() {
    this._unbindSlots?.();
  },
  methods: {
    applySlotsState(state) {
      if (
        !state ||
        (this.slotsState && this.slotsState.version > state.version)
      )
        return;
      this.slotsState = { ...state, offset: state.serverNow - Date.now() };
    },
    bindSlotsSocket() {
      this._unbindSlots?.();
      const handlers = [];
      const on = (n, f) => {
        handlers.push([n, f]);
        this.socket.on(n, f);
      };
      on('disconnect', () => {
        this._slotsEpoch = (this._slotsEpoch || 0) + 1;
        this.slotsBusy = false;
      });
      on('connect', () => {
        this._slotsEpoch = (this._slotsEpoch || 0) + 1;
        this.slotsBusy = false;
        if (this.slotsOpen || this.slotsState?.spin?.phase === 'spinning')
          this.slotsCommand('refresh');
      });
      on('slots:state', (s) => this.applySlotsState(s));
      on('slots:open', (p) => {
        this.applySlotsState(p.state);
        this.slotsMachine =
          p.state?.spin?.phase === 'spinning'
            ? p.state.spin.machine
            : p.machine;
        this.releaseAllMovementKeys();
        this.closeLegacyPanels();
        this.closeInfoPanel();
        this.slotsOpen = true;
        this.slotsError = '';
      });
      this._unbindSlots = () =>
        handlers.forEach(([n, f]) => this.socket.off(n, f));
    },
    async slotsCommand(name, data = {}) {
      if (this.slotsBusy || !this.socket?.connected) return;
      const socket = this.socket,
        epoch = (this._slotsEpoch = (this._slotsEpoch || 0) + 1),
        current = () =>
          this.socket === socket &&
          socket.connected &&
          this._slotsEpoch === epoch;
      this.slotsBusy = true;
      this.slotsError = '';
      try {
        const r = await new Promise((resolve, reject) =>
          this.socket
            .timeout(12000)
            .emit('slots:' + name, data, (e, r) =>
              e
                ? reject(
                    Error(
                      'Connexion interrompue. Actualise pour retrouver ton tirage enregistré.'
                    )
                  )
                : resolve(r)
            )
        );
        if (!current()) return;
        if (!r?.success) throw Error(r?.message || 'La machine ne répond pas.');
        this.applySlotsState(r.state);
        if (r.state.balance !== undefined)
          this.$set(this.progressionState, 'money', r.state.balance);
        return r;
      } catch (e) {
        if (current()) this.slotsError = e.message;
      } finally {
        if (current()) this.slotsBusy = false;
      }
    },
  },
};

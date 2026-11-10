import {
  isHousingMap,
  loadHousingArt,
  housingRenderPlan,
  housingModel,
  furnitureBounds,
} from './housingArt';
export default {
  data: () => ({
    housingState: null,
    housingPanel: null,
    housingBusy: false,
    housingError: '',
    housingInvitation: null,
    housingNotice: '',
    housingArt: null,
    housingGrowthClock: 0,
  }),
  computed: {
    housingActive() {
      return isHousingMap(this.map) && !!this.housingState;
    },
    housingFloor() {
      return this.housingState?.floors[this.housingState.floor];
    },
    housingPlan() {
      this.housingGrowthClock;
      return housingRenderPlan(this.housingFloor,this.housingState?.crops,Date.now()+(this._housingClockOffset||0));
    },
  },
  beforeDestroy() {
    this._unbindHousing?.();
    clearTimeout(this._housingGrowthTimer);
  },
  methods: {
    scheduleHousingGrowth(){
      clearTimeout(this._housingGrowthTimer);
      const now=Date.now()+(this._housingClockOffset||0),dates=(this.housingState?.crops||[]).flatMap(c=>[c.plantedAt+300000,c.plantedAt+1200000]).filter(d=>d>now);
      if(dates.length)this._housingGrowthTimer=setTimeout(()=>{this.housingGrowthClock++;this.drawPlayers();this.scheduleHousingGrowth();},Math.min(...dates)-now+30);
    },
    housingItemBottom(p) {
      return furnitureBounds(p).bottom;
    },
    bindHousingSocket() {
      this._unbindHousing?.();
      const handlers = [];
      const on = (name, fn) => {
        this.socket.on(name, fn);
        handlers.push([name, fn]);
      };
      on('housing:state', (state) => {
        this.housingState = state;
        this._housingClockOffset=(state?.serverNow||Date.now())-Date.now();
        this.scheduleHousingGrowth();
        this.housingError = '';
        if (!state) this.housingPanel = null;
        else {
          loadHousingArt()
            .then((art) => {
              this.housingArt = art;
              this.drawPlayers();
            })
            .catch(() =>
              this.showInteractionNotice(
                'Les meubles n’ont pas pu être chargés. Rouvre la maison.'
              )
            );
        }
        this.drawPlayers();
      });
      on('housing:panel', (payload) => {
        this.releaseAllMovementKeys();
        this.closeLegacyPanels();
        this.housingPanel = payload;
        this.housingError = '';
      });
      on('housing:invitation', (inv) => {
        this.housingInvitation = inv;
        clearTimeout(this._housingInviteTimer);
        if (inv) {
          this._feedbackAudio?.play('notification');
          this._housingInviteTimer = setTimeout(() => {
            if (this.housingInvitation?.id === inv.id)
              this.housingInvitation = null;
          }, Math.max(0, inv.expiresAt - Date.now()));
        }
      });
      this._unbindHousing = () => {
        clearTimeout(this._housingInviteTimer);
        for (const [n, f] of handlers) this.socket.off(n, f);
      };
    },
    async housingCommand(name, data = {}) {
      if (this.housingBusy) return;
      this.housingBusy = true;
      this.housingError = '';
      this.housingNotice = '';
      try {
        const r = await new Promise((resolve, reject) =>
          this.socket
            .timeout(15000)
            .emit('housing:' + name, data, (e, r) =>
              e
                ? reject(
                    Error(
                      'La réponse tarde. Réessaie cette même confirmation pour vérifier son enregistrement.'
                    )
                  )
                : resolve(r)
            )
        );
        if (!r?.success) {
          const error=Error(r?.message || 'Cette action n’est pas disponible.');
          error.confirmationRejected=true;error.retryable=!!r?.retryable;throw error;
        }
        if (r.money !== undefined)
          this.$set(this.progressionState, 'money', r.money);
        if (r.kind === 'sold') {
          this.closeHousingPanel();
          this.showInteractionNotice(r.message, 6500);
        } else if (r.kind) {
          this.housingPanel = { ...this.housingPanel, ...r };
          if (name === 'purchase' || name === 'save' || name === 'floor')
            this.housingNotice =
              name === 'save'
                ? 'Aménagement sauvegardé.'
                : name === 'floor'
                ? 'Ton nouvel étage est prêt.'
                : 'Bienvenue chez toi !';
        }
        if (name === 'invitation') this.housingInvitation = null;
        if (r.message) this.housingNotice = r.message;
        return r;
      } catch (e) {
        this.housingError = e.message;
        if (!this.housingPanel) this.showInteractionNotice(e.message, 6500);
        if(['garden','plant','plantMany','plantFavorite','harvest','harvestAll','mutate','favorite'].includes(name))return{success:false,retryable:!e.confirmationRejected||e.retryable};
      } finally {
        this.housingBusy = false;
      }
    },
    openHousingManage() {
      this.releaseAllMovementKeys();
      this.closeLegacyPanels();
      return this.housingCommand('open');
    },
    openHousingShop() {
      this.closeShop();
      this.releaseAllMovementKeys();
      return this.housingCommand('shop');
    },
    closeHousingPanel() {
      this.housingPanel = null;
      this.housingError = '';
      this.housingNotice = '';
    },
    housingBackgroundKey(map) {
      return isHousingMap(map) && this.housingState?.floor > 0
        ? map + '_upper'
        : map;
    },
    housingLabel() {
      const s = this.housingState;
      return s
        ? (s.isOwner ? 'Chez toi' : 'Chez ' + s.ownerName) +
            ' · ' +
            (s.floor === 0
              ? 'Rez-de-chaussée'
              : s.floor === 1
              ? '1er étage'
              : '2e étage')
        : housingModel(this.map.slice(8))?.name || 'Maison';
    },
  },
};

const terminal=phase=>['completed','cancelled'].includes(phase);
export default {
  data:()=>({tradeState:null,tradeBusy:false,tradeError:'',tradeEngagedId:null,tradeConnected:false}),
  computed:{incomingTrade(){return this.tradeState?.phase==='invited'&&this.tradeState.requestedBy!==Number(this.currentUserId)?this.tradeState:null;},tradeModalVisible(){return !!this.tradeState&&this.tradeEngagedId===this.tradeState.id;}},
  beforeDestroy(){this._unbindTrade?.();},
  methods:{
    tradeStorageKey(){return `riftmon.trade.${this.currentUserId}`;},
    rememberTrade(id){try{if(id)localStorage.setItem(this.tradeStorageKey(),id);else localStorage.removeItem(this.tradeStorageKey());}catch{/* Recovery still works while the current session is alive. */}},
    applyTradeState(state,silent=false){
      this._socialNotifications?.trade(state,silent);
      this.tradeState=state;
      if(!state)return;
      const engaged=this.tradeEngagedId===state.id||state.requestedBy===Number(this.currentUserId)||!['invited','cancelled'].includes(state.phase);
      if(engaged){
        if(this.tradeEngagedId!==state.id){this.releaseAllMovementKeys();this.closeLegacyPanels();this.closeInfoPanel();this.closeInteractionChoice();this.closeShop();this.isMenuOpen=false;}
        this.tradeEngagedId=state.id;this.rememberTrade(state.id);
      }
    },
    bindTradeSocket(){
      this._unbindTrade?.();const socket=this.socket;
      const state=value=>this.applyTradeState(value,!this._tradeNotificationsReady);
      const connected=async()=>{const epoch=this._tradeNotificationEpoch=(this._tradeNotificationEpoch||0)+1;this._tradeNotificationsReady=false;this.tradeConnected=true;let previous=null;try{previous=localStorage.getItem(this.tradeStorageKey());}catch{/* Local storage can be unavailable in private browsing. */}if(previous)this.tradeEngagedId=previous;try{const r=await this.tradeCommand('refresh',previous?{id:previous}:{});if(previous&&!r.state){this.rememberTrade(null);this.showInteractionNotice('L’échange a été interrompu. Aucun transfert enregistré.');}}catch{/* A refresh can be retried from the exchange window. */}finally{if(socket.connected&&epoch===this._tradeNotificationEpoch)this._tradeNotificationsReady=true;}};
      const disconnected=()=>{this._tradeNotificationEpoch=(this._tradeNotificationEpoch||0)+1;this.tradeConnected=false;this._tradeNotificationsReady=false;};
      socket.on('trade:state',state);socket.on('connect',connected);socket.on('disconnect',disconnected);this.tradeConnected=socket.connected;
      this._unbindTrade=()=>{this._tradeNotificationEpoch=(this._tradeNotificationEpoch||0)+1;socket.off('trade:state',state);socket.off('connect',connected);socket.off('disconnect',disconnected);};
      if(socket.connected)connected();
    },
    tradeCommand(action,data={}){
      if(!this.socket?.connected)return Promise.reject(Error('Reconnecte-toi pour poursuivre l’échange.'));
      return new Promise((resolve,reject)=>this.socket.timeout(12000).emit('trade:'+action,data,(error,result)=>{
        if(error)return reject(Error('La réponse tarde. Vérifie l’état de l’échange avant de réessayer.'));
        if(Object.hasOwn(result||{},'state')&&(!data.id||!this.tradeState||this.tradeState.id===data.id||this.tradeState.id===result.state?.id))this.applyTradeState(result.state,action==='refresh');
        if(!result?.success)return reject(Error(result?.message||'Échange indisponible.'));
        resolve(result);
      }));
    },
    async requestFriendTrade(targetId){if(this.tradeBusy)throw Error('Une action est déjà en cours.');this.tradeBusy=true;this.tradeError='';try{return await this.tradeCommand('request',{targetId});}finally{this.tradeBusy=false;}},
    async answerFriendTrade(accept){const state=this.tradeState;if(!state||this.tradeBusy)return;this.tradeBusy=true;this.tradeError='';try{const r=await this.tradeCommand('answer',{id:state.id,accept});if(!accept){await this.tradeCommand('close',{id:state.id});this.tradeEngagedId=null;this.rememberTrade(null);}return r;}catch(e){this.tradeError=e.message;}finally{this.tradeBusy=false;}},
    async runTradeAction(action,offer){
      if(!this.tradeState||this.tradeBusy)return;this.tradeBusy=true;this.tradeError='';
      const s=this.tradeState,data={id:s.id,revision:s.revision,digest:s.digest,...(offer?{offer}:{})};
      try{const r=await this.tradeCommand(action,data);if(action==='close'){this.tradeEngagedId=null;this.rememberTrade(null);}return r;}catch(e){this.tradeError=e.message;}finally{this.tradeBusy=false;}
    },
    async cancelFriendTrade(){if(this.tradeBusy||!this.tradeState)return;if(terminal(this.tradeState.phase)){await this.runTradeAction('close');return;}const r=await this.runTradeAction('cancel');if(r?.state?.phase==='cancelled')await this.runTradeAction('close');}
  }
};

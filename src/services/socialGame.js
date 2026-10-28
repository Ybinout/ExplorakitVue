const emptyState=()=>({accepted:[],incoming:[],outgoing:[],group:null,groupInvites:[]});
export default {
  data:()=>({friendsOpen:false,friendsTarget:null,socialConnected:false,socialState:emptyState(),socialMessage:null,socialError:'',socialActionBusy:false}),
  computed:{
    socialAlertCount(){return (this.incomingTrade?1:0)+this.socialState.incoming.length+this.socialState.groupInvites.length+this.socialState.accepted.reduce((n,p)=>n+(p.unread||0),0);},
    nearbySocialTrainer(){
      if(this.battle||this.mapLoading||this.textImageSequence.length||this.movementSuspended||!this.socket?.id)return null;
      const self=this.players[this.socket.id];if(!self)return null;
      return Object.values(this.players).filter(p=>p.id!==self.id&&p.userId&&p.userId!==self.userId&&p.currentmap===self.currentmap&&Math.abs(p.x-self.x)+Math.abs(p.y-self.y)<=80).sort((a,b)=>(Math.abs(a.x-self.x)+Math.abs(a.y-self.y))-(Math.abs(b.x-self.x)+Math.abs(b.y-self.y)))[0]||null;
    },
    interactionFriend(){const id=this.players[this.interactionChoice.targetId]?.userId;return [...this.socialState.accepted,...this.socialState.incoming,...this.socialState.outgoing].find(p=>p.id===id)||null;}
  },
  beforeDestroy(){this._unbindSocial?.();},
  methods:{
    bindSocialSocket(){
      this._unbindSocial?.();const socket=this.socket;
      const state=data=>{this.socialState=data;this.socialError='';};
      const message=data=>{this.socialMessage={...data,receivedAt:Date.now()};};
      const connected=()=>{this.socialConnected=true;};
      const disconnected=()=>{this.socialConnected=false;this.socialState={...this.socialState,accepted:this.socialState.accepted.map(p=>({...p,online:false})),group:this.socialState.group?{...this.socialState.group,members:this.socialState.group.members.map(p=>({...p,online:false,location:null}))}:null};};
      const error=data=>{this.socialError=data.message;};
      socket.on('social:state',state);socket.on('social:message',message);socket.on('social:error',error);socket.on('connect',connected);socket.on('disconnect',disconnected);this.socialConnected=socket.connected;
      this._unbindSocial=()=>{for(const[event,fn]of [['social:state',state],['social:message',message],['social:error',error],['connect',connected],['disconnect',disconnected]])socket.off(event,fn);};
    },
    socialCommand(event,data={}){
      if(!this.socket?.connected)return Promise.reject(Error('Reconnecte-toi pour utiliser le carnet.'));
      return new Promise((resolve,reject)=>this.socket.timeout(10000).emit(event,data,(error,result)=>{
        if(error)return reject(Error('Le carnet ne répond pas. Réessaie dans un instant.'));
        if(!result?.success)return reject(Error(result?.message||'Action indisponible.'));
        if(result.state)this.socialState=result.state;resolve(result);
      }));
    },
    async openFriends(target=null){
      this.releaseAllMovementKeys();this.closeLegacyPanels();this.closeInfoPanel();this.closeInteractionChoice();this.pc.visible=false;this.heldPickerUuid=null;this.isMenuOpen=false;this.friendsTarget=target;this.friendsOpen=true;
      try{await this.socialCommand('social:refresh');}catch(e){this.socialError=e.message;}
    },
    async addInteractionFriend(){
      const targetId=this.players[this.interactionChoice.targetId]?.userId;if(!targetId||this.socialActionBusy)return;
      this.socialActionBusy=true;
      try{const incoming=this.interactionFriend?.relationship==='incoming';const r=await this.socialCommand('social:friend',{targetId,action:incoming?'accept':'request'});this.showInteractionNotice(r.relationship==='friends'?'Vous êtes maintenant amis.':'Demande d’ami envoyée.');}catch(e){this.showInteractionNotice(e.message);}finally{this.socialActionBusy=false;}
    },
    openNearbySocial(){const p=this.nearbySocialTrainer;if(p)this.openFriends({id:p.userId,username:p.username||'Dresseur'});}
  }
};

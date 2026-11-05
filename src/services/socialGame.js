import {SocialNotifications} from './socialNotifications.js';
const emptyState=()=>({accepted:[],incoming:[],outgoing:[],self:null});
export default {
  data:()=>({friendsOpen:false,friendsTarget:null,socialConnected:false,onlinePlayerCount:null,socialPresenceRevision:0,socialState:emptyState(),socialMessage:null,socialError:'',socialActionBusy:false,socialReading:null,socialDrafts:{},socialConversations:{},pendingBattleConversation:null,battleChatOpen:false,battleChatTarget:null}),
  watch:{
    battle(value,previous){if(!value&&previous){const friend=this.socialState.accepted.find(p=>String(p.id)===String(this.battleChatTarget));if(this.battleChatOpen&&this.socialConnected&&friend)this.pendingBattleConversation={id:friend.id};this.battleChatOpen=false;}},
    canResumeBattleConversation(ready){if(ready)this.resumeBattleConversation();}
  },
  computed:{
    canResumeBattleConversation(){return Boolean(this.pendingBattleConversation&&!this.battle&&!this.battleResult&&!this.pendingBattleResult&&!this.textImageSequence?.length&&!this.flight&&!this.evolutionVisible&&!this.learningVisible&&!this.tradeModalVisible&&!this.mirrorScene&&!this.lucieDeparture&&!this.openingScene&&!this.pendingRoomEntry);},
    socialFriendById(){return Object.fromEntries(this.socialState.accepted.map(p=>[p.id,p]));},
    socialAlertCount(){return (this.incomingTrade?1:0)+this.socialState.incoming.length+this.socialState.accepted.reduce((n,p)=>n+(Number(p.unread)||0),0);},
    onlineCountLabel(){const count=this.onlinePlayerCount;if(count===null)return this.preferences.language==='en'?'Online player count unavailable while connecting':'Nombre de joueurs indisponible pendant la connexion';return this.preferences.language==='en'?`${count} player${count===1?'':'s'} online, all modes, including you`:`${count} dresseur${count===1?'':'s'} en ligne, tous modes, toi compris`;},
    nearbySocialTrainer(){
      if(this.battle||this.mapLoading||this.textImageSequence.length||this.movementSuspended||!this.socket?.id)return null;
      const self=this.players[this.socket.id];if(!self)return null;
      return Object.values(this.players).filter(p=>p.id!==self.id&&p.userId&&p.userId!==self.userId&&p.currentmap===self.currentmap&&Math.abs(p.x-self.x)+Math.abs(p.y-self.y)<=80).sort((a,b)=>(Math.abs(a.x-self.x)+Math.abs(a.y-self.y))-(Math.abs(b.x-self.x)+Math.abs(b.y-self.y)))[0]||null;
    },
    interactionFriend(){const id=this.players[this.interactionChoice.targetId]?.userId;return [...this.socialState.accepted,...this.socialState.incoming,...this.socialState.outgoing].find(p=>p.id===id)||null;}
  },
  beforeDestroy(){this._unbindSocial?.();},
  methods:{
    rememberSocialConversation(value){this.$set(this.socialConversations,value.id,value);},
    resumeBattleConversation(){const pending=this.pendingBattleConversation;this.pendingBattleConversation=null;const friend=this.socialState.accepted.find(p=>p.id===pending?.id);if(friend)this.$nextTick(()=>this.openFriends(friend));},
    async flyToFriend(person){this.friendsOpen=false;await this.flyToTown(person.location?.nodeId||this.map,{event:'flyToFriend',data:{targetId:person.id},onError:e=>{this.friendsTarget=person;this.friendsOpen=true;this.socialError=e.message;}});},
    socialReadingContext(){return (this.friendsOpen||this.battle&&this.battleChatOpen)&&!document.hidden?this.socialReading:null;},
    setSocialReading(value){this.socialReading=value;},
    rememberSocialDraft({id,text}){this.$set(this.socialDrafts,id,text);},
    applySocialState(data){this._socialNotifications?.snapshot(data);this.socialState=data;this.socialError='';},
    bindSocialSocket(){
      this._unbindSocial?.();const socket=this.socket;
      this.socialReading=null;
      this._socialNotifications=new SocialNotifications({userId:()=>this.currentUserId,reading:()=>this.socialReadingContext(),
        notify:()=>{if(this.socialConnected&&!document.hidden)this._feedbackAudio?.play('notification');}});
      const state=data=>this.applySocialState(data);
      const message=data=>{this._socialNotifications.message(data);this.socialMessage={...data,receivedAt:Date.now()};};
      const presence=data=>{if(Number.isSafeInteger(data?.count)&&data.count>=0)this.onlinePlayerCount=data.count;};
      const directory=data=>{if(Number.isSafeInteger(data?.revision)&&data.revision>=0)this.socialPresenceRevision=data.revision;};
      const connected=()=>{this.socialConnected=true;this.onlinePlayerCount=null;};
      const disconnected=()=>{this._socialNotifications.reset();this.socialConnected=false;this.onlinePlayerCount=null;this.socialState={...this.socialState,accepted:this.socialState.accepted.map(p=>({...p,online:false,afk:false,location:null})),self:null};};
      const error=data=>{this.socialError=data.message;};
      socket.on('social:state',state);socket.on('social:message',message);socket.on('social:error',error);socket.on('presence:count',presence);socket.on('social:presenceChanged',directory);socket.on('connect',connected);socket.on('disconnect',disconnected);this.socialConnected=socket.connected;
      let lastActivity=0,activityTimer=null;
      const record=event=>{if(!socket.connected||document.hidden||event.isTrusted===false)return;const send=()=>{activityTimer=null;lastActivity=Date.now();if(socket.connected)socket.emit('presence:activity');};if(Date.now()-lastActivity>=1000)send();else if(!activityTimer)activityTimer=setTimeout(send,1000-(Date.now()-lastActivity));};
      for(const event of ['pointerdown','pointermove','keydown','wheel'])document.addEventListener(event,record,{passive:true});
      const viewport=()=>{const v=window.visualViewport;if(this.$el){this.$el.classList.toggle('social-keyboard-open',Boolean(v&&v.height<innerHeight*.8));this.$el.style.setProperty('--social-viewport-height',(v?.height||innerHeight)+'px');this.$el.style.setProperty('--social-viewport-top',(v?.offsetTop||0)+'px');}};
      window.visualViewport?.addEventListener('resize',viewport);window.visualViewport?.addEventListener('scroll',viewport);viewport();
      this._unbindSocial=()=>{this.$el?.classList.remove('social-keyboard-open');window.visualViewport?.removeEventListener('resize',viewport);window.visualViewport?.removeEventListener('scroll',viewport);this._friendTags?.clear();clearTimeout(activityTimer);for(const event of ['pointerdown','pointermove','keydown','wheel'])document.removeEventListener(event,record);for(const[event,fn]of [['social:state',state],['social:message',message],['social:error',error],['presence:count',presence],['social:presenceChanged',directory],['connect',connected],['disconnect',disconnected]])socket.off(event,fn);this._socialNotifications?.dispose();this._socialNotifications=null;};
    },
    socialCommand(event,data={}){
      if(!this.socket?.connected)return Promise.reject(Error('Reconnecte-toi pour utiliser le carnet.'));
      return new Promise((resolve,reject)=>this.socket.timeout(10000).emit(event,data,(error,result)=>{
        if(error)return reject(Error('Le carnet ne répond pas. Réessaie dans un instant.'));
        if(!result?.success)return reject(Error(result?.message||'Action indisponible.'));
        if(result.state)this.applySocialState(result.state);resolve(result);
      }));
    },
    async openFriends(target=null){
      this.pendingBattleConversation=null;
      if(this.battle){this.friendsOpen=false;this.battleChatTarget=target?.id||null;this.battleChatOpen=true;return;}
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

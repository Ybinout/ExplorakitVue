function newRequestId(){if(window.crypto.randomUUID)return window.crypto.randomUUID();const a=window.crypto.getRandomValues(new Uint8Array(16));a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;const h=Array.from(a,n=>n.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
export default{
 data:()=>({magicPanel:null,magicBusy:false,magicError:'',magicResult:null,magicNotice:'',speedModuleState:{owned:false,active:false},talentPanel:null,talentBusy:false,talentError:'',talentNotice:''}),
 computed:{movementInputMs(){return this.speedModuleState.active?120:150;}},
 beforeDestroy(){this._unbindMagic?.();},
 methods:{
  bindMagicIslandSocket(){
   this._unbindMagic?.();
   const panel=payload=>{if(payload){this.releaseAllMovementKeys();this.closeLegacyPanels();}this.magicPanel=payload;this.magicError='';this.magicNotice='';this.magicResult=null;};
   const speed=state=>{this.speedModuleState=state;if(this.players?.[this.socket?.id])this.$set(this.players[this.socket.id],'speedModuleActive',state.active);};
   const talents=state=>{this.releaseAllMovementKeys();this.closeLegacyPanels();this.isMenuOpen=false;this.talentPanel=state;this.talentError='';this.talentNotice='';};this.socket.on('talentTreePanel',talents);
   this.socket.on('magicIslandPanel',panel);this.socket.on('speedModuleState',speed);
   this._unbindMagic=()=>{this.socket.off('talentTreePanel',talents);this.socket.off('magicIslandPanel',panel);this.socket.off('speedModuleState',speed);};
  },
  async magicCommand(name,data={}){
   if(this.magicBusy)return;this.magicBusy=true;this.magicError='';this.magicNotice='';
   const signature=JSON.stringify({name,data});if(this._magicTicket?.signature!==signature)this._magicTicket={signature,requestId:newRequestId()};
   try{
    const r=await new Promise((resolve,reject)=>this.socket.timeout(15000).emit('magic:'+name,{...data,requestId:this._magicTicket.requestId},(e,r)=>e?reject(Error('La réponse tarde. Réessaie cette confirmation pour vérifier son enregistrement.')):resolve(r)));
    if(!r?.success)throw Error(r?.message||'Action indisponible.');this._magicTicket=null;
    if(r.state){if(this.magicPanel)this.$set(this.magicPanel,'state',r.state);if(r.state.speed)this.speedModuleState=r.state.speed;}
    this.magicResult=r.result||null;
    if(name==='craft')this.magicNotice=`${data.quantity} Ball${data.quantity>1?'s':''} fabriquée${data.quantity>1?'s':''}.`;
    if(name==='purchaseModule')this.magicNotice='Le module a rejoint ton sac, dans la poche Modules.';
    if(name==='rotom'){this.magicPanel=null;this.showInteractionNotice('Motisma a changé de forme !');}
    return r;
   }catch(e){this.magicError=e.message;if(!this.magicPanel)this.showInteractionNotice(e.message,6000);}
   finally{this.magicBusy=false;}
  },
  async talentCommand(name,data={}){
   if(this.talentBusy)return;this.talentBusy=true;this.talentError='';this.talentNotice='';
   const signature=JSON.stringify({name,data});if(this._talentTicket?.signature!==signature)this._talentTicket={signature,requestId:newRequestId()};
   try{const r=await new Promise((resolve,reject)=>this.socket.timeout(15000).emit('talents:'+name,{...data,requestId:this._talentTicket.requestId},(e,r)=>e?reject(Error('La réponse tarde. Réessaie la même confirmation.')):resolve(r)));
    if(!r?.success)throw Error(r?.message||'Action indisponible.');this._talentTicket=null;this.talentPanel=r.state;
    if(name!=='open')this.talentNotice=name==='refund'?'Points restitués. Les ressources dépensées ne sont pas rendues.':name==='purchase'?'Module acquis : tes 41 points sont disponibles.':'Talent activé.';
   }catch(e){this.talentError=e.message;if(!this.talentPanel)this.showInteractionNotice(e.message,6500);if(!e.message.includes('réponse tarde'))this._talentTicket=null;}
   finally{this.talentBusy=false;}
  },
  refreshMagicPanel(){this.magicResult=null;this.magicCommand('refresh');}
 }
};

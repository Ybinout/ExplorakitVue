import {QuestNotifications} from './questNotifications';
export default {
 data:()=>({journalReadBusy:false,journalReadError:'',questNoticeQueue:[]}),
 computed:{
  questAlertCount(){return this.isDrift?0:(this.progressionState?.journal?.entries||[]).filter(q=>q.status==='active'&&q.unread).length;},
  globalAlertCount(){return this.socialAlertCount+this.questAlertCount;},
  questCanNotify(){return !!this.socket?.connected&&!this.mapLoading&&!this.battle&&!this.battleResult&&!this.pendingBattleResult&&!this.textImageSequence?.length&&!this.flight&&!this.mirrorScene&&!this.lucieDeparture&&!this.openingScene&&!this.pendingRoomEntry&&!this.activeInfoPanel&&!this.shop?.visible&&!this.darkPanel&&!this.tournamentPanel&&!this.pc?.visible;}
 },
 watch:{
  'progressionState.journal':{immediate:true,handler(value){if(this.isDrift)return;this._questNotifications ||=new QuestNotifications();const fresh=this._questNotifications.snapshot(value);const unread=new Set((value?.entries||[]).filter(q=>q.unread).map(q=>q.key));this.questNoticeQueue=[...this.questNoticeQueue.filter(q=>unread.has(q.key)),...fresh.filter(q=>!this.questNoticeQueue.some(old=>old.key===q.key))];this.queueQuestNotice();}},
  questCanNotify(){this.queueQuestNotice();}
 },
 mounted(){this._questVisibility=()=>{if(!document.hidden)this.queueQuestNotice();};document.addEventListener('visibilitychange',this._questVisibility);},
 beforeDestroy(){clearTimeout(this._questNoticeTimer);document.removeEventListener('visibilitychange',this._questVisibility);},
 methods:{
  queueQuestNotice(){clearTimeout(this._questNoticeTimer);if(!this.questCanNotify||!this.questNoticeQueue.length)return;this._questNoticeTimer=setTimeout(()=>{if(!this.questCanNotify||document.hidden)return;const fresh=this.questNoticeQueue.splice(0);if(!fresh.length)return;this._feedbackAudio?.play('notification');const english=this.preferences.language==='en';this.showInteractionNotice((english?'New quest':'Nouvelle quête')+(fresh.length>1?'s':'')+' : '+fresh.slice(0,2).map(q=>q.title).join(' · ')+(fresh.length>2?'…':''),5000,'quest');},450);},
  async markJournalRead(keys){
   this._journalReadQueue ||=new Set();for(const key of keys||[])this._journalReadQueue.add(key);
   if(this.journalReadBusy||!this._journalReadQueue.size)return;
   this.journalReadBusy=true;this.journalReadError='';
   try{while(this._journalReadQueue.size){const batch=[...this._journalReadQueue];this._journalReadQueue.clear();if(!this.socket?.connected)throw Error('Connexion interrompue. Les nouvelles quêtes restent signalées.');const result=await new Promise((resolve,reject)=>this.socket.timeout(8000).emit('journal:read',{keys:batch},(error,response)=>error?reject(Error('Le serveur n’a pas confirmé la lecture. Réessaie.')):resolve(response)));if(!result?.success)throw Error(result?.message||'La lecture du journal n’a pas pu être sauvegardée.');}}
   catch(error){this.journalReadError=error.message;this._journalReadQueue.clear();}
   finally{this.journalReadBusy=false;}
  }
 }
};

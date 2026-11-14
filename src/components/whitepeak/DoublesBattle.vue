<template>
 <section ref="dialog" tabindex="-1" class="double-battle" role="dialog" aria-modal="true" aria-label="Combat Double" @keydown.stop="onKey" @keyup.stop data-double-battle>
  <header><span><small>MAISON DES COMBATS · DOUBLE</small><b>{{ frame.players[frame.side].name }} <i>contre</i> {{ frame.players[1-frame.side].name }}</b></span><strong>Tour {{ frame.turn }}</strong><button v-if="spectator" @click="$emit('close')">Quitter les tribunes</button><button v-else @click="askForfeit=true" aria-label="Abandonner le duel">⚑</button><slot name="social-toggle"/></header>
  <div ref="stage" class="double-stage" :class="{'move-camera-impact':!reduced&&fx?.camera&&fx?.stage==='impact'}">
   <battle-rain v-if="display?.weather==='raindance'" :animations-enabled="!reduced" environment="arena"/><battle-snow v-if="display?.weather==='hail' || display?.weather==='snowscape'" :animations-enabled="!reduced" environment="arena"/><battle-sandstorm v-if="display?.weather==='sandstorm'" :animations-enabled="!reduced" environment="arena"/>
   <div class="double-side-effects"><span v-for="(side,i) in display?.sideEffects||[]" :key="i"><b v-if="side.length">{{ i===frame.side?'Ton camp':'Camp adverse' }}</b><small v-for="e in side" :key="e.id">{{ e.name }}{{ e.layers?' ×'+e.layers:e.turns?' · '+e.turns+' t':'' }}</small></span></div>
   <battle-weather-info v-if="weatherName" class="double-weather" :weather="weatherName"/>
   <div v-for="spot in spots" :key="spot.key" :ref="spot.key" :data-double-position="spot.key" class="double-combatant" :class="[spot.own?'own':'foe',isMoveActor(spot)?'double-caster-'+fx.stage:'',{'is-corrupted':spot.p?.corrupted,'is-target':targets.some(t=>t.side===spot.side&&t.slot===spot.slot),'is-fainted':spot.p?.fainted,'takes-hit':effect?.actor?.side===spot.side&&effect?.actor?.slot===spot.slot&&effect.kind==='-damage','is-critical':effect?.actor?.side===spot.side&&effect?.actor?.slot===spot.slot&&effect.kind==='-crit'}]" :style="{'--x':spot.x+'%','--y':spot.y+'%'}">
    <button v-if="spot.p" class="double-target" :disabled="!targets.some(t=>t.side===spot.side&&t.slot===spot.slot)" @click="target(spot.side,spot.slot)" :aria-label="`Cibler ${spot.p.name}`">
     <span class="double-card"><span><b>{{ spot.p.name }}</b><small>N. {{ spot.p.level }} {{ spot.p.gender==='M'?'♂':spot.p.gender==='F'?'♀':'' }}</small></span><span class="double-hp"><i :style="{width:Math.max(0,spot.p.currentHp/spot.p.maxHp*100)+'%'}"/></span><small>{{ spot.p.currentHp }}/{{ spot.p.maxHp }} PV <span v-if="spot.p.status!=='normal'">· {{ status(spot.p.status) }}</span></small><em v-if="boostText(spot.p)">{{ boostText(spot.p) }}</em></span>
     <pokemon-portrait :src="sprite(spot.p,spot.own)" :alt="spot.p.name" :class="{'double-recall':effect?.kind==='switch'&&effect?.actor?.side===spot.side&&effect?.actor?.slot===spot.slot}"/>
     <span v-if="effect?.actor?.side===spot.side&&effect?.actor?.slot===spot.slot&&effect?.amount" class="double-damage" :class="{'is-heal':effect.kind==='-heal'}">{{ effect.kind==='-heal'?'+':'−' }}{{ effect.amount }}</span>
     <battle-stat-change v-if="!reduced&&['-boost','-unboost'].includes(effect?.kind)&&effect?.actor?.side===spot.side&&effect?.actor?.slot===spot.slot" class="double-stat" :key="effect.id" :effects="[{kind:effect.delta>0?'up':'down',delta:effect.delta,key:effect.stat,text:statLabel(effect.stat)+' '+(effect.delta>0?'+':'')+effect.delta}]"/>
     <battle-status-effect v-if="statusFx?.actor?.side===spot.side && statusFx?.actor?.slot===spot.slot" :key="statusFx.nonce" class="double-status-visual" :effect="statusFx" :reduced="reduced"/>
     <battle-persistent-effect v-if="spot.p.effects" class="double-persistent" :effects="spot.p.effects" :reduced="reduced"/>
     <span v-if="spot.own&&!spectator" class="double-owner">{{ control?.slots?.[spot.slot]?.ownerName }}<b v-if="control?.slots?.[spot.slot]?.delegated"> → {{ control.slots[spot.slot].controllerName }}</b></span>
    </button>
   </div>
   <battle-move-effect v-if="fx && !reduced" :key="fx.id" :fx="fx" :path="fx.path" :color="color(fx.moveType)"/>
   <div v-if="loading" class="double-loading" role="status"><i/>Préparation du terrain…</div>
  </div>
  <div class="double-console"><div v-if="selectedMove && areaMove(selectedMove)" class="double-area-review" data-double-area-review><strong>{{ selectedMove.name }}</strong><p>{{ selectedMove.targets.some(t=>t.side===frame.side&&t.slot!==slot)?'Attention : touche aussi tes alliés.':'Effet collectif sur les cibles indiquées.' }}</p><p>Cibles potentielles : {{ selectedMove.targets.map(t=>display.active[t.side]?.[t.slot]?.name).filter(Boolean).join(', ') }}</p><button :disabled="!canAct" @click="submitMove()">Confirmer la capacité</button><small>Les immunités et protections s’appliquent.</small><button @click="selectedMove=null">Retour aux capacités</button></div>
   <p class="double-message" role="status" aria-live="polite">{{ loading?'Chargement des Pokémon…':control?.paused?'Un participant se reconnecte. Le duel est en pause.':message || (spectator?'Combat en direct':prompt) }}</p>
   <template v-if="!spectator&&!frame.finished">
    <nav class="double-slots" aria-label="Pokémon à commander"><button v-for="s in frame.request?.slots || []" :key="s.slot" :aria-pressed="slot===s.slot" :class="{'slot-done':frame.choices[s.slot]}" @click="chooseSlot(s.slot)"><b>{{ own[s.slot]?.name || 'Emplacement '+(s.slot+1) }}</b><small>{{ frame.choices[s.slot]?'Action choisie ✓':s.required?(control?.slots?.[s.slot]?.controllerName||'…')+' choisit':'En attente' }}</small></button></nav>
    <div class="double-controller"><span v-if="controls?.delegated">{{ controls.ownerName }} te passe la main.</span><span v-else>{{ controls?.canControl?'À toi de jouer':controls?.controllerName?'Au tour de '+controls.controllerName:'En attente du prochain tour' }}</span><button v-if="controls?.canPass" :disabled="busy||playing" @click="$emit('pass',{slot,turnId:frame.turnId,controlRevision:controls.revision})">Passer la main ↗</button></div>
    <p v-if="selectedMove" class="double-target-hint">Cible de <b>{{ selectedMove.name }}</b> : <button @click="selectedMove=null">Annuler</button><button v-for="t in targets" :key="t.loc" @click="submitMove(t.loc)">{{ t.side===frame.side?'Allié · ':'' }}{{ t.name }}</button></p>
    <div v-else-if="canAct" class="double-options">
     <div v-if="!reserves&&decision?.moves?.length" class="double-moves"><battle-move-button v-for="(m,i) in decision.moves" :key="m.index" :move="m.id||m.name" :resolved-type="m.type" :data-keyboard-number="i+1" :disabled="m.disabled||m.pp===0&&m.id!=='struggle'" :reason="m.disabledReason||(m.disabled?'Capacité indisponible.':m.pp===0&&m.id!=='struggle'?'Aucun PP.':'')" :warning="areaMove(m)?(m.targets.some(t=>t.side===frame.side&&t.slot!==slot)?'Touche aussi tes alliés.':'Touche toutes les cibles indiquées.'):''" :style="{'--type-color':color(m.type)}" @choose="move(m)"><b>{{ m.name }}</b><small>{{ type(m.type) }} · {{ m.category==='Physical'?'Physique':m.category==='Special'?'Spéciale':'Statut' }} · {{ m.power || '—' }}</small><span>{{ m.pp }} / {{ m.maxpp }} PP</span></battle-move-button></div>
     <div v-if="reserves||decision?.forceSwitch" class="double-reserves"><div v-for="p in frame.team" :key="p.uuid" class="double-reserve-entry"><button :disabled="p.active||p.fainted||!p.currentHp" @click="submit({action:'switch',pokemonUuid:p.uuid})"><pokemon-portrait :src="sprite(p)" alt=""/><b>{{ p.name }}</b><small>{{ p.currentHp }}/{{ p.maxHp }} PV</small></button><battle-pokemon-info :pokemon="p"/></div></div>
     <button v-if="!decision?.forceSwitch" class="double-switch" :disabled="decision?.trapped" @click="reserves=!reserves">{{ reserves?'Retour aux capacités':'Changer de Pokémon' }}</button>
    </div>
    <p v-else class="double-wait">{{ playing?'Résolution des actions…':frame.choices[slot]?'Ton action est enregistrée. Ton partenaire et l’adversaire terminent leurs choix.':'L’autre dresseur prépare son action.' }}</p>
    <p v-if="error" class="double-error" role="alert">{{ error }}</p>
   </template>
   <div v-if="frame.finished&&!playing" class="double-finish"><h2>{{ frame.winner===null?'Match terminé':frame.winner===frame.side?'Victoire !':'Défaite' }}</h2><p>L’équipe d’Aventure et ses objets sont conservés. Ce duel ne rapporte pas d’XP.</p><button :disabled="!settled&&!spectator" @click="$emit('close')">{{ settled||spectator?'Retour dans la salle':'Sauvegarde du résultat…' }}</button></div>
  </div>
  <div v-back="()=>askForfeit=false" v-if="askForfeit" class="double-confirm"><section><h3>Abandonner ce duel ?</h3><p>Le camp adverse remportera le combat et les mises prévues.</p><button @click="askForfeit=false">Continuer</button><button @click="askForfeit=false;$emit('forfeit')">Abandonner</button></section></div>
  <slot name="social-chat"/>
 </section>
</template>
<script>
import BattlePokemonInfo from '../battle/BattlePokemonInfo.vue';
import BattleMoveButton from '../battle/BattleMoveButton.vue';
import {isAreaMove} from '@/services/moveInspection';
import PokemonPortrait from '../PokemonPortrait.vue';
import hallBackground from '@/assets/battle/double-hall-v1.webp';
import BattleMoveEffect from '../battle/BattleMoveEffect.vue';
import BattlePersistentEffect from '../battle/BattlePersistentEffect.vue';
import BattleStatChange, {STAT_CHANGE_DURATION} from '../battle/BattleStatChange.vue';
import BattleRain from '../battle/BattleRain.vue';
import BattleSnow from '../battle/BattleSnow.vue';
import BattleSandstorm from '../battle/BattleSandstorm.vue';
import BattleWeatherInfo from '../battle/BattleWeatherInfo.vue';
import {moveVisual} from '@/services/moveVisuals';
import BattleStatusEffect from '../battle/BattleStatusEffect.vue';
import {nativeStatusVisual,STATUS_VISUALS} from '@/services/battleStatusVisuals';
import {BATTLE_PACING,battleReadingTime,nativeEventPause} from '@/services/battlePacing';
import {doubleMoveVisual} from '@/services/doubleMoveVisuals';
import {localizeTypeName} from '@/services/pokemonTypes';
const colors={Normal:'#92927b',Fire:'#cf7049',Water:'#558cc5',Electric:'#c6a841',Grass:'#66975d',Ice:'#65a9b1',Fighting:'#b56559',Poison:'#a36ca2',Ground:'#aa8855',Flying:'#8e8fbe',Psychic:'#c16d92',Bug:'#8a993f',Rock:'#a49860',Ghost:'#8172a6',Dragon:'#7978be',Dark:'#817064',Steel:'#859aa2',Fairy:'#c68eae'};
export default {
 components:{BattleStatusEffect,BattlePokemonInfo,BattleMoveButton,PokemonPortrait,BattleMoveEffect,BattlePersistentEffect,BattleRain,BattleSnow,BattleSandstorm,BattleWeatherInfo,BattleStatChange},props:{frame:Object,control:Object,busy:Boolean,error:String,settled:Boolean,spectator:Boolean,reduced:Boolean},
 data:()=>({statusFx:null,statusNonce:0,display:null,slot:0,reserves:false,selectedMove:null,message:'',effect:null,fx:null,playing:false,loading:true,askForfeit:false,narrow:false}),
 computed:{weatherName(){return({raindance:'rain',sunnyday:'sun',sandstorm:'sandstorm',hail:'hail',snowscape:'snow'})[this.display?.weather]||null;},own(){return this.frame.active?.[this.frame.side]||[];},controls(){return this.control?.slots?.[this.slot];},decision(){return this.frame.request?.slots?.[this.slot];},canAct(){return !this.playing&&!this.loading&&!this.busy&&!this.control?.paused&&!!this.controls?.canControl&&!!this.decision?.required&&!this.frame.choices[this.slot];},prompt(){return this.canAct?'Choisis une capacité puis sa cible.':'Les dresseurs préparent leurs actions.';},targets(){return this.selectedMove?.targets||[];},spots(){const s=this.display||this.frame;return [0,1].flatMap(side=>[0,1].map(slot=>({side,slot,key:`double-${side}-${slot}`,p:s.active?.[side]?.[slot],own:side===this.frame.side,x:side===this.frame.side?(this.narrow?[18,50]:[18,43])[slot]:(this.narrow?[52,84]:[58,83])[slot],y:side===this.frame.side?100:this.narrow?50:60})));}},
 watch:{frame:{immediate:true,handler(frame){this._frames ||= [];this._frames.push(JSON.parse(JSON.stringify(frame)));this.play();}},'frame.turnId'(){this.selectedMove=null;this.reserves=false;this.autoSlot();},control(){this.autoSlot();}},
 mounted(){this._previousFocus=document.activeElement;this.$refs.dialog.focus({preventScroll:true});this._resize=new ResizeObserver(entries=>{this.narrow=entries[0].contentRect.width<641;});this._resize.observe(this.$refs.stage);this._visibility=()=>{if(document.hidden){this._readUntil=0;for(const finish of this._waiters||[])finish();this.statusFx=null;}};document.addEventListener('visibilitychange',this._visibility);},
 beforeDestroy(){if(this._previousFocus?.isConnected)this._previousFocus.focus({preventScroll:true});this._resize?.disconnect();document.removeEventListener('visibilitychange',this._visibility);this._closed=true;for(const finish of this._waiters||[])finish();},
 methods:{
 async holdNarration(){const ms=(this._readUntil||0)-performance.now();if(ms>0&&!document.hidden)await this.sleep(ms);},
 async narrate(text,move=false){if(!text)return;await this.holdNarration();if(this._closed)return;this.message=text;this._readUntil=performance.now()+battleReadingTime(text,{move,hidden:document.hidden});},
 statusCue(e){const cue=nativeStatusVisual(e);if(cue&&e.actor){this.statusFx={...cue,actor:e.actor,nonce:++this.statusNonce};return cue;}return null;},
 areaMove:isAreaMove,onKey(e){if(e.key==='Escape'){this.selectedMove=null;this.reserves=false;}if(e.key!=='Tab')return;const list=[...this.$el.querySelectorAll('button:not(:disabled),input,textarea')].filter(n=>n.getClientRects().length);const first=list[0],last=list[list.length-1];if(e.shiftKey&&[first,this.$el].includes(document.activeElement)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}},statLabel(s){return({atk:'Attaque',def:'Défense',spa:'Att. Spé.',spd:'Déf. Spé.',spe:'Vitesse',accuracy:'Précision',evasion:'Esquive'})[s]||s;},type:localizeTypeName,color(type){return colors[type]||colors.Normal;},status(s){return({brn:'BRÛ',psn:'PSN',tox:'PSN+',par:'PAR',slp:'SOM',frz:'GEL'})[s]||s;},boostText(p){return Object.entries(p.boosts||{}).filter(([,n])=>n).map(([s,n])=>`${({atk:'Att',def:'Déf',spa:'ASp',spd:'DSp',spe:'Vit',accuracy:'Préc',evasion:'Esq'})[s]||s} ${n>0?'+':''}${n}`).join(' · ');},sprite(p,back=false){return this.$pokemonSprite({...p,gender:p.gender==='F'?'female':p.gender==='M'?'male':'genderless',data:{id:p.pokemonId}},{side:back?'back':'front',animated:!this.reduced});},chooseSlot(slot){this.slot=slot;this.reserves=false;this.selectedMove=null;},autoSlot(){if(this.controls?.canControl&&!this.frame.choices[this.slot])return;const next=this.control?.slots?.find(s=>s.canControl&&!this.frame.choices[s.slot]);if(next)this.chooseSlot(next.slot);},move(m){if(!this.canAct)return;const selected=['normal','any','adjacentAlly','adjacentAllyOrSelf'].includes(m.target);if(selected){this.selectedMove=m;if(m.targets.length===1)this.submitMove(m.targets[0].loc);}else{this.selectedMove=m;if(!this.areaMove(m))this.submitMove();}},target(side,slot){if(this.areaMove(this.selectedMove))return;const t=this.targets.find(t=>t.side===side&&t.slot===slot);if(t)this.submitMove(t.loc);},submitMove(targetLoc){const m=this.selectedMove;if(m)this.submit({action:'attack',moveIndex:m.index,targetLoc});},submit(payload){if(!this.canAct)return;this.$emit('action',{...payload,slot:this.slot,turnId:this.frame.turnId,controlRevision:this.controls.revision});this.selectedMove=null;this.reserves=false;},sleep(ms){if(this._closed||document.hidden)return Promise.resolve();return new Promise(resolve=>{this._waiters ||= new Set();const finish=()=>{clearTimeout(timer);this._waiters.delete(finish);resolve();};const timer=setTimeout(finish,ms);this._waiters.add(finish);});},
 async preload(frame){const urls=[hallBackground,...frame.active.flat().filter(Boolean).map(p=>this.sprite(p))];await Promise.race([Promise.all(urls.map(src=>new Promise(resolve=>{const img=new Image();img.onload=img.onerror=resolve;img.src=src;}))),this.sleep(5000)]);},
 async play(){
 if(this.playing||this._closed)return;this.playing=true;
 try{while(this._frames.length&&!this._closed){
  const frame=this._frames.shift();
  if(!this.display){this.display=JSON.parse(JSON.stringify(frame));await this.preload(frame);this.loading=false;}
  const events=frame.events||[];
  for(let n=0;n<events.length;n++){
   const e=events[n];if(this._closed)break;
   const cue=nativeStatusVisual(e);
   const residual=e.kind==='-damage'&&e.direct===false;
   const message=residual&&cue?`${this.display.active[e.actor?.side]?.[e.actor?.slot]?.name} · ${STATUS_VISUALS[cue.status].label}.`:e.message;
   if(e.kind==='move'){await this.finishMoveFx();await this.sleep(this.reduced||document.hidden?0:BATTLE_PACING.actionPause);}
   if(message&&!(e.kind==='-damage'&&!residual))await this.narrate(message,e.kind==='move');
   if(this._closed)break;
   this.effect={...e,id:Math.random()};this.statusCue(e);
   if(e.kind==='-singleturn'&&e.effect==='Protect'&&e.actor&&this.display.active[e.actor.side]?.[e.actor.slot])this.$set(this.display.active[e.actor.side][e.actor.slot],'effects',{...this.display.active[e.actor.side][e.actor.slot].effects,shield:true});
   if(e.kind==='move'){await this.animate(e,doubleMoveVisual(events,n,this.display.active));continue;}
   if(['switch','drag','replace'].includes(e.kind)&&e.actor&&e.pokemon)this.$set(this.display.active[e.actor.side],e.actor.slot,{...e.pokemon});
   if(['-damage','-heal'].includes(e.kind)&&e.actor){
    const p=this.display.active[e.actor.side]?.[e.actor.slot];
    if(p){
     // All travel is finished before changing this target's HP. Recoil and
     // residual damage never masquerade as another successful move impact.
     if(e.kind==='-damage'&&e.direct!==false&&this.fx){const target=this.fx.fullTargets.find(t=>t.side===e.actor.side&&t.slot===e.actor.slot);if(target?.connected){const key=`${e.actor.side}:${e.actor.slot}`,seen=this._moveHitCount[key]||0;
      if(seen>0&&target.hits>1&&!this.reduced){this.fx={...this.fx,stage:'travel',travelMs:BATTLE_PACING.hitGap,result:{success:true,hits:1},path:{...this.fx.path,targets:[target]}};await this.sleep(BATTLE_PACING.hitGap);}
      this._moveHitCount[key]=seen+1;this._impactAt=performance.now();this.fx={...this.fx,stage:'impact',pulse:(this.fx.pulse||0)+1,result:{success:true,hits:1,critical:target.critical},path:{...this.fx.path,targets:[target]}};}}
     if(e.kind==='-heal'&&this.fx?.family==='drain'&&!this.reduced){this.fx={...this.fx,stage:'drain',path:{...this.fx.path,targets:this.fx.fullTargets.filter(t=>t.connected)}};await this.sleep(BATTLE_PACING.drain);}
     this.effect.amount=Math.abs(p.currentHp-e.hp);this.$set(p,'currentHp',e.hp);if(e.maxHp)this.$set(p,'maxHp',e.maxHp);
    }
   }
   if(['-status','-curestatus'].includes(e.kind)&&e.actor){const p=this.display.active[e.actor.side]?.[e.actor.slot];if(p)this.$set(p,'status',e.kind==='-curestatus'?'normal':e.effect);}
   if(e.kind==='faint'&&e.actor&&this.display.active[e.actor.side]?.[e.actor.slot])this.$set(this.display.active[e.actor.side][e.actor.slot],'fainted',true);
   if(['-boost','-unboost'].includes(e.kind)&&e.actor){const p=this.display.active[e.actor.side]?.[e.actor.slot];if(p)this.$set(p,'boosts',{...p.boosts,[e.stat]:Math.min(6,Math.max(-6,(p.boosts?.[e.stat]||0)+e.delta))});}
   if(['-immune','-miss','-fail'].includes(e.kind)&&this.fx){const point=this.point(e.kind==='-miss'?e.target:e.actor);this.fx={...this.fx,stage:'miss',path:{...this.fx.path,targets:[{...point,connected:false}]}};}
   await this.sleep(document.hidden?0:['-boost','-unboost'].includes(e.kind)?(this.reduced?20:STAT_CHANGE_DURATION):this.reduced?20:nativeEventPause(e,cue));
   this.statusFx=null;
  }
  await this.finishMoveFx();await this.holdNarration();this.display=JSON.parse(JSON.stringify(frame));this.effect=null;this.fx=null;this.statusFx=null;this.message='';
 }}finally{this.playing=false;this.autoSlot();}
},
 point(actor){
  const spot=this.spots.find(s=>s.side===actor?.side&&s.slot===actor?.slot),stage=this.$refs.stage,ref=spot&&this.$refs[spot.key],node=(Array.isArray(ref)?ref[0]:ref)?.querySelector('.pokemon-portrait');
  if(node&&stage){const a=node.getBoundingClientRect(),b=stage.getBoundingClientRect();return{x:a.left-b.left+a.width/2,y:a.top-b.top+a.height*.5,groundY:a.bottom-b.top-5};}
  if(!spot||!stage)return{x:0,y:0,groundY:0};return{x:stage.clientWidth*spot.x/100,y:stage.clientHeight*(spot.y-14)/100,groundY:stage.clientHeight*spot.y/100};
 },
 isMoveActor(spot){return this.fx&&['charge','punch'].includes(this.fx.family)&&this.fx.actor?.side===spot.side&&this.fx.actor?.slot===spot.slot;},
 async finishMoveFx(){
  if(!this.reduced&&!document.hidden&&this.fx&&this._impactAt)await this.sleep(Math.max(0,this.fx.impactMs-(performance.now()-this._impactAt)));
  this._impactAt=0;
 },
 async animate(e,plan){
  await this.finishMoveFx();if(this._closed)return;
  await this.$nextTick();const targets=plan.targets.map(t=>({...t,...this.point(t)})),target=targets[0]||this.point(e.target),start=e.delayed?{x:target.x,y:target.y-80}:this.point(e.actor),v=moveVisual({moveName:e.moveName,moveType:e.moveType,power:e.power,damageClass:e.category?.toLowerCase(),moveTarget:e.moveTarget,phase:plan.prepared?'prepare':undefined});
  const fx={...v,id:Math.random(),actor:e.actor,result:{success:!plan.failed,hits:1},stage:'windup',fullTargets:targets,path:{startX:start.x,startY:start.y,targetX:target.x,targetY:target.y,groundY:target.groundY,targets}};
  this._moveHitCount={};this.fx=fx;await this.sleep(this.reduced?0:v.windupMs);if(this._closed)return;
  this.fx={...fx,stage:plan.prepared?'windup':'travel'};await this.sleep(this.reduced?20:v.travelMs);if(this._closed)return;
  this.fx={...fx,stage:plan.failed?'miss':plan.prepared?'await':e.category==='Status'?'aura':'await'};
  if(e.category==='Status')await this.sleep(this.reduced?20:BATTLE_PACING.status);
 }}

};
</script>
<style scoped>
.double-reserve-entry{position:relative;min-width:0}.double-reserve-entry>button{width:100%;min-width:0;padding-right:48px}.double-reserve-entry>.battle-companion-info{position:absolute;top:2px;right:2px}
.double-battle{position:fixed;inset:0;z-index:2000;display:flex;flex-direction:column;max-width:1200px;margin:auto;background:var(--journal-paper);color:var(--journal-ink);font:14px/1.4 var(--journal-font);box-shadow:0 0 90px #0008;overflow:hidden}.double-battle *{box-sizing:border-box}.double-battle header{display:flex;align-items:center;gap:16px;flex:none;padding:10px 18px;border-bottom:2px solid var(--journal-border);background:var(--journal-soft)}header>span{flex:1;min-width:0}header b{display:block;font-size:16px}header i{font-size:12px;font-style:normal;font-weight:400}header small{font-size:9px;letter-spacing:.12em;color:var(--journal-muted)}button{font:inherit;color:inherit;border:1px solid var(--journal-border);background:var(--journal-card);border-radius:7px;min-height:44px;padding:8px 12px;cursor:pointer}button:disabled{cursor:default;opacity:.45}button:focus-visible{outline:3px solid var(--journal-accent);outline-offset:2px}.double-stage{position:relative;flex:1;min-height:250px;overflow:hidden;background:#8b9ca5 url('~@/assets/battle/double-hall-v1.webp') center 50%/cover no-repeat}.double-combatant{--sprite-height:clamp(70px,15vh,180px);position:absolute;left:var(--x);top:var(--y);width:clamp(120px,22%,230px);transform:translate(-50%,-100%)}.double-target{position:relative;display:flex;flex-direction:column;align-items:center;width:100%;padding:0;background:none;border:0;opacity:1!important;cursor:default}.double-target>.pokemon-portrait,.double-target>img{object-fit:contain;width:100%;height:var(--sprite-height);image-rendering:pixelated;filter:drop-shadow(0 5px 3px #192f4244);transform-origin:50% 100%}.double-card{width:100%;background:var(--journal-paper);border:1px solid var(--journal-border);border-radius:8px;padding:6px 8px;box-shadow:0 3px 0 #142d4244;text-align:left;font-size:11px}.double-card>span:first-child{display:flex;align-items:baseline;justify-content:space-between;gap:5px}.double-card b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.double-card small{font-size:9px;white-space:nowrap}.double-hp{display:block;height:6px;background:#0b24354d;margin:4px 0;border-radius:4px;overflow:hidden}.double-hp i{display:block;height:100%;background:#60b880;transition:width .3s}.double-card em{display:block;font-size:9px;color:var(--journal-accent);font-style:normal}.double-owner{position:absolute;bottom:0;left:0;right:0;text-align:center;background:var(--journal-paper);border:1px solid var(--journal-border);font-size:9px;border-radius:5px;padding:2px;white-space:nowrap}.is-corrupted .double-card{background:#493959;color:#f1e9ff;border-color:#c097dc}.is-target .double-target{cursor:crosshair;outline:3px solid #e5ca77;outline-offset:5px;border-radius:8px;background:#edcd6b22}.is-fainted .pokemon-portrait{opacity:0;transform:translateY(50px) scale(.7);transition:opacity .4s,transform .4s}.double-console{flex:none;padding:10px 18px 16px;background:var(--journal-soft);border-top:2px solid var(--journal-border);max-height:49%;overflow:auto;overscroll-behavior:contain}.double-message{margin:0 0 10px;height:40px;display:flex;align-items:center;font-size:14px;overflow:hidden}.double-slots{display:flex;gap:8px}.double-slots button{flex:1;text-align:left;background:var(--journal-card)}.double-slots b,.double-slots small{display:block}.double-slots small{font-size:10px;color:var(--journal-muted)}.double-slots [aria-pressed=true]{border-color:var(--journal-accent);box-shadow:inset 0 -2px var(--journal-accent)}.double-slots .slot-done{background:var(--journal-selected)}.double-controller{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:34px;font-size:11px}.double-controller button{min-height:30px;padding:4px 8px;font-size:11px}.double-moves{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.double-moves button{position:relative;text-align:left;background:color-mix(in srgb,var(--type-color) 25%,var(--journal-paper));border-color:var(--type-color);border-left-width:5px;min-height:64px}.double-moves b,.double-moves small{display:block}.double-moves small{font-size:10px}.double-moves button>span{font-size:10px;color:var(--journal-muted)}.double-switch{width:100%;margin-top:8px;min-height:36px;font-size:12px}.double-reserves{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}.double-reserves button{display:flex;flex-direction:column;align-items:center;padding:5px;min-width:0;font-size:10px}.double-reserves img{width:46px;height:46px;object-fit:contain;image-rendering:pixelated}.double-reserves b{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.double-target-hint{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:5px 0}.double-target-hint button{font-size:12px}.double-error{color:var(--journal-danger);font-size:12px}.double-wait{padding:12px;text-align:center;color:var(--journal-muted)}.double-finish{text-align:center}.double-finish h2{margin:0;color:var(--journal-heading)}.double-finish p{font-size:12px}.double-finish button{background:var(--journal-accent);color:var(--journal-on-accent)}.double-loading,.double-confirm{position:absolute;inset:0;background:#112838e8;display:flex;align-items:center;justify-content:center;gap:12px;color:white;z-index:20}.double-loading i{width:24px;height:24px;border:3px solid #ffffff44;border-top-color:#e5cd95;border-radius:50%;animation:double-spin .8s linear infinite}.double-confirm section{width:min(420px,90%);padding:25px;background:var(--journal-paper);color:var(--journal-ink);border:2px solid var(--journal-border);border-radius:12px}.double-confirm button{margin:5px}.takes-hit .pokemon-portrait{animation:double-hit .25s 2}.is-critical:after{content:'CRITIQUE !';position:absolute;top:30%;left:0;right:0;text-align:center;color:#ffe7a2;font-size:20px;font-weight:900;text-shadow:2px 2px #852b40;animation:double-crit .4s ease-out}.double-recall{animation:double-enter .4s ease-out}.move-library{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:10}
@keyframes double-spin{to{transform:rotate(360deg)}}@keyframes double-hit{25%{translate:-5px}75%{translate:5px;filter:brightness(1.8)}}@keyframes double-crit{from{scale:1.5;opacity:0}to{scale:1;opacity:1}}@keyframes double-enter{from{opacity:0;scale:.4;filter:brightness(3)}to{opacity:1;scale:1}}
@media(max-width:640px){.double-battle header{padding:7px 10px;gap:8px}header b{font-size:11px}header small{font-size:7px}header>strong{font-size:11px}.double-console{padding:7px 10px 10px;max-height:54%}.double-message{font-size:12px;height:36px;margin-bottom:6px}.double-stage{min-height:210px}.double-combatant{width:29%;--sprite-height:clamp(76px,16vh,130px)}.double-target>.pokemon-portrait{height:var(--sprite-height)}.double-card{padding:4px 6px;font-size:10px}.double-card small{font-size:8px}.double-owner{font-size:8px}.double-slots button{padding:5px 8px;font-size:11px;min-height:42px}.double-controller{font-size:10px}.double-moves{gap:6px}.double-moves button{padding:6px 8px;min-height:60px;font-size:12px}.double-moves small{font-size:9px}.double-reserves{grid-template-columns:repeat(4,minmax(0,1fr))}.double-target-hint{font-size:11px}.double-target-hint button{font-size:10px}}
@media(max-height:580px) and (min-width:641px){.double-battle{display:grid;grid-template-columns:1fr 380px;grid-template-rows:56px 1fr}header{grid-column:1/-1}.double-console{max-height:100%;border-top:0}.double-stage{min-height:0}.double-combatant{--sprite-height:min(120px,calc((100dvh - 56px)/2 - 64px))}.double-reserves{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>

<style scoped>
@media(max-width:640px) and (max-height:650px){.double-battle header{padding:4px 8px;min-height:42px}header button{min-height:32px;padding:4px 8px}.double-console{padding:5px 8px 7px;max-height:52%}.double-message{height:26px;margin-bottom:4px;font-size:11px}.double-slots button{min-height:34px;padding:3px 6px}.double-controller{min-height:25px}.double-controller button{min-height:25px}.double-moves button{min-height:46px;padding:4px 6px;font-size:11px}.double-moves{gap:4px}.double-moves small{font-size:8px}.double-switch{min-height:28px;padding:4px 8px;margin-top:5px}.double-combatant{--sprite-height:60px}.double-card{padding:3px 5px;font-size:9px;line-height:1.1}.double-card small{font-size:7px}.double-card>small{line-height:1}.double-owner{font-size:7px;padding:1px}.double-reserves{grid-template-columns:repeat(4,minmax(0,1fr))}}
</style>

<style scoped>
.foe .double-target:before{content:'';position:absolute;bottom:calc(var(--sprite-height)*.11);left:10%;width:80%;height:14px;border-radius:50%;border:2px solid #d8c089;background:#516f86;box-shadow:0 3px 0 #283f53;z-index:0}.double-target>.pokemon-portrait{z-index:1}.double-card{position:relative;z-index:2}.double-owner{z-index:3}
</style>

<style scoped>
.double-weather{position:absolute;right:10px;top:10px;z-index:30}.double-persistent{left:50%;bottom:calc(var(--sprite-height)*.15);top:auto;width:70%;height:calc(var(--sprite-height)*.8);transform:translateX(-50%);z-index:4}
</style>

<style scoped>
.double-side-effects{position:absolute;top:8px;left:10px;max-width:70%;display:flex;gap:10px;z-index:20;font-size:9px}.double-side-effects>span{display:flex;flex-wrap:wrap;gap:4px}.double-side-effects b,.double-side-effects small{background:var(--journal-paper);border:1px solid var(--journal-border);padding:3px 5px;border-radius:4px;font-size:9px}
</style>

<style scoped>
.double-damage{position:absolute;bottom:calc(var(--sprite-height)*.7);left:50%;translate:-50% 0;z-index:15;pointer-events:none;font:900 22px/1 Arial,sans-serif;color:#fff;text-shadow:1px 2px 2px #14273b,-1px -1px #14273b;animation:double-number .33s ease-out both}.double-damage.is-heal{color:#a6f7bd}.double-stat{inset:auto 10% 4px;height:var(--sprite-height);z-index:15;--stat-label-max-width:130px}
@keyframes double-number{from{opacity:0;transform:translateY(8px) scale(.8)}to{opacity:1;transform:translateY(-10px) scale(1)}}
@media(max-width:640px){.double-damage{font-size:18px}}
</style>

<style scoped>
.double-caster-windup .pokemon-portrait{translate:-6px 3px;transition:translate .12s}
.double-caster-travel .pokemon-portrait{translate:14px -6px;transition:translate .22s}
.foe.double-caster-travel .pokemon-portrait{translate:-14px 6px}
.double-caster-impact .pokemon-portrait,.double-caster-await .pokemon-portrait{translate:0 0;transition:translate .2s}
.move-camera-impact{animation:double-impact .3s ease-out}
@keyframes double-impact{0%,100%{translate:0 0}20%{translate:-2px 1px}45%{translate:2px -1px}65%{translate:-1px 0}}
@media(prefers-reduced-motion:reduce){.move-camera-impact{animation:none}}
</style>
<style scoped>
.double-area-review{padding:10px;border:2px solid #b59b62;background:var(--journal-soft);border-radius:9px;font-size:12px}.double-area-review p{margin:5px 0}.double-area-review button{min-height:44px;width:100%}.double-moves ::v-deep .move-action{background:var(--journal-card);border:1px solid var(--type-color);border-left-width:4px;border-radius:8px;text-align:left;padding:8px;color:var(--journal-ink);min-height:64px}.double-moves ::v-deep .move-action b,.double-moves ::v-deep .move-action small,.double-moves ::v-deep .move-action span{display:block;font-size:11px}
</style>

<style scoped>
.double-status-visual{left:10%;right:auto;top:auto;bottom:12px;width:80%;height:var(--sprite-height);z-index:5}
</style>

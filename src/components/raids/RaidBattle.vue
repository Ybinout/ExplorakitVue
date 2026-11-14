<template>
 <section ref="dialog" tabindex="-1" class="raid-battle" :class="{'raid-reduced':reduced}" :style="{'--raid-bg':'url('+backgrounds.wide+')','--raid-mobile-bg':'url('+backgrounds.mobile+')'}" role="dialog" aria-modal="true" aria-label="Raid de corruption" @keydown.stop="onKey" @keyup.stop data-raid-battle>
  <div ref="stage" class="raid-stage" :class="[phaseEffect,{'is-enraged':display?.boss.rage?.value>=(display?.boss.rage?.highThreshold||75),'is-entering':loading,'is-critical':effect?.kind==='-damage'&&effect.critical}]">
   <battle-send-out v-if="entryPokemon && !reduced" side="player" :style="entryPosition" @schedule="entryCrySound"/><battle-ambience :environment="backgroundEnvironment" :background="backgrounds" :animations-enabled="!reduced && !loading"/><battle-player-ground v-if="main" :environment="backgroundEnvironment" selector=".raid-ally .pokemon-portrait" :identity="main.uuid"/>
   <raid-mist :map-name="mapName" :reduced="reduced"/><raid-field-effects :frame="display||frame" :reduced="reduced"/><battle-rain v-if="weather==='rain'" environment="arena" :animations-enabled="!reduced"/><battle-snow v-if="['hail','snow'].includes(weather)" environment="arena" :animations-enabled="!reduced"/><battle-sandstorm v-if="weather==='sandstorm'" environment="arena" :animations-enabled="!reduced"/>
   <div class="raid-boss-info"><article class="raid-boss-hud" aria-label="État du boss">
    <small class="raid-boss-context">Tour {{ display.turn }} · {{ difficulty }}</small>
    <span class="raid-boss-title"><b>{{ display.boss.name }}</b><small>N. {{ display.boss.level }} · CORROMPU</small></span>
    <div class="raid-gauge-heading"><b>PV</b><span data-raid-boss-hp>{{ display.boss.currentHp }} / {{ display.boss.maxHp }}</span></div>
    <div class="raid-boss-health" role="progressbar" aria-label="PV du boss" :aria-valuenow="display.boss.currentHp" :aria-valuemax="display.boss.maxHp" aria-valuemin="0"><i class="raid-gauge-trail" :style="{width:percent(display.boss)+'%'}"/><i :class="{'health-fluid':!reduced&&display.boss.currentHp>0}" :style="{width:percent(display.boss)+'%'}"/><em style="left:30%"/><em style="left:70%"/></div>
    <battle-status-pill :status="display.boss.status"/><raid-stat-stages :boosts="display.boss.boosts"/>
    <div class="raid-shield-meter" :class="{'is-active':display.shield?.hp>0,'is-breaking':phaseEffect==='shield-break'}" data-raid-shield>
     <div class="raid-gauge-heading"><b>◇ Bouclier</b><span>{{ display.vulnerableTurns&&!display.shield?.hp ? 'Brisé · '+display.vulnerableTurns+' tours de répit' : display.shield ? display.shield.hp+' / '+display.shield.max : 'Inactif' }}</span></div>
     <div class="raid-shield-bar" role="progressbar" aria-label="Bouclier du boss" :aria-valuenow="display.shield?.hp||0" :aria-valuemax="display.shield?.max||1" aria-valuemin="0"><i class="raid-gauge-trail" :style="{width:shieldPercent+'%'}"/><i :style="{width:shieldPercent+'%'}"/></div>
     <span v-if="shieldDamage" :key="shieldDamage.id" class="raid-shield-loss">−{{ shieldDamage.amount }} au bouclier</span>
    </div>
    <div class="raid-boss-rage" :class="{'is-high':display.boss.rage?.value>=display.boss.rage?.highThreshold}" data-raid-boss-rage><div><b>Rage</b><span>{{ display.boss.rage?.value||0 }} / {{ display.boss.rage?.maximum||100 }} · Dégâts +{{ display.boss.rage?.bonusPercent||0 }} %</span></div><span role="progressbar" aria-label="Rage du boss" :aria-valuenow="display.boss.rage?.value||0" :aria-valuemax="display.boss.rage?.maximum||100" aria-valuemin="0"><i :style="{width:Math.min(100,100*(display.boss.rage?.value||0)/(display.boss.rage?.maximum||100))+'%'}"/></span></div>
   </article><aside v-if="display.intention" class="raid-intention" data-raid-intention><strong>{{ display.intention.move }}</strong><span>{{ display.intention.area ? 'Tous les alliés' : 'Cible : '+(display.allies[display.intention.target]?.name || '—') }}</span><b>Dans {{ display.intention.remaining }} action{{ display.intention.remaining>1?'s':'' }}</b></aside></div><transition name="raid-announcement"><aside v-if="announcement" class="raid-announcement" role="status" data-raid-announcement><span aria-hidden="true">⚠</span><strong>{{ announcement }}</strong></aside></transition>
   <article v-if="main" class="raid-active-hud" :class="{'is-corrupted':main.corrupted}" :data-pokemon-uuid="main.uuid" data-raid-active-hud>
    <div><b>{{ main.name }}</b><small>N. {{ main.level }}</small><battle-status-pill :status="main.status"/></div>
    <health-bar :animated="!reduced" :key="main.uuid" :current-hp="main.currentHp" :hp-max="main.maxHp"/><span class="raid-active-hp">{{ main.currentHp }} / {{ main.maxHp }} PV <em v-if="main.withdrawn">· Retiré</em></span>
    <raid-stat-stages :key="main.uuid" :boosts="main.boosts"/><div class="raid-rage-label"><span>Aggro · attention du boss</span><b>{{ main.aggro }} %</b></div><span class="raid-active-rage" role="progressbar" aria-label="Aggro : attention du boss" :aria-valuenow="main.aggro" aria-valuemin="0" aria-valuemax="100"><i :style="{width:main.aggro+'%'}"/></span>
   </article>
   <div v-if="activeEffects.length" class="raid-team-effects" aria-label="Effets collectifs actifs"><span v-for="e in activeEffects" :key="e.key" :class="{'is-enemy':e.enemy}" :title="e.description" data-raid-team-effect><b>{{ e.enemy?'Boss · ':'' }}{{ e.name }}</b><small>{{ e.description }}<template v-if="e.turns"> · {{ e.turns }} tour{{ e.turns>1?'s':'' }}</template></small></span></div>
   <div class="raid-top-tools"><battle-weather-info v-if="weather" class="raid-weather" :weather="weather"/><div v-if="!frame.finished" class="raid-clock" :class="{'is-warning':remaining<=10,'is-danger':remaining<=5,'is-paused':playing||loading}" role="timer" :aria-label="'Temps de décision : '+remaining+' secondes'" data-raid-clock><strong>{{ remaining }}</strong><small>secondes</small></div></div>
   <div ref="boss" class="raid-boss" :role="bossTargetable?'button':undefined" :tabindex="bossTargetable?0:-1" :aria-label="bossTargetable?'Viser '+display.boss.name:undefined" @click="targetBoss" @keydown.enter.prevent="targetBoss" @keydown.space.prevent="targetBoss" :class="{'is-area-affected':selectedMove && areaMove(selectedMove) && selectedMove.targets.some(t=>t.slot===4),'is-selectable':bossTargetable,'is-shielded':display.shield?.hp>0,'takes-hit':effect?.slot===4&&effect?.kind==='-damage','fainted':bossFainted}"><span class="raid-boss-aura"/><span v-if="bossTargetable" class="raid-target-label">⌖ Viser {{ display.boss.name }}</span><pokemon-portrait class="battle-tintable" :tint="tintStyle(4)" :src="sprite(display.boss)" :alt="display.boss.name"/><raid-shield v-if="display.shield?.hp>0" :shield="display.shield" :hit="phaseEffect==='shield-hit'"/><battle-persistent-effect :effects="display.boss.effects" :reduced="reduced"/><span v-if="effect?.slot===4&&amount" class="raid-damage" :class="{'is-heal':effect.kind==='-heal'}">{{ effect.kind==='-heal'?'+':'−' }}{{ amount }}</span><span v-if="effect?.slot===4&&effect.kind==='-damage'&&effect.critical" class="raid-critical">CRITIQUE !</span><battle-stat-change v-if="!reduced&&effect?.slot===4&&['-boost','-unboost'].includes(effect.kind)" :key="effect.id" :effects="statEffect(effect)"/></div>
   <div ref="ally" class="raid-ally" :class="[focusPhase,{'raid-pokemon-enter':!!entryPokemon,'takes-hit':effect?.slot===shown&&effect?.kind==='-damage','fainted':main?.currentHp<=0&&!main?.withdrawn,'retired':main?.withdrawn}]"><pokemon-portrait v-if="main" class="battle-tintable" :tint="tintStyle(shown)" :src="sprite(main,true)" :alt="main.name"/><battle-persistent-effect v-if="main" :effects="main.effects" :reduced="reduced"/><span v-if="main?.effects?.helpingHand" class="raid-helping-hand" data-raid-helping-hand aria-label="Coup d’Main actif">✦</span><span v-if="effect?.slot===shown&&amount" class="raid-damage" :class="{'is-heal':effect.kind==='-heal'}">{{ effect.kind==='-heal'?'+':'−' }}{{ amount }}</span><span v-if="effect?.slot===shown&&effect.kind==='-damage'&&effect.critical" class="raid-critical">CRITIQUE !</span><battle-stat-change v-if="!reduced&&effect?.slot===shown&&['-boost','-unboost'].includes(effect.kind)" :key="effect.id" :effects="statEffect(effect)"/></div>
   <battle-status-effect v-if="statusFx && (statusFx.slot===4 || statusFx.slot===shown)" :key="statusFx.nonce" :effect="statusFx" @finished="clearStatusFx" :style="statusPosition(statusFx.slot)" :reduced="reduced"/>
   <battle-move-effect v-if="fx&&!reduced" :key="fx.id" :fx="fx" :path="fx.path" :color="color(fx.moveType)"/>
   <raid-corruption-effect :event="corruptionFx" :reduced="reduced"/>
   <div v-if="loading" class="raid-entry" role="status"><span class="raid-entry-rift"/><b>La faille s’ouvre…</b><small>Chargement du terrain et des Pokémon</small></div>
  </div>
  <div class="raid-console" :style="consoleHeight ? {height:consoleHeight+'px'} : null" :class="{'is-waiting':!needsChoice&&!targeting&&!frame.finished,'is-multiplayer':frame.multiplayer}">
   <div ref="consoleBody" class="raid-console-body">
   <div class="raid-decision-line">

   <p class="raid-message" role="status" aria-live="polite">{{ message || (playing?'Résolution du tour…':frame.finished?frame.won?'La corruption recule.':'Le raid est terminé.':canAct?((frame.handRequests?.length?frame.handRequests.map(r=>frame.allies[r.slot]?.name).join(', ')+(frame.handRequests.length>1?' demandent':' demande')+' la main. ':'')+'Choisis une action pour '+current.name):pendingMine?'Tes actions sont enregistrées.':'Tes alliés préparent leurs actions.') }}</p><div class="raid-decision-tools"><button @click="help=!help" :aria-expanded="help" aria-label="Aide sur le raid">?</button><slot name="social-toggle"/></div></div>
   <div class="raid-ally-cards" aria-label="Les quatre alliés"><raid-ally-card :animated="!reduced" :inspection-pokemon="frame.allies[i]" :requested="!!handRequest(i)" :request-mine="!!handRequest(i)?.mine" :can-request="requestable(i)" :request-busy="busy" :multiplayer="!!frame.multiplayer" :actions-left="frame.remainingActions?.[i]||0" @request="requestHand(i)" v-for="(p,i) in display.allies" :key="p.uuid" :pokemon="p" :src="sprite(p)" :disabled="!targetable(i)" :displayed="shown===i" :targeted="bossTargets(i)" :order="cardOrder(i)" :hit="cardHits[i]" :ready="frame.allies[i].ready" :controlled="frame.allies[i].canControl" :class="{'is-selected':shown===i,'is-corrupted':p.corrupted,'is-helped':p.effects?.helpingHand,'is-acting':frame.currentSlot===i&&!frame.finished,'is-withdrawn':p.withdrawn||!p.currentHp,'is-targeted':bossTargets(i),'is-valid-target':targeting&&targetable(i),'is-area-affected':selectedMove && areaMove(selectedMove) && selectedMove.targets.some(t=>t.slot===i),'is-hit':!!cardHits[i]&&cardHits[i].kind==='-damage','is-relay-target':relayTarget===i}" @choose="chooseCard(i)"/></div>
   <div v-if="!frame.finished" class="raid-controls">
    <div v-if="targeting" class="raid-targeting"><button v-if="bossTargetable" class="raid-boss-choice" @click="targetBoss" data-raid-boss-choice><span>⌖ Cible principale</span><b>{{ display.boss.name }}</b><small>Viser le boss →</small></button><div v-if="selectedMove && areaMove(selectedMove)" class="raid-area-review" data-raid-area-review><strong>{{ selectedMove.name }}</strong><p>{{ selectedMove.targets.some(t=>t.slot<4&&t.slot!==slot)?'Attention : cette capacité touche aussi tes alliés.':'Cette capacité affecte toutes les cibles indiquées.' }}</p><p>Cibles potentielles : {{ selectedMove.targets.map(t=>t.slot===4?display.boss.name:display.allies[t.slot]?.name).filter(Boolean).join(', ') }}</p><button :disabled="!canAct" @click="sendMove()">Confirmer la capacité</button><small>Les immunités et protections s’appliquent.</small><button @click="selectedMove=null">Retour aux capacités</button></div><div v-if="!selectedMove || !areaMove(selectedMove)" class="raid-target-prompt"><p>{{ passing?'Choisis l’allié qui reçoit la main.':'Cible de '+selectedMove.name }}</p><button @click="cancelTarget">Retour</button></div></div>
    <div v-else-if="canAct&&panel==='moves'" class="raid-moves"><battle-move-button v-for="(m,i) in current.moves" :key="m.index" :move="m.id||m.name" :resolved-type="m.type" :data-keyboard-number="i+1" :disabled="m.disabled||m.pp<=0&&m.id!=='struggle'" :reason="m.disabledReason||(m.pp<=0&&m.id!=='struggle'?'Aucun PP.':'')" :warning="areaMove(m)?(m.targets.some(t=>t.slot<4&&t.slot!==slot)?'Touche aussi tes alliés.':'Touche toutes les cibles indiquées.'):''" :style="{'--move-color':color(m.type)}" @choose="move(m)"><b>{{ m.name }}</b><small>{{ type(m.type) }} · {{ m.category==='Physical'?'Physique':m.category==='Special'?'Spéciale':'Statut' }} · {{ m.power||'—' }}</small><span>{{ m.pp }} / {{ m.maxpp }} PP</span></battle-move-button></div>
    <div v-else-if="canAct" class="raid-main-actions"><button class="raid-attack" data-keyboard-number="1" @click="panel='moves'" data-raid-attack>Attaquer <span>→</span></button><button class="raid-pass" data-keyboard-number="2" :disabled="busy||!hasRelayTarget" @click="passing=true">Passer la main ↗</button><button class="raid-retreat" data-keyboard-number="3" :disabled="busy" @click="retreat=true">Retirer mon Pokémon</button></div>
    <button v-if="canAct&&!targeting&&panel==='moves'" class="raid-back" @click="panel='home'">← Actions</button>
    <p v-if="error" class="raid-error" role="alert">{{ error }}</p>
   </div>
   <button v-else-if="!playing" class="raid-return" @click="$emit('results')">Voir le bilan du raid →</button>
   </div>
  </div>
  <div v-back="()=>{retreat=false;help=false;}" v-if="retreat||help" class="raid-confirm" @keydown.esc.stop="retreat=false;help=false"><section><template v-if="retreat"><h3>Retirer {{ current.name }} ?</h3><p>Il quitte définitivement ce raid et reste dans ta collection avec ses PV actuels. Il ne pourra pas revenir dans le combat.</p><button @click="retreat=false">Rester</button><button class="raid-retreat" :disabled="busy" @click="submit({action:'retreat',confirm:true});retreat=false">Le mettre à l’abri</button></template><template v-else><h3>Quatre alliés, une seule chance</h3><p>Les quatre jauges orange se partagent 100 % de l’attention du boss. La part la plus élevée attire ses attaques ciblées. Les dégâts, soins réellement reçus et soutiens réussis la font monter. Les soins sont proportionnels aux PV réellement rendus. Les protections rapportent aussi de l’aggro à leur poseur quand elles évitent des dégâts à un allié. Par Ici et Poudre Fureur permettent de protéger les autres. Le boss agit après le nombre d’actions indiqué. Sa rage augmente surtout quand il perd beaucoup de PV dans un même tour, jusqu’à +70 % de dégâts. Une attaque monocible du boss réduit l’aggro de sa cible selon les PV réellement perdus. En multijoueur, la main ✋ sur ta carte permet de demander une action sans la prendre automatiquement. La cible suit l’aggro jusqu’au déclenchement, même pour Colère. Par Ici, Poudre Fureur et certains talents peuvent rediriger une attaque. Après un coup reçu, l’aggro de la cible diminue : elle peut donc ne plus être en tête après l’impact. Les attaques de zone ignorent l’aggro.</p><p>À partir de deux dresseurs, vos attaques infligent 20 % de dégâts supplémentaires au boss. Les statuts présents avant le raid sont conservés.</p><p>En solo, chaque Pokémon dispose de 30 secondes pour décider. Chaque action est résolue avant le choix suivant : observe l’intention du boss pour réagir. Les attaques de zone peuvent aussi toucher tes alliés selon leur portée. Coup d’Main renforce la prochaine attaque de l’allié choisi, même s’il a déjà agi.</p><p>Brise les boucliers à 70 % et 30 %. Passer la main donne ta réserve d’action à un allié, même s’il a déjà joué, avec 30 secondes pour décider. Les quatre réserves peuvent être concentrées sur le même Pokémon. Une réserve ne peut pas revenir à un Pokémon qui l’a déjà transmise. Relais et les capacités exigeant un remplaçant sont indisponibles ; Demi-Tour et Change Éclair infligent leurs dégâts sans changer de Pokémon. Vœu soigne le prochain allié qui agit au tour suivant.</p><p>Le boss peut mettre un Pokémon K.O. en une seule attaque. Les talents et objets protecteurs gardent leurs effets habituels. <template v-if="permanentDeaths">Les K.O. sont définitifs sans Kit de survie.</template><template v-else-if="training">Cet entraînement préserve exactement ton équipe d’Aventure : PV, PP et objets compris.</template><template v-else>Sur Safari, tes Pokémon restent simplement K.O. : tu peux les soigner après le raid et leur Kit de survie reste intact.</template></p><button @click="help=false">Continuer</button></template></section></div>
  <slot name="social-chat"/>
 </section>
</template>
<script>
import BattleAmbience from '../battle/BattleAmbience.vue';
import BattlePlayerGround from '../battle/BattlePlayerGround.vue';
import BattleSendOut from '../battle/BattleSendOut.vue';
import BattleMoveButton from '../battle/BattleMoveButton.vue';
import {isAreaMove} from '@/services/moveInspection';
import RaidMist from './RaidMist.vue';
import RaidStatStages from './RaidStatStages.vue';
import RaidAllyCard from './RaidAllyCard.vue';
import RaidFieldEffects from './RaidFieldEffects.vue';
import RaidShield from './RaidShield.vue';
import BattleStatusPill from '../battle/BattleStatusPill.vue';
import HealthBar from '../HealthBar.vue';
import RaidCorruptionEffect from './RaidCorruptionEffect.vue';
import PokemonPortrait from '../PokemonPortrait.vue';
import BattleMoveEffect from '../battle/BattleMoveEffect.vue';
import BattlePersistentEffect from '../battle/BattlePersistentEffect.vue';
import BattleStatChange from '../battle/BattleStatChange.vue';
import BattleRain from '../battle/BattleRain.vue';
import BattleSnow from '../battle/BattleSnow.vue';
import BattleSandstorm from '../battle/BattleSandstorm.vue';
import BattleWeatherInfo from '../battle/BattleWeatherInfo.vue';
import { moveVisual } from '@/services/moveVisuals';
import {moveOrigin} from '@/services/moveOrigin';
import BattleStatusEffect from '../battle/BattleStatusEffect.vue';
import {nativeStatusVisual,STATUS_VISUALS,statusEffectDuration,effectSourceLabel} from '@/services/battleStatusVisuals';
import {BATTLE_PACING,battleReadingTime} from '@/services/battlePacing';
import { raidMovePlan, EFFECT_DETAILS } from '@/services/raidPresentation';
import {spriteTint} from '@/services/spriteTint';
import timing from '../../../../data/game/raid_presentation.json';
import { localizeTypeName, typeBadgeStyle } from '@/services/pokemonTypes';
import {darkBattleBackgroundKey,darkBattleBackgrounds} from '@/services/darkBattleBackgrounds';
export default {
  components: {BattleSendOut,BattleAmbience,BattlePlayerGround,BattleStatusEffect,BattleMoveButton,
    RaidMist,RaidStatStages,RaidAllyCard,RaidFieldEffects,RaidShield,BattleStatusPill,HealthBar,
    RaidCorruptionEffect,
    PokemonPortrait,
    BattleMoveEffect,
    BattlePersistentEffect,
    BattleStatChange,
    BattleRain,
    BattleSnow,
    BattleSandstorm,
    BattleWeatherInfo
  },
  props: {
    mapName: {type:String,default:''},
    finalRift: Boolean,
    training: Boolean,
    frame: Object,
    difficulty: String,
    permanentDeaths:{type:Boolean,default:true},
    busy: Boolean,
    error: String,
    reduced: Boolean
  },
  data: () => ({entryPokemon:null,entryPosition:null,
    statusFx:null,statusNonce:0,
    consoleHeight: 0,
    display: null,
    bossFainted: false,
    slot: 0,
    shown: 0,
    selectedMove: null,
    passing: false,
    retreat: false,
    help: false,
    loading: true,
    playing: false,
    fx: null,
    effect: null,
    amount: 0,
    cardHits: {}, shieldDamage:null, focusPhase:'', panel:'home', announcement:'', relayTarget:null, actionOrder:[],
    message: '',
    phaseEffect: '',
    corruptionFx: null,
    clock: Date.now()
  }),
  computed: {
    backgroundEnvironment(){return darkBattleBackgroundKey(this.mapName,this.finalRift);},
    backgrounds() {return darkBattleBackgrounds[darkBattleBackgroundKey(this.mapName,this.finalRift)];},
    main() {
      return this.display?.allies[this.shown];
    },
    current() {
      return this.frame.allies[this.slot];
    },
    targeting() {
      return this.passing || !!this.selectedMove;
    },
    shieldPercent() { return this.display?.shield?.hp>0?Math.min(100,this.display.shield.hp/this.display.shield.max*100):0; },
    bossTargetable() { return !this.playing&&!this.loading&&!this.busy&&!this.passing&&!this.areaMove(this.selectedMove)&&!!this.selectedMove?.targets.some(t=>t.slot===4); },
    activeEffects() {
      const f=this.display||this.frame;
      return [...(f.sideEffects||[]).flatMap((effects,side)=>effects.map(e=>({...e,key:side+':'+e.id,enemy:side===1,description:EFFECT_DETAILS[e.id]||'Effet de camp actif'}))),...(f.fieldEffects||[]).map(e=>({...e,key:'field:'+e.id,description:EFFECT_DETAILS[e.id]||'Effet de terrain actif'}))];
    },
    hasRelayTarget() {return this.frame.relayTargets?this.frame.relayTargets.length>0:this.frame.allies.some((p,i)=>i!==this.slot&&!p.ready&&p.currentHp>0&&!p.withdrawn);},
    canAct() {
      return !this.frame.finished && !this.loading && !this.playing && !this.focusPhase && !this.busy && this.current?.canControl && !this.current.ready && this.current.currentHp > 0 && !this.current.withdrawn && (this.frame.currentSlot===undefined||this.frame.currentSlot===this.slot) && (!this.frame.soloClock || this.frame.soloClock.slot===this.slot);
    },
    needsChoice() {
      return this.frame.allies.some(p => p.canControl && !p.ready && p.currentHp > 0 && !p.withdrawn);
    },
    pendingMine() {
      return this.frame.allies.filter(p => p.canControl && p.currentHp > 0 && !p.withdrawn).every(p => p.ready);
    },
    remaining() {
      const start=Math.max(this.clock,this.frame.playbackUntil||0);
      return Math.max(0,Math.min(30,Math.ceil((this.frame.deadline-start)/1000)));
    },
    weather() {
      return {
        raindance: 'rain',
        sunnyday: 'sun',
        sandstorm: 'sandstorm',
        hail: 'hail',
        snowscape: 'snow'
      }[this.display ? this.display.weather : this.frame.weather] || null;
    }
  },
  watch: {
    frame: {
      immediate: true,
      handler(frame) {
        if (!frame) return;
        this._serverOffset = frame.serverNow - Date.now();
        this._frames ||= [];
        this._frames.push(JSON.parse(JSON.stringify(frame)));
        void this.play();
      }
    },
    'frame.soloClock.slot'() { this.retreat=false; },
    'frame.token'() {
      this.retreat=false;this.cancelTarget();
      if(!this.playing)this.message = '';
      this.autoSlot();
    }
  },
  mounted() {
    this._previous = document.activeElement;
    this.$refs.dialog.focus({
      preventScroll: true
    });
    this._clock = setInterval(() => {
      this.clock = Date.now() + (this._serverOffset || 0);
    }, 250);
    this._receivedAt = Date.now();
    this._visibility=()=>{if(document.hidden){this._readUntil=0;for(const done of this._waiters||[])done();this.statusFx=null;}};
    document.addEventListener('visibilitychange',this._visibility);
    // Observe intrinsic deck content, never the animated container or the scene.
    // Layout work only runs when content/viewport dimensions actually change.
    this.$nextTick(() => {
      if (this._closed || !this.$refs.consoleBody) return;
      this._consoleObserver = new ResizeObserver(this.measureConsole);
      this._consoleObserver.observe(this.$refs.consoleBody);
      this.measureConsole();
    });
  },
  beforeDestroy() {
    this._closed = true;this.$emit('audio-stop');
    document.removeEventListener('visibilitychange',this._visibility);
    this._consoleObserver?.disconnect();
    cancelAnimationFrame(this._consoleMeasure);
    clearInterval(this._clock);clearTimeout(this._announcementTimer);
    for (const done of this._waiters || []) done();
    if (this._previous?.isConnected) this._previous.focus({
      preventScroll: true
    });
  },
  methods: {
    clearStatusFx(nonce){if(this.statusFx?.nonce===nonce)this.statusFx=null;},
    tintStyle(slot){return spriteTint(this.statusFx?.slot===slot?this.statusFx:null,this.effect?.slot===slot&&['-boost','-unboost'].includes(this.effect.kind)?this.statEffect(this.effect):[],this.reduced,slot===4?'drop-shadow(0 0 10px #9853c844)':'');},
    say(text,move=false){this.message=text;this._readUntil=performance.now()+battleReadingTime(text,{move,hidden:document.hidden});},
    async holdNarration(){const ms=(this._readUntil||0)-performance.now();if(ms>0&&!document.hidden)await this.sleep(ms);},
    statusPosition(slot){const p=this.point(slot),size=slot===4?210:190;return {left:`${p.x-size/2}px`,top:`${p.y-size/2}px`,width:`${size}px`,height:`${size}px`};},
    async statusCue(e){const cue=nativeStatusVisual(e);if(!cue)return null;await this.finishMoveFx();this.fx=null;if(e.slot<4)await this.focusAlly(e.slot);if(this._closed)return null;this.statusFx={...cue,slot:e.slot,nonce:++this.statusNonce};this.$emit('cue',{kind:'status',status:cue.status});return cue;},
    measureConsole() {
      cancelAnimationFrame(this._consoleMeasure);
      this._consoleMeasure = requestAnimationFrame(() => {
        if (this._closed || !this.$refs.consoleBody) return;
        const height = Math.ceil(this.$refs.consoleBody.getBoundingClientRect().height) + 2;
        if (Math.abs(this.consoleHeight - height) > 1) this.consoleHeight = height;
      });
    },
    type: localizeTypeName,
    color: t => typeBadgeStyle(t)['--pokemon-type-color'] || '#99a9b6',
    percent: p => Math.max(0, Math.min(100, p.currentHp / p.maxHp * 100)),
    status: s => ({
      burn: 'BRÛ',
      poison: 'PSN',
      badly_poison: 'PSN+',
      paralyze: 'PAR',
      sleep: 'SOM',
      freeze: 'GEL'
    })[s] || s,
    sprite(p, back = false) {
      return this.$pokemonSprite({
        ...p,
        data: {
          id: p.pokemonId
        }
      }, {
        side: back ? 'back' : 'front',
        animated: !this.reduced
      });
    },
    onKey(e) {
      if (e.key === 'Escape') {
        this.cancelTarget();
        this.retreat = false;
        this.help = false;
      }
      if (e.key !== 'Tab') return;
      const list = [...this.$el.querySelectorAll('button:not(:disabled),input')].filter(n => n.getClientRects().length),
        a = list[0],
        b = list.at(-1);
      if (e.shiftKey && [a, this.$el].includes(document.activeElement)) {
        e.preventDefault();
        b?.focus();
      } else if (!e.shiftKey && document.activeElement === b) {
        e.preventDefault();
        a?.focus();
      }
    },
    statEffect(e) {
      const n = Number(e.value) || 1;
      return [{
        kind: e.kind === '-boost' ? 'up' : 'down',
        delta: e.kind === '-boost' ? n : -n,
        key: e.effect,
        text: {
          atk: 'Attaque',
          def: 'Défense',
          spa: 'Att. Spé.',
          spd: 'Déf. Spé.',
          spe: 'Vitesse',
          accuracy: 'Précision',
          evasion: 'Esquive'
        }[e.effect] || e.effect
      }];
    },
    bossTargets(i) {
      return this.display.intention ? !this.display.intention.area&&this.display.intention.target===i : !this.playing&&this.display.focus===i;
    },
    cardOrder(i) {return (this.actionOrder.length?this.actionOrder:this.display.order).filter(n=>n!==4).indexOf(i)+1;},
    areaMove:isAreaMove,
    targetable(i) {
      if (this.playing || this.loading || this.busy || this.focusPhase) return false;
      if (this.passing) return this.frame.relayTargets?this.frame.relayTargets.includes(i):i !== this.slot && !this.frame.allies[i].ready && this.frame.allies[i].currentHp > 0 && !this.frame.allies[i].withdrawn;
      if (this.selectedMove) return this.selectedMove.targets.some(t => t.slot === i);
      return (this.frame.currentSlot===undefined||this.frame.currentSlot===i) && this.frame.allies[i].canControl && !this.frame.allies[i].ready && this.frame.allies[i].currentHp > 0 && !this.frame.allies[i].withdrawn;
    },
    handRequest(i){return this.frame.handRequests?.find(r=>r.slot===i);},
    requestable(i){return !!this.frame.multiplayer&&!this.frame.finished&&this.frame.allies[i]?.canControl&&!this.current?.canControl&&!!this.frame.relayTargets?.includes(i);},
    requestHand(i){if(this.busy)return;this.$emit('action',{action:this.handRequest(i)?.mine?'cancelHandRequest':'requestHand',slot:i,token:this.frame.token});},
    chooseCard(i) {
      if (this.passing) {
        this.submit({
          action: 'pass',
          target: i
        });
        return;
      }
      if (this.selectedMove) {
        if(this.areaMove(this.selectedMove))return;
        const t = this.selectedMove.targets.find(t => t.slot === i);
        if (t) this.sendMove(t.loc);
        return;
      }
      if(this.frame.soloClock&&this.frame.soloClock.slot!==i){this.$emit('action',{action:'focus',slot:i,token:this.frame.token});return;}
      this.slot = i;
      void this.focusAlly(i);
    },
    move(m) {
      if (!this.canAct) return;
      this.selectedMove = m;
      if (['normal', 'any', 'adjacentAlly', 'adjacentAllyOrSelf', 'adjacentFoe'].includes(m.targetKind)) {
        // Keep the target choice visible, even when the boss is the sole legal target.
      } else if(!this.areaMove(m))this.sendMove();
    },
    sendMove(targetLoc) {
      const m = this.selectedMove;
      if (m) this.submit({
        action: 'attack',
        moveIndex: m.index,
        targetLoc
      });
    },
    targetBoss() { if(this.selectedMove && this.areaMove(this.selectedMove))return; if(this.bossTargetable)this.sendMove(this.selectedMove.targets.find(t=>t.slot===4).loc); },
    cancelTarget() {
      this.panel='home';
      this.selectedMove = null;
      this.passing = false;
    },
    submit(data) {
      if (!this.canAct) return;
      this.$emit('action', {
        ...data,
        slot: this.slot,
        token: this.frame.token
      });
      this.cancelTarget();
    },
    autoSlot() {
      const i = this.frame.currentSlot ?? this.frame.soloClock?.slot ?? this.frame.allies.findIndex(p => p.canControl && !p.ready && p.currentHp > 0 && !p.withdrawn);
      if (i >= 0) this.slot = i;
    },
    sleep(ms) {
      if (this._closed || document.hidden) return Promise.resolve();
      return new Promise(resolve => {
        this._waiters ||= new Set();
        const done = () => {
            clearTimeout(timer);
            this._waiters.delete(done);
            resolve();
          },
          timer = setTimeout(done, ms);
        this._waiters.add(done);
      });
    },
    point(slot) {
      const stage = this.$refs.stage,
        node = this.$refs[slot === 4 ? 'boss' : 'ally']?.querySelector('.pokemon-portrait');
      if (!stage || !node) return {
        x: 0,
        y: 0,
        groundY: 0
      };
      const r = stage.getBoundingClientRect(),
        p = node.getBoundingClientRect();
      return {
        x: p.left - r.left + p.width / 2,
        y: p.top - r.top + p.height * .5,width:p.width*.78,height:p.height*.78,
        groundY: p.bottom - r.top
      };
    },
    announce(text) {
      clearTimeout(this._announcementTimer);this.announcement=text;
      this._announcementTimer=setTimeout(()=>{this.announcement='';},timing.announcementMs);
    },
    warnForFrame(frame) {
      if(frame.finished)return;
      if(frame.intention){
        if(this._announcedIntention===frame.intention.id)return;
        this._announcedIntention=frame.intention.id;
        const i=frame.intention,target=i.area?'tous les alliés':frame.allies[i.target]?.name;
        this.announce(frame.boss.name+' prépare '+i.move+' ! Cible : '+target+' · Dans '+i.remaining+' actions.');return;
      }
      if(!frame.warning||this._announcedToken===frame.token)return;
      this._announcedToken=frame.token;this.announce((frame.warning.nextTurn?'Prochain tour : ':'')+frame.warning.move+' va frapper tous les alliés !');
    },
    prepareAudio(payload){return this.$listeners['prepare-audio']?new Promise(done=>this.$emit('prepare-audio',{...payload,done})):Promise.resolve();},
    entryCrySound(timing={}){if(!this._closed&&this.entryPokemon)this.$emit('sample',{kind:'cry',pokemon:this.entryPokemon,...timing});},
    async focusAlly(slot) {
      if(slot<0||slot>=4||this.shown===slot||this._closed)return;
      this.corruptionFx={id:Math.random(),kind:'swapOut',point:this.point(this.shown)};
      this.focusPhase='ally-leave';await this.sleep(this.reduced?0:timing.focusOutMs);if(this._closed)return;
      this.shown=slot;this.focusPhase='ally-enter';await this.$nextTick();this.corruptionFx={id:Math.random(),kind:'swapIn',point:this.point(slot)};await this.sleep(this.reduced?0:timing.focusInMs);this.focusPhase='';
    },
    async finishMoveFx() {
      if(!this.reduced&&this.fx&&this._impactAt)await this.sleep(Math.max(0,this.fx.impactMs-(performance.now()-this._impactAt)));
      this._impactAt=0;
    },
    async animate(e, events, index) {
      await this.finishMoveFx();if(this._closed)return;
      this.fx=null;this.cardHits={};this.shieldDamage=null;this._sequentialMove=null;await this.prepareAudio({moves:[e.moveName]});if(this._closed)return;
      await this.focusAlly(e.healing?e.target:e.slot<4?e.slot:e.target<4?e.target:this.shown);
      await this.sleep(this.reduced?0:e.slot===4?timing.bossPauseMs:timing.betweenActionsMs);
      this.say(e.message,true);this.effect={...e,id:Math.random()};this.amount=0;await this.$nextTick();
      const v=moveVisual(e),plan=raidMovePlan(events,index,this.display),start=this.point(e.slot),fullTargets=plan.targets.map(t=>({...t,...this.point(t.slot)}));
      // The large visible Pokémon receives the scene effect; the other allies
      // receive individual impacts and exact damage on their four persistent cards.
      const targets=fullTargets.filter(t=>t.slot===4||t.slot===this.shown),end=targets[0]||this.point(e.target??4);
      const origin=moveOrigin(start,end,{own:e.slot<4,family:v.family,self:['self','allySide','allyTeam'].includes(e.moveTarget),delayed:plan.prepared});
      const fx={...v,id:Math.random(),stage:'windup',windupMs:Math.max(v.windupMs,timing.windupMinMs),travelMs:Math.max(v.travelMs,timing.travelMinMs),impactMs:Math.max(v.impactMs,timing.impactMinMs),fullTargets,result:{success:!plan.failed&&!plan.prepared},path:{startX:origin.x,startY:origin.y,targetX:end.x,targetY:end.y,groundY:end.groundY,targets}};
      const sequential=e.slot===4&&plan.targets.filter(t=>t.slot<4).length>1&&['allAdjacent','allAdjacentFoes','all','allies'].includes(e.moveTarget);
      if(sequential){this._sequentialMove={event:e,visual:v,plan,seen:new Set()};this.announce(e.message.replace(/ utilise .*$/,'')+' : '+(e.message.split(' utilise ')[1]||e.moveName).replace(/ !$/,'')+' frappe les alliés !');}
      this.fx=fx;this.$emit('sample',{kind:'move',name:e.moveName,duration:(fx.windupMs+fx.travelMs+fx.impactMs)/1000});await this.sleep(this.reduced?20:fx.windupMs);if(this._closed)return;
      if(sequential){this.fx={...fx,stage:'await'};return;}
      this.fx={...fx,stage:plan.prepared?'windup':'travel'};await this.sleep(this.reduced?20:fx.travelMs);if(this._closed)return;
      this.fx={...fx,stage:plan.prepared?'await':e.damageClass==='status'||e.healing?'aura':'await'};
      if(e.damageClass==='status'||e.healing)await this.sleep(this.reduced?20:timing.statusMs);
    },
    async replayAreaTarget(e) {
      const replay=this._sequentialMove,slot=e.kind==='-miss'?e.target:e.slot;if(!replay||slot===null||slot>=4||replay.seen.has(slot))return;
      const target=replay.plan.targets.find(t=>t.slot===slot);if(!target)return;
      replay.seen.add(slot);await this.finishMoveFx();this.fx=null;await this.focusAlly(slot);if(this._closed)return;
      const start=this.point(4),end={...target,...this.point(slot)},v=replay.visual;
      this.fx={...v,id:Math.random(),stage:'travel',impactMs:Math.max(v.impactMs,timing.impactMinMs),travelMs:timing.aoeTravelMs,fullTargets:[end],result:{success:target.connected,hits:1},path:{startX:start.x,startY:start.y,targetX:end.x,targetY:end.y,groundY:end.groundY,targets:[end]}};
      await this.sleep(this.reduced?20:timing.aoeTravelMs);if(this._closed)return;
      this.fx={...this.fx,stage:'await'};
    },
    async faintBoss() {
      if(this.bossFainted)return;
      await this.finishMoveFx();this.fx=null;this.effect=null;this.amount=0;
      this.$set(this.display.boss,'currentHp',0);this.$set(this.display,'shield',null);
      this.bossFainted=true;this.say(this.display.boss.name+' est K.O.');
      await this.sleep(this.reduced?20:1000);
    },
    async recallAlly(e) {
      await this.finishMoveFx();this.fx=null;await this.focusAlly(e.slot);if(this._closed)return;
      this.say(this.display.allies[e.slot].name+' est mis à l’abri.');this.focusPhase='ally-recall';this.corruptionFx={id:Math.random(),kind:'recall',point:this.point(e.slot)};
      await this.sleep(this.reduced?20:timing.recallMs);this.$set(this.display.allies[e.slot],'withdrawn',true);this.focusPhase='';
    },
    async relay(e) {
      await this.finishMoveFx();this.fx=null;await this.focusAlly(e.slot);this.relayTarget=e.target;this.focusPhase='ally-relay';
      this.corruptionFx={id:Math.random(),kind:'relay',point:this.point(e.slot)};
      const order=this.actionOrder.length?this.actionOrder:this.display.order;const next=[...order],at=next.indexOf(e.slot);if(at>=0)next.splice(at,1,e.target);this.actionOrder=next;
      this.say(this.display.allies[e.slot].name+' passe la main à '+this.display.allies[e.target].name+'.');
      await this.sleep(this.reduced?20:timing.relayMs);this.focusPhase='';await this.focusAlly(e.target);this.relayTarget=null;
    },
    async showDamage(e) {
      const p=e.slot===4?this.display.boss:this.display.allies[e.slot];if(!p)return;
      const amount=Math.abs(p.currentHp-e.hp),target=this.fx?.fullTargets.find(t=>t.slot===e.slot);
      await this.finishMoveFx();if(this._closed)return;
      this.amount=amount;this.effect={...e,id:Math.random(),critical:!!target?.critical};
      if(e.slot<4)this.$set(this.cardHits,e.slot,{...this.effect,amount});
      if(e.kind==='-damage'&&e.direct!==false&&target?.connected&&(e.slot===4||e.slot===this.shown)){
        this._impactAt=performance.now();this.fx={...this.fx,stage:'impact',pulse:(this.fx.pulse||0)+1,result:{success:true,hits:1,critical:target.critical},path:{...this.fx.path,targets:[target]}};
      }
      if(e.kind==='-heal'&&this.fx?.family==='drain'&&!this.reduced){await this.finishMoveFx();this.fx={...this.fx,stage:'drain'};await this.sleep(BATTLE_PACING.drain);}
      this.$set(p,'currentHp',e.hp);if(e.maxHp)this.$set(p,'maxHp',e.maxHp);
      if(e.kind==='-damage'&&amount)this.$emit('impact',{damage:amount,maxHp:p.maxHp,direct:e.direct!==false,critical:e.direct!==false&&target?.critical,effectiveness:e.direct!==false?target?.effectiveness:1});
      if(e.kind==='-damage'&&e.direct!==false&&target?.critical)this.say('Coup critique !');
      if(e.kind==='-heal'||e.direct===false){
        const reason=effectSourceLabel(e)?' · '+effectSourceLabel(e):'';
        this.say(p.name+(e.kind==='-heal'?' récupère ':' perd ')+amount+' PV'+reason+'.');
      }
      await this.sleep(this.reduced?25:e.direct===false?Math.max(BATTLE_PACING.residual,statusEffectDuration(nativeStatusVisual(e))):timing.damageMs);
    },
    collectiveEvent(e) {
      const sideEvent=e.kind.startsWith('-side'),key=sideEvent?'sideEffects':'fieldEffects';
      if(!this.display[key])this.$set(this.display,key,sideEvent?[[],[]]:[]);
      const current=sideEvent?this.display[key][e.side]:this.display[key],end=e.kind.endsWith('end'),next=current.filter(x=>x.id!==e.effect);
      if(!end)next.push({id:e.effect,name:e.name,turns:e.turns});
      if(sideEvent)this.$set(this.display[key],e.side,next);else this.$set(this.display,key,next);
      this.say(e.name+(end?' se dissipe.':EFFECT_DETAILS[e.effect]?' : '+EFFECT_DETAILS[e.effect]+'.':sideEvent?(e.side===0?' est actif sur votre camp.':' est actif sur le camp du boss.'):' est actif sur le terrain.'));
    },
    async play() {
      if(this.playing||this._closed)return;this.playing=true;
      try{while(this._frames.length&&!this._closed){
        const frame=this._frames.shift(),eventKey=frame.eventKey||frame.token;
        if(!this.display){
          this.display=JSON.parse(JSON.stringify(frame));this.bossFainted=frame.boss.currentHp<=0;this._eventToken=eventKey;await this.prepareAudio({pokemon:[frame.boss,...frame.allies],moves:frame.allies.filter(p=>p.canControl).flatMap(p=>p.abilities||[])});if(this._closed)return;await this.sleep(0);
          await Promise.race([Promise.all([this.backgrounds.wide,this.backgrounds.mobile,...[frame.boss,...frame.allies].flatMap(p=>[this.sprite(p),this.sprite(p,true)])].map(src=>new Promise(done=>{const i=new Image();i.onload=i.onerror=done;i.src=src;}))),this.sleep(5000)]);
          await this.sleep(this.reduced?0:900);this.loading=false;this.entryPokemon=frame.allies.find(p=>p.canControl&&p.currentHp>0)||frame.allies.find(p=>p.currentHp>0);const point=this.point(this.shown);this.entryPosition={left:point.x+'px',top:point.y+'px'};if(this.reduced)this.entryCrySound();this.phaseEffect=this.bossFainted?'':'boss-arrives';this.$emit('sound','raidEnter');await this.$nextTick();this.corruptionFx={id:Math.random(),kind:'entry',point:this.point(4)};await this.sleep(this.reduced?0:850);this.phaseEffect='';this.entryPokemon=null;
        }
        const events=eventKey!==this._eventToken?frame.events||[]:[];this._eventToken=eventKey;
        for(let i=0;i<events.length&&!this._closed;i++){
          const e=events[i];
          if(['-crit','-supereffective','-resisted'].includes(e.kind))continue;
          if(e.kind==='bossRage'){this.$set(this.display.boss,'rage',{value:e.value,bonusPercent:e.bonusPercent,maximum:e.maximum,highThreshold:e.highThreshold});continue;}
          if(e.kind==='aggro'){if(e.shares)this.display.allies.forEach((p,i)=>this.$set(p,'aggro',e.shares[i]||0));else if(this.display.allies[e.slot])this.$set(this.display.allies[e.slot],'aggro',e.value);if(this.display.intention&&!this.display.intention.area&&e.focus!==undefined)this.$set(this.display.intention,'target',e.focus);continue;}
          if(e.kind==='weather'){this.$set(this.display,'weather',e.effect);continue;}
          if(e.kind==='-singleturn'&&/Helping Hand/.test(e.effect||'')){await this.holdNarration();const p=this.display.allies[e.slot];if(p){this.$set(p,'effects',{...p.effects,helpingHand:true});this.say('Coup d’Main renforce la prochaine attaque de '+p.name+'.');await this.sleep(this.reduced?20:timing.statusMs);}continue;}
          if(e.kind==='intention'){if(this.display.intention){this.$set(this.display.intention,'remaining',e.remaining);if(!this.display.intention.area)this.$set(this.display.intention,'target',e.target);}continue;}
          if(['upkeep','turn'].includes(e.kind)){this._sequentialMove=null;continue;}
          await this.finishMoveFx();await this.holdNarration();if(this._closed)break;
          this.statusFx=null;
          if(e.kind==='move'){if(e.slot===4)this.$set(this.display,'intention',null);await this.animate(e,events,i);continue;}
          if(['-damage','-heal','-immune','-miss','-activate','-crit','-boost','-unboost','-status'].includes(e.kind))await this.replayAreaTarget(e);
          const p=e.slot===4?this.display.boss:this.display.allies[e.slot];
          const cue=p?await this.statusCue(e):null;
          if(p&&['-boost','-unboost'].includes(e.kind)){this.fx=null;if(e.slot<4)await this.focusAlly(e.slot);}
          if(['-damage','-heal'].includes(e.kind)){await this.showDamage(e);continue;}
          this.effect={...e,id:Math.random()};this.amount=0;
          if(e.kind==='shield'){
            this.$set(this.display,'shield',{hp:e.hp||frame.shield?.max||1,max:e.max||frame.shield?.max||1});this.phaseEffect='shield-appears';this.corruptionFx={id:Math.random(),kind:'shield',point:this.point(4)};this.say('Le bouclier de corruption se déploie.');this.$emit('sound','raidShield');await this.sleep(this.reduced?30:timing.shieldMs);
          }else if(e.kind==='shieldHit'){
            const max=e.max||this.display.shield?.max||frame.shield?.max||1,hp=e.hp??Math.max(0,(this.display.shield?.hp||max)-e.amount);
            this.$set(this.display,'shield',{hp,max});this.corruptionFx={id:Math.random(),kind:'shieldHit',point:this.point(4)};this.shieldDamage={id:Math.random(),amount:e.amount};this.phaseEffect='shield-hit';this.$emit('sound','raidHit');this.say('Le bouclier absorbe '+e.amount+' dégâts.');await this.sleep(this.reduced?30:timing.shieldMs);
          }else if(e.kind==='shieldBreak'){
            this.$set(this.display,'shield',{hp:0,max:e.max||this.display.shield?.max||1});this.$set(this.display,'vulnerableTurns',2);this.phaseEffect='shield-break';this.corruptionFx={id:Math.random(),kind:'shieldBreak',point:this.point(4)};this.say('Bouclier détruit ! Deux tours de répit.');this.$emit('sound','raidBreak');await this.sleep(this.reduced?30:timing.shieldBreakMs);

          }else if(e.kind==='retreat'&&p){await this.recallAlly(e);this.say(p.name+(e.reason==='timeout'?' est retiré en sécurité : son délai est écoulé.':' est mis à l’abri.'));await this.sleep(this.reduced?30:timing.resultMs);
          }else if(e.kind==='pass'){await this.relay(e);
          }else if(e.kind==='passFailed'){this.say(e.kind==='pass'?p.name+' passe la main à '+this.display.allies[e.target]?.name+'.':'Le relais échoue : cet allié ne peut pas recevoir cette réserve.');await this.sleep(this.reduced?30:timing.resultMs);
          }else if(e.kind==='-activate'&&p&&/Protect|Wide Guard|Mat Block|Quick Guard/.test(e.effect||'')){this.$set(p,'effects',{...p.effects,shield:true});this.say(p.name+' est protégé !');await this.sleep(this.reduced?20:timing.statusMs);
          }else if(cue&&['-start','-end','-activate','cant'].includes(e.kind)){this.say(p.name+' · '+STATUS_VISUALS[cue.status].label+'.');await this.sleep(this.reduced?30:Math.max(timing.statusMs,statusEffectDuration(cue)));
          }else if(e.kind==='-crit'){await this.sleep(this.reduced?20:180);
          }else if(['-boost','-unboost'].includes(e.kind)&&p){this.$emit('cue',{kind:e.kind==='-boost'?'stat-up':'stat-down'});this.$set(p,'boosts',{...p.boosts,[e.effect]:Math.max(-6,Math.min(6,(p.boosts[e.effect]||0)+(e.kind==='-boost'?1:-1)*Number(e.value)))});this.say(p.name+' : '+this.statEffect(e)[0].text+(e.kind==='-boost'?' augmente.':' diminue.'));await this.sleep(this.reduced?30:timing.statMs);
          }else if(['-sidestart','-sideend','-fieldstart','-fieldend'].includes(e.kind)){this.collectiveEvent(e);await this.sleep(this.reduced?30:Math.max(timing.statusMs,statusEffectDuration(cue)));
          }else if(['-status','-curestatus'].includes(e.kind)&&p){this.$set(p,'status',e.kind==='-curestatus'?'normal':({brn:'burn',psn:'poison',tox:'badly_poison',par:'paralyze',slp:'sleep',frz:'freeze'})[e.effect]||e.effect);this.say(p.name+(e.kind==='-curestatus'?' est rétabli.':' : '+this.status(p.status)+'.'));await this.sleep(this.reduced?30:Math.max(timing.statusMs,statusEffectDuration(cue)));
          }else if(e.kind==='faint'&&e.slot===4){await this.faintBoss();
          }else if(['-immune','-miss','-fail','cant','faint'].includes(e.kind)&&p){if(e.kind==='-miss')this.$emit('cue',{kind:'miss'});this.say(e.kind==='-immune'?p.name+' est immunisé.':e.kind==='-miss'?'L’attaque manque sa cible.':e.kind==='faint'?p.name+(e.slot<4&&frame.allies[e.slot]?.survivalKitUsed?' reste K.O. : son Kit de survie a été consommé.':e.slot<4&&frame.allies[e.slot]?.permanentlyLost?' est définitivement perdu.':' est K.O.'):e.kind==='cant'?p.name+' ne peut pas agir.':'La capacité échoue.');await this.sleep(this.reduced?30:timing.resultMs);}
          this.phaseEffect='';
        }
        await this.finishMoveFx();await this.holdNarration();this.statusFx=null;if(frame.boss.currentHp<=0&&!this.bossFainted)await this.faintBoss();this.display=JSON.parse(JSON.stringify(frame));this.fx=null;this.effect=null;this.amount=0;this.actionOrder=[];this.cardHits={};this.shieldDamage=null;this.message='';this.phaseEffect='';
      }}finally{
        this.warnForFrame(this.frame);this.autoSlot();if(!this._closed)await this.focusAlly(this.slot);this.playing=false;
        if(!this._closed&&(this.frame.flowVersion===2||this.frame.soloClock)&&this.current?.canControl&&!this.frame.finished&&this._presentedToken!==this.frame.token){this._presentedToken=this.frame.token;this.$emit('action',{action:'presented',slot:this.slot,token:this.frame.token});}
        if(this._frames.length&&!this._closed)void this.play();
      }
    }
  }
};
</script>
<style scoped>
/* One flow for every decision state: no absolute buttons or shared grid cells. */.raid-controls{min-width:0;display:flex;flex-direction:column;gap:7px}
.raid-main-actions,.raid-moves{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;width:100%}
.raid-main-actions button{min-height:44px;font-size:11px}
.raid-main-actions .raid-attack{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;background:var(--journal-accent);color:var(--journal-paper);font-weight:700}
.raid-moves>button{min-width:0;min-height:48px;text-align:left;padding:6px 8px;border-color:var(--move-color);border-left-width:4px;background:color-mix(in srgb,var(--move-color) 20%,var(--journal-paper))}
.raid-moves b{display:block;font-size:11px}.raid-moves small,.raid-moves span{font-size:9px}.raid-moves span{display:block;color:var(--journal-muted)}
.raid-back{position:static;align-self:flex-end;min-height:36px;font-size:11px;padding:5px 12px}
.raid-targeting{display:flex;flex-direction:column;gap:9px;min-width:0;width:100%}
.raid-target-prompt{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 9px;border:1px solid var(--journal-border);border-radius:7px;background:var(--journal-paper)}
.raid-target-prompt p{margin:0;font-size:11px;overflow-wrap:anywhere}.raid-target-prompt button{flex:none;min-height:40px;font-size:11px}
.raid-boss-choice{position:static;display:grid;grid-template-columns:1fr auto;text-align:left;gap:3px 8px;min-height:54px;padding:7px 10px;border-color:#d3b87e;background:linear-gradient(110deg,#b4944933,var(--journal-paper));box-shadow:inset 0 0 0 1px #dec79955;font-size:12px}
.raid-boss-choice>span{grid-column:1/-1;font-size:9px;color:var(--journal-muted)}.raid-boss-choice>small{font-size:10px;align-self:center}.raid-return{min-height:48px}
.raid-boss.fainted>.pokemon-portrait{animation:raid-boss-faint .9s ease-in forwards}.raid-boss.fainted .raid-boss-aura,.raid-boss.fainted:after{display:none}
@keyframes raid-boss-faint{20%{filter:grayscale(.6) brightness(1.3)}to{filter:grayscale(1);translate:0 65%;opacity:0}}
.raid-reduced .raid-boss.fainted>.pokemon-portrait{opacity:0}
@media(max-width:700px){.raid-moves>button{min-height:49px}.raid-moves small,.raid-moves span{font-size:8px}.raid-main-actions button{font-size:10px}}
@media(prefers-reduced-motion:reduce){.raid-boss.fainted>.pokemon-portrait{opacity:0}}
.raid-area-review>button:first-of-type{background:var(--journal-accent);color:var(--journal-on-accent);border-color:var(--journal-accent);font-weight:700}
.raid-pokemon-enter>.pokemon-portrait{animation:raid-pokemon-enter .42s .34s ease-out both}@keyframes raid-pokemon-enter{from{opacity:0;transform:scale(.1);filter:brightness(3)}to{opacity:1;transform:scale(1);filter:brightness(1)}}.raid-reduced .raid-pokemon-enter>.pokemon-portrait{animation:none}
</style>
<style scoped>
.raid-battle{position:fixed;inset:0;z-index:2100;max-width:1180px;margin:auto;display:flex;flex-direction:column;background:var(--journal-paper);color:var(--journal-ink);font:13px/1.4 var(--journal-font);overflow:hidden;box-shadow:0 0 90px #0008}.raid-battle *{box-sizing:border-box}button{font:inherit;color:inherit;min-height:42px;min-width:42px;border:1px solid var(--journal-border);background:var(--journal-card);border-radius:7px;padding:7px 11px;cursor:pointer}button:disabled{cursor:default;opacity:.55}button:focus-visible,[role=button]:focus-visible{outline:3px solid #e2c981;outline-offset:2px}.raid-stage{position:relative;flex:1;min-height:155px;background-image:linear-gradient(#27103c2b,#0e122a22),var(--raid-bg);background-size:cover;background-position:center;overflow:hidden;isolation:isolate}.raid-boss-info{position:absolute;top:12px;left:14px;width:43%;max-width:390px;z-index:35}.raid-boss-hud{background:#281c3bf0;color:#f2e9ff;border:2px solid #a082b9;border-radius:8px 22px 8px 22px;padding:10px 13px;box-shadow:0 4px #130d2480}.raid-boss-title{display:flex;align-items:baseline;justify-content:space-between;gap:7px}.raid-boss-hud b{font-size:15px}.raid-boss-hud small{font-size:9px;color:#d5c6e8}.raid-boss-hud>.battle-status-ailment{margin:5px 0 1px}.raid-gauge-heading{display:flex;align-items:center;justify-content:space-between;gap:7px;margin-top:5px;font-size:10px;font-variant-numeric:tabular-nums}.raid-gauge-heading b{font:600 9px var(--journal-font);letter-spacing:.04em}.raid-boss-health,.raid-shield-bar{position:relative;overflow:hidden;border-radius:7px;border:1px solid #a995b9;background:#120e24;height:13px;margin-top:4px}.raid-boss-health>i,.raid-shield-bar>i{position:absolute;inset:0 auto 0 0;height:100%;display:block;background:linear-gradient(90deg,#9570c1,#cc9fea);transition:width .55s ease}.raid-boss-health>i.raid-gauge-trail,.raid-shield-bar>i.raid-gauge-trail{background:#f5ddb1;transition:width .85s ease .17s}.raid-boss-health em{position:absolute;top:0;bottom:0;width:2px;background:#fff8;z-index:3}.raid-shield-meter{position:relative;border-top:1px solid #b99dd044;margin-top:6px;padding-top:1px;color:#c5b4da}.raid-shield-meter.is-active{color:#f0d6ff}.raid-shield-bar{height:8px;margin-bottom:1px}.raid-shield-bar>i{background:linear-gradient(90deg,#7b72df,#dcb2ef)}.raid-shield-loss{position:absolute;right:0;bottom:-14px;font-size:9px;color:#f3ceff;text-shadow:1px 1px #241b35;animation:raid-number .5s ease-out}.raid-announcement{display:flex;gap:7px;margin-top:8px;padding:8px 10px;border:1px solid #cfa97a;border-left-width:3px;border-radius:6px;background:#2b2136ed;color:#fff0cd;box-shadow:0 3px 10px #0003;font-size:11px;line-height:1.4}.raid-announcement>span{font-size:17px;color:#ffe4a3}.raid-announcement strong{font-weight:600}.raid-announcement-enter-active,.raid-announcement-leave-active{transition:opacity .25s,transform .25s}.raid-announcement-enter,.raid-announcement-leave-to{opacity:0;transform:translateY(-6px)}.raid-active-hud{position:absolute;right:18px;bottom:16px;width:39%;max-width:380px;z-index:35;border:2px solid var(--journal-border);border-radius:18px 7px 18px 7px;background:var(--journal-paper);box-shadow:0 4px #152b3c55;padding:10px 13px}.raid-active-hud.is-corrupted{background:color-mix(in srgb,#c3a2de 25%,var(--journal-paper));border-color:#a082b9}.raid-active-hud>div:first-child{display:flex;align-items:center;gap:7px;margin-bottom:7px}.raid-active-hud b{font-size:14px}.raid-active-hud small{font-size:10px;margin-left:auto;white-space:nowrap}.raid-active-hp{display:block;font-size:10px;margin-top:5px;font-variant-numeric:tabular-nums}.raid-active-hp em{font-style:normal}.raid-rage-label{display:flex;justify-content:space-between;gap:6px;font-size:9px;color:var(--journal-muted);margin-top:6px}.raid-rage-label b{font-size:9px;color:var(--journal-ink)}.raid-active-rage,.raid-aggro{display:block;height:4px;background:var(--journal-border);border-radius:3px;overflow:hidden;margin-top:3px}.raid-active-rage i,.raid-aggro i{height:100%;display:block;background:linear-gradient(90deg,#c4a569,#dd8250);transition:width .45s}.raid-weather{position:absolute;right:12px;top:10px;z-index:38}.raid-team-effects{position:absolute;top:49px;right:12px;z-index:34;display:flex;flex-direction:column;align-items:flex-end;gap:4px;width:40%;max-width:250px;max-height:90px;overflow:auto}.raid-team-effects>span{border:1px solid #7da9bb;border-radius:5px;background:var(--journal-paper);padding:3px 7px;max-width:100%;font-size:9px;box-shadow:0 2px 6px #0002}.raid-team-effects small{display:block;font-size:8px;color:var(--journal-muted)}.raid-team-effects .is-enemy{border-color:#b393c3}.raid-boss,.raid-ally{position:absolute;display:flex;align-items:flex-end;justify-content:center;pointer-events:none}.raid-boss{right:4%;bottom:30%;width:36%;height:47%;max-width:360px;max-height:360px;z-index:5}.raid-boss>.pokemon-portrait{width:100%;height:auto;aspect-ratio:1;object-fit:contain;object-position:center bottom;transform:scale(1.4) translateY(8%);transform-origin:50% 100%;image-rendering:pixelated;position:relative;z-index:2;filter:drop-shadow(0 0 10px #9853c844)}.raid-boss:before{content:'';position:absolute;bottom:0;left:-4%;right:-4%;height:10%;border-radius:50%;border:2px solid #817b75;background:radial-gradient(ellipse,#9b9e88,#6c7162);box-shadow:0 4px #3c414266}.raid-boss-aura{position:absolute;inset:-5%;background:radial-gradient(ellipse,#9853bf00 35%,#8e51b82a 58%,#6f429400 73%);animation:raid-breathe 3s infinite}.is-shielded:after{content:'';position:absolute;inset:0 3%;z-index:3;border:2px solid #c89eeda8;border-radius:48% 53% 40% 48%;box-shadow:inset 0 0 25px #a169d044,0 0 16px #b781d733;background:linear-gradient(35deg,transparent 38%,#c999ed22 39%,transparent 40%)}.raid-boss.is-selectable{pointer-events:auto;cursor:pointer;outline:2px solid #efd587;outline-offset:4px;border-radius:45%;background:radial-gradient(ellipse,#e9d39511 30%,#d7b56f44 70%,transparent 73%)}.raid-boss.is-selectable>.pokemon-portrait{filter:drop-shadow(0 0 8px #f1d997) drop-shadow(0 0 18px #bf9a6a)}.raid-target-label{position:absolute;bottom:-22px;z-index:15;border:1px solid #e2c47e;border-radius:14px;padding:4px 9px;background:#25263bf0;color:#fff1c6;white-space:nowrap;font-size:10px}.raid-ally{left:-3%;bottom:-2px;width:44%;height:51%;max-width:470px;max-height:390px;z-index:6}.raid-ally>.pokemon-portrait{width:100%;height:auto;aspect-ratio:1;transform:translateY(11%);object-fit:contain;object-position:center bottom;image-rendering:pixelated;transform-origin:50% 95%}.raid-ally.fainted{opacity:.25}.raid-ally.retired{opacity:0}.raid-damage,.raid-critical{position:absolute;top:6%;left:50%;z-index:72;font-weight:900;white-space:nowrap;transform:translateX(-50%);font-size:30px;color:#fff4db;text-shadow:2px 2px #221424,-2px -1px #221424;animation:raid-number .5s ease-out}.raid-critical{top:-20px;font-size:19px;color:#ffe9a5}.is-heal{color:#b7efc8}.takes-hit>.pokemon-portrait{animation:raid-hit .3s}.raid-ally.ally-leave>.pokemon-portrait{animation:raid-recall .16s ease-in both}.raid-ally.ally-enter>.pokemon-portrait{animation:raid-send .22s ease-out both}.raid-ally.ally-recall>.pokemon-portrait{animation:raid-recall .62s ease-in both}.raid-ally.ally-relay>.pokemon-portrait{animation:raid-relay .7s ease-in-out}.raid-ally-cards>.raid-card{position:relative;display:flex;align-items:center;gap:5px;min-width:0;padding:6px 5px;text-align:left;opacity:1}.raid-ally-cards>.raid-card:disabled{opacity:.8}.raid-ally-cards .pokemon-portrait{width:30px;height:35px;object-fit:contain;flex:none;image-rendering:pixelated}.raid-ally-info{min-width:0;flex:1}.raid-ally-info>span:first-child{display:flex;align-items:center;gap:3px}.raid-ally-info b{font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.raid-ally-info small{display:block;font-size:8px;white-space:nowrap}.raid-ally-info>span:first-child>small{margin-left:auto;color:var(--journal-muted);font-size:7px}.raid-ally-info>span:first-child>i{font-style:normal;color:#cf9148;font-size:14px}.raid-card-hp{display:block;height:5px;background:var(--journal-border);border-radius:3px;overflow:hidden;margin:4px 0}.raid-card-hp i{height:100%;display:block;background:#78ae90;transition:width .5s}.raid-aggro{height:3px;margin:3px 0}.raid-card-owner{color:var(--journal-muted);overflow:hidden;text-overflow:ellipsis;padding-right:21px}.raid-card-owner b{font-size:8px;color:var(--journal-accent)}.raid-card-clock{position:absolute;right:4px;bottom:4px;font:normal 8px var(--journal-font);font-variant-numeric:tabular-nums;color:var(--journal-accent)}.raid-ally-cards .is-corrupted{background:#9471b12b;border-color:#a385bb}.raid-ally-cards .is-selected{border-color:#ac85c7;box-shadow:inset 0 0 0 1px #b89bd1}.raid-ally-cards .is-acting{box-shadow:inset 0 0 0 1px #dfc389}.raid-ally-cards .is-valid-target{border-color:#65a58a;box-shadow:0 0 0 1px #91c6a0}.raid-ally-cards .is-withdrawn{opacity:.4}.raid-ally-cards .is-hit{background:#b2768530}.raid-ally-cards .is-relay-target{border-color:#e1bd71;animation:raid-relay-card .7s ease-in-out}.raid-card-number{position:absolute;left:4px;top:-8px;z-index:10;font-size:19px;font-weight:900;color:#ffe1d8;text-shadow:1px 1px #51243c,-1px -1px #51243c;animation:raid-card-hit .95s ease-out both;pointer-events:none}.raid-decision-heading{display:flex;align-items:center;gap:7px;height:22px;font-size:10px;color:var(--journal-muted)}.raid-decision-heading>span{min-width:0;max-width:64%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.raid-decision-heading strong{margin-left:auto;color:var(--journal-heading);font:700 14px var(--journal-font);font-variant-numeric:tabular-nums}.raid-clock-label{margin-left:auto;font-size:8px}.is-urgent{color:#c96e65!important}.raid-retreat{color:#9c5b66;border-color:#b88c95}.raid-error{font-size:10px;color:var(--journal-danger);margin:3px 0}.raid-confirm{position:absolute;inset:0;z-index:220;display:grid;place-items:center;background:#0a0f25b8;padding:16px}.raid-confirm section{max-width:500px;max-height:80dvh;overflow:auto;padding:22px;border:2px solid #9c7eb2;border-radius:12px;background:var(--journal-paper)}.raid-confirm h3{font:24px Georgia,serif;margin:0;color:var(--journal-heading)}.raid-confirm button{margin:6px 6px 0 0}.raid-entry{position:absolute;inset:0;z-index:100;background:radial-gradient(ellipse,#38234d,#0c1024 75%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#efdef9}.raid-entry b{font:25px Georgia,serif}.raid-entry small{font-size:11px;color:#b6a2c8}.raid-entry-rift{height:80px;width:35px;border-radius:50%;background:#090b15;box-shadow:0 0 15px #bd8ae9,0 0 65px #a564d5,0 0 0 7px #6b4c9333;animation:raid-breathe 1.7s infinite}.raid-friendship{position:absolute;left:10px;right:10px;bottom:130px;z-index:90;max-width:580px;margin:auto;padding:9px 12px;background:#f5eaceef;color:#4c4050;border:1px solid #bd9c69;border-radius:8px;font-size:12px;font-weight:700}.raid-friendship small{display:block;font-size:10px;font-weight:400}.boss-arrives .raid-boss>.pokemon-portrait{animation:raid-send .85s ease-out}.shield-break .raid-boss:after{content:'';position:absolute;inset:0;z-index:4;border:2px solid #dab8f4;border-radius:40%;background:linear-gradient(35deg,transparent 45%,#c79cea88 48%,transparent 50%);animation:raid-shatter .7s ease-out}.shield-appears .raid-boss{filter:brightness(1.4)}.shield-hit .raid-boss:after{filter:brightness(1.6)}
@keyframes raid-breathe{50%{scale:1.07;opacity:.8}}@keyframes raid-number{from{opacity:0;translate:0 12px}to{opacity:1;translate:0 0}}@keyframes raid-hit{25%{translate:-7px;filter:brightness(1.7)}60%{translate:4px}to{translate:0;filter:brightness(1)}}@keyframes raid-recall{30%{filter:brightness(1.8) sepia(.5);opacity:1}to{scale:.06;opacity:0;translate:10px -16px;filter:brightness(3)}}@keyframes raid-send{from{scale:.14;opacity:0;filter:brightness(2.5)}65%{opacity:1;scale:1.04;filter:brightness(1.15)}to{scale:1;opacity:1;filter:brightness(1)}}@keyframes raid-relay{35%{translate:-6px;filter:brightness(1.6)}70%{translate:7px}to{translate:0;filter:brightness(1)}}@keyframes raid-relay-card{50%{box-shadow:0 0 10px #dfbd7788;filter:brightness(1.15)}}@keyframes raid-card-hit{from{opacity:0;translate:0 5px}15%,70%{opacity:1;translate:0 0}to{opacity:0;translate:0 -14px}}@keyframes raid-shatter{to{scale:1.4;opacity:0;clip-path:polygon(0 0,40% 20%,15% 100%,75% 65%,100% 100%,90% 0,0 0)}}
@media(max-width:700px){.raid-stage{background-image:linear-gradient(#27103c2b,#0e122a22),var(--raid-mobile-bg)}.raid-boss-info{top:9px;left:9px;width:55%}.raid-boss-hud{padding:8px 10px}.raid-boss-hud b{font-size:13px}.raid-boss-hud small{font-size:8px}.raid-gauge-heading,.raid-gauge-heading b{font-size:9px}.raid-announcement{font-size:10px;padding:7px 8px;gap:5px}.raid-announcement>span{font-size:14px}.raid-active-hud{right:10px;bottom:12px;width:51%;padding:8px 10px}.raid-active-hud b{font-size:12px}.raid-active-hud small{font-size:9px}.raid-active-hud>div:first-child{gap:4px;margin-bottom:5px}.raid-active-hp{font-size:9px}.raid-rage-label,.raid-rage-label b{font-size:8px}.raid-boss{right:2%;width:42%;height:44%;bottom:33%}.raid-ally{left:-6%;width:51%;height:46%}.raid-target-label{font-size:9px;padding:3px 7px;bottom:-17px}.raid-team-effects{right:10px;top:48px;width:39%;max-height:74px}.raid-team-effects>span{font-size:8px;padding:3px 5px}.raid-team-effects small{font-size:7px}.raid-ally-cards>.raid-card{padding:3px 5px;gap:5px}.raid-ally-cards .pokemon-portrait{width:27px;height:32px}.raid-ally-info b{font-size:9px}.raid-ally-info small{font-size:7px}.raid-ally-info>span:first-child{height:11px}.raid-ally-info>small{display:flex;align-items:center;gap:5px;height:12px}.raid-card-hp{height:4px;margin:2px 0}.raid-aggro{height:3px;margin:2px 0}.raid-card-owner{position:absolute;bottom:3px;left:37px;right:5px;font-size:7px;height:9px}.raid-card-owner b{font-size:7px}.raid-card-clock{bottom:0;font-size:7px}.raid-ally-info{padding-bottom:7px}.raid-decision-heading{height:19px;font-size:9px}.raid-damage{font-size:27px}.raid-critical{font-size:17px}}
@media(min-width:701px) and (max-height:600px){.raid-battle{display:grid;grid-template-columns:minmax(0,1fr) 350px;grid-template-rows:minmax(0,1fr)}.raid-stage{min-height:0}.raid-ally-cards>.raid-card{padding:3px 5px}.raid-ally-info small{font-size:7px}.raid-card-owner{display:none}.raid-card-hp{margin:2px 0}.raid-aggro{margin:2px 0}.raid-boss-info{width:51%;top:8px;left:8px}.raid-boss-hud{padding:6px 8px}.raid-boss-hud b{font-size:12px}.raid-gauge-heading,.raid-gauge-heading b{font-size:8px}.raid-active-hud{width:48%;padding:7px 9px;bottom:8px;right:8px}.raid-active-hud b{font-size:11px}.raid-team-effects{max-height:55px;top:45px;width:42%}.raid-announcement{font-size:9px;padding:5px 6px}}
/* Readable decision deck: every card owns its complete flow, including owner. */
.raid-stage{container-type:size}.raid-boss{max-width:min(360px,53cqh)}.raid-card-owner{white-space:nowrap!important;overflow:hidden;text-overflow:ellipsis}.raid-top-tools{position:absolute;right:12px;top:10px;z-index:65;display:flex;align-items:start;gap:7px}.raid-top-tools .raid-weather{position:relative;right:auto;top:auto}.raid-clock{display:flex;flex-direction:column;align-items:center;justify-content:center;width:44px;height:44px;border:1px solid #aec4d6;border-radius:10px;background:#24364ded;color:#e8f1fa;box-shadow:0 2px 0 #10263460;font-variant-numeric:tabular-nums;line-height:1}.raid-clock strong{font-size:24px}.raid-clock small{font-size:6px;letter-spacing:.04em;margin-top:3px}.raid-clock.is-warning{background:#553c24f2;color:#ffcf80;border-color:#e8ad59}.raid-clock.is-danger{background:#612d3af5;color:#ffb7b8;border-color:#ed7f8c;animation:raid-clock-pulse 1.2s ease-in-out infinite}.raid-clock.is-paused{animation:none;opacity:.7}.raid-team-effects{top:62px}.raid-intention{margin-top:8px;padding:7px 10px;display:grid;grid-template-columns:1fr auto;gap:2px 8px;background:#351d35ee;border:1px solid #ce8ba8;border-left:3px solid #e89a9e;border-radius:7px;color:#f8e9f6;font-size:10px;line-height:1.35;box-shadow:0 3px 10px #140b2480}.raid-intention strong{grid-column:1/-1;font-size:11px;color:#ffd3df}.raid-intention b{color:#f4c798;font-size:9px;align-self:center}.raid-announcement{position:absolute;left:50%;top:43%;translate:-50% 0;margin:0;width:86%;max-width:500px;z-index:75;padding:12px 15px;font-size:13px;background:#311e40f5;border-color:#d7a0b3;text-align:left}.raid-boss>.pokemon-portrait{transform:scale(1.48) translateY(14.5%);filter:drop-shadow(0 0 9px #a45bca55) drop-shadow(1px 0 1px #9653b645)}.is-shielded:after{display:none}.raid-ally-cards>.raid-card{padding:8px 6px;gap:5px}.raid-ally-cards .pokemon-portrait{width:34px;height:42px}.raid-ally-info>span:first-child{min-height:15px;height:auto}.raid-ally-info>small{display:flex;align-items:center;flex-wrap:wrap;gap:3px;min-height:16px;height:auto}.raid-ally-info small{white-space:normal;line-height:1.35}.raid-card-hp{margin:5px 0;height:5px}.raid-aggro{margin:4px 0;height:4px}.raid-card-owner{display:block!important;position:static;height:auto!important;min-height:11px;padding:0;overflow-wrap:anywhere}.raid-card-clock{display:none}.raid-ally-info{padding:0}.raid-ally-cards .is-targeted{border-color:#e98995;box-shadow:inset 0 0 0 1px #d86d7c,0 0 9px #b0445830}.raid-ally-cards .is-selected{outline:1px solid #d2b4eb;outline-offset:1px}
@keyframes raid-clock-pulse{50%{box-shadow:0 0 0 3px #e98d982b}}
@media(max-width:700px){.raid-top-tools{right:9px;top:9px;gap:5px}.raid-boss-info{width:56%;left:8px;top:9px}.raid-intention{font-size:9px;padding:6px 8px;gap:2px 4px}.raid-intention strong{font-size:10px}.raid-intention b{font-size:8px}.raid-announcement{top:44%;font-size:11px;padding:10px 12px}.raid-boss{right:1%;width:44%;bottom:32%}.raid-ally-cards>.raid-card{padding:5px 7px;gap:7px}.raid-ally-cards .pokemon-portrait{width:32px;height:39px}.raid-ally-info b{font-size:10px}.raid-ally-info small{font-size:8px}.raid-ally-info>span:first-child{min-height:13px}.raid-ally-info>small{min-height:12px}.raid-card-hp{height:4px;margin:3px 0}.raid-aggro{height:3px;margin:3px 0}.raid-card-owner b{font-size:8px}}
@media(min-width:701px) and (max-height:600px){.raid-ally-info small{font-size:8px}.raid-ally-info>span:first-child{min-height:13px}.raid-ally-info>small{min-height:12px}.raid-card-hp,.raid-aggro{margin:3px 0}.raid-card-owner{display:block}.raid-intention{font-size:9px;padding:5px 7px}.raid-intention strong{font-size:10px}}
@media(max-height:700px) and (max-width:700px){.raid-boss-info{width:47%}.raid-boss-hud{padding:5px 7px}.raid-boss-title{flex-direction:column;align-items:flex-start;gap:1px}.raid-boss-hud b{font-size:11px}.raid-boss-hud small{font-size:7px}.raid-gauge-heading,.raid-gauge-heading b{font-size:8px}.raid-boss-health{height:8px}.raid-shield-meter{margin-top:4px}.raid-shield-bar{height:5px}.raid-intention{margin-top:4px;font-size:8px;grid-template-columns:1fr;gap:1px}.raid-intention strong{font-size:9px}.raid-active-hud{padding:5px 7px;width:47%}.raid-active-hud .raid-rage-label,.raid-active-rage{display:none}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}.raid-reduced *{animation:none!important;transition:none!important}
</style>

<style scoped>
.raid-helping-hand{position:absolute;left:18%;top:15%;color:#ffe6a5;font-size:30px;text-shadow:0 0 8px #d8a545;pointer-events:none;animation:raid-support-shimmer 2.5s ease-in-out infinite alternate}.raid-ally-cards .is-helped{border-top-color:#e0c47e;box-shadow:inset 0 2px #e0c47e}.raid-reduced .raid-helping-hand{animation:none}@keyframes raid-support-shimmer{to{opacity:.4;translate:0 -3px}}@media(prefers-reduced-motion:reduce){.raid-helping-hand{animation:none}}
</style>

<style scoped>
/* Explicit card roles reserve their own line; no label overlays the gauges. */.raid-ally-cards>.raid-card{padding:7px;gap:4px}.raid-ally-cards>.raid-card:disabled{opacity:1}.raid-ally-cards>.raid-card.is-selected{outline:2px solid #b88bd7;outline-offset:0}.raid-ally-cards>.raid-card.is-targeted{border-color:#df7c8b;box-shadow:inset 0 0 0 1px #d86d7c}
@media(max-width:700px){.raid-ally-cards>.raid-card{padding:5px 6px;gap:3px}}
@media(min-width:701px) and (max-height:600px){.raid-ally-cards>.raid-card{padding:5px 6px}}
</style>

<style scoped>
.raid-boss-rage{margin-top:7px;padding-top:5px;border-top:1px solid #b99dd044;color:#f4c49b}.raid-boss-rage>div{display:flex;align-items:center;justify-content:space-between;gap:5px;font-size:9px}.raid-boss-rage b{font-size:9px}.raid-boss-rage>span{display:block;height:6px;border:1px solid #b888a0;border-radius:6px;overflow:hidden;background:#140f23;margin-top:4px}.raid-boss-rage i{display:block;height:100%;background:linear-gradient(90deg,#e6ae56,#e65e60);transition:width .65s ease-out}.raid-boss-rage.is-high{color:#ffbfab}.raid-boss-rage.is-high i{box-shadow:0 0 8px #f28268;animation:raid-rage-heat 2s ease-in-out infinite}.is-enraged .raid-boss-aura{background:radial-gradient(ellipse,#c56b5c00 30%,#ba536744 58%,#6f429400 73%)}
@keyframes raid-rage-heat{50%{filter:brightness(1.2)}}
@media(max-width:700px){.raid-boss-rage{margin-top:5px;padding-top:4px}.raid-boss-rage>div,.raid-boss-rage b{font-size:8px}}
@media(prefers-reduced-motion:reduce){.raid-boss-rage i{animation:none;transition:none}}
</style>

<style scoped>
</style>

<style scoped>
.raid-ally-cards>.raid-card.is-selected{outline:1px solid #b99cd1;outline-offset:0}
.raid-ally-cards>.raid-card.is-acting{border-color:#63b995;background:color-mix(in srgb,#67bb91 13%,var(--journal-card));outline:2px solid #65b58d;outline-offset:-2px}
.raid-ally-cards>.raid-card.is-targeted{border-color:#de8390;animation:raid-target-pulse 1.8s ease-in-out infinite}
@keyframes raid-target-pulse{0%,100%{box-shadow:inset 0 0 0 1px #d86d7c,0 0 0 1px #dc68752b}50%{box-shadow:inset 0 0 0 1px #ef8793,0 0 0 3px #dc68755c}}
.raid-reduced .raid-card.is-targeted{animation:none}
@media(prefers-reduced-motion:reduce){.raid-ally-cards>.raid-card.is-targeted{animation:none}}
</style>
<style scoped>
/* Reserve space for the order medallion without squeezing HP or threat rows. */
@media(max-width:1000px){.raid-ally-cards>.raid-card{padding:5px 6px;gap:3px}}
</style>

<style scoped>
/* The scene owns all free height. Only the deck's natural content is measured. */
.raid-battle{padding-top:env(safe-area-inset-top,0px)}
.raid-stage{min-height:220px;flex:1 1 0%;transition:flex-basis .24s ease}
.raid-boss-context{display:block;margin-bottom:4px;color:#cfbcdf;font-size:8px;letter-spacing:.03em}
.raid-console{flex:0 0 auto;min-height:0;max-height:calc(100% - 220px);border-top:2px solid #9876b0;background:var(--journal-soft);overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;transition:height .24s ease}
.raid-console-body{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(260px,1fr);grid-template-rows:auto auto;align-items:start;gap:10px 14px;padding:8px 14px max(10px,env(safe-area-inset-bottom,0px));min-width:0}
.raid-decision-line{grid-column:1/-1;display:flex;align-items:center;gap:10px;min-height:36px;min-width:0}
.raid-message{flex:1;min-width:0;margin:0;font-size:12px;line-height:1.45;max-height:3em;overflow:auto;overflow-wrap:anywhere}
.raid-decision-tools{display:flex;align-items:center;gap:6px;flex:none}
.raid-decision-tools>button,.raid-decision-tools ::v-deep .battle-social-button{position:relative;inset:auto;display:grid;place-items:center;width:36px;height:36px;min-width:36px;min-height:36px;margin:0;padding:6px;border-radius:8px}
.raid-decision-tools ::v-deep svg{width:19px;height:19px}
.raid-ally-cards{grid-column:1;grid-row:2;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;min-width:0}
.raid-ally-cards>.raid-card,.raid-console.is-multiplayer .raid-ally-cards>.raid-card{height:192px;min-height:192px;align-self:stretch}
.raid-controls,.raid-return{grid-column:2;grid-row:2;align-self:start;min-width:0}
.raid-controls:empty{display:none}
.raid-main-actions button,.raid-back,.raid-target-prompt button{min-height:44px}
@media(max-width:1000px){
 .raid-console-body{grid-template-columns:minmax(0,1fr) minmax(240px,.85fr)}
 .raid-ally-cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
 .raid-ally-cards>.raid-card{height:122px;min-height:122px}
 .raid-console.is-multiplayer .raid-ally-cards>.raid-card{height:136px;min-height:136px}
}
@media(max-width:700px){
 .raid-console-body{grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto auto;padding:6px 7px max(8px,env(safe-area-inset-bottom,0px));gap:7px}
 .raid-message{font-size:11px}
 .raid-decision-line{gap:6px;min-height:36px}
 .raid-decision-tools{gap:4px}
 .raid-controls,.raid-return{grid-column:1;grid-row:3;width:100%}
 .raid-main-actions button{font-size:11px}
 .raid-moves>button{min-height:56px}
 .raid-moves small,.raid-moves span{font-size:9px}
 .raid-active-hud{bottom:10px}
}
@media(min-width:701px) and (max-height:600px){
 .raid-battle{display:grid;grid-template-columns:minmax(0,1fr) 350px;grid-template-rows:minmax(0,1fr)}
 .raid-stage{min-height:0}
 .raid-console{height:100%!important;max-height:100%;border-top:0;border-left:2px solid #9876b0;transition:none}
 .raid-console-body{grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto auto;padding:7px 9px}
 .raid-controls,.raid-return{grid-column:1;grid-row:3;width:100%}
}
@media(max-width:700px) and (max-height:700px){
 .raid-console-body{padding:6px;gap:6px}
 .raid-ally-cards>.raid-card{height:112px;min-height:112px}
 .raid-console.is-multiplayer .raid-ally-cards>.raid-card{height:126px;min-height:126px}
}
@media(prefers-reduced-motion:reduce){.raid-console,.raid-stage{transition:none}}
.raid-reduced .raid-console,.raid-reduced .raid-stage{transition:none}
</style>
<style scoped>
.raid-area-review{padding:10px;border:2px solid #b59b62;border-radius:9px;background:var(--journal-soft);font-size:12px}.raid-area-review p{margin:5px 0}.is-area-affected{outline:3px dashed #d8ae55!important;outline-offset:3px}.raid-area-review button{min-height:44px;width:100%}.raid-moves ::v-deep .move-action{background:color-mix(in srgb,var(--move-color) 20%,var(--journal-paper));border-left:4px solid var(--move-color);border-radius:9px;text-align:left;padding:8px;color:var(--journal-ink);min-height:64px}.raid-moves ::v-deep .move-action b,.raid-moves ::v-deep .move-action small,.raid-moves ::v-deep .move-action span{display:block;font-size:11px}
</style>

<template>
 <section ref="dialog" tabindex="-1" class="raid-battle" :class="{'raid-reduced':reduced}" role="dialog" aria-modal="true" aria-label="Raid de corruption" @keydown.stop="onKey" @keyup.stop data-raid-battle>
  <header><div><small>FAILLES DE CORRUPTION · {{ difficulty }}</small><b>{{ display?.boss.name || frame.boss.name }} <span>Tour {{ display?.turn || frame.turn }}</span></b></div><button @click="help=!help" aria-label="Aide sur le raid">?</button><slot name="social-toggle"/></header>
  <div ref="stage" class="raid-stage" :class="[phaseEffect,{'is-entering':loading,'is-critical':effect?.kind==='-crit'}]">
   <battle-rain v-if="frame.weather==='raindance'" environment="arena" :animations-enabled="!reduced"/><battle-snow v-if="['hail','snowscape'].includes(frame.weather)" environment="arena" :animations-enabled="!reduced"/><battle-sandstorm v-if="frame.weather==='sandstorm'" environment="arena" :animations-enabled="!reduced"/>
   <div class="raid-boss-info"><article class="raid-boss-hud" aria-label="État du boss">
    <span><b>{{ display.boss.name }}</b><small>N. {{ display.boss.level }} · CORROMPU</small></span>
    <div class="raid-gauge-heading"><b>PV</b><span data-raid-boss-hp>{{ display.boss.currentHp }} / {{ display.boss.maxHp }}</span></div>
    <div class="raid-boss-health" role="progressbar" aria-label="PV du boss" :aria-valuenow="display.boss.currentHp" :aria-valuemax="display.boss.maxHp" aria-valuemin="0"><i class="raid-gauge-trail" :style="{width:percent(display.boss)+'%'}"/><i :style="{width:percent(display.boss)+'%'}"/><em style="left:30%"/><em style="left:70%"/></div>
    <battle-status-pill :status="display.boss.status"/>
    <div class="raid-shield-meter" :class="{'is-active':display.shield?.hp>0,'is-breaking':phaseEffect==='shield-break'}" data-raid-shield>
     <div class="raid-gauge-heading"><b>◇ Bouclier</b><span>{{ display.vulnerableTurns&&!display.shield?.hp ? 'Brisé · '+display.vulnerableTurns+' tours de répit' : display.shield ? display.shield.hp+' / '+display.shield.max : 'Inactif' }}</span></div>
     <div class="raid-shield-bar" role="progressbar" aria-label="Bouclier du boss" :aria-valuenow="display.shield?.hp||0" :aria-valuemax="display.shield?.max||1" aria-valuemin="0"><i class="raid-gauge-trail" :style="{width:shieldPercent+'%'}"/><i :style="{width:shieldPercent+'%'}"/></div>
     <span v-if="shieldDamage" :key="shieldDamage.id" class="raid-shield-loss">−{{ shieldDamage.amount }} au bouclier</span>
    </div>
   </article><transition name="raid-announcement"><aside v-if="announcement" class="raid-announcement" role="status" data-raid-announcement><span aria-hidden="true">⚠</span><strong>{{ announcement }}</strong></aside></transition></div>
   <article v-if="main" class="raid-active-hud" :class="{'is-corrupted':main.corrupted}" :data-pokemon-uuid="main.uuid" data-raid-active-hud>
    <div><b>{{ main.name }}</b><small>N. {{ main.level }}</small><battle-status-pill :status="main.status"/></div>
    <health-bar :key="main.uuid" :current-hp="main.currentHp" :hp-max="main.maxHp"/><span class="raid-active-hp">{{ main.currentHp }} / {{ main.maxHp }} PV <em v-if="main.withdrawn">· Retiré</em></span>
    <div class="raid-rage-label"><span>Rage · attention du boss</span><b>{{ main.aggro }} %</b></div><span class="raid-active-rage" role="progressbar" aria-label="Rage : attention du boss" :aria-valuenow="main.aggro" aria-valuemin="0" aria-valuemax="100"><i :style="{width:main.aggro+'%'}"/></span>
   </article>
   <div v-if="activeEffects.length" class="raid-team-effects" aria-label="Effets collectifs actifs"><span v-for="e in activeEffects" :key="e.key" :class="{'is-enemy':e.enemy}" :title="e.description" data-raid-team-effect><b>{{ e.enemy?'Boss · ':'' }}{{ e.name }}</b><small>{{ e.description }}<template v-if="e.turns"> · {{ e.turns }} tour{{ e.turns>1?'s':'' }}</template></small></span></div>
   <battle-weather-info v-if="weather" class="raid-weather" :weather="weather"/>
   <div ref="boss" class="raid-boss" :role="bossTargetable?'button':undefined" :tabindex="bossTargetable?0:-1" :aria-label="bossTargetable?'Viser '+display.boss.name:undefined" @click="targetBoss" @keydown.enter.prevent="targetBoss" @keydown.space.prevent="targetBoss" :class="{'is-selectable':bossTargetable,'is-shielded':display.shield?.hp>0,'takes-hit':effect?.slot===4&&effect?.kind==='-damage','fainted':display.boss.currentHp<=0}"><span class="raid-boss-aura"/><span v-if="bossTargetable" class="raid-target-label">⌖ Viser {{ display.boss.name }}</span><pokemon-portrait :src="sprite(display.boss)" :alt="display.boss.name"/><battle-persistent-effect :effects="display.boss.effects" :reduced="reduced"/><span v-if="effect?.slot===4&&amount" class="raid-damage" :class="{'is-heal':effect.kind==='-heal'}">{{ effect.kind==='-heal'?'+':'−' }}{{ amount }}</span><span v-if="effect?.slot===4&&(effect.kind==='-crit'||effect.critical)" class="raid-critical">CRITIQUE !</span><battle-stat-change v-if="!reduced&&effect?.slot===4&&['-boost','-unboost'].includes(effect.kind)" :key="effect.id" :effects="statEffect(effect)"/></div>
   <div ref="ally" class="raid-ally" :class="[focusPhase,{'takes-hit':effect?.slot===shown&&effect?.kind==='-damage','fainted':main?.currentHp<=0&&!main?.withdrawn,'retired':main?.withdrawn}]"><pokemon-portrait v-if="main" :src="sprite(main,true)" :alt="main.name"/><battle-persistent-effect v-if="main" :effects="main.effects" :reduced="reduced"/><span v-if="effect?.slot===shown&&amount" class="raid-damage" :class="{'is-heal':effect.kind==='-heal'}">{{ effect.kind==='-heal'?'+':'−' }}{{ amount }}</span><span v-if="effect?.slot===shown&&(effect.kind==='-crit'||effect.critical)" class="raid-critical">CRITIQUE !</span><battle-stat-change v-if="!reduced&&effect?.slot===shown&&['-boost','-unboost'].includes(effect.kind)" :key="effect.id" :effects="statEffect(effect)"/></div>
   <battle-move-effect v-if="fx&&!reduced" :key="fx.id" :fx="fx" :path="fx.path" :color="color(fx.moveType)"/>
   <raid-corruption-effect :event="corruptionFx" :reduced="reduced"/>
   <div v-if="loading" class="raid-entry" role="status"><span class="raid-entry-rift"/><b>La faille s’ouvre…</b><small>Chargement du terrain et des Pokémon</small></div>
   <p v-if="friendship" class="raid-friendship" role="alert">✧ {{ friendship }}<small>L’amitié l’a sauvé à 1 PV. Retire-le pour le protéger : ce sursis ne se reproduira pas.</small></p>
  </div>
  <div class="raid-console">

   <p class="raid-message" role="status" aria-live="polite">{{ message || (playing?'Résolution du tour…':frame.finished?frame.won?'La corruption recule.':'Le raid est terminé.':canAct?'Choisis une action pour '+current.name:pendingMine?'Tes actions sont enregistrées.':'Tes alliés préparent leurs actions.') }}</p>
   <button v-if="bossTargetable" class="raid-boss-choice" @click="targetBoss" data-raid-boss-choice><span>⌖ Cible principale</span><b>{{ display.boss.name }}</b><small>Viser le boss →</small></button>
   <div class="raid-ally-cards" aria-label="Les quatre alliés"><button v-for="(p,i) in display.allies" :key="p.uuid" :disabled="!targetable(i)" :aria-pressed="slot===i" :class="{'is-selected':slot===i,'is-corrupted':p.corrupted,'is-acting':playing&&shown===i,'is-withdrawn':p.withdrawn||!p.currentHp,'is-targeted':frame.focus===i,'is-valid-target':targeting&&targetable(i),'is-hit':!!cardHits[i]&&cardHits[i].kind==='-damage','is-relay-target':relayTarget===i}" @click="chooseCard(i)"><pokemon-portrait :src="sprite(p)" alt=""/><span v-if="cardHits[i]" :key="cardHits[i].id" class="raid-card-number" :class="{'is-heal':cardHits[i].kind==='-heal'}">{{ cardHits[i].kind==='-heal'?'+':'−' }}{{ cardHits[i].amount }}</span><span class="raid-ally-info"><span><b>{{ p.name }}</b><i v-if="frame.focus===i" title="Attention du boss">⌖</i><small>{{ (actionOrder.length?actionOrder:display.order).indexOf(i)+1 || '—' }}</small></span><span class="raid-card-hp"><i :style="{width:percent(p)+'%'}"/></span><small>{{ p.currentHp }}/{{ p.maxHp }} PV <battle-status-pill v-if="p.status!=='normal'" :status="p.status" compact/><em v-if="p.withdrawn">Retiré</em><em v-else-if="!p.currentHp">{{ p.survivalKitUsed?'K.O. protégé':p.permanentlyLost?'Perdu':'K.O.' }}</em></small><span class="raid-aggro" :aria-label="'Aggro : '+p.aggro+' %'"><i :style="{width:p.aggro+'%'}"/></span><small class="raid-card-owner">{{ p.ownerName }} <b>{{ frame.allies[i].ready?'✓':frame.allies[i].canControl?'· toi':'' }}</b><i v-if="frame.soloClock&&!frame.allies[i].ready&&!p.withdrawn&&p.currentHp>0" class="raid-card-clock">{{ i===frame.soloClock.slot?remaining:Math.ceil(frame.soloClock.remainingMs[i]/1000) }} s</i></small></span></button></div>
   <div v-if="!frame.finished" class="raid-controls">
    <div class="raid-decision-heading"><span>{{ playing?'Actions en cours':current?.canControl?current.name+' · à toi':current?.ownerName?'Au tour de '+current.ownerName:'En attente' }}</span><small v-if="frame.soloClock&&!playing&&needsChoice" class="raid-clock-label">Ce Pokémon</small><strong v-if="!playing&&needsChoice" :class="{'is-urgent':remaining<=8}" aria-live="off">{{ remaining }} s</strong></div>
    <div v-if="targeting" class="raid-targeting"><p>{{ passing?'Choisis l’allié qui reçoit la main.':'Cible de '+selectedMove.name }}</p><button @click="cancelTarget">Retour</button></div>
    <div v-else-if="canAct&&panel==='moves'" class="raid-moves"><button v-for="m in current.moves" :key="m.index" :style="{'--move-color':color(m.type)}" :disabled="m.disabled||m.pp<=0&&m.id!=='struggle'" @click="move(m)"><b>{{ m.name }}</b><small>{{ type(m.type) }} · {{ m.category==='Physical'?'Physique':m.category==='Special'?'Spéciale':'Statut' }} · {{ m.power||'—' }}</small><span>{{ m.pp }} / {{ m.maxpp }} PP</span></button></div>
    <div v-else-if="canAct" class="raid-main-actions"><button class="raid-attack" @click="panel='moves'" data-raid-attack>Attaquer <span>→</span></button><button :disabled="busy" @click="passing=true">Passer la main ↗</button><button class="raid-retreat" :disabled="busy" @click="retreat=true">Retirer mon Pokémon</button></div>
    <button v-if="canAct&&!targeting&&panel==='moves'" class="raid-back" @click="panel='home'">← Actions</button>
    <p v-if="error" class="raid-error" role="alert">{{ error }}</p>
   </div>
   <button v-else-if="!playing" class="raid-return" @click="$emit('results')">Voir le bilan du raid →</button>
  </div>
  <div v-if="retreat||help" class="raid-confirm" @keydown.esc.stop="retreat=false;help=false"><section><template v-if="retreat"><h3>Retirer {{ current.name }} ?</h3><p>Il quitte définitivement ce raid et reste dans ta collection avec ses PV actuels. Il ne pourra pas revenir dans le combat.</p><button @click="retreat=false">Rester</button><button class="raid-retreat" :disabled="busy" @click="submit({action:'retreat',confirm:true});retreat=false">Le mettre à l’abri</button></template><template v-else><h3>Quatre alliés, une seule chance</h3><p>La jauge orange attire les attaques ciblées du boss. Par Ici et Poudre Fureur permettent de protéger les autres. Une attaque de zone est annoncée tous les deux tours.</p><p>En solo, chaque Pokémon dispose de 30 secondes pour décider. Le temps restant est conservé si tu changes de carte. Les attaques de zone peuvent aussi toucher tes alliés selon leur portée.</p><p>Brise les boucliers à 70 % et 30 %. Passer la main sacrifie l’action de ton Pokémon pour faire agir un allié plus tôt. Vœu soigne le prochain allié qui agit au tour suivant.</p><p>Un Pokémon à pleine vie peut survivre une fois à 1 PV grâce à l’amitié. Retire-le avant qu’il ne soit trop tard. Les K.O. sont définitifs sans Kit de survie.</p><button @click="help=false">Continuer</button></template></section></div>
  <slot name="social-chat"/>
 </section>
</template>
<script>
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
import { raidMovePlan, EFFECT_DETAILS } from '@/services/raidPresentation';
import timing from '../../../../data/game/raid_presentation.json';
import { localizeTypeName, typeBadgeStyle } from '@/services/pokemonTypes';
import background from '@/assets/battle/dark-jungle-wide-v1.webp';
import mobileBackground from '@/assets/battle/dark-jungle-mobile-v1.webp';
export default {
  components: {
    BattleStatusPill,HealthBar,
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
    frame: Object,
    difficulty: String,
    busy: Boolean,
    error: String,
    reduced: Boolean
  },
  data: () => ({
    display: null,
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
    friendship: '',
    phaseEffect: '',
    corruptionFx: null,
    clock: Date.now()
  }),
  computed: {
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
    bossTargetable() { return !this.playing&&!this.loading&&!this.busy&&!this.passing&&!!this.selectedMove?.targets.some(t=>t.slot===4); },
    activeEffects() {
      const f=this.display||this.frame;
      return [...(f.sideEffects||[]).flatMap((effects,side)=>effects.map(e=>({...e,key:side+':'+e.id,enemy:side===1,description:EFFECT_DETAILS[e.id]||'Effet de camp actif'}))),...(f.fieldEffects||[]).map(e=>({...e,key:'field:'+e.id,description:EFFECT_DETAILS[e.id]||'Effet de terrain actif'}))];
    },
    canAct() {
      return !this.loading && !this.playing && !this.focusPhase && !this.busy && this.current?.canControl && !this.current.ready && this.current.currentHp > 0 && !this.current.withdrawn && (!this.frame.soloClock || this.frame.soloClock.slot===this.slot);
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
      }[this.display?.weather || this.frame.weather] || null;
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
      this.message = '';
      this.autoSlot();
    }
  },
  mounted() {
    this._previous = document.activeElement;
    this.$refs.dialog.focus({
      preventScroll: true
    });
    this.$el.style.setProperty('--raid-bg', `url(${background})`);
    this.$el.style.setProperty('--raid-mobile-bg', `url(${mobileBackground})`);
    this._clock = setInterval(() => {
      this.clock = Date.now() + (this._serverOffset || 0);
    }, 250);
    this._receivedAt = Date.now();
  },
  beforeDestroy() {
    this._closed = true;
    clearInterval(this._clock);clearTimeout(this._announcementTimer);
    for (const done of this._waiters || []) done();
    if (this._previous?.isConnected) this._previous.focus({
      preventScroll: true
    });
  },
  methods: {
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
    targetable(i) {
      if (this.playing || this.loading || this.busy || this.focusPhase) return false;
      if (this.passing) return i !== this.slot && this.frame.allies[i].currentHp > 0 && !this.frame.allies[i].withdrawn;
      if (this.selectedMove) return this.selectedMove.targets.some(t => t.slot === i);
      return this.frame.allies[i].canControl && !this.frame.allies[i].ready && this.frame.allies[i].currentHp > 0 && !this.frame.allies[i].withdrawn;
    },
    chooseCard(i) {
      if (this.passing) {
        this.submit({
          action: 'pass',
          target: i
        });
        return;
      }
      if (this.selectedMove) {
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
      } else this.sendMove();
    },
    sendMove(targetLoc) {
      const m = this.selectedMove;
      if (m) this.submit({
        action: 'attack',
        moveIndex: m.index,
        targetLoc
      });
    },
    targetBoss() { if(this.bossTargetable)this.sendMove(this.selectedMove.targets.find(t=>t.slot===4).loc); },
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
      const i = this.frame.soloClock?.slot ?? this.frame.allies.findIndex(p => p.canControl && !p.ready && p.currentHp > 0 && !p.withdrawn);
      if (i >= 0) this.slot = i;
    },
    sleep(ms) {
      if (this._closed) return Promise.resolve();
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
        y: p.top - r.top + p.height * .5,
        groundY: p.bottom - r.top
      };
    },
    announce(text) {
      clearTimeout(this._announcementTimer);this.announcement=text;
      this._announcementTimer=setTimeout(()=>{this.announcement='';},timing.announcementMs);
    },
    warnForFrame(frame) {
      if(frame.finished||!frame.warning||this._announcedToken===frame.token)return;
      this._announcedToken=frame.token;this.announce((frame.warning.nextTurn?'Prochain tour : ':'')+frame.warning.move+' va frapper tous les alliés !');
    },
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
      this.fx=null;this.cardHits={};this.shieldDamage=null;this._sequentialMove=null;
      await this.focusAlly(e.slot<4?e.slot:e.target<4?e.target:this.shown);
      await this.sleep(this.reduced?0:e.slot===4?timing.bossPauseMs:timing.betweenActionsMs);
      this.message=e.message;this.effect={...e,id:Math.random()};this.amount=0;await this.$nextTick();
      const v=moveVisual(e),plan=raidMovePlan(events,index,this.display),start=this.point(e.slot),fullTargets=plan.targets.map(t=>({...t,...this.point(t.slot)}));
      // The large visible Pokémon receives the scene effect; the other allies
      // receive individual impacts and exact damage on their four persistent cards.
      const targets=fullTargets.filter(t=>t.slot===4||t.slot===this.shown),end=targets[0]||this.point(e.target??4);
      const fx={...v,id:Math.random(),stage:'windup',windupMs:Math.max(v.windupMs,timing.windupMinMs),travelMs:Math.max(v.travelMs,timing.travelMinMs),impactMs:Math.max(v.impactMs,timing.impactMinMs),fullTargets,result:{success:!plan.failed&&!plan.prepared},path:{startX:start.x,startY:start.y,targetX:end.x,targetY:end.y,groundY:end.groundY,targets}};
      const sequential=e.slot===4&&plan.targets.filter(t=>t.slot<4).length>1&&['allAdjacent','allAdjacentFoes','all','allies'].includes(e.moveTarget);
      if(sequential){this._sequentialMove={event:e,visual:v,plan,seen:new Set()};this.announce(e.message.replace(/ utilise .*$/,'')+' : '+(e.message.split(' utilise ')[1]||e.moveName).replace(/ !$/,'')+' frappe les alliés !');}
      this.fx=fx;await this.sleep(this.reduced?20:fx.windupMs);if(this._closed)return;
      if(sequential){this.fx={...fx,stage:'await'};return;}
      this.fx={...fx,stage:plan.prepared?'windup':'travel'};await this.sleep(this.reduced?20:fx.travelMs);if(this._closed)return;
      this.fx={...fx,stage:plan.prepared?'await':e.damageClass==='status'?'aura':'await'};
      if(e.damageClass==='status')await this.sleep(this.reduced?20:timing.statusMs);
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
    async recallAlly(e) {
      await this.finishMoveFx();this.fx=null;await this.focusAlly(e.slot);if(this._closed)return;
      this.message=this.display.allies[e.slot].name+' est mis à l’abri.';this.focusPhase='ally-recall';this.corruptionFx={id:Math.random(),kind:'recall',point:this.point(e.slot)};
      await this.sleep(this.reduced?20:timing.recallMs);this.$set(this.display.allies[e.slot],'withdrawn',true);this.focusPhase='';
    },
    async relay(e) {
      await this.finishMoveFx();this.fx=null;await this.focusAlly(e.slot);this.relayTarget=e.target;this.focusPhase='ally-relay';
      this.corruptionFx={id:Math.random(),kind:'relay',point:this.point(e.slot)};
      const order=this.actionOrder.length?this.actionOrder:this.display.order;this.actionOrder=[e.target,...order.filter(i=>i!==e.target&&i!==e.slot)];
      this.message=this.display.allies[e.slot].name+' passe la main à '+this.display.allies[e.target].name+'.';
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
      if(e.kind==='-heal'&&this.fx?.family==='drain'&&!this.reduced){await this.finishMoveFx();this.fx={...this.fx,stage:'drain'};await this.sleep(560);}
      this.$set(p,'currentHp',e.hp);if(e.maxHp)this.$set(p,'maxHp',e.maxHp);
      if(e.kind==='-damage'&&amount)this.$emit('impact',{damage:amount,maxHp:p.maxHp});
      this.message=p.name+(e.kind==='-heal'?' récupère ':' perd ')+amount+' PV.';
      await this.sleep(this.reduced?25:timing.damageMs);
    },
    collectiveEvent(e) {
      const sideEvent=e.kind.startsWith('-side'),key=sideEvent?'sideEffects':'fieldEffects';
      if(!this.display[key])this.$set(this.display,key,sideEvent?[[],[]]:[]);
      const current=sideEvent?this.display[key][e.side]:this.display[key],end=e.kind.endsWith('end'),next=current.filter(x=>x.id!==e.effect);
      if(!end)next.push({id:e.effect,name:e.name,turns:e.turns});
      if(sideEvent)this.$set(this.display[key],e.side,next);else this.$set(this.display,key,next);
      this.message=e.name+(end?' se dissipe.':EFFECT_DETAILS[e.effect]?' : '+EFFECT_DETAILS[e.effect]+'.':sideEvent?(e.side===0?' est actif sur votre camp.':' est actif sur le camp du boss.'):' est actif sur le terrain.');
    },
    async play() {
      if(this.playing||this._closed)return;this.playing=true;
      try{while(this._frames.length&&!this._closed){
        const frame=this._frames.shift(),eventKey=frame.eventKey||frame.token;
        if(!this.display){
          this.display=JSON.parse(JSON.stringify(frame));this._eventToken=eventKey;await this.sleep(0);
          await Promise.race([Promise.all([background,mobileBackground,...[frame.boss,...frame.allies].flatMap(p=>[this.sprite(p),this.sprite(p,true)])].map(src=>new Promise(done=>{const i=new Image();i.onload=i.onerror=done;i.src=src;}))),this.sleep(5000)]);
          await this.sleep(this.reduced?0:900);this.loading=false;this.phaseEffect='boss-arrives';this.$emit('sound','raidEnter');await this.$nextTick();this.corruptionFx={id:Math.random(),kind:'entry',point:this.point(4)};await this.sleep(this.reduced?0:850);this.phaseEffect='';
        }
        const events=eventKey!==this._eventToken?frame.events||[]:[];this._eventToken=eventKey;
        for(let i=0;i<events.length&&!this._closed;i++){
          const e=events[i];
          if(e.kind==='aggro'){if(this.display.allies[e.slot])this.$set(this.display.allies[e.slot],'aggro',e.value);continue;}
          if(['upkeep','turn'].includes(e.kind)){this._sequentialMove=null;continue;}
          if(e.kind==='move'){await this.animate(e,events,i);continue;}
          if(['-damage','-heal','-immune','-miss','-activate','-crit','-boost','-unboost','-status'].includes(e.kind))await this.replayAreaTarget(e);
          const p=e.slot===4?this.display.boss:this.display.allies[e.slot];
          if(['-damage','-heal'].includes(e.kind)){await this.showDamage(e);continue;}
          this.effect={...e,id:Math.random()};this.amount=0;
          if(e.kind==='shield'){
            this.$set(this.display,'shield',{hp:e.hp||frame.shield?.max||1,max:e.max||frame.shield?.max||1});this.phaseEffect='shield-appears';this.corruptionFx={id:Math.random(),kind:'shield',point:this.point(4)};this.message='Le bouclier de corruption se déploie.';this.$emit('sound','raidShield');await this.sleep(this.reduced?30:timing.shieldMs);
          }else if(e.kind==='shieldHit'){
            const max=e.max||this.display.shield?.max||frame.shield?.max||1,hp=e.hp??Math.max(0,(this.display.shield?.hp||max)-e.amount);
            this.$set(this.display,'shield',{hp,max});this.shieldDamage={id:Math.random(),amount:e.amount};this.phaseEffect='shield-hit';this.$emit('sound','raidHit');this.message='Le bouclier absorbe '+e.amount+' dégâts.';await this.sleep(this.reduced?30:timing.shieldMs);
          }else if(e.kind==='shieldBreak'){
            this.$set(this.display,'shield',{hp:0,max:e.max||this.display.shield?.max||1});this.$set(this.display,'vulnerableTurns',2);this.phaseEffect='shield-break';this.corruptionFx={id:Math.random(),kind:'shieldBreak',point:this.point(4)};this.message='Bouclier détruit ! Deux tours de répit.';this.$emit('sound','raidBreak');await this.sleep(this.reduced?30:timing.shieldBreakMs);
          }else if(e.kind==='friendship'){
            this.friendship=p.name+' est en danger !';this.corruptionFx={id:Math.random(),kind:'friendship',point:this.point(e.slot)};this.$emit('sound','raidSaved');await this.sleep(this.reduced?50:1500);this.friendship='';
          }else if(e.kind==='retreat'&&p){await this.recallAlly(e);this.message=p.name+(e.reason==='timeout'?' est retiré en sécurité : son délai est écoulé.':' est mis à l’abri.');await this.sleep(this.reduced?30:timing.resultMs);
          }else if(e.kind==='pass'){await this.relay(e);
          }else if(e.kind==='passFailed'){this.message=e.kind==='pass'?p.name+' passe la main à '+this.display.allies[e.target]?.name+'.':'Le relais échoue : cet allié a déjà joué.';await this.sleep(this.reduced?30:timing.resultMs);
          }else if(e.kind==='-activate'&&p&&/Protect|Wide Guard|Mat Block|Quick Guard/.test(e.effect||'')){this.$set(p,'effects',{...p.effects,shield:true});this.message=p.name+' est protégé !';await this.sleep(this.reduced?20:timing.statusMs);
          }else if(e.kind==='-crit'){await this.sleep(this.reduced?20:180);
          }else if(['-boost','-unboost'].includes(e.kind)&&p){this.$set(p,'boosts',{...p.boosts,[e.effect]:Math.max(-6,Math.min(6,(p.boosts[e.effect]||0)+(e.kind==='-boost'?1:-1)*Number(e.value)))});this.message=p.name+' : '+this.statEffect(e)[0].text+(e.kind==='-boost'?' augmente.':' diminue.');await this.sleep(this.reduced?30:timing.statMs);
          }else if(['-sidestart','-sideend','-fieldstart','-fieldend'].includes(e.kind)){this.collectiveEvent(e);await this.sleep(this.reduced?30:timing.statusMs);
          }else if(['-status','-curestatus'].includes(e.kind)&&p){this.$set(p,'status',e.kind==='-curestatus'?'normal':({brn:'burn',psn:'poison',tox:'badly_poison',par:'paralyze',slp:'sleep',frz:'freeze'})[e.effect]||e.effect);this.message=p.name+(e.kind==='-curestatus'?' est rétabli.':' : '+this.status(p.status)+'.');await this.sleep(this.reduced?30:timing.statusMs);
          }else if(['-immune','-miss','-fail','cant','faint'].includes(e.kind)&&p){this.message=e.kind==='-immune'?p.name+' est immunisé.':e.kind==='-miss'?'L’attaque manque sa cible.':e.kind==='faint'?p.name+(e.slot<4&&frame.allies[e.slot]?.survivalKitUsed?' reste K.O. : son Kit de survie a été consommé.':e.slot<4&&frame.allies[e.slot]?.permanentlyLost?' est définitivement perdu.':' est K.O.'):e.kind==='cant'?p.name+' ne peut pas agir.':'La capacité échoue.';await this.sleep(this.reduced?30:timing.resultMs);}
          this.phaseEffect='';
        }
        await this.finishMoveFx();this.display=JSON.parse(JSON.stringify(frame));this.fx=null;this.effect=null;this.amount=0;this.actionOrder=[];this.cardHits={};this.shieldDamage=null;this.message='';this.phaseEffect='';
      }}finally{
        this.warnForFrame(this.frame);this.autoSlot();if(!this._closed)await this.focusAlly(this.slot);this.playing=false;
        if(!this._closed&&this.frame.soloClock&&!this.frame.finished&&this._presentedToken!==this.frame.token){this._presentedToken=this.frame.token;this.$emit('action',{action:'presented',slot:this.slot,token:this.frame.token});}
        if(this._frames.length&&!this._closed)void this.play();
      }
    }
  }
};
</script>
<style scoped>
.raid-battle{position:fixed;inset:0;z-index:2100;max-width:1180px;margin:auto;display:flex;flex-direction:column;background:var(--journal-paper);color:var(--journal-ink);font:13px/1.4 var(--journal-font);overflow:hidden;box-shadow:0 0 90px #0008}.raid-battle *{box-sizing:border-box}button{font:inherit;color:inherit;min-height:42px;min-width:42px;border:1px solid var(--journal-border);background:var(--journal-card);border-radius:7px;padding:7px 11px;cursor:pointer}button:disabled{cursor:default;opacity:.55}button:focus-visible,[role=button]:focus-visible{outline:3px solid #e2c981;outline-offset:2px}header{display:flex;align-items:center;gap:8px;flex:none;height:48px;padding:5px 16px;background:var(--journal-soft);border-bottom:2px solid #9e80b4}header>div{flex:1;min-width:0}header small{display:block;font-size:8px;letter-spacing:.1em;color:var(--journal-muted)}header b{font-size:15px}header b>span{font-size:10px;font-weight:400;margin-left:12px}header>button{min-height:34px;min-width:34px;padding:4px 9px}.raid-stage{position:relative;flex:1;min-height:155px;background-image:linear-gradient(#27103c2b,#0e122a22),var(--raid-bg);background-size:cover;background-position:center;overflow:hidden;isolation:isolate}.raid-boss-info{position:absolute;top:12px;left:14px;width:43%;max-width:390px;z-index:35}.raid-boss-hud{background:#281c3bf0;color:#f2e9ff;border:2px solid #a082b9;border-radius:8px 22px 8px 22px;padding:10px 13px;box-shadow:0 4px #130d2480}.raid-boss-hud>span:first-child{display:flex;align-items:baseline;justify-content:space-between;gap:7px}.raid-boss-hud b{font-size:15px}.raid-boss-hud small{font-size:9px;color:#d5c6e8}.raid-boss-hud>.battle-status-ailment{margin:5px 0 1px}.raid-gauge-heading{display:flex;align-items:center;justify-content:space-between;gap:7px;margin-top:5px;font-size:10px;font-variant-numeric:tabular-nums}.raid-gauge-heading b{font:600 9px var(--journal-font);letter-spacing:.04em}.raid-boss-health,.raid-shield-bar{position:relative;overflow:hidden;border-radius:7px;border:1px solid #a995b9;background:#120e24;height:13px;margin-top:4px}.raid-boss-health>i,.raid-shield-bar>i{position:absolute;inset:0 auto 0 0;height:100%;display:block;background:linear-gradient(90deg,#9570c1,#cc9fea);transition:width .55s ease}.raid-boss-health>i.raid-gauge-trail,.raid-shield-bar>i.raid-gauge-trail{background:#f5ddb1;transition:width .85s ease .17s}.raid-boss-health em{position:absolute;top:0;bottom:0;width:2px;background:#fff8;z-index:3}.raid-shield-meter{position:relative;border-top:1px solid #b99dd044;margin-top:6px;padding-top:1px;color:#c5b4da}.raid-shield-meter.is-active{color:#f0d6ff}.raid-shield-bar{height:8px;margin-bottom:1px}.raid-shield-bar>i{background:linear-gradient(90deg,#7b72df,#dcb2ef)}.raid-shield-loss{position:absolute;right:0;bottom:-14px;font-size:9px;color:#f3ceff;text-shadow:1px 1px #241b35;animation:raid-number .5s ease-out}.raid-announcement{display:flex;gap:7px;margin-top:8px;padding:8px 10px;border:1px solid #cfa97a;border-left-width:3px;border-radius:6px;background:#2b2136ed;color:#fff0cd;box-shadow:0 3px 10px #0003;font-size:11px;line-height:1.4}.raid-announcement>span{font-size:17px;color:#ffe4a3}.raid-announcement strong{font-weight:600}.raid-announcement-enter-active,.raid-announcement-leave-active{transition:opacity .25s,transform .25s}.raid-announcement-enter,.raid-announcement-leave-to{opacity:0;transform:translateY(-6px)}.raid-active-hud{position:absolute;right:18px;bottom:16px;width:39%;max-width:380px;z-index:35;border:2px solid var(--journal-border);border-radius:18px 7px 18px 7px;background:var(--journal-paper);box-shadow:0 4px #152b3c55;padding:10px 13px}.raid-active-hud.is-corrupted{background:color-mix(in srgb,#c3a2de 25%,var(--journal-paper));border-color:#a082b9}.raid-active-hud>div:first-child{display:flex;align-items:center;gap:7px;margin-bottom:7px}.raid-active-hud b{font-size:14px}.raid-active-hud small{font-size:10px;margin-left:auto;white-space:nowrap}.raid-active-hp{display:block;font-size:10px;margin-top:5px;font-variant-numeric:tabular-nums}.raid-active-hp em{font-style:normal}.raid-rage-label{display:flex;justify-content:space-between;gap:6px;font-size:9px;color:var(--journal-muted);margin-top:6px}.raid-rage-label b{font-size:9px;color:var(--journal-ink)}.raid-active-rage,.raid-aggro{display:block;height:4px;background:var(--journal-border);border-radius:3px;overflow:hidden;margin-top:3px}.raid-active-rage i,.raid-aggro i{height:100%;display:block;background:linear-gradient(90deg,#c4a569,#dd8250);transition:width .45s}.raid-weather{position:absolute;right:12px;top:10px;z-index:38}.raid-team-effects{position:absolute;top:49px;right:12px;z-index:34;display:flex;flex-direction:column;align-items:flex-end;gap:4px;width:40%;max-width:250px;max-height:90px;overflow:auto}.raid-team-effects>span{border:1px solid #7da9bb;border-radius:5px;background:var(--journal-paper);padding:3px 7px;max-width:100%;font-size:9px;box-shadow:0 2px 6px #0002}.raid-team-effects small{display:block;font-size:8px;color:var(--journal-muted)}.raid-team-effects .is-enemy{border-color:#b393c3}.raid-boss,.raid-ally{position:absolute;display:flex;align-items:flex-end;justify-content:center;pointer-events:none}.raid-boss{right:4%;bottom:30%;width:36%;height:47%;max-width:360px;max-height:360px;z-index:5}.raid-boss>.pokemon-portrait{width:100%;height:auto;aspect-ratio:1;object-fit:contain;object-position:center bottom;transform:scale(1.4) translateY(8%);transform-origin:50% 100%;image-rendering:pixelated;position:relative;z-index:2;filter:drop-shadow(0 0 10px #9853c844)}.raid-boss:before{content:'';position:absolute;bottom:0;left:-4%;right:-4%;height:10%;border-radius:50%;border:2px solid #817b75;background:radial-gradient(ellipse,#9b9e88,#6c7162);box-shadow:0 4px #3c414266}.raid-boss-aura{position:absolute;inset:-5%;background:radial-gradient(ellipse,#9853bf00 35%,#8e51b82a 58%,#6f429400 73%);animation:raid-breathe 3s infinite}.is-shielded:after{content:'';position:absolute;inset:0 3%;z-index:3;border:2px solid #c89eeda8;border-radius:48% 53% 40% 48%;box-shadow:inset 0 0 25px #a169d044,0 0 16px #b781d733;background:linear-gradient(35deg,transparent 38%,#c999ed22 39%,transparent 40%)}.raid-boss.is-selectable{pointer-events:auto;cursor:pointer;outline:2px solid #efd587;outline-offset:4px;border-radius:45%;background:radial-gradient(ellipse,#e9d39511 30%,#d7b56f44 70%,transparent 73%)}.raid-boss.is-selectable>.pokemon-portrait{filter:drop-shadow(0 0 8px #f1d997) drop-shadow(0 0 18px #bf9a6a)}.raid-target-label{position:absolute;bottom:-22px;z-index:15;border:1px solid #e2c47e;border-radius:14px;padding:4px 9px;background:#25263bf0;color:#fff1c6;white-space:nowrap;font-size:10px}.raid-ally{left:-3%;bottom:-2px;width:44%;height:51%;max-width:470px;max-height:390px;z-index:6}.raid-ally>.pokemon-portrait{width:100%;height:auto;aspect-ratio:1;transform:translateY(11%);object-fit:contain;object-position:center bottom;image-rendering:pixelated;transform-origin:50% 95%}.raid-ally.fainted{opacity:.25}.raid-ally.retired{opacity:0}.raid-damage,.raid-critical{position:absolute;top:6%;left:50%;z-index:72;font-weight:900;white-space:nowrap;transform:translateX(-50%);font-size:30px;color:#fff4db;text-shadow:2px 2px #221424,-2px -1px #221424;animation:raid-number .5s ease-out}.raid-critical{top:-20px;font-size:19px;color:#ffe9a5}.is-heal{color:#b7efc8}.takes-hit>.pokemon-portrait{animation:raid-hit .3s}.raid-ally.ally-leave>.pokemon-portrait{animation:raid-recall .16s ease-in both}.raid-ally.ally-enter>.pokemon-portrait{animation:raid-send .22s ease-out both}.raid-ally.ally-recall>.pokemon-portrait{animation:raid-recall .62s ease-in both}.raid-ally.ally-relay>.pokemon-portrait{animation:raid-relay .7s ease-in-out}.raid-console{flex:none;height:176px;padding:8px 14px;display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.82fr);grid-template-rows:26px minmax(0,1fr);gap:7px 14px;border-top:2px solid #9876b0;background:var(--journal-soft);overflow:auto;scrollbar-width:thin}.raid-message{grid-column:1;grid-row:1;margin:0;font-size:11px;line-height:1.35;max-height:30px;overflow:auto}.raid-ally-cards{grid-column:1;grid-row:2;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;align-self:start}.raid-ally-cards>button{position:relative;display:flex;align-items:center;gap:5px;min-width:0;height:92px;padding:6px 5px;text-align:left;opacity:1}.raid-ally-cards>button:disabled{opacity:.8}.raid-ally-cards .pokemon-portrait{width:30px;height:35px;object-fit:contain;flex:none;image-rendering:pixelated}.raid-ally-info{min-width:0;flex:1}.raid-ally-info>span:first-child{display:flex;align-items:center;gap:3px}.raid-ally-info b{font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.raid-ally-info small{display:block;font-size:8px;white-space:nowrap}.raid-ally-info>span:first-child>small{margin-left:auto;color:var(--journal-muted);font-size:7px}.raid-ally-info>span:first-child>i{font-style:normal;color:#cf9148;font-size:14px}.raid-card-hp{display:block;height:5px;background:var(--journal-border);border-radius:3px;overflow:hidden;margin:4px 0}.raid-card-hp i{height:100%;display:block;background:#78ae90;transition:width .5s}.raid-aggro{height:3px;margin:3px 0}.raid-card-owner{color:var(--journal-muted);overflow:hidden;text-overflow:ellipsis;padding-right:21px}.raid-card-owner b{font-size:8px;color:var(--journal-accent)}.raid-card-clock{position:absolute;right:4px;bottom:4px;font:normal 8px var(--journal-font);font-variant-numeric:tabular-nums;color:var(--journal-accent)}.raid-ally-cards .is-corrupted{background:#9471b12b;border-color:#a385bb}.raid-ally-cards .is-selected{border-color:#ac85c7;box-shadow:inset 0 0 0 1px #b89bd1}.raid-ally-cards .is-acting{box-shadow:inset 0 0 0 1px #dfc389}.raid-ally-cards .is-valid-target{border-color:#65a58a;box-shadow:0 0 0 1px #91c6a0}.raid-ally-cards .is-withdrawn{opacity:.4}.raid-ally-cards .is-hit{background:#b2768530}.raid-ally-cards .is-relay-target{border-color:#e1bd71;animation:raid-relay-card .7s ease-in-out}.raid-card-number{position:absolute;left:4px;top:-8px;z-index:10;font-size:19px;font-weight:900;color:#ffe1d8;text-shadow:1px 1px #51243c,-1px -1px #51243c;animation:raid-card-hit .95s ease-out both;pointer-events:none}.raid-boss-choice{grid-column:1;grid-row:1;display:flex;align-items:center;gap:10px;min-height:32px;padding:4px 9px;border:1px solid #d3b87e;background:linear-gradient(110deg,#b4944933,var(--journal-paper));box-shadow:inset 0 0 0 1px #dec79955;font-size:11px}.raid-boss-choice>span,.raid-boss-choice>small{font-size:9px}.raid-boss-choice>small{margin-left:auto}.raid-console:has(.raid-boss-choice){grid-template-rows:32px minmax(0,1fr)}.raid-console:has(.raid-boss-choice)>.raid-message{display:none}.raid-controls{position:relative;grid-column:2;grid-row:1/-1;min-width:0}.raid-decision-heading{display:flex;align-items:center;gap:7px;height:22px;font-size:10px;color:var(--journal-muted)}.raid-decision-heading>span{min-width:0;max-width:64%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.raid-decision-heading strong{margin-left:auto;color:var(--journal-heading);font:700 14px var(--journal-font);font-variant-numeric:tabular-nums}.raid-clock-label{margin-left:auto;font-size:8px}.is-urgent{color:#c96e65!important}.raid-main-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}.raid-main-actions button{font-size:11px;min-height:42px}.raid-main-actions .raid-attack{grid-column:1/-1;background:var(--journal-accent);color:var(--journal-paper);display:flex;justify-content:space-between;align-items:center;font-weight:700}.raid-retreat{color:#9c5b66;border-color:#b88c95}.raid-moves{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.raid-moves>button{min-width:0;text-align:left;padding:5px 8px;border-color:var(--move-color);border-left-width:4px;background:color-mix(in srgb,var(--move-color) 20%,var(--journal-paper));min-height:43px}.raid-moves b{display:block;font-size:11px}.raid-moves small,.raid-moves span{font-size:8px}.raid-moves span{margin-left:5px;color:var(--journal-muted)}.raid-back{position:absolute;right:52px;top:-2px;min-height:23px;min-width:0;padding:2px 5px;font-size:9px}.raid-controls:has(.raid-back) .raid-decision-heading>span{max-width:42%}.raid-targeting{display:flex;gap:8px;align-items:center;justify-content:space-between;background:var(--journal-paper);padding:8px;border-radius:7px;min-height:86px}.raid-targeting p{margin:0;font-size:11px}.raid-targeting button{font-size:10px}.raid-error{font-size:10px;color:var(--journal-danger);margin:3px 0}.raid-return{grid-column:2;grid-row:1/-1;align-self:center}.raid-confirm{position:absolute;inset:0;z-index:220;display:grid;place-items:center;background:#0a0f25b8;padding:16px}.raid-confirm section{max-width:500px;max-height:80dvh;overflow:auto;padding:22px;border:2px solid #9c7eb2;border-radius:12px;background:var(--journal-paper)}.raid-confirm h3{font:24px Georgia,serif;margin:0;color:var(--journal-heading)}.raid-confirm button{margin:6px 6px 0 0}.raid-entry{position:absolute;inset:0;z-index:100;background:radial-gradient(ellipse,#38234d,#0c1024 75%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#efdef9}.raid-entry b{font:25px Georgia,serif}.raid-entry small{font-size:11px;color:#b6a2c8}.raid-entry-rift{height:80px;width:35px;border-radius:50%;background:#090b15;box-shadow:0 0 15px #bd8ae9,0 0 65px #a564d5,0 0 0 7px #6b4c9333;animation:raid-breathe 1.7s infinite}.raid-friendship{position:absolute;left:10px;right:10px;bottom:130px;z-index:90;max-width:580px;margin:auto;padding:9px 12px;background:#f5eaceef;color:#4c4050;border:1px solid #bd9c69;border-radius:8px;font-size:12px;font-weight:700}.raid-friendship small{display:block;font-size:10px;font-weight:400}.boss-arrives .raid-boss>.pokemon-portrait{animation:raid-send .85s ease-out}.shield-break .raid-boss:after{content:'';position:absolute;inset:0;z-index:4;border:2px solid #dab8f4;border-radius:40%;background:linear-gradient(35deg,transparent 45%,#c79cea88 48%,transparent 50%);animation:raid-shatter .7s ease-out}.shield-appears .raid-boss{filter:brightness(1.4)}.shield-hit .raid-boss:after{filter:brightness(1.6)}
@keyframes raid-breathe{50%{scale:1.07;opacity:.8}}@keyframes raid-number{from{opacity:0;translate:0 12px}to{opacity:1;translate:0 0}}@keyframes raid-hit{25%{translate:-7px;filter:brightness(1.7)}60%{translate:4px}to{translate:0;filter:brightness(1)}}@keyframes raid-recall{30%{filter:brightness(1.8) sepia(.5);opacity:1}to{scale:.06;opacity:0;translate:10px -16px;filter:brightness(3)}}@keyframes raid-send{from{scale:.14;opacity:0;filter:brightness(2.5)}65%{opacity:1;scale:1.04;filter:brightness(1.15)}to{scale:1;opacity:1;filter:brightness(1)}}@keyframes raid-relay{35%{translate:-6px;filter:brightness(1.6)}70%{translate:7px}to{translate:0;filter:brightness(1)}}@keyframes raid-relay-card{50%{box-shadow:0 0 10px #dfbd7788;filter:brightness(1.15)}}@keyframes raid-card-hit{from{opacity:0;translate:0 5px}15%,70%{opacity:1;translate:0 0}to{opacity:0;translate:0 -14px}}@keyframes raid-shatter{to{scale:1.4;opacity:0;clip-path:polygon(0 0,40% 20%,15% 100%,75% 65%,100% 100%,90% 0,0 0)}}
@media(max-width:700px){header{height:44px;padding:4px 10px}header b{font-size:13px}.raid-stage{background-image:linear-gradient(#27103c2b,#0e122a22),var(--raid-mobile-bg)}.raid-boss-info{top:9px;left:9px;width:55%}.raid-boss-hud{padding:8px 10px}.raid-boss-hud b{font-size:13px}.raid-boss-hud small{font-size:8px}.raid-gauge-heading,.raid-gauge-heading b{font-size:9px}.raid-announcement{font-size:10px;padding:7px 8px;gap:5px}.raid-announcement>span{font-size:14px}.raid-active-hud{right:10px;bottom:12px;width:51%;padding:8px 10px}.raid-active-hud b{font-size:12px}.raid-active-hud small{font-size:9px}.raid-active-hud>div:first-child{gap:4px;margin-bottom:5px}.raid-active-hp{font-size:9px}.raid-rage-label,.raid-rage-label b{font-size:8px}.raid-boss{right:2%;width:42%;height:44%;bottom:33%}.raid-ally{left:-6%;width:51%;height:46%}.raid-target-label{font-size:9px;padding:3px 7px;bottom:-17px}.raid-team-effects{right:10px;top:48px;width:39%;max-height:74px}.raid-team-effects>span{font-size:8px;padding:3px 5px}.raid-team-effects small{font-size:7px}.raid-console{height:252px;max-height:calc(100dvh - 190px);padding:6px 9px;grid-template-columns:1fr;grid-template-rows:24px 92px minmax(0,1fr);gap:5px}.raid-ally-cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:4px}.raid-ally-cards>button{height:44px;min-height:44px;padding:3px 5px;gap:5px}.raid-ally-cards .pokemon-portrait{width:27px;height:32px}.raid-ally-info b{font-size:9px}.raid-ally-info small{font-size:7px}.raid-ally-info>span:first-child{height:11px}.raid-ally-info>small{display:flex;align-items:center;gap:5px;height:12px}.raid-card-hp{height:4px;margin:2px 0}.raid-aggro{height:3px;margin:2px 0}.raid-card-owner{position:absolute;bottom:3px;left:37px;right:5px;font-size:7px;height:9px}.raid-card-owner b{font-size:7px}.raid-card-clock{bottom:0;font-size:7px}.raid-ally-info{padding-bottom:7px}.raid-controls{grid-column:1;grid-row:3}.raid-decision-heading{height:19px;font-size:9px}.raid-main-actions{gap:5px}.raid-main-actions button{min-height:42px;font-size:10px;padding:5px 8px}.raid-moves>button{min-height:42px;padding:4px 7px}.raid-moves b{font-size:10px}.raid-moves small,.raid-moves span{font-size:7px}.raid-moves span{margin-left:4px}.raid-back{top:-3px}.raid-message{font-size:10px;max-height:25px}.raid-console:has(.raid-boss-choice){grid-template-rows:30px 92px minmax(0,1fr)}.raid-boss-choice{min-height:30px;gap:7px;padding:3px 7px;font-size:10px}.raid-boss-choice>span,.raid-boss-choice>small{font-size:8px}.raid-targeting{min-height:82px;padding:6px}.raid-targeting p{font-size:10px}.raid-return{grid-column:1;grid-row:3}.raid-damage{font-size:27px}.raid-critical{font-size:17px}}
@media(min-width:701px) and (max-height:600px){.raid-battle{display:grid;grid-template-columns:minmax(0,1fr) 350px;grid-template-rows:44px minmax(0,1fr)}header{grid-column:1/-1;height:44px}.raid-stage{min-height:0}.raid-console{height:100%;max-height:100%;grid-template-columns:1fr;grid-template-rows:26px 92px minmax(0,1fr);padding:7px 9px;border-top:0;border-left:2px solid #9876b0}.raid-ally-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.raid-ally-cards>button{height:44px;padding:3px 5px}.raid-ally-info small{font-size:7px}.raid-card-owner{display:none}.raid-card-hp{margin:2px 0}.raid-aggro{margin:2px 0}.raid-controls{grid-column:1;grid-row:3}.raid-console:has(.raid-boss-choice){grid-template-rows:32px 92px minmax(0,1fr)}.raid-return{grid-column:1;grid-row:3}.raid-boss-info{width:51%;top:8px;left:8px}.raid-boss-hud{padding:6px 8px}.raid-boss-hud b{font-size:12px}.raid-gauge-heading,.raid-gauge-heading b{font-size:8px}.raid-active-hud{width:48%;padding:7px 9px;bottom:8px;right:8px}.raid-active-hud b{font-size:11px}.raid-team-effects{max-height:55px;top:45px;width:42%}.raid-announcement{font-size:9px;padding:5px 6px}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}.raid-reduced *{animation:none!important;transition:none!important}
</style>

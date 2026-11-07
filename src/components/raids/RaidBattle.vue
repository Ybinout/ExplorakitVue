<template>
 <section ref="dialog" tabindex="-1" class="raid-battle" :class="{'raid-reduced':reduced}" role="dialog" aria-modal="true" aria-label="Raid de corruption" @keydown.stop="onKey" @keyup.stop data-raid-battle>
  <header><div><small>FAILLES DE CORRUPTION · {{ difficulty }}</small><b>{{ frame.boss.name }} <span>Tour {{ frame.turn }}</span></b></div><button @click="help=!help" aria-label="Aide sur le raid">?</button><slot name="social-toggle"/></header>
  <div ref="stage" class="raid-stage" :class="[phaseEffect,{'is-entering':loading,'is-critical':effect?.kind==='-crit'}]">
   <battle-rain v-if="frame.weather==='raindance'" environment="arena" :animations-enabled="!reduced"/><battle-snow v-if="['hail','snowscape'].includes(frame.weather)" environment="arena" :animations-enabled="!reduced"/><battle-sandstorm v-if="frame.weather==='sandstorm'" environment="arena" :animations-enabled="!reduced"/>
   <article class="raid-boss-hud" aria-label="État du boss">
    <span><b>{{ display.boss.name }}</b><small>N. {{ display.boss.level }} · CORROMPU</small></span>
    <div class="raid-gauge-heading"><b>PV</b><span data-raid-boss-hp>{{ display.boss.currentHp }} / {{ display.boss.maxHp }}</span></div>
    <div class="raid-boss-health" role="progressbar" aria-label="PV du boss" :aria-valuenow="display.boss.currentHp" :aria-valuemax="display.boss.maxHp" aria-valuemin="0"><i class="raid-gauge-trail" :style="{width:percent(display.boss)+'%'}"/><i :style="{width:percent(display.boss)+'%'}"/><em style="left:30%"/><em style="left:70%"/></div>
    <small v-if="display.boss.status!=='normal'">{{ status(display.boss.status) }}</small>
    <div class="raid-shield-meter" :class="{'is-active':display.shield?.hp>0,'is-breaking':phaseEffect==='shield-break'}" data-raid-shield>
     <div class="raid-gauge-heading"><b>◇ Bouclier</b><span>{{ display.shield?.hp>0 ? display.shield.hp+' / '+display.shield.max : display.vulnerableTurns ? 'Brisé · '+display.vulnerableTurns+' tours de répit' : 'Inactif' }}</span></div>
     <div class="raid-shield-bar" role="progressbar" aria-label="Bouclier du boss" :aria-valuenow="display.shield?.hp||0" :aria-valuemax="display.shield?.max||1" aria-valuemin="0"><i class="raid-gauge-trail" :style="{width:shieldPercent+'%'}"/><i :style="{width:shieldPercent+'%'}"/></div>
     <span v-if="shieldDamage" :key="shieldDamage.id" class="raid-shield-loss">−{{ shieldDamage.amount }} au bouclier</span>
    </div>
   </article>
   <battle-weather-info v-if="weather" class="raid-weather" :weather="weather"/>
   <div ref="boss" class="raid-boss" :role="bossTargetable?'button':undefined" :tabindex="bossTargetable?0:-1" :aria-label="bossTargetable?'Viser '+display.boss.name:undefined" @click="targetBoss" @keydown.enter.prevent="targetBoss" @keydown.space.prevent="targetBoss" :class="{'is-selectable':bossTargetable,'is-shielded':display.shield?.hp>0,'takes-hit':effect?.slot===4&&effect?.kind==='-damage','fainted':display.boss.currentHp<=0}"><span class="raid-boss-aura"/><span v-if="bossTargetable" class="raid-target-label">⌖ Viser {{ display.boss.name }}</span><pokemon-portrait :src="sprite(display.boss)" :alt="display.boss.name"/><battle-persistent-effect :effects="display.boss.effects" :reduced="reduced"/><span v-if="effect?.slot===4&&amount" class="raid-damage" :class="{'is-heal':effect.kind==='-heal'}">{{ effect.kind==='-heal'?'+':'−' }}{{ amount }}</span><span v-if="effect?.slot===4&&(effect.kind==='-crit'||effect.critical)" class="raid-critical">CRITIQUE !</span><battle-stat-change v-if="!reduced&&effect?.slot===4&&['-boost','-unboost'].includes(effect.kind)" :key="effect.id" :effects="statEffect(effect)"/></div>
   <div ref="ally" class="raid-ally" :class="[focusPhase,{'takes-hit':effect?.slot===shown&&effect?.kind==='-damage','fainted':main?.currentHp<=0&&!main?.withdrawn,'retired':main?.withdrawn}]"><pokemon-portrait v-if="main" :src="sprite(main,true)" :alt="main.name"/><battle-persistent-effect v-if="main" :effects="main.effects" :reduced="reduced"/><span v-if="effect?.slot===shown&&amount" class="raid-damage" :class="{'is-heal':effect.kind==='-heal'}">{{ effect.kind==='-heal'?'+':'−' }}{{ amount }}</span><span v-if="effect?.slot===shown&&(effect.kind==='-crit'||effect.critical)" class="raid-critical">CRITIQUE !</span><battle-stat-change v-if="!reduced&&effect?.slot===shown&&['-boost','-unboost'].includes(effect.kind)" :key="effect.id" :effects="statEffect(effect)"/></div>
   <battle-move-effect v-if="fx&&!reduced" :key="fx.id" :fx="fx" :path="fx.path" :color="color(fx.moveType)"/>
   <raid-corruption-effect :event="corruptionFx" :reduced="reduced"/>
   <div v-if="loading" class="raid-entry" role="status"><span class="raid-entry-rift"/><b>La faille s’ouvre…</b><small>Chargement du terrain et des Pokémon</small></div>
   <p v-if="friendship" class="raid-friendship" role="alert">✧ {{ friendship }}<small>L’amitié l’a sauvé à 1 PV. Retire-le pour le protéger : ce sursis ne se reproduira pas.</small></p>
  </div>
  <div class="raid-console">
   <div v-if="activeEffects.length" class="raid-team-effects" aria-label="Effets collectifs actifs"><span v-for="e in activeEffects" :key="e.key" :class="{'is-enemy':e.enemy}" :title="e.description" data-raid-team-effect><b>{{ e.enemy?'Boss · ':'' }}{{ e.name }}</b><small>{{ e.description }}<template v-if="e.turns"> · {{ e.turns }} tour{{ e.turns>1?'s':'' }}</template></small></span></div>
   <p v-if="display.warning&&!display.finished" class="raid-warning" :class="{'is-imminent':!display.warning.nextTurn}"><span>⚠</span>{{ display.warning.nextTurn?'Au prochain tour':'Ce tour-ci' }} : {{ display.warning.move }} frappe tous les alliés.</p>
   <p v-if="display.wishes?.length" class="raid-warning">✧ Un Vœu soignera le prochain allié qui agit au tour suivant.</p>
   <p class="raid-message" role="status" aria-live="polite">{{ message || (playing?'Résolution du tour…':frame.finished?frame.won?'La corruption recule.':'Le raid est terminé.':canAct?'Choisis une action pour '+current.name:pendingMine?'Tes actions sont enregistrées.':'Tes alliés préparent leurs actions.') }}</p>
   <div class="raid-ally-cards" aria-label="Les quatre alliés"><button v-for="(p,i) in display.allies" :key="p.uuid" :disabled="!targetable(i)" :aria-pressed="slot===i" :class="{'is-selected':slot===i,'is-corrupted':p.corrupted,'is-acting':playing&&shown===i,'is-withdrawn':p.withdrawn||!p.currentHp,'is-targeted':frame.focus===i,'is-valid-target':targeting&&targetable(i),'is-hit':!!cardHits[i]&&cardHits[i].kind==='-damage'}" @click="chooseCard(i)"><pokemon-portrait :src="sprite(p)" alt=""/><span v-if="cardHits[i]" :key="cardHits[i].id" class="raid-card-number" :class="{'is-heal':cardHits[i].kind==='-heal'}">{{ cardHits[i].kind==='-heal'?'+':'−' }}{{ cardHits[i].amount }}</span><span class="raid-ally-info"><span><b>{{ p.name }}</b><i v-if="frame.focus===i" title="Attention du boss">⌖</i><small>{{ frame.order.indexOf(i)+1 || '—' }}</small></span><span class="raid-card-hp"><i :style="{width:percent(p)+'%'}"/></span><small>{{ p.currentHp }}/{{ p.maxHp }} PV <em v-if="p.status!=='normal'">{{ status(p.status) }}</em><em v-if="p.withdrawn">Retiré</em><em v-else-if="!p.currentHp">{{ p.survivalKitUsed?'K.O. protégé':p.permanentlyLost?'Perdu':'K.O.' }}</em></small><span class="raid-aggro" :aria-label="'Aggro : '+p.aggro+' %'"><i :style="{width:p.aggro+'%'}"/></span><small class="raid-card-owner">{{ p.ownerName }} <b>{{ frame.allies[i].ready?'✓':frame.allies[i].canControl?'· toi':'' }}</b><i v-if="frame.soloClock&&!frame.allies[i].ready&&!p.withdrawn&&p.currentHp>0" class="raid-card-clock">{{ i===frame.soloClock.slot?remaining:Math.ceil(frame.soloClock.remainingMs[i]/1000) }} s</i></small></span></button></div>
   <div v-if="!frame.finished" class="raid-controls">
    <div class="raid-decision-heading"><span>{{ playing?'Actions en cours':current?.canControl?current.name+' · à toi':current?.ownerName?'Au tour de '+current.ownerName:'En attente' }}</span><small v-if="frame.soloClock&&!playing&&needsChoice" class="raid-clock-label">Ce Pokémon</small><strong v-if="!playing&&needsChoice" :class="{'is-urgent':remaining<=8}" aria-live="off">{{ remaining }} s</strong></div>
    <div v-if="targeting" class="raid-targeting"><p>{{ passing?'Passer la main : sélectionne un allié qui n’a pas encore joué.':'Cible de '+selectedMove.name+' : touche le boss ou une carte autorisée.' }}</p><button v-if="!passing&&selectedMove.targets.some(t=>t.slot===4)" :disabled="busy" @click="sendMove(1)">Viser {{ frame.boss.name }}</button><button @click="cancelTarget">Annuler</button></div>
    <div v-else-if="canAct" class="raid-moves"><button v-for="m in current.moves" :key="m.index" :style="{'--move-color':color(m.type)}" :disabled="m.disabled||m.pp<=0&&m.id!=='struggle'" @click="move(m)"><b>{{ m.name }}</b><small>{{ type(m.type) }} · {{ m.category==='Physical'?'Physique':m.category==='Special'?'Spéciale':'Statut' }} · {{ m.power||'—' }}</small><span>{{ m.pp }} / {{ m.maxpp }} PP</span></button></div>
    <div v-if="canAct&&!targeting" class="raid-actions"><button :disabled="busy" @click="passing=true">Passer la main ↗</button><button class="raid-retreat" :disabled="busy" @click="retreat=true">Retirer mon Pokémon</button></div>
    <p v-if="error" class="raid-error" role="alert">{{ error }}</p>
   </div>
   <button v-else-if="!playing" class="raid-return" @click="$emit('results')">Voir le bilan du raid →</button>
  </div>
  <div v-if="retreat||help" class="raid-confirm" @keydown.esc.stop="retreat=false;help=false"><section><template v-if="retreat"><h3>Retirer {{ current.name }} ?</h3><p>Il quitte définitivement ce raid et reste dans ta collection avec ses PV actuels. Il ne pourra pas revenir dans le combat.</p><button @click="retreat=false">Rester</button><button class="raid-retreat" :disabled="busy" @click="submit({action:'retreat',confirm:true});retreat=false">Le mettre à l’abri</button></template><template v-else><h3>Quatre alliés, une seule chance</h3><p>La jauge orange attire les attaques ciblées du boss. Par Ici et Poudre Fureur permettent de protéger les autres. Une attaque de zone est annoncée tous les deux tours.</p><p>En solo, chaque Pokémon dispose de 30 secondes pour décider. Le temps restant est conservé si tu changes de carte. Les attaques de zone peuvent aussi toucher tes alliés selon leur portée.</p><p>Brise les boucliers à 70 % et 30 %. Passer la main sacrifie l’action de ton Pokémon pour faire agir un allié plus tôt. Vœu soigne le prochain allié qui agit au tour suivant.</p><p>Un Pokémon à pleine vie peut survivre une fois à 1 PV grâce à l’amitié. Retire-le avant qu’il ne soit trop tard. Les K.O. sont définitifs sans Kit de survie.</p><button @click="help=false">Continuer</button></template></section></div>
  <slot name="social-chat"/>
 </section>
</template>
<script>
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
    cardHits: {}, shieldDamage:null, focusPhase:'',
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
    'frame.token'() {
      this.cancelTarget();
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
    clearInterval(this._clock);
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
    async focusAlly(slot) {
      if(slot<0||slot>=4||this.shown===slot||this._closed)return;
      this.focusPhase='ally-leave';await this.sleep(this.reduced?0:timing.focusOutMs);if(this._closed)return;
      this.shown=slot;this.focusPhase='ally-enter';await this.$nextTick();await this.sleep(this.reduced?0:timing.focusInMs);this.focusPhase='';
    },
    async finishMoveFx() {
      if(!this.reduced&&this.fx&&this._impactAt)await this.sleep(Math.max(0,this.fx.impactMs-(performance.now()-this._impactAt)));
      this._impactAt=0;
    },
    async animate(e, events, index) {
      await this.finishMoveFx();if(this._closed)return;
      this.fx=null;this.cardHits={};this.shieldDamage=null;
      await this.focusAlly(e.slot<4?e.slot:e.target<4?e.target:this.shown);
      await this.sleep(this.reduced?0:e.slot===4?timing.bossPauseMs:timing.betweenActionsMs);
      this.message=e.message;this.effect={...e,id:Math.random()};this.amount=0;await this.$nextTick();
      const v=moveVisual(e),plan=raidMovePlan(events,index,this.display),start=this.point(e.slot),fullTargets=plan.targets.map(t=>({...t,...this.point(t.slot)}));
      // The large visible Pokémon receives the scene effect; the other allies
      // receive individual impacts and exact damage on their four persistent cards.
      const targets=fullTargets.filter(t=>t.slot===4||t.slot===this.shown),end=targets[0]||this.point(e.target??4);
      const fx={...v,id:Math.random(),stage:'windup',windupMs:Math.max(v.windupMs,timing.windupMinMs),travelMs:Math.max(v.travelMs,timing.travelMinMs),impactMs:Math.max(v.impactMs,timing.impactMinMs),fullTargets,result:{success:!plan.failed&&!plan.prepared},path:{startX:start.x,startY:start.y,targetX:end.x,targetY:end.y,groundY:end.groundY,targets}};
      this.fx=fx;await this.sleep(this.reduced?20:fx.windupMs);if(this._closed)return;
      this.fx={...fx,stage:plan.prepared?'windup':'travel'};await this.sleep(this.reduced?20:fx.travelMs);if(this._closed)return;
      this.fx={...fx,stage:plan.prepared?'await':e.damageClass==='status'?'aura':'await'};
      if(e.damageClass==='status')await this.sleep(this.reduced?20:timing.statusMs);
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
          if(e.kind==='move'){await this.animate(e,events,i);continue;}
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
          }else if(e.kind==='retreat'&&p){this.$set(p,'withdrawn',true);this.message=p.name+(e.reason==='timeout'?' est retiré en sécurité : son délai est écoulé.':' est mis à l’abri.');await this.sleep(this.reduced?30:timing.resultMs);
          }else if(['pass','passFailed'].includes(e.kind)){this.message=e.kind==='pass'?p.name+' passe la main à '+this.display.allies[e.target]?.name+'.':'Le relais échoue : cet allié a déjà joué.';await this.sleep(this.reduced?30:timing.resultMs);
          }else if(e.kind==='-crit'){await this.sleep(this.reduced?20:180);
          }else if(['-boost','-unboost'].includes(e.kind)&&p){this.$set(p,'boosts',{...p.boosts,[e.effect]:Math.max(-6,Math.min(6,(p.boosts[e.effect]||0)+(e.kind==='-boost'?1:-1)*Number(e.value)))});this.message=p.name+' : '+this.statEffect(e)[0].text+(e.kind==='-boost'?' augmente.':' diminue.');await this.sleep(this.reduced?30:timing.statMs);
          }else if(['-sidestart','-sideend','-fieldstart','-fieldend'].includes(e.kind)){this.collectiveEvent(e);await this.sleep(this.reduced?30:timing.statusMs);
          }else if(['-status','-curestatus'].includes(e.kind)&&p){this.$set(p,'status',e.kind==='-curestatus'?'normal':({brn:'burn',psn:'poison',tox:'badly_poison',par:'paralyze',slp:'sleep',frz:'freeze'})[e.effect]||e.effect);this.message=p.name+(e.kind==='-curestatus'?' est rétabli.':' : '+this.status(p.status)+'.');await this.sleep(this.reduced?30:timing.statusMs);
          }else if(['-immune','-miss','-fail','cant','faint'].includes(e.kind)&&p){this.message=e.kind==='-immune'?p.name+' est immunisé.':e.kind==='-miss'?'L’attaque manque sa cible.':e.kind==='faint'?p.name+(e.slot<4&&frame.allies[e.slot]?.survivalKitUsed?' reste K.O. : son Kit de survie a été consommé.':e.slot<4&&frame.allies[e.slot]?.permanentlyLost?' est définitivement perdu.':' est K.O.'):e.kind==='cant'?p.name+' ne peut pas agir.':'La capacité échoue.';await this.sleep(this.reduced?30:timing.resultMs);}
          this.phaseEffect='';
        }
        await this.finishMoveFx();this.display=JSON.parse(JSON.stringify(frame));this.fx=null;this.effect=null;this.amount=0;this.cardHits={};this.shieldDamage=null;this.message='';this.phaseEffect='';
      }}finally{
        this.autoSlot();if(!this._closed)await this.focusAlly(this.slot);this.playing=false;
        if(!this._closed&&this.frame.soloClock&&!this.frame.finished&&this._presentedToken!==this.frame.token){this._presentedToken=this.frame.token;this.$emit('action',{action:'presented',slot:this.slot,token:this.frame.token});}
        if(this._frames.length&&!this._closed)void this.play();
      }
    }
  }
};
</script>
<style scoped>
.raid-battle{position:fixed;inset:0;z-index:2100;max-width:1180px;margin:auto;display:flex;flex-direction:column;background:var(--journal-paper);color:var(--journal-ink);font:13px/1.4 var(--journal-font);overflow:hidden;box-shadow:0 0 100px #0009}.raid-battle *{box-sizing:border-box}.raid-reduced *{animation:none!important;transition:none!important}.raid-ally-cards>button.is-corrupted{background:#9471b12b;border-color:#a385bb}header{display:flex;align-items:center;gap:10px;padding:9px 18px;flex:none;background:var(--journal-soft);border-bottom:2px solid #9674ae}header>div{flex:1}header small{font-size:9px;letter-spacing:.1em;color:var(--journal-muted)}header b{display:block;font-size:16px}header span{font-size:11px;font-weight:400;margin-left:12px}button{font:inherit;color:inherit;min-height:42px;min-width:42px;border:1px solid var(--journal-border);background:var(--journal-card);border-radius:8px;padding:8px 12px;cursor:pointer}button:disabled{cursor:default;opacity:.5}button:focus-visible{outline:2px solid #b18bd1;outline-offset:2px}.raid-stage{position:relative;flex:1;min-height:180px;background-image:linear-gradient(#27103c36,#0e122a33),var(--raid-bg);background-size:cover;background-position:center;overflow:hidden;isolation:isolate}.raid-boss-hud{position:absolute;top:16px;left:18px;width:42%;max-width:400px;background:#281c3be8;color:#f2e9ff;border:2px solid #a082b9;border-radius:9px 23px 9px 23px;padding:12px 16px;z-index:30;box-shadow:0 4px 0 #130d24a0}.raid-boss-hud>span{display:flex;gap:8px;align-items:baseline;justify-content:space-between}.raid-boss-hud b{font-size:17px}.raid-boss-hud small{font-size:10px;color:#d5c6e8;display:block}.raid-boss-health{height:15px;background:#120e24;border:1px solid #ac93b8;border-radius:8px;margin:10px 0 5px;position:relative;overflow:hidden}.raid-boss-health>i{height:100%;display:block;background:linear-gradient(90deg,#9570c1,#cc9fea);transition:width .25s}.raid-boss-health>em{position:absolute;top:0;bottom:0;width:2px;background:#fff8}.raid-shield-bar{position:relative;height:17px;margin-top:6px;border-radius:4px;background:#211432;overflow:hidden}.raid-shield-bar i{display:block;height:100%;background:#8d6ac2}.raid-shield-bar span{position:absolute;inset:0;font:9px/17px var(--journal-font);text-align:center;color:white;letter-spacing:.05em}.raid-weather{position:absolute;top:10px;right:12px;z-index:35}.raid-boss,.raid-ally{position:absolute;display:flex;align-items:flex-end;justify-content:center;pointer-events:none}.raid-boss{right:5%;bottom:31%;width:38%;height:52%;z-index:5}.raid-boss>.pokemon-portrait{height:auto;aspect-ratio:1;width:100%;transform:scale(1.4) translateY(11%);transform-origin:50% 100%;object-fit:contain;object-position:center bottom;image-rendering:pixelated;filter:drop-shadow(0 0 12px #9853c855);position:relative;z-index:2}.raid-boss:before{content:"";position:absolute;bottom:0;left:-4%;right:-4%;height:13%;border-radius:50%;border:2px solid #817b75;background:radial-gradient(ellipse,#9b9e88,#6c7162);box-shadow:0 4px 0 #3c414266;z-index:1}.raid-boss-aura{position:absolute;inset:-8%;background:radial-gradient(ellipse,#9853bf00 35%,#8e51b83d 58%,#6f429400 73%);animation:raid-breathe 3s ease-in-out infinite;transform-origin:50% 70%}.is-shielded:after{content:'';position:absolute;inset:0 3%;border:2px solid #c89eeda8;border-radius:48% 53% 40% 48%;box-shadow:inset 0 0 30px #a169d055,0 0 20px #b781d744;background:linear-gradient(35deg,transparent 38%,#c999ed33 39%,transparent 40%);z-index:3}.raid-ally{left:-5%;bottom:-3px;width:47%;height:62%;z-index:6}.raid-ally>.pokemon-portrait{width:100%;height:auto;aspect-ratio:1;translate:0 11%;object-fit:contain;object-position:center bottom;image-rendering:pixelated}.raid-ally.fainted,.raid-boss.fainted{opacity:.2;translate:0 12px;transition:opacity .4s,translate .4s}.raid-ally.retired{opacity:0;scale:.4;transition:opacity .3s,scale .3s}.raid-damage{position:absolute;top:9%;left:50%;transform:translateX(-50%);z-index:70;font:bold 32px var(--journal-font);color:#fff4db;text-shadow:2px 2px 0 #221424,-2px -1px 0 #221424;animation:raid-number .4s ease-out}.raid-damage.is-heal{color:#b7efc8}.raid-critical{position:absolute;top:0;z-index:72;font-weight:900;color:#ffe9a5;text-shadow:2px 2px #833c56;font-size:21px;animation:raid-number .4s ease-out}.raid-entry{position:absolute;inset:0;z-index:100;background:radial-gradient(ellipse,#38234d,#0c1024 75%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#efdef9}.raid-entry b{font:25px Georgia,serif}.raid-entry small{color:#b6a2c8;font-size:11px}.raid-entry-rift{height:80px;width:35px;border-radius:50%;background:#090b15;box-shadow:0 0 15px #bd8ae9,0 0 70px #a564d5,0 0 0 7px #6b4c9333;animation:raid-breathe 1.7s infinite}.raid-friendship{position:absolute;left:10px;right:10px;bottom:12px;background:#f5eaceed;color:#4c4050;border:1px solid #bd9c69;border-radius:9px;padding:10px 14px;z-index:90;font-weight:700;max-width:580px;margin:auto}.raid-friendship small{display:block;font-weight:400;font-size:11px}.raid-console{flex:none;padding:10px 16px 12px;border-top:2px solid #9876b0;background:var(--journal-soft)}.raid-warning{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--journal-muted);margin:0 0 5px}.raid-warning.is-imminent{color:#ae6b55;font-weight:600}.raid-message{min-height:19px;margin:4px 0 8px;font-size:12px;overflow-wrap:anywhere}.raid-ally-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.raid-ally-cards>button{padding:7px;display:flex;align-items:center;gap:6px;text-align:left;min-width:0;opacity:1}.raid-ally-cards>button:disabled{opacity:.78}.raid-ally-cards>button.is-selected{border-color:#ac85c7;background:color-mix(in srgb,#a47cc5 15%,var(--journal-paper))}.raid-ally-cards>button.is-acting{box-shadow:inset 0 0 0 1px #c29cd9,0 0 10px #956eb444}.raid-ally-cards>button.is-valid-target{border-color:#6ca08c;box-shadow:0 0 0 1px #91c6a088}.raid-ally-cards>button.is-withdrawn{opacity:.4}.raid-ally-cards .pokemon-portrait{width:44px;height:48px;object-fit:contain;image-rendering:pixelated;flex:none}.raid-ally-info{flex:1;min-width:0}.raid-ally-info>span:first-child{display:flex;align-items:center;gap:4px}.raid-ally-info b{font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.raid-ally-info small{font-size:9px;display:block}.raid-ally-info em{font-style:normal;color:#ab7755}.raid-ally-info>span:first-child>small{margin-left:auto;color:var(--journal-muted)}.raid-ally-info>span:first-child>i{color:#dc914c;font-style:normal;font-size:17px;line-height:12px}.raid-card-hp,.raid-aggro{display:block;height:5px;border-radius:3px;background:var(--journal-border);overflow:hidden;margin:4px 0}.raid-card-hp i{display:block;height:100%;background:#78ae90;transition:width .25s}.raid-aggro{height:3px;margin:4px 0 3px}.raid-aggro i{display:block;background:#d29a53;height:100%;transition:width .3s}.raid-card-owner{color:var(--journal-muted)}.raid-card-owner b{font-size:9px;color:var(--journal-accent)}.raid-controls{margin-top:8px}.raid-decision-heading{display:flex;align-items:center;justify-content:space-between;min-height:23px;font-size:11px;color:var(--journal-muted);margin-bottom:6px}.raid-decision-heading strong{font-variant-numeric:tabular-nums;color:var(--journal-heading);font-size:14px}.is-urgent{color:#c96e65!important}.raid-moves{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.raid-moves>button{text-align:left;border-color:var(--move-color);border-left-width:4px;background:color-mix(in srgb,var(--move-color) 20%,var(--journal-paper));padding:8px 10px;min-width:0}.raid-moves b,.raid-moves small,.raid-moves>button>span{display:block;overflow-wrap:anywhere}.raid-moves b{font-size:12px}.raid-moves small,.raid-moves>button>span{font-size:9px}.raid-moves>button>span{color:var(--journal-muted);margin-top:3px}.raid-actions{display:flex;gap:8px;margin-top:8px;justify-content:flex-end}.raid-actions button{font-size:11px;min-height:35px;padding:7px 12px}.raid-retreat{color:#9c5b66;border-color:#b88c95}.raid-targeting{padding:10px;background:var(--journal-paper);border-radius:8px}.raid-targeting p{margin:0 0 7px}.raid-targeting button{margin-right:8px}.raid-error{color:var(--journal-danger);margin:7px 0 0;font-size:12px}.raid-return{display:block;margin:12px auto 0;background:#806093;color:white}.raid-confirm{position:absolute;inset:0;z-index:220;display:grid;place-items:center;background:#0a0f25b8;padding:16px}.raid-confirm section{max-width:500px;max-height:80dvh;overflow:auto;padding:23px;border:2px solid #9c7eb2;border-radius:12px;background:var(--journal-paper)}.raid-confirm h3{font:25px Georgia,serif;color:var(--journal-heading);margin:0}.raid-confirm button{margin:6px 6px 0 0}.takes-hit>.pokemon-portrait{animation:raid-hit .25s}.is-hit{background:#b2768533!important}.shield-break .raid-boss:after{content:"";position:absolute;inset:0;border:2px solid #dab8f4;border-radius:40%;background:linear-gradient(35deg,transparent 45%,#c79cea88 48%,transparent 50%);animation:raid-shatter .6s ease-out}.shield-appears .raid-boss{filter:brightness(1.6)}.shield-hit .raid-boss:after{filter:brightness(2)}.boss-arrives .raid-boss>.pokemon-portrait{animation:raid-arrival .85s ease-out}@keyframes raid-arrival{from{opacity:0;filter:brightness(3) drop-shadow(0 0 25px #b888ef);scale:.65}65%{opacity:1;filter:brightness(1.7);scale:1.05}to{opacity:1;scale:1}}@keyframes raid-breathe{50%{scale:1.07;opacity:.8}}@keyframes raid-number{from{translate:0 12px;opacity:0}to{translate:0;opacity:1}}@keyframes raid-hit{30%{translate:-5px;filter:brightness(1.7)}70%{translate:4px}}@keyframes raid-shatter{to{scale:1.4;opacity:0;clip-path:polygon(0 0,40% 20%,15% 100%,75% 65%,100% 100%,90% 0,0 0)}}@media(max-width:640px){header{padding:7px 11px}header b{font-size:14px}.raid-stage{background-image:linear-gradient(#27103c36,#0e122a33),var(--raid-mobile-bg);background-position:center;min-height:155px}.raid-boss-hud{left:10px;top:10px;width:57%;padding:9px 12px}.raid-boss-hud b{font-size:14px}.raid-boss-hud>span{display:block}.raid-boss-hud small{font-size:9px}.raid-boss-health{height:12px;margin:6px 0 4px}.raid-boss{width:44%;height:52%;bottom:23%;right:1%}.raid-ally{width:55%;height:56%;left:-8%}.raid-console{padding:8px 10px}.raid-ally-cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.raid-ally-cards>button{padding:4px 6px}.raid-ally-cards .pokemon-portrait{width:35px;height:38px}.raid-ally-info b{font-size:10px}.raid-ally-info small{font-size:8px}.raid-card-hp{margin:3px 0;height:4px}.raid-aggro{margin:3px 0 2px}.raid-card-owner{line-height:10px}.raid-moves{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.raid-moves>button{padding:6px 9px;min-height:54px}.raid-moves b{font-size:11px}.raid-moves>button>span{display:inline;font-size:8px}.raid-moves small{display:inline;font-size:8px;margin-right:6px}.raid-message{font-size:11px;margin:3px 0 5px;min-height:16px}.raid-warning{font-size:9px}.raid-controls{margin-top:5px}.raid-decision-heading{min-height:18px;margin-bottom:4px}.raid-actions{margin-top:5px}.raid-actions button{min-height:34px;font-size:10px}.raid-friendship{font-size:11px;padding:8px}.raid-friendship small{font-size:9px}.raid-damage{font-size:27px}}
@media(max-height:650px) and (min-width:641px){.raid-ally-cards .pokemon-portrait{height:30px;width:30px}.raid-console{padding:6px 14px}.raid-stage{min-height:140px}.raid-moves>button{padding:5px 10px;min-height:42px}.raid-actions button{min-height:30px}.raid-ally-info small{font-size:8px}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>

<style scoped>
.raid-gauge-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:7px;font-size:10px;font-variant-numeric:tabular-nums}.raid-gauge-heading b{font:600 10px var(--journal-font);letter-spacing:.04em}.raid-boss-health{margin:5px 0 3px}.raid-boss-health>i,.raid-shield-bar>i{position:absolute;left:0;top:0;height:100%;transition:width .55s ease}.raid-boss-health>i.raid-gauge-trail,.raid-shield-bar>i.raid-gauge-trail{background:#f9e2ab;opacity:.8;transition:width .85s ease .18s}.raid-shield-meter{border-top:1px solid #b99dd044;margin-top:8px;padding-top:1px;position:relative;color:#c5b4da}.raid-shield-meter.is-active{color:#f0d6ff}.raid-shield-bar{height:10px;border:1px solid #8f72ae;margin:5px 0 2px;transition:border-color .6s,background .6s}.raid-shield-bar>i{background:linear-gradient(90deg,#7b72df,#dcb2ef)}.raid-shield-loss{position:absolute;right:0;bottom:-15px;font-size:10px;color:#f3ceff;text-shadow:1px 1px #241b35;animation:raid-number .45s ease-out}.raid-boss.is-selectable{pointer-events:auto;cursor:pointer;border-radius:45%;outline:2px solid #efd587;outline-offset:5px;background:radial-gradient(ellipse,#e9d39511 30%,#d7b56f44 70%,transparent 73%)}.raid-boss.is-selectable>.pokemon-portrait{filter:drop-shadow(0 0 8px #f1d997) drop-shadow(0 0 18px #bf9a6a)}.raid-boss:focus-visible{outline:3px solid #fff0bc}.raid-target-label{position:absolute;bottom:-22px;z-index:15;white-space:nowrap;border:1px solid #e2c47e;border-radius:16px;padding:5px 12px;background:#25263bec;color:#fff1c6;font-weight:700;font-size:12px;box-shadow:0 0 16px #d8ba6b55}.raid-boss.is-selectable>.pokemon-portrait{pointer-events:none}.raid-ally.ally-leave{opacity:0;translate:-16px 0;transition:opacity .16s,translate .16s}.raid-ally.ally-enter{animation:raid-ally-enter .22s ease-out}.raid-card-number{position:absolute;top:1px;right:7px;color:#ffe1d8;font-weight:900;text-shadow:1px 1px #51243c,-1px -1px #51243c;font-size:20px;z-index:5;animation:raid-number .45s ease-out;pointer-events:none}.raid-card-number.is-heal{color:#b9f0cb}.raid-ally-cards>button{position:relative}.raid-team-effects{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:7px}.raid-team-effects>span{display:flex;flex-direction:column;gap:1px;border:1px solid #7da9bb;padding:4px 8px;border-radius:6px;background:#46809918;max-width:100%;font-size:10px}.raid-team-effects small{font-size:9px;color:var(--journal-muted)}.raid-team-effects .is-enemy{border-color:#b393c3;background:#916eab18}.raid-clock-label{margin-left:auto;margin-right:7px;font-size:10px;color:var(--journal-muted)}.raid-shield-meter.is-breaking{animation:raid-meter-break .9s ease-out}.raid-boss-health em{z-index:3}
@keyframes raid-ally-enter{from{opacity:0;translate:-12px 0}to{opacity:1;translate:0 0}}@keyframes raid-meter-break{25%{filter:brightness(1.7);translate:-2px}55%{translate:2px}to{translate:0;filter:brightness(1)}}
@media(max-width:640px){.raid-gauge-heading,.raid-gauge-heading b{font-size:9px}.raid-shield-meter{margin-top:6px}.raid-boss-hud{padding:8px 10px}.raid-boss-health{margin:4px 0 2px}.raid-shield-bar{height:8px}.raid-shield-loss{font-size:9px;bottom:-12px}.raid-team-effects{gap:4px;margin-bottom:5px}.raid-team-effects>span{padding:3px 6px;font-size:9px}.raid-team-effects small{font-size:8px}.raid-target-label{font-size:10px;padding:5px 9px;bottom:-20px}.raid-card-number{font-size:18px}.raid-clock-label{font-size:9px}.raid-targeting p{font-size:11px}.raid-boss.is-selectable{outline-offset:2px}}
@media(prefers-reduced-motion:reduce){.raid-boss-health>i,.raid-shield-bar>i{transition:none}.raid-ally.ally-enter,.raid-shield-meter.is-breaking{animation:none}.raid-ally.ally-leave{opacity:1;translate:0 0}}
</style>

<style scoped>
@media(max-width:640px) and (max-height:700px){.raid-battle header{padding:5px 9px}header button{min-height:34px;min-width:34px;padding:5px 8px}.raid-console{padding:5px 8px}.raid-ally-cards .pokemon-portrait{width:27px;height:30px}.raid-ally-cards>button{min-height:44px;padding:3px 5px}.raid-ally-info b{font-size:9px}.raid-ally-info small{font-size:8px}.raid-aggro{margin:2px 0}.raid-card-hp{margin:2px 0}.raid-moves>button{min-height:44px;padding:4px 7px}.raid-moves b{font-size:10px}.raid-warning{font-size:8px;margin-bottom:3px}.raid-message{font-size:10px;margin-bottom:3px}.raid-actions button{min-height:30px;padding:4px 8px}.raid-team-effects{margin-bottom:3px}.raid-team-effects>span{padding:2px 5px}.raid-boss-hud{padding:6px 8px;top:7px;left:7px;width:53%}.raid-boss-hud b{font-size:12px}.raid-boss-hud small{font-size:8px}.raid-gauge-heading,.raid-gauge-heading b{font-size:8px;margin-top:4px}.raid-shield-meter{margin-top:4px}.raid-target-label{font-size:9px;padding:3px 6px;bottom:-15px}}
@media(min-width:641px) and (max-height:600px){.raid-battle{display:grid;grid-template-columns:minmax(0,1fr) 370px;grid-template-rows:46px minmax(0,1fr)}.raid-battle header{grid-column:1/-1;padding:5px 12px}header button{min-height:32px;min-width:32px;padding:4px 8px}.raid-stage{min-height:0}.raid-console{min-height:0;max-height:100%;overflow-y:auto;border-top:none;border-left:2px solid #9876b0;padding:6px 9px}.raid-ally-cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:4px}.raid-ally-cards>button{min-height:42px;padding:3px 5px}.raid-ally-cards .pokemon-portrait{width:27px;height:30px}.raid-moves{grid-template-columns:repeat(2,minmax(0,1fr));gap:4px}.raid-moves>button{min-height:43px;padding:4px 7px}.raid-moves b{font-size:10px}.raid-moves small,.raid-moves>button>span{font-size:8px;display:inline}.raid-team-effects>span{padding:2px 5px}.raid-message{font-size:10px}.raid-boss-hud{width:49%;padding:7px 9px;top:8px;left:8px}.raid-boss-hud b{font-size:13px}.raid-boss-hud small{font-size:8px}.raid-actions button{min-height:28px;padding:4px 7px;font-size:9px}.raid-warning{font-size:9px}}
</style>

<style scoped>
.raid-card-clock{float:right;margin-left:4px;font-style:normal;font-variant-numeric:tabular-nums;color:var(--journal-accent)}.raid-card-number{top:-7px;left:6px;right:auto;animation:raid-card-hit .95s ease-out both}
@keyframes raid-card-hit{from{opacity:0;translate:0 5px}15%,70%{opacity:1;translate:0 0}to{opacity:0;translate:0 -14px}}
</style>

<style scoped>
/* Reserve the decision console while replaying: hiding buttons must not move
   the battlefield or invalidate projectile anchors halfway through a turn. */
.raid-console{height:330px;min-height:0;max-height:calc(100dvh - 220px);overflow-y:auto;scrollbar-width:thin}
@media(max-width:640px){.raid-console{height:430px;max-height:calc(100dvh - 210px)}}
@media(min-width:641px) and (max-height:600px){.raid-console{height:auto;max-height:100%}}
</style>

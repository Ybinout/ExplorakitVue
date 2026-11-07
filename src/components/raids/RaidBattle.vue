<template>
 <section ref="dialog" tabindex="-1" class="raid-battle" :class="{'raid-reduced':reduced}" role="dialog" aria-modal="true" aria-label="Raid de corruption" @keydown.stop="onKey" @keyup.stop data-raid-battle>
  <header><div><small>FAILLES DE CORRUPTION · {{ difficulty }}</small><b>{{ frame.boss.name }} <span>Tour {{ frame.turn }}</span></b></div><button @click="help=!help" aria-label="Aide sur le raid">?</button><slot name="social-toggle"/></header>
  <div ref="stage" class="raid-stage" :class="[phaseEffect,{'is-entering':loading,'is-critical':effect?.kind==='-crit'}]">
   <battle-rain v-if="frame.weather==='raindance'" environment="arena" :animations-enabled="!reduced"/><battle-snow v-if="['hail','snowscape'].includes(frame.weather)" environment="arena" :animations-enabled="!reduced"/><battle-sandstorm v-if="frame.weather==='sandstorm'" environment="arena" :animations-enabled="!reduced"/>
   <article class="raid-boss-hud"><span><b>{{ display.boss.name }}</b><small>N. {{ display.boss.level }} · CORROMPU</small></span><div class="raid-boss-health"><i :style="{width:percent(display.boss)+'%'}"/><em style="left:30%"/><em style="left:70%"/></div><small>{{ display.boss.currentHp }} / {{ display.boss.maxHp }} PV <span v-if="display.boss.status!=='normal'">· {{ status(display.boss.status) }}</span></small><div v-if="display.shield?.hp>0" class="raid-shield-bar"><i :style="{width:display.shield.hp/display.shield.max*100+'%'}"/><span>BOUCLIER · {{ display.shield.hp }} / {{ display.shield.max }}</span></div><small v-else-if="frame.vulnerableTurns">Bouclier brisé · {{ frame.vulnerableTurns }} tour{{ frame.vulnerableTurns>1?'s':'' }} de répit</small></article>
   <battle-weather-info v-if="weather" class="raid-weather" :weather="weather"/>
   <div ref="boss" class="raid-boss" :class="{'is-shielded':display.shield?.hp>0,'takes-hit':effect?.slot===4&&effect?.kind==='-damage','fainted':display.boss.currentHp<=0}"><span class="raid-boss-aura"/><pokemon-portrait :src="sprite(display.boss)" :alt="display.boss.name"/><battle-persistent-effect :effects="display.boss.effects" :reduced="reduced"/><span v-if="effect?.slot===4&&amount" class="raid-damage" :class="{'is-heal':effect.kind==='-heal'}">{{ effect.kind==='-heal'?'+':'−' }}{{ amount }}</span><span v-if="effect?.slot===4&&effect.kind==='-crit'" class="raid-critical">CRITIQUE !</span><battle-stat-change v-if="!reduced&&effect?.slot===4&&['-boost','-unboost'].includes(effect.kind)" :key="effect.id" :effects="statEffect(effect)"/></div>
   <div ref="ally" class="raid-ally" :class="{'takes-hit':effect?.slot===shown&&effect?.kind==='-damage','fainted':main?.currentHp<=0&&!main?.withdrawn,'retired':main?.withdrawn}"><pokemon-portrait v-if="main" :src="sprite(main,true)" :alt="main.name"/><battle-persistent-effect v-if="main" :effects="main.effects" :reduced="reduced"/><span v-if="effect?.slot===shown&&amount" class="raid-damage" :class="{'is-heal':effect.kind==='-heal'}">{{ effect.kind==='-heal'?'+':'−' }}{{ amount }}</span><span v-if="effect?.slot===shown&&effect.kind==='-crit'" class="raid-critical">CRITIQUE !</span><battle-stat-change v-if="!reduced&&effect?.slot===shown&&['-boost','-unboost'].includes(effect.kind)" :key="effect.id" :effects="statEffect(effect)"/></div>
   <battle-move-effect v-if="fx&&!reduced" :key="fx.id" :fx="fx" :path="fx.path" :color="color(fx.moveType)"/>
   <raid-corruption-effect :event="corruptionFx" :reduced="reduced"/>
   <div v-if="loading" class="raid-entry" role="status"><span class="raid-entry-rift"/><b>La faille s’ouvre…</b><small>Chargement du terrain et des Pokémon</small></div>
   <p v-if="friendship" class="raid-friendship" role="alert">✧ {{ friendship }}<small>L’amitié l’a sauvé à 1 PV. Retire-le pour le protéger : ce sursis ne se reproduira pas.</small></p>
  </div>
  <div class="raid-console">
   <p v-if="frame.warning&&!frame.finished" class="raid-warning" :class="{'is-imminent':!frame.warning.nextTurn}"><span>⚠</span>{{ frame.warning.nextTurn?'Au prochain tour':'Ce tour-ci' }} : {{ frame.warning.move }} frappe tous les alliés.</p>
   <p v-if="frame.wishes?.length" class="raid-warning">✧ Un Vœu soignera le prochain allié qui agit au tour suivant.</p>
   <p class="raid-message" role="status" aria-live="polite">{{ message || (playing?'Résolution du tour…':frame.finished?frame.won?'La corruption recule.':'Le raid est terminé.':canAct?'Choisis une action pour '+current.name:pendingMine?'Tes actions sont enregistrées.':'Tes alliés préparent leurs actions.') }}</p>
   <div class="raid-ally-cards" aria-label="Les quatre alliés"><button v-for="(p,i) in display.allies" :key="p.uuid" :disabled="!targetable(i)" :aria-pressed="slot===i" :class="{'is-selected':slot===i,'is-corrupted':p.corrupted,'is-acting':playing&&shown===i,'is-withdrawn':p.withdrawn||!p.currentHp,'is-targeted':frame.focus===i,'is-valid-target':targeting&&targetable(i),'is-hit':effect?.slot===i&&effect.kind==='-damage'}" @click="chooseCard(i)"><pokemon-portrait :src="sprite(p)" alt=""/><span class="raid-ally-info"><span><b>{{ p.name }}</b><i v-if="frame.focus===i" title="Attention du boss">⌖</i><small>{{ frame.order.indexOf(i)+1 || '—' }}</small></span><span class="raid-card-hp"><i :style="{width:percent(p)+'%'}"/></span><small>{{ p.currentHp }}/{{ p.maxHp }} PV <em v-if="p.status!=='normal'">{{ status(p.status) }}</em><em v-if="p.withdrawn">Retiré</em><em v-else-if="!p.currentHp">{{ p.survivalKitUsed?'K.O. protégé':p.permanentlyLost?'Perdu':'K.O.' }}</em></small><span class="raid-aggro" :aria-label="'Aggro : '+p.aggro+' %'"><i :style="{width:p.aggro+'%'}"/></span><small class="raid-card-owner">{{ p.ownerName }} <b>{{ frame.allies[i].ready?'✓':frame.allies[i].canControl?'· toi':'' }}</b></small></span></button></div>
   <div v-if="!frame.finished" class="raid-controls">
    <div class="raid-decision-heading"><span>{{ playing?'Actions en cours':current?.canControl?current.name+' · à toi':current?.ownerName?'Au tour de '+current.ownerName:'En attente' }}</span><strong v-if="!playing&&needsChoice" :class="{'is-urgent':remaining<=8}" aria-live="off">{{ remaining }} s</strong></div>
    <div v-if="targeting" class="raid-targeting"><p>{{ passing?'Passer la main : sélectionne un allié qui n’a pas encore joué.':'Cible de '+selectedMove.name+' : choisis une carte.' }}</p><button v-if="!passing&&selectedMove.targets.some(t=>t.slot===4)" :disabled="busy" @click="sendMove(1)">Viser {{ frame.boss.name }}</button><button @click="cancelTarget">Annuler</button></div>
    <div v-else-if="canAct" class="raid-moves"><button v-for="m in current.moves" :key="m.index" :style="{'--move-color':color(m.type)}" :disabled="m.disabled||m.pp<=0&&m.id!=='struggle'" @click="move(m)"><b>{{ m.name }}</b><small>{{ type(m.type) }} · {{ m.category==='Physical'?'Physique':m.category==='Special'?'Spéciale':'Statut' }} · {{ m.power||'—' }}</small><span>{{ m.pp }} / {{ m.maxpp }} PP</span></button></div>
    <div v-if="canAct&&!targeting" class="raid-actions"><button :disabled="busy" @click="passing=true">Passer la main ↗</button><button class="raid-retreat" :disabled="busy" @click="retreat=true">Retirer mon Pokémon</button></div>
    <p v-if="error" class="raid-error" role="alert">{{ error }}</p>
   </div>
   <button v-else-if="!playing" class="raid-return" @click="$emit('results')">Voir le bilan du raid →</button>
  </div>
  <div v-if="retreat||help" class="raid-confirm" @keydown.esc.stop="retreat=false;help=false"><section><template v-if="retreat"><h3>Retirer {{ current.name }} ?</h3><p>Il quitte définitivement ce raid et reste dans ta collection avec ses PV actuels. Il ne pourra pas revenir dans le combat.</p><button @click="retreat=false">Rester</button><button class="raid-retreat" :disabled="busy" @click="submit({action:'retreat',confirm:true});retreat=false">Le mettre à l’abri</button></template><template v-else><h3>Quatre alliés, une seule chance</h3><p>La jauge orange attire les attaques ciblées du boss. Par Ici et Poudre Fureur permettent de protéger les autres. Une attaque de zone est annoncée tous les deux tours.</p><p>Brise les boucliers à 70 % et 30 %. Passer la main sacrifie l’action de ton Pokémon pour faire agir un allié plus tôt. Vœu soigne le prochain allié qui agit au tour suivant.</p><p>Un Pokémon à pleine vie peut survivre une fois à 1 PV grâce à l’amitié. Retire-le avant qu’il ne soit trop tard. Les K.O. sont définitifs sans Kit de survie.</p><button @click="help=false">Continuer</button></template></section></div>
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
    canAct() {
      return !this.loading && !this.playing && !this.busy && this.current?.canControl && !this.current.ready && this.current.currentHp > 0 && !this.current.withdrawn;
    },
    needsChoice() {
      return this.frame.allies.some(p => p.canControl && !p.ready && p.currentHp > 0 && !p.withdrawn);
    },
    pendingMine() {
      return this.frame.allies.filter(p => p.canControl && p.currentHp > 0 && !p.withdrawn).every(p => p.ready);
    },
    remaining() {
      return Math.max(0, Math.min(30, Math.ceil((this.frame.deadline - this.clock) / 1000)));
    },
    weather() {
      return {
        raindance: 'rain',
        sunnyday: 'sun',
        sandstorm: 'sandstorm',
        hail: 'hail',
        snowscape: 'snow'
      }[this.frame.weather] || null;
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
      if (this.playing || this.loading) return false;
      if (this.passing) return i !== this.slot && this.frame.allies[i].currentHp > 0 && !this.frame.allies[i].withdrawn;
      if (this.selectedMove) return this.selectedMove.targets.some(t => t.slot === i);
      return this.frame.allies[i].canControl && this.frame.allies[i].currentHp > 0 && !this.frame.allies[i].withdrawn;
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
      this.slot = i;
      this.shown = i;
    },
    move(m) {
      if (!this.canAct) return;
      this.selectedMove = m;
      if (['normal', 'any', 'adjacentAlly', 'adjacentAllyOrSelf', 'adjacentFoe'].includes(m.targetKind)) {
        if (m.targets.length === 1) this.sendMove(m.targets[0].loc);
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
      const i = this.frame.allies.findIndex(p => p.canControl && !p.ready && p.currentHp > 0 && !p.withdrawn);
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
    async finishMoveFx() {
      if (!this.reduced && this.fx?.visibilityScale > 1 && this._impactAt) await this.sleep(Math.max(0, this.fx.impactMs - (performance.now() - this._impactAt)));
      this._impactAt = 0;
    },
    async animate(e, events, index) {
      await this.finishMoveFx(); if (this._closed) return;
      this.fx = null;
      if (e.slot < 4) this.shown = e.slot;else if (e.target < 4) this.shown = e.target;
      await this.$nextTick();
      const v = moveVisual(e),
        start = this.point(e.slot),
        slot = e.target ?? (e.slot === 4 ? this.shown : 4),
        end = this.point(slot);
      const outcomes = [];
      for (let j = index + 1; j < events.length && events[j].kind !== 'move'; j++) outcomes.push(events[j]);
      const failed = outcomes.some(q => ['-miss', '-immune', '-fail'].includes(q.kind)),
        fx = {
          ...v,
          id: Math.random(),
          stage: 'windup',
          result: {
            success: !failed,
            hits: 1
          },
          path: {
            startX: start.x,
            startY: start.y,
            targetX: end.x,
            targetY: end.y,
            groundY: end.groundY,
            targets: [{
              ...end,
              connected: !failed,
              critical: outcomes.some(q => q.kind === '-crit'),
              hits: 1
            }]
          }
        };
      this.fx = fx;
      await this.sleep(this.reduced ? 20 : v.windupMs);
      this.fx = {
        ...fx,
        stage: 'travel'
      };
      await this.sleep(this.reduced ? 20 : v.travelMs);
      this.fx = {
        ...fx,
        stage: e.damageClass === 'status' ? 'aura' : 'await'
      };
      if (e.damageClass === 'status') await this.sleep(this.reduced ? 20 : 160);
    },
    async play() {
      if (this.playing || this._closed) return;
      this.playing = true;
      try {
        while (this._frames.length && !this._closed) {
          const frame = this._frames.shift();
          if (!this.display) {
            this.display = JSON.parse(JSON.stringify(frame));
            this._eventToken = frame.token;
            await this.sleep(0);
            await Promise.race([Promise.all([background, mobileBackground, ...[frame.boss, ...frame.allies].flatMap(p => [this.sprite(p), this.sprite(p, true)])].map(src => new Promise(done => {
              const i = new Image();
              i.onload = i.onerror = done;
              i.src = src;
            }))), this.sleep(5000)]);
            await this.sleep(this.reduced ? 0 : 900);
            this.loading = false;
            this.phaseEffect = 'boss-arrives';
            this.$emit('sound', 'raidEnter');
            await this.$nextTick();
            this.corruptionFx = {
              id: Math.random(),
              kind: 'entry',
              point: this.point(4)
            };
            await this.sleep(this.reduced ? 0 : 850);
            this.phaseEffect = '';
          }
          const events = frame.token !== this._eventToken ? frame.events || [] : [];
          this._eventToken = frame.token;
          for (let i = 0; i < events.length && !this._closed; i++) {
            const e = events[i];
            this.effect = {
              ...e,
              id: Math.random()
            };
            this.amount = 0;
            if (e.kind === 'move') {
              this.message = e.message;
              await this.animate(e, events, i);
              continue;
            }
            const p = e.slot === 4 ? this.display.boss : this.display.allies[e.slot];
            if (['-damage', '-heal'].includes(e.kind) && p) {
              if (e.slot < 4) this.shown = e.slot;
              this.amount = Math.abs(p.currentHp - e.hp);
              if (e.kind === '-damage' && this.fx) { this._impactAt = performance.now(); this.fx = {
                ...this.fx,
                stage: 'impact',
                pulse: (this.fx.pulse || 0) + 1
              };
              }
              if (e.kind === '-heal' && this.fx?.family === 'drain') this.fx = {
                ...this.fx,
                stage: 'drain'
              };
              this.$set(p, 'currentHp', e.hp);
              if (e.maxHp) this.$set(p, 'maxHp', e.maxHp);
              if (e.kind === '-damage') this.$emit('impact', {
                damage: this.amount,
                maxHp: p.maxHp
              });
              await this.sleep(this.reduced ? 25 : 270);
            } else if (e.kind === 'shield') {
              this.$set(this.display, 'shield', {
                hp: 1,
                max: 1
              });
              this.phaseEffect = 'shield-appears';
              this.corruptionFx = {
                id: Math.random(),
                kind: 'shield',
                point: this.point(4)
              };
              this.message = 'Un bouclier de corruption se forme !';
              this.$emit('sound', 'raidShield');
              await this.sleep(this.reduced ? 30 : 550);
            } else if (e.kind === 'shieldHit') {
              this.phaseEffect = 'shield-hit';
              this.$emit('sound', 'raidHit');
              await this.sleep(this.reduced ? 20 : 120);
            } else if (e.kind === 'shieldBreak') {
              this.$set(this.display, 'shield', null);
              this.phaseEffect = 'shield-break';
              this.corruptionFx = {
                id: Math.random(),
                kind: 'shieldBreak',
                point: this.point(4)
              };
              this.message = 'Le bouclier se brise. Deux tours de répit !';
              this.$emit('sound', 'raidBreak');
              await this.sleep(this.reduced ? 30 : 650);
            } else if (e.kind === 'friendship') {
              this.friendship = p.name + ' est en danger !';
              this.shown = e.slot;
              this.corruptionFx = {
                id: Math.random(),
                kind: 'friendship',
                point: this.point(e.slot)
              };
              this.$emit('sound', 'raidSaved');
              await this.sleep(this.reduced ? 50 : 1500);
              this.friendship = '';
            } else if (e.kind === 'retreat' && p) {
              this.$set(p, 'withdrawn', true);
              this.message = p.name + (e.reason === 'timeout' ? ' est retiré en sécurité : le délai est écoulé.' : ' est mis à l’abri.');
              await this.sleep(this.reduced ? 30 : 350);
            } else if (e.kind === 'passFailed') {
              this.message = 'Le relais échoue : cet allié a déjà joué. L’action est perdue.';
              await this.sleep(this.reduced ? 30 : 650);
            } else if (e.kind === 'pass') {
              this.shown = e.target;
              this.message = (p?.name || 'Un allié') + ' passe la main à ' + this.display.allies[e.target]?.name + '.';
              await this.sleep(this.reduced ? 30 : 350);
            } else if (e.kind === '-crit') {
              await this.sleep(this.reduced ? 30 : 350);
            } else if (['-boost', '-unboost'].includes(e.kind)) {
              if (e.slot < 4) this.shown = e.slot;
              await this.sleep(this.reduced ? 30 : 650);
            } else if (e.kind === 'faint') {
              if (e.slot < 4) {
                this.shown = e.slot;
                const q = frame.allies[e.slot];
                this.message = q.survivalKitUsed ? q.name + ' reste K.O. : son Kit de survie a été consommé.' : q.name + ' est définitivement perdu.';
              }
              await this.sleep(this.reduced ? 30 : 450);
            }
            this.phaseEffect = '';
          }
          await this.finishMoveFx();
          this.display = JSON.parse(JSON.stringify(frame));
          this.fx = null;
          this.effect = null;
          this.amount = 0;
          this.message = '';
          this.phaseEffect = '';
        }
      } finally {
        this.playing = false;
        this.autoSlot();
      }
    }
  }
};
</script>
<style scoped>
.raid-battle{position:fixed;inset:0;z-index:2100;max-width:1180px;margin:auto;display:flex;flex-direction:column;background:var(--journal-paper);color:var(--journal-ink);font:13px/1.4 var(--journal-font);overflow:hidden;box-shadow:0 0 100px #0009}.raid-battle *{box-sizing:border-box}.raid-reduced *{animation:none!important;transition:none!important}.raid-ally-cards>button.is-corrupted{background:#9471b12b;border-color:#a385bb}header{display:flex;align-items:center;gap:10px;padding:9px 18px;flex:none;background:var(--journal-soft);border-bottom:2px solid #9674ae}header>div{flex:1}header small{font-size:9px;letter-spacing:.1em;color:var(--journal-muted)}header b{display:block;font-size:16px}header span{font-size:11px;font-weight:400;margin-left:12px}button{font:inherit;color:inherit;min-height:42px;min-width:42px;border:1px solid var(--journal-border);background:var(--journal-card);border-radius:8px;padding:8px 12px;cursor:pointer}button:disabled{cursor:default;opacity:.5}button:focus-visible{outline:2px solid #b18bd1;outline-offset:2px}.raid-stage{position:relative;flex:1;min-height:180px;background-image:linear-gradient(#27103c36,#0e122a33),var(--raid-bg);background-size:cover;background-position:center;overflow:hidden;isolation:isolate}.raid-boss-hud{position:absolute;top:16px;left:18px;width:42%;max-width:400px;background:#281c3be8;color:#f2e9ff;border:2px solid #a082b9;border-radius:9px 23px 9px 23px;padding:12px 16px;z-index:30;box-shadow:0 4px 0 #130d24a0}.raid-boss-hud>span{display:flex;gap:8px;align-items:baseline;justify-content:space-between}.raid-boss-hud b{font-size:17px}.raid-boss-hud small{font-size:10px;color:#d5c6e8;display:block}.raid-boss-health{height:15px;background:#120e24;border:1px solid #ac93b8;border-radius:8px;margin:10px 0 5px;position:relative;overflow:hidden}.raid-boss-health>i{height:100%;display:block;background:linear-gradient(90deg,#9570c1,#cc9fea);transition:width .25s}.raid-boss-health>em{position:absolute;top:0;bottom:0;width:2px;background:#fff8}.raid-shield-bar{position:relative;height:17px;margin-top:6px;border-radius:4px;background:#211432;overflow:hidden}.raid-shield-bar i{display:block;height:100%;background:#8d6ac2}.raid-shield-bar span{position:absolute;inset:0;font:9px/17px var(--journal-font);text-align:center;color:white;letter-spacing:.05em}.raid-weather{position:absolute;top:10px;right:12px;z-index:35}.raid-boss,.raid-ally{position:absolute;display:flex;align-items:flex-end;justify-content:center;pointer-events:none}.raid-boss{right:5%;bottom:31%;width:38%;height:52%;z-index:5}.raid-boss>.pokemon-portrait{height:auto;aspect-ratio:1;width:100%;transform:scale(1.4) translateY(11%);transform-origin:50% 100%;object-fit:contain;object-position:center bottom;image-rendering:pixelated;filter:drop-shadow(0 0 12px #9853c855);position:relative;z-index:2}.raid-boss:before{content:"";position:absolute;bottom:0;left:-4%;right:-4%;height:13%;border-radius:50%;border:2px solid #817b75;background:radial-gradient(ellipse,#9b9e88,#6c7162);box-shadow:0 4px 0 #3c414266;z-index:1}.raid-boss-aura{position:absolute;inset:-8%;background:radial-gradient(ellipse,#9853bf00 35%,#8e51b83d 58%,#6f429400 73%);animation:raid-breathe 3s ease-in-out infinite;transform-origin:50% 70%}.is-shielded:after{content:'';position:absolute;inset:0 3%;border:2px solid #c89eeda8;border-radius:48% 53% 40% 48%;box-shadow:inset 0 0 30px #a169d055,0 0 20px #b781d744;background:linear-gradient(35deg,transparent 38%,#c999ed33 39%,transparent 40%);z-index:3}.raid-ally{left:-5%;bottom:-3px;width:47%;height:62%;z-index:6}.raid-ally>.pokemon-portrait{width:100%;height:auto;aspect-ratio:1;translate:0 11%;object-fit:contain;object-position:center bottom;image-rendering:pixelated}.raid-ally.fainted,.raid-boss.fainted{opacity:.2;translate:0 12px;transition:opacity .4s,translate .4s}.raid-ally.retired{opacity:0;scale:.4;transition:opacity .3s,scale .3s}.raid-damage{position:absolute;top:9%;left:50%;transform:translateX(-50%);z-index:70;font:bold 32px var(--journal-font);color:#fff4db;text-shadow:2px 2px 0 #221424,-2px -1px 0 #221424;animation:raid-number .4s ease-out}.raid-damage.is-heal{color:#b7efc8}.raid-critical{position:absolute;top:0;z-index:72;font-weight:900;color:#ffe9a5;text-shadow:2px 2px #833c56;font-size:21px;animation:raid-number .4s ease-out}.raid-entry{position:absolute;inset:0;z-index:100;background:radial-gradient(ellipse,#38234d,#0c1024 75%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#efdef9}.raid-entry b{font:25px Georgia,serif}.raid-entry small{color:#b6a2c8;font-size:11px}.raid-entry-rift{height:80px;width:35px;border-radius:50%;background:#090b15;box-shadow:0 0 15px #bd8ae9,0 0 70px #a564d5,0 0 0 7px #6b4c9333;animation:raid-breathe 1.7s infinite}.raid-friendship{position:absolute;left:10px;right:10px;bottom:12px;background:#f5eaceed;color:#4c4050;border:1px solid #bd9c69;border-radius:9px;padding:10px 14px;z-index:90;font-weight:700;max-width:580px;margin:auto}.raid-friendship small{display:block;font-weight:400;font-size:11px}.raid-console{flex:none;padding:10px 16px 12px;border-top:2px solid #9876b0;background:var(--journal-soft)}.raid-warning{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--journal-muted);margin:0 0 5px}.raid-warning.is-imminent{color:#ae6b55;font-weight:600}.raid-message{min-height:19px;margin:4px 0 8px;font-size:12px;overflow-wrap:anywhere}.raid-ally-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.raid-ally-cards>button{padding:7px;display:flex;align-items:center;gap:6px;text-align:left;min-width:0;opacity:1}.raid-ally-cards>button:disabled{opacity:.78}.raid-ally-cards>button.is-selected{border-color:#ac85c7;background:color-mix(in srgb,#a47cc5 15%,var(--journal-paper))}.raid-ally-cards>button.is-acting{box-shadow:inset 0 0 0 1px #c29cd9,0 0 10px #956eb444}.raid-ally-cards>button.is-valid-target{border-color:#6ca08c;box-shadow:0 0 0 1px #91c6a088}.raid-ally-cards>button.is-withdrawn{opacity:.4}.raid-ally-cards .pokemon-portrait{width:44px;height:48px;object-fit:contain;image-rendering:pixelated;flex:none}.raid-ally-info{flex:1;min-width:0}.raid-ally-info>span:first-child{display:flex;align-items:center;gap:4px}.raid-ally-info b{font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.raid-ally-info small{font-size:9px;display:block}.raid-ally-info em{font-style:normal;color:#ab7755}.raid-ally-info>span:first-child>small{margin-left:auto;color:var(--journal-muted)}.raid-ally-info>span:first-child>i{color:#dc914c;font-style:normal;font-size:17px;line-height:12px}.raid-card-hp,.raid-aggro{display:block;height:5px;border-radius:3px;background:var(--journal-border);overflow:hidden;margin:4px 0}.raid-card-hp i{display:block;height:100%;background:#78ae90;transition:width .25s}.raid-aggro{height:3px;margin:4px 0 3px}.raid-aggro i{display:block;background:#d29a53;height:100%;transition:width .3s}.raid-card-owner{color:var(--journal-muted)}.raid-card-owner b{font-size:9px;color:var(--journal-accent)}.raid-controls{margin-top:8px}.raid-decision-heading{display:flex;align-items:center;justify-content:space-between;min-height:23px;font-size:11px;color:var(--journal-muted);margin-bottom:6px}.raid-decision-heading strong{font-variant-numeric:tabular-nums;color:var(--journal-heading);font-size:14px}.is-urgent{color:#c96e65!important}.raid-moves{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.raid-moves>button{text-align:left;border-color:var(--move-color);border-left-width:4px;background:color-mix(in srgb,var(--move-color) 20%,var(--journal-paper));padding:8px 10px;min-width:0}.raid-moves b,.raid-moves small,.raid-moves>button>span{display:block;overflow-wrap:anywhere}.raid-moves b{font-size:12px}.raid-moves small,.raid-moves>button>span{font-size:9px}.raid-moves>button>span{color:var(--journal-muted);margin-top:3px}.raid-actions{display:flex;gap:8px;margin-top:8px;justify-content:flex-end}.raid-actions button{font-size:11px;min-height:35px;padding:7px 12px}.raid-retreat{color:#9c5b66;border-color:#b88c95}.raid-targeting{padding:10px;background:var(--journal-paper);border-radius:8px}.raid-targeting p{margin:0 0 7px}.raid-targeting button{margin-right:8px}.raid-error{color:var(--journal-danger);margin:7px 0 0;font-size:12px}.raid-return{display:block;margin:12px auto 0;background:#806093;color:white}.raid-confirm{position:absolute;inset:0;z-index:220;display:grid;place-items:center;background:#0a0f25b8;padding:16px}.raid-confirm section{max-width:500px;max-height:80dvh;overflow:auto;padding:23px;border:2px solid #9c7eb2;border-radius:12px;background:var(--journal-paper)}.raid-confirm h3{font:25px Georgia,serif;color:var(--journal-heading);margin:0}.raid-confirm button{margin:6px 6px 0 0}.takes-hit>.pokemon-portrait{animation:raid-hit .25s}.is-hit{background:#b2768533!important}.shield-break .raid-boss:after{content:"";position:absolute;inset:0;border:2px solid #dab8f4;border-radius:40%;background:linear-gradient(35deg,transparent 45%,#c79cea88 48%,transparent 50%);animation:raid-shatter .6s ease-out}.shield-appears .raid-boss{filter:brightness(1.6)}.shield-hit .raid-boss:after{filter:brightness(2)}.boss-arrives .raid-boss>.pokemon-portrait{animation:raid-arrival .85s ease-out}@keyframes raid-arrival{from{opacity:0;filter:brightness(3) drop-shadow(0 0 25px #b888ef);scale:.65}65%{opacity:1;filter:brightness(1.7);scale:1.05}to{opacity:1;scale:1}}@keyframes raid-breathe{50%{scale:1.07;opacity:.8}}@keyframes raid-number{from{translate:0 12px;opacity:0}to{translate:0;opacity:1}}@keyframes raid-hit{30%{translate:-5px;filter:brightness(1.7)}70%{translate:4px}}@keyframes raid-shatter{to{scale:1.4;opacity:0;clip-path:polygon(0 0,40% 20%,15% 100%,75% 65%,100% 100%,90% 0,0 0)}}@media(max-width:640px){header{padding:7px 11px}header b{font-size:14px}.raid-stage{background-image:linear-gradient(#27103c36,#0e122a33),var(--raid-mobile-bg);background-position:center;min-height:155px}.raid-boss-hud{left:10px;top:10px;width:57%;padding:9px 12px}.raid-boss-hud b{font-size:14px}.raid-boss-hud>span{display:block}.raid-boss-hud small{font-size:9px}.raid-boss-health{height:12px;margin:6px 0 4px}.raid-boss{width:44%;height:52%;bottom:23%;right:1%}.raid-ally{width:55%;height:56%;left:-8%}.raid-console{padding:8px 10px}.raid-ally-cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.raid-ally-cards>button{padding:4px 6px}.raid-ally-cards .pokemon-portrait{width:35px;height:38px}.raid-ally-info b{font-size:10px}.raid-ally-info small{font-size:8px}.raid-card-hp{margin:3px 0;height:4px}.raid-aggro{margin:3px 0 2px}.raid-card-owner{line-height:10px}.raid-moves{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.raid-moves>button{padding:6px 9px;min-height:54px}.raid-moves b{font-size:11px}.raid-moves>button>span{display:inline;font-size:8px}.raid-moves small{display:inline;font-size:8px;margin-right:6px}.raid-message{font-size:11px;margin:3px 0 5px;min-height:16px}.raid-warning{font-size:9px}.raid-controls{margin-top:5px}.raid-decision-heading{min-height:18px;margin-bottom:4px}.raid-actions{margin-top:5px}.raid-actions button{min-height:34px;font-size:10px}.raid-friendship{font-size:11px;padding:8px}.raid-friendship small{font-size:9px}.raid-damage{font-size:27px}}
@media(max-height:650px) and (min-width:641px){.raid-ally-cards .pokemon-portrait{height:30px;width:30px}.raid-console{padding:6px 14px}.raid-stage{min-height:140px}.raid-moves>button{padding:5px 10px;min-height:42px}.raid-actions button{min-height:30px}.raid-ally-info small{font-size:8px}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>

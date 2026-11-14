<template>
 <div class="club-spectator" @keydown.esc.stop.prevent="$emit('close')" @keydown.stop @keyup.stop role="dialog" aria-modal="true" aria-label="Tribunes de la maison des combats" data-club-spectator>
  <doubles-battle @cue="$refs.battle && $refs.battle.playCombatCue($event)" @impact="$refs.battle && $refs.battle.playImpact($event)" @audio-stop="$refs.battle && $refs.battle.stopCombatAudio()" v-if="doubleFrame" :frame="doubleFrame" spectator settled :reduced="!preferences.animationsEnabled" @close="$emit('close')"/>
  <battle-overlay v-show="!doubleFrame" ref="battle" :active="!doubleFrame" :external-music-active="!!doubleFrame" read-only :mobile="mobile" map-name="ville5_maison1" :preferences="preferences"/>
  <div v-if="!doubleFrame" class="spectator-ribbon"><span><i :class="{live:!result}"/>{{ result?'Duel terminé':'Spectateur · En direct' }}<small>{{ start.names.join(' contre ') }}</small></span><button ref="close" data-close-club-watch @click="$emit('close')">{{ result?'Retour dans la salle':'Quitter les tribunes' }} ×</button></div>
  <div v-if="result && !doubleFrame" class="spectator-result" role="status">{{ result.refunded?'Le duel est terminé. Les mises ont été rendues.':'Le résultat du duel a été enregistré.' }}</div>
 </div>
</template>
<script>
import BattleOverlay from '../battle/BattleOverlay.vue';
import DoublesBattle from './DoublesBattle.vue';
const methods={introAnimation:'updateBattleState',battleText:'showMessage',battleMoveAnimation:'playMoveAnimation',battleMoveResult:'playMoveResult',battleFieldState:'updateFieldState',battleDriftEffects:'playDriftEffects'};
export default{
 components:{BattleOverlay,DoublesBattle},props:{start:Object,events:Array,result:Object,mobile:Boolean,preferences:Object},data(){return{sequence:0,doubleFrame:this.start.doubles||null};},
 mounted(){this.previousFocus=document.activeElement;this.sequence=this.start.seq||0;this.$refs.close?.focus();const b=this.$refs.battle;if(!b){this.flush();return;}b.resetBattleUi();if(this.doubleFrame){b.startMusic('pvp');this.flush();return;}b.prepareEntrance('pvp');b.startMusic('pvp');if(this.start.field)b.updateFieldState(this.start.field);if(this.start.intro)b.presentEvent('updateBattleState',this.start.intro);this.flush();},
 beforeDestroy(){if(this.previousFocus?.isConnected)this.previousFocus.focus({preventScroll:true});},watch:{events(){this.flush();}},
 methods:{flush(){for(const packet of this.events||[]){if(packet.id!==this.start.id||packet.seq<=this.sequence)continue;this.sequence=packet.seq;if(packet.event==='whitepeak:doubleFrame'){this.doubleFrame={...packet.payload,events:packet.payload.events||[]};continue;}const method=methods[packet.event];if(method)this.$refs.battle.presentEvent(method,packet.event==='battleText'?packet.payload.message:packet.payload);}}}
};
</script>
<style scoped>
.club-spectator{position:fixed;inset:0;z-index:3200;background:var(--journal-paper);color:var(--journal-ink)}.spectator-ribbon{position:fixed;top:8px;left:50%;transform:translateX(-50%);width:min(680px,calc(100% - 16px));z-index:3300;display:flex;justify-content:space-between;align-items:center;gap:12px;box-sizing:border-box;padding:8px 12px;background:var(--journal-card);border:1px solid var(--journal-border);border-radius:10px;box-shadow:0 3px 15px #06172833;font:12px/1.4 var(--journal-font)}.spectator-ribbon small{display:block;color:var(--journal-muted);font-size:10px}.spectator-ribbon i{display:inline-block;width:7px;height:7px;background:#83969d;border-radius:50%;margin-right:6px}.spectator-ribbon i.live{background:#5f9c7c;box-shadow:0 0 0 3px #5f9c7c22}.spectator-ribbon button{font:inherit;min-height:44px;border:1px solid var(--journal-border);border-radius:7px;background:var(--journal-soft);color:var(--journal-ink);padding:6px 10px;cursor:pointer}.spectator-result{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:3300;box-sizing:border-box;width:min(600px,calc(100% - 24px));padding:16px;border:1px solid var(--journal-border);border-radius:10px;background:var(--journal-card);font:14px/1.5 var(--journal-font)}
</style>

<style>
.club-spectator .battle{position:absolute!important;top:76px!important;height:calc(100dvh - 76px)!important;min-height:0!important}
@media(max-height:480px){.club-spectator .battle{top:64px!important;height:calc(100dvh - 64px)!important}.club-spectator .spectator-ribbon{padding-block:4px}}
</style>

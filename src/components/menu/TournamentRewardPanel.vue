<template>
  <div class="reward-backdrop" @keydown.stop="onKey" @keyup.stop>
    <section ref="dialog" class="tournament-reward-panel" :class="{'has-four':offer.choices.length===4}" role="dialog" aria-modal="true" aria-labelledby="tournament-reward-title" :aria-busy="busy" tabindex="-1">
      <header><div><small>SUPER TOURNOI · SALLE {{ offer.afterRoom }} REMPORTÉE</small><h2 id="tournament-reward-title">À toi de choisir</h2><p>Un soin, un pouvoir ou un coup de chance.</p></div><button class="reward-exit" aria-label="Quitter le parcours" :disabled="busy" @click="$emit('leave')">×</button></header>
      <div class="reward-reroll-bar"><div><strong>{{ rerolls.remaining || 0 }} relance{{ rerolls.remaining===1?'':'s' }} disponible{{ rerolls.remaining===1?'':'s' }}</strong><small>+2 par cycle de 16 salles · passer une récompense donne +1</small></div><button data-reward-reroll :disabled="busy || !rerolls.remaining" @click="$emit('reroll',{offerId:offer.id})"><span aria-hidden="true">↻</span> Relancer les cartes</button></div>
      <div class="reward-content">
        <details v-if="passives.length" class="reward-powers"><summary>✦ Augmentations actives · {{ passives.length }}</summary><tournament-power-list :passives="passives"/></details>
        <p v-if="victoryRecovery.length" class="reward-victory-heal">Après la victoire : {{ victoryRecovery.reduce((n,c)=>n+c.amount,0) }} PV et {{ victoryRecovery.reduce((n,c)=>n+(c.moves || []).reduce((p,m)=>p+m.amount,0),0) }} PP rendus à l’équipe.</p>
        <div v-if="cash?.last?.room===offer.afterRoom" class="reward-cash" data-tournament-cash role="status">
          <span>Salle {{ cash.last.room }}<strong>+{{ money(cash.last.amount) }} ₽</strong><small v-if="cash.last.bonus&&!cash.last.limited">Bonus de cycle inclus : {{ money(cash.last.bonus) }} ₽</small><small v-if="cash.last.limited">Plafond du porte-monnaie atteint</small></span>
          <span>Total du parcours<b>{{ money(cash.earned) }} ₽</b><small>Déjà versés · gains conservés</small></span>
        </div>
        <div :key="offer.id" class="reward-cards" role="group" aria-label="Choisir une récompense">
          <button v-for="card in offer.choices" :key="card.key" class="reward-card" :data-reward-card="card.key" :data-rarity="card.rarity" :aria-pressed="selectedKey===card.key" :disabled="busy || !card.usable" @click="select(card)">
            <span v-if="selectedKey===card.key" class="reward-check" aria-hidden="true">✓</span>
            <span class="reward-rarity">{{ card.rarityName }}</span>
            <span class="reward-emblem" aria-hidden="true">
            <bag-item-icon v-if="card.kind==='item'" :item-key="card.itemKey" pocket="training"/>
            <svg v-else viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <template v-if="card.kind==='pact'"><path d="M24 6v35M9 42h30M8 15h32M13 15 5 29h16Zm22 0-8 14h16Z"/><path d="M5 29a8 7 0 0 0 16 0m6 0a8 7 0 0 0 16 0" fill="var(--reward-tint)"/><circle cx="24" cy="10" r="4" fill="var(--reward-tint)"/></template>
              <template v-else-if="card.kind==='opponent'"><circle cx="24" cy="24" r="17" fill="var(--reward-tint)"/><path d="M7 24h34"/><circle cx="24" cy="24" r="5" fill="var(--reward-bg)"/><path d="m35 6 8 8m-8 0 8-8"/></template>
              <template v-else-if="card.kind==='fortune'"><path d="M24 23C5 25 4 7 15 8c8-1 9 8 9 15Zm0 0C22 4 41 3 40 14c0 8-9 10-16 9Zm0 0c19-1 20 17 9 17-8 1-10-8-9-17Zm0 0C7 21 3 40 14 40c8 1 10-8 10-17Z" fill="var(--reward-tint)"/><path d="M24 24v21"/></template><template v-else-if="card.kind==='passive'"><path d="m24 4 15 7v12c0 11-15 20-15 20S9 34 9 23V11Z" fill="var(--reward-tint)"/><path d="m24 12 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z"/></template>
              <template v-else-if="card.kind==='money'"><path d="m16 6 3 9h10l4-9-9 3Z" fill="var(--reward-tint)"/><path d="M19 15C9 22 5 40 15 42h18c10-2 6-20-4-27Z" fill="var(--reward-tint)"/><path d="M17 15h14m-7 8v13m-4-11h7a3 3 0 0 1 0 6h-7m0 3h8"/></template>
              <template v-else-if="card.kind==='pp'"><path d="m27 5-17 23h13l-2 15 17-25H25Z" fill="var(--reward-tint)"/><path d="M7 9h5m-3-3v6m26 23h6m-3-3v6"/></template>
              <template v-else-if="card.kind==='revive' || card.kind==='reset'"><path d="m24 5 14 16-14 22L10 21Z" fill="var(--reward-tint)"/><path d="m10 21 14 5 14-5M24 5v21m0 0v17m-7-13 7-4 7 4"/><path v-if="card.kind==='reset'" d="M6 7h7m-3-3v7m26 28h8m-4-4v8"/></template>
              <template v-else-if="card.kind==='cure'"><path d="M9 33C7 14 18 5 38 7c2 22-12 32-29 26Zm0 0 21-18m-8 8 10 1m-10-1-1-9" fill="var(--reward-tint)"/></template>
              <template v-else><path d="M24 40 8 24C-3 11 16 1 24 14c8-13 27-3 16 10Z" fill="var(--reward-tint)"/><path d="M24 20v12m-6-6h12"/></template>
            </svg>
            </span>
            <strong>{{ card.name }}</strong><small v-if="card.stackable" class="reward-stack" data-card-stacks>{{ card.stacks?`Cumul ${card.stacks} → ${card.nextStacks}`:'Bonus cumulable' }}</small><span v-if="card.boon" class="reward-description reward-pact-effects"><span data-reward-boon><b>Bonus</b> {{ card.boon }}</span><span data-reward-cost><b>Malus</b> {{ card.cost }}</span></span><span v-else class="reward-description">{{ card.description }}</span><small v-if="card.duration" class="reward-duration">{{ card.duration }}</small><span class="reward-selected">{{ selectedKey===card.key?'✓ Carte choisie':'Choisir cette carte' }}</span>
          </button>
        </div>
        <p v-if="offer.canSkip" class="reward-hint" role="status">Ton équipe est déjà au mieux : aucun soin n’est nécessaire.</p>
        <section v-if="selected?.target==='run' || selected?.target==='nextBattle'" class="reward-targets reward-account" data-reward-passive aria-live="polite"><h3>{{ selected.kind==='opponent'?'Prochain adversaire uniquement':selected.kind==='fortune'?'Chance · toute la tentative':'Pour toute l’équipe · toute la tentative' }}</h3><p>{{ selected.description }}</p><p v-if="selected.cumulativeDescription" class="reward-stack-preview" data-stack-preview><b>Après ce choix :</b> {{ selected.cumulativeDescription }}</p><small>{{ selected.kind==='opponent'?'Les Pokémon absents ne rapportent pas de points. L’équipe suivante sera de nouveau complète.':selected.kind==='fortune'?'Les tirages suivants et les relances sont améliorés. Ne modifie pas les cartes déjà affichées.':selected.stackable?'Chaque prise ajoute un cumul. Bonus et malus se cumulent et restent actifs entre les salles et après reconnexion.':'Cette règle reste active pour la tentative.' }}</small></section>
        <section v-else-if="selected?.target==='account'" class="reward-targets reward-account" data-reward-account aria-live="polite">
          <h3>{{ selected.kind==='money'?'Pour ton porte-monnaie':'Pour ton sac d’Aventure' }}</h3>
          <p v-if="selected.kind==='money'"><strong>+{{ money(selected.grant.amount) }} ₽</strong> versés dès confirmation, en plus de la prime de salle.</p>
          <p v-else><strong>1 {{ selected.name }}</strong> ajouté au sac. Tu pourras l’utiliser après ta tentative.</p>
          <small>Cette carte remplace le soin de cette salle. La récompense reste acquise, même en cas de défaite.</small>
        </section>
        <section v-else-if="selected" class="reward-targets" aria-label="Cible et aperçu du soin">
          <h3>{{ selected.target==='team'?'Pour toute l’équipe':'Pour quel Pokémon ?' }}</h3>
          <div class="reward-team">
            <button v-for="p in team" :key="p.uuid" :data-reward-target="p.uuid" :aria-pressed="selected.target!=='team' && pokemonUuid===p.uuid" :disabled="busy || selected.target==='team' || !target(p.uuid)" @click="pokemonUuid=p.uuid;moveIndex=null">
              <pokemon-portrait :src="sprite(p)"/><span><b>{{ p.name || p.truename }}</b><small>{{ p.currentHp<=0?'K.O.':`${p.currentHp} / ${p.maxHp} PV` }}</small><small v-if="selected.target==='team' && target(p.uuid)">✓ Bénéficie du soin</small></span>
            </button>
          </div>
          <label v-if="selected.target==='move' && chosenTarget" class="reward-move">Capacité à restaurer<select v-model.number="moveIndex" data-reward-move :disabled="busy"><option :value="null" disabled>Choisir une capacité…</option><option v-for="move in chosenTarget.moves" :key="move.index" :value="move.index">{{ moveName(move.name) }} · {{ move.before }} → {{ move.after }} / {{ move.max }} PP</option></select></label>
          <div class="reward-preview" aria-live="polite">
            <p v-for="change in previewTargets" :key="change.uuid"><b>{{ change.name }}</b><span v-if="change.hpAfter!==change.hpBefore">PV : {{ change.hpBefore }} → <strong>{{ change.hpAfter }}</strong> / {{ change.maxHp }}</span><span v-if="change.statusAfter!==change.statusBefore">Statut soigné</span><span v-for="move in previewMoves(change)" :key="move.index">{{ moveName(move.name) }} : {{ move.before }} → <strong>{{ move.after }}</strong> / {{ move.max }} PP</span></p>
            <p v-if="!previewTargets.length" class="reward-hint">Sélectionne un Pokémon pour voir le résultat.</p>
          </div>
        </section>
        <p v-if="error" class="reward-error" role="alert">{{ error }}</p>
      </div>
      <footer><span>Un choix parmi {{ offer.choices.length }} · aucun gain d’XP</span><button v-if="offer.canSkip || offer.canDecline" data-reward-skip class="reward-decline" :disabled="busy" @click="$emit('choose',{offerId:offer.id,skip:true})">Passer · +1 relance</button><button v-if="!offer.canSkip" class="reward-confirm" data-reward-confirm :disabled="busy || !canConfirm" @click="confirm">{{ busy?'Confirmation…':selected?.kind==='pact'?'Accepter le pacte':['run','nextBattle'].includes(selected?.target)?'Activer la carte':selected?.target==='account'?'Récupérer la récompense':'Appliquer le soin' }}</button></footer>
    </section>
  </div>
</template>
<script>
import PokemonPortrait from '../PokemonPortrait.vue';
import BagItemIcon from './BagItemIcon.vue';
import TournamentPowerList from './TournamentPowerList.vue';
import {localizeMoveName} from '@/services/i18n';
export default {
  components:{PokemonPortrait,BagItemIcon,TournamentPowerList},props:{offer:{type:Object,required:true},rerolls:{type:Object,default:()=>({remaining:0})},cash:{type:Object,default:null},team:{type:Array,default:()=>[]},passives:{type:Array,default:()=>[]},victoryRecovery:{type:Array,default:()=>[]},busy:Boolean,error:String},
  data(){return {selectedKey:null,pokemonUuid:null,moveIndex:null,previousFocus:null};},
  computed:{
    selected(){return this.offer.choices.find(c=>c.key===this.selectedKey);},
    chosenTarget(){return this.selected?.targets.find(t=>t.uuid===this.pokemonUuid);},
    canConfirm(){return this.selected?.usable && (['run','nextBattle','account','team'].includes(this.selected.target) || !!this.chosenTarget && (this.selected.target!=='move'||this.chosenTarget.moves.some(m=>m.index===this.moveIndex)));},
    previewTargets(){return this.selected?.target==='team'?this.selected.targets:this.chosenTarget?[this.chosenTarget]:[];}
  },
  watch:{'offer.id'(){this.selectedKey=null;this.pokemonUuid=null;this.moveIndex=null;}},
  mounted(){this.previousFocus=document.activeElement;this.$refs.dialog.focus({preventScroll:true});},
  beforeDestroy(){if(this.previousFocus?.isConnected)this.previousFocus.focus({preventScroll:true});},
  methods:{
    money(n){return Number(n||0).toLocaleString('fr-FR');},
    sprite(p){return this.$pokemonSprite(p);},
    select(card){this.selectedKey=card.key;this.pokemonUuid=null;this.moveIndex=null;},
    target(uuid){return this.selected?.targets.find(t=>t.uuid===uuid);},
    moveName(name){return localizeMoveName(name,'fr');},
    previewMoves(change){return this.selected?.target==='move'?change.moves.filter(m=>m.index===this.moveIndex):change.moves;},
    confirm(){if(this.canConfirm)this.$emit('choose',{offerId:this.offer.id,cardKey:this.selectedKey,pokemonUuid:this.pokemonUuid,moveIndex:this.moveIndex});},
    onKey(e){if(e.key==='Escape'&&!this.busy){e.preventDefault();this.$emit('leave');return;}if(e.key!=='Tab')return;const list=[...this.$refs.dialog.querySelectorAll('button:not(:disabled),select:not(:disabled)')],first=list[0],last=list[list.length-1];if(e.shiftKey&&[first,this.$refs.dialog].includes(document.activeElement)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
  }
};
</script>
<style scoped>
.reward-stack{font-weight:700;color:var(--journal-accent)}.reward-stack-preview{padding:8px;border:1px solid var(--journal-border);border-radius:6px;background:var(--journal-soft);overflow-wrap:anywhere}

.reward-reroll-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 20px;flex:none;border-bottom:1px solid var(--journal-border);background:var(--journal-card)}.reward-reroll-bar>div{min-width:0}.reward-reroll-bar strong{display:block;font-size:12px;color:var(--journal-heading)}.reward-reroll-bar small{display:block;font-size:10px;line-height:1.5;color:var(--journal-muted);margin-top:3px}.reward-reroll-bar button{flex:none;min-height:44px;padding:8px 12px;border:1px solid var(--journal-accent);border-radius:8px;color:var(--journal-heading);background:var(--journal-selected);font:600 12px var(--journal-font);cursor:pointer}.reward-reroll-bar button span{font-size:20px;vertical-align:middle;margin-right:4px}.reward-reroll-bar button:disabled{opacity:.5;cursor:default}.reward-pact-effects{display:grid;gap:7px}.reward-pact-effects>span{display:block}.reward-pact-effects b{display:inline-block;font-size:10px;text-transform:uppercase;letter-spacing:.05em;margin-right:3px}.reward-pact-effects [data-reward-boon] b{color:#236b4f}.reward-pact-effects [data-reward-cost] b{color:#9a3b46}.reward-duration{grid-column:2;font-size:10px;color:var(--reward-accent);font-weight:600}.reward-pact-effects [data-reward-cost]{border-top:1px solid var(--reward-line);padding-top:6px}
@media(max-width:420px){.reward-reroll-bar{padding:8px 13px;gap:8px}.reward-reroll-bar button{font-size:11px;max-width:142px}.reward-reroll-bar small{font-size:9px}}
@media(prefers-reduced-motion:no-preference){.reward-cards{animation:reward-deal .2s ease-out}@keyframes reward-deal{from{opacity:.4;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}}
html[data-game-theme-mode=dark] .reward-pact-effects [data-reward-boon] b{color:#a8dfbb}html[data-game-theme-mode=dark] .reward-pact-effects [data-reward-cost] b{color:#ffb2b9}

.reward-decline{background:var(--journal-card);color:var(--journal-heading);border-color:var(--journal-border)}
.reward-account p{font-size:13px;line-height:1.6;color:var(--journal-ink)}.reward-account strong{color:var(--journal-heading)}.reward-account small{font-size:11px;color:var(--journal-muted);line-height:1.5}

.reward-cash{display:flex;justify-content:space-between;gap:12px;margin:0 0 16px;padding:12px 14px;border:1px solid var(--journal-border);border-left:4px solid #b99746;border-radius:9px;background:var(--journal-soft);color:var(--journal-ink)}.reward-cash>span{display:flex;flex-direction:column;gap:3px;font-size:11px}.reward-cash>span:last-child{text-align:right}.reward-cash strong{font-size:22px;color:var(--journal-heading)}.reward-cash b{font-size:17px}.reward-cash small{font-size:10px;color:var(--journal-muted)}
.reward-backdrop{position:fixed;inset:0;z-index:1900;display:grid;place-items:center;padding:14px;background:var(--journal-backdrop);color:var(--journal-ink);font-family:var(--journal-font)}.tournament-reward-panel{display:flex;flex-direction:column;width:min(880px,100%);max-height:94dvh;overflow:hidden;background:var(--journal-paper);border:2px solid var(--journal-border);border-radius:16px;box-shadow:var(--journal-shadow);text-align:left}.tournament-reward-panel *{box-sizing:border-box}.tournament-reward-panel header{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid var(--journal-border);background:var(--journal-soft)}header small{font-size:10px;letter-spacing:.09em;color:var(--journal-muted)}header h2{margin:6px 0;color:var(--journal-heading);font:600 28px Georgia,serif}header p{margin:0;font-size:12px;color:var(--journal-muted)}.reward-exit{width:44px;height:44px;flex:none;margin-left:10px;border:1px solid var(--journal-border);border-radius:50%;background:var(--journal-card);color:var(--journal-ink);font:26px Arial;cursor:pointer}.reward-content{padding:18px 22px;overflow:auto;overscroll-behavior:contain;min-height:0}.reward-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}/* Rarity colours stay semantic, independently of the interface accent. */
.reward-card {
  --reward-bg:#efe4cd; --reward-ink:#463923; --reward-accent:#76572e;
  --reward-line:#ba9e70; --reward-tint:#d7bf92;
  position:relative; display:flex; flex-direction:column; align-items:center;
  gap:12px; padding:18px 14px 0; min-width:0; min-height:284px;
  border:2px solid var(--reward-line); border-radius:12px; overflow:hidden;
  background-color:var(--reward-bg);
  background-image:linear-gradient(145deg,#ffffff24,transparent 65%);
  color:var(--reward-ink); font:inherit; text-align:center; cursor:pointer;
  box-shadow:0 3px 0 var(--reward-line),0 5px 10px #162a3510;
}
.reward-card::before {
  content:''; position:absolute; inset:4px; border:1px solid var(--reward-line);
  opacity:.5; border-radius:7px; pointer-events:none;
}
.reward-card[data-rarity=uncommon] {
  --reward-bg:#d4e8df; --reward-ink:#1d493e; --reward-accent:#27694d;
  --reward-line:#75a58a; --reward-tint:#9bc5ae;
}
.reward-card[data-rarity=rare] {
  --reward-bg:#d1e5f5; --reward-ink:#203e60; --reward-accent:#2d6191;
  --reward-line:#7ba5ca; --reward-tint:#8cb9dc;
}
.reward-card[data-rarity=epic] {
  --reward-bg:#e5daf1; --reward-ink:#48325e; --reward-accent:#70508c;
  --reward-line:#a789be; --reward-tint:#b5a0d3;
}
.reward-card[data-rarity=legendary] {
  --reward-bg:#f3dc9f; --reward-ink:#533d16; --reward-accent:#7b5619;
  --reward-line:#bd9544; --reward-tint:#d7b366;
}
html[data-game-theme-mode=dark] .reward-card {
  --reward-bg:#35342e; --reward-ink:#f0e8d7; --reward-accent:#ead09e;
  --reward-line:#827354; --reward-tint:#8b754c;
}
html[data-game-theme-mode=dark] .reward-card[data-rarity=uncommon] {
  --reward-bg:#203f35; --reward-ink:#dff3e7; --reward-accent:#a7d6b3;
  --reward-line:#547f66; --reward-tint:#638f75;
}
html[data-game-theme-mode=dark] .reward-card[data-rarity=rare] {
  --reward-bg:#213b53; --reward-ink:#e2effa; --reward-accent:#a5d2f3;
  --reward-line:#537c9e; --reward-tint:#5d8caf;
}
html[data-game-theme-mode=dark] .reward-card[data-rarity=epic] {
  --reward-bg:#3a2b4d; --reward-ink:#f3e7ff; --reward-accent:#d8baf3;
  --reward-line:#87679f; --reward-tint:#9474ae;
}
html[data-game-theme-mode=dark] .reward-card[data-rarity=legendary] {
  --reward-bg:#49391c; --reward-ink:#fff0cd; --reward-accent:#f3d383;
  --reward-line:#b79046; --reward-tint:#b18d40;
}
.reward-rarity {
  display:flex; align-items:center; justify-content:center; gap:6px;
  min-height:20px; padding:0 18px; font-size:10px; font-weight:700;
  letter-spacing:.07em; color:var(--reward-accent);
}
.reward-rarity::before {content:'';width:5px;height:5px;background:currentColor;transform:rotate(45deg);flex:none}
.reward-emblem {
  display:grid; place-items:center; width:72px; height:72px; flex:none;
  border:1px solid var(--reward-line); border-radius:18px;
  background:#ffffff18; box-shadow:inset 0 0 0 3px #ffffff12;
}
.reward-card svg {width:48px;height:48px;color:var(--reward-ink);flex:none}
.reward-card>strong {font:600 20px Georgia,serif;color:var(--reward-ink);overflow-wrap:anywhere}
.reward-description {font-size:12px;line-height:1.6;flex:1;max-width:28em}
.reward-selected {
  width:calc(100% + 28px); margin-top:4px; padding:11px 8px;
  border-top:1px solid var(--reward-line); background:#ffffff18;
  color:var(--reward-accent); font-size:11px; font-weight:700;
}
.reward-check {
  position:absolute; top:9px; right:9px; width:22px; height:22px;
  display:grid; place-items:center; border-radius:50%;
  background:var(--reward-accent); color:var(--reward-bg); font:bold 14px Arial;
}
.reward-card[aria-pressed=true] {
  border-color:var(--reward-accent);
  box-shadow:inset 0 0 0 1px var(--reward-accent),0 0 0 2px var(--journal-paper),0 0 0 4px var(--reward-accent);
}
.reward-card[aria-pressed=true] .reward-selected {background:var(--reward-accent);color:var(--reward-bg)}
.reward-card:disabled {opacity:.68;cursor:default}
@media(hover:hover) {.reward-card:not(:disabled):hover {border-color:var(--reward-accent)}}
.reward-targets{margin-top:22px;padding-top:16px;border-top:1px solid var(--journal-border)}h3{font-size:14px;color:var(--journal-heading);margin:0 0 10px}.reward-team{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.reward-team button{display:flex;align-items:center;gap:6px;min-height:68px;min-width:0;padding:6px;border:1px solid var(--journal-border);border-radius:8px;background:var(--journal-card);color:var(--journal-ink);font:inherit;text-align:left;cursor:pointer}.reward-team button[aria-pressed=true]{border-color:var(--journal-accent);background:var(--journal-selected)}.reward-team button:disabled{cursor:default}.reward-team button:disabled:not(:has(small:nth-child(3))){opacity:.5}.reward-team .pokemon-portrait{width:46px;height:46px;flex:none}.reward-team button>span{min-width:0}.reward-team b{display:block;font-size:12px;overflow-wrap:anywhere}.reward-team small{display:block;font-size:10px;color:var(--journal-muted);margin-top:4px}.reward-preview{margin-top:12px;padding:10px 12px;border:1px solid var(--journal-border);border-radius:8px;background:var(--journal-soft);font-size:12px;line-height:1.7}.reward-preview p{margin:0 0 8px}.reward-preview p:last-child{margin-bottom:0}.reward-preview b,.reward-preview span{display:block}.reward-preview strong{color:var(--journal-heading)}.reward-hint{font-size:12px;color:var(--journal-muted)}.reward-move{display:flex;flex-direction:column;gap:8px;font-size:12px;margin-top:14px}.reward-move select{width:100%;min-height:44px;padding:8px;border:1px solid var(--journal-border);border-radius:7px;background:var(--journal-card);color:var(--journal-ink);font:inherit}.reward-error{color:var(--journal-danger);font-size:13px}.tournament-reward-panel footer{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:14px 20px;border-top:1px solid var(--journal-border);background:var(--journal-soft);font-size:11px;color:var(--journal-muted)}footer button{min-height:44px;min-width:160px;padding:10px 16px;border:1px solid var(--journal-accent);border-radius:8px;background:var(--journal-accent);color:var(--journal-on-accent);font:600 13px var(--journal-font);cursor:pointer}footer button:disabled{opacity:.5;cursor:default}.tournament-reward-panel :is(button,select):focus-visible{outline:2px solid var(--journal-accent);outline-offset:2px}@media(max-width:600px){.reward-backdrop{padding:8px}.tournament-reward-panel{max-height:calc(100dvh - 16px)}.tournament-reward-panel header{padding:13px 15px}header h2{font-size:22px}.reward-content{padding:14px}.reward-cards{grid-template-columns:1fr;gap:12px}.reward-card{display:grid;grid-template-columns:52px minmax(0,1fr);gap:6px 12px;min-height:114px;text-align:left;padding:14px}.reward-emblem{grid-column:1;grid-row:1/4;width:52px;height:60px;border-radius:13px;align-self:center}.reward-card svg{width:38px;height:38px}.reward-rarity,.reward-card>strong,.reward-description{grid-column:2}.reward-rarity{justify-content:flex-start;padding:0 18px 0 0}.reward-card>strong{font-size:17px}.reward-description{font-size:12px}.reward-selected{display:none}.reward-team{grid-template-columns:repeat(2,minmax(0,1fr))}.tournament-reward-panel footer{padding:10px;flex-wrap:wrap}.tournament-reward-panel footer>span{width:100%;font-size:10px}.tournament-reward-panel footer button{width:100%}}@media(min-width:601px) and (max-height:500px){.tournament-reward-panel header{padding:10px 15px}header h2{font-size:21px}.reward-content{padding:12px}.reward-card{padding-top:12px;gap:8px;min-height:250px}.reward-emblem{width:58px;height:58px}.reward-card svg{width:38px;height:38px}.tournament-reward-panel footer{padding:9px 14px}}@media(prefers-reduced-motion:no-preference){.reward-card{transition:border-color .15s,box-shadow .15s}}

.reward-powers{margin-bottom:14px}.reward-powers summary{cursor:pointer;min-height:44px;display:flex;align-items:center;color:var(--journal-heading);font-size:13px;font-weight:700}.reward-victory-heal{font-size:12px;color:var(--journal-ink)}
.reward-card[data-rarity=mythic]{--reward-bg:#efd8e9;--reward-ink:#50223f;--reward-accent:#8c306d;--reward-line:#b877a2;--reward-tint:#dca8cf}.reward-card[data-rarity=mythic] .reward-rarity::before{content:'✦'}
html[data-game-theme-mode=dark] .reward-card[data-rarity=mythic]{--reward-bg:#37243e;--reward-ink:#ffedfc;--reward-accent:#f2b6df;--reward-line:#c27bb0;--reward-tint:#845a83}
.has-four .reward-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.has-four .reward-card{display:grid;grid-template-columns:52px minmax(0,1fr);gap:6px 12px;min-height:142px;text-align:left;padding:14px}.has-four .reward-emblem{grid-column:1;grid-row:1/4;width:52px;height:60px;border-radius:13px;align-self:center}.has-four .reward-card svg{width:38px;height:38px}.has-four .reward-rarity,.has-four .reward-card>strong,.has-four .reward-description{grid-column:2}.has-four .reward-rarity{justify-content:flex-start;padding:0 18px 0 0}.has-four .reward-card>strong{font-size:17px}.has-four .reward-description{font-size:12px}.has-four .reward-selected{display:none}@media(max-width:600px){.has-four .reward-cards{grid-template-columns:1fr}.has-four .reward-card{min-height:114px}}
</style>

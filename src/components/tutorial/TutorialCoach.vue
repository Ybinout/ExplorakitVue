<template>
 <div class="tutorial-coach" v-show="!paused" :style="{visibility:measured?'visible':'hidden'}" data-tutorial-coach :data-step="step" @keydown.stop @keyup.stop>
  <svg class="coach-shade" :width="viewport.w" :height="viewport.h" aria-hidden="true"><defs><mask :id="maskId"><rect width="100%" height="100%" fill="white"/><rect v-if="rect" :x="rect.x" :y="rect.y" :width="rect.w" :height="rect.h" rx="12" fill="black"/></mask></defs><rect width="100%" height="100%" fill="#081c2d" fill-opacity=".64" :mask="`url(#${maskId})`"/><rect v-if="rect" :x="rect.x" :y="rect.y" :width="rect.w" :height="rect.h" rx="12" fill="none" stroke="#e4c77e" stroke-width="2"/></svg>
  <div v-for="(block,i) in blockers" :key="i" class="coach-blocker" :style="block" @pointerdown.prevent @click.prevent />
  <section ref="card" class="coach-card" :style="position" role="dialog" :aria-labelledby="maskId+'-title'" aria-live="polite">
   <div class="coach-heading"><span>PREMIERS PAS</span><small>{{ number }} / 10</small></div>
   <h3 :id="maskId+'-title'">{{ copy.title }}</h3><p>{{ copy.text }}</p>
   <p v-if="error" class="coach-error" role="alert">{{ error }}</p>
   <footer><span v-if="copy.interactive" class="coach-hint"><i/>{{ targetWaiting ? 'Préparation de la commande…' : blocked ? 'Un instant…' : copy.hint }}</span><button v-if="targetWaiting && !targetLoading && step==='capture'" @click="$emit('retry')">Recharger le sac</button><button v-if="!copy.interactive" :disabled="busy || blocked" @click="$emit('next')">{{ busy?'Enregistrement…':step==='care'?'C’est compris':'Continuer' }} <b aria-hidden="true">→</b></button></footer>
  </section>
 </div>
</template>
<script>
const messages={
 hp:{title:'La barre de vie',text:'Les PV sont les points de vie de ton Pokémon. Les attaques font baisser cette barre. À 0 PV, il est K.O. et ne peut plus combattre.'},
 potential:{title:'L’étoile de potentiel',text:'L’étoile indique le potentiel de ton Pokémon. Il existe 4 niveaux d’étoile : plus ce niveau est élevé, plus son potentiel est grand.'},
 types:{title:'Les types font la différence',text:'Chaque Pokémon et chaque capacité ont un type. L’Eau est efficace contre le Feu, par exemple. À l’inverse, les attaques Électrik ne touchent pas les Pokémon Sol. Regarde les types avant de choisir !'},
 actions:{title:'Une action à chaque tour',text:'Attaque permet de choisir une capacité. Le Sac contient tes Balls. Pokémon permet de changer de compagnon, et Fuite de quitter une rencontre sauvage. Commençons par attaquer.'},
 attack:{title:'Ta première attaque',text:'Choisis Attaque, puis une capacité. Tu verras ton Pokémon agir et la barre de vie adverse diminuer.',interactive:true,hint:'À toi de jouer'},
 capture_info:{title:'Un nouveau compagnon',text:'Tu as effectué ta première action ! Affaiblir un Pokémon facilite sa capture. Ouvre le Sac et lance une Poké Ball : cette première capture est garantie.'},
 capture:{title:'Lance ta Poké Ball',text:'Ouvre le Sac, puis sélectionne la Poké Ball. Le Pokémon capturé rejoindra ton équipe.',interactive:true,hint:'Utilise la Poké Ball'},
 menu:{title:'Le menu de ton aventure',text:'Ce bouton ouvre ton sac, le Pokédex, la minimap et les options. Tu y retrouveras aussi tes badges et tes amis.'},
 team:{title:'Ton équipe Pokémon',text:'Ce bouton te donne directement accès à tes Pokémon : consulte leurs capacités et leur talent, change leur ordre ou confie-leur un objet. Tu es prêt à retourner voir Wayne !'},
 care:{title:'Prends soin de ton équipe',text:'Si tous tes Pokémon sont K.O., tu seras ramené à l’abri. Ta maman ou l’infirmière d’un Centre Pokémon peuvent soigner ton équipe. Voyons maintenant comment retrouver les commandes de ton aventure.'}
};
export default {
 props: {step:String,selector:String,busy:Boolean,error:String,paused:Boolean,blocked:Boolean,targetLoading:Boolean},
 data:()=>({rect:null,lastRect:null,measured:false,viewport:{w:window.innerWidth,h:window.innerHeight},cardHeight:220}),
 computed:{
  maskId(){return 'tutorial-mask-'+this._uid;},
  copy(){return messages[this.step]||messages.hp;},
  targetWaiting(){return this.copy.interactive&&!this.rect;},
  number(){return ['hp','potential','types','actions','attack','capture_info','capture','care','menu','team'].indexOf(this.step)+1;},
  position(){
   const {w,h}=this.viewport,width=Math.min(350,Math.max(0,w-24)),r=this.rect||this.lastRect,gap=14;
   const clamp=(v,min,max)=>Math.max(min,Math.min(Math.max(min,max),v));
   if(!r)return {left:Math.max(12,(w-width)/2)+'px',top:Math.max(12,(h-this.cardHeight)/2)+'px',width:width+'px',maxHeight:Math.max(0,h-24)+'px'};
   const candidates=[{x:r.x+r.w/2-width/2,y:r.y+r.h+gap},{x:r.x+r.w/2-width/2,y:r.y-this.cardHeight-gap},{x:r.x+r.w+gap,y:r.y+r.h/2-this.cardHeight/2},{x:r.x-width-gap,y:r.y+r.h/2-this.cardHeight/2}];
   const overlap=p=>Math.max(0,Math.min(p.x+width,r.x+r.w)-Math.max(p.x,r.x))*Math.max(0,Math.min(p.y+this.cardHeight,r.y+r.h)-Math.max(p.y,r.y));
   const placed=candidates.map((p,i)=>({x:clamp(p.x,12,w-width-12),y:clamp(p.y,12,h-this.cardHeight-12),i}));
   placed.sort((a,b)=>overlap(a)-overlap(b)||a.i-b.i);const best=placed[0];
   return {left:best.x+'px',top:best.y+'px',width:width+'px',maxHeight:Math.max(0,h-best.y-12)+'px'};
  },
  blockers(){
   const r=this.rect;if(!r||!this.copy.interactive||this.blocked)return [{inset:0}];
   return [{left:0,top:0,width:'100%',height:r.y+'px'},{left:0,top:r.y+'px',width:r.x+'px',height:r.h+'px'},{left:r.x+r.w+'px',top:r.y+'px',right:0,height:r.h+'px'},{left:0,top:r.y+r.h+'px',width:'100%',bottom:0}];
  }
 },
 watch:{
  step(){this.$nextTick(()=>{this.queueMeasure();this.focusStep();});},
  selector(){this.$nextTick(this.queueMeasure);},
  paused(value){if(value){this.measured=false;this._mutations?.disconnect();}else this.reveal();}
 },
 mounted(){
  this._tutorialTargetRoot=this.$el.closest('.battle')||this.$el.closest('.game-root')||document.body;
  this._resize=new ResizeObserver(this.queueMeasure);this._resize.observe(document.documentElement);this._resize.observe(this.$refs.card);
  const layout=this._tutorialTargetRoot.querySelector('.battle-action-shell');if(layout)this._resize.observe(layout);
  this._mutations=new MutationObserver(records=>{if(records.some(r=>!this.$el.contains(r.target)))this.queueMeasure();});
  this.observeTargets();window.addEventListener('resize',this.queueMeasure);window.addEventListener('scroll',this.queueMeasure,true);
  window.visualViewport?.addEventListener('resize',this.queueMeasure);window.visualViewport?.addEventListener('scroll',this.queueMeasure);
  if(!this.paused)this.reveal();
 },
 beforeDestroy(){
  cancelAnimationFrame(this._measureFrame);this._resize?.disconnect();this._mutations?.disconnect();
  window.removeEventListener('resize',this.queueMeasure);window.removeEventListener('scroll',this.queueMeasure,true);
  window.visualViewport?.removeEventListener('resize',this.queueMeasure);window.visualViewport?.removeEventListener('scroll',this.queueMeasure);
 },
 methods:{
  reveal(){this.measured=false;this.$nextTick(()=>{if(this.paused||this._isDestroyed)return;this.observeTargets();this.measure();this.$nextTick(()=>{if(this.paused||this._isDestroyed)return;this.measure();this.measured=true;this.focusStep();});});},
  observeTargets(){if(!this.paused&&this._mutations)this._mutations.observe(this._tutorialTargetRoot,{childList:true,subtree:true});},
  focusStep(){if(!this.paused&&!this.copy.interactive)this.$refs.card?.querySelector('button')?.focus({preventScroll:true});},
  queueMeasure(){if(this.paused||this._measureFrame)return;this._measureFrame=requestAnimationFrame(()=>{this._measureFrame=null;this.measure();});},
  measure(){
   if(this.paused)return;
   const origin=this.$el.getBoundingClientRect(),w=this.$el.clientWidth||window.innerWidth,h=this.$el.clientHeight||window.innerHeight;
   const sx=origin.width/w||1,sy=origin.height/h||1;
   if(w!==this.viewport.w||h!==this.viewport.h)this.viewport={w,h};
   const card=this.$refs.card;const height=card?card.scrollHeight+card.offsetHeight-card.clientHeight:220;if(height!==this.cardHeight)this.cardHeight=height;
   const target=this.selector&&this._tutorialTargetRoot.querySelector(this.selector);
   if(target!==this._target){if(this._target)this._resize.unobserve(this._target);this._target=target;if(target)this._resize.observe(target);}
   // The ball can be below the capture notice inside a clipped, scrollable panel.
   // Scroll that panel only; never move the document or the combat scene.
   const scroller=this.copy.interactive&&target?.closest('.battle-action-display');
   if(scroller){const t=target.getBoundingClientRect(),s=scroller.getBoundingClientRect();if(t.height<=s.height){if(t.bottom>s.bottom)scroller.scrollTop+=(t.bottom-s.bottom)/sy;else if(t.top<s.top)scroller.scrollTop-=(s.top-t.top)/sy;}}
   const bounds=target?.getBoundingClientRect();
   let next=null;
   if(bounds?.width&&bounds.height){const left=Math.max(4,(bounds.left-origin.left)/sx-5),top=Math.max(4,(bounds.top-origin.top)/sy-5),right=Math.min(w-4,(bounds.right-origin.left)/sx+5),bottom=Math.min(h-4,(bounds.bottom-origin.top)/sy+5);if(right>left&&bottom>top)next={x:left,y:top,w:right-left,h:bottom-top};}
   if(JSON.stringify(next)!==JSON.stringify(this.rect))this.rect=next;
   if(next&&JSON.stringify(next)!==JSON.stringify(this.lastRect))this.lastRect=next;
  }
 }
};
</script>
<style scoped>
.tutorial-coach{-webkit-text-size-adjust:100%;text-size-adjust:100%;position:fixed;inset:0;z-index:5200;pointer-events:none;color:var(--journal-ink);font:13px/1.55 var(--journal-font)}.coach-shade{position:absolute;inset:0;pointer-events:none}.coach-blocker{position:absolute;pointer-events:auto;touch-action:none}.coach-card{overflow-y:auto;position:absolute;box-sizing:border-box;pointer-events:auto;padding:19px 20px 15px;border:2px solid var(--journal-border);border-top:4px solid #c5a966;border-radius:12px;background:var(--journal-paper);box-shadow:0 10px 40px #07162466}.coach-heading{display:flex;justify-content:space-between;gap:15px;color:var(--journal-muted);font-size:9px;font-weight:700;letter-spacing:.12em}.coach-heading small{font-size:10px;letter-spacing:0}.coach-card h3{font:700 22px/1.2 Georgia,serif;color:var(--journal-heading);margin:9px 0}.coach-card p{margin:0 0 15px}.coach-card footer{display:flex;justify-content:flex-end;min-height:38px}.coach-card button{display:flex;align-items:center;justify-content:space-between;gap:20px;border:1px solid var(--journal-border);border-radius:6px;background:var(--journal-accent);color:var(--journal-on-accent);min-height:44px;padding:8px 13px;font:700 12px var(--journal-font);cursor:pointer}.coach-card button:focus-visible{outline:3px solid #dec278;outline-offset:3px}.coach-card button:disabled{opacity:.6}.coach-hint{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--journal-muted)}.coach-hint i{width:6px;height:6px;border-radius:50%;background:#c5a966}.coach-error{color:var(--journal-danger);font-size:11px}@keyframes coach-in{from{opacity:0;translate:0 5px}to{opacity:1;translate:0 0}}@media(max-height:520px){.coach-card{padding:12px 15px;font-size:11px;line-height:1.4}.coach-card h3{font-size:18px;margin:5px 0}.coach-card p{margin-bottom:8px}}@media(prefers-reduced-motion:reduce){.coach-card{animation:none}}
</style>

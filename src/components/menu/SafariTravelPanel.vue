<template>
  <div class="safari-backdrop" @click.self="$emit('close')" @keydown.esc.stop="$emit('close')">
    <section ref="dialog" class="safari-travel" role="dialog" aria-modal="true" aria-labelledby="safari-travel-title" tabindex="-1" @keydown.tab="trap">
      <header><div><small>{{ returning?'LE RETOUR':'L’APPEL DU LARGE' }}</small><h2 id="safari-travel-title">{{ returning?'Rejoindre la Tour':'Cap sur l’île Safari' }}</h2></div><button aria-label="Fermer" @click="$emit('close')">×</button></header>
      <div class="safari-travel-copy"><span class="safari-compass" aria-hidden="true">⌖</span><p>{{ returning?'Le bateau est prêt. Je peux te ramener à l’accueil de la Tour de Combat.':'Des vergers, des marais et des criques… Là-bas, on croise des Pokémon qu’on ne voit nulle part ailleurs dans la région.' }}</p><p v-if="!returning">Leurs habitudes changent selon les jours. Prends le temps d’explorer et passe au Centre Pokémon du bourg : tu pourras ensuite revenir avec ton module Vol.</p><small>Traversée gratuite · {{ returning?'Tour de Combat':'Pokémon de niveau 60 à 90' }}</small></div>
      <footer><button ref="cancel" @click="$emit('close')">Pas maintenant</button><button class="safari-depart" data-safari-depart @click="$emit('depart')">{{ returning?'Rentrer à la Tour':'Embarquer' }} <span aria-hidden="true">→</span></button></footer>
    </section>
  </div>
</template>
<script>
export default{
 name:'SafariTravelPanel',props:{returning:Boolean},
 mounted(){this.previous=document.activeElement;this.$refs.cancel.focus({preventScroll:true});},
 beforeDestroy(){if(this.previous?.isConnected)this.previous.focus({preventScroll:true});},
 methods:{trap(event){const buttons=[...this.$refs.dialog.querySelectorAll('button')],first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}}
};
</script>
<style scoped>
.safari-backdrop{position:fixed;inset:0;z-index:1300;display:grid;place-items:center;padding:16px;background:var(--journal-backdrop)}.safari-travel{width:min(540px,100%);max-height:calc(100dvh - 32px);overflow:auto;background:var(--journal-paper);color:var(--journal-ink);border:2px solid var(--journal-border);border-radius:16px;box-shadow:var(--journal-shadow);font:14px/1.7 var(--journal-font)}header{display:flex;align-items:center;gap:16px;padding:22px 24px;border-bottom:1px solid var(--journal-border);background:var(--journal-soft)}header>div{flex:1}header small{font-size:9px;letter-spacing:.15em;color:var(--journal-accent)}h2{margin:4px 0 0;font:500 27px Georgia,serif;color:var(--journal-heading)}button{min-height:44px;padding:10px 14px;border:1px solid var(--journal-border);border-radius:9px;background:var(--journal-card);color:var(--journal-ink);font:600 13px var(--journal-font);cursor:pointer}header button{width:44px;padding:0;font-size:26px}.safari-travel-copy{padding:20px 24px}.safari-compass{float:left;margin:6px 15px 6px 0;color:var(--journal-accent);font-size:48px;line-height:1}.safari-travel-copy p{margin:0 0 14px}.safari-travel-copy small{color:var(--journal-muted);font-size:12px}footer{display:flex;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid var(--journal-border)}.safari-depart{background:var(--journal-accent);color:var(--journal-on-accent);border-color:var(--journal-accent)}.safari-depart span{margin-left:14px}@media(max-width:440px){header,.safari-travel-copy,footer{padding:16px}h2{font-size:24px}footer button{flex:1}}
</style>

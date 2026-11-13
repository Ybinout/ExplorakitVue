<template>
  <div class="trash-backdrop" @keydown.stop="keydown">
    <section ref="dialog" class="trash-panel" role="dialog" aria-modal="true" aria-labelledby="trash-title" tabindex="-1">
      <header><div><small>MA MAISON · RANGEMENT</small><h2 id="trash-title">Faire de la place</h2></div><button aria-label="Fermer la poubelle" :disabled="busy || !!pending" @click="close">×</button></header>
      <p>Choisis les objets à jeter et leur quantité. Les objets clés sont protégés.</p>
      <label class="trash-search"><span>Rechercher</span><input v-model="query" type="search" placeholder="Nom ou effet…" :disabled="busy || !!pending"/></label>
      <div class="trash-items"><article v-for="item in filtered" :key="item.key"><bag-item-icon :item-key="item.key" :pocket="pocket(item)"/><label><b>{{ item.name }}</b><small>{{ item.quantity }} dans le sac</small><input :value="quantities[item.key]||0" type="number" min="0" :max="item.quantity" :aria-label="'Quantité à jeter : '+item.name" :disabled="busy || !!pending" @input="quantity(item,$event.target.value)"/></label><button :disabled="busy || !!pending" @click="quantity(item,item.quantity)">Tout</button></article><p v-if="!filtered.length">Aucun objet à afficher.</p></div>
      <p v-if="error" role="alert" class="trash-error">{{ error }}</p><p v-else-if="notice" role="status">{{ notice }}</p>
      <footer><span>{{ selected.length }} objet(s) · {{ count }} unité(s)</span><button v-if="pending" :disabled="busy" @click="submit">Vérifier la suppression</button><button v-else :disabled="busy || !count" @click="confirming=true">Vérifier la sélection</button></footer>
      <div v-if="confirming" class="trash-confirm" role="alertdialog" aria-modal="true" aria-labelledby="trash-confirm-title"><section><h3 id="trash-confirm-title">Supprimer définitivement ?</h3><p>Ces objets ne pourront pas être récupérés.</p><ul><li v-for="item in selected" :key="item.key">{{ item.name }} × {{ item.quantity }}</li></ul><div><button ref="cancel" :disabled="busy" @click="confirming=false">Conserver</button><button class="trash-danger" :disabled="busy" @click="submit">Supprimer {{ count }} unité(s)</button></div></section></div>
    </section>
  </div>
</template>
<script>
import BagItemIcon from '../menu/BagItemIcon.vue';
import {bagPocket} from '@/services/bagPockets';
export default {
  components:{BagItemIcon},
  props:{payload:Object,busy:Boolean,error:String,notice:String,command:Function},
  data:()=>({query:'',quantities:{},confirming:false,pending:null}),
  computed:{
    filtered(){const q=this.query.trim().toLocaleLowerCase('fr');return (this.payload.items||[]).filter(i=>(i.name+' '+i.description).toLocaleLowerCase('fr').includes(q));},
    selected(){return (this.payload.items||[]).filter(i=>this.quantities[i.key]>0).map(i=>({key:i.key,name:i.name,quantity:this.quantities[i.key]}));},
    count(){return this.selected.reduce((n,i)=>n+i.quantity,0);}
  },
  watch:{confirming(v){if(v)this.$nextTick(()=>this.$refs.cancel?.focus());}},
  mounted(){this.$refs.dialog.focus();},
  methods:{
    pocket:bagPocket,
    keydown(event){
      if(event.key==='Escape'){event.preventDefault();this.close();return;}
      if(event.key!=='Tab')return;
      const root=this.confirming?this.$el.querySelector('.trash-confirm'):this.$refs.dialog;
      const nodes=[...root.querySelectorAll('button:not(:disabled),input:not(:disabled)')].filter(e=>e.getClientRects().length);
      const next=event.shiftKey&&document.activeElement===nodes[0]?nodes.at(-1):!event.shiftKey&&document.activeElement===nodes.at(-1)?nodes[0]:null;
      if(next){event.preventDefault();next.focus();}
    },
    quantity(item,n){this.$set(this.quantities,item.key,Math.max(0,Math.min(item.quantity,Math.floor(Number(n)||0))));},
    close(){if(this.confirming){if(!this.busy)this.confirming=false;}else if(!this.busy&&!this.pending)this.$emit('close');},
    async submit(){
      if(this.busy)return;
      if(!this.pending)this.pending={revision:this.payload.home.revision,requestId:crypto.randomUUID(),floor:this.payload.floor,furnitureId:this.payload.furnitureId,confirm:true,items:this.selected.map(({key,quantity})=>({key,quantity}))};
      const result=await this.command('discard',this.pending);
      this.confirming=false;
      if(result?.success){this.pending=null;this.quantities={};}
      else if(result?.retryable===false)this.pending=null;
    }
  }
};
</script>
<style scoped>
.trash-backdrop{position:fixed;inset:0;z-index:1100;display:grid;place-items:center;padding:12px;background:var(--journal-backdrop)}.trash-panel{position:relative;width:min(680px,100%);max-height:min(780px,94dvh);display:flex;flex-direction:column;background:var(--journal-paper);color:var(--journal-ink);border:1px solid var(--journal-border);border-radius:18px;box-shadow:var(--journal-shadow);overflow:hidden}.trash-panel header{display:flex;justify-content:space-between;align-items:center;background:var(--journal-card);padding:20px;border-bottom:1px solid var(--journal-border)}.trash-panel h2{font:500 27px Georgia,serif;margin:5px 0}.trash-panel header small{font-size:9px;letter-spacing:.12em;color:var(--journal-muted)}.trash-panel button{border:1px solid var(--journal-border);border-radius:8px;min-height:42px;padding:8px 13px;background:var(--journal-soft);color:var(--journal-ink);cursor:pointer}.trash-panel header button{font-size:23px}.trash-panel button:disabled{opacity:.5;cursor:default}.trash-panel>p,.trash-search{margin:12px 20px;font-size:12px;line-height:1.5}.trash-search{display:flex;align-items:center;gap:12px}.trash-panel input{border:1px solid var(--journal-border);background:var(--journal-card);color:var(--journal-ink);border-radius:7px;min-height:40px;padding:8px;box-sizing:border-box}.trash-search input{flex:1;min-width:0}.trash-items{min-height:80px;overflow:auto;padding:0 20px}.trash-items article{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--journal-border)}.trash-items label{display:grid;grid-template-columns:1fr 75px;align-items:center;gap:4px 12px;flex:1;min-width:0}.trash-items b{font-size:12px}.trash-items small{font-size:10px;color:var(--journal-muted)}.trash-items input{width:75px;grid-column:2;grid-row:1/3}.trash-panel footer{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 20px;border-top:1px solid var(--journal-border);font-size:11px}.trash-panel footer button{background:var(--journal-accent);color:var(--journal-on-accent)}.trash-error{color:var(--journal-danger)}.trash-confirm{position:absolute;inset:0;display:grid;place-items:center;padding:18px;background:var(--journal-backdrop)}.trash-confirm section{max-height:100%;overflow:auto;box-sizing:border-box;width:min(440px,100%);padding:22px;background:var(--journal-paper);border:1px solid var(--journal-border);border-radius:14px}.trash-confirm h3{font:500 23px Georgia,serif;margin:0 0 14px}.trash-confirm p,.trash-confirm ul{font-size:12px;line-height:1.6}.trash-confirm ul{padding-left:18px}.trash-confirm section>div{display:flex;gap:10px;flex-wrap:wrap}.trash-panel .trash-danger{color:var(--journal-danger);border-color:var(--journal-danger)}@media(max-width:500px){.trash-items{padding:0 12px}.trash-items article{gap:7px}.trash-items label{grid-template-columns:1fr 62px;gap:4px 6px}.trash-items input{width:62px}.trash-items article>button{font-size:11px;padding:7px}.trash-items ::v-deep .bag-item-icon{width:32px;height:32px}.trash-panel header{padding:14px}}
</style>

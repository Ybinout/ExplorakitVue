<template>
  <div class="owned-name-editor">
    <button v-if="!editing" class="name-edit-toggle" :data-name-edit="kind" :disabled="busy" @click="start">Renommer</button>
    <form v-else @submit.prevent="save" @keydown.esc.stop.prevent="cancel">
      <label><span>{{ label }}</span><input ref="input" v-model="draft" :data-name-input="kind" type="text" maxlength="24" :placeholder="defaultName" :disabled="busy" autocomplete="off" spellcheck="false" @keydown.stop @keydown.esc.stop.prevent="cancel"></label>
      <small>24 caractères maximum · laisse vide pour remettre {{ defaultName }}.</small>
      <div class="name-edit-actions"><button type="button" :disabled="busy" @click="cancel">Annuler</button><button type="submit" :data-name-save="kind" :disabled="busy">{{ busy?'Enregistrement…':'Enregistrer' }}</button></div>
    </form>
    <p v-if="error" class="name-edit-error" role="alert">{{ error }}</p><p v-else-if="notice" class="name-edit-notice" role="status">{{ notice }}</p>
  </div>
</template>
<script>
export default {
  props:{kind:String,label:String,value:String,defaultName:String,busy:Boolean,error:String,notice:String},
  data:()=>({editing:false,draft:'',submitted:false}),
  watch:{busy(value,previous){if(!value && previous && this.submitted){this.submitted=false;if(!this.error)this.editing=false;}},value(){if(!this.busy && !this.editing)this.draft=this.value || ''; }},
  methods:{start(){this.draft=this.value===this.defaultName?'':this.value || '';this.editing=true;this.$nextTick(()=>this.$refs.input?.focus({preventScroll:true}));},cancel(){if(!this.busy){this.editing=false;this.submitted=false;this.$nextTick(()=>this.$el.querySelector('button')?.focus({preventScroll:true}));}},save(){if(!this.busy){this.submitted=true;this.$emit('save',this.draft);}}}
};
</script>
<style scoped>
.owned-name-editor{min-width:0;color:var(--journal-ink);font:12px var(--journal-font)}button,input{font:inherit;color:inherit;min-height:44px;border:1px solid var(--journal-border);border-radius:8px;background:var(--journal-card);padding:8px 12px;box-sizing:border-box}button{cursor:pointer}button:disabled,input:disabled{opacity:.55;cursor:default}button:focus-visible,input:focus-visible{outline:2px solid var(--journal-accent);outline-offset:2px}.name-edit-toggle{color:var(--journal-accent);font-weight:600}form{padding:12px;background:var(--journal-soft);border:1px solid var(--journal-border);border-radius:10px}label{display:grid;gap:7px;font-weight:600}input{width:100%;min-width:0;user-select:text;-webkit-user-select:text}small{display:block;margin:7px 0;color:var(--journal-muted);font-size:10px;line-height:1.5;overflow-wrap:anywhere}.name-edit-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.name-edit-actions button[type=submit]{background:var(--journal-accent);color:var(--journal-on-accent)}p{margin:7px 0 0;line-height:1.5;overflow-wrap:anywhere}.name-edit-error{color:var(--journal-danger)}.name-edit-notice{color:var(--journal-accent)}
</style>

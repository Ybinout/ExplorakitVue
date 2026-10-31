<template>
  <form class="world-chat-input" aria-label="Parler sur cette carte" @submit.prevent="send" @pointerdown.stop @keydown.stop @keyup.stop>
    <div class="world-chat-heading"><label for="world-chat-message">{{ english?'On this map':'Sur cette carte' }}</label><button type="button" :aria-label="english?'Close chat':'Fermer le chat'" @click="$emit('close')">×</button></div>
    <div class="world-chat-compose"><input id="world-chat-message" ref="input" v-model="draft" data-world-chat-input type="text" maxlength="160" autocomplete="off" :placeholder="english?'Say something…':'Écris un message…'" :disabled="busy" @compositionstart="composing=true" @compositionend="composing=false" @keydown.enter.stop="enter" @keydown.esc.stop.prevent="$emit('close')"><button type="submit" :disabled="busy || !draft.trim()">{{ busy?'…':english?'Send':'Envoyer' }}</button></div>
    <small v-if="error" class="world-chat-error" role="alert">{{ error }}</small><small v-else>{{ english?'Enter to send · Escape to close':'Entrée pour envoyer · Échap pour fermer' }} <span>{{ draft.length }}/160</span></small>
  </form>
</template>
<script>
export default {
  props:{busy:Boolean,error:String,language:String},data:()=>({draft:'',composing:false}),
  computed:{english(){return this.language==='en';}},
  mounted(){this.$refs.input.focus();},
  watch:{busy(value){if(!value)this.$nextTick(()=>this.$refs.input.focus());}},
  methods:{enter(event){if(event.isComposing||event.keyCode===229)return;event.preventDefault();if(!event.repeat)this.send();},send(){if(!this.busy&&!this.composing&&this.draft.trim())this.$emit('send',this.draft);}}
};
</script>
<style scoped>
.world-chat-input{position:absolute;z-index:28;bottom:12px;left:12px;right:12px;width:min(540px,calc(100% - 24px));box-sizing:border-box;margin:0 auto;padding:10px 14px;border:1px solid var(--journal-progress);border-radius:14px;background:var(--journal-paper);color:var(--journal-ink);box-shadow:var(--journal-shadow);font:12px/1.4 var(--journal-font)}
.world-chat-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}.world-chat-heading label{font-weight:700;color:var(--journal-heading)}.world-chat-heading button{width:28px;height:28px;border:0;background:none;color:var(--journal-muted);font-size:22px;cursor:pointer}.world-chat-compose{display:flex;gap:8px}.world-chat-compose input{box-sizing:border-box;min-width:0;flex:1;min-height:44px;padding:10px 12px;border:1px solid var(--journal-border);border-radius:8px;background:var(--journal-card);color:var(--journal-ink);font:16px var(--journal-font);user-select:text;-webkit-user-select:text}.world-chat-compose button{flex:none;min-height:44px;padding:8px 13px;border:1px solid var(--journal-accent);border-radius:8px;background:var(--journal-accent);color:var(--journal-on-accent);font:600 12px var(--journal-font);cursor:pointer}.world-chat-input button:disabled{opacity:.5;cursor:default}.world-chat-input small{display:block;margin-top:6px;color:var(--journal-muted);font-size:10px}.world-chat-input small span{float:right}.world-chat-input .world-chat-error{color:var(--journal-danger)}.world-chat-input :focus-visible{outline:2px solid var(--journal-progress);outline-offset:2px}
</style>

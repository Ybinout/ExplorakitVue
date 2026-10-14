<template><div class="friend-actions">
  <button v-if="relationship==='none'" :disabled="busy" data-friend-action="request" @click="$emit('action','request')">Ajouter en ami</button>
  <template v-else-if="relationship==='incoming'"><button :disabled="busy" data-friend-action="accept" @click="$emit('action','accept')">Accepter</button><button :disabled="busy" class="secondary" data-friend-action="decline" @click="$emit('action','decline')">Refuser</button></template>
  <template v-else-if="relationship==='outgoing'"><span>Demande envoyée</span><button :disabled="busy" class="secondary" data-friend-action="cancel" @click="$emit('action','cancel')">Annuler</button></template>
  <template v-else-if="relationship==='friends'"><span>✓ Amis</span><button :disabled="busy" class="secondary" data-friend-action="remove" @click="$emit('action','remove')">Retirer des amis</button></template>
</div></template>
<script>
export default {name:'FriendActions',props:{relationship:{type:String,required:true},busy:Boolean}};
</script>
<style scoped>
.friend-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px;font:12px Arial;color:#287366}.friend-actions button{border:1px solid #287366;background:#287366;color:#fff;border-radius:8px;min-height:44px;padding:10px 14px;font:700 12px Arial;cursor:pointer}.friend-actions .secondary{background:#fcfcf8;color:#5c716b;border-color:#d3ddd2}.friend-actions button:disabled{opacity:.5;cursor:wait}.friend-actions button:focus-visible{outline:3px solid #9b791f;outline-offset:3px}
</style>

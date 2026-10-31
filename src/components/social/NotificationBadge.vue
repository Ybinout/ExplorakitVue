<template>
  <span v-if="count>0" class="social-notification-badge" :aria-label="label||`${count} notification${count>1?'s':''}`">{{ count>99?'99+':count }}</span>
</template>
<script>
export default {name:'NotificationBadge',props:{count:{type:Number,default:0},label:String}};
</script>
<style scoped>
.social-notification-badge{display:inline-grid;place-items:center;flex:none;box-sizing:border-box;min-width:21px;height:21px;padding:0 5px;border:1px solid #9d641a;border-radius:12px;background:#f4bc5b;color:#263747;font:800 11px/1 var(--journal-font);font-variant-numeric:tabular-nums;box-shadow:0 1px 2px #122b4226;animation:social-notification-pulse 2.4s ease-in-out infinite}
@keyframes social-notification-pulse{0%,100%{transform:scale(1);opacity:.9}45%{transform:scale(1.12);opacity:1}}
@media(prefers-reduced-motion:reduce){.social-notification-badge{animation:none}}
</style>

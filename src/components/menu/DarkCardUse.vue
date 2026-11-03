<template>
  <div>
    <p v-if="seconds>0" class="bag-use-hint" role="timer" aria-live="off" data-dark-card-timer>{{ english?'Available in':'Disponible dans' }} {{ timer }}</p>
    <button class="bag-use-button" data-use-dark-card :disabled="disabled || seconds>0" @click="$emit('use')">{{ onIsland ? (english?'Return to the guide':'Retour auprès du guide') : seconds>0 ? (english?'Card recharging':'Carte en recharge') : (english?'Reach the continent':'Rejoindre le continent') }}</button>
  </div>
</template>
<script>
export default {
  name:'DarkCardUse',
  props:{item:{type:Object,required:true},disabled:Boolean,onIsland:Boolean,english:Boolean},
  data(){return{now:Date.now()};},
  computed:{seconds(){return Math.max(0,Math.ceil(((Number(this.item.travelReadyAt)||0)-this.now-(Number(this.item.travelClockOffset)||0))/1000));},timer(){return `${Math.floor(this.seconds/60)}:${String(this.seconds%60).padStart(2,'0')}`;}},
  watch:{'item.travelServerNow'(){this.sync();},'item.travelReadyAt'(){this.sync();}},
  mounted(){this.sync();},
  beforeDestroy(){clearInterval(this._tick);},
  methods:{sync(){clearInterval(this._tick);this.now=Date.now();if(this.seconds>0)this._tick=setInterval(()=>{this.now=Date.now();if(!this.seconds)clearInterval(this._tick);},1000);}}
};
</script>

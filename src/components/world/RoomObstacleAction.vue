<template>
  <div class="room-obstacle-action" :class="{'is-complete':action.success}" role="status" aria-live="polite">
    <span class="room-obstacle-label">{{ language === 'en' ? action.messageEn : action.message }}</span>
    <div v-if="!action.success" class="room-obstacle-progress">
      <span>{{ stageLabel }}</span><span class="room-obstacle-hits" aria-hidden="true"><i v-for="n in totalHits" :key="n" :class="{hit:hits>=n}"></i></span>
    </div>
    <span v-else class="room-obstacle-confirm">✓ {{ language === 'en' ? 'Passage cleared' : 'Passage dégagé' }}</span>
  </div>
</template>
<script>
import {strikeState} from '../../services/roomObstacleRenderer';
export default {
  props:{action:{type:Object,required:true},language:{type:String,default:'fr'}},
  data:()=>({hits:0}),
  computed:{
    totalHits(){return strikeState(this.action,performance.now()).totalHits;},
    stageLabel(){return (this.language==='en'
      ?['You brace yourself…','A crack appears…','The crystals resist…','The crack widens…','One last strike!','The crystals give way!']
      :['Tu prends ton élan…','Une fissure apparaît…','Les cristaux résistent…','La fissure s’étend…','Encore un coup !','Les cristaux cèdent !'])[this.hits>=this.totalHits?5:this.hits===this.totalHits-1?4:Math.ceil(this.hits*3/Math.max(1,this.totalHits-1))];}
  },
  mounted(){this._tick=setInterval(()=>{this.hits=strikeState(this.action,performance.now()).hits;},60);},
  beforeDestroy(){clearInterval(this._tick);}
};
</script>
<style scoped>
.room-obstacle-action{position:absolute;z-index:25;left:50%;bottom:16px;transform:translateX(-50%);width:min(360px,calc(100% - 32px));box-sizing:border-box;padding:12px 14px;border:2px solid #8f7b9e;border-radius:4px;background:#202032f5;color:#f4ebf4;box-shadow:0 4px 0 #0b1224aa;font:13px/1.5 Arial,sans-serif;pointer-events:none;}
.room-obstacle-label{display:block;font-weight:700;min-height:3em;}
.room-obstacle-progress{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#d2bfdc;}
.room-obstacle-hits{display:flex;gap:5px;flex-shrink:0;}
.room-obstacle-hits i{width:8px;height:8px;border:1px solid #baa7c8;background:#393147;}
.room-obstacle-hits i.hit{background:#e6d1f2;}
.is-complete{border-color:#92b3a0;}
.room-obstacle-confirm{color:#c4ead5;}
</style>

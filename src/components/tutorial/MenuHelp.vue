<template>
 <tutorial-coach v-back="close" :step="'help-'+index" :message="steps[index]" :selector="steps[index].target" :scope="scope" :current="index+1" :total="steps.length" :heading="title" closable @next="next" @close="close" @keydown.esc.stop.prevent="close"/>
</template>
<script>
import TutorialCoach from './TutorialCoach.vue';
export default {
 components:{TutorialCoach}, props:{steps:{type:Array,required:true},scope:String,title:String},data:()=>({index:0}),
 mounted(){this.previousFocus=document.activeElement;this.$emit('stage',this.steps[0]);},
 beforeDestroy(){const el=this.previousFocus;this.$nextTick(()=>{if(el?.isConnected)el.focus({preventScroll:true});});},
 methods:{next(){if(this.index+1===this.steps.length)this.close();else{this.index++;this.$emit('stage',this.steps[this.index]);}},close(){this.$emit('close');}}
};
</script>

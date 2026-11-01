<template>
 <div class="roulette-wheel" :aria-label="label" role="img">
  <svg viewBox="0 0 300 300" aria-hidden="true">
   <circle cx="150" cy="150" r="146" fill="#b08a50"/><circle cx="150" cy="150" r="139" fill="#1c3040"/>
   <g :transform="`rotate(${pose.angle*180/Math.PI} 150 150)`">
    <path v-for="(n,i) in wheel" :key="n" :d="segment(i)" :fill="color(n)" stroke="#c4aa6d" stroke-width=".35"/>
    <text v-for="(n,i) in wheel" :key="'n'+n" :x="150+Math.sin(i*Math.PI*2/37)*120" :y="154-Math.cos(i*Math.PI*2/37)*120" text-anchor="middle" fill="#fff9e5" font-size="10" font-family="Arial">{{ n }}</text>
    <circle cx="150" cy="150" r="91" fill="#bb9759"/><circle cx="150" cy="150" r="84" fill="#3b594f"/>
    <path d="M150 79v142M79 150h142" stroke="#c7ad74" stroke-width="4"/>
    <circle cx="150" cy="150" r="26" fill="#d4b77a"/><circle cx="150" cy="150" r="15" fill="#f1ddb2"/>
   </g>
   <circle :cx="150+Math.cos(pose.ball)*132" :cy="150+Math.sin(pose.ball)*132" r="4" fill="#fff8da" stroke="#a18c63"/>
   <path d="M142 4h16l-8 16z" fill="#fff0b9"/>
  </svg>
  <span v-if="state?.phase==='result'" class="winning-number" :style="{background:color(state.result)}">{{ state.result }}</span>
 </div>
</template>
<script>
import {WHEEL,numberColor,roulettePose} from '@/services/whitepeakRoulette';
export default{
 props:{state:Object,motion:{type:Boolean,default:true}},data:()=>({clock:Date.now()}),
 computed:{wheel(){return WHEEL;},pose(){return roulettePose(this.state,this.clock+(this.state?.serverOffset||0),this.motion);},label(){return this.state?.phase==='result'?`Numéro gagnant : ${this.state.result}`:'Roulette commune à la salle';}},
 watch:{state(){this.animate();},motion(){this.animate();}},
 mounted(){this.animate();document.addEventListener('visibilitychange',this.animate);},beforeDestroy(){cancelAnimationFrame(this.frame);document.removeEventListener('visibilitychange',this.animate);},
 methods:{animate(){cancelAnimationFrame(this.frame);const frame=()=>{this.clock=Date.now();if(this.motion&&!document.hidden&&this.state?.phase==='spinning'&&this.clock+(this.state.serverOffset||0)<this.state.resultAt)this.frame=requestAnimationFrame(frame);};frame();},color:numberColor,segment(i){const a=(i-.5)*Math.PI*2/37-Math.PI/2,b=(i+.5)*Math.PI*2/37-Math.PI/2;return `M150 150 L${150+Math.cos(a)*136} ${150+Math.sin(a)*136} A136 136 0 0 1 ${150+Math.cos(b)*136} ${150+Math.sin(b)*136} Z`;}}
};
</script>
<style scoped>
.roulette-wheel{position:relative;width:min(260px,100%);margin:auto;flex:none}.roulette-wheel svg{display:block;width:100%;filter:drop-shadow(0 6px 0 #061c2933)}.winning-number{position:absolute;inset:calc(50% - 25px);display:grid;place-items:center;width:50px;height:50px;border:2px solid #e7d398;border-radius:50%;font:700 23px Georgia,serif;color:#fff}
</style>

// Short local samples share the existing battle AudioContext and master gain.
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const indexes=new WeakMap();
export const ENTRY_BLOOM_DELAY=.34;
export function moveSample(catalogue,name,language='en'){
 let index=indexes.get(catalogue);if(!index){index={en:new Map(),fr:new Map()};for(const m of Object.values(catalogue.moves)){index.en.set(fold(m.name),m.file);index.fr.set(fold(m.label),m.file);}indexes.set(catalogue,index);}
 const key=fold(name),primary=index[language==='fr'?'fr':'en'],secondary=index[language==='fr'?'en':'fr'];return primary.has(key)?primary.get(key):secondary.get(key)||null;
}
export function crySample(catalogue,p){
 if(!p||p.storyActor==='professor')return null;
 const b=p.__battle||{},illusion=b.illusion;
 const id=illusion?.id||illusion?.formSpriteId||b.transformSpriteId||b.formSpriteId||p.formSpriteId||p.data?.id||p.pokemonId||p.id;
 return catalogue.cries[id]||(illusion?catalogue.cries[illusion.id]:catalogue.cries[p.data?.id||p.pokemonId])||null;
}
export function entryCry(entries){
 const alive=entries.filter(e=>e.pokemon&&Number(e.pokemon.currentHp)>0);
 return alive.find(e=>e.own)||alive[0]||null;
}
export class BattleSamples{
 constructor(audio,catalogue,{base='/',fetcher=(...a)=>fetch(...a),maxBytes=12*1024*1024}={}){
  this.audio=audio;this.catalogue=catalogue;this.base=base+'audio/combat/'+catalogue.version+'/';this.fetcher=fetcher;this.maxBytes=maxBytes;this.bytes=0;this.cache=new Map();this.pending=new Map();this.controllers=new Set();this.channels=new Map();this.closed=false;
 }
 async load(file){
  if(!file||this.closed||! /^(?:moves|cries)\/\d+\.mp3$/.test(file))return null;
  if(this.cache.has(file)){const b=this.cache.get(file);this.cache.delete(file);this.cache.set(file,b);return b;}
  if(this.pending.has(file))return this.pending.get(file);
  this.audio.ensureContext();const context=this.audio.context;if(!context)return null;
  const controller=new AbortController();this.controllers.add(controller);const timeout=setTimeout(()=>controller.abort(),4000);
  const task=(async()=>{try{
   const response=await this.fetcher(this.base+file,{signal:controller.signal,cache:'force-cache'});if(!response.ok)return null;
   const bytes=await response.arrayBuffer();if(bytes.byteLength>150000)return null;
   const buffer=await context.decodeAudioData(bytes);if(this.closed||buffer.duration>10)return null;
   const cost=buffer.length*buffer.numberOfChannels*4;
   while(this.bytes+cost>this.maxBytes&&this.cache.size){const [key,old]=this.cache.entries().next().value;this.cache.delete(key);this.bytes-=old.length*old.numberOfChannels*4;}
   if(cost<=this.maxBytes){this.cache.set(file,buffer);this.bytes+=cost;}return buffer;
  }catch{return null;}finally{clearTimeout(timeout);this.controllers.delete(controller);this.pending.delete(file);}})();this.pending.set(file,task);return task;
 }
 async prepare({pokemon=[],moves=[]}={}){
  if(this.closed||!this.audio.volume)return;
  const files=[...new Set([...pokemon.map(p=>crySample(this.catalogue,p)),...moves.map(m=>moveSample(this.catalogue,typeof m==='string'?m:m.ename||m.name))].filter(Boolean))];
  // At most four simultaneous short requests; there is no whole-catalogue preload.
  for(let i=0;i<files.length;i+=4)await Promise.all(files.slice(i,i+4).map(f=>this.load(f)));
 }
 stopChannel(kind){const active=this.channels.get(kind);if(!active)return;this.channels.delete(kind);try{active.source.stop();}catch{ /* Already ended. */ }active.source.onended?.();}
 play(file,{kind='move',duration=2.4,delay=0}={}){
  if(this.closed||!this.audio.ready()||typeof document!=='undefined'&&document.hidden)return false;
  this.stopChannel(kind);const buffer=this.cache.get(file);
  if(!buffer){if(kind==='move')this.audio.playPlan([{kind:'noise',filter:'lowpass',frequency:1700,endFrequency:400,duration:.23,volume:.18},{kind:'tone',type:'triangle',frequency:135,endFrequency:65,duration:.20,volume:.12}]);return false;}
  const c=this.audio.context,source=c.createBufferSource(),gain=c.createGain(),start=c.currentTime+Math.max(0,Math.min(.8,delay)),length=Math.max(.06,Math.min(buffer.duration,duration)),level=kind==='cry'?.95:.82;
  source.buffer=buffer;source.connect(gain);gain.connect(this.audio.output);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(level,start+.008);gain.gain.setValueAtTime(level,start+Math.max(.009,length-.09));gain.gain.exponentialRampToValueAtTime(.0001,start+length);
  let ended=false;const active={source,gain,level,start};this.channels.set(kind,active);source.onended=()=>{if(ended)return;ended=true;source.disconnect();gain.disconnect();if(this.channels.get(kind)===active)this.channels.delete(kind);};source.start(start);source.stop(start+length+.01);return true;
 }
 move(name,duration){return this.play(moveSample(this.catalogue,name),{kind:'move',duration});}
 cry(p,options={}){return this.play(crySample(this.catalogue,p),{kind:'cry',duration:3.2,...options});}
 duck(){const m=this.channels.get('move');if(m){const now=this.audio.context.currentTime;m.gain.gain.cancelScheduledValues(now);m.gain.gain.setTargetAtTime(.08,now,.018);}}
 stop(){for(const kind of [...this.channels.keys()])this.stopChannel(kind);}
 dispose(){this.closed=true;this.stop();for(const c of this.controllers)c.abort();this.cache.clear();this.bytes=0;}
}

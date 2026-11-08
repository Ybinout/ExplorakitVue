// One same-URL history sentinel, regardless of nesting depth. Browser Back
// consumes the latest actual window; no synthetic routes or re-open-on-Forward.
export class OverlayBackStack {
 constructor(host=window){this.host=host;this.entries=[];this.armed=false;this.draining=false;this.processing=false;this.token='riftmon-'+Date.now()+'-'+Math.random().toString(36).slice(2);this.onPop=this.onPop.bind(this);host.addEventListener('popstate',this.onPop);
  if(host.history.state?.riftmonOverlay){this.draining=true;host.history.back();}
 }
 add(close,visible=()=>true){const entry={close,visible,disposed:false};this.entries.push(entry);this.sync();return()=>{entry.disposed=true;this.entries=this.entries.filter(e=>e!==entry);this.sync();};}
 sync(){
  if(this.processing||this.draining)return;
  if(this.entries.length){if(!this.armed){try{this.url=this.host.location.href;this.host.history.pushState({...this.host.history.state,riftmonOverlay:this.token},'',this.url);this.armed=true;}catch{/* Native navigation remains available if history is unavailable. */}}}
  else if(this.armed){this.armed=false;if(this.host.history.state?.riftmonOverlay===this.token&&this.host.location.href===this.url){this.draining=true;this.host.history.back();}}
 }
 async onPop(event){
  if(this.draining){this.draining=false;this.sync();return;}
  if(this.armed&&this.host.location.href===this.url){
   this.armed=false;this.processing=true;const entry=this.entries.pop();
   try{if(entry)await entry.close();}catch{/* A failed close stays open and retains its Back entry. */}
   await Promise.resolve();
   if(entry&&!entry.disposed&&entry.visible())this.entries.push(entry);
   this.processing=false;this.sync();return;
  }
  // Programmatic route changes can leave an old sentinel behind. Never reopen
  // a closed window or leave a duplicate page when the user returns through it.
  this.armed=false;
  if(!this.entries.length&&event.state?.riftmonOverlay){this.draining=true;this.host.history.back();}
 }
 destroy(){this.host.removeEventListener('popstate',this.onPop);this.entries=[];}
}
export function backDirective(stack){
 const update=(el,binding)=>{
  const value=typeof binding.value==='function'?{close:binding.value,active:true}:binding.value||{};
  el._riftmonBackValue=value;
  if(value.active!==false&&typeof value.close==='function'){
   if(!el._riftmonBackRelease)el._riftmonBackRelease=stack.add(()=>el._riftmonBackValue.close(),()=>el.isConnected&&el._riftmonBackValue.active!==false&&(el.tagName!=='DIALOG'||el.open));
  }else{el._riftmonBackRelease?.();el._riftmonBackRelease=null;}
 };
 return{inserted:update,update,unbind(el){el._riftmonBackRelease?.();delete el._riftmonBackRelease;delete el._riftmonBackValue;}};
}

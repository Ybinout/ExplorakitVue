// Pointer Events give mouse, pen and touch the same owner-confirmed drop path.
export function createComputerDrag({root, changed, drop, navigateBox, ended}) {
  let gesture=null, frame=null, navTimer=null, navStep=null;
  function targetAt(x,y) {
    const node=document.elementFromPoint(x,y)?.closest('[data-pc-drop]');
    if(!node || !root.contains(node) || node.disabled)return null;
    return node.dataset.pcDrop==='team'
      ? {kind:'team',index:Number(node.dataset.pcIndex),uuid:node.dataset.pcTargetUuid || null}
      : {kind:'box',box:Number(node.dataset.pcBox),slot:Number(node.dataset.pcSlot),uuid:node.dataset.pcTargetUuid || null};
  }
  function update() {
    if(!gesture?.active)return;
    gesture.to=targetAt(gesture.x,gesture.y);
    changed({...gesture});
    const button=document.elementFromPoint(gesture.x,gesture.y)?.closest('[data-pc-box-step]');
    const step=button && root.contains(button) ? Number(button.dataset.pcBoxStep) : null;
    if(step!==navStep){clearTimeout(navTimer);navTimer=null;navStep=step;}
    if(step!==null && !navTimer)navTimer=setTimeout(()=>{navTimer=null;if(gesture?.active && navStep===step){navigateBox(step);update();}},650);
  }
  function scrollLoop() {
    if(!gesture?.active || !root.isConnected)return;
    for(const [selector,axis]of [['.pc-body','y'],['.pc-team-slots','x']]){
      const el=root.querySelector(selector),r=el?.getBoundingClientRect();if(!r)continue;
      if(gesture.x<r.left || gesture.x>r.right || gesture.y<r.top || gesture.y>r.bottom)continue;
      const n=axis==='y'?gesture.y:gesture.x,lo=axis==='y'?r.top:r.left,hi=axis==='y'?r.bottom:r.right;
      const delta=n<lo+28?-Math.ceil((lo+28-n)/3):n>hi-28?Math.ceil((n-hi+28)/3):0;
      if(delta)el[axis==='y'?'scrollTop':'scrollLeft']+=delta;
    }
    update();frame=requestAnimationFrame(scrollLoop);
  }
  function cancel() {
    const old=gesture;gesture=null;cancelAnimationFrame(frame);clearTimeout(navTimer);navTimer=null;navStep=null;
    if(old?.active){ended?.();try{root.releasePointerCapture(old.pointerId);}catch{ /* Already released by the browser. */ }}
    changed(null);
  }
  return {
    start(event,pokemon,from) {
      if(event.isPrimary===false || event.button!==0 || gesture)return;
      gesture={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,pokemon,from,active:false,to:null};
    },
    move(event) {
      if(!gesture || event.pointerId!==gesture.pointerId)return;
      gesture.x=event.clientX;gesture.y=event.clientY;
      if(!gesture.active && Math.hypot(gesture.x-gesture.startX,gesture.y-gesture.startY)>=8){
        gesture.active=true;try{root.setPointerCapture(event.pointerId);}catch{ /* Synthetic test pointers. */ }
        frame=requestAnimationFrame(scrollLoop);
      }
      if(gesture.active){event.preventDefault();update();}
    },
    finish(event) {
      if(!gesture || event.pointerId!==gesture.pointerId)return;
      const current=gesture;
      if(current.active){event.preventDefault();current.to=targetAt(event.clientX,event.clientY);}
      cancel();
      if(current.active && current.to)drop({action:'move',pokemonUuid:current.pokemon.uuid,from:current.from,to:current.to});
    },
    leave() {if(!gesture?.active)cancel();},
    cancel
  };
}

// Bounded gameplay input summaries; no key text, pointer coordinates or chat.
export function observeActionRhythm(socket,{root,win=window,doc=document,nav=navigator,clock=()=>performance.now(),setTimer=setInterval,clearTimer=clearInterval}={}){
 const mobile=()=>!!nav.userAgentData?.mobile||/Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent||'')||(nav.platform==='MacIntel'&&nav.maxTouchPoints>1);
 let previous=null,intervals=[],count=0,untrusted=0,sequence=0,keyboardAt=-Infinity,controllerAt=-Infinity,closed=false;
 const assisted=()=>{if(clock()-controllerAt<1500)return true;try{return Array.from(nav.getGamepads?.()||[]).some(p=>p?.connected);}catch{return false;}};
 function clear(){previous=null;intervals=[];count=0;untrusted=0;}
 function input(event){
  if(closed||doc.hidden||mobile()||!socket.connected||event.repeat||event.isComposing||event.ctrlKey||event.metaKey||event.altKey)return;
  const target=event.target,typing=target?.closest?.('input,textarea,select,[contenteditable="true"],[data-social-surface]');if(typing)return;
  if(event.type==='keydown'&&!['Space','Enter','KeyA','Digit1','Digit2','Digit3','Digit4','Numpad1','Numpad2','Numpad3','Numpad4'].includes(event.code))return;
  if(event.type==='click'&&(!target?.nodeType||!root?.contains(target)||!target.closest?.('button,canvas')))return;
  const time=clock();if(event.type==='keydown')keyboardAt=time;
  // Keyboard navigation and gamepads intentionally call .click() in this game.
  if(event.type==='click'&&(time-keyboardAt<120||assisted()))return;
  if(assisted())return;
  if(previous!=null){const delta=Math.round(time-previous);if(delta>=1&&delta<=30000){intervals.push(delta);if(intervals.length>64)intervals.shift();}}
  previous=time;count=Math.min(128,count+1);if(event.isTrusted===false)untrusted=Math.min(count,untrusted+1);
 }
 const controller=()=>{controllerAt=clock();clear();},visibility=()=>{if(doc.hidden)clear();};
 const reconnect=()=>{sequence=0;clear();};
 function flush(){if(closed||!count||doc.hidden||mobile()||!socket.connected){if(doc.hidden||!socket.connected)clear();return;}
  socket.emit('input:rhythm',{version:1,sequence:++sequence,intervals:[...intervals],count,untrusted,assisted:assisted(),mobile:false});intervals=[];count=0;untrusted=0;
 }
 win.addEventListener('keydown',input,true);win.addEventListener('click',input,true);win.addEventListener('riftmon:gamepad',controller,true);doc.addEventListener('visibilitychange',visibility);socket.on('connect',reconnect);const timer=setTimer(flush,2000);
 return {flush,stop(){if(closed)return;closed=true;clearTimer(timer);win.removeEventListener('keydown',input,true);win.removeEventListener('click',input,true);win.removeEventListener('riftmon:gamepad',controller,true);doc.removeEventListener('visibilitychange',visibility);socket.off('connect',reconnect);clear();}};
}

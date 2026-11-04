// Keep the point above the head, or above an existing friend/AFK nameplate.
// It shares the world's interpolated position and uses no timer or bitmap.
export function drawPlayerBattleIndicator(context,position,hasLabel=false) {
  if(!Number.isFinite(position?.x)||!Number.isFinite(position?.y))return false;
  const x=Math.round(position.x),y=Math.round(position.y-(hasLabel?65:49));
  context.save();
  context.fillStyle='rgba(16,29,40,.85)';context.beginPath();context.arc(x,y,4.5,0,Math.PI*2);context.fill();
  context.fillStyle='#ed5261';context.beginPath();context.arc(x,y,3,0,Math.PI*2);context.fill();
  context.restore();return true;
}
export function applyPlayerBattleStatus(players,map,payload) {
  const player=players[payload?.id];
  if(!player || payload.currentmap!==map || player.currentmap!==map || typeof payload.inbattle!=='boolean')return false;
  player.inbattle=payload.inbattle;
  return true;
}

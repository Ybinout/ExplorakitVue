import source from '@/assets/ile2_04.png';
// Reuse the author's boat without editing either map. Its whole footprint stays
// over already-impassable sea cells; this adds no new walkable surface.
export const BOAT={map:'jungle3',x:40,y:36,w:252,h:92};
let art=null,loading=false;
function load(){if(loading)return;loading=true;const img=new Image();img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=126;canvas.height=46;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.beginPath();const outline=[[4,12],[10,5],[56,3],[72,8],[94,10],[110,14],[123,21],[120,28],[111,35],[85,43],[12,43],[5,39]];outline.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();c.drawImage(img,60,258,126,46,0,0,126,46);art=canvas;};img.src=source;}
export function drawMagicIslandBoat(c,map){if(map!==BOAT.map)return;if(!art){load();return;}c.save();c.imageSmoothingEnabled=false;c.drawImage(art,BOAT.x,BOAT.y,BOAT.w,BOAT.h);c.restore();}

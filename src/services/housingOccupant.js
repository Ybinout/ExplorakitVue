import {artItem,furnitureBounds,drawFurniture} from './housingArt';
// Anchors follow the visible mattress/cushions, not the collision tile's center.
export function occupantLayout(placement,pose){
 const b=furnitureBounds(placement),rotation=(placement.rotation||0)/90,rest=pose.kind==='rest';
 const item=artItem(placement.key),seats=rest?1:Math.max(item.w,item.h),seat=Math.max(0,Math.min(seats-1,Number(pose.seat)||0));
 if(rest){
  const center=[[.5,.38],[.38,.5],[.5,.62],[.62,.5]][rotation];
  return {b,cx:b.x+b.w*center[0],cy:b.y+b.h*center[1],angle:[0,-Math.PI/2,Math.PI,Math.PI/2][rotation],depth:b.bottom+1,rotation,rest:true};
 }
 const side=rotation%2!==0;
 return {b,cx:side?b.x+b.w*.5:b.x+b.w*(seat+.5)/seats,cy:side?b.y+b.h*(seat+.5)/seats:b.y+b.h*(rotation===2?.25:.57),angle:0,depth:b.bottom+1,rotation,rest:false};
}
const silhouettes=new WeakMap();
function silhouette(image,frame){
 let cache=silhouettes.get(image);if(!cache){cache=new Map();silhouettes.set(image,cache);}const key=frame.x+':'+frame.y;if(cache.has(key))return cache.get(key);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,frame.x,frame.y,64,64,0,0,64,64);const pixels=c.getImageData(0,0,64,64).data;
 let left=64,top=64,right=0,bottom=0;for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(pixels[(y*64+x)*4+3]>80){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);}
 const box={x:frame.x+left,y:frame.y+top,w:right-left,h:bottom-top};cache.set(key,box);return box;
}
function overlay(c,art,p,b,rect){c.save();c.beginPath();c.rect(b.x+rect[0]*b.w,b.y+rect[1]*b.h,rect[2]*b.w,rect[3]*b.h);c.clip();drawFurniture(c,art,p);c.restore();}
export function drawHousingOccupant(c,art,image,frame,{placement,layout}){
 const a=silhouette(image,frame);if(a.w<=0||a.h<=0)return;
 const {b,rotation}=layout;c.save();c.imageSmoothingEnabled=false;
 if(layout.rest){
  c.translate(Math.round(layout.cx),Math.round(layout.cy));c.rotate(layout.angle);c.drawImage(image,a.x,a.y,a.w,a.h,-a.w/2,-a.h/2,a.w,a.h);c.restore();
  // Repaint the actual duvet pixels over the lower body, keeping the pillow visible.
  const masks=[[0,.43,1,.57],[.43,0,.57,1],[0,0,1,.57],[0,0,.57,1]];overlay(c,art,placement,b,masks[rotation]);
 }else{
  const head=Math.ceil(a.h*.65),torso=Math.max(8,Math.floor((a.h-head)*.6)),x=Math.round(layout.cx-a.w/2),y=Math.round(layout.cy-head-torso*.35);
  c.drawImage(image,a.x,a.y,a.w,head,x,y,a.w,head);c.drawImage(image,a.x,a.y+head,a.w,a.h-head,x,y+head,a.w,torso);c.restore();
  if(rotation===2)overlay(c,art,placement,b,[0,0,1,.58]);
  else if(rotation===1)overlay(c,art,placement,b,[0,0,.12,1]);
  else if(rotation===3)overlay(c,art,placement,b,[.88,0,.12,1]);
  else overlay(c,art,placement,b,[0,.86,1,.14]);
 }
}

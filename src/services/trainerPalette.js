// Exact palette substitution on the base sheet. Never tint skin/white/outline pixels.
const SOURCE=[[232,112,96],[176,80,72],[120,64,64],[192,56,56],[136,40,64]];
const PALETTES={
  'blue-light':[[105,163,191],[67,113,148],[36,65,87],[78,137,174],[42,78,107]],
  'blue-dark':[[72,112,143],[43,74,100],[30,48,66],[56,91,122],[34,57,81]],
  'sage-light':[[151,186,151],[99,139,105],[52,80,60],[119,156,117],[66,102,74]],
  'sage-dark':[[110,148,119],[65,101,78],[39,64,48],[84,122,94],[48,80,59]],
  'lavender-light':[[181,157,202],[134,105,164],[77,58,101],[154,125,181],[96,74,126]],
  'lavender-dark':[[140,119,170],[99,76,128],[59,45,79],[118,93,148],[77,58,103]],
  'sand-light':[[215,181,118],[169,129,68],[95,72,43],[191,150,85],[123,92,49]],
  'sand-dark':[[175,142,89],[128,98,54],[77,59,36],[151,117,65],[100,76,43]]
};
export function normalizeTrainerPalette(value) { return Object.hasOwn(PALETTES,value)?value:null; }
export function trainerPaletteKey(preferences) { return normalizeTrainerPalette(`${preferences?.themeColor}-${preferences?.themeMode}`)||'blue-light'; }
const packed=rgb=>(rgb[0]<<16)|(rgb[1]<<8)|rgb[2];
const positions=new Map(SOURCE.map((rgb,i)=>[packed(rgb),i]));
const femalePositions=new Map([[[176,176,200],0],[[96,96,128],1],[[152,96,144],3],[[104,64,88],4],[[224,128,184],0]].map(([rgb,index])=>[packed(rgb),index]));
export function supportsTrainerPalette(sprite){return ['sprite.png','sprite2.png'].includes(sprite);}
// Align the authored female poses once. The tiny disconnected black island is
// atlas debris; retain the complete main silhouette, skin, eyes and outlines.
export function normalizeFemalePixels(input,width=256,height=256){
 if(width!==256||height!==256)return new Uint8ClampedArray(input);
 const output=new Uint8ClampedArray(input.length);
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const visited=new Set(),groups=[];
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){const k=y*64+x;if(visited.has(k)||!input[((row*64+y)*width+col*64+x)*4+3])continue;const queue=[k];visited.add(k);
   for(const q of queue){const a=q%64,b=Math.floor(q/64);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=a+dx,ny=b+dy,n=ny*64+nx;if(nx<0||nx>=64||ny<0||ny>=64||visited.has(n)||!input[((row*64+ny)*width+col*64+nx)*4+3])continue;visited.add(n);queue.push(n);}}groups.push(queue);}
  const body=groups.sort((a,b)=>b.length-a.length)[0]||[],xs=body.map(k=>k%64),ys=body.map(k=>Math.floor(k/64));const dx=Math.round(31-(Math.min(...xs)+Math.max(...xs))/2),dy=60-Math.max(...ys);
  for(const q of body){const x=q%64,y=Math.floor(q/64),a=((row*64+y)*width+col*64+x)*4,b=((row*64+y+dy)*width+col*64+x+dx)*4;if(x+dx>=0&&x+dx<64&&y+dy>=0&&y+dy<64)output.set(input.subarray(a,a+4),b);}
 }
 for(let row=0;row<4;row++)for(let y=0;y<64;y++)for(let x=0;x<64;x++){const src=((row*64+y)*width+x)*4,to=((row*64+y)*width+128+x)*4;output.set(output.subarray(src,src+4),to);}
 // The fourth north pose duplicates idle in the supplied sheet. Alternate the
 // legs of its existing walking pose; keep the head, hair and bag unchanged.
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){const sx=y>=49?62-x:x,src=((192+y)*width+64+sx)*4,to=((192+y)*width+192+x)*4;if(sx>=0&&sx<64)output.set(output.subarray(src,src+4),to);}
 return output;
}
export function recolorTrainerPixels(input,palette,sprite='sprite.png') {
  const output=new Uint8ClampedArray(input),colors=PALETTES[normalizeTrainerPalette(palette)];if(!colors)return output;
  for(let i=0;i<output.length;i+=4){if(!output[i+3])continue;const index=(sprite==='sprite2.png'?femalePositions:positions).get((output[i]<<16)|(output[i+1]<<8)|output[i+2]);if(index===undefined)continue;output.set(colors[index],i);}
  return output;
}
const variants=new WeakMap(),loads=new Map();
export function themedTrainerSheet(image,palette,sprite='sprite.png') {
 if(!supportsTrainerPalette(sprite)||!image?.complete||!image.naturalWidth)return image;
 const key=normalizeTrainerPalette(palette);if(!key&&sprite!=='sprite2.png')return image;
 let cache=variants.get(image);if(!cache){cache=new Map();variants.set(image,cache);}const variant=sprite+':'+(key||'original');if(cache.has(variant))return cache.get(variant);
 const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
 const context=canvas.getContext('2d');context.imageSmoothingEnabled=false;context.drawImage(image,0,0);
 const data=context.getImageData(0,0,canvas.width,canvas.height);const pixels=sprite==='sprite2.png'?normalizeFemalePixels(data.data,canvas.width,canvas.height):data.data;data.data.set(recolorTrainerPixels(pixels,key,sprite));context.putImageData(data,0,0);
 canvas.complete=true;canvas.naturalWidth=canvas.width;canvas.naturalHeight=canvas.height;cache.set(variant,canvas);return canvas;
}
export function loadBaseTrainerSheet(url) {
 if(!loads.has(url)){const image=new Image();image.src=url;loads.set(url,image.decode().then(()=>image).catch(e=>{loads.delete(url);throw e;}));}return loads.get(url);
}
export function trainerPalettePreview(image,palette,sprite='sprite.png') {
 const sheet=themedTrainerSheet(image,palette,sprite);if(!sheet?.getContext)return image?.src||'';
 sheet.previewUrl ||= sheet.toDataURL('image/png');return sheet.previewUrl;
}

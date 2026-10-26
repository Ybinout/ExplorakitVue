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
export function recolorTrainerPixels(input,palette) {
  const output=new Uint8ClampedArray(input),colors=PALETTES[normalizeTrainerPalette(palette)];if(!colors)return output;
  for(let i=0;i<output.length;i+=4){if(!output[i+3])continue;const index=positions.get((output[i]<<16)|(output[i+1]<<8)|output[i+2]);if(index===undefined)continue;output.set(colors[index],i);}
  return output;
}
let sourceUrl=null,sourceImage=null,loading=null,loadingUrl=null;
const variants=new Map();
export function themedTrainerSheet(image,palette) {
  const key=normalizeTrainerPalette(palette);if(!key||!image?.complete||!image.naturalWidth)return image;
  if(sourceUrl!==image.src){variants.clear();sourceUrl=image.src;}
  if(variants.has(key))return variants.get(key);
  const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
  const context=canvas.getContext('2d');context.imageSmoothingEnabled=false;context.drawImage(image,0,0);
  const data=context.getImageData(0,0,canvas.width,canvas.height);data.data.set(recolorTrainerPixels(data.data,key));context.putImageData(data,0,0);
  // Same sheet interface as an already decoded Image for the existing renderer.
  canvas.complete=true;canvas.naturalWidth=canvas.width;canvas.naturalHeight=canvas.height;
  variants.set(key,canvas);return canvas;
}
export function loadBaseTrainerSheet(url) {
  if(loadingUrl===url&&loading)return loading;
  loadingUrl=url;
  sourceImage=new Image();sourceImage.src=url;const image=sourceImage;
  loading=image.decode().then(()=>image);return loading;
}
export function trainerPalettePreview(image,palette) {
  const sheet=themedTrainerSheet(image,palette);if(!sheet?.getContext)return image?.src||'';
  sheet.previewUrl ||= sheet.toDataURL('image/png');return sheet.previewUrl;
}

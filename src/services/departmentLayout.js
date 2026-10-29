// Native-size cached composition: only empty aisle columns are removed.
const floors=new Set(['tour_rdc','tour_etage1','tour_etage2','tour_etage3']);
const cache=new WeakMap();
export function drawDepartment(context,image,map){
  if(!floors.has(map))return false;
  let compact=cache.get(image);
  if(!compact){
    if(!image.complete||!image.naturalWidth)return false;
    compact=document.createElement('canvas');compact.width=448;compact.height=320;
    const c=compact.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#000';c.fillRect(0,0,448,320);
    for(const[start,end,to]of [[0,5,2],[7,21,7],[23,28,21]])c.drawImage(image,start*16,0,(end-start)*16,320,to*16,0,(end-start)*16,320);
    cache.set(image,compact);
  }
  context.drawImage(compact,0,0,896,640);return true;
}

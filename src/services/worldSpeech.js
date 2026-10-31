const DEFAULT_COLORS = { paper:'#edf5fc', ink:'#243f53', border:'#6699b2' };
export function speechColors(root) {
  const style=getComputedStyle(root);
  return { paper:style.getPropertyValue('--journal-paper').trim()||DEFAULT_COLORS.paper,
    ink:style.getPropertyValue('--journal-heading').trim()||DEFAULT_COLORS.ink,
    border:style.getPropertyValue('--journal-progress').trim()||DEFAULT_COLORS.border };
}
export function wrapSpeech(context,text,maxWidth=208) {
  const lines=[];let line='';
  for(const word of text.split(/\s+/u)) {
    if(line && context.measureText(line+' '+word).width>maxWidth){lines.push(line);line='';}
    for(const char of Array.from((line?' ':'')+word)) {
      if(line && context.measureText(line+char).width>maxWidth){lines.push(line);line='';}
      line+=char;
    }
  }
  if(line)lines.push(line);
  return lines;
}
export class WorldSpeech {
  constructor(createCanvas=()=>document.createElement('canvas')){this.entries=new Map();this.createCanvas=createCanvas;this.colors={...DEFAULT_COLORS};}
  clear(){this.entries.clear();}
  setColors(colors){if(Object.keys(DEFAULT_COLORS).every(key=>this.colors[key]===colors[key]))return;this.colors=colors;for(const entry of this.entries.values())entry.cache=null;}
  receive(payload,now) {
    if(!payload||typeof payload.fromId!=='string'||typeof payload.map!=='string'||typeof payload.text!=='string'||!payload.text.trim()||Array.from(payload.text).length>160)return false;
    if(!this.entries.has(payload.fromId)&&this.entries.size>=32)this.entries.delete(this.entries.keys().next().value);
    this.entries.set(payload.fromId,{map:payload.map,text:payload.text,expires:now+7000,cache:null});return true;
  }
  bitmap(entry,resolution,maxWidth) {
    if(entry.cache?.resolution===resolution&&entry.cache?.maxWidth===maxWidth)return entry.cache;
    const canvas=this.createCanvas(),ctx=canvas.getContext('2d');ctx.font='13px Arial, sans-serif';
    const lines=wrapSpeech(ctx,entry.text,maxWidth-24),width=Math.max(52,Math.ceil(Math.max(...lines.map(line=>ctx.measureText(line).width)))+24),height=lines.length*17+20;
    canvas.width=Math.ceil(width*resolution);canvas.height=Math.ceil(height*resolution);ctx.scale(resolution,resolution);
    ctx.fillStyle=this.colors.paper;ctx.strokeStyle=this.colors.border;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.roundRect(1,1,width-2,height-2,10);ctx.fill();ctx.stroke();
    ctx.fillStyle=this.colors.ink;ctx.font='13px Arial, sans-serif';ctx.textBaseline='top';
    lines.forEach((line,index)=>ctx.fillText(line,12,10+index*17));
    return entry.cache={canvas,width,height,resolution,maxWidth};
  }
  draw(context,{players,map,camera,scale,position},now) {
    if(!this.entries.size)return;
    const resolution=Math.max(1,Math.min(4,Math.ceil(scale))),maxWidth=Math.max(72,Math.min(232,camera.visibleWidth-16));
    const placed=[];
    for(const [id,entry] of this.entries){
      const player=players[id];
      if(entry.expires<=now||entry.map!==map||!player||player.currentmap!==map||player.inbattle){this.entries.delete(id);continue;}
      const p=position(id,player),right=camera.x+camera.visibleWidth,bottom=camera.y+camera.visibleHeight;
      if(p.x+24<camera.x||p.x-24>right||p.y+24<camera.y||p.y-48>bottom)continue;
      const image=this.bitmap(entry,resolution,maxWidth);
      const x=Math.max(camera.x+8,Math.min(right-image.width-8,p.x-image.width/2));
      const preferred=p.y-50-image.height;
      const candidates=[preferred,...placed.map(r=>r.y-image.height-12),p.y+26,...placed.map(r=>r.y+r.height+12)];
      const y=candidates.find(top=>top>=camera.y+4 && top+image.height<=bottom-4
        && (top+image.height<=p.y-40||top>=p.y+26)
        && !placed.some(r=>x<r.x+r.width+6&&x+image.width+6>r.x&&top<r.y+r.height+6&&top+image.height+6>r.y));
      if(y===undefined)continue; // Keep text readable when a crowd fills a tiny viewport.
      placed.push({x,y,width:image.width,height:image.height});
      const below=y>=p.y+26;
      const tailX=Math.max(x+14,Math.min(x+image.width-14,p.x)),baseY=below?y+2:y+image.height-2,tipY=below?y-7:y+image.height+7;
      context.save();context.globalAlpha=Math.min(1,(entry.expires-now)/220);context.imageSmoothingEnabled=true;
      context.drawImage(image.canvas,x,y,image.width,image.height);
      context.fillStyle=this.colors.paper;context.strokeStyle=this.colors.border;context.lineWidth=1.5;
      context.beginPath();context.moveTo(tailX-7,baseY);context.lineTo(tailX,tipY);context.lineTo(tailX+7,baseY);context.fill();context.stroke();context.restore();
    }
  }
}

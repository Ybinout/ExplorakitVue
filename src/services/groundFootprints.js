const SOURCE_W=448,SOURCE_H=320,WIDTH=896,HEIGHT=640,FRAME_MS=1000/30;
export const FOOTPRINT_LIFETIME=1350,FOOTPRINT_MAX_DISTANCE=64,FOOTPRINT_LIMIT=1024;
const STEP=4,STRIDE=14,MAX_ACTORS=64;
// A faint, narrow scuff with alternating shallow depressions, not a solid rut.
// Max coverage keeps retracing/crossings from accumulating dark outlines.
const SCUFF=[],SOLE=[];
for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
    const distance=Math.hypot(dx,dy);if(distance>4)continue;
    SCUFF.push({dx,dy,core:distance<3.3?90*Math.pow(1-distance/3.8,.6):0,rim:distance>=3.3?14:0});
}
for(let along=-2;along<=2;along++)for(let across=-1;across<=1;across++){
    const depth=1-(along/2.6)**2-(across/1.45)**2;
    if(depth>0)SOLE.push({along,across,core:255*(.55+.45*depth)});
}
const SOLES=Object.fromEntries([[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>[
    `${dx},${dy}`,SOLE.map(p=>({dx:p.along*dx-p.across*dy,dy:p.along*dy+p.across*dx,core:p.core}))
]));
export function footprintOpacity(now,born,distance=0){
    const age=now-born;
    const tail=1-Math.max(0,distance-16)/(FOOTPRINT_MAX_DISTANCE-16);
    return age<0||age>=FOOTPRINT_LIFETIME||tail<=0?0:.42*Math.pow(1-Math.max(0,age-120)/(FOOTPRINT_LIFETIME-120),1.35)*Math.pow(tail,1.25);
}

export class GroundFootprintsRenderer{
    constructor(surface,createCanvas=()=>document.createElement('canvas')){
        this.surface=surface;
        this.createCanvas=createCanvas;this.actors=new Map();this.marks=[];this.frames=0;this.triggers=0;this.destroyed=false;this.lastTime=-Infinity;
    }
    prepare(image,map){
        this.suspend();
        if(this.destroyed||!this.hasGround(map))return;
        let sample;
        try{
            sample=this.createCanvas();sample.width=SOURCE_W;sample.height=SOURCE_H;
            const c=sample.getContext('2d',{willReadFrequently:true});c.imageSmoothingEnabled=false;c.drawImage(image,0,0,SOURCE_W,SOURCE_H);
            const data=c.getImageData(0,0,SOURCE_W,SOURCE_H).data;
            this.mask=new Uint8Array(SOURCE_W*SOURCE_H);
            for(let y=0;y<SOURCE_H;y++)for(let x=0;x<SOURCE_W;x++){
                const i=y*SOURCE_W+x,cell=this.surface.maps[map][Math.floor(y/16)][Math.floor(x/16)];
                if(cell==='1'&&data[i*4+3]===255&&this.surface.colors.has(`${data[i*4]},${data[i*4+1]},${data[i*4+2]}`))this.mask[i]=1;
            }
            this.canvas=this.createCanvas();this.canvas.width=SOURCE_W;this.canvas.height=SOURCE_H;
            this.context=this.canvas.getContext('2d');if(!this.context)throw Error('Canvas unavailable');
            this.frame=this.context.createImageData(SOURCE_W,SOURCE_H);
            this.framePixels=new Uint32Array(this.frame.data.buffer);this.dirty=[];
            this.depth=new Uint8Array(SOURCE_W*SOURCE_H);this.rim=new Uint8Array(SOURCE_W*SOURCE_H);
            this.source=image;this.map=map;
        }catch(_){this.suspend();}
        finally{if(sample){sample.width=0;sample.height=0;}}
    }
    hasGround(map){return Object.prototype.hasOwnProperty.call(this.surface.maps,map);}
    onGround(x,y){
        return x>=0&&y>=0&&x<WIDTH&&y<HEIGHT&&Boolean(this.mask?.[Math.floor(y/2)*SOURCE_W+Math.floor(x/2)]);
    }
    observe(actors,now){
        const seen=new Set();
        for(const actor of actors.slice(0,MAX_ACTORS)){
            const {id,x,y}=actor;if(!id||!Number.isFinite(x)||!Number.isFinite(y))continue;seen.add(id);
            const old=this.actors.get(id),distance=old?Math.hypot(x-old.x,y-old.y):0,delta=old?now-old.time:0;
            const valid=old&&delta>0&&delta<250&&distance<=48&&distance<=Math.max(12,delta*.6);
            // A path object survives its actor until its marks melt. Resetting
            // after a teleport therefore cannot brighten old marks or join them.
            const path=valid?old.path:{distance:0};
            const state={x,y,time:now,path,side:valid?old.side:-1};
            this.actors.set(id,state);
            if(!valid||distance<.001)continue;
            const dx=(x-old.x)/distance,dy=(y-old.y)/distance;
            const start=path.distance;path.distance+=distance;
            const heading=Math.abs(dx)>=Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)];
            for(const [kind,spacing]of [['scuff',STEP],['step',STRIDE]]){
                let offset=spacing-start%spacing;
                while(offset<=distance){
                    const side=kind==='step'?state.side*4:0;
                    const px=old.x+dx*offset-dy*side,py=old.y+dy*offset+dx*side;
                    if(kind==='step')state.side*=-1;
                    if(this.onGround(px,py)){
                        this.marks.push({x:Math.round(px/2)*2,y:Math.round(py/2)*2,born:now-delta*(1-offset/distance),kind,
                            heading:heading.join(','),path,travelled:start+offset});this.triggers++;
                        if(this.marks.length>FOOTPRINT_LIMIT)this.marks.shift();
                    }
                    offset+=spacing;
                }
            }
        }
        for(const id of this.actors.keys())if(!seen.has(id))this.actors.delete(id);
    }
    draw(target,image,map,actors,now,motion=true){
        if(this.destroyed||!Number.isFinite(now))return;
        if(!motion||!this.hasGround(map)){this.suspend();return;}
        if(this.source!==image||this.map!==map||!this.canvas)this.prepare(image,map);
        if(!this.context)return;
        if(now<this.lastTime){this.marks=[];this.actors.clear();}
        this.observe(actors,now);
        if(!this.marks.length&&!this.paintedPixels)return;
        if(now-this.lastTime>=FRAME_MS||now<this.lastTime){
            this.lastTime=now;this.marks=this.marks.filter(m=>footprintOpacity(now,m.born,(m.path?.distance||0)-(m.travelled||0))>0);
            // Clear only the previously painted pixels. A short trail touches
            // hundreds of pixels, not the entire 143,360-pixel map.
            let minX=SOURCE_W,minY=SOURCE_H,maxX=-1,maxY=-1;
            const include=i=>{const x=i%SOURCE_W,y=Math.floor(i/SOURCE_W);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);};
            for(const i of this.dirty){this.depth[i]=0;this.rim[i]=0;this.framePixels[i]=0;include(i);}
            this.dirty=[];this.paintedPixels=0;
            for(const mark of this.marks){
                const alpha=footprintOpacity(now,mark.born,(mark.path?.distance||0)-(mark.travelled||0)),cx=mark.x/2,cy=mark.y/2;
                const brush=mark.kind==='step'?SOLES[mark.heading]:SCUFF;
                for(const point of brush){
                    const x=cx+point.dx,y=cy+point.dy;
                    if(x<0||y<0||x>=SOURCE_W||y>=SOURCE_H)continue;
                    const i=y*SOURCE_W+x;if(!this.mask[i])continue;
                    const fleck=(Math.imul(x,73856093)^Math.imul(y,19349663))>>>0;
                    const grain=.68+(fleck%8)*.04;
                    const untouched=!this.depth[i]&&!this.rim[i];
                    if(point.core)this.depth[i]=Math.max(this.depth[i],Math.round(alpha*point.core*grain));
                    else if(fleck%5<3)this.rim[i]=Math.max(this.rim[i],Math.round(alpha*point.rim*grain));
                    if(untouched&&(this.depth[i]||this.rim[i]))this.dirty.push(i);
                }
            }
            for(const i of this.dirty){
                include(i);
                const alpha=this.depth[i]||this.rim[i];if(!alpha)continue;
                const pixel=i*4,bank=!this.depth[i],data=this.frame.data;
                const color=bank?this.surface.rim:this.surface.core;
                data[pixel]=color[0];data[pixel+1]=color[1];data[pixel+2]=color[2];data[pixel+3]=Math.round(alpha*(this.surface.opacity||1));this.paintedPixels++;
            }
            if(maxX>=minX)this.context.putImageData(this.frame,0,0,minX,minY,maxX-minX+1,maxY-minY+1);
            this.frames++;
        }
        if(this.marks.length)target.drawImage(this.canvas,0,0,WIDTH,HEIGHT);
    }
    suspend(){
        this.actors.clear();this.marks=[];
        if(this.canvas){this.canvas.width=0;this.canvas.height=0;}
        this.canvas=null;this.context=null;this.mask=null;this.frame=null;this.framePixels=null;this.dirty=[];this.depth=null;this.rim=null;this.source=null;this.map=null;this.lastTime=-Infinity;this.paintedPixels=0;
    }
    destroy(){this.suspend();this.destroyed=true;}
}

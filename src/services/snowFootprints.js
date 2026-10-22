import ground from '../data/snowGround.js';

const SOURCE_W=448,SOURCE_H=320,WIDTH=896,HEIGHT=640,FRAME_MS=1000/30;
export const FOOTPRINT_LIFETIME=3200,FOOTPRINT_LIMIT=192;
const STEP=14,MAX_ACTORS=64;
// Only the three authored snow-floor colours: paving, water, grass blades,
// shadows and roof snow are not writable, even in a walkable mixed tile.
const SNOW=new Set(['217,230,233','214,218,228','209,211,219']);
const SOLE=[[0,-3],[1,-3],[-1,-2],[0,-2],[1,-2],[-1,-1],[0,-1],[1,-1],[0,0],[1,0],[0,2],[1,2]];
export function hasSnowGround(map){return Object.prototype.hasOwnProperty.call(ground,map);}
export function footprintOpacity(now,born){
    const age=now-born;
    return age<0||age>=FOOTPRINT_LIFETIME?0:.48*Math.pow(1-Math.max(0,age-650)/(FOOTPRINT_LIFETIME-650),1.25);
}

export class SnowFootprintsRenderer{
    constructor(createCanvas=()=>document.createElement('canvas')){
        this.createCanvas=createCanvas;this.actors=new Map();this.marks=[];this.frames=0;this.triggers=0;this.destroyed=false;this.lastTime=-Infinity;
    }
    prepare(image,map){
        this.suspend();
        if(this.destroyed||!hasSnowGround(map))return;
        let sample;
        try{
            sample=this.createCanvas();sample.width=SOURCE_W;sample.height=SOURCE_H;
            const c=sample.getContext('2d',{willReadFrequently:true});c.imageSmoothingEnabled=false;c.drawImage(image,0,0,SOURCE_W,SOURCE_H);
            const data=c.getImageData(0,0,SOURCE_W,SOURCE_H).data;
            this.mask=new Uint8Array(SOURCE_W*SOURCE_H);
            for(let y=0;y<SOURCE_H;y++)for(let x=0;x<SOURCE_W;x++){
                const i=y*SOURCE_W+x,cell=ground[map][Math.floor(y/16)][Math.floor(x/16)];
                if(cell==='1'&&data[i*4+3]===255&&SNOW.has(`${data[i*4]},${data[i*4+1]},${data[i*4+2]}`))this.mask[i]=1;
            }
            this.canvas=this.createCanvas();this.canvas.width=WIDTH;this.canvas.height=HEIGHT;
            this.context=this.canvas.getContext('2d');if(!this.context)throw Error('Canvas unavailable');
            this.source=image;this.map=map;
        }catch(_){this.suspend();}
        finally{if(sample){sample.width=0;sample.height=0;}}
    }
    onSnow(x,y){
        return x>=0&&y>=0&&x<WIDTH&&y<HEIGHT&&Boolean(this.mask?.[Math.floor(y/2)*SOURCE_W+Math.floor(x/2)]);
    }
    observe(actors,now){
        const seen=new Set();
        for(const actor of actors.slice(0,MAX_ACTORS)){
            const {id,x,y}=actor;if(!id||!Number.isFinite(x)||!Number.isFinite(y))continue;seen.add(id);
            const old=this.actors.get(id),distance=old?Math.hypot(x-old.x,y-old.y):0,delta=old?now-old.time:0;
            const valid=old&&delta>0&&delta<250&&distance<=48&&distance<=Math.max(12,delta*.6);
            const state={x,y,time:now,travel:valid?old.travel:0,foot:valid?old.foot:1};
            this.actors.set(id,state);
            if(!valid||distance<.001)continue;
            const dx=(x-old.x)/distance,dy=(y-old.y)/distance;
            let offset=STEP-state.travel;
            while(offset<=distance){
                // Alternating shoes, placed on the real world floor, not in
                // screen space. Turning and camera movement cannot drag them.
                const px=old.x+dx*offset-dy*state.foot*5,py=old.y+dy*offset+dx*state.foot*5;
                if(this.onSnow(px,py)){
                    this.marks.push({x:Math.round(px/2)*2,y:Math.round(py/2)*2,dx:Math.abs(dx)>Math.abs(dy)?Math.sign(dx):0,dy:Math.abs(dx)>Math.abs(dy)?0:Math.sign(dy),born:now});this.triggers++;
                    if(this.marks.length>FOOTPRINT_LIMIT)this.marks.shift();
                }
                state.foot*=-1;offset+=STEP;
            }
            state.travel=(state.travel+distance)%STEP;
        }
        for(const id of this.actors.keys())if(!seen.has(id))this.actors.delete(id);
    }
    draw(target,image,map,actors,now,motion=true){
        if(this.destroyed||!Number.isFinite(now))return;
        if(!motion||!hasSnowGround(map)){this.suspend();return;}
        if(this.source!==image||this.map!==map||!this.canvas)this.prepare(image,map);
        if(!this.context)return;
        if(now<this.lastTime){this.marks=[];this.actors.clear();}
        this.observe(actors,now);
        if(!this.marks.length&&!this.paintedPixels)return;
        if(now-this.lastTime>=FRAME_MS||now<this.lastTime){
            this.lastTime=now;this.marks=this.marks.filter(m=>footprintOpacity(now,m.born)>0);
            const c=this.context;c.clearRect(0,0,WIDTH,HEIGHT);this.paintedPixels=0;
            for(const mark of this.marks){
                const alpha=footprintOpacity(now,mark.born);
                for(const [side,forward]of SOLE){
                    const x=mark.x+(-mark.dy*side-mark.dx*forward)*2,y=mark.y+(mark.dx*side-mark.dy*forward)*2;
                    if(!this.onSnow(x,y))continue;
                    c.fillStyle=forward===-3?`rgba(250,254,255,${alpha*.85})`:`rgba(80,112,139,${alpha})`;
                    c.fillRect(x,y,2,2);this.paintedPixels++;
                }
            }
            this.frames++;
        }
        if(this.marks.length)target.drawImage(this.canvas,0,0,WIDTH,HEIGHT);
    }
    suspend(){
        this.actors.clear();this.marks=[];
        if(this.canvas){this.canvas.width=0;this.canvas.height=0;}
        this.canvas=null;this.context=null;this.mask=null;this.source=null;this.map=null;this.lastTime=-Infinity;this.paintedPixels=0;
    }
    destroy(){this.suspend();this.destroyed=true;}
}

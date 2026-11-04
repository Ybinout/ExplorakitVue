// Small, disjoint procedural decorations. Never cache a whole map or actors.
// Rasterize at least at the camera's backing scale, not at CSS resolution.
export class DecorationPatch {
  constructor(createCanvas,bounds,ratio,paint) {
    this.bounds=bounds;this.paint=paint;this.key=null;
    this.canvas=createCanvas();this.canvas.width=Math.ceil(bounds.width*ratio);this.canvas.height=Math.ceil(bounds.height*ratio);
    this.context=this.canvas.getContext('2d');this.ratio=ratio;
  }
  draw(target,key) {
    if(!this.context)return;
    if(this.key!==key){
      const c=this.context,b=this.bounds;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,this.canvas.width,this.canvas.height);
      c.save();c.setTransform(this.ratio,0,0,this.ratio,-b.x*this.ratio,-b.y*this.ratio);
      this.paint(c,key);c.restore();this.key=key;
    }
    const b=this.bounds;
    target.drawImage(this.canvas,0,0,b.width*this.ratio,b.height*this.ratio,b.x,b.y,b.width,b.height);
  }
  release(){this.canvas.width=this.canvas.height=0;this.context=null;this.paint=null;}
}

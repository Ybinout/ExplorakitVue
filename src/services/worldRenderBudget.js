// Keep maximum detail on fast devices. Lower only the mobile canvas backing
// resolution when sustained walking cannot meet the frame budget; UI stays CSS.
export class WorldRenderBudget {
  constructor(ratio=2){this.maximum=Math.max(1,Math.min(2,ratio));this.ratio=this.maximum;this.reset();}
  reset(now=null,keepHeadroom=false){if(!keepHeadroom){this.headroomSince=null;this.lastWalkingAt=null;}this.started=now;this.count=0;this.cost=0;this.slow=0;}
  observe(now,cost,delta,{mobile=false,walking=false}={}){
    if(!mobile){this.reset(now);return false;}
    if(!walking){if(this.lastWalkingAt===null||now-this.lastWalkingAt>500)this.reset(now);return false;}
    this.lastWalkingAt=now;
    if(this.started===null||now<this.started){this.reset(now);return false;}
    if(!Number.isFinite(cost)||!Number.isFinite(delta))return false;
    this.count++;this.cost+=Math.max(0,cost);if(delta>24)this.slow++;
    if(now-this.started<1100||this.count<12)return false;
    const average=this.cost/this.count,slow=this.slow/this.count,overloaded=average>8||slow>.25;
    this.reset(now,true);
    if(overloaded){this.headroomSince=null;if(this.ratio<=1)return false;this.ratio=this.ratio>1.5?1.5:1;return true;}
    if(this.ratio<this.maximum&&average<3&&slow<.05){
      this.headroomSince??=now;
      if(now-this.headroomSince>=10000){this.ratio=Math.min(this.maximum,this.ratio+.5);this.headroomSince=null;return true;}
    }else this.headroomSince=null;
    return false;
  }
}

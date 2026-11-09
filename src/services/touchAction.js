// Recognize two deliberate, stationary touches on the world only. No timer or
// global event listener: the existing world gesture handlers own pointer capture.
export class TouchAction {
  constructor() { this.reset(); }
  reset() { this.active = null; this.previous = null; }
  start(e, context, allowed = true) {
    if (!allowed || e.pointerType !== 'touch' || e.isPrimary === false || this.active) {
      this.reset(); return;
    }
    this.active = { id:e.pointerId, x:e.clientX, y:e.clientY, at:e.timeStamp, context, moved:false };
  }
  move(e) {
    const p=this.active;
    if (p?.id===e.pointerId && Math.hypot(e.clientX-p.x,e.clientY-p.y)>=8) p.moved=true;
  }
  end(e, context, allowed = true) {
    const p=this.active;
    // A normal pointerup releases capture and subsequently emits lostcapture.
    // That second event must not erase the first tap of the pair.
    if (!p || p.id!==e.pointerId) return false;
    this.move(e); this.active=null;
    if (e.type!=='pointerup' || !allowed || p.moved || p.context!==context || e.timeStamp-p.at>280) {
      this.previous=null; return false;
    }
    const last=this.previous;
    if (last && last.context===context && p.at-last.at>=0 && p.at-last.at<=320 && Math.hypot(p.x-last.x,p.y-last.y)<=28) {
      this.previous=null; return true;
    }
    this.previous={...p,at:e.timeStamp}; return false;
  }
}

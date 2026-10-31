import { BattleAudio } from './battleAudio.js';

// World confirmations share the small Web Audio engine and the master volume.
// A late server response must never unlock or queue audio on its own.
export class GameFeedbackAudio extends BattleAudio {
  play(kind) {
    if (!this.ready()) return;
    if (kind === 'notification') {
      // Mix quietly with an ongoing heal/unique-item jingle; never cut it off.
      this.tone(880, .10, { type:'triangle', volume:.16 });
      this.tone(1175, .14, { delay:.08, type:'triangle', volume:.11 });
      return;
    }
    this.stop();
    if(kind==='unique'){[523,659,784,1047,1319].forEach((note,index)=>this.tone(note,.22,{delay:index*.1,volume:.14}));}
    else if (kind === 'heal') {
      [523, 659, 784, 1047].forEach((note, index) => this.tone(note, 0.16, { delay: index * 0.085, volume: 0.16 }));
    } else if (kind === 'pc') {
      this.tone(660, 0.09, { type: 'triangle', volume: 0.14 });
      this.tone(990, 0.13, { delay: 0.085, type: 'triangle', volume: 0.12 });
    }
  }
}

// Reorders, initial loading, level-up HP gains and new moves are not healing.
export function teamWasRestored(previous = [], next = []) {
  const known = new Map(previous.filter(p => p?.uuid).map(p => [p.uuid, p]));
  return next.some(p => {
    const old = known.get(p?.uuid);
    if (!old) return false;
    if (Number(p.maxHp) === Number(old.maxHp) && Number(p.currentHp) > Number(old.currentHp)) return true;
    if (old.status && !p.status) return true;
    return (p.abilities || []).some((move, index) => move === old.abilities?.[index]
      && Number(p.movePp?.[index]) > Number(old.movePp?.[index]));
  });
}

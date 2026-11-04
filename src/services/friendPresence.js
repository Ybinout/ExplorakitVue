export function presenceLabel(person,connected=true){return !connected||!person?.online?'Hors ligne':person.afk?'AFK':'En ligne';}
export function sessionDuration(person,now){if(!person?.online||!Number.isFinite(person.connectedSince))return '';const minutes=Math.max(0,Math.floor((now-person.connectedSince)/60000));return minutes<1?'Connecté depuis moins d’une minute':minutes<60?`Connecté depuis ${minutes} min`:`Connecté depuis ${Math.floor(minutes/60)} h ${String(minutes%60).padStart(2,'0')} min`;}
// One small cached label per friend/status. Drawing never measures text or sorts
// the contact list each frame; positions reuse the world's interpolation.
export class FriendTagRenderer{
 constructor(){this.labels=new Map();}
 draw(c,position,person){const key=person.username+':'+Boolean(person.afk);let label=this.labels.get(key);if(!label){if(this.labels.size>40)this.labels.clear();const canvas=document.createElement('canvas'),x=canvas.getContext('2d'),name=String(person.username||'Ami').slice(0,20);x.font='bold 10px Arial';canvas.width=Math.ceil(x.measureText(name).width)+25;canvas.height=18;x.font='bold 10px Arial';x.fillStyle='rgba(16,35,46,.86)';x.beginPath();x.roundRect(0,0,canvas.width,18,5);x.fill();x.fillStyle=person.afk?'#efad48':'#77d9ac';x.beginPath();x.arc(8,9,3,0,Math.PI*2);x.fill();x.fillStyle='#f2f8fc';x.fillText(name,15,12);label=canvas;this.labels.set(key,label);}c.drawImage(label,Math.round(position.x-label.width/2),Math.round(position.y-58));}
 clear(){this.labels.clear();}
}

// Public native outcomes drive the visual plan, including friendly fire and mixed immunities.
const live=p=>p&&p.currentHp>0&&!p.withdrawn;
export function raidMovePlan(events, index, frame) {
  const move=events[index], outcomes=[];
  for(let n=index+1;n<events.length&&!['move','upkeep','turn'].includes(events[n].kind);n++)outcomes.push(events[n]);
  const results=new Map(),add=slot=>{if(slot!==null&&slot!==undefined&&!results.has(slot))results.set(slot,{slot,connected:true,hits:0,critical:false});};
  if(['allAdjacent','allAdjacentFoes','all','allies','allySide','allyTeam'].includes(move.moveTarget)){
    if(move.slot===4){if(!['allies','allySide','allyTeam'].includes(move.moveTarget))frame.allies.forEach((p,i)=>{if(live(p))add(i);});else add(4);}
    else {
      if(['allAdjacent','all','allies','allySide','allyTeam'].includes(move.moveTarget))frame.allies.forEach((p,i)=>{if(live(p)&&(i!==move.slot||['all','allies','allySide','allyTeam'].includes(move.moveTarget)))add(i);});
      if(!['allies','allySide','allyTeam'].includes(move.moveTarget)&&live(frame.boss))add(4);
    }
  }else add(move.target??move.slot);
  const prepared=outcomes.some(e=>e.kind==='-prepare'&&e.slot===move.slot),failed=outcomes.some(e=>e.kind==='-fail'&&e.slot===move.slot);
  for(const e of outcomes){
    if(e.kind==='-damage'&&e.direct!==false||e.kind==='shieldHit'||e.kind==='-heal'&&move.damageClass==='status')add(e.slot);
    const target=results.get(e.kind==='-miss'?e.target:e.slot);if(!target)continue;
    if(['-immune','-miss'].includes(e.kind)||e.kind==='-activate'&&/Protect|Wide Guard|Mat Block|Quick Guard/.test(e.effect||''))target.connected=false;
    if(e.kind==='-crit')target.critical=true;
    if(e.kind==='-damage'&&e.direct!==false)target.hits++;
  }
  if(prepared||failed)for(const t of results.values())t.connected=false;
  return {targets:[...results.values()],prepared,failed};
}
export const EFFECT_DETAILS={
 tailwind:'Vitesse ×2 pour tous les alliés',reflect:'Dégâts physiques réduits',lightscreen:'Dégâts spéciaux réduits',auroraveil:'Dégâts physiques et spéciaux réduits',safeguard:'Protège des altérations de statut',mist:'Protège des baisses de statistiques',luckychant:'Protège des coups critiques',wideguard:'Protège des attaques de zone',quickguard:'Protège des attaques prioritaires',trickroom:'Les Pokémon les plus lents agissent en premier',wonderroom:'Défense et Déf. Spé. échangées',magicroom:'Objets tenus neutralisés',gravity:'Gravité renforcée',electricterrain:'Attaques Électrik renforcées au sol',grassyterrain:'Soin au sol et attaques Plante renforcées',mistyterrain:'Protection contre les statuts au sol',psychicterrain:'Attaques Psy renforcées au sol'
};

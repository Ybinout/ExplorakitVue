// Presentation only: stages and effects are read from the authoritative combat state.
const STATS = {
  attack:['ATQ','Attaque'], defense:['DÉF','Défense'], specialAttack:['ATQ S','Attaque spéciale'],
  specialDefense:['DÉF S','Défense spéciale'], speed:['VIT','Vitesse'],
  accuracy:['PRÉ','Précision'], evasion:['ESQ','Esquive'], critical:['CRIT','Taux critique']
};
const CONDITIONS = {
  confusionTurns:['Confusion','status','?'], infatuationTurns:['Attraction','status','♥'],
  trappedTurns:['Piégé','status','⌁'], tauntTurns:['Provocation','status','!'],
  disableTurns:['Entrave','status','!'], encoreTurns:['Encore','status','!'],
  leechSeedSource:['Vampigraine','status','✿'], curseSource:['Malédiction','status','✦'],
  protect:['Protection','shield','◇'], endure:['Ténacité','shield','◇'],
  substituteHp:['Clone','shield','◇'], chargeMove:['Charge','charge','✦'],
  aquaRing:['Anneau Hydro','heal','+'], ingrain:['Racines','heal','+'],
  magnetRiseTurns:['Lévitation','charge','↑'], healBlockTurns:['Anti-Soin','status','!']
};
const AILMENTS = { burn:'Brûlure', poison:'Poison', badly_poison:'Poison grave', paralyze:'Paralysie', sleep:'Sommeil', freeze:'Gel' };
function stage(pokemon,key) { return Math.max(-6,Math.min(6,Math.trunc(Number(pokemon?.__battle?.statStages?.[key]) || 0))); }
export function battleConditions(pokemon) {
  const result = [];
  for (const [key,[short,name]] of Object.entries(STATS)) {
    const value = stage(pokemon,key);
    if (!value) continue;
    const base = ['accuracy','evasion'].includes(key) ? 3 : 2;
    const factor = (value > 0 ? (base+value)/base : base/(base-value)).toLocaleString('fr',{maximumFractionDigits:2});
    result.push({key,kind:value>0?'up':'down',text:`${short} ${value>0?'+':''}${value}`,title:`${name} : ${value>0?'+':''}${value} cran(s)${key==='critical'?'':` · multiplicateur de palier ×${factor}`}`});
  }
  for (const [key,[text,kind]] of Object.entries(CONDITIONS)) {
    if (pokemon?.__battle?.[key]) result.push({key,kind,text,title:text});
  }
  return result;
}
export function battleConditionChanges(previous,next) {
  // Switching/reconnecting must not replay another Pokémon's effects or claim a cure.
  if (!previous?.uuid || previous.uuid !== next?.uuid || Number(next.currentHp)<=0) return [];
  const changes=[];
  if ((previous.__battle?.formSpriteId || previous.data?.id) !== (next.__battle?.formSpriteId || next.data?.id)
      && (previous.data?.id===351 || next.data?.id===351)) {
    changes.push({key:'weatherForm',kind:'charge',symbol:'✦',text:next.__battle?.formLabel || 'Forme Normale'});
  }
  for (const [key,[short]] of Object.entries(STATS)) {
    const delta=stage(next,key)-stage(previous,key);
    if(delta) changes.push({key,kind:delta>0?'up':'down',symbol:delta>0?'↑':'↓',text:`${short} ${delta>0?'+':''}${delta}`});
  }
  if(previous.status!==next.status) {
    if(AILMENTS[next.status]) changes.push({key:'ailment',kind:'status',symbol:'!',text:AILMENTS[next.status]});
    else if(AILMENTS[previous.status]) changes.push({key:'ailment',kind:'cure',symbol:'+',text:'Statut soigné'});
  }
  for(const [key,[text,kind,symbol]] of Object.entries(CONDITIONS)) {
    const was=Boolean(previous.__battle?.[key]), now=Boolean(next.__battle?.[key]);
    if(!was&&now) changes.push({key,kind,symbol,text});
    else if(was&&!now&&['substituteHp','confusionTurns','leechSeedSource'].includes(key)) {
      changes.push({key,kind:key==='substituteHp'?'break':'cure',symbol:key==='substituteHp'?'◇':'+',text:key==='substituteHp'?'Clone brisé':`${text} terminé`});
    }
  }
  return changes;
}

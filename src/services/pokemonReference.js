// Accept both the active team's model and the PC's read-only summary. The
// catalog is display-only; opening a sheet never changes moves or their PP.
export function createPokemonReference(catalog) {
  const moves=new Map(Object.entries(catalog.moves).map(([name,value])=>[name.toLowerCase(),value]));
  const abilities=new Map(Object.entries(catalog.abilities).map(([name,value])=>[name.toLowerCase(),value]));
  return {
    abilityDescription(name) { return abilities.get(String(name||'').trim().toLowerCase()) || (name ? 'Description de ce talent indisponible.' : 'Aucun talent renseigné.'); },
    moves(pokemon) {
      const details=Array.isArray(pokemon.moveDetails)?pokemon.moveDetails:[];
      const learned=Array.isArray(pokemon.abilities)?pokemon.abilities:Array.isArray(pokemon.moves)?pokemon.moves:details.map(m=>m.name);
      return learned.slice(0,4).map((name,index)=>{
        const key=String(name).trim().toLowerCase(),definition=moves.get(key) || {};
        const actual=details.find((d,i)=>i===index&&d.name?.toLowerCase()===String(name).toLowerCase()) || {};
        const fixed={'dragon rage':40,'sonic boom':20},levelBased=['night shade','seismic toss'].includes(key);
        const power=actual.power??definition.power??null,category=actual.damageClass||definition.category;
        const fixedDamage=fixed[key]??(levelBased?Number(pokemon.level)||null:null);
        const maxPp=actual.maxPp??definition.pp??null;
        return {name,type:actual.type||definition.type||null,damageClass:category,power,
          powerLabel:fixedDamage!=null?`${fixedDamage} PV`:power>0?String(power):!category||category==='status'?'—':definition.powerKind==='ohko'?'K.O.':'Variable',
          fixedDamage:fixedDamage!=null,accuracy:actual.accuracy??definition.accuracy??null,
          pp:pokemon.movePp?.[index]??actual.pp??definition.pp??null,maxPp:pokemon.__battle?.transformed&&maxPp!=null?Math.min(5,maxPp):maxPp,
          description:definition.description||'Description de cette capacité indisponible.'};
      });
    }
  };
}

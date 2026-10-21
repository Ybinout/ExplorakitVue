// Native canvas pixel art: no interpolation, transparent sheet or external loading.
export function drawPokemonComputers(context, state, map) {
  if(state?.map!==map)return;
  for(const device of state.devices || []){
    if(device.kind!=='pc')continue;
    context.save();context.translate(device.x*32,device.y*32-16);
    const rect=(color,x,y,w,h)=>{context.fillStyle=color;context.fillRect(x,y,w,h);};
    rect('#343e58',2,2,28,44);rect('#687c96',4,4,24,40);rect('#b9d3df',4,4,24,3);
    rect('#26384f',6,8,20,20);rect('#83cee0',8,10,16,14);rect('#c8f0e5',10,12,12,2);
    rect('#336986',11,17,10,2);rect('#336986',15,14,2,8);rect('#e0ebed',6,30,20,8);
    rect('#52677e',8,32,3,2);rect('#52677e',13,32,3,2);rect('#52677e',18,32,3,2);
    rect('#334d68',7,39,18,3);rect('#7be3b0',23,40,2,2);rect('#26384f',4,44,5,3);rect('#26384f',23,44,5,3);
    context.restore();
  }
}

// Adapt the private PC snapshot to the shared companion sheet without changing owned data.
export function computerPokemonDetails(pokemon) {
  if(!pokemon)return null;
  return {...pokemon, ...pokemon.stats, spriteId:pokemon.pokemonId,
    name:pokemon.nickname && pokemon.nickname!=='test'?pokemon.nickname:pokemon.name,
    truename:pokemon.name, k:pokemon.potential,
    data:{id:pokemon.pokemonId,type:[...(pokemon.types || [])]},
    abilities:[...(pokemon.moves || [])],movePp:[...(pokemon.movePp || [])]};
}

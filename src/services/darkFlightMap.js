// Only the two existing, server-authorized landing points belong on the atlas.
// Keep the jungle routes hidden and never reveal an unvisited continent.
export function darkFlightNodes(atlas,flight) {
  if(!flight?.unlocked||flight.owned===false||!flight.darkAerial?.active)return [];
  return ['jungle1','DC2_44'].filter(id=>flight.darkDestinations?.includes(id))
    .map(id=>atlas?.nodes?.find(n=>n.id===id)).filter(Boolean)
    .map(node=>({...node,kind:'flight'}));
}

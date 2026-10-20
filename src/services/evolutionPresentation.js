// Presentation only: conditions and mutations remain authoritative on the server.
export function createEvolutionTracker({ edges, names }) {
  const next = new Map(), known = new Map(), shown = new Set();
  for (const [from, to] of edges) next.set(from, [...(next.get(from) || []), to]);
  function path(from, to, seen = new Set()) {
    if (from === to) return [];
    if (seen.has(from)) return null;
    const visited = new Set([...seen, from]);
    for (const id of next.get(from) || []) {
      const rest = path(id, to, visited);
      if (rest) return [[from, id], ...rest];
    }
    return null;
  }
  return {
    observe(team) {
      const events = [];
      for (const pokemon of team) {
        const uuid = pokemon?.uuid, id = Number(pokemon?.data?.id ?? pokemon?.pokemon_id ?? pokemon?.spriteId);
        if (!uuid || !Number.isInteger(id) || id < 1) continue;
        const previous = known.get(uuid);
        // A new companion or initial load establishes a baseline, never an evolution.
        if (!previous) { known.set(uuid, { id, name: pokemon.name }); continue; }
        if (previous.id === id) continue;
        // Ignore stale reverse snapshots and non-permanent changes/forms.
        const steps = path(previous.id, id);
        if (!steps?.length) continue;
        for (const [from, to] of steps) {
          const key = `${uuid}:${from}:${to}`;
          if (shown.has(key)) continue;
          shown.add(key);
          events.push({ key, uuid, from, to, fromName: names[from] || previous.name || 'Ton Pokémon', toName: names[to] || pokemon.name || 'Ton Pokémon' });
        }
        known.set(uuid, { id, name: pokemon.name });
      }
      return events;
    }
  };
}

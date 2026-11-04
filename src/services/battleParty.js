// The boolean row stays compatible with old packets. Conditions are optional.
export function opponentPartyStates(payload = {}) {
  const legacy = payload.opponentParty;
  if (!Array.isArray(legacy) || !legacy.length || !legacy.every(value => typeof value === 'boolean')) return null;
  const states = payload.opponentPartyStates;
  const limit = payload.partyLimit === 12 ? 12 : 6;
  if (Array.isArray(states) && states.length === legacy.length &&
      states.every((state, i) => ['ready', 'hurt', 'ko'].includes(state) && (state !== 'ko') === legacy[i])) return states.slice(0, limit);
  return legacy.slice(0, limit).map(alive => alive ? 'ready' : 'ko');
}

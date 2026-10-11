const outcomes = new Set(['victory', 'defeat', 'captured', 'fled', 'draw', 'interrupted']);
const interruptions = new Set(['timer', 'closed', 'interrupted', 'error', 'action_timeout', 'timeout', 'socket_missing', 'player_disconnected', 'disconnect', 'both_disconnected', 'invalid_team', 'invalid_players', 'missing_player']);

// Existing servers already send the outcome fields. The richer summary is
// optional so that deploying a new client never hides the result of a battle.
export function buildBattleResult(payload = {}, mode = 'adventure') {
  const data = payload && typeof payload === 'object' ? payload : {};
  const summary = data.summary || {};
  let outcome = summary.outcome;
  if (!outcomes.has(outcome)) {
    if (data.captured || data.reason === 'captured') outcome = 'captured';
    else if (data.interrupted || interruptions.has(data.reason)) outcome = 'interrupted';
    else if (data.draw || ['draw', 'both_fled'].includes(data.reason)) outcome = 'draw';
    else if (data.playerWon === true || data.reason === 'victory') outcome = 'victory';
    else if (data.fled || data.reason === 'fled') outcome = 'fled';
    else if (data.playerWon === false || ['defeat', 'forfeit', 'finished'].includes(data.reason)) outcome = 'defeat';
    else outcome = 'interrupted';
  }
  return {
    outcome, mode, reason: data.reason || '', battleType: data.battleType || '',
    experience: Array.isArray(summary.experience) ? summary.experience.filter(entry => entry && Number(entry.xpGained) > 0) : [],
    money: Number.isFinite(Number(summary.money)) ? Math.max(0, Number(summary.money)) : 0,
    loot: Array.isArray(summary.loot) ? summary.loot.filter(item => typeof item === 'string' && item) : [],
    capturedPokemon: outcome === 'captured' ? summary.capturedPokemon || null : null,
    lostPokemon: Array.isArray(summary.lostPokemon) ? summary.lostPokemon : [],
    recoveryMessage: ''
  };
}

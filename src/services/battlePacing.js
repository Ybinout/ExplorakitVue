// Presentation only. No simulation, decision deadline or network timer is changed.
export const BATTLE_PACING = Object.freeze({
  actionPause: 160, status: 960, residual: 1040, damage: 820, result: 900,
  field: 900, drain: 620, hitGap: 170, moveReadMin: 1700, moveReadMax: 2600
});

export function battleReadingTime(message, {move = false, hidden = false} = {}) {
  if (hidden || !String(message || '').trim()) return 0;
  const length = Array.from(String(message)).length;
  return move ? Math.min(BATTLE_PACING.moveReadMax, Math.max(BATTLE_PACING.moveReadMin, length * 30))
    : Math.min(2200, Math.max(920, 500 + length * 23));
}

export function pacedMovePhases(phases) {
  const stretch = (ms, extra) => Math.round(Number(ms) * 1.1 + extra);
  return {windupMs:stretch(phases.windupMs, 25), travelMs:stretch(phases.travelMs, 35), impactMs:stretch(phases.impactMs, 45)};
}

export function nativeEventPause(event, status = null) {
  if (status) return BATTLE_PACING.status;
  if (['-damage','-heal'].includes(event.kind)) return event.direct === false ? BATTLE_PACING.residual : BATTLE_PACING.damage;
  if (['-sidestart','-sideend','-fieldstart','-fieldend','-weather'].includes(event.kind)) return BATTLE_PACING.field;
  return event.message ? battleReadingTime(event.message) : 0;
}

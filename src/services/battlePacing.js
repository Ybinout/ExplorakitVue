import {statusEffectDuration} from './battleStatusVisuals.js';
// Presentation only. No simulation, decision deadline or network timer is changed.
export const BATTLE_PACING = Object.freeze({
  actionPause: 95, status: 860, residual: 800, damage: 620, result: 680,
  field: 700, drain: 520, hitGap: 150, moveReadMin: 1150, moveReadMax: 1800
});

export function battleReadingTime(message, {move = false, hidden = false} = {}) {
  if (hidden || !String(message || '').trim()) return 0;
  const length = Array.from(String(message)).length;
  return move ? Math.min(BATTLE_PACING.moveReadMax, Math.max(BATTLE_PACING.moveReadMin, length * 24))
    : Math.min(1550, Math.max(650, 320 + length * 18));
}

export function pacedMovePhases(phases) {
  const stretch = (ms, extra) => Math.round(Number(ms) * 1.04 + extra);
  return {windupMs:stretch(phases.windupMs, 15), travelMs:stretch(phases.travelMs, 20), impactMs:stretch(phases.impactMs, 25)};
}

export function nativeEventPause(event, status = null) {
  if (status) return statusEffectDuration(status);
  if (['-damage','-heal'].includes(event.kind)) return event.direct === false ? BATTLE_PACING.residual : BATTLE_PACING.damage;
  if (['-sidestart','-sideend','-fieldstart','-fieldend','-weather'].includes(event.kind)) return BATTLE_PACING.field;
  return event.message ? battleReadingTime(event.message) : 0;
}

import availability from '../../../data/game/modeAvailability.json';

export function isModeAvailable(mode) {
  return mode === 'adventure' || (['rift', 'colosseum'].includes(mode) && availability.expeditionsAvailable);
}

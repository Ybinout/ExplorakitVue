// One pass, longest name first: Thunder Wave must never become Fatal-Foudre Wave.
// Internal identifiers, learnsets and save data remain untouched.
export function createBattleTextLocalizer(names) {
  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const choices = Object.keys(names).sort((a,b) => b.length-a.length).map(escape);
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${choices.join('|')})(?![\\p{L}\\p{N}_])`, 'gu');
  return (text, language = 'fr') => language === 'en' ? String(text || '')
    : String(text || '').replace(pattern, name => names[name] || name);
}

export function trainerSpeechDuration(text) {
  return Math.min(10000, Math.max(6000, String(text || '').length * 60));
}

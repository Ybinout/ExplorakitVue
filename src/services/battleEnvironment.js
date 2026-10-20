export function battleEnvironment(mapName, colosseum = false) {
  if (colosseum) return 'colosseum';
  return /^cave(?:\d|_|$)/i.test(String(mapName || '')) ? 'cave' : 'grass';
}

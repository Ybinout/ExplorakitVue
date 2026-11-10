// Preview only: the server validates and debits every plant atomically.
export function normalizedPlanting(berries) {
  const keys = [...berries];
  while (keys.length && keys[keys.length - 1] === null) keys.pop();
  return keys;
}
export function samePlanting(a, b) {
  return JSON.stringify(normalizedPlanting(a)) === JSON.stringify(normalizedPlanting(b));
}
export function favoritePlantings(berries, crops, selectedSlot, fill = false) {
  if (berries.length === 1) {
    const empty = crops.flatMap((crop, slot) => crop.stage === 'empty' ? [slot] : []);
    const slot = empty.includes(selectedSlot) ? selectedSlot : empty[0];
    return (fill ? empty : slot === undefined ? [] : [slot]).map(slot => ({ slot, berryKey: berries[0] }));
  }
  return berries.flatMap((berryKey, slot) => berryKey && crops[slot]?.stage === 'empty' ? [{ slot, berryKey }] : []);
}
export function canAffordPlanting(plantings, items, crystalCost) {
  if (!plantings.length) return false;
  const quantities = new Map(items.map(item => [item.key, Number(item.quantity)]));
  if ((quantities.get('crystal_shard') || 0) < crystalCost * plantings.length) return false;
  const needed = new Map();
  for (const p of plantings) needed.set(p.berryKey, (needed.get(p.berryKey) || 0) + 1);
  return [...needed].every(([key, quantity]) => (quantities.get(key) || 0) >= quantity);
}

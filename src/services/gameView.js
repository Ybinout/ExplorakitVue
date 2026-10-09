export function getBattleStatus(rawStatus) {
  if (!rawStatus) return null;
  const normalizedStatus = String(rawStatus).toLowerCase();
  const statusMap = {
    burn: { key: 'burn', code: 'BRN', label: 'Brûlure' },
    poison: { key: 'poison', code: 'PSN', label: 'Poison' },
    badly_poison: { key: 'badly_poison', code: 'TOX', label: 'Poison grave' },
    paralyze: { key: 'paralyze', code: 'PAR', label: 'Paralysie' },
    sleep: { key: 'sleep', code: 'SLP', label: 'Sommeil' },
    freeze: { key: 'freeze', code: 'FRZ', label: 'Gel' },
    confusion: { key: 'confusion', code: 'CNF', label: 'Confusion' },
    infatuation: { key: 'infatuation', code: 'INF', label: 'Attirance' }
  };
  if (normalizedStatus === 'normal') return null;
  return statusMap[normalizedStatus] || {
    key: 'other',
    code: normalizedStatus.slice(0, 3).toUpperCase(),
    label: normalizedStatus
  };
}

export function normalizeSpriteName(spriteName) {
  if (typeof spriteName !== 'string') return 'sprite.png';
  const normalized = spriteName.trim().toLowerCase();
  return /^sprite\d*\.png$/.test(normalized) ? normalized : 'sprite.png';
}

export function getSpriteOrder(spriteName) {
  const match = spriteName.match(/^sprite(\d*)\.png$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  if (!match[1]) return 1;
  const parsedIndex = Number.parseInt(match[1], 10);
  return Number.isFinite(parsedIndex) ? parsedIndex : Number.MAX_SAFE_INTEGER;
}

export function getSpriteLabel(spriteName) {
  const match = spriteName.match(/^sprite(\d*)\.png$/);
  return !match || !match[1] ? 'Sprite 1' : `Sprite ${match[1]}`;
}

export function normalizeTeamPokemon(pokemon, index) {
  const currentHpValue = Number(pokemon?.currentHp ?? pokemon?.current_hp ?? 0);
  const maxHpValue = Number((pokemon?.maxHp ?? pokemon?.max_hp ?? currentHpValue) || 1);
  const pokemonId = Number(pokemon?.data?.id ?? pokemon?.pokemon_id ?? 0) || null;
  return {
    ...pokemon,
    uuid: pokemon?.uuid || null,
    position: Number(pokemon?.position ?? index + 1),
    name: pokemon?.name || pokemon?.truename || 'Pokemon',
    level: Number(pokemon?.level ?? 1),
    heldItem: pokemon?.heldItem ?? pokemon?.held_item ?? null,
    passiveAbility: pokemon?.passiveAbility ?? pokemon?.passive_ability ?? null,
    currentHp: Number.isFinite(currentHpValue) ? Math.max(0, currentHpValue) : 0,
    maxHp: Number.isFinite(maxHpValue) ? Math.max(1, maxHpValue) : 1,
    spriteId: pokemonId
  };
}

export function getTeamHpPercent(pokemon) {
  const current = Number(pokemon?.currentHp ?? 0);
  const max = Number(pokemon?.maxHp ?? 1);
  if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
}

export function getDirectionFromAction(action) {
  return { move_z: 'up', move_q: 'left', move_s: 'down', move_d: 'right' }[action];
}

export function getDirectionFromDelta(fromX, fromY, toX, toY, fallback = 'down') {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (dx === 0 && dy === 0) return fallback;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

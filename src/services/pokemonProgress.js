export function experienceProgress(pokemon) {
  const level = Math.max(1, Number(pokemon?.level) || 1);
  const rate = Number(pokemon?.experienceRate) || Number(pokemon?.data?.exp) / 1000000 || 1;
  const start = Math.floor(rate * Math.pow(level - 1, 3));
  const end = Math.floor(rate * Math.pow(level, 3));
  const earned = Math.max(0, (Number(pokemon?.experience) || 0) - start);
  const needed = Math.max(1, end - start);
  return { earned, needed, remaining: Math.max(0, needed - earned), percent: Math.min(100, earned / needed * 100) };
}

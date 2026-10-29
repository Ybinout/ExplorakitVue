// Only actual HP loss is audible: three short, neutral damage impacts.
// Their weight follows the fraction of maximum HP lost, independently of type,
// move power, effectiveness and critical labels (already reflected in HP loss).
export function damageImpactStrength(damage, maxHp) {
  if (!Number.isFinite(damage) || !Number.isFinite(maxHp) || damage <= 0 || maxHp <= 0) return null;
  const fraction = damage / maxHp;
  return fraction >= 0.5 ? 'heavy' : fraction >= 0.2 ? 'medium' : 'light';
}

const profiles = {
  light: { frequency: 230, endFrequency: 100, duration: 0.10, volume: 0.15, noiseFrequency: 2400, noiseDuration: 0.065, noiseVolume: 0.13 },
  medium: { frequency: 170, endFrequency: 65, duration: 0.16, volume: 0.23, noiseFrequency: 1800, noiseDuration: 0.10, noiseVolume: 0.21 },
  heavy: { frequency: 115, endFrequency: 40, duration: 0.24, volume: 0.32, noiseFrequency: 1150, noiseDuration: 0.15, noiseVolume: 0.29 }
};

export function damageImpactPlan({ damage, maxHp } = {}) {
  const profile = profiles[damageImpactStrength(damage, maxHp)];
  if (!profile) return [];
  const { frequency, endFrequency, duration, volume, noiseFrequency, noiseDuration, noiseVolume } = profile;
  return [
    { kind: 'tone', type: 'triangle', frequency, endFrequency, duration, volume, attack: 0.004 },
    { kind: 'noise', filter: 'lowpass', frequency: noiseFrequency, endFrequency: noiseFrequency / 3, duration: noiseDuration, volume: noiseVolume, attack: 0.003 }
  ];
}

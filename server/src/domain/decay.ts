export function computeDecayHp(decayPctPerHr: number, healthMax: number): number {
  return (decayPctPerHr / 100) * healthMax;
}

export function computeRegionBonus(tier: string): number {
  switch (tier) {
    case 'Settlement': return 100_000;
    case 'Town': return 200_000;
    case 'City': return 400_000;
    case 'MegaCity': return 600_000;
    default: return 0;
  }
}

export function computeHealthMax(regions: Array<{ tier: string }>): number {
  const base = 1_000_000;
  return regions.reduce((acc, r) => acc + computeRegionBonus(r.tier), base);
}

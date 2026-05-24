export const CACHE_KEYS = {
  WAR_STATUS: 'helldivers:warstatus',
  PLANETS: 'helldivers:planets',
  CAMPAIGNS: 'helldivers:campaigns',
  ASSIGNMENTS: 'helldivers:assignments',
  SNAPSHOT: 'snapshot:current',
  RECOMMENDATION: 'recommendation:current',
  PLAYER_HISTORY: (planetId: number) => `playerhistory:${planetId}`,
} as const;

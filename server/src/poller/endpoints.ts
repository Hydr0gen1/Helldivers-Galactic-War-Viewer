import { z } from 'zod';

export const RegionSchema = z.object({
  name: z.string().nullable().optional(),
  faction: z.string().nullable().optional(),
  health: z.number().nullable().optional(),
  maxHealth: z.number().nullable().optional(),
  settingsHash: z.number().nullable().optional(),
  regionTier: z.number().nullable().optional(),
});

export const PlanetStatisticsSchema = z.object({
  playerCount: z.number().default(0),
}).passthrough();

export const PlanetSchema = z.object({
  index: z.number(),
  name: z.string(),
  sector: z.string().optional(),
  faction: z.string().optional(),
  players: z.number().optional(),
  statistics: PlanetStatisticsSchema.optional(),
  health: z.number().default(1000000),
  maxHealth: z.number().default(1000000),
  regenPerSecond: z.number().default(0),
  attacking: z.array(z.number()).default([]),
  waypoints: z.array(z.number()).default([]),
  active: z.boolean().default(false),
  regions: z.array(RegionSchema).default([]),
  disabled: z.boolean().default(false),
});

export const CampaignSchema = z.object({
  id: z.number(),
  planet: PlanetSchema,
  type: z.number(),
  count: z.number().default(0),
});

export const WarStatusSchema = z.object({
  started: z.string().optional(),
  warId: z.number().optional(),
  time: z.number().optional(),
  clientVersion: z.string().optional(),
  factions: z.array(z.string()).default([]),
  impactMultiplier: z.number().default(1),
  statistics: z.record(z.unknown()).optional(),
});

export const TaskSchema = z.object({
  type: z.number(),
  values: z.array(z.number()).default([]),
  valueTypes: z.array(z.number()).default([]),
});

export const RewardSchema = z.object({
  type: z.number(),
  amount: z.number(),
});

export const AssignmentSchema = z.object({
  id: z.number(),
  title: z.string().nullable().optional(),
  briefing: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  tasks: z.array(TaskSchema).default([]),
  reward: RewardSchema.optional(),
  expiration: z.string().optional(),
  progress: z.array(z.number()).default([]),
});

export type Planet = z.infer<typeof PlanetSchema>;
export type Campaign = z.infer<typeof CampaignSchema>;
export type WarStatus = z.infer<typeof WarStatusSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;

export const ENDPOINTS = {
  WAR_STATUS: '/war',
  PLANETS: '/planets',
  CAMPAIGNS: '/campaigns',
  ASSIGNMENTS: '/assignments',
} as const;

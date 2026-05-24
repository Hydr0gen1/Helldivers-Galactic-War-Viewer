import { z } from 'zod';

const CriticalAlertSchema = z.object({
  kind: z.enum(['defense_deadline', 'campaign_collapse', 'isolation', 'mo_at_risk']),
  planet: z.string(),
  headline: z.string(),
  reasoning: z.string().max(320),
  hours_remaining: z.number().nullable(),
});

const MajorOrderStatusSchema = z.object({
  active: z.boolean(),
  title: z.string().nullable(),
  progress_percent: z.number().nullable(),
  hours_remaining: z.number().nullable(),
  required_planets: z.array(z.string()),
  outlook: z.enum(['on_track', 'at_risk', 'failing', 'no_mo']),
});

const PriorityPlanetSchema = z.object({
  rank: z.number(),
  planet: z.string(),
  campaign_type: z.enum(['liberation', 'defense', 'hpc']),
  reasoning: z.string().max(320),
  action: z.enum(['concentrate_here', 'maintain', 'redeploy_from']),
});

const GambitOpportunitySchema = z.object({
  defense_planet: z.string(),
  gambit_planet: z.string(),
  viability: z.enum(['high', 'medium', 'low', 'unviable']),
  reasoning: z.string().max(320),
});

const SiegeOpportunitySchema = z.object({
  planet: z.string(),
  uncut_links: z.number(),
  reasoning: z.string().max(320),
});

export const RecommendationSchema = z.object({
  overall_war_status: z.string(),
  critical_alerts: z.array(CriticalAlertSchema),
  major_order_status: MajorOrderStatusSchema,
  priority_planets: z.array(PriorityPlanetSchema),
  gambit_opportunities: z.array(GambitOpportunitySchema),
  siege_opportunities: z.array(SiegeOpportunitySchema),
  player_distribution_warning: z.string().nullable(),
});

export type RecommendationOutput = z.infer<typeof RecommendationSchema>;

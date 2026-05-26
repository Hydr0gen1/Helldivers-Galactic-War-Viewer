import { describe, expect, it } from 'vitest';
import { parseRecommendationOutput } from '../src/analyzer/index.js';
import { recommendationHandler } from '../src/api/recommendation.js';
import { memoryStore } from '../src/cache/memoryStore.js';
import { CACHE_KEYS } from '../src/cache/keys.js';

const VALID_RECOMMENDATION = JSON.stringify({
  overall_war_status: 'stable',
  critical_alerts: [],
  major_order_status: {
    active: false,
    title: null,
    progress_percent: null,
    hours_remaining: null,
    required_planets: [],
    outlook: 'no_mo',
  },
  priority_planets: [],
  gambit_opportunities: [],
  siege_opportunities: [],
  player_distribution_warning: null,
});

describe('analyzer output parsing', () => {
  it('extracts the first complete JSON object when prose is mixed in', () => {
    const raw = `We need to analyze the WarSnapshot first.\n${VALID_RECOMMENDATION}\nDone.`;
    const parsed = parseRecommendationOutput(raw);
    expect(parsed.overall_war_status).toBe('stable');
  });

  it('parses strict JSON response directly', () => {
    const parsed = parseRecommendationOutput(VALID_RECOMMENDATION);
    expect(parsed.major_order_status.outlook).toBe('no_mo');
  });

  it('recommendation endpoint returns valid recommendation after analyzer-style parse/store', () => {
    const recommendation = parseRecommendationOutput(VALID_RECOMMENDATION);
    memoryStore.set(CACHE_KEYS.RECOMMENDATION, recommendation, 60_000);

    const status = { code: 200 };
    const responseBody: { value?: unknown } = {};
    const res = {
      status: (code: number) => {
        status.code = code;
        return res;
      },
      json: (value: unknown) => {
        responseBody.value = value;
        return res;
      },
    };

    recommendationHandler({} as never, res as never, (() => {}) as never);

    expect(status.code).toBe(200);
    expect(responseBody.value).toMatchObject({
      overall_war_status: 'stable',
      major_order_status: { outlook: 'no_mo' },
    });
  });
});

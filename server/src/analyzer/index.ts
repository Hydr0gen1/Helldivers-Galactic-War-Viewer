import { config } from '../config.js';
import { logger } from '../logger.js';
import { memoryStore } from '../cache/memoryStore.js';
import { CACHE_KEYS } from '../cache/keys.js';
import { createAiProvider } from './providers/index.js';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt.js';
import { RecommendationSchema } from './schema.js';
import { extractFirstJsonObject, repairJson } from './repair.js';
import type { WarSnapshot, Recommendation } from '../domain/types.js';

const FRESH_MS = config.ANALYZER_INTERVAL_MS;
const GRACE_MS = FRESH_MS * 2;

const seenCriticalDefenses = new Set<string>();
const aiProvider = createAiProvider();

function truncate(raw: string, limit = 400): string {
  return raw.length > limit ? `${raw.slice(0, limit)}…` : raw;
}

export function parseRecommendationOutput(raw: string): Recommendation {
  const generatedAt = new Date().toISOString();
  const parseStrict = (value: string): Recommendation =>
    ({ ...RecommendationSchema.parse(JSON.parse(value)), generatedAt });

  try {
    return parseStrict(raw);
  } catch (strictErr) {
    const extracted = extractFirstJsonObject(raw);
    if (extracted) {
      try {
        return parseStrict(extracted);
      } catch {
        // Fall through to repair path.
      }
    }

    const repaired = repairJson(extracted ?? raw);
    try {
      return parseStrict(repaired);
    } catch (repairErr) {
      throw new Error(
        `strict parse failed (${String(strictErr)}); repair parse failed (${String(repairErr)})`
      );
    }
  }
}

export function startAnalyzer(): () => void {
  logger.info('Starting analyzer');
  return scheduleAnalysis();
}

function scheduleAnalysis(): () => void {
  analyze().catch(e => logger.error(e, 'Analyzer error'));
  const interval = setInterval(() => {
    analyze().catch(e => logger.error(e, 'Analyzer error'));
  }, config.ANALYZER_INTERVAL_MS);
  return () => clearInterval(interval);
}

export async function analyzeIfNeeded(snapshot: WarSnapshot): Promise<void> {
  const currentCritical = new Set(
    snapshot.derived.defensesEndingSoon
      .filter(d => d.hoursRemaining < 6)
      .map(d => d.planetName)
  );
  for (const planetName of seenCriticalDefenses) {
    if (!currentCritical.has(planetName)) {
      seenCriticalDefenses.delete(planetName);
    }
  }

  // Re-run immediately for new critical defenses
  const newCritical = snapshot.derived.defensesEndingSoon.filter(d => {
    if (d.hoursRemaining < 6 && !seenCriticalDefenses.has(d.planetName)) {
      seenCriticalDefenses.add(d.planetName);
      return true;
    }
    return false;
  });

  if (newCritical.length > 0) {
    logger.info({ planets: newCritical.map(d => d.planetName) }, 'New critical defense detected, triggering immediate analysis');
    await analyze();
  }
}

async function analyze(): Promise<void> {
  const cached = memoryStore.get<WarSnapshot>(CACHE_KEYS.SNAPSHOT);
  if (!cached) {
    logger.debug('No snapshot available yet, skipping analysis');
    return;
  }

  const snapshot = cached.value;
  const userPrompt = buildUserPrompt(snapshot);

  try {
    const raw = await aiProvider.analyze({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      maxTokens: config.ANALYZER_MAX_TOKENS,
      timeoutMs: config.ANALYZER_TIMEOUT_MS,
    });
    let recommendation: Recommendation;
    try {
      recommendation = parseRecommendationOutput(raw);
    } catch (e2) {
      logger.warn(
        {
          provider: config.AI_PROVIDER,
          model: config.AI_PROVIDER === 'fireworks' ? config.FIREWORKS_MODEL : config.ANTHROPIC_MODEL,
          rawSnippet: truncate(raw),
          err: String(e2),
        },
        'AI provider output unparseable after strict/extract/repair parse chain — keeping previous'
      );
      const prev = memoryStore.get<Recommendation>(CACHE_KEYS.RECOMMENDATION);
      if (prev) {
        memoryStore.setWithGrace(
          CACHE_KEYS.RECOMMENDATION,
          { ...prev.value, degraded: true },
          FRESH_MS, GRACE_MS
        );
      }
      return;
    }

    memoryStore.setWithGrace(CACHE_KEYS.RECOMMENDATION, recommendation, FRESH_MS, GRACE_MS);
    logger.info('Recommendation updated');
  } catch (e) {
    logger.error(e, 'AI provider call failed');
    const prev = memoryStore.get<Recommendation>(CACHE_KEYS.RECOMMENDATION);
    if (prev) {
      memoryStore.setWithGrace(
        CACHE_KEYS.RECOMMENDATION,
        { ...prev.value, degraded: true },
        FRESH_MS, GRACE_MS
      );
    }
  }
}

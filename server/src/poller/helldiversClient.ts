import { config } from '../config.js';
import { logger } from '../logger.js';
import { ok, err } from '../util/result.js';
import type { Result } from '../util/result.js';

let lastRequestAt = 0;
let minGapMs = config.HELLDIVERS_MIN_REQUEST_GAP_MS;
let backoffUntil = 0;

export async function helldiversFetch<T>(
  path: string,
  schema: { parse: (data: unknown) => T },
): Promise<Result<T, Error>> {
  const now = Date.now();

  if (now < backoffUntil) {
    const waitMs = backoffUntil - now;
    logger.warn({ path, waitMs }, 'In rate-limit backoff');
    await delay(waitMs);
  }

  const gap = Date.now() - lastRequestAt;
  if (gap < minGapMs) {
    await delay(minGapMs - gap);
  }

  const url = `${config.HELLDIVERS_API_BASE}${path}`;
  lastRequestAt = Date.now();

  try {
    const res = await fetch(url, {
      
      headers: {
        'User-Agent': config.HELLDIVERS_USER_AGENT,
        'Accept': 'application/json',
        'X-Super-Client': config.HELLDIVERS_SUPER_CLIENT,
        'X-Super-Contact': config.HELLDIVERS_SUPER_CONTACT,
      },
      
      signal: AbortSignal.timeout(15000),
    });

    if (res.status === 429) {
      minGapMs = minGapMs * 2;
      backoffUntil = Date.now() + 10 * 60 * 1000;
      logger.warn({ path, newGapMs: minGapMs }, 'Rate limited by Helldivers API — backing off');
      return err(new Error('Rate limited'));
    }

    if (!res.ok) {
      return err(new Error(`HTTP ${res.status} for ${path}`));
    }

    const json = await res.json();
    const parsed = schema.parse(json);
    return ok(parsed);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

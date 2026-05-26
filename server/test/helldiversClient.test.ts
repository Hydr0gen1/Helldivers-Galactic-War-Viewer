import { afterEach, describe, expect, it, vi } from 'vitest';

const BASE_ENV = {
  PORT: '8080',
  NODE_ENV: 'test',
  LOG_LEVEL: 'info',
  AI_PROVIDER: 'anthropic',
  ANTHROPIC_API_KEY: 'anthropic-key',
  HELLDIVERS_API_BASE: 'https://api.helldivers2.dev/api/v1',
  HELLDIVERS_USER_AGENT: 'helldivers-intel/1.0',
  HELLDIVERS_MIN_REQUEST_GAP_MS: '0',
};

function setBaseEnv(): void {
  for (const [key, value] of Object.entries(BASE_ENV)) vi.stubEnv(key, value);
}

describe('helldiversFetch headers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('sends X-Super-Client and X-Super-Contact from config', async () => {
    setBaseEnv();
    vi.stubEnv('HELLDIVERS_SUPER_CLIENT', 'Test-Client');
    vi.stubEnv('HELLDIVERS_SUPER_CONTACT', 'https://example.com/contact');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { helldiversFetch } = await import('../src/poller/helldiversClient.js');
    const result = await helldiversFetch('/war', { parse: (data: unknown) => data as { ok: boolean } });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({
      'X-Super-Client': 'Test-Client',
      'X-Super-Contact': 'https://example.com/contact',
    });
  });
});

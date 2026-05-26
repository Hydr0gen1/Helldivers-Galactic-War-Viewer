import { afterEach, describe, expect, it, vi } from 'vitest';

const BASE_ENV = {
  PORT: '8080',
  NODE_ENV: 'test',
  LOG_LEVEL: 'info',
  AI_PROVIDER: 'anthropic',
  ANTHROPIC_API_KEY: 'anthropic-key',
  ANTHROPIC_MODEL: 'claude-haiku-4-5-20251001',
  FIREWORKS_API_KEY: 'fireworks-key',
  FIREWORKS_MODEL: 'accounts/fireworks/models/deepseek-v3p1',
  FIREWORKS_BASE_URL: 'https://api.fireworks.ai/inference/v1',
  CEREBRAS_API_KEY: 'cerebras-key',
  CEREBRAS_MODEL: 'llama-4-scout-17b-16e-instruct',
};

describe('config fireworks', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('accepts fireworks config with API key + model + base URL', async () => {
    for (const [key, value] of Object.entries(BASE_ENV)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv('AI_PROVIDER', 'fireworks');

    const { config } = await import('../src/config.js');

    expect(config.AI_PROVIDER).toBe('fireworks');
    expect(config.FIREWORKS_API_KEY).toBe('fireworks-key');
    expect(config.FIREWORKS_MODEL).toBe('accounts/fireworks/models/deepseek-v3p1');
    expect(config.FIREWORKS_BASE_URL).toBe('https://api.fireworks.ai/inference/v1');
  });

  it('warns when fireworks model is not a full accounts/ path', async () => {
    for (const [key, value] of Object.entries(BASE_ENV)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv('AI_PROVIDER', 'fireworks');
    vi.stubEnv('FIREWORKS_MODEL', 'deepseek-v3p1');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await import('../src/config.js');

    expect(warnSpy).toHaveBeenCalledWith(
      'Fireworks model names usually need the full path, e.g. accounts/fireworks/models/deepseek-v3p1.',
    );
  });
});

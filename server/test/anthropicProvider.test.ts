import { describe, it, expect, vi, afterEach } from 'vitest';
import { createAnthropicProvider } from '../src/analyzer/providers/anthropicProvider.js';

describe('anthropicProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends maxTokens from AnalyzeInput as max_tokens', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ text: 'ok' }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = createAnthropicProvider('test-key', 'claude-test');
    await provider.analyze({
      systemPrompt: 'sys',
      userPrompt: 'user',
      maxTokens: 1234,
      timeoutMs: 1000,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.max_tokens).toBe(1234);
  });
});

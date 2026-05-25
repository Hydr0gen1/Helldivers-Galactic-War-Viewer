import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAnthropicProvider } from '../src/analyzer/providers/anthropicProvider.js';

describe('anthropicProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('passes maxTokens through to max_tokens in request body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ text: 'ok' }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = createAnthropicProvider('test-key', 'test-model');

    await provider.analyze({
      systemPrompt: 'system',
      userPrompt: 'user',
      maxTokens: 1234,
      timeoutMs: 1000,
    });

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(request.body)) as { max_tokens: number };

    expect(body.max_tokens).toBe(1234);
  });
});

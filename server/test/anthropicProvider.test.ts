import { describe, it, expect, vi, afterEach } from 'vitest';
import { createAnthropicProvider } from '../src/analyzer/providers/anthropicProvider.js';

describe('anthropicProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends AnalyzeInput.maxTokens as max_tokens in request body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ text: 'ok' }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = createAnthropicProvider('test-key', 'claude-test');
    await provider.analyze({
      systemPrompt: 'system',
      userPrompt: 'user',
      maxTokens: 321,
      timeoutMs: 5000,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, request] = fetchMock.mock.calls[0];
    const parsedBody = JSON.parse((request as RequestInit).body as string);
    expect(parsedBody.max_tokens).toBe(321);
  });
});

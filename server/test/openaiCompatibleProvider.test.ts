import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOpenAiCompatibleProvider } from '../src/analyzer/providers/openaiCompatibleProvider.js';

describe('openaiCompatibleProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('normalizes trailing slash in baseUrl before appending chat/completions', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'OK' } }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = createOpenAiCompatibleProvider({
      baseUrl: 'https://api.fireworks.ai/inference/v1/',
      apiKey: 'test-key',
      model: 'accounts/fireworks/models/deepseek-v4-flash',
      providerLabel: 'Fireworks',
    });

    await provider.analyze({
      systemPrompt: 'system',
      userPrompt: 'Return OK.',
      maxTokens: 12,
      timeoutMs: 1000,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.fireworks.ai/inference/v1/chat/completions');
  });

  it('sends strict json_schema response_format for OpenAI-compatible providers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"ok":true}' } }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const provider = createOpenAiCompatibleProvider({
      baseUrl: 'https://api.fireworks.ai/inference/v1',
      apiKey: 'test-key',
      model: 'accounts/fireworks/models/deepseek-v4-flash',
      providerLabel: 'Fireworks',
    });

    await provider.analyze({
      systemPrompt: 'system',
      userPrompt: 'Return strict json only.',
      maxTokens: 128,
      timeoutMs: 1000,
    });

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(request.body)) as { response_format?: { type?: string; json_schema?: { strict?: boolean } } };
    expect(body.response_format?.type).toBe('json_schema');
    expect(body.response_format?.json_schema?.strict).toBe(true);
  });
});

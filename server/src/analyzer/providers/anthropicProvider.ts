import type { AiProvider, AnalyzeInput } from './types.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export function createAnthropicProvider(apiKey: string, model: string): AiProvider {
  return {
    async analyze({ systemPrompt, userPrompt, timeoutMs }: AnalyzeInput): Promise<string> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(ANTHROPIC_API_URL, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': ANTHROPIC_VERSION,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model,
            max_tokens: 600,
            temperature: 0.2,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.text();
          throw new Error(`Anthropic API request failed with status ${response.status}: ${body.slice(0, 1000)}`);
        }

        const data = await response.json() as { content?: Array<{ text?: string }> };
        const text = data.content?.[0]?.text;
        if (!text) {
          throw new Error('Anthropic API response missing content[0].text');
        }
        return text;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

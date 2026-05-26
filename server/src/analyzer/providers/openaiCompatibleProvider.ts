import type { AiProvider, AnalyzeInput } from './types.js';

interface OpenAiCompatibleOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  providerLabel: string;
}

export function createOpenAiCompatibleProvider(options: OpenAiCompatibleOptions): AiProvider {
  const { baseUrl, apiKey, model, providerLabel } = options;
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');

  return {
    async analyze({ systemPrompt, userPrompt, maxTokens, timeoutMs }: AnalyzeInput): Promise<string> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${normalizedBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            max_tokens: maxTokens,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const details = await response.text();
          throw new Error(`${providerLabel} request failed (${response.status}): ${details.slice(0, 500)}`);
        }

        const data = await response.json() as {
          choices?: Array<{ message?: { content?: string | null } }>;
        };

        const content = data.choices?.[0]?.message?.content;
        if (typeof content !== 'string' || content.trim().length === 0) {
          throw new Error(`${providerLabel} response did not include text content`);
        }

        return content;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

import Anthropic from '@anthropic-ai/sdk';
import type { AiProvider, AnalyzeInput } from './types.js';

export function createAnthropicProvider(apiKey: string, model: string): AiProvider {
  const anthropic = new Anthropic({ apiKey });

  return {
    async analyze({ systemPrompt, userPrompt, maxTokens, timeoutMs }: AnalyzeInput): Promise<string> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await anthropic.messages.create({
          model,
          max_tokens: maxTokens,
          temperature: 0.2,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }, {
          signal: controller.signal,
        });

        const content = response.content[0];
        if (content.type !== 'text') {
          throw new Error(`Unexpected content type: ${content.type}`);
        }
        return content.text;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

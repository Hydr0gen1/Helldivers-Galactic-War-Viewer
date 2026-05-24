import type { AiProvider } from './types.js';
import { createOpenAiCompatibleProvider } from './openaiCompatibleProvider.js';

export function createCerebrasProvider(apiKey: string, model: string): AiProvider {
  return createOpenAiCompatibleProvider({
    baseUrl: 'https://api.cerebras.ai/v1',
    apiKey,
    model,
    providerLabel: 'Cerebras',
  });
}

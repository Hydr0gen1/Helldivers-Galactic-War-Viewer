import type { AiProvider } from './types.js';
import { createOpenAiCompatibleProvider } from './openaiCompatibleProvider.js';

export function createFireworksProvider(apiKey: string, model: string, baseUrl: string): AiProvider {
  return createOpenAiCompatibleProvider({
    baseUrl,
    apiKey,
    model,
    providerLabel: 'Fireworks',
  });
}

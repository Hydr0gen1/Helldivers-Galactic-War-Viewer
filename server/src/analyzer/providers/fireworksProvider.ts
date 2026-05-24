import type { AiProvider } from './types.js';
import { createOpenAiCompatibleProvider } from './openaiCompatibleProvider.js';

export function createFireworksProvider(apiKey: string, model: string): AiProvider {
  return createOpenAiCompatibleProvider({
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    apiKey,
    model,
    providerLabel: 'Fireworks',
  });
}

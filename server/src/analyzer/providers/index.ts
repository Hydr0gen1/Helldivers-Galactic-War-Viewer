import { config } from '../../config.js';
import { createAnthropicProvider } from './anthropicProvider.js';
import { createCerebrasProvider } from './cerebrasProvider.js';
import { createFireworksProvider } from './fireworksProvider.js';
import type { AiProvider } from './types.js';

export function createAiProvider(): AiProvider {
  switch (config.AI_PROVIDER) {
    case 'anthropic':
      return createAnthropicProvider(config.ANTHROPIC_API_KEY!, config.ANTHROPIC_MODEL);
    case 'fireworks':
      return createFireworksProvider(config.FIREWORKS_API_KEY!, config.FIREWORKS_MODEL!, config.FIREWORKS_BASE_URL);
    case 'cerebras':
      return createCerebrasProvider(config.CEREBRAS_API_KEY!, config.CEREBRAS_MODEL);
    default: {
      const neverProvider: never = config.AI_PROVIDER;
      throw new Error(`Unsupported AI_PROVIDER: ${String(neverProvider)}`);
    }
  }
}

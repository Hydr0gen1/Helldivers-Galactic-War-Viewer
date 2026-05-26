import { config } from '../config.js';
import { createAiProvider } from '../analyzer/providers/index.js';

function getProviderEndpoint(): string {
  switch (config.AI_PROVIDER) {
    case 'fireworks':
      return `${config.FIREWORKS_BASE_URL}/chat/completions`;
    case 'cerebras':
      return 'https://api.cerebras.ai/v1/chat/completions';
    case 'anthropic':
      return 'https://api.anthropic.com/v1/messages';
    default: {
      const neverProvider: never = config.AI_PROVIDER;
      throw new Error(`Unsupported AI_PROVIDER: ${String(neverProvider)}`);
    }
  }
}

function getProviderModel(): string {
  switch (config.AI_PROVIDER) {
    case 'fireworks':
      return config.FIREWORKS_MODEL;
    case 'cerebras':
      return config.CEREBRAS_MODEL;
    case 'anthropic':
      return config.ANTHROPIC_MODEL;
    default: {
      const neverProvider: never = config.AI_PROVIDER;
      throw new Error(`Unsupported AI_PROVIDER: ${String(neverProvider)}`);
    }
  }
}

async function main(): Promise<void> {
  const provider = createAiProvider();
  const endpoint = new URL(getProviderEndpoint());
  const model = getProviderModel();

  console.log(`[check:ai] provider=${config.AI_PROVIDER}`);
  console.log(`[check:ai] endpoint=${endpoint.host}${endpoint.pathname}`);
  console.log(`[check:ai] model=${model}`);

  try {
    const output = await provider.analyze({
      systemPrompt: 'You are a diagnostics assistant.',
      userPrompt: 'Return OK.',
      maxTokens: 12,
      timeoutMs: Math.min(config.ANALYZER_TIMEOUT_MS, 15000),
    });
    console.log(`[check:ai] success=true response=${output.slice(0, 120).replace(/\s+/g, ' ').trim()}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[check:ai] success=false error=${message}`);
    process.exitCode = 1;
  }
}

await main();

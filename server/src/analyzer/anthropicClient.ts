import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';

const anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

export async function callHaiku(systemPrompt: string, userPrompt: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.ANALYZER_TIMEOUT_MS);

  try {
    const response = await anthropic.messages.create({
      model: config.ANTHROPIC_MODEL,
      max_tokens: config.ANALYZER_MAX_TOKENS,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error(`Unexpected content type: ${content.type}`);
    }
    return content.text;
  } finally {
    clearTimeout(timeout);
  }
}

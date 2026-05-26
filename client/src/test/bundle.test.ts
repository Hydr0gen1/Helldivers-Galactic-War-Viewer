import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

describe('bundle security', () => {
  it('built client bundle contains no AI provider API key patterns', () => {
    const distDir = join(process.cwd(), 'dist', 'assets');
    expect(
      existsSync(distDir),
      'Bundle test requires client/dist — run npm run build first.'
    ).toBe(true);

    const files = readdirSync(distDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const content = readFileSync(join(distDir, file), 'utf-8');
      expect(content).not.toContain('ANTHROPIC_API_KEY');
      expect(content).not.toContain('FIREWORKS_API_KEY');
      expect(content).not.toContain('CEREBRAS_API_KEY');
      expect(content).not.toContain('FIREWORKS_EXTRA_HEADERS_JSON');
      expect(content).not.toContain('.secrets.env');
    }
  });
});

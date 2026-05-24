import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('bundle security', () => {
  it('built client bundle contains no Anthropic API key patterns', async () => {
    const distDir = join(process.cwd(), 'dist', 'assets');
    if (!existsSync(distDir)) {
      // Skip if not yet built
      return;
    }
    const { readdirSync } = await import('fs');
    const files = readdirSync(distDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const content = readFileSync(join(distDir, file), 'utf-8');
      expect(content).not.toContain('sk-ant');
      expect(content).not.toContain('ANTHROPIC_API_KEY');
    }
  });
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    env: {
      ANTHROPIC_API_KEY: 'test-key-placeholder',
    },
  },
});

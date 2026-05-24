import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  ANTHROPIC_API_KEY: z.string().min(1),
  ANTHROPIC_MODEL: z.string().default('claude-haiku-4-5-20251001'),
  ANALYZER_MAX_TOKENS: z.coerce.number().default(600),
  ANALYZER_TIMEOUT_MS: z.coerce.number().default(20000),
  ANALYZER_INTERVAL_MS: z.coerce.number().default(300000),
  POLL_INTERVAL_MS: z.coerce.number().default(60000),
  HELLDIVERS_API_BASE: z.string().url().default('https://api.helldivers2.dev/api/v1'),
  HELLDIVERS_USER_AGENT: z.string().min(1).default('helldivers-intel/1.0'),
  HELLDIVERS_MIN_REQUEST_GAP_MS: z.coerce.number().default(10000),
});

export type Config = z.infer<typeof schema>;

function loadConfig(): Config {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid configuration:', result.error.format());
    process.exit(1);
  }
  return result.data;
}

export const config = loadConfig();

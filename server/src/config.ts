import { z } from 'zod';
import { envBoolean } from './config/envBoolean.js';

const baseSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  AI_PROVIDER: z.enum(['anthropic', 'fireworks', 'cerebras']).default('anthropic'),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  FIREWORKS_API_KEY: z.string().min(1).optional(),
  FIREWORKS_BASE_URL: z.string().url().default('https://api.fireworks.ai/inference/v1'),
  CEREBRAS_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().default('claude-haiku-4-5-20251001'),
  FIREWORKS_MODEL: z.preprocess(
    (value) => (typeof value === 'string' && value.trim().length === 0 ? undefined : value),
    z.string().min(1).optional(),
  ),
  CEREBRAS_MODEL: z.string().default('llama-4-scout-17b-16e-instruct'),
  ANALYZER_MAX_TOKENS: z.coerce.number().default(600),
  ANALYZER_TIMEOUT_MS: z.coerce.number().default(20000),
  ANALYZER_INTERVAL_MS: z.coerce.number().default(300000),
  POLL_INTERVAL_MS: z.coerce.number().default(60000),
  HELLDIVERS_API_BASE: z.string().url().default('https://api.helldivers2.dev/api/v1'),
  HELLDIVERS_USER_AGENT: z.string().min(1).default('helldivers-intel/1.0'),
  HELLDIVERS_MIN_REQUEST_GAP_MS: z.coerce.number().default(10000),
  HELLDIVERS_SUPER_CLIENT: z.string().min(1).default('Helldivers-Galactic-War-Viewer'),
  HELLDIVERS_SUPER_CONTACT: z.string().min(1).default('https://github.com/Hydr0gen1/Helldivers-Galactic-War-Viewer'),
  WAR_CHRONICLE_ENABLED: envBoolean.default(true),
  WAR_CHRONICLE_DB_PATH: z.string().default('/app/data/helldivers-intel.sqlite'),
  WAR_CHRONICLE_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
});

const schema = baseSchema.superRefine((value, ctx) => {
  const requiredKeyByProvider = {
    anthropic: 'ANTHROPIC_API_KEY',
    fireworks: 'FIREWORKS_API_KEY',
    cerebras: 'CEREBRAS_API_KEY',
  } as const;

  const requiredKey = requiredKeyByProvider[value.AI_PROVIDER];
  if (!value[requiredKey]) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [requiredKey],
      message: `${requiredKey} is required when AI_PROVIDER=${value.AI_PROVIDER}`,
    });
  }

  if (value.AI_PROVIDER === 'fireworks' && !value.FIREWORKS_MODEL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['FIREWORKS_MODEL'],
      message: 'FIREWORKS_MODEL is required when AI_PROVIDER=fireworks',
    });
  }
});

export type Config = z.infer<typeof schema>;

function loadConfig(): Config {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid configuration:', result.error.format());
    process.exit(1);
  }

  if (
    result.data.AI_PROVIDER === 'fireworks'
    && result.data.FIREWORKS_MODEL
    && !result.data.FIREWORKS_MODEL.startsWith('accounts/')
  ) {
    console.warn('Fireworks model names usually need the full path, e.g. accounts/fireworks/models/deepseek-v4-flash.');
  }

  return result.data;
}

export const config = loadConfig();

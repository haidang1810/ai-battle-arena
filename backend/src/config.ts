import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  OPENROUTER_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});

export const config = envSchema.parse(process.env);

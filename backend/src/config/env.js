import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

// Resolve directory paths to load .env from either backend or repository root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading .env from backend/ or project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Zod schema defining backend environment configuration invariants.
 */
const envSchema = z.object({
  PORT: z
    .string()
    .optional()
    .default('5000')
    .transform((val) => parseInt(val, 10))
    .pipe(
      z
        .number({ invalid_type_error: 'PORT must be a valid integer' })
        .int('PORT must be an integer')
        .min(1, 'PORT must be at least 1')
        .max(65535, 'PORT must not exceed 65535')
    ),

  NODE_ENV: z
    .enum(['development', 'production', 'test'], {
      invalid_type_error: 'NODE_ENV must be development, production, or test',
    })
    .default('development'),

  MONGO_URI: z
    .string({
      required_error: 'MONGO_URI is required',
      invalid_type_error: 'MONGO_URI must be a string',
    })
    .min(1, 'MONGO_URI cannot be empty')
    .refine(
      (uri) => uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'),
      {
        message: 'MONGO_URI must begin with mongodb:// or mongodb+srv://',
      }
    ),

  CORS_ORIGIN: z
    .string({
      invalid_type_error: 'CORS_ORIGIN must be a string',
    })
    .default('http://localhost:5173'),
});

/**
 * Validates and extracts environment configuration.
 * Throws sanitized errors without exposing credential tokens.
 *
 * @param {NodeJS.ProcessEnv} rawEnv
 * @returns {Readonly<z.infer<typeof envSchema>>}
 */
export function validateEnv(rawEnv = process.env) {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const issues = result.error.issues || result.error.errors || [];
    const errorDetails = issues.map((err) => {
      const fieldPath = err.path && err.path.length > 0 ? err.path.join('.') : 'config';
      return `${fieldPath}: ${err.message}`;
    });

    const sanitizedMessage = `[Config Error] Environment validation failed:\n  - ${errorDetails.join('\n  - ')}`;
    throw new Error(sanitizedMessage);
  }

  return Object.freeze(result.data);
}

// Export parsed configuration object
export const env = validateEnv(process.env);
export default env;

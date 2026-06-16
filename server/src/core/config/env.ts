import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(8082),
    MONGO_URL: z.string().min(1),
    RUSTFS_ENDPOINT: z.string().url(),
    RUSTFS_PUBLIC_ENDPOINT: z.string().url().optional(),
    RUSTFS_REGION: z.string().min(1).default('us-east-1'),
    RUSTFS_ACCESS_KEY: z.string().min(1),
    RUSTFS_SECRET_KEY: z.string().min(1),
    RUSTFS_TARBALL_BUCKET: z.string().min(1).default('vpm-tarballs'),
    RUSTFS_README_BUCKET: z.string().min(1).default('vpm-readmes'),
    CONSOLE_URL: z.string().url(),
    CONSOLE_SERVICE_TOKEN: z.string().min(1),
    CONSOLE_JWKS_URL: z.string().url(),
    CORS_ORIGINS: z.string().default(''),
    SYSTEM_ACCOUNT_ID: z.string().min(1).default('000000000000000000000001'),
    LEGACY_INDEX_URL: z.string().url().default('https://server.voltcloud.dev/plugin-registry/index.json')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    const flat = parsed.error.flatten();
    throw new Error(`Invalid environment: ${JSON.stringify(flat.fieldErrors)}`);
}

const env = parsed.data;

export const corsOrigins = env.CORS_ORIGINS
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

export default env;

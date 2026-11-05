const dotenv = require('dotenv');
const path = require('path');
const { z } = require('zod');

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/movemate'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long').default('movemate_dev_secret_key_change_in_production_12345'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).default('900000'),
  RATE_LIMIT_MAX: z.string().transform((val) => parseInt(val, 10)).default('100')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment configuration error:');
  parsed.error.issues.forEach((issue) => {
    console.error(` - [${issue.path.join('.')}]: ${issue.message}`);
  });
  process.exit(1);
}

module.exports = parsed.data;

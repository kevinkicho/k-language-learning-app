import type { Config } from 'drizzle-kit';

export default {
  schema: './app/drizzle/schema.ts',
  out: './app/drizzle/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'language_learning.db',
  },
} satisfies Config; 
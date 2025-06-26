import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';

// Use in-memory database for cloud deployment, file-based for local development
const isProduction = process.env.NODE_ENV === 'production';
const dbPath = isProduction ? ':memory:' : 'language_learning.db';

// Create SQLite database connection
const sqlite = new Database(dbPath);

// Create Drizzle database instance
export const db = drizzle(sqlite, { schema });

// Initialize database with schema in production (in-memory database)
if (isProduction) {
  try {
    // Run migrations to create tables
    migrate(db, { migrationsFolder: './app/drizzle/migrations' });
    console.log('Database initialized successfully in production mode');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Export the raw SQLite instance for migrations if needed
export const sqliteDb = sqlite; 
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// Create SQLite database connection
const sqlite = new Database('language_learning.db');

// Create Drizzle database instance
export const db = drizzle(sqlite, { schema });

// Export the raw SQLite instance for migrations if needed
export const sqliteDb = sqlite; 
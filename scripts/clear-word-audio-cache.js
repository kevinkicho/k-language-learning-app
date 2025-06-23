const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { wordAudio } = require('../app/drizzle/schema');

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/language_learning';
const client = postgres(connectionString);
const db = drizzle(client);

async function clearWordAudioCache() {
  try {
    console.log('Clearing word audio cache from database...');
    
    // Delete all word audio entries
    await db.delete(wordAudio);
    
    console.log('Word audio cache cleared successfully!');
    console.log('New word audio will be generated with correct voices when accessed.');
    
  } catch (error) {
    console.error('Error clearing word audio cache:', error);
  } finally {
    await client.end();
  }
}

// Run the function
clearWordAudioCache(); 
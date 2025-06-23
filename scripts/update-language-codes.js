const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'language_learning.db');
const db = new sqlite3.Database(dbPath);

console.log('Updating language codes in database...');

db.run("UPDATE sentences SET language_code = 'es-es' WHERE language_code = 'es-ES'", function(err) {
  if (err) {
    console.error('Error updating language codes:', err);
  } else {
    console.log(`Updated ${this.changes} sentences with new language code`);
    
    // Check the results
    db.all("SELECT id, english_sentence, language_code FROM sentences LIMIT 5", (err, rows) => {
      if (err) {
        console.error('Error checking results:', err);
      } else {
        console.log('Sample sentences after update:');
        rows.forEach(row => {
          console.log(`- ${row.english_sentence} (${row.language_code})`);
        });
      }
      db.close();
    });
  }
}); 
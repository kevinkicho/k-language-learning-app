const fs = require('fs').promises;
const path = require('path');

async function clearAudioCache() {
  try {
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    
    // Check if audio directory exists
    try {
      await fs.access(audioDir);
    } catch {
      console.log('Audio directory does not exist, nothing to clear.');
      return;
    }
    
    // Read all files in the audio directory
    const files = await fs.readdir(audioDir);
    
    // Filter for audio files (mp3 files)
    const audioFiles = files.filter(file => file.endsWith('.mp3'));
    
    if (audioFiles.length === 0) {
      console.log('No audio files found to clear.');
      return;
    }
    
    console.log(`Found ${audioFiles.length} audio files to clear.`);
    
    // Delete each audio file
    for (const file of audioFiles) {
      const filePath = path.join(audioDir, file);
      await fs.unlink(filePath);
      console.log(`Deleted: ${file}`);
    }
    
    console.log('Audio cache cleared successfully!');
    console.log('New audio files will be generated with correct voices when accessed.');
    
  } catch (error) {
    console.error('Error clearing audio cache:', error);
  }
}

// Run the function
clearAudioCache(); 
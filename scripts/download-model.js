const https = require('https');
const fs = require('fs');
const path = require('path');

const MODEL_URL = 'https://huggingface.co/TheBloke/gemma-3-1b-it-qat-q4_0-GGUF/resolve/main/gemma-3-1b-it-qat-q4_0.gguf';
const MODEL_PATH = path.join(__dirname, '..', 'models', 'gemma-3-1b-it-qat-q4_0.gguf');

console.log('🚀 Starting Gemma-3-1b model download...');
console.log(`📁 Model will be saved to: ${MODEL_PATH}`);
console.log('⏳ This may take a while depending on your internet connection...');

// Create models directory if it doesn't exist
const modelsDir = path.dirname(MODEL_PATH);
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// Check if model already exists
if (fs.existsSync(MODEL_PATH)) {
  console.log('✅ Model already exists! Skipping download.');
  process.exit(0);
}

const file = fs.createWriteStream(MODEL_PATH);
let downloadedBytes = 0;
let totalBytes = 0;

https.get(MODEL_URL, (response) => {
  totalBytes = parseInt(response.headers['content-length'], 10);
  
  response.on('data', (chunk) => {
    downloadedBytes += chunk.length;
    const progress = ((downloadedBytes / totalBytes) * 100).toFixed(2);
    process.stdout.write(`\r📥 Downloading: ${progress}% (${(downloadedBytes / 1024 / 1024).toFixed(2)}MB / ${(totalBytes / 1024 / 1024).toFixed(2)}MB)`);
  });

  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('\n✅ Model downloaded successfully!');
    console.log(`📁 Location: ${MODEL_PATH}`);
    console.log('🎉 You can now use the AI features in your app!');
  });
}).on('error', (err) => {
  fs.unlink(MODEL_PATH, () => {}); // Delete the file if download failed
  console.error('❌ Error downloading model:', err.message);
  console.log('\n💡 Alternative: You can manually download the model from:');
  console.log('   https://huggingface.co/TheBloke/gemma-3-1b-it-qat-q4_0-GGUF');
  console.log('   And place it in the models/ directory.');
  process.exit(1);
}); 
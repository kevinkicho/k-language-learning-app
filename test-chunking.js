// Test the new Japanese chunking logic
const splitJapaneseIntoChunks = (text, numChunks) => {
  if (numChunks <= 1) {
    return [text];
  }
  
  // Common Japanese particles that should be separate chunks
  const particles = ['は', 'が', 'を', 'に', 'で', 'から', 'まで', 'の', 'も', 'や', 'と', 'か', 'ね', 'よ', 'な', 'だ'];
  
  // Find potential split points
  const splitPoints = [];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // Split after particles
    if (particles.includes(char)) {
      splitPoints.push(i + 1);
    }
    
    // Split between different character types
    if (i < text.length - 1) {
      const nextChar = text[i + 1];
      const currentType = getCharacterType(char);
      const nextType = getCharacterType(nextChar);
      
      if (currentType !== nextType && !particles.includes(nextChar)) {
        splitPoints.push(i + 1);
      }
    }
  }
  
  // If we have enough split points, use them
  if (splitPoints.length >= numChunks - 1) {
    // Sort split points and take the first numChunks - 1
    splitPoints.sort((a, b) => a - b);
    const selectedPoints = splitPoints.slice(0, numChunks - 1);
    
    const chunks = [];
    let start = 0;
    
    for (const point of selectedPoints) {
      chunks.push(text.substring(start, point));
      start = point;
    }
    
    // Add the remaining text
    if (start < text.length) {
      chunks.push(text.substring(start));
    }
    
    return chunks.filter(chunk => chunk.length > 0);
  }
  
  // Fallback: simple character-based splitting
  const chars = text.split('');
  const total = chars.length;
  const baseSize = Math.floor(total / numChunks);
  let remainder = total % numChunks;
  let idx = 0;
  const chunks = [];
  
  for (let i = 0; i < numChunks; i++) {
    let size = baseSize + (remainder > 0 ? 1 : 0);
    remainder--;
    const chunk = chars.slice(idx, idx + size).join('');
    chunks.push(chunk);
    idx += size;
  }
  
  return chunks.filter(chunk => chunk.length > 0);
};

const getCharacterType = (char) => {
  if (/[\u3040-\u309F]/.test(char)) return 'hiragana';
  if (/[\u30A0-\u30FF]/.test(char)) return 'katakana';
  if (/[\u4E00-\u9FAF]/.test(char)) return 'kanji';
  if (/[a-zA-Z]/.test(char)) return 'romaji';
  return 'other';
};

// Test cases
const testCases = [
  "お水をいただけますか？(O-mizu o itadakemasu ka?)",
  "これをください。(Kore o kudasai.)",
  "おすすめは何ですか？(Osusume wa nan desu ka?)"
];

console.log("Testing new Japanese chunking logic:");
testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: "${testCase}"`);
  const japaneseText = testCase.replace(/\([^)]*\)/g, '').trim();
  const romajiText = testCase.match(/\(([^)]+)\)/)?.[1]?.trim() || '';
  const romajiWords = romajiText.split(/\s+/).filter(w => w.length > 0);
  
  console.log("Japanese text:", japaneseText);
  console.log("Romaji words:", romajiWords);
  
  const chunks = splitJapaneseIntoChunks(japaneseText, romajiWords.length);
  console.log("Japanese chunks:", chunks);
  
  // Check if we have 1:1 mapping
  if (chunks.length === romajiWords.length) {
    console.log("✅ 1:1 mapping achieved!");
    for (let i = 0; i < chunks.length; i++) {
      console.log(`  ${romajiWords[i]} → ${chunks[i]}`);
    }
  } else {
    console.log(`❌ No 1:1 mapping (${chunks.length} chunks vs ${romajiWords.length} romaji words)`);
  }
}); 
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import fs from 'fs/promises';

const GOOGLE_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const GOOGLE_KEY_FILENAME = process.env.GOOGLE_CLOUD_KEY_FILENAME;

const textToSpeechClient = new TextToSpeechClient({
  projectId: GOOGLE_PROJECT_ID,
  keyFilename: GOOGLE_KEY_FILENAME,
});

// Helper function to get the correct voice for each language
function getVoiceForLanguage(languageCode: string): { languageCode: string; name: string } {
  console.log(`[VOICE MAPPING] Mapping language code: "${languageCode}"`);
  
  switch (languageCode) {
    case 'es-es':
      return { languageCode: 'es-ES', name: 'es-ES-Neural2-A' };
    case 'es':
      return { languageCode: 'es-MX', name: 'es-MX-Neural2-A' };
    case 'fr-fr':
      return { languageCode: 'fr-FR', name: 'fr-FR-Neural2-A' };
    case 'fr':
      return { languageCode: 'fr-CA', name: 'fr-CA-Neural2-A' };
    case 'de-de':
      return { languageCode: 'de-DE', name: 'de-DE-Wavenet-A' };
    case 'de':
      return { languageCode: 'de-AT', name: 'de-AT-Wavenet-A' };
    case 'it-it':
      return { languageCode: 'it-IT', name: 'it-IT-Neural2-A' };
    case 'pt-pt':
      return { languageCode: 'pt-PT', name: 'pt-PT-Neural2-A' };
    case 'pt':
      return { languageCode: 'pt-BR', name: 'pt-BR-Neural2-A' };
    case 'en':
      return { languageCode: 'en-US', name: 'en-US-Neural2-F' };
    case 'ja-jp':
      return { languageCode: 'ja-JP', name: 'ja-JP-Wavenet-A' };
    case 'zh-cn':
      return { languageCode: 'zh-CN', name: 'zh-CN-Wavenet-A' };
    default:
      console.log(`[VOICE MAPPING] Unknown language code: "${languageCode}", falling back to Spanish`);
      return { languageCode: 'es-ES', name: 'es-ES-Neural2-A' };
  }
}

// Standalone function for generating audio (returns Buffer)
export async function generateAudio(text: string, language: string): Promise<Buffer> {
  console.log(`[generateAudio] Starting for text: "${text}", lang: "${language}"`);
  
  if (!GOOGLE_PROJECT_ID || !GOOGLE_KEY_FILENAME) {
    console.error('[generateAudio] Missing GOOGLE_PROJECT_ID or GOOGLE_KEY_FILENAME');
    throw new Error('Google Cloud credentials (PROJECT_ID and KEY_FILENAME) are not set in environment variables.');
  }

  try {
    await fs.access(GOOGLE_KEY_FILENAME);
  } catch (err) {
    console.error(`[generateAudio] FAILED to access key file at: ${GOOGLE_KEY_FILENAME}`);
    throw new Error(`Could not access Google Cloud key file. Please check the path.`);
  }

  try {
    const languageCode = language || 'es-es';
    const voice = getVoiceForLanguage(languageCode);
    
    const request = {
      input: { text },
      voice: {
        languageCode: voice.languageCode,
        name: voice.name,
        ssmlGender: 'FEMALE' as const,
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: 0.9,
        pitch: 0,
      },
    };

    const [response] = await textToSpeechClient.synthesizeSpeech(request);
    
    if (!response.audioContent) {
      throw new Error('No audio content received from Google TTS');
    }

    console.log(`[generateAudio] Successfully received ${response.audioContent.length} bytes of audio data.`);
    return Buffer.from(response.audioContent);
  } catch (error) {
    console.error('[generateAudio] Full error from Google TTS Client:', error);
    if (error instanceof Error) {
        throw new Error(`Google TTS Error: ${error.message}`);
    }
    throw new Error('Audio generation failed with an unknown error.');
  }
}

export const googleServices = {
  // Translate text to Spanish
  async translateToSpanish(text: string): Promise<string> {
    if (!GOOGLE_PROJECT_ID || !GOOGLE_KEY_FILENAME) {
      throw new Error('Google Cloud credentials (PROJECT_ID and KEY_FILENAME) are not set in environment variables.');
    }
    try {
      const [translation] = await translate.translate(text, 'es');
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      if (error instanceof Error) {
        throw new Error(`Translation failed: ${error.message}`);
      }
      throw new Error('Translation failed');
    }
  },

  // Translate Japanese text to English for word chunking
  async translateJapaneseToEnglish(text: string): Promise<string> {
    if (!GOOGLE_PROJECT_ID || !GOOGLE_KEY_FILENAME) {
      throw new Error('Google Cloud credentials (PROJECT_ID and KEY_FILENAME) are not set in environment variables.');
    }
    try {
      const [translation] = await translate.translate(text, 'en');
      return translation;
    } catch (error) {
      console.error('Japanese to English translation error:', error);
      if (error instanceof Error) {
        throw new Error(`Translation failed: ${error.message}`);
      }
      throw new Error('Translation failed');
    }
  },

  // Intelligently chunk Japanese text using translation API
  async chunkJapaneseText(japaneseText: string): Promise<string[]> {
    try {
      // Clean the Japanese text (remove romaji in parentheses)
      const cleanJapaneseText = japaneseText.replace(/\([^)]*\)/g, '').trim();
      
      // Translate to English to get word boundaries
      const englishTranslation = await this.translateJapaneseToEnglish(cleanJapaneseText);
      
      // Split English translation by spaces to get word boundaries
      const englishWords = englishTranslation.split(/\s+/).filter(word => word.length > 0);
      
      // Calculate proportional distribution
      const totalEnglishChars = englishWords.join('').replace(/[^a-zA-Z]/g, '').length;
      const totalJapaneseChars = cleanJapaneseText.replace(/[。、！？：；]/g, '').length;
      
      // Create chunks based on proportional character distribution
      const chunks: string[] = [];
      let currentChunk = '';
      let englishWordIndex = 0;
      let japaneseCharIndex = 0;
      
      for (let i = 0; i < cleanJapaneseText.length; i++) {
        const char = cleanJapaneseText[i];
        
        // Add character to current chunk
        currentChunk += char;
        
        // Skip punctuation for character counting
        if (!/[。、！？：；]/.test(char)) {
          japaneseCharIndex++;
        }
        
        // Check if we should end the current chunk
        if (englishWordIndex < englishWords.length) {
          const currentEnglishWord = englishWords[englishWordIndex];
          const englishWordChars = currentEnglishWord.replace(/[^a-zA-Z]/g, '').length;
          
          // Calculate how many Japanese characters should correspond to this English word
          const expectedJapaneseChars = Math.round((englishWordChars / totalEnglishChars) * totalJapaneseChars);
          
          // End chunk when we've reached the expected number of Japanese characters
          if (japaneseCharIndex >= expectedJapaneseChars) {
            chunks.push(currentChunk);
            currentChunk = '';
            englishWordIndex++;
            japaneseCharIndex = 0;
          }
        }
      }
      
      // Add any remaining chunk
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      
      return chunks.filter(chunk => chunk.length > 0);
    } catch (error) {
      console.error('Japanese text chunking error:', error);
      // Fallback: return the whole text as one chunk
      return [japaneseText.replace(/\([^)]*\)/g, '').trim()];
    }
  },

  // Generate audio for text
  async generateAudio(text: string, englishText: string, languageCode: string = 'es-es'): Promise<string> {
    if (!GOOGLE_PROJECT_ID || !GOOGLE_KEY_FILENAME) {
      throw new Error('Google Cloud credentials (PROJECT_ID and KEY_FILENAME) are not set in environment variables.');
    }
    try {
      await ensureAudioDirectory();
      
      const voice = getVoiceForLanguage(languageCode);
      console.log(`[TTS REQUEST] Generating audio for text: "${text}"`);
      console.log(`[TTS REQUEST] Language code: "${languageCode}" -> Voice: ${voice.languageCode}/${voice.name}`);
      
      const request = {
        input: { text },
        voice: {
          languageCode: voice.languageCode,
          name: voice.name,
          ssmlGender: 'FEMALE' as const,
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
          speakingRate: 0.8,
          pitch: 0,
        },
      };

      console.log(`[TTS REQUEST] Sending request to Google Cloud TTS:`, JSON.stringify(request, null, 2));

      const [response] = await textToSpeechClient.synthesizeSpeech(request);
      
      if (!response.audioContent) {
        throw new Error('No audio content received');
      }

      // Create standardized filename: sanitized English text + language code
      const sanitizedEnglish = englishText
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50); // Limit length
      
      const audioFileName = `${sanitizedEnglish}_${languageCode}.mp3`;
      const audioPath = path.join(AUDIO_DIR, audioFileName);
      await fs.writeFile(audioPath, response.audioContent, 'binary');
      
      console.log(`[TTS REQUEST] Successfully generated audio: ${audioFileName}`);
      
      return `/audio/${audioFileName}`;
    } catch (error) {
      console.error('[TTS REQUEST] Audio generation error:', error);
      if (error instanceof Error) {
        throw new Error(`Audio generation failed: ${error.message}`);
      }
      throw new Error('Audio generation failed');
    }
  },

  // Process sentence: translate and generate audio
  async processSentence(englishSentence: string, sentenceId: string): Promise<{
    translation: string;
    audioPath: string;
  }> {
    try {
      // Translate the sentence
      const translation = await this.translateToSpanish(englishSentence);
      
      // Generate audio for the Spanish translation
      const audioPath = await this.generateAudio(translation, englishSentence, 'es-es');
      
      return {
        translation,
        audioPath,
      };
    } catch (error) {
      console.error('Sentence processing error:', error);
      throw error;
    }
  },

  // Translate a single romaji word to its Japanese chunk in context
  async translateRomajiWordToJapaneseChunk(japaneseText: string, romajiWord: string, fullRomaji: string): Promise<string> {
    try {
      // Clean the Japanese text (remove romaji in parentheses)
      const cleanJapaneseText = japaneseText.replace(/\([^)]*\)/g, '').trim();
      
      // Split romaji into words
      const romajiWords = fullRomaji.split(/\s+/).filter(w => w.length > 0);
      
      // Find the index of the current romaji word
      const currentWordIndex = romajiWords.findIndex(w => 
        w.replace(/[^a-zA-Z]/g, '').toLowerCase() === romajiWord.replace(/[^a-zA-Z]/g, '').toLowerCase()
      );
      
      if (currentWordIndex === -1) {
        return cleanJapaneseText;
      }
      
      // Split Japanese text into the same number of chunks as romaji words
      const japaneseChunks = this.splitJapaneseIntoChunks(cleanJapaneseText, romajiWords.length);
      
      if (currentWordIndex < japaneseChunks.length) {
        return japaneseChunks[currentWordIndex];
      }
      
      return cleanJapaneseText;
    } catch (error) {
      console.error('Error in translateRomajiWordToJapaneseChunk:', error);
      return japaneseText.replace(/\([^)]*\)/g, '').trim();
    }
  },

  // Split Japanese text into N contiguous chunks, favoring longer chunks at the start
  splitJapaneseIntoChunks(text: string, numChunks: number): string[] {
    if (numChunks <= 1) {
      return [text];
    }
    const chars = text.split('');
    const total = chars.length;
    const baseSize = Math.floor(total / numChunks);
    let remainder = total % numChunks;
    let idx = 0;
    const chunks: string[] = [];
    for (let i = 0; i < numChunks; i++) {
      let size = baseSize + (remainder > 0 ? 1 : 0);
      remainder--;
      const chunk = chars.slice(idx, idx + size).join('');
      chunks.push(chunk);
      idx += size;
    }
    return chunks.filter(chunk => chunk.length > 0);
  },

  // Helper function to determine character type
  getCharacterType(char: string): 'hiragana' | 'katakana' | 'kanji' | 'romaji' | 'other' {
    if (/[\u3040-\u309F]/.test(char)) return 'hiragana';
    if (/[\u30A0-\u30FF]/.test(char)) return 'katakana';
    if (/[\u4E00-\u9FAF]/.test(char)) return 'kanji';
    if (/[a-zA-Z]/.test(char)) return 'romaji';
    return 'other';
  },

  // Convert each romaji word to a Japanese chunk using wanakana
  async convertRomajiWordsToKanaChunks(fullRomaji: string): Promise<string[]> {
    const romajiWords = fullRomaji.split(/\s+/).filter(w => w.length > 0);
    const chunks: string[] = [];

    for (const romajiWord of romajiWords) {
      // Pre-process the romaji word to remove any characters that might confuse the conversion
      const cleanRomaji = romajiWord.replace(/[.,!?;:]/g, '');
      
      // Convert the clean romaji directly to kana.
      const kana = wanakana.toKana(cleanRomaji);
      chunks.push(kana);
    }
    
    // As a final step, let's combine the last two chunks if the last one is just punctuation.
    // This handles cases like "ka?" -> "か?" -> ["か", "?"] -> "か?"
    if (chunks.length > 1) {
        const lastChunk = chunks[chunks.length - 1];
        if (['。', '、', '！', '？'].includes(lastChunk)) {
            const secondLastChunk = chunks[chunks.length - 2];
            chunks.splice(chunks.length - 2, 2, secondLastChunk + lastChunk);
        }
    }

    return chunks;
  },
}; 
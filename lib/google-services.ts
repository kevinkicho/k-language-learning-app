import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { Translate } from '@google-cloud/translate/build/src/v2';
import { Storage } from '@google-cloud/storage';
import fs from 'fs/promises';
import path from 'path';
import * as wanakana from 'wanakana';

const GOOGLE_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');

// Initialize Google Cloud Storage with Application Default Credentials
const storage = new Storage({
  projectId: GOOGLE_PROJECT_ID,
});

const BUCKET_NAME = `${GOOGLE_PROJECT_ID}-audio-files`;
const BUCKET = storage.bucket(BUCKET_NAME);

const textToSpeechClient = new TextToSpeechClient({
  projectId: GOOGLE_PROJECT_ID,
});

const translate = new Translate({
  projectId: GOOGLE_PROJECT_ID,
});

// Ensure audio directory exists (for local development)
async function ensureAudioDirectory(): Promise<void> {
  try {
    await fs.access(AUDIO_DIR);
  } catch {
    await fs.mkdir(AUDIO_DIR, { recursive: true });
  }
}

// Upload audio file to Google Cloud Storage
async function uploadAudioToCloudStorage(audioBuffer: Buffer, fileName: string): Promise<string> {
  try {
    // Ensure bucket exists
    const [exists] = await BUCKET.exists();
    if (!exists) {
      console.log(`[CLOUD STORAGE] Creating bucket: ${BUCKET_NAME}`);
      await BUCKET.create();
      // Make bucket public for audio file access
      await BUCKET.makePublic();
    }

    // Upload file
    const file = BUCKET.file(fileName);
    await file.save(audioBuffer, {
      metadata: {
        contentType: 'audio/mpeg',
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
    });

    // Make file publicly readable
    await file.makePublic();

    // Return public URL
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`;
    console.log(`[CLOUD STORAGE] Audio uploaded: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('[CLOUD STORAGE] Upload error:', error);
    throw new Error(`Failed to upload audio to Cloud Storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Check if audio file exists in Cloud Storage
async function audioExistsInCloudStorage(fileName: string): Promise<boolean> {
  try {
    const file = BUCKET.file(fileName);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error('[CLOUD STORAGE] Check existence error:', error);
    return false;
  }
}

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
      return { languageCode: 'cmn-CN', name: 'cmn-CN-Standard-A' };
    default:
      console.log(`[VOICE MAPPING] Unknown language code: "${languageCode}", falling back to Spanish`);
      return { languageCode: 'es-ES', name: 'es-ES-Neural2-A' };
  }
}

// Get fallback voices for Chinese if the primary voice fails
function getChineseFallbackVoices(): Array<{ languageCode: string; name: string }> {
  return [
    { languageCode: 'cmn-CN', name: 'cmn-CN-Standard-A' },
    { languageCode: 'cmn-CN', name: 'cmn-CN-Standard-B' },
    { languageCode: 'cmn-CN', name: 'cmn-CN-Wavenet-A' },
    { languageCode: 'cmn-CN', name: 'cmn-CN-Wavenet-B' },
    { languageCode: 'cmn-CN', name: 'cmn-CN-Chirp3-HD-Achernar' },
    { languageCode: 'cmn-CN', name: 'cmn-CN-Chirp3-HD-Aoede' },
  ];
}

// Function to list available voices for debugging
export async function listAvailableVoices(languageCode: string = 'zh-CN'): Promise<void> {
  try {
    console.log(`[VOICE DEBUG] Listing available voices for language: ${languageCode}`);
    const [voices] = await textToSpeechClient.listVoices({ languageCode });
    
    if (voices.voices) {
      console.log(`[VOICE DEBUG] Found ${voices.voices.length} voices for ${languageCode}:`);
      voices.voices.forEach(voice => {
        console.log(`[VOICE DEBUG] - ${voice.name} (${voice.languageCodes?.join(', ')})`);
      });
    } else {
      console.log(`[VOICE DEBUG] No voices found for ${languageCode}`);
    }
  } catch (error) {
    console.error('[VOICE DEBUG] Error listing voices:', error);
  }
}

// Standalone function for generating audio (returns Buffer)
export async function generateAudio(text: string, language: string): Promise<Buffer> {
  console.log(`[generateAudio] Starting for text: "${text}", lang: "${language}"`);
  console.log(`[generateAudio] Project ID: ${GOOGLE_PROJECT_ID}`);
  console.log(`[generateAudio] TTS Client initialized: ${!!textToSpeechClient}`);
  
  if (!GOOGLE_PROJECT_ID) {
    console.error('[generateAudio] Missing GOOGLE_PROJECT_ID');
    throw new Error('Google Cloud PROJECT_ID is not set in environment variables.');
  }

  const languageCode = language || 'es-es';
  
  // Special handling for Chinese - try multiple voices
  if (languageCode === 'zh-cn') {
    // First, let's see what voices are actually available
    await listAvailableVoices('zh-CN');
    
    const fallbackVoices = getChineseFallbackVoices();
    let lastError: Error | null = null;
    
    for (const voice of fallbackVoices) {
      try {
        console.log(`[generateAudio] Trying Chinese voice: ${voice.name}`);
        
        const request = {
          input: { text },
          voice: {
            languageCode: voice.languageCode,
            name: voice.name,
          },
          audioConfig: {
            audioEncoding: 'MP3' as const,
            speakingRate: 0.9,
            pitch: 0,
          },
        };

        console.log(`[generateAudio] Sending TTS request:`, JSON.stringify(request, null, 2));

        const [response] = await textToSpeechClient.synthesizeSpeech(request);
        
        if (!response.audioContent) {
          throw new Error('No audio content received from Google TTS');
        }

        console.log(`[generateAudio] Successfully received ${response.audioContent.length} bytes of audio data using voice: ${voice.name}`);
        return Buffer.from(response.audioContent);
      } catch (error) {
        console.log(`[generateAudio] Voice ${voice.name} failed:`, error instanceof Error ? error.message : 'Unknown error');
        console.log(`[generateAudio] Voice ${voice.name} error details:`, {
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined
        });
        lastError = error instanceof Error ? error : new Error('Unknown error');
        continue; // Try next voice
      }
    }
    
    // If all voices failed
    console.error('[generateAudio] All Chinese voices failed');
    throw new Error(`All Chinese voices failed. Last error: ${lastError?.message}`);
  }
  
  // For other languages, use the standard approach
  try {
    const voice = getVoiceForLanguage(languageCode);
    console.log(`[generateAudio] Using voice: ${voice.languageCode}/${voice.name}`);
    
    const request = {
      input: { text },
      voice: {
        languageCode: voice.languageCode,
        name: voice.name,
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: 0.9,
        pitch: 0,
      },
    };

    console.log(`[generateAudio] Sending TTS request:`, JSON.stringify(request, null, 2));

    const [response] = await textToSpeechClient.synthesizeSpeech(request);
    
    if (!response.audioContent) {
      throw new Error('No audio content received from Google TTS');
    }

    console.log(`[generateAudio] Successfully received ${response.audioContent.length} bytes of audio data.`);
    return Buffer.from(response.audioContent);
  } catch (error) {
    console.error('[generateAudio] Full error from Google TTS Client:', error);
    console.error('[generateAudio] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    if (error instanceof Error) {
        throw new Error(`Google TTS Error: ${error.message}`);
    }
    throw new Error('Audio generation failed with an unknown error.');
  }
}

export const googleServices = {
  // Translate text to Spanish
  async translateToSpanish(text: string): Promise<string> {
    if (!GOOGLE_PROJECT_ID) {
      throw new Error('Google Cloud PROJECT_ID is not set in environment variables.');
    }
    try {
      const [translation] = await translate.translate(text, 'es');
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Translate Japanese text to English
  async translateJapaneseToEnglish(text: string): Promise<string> {
    if (!GOOGLE_PROJECT_ID) {
      throw new Error('Google Cloud PROJECT_ID is not set in environment variables.');
    }
    try {
      const [translation] = await translate.translate(text, { from: 'ja', to: 'en' });
      return translation;
    } catch (error) {
      console.error('Japanese translation error:', error);
      throw new Error(`Japanese translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Chunk Japanese text into smaller pieces
  async chunkJapaneseText(japaneseText: string): Promise<string[]> {
    try {
      // Remove romaji in parentheses and clean the text
      const cleanText = japaneseText.replace(/\([^)]*\)/g, '').trim();
      
      // Split by common Japanese punctuation and particles
      const chunks = cleanText
        .split(/[。、！？\s]+/)
        .filter(chunk => chunk.length > 0)
        .map(chunk => chunk.trim())
        .filter(chunk => chunk.length > 0);
      
      // If chunks are too long, split them further
      const maxChunkLength = 10; // Maximum characters per chunk
      const finalChunks: string[] = [];
      
      for (const chunk of chunks) {
        if (chunk.length <= maxChunkLength) {
          finalChunks.push(chunk);
        } else {
          // Split long chunks by character type boundaries
          const subChunks = this.splitJapaneseIntoChunks(chunk, Math.ceil(chunk.length / maxChunkLength));
          finalChunks.push(...subChunks);
        }
      }
      
      console.log(`[CHUNK] Split "${japaneseText}" into ${finalChunks.length} chunks:`, finalChunks);
      return finalChunks;
    } catch (error) {
      console.error('Japanese chunking error:', error);
      // Return the original text as a single chunk if chunking fails
      return [japaneseText];
    }
  },

  // Generate audio and save to Cloud Storage
  async generateAudio(text: string, englishText: string, languageCode: string = 'es-es'): Promise<string> {
    if (!GOOGLE_PROJECT_ID) {
      throw new Error('Google Cloud PROJECT_ID is not set in environment variables.');
    }

    try {
      // Create standardized filename: sanitized English text + language code
      const sanitizedEnglish = englishText
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50); // Limit length
      
      const audioFileName = `${sanitizedEnglish}_${languageCode}.mp3`;
      
      // Check if audio already exists in Cloud Storage
      const exists = await audioExistsInCloudStorage(audioFileName);
      if (exists) {
        const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${audioFileName}`;
        console.log(`[TTS REQUEST] Audio already exists in Cloud Storage: ${publicUrl}`);
        return publicUrl;
      }

      console.log(`[TTS REQUEST] Generating audio for text: "${text}"`);
      console.log(`[TTS REQUEST] Language code: "${languageCode}"`);
      
      // Special handling for Chinese - try multiple voices
      if (languageCode === 'zh-cn') {
        // First, let's see what voices are actually available
        await listAvailableVoices('zh-CN');
        
        const fallbackVoices = getChineseFallbackVoices();
        let lastError: Error | null = null;
        
        for (const voice of fallbackVoices) {
          try {
            console.log(`[TTS REQUEST] Trying Chinese voice: ${voice.name}`);
            
            const request = {
              input: { text },
              voice: {
                languageCode: voice.languageCode,
                name: voice.name,
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

            // Upload to Cloud Storage
            const audioBuffer = Buffer.from(response.audioContent);
            const publicUrl = await uploadAudioToCloudStorage(audioBuffer, audioFileName);
            
            console.log(`[TTS REQUEST] Successfully generated audio using voice ${voice.name}: ${publicUrl}`);
            
            return publicUrl;
          } catch (error) {
            console.log(`[TTS REQUEST] Voice ${voice.name} failed:`, error instanceof Error ? error.message : 'Unknown error');
            lastError = error instanceof Error ? error : new Error('Unknown error');
            continue; // Try next voice
          }
        }
        
        // If all voices failed, try without specifying a specific voice name
        try {
          console.log(`[TTS REQUEST] Trying Chinese with language code only (no specific voice)`);
          
          const request = {
            input: { text },
            voice: {
              languageCode: 'cmn-CN',
              // No name specified - let Google choose
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

          // Upload to Cloud Storage
          const audioBuffer = Buffer.from(response.audioContent);
          const publicUrl = await uploadAudioToCloudStorage(audioBuffer, audioFileName);
          
          console.log(`[TTS REQUEST] Successfully generated audio using default voice: ${publicUrl}`);
          
          return publicUrl;
        } catch (error) {
          console.log(`[TTS REQUEST] Default voice also failed:`, error instanceof Error ? error.message : 'Unknown error');
          lastError = error instanceof Error ? error : new Error('Unknown error');
        }
        
        // If all voices failed
        console.error('[TTS REQUEST] All Chinese voices failed');
        throw new Error(`All Chinese voices failed. Last error: ${lastError?.message}`);
      }
      
      // For other languages, use the standard approach
      const voice = getVoiceForLanguage(languageCode);
      console.log(`[TTS REQUEST] Language code: "${languageCode}" -> Voice: ${voice.languageCode}/${voice.name}`);
      
      const request = {
        input: { text },
        voice: {
          languageCode: voice.languageCode,
          name: voice.name,
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

      // Upload to Cloud Storage
      const audioBuffer = Buffer.from(response.audioContent);
      const publicUrl = await uploadAudioToCloudStorage(audioBuffer, audioFileName);
      
      console.log(`[TTS REQUEST] Successfully generated audio: ${publicUrl}`);
      
      return publicUrl;
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
      
      // Split Japanese text into chunks (roughly one per romaji word)
      const japaneseChunks = this.splitJapaneseIntoChunks(cleanJapaneseText, romajiWords.length);
      
      // Return the chunk corresponding to the current word
      if (japaneseChunks[currentWordIndex]) {
        return japaneseChunks[currentWordIndex];
      }
      
      return cleanJapaneseText;
    } catch (error) {
      console.error('Romaji translation error:', error);
      return japaneseText;
    }
  },

  // Split Japanese text into chunks
  splitJapaneseIntoChunks(text: string, numChunks: number): string[] {
    if (numChunks <= 1) {
      return [text];
    }
    
    const chunks: string[] = [];
    const chunkSize = Math.ceil(text.length / numChunks);
    
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    
    return chunks;
  },

  // Get character type for Japanese text analysis
  getCharacterType(char: string): 'hiragana' | 'katakana' | 'kanji' | 'romaji' | 'other' {
    if (wanakana.isHiragana(char)) return 'hiragana';
    if (wanakana.isKatakana(char)) return 'katakana';
    if (wanakana.isKanji(char)) return 'kanji';
    if (/[a-zA-Z]/.test(char)) return 'romaji';
    return 'other';
  },

  // Convert romaji words to kana chunks
  async convertRomajiWordsToKanaChunks(fullRomaji: string): Promise<string[]> {
    try {
      const words = fullRomaji.split(/\s+/).filter(w => w.length > 0);
      const chunks: string[] = [];
      
      for (const word of words) {
        const kana = wanakana.toHiragana(word);
        chunks.push(kana);
      }
      
      return chunks;
    } catch (error) {
      console.error('Romaji to kana conversion error:', error);
      return [fullRomaji];
    }
  },
}; 
import { Translate } from '@google-cloud/translate/build/src/v2';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import path from 'path';
import fs from 'fs/promises';

const GOOGLE_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const GOOGLE_KEY_FILENAME = process.env.GOOGLE_CLOUD_KEY_FILENAME;

// Initialize Google Cloud clients with environment variables
const translate = new Translate({
  projectId: GOOGLE_PROJECT_ID,
  keyFilename: GOOGLE_KEY_FILENAME,
});

const textToSpeechClient = new TextToSpeechClient({
  projectId: GOOGLE_PROJECT_ID,
  keyFilename: GOOGLE_KEY_FILENAME,
});

// Ensure audio directory exists
const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio');

async function ensureAudioDirectory() {
  try {
    await fs.access(AUDIO_DIR);
  } catch {
    await fs.mkdir(AUDIO_DIR, { recursive: true });
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
    default:
      // Fallback to Spanish if unknown language
      console.log(`[VOICE MAPPING] Unknown language code: "${languageCode}", falling back to Spanish`);
      return { languageCode: 'es-ES', name: 'es-ES-Neural2-A' };
  }
}

// Standalone function for generating audio (returns Buffer)
export async function generateAudio(text: string, language: string = 'es-es'): Promise<Buffer> {
  if (!GOOGLE_PROJECT_ID || !GOOGLE_KEY_FILENAME) {
    throw new Error('Google Cloud credentials (PROJECT_ID and KEY_FILENAME) are not set in environment variables.');
  }

  try {
    const voice = getVoiceForLanguage(language);
    
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
      throw new Error('No audio content received');
    }

    return Buffer.from(response.audioContent);
  } catch (error) {
    console.error('Audio generation error:', error);
    throw new Error('Audio generation failed');
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
  }
}; 
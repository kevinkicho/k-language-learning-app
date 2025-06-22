import { Translate } from '@google-cloud/translate/build/src/v2';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import path from 'path';
import fs from 'fs/promises';

// Initialize Google Cloud clients
const translate = new Translate({
  keyFilename: path.join(process.cwd(), 'translate032625-47af80242d72.json'),
});

const textToSpeechClient = new TextToSpeechClient({
  keyFilename: path.join(process.cwd(), 'translate032625-47af80242d72.json'),
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

// Standalone function for generating audio (returns Buffer)
export async function generateAudio(text: string, language: string = 'es-ES'): Promise<Buffer> {
  try {
    const request = {
      input: { text },
      voice: {
        languageCode: language,
        name: language === 'es-ES' ? 'es-ES-Neural2-A' : 'en-US-Neural2-F',
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
    try {
      const [translation] = await translate.translate(text, 'es');
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Translation failed');
    }
  },

  // Generate audio for text
  async generateAudio(text: string, sentenceId: string): Promise<string> {
    try {
      await ensureAudioDirectory();
      
      const request = {
        input: { text },
        voice: {
          languageCode: 'es-ES',
          name: 'es-ES-Neural2-A',
          ssmlGender: 'FEMALE' as const,
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
          speakingRate: 0.8,
          pitch: 0,
        },
      };

      const [response] = await textToSpeechClient.synthesizeSpeech(request);
      
      if (!response.audioContent) {
        throw new Error('No audio content received');
      }

      const audioPath = path.join(AUDIO_DIR, `${sentenceId}.mp3`);
      await fs.writeFile(audioPath, response.audioContent, 'binary');
      
      return `/audio/${sentenceId}.mp3`;
    } catch (error) {
      console.error('Audio generation error:', error);
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
      const audioPath = await this.generateAudio(translation, sentenceId);
      
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
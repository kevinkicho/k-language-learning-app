import { NextRequest, NextResponse } from 'next/server';
import { databaseDrizzle } from '@/lib/database-drizzle';
import { googleServices, generateAudio } from '@/lib/google-services';
import { Storage } from '@google-cloud/storage';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Function to sanitize filename by replacing invalid characters
function sanitizeFilename(text: string): string {
  return text
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid filename characters with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/__+/g, '_') // Replace multiple underscores with single underscore
    .trim();
}

// Function to create a unique filename for a word
function createUniqueFilename(text: string, language: string): string {
  const sanitizedWord = sanitizeFilename(text);
  // Create a hash of the original text to ensure uniqueness
  const hash = crypto.createHash('md5').update(`${text}_${language}`).digest('hex').substring(0, 8);
  return `${sanitizedWord}_${hash}_word`;
}

const GOOGLE_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const BUCKET_NAME = `${GOOGLE_PROJECT_ID}-audio-files`;
const storage = new Storage({ projectId: GOOGLE_PROJECT_ID });
const BUCKET = storage.bucket(BUCKET_NAME);

export async function POST(request: NextRequest) {
  try {
    const { text, language = 'es-es' } = await request.json();
    
    console.log(`[WORD AUDIO API] Requested word: "${text}", language: "${language}"`);
    console.log(`[WORD AUDIO API] Service account: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || 'Using default credentials'}`);
    console.log(`[WORD AUDIO API] Project ID: ${GOOGLE_PROJECT_ID}`);
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }
    
    // Check if audio is already cached
    const cachedAudio = await databaseDrizzle.getWordAudio(text, language);
    if (cachedAudio) {
      // Check if the file actually exists
      const audioPath = path.join(process.cwd(), 'public', cachedAudio.audioPath);
      try {
        const fileBuffer = await fs.readFile(audioPath);
        
        // Check if file is too small (likely corrupted)
        if (fileBuffer.length < 1000) {
          console.error(`[AUDIO ERROR] File for "${text}" is too small (${fileBuffer.length} bytes). Deleting and regenerating...`);
          await databaseDrizzle.deleteWordAudio(text, language);
        } else {
          console.log(`Serving cached audio for "${text}" (${fileBuffer.length} bytes)`);
          return new NextResponse(fileBuffer, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'public, max-age=31536000', // 1 year
            },
          });
        }
      } catch (err) {
        console.error(`[AUDIO ERROR] File for "${text}" not found. Deleting cache and regenerating...`, err);
        await databaseDrizzle.deleteWordAudio(text, language);
      }
    }
    
    // Generate new audio using the correct method
    console.log(`[WORD AUDIO API] Generating audio for word: "${text}"`);
    
    // For Japanese single kana/particle, use the particle as-is
    // The TTS should be able to pronounce single kana naturally
    let ttsInput = text;

    // Create a unique filename for this word
    const uniqueText = createUniqueFilename(text, language);
    
    // Use the standalone generateAudio function that returns a Buffer
    try {
      const audioFileName = `${uniqueText}.mp3`;
      const file = BUCKET.file(audioFileName);
      let exists = false;
      try {
        const [fileExists] = await file.exists();
        exists = fileExists;
        console.log(`[WORD AUDIO API] File ${audioFileName} exists in GCS: ${exists}`);
      } catch (err) {
        console.error('[WORD AUDIO API] Error checking file existence in GCS:', err);
      }
      
      if (!exists) {
        console.log(`[WORD AUDIO API] File doesn't exist, generating audio with TTS...`);
        console.log(`[WORD AUDIO API] TTS Input: "${ttsInput}", Language: "${language}"`);
        
        // Generate audio using the standalone function
        const audioBuffer = await generateAudio(ttsInput, language);
        console.log(`[WORD AUDIO API] TTS generated ${audioBuffer.length} bytes of audio`);
        
        // Upload to Google Cloud Storage
        console.log(`[WORD AUDIO API] Uploading ${audioBuffer.length} bytes to GCS as ${audioFileName}`);
        await file.save(audioBuffer, {
          metadata: {
            contentType: 'audio/mpeg',
            cacheControl: 'public, max-age=31536000', // Cache for 1 year
          },
        });
        
        // Make file publicly readable
        await file.makePublic();
        console.log(`[WORD AUDIO API] Successfully uploaded and made public: ${audioFileName}`);
      } else {
        console.log(`[WORD AUDIO API] File already exists in GCS: ${audioFileName}`);
      }
      
      // Now fetch the file from GCS and stream it to the client
      try {
        console.log(`[WORD AUDIO API] Downloading file from GCS: ${audioFileName}`);
        const [buffer] = await file.download();
        console.log(`[WORD AUDIO API] Downloaded ${buffer.length} bytes from GCS`);
        
        if (!buffer || buffer.length < 1000) {
          console.error(`[WORD AUDIO API] Downloaded audio for "${text}" is too small or empty (${buffer?.length || 0} bytes).`);
          return NextResponse.json(
            { error: 'Audio file is too small or corrupt after generation.' },
            { status: 500 }
          );
        }
        
        console.log(`[WORD AUDIO API] Successfully serving audio for "${text}" (${buffer.length} bytes)`);
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=31536000',
          },
        });
      } catch (err) {
        console.error('[WORD AUDIO API] Error downloading audio from GCS:', err);
        return NextResponse.json(
          { error: 'Failed to fetch audio from storage.' },
          { status: 500 }
        );
      }
    } catch (ttsError) {
      console.error(`[WORD AUDIO API] Google TTS failed for "${text}":`, ttsError);
      console.error(`[WORD AUDIO API] TTS Error details:`, {
        message: ttsError instanceof Error ? ttsError.message : 'Unknown error',
        stack: ttsError instanceof Error ? ttsError.stack : undefined,
        name: ttsError instanceof Error ? ttsError.name : undefined
      });
      return NextResponse.json(
        { error: `Failed to generate audio: ${ttsError instanceof Error ? ttsError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[WORD AUDIO API] Unexpected error in audio/word/route:', error);
    console.error('[WORD AUDIO API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    );
  }
} 
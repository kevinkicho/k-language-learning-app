import { NextRequest, NextResponse } from 'next/server';
import { databaseDrizzle } from '@/lib/database-drizzle';
import { googleServices } from '@/lib/google-services';
import { promises as fs } from 'fs';
import path from 'path';

// Function to sanitize filename by replacing invalid characters
function sanitizeFilename(text: string): string {
  return text
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid filename characters with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/__+/g, '_') // Replace multiple underscores with single underscore
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const { text, language = 'es-ES' } = await request.json();
    
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
          console.log(`Cached audio file for "${text}" is too small (${fileBuffer.length} bytes), removing from cache and regenerating...`);
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
      } catch {
        // File doesn't exist, remove from cache and regenerate
        console.log(`Cached audio file not found for "${text}", removing from cache and regenerating...`);
        await databaseDrizzle.deleteWordAudio(text, language);
      }
    }
    
    // Generate new audio using the correct method
    console.log(`Generating audio for word: "${text}"`);
    
    // Sanitize the filename to prevent path issues
    const sanitizedText = sanitizeFilename(text);
    const filename = `word_${sanitizedText}`;
    
    // Use the googleServices.generateAudio method that saves to file
    const audioPath = await googleServices.generateAudio(text, filename);
    
    // Read the generated file
    const filePath = path.join(process.cwd(), 'public', audioPath);
    const audioBuffer = await fs.readFile(filePath);
    
    console.log(`Generated audio for "${text}" (${audioBuffer.length} bytes)`);
    
    // Cache the audio path
    await databaseDrizzle.saveWordAudio(text, language, audioPath);
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000', // 1 year
      },
    });
  } catch (error) {
    console.error('Error generating word audio:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    );
  }
} 
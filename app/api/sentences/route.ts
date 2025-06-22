import { NextRequest, NextResponse } from 'next/server';
import { databaseDrizzle } from '@/lib/database-drizzle';
import { googleServices } from '@/lib/google-services';

export async function GET() {
  try {
    const sentences = await databaseDrizzle.getAllSentences();
    return NextResponse.json(sentences);
  } catch (error) {
    console.error('Error fetching sentences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sentences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { englishSentence } = await request.json();
    
    if (!englishSentence || typeof englishSentence !== 'string') {
      return NextResponse.json(
        { error: 'English sentence is required' },
        { status: 400 }
      );
    }
    
    // Check if translation is already cached
    const cachedTranslation = await databaseDrizzle.getTranslation(englishSentence);
    let translation: string | undefined;
    let audioPath: string | undefined;
    
    if (cachedTranslation) {
      // Use cached translation
      translation = cachedTranslation.spanishText;
    } else {
      // Generate new translation and cache it
      try {
        translation = await googleServices.translateToSpanish(englishSentence);
        await databaseDrizzle.saveTranslation(englishSentence, translation);
      } catch (googleError) {
        console.error('Translation error:', googleError);
        // Continue without translation
      }
    }
    
    // First, add the sentence to database
    const sentence = await databaseDrizzle.addSentence(englishSentence, translation);
    
    // Generate audio if we have a translation
    if (translation && !cachedTranslation) {
      try {
        audioPath = await googleServices.generateAudio(translation, sentence.id);
        await databaseDrizzle.updateSentence(sentence.id, translation, audioPath);
      } catch (audioError) {
        console.error('Audio generation error:', audioError);
        // Continue without audio
      }
    }
    
    // Return the final sentence
    const finalSentence = await databaseDrizzle.getSentenceById(sentence.id);
    return NextResponse.json(finalSentence, { status: 201 });
  } catch (error) {
    console.error('Error adding sentence:', error);
    return NextResponse.json(
      { error: 'Failed to add sentence' },
      { status: 500 }
    );
  }
} 
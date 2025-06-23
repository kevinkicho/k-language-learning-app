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
    const { englishSentence, quizGroup } = await request.json();
    
    if (!englishSentence || typeof englishSentence !== 'string') {
      return NextResponse.json(
        { error: 'English sentence is required' },
        { status: 400 }
      );
    }
    
    // Check if sentence already exists first
    const existingSentence = await databaseDrizzle.findSentenceByEnglishText(englishSentence);
    if (existingSentence) {
      console.log(`Sentence already exists: "${englishSentence}"`);
      return NextResponse.json(existingSentence, { status: 200 });
    }
    
    // Check if translation is already cached
    const cachedTranslation = await databaseDrizzle.getTranslation(englishSentence);
    let translation: string | undefined;
    let audioPath: string | undefined;
    let usedCachedTranslation = false;
    
    if (cachedTranslation) {
      // Use cached translation
      translation = cachedTranslation.spanishText;
      usedCachedTranslation = true;
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
    
    // First, add the sentence to database with quizGroup
    const sentence = await databaseDrizzle.addSentence(englishSentence, translation, quizGroup);
    
    // Always try to generate audio if we have a translation
    if (translation) {
      try {
        audioPath = await googleServices.generateAudio(translation, sentence.id);
        await databaseDrizzle.updateSentence(sentence.id, translation, audioPath);
        console.log(`Audio generated and saved for sentence: ${sentence.id}, path: ${audioPath}`);
      } catch (audioError) {
        console.error('Audio generation error:', audioError);
        // Continue without audio
      }
    } else {
      console.warn('No translation available, skipping audio generation.');
    }
    
    // Return the final sentence
    const finalSentence = await databaseDrizzle.getSentenceById(sentence.id);
    if (!finalSentence?.audioPath) {
      console.warn(`No audioPath for sentence: ${sentence.id}. The play button will not appear.`);
    }
    return NextResponse.json(finalSentence, { status: 201 });
  } catch (error) {
    console.error('Error adding sentence:', error);
    return NextResponse.json(
      { error: 'Failed to add sentence' },
      { status: 500 }
    );
  }
} 
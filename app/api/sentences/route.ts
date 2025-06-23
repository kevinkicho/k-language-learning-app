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
    const { englishSentence, spanishSentence, quizGroup, languageCode = 'es-es' } = await request.json();
    
    if (!englishSentence || typeof englishSentence !== 'string') {
      return NextResponse.json(
        { error: 'English sentence is required' },
        { status: 400 }
      );
    }
    
    const existingSentence = await databaseDrizzle.findSentenceByEnglishText(englishSentence);
    if (existingSentence) {
      return NextResponse.json(existingSentence, { status: 200 });
    }
    
    let translation: string | undefined = spanishSentence;
    let audioPath: string | undefined;

    // If a Spanish sentence is NOT provided by the AI, then try to translate
    if (!translation) {
      const cachedTranslation = await databaseDrizzle.getTranslation(englishSentence);
      if (cachedTranslation) {
        translation = cachedTranslation.spanishText;
      } else {
        try {
          translation = await googleServices.translateToSpanish(englishSentence);
          await databaseDrizzle.saveTranslation(englishSentence, translation);
        } catch (googleError) {
          console.error('Translation error:', googleError);
          console.log('Continuing without translation due to Google service error');
        }
      }
    }
    
    const sentence = await databaseDrizzle.addSentence(englishSentence, translation, quizGroup, languageCode);
    
    if (translation) {
      try {
        audioPath = await googleServices.generateAudio(translation, englishSentence, languageCode);
        await databaseDrizzle.updateSentence(sentence.id, translation, audioPath);
      } catch (audioError) {
        console.error('Audio generation error:', audioError);
        console.log('Continuing without audio due to Google service error');
      }
    } else {
      console.warn('No translation available, skipping audio generation.');
    }
    
    const finalSentence = await databaseDrizzle.getSentenceById(sentence.id);
    if (!finalSentence?.audioPath) {
      console.warn(`No audioPath for sentence: ${sentence.id}. The play button will not appear.`);
    }
    return NextResponse.json(finalSentence, { status: 201 });
  } catch (error) {
    console.error('Error adding sentence:', error);
    
    let errorMessage = 'Failed to add sentence';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 
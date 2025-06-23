import { NextRequest, NextResponse } from 'next/server';
import { databaseDrizzle } from '@/lib/database-drizzle';
import { googleServices } from '@/lib/google-services';

export async function POST(request: NextRequest) {
  try {
    const { sentenceId } = await request.json();
    
    if (sentenceId) {
      // Regenerate audio for a specific sentence
      const sentence = await databaseDrizzle.getSentenceById(sentenceId);
      if (!sentence) {
        return NextResponse.json({ error: 'Sentence not found' }, { status: 404 });
      }
      
      if (!sentence.spanishTranslation) {
        return NextResponse.json({ error: 'No Spanish translation available' }, { status: 400 });
      }
      
      try {
        const audioPath = await googleServices.generateAudio(
          sentence.spanishTranslation, 
          sentence.englishSentence, 
          'es-es'
        );
        await databaseDrizzle.updateSentence(sentence.id, undefined, audioPath);
        
        return NextResponse.json({ 
          success: true, 
          audioPath,
          message: `Audio regenerated for sentence: ${sentence.englishSentence}`
        });
      } catch (error) {
        console.error('Error regenerating audio:', error);
        return NextResponse.json({ 
          error: 'Failed to regenerate audio',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    } else {
      // Regenerate audio for all sentences without audio paths
      const allSentences = await databaseDrizzle.getAllSentences();
      const sentencesWithoutAudio = allSentences.filter(s => !s.audioPath && s.spanishTranslation);
      
      const results = {
        total: sentencesWithoutAudio.length,
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      for (const sentence of sentencesWithoutAudio) {
        try {
          console.log(`Regenerating audio for sentence: ${sentence.englishSentence}`);
          const audioPath = await googleServices.generateAudio(
            sentence.spanishTranslation!, 
            sentence.englishSentence, 
            'es-es'
          );
          await databaseDrizzle.updateSentence(sentence.id, undefined, audioPath);
          results.successful++;
          console.log(`Successfully regenerated audio for: ${sentence.englishSentence}`);
        } catch (error) {
          results.failed++;
          const errorMsg = `Failed to regenerate audio for "${sentence.englishSentence}": ${error instanceof Error ? error.message : 'Unknown error'}`;
          results.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
      
      return NextResponse.json(results);
    }
  } catch (error) {
    console.error('Error in regenerate sentence audio:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate sentence audio' },
      { status: 500 }
    );
  }
} 
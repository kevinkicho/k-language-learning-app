import { NextRequest, NextResponse } from 'next/server';
import { databaseDrizzle } from '@/lib/database-drizzle';

export async function POST(request: NextRequest) {
  try {
    const { sentenceId, score, totalWords } = await request.json();
    
    if (!sentenceId || typeof score !== 'number' || typeof totalWords !== 'number') {
      return NextResponse.json(
        { error: 'Invalid quiz attempt data' },
        { status: 400 }
      );
    }
    
    // Verify the sentence exists
    const sentence = await databaseDrizzle.getSentenceById(sentenceId);
    if (!sentence) {
      return NextResponse.json(
        { error: 'Sentence not found' },
        { status: 404 }
      );
    }
    
    await databaseDrizzle.saveQuizAttempt(sentenceId, score, totalWords);
    
    return NextResponse.json(
      { message: 'Quiz attempt saved successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving quiz attempt:', error);
    return NextResponse.json(
      { error: 'Failed to save quiz attempt' },
      { status: 500 }
    );
  }
} 
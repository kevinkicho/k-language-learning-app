import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { sentenceId, score, totalWords } = await request.json();
    
    console.log('Quiz API called with:', { sentenceId, score, totalWords });
    
    if (!sentenceId || typeof score !== 'number' || typeof totalWords !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid parameters' },
        { status: 400 }
      );
    }
    
    // For now, just return success without saving to database
    console.log('Quiz attempt would be saved:', { sentenceId, score, totalWords });
    
    return NextResponse.json({ success: true, message: 'Quiz attempt received' });
  } catch (error) {
    console.error('Error in quiz API:', error);
    return NextResponse.json(
      { error: 'Failed to process quiz attempt' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Quiz API is working' });
} 
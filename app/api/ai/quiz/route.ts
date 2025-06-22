import { NextRequest, NextResponse } from 'next/server';
import { getAIService } from '@/lib/ai-service';
import { QuizGenerationRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: QuizGenerationRequest = await request.json();
    
    if (!body.command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }

    const aiService = getAIService();
    const result = await aiService.generateQuiz(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in AI quiz generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Quiz Generation API',
    endpoints: {
      POST: '/api/ai/quiz - Generate quiz from natural language command'
    },
    examples: [
      'create a quiz using sentences that contain "i love"',
      'generate 10 intermediate questions about food',
      'make a beginner quiz about greetings'
    ]
  });
} 
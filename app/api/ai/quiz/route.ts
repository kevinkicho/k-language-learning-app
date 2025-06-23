import { NextRequest, NextResponse } from 'next/server';
import { QuizGenerationRequest } from '@/lib/types';
import { getGeminiService } from '@/lib/gemini-service';

export async function POST(request: NextRequest) {
  try {
    const body: QuizGenerationRequest = await request.json();
    
    if (!body.command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Starting Gemini AI quiz generation for command:', body.command);
    
    // Use the Gemini service
    const geminiService = getGeminiService();
    const result = await geminiService.generateQuiz(body);
    
    if (result.success && result.quiz) {
      console.log('✅ Gemini AI quiz generation successful');
      return NextResponse.json(result);
    } else {
      console.log('❌ Gemini AI quiz generation failed:', result.error);
      return NextResponse.json(result, { status: 400 });
    }
    
  } catch (error) {
    console.error('💥 Error in Gemini AI quiz generation:', error);
    
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Gemini AI Quiz Generation API',
    endpoints: {
      POST: '/api/ai/quiz - Generate quiz from natural language command using Gemini AI'
    },
    examples: [
      'I want to learn useful Spanish sentences for travel',
      'How do you say hello in Spanish?',
      'Teach me basic Spanish greetings',
      'I need Spanish phrases for ordering food',
      'What are common Spanish expressions for daily conversation?'
    ],
    note: 'Please ask for Spanish learning content. The AI will generate relevant sentences and create a quiz for you.'
  });
} 
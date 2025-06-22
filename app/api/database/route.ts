import { NextRequest, NextResponse } from 'next/server';
import { databaseDrizzle } from '@/lib/database-drizzle';

export async function GET() {
  try {
    const allData = await databaseDrizzle.getAllData();
    
    const stats = {
      sentences: allData.sentences.length,
      quizAttempts: allData.quizAttempts.length,
      wordAudioCache: allData.wordAudioCache.length,
      translationCache: allData.translationCache.length,
    };
    
    return NextResponse.json({
      stats,
      data: allData
    });

  } catch (error) {
    console.error('Error fetching database data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'checkIntegrity') {
      const result = await databaseDrizzle.checkAndRepairAudioCache();
      return NextResponse.json(result);
    }
    
    if (action === 'clearWordAudio') {
      await databaseDrizzle.clearAllWordAudio();
      return NextResponse.json({ message: 'All word audio cache cleared' });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error performing database action:', error);
    return NextResponse.json(
      { error: 'Failed to perform database action' },
      { status: 500 }
    );
  }
} 
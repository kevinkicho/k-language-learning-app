import { NextRequest, NextResponse } from 'next/server';
import { googleServices } from '@/lib/google-services';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    const romajiMatch = text.match(/\(([^)]+)\)/);

    if (!romajiMatch) {
      return NextResponse.json({ chunks: [text.replace(/\([^)]*\)/g, '').trim()] });
    }

    const romajiText = romajiMatch[1].trim();
    // Use the new direct conversion method
    const chunks = await googleServices.convertRomajiWordsToKanaChunks(romajiText);

    console.log('[chunk-japanese API] Input Romaji:', romajiText);
    console.log('[chunk-japanese API] Generated Chunks:', chunks);

    return NextResponse.json({ chunks });
  } catch (error) {
    console.error('Error chunking Japanese text:', error);
    return NextResponse.json(
      { error: 'Failed to chunk text' },
      { status: 500 }
    );
  }
} 
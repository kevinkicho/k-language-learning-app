import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const audioPath = path.join(process.cwd(), 'public', 'audio', `${params.id}.mp3`);
    
    try {
      const audioBuffer = await fs.readFile(audioPath);
      
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length.toString(),
        },
      });
    } catch (fileError) {
      return NextResponse.json(
        { error: 'Audio file not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error serving audio:', error);
    return NextResponse.json(
      { error: 'Failed to serve audio' },
      { status: 500 }
    );
  }
} 
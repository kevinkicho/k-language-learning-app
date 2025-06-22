import { NextRequest, NextResponse } from 'next/server';
import { databaseDrizzle } from '@/lib/database-drizzle';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sentence = await databaseDrizzle.getSentenceById(id);
    
    if (!sentence) {
      return NextResponse.json(
        { error: 'Sentence not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(sentence);
  } catch (error) {
    console.error('Error fetching sentence:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sentence' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`Attempting to delete sentence with ID: ${id}`);
    
    // Check if sentence exists
    const sentence = await databaseDrizzle.getSentenceById(id);
    if (!sentence) {
      console.log(`Sentence not found with ID: ${id}`);
      return NextResponse.json(
        { error: 'Sentence not found' },
        { status: 404 }
      );
    }
    
    console.log(`Found sentence to delete: ${sentence.englishSentence}`);
    await databaseDrizzle.deleteSentence(id);
    console.log(`Successfully deleted sentence with ID: ${id}`);
    
    return NextResponse.json({ message: 'Sentence deleted successfully' });
  } catch (error) {
    console.error('Error deleting sentence:', error);
    return NextResponse.json(
      { error: 'Failed to delete sentence' },
      { status: 500 }
    );
  }
} 
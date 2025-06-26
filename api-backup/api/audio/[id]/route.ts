import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { db } from '@/app/drizzle/db';
import { sentences } from '@/app/drizzle/schema';
import { eq } from 'drizzle-orm';
import { generateAudio } from '@/lib/google-services';

// Utility to sanitize sentence for TTS (Japanese/Chinese)
function sanitizeForTTS(text: string, languageCode: string): string {
  if (languageCode === 'ja-jp' || languageCode === 'zh-cn') {
    // Remove everything after the first parenthesis (including the parenthesis)
    // e.g. "行きましょう。(ikimashou)" => "行きましょう。"
    // e.g. "你会说中文吗？(nǐ huì shuō zhōng wén ma?)" => "你会说中文吗？"
    const match = text.match(/^(.*?)[\(（]/);
    if (match) {
      return match[1].trim();
    }
    return text.trim();
  }
  return text;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const audioDirectory = path.join(process.cwd(), 'public', 'audio');
    const audioPath = path.join(audioDirectory, `${id}.mp3`);

    console.log(`[Audio API] Attempting to serve or generate audio at: ${audioPath}`);

    // Ensure the audio directory exists
    try {
      await fs.access(audioDirectory);
    } catch {
      await fs.mkdir(audioDirectory, { recursive: true });
    }

    // Check if the file already exists
    try {
      const audioBuffer = await fs.readFile(audioPath);
      return new NextResponse(audioBuffer, {
        headers: { 'Content-Type': 'audio/mpeg' },
      });
    } catch (fileError) {
      // File doesn't exist, so generate it
      console.log(`Audio file not found for sentence ${id}, generating...`);
    }

    // 1. Fetch sentence from the database
    const sentenceResult = await db.select().from(sentences).where(eq(sentences.id, id)).limit(1);
    if (sentenceResult.length === 0) {
      return NextResponse.json({ error: 'Sentence not found' }, { status: 404 });
    }
    const sentence = sentenceResult[0];
    const rawText = sentence.spanishTranslation || sentence.englishSentence;
    const textToSpeak = sanitizeForTTS(rawText, sentence.languageCode);

    // 2. Generate audio using Google TTS
    const audioBuffer = await generateAudio(textToSpeak, sentence.languageCode);

    // 3. Save the audio file
    console.log(`[sentence audio API] Attempting to save audio file to: ${audioPath}`);
    await fs.writeFile(audioPath, audioBuffer);
    console.log(`[sentence audio API] Successfully saved audio file.`);

    // 4. Update the database with the new audio path (optional but good practice)
    await db.update(sentences).set({ audioPath: `/audio/${id}.mp3` }).where(eq(sentences.id, id));

    // 5. Serve the newly created audio file
    return new NextResponse(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });

  } catch (error) {
    console.error('Error in sentence audio API:', error);
    return NextResponse.json(
      { error: 'Failed to generate or serve audio' },
      { status: 500 }
    );
  }
} 
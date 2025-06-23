import { nanoid } from 'nanoid';
import { eq, and, count } from 'drizzle-orm';
import { db } from '@/app/drizzle/db';
import { sentences, quizAttempts, wordAudioCache, translationCache } from '@/app/drizzle/schema';
import type { Sentence, QuizAttempt, WordAudioCache, TranslationCache } from '@/app/drizzle/schema';
import path from 'path';
import fs from 'fs/promises';

// Database utility class using Drizzle ORM
export class DatabaseDrizzle {
  // Sentence operations
  async getAllSentences(): Promise<Sentence[]> {
    return await db.select().from(sentences).orderBy(sentences.createdAt);
  }

  async getSentenceById(id: string): Promise<Sentence | null> {
    const result = await db.select().from(sentences).where(eq(sentences.id, id));
    return result[0] || null;
  }

  async findSentenceByEnglishText(englishSentence: string): Promise<Sentence | null> {
    const result = await db.select().from(sentences).where(eq(sentences.englishSentence, englishSentence));
    return result[0] || null;
  }

  async addSentence(englishSentence: string, spanishTranslation?: string, quizGroup?: string, languageCode: string = 'es'): Promise<Sentence> {
    // Check if sentence already exists
    const existingSentence = await this.findSentenceByEnglishText(englishSentence);
    if (existingSentence) {
      console.log(`Sentence already exists: "${englishSentence}"`);
      return existingSentence;
    }

    const id = nanoid();
    const now = new Date().toISOString();
    
    const newSentence = {
      id,
      englishSentence,
      spanishTranslation: spanishTranslation || null,
      audioPath: null,
      quizGroup: quizGroup || null,
      languageCode,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(sentences).values(newSentence);
    console.log(`Added new sentence: "${englishSentence}" with language code: ${languageCode}`);
    return newSentence;
  }

  async updateSentence(id: string, spanishTranslation?: string, audioPath?: string): Promise<void> {
    const updateData: any = { updatedAt: new Date().toISOString() };
    
    if (spanishTranslation !== undefined) {
      updateData.spanishTranslation = spanishTranslation;
    }
    
    if (audioPath !== undefined) {
      updateData.audioPath = audioPath;
    }

    await db.update(sentences)
      .set(updateData)
      .where(eq(sentences.id, id));
  }

  async deleteSentence(id: string): Promise<void> {
    // First delete related quiz attempts to handle foreign key constraint
    await db.delete(quizAttempts).where(eq(quizAttempts.sentenceId, id));
    // Then delete the sentence
    await db.delete(sentences).where(eq(sentences.id, id));
  }

  // Quiz attempt operations
  async saveQuizAttempt(sentenceId: string, score: number, totalWords: number): Promise<void> {
    const id = nanoid();
    const now = new Date().toISOString();
    
    await db.insert(quizAttempts).values({
      id,
      sentenceId,
      score,
      totalWords,
      completedAt: now,
    });
  }

  async getQuizAttempts(sentenceId: string): Promise<QuizAttempt[]> {
    return await db.select()
      .from(quizAttempts)
      .where(eq(quizAttempts.sentenceId, sentenceId))
      .orderBy(quizAttempts.completedAt);
  }

  // Translation cache operations
  async getTranslation(englishText: string): Promise<TranslationCache | null> {
    const result = await db.select()
      .from(translationCache)
      .where(eq(translationCache.englishText, englishText));
    return result[0] || null;
  }

  async saveTranslation(englishText: string, spanishText: string): Promise<void> {
    const id = nanoid();
    const now = new Date().toISOString();
    
    await db.insert(translationCache).values({
      id,
      englishText,
      spanishText,
      createdAt: now,
    });
  }

  // Word audio cache operations
  async getWordAudio(word: string, language: string): Promise<WordAudioCache | null> {
    const result = await db.select()
      .from(wordAudioCache)
      .where(and(
        eq(wordAudioCache.word, word),
        eq(wordAudioCache.language, language)
      ));
    return result[0] || null;
  }

  async saveWordAudio(word: string, language: string, audioPath: string): Promise<void> {
    const id = nanoid();
    const now = new Date().toISOString();
    
    await db.insert(wordAudioCache).values({
      id,
      word,
      language,
      audioPath,
      createdAt: now,
    });
  }

  async deleteWordAudio(word: string, language: string): Promise<void> {
    await db.delete(wordAudioCache)
      .where(and(
        eq(wordAudioCache.word, word),
        eq(wordAudioCache.language, language)
      ));
  }

  // Clear all word audio cache entries (for testing/debugging)
  async clearAllWordAudio(): Promise<void> {
    await db.delete(wordAudioCache);
  }

  // Database statistics
  async getStats(): Promise<{
    sentences: number;
    quizAttempts: number;
    wordAudioCache: number;
    translationCache: number;
  }> {
    const [sentencesResult] = await db.select({ count: count() }).from(sentences);
    const [quizAttemptsResult] = await db.select({ count: count() }).from(quizAttempts);
    const [wordAudioCacheResult] = await db.select({ count: count() }).from(wordAudioCache);
    const [translationCacheResult] = await db.select({ count: count() }).from(translationCache);

    return {
      sentences: sentencesResult?.count || 0,
      quizAttempts: quizAttemptsResult?.count || 0,
      wordAudioCache: wordAudioCacheResult?.count || 0,
      translationCache: translationCacheResult?.count || 0,
    };
  }

  // Get all data for database viewer
  async getAllData(): Promise<{
    sentences: Sentence[];
    quizAttempts: QuizAttempt[];
    wordAudioCache: WordAudioCache[];
    translationCache: TranslationCache[];
  }> {
    const [sentencesData, quizAttemptsData, wordAudioCacheData, translationCacheData] = await Promise.all([
      db.select().from(sentences),
      db.select().from(quizAttempts),
      db.select().from(wordAudioCache),
      db.select().from(translationCache),
    ]);

    return {
      sentences: sentencesData,
      quizAttempts: quizAttemptsData,
      wordAudioCache: wordAudioCacheData,
      translationCache: translationCacheData,
    };
  }

  // Database integrity check and repair
  async checkAndRepairAudioCache(): Promise<{
    checked: number;
    missing: number;
    repaired: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let checked = 0;
    let missing = 0;
    let repaired = 0;

    try {
      // Get all cached audio entries
      const allCachedAudio = await db.select().from(wordAudioCache);
      checked = allCachedAudio.length;

      for (const cachedAudio of allCachedAudio) {
        try {
          // Check if file exists and has reasonable size
          const audioPath = path.join(process.cwd(), 'public', cachedAudio.audioPath);
          const stats = await fs.stat(audioPath);
          
          // Check if file is too small (likely corrupted)
          if (stats.size < 1000) { // Less than 1KB is suspicious
            console.log(`Audio file for "${cachedAudio.word}" is too small (${stats.size} bytes), regenerating...`);
            missing++;
            throw new Error('File too small');
          }
        } catch {
          // File doesn't exist or is corrupted, mark for repair
          missing++;
          try {
            console.log(`Regenerating audio for "${cachedAudio.word}"`);
            
            // Use the correct googleServices method that saves to file
            const { googleServices } = await import('@/lib/google-services');
            const newAudioPath = await googleServices.generateAudio(cachedAudio.word, `word_${cachedAudio.word}`);
            
            // Update the cache entry with the new path
            await db.update(wordAudioCache)
              .set({ audioPath: newAudioPath })
              .where(eq(wordAudioCache.id, cachedAudio.id));
            
            repaired++;
            console.log(`Successfully regenerated audio for "${cachedAudio.word}"`);
          } catch (error) {
            // If regeneration fails, remove the cache entry
            await this.deleteWordAudio(cachedAudio.word, cachedAudio.language);
            errors.push(`Failed to regenerate audio for "${cachedAudio.word}": ${error}`);
            console.error(`Failed to regenerate audio for "${cachedAudio.word}":`, error);
          }
        }
      }
    } catch (error) {
      errors.push(`Database integrity check failed: ${error}`);
      console.error('Database integrity check failed:', error);
    }

    return { checked, missing, repaired, errors };
  }
}

// Export singleton instance
export const databaseDrizzle = new DatabaseDrizzle(); 
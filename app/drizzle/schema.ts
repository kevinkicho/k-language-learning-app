import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Sentences table
export const sentences = sqliteTable('sentences', {
  id: text('id').primaryKey(),
  englishSentence: text('english_sentence').notNull(),
  spanishTranslation: text('spanish_translation'),
  audioPath: text('audio_path'),
  quizGroup: text('quiz_group'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Quiz attempts table
export const quizAttempts = sqliteTable('quiz_attempts', {
  id: text('id').primaryKey(),
  sentenceId: text('sentence_id').notNull().references(() => sentences.id),
  score: integer('score').notNull(),
  totalWords: integer('total_words').notNull(),
  completedAt: text('completed_at').notNull(),
});

// Word audio cache table
export const wordAudioCache = sqliteTable('word_audio_cache', {
  id: text('id').primaryKey(),
  word: text('word').notNull(),
  language: text('language').notNull(),
  audioPath: text('audio_path').notNull(),
  createdAt: text('created_at').notNull(),
});

// Translation cache table
export const translationCache = sqliteTable('translation_cache', {
  id: text('id').primaryKey(),
  englishText: text('english_text').notNull(),
  spanishText: text('spanish_text').notNull(),
  createdAt: text('created_at').notNull(),
});

// Type exports for use in the application
export type Sentence = typeof sentences.$inferSelect;
export type NewSentence = typeof sentences.$inferInsert;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type NewQuizAttempt = typeof quizAttempts.$inferInsert;
export type WordAudioCache = typeof wordAudioCache.$inferSelect;
export type NewWordAudioCache = typeof wordAudioCache.$inferInsert;
export type TranslationCache = typeof translationCache.$inferSelect;
export type NewTranslationCache = typeof translationCache.$inferInsert; 
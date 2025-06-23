// Import Drizzle types for use in the application
import type {
  Sentence,
  NewSentence,
  QuizAttempt,
  NewQuizAttempt,
  WordAudioCache,
  NewWordAudioCache,
  TranslationCache,
  NewTranslationCache,
} from '@/app/drizzle/schema';

// Re-export Drizzle types for consistency across the application
export type {
  Sentence,
  NewSentence,
  QuizAttempt,
  NewQuizAttempt,
  WordAudioCache,
  NewWordAudioCache,
  TranslationCache,
  NewTranslationCache,
} from '@/app/drizzle/schema';

// Quiz Types
export interface WordItem {
  id: string;
  word: string;
  isSelected: boolean;
  originalIndex: number;
}

export interface QuizState {
  shuffledWords: WordItem[];
  selectedWords: WordItem[];
  isCorrect: boolean | null;
  score: number;
  isSubmitting: boolean;
  playingWord: string | null;
}

// UI Types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface TabConfig {
  id: string;
  label: string;
  count?: number | null;
}

// API Response Types
export interface DatabaseStats {
  sentences: number;
  quizAttempts: number;
  wordAudioCache: number;
  translationCache: number;
}

export interface DatabaseData {
  sentences: Sentence[];
  quizAttempts: QuizAttempt[];
  wordAudioCache: WordAudioCache[];
  translationCache: TranslationCache[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  stats?: DatabaseStats;
}

// Component Props Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface AudioPlayerProps {
  audioPath: string | null;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  className?: string;
}

// Utility Types
export type SortField = 'date' | 'english' | 'spanish';
export type SortOrder = 'asc' | 'desc';
export type Language = 'en' | 'es' | 'es-ES' | 'fr' | 'de' | 'it' | 'pt';

export interface Word {
  word: string;
  originalIndex: number;
}

export interface QuizGenerationRequest {
  command: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  topic?: string;
  sentenceCount?: number;
}

export interface QuizGenerationResponse {
  success: boolean;
  quiz?: {
    id: string;
    title: string;
    sentences: Array<{
      id: string;
      spanish: string;
      english: string;
      difficulty: string;
      topic?: string;
    }>;
    questions: Array<{
      id: string;
      question: string;
      correctAnswer: string;
      options: string[];
      type: 'multiple-choice' | 'fill-blank' | 'translation';
    }>;
  };
  error?: string;
}

export interface AICommand {
  type: 'generate_quiz' | 'create_sentences' | 'explain_grammar' | 'translate';
  parameters: Record<string, any>;
  response: string;
  timestamp: Date;
} 
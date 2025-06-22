import { Sentence } from "@/lib/types";
import { QuizAction, QuizActionType } from './actions';

export interface Word {
  word: string;
  originalIndex: number;
}

export interface WordItem extends Word {
  id: string;
  isSelected: boolean;
}

export interface QuizAttempt {
  sentence: Sentence;
  score: number;
}

export interface QuizState {
  sentences: Sentence[];
  currentSentenceIndex: number;
  shuffledWords: WordItem[];
  selectedWords: WordItem[];
  isCorrect: boolean | null;
  score: number;
  completedQuizzes: number;
  totalScore: number;
  isFinalReview: boolean;
  playingWord: string | null;
  quizAttempts: QuizAttempt[];
}

export const initialQuizState: QuizState = {
  sentences: [],
  currentSentenceIndex: 0,
  shuffledWords: [],
  selectedWords: [],
  isCorrect: null,
  score: 0,
  completedQuizzes: 0,
  totalScore: 0,
  playingWord: null,
  isFinalReview: false,
  quizAttempts: [],
};

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case QuizActionType.INITIALIZE_QUIZ: {
      const spanishSentence = action.sentence.spanishTranslation || action.sentence.englishSentence;
      const words = spanishSentence.split(' ').map((word: string, index: number) => ({
        id: `${index}-${word}`,
        word: word.replace(/[.,!?;:]/g, ''),
        isSelected: false,
        originalIndex: index,
      }));
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      return {
        ...state,
        shuffledWords: shuffled,
        selectedWords: [],
        isCorrect: null,
        score: 0,
      };
    }
    case QuizActionType.SELECT_WORD:
      return {
        ...state,
        shuffledWords: state.shuffledWords.map(w => w.id === action.payload.id ? { ...w, isSelected: true } : w),
        selectedWords: [...state.selectedWords, action.payload],
      };
    case QuizActionType.DESELECT_WORD:
      return {
        ...state,
        shuffledWords: state.shuffledWords.map(w => w.id === action.payload.id ? { ...w, isSelected: false } : w),
        selectedWords: state.selectedWords.filter(w => w.id !== action.payload.id),
      };
    case QuizActionType.CLEAR_ANSWER:
      return {
        ...state,
        selectedWords: [],
        shuffledWords: state.shuffledWords.map(w => ({ ...w, isSelected: false })),
      };
    case QuizActionType.CHECK_ANSWER:
      const newAttempt: QuizAttempt = {
        sentence: state.sentences[state.currentSentenceIndex],
        score: action.payload.score,
      };
      return {
        ...state,
        isCorrect: action.payload.isCorrect,
        score: action.payload.score,
        totalScore: state.totalScore + action.payload.score,
        completedQuizzes: state.completedQuizzes + 1,
        quizAttempts: [...state.quizAttempts, newAttempt],
      };
    case QuizActionType.NEXT_QUIZ: {
      const nextIndex = state.currentSentenceIndex + 1;
      if (nextIndex >= state.sentences.length) {
        return { ...state, isFinalReview: true };
      }
      return {
        ...state,
        currentSentenceIndex: nextIndex,
        isCorrect: null,
        score: 0,
        selectedWords: [],
      };
    }
    case QuizActionType.RESET_QUIZ:
        return {
            ...state,
            isCorrect: null,
            score: 0,
            selectedWords: [],
            shuffledWords: state.shuffledWords.map(w => ({ ...w, isSelected: false })).sort(() => Math.random() - 0.5),
        };
    case QuizActionType.SET_PLAYING_WORD:
      return { ...state, playingWord: action.payload };
    case QuizActionType.SET_FINAL_REVIEW:
      return { ...state, isFinalReview: true };
    default:
      return state;
  }
} 
import { Sentence } from "@/lib/types";

export interface WordItem {
  id: string;
  word: string;
  isSelected: boolean;
  originalIndex: number;
}

export interface SingleQuizState {
  shuffledWords: WordItem[];
  selectedWords: WordItem[];
  isCorrect: boolean | null;
  score: number;
  isSubmitting: boolean;
  isLoading: boolean;
  useRomajiMode: boolean;
}

export const initialSingleQuizState: SingleQuizState = {
  shuffledWords: [],
  selectedWords: [],
  isCorrect: null,
  score: 0,
  isSubmitting: false,
  isLoading: true,
  useRomajiMode: false,
};

export enum SingleQuizActionType {
  INITIALIZE_START = 'INITIALIZE_START',
  INITIALIZE_SUCCESS = 'INITIALIZE_SUCCESS',
  SELECT_WORD = 'SELECT_WORD',
  DESELECT_WORD = 'DESELECT_WORD',
  SET_ANSWER = 'SET_ANSWER',
  CLEAR_ANSWER = 'CLEAR_ANSWER',
  SUBMIT_START = 'SUBMIT_START',
  SUBMIT_END = 'SUBMIT_END',
}

export type SingleQuizAction =
  | { type: SingleQuizActionType.INITIALIZE_START }
  | { type: SingleQuizActionType.INITIALIZE_SUCCESS; payload: { shuffledWords: WordItem[]; useRomajiMode: boolean } }
  | { type: SingleQuizActionType.SELECT_WORD; payload: WordItem }
  | { type: SingleQuizActionType.DESELECT_WORD; payload: WordItem }
  | { type: SingleQuizActionType.SET_ANSWER; payload: { isCorrect: boolean; score: number } }
  | { type: SingleQuizActionType.CLEAR_ANSWER }
  | { type: SingleQuizActionType.SUBMIT_START }
  | { type: SingleQuizActionType.SUBMIT_END };

export function singleQuizReducer(state: SingleQuizState, action: SingleQuizAction): SingleQuizState {
  switch (action.type) {
    case SingleQuizActionType.INITIALIZE_START:
      return { ...initialSingleQuizState, isLoading: true };
    
    case SingleQuizActionType.INITIALIZE_SUCCESS:
      return {
        ...state,
        shuffledWords: action.payload.shuffledWords,
        useRomajiMode: action.payload.useRomajiMode,
        isLoading: false,
      };

    case SingleQuizActionType.SELECT_WORD:
      return {
        ...state,
        selectedWords: [...state.selectedWords, action.payload],
        shuffledWords: state.shuffledWords.map(w => w.id === action.payload.id ? { ...w, isSelected: true } : w),
      };

    case SingleQuizActionType.DESELECT_WORD:
      return {
        ...state,
        selectedWords: state.selectedWords.filter(w => w.id !== action.payload.id),
        shuffledWords: state.shuffledWords.map(w => w.id === action.payload.id ? { ...w, isSelected: false } : w),
      };

    case SingleQuizActionType.SET_ANSWER:
      return {
        ...state,
        isCorrect: action.payload.isCorrect,
        score: action.payload.score,
      };

    case SingleQuizActionType.CLEAR_ANSWER:
      return {
        ...state,
        selectedWords: [],
        shuffledWords: state.shuffledWords.map(w => ({ ...w, isSelected: false })),
      };

    case SingleQuizActionType.SUBMIT_START:
      return { ...state, isSubmitting: true };

    case SingleQuizActionType.SUBMIT_END:
      return { ...state, isSubmitting: false };

    default:
      return state;
  }
} 
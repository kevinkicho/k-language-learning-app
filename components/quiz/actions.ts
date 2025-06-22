import { WordItem } from './useMultiQuiz';

export enum QuizActionType {
  INITIALIZE_QUIZ = 'INITIALIZE_QUIZ',
  SELECT_WORD = 'SELECT_WORD',
  DESELECT_WORD = 'DESELECT_WORD',
  CLEAR_ANSWER = 'CLEAR_ANSWER',
  CHECK_ANSWER = 'CHECK_ANSWER',
  NEXT_QUIZ = 'NEXT_QUIZ',
  RESET_QUIZ = 'RESET_QUIZ',
  SET_PLAYING_WORD = 'SET_PLAYING_WORD',
  SET_FINAL_REVIEW = 'SET_FINAL_REVIEW',
}

export type QuizAction =
  | { type: QuizActionType.INITIALIZE_QUIZ; sentence: any }
  | { type: QuizActionType.SELECT_WORD; payload: WordItem }
  | { type: QuizActionType.DESELECT_WORD; payload: WordItem }
  | { type: QuizActionType.CLEAR_ANSWER }
  | { type: QuizActionType.CHECK_ANSWER; payload: { isCorrect: boolean; score: number } }
  | { type: QuizActionType.NEXT_QUIZ }
  | { type: QuizActionType.RESET_QUIZ }
  | { type: QuizActionType.SET_PLAYING_WORD; payload: string | null }
  | { type: QuizActionType.SET_FINAL_REVIEW }; 
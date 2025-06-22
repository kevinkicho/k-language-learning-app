'use client';

import { useEffect, useReducer, useState, useCallback, useRef } from 'react';
import { Sentence } from '@/lib/types';
import { CachedAPI } from '@/lib/cache-utils';
import { quizReducer, initialQuizState } from './quiz/useMultiQuiz';
import { QuizActionType } from './quiz/actions';
import FinalReview from './quiz/FinalReview';
import QuizView from './quiz/QuizView';
import QuizResult from './quiz/QuizResult';
import LoadingSpinner from './ui/LoadingSpinner';
import Button from './ui/Button';

interface MultiQuizModalProps {
  sentences: Sentence[];
  isRandom: boolean;
  onClose: () => void;
}

export default function MultiQuizModal({ sentences, isRandom, onClose }: MultiQuizModalProps) {
  const [state, dispatch] = useReducer(quizReducer, {
    ...initialQuizState,
    sentences,
  });
  const [countdown, setCountdown] = useState(0);

  const audioUrlRef = useRef<string | null>(null);
  const checkAnswerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentSentence = state.sentences[state.currentSentenceIndex];

  const playWordAudio = useCallback(async (word: string) => {
    dispatch({ type: QuizActionType.SET_PLAYING_WORD, payload: word });
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
    }
    try {
      const audioBlob = await CachedAPI.getWordAudio(word, 'es-ES');
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => {
        dispatch({ type: QuizActionType.SET_PLAYING_WORD, payload: null });
        URL.revokeObjectURL(audioUrl);
        audioUrlRef.current = null;
      };
    } catch (error) {
      console.error('Error getting word audio:', error);
      dispatch({ type: QuizActionType.SET_PLAYING_WORD, payload: null });
    }
  }, []);

  const checkAnswer = useCallback(() => {
    const spanishSentence = currentSentence.spanishTranslation || currentSentence.englishSentence;
    const totalWords = spanishSentence.split(' ').length;
    const isCorrect = state.selectedWords.every((word, index) => word.originalIndex === index);
    const correctWords = state.selectedWords.filter((word, index) => word.originalIndex === index).length;
    const score = Math.round((correctWords / totalWords) * 100);
    
    dispatch({ type: QuizActionType.CHECK_ANSWER, payload: { isCorrect, score } });
    CachedAPI.saveQuizAttempt(currentSentence.id, score, totalWords);
  }, [state.selectedWords, currentSentence]);

  useEffect(() => {
    if (currentSentence) {
      dispatch({ type: QuizActionType.INITIALIZE_QUIZ, sentence: currentSentence });
    }
  }, [currentSentence]);
  
  useEffect(() => {
    const totalWords = (currentSentence?.spanishTranslation || currentSentence?.englishSentence)?.split(' ').length || 0;
    if (totalWords > 0 && state.selectedWords.length === totalWords && state.isCorrect === null) {
        if (checkAnswerTimeoutRef.current) clearTimeout(checkAnswerTimeoutRef.current);
        checkAnswerTimeoutRef.current = setTimeout(checkAnswer, 200);
    }
    return () => {
        if (checkAnswerTimeoutRef.current) clearTimeout(checkAnswerTimeoutRef.current);
    }
  }, [state.selectedWords, currentSentence, state.isCorrect, checkAnswer]);

  useEffect(() => {
    if (state.isFinalReview) {
      const averageScore = Math.round(state.totalScore / state.completedQuizzes) || 0;
      setCountdown(5);
      const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
      const closeTimeout = setTimeout(onClose, 5000);
      return () => {
        clearInterval(timer);
        clearTimeout(closeTimeout);
      };
    }
  }, [state.isFinalReview, state.totalScore, state.completedQuizzes, onClose]);

  const handleWordClick = (word: any) => {
    playWordAudio(word.word);
    dispatch({ type: QuizActionType.SELECT_WORD, payload: word });
  };

  if (!currentSentence && !state.isFinalReview) {
    return <LoadingSpinner />;
  }
  
  const spanishSentence = currentSentence?.spanishTranslation || currentSentence?.englishSentence || "";

  return (
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title">Multi-Sentence Quiz</h5>
                    <Button onClick={onClose} className="btn-close"><></></Button>
                </div>
                <div className="modal-body">
                    {state.isFinalReview ? (
                      <FinalReview
                        quizState={state}
                        onClose={onClose}
                        countdown={countdown}
                      />
                    ) : (
                      <>
                        <QuizView
                          currentSentence={currentSentence}
                          shuffledWords={state.shuffledWords}
                          selectedWords={state.selectedWords}
                          isCorrect={state.isCorrect}
                          progressPercentage={(state.currentSentenceIndex / state.sentences.length) * 100}
                          totalSentences={state.sentences.length}
                          currentSentenceIndex={state.currentSentenceIndex}
                          onWordClick={handleWordClick}
                          onSelectedWordClick={(word) => dispatch({ type: QuizActionType.DESELECT_WORD, payload: word })}
                          onClearAnswer={() => dispatch({ type: QuizActionType.CLEAR_ANSWER })}
                        />
                        {state.isCorrect !== null ? (
                          <QuizResult
                              isCorrect={state.isCorrect}
                              score={state.score}
                              spanishSentence={spanishSentence}
                              isLastSentence={state.currentSentenceIndex === state.sentences.length - 1}
                              onResetQuiz={() => dispatch({ type: QuizActionType.RESET_QUIZ })}
                              onNextQuiz={() => dispatch({ type: QuizActionType.NEXT_QUIZ })}
                          />
                        ) : (
                          <div className="text-muted fst-italic mt-3">
                            Select {spanishSentence.split(' ').length} words to complete the sentence.
                          </div>
                        )}
                      </>
                    )}
                </div>
                {!state.isFinalReview &&
                    <div className="modal-footer">
                        <Button variant="secondary" onClick={onClose}>
                            Exit Quiz
                        </Button>
                    </div>
                }
            </div>
        </div>
    </div>
  );
}

'use client';

import { useEffect, useReducer, useState, useCallback, useRef } from 'react';
import { Sentence } from '@/lib/types';
import { CachedAPI } from '@/lib/cache-utils';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { quizReducer, initialQuizState, WordItem } from './quiz/useMultiQuiz';
import { QuizActionType } from './quiz/actions';
import FinalReview from './quiz/FinalReview';
import QuizView from './quiz/QuizView';
import QuizResult from './quiz/QuizResult';
import LoadingSpinner from './ui/LoadingSpinner';
import Button from './ui/Button';
import { chunkTextByLanguage } from '@/lib/utils';

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

  const { playingWord, playWordAudio } = useAudioPlayer();
  const checkAnswerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentSentence = state.sentences[state.currentSentenceIndex];

  const handleWordClick = async (word: WordItem) => {
    console.log(`🖱️ Word clicked: ${word.word}`);
    try {
      console.log(`🎵 Calling playWordAudio for: ${word.word}`);
      await playWordAudio(word.word, currentSentence?.languageCode || 'es-es');
      console.log(`✅ playWordAudio succeeded for: ${word.word}`);
    } catch (error) {
      console.error(`🔴 Failed to play audio for "${word.word}":`, error);
    }
    
    dispatch({ type: QuizActionType.SELECT_WORD, payload: word });
  };

  const initializeQuiz = useCallback(async () => {
    if (!currentSentence) return;
    
    const spanishSentence = currentSentence.spanishTranslation || currentSentence.englishSentence;
    const languageCode = currentSentence.languageCode || 'es-es';
    
    try {
      const wordChunks = await chunkTextByLanguage(spanishSentence, languageCode, state.useRomajiMode);
      
      const words = wordChunks.map((word: string, index: number) => ({
        id: `${index}-${word}`,
        word: word.replace(/[.,!?;:]/g, ''),
        isSelected: false,
        originalIndex: index,
      }));

      const shuffled = [...words].sort(() => Math.random() - 0.5);
      
      // Update the state with the new shuffled words
      dispatch({ type: QuizActionType.INITIALIZE_QUIZ, sentence: currentSentence });
      // Manually update the shuffled words since the reducer uses fallback
      dispatch({ type: QuizActionType.SET_PLAYING_WORD, payload: null }); // Trigger a re-render
    } catch (error) {
      console.error('Error initializing quiz:', error);
      // Fallback: use simple word splitting
      dispatch({ type: QuizActionType.INITIALIZE_QUIZ, sentence: currentSentence });
    }
  }, [currentSentence, state.useRomajiMode, dispatch]);

  const checkAnswer = useCallback(async (wordsToCheck: WordItem[]) => {
    if (!currentSentence) return;
    
    const spanishSentence = currentSentence.spanishTranslation || currentSentence.englishSentence;
    const languageCode = currentSentence.languageCode || 'es-es';
    
    try {
      const wordChunks = await chunkTextByLanguage(spanishSentence, languageCode, state.useRomajiMode);
      const totalWords = wordChunks.length;
      
      if (wordsToCheck.length !== totalWords) {
        return;
      }

      const isInCorrectOrder = wordsToCheck.every((word, index) => word.originalIndex === index);
      const correctWords = wordsToCheck.filter((word, index) => word.originalIndex === index).length;
      const newScore = Math.round((correctWords / totalWords) * 100);
      
      dispatch({ type: QuizActionType.CHECK_ANSWER, payload: { isCorrect: isInCorrectOrder, score: newScore } });
      
      try {
        await CachedAPI.saveQuizAttempt(currentSentence.id, newScore, totalWords);
      } catch (error) {
        console.error('Error saving quiz attempt:', error);
      }
    } catch (error) {
      console.error('Error checking answer:', error);
      // Fallback: use simple word splitting
      const wordChunks = spanishSentence.split(/\s+/).filter(word => word.length > 0);
      const totalWords = wordChunks.length;
      
      if (wordsToCheck.length !== totalWords) {
        return;
      }

      const isInCorrectOrder = wordsToCheck.every((word, index) => word.originalIndex === index);
      const correctWords = wordsToCheck.filter((word, index) => word.originalIndex === index).length;
      const newScore = Math.round((correctWords / totalWords) * 100);
      
      dispatch({ type: QuizActionType.CHECK_ANSWER, payload: { isCorrect: isInCorrectOrder, score: newScore } });
    }
  }, [currentSentence, state.useRomajiMode, dispatch]);

  useEffect(() => {
    if (currentSentence) {
      initializeQuiz();
    }
  }, [currentSentence, initializeQuiz]);
  
  useEffect(() => {
    const checkAnswerAsync = async () => {
      const spanishSentence = currentSentence?.spanishTranslation || currentSentence?.englishSentence;
      const languageCode = currentSentence?.languageCode || 'es-es';
      
      if (spanishSentence) {
        try {
          const wordChunks = await chunkTextByLanguage(spanishSentence, languageCode, state.useRomajiMode);
          const totalWords = wordChunks.length;
          
          if (totalWords > 0 && state.selectedWords.length === totalWords && state.isCorrect === null) {
            if (checkAnswerTimeoutRef.current) clearTimeout(checkAnswerTimeoutRef.current);
            checkAnswerTimeoutRef.current = setTimeout(async () => {
              await checkAnswer(state.selectedWords);
            }, 200);
          }
        } catch (error) {
          console.error('Error checking word chunks:', error);
          // Fallback: use simple word splitting
          const wordChunks = spanishSentence.split(/\s+/).filter(word => word.length > 0);
          const totalWords = wordChunks.length;
          
          if (totalWords > 0 && state.selectedWords.length === totalWords && state.isCorrect === null) {
            if (checkAnswerTimeoutRef.current) clearTimeout(checkAnswerTimeoutRef.current);
            checkAnswerTimeoutRef.current = setTimeout(async () => {
              await checkAnswer(state.selectedWords);
            }, 200);
          }
        }
      }
    };
    
    checkAnswerAsync();
    
    return () => {
        if (checkAnswerTimeoutRef.current) clearTimeout(checkAnswerTimeoutRef.current);
    }
  }, [state.selectedWords, currentSentence, state.isCorrect, checkAnswer, state.useRomajiMode]);

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

  // Modal wrapper
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {isRandom ? 'Random Quiz' : 'Selected Quiz'} 
              ({state.currentSentenceIndex + 1}/{state.sentences.length})
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            {!currentSentence && !state.isFinalReview ? (
              <LoadingSpinner />
            ) : state.isFinalReview ? (
              <FinalReview
                quizState={state}
                onClose={onClose}
                countdown={countdown}
              />
            ) : state.isCorrect !== null ? (
              <QuizResult
                isCorrect={state.isCorrect}
                score={state.score}
                spanishSentence={currentSentence?.spanishTranslation || currentSentence?.englishSentence || ""}
                isLastSentence={state.currentSentenceIndex === state.sentences.length - 1}
                onResetQuiz={() => dispatch({ type: QuizActionType.RESET_QUIZ })}
                onNextQuiz={() => dispatch({ type: QuizActionType.NEXT_QUIZ })}
              />
            ) : (
              <QuizView
                currentSentence={currentSentence}
                shuffledWords={state.shuffledWords}
                selectedWords={state.selectedWords}
                isCorrect={state.isCorrect}
                progressPercentage={(state.currentSentenceIndex / state.sentences.length) * 100}
                totalSentences={state.sentences.length}
                currentSentenceIndex={state.currentSentenceIndex}
                onSelectWord={handleWordClick}
                onDeselectWord={(word: WordItem) => dispatch({ type: QuizActionType.DESELECT_WORD, payload: word })}
                useRomajiMode={state.useRomajiMode}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

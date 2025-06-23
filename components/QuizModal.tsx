'use client';

import React, { useEffect, useReducer, useCallback, useRef } from 'react';
import { Sentence } from '@/lib/types';
import { CachedAPI } from '@/lib/cache-utils';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import Button from './ui/Button';
import { chunkTextByLanguage, cleanTextForDisplay } from '@/lib/utils';
import LoadingSpinner from './ui/LoadingSpinner';
import AudioPlayer from './AudioPlayer';
import { 
  initialSingleQuizState, 
  singleQuizReducer, 
  SingleQuizActionType, 
  WordItem 
} from './quiz/useSingleQuiz';

interface QuizModalProps {
  sentence: Sentence;
  onClose: () => void;
}

export default function QuizModal({ sentence, onClose }: QuizModalProps) {
  const [state, dispatch] = useReducer(singleQuizReducer, initialSingleQuizState);
  const { 
    shuffledWords, 
    selectedWords, 
    isCorrect, 
    score, 
    isSubmitting, 
    isLoading, 
    useRomajiMode 
  } = state;
  
  const { playingWord, playWordAudio } = useAudioPlayer();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initializeQuiz = useCallback(async (currentSentence: Sentence) => {
    dispatch({ type: SingleQuizActionType.INITIALIZE_START });
    
    const targetSentence = currentSentence.nativeSentence || currentSentence.spanishTranslation || currentSentence.englishSentence;
    const languageCode = currentSentence.languageCode || 'es-es';
    
    let useRomaji = false;
    if (languageCode === 'ja-jp') {
      useRomaji = Math.random() > 0.5;
    }
    
    try {
      const wordChunks = await chunkTextByLanguage(targetSentence, languageCode, useRomaji);
      
      const words = wordChunks.map((word: string, index: number) => ({
        id: `${index}-${word}`,
        word: word.replace(/[.,!?;:]/g, ''),
        isSelected: false,
        originalIndex: index,
      }));

      const shuffled = [...words].sort(() => Math.random() - 0.5);
      
      dispatch({ 
        type: SingleQuizActionType.INITIALIZE_SUCCESS, 
        payload: { shuffledWords: shuffled, useRomajiMode: useRomaji } 
      });
    } catch (error) {
      console.error('Error initializing quiz:', error);
      // You could dispatch an INITIALIZE_FAILURE action here if needed
    }
  }, []);

  useEffect(() => {
    if (sentence) {
      initializeQuiz(sentence);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [sentence, initializeQuiz]);

  const handleSelectedWordClick = (word: WordItem) => {
    dispatch({ type: SingleQuizActionType.DESELECT_WORD, payload: word });
  };

  const checkAnswer = useCallback(async (wordsToCheck: WordItem[]) => {
    const totalWords = shuffledWords.length;
    if (wordsToCheck.length !== totalWords) return;

    dispatch({ type: SingleQuizActionType.SUBMIT_START });
    
    const isInCorrectOrder = wordsToCheck.every((word, index) => word.originalIndex === index);
    const correctWords = wordsToCheck.filter((word, index) => word.originalIndex === index).length;
    const newScore = Math.round((correctWords / totalWords) * 100);
    
    dispatch({ type: SingleQuizActionType.SET_ANSWER, payload: { isCorrect: isInCorrectOrder, score: newScore } });
    
    try {
      await CachedAPI.saveQuizAttempt(sentence.id, newScore, totalWords);
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    } finally {
      dispatch({ type: SingleQuizActionType.SUBMIT_END });
    }
  }, [shuffledWords.length, sentence.id]);

  const resetQuiz = useCallback(() => {
    if (sentence) {
      initializeQuiz(sentence);
    }
  }, [sentence, initializeQuiz]);

  const handleWordClick = useCallback(async (word: WordItem) => {
    if (word.isSelected) {
      handleSelectedWordClick(word);
      return;
    }
    
    try {
      await playWordAudio(word.word, sentence.languageCode || 'es-es');
    } catch (error) {
      console.error('❌ QuizModal: Error playing word audio:', error);
    }
    
    dispatch({ type: SingleQuizActionType.SELECT_WORD, payload: word });

  }, [sentence.languageCode, playWordAudio]);
  
  useEffect(() => {
    if (selectedWords.length === shuffledWords.length && shuffledWords.length > 0) {
      if (isCorrect === null) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => checkAnswer(selectedWords), 100);
      }
    }
  }, [selectedWords, shuffledWords, isCorrect, checkAnswer]);


  const clearAnswer = useCallback(() => {
    dispatch({ type: SingleQuizActionType.CLEAR_ANSWER });
  }, []);

  // Countdown and auto-close logic remains the same for now, but uses `isCorrect` from reducer state
  const [countdown, setCountdown] = React.useState<number>(0);
  useEffect(() => {
    if (isCorrect !== null) {
      setCountdown(3);
      
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      const countdownTimer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownTimer);
      };
    } else {
      setCountdown(0);
    }
  }, [isCorrect, onClose]);


  const quizTitle = cleanTextForDisplay(
    sentence.nativeSentence || sentence.spanishTranslation || '',
    sentence.languageCode || 'es-es', 
    useRomajiMode
  );

  const answer = selectedWords.map(w => w.word).join(' ');

  const getWordStyle = (word: WordItem) => {
    let className = "px-4 py-2 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-md cursor-pointer hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50";
    if (playingWord === word.word) {
      className += "animate-pulse-bright";
    }
    return className;
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner />
        <p className="mt-4 text-lg text-gray-400">Loading Quiz...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl p-6 mx-4 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
        <button
          onClick={onClose}
          className="absolute text-2xl text-gray-400 top-4 right-4 hover:text-white"
        >
          &times;
        </button>

        <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-semibold text-gray-200">
              Translate this sentence:
            </h4>
            <AudioPlayer
              audioPath={`/api/audio/${sentence.id}`}
            />
          </div>
          <p className="mb-2 text-2xl font-bold text-center text-white">
            {sentence.englishSentence}
          </p>
          {sentence.languageCode === 'ja-jp' && useRomajiMode && (
            <p className="text-sm text-center text-yellow-400">(Quiz Mode: Romaji)</p>
          )}
           {sentence.languageCode === 'ja-jp' && !useRomajiMode && (
            <p className="text-sm text-center text-cyan-400">(Quiz Mode: Native Script)</p>
          )}
        </div>
        
        {isCorrect !== null ? (
          <div className="flex flex-col items-center justify-center p-8 my-4 text-center">
            <h3 className={`text-4xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </h3>
            <p className="mt-2 text-lg text-gray-300">Your score: {score}%</p>
            {!isCorrect && (
              <p className="mt-2 text-md text-gray-400">Correct Answer: {quizTitle}</p>
            )}
            <p className="mt-4 text-gray-500">Closing in {countdown}s...</p>
          </div>
        ) : (
          <>
            <div className="my-4 min-h-[6rem] p-4 bg-gray-900 border-2 border-dashed border-gray-600 rounded-lg flex flex-wrap items-center justify-center gap-2">
              {selectedWords.length > 0 ? (
                selectedWords.map((word) => (
                  <button
                    key={word.id}
                    onClick={() => handleSelectedWordClick(word)}
                    className="px-4 py-2 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-md cursor-pointer hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    {word.word}
                  </button>
                ))
              ) : (
                <p className="text-gray-500">Click words below to build your answer</p>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {shuffledWords.map((word) => (
                <button
                  key={word.id}
                  disabled={word.isSelected}
                  onClick={() => handleWordClick(word)}
                  className={getWordStyle(word)}
                >
                  {word.word}
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <Button onClick={clearAnswer} disabled={selectedWords.length === 0} variant="secondary">
                Clear
              </Button>
              <Button onClick={resetQuiz} variant="secondary">
                Reset
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 
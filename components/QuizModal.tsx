'use client';

import React, { useEffect, useReducer, useCallback, useRef } from 'react';
import { Sentence } from '@/lib/types';
import { CachedAPI } from '@/lib/cache-utils';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import Button from './ui/Button';
import { cleanTextForDisplay, chunkTextWithPhonetics } from '@/lib/utils';
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

  // Add usePinyinMode alias for clarity
  const usePinyinMode = sentence.languageCode === 'zh-cn' ? useRomajiMode : false;

  const initializeQuiz = useCallback(async (currentSentence: Sentence) => {
    dispatch({ type: SingleQuizActionType.INITIALIZE_START });
    
    const targetSentence = currentSentence.nativeSentence || currentSentence.spanishTranslation || currentSentence.englishSentence;
    const languageCode = currentSentence.languageCode || 'es-es';
    
    let useRomaji = false;
    if (languageCode === 'ja-jp' || languageCode === 'zh-cn') {
      useRomaji = Math.random() > 0.5;
    }
    
    try {
      const { nativeChunks, phoneticChunks } = chunkTextWithPhonetics(targetSentence, languageCode);
      const displayChunks = (languageCode === 'zh-cn' || languageCode === 'ja-jp') && useRomaji && phoneticChunks.length > 0 
        ? phoneticChunks 
        : nativeChunks;
      
      const words = displayChunks.map((word: string, index: number) => ({
        id: `${index}-${word}`,
        word: (languageCode === 'zh-cn' || languageCode === 'ja-jp') ? word : word.replace(/[.,!?;:]/g, ''),
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

  const resetQuiz = useCallback(() => {
    if (sentence) {
      initializeQuiz(sentence);
    }
  }, [sentence, initializeQuiz]);

  const languageCode = sentence.languageCode || 'es-es';
  const { nativeChunks, phoneticChunks } = chunkTextWithPhonetics(sentence.nativeSentence || sentence.spanishTranslation || '', languageCode);
  const displayChunks = usePinyinMode && phoneticChunks.length > 0 ? phoneticChunks : nativeChunks;

  // Use the stable shuffledWords from state instead of recreating them
  const shuffledDisplayWords = shuffledWords;

  const checkAnswer = useCallback(async (wordsToCheck: WordItem[]) => {
    const totalWords = displayChunks.length;
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
  }, [displayChunks.length, sentence.id]);

  const handleWordClick = useCallback(async (word: WordItem) => {
    if (word.isSelected) {
      handleSelectedWordClick(word);
      return;
    }
    let wordToPlay = word.word;
    let shouldPlay = true;
    if (languageCode === 'zh-cn' || languageCode === 'ja-jp') {
      if (usePinyinMode && phoneticChunks.length > 0) {
        const idx = phoneticChunks.findIndex(p => p === word.word);
        if (idx !== -1 && nativeChunks[idx]) {
          wordToPlay = nativeChunks[idx];
        } else {
          shouldPlay = false;
        }
      } else {
        if (!nativeChunks.includes(word.word)) {
          shouldPlay = false;
        }
      }
      if (shouldPlay && wordToPlay && !/[a-zA-Z]/.test(wordToPlay)) {
        try {
          await playWordAudio(wordToPlay, languageCode);
        } catch (error) {
          console.error('❌ QuizModal: Error playing word audio:', error);
        }
      }
    } else {
      if (wordToPlay) {
        try {
          await playWordAudio(wordToPlay, languageCode);
        } catch (error) {
          console.error('❌ QuizModal: Error playing word audio:', error);
        }
      }
    }
    dispatch({ type: SingleQuizActionType.SELECT_WORD, payload: word });
  }, [languageCode, playWordAudio, usePinyinMode, nativeChunks, phoneticChunks]);
  
  useEffect(() => {
    // Use displayChunks length for consistent completion check
    if (selectedWords.length === displayChunks.length && displayChunks.length > 0) {
      if (isCorrect === null) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => checkAnswer(selectedWords), 100);
      }
    }
  }, [selectedWords, displayChunks, isCorrect, checkAnswer]);


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
    let className = "btn btn-primary me-2 mb-2";
    if (playingWord === word.word) {
      className += " pulse";
    }
    return className;
  };
  
  if (isLoading) {
    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center">
              <LoadingSpinner />
              <p className="mt-3">Loading Quiz...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="modal-dialog modal-dialog-centered modal-fullscreen-sm-down modal-lg">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-primary text-white border-0">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-question-circle me-2"></i>
              Single Quiz
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body p-4">
            <div className="card border-0 bg-light mb-4">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="card-title mb-0 fw-bold">
                    <i className="bi bi-translate me-2 text-primary"></i>
                    Translate this sentence:
                  </h6>
                  {sentence.audioPath && (
                    <div className="d-flex align-items-center">
                      <AudioPlayer audioPath={sentence.audioPath} />
                    </div>
                  )}
                </div>
                <p className="h4 text-center fw-bold text-dark mb-2">
                  {sentence.englishSentence}
                </p>
                {sentence.languageCode === 'ja-jp' && useRomajiMode && (
                  <p className="text-center text-warning small mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    Quiz Mode: Romaji
                  </p>
                )}
                {sentence.languageCode === 'ja-jp' && !useRomajiMode && (
                  <p className="text-center text-info small mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    Quiz Mode: Native Script
                  </p>
                )}
                {sentence.languageCode === 'zh-cn' && usePinyinMode && (
                  <p className="text-center text-warning small mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    Quiz Mode: Pinyin
                  </p>
                )}
                {sentence.languageCode === 'zh-cn' && !usePinyinMode && (
                  <p className="text-center text-info small mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    Quiz Mode: 汉字 (Characters)
                  </p>
                )}
              </div>
            </div>
            
            {isCorrect !== null ? (
              <div className="text-center p-4">
                <div className={`display-1 mb-3 ${isCorrect ? 'text-success' : 'text-danger'}`}>
                  <i className={`bi ${isCorrect ? 'bi-check-circle' : 'bi-x-circle'}`}></i>
                </div>
                <h3 className={`display-6 fw-bold ${isCorrect ? 'text-success' : 'text-danger'}`}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </h3>
                <p className="lead mb-3">Your score: <span className="fw-bold">{score}%</span></p>
                {!isCorrect && (
                  <div className="alert alert-light border">
                    <small className="text-muted">Correct Answer:</small>
                    <p className="fw-bold mb-0">{quizTitle}</p>
                  </div>
                )}
                <p className="text-muted">
                  <i className="bi bi-clock me-1"></i>
                  Closing in {countdown}s...
                </p>
              </div>
            ) : (
              <>
                {/* Answer Area - Mobile optimized */}
                <div className="mb-4">
                  <label className="form-label fw-semibold mb-2">
                    <i className="bi bi-pencil-square me-2 text-primary"></i>
                    Your Answer:
                  </label>
                  <div className="min-h-100 p-4 bg-white border border-dashed border-secondary rounded-3 d-flex flex-wrap align-items-center justify-content-center gap-2">
                    {selectedWords.length > 0 ? (
                      selectedWords.map((word, index) => (
                        <button
                          key={word.id}
                          onClick={() => handleSelectedWordClick(word)}
                          className="btn btn-primary btn-lg px-3 py-2"
                        >
                          {word.word}
                        </button>
                      ))
                    ) : (
                      <div className="text-center text-muted">
                        <i className="bi bi-arrow-down display-6 mb-2"></i>
                        <p className="mb-0">Tap words below to build your answer</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Word Bank - Mobile optimized */}
                <div className="mb-4">
                  <label className="form-label fw-semibold mb-2">
                    <i className="bi bi-collection me-2 text-primary"></i>
                    Word Bank:
                  </label>
                  <div className="d-flex flex-wrap justify-content-center gap-2">
                    {shuffledDisplayWords.map((wordItem) => (
                      <button
                        key={wordItem.id}
                        disabled={selectedWords.some(w => w.id === wordItem.id)}
                        onClick={() => handleWordClick(wordItem)}
                        className={`btn btn-lg px-3 py-2 ${getWordStyle(wordItem)}`}
                        style={{ minWidth: '80px' }}
                      >
                        {wordItem.word}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons - Mobile optimized */}
                <div className="d-flex justify-content-center gap-3">
                  <Button 
                    onClick={clearAnswer} 
                    disabled={selectedWords.length === 0} 
                    variant="secondary" 
                    size="lg"
                    className="px-4"
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Clear
                  </Button>
                  <Button 
                    onClick={resetQuiz} 
                    variant="primary" 
                    size="lg"
                    className="px-4"
                  >
                    <i className="bi bi-arrow-repeat me-2"></i>
                    Reset
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sentence } from '@/lib/types';
import AudioPlayer from './AudioPlayer';
import { CachedAPI } from '@/lib/cache-utils';
import Button from './ui/Button';

interface QuizModalProps {
  sentence: Sentence;
  onClose: () => void;
}

interface WordItem {
  id: string;
  word: string;
  isSelected: boolean;
  originalIndex: number;
}

interface QuizState {
  shuffledWords: WordItem[];
  selectedWords: WordItem[];
  isCorrect: boolean | null;
  score: number;
  isSubmitting: boolean;
  playingWord: string | null;
}

export default function QuizModal({ sentence, onClose }: QuizModalProps) {
  const [quizState, setQuizState] = useState<QuizState>({
    shuffledWords: [],
    selectedWords: [],
    isCorrect: null,
    score: 0,
    isSubmitting: false,
    playingWord: null,
  });
  const [countdown, setCountdown] = useState<number>(0);
  
  // Refs for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    initializeQuiz();
    
    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, [sentence]);

  const initializeQuiz = useCallback(() => {
    // Use Spanish sentence for quiz instead of English
    const spanishSentence = sentence.spanishTranslation || sentence.englishSentence;
    const words = spanishSentence.split(' ').map((word: string, index: number) => ({
      id: `${index}-${word}`,
      word: word.replace(/[.,!?;:]/g, ''),
      isSelected: false,
      originalIndex: index,
    }));

    // Shuffle the words
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setQuizState(prev => ({ ...prev, shuffledWords: shuffled, selectedWords: [], isCorrect: null, score: 0 }));
  }, [sentence.spanishTranslation, sentence.englishSentence]);

  const playWordAudio = useCallback(async (word: string) => {
    if (quizState.playingWord === word) return; // Prevent multiple simultaneous plays
    
    setQuizState(prev => ({ ...prev, playingWord: word }));
    try {
      console.log(`Requesting audio for word: "${word}"`);
      
      // Use cached API to get word audio
      const audioBlob = await CachedAPI.getWordAudio(word, 'es-ES');
      
      console.log(`Received audio blob for "${word}":`, {
        size: audioBlob.size,
        type: audioBlob.type
      });
      
      // Clean up previous URL if exists
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      
      console.log(`Created audio URL for "${word}":`, audioUrl);
      
      const audio = new Audio(audioUrl);
      
      // Set up event listeners
      const handleEnded = () => {
        console.log(`Audio ended for "${word}"`);
        setQuizState(prev => ({ ...prev, playingWord: null }));
        if (audioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);
          audioUrlRef.current = null;
        }
      };
      
      const handleError = (error: Event) => {
        console.error('Audio playback error:', error);
        console.error('Audio element details:', {
          src: audio.src,
          readyState: audio.readyState,
          networkState: audio.networkState,
          error: audio.error
        });
        setQuizState(prev => ({ ...prev, playingWord: null }));
        if (audioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);
          audioUrlRef.current = null;
        }
        // Clean up event listeners
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };
      
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      
      // Try to play the audio
      try {
        console.log(`Attempting to play audio for "${word}"`);
        await audio.play();
        console.log(`Successfully started playing audio for "${word}"`);
      } catch (playError) {
        console.error('Failed to play audio:', playError);
        setQuizState(prev => ({ ...prev, playingWord: null }));
        if (audioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);
          audioUrlRef.current = null;
        }
        // Clean up event listeners
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      }
    } catch (error) {
      console.error('Error getting word audio:', error);
      setQuizState(prev => ({ ...prev, playingWord: null }));
      // Don't show error to user for audio failures - just log it
    }
  }, [quizState.playingWord]);

  const checkAnswer = useCallback(async (wordsToCheck: WordItem[]) => {
    const spanishSentence = sentence.spanishTranslation || sentence.englishSentence;
    const totalWords = spanishSentence.split(' ').length;
    
    // Check if all words are selected
    if (wordsToCheck.length !== totalWords) {
      return;
    }

    // Check if words are in correct order
    const isInCorrectOrder = wordsToCheck.every((word, index) => word.originalIndex === index);
    
    // Calculate score based on correct words in correct positions
    const correctWords = wordsToCheck.filter((word, index) => word.originalIndex === index).length;
    const newScore = Math.round((correctWords / totalWords) * 100);
    
    setQuizState(prev => ({ ...prev, score: newScore, isCorrect: isInCorrectOrder }));
    
    // Save quiz attempt using cached API
    setQuizState(prev => ({ ...prev, isSubmitting: true }));
    try {
      await CachedAPI.saveQuizAttempt(sentence.id, newScore, totalWords);
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    } finally {
      setQuizState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [sentence.id, sentence.spanishTranslation, sentence.englishSentence]);

  const resetQuiz = useCallback(() => {
    initializeQuiz();
  }, [initializeQuiz]);

  const spanishSentence = sentence.spanishTranslation || sentence.englishSentence;

  const handleWordClick = useCallback((word: WordItem) => {
    if (word.isSelected) {
      // Remove word from selected (click to deselect)
      setQuizState(prev => ({
        ...prev,
        shuffledWords: prev.shuffledWords.map(w => w.id === word.id ? { ...w, isSelected: false } : w),
        selectedWords: prev.selectedWords.filter(w => w.id !== word.id)
      }));
    } else {
      // Add word to selected
      setQuizState(prev => {
        const newSelectedWords = [...prev.selectedWords, word];
        const newShuffledWords = prev.shuffledWords.map(w => w.id === word.id ? { ...w, isSelected: true } : w);
        
        // Check if we have all words selected
        const totalWords = spanishSentence.split(' ').length;
        
        if (newSelectedWords.length === totalWords && prev.isCorrect === null) {
          // Clear any existing timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          // Small delay to allow state to update
          timeoutRef.current = setTimeout(() => {
            checkAnswer(newSelectedWords);
          }, 100);
        }
        
        return {
          ...prev,
          shuffledWords: newShuffledWords,
          selectedWords: newSelectedWords
        };
      });
      
      // Play pronunciation for the word
      playWordAudio(word.word);
    }
  }, [playWordAudio, spanishSentence, checkAnswer]);

  const handleSelectedWordClick = useCallback((word: WordItem) => {
    // Remove word from selected answer
    setQuizState(prev => ({
      ...prev,
      selectedWords: prev.selectedWords.filter(w => w.id !== word.id),
      shuffledWords: prev.shuffledWords.map(w => w.id === word.id ? { ...w, isSelected: false } : w)
    }));
  }, []);

  const clearAnswer = useCallback(() => {
    setQuizState(prev => ({
      ...prev,
      selectedWords: [],
      shuffledWords: prev.shuffledWords.map(w => ({ ...w, isSelected: false }))
    }));
  }, []);

  // Auto-close quiz complete view after 3 seconds
  useEffect(() => {
    if (quizState.isCorrect !== null) {
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
  }, [quizState.isCorrect, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Spanish Word Order Quiz</h2>
            <Button
              onClick={onClose}
              variant="secondary"
              size="sm"
              className="text-gray-400 hover:text-gray-600 text-2xl p-0"
            >
              ×
            </Button>
          </div>

          {/* Show original sentence only after answer is checked */}
          {quizState.isCorrect !== null && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Original Spanish Sentence:
              </h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                {spanishSentence}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                English: {sentence.englishSentence}
              </p>
              {sentence.audioPath && (
                <div className="mt-3">
                  <AudioPlayer
                    audioPath={sentence.audioPath}
                    isPlaying={false}
                    onPlay={() => {}}
                    onStop={() => {}}
                  />
                </div>
              )}
            </div>
          )}

          {/* Show English reference during quiz */}
          {quizState.isCorrect === null && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                English Reference:
              </h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                {sentence.englishSentence}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Reconstruct the Spanish translation by clicking words in the correct order
              </p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {quizState.isCorrect === null 
                ? "Click words in the correct Spanish order:" 
                : "Your reconstruction:"
              }
            </h3>
            
            {/* Selected words */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">Your answer:</h4>
                {quizState.selectedWords.length > 0 && quizState.isCorrect === null && (
                  <Button
                    onClick={clearAnswer}
                    variant="error"
                    size="sm"
                    className="text-sm underline"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              <div className="min-h-[40px] border-2 border-dashed border-gray-300 rounded-lg p-2 flex flex-wrap gap-2">
                {quizState.selectedWords.map((word, index) => (
                  <Button
                    key={`selected-${word.id}`}
                    onClick={quizState.isCorrect === null ? () => handleSelectedWordClick(word) : undefined}
                    variant={quizState.isCorrect === null ? "primary" : "secondary"}
                    size="sm"
                    disabled={quizState.isCorrect !== null}
                    className={`rounded-full ${quizState.isCorrect !== null ? 'cursor-default' : ''}`}
                    title={quizState.isCorrect === null ? "Click to remove this word" : undefined}
                  >
                    {word.word}
                  </Button>
                ))}
              </div>
            </div>

            {/* Available words - always show all words, disable selected ones */}
            {quizState.isCorrect === null && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Available words:</h4>
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {quizState.shuffledWords.map((word) => (
                    <Button
                      key={word.id}
                      onClick={() => handleWordClick(word)}
                      disabled={word.isSelected}
                      variant="secondary"
                      size="sm"
                      className={`min-w-[60px] ${word.isSelected ? 'opacity-60 line-through' : ''}`}
                      title={word.isSelected ? "Word already selected" : "Click to select (will play pronunciation)"}
                    >
                      {word.word}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Result */}
          {quizState.isCorrect !== null && (
            <div className={`mb-6 p-4 rounded-lg ${
              quizState.isCorrect ? 'bg-success-50 border border-success-200' : 'bg-error-50 border border-error-200'
            }`}>
              <div className="flex items-center">
                <span className={`text-2xl mr-3 ${quizState.isCorrect ? 'text-success-500' : 'text-error-500'}`}>
                  {quizState.isCorrect ? '✅' : '❌'}
                </span>
                <div>
                  <h4 className={`font-semibold ${quizState.isCorrect ? 'text-success-700' : 'text-error-700'}`}>
                    {quizState.isCorrect ? 'Perfect! Well done!' : 'Not quite right. Try again!'}
                  </h4>
                  <p className={`text-sm ${quizState.isCorrect ? 'text-success-600' : 'text-error-600'}`}>
                    Score: {quizState.score}% ({Math.round((quizState.score / 100) * spanishSentence.split(' ').length)}/{spanishSentence.split(' ').length} words in correct positions)
                  </p>
                  {countdown > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Closing in {countdown} second{countdown !== 1 ? 's' : ''}...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            {quizState.isCorrect === null ? (
              <div className="text-sm text-gray-600 italic">
                {quizState.isSubmitting ? 'Checking your answer...' : `Select ${spanishSentence.split(' ').length} words to complete the quiz`}
              </div>
            ) : (
              <Button
                onClick={resetQuiz}
                variant="secondary"
              >
                Try Again
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="secondary"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 
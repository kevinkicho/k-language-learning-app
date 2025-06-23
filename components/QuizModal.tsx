'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sentence } from '@/lib/types';
import AudioPlayer from './AudioPlayer';
import { CachedAPI } from '@/lib/cache-utils';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
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
}

export default function QuizModal({ sentence, onClose }: QuizModalProps) {
  const [quizState, setQuizState] = useState<QuizState>({
    shuffledWords: [],
    selectedWords: [],
    isCorrect: null,
    score: 0,
    isSubmitting: false,
  });
  const [countdown, setCountdown] = useState<number>(0);
  
  const { playingWord, playWordAudio } = useAudioPlayer();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeQuiz();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [sentence]);

  const initializeQuiz = useCallback(() => {
    const spanishSentence = sentence.spanishTranslation || sentence.englishSentence;
    const words = spanishSentence.split(' ').map((word: string, index: number) => ({
      id: `${index}-${word}`,
      word: word.replace(/[.,!?;:]/g, ''),
      isSelected: false,
      originalIndex: index,
    }));

    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setQuizState(prev => ({ ...prev, shuffledWords: shuffled, selectedWords: [], isCorrect: null, score: 0 }));
  }, [sentence.spanishTranslation, sentence.englishSentence]);

  const checkAnswer = useCallback(async (wordsToCheck: WordItem[]) => {
    const spanishSentence = sentence.spanishTranslation || sentence.englishSentence;
    const totalWords = spanishSentence.split(' ').length;
    
    if (wordsToCheck.length !== totalWords) {
      return;
    }

    const isInCorrectOrder = wordsToCheck.every((word, index) => word.originalIndex === index);
    const correctWords = wordsToCheck.filter((word, index) => word.originalIndex === index).length;
    const newScore = Math.round((correctWords / totalWords) * 100);
    
    setQuizState(prev => ({ ...prev, score: newScore, isCorrect: isInCorrectOrder }));
    
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

  const handleWordClick = useCallback(async (word: WordItem) => {
    console.log(`🖱️ QuizModal: Word clicked: ${word.word}, isSelected: ${word.isSelected}`);
    
    if (word.isSelected) {
      console.log(`🔄 Deselecting word: ${word.word}`);
      setQuizState(prev => ({
        ...prev,
        shuffledWords: prev.shuffledWords.map(w => w.id === word.id ? { ...w, isSelected: false } : w),
        selectedWords: prev.selectedWords.filter(w => w.id !== word.id)
      }));
    } else {
      // Play audio for the word first
      try {
        console.log(`🎵 QuizModal: Calling playWordAudio for: ${word.word}`);
        await playWordAudio(word.word, sentence.languageCode || 'es-es');
        console.log(`✅ QuizModal: Audio played successfully for: ${word.word}`);
      } catch (error) {
        console.error('❌ QuizModal: Error playing word audio:', error);
      }
      
      console.log(`📝 QuizModal: Selecting word: ${word.word}`);
      setQuizState(prev => {
        const updatedShuffled = prev.shuffledWords.map(w => 
          w.id === word.id ? { ...w, isSelected: true } : w
        );
        const newSelectedWords = [...prev.selectedWords, word];
        
        const spanishSentence = sentence.spanishTranslation || sentence.englishSentence;
        const totalWords = spanishSentence.split(' ').length;
        
        if (newSelectedWords.length === totalWords && prev.isCorrect === null) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          timeoutRef.current = setTimeout(() => {
            checkAnswer(newSelectedWords);
          }, 100);
        }
        
        return {
          ...prev,
          shuffledWords: updatedShuffled,
          selectedWords: newSelectedWords,
        };
      });
    }
  }, [sentence.spanishTranslation, sentence.englishSentence, checkAnswer, playWordAudio]);

  const handleSelectedWordClick = useCallback((word: WordItem) => {
    setQuizState(prev => {
      const updatedSelected = prev.selectedWords.filter(w => w.id !== word.id);
      const updatedShuffled = prev.shuffledWords.map(w => 
        w.id === word.id ? { ...w, isSelected: false } : w
      );
      
      return {
        ...prev,
        selectedWords: updatedSelected,
        shuffledWords: updatedShuffled,
      };
    });
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

  const spanishSentence = sentence.spanishTranslation || sentence.englishSentence;

  if (quizState.isCorrect !== null) {
    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center">
              <h3 className={quizState.isCorrect ? 'text-success' : 'text-danger'}>
                {quizState.isCorrect ? '¡Correcto!' : 'Incorrecto'}
              </h3>
              <p>Score: {quizState.score}%</p>
              <p>Closing in {countdown} seconds...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Quiz: {spanishSentence}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            <div className="mb-3">
              <h6>Instructions:</h6>
              <p>Click the words in the correct order to form the sentence.</p>
            </div>

            {/* Selected words display */}
            <div className="mb-3">
              <h6>Your answer:</h6>
              <div className="d-flex flex-wrap gap-2">
                {quizState.selectedWords.map((word, index) => (
                  <button
                    key={`selected-${word.id}`}
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSelectedWordClick(word)}
                  >
                    {word.word}
                  </button>
                ))}
              </div>
            </div>

            {/* Available words */}
            <div className="mb-3">
              <h6>Available words:</h6>
              <div className="d-flex flex-wrap gap-2">
                {quizState.shuffledWords.map((word) => (
                  <button
                    key={word.id}
                    className={`btn btn-outline-primary me-2 mb-2 ${
                      word.isSelected ? 'btn-primary' : ''
                    }`}
                    onClick={() => handleWordClick(word)}
                    disabled={word.isSelected}
                  >
                    {word.word}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="d-flex gap-2">
              <Button variant="secondary" onClick={clearAnswer}>
                Clear Answer
              </Button>
              <Button variant="info" onClick={resetQuiz}>
                Reset Quiz
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
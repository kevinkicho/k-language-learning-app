import { useState, useCallback, useRef, useEffect } from 'react';
import { Sentence, WordItem, QuizState } from '@/lib/types';
import { CachedAPI } from '@/lib/cache-utils';
import { 
  cleanWord, 
  generateId, 
  shuffleArray, 
  calculateScore, 
  isCorrectOrder 
} from '@/lib/utils';

interface UseQuizReturn {
  quizState: QuizState;
  initializeQuiz: () => void;
  handleWordClick: (word: WordItem) => void;
  handleSelectedWordClick: (word: WordItem) => void;
  clearAnswer: () => void;
  resetQuiz: () => void;
}

export function useQuiz(sentence: Sentence): UseQuizReturn {
  const [quizState, setQuizState] = useState<QuizState>({
    shuffledWords: [],
    selectedWords: [],
    isCorrect: null,
    score: 0,
    isSubmitting: false,
    playingWord: null,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initializeQuiz = useCallback(() => {
    const spanishSentence = sentence.spanishTranslation || sentence.englishSentence;
    const words = spanishSentence.split(' ').map((word, index) => ({
      id: generateId('word', index, word),
      word: cleanWord(word),
      isSelected: false,
      originalIndex: index,
    }));

    const shuffled = shuffleArray(words);
    
    setQuizState({
      shuffledWords: shuffled,
      selectedWords: [],
      isCorrect: null,
      score: 0,
      isSubmitting: false,
      playingWord: null,
    });
  }, [sentence.spanishTranslation, sentence.englishSentence]);

  const checkAnswer = useCallback(async (wordsToCheck: WordItem[]) => {
    const spanishSentence = sentence.spanishTranslation || sentence.englishSentence;
    const totalWords = spanishSentence.split(' ').length;
    
    if (wordsToCheck.length !== totalWords) {
      return;
    }

    const isInCorrectOrder = isCorrectOrder(wordsToCheck);
    const newScore = calculateScore(wordsToCheck, totalWords);
    
    setQuizState(prev => ({
      ...prev,
      score: newScore,
      isCorrect: isInCorrectOrder,
      isSubmitting: true,
    }));
    
    try {
      await CachedAPI.saveQuizAttempt(sentence.id, newScore, totalWords);
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    } finally {
      setQuizState(prev => ({
        ...prev,
        isSubmitting: false,
      }));
    }
  }, [sentence.id, sentence.spanishTranslation, sentence.englishSentence]);

  const handleWordClick = useCallback((word: WordItem) => {
    setQuizState(prev => {
      if (word.isSelected) {
        // Remove word from selected
        const updatedShuffled = prev.shuffledWords.map(w => 
          w.id === word.id ? { ...w, isSelected: false } : w
        );
        const updatedSelected = prev.selectedWords.filter(w => w.id !== word.id);
        
        return {
          ...prev,
          shuffledWords: updatedShuffled,
          selectedWords: updatedSelected,
        };
      } else {
        // Add word to selected
        const updatedShuffled = prev.shuffledWords.map(w => 
          w.id === word.id ? { ...w, isSelected: true } : w
        );
        const newSelectedWords = [...prev.selectedWords, word];
        
        // Check if all words are selected
        const spanishSentence = sentence.spanishTranslation || sentence.englishSentence;
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
          shuffledWords: updatedShuffled,
          selectedWords: newSelectedWords,
        };
      }
    });
  }, [sentence.spanishTranslation, sentence.englishSentence, checkAnswer]);

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
      shuffledWords: prev.shuffledWords.map(w => ({ ...w, isSelected: false })),
    }));
  }, []);

  const resetQuiz = useCallback(() => {
    initializeQuiz();
  }, [initializeQuiz]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    quizState,
    initializeQuiz,
    handleWordClick,
    handleSelectedWordClick,
    clearAnswer,
    resetQuiz,
  };
} 
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
import { chunkTextWithPhonetics } from '@/lib/utils';
import { QuizModalWrapper } from './quiz/shared';

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

  const languageCode = currentSentence?.languageCode || 'es-es';
  const { nativeChunks, phoneticChunks } = chunkTextWithPhonetics(currentSentence?.spanishTranslation || currentSentence?.englishSentence || '', languageCode);
  const displayChunks = (languageCode === 'zh-cn' || languageCode === 'ja-jp') && state.useRomajiMode && phoneticChunks.length > 0 
    ? phoneticChunks 
    : nativeChunks;

  // Use the stable shuffledWords from state instead of recreating them
  const shuffledDisplayWords = state.shuffledWords;

  const handleWordClick = async (word: WordItem) => {
    console.log(`🖱️ Word clicked: ${word.word}`);
    try {
      let wordToPlay = word.word;
      let shouldPlay = true;
      const languageCode = currentSentence?.languageCode || 'es-es';
      if ((languageCode === 'zh-cn' || languageCode === 'ja-jp')) {
        const text = currentSentence.spanishTranslation || currentSentence.englishSentence;
        const { nativeChunks, phoneticChunks } = chunkTextWithPhonetics(text, languageCode);
        
        if (state.useRomajiMode && phoneticChunks.length > 0) {
          // We're in pinyin/romaji mode, so we need to map the clicked phonetic word to the native character
          const phoneticIndex = phoneticChunks.findIndex(p => p.replace(/[^a-zA-Z\dāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜü]/g, '') === word.word.replace(/[^a-zA-Z\dāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜü]/g, ''));
          if (phoneticIndex >= 0 && phoneticIndex < nativeChunks.length) {
            wordToPlay = nativeChunks[phoneticIndex];
            console.log(`🎵 Mapping pinyin "${word.word}" to character "${wordToPlay}"`);
          } else {
            console.log(`⚠️ Could not map pinyin "${word.word}" to character`);
            shouldPlay = false;
          }
        } else {
          // We're in native mode, so play the character directly
          wordToPlay = word.word;
        }
      }
      
      if (shouldPlay && wordToPlay) {
        console.log(`🎵 Calling playWordAudio for: ${wordToPlay}`);
        await playWordAudio(wordToPlay, languageCode);
        console.log(`✅ playWordAudio succeeded for: ${wordToPlay}`);
      }
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
      const { nativeChunks, phoneticChunks } = chunkTextWithPhonetics(spanishSentence, languageCode);
      
      // Use phonetic chunks if in pinyin/romaji mode and they exist, otherwise use native chunks
      const chunksToUse = (languageCode === 'zh-cn' || languageCode === 'ja-jp') && state.useRomajiMode && phoneticChunks.length > 0 
        ? phoneticChunks 
        : nativeChunks;
      
      console.log(`[QUIZ INIT] Language: ${languageCode}, Mode: ${state.useRomajiMode ? 'pinyin/romaji' : 'native'}`);
      console.log(`[QUIZ INIT] Native chunks:`, nativeChunks);
      console.log(`[QUIZ INIT] Phonetic chunks:`, phoneticChunks);
      console.log(`[QUIZ INIT] Using chunks:`, chunksToUse);
      
      const words = chunksToUse.map((word: string, index: number) => ({
        id: `${index}-${word}`,
        word: (languageCode === 'zh-cn' || languageCode === 'ja-jp') ? word : word.replace(/[.,!?;:]/g, ''),
        isSelected: false,
        originalIndex: index,
      }));

      const shuffled = [...words].sort(() => Math.random() - 0.5);
      console.log(`[QUIZ INIT] Shuffled words:`, shuffled);
      
      // Update the state with the new shuffled words
      dispatch({ type: QuizActionType.INITIALIZE_QUIZ, sentence: currentSentence });
      
      // Manually set the shuffled words since the reducer uses fallback
      // We need to update the state directly
      setTimeout(() => {
        // Force a re-render with the correct words
        dispatch({ type: QuizActionType.SET_SHUFFLED_WORDS, payload: shuffled });
      }, 0);
    } catch (error) {
      console.error('Error initializing quiz:', error);
      // Fallback: use simple word splitting
      dispatch({ type: QuizActionType.INITIALIZE_QUIZ, sentence: currentSentence });
    }
  }, [currentSentence, state.useRomajiMode, dispatch]);

  const checkAnswer = useCallback(async (wordsToCheck: WordItem[]) => {
    if (!currentSentence) return;
    
    console.log(`[CHECK ANSWER] Starting answer check with ${wordsToCheck.length} words`);
    console.log(`[CHECK ANSWER] Words to check:`, wordsToCheck.map(w => w.word));
    
    const spanishSentence = currentSentence.spanishTranslation || currentSentence.englishSentence;
    const languageCode = currentSentence.languageCode || 'es-es';
    
    try {
      const { nativeChunks, phoneticChunks } = chunkTextWithPhonetics(spanishSentence, languageCode);
      
      // Use phonetic chunks if in pinyin/romaji mode and they exist, otherwise use native chunks
      const chunksToUse = (languageCode === 'zh-cn' || languageCode === 'ja-jp') && state.useRomajiMode && phoneticChunks.length > 0 
        ? phoneticChunks 
        : nativeChunks;
      
      const totalWords = chunksToUse.length;
      
      console.log(`[CHECK ANSWER] Language: ${languageCode}, Mode: ${state.useRomajiMode ? 'pinyin/romaji' : 'native'}`);
      console.log(`[CHECK ANSWER] Native chunks:`, nativeChunks);
      console.log(`[CHECK ANSWER] Phonetic chunks:`, phoneticChunks);
      console.log(`[CHECK ANSWER] Using chunks:`, chunksToUse);
      console.log(`[CHECK ANSWER] Total words expected: ${totalWords}, Words to check: ${wordsToCheck.length}`);
      
      if (wordsToCheck.length !== totalWords) {
        console.log(`[CHECK ANSWER] ❌ Word count mismatch: expected ${totalWords}, got ${wordsToCheck.length}`);
        return;
      }

      const isInCorrectOrder = wordsToCheck.every((word, index) => word.originalIndex === index);
      const correctWords = wordsToCheck.filter((word, index) => word.originalIndex === index).length;
      const newScore = Math.round((correctWords / totalWords) * 100);
      
      console.log(`[CHECK ANSWER] ✅ Answer check complete: isCorrect=${isInCorrectOrder}, score=${newScore}`);
      
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
      
      console.log(`[CHECK ANSWER] Fallback - Total words expected: ${totalWords}, Words to check: ${wordsToCheck.length}`);
      
      if (wordsToCheck.length !== totalWords) {
        console.log(`[CHECK ANSWER] ❌ Fallback: Word count mismatch: expected ${totalWords}, got ${wordsToCheck.length}`);
        return;
      }

      const isInCorrectOrder = wordsToCheck.every((word, index) => word.originalIndex === index);
      const correctWords = wordsToCheck.filter((word, index) => word.originalIndex === index).length;
      const newScore = Math.round((correctWords / totalWords) * 100);
      
      console.log(`[CHECK ANSWER] ✅ Fallback: Answer check complete: isCorrect=${isInCorrectOrder}, score=${newScore}`);
      
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
      
      console.log(`[QUIZ CHECK] Checking answer - selectedWords: ${state.selectedWords.length}, isCorrect: ${state.isCorrect}`);
      console.log(`[QUIZ CHECK] Selected words:`, state.selectedWords.map(w => w.word));
      
      if (spanishSentence) {
        try {
          const { nativeChunks, phoneticChunks } = chunkTextWithPhonetics(spanishSentence, languageCode);
          
          // Use phonetic chunks if in pinyin/romaji mode and they exist, otherwise use native chunks
          const chunksToUse = (languageCode === 'zh-cn' || languageCode === 'ja-jp') && state.useRomajiMode && phoneticChunks.length > 0 
            ? phoneticChunks 
            : nativeChunks;
          
          const totalWords = chunksToUse.length;
          
          console.log(`[QUIZ CHECK] Language: ${languageCode}, Mode: ${state.useRomajiMode ? 'pinyin/romaji' : 'native'}`);
          console.log(`[QUIZ CHECK] Native chunks:`, nativeChunks);
          console.log(`[QUIZ CHECK] Phonetic chunks:`, phoneticChunks);
          console.log(`[QUIZ CHECK] Using chunks:`, chunksToUse);
          console.log(`[QUIZ CHECK] Total words expected: ${totalWords}, Selected words: ${state.selectedWords.length}`);
          
          if (totalWords > 0 && state.selectedWords.length === totalWords && state.isCorrect === null) {
            console.log(`[QUIZ CHECK] ✅ All words selected! Triggering answer check...`);
            if (checkAnswerTimeoutRef.current) clearTimeout(checkAnswerTimeoutRef.current);
            checkAnswerTimeoutRef.current = setTimeout(async () => {
              await checkAnswer(state.selectedWords);
            }, 200);
          } else {
            console.log(`[QUIZ CHECK] ❌ Not ready to check: totalWords=${totalWords}, selectedWords=${state.selectedWords.length}, isCorrect=${state.isCorrect}`);
          }
        } catch (error) {
          console.error('Error checking word chunks:', error);
          // Fallback: use simple word splitting
          const wordChunks = spanishSentence.split(/\s+/).filter(word => word.length > 0);
          const totalWords = wordChunks.length;
          
          console.log(`[QUIZ CHECK] Fallback - Total words expected: ${totalWords}, Selected words: ${state.selectedWords.length}`);
          
          if (totalWords > 0 && state.selectedWords.length === totalWords && state.isCorrect === null) {
            console.log(`[QUIZ CHECK] ✅ Fallback: All words selected! Triggering answer check...`);
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
    <QuizModalWrapper
      title={`${isRandom ? 'Random Quiz' : 'Selected Quiz'} (${state.currentSentenceIndex + 1}/${state.sentences.length})`}
      onClose={onClose}
      size="lg"
    >
      {!currentSentence && !state.isFinalReview ? (
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-3">Loading Quiz...</p>
        </div>
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
          languageCode={languageCode}
          useRomajiMode={state.useRomajiMode}
        />
      ) : (
        <>
          <div className="card border-0 bg-light mb-4">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="card-title mb-0 fw-bold">
                  <i className="bi bi-translate me-2 text-primary"></i>
                  Translate this sentence:
                </h6>
                {currentSentence.audioPath && (
                  <div className="d-flex align-items-center">
                    <Button variant="info" size="sm" onClick={() => playWordAudio(currentSentence.nativeSentence || currentSentence.spanishTranslation || currentSentence.englishSentence, languageCode)}>
                      <i className="bi bi-play-fill"></i>
                    </Button>
                  </div>
                )}
              </div>
              <p className="h4 text-center fw-bold text-dark mb-2">
                {currentSentence.englishSentence}
              </p>
              {currentSentence.languageCode === 'ja-jp' && state.useRomajiMode && (
                <p className="text-center text-warning small mb-0">
                  <i className="bi bi-info-circle me-1"></i>
                  Quiz Mode: Romaji
                </p>
              )}
              {currentSentence.languageCode === 'ja-jp' && !state.useRomajiMode && (
                <p className="text-center text-info small mb-0">
                  <i className="bi bi-info-circle me-1"></i>
                  Quiz Mode: Native Script
                </p>
              )}
              {currentSentence.languageCode === 'zh-cn' && state.useRomajiMode && (
                <p className="text-center text-warning small mb-0">
                  <i className="bi bi-info-circle me-1"></i>
                  Quiz Mode: Pinyin
                </p>
              )}
              {currentSentence.languageCode === 'zh-cn' && !state.useRomajiMode && (
                <p className="text-center text-info small mb-0">
                  <i className="bi bi-info-circle me-1"></i>
                  Quiz Mode: 汉字 (Characters)
                </p>
              )}
            </div>
          </div>

          {/* Answer Area */}
          <div className="mb-4">
            <label className="form-label fw-semibold mb-2">
              <i className="bi bi-pencil-square me-2 text-primary"></i>
              Your Answer:
            </label>
            <div className="min-h-100 p-4 bg-white border border-dashed border-secondary rounded-3 d-flex flex-wrap align-items-center justify-content-center gap-2">
              {state.selectedWords.length > 0 ? (
                state.selectedWords.map((word, index) => (
                  <button
                    key={word.id}
                    onClick={() => dispatch({ type: QuizActionType.DESELECT_WORD, payload: word })}
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

          {/* Word Bank */}
          <div className="mb-4">
            <label className="form-label fw-semibold mb-2">
              <i className="bi bi-collection me-2 text-primary"></i>
              Word Bank:
            </label>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              {shuffledDisplayWords.map((wordItem) => (
                <button
                  key={wordItem.id}
                  disabled={state.selectedWords.some(w => w.id === wordItem.id)}
                  onClick={() => handleWordClick(wordItem)}
                  className="btn btn-lg px-3 py-2 btn-primary"
                  style={{ minWidth: '80px' }}
                >
                  {wordItem.word}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex justify-content-center gap-3">
            <Button 
              onClick={() => dispatch({ type: QuizActionType.CLEAR_ANSWER })} 
              disabled={state.selectedWords.length === 0} 
              variant="secondary" 
              size="lg"
              className="px-4"
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Clear
            </Button>
            <Button 
              onClick={initializeQuiz} 
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
    </QuizModalWrapper>
  );
}

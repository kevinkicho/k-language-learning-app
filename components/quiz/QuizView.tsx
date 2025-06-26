'use client';

import { Sentence } from '@/lib/types';
import { WordItem } from './useMultiQuiz';
import { cleanTextForDisplay, chunkTextWithPhonetics } from '@/lib/utils';
import { useState } from 'react';
import {
  QuizHeader,
  QuizControls,
  QuizHint,
  AnswerArea,
  WordBank,
  QuizResultDisplay
} from './shared';

interface QuizViewProps {
  currentSentence: Sentence;
  shuffledWords: WordItem[];
  selectedWords: WordItem[];
  isCorrect: boolean | null;
  totalSentences: number;
  currentSentenceIndex: number;
  onSelectWord: (word: WordItem) => void;
  onDeselectWord: (word: WordItem) => void;
  playingWord?: string | null;
  useRomajiMode?: boolean;
}

const QuizView: React.FC<QuizViewProps> = ({
  currentSentence,
  shuffledWords,
  selectedWords,
  isCorrect,
  totalSentences,
  currentSentenceIndex,
  onSelectWord,
  onDeselectWord,
  playingWord,
  useRomajiMode = false,
}) => {
  const languageCode = currentSentence.languageCode || 'es-es';
  const [showHint, setShowHint] = useState(false);
  
  // Get the correct answer for hint display
  const getCorrectAnswer = () => {
    const spanishSentence = currentSentence.spanishTranslation || currentSentence.englishSentence;
    const { nativeChunks, phoneticChunks } = chunkTextWithPhonetics(spanishSentence, languageCode);
    
    // Use phonetic chunks if in pinyin/romaji mode and they exist, otherwise use native chunks
    const chunksToUse = (languageCode === 'zh-cn' || languageCode === 'ja-jp') && useRomajiMode && phoneticChunks.length > 0 
      ? phoneticChunks 
      : nativeChunks;
    
    return chunksToUse.join(' ');
  };
  
  return (
    <div>
      <QuizHeader
        currentSentence={currentSentence}
        currentIndex={currentSentenceIndex}
        totalSentences={totalSentences}
        useRomajiMode={useRomajiMode}
      />

      <QuizControls
        currentSentence={currentSentence}
        isCorrect={isCorrect}
        showHint={showHint}
        onToggleHint={() => setShowHint(!showHint)}
      />

      <QuizHint
        showHint={showHint}
        isCorrect={isCorrect}
        answer={getCorrectAnswer()}
      />

      <AnswerArea
        selectedWords={selectedWords}
        onDeselectWord={onDeselectWord}
      />

      <WordBank
        shuffledWords={shuffledWords}
        selectedWords={selectedWords}
        isCorrect={isCorrect}
        onSelectWord={onSelectWord}
      />

      {isCorrect !== null && (
        <QuizResultDisplay
          isCorrect={isCorrect}
          score={0} // TODO: Pass actual score from parent component
        />
      )}

      {/* Show English reference during quiz */}
      {isCorrect === null && (
        <div className="mt-4">
          <h3>English Reference:</h3>
          <p>{currentSentence.englishSentence}</p>
          <p>Reconstruct the {languageCode === 'ja-jp' ? 'Japanese' : languageCode === 'zh-cn' ? 'Chinese' : 'Spanish'} translation by clicking words in the correct order</p>
        </div>
      )}
    </div>
  );
};

export default QuizView; 
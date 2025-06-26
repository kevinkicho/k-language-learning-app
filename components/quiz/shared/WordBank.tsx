'use client';

import { WordItem } from '../useMultiQuiz';

interface WordBankProps {
  shuffledWords: WordItem[];
  selectedWords: WordItem[];
  isCorrect: boolean | null;
  onSelectWord: (word: WordItem) => void;
  className?: string;
}

export default function WordBank({
  shuffledWords,
  selectedWords,
  isCorrect,
  onSelectWord,
  className = ''
}: WordBankProps) {
  return (
    <div className={`d-flex flex-wrap gap-2 mb-4 bg-dark p-3 rounded ${className}`}>
      {shuffledWords.map((word) => (
        <button
          key={word.id}
          onClick={() => onSelectWord(word)}
          disabled={selectedWords.some(w => w.id === word.id) || isCorrect !== null}
          className={`btn btn-primary`}
        >
          {word.word}
        </button>
      ))}
    </div>
  );
} 
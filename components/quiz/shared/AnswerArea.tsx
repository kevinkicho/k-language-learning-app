'use client';

import { WordItem } from '../useMultiQuiz';

interface AnswerAreaProps {
  selectedWords: WordItem[];
  onDeselectWord: (word: WordItem) => void;
  className?: string;
}

export default function AnswerArea({
  selectedWords,
  onDeselectWord,
  className = ''
}: AnswerAreaProps) {
  return (
    <div className={`p-3 mb-4 bg-dark rounded min-vh-25 d-flex flex-wrap gap-2 align-items-center ${className}`}>
      {selectedWords.length > 0 ? (
        selectedWords.map((word) => (
          <button
            key={`selected-${word.id}`}
            onClick={() => onDeselectWord(word)}
            className="btn btn-primary"
          >
            {word.word}
          </button>
        ))
      ) : (
        <span className="text-light">Your answer...</span>
      )}
    </div>
  );
} 
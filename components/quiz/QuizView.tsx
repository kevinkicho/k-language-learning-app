'use client';

import { Sentence } from '@/lib/types';
import { WordItem } from './useMultiQuiz';
import AudioPlayer from '../AudioPlayer';
import { cleanTextForDisplay } from '@/lib/utils';

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
  const displayText = cleanTextForDisplay(currentSentence.spanishTranslation || '', languageCode, useRomajiMode);
  
  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-2">Quiz {currentSentenceIndex + 1} of {totalSentences}</h3>
      
      {languageCode === 'ja-jp' && (
        <div className="p-2 mb-3 bg-gray-700 rounded-md">
          <p className="text-sm font-semibold text-cyan-400">
            Quiz Mode: {useRomajiMode ? 'Romaji' : 'Native Script'}
          </p>
        </div>
      )}

      <p className="mb-4 text-gray-300">
        Translate this sentence: "{currentSentence.englishSentence}"
      </p>

      {/* Answer Area */}
      <div className="p-3 mb-4 bg-gray-700 rounded-md min-h-[4rem] flex flex-wrap gap-2 items-center">
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
          <span className="text-gray-400">Your answer...</span>
        )}
      </div>

      {/* Word Bank */}
      <div className="flex flex-wrap gap-2 mb-4">
        {shuffledWords.map((word) => (
          <button
            key={word.id}
            onClick={() => onSelectWord(word)}
            disabled={word.isSelected || isCorrect !== null}
            className={`btn ${word.isSelected ? 'btn-primary' : 'btn-outline-light'}`}
          >
            {word.word}
          </button>
        ))}
      </div>

      {isCorrect !== null && (
        <div className={`mt-4 p-3 rounded-md text-center ${isCorrect ? 'bg-green-600' : 'bg-red-600'}`}>
          <p>{isCorrect ? 'Correct!' : 'Incorrect.'}</p>
        </div>
      )}

      {/* Show English reference during quiz */}
      {isCorrect === null && (
        <div>
          <h3>English Reference:</h3>
          <p>{currentSentence.englishSentence}</p>
          <p>Reconstruct the {languageCode === 'ja-jp' ? 'Japanese' : 'Spanish'} translation by clicking words in the correct order</p>
        </div>
      )}
    </div>
  );
};

export default QuizView; 
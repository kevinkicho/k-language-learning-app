'use client';

import { Sentence } from '@/lib/types';
import { WordItem } from './useMultiQuiz';
import AudioPlayer from '../AudioPlayer';

interface QuizViewProps {
  currentSentence: Sentence;
  shuffledWords: WordItem[];
  selectedWords: WordItem[];
  isCorrect: boolean | null;
  progressPercentage: number;
  totalSentences: number;
  currentSentenceIndex: number;
  onWordClick: (word: WordItem) => void;
  onSelectedWordClick: (word: WordItem) => void;
  onClearAnswer: () => void;
  playingWord?: string | null;
}

const QuizView: React.FC<QuizViewProps> = ({
  currentSentence,
  shuffledWords,
  selectedWords,
  isCorrect,
  progressPercentage,
  totalSentences,
  currentSentenceIndex,
  onWordClick,
  onSelectedWordClick,
  playingWord,
}) => {
    const spanishSentence = currentSentence.spanishTranslation || currentSentence.englishSentence;

  return (
    <div>
        <div className="mb-3">
            <p className="lead">{currentSentence.englishSentence}</p>
            <div className="progress">
                <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: `${progressPercentage}%` }}
                    aria-valuenow={progressPercentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                >
                    {currentSentenceIndex + 1} / {totalSentences}
                </div>
            </div>
        </div>

      <div className={`alert ${isCorrect === true ? 'alert-success' : isCorrect === false ? 'alert-danger' : 'alert-secondary'} p-3 d-flex flex-wrap gap-2 justify-content-center align-items-center mb-3`}>
        {selectedWords.length > 0 ? selectedWords.map((word) => (
          <button
            key={word.id}
            onClick={() => onSelectedWordClick(word)}
            className="btn btn-light"
          >
            {word.word}
          </button>
        )) : <span className="text-muted">Click words below to build your answer.</span>}
      </div>

      <div className="d-flex flex-wrap gap-2 justify-content-center">
        {shuffledWords.map((word) => (
          <button
            key={word.id}
            className={`btn ${word.isSelected ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={async () => {
              try {
                await onWordClick(word);
              } catch (error) {
                console.error("Error during word click handling:", error);
                // Optionally surface this error to the user
              }
            }}
            disabled={selectedWords.some(sw => sw.id === word.id)}
          >
            {word.word}
          </button>
        ))}
      </div>

      {/* Show original sentence only after answer is checked */}
      {isCorrect !== null && (
        <div>
          <h3>Original Spanish Sentence:</h3>
          <p>{spanishSentence}</p>
          <p>English: {currentSentence.englishSentence}</p>
          {currentSentence.audioPath && (
            <div>
              <AudioPlayer
                audioPath={currentSentence.audioPath}
              />
            </div>
          )}
        </div>
      )}

      {/* Show English reference during quiz */}
      {isCorrect === null && (
        <div>
          <h3>English Reference:</h3>
          <p>{currentSentence.englishSentence}</p>
          <p>Reconstruct the Spanish translation by clicking words in the correct order</p>
        </div>
      )}
    </div>
  );
};

export default QuizView; 
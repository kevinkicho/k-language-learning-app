'use client';

import { Sentence } from '@/lib/types';
import AudioPlayer from '../../AudioPlayer';

interface QuizControlsProps {
  currentSentence: Sentence;
  isCorrect: boolean | null;
  showHint: boolean;
  onToggleHint: () => void;
  className?: string;
}

export default function QuizControls({
  currentSentence,
  isCorrect,
  showHint,
  onToggleHint,
  className = ''
}: QuizControlsProps) {
  return (
    <div className={`d-flex flex-column flex-sm-row justify-content-center align-items-center gap-3 mb-4 p-3 bg-dark rounded ${className}`}>
      {currentSentence.audioPath && (
        <div className="d-flex align-items-center gap-2">
          <span className="small text-light fw-medium">Listen:</span>
          <AudioPlayer audioPath={currentSentence.audioPath} />
        </div>
      )}
      
      {isCorrect === null && (
        <button
          onClick={onToggleHint}
          className="btn btn-warning btn-sm px-4 py-2"
          title="Show/Hide Answer"
        >
          <i className="bi bi-lightbulb me-2"></i>
          {showHint ? 'Hide Hint' : 'Show Hint'}
        </button>
      )}
    </div>
  );
} 
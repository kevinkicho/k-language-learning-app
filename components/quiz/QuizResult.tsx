'use client';

import Button from '../ui/Button';

interface QuizResultProps {
  isCorrect: boolean;
  score: number;
  spanishSentence: string;
  isLastSentence: boolean;
  onResetQuiz: () => void;
  onNextQuiz: () => void;
}

const QuizResult: React.FC<QuizResultProps> = ({
  isCorrect,
  score,
  spanishSentence,
  isLastSentence,
  onResetQuiz,
  onNextQuiz,
}) => {
  const resultMessage = isCorrect
    ? `Correct! Score: ${score}%`
    : `Not quite right. Score: ${score}%`;
    
  const alertClass = isCorrect ? 'alert-success' : 'alert-warning';

  return (
    <div className={`alert ${alertClass} mt-3`}>
      <h4 className="alert-heading">{resultMessage}</h4>
      <p>The correct sentence is: <strong>{spanishSentence}</strong></p>
      <hr />
      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onResetQuiz}>
          Try Again
        </Button>
        <Button variant="primary" onClick={onNextQuiz}>
          {isLastSentence ? 'Finish' : 'Next'}
        </Button>
      </div>
    </div>
  );
};

export default QuizResult; 
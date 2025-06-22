'use client';

import Button from '../ui/Button';
import { QuizState, QuizAttempt } from '@/components/quiz/useMultiQuiz';

interface FinalReviewProps {
  quizState: QuizState;
  onClose: () => void;
  countdown: number;
}

const FinalReview: React.FC<FinalReviewProps> = ({
  quizState,
  onClose,
  countdown,
}) => {
  const { quizAttempts } = quizState;
  const averageScore = Math.round(
    quizAttempts.reduce((acc: number, attempt: QuizAttempt) => acc + attempt.score, 0) /
      quizAttempts.length || 0
  );

  return (
    <div className="text-center">
      <h2>Quiz Complete!</h2>
      <p className="lead">
        Your average score: <strong>{averageScore}%</strong>
      </p>

      <div className="list-group my-3">
        {quizAttempts.map((attempt: QuizAttempt, index: number) => (
          <div key={index} className="list-group-item">
            <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">Sentence {index + 1}</h5>
                <small>{attempt.score}%</small>
            </div>
            <p className="mb-1">"{attempt.sentence.englishSentence}"</p>
          </div>
        ))}
      </div>
      
      <Button variant="success" onClick={onClose} size="lg">
        Close ({countdown})
      </Button>
    </div>
  );
};

export default FinalReview; 
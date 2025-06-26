'use client';

interface QuizResultDisplayProps {
  isCorrect: boolean;
  score: number;
  className?: string;
}

export default function QuizResultDisplay({
  isCorrect,
  score,
  className = ''
}: QuizResultDisplayProps) {
  return (
    <div className={`mt-4 p-3 rounded text-center bg-dark text-white ${className}`}>
      <p className={isCorrect ? 'text-success mb-0' : 'text-danger mb-0'}>{isCorrect ? 'Correct!' : 'Incorrect.'}</p>
      {score !== undefined && (
        <p className="mt-2 small mb-0">Score: {score}%</p>
      )}
    </div>
  );
} 
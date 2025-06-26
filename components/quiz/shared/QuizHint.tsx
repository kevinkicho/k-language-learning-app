'use client';

interface QuizHintProps {
  showHint: boolean;
  isCorrect: boolean | null;
  answer: string;
  className?: string;
}

export default function QuizHint({
  showHint,
  isCorrect,
  answer,
  className = ''
}: QuizHintProps) {
  if (!showHint || isCorrect !== null) {
    return null;
  }

  return (
    <div className={`mb-4 p-3 bg-dark border border-warning rounded ${className}`}>
      <p className="small text-warning mb-1">
        <i className="bi bi-lightbulb me-1"></i>
        <strong>Answer:</strong>
      </p>
      <p className="h5 font-monospace text-light mb-0">{answer}</p>
    </div>
  );
} 
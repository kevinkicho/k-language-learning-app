import { useState, useCallback } from 'react';
import { QuizGenerationRequest, QuizGenerationResponse } from '@/lib/types';

export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGeneratedQuiz, setLastGeneratedQuiz] = useState<QuizGenerationResponse['quiz'] | null>(null);

  const generateQuiz = useCallback(async (request: QuizGenerationRequest): Promise<QuizGenerationResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result: QuizGenerationResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate quiz');
      }

      if (result.success && result.quiz) {
        setLastGeneratedQuiz(result.quiz);
        return result;
      } else {
        throw new Error(result.error || 'Failed to generate quiz');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearLastQuiz = useCallback(() => {
    setLastGeneratedQuiz(null);
  }, []);

  return {
    isLoading,
    error,
    lastGeneratedQuiz,
    generateQuiz,
    clearError,
    clearLastQuiz,
  };
}; 
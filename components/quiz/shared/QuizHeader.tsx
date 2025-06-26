'use client';

import { Sentence } from '@/lib/types';

interface QuizHeaderProps {
  currentSentence: Sentence;
  currentIndex: number;
  totalSentences: number;
  useRomajiMode?: boolean;
  className?: string;
}

export default function QuizHeader({
  currentSentence,
  currentIndex,
  totalSentences,
  useRomajiMode = false,
  className = ''
}: QuizHeaderProps) {
  const languageCode = currentSentence.languageCode || 'es-es';
  
  return (
    <div className={`p-4 bg-dark text-white rounded shadow ${className}`}>
      <h3 className="h4 fw-bold mb-2">
        Quiz {currentIndex + 1} of {totalSentences}
      </h3>
      
      {(languageCode === 'ja-jp' || languageCode === 'zh-cn') && (
        <div className="p-2 mb-3 bg-secondary rounded">
          <p className="small fw-semibold text-info mb-0">
            Quiz Mode: {useRomajiMode ? (languageCode === 'zh-cn' ? 'Pinyin' : 'Romaji') : 'Native Script'}
          </p>
        </div>
      )}

      <p className="mb-4 text-light">
        Translate this sentence: "{currentSentence.englishSentence}"
      </p>
    </div>
  );
} 
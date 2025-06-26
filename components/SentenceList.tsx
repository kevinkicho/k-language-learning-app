'use client';

import { Sentence } from '@/lib/types';
import { useState } from 'react';

interface SentenceListProps {
  sentences: Sentence[];
  selectedIds: string[];
  onToggleSelection: (sentence: Sentence) => void;
}

// Helper function to get language display name
const getLanguageDisplayName = (languageCode: string): string => {
  switch (languageCode) {
    case 'es-es':
      return '🇪🇸';
    case 'es':
      return '🇲🇽';
    case 'en':
      return '🇺🇸';
    case 'fr-fr':
      return '🇫🇷';
    case 'fr':
      return '🇨🇦';
    case 'de-de':
      return '🇩🇪';
    case 'de':
      return '🇦🇹';
    case 'it-it':
      return '🇮🇹';
    case 'pt-pt':
      return '🇵🇹';
    case 'pt':
      return '🇧🇷';
    case 'ja-jp':
      return '🇯🇵';
    case 'zh-cn':
      return '🇨🇳';
    default:
      return '🌐';
  }
};

export default function SentenceList({ sentences, selectedIds, onToggleSelection }: SentenceListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (sentences.length === 0) {
    return (
      <div className="card border-0 bg-light">
        <div className="card-body text-center py-5">
          <i className="bi bi-inbox display-4 text-muted mb-3"></i>
          <h5 className="text-muted mb-2">No sentences yet</h5>
          <p className="text-muted mb-0">Add one to get started!</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="list-group list-group-flush">
      {sentences.map(sentence => {
        const isSelected = selectedIds.includes(sentence.id);
        const isHovered = hoveredId === sentence.id;
        
        return (
          <div 
            key={sentence.id} 
            className={`list-group-item border-bottom py-3 px-3 cursor-pointer transition-all ${
              isSelected 
                ? 'bg-primary bg-opacity-10 border-primary' 
                : isHovered 
                  ? 'bg-light' 
                  : ''
            }`}
            onClick={() => onToggleSelection(sentence)}
            onMouseEnter={() => setHoveredId(sentence.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{ cursor: 'pointer' }}
          >
            <div className="d-flex align-items-start w-100">
              {/* Language flag - compact */}
              <div className="d-flex align-items-center me-3 flex-shrink-0">
                <span className="fs-5" title={sentence.languageCode}>
                  {getLanguageDisplayName(sentence.languageCode || 'es-es')}
                </span>
              </div>
              
              {/* Main content - taking up most space */}
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <p className="fw-bold mb-1 text-dark">
                  {sentence.spanishTranslation}
                </p>
                <p className="text-muted small mb-0">
                  {sentence.englishSentence}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 
'use client';

import { Sentence } from '@/lib/types';
import AudioPlayer from './AudioPlayer';
import Button from './ui/Button';

interface SentenceListProps {
  sentences: Sentence[];
  selectedIds: string[];
  onDelete: (id: string) => void;
  onStartQuiz: (sentence: Sentence) => void;
  onToggleSelection: (sentence: Sentence) => void;
  isPending: boolean;
}

// Helper function to get language display name
const getLanguageDisplayName = (languageCode: string): string => {
  switch (languageCode) {
    case 'es-es':
      return '🇪🇸 ES';
    case 'es':
      return '🇲🇽 ES-LA';
    case 'en':
      return '🇺🇸 EN';
    case 'fr-fr':
      return '🇫🇷 FR';
    case 'fr':
      return '🇨🇦 FR-CA';
    case 'de-de':
      return '🇩🇪 DE';
    case 'de':
      return '🇦🇹 DE-AT';
    case 'it-it':
      return '🇮🇹 IT';
    case 'pt-pt':
      return '🇵🇹 PT';
    case 'pt':
      return '🇧🇷 PT-BR';
    default:
      return '🌐 ' + languageCode.toUpperCase();
  }
};

export default function SentenceList({ sentences, selectedIds, onDelete, onStartQuiz, onToggleSelection, isPending }: SentenceListProps) {
  if (sentences.length === 0) {
    return (
        <div className="card">
            <div className="card-body text-center">
                <p className="card-text">No sentences yet. Add one to get started!</p>
            </div>
        </div>
    )
  }
  
  return (
    <div className="list-group">
      {sentences.map(sentence => (
        <div key={sentence.id} className="list-group-item d-flex justify-content-between align-items-center">
          <div className="form-check">
            <input
                className="form-check-input"
                type="checkbox"
                checked={selectedIds.includes(sentence.id)}
                onChange={() => onToggleSelection(sentence)}
                disabled={isPending}
                id={`sentence-${sentence.id}`}
            />
            <label className="form-check-label" htmlFor={`sentence-${sentence.id}`}>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-secondary fs-6">
                  {getLanguageDisplayName(sentence.languageCode || 'es-es')}
                </span>
              </div>
              <strong>{sentence.spanishTranslation}</strong>
              <br />
              <small className="text-muted">{sentence.englishSentence}</small>
            </label>
          </div>
          <div className="d-flex gap-2">
            {sentence.audioPath && <AudioPlayer audioPath={sentence.audioPath} />}
            <Button variant="secondary" size="sm" onClick={() => onStartQuiz(sentence)}>Quiz</Button>
            <Button variant="danger" size="sm" onClick={() => onDelete(sentence.id)} disabled={isPending}>
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
} 
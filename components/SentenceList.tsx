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
              <strong>{sentence.spanishTranslation}</strong>
              <br />
              <small>{sentence.englishSentence}</small>
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
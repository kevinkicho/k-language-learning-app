'use client';

import { useState, useTransition, useEffect } from 'react';
import { Sentence } from '@/lib/types';
import { CachedAPI } from '@/lib/cache-utils';
import SentenceInput from '@/components/SentenceInput';
import SentenceList from '@/components/SentenceList';
import QuizModal from '@/components/QuizModal';
import MultiQuizModal from '@/components/MultiQuizModal';

export default function HomePage() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [selectedSentences, setSelectedSentences] = useState<Sentence[]>([]);
  const [quizSentence, setQuizSentence] = useState<Sentence | null>(null);
  const [isMultiQuizVisible, setMultiQuizVisible] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startTransition(async () => {
        const initialSentences = await CachedAPI.getSentences();
        setSentences(initialSentences);
    });
  }, []);

  const handleAddSentence = async (englishSentence: string) => {
    startTransition(async () => {
      const newSentence = await CachedAPI.addSentence(englishSentence);
      if (newSentence) {
        setSentences(prev => [newSentence, ...prev]);
        setError(null);
      } else {
        setError('Failed to add the sentence. Please try again.');
      }
    });
  };

  const handleDeleteSentence = async (id: string) => {
    startTransition(async () => {
      await CachedAPI.deleteSentence(id);
      setSentences(prev => prev.filter(s => s.id !== id));
    });
  };

  const handleStartQuiz = (sentence: Sentence) => {
    setQuizSentence(sentence);
  };

  const handleToggleSelection = (sentence: Sentence) => {
    setSelectedSentences(prev =>
      prev.some(s => s.id === sentence.id)
        ? prev.filter(s => s.id !== sentence.id)
        : [...prev, sentence]
    );
  };
  
  const handleSelectAll = () => {
    setSelectedSentences(sentences);
  };

  const handleDeselectAll = () => {
    setSelectedSentences([]);
  };

  return (
    <div className="container py-4">
      <header className="text-center mb-4">
        <h1>LingoQuiz</h1>
      </header>
      
      <div className="row">
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-body">
              <h2 className="card-title">Add a Sentence</h2>
              <SentenceInput onAddSentence={handleAddSentence} isPending={isPending} />
              {error && <p className="text-danger mt-2">{error}</p>}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
                <h2 className="card-title">Quick Actions</h2>
                <div className="d-grid gap-2">
                    <button className="btn btn-info" onClick={() => {
                        setSelectedSentences(sentences);
                        setMultiQuizVisible(true);
                    }}>
                        Start Random Quiz ({sentences.length})
                    </button>
                    <button className="btn btn-secondary" onClick={handleSelectAll}>Select All ({sentences.length})</button>
                    <button className="btn btn-light" onClick={handleDeselectAll}>Deselect All ({selectedSentences.length})</button>
                </div>
            </div>
          </div>
        </div>

        <div className="col-md-8">
            <section>
                <h2>Sentences</h2>
                <p>Select sentences below to begin a quiz.</p>
                {selectedSentences.length > 0 &&
                    <button className="btn btn-primary mb-3" onClick={() => setMultiQuizVisible(true)} disabled={selectedSentences.length === 0}>
                        Start Selected Quiz ({selectedSentences.length})
                    </button>
                }
                <SentenceList
                    sentences={sentences}
                    selectedIds={selectedSentences.map(s => s.id)}
                    onDelete={handleDeleteSentence}
                    onStartQuiz={handleStartQuiz}
                    onToggleSelection={handleToggleSelection}
                    isPending={isPending}
                />
            </section>
        </div>
      </div>

      {quizSentence && (
        <QuizModal
          sentence={quizSentence}
          onClose={() => setQuizSentence(null)}
        />
      )}

      {isMultiQuizVisible && (
        <MultiQuizModal
          sentences={selectedSentences.length > 0 ? selectedSentences : sentences}
          isRandom={selectedSentences.length === 0}
          onClose={() => {
            setMultiQuizVisible(false);
            setSelectedSentences([]);
          }}
        />
      )}
    </div>
  );
} 
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Sentence, QuizGenerationResponse } from '@/lib/types';
import { CachedAPI } from '@/lib/cache-utils';
import SentenceInput from '@/components/SentenceInput';
import SentenceList from '@/components/SentenceList';
import QuizModal from '@/components/QuizModal';
import MultiQuizModal from '@/components/MultiQuizModal';
import { AICommandInterface } from '@/components/AICommandInterface';

export default function HomePage() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [selectedSentences, setSelectedSentences] = useState<Sentence[]>([]);
  const [quizSentence, setQuizSentence] = useState<Sentence | null>(null);
  const [isMultiQuizVisible, setMultiQuizVisible] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    startTransition(async () => {
        const initialSentences = await CachedAPI.getSentences();
        setSentences(initialSentences);
    });
  }, []);

  const handleAddSentence = async (englishSentence: string) => {
    startTransition(async () => {
      try {
        const newSentence = await CachedAPI.addSentence(englishSentence);
        if (newSentence) {
          // Check if this sentence was already in the list (duplicate)
          const isDuplicate = sentences.some(s => s.id === newSentence.id);
          if (isDuplicate) {
            setError('This sentence already exists in your list.');
          } else {
            setSentences(prev => [newSentence, ...prev]);
            setError(null);
          }
        } else {
          setError('Failed to add the sentence. Please try again.');
        }
      } catch (error) {
        console.error('Error adding sentence:', error);
        setError('Failed to add the sentence. Please try again.');
      }
    });
  };

  const handleDeleteSentence = async (id: string) => {
    startTransition(async () => {
      try {
        await CachedAPI.deleteSentence(id);
        setSentences(prev => prev.filter(s => s.id !== id));
        setError(null);
      } catch (error) {
        console.error('Failed to delete sentence:', error);
        setError('Failed to delete the sentence. Please try again.');
      }
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

  const handleAIQuizGenerated = async (quiz: QuizGenerationResponse['quiz']) => {
    if (quiz) {
      // For each AI-generated sentence, POST to /api/sentences to trigger TTS/audio
      const newSentences: Sentence[] = [];
      const existingSentenceIds = new Set(sentences.map(s => s.id));
      
      for (const s of quiz.sentences) {
        try {
          const added = await CachedAPI.addSentence(s.english);
          if (added && !existingSentenceIds.has(added.id)) {
            // Only add if it's truly new (not already in our current list)
            newSentences.push(added);
          }
        } catch (err) {
          console.error('Failed to add AI-generated sentence:', err);
        }
      }
      
      if (newSentences.length > 0) {
        setSentences(prev => [...newSentences, ...prev]);
        setSelectedSentences(newSentences);
        setMultiQuizVisible(true);
        setAiError(null);
      } else {
        // All sentences already existed
        setAiError('All generated sentences already exist in your list.');
      }
    }
  };

  const handleAIError = (error: string) => {
    setAiError(error);
  };

  return (
    <div className="container py-4">
      <header className="text-center mb-4">
        <h1>LingoQuiz</h1>
        <p className="text-muted">AI-Powered Language Learning</p>
      </header>
      
      {/* AI Command Interface */}
      <AICommandInterface 
        onQuizGenerated={handleAIQuizGenerated}
        onError={handleAIError}
      />

      {aiError && (
        <div className="alert alert-danger mb-4" role="alert">
          <strong>AI Error:</strong> {aiError}
          <button 
            type="button" 
            className="btn-close float-end" 
            onClick={() => setAiError(null)}
            aria-label="Close"
          ></button>
        </div>
      )}
      
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
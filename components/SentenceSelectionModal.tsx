'use client';

import { useState, useEffect } from 'react';
import { Sentence } from '@/lib/types';
import Button from './ui/Button';

interface SentenceSelectionModalProps {
  sentences: Sentence[];
  onStartQuiz: (selectedSentences: Sentence[], isRandom: boolean) => void;
  onClose: () => void;
}

export default function SentenceSelectionModal({ sentences, onStartQuiz, onClose }: SentenceSelectionModalProps) {
  const [selectedSentences, setSelectedSentences] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'english' | 'spanish'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedSentences = sentences
    .filter(sentence => {
      const searchLower = searchTerm.toLowerCase();
      return (
        sentence.englishSentence.toLowerCase().includes(searchLower) ||
        (sentence.spanishTranslation && sentence.spanishTranslation.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'english':
          comparison = a.englishSentence.localeCompare(b.englishSentence);
          break;
        case 'spanish':
          comparison = (a.spanishTranslation || '').localeCompare(b.spanishTranslation || '');
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSentenceToggle = (sentenceId: string) => {
    setSelectedSentences(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sentenceId)) {
        newSet.delete(sentenceId);
      } else {
        newSet.add(sentenceId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedSentences(new Set(filteredAndSortedSentences.map(s => s.id)));
  };

  const handleDeselectAll = () => {
    setSelectedSentences(new Set());
  };

  const handleStartRandomQuiz = () => {
    if (sentences.length === 0) return;
    
    // Select random sentences (up to 10, or all if less than 10)
    const maxSentences = Math.min(10, sentences.length);
    const shuffled = [...sentences].sort(() => Math.random() - 0.5);
    const randomSentences = shuffled.slice(0, maxSentences);
    
    onStartQuiz(randomSentences, true);
  };

  const handleStartSelectedQuiz = () => {
    if (selectedSentences.size === 0) return;
    
    const selectedSentenceObjects = sentences.filter(s => selectedSentences.has(s.id));
    onStartQuiz(selectedSentenceObjects, false);
  };

  const selectedCount = selectedSentences.size;
  const filteredCount = filteredAndSortedSentences.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create Multi-Sentence Quiz</h2>
              <p className="text-sm text-gray-600">
                Choose sentences for your quiz or start a random quiz
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="secondary"
              size="md"
              title="Close"
              className="text-2xl px-3 py-1"
            >
              ×
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleStartRandomQuiz}
                disabled={sentences.length === 0}
                variant="primary"
                size="md"
              >
                🎲 Random Quiz ({Math.min(10, sentences.length)} sentences)
              </Button>
              <Button
                onClick={handleSelectAll}
                disabled={filteredCount === 0}
                variant="secondary"
                size="md"
              >
                Select All ({filteredCount})
              </Button>
              <Button
                onClick={handleDeselectAll}
                disabled={selectedCount === 0}
                variant="secondary"
                size="md"
              >
                Deselect All
              </Button>
            </div>
          </div>

          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search sentences..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'english' | 'spanish')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="date">Date</option>
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Selection Summary */}
          {selectedCount > 0 && (
            <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-primary-700 font-medium">
                  {selectedCount} sentence{selectedCount !== 1 ? 's' : ''} selected
                </span>
                <Button
                  onClick={handleStartSelectedQuiz}
                  variant="primary"
                  size="md"
                >
                  Start Quiz with Selected
                </Button>
              </div>
            </div>
          )}

          {/* Sentences List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredAndSortedSentences.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchTerm ? 'No sentences match your search.' : 'No sentences available.'}
                </p>
              </div>
            ) : (
              filteredAndSortedSentences.map((sentence) => (
                <div
                  key={sentence.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedSentences.has(sentence.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSentenceToggle(sentence.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedSentences.has(sentence.id)}
                      onChange={() => handleSentenceToggle(sentence.id)}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium">
                        {sentence.englishSentence}
                      </p>
                      {sentence.spanishTranslation && (
                        <p className="text-gray-600 text-sm mt-1">
                          {sentence.spanishTranslation}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                        <span>
                          {new Date(sentence.createdAt).toLocaleDateString()}
                        </span>
                        {sentence.audioPath && (
                          <span className="text-primary-500">• Audio available</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-600 mt-4">
            Showing {filteredAndSortedSentences.length} of {sentences.length} sentences
            {selectedCount > 0 && ` • ${selectedCount} selected`}
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <div className="flex gap-3">
              {selectedCount > 0 && (
                <Button
                  onClick={handleStartSelectedQuiz}
                  variant="primary"
                  size="md"
                >
                  Start Quiz ({selectedCount} sentences)
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
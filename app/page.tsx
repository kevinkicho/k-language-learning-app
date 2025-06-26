'use client';

import { useState, useTransition, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Sentence, QuizGenerationResponse, Language } from '@/lib/types';
import { CachedAPI } from '@/lib/cache-utils';
import SentenceInput from '@/components/SentenceInput';
import SentenceList from '@/components/SentenceList';
import { AICommandInterface } from '@/components/AICommandInterface';
import TabNavigation, { TabConfig } from '@/components/ui/TabNavigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import QuizModal from '@/components/QuizModal';
import Button from '@/components/ui/Button';
import AudioPlayer from '@/components/AudioPlayer';

const MultiQuizModal = dynamic(() => import('@/components/MultiQuizModal'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

export default function HomePage() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [selectedSentences, setSelectedSentences] = useState<Sentence[]>([]);
  const [quizSentence, setQuizSentence] = useState<Sentence | null>(null);
  const [isMultiQuizVisible, setMultiQuizVisible] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'groups'>('all');
  const [currentQuizGroup, setCurrentQuizGroup] = useState<string | null>(null);
  const [languageFilter, setLanguageFilter] = useState<Language | 'all'>('all');

  // Language options for filter
  const languageOptions = [
    { value: 'all' as const, label: '🌐 All' },
    { value: 'es-es' as const, label: '🇪🇸 Spanish' },
    { value: 'es' as const, label: '🇲🇽 Spanish-LA' },
    { value: 'en' as const, label: '🇺🇸 English' },
    { value: 'fr-fr' as const, label: '🇫🇷 French' },
    { value: 'fr' as const, label: '🇨🇦 French-CA' },
    { value: 'de-de' as const, label: '🇩🇪 German' },
    { value: 'de' as const, label: '🇦🇹 German-AT' },
    { value: 'it-it' as const, label: '🇮🇹 Italian' },
    { value: 'pt-pt' as const, label: '🇵🇹 Portuguese' },
    { value: 'pt' as const, label: '🇧🇷 Portuguese-BR' },
    { value: 'ja-jp' as const, label: '🇯🇵 Japanese' },
    { value: 'zh-cn' as const, label: '🇨🇳 Chinese' }
  ];

  // Get unique quiz groups from sentences
  const quizGroups = Array.from(new Set(sentences
    .filter(s => s.quizGroup)
    .map(s => s.quizGroup!)
  )).sort();

  // Group sentences by quiz group
  const groupedSentences = quizGroups.reduce((acc, group) => {
    acc[group] = sentences.filter(s => s.quizGroup === group);
    return acc;
  }, {} as Record<string, Sentence[]>);

  // Get filtered quiz groups (only groups with sentences in selected language)
  const getFilteredQuizGroups = () => {
    if (languageFilter === 'all') {
      return quizGroups;
    }
    return quizGroups.filter(group => {
      const groupSentences = groupedSentences[group];
      return groupSentences.some(sentence => sentence.languageCode === languageFilter);
    });
  };

  const filteredQuizGroups = getFilteredQuizGroups();

  // Helper function to get display name for a group (without timestamp)
  const getGroupDisplayName = (groupId: string) => {
    const parts = groupId.split('_');
    if (parts.length > 1) {
      // Remove the timestamp (last part) and join the rest
      return parts.slice(0, -1).join('_');
    }
    return groupId;
  };

  // Filter sentences by language
  const filterSentencesByLanguage = (sentencesToFilter: Sentence[]) => {
    if (languageFilter === 'all') {
      return sentencesToFilter;
    }
    return sentencesToFilter.filter(sentence => sentence.languageCode === languageFilter);
  };

  // Get sentences for current view
  const getCurrentSentences = () => {
    let currentSentences;
    if (activeTab === 'groups' && currentQuizGroup) {
      currentSentences = groupedSentences[currentQuizGroup] || [];
    } else {
      currentSentences = sentences;
    }
    
    // Apply language filter
    currentSentences = filterSentencesByLanguage(currentSentences);
    
    // Sort by language code, then by creation date (newest first)
    return currentSentences.sort((a, b) => {
      // First sort by language code
      const langA = a.languageCode || 'es-es';
      const langB = b.languageCode || 'es-es';
      if (langA !== langB) {
        return langA.localeCompare(langB);
      }
      // Then sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const currentSentences = getCurrentSentences();

  // Get filtered counts for tabs
  const getFilteredCounts = () => {
    const allFiltered = filterSentencesByLanguage(sentences);
    
    return {
      all: allFiltered.length,
      groups: filteredQuizGroups.length
    };
  };

  const filteredCounts = getFilteredCounts();

  // Tab configuration
  const tabs: TabConfig[] = [
    {
      id: 'all',
      label: 'All Sentences',
      count: filteredCounts.all
    },
    {
      id: 'groups',
      label: 'Quiz Groups',
      count: filteredCounts.groups
    }
  ];

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
        
        // Re-fetch sentences from the database to ensure UI is in sync
        const updatedSentences = await CachedAPI.getSentences();
        setSentences(updatedSentences);
        
        // Remove from selected sentences if it was selected
        setSelectedSentences(prev => prev.filter(s => s.id !== id));
        
        // Clear quiz sentence if it was the deleted one
        if (quizSentence?.id === id) {
          setQuizSentence(null);
        }
        
        // Close multi quiz if any of the selected sentences were deleted
        if (selectedSentences.some(s => s.id === id)) {
          setMultiQuizVisible(false);
        }
        
        // Update current quiz group if it becomes empty
        if (activeTab === 'groups' && currentQuizGroup) {
          const groupSentences = updatedSentences.filter(s => s.quizGroup === currentQuizGroup);
          if (groupSentences.length === 0) {
            // Find another group to select, or clear selection
            const availableGroups = Array.from(new Set(updatedSentences.map(s => s.quizGroup).filter(Boolean)));
            if (availableGroups.length > 0) {
              setCurrentQuizGroup(availableGroups[0]);
            } else {
              setCurrentQuizGroup(null);
            }
          }
        }
        
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
    setSelectedSentences(currentSentences);
  };

  const handleDeselectAll = () => {
    setSelectedSentences([]);
  };

  const handleAIQuizGenerated = async (
    quiz: QuizGenerationResponse['quiz'],
    userCommand?: string,
    language?: Language
  ) => {
    if (quiz) {
      // Generate a descriptive group name based on user command and language
      let groupName = 'Generated Quiz';
      
      if (userCommand) {
        // Clean up the user command to create a readable group name
        const cleanCommand = userCommand
          .toLowerCase()
          .replace(/^(i want to learn|teach me|show me|help me learn|i need|what are|how do you say)/, '')
          .replace(/^(spanish|in spanish|for spanish|french|in french|for french|german|in german|for german|italian|in italian|for italian|portuguese|in portuguese|for portuguese)/, '')
          .replace(/^(useful |basic |common |essential )/, '')
          .replace(/[?.,!]/g, '')
          .trim();
        
        if (cleanCommand) {
          // Capitalize first letter and limit length
          groupName = cleanCommand
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
            .substring(0, 40); // Limit to 40 characters for cleaner display
        }
      }
      
      // Add timestamp to ensure uniqueness
      const groupId = `${groupName}_${Date.now()}`;
      
      // For each AI-generated sentence, POST to /api/sentences to trigger TTS/audio
      const newSentences: Sentence[] = [];
      const existingSentenceIds = new Set(sentences.map(s => s.id));
      
      for (const s of quiz.sentences) {
        try {
          // Pass the AI's target language translation directly
          const added = await CachedAPI.addSentence(
            s.english, 
            groupId, 
            language || 'es-es', 
            s.spanish // This is the fix
          );
          if (added && !existingSentenceIds.has(added.id)) {
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
        
        // Switch to groups tab and select the new group
        setActiveTab('groups');
        setCurrentQuizGroup(groupId);
      } else {
        // All sentences already existed
        setAiError('All generated sentences already exist in your list or could not be added.');
      }
    }
  };

  const handleAIError = (error: string) => {
    setAiError(error);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as 'all' | 'groups');
    if (tabId === 'groups' && filteredQuizGroups.length > 0 && !currentQuizGroup) {
      setCurrentQuizGroup(filteredQuizGroups[0]);
    }
  };

  const handleGroupChange = (groupId: string) => {
    setCurrentQuizGroup(groupId);
  };

  const handleLanguageFilterChange = (newFilter: Language | 'all') => {
    setLanguageFilter(newFilter);
    setSelectedSentences([]); // Clear selection when changing language
    // Update quiz group selection when switching languages
    if (activeTab === 'groups') {
      const newFilteredGroups = newFilter === 'all' ? quizGroups : quizGroups.filter(group => {
        const groupSentences = groupedSentences[group];
        return groupSentences.some(sentence => sentence.languageCode === newFilter);
      });
      
      if (newFilteredGroups.length > 0) {
        // Select the first available group in the new filter
        setCurrentQuizGroup(newFilteredGroups[0]);
      } else {
        // No groups available in this language, clear selection
        setCurrentQuizGroup(null);
      }
    }
  };

  // Auto-close quiz modals if sentences are deleted
  useEffect(() => {
    // Close single quiz if the sentence was deleted
    if (quizSentence && !sentences.some(s => s.id === quizSentence.id)) {
      setQuizSentence(null);
    }
    
    // Close multi quiz if any selected sentences were deleted
    if (isMultiQuizVisible && selectedSentences.length > 0) {
      const allSelectedExist = selectedSentences.every(s => sentences.some(existing => existing.id === s.id));
      if (!allSelectedExist) {
        setMultiQuizVisible(false);
        setSelectedSentences([]);
      }
    }
  }, [sentences, quizSentence, isMultiQuizVisible, selectedSentences]);

  return (
    <div className="container-fluid px-3 py-2">
      <header className="text-center mb-4 py-3 bg-white rounded-3 shadow-sm">
        <h1 className="display-5 fw-bold text-primary mb-2">LingoQuiz</h1>
        <p className="text-muted mb-0">AI-Powered Language Learning</p>
      </header>
      
      {/* AI Command Interface */}
      <div className="mb-4">
        <AICommandInterface 
          onQuizGenerated={handleAIQuizGenerated}
          onError={handleAIError}
        />
      </div>

      {aiError && (
        <div className="alert alert-danger mb-4" role="alert">
          <div className="d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <div className="flex-grow-1">
              <strong>AI Error:</strong> {aiError}
            </div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setAiError(null)}
              aria-label="Close"
            ></button>
          </div>
        </div>
      )}
      
      <div className="row g-3">
        {/* Mobile-first sidebar */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 mb-3">
            <div className="card-body p-4">
              <h2 className="card-title h5 fw-bold mb-3">
                <i className="bi bi-plus-circle me-2 text-primary"></i>
                Add a Sentence
              </h2>
              <SentenceInput onAddSentence={handleAddSentence} isPending={isPending} />
              {error && <p className="text-danger mt-2 small">{error}</p>}
            </div>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h2 className="card-title h5 fw-bold mb-3">
                <i className="bi bi-lightning me-2 text-warning"></i>
                Quick Actions
              </h2>
              {languageFilter !== 'all' && (
                <div className="alert alert-info alert-sm mb-3 py-2">
                  <small>
                    <i className="bi bi-funnel me-1"></i>
                    Filtered by: {languageOptions.find(opt => opt.value === languageFilter)?.label}
                  </small>
                </div>
              )}
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-primary btn-lg" 
                  onClick={() => {
                    setSelectedSentences(currentSentences);
                    setMultiQuizVisible(true);
                  }}
                >
                  <i className="bi bi-play-circle me-2"></i>
                  Start Random Quiz ({currentSentences.length})
                </button>
                <div className="row g-2">
                  <div className="col-6">
                    <button className="btn btn-outline-secondary w-100" onClick={handleSelectAll} title="Select All">
                      <i className="bi bi-check-all"></i>
                    </button>
                  </div>
                  <div className="col-6">
                    <button className="btn btn-outline-light w-100" onClick={handleDeselectAll} title="Deselect All">
                      <i className="bi bi-x-circle"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-4">
                <h2 className="h4 fw-bold mb-3 mb-md-0">
                  <i className="bi bi-list-ul me-2 text-primary"></i>
                  Sentences
                </h2>
                
                {/* Language Filter - Mobile optimized */}
                <div className="w-100 w-md-auto">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <label className="form-label mb-0 small fw-semibold">Filter:</label>
                    <select 
                      className="form-select form-select-sm"
                      value={languageFilter}
                      onChange={(e) => handleLanguageFilterChange(e.target.value as Language | 'all')}
                      style={{ minWidth: '200px' }}
                    >
                      {languageOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {languageFilter !== 'all' && (
                      <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => handleLanguageFilterChange('all')}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                  {languageFilter !== 'all' && (
                    <small className="text-muted">
                      Showing {currentSentences.length} of {sentences.length} sentences
                    </small>
                  )}
                </div>
              </div>
              
              {/* Tab Navigation - Mobile optimized */}
              <div className="mb-4">
                <TabNavigation 
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  className="mb-3"
                />
              </div>

              {/* Quiz Group Selector - Mobile optimized */}
              {activeTab === 'groups' && filteredQuizGroups.length > 0 && (
                <div className="mb-4">
                  <label className="form-label small fw-semibold">Select Quiz Group:</label>
                  <select 
                    className="form-select"
                    value={currentQuizGroup || ''}
                    onChange={(e) => handleGroupChange(e.target.value)}
                  >
                    {filteredQuizGroups.map(group => {
                      const groupSentences = groupedSentences[group];
                      const filteredCount = languageFilter === 'all' 
                        ? groupSentences.length 
                        : groupSentences.filter(s => s.languageCode === languageFilter).length;
                      return (
                        <option key={group} value={group}>
                          {getGroupDisplayName(group)} ({filteredCount} sentences)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {activeTab === 'groups' && filteredQuizGroups.length === 0 && (
                <div className="alert alert-info mb-4">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>No quiz groups found</strong> for the selected language. 
                  {languageFilter !== 'all' && (
                    <span> Try selecting "All Languages" or create new content in {languageOptions.find(opt => opt.value === languageFilter)?.label}.</span>
                  )}
                </div>
              )}

              <p className="text-muted mb-3">
                <i className="bi bi-info-circle me-1"></i>
                Select sentences below to begin a quiz.
              </p>
              
              {selectedSentences.length > 0 && (
                <div className="mb-4">
                  <button 
                    className="btn btn-success btn-lg w-100" 
                    onClick={() => setMultiQuizVisible(true)} 
                    disabled={selectedSentences.length === 0}
                  >
                    <i className="bi bi-play-circle me-2"></i>
                    Start Quiz ({selectedSentences.length})
                  </button>
                </div>
              )}
              
              {/* Action buttons for selected sentences */}
              {selectedSentences.length === 1 && (
                <div className="mb-4">
                  <div className="card border-0 bg-light">
                    <div className="card-body py-3 px-2">
                      <h6 className="card-title mb-3 fw-semibold text-center">
                        <i className="bi bi-gear me-2 text-primary"></i>
                        Actions for Selected Sentence
                      </h6>
                      <div className="d-flex justify-content-center align-items-center gap-3">
                        {/* Always show play button - audio can be generated on demand */}
                        <span className="d-inline-flex">
                          <AudioPlayer 
                            audioPath={selectedSentences[0].audioPath || `/api/audio/${selectedSentences[0].id}`} 
                            buttonClassName="btn-icon-circle btn-info" 
                          />
                        </span>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          onClick={() => handleStartQuiz(selectedSentences[0])}
                          className="btn-icon-circle"
                          title="Start Single Quiz"
                        >
                          <i className="bi bi-puzzle"></i>
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => handleDeleteSentence(selectedSentences[0].id)} 
                          disabled={isPending}
                          className="btn-icon-circle"
                          title="Delete Sentence"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {selectedSentences.length > 1 && (
                <div className="mb-4">
                  <div className="card border-0 bg-light">
                    <div className="card-body py-3 px-2">
                      <h6 className="card-title mb-3 fw-semibold text-center">
                        <i className="bi bi-collection me-2 text-primary"></i>
                        Actions for {selectedSentences.length} Selected Sentences
                      </h6>
                      <div className="d-flex justify-content-center align-items-center gap-3">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => setMultiQuizVisible(true)}
                          className="btn-icon-circle"
                          title="Start Multi Quiz"
                        >
                          <i className="bi bi-puzzle-fill"></i>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={async () => {
                            await Promise.all(selectedSentences.map(s => handleDeleteSentence(s.id)));
                            // Re-fetch sentences from the database to ensure UI is in sync
                            const updatedSentences = await CachedAPI.getSentences();
                            setSentences(updatedSentences);
                            setSelectedSentences([]);
                          }}
                          disabled={isPending}
                          className="btn-icon-circle"
                          title="Delete Selected"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <SentenceList
                sentences={currentSentences}
                selectedIds={selectedSentences.map(s => s.id)}
                onToggleSelection={handleToggleSelection}
              />
            </div>
          </div>
        </div>
      </div>

      {quizSentence && sentences.some(s => s.id === quizSentence.id) && (
        <QuizModal
          sentence={quizSentence}
          onClose={() => setQuizSentence(null)}
        />
      )}

      {isMultiQuizVisible && selectedSentences.length > 0 && selectedSentences.every(s => sentences.some(existing => existing.id === s.id)) && (
        <MultiQuizModal
          sentences={selectedSentences}
          isRandom={false}
          onClose={() => setMultiQuizVisible(false)}
        />
      )}

      {isMultiQuizVisible && selectedSentences.length === 0 && currentSentences.length > 0 && (
        <MultiQuizModal
          sentences={currentSentences}
          isRandom={true}
          onClose={() => setMultiQuizVisible(false)}
        />
      )}

      <style jsx global>{`
        .btn-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          padding: 0;
        }
      `}</style>
    </div>
  );
} 
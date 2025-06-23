'use client';

import { useState, useTransition, useEffect } from 'react';
import { Sentence, QuizGenerationResponse, Language } from '@/lib/types';
import { CachedAPI } from '@/lib/cache-utils';
import SentenceInput from '@/components/SentenceInput';
import SentenceList from '@/components/SentenceList';
import QuizModal from '@/components/QuizModal';
import MultiQuizModal from '@/components/MultiQuizModal';
import { AICommandInterface } from '@/components/AICommandInterface';
import TabNavigation, { TabConfig } from '@/components/ui/TabNavigation';

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
    { value: 'all' as const, label: '🌐 All Languages' },
    { value: 'es-es' as const, label: '🇪🇸 Spanish (Spain)' },
    { value: 'es' as const, label: '🇲🇽 Spanish (Latin America)' },
    { value: 'en' as const, label: '🇺🇸 English' },
    { value: 'fr-fr' as const, label: '🇫🇷 French (France)' },
    { value: 'fr' as const, label: '🇨🇦 French (Canada)' },
    { value: 'de-de' as const, label: '🇩🇪 German (Germany)' },
    { value: 'de' as const, label: '🇦🇹 German (Austria)' },
    { value: 'it-it' as const, label: '🇮🇹 Italian (Italy)' },
    { value: 'pt-pt' as const, label: '🇵🇹 Portuguese (Portugal)' },
    { value: 'pt' as const, label: '🇧🇷 Portuguese (Brazil)' }
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
                {languageFilter !== 'all' && (
                  <div className="alert alert-info alert-sm mb-3">
                    <small>Filtered by: {languageOptions.find(opt => opt.value === languageFilter)?.label}</small>
                  </div>
                )}
                <div className="d-grid gap-2">
                    <button className="btn btn-info" onClick={() => {
                        setSelectedSentences(currentSentences);
                        setMultiQuizVisible(true);
                    }}>
                        Start Random Quiz ({currentSentences.length})
                    </button>
                    <button className="btn btn-secondary" onClick={handleSelectAll}>Select All ({currentSentences.length})</button>
                    <button className="btn btn-light" onClick={handleDeselectAll}>Deselect All ({selectedSentences.length})</button>
                </div>
            </div>
          </div>
        </div>

        <div className="col-md-8">
            <section>
                <h2>Sentences</h2>
                
                {/* Language Filter */}
                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <label className="form-label mb-0">Filter by Language:</label>
                    <select 
                      className="form-select"
                      value={languageFilter}
                      onChange={(e) => handleLanguageFilterChange(e.target.value as Language | 'all')}
                      style={{ width: 'auto' }}
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
                        Clear Filter
                      </button>
                    )}
                  </div>
                  {languageFilter !== 'all' && (
                    <small className="text-muted">
                      Showing {currentSentences.length} of {sentences.length} sentences
                    </small>
                  )}
                </div>
                
                {/* Tab Navigation */}
                <TabNavigation 
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  className="mb-3"
                />

                {/* Quiz Group Selector */}
                {activeTab === 'groups' && filteredQuizGroups.length > 0 && (
                  <div className="mb-3">
                    <label className="form-label">Select Quiz Group:</label>
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
                  <div className="alert alert-info mb-3">
                    <strong>No quiz groups found</strong> for the selected language. 
                    {languageFilter !== 'all' && (
                      <span> Try selecting "All Languages" or create new content in {languageOptions.find(opt => opt.value === languageFilter)?.label}.</span>
                    )}
                  </div>
                )}

                <p>Select sentences below to begin a quiz.</p>
                {selectedSentences.length > 0 &&
                    <button className="btn btn-primary mb-3" onClick={() => setMultiQuizVisible(true)} disabled={selectedSentences.length === 0}>
                        Start Selected Quiz ({selectedSentences.length})
                    </button>
                }
                <SentenceList
                    sentences={currentSentences}
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
          sentences={selectedSentences.length > 0 ? selectedSentences : currentSentences}
          isRandom={selectedSentences.length === 0}
          onClose={() => setMultiQuizVisible(false)}
        />
      )}
    </div>
  );
} 
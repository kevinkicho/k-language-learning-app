'use client';

import React, { useState, useMemo } from 'react';
import Button from './ui/Button';
import LoadingSpinner from './ui/LoadingSpinner';
import { QuizGenerationRequest, QuizGenerationResponse, Language } from '@/lib/types';

interface AICommandInterfaceProps {
  onQuizGenerated: (quiz: QuizGenerationResponse['quiz'], userCommand?: string, language?: Language) => void;
  onError: (error: string) => void;
}

export const AICommandInterface: React.FC<AICommandInterfaceProps> = ({
  onQuizGenerated,
  onError
}) => {
  const [command, setCommand] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('es-es');
  const [isLoading, setIsLoading] = useState(false);

  const languages: { value: Language; label: string }[] = [
    { value: 'es-es', label: '🇪🇸 Spanish (Spain)' },
    { value: 'es', label: '🇲🇽 Spanish (Latin America)' },
    { value: 'en', label: '🇺🇸 English' },
    { value: 'fr-fr', label: '🇫🇷 French (France)' },
    { value: 'fr', label: '🇨🇦 French (Canada)' },
    { value: 'de-de', label: '🇩🇪 German (Germany)' },
    { value: 'de', label: '🇦🇹 German (Austria)' },
    { value: 'it-it', label: '🇮🇹 Italian (Italy)' },
    { value: 'it', label: '🇮🇹 Italian (Italy)' },
    { value: 'pt-pt', label: '🇵🇹 Portuguese (Portugal)' },
    { value: 'pt', label: '🇧🇷 Portuguese (Brazil)' },
    { value: 'ja-jp', label: '🇯🇵 Japanese (日本語)' },
    { value: 'zh-cn', label: '🇨🇳 Chinese (中文)' }
  ];

  // Language-specific suggestions
  const suggestions = useMemo(() => {
    const baseSuggestions: Record<Language, string[]> = {
      'es-es': [
        'I want to learn useful Spanish sentences for travel',
        'How do you say hello in Spanish?',
        'Teach me basic Spanish greetings',
        'I need Spanish phrases for ordering food',
        'What are common Spanish expressions for daily conversation?',
        'Help me learn Spanish for business meetings',
        'Show me Spanish sentences about family and friends',
        'I want to practice Spanish for shopping and restaurants'
      ],
      'es': [
        'I want to learn useful Spanish sentences for travel',
        'How do you say hello in Spanish?',
        'Teach me basic Spanish greetings',
        'I need Spanish phrases for ordering food',
        'What are common Spanish expressions for daily conversation?',
        'Help me learn Spanish for business meetings',
        'Show me Spanish sentences about family and friends',
        'I want to practice Spanish for shopping and restaurants'
      ],
      'ja-jp': [
        'I want to learn useful Japanese phrases for travel',
        'How do you say hello in Japanese?',
        'Teach me basic Japanese greetings',
        'I need Japanese phrases for ordering food',
        'What are common Japanese expressions for daily conversation?',
        'Help me learn Japanese for business meetings',
        'Show me Japanese sentences about family and friends',
        'I want to practice Japanese for shopping and restaurants'
      ],
      'zh-cn': [
        'I want to learn useful Chinese phrases for travel',
        'How do you say hello in Chinese?',
        'Teach me basic Chinese greetings',
        'I need Chinese phrases for ordering food',
        'What are common Chinese expressions for daily conversation?',
        'Help me learn Chinese for business meetings',
        'Show me Chinese sentences about family and friends',
        'I want to practice Chinese for shopping and restaurants'
      ],
      'fr-fr': [
        'I want to learn useful French phrases for travel',
        'How do you say hello in French?',
        'Teach me basic French greetings',
        'I need French phrases for ordering food',
        'What are common French expressions for daily conversation?',
        'Help me learn French for business meetings',
        'Show me French sentences about family and friends',
        'I want to practice French for shopping and restaurants'
      ],
      'fr': [
        'I want to learn useful French phrases for travel',
        'How do you say hello in French?',
        'Teach me basic French greetings',
        'I need French phrases for ordering food',
        'What are common French expressions for daily conversation?',
        'Help me learn French for business meetings',
        'Show me French sentences about family and friends',
        'I want to practice French for shopping and restaurants'
      ],
      'de-de': [
        'I want to learn useful German phrases for travel',
        'How do you say hello in German?',
        'Teach me basic German greetings',
        'I need German phrases for ordering food',
        'What are common German expressions for daily conversation?',
        'Help me learn German for business meetings',
        'Show me German sentences about family and friends',
        'I want to practice German for shopping and restaurants'
      ],
      'de': [
        'I want to learn useful German phrases for travel',
        'How do you say hello in German?',
        'Teach me basic German greetings',
        'I need German phrases for ordering food',
        'What are common German expressions for daily conversation?',
        'Help me learn German for business meetings',
        'Show me German sentences about family and friends',
        'I want to practice German for shopping and restaurants'
      ],
      'it-it': [
        'I want to learn useful Italian phrases for travel',
        'How do you say hello in Italian?',
        'Teach me basic Italian greetings',
        'I need Italian phrases for ordering food',
        'What are common Italian expressions for daily conversation?',
        'Help me learn Italian for business meetings',
        'Show me Italian sentences about family and friends',
        'I want to practice Italian for shopping and restaurants'
      ],
      'it': [
        'I want to learn useful Italian phrases for travel',
        'How do you say hello in Italian?',
        'Teach me basic Italian greetings',
        'I need Italian phrases for ordering food',
        'What are common Italian expressions for daily conversation?',
        'Help me learn Italian for business meetings',
        'Show me Italian sentences about family and friends',
        'I want to practice Italian for shopping and restaurants'
      ],
      'pt-pt': [
        'I want to learn useful Portuguese phrases for travel',
        'How do you say hello in Portuguese?',
        'Teach me basic Portuguese greetings',
        'I need Portuguese phrases for ordering food',
        'What are common Portuguese expressions for daily conversation?',
        'Help me learn Portuguese for business meetings',
        'Show me Portuguese sentences about family and friends',
        'I want to practice Portuguese for shopping and restaurants'
      ],
      'pt': [
        'I want to learn useful Portuguese phrases for travel',
        'How do you say hello in Portuguese?',
        'Teach me basic Portuguese greetings',
        'I need Portuguese phrases for ordering food',
        'What are common Portuguese expressions for daily conversation?',
        'Help me learn Portuguese for business meetings',
        'Show me Portuguese sentences about family and friends',
        'I want to practice Portuguese for shopping and restaurants'
      ],
      'en': [
        'I want to learn useful English phrases for travel',
        'How do you say hello in English?',
        'Teach me basic English greetings',
        'I need English phrases for ordering food',
        'What are common English expressions for daily conversation?',
        'Help me learn English for business meetings',
        'Show me English sentences about family and friends',
        'I want to practice English for shopping and restaurants'
      ]
    };

    return baseSuggestions[selectedLanguage] || baseSuggestions['es-es'];
  }, [selectedLanguage]);

  // Get language name for display
  const getLanguageName = (lang: Language): string => {
    switch (lang) {
      case 'es-es': return 'Spanish (Spain)';
      case 'es': return 'Spanish (Latin America)';
      case 'ja-jp': return 'Japanese';
      case 'zh-cn': return 'Chinese';
      case 'fr-fr': return 'French (France)';
      case 'fr': return 'French (Canada)';
      case 'de-de': return 'German (Germany)';
      case 'de': return 'German (Austria)';
      case 'it-it': return 'Italian';
      case 'it': return 'Italian';
      case 'pt-pt': return 'Portuguese (Portugal)';
      case 'pt': return 'Portuguese (Brazil)';
      case 'en': return 'English';
      default: return 'Spanish';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setIsLoading(true);
    try {
      const request: QuizGenerationRequest = {
        command: command.trim(),
        language: selectedLanguage
      };

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
        onQuizGenerated(result.quiz, command.trim(), selectedLanguage);
        setCommand('');
      } else {
        throw new Error(result.error || 'Failed to generate quiz');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCommand(suggestion);
  };

  const languageName = getLanguageName(selectedLanguage);

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <div className="d-flex align-items-center mb-3">
          <i className="bi bi-robot display-6 text-primary me-3"></i>
          <div>
            <h3 className="h5 fw-bold mb-1">AI Quiz Generator</h3>
            <p className="text-muted small mb-0">Ask AI to create custom quizzes for you</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="row g-3">
            {/* Language Selector - Mobile optimized */}
            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold small">
                <i className="bi bi-globe me-1"></i>
                Language:
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as Language)}
                className="form-select"
                disabled={isLoading}
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Command Input - Mobile optimized */}
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold small">
                <i className="bi bi-chat-dots me-1"></i>
                What would you like to learn?
              </label>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder={`Ask me to create ${getLanguageName(selectedLanguage)} quizzes...`}
                className="form-control"
                disabled={isLoading}
              />
            </div>

            {/* Submit Button - Mobile optimized */}
            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold small d-none d-md-block">
                &nbsp;
              </label>
              <Button
                type="submit"
                variant="primary"
                className="w-100"
                disabled={isLoading || !command.trim()}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ms-2">Generating...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-magic me-2"></i>
                    Generate Quiz
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Quick Suggestions - Mobile optimized */}
        <div>
          <label className="form-label fw-semibold small mb-3">
            <i className="bi bi-lightbulb me-1"></i>
            Quick Suggestions:
          </label>
          <div className="row g-2">
            {suggestions.slice(0, 4).map((suggestion, index) => (
              <div key={index} className="col-12 col-sm-6 col-lg-3">
                <button
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isLoading}
                  className="btn btn-outline-primary btn-sm w-100 text-start p-2"
                  style={{ fontSize: '0.875rem', lineHeight: '1.2' }}
                >
                  {suggestion}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 
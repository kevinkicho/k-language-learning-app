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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">
        🤖 AI Language Learning Assistant
      </h3>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2 mb-3">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value as Language)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            disabled={isLoading}
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder={`Ask for ${languageName} learning content... (e.g., 'I want to learn travel phrases')`}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !command.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Learning...
              </>
            ) : (
              `Learn ${languageName}`
            )}
          </Button>
        </div>
      </form>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Try these examples:</h4>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500">
        <p>💡 <strong>How to ask for {languageName} learning content:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Ask for specific topics: "dinner phrases", "travel", "business", "shopping"</li>
          <li>Request practical phrases: "phrases to use at dinner", "how to order food"</li>
          <li>Ask for situations: "at the airport", "in a restaurant", "at work"</li>
          <li>Request translations: "how do you say hello", "what is thank you in {languageName}"</li>
          <li>Ask for general content: "useful phrases", "common expressions", "basic {languageName}"</li>
        </ul>
        <p className="mt-2 text-blue-600">
          ✨ The AI will intelligently interpret your request and generate relevant {languageName} sentences for you to practice!
        </p>
      </div>
    </div>
  );
}; 
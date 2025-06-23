'use client';

import React, { useState } from 'react';
import Button from './ui/Button';
import LoadingSpinner from './ui/LoadingSpinner';
import { QuizGenerationRequest, QuizGenerationResponse, Language } from '@/lib/types';

interface AICommandInterfaceProps {
  onQuizGenerated: (quiz: QuizGenerationResponse['quiz'], userCommand?: string) => void;
  onError: (error: string) => void;
}

export const AICommandInterface: React.FC<AICommandInterfaceProps> = ({
  onQuizGenerated,
  onError
}) => {
  const [command, setCommand] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('es-ES');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions] = useState([
    'I want to learn useful Spanish sentences for travel',
    'How do you say hello in Spanish?',
    'Teach me basic Spanish greetings',
    'I need Spanish phrases for ordering food',
    'What are common Spanish expressions for daily conversation?',
    'Help me learn Spanish for business meetings',
    'Show me Spanish sentences about family and friends',
    'I want to practice Spanish for shopping and restaurants'
  ]);

  const languages: { value: Language; label: string }[] = [
    { value: 'es-ES', label: '🇪🇸 Spanish (Spain)' },
    { value: 'es', label: '🇲🇽 Spanish (Latin America)' },
    { value: 'en', label: '🇺🇸 English' },
    { value: 'fr', label: '🇫🇷 French' },
    { value: 'de', label: '🇩🇪 German' },
    { value: 'it', label: '🇮🇹 Italian' },
    { value: 'pt', label: '🇵🇹 Portuguese' }
  ];

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
        onQuizGenerated(result.quiz, command.trim());
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
            placeholder={`Ask for ${selectedLanguage === 'es-ES' ? 'Spanish' : selectedLanguage === 'es' ? 'Spanish (Latin America)' : 'language'} learning content... (e.g., 'I want to learn travel phrases')`}
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
              `Learn ${selectedLanguage === 'es-ES' ? 'Spanish' : selectedLanguage === 'es' ? 'Spanish (LA)' : 'Language'}`
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
        <p>💡 <strong>How to ask for {selectedLanguage === 'es-ES' ? 'Spanish' : selectedLanguage === 'es' ? 'Spanish (Latin America)' : 'language'} learning content:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Ask for specific topics: "dinner phrases", "travel", "business", "shopping"</li>
          <li>Request practical phrases: "phrases to use at dinner", "how to order food"</li>
          <li>Ask for situations: "at the airport", "in a restaurant", "at work"</li>
          <li>Request translations: "how do you say hello", "what is thank you in {selectedLanguage === 'es-ES' ? 'Spanish' : selectedLanguage === 'es' ? 'Spanish' : 'this language'}"</li>
          <li>Ask for general content: "useful phrases", "common expressions", "basic {selectedLanguage === 'es-ES' ? 'Spanish' : selectedLanguage === 'es' ? 'Spanish' : 'language'}"</li>
        </ul>
        <p className="mt-2 text-blue-600">
          ✨ The AI will intelligently interpret your request and generate relevant {selectedLanguage === 'es-ES' ? 'Spanish' : selectedLanguage === 'es' ? 'Spanish (Latin America)' : 'language'} sentences for you to practice!
        </p>
      </div>
    </div>
  );
}; 
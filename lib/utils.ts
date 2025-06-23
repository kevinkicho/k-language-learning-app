// Common utility functions

import { SortField, SortOrder } from './types';

// Date formatting
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

export const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(dateString);
};

// String utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const cleanWord = (word: string): string => {
  return word.replace(/[.,!?;:]/g, '');
};

// Array utilities
export const shuffleArray = <T>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

export const sortSentences = (
  sentences: any[],
  sortBy: SortField,
  sortOrder: SortOrder
): any[] => {
  return [...sentences].sort((a, b) => {
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
};

// Audio utilities
export const createAudioUrl = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};

export const cleanupAudioUrl = (url: string | null): void => {
  if (url) {
    URL.revokeObjectURL(url);
  }
};

// Validation utilities
export const isValidSentence = (sentence: string): boolean => {
  return sentence.trim().length > 0;
};

export const isValidLanguage = (language: string): boolean => {
  return ['en', 'es', 'es-es', 'fr', 'fr-fr', 'de', 'de-de', 'it', 'it-it', 'pt', 'pt-pt', 'ja-jp', 'zh-cn'].includes(language);
};

// Error handling
export const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Local storage utilities
export const safeLocalStorage = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  clear: (pattern?: string): boolean => {
    try {
      if (pattern) {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(pattern)) {
            localStorage.removeItem(key);
          }
        });
      } else {
        localStorage.clear();
      }
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Chunks text based on language for quiz word generation
 * @param text - The text to chunk
 * @param languageCode - The language code (e.g., 'ja-jp', 'es-es')
 * @param useRomajiMode - Whether to use romaji mode for Japanese
 * @returns Array of word chunks
 */
export const chunkTextByLanguage = async (text: string, languageCode: string, useRomajiMode: boolean = false): Promise<string[]> => {
  if (!text) return [];

  if (languageCode === 'ja-jp') {
    if (useRomajiMode) {
      // For romaji mode, extract content from parentheses or find any Latin characters
      const romajiMatches = text.match(/\(([^)]+)\)/g);
      let romajiText: string;

      if (romajiMatches && romajiMatches.length > 0) {
        romajiText = romajiMatches.map(match => match.replace(/[()]/g, '')).join(' ').trim();
      } else {
        const romajiPattern = /[a-zA-Z\s]+/g;
        const romajiParts = text.match(romajiPattern);
        romajiText = romajiParts ? romajiParts.join(' ') : '';
      }
      return romajiText.split(/\s+/).filter(word => word.length > 0);

    } else {
      // For native script mode, use the server-side API for accurate chunking
      try {
        const response = await fetch('/api/ai/chunk-japanese', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (response.ok) {
          const data = await response.json();
          return data.chunks || [];
        }
        console.error('Failed to chunk text via API:', response.status);
      } catch (error) {
        console.error('Error calling chunking API:', error);
      }
      // Fallback for API failure: return the cleaned Japanese text as a single chunk
      return [text.replace(/\([^)]*\)/g, '').trim()];
    }
  }
  
  // For all other languages, split by spaces and common punctuation
  return text
    .split(/[\s.,!?;:]+/)
    .filter(word => word.length > 0)
    .map(word => word.trim());
};

/**
 * Cleans text for display in the quiz, optionally showing romaji for Japanese.
 * @param text The text to clean.
 * @param languageCode The language code.
 * @param useRomajiMode Whether to extract romaji.
 * @returns The cleaned text for display.
 */
export const cleanTextForDisplay = (text: string, languageCode: string, useRomajiMode: boolean = false): string => {
  if (languageCode === 'ja-jp' && useRomajiMode) {
    const romajiMatch = text.match(/\(([^)]+)\)/);
    if (romajiMatch && romajiMatch[1]) {
      return romajiMatch[1].trim();
    }
  }
  // For non-romaji mode or other languages, remove the romaji part
  return text.replace(/\s*\([^)]+\)\s*/g, ' ').trim();
}; 
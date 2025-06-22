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

export const generateId = (prefix: string, index: number, word: string): string => {
  return `${index}-${word}`;
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

// Quiz utilities
export const calculateScore = (selectedWords: any[], totalWords: number): number => {
  const correctWords = selectedWords.filter((word, index) => word.originalIndex === index).length;
  return Math.round((correctWords / totalWords) * 100);
};

export const isCorrectOrder = (selectedWords: any[]): boolean => {
  return selectedWords.every((word, index) => word.originalIndex === index);
};

export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
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
  return ['en', 'es', 'es-ES'].includes(language);
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
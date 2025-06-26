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
 * Chunks text for quiz word generation, returning both native and phonetic arrays for Chinese/Japanese.
 * @param text - The text to chunk
 * @param languageCode - The language code (e.g., 'ja-jp', 'zh-cn', 'es-es')
 * @returns { nativeChunks: string[], phoneticChunks: string[] }
 */
export const chunkTextWithPhonetics = (text: string, languageCode: string): { nativeChunks: string[], phoneticChunks: string[] } => {
  if (!text) return { nativeChunks: [], phoneticChunks: [] };

  if (languageCode === 'ja-jp' || languageCode === 'zh-cn') {
    // Extract phonetic (pinyin/romaji) from parentheses
    const phoneticMatch = text.match(/\(([^)]+)\)/);
    const phoneticChunks = phoneticMatch && phoneticMatch[1] ? phoneticMatch[1].trim().split(/\s+/) : [];
    
    // Remove phonetic from text, then split native by character (Chinese) or by API (Japanese)
    const nativeText = text.replace(/\([^)]*\)/g, '').trim();
    let nativeChunks: string[] = [];

    // Punctuation marks to attach to previous chunk
    const punctuation = /[.,!?;:。！？、，．]/;
    let buffer = '';
    for (const char of nativeText) {
      if (punctuation.test(char)) {
        // Attach punctuation to previous chunk
        if (nativeChunks.length > 0) {
          nativeChunks[nativeChunks.length - 1] += char;
        } else {
          // If punctuation is at the start, treat as its own chunk
          nativeChunks.push(char);
        }
      } else if (char.trim() !== '') {
        nativeChunks.push(char);
      }
    }
    return { nativeChunks, phoneticChunks };
  }

  // Other languages: split by spaces
  const nativeChunks = text.split(/\s+/).filter(w => w.length > 0);
  return { nativeChunks, phoneticChunks: [] };
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
  if (languageCode === 'zh-cn' && useRomajiMode) {
    const pinyinMatch = text.match(/\(([^)]+)\)/);
    if (pinyinMatch && pinyinMatch[1]) {
      return pinyinMatch[1].trim();
    }
  }
  // For non-romaji/pinyin mode or other languages, remove the parenthesis part
  return text.replace(/\s*\([^)]+\)\s*/g, ' ').trim();
}; 
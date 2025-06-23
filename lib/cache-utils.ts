// Client-side caching utilities to minimize server calls
import { Sentence, QuizAttempt } from './types';

// Memory cache for fast access with size limits
const memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const audioCache = new Map<string, { blob: Blob; timestamp: number; ttl: number }>();

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const AUDIO_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_MEMORY_CACHE_SIZE = 100; // Maximum number of items in memory cache
const MAX_AUDIO_CACHE_SIZE = 50; // Maximum number of audio items in memory cache

// Generic cache functions
export const setCache = (key: string, data: any, ttl: number = CACHE_TTL): void => {
  const timestamp = Date.now();
  
  // Clean up expired items first
  cleanupExpiredItems();
  
  // Check cache size limits
  if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) {
      memoryCache.delete(oldestKey);
    }
  }
  
  memoryCache.set(key, { data, timestamp, ttl });
  
  // Also store in localStorage for persistence
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp, ttl }));
  } catch (error) {
    // localStorage might be full or disabled
  }
};

export const getCache = (key: string): any | null => {
  // Check memory cache first
  const memoryItem = memoryCache.get(key);
  if (memoryItem) {
    const { data, timestamp, ttl } = memoryItem;
    if (Date.now() - timestamp < ttl) {
      return data;
    } else {
      memoryCache.delete(key);
    }
  }
  
  // Check localStorage
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const { data, timestamp, ttl } = JSON.parse(stored);
      if (Date.now() - timestamp < ttl) {
        // Restore to memory cache if space available
        if (memoryCache.size < MAX_MEMORY_CACHE_SIZE) {
          memoryCache.set(key, { data, timestamp, ttl });
        }
        return data;
      } else {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    // localStorage might be corrupted
  }
  
  return null;
};

// Audio-specific cache functions
export const setAudioCache = (key: string, blob: Blob, ttl: number = AUDIO_CACHE_TTL): void => {
  const timestamp = Date.now();
  
  // Clean up expired audio items
  cleanupExpiredAudioItems();
  
  // Check audio cache size limits
  if (audioCache.size >= MAX_AUDIO_CACHE_SIZE) {
    const oldestKey = audioCache.keys().next().value;
    if (oldestKey) {
      audioCache.delete(oldestKey);
    }
  }
  
  audioCache.set(key, { blob, timestamp, ttl });
};

export const getAudioCache = (key: string): Blob | null => {
  const item = audioCache.get(key);
  if (item) {
    const { blob, timestamp, ttl } = item;
    if (Date.now() - timestamp < ttl) {
      return blob;
    } else {
      audioCache.delete(key);
    }
  }
  return null;
};

// Cache cleanup functions
const cleanupExpiredItems = (): void => {
  const now = Date.now();
  for (const [key, item] of Array.from(memoryCache.entries())) {
    if (now - item.timestamp >= item.ttl) {
      memoryCache.delete(key);
    }
  }
};

const cleanupExpiredAudioItems = (): void => {
  const now = Date.now();
  for (const [key, item] of Array.from(audioCache.entries())) {
    if (now - item.timestamp >= item.ttl) {
      audioCache.delete(key);
    }
  }
};

// Cache management
export const clearCache = (): void => {
  memoryCache.clear();
  try {
    localStorage.clear();
  } catch (error) {
    // localStorage might be disabled
  }
};

export const clearAudioCache = (): void => {
  audioCache.clear();
};

export const removeCache = (key: string): void => {
  memoryCache.delete(key);
  try {
    localStorage.removeItem(key);
  } catch (error) {
    // localStorage might be disabled
  }
};

// Cached API wrapper
export class CachedAPI {
  // Sentences
  static async getSentences(): Promise<Sentence[]> {
    const cacheKey = 'sentences';
    const cached = getCache(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const response = await fetch('/api/sentences');
    if (!response.ok) {
      throw new Error('Failed to fetch sentences');
    }
    
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  }
  
  static async addSentence(
    englishSentence: string, 
    quizGroup?: string, 
    languageCode: string = 'es-es',
    spanishSentence?: string
  ): Promise<Sentence> {
    try {
      const response = await fetch('/api/sentences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          englishSentence, 
          spanishSentence,
          quizGroup, 
          languageCode 
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Add sentence failed with status ${response.status}:`, errorText);
        throw new Error(`Failed to add sentence: ${response.status} ${response.statusText}`);
      }
      
      const sentence = await response.json();
      
      removeCache('sentences');
      
      return sentence;
    } catch (error) {
      console.error('Error in addSentence:', error);
      throw error;
    }
  }
  
  static async deleteSentence(id: string): Promise<void> {
    const response = await fetch(`/api/sentences/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Delete failed with status ${response.status}:`, errorText);
      throw new Error(`Failed to delete sentence: ${response.status} ${response.statusText}`);
    }
    
    // Invalidate sentences cache
    removeCache('sentences');
  }
  
  // Word audio
  static async getWordAudio(text: string, language: string = 'es-es'): Promise<Blob> {
    const cacheKey = `audio_${text}_${language}`;
    
    const cached = getAudioCache(cacheKey);
    if (cached) {
      return cached;
    }
    
    const response = await fetch('/api/audio/word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    });
    
    if (!response.ok) {
      console.error(`Audio API error for "${text}":`, response.status, response.statusText);
      throw new Error('Failed to get word audio');
    }
    
    const blob = await response.blob();
    setAudioCache(cacheKey, blob);
    return blob;
  }
  
  // Quiz attempts
  static async saveQuizAttempt(sentenceId: string, score: number, totalWords: number): Promise<void> {
    const response = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentenceId, score, totalWords }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save quiz attempt');
    }
    
    // Invalidate quiz attempts cache for this sentence
    removeCache(`quiz_attempts_${sentenceId}`);
  }
  
  // Cache management
  static clearAudioCache(): void {
    clearAudioCache();
  }

  // Database integrity check
  static async checkDatabaseIntegrity(): Promise<{
    checked: number;
    missing: number;
    repaired: number;
    errors: string[];
  }> {
    const response = await fetch('/api/database/integrity', {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to check database integrity');
    }
    
    return await response.json();
  }

  // Clear all word audio cache entries
  static async clearWordAudioCache(): Promise<void> {
    const response = await fetch('/api/database/clear-audio-cache', {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to clear word audio cache');
    }
    
    // Also clear local audio cache
    clearAudioCache();
  }
} 
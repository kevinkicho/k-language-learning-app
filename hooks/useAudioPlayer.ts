import { useState, useRef, useCallback, useEffect } from 'react';
import { CachedAPI } from '@/lib/cache-utils';
import { createAudioUrl, cleanupAudioUrl } from '@/lib/utils';

interface UseAudioPlayerReturn {
  playingWord: string | null;
  playWordAudio: (word: string, language?: string) => Promise<void>;
  stopAudio: () => void;
  isLoading: boolean;
  error: string | null;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      // The event listeners will be cleaned up by the effect hook
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setPlayingWord(null);
  }, []);
  
  const playWordAudio = useCallback(async (word: string, language: string = 'es-es') => {
    // If another word is playing, stop it first.
    if (playingWord) {
      stopAudio();
    }
    
    // If the same word is requested, treat as a toggle to stop.
    if (playingWord === word) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setPlayingWord(word);

    try {
      const blob = await CachedAPI.getWordAudio(word, language);
      if (blob.size === 0) throw new Error(`Blob is empty for word: ${word}`);
      
      const url = createAudioUrl(blob);
      const newAudio = new Audio(url);
      newAudio.preload = 'auto';
      audioRef.current = newAudio;
      
      await newAudio.play();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown audio error';
      console.error(`Error playing word audio for "${word}":`, errorMessage);
      setError(errorMessage);
      setPlayingWord(null); // Reset playing state on error
      throw new Error(`Failed to play audio for "${word}": ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [stopAudio, playingWord]);
  
  // Effect for handling audio lifecycle events
  useEffect(() => {
    const audio = audioRef.current;

    const handleEnded = () => setPlayingWord(null);
    const handleError = (e: ErrorEvent) => {
      console.error('Audio playback error:', e);
      setError('Audio playback failed.');
      setPlayingWord(null);
    };

    if (audio) {
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
    }
    
    // Cleanup function
    return () => {
      if (audio) {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        // Also call stopAudio to ensure everything is reset
        if (!audio.paused) {
           audio.pause();
        }
        URL.revokeObjectURL(audio.src);
      }
    };
  }, [audioRef.current]); // Rerun when audioRef.current changes


  // Main cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  return {
    playingWord,
    playWordAudio,
    stopAudio,
    isLoading,
    error,
  };
} 
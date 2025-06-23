import { useState, useRef, useCallback, useEffect } from 'react';
import { CachedAPI } from '@/lib/cache-utils';
import { createAudioUrl, cleanupAudioUrl } from '@/lib/utils';

interface UseAudioPlayerReturn {
  playingWord: string | null;
  playWordAudio: (word: string, language?: string) => Promise<void>;
  stopAudio: () => void;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopAudio = useCallback(() => {
    console.log('Stopping audio playback');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      cleanupAudioUrl(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setPlayingWord(null);
    isPlayingRef.current = false;
  }, []);

  const playWordAudio = useCallback(async (word: string, language: string = 'es-es') => {
    if (isPlayingRef.current) {
      console.log('Audio is already playing, skipping request.');
      return;
    }
    
    console.log(`🎵 Attempting to play audio for word: "${word}"`);
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`📡 Fetching audio blob for "${word}"`);
      const blob = await CachedAPI.getWordAudio(word, language);
      const url = URL.createObjectURL(blob);
      
      const newAudio = new Audio(url);
      audioRef.current = newAudio;
      
      // Set up event listeners
      const handleCanPlay = () => {
        console.log(`🎧 Audio can play for "${word}"`);
      };
      
      const handlePlay = () => {
        console.log(`▶️ Audio started playing for "${word}"`);
      };
      
      const handleEnded = () => {
        console.log(`⏹️ Audio ended for "${word}"`);
        setPlayingWord(null);
        isPlayingRef.current = false;
        if (audioUrlRef.current === url) {
          URL.revokeObjectURL(url);
          audioUrlRef.current = null;
        }
        audioRef.current = null;
      };
      
      const handleError = (error: Event) => {
        console.error(`❌ Audio error for "${word}":`, error);
        setPlayingWord(null);
        isPlayingRef.current = false;
        if (audioUrlRef.current === url) {
          URL.revokeObjectURL(url);
          audioUrlRef.current = null;
        }
        audioRef.current = null;
      };
      
      // Add event listeners
      newAudio.addEventListener('canplay', handleCanPlay, { once: true });
      newAudio.addEventListener('play', handlePlay, { once: true });
      newAudio.addEventListener('ended', handleEnded, { once: true });
      newAudio.addEventListener('error', handleError, { once: true });
      
      console.log(`🎯 Attempting to play audio for "${word}"`);
      await newAudio.play();
      console.log(`✅ Audio played successfully for: ${word}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown audio error';
      console.error(`💥 Error playing word audio for "${word}":`, errorMessage);
      setError(errorMessage);
      // Explicitly re-throw the error so the calling component knows about it
      throw new Error(`Failed to play audio for "${word}": ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [stopAudio]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  return {
    playingWord,
    playWordAudio,
    stopAudio,
  };
} 
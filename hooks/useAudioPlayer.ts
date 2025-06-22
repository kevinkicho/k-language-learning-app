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

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      cleanupAudioUrl(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setPlayingWord(null);
  }, []);

  const playWordAudio = useCallback(async (word: string, language: string = 'es-ES') => {
    if (playingWord === word) return; // Prevent multiple simultaneous plays
    
    // Stop any currently playing audio
    stopAudio();
    
    setPlayingWord(word);
    
    try {
      // Get audio blob from cached API
      const audioBlob = await CachedAPI.getWordAudio(word, language);
      
      // Create audio URL
      const audioUrl = createAudioUrl(audioBlob);
      audioUrlRef.current = audioUrl;
      
      // Create audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Set up event listeners
      const handleEnded = () => {
        setPlayingWord(null);
        if (audioUrlRef.current === audioUrl) {
          cleanupAudioUrl(audioUrl);
          audioUrlRef.current = null;
        }
        audioRef.current = null;
      };
      
      const handleError = (error: Event) => {
        console.error('Audio playback error:', error);
        setPlayingWord(null);
        if (audioUrlRef.current === audioUrl) {
          cleanupAudioUrl(audioUrl);
          audioUrlRef.current = null;
        }
        audioRef.current = null;
      };
      
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      
      // Try to play the audio
      try {
        await audio.play();
      } catch (playError) {
        console.error('Failed to play audio:', playError);
        setPlayingWord(null);
        if (audioUrlRef.current === audioUrl) {
          cleanupAudioUrl(audioUrl);
          audioUrlRef.current = null;
        }
        audioRef.current = null;
        // Clean up event listeners
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      }
    } catch (error) {
      console.error('Error getting word audio:', error);
      setPlayingWord(null);
    }
  }, [playingWord, stopAudio]);

  // Cleanup on unmount
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
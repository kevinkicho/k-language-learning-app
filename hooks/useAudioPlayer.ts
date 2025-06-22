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

  const playWordAudio = useCallback(async (word: string, language: string = 'es-ES') => {
    console.log(`🎵 Attempting to play audio for word: "${word}"`);
    
    // Stop any currently playing audio before starting new one
    if (isPlayingRef.current) {
      console.log(`🛑 Stopping previous audio to play new word: "${word}"`);
      stopAudio();
    }
    
    setPlayingWord(word);
    isPlayingRef.current = true;
    
    try {
      console.log(`📡 Fetching audio blob for "${word}"`);
      const audioBlob = await CachedAPI.getWordAudio(word, language);
      console.log(`✅ Received audio blob for "${word}":`, { size: audioBlob.size, type: audioBlob.type });
      
      const audioUrl = createAudioUrl(audioBlob);
      audioUrlRef.current = audioUrl;
      console.log(`🔗 Created audio URL for "${word}":`, audioUrl);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
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
        if (audioUrlRef.current === audioUrl) {
          cleanupAudioUrl(audioUrl);
          audioUrlRef.current = null;
        }
        audioRef.current = null;
      };
      
      const handleError = (error: Event) => {
        console.error(`❌ Audio error for "${word}":`, error);
        setPlayingWord(null);
        isPlayingRef.current = false;
        if (audioUrlRef.current === audioUrl) {
          cleanupAudioUrl(audioUrl);
          audioUrlRef.current = null;
        }
        audioRef.current = null;
      };
      
      // Add event listeners
      audio.addEventListener('canplay', handleCanPlay, { once: true });
      audio.addEventListener('play', handlePlay, { once: true });
      audio.addEventListener('ended', handleEnded, { once: true });
      audio.addEventListener('error', handleError, { once: true });
      
      console.log(`🎯 Attempting to play audio for "${word}"`);
      await audio.play();
      console.log(`🎉 Successfully started playing audio for "${word}"`);
    } catch (error) {
      console.error(`💥 Error playing word audio for "${word}":`, error);
      setPlayingWord(null);
      isPlayingRef.current = false;
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
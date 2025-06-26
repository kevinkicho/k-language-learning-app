'use client';

import { useRef, useState, useEffect } from 'react';
import Button from './ui/Button';

interface AudioPlayerProps {
  audioPath: string;
  buttonClassName?: string;
}

export default function AudioPlayer({ audioPath, buttonClassName }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set up event listeners using useEffect
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      console.log(`Audio started playing: ${audioPath}`);
      setIsPlaying(true);
    };
    
    const handleEnded = () => {
      console.log(`Audio ended: ${audioPath}`);
      setIsPlaying(false);
    };
    
    const handleError = (e: Event) => {
      console.error(`Audio error for ${audioPath}:`, e);
      setError('Failed to play audio');
      setIsPlaying(false);
    };

    const handlePause = () => {
      console.log(`Audio paused: ${audioPath}`);
      setIsPlaying(false);
    };

    // Add event listeners
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('pause', handlePause);
    
    // Cleanup function
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioPath]);

  const handlePlay = async () => {
    try {
      setError(null);
      console.log(`Attempting to play sentence audio: ${audioPath}`);
      
      if (!audioRef.current) {
        throw new Error('Audio element not found');
      }

      // Reset audio to beginning
      audioRef.current.currentTime = 0;
      
      // Try to play
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        console.log(`Successfully started playing sentence audio: ${audioPath}`);
      }
      
    } catch (error) {
      console.error(`Error playing sentence audio: ${audioPath}`, error);
      setError('Failed to play audio');
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };
  
  return (
    <div>
      <Button 
        variant="info" 
        size="sm" 
        onClick={isPlaying ? handleStop : handlePlay}
        className={buttonClassName ? buttonClassName : "btn-sm px-2 py-1"}
        title={isPlaying ? "Stop" : "Play"}
      >
        <i className={`bi ${isPlaying ? 'bi-stop-fill' : 'bi-play-fill'}`}></i>
      </Button>
      <audio 
        ref={audioRef} 
        src={audioPath} 
        preload="none" 
        className="d-none"
      />
      {error && <small className="text-danger d-block mt-1">{error}</small>}
    </div>
  );
} 
'use client';

import { useRef, useState } from 'react';
import Button from './ui/Button';

interface AudioPlayerProps {
  audioPath: string;
}

export default function AudioPlayer({ audioPath }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlay = async () => {
    try {
      setError(null);
      console.log(`Attempting to play sentence audio: ${audioPath}`);
      
      if (!audioRef.current) {
        throw new Error('Audio element not found');
      }

      // Reset audio to beginning
      audioRef.current.currentTime = 0;
      
      // Set up event listeners
      const handleCanPlay = () => {
        console.log(`Audio can play: ${audioPath}`);
      };
      
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
      
      // Add event listeners
      audioRef.current.addEventListener('canplay', handleCanPlay);
      audioRef.current.addEventListener('play', handlePlay);
      audioRef.current.addEventListener('ended', handleEnded);
      audioRef.current.addEventListener('error', handleError);
      
      // Try to play
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        console.log(`Successfully started playing sentence audio: ${audioPath}`);
      }
      
      // Clean up event listeners after a delay
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('canplay', handleCanPlay);
          audioRef.current.removeEventListener('play', handlePlay);
          audioRef.current.removeEventListener('ended', handleEnded);
          audioRef.current.removeEventListener('error', handleError);
        }
      }, 1000);
      
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
      >
        {isPlaying ? 'Stop' : 'Play'}
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
'use client';

import { useRef } from 'react';
import Button from './ui/Button';

interface AudioPlayerProps {
  audioPath: string;
}

export default function AudioPlayer({ audioPath }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlay = () => {
    audioRef.current?.play();
  };
  
  return (
    <>
      <Button variant="info" size="sm" onClick={handlePlay}>Play</Button>
      <audio ref={audioRef} src={audioPath} preload="none" className="d-none" />
    </>
  );
} 
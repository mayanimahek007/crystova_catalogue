import { useRef } from 'react';

export function usePageFlipAudio(): {
  playPageFlipSound: () => void;
  AudioComponent: () => JSX.Element;
} {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playPageFlipSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.log('Audio play failed:', error);
      });
    }
  };

  const AudioComponent = () => (
    <audio 
      ref={audioRef} 
      src="/audio/page-flip2.mp3" 
      preload="auto"
      style={{ display: 'none' }}
    />
  );

  return { playPageFlipSound, AudioComponent };
}

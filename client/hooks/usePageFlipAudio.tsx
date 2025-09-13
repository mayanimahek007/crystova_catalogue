import { useRef, useEffect, useState } from 'react';

export function usePageFlipAudio(): {
  playPageFlipSound: () => void;
  AudioComponent: () => JSX.Element;
} {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);

  useEffect(() => {
    // Initialize audio when component mounts
    const initAudio = () => {
      if (audioRef.current) {
        audioRef.current.load();
        setAudioLoaded(true);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initAudio, 100);
    return () => clearTimeout(timer);
  }, []);

  const playPageFlipSound = () => {
    console.log('Attempting to play page flip sound...', { audioLoaded, hasRef: !!audioRef.current });
    
    // Try the ref audio first
    if (audioRef.current && audioLoaded) {
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => {
          console.log('Page flip sound played successfully');
        })
        .catch((error) => {
          console.log('Audio play failed, trying fallback:', error);
          // Fallback to creating new audio
          tryPlayFallbackAudio();
        });
    } else {
      console.log('Ref audio not ready, using fallback');
      tryPlayFallbackAudio();
    }
  };

  const tryPlayFallbackAudio = () => {
    try {
      const audio = new Audio('/audio/page-flip2.mp3');
      audio.volume = 0.7;
      audio.play().catch((err) => {
        console.log('Fallback audio failed:', err);
      });
    } catch (error) {
      console.log('Error creating fallback audio:', error);
    }
  };

  const AudioComponent = () => (
    <audio 
      ref={audioRef} 
      src="/audio/page-flip2.mp3" 
      preload="auto"
      style={{ display: 'none' }}
      onLoadStart={() => console.log('Audio loading started')}
      onCanPlay={() => {
        console.log('Audio can play');
        setAudioLoaded(true);
      }}
      onError={(e) => console.log('Audio error:', e)}
    />
  );

  return { playPageFlipSound, AudioComponent };
}

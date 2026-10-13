import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface LiveVideoProps {
  videoSrc?: string;
  imageSrc?: string;
  autoplay?: boolean;
}

export const LiveVideo: React.FC<LiveVideoProps> = ({
  videoSrc = '/videos/live-demo.mp4',
  imageSrc = '/images/live-host.jpg',
  autoplay = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (videoRef.current && autoplay) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        // Autoplay fallback
      });
    }
  }, [autoplay, videoSrc]);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0A0A0A] overflow-hidden select-none">
      {/* Video Element */}
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay={autoplay}
          muted={isMuted}
          loop
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Poster / Fallback Image while loading */}
      <img
        src={imageSrc}
        alt="TikTok Livestream Host"
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          isVideoLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      />

      {/* Audio Mute/Unmute Toggle Button */}
      <button
        onClick={toggleSound}
        className="absolute top-3.5 right-3.5 z-30 w-7 h-7 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 hover:text-white transition-all active:scale-90 shadow-sm pointer-events-auto"
        title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
      >
        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#FE2C55]" />}
      </button>

      {/* Cinematic Vignette */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none z-10" />
    </div>
  );
};

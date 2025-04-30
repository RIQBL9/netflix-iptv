import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ReactPlayerComponentProps {
  src: string;
  title: string;
  type: 'live' | 'movie' | 'series';
  poster?: string;
  autoPlay?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onBack?: () => void;
  startPosition?: number;
  nextEpisodeCallback?: () => void;
}

const ReactPlayerComponent = ({ 
  src, 
  title, 
  type,
  poster, 
  autoPlay = true,
  onTimeUpdate,
  onBack,
  startPosition = 0,
  nextEpisodeCallback
}: ReactPlayerComponentProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  // Initialize player
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Set source
    video.src = src;
    
    // Set initial position if provided
    if (startPosition > 0 && type !== 'live') {
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = startPosition;
      }, { once: true });
    }
    
    // Start playback if autoPlay is true
    if (autoPlay) {
      video.play().catch(error => {
        console.error('Error attempting to play:', error);
        setIsPlaying(false);
      });
    }
    
    // Cleanup
    return () => {
      video.pause();
      video.src = '';
    };
  }, [src, autoPlay, startPosition, type]);
  
  // Handle time updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onTimeUpdate) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration);
      
      onTimeUpdate(video.currentTime, video.duration);
      
      // Check if we're near the end of the video for series
      if (
        type === 'series' && 
        nextEpisodeCallback && 
        video.duration > 0 && 
        video.currentTime > video.duration - 20
      ) {
        // Trigger next episode logic
        nextEpisodeCallback();
      }
    };
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [onTimeUpdate, nextEpisodeCallback, type]);
  
  // Handle controls visibility
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      const timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
      
      return () => clearTimeout(timeout);
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [isPlaying]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          togglePlay();
          break;
        case 'ArrowRight':
          skipTime(10);
          break;
        case 'ArrowLeft':
          skipTime(-10);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Handle buffering state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleWaiting = () => {
      setIsBuffering(true);
    };
    
    const handlePlaying = () => {
      setIsBuffering(false);
    };
    
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    
    return () => {
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, []);
  
  // Toggle play/pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };
  
  // Skip forward/backward
  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime += seconds;
  };
  
  // Toggle mute
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isMuted) {
      video.muted = false;
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    
    const video = videoRef.current;
    if (video) {
      video.volume = value;
      setIsMuted(value === 0);
    }
  };
  
  // Handle seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setCurrentTime(value);
    
    const video = videoRef.current;
    if (video) {
      video.currentTime = value;
    }
  };
  
  // Format time (seconds to MM:SS or HH:MM:SS)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black"
      style={{ aspectRatio: '16/9' }}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        playsInline
        autoPlay={autoPlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLVideoElement).duration)}
      />
      
      {/* Buffering indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <motion.div 
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}
      
      {/* Video controls */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/70 via-transparent to-black/70 p-4"
        style={{ pointerEvents: showControls ? 'auto' : 'none' }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {onBack && (
              <button 
                onClick={onBack} 
                className="text-white mr-4 hover:text-primary transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
                </svg>
              </button>
            )}
            <h2 className="text-white text-lg font-medium">{title}</h2>
          </div>
          
          <div className="text-white">
            {formatTime(currentTime)} {type !== 'live' && `/ ${formatTime(duration)}`}
          </div>
        </div>
        
        {/* Center play/pause button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.button 
            onClick={togglePlay}
            className="bg-white/20 hover:bg-white/30 rounded-full p-4 text-white transition-all pointer-events-auto"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </motion.button>
        </div>
        
        {/* Bottom controls */}
        <div className="space-y-4">
          {/* Progress bar (not for live TV) */}
          {type !== 'live' && (
            <div className="w-full">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${(currentTime / (duration || 100)) * 100}%, rgba(255, 255, 255, 0.3) ${(currentTime / (duration || 100)) * 100}%, rgba(255, 255, 255, 0.3) 100%)`,
                }}
              />
            </div>
          )}
          
          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button 
                onClick={togglePlay}
                className="text-white hover:text-primary transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isPlaying ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </motion.button>
              
              {type !== 'live' && (
                <>
                  <motion.button 
                    onClick={() => skipTime(-10)}
                    className="text-white hover:text-primary transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
                    </svg>
                  </motion.button>
                  
                  <motion.button 
                    onClick={() => skipTime(10)}
                    className="text-white hover:text-primary transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 18l8.5-6L4 6v12zm9.5-12v12l8.5-6-8.5-6z"/>
                    </svg>
                  </motion.button>
                </>
              )}
              
              <div className="flex items-center space-x-2">
                <motion.button 
                  onClick={toggleMute}
                  className="text-white hover:text-primary transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isMuted ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  )}
                </motion.button>
                
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, white 0%, white ${volume * 100}%, rgba(255, 255, 255, 0.3) ${volume * 100}%, rgba(255, 255, 255, 0.3) 100%)`,
                  }}
                />
              </div>
            </div>
            
            <motion.button 
              onClick={toggleFullscreen}
              className="text-white hover:text-primary transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isFullscreen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ReactPlayerComponent;
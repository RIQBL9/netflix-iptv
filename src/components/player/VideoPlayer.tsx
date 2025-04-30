import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlay, 
  FaPause, 
  FaVolumeUp, 
  FaVolumeMute,
  FaExpand, 
  FaCompress,
  FaCog,
  FaStepForward,
  FaStepBackward,
  FaArrowLeft,
  FaClosedCaptioning
} from 'react-icons/fa';
import { useSettingsStore, VideoQuality } from '../../store/settingsStore';

interface VideoPlayerProps {
  src: string;
  title: string;
  type: 'live' | 'movie' | 'series';
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onBack?: () => void;
  startPosition?: number;
  nextEpisodeCallback?: () => void;
}

const VideoPlayer = ({ 
  src, 
  title, 
  type, 
  onTimeUpdate, 
  onBack,
  startPosition = 0,
  nextEpisodeCallback
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { videoQuality, autoPlayNext } = useSettingsStore();
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showNextEpisodePrompt, setShowNextEpisodePrompt] = useState(false);
  const [nextEpisodeCountdown, setNextEpisodeCountdown] = useState(10);
  const [isBuffering, setIsBuffering] = useState(false);
  
  // Initialize HLS.js if the browser doesn't support HLS natively
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    let hls: Hls | null = null;
    
    const initializePlayer = () => {
      if (src.endsWith('.m3u8')) {
        // Check if HLS.js is supported
        if (Hls.isSupported()) {
          hls = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
          });
          hlsRef.current = hls;
          
          hls.loadSource(src);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            // Get available qualities
            const levels = hls.levels.map(level => {
              const height = level.height;
              return height ? `${height}p` : 'Auto';
            });
            
            setAvailableQualities(['Auto', ...levels]);
            
            // Set initial quality based on user preference
            if (videoQuality !== 'auto' && hls.levels.length > 0) {
              const qualityLevel = hls.levels.findIndex(level => 
                level.height === parseInt(videoQuality.replace('p', ''))
              );
              
              if (qualityLevel !== -1) {
                hls.currentLevel = qualityLevel;
              }
            } else {
              hls.currentLevel = -1; // Auto
            }
            
            // Start playback
            video.play().catch(error => {
              console.error('Error attempting to play:', error);
            });
          });
          
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error('Network error:', data);
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error('Media error:', data);
                  hls.recoverMediaError();
                  break;
                default:
                  console.error('Unrecoverable error:', data);
                  hls.destroy();
                  break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          video.src = src;
          video.addEventListener('loadedmetadata', () => {
            video.play().catch(error => {
              console.error('Error attempting to play:', error);
            });
          });
        }
      } else {
        // Regular video source
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(error => {
            console.error('Error attempting to play:', error);
          });
        });
      }
    };
    
    initializePlayer();
    
    // Set initial position if provided
    if (startPosition > 0 && type !== 'live') {
      video.currentTime = startPosition;
    }
    
    // Cleanup
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [src, videoQuality, startPosition, type]);
  
  // Handle play/pause
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
  
  // Handle seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setCurrentTime(value);
    
    const video = videoRef.current;
    if (video) {
      video.currentTime = value;
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
  
  // Handle time update
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    
    setCurrentTime(video.currentTime);
    
    if (onTimeUpdate) {
      onTimeUpdate(video.currentTime, video.duration);
    }
    
    // Show next episode prompt when near the end (for series)
    if (
      type === 'series' && 
      nextEpisodeCallback && 
      video.duration > 0 && 
      video.currentTime > video.duration - 20 && 
      !showNextEpisodePrompt
    ) {
      setShowNextEpisodePrompt(true);
      setNextEpisodeCountdown(10);
    }
  };
  
  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    
    setDuration(video.duration);
  };
  
  // Skip forward/backward
  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime += seconds;
  };
  
  // Change video quality
  const changeQuality = (quality: string) => {
    if (!hlsRef.current) return;
    
    if (quality === 'Auto') {
      hlsRef.current.currentLevel = -1;
    } else {
      const height = parseInt(quality.replace('p', ''));
      const levelIndex = hlsRef.current.levels.findIndex(level => level.height === height);
      
      if (levelIndex !== -1) {
        hlsRef.current.currentLevel = levelIndex;
      }
    }
    
    setShowQualityMenu(false);
  };
  
  // Handle next episode countdown
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | null = null;
    
    if (showNextEpisodePrompt && nextEpisodeCallback) {
      countdownInterval = setInterval(() => {
        setNextEpisodeCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval!);
            if (autoPlayNext) {
              nextEpisodeCallback();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [showNextEpisodePrompt, nextEpisodeCallback, autoPlayNext]);
  
  // Handle controls visibility
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
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
  
  return (
    <div 
      ref={containerRef}
      className="player-container relative w-full h-full bg-black"
      style={{ aspectRatio: '16/9' }}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        autoPlay
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {/* Buffering indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="spinner"></div>
        </div>
      )}
      
      {/* Video controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/70 via-transparent to-black/70 p-4"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button 
                  onClick={onBack} 
                  className="text-white mr-4 hover:text-primary transition-colors"
                >
                  <FaArrowLeft size={20} />
                </button>
                <h2 className="text-white text-lg font-medium">{title}</h2>
              </div>
              
              <div className="text-white">
                {formatTime(currentTime)} {type !== 'live' && `/ ${formatTime(duration)}`}
              </div>
            </div>
            
            {/* Center play/pause button */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <button 
                onClick={togglePlay}
                className="bg-white/20 hover:bg-white/30 rounded-full p-4 text-white transition-all transform hover:scale-110 pointer-events-auto"
              >
                {isPlaying ? <FaPause size={24} /> : <FaPlay size={24} />}
              </button>
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
                  <button 
                    onClick={togglePlay}
                    className="text-white hover:text-primary transition-colors"
                  >
                    {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
                  </button>
                  
                  {type !== 'live' && (
                    <>
                      <button 
                        onClick={() => skipTime(-10)}
                        className="text-white hover:text-primary transition-colors"
                      >
                        <FaStepBackward size={20} />
                      </button>
                      
                      <button 
                        onClick={() => skipTime(10)}
                        className="text-white hover:text-primary transition-colors"
                      >
                        <FaStepForward size={20} />
                      </button>
                    </>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={toggleMute}
                      className="text-white hover:text-primary transition-colors"
                    >
                      {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
                    </button>
                    
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.3) ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.3) 100%)`,
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Subtitles button */}
                  <button className="text-white hover:text-primary transition-colors">
                    <FaClosedCaptioning size={20} />
                  </button>
                  
                  {/* Quality selection */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowQualityMenu(!showQualityMenu)}
                      className="text-white hover:text-primary transition-colors"
                    >
                      <FaCog size={20} />
                    </button>
                    
                    {showQualityMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-md shadow-lg p-2 w-32">
                        <div className="text-white text-sm font-medium mb-1 px-2">Quality</div>
                        {availableQualities.map((quality) => (
                          <button
                            key={quality}
                            onClick={() => changeQuality(quality)}
                            className="block w-full text-left px-2 py-1 text-sm text-white hover:bg-gray-800 rounded"
                          >
                            {quality}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Fullscreen button */}
                  <button 
                    onClick={toggleFullscreen}
                    className="text-white hover:text-primary transition-colors"
                  >
                    {isFullscreen ? <FaCompress size={20} /> : <FaExpand size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Next episode prompt */}
      <AnimatePresence>
        {showNextEpisodePrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 right-8 bg-gray-900/90 rounded-md p-4 max-w-xs"
          >
            <h3 className="text-white font-medium mb-2">Next Episode</h3>
            <p className="text-text-secondary text-sm mb-3">
              Next episode starting in {nextEpisodeCountdown} seconds
            </p>
            <div className="flex space-x-2">
              <button 
                onClick={nextEpisodeCallback}
                className="btn-primary text-sm py-1 px-3"
              >
                Play Now
              </button>
              <button 
                onClick={() => setShowNextEpisodePrompt(false)}
                className="btn-secondary text-sm py-1 px-3"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoPlayer;
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { motion } from 'framer-motion';
import {
  MediaPlayer,
  MediaProvider,
  MediaPlayerInstance,
  MediaState,
  isHLSProvider,
  Poster,
  Track,
  type MediaProviderAdapter,
  type MediaProviderChangeEvent,
} from '@vidstack/react';

// Import icons
import {
  PlayIcon,
  PauseIcon,
  FullscreenIcon,
  FullscreenExitIcon,
  VolumeHighIcon,
  VolumeMuteIcon,
  ClosedCaptionsIcon,
  SettingsMenuIcon,
  ChevronLeftIcon,
  SkipNextIcon,
  ReplayIcon,
  ForwardIcon,
} from './icons';

interface ModernVidstackPlayerProps {
  src: string;
  title: string;
  type: 'live' | 'movie' | 'series';
  poster?: string;
  autoPlay?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onBack?: () => void;
  startPosition?: number;
  nextEpisodeCallback?: () => void;
  subtitles?: { src: string; label: string; language: string }[];
}

const ModernVidstackPlayer = ({
  src,
  title,
  type,
  poster,
  autoPlay = true,
  onTimeUpdate,
  onBack,
  startPosition = 0,
  nextEpisodeCallback,
  subtitles,
}: ModernVidstackPlayerProps) => {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showNextEpisodePrompt, setShowNextEpisodePrompt] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Setup HLS
  const setupHLS = (provider: MediaProviderAdapter) => {
    if (isHLSProvider(provider) && src.includes('.m3u8')) {
      provider.library = () => import('hls.js');
    }
  };

  // Handle provider change
  const onProviderChange = (event: MediaProviderChangeEvent) => {
    if (event.provider) {
      setupHLS(event.provider);
    }
  };

  // Initialize player
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    // Set up event listeners
    const handleTimeUpdate = () => {
      setCurrentTime(player.currentTime);
      setDuration(player.duration);
      
      if (onTimeUpdate) {
        onTimeUpdate(player.currentTime, player.duration);
      }
      
      // Check if we're near the end of the video for series
      if (
        type === 'series' && 
        nextEpisodeCallback && 
        player.duration > 0 && 
        !isNaN(player.duration) &&
        player.currentTime > player.duration - 20
      ) {
        setShowNextEpisodePrompt(true);
      } else {
        setShowNextEpisodePrompt(false);
      }
    };

    const handlePlayingChange = (state: MediaState) => {
      setIsPlaying(state.playing);
      setIsBuffering(state.buffering);
    };

    const handleVolumeChange = (state: MediaState) => {
      setVolume(state.volume);
      setIsMuted(state.muted);
    };

    const handleFullscreenChange = (state: MediaState) => {
      setIsFullscreen(state.fullscreen);
    };

    player.addEventListener('time-update', handleTimeUpdate);
    player.addEventListener('play', () => handlePlayingChange({ playing: true, buffering: false } as MediaState));
    player.addEventListener('pause', () => handlePlayingChange({ playing: false, buffering: false } as MediaState));
    player.addEventListener('waiting', () => setIsBuffering(true));
    player.addEventListener('playing', () => setIsBuffering(false));
    player.addEventListener('volume-change', handleVolumeChange as any);
    player.addEventListener('fullscreen-change', handleFullscreenChange as any);

    // Set start time if provided
    if (startPosition > 0 && type !== 'live') {
      player.addEventListener('can-play', () => {
        player.currentTime = startPosition;
      }, { once: true });
    }

    // Auto-hide controls
    const handleMouseMove = () => {
      setShowControls(true);
      setIsHovering(true);
      
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
      
      if (isPlaying) {
        controlsTimeoutRef.current = window.setTimeout(() => {
          setShowControls(false);
          setIsHovering(false);
        }, 3000);
      }
    };

    const handleMouseLeave = () => {
      if (isPlaying) {
        setShowControls(false);
        setIsHovering(false);
      }
    };

    player.addEventListener('pointerenter', handleMouseMove);
    player.addEventListener('pointermove', handleMouseMove);
    player.addEventListener('pointerleave', handleMouseLeave);

    return () => {
      player.removeEventListener('time-update', handleTimeUpdate);
      player.removeEventListener('play', () => handlePlayingChange({ playing: true, buffering: false } as MediaState));
      player.removeEventListener('pause', () => handlePlayingChange({ playing: false, buffering: false } as MediaState));
      player.removeEventListener('waiting', () => setIsBuffering(true));
      player.removeEventListener('playing', () => setIsBuffering(false));
      player.removeEventListener('volume-change', handleVolumeChange as any);
      player.removeEventListener('fullscreen-change', handleFullscreenChange as any);
      player.removeEventListener('pointerenter', handleMouseMove);
      player.removeEventListener('pointermove', handleMouseMove);
      player.removeEventListener('pointerleave', handleMouseLeave);
      
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [onTimeUpdate, startPosition, type, nextEpisodeCallback, isPlaying]);

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

  // Toggle play/pause
  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    
    if (player.paused) {
      player.play();
    } else {
      player.pause();
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    const player = playerRef.current;
    if (!player) return;
    
    if (!player.fullscreen) {
      player.enterFullscreen();
    } else {
      player.exitFullscreen();
    }
  };

  // Toggle mute
  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;
    
    player.muted = !player.muted;
  };

  // Skip forward/backward
  const skipTime = (seconds: number) => {
    const player = playerRef.current;
    if (!player) return;
    
    player.currentTime += seconds;
  };

  // Handle next episode
  const handleNextEpisode = () => {
    if (nextEpisodeCallback) {
      nextEpisodeCallback();
    }
  };

  return (
    <div className="relative w-full h-full">
      <MediaPlayer
        ref={playerRef}
        src={src}
        title={title}
        autoplay={autoPlay}
        className="w-full aspect-video bg-black"
        onProviderChange={onProviderChange}
      >
        <MediaProvider>
          {subtitles?.map((subtitle, index) => (
            <Track
              key={index}
              kind="subtitles"
              src={subtitle.src}
              label={subtitle.label}
              language={subtitle.language}
              default={index === 0}
            />
          ))}
        </MediaProvider>
        
        {poster && <Poster src={poster} alt={title} />}
        
        {/* Buffering indicator */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
            <motion.div 
              className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}
        
        {/* Custom controls */}
        <motion.div
          initial={false}
          animate={{ opacity: showControls || !isPlaying ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex flex-col justify-between z-10 pointer-events-none"
        >
          {/* Top control bar */}
          <div className={`top-control-bar w-full flex items-center justify-between pointer-events-auto ${!showControls && isPlaying ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
            <div className="flex items-center">
              {onBack && (
                <button 
                  onClick={onBack} 
                  className="text-white mr-4 hover:text-primary transition-colors p-2"
                  aria-label="Go back"
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>
              )}
              <h2 className="text-white text-lg font-medium truncate">{title}</h2>
              {type === 'live' && (
                <span className="live-indicator ml-2">LIVE</span>
              )}
            </div>
          </div>
          
          {/* Center play/pause button */}
          {!isPlaying && (
            <motion.button 
              onClick={togglePlay}
              className="center-play-button pointer-events-auto"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              <PlayIcon className="w-12 h-12 text-white" />
            </motion.button>
          )}
          
          {/* Bottom control bar */}
          <div className={`bottom-control-bar w-full pointer-events-auto ${!showControls && isPlaying ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
            {/* Progress bar (not for live TV) */}
            {type !== 'live' && (
              <div className="w-full mb-4 px-2">
                <div className="relative w-full h-1 bg-white/30 rounded-full overflow-hidden group">
                  <div 
                    className="absolute top-0 left-0 h-full bg-primary rounded-full"
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => {
                      const player = playerRef.current;
                      if (player) {
                        player.currentTime = parseFloat(e.target.value);
                      }
                    }}
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <div 
                      className="absolute top-0 left-0 h-2 bg-primary rounded-full -translate-y-0.5"
                      style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                    >
                      <div className="absolute right-0 top-1/2 w-4 h-4 bg-primary rounded-full -translate-y-1/2 translate-x-1/2 shadow-md" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Control buttons */}
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={togglePlay}
                  className="text-white hover:text-primary transition-colors"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <PauseIcon className="w-6 h-6" />
                  ) : (
                    <PlayIcon className="w-6 h-6" />
                  )}
                </button>
                
                {type !== 'live' && (
                  <>
                    <button 
                      onClick={() => skipTime(-10)}
                      className="text-white hover:text-primary transition-colors"
                      aria-label="Rewind 10 seconds"
                    >
                      <ReplayIcon className="w-6 h-6" />
                    </button>
                    
                    <button 
                      onClick={() => skipTime(10)}
                      className="text-white hover:text-primary transition-colors"
                      aria-label="Forward 10 seconds"
                    >
                      <ForwardIcon className="w-6 h-6" />
                    </button>
                  </>
                )}
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={toggleMute}
                    className="text-white hover:text-primary transition-colors"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeMuteIcon className="w-6 h-6" />
                    ) : (
                      <VolumeHighIcon className="w-6 h-6" />
                    )}
                  </button>
                  
                  <div className="relative w-20 h-1 bg-white/30 rounded-full overflow-hidden group">
                    <div 
                      className="absolute top-0 left-0 h-full bg-white rounded-full"
                      style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        const player = playerRef.current;
                        if (player) {
                          const value = parseFloat(e.target.value);
                          player.volume = value;
                          if (value > 0 && player.muted) {
                            player.muted = false;
                          }
                        }
                      }}
                      className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
                
                <div className="text-white text-sm">
                  {type === 'live' ? (
                    <span>LIVE</span>
                  ) : (
                    <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {subtitles && subtitles.length > 0 && (
                  <button 
                    className="text-white hover:text-primary transition-colors"
                    aria-label="Subtitles"
                  >
                    <ClosedCaptionsIcon className="w-6 h-6" />
                  </button>
                )}
                
                <button 
                  className="text-white hover:text-primary transition-colors"
                  aria-label="Settings"
                >
                  <SettingsMenuIcon className="w-6 h-6" />
                </button>
                
                <button 
                  onClick={toggleFullscreen}
                  className="text-white hover:text-primary transition-colors"
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? (
                    <FullscreenExitIcon className="w-6 h-6" />
                  ) : (
                    <FullscreenIcon className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Next episode prompt */}
        {showNextEpisodePrompt && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-24 right-4 bg-black/80 text-white p-4 rounded-md z-20 pointer-events-auto"
          >
            <p className="mb-2">Next episode starting in {Math.floor(duration - currentTime)} seconds</p>
            <div className="flex space-x-2">
              <button 
                onClick={handleNextEpisode}
                className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/80 transition-colors"
              >
                <span>Play Next</span>
                <SkipNextIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowNextEpisodePrompt(false)}
                className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </MediaPlayer>
    </div>
  );
};

export default ModernVidstackPlayer;
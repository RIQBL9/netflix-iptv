import { useEffect, useRef } from 'react';
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  useMediaState,
  useMediaStore,
  MediaPlayerInstance,
  MediaControls,
  MediaControlBar,
  PlayButton,
  MuteButton,
  FullscreenButton,
  TimeSlider,
  VolumeSlider,
  SettingsButton,
  SettingsMenu,
  QualitySubmenu,
  SettingsPanelProps,
  SettingsPanel,
  SettingsMenuButton,
  TimeProgress,
  CaptionButton,
  PIPButton,
} from '@vidstack/react';
import '@vidstack/react/player/styles/default.css';
import { motion } from 'framer-motion';

interface EnhancedVidstackPlayerProps {
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

const EnhancedVidstackPlayer = ({ 
  src, 
  title, 
  type,
  poster, 
  autoPlay = true,
  onTimeUpdate,
  onBack,
  startPosition = 0,
  nextEpisodeCallback
}: EnhancedVidstackPlayerProps) => {
  const playerRef = useRef<MediaPlayerInstance>(null);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    // Set up event listeners
    const handleTimeUpdate = () => {
      if (onTimeUpdate) {
        onTimeUpdate(player.currentTime, player.duration);
      }
      
      // Check if we're near the end of the video for series
      if (
        type === 'series' && 
        nextEpisodeCallback && 
        player.duration > 0 && 
        player.currentTime > player.duration - 20
      ) {
        // Trigger next episode logic
        nextEpisodeCallback();
      }
    };

    player.addEventListener('timeupdate', handleTimeUpdate);

    // Set start time if provided
    if (startPosition > 0 && type !== 'live') {
      player.addEventListener('loadedmetadata', () => {
        player.currentTime = startPosition;
      }, { once: true });
    }

    return () => {
      player.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [onTimeUpdate, startPosition, type, nextEpisodeCallback]);

  return (
    <motion.div 
      className="w-full h-full bg-black rounded-lg overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <MediaPlayer
        ref={playerRef}
        title={title}
        src={src}
        autoplay={autoPlay}
        className="w-full aspect-video"
      >
        <MediaProvider />
        {poster && <Poster src={poster} alt={title || 'Video poster'} />}
        
        <MediaControls className="media-controls:opacity-0 media-controls:hover:opacity-100 transition-opacity duration-300">
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4">
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
          </div>
          
          <MediaControlBar className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <PlayButton className="text-white hover:text-primary transition-colors" />
            <MuteButton className="text-white hover:text-primary transition-colors" />
            <VolumeSlider className="mx-2" />
            <TimeProgress className="text-white mx-2" />
            <TimeSlider className="group relative mx-2" />
            <CaptionButton className="text-white hover:text-primary transition-colors" />
            <PIPButton className="text-white hover:text-primary transition-colors" />
            <SettingsButton className="text-white hover:text-primary transition-colors" />
            <FullscreenButton className="text-white hover:text-primary transition-colors" />
          </MediaControlBar>
          
          <SettingsMenu className="bg-background-dark border border-gray-700 rounded-md shadow-xl">
            <SettingsMenuButton label="Quality">
              <QualitySubmenu />
            </SettingsMenuButton>
            <SettingsMenuButton label="Playback Speed">
              <SpeedSubmenu />
            </SettingsMenuButton>
          </SettingsMenu>
        </MediaControls>
      </MediaPlayer>
    </motion.div>
  );
};

// Custom Speed Submenu
function SpeedSubmenu({ placement }: SettingsPanelProps) {
  const player = useMediaStore();
  const playbackRate = useMediaState('playbackRate');
  
  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  
  return (
    <SettingsPanel placement={placement} className="w-[200px]">
      {speeds.map((speed) => (
        <button
          key={speed}
          className={`w-full p-2.5 text-left ${
            playbackRate === speed ? 'bg-primary text-white' : 'text-white hover:bg-gray-700'
          }`}
          onClick={() => player.playbackRate = speed}
        >
          {speed === 1 ? 'Normal' : `${speed}x`}
        </button>
      ))}
    </SettingsPanel>
  );
}

export default EnhancedVidstackPlayer;
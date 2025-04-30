import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useContentStore, SeriesInfo } from '../store/contentStore';
import { useSettingsStore } from '../store/settingsStore';
import ModernVidstackPlayer from '../components/player/vidstack/ModernVidstackPlayer';
import { getStreamUrl } from '../api/xtreamApi';
import { motion } from 'framer-motion';

const PlayerPage = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  
  const { serverUrl, user } = useAuthStore();
  const { 
    allLiveStreams, 
    allVodStreams, 
    allSeries,
    seriesInfo,
    fetchSeriesDetails
  } = useContentStore();
  const { updateWatchHistory, getWatchPosition } = useSettingsStore();
  
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [contentTitle, setContentTitle] = useState<string>('');
  const [startPosition, setStartPosition] = useState<number>(0);
  const [currentSeriesInfo, setCurrentSeriesInfo] = useState<SeriesInfo | null>(null);
  const [currentSeason, setCurrentSeason] = useState<number>(1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get content details and stream URL
  useEffect(() => {
    const initializePlayer = async () => {
      if (!serverUrl || !user || !type || !id) {
        setError('Missing required information');
        setLoading(false);
        return;
      }
      
      try {
        let contentId = parseInt(id);
        let containerExtension = 'm3u8';
        
        // Get content details based on type
        if (type === 'live') {
          const stream = allLiveStreams.find(s => s.stream_id === contentId);
          if (stream) {
            setContentTitle(stream.name);
          }
        } else if (type === 'movie') {
          const stream = allVodStreams.find(s => s.stream_id === contentId);
          if (stream) {
            setContentTitle(stream.name);
            containerExtension = stream.container_extension || 'm3u8';
            
            // Get watch position if available
            const position = getWatchPosition(contentId.toString());
            if (position !== null) {
              setStartPosition(position);
            }
          }
        } else if (type === 'series') {
          // For series, we need to handle seasons and episodes
          // Check if we have series info already
          let seriesData = seriesInfo[contentId];
          
          if (!seriesData) {
            // Fetch series info if not available
            seriesData = await fetchSeriesDetails(serverUrl, user.username, user.password, contentId);
          }
          
          if (seriesData) {
            setCurrentSeriesInfo(seriesData);
            setContentTitle(seriesData.info.name);
            
            // Get the first season and episode by default
            const seasons = Object.keys(seriesData.episodes);
            if (seasons.length > 0) {
              const firstSeason = parseInt(seasons[0]);
              setCurrentSeason(firstSeason);
              
              if (seriesData.episodes[firstSeason] && seriesData.episodes[firstSeason].length > 0) {
                setCurrentEpisode(1);
                
                // Get episode stream ID
                const episodeId = seriesData.episodes[firstSeason][0].id;
                contentId = parseInt(episodeId);
                containerExtension = seriesData.episodes[firstSeason][0].container_extension || 'm3u8';
                
                // Get watch position if available
                const position = getWatchPosition(`${id}_${firstSeason}_1`);
                if (position !== null) {
                  setStartPosition(position);
                }
              }
            }
          }
        }
        
        // Generate stream URL
        const url = getStreamUrl(
          serverUrl,
          user.username,
          user.password,
          contentId,
          type === 'live' ? 'live' : type === 'movie' ? 'movie' : 'series',
          containerExtension
        );
        
        setStreamUrl(url);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing player:', error);
        setError('Failed to load content');
        setLoading(false);
      }
    };
    
    initializePlayer();
  }, [
    serverUrl, 
    user, 
    type, 
    id, 
    allLiveStreams, 
    allVodStreams, 
    allSeries,
    seriesInfo,
    fetchSeriesDetails,
    getWatchPosition
  ]);
  
  // Handle time updates for watch history
  const handleTimeUpdate = (currentTime: number, duration: number) => {
    if (!type || !id || type === 'live') return;
    
    // For movies, use the content ID directly
    if (type === 'movie') {
      updateWatchHistory(id, 'vod', currentTime, duration);
    } 
    // For series, include season and episode info
    else if (type === 'series' && currentSeriesInfo) {
      updateWatchHistory(
        `${id}_${currentSeason}_${currentEpisode}`,
        'series',
        currentTime,
        duration,
        {
          seriesId: parseInt(id),
          season: currentSeason,
          episode: currentEpisode,
        }
      );
    }
  };
  
  // Handle navigation back
  const handleBack = () => {
    navigate(-1);
  };
  
  // Handle playing next episode
  const playNextEpisode = () => {
    if (!currentSeriesInfo || !type || type !== 'series') return;
    
    const seasons = Object.keys(currentSeriesInfo.episodes).map(Number).sort((a, b) => a - b);
    const currentSeasonEpisodes = currentSeriesInfo.episodes[currentSeason] || [];
    
    // If there are more episodes in the current season
    if (currentEpisode < currentSeasonEpisodes.length) {
      setCurrentEpisode(currentEpisode + 1);
      
      const nextEpisode = currentSeasonEpisodes[currentEpisode];
      if (nextEpisode) {
        const episodeId = nextEpisode.id;
        const containerExtension = nextEpisode.container_extension || 'm3u8';
        
        const url = getStreamUrl(
          serverUrl!,
          user!.username,
          user!.password,
          parseInt(episodeId),
          'series',
          containerExtension
        );
        
        setStreamUrl(url);
        setStartPosition(0);
      }
    } 
    // If there's a next season
    else {
      const currentSeasonIndex = seasons.indexOf(currentSeason);
      if (currentSeasonIndex < seasons.length - 1) {
        const nextSeason = seasons[currentSeasonIndex + 1];
        setCurrentSeason(nextSeason);
        setCurrentEpisode(1);
        
        const nextSeasonEpisodes = currentSeriesInfo.episodes[nextSeason] || [];
        if (nextSeasonEpisodes.length > 0) {
          const episodeId = nextSeasonEpisodes[0].id;
          const containerExtension = nextSeasonEpisodes[0].container_extension || 'm3u8';
          
          const url = getStreamUrl(
            serverUrl!,
            user!.username,
            user!.password,
            parseInt(episodeId),
            'series',
            containerExtension
          );
          
          setStreamUrl(url);
          setStartPosition(0);
        }
      }
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center min-h-screen bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p 
          className="mt-4 text-text-secondary"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Loading content...
        </motion.p>
      </motion.div>
    );
  }
  
  // Error state
  if (error || !streamUrl) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center min-h-screen bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="text-red-500 text-xl mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Error: {error || 'Failed to load stream'}
        </motion.div>
        <motion.button 
          onClick={handleBack} 
          className="px-6 py-2 bg-primary text-white rounded hover:bg-primary/80 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Go Back
        </motion.button>
      </motion.div>
    );
  }
  
  // Episode title for series
  const getEpisodeTitle = () => {
    if (type !== 'series' || !currentSeriesInfo) return contentTitle;
    
    const episodes = currentSeriesInfo.episodes[currentSeason] || [];
    const episode = episodes[currentEpisode - 1];
    
    if (episode && episode.title) {
      return `${contentTitle} - S${currentSeason}E${currentEpisode} - ${episode.title}`;
    }
    
    return `${contentTitle} - S${currentSeason}E${currentEpisode}`;
  };
  
  return (
    <motion.div 
      className="min-h-screen bg-black flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-screen-xl">
        {/* Use the ModernVidstackPlayer component for better HLS support */}
        <ModernVidstackPlayer
          src={streamUrl}
          title={getEpisodeTitle()}
          type={type as 'live' | 'movie' | 'series'}
          onTimeUpdate={handleTimeUpdate}
          onBack={handleBack}
          startPosition={startPosition}
          nextEpisodeCallback={type === 'series' ? playNextEpisode : undefined}
        />
      </div>
    </motion.div>
  );
};

export default PlayerPage;
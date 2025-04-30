import { useState, useEffect } from 'react';

import { motion } from 'framer-motion';
import { FaStar, FaPlay, FaHeart } from 'react-icons/fa';
import { useContentStore, LiveStream, VodStream, Series } from '../../store/contentStore';
import { useSettingsStore } from '../../store/settingsStore';
import { getShortEpg } from '../../api/xtreamApi';
import { useAuthStore } from '../../store/authStore';

interface ContentCardProps {
  item: LiveStream | VodStream | Series;
  type: 'live' | 'movie' | 'series';
  onClick?: () => void;
}

const ContentCard = ({ item, type, onClick }: ContentCardProps) => {
  const { serverUrl, user } = useAuthStore();
  const { tmdbDetails, fetchTmdbData } = useContentStore();
  const { isFavorite, addToFavorites, removeFromFavorites, watchHistory } = useSettingsStore();
  
  const [currentProgram, setCurrentProgram] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Get the appropriate ID based on content type
  const getContentId = () => {
    if (type === 'live') {
      return (item as LiveStream).stream_id;
    } else if (type === 'movie') {
      return (item as VodStream).stream_id;
    } else {
      return (item as Series).series_id;
    }
  };
  
  const contentId = getContentId();
  
  // Get TMDB details if available
  const getTmdbDetails = () => {
    if (type === 'movie') {
      return tmdbDetails.movie[contentId.toString()];
    } else if (type === 'series') {
      return tmdbDetails.tv[contentId.toString()];
    }
    return null;
  };
  
  const tmdbData = getTmdbDetails();
  
  // Get image URL (from TMDB if available, otherwise from Xtream)
  const getImageUrl = () => {
    if (tmdbData && tmdbData.poster_path) {
      return tmdbData.poster_path;
    }
    
    if (type === 'live') {
      return (item as LiveStream).stream_icon;
    } else if (type === 'movie') {
      return (item as VodStream).stream_icon;
    } else {
      return (item as Series).cover;
    }
  };
  
  // Check if this content is a favorite
  const favorite = isFavorite(
    type === 'live' ? 'live' : type === 'movie' ? 'vod' : 'series',
    contentId
  );
  
  // Toggle favorite status
  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const contentType = type === 'live' ? 'live' : type === 'movie' ? 'vod' : 'series';
    
    if (favorite) {
      removeFromFavorites(contentType, contentId);
    } else {
      addToFavorites(contentType, contentId);
    }
  };
  
  // Get watch progress for movies and series
  const getWatchProgress = () => {
    const historyKey = type === 'movie' 
      ? contentId.toString() 
      : type === 'series' && 'seriesInfo' in item 
        ? `${contentId}_${item.seriesInfo?.season}_${item.seriesInfo?.episode}` 
        : null;
    
    if (!historyKey) return null;
    
    const historyItem = watchHistory[historyKey];
    if (!historyItem) return null;
    
    return {
      position: historyItem.position,
      duration: historyItem.duration,
      progress: historyItem.position / historyItem.duration,
    };
  };
  
  const watchProgress = getWatchProgress();
  
  // Fetch EPG data for live TV
  useEffect(() => {
    if (type === 'live' && serverUrl && user) {
      const fetchEpg = async () => {
        try {
          const epgData = await getShortEpg(
            serverUrl,
            user.username,
            user.password,
            contentId,
            1
          );
          
          if (epgData && epgData.epg_listings && epgData.epg_listings.length > 0) {
            setCurrentProgram(epgData.epg_listings[0].title);
          }
        } catch (error) {
          console.error('Error fetching EPG:', error);
        }
      };
      
      fetchEpg();
    }
  }, [type, contentId, serverUrl, user]);
  
  // Fetch TMDB data if not already available
  useEffect(() => {
    if ((type === 'movie' || type === 'series') && !tmdbData) {
      const fetchData = async () => {
        const title = type === 'movie' 
          ? (item as VodStream).name 
          : (item as Series).name;
        
        await fetchTmdbData(
          type === 'movie' ? 'movie' : 'tv',
          contentId.toString(),
          title
        );
      };
      
      fetchData();
    }
  }, [type, contentId, item, tmdbData, fetchTmdbData]);
  
  return (
    <div
      className="block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick || (() => window.location.href = `/player/${type}/${contentId}`)}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="content-card bg-gray-800 rounded-md overflow-hidden shadow-lg"
      >
        {/* Image */}
        <div className="relative aspect-[2/3]">
          <img
            src={getImageUrl()}
            alt={
              type === 'live'
                ? (item as LiveStream).name
                : type === 'movie'
                ? (item as VodStream).name
                : (item as Series).name
            }
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=No+Image';
            }}
          />
          
          {/* Overlay on hover */}
          {isHovered && (
            <div className="absolute inset-0 bg-black/70 flex flex-col justify-between p-3">
              <div className="flex justify-end">
                <button
                  onClick={toggleFavorite}
                  className={`p-2 rounded-full ${
                    favorite ? 'text-primary' : 'text-white'
                  }`}
                >
                  <FaHeart />
                </button>
              </div>
              
              <div>
                <h3 className="text-white font-bold truncate">
                  {type === 'live'
                    ? (item as LiveStream).name
                    : type === 'movie'
                    ? (item as VodStream).name
                    : (item as Series).name}
                </h3>
                
                {tmdbData && (
                  <div className="flex items-center mt-1">
                    <FaStar className="text-yellow-500 mr-1" />
                    <span className="text-white text-sm">
                      {tmdbData.vote_average.toFixed(1)}
                    </span>
                  </div>
                )}
                
                <div className="mt-2">
                  <button className="btn-primary text-sm py-1 px-3 flex items-center">
                    <FaPlay className="mr-1" size={12} />
                    {type === 'live' ? 'Watch' : 'Play'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Watch progress indicator */}
          {watchProgress && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
              <div
                className="h-full bg-primary"
                style={{ width: `${watchProgress.progress * 100}%` }}
              ></div>
            </div>
          )}
          
          {/* Live indicator for TV channels */}
          {type === 'live' && (
            <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
              LIVE
            </div>
          )}
        </div>
        
        {/* Content info */}
        <div className="p-2">
          <h3 className="text-white font-medium text-sm truncate">
            {type === 'live'
              ? (item as LiveStream).name
              : type === 'movie'
              ? (item as VodStream).name
              : (item as Series).name}
          </h3>
          
          {type === 'live' && currentProgram && (
            <p className="text-text-secondary text-xs truncate mt-1">
              {currentProgram}
            </p>
          )}
          
          {type === 'movie' && tmdbData && tmdbData.release_date && (
            <p className="text-text-secondary text-xs mt-1">
              {new Date(tmdbData.release_date).getFullYear()}
            </p>
          )}
          
          {type === 'series' && tmdbData && tmdbData.first_air_date && (
            <p className="text-text-secondary text-xs mt-1">
              {new Date(tmdbData.first_air_date).getFullYear()}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ContentCard;
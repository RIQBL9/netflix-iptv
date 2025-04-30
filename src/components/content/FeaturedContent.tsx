import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlay, FaInfoCircle, FaStar } from 'react-icons/fa';
import { useContentStore, VodStream, Series } from '../../store/contentStore';

interface FeaturedContentProps {
  content: VodStream | Series;
  type: 'movie' | 'series';
}

const FeaturedContent = ({ content, type }: FeaturedContentProps) => {
  const { tmdbDetails, fetchTmdbData } = useContentStore();
  
  const contentId = type === 'movie' 
    ? (content as VodStream).stream_id 
    : (content as Series).series_id;
  
  const tmdbData = type === 'movie' 
    ? tmdbDetails.movie[contentId.toString()] 
    : tmdbDetails.tv[contentId.toString()];
  
  // Fetch TMDB data if not already available
  useEffect(() => {
    if (!tmdbData) {
      fetchTmdbData(
        type,
        contentId.toString(),
        content.name
      );
    }
  }, [type, contentId, content.name, tmdbData, fetchTmdbData]);
  
  // Get backdrop image
  const getBackdropUrl = () => {
    if (tmdbData && tmdbData.backdrop_path) {
      return tmdbData.backdrop_path;
    }
    
    // Fallback to content image
    if (type === 'movie') {
      return (content as VodStream).stream_icon;
    } else {
      return (content as Series).cover;
    }
  };
  
  // Get genres as string
  const getGenres = () => {
    if (tmdbData && tmdbData.genres) {
      return tmdbData.genres.slice(0, 3).map(g => g.name).join(' • ');
    }
    
    if (type === 'series' && (content as Series).genre) {
      return (content as Series).genre;
    }
    
    return '';
  };
  
  // Get release year
  const getReleaseYear = () => {
    if (tmdbData) {
      const date = tmdbData.release_date || tmdbData.first_air_date;
      return date ? new Date(date).getFullYear() : '';
    }
    
    if (type === 'series' && (content as Series).release_date) {
      return new Date((content as Series).release_date).getFullYear();
    }
    
    return '';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative rounded-xl overflow-hidden mb-8"
      style={{ height: '500px' }}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={getBackdropUrl()}
          alt={content.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1920x1080?text=No+Backdrop';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            {content.name}
          </h1>
          
          <div className="flex items-center text-text-secondary mb-4 text-sm">
            {getReleaseYear() && (
              <span className="mr-3">{getReleaseYear()}</span>
            )}
            
            {tmdbData && tmdbData.vote_average > 0 && (
              <span className="flex items-center mr-3">
                <FaStar className="text-yellow-500 mr-1" />
                {tmdbData.vote_average.toFixed(1)}
              </span>
            )}
            
            {getGenres() && (
              <span>{getGenres()}</span>
            )}
          </div>
          
          <p className="text-text-secondary max-w-xl mb-6 line-clamp-3">
            {tmdbData?.overview || 
              (type === 'series' ? (content as Series).plot : '')}
          </p>
          
          <div className="flex space-x-4">
            <Link
              to={`/player/${type}/${contentId}`}
              className="btn-primary flex items-center"
            >
              <FaPlay className="mr-2" />
              {type === 'movie' ? 'Watch Movie' : 'Watch Series'}
            </Link>
            
            <Link
              to={`/${type === 'movie' ? 'movies' : 'series'}/details/${contentId}`}
              className="btn-secondary flex items-center"
            >
              <FaInfoCircle className="mr-2" />
              More Info
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default FeaturedContent;
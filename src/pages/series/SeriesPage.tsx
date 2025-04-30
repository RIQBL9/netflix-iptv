import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useContentStore } from '@/store/contentStore';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { FiHeart, FiSearch, FiFilter, FiInfo, FiPlay } from 'react-icons/fi';

const SeriesPage = () => {
  const { 
    seriesCategories, 
    seriesList, 
    allSeries, 
    isLoadingSeries, 
    fetchTmdbData, 
    tmdbDetails,
    fetchSeriesDetails,
    seriesInfo
  } = useContentStore();
  const { serverUrl, user } = useAuthStore();
  const { isFavorite, addToFavorites, removeFromFavorites } = useSettingsStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSeries, setFilteredSeries] = useState<any[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Filter series based on category and search query
  useEffect(() => {
    let series = selectedCategory 
      ? seriesList[selectedCategory] || []
      : allSeries;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      series = series.filter(s => 
        s.name.toLowerCase().includes(query)
      );
    }
    
    setFilteredSeries(series);
  }, [selectedCategory, searchQuery, seriesList, allSeries]);
  
  const handleToggleFavorite = (e: React.MouseEvent, seriesId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isFavorite('series', seriesId)) {
      removeFromFavorites('series', seriesId);
    } else {
      addToFavorites('series', seriesId);
    }
  };
  
  const handleShowDetails = async (e: React.MouseEvent, series: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedSeries(series);
    setShowDetails(true);
    setSelectedSeason(null);
    setIsLoadingDetails(true);
    
    try {
      // Fetch TMDB data if not already available
      if (!tmdbDetails.tv[series.series_id]) {
        await fetchTmdbData('tv', series.series_id.toString(), series.name);
      }
      
      // Fetch series details if not already available
      if (!seriesInfo[series.series_id] && serverUrl && user) {
        await fetchSeriesDetails(
          serverUrl,
          user.username,
          user.password,
          series.series_id
        );
      }
      
      // Set first season as selected by default
      if (seriesInfo[series.series_id]) {
        const seasons = Object.keys(seriesInfo[series.series_id].episodes);
        if (seasons.length > 0) {
          setSelectedSeason(seasons[0]);
        }
      }
    } catch (error) {
      console.error('Error loading series details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };
  
  // Loading state
  if (isLoadingSeries) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="spinner mb-4"></div>
        <p className="text-text-secondary">Loading series...</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">TV Series</h1>
        
        {/* Search and filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search series..."
              className="input-field pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <select
              className="input-field pr-10 appearance-none"
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
            >
              <option value="">All Categories</option>
              {seriesCategories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </option>
              ))}
            </select>
            <FiFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
        
        {/* Series grid */}
        {filteredSeries.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredSeries.map((series) => (
              <motion.div
                key={series.series_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="content-card"
              >
                <div
                  onClick={(e) => handleShowDetails(e, series)}
                  className="block cursor-pointer"
                >
                  <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-gray-800">
                    {series.cover ? (
                      <img
                        src={series.cover}
                        alt={series.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=No+Poster';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-500">
                        No Poster
                      </div>
                    )}
                    
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-60 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => handleToggleFavorite(e, series.series_id)}
                          className={`p-2 rounded-full bg-gray-800 ${
                            isFavorite('series', series.series_id)
                              ? 'text-primary'
                              : 'text-white'
                          }`}
                        >
                          <FiHeart size={16} />
                        </button>
                        <button
                          onClick={(e) => handleShowDetails(e, series)}
                          className="p-2 rounded-full bg-gray-800 text-white"
                        >
                          <FiInfo size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="mt-2 text-sm font-medium truncate">{series.name}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-text-secondary">No series found</p>
            {searchQuery && (
              <button
                className="mt-4 text-primary hover:underline"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Series details modal */}
      {showDetails && selectedSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-80"
            onClick={() => setShowDetails(false)}
          ></div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg overflow-hidden w-full max-w-5xl z-10 relative max-h-[90vh] overflow-y-auto"
          >
            <button
              className="absolute top-4 right-4 text-white p-2 rounded-full bg-gray-800 hover:bg-gray-700 z-10"
              onClick={() => setShowDetails(false)}
            >
              ✕
            </button>
            
            {/* Background image */}
            {tmdbDetails.tv[selectedSeries.series_id]?.backdrop_path && (
              <div className="absolute inset-0 opacity-20">
                <img
                  src={tmdbDetails.tv[selectedSeries.series_id].backdrop_path}
                  alt={selectedSeries.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
              </div>
            )}
            
            <div className="flex flex-col md:flex-row relative z-1">
              {/* Poster */}
              <div className="md:w-1/3 p-4">
                <div className="aspect-[2/3] rounded-md overflow-hidden bg-gray-800">
                  {tmdbDetails.tv[selectedSeries.series_id]?.poster_path ? (
                    <img
                      src={tmdbDetails.tv[selectedSeries.series_id].poster_path}
                      alt={selectedSeries.name}
                      className="w-full h-full object-cover"
                    />
                  ) : selectedSeries.cover ? (
                    <img
                      src={selectedSeries.cover}
                      alt={selectedSeries.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-500">
                      No Poster
                    </div>
                  )}
                </div>
                
                <button
                  onClick={(e) => handleToggleFavorite(e, selectedSeries.series_id)}
                  className={`mt-4 btn-secondary w-full flex items-center justify-center ${
                    isFavorite('series', selectedSeries.series_id) ? 'text-primary' : ''
                  }`}
                >
                  <FiHeart className="mr-2" />
                  {isFavorite('series', selectedSeries.series_id) ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>
              </div>
              
              {/* Details */}
              <div className="md:w-2/3 p-6">
                <h2 className="text-2xl font-bold mb-2">{selectedSeries.name}</h2>
                
                {isLoadingDetails ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center mb-4">
                      {tmdbDetails.tv[selectedSeries.series_id]?.vote_average && (
                        <div className="bg-primary px-2 py-1 rounded text-sm mr-3">
                          ★ {tmdbDetails.tv[selectedSeries.series_id].vote_average.toFixed(1)}
                        </div>
                      )}
                      
                      {selectedSeries.release_date && (
                        <span className="text-text-secondary text-sm">
                          {selectedSeries.release_date}
                        </span>
                      )}
                      
                      {selectedSeries.genre && (
                        <span className="text-text-secondary text-sm ml-3">
                          {selectedSeries.genre}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-text-secondary mb-6">
                      {tmdbDetails.tv[selectedSeries.series_id]?.overview || selectedSeries.plot || 'No description available.'}
                    </p>
                    
                    {/* Seasons and episodes */}
                    {seriesInfo[selectedSeries.series_id] && (
                      <div>
                        <div className="mb-4">
                          <h3 className="text-lg font-medium mb-2">Seasons</h3>
                          <div className="flex flex-wrap gap-2">
                            {Object.keys(seriesInfo[selectedSeries.series_id].episodes).map((season) => (
                              <button
                                key={season}
                                onClick={() => setSelectedSeason(season)}
                                className={`px-3 py-1 rounded-md text-sm ${
                                  selectedSeason === season
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-800 text-text-secondary hover:bg-gray-700'
                                }`}
                              >
                                Season {season}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {selectedSeason && (
                          <div>
                            <h3 className="text-lg font-medium mb-2">Episodes</h3>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                              {seriesInfo[selectedSeries.series_id].episodes[selectedSeason].map((episode) => (
                                <Link
                                  key={episode.id}
                                  to={`/player/series/${episode.id}`}
                                  className="flex items-center p-3 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
                                >
                                  <div className="w-16 h-16 bg-gray-700 rounded overflow-hidden mr-3 flex-shrink-0">
                                    {episode.info?.movie_image ? (
                                      <img
                                        src={episode.info.movie_image}
                                        alt={episode.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                                        {episode.episode_num}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex-1">
                                    <h4 className="font-medium">
                                      {episode.episode_num}. {episode.title}
                                    </h4>
                                    {episode.info?.duration && (
                                      <p className="text-sm text-text-secondary">
                                        {episode.info.duration}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <FiPlay className="text-primary ml-2" />
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SeriesPage;
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useContentStore } from '@/store/contentStore';
import { useSettingsStore } from '@/store/settingsStore';
import { FiHeart, FiSearch, FiFilter, FiInfo } from 'react-icons/fi';

const MoviesPage = () => {
  const { vodCategories, vodStreams, allVodStreams, isLoadingVod, fetchTmdbData, tmdbDetails } = useContentStore();
  const { isFavorite, addToFavorites, removeFromFavorites } = useSettingsStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMovies, setFilteredMovies] = useState<any[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Filter movies based on category and search query
  useEffect(() => {
    let movies = selectedCategory 
      ? vodStreams[selectedCategory] || []
      : allVodStreams;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      movies = movies.filter(movie => 
        movie.name.toLowerCase().includes(query)
      );
    }
    
    setFilteredMovies(movies);
  }, [selectedCategory, searchQuery, vodStreams, allVodStreams]);
  
  const handleToggleFavorite = (e: React.MouseEvent, streamId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isFavorite('vod', streamId)) {
      removeFromFavorites('vod', streamId);
    } else {
      addToFavorites('vod', streamId);
    }
  };
  
  const handleShowDetails = async (e: React.MouseEvent, movie: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedMovie(movie);
    setShowDetails(true);
    
    // Fetch TMDB data if not already available
    if (!tmdbDetails.movie[movie.stream_id]) {
      await fetchTmdbData('movie', movie.stream_id.toString(), movie.name);
    }
  };
  
  // Loading state
  if (isLoadingVod) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="spinner mb-4"></div>
        <p className="text-text-secondary">Loading movies...</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Movies</h1>
        
        {/* Search and filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search movies..."
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
              {vodCategories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </option>
              ))}
            </select>
            <FiFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
        
        {/* Movies grid */}
        {filteredMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredMovies.map((movie) => (
              <motion.div
                key={movie.stream_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="content-card"
              >
                <Link
                  to={`/player/vod/${movie.stream_id}`}
                  className="block"
                >
                  <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-gray-800">
                    {movie.stream_icon ? (
                      <img
                        src={movie.stream_icon}
                        alt={movie.name}
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
                          onClick={(e) => handleToggleFavorite(e, movie.stream_id)}
                          className={`p-2 rounded-full bg-gray-800 ${
                            isFavorite('vod', movie.stream_id)
                              ? 'text-primary'
                              : 'text-white'
                          }`}
                        >
                          <FiHeart size={16} />
                        </button>
                        <button
                          onClick={(e) => handleShowDetails(e, movie)}
                          className="p-2 rounded-full bg-gray-800 text-white"
                        >
                          <FiInfo size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="mt-2 text-sm font-medium truncate">{movie.name}</h3>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-text-secondary">No movies found</p>
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
      
      {/* Movie details modal */}
      {showDetails && selectedMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-80"
            onClick={() => setShowDetails(false)}
          ></div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg overflow-hidden w-full max-w-4xl z-10 relative"
          >
            <button
              className="absolute top-4 right-4 text-white p-2 rounded-full bg-gray-800 hover:bg-gray-700"
              onClick={() => setShowDetails(false)}
            >
              ✕
            </button>
            
            <div className="flex flex-col md:flex-row">
              {/* Poster */}
              <div className="md:w-1/3 p-4">
                <div className="aspect-[2/3] rounded-md overflow-hidden bg-gray-800">
                  {tmdbDetails.movie[selectedMovie.stream_id]?.poster_path ? (
                    <img
                      src={tmdbDetails.movie[selectedMovie.stream_id].poster_path}
                      alt={selectedMovie.name}
                      className="w-full h-full object-cover"
                    />
                  ) : selectedMovie.stream_icon ? (
                    <img
                      src={selectedMovie.stream_icon}
                      alt={selectedMovie.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-500">
                      No Poster
                    </div>
                  )}
                </div>
              </div>
              
              {/* Details */}
              <div className="md:w-2/3 p-6">
                <h2 className="text-2xl font-bold mb-2">{selectedMovie.name}</h2>
                
                {tmdbDetails.movie[selectedMovie.stream_id] ? (
                  <>
                    <div className="flex items-center mb-4">
                      {tmdbDetails.movie[selectedMovie.stream_id].vote_average && (
                        <div className="bg-primary px-2 py-1 rounded text-sm mr-3">
                          ★ {tmdbDetails.movie[selectedMovie.stream_id].vote_average.toFixed(1)}
                        </div>
                      )}
                      
                      {tmdbDetails.movie[selectedMovie.stream_id].release_date && (
                        <span className="text-text-secondary text-sm">
                          {new Date(tmdbDetails.movie[selectedMovie.stream_id].release_date).getFullYear()}
                        </span>
                      )}
                      
                      {tmdbDetails.movie[selectedMovie.stream_id].genres && (
                        <span className="text-text-secondary text-sm ml-3">
                          {tmdbDetails.movie[selectedMovie.stream_id].genres.map(g => g.name).join(', ')}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-text-secondary mb-6">
                      {tmdbDetails.movie[selectedMovie.stream_id].overview || 'No description available.'}
                    </p>
                    
                    {tmdbDetails.movie[selectedMovie.stream_id].cast && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">Cast</h3>
                        <div className="flex flex-wrap gap-2">
                          {tmdbDetails.movie[selectedMovie.stream_id].cast.slice(0, 5).map((actor) => (
                            <div key={actor.id} className="text-sm text-text-secondary">
                              {actor.name} {actor.character && `as ${actor.character}`}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-text-secondary mb-6">Loading movie details...</p>
                )}
                
                <div className="flex space-x-4">
                  <Link
                    to={`/player/vod/${selectedMovie.stream_id}`}
                    className="btn-primary"
                  >
                    Watch Now
                  </Link>
                  
                  <button
                    onClick={(e) => handleToggleFavorite(e, selectedMovie.stream_id)}
                    className={`btn-secondary flex items-center ${
                      isFavorite('vod', selectedMovie.stream_id) ? 'text-primary' : ''
                    }`}
                  >
                    <FiHeart className="mr-2" />
                    {isFavorite('vod', selectedMovie.stream_id) ? 'Remove from Favorites' : 'Add to Favorites'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MoviesPage;
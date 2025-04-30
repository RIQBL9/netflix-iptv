import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useContentStore } from '@/store/contentStore';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { FiHeart, FiSearch, FiFilter } from 'react-icons/fi';
import { getShortEpg } from '@/api/xtreamApi';

const LiveTVPage = () => {
  const { liveCategories, liveStreams, allLiveStreams, isLoadingLive } = useContentStore();
  const { serverUrl, user } = useAuthStore();
  const { isFavorite, addToFavorites, removeFromFavorites } = useSettingsStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStreams, setFilteredStreams] = useState<any[]>([]);
  const [epgData, setEpgData] = useState<{ [streamId: number]: any }>({});
  const [isLoadingEpg, setIsLoadingEpg] = useState(false);
  
  // Filter streams based on category and search query
  useEffect(() => {
    let streams = selectedCategory 
      ? liveStreams[selectedCategory] || []
      : allLiveStreams;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      streams = streams.filter(stream => 
        stream.name.toLowerCase().includes(query)
      );
    }
    
    setFilteredStreams(streams);
    
    // Load EPG data for visible streams
    const loadEpgData = async () => {
      if (!serverUrl || !user) return;
      
      setIsLoadingEpg(true);
      
      try {
        const epgPromises = streams.slice(0, 20).map(async (stream) => {
          try {
            const epg = await getShortEpg(
              serverUrl, 
              user.username, 
              user.password, 
              stream.stream_id,
              1 // Just get current program
            );
            
            return { streamId: stream.stream_id, epg };
          } catch (error) {
            console.error(`Error fetching EPG for stream ${stream.stream_id}:`, error);
            return { streamId: stream.stream_id, epg: null };
          }
        });
        
        const results = await Promise.all(epgPromises);
        
        const newEpgData = results.reduce((acc, { streamId, epg }) => {
          if (epg && epg.epg_listings && epg.epg_listings.length > 0) {
            acc[streamId] = epg.epg_listings[0];
          }
          return acc;
        }, {});
        
        setEpgData(newEpgData);
      } catch (error) {
        console.error('Error fetching EPG data:', error);
      } finally {
        setIsLoadingEpg(false);
      }
    };
    
    loadEpgData();
  }, [selectedCategory, searchQuery, liveStreams, allLiveStreams, serverUrl, user]);
  
  const handleToggleFavorite = (e: React.MouseEvent, streamId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isFavorite('live', streamId)) {
      removeFromFavorites('live', streamId);
    } else {
      addToFavorites('live', streamId);
    }
  };
  
  // Loading state
  if (isLoadingLive) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="spinner mb-4"></div>
        <p className="text-text-secondary">Loading channels...</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Live TV</h1>
        
        {/* Search and filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search channels..."
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
              {liveCategories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </option>
              ))}
            </select>
            <FiFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
        
        {/* Channel grid */}
        {filteredStreams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStreams.map((stream) => (
              <motion.div
                key={stream.stream_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Link
                  to={`/player/live/${stream.stream_id}`}
                  className="block bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors"
                >
                  <div className="p-4 flex items-start">
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-800 rounded overflow-hidden mr-4">
                      {stream.stream_icon ? (
                        <img
                          src={stream.stream_icon}
                          alt={stream.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=TV';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-500">
                          TV
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium truncate">{stream.name}</h3>
                        <button
                          onClick={(e) => handleToggleFavorite(e, stream.stream_id)}
                          className={`ml-2 p-1 rounded-full ${
                            isFavorite('live', stream.stream_id)
                              ? 'text-primary'
                              : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          <FiHeart size={16} />
                        </button>
                      </div>
                      
                      {/* EPG info */}
                      {epgData[stream.stream_id] ? (
                        <div className="mt-1 text-sm text-text-secondary">
                          <p className="truncate">
                            {epgData[stream.stream_id].title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(epgData[stream.stream_id].start).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                            {' - '}
                            {new Date(epgData[stream.stream_id].end).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-1 text-sm text-gray-500">
                          {isLoadingEpg ? 'Loading program info...' : 'No program info available'}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-text-secondary">No channels found</p>
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
    </div>
  );
};

export default LiveTVPage;
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useContentStore } from '../store/contentStore';
import { useSettingsStore } from '../store/settingsStore';
import ContentRow from '../components/content/ContentRow';
import FeaturedContent from '../components/content/FeaturedContent';
import { LiveStream, VodStream, Series } from '../store/contentStore';

const HomePage = () => {
  const { user } = useAuthStore();
  const { 
    allLiveStreams, 
    allVodStreams, 
    allSeries,
    liveCategories,
    vodCategories,
    seriesCategories,
    isLoadingLive,
    isLoadingVod,
    isLoadingSeries,
    fetchTmdbData
  } = useContentStore();
  
  const { watchHistory, favorites } = useSettingsStore();
  
  const [featuredContent, setFeaturedContent] = useState<VodStream | Series | null>(null);
  const [featuredType, setFeaturedType] = useState<'movie' | 'series'>('movie');
  const [recentlyWatched, setRecentlyWatched] = useState<any[]>([]);
  
  // Prepare featured content
  useEffect(() => {
    const selectRandomFeatured = () => {
      // Randomly choose between movie or series for featured content
      const isFeaturedMovie = Math.random() > 0.5;
      
      if (isFeaturedMovie && allVodStreams.length > 0) {
        const randomIndex = Math.floor(Math.random() * allVodStreams.length);
        setFeaturedContent(allVodStreams[randomIndex]);
        setFeaturedType('movie');
        
        // Fetch TMDB data for the featured content
        if (allVodStreams[randomIndex]) {
          fetchTmdbData('movie', allVodStreams[randomIndex].stream_id.toString(), allVodStreams[randomIndex].name);
        }
      } else if (allSeries.length > 0) {
        const randomIndex = Math.floor(Math.random() * allSeries.length);
        setFeaturedContent(allSeries[randomIndex]);
        setFeaturedType('series');
        
        // Fetch TMDB data for the featured content
        if (allSeries[randomIndex]) {
          fetchTmdbData('tv', allSeries[randomIndex].series_id.toString(), allSeries[randomIndex].name);
        }
      }
    };
    
    if ((allVodStreams.length > 0 || allSeries.length > 0) && !featuredContent) {
      selectRandomFeatured();
    }
  }, [allVodStreams, allSeries, featuredContent, fetchTmdbData]);
  
  // Prepare recently watched content
  useEffect(() => {
    if (Object.keys(watchHistory).length > 0) {
      const recentItems: any[] = [];
      
      // Convert watchHistory object to array and sort by lastWatched timestamp
      const historyArray = Object.entries(watchHistory)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.lastWatched - a.lastWatched)
        .slice(0, 10); // Get only the 10 most recent items
      
      // Find the actual content items from the content store
      historyArray.forEach((item) => {
        if (item.type === 'live') {
          const stream = allLiveStreams.find((s) => s.stream_id.toString() === item.id);
          if (stream) recentItems.push({ ...stream, contentType: 'live' });
        } else if (item.type === 'vod') {
          const stream = allVodStreams.find((s) => s.stream_id.toString() === item.id);
          if (stream) recentItems.push({ ...stream, contentType: 'movie' });
        } else if (item.type === 'series' && item.seriesInfo) {
          const series = allSeries.find((s) => s.series_id.toString() === item.seriesInfo.seriesId.toString());
          if (series) {
            recentItems.push({
              ...series,
              contentType: 'series',
              season: item.seriesInfo.season,
              episode: item.seriesInfo.episode,
            });
          }
        }
      });
      
      setRecentlyWatched(recentItems);
    }
  }, [watchHistory, allLiveStreams, allVodStreams, allSeries]);
  
  // Get favorite content
  const getFavoriteContent = (type: 'live' | 'vod' | 'series') => {
    const favoriteIds = favorites[type];
    
    if (type === 'live') {
      return allLiveStreams.filter((stream) => favoriteIds.includes(stream.stream_id));
    } else if (type === 'vod') {
      return allVodStreams.filter((stream) => favoriteIds.includes(stream.stream_id));
    } else {
      return allSeries.filter((series) => favoriteIds.includes(series.series_id));
    }
  };
  
  // Loading state
  if (isLoadingLive || isLoadingVod || isLoadingSeries) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="spinner"></div>
        <p className="mt-4 text-text-secondary">Loading content...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Welcome message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold">
          Welcome back, <span className="text-primary">{user?.username}</span>
        </h1>
        {user?.exp_date && (
          <p className="text-text-secondary">
            Subscription valid until: {new Date(user.exp_date).toLocaleDateString()}
          </p>
        )}
      </motion.div>
      
      {/* Featured content */}
      {featuredContent && (
        <FeaturedContent 
          content={featuredContent} 
          type={featuredType} 
        />
      )}
      
      {/* Continue watching */}
      {recentlyWatched.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Continue Watching</h2>
          <ContentRow 
            items={recentlyWatched} 
            type="mixed" 
          />
        </section>
      )}
      
      {/* Favorites */}
      {favorites.live.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Favorite Channels</h2>
          <ContentRow 
            items={getFavoriteContent('live')} 
            type="live" 
          />
        </section>
      )}
      
      {favorites.vod.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Favorite Movies</h2>
          <ContentRow 
            items={getFavoriteContent('vod')} 
            type="movie" 
          />
        </section>
      )}
      
      {favorites.series.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Favorite Series</h2>
          <ContentRow 
            items={getFavoriteContent('series')} 
            type="series" 
          />
        </section>
      )}
      
      {/* Live TV categories */}
      {liveCategories.slice(0, 2).map((category) => (
        <section key={category.category_id} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{category.category_name}</h2>
            <Link to="/live" className="text-primary hover:underline">
              View All
            </Link>
          </div>
          <ContentRow 
            items={allLiveStreams.filter(stream => stream.category_id === category.category_id).slice(0, 10)} 
            type="live" 
          />
        </section>
      ))}
      
      {/* Movies categories */}
      {vodCategories.slice(0, 2).map((category) => (
        <section key={category.category_id} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{category.category_name}</h2>
            <Link to="/movies" className="text-primary hover:underline">
              View All
            </Link>
          </div>
          <ContentRow 
            items={allVodStreams.filter(stream => stream.category_id === category.category_id).slice(0, 10)} 
            type="movie" 
          />
        </section>
      ))}
      
      {/* Series categories */}
      {seriesCategories.slice(0, 2).map((category) => (
        <section key={category.category_id} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{category.category_name}</h2>
            <Link to="/series" className="text-primary hover:underline">
              View All
            </Link>
          </div>
          <ContentRow 
            items={allSeries.filter(series => series.category_id === category.category_id).slice(0, 10)} 
            type="series" 
          />
        </section>
      ))}
    </div>
  );
};

export default HomePage;
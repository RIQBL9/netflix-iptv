import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  getLiveCategories, 
  getLiveStreams, 
  getVodCategories, 
  getVodStreams, 
  getSeriesCategories, 
  getSeries,
  getSeriesInfo
} from '../api/xtreamApi';
import { fetchTmdbDetails } from '../api/tmdbApi';

// Types
export interface Category {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface LiveStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

export interface VodStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  added: string;
  category_id: string;
  container_extension: string;
  custom_sid: string;
  direct_source: string;
}

export interface Series {
  num: number;
  name: string;
  series_id: number;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  release_date: string;
  last_modified: string;
  rating: string;
  rating_5based: number;
  backdrop_path: string;
  youtube_trailer: string;
  episode_run_time: string;
  category_id: string;
}

export interface SeriesInfo {
  info: Series;
  episodes: {
    [seasonNumber: string]: {
      id: string;
      episode_num: number;
      title: string;
      container_extension: string;
      info: {
        movie_image: string;
        plot: string;
        duration_secs: number;
        duration: string;
      };
    }[];
  };
}

export interface TmdbDetails {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genres: { id: number; name: string }[];
  cast?: { id: number; name: string; character: string; profile_path: string }[];
}

interface ContentState {
  // Live TV
  liveCategories: Category[];
  liveStreams: { [categoryId: string]: LiveStream[] };
  allLiveStreams: LiveStream[];
  
  // VOD (Movies)
  vodCategories: Category[];
  vodStreams: { [categoryId: string]: VodStream[] };
  allVodStreams: VodStream[];
  
  // Series
  seriesCategories: Category[];
  seriesList: { [categoryId: string]: Series[] };
  allSeries: Series[];
  seriesInfo: { [seriesId: string]: SeriesInfo };
  
  // TMDB enriched data
  tmdbDetails: { [type: string]: { [id: string]: TmdbDetails } };
  
  // Loading states
  isLoadingLive: boolean;
  isLoadingVod: boolean;
  isLoadingSeries: boolean;
  
  // Actions
  fetchLiveContent: (serverUrl: string, username: string, password: string) => Promise<void>;
  fetchVodContent: (serverUrl: string, username: string, password: string) => Promise<void>;
  fetchSeriesContent: (serverUrl: string, username: string, password: string) => Promise<void>;
  fetchSeriesDetails: (serverUrl: string, username: string, password: string, seriesId: number) => Promise<SeriesInfo | null>;
  fetchTmdbData: (type: 'movie' | 'tv', id: string, title: string, year?: string) => Promise<TmdbDetails | null>;
  clearContent: () => void;
}

export const useContentStore = create<ContentState>()(
  persist(
    (set, get) => ({
      // Initial state
      liveCategories: [],
      liveStreams: {},
      allLiveStreams: [],
      
      vodCategories: [],
      vodStreams: {},
      allVodStreams: [],
      
      seriesCategories: [],
      seriesList: {},
      allSeries: [],
      seriesInfo: {},
      
      tmdbDetails: { movie: {}, tv: {} },
      
      isLoadingLive: false,
      isLoadingVod: false,
      isLoadingSeries: false,
      
      // Actions
      fetchLiveContent: async (serverUrl, username, password) => {
        set({ isLoadingLive: true });
        try {
          // Fetch live categories
          const categories = await getLiveCategories(serverUrl, username, password);
          
          // Fetch all live streams
          const streams = await getLiveStreams(serverUrl, username, password);
          
          // Organize streams by category
          const streamsByCategory: { [categoryId: string]: LiveStream[] } = {};
          
          if (streams && streams.length > 0) {
            streams.forEach((stream: LiveStream) => {
              if (!streamsByCategory[stream.category_id]) {
                streamsByCategory[stream.category_id] = [];
              }
              streamsByCategory[stream.category_id].push(stream);
            });
          }
          
          set({
            liveCategories: categories || [],
            liveStreams: streamsByCategory,
            allLiveStreams: streams || [],
            isLoadingLive: false,
          });
        } catch (error) {
          console.error('Error fetching live content:', error);
          set({ isLoadingLive: false });
        }
      },
      
      fetchVodContent: async (serverUrl, username, password) => {
        set({ isLoadingVod: true });
        try {
          // Fetch VOD categories
          const categories = await getVodCategories(serverUrl, username, password);
          
          // Fetch all VOD streams
          const streams = await getVodStreams(serverUrl, username, password);
          
          // Organize streams by category
          const streamsByCategory: { [categoryId: string]: VodStream[] } = {};
          
          if (streams && streams.length > 0) {
            streams.forEach((stream: VodStream) => {
              if (!streamsByCategory[stream.category_id]) {
                streamsByCategory[stream.category_id] = [];
              }
              streamsByCategory[stream.category_id].push(stream);
            });
          }
          
          set({
            vodCategories: categories || [],
            vodStreams: streamsByCategory,
            allVodStreams: streams || [],
            isLoadingVod: false,
          });
        } catch (error) {
          console.error('Error fetching VOD content:', error);
          set({ isLoadingVod: false });
        }
      },
      
      fetchSeriesContent: async (serverUrl, username, password) => {
        set({ isLoadingSeries: true });
        try {
          // Fetch series categories
          const categories = await getSeriesCategories(serverUrl, username, password);
          
          // Fetch all series
          const seriesList = await getSeries(serverUrl, username, password);
          
          // Organize series by category
          const seriesByCategory: { [categoryId: string]: Series[] } = {};
          
          if (seriesList && seriesList.length > 0) {
            seriesList.forEach((series: Series) => {
              if (!seriesByCategory[series.category_id]) {
                seriesByCategory[series.category_id] = [];
              }
              seriesByCategory[series.category_id].push(series);
            });
          }
          
          set({
            seriesCategories: categories || [],
            seriesList: seriesByCategory,
            allSeries: seriesList || [],
            isLoadingSeries: false,
          });
        } catch (error) {
          console.error('Error fetching series content:', error);
          set({ isLoadingSeries: false });
        }
      },
      
      fetchSeriesDetails: async (serverUrl, username, password, seriesId) => {
        try {
          const info = await getSeriesInfo(serverUrl, username, password, seriesId);
          
          if (info) {
            set((state) => ({
              seriesInfo: {
                ...state.seriesInfo,
                [seriesId]: info,
              },
            }));
            return info;
          }
          return null;
        } catch (error) {
          console.error(`Error fetching series info for ID ${seriesId}:`, error);
          return null;
        }
      },
      
      fetchTmdbData: async (type, id, title, year) => {
        try {
          const existingData = get().tmdbDetails[type][id];
          if (existingData) {
            return existingData;
          }
          
          const details = await fetchTmdbDetails(title, year, type);
          
          if (details) {
            set((state) => ({
              tmdbDetails: {
                ...state.tmdbDetails,
                [type]: {
                  ...state.tmdbDetails[type],
                  [id]: details,
                },
              },
            }));
            return details;
          }
          return null;
        } catch (error) {
          console.error(`Error fetching TMDB data for ${type} ${id}:`, error);
          return null;
        }
      },
      
      clearContent: () => {
        set({
          liveCategories: [],
          liveStreams: {},
          allLiveStreams: [],
          vodCategories: [],
          vodStreams: {},
          allVodStreams: [],
          seriesCategories: [],
          seriesList: {},
          allSeries: [],
          seriesInfo: {},
        });
      },
    }),
    {
      name: 'content-storage',
      partialize: (state) => ({
        // Only persist TMDB details to avoid storing too much data
        tmdbDetails: state.tmdbDetails,
      }),
    }
  )
);
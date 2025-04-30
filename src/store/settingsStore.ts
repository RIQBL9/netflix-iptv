import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeType = 'dark' | 'light';
export type VideoQuality = 'auto' | '480p' | '720p' | '1080p';
export type Language = 'en' | 'tr';

interface SettingsState {
  theme: ThemeType;
  parentalControlEnabled: boolean;
  parentalControlPin: string;
  interfaceLanguage: Language;
  preferredPlaybackLanguage: Language;
  videoQuality: VideoQuality;
  autoPlayNext: boolean;
  favorites: {
    live: number[];
    vod: number[];
    series: number[];
  };
  watchHistory: {
    [contentId: string]: {
      type: 'live' | 'vod' | 'series';
      position: number;
      duration: number;
      lastWatched: number; // timestamp
      seriesInfo?: {
        seriesId: number;
        season: number;
        episode: number;
      };
    };
  };
  
  // Actions
  setTheme: (theme: ThemeType) => void;
  toggleParentalControl: () => void;
  setParentalControlPin: (pin: string) => void;
  setInterfaceLanguage: (language: Language) => void;
  setPlaybackLanguage: (language: Language) => void;
  setVideoQuality: (quality: VideoQuality) => void;
  toggleAutoPlayNext: () => void;
  
  // Favorites management
  addToFavorites: (type: 'live' | 'vod' | 'series', id: number) => void;
  removeFromFavorites: (type: 'live' | 'vod' | 'series', id: number) => void;
  isFavorite: (type: 'live' | 'vod' | 'series', id: number) => boolean;
  
  // Watch history management
  updateWatchHistory: (
    contentId: string,
    type: 'live' | 'vod' | 'series',
    position: number,
    duration: number,
    seriesInfo?: {
      seriesId: number;
      season: number;
      episode: number;
    }
  ) => void;
  getWatchPosition: (contentId: string) => number | null;
  clearWatchHistory: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      parentalControlEnabled: false,
      parentalControlPin: '0000',
      interfaceLanguage: 'en',
      preferredPlaybackLanguage: 'en',
      videoQuality: 'auto',
      autoPlayNext: true,
      favorites: {
        live: [],
        vod: [],
        series: [],
      },
      watchHistory: {},
      
      setTheme: (theme) => set({ theme }),
      
      toggleParentalControl: () => 
        set((state) => ({ parentalControlEnabled: !state.parentalControlEnabled })),
      
      setParentalControlPin: (pin) => set({ parentalControlPin: pin }),
      
      setInterfaceLanguage: (language) => set({ interfaceLanguage: language }),
      
      setPlaybackLanguage: (language) => set({ preferredPlaybackLanguage: language }),
      
      setVideoQuality: (quality) => set({ videoQuality: quality }),
      
      toggleAutoPlayNext: () => 
        set((state) => ({ autoPlayNext: !state.autoPlayNext })),
      
      addToFavorites: (type, id) => 
        set((state) => ({
          favorites: {
            ...state.favorites,
            [type]: state.favorites[type].includes(id) 
              ? state.favorites[type] 
              : [...state.favorites[type], id],
          },
        })),
      
      removeFromFavorites: (type, id) => 
        set((state) => ({
          favorites: {
            ...state.favorites,
            [type]: state.favorites[type].filter((itemId) => itemId !== id),
          },
        })),
      
      isFavorite: (type, id) => {
        const { favorites } = get();
        return favorites[type].includes(id);
      },
      
      updateWatchHistory: (contentId, type, position, duration, seriesInfo) => 
        set((state) => ({
          watchHistory: {
            ...state.watchHistory,
            [contentId]: {
              type,
              position,
              duration,
              lastWatched: Date.now(),
              ...(seriesInfo && { seriesInfo }),
            },
          },
        })),
      
      getWatchPosition: (contentId) => {
        const { watchHistory } = get();
        return watchHistory[contentId]?.position || null;
      },
      
      clearWatchHistory: () => set({ watchHistory: {} }),
    }),
    {
      name: 'settings-storage',
    }
  )
);
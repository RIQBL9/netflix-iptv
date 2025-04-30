import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './Navbar';
import { useAuthStore } from '../../store/authStore';
import { useContentStore } from '../../store/contentStore';
import { useSettingsStore } from '../../store/settingsStore';

const MainLayout = () => {
  const { isAuthenticated, user, serverUrl } = useAuthStore();
  const { 
    fetchLiveContent, 
    fetchVodContent, 
    fetchSeriesContent,
    liveCategories,
    vodCategories,
    seriesCategories
  } = useContentStore();
  const { theme } = useSettingsStore();
  
  // Apply theme to body
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'bg-background-dark text-text-primary' : 'bg-background-light text-text-dark';
  }, [theme]);
  
  // Fetch content when authenticated
  useEffect(() => {
    if (isAuthenticated && user && serverUrl) {
      // Only fetch if we don't already have the data
      if (liveCategories.length === 0) {
        fetchLiveContent(serverUrl, user.username, user.password);
      }
      
      if (vodCategories.length === 0) {
        fetchVodContent(serverUrl, user.username, user.password);
      }
      
      if (seriesCategories.length === 0) {
        fetchSeriesContent(serverUrl, user.username, user.password);
      }
    }
  }, [
    isAuthenticated, 
    user, 
    serverUrl, 
    fetchLiveContent, 
    fetchVodContent, 
    fetchSeriesContent,
    liveCategories.length,
    vodCategories.length,
    seriesCategories.length
  ]);
  
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-background-dark' : 'bg-background-light'}`}>
      <Navbar />
      <main className="container mx-auto pt-20 pb-10 px-4">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
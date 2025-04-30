import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';

// Pages
import LoginPage from './pages/auth/LoginPage';
import HomePage from './pages/HomePage';
import LiveTVPage from './pages/live/LiveTVPage';
import MoviesPage from './pages/movies/MoviesPage';
import SeriesPage from './pages/series/SeriesPage';
import ProfilePage from './pages/profile/ProfilePage';
import SettingsPage from './pages/settings/SettingsPage';
import PlayerPage from './pages/PlayerPage';
import SplashScreen from './components/ui/SplashScreen';

// Layout
import MainLayout from './components/layout/MainLayout';

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const initApp = async () => {
      await checkAuth();
      // Simulate splash screen for 1.5 seconds
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    };

    initApp();
  }, [checkAuth]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
        
        {/* Protected routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/live" element={isAuthenticated ? <LiveTVPage /> : <Navigate to="/login" />} />
          <Route path="/movies" element={isAuthenticated ? <MoviesPage /> : <Navigate to="/login" />} />
          <Route path="/series" element={isAuthenticated ? <SeriesPage /> : <Navigate to="/login" />} />
          <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/settings" element={isAuthenticated ? <SettingsPage /> : <Navigate to="/login" />} />
          <Route path="/player/:type/:id" element={isAuthenticated ? <PlayerPage /> : <Navigate to="/login" />} />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
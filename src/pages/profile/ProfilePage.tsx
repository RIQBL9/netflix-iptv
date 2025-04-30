import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaCalendarAlt, FaSignOutAlt, FaTrash, FaClock } from 'react-icons/fa';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useContentStore } from '../../store/contentStore';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { watchHistory, clearWatchHistory } = useSettingsStore();
  const { allLiveStreams, allVodStreams, allSeries } = useContentStore();
  
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [showConfirmClearHistory, setShowConfirmClearHistory] = useState(false);
  
  // Calculate days remaining in subscription
  const getDaysRemaining = () => {
    if (!user?.exp_date) return 'N/A';
    
    const expDate = new Date(user.exp_date);
    const today = new Date();
    
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };
  
  // Get recent watch history items
  const getRecentWatchHistory = () => {
    if (Object.keys(watchHistory).length === 0) return [];
    
    // Convert watchHistory object to array and sort by lastWatched timestamp
    const historyArray = Object.entries(watchHistory)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.lastWatched - a.lastWatched)
      .slice(0, 5); // Get only the 5 most recent items
    
    // Find the actual content items from the content store
    return historyArray.map((item) => {
      if (item.type === 'live') {
        const stream = allLiveStreams.find((s) => s.stream_id.toString() === item.id);
        return {
          id: item.id,
          title: stream?.name || 'Unknown Channel',
          type: 'Live TV',
          lastWatched: new Date(item.lastWatched).toLocaleString(),
          progress: 0,
          link: `/player/live/${item.id}`,
        };
      } else if (item.type === 'vod') {
        const stream = allVodStreams.find((s) => s.stream_id.toString() === item.id);
        return {
          id: item.id,
          title: stream?.name || 'Unknown Movie',
          type: 'Movie',
          lastWatched: new Date(item.lastWatched).toLocaleString(),
          progress: item.position / item.duration,
          link: `/player/movie/${item.id}`,
        };
      } else if (item.type === 'series' && item.seriesInfo) {
        const series = allSeries.find((s) => s.series_id.toString() === item.seriesInfo.seriesId.toString());
        return {
          id: item.id,
          title: `${series?.name || 'Unknown Series'} - S${item.seriesInfo.season}E${item.seriesInfo.episode}`,
          type: 'Series',
          lastWatched: new Date(item.lastWatched).toLocaleString(),
          progress: item.position / item.duration,
          link: `/player/series/${item.seriesInfo.seriesId}`,
        };
      }
      
      return null;
    }).filter(Boolean);
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Handle clear watch history
  const handleClearWatchHistory = () => {
    clearWatchHistory();
    setShowConfirmClearHistory(false);
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-8"
      >
        My Profile
      </motion.h1>
      
      {/* User Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="profile-section"
      >
        <h2 className="profile-heading">Account Information</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-start mb-4">
              <FaUser className="text-primary mt-1 mr-3" />
              <div>
                <div className="text-text-secondary text-sm">Username</div>
                <div className="text-text-primary font-medium">{user?.username || 'N/A'}</div>
              </div>
            </div>
            
            <div className="flex items-start mb-4">
              <FaCalendarAlt className="text-primary mt-1 mr-3" />
              <div>
                <div className="text-text-secondary text-sm">Subscription Expires</div>
                <div className="text-text-primary font-medium">
                  {user?.exp_date ? formatDate(user.exp_date) : 'N/A'}
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-start mb-4">
              <FaClock className="text-primary mt-1 mr-3" />
              <div>
                <div className="text-text-secondary text-sm">Days Remaining</div>
                <div className="text-text-primary font-medium">{getDaysRemaining()}</div>
              </div>
            </div>
            
            {user?.max_connections && (
              <div className="flex items-start mb-4">
                <FaUser className="text-primary mt-1 mr-3" />
                <div>
                  <div className="text-text-secondary text-sm">Max Connections</div>
                  <div className="text-text-primary font-medium">{user.max_connections}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Watch History Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="profile-section"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <button
            onClick={() => setShowConfirmClearHistory(true)}
            className="text-text-secondary hover:text-primary text-sm flex items-center"
          >
            <FaTrash className="mr-1" /> Clear History
          </button>
        </div>
        
        {getRecentWatchHistory().length > 0 ? (
          <div className="space-y-4">
            {getRecentWatchHistory().map((item: any) => (
              <div key={item.id} className="bg-gray-800 rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <div className="text-text-secondary text-sm flex items-center mt-1">
                      <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded mr-2">
                        {item.type}
                      </span>
                      <span>Watched: {item.lastWatched}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => navigate(item.link)}
                    className="btn-primary text-sm py-1 px-3"
                  >
                    Resume
                  </button>
                </div>
                
                {item.progress > 0 && (
                  <div className="mt-2">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${item.progress * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-text-secondary text-xs mt-1">
                      {Math.round(item.progress * 100)}% completed
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-text-secondary text-center py-8">
            No watch history available
          </div>
        )}
      </motion.div>
      
      {/* Logout Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 flex justify-center"
      >
        <button
          onClick={() => setShowConfirmLogout(true)}
          className="btn-secondary flex items-center"
        >
          <FaSignOutAlt className="mr-2" />
          Sign Out
        </button>
      </motion.div>
      
      {/* Logout Confirmation Modal */}
      {showConfirmLogout && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="modal-backdrop" onClick={() => setShowConfirmLogout(false)}></div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="modal-content"
          >
            <h2 className="text-xl font-bold mb-4">Sign Out</h2>
            <p className="text-text-secondary mb-6">
              Are you sure you want to sign out of your account?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmLogout(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="btn-primary"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Clear History Confirmation Modal */}
      {showConfirmClearHistory && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="modal-backdrop" onClick={() => setShowConfirmClearHistory(false)}></div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="modal-content"
          >
            <h2 className="text-xl font-bold mb-4">Clear Watch History</h2>
            <p className="text-text-secondary mb-6">
              Are you sure you want to clear your entire watch history? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmClearHistory(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleClearWatchHistory}
                className="btn-primary"
              >
                Clear History
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
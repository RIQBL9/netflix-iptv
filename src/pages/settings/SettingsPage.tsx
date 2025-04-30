import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaMoon, 
  FaSun, 
  FaLock, 
  FaGlobe, 
  FaVideo, 
  FaPlayCircle,
  FaCheck
} from 'react-icons/fa';
import { useSettingsStore, ThemeType, VideoQuality, Language } from '../../store/settingsStore';

const SettingsPage = () => {
  const { 
    theme, 
    setTheme,
    parentalControlEnabled,
    toggleParentalControl,
    parentalControlPin,
    setParentalControlPin,
    interfaceLanguage,
    setInterfaceLanguage,
    preferredPlaybackLanguage,
    setPlaybackLanguage,
    videoQuality,
    setVideoQuality,
    autoPlayNext,
    toggleAutoPlayNext
  } = useSettingsStore();
  
  const [showPinInput, setShowPinInput] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  
  // Handle theme change
  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
  };
  
  // Handle PIN change
  const handlePinChange = () => {
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setPinError('PIN must be 4 digits');
      return;
    }
    
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    
    setParentalControlPin(newPin);
    setShowPinInput(false);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
  };
  
  // Handle language change
  const handleLanguageChange = (language: Language) => {
    setInterfaceLanguage(language);
  };
  
  // Handle playback language change
  const handlePlaybackLanguageChange = (language: Language) => {
    setPlaybackLanguage(language);
  };
  
  // Handle video quality change
  const handleQualityChange = (quality: VideoQuality) => {
    setVideoQuality(quality);
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-8"
      >
        Settings
      </motion.h1>
      
      {/* Theme Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="profile-section"
      >
        <h2 className="profile-heading flex items-center">
          {theme === 'dark' ? <FaMoon className="mr-2" /> : <FaSun className="mr-2" />}
          Theme
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleThemeChange('dark')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              theme === 'dark'
                ? 'border-primary bg-gray-800'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Dark Theme</span>
              {theme === 'dark' && <FaCheck className="text-primary" />}
            </div>
            <div className="bg-gray-900 h-20 rounded-md flex items-center justify-center">
              <FaMoon className="text-primary text-2xl" />
            </div>
          </button>
          
          <button
            onClick={() => handleThemeChange('light')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              theme === 'light'
                ? 'border-primary bg-gray-800'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Light Theme</span>
              {theme === 'light' && <FaCheck className="text-primary" />}
            </div>
            <div className="bg-gray-200 h-20 rounded-md flex items-center justify-center">
              <FaSun className="text-yellow-500 text-2xl" />
            </div>
          </button>
        </div>
      </motion.div>
      
      {/* Parental Control Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="profile-section"
      >
        <h2 className="profile-heading flex items-center">
          <FaLock className="mr-2" />
          Parental Control
        </h2>
        
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Parental Control</div>
              <div className="text-text-secondary text-sm">
                Restrict access to adult content
              </div>
            </div>
            
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={parentalControlEnabled}
                onChange={toggleParentalControl}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="font-medium mb-2">Parental Control PIN</div>
          <div className="flex items-center space-x-2">
            <div className="bg-gray-800 px-4 py-2 rounded-md flex-1">
              {showPinInput ? '****' : parentalControlPin}
            </div>
            <button
              onClick={() => setShowPinInput(!showPinInput)}
              className="btn-secondary"
            >
              Change PIN
            </button>
          </div>
        </div>
        
        {showPinInput && (
          <div className="bg-gray-800/50 p-4 rounded-md mt-4">
            <div className="form-group">
              <label htmlFor="newPin" className="input-label">
                New PIN (4 digits)
              </label>
              <input
                type="password"
                id="newPin"
                maxLength={4}
                className="input-field"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPin" className="input-label">
                Confirm PIN
              </label>
              <input
                type="password"
                id="confirmPin"
                maxLength={4}
                className="input-field"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
            
            {pinError && (
              <div className="text-red-500 text-sm mb-4">{pinError}</div>
            )}
            
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  setShowPinInput(false);
                  setNewPin('');
                  setConfirmPin('');
                  setPinError('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handlePinChange}
                className="btn-primary"
              >
                Save PIN
              </button>
            </div>
          </div>
        )}
      </motion.div>
      
      {/* Language Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="profile-section"
      >
        <h2 className="profile-heading flex items-center">
          <FaGlobe className="mr-2" />
          Language
        </h2>
        
        <div className="mb-6">
          <div className="font-medium mb-2">Interface Language</div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`p-3 rounded-lg border transition-colors ${
                interfaceLanguage === 'en'
                  ? 'border-primary bg-gray-800'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="flex justify-between items-center">
                <span>English</span>
                {interfaceLanguage === 'en' && <FaCheck className="text-primary" />}
              </div>
            </button>
            
            <button
              onClick={() => handleLanguageChange('tr')}
              className={`p-3 rounded-lg border transition-colors ${
                interfaceLanguage === 'tr'
                  ? 'border-primary bg-gray-800'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="flex justify-between items-center">
                <span>Türkçe</span>
                {interfaceLanguage === 'tr' && <FaCheck className="text-primary" />}
              </div>
            </button>
          </div>
        </div>
        
        <div>
          <div className="font-medium mb-2">Preferred Playback Language</div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handlePlaybackLanguageChange('en')}
              className={`p-3 rounded-lg border transition-colors ${
                preferredPlaybackLanguage === 'en'
                  ? 'border-primary bg-gray-800'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="flex justify-between items-center">
                <span>English</span>
                {preferredPlaybackLanguage === 'en' && <FaCheck className="text-primary" />}
              </div>
            </button>
            
            <button
              onClick={() => handlePlaybackLanguageChange('tr')}
              className={`p-3 rounded-lg border transition-colors ${
                preferredPlaybackLanguage === 'tr'
                  ? 'border-primary bg-gray-800'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="flex justify-between items-center">
                <span>Türkçe</span>
                {preferredPlaybackLanguage === 'tr' && <FaCheck className="text-primary" />}
              </div>
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Playback Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="profile-section"
      >
        <h2 className="profile-heading flex items-center">
          <FaVideo className="mr-2" />
          Playback
        </h2>
        
        <div className="mb-6">
          <div className="font-medium mb-2">Video Quality</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['auto', '480p', '720p', '1080p'] as VideoQuality[]).map((quality) => (
              <button
                key={quality}
                onClick={() => handleQualityChange(quality)}
                className={`p-3 rounded-lg border transition-colors ${
                  videoQuality === quality
                    ? 'border-primary bg-gray-800'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{quality === 'auto' ? 'Auto' : quality}</span>
                  {videoQuality === quality && <FaCheck className="text-primary" />}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto-Play Next Episode</div>
              <div className="text-text-secondary text-sm">
                Automatically play the next episode when the current one ends
              </div>
            </div>
            
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={autoPlayNext}
                onChange={toggleAutoPlayNext}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </motion.div>
      
      {/* About Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="profile-section"
      >
        <h2 className="profile-heading flex items-center">
          <FaPlayCircle className="mr-2" />
          About
        </h2>
        
        <div className="text-center py-4">
          <h3 className="text-xl font-bold text-primary mb-2">IPTV Stream</h3>
          <p className="text-text-secondary">Version 1.0.0</p>
          <p className="text-text-secondary mt-2">© 2025 All Rights Reserved</p>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
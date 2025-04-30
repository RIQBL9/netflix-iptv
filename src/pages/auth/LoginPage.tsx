import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!serverUrl || !username || !password) {
      setFormError('All fields are required');
      return;
    }
    
    // Clear previous errors
    setFormError('');
    
    // Attempt login
    const success = await login(serverUrl, username, password);
    
    if (success) {
      navigate('/');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-dark p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl font-bold text-primary"
          >
            IPTV Stream
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-text-secondary mt-2"
          >
            Sign in to your account
          </motion.p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gray-900 rounded-lg p-8 shadow-xl"
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="serverUrl" className="input-label">
                Server URL (dns:port)
              </label>
              <input
                type="text"
                id="serverUrl"
                className="input-field"
                placeholder="example.com:8080"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="username" className="input-label">
                Username
              </label>
              <input
                type="text"
                id="username"
                className="input-field"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="input-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="input-field"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            {(formError || error) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-900/50 text-red-200 p-3 rounded mb-4"
              >
                {formError || error}
              </motion.div>
            )}
            
            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="spinner w-6 h-6 border-2"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
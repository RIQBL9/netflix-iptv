import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHome, FaTv, FaFilm, FaList, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { useAuthStore } from '../../store/authStore';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Handle scroll event to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const navLinks = [
    { path: '/', label: 'Home', icon: <FaHome /> },
    { path: '/live', label: 'Live TV', icon: <FaTv /> },
    { path: '/movies', label: 'Movies', icon: <FaFilm /> },
    { path: '/series', label: 'Series', icon: <FaList /> },
    { path: '/profile', label: 'Profile', icon: <FaUser /> },
    { path: '/settings', label: 'Settings', icon: <FaCog /> },
  ];
  
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background-dark/90 backdrop-blur-md shadow-lg' : 'bg-gradient-to-b from-background-dark to-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-primary text-2xl font-bold">IPTV Stream</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden">
            {/* Mobile menu button */}
            <button className="text-text-primary">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Mobile menu dropdown (hidden by default) */}
            {/* Implement mobile menu dropdown here */}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
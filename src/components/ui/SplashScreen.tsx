import { motion } from 'framer-motion';

const SplashScreen = () => {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background-dark">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <h1 className="text-5xl font-bold text-primary mb-4">IPTV Stream</h1>
          <p className="text-text-secondary text-lg">Your Premium Streaming Experience</p>
        </motion.div>
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8"
        >
          <div className="spinner mx-auto"></div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
import React, { useState, useEffect } from 'react';
import { FixedSizeGrid } from 'react-window';
import { motion, AnimatePresence } from 'framer-motion';
import ContentCard from './ContentCard';

interface VirtualizedGridProps {
  items: any[];
  type: 'live' | 'movie' | 'series';
  onItemClick: (item: any) => void;
  category?: string;
}

const VirtualizedGrid: React.FC<VirtualizedGridProps> = ({
  items,
  type,
  onItemClick,
  category
}) => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [columnCount, setColumnCount] = useState(5);

  // Update dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });

      // Adjust column count based on screen width
      if (window.innerWidth < 640) {
        setColumnCount(2);
      } else if (window.innerWidth < 1024) {
        setColumnCount(3);
      } else if (window.innerWidth < 1280) {
        setColumnCount(4);
      } else {
        setColumnCount(5);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Calculate row count
  const rowCount = Math.ceil(items.length / columnCount);
  
  // Calculate item dimensions
  const itemWidth = (dimensions.width - 40) / columnCount; // 40px for padding
  const itemHeight = itemWidth * 1.5; // Maintain aspect ratio

  // Cell renderer
  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= items.length) return null;
    
    const item = items[index];
    
    return (
      <div style={style}>
        <motion.div 
          className="p-2"
          whileHover={{ 
            scale: 1.05, 
            zIndex: 10,
            transition: { duration: 0.2 }
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.01 }}
        >
          <ContentCard
            item={item}
            type={type}
            onClick={() => onItemClick(item)}
          />
        </motion.div>
      </div>
    );
  };

  return (
    <div className="p-4">
      {category && (
        <motion.h2 
          className="text-2xl font-bold text-white mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {category}
        </motion.h2>
      )}
      
      <AnimatePresence>
        <FixedSizeGrid
          columnCount={columnCount}
          columnWidth={itemWidth}
          height={Math.min(dimensions.height - 200, rowCount * itemHeight)}
          rowCount={rowCount}
          rowHeight={itemHeight}
          width={dimensions.width - 40}
          className="scrollbar-thin scrollbar-thumb-primary scrollbar-track-transparent"
        >
          {Cell}
        </FixedSizeGrid>
      </AnimatePresence>
    </div>
  );
};

export default VirtualizedGrid;
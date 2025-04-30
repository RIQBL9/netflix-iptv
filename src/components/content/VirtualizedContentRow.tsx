import React from 'react';
import { List, ListRowProps } from 'react-virtualized';
import { motion } from 'framer-motion';
import ContentCard from './ContentCard';

interface VirtualizedContentRowProps {
  title: string;
  items: any[];
  type: 'live' | 'movie' | 'series';
  onItemClick: (item: any) => void;
}

const VirtualizedContentRow: React.FC<VirtualizedContentRowProps> = ({
  title,
  items,
  type,
  onItemClick
}) => {
  // Calculate how many items to show per row based on screen width
  const getItemsPerRow = () => {
    const width = window.innerWidth;
    if (width < 640) return 2; // Small screens
    if (width < 1024) return 3; // Medium screens
    if (width < 1280) return 4; // Large screens
    return 5; // Extra large screens
  };

  const itemsPerRow = getItemsPerRow();
  const rowCount = Math.ceil(items.length / itemsPerRow);
  
  // Row renderer for virtualized list
  const rowRenderer = ({ index, key, style }: ListRowProps) => {
    const startIndex = index * itemsPerRow;
    const rowItems = items.slice(startIndex, startIndex + itemsPerRow);
    
    return (
      <div key={key} style={style} className="flex space-x-2">
        {rowItems.map((item, idx) => (
          <motion.div 
            key={`${item.stream_id || item.id}-${idx}`}
            className="flex-1"
            whileHover={{ 
              scale: 1.05, 
              transition: { duration: 0.2 },
              zIndex: 10
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <ContentCard
              item={item}
              type={type}
              onClick={() => onItemClick(item)}
            />
          </motion.div>
        ))}
        
        {/* Add empty placeholders if row is not full */}
        {Array.from({ length: itemsPerRow - rowItems.length }).map((_, idx) => (
          <div key={`empty-${idx}`} className="flex-1" />
        ))}
      </div>
    );
  };

  return (
    <div className="mb-8">
      <motion.h2 
        className="text-xl font-bold text-white mb-4 px-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {title}
      </motion.h2>
      
      <List
        width={window.innerWidth}
        height={240} // Adjust based on your card height
        rowCount={rowCount}
        rowHeight={220} // Adjust based on your card height + margin
        rowRenderer={rowRenderer}
        overscanRowCount={2}
        className="overflow-visible" // Allow hover effects to overflow
        style={{ overflowX: 'hidden' }}
      />
    </div>
  );
};

export default VirtualizedContentRow;
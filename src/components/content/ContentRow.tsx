import { useRef } from 'react';
import { motion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ContentCard from './ContentCard';
import { LiveStream, VodStream, Series } from '../../store/contentStore';

interface ContentRowProps {
  items: (LiveStream | VodStream | Series | any)[];
  type: 'live' | 'movie' | 'series' | 'mixed';
}

const ContentRow = ({ items, type }: ContentRowProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current: container } = scrollContainerRef;
      const scrollAmount = container.clientWidth * 0.8;
      
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };
  
  if (!items || items.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-800/50 rounded-lg">
        <p className="text-text-secondary">No content available</p>
      </div>
    );
  }
  
  return (
    <div className="relative group">
      {/* Left scroll button */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/70 rounded-full p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Scroll left"
      >
        <FaChevronLeft size={20} />
      </button>
      
      {/* Scrollable content */}
      <div
        ref={scrollContainerRef}
        className="horizontal-scroll"
      >
        {items.map((item, index) => {
          // Determine the content type for mixed rows
          let contentType = type;
          if (type === 'mixed' && 'contentType' in item) {
            contentType = item.contentType;
          }
          
          // Determine the item ID based on content type
          let itemId;
          if (contentType === 'live') {
            itemId = (item as LiveStream).stream_id;
          } else if (contentType === 'movie') {
            itemId = (item as VodStream).stream_id;
          } else if (contentType === 'series') {
            itemId = (item as Series).series_id;
          } else {
            itemId = index;
          }
          
          return (
            <motion.div
              key={`${contentType}-${itemId}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex-shrink-0"
              style={{ width: contentType === 'live' ? '280px' : '200px' }}
            >
              <ContentCard
                item={item}
                type={contentType as 'live' | 'movie' | 'series'}
              />
            </motion.div>
          );
        })}
      </div>
      
      {/* Right scroll button */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/70 rounded-full p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Scroll right"
      >
        <FaChevronRight size={20} />
      </button>
    </div>
  );
};

export default ContentRow;
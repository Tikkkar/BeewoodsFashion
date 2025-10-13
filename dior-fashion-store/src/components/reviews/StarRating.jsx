import React, { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * StarRating Component
 * @param {number} rating - Current rating (0-5)
 * @param {boolean} interactive - Allow user to click and change rating
 * @param {function} onChange - Callback when rating changes
 * @param {number} size - Size of stars in pixels
 * @param {boolean} showLabel - Show rating number label
 */
const StarRating = ({ 
  rating = 0, 
  interactive = false, 
  onChange = () => {}, 
  size = 20,
  showLabel = false 
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleClick = (value) => {
    if (interactive) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (interactive) {
      setHoveredRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoveredRating(0);
    }
  };

  const displayRating = interactive && hoveredRating > 0 ? hoveredRating : rating;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            onMouseLeave={handleMouseLeave}
            className={`
              transition-all duration-150
              ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
              ${!interactive && 'pointer-events-none'}
            `}
            disabled={!interactive}
          >
            <Star
              size={size}
              className={`
                transition-colors duration-150
                ${value <= displayRating 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'fill-none text-gray-300'
                }
                ${interactive && hoveredRating >= value && 'scale-110'}
              `}
            />
          </button>
        ))}
      </div>
      
      {showLabel && (
        <span className="text-sm font-medium text-gray-700">
          {displayRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
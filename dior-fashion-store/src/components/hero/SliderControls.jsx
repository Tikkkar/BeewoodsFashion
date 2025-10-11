import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SliderControls = ({ onPrev, onNext }) => (
  <div className="absolute top-1/2 left-0 right-0 flex justify-between px-4 transform -translate-y-1/2 z-10">
    {/* Nút Previous */}
    <button 
      onClick={onPrev} 
      className="p-3 bg-white/30 text-white rounded-full hover:bg-white/50 transition duration-300 backdrop-blur-sm"
      aria-label="Previous slide"
    >
      <ChevronLeft size={24} />
    </button>
    
    {/* Nút Next */}
    <button 
      onClick={onNext} 
      className="p-3 bg-white/30 text-white rounded-full hover:bg-white/50 transition duration-300 backdrop-blur-sm"
      aria-label="Next slide"
    >
      <ChevronRight size={24} />
    </button>
  </div>
);

export default SliderControls;

import React from 'react';

const SliderDots = ({ count, current, onSelect }) => (
  <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-2 z-10">
    {/* Tạo các chấm chỉ báo dựa trên số lượng slide */}
    {Array.from({ length: count }).map((_, index) => (
      <button
        key={index}
        onClick={() => onSelect(index)}
        aria-label={`Go to slide ${index + 1}`}
        className={`h-2 rounded-full transition-all duration-300 ease-in-out ${
          index === current ? 'bg-white w-8' : 'bg-white/50 w-2'
        }`}
      />
    ))}
  </div>
);

export default SliderDots;

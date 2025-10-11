import React from 'react';
import Button from '../common/Button';

const HeroSlide = ({ slide, isActive }) => (
  <div
    className={`absolute inset-0 transition-opacity duration-1000 ${
      isActive ? 'opacity-100' : 'opacity-0'
    }`}
  >
    <img
      src={slide.image}
      alt={slide.title}
      className="w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col items-center justify-center text-white">
      <h2 className="text-4xl md:text-6xl font-bold tracking-widest uppercase mb-4 text-center">
        {slide.title}
      </h2>
      <p className="text-lg md:text-2xl font-light mb-8 text-center">
        {slide.subtitle}
      </p>
      <Button variant="primary">DISCOVER</Button>
    </div>
  </div>
);

export default HeroSlide;
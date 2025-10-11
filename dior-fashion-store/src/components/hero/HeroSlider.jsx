import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HeroSlider = ({ slides, currentSlide, onNext, onPrev }) => (
  <section className="relative h-[70vh] overflow-hidden bg-black">
    {slides.map((slide, index) => (
      <div
        key={slide.id}
        className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
      >
        <img src={slide.image} alt={slide.title} className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="text-center">
            <h2 className="text-6xl font-light tracking-widest mb-4">{slide.title}</h2>
            <p className="text-xl tracking-widest">{slide.subtitle}</p>
          </div>
        </div>
      </div>
    ))}
    <button onClick={onPrev} className="absolute left-8 top-1/2 -translate-y-1/2 text-white p-3 hover:bg-white/10">
      <ChevronLeft size={32} />
    </button>
    <button onClick={onNext} className="absolute right-8 top-1/2 -translate-y-1/2 text-white p-3 hover:bg-white/10">
      <ChevronRight size={32} />
    </button>
  </section>
);

export default HeroSlider;
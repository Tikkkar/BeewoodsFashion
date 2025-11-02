import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSlider = ({ banners }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [imageLoaded, setImageLoaded] = useState({});

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || !banners?.length) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, banners?.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    // 1. Wrapper ngoài cùng - padding nhỏ hơn trên mobile
    <section className="w-full py-4 md:py-8 bg-white">
      {/* 2. Container chính - chiều cao cố định cho mobile, responsive cho tablet/desktop */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 relative h-[400px] sm:h-[500px] md:h-[60vh] lg:h-[70vh] overflow-hidden rounded-lg md:rounded-xl">
        
        {/* Slides */}
        {banners.map((banner, index) => (
          <div
            key={banner.id || index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Image with Skeleton Loader */}
            <div className="relative w-full h-full">
              {/* Skeleton */}
              {!imageLoaded[index] && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}
              
              <img
                src={banner.image_url || banner.image}
                alt={banner.title || `Slide ${index + 1}`}
                className={`w-full h-full object-cover transition-opacity duration-500 ${
                  imageLoaded[index] ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(prev => ({ ...prev, [index]: true }))}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </div>

            {/* Overlay with Content - gradient mạnh hơn cho mobile */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60">
              <div className="max-w-7xl mx-auto px-3 sm:px-4 h-full flex items-center">
                <div className="text-white max-w-2xl">
                  {/* Subtitle */}
                  {banner.subtitle && (
                    <p className="text-xs sm:text-sm md:text-base font-light tracking-wider md:tracking-widest uppercase mb-1.5 sm:mb-2 md:mb-3 opacity-90">
                      {banner.subtitle}
                    </p>
                  )}
                  
                  {/* Title - kích thước nhỏ hơn trên mobile */}
                  <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-wide uppercase mb-3 sm:mb-4 md:mb-6 leading-tight">
                    {banner.title}
                  </h2>

                  {/* Description - ẩn trên mobile rất nhỏ, hiện từ sm trở lên */}
                  {banner.description && (
                    <p className="hidden sm:block text-sm md:text-base lg:text-lg font-light mb-4 sm:mb-6 md:mb-8 opacity-90 max-w-xl line-clamp-3">
                      {banner.description}
                    </p>
                  )}

                  {/* CTA Button - kích thước phù hợp cho mobile */}
                  {(banner.buttonText || banner.title) && (
                    <Link
                      to={banner.link_url || banner.buttonLink || '/products'}
                      className="inline-block bg-white text-black px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-xs sm:text-sm md:text-base font-medium tracking-wide uppercase hover:bg-black hover:text-white transition-all duration-300 shadow-lg rounded-sm"
                    >
                      {banner.buttonText || 'Xem Ngay'}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows - nhỏ hơn và gần lề hơn trên mobile */}
        {banners.length > 1 && (
          <>
            {/* Previous Button */}
            <button
              onClick={goToPrev}
              className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-1.5 sm:p-2 md:p-3 bg-white/80 hover:bg-white text-black rounded-full transition-all duration-300 shadow-lg hover:scale-110 active:scale-95"
              aria-label="Previous slide"
            >
              <ChevronLeft size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </button>

            {/* Next Button */}
            <button
              onClick={goToNext}
              className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-1.5 sm:p-2 md:p-3 bg-white/80 hover:bg-white text-black rounded-full transition-all duration-300 shadow-lg hover:scale-110 active:scale-95"
              aria-label="Next slide"
            >
              <ChevronRight size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </button>
          </>
        )}

        {/* Dots Indicator - nhỏ hơn và gần đáy hơn trên mobile */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-0 right-0 z-20">
            <div className="flex justify-center items-center gap-1.5 sm:gap-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentSlide
                      ? 'bg-white w-6 sm:w-8 md:w-10 h-1.5 sm:h-2'
                      : 'bg-white/50 hover:bg-white/70 w-1.5 sm:w-2 h-1.5 sm:h-2'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Auto-play Indicator - nhỏ hơn trên mobile */}
        {isAutoPlaying && banners.length > 1 && (
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-20">
            <div className="bg-black/50 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full backdrop-blur-sm">
              Auto
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSlider;
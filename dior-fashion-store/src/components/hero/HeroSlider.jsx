import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ImageOptimized from '../common/Imageoptimized';

const HeroSlider = ({ banners }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [imageLoaded, setImageLoaded] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  // ✅ Detect mobile - Debounced
  useEffect(() => {
    let timeoutId;
    const checkMobile = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 768);
      }, 150);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // ✅ Filter active banners - Memoized
  const activeBanners = useMemo(() => {
    if (!banners || !Array.isArray(banners)) return [];
    if (banners.length === 0) return [];
    
    const now = new Date();
    const filtered = banners.filter(banner => {
      // Assume active if is_active is undefined
      const isActive = banner.is_active !== false;
      if (!isActive) return false;
      
      if (banner.start_date && new Date(banner.start_date) > now) return false;
      if (banner.end_date && new Date(banner.end_date) < now) return false;
      
      return true;
    });
    
    return filtered.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }, [banners]);

  // ✅ Auto-play
  useEffect(() => {
    if (!isAutoPlaying || !activeBanners?.length || activeBanners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, activeBanners?.length]);

  // ✅ Navigation functions - Memoized
  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentSlide((prev) => 
      prev === 0 ? activeBanners.length - 1 : prev - 1
    );
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [activeBanners.length]);

  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [activeBanners.length]);

  // ✅ Helper functions - Memoized
  const getTextPositionClass = useCallback((position) => {
    const positions = {
      left: 'items-start text-left',
      center: 'items-center text-center',
      right: 'items-end text-right',
    };
    return positions[position] || positions.left;
  }, []);

  const getButtonStyleClass = useCallback((style) => {
    const styles = {
      primary: 'bg-black text-white hover:bg-gray-800',
      secondary: 'bg-white text-black hover:bg-gray-100',
      outline: 'bg-transparent border-2 border-white text-white hover:bg-white hover:text-black',
      ghost: 'bg-white/20 backdrop-blur text-white hover:bg-white/30',
    };
    return styles[style] || styles.primary;
  }, []);

  const getAnimationClass = useCallback((animation) => {
    const animations = {
      none: '',
      fade: 'animate-fadeIn',
      slide: 'animate-slideIn',
      zoom: 'animate-zoomIn',
    };
    return animations[animation] || '';
  }, []);

  // ✅ Preload next image
  useEffect(() => {
    if (!activeBanners?.length || activeBanners.length <= 1) return;
    
    const nextIndex = (currentSlide + 1) % activeBanners.length;
    const nextBanner = activeBanners[nextIndex];
    
    if (nextBanner) {
      const imageUrl = isMobile && nextBanner.mobile_image_url 
        ? nextBanner.mobile_image_url 
        : (nextBanner.image_url || nextBanner.image);
      
      if (imageUrl) {
        const img = new Image();
        img.src = imageUrl;
      }
    }
  }, [currentSlide, activeBanners, isMobile]);

  // Early return
  if (!activeBanners || activeBanners.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-4 md:py-8 bg-white">
      <div 
        className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 relative overflow-hidden rounded-lg md:rounded-xl bg-gray-100"
        style={{
          height: activeBanners[0]?.height_mobile ? `${activeBanners[0].height_mobile}px` : '500px',
          '--height-tablet': activeBanners[0]?.height_tablet ? `${activeBanners[0].height_tablet}px` : '600px',
          '--height-desktop': activeBanners[0]?.height_desktop ? `${activeBanners[0].height_desktop}vh` : '70vh',
          '--height-large': activeBanners[0]?.height_large ? `${activeBanners[0].height_large}vh` : '80vh',
        }}
      >
        {/* Responsive height styles */}
        <style>{`
          @media (min-width: 640px) {
            div[style*="--height-tablet"] {
              height: var(--height-tablet) !important;
            }
          }
          @media (min-width: 768px) {
            div[style*="--height-desktop"] {
              height: var(--height-desktop) !important;
            }
          }
          @media (min-width: 1024px) {
            div[style*="--height-large"] {
              height: var(--height-large) !important;
            }
          }
        `}</style>
        
        {/* Slides */}
        {activeBanners.map((banner, index) => {
          const imageUrl = isMobile && banner.mobile_image_url 
            ? banner.mobile_image_url 
            : (banner.image_url || banner.image);

          // Skip rendering if no image URL
          if (!imageUrl) return null;

          return (
            <div
              key={banner.id || index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {/* Image Container */}
              <div className="relative w-full h-full">
                {/* Skeleton loader */}
                {!imageLoaded[index] && (
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                )}
                
                {/* ✅ OPTIMIZED: ImageOptimized with onLoad callback */}
                <ImageOptimized
                  src={imageUrl}
                  alt={banner.title || `Banner ${index + 1}`}
                  priority={index === 0}  // ⚡ First banner = LCP
                  aspectRatio="21/9"
                  className={`w-full h-full transition-opacity duration-500 ${
                    imageLoaded[index] ? 'opacity-100' : 'opacity-0'
                  } ${getAnimationClass(banner.animation)}`}
                  objectFit="cover"
                  sizes="100vw"
                  onLoad={() => setImageLoaded(prev => ({ ...prev, [index]: true }))}
                />
              </div>

              {/* Overlay */}
              {banner.show_content !== false && (
                <div 
                  className="absolute inset-0 bg-black transition-opacity duration-1000"
                  style={{ opacity: banner.overlay_opacity || 0.3 }}
                />
              )}

              {/* Content */}
              {banner.show_content !== false &&
                (banner.show_title !== false ||
                  banner.show_subtitle !== false ||
                  banner.show_button !== false) && (
                  <div className="absolute inset-0">
                    <div
                      className={`max-w-7xl mx-auto px-3 sm:px-4 h-full flex flex-col justify-center ${getTextPositionClass(
                        banner.text_position
                      )}`}
                    >
                      <div className="max-w-2xl">
                        {/* Subtitle */}
                        {banner.show_subtitle !== false && banner.subtitle && (
                          <p
                            className={`${
                              banner.subtitle_size || "text-sm sm:text-base md:text-xl"
                            } font-light tracking-wider md:tracking-widest uppercase mb-1.5 sm:mb-2 md:mb-3 opacity-90`}
                            style={{
                              color: banner.text_color || "#FFFFFF",
                            }}
                          >
                            {banner.subtitle}
                          </p>
                        )}

                        {/* Title */}
                        {banner.show_title !== false && banner.title && (
                          <h2
                            className={`${
                              banner.title_size || "text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
                            } font-bold tracking-wide uppercase mb-3 sm:mb-4 md:mb-6 leading-tight`}
                            style={{
                              color: banner.text_color || "#FFFFFF",
                            }}
                          >
                            {banner.title}
                          </h2>
                        )}

                        {/* Description */}
                        {banner.description && (
                          <p 
                            className="hidden sm:block text-sm md:text-base lg:text-lg font-light mb-4 sm:mb-6 md:mb-8 opacity-90 max-w-xl line-clamp-3"
                            style={{ color: banner.text_color || '#FFFFFF' }}
                          >
                            {banner.description}
                          </p>
                        )}

                        {/* CTA Button */}
                        {banner.show_button !== false && banner.button_text && (
                          <Link
                            to={banner.button_link || banner.link_url || "/products"}
                            className={`inline-block px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-xs sm:text-sm md:text-base font-medium tracking-wide uppercase transition-all duration-300 shadow-lg rounded-sm ${getButtonStyleClass(
                              banner.button_style
                            )}`}
                          >
                            {banner.button_text}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
              )}
            </div>
          );
        })}

        {/* Navigation Arrows */}
        {activeBanners.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-1.5 sm:p-2 md:p-3 bg-white/80 hover:bg-white text-black rounded-full transition-all duration-300 shadow-lg hover:scale-110 active:scale-95"
              aria-label="Previous slide"
            >
              <ChevronLeft size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-1.5 sm:p-2 md:p-3 bg-white/80 hover:bg-white text-black rounded-full transition-all duration-300 shadow-lg hover:scale-110 active:scale-95"
              aria-label="Next slide"
            >
              <ChevronRight size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-0 right-0 z-20">
            <div className="flex justify-center items-center gap-1.5 sm:gap-2">
              {activeBanners.map((_, index) => (
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

        {/* Auto-play Indicator */}
        {isAutoPlaying && activeBanners.length > 1 && (
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
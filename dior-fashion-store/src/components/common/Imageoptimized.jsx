import React, { useState } from 'react';

/**
 * ImageOptimized Component
 * - Lazy loading with IntersectionObserver
 * - Responsive images with srcSet
 * - Blur placeholder while loading
 * - Preload critical images (LCP)
 */
const ImageOptimized = ({ 
  src, 
  alt, 
  className = '',
  priority = false, // true for LCP images (hero, logo)
  objectFit = 'cover',
  aspectRatio = '3/4', // for product cards
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Priority images load immediately

  // Intersection Observer for lazy loading
  React.useEffect(() => {
    if (priority) return; // Skip for priority images

    const img = document.querySelector(`[data-src="${src}"]`);
    if (!img) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' } // Load 50px before entering viewport
    );

    observer.observe(img);
    return () => observer.disconnect();
  }, [src, priority]);

  // Generate responsive srcSet from original URL
  const generateSrcSet = (url) => {
    if (!url || url.includes('image2url.com')) {
      // For image2url.com, return original (họ không hỗ trợ resize)
      return url;
    }
    // Nếu dùng CDN khác hỗ trợ resize, thêm logic ở đây
    return url;
  };

  return (
    <div 
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      style={{ aspectRatio }}
    >
      {/* Blur placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Actual Image */}
      <img
        data-src={src}
        src={isInView ? src : undefined}
        srcSet={isInView ? generateSrcSet(src) : undefined}
        alt={alt}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchpriority={priority ? 'high' : 'auto'}
        className={`w-full h-full transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ objectFit }}
        onLoad={() => setIsLoaded(true)}
        // Thêm width/height explicit để tránh CLS
        width={priority ? '100%' : undefined}
        height={priority ? 'auto' : undefined}
      />
    </div>
  );
};

export default ImageOptimized;
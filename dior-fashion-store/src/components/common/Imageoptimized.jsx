import React, { useState, useEffect, useRef } from 'react';

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
  onLoad, // callback when image loads
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Priority images load immediately
  const imgRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) {
      setIsInView(true); // Load immediately if priority or ref not ready
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { 
        rootMargin: '100px', // Load 100px before entering viewport
        threshold: 0.01 
      }
    );

    observer.observe(imgRef.current);
    
    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
      observer.disconnect();
    };
  }, [priority]);

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
      ref={imgRef}
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      style={{ aspectRatio }}
    >
      {/* Blur placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          src={src}
          srcSet={generateSrcSet(src)}
          alt={alt}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchpriority={priority ? 'high' : 'auto'}
          className={`w-full h-full transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ objectFit }}
          onLoad={() => {
            setIsLoaded(true);
            onLoad?.(); // Call parent callback if provided
          }}
        />
      )}
    </div>
  );
};

export default ImageOptimized;
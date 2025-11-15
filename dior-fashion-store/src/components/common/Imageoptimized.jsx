import React, { useState, useEffect, useRef } from 'react';
import {
  getOptimizedImageUrl,
  getProductImageSrcSet,
  getBannerImageSrcSet,
  getLogoImageSrcSet,
  isSupabaseUrl,
  getImageSizes
} from '../../utils/imageOptimization.js';

/**
 * ImageOptimized Component - With WebP Support
 * - Lazy loading with IntersectionObserver
 * - Responsive images with srcSet
 * - WebP format with fallback
 * - Blur placeholder while loading
 * - Preload critical images (LCP)
 */
const ImageOptimized = ({ 
  src, 
  alt, 
  className = '',
  priority = false, // true for LCP images (hero, banner)
  objectFit = 'cover',
  aspectRatio = '3/4', // for product cards
  type = 'product', // 'product', 'banner', 'logo'
  sizes, // Override default sizes
  onLoad, // callback when image loads
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) {
      setIsInView(true);
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
        rootMargin: '100px', // Load 100px before viewport
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

  // Generate srcSet based on image type
  const getSrcSet = () => {
    if (!isSupabaseUrl(src)) return src;

    switch (type) {
      case 'banner':
        return getBannerImageSrcSet(src);
      case 'logo':
        return getLogoImageSrcSet(src);
      case 'product':
      default:
        return getProductImageSrcSet(src);
    }
  };

  // Get sizes attribute
  const sizesAttr = sizes || getImageSizes(type);

  // Get optimized single image URL (fallback)
  const getOptimizedSrc = () => {
    if (!isSupabaseUrl(src)) return src;

    const widthMap = {
      product: 640,
      banner: 1920,
      logo: 200
    };

    return getOptimizedImageUrl(src, {
      width: widthMap[type],
      quality: 80,
      format: 'webp'
    });
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

      {/* Actual Image with WebP support */}
      {isInView && (
        <picture>
          {/* WebP source for modern browsers */}
          {isSupabaseUrl(src) && (
            <source
              type="image/webp"
              srcSet={getSrcSet()}
              sizes={sizesAttr}
            />
          )}
          
          {/* Fallback img tag */}
          <img
            src={getOptimizedSrc()}
            alt={alt}
            sizes={sizesAttr}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            fetchpriority={priority ? 'high' : 'auto'}
            className={`w-full h-full transition-opacity duration-500 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ objectFit }}
            onLoad={() => {
              setIsLoaded(true);
              onLoad?.();
            }}
            onError={(e) => {
              console.error('Image failed to load:', src);
              // Fallback to original URL if optimized version fails
              if (e.target.src !== src) {
                e.target.src = src;
              }
            }}
          />
        </picture>
      )}
    </div>
  );
};

export default ImageOptimized;